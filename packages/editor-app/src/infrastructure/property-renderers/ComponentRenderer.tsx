import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { IPropertyRenderer, PropertyContext, PropertyRendererRegistry } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';

interface ComponentData {
    typeName: string;
    properties: Record<string, any>;
}

export class ComponentRenderer implements IPropertyRenderer<ComponentData> {
    readonly id = 'app.component';
    readonly name = 'Component Renderer';
    readonly priority = 75;

    canHandle(value: any, _context: PropertyContext): value is ComponentData {
        return (
            typeof value === 'object' &&
            value !== null &&
            typeof value.typeName === 'string' &&
            typeof value.properties === 'object' &&
            value.properties !== null
        );
    }

    render(value: ComponentData, context: PropertyContext): React.ReactElement {
        const [isExpanded, setIsExpanded] = useState(context.expandByDefault ?? false);
        const depth = context.depth ?? 0;

        return (
            <div style={{ marginLeft: depth > 0 ? '12px' : 0 }}>
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '6px 8px',
                        backgroundColor: '#3a3a3a',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderRadius: '4px',
                        marginBottom: '2px'
                    }}
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <Settings size={14} style={{ marginLeft: '4px', color: '#888' }} />
                    <span
                        style={{
                            marginLeft: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#e0e0e0'
                        }}
                    >
                        {value.typeName}
                    </span>
                </div>

                {isExpanded && (
                    <div style={{ marginLeft: '8px', borderLeft: '1px solid #444', paddingLeft: '8px' }}>
                        {Object.entries(value.properties).map(([key, propValue]) => {
                            const registry = Core.services.resolve(PropertyRendererRegistry);
                            const propContext: PropertyContext = {
                                ...context,
                                name: key,
                                depth: depth + 1,
                                path: [...(context.path || []), key]
                            };

                            const rendered = registry.render(propValue, propContext);
                            if (rendered) {
                                return <div key={key}>{rendered}</div>;
                            }

                            return (
                                <div key={key} className="property-field">
                                    <label className="property-label">{key}</label>
                                    <span className="property-value-text" style={{ color: '#666', fontStyle: 'italic' }}>
                                        [No Renderer]
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
}
