/**
 * ShaderAssetInspectorProvider - Inspector provider for .shader files.
 * 着色器资产检视器提供者 - 用于 .shader 文件的检视器。
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { IInspectorProvider, InspectorContext } from '@esengine/editor-core';
import {
    Save, RotateCcw, Play, AlertTriangle, CheckCircle,
    Code, ChevronDown, ChevronRight, BarChart3, FileCode
} from 'lucide-react';
import { ShaderAnalyzer, ShaderAnalysis } from '../analysis/ShaderAnalyzer';
import '../styles/ShaderInspector.css';

/**
 * Asset file info interface.
 * 资产文件信息接口。
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
 * Asset file target with content.
 * 带内容的资产文件目标。
 */
interface AssetFileTarget {
    type: 'asset-file';
    data: AssetFileInfo;
    content?: string;
}

/**
 * Shader data structure (internal format for editing).
 * 着色器数据结构（用于编辑的内部格式）。
 */
interface ShaderData {
    version?: number;
    name: string;
    vertex: string;
    fragment: string;
}

/**
 * Shader file format (wrapper format).
 * 着色器文件格式（包装格式）。
 */
interface ShaderFileFormat {
    version: number;
    shader: {
        name: string;
        vertexSource: string;
        fragmentSource: string;
    };
}

interface ShaderInspectorViewProps {
    fileInfo: AssetFileInfo;
    content: string;
    onSave?: (path: string, content: string) => Promise<void>;
}

/**
 * Shader Inspector View Component.
 * 着色器检视器视图组件。
 */
