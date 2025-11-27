import { useState, useEffect, useRef } from 'react';
import { Entity, Core } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, SceneManagerService, CommandManager, EntityCreationRegistry, EntityCreationTemplate } from '@esengine/editor-core';
import { useLocale } from '../hooks/useLocale';
import * as LucideIcons from 'lucide-react';
import { Box, Layers, Wifi, Search, Plus, Trash2, Monitor, Globe, ChevronRight } from 'lucide-react';
import { ProfilerService, RemoteEntity } from '../services/ProfilerService';
import { confirm } from '@tauri-apps/plugin-dialog';
import { CreateEntityCommand, DeleteEntityCommand } from '../application/commands/entity';
import '../styles/SceneHierarchy.css';

/**
 * 根据图标名称获取 Lucide 图标组件
 */
function getIconComponent(iconName: string | undefined, size: number = 12): React.ReactNode {
    if (!iconName) return <Plus size={size} />;

    // 获取图标组件
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>;
    const IconComponent = icons[iconName];
    if (IconComponent) {
        return <IconComponent size={size} />;
    }

    // 回退到 Plus 图标
    return <Plus size={size} />;
}

/**
 * 类别图标映射
 */
const categoryIconMap: Record<string, string> = {
    'rendering': 'Image',
    'ui': 'LayoutGrid',
    'physics': 'Box',
    'audio': 'Volume2',
    'basic': 'Plus',
    'other': 'MoreHorizontal',
};

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
                <ContextMenuWithSubmenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    locale={locale}
                    entityId={contextMenu.entityId}
                    pluginTemplates={pluginTemplates}
                    onCreateEmpty={() => { handleCreateEntity(); closeContextMenu(); }}
                    onCreateFromTemplate={async (template) => {
                        await template.create(contextMenu.entityId ?? undefined);
                        closeContextMenu();
                    }}
                    onDelete={() => { handleDeleteEntity(); closeContextMenu(); }}
                    onClose={closeContextMenu}
                />
            )}
        </div>
    );
}

interface ContextMenuWithSubmenuProps {
    x: number;
    y: number;
    locale: string;
    entityId: number | null;
    pluginTemplates: EntityCreationTemplate[];
    onCreateEmpty: () => void;
    onCreateFromTemplate: (template: EntityCreationTemplate) => void;
    onDelete: () => void;
    onClose: () => void;
}

function ContextMenuWithSubmenu({
    x, y, locale, entityId, pluginTemplates,
    onCreateEmpty, onCreateFromTemplate, onDelete
}: ContextMenuWithSubmenuProps) {
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const [submenuPosition, setSubmenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    const categoryLabels: Record<string, { zh: string; en: string }> = {
        'basic': { zh: '基础', en: 'Basic' },
        'rendering': { zh: '2D 对象', en: '2D Objects' },
        'ui': { zh: 'UI', en: 'UI' },
        'physics': { zh: '物理', en: 'Physics' },
        'audio': { zh: '音频', en: 'Audio' },
        'other': { zh: '其他', en: 'Other' },
    };

    const getCategoryLabel = (category: string) => {
        const labels = categoryLabels[category];
        return labels ? (locale === 'zh' ? labels.zh : labels.en) : category;
    };

    // 将模板按类别分组（所有模板现在都来自插件）
    const templatesByCategory = pluginTemplates.reduce((acc, template) => {
        const cat = template.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(template);
        return acc;
    }, {} as Record<string, EntityCreationTemplate[]>);

    // 按顺序排序每个类别内的模板
    Object.values(templatesByCategory).forEach(templates => {
        templates.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    });

    const handleSubmenuEnter = (category: string, e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setSubmenuPosition({ x: rect.right - 4, y: rect.top });
        setActiveSubmenu(category);
    };

    // 定义类别显示顺序
    const categoryOrder = ['rendering', 'ui', 'physics', 'audio', 'basic', 'other'];
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
                <span>{locale === 'zh' ? '创建空实体' : 'Create Empty Entity'}</span>
            </button>

            {sortedCategories.length > 0 && <div className="context-menu-divider" />}

            {/* 按类别渲染所有模板 */}
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
                                    <span>{template.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {entityId && (
                <>
                    <div className="context-menu-divider" />
                    <button onClick={onDelete} className="context-menu-danger">
                        <Trash2 size={12} />
                        <span>{locale === 'zh' ? '删除实体' : 'Delete Entity'}</span>
                    </button>
                </>
            )}
        </div>
    );
}
