/**
 * Shader Editor Panel.
 * 着色器编辑器面板。
 *
 * Provides shader code editing, analysis, and preview.
 * 提供着色器代码编辑、分析和预览功能。
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub, IFileSystemService, IFileSystem, ProjectService } from '@esengine/editor-core';
import { getMaterialManager, Shader } from '@esengine/material-system';
import {
    Save, RefreshCw, Play, AlertTriangle, CheckCircle,
    Code, Eye, BarChart3, FileCode, ChevronDown, ChevronRight
} from 'lucide-react';
import { ShaderAnalyzer, ShaderAnalysis } from '../analysis/ShaderAnalyzer';
import { useShaderEditorStore } from '../stores/ShaderEditorStore';
import './ShaderEditorPanel.css';

/**
 * Shader Editor Panel Props.
 * 着色器编辑器面板属性。
 */
interface ShaderEditorPanelProps {
    filePath?: string;
}

/**
 * Shader Editor Panel Component.
 * 着色器编辑器面板组件。
 */
export function ShaderEditorPanel({ filePath: propFilePath }: ShaderEditorPanelProps) {
    const {
        filePath, shaderData, isDirty,
        setFilePath, setShaderData, setDirty, reset
    } = useShaderEditorStore();

    const [activeTab, setActiveTab] = useState<'vertex' | 'fragment'>('fragment');
    const [showAnalysis, setShowAnalysis] = useState(true);
    const [_showPreview, _setShowPreview] = useState(true);
    const [vertexAnalysis, setVertexAnalysis] = useState<ShaderAnalysis | null>(null);
    const [fragmentAnalysis, setFragmentAnalysis] = useState<ShaderAnalysis | null>(null);
    const [compileError, setCompileError] = useState<string | null>(null);
    const [compileSuccess, setCompileSuccess] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const analyzer = useRef(new ShaderAnalyzer());

    // Load shader file.
    // 加载着色器文件。
    useEffect(() => {
        const pathToLoad = propFilePath || filePath;
        if (pathToLoad) {
            loadShaderFile(pathToLoad);
        }
    }, [propFilePath]);

    // Subscribe to file open messages.
    // 订阅文件打开消息。
    useEffect(() => {
        const messageHub = Core.services.tryResolve(MessageHub);
        if (!messageHub) return;

        const unsubscribe = messageHub.subscribe('shader:open', (payload: { filePath: string }) => {
            loadShaderFile(payload.filePath);
        });

        return () => unsubscribe();
    }, []);

    // Analyze shader when source changes.
    // 当源代码改变时分析着色器。
    useEffect(() => {
        if (shaderData) {
            setVertexAnalysis(analyzer.current.analyze(shaderData.vertex, true));
            setFragmentAnalysis(analyzer.current.analyze(shaderData.fragment, false));
        }
    }, [shaderData?.vertex, shaderData?.fragment]);

    const loadShaderFile = async (path: string) => {
        const fileSystem = Core.services.tryResolve<IFileSystem>(IFileSystemService);
        if (!fileSystem) return;

        try {
            const content = await fileSystem.readFile(path);
            const data = JSON.parse(content);
            setFilePath(path);
            setShaderData({
                version: data.version || 1,
                name: data.shader.name || 'Untitled',
                vertex: data.shader.vertexSource || '',
                fragment: data.shader.fragmentSource || ''
            });
            setDirty(false);
            setCompileError(null);
            setCompileSuccess(false);
        } catch (error) {
            console.error('[ShaderEditorPanel] Failed to load shader:', error);
        }
    };

    const handleSave = async () => {
        if (!filePath || !shaderData) return;

        const fileSystem = Core.services.tryResolve<IFileSystem>(IFileSystemService);
        if (!fileSystem) return;

        try {
            // Save in new wrapper format.
            // 以新的包装格式保存。
            const fileData = {
                version: shaderData.version || 1,
                shader: {
                    name: shaderData.name,
                    vertexSource: shaderData.vertex,
                    fragmentSource: shaderData.fragment
                }
            };
            const content = JSON.stringify(fileData, null, 2);
            await fileSystem.writeFile(filePath, content);
            setDirty(false);

            // Notify.
            const messageHub = Core.services.tryResolve(MessageHub);
            if (messageHub) {
                messageHub.publish('shader:saved', { filePath });
            }
        } catch (error) {
            console.error('[ShaderEditorPanel] Failed to save shader:', error);
        }
    };

    const handleCompile = async () => {
        if (!shaderData) return;

        setCompileError(null);
        setCompileSuccess(false);

        try {
            const materialManager = getMaterialManager();
            if (!materialManager) {
                setCompileError('MaterialManager not available');
                return;
            }

            // Create a temporary shader to test compilation.
            // 创建临时着色器测试编译。
            const testShader = new Shader(
                `test_${Date.now()}`,
                shaderData.vertex,
                shaderData.fragment
            );

            // Try to register (which compiles).
            // 尝试注册（会进行编译）。
            const shaderId = await materialManager.registerShader(testShader);

            if (shaderId > 0) {
                setCompileSuccess(true);
                // Remove test shader.
                materialManager.removeShader(shaderId);
            } else {
                setCompileError('Compilation failed');
            }
        } catch (error: any) {
            setCompileError(error.message || 'Compilation failed');
        }
    };

    const handleSourceChange = (type: 'vertex' | 'fragment', value: string) => {
        if (!shaderData) return;

        setShaderData({
            ...shaderData,
            [type]: value
        });
        setDirty(true);
        setCompileSuccess(false);
    };

    const currentAnalysis = activeTab === 'vertex' ? vertexAnalysis : fragmentAnalysis;

    if (!shaderData) {
        return (
            <div className="shader-editor-panel shader-editor-empty">
                <FileCode size={48} />
                <p>No shader loaded</p>
                <p className="shader-editor-hint">Open a .shader file to edit</p>
            </div>
        );
    }

    return (
        <div className="shader-editor-panel">
            {/* Header */}
            <div className="shader-editor-header">
                <div className="shader-editor-title">
                    <FileCode size={16} />
                    <span>{shaderData.name}</span>
                    {isDirty && <span className="shader-editor-dirty">*</span>}
                </div>
                <div className="shader-editor-actions">
                    <button
                        className="shader-editor-btn"
                        onClick={handleCompile}
                        title="Compile shader"
                    >
                        <Play size={14} />
                        Compile
                    </button>
                    <button
                        className="shader-editor-btn"
                        onClick={handleSave}
                        disabled={!isDirty}
                        title="Save shader"
                    >
                        <Save size={14} />
                        Save
                    </button>
                </div>
            </div>

            {/* Compile status */}
            {compileError && (
                <div className="shader-editor-status error">
                    <AlertTriangle size={14} />
                    <span>{compileError}</span>
                </div>
            )}
            {compileSuccess && (
                <div className="shader-editor-status success">
                    <CheckCircle size={14} />
                    <span>Compilation successful!</span>
                </div>
            )}

            {/* Main content */}
            <div className="shader-editor-content">
                {/* Code editor */}
                <div className="shader-editor-code-section">
                    {/* Tabs */}
                    <div className="shader-editor-tabs">
                        <button
                            className={`shader-editor-tab ${activeTab === 'vertex' ? 'active' : ''}`}
                            onClick={() => setActiveTab('vertex')}
                        >
                            <Code size={12} />
                            Vertex
                        </button>
                        <button
                            className={`shader-editor-tab ${activeTab === 'fragment' ? 'active' : ''}`}
                            onClick={() => setActiveTab('fragment')}
                        >
                            <Code size={12} />
                            Fragment
                        </button>
                    </div>

                    {/* Editor */}
                    <div className="shader-editor-textarea-wrapper">
                        <textarea
                            ref={textareaRef}
                            className="shader-editor-textarea"
                            value={activeTab === 'vertex' ? shaderData.vertex : shaderData.fragment}
                            onChange={e => handleSourceChange(activeTab, e.target.value)}
                            spellCheck={false}
                            placeholder={`Enter ${activeTab} shader code...`}
                        />
                        <div className="shader-editor-line-numbers">
                            {(activeTab === 'vertex' ? shaderData.vertex : shaderData.fragment)
                                .split('\n')
                                .map((_, i) => (
                                    <span key={i}>{i + 1}</span>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Analysis panel */}
                <div className="shader-editor-analysis-section">
                    {/* Analysis header */}
                    <div
                        className="shader-editor-section-header"
                        onClick={() => setShowAnalysis(!showAnalysis)}
                    >
                        {showAnalysis ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <BarChart3 size={14} />
                        <span>Analysis</span>
                    </div>

                    {showAnalysis && currentAnalysis && (
                        <div className="shader-editor-analysis-content">
                            {/* Complexity */}
                            <div className="analysis-section">
                                <div className="analysis-section-title">Complexity</div>
                                <div className={`complexity-badge ${currentAnalysis.complexity.level}`}>
                                    {currentAnalysis.complexity.level.toUpperCase()}
                                </div>
                                <div className="analysis-metrics">
                                    <div className="metric">
                                        <span className="metric-label">Instructions</span>
                                        <span className="metric-value">~{currentAnalysis.complexity.instructionCount}</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">Texture Samples</span>
                                        <span className="metric-value">{currentAnalysis.complexity.textureSamples}</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">Branches</span>
                                        <span className="metric-value">{currentAnalysis.complexity.branches}</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">Loops</span>
                                        <span className="metric-value">{currentAnalysis.complexity.loops}</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">Math Ops</span>
                                        <span className="metric-value">{currentAnalysis.complexity.mathOps}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Uniforms */}
                            {currentAnalysis.uniforms.length > 0 && (
                                <div className="analysis-section">
                                    <div className="analysis-section-title">
                                        Uniforms ({currentAnalysis.uniforms.length})
                                    </div>
                                    <div className="analysis-list">
                                        {currentAnalysis.uniforms.map((u, i) => (
                                            <div key={i} className="analysis-item">
                                                <span className="item-type">{u.type}</span>
                                                <span className="item-name">{u.name}</span>
                                                {u.arraySize && <span className="item-array">[{u.arraySize}]</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Attributes (vertex only) */}
                            {activeTab === 'vertex' && currentAnalysis.attributes.length > 0 && (
                                <div className="analysis-section">
                                    <div className="analysis-section-title">
                                        Attributes ({currentAnalysis.attributes.length})
                                    </div>
                                    <div className="analysis-list">
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
                                </div>
                            )}

                            {/* Varyings */}
                            {currentAnalysis.varyings.length > 0 && (
                                <div className="analysis-section">
                                    <div className="analysis-section-title">
                                        Varyings ({currentAnalysis.varyings.length})
                                    </div>
                                    <div className="analysis-list">
                                        {currentAnalysis.varyings.map((v, i) => (
                                            <div key={i} className="analysis-item">
                                                <span className={`item-qualifier ${v.qualifier}`}>{v.qualifier}</span>
                                                <span className="item-type">{v.type}</span>
                                                <span className="item-name">{v.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tips */}
                            {currentAnalysis.complexity.tips.length > 0 && (
                                <div className="analysis-section">
                                    <div className="analysis-section-title">Performance Tips</div>
                                    <div className="analysis-tips">
                                        {currentAnalysis.complexity.tips.map((tip, i) => (
                                            <div key={i} className="analysis-tip">
                                                <AlertTriangle size={12} />
                                                <span>{tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Warnings */}
                            {currentAnalysis.warnings.length > 0 && (
                                <div className="analysis-section">
                                    <div className="analysis-section-title">Warnings</div>
                                    <div className="analysis-warnings">
                                        {currentAnalysis.warnings.map((warning, i) => (
                                            <div key={i} className="analysis-warning">
                                                <AlertTriangle size={12} />
                                                <span>{warning}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Info */}
                            <div className="analysis-section">
                                <div className="analysis-section-title">Info</div>
                                <div className="analysis-info">
                                    <div className="info-item">
                                        <span className="info-label">GLSL Version</span>
                                        <span className="info-value">{currentAnalysis.version}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Precision</span>
                                        <span className="info-value">{currentAnalysis.precision}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
