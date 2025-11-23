import { useState } from 'react';
import { Settings, ChevronDown, ChevronRight, X, Plus, Box } from 'lucide-react';
import { Entity, Component, Core, getComponentDependencies, getComponentTypeName, getComponentInstanceTypeName } from '@esengine/ecs-framework';
import { MessageHub, CommandManager, ComponentRegistry } from '@esengine/editor-core';
import { PropertyInspector } from '../../PropertyInspector';
import { NotificationService } from '../../../services/NotificationService';
import { RemoveComponentCommand, UpdateComponentCommand, AddComponentCommand } from '../../../application/commands/component';
import '../../../styles/EntityInspector.css';
import * as LucideIcons from 'lucide-react';

interface EntityInspectorProps {
    entity: Entity;
    messageHub: MessageHub;
    commandManager: CommandManager;
    componentVersion: number;
}

export function EntityInspector({ entity, messageHub, commandManager, componentVersion }: EntityInspectorProps) {
    const [expandedComponents, setExpandedComponents] = useState<Set<number>>(new Set());
    const [showComponentMenu, setShowComponentMenu] = useState(false);
    const [localVersion, setLocalVersion] = useState(0);

    const componentRegistry = Core.services.resolve(ComponentRegistry);
    const availableComponents = componentRegistry?.getAllComponents() || [];

    const toggleComponentExpanded = (index: number) => {
        setExpandedComponents((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
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
        console.log('Removing component:', componentName);

        // Check if any other component depends on this one
        const dependentComponents: string[] = [];
        for (const otherComponent of entity.components) {
            if (otherComponent === component) continue;

            const dependencies = getComponentDependencies(otherComponent.constructor as any);
            const otherName = getComponentTypeName(otherComponent.constructor as any);
            console.log('Checking', otherName, 'dependencies:', dependencies);
            if (dependencies && dependencies.includes(componentName)) {
                dependentComponents.push(otherName);
            }
        }
        console.log('Dependent components:', dependentComponents);

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

    return (
        <div className="entity-inspector">
            <div className="inspector-header">
                <Settings size={16} />
                <span className="entity-name">{entity.name || `Entity #${entity.id}`}</span>
            </div>

            <div className="inspector-content">
                <div className="inspector-section">
                    <div className="section-title">基本信息</div>
                    <div className="property-field">
                        <label className="property-label">Entity ID</label>
                        <span className="property-value-text">{entity.id}</span>
                    </div>
                    <div className="property-field">
                        <label className="property-label">Enabled</label>
                        <span className="property-value-text">{entity.enabled ? 'true' : 'false'}</span>
                    </div>
                </div>

                <div className="inspector-section">
                    <div className="section-title section-title-with-action">
                        <span>组件</span>
                        <div className="component-menu-container">
                            <button
                                className="add-component-trigger"
                                onClick={() => setShowComponentMenu(!showComponentMenu)}
                            >
                                <Plus size={12} />
                                添加
                            </button>
                            {showComponentMenu && (
                                <>
                                    <div className="component-dropdown-overlay" onClick={() => setShowComponentMenu(false)} />
                                    <div className="component-dropdown">
                                        <div className="component-dropdown-header">选择组件</div>
                                        {availableComponents.length === 0 ? (
                                            <div className="component-dropdown-empty">
                                                没有可用组件
                                            </div>
                                        ) : (
                                            <div className="component-dropdown-list">
                                                {/* 按分类分组显示 */}
                                                {(() => {
                                                    const categories = new Map<string, typeof availableComponents>();
                                                    availableComponents.forEach((info) => {
                                                        const cat = info.category || 'components.category.other';
                                                        if (!categories.has(cat)) {
                                                            categories.set(cat, []);
                                                        }
                                                        categories.get(cat)!.push(info);
                                                    });

                                                    return Array.from(categories.entries()).map(([category, components]) => (
                                                        <div key={category} className="component-category-group">
                                                            <div className="component-category-label">{category}</div>
                                                            {components.map((info) => (
                                                                <button
                                                                    key={info.name}
                                                                    className="component-dropdown-item"
                                                                    onClick={() => info.type && handleAddComponent(info.type)}
                                                                >
                                                                    <span className="component-dropdown-item-name">{info.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {entity.components.length === 0 ? (
                        <div className="empty-state-small">暂无组件</div>
                    ) : (
                        entity.components.map((component: Component, index: number) => {
                            const isExpanded = expandedComponents.has(index);
                            const componentName = getComponentInstanceTypeName(component);
                            const componentInfo = componentRegistry?.getComponent(componentName);
                            const iconName = (componentInfo as { icon?: string } | undefined)?.icon;
                            const IconComponent = iconName && (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[iconName];

                            return (
                                <div
                                    key={`${componentName}-${index}`}
                                    className={`component-item-card ${isExpanded ? 'expanded' : ''}`}
                                >
                                    <div
                                        className="component-item-header"
                                        onClick={() => toggleComponentExpanded(index)}
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
                                                handleRemoveComponent(index);
                                            }}
                                            title="移除组件"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="component-item-content">
                                            <PropertyInspector
                                                component={component}
                                                entity={entity}
                                                version={componentVersion + localVersion}
                                                onChange={(propName: string, value: unknown) =>
                                                    handlePropertyChange(component, propName, value)
                                                }
                                                onAction={handlePropertyAction}
                                            />
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
