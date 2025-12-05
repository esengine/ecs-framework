/**
 * 曲线编辑器组件
 * Curve Editor Component
 *
 * A visual editor for animation curves used in particle systems.
 * 用于粒子系统的动画曲线可视化编辑器。
 */

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import type { ScaleKey } from '@esengine/particle';
import { ScaleCurveType } from '@esengine/particle';
import { X, Plus } from 'lucide-react';

interface CurveEditorProps {
    /** 曲线关键帧 | Curve keyframes */
    keys: ScaleKey[];
    /** 变化回调 | Change callback */
    onChange: (keys: ScaleKey[]) => void;
    /** 曲线类型 | Curve type */
    curveType: ScaleCurveType;
    /** 曲线类型变化回调 | Curve type change callback */
    onCurveTypeChange?: (type: ScaleCurveType) => void;
    /** Y 轴最小值 | Y-axis minimum */
    minY?: number;
    /** Y 轴最大值 | Y-axis maximum */
    maxY?: number;
}

// 内边距 | Padding
const PADDING = { left: 28, right: 8, top: 8, bottom: 16 };
const POINT_RADIUS = 5;
const HIT_RADIUS = 10;

/**
 * 曲线编辑器
 * Curve Editor
 */
export function CurveEditor({
    keys,
    onChange,
    curveType,
    onCurveTypeChange,
    minY = 0,
    maxY = 2,
}: CurveEditorProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // 监听容器大小变化 | Watch container size changes
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            setCanvasSize({ width: rect.width, height: rect.height });
        };

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, []);

    // 获取绘图区域 | Get drawing area
    const getDrawArea = useCallback(() => {
        return {
            x: PADDING.left,
            y: PADDING.top,
            width: canvasSize.width - PADDING.left - PADDING.right,
            height: canvasSize.height - PADDING.top - PADDING.bottom,
        };
    }, [canvasSize]);

    // 数据坐标转画布坐标 | Data to canvas coordinates
    const dataToCanvas = useCallback((time: number, scale: number) => {
        const area = getDrawArea();
        return {
            x: area.x + time * area.width,
            y: area.y + area.height - ((scale - minY) / (maxY - minY)) * area.height,
        };
    }, [getDrawArea, minY, maxY]);

    // 画布坐标转数据坐标 | Canvas to data coordinates
    const canvasToData = useCallback((canvasX: number, canvasY: number) => {
        const area = getDrawArea();
        const time = Math.max(0, Math.min(1, (canvasX - area.x) / area.width));
        const scale = maxY - ((canvasY - area.y) / area.height) * (maxY - minY);
        return {
            time,
            scale: Math.max(minY, Math.min(maxY, scale)),
        };
    }, [getDrawArea, minY, maxY]);

    // 获取鼠标在 canvas 上的坐标 | Get mouse position on canvas
    const getMousePos = useCallback((e: React.MouseEvent | MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }, []);

    // 查找点击的关键帧 | Find clicked keyframe
    const findKeyAtPos = useCallback((x: number, y: number): number => {
        for (let i = 0; i < keys.length; i++) {
            const pos = dataToCanvas(keys[i].time, keys[i].scale);
            const dx = pos.x - x;
            const dy = pos.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < HIT_RADIUS) {
                return i;
            }
        }
        return -1;
    }, [keys, dataToCanvas]);

    // 绘制曲线 | Draw curve
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || canvasSize.width === 0) return;

        // 设置 canvas 实际像素大小 | Set canvas pixel size
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasSize.width * dpr;
        canvas.height = canvasSize.height * dpr;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);

        const area = getDrawArea();

        // 清空画布 | Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

        // 绘制绘图区域背景 | Draw area background
        ctx.fillStyle = '#222';
        ctx.fillRect(area.x, area.y, area.width, area.height);

        // 绘制网格 | Draw grid
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;

        // 垂直网格线 (0, 0.25, 0.5, 0.75, 1) | Vertical grid lines
        for (let i = 0; i <= 4; i++) {
            const x = Math.floor(area.x + (i / 4) * area.width) + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, area.y);
            ctx.lineTo(x, area.y + area.height);
            ctx.stroke();
        }

        // 水平网格线 | Horizontal grid lines
        const ySteps = 4;
        for (let i = 0; i <= ySteps; i++) {
            const y = Math.floor(area.y + (i / ySteps) * area.height) + 0.5;
            ctx.beginPath();
            ctx.moveTo(area.x, y);
            ctx.lineTo(area.x + area.width, y);
            ctx.stroke();
        }

        // 绘制 1.0 参考线（如果在范围内）| Draw 1.0 reference line
        if (minY <= 1 && maxY >= 1) {
            const onePos = dataToCanvas(0, 1);
            ctx.strokeStyle = '#444';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(area.x, onePos.y);
            ctx.lineTo(area.x + area.width, onePos.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 绘制 Y 轴标签 | Draw Y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= ySteps; i++) {
            const value = maxY - (i / ySteps) * (maxY - minY);
            const y = area.y + (i / ySteps) * area.height;
            ctx.fillText(value.toFixed(1), area.x - 4, y);
        }

        // 绘制 X 轴标签 | Draw X-axis labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('0', area.x, area.y + area.height + 2);
        ctx.fillText('0.5', area.x + area.width / 2, area.y + area.height + 2);
        ctx.fillText('1', area.x + area.width, area.y + area.height + 2);

        // 绘制曲线 | Draw curve
        if (keys.length > 0) {
            const sortedKeys = [...keys].sort((a, b) => a.time - b.time);

            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 2;
            ctx.beginPath();

            // 采样曲线 | Sample curve
            const samples = 100;
            for (let i = 0; i <= samples; i++) {
                const t = i / samples;
                const value = evaluateCurve(sortedKeys, t, curveType);
                const pos = dataToCanvas(t, value);

                if (i === 0) {
                    ctx.moveTo(pos.x, pos.y);
                } else {
                    ctx.lineTo(pos.x, pos.y);
                }
            }
            ctx.stroke();

            // 绘制关键帧点 | Draw keyframe points
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const pos = dataToCanvas(key.time, key.scale);
                const isSelected = selectedIndex === i;
                const isHovered = hoverIndex === i;

                // 外圈 | Outer ring
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, POINT_RADIUS + 2, 0, Math.PI * 2);
                ctx.fillStyle = isSelected ? '#4a9eff' : (isHovered ? '#666' : 'transparent');
                ctx.fill();

                // 内圈 | Inner circle
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, POINT_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = isSelected ? '#fff' : '#4a9eff';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }, [keys, curveType, minY, maxY, selectedIndex, hoverIndex, canvasSize, getDrawArea, dataToCanvas]);

    // 处理鼠标移动（悬停效果）| Handle mouse move (hover effect)
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging) return;
        const pos = getMousePos(e);
        const index = findKeyAtPos(pos.x, pos.y);
        setHoverIndex(index >= 0 ? index : null);
    }, [isDragging, getMousePos, findKeyAtPos]);

    // 处理鼠标离开 | Handle mouse leave
    const handleMouseLeave = useCallback(() => {
        if (!isDragging) {
            setHoverIndex(null);
        }
    }, [isDragging]);

    // 处理点击 | Handle click
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getMousePos(e);
        const index = findKeyAtPos(pos.x, pos.y);

        if (index >= 0) {
            // 选中现有点 | Select existing point
            setSelectedIndex(index);
            setIsDragging(true);
        } else {
            // 检查是否在绘图区域内 | Check if in draw area
            const area = getDrawArea();
            if (pos.x >= area.x && pos.x <= area.x + area.width &&
                pos.y >= area.y && pos.y <= area.y + area.height) {
                // 添加新点 | Add new point
                const data = canvasToData(pos.x, pos.y);
                const newKey: ScaleKey = { time: data.time, scale: data.scale };
                const newKeys = [...keys, newKey].sort((a, b) => a.time - b.time);
                const newIndex = newKeys.findIndex(k => k.time === data.time && k.scale === data.scale);
                onChange(newKeys);
                setSelectedIndex(newIndex);
                setIsDragging(true);
            }
        }
    }, [getMousePos, findKeyAtPos, getDrawArea, canvasToData, keys, onChange]);

    // 全局拖拽处理 | Global drag handling
    useEffect(() => {
        if (!isDragging || selectedIndex === null) return;

        const handleGlobalMouseMove = (e: MouseEvent) => {
            const pos = getMousePos(e);
            const data = canvasToData(pos.x, pos.y);

            // 更新选中点的位置 | Update selected point position
            const newKeys = keys.map((key, i) => {
                if (i === selectedIndex) {
                    return { time: data.time, scale: data.scale };
                }
                return key;
            });

            // 保持当前选中的点，不重新排序（拖拽时保持索引）
            // Keep current selection, don't resort during drag
            onChange(newKeys);
        };

        const handleGlobalMouseUp = () => {
            // 拖拽结束后排序 | Sort after drag ends
            const sortedKeys = [...keys].sort((a, b) => a.time - b.time);
            if (selectedIndex !== null) {
                const selectedKey = keys[selectedIndex];
                const newIndex = sortedKeys.findIndex(
                    k => k.time === selectedKey.time && k.scale === selectedKey.scale
                );
                setSelectedIndex(newIndex >= 0 ? newIndex : null);
            }
            onChange(sortedKeys);
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, selectedIndex, keys, onChange, getMousePos, canvasToData]);

    // 删除选中关键帧 | Delete selected keyframe
    const handleDelete = useCallback(() => {
        if (selectedIndex === null || keys.length <= 1) return;
        const newKeys = keys.filter((_, i) => i !== selectedIndex);
        onChange(newKeys);
        setSelectedIndex(null);
    }, [selectedIndex, keys, onChange]);

    // 处理数值输入 | Handle value input
    const handleValueChange = useCallback((field: 'time' | 'scale', inputValue: string) => {
        if (selectedIndex === null) return;

        const numValue = parseFloat(inputValue);
        if (isNaN(numValue)) return;

        const newKeys = [...keys];
        if (field === 'time') {
            newKeys[selectedIndex] = {
                ...newKeys[selectedIndex],
                time: Math.max(0, Math.min(1, numValue))
            };
        } else {
            newKeys[selectedIndex] = {
                ...newKeys[selectedIndex],
                scale: Math.max(minY, Math.min(maxY, numValue))
            };
        }
        const sortedKeys = newKeys.sort((a, b) => a.time - b.time);
        const newIndex = sortedKeys.findIndex(
            k => k.time === newKeys[selectedIndex].time && k.scale === newKeys[selectedIndex].scale
        );
        onChange(sortedKeys);
        setSelectedIndex(newIndex >= 0 ? newIndex : null);
    }, [selectedIndex, keys, onChange, minY, maxY]);

    // 应用预设 | Apply preset
    const applyPreset = useCallback((preset: ScaleKey[]) => {
        onChange(preset);
        setSelectedIndex(null);
    }, [onChange]);

    const selectedKey = selectedIndex !== null ? keys[selectedIndex] : null;

    return (
        <div className="curve-editor">
            {/* 曲线类型选择 | Curve type selector */}
            {onCurveTypeChange && (
                <div className="curve-type-row">
                    <label>Curve</label>
                    <select
                        value={curveType}
                        onChange={e => onCurveTypeChange(e.target.value as ScaleCurveType)}
                        className="curve-type-select"
                    >
                        <option value={ScaleCurveType.Linear}>Linear</option>
                        <option value={ScaleCurveType.EaseIn}>Ease In</option>
                        <option value={ScaleCurveType.EaseOut}>Ease Out</option>
                        <option value={ScaleCurveType.EaseInOut}>Ease In Out</option>
                    </select>
                </div>
            )}

            {/* 曲线画布 | Curve canvas */}
            <div ref={containerRef} className="curve-canvas-container">
                <canvas
                    ref={canvasRef}
                    className="curve-canvas"
                    style={{ cursor: isDragging ? 'grabbing' : (hoverIndex !== null ? 'grab' : 'crosshair') }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                />
            </div>

            {/* 编辑面板 | Edit panel */}
            <div className="curve-edit-row">
                {selectedKey ? (
                    <>
                        <label>T</label>
                        <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            value={selectedKey.time.toFixed(2)}
                            onChange={e => handleValueChange('time', e.target.value)}
                            className="curve-value-input"
                        />
                        <label>V</label>
                        <input
                            type="number"
                            min={minY}
                            max={maxY}
                            step={0.1}
                            value={selectedKey.scale.toFixed(2)}
                            onChange={e => handleValueChange('scale', e.target.value)}
                            className="curve-value-input"
                        />
                        <button
                            className="curve-delete-btn"
                            onClick={handleDelete}
                            disabled={keys.length <= 1}
                            title="Delete point"
                        >
                            <X size={10} />
                        </button>
                    </>
                ) : (
                    <span className="curve-hint">Click to add point</span>
                )}
            </div>

            {/* 预设按钮 | Preset buttons */}
            <div className="curve-presets">
                <button
                    className="curve-preset-btn"
                    onClick={() => applyPreset([{ time: 0, scale: 1 }, { time: 1, scale: 1 }])}
                    title="Constant value"
                >
                    —
                </button>
                <button
                    className="curve-preset-btn"
                    onClick={() => applyPreset([{ time: 0, scale: 0 }, { time: 1, scale: 1 }])}
                    title="Fade in"
                >
                    ↗
                </button>
                <button
                    className="curve-preset-btn"
                    onClick={() => applyPreset([{ time: 0, scale: 1 }, { time: 1, scale: 0 }])}
                    title="Fade out"
                >
                    ↘
                </button>
                <button
                    className="curve-preset-btn"
                    onClick={() => applyPreset([{ time: 0, scale: 0 }, { time: 0.5, scale: 1 }, { time: 1, scale: 0 }])}
                    title="Bell curve"
                >
                    ∩
                </button>
                <button
                    className="curve-preset-btn"
                    onClick={() => applyPreset([{ time: 0, scale: 1 }, { time: 0.5, scale: 0 }, { time: 1, scale: 1 }])}
                    title="U curve"
                >
                    ∪
                </button>
            </div>
        </div>
    );
}

/**
 * 计算曲线值
 * Evaluate curve value
 */
function evaluateCurve(keys: ScaleKey[], t: number, curveType: ScaleCurveType): number {
    if (keys.length === 0) return 1;
    if (keys.length === 1) return keys[0].scale;

    // 查找相邻关键帧 | Find adjacent keyframes
    let left = keys[0];
    let right = keys[keys.length - 1];

    for (let i = 0; i < keys.length - 1; i++) {
        if (keys[i].time <= t && keys[i + 1].time >= t) {
            left = keys[i];
            right = keys[i + 1];
            break;
        }
    }

    if (t <= left.time) return left.scale;
    if (t >= right.time) return right.scale;

    // 计算插值因子 | Calculate interpolation factor
    let factor = (t - left.time) / (right.time - left.time);

    // 应用缓动函数 | Apply easing function
    switch (curveType) {
        case ScaleCurveType.EaseIn:
            factor = factor * factor;
            break;
        case ScaleCurveType.EaseOut:
            factor = 1 - (1 - factor) * (1 - factor);
            break;
        case ScaleCurveType.EaseInOut:
            factor = factor < 0.5
                ? 2 * factor * factor
                : 1 - 2 * (1 - factor) * (1 - factor);
            break;
        // Linear - no modification
    }

    return left.scale + (right.scale - left.scale) * factor;
}
