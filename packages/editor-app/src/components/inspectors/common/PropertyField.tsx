import React from 'react';
import { PropertyContext, PropertyRendererRegistry } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';

interface PropertyFieldProps {
    name: string;
    value: any;
    readonly?: boolean;
    decimalPlaces?: number;
    path?: string[];
    onChange?: (value: any) => void;
}

export function PropertyField({
    name,
    value,
    readonly = false,
    decimalPlaces = 4,
    path = [],
    onChange
}: PropertyFieldProps) {
    const registry = Core.services.resolve(PropertyRendererRegistry);

    const context: PropertyContext = {
        name,
        path,
        readonly,
        decimalPlaces,
        depth: 0,
        expandByDefault: false
    };

    const rendered = registry.render(value, context);

    if (rendered) {
        return <>{rendered}</>;
    }

    return (
        <div className="property-field">
            <label className="property-label">{name}</label>
            <span
                className="property-value-text"
                style={{
                    color: '#666',
                    fontStyle: 'italic',
                    fontSize: '0.9em'
                }}
            >
                No renderer available
            </span>
        </div>
    );
}
