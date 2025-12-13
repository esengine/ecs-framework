import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Settings, ChevronDown, ChevronRight, X, Plus, Box, Search, Lock, Unlock } from 'lucide-react';
import { Entity, Component, Core, getComponentDependencies, getComponentTypeName, getComponentInstanceTypeName, isComponentInstanceHiddenInInspector, PrefabInstanceComponent } from '@esengine/ecs-framework';
import { MessageHub, CommandManager, ComponentRegistry, ComponentActionRegistry, ComponentInspectorRegistry, PrefabService } from '@esengine/editor-core';
import { PropertyInspector } from '../../PropertyInspector';
import { NotificationService } from '../../../services/NotificationService';
import { RemoveComponentCommand, UpdateComponentCommand, AddComponentCommand } from '../../../application/commands/component';
import { PrefabInstanceInfo } from '../common/PrefabInstanceInfo';
import '../../../styles/EntityInspector.css';
import * as LucideIcons from 'lucide-react';

type CategoryFilter = 'all' | 'general' | 'transform' | 'rendering' | 'physics' | 'audio' | 'other';

// 从 ComponentRegistry category 到 CategoryFilter 的映射
const categoryKeyMap: Record<string, CategoryFilter> = {
    'components.category.core': 'general',
    'components.category.rendering': 'rendering',
    'components.category.physics': 'physics',
    'components.category.audio': 'audio',
    'components.category.ui': 'rendering',
    'components.category.ui.core': 'rendering',
    'components.category.ui.widgets': 'rendering',
    'components.category.other': 'other',
};

interface ComponentInfo {
    name: string;
    type?: new () => Component;
    category?: string;
    description?: string;
    icon?: string;
}

interface EntityInspectorProps {
    entity: Entity;
    messageHub: MessageHub;
    commandManager: CommandManager;
    componentVersion: number;
    /** 是否锁定检视器 | Whether inspector is locked */
    isLocked?: boolean;
    /** 锁定状态变化回调 | Lock state change callback */
    onLockChange?: (locked: boolean) => void;
}

