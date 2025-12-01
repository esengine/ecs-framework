/**
 * Collision Layer Selector Component
 * 碰撞层选择器组件
 */

import React, { useState, useEffect, useRef } from 'react';
import { CollisionLayerConfig } from '@esengine/physics-rapier2d';

interface CollisionLayerSelectorProps {
    value: number;
    onChange: (value: number) => void;
    label?: string;
    multiple?: boolean;
}

export const CollisionLayerSelector: React.FC<CollisionLayerSelectorProps> = ({
    value,
    onChange,
    label,
    multiple = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [layers, setLayers] = useState(CollisionLayerConfig.getInstance().getLayers());
    const dropdownRef = useRef<HTMLDivElement>(null);
    const config = CollisionLayerConfig.getInstance();

    useEffect(() => {
        const handleUpdate = () => {
            setLayers([...config.getLayers()]);
        };

        config.addListener(handleUpdate);
        return () => config.removeListener(handleUpdate);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getSelectedLayerNames = (): string => {
        if (!multiple) {
            const index = config.getLayerIndex(value);
            return layers[index]?.name ?? 'Default';
        }

        const selectedNames: string[] = [];
        for (let i = 0; i < 16; i++) {
            if ((value & (1 << i)) !== 0) {
                selectedNames.push(layers[i]?.name ?? `Layer${i}`);
            }
        }

        if (selectedNames.length === 0) return 'None';
        if (selectedNames.length === 16) return 'All';
        if (selectedNames.length > 3) return `${selectedNames.length} layers`;
        return selectedNames.join(', ');
    };

    const handleLayerToggle = (index: number) => {
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
        onChange(0xFFFF);
    };

    const handleSelectNone = () => {
        onChange(0);
    };

    return (
        <div className="collision-layer-selector" ref={dropdownRef}>
            {label && <label className="selector-label">{label}</label>}
            <div className="selector-container">
                <button
                    className="selector-button"
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                >
                    <span className="selected-text">{getSelectedLayerNames()}</span>
                    <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                    <div className="dropdown-menu">
                        {multiple && (
                            <div className="dropdown-actions">
                                <button onClick={handleSelectAll} type="button">全选</button>
                                <button onClick={handleSelectNone} type="button">全不选</button>
                            </div>
                        )}
                        <div className="dropdown-list">
                            {layers.slice(0, 8).map((layer, index) => {
                                const isSelected = multiple
                                    ? (value & (1 << index)) !== 0
                                    : config.getLayerIndex(value) === index;

                                return (
                                    <div
                                        key={index}
                                        className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleLayerToggle(index)}
                                    >
                                        {multiple && (
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                className="layer-checkbox"
                                            />
                                        )}
                                        <span className="layer-index">{index}</span>
                                        <span className="layer-name">{layer.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .collision-layer-selector {
                    position: relative;
                    width: 100%;
                }

                .selector-label {
                    display: block;
                    font-size: 12px;
                    color: var(--text-secondary, #aaa);
                    margin-bottom: 4px;
                }

                .selector-container {
                    position: relative;
                }

                .selector-button {
                    width: 100%;
                    padding: 6px 8px;
                    border: 1px solid var(--border-color, #333);
                    border-radius: 4px;
                    background: var(--bg-primary, #1a1a1a);
                    color: var(--text-primary, #fff);
                    font-size: 12px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    text-align: left;
                }

                .selector-button:hover {
                    border-color: var(--accent-color, #0078d4);
                }

                .selected-text {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .dropdown-arrow {
                    font-size: 8px;
                    margin-left: 8px;
                    color: var(--text-secondary, #888);
                }

                .dropdown-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    margin-top: 2px;
                    background: var(--bg-secondary, #1e1e1e);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    z-index: 1000;
                    max-height: 250px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .dropdown-actions {
                    display: flex;
                    gap: 4px;
                    padding: 6px;
                    border-bottom: 1px solid var(--border-color, #333);
                }

                .dropdown-actions button {
                    flex: 1;
                    padding: 4px 8px;
                    border: none;
                    border-radius: 2px;
                    background: var(--bg-tertiary, #333);
                    color: var(--text-secondary, #aaa);
                    font-size: 11px;
                    cursor: pointer;
                }

                .dropdown-actions button:hover {
                    background: var(--bg-hover, #444);
                    color: var(--text-primary, #fff);
                }

                .dropdown-list {
                    overflow-y: auto;
                    max-height: 200px;
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    padding: 6px 8px;
                    cursor: pointer;
                    gap: 8px;
                }

                .dropdown-item:hover {
                    background: var(--bg-hover, #2a2a2a);
                }

                .dropdown-item.selected {
                    background: var(--accent-color-dim, rgba(0, 120, 212, 0.2));
                }

                .layer-checkbox {
                    width: 14px;
                    height: 14px;
                    accent-color: var(--accent-color, #0078d4);
                }

                .layer-index {
                    width: 20px;
                    font-size: 10px;
                    color: var(--text-tertiary, #666);
                    text-align: center;
                }

                .layer-name {
                    flex: 1;
                    font-size: 12px;
                    color: var(--text-primary, #fff);
                }
            `}</style>
        </div>
    );
};

export default CollisionLayerSelector;
