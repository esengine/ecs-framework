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
                return (
                    <NumberField
                        key={propertyName}
                        label={label}
                        value={value ?? 0}
                        min={metadata.min}
                        max={metadata.max}
                        step={metadata.step}
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
  readOnly?: boolean;
  onChange: (value: number) => void;
}

function NumberField({ label, value, min, max, step = 0.1, readOnly, onChange }: NumberFieldProps) {
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

            onChange(parseFloat(newValue.toFixed(3)));
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
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
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
    return (
        <div className="property-field">
            <label className="property-label">{label}</label>
            <div className="property-color-wrapper">
                <div className="property-color-preview" style={{ backgroundColor: value }} />
                <input
                    type="color"
                    className="property-input property-input-color"
                    value={value}
                    disabled={readOnly}
                    onChange={(e) => onChange(e.target.value)}
                />
                <input
                    type="text"
                    className="property-input property-input-color-text"
                    value={value.toUpperCase()}
                    disabled={readOnly}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={(e) => e.target.select()}
                />
            </div>
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
