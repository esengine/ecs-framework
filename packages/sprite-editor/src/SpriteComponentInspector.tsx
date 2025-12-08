/**
 * Sprite Component Inspector.
 * 精灵组件检查器。
 *
 * Provides custom inspector UI for SpriteComponent with material override support.
 * 为 SpriteComponent 提供带材质覆盖支持的自定义检查器 UI。
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Component, Core, getComponentInstanceTypeName } from '@esengine/ecs-framework';
import { IComponentInspector, ComponentInspectorContext, MessageHub, IFileSystemService, IFileSystem, ProjectService } from '@esengine/editor-core';
import { SpriteComponent, MaterialPropertyOverride } from '@esengine/sprite';
import { getMaterialManager, Material, BlendMode, BuiltInShaders, UniformType } from '@esengine/material-system';
import { ChevronDown, ChevronRight, X, Plus, Save, ExternalLink, RefreshCw } from 'lucide-react';
import './SpriteComponentInspector.css';

/**
 * Blend mode options.
 * 混合模式选项。
 */
const BLEND_MODE_OPTIONS = [
    { value: BlendMode.None, label: 'None (Opaque)' },
    { value: BlendMode.Alpha, label: 'Alpha Blend' },
    { value: BlendMode.Additive, label: 'Additive' },
    { value: BlendMode.Multiply, label: 'Multiply' },
    { value: BlendMode.Screen, label: 'Screen' },
    { value: BlendMode.PremultipliedAlpha, label: 'Premultiplied Alpha' },
];

/**
 * Built-in shader options.
 * 内置着色器选项。
 */
const BUILT_IN_SHADER_OPTIONS = [
    { value: BuiltInShaders.DefaultSprite, label: 'Default Sprite' },
    { value: BuiltInShaders.Grayscale, label: 'Grayscale' },
    { value: BuiltInShaders.Tint, label: 'Tint' },
    { value: BuiltInShaders.Flash, label: 'Flash' },
    { value: BuiltInShaders.Outline, label: 'Outline' },
];

/**
 * Shader option with path info.
 * 带路径信息的着色器选项。
 */
interface ShaderOption {
    value: number;
    label: string;
    path?: string;
}

/**
 * Get all available shaders (built-in + custom loaded).
 * 获取所有可用着色器（内置 + 自定义加载的）。
 */
function getAvailableShaders(): ShaderOption[] {
    const materialManager = getMaterialManager();
    if (!materialManager) {
        return BUILT_IN_SHADER_OPTIONS;
    }

    const shaderIds = materialManager.getShaderIds();
    const options: ShaderOption[] = [];

    for (const id of shaderIds) {
        const shader = materialManager.getShader(id);
        if (shader) {
            // Check if it's a built-in shader.
            // 检查是否是内置着色器。
            const builtIn = BUILT_IN_SHADER_OPTIONS.find(opt => opt.value === id);
            options.push({
                value: id,
                label: builtIn ? builtIn.label : shader.name
            });
        }
    }

    return options;
}

/**
 * Scan and load all shader files from project.
 * 扫描并加载项目中所有的着色器文件。
 */
async function scanAndLoadProjectShaders(): Promise<ShaderOption[]> {
    const fileSystem = Core.services.tryResolve<IFileSystem>(IFileSystemService);
    const projectService = Core.services.tryResolve(ProjectService);
    const materialManager = getMaterialManager();

    if (!fileSystem || !projectService || !materialManager) {
        return getAvailableShaders();
    }

    const currentProject = projectService.getCurrentProject();
    if (!currentProject) {
        return getAvailableShaders();
    }

    try {
        // Scan for .shader files in project.
        // 扫描项目中的 .shader 文件。
        const shaderFiles = await fileSystem.scanFiles(currentProject.path, '**/*.shader');

        // Load each shader.
        // 加载每个着色器。
        for (const shaderPath of shaderFiles) {
            // Skip if already loaded.
            // 如果已加载则跳过。
            if (materialManager.hasShaderByPath(shaderPath)) {
                continue;
            }

            try {
                await materialManager.loadShaderFromPath(shaderPath);
            } catch (error) {
                console.warn('[SpriteComponentInspector] Failed to load shader:', shaderPath, error);
            }
        }
    } catch (error) {
        console.warn('[SpriteComponentInspector] Failed to scan shader files:', error);
    }

    return getAvailableShaders();
}

