import React, { useState, useEffect, useRef } from 'react';
import { Component } from '@esengine/ecs-framework';
import type { IComponentInspector, ComponentInspectorContext } from '@esengine/editor-core';
import { UITransformComponent, AnchorPreset } from '@esengine/ui';

const DraggableNumberInput: React.FC<{
    axis?: 'x' | 'y' | 'z' | 'w';
    label?: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    readOnly?: boolean;
}> = ({ axis, label, value, onChange, min, max, step = 0.1, readOnly }) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, value: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (readOnly) return;
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, value: value ?? 0 };
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - dragStartRef.current.x;
            const sensitivity = e.shiftKey ? 0.01 : step;
            let newValue = dragStartRef.current.value + delta * sensitivity;

            if (min !== undefined) newValue = Math.max(min, newValue);
            if (max !== undefined) newValue = Math.min(max, newValue);

            onChange(Math.round(newValue * 1000) / 1000);
        };

        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onChange, step, min, max]);

    const axisClass = axis ? `property-vector-axis-${axis}` : '';
    const displayLabel = label || (axis ? axis.toUpperCase() : '');

    return (
        <div className="property-vector-axis-compact">
            <span
                className={`property-vector-axis-label ${axisClass}`}
                onMouseDown={handleMouseDown}
                style={{ cursor: readOnly ? 'default' : 'ew-resize' }}
            >
                {displayLabel}
            </span>
            <input
                type="number"
                className="property-input property-input-number-compact"
                value={value ?? 0}
                min={min}
                max={max}
                step={step}
                disabled={readOnly}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
            />
        </div>
    );
};

const Vector2Row: React.FC<{
    label: string;
    valueX: number;
    valueY: number;
    onChangeX: (value: number) => void;
    onChangeY: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    readOnly?: boolean;
}> = ({ label, valueX, valueY, onChangeX, onChangeY, min, max, step, readOnly }) => (
    <div className="property-field">
        <label className="property-label">{label}</label>
        <div className="property-vector-compact">
            <DraggableNumberInput axis="x" value={valueX} onChange={onChangeX} min={min} max={max} step={step} readOnly={readOnly} />
            <DraggableNumberInput axis="y" value={valueY} onChange={onChangeY} min={min} max={max} step={step} readOnly={readOnly} />
        </div>
    </div>
);

const NumberRow: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    readOnly?: boolean;
}> = ({ label, value, onChange, min, max, step = 0.1, readOnly }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartValue, setDragStartValue] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (readOnly) return;
        setIsDragging(true);
        setDragStartX(e.clientX);
        setDragStartValue(value);
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - dragStartX;
            const sensitivity = e.shiftKey ? 0.01 : step;
            let newValue = dragStartValue + delta * sensitivity;

            if (min !== undefined) newValue = Math.max(min, newValue);
            if (max !== undefined) newValue = Math.min(max, newValue);

            onChange(parseFloat(newValue.toFixed(3)));
        };

        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStartX, dragStartValue, step, min, max, onChange]);

    return (
        <div className="property-field">
            <label
                className="property-label property-label-draggable"
                onMouseDown={handleMouseDown}
                style={{ cursor: readOnly ? 'default' : 'ew-resize' }}
            >
                {label}
            </label>
            <input
                type="number"
                className="property-input property-input-number"
                value={value ?? 0}
                min={min}
                max={max}
                step={step}
                disabled={readOnly}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
            />
        </div>
    );
};

const BooleanRow: React.FC<{
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    readOnly?: boolean;
}> = ({ label, value, onChange, readOnly }) => (
    <div className="property-field property-field-boolean">
        <label className="property-label">{label}</label>
        <button
            className={`property-toggle ${value ? 'property-toggle-on' : 'property-toggle-off'}`}
            disabled={readOnly}
            onClick={() => onChange(!value)}
        >
            <span className="property-toggle-thumb" />
        </button>
    </div>
);

