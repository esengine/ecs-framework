import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { IPropertyRenderer, PropertyContext } from '@esengine/editor-core';
import { formatNumber } from '../../components/inspectors/utils';

interface Vector2 {
    x: number;
    y: number;
}

interface Vector3 extends Vector2 {
    z: number;
}

interface Vector4 extends Vector3 {
    w: number;
}

interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

export class Vector2Renderer implements IPropertyRenderer<Vector2> {
    readonly id = 'app.vector2';
    readonly name = 'Vector2 Renderer';
    readonly priority = 80;

    canHandle(value: any, _context: PropertyContext): value is Vector2 {
        return (
            typeof value === 'object' &&
            value !== null &&
            typeof value.x === 'number' &&
            typeof value.y === 'number' &&
            !('z' in value) &&
            Object.keys(value).length === 2
        );
    }

    render(value: Vector2, context: PropertyContext): React.ReactElement {
        const decimals = context.decimalPlaces ?? 2;
        return (
            <div className="property-field">
                <label className="property-label">{context.name}</label>
                <span className="property-value-text" style={{ color: '#9cdcfe', fontFamily: 'monospace' }}>
                    ({formatNumber(value.x, decimals)}, {formatNumber(value.y, decimals)})
                </span>
            </div>
        );
    }
}

export class Vector3Renderer implements IPropertyRenderer<Vector3> {
    readonly id = 'app.vector3';
    readonly name = 'Vector3 Renderer';
    readonly priority = 80;

    canHandle(value: any, _context: PropertyContext): value is Vector3 {
        return (
            typeof value === 'object' &&
            value !== null &&
            typeof value.x === 'number' &&
            typeof value.y === 'number' &&
            typeof value.z === 'number' &&
            !('w' in value) &&
            Object.keys(value).length === 3
        );
    }

    render(value: Vector3, context: PropertyContext): React.ReactElement {
        const decimals = context.decimalPlaces ?? 2;
        return (
            <div className="property-field">
                <label className="property-label">{context.name}</label>
                <span className="property-value-text" style={{ color: '#9cdcfe', fontFamily: 'monospace' }}>
                    ({formatNumber(value.x, decimals)}, {formatNumber(value.y, decimals)}, {formatNumber(value.z, decimals)})
                </span>
            </div>
        );
    }
}

export class ColorRenderer implements IPropertyRenderer<Color> {
    readonly id = 'app.color';
    readonly name = 'Color Renderer';
    readonly priority = 85;

    canHandle(value: any, _context: PropertyContext): value is Color {
        return (
            typeof value === 'object' &&
            value !== null &&
            typeof value.r === 'number' &&
            typeof value.g === 'number' &&
            typeof value.b === 'number' &&
            typeof value.a === 'number' &&
            Object.keys(value).length === 4
        );
    }

    render(value: Color, context: PropertyContext): React.ReactElement {
        const r = Math.round(value.r * 255);
        const g = Math.round(value.g * 255);
        const b = Math.round(value.b * 255);
        const colorHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        return (
            <div className="property-field">
                <label className="property-label">{context.name}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: colorHex,
                            border: '1px solid #444',
                            borderRadius: '2px'
                        }}
                    />
                    <span className="property-value-text" style={{ fontFamily: 'monospace' }}>
                        rgba({r}, {g}, {b}, {value.a.toFixed(2)})
                    </span>
                </div>
            </div>
        );
    }
}