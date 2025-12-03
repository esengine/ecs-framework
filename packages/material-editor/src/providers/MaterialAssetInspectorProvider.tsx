/**
 * MaterialAssetInspectorProvider - Inspector provider for .mat files
 * 材质资产检视器提供者 - 用于 .mat 文件的检视器
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { IInspectorProvider, InspectorContext } from '@esengine/editor-core';
import { BlendMode, BuiltInShaders, UniformType } from '@esengine/material-system';
import { Palette, Save, RotateCcw, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import '../styles/MaterialInspector.css';

/**
 * Asset file info interface (matches editor-app's AssetFileInfo)
 */
interface AssetFileInfo {
    name: string;
    path: string;
    extension?: string;
    size?: number;
    modified?: number;
    isDirectory: boolean;
}

/**
 * Asset file target with content
 */
interface AssetFileTarget {
    type: 'asset-file';
    data: AssetFileInfo;
    content?: string;
}

interface UniformValue {
    type: UniformType;
    value: number | number[] | string;
}

interface MaterialData {
    name: string;
    shader: number | string;
    blendMode?: BlendMode;
    uniforms?: Record<string, UniformValue>;
}

const BLEND_MODE_OPTIONS = [
    { value: BlendMode.None, label: 'None (Opaque)' },
    { value: BlendMode.Alpha, label: 'Alpha' },
    { value: BlendMode.Additive, label: 'Additive' },
    { value: BlendMode.Multiply, label: 'Multiply' },
    { value: BlendMode.Screen, label: 'Screen' },
    { value: BlendMode.PremultipliedAlpha, label: 'Premultiplied Alpha' }
];

const SHADER_OPTIONS = [
    { value: BuiltInShaders.DefaultSprite, label: 'Default Sprite' },
    { value: BuiltInShaders.Grayscale, label: 'Grayscale' },
    { value: BuiltInShaders.Tint, label: 'Tint' },
    { value: BuiltInShaders.Flash, label: 'Flash' },
    { value: BuiltInShaders.Outline, label: 'Outline' }
];

const UNIFORM_TYPE_OPTIONS = [
    { value: UniformType.Float, label: 'Float' },
    { value: UniformType.Vec2, label: 'Vec2' },
    { value: UniformType.Vec3, label: 'Vec3' },
    { value: UniformType.Vec4, label: 'Vec4' },
    { value: UniformType.Color, label: 'Color' },
    { value: UniformType.Int, label: 'Int' }
];

interface MaterialInspectorViewProps {
    fileInfo: AssetFileInfo;
    content: string;
    onSave?: (path: string, content: string) => Promise<void>;
}

