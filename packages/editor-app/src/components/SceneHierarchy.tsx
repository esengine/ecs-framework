import { useState, useEffect, useRef } from 'react';
import { Entity, Core } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, SceneManagerService, CommandManager, EntityCreationRegistry, EntityCreationTemplate } from '@esengine/editor-core';
import { useLocale } from '../hooks/useLocale';
import * as LucideIcons from 'lucide-react';
import {
    Box, Wifi, Search, Plus, Trash2, Monitor, Globe, ChevronRight, ChevronDown,
    Eye, Star, Lock, Settings, Filter, Folder, Sun, Cloud, Mountain, Flag,
    SquareStack
} from 'lucide-react';
import { ProfilerService, RemoteEntity } from '../services/ProfilerService';
import { confirm } from '@tauri-apps/plugin-dialog';
import { CreateEntityCommand, DeleteEntityCommand } from '../application/commands/entity';
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
    isExpanded: boolean;
    depth: number;
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
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entityId: number | null } | null>(null);
    const [draggedEntityId, setDraggedEntityId] = useState<number | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
    const [pluginTemplates, setPluginTemplates] = useState<EntityCreationTemplate[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
    const [sortColumn, setSortColumn] = useState<SortColumn>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const { t, locale } = useLocale();

    const isShowingRemote = viewMode === 'remote' && isRemoteConnected;
    const selectedId = selectedIds.size > 0 ? Array.from(selectedIds)[0] : null;

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
        setSelectedIds(new Set([entity.id]));

        const profilerService = (window as any).__PROFILER_SERVICE__ as ProfilerService | undefined;
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

    useEffect(() => {
        const handleClick = () => closeContextMenu();
        if (contextMenu) {
            window.addEventListener('click', handleClick);
            return () => window.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedId && !isShowingRemote) {
                handleDeleteEntity();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, isShowingRemote]);

    const toggleFolderExpand = (entityId: number) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(entityId)) {
                next.delete(entityId);
            } else {
                next.add(entityId);
            }
            return next;
        });
    };

    const handleSortClick = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Get entity type for display
    const getEntityType = (entity: Entity): string => {
        const components = entity.components || [];
        if (components.length > 0) {
            const firstComponent = components[0];
            return firstComponent?.constructor?.name || 'Entity';
        }
        return 'Entity';
    };

    // Get icon for entity type
    const getEntityIcon = (entityType: string): React.ReactNode => {
        return entityTypeIcons[entityType] || <Box size={14} className="entity-type-icon default" />;
    };

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

    const displayEntities = isShowingRemote
        ? filterRemoteEntities(remoteEntities)
        : filterLocalEntities(entities);
    const showRemoteIndicator = isShowingRemote && remoteEntities.length > 0;
    const displaySceneName = isShowingRemote && remoteSceneName ? remoteSceneName : sceneName;

    const totalCount = displayEntities.length;
    const selectedCount = selectedIds.size;

    return (
        <div className="scene-hierarchy outliner">
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
                        placeholder={locale === 'zh' ? '搜索...' : 'Search...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <ChevronDown size={12} className="search-dropdown" />
                </div>

                <div className="outliner-toolbar-right">
                    {!isShowingRemote && (
                        <button
                            className="outliner-action-btn"
                            onClick={handleCreateEntity}
                            title={locale === 'zh' ? '添加' : 'Add'}
                        >
                            <Plus size={14} />
                        </button>
                    )}
                    <button
                        className="outliner-action-btn"
                        title={locale === 'zh' ? '设置' : 'Settings'}
                    >
                        <Settings size={14} />
                    </button>
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

            {/* Column Headers */}
            <div className="outliner-header">
                <div className="outliner-header-icons">
                    <span title={locale === 'zh' ? '可见性' : 'Visibility'}><Eye size={12} className="header-icon" /></span>
                    <span title={locale === 'zh' ? '收藏' : 'Favorite'}><Star size={12} className="header-icon" /></span>
                    <span title={locale === 'zh' ? '锁定' : 'Lock'}><Lock size={12} className="header-icon" /></span>
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
            <div className="outliner-content" onContextMenu={(e) => !isShowingRemote && handleContextMenu(e, null)}>
                {displayEntities.length === 0 ? (
                    <div className="empty-state">
                        <Box size={32} strokeWidth={1.5} className="empty-icon" />
                        <div className="empty-hint">
                            {isShowingRemote
                                ? (locale === 'zh' ? '远程游戏中没有实体' : 'No entities in remote game')
                                : (locale === 'zh' ? '创建实体开始使用' : 'Create an entity to get started')}
                        </div>
                    </div>
                ) : isShowingRemote ? (
                    <div className="outliner-list">
                        {(displayEntities as RemoteEntity[]).map((entity) => (
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
                                    {getEntityIcon(entity.componentTypes?.[0] || 'Entity')}
                                    <span className="outliner-item-name">{entity.name}</span>
                                </div>
                                <div className="outliner-item-type">
                                    {entity.componentTypes?.[0] || 'Entity'}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="outliner-list">
                        {/* World/Scene Root */}
                        <div
                            className={`outliner-item world-item ${expandedFolders.has(-1) ? 'expanded' : ''}`}
                            onClick={() => toggleFolderExpand(-1)}
                        >
                            <div className="outliner-item-icons">
                                <Eye size={12} className="item-icon visibility" />
                            </div>
                            <div className="outliner-item-content">
                                <span
                                    className="outliner-item-expand"
                                    onClick={(e) => { e.stopPropagation(); toggleFolderExpand(-1); }}
                                >
                                    {expandedFolders.has(-1) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </span>
                                <Mountain size={14} className="entity-type-icon world" />
                                <span className="outliner-item-name">{displaySceneName} (Editor)</span>
                            </div>
                            <div className="outliner-item-type">World</div>
                        </div>

                        {/* Entity Items */}
                        {expandedFolders.has(-1) && entities.map((entity, index) => {
                            const entityType = getEntityType(entity);
                            return (
                                <div
                                    key={entity.id}
                                    className={`outliner-item ${selectedIds.has(entity.id) ? 'selected' : ''} ${draggedEntityId === entity.id ? 'dragging' : ''} ${dropTargetIndex === index ? 'drop-target' : ''}`}
                                    style={{ paddingLeft: '32px' }}
                                    draggable
                                    onClick={(e) => handleEntityClick(entity, e)}
                                    onDragStart={(e) => handleDragStart(e, entity.id)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
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
                                        <span className="outliner-item-expand" />
                                        {getEntityIcon(entityType)}
                                        <span className="outliner-item-name">{entity.name || `Entity ${entity.id}`}</span>
                                    </div>
                                    <div className="outliner-item-type">{entityType}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="outliner-status">
                <span>{totalCount} {locale === 'zh' ? '个对象' : 'actors'}</span>
                {selectedCount > 0 && (
                    <span> ({selectedCount} {locale === 'zh' ? '个已选中' : 'selected'})</span>
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
