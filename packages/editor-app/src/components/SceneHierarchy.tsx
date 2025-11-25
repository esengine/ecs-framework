import { useState, useEffect } from 'react';
import { Entity, Core } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, SceneManagerService, CommandManager, EntityCreationRegistry, EntityCreationTemplate } from '@esengine/editor-core';
import { useLocale } from '../hooks/useLocale';
import { Box, Layers, Wifi, Search, Plus, Trash2, Monitor, Globe, Image, Camera, Film } from 'lucide-react';
import { ProfilerService, RemoteEntity } from '../services/ProfilerService';
import { confirm } from '@tauri-apps/plugin-dialog';
import { CreateEntityCommand, CreateSpriteEntityCommand, CreateAnimatedSpriteEntityCommand, CreateCameraEntityCommand, DeleteEntityCommand } from '../application/commands/entity';
import '../styles/SceneHierarchy.css';

type ViewMode = 'local' | 'remote';

interface SceneHierarchyProps {
  entityStore: EntityStoreService;
  messageHub: MessageHub;
  commandManager: CommandManager;
  isProfilerMode?: boolean;
}

export function SceneHierarchy({ entityStore, messageHub, commandManager, isProfilerMode = false }: SceneHierarchyProps) {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [remoteEntities, setRemoteEntities] = useState<RemoteEntity[]>([]);
    const [isRemoteConnected, setIsRemoteConnected] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>(isProfilerMode ? 'remote' : 'local');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sceneName, setSceneName] = useState<string>('Untitled');
    const [remoteSceneName, setRemoteSceneName] = useState<string | null>(null);
    const [sceneFilePath, setSceneFilePath] = useState<string | null>(null);
    const [isSceneModified, setIsSceneModified] = useState<boolean>(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entityId: number | null } | null>(null);
    const [draggedEntityId, setDraggedEntityId] = useState<number | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
    const [pluginTemplates, setPluginTemplates] = useState<EntityCreationTemplate[]>([]);
    const { t, locale } = useLocale();

    const isShowingRemote = viewMode === 'remote' && isRemoteConnected;

    // Get entity creation templates from plugins
    useEffect(() => {
        const updateTemplates = () => {
            const registry = Core.services.resolve(EntityCreationRegistry);
            if (registry) {
                setPluginTemplates(registry.getAll());
            }
        };

        updateTemplates();

        // Update when plugins are installed
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

        return () => {
            unsubLoaded();
            unsubNew();
            unsubSaved();
            unsubModified();
        };
    }, [messageHub]);

    // Subscribe to local entity changes
    useEffect(() => {
        const updateEntities = () => {
            setEntities([...entityStore.getRootEntities()]);
        };

        const handleSelection = (data: { entity: Entity | null }) => {
            setSelectedId(data.entity?.id ?? null);
        };

        updateEntities();

        const unsubAdd = messageHub.subscribe('entity:added', updateEntities);
        const unsubRemove = messageHub.subscribe('entity:removed', updateEntities);
        const unsubClear = messageHub.subscribe('entities:cleared', updateEntities);
        const unsubSelect = messageHub.subscribe('entity:selected', handleSelection);
        const unsubSceneLoaded = messageHub.subscribe('scene:loaded', updateEntities);
        const unsubSceneNew = messageHub.subscribe('scene:new', updateEntities);
        const unsubReordered = messageHub.subscribe('entity:reordered', updateEntities);

        return () => {
            unsubAdd();
            unsubRemove();
            unsubClear();
            unsubSelect();
            unsubSceneLoaded();
            unsubSceneNew();
            unsubReordered();
        };
    }, [entityStore, messageHub]);

    // Subscribe to remote entity data from ProfilerService
    useEffect(() => {
        const profilerService = (window as any).__PROFILER_SERVICE__ as ProfilerService | undefined;

        if (!profilerService) {
            return;
        }

        const initiallyConnected = profilerService.isConnected();
        setIsRemoteConnected(initiallyConnected);

        const unsubscribe = profilerService.subscribe((data) => {
            const connected = profilerService.isConnected();
            setIsRemoteConnected(connected);

            if (connected && data.entities && data.entities.length > 0) {
                // 只在实体列表发生实质性变化时才更新
                setRemoteEntities((prev) => {
                    if (prev.length !== data.entities!.length) {
                        return data.entities!;
                    }

                    // 检查实体ID和名称是否变化
                    const hasChanged = data.entities!.some((entity, index) => {
                        const prevEntity = prev[index];
                        return !prevEntity ||
                   prevEntity.id !== entity.id ||
                   prevEntity.name !== entity.name ||
                   prevEntity.componentCount !== entity.componentCount;
                    });

                    return hasChanged ? data.entities! : prev;
                });

                // 请求第一个实体的详情以获取场景名称
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

    const handleEntityClick = (entity: Entity) => {
        entityStore.selectEntity(entity);
    };

    const handleDragStart = (e: React.DragEvent, entityId: number) => {
        setDraggedEntityId(entityId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', entityId.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTargetIndex(index);
    };

    const handleDragLeave = () => {
        setDropTargetIndex(null);
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedEntityId !== null) {
            entityStore.reorderEntity(draggedEntityId, targetIndex);
        }
        setDraggedEntityId(null);
        setDropTargetIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedEntityId(null);
        setDropTargetIndex(null);
    };

    const handleRemoteEntityClick = (entity: RemoteEntity) => {
        setSelectedId(entity.id);

        // 请求完整的实体详情（包含组件属性）
        const profilerService = (window as any).__PROFILER_SERVICE__ as ProfilerService | undefined;
        if (profilerService) {
            profilerService.requestEntityDetails(entity.id);
        }

        // 先发布基本信息，详细信息稍后通过 ProfilerService 异步返回
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

    const handleSceneNameClick = () => {
        if (sceneFilePath) {
            messageHub.publish('asset:reveal', { path: sceneFilePath });
        }
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

    const handleCreateSpriteEntity = () => {
        // Count only Sprite entities for naming
        const spriteCount = entityStore.getAllEntities().filter((e) => e.name.startsWith('Sprite ')).length;
        const entityName = `Sprite ${spriteCount + 1}`;

        const command = new CreateSpriteEntityCommand(
            entityStore,
            messageHub,
            entityName
        );
        commandManager.execute(command);
    };

    const handleCreateAnimatedSpriteEntity = () => {
        const animCount = entityStore.getAllEntities().filter((e) => e.name.startsWith('AnimatedSprite ')).length;
        const entityName = `AnimatedSprite ${animCount + 1}`;

        const command = new CreateAnimatedSpriteEntityCommand(
            entityStore,
            messageHub,
            entityName
        );
        commandManager.execute(command);
    };

    const handleCreateCameraEntity = () => {
        const entityCount = entityStore.getAllEntities().length;
        const entityName = `Camera ${entityCount + 1}`;

        const command = new CreateCameraEntityCommand(
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

        const confirmed = await confirm(
            locale === 'zh'
                ? `确定要删除实体 "${entity.name}" 吗？`
                : `Are you sure you want to delete entity "${entity.name}"?`,
            {
                title: locale === 'zh' ? '删除实体' : 'Delete Entity',
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

    const handleContextMenu = (e: React.MouseEvent, entityId: number | null) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, entityId });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => closeContextMenu();
        if (contextMenu) {
            window.addEventListener('click', handleClick);
            return () => window.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    // Listen for Delete key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedId && !isShowingRemote) {
                handleDeleteEntity();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, isShowingRemote]);

    // Filter entities based on search query
    const filterRemoteEntities = (entityList: RemoteEntity[]): RemoteEntity[] => {
        if (!searchQuery.trim()) return entityList;

        const query = searchQuery.toLowerCase();
        return entityList.filter((entity) => {
            const name = entity.name;
            const id = entity.id.toString();

            // Search by name or ID
            if (name.toLowerCase().includes(query) || id.includes(query)) {
                return true;
            }

            // Search by component types
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
            const id = entity.id.toString();
            return id.includes(query);
        });
    };

    // Determine which entities to display
    const displayEntities = isShowingRemote
        ? filterRemoteEntities(remoteEntities)
        : filterLocalEntities(entities);
    const showRemoteIndicator = isShowingRemote && remoteEntities.length > 0;
    const displaySceneName = isShowingRemote && remoteSceneName ? remoteSceneName : sceneName;

    return (
        <div className="scene-hierarchy">
            <div className="hierarchy-header">
                <Layers size={16} className="hierarchy-header-icon" />
                <h3>{t('hierarchy.title')}</h3>
                <div
                    className={[
                        'scene-name-container',
                        !isRemoteConnected && sceneFilePath && 'clickable',
                        isSceneModified && 'modified'
                    ].filter(Boolean).join(' ')}
                    onClick={!isRemoteConnected ? handleSceneNameClick : undefined}
                    title={!isRemoteConnected && sceneFilePath
                        ? `${displaySceneName}${isSceneModified ? (locale === 'zh' ? ' (未保存 - Ctrl+S 保存)' : ' (Unsaved - Ctrl+S to save)') : ''} - ${locale === 'zh' ? '点击跳转到文件' : 'Click to reveal file'}`
                        : displaySceneName}
                >
                    <span className="scene-name">
                        {displaySceneName}
                    </span>
                    {!isRemoteConnected && isSceneModified && (
                        <span className="modified-indicator">●</span>
                    )}
                </div>
                {isRemoteConnected && !isProfilerMode && (
                    <div className="view-mode-toggle">
                        <button
                            className={`mode-btn ${viewMode === 'local' ? 'active' : ''}`}
                            onClick={() => setViewMode('local')}
                            title={locale === 'zh' ? '本地场景' : 'Local Scene'}
                        >
                            <Monitor size={14} />
                        </button>
                        <button
                            className={`mode-btn ${viewMode === 'remote' ? 'active' : ''}`}
                            onClick={() => setViewMode('remote')}
                            title={locale === 'zh' ? '远程实体' : 'Remote Entities'}
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
            <div className="hierarchy-search">
                <Search size={14} />
                <input
                    type="text"
                    placeholder={t('hierarchy.search') || 'Search entities...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {!isShowingRemote && (
                <div className="hierarchy-toolbar">
                    <button
                        className="toolbar-btn icon-only"
                        onClick={handleCreateEntity}
                        title={locale === 'zh' ? '创建实体' : 'Create Entity'}
                    >
                        <Plus size={14} />
                    </button>
                    <button
                        className="toolbar-btn icon-only"
                        onClick={handleDeleteEntity}
                        disabled={!selectedId}
                        title={locale === 'zh' ? '删除实体' : 'Delete Entity'}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
            <div className="hierarchy-content scrollable" onContextMenu={(e) => !isShowingRemote && handleContextMenu(e, null)}>
                {displayEntities.length === 0 ? (
                    <div className="empty-state">
                        <Box size={48} strokeWidth={1.5} className="empty-icon" />
                        <div className="empty-title">{t('hierarchy.empty')}</div>
                        <div className="empty-hint">
                            {isShowingRemote
                                ? 'No entities in remote game'
                                : 'Create an entity to get started'}
                        </div>
                    </div>
                ) : isShowingRemote ? (
                    <ul className="entity-list">
                        {(displayEntities as RemoteEntity[]).map((entity) => (
                            <li
                                key={entity.id}
                                className={`entity-item remote-entity ${selectedId === entity.id ? 'selected' : ''} ${!entity.enabled ? 'disabled' : ''}`}
                                title={`${entity.name} - ${entity.componentTypes.join(', ')}`}
                                onClick={() => handleRemoteEntityClick(entity)}
                            >
                                <Box size={14} className="entity-icon" />
                                <span className="entity-name">{entity.name}</span>
                                {entity.tag !== 0 && (
                                    <span className="entity-tag" title={`Tag: ${entity.tag}`}>
                    #{entity.tag}
                                    </span>
                                )}
                                {entity.componentCount > 0 && (
                                    <span className="component-count">{entity.componentCount}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="entity-list">
                        {entities.map((entity, index) => (
                            <li
                                key={entity.id}
                                className={`entity-item ${selectedId === entity.id ? 'selected' : ''} ${draggedEntityId === entity.id ? 'dragging' : ''} ${dropTargetIndex === index ? 'drop-target' : ''}`}
                                draggable
                                onClick={() => handleEntityClick(entity)}
                                onDragStart={(e) => handleDragStart(e, entity.id)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                onContextMenu={(e) => {
                                    e.stopPropagation();
                                    handleEntityClick(entity);
                                    handleContextMenu(e, entity.id);
                                }}
                            >
                                <Box size={14} className="entity-icon" />
                                <span className="entity-name">{entity.name || `Entity ${entity.id}`}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {contextMenu && !isShowingRemote && (
                <div
                    className="context-menu"
                    style={{
                        position: 'fixed',
                        left: contextMenu.x,
                        top: contextMenu.y,
                        zIndex: 1000
                    }}
                >
                    <button onClick={() => { handleCreateEntity(); closeContextMenu(); }}>
                        <Plus size={12} />
                        <span>{locale === 'zh' ? '创建空实体' : 'Create Empty Entity'}</span>
                    </button>
                    <button onClick={() => { handleCreateSpriteEntity(); closeContextMenu(); }}>
                        <Image size={12} />
                        <span>{locale === 'zh' ? '创建 Sprite' : 'Create Sprite'}</span>
                    </button>
                    <button onClick={() => { handleCreateAnimatedSpriteEntity(); closeContextMenu(); }}>
                        <Film size={12} />
                        <span>{locale === 'zh' ? '创建动画 Sprite' : 'Create Animated Sprite'}</span>
                    </button>
                    <button onClick={() => { handleCreateCameraEntity(); closeContextMenu(); }}>
                        <Camera size={12} />
                        <span>{locale === 'zh' ? '创建相机' : 'Create Camera'}</span>
                    </button>
                    {pluginTemplates.length > 0 && (
                        <>
                            <div className="context-menu-divider" />
                            {pluginTemplates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={async () => {
                                        await template.create(contextMenu.entityId ?? undefined);
                                        closeContextMenu();
                                    }}
                                >
                                    {template.icon || <Plus size={12} />}
                                    <span>{template.label}</span>
                                </button>
                            ))}
                        </>
                    )}
                    {contextMenu.entityId && (
                        <>
                            <div className="context-menu-divider" />
                            <button onClick={() => { handleDeleteEntity(); closeContextMenu(); }}>
                                <Trash2 size={12} />
                                <span>{locale === 'zh' ? '删除实体' : 'Delete Entity'}</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