function ShaderInspectorView({ fileInfo, content, onSave }: ShaderInspectorViewProps) {
    const [shader, setShader] = useState<ShaderData | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'vertex' | 'fragment'>('fragment');
    const [vertexAnalysis, setVertexAnalysis] = useState<ShaderAnalysis | null>(null);
    const [fragmentAnalysis, setFragmentAnalysis] = useState<ShaderAnalysis | null>(null);
    const [analysisExpanded, setAnalysisExpanded] = useState(true);
    const [compileStatus, setCompileStatus] = useState<'none' | 'success' | 'error'>('none');
    const [compileError, setCompileError] = useState<string | null>(null);

    const analyzer = useRef(new ShaderAnalyzer());

    // Parse shader content.
    // 解析着色器内容。
    useEffect(() => {
        try {
            const parsed = JSON.parse(content) as ShaderFileFormat;
            // Convert from file format to internal format.
            // 从文件格式转换为内部格式。
            setShader({
                version: parsed.version,
                name: parsed.shader.name,
                vertex: parsed.shader.vertexSource,
                fragment: parsed.shader.fragmentSource
            });
            setError(null);
            setIsDirty(false);
            setCompileStatus('none');
        } catch (e) {
            setError('Failed to parse shader file');
            setShader(null);
        }
    }, [content]);

    // Analyze shader when source changes.
    // 当源代码改变时分析着色器。
    useEffect(() => {
        if (shader) {
            setVertexAnalysis(analyzer.current.analyze(shader.vertex || '', true));
            setFragmentAnalysis(analyzer.current.analyze(shader.fragment || '', false));
        }
    }, [shader?.vertex, shader?.fragment]);

    const handleSave = useCallback(async () => {
        if (!shader || !onSave) return;
        try {
            // Convert internal format back to file format.
            // 将内部格式转换回文件格式。
            const fileData: ShaderFileFormat = {
                version: shader.version || 1,
                shader: {
                    name: shader.name,
                    vertexSource: shader.vertex,
                    fragmentSource: shader.fragment
                }
            };
            const jsonContent = JSON.stringify(fileData, null, 2);
            await onSave(fileInfo.path, jsonContent);
            setIsDirty(false);
        } catch (e) {
            console.error('[ShaderInspector] Failed to save:', e);
        }
    }, [shader, fileInfo.path, onSave]);

    const handleReset = useCallback(() => {
        try {
            const parsed = JSON.parse(content) as ShaderFileFormat;
            setShader({
                version: parsed.version,
                name: parsed.shader.name,
                vertex: parsed.shader.vertexSource,
                fragment: parsed.shader.fragmentSource
            });
            setIsDirty(false);
            setCompileStatus('none');
        } catch (e) {
            // ignore
        }
    }, [content]);

    const handleSourceChange = (type: 'vertex' | 'fragment', value: string) => {
        if (!shader) return;
        setShader({ ...shader, [type]: value });
        setIsDirty(true);
        setCompileStatus('none');
    };

    const handleCompile = async () => {
        if (!shader) return;

        setCompileStatus('none');
        setCompileError(null);

        try {
            // Dynamic import to avoid circular dependencies.
            // 动态导入避免循环依赖。
            const { getMaterialManager, Shader } = await import('@esengine/material-system');
            const materialManager = getMaterialManager();

            if (!materialManager) {
                setCompileError('MaterialManager not available');
                setCompileStatus('error');
                return;
            }

            // Create test shader.
            // 创建测试着色器。
            const testShader = new Shader(
                `test_${Date.now()}`,
                shader.vertex,
                shader.fragment
            );

            const shaderId = await materialManager.registerShader(testShader);
            if (shaderId > 0) {
                setCompileStatus('success');
                materialManager.removeShader(shaderId);
            } else {
                setCompileError('Compilation failed');
                setCompileStatus('error');
            }
        } catch (err: any) {
            setCompileError(err.message || 'Compilation failed');
            setCompileStatus('error');
        }
    };

    const currentAnalysis = activeTab === 'vertex' ? vertexAnalysis : fragmentAnalysis;

    if (error) {
        return (
            <div className="entity-inspector shader-inspector">
                <div className="inspector-header">
                    <FileCode size={16} style={{ color: '#60a5fa' }} />
                    <span className="entity-name">{fileInfo.name}</span>
                </div>
                <div className="inspector-content">
                    <div className="shader-error">{error}</div>
                </div>
            </div>
        );
    }

    if (!shader) {
        return (
            <div className="entity-inspector shader-inspector">
                <div className="inspector-header">
                    <FileCode size={16} style={{ color: '#60a5fa' }} />
                    <span className="entity-name">{fileInfo.name}</span>
                </div>
                <div className="inspector-content">
                    <div className="shader-loading">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="entity-inspector shader-inspector">
            {/* Header */}
            <div className="inspector-header">
                <FileCode size={16} style={{ color: '#60a5fa' }} />
                <span className="entity-name">{shader.name || fileInfo.name}</span>
                {isDirty && <span className="shader-dirty-indicator">*</span>}
            </div>

            {/* Toolbar */}
            <div className="shader-toolbar">
                <button
                    className="shader-toolbar-btn"
                    onClick={handleCompile}
                    title="Compile shader"
                >
                    <Play size={14} />
                    <span>Compile</span>
                </button>
                <button
                    className="shader-toolbar-btn"
                    onClick={handleSave}
                    disabled={!isDirty || !onSave}
                    title="Save"
                >
                    <Save size={14} />
                    <span>Save</span>
                </button>
                <button
                    className="shader-toolbar-btn"
                    onClick={handleReset}
                    disabled={!isDirty}
                    title="Reset"
                >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                </button>
            </div>

            {/* Compile Status */}
            {compileStatus === 'success' && (
                <div className="shader-status success">
                    <CheckCircle size={14} />
                    <span>Compilation successful!</span>
                </div>
            )}
            {compileStatus === 'error' && (
                <div className="shader-status error">
                    <AlertTriangle size={14} />
                    <span>{compileError}</span>
                </div>
            )}

            <div className="inspector-content">
                {/* Basic Properties */}
                <div className="inspector-section">
                    <div className="section-title">Properties</div>
                    <div className="property-field">
                        <label className="property-label">Name</label>
                        <input
                            type="text"
                            className="shader-input"
                            value={shader.name}
                            onChange={(e) => {
                                setShader({ ...shader, name: e.target.value });
                                setIsDirty(true);
                            }}
                        />
                    </div>
                    <div className="property-field">
                        <label className="property-label">Version</label>
                        <input
                            type="number"
                            className="shader-input"
                            value={shader.version || 1}
                            onChange={(e) => {
                                setShader({ ...shader, version: parseInt(e.target.value, 10) || 1 });
                                setIsDirty(true);
                            }}
                        />
                    </div>
                </div>

                {/* Shader Source Tabs */}
                <div className="inspector-section">
                    <div className="section-title">Source Code</div>
                    <div className="shader-tabs">
                        <button
                            className={`shader-tab ${activeTab === 'vertex' ? 'active' : ''}`}
                            onClick={() => setActiveTab('vertex')}
                        >
                            <Code size={12} />
                            Vertex
                        </button>
                        <button
                            className={`shader-tab ${activeTab === 'fragment' ? 'active' : ''}`}
                            onClick={() => setActiveTab('fragment')}
                        >
                            <Code size={12} />
                            Fragment
                        </button>
                    </div>
                    <div className="shader-code-wrapper">
                        <textarea
                            className="shader-code-editor"
                            value={activeTab === 'vertex' ? shader.vertex : shader.fragment}
                            onChange={e => handleSourceChange(activeTab, e.target.value)}
                            spellCheck={false}
                            placeholder={`Enter ${activeTab} shader code...`}
                        />
                    </div>
                </div>

                {/* Analysis Section */}
                <div className="inspector-section">
                    <div
                        className="section-title section-title-collapsible"
                        onClick={() => setAnalysisExpanded(!analysisExpanded)}
                    >
                        {analysisExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <BarChart3 size={14} />
                        <span>Analysis</span>
                    </div>

                    {analysisExpanded && currentAnalysis && (
                        <div className="shader-analysis">
                            {/* Complexity Badge */}
                            <div className="analysis-row">
                                <span className="analysis-label">Complexity</span>
                                <span className={`complexity-badge ${currentAnalysis.complexity.level}`}>
                                    {currentAnalysis.complexity.level.toUpperCase()}
                                </span>
                            </div>

                            {/* Metrics */}
                            <div className="analysis-row">
                                <span className="analysis-label">Instructions</span>
                                <span className="analysis-value">~{currentAnalysis.complexity.instructionCount}</span>
                            </div>
                            <div className="analysis-row">
                                <span className="analysis-label">Texture Samples</span>
                                <span className="analysis-value">{currentAnalysis.complexity.textureSamples}</span>
                            </div>
                            <div className="analysis-row">
                                <span className="analysis-label">Branches</span>
                                <span className="analysis-value">{currentAnalysis.complexity.branches}</span>
                            </div>
                            <div className="analysis-row">
                                <span className="analysis-label">Loops</span>
                                <span className="analysis-value">{currentAnalysis.complexity.loops}</span>
                            </div>
                            <div className="analysis-row">
                                <span className="analysis-label">Math Ops</span>
                                <span className="analysis-value">{currentAnalysis.complexity.mathOps}</span>
                            </div>

                            {/* Uniforms */}
                            {currentAnalysis.uniforms.length > 0 && (
                                <div className="analysis-group">
                                    <div className="analysis-group-title">
                                        Uniforms ({currentAnalysis.uniforms.length})
                                    </div>
                                    {currentAnalysis.uniforms.map((u, i) => (
                                        <div key={i} className="analysis-item">
                                            <span className="item-type">{u.type}</span>
                                            <span className="item-name">{u.name}</span>
                                            {u.arraySize && <span className="item-array">[{u.arraySize}]</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Attributes (vertex only) */}
                            {activeTab === 'vertex' && currentAnalysis.attributes.length > 0 && (
                                <div className="analysis-group">
                                    <div className="analysis-group-title">
                                        Attributes ({currentAnalysis.attributes.length})
                                    </div>
                                    {currentAnalysis.attributes.map((a, i) => (
                                        <div key={i} className="analysis-item">
                                            <span className="item-type">{a.type}</span>
                                            <span className="item-name">{a.name}</span>
                                            {a.location !== undefined && (
                                                <span className="item-location">loc={a.location}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Varyings */}
                            {currentAnalysis.varyings.length > 0 && (
                                <div className="analysis-group">
                                    <div className="analysis-group-title">
                                        Varyings ({currentAnalysis.varyings.length})
                                    </div>
                                    {currentAnalysis.varyings.map((v, i) => (
                                        <div key={i} className="analysis-item">
                                            <span className={`item-qualifier ${v.qualifier}`}>{v.qualifier}</span>
                                            <span className="item-type">{v.type}</span>
                                            <span className="item-name">{v.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tips */}
                            {currentAnalysis.complexity.tips.length > 0 && (
                                <div className="analysis-group">
                                    <div className="analysis-group-title">Performance Tips</div>
                                    {currentAnalysis.complexity.tips.map((tip, i) => (
                                        <div key={i} className="analysis-tip">
                                            <AlertTriangle size={12} />
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Warnings */}
                            {currentAnalysis.warnings.length > 0 && (
                                <div className="analysis-group">
                                    <div className="analysis-group-title">Warnings</div>
                                    {currentAnalysis.warnings.map((warning, i) => (
                                        <div key={i} className="analysis-warning">
                                            <AlertTriangle size={12} />
                                            <span>{warning}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Info */}
                            <div className="analysis-group">
                                <div className="analysis-group-title">Info</div>
                                <div className="analysis-row">
                                    <span className="analysis-label">GLSL Version</span>
                                    <span className="analysis-value">{currentAnalysis.version}</span>
                                </div>
                                <div className="analysis-row">
                                    <span className="analysis-label">Precision</span>
                                    <span className="analysis-value">{currentAnalysis.precision}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Shader Asset Inspector Provider.
 * 着色器资产检视器提供者。
 */
export class ShaderAssetInspectorProvider implements IInspectorProvider<AssetFileTarget> {
    readonly id = 'shader-asset-inspector';
    readonly name = 'Shader Asset Inspector';
    readonly priority = 100;

    private saveHandler?: (path: string, content: string) => Promise<void>;

    setSaveHandler(handler: (path: string, content: string) => Promise<void>): void {
        this.saveHandler = handler;
    }

    canHandle(target: unknown): target is AssetFileTarget {
        if (typeof target !== 'object' || target === null) return false;
        const t = target as any;
        return t.type === 'asset-file' &&
            t.data?.extension?.toLowerCase() === 'shader' &&
            typeof t.content === 'string';
    }

    render(target: AssetFileTarget, _context: InspectorContext): React.ReactElement {
        return (
            <ShaderInspectorView
                fileInfo={target.data}
                content={target.content!}
                onSave={this.saveHandler}
            />
        );
    }
}
