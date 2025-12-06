/**
 * 渐变编辑器组件
 * Gradient Editor Component
 *
 * A visual editor for color gradients used in particle systems.
 * 用于粒子系统的颜色渐变可视化编辑器。
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ColorKey } from '@esengine/particle';
import { X } from 'lucide-react';

interface GradientEditorProps {
    /** 颜色关键帧 | Color keyframes */
    colorKeys: ColorKey[];
    /** 变化回调 | Change callback */
    onChange: (keys: ColorKey[]) => void;
}

/**
 * 渐变编辑器
 * Gradient Editor
 */
export function GradientEditor({
    colorKeys,
    onChange,
}: GradientEditorProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    // 生成 CSS 渐变 | Generate CSS gradient
    const gradientStyle = useCallback(() => {
        if (colorKeys.length === 0) {
            return 'linear-gradient(to right, #ffffff, #ffffff)';
        }
        if (colorKeys.length === 1) {
            const c = colorKeys[0];
            const color = `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`;
            return `linear-gradient(to right, ${color}, ${color})`;
        }

        const sorted = [...colorKeys].sort((a, b) => a.time - b.time);
        const stops = sorted.map(k => {
            const color = `rgba(${Math.round(k.r * 255)}, ${Math.round(k.g * 255)}, ${Math.round(k.b * 255)}, ${k.a})`;
            return `${color} ${k.time * 100}%`;
        });
        return `linear-gradient(to right, ${stops.join(', ')})`;
    }, [colorKeys]);

    // 处理点击添加关键帧 | Handle click to add keyframe
    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const time = Math.max(0, Math.min(1, x / width));

        // 检查是否点击了现有关键帧 | Check if clicking existing keyframe
        const threshold = 10;
        const clickedIndex = colorKeys.findIndex(k => {
            const keyX = k.time * width;
            return Math.abs(keyX - x) < threshold;
        });

        if (clickedIndex >= 0) {
            setSelectedIndex(clickedIndex);
            return;
        }

        // 添加新关键帧 | Add new keyframe
        const interpolatedColor = interpolateColor(colorKeys, time);
        const newKey: ColorKey = {
            time,
            ...interpolatedColor
        };

        const newKeys = [...colorKeys, newKey].sort((a, b) => a.time - b.time);
        onChange(newKeys);
        setSelectedIndex(newKeys.findIndex(k => k.time === time));
    };

    // 处理拖拽开始 | Handle drag start
    const handleStopMouseDown = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setSelectedIndex(index);
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!trackRef.current || selectedIndex === null) return;

            const rect = trackRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            const time = Math.max(0, Math.min(1, x / width));

            const newKeys = [...colorKeys];
            newKeys[selectedIndex] = { ...newKeys[selectedIndex], time };
            onChange(newKeys.sort((a, b) => a.time - b.time));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, selectedIndex, colorKeys, onChange]);

    // 处理颜色变化 | Handle color change
    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedIndex === null) return;

        const hex = e.target.value;
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const newKeys = [...colorKeys];
        newKeys[selectedIndex] = { ...newKeys[selectedIndex], r, g, b };
        onChange(newKeys);
    };

    // 处理 alpha 变化 | Handle alpha change
    const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedIndex === null) return;

        const newKeys = [...colorKeys];
        newKeys[selectedIndex] = { ...newKeys[selectedIndex], a: parseFloat(e.target.value) };
        onChange(newKeys);
    };

    // 删除选中关键帧 | Delete selected keyframe
    const handleDelete = () => {
        if (selectedIndex === null || colorKeys.length <= 1) return;

        const newKeys = colorKeys.filter((_, i) => i !== selectedIndex);
        onChange(newKeys);
        setSelectedIndex(null);
    };

    // 获取选中关键帧的十六进制颜色 | Get selected keyframe hex color
    const selectedKey = selectedIndex !== null ? colorKeys[selectedIndex] : null;
    const selectedHex = selectedKey
        ? `#${Math.round(selectedKey.r * 255).toString(16).padStart(2, '0')}${Math.round(selectedKey.g * 255).toString(16).padStart(2, '0')}${Math.round(selectedKey.b * 255).toString(16).padStart(2, '0')}`
        : '#ffffff';

    return (
        <div className="gradient-editor">
            {/* 渐变条 | Gradient bar */}
            <div
                ref={trackRef}
                className="gradient-track"
                style={{ background: gradientStyle() }}
                onClick={handleTrackClick}
            >
                {/* 棋盘格背景 | Checkerboard background */}
                <div className="gradient-track-checker" />

                {/* 关键帧手柄 | Keyframe handles */}
                {colorKeys.map((key, index) => (
                    <div
                        key={index}
                        className={`gradient-stop ${selectedIndex === index ? 'selected' : ''}`}
                        style={{
                            left: `${key.time * 100}%`,
                            backgroundColor: `rgba(${Math.round(key.r * 255)}, ${Math.round(key.g * 255)}, ${Math.round(key.b * 255)}, ${key.a})`,
                        }}
                        onMouseDown={e => handleStopMouseDown(e, index)}
                    />
                ))}
            </div>

            {/* 编辑面板 | Edit panel */}
            {selectedKey && (
                <div className="gradient-color-row">
                    <label>Color</label>
                    <input
                        type="color"
                        value={selectedHex}
                        onChange={handleColorChange}
                        className="gradient-color-input"
                    />
                    <label>Alpha</label>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={selectedKey.a}
                        onChange={handleAlphaChange}
                        className="gradient-alpha-slider"
                    />
                    <span className="gradient-alpha-value">{selectedKey.a.toFixed(2)}</span>
                    <button
                        className="gradient-delete-btn"
                        onClick={handleDelete}
                        disabled={colorKeys.length <= 1}
                        title="Delete stop"
                    >
                        <X size={10} />
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * 在渐变中插值颜色
 * Interpolate color in gradient
 */
function interpolateColor(keys: ColorKey[], time: number): { r: number; g: number; b: number; a: number } {
    if (keys.length === 0) {
        return { r: 1, g: 1, b: 1, a: 1 };
    }
    if (keys.length === 1) {
        return { r: keys[0].r, g: keys[0].g, b: keys[0].b, a: keys[0].a };
    }

    const sorted = [...keys].sort((a, b) => a.time - b.time);

    // 查找相邻关键帧 | Find adjacent keyframes
    let left = sorted[0];
    let right = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].time <= time && sorted[i + 1].time >= time) {
            left = sorted[i];
            right = sorted[i + 1];
            break;
        }
    }

    if (time <= left.time) {
        return { r: left.r, g: left.g, b: left.b, a: left.a };
    }
    if (time >= right.time) {
        return { r: right.r, g: right.g, b: right.b, a: right.a };
    }

    const t = (time - left.time) / (right.time - left.time);
    return {
        r: left.r + (right.r - left.r) * t,
        g: left.g + (right.g - left.g) * t,
        b: left.b + (right.b - left.b) * t,
        a: left.a + (right.a - left.a) * t,
    };
}
