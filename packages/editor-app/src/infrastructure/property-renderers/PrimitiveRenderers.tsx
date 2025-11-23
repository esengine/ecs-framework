import React from 'react';
import { IPropertyRenderer, PropertyContext } from '@esengine/editor-core';
import { formatNumber } from '../../components/inspectors/utils';

export class StringRenderer implements IPropertyRenderer<string> {
    readonly id = 'app.string';
    readonly name = 'String Renderer';
    readonly priority = 100;

    canHandle(value: any, _context: PropertyContext): value is string {
        return typeof value === 'string';
    }

    render(value: string, context: PropertyContext): React.ReactElement {
        const displayValue = value.length > 50 ? `${value.substring(0, 50)}...` : value;
        return (
            <div className="property-field">
                <label className="property-label">{context.name}</label>
                <span className="property-value-text" title={value}>
                    {displayValue}
                </span>
            </div>
        );
    }
}

export class NumberRenderer implements IPropertyRenderer<number> {
    readonly id = 'app.number';
    readonly name = 'Number Renderer';
    readonly priority = 100;

    canHandle(value: any, _context: PropertyContext): value is number {
        return typeof value === 'number';
    }

    render(value: number, context: PropertyContext): React.ReactElement {
        const decimalPlaces = context.decimalPlaces ?? 4;
        const displayValue = formatNumber(value, decimalPlaces);

        return (
            <div className="property-field">
                <label className="property-label">{context.name}</label>
                <span className="property-value-text" style={{ color: '#b5cea8' }}>
                    {displayValue}
                </span>
            </div>
        );
    }
}

export class BooleanRenderer implements IPropertyRenderer<boolean> {
    readonly id = 'app.boolean';
    readonly name = 'Boolean Renderer';
    readonly priority = 100;

    canHandle(value: any, _context: PropertyContext): value is boolean {
        return typeof value === 'boolean';
    }

    render(value: boolean, context: PropertyContext): React.ReactElement {
        return (
            <div className="property-field">
                <label className="property-label">{context.name}</label>
                <span
                    className="property-value-text"
                    style={{ color: value ? '#4ade80' : '#f87171' }}
                >
                    {value ? 'true' : 'false'}
                </span>
            </div>
        );
    }
}

export class NullRenderer implements IPropertyRenderer<null> {
    readonly id = 'app.null';
    readonly name = 'Null Renderer';
    readonly priority = 100;

    canHandle(value: any, _context: PropertyContext): value is null {
        return value === null || value === undefined;
    }

    render(_value: null, context: PropertyContext): React.ReactElement {
        return (
            <div className="property-field">
                <label className="property-label">{context.name}</label>
                <span className="property-value-text" style={{ color: '#666' }}>
                    null
                </span>
            </div>
        );
    }
}
