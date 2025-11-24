import { useState, useEffect, useRef } from 'react';
import { Component, Core } from '@esengine/ecs-framework';
import { PropertyMetadataService, PropertyMetadata, PropertyAction, MessageHub, IFileSystemService } from '@esengine/editor-core';
import type { IFileSystem } from '@esengine/editor-core';
import { ChevronRight, ChevronDown, ArrowRight, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { AnimationClipsFieldEditor } from '../infrastructure/field-editors/AnimationClipsFieldEditor';
import { AssetSaveDialog } from './dialogs/AssetSaveDialog';
import '../styles/PropertyInspector.css';

const animationClipsEditor = new AnimationClipsFieldEditor();

interface PropertyInspectorProps {
  component: Component;
  entity?: any;
  version?: number;
  onChange?: (propertyName: string, value: any) => void;
  onAction?: (actionId: string, propertyName: string, component: Component) => void;
}

export function PropertyInspector({ component, entity, version, onChange, onAction }: PropertyInspectorProps) {
    const [properties, setProperties] = useState<Record<string, PropertyMetadata>>({});
    const [controlledFields, setControlledFields] = useState<Map<string, string>>(new Map());
    // version is used implicitly - when it changes, React re-renders and getValue reads fresh values
    void version;

    // Scan entity for components that control this component's properties
    useEffect(() => {
        if (!entity) return;

        const propertyMetadataService = Core.services.resolve(PropertyMetadataService);
        if (!propertyMetadataService) return;

        const componentName = component.constructor.name;
        const controlled = new Map<string, string>();

        // Check all components on this entity
        for (const otherComponent of entity.components) {
            if (otherComponent === component) continue;

            const otherMetadata = propertyMetadataService.getEditableProperties(otherComponent);
            const otherComponentName = otherComponent.constructor.name;

            // Check if any property has controls declaration
            for (const [, propMeta] of Object.entries(otherMetadata)) {
                if (propMeta.controls) {
                    for (const control of propMeta.controls) {
                        if (control.component === componentName ||
                            control.component === componentName.replace('Component', '')) {
                            controlled.set(control.property, otherComponentName.replace('Component', ''));
                        }
                    }
                }
            }
        }

        setControlledFields(controlled);
    }, [component, entity, version]);

    const getControlledBy = (propertyName: string): string | undefined => {
        return controlledFields.get(propertyName);
    };

    const handleAction = (actionId: string, propertyName: string) => {
        if (onAction) {
            onAction(actionId, propertyName, component);
        }
    };

    useEffect(() => {
        const propertyMetadataService = Core.services.resolve(PropertyMetadataService);
        if (!propertyMetadataService) return;

        const metadata = propertyMetadataService.getEditableProperties(component);
        setProperties(metadata);
    }, [component]);

    const handleChange = (propertyName: string, value: any) => {
        const componentAsAny = component as any;
        componentAsAny[propertyName] = value;

        if (onChange) {
            onChange(propertyName, value);
        }

        // Always publish scene:modified so other panels can react to changes
        const messageHub = Core.services.resolve(MessageHub);
        if (messageHub) {
            messageHub.publish('scene:modified', {});
        }
    };

    // Read value directly from component to avoid state sync issues
    const getValue = (propertyName: string) => {
        return (component as any)[propertyName];
    };

    const renderProperty = (propertyName: string, metadata: PropertyMetadata) => {
        const value = getValue(propertyName);
        const label = metadata.label || propertyName;

        switch (metadata.type) {
            case 'number':
            case 'integer':
                return (
                    <NumberField
                        key={propertyName}
                        label={label}
                        value={value ?? 0}
                        min={metadata.min}
                        max={metadata.max}
                        step={metadata.step ?? (metadata.type === 'integer' ? 1 : 0.1)}
                        isInteger={metadata.type === 'integer'}
                        readOnly={metadata.readOnly}
                        actions={metadata.actions}
                        onChange={(newValue) => handleChange(propertyName, newValue)}
                        onAction={(actionId) => handleAction(actionId, propertyName)}
                    />
                );

            case 'string':
                return (
                    <StringField
                        key={propertyName}
                        label={label}
                        value={value ?? ''}
                        readOnly={metadata.readOnly}
                        onChange={(newValue) => handleChange(propertyName, newValue)}
                    />
                );

            case 'boolean':
                return (
                    <BooleanField
                        key={propertyName}
                        label={label}
                        value={value ?? false}
                        readOnly={metadata.readOnly}
                        onChange={(newValue) => handleChange(propertyName, newValue)}
                    />
                );

            case 'color':
                return (
                    <ColorField
                        key={propertyName}
                        label={label}
                        value={value ?? '#ffffff'}
                        readOnly={metadata.readOnly}
                        onChange={(newValue) => handleChange(propertyName, newValue)}
                    />
                );

            case 'vector2':
                return (
                    <Vector2Field
                        key={propertyName}
                        label={label}
                        value={value ?? { x: 0, y: 0 }}
                        readOnly={metadata.readOnly}
                        onChange={(newValue) => handleChange(propertyName, newValue)}
                    />
                );

            case 'vector3':
                return (
                    <Vector3Field
                        key={propertyName}
                        label={label}
                        value={value ?? { x: 0, y: 0, z: 0 }}
                        readOnly={metadata.readOnly}
                        onChange={(newValue) => handleChange(propertyName, newValue)}
                    />
                );

            case 'enum':
                return (
                    <EnumField
                        key={propertyName}
                        label={label}
                        value={value}
                        options={metadata.options || []}
                        readOnly={metadata.readOnly}
                        onChange={(newValue) => handleChange(propertyName, newValue)}
                    />
                );

            case 'asset': {
                const controlledBy = getControlledBy(propertyName);
                return (
                    <AssetDropField
                        key={propertyName}
                        label={label}
                        value={value ?? ''}
                        fileExtension={metadata.fileExtension}
                        readOnly={metadata.readOnly || !!controlledBy}
                        controlledBy={controlledBy}
                        entityId={entity?.id?.toString()}
                        onChange={(newValue) => handleChange(propertyName, newValue)}
                    />
                );
            }

            case 'animationClips':
                return (
                    <div key={propertyName}>
                        {animationClipsEditor.render({
                            label,
                            value: value ?? [],
                            onChange: (newValue) => handleChange(propertyName, newValue),
                            context: {
                                readonly: metadata.readOnly ?? false,
                                metadata: {
                                    component,
                                    onDefaultAnimationChange: (val: string) => handleChange('defaultAnimation', val)
                                }
                            }
                        })}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="property-inspector">
            {Object.entries(properties).map(([propertyName, metadata]) =>
                renderProperty(propertyName, metadata)
            )}
        </div>
    );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  isInteger?: boolean;
  readOnly?: boolean;
  actions?: PropertyAction[];
  onChange: (value: number) => void;
  onAction?: (actionId: string) => void;
}

function NumberField({ label, value, min, max, step = 0.1, isInteger = false, readOnly, actions, onChange, onAction }: NumberFieldProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartValue, setDragStartValue] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const renderActionButton = (action: PropertyAction) => {
        const IconComponent = action.icon ? (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[action.icon] : null;
        return (
            <button
                key={action.id}
                className="property-action-btn"
                title={action.tooltip || action.label}
                onClick={() => onAction?.(action.id)}
            >
                {IconComponent ? <IconComponent size={12} /> : action.label}
            </button>
        );
    };

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
            const sensitivity = e.shiftKey ? 0.1 : 1;
            let newValue = dragStartValue + delta * step * sensitivity;

            if (min !== undefined) newValue = Math.max(min, newValue);
            if (max !== undefined) newValue = Math.min(max, newValue);

            // 整数类型取整
            if (isInteger) {
                newValue = Math.round(newValue);
            } else {
                newValue = parseFloat(newValue.toFixed(3));
            }

            onChange(newValue);
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
                ref={inputRef}
                type="number"
                className="property-input property-input-number"
                value={value}
                min={min}
                max={max}
                step={step}
                disabled={readOnly}
                onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onChange(isInteger ? Math.round(val) : val);
                }}
                onFocus={(e) => e.target.select()}
            />
            {actions && actions.length > 0 && (
                <div className="property-actions">
                    {actions.map(renderActionButton)}
                </div>
            )}
        </div>
    );
}

