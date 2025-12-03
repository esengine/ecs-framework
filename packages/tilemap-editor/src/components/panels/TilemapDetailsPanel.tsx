/**
 * Tilemap Details Panel - Right panel with grouped properties
 * Tilemap 详情面板 - 右侧分组属性面板
 */

import React, { useState, useCallback, useRef } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Plus,
    ArrowUp,
    ArrowDown,
    Copy,
    X,
    Search,
    Settings,
    Eye,
    EyeOff,
    FileBox
} from 'lucide-react';
import { useTilemapEditorStore, type LayerState } from '../../stores/TilemapEditorStore';
import type { TilemapComponent } from '@esengine/tilemap';
import '../../styles/TilemapDetailsPanel.css';

interface TilemapDetailsPanelProps {
    tilemap: TilemapComponent | null;
    onAddLayer: () => void;
    onRemoveLayer: (index: number) => void;
    onMoveLayer: (from: number, to: number) => void;
    onDuplicateLayer: (index: number) => void;
    onTilemapChange: () => void;
    onOpenAssetPicker: () => void;
    /** Callback to open material picker for a specific layer */
    onSelectLayerMaterial?: (layerIndex: number) => void;
}

// Collapsible section component
interface SectionProps {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, defaultOpen = true, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="details-section">
            <div
                className="details-section-header"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span>{title}</span>
            </div>
            {isOpen && (
                <div className="details-section-content">
                    {children}
                </div>
            )}
        </div>
    );
};

// Property row component
interface PropertyRowProps {
    label: string;
    children: React.ReactNode;
    indent?: boolean;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ label, children, indent }) => (
    <div className={`property-row ${indent ? 'indented' : ''}`}>
        <label>{label}</label>
        <div className="property-value">{children}</div>
    </div>
);

// Toggle property - unified style matching PropertyInspector
interface TogglePropertyProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    indent?: boolean;
}

const ToggleProperty: React.FC<TogglePropertyProps> = ({ label, checked, onChange, indent }) => (
    <div className={`property-row toggle-row ${indent ? 'indented' : ''}`}>
        <label>{label}</label>
        <button
            className={`property-toggle ${checked ? 'property-toggle-on' : 'property-toggle-off'}`}
            onClick={() => onChange(!checked)}
            type="button"
        >
            <span className="property-toggle-thumb" />
        </button>
    </div>
);

// Number input property
interface NumberPropertyProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

const NumberProperty: React.FC<NumberPropertyProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    step = 1
}) => (
    <PropertyRow label={label}>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={min}
            max={max}
            step={step}
        />
    </PropertyRow>
);

// Slider property for opacity etc.
interface SliderPropertyProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

const SliderProperty: React.FC<SliderPropertyProps> = ({
    label,
    value,
    onChange,
    min = 0,
    max = 1,
    step = 0.01
}) => (
    <PropertyRow label={label}>
        <div className="slider-wrapper">
            <input
                type="range"
                className="property-slider"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                min={min}
                max={max}
                step={step}
            />
            <span className="slider-value">{Math.round(value * 100)}%</span>
        </div>
    </PropertyRow>
);

// Color property - unified style matching PropertyInspector
interface ColorPropertyProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    showReset?: boolean;
}

const ColorProperty: React.FC<ColorPropertyProps> = ({ label, value, onChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handlePreviewClick = () => {
        inputRef.current?.click();
    };

    return (
        <PropertyRow label={label}>
            <div className="property-color-wrapper">
                <div
                    className="property-color-preview"
                    style={{ backgroundColor: value }}
                    onClick={handlePreviewClick}
                />
                <input
                    ref={inputRef}
                    type="color"
                    className="property-input-color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <input
                    type="text"
                    className="property-input property-input-color-text"
                    value={value.toUpperCase()}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                            onChange(val);
                        }
                    }}
                    onBlur={(e) => {
                        const val = e.target.value;
                        if (!/^#[0-9A-Fa-f]{6}$/.test(val)) {
                            onChange(value);
                        }
                    }}
                />
            </div>
        </PropertyRow>
    );
};

// Material field - AssetField-like style for material selection
interface MaterialFieldProps {
    label: string;
    value: string | undefined;
    onSelect: () => void;
    onClear: () => void;
}

