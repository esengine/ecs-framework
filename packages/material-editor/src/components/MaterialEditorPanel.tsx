/**
 * Material Editor Panel
 * 材质编辑器面板
 */

import React, { useEffect, useCallback, useState } from 'react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub, IFileSystemService } from '@esengine/editor-core';
import { BlendMode, BuiltInShaders } from '@esengine/material-system';
import { useMaterialEditorStore, createDefaultMaterialData } from '../stores/MaterialEditorStore';
import { useMaterialLocale } from '../hooks/useMaterialLocale';
import { Save, RefreshCw, FolderOpen } from 'lucide-react';
import '../styles/MaterialEditorPanel.css';

// 文件系统类型
type IFileSystem = {
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
};

/**
 * 混合模式选项
 * Blend mode options with translation keys
 */
const BLEND_MODE_OPTIONS = [
    { value: BlendMode.None, labelKey: 'blendModes.none' },
    { value: BlendMode.Alpha, labelKey: 'blendModes.alpha' },
    { value: BlendMode.Additive, labelKey: 'blendModes.additive' },
    { value: BlendMode.Multiply, labelKey: 'blendModes.multiply' },
    { value: BlendMode.Screen, labelKey: 'blendModes.screen' },
    { value: BlendMode.PremultipliedAlpha, labelKey: 'blendModes.premultipliedAlpha' },
];

/**
 * 内置着色器选项
 * Built-in shader options with translation keys
 */
const BUILT_IN_SHADER_OPTIONS = [
    { value: BuiltInShaders.DefaultSprite, labelKey: 'shaders.defaultSprite' },
    { value: BuiltInShaders.Grayscale, labelKey: 'shaders.grayscale' },
    { value: BuiltInShaders.Tint, labelKey: 'shaders.tint' },
    { value: BuiltInShaders.Flash, labelKey: 'shaders.flash' },
    { value: BuiltInShaders.Outline, labelKey: 'shaders.outline' },
];

/** Custom shader indicator value. | 自定义着色器指示值。 */
const CUSTOM_SHADER_VALUE = -1;

interface MaterialEditorPanelProps {
    locale?: string;
}