interface StringFieldProps {
  label: string;
  value: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}

function StringField({ label, value, readOnly, onChange }: StringFieldProps) {
    return (
        <div className="property-field">
            <label className="property-label">{label}</label>
            <input
                type="text"
                className="property-input property-input-text"
                value={value}
                disabled={readOnly}
                onChange={(e) => onChange(e.target.value)}
                onFocus={(e) => e.target.select()}
            />
        </div>
    );
}

interface BooleanFieldProps {
  label: string;
  value: boolean;
  readOnly?: boolean;
  onChange: (value: boolean) => void;
}

function BooleanField({ label, value, readOnly, onChange }: BooleanFieldProps) {
    return (
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
}

interface ColorFieldProps {
  label: string;
  value: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}

function ColorField({ label, value, readOnly, onChange }: ColorFieldProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [tempColor, setTempColor] = useState(value);
    const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
    const pickerRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    // 解析十六进制颜色为 HSV
    const hexToHsv = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;

        let h = 0;
        const s = max === 0 ? 0 : d / max;
        const v = max;

        if (d !== 0) {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: h * 360, s: s * 100, v: v * 100 };
    };

    // HSV 转十六进制
    const hsvToHex = (h: number, s: number, v: number) => {
        h = h / 360;
        s = s / 100;
        v = v / 100;

        let r = 0, g = 0, b = 0;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }

        const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const hsv = hexToHsv(tempColor);

    // 点击外部关闭
    useEffect(() => {
        if (!showPicker) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
                onChange(tempColor);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPicker, tempColor, onChange]);

    useEffect(() => {
        setTempColor(value);
    }, [value]);

    const handleSaturationValueChange = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const s = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const v = Math.max(0, Math.min(100, 100 - ((e.clientY - rect.top) / rect.height) * 100));
        const newColor = hsvToHex(hsv.h, s, v);
        setTempColor(newColor);
    };

    const handleHueChange = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
        const newColor = hsvToHex(h, hsv.s, hsv.v);
        setTempColor(newColor);
    };

    return (
        <div className="property-field" style={{ position: 'relative' }}>
            <label className="property-label">{label}</label>
            <div className="property-color-wrapper">
                <div
                    ref={previewRef}
                    className="property-color-preview"
                    style={{ backgroundColor: value }}
                    onClick={() => {
                        if (readOnly) return;
                        if (!showPicker && previewRef.current) {
                            const rect = previewRef.current.getBoundingClientRect();
                            const pickerWidth = 200;
                            const pickerHeight = 220;
                            let top = rect.bottom + 4;
                            let left = rect.right - pickerWidth;

                            // Ensure picker stays within viewport
                            if (left < 8) left = 8;
                            if (top + pickerHeight > window.innerHeight - 8) {
                                top = rect.top - pickerHeight - 4;
                            }
                            setPickerPos({ top, left });
                        }
                        setShowPicker(!showPicker);
                    }}
                />
                <input
                    type="text"
                    className="property-input property-input-color-text"
                    value={value.toUpperCase()}
                    disabled={readOnly}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                            onChange(val);
                        }
                    }}
                    onFocus={(e) => e.target.select()}
                />
            </div>

            {showPicker && (
                <div
                    ref={pickerRef}
                    className="color-picker-popup"
                    style={{
                        position: 'fixed',
                        top: pickerPos.top,
                        left: pickerPos.left,
                        right: 'auto'
                    }}
                >
                    <div
                        className="color-picker-saturation"
                        style={{ backgroundColor: hsvToHex(hsv.h, 100, 100) }}
                        onMouseDown={(e) => {
                            handleSaturationValueChange(e);
                            const rect = e.currentTarget.getBoundingClientRect();
                            const onMove = (ev: MouseEvent) => {
                                const s = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
                                const v = Math.max(0, Math.min(100, 100 - ((ev.clientY - rect.top) / rect.height) * 100));
                                setTempColor(hsvToHex(hsv.h, s, v));
                            };
                            const onUp = () => {
                                document.removeEventListener('mousemove', onMove);
                                document.removeEventListener('mouseup', onUp);
                            };
                            document.addEventListener('mousemove', onMove);
                            document.addEventListener('mouseup', onUp);
                        }}
                    >
                        <div className="color-picker-saturation-white" />
                        <div className="color-picker-saturation-black" />
                        <div
                            className="color-picker-cursor"
                            style={{
                                left: `${hsv.s}%`,
                                top: `${100 - hsv.v}%`
                            }}
                        />
                    </div>
                    <div
                        className="color-picker-hue"
                        onMouseDown={(e) => {
                            handleHueChange(e);
                            const rect = e.currentTarget.getBoundingClientRect();
                            const onMove = (ev: MouseEvent) => {
                                const h = Math.max(0, Math.min(360, ((ev.clientX - rect.left) / rect.width) * 360));
                                setTempColor(hsvToHex(h, hsv.s, hsv.v));
                            };
                            const onUp = () => {
                                document.removeEventListener('mousemove', onMove);
                                document.removeEventListener('mouseup', onUp);
                            };
                            document.addEventListener('mousemove', onMove);
                            document.addEventListener('mouseup', onUp);
                        }}
                    >
                        <div
                            className="color-picker-hue-cursor"
                            style={{ left: `${(hsv.h / 360) * 100}%` }}
                        />
                    </div>
                    <div className="color-picker-preview-row">
                        <div className="color-picker-preview-box" style={{ backgroundColor: tempColor }} />
                        <span className="color-picker-hex">{tempColor.toUpperCase()}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Draggable axis input component
interface DraggableAxisInputProps {
    axis: 'x' | 'y' | 'z';
    value: number;
    readOnly?: boolean;
    compact?: boolean;
    onChange: (value: number) => void;
}

function DraggableAxisInput({ axis, value, readOnly, compact, onChange }: DraggableAxisInputProps) {
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
            const sensitivity = e.shiftKey ? 0.01 : 0.1;
            const newValue = dragStartRef.current.value + delta * sensitivity;
            onChange(Math.round(newValue * 1000) / 1000);
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

    const axisClass = `property-vector-axis-${axis}`;
    const inputClass = compact ? 'property-input property-input-number-compact' : 'property-input property-input-number';

    return (
        <div className={compact ? 'property-vector-axis-compact' : 'property-vector-axis'}>
            <span
                className={`property-vector-axis-label ${axisClass}`}
                onMouseDown={handleMouseDown}
                style={{ cursor: readOnly ? 'default' : 'ew-resize' }}
            >
                {axis.toUpperCase()}
            </span>
            <input
                type="number"
                className={inputClass}
                value={value ?? 0}
                disabled={readOnly}
                step={0.1}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
            />
        </div>
    );
}

interface Vector2FieldProps {
  label: string;
  value: { x: number; y: number };
  readOnly?: boolean;
  onChange: (value: { x: number; y: number }) => void;
}

function Vector2Field({ label, value, readOnly, onChange }: Vector2FieldProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="property-field">
            <div className="property-label-row">
                <button
                    className="property-expand-btn"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <label className="property-label">{label}</label>
            </div>
            {isExpanded ? (
                <div className="property-vector-expanded">
                    <DraggableAxisInput
                        axis="x"
                        value={value?.x ?? 0}
                        readOnly={readOnly}
                        onChange={(x) => onChange({ ...value, x })}
                    />
                    <DraggableAxisInput
                        axis="y"
                        value={value?.y ?? 0}
                        readOnly={readOnly}
                        onChange={(y) => onChange({ ...value, y })}
                    />
                </div>
            ) : (
                <div className="property-vector-compact">
                    <DraggableAxisInput
                        axis="x"
                        value={value?.x ?? 0}
                        readOnly={readOnly}
                        compact
                        onChange={(x) => onChange({ ...value, x })}
                    />
                    <DraggableAxisInput
                        axis="y"
                        value={value?.y ?? 0}
                        readOnly={readOnly}
                        compact
                        onChange={(y) => onChange({ ...value, y })}
                    />
                </div>
            )}
        </div>
    );
}

interface Vector3FieldProps {
  label: string;
  value: { x: number; y: number; z: number };
  readOnly?: boolean;
  onChange: (value: { x: number; y: number; z: number }) => void;
}

function Vector3Field({ label, value, readOnly, onChange }: Vector3FieldProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="property-field">
            <div className="property-label-row">
                <button
                    className="property-expand-btn"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <label className="property-label">{label}</label>
            </div>
            {isExpanded ? (
                <div className="property-vector-expanded">
                    <DraggableAxisInput
                        axis="x"
                        value={value?.x ?? 0}
                        readOnly={readOnly}
                        onChange={(x) => onChange({ ...value, x })}
                    />
                    <DraggableAxisInput
                        axis="y"
                        value={value?.y ?? 0}
                        readOnly={readOnly}
                        onChange={(y) => onChange({ ...value, y })}
                    />
                    <DraggableAxisInput
                        axis="z"
                        value={value?.z ?? 0}
                        readOnly={readOnly}
                        onChange={(z) => onChange({ ...value, z })}
                    />
                </div>
            ) : (
                <div className="property-vector-compact">
                    <DraggableAxisInput
                        axis="x"
                        value={value?.x ?? 0}
                        readOnly={readOnly}
                        compact
                        onChange={(x) => onChange({ ...value, x })}
                    />
                    <DraggableAxisInput
                        axis="y"
                        value={value?.y ?? 0}
                        readOnly={readOnly}
                        compact
                        onChange={(y) => onChange({ ...value, y })}
                    />
                    <DraggableAxisInput
                        axis="z"
                        value={value?.z ?? 0}
                        readOnly={readOnly}
                        compact
                        onChange={(z) => onChange({ ...value, z })}
                    />
                </div>
            )}
        </div>
    );
}

