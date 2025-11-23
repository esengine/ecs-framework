import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { IPropertyRenderer, PropertyContext } from '@esengine/editor-core';

export class FallbackRenderer implements IPropertyRenderer<any> {
    readonly id = 'app.fallback';
    readonly name = 'Fallback Renderer';
    readonly priority = -1000;

    canHandle(_value: any, _context: PropertyContext): _value is any {
        return true;
    }

    render(value: any, context: PropertyContext): React.ReactElement {
        const typeInfo = this.getTypeInfo(value);

        return (
            <div className="property-field" style={{ opacity: 0.6 }}>
                <label className="property-label">{context.name}</label>
                <span
                    className="property-value-text"
                    style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9em' }}
                    title="No renderer registered for this type"
                >
                    {typeInfo}
                </span>
            </div>
        );
    }

    private getTypeInfo(value: any): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';

        const type = typeof value;

        if (type === 'object') {
            if (Array.isArray(value)) {
                return `Array(${value.length})`;
            }

            const constructor = value.constructor?.name;
            if (constructor && constructor !== 'Object') {
                return `[${constructor}]`;
            }

            const keys = Object.keys(value);
            if (keys.length === 0) return '{}';
            if (keys.length <= 3) {
                return `{${keys.join(', ')}}`;
            }
            return `{${keys.slice(0, 3).join(', ')}...}`;
        }

        return `[${type}]`;
    }
}

export class ArrayRenderer implements IPropertyRenderer<any[]> {
    readonly id = 'app.array';
    readonly name = 'Array Renderer';
    readonly priority = 50;

    canHandle(value: any, _context: PropertyContext): value is any[] {
        return Array.isArray(value);
    }

    render(value: any[], context: PropertyContext): React.ReactElement {
        const [isExpanded, setIsExpanded] = React.useState(false);
        const depth = context.depth ?? 0;

        if (value.length === 0) {
            return (
                <div className="property-field">
                    <label className="property-label">{context.name}</label>
                    <span className="property-value-text" style={{ color: '#666' }}>
                        []
                    </span>
                </div>
            );
        }

        const isStringArray = value.every((item) => typeof item === 'string');
        if (isStringArray && value.length <= 5) {
            return (
                <div className="property-field">
                    <label className="property-label">{context.name}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {(value as string[]).map((item, index) => (
                            <span
                                key={index}
                                style={{
                                    padding: '2px 8px',
                                    backgroundColor: '#2d4a3e',
                                    color: '#8fbc8f',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace'
                                }}
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div style={{ marginLeft: depth > 0 ? '12px' : 0 }}>
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 0',
                        fontSize: '11px',
                        borderBottom: '1px solid #333',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <span style={{ color: '#9cdcfe', marginLeft: '4px' }}>{context.name}</span>
                    <span
                        style={{
                            color: '#666',
                            fontFamily: 'monospace',
                            marginLeft: '8px',
                            fontSize: '10px'
                        }}
                    >
                        Array({value.length})
                    </span>
                </div>
            </div>
        );
    }
}
