/**
 * Collision Layer Field Component
 * 碰撞层字段组件 - 支持 16 层选择
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Core } from '@esengine/ecs-framework';
import {
    CollisionLayerConfigToken,
    type ICollisionLayerConfig
} from '@esengine/physics-rapier2d';

/**
 * 默认层名称（当 CollisionLayerConfig 不可用时使用）
 * Default layer names (used when CollisionLayerConfig is unavailable)
 */
const DEFAULT_LAYER_NAMES = [
    'Default', 'Player', 'Enemy', 'Projectile',
    'Ground', 'Platform', 'Trigger', 'Item',
    'Layer8', 'Layer9', 'Layer10', 'Layer11',
    'Layer12', 'Layer13', 'Layer14', 'Layer15',
];

/**
 * 尝试获取 CollisionLayerConfig 实例
 * Try to get CollisionLayerConfig instance
 */
function getCollisionConfig(): ICollisionLayerConfig | undefined {
    try {
        return Core.pluginServices.get(CollisionLayerConfigToken);
    } catch {
        // Core 可能还没有初始化
        // Core might not be initialized yet
        return undefined;
    }
}

interface CollisionLayerFieldProps {
    label: string;
    value: number;
    multiple?: boolean;
    readOnly?: boolean;
    onChange: (value: number) => void;
}

export const CollisionLayerField: React.FC<CollisionLayerFieldProps> = ({
    label,
    value,
    multiple = false,
    readOnly = false,
    onChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [layerNames, setLayerNames] = useState<string[]>(DEFAULT_LAYER_NAMES);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 从配置服务获取层名称
    useEffect(() => {
        const config = getCollisionConfig();
        if (config) {
            const updateNames = () => {
                const layers = config.getLayers();
                setLayerNames(layers.map(l => l.name));
            };
            updateNames();
            config.addListener(updateNames);
            return () => config.removeListener(updateNames);
        }
    }, []);

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getLayerIndex = useCallback((layerBit: number): number => {
        for (let i = 0; i < 16; i++) {
            if (layerBit === (1 << i)) {
                return i;
            }
        }
        for (let i = 0; i < 16; i++) {
            if ((layerBit & (1 << i)) !== 0) {
                return i;
            }
        }
        return 0;
    }, []);

    const getSelectedCount = useCallback((): number => {
        let count = 0;
        for (let i = 0; i < 16; i++) {
            if ((value & (1 << i)) !== 0) count++;
        }
        return count;
    }, [value]);

    const getSelectedLayerNames = useCallback((): string => {
        if (!multiple) {
            const index = getLayerIndex(value);
            return `${index}: ${layerNames[index] ?? 'Unknown'}`;
        }

        const count = getSelectedCount();
        if (count === 0) return 'None';
        if (count === 16) return 'All (16)';
        if (count > 3) return `${count} layers`;

        const names: string[] = [];
        for (let i = 0; i < 16; i++) {
            if ((value & (1 << i)) !== 0) {
                names.push(layerNames[i] ?? `Layer${i}`);
            }
        }
        return names.join(', ');
    }, [value, multiple, layerNames, getLayerIndex, getSelectedCount]);

    const handleLayerToggle = (index: number) => {
        if (readOnly) return;

        if (multiple) {
            const bit = 1 << index;
            const newValue = (value & bit) ? (value & ~bit) : (value | bit);
            onChange(newValue);
        } else {
            onChange(1 << index);
            setIsOpen(false);
        }
    };

    const handleSelectAll = () => {
        if (!readOnly) onChange(0xFFFF);
    };

    const handleSelectNone = () => {
        if (!readOnly) onChange(0);
    };

    return (
        <div className="property-field clayer-field" ref={dropdownRef}>
            <label className="property-label">{label}</label>
            <div className="clayer-selector">
                <button
                    className={`clayer-btn ${readOnly ? 'readonly' : ''}`}
                    onClick={() => !readOnly && setIsOpen(!isOpen)}
                    type="button"
                    disabled={readOnly}
                >
                    <span className="clayer-text">{getSelectedLayerNames()}</span>
                    <span className="clayer-arrow">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && !readOnly && (
                    <div className="clayer-dropdown">
                        {multiple && (
                            <div className="clayer-actions">
                                <button onClick={handleSelectAll} type="button">全选</button>
                                <button onClick={handleSelectNone} type="button">清空</button>
                            </div>
                        )}
                        <div className="clayer-list">
                            {layerNames.map((layerName, index) => {
                                const isSelected = multiple
                                    ? (value & (1 << index)) !== 0
                                    : getLayerIndex(value) === index;

                                return (
                                    <div
                                        key={index}
                                        className={`clayer-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleLayerToggle(index)}
                                    >
                                        {multiple && (
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                className="clayer-check"
                                            />
                                        )}
                                        <span className="clayer-idx">{index}</span>
                                        <span className="clayer-name">{layerName}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .clayer-field {
                    position: relative;
                }

                .clayer-selector {
                    position: relative;
                    flex: 1;
                }

                .clayer-btn {
                    width: 100%;
                    padding: 3px 6px;
                    border: 1px solid var(--input-border, #3c3c3c);
                    border-radius: 3px;
                    background: var(--input-bg, #1e1e1e);
                    color: var(--text-primary, #ccc);
                    font-size: 11px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    text-align: left;
                    min-height: 22px;
                }

                .clayer-btn:hover:not(.readonly) {
                    border-color: var(--accent-color, #007acc);
                }

                .clayer-btn.readonly {
                    cursor: not-allowed;
                    opacity: 0.6;
                }

                .clayer-text {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .clayer-arrow {
                    font-size: 7px;
                    margin-left: 6px;
                    color: var(--text-tertiary, #666);
                }

                .clayer-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    margin-top: 2px;
                    background: var(--dropdown-bg, #252526);
                    border: 1px solid var(--border-color, #3c3c3c);
                    border-radius: 3px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    max-height: 280px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .clayer-actions {
                    display: flex;
                    gap: 4px;
                    padding: 4px;
                    border-bottom: 1px solid var(--border-color, #3c3c3c);
                }

                .clayer-actions button {
                    flex: 1;
                    padding: 2px 6px;
                    border: none;
                    border-radius: 2px;
                    background: var(--button-bg, #333);
                    color: var(--text-secondary, #aaa);
                    font-size: 10px;
                    cursor: pointer;
                }

                .clayer-actions button:hover {
                    background: var(--button-hover-bg, #444);
                    color: var(--text-primary, #fff);
                }

                .clayer-list {
                    overflow-y: auto;
                    max-height: 240px;
                }

                .clayer-item {
                    display: flex;
                    align-items: center;
                    padding: 3px 6px;
                    cursor: pointer;
                    gap: 6px;
                    font-size: 11px;
                }

                .clayer-item:hover {
                    background: var(--list-hover-bg, #2a2d2e);
                }

                .clayer-item.selected {
                    background: var(--list-active-bg, #094771);
                }

                .clayer-check {
                    width: 12px;
                    height: 12px;
                    accent-color: var(--accent-color, #007acc);
                    cursor: pointer;
                }

                .clayer-idx {
                    width: 14px;
                    font-size: 9px;
                    color: var(--text-tertiary, #666);
                    text-align: right;
                }

                .clayer-name {
                    flex: 1;
                    color: var(--text-primary, #ccc);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            `}</style>
        </div>
    );
};

export default CollisionLayerField;
