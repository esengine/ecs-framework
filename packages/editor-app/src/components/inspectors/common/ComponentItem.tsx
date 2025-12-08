import { useState } from 'react';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { PropertyContext, PropertyRendererRegistry } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';

interface ComponentData {
    typeName: string;
    properties: Record<string, any>;
}

export interface ComponentItemProps {
    component: ComponentData;
    decimalPlaces?: number;
}

export function ComponentItem({ component, decimalPlaces = 4 }: ComponentItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            style={{
                marginBottom: '2px',
                backgroundColor: '#2a2a2a',
                borderRadius: '4px',
                overflow: 'hidden'
            }}
        >
            <div
                onClick={() => setIsExpanded(!isExpanded)}
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
                <Settings size={14} style={{ marginLeft: '4px', color: '#888' }} />
                <span
                    style={{
                        marginLeft: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#e0e0e0'
                    }}
                >
                    {component.typeName}
                </span>
            </div>

            {isExpanded && (
                <div style={{ padding: '6px 8px' }}>
                    {Object.entries(component.properties).map(([propName, propValue]) => {
                        const registry = Core.services.resolve(PropertyRendererRegistry);
                        const context: PropertyContext = {
                            name: propName,
                            decimalPlaces,
                            readonly: true,
                            depth: 1
                        };
                        const rendered = registry.render(propValue, context);
                        return rendered ? <div key={propName}>{rendered}</div> : null;
                    })}
                </div>
            )}
        </div>
    );
}
