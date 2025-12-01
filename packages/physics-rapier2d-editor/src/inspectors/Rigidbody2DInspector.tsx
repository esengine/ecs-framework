/**
 * Rigidbody2D Inspector Provider
 * 2D 刚体检视器
 */

import React from 'react';
import { Component } from '@esengine/ecs-framework';
import type { IComponentInspector, ComponentInspectorContext } from '@esengine/editor-core';
import { Rigidbody2DComponent, RigidbodyType2D, CollisionDetectionMode2D } from '@esengine/physics-rapier2d';

export class Rigidbody2DInspectorProvider implements IComponentInspector<Rigidbody2DComponent> {
    readonly id = 'rigidbody2d-inspector';
    readonly name = 'Rigidbody2D Inspector';
    readonly priority = 100;
    readonly targetComponents = ['Rigidbody2D', 'Rigidbody2DComponent'];

    canHandle(component: Component): component is Rigidbody2DComponent {
        return component instanceof Rigidbody2DComponent ||
               component.constructor.name === 'Rigidbody2DComponent';
    }

    render(context: ComponentInspectorContext): React.ReactElement {
        const component = context.component as Rigidbody2DComponent;
        const onChange = context.onChange;

        const handleChange = (prop: string, value: unknown) => {
            onChange?.(prop, value);
        };

        return (
            <div className="entity-inspector">
                <div className="inspector-section">
                    <div className="section-title">Rigidbody 2D</div>

                    {/* Body Type */}
                    <div className="property-row">
                        <label>Body Type</label>
                        <select
                            value={component.bodyType}
                            onChange={(e) => handleChange('bodyType', parseInt(e.target.value, 10) as RigidbodyType2D)}
                            className="property-select"
                        >
                            <option value={RigidbodyType2D.Dynamic}>Dynamic</option>
                            <option value={RigidbodyType2D.Kinematic}>Kinematic</option>
                            <option value={RigidbodyType2D.Static}>Static</option>
                        </select>
                    </div>

                    {/* Mass - only for Dynamic */}
                    {component.bodyType === RigidbodyType2D.Dynamic && (
                        <div className="property-row">
                            <label>Mass</label>
                            <input
                                type="number"
                                value={component.mass}
                                min={0.001}
                                step={0.1}
                                onChange={(e) => handleChange('mass', parseFloat(e.target.value) || 1)}
                                className="property-input"
                            />
                        </div>
                    )}

                    {/* Gravity Scale */}
                    <div className="property-row">
                        <label>Gravity Scale</label>
                        <input
                            type="number"
                            value={component.gravityScale}
                            step={0.1}
                            onChange={(e) => handleChange('gravityScale', parseFloat(e.target.value) || 0)}
                            className="property-input"
                        />
                    </div>

                    {/* Damping Section */}
                    <div className="section-subtitle">Damping</div>

                    <div className="property-row">
                        <label>Linear</label>
                        <input
                            type="number"
                            value={component.linearDamping}
                            min={0}
                            step={0.01}
                            onChange={(e) => handleChange('linearDamping', parseFloat(e.target.value) || 0)}
                            className="property-input"
                        />
                    </div>

                    <div className="property-row">
                        <label>Angular</label>
                        <input
                            type="number"
                            value={component.angularDamping}
                            min={0}
                            step={0.01}
                            onChange={(e) => handleChange('angularDamping', parseFloat(e.target.value) || 0)}
                            className="property-input"
                        />
                    </div>

                    {/* Constraints Section */}
                    <div className="section-subtitle">Constraints</div>

                    <div className="property-row">
                        <label>Freeze Position X</label>
                        <input
                            type="checkbox"
                            checked={component.constraints.freezePositionX}
                            onChange={(e) => handleChange('constraints', {
                                ...component.constraints,
                                freezePositionX: e.target.checked
                            })}
                            className="property-checkbox"
                        />
                    </div>

                    <div className="property-row">
                        <label>Freeze Position Y</label>
                        <input
                            type="checkbox"
                            checked={component.constraints.freezePositionY}
                            onChange={(e) => handleChange('constraints', {
                                ...component.constraints,
                                freezePositionY: e.target.checked
                            })}
                            className="property-checkbox"
                        />
                    </div>

                    <div className="property-row">
                        <label>Freeze Rotation</label>
                        <input
                            type="checkbox"
                            checked={component.constraints.freezeRotation}
                            onChange={(e) => handleChange('constraints', {
                                ...component.constraints,
                                freezeRotation: e.target.checked
                            })}
                            className="property-checkbox"
                        />
                    </div>

                    {/* Collision Detection */}
                    <div className="section-subtitle">Collision</div>

                    <div className="property-row">
                        <label>Detection</label>
                        <select
                            value={component.collisionDetection}
                            onChange={(e) => handleChange('collisionDetection', parseInt(e.target.value, 10) as CollisionDetectionMode2D)}
                            className="property-select"
                        >
                            <option value={CollisionDetectionMode2D.Discrete}>Discrete</option>
                            <option value={CollisionDetectionMode2D.Continuous}>Continuous</option>
                        </select>
                    </div>

                    {/* Sleep */}
                    <div className="section-subtitle">Sleep</div>

                    <div className="property-row">
                        <label>Can Sleep</label>
                        <input
                            type="checkbox"
                            checked={component.canSleep}
                            onChange={(e) => handleChange('canSleep', e.target.checked)}
                            className="property-checkbox"
                        />
                    </div>

                    {/* Runtime Info (read-only) */}
                    <div className="section-subtitle">Runtime Info</div>

                    <div className="property-row">
                        <label>Velocity</label>
                        <span className="property-readonly">
                            ({component.velocity.x.toFixed(2)}, {component.velocity.y.toFixed(2)})
                        </span>
                    </div>

                    <div className="property-row">
                        <label>Angular Vel</label>
                        <span className="property-readonly">
                            {component.angularVelocity.toFixed(2)} rad/s
                        </span>
                    </div>

                    <div className="property-row">
                        <label>Is Awake</label>
                        <span className="property-readonly">
                            {component.isAwake ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
}
