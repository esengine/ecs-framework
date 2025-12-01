/**
 * CircleCollider2D Inspector Provider
 * 2D 圆形碰撞体检视器
 */

import React from 'react';
import { Component } from '@esengine/ecs-framework';
import type { IComponentInspector, ComponentInspectorContext } from '@esengine/editor-core';
import { CircleCollider2DComponent, CollisionLayer2D } from '@esengine/physics-rapier2d';

export class CircleCollider2DInspectorProvider implements IComponentInspector<CircleCollider2DComponent> {
    readonly id = 'circlecollider2d-inspector';
    readonly name = 'CircleCollider2D Inspector';
    readonly priority = 100;
    readonly targetComponents = ['CircleCollider2D', 'CircleCollider2DComponent'];

    canHandle(component: Component): component is CircleCollider2DComponent {
        return component instanceof CircleCollider2DComponent ||
               component.constructor.name === 'CircleCollider2DComponent';
    }

    render(context: ComponentInspectorContext): React.ReactElement {
        const component = context.component as CircleCollider2DComponent;
        const onChange = context.onChange;

        const handleChange = (prop: string, value: unknown) => {
            onChange?.(prop, value);
        };

        return (
            <div className="entity-inspector">
                <div className="inspector-section">
                    <div className="section-title">Circle Collider 2D</div>

                    {/* Radius */}
                    <div className="property-row">
                        <label>Radius</label>
                        <input
                            type="number"
                            value={component.radius}
                            min={0.001}
                            step={0.1}
                            onChange={(e) => handleChange('radius', parseFloat(e.target.value) || 0.5)}
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
