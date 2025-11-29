/**
 * Tile Set Selector Panel - Left panel for selecting tiles
 * 瓦片集选择面板 - 左侧面板用于选择瓦片
 */

import React, { useState, useCallback } from 'react';
import { Paintbrush, Eraser, PaintBucket, ChevronDown, Grid3x3, Search } from 'lucide-react';
import { useTilemapEditorStore, type TilemapToolType } from '../../stores/TilemapEditorStore';
import { TilesetPreview } from '../TilesetPreview';
import '../../styles/TileSetSelectorPanel.css';

interface TilesetOption {
    name: string;
    path: string;
}

interface TileSetSelectorPanelProps {
    tilesets: TilesetOption[];
    activeTilesetIndex: number;
    onTilesetChange: (index: number) => void;
    onAddTileset: () => void;
}

export const TileSetSelectorPanel: React.FC<TileSetSelectorPanelProps> = ({
    tilesets,
    activeTilesetIndex,
    onTilesetChange,
    onAddTileset
}) => {
    const {
        currentTool,
        setCurrentTool,
        tilesetImageUrl,
        tileWidth,
        tileHeight,
        tilesetColumns,
        tilesetRows,
        selectedTiles
    } = useTilemapEditorStore();

    const [showTilesetDropdown, setShowTilesetDropdown] = useState(false);
    const [previewZoom, setPreviewZoom] = useState(1);

    const handleToolChange = useCallback((tool: TilemapToolType) => {
        setCurrentTool(tool);
    }, [setCurrentTool]);

    const activeTileset = tilesets[activeTilesetIndex];

    return (
        <div className="tileset-selector-panel">
            {/* Tool buttons */}
            <div className="tileset-tools">
                <button
                    className={`tileset-tool-btn ${currentTool === 'brush' ? 'active' : ''}`}
                    onClick={() => handleToolChange('brush')}
                    title="绘制"
                >
                    <Paintbrush size={24} />
                    <span>绘制</span>
                </button>
                <button
                    className={`tileset-tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
                    onClick={() => handleToolChange('eraser')}
                    title="橡皮擦"
                >
                    <Eraser size={24} />
                    <span>橡皮擦</span>
                </button>
                <button
                    className={`tileset-tool-btn ${currentTool === 'fill' ? 'active' : ''}`}
                    onClick={() => handleToolChange('fill')}
                    title="填充"
                >
                    <PaintBucket size={24} />
                    <span>填充</span>
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
                        <span>{activeTileset?.name || '(无)'}</span>
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
                {tilesetImageUrl ? (
                    <TilesetPreview
                        imageUrl={tilesetImageUrl}
                        tileWidth={tileWidth}
                        tileHeight={tileHeight}
                        columns={tilesetColumns}
                        rows={tilesetRows}
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
        </div>
    );
};

export default TileSetSelectorPanel;