const MaterialField: React.FC<MaterialFieldProps> = ({ label, value, onSelect, onClear }) => {
    const getFileName = (path: string) => {
        const parts = path.split(/[\\/]/);
        return parts[parts.length - 1].replace('.mat', '').replace('.json', '');
    };

    return (
        <div className="material-field">
            <label className="material-field__label">{label}</label>
            <div className="material-field__content">
                {/* Thumbnail */}
                <div className="material-field__thumbnail">
                    <FileBox size={18} className="material-field__thumbnail-icon" />
                </div>

                {/* Right side */}
                <div className="material-field__right">
                    {/* Dropdown */}
                    <div
                        className={`material-field__dropdown ${value ? 'has-value' : ''}`}
                        onClick={onSelect}
                        title={value || '点击选择材质'}
                    >
                        <span className="material-field__value">
                            {value ? getFileName(value) : '默认材质'}
                        </span>
                        <ChevronDown size={12} className="material-field__dropdown-arrow" />
                    </div>

                    {/* Actions */}
                    <div className="material-field__actions">
                        {value && (
                            <>
                                <button
                                    className="material-field__btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(value);
                                    }}
                                    title="复制路径"
                                >
                                    <Copy size={12} />
                                </button>
                                <button
                                    className="material-field__btn material-field__btn--clear"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClear();
                                    }}
                                    title="清除"
                                >
                                    <X size={12} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TilemapDetailsPanel: React.FC<TilemapDetailsPanelProps> = ({
    tilemap,
    onAddLayer,
    onRemoveLayer,
    onMoveLayer,
    onDuplicateLayer,
    onTilemapChange,
    onOpenAssetPicker,
    onSelectLayerMaterial
}) => {
    const {
        layers,
        currentLayer,
        setCurrentLayer,
        toggleLayerVisibility,
        setLayerOpacity,
        setLayerColor,
        setLayerHiddenInGame,
        renameLayer,
        showCollision,
        setShowCollision
    } = useTilemapEditorStore();

    // Layer name editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState('');

    // Layer properties state - synced with store
    const selectedLayer = layers[currentLayer];
    const [layerCollides, setLayerCollides] = useState(true);
    const [overrideCollisionThickness, setOverrideCollisionThickness] = useState(false);
    const [overrideCollisionOffset, setOverrideCollisionOffset] = useState(false);
    const [collisionThickness, setCollisionThickness] = useState(50.0);
    const [collisionOffset, setCollisionOffset] = useState(0.0);

    // hiddenInEditor is derived from layer visibility (inverse relationship)
    const hiddenInEditor = selectedLayer ? !selectedLayer.visible : false;

    const handleHiddenInEditorChange = useCallback((hidden: boolean) => {
        if (currentLayer >= 0 && currentLayer < layers.length) {
            toggleLayerVisibility(currentLayer);
            // Also update tilemap component
            if (tilemap && tilemap.layers[currentLayer]) {
                tilemap.layers[currentLayer].visible = !hidden;
                tilemap.renderDirty = true;
                onTilemapChange();
            }
        }
    }, [currentLayer, layers.length, toggleLayerVisibility, tilemap, onTilemapChange]);

    // Handle eye icon click in layer list
    const handleLayerVisibilityToggle = useCallback((index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLayerVisibility(index);
        // Also update tilemap component
        if (tilemap && tilemap.layers[index]) {
            tilemap.layers[index].visible = !tilemap.layers[index].visible;
            tilemap.renderDirty = true;
            onTilemapChange();
        }
    }, [toggleLayerVisibility, tilemap, onTilemapChange]);

    // Handle layer opacity change
    const handleLayerOpacityChange = useCallback((opacity: number) => {
        if (currentLayer >= 0 && currentLayer < layers.length) {
            setLayerOpacity(currentLayer, opacity);
            // Also update tilemap component
            if (tilemap && tilemap.layers[currentLayer]) {
                tilemap.layers[currentLayer].opacity = opacity;
                tilemap.renderDirty = true;
                onTilemapChange();
            }
        }
    }, [currentLayer, layers.length, setLayerOpacity, tilemap, onTilemapChange]);

    // Handle layer name editing
    const handleStartEditName = useCallback(() => {
        if (selectedLayer) {
            setEditingName(selectedLayer.name);
            setIsEditingName(true);
        }
    }, [selectedLayer]);

    const handleFinishEditName = useCallback(() => {
        if (isEditingName && editingName.trim()) {
            renameLayer(currentLayer, editingName.trim());
            // Also update tilemap component
            if (tilemap && tilemap.layers[currentLayer]) {
                tilemap.renameLayer(currentLayer, editingName.trim());
                onTilemapChange();
            }
        }
        setIsEditingName(false);
    }, [isEditingName, editingName, currentLayer, renameLayer, tilemap, onTilemapChange]);

    const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleFinishEditName();
        } else if (e.key === 'Escape') {
            setIsEditingName(false);
        }
    }, [handleFinishEditName]);

    // Handle layer color change
    const handleLayerColorChange = useCallback((color: string) => {
        if (currentLayer >= 0 && currentLayer < layers.length) {
            setLayerColor(currentLayer, color);
            if (tilemap) {
                tilemap.setLayerColor(currentLayer, color);
                tilemap.renderDirty = true;
                onTilemapChange();
            }
        }
    }, [currentLayer, layers.length, setLayerColor, tilemap, onTilemapChange]);

    // Handle layer hidden in game change
    const handleHiddenInGameChange = useCallback((hidden: boolean) => {
        if (currentLayer >= 0 && currentLayer < layers.length) {
            setLayerHiddenInGame(currentLayer, hidden);
            if (tilemap) {
                tilemap.setLayerHiddenInGame(currentLayer, hidden);
                onTilemapChange();
            }
        }
    }, [currentLayer, layers.length, setLayerHiddenInGame, tilemap, onTilemapChange]);

    // Colors for grid (editor settings, not layer properties)
    const [tileGridColor, setTileGridColor] = useState('#333333');
    const [multiTileGridColor, setMultiTileGridColor] = useState('#ff0000');
    const [_layerGridColor, _setLayerGridColor] = useState('#00ff00');

    const handleLayerSelect = useCallback((index: number) => {
        setCurrentLayer(index);
    }, [setCurrentLayer]);

    const handleMapWidthChange = useCallback((value: number) => {
        if (tilemap && value > 0) {
            tilemap.resize(value, tilemap.height, 'bottom-left');
            onTilemapChange();
        }
    }, [tilemap, onTilemapChange]);

    const handleMapHeightChange = useCallback((value: number) => {
        if (tilemap && value > 0) {
            tilemap.resize(tilemap.width, value, 'bottom-left');
            onTilemapChange();
        }
    }, [tilemap, onTilemapChange]);

    const handleTileWidthChange = useCallback((value: number) => {
        if (tilemap && value > 0) {
            tilemap.tileWidth = value;
            onTilemapChange();
        }
    }, [tilemap, onTilemapChange]);

    const handleTileHeightChange = useCallback((value: number) => {
        if (tilemap && value > 0) {
            tilemap.tileHeight = value;
            onTilemapChange();
        }
    }, [tilemap, onTilemapChange]);

    if (!tilemap) {
        return (
            <div className="tilemap-details-panel">
                <div className="details-empty">
                    未选择瓦片地图
                </div>
            </div>
        );
    }

    return (
        <div className="tilemap-details-panel">
            <div className="details-header">
                <span className="details-header-title">细节</span>
                <div className="details-header-actions">
                    <div className="details-search-inline">
                        <Search size={12} />
                        <input type="text" placeholder="搜索" />
                    </div>
                    <button className="details-settings-btn" title="设置">
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            <div className="details-content">
                {/* Tile Map Section */}
                <Section title="瓦片地图">
                    <div className="property-row">
                        <label>瓦片层列表</label>
                        <span className="layer-count-badge">图层 {currentLayer + 1}</span>
                    </div>

                    {/* Tile Layers List */}
                    <div className="layer-list-container">
                        {layers.map((layer, index) => (
                            <div
                                key={layer.id}
                                className={`layer-list-item ${index === currentLayer ? 'selected' : ''}`}
                                onClick={() => handleLayerSelect(index)}
                            >
                                <button
                                    className={`layer-visibility-btn ${layer.visible ? '' : 'hidden'}`}
                                    onClick={(e) => handleLayerVisibilityToggle(index, e)}
                                    title={layer.visible ? '隐藏图层' : '显示图层'}
                                >
                                    {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                                </button>
                                <span className="layer-icon">◆</span>
                                <span>{layer.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Layer action buttons */}
                    <div className="layer-actions-row">
                        <button
                            className="layer-action-btn add"
                            onClick={onAddLayer}
                            title="添加图层"
                        >
                            <Plus size={14} />
                        </button>
                        <button
                            className="layer-action-btn"
                            onClick={() => currentLayer > 0 && onMoveLayer(currentLayer, currentLayer - 1)}
                            disabled={currentLayer <= 0}
                            title="上移"
                        >
                            <ArrowUp size={14} />
                        </button>
                        <button
                            className="layer-action-btn"
                            onClick={() => currentLayer < layers.length - 1 && onMoveLayer(currentLayer, currentLayer + 1)}
                            disabled={currentLayer >= layers.length - 1}
                            title="下移"
                        >
                            <ArrowDown size={14} />
                        </button>
                        <button
                            className="layer-action-btn"
                            onClick={() => onDuplicateLayer(currentLayer)}
                            title="复制图层"
                        >
                            <Copy size={14} />
                        </button>
                        <button
                            className="layer-action-btn danger"
                            onClick={() => layers.length > 1 && onRemoveLayer(currentLayer)}
                            disabled={layers.length <= 1}
                            title="删除图层"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </Section>

                {/* Selected Layer Section */}
                <Section title="选定层">
                    <PropertyRow label="名称">
                        {isEditingName ? (
                            <input
                                type="text"
                                className="layer-name-input"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={handleFinishEditName}
                                onKeyDown={handleNameKeyDown}
                                autoFocus
                            />
                        ) : (
                            <span
                                className="selected-layer-name editable"
                                onDoubleClick={handleStartEditName}
                                title="双击编辑名称"
                            >
                                {selectedLayer?.name || '图层 1'}
                            </span>
                        )}
                    </PropertyRow>
                    <ToggleProperty
                        label="编辑器中隐藏"
                        checked={hiddenInEditor}
                        onChange={handleHiddenInEditorChange}
                    />
                    <ToggleProperty
                        label="游戏中隐藏"
                        checked={selectedLayer?.hiddenInGame ?? false}
                        onChange={handleHiddenInGameChange}
                    />
                    <SliderProperty
                        label="图层透明度"
                        value={selectedLayer?.opacity ?? 1}
                        onChange={handleLayerOpacityChange}
                        min={0}
                        max={1}
                        step={0.01}
                    />
                    <ToggleProperty
                        label="图层碰撞"
                        checked={layerCollides}
                        onChange={setLayerCollides}
                    />
                    <ToggleProperty
                        label="重载碰撞厚度"
                        checked={overrideCollisionThickness}
                        onChange={setOverrideCollisionThickness}
                        indent
                    />
                    <ToggleProperty
                        label="重载碰撞偏移"
                        checked={overrideCollisionOffset}
                        onChange={setOverrideCollisionOffset}
                        indent
                    />
                    {overrideCollisionThickness && (
                        <NumberProperty
                            label="碰撞厚度重载"
                            value={collisionThickness}
                            onChange={setCollisionThickness}
                        />
                    )}
                    {overrideCollisionOffset && (
                        <NumberProperty
                            label="碰撞偏移重载"
                            value={collisionOffset}
                            onChange={setCollisionOffset}
                        />
                    )}
                    <ColorProperty
                        label="图层颜色"
                        value={selectedLayer?.color ?? '#ffffff'}
                        onChange={handleLayerColorChange}
                    />
                </Section>

                {/* Setup Section */}
                <Section title="配置">
                    <NumberProperty
                        label="地图宽度"
                        value={tilemap.width}
                        onChange={handleMapWidthChange}
                        min={1}
                    />
                    <NumberProperty
                        label="地图高度"
                        value={tilemap.height}
                        onChange={handleMapHeightChange}
                        min={1}
                    />
                    <NumberProperty
                        label="瓦片宽度"
                        value={tilemap.tileWidth}
                        onChange={handleTileWidthChange}
                        min={1}
                    />
                    <NumberProperty
                        label="瓦片高度"
                        value={tilemap.tileHeight}
                        onChange={handleTileHeightChange}
                        min={1}
                    />
                    <NumberProperty
                        label="逻辑单位像素"
                        value={1.0}
                        onChange={() => {}}
                        step={0.1}
                    />
                    <NumberProperty
                        label="逐图层分隔"
                        value={4.0}
                        onChange={() => {}}
                        step={0.1}
                    />
                </Section>

                {/* Material Section */}
                <Section title="图层材质" defaultOpen={true}>
                    <div className="material-section-content">
                        <MaterialField
                            label={`${selectedLayer?.name || '图层'} 材质`}
                            value={tilemap.getLayerMaterial(currentLayer)}
                            onSelect={() => onSelectLayerMaterial?.(currentLayer)}
                            onClear={() => {
                                tilemap.setLayerMaterial(currentLayer, '');
                                onTilemapChange();
                            }}
                        />
                    </div>
                </Section>

                {/* Advanced Section */}
                <Section title="高级" defaultOpen={false}>
                    <PropertyRow label="投射模式">
                        <select defaultValue="orthogonal">
                            <option value="orthogonal">正交</option>
                            <option value="isometric">等轴测</option>
                            <option value="hexagonal">六方</option>
                        </select>
                    </PropertyRow>
                    <NumberProperty
                        label="六方格边长度"
                        value={0}
                        onChange={() => {}}
                    />
                    <ColorProperty
                        label="背景颜色"
                        value={tileGridColor}
                        onChange={setTileGridColor}
                        showReset
                    />
                    <ColorProperty
                        label="瓦片网格颜色"
                        value={tileGridColor}
                        onChange={setTileGridColor}
                        showReset
                    />
                    <ColorProperty
                        label="多瓦片网格颜色"
                        value={multiTileGridColor}
                        onChange={setMultiTileGridColor}
                        showReset
                    />
                    <NumberProperty
                        label="多瓦片网格宽度"
                        value={0}
                        onChange={() => {}}
                    />
                </Section>

                {/* Collision Section */}
                <Section title="碰撞" defaultOpen={false}>
                    <ToggleProperty
                        label="显示碰撞"
                        checked={showCollision}
                        onChange={setShowCollision}
                    />
                </Section>
            </div>
        </div>
    );
};

export default TilemapDetailsPanel;