function MaterialInspectorView({ fileInfo, content, onSave }: MaterialInspectorViewProps) {
    const [material, setMaterial] = useState<MaterialData | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uniformsExpanded, setUniformsExpanded] = useState(true);
    const [newUniformName, setNewUniformName] = useState('');

    useEffect(() => {
        try {
            const parsed = JSON.parse(content);
            setMaterial(parsed);
            setError(null);
            setIsDirty(false);
        } catch (e) {
            setError('Failed to parse material file');
            setMaterial(null);
        }
    }, [content]);

    const handleSave = useCallback(async () => {
        if (!material || !onSave) return;
        try {
            const jsonContent = JSON.stringify(material, null, 2);
            await onSave(fileInfo.path, jsonContent);
            setIsDirty(false);
        } catch (e) {
            console.error('Failed to save material:', e);
        }
    }, [material, fileInfo.path, onSave]);

    const handleReset = useCallback(() => {
        try {
            const parsed = JSON.parse(content);
            setMaterial(parsed);
            setIsDirty(false);
        } catch (e) {
            // ignore
        }
    }, [content]);

    const updateMaterial = useCallback((updates: Partial<MaterialData>) => {
        setMaterial(prev => prev ? { ...prev, ...updates } : null);
        setIsDirty(true);
    }, []);

    const updateUniform = useCallback((name: string, value: UniformValue) => {
        setMaterial(prev => {
            if (!prev) return null;
            return {
                ...prev,
                uniforms: {
                    ...prev.uniforms,
                    [name]: value
                }
            };
        });
        setIsDirty(true);
    }, []);

    const removeUniform = useCallback((name: string) => {
        setMaterial(prev => {
            if (!prev || !prev.uniforms) return prev;
            const newUniforms = { ...prev.uniforms };
            delete newUniforms[name];
            return { ...prev, uniforms: newUniforms };
        });
        setIsDirty(true);
    }, []);

    const addUniform = useCallback(() => {
        if (!newUniformName.trim()) return;
        const name = newUniformName.trim();
        setMaterial(prev => {
            if (!prev) return null;
            return {
                ...prev,
                uniforms: {
                    ...prev.uniforms,
                    [name]: { type: UniformType.Float, value: 0 }
                }
            };
        });
        setNewUniformName('');
        setIsDirty(true);
    }, [newUniformName]);

    const renderUniformEditor = (name: string, uniform: UniformValue) => {
        const handleTypeChange = (newType: UniformType) => {
            let defaultValue: number | number[] = 0;
            switch (newType) {
                case UniformType.Vec2:
                    defaultValue = [0, 0];
                    break;
                case UniformType.Vec3:
                    defaultValue = [0, 0, 0];
                    break;
                case UniformType.Vec4:
                case UniformType.Color:
                    defaultValue = [1, 1, 1, 1];
                    break;
                default:
                    defaultValue = 0;
            }
            updateUniform(name, { type: newType, value: defaultValue });
        };

        const renderValueEditor = () => {
            switch (uniform.type) {
                case UniformType.Float:
                case UniformType.Int:
                    return (
                        <input
                            type="number"
                            className="material-input"
                            value={uniform.value as number}
                            step={uniform.type === UniformType.Int ? 1 : 0.01}
                            onChange={(e) => updateUniform(name, { ...uniform, value: parseFloat(e.target.value) || 0 })}
                        />
                    );
                case UniformType.Vec2:
                case UniformType.Vec3:
                case UniformType.Vec4: {
                    const values = uniform.value as number[];
                    const labels = ['X', 'Y', 'Z', 'W'];
                    return (
                        <div className="material-vec-editor">
                            {values.map((v, i) => (
                                <div key={i} className="material-vec-field">
                                    <span className="material-vec-label">{labels[i]}</span>
                                    <input
                                        type="number"
                                        className="material-input material-vec-input"
                                        value={v}
                                        step={0.01}
                                        onChange={(e) => {
                                            const newValues = [...values];
                                            newValues[i] = parseFloat(e.target.value) || 0;
                                            updateUniform(name, { ...uniform, value: newValues });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    );
                }
                case UniformType.Color: {
                    const colorValues = uniform.value as number[];
                    const r = Math.round((colorValues[0] || 0) * 255);
                    const g = Math.round((colorValues[1] || 0) * 255);
                    const b = Math.round((colorValues[2] || 0) * 255);
                    const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

                    return (
                        <div className="material-color-editor">
                            <input
                                type="color"
                                className="material-color-picker"
                                value={hexColor}
                                onChange={(e) => {
                                    const hex = e.target.value;
                                    const newR = parseInt(hex.slice(1, 3), 16) / 255;
                                    const newG = parseInt(hex.slice(3, 5), 16) / 255;
                                    const newB = parseInt(hex.slice(5, 7), 16) / 255;
                                    updateUniform(name, { ...uniform, value: [newR, newG, newB, colorValues[3] || 1] });
                                }}
                            />
                            <input
                                type="number"
                                className="material-input material-alpha-input"
                                value={colorValues[3] ?? 1}
                                min={0}
                                max={1}
                                step={0.01}
                                title="Alpha"
                                onChange={(e) => {
                                    const newAlpha = parseFloat(e.target.value) || 0;
                                    updateUniform(name, { ...uniform, value: [colorValues[0] ?? 1, colorValues[1] ?? 1, colorValues[2] ?? 1, newAlpha] });
                                }}
                            />
                        </div>
                    );
                }
                default:
                    return <span className="material-value-text">{JSON.stringify(uniform.value)}</span>;
            }
        };

        return (
            <div key={name} className="material-uniform-item">
                <div className="material-uniform-header">
                    <span className="material-uniform-name">{name}</span>
                    <select
                        className="material-select material-type-select"
                        value={uniform.type}
                        onChange={(e) => handleTypeChange(e.target.value as UniformType)}
                    >
                        {UNIFORM_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <button
                        className="material-icon-btn material-delete-btn"
                        onClick={() => removeUniform(name)}
                        title="Remove uniform"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
                <div className="material-uniform-value">
                    {renderValueEditor()}
                </div>
            </div>
        );
    };

    if (error) {
        return (
            <div className="entity-inspector">
                <div className="inspector-header">
                    <Palette size={16} style={{ color: '#a78bfa' }} />
                    <span className="entity-name">{fileInfo.name}</span>
                </div>
                <div className="inspector-content">
                    <div className="material-error">{error}</div>
                </div>
            </div>
        );
    }

    if (!material) {
        return (
            <div className="entity-inspector">
                <div className="inspector-header">
                    <Palette size={16} style={{ color: '#a78bfa' }} />
                    <span className="entity-name">{fileInfo.name}</span>
                </div>
                <div className="inspector-content">
                    <div className="material-loading">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="entity-inspector material-inspector">
            <div className="inspector-header">
                <Palette size={16} style={{ color: '#a78bfa' }} />
                <span className="entity-name">{material.name || fileInfo.name}</span>
                {isDirty && <span className="material-dirty-indicator">*</span>}
            </div>

            <div className="material-toolbar">
                <button
                    className="material-toolbar-btn"
                    onClick={handleSave}
                    disabled={!isDirty || !onSave}
                    title="Save (Ctrl+S)"
                >
                    <Save size={14} />
                    <span>Save</span>
                </button>
                <button
                    className="material-toolbar-btn"
                    onClick={handleReset}
                    disabled={!isDirty}
                    title="Reset changes"
                >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                </button>
            </div>

            <div className="inspector-content">
                <div className="inspector-section">
                    <div className="section-title">Basic Properties</div>

                    <div className="property-field">
                        <label className="property-label">Name</label>
                        <input
                            type="text"
                            className="material-input"
                            value={material.name}
                            onChange={(e) => updateMaterial({ name: e.target.value })}
                        />
                    </div>

                    <div className="property-field">
                        <label className="property-label">Shader</label>
                        <select
                            className="material-select"
                            value={material.shader}
                            onChange={(e) => updateMaterial({ shader: parseInt(e.target.value) })}
                        >
                            {SHADER_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="property-field">
                        <label className="property-label">Blend Mode</label>
                        <select
                            className="material-select"
                            value={material.blendMode ?? BlendMode.Alpha}
                            onChange={(e) => updateMaterial({ blendMode: parseInt(e.target.value) as BlendMode })}
                        >
                            {BLEND_MODE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="inspector-section">
                    <div
                        className="section-title section-title-collapsible"
                        onClick={() => setUniformsExpanded(!uniformsExpanded)}
                    >
                        {uniformsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>Uniforms</span>
                        <span className="material-uniform-count">
                            ({Object.keys(material.uniforms || {}).length})
                        </span>
                    </div>

                    {uniformsExpanded && (
                        <div className="material-uniforms-content">
                            {material.uniforms && Object.entries(material.uniforms).map(([name, uniform]) =>
                                renderUniformEditor(name, uniform)
                            )}

                            <div className="material-add-uniform">
                                <input
                                    type="text"
                                    className="material-input"
                                    placeholder="Uniform name..."
                                    value={newUniformName}
                                    onChange={(e) => setNewUniformName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addUniform()}
                                />
                                <button
                                    className="material-icon-btn material-add-btn"
                                    onClick={addUniform}
                                    disabled={!newUniformName.trim()}
                                    title="Add uniform"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Material Asset Inspector Provider
 */
export class MaterialAssetInspectorProvider implements IInspectorProvider<AssetFileTarget> {
    readonly id = 'material-asset-inspector';
    readonly name = 'Material Asset Inspector';
    readonly priority = 100;

    private saveHandler?: (path: string, content: string) => Promise<void>;

    setSaveHandler(handler: (path: string, content: string) => Promise<void>): void {
        this.saveHandler = handler;
    }

    canHandle(target: unknown): target is AssetFileTarget {
        if (typeof target !== 'object' || target === null) return false;
        const t = target as any;
        return t.type === 'asset-file' &&
            t.data?.extension?.toLowerCase() === 'mat' &&
            typeof t.content === 'string';
    }

    render(target: AssetFileTarget, _context: InspectorContext): React.ReactElement {
        return (
            <MaterialInspectorView
                fileInfo={target.data}
                content={target.content!}
                onSave={this.saveHandler}
            />
        );
    }
}
