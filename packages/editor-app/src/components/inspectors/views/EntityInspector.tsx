import { useState } from 'react';
import { Settings, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Entity } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { PropertyInspector } from '../../PropertyInspector';
import '../../../styles/EntityInspector.css';

interface EntityInspectorProps {
    entity: Entity;
    messageHub: MessageHub;
    componentVersion: number;
}

export function EntityInspector({ entity, messageHub, componentVersion }: EntityInspectorProps) {
    const [expandedComponents, setExpandedComponents] = useState<Set<number>>(new Set());

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

    const handleRemoveComponent = (index: number) => {
        const component = entity.components[index];
        if (component) {
            entity.removeComponent(component);
            messageHub.publish('component:removed', { entity, component });
        }
    };

    const handlePropertyChange = (component: unknown, propertyName: string, value: unknown) => {
        messageHub.publish('component:property:changed', {
            entity,
            component,
            propertyName,
            value
        });
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

                {entity.components.length > 0 && (
                    <div className="inspector-section">
                        <div className="section-title">组件</div>
                        {entity.components.map((component, index: number) => {
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
                )}
            </div>
        </div>
    );
}
