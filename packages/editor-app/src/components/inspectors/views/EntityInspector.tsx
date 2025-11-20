import { useState } from 'react';
import { Settings, ChevronDown, ChevronRight, X, Plus } from 'lucide-react';
import { Entity, Component, Core } from '@esengine/ecs-framework';
import { MessageHub, CommandManager, ComponentRegistry } from '@esengine/editor-core';
import { PropertyInspector } from '../../PropertyInspector';
import { RemoveComponentCommand, UpdateComponentCommand, AddComponentCommand } from '../../../application/commands/component';
import '../../../styles/EntityInspector.css';

interface EntityInspectorProps {
    entity: Entity;
    messageHub: MessageHub;
    commandManager: CommandManager;
    componentVersion: number;
}

export function EntityInspector({ entity, messageHub, commandManager, componentVersion }: EntityInspectorProps) {
    const [expandedComponents, setExpandedComponents] = useState<Set<number>>(new Set());
    const [showComponentMenu, setShowComponentMenu] = useState(false);

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
        if (component) {
            const command = new RemoveComponentCommand(
                messageHub,
                entity,
                component
            );
            commandManager.execute(command);
        }
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
                    <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>组件</span>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowComponentMenu(!showComponentMenu)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #4a4a4a',
                                    borderRadius: '4px',
                                    color: '#e0e0e0',
                                    cursor: 'pointer',
                                    padding: '2px 6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11px'
                                }}
                            >
                                <Plus size={12} />
                                添加
                            </button>
                            {showComponentMenu && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '4px',
                                        backgroundColor: '#2a2a2a',
                                        border: '1px solid #4a4a4a',
                                        borderRadius: '4px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                        zIndex: 1000,
                                        minWidth: '150px',
                                        maxHeight: '200px',
                                        overflowY: 'auto'
                                    }}
                                >
                                    {availableComponents.length === 0 ? (
                                        <div style={{ padding: '8px 12px', color: '#888', fontSize: '11px' }}>
                                            没有可用组件
                                        </div>
                                    ) : (
                                        availableComponents.map((info) => (
                                            <button
                                                key={info.name}
                                                onClick={() => info.type && handleAddComponent(info.type)}
                                                style={{
                                                    display: 'block',
                                                    width: '100%',
                                                    padding: '6px 12px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#e0e0e0',
                                                    fontSize: '12px',
                                                    textAlign: 'left',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3a3a3a')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                {info.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {entity.components.map((component: Component, index: number) => {
                            const isExpanded = expandedComponents.has(index);
                            const componentName = component.constructor?.name || 'Component';

                            return (
                                <div
                                    key={`${componentName}-${index}-${componentVersion}`}
                                    style={{
                                        marginBottom: '2px',
                                        backgroundColor: '#2a2a2a',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div
                                        onClick={() => toggleComponentExpanded(index)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '6px 8px',
                                            backgroundColor: '#3a3a3a',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            borderBottom: isExpanded ? '1px solid #4a4a4a' : 'none'
                                        }}
                                    >
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        <span
                                            style={{
                                                marginLeft: '6px',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                color: '#e0e0e0',
                                                flex: 1
                                            }}
                                        >
                                            {componentName}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveComponent(index);
                                            }}
                                            title="移除组件"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#888',
                                                cursor: 'pointer',
                                                padding: '2px',
                                                borderRadius: '3px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ padding: '6px 8px' }}>
                                            <PropertyInspector
                                                component={component}
                                                onChange={(propName: string, value: unknown) =>
                                                    handlePropertyChange(component, propName, value)
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