interface EnumFieldProps {
  label: string;
  value: any;
  options: Array<{ label: string; value: any }>;
  readOnly?: boolean;
  onChange: (value: any) => void;
}

function EnumField({ label, value, options, readOnly, onChange }: EnumFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const displayLabel = selectedOption?.label || (options.length === 0 ? 'No options' : '');

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="property-field">
            <label className="property-label">{label}</label>
            <div className="property-dropdown" ref={dropdownRef}>
                <button
                    className={`property-dropdown-trigger ${isOpen ? 'open' : ''}`}
                    onClick={() => !readOnly && setIsOpen(!isOpen)}
                    disabled={readOnly}
                    type="button"
                >
                    <span className="property-dropdown-value">{displayLabel}</span>
                    <span className="property-dropdown-arrow">▾</span>
                </button>
                {isOpen && (
                    <div className="property-dropdown-menu">
                        {options.map((option, index) => (
                            <button
                                key={index}
                                className={`property-dropdown-item ${option.value === value ? 'selected' : ''}`}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                type="button"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface AssetDropFieldProps {
  label: string;
  value: string;
  fileExtension?: string;
  readOnly?: boolean;
  controlledBy?: string;
  entityId?: string;
  onChange: (value: string) => void;
}

function AssetDropField({ label, value, fileExtension, readOnly, controlledBy, entityId, onChange }: AssetDropFieldProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    const canCreate = fileExtension && ['.tilemap.json', '.btree'].includes(fileExtension);

    const handleCreate = () => {
        setShowSaveDialog(true);
    };

    const handleSaveAsset = async (relativePath: string) => {
        const fileSystem = Core.services.tryResolve<IFileSystem>(IFileSystemService);
        const messageHub = Core.services.tryResolve(MessageHub);

        if (!fileSystem) {
            console.error('[AssetDropField] FileSystem service not available');
            return;
        }

        try {
            // Get absolute path from project
            const projectService = Core.services.tryResolve(
                (await import('@esengine/editor-core')).ProjectService
            );
            const currentProject = projectService?.getCurrentProject();
            if (!currentProject) {
                console.error('[AssetDropField] No project loaded');
                return;
            }

            const absolutePath = `${currentProject.path}/${relativePath}`.replace(/\\/g, '/');

            // Create default content based on file type
            let defaultContent = '';
            if (fileExtension === '.tilemap.json') {
                defaultContent = JSON.stringify({
                    name: 'New Tilemap',
                    version: 2,
                    width: 20,
                    height: 15,
                    tileWidth: 16,
                    tileHeight: 16,
                    layers: [
                        {
                            id: 'default',
                            name: 'Layer 0',
                            visible: true,
                            opacity: 1,
                            data: new Array(20 * 15).fill(0)
                        }
                    ],
                    tilesets: []
                }, null, 2);
            } else if (fileExtension === '.btree') {
                defaultContent = JSON.stringify({
                    name: 'New Behavior Tree',
                    version: 1,
                    nodes: [],
                    connections: []
                }, null, 2);
            }

            // Write file
            await fileSystem.writeFile(absolutePath, defaultContent);

            // Update component with relative path
            onChange(relativePath);

            // Open editor panel if tilemap
            if (messageHub && fileExtension === '.tilemap.json' && entityId) {
                const { useTilemapEditorStore } = await import('@esengine/tilemap-editor');
                useTilemapEditorStore.getState().setEntityId(entityId);
                messageHub.publish('dynamic-panel:open', { panelId: 'tilemap-editor', title: 'Tilemap Editor' });
            }

            console.log('[AssetDropField] Created asset:', relativePath);
        } catch (error) {
            console.error('[AssetDropField] Failed to create asset:', error);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!readOnly) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (readOnly) return;

        const assetPath = e.dataTransfer.getData('asset-path');
        if (assetPath) {
            if (fileExtension) {
                const extensions = fileExtension.split(',').map((ext) => ext.trim().toLowerCase());
                const fileExt = assetPath.toLowerCase().split('.').pop();
                if (fileExt && extensions.some((ext) => ext === `.${fileExt}` || ext === fileExt)) {
                    onChange(assetPath);
                }
            } else {
                onChange(assetPath);
            }
        }
    };

    const getFileName = (path: string) => {
        if (!path) return '';
        const parts = path.split(/[\\/]/);
        return parts[parts.length - 1];
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!readOnly) onChange('');
    };

    const handleNavigate = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (value) {
            const messageHub = Core.services.tryResolve(MessageHub);
            if (messageHub) {
                console.log('[AssetDropField] Navigate to:', value);
                messageHub.publish('asset:reveal', { path: value });
            } else {
                console.error('[AssetDropField] MessageHub not available');
            }
        }
    };

    return (
        <div className="property-field">
            <label className="property-label">
                {label}
                {controlledBy && (
                    <span className="property-controlled-icon" title={`Controlled by ${controlledBy}`}>
                        <Lock size={10} />
                    </span>
                )}
            </label>
            <div
                className={`property-asset-drop ${isDragging ? 'dragging' : ''} ${value ? 'has-value' : ''} ${controlledBy ? 'controlled' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                title={controlledBy ? `Controlled by ${controlledBy}` : (value || 'Drop asset here')}
            >
                <span className="property-asset-text">
                    {value ? getFileName(value) : 'None'}
                </span>
                <div className="property-asset-actions">
                    {canCreate && !readOnly && !value && (
                        <button
                            className="property-asset-btn property-asset-btn-create"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCreate();
                            }}
                            title="创建新资产"
                        >
                            +
                        </button>
                    )}
                    {value && (
                        <button
                            className="property-asset-btn"
                            onClick={handleNavigate}
                            title="在资产浏览器中显示"
                        >
                            <ArrowRight size={12} />
                        </button>
                    )}
                    {value && !readOnly && (
                        <button className="property-asset-clear" onClick={handleClear}>×</button>
                    )}
                </div>
            </div>

            {/* Save Dialog */}
            <AssetSaveDialog
                isOpen={showSaveDialog}
                onClose={() => setShowSaveDialog(false)}
                onSave={handleSaveAsset}
                title={fileExtension === '.tilemap.json' ? '创建 Tilemap 资产' : '创建资产'}
                defaultFileName={fileExtension === '.tilemap.json' ? 'new-tilemap' : 'new-asset'}
                fileExtension={fileExtension}
            />
        </div>
    );
}
