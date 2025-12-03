import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Entity, Core, HierarchySystem, HierarchyComponent, EntityTags, isFolder } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, SceneManagerService, CommandManager, EntityCreationRegistry, EntityCreationTemplate } from '@esengine/editor-core';
import { useLocale } from '../hooks/useLocale';
import * as LucideIcons from 'lucide-react';
import {
    Box, Wifi, Search, Plus, Trash2, Monitor, Globe, ChevronRight, ChevronDown,
    Eye, Star, Lock, Settings, Filter, Folder, Sun, Cloud, Mountain, Flag,
    SquareStack, FolderPlus
} from 'lucide-react';
import { ProfilerService, RemoteEntity } from '../services/ProfilerService';
import { confirm } from '@tauri-apps/plugin-dialog';
import { CreateEntityCommand, DeleteEntityCommand, ReparentEntityCommand, DropPosition } from '../application/commands/entity';
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
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entityId: number | null } | null>(null);
    const [draggedEntityId, setDraggedEntityId] = useState<number | null>(null);
    const [dropTarget, setDropTarget] = useState<{ entityId: number; indicator: DropIndicator } | null>(null);
    const [pluginTemplates, setPluginTemplates] = useState<EntityCreationTemplate[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set([-1])); // -1 is scene root
    const [sortColumn, setSortColumn] = useState<SortColumn>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const { t, locale } = useLocale();

    const isShowingRemote = viewMode === 'remote' && isRemoteConnected;
    const selectedId = selectedIds.size > 0 ? Array.from(selectedIds)[0] : null;

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
        const unsubSceneRestored = messageHub.subscribe('scene:restored', updateEntities);
        const unsubReordered = messageHub.subscribe('entity:reordered', updateEntities);
        const unsubReparented = messageHub.subscribe('entity:reparented', updateEntities);

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

    const handleDragStart = useCallback((e: React.DragEvent, entityId: number) => {
        setDraggedEntityId(entityId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', entityId.toString());
    }, []);

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

    const handleDrop = useCallback((e: React.DragEvent, targetNode: EntityNode) => {
        e.preventDefault();

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
        const folderName = locale === 'zh' ? `文件夹 ${entityCount + 1}` : `Folder ${entityCount + 1}`;

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
     */
    const getEntityType = useCallback((entity: Entity): string => {
        if (isFolder(entity.tag)) {
            return 'Folder';
        }

        const components = entity.components || [];
        if (components.length > 0) {
            const firstComponent = components[0];
            return firstComponent?.constructor?.name || 'Entity';
        }
        return 'Entity';
    }, []);

    /**
     * 获取实体类型图标
     */
    const getEntityIcon = useCallback((entity: Entity): React.ReactNode => {
        if (isFolder(entity.tag)) {
            return <Folder size={14} className="entity-type-icon folder" />;
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
    const displaySceneName = isShowingRemote && remoteSceneName ? remoteSceneName : sceneName;

    const totalCount = isShowingRemote ? remoteEntities.length : entityStore.getAllEntities().length;
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
                        <>
                            <button
                                className="outliner-action-btn"
                                onClick={handleCreateEntity}
                                title={locale === 'zh' ? '创建实体' : 'Create Entity'}
                            >
                                <Plus size={14} />
                            </button>
                            <button
                                className="outliner-action-btn"
                                onClick={handleCreateFolder}
                                title={locale === 'zh' ? '创建文件夹' : 'Create Folder'}
                            >
                                <FolderPlus size={14} />
                            </button>
                        </>
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
                {isShowingRemote ? (
                    // Remote entities view (flat list)
                    remoteEntities.length === 0 ? (
                        <div className="empty-state">
                            <Box size={32} strokeWidth={1.5} className="empty-icon" />
                            <div className="empty-hint">
                                {locale === 'zh' ? '远程游戏中没有实体' : 'No entities in remote game'}
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
                                {locale === 'zh' ? '创建实体开始使用' : 'Create an entity to get started'}
                            </div>
                        </div>
                    ) : (
                        <div className="outliner-list">
                            {/* World/Scene Root */}
                            <div
                                className={`outliner-item world-item ${expandedIds.has(-1) ? 'expanded' : ''}`}
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
                                    <Mountain size={14} className="entity-type-icon world" />
                                    <span className="outliner-item-name">{displaySceneName} (Editor)</span>
                                </div>
                                <div className="outliner-item-type">World</div>
                            </div>

                            {/* Hierarchical Entity Items */}
                            {flattenedEntities.map((node) => {
                                const { entity, depth, hasChildren, bIsFolder } = node;
                                const bIsExpanded = expandedIds.has(entity.id);
                                const bIsSelected = selectedIds.has(entity.id);
                                const bIsDragging = draggedEntityId === entity.id;
                                const currentDropTarget = dropTarget?.entityId === entity.id ? dropTarget : null;

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
                                        className={`outliner-item ${bIsSelected ? 'selected' : ''} ${bIsDragging ? 'dragging' : ''} ${dropIndicatorClass}`}
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
                                            <span className="outliner-item-name">{entity.name || `Entity ${entity.id}`}</span>
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
                    onCreateFolder={() => { handleCreateFolder(); closeContextMenu(); }}
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
    onCreateFolder: () => void;
    onCreateFromTemplate: (template: EntityCreationTemplate) => void;
    onDelete: () => void;
    onClose: () => void;
}

function ContextMenuWithSubmenu({
    x, y, locale, entityId, pluginTemplates,
    onCreateEmpty, onCreateFolder, onCreateFromTemplate, onDelete
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

    // 实体创建模板的 label 本地化映射
    const entityTemplateLabels: Record<string, { zh: string; en: string }> = {
        'Sprite': { zh: '精灵', en: 'Sprite' },
        'Animated Sprite': { zh: '动画精灵', en: 'Animated Sprite' },
        '创建 Tilemap': { zh: '瓦片地图', en: 'Tilemap' },
        'Camera 2D': { zh: '2D 相机', en: 'Camera 2D' },
    };

    const getCategoryLabel = (category: string) => {
        const labels = categoryLabels[category];
        return labels ? (locale === 'zh' ? labels.zh : labels.en) : category;
    };

    const getEntityTemplateLabel = (label: string) => {
        const mapping = entityTemplateLabels[label];
        if (mapping) {
            return locale === 'zh' ? mapping.zh : mapping.en;
        }
        return label;
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

            <button onClick={onCreateFolder}>
                <Folder size={12} />
                <span>{locale === 'zh' ? '创建文件夹' : 'Create Folder'}</span>
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
                    <button onClick={onDelete} className="context-menu-danger">
                        <Trash2 size={12} />
                        <span>{locale === 'zh' ? '删除实体' : 'Delete Entity'}</span>
                    </button>
                </>
            )}
        </div>
    );
}
