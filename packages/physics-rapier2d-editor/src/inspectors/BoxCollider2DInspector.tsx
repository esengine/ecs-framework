/**
 * BoxCollider2D Inspector Provider
 * 2D 矩形碰撞体检视器
 */

import React from 'react';
import { Component } from '@esengine/ecs-framework';
import type { IComponentInspector, ComponentInspectorContext } from '@esengine/editor-core';
import { BoxCollider2DComponent, CollisionLayer2D } from '@esengine/physics-rapier2d';

export class BoxCollider2DInspectorProvider implements IComponentInspector<BoxCollider2DComponent> {
    readonly id = 'boxcollider2d-inspector';
    readonly name = 'BoxCollider2D Inspector';
    readonly priority = 100;
    readonly targetComponents = ['BoxCollider2D', 'BoxCollider2DComponent'];

    canHandle(component: Component): component is BoxCollider2DComponent {
        return component instanceof BoxCollider2DComponent ||
               component.constructor.name === 'BoxCollider2DComponent';
    }

    render(context: ComponentInspectorContext): React.ReactElement {
        const component = context.component as BoxCollider2DComponent;
        const onChange = context.onChange;

        const handleChange = (prop: string, value: unknown) => {
            onChange?.(prop, value);
        };

        return (
            <div className="entity-inspector">
                <div className="inspector-section">
                    <div className="section-title">Box Collider 2D</div>

                    {/* Size */}
                    <div className="section-subtitle">Size</div>

                    <div className="property-row">
                        <label>Width</label>
                        <input
                            type="number"
                            value={component.width}
                            min={0.001}
                            step={0.1}
                            onChange={(e) => handleChange('width', parseFloat(e.target.value) || 1)}
                            className="property-input"
                        />
                    </div>

                    <div className="property-row">
                        <label>Height</label>
                        <input
                            type="number"
                            value={component.height}
                            min={0.001}
                            step={0.1}
                            onChange={(e) => handleChange('height', parseFloat(e.target.value) || 1)}
                            className="property-input"
                        />
                    </div>

                    {/* Offset */}
                    <div className="section-subtitle">Offset</div>

                    <div className="property-row">
                        <label>X</label>
                        <input
                            type="number"
                            value={component.offset.x}
                            step={0.1}
                            onChange={(e) => handleChange('offset', {
                                ...component.offset,
                                x: parseFloat(e.target.value) || 0
                            })}
                            className="property-input"
                        />
                    </div>

                    <div className="property-row">
                        <label>Y</label>
                        <input
                            type="number"
                            value={component.offset.y}
                            step={0.1}
                            onChange={(e) => handleChange('offset', {
                                ...component.offset,
                                y: parseFloat(e.target.value) || 0
                            })}
                            className="property-input"
                        />
                    </div>

                    {/* Material */}
                    <div className="section-subtitle">Material</div>

                    <div className="property-row">
                        <label>Friction</label>
                        <input
                            type="number"
                            value={component.friction}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(e) => handleChange('friction', parseFloat(e.target.value) || 0)}
                            className="property-input"
                        />
                    </div>

                    <div className="property-row">
                        <label>Restitution</label>
                        <input
                            type="number"
                            value={component.restitution}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(e) => handleChange('restitution', parseFloat(e.target.value) || 0)}
                            className="property-input"
                        />
                    </div>

                    <div className="property-row">
                        <label>Density</label>
                        <input
                            type="number"
                            value={component.density}
                            min={0.001}
                            step={0.1}
                            onChange={(e) => handleChange('density', parseFloat(e.target.value) || 1)}
                            className="property-input"
                        />
                    </div>

                    {/* Collision */}
                    <div className="section-subtitle">Collision</div>

                    <div className="property-row">
                        <label>Is Trigger</label>
                        <input
                            type="checkbox"
                            checked={component.isTrigger}
                            onChange={(e) => handleChange('isTrigger', e.target.checked)}
                            className="property-checkbox"
                        />
                    </div>

                    <div className="property-row">
                        <label>Layer</label>
                        <select
                            value={component.collisionLayer}
                            onChange={(e) => handleChange('collisionLayer', parseInt(e.target.value, 10))}
                            className="property-select"
                        >
                            <option value={CollisionLayer2D.Default}>Default</option>
                            <option value={CollisionLayer2D.Player}>Player</option>
                            <option value={CollisionLayer2D.Enemy}>Enemy</option>
                            <option value={CollisionLayer2D.Ground}>Ground</option>
                            <option value={CollisionLayer2D.Projectile}>Projectile</option>
                            <option value={CollisionLayer2D.Trigger}>Trigger</option>
                        </select>
                    </div>
                </div>
            </div>
        );
    }
}