export function EntityInspector({
    entity,
    messageHub,
    commandManager,
    componentVersion,
    isLocked = false,
    onLockChange
}: EntityInspectorProps) {
    // 使用组件类型名追踪折叠状态（持久化到 localStorage）
    // Use component type names to track collapsed state (persisted to localStorage)
    const [collapsedComponentTypes, setCollapsedComponentTypes] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('inspector-collapsed-components');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    });

    // 保存折叠状态到 localStorage | Save collapsed state to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(
                'inspector-collapsed-components',
                JSON.stringify([...collapsedComponentTypes])
            );
        } catch {
            // Ignore localStorage errors
        }
    }, [collapsedComponentTypes]);

    const [showComponentMenu, setShowComponentMenu] = useState(false);
    const [localVersion, setLocalVersion] = useState(0);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
    const [selectedComponentIndex, setSelectedComponentIndex] = useState(-1);
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [propertySearchQuery, setPropertySearchQuery] = useState('');
    const addButtonRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const componentRegistry = Core.services.resolve(ComponentRegistry);
    const componentActionRegistry = Core.services.resolve(ComponentActionRegistry);
    const componentInspectorRegistry = Core.services.resolve(ComponentInspectorRegistry);
    const prefabService = Core.services.tryResolve(PrefabService) as PrefabService | null;
    const availableComponents = (componentRegistry?.getAllComponents() || []) as ComponentInfo[];

    // 检查实体是否为预制体实例 | Check if entity is a prefab instance
    const isPrefabInstance = useMemo(() => {
        return entity.hasComponent(PrefabInstanceComponent);
    }, [entity, componentVersion]);

    useEffect(() => {
        if (showComponentMenu && addButtonRef.current) {
            const rect = addButtonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right
            });
            setSearchQuery('');
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [showComponentMenu]);

    const categoryLabels: Record<string, string> = {
        'components.category.core': '核心',
        'components.category.rendering': '渲染',
        'components.category.physics': '物理',
        'components.category.audio': '音频',
        'components.category.ui': 'UI',
        'components.category.ui.core': 'UI 核心',
        'components.category.ui.widgets': 'UI 控件',
        'components.category.other': '其他',
    };

    const filteredAndGroupedComponents = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const filtered = query
            ? availableComponents.filter(c =>
                c.name.toLowerCase().includes(query) ||
                (c.description && c.description.toLowerCase().includes(query))
            )
            : availableComponents;

        const grouped = new Map<string, ComponentInfo[]>();
        filtered.forEach((info) => {
            const cat = info.category || 'components.category.other';
            if (!grouped.has(cat)) grouped.set(cat, []);
            grouped.get(cat)!.push(info);
        });
        return grouped;
    }, [availableComponents, searchQuery]);

    // 创建扁平化的可见组件列表（用于键盘导航）
    // Create flat list of visible components for keyboard navigation
    const flatVisibleComponents = useMemo(() => {
        const result: ComponentInfo[] = [];
        for (const [category, components] of filteredAndGroupedComponents.entries()) {
            const isCollapsed = collapsedCategories.has(category) && !searchQuery;
            if (!isCollapsed) {
                result.push(...components);
            }
        }
        return result;
    }, [filteredAndGroupedComponents, collapsedCategories, searchQuery]);

    // 重置选中索引当搜索变化时 | Reset selected index when search changes
    useEffect(() => {
        setSelectedComponentIndex(searchQuery ? 0 : -1);
    }, [searchQuery]);

    // 处理组件搜索的键盘导航 | Handle keyboard navigation for component search
    const handleComponentSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedComponentIndex(prev =>
                prev < flatVisibleComponents.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedComponentIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter' && selectedComponentIndex >= 0) {
            e.preventDefault();
            const selectedComponent = flatVisibleComponents[selectedComponentIndex];
            if (selectedComponent?.type) {
                handleAddComponent(selectedComponent.type);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowComponentMenu(false);
        }
    }, [flatVisibleComponents, selectedComponentIndex]);

    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) next.delete(category);
            else next.add(category);
            return next;
        });
    };

    const toggleComponentExpanded = (componentTypeName: string) => {
        setCollapsedComponentTypes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(componentTypeName)) {
                // 已折叠，展开它 | Was collapsed, expand it
                newSet.delete(componentTypeName);
            } else {
                // 已展开，折叠它 | Was expanded, collapse it
                newSet.add(componentTypeName);
            }
            return newSet;
        });
    };

    const handleAddComponent = (ComponentClass: new () => Component) => {
        const command = new AddComponentCommand(messageHub, entity, ComponentClass);
        commandManager.execute(command);
        setShowComponentMenu(false);
    };

    const handleRemoveComponent = (index: number) => {
        const component = entity.components[index];
        if (!component) return;

        const componentName = getComponentTypeName(component.constructor as any);

        // Check if any other component depends on this one
        const dependentComponents: string[] = [];
        for (const otherComponent of entity.components) {
            if (otherComponent === component) continue;

            const dependencies = getComponentDependencies(otherComponent.constructor as any);
            const otherName = getComponentTypeName(otherComponent.constructor as any);
            if (dependencies && dependencies.includes(componentName)) {
                dependentComponents.push(otherName);
            }
        }

        if (dependentComponents.length > 0) {
            const notificationService = Core.services.tryResolve(NotificationService) as NotificationService | null;
            if (notificationService) {
                notificationService.warning(
                    '无法删除组件',
                    `${componentName} 被以下组件依赖: ${dependentComponents.join(', ')}。请先删除这些组件。`
                );
            }
            return;
        }

        const command = new RemoveComponentCommand(
            messageHub,
            entity,
            component
        );
        commandManager.execute(command);
    };

    const handlePropertyChange = (component: Component, propertyName: string, value: unknown) => {
        const command = new UpdateComponentCommand(
            messageHub,
            entity,
            component,
            propertyName,
            value
        );
        commandManager.execute(command);
    };

    const handlePropertyAction = async (actionId: string, _propertyName: string, component: Component) => {
        if (actionId === 'nativeSize' && component.constructor.name === 'SpriteComponent') {
            const sprite = component as unknown as { texture: string; width: number; height: number };
            if (!sprite.texture) {
                console.warn('No texture set for sprite');
                return;
            }

            try {
                const { convertFileSrc } = await import('@tauri-apps/api/core');
                const assetUrl = convertFileSrc(sprite.texture);

                const img = new Image();
                img.onload = () => {
                    handlePropertyChange(component, 'width', img.naturalWidth);
                    handlePropertyChange(component, 'height', img.naturalHeight);
                    setLocalVersion((v) => v + 1);
                };
                img.onerror = () => {
                    console.error('Failed to load texture for native size:', sprite.texture);
                };
                img.src = assetUrl;
            } catch (error) {
                console.error('Error getting texture size:', error);
            }
        }
    };

    const categoryTabs: { key: CategoryFilter; label: string }[] = [
        { key: 'general', label: 'General' },
        { key: 'transform', label: 'Transform' },
        { key: 'rendering', label: 'Rendering' },
        { key: 'physics', label: 'Physics' },
        { key: 'audio', label: 'Audio' },
        { key: 'other', label: 'Other' },
        { key: 'all', label: 'All' }
    ];

    const getComponentCategory = useCallback((componentName: string): CategoryFilter => {
        const componentInfo = componentRegistry?.getComponent(componentName);
        if (componentInfo?.category) {
            return categoryKeyMap[componentInfo.category] || 'general';
        }
        return 'general';
    }, [componentRegistry]);

    const filteredComponents = useMemo(() => {
        return entity.components.filter((component: Component) => {
            // 过滤掉标记为隐藏的组件（如 Hierarchy, PrefabInstance）
            // Filter out components marked as hidden (e.g., Hierarchy, PrefabInstance)
            if (isComponentInstanceHiddenInInspector(component)) {
                return false;
            }

            const componentName = getComponentInstanceTypeName(component);

            if (categoryFilter !== 'all') {
                const category = getComponentCategory(componentName);
                if (category !== categoryFilter) {
                    return false;
                }
            }

            if (propertySearchQuery.trim()) {
                const query = propertySearchQuery.toLowerCase();
                if (!componentName.toLowerCase().includes(query)) {
                    return false;
                }
            }

            return true;
        });
    }, [entity.components, categoryFilter, propertySearchQuery, getComponentCategory]);

    return (
        <div className="entity-inspector">
            {/* Header */}
            <div className="inspector-header">
                <div className="inspector-header-left">
                    <button
                        className={`inspector-lock-btn ${isLocked ? 'locked' : ''}`}
                        onClick={() => onLockChange?.(!isLocked)}
                        title={isLocked ? '解锁检视器' : '锁定检视器'}
                    >
                        {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                    <Settings size={14} color="#666" />
                    <span className="entity-name">{entity.name || `Entity #${entity.id}`}</span>
                </div>
                <span className="inspector-object-count">1 object</span>
            </div>

            {/* Prefab Instance Info | 预制体实例信息 */}
            {isPrefabInstance && prefabService && (
                <PrefabInstanceInfo
                    entity={entity}
                    prefabService={prefabService}
                    messageHub={messageHub}
                    commandManager={commandManager}
                />
            )}

            {/* Search Box */}
            <div className="inspector-search">
                <Search size={14} />
                <input
                    type="text"
                    placeholder="Search..."
                    value={propertySearchQuery}
                    onChange={(e) => setPropertySearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape' && propertySearchQuery) {
                            e.preventDefault();
                            setPropertySearchQuery('');
                        }
                    }}
                />
                {propertySearchQuery && (
                    <button
                        className="inspector-search-clear"
                        onClick={() => setPropertySearchQuery('')}
                        title="Clear"
                    >
                        <X size={12} />
                    </button>
                )}
                {propertySearchQuery && (
                    <span className="inspector-search-count">
                        {filteredComponents.length} / {entity.components.length}
                    </span>
                )}
            </div>

            {/* Category Tabs */}
            <div className="inspector-category-tabs">
                {categoryTabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`inspector-category-tab ${categoryFilter === tab.key ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="inspector-content">

                <div className="inspector-section">
                    <div className="section-title section-title-with-action">
                        <span>组件</span>
                        <div className="component-menu-container">
                            <button
                                ref={addButtonRef}
                                className="add-component-trigger"
                                onClick={() => setShowComponentMenu(!showComponentMenu)}
                            >
                                <Plus size={12} />
                                添加
                            </button>
                            {showComponentMenu && dropdownPosition && (
                                <>
                                    <div className="component-dropdown-overlay" onClick={() => setShowComponentMenu(false)} />
                                    <div
                                        className="component-dropdown"
                                        style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
                                    >
                                        <div className="component-dropdown-search">
                                            <Search size={14} />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                placeholder="搜索组件..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={handleComponentSearchKeyDown}
                                            />
                                        </div>
                                        {filteredAndGroupedComponents.size === 0 ? (
                                            <div className="component-dropdown-empty">
                                                {searchQuery ? '未找到匹配的组件' : '没有可用组件'}
                                            </div>
                                        ) : (
                                            <div className="component-dropdown-list">
                                                {(() => {
                                                    let globalIndex = 0;
                                                    return Array.from(filteredAndGroupedComponents.entries()).map(([category, components]) => {
                                                        const isCollapsed = collapsedCategories.has(category) && !searchQuery;
                                                        const label = categoryLabels[category] || category;
                                                        const startIndex = globalIndex;
                                                        if (!isCollapsed) {
                                                            globalIndex += components.length;
                                                        }
                                                        return (
                                                            <div key={category} className="component-category-group">
                                                                <button
                                                                    className="component-category-header"
                                                                    onClick={() => toggleCategory(category)}
                                                                >
                                                                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                                                    <span>{label}</span>
                                                                    <span className="component-category-count">{components.length}</span>
                                                                </button>
                                                                {!isCollapsed && components.map((info, idx) => {
                                                                    const IconComp = info.icon && (LucideIcons as any)[info.icon];
                                                                    const itemIndex = startIndex + idx;
                                                                    const isSelected = itemIndex === selectedComponentIndex;
                                                                    return (
                                                                        <button
                                                                            key={info.name}
                                                                            className={`component-dropdown-item ${isSelected ? 'selected' : ''}`}
                                                                            onClick={() => info.type && handleAddComponent(info.type)}
                                                                            onMouseEnter={() => setSelectedComponentIndex(itemIndex)}
                                                                        >
                                                                            {IconComp ? <IconComp size={14} /> : <Box size={14} />}
                                                                            <span className="component-dropdown-item-name">{info.name}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {filteredComponents.length === 0 ? (
                        <div className="empty-state-small">
                            {entity.components.length === 0 ? '暂无组件' : '没有匹配的组件'}
                        </div>
                    ) : (
                        filteredComponents.map((component: Component) => {
                            const originalIndex = entity.components.indexOf(component);
                            const componentName = getComponentInstanceTypeName(component);
                            // 使用组件类型名判断展开状态（未在折叠集合中 = 展开）
                            const isExpanded = !collapsedComponentTypes.has(componentName);
                            const componentInfo = componentRegistry?.getComponent(componentName);
                            const iconName = (componentInfo as { icon?: string } | undefined)?.icon;
                            const IconComponent = iconName && (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[iconName];

                            return (
                                <div
                                    key={`${componentName}-${originalIndex}`}
                                    className={`component-item-card ${isExpanded ? 'expanded' : ''}`}
                                >
                                    <div
                                        className="component-item-header"
                                        onClick={() => toggleComponentExpanded(componentName)}
                                    >
                                        <span className="component-expand-icon">
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </span>
                                        {IconComponent ? (
                                            <span className="component-icon">
                                                <IconComponent size={14} />
                                            </span>
                                        ) : (
                                            <span className="component-icon">
                                                <Box size={14} />
                                            </span>
                                        )}
                                        <span className="component-item-name">
                                            {componentName}
                                        </span>
                                        <button
                                            className="component-remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveComponent(originalIndex);
                                            }}
                                            title="移除组件"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="component-item-content">
                                            {componentInspectorRegistry?.hasInspector(component)
                                                ? componentInspectorRegistry.render({
                                                    component,
                                                    entity,
                                                    version: componentVersion + localVersion,
                                                    onChange: (propName: string, value: unknown) =>
                                                        handlePropertyChange(component, propName, value),
                                                    onAction: handlePropertyAction
                                                })
                                                : <PropertyInspector
                                                    component={component}
                                                    entity={entity}
                                                    version={componentVersion + localVersion}
                                                    onChange={(propName: string, value: unknown) =>
                                                        handlePropertyChange(component, propName, value)
                                                    }
                                                    onAction={handlePropertyAction}
                                                />
                                            }
                                            {/* Append-mode inspectors (shown after default inspector) */}
                                            {componentInspectorRegistry?.renderAppendInspectors({
                                                component,
                                                entity,
                                                version: componentVersion + localVersion,
                                                onChange: (propName: string, value: unknown) =>
                                                    handlePropertyChange(component, propName, value),
                                                onAction: handlePropertyAction
                                            })}
                                            {/* Dynamic component actions from plugins */}
                                            {componentActionRegistry?.getActionsForComponent(componentName).map((action) => {
                                                // 解析图标：支持字符串（Lucide 图标名）或 React 元素
                                                const ActionIcon = typeof action.icon === 'string'
                                                    ? (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[action.icon]
                                                    : null;
                                                return (
                                                    <button
                                                        key={action.id}
                                                        className="component-action-btn"
                                                        onClick={() => action.execute(component, entity)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 12px',
                                                            width: '100%',
                                                            marginTop: '8px',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            background: 'var(--accent-color, #0078d4)',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {ActionIcon ? <ActionIcon size={14} /> : action.icon}
                                                        {action.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
