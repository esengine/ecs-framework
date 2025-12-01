/**
 * Collision Matrix Editor Component
 * 碰撞矩阵编辑器组件
 *
 * 用于配置物理层之间的碰撞关系，支持 16 个碰撞层。
 * 使用三角形矩阵布局，双击行标题可编辑层名称。
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CollisionLayerConfig } from '@esengine/physics-rapier2d';

interface CollisionMatrixEditorProps {
    onClose?: () => void;
}

export const CollisionMatrixEditor: React.FC<CollisionMatrixEditorProps> = ({ onClose }) => {
    const [layers, setLayers] = useState(CollisionLayerConfig.getInstance().getLayers());
    const [editingLayer, setEditingLayer] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const config = CollisionLayerConfig.getInstance();

    useEffect(() => {
        const handleUpdate = () => {
            setLayers([...config.getLayers()]);
        };
        config.addListener(handleUpdate);
        return () => config.removeListener(handleUpdate);
    }, []);

    useEffect(() => {
        if (editingLayer !== null && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingLayer]);

    const handleToggleCollision = useCallback((layerA: number, layerB: number) => {
        const canCollide = config.canLayersCollide(layerA, layerB);
        config.setLayersCanCollide(layerA, layerB, !canCollide);
    }, []);

    const handleStartEdit = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingLayer(index);
        setEditName(layers[index]?.name ?? '');
    };

    const handleSaveEdit = () => {
        if (editingLayer !== null && editName.trim()) {
            config.setLayerName(editingLayer, editName.trim());
        }
        setEditingLayer(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setEditingLayer(null);
        }
    };

    const renderTriangleMatrix = () => {
        const visibleLayers = layers.slice(0, 16);

        return (
            <div className="cmx-container">
                {/* 提示信息 */}
                <div className="cmx-hint">双击层名称可编辑</div>

                <div className="cmx-matrix" onMouseLeave={() => setHoverCell(null)}>
                    {/* 列标题 */}
                    <div className="cmx-col-headers">
                        {visibleLayers.map((layer, colIdx) => (
                            <div
                                key={colIdx}
                                className={`cmx-col-label ${hoverCell?.col === colIdx ? 'highlight' : ''}`}
                                style={{ left: `${72 + colIdx * 18}px` }}
                            >
                                <span className="cmx-col-text">{layer.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* 矩阵行 */}
                    <div className="cmx-rows">
                        {visibleLayers.map((rowLayer, rowIdx) => (
                            <div key={rowIdx} className={`cmx-row ${rowIdx % 2 === 0 ? 'even' : 'odd'}`}>
                                {/* 行标题 */}
                                <div
                                    className={`cmx-row-label ${hoverCell?.row === rowIdx ? 'highlight' : ''}`}
                                    onDoubleClick={(e) => handleStartEdit(rowIdx, e)}
                                >
                                    {editingLayer === rowIdx ? (
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onBlur={handleSaveEdit}
                                            onKeyDown={handleKeyDown}
                                            className="cmx-edit-input"
                                            maxLength={16}
                                        />
                                    ) : (
                                        <span className="cmx-row-text">{rowLayer.name}</span>
                                    )}
                                </div>

                                {/* 单元格 */}
                                <div className="cmx-cells">
                                    {visibleLayers.slice(0, rowIdx + 1).map((_, colIdx) => {
                                        const canCollide = config.canLayersCollide(rowIdx, colIdx);
                                        const isHovered = hoverCell?.row === rowIdx && hoverCell?.col === colIdx;
                                        const isHighlightRow = hoverCell?.row === rowIdx;
                                        const isHighlightCol = hoverCell?.col === colIdx;

                                        return (
                                            <div
                                                key={colIdx}
                                                className={`cmx-cell ${isHovered ? 'hovered' : ''} ${(isHighlightRow || isHighlightCol) && !isHovered ? 'highlight' : ''}`}
                                                onClick={() => handleToggleCollision(rowIdx, colIdx)}
                                                onMouseEnter={() => setHoverCell({ row: rowIdx, col: colIdx })}
                                            >
                                                <div className={`cmx-checkbox ${canCollide ? 'checked' : ''}`} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="cmx-editor">
            {renderTriangleMatrix()}

            <style>{`
                .cmx-editor {
                    font-size: 11px;
                    color: var(--text-primary, #ccc);
                    overflow: visible;
                }

                .cmx-container {
                    position: relative;
                    padding: 8px;
                    padding-top: 75px;
                    overflow: visible;
                }

                .cmx-hint {
                    position: absolute;
                    top: 4px;
                    left: 8px;
                    font-size: 10px;
                    color: var(--text-tertiary, #666);
                }

                .cmx-matrix {
                    position: relative;
                    overflow: visible;
                }

                /* 列标题 */
                .cmx-col-headers {
                    position: absolute;
                    top: -65px;
                    left: 0;
                    height: 65px;
                    overflow: visible;
                }

                .cmx-col-label {
                    position: absolute;
                    bottom: 0;
                    width: 18px;
                    height: 65px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-start;
                    overflow: visible;
                }

                .cmx-col-label.highlight .cmx-col-text {
                    color: var(--accent-color, #58a6ff);
                }

                .cmx-col-text {
                    transform-origin: left bottom;
                    transform: rotate(-45deg);
                    white-space: nowrap;
                    font-size: 10px;
                    color: var(--text-secondary, #8b8b8b);
                    padding-left: 2px;
                }

                /* 行 */
                .cmx-rows {
                    display: flex;
                    flex-direction: column;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }

                .cmx-row {
                    display: flex;
                    align-items: center;
                    height: 18px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }

                .cmx-row.even {
                    background: rgba(255, 255, 255, 0.015);
                }

                .cmx-row-label {
                    width: 72px;
                    min-width: 72px;
                    padding-right: 8px;
                    text-align: right;
                    cursor: default;
                    border-right: 1px solid rgba(255, 255, 255, 0.06);
                }

                .cmx-row-label.highlight .cmx-row-text {
                    color: var(--accent-color, #58a6ff);
                }

                .cmx-row-text {
                    font-size: 10px;
                    color: var(--text-secondary, #8b8b8b);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    display: block;
                }

                .cmx-edit-input {
                    width: 64px;
                    padding: 1px 4px;
                    border: 1px solid var(--accent-color, #58a6ff);
                    border-radius: 2px;
                    background: var(--input-bg, #1e1e1e);
                    color: var(--text-primary, #ccc);
                    font-size: 10px;
                    outline: none;
                    text-align: right;
                }

                /* 单元格 */
                .cmx-cells {
                    display: flex;
                }

                .cmx-cell {
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border-right: 1px solid rgba(255, 255, 255, 0.04);
                }

                .cmx-cell:last-child {
                    border-right: none;
                }

                .cmx-cell.highlight {
                    background: rgba(88, 166, 255, 0.06);
                }

                .cmx-cell.hovered {
                    background: rgba(88, 166, 255, 0.12);
                }

                .cmx-checkbox {
                    width: 12px;
                    height: 12px;
                    border: 1px solid var(--border-color, #404040);
                    border-radius: 2px;
                    background: var(--input-bg, #1e1e1e);
                    transition: all 0.1s;
                }

                .cmx-cell:hover .cmx-checkbox {
                    border-color: var(--text-tertiary, #606060);
                }

                .cmx-checkbox.checked {
                    background: var(--accent-color, #58a6ff);
                    border-color: var(--accent-color, #58a6ff);
                }

                .cmx-checkbox.checked::after {
                    content: '';
                    display: block;
                    width: 6px;
                    height: 3px;
                    border-left: 1.5px solid white;
                    border-bottom: 1.5px solid white;
                    transform: rotate(-45deg) translate(1px, 2px);
                }
            `}</style>
        </div>
    );
};

export default CollisionMatrixEditor;