const AnchorPresetGrid: React.FC<{
    currentPreset: string;
    onSelect: (preset: AnchorPreset) => void;
}> = ({ currentPreset, onSelect }) => {
    const presets: AnchorPreset[][] = [
        [AnchorPreset.TopLeft, AnchorPreset.TopCenter, AnchorPreset.TopRight],
        [AnchorPreset.MiddleLeft, AnchorPreset.MiddleCenter, AnchorPreset.MiddleRight],
        [AnchorPreset.BottomLeft, AnchorPreset.BottomCenter, AnchorPreset.BottomRight],
    ];

    const getAnchorPosition = (preset: AnchorPreset): { x: number; y: number } => {
        const positions: Record<AnchorPreset, { x: number; y: number }> = {
            [AnchorPreset.TopLeft]: { x: 3, y: 3 },
            [AnchorPreset.TopCenter]: { x: 10, y: 3 },
            [AnchorPreset.TopRight]: { x: 17, y: 3 },
            [AnchorPreset.MiddleLeft]: { x: 3, y: 10 },
            [AnchorPreset.MiddleCenter]: { x: 10, y: 10 },
            [AnchorPreset.MiddleRight]: { x: 17, y: 10 },
            [AnchorPreset.BottomLeft]: { x: 3, y: 17 },
            [AnchorPreset.BottomCenter]: { x: 10, y: 17 },
            [AnchorPreset.BottomRight]: { x: 17, y: 17 },
            [AnchorPreset.StretchAll]: { x: 10, y: 10 },
        };
        return positions[preset];
    };

    return (
        <div className="property-field" style={{ alignItems: 'flex-start' }}>
            <label className="property-label">Anchor</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 24px)',
                    gridTemplateRows: 'repeat(3, 24px)',
                    gap: '2px',
                    padding: '4px',
                    background: 'var(--color-bg-inset)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-default)',
                }}>
                    {presets.flat().map((preset) => {
                        const pos = getAnchorPosition(preset);
                        const isActive = currentPreset === preset;
                        return (
                            <button
                                key={preset}
                                onClick={() => onSelect(preset)}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    padding: 0,
                                    border: '1px solid',
                                    borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border-default)',
                                    borderRadius: 'var(--radius-sm)',
                                    background: isActive ? 'var(--color-primary-subtle)' : 'var(--color-bg-elevated)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all var(--transition-fast)',
                                }}
                                title={preset}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20">
                                    <rect
                                        x="2" y="2" width="16" height="16"
                                        fill="none"
                                        stroke={isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)'}
                                        strokeWidth="1"
                                        strokeDasharray="2,2"
                                    />
                                    <circle
                                        cx={pos.x} cy={pos.y} r="3"
                                        fill={isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'}
                                    />
                                </svg>
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={() => onSelect(AnchorPreset.StretchAll)}
                    style={{
                        width: '100%',
                        height: '22px',
                        padding: '0 8px',
                        border: '1px solid',
                        borderColor: currentPreset === AnchorPreset.StretchAll ? 'var(--color-primary)' : 'var(--color-border-default)',
                        borderRadius: 'var(--radius-sm)',
                        background: currentPreset === AnchorPreset.StretchAll ? 'var(--color-primary-subtle)' : 'var(--color-bg-elevated)',
                        color: currentPreset === AnchorPreset.StretchAll ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all var(--transition-fast)',
                    }}
                    title="Stretch All"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14">
                        <rect x="1" y="1" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" />
                        <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    Stretch
                </button>
            </div>
        </div>
    );
};

export class UITransformInspector implements IComponentInspector<UITransformComponent> {
    readonly id = 'uitransform-inspector';
    readonly name = 'UITransform Inspector';
    readonly priority = 100;
    readonly targetComponents = ['UITransform', 'UITransformComponent'];

    canHandle(component: Component): component is UITransformComponent {
        return component instanceof UITransformComponent ||
               component.constructor.name === 'UITransformComponent';
    }

