import React from 'react';
import { IFieldEditor, FieldEditorProps } from '@esengine/editor-core';

interface Vector2 { x: number; y: number; }
interface Vector3 extends Vector2 { z: number; }
interface Vector4 extends Vector3 { w: number; }

const VectorInput: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    readonly?: boolean;
}> = ({ label, value, onChange, readonly }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: '#888', fontSize: '10px', minWidth: '12px' }}>{label}:</span>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            disabled={readonly}
            step={0.1}
            style={{
                width: '60px',
                padding: '2px 4px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '3px',
                color: '#e0e0e0',
                fontSize: '11px'
            }}
        />
    </div>
);

export class Vector2FieldEditor implements IFieldEditor<Vector2> {
    readonly type = 'vector2';
    readonly name = 'Vector2 Field Editor';
    readonly priority = 100;

    canHandle(fieldType: string): boolean {
        return fieldType === 'vector2' || fieldType === 'vec2';
    }

    render({ label, value, onChange, context }: FieldEditorProps<Vector2>): React.ReactElement {
        const v = value || { x: 0, y: 0 };

        return (
            <div className="property-field">
                <label className="property-label">{label}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <VectorInput
                        label="X"
                        value={v.x}
                        onChange={(x) => onChange({ ...v, x })}
                        readonly={context.readonly}
                    />
                    <VectorInput
                        label="Y"
                        value={v.y}
                        onChange={(y) => onChange({ ...v, y })}
                        readonly={context.readonly}
                    />
                </div>
            </div>
        );
    }
}

export class Vector3FieldEditor implements IFieldEditor<Vector3> {
    readonly type = 'vector3';
    readonly name = 'Vector3 Field Editor';
    readonly priority = 100;

    canHandle(fieldType: string): boolean {
        return fieldType === 'vector3' || fieldType === 'vec3';
    }

    render({ label, value, onChange, context }: FieldEditorProps<Vector3>): React.ReactElement {
        const v = value || { x: 0, y: 0, z: 0 };

        return (
            <div className="property-field">
                <label className="property-label">{label}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <VectorInput
                        label="X"
                        value={v.x}
                        onChange={(x) => onChange({ ...v, x })}
                        readonly={context.readonly}
                    />
                    <VectorInput
                        label="Y"
                        value={v.y}
                        onChange={(y) => onChange({ ...v, y })}
                        readonly={context.readonly}
                    />
                    <VectorInput
                        label="Z"
                        value={v.z}
                        onChange={(z) => onChange({ ...v, z })}
                        readonly={context.readonly}
                    />
                </div>
            </div>
        );
    }
}

export class Vector4FieldEditor implements IFieldEditor<Vector4> {
    readonly type = 'vector4';
    readonly name = 'Vector4 Field Editor';
    readonly priority = 100;

    canHandle(fieldType: string): boolean {
        return fieldType === 'vector4' || fieldType === 'vec4' || fieldType === 'quaternion';
    }

    render({ label, value, onChange, context }: FieldEditorProps<Vector4>): React.ReactElement {
        const v = value || { x: 0, y: 0, z: 0, w: 0 };

        return (
            <div className="property-field">
                <label className="property-label">{label}</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <VectorInput
                        label="X"
                        value={v.x}
                        onChange={(x) => onChange({ ...v, x })}
                        readonly={context.readonly}
                    />
                    <VectorInput
                        label="Y"
                        value={v.y}
                        onChange={(y) => onChange({ ...v, y })}
                        readonly={context.readonly}
                    />
                    <VectorInput
                        label="Z"
                        value={v.z}
                        onChange={(z) => onChange({ ...v, z })}
                        readonly={context.readonly}
                    />
                    <VectorInput
                        label="W"
                        value={v.w}
                        onChange={(w) => onChange({ ...v, w })}
                        readonly={context.readonly}
                    />
                </div>
            </div>
        );
    }
}