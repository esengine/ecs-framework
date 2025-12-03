/**
 * Tile Set Selector Panel - Left panel for selecting tiles
 * 瓦片集选择面板 - 左侧面板用于选择瓦片
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Paintbrush, Eraser, PaintBucket, ChevronDown, Grid3x3, Search, Box, Square, BoxSelect } from 'lucide-react';
import { useTilemapEditorStore, type TilemapToolType } from '../../stores/TilemapEditorStore';
import { TilesetPreview } from '../TilesetPreview';
import { TileAnimationEditor } from './TileAnimationEditor';
import type { ITilesetData, ITileAnimation } from '@esengine/tilemap';
import '../../styles/TileSetSelectorPanel.css';

interface TilesetOption {
    name: string;
    path: string;
}

interface TileSetSelectorPanelProps {
    tilesets: TilesetOption[];
    activeTilesetIndex: number;
    activeTileset?: ITilesetData;
    tilesetImage?: HTMLImageElement | null;
    onTilesetChange: (index: number) => void;
    onAddTileset: () => void;
    onTileAnimationChange?: (tileId: number, animation: ITileAnimation | null) => void;
}

export const TileSetSelectorPanel: React.FC<TileSetSelectorPanelProps> = ({
    tilesets,
    activeTilesetIndex,
    activeTileset,
    tilesetImage,
    onTilesetChange,
    onAddTileset,
    onTileAnimationChange
}) => {
    const {
        currentTool,
        setCurrentTool,
        tilesetImageUrl,
        tileWidth,
        tileHeight,
        tilesetColumns,
        tilesetRows,
        selectedTiles,
        editingCollision,
        setEditingCollision
    } = useTilemapEditorStore();

    const [showTilesetDropdown, setShowTilesetDropdown] = useState(false);
    const [previewZoom, _setPreviewZoom] = useState(1);
    const [editingAnimationTileId, setEditingAnimationTileId] = useState<number | null>(null);

    // Get animated tile IDs from tileset
    const animatedTileIds = useMemo(() => {
        const ids = new Set<number>();
        if (activeTileset?.tiles) {
            for (const tile of activeTileset.tiles) {
                if (tile.animation && tile.animation.frames.length > 0) {
                    ids.add(tile.id);
                }
            }
        }
        return ids;
    }, [activeTileset]);

    // Get current animation for editing tile
    const editingTileAnimation = useMemo(() => {
        if (editingAnimationTileId === null || !activeTileset?.tiles) return null;
        const tile = activeTileset.tiles.find(t => t.id === editingAnimationTileId);
        return tile?.animation ?? null;
    }, [editingAnimationTileId, activeTileset]);

    const handleEditAnimation = useCallback((tileId: number) => {
        setEditingAnimationTileId(tileId);
    }, []);

    const handleAnimationChange = useCallback((animation: ITileAnimation | null) => {
        if (editingAnimationTileId !== null && onTileAnimationChange) {
            onTileAnimationChange(editingAnimationTileId, animation);
        }
    }, [editingAnimationTileId, onTileAnimationChange]);

    const handleCloseAnimationEditor = useCallback(() => {
        setEditingAnimationTileId(null);
    }, []);

    const handleToolChange = useCallback((tool: TilemapToolType) => {
        setCurrentTool(tool);
    }, [setCurrentTool]);

    const { setShowCollision } = useTilemapEditorStore();

    const handleToggleCollisionMode = useCallback((enabled: boolean) => {
        setEditingCollision(enabled);
        // 启用碰撞编辑时自动显示碰撞
        if (enabled) {
            setShowCollision(true);
        }
    }, [setEditingCollision, setShowCollision]);

    const activeTilesetOption = tilesets[activeTilesetIndex];

    return (
        <div className="tileset-selector-panel">
            {/* Mode toggle */}
            <div className="tileset-mode-toggle">
                <button
                    className={`mode-toggle-btn ${!editingCollision ? 'active' : ''}`}
                    onClick={() => handleToggleCollisionMode(false)}
                    title="瓦片编辑模式"
                >
                    <Paintbrush size={14} />
                    <span>瓦片</span>
                </button>
                <button
                    className={`mode-toggle-btn ${editingCollision ? 'active' : ''}`}
                    onClick={() => handleToggleCollisionMode(true)}
                    title="碰撞编辑模式"
                >
                    <Box size={14} />
                    <span>碰撞</span>
                </button>
            </div>

            {/* Tool buttons */}
            <div className="tileset-tools">
                <button
                    className={`tileset-tool-btn ${currentTool === 'brush' ? 'active' : ''}`}
                    onClick={() => handleToolChange('brush')}
                    title={editingCollision ? "绘制碰撞" : "绘制瓦片"}
                >
                    <Paintbrush size={24} />
                    <span>绘制</span>
                </button>
                <button
                    className={`tileset-tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
                    onClick={() => handleToolChange('eraser')}
                    title={editingCollision ? "擦除碰撞" : "擦除瓦片"}
                >
                    <Eraser size={24} />
                    <span>橡皮擦</span>
                </button>
                <button
                    className={`tileset-tool-btn ${currentTool === 'fill' ? 'active' : ''}`}
                    onClick={() => handleToolChange('fill')}
                    title={editingCollision ? "填充碰撞" : "填充瓦片"}
                >
                    <PaintBucket size={24} />
                    <span>填充</span>
                </button>
                <button
                    className={`tileset-tool-btn ${currentTool === 'rectangle' ? 'active' : ''}`}
                    onClick={() => handleToolChange('rectangle')}
                    title={editingCollision ? "矩形碰撞" : "矩形绘制"}
                >
                    <Square size={24} />
                    <span>矩形</span>
                </button>
                <button
                    className={`tileset-tool-btn ${currentTool === 'select' ? 'active' : ''}`}
                    onClick={() => handleToolChange('select')}
                    title="选择区域"
                >
                    <BoxSelect size={24} />
                    <span>选择</span>
                </button>
            </div>

            {/* Active Tile Set selector */}
            <div className="tileset-selector">
                <div className="tileset-selector-row">
                    <label>活跃瓦片集</label>
                    <div className="tileset-selector-actions">
                        <button className="tileset-action-btn" title="显示网格">
                            <Grid3x3 size={14} />
                        </button>
                        <button className="tileset-action-btn" title="搜索">
                            <Search size={14} />
                        </button>
                    </div>
                </div>
                <div className="tileset-dropdown-wrapper">
                    <button
                        className="tileset-dropdown-btn"
                        onClick={() => setShowTilesetDropdown(!showTilesetDropdown)}
                    >
                        <span>{activeTilesetOption?.name || '(无)'}</span>
                        <ChevronDown size={14} />
                    </button>
                    {showTilesetDropdown && (
                        <div className="tileset-dropdown-menu">
                            <button
                                className={`tileset-dropdown-item ${activeTilesetIndex === -1 ? 'selected' : ''}`}
                                onClick={() => {
                                    onTilesetChange(-1);
                                    setShowTilesetDropdown(false);
                                }}
                            >
                                (无)
                            </button>
                            {tilesets.map((tileset, index) => (
                                <button
                                    key={tileset.path}
                                    className={`tileset-dropdown-item ${index === activeTilesetIndex ? 'selected' : ''}`}
                                    onClick={() => {
                                        onTilesetChange(index);
                                        setShowTilesetDropdown(false);
                                    }}
                                >
                                    {tileset.name}
                                </button>
                            ))}
                            <div className="tileset-dropdown-divider" />
                            <button
                                className="tileset-dropdown-item add-new"
                                onClick={() => {
                                    onAddTileset();
                                    setShowTilesetDropdown(false);
                                }}
                            >
                                + 添加瓦片集...
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Zoom and title header */}
            <div className="tileset-header">
                <span className="tileset-zoom-label">缩放{previewZoom}:1</span>
                <span className="tileset-title">瓦片集选择器</span>
            </div>

            {/* Tile preview area */}
            <div className="tileset-preview-area">
                {editingCollision ? (
                    <div className="collision-mode-hint">
                        <Box size={32} />
                        <span className="collision-mode-title">碰撞编辑模式</span>
                        <span className="collision-mode-desc">使用画笔绘制碰撞区域</span>
                        <span className="collision-mode-desc">使用橡皮擦清除碰撞</span>
                    </div>
                ) : tilesetImageUrl ? (
                    <TilesetPreview
                        imageUrl={tilesetImageUrl}
                        tileWidth={tileWidth}
                        tileHeight={tileHeight}
                        columns={tilesetColumns}
                        rows={tilesetRows}
                        tileset={activeTileset}
                        animatedTileIds={animatedTileIds}
                        onEditAnimation={handleEditAnimation}
                    />
                ) : (
                    <div className="tileset-empty-hint">
                        <button className="tileset-select-btn" onClick={onAddTileset}>
                            选择瓦片集
                        </button>
                    </div>
                )}
            </div>

            {/* Selection info */}
            {selectedTiles && (
                <div className="tileset-selection-info">
                    已选择: {selectedTiles.width}×{selectedTiles.height}
                </div>
            )}

            {/* Animation Editor */}
            {editingAnimationTileId !== null && activeTileset && tilesetImage && (
                <TileAnimationEditor
                    tileId={editingAnimationTileId}
                    tileset={activeTileset}
                    tilesetImage={tilesetImage}
                    animation={editingTileAnimation}
                    onAnimationChange={handleAnimationChange}
                    onClose={handleCloseAnimationEditor}
                />
            )}
        </div>
    );
};

export default TileSetSelectorPanel;
