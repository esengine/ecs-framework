import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { ChunkManager, IChunkCoord, IChunkInfo } from '@esengine/world-streaming';
import { EChunkState } from '@esengine/world-streaming';
import '../styles/ChunkVisualizer.css';

export interface ChunkVisualizerProps {
    chunkManager: ChunkManager | null;
    cameraX: number;
    cameraY: number;
    cameraZoom: number;
    viewWidth: number;
    viewHeight: number;
    bShowCoords?: boolean;
    bShowStats?: boolean;
    bShowRadii?: boolean;
    anchorPositions?: Array<{ x: number; y: number }>;
    loadRadius?: number;
    unloadRadius?: number;
}

interface ChunkDisplayInfo {
    coord: IChunkCoord;
    state: EChunkState;
    screenX: number;
    screenY: number;
    screenWidth: number;
    screenHeight: number;
    isAnchorChunk: boolean;
}

/**
 * 区块可视化组件
 *
 * Chunk visualization overlay for editor viewport.
 */
export const ChunkVisualizer: React.FC<ChunkVisualizerProps> = ({
    chunkManager,
    cameraX,
    cameraY,
    cameraZoom,
    viewWidth,
    viewHeight,
    bShowCoords = true,
    bShowStats = true,
    bShowRadii = true,
    anchorPositions = [],
    loadRadius = 2,
    unloadRadius = 4
}) => {
    const [chunks, setChunks] = useState<ChunkDisplayInfo[]>([]);
    const [stats, setStats] = useState({
        loaded: 0,
        loading: 0,
        pendingLoad: 0,
        pendingUnload: 0
    });

    const chunkSize = chunkManager?.chunkSize ?? 512;

    const worldToScreen = useCallback((worldX: number, worldY: number) => {
        const screenX = (worldX - cameraX) * cameraZoom + viewWidth / 2;
        const screenY = (worldY - cameraY) * cameraZoom + viewHeight / 2;
        return { x: screenX, y: screenY };
    }, [cameraX, cameraY, cameraZoom, viewWidth, viewHeight]);

    const anchorChunkCoords = useMemo(() => {
        return anchorPositions.map(pos => ({
            x: Math.floor(pos.x / chunkSize),
            y: Math.floor(pos.y / chunkSize)
        }));
    }, [anchorPositions, chunkSize]);

    useEffect(() => {
        if (!chunkManager) {
            setChunks([]);
            setStats({ loaded: 0, loading: 0, pendingLoad: 0, pendingUnload: 0 });
            return;
        }

        const updateChunks = () => {
            const visibleChunks: ChunkDisplayInfo[] = [];
            let loadedCount = 0;
            let loadingCount = 0;

            const halfViewW = viewWidth / 2 / cameraZoom;
            const halfViewH = viewHeight / 2 / cameraZoom;
            const margin = chunkSize * 2;

            const minChunkX = Math.floor((cameraX - halfViewW - margin) / chunkSize);
            const maxChunkX = Math.ceil((cameraX + halfViewW + margin) / chunkSize);
            const minChunkY = Math.floor((cameraY - halfViewH - margin) / chunkSize);
            const maxChunkY = Math.ceil((cameraY + halfViewH + margin) / chunkSize);

            for (let cx = minChunkX; cx <= maxChunkX; cx++) {
                for (let cy = minChunkY; cy <= maxChunkY; cy++) {
                    const coord = { x: cx, y: cy };
                    const chunkInfo = chunkManager.getChunk(coord);

                    const worldMinX = cx * chunkSize;
                    const worldMinY = cy * chunkSize;
                    const screenPos = worldToScreen(worldMinX, worldMinY);
                    const screenSize = chunkSize * cameraZoom;

                    const isAnchorChunk = anchorChunkCoords.some(
                        ac => ac.x === cx && ac.y === cy
                    );

                    const state = chunkInfo?.state ?? EChunkState.Unloaded;

                    if (state === EChunkState.Loaded) loadedCount++;
                    if (state === EChunkState.Loading) loadingCount++;

                    visibleChunks.push({
                        coord,
                        state,
                        screenX: screenPos.x,
                        screenY: screenPos.y,
                        screenWidth: screenSize,
                        screenHeight: screenSize,
                        isAnchorChunk
                    });
                }
            }

            setChunks(visibleChunks);
            setStats({
                loaded: loadedCount,
                loading: loadingCount,
                pendingLoad: chunkManager.pendingLoadCount,
                pendingUnload: chunkManager.pendingUnloadCount
            });
        };

        updateChunks();
        const interval = setInterval(updateChunks, 100);

        return () => clearInterval(interval);
    }, [chunkManager, cameraX, cameraY, cameraZoom, viewWidth, viewHeight, chunkSize, worldToScreen, anchorChunkCoords]);

    const getChunkClassName = (chunk: ChunkDisplayInfo): string => {
        const classes = ['chunk-grid-cell'];

        switch (chunk.state) {
            case EChunkState.Loaded:
                classes.push('loaded');
                break;
            case EChunkState.Loading:
                classes.push('loading');
                break;
            case EChunkState.Unloading:
                classes.push('unloading');
                break;
            case EChunkState.Failed:
                classes.push('failed');
                break;
        }

        if (chunk.isAnchorChunk) {
            classes.push('anchor-chunk');
        }

        return classes.join(' ');
    };

    const radiusIndicators = useMemo(() => {
        if (!bShowRadii || anchorPositions.length === 0) return null;

        return anchorPositions.map((pos, idx) => {
            const loadRadiusWorld = (loadRadius + 0.5) * chunkSize;
            const unloadRadiusWorld = (unloadRadius + 0.5) * chunkSize;

            const anchorChunkX = Math.floor(pos.x / chunkSize);
            const anchorChunkY = Math.floor(pos.y / chunkSize);
            const anchorChunkCenterX = (anchorChunkX + 0.5) * chunkSize;
            const anchorChunkCenterY = (anchorChunkY + 0.5) * chunkSize;

            const loadScreenPos = worldToScreen(
                anchorChunkCenterX - loadRadiusWorld,
                anchorChunkCenterY - loadRadiusWorld
            );
            const loadScreenSize = loadRadiusWorld * 2 * cameraZoom;

            const unloadScreenPos = worldToScreen(
                anchorChunkCenterX - unloadRadiusWorld,
                anchorChunkCenterY - unloadRadiusWorld
            );
            const unloadScreenSize = unloadRadiusWorld * 2 * cameraZoom;

            return (
                <React.Fragment key={idx}>
                    <div
                        className="unload-radius-indicator"
                        style={{
                            left: unloadScreenPos.x,
                            top: unloadScreenPos.y,
                            width: unloadScreenSize,
                            height: unloadScreenSize
                        }}
                    />
                    <div
                        className="load-radius-indicator"
                        style={{
                            left: loadScreenPos.x,
                            top: loadScreenPos.y,
                            width: loadScreenSize,
                            height: loadScreenSize
                        }}
                    />
                </React.Fragment>
            );
        });
    }, [bShowRadii, anchorPositions, loadRadius, unloadRadius, chunkSize, worldToScreen, cameraZoom]);

    const anchorMarkers = useMemo(() => {
        return anchorPositions.map((pos, idx) => {
            const screenPos = worldToScreen(pos.x, pos.y);
            return (
                <div
                    key={`anchor-${idx}`}
                    className="anchor-marker"
                    style={{
                        left: screenPos.x,
                        top: screenPos.y
                    }}
                />
            );
        });
    }, [anchorPositions, worldToScreen]);

    return (
        <div className="chunk-visualizer">
            <div className="chunk-visualizer-overlay">
                {chunks.map((chunk) => (
                    <div
                        key={`${chunk.coord.x},${chunk.coord.y}`}
                        className={getChunkClassName(chunk)}
                        style={{
                            left: chunk.screenX,
                            top: chunk.screenY,
                            width: chunk.screenWidth,
                            height: chunk.screenHeight
                        }}
                    >
                        {bShowCoords && chunk.screenWidth > 40 && (
                            <span className="chunk-coord-label">
                                {chunk.coord.x},{chunk.coord.y}
                            </span>
                        )}
                    </div>
                ))}

                {radiusIndicators}
                {anchorMarkers}
            </div>

            {bShowStats && (
                <div className="chunk-stats-panel">
                    <h4>Chunks</h4>
                    <div className="chunk-stats-row">
                        <span className="label">Loaded:</span>
                        <span className="value loaded">{stats.loaded}</span>
                    </div>
                    <div className="chunk-stats-row">
                        <span className="label">Loading:</span>
                        <span className="value loading">{stats.loading}</span>
                    </div>
                    <div className="chunk-stats-row">
                        <span className="label">Pending:</span>
                        <span className="value pending">{stats.pendingLoad}</span>
                    </div>
                    <div className="chunk-stats-row">
                        <span className="label">Unload Queue:</span>
                        <span className="value">{stats.pendingUnload}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
