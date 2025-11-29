import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Lock, Unlock, RotateCcw } from 'lucide-react';

interface TransformValue {
    x: number;
    y: number;
    z?: number;
}

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
        <div className={`transform-axis-input ${isDragging ? 'dragging' : ''}`}>
            <div
                className={`transform-axis-bar ${axis}`}
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
            {suffix && <span className="transform-axis-suffix">{suffix}</span>}
        </div>
    );
}

interface TransformRowProps {
    label: string;
    value: TransformValue;
    showZ?: boolean;
    showLock?: boolean;
    isLocked?: boolean;
    onLockChange?: (locked: boolean) => void;
    onChange: (value: TransformValue) => void;
    onReset?: () => void;
    suffix?: string;
}

export function TransformRow({
    label,
    value,
    showZ = false,
    showLock = false,
    isLocked = false,
    onLockChange,
    onChange,
    onReset,
    suffix
}: TransformRowProps) {
    const handleAxisChange = (axis: 'x' | 'y' | 'z', newValue: number) => {
        if (isLocked && showLock) {
            const oldVal = axis === 'x' ? value.x : axis === 'y' ? value.y : (value.z ?? 0);
            if (oldVal !== 0) {
                const ratio = newValue / oldVal;
                onChange({
                    x: axis === 'x' ? newValue : value.x * ratio,
                    y: axis === 'y' ? newValue : value.y * ratio,
                    z: showZ ? (axis === 'z' ? newValue : (value.z ?? 1) * ratio) : undefined
                });
            } else {
                onChange({ ...value, [axis]: newValue });
            }
        } else {
            onChange({ ...value, [axis]: newValue });
        }
    };

    return (
        <div className="transform-row">
            <div className="transform-row-label">
                <span className="transform-label-text">{label}</span>
            </div>
            <div className="transform-row-inputs">
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
                {showZ && (
                    <AxisInput
                        axis="z"
                        value={value?.z ?? 0}
                        onChange={(v) => handleAxisChange('z', v)}
                        suffix={suffix}
                    />
                )}
            </div>
            {showLock && (
                <button
                    className={`transform-lock-btn ${isLocked ? 'locked' : ''}`}
                    onClick={() => onLockChange?.(!isLocked)}
                    title={isLocked ? 'Unlock' : 'Lock'}
                >
                    {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
            )}
            <button
                className="transform-reset-btn"
                onClick={onReset}
                title="Reset"
            >
                <RotateCcw size={12} />
            </button>
        </div>
    );
}

interface RotationRowProps {
    value: number | { x: number; y: number; z: number };
    onChange: (value: number | { x: number; y: number; z: number }) => void;
    onReset?: () => void;
    is3D?: boolean;
}

export function RotationRow({ value, onChange, onReset, is3D = false }: RotationRowProps) {
    if (is3D && typeof value === 'object') {
        return (
            <div className="transform-row">
                <div className="transform-row-label">
                    <span className="transform-label-text">Rotation</span>
                </div>
                <div className="transform-row-inputs">
                    <AxisInput
                        axis="x"
                        value={value.x ?? 0}
                        onChange={(v) => onChange({ ...value, x: v })}
                        suffix="°"
                    />
                    <AxisInput
                        axis="y"
                        value={value.y ?? 0}
                        onChange={(v) => onChange({ ...value, y: v })}
                        suffix="°"
                    />
                    <AxisInput
                        axis="z"
                        value={value.z ?? 0}
                        onChange={(v) => onChange({ ...value, z: v })}
                        suffix="°"
                    />
                </div>
                <button
                    className="transform-reset-btn"
                    onClick={() => onReset?.() || onChange({ x: 0, y: 0, z: 0 })}
                    title="Reset"
                >
                    <RotateCcw size={12} />
                </button>
            </div>
        );
    }

    const numericValue = typeof value === 'number' ? value : 0;

    return (
        <div className="transform-row">
            <div className="transform-row-label">
                <span className="transform-label-text">Rotation</span>
            </div>
            <div className="transform-row-inputs rotation-single">
                <AxisInput
                    axis="z"
                    value={numericValue}
                    onChange={(v) => onChange(v)}
                    suffix="°"
                />
            </div>
            <button
                className="transform-reset-btn"
                onClick={() => onReset?.() || onChange(0)}
                title="Reset"
            >
                <RotateCcw size={12} />
            </button>
        </div>
    );
}

interface MobilityRowProps {
    value: 'static' | 'stationary' | 'movable';
    onChange: (value: 'static' | 'stationary' | 'movable') => void;
}

export function MobilityRow({ value, onChange }: MobilityRowProps) {
    return (
        <div className="transform-mobility-row">
            <span className="transform-mobility-label">Mobility</span>
            <div className="transform-mobility-buttons">
                <button
                    className={`transform-mobility-btn ${value === 'static' ? 'active' : ''}`}
                    onClick={() => onChange('static')}
                >
                    Static
                </button>
                <button
                    className={`transform-mobility-btn ${value === 'stationary' ? 'active' : ''}`}
                    onClick={() => onChange('stationary')}
                >
                    Stationary
                </button>
                <button
                    className={`transform-mobility-btn ${value === 'movable' ? 'active' : ''}`}
                    onClick={() => onChange('movable')}
                >
                    Movable
                </button>
            </div>
        </div>
    );
}

interface TransformSectionProps {
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
    onPositionChange: (value: { x: number; y: number }) => void;
    onRotationChange: (value: number) => void;
    onScaleChange: (value: { x: number; y: number }) => void;
}

export function TransformSection({
    position,
    rotation,
    scale,
    onPositionChange,
    onRotationChange,
    onScaleChange
}: TransformSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isScaleLocked, setIsScaleLocked] = useState(false);
    const [mobility, setMobility] = useState<'static' | 'stationary' | 'movable'>('static');

    return (
        <div className="transform-section">
            <div
                className="transform-section-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className={`transform-section-expand ${isExpanded ? 'expanded' : ''}`}>
                    <ChevronRight size={14} />
                </span>
                <span className="transform-section-title">Transform</span>
            </div>
            {isExpanded && (
                <div className="transform-section-content">
                    <TransformRow
                        label="Location"
                        value={position}
                        onChange={onPositionChange}
                        onReset={() => onPositionChange({ x: 0, y: 0 })}
                    />
                    <RotationRow
                        value={rotation}
                        onChange={(v) => onRotationChange(typeof v === 'number' ? v : 0)}
                        onReset={() => onRotationChange(0)}
                    />
                    <TransformRow
                        label="Scale"
                        value={scale}
                        showLock
                        isLocked={isScaleLocked}
                        onLockChange={setIsScaleLocked}
                        onChange={onScaleChange}
                        onReset={() => onScaleChange({ x: 1, y: 1 })}
                    />
                    <MobilityRow value={mobility} onChange={setMobility} />
                </div>
            )}
        </div>
    );
}
