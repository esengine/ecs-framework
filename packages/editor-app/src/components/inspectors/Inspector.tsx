import { useState, useEffect, useRef } from 'react';
import { Entity } from '@esengine/ecs-framework';
import { TauriAPI } from '../../api/tauri';
import { SettingsService } from '../../services/SettingsService';
import { InspectorProps, InspectorTarget, AssetFileInfo, RemoteEntity } from './types';
import { getProfilerService } from './utils';
import {
    EmptyInspector,
    ExtensionInspector,
    AssetFileInspector,
    RemoteEntityInspector,
    EntityInspector
} from './views';

export function Inspector({ entityStore: _entityStore, messageHub, inspectorRegistry, projectPath, commandManager }: InspectorProps) {
    const [target, setTarget] = useState<InspectorTarget>(null);
    const [componentVersion, setComponentVersion] = useState(0);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [decimalPlaces, setDecimalPlaces] = useState(() => {
        const settings = SettingsService.getInstance();
        return settings.get<number>('inspector.decimalPlaces', 4);
    });
    const targetRef = useRef<InspectorTarget>(null);

    useEffect(() => {
        targetRef.current = target;
    }, [target]);

    useEffect(() => {
        const handleSettingsChanged = (event: Event) => {
            const customEvent = event as CustomEvent;
            const changedSettings = customEvent.detail;
            if ('inspector.decimalPlaces' in changedSettings) {
                setDecimalPlaces(changedSettings['inspector.decimalPlaces']);
            }
        };

        window.addEventListener('settings:changed', handleSettingsChanged);
        return () => {
            window.removeEventListener('settings:changed', handleSettingsChanged);
        };
    }, []);

    useEffect(() => {
        const handleEntitySelection = (data: { entity: Entity | null }) => {
            if (data.entity) {
                setTarget({ type: 'entity', data: data.entity });
            } else {
                setTarget(null);
            }
            setComponentVersion(0);
        };

        const handleRemoteEntitySelection = (data: { entity: RemoteEntity }) => {
            setTarget({ type: 'remote-entity', data: data.entity });
            const profilerService = getProfilerService();
            if (profilerService && data.entity?.id !== undefined) {
                profilerService.requestEntityDetails(data.entity.id);
            }
        };

        const handleEntityDetails = (event: Event) => {
            const customEvent = event as CustomEvent;
            const details = customEvent.detail;
            const currentTarget = targetRef.current;
            if (currentTarget?.type === 'remote-entity' && details?.id === currentTarget.data.id) {
                setTarget({ ...currentTarget, details });
            }
        };

        const handleExtensionSelection = (data: { data: unknown }) => {
            setTarget({ type: 'extension', data: data.data as Record<string, any> });
        };

        const handleAssetFileSelection = async (data: { fileInfo: AssetFileInfo }) => {
            const fileInfo = data.fileInfo;

            if (fileInfo.isDirectory) {
                setTarget({ type: 'asset-file', data: fileInfo });
                return;
            }

            const textExtensions = [
                'txt',
                'json',
                'md',
                'ts',
                'tsx',
                'js',
                'jsx',
                'css',
                'html',
                'xml',
                'yaml',
                'yml',
                'toml',
                'ini',
                'cfg',
                'conf',
                'log',
                'btree',
                'ecs'
            ];
            const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
            const isTextFile = fileInfo.extension && textExtensions.includes(fileInfo.extension.toLowerCase());
            const isImageFile = fileInfo.extension && imageExtensions.includes(fileInfo.extension.toLowerCase());

            if (isTextFile) {
                try {
                    const content = await TauriAPI.readFileContent(fileInfo.path);
                    setTarget({ type: 'asset-file', data: fileInfo, content });
                } catch (error) {
                    console.error('Failed to read file content:', error);
                    setTarget({ type: 'asset-file', data: fileInfo });
                }
            } else if (isImageFile) {
                setTarget({ type: 'asset-file', data: fileInfo, isImage: true });
            } else {
                setTarget({ type: 'asset-file', data: fileInfo });
            }
        };

        const handleComponentChange = () => {
            setComponentVersion((prev) => prev + 1);
        };

        const handleSceneRestored = () => {
            // 场景恢复后，清除当前选中的实体（因为旧引用已无效）
            // 用户需要重新选择实体
            setTarget(null);
            setComponentVersion(0);
        };

        const unsubEntitySelect = messageHub.subscribe('entity:selected', handleEntitySelection);
        const unsubSceneRestored = messageHub.subscribe('scene:restored', handleSceneRestored);
        const unsubRemoteSelect = messageHub.subscribe('remote-entity:selected', handleRemoteEntitySelection);
        const unsubNodeSelect = messageHub.subscribe('behavior-tree:node-selected', handleExtensionSelection);
        const unsubAssetFileSelect = messageHub.subscribe('asset-file:selected', handleAssetFileSelection);
        const unsubComponentAdded = messageHub.subscribe('component:added', handleComponentChange);
        const unsubComponentRemoved = messageHub.subscribe('component:removed', handleComponentChange);
        const unsubPropertyChanged = messageHub.subscribe('component:property:changed', handleComponentChange);

        window.addEventListener('profiler:entity-details', handleEntityDetails);

        return () => {
            unsubEntitySelect();
            unsubSceneRestored();
            unsubRemoteSelect();
            unsubNodeSelect();
            unsubAssetFileSelect();
            unsubComponentAdded();
            unsubComponentRemoved();
            unsubPropertyChanged();
            window.removeEventListener('profiler:entity-details', handleEntityDetails);
        };
    }, [messageHub]);

    useEffect(() => {
        if (!autoRefresh || target?.type !== 'remote-entity') {
            return;
        }

        const profilerService = getProfilerService();
        if (!profilerService) {
            return;
        }

        const handleProfilerData = () => {
            const currentTarget = targetRef.current;
            if (currentTarget?.type === 'remote-entity' && currentTarget.data?.id !== undefined) {
                profilerService.requestEntityDetails(currentTarget.data.id);
            }
        };

        const unsubscribe = profilerService.subscribe(handleProfilerData);

        return () => {
            unsubscribe();
        };
    }, [autoRefresh, target?.type]);

    if (!target) {
        return <EmptyInspector />;
    }

    if (target.type === 'extension') {
        return <ExtensionInspector data={target.data} inspectorRegistry={inspectorRegistry} projectPath={projectPath} />;
    }

    if (target.type === 'asset-file') {
        return <AssetFileInspector fileInfo={target.data} content={target.content} isImage={target.isImage} />;
    }

    if (target.type === 'remote-entity') {
        const entity = target.data;
        const details = target.details;

        return (
            <RemoteEntityInspector
                entity={entity}
                details={details}
                autoRefresh={autoRefresh}
                onAutoRefreshChange={setAutoRefresh}
                decimalPlaces={decimalPlaces}
            />
        );
    }

    if (target.type === 'entity') {
        return <EntityInspector entity={target.data} messageHub={messageHub} commandManager={commandManager} componentVersion={componentVersion} />;
    }

    return null;
}
