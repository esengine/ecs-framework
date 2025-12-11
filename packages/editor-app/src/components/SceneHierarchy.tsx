import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Entity, Core, HierarchySystem, HierarchyComponent, EntityTags, isFolder, PrefabSerializer, ComponentRegistry, getComponentInstanceTypeName, PrefabInstanceComponent } from '@esengine/ecs-framework';
import type { PrefabData, ComponentType } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, SceneManagerService, CommandManager, EntityCreationRegistry, EntityCreationTemplate, PrefabService } from '@esengine/editor-core';
import { useLocale } from '../hooks/useLocale';
import * as LucideIcons from 'lucide-react';
import {
    Box, Wifi, Search, Plus, Trash2, Monitor, Globe, ChevronRight, ChevronDown,
    Eye, Star, Lock, Settings, Filter, Folder, Sun, Cloud, Mountain, Flag,
    SquareStack, FolderPlus, PackageOpen, Unlink, RotateCcw, Upload, ExternalLink, X
} from 'lucide-react';
import type { RemoteEntity } from '../services/tokens';
import { getProfilerService } from '../services/getService';
import { confirm } from '@tauri-apps/plugin-dialog';
import { CreateEntityCommand, DeleteEntityCommand, ReparentEntityCommand, DropPosition } from '../application/commands/entity';
import { InstantiatePrefabCommand, ApplyPrefabCommand, RevertPrefabCommand, BreakPrefabLinkCommand } from '../application/commands/prefab';
import { TauriAPI } from '../api/tauri';
import '../styles/SceneHierarchy.css';

function getIconComponent(iconName: string | undefined, size: number = 14): React.ReactNode {
    if (!iconName) return <Box size={size} />;

    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>;
    const IconComponent = icons[iconName];
    if (IconComponent) {
        return <IconComponent size={size} />;
    }

    return <Box size={size} />;
}

const categoryIconMap: Record<string, string> = {
    'rendering': 'Image',
    'ui': 'LayoutGrid',
    'effects': 'Sparkles',
    'physics': 'Box',
    'audio': 'Volume2',
    'basic': 'Plus',
    'other': 'MoreHorizontal',
};

// 实体类型到图标的映射
const entityTypeIcons: Record<string, React.ReactNode> = {
    'World': <Mountain size={14} className="entity-type-icon world" />,
    'Folder': <Folder size={14} className="entity-type-icon folder" />,
    'DirectionalLight': <Sun size={14} className="entity-type-icon light" />,
    'SkyLight': <Sun size={14} className="entity-type-icon light" />,
    'SkyAtmosphere': <Cloud size={14} className="entity-type-icon atmosphere" />,
    'VolumetricCloud': <Cloud size={14} className="entity-type-icon cloud" />,
    'StaticMeshActor': <SquareStack size={14} className="entity-type-icon mesh" />,
    'PlayerStart': <Flag size={14} className="entity-type-icon player" />,
    'ExponentialHeightFog': <Cloud size={14} className="entity-type-icon fog" />,
};

type ViewMode = 'local' | 'remote';
type SortColumn = 'name' | 'type';
type SortDirection = 'asc' | 'desc';

interface SceneHierarchyProps {
    entityStore: EntityStoreService;
    messageHub: MessageHub;
    commandManager: CommandManager;
    isProfilerMode?: boolean;
}

interface EntityNode {
    entity: Entity;
    children: EntityNode[];
    depth: number;
    bIsFolder: boolean;
    hasChildren: boolean;
}

/**
 * 拖放指示器位置
 */
enum DropIndicator {
    NONE = 'none',
    BEFORE = 'before',
    INSIDE = 'inside',
    AFTER = 'after'
}

export function SceneHierarchy({ entityStore, messageHub, commandManager, isProfilerMode = false }: SceneHierarchyProps) {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [remoteEntities, setRemoteEntities] = useState<RemoteEntity[]>([]);
    const [isRemoteConnected, setIsRemoteConnected] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>(isProfilerMode ? 'remote' : 'local');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [sceneName, setSceneName] = useState<string>('Untitled');
    const [remoteSceneName, setRemoteSceneName] = useState<string | null>(null);
    const [sceneFilePath, setSceneFilePath] = useState<string | null>(null);
    const [isSceneModified, setIsSceneModified] = useState<boolean>(false);
    const [prefabEditMode, setPrefabEditMode] = useState<{
        isActive: boolean;
        prefabName: string;
        prefabPath: string;
    } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entityId: number | null } | null>(null);
    const [draggedEntityId, setDraggedEntityId] = useState<number | null>(null);
    const [dropTarget, setDropTarget] = useState<{ entityId: number; indicator: DropIndicator } | null>(null);
    const [pluginTemplates, setPluginTemplates] = useState<EntityCreationTemplate[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set([-1])); // -1 is scene root
    const [sortColumn, setSortColumn] = useState<SortColumn>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [editingEntityId, setEditingEntityId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');
    const { t, locale } = useLocale();

    // Ref for auto-scrolling to selected item | 选中项自动滚动 ref
    const contentRef = useRef<HTMLDivElement>(null);
    const selectedItemRef = useRef<HTMLDivElement>(null);

    const isShowingRemote = viewMode === 'remote' && isRemoteConnected;
    const selectedId = selectedIds.size > 0 ? Array.from(selectedIds)[0] : null;

    // Auto-scroll to selected item when selection changes | 选中项变化时自动滚动
    useEffect(() => {
        if (selectedItemRef.current && contentRef.current) {
            const container = contentRef.current;
            const item = selectedItemRef.current;

            const containerRect = container.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();

            // 检查项是否在可见区域之外 | Check if item is outside visible area
            const isAbove = itemRect.top < containerRect.top;
            const isBelow = itemRect.bottom > containerRect.bottom;

            if (isAbove || isBelow) {
                item.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }
    }, [selectedId]);

    /**
     * 构建层级树结构
     */
    const buildEntityTree = useCallback((rootEntities: Entity[]): EntityNode[] => {
        const scene = Core.scene;
        if (!scene) return [];

        const buildNode = (entity: Entity, depth: number): EntityNode => {
            const hierarchy = entity.getComponent(HierarchyComponent);
            const childIds = hierarchy?.childIds ?? [];
            const bIsEntityFolder = isFolder(entity.tag);

            const children: EntityNode[] = [];
            for (const childId of childIds) {
                const childEntity = scene.findEntityById(childId);
                if (childEntity) {
                    children.push(buildNode(childEntity, depth + 1));
                }
            }

            return {
                entity,
                children,
                depth,
                bIsFolder: bIsEntityFolder,
                hasChildren: children.length > 0
            };
        };

        return rootEntities.map((entity) => buildNode(entity, 1));
    }, []);

    /**
     * 扁平化树为带深度信息的列表（用于渲染）
     */
    const flattenTree = useCallback((nodes: EntityNode[], expandedSet: Set<number>): EntityNode[] => {
        const result: EntityNode[] = [];

        const traverse = (nodeList: EntityNode[]) => {
            for (const node of nodeList) {
                result.push(node);

                const bIsExpanded = expandedSet.has(node.entity.id);
                if (bIsExpanded && node.children.length > 0) {
                    traverse(node.children);
                }
            }
        };

        traverse(nodes);
        return result;
    }, []);

    /**
     * 层级树和扁平化列表
     */
    const entityTree = useMemo(() => buildEntityTree(entities), [entities, buildEntityTree]);
    const flattenedEntities = useMemo(
        () => expandedIds.has(-1) ? flattenTree(entityTree, expandedIds) : [],
        [entityTree, expandedIds, flattenTree]
    );

    // Get entity creation templates from plugins
    useEffect(() => {
        const updateTemplates = () => {
            const registry = Core.services.resolve(EntityCreationRegistry);
            if (registry) {
                setPluginTemplates(registry.getAll());
            }
        };

        updateTemplates();

        const unsubInstalled = messageHub.subscribe('plugin:installed', updateTemplates);
        const unsubUninstalled = messageHub.subscribe('plugin:uninstalled', updateTemplates);

        return () => {
            unsubInstalled();
            unsubUninstalled();
        };
    }, [messageHub]);

    // Subscribe to scene changes
    useEffect(() => {
        const sceneManager = Core.services.resolve(SceneManagerService);

        const updateSceneInfo = () => {
            if (sceneManager) {
                const state = sceneManager.getSceneState();
                setSceneName(state.sceneName);
                setIsSceneModified(state.isModified);
                setSceneFilePath(state.currentScenePath || null);
            }
        };

        updateSceneInfo();

        const unsubLoaded = messageHub.subscribe('scene:loaded', (data: any) => {
            if (data.sceneName) {
                setSceneName(data.sceneName);
                setSceneFilePath(data.path || null);
                setIsSceneModified(data.isModified || false);
            } else {
                updateSceneInfo();
            }
        });
        const unsubNew = messageHub.subscribe('scene:new', () => {
            updateSceneInfo();
        });
        const unsubSaved = messageHub.subscribe('scene:saved', () => {
            updateSceneInfo();
        });
        const unsubModified = messageHub.subscribe('scene:modified', updateSceneInfo);

        // 监听预制体编辑模式变化 | Subscribe to prefab edit mode changes
        const unsubPrefabEditMode = messageHub.subscribe('prefab:editMode:changed', (data: {
            isActive: boolean;
            prefabPath?: string;
            prefabName?: string;
        }) => {
            if (data.isActive && data.prefabName && data.prefabPath) {
                setPrefabEditMode({
                    isActive: true,
                    prefabName: data.prefabName,
                    prefabPath: data.prefabPath
                });
            } else {
                setPrefabEditMode(null);
            }
            // 刷新场景状态 | Update scene info
            updateSceneInfo();
        });

        // 初始化时检查预制体编辑模式状态 | Check prefab edit mode state on init
        if (sceneManager) {
            const prefabState = sceneManager.getPrefabEditModeState?.();
            if (prefabState?.isActive) {
                setPrefabEditMode({
                    isActive: true,
                    prefabName: prefabState.prefabName,
                    prefabPath: prefabState.prefabPath
                });
            }
        }

        return () => {
            unsubLoaded();
            unsubNew();
            unsubSaved();
            unsubModified();
            unsubPrefabEditMode();
        };
    }, [messageHub]);

    // Subscribe to local entity changes
    useEffect(() => {
        const updateEntities = () => {
            setEntities([...entityStore.getRootEntities()]);
        };

        const handleSelection = (data: { entity: Entity | null }) => {
            if (data.entity) {
                setSelectedIds(new Set([data.entity.id]));
            } else {
                setSelectedIds(new Set());
            }
        };

        updateEntities();

        const unsubAdd = messageHub.subscribe('entity:added', updateEntities);
        const unsubRemove = messageHub.subscribe('entity:removed', updateEntities);
        const unsubClear = messageHub.subscribe('entities:cleared', updateEntities);
        const unsubSelect = messageHub.subscribe('entity:selected', handleSelection);
        const unsubSceneLoaded = messageHub.subscribe('scene:loaded', updateEntities);
        const unsubSceneNew = messageHub.subscribe('scene:new', updateEntities);
        const unsubSceneRestored = messageHub.subscribe('scene:restored', updateEntities);
        const unsubReordered = messageHub.subscribe('entity:reordered', updateEntities);
        const unsubReparented = messageHub.subscribe('entity:reparented', updateEntities);
        // 预制体编辑模式进入/退出时刷新实体列表 | Refresh entities on prefab edit mode enter/exit
        const unsubPrefabEnter = messageHub.subscribe('prefab:editMode:enter', updateEntities);
        const unsubPrefabExit = messageHub.subscribe('prefab:editMode:exit', updateEntities);

        return () => {
            unsubAdd();
            unsubRemove();
            unsubClear();
            unsubSelect();
            unsubSceneLoaded();
            unsubSceneNew();
            unsubSceneRestored();
            unsubReordered();
            unsubReparented();
            unsubPrefabEnter();
            unsubPrefabExit();
        };
    }, [entityStore, messageHub]);

    // Subscribe to remote entity data from ProfilerService
    useEffect(() => {
        const profilerService = getProfilerService();

        if (!profilerService) {
            return;
        }

        const initiallyConnected = profilerService.isConnected();
        setIsRemoteConnected(initiallyConnected);

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

                if (!remoteSceneName && data.entities.length > 0 && data.entities[0]) {
                    profilerService.requestEntityDetails(data.entities[0].id);
                }
            } else if (!connected) {
                setRemoteEntities([]);
                setRemoteSceneName(null);
            }
        });

        return () => unsubscribe();
    }, [remoteSceneName]);

    // Listen for entity details to get remote scene name
    useEffect(() => {
        const handleEntityDetails = ((event: CustomEvent) => {
            const details = event.detail;
            if (details && details.sceneName) {
                setRemoteSceneName(details.sceneName);
            }
        }) as EventListener;

        window.addEventListener('profiler:entity-details', handleEntityDetails);
        return () => window.removeEventListener('profiler:entity-details', handleEntityDetails);
    }, []);

    const handleEntityClick = (entity: Entity, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(entity.id)) {
                    next.delete(entity.id);
                } else {
                    next.add(entity.id);
                }
                return next;
            });
        } else {
            setSelectedIds(new Set([entity.id]));
            entityStore.selectEntity(entity);
        }
    };

    const handleDragStart = useCallback((e: React.DragEvent, entityId: number) => {
        setDraggedEntityId(entityId);
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setData('text/plain', entityId.toString());
        // 添加实体拖拽标识，用于 ContentBrowser 识别
        // Add entity drag identifier for ContentBrowser recognition
        e.dataTransfer.setData('entity-id', entityId.toString());

        // 获取实体名称用于显示
        const entity = entityStore.getEntity(entityId);
        if (entity) {
            e.dataTransfer.setData('entity-name', entity.name);
        }
    }, [entityStore]);

    /**
     * 根据鼠标位置计算拖放指示器位置
     * 上20%区域 = BEFORE, 中间60% = INSIDE, 下20% = AFTER
     * 所有实体都支持作为父节点接收子节点
     */
    const calculateDropIndicator = useCallback((e: React.DragEvent, _targetNode: EntityNode): DropIndicator => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;

        if (y < height * 0.2) {
            return DropIndicator.BEFORE;
        } else if (y > height * 0.8) {
            return DropIndicator.AFTER;
        } else {
            return DropIndicator.INSIDE;
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, targetNode: EntityNode) => {
        e.preventDefault();

        // 检查是否为外部资产拖放（预制体）| Check for external asset drop (prefab)
        const assetPath = e.dataTransfer.types.includes('asset-path');
        if (assetPath) {
            // 外部资产拖放，允许放置 | External asset drop, allow drop
            e.dataTransfer.dropEffect = 'copy';
            setDropTarget({ entityId: targetNode.entity.id, indicator: DropIndicator.INSIDE });
            return;
        }

        e.dataTransfer.dropEffect = 'move';

        // 不能拖放到自己
        if (draggedEntityId === targetNode.entity.id) {
            setDropTarget(null);
            return;
        }

        // 检查是否拖到自己的子节点
        const scene = Core.scene;
        if (scene && draggedEntityId !== null) {
            const hierarchySystem = scene.getSystem(HierarchySystem);
            const draggedEntity = scene.findEntityById(draggedEntityId);
            if (draggedEntity && hierarchySystem?.isAncestorOf(draggedEntity, targetNode.entity)) {
                setDropTarget(null);
                return;
            }
        }

        const indicator = calculateDropIndicator(e, targetNode);
        setDropTarget({ entityId: targetNode.entity.id, indicator });
    }, [draggedEntityId, calculateDropIndicator]);

    const handleDragLeave = useCallback(() => {
        setDropTarget(null);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent, targetNode: EntityNode) => {
        e.preventDefault();
        e.stopPropagation(); // 防止事件冒泡到容器 | Prevent event from bubbling to container

        // 检查是否为外部资产拖放（预制体）| Check for external asset drop (prefab)
        const assetPath = e.dataTransfer.getData('asset-path');
        if (assetPath && assetPath.toLowerCase().endsWith('.prefab')) {
            setDropTarget(null);
            try {
                // 读取预制体文件 | Read prefab file
                const prefabJson = await TauriAPI.readFileContent(assetPath);
                const prefabData = PrefabSerializer.deserialize(prefabJson);

                // 创建实例化命令 | Create instantiate command
                const command = new InstantiatePrefabCommand(
                    entityStore,
                    messageHub,
                    prefabData,
                    {
                        parent: targetNode.entity,
                        trackInstance: true
                    }
                );
                commandManager.execute(command);

                // 自动展开目标节点 | Auto expand target node
                setExpandedIds(prev => new Set([...prev, targetNode.entity.id]));

                console.log(`[SceneHierarchy] Prefab instantiated: ${prefabData.metadata.name}`);
            } catch (error) {
                console.error('[SceneHierarchy] Failed to instantiate prefab:', error);
            }
            return;
        }

        if (draggedEntityId === null || !dropTarget) {
            setDraggedEntityId(null);
            setDropTarget(null);
            return;
        }

        const scene = Core.scene;
        if (!scene) return;

        const draggedEntity = scene.findEntityById(draggedEntityId);
        if (!draggedEntity) return;

        // 转换 DropIndicator 到 DropPosition
        let dropPosition: DropPosition;
        switch (dropTarget.indicator) {
            case DropIndicator.BEFORE:
                dropPosition = DropPosition.BEFORE;
                break;
            case DropIndicator.INSIDE:
                dropPosition = DropPosition.INSIDE;
                // 自动展开目标节点
                setExpandedIds(prev => new Set([...prev, targetNode.entity.id]));
                break;
            case DropIndicator.AFTER:
                dropPosition = DropPosition.AFTER;
                break;
            default:
                dropPosition = DropPosition.AFTER;
        }

        const command = new ReparentEntityCommand(
            entityStore,
            messageHub,
            draggedEntity,
            targetNode.entity,
            dropPosition
        );
        commandManager.execute(command);

        setDraggedEntityId(null);
        setDropTarget(null);
    }, [draggedEntityId, dropTarget, entityStore, messageHub, commandManager]);

    const handleDragEnd = useCallback(() => {
        setDraggedEntityId(null);
        setDropTarget(null);
    }, []);

    /**
     * 处理容器级别的拖放（用于根级别预制体实例化）
     * Handle container-level drop (for root-level prefab instantiation)
     */
    const handleContainerDragOver = useCallback((e: React.DragEvent) => {
        // 只处理外部资产拖放 | Only handle external asset drops
        const hasAssetPath = e.dataTransfer.types.includes('asset-path');
        if (hasAssetPath) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    }, []);

    const handleContainerDrop = useCallback(async (e: React.DragEvent) => {
        const assetPath = e.dataTransfer.getData('asset-path');
        if (!assetPath || !assetPath.toLowerCase().endsWith('.prefab')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        try {
            // 读取预制体文件 | Read prefab file
            const prefabJson = await TauriAPI.readFileContent(assetPath);
            const prefabData = PrefabSerializer.deserialize(prefabJson);

            // 在根级别实例化（无父实体）| Instantiate at root level (no parent)
            const command = new InstantiatePrefabCommand(
                entityStore,
                messageHub,
                prefabData,
                {
                    trackInstance: true
                }
            );
            commandManager.execute(command);

            console.log(`[SceneHierarchy] Prefab instantiated at root: ${prefabData.metadata.name}`);
        } catch (error) {
            console.error('[SceneHierarchy] Failed to instantiate prefab:', error);
        }
    }, [entityStore, messageHub, commandManager]);

    const handleRemoteEntityClick = (entity: RemoteEntity) => {
        setSelectedIds(new Set([entity.id]));

        const profilerService = getProfilerService();
        if (profilerService) {
            profilerService.requestEntityDetails(entity.id);
        }

        messageHub.publish('remote-entity:selected', {
            entity: {
                id: entity.id,
                name: entity.name,
                enabled: entity.enabled,
                componentCount: entity.componentCount,
                componentTypes: entity.componentTypes
            }
        });
    };

    const handleCreateEntity = () => {
        const entityCount = entityStore.getAllEntities().length;
        const entityName = `Entity ${entityCount + 1}`;

        const command = new CreateEntityCommand(
            entityStore,
            messageHub,
            entityName
        );
        commandManager.execute(command);
    };

    const handleDeleteEntity = async () => {
        if (!selectedId) return;

        const entity = entityStore.getEntity(selectedId);
        if (!entity) return;

        // 计算子节点数量 | Count child entities
        const hierarchy = entity.getComponent(HierarchyComponent);
        const childCount = hierarchy?.childIds?.length || 0;

        // 根据子节点数量显示不同提示 | Show different message based on child count
        const message = childCount > 0
            ? t('hierarchy.deleteConfirmWithChildren', { name: entity.name, count: childCount })
            : t('hierarchy.deleteConfirm', { name: entity.name });

        const confirmed = await confirm(
            message,
            {
                title: t('hierarchy.deleteEntity'),
                kind: 'warning'
            }
        );

        if (confirmed) {
            const command = new DeleteEntityCommand(
                entityStore,
                messageHub,
                entity
            );
            commandManager.execute(command);
        }
    };

    /**
     * 开始重命名实体 | Start renaming entity
     */
    const handleStartRename = useCallback(() => {
        if (!selectedId) return;
        const entity = entityStore.getEntity(selectedId);
        if (!entity) return;

        setEditingEntityId(selectedId);
        setEditingName(entity.name || '');
    }, [selectedId, entityStore]);

    /**
     * 确认重命名 | Confirm rename
     */
    const handleConfirmRename = useCallback(() => {
        if (!editingEntityId) return;

        const entity = entityStore.getEntity(editingEntityId);
        if (!entity) {
            setEditingEntityId(null);
            setEditingName('');
            return;
        }

        const trimmedName = editingName.trim();
        if (trimmedName) {
            // 有效名称，更新 | Valid name, update
            entity.name = trimmedName;
            messageHub.publish('entity:renamed', { entityId: editingEntityId, name: entity.name });
            messageHub.publish('scene:modified', {});
        }
        // 空名称时保持原名（不做任何改变）| Empty name keeps original (no change)

        setEditingEntityId(null);
        setEditingName('');
    }, [editingEntityId, editingName, entityStore, messageHub]);

    /**
     * 取消重命名 | Cancel rename
     */
    const handleCancelRename = useCallback(() => {
        setEditingEntityId(null);
        setEditingName('');
    }, []);

    /**
     * 复制实体 | Duplicate entity
     */
    const handleDuplicateEntity = useCallback(() => {
        if (!selectedId) return;

        const entity = entityStore.getEntity(selectedId);
        if (!entity) return;

        const scene = Core.scene;
        if (!scene) return;

        // 创建新实体 | Create new entity
        const newEntity = scene.createEntity(`${entity.name} Copy`);

        // 复制组件 | Copy components
        for (const component of entity.components) {
            const ComponentClass = component.constructor as ComponentType;
            const newComponent = new ComponentClass();

            // 复制组件属性 | Copy component properties
            const keys = Object.keys(component);
            for (const key of keys) {
                if (key !== 'entity' && key !== 'id') {
                    try {
                        (newComponent as any)[key] = (component as any)[key];
                    } catch { /* ignore read-only */ }
                }
            }

            newEntity.addComponent(newComponent);
        }

        entityStore.addEntity(newEntity);
        entityStore.selectEntity(newEntity);
        messageHub.publish('entity:added', { entity: newEntity });
        messageHub.publish('scene:modified', {});
    }, [selectedId, entityStore, messageHub]);

    /**
     * 创建预制体 - 通过 MessageHub 发布请求事件
     * Create prefab - publishes request event via MessageHub
     */
    const handleCreatePrefab = () => {
        if (!selectedId) return;

        const entity = entityStore.getEntity(selectedId);
        if (!entity) return;

        // 发布预制体创建请求事件，由 App 层处理实际创建
        // Publish prefab creation request event, handled by App layer
        messageHub.publish('prefab:requestCreate', {
            entityId: entity.id,
            entityName: entity.name,
            suggestedName: entity.name
        });
    };

    /**
     * 检查实体是否为预制体实例
     * Check if entity is a prefab instance
     */
    const isPrefabInstance = useCallback((entityId: number): boolean => {
        const entity = entityStore.getEntity(entityId);
        if (!entity) return false;
        const prefabComp = entity.getComponent(PrefabInstanceComponent);
        return !!prefabComp?.isRoot;
    }, [entityStore]);

    /**
     * 获取预制体实例信息
     * Get prefab instance info
     */
    const getPrefabInstanceInfo = useCallback((entityId: number) => {
        const entity = entityStore.getEntity(entityId);
        if (!entity) return null;
        const prefabComp = entity.getComponent(PrefabInstanceComponent);
        if (!prefabComp?.isRoot) return null;

        const prefabPath = prefabComp.sourcePrefabPath;
        const prefabName = prefabPath
            ? prefabPath.split(/[/\\]/).pop()?.replace('.prefab', '') || 'Prefab'
            : 'Unknown';

        return {
            name: prefabName,
            path: prefabPath,
            hasModifications: prefabComp.modifiedProperties.length > 0,
            modificationCount: prefabComp.modifiedProperties.length
        };
    }, [entityStore]);

    /**
     * 打开预制体编辑模式
     * Open prefab edit mode
     */
    const handleOpenPrefab = useCallback((entityId: number) => {
        const info = getPrefabInstanceInfo(entityId);
        if (!info?.path) return;

        messageHub.publish('prefab:editMode:enter', {
            prefabPath: info.path
        });
    }, [messageHub, getPrefabInstanceInfo]);

    /**
     * 在内容浏览器中选择预制体资产
     * Select prefab asset in content browser
     */
    const handleSelectPrefabAsset = useCallback((entityId: number) => {
        const info = getPrefabInstanceInfo(entityId);
        if (!info?.path) return;

        messageHub.publish('content-browser:select', {
            path: info.path
        });
    }, [messageHub, getPrefabInstanceInfo]);

    /**
     * 应用预制体修改
     * Apply prefab modifications
     */
    const handleApplyPrefab = useCallback(async (entityId: number) => {
        const entity = entityStore.getEntity(entityId);
        if (!entity) return;

        const info = getPrefabInstanceInfo(entityId);
        if (!info) return;

        const confirmed = await confirm(
            t('inspector.prefab.applyConfirm', { name: info.name }),
            {
                title: t('inspector.prefab.applyTitle', {}, 'Apply to Prefab'),
                kind: 'info'
            }
        );

        if (!confirmed) return;

        const prefabService = Core.services.resolve(PrefabService);
        if (prefabService) {
            const command = new ApplyPrefabCommand(prefabService, messageHub, entity);
            commandManager.execute(command);
        }
    }, [entityStore, messageHub, commandManager, t, getPrefabInstanceInfo]);

    /**
     * 还原预制体实例
     * Revert prefab instance
     */
    const handleRevertPrefab = useCallback(async (entityId: number) => {
        const entity = entityStore.getEntity(entityId);
        if (!entity) return;

        const confirmed = await confirm(
            t('inspector.prefab.revertConfirm'),
            {
                title: t('inspector.prefab.revertTitle', {}, 'Revert to Prefab'),
                kind: 'warning'
            }
        );

        if (!confirmed) return;

        const prefabService = Core.services.resolve(PrefabService);
        if (prefabService) {
            const command = new RevertPrefabCommand(prefabService, messageHub, entity);
            commandManager.execute(command);
        }
    }, [entityStore, messageHub, commandManager, t]);

    /**
     * 断开预制体链接（解包）
     * Break prefab link (unpack)
     */
    const handleUnpackPrefab = useCallback(async (entityId: number) => {
        const entity = entityStore.getEntity(entityId);
        if (!entity) return;

        const confirmed = await confirm(
            t('inspector.prefab.unpackConfirm'),
            {
                title: t('inspector.prefab.unpackTitle', {}, 'Unpack Prefab'),
                kind: 'warning'
            }
        );

        if (!confirmed) return;

        const prefabService = Core.services.resolve(PrefabService);
        if (prefabService) {
            const command = new BreakPrefabLinkCommand(prefabService, messageHub, entity);
            commandManager.execute(command);
        }
    }, [entityStore, messageHub, commandManager, t]);

    const handleContextMenu = (e: React.MouseEvent, entityId: number | null) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, entityId });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    useEffect(() => {
        const handleClick = () => closeContextMenu();
        if (contextMenu) {
            window.addEventListener('click', handleClick);
            return () => window.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 忽略正在编辑时的按键 | Ignore keys while editing
            if (editingEntityId) {
                if (e.key === 'Escape') {
                    handleCancelRename();
                } else if (e.key === 'Enter') {
                    handleConfirmRename();
                }
                return;
            }

            // 忽略输入框中的按键 | Ignore keys in input fields
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
                return;
            }

            if (isShowingRemote) return;

            // Delete - 删除实体
            if (e.key === 'Delete' && selectedId) {
                e.preventDefault();
                handleDeleteEntity();
                return;
            }

            // F2 - 重命名实体
            if (e.key === 'F2' && selectedId) {
                e.preventDefault();
                handleStartRename();
                return;
            }

            // Ctrl+D - 复制实体
            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
                e.preventDefault();
                handleDuplicateEntity();
                return;
            }

            // 方向键导航 | Arrow key navigation
            if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && flattenedEntities.length > 0) {
                e.preventDefault();
                const currentIndex = selectedId
                    ? flattenedEntities.findIndex(n => n.entity.id === selectedId)
                    : -1;

                let newIndex: number;
                if (e.key === 'ArrowUp') {
                    newIndex = currentIndex <= 0 ? flattenedEntities.length - 1 : currentIndex - 1;
                } else {
                    newIndex = currentIndex >= flattenedEntities.length - 1 ? 0 : currentIndex + 1;
                }

                const newEntity = flattenedEntities[newIndex]?.entity;
                if (newEntity) {
                    setSelectedIds(new Set([newEntity.id]));
                    entityStore.selectEntity(newEntity);
                    messageHub.publish('entity:selected', { entity: newEntity });
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, isShowingRemote, editingEntityId, flattenedEntities, entityStore, messageHub, handleStartRename, handleConfirmRename, handleCancelRename, handleDuplicateEntity]);

    const toggleExpand = useCallback((entityId: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(entityId)) {
                next.delete(entityId);
            } else {
                next.add(entityId);
            }
            return next;
        });
    }, []);

    /**
     * 创建文件夹实体
     */
    const handleCreateFolder = useCallback(() => {
        const entityCount = entityStore.getAllEntities().length;
        const folderName = `Folder ${entityCount + 1}`;

        const scene = Core.scene;
        if (!scene) return;

        const entity = scene.createEntity(folderName);
        entity.tag = EntityTags.FOLDER;

        // 添加 HierarchyComponent 支持层级结构
        entity.addComponent(new HierarchyComponent());

        entityStore.addEntity(entity);
        entityStore.selectEntity(entity);
        messageHub.publish('entity:added', { entity });
        messageHub.publish('scene:modified', {});
    }, [entityStore, messageHub, locale]);

    const handleSortClick = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    /**
     * 获取实体类型显示名称
     * 使用 @ECSComponent 装饰器指定的名称，避免代码压缩导致名称丢失
     * Uses @ECSComponent decorator name to avoid minification issues
     */
    const getEntityType = useCallback((entity: Entity): string => {
        if (isFolder(entity.tag)) {
            return 'Folder';
        }

        // 检查是否为预制体实例 | Check if prefab instance
        const prefabComp = entity.getComponent(PrefabInstanceComponent);
        if (prefabComp?.isRoot) {
            // 返回预制体名称 | Return prefab name
            const prefabPath = prefabComp.sourcePrefabPath;
            const prefabName = prefabPath
                ? prefabPath.split(/[/\\]/).pop()?.replace('.prefab', '') || 'Prefab'
                : 'Prefab';
            return prefabName;
        }

        const components = entity.components || [];
        // 过滤掉 PrefabInstanceComponent，获取实际的组件类型
        // Filter out PrefabInstanceComponent to get actual component type
        const realComponents = components.filter(c => !(c instanceof PrefabInstanceComponent));
        if (realComponents.length > 0) {
            const firstComponent = realComponents[0];
            if (firstComponent) {
                return getComponentInstanceTypeName(firstComponent);
            }
        }
        return 'Entity';
    }, []);

    /**
     * 检查实体是否为预制体实例（用于显示图标）
     * Check if entity is prefab instance (for icon display)
     */
    const isEntityPrefabInstance = useCallback((entity: Entity): boolean => {
        const prefabComp = entity.getComponent(PrefabInstanceComponent);
        return !!prefabComp?.isRoot;
    }, []);

    /**
     * 获取实体类型图标
     */
    const getEntityIcon = useCallback((entity: Entity): React.ReactNode => {
        if (isFolder(entity.tag)) {
            return <Folder size={14} className="entity-type-icon folder" />;
        }

        // 预制体实例使用预制体图标 | Prefab instances use prefab icon
        const prefabComp = entity.getComponent(PrefabInstanceComponent);
        if (prefabComp?.isRoot) {
            return <PackageOpen size={14} className="entity-type-icon prefab-instance" />;
        }

        const entityType = getEntityType(entity);
        return entityTypeIcons[entityType] || <Box size={14} className="entity-type-icon default" />;
    }, [getEntityType]);

    // Filter entities based on search query
    const filterRemoteEntities = (entityList: RemoteEntity[]): RemoteEntity[] => {
        if (!searchQuery.trim()) return entityList;

        const query = searchQuery.toLowerCase();
        return entityList.filter((entity) => {
            const name = entity.name;
            const id = entity.id.toString();

            if (name.toLowerCase().includes(query) || id.includes(query)) {
                return true;
            }

            if (Array.isArray(entity.componentTypes)) {
                return entity.componentTypes.some((type) =>
                    type.toLowerCase().includes(query)
                );
            }

            return false;
        });
    };

    const filterLocalEntities = (entityList: Entity[]): Entity[] => {
        if (!searchQuery.trim()) return entityList;

        const query = searchQuery.toLowerCase();
        return entityList.filter((entity) => {
            const name = entity.name || '';
            const id = entity.id.toString();
            return name.toLowerCase().includes(query) || id.includes(query);
        });
    };

    const showRemoteIndicator = isShowingRemote && remoteEntities.length > 0;
    // 显示名称优先级：预制体编辑模式 > 远程场景 > 本地场景
    // Display name priority: Prefab edit mode > Remote scene > Local scene
    const displaySceneName = prefabEditMode?.isActive
        ? prefabEditMode.prefabName
        : (isShowingRemote && remoteSceneName ? remoteSceneName : sceneName);

    const totalCount = isShowingRemote ? remoteEntities.length : entityStore.getAllEntities().length;
    const selectedCount = selectedIds.size;

    return (
        <div className={`scene-hierarchy outliner ${prefabEditMode?.isActive ? 'prefab-edit-mode' : ''}`}>
            {/* Prefab Edit Mode Header | 预制体编辑模式头部 */}
            {prefabEditMode?.isActive && (
                <div className="prefab-edit-header">
                    <PackageOpen size={14} />
                    <span>{t('hierarchy.editingPrefab') || 'Editing Prefab'}: {prefabEditMode.prefabName}</span>
                </div>
            )}

            {/* Toolbar */}
            <div className="outliner-toolbar">
                <div className="outliner-toolbar-left">
                    <button
                        className="outliner-filter-btn"
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                    >
                        <Filter size={14} />
                        <ChevronDown size={10} />
                    </button>
                </div>

                <div className="outliner-search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder={t('hierarchy.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape' && searchQuery) {
                                e.preventDefault();
                                e.stopPropagation();
                                setSearchQuery('');
                            }
                        }}
                    />
                    {searchQuery ? (
                        <button
                            className="search-clear-btn"
                            onClick={() => setSearchQuery('')}
                            title={t('common.clear') || 'Clear'}
                        >
                            <X size={12} />
                        </button>
                    ) : (
                        <ChevronDown size={12} className="search-dropdown" />
                    )}
                </div>

                <div className="outliner-toolbar-right">
                    {!isShowingRemote && (
                        <>
                            <button
                                className="outliner-action-btn"
                                onClick={handleCreateEntity}
                                title={t('hierarchy.createEntity')}
                            >
                                <Plus size={14} />
                            </button>
                            <button
                                className="outliner-action-btn"
                                onClick={handleCreateFolder}
                                title={t('hierarchy.createFolder')}
                            >
                                <FolderPlus size={14} />
                            </button>
                        </>
                    )}
                    <button
                        className="outliner-action-btn"
                        title={t('hierarchy.settings')}
                    >
                        <Settings size={14} />
                    </button>
                </div>

                {isRemoteConnected && !isProfilerMode && (
                    <div className="view-mode-toggle">
                        <button
                            className={`mode-btn ${viewMode === 'local' ? 'active' : ''}`}
                            onClick={() => setViewMode('local')}
                            title={t('hierarchy.localScene')}
                        >
                            <Monitor size={14} />
                        </button>
                        <button
                            className={`mode-btn ${viewMode === 'remote' ? 'active' : ''}`}
                            onClick={() => setViewMode('remote')}
                            title={t('hierarchy.remoteEntities')}
                        >
                            <Globe size={14} />
                        </button>
                    </div>
                )}

                {showRemoteIndicator && (
                    <div className="remote-indicator" title="Showing remote entities">
                        <Wifi size={12} />
                    </div>
                )}
            </div>

            {/* Column Headers */}
            <div className="outliner-header">
                <div className="outliner-header-icons">
                    <span title={t('hierarchy.visibility')}><Eye size={12} className="header-icon" /></span>
                    <span title={t('hierarchy.favorite')}><Star size={12} className="header-icon" /></span>
                    <span title={t('hierarchy.lock')}><Lock size={12} className="header-icon" /></span>
                </div>
                <div
                    className={`outliner-header-label ${sortColumn === 'name' ? 'sorted' : ''}`}
                    onClick={() => handleSortClick('name')}
                >
                    <span>Item Label</span>
                    {sortColumn === 'name' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                </div>
                <div
                    className={`outliner-header-type ${sortColumn === 'type' ? 'sorted' : ''}`}
                    onClick={() => handleSortClick('type')}
                >
                    <span>Type</span>
                    {sortColumn === 'type' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                </div>
            </div>

            {/* Entity List */}
            <div
                ref={contentRef}
                className="outliner-content"
                onContextMenu={(e) => !isShowingRemote && handleContextMenu(e, null)}
                onDragOver={handleContainerDragOver}
                onDrop={handleContainerDrop}
            >
                {isShowingRemote ? (
                    // Remote entities view (flat list)
                    remoteEntities.length === 0 ? (
                        <div className="empty-state">
                            <Box size={32} strokeWidth={1.5} className="empty-icon" />
                            <div className="empty-hint">
                                {t('hierarchy.remoteEmpty')}
                            </div>
                        </div>
                    ) : (
                        <div className="outliner-list">
                            {filterRemoteEntities(remoteEntities).map((entity) => (
                                <div
                                    key={entity.id}
                                    className={`outliner-item ${selectedIds.has(entity.id) ? 'selected' : ''} ${!entity.enabled ? 'disabled' : ''}`}
                                    onClick={() => handleRemoteEntityClick(entity)}
                                >
                                    <div className="outliner-item-icons">
                                        <Eye size={12} className="item-icon visibility" />
                                    </div>
                                    <div className="outliner-item-content">
                                        <span className="outliner-item-expand" />
                                        {entityTypeIcons[entity.componentTypes?.[0] || 'Entity'] || <Box size={14} className="entity-type-icon default" />}
                                        <span className="outliner-item-name">{entity.name}</span>
                                    </div>
                                    <div className="outliner-item-type">
                                        {entity.componentTypes?.[0] || 'Entity'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    // Local entities view (hierarchical tree)
                    entities.length === 0 ? (
                        <div className="empty-state">
                            <Box size={32} strokeWidth={1.5} className="empty-icon" />
                            <div className="empty-hint">
                                {t('hierarchy.emptyHint')}
                            </div>
                        </div>
                    ) : (
                        <div className="outliner-list">
                            {/* World/Scene Root or Prefab Root */}
                            <div
                                className={`outliner-item world-item ${expandedIds.has(-1) ? 'expanded' : ''} ${prefabEditMode?.isActive ? 'prefab-root' : ''}`}
                                onClick={() => toggleExpand(-1)}
                            >
                                <div className="outliner-item-icons">
                                    <Eye size={12} className="item-icon visibility" />
                                </div>
                                <div className="outliner-item-content">
                                    <span
                                        className="outliner-item-expand"
                                        onClick={(e) => { e.stopPropagation(); toggleExpand(-1); }}
                                    >
                                        {expandedIds.has(-1) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    </span>
                                    {prefabEditMode?.isActive ? (
                                        <PackageOpen size={14} className="entity-type-icon prefab" />
                                    ) : (
                                        <Mountain size={14} className="entity-type-icon world" />
                                    )}
                                    <span className="outliner-item-name">
                                        {prefabEditMode?.isActive
                                            ? `${displaySceneName}`
                                            : `${displaySceneName} (Editor)`}
                                    </span>
                                </div>
                                <div className="outliner-item-type">
                                    {prefabEditMode?.isActive ? 'Prefab' : 'World'}
                                </div>
                            </div>

                            {/* Hierarchical Entity Items */}
                            {flattenedEntities.map((node) => {
                                const { entity, depth, hasChildren, bIsFolder } = node;
                                const bIsExpanded = expandedIds.has(entity.id);
                                const bIsSelected = selectedIds.has(entity.id);
                                const bIsDragging = draggedEntityId === entity.id;
                                const currentDropTarget = dropTarget?.entityId === entity.id ? dropTarget : null;
                                const bIsPrefabInstance = isEntityPrefabInstance(entity);

                                // 计算缩进 (每层 16px，加上基础 8px)
                                const indent = 8 + depth * 16;

                                // 构建 drop indicator 类名
                                let dropIndicatorClass = '';
                                if (currentDropTarget) {
                                    dropIndicatorClass = `drop-${currentDropTarget.indicator}`;
                                }

                                return (
                                    <div
                                        key={entity.id}
                                        ref={bIsSelected ? selectedItemRef : undefined}
                                        className={`outliner-item ${bIsSelected ? 'selected' : ''} ${bIsDragging ? 'dragging' : ''} ${dropIndicatorClass} ${bIsPrefabInstance ? 'prefab-instance' : ''}`}
                                        style={{ paddingLeft: `${indent}px` }}
                                        draggable
                                        onClick={(e) => handleEntityClick(entity, e)}
                                        onDragStart={(e) => handleDragStart(e, entity.id)}
                                        onDragOver={(e) => handleDragOver(e, node)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, node)}
                                        onDragEnd={handleDragEnd}
                                        onContextMenu={(e) => {
                                            e.stopPropagation();
                                            handleEntityClick(entity, e);
                                            handleContextMenu(e, entity.id);
                                        }}
                                    >
                                        <div className="outliner-item-icons">
                                            <Eye size={12} className="item-icon visibility" />
                                        </div>
                                        <div className="outliner-item-content">
                                            {/* 展开/折叠按钮 */}
                                            {hasChildren || bIsFolder ? (
                                                <span
                                                    className="outliner-item-expand clickable"
                                                    onClick={(e) => { e.stopPropagation(); toggleExpand(entity.id); }}
                                                >
                                                    {bIsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                </span>
                                            ) : (
                                                <span className="outliner-item-expand" />
                                            )}
                                            {getEntityIcon(entity)}
                                            {editingEntityId === entity.id ? (
                                                <input
                                                    className="outliner-item-name-input"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onBlur={handleConfirmRename}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleConfirmRename();
                                                        if (e.key === 'Escape') handleCancelRename();
                                                        e.stopPropagation();
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    className="outliner-item-name"
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingEntityId(entity.id);
                                                        setEditingName(entity.name || '');
                                                    }}
                                                >
                                                    {entity.name || `Entity ${entity.id}`}
                                                </span>
                                            )}
                                            {/* 预制体实例徽章 | Prefab instance badge */}
                                            {bIsPrefabInstance && (
                                                <span className="prefab-badge" title={t('inspector.prefab.instance', {}, 'Prefab Instance')}>
                                                    P
                                                </span>
                                            )}
                                        </div>
                                        <div className="outliner-item-type">{getEntityType(entity)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>

            {/* Status Bar */}
            <div className="outliner-status">
                <span>{totalCount} {t('hierarchy.actors')}</span>
                {selectedCount > 0 && (
                    <span> ({selectedCount} {t('hierarchy.selected')})</span>
                )}
            </div>

            {contextMenu && !isShowingRemote && (
                <ContextMenuWithSubmenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    locale={locale}
                    t={t}
                    entityId={contextMenu.entityId}
                    pluginTemplates={pluginTemplates}
                    isPrefabInstance={contextMenu.entityId ? isPrefabInstance(contextMenu.entityId) : false}
                    prefabInstanceInfo={contextMenu.entityId ? getPrefabInstanceInfo(contextMenu.entityId) : null}
                    onCreateEmpty={() => { handleCreateEntity(); closeContextMenu(); }}
                    onCreateFolder={() => { handleCreateFolder(); closeContextMenu(); }}
                    onCreateFromTemplate={async (template) => {
                        await template.create(contextMenu.entityId ?? undefined);
                        closeContextMenu();
                    }}
                    onCreatePrefab={() => { handleCreatePrefab(); closeContextMenu(); }}
                    onOpenPrefab={() => { if (contextMenu.entityId) handleOpenPrefab(contextMenu.entityId); closeContextMenu(); }}
                    onSelectPrefabAsset={() => { if (contextMenu.entityId) handleSelectPrefabAsset(contextMenu.entityId); closeContextMenu(); }}
                    onApplyPrefab={() => { if (contextMenu.entityId) handleApplyPrefab(contextMenu.entityId); closeContextMenu(); }}
                    onRevertPrefab={() => { if (contextMenu.entityId) handleRevertPrefab(contextMenu.entityId); closeContextMenu(); }}
                    onUnpackPrefab={() => { if (contextMenu.entityId) handleUnpackPrefab(contextMenu.entityId); closeContextMenu(); }}
                    onRename={() => { handleStartRename(); closeContextMenu(); }}
                    onDuplicate={() => { handleDuplicateEntity(); closeContextMenu(); }}
                    onDelete={() => { handleDeleteEntity(); closeContextMenu(); }}
                    onClose={closeContextMenu}
                />
            )}
        </div>
    );
}

interface PrefabInstanceMenuInfo {
    name: string;
    path: string;
    hasModifications: boolean;
    modificationCount: number;
}

interface ContextMenuWithSubmenuProps {
    x: number;
    y: number;
    locale: string;
    t: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
    entityId: number | null;
    pluginTemplates: EntityCreationTemplate[];
    isPrefabInstance: boolean;
    prefabInstanceInfo: PrefabInstanceMenuInfo | null;
    onCreateEmpty: () => void;
    onCreateFolder: () => void;
    onCreateFromTemplate: (template: EntityCreationTemplate) => void;
    onCreatePrefab: () => void;
    onOpenPrefab: () => void;
    onSelectPrefabAsset: () => void;
    onApplyPrefab: () => void;
    onRevertPrefab: () => void;
    onUnpackPrefab: () => void;
    onRename: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onClose: () => void;
}

function ContextMenuWithSubmenu({
    x, y, locale, t, entityId, pluginTemplates,
    isPrefabInstance, prefabInstanceInfo,
    onCreateEmpty, onCreateFolder, onCreateFromTemplate, onCreatePrefab,
    onOpenPrefab, onSelectPrefabAsset, onApplyPrefab, onRevertPrefab, onUnpackPrefab,
    onRename, onDuplicate, onDelete
}: ContextMenuWithSubmenuProps) {
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const [submenuPosition, setSubmenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    // 实体创建模板的 label 本地化映射
    const getCategoryLabel = (category: string) => {
        // Map category keys to translation keys
        const categoryKeyMap: Record<string, string> = {
            'rendering': 'hierarchy.categories.rendering',
            'ui': 'hierarchy.categories.ui',
            'effects': 'hierarchy.categories.effects',
            'physics': 'hierarchy.categories.physics',
            'audio': 'hierarchy.categories.audio',
            'basic': 'hierarchy.categories.basic',
            'other': 'hierarchy.categories.other'
        };
        const key = categoryKeyMap[category];
        return key ? t(key) : category;
    };

    const getEntityTemplateLabel = (label: string) => {
        // Map template labels to translation keys
        const templateKeyMap: Record<string, string> = {
            'Sprite': 'hierarchy.entityTemplates.sprite',
            'Animated Sprite': 'hierarchy.entityTemplates.animatedSprite',
            '创建 Tilemap': 'hierarchy.entityTemplates.tilemap',
            'Camera 2D': 'hierarchy.entityTemplates.camera2d',
            '创建粒子效果': 'hierarchy.entityTemplates.particleEffect'
        };
        const key = templateKeyMap[label];
        return key ? t(key) : label;
    };

    const templatesByCategory = pluginTemplates.reduce((acc, template) => {
        const cat = template.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(template);
        return acc;
    }, {} as Record<string, EntityCreationTemplate[]>);

    Object.values(templatesByCategory).forEach(templates => {
        templates.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    });

    const handleSubmenuEnter = (category: string, e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setSubmenuPosition({ x: rect.right - 4, y: rect.top });
        setActiveSubmenu(category);
    };

    const categoryOrder = ['rendering', 'ui', 'effects', 'physics', 'audio', 'basic', 'other'];
    const sortedCategories = Object.entries(templatesByCategory).sort(([a], [b]) => {
        const orderA = categoryOrder.indexOf(a);
        const orderB = categoryOrder.indexOf(b);
        return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
    });

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={{ position: 'fixed', left: x, top: y, zIndex: 1000 }}
        >
            <button onClick={onCreateEmpty}>
                <Plus size={12} />
                <span>{t('hierarchy.createEmptyEntity')}</span>
            </button>

            <button onClick={onCreateFolder}>
                <Folder size={12} />
                <span>{t('hierarchy.createFolder')}</span>
            </button>

            {sortedCategories.length > 0 && <div className="context-menu-divider" />}

            {sortedCategories.map(([category, templates]) => (
                <div
                    key={category}
                    className="context-menu-item-with-submenu"
                    onMouseEnter={(e) => handleSubmenuEnter(category, e)}
                    onMouseLeave={() => setActiveSubmenu(null)}
                >
                    <button>
                        {getIconComponent(categoryIconMap[category], 12)}
                        <span>{getCategoryLabel(category)}</span>
                        <ChevronRight size={12} className="submenu-arrow" />
                    </button>
                    {activeSubmenu === category && (
                        <div
                            className="context-submenu"
                            style={{ left: submenuPosition.x, top: submenuPosition.y }}
                            onMouseEnter={() => setActiveSubmenu(category)}
                        >
                            {templates.map((template) => (
                                <button key={template.id} onClick={() => onCreateFromTemplate(template)}>
                                    {getIconComponent(template.icon as string, 12)}
                                    <span>{getEntityTemplateLabel(template.label)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {entityId && (
                <>
                    <div className="context-menu-divider" />

                    {/* Prefab Instance Actions | 预制体实例操作 */}
                    {isPrefabInstance && prefabInstanceInfo && (
                        <>
                            <div className="context-menu-section-header">
                                <PackageOpen size={10} />
                                <span>{prefabInstanceInfo.name}</span>
                            </div>
                            <button onClick={onOpenPrefab}>
                                <ExternalLink size={12} />
                                <span>{t('inspector.prefab.open', {}, 'Open Prefab')}</span>
                            </button>
                            <button onClick={onSelectPrefabAsset}>
                                <Folder size={12} />
                                <span>{t('inspector.prefab.selectAsset', {}, 'Select Prefab Asset')}</span>
                            </button>
                            <button
                                onClick={onApplyPrefab}
                                disabled={!prefabInstanceInfo.hasModifications}
                                className={prefabInstanceInfo.hasModifications ? 'context-menu-highlight' : ''}
                            >
                                <Upload size={12} />
                                <span>
                                    {t('inspector.prefab.applyTo', { name: prefabInstanceInfo.name }, `Apply to '${prefabInstanceInfo.name}'`)}
                                    {prefabInstanceInfo.hasModifications && ` (${prefabInstanceInfo.modificationCount})`}
                                </span>
                            </button>
                            <button
                                onClick={onRevertPrefab}
                                disabled={!prefabInstanceInfo.hasModifications}
                            >
                                <RotateCcw size={12} />
                                <span>{t('inspector.prefab.revertTo', {}, 'Revert to Prefab')}</span>
                            </button>
                            <button onClick={onUnpackPrefab} className="context-menu-warning">
                                <Unlink size={12} />
                                <span>{t('inspector.prefab.unpack', {}, 'Unpack Prefab')}</span>
                            </button>
                            <div className="context-menu-divider" />
                        </>
                    )}

                    {/* Create Prefab - only for non-prefab instances | 创建预制体 - 仅对非预制体实例 */}
                    {!isPrefabInstance && (
                        <button onClick={onCreatePrefab}>
                            <PackageOpen size={12} />
                            <span>{t('hierarchy.createPrefab', {}, 'Create Prefab')}</span>
                        </button>
                    )}

                    <div className="context-menu-divider" />

                    {/* 编辑操作 | Edit operations */}
                    <button onClick={onRename}>
                        <LucideIcons.Pencil size={12} />
                        <span>{t('hierarchy.renameEntity')}</span>
                        <span className="context-menu-shortcut">F2</span>
                    </button>
                    <button onClick={onDuplicate}>
                        <LucideIcons.Copy size={12} />
                        <span>{t('hierarchy.duplicateEntity')}</span>
                        <span className="context-menu-shortcut">Ctrl+D</span>
                    </button>

                    <div className="context-menu-divider" />
                    <button onClick={onDelete} className="context-menu-danger">
                        <Trash2 size={12} />
                        <span>{t('hierarchy.deleteEntity')}</span>
                    </button>
                </>
            )}
        </div>
    );
}
