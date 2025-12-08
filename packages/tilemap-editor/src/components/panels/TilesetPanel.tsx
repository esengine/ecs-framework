/**
 * Tileset Panel - Display tileset for selection
 */

import React, { useEffect, useCallback } from 'react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { TilemapComponent, type ITilesetData } from '@esengine/tilemap';
import { useTilemapEditorStore } from '../../stores/TilemapEditorStore';
import { TilesetPreview } from '../TilesetPreview';
import '../../styles/TilemapEditor.css';

// Helper to convert file path to URL
function convertFileSrc(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('asset://')) {
        return path;
    }
    return `asset://localhost/${encodeURIComponent(path)}`;
}

interface TilesetPanelProps {
    projectPath?: string | null;
}

export const TilesetPanel: React.FC<TilesetPanelProps> = () => {
    const {
        entityId,
        tilesetImageUrl,
        tilesetColumns,
        tilesetRows,
        tileWidth,
        tileHeight,
        selectedTiles,
        setTileset
    } = useTilemapEditorStore();

    // Load tileset from component
    const loadTilesetFromComponent = useCallback(() => {
        if (!entityId) return;

        const scene = Core.scene;
        if (!scene) return;

        const foundEntity = scene.findEntityById(parseInt(entityId, 10));
        if (!foundEntity) return;

        const tilemapComp = foundEntity.getComponent(TilemapComponent);
        if (!tilemapComp) return;

        // Get tileset source from first tileset
        const tilesetRef = tilemapComp.tilesets[0];
        if (!tilesetRef) return;

        const tilesetPath = tilesetRef.source;
        const imageUrl = convertFileSrc(tilesetPath);
        const currentState = useTilemapEditorStore.getState();

        // Check if URL or tile dimensions changed
        const urlChanged = imageUrl !== currentState.tilesetImageUrl;
        const dimensionsChanged =
            tilemapComp.tileWidth !== currentState.tileWidth ||
            tilemapComp.tileHeight !== currentState.tileHeight;

        if (!urlChanged && !dimensionsChanged) return;

        const img = new Image();
        img.onload = () => {
            const columns = Math.floor(img.width / tilemapComp.tileWidth);
            const rows = Math.floor(img.height / tilemapComp.tileHeight);

            // Create tileset data and set it
            const tilesetData: ITilesetData = {
                name: 'tileset',
                version: 1,
                image: tilesetPath,
                imageWidth: img.width,
                imageHeight: img.height,
                tileWidth: tilemapComp.tileWidth,
                tileHeight: tilemapComp.tileHeight,
                tileCount: columns * rows,
                columns,
                rows
            };
            tilemapComp.setTilesetData(0, tilesetData);
            setTileset(imageUrl, columns, rows, tilemapComp.tileWidth, tilemapComp.tileHeight);
        };
        img.src = imageUrl;
    }, [entityId, setTileset]);

    // Load tileset when entityId is set but tilesetImageUrl is not yet loaded
    useEffect(() => {
        if (!entityId || tilesetImageUrl) return;
        loadTilesetFromComponent();
    }, [entityId, tilesetImageUrl, loadTilesetFromComponent]);

    // Listen for scene modifications to reload tileset when property changes
    useEffect(() => {
        if (!entityId) return;

        const messageHub = Core.services.resolve(MessageHub);
        if (!messageHub) return;

        const unsubscribe = messageHub.subscribe('scene:modified', () => {
            loadTilesetFromComponent();
        });
        return unsubscribe;
    }, [entityId, loadTilesetFromComponent]);

    if (!tilesetImageUrl) {
        return (
            <div className="tileset-panel">
                <div className="tileset-panel-header">
                    <h3>Tileset</h3>
                </div>
                <div className="tileset-empty">
                    <p>
                        No tileset loaded.
                        <br />
                        Select a TilemapComponent to edit.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="tileset-panel">
            <div className="tileset-panel-header">
                <h3>Tileset</h3>
            </div>
            <div className="tileset-canvas-container">
                <TilesetPreview
                    imageUrl={tilesetImageUrl}
                    tileWidth={tileWidth}
                    tileHeight={tileHeight}
                    columns={tilesetColumns}
                    rows={tilesetRows}
                />
            </div>
            {selectedTiles && (
                <div className="tilemap-info-bar">
                    <span>
                        Selected: {selectedTiles.width}×{selectedTiles.height}
                    </span>
                    <span>Tile: {selectedTiles.tiles[0]}</span>
                </div>
            )}
        </div>
    );
};
