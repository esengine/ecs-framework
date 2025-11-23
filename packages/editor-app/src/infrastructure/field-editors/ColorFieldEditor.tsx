import React, { useState, useRef, useEffect } from 'react';
import { IFieldEditor, FieldEditorProps } from '@esengine/editor-core';

interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

function rgbaToHex(color: Color): string {
    const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function hexToRgba(hex: string): Color {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result && result[1] && result[2] && result[3]) {
        return {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
            a: 1
        };
    }
    return { r: 0, g: 0, b: 0, a: 1 };
}

export class ColorFieldEditor implements IFieldEditor<Color> {
    readonly type = 'color';
    readonly name = 'Color Field Editor';
    readonly priority = 100;

    canHandle(fieldType: string): boolean {
        return fieldType === 'color' || fieldType === 'rgba' || fieldType === 'rgb';
    }

    render({ label, value, onChange, context }: FieldEditorProps<Color>): React.ReactElement {
        const color = value || { r: 1, g: 1, b: 1, a: 1 };
        const [showPicker, setShowPicker] = useState(false);
        const pickerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                    setShowPicker(false);
                }
            };

            if (showPicker) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [showPicker]);

        const hexColor = rgbaToHex(color);
        const rgbDisplay = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a.toFixed(2)})`;

        return (
            <div className="property-field" style={{ position: 'relative' }}>
                <label className="property-label">{label}</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        onClick={() => !context.readonly && setShowPicker(!showPicker)}
                        disabled={context.readonly}
                        style={{
                            width: '32px',
                            height: '24px',
                            backgroundColor: hexColor,
                            border: '2px solid #444',
                            borderRadius: '3px',
                            cursor: context.readonly ? 'default' : 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {color.a < 1 && (
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, #fff 0% 50%)',
                                    backgroundPosition: '0 0, 8px 8px',
                                    backgroundSize: '16px 16px',
                                    opacity: 1 - color.a
                                }}
                            />
                        )}
                    </button>

                    <span style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>
                        {rgbDisplay}
                    </span>

                    {showPicker && (
                        <div
                            ref={pickerRef}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: '4px',
                                zIndex: 1000,
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                padding: '8px',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div style={{ marginBottom: '8px' }}>
                                <label style={{ fontSize: '10px', color: '#888' }}>Hex: </label>
                                <input
                                    type="color"
                                    value={hexColor}
                                    onChange={(e) => {
                                        const newColor = hexToRgba(e.target.value);
                                        onChange({ ...newColor, a: color.a });
                                    }}
                                    style={{ marginLeft: '4px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                <input
                                    type="number"
                                    value={Math.round(color.r * 255)}
                                    onChange={(e) => onChange({ ...color, r: (parseInt(e.target.value) || 0) / 255 })}
                                    min={0}
                                    max={255}
                                    style={{
                                        width: '50px',
                                        padding: '2px',
                                        backgroundColor: '#1e1e1e',
                                        border: '1px solid #444',
                                        borderRadius: '2px',
                                        color: '#e0e0e0',
                                        fontSize: '11px'
                                    }}
                                />
                                <input
                                    type="number"
                                    value={Math.round(color.g * 255)}
                                    onChange={(e) => onChange({ ...color, g: (parseInt(e.target.value) || 0) / 255 })}
                                    min={0}
                                    max={255}
                                    style={{
                                        width: '50px',
                                        padding: '2px',
                                        backgroundColor: '#1e1e1e',
                                        border: '1px solid #444',
                                        borderRadius: '2px',
                                        color: '#e0e0e0',
                                        fontSize: '11px'
                                    }}
                                />
                                <input
                                    type="number"
                                    value={Math.round(color.b * 255)}
                                    onChange={(e) => onChange({ ...color, b: (parseInt(e.target.value) || 0) / 255 })}
                                    min={0}
                                    max={255}
                                    style={{
                                        width: '50px',
                                        padding: '2px',
                                        backgroundColor: '#1e1e1e',
                                        border: '1px solid #444',
                                        borderRadius: '2px',
                                        color: '#e0e0e0',
                                        fontSize: '11px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <label style={{ fontSize: '10px', color: '#888' }}>Alpha:</label>
                                <input
                                    type="range"
                                    value={color.a}
                                    onChange={(e) => onChange({ ...color, a: parseFloat(e.target.value) })}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ fontSize: '10px', color: '#888', minWidth: '30px' }}>
                                    {(color.a * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
