/**
 * Store 订阅 Hook
 * Store subscriptions hook
 *
 * 集中管理所有服务和 MessageHub 订阅，初始化 Zustand stores
 * Centrally manages all service and MessageHub subscriptions, initializes Zustand stores
 */

import { useEffect, useRef } from 'react';
import { Core, HierarchyComponent, PrefabInstanceComponent } from '@esengine/ecs-framework';
import type { MessageHub, EntityStoreService, SceneManagerService } from '@esengine/editor-core';
import { useHierarchyStore } from '../stores/HierarchyStore';
import { useInspectorStore } from '../stores/InspectorStore';
import { getProfilerService } from '../services/getService';
import { SettingsService } from '../services/SettingsService';
import { TauriAPI } from '../api/tauri';
import type { AssetFileInfo } from '../components/inspectors/types';

interface UseStoreSubscriptionsOptions {
    messageHub: MessageHub | null;
    entityStore: EntityStoreService | null;
    sceneManager: SceneManagerService | null;
    enabled: boolean;
}

/**
 * 初始化 store 订阅
 * Initialize store subscriptions
 *
 * 在 App.tsx 中调用一次，集中管理所有订阅
 * Call once in App.tsx to centrally manage all subscriptions
 */
export function useStoreSubscriptions({
    messageHub,
    entityStore,
    sceneManager,
    enabled,
}: UseStoreSubscriptionsOptions): void {
    const initializedRef = useRef(false);

    // ===== HierarchyStore 订阅 | HierarchyStore subscriptions =====
    useEffect(() => {
        if (!enabled || !messageHub || !entityStore) return;

        const {
            setSceneInfo,
            setPrefabEditMode,
            setEntities,
            setSelectedIds,
            setExpandedIds,
        } = useHierarchyStore.getState();

        // 更新场景信息 | Update scene info
        const updateSceneInfo = () => {
            if (sceneManager) {
                const state = sceneManager.getSceneState();
                setSceneInfo({
                    sceneName: state.sceneName,
                    sceneFilePath: state.currentScenePath || null,
                    isModified: state.isModified,
                });
            }
        };

        // 更新实体列表 | Update entity list
        const updateEntities = () => {
            setEntities([...entityStore.getRootEntities()]);
        };

        // 处理实体选择 | Handle entity selection
        const handleEntitySelection = (data: { entity: { id: number } | null }) => {
            if (data.entity) {
                setSelectedIds(new Set([data.entity.id]));
            } else {
                setSelectedIds(new Set());
            }
        };

        // 处理预制体编辑模式 | Handle prefab edit mode
        const handlePrefabEditMode = (data: {
            isActive: boolean;
            prefabPath?: string;
            prefabName?: string;
        }) => {
            if (data.isActive && data.prefabName && data.prefabPath) {
                setPrefabEditMode({
                    isActive: true,
                    prefabName: data.prefabName,
                    prefabPath: data.prefabPath,
                });
            } else {
                setPrefabEditMode(null);
            }
            updateSceneInfo();
        };

        // 初始化 | Initialize
        updateSceneInfo();
        updateEntities();

        // 检查预制体编辑模式状态 | Check prefab edit mode state
        if (sceneManager) {
            const prefabState = (sceneManager as any).getPrefabEditModeState?.();
            if (prefabState?.isActive) {
                setPrefabEditMode({
                    isActive: true,
                    prefabName: prefabState.prefabName,
                    prefabPath: prefabState.prefabPath,
                });
            }
        }

        // 订阅场景事件 | Subscribe to scene events
        const unsubLoaded = messageHub.subscribe('scene:loaded', (data: any) => {
            if (data.sceneName) {
                setSceneInfo({
                    sceneName: data.sceneName,
                    sceneFilePath: data.path || null,
                    isModified: data.isModified || false,
                });
            } else {
                updateSceneInfo();
            }
            updateEntities();
        });
        const unsubNew = messageHub.subscribe('scene:new', () => {
            updateSceneInfo();
            updateEntities();
        });
        const unsubSaved = messageHub.subscribe('scene:saved', updateSceneInfo);
        const unsubModified = messageHub.subscribe('scene:modified', updateSceneInfo);
        const unsubRestored = messageHub.subscribe('scene:restored', updateEntities);

        // 订阅实体事件 | Subscribe to entity events
        const unsubAdd = messageHub.subscribe('entity:added', updateEntities);
        const unsubRemove = messageHub.subscribe('entity:removed', updateEntities);
        const unsubClear = messageHub.subscribe('entities:cleared', updateEntities);
        const unsubSelect = messageHub.subscribe('entity:selected', handleEntitySelection);
        const unsubReordered = messageHub.subscribe('entity:reordered', updateEntities);
        const unsubReparented = messageHub.subscribe('entity:reparented', updateEntities);

        // 订阅预制体事件 | Subscribe to prefab events
        const unsubPrefabEditMode = messageHub.subscribe('prefab:editMode:changed', handlePrefabEditMode);
        const unsubPrefabEnter = messageHub.subscribe('prefab:editMode:enter', updateEntities);
        const unsubPrefabExit = messageHub.subscribe('prefab:editMode:exit', updateEntities);

        return () => {
            unsubLoaded();
            unsubNew();
            unsubSaved();
            unsubModified();
            unsubRestored();
            unsubAdd();
            unsubRemove();
            unsubClear();
            unsubSelect();
            unsubReordered();
            unsubReparented();
            unsubPrefabEditMode();
            unsubPrefabEnter();
            unsubPrefabExit();
        };
    }, [enabled, messageHub, entityStore, sceneManager]);

    // ===== HierarchyStore 远程订阅 | HierarchyStore remote subscriptions =====
    useEffect(() => {
        if (!enabled) return;

        const profilerService = getProfilerService();
        if (!profilerService) return;

        const {
            setIsRemoteConnected,
            setRemoteEntities,
            setRemoteSceneName,
        } = useHierarchyStore.getState();

        // 初始状态 | Initial state
        setIsRemoteConnected(profilerService.isConnected());

        const unsubscribe = profilerService.subscribe((data) => {
            const connected = profilerService.isConnected();
            setIsRemoteConnected(connected);

            if (connected && data.entities && data.entities.length > 0) {
                setRemoteEntities((prev) => {
                    if (prev.length !== data.entities!.length) {
                        return data.entities!;
                    }
                    const hasChanged = data.entities!.some((entity, index) => {
                        const prevEntity = prev[index];
                        return !prevEntity ||
                            prevEntity.id !== entity.id ||
                            prevEntity.name !== entity.name ||
                            prevEntity.componentCount !== entity.componentCount;
                    });
                    return hasChanged ? data.entities! : prev;
                });

                // 获取远程场景名称 | Get remote scene name
                const currentRemoteName = useHierarchyStore.getState().remoteSceneName;
                if (!currentRemoteName && data.entities[0]) {
                    profilerService.requestEntityDetails(data.entities[0].id);
                }
            } else if (!connected) {
                setRemoteEntities([]);
                setRemoteSceneName(null);
            }
        });

        // 监听实体详情获取远程场景名 | Listen for entity details to get remote scene name
        const handleEntityDetails = ((event: CustomEvent) => {
            const details = event.detail;
            if (details?.sceneName) {
                setRemoteSceneName(details.sceneName);
            }
        }) as EventListener;

        window.addEventListener('profiler:entity-details', handleEntityDetails);

        return () => {
            unsubscribe();
            window.removeEventListener('profiler:entity-details', handleEntityDetails);
        };
    }, [enabled]);

    // ===== InspectorStore 订阅 | InspectorStore subscriptions =====
    useEffect(() => {
        if (!enabled || !messageHub) return;

        const {
            setEntityTarget,
            setRemoteEntityTarget,
            setAssetFileTarget,
            setExtensionTarget,
            clearTarget,
            updateRemoteEntityDetails,
            incrementComponentVersion,
            setDecimalPlaces,
        } = useInspectorStore.getState();

        // 初始化设置 | Initialize settings
        const settings = SettingsService.getInstance();
        setDecimalPlaces(settings.get<number>('inspector.decimalPlaces', 4));

        // 设置变更处理 | Handle settings change
        const handleSettingsChanged = (event: Event) => {
            const customEvent = event as CustomEvent;
            const changedSettings = customEvent.detail;
            if ('inspector.decimalPlaces' in changedSettings) {
                setDecimalPlaces(changedSettings['inspector.decimalPlaces']);
            }
        };

        // 实体选择处理 | Handle entity selection
        const handleEntitySelection = (data: { entity: any | null }) => {
            if (data.entity) {
                setEntityTarget(data.entity);
            } else {
                clearTarget();
            }
        };

        // 远程实体选择处理 | Handle remote entity selection
        const handleRemoteEntitySelection = (data: { entity: any }) => {
            setRemoteEntityTarget(data.entity);
            const profilerService = getProfilerService();
            if (profilerService && data.entity?.id !== undefined) {
                profilerService.requestEntityDetails(data.entity.id);
            }
        };

        // 实体详情处理 | Handle entity details
        const handleEntityDetails = (event: Event) => {
            const customEvent = event as CustomEvent;
            const details = customEvent.detail;
            if (details?.id !== undefined) {
                updateRemoteEntityDetails(details.id, details);
            }
        };

        // 扩展选择处理 | Handle extension selection
        const handleExtensionSelection = (data: { data: unknown }) => {
            setExtensionTarget(data.data as Record<string, unknown>);
        };

        // 资产文件选择处理 | Handle asset file selection
        const handleAssetFileSelection = async (data: { fileInfo: AssetFileInfo }) => {
            const fileInfo = data.fileInfo;

            if (fileInfo.isDirectory) {
                setAssetFileTarget(fileInfo);
                return;
            }

            const textExtensions = [
                'txt', 'json', 'md', 'ts', 'tsx', 'js', 'jsx', 'css', 'html', 'xml',
                'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'log', 'btree', 'ecs',
                'mat', 'shader', 'tilemap', 'tileset'
            ];
            const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
            const isTextFile = fileInfo.extension && textExtensions.includes(fileInfo.extension.toLowerCase());
            const isImageFile = fileInfo.extension && imageExtensions.includes(fileInfo.extension.toLowerCase());

            if (isTextFile) {
                try {
                    const content = await TauriAPI.readFileContent(fileInfo.path);
                    setAssetFileTarget(fileInfo, content);
                } catch (error) {
                    console.error('Failed to read file content:', error);
                    setAssetFileTarget(fileInfo);
                }
            } else if (isImageFile) {
                setAssetFileTarget(fileInfo, undefined, true);
            } else {
                setAssetFileTarget(fileInfo);
            }
        };

        // 场景恢复处理 | Handle scene restored
        const handleSceneRestored = () => {
            clearTarget();
        };

        // 订阅 | Subscribe
        window.addEventListener('settings:changed', handleSettingsChanged);
        window.addEventListener('profiler:entity-details', handleEntityDetails);

        const unsubEntitySelect = messageHub.subscribe('entity:selected', handleEntitySelection);
        const unsubSceneRestored = messageHub.subscribe('scene:restored', handleSceneRestored);
        const unsubRemoteSelect = messageHub.subscribe('remote-entity:selected', handleRemoteEntitySelection);
        const unsubNodeSelect = messageHub.subscribe('behavior-tree:node-selected', handleExtensionSelection);
        const unsubAssetFileSelect = messageHub.subscribe('asset-file:selected', handleAssetFileSelection);
        const unsubComponentAdded = messageHub.subscribe('component:added', incrementComponentVersion);
        const unsubComponentRemoved = messageHub.subscribe('component:removed', incrementComponentVersion);
        const unsubPropertyChanged = messageHub.subscribe('component:property:changed', incrementComponentVersion);

        return () => {
            window.removeEventListener('settings:changed', handleSettingsChanged);
            window.removeEventListener('profiler:entity-details', handleEntityDetails);
            unsubEntitySelect();
            unsubSceneRestored();
            unsubRemoteSelect();
            unsubNodeSelect();
            unsubAssetFileSelect();
            unsubComponentAdded();
            unsubComponentRemoved();
            unsubPropertyChanged();
        };
    }, [enabled, messageHub]);
}
