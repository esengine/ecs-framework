/**
 * StreamingAnchor Inspector Provider
 *
 * Custom inspector for StreamingAnchorComponent.
 */

import React from 'react';
import { Anchor, Navigation } from 'lucide-react';
import type { IInspectorProvider, InspectorContext } from '@esengine/editor-core';
import type { StreamingAnchorComponent } from '@esengine/world-streaming';

interface StreamingAnchorInspectorData {
    entityId: string;
    component: StreamingAnchorComponent;
}

export class StreamingAnchorInspectorProvider implements IInspectorProvider<StreamingAnchorInspectorData> {
    readonly id = 'streaming-anchor-inspector';
    readonly name = 'Streaming Anchor Inspector';
    readonly priority = 100;

    canHandle(target: unknown): target is StreamingAnchorInspectorData {
        if (typeof target !== 'object' || target === null) return false;
        const obj = target as Record<string, unknown>;
        return 'entityId' in obj && 'component' in obj &&
            obj.component !== null &&
            typeof obj.component === 'object' &&
            'weight' in (obj.component as Record<string, unknown>) &&
            'bEnablePrefetch' in (obj.component as Record<string, unknown>) &&
            'velocityX' in (obj.component as Record<string, unknown>);
    }

    render(data: StreamingAnchorInspectorData, _context: InspectorContext): React.ReactElement {
        const { component } = data;

        const velocity = Math.sqrt(
            component.velocityX * component.velocityX +
            component.velocityY * component.velocityY
        );

        return (
            <div className="entity-inspector">
                <div className="inspector-section">
                    <div className="section-title">
                        <Anchor size={14} style={{ marginRight: '6px' }} />
                        Streaming Anchor
                    </div>

                    <div className="property-row">
                        <label>Weight</label>
                        <span>{component.weight.toFixed(2)}</span>
                    </div>

                    <div className="property-row">
                        <label>Prefetch</label>
                        <span>{component.bEnablePrefetch ? 'Enabled' : 'Disabled'}</span>
                    </div>
                </div>

                <div className="inspector-section">
                    <div className="section-title">
                        <Navigation size={14} style={{ marginRight: '6px' }} />
                        Movement (Runtime)
                    </div>

                    <div className="property-row">
                        <label>Velocity</label>
                        <span>{velocity.toFixed(1)} u/s</span>
                    </div>

                    <div className="property-row">
                        <label>Direction</label>
                        <span>
                            ({component.velocityX.toFixed(1)}, {component.velocityY.toFixed(1)})
                        </span>
                    </div>
                </div>
            </div>
        );
    }
}