/**
 * Uniform type display names.
 * Uniform 类型显示名称。
 */
const UNIFORM_TYPE_LABELS: Record<string, string> = {
    'float': 'Float',
    'vec2': 'Vec2',
    'vec3': 'Vec3',
    'vec4': 'Vec4',
    'color': 'Color',
    'int': 'Int',
    'mat3': 'Mat3',
    'mat4': 'Mat4',
    'sampler': 'Sampler',
};

/**
 * Inline material editor props.
 * 内联材质编辑器属性。
 */
interface InlineMaterialEditorProps {
    material: Material;
    materialPath: string;
    onMaterialChange: () => void;
}

/**
 * Inline material editor component.
 * 内联材质编辑器组件。
 *
 * Allows editing material properties directly in the sprite inspector.
 * 允许直接在精灵检查器中编辑材质属性。
 */
function InlineMaterialEditor({ material, materialPath, onMaterialChange }: InlineMaterialEditorProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [isLoadingShaders, setIsLoadingShaders] = useState(false);
    const [shaderOptions, setShaderOptions] = useState<ShaderOption[]>(() => getAvailableShaders());
    const [localMaterial, setLocalMaterial] = useState(() => ({
        name: material.name,
        shader: material.shaderId,
        blendMode: material.blendMode,
        uniforms: Object.fromEntries(material.getUniforms())
    }));

    // Scan and load project shaders on mount.
    // 挂载时扫描并加载项目着色器。
    useEffect(() => {
        let mounted = true;
        setIsLoadingShaders(true);

        scanAndLoadProjectShaders().then(options => {
            if (mounted) {
                setShaderOptions(options);
                setIsLoadingShaders(false);
            }
        });

        return () => { mounted = false; };
    }, []);

    // Sync with material changes.
    // 同步材质变化。
    useEffect(() => {
        setLocalMaterial({
            name: material.name,
            shader: material.shaderId,
            blendMode: material.blendMode,
            uniforms: Object.fromEntries(material.getUniforms())
        });
        setIsDirty(false);
    }, [material]);

    const handleShaderChange = (shaderId: number) => {
        material.shaderId = shaderId;
        setLocalMaterial(prev => ({ ...prev, shader: shaderId }));
        setIsDirty(true);
        onMaterialChange();
    };

    const handleRefreshShaders = async () => {
        // Re-scan project shaders.
        // 重新扫描项目着色器。
        setIsLoadingShaders(true);
        const options = await scanAndLoadProjectShaders();
        setShaderOptions(options);
        setIsLoadingShaders(false);
    };

    const handleBlendModeChange = (blendMode: BlendMode) => {
        material.blendMode = blendMode;
        setLocalMaterial(prev => ({ ...prev, blendMode }));
        setIsDirty(true);
        onMaterialChange();
    };

    const handleUniformChange = (name: string, value: number | number[]) => {
        // Get the uniform type from current material.
        // 从当前材质获取 uniform 类型。
        const currentUniform = material.getUniform(name);
        if (!currentUniform) return;

        // Set uniform based on type.
        // 根据类型设置 uniform。
        switch (currentUniform.type) {
            case UniformType.Float:
                if (typeof value === 'number') {
                    material.setFloat(name, value);
                }
                break;
            case UniformType.Int:
                if (typeof value === 'number') {
                    material.setInt(name, value);
                }
                break;
            case UniformType.Vec2:
                if (Array.isArray(value) && value.length >= 2) {
                    material.setVec2(name, value[0], value[1]);
                }
                break;
            case UniformType.Vec3:
                if (Array.isArray(value) && value.length >= 3) {
                    material.setVec3(name, value[0], value[1], value[2]);
                }
                break;
            case UniformType.Vec4:
                if (Array.isArray(value) && value.length >= 4) {
                    material.setVec4(name, value[0], value[1], value[2], value[3]);
                }
                break;
            case UniformType.Color:
                if (Array.isArray(value) && value.length >= 4) {
                    material.setColor(name, value[0], value[1], value[2], value[3]);
                }
                break;
        }

        setLocalMaterial(prev => ({
            ...prev,
            uniforms: { ...prev.uniforms, [name]: { ...prev.uniforms[name], value } }
        }));
        setIsDirty(true);
        onMaterialChange();
    };

    const handleSave = async () => {
        if (!materialPath) return;

        try {
            const fileSystem = Core.services.tryResolve<IFileSystem>(IFileSystemService);
            if (!fileSystem) {
                console.error('[InlineMaterialEditor] FileSystem service not available');
                return;
            }

            // Build material data.
            // 构建材质数据。
            const materialData = {
                name: material.name,
                shader: material.shaderId,
                blendMode: material.blendMode,
                uniforms: Object.fromEntries(
                    Array.from(material.getUniforms().entries()).map(([k, v]) => [k, { type: v.type, value: v.value }])
                )
            };

            await fileSystem.writeFile(materialPath, JSON.stringify(materialData, null, 2));
            setIsDirty(false);

            // Notify
            const messageHub = Core.services.tryResolve(MessageHub);
            if (messageHub) {
                messageHub.publish('material:saved', { filePath: materialPath });
            }
        } catch (error) {
            console.error('[InlineMaterialEditor] Failed to save material:', error);
        }
    };

    const handleOpenInEditor = () => {
        const messageHub = Core.services.tryResolve(MessageHub);
        if (messageHub && materialPath) {
            messageHub.publish('asset:open', { filePath: materialPath, type: 'material' });
        }
    };

    const uniforms = Array.from(material.getUniforms().entries());

    return (
        <div className="inline-material-editor">
            <div
                className="inline-material-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="inline-material-expand">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <span className="inline-material-title">
                    Material: {material.name}
                    {isDirty && <span className="inline-material-dirty">*</span>}
                </span>
                <div className="inline-material-actions" onClick={e => e.stopPropagation()}>
                    <button
                        className="inline-material-btn"
                        onClick={handleSave}
                        disabled={!isDirty}
                        title="Save Material"
                    >
                        <Save size={12} />
                    </button>
                    <button
                        className="inline-material-btn"
                        onClick={handleOpenInEditor}
                        title="Open in Material Editor"
                    >
                        <ExternalLink size={12} />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="inline-material-content">
                    {/* Shader */}
                    <div className="inline-material-row">
                        <label>Shader</label>
                        <div className="inline-material-shader-select">
                            <select
                                value={localMaterial.shader}
                                onChange={e => handleShaderChange(Number(e.target.value))}
                                disabled={isLoadingShaders}
                            >
                                {shaderOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <button
                                className={`inline-material-refresh-btn ${isLoadingShaders ? 'loading' : ''}`}
                                onClick={handleRefreshShaders}
                                disabled={isLoadingShaders}
                                title="Refresh shader list"
                            >
                                <RefreshCw size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Blend Mode */}
                    <div className="inline-material-row">
                        <label>Blend Mode</label>
                        <select
                            value={localMaterial.blendMode}
                            onChange={e => handleBlendModeChange(Number(e.target.value) as BlendMode)}
                        >
                            {BLEND_MODE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Uniforms */}
                    {uniforms.length > 0 && (
                        <div className="inline-material-uniforms">
                            <div className="inline-material-uniforms-header">Uniforms</div>
                            {uniforms.map(([name, uniform]) => (
                                <div key={name} className="inline-material-uniform">
                                    <label>{name}</label>
                                    <UniformValueEditor
                                        type={uniform.type as MaterialPropertyOverride['type']}
                                        value={uniform.value as number | number[]}
                                        onChange={v => handleUniformChange(name, v)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Uniform value editor component (reused for both material and overrides).
 * Uniform 值编辑器组件（用于材质和覆盖）。
 */
function UniformValueEditor({ type, value, onChange }: {
    type: MaterialPropertyOverride['type'];
    value: number | number[];
    onChange: (value: number | number[]) => void;
}) {
    switch (type) {
        case 'float':
        case 'int':
            return (
                <input
                    type="number"
                    className="uniform-input uniform-input-number"
                    value={typeof value === 'number' ? value : 0}
                    step={type === 'int' ? 1 : 0.1}
                    onChange={(e) => {
                        const v = type === 'int'
                            ? Math.floor(parseFloat(e.target.value) || 0)
                            : parseFloat(e.target.value) || 0;
                        onChange(v);
                    }}
                />
            );

        case 'vec2':
            return (
                <div className="uniform-vector">
                    {['X', 'Y'].map((axis, i) => (
                        <div key={axis} className="uniform-vector-axis">
                            <span className={`uniform-axis-label uniform-axis-${axis.toLowerCase()}`}>{axis}</span>
                            <input
                                type="number"
                                className="uniform-input"
                                value={Array.isArray(value) ? (value[i] ?? 0) : 0}
                                step={0.1}
                                onChange={(e) => {
                                    const arr = Array.isArray(value) ? [...value] : [0, 0];
                                    arr[i] = parseFloat(e.target.value) || 0;
                                    onChange(arr);
                                }}
                            />
                        </div>
                    ))}
                </div>
            );

        case 'vec3':
            return (
                <div className="uniform-vector">
                    {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} className="uniform-vector-axis">
                            <span className={`uniform-axis-label uniform-axis-${axis.toLowerCase()}`}>{axis}</span>
                            <input
                                type="number"
                                className="uniform-input"
                                value={Array.isArray(value) ? (value[i] ?? 0) : 0}
                                step={0.1}
                                onChange={(e) => {
                                    const arr = Array.isArray(value) ? [...value] : [0, 0, 0];
                                    arr[i] = parseFloat(e.target.value) || 0;
                                    onChange(arr);
                                }}
                            />
                        </div>
                    ))}
                </div>
            );

        case 'vec4':
            return (
                <div className="uniform-vector uniform-vector-4">
                    {['X', 'Y', 'Z', 'W'].map((axis, i) => (
                        <div key={axis} className="uniform-vector-axis">
                            <span className={`uniform-axis-label uniform-axis-${axis.toLowerCase()}`}>{axis}</span>
                            <input
                                type="number"
                                className="uniform-input"
                                value={Array.isArray(value) ? (value[i] ?? 0) : 0}
                                step={0.1}
                                onChange={(e) => {
                                    const arr = Array.isArray(value) ? [...value] : [0, 0, 0, 0];
                                    arr[i] = parseFloat(e.target.value) || 0;
                                    onChange(arr);
                                }}
                            />
                        </div>
                    ))}
                </div>
            );

        case 'color': {
            const colorArray = Array.isArray(value) ? value : [1, 1, 1, 1];
            const r = Math.round((colorArray[0] ?? 1) * 255);
            const g = Math.round((colorArray[1] ?? 1) * 255);
            const b = Math.round((colorArray[2] ?? 1) * 255);
            const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

            return (
                <div className="uniform-color">
                    <div
                        className="uniform-color-preview"
                        style={{ backgroundColor: hexColor }}
                    />
                    <input
                        type="color"
                        className="uniform-color-input"
                        value={hexColor}
                        onChange={(e) => {
                            const hex = e.target.value;
                            const newR = parseInt(hex.slice(1, 3), 16) / 255;
                            const newG = parseInt(hex.slice(3, 5), 16) / 255;
                            const newB = parseInt(hex.slice(5, 7), 16) / 255;
                            onChange([newR, newG, newB, colorArray[3] ?? 1]);
                        }}
                    />
                    <input
                        type="number"
                        className="uniform-input uniform-alpha"
                        value={colorArray[3] ?? 1}
                        min={0}
                        max={1}
                        step={0.1}
                        title="Alpha"
                        onChange={(e) => {
                            const alpha = Math.max(0, Math.min(1, parseFloat(e.target.value) || 0));
                            onChange([colorArray[0] ?? 1, colorArray[1] ?? 1, colorArray[2] ?? 1, alpha]);
                        }}
                    />
                </div>
            );
        }

        default:
            return <span className="uniform-unsupported">Unsupported type</span>;
    }
}

/**
 * Material override editor props.
 * 材质覆盖编辑器属性。
 */
interface MaterialOverrideEditorProps {
    sprite: SpriteComponent;
    material: Material | null;
    onChange: (propertyName: string, value: unknown) => void;
}

/**
 * Material override editor component.
 * 材质覆盖编辑器组件。
 */
function MaterialOverrideEditor({ sprite, material, onChange }: MaterialOverrideEditorProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showAddMenu, setShowAddMenu] = useState(false);

    // Get available uniforms from material.
    // 从材质获取可用的 uniforms。
    const availableUniforms = useMemo(() => {
        if (!material) return [];
        const uniforms = material.getUniforms();
        return Array.from(uniforms.entries()).map(([name, value]) => ({
            name,
            type: value.type,
            defaultValue: value.value
        }));
    }, [material]);

    // Get current overrides.
    // 获取当前覆盖。
    const currentOverrides = sprite.materialOverrides || {};
    const overrideKeys = Object.keys(currentOverrides);

    // Get uniforms not yet overridden.
    // 获取尚未覆盖的 uniforms。
    const unoverriddenUniforms = availableUniforms.filter(
        u => !overrideKeys.includes(u.name)
    );

    const handleAddOverride = (uniformName: string) => {
        const uniform = availableUniforms.find(u => u.name === uniformName);
        if (!uniform) return;

        // Convert defaultValue to appropriate type
        let value: number | number[];
        if (typeof uniform.defaultValue === 'number') {
            value = uniform.defaultValue;
        } else if (Array.isArray(uniform.defaultValue)) {
            value = uniform.defaultValue as number[];
        } else {
            value = 0;
        }

        const newOverride: MaterialPropertyOverride = {
            type: uniform.type as MaterialPropertyOverride['type'],
            value
        };

        const newOverrides = { ...currentOverrides, [uniformName]: newOverride };
        onChange('materialOverrides', newOverrides);
        setShowAddMenu(false);
    };

    const handleRemoveOverride = (uniformName: string) => {
        const newOverrides = { ...currentOverrides };
        delete newOverrides[uniformName];
        onChange('materialOverrides', newOverrides);
    };

    const handleOverrideChange = (uniformName: string, value: number | number[]) => {
        const current = currentOverrides[uniformName];
        if (!current) return;

        const newOverrides = {
            ...currentOverrides,
            [uniformName]: { ...current, value }
        };
        onChange('materialOverrides', newOverrides);
    };

    if (!sprite.materialGuid) {
        return null;
    }

    return (
        <div className="material-override-section">
            <div
                className="material-override-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="material-override-expand">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <span className="material-override-title">Material Overrides</span>
                {overrideKeys.length > 0 && (
                    <span className="material-override-count">{overrideKeys.length}</span>
                )}
            </div>

            {isExpanded && (
                <div className="material-override-content">
                    {/* Existing overrides */}
                    {overrideKeys.map(key => {
                        const override = currentOverrides[key];
                        if (!override) return null;
                        return (
                            <div key={key} className="material-override-item">
                                <div className="material-override-item-header">
                                    <span className="material-override-name">{key}</span>
                                    <span className="material-override-type">
                                        {UNIFORM_TYPE_LABELS[override.type] || override.type}
                                    </span>
                                    <button
                                        className="material-override-remove"
                                        onClick={() => handleRemoveOverride(key)}
                                        title="Remove override"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                                <OverrideValueEditor
                                    type={override.type}
                                    value={override.value}
                                    onChange={(v) => handleOverrideChange(key, v)}
                                />
                            </div>
                        );
                    })}

                    {/* Add override button */}
                    {unoverriddenUniforms.length > 0 && (
                        <div className="material-override-add-container">
                            <button
                                className="material-override-add-btn"
                                onClick={() => setShowAddMenu(!showAddMenu)}
                            >
                                <Plus size={12} />
                                <span>Add Override</span>
                            </button>
                            {showAddMenu && (
                                <div className="material-override-add-menu">
                                    {unoverriddenUniforms.map(u => (
                                        <button
                                            key={u.name}
                                            className="material-override-add-item"
                                            onClick={() => handleAddOverride(u.name)}
                                        >
                                            <span>{u.name}</span>
                                            <span className="material-override-type-hint">
                                                {UNIFORM_TYPE_LABELS[u.type] || u.type}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty state */}
                    {overrideKeys.length === 0 && unoverriddenUniforms.length === 0 && (
                        <div className="material-override-empty">
                            {material ? 'No parameters available' : 'Select a material first'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Override value editor props.
 * 覆盖值编辑器属性。
 */
interface OverrideValueEditorProps {
    type: MaterialPropertyOverride['type'];
    value: number | number[];
    onChange: (value: number | number[]) => void;
}

/**
 * Override value editor component.
 * 覆盖值编辑器组件。
 */
function OverrideValueEditor({ type, value, onChange }: OverrideValueEditorProps) {
    switch (type) {
        case 'float':
        case 'int':
            return (
                <input
                    type="number"
                    className="override-input override-input-number"
                    value={typeof value === 'number' ? value : 0}
                    step={type === 'int' ? 1 : 0.1}
                    onChange={(e) => {
                        const v = type === 'int'
                            ? Math.floor(parseFloat(e.target.value) || 0)
                            : parseFloat(e.target.value) || 0;
                        onChange(v);
                    }}
                />
            );

        case 'vec2':
            return (
                <div className="override-vector">
                    {['X', 'Y'].map((axis, i) => (
                        <div key={axis} className="override-vector-axis">
                            <span className={`override-axis-label override-axis-${axis.toLowerCase()}`}>{axis}</span>
                            <input
                                type="number"
                                className="override-input"
                                value={Array.isArray(value) ? (value[i] ?? 0) : 0}
                                step={0.1}
                                onChange={(e) => {
                                    const arr = Array.isArray(value) ? [...value] : [0, 0];
                                    arr[i] = parseFloat(e.target.value) || 0;
                                    onChange(arr);
                                }}
                            />
                        </div>
                    ))}
                </div>
            );

        case 'vec3':
            return (
                <div className="override-vector">
                    {['X', 'Y', 'Z'].map((axis, i) => (
                        <div key={axis} className="override-vector-axis">
                            <span className={`override-axis-label override-axis-${axis.toLowerCase()}`}>{axis}</span>
                            <input
                                type="number"
                                className="override-input"
                                value={Array.isArray(value) ? (value[i] ?? 0) : 0}
                                step={0.1}
                                onChange={(e) => {
                                    const arr = Array.isArray(value) ? [...value] : [0, 0, 0];
                                    arr[i] = parseFloat(e.target.value) || 0;
                                    onChange(arr);
                                }}
                            />
                        </div>
                    ))}
                </div>
            );

        case 'vec4':
            return (
                <div className="override-vector override-vector-4">
                    {['X', 'Y', 'Z', 'W'].map((axis, i) => (
                        <div key={axis} className="override-vector-axis">
                            <span className={`override-axis-label override-axis-${axis.toLowerCase()}`}>{axis}</span>
                            <input
                                type="number"
                                className="override-input"
                                value={Array.isArray(value) ? (value[i] ?? 0) : 0}
                                step={0.1}
                                onChange={(e) => {
                                    const arr = Array.isArray(value) ? [...value] : [0, 0, 0, 0];
                                    arr[i] = parseFloat(e.target.value) || 0;
                                    onChange(arr);
                                }}
                            />
                        </div>
                    ))}
                </div>
            );

        case 'color': {
            const colorArray = Array.isArray(value) ? value : [1, 1, 1, 1];
            const r = Math.round((colorArray[0] ?? 1) * 255);
            const g = Math.round((colorArray[1] ?? 1) * 255);
            const b = Math.round((colorArray[2] ?? 1) * 255);
            const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

            return (
                <div className="override-color">
                    <div
                        className="override-color-preview"
                        style={{ backgroundColor: hexColor }}
                    />
                    <input
                        type="color"
                        className="override-color-input"
                        value={hexColor}
                        onChange={(e) => {
                            const hex = e.target.value;
                            const newR = parseInt(hex.slice(1, 3), 16) / 255;
                            const newG = parseInt(hex.slice(3, 5), 16) / 255;
                            const newB = parseInt(hex.slice(5, 7), 16) / 255;
                            onChange([newR, newG, newB, colorArray[3] ?? 1]);
                        }}
                    />
                    <input
                        type="number"
                        className="override-input override-alpha"
                        value={colorArray[3] ?? 1}
                        min={0}
                        max={1}
                        step={0.1}
                        title="Alpha"
                        onChange={(e) => {
                            const alpha = Math.max(0, Math.min(1, parseFloat(e.target.value) || 0));
                            onChange([colorArray[0] ?? 1, colorArray[1] ?? 1, colorArray[2] ?? 1, alpha]);
                        }}
                    />
                </div>
            );
        }

        default:
            return <span className="override-unsupported">Unsupported type</span>;
    }
}

/**
 * Sprite inspector content component.
 * 精灵检查器内容组件。
 */
function SpriteInspectorContent({ context }: { context: ComponentInspectorContext }) {
    const sprite = context.component as SpriteComponent;
    const [material, setMaterial] = useState<Material | null>(null);
    const [, forceUpdate] = useState({});

    // Load material when sprite.materialGuid changes.
    // 当 sprite.materialGuid 变化时加载材质。
    useEffect(() => {
        if (!sprite.materialGuid) {
            setMaterial(null);
            return;
        }

        const materialManager = getMaterialManager();
        if (!materialManager) {
            setMaterial(null);
            return;
        }

        // Try to get cached material by ID.
        // 尝试通过 ID 获取缓存的材质。
        const materialId = materialManager.getMaterialIdByPath(sprite.materialGuid);
        if (materialId > 0) {
            const mat = materialManager.getMaterial(materialId);
            setMaterial(mat || null);
            return;
        }

        // Load material asynchronously.
        // 异步加载材质。
        materialManager.loadMaterialFromPath(sprite.materialGuid)
            .then(matId => {
                const mat = materialManager.getMaterial(matId);
                setMaterial(mat || null);
            })
            .catch(() => {
                setMaterial(null);
            });
    }, [sprite.materialGuid]);

    const handleChange = useCallback((propertyName: string, value: unknown) => {
        (sprite as unknown as Record<string, unknown>)[propertyName] = value;
        context.onChange?.(propertyName, value);
        forceUpdate({});

        // Publish scene:modified.
        // 发布 scene:modified。
        const messageHub = Core.services.tryResolve(MessageHub);
        if (messageHub) {
            messageHub.publish('scene:modified', {});
        }
    }, [sprite, context]);

    const handleMaterialChange = useCallback(() => {
        forceUpdate({});
        // Publish scene:modified for material changes.
        // 发布 scene:modified 用于材质变更。
        const messageHub = Core.services.tryResolve(MessageHub);
        if (messageHub) {
            messageHub.publish('scene:modified', {});
        }
    }, []);

    // No material selected
    if (!sprite.materialGuid) {
        return null;
    }

    return (
        <div className="sprite-component-inspector">
            {/* Inline material editor */}
            {material && (
                <InlineMaterialEditor
                    material={material}
                    materialPath={sprite.materialGuid}
                    onMaterialChange={handleMaterialChange}
                />
            )}

            {/* Material override section */}
            <MaterialOverrideEditor
                sprite={sprite}
                material={material}
                onChange={handleChange}
            />
        </div>
    );
}

/**
 * Sprite component inspector implementation.
 * 精灵组件检查器实现。
 *
 * Uses 'append' mode to show material overrides after the default PropertyInspector.
 * 使用 'append' 模式在默认 PropertyInspector 后显示材质覆盖。
 */
export class SpriteComponentInspector implements IComponentInspector<SpriteComponent> {
    readonly id = 'sprite-component-inspector';
    readonly name = 'Sprite Component Inspector';
    readonly priority = 100;
    readonly targetComponents = ['Sprite', 'SpriteComponent'];
    readonly renderMode = 'append' as const;

    canHandle(component: Component): component is SpriteComponent {
        const typeName = getComponentInstanceTypeName(component);
        return typeName === 'Sprite' || typeName === 'SpriteComponent';
    }

    render(context: ComponentInspectorContext): React.ReactElement {
        return React.createElement(SpriteInspectorContent, {
            context,
            key: `sprite-${context.version}`
        });
    }
}
