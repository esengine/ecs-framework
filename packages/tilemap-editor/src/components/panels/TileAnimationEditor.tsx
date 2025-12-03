/**
 * Tile Animation Editor Panel
 * 瓦片动画编辑器面板
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, Trash2, GripVertical } from 'lucide-react';
import type { ITileAnimation, ITileAnimationFrame, ITilesetData } from '@esengine/tilemap';
import '../../styles/TileAnimationEditor.css';

interface TileAnimationEditorProps {
    tileId: number;
    tileset: ITilesetData;
    tilesetImage: HTMLImageElement | null;
    animation: ITileAnimation | null;
    onAnimationChange: (animation: ITileAnimation | null) => void;
    onClose: () => void;
}

export const TileAnimationEditor: React.FC<TileAnimationEditorProps> = ({
    tileId,
    tileset,
    tilesetImage,
    animation,
    onAnimationChange,
    onClose
}) => {
    const [frames, setFrames] = useState<ITileAnimationFrame[]>(
        animation?.frames ?? []
    );
    const [defaultDuration, setDefaultDuration] = useState(100);
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentPreviewFrame, setCurrentPreviewFrame] = useState(0);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const tilesetCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationTimerRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);

    const { tileWidth, tileHeight, columns } = tileset;

    // Draw a single tile on canvas
    const drawTile = useCallback((
        ctx: CanvasRenderingContext2D,
        tileIndex: number,
        destX: number,
        destY: number,
        destWidth: number,
        destHeight: number
    ) => {
        if (!tilesetImage) return;

        const srcX = (tileIndex % columns) * tileWidth;
        const srcY = Math.floor(tileIndex / columns) * tileHeight;

        ctx.drawImage(
            tilesetImage,
            srcX, srcY, tileWidth, tileHeight,
            destX, destY, destWidth, destHeight
        );
    }, [tilesetImage, columns, tileWidth, tileHeight]);

    // Animation preview loop
    useEffect(() => {
        if (!isPlaying || frames.length === 0) return;

        const animate = (timestamp: number) => {
            if (!lastFrameTimeRef.current) {
                lastFrameTimeRef.current = timestamp;
            }

            const elapsed = timestamp - lastFrameTimeRef.current;
            const currentFrame = frames[currentPreviewFrame];

            if (currentFrame && elapsed >= currentFrame.duration) {
                lastFrameTimeRef.current = timestamp;
                setCurrentPreviewFrame((prev) => (prev + 1) % frames.length);
            }

            animationTimerRef.current = requestAnimationFrame(animate);
        };

        animationTimerRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationTimerRef.current) {
                cancelAnimationFrame(animationTimerRef.current);
            }
        };
    }, [isPlaying, frames, currentPreviewFrame]);

    // Draw preview canvas
    useEffect(() => {
        const canvas = previewCanvasRef.current;
        if (!canvas || !tilesetImage) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (frames.length > 0) {
            const frame = frames[currentPreviewFrame];
            if (frame) {
                drawTile(ctx, frame.tileId, 16, 16, 64, 64);
            }
        } else {
            drawTile(ctx, tileId, 16, 16, 64, 64);
        }
    }, [frames, currentPreviewFrame, tileId, tilesetImage, drawTile]);

    // Draw tileset selector canvas
    useEffect(() => {
        const canvas = tilesetCanvasRef.current;
        if (!canvas || !tilesetImage) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = tilesetImage.width;
        canvas.height = tilesetImage.height;

        ctx.drawImage(tilesetImage, 0, 0);

        // Highlight animated tiles
        const animatedTileIds = new Set(frames.map(f => f.tileId));
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;

        for (const id of animatedTileIds) {
            const x = (id % columns) * tileWidth;
            const y = Math.floor(id / columns) * tileHeight;
            ctx.strokeRect(x + 1, y + 1, tileWidth - 2, tileHeight - 2);
        }

        // Highlight source tile
        ctx.strokeStyle = '#ffff00';
        const srcX = (tileId % columns) * tileWidth;
        const srcY = Math.floor(tileId / columns) * tileHeight;
        ctx.strokeRect(srcX + 1, srcY + 1, tileWidth - 2, tileHeight - 2);
    }, [tilesetImage, frames, tileId, columns, tileWidth, tileHeight]);

    // Handle tileset click to add frame
    const handleTilesetClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = tilesetCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const col = Math.floor(x / tileWidth);
        const row = Math.floor(y / tileHeight);
        const clickedTileId = row * columns + col;

        if (clickedTileId >= 0 && clickedTileId < tileset.tileCount) {
            setFrames([...frames, { tileId: clickedTileId, duration: defaultDuration }]);
        }
    };

    // Handle frame duration change
    const handleDurationChange = (index: number, duration: number) => {
        const newFrames = [...frames];
        newFrames[index] = { ...newFrames[index], duration: Math.max(10, duration) };
        setFrames(newFrames);
    };

    // Handle frame delete
    const handleDeleteFrame = (index: number) => {
        setFrames(frames.filter((_, i) => i !== index));
    };

    // Handle frame reorder via drag
    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('frameIndex', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('frameIndex'), 10);
        if (dragIndex === dropIndex) {
            setDragOverIndex(null);
            return;
        }

        const newFrames = [...frames];
        const [draggedFrame] = newFrames.splice(dragIndex, 1);
        newFrames.splice(dropIndex, 0, draggedFrame);
        setFrames(newFrames);
        setDragOverIndex(null);
    };

    // Apply changes
    const handleApply = () => {
        if (frames.length === 0) {
            onAnimationChange(null);
        } else {
            onAnimationChange({ frames });
        }
        onClose();
    };

    // Clear animation
    const handleClear = () => {
        setFrames([]);
        setCurrentPreviewFrame(0);
    };

    return (
        <div className="tile-animation-editor-overlay">
            <div className="tile-animation-editor">
                <div className="animation-editor-header">
                    <h3>瓦片动画编辑器 - 瓦片 #{tileId}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="animation-editor-content">
                    {/* Preview section */}
                    <div className="animation-preview-section">
                        <div className="preview-box">
                            <canvas
                                ref={previewCanvasRef}
                                width={96}
                                height={96}
                                className="animation-preview-canvas"
                            />
                        </div>
                        <div className="preview-controls">
                            <button
                                className={`preview-btn ${isPlaying ? 'active' : ''}`}
                                onClick={() => setIsPlaying(!isPlaying)}
                                title={isPlaying ? '暂停' : '播放'}
                            >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <span className="frame-indicator">
                                {frames.length > 0 ? `${currentPreviewFrame + 1}/${frames.length}` : '无帧'}
                            </span>
                        </div>
                    </div>

                    {/* Frame list */}
                    <div className="animation-frames-section">
                        <div className="frames-header">
                            <span>动画帧</span>
                            <span className="frame-count">{frames.length} 帧</span>
                        </div>
                        <div className="frames-list">
                            {frames.map((frame, index) => (
                                <div
                                    key={index}
                                    className={`frame-item ${dragOverIndex === index ? 'drag-over' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                >
                                    <div className="frame-drag-handle">
                                        <GripVertical size={14} />
                                    </div>
                                    <div className="frame-preview">
                                        <canvas
                                            width={32}
                                            height={32}
                                            ref={(canvas) => {
                                                if (canvas && tilesetImage) {
                                                    const ctx = canvas.getContext('2d');
                                                    if (ctx) {
                                                        ctx.clearRect(0, 0, 32, 32);
                                                        drawTile(ctx, frame.tileId, 0, 0, 32, 32);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="frame-info">
                                        <span className="frame-tile-id">#{frame.tileId}</span>
                                        <input
                                            type="number"
                                            className="frame-duration-input"
                                            value={frame.duration}
                                            onChange={(e) => handleDurationChange(index, parseInt(e.target.value, 10) || 100)}
                                            min={10}
                                            step={10}
                                        />
                                        <span className="duration-unit">ms</span>
                                    </div>
                                    <button
                                        className="frame-delete-btn"
                                        onClick={() => handleDeleteFrame(index)}
                                        title="删除帧"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {frames.length === 0 && (
                                <div className="frames-empty">
                                    点击下方瓦片添加动画帧
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tileset selector */}
                <div className="animation-tileset-section">
                    <div className="tileset-header">
                        <span>点击瓦片添加帧</span>
                        <div className="default-duration">
                            <label>默认时长:</label>
                            <input
                                type="number"
                                value={defaultDuration}
                                onChange={(e) => setDefaultDuration(parseInt(e.target.value, 10) || 100)}
                                min={10}
                                step={10}
                            />
                            <span>ms</span>
                        </div>
                    </div>
                    <div className="tileset-scroll-container">
                        <canvas
                            ref={tilesetCanvasRef}
                            className="animation-tileset-canvas"
                            onClick={handleTilesetClick}
                        />
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="animation-editor-footer">
                    <button className="btn-secondary" onClick={handleClear}>
                        清除动画
                    </button>
                    <div className="footer-right">
                        <button className="btn-secondary" onClick={onClose}>
                            取消
                        </button>
                        <button className="btn-primary" onClick={handleApply}>
                            应用
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TileAnimationEditor;
