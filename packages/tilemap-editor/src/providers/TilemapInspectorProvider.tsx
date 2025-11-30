/**
 * Tilemap Inspector Provider - Custom inspector for TilemapComponent
 */

import React from 'react';
import { Edit3 } from 'lucide-react';
import type { IInspectorProvider, InspectorContext } from '@esengine/editor-core';
import { MessageHub } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';
import type { TilemapComponent } from '@esengine/tilemap';

interface TilemapInspectorData {
    entityId: string;
    component: TilemapComponent;
}

export class TilemapInspectorProvider implements IInspectorProvider<TilemapInspectorData> {
    readonly id = 'tilemap-component-inspector';
    readonly name = 'Tilemap Component Inspector';
    readonly priority = 100;

    canHandle(target: unknown): target is TilemapInspectorData {
        if (typeof target !== 'object' || target === null) return false;
        const obj = target as Record<string, unknown>;
        return 'entityId' in obj && 'component' in obj &&
            obj.component !== null &&
            typeof obj.component === 'object' &&
            'width' in (obj.component as Record<string, unknown>) &&
            'height' in (obj.component as Record<string, unknown>) &&
            'tileWidth' in (obj.component as Record<string, unknown>);
    }

    render(data: TilemapInspectorData, context: InspectorContext): React.ReactElement {
        const { entityId, component } = data;

        const handleEditClick = () => {
            // Emit event to open tilemap editor
            const messageHub = Core.services.resolve(MessageHub);
            messageHub?.publish('tilemap:edit', { entityId });

            // Open the tilemap editor panel
            messageHub?.publish('dynamic-panel:open', { panelId: 'tilemap-editor', title: 'Tilemap Editor' });
        };

        return (
            <div className="entity-inspector">
                <div className="inspector-section">
                    <div className="section-title">Tilemap</div>

                    <div className="property-row">
                        <label>Size</label>
                        <span>{component.width} × {component.height}</span>
                    </div>

                    <div className="property-row">
                        <label>Tile Size</label>
                        <span>{component.tileWidth} × {component.tileHeight}</span>
                    </div>

                    <div className="property-row">
                        <label>Tileset</label>
                        <span>{component.tilesets[0]?.source || 'None'}</span>
                    </div>

                    <div className="property-row">
                        <label>Layers</label>
                        <span>{component.layers.length}</span>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={handleEditClick}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                width: '100%',
                                border: 'none',
                                borderRadius: '4px',
                                background: 'var(--accent-color, #0078d4)',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                            }}
                        >
                            <Edit3 size={14} />
                            Edit Tilemap
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
