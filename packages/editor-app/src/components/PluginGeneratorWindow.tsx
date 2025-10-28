import { useState } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { TauriAPI } from '../api/tauri';
import '../styles/PluginGeneratorWindow.css';

interface PluginGeneratorWindowProps {
    onClose: () => void;
    projectPath: string | null;
    locale: string;
}

export function PluginGeneratorWindow({ onClose, projectPath, locale }: PluginGeneratorWindowProps) {
    const [pluginName, setPluginName] = useState('');
    const [pluginVersion, setPluginVersion] = useState('1.0.0');
    const [outputPath, setOutputPath] = useState(projectPath ? `${projectPath}/plugins` : '');
    const [includeExample, setIncludeExample] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                title: '创建插件',
                pluginName: '插件名称',
                pluginNamePlaceholder: '例如: my-game-plugin',
                pluginVersion: '插件版本',
                outputPath: '输出路径',
                selectPath: '选择路径',
                includeExample: '包含示例节点',
                generate: '生成插件',
                cancel: '取消',
                generating: '正在生成...',
                success: '插件创建成功！',
                errorEmpty: '请输入插件名称',
                errorInvalidName: '插件名称只能包含字母、数字、连字符和下划线',
                errorNoPath: '请选择输出路径'
            },
            en: {
                title: 'Create Plugin',
                pluginName: 'Plugin Name',
                pluginNamePlaceholder: 'e.g: my-game-plugin',
                pluginVersion: 'Plugin Version',
                outputPath: 'Output Path',
                selectPath: 'Select Path',
                includeExample: 'Include Example Node',
                generate: 'Generate Plugin',
                cancel: 'Cancel',
                generating: 'Generating...',
                success: 'Plugin created successfully!',
                errorEmpty: 'Please enter plugin name',
                errorInvalidName: 'Plugin name can only contain letters, numbers, hyphens and underscores',
                errorNoPath: 'Please select output path'
            }
        };
        return translations[locale]?.[key] || translations.en?.[key] || key;
    };

    const handleSelectPath = async () => {
        try {
            const selected = await TauriAPI.openProjectDialog();
            if (selected) {
                setOutputPath(selected);
            }
        } catch (error) {
            console.error('Failed to select path:', error);
        }
    };

    const validatePluginName = (name: string): boolean => {
        if (!name) {
            setError(t('errorEmpty'));
            return false;
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
            setError(t('errorInvalidName'));
            return false;
        }
        return true;
    };

    const handleGenerate = async () => {
        setError(null);

        if (!validatePluginName(pluginName)) {
            return;
        }

        if (!outputPath) {
            setError(t('errorNoPath'));
            return;
        }

        setIsGenerating(true);

        try {
            const response = await fetch('/@plugin-generator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pluginName,
                    pluginVersion,
                    outputPath,
                    includeExample
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate plugin');
            }

            alert(t('success'));
            onClose();
        } catch (error) {
            console.error('Failed to generate plugin:', error);
            setError(error instanceof Error ? error.message : String(error));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content plugin-generator-window" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('title')}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>{t('pluginName')}</label>
                        <input
                            type="text"
                            value={pluginName}
                            onChange={e => setPluginName(e.target.value)}
                            placeholder={t('pluginNamePlaceholder')}
                            disabled={isGenerating}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('pluginVersion')}</label>
                        <input
                            type="text"
                            value={pluginVersion}
                            onChange={e => setPluginVersion(e.target.value)}
                            disabled={isGenerating}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('outputPath')}</label>
                        <div className="path-input-group">
                            <input
                                type="text"
                                value={outputPath}
                                onChange={e => setOutputPath(e.target.value)}
                                disabled={isGenerating}
                            />
                            <button
                                className="select-path-btn"
                                onClick={handleSelectPath}
                                disabled={isGenerating}
                            >
                                <FolderOpen size={16} />
                                {t('selectPath')}
                            </button>
                        </div>
                    </div>

                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={includeExample}
                                onChange={e => setIncludeExample(e.target.checked)}
                                disabled={isGenerating}
                            />
                            <span>{t('includeExample')}</span>
                        </label>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="btn btn-primary"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? t('generating') : t('generate')}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={isGenerating}
                    >
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
}
