import { useState, useEffect, useRef } from 'react';
import { Component, Core } from '@esengine/ecs-framework';
import { PropertyMetadataService, PropertyMetadata } from '@esengine/editor-core';
import { ChevronRight, ChevronDown } from 'lucide-react';
import '../styles/PropertyInspector.css';

interface PropertyInspectorProps {
  component: Component;
  onChange?: (propertyName: string, value: any) => void;
}

export function PropertyInspector({ component, onChange }: PropertyInspectorProps) {
    const [properties, setProperties] = useState<Record<string, PropertyMetadata>>({});
    const [values, setValues] = useState<Record<string, any>>({});

    useEffect(() => {
        const propertyMetadataService = Core.services.resolve(PropertyMetadataService);
        if (!propertyMetadataService) return;

        const metadata = propertyMetadataService.getEditableProperties(component);
        setProperties(metadata);

        const componentAsAny = component as any;
        const currentValues: Record<string, any> = {};
        for (const key in metadata) {
            currentValues[key] = componentAsAny[key];
        }
        setValues(currentValues);
    }, [component]);

    const handleChange = (propertyName: string, value: any) => {
        const componentAsAny = component as any;
        componentAsAny[propertyName] = value;

        setValues((prev) => ({
            ...prev,
            [propertyName]: value
        }));

        if (onChange) {
            onChange(propertyName, value);
        }
    };

    const renderProperty = (propertyName: string, metadata: PropertyMetadata) => {
        const value = values[propertyName];
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
                        onChange={(newValue) => handleChange(propertyName, newValue)}
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

            case 'asset':
                return (
                    <AssetDropField
                        key={propertyName}
                        label={label}
                        value={value ?? ''}
                        fileExtension={metadata.fileExtension}
                        readOnly={metadata.readOnly}
                        onChange={(newValue) => handleChange(propertyName, newValue)}
                    />
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
  onChange: (value: number) => void;
}

function NumberField({ label, value, min, max, step = 0.1, isInteger = false, readOnly, onChange }: NumberFieldProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartValue, setDragStartValue] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

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
    const pickerRef = useRef<HTMLDivElement>(null);

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
                    className="property-color-preview"
                    style={{ backgroundColor: value }}
                    onClick={() => !readOnly && setShowPicker(!showPicker)}
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
                <div ref={pickerRef} className="color-picker-popup">
                    <div
                        className="color-picker-saturation"
                        style={{ backgroundColor: hsvToHex(hsv.h, 100, 100) }}
                        onMouseDown={(e) => {
                            handleSaturationValueChange(e);
                            const onMove = (ev: MouseEvent) => {
                                const rect = e.currentTarget.getBoundingClientRect();
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
                            const onMove = (ev: MouseEvent) => {
                                const rect = e.currentTarget.getBoundingClientRect();
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
                    <div className="property-vector-axis">
                        <span className="property-vector-axis-label property-vector-axis-x">X</span>
                        <input
                            type="number"
                            className="property-input property-input-number"
                            value={value?.x ?? 0}
                            disabled={readOnly}
                            step={0.1}
                            onChange={(e) => onChange({ ...value, x: parseFloat(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                    <div className="property-vector-axis">
                        <span className="property-vector-axis-label property-vector-axis-y">Y</span>
                        <input
                            type="number"
                            className="property-input property-input-number"
                            value={value?.y ?? 0}
                            disabled={readOnly}
                            step={0.1}
                            onChange={(e) => onChange({ ...value, y: parseFloat(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                </div>
            ) : (
                <div className="property-vector-compact">
                    <div className="property-vector-axis-compact">
                        <span className="property-vector-axis-label property-vector-axis-x">X</span>
                        <input
                            type="number"
                            className="property-input property-input-number-compact"
                            value={value?.x ?? 0}
                            disabled={readOnly}
                            step={0.1}
                            onChange={(e) => onChange({ ...value, x: parseFloat(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                    <div className="property-vector-axis-compact">
                        <span className="property-vector-axis-label property-vector-axis-y">Y</span>
                        <input
                            type="number"
                            className="property-input property-input-number-compact"
                            value={value?.y ?? 0}
                            disabled={readOnly}
                            step={0.1}
                            onChange={(e) => onChange({ ...value, y: parseFloat(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
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
                    <div className="property-vector-axis">
                        <span className="property-vector-axis-label property-vector-axis-x">X</span>
                        <input
                            type="number"
                            className="property-input property-input-number"
                            value={value?.x ?? 0}
                            disabled={readOnly}
                            step={0.1}
                            onChange={(e) => onChange({ ...value, x: parseFloat(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                    <div className="property-vector-axis">
                        <span className="property-vector-axis-label property-vector-axis-y">Y</span>
                        <input
                            type="number"
                            className="property-input property-input-number"
                            value={value?.y ?? 0}
                            disabled={readOnly}
                            step={0.1}
                            onChange={(e) => onChange({ ...value, y: parseFloat(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                    <div className="property-vector-axis">
                        <span className="property-vector-axis-label property-vector-axis-z">Z</span>
                        <input
                            type="number"
                            className="property-input property-input-number"
                            value={value?.z ?? 0}
                            disabled={readOnly}
                            step={0.1}
                            onChange={(e) => onChange({ ...value, z: parseFloat(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                </div>
            ) : (
                <div className="property-vector-compact">
                    <div className="property-vector-axis-compact">
                        <span className="property-vector-axis-label property-vector-axis-x">X</span>
                        <input
                            type="number"
                            className="property-input property-input-number-compact"
                            value={value?.x ?? 0}
                            disabled={readOnly}
                            step={0.1}
                            onChange={(e) => onChange({ ...value, x: parseFloat(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                    <div className="property-vector-axis-compact">
                        <span className="property-vector-axis-label property-vector-axis-y">Y</span>
                        <input
                            type="number"
                            className="property-input property-input-number-compact"
                            value={value?.y ?? 0}
                            disabled={readOnly}
                            step={0.1}
                            onChange={(e) => onChange({ ...value, y: parseFloat(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                    <div className="property-vector-axis-compact">
                        <span className="property-vector-axis-label property-vector-axis-z">Z</span>
                        <input
                            type="number"
                            className="property-input property-input-number-compact"
                            value={value?.z ?? 0}
                            disabled={readOnly}
                            step={0.1}
                            onChange={(e) => onChange({ ...value, z: parseFloat(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
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
    return (
        <div className="property-field">
            <label className="property-label">{label}</label>
            <select
                className="property-input property-input-select"
                value={value ?? ''}
                disabled={readOnly}
                onChange={(e) => {
                    const selectedOption = options.find((opt) => String(opt.value) === e.target.value);
                    if (selectedOption) {
                        onChange(selectedOption.value);
                    }
                }}
            >
                {options.length === 0 && (
                    <option value="">No options</option>
                )}
                {options.map((option, index) => (
                    <option key={index} value={String(option.value)}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

interface AssetDropFieldProps {
  label: string;
  value: string;
  fileExtension?: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}

function AssetDropField({ label, value, fileExtension, readOnly, onChange }: AssetDropFieldProps) {
    const [isDragging, setIsDragging] = useState(false);

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
                const extensions = fileExtension.split(',').map(ext => ext.trim().toLowerCase());
                const fileExt = assetPath.toLowerCase().split('.').pop();
                if (fileExt && extensions.some(ext => ext === `.${fileExt}` || ext === fileExt)) {
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

    return (
        <div className="property-field">
            <label className="property-label">{label}</label>
            <div
                className={`property-asset-drop ${isDragging ? 'dragging' : ''} ${value ? 'has-value' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                title={value || 'Drop asset here'}
            >
                <span className="property-asset-text">
                    {value ? getFileName(value) : 'None'}
                </span>
                {value && !readOnly && (
                    <button className="property-asset-clear" onClick={handleClear}>×</button>
                )}
            </div>
        </div>
    );
}
