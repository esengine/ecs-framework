import React, { useState, useEffect, useRef } from 'react';
import { Component } from '@esengine/esengine';
import { IComponentInspector, ComponentInspectorContext } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';
import { ChevronDown, Lock, Unlock } from 'lucide-react';
import '../../../styles/TransformInspector.css';

interface AxisInputProps {
    axis: 'x' | 'y' | 'z';
    value: number;
    onChange: (value: number) => void;
    suffix?: string;
}

function AxisInput({ axis, value, onChange, suffix }: AxisInputProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [inputValue, setInputValue] = useState(String(value ?? 0));
    const dragStartRef = useRef({ x: 0, value: 0 });

    useEffect(() => {
        setInputValue(String(value ?? 0));
    }, [value]);

    const handleBarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, value: value ?? 0 };
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - dragStartRef.current.x;
            const sensitivity = e.shiftKey ? 0.01 : e.ctrlKey ? 1 : 0.1;
            const newValue = dragStartRef.current.value + delta * sensitivity;
            const rounded = Math.round(newValue * 1000) / 1000;
            onChange(rounded);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        const parsed = parseFloat(inputValue);
        if (!isNaN(parsed)) {
            onChange(parsed);
        } else {
            setInputValue(String(value ?? 0));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
            setInputValue(String(value ?? 0));
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className={`tf-axis-input ${isDragging ? 'dragging' : ''}`}>
            <div
                className={`tf-axis-bar tf-axis-${axis}`}
                onMouseDown={handleBarMouseDown}
            />
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                onFocus={(e) => e.target.select()}
            />
            {suffix && <span className="tf-axis-suffix">{suffix}</span>}
        </div>
    );
}

// 双向箭头重置图标
function ResetIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 6H11M1 6L3 4M1 6L3 8M11 6L9 4M11 6L9 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

interface TransformRowProps {
    label: string;
    value: { x: number; y: number; z: number };
    showLock?: boolean;
    isLocked?: boolean;
    onLockChange?: (locked: boolean) => void;
    onChange: (value: { x: number; y: number; z: number }) => void;
    onReset?: () => void;
    suffix?: string;
    showDivider?: boolean;
}

function TransformRow({
    label,
    value,
    showLock = false,
    isLocked = false,
    onLockChange,
    onChange,
    onReset,
    suffix,
    showDivider = true
}: TransformRowProps) {
    const handleAxisChange = (axis: 'x' | 'y' | 'z', newValue: number) => {
        if (isLocked && showLock) {
            const oldVal = value[axis];
            if (oldVal !== 0) {
                const ratio = newValue / oldVal;
                onChange({
                    x: axis === 'x' ? newValue : value.x * ratio,
                    y: axis === 'y' ? newValue : value.y * ratio,
                    z: axis === 'z' ? newValue : value.z * ratio
                });
            } else {
                onChange({ ...value, [axis]: newValue });
            }
        } else {
            onChange({ ...value, [axis]: newValue });
        }
    };

    return (
        <>
            <div className="tf-row">
                <button className="tf-label-btn">
                    {label}
                    <ChevronDown size={10} />
                </button>
                <div className="tf-inputs">
                    <AxisInput
                        axis="x"
                        value={value?.x ?? 0}
                        onChange={(v) => handleAxisChange('x', v)}
                        suffix={suffix}
                    />
                    <AxisInput
                        axis="y"
                        value={value?.y ?? 0}
                        onChange={(v) => handleAxisChange('y', v)}
                        suffix={suffix}
                    />
                    <AxisInput
                        axis="z"
                        value={value?.z ?? 0}
                        onChange={(v) => handleAxisChange('z', v)}
                        suffix={suffix}
                    />
                </div>
                {showLock && (
                    <button
                        className={`tf-lock-btn ${isLocked ? 'locked' : ''}`}
                        onClick={() => onLockChange?.(!isLocked)}
                        title={isLocked ? 'Unlock' : 'Lock'}
                    >
                        {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                )}
                <button
                    className="tf-reset-btn"
                    onClick={onReset}
                    title="Reset"
                >
                    <ResetIcon />
                </button>
            </div>
            {showDivider && <div className="tf-divider" />}
        </>
    );
}

interface MobilityRowProps {
    value: 'static' | 'stationary' | 'movable';
    onChange: (value: 'static' | 'stationary' | 'movable') => void;
}

function MobilityRow({ value, onChange }: MobilityRowProps) {
    return (
        <div className="tf-mobility-row">
            <span className="tf-mobility-label">Mobility</span>
            <div className="tf-mobility-buttons">
                <button
                    className={`tf-mobility-btn ${value === 'static' ? 'active' : ''}`}
                    onClick={() => onChange('static')}
                >
                    Static
                </button>
                <button
                    className={`tf-mobility-btn ${value === 'stationary' ? 'active' : ''}`}
                    onClick={() => onChange('stationary')}
                >
                    Stationary
                </button>
                <button
                    className={`tf-mobility-btn ${value === 'movable' ? 'active' : ''}`}
                    onClick={() => onChange('movable')}
                >
                    Movable
                </button>
            </div>
        </div>
    );
}

function TransformInspectorContent({ context }: { context: ComponentInspectorContext }) {
    const transform = context.component as TransformComponent;
    const [isScaleLocked, setIsScaleLocked] = useState(false);
    const [mobility, setMobility] = useState<'static' | 'stationary' | 'movable'>('static');
    const [, forceUpdate] = useState({});

    const handlePositionChange = (value: { x: number; y: number; z: number }) => {
        transform.position = value;
        context.onChange?.('position', value);
        forceUpdate({});
    };

    const handleRotationChange = (value: { x: number; y: number; z: number }) => {
        transform.rotation = value;
        context.onChange?.('rotation', value);
        forceUpdate({});
    };

    const handleScaleChange = (value: { x: number; y: number; z: number }) => {
        transform.scale = value;
        context.onChange?.('scale', value);
        forceUpdate({});
    };

    return (
        <div className="tf-inspector">
            <TransformRow
                label="Location"
                value={transform.position}
                onChange={handlePositionChange}
                onReset={() => handlePositionChange({ x: 0, y: 0, z: 0 })}
            />
            <TransformRow
                label="Rotation"
                value={transform.rotation}
                onChange={handleRotationChange}
                onReset={() => handleRotationChange({ x: 0, y: 0, z: 0 })}
                suffix="°"
            />
            <TransformRow
                label="Scale"
                value={transform.scale}
                showLock
                isLocked={isScaleLocked}
                onLockChange={setIsScaleLocked}
                onChange={handleScaleChange}
                onReset={() => handleScaleChange({ x: 1, y: 1, z: 1 })}
                showDivider={false}
            />
            <div className="tf-divider" />
            <MobilityRow value={mobility} onChange={setMobility} />
        </div>
    );
}

export class TransformComponentInspector implements IComponentInspector<TransformComponent> {
    readonly id = 'transform-component-inspector';
    readonly name = 'Transform Component Inspector';
    readonly priority = 100;
    readonly targetComponents = ['Transform', 'TransformComponent'];

    canHandle(component: Component): component is TransformComponent {
        return component instanceof TransformComponent ||
               component.constructor.name === 'TransformComponent' ||
               (component.constructor as any).componentName === 'Transform';
    }

    render(context: ComponentInspectorContext): React.ReactElement {
        return React.createElement(TransformInspectorContent, {
            context,
            key: `transform-${context.version}`
        });
    }
}