    render(context: ComponentInspectorContext): React.ReactElement {
        const transform = context.component as UITransformComponent;
        const onChange = context.onChange;

        const handleChange = (prop: string, value: number | boolean | string) => {
            onChange?.(prop, value);
        };

        const detectCurrentPreset = (): string => {
            const { anchorMinX, anchorMinY, anchorMaxX, anchorMaxY } = transform;
            if (anchorMinX === 0 && anchorMinY === 0 && anchorMaxX === 1 && anchorMaxY === 1) {
                return AnchorPreset.StretchAll;
            }
            if (anchorMinX === anchorMaxX && anchorMinY === anchorMaxY) {
                if (anchorMinX === 0 && anchorMinY === 0) return AnchorPreset.TopLeft;
                if (anchorMinX === 0.5 && anchorMinY === 0) return AnchorPreset.TopCenter;
                if (anchorMinX === 1 && anchorMinY === 0) return AnchorPreset.TopRight;
                if (anchorMinX === 0 && anchorMinY === 0.5) return AnchorPreset.MiddleLeft;
                if (anchorMinX === 0.5 && anchorMinY === 0.5) return AnchorPreset.MiddleCenter;
                if (anchorMinX === 1 && anchorMinY === 0.5) return AnchorPreset.MiddleRight;
                if (anchorMinX === 0 && anchorMinY === 1) return AnchorPreset.BottomLeft;
                if (anchorMinX === 0.5 && anchorMinY === 1) return AnchorPreset.BottomCenter;
                if (anchorMinX === 1 && anchorMinY === 1) return AnchorPreset.BottomRight;
            }
            return '';
        };

        const handlePresetSelect = (preset: AnchorPreset) => {
            const presetValues: Record<AnchorPreset, [number, number, number, number]> = {
                [AnchorPreset.TopLeft]: [0, 0, 0, 0],
                [AnchorPreset.TopCenter]: [0.5, 0, 0.5, 0],
                [AnchorPreset.TopRight]: [1, 0, 1, 0],
                [AnchorPreset.MiddleLeft]: [0, 0.5, 0, 0.5],
                [AnchorPreset.MiddleCenter]: [0.5, 0.5, 0.5, 0.5],
                [AnchorPreset.MiddleRight]: [1, 0.5, 1, 0.5],
                [AnchorPreset.BottomLeft]: [0, 1, 0, 1],
                [AnchorPreset.BottomCenter]: [0.5, 1, 0.5, 1],
                [AnchorPreset.BottomRight]: [1, 1, 1, 1],
                [AnchorPreset.StretchAll]: [0, 0, 1, 1],
            };

            const [minX, minY, maxX, maxY] = presetValues[preset];
            handleChange('anchorMinX', minX);
            handleChange('anchorMinY', minY);
            handleChange('anchorMaxX', maxX);
            handleChange('anchorMaxY', maxY);
        };

        return (
            <div className="property-inspector">
                <AnchorPresetGrid
                    currentPreset={detectCurrentPreset()}
                    onSelect={handlePresetSelect}
                />

                <Vector2Row
                    label="Position"
                    valueX={transform.x}
                    valueY={transform.y}
                    onChangeX={(v) => handleChange('x', v)}
                    onChangeY={(v) => handleChange('y', v)}
                />

                <Vector2Row
                    label="Size"
                    valueX={transform.width}
                    valueY={transform.height}
                    onChangeX={(v) => handleChange('width', v)}
                    onChangeY={(v) => handleChange('height', v)}
                    min={0}
                />

                <Vector2Row
                    label="Anchor Min"
                    valueX={transform.anchorMinX}
                    valueY={transform.anchorMinY}
                    onChangeX={(v) => handleChange('anchorMinX', v)}
                    onChangeY={(v) => handleChange('anchorMinY', v)}
                    min={0}
                    max={1}
                    step={0.01}
                />

                <Vector2Row
                    label="Anchor Max"
                    valueX={transform.anchorMaxX}
                    valueY={transform.anchorMaxY}
                    onChangeX={(v) => handleChange('anchorMaxX', v)}
                    onChangeY={(v) => handleChange('anchorMaxY', v)}
                    min={0}
                    max={1}
                    step={0.01}
                />

                <Vector2Row
                    label="Pivot"
                    valueX={transform.pivotX}
                    valueY={transform.pivotY}
                    onChangeX={(v) => handleChange('pivotX', v)}
                    onChangeY={(v) => handleChange('pivotY', v)}
                    min={0}
                    max={1}
                    step={0.01}
                />

                <NumberRow
                    label="Rotation"
                    value={transform.rotation}
                    onChange={(v) => handleChange('rotation', v)}
                    step={0.01}
                />

                <Vector2Row
                    label="Scale"
                    valueX={transform.scaleX}
                    valueY={transform.scaleY}
                    onChangeX={(v) => handleChange('scaleX', v)}
                    onChangeY={(v) => handleChange('scaleY', v)}
                    step={0.01}
                />

                <NumberRow
                    label="Z Index"
                    value={transform.zIndex}
                    onChange={(v) => handleChange('zIndex', Math.round(v))}
                    step={1}
                />

                <NumberRow
                    label="Alpha"
                    value={transform.alpha}
                    onChange={(v) => handleChange('alpha', v)}
                    min={0}
                    max={1}
                    step={0.01}
                />

                <BooleanRow
                    label="Visible"
                    value={transform.visible}
                    onChange={(v) => handleChange('visible', v)}
                />
            </div>
        );
    }
}
