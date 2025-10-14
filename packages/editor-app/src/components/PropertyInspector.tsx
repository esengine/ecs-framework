import { useState, useEffect } from 'react';
import { Component, Core } from '@esengine/ecs-framework';
import { PropertyMetadataService, PropertyMetadata } from '@esengine/editor-core';
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

    setValues(prev => ({
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
          <div key={propertyName} className="property-field">
            <label className="property-label">{label}</label>
            <input
              type="number"
              className="property-input"
              value={value ?? 0}
              min={metadata.min}
              max={metadata.max}
              step={metadata.step ?? 1}
              disabled={metadata.readOnly}
              onChange={(e) => handleChange(propertyName, parseFloat(e.target.value) || 0)}
            />
          </div>
        );

      case 'string':
        return (
          <div key={propertyName} className="property-field">
            <label className="property-label">{label}</label>
            <input
              type="text"
              className="property-input"
              value={value ?? ''}
              disabled={metadata.readOnly}
              onChange={(e) => handleChange(propertyName, e.target.value)}
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={propertyName} className="property-field property-field-checkbox">
            <label className="property-label">{label}</label>
            <input
              type="checkbox"
              className="property-checkbox"
              checked={value ?? false}
              disabled={metadata.readOnly}
              onChange={(e) => handleChange(propertyName, e.target.checked)}
            />
          </div>
        );

      case 'color':
        return (
          <div key={propertyName} className="property-field">
            <label className="property-label">{label}</label>
            <input
              type="color"
              className="property-input property-color"
              value={value ?? '#ffffff'}
              disabled={metadata.readOnly}
              onChange={(e) => handleChange(propertyName, e.target.value)}
            />
          </div>
        );

      case 'vector2':
      case 'vector3':
        return (
          <div key={propertyName} className="property-field">
            <label className="property-label">{label}</label>
            <div className="property-vector">
              <input
                type="number"
                className="property-input property-vector-input"
                value={value?.x ?? 0}
                disabled={metadata.readOnly}
                placeholder="X"
                onChange={(e) => handleChange(propertyName, { ...value, x: parseFloat(e.target.value) || 0 })}
              />
              <input
                type="number"
                className="property-input property-vector-input"
                value={value?.y ?? 0}
                disabled={metadata.readOnly}
                placeholder="Y"
                onChange={(e) => handleChange(propertyName, { ...value, y: parseFloat(e.target.value) || 0 })}
              />
              {metadata.type === 'vector3' && (
                <input
                  type="number"
                  className="property-input property-vector-input"
                  value={value?.z ?? 0}
                  disabled={metadata.readOnly}
                  placeholder="Z"
                  onChange={(e) => handleChange(propertyName, { ...value, z: parseFloat(e.target.value) || 0 })}
                />
              )}
            </div>
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
