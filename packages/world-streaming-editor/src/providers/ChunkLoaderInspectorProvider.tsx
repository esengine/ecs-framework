/**
 * ChunkLoader Inspector Provider
 *
 * Custom inspector for ChunkLoaderComponent with streaming configuration.
 */

import React, { useState, useCallback } from 'react';
import { Settings, Play, Pause, RefreshCw } from 'lucide-react';
import type { IInspectorProvider, InspectorContext } from '@esengine/editor-core';
import type { ChunkLoaderComponent } from '@esengine/world-streaming';

interface ChunkLoaderInspectorData {
    entityId: string;
    component: ChunkLoaderComponent;
}

export class ChunkLoaderInspectorProvider implements IInspectorProvider<ChunkLoaderInspectorData> {
    readonly id = 'chunk-loader-inspector';
    readonly name = 'Chunk Loader Inspector';
    readonly priority = 100;

    canHandle(target: unknown): target is ChunkLoaderInspectorData {
        if (typeof target !== 'object' || target === null) return false;
        const obj = target as Record<string, unknown>;
        return 'entityId' in obj && 'component' in obj &&
            obj.component !== null &&
            typeof obj.component === 'object' &&
            'chunkSize' in (obj.component as Record<string, unknown>) &&
            'loadRadius' in (obj.component as Record<string, unknown>);
    }

    render(data: ChunkLoaderInspectorData, _context: InspectorContext): React.ReactElement {
        const { component } = data;

        return (
            <div className="entity-inspector">
                <div className="inspector-section">
                    <div className="section-title">
                        <Settings size={14} style={{ marginRight: '6px' }} />
                        Streaming Configuration
                    </div>

                    <div className="property-row">
                        <label>Chunk Size</label>
                        <span>{component.chunkSize} units</span>
                    </div>

                    <div className="property-row">
                        <label>Load Radius</label>
                        <span>{component.loadRadius} chunks</span>
                    </div>

                    <div className="property-row">
                        <label>Unload Radius</label>
                        <span>{component.unloadRadius} chunks</span>
                    </div>

                    <div className="property-row">
                        <label>Max Loads/Frame</label>
                        <span>{component.maxLoadsPerFrame}</span>
                    </div>

                    <div className="property-row">
                        <label>Unload Delay</label>
                        <span>{component.unloadDelay}ms</span>
                    </div>

                    <div className="property-row">
                        <label>Prefetch</label>
                        <span>{component.bEnablePrefetch ? 'Enabled' : 'Disabled'}</span>
                    </div>

                    {component.bEnablePrefetch && (
                        <div className="property-row">
                            <label>Prefetch Radius</label>
                            <span>{component.prefetchRadius} chunks</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
