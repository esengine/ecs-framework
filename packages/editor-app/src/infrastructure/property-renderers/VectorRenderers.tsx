import React from 'react';
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

const VectorValue: React.FC<{
    label: string;
    value: number;
    axis: 'x' | 'y' | 'z' | 'w';
    decimals: number;
}> = ({ label, value, axis, decimals }) => (
    <div className="property-vector-axis-compact">
        <span className={`property-vector-axis-label property-vector-axis-${axis}`}>{label}</span>
        <span className="property-input property-input-number property-input-number-compact" style={{ cursor: 'default' }}>
            {formatNumber(value, decimals)}
        </span>
    </div>
);

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
                <div className="property-vector-compact">
                    <VectorValue label="X" value={value.x} axis="x" decimals={decimals} />
                    <VectorValue label="Y" value={value.y} axis="y" decimals={decimals} />
                </div>
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
                <div className="property-vector-compact">
                    <VectorValue label="X" value={value.x} axis="x" decimals={decimals} />
                    <VectorValue label="Y" value={value.y} axis="y" decimals={decimals} />
                    <VectorValue label="Z" value={value.z} axis="z" decimals={decimals} />
                </div>
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
                <div className="property-color-wrapper">
                    <div
                        className="property-color-preview"
                        style={{ backgroundColor: colorHex }}
                    />
                    <span className="property-input property-input-color-text" style={{ cursor: 'default' }}>
                        {colorHex.toUpperCase()}
                    </span>
                </div>
            </div>
        );
    }
}
