/**
 * Layer Panel Component
 * 图层面板组件
 */

import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, ChevronUp, ChevronDown, Paintbrush, Shield, Grid3X3 } from 'lucide-react';
import { useTilemapEditorStore, type LayerState } from '../../stores/TilemapEditorStore';
import type { TilemapComponent } from '@esengine/tilemap';

interface LayerPanelProps {
    tilemap: TilemapComponent | null;
    onAddLayer?: () => void;
    onRemoveLayer?: (index: number) => void;
    onMoveLayer?: (fromIndex: number, toIndex: number) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
    tilemap,
    onAddLayer,
    onRemoveLayer,
    onMoveLayer,
}) => {
    const {
        currentLayer,
        layers,
        setCurrentLayer,
        toggleLayerVisibility,
        toggleLayerLocked,
        setLayerOpacity,
        renameLayer,
        showCollision,
        setShowCollision,
        editingCollision,
        setEditingCollision,
    } = useTilemapEditorStore();

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const handleDoubleClick = useCallback((index: number, name: string) => {
        setEditingIndex(index);
        setEditName(name);
    }, []);

    const handleNameSubmit = useCallback((index: number) => {
        if (editName.trim()) {
            renameLayer(index, editName.trim());
            // Also update the tilemap component
            if (tilemap && tilemap.layers[index]) {
                tilemap.layers[index].name = editName.trim();
            }
        }
        setEditingIndex(null);
    }, [editName, renameLayer, tilemap]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            handleNameSubmit(index);
        } else if (e.key === 'Escape') {
            setEditingIndex(null);
        }
    }, [handleNameSubmit]);

    const handleVisibilityToggle = useCallback((index: number) => {
        toggleLayerVisibility(index);
        // Also update the tilemap component
        if (tilemap && tilemap.layers[index]) {
            tilemap.layers[index].visible = !tilemap.layers[index].visible;
            tilemap.renderDirty = true;
        }
    }, [toggleLayerVisibility, tilemap]);

    const handleOpacityChange = useCallback((index: number, opacity: number) => {
        setLayerOpacity(index, opacity);
        // Also update the tilemap component
        if (tilemap && tilemap.layers[index]) {
            tilemap.layers[index].opacity = opacity;
            tilemap.renderDirty = true;
        }
    }, [setLayerOpacity, tilemap]);

    if (!tilemap || layers.length === 0) {
        return (
            <div className="layer-panel">
                <div className="layer-panel-header">
                    <span>图层</span>
                    <button
                        className="icon-button"
                        onClick={onAddLayer}
                        title="添加图层"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                <div className="layer-panel-empty">
                    暂无图层
                </div>
            </div>
        );
    }

    return (
        <div className="layer-panel">
            <div className="layer-panel-header">
                <span>图层 ({layers.length})</span>
                <div className="layer-panel-actions">
                    <button
                        className="icon-button"
                        onClick={onAddLayer}
                        title="添加图层"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            <div className="layer-list">
                {/* Collision Layer - Special layer */}
                <div
                    className={`layer-item collision-layer ${editingCollision ? 'selected' : ''}`}
                    onClick={() => {
                        setEditingCollision(true);
                        // Auto-show collision when editing
                        if (!showCollision) {
                            setShowCollision(true);
                        }
                    }}
                >
                    <div className="layer-controls">
                        <button
                            className="icon-button small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCollision(!showCollision);
                            }}
                            title={showCollision ? '隐藏碰撞层' : '显示碰撞层'}
                        >
                            {showCollision ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                    </div>
                    <div className="layer-info">
                        {editingCollision && (
                            <span className="layer-active-indicator" title="当前编辑碰撞">
                                <Shield size={14} />
                            </span>
                        )}
                        <span className="layer-name collision-name">
                            <Shield size={12} style={{ marginRight: 4, opacity: 0.7 }} />
                            碰撞层
                        </span>
                    </div>
                </div>

                {/* Separator */}
                <div className="layer-separator" />

                {/* Tile Layers */}
                {layers.map((layer, index) => (
                    <div
                        key={layer.id}
                        className={`layer-item ${index === currentLayer && !editingCollision ? 'selected' : ''} ${layer.locked ? 'locked' : ''}`}
                        onClick={() => {
                            setEditingCollision(false);
                            setCurrentLayer(index);
                        }}
                    >
                        <div className="layer-controls">
                            <button
                                className="icon-button small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleVisibilityToggle(index);
                                }}
                                title={layer.visible ? '隐藏图层' : '显示图层'}
                            >
                                {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                            </button>
                            <button
                                className="icon-button small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLayerLocked(index);
                                }}
                                title={layer.locked ? '解锁图层' : '锁定图层'}
                            >
                                {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                            </button>
                        </div>

                        <div className="layer-info">
                            {index === currentLayer && (
                                <span className="layer-active-indicator" title="当前绘制图层">
                                    <Paintbrush size={14} />
                                </span>
                            )}
                            {editingIndex === index ? (
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onBlur={() => handleNameSubmit(index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    autoFocus
                                    className="layer-name-input"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span
                                    className="layer-name"
                                    onDoubleClick={() => handleDoubleClick(index, layer.name)}
                                >
                                    {layer.name}
                                </span>
                            )}
                        </div>

                        <div className="layer-actions">
                            <button
                                className="icon-button small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveLayer?.(index, index - 1);
                                }}
                                disabled={index === 0}
                                title="上移图层"
                            >
                                <ChevronUp size={12} />
                            </button>
                            <button
                                className="icon-button small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveLayer?.(index, index + 1);
                                }}
                                disabled={index === layers.length - 1}
                                title="下移图层"
                            >
                                <ChevronDown size={12} />
                            </button>
                            <button
                                className="icon-button small danger"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveLayer?.(index);
                                }}
                                disabled={layers.length <= 1}
                                title="删除图层"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Opacity slider for selected layer */}
            {layers[currentLayer] && (
                <div className="layer-opacity-control">
                    <label>Opacity</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={layers[currentLayer].opacity}
                        onChange={(e) => handleOpacityChange(currentLayer, parseFloat(e.target.value))}
                        title={`Opacity for ${layers[currentLayer].name}`}
                    />
                    <span>{Math.round(layers[currentLayer].opacity * 100)}%</span>
                </div>
            )}
        </div>
    );
};

export default LayerPanel;