export function MaterialEditorPanel({ locale: _locale }: MaterialEditorPanelProps) {
    const { t } = useMaterialLocale();
    const {
        currentFilePath,
        pendingFilePath,
        materialData,
        isDirty,
        isLoading,
        setPendingFilePath,
        setCurrentFilePath,
        setMaterialData,
        setLoading,
        updateMaterialProperty,
    } = useMaterialEditorStore();

    // 加载材质文件
    const loadMaterialFile = useCallback(async (filePath: string) => {
        setLoading(true);
        try {
            const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
            if (!fileSystem) {
                console.error('[MaterialEditor] FileSystem service not available');
                return;
            }

            const content = await fileSystem.readFile(filePath);
            const data = JSON.parse(content);
            setMaterialData(data);
            setCurrentFilePath(filePath);
        } catch (error) {
            console.error('[MaterialEditor] Failed to load material:', error);
            // 如果加载失败，创建默认材质
            const fileName = filePath.split(/[\\/]/).pop()?.replace(/\.mat$/i, '') || 'New Material';
            setMaterialData(createDefaultMaterialData(fileName));
            setCurrentFilePath(filePath);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setMaterialData, setCurrentFilePath]);

    // 保存材质文件
    const saveMaterialFile = useCallback(async () => {
        if (!currentFilePath || !materialData) return;

        try {
            const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
            if (!fileSystem) {
                console.error('[MaterialEditor] FileSystem service not available');
                return;
            }

            await fileSystem.writeFile(currentFilePath, JSON.stringify(materialData, null, 2));
            useMaterialEditorStore.getState().setDirty(false);

            // 发送保存成功消息
            const messageHub = Core.services.resolve(MessageHub);
            messageHub?.publish('material:saved', { filePath: currentFilePath });
        } catch (error) {
            console.error('[MaterialEditor] Failed to save material:', error);
        }
    }, [currentFilePath, materialData]);

    // 处理 pendingFilePath
    useEffect(() => {
        if (pendingFilePath) {
            loadMaterialFile(pendingFilePath);
            setPendingFilePath(null);
        }
    }, [pendingFilePath, loadMaterialFile, setPendingFilePath]);

    // 监听键盘快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveMaterialFile();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveMaterialFile]);

    // 渲染加载状态
    if (isLoading) {
        return (
            <div className="material-editor-panel loading">
                <RefreshCw className="spin" size={24} />
                <span>{t('panel.loading')}</span>
            </div>
        );
    }

    // 渲染空状态
    if (!materialData) {
        return (
            <div className="material-editor-panel empty">
                <span>{t('panel.emptyState')}</span>
            </div>
        );
    }

    return (
        <div className="material-editor-panel">
            {/* 工具栏 */}
            <div className="material-editor-toolbar">
                <div className="toolbar-left">
                    <span className="material-name">{materialData.name}</span>
                    {isDirty && <span className="dirty-indicator">*</span>}
                </div>
                <div className="toolbar-right">
                    <button
                        className="toolbar-button"
                        onClick={saveMaterialFile}
                        disabled={!isDirty}
                        title={t('panel.saveTooltip')}
                    >
                        <Save size={16} />
                        <span>{t('panel.save')}</span>
                    </button>
                </div>
            </div>

            {/* 属性编辑区 */}
            <div className="material-editor-content">
                {/* 基本属性 */}
                <div className="property-section">
                    <div className="section-header">{t('properties.basicTitle')}</div>

                    <div className="property-row">
                        <label>{t('properties.name')}</label>
                        <input
                            type="text"
                            value={materialData.name}
                            onChange={(e) => updateMaterialProperty('name', e.target.value)}
                        />
                    </div>

                    <div className="property-row">
                        <label>{t('properties.shader')}</label>
                        <div className="shader-selector">
                            <select
                                value={typeof materialData.shader === 'string' ? CUSTOM_SHADER_VALUE : materialData.shader}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    if (value === CUSTOM_SHADER_VALUE) {
                                        // Keep current custom shader path if already set
                                        if (typeof materialData.shader !== 'string') {
                                            updateMaterialProperty('shader', '');
                                        }
                                    } else {
                                        updateMaterialProperty('shader', value);
                                    }
                                }}
                            >
                                {BUILT_IN_SHADER_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {t(opt.labelKey)}
                                    </option>
                                ))}
                                <option value={CUSTOM_SHADER_VALUE}>
                                    {t('properties.customShader')}
                                </option>
                            </select>
                        </div>
                    </div>

                    {/* Custom shader path input */}
                    {typeof materialData.shader === 'string' && (
                        <div className="property-row">
                            <label>{t('properties.shaderPath')}</label>
                            <div className="file-input-row">
                                <input
                                    type="text"
                                    value={materialData.shader}
                                    onChange={(e) => updateMaterialProperty('shader', e.target.value)}
                                    placeholder={t('properties.shaderPathPlaceholder')}
                                />
                                <button
                                    className="browse-button"
                                    onClick={async () => {
                                        // TODO: Implement file browser dialog
                                        // 这里可以集成编辑器的文件选择对话框
                                    }}
                                    title={t('properties.browse')}
                                >
                                    <FolderOpen size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="property-row">
                        <label>{t('properties.blendMode')}</label>
                        <select
                            value={materialData.blendMode}
                            onChange={(e) => updateMaterialProperty('blendMode', Number(e.target.value))}
                        >
                            {BLEND_MODE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {t(opt.labelKey)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Uniform 参数 */}
                <div className="property-section">
                    <div className="section-header">{t('uniforms.title')}</div>

                    {Object.keys(materialData.uniforms || {}).length === 0 ? (
                        <div className="empty-uniforms">
                            {t('uniforms.empty')}
                        </div>
                    ) : (
                        Object.entries(materialData.uniforms || {}).map(([key, uniform]) => (
                            <div key={key} className="property-row">
                                <label>{key}</label>
                                <span className="uniform-type">{uniform.type}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* 文件信息 */}
                <div className="property-section">
                    <div className="section-header">{t('fileInfo.title')}</div>
                    <div className="property-row file-path">
                        <label>{t('fileInfo.path')}</label>
                        <span title={currentFilePath || ''}>
                            {currentFilePath?.split(/[\\/]/).pop() || '-'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MaterialEditorPanel;
