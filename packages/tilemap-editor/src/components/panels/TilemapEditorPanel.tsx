/**
 * Tilemap Editor Panel - Main editing panel
 */

import React, { useEffect, useState } from 'react';
import {
    Paintbrush,
    Eraser,
    PaintBucket,
    Grid3x3,
    Eye,
    EyeOff,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Map,
    Shield,
} from 'lucide-react';
import { Core, Entity } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { TilemapComponent } from '@esengine/tilemap';
import { useTilemapEditorStore, type TilemapToolType } from '../../stores/TilemapEditorStore';
import { TilemapCanvas } from '../TilemapCanvas';
import '../../styles/TilemapEditor.css';

interface TilemapEditorPanelProps {
    projectPath?: string | null;
    messageHub?: MessageHub;
}

export const TilemapEditorPanel: React.FC<TilemapEditorPanelProps> = ({ messageHub: propMessageHub }) => {
    const [tilemap, setTilemap] = useState<TilemapComponent | null>(null);
    const [entity, setEntity] = useState<Entity | null>(null);
    const [tilesetImage, setTilesetImage] = useState<HTMLImageElement | null>(null);
    // Track tilemap dimensions for re-render when resized
    const [tilemapKey, setTilemapKey] = useState('');

    // Get messageHub from props or resolve from Core.services
    const messageHub = propMessageHub || Core.services.resolve(MessageHub);

    const {
        entityId,
        currentTool,
        zoom,
        showGrid,
        showCollision,
        editingCollision,
        tileWidth,
        tileHeight,
        tilesetImageUrl,
        setEntityId,
        setCurrentTool,
        setZoom,
        setShowGrid,
        setShowCollision,
        setEditingCollision,
        setPan,
        setTileset,
    } = useTilemapEditorStore();

    // Listen for tilemap edit requests
    useEffect(() => {
        if (!messageHub) return;

        const unsubscribe = messageHub.subscribe('tilemap:edit', (data: { entityId: string }) => {
            setEntityId(data.entityId);
        });

        return unsubscribe;
    }, [messageHub, setEntityId]);

    // Load tilemap component when entityId changes
    useEffect(() => {
        if (!entityId) {
            setTilemap(null);
            setEntity(null);
            return;
        }

        const scene = Core.scene;
        if (!scene) return;

        const foundEntity = scene.findEntityById(parseInt(entityId, 10));
        if (!foundEntity) return;

        const tilemapComp = foundEntity.components.find(c => c.constructor.name === 'TilemapComponent') as TilemapComponent;
        if (!tilemapComp) return;

        setEntity(foundEntity);
        setTilemap(tilemapComp);

        // Load tileset image
        const tilesetPath = (tilemapComp as any).tilesetImage || tilemapComp.tilesetAssetGuid;
        if (tilesetPath) {
            const imageUrl = convertFileSrc(tilesetPath);
            const img = new Image();
            img.onload = () => {
                const columns = Math.floor(img.width / tilemapComp.tileWidth);
                const rows = Math.floor(img.height / tilemapComp.tileHeight);
                // Set tileset info on component for UV calculation
                tilemapComp.setTilesetInfo(
                    img.width, img.height,
                    tilemapComp.tileWidth, tilemapComp.tileHeight,
                    columns, rows
                );
                setTileset(imageUrl, columns, rows, tilemapComp.tileWidth, tilemapComp.tileHeight);
            };
            img.onerror = () => {
                setTileset(null, 0, 0, tilemapComp.tileWidth, tilemapComp.tileHeight);
            };
            img.src = imageUrl;
        } else {
            setTileset(null, 0, 0, tilemapComp.tileWidth, tilemapComp.tileHeight);
        }
    }, [entityId, setTileset]);

    // Listen for scene modifications to detect when tileset property changes
    useEffect(() => {
        if (!messageHub || !tilemap) return;

        const loadTilesetFromComponent = () => {
            const tilesetPath = (tilemap as any).tilesetImage || tilemap.tilesetAssetGuid;
            if (tilesetPath) {
                const imageUrl = convertFileSrc(tilesetPath);
                if (imageUrl !== tilesetImageUrl) {
                    const img = new Image();
                    img.onload = () => {
                        const columns = Math.floor(img.width / tilemap.tileWidth);
                        const rows = Math.floor(img.height / tilemap.tileHeight);
                        // Set tileset info on component for UV calculation
                        tilemap.setTilesetInfo(
                            img.width, img.height,
                            tilemap.tileWidth, tilemap.tileHeight,
                            columns, rows
                        );
                        setTileset(imageUrl, columns, rows, tilemap.tileWidth, tilemap.tileHeight);
                    };
                    img.onerror = () => {
                        setTileset(null, 0, 0, tilemap.tileWidth, tilemap.tileHeight);
                    };
                    img.src = imageUrl;
                }
            }
        };

        const unsubscribeModified = messageHub.subscribe('scene:modified', () => {
            loadTilesetFromComponent();
            // Update key to force TilemapCanvas re-render when dimensions change
            setTilemapKey(`${tilemap.width}-${tilemap.height}-${Date.now()}`);
        });

        // Also reload tileset when scene is restored (after stopping play mode)
        const unsubscribeRestored = messageHub.subscribe('scene:restored', () => {
            // Need to get fresh tilemap reference since scene was restored
            if (!entityId) return;
            const scene = Core.scene;
            if (!scene) return;

            const foundEntity = scene.findEntityById(parseInt(entityId, 10));
            if (!foundEntity) return;

            const newTilemap = foundEntity.components.find(c => c.constructor.name === 'TilemapComponent') as TilemapComponent | undefined;
            if (!newTilemap) return;

            // Update tilemap reference
            setTilemap(newTilemap);

            // Reload tileset info
            const tilesetPath = (newTilemap as any).tilesetImage || newTilemap.tilesetAssetGuid;
            if (tilesetPath) {
                const imageUrl = convertFileSrc(tilesetPath);
                const img = new Image();
                img.onload = () => {
                    const columns = Math.floor(img.width / newTilemap.tileWidth);
                    const rows = Math.floor(img.height / newTilemap.tileHeight);
                    newTilemap.setTilesetInfo(
                        img.width, img.height,
                        newTilemap.tileWidth, newTilemap.tileHeight,
                        columns, rows
                    );
                    setTileset(imageUrl, columns, rows, newTilemap.tileWidth, newTilemap.tileHeight);
                };
                img.src = imageUrl;
            }
        });

        return () => {
            unsubscribeModified();
            unsubscribeRestored();
        };
    }, [messageHub, tilemap, tilesetImageUrl, setTileset, entityId, setTilemap]);

    // Load tileset image
    useEffect(() => {
        if (!tilesetImageUrl) {
            setTilesetImage(null);
            return;
        }

        const img = new Image();
        img.onload = () => setTilesetImage(img);
        img.src = tilesetImageUrl;
    }, [tilesetImageUrl]);

    const handleTilemapChange = () => {
        // Notify that the scene has changed
        messageHub?.publish('scene:modified', {});
    };

    const handleToolChange = (tool: TilemapToolType) => {
        setCurrentTool(tool);
    };

    const handleZoomIn = () => setZoom(Math.min(10, zoom * 1.2));
    const handleZoomOut = () => setZoom(Math.max(0.1, zoom / 1.2));
    const handleResetView = () => {
        setZoom(1);
        setPan(0, 0);
    };

    if (!tilemap) {
        return (
            <div className="tilemap-editor-panel">
                <div className="tilemap-editor-empty">
                    <Map size={48} />
                    <h3>No Tilemap Selected</h3>
                    <p>Select an entity with a TilemapComponent<br />and click "Edit Tilemap" to start editing.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tilemap-editor-panel">
            {/* Toolbar */}
            <div className="tilemap-editor-toolbar">
                {/* Tool buttons */}
                <div className="tool-group">
                    <button
                        className={`tool-btn ${currentTool === 'brush' ? 'active' : ''}`}
                        onClick={() => handleToolChange('brush')}
                        title="Brush (B)"
                    >
                        <Paintbrush size={16} />
                    </button>
                    <button
                        className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
                        onClick={() => handleToolChange('eraser')}
                        title="Eraser (E)"
                    >
                        <Eraser size={16} />
                    </button>
                    <button
                        className={`tool-btn ${currentTool === 'fill' ? 'active' : ''}`}
                        onClick={() => handleToolChange('fill')}
                        title="Fill (G)"
                    >
                        <PaintBucket size={16} />
                    </button>
                </div>

                <div className="separator" />

                {/* View toggles */}
                <div className="tool-group">
                    <button
                        className={`tool-btn ${showGrid ? 'active' : ''}`}
                        onClick={() => setShowGrid(!showGrid)}
                        title="Toggle Grid"
                    >
                        <Grid3x3 size={16} />
                    </button>
                    <button
                        className={`tool-btn ${showCollision ? 'active' : ''}`}
                        onClick={() => setShowCollision(!showCollision)}
                        title="Show Collision"
                    >
                        {showCollision ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                        className={`tool-btn ${editingCollision ? 'active' : ''}`}
                        onClick={() => setEditingCollision(!editingCollision)}
                        title="Edit Collision Layer"
                    >
                        <Shield size={16} />
                    </button>
                </div>

                {/* Zoom controls */}
                <div className="zoom-control">
                    <button className="tool-btn" onClick={handleZoomOut} title="Zoom Out">
                        <ZoomOut size={16} />
                    </button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button className="tool-btn" onClick={handleZoomIn} title="Zoom In">
                        <ZoomIn size={16} />
                    </button>
                    <button className="tool-btn" onClick={handleResetView} title="Reset View">
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <TilemapCanvas
                key={tilemapKey}
                tilemap={tilemap}
                tilesetImage={tilesetImage}
                onTilemapChange={handleTilemapChange}
            />

            {/* Info bar */}
            <div className="tilemap-info-bar">
                <span>Size: {tilemap.width}×{tilemap.height}</span>
                <span>Tile: {tileWidth}×{tileHeight}</span>
                {entity && <span>Entity: {entity.name}</span>}
                {editingCollision && <span style={{ color: '#ff6b6b' }}>Editing Collision</span>}
            </div>
        </div>
    );
};
