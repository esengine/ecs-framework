import { useState } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { TauriAPI } from '../api/tauri';
import { useLocale } from '../hooks/useLocale';
import '../styles/PluginGeneratorWindow.css';

interface PluginGeneratorWindowProps {
    onClose: () => void;
    projectPath: string | null;
    onSuccess?: () => Promise<void>;
}

export function PluginGeneratorWindow({ onClose, projectPath, onSuccess }: PluginGeneratorWindowProps) {
    const { t } = useLocale();
    const [pluginName, setPluginName] = useState('');
    const [pluginVersion, setPluginVersion] = useState('1.0.0');
    const [outputPath, setOutputPath] = useState(projectPath ? `${projectPath}/plugins` : '');
    const [includeExample, setIncludeExample] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            setError(t('pluginGenerator.errorEmpty'));
            return false;
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
            setError(t('pluginGenerator.errorInvalidName'));
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
            setError(t('pluginGenerator.errorNoPath'));
            return;
        }

        setIsGenerating(true);

        try {
            const response = await fetch('/@plugin-generator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pluginName,
                    pluginVersion,
                    outputPath,
                    includeExample
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate plugin');
            }

            const result = await response.json();

            alert(t('pluginGenerator.success'));

            if (result.path) {
                await TauriAPI.showInFolder(result.path);
            }

            if (onSuccess) {
                await onSuccess();
            }

            onClose();
        } catch (error) {
            console.error('Failed to generate plugin:', error);
            setError(error instanceof Error ? error.message : String(error));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content plugin-generator-window">
                <div className="modal-header">
                    <h2>{t('pluginGenerator.title')}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>{t('pluginGenerator.pluginName')}</label>
                        <input
                            type="text"
                            value={pluginName}
                            onChange={(e) => setPluginName(e.target.value)}
                            placeholder={t('pluginGenerator.pluginNamePlaceholder')}
                            disabled={isGenerating}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('pluginGenerator.pluginVersion')}</label>
                        <input
                            type="text"
                            value={pluginVersion}
                            onChange={(e) => setPluginVersion(e.target.value)}
                            disabled={isGenerating}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('pluginGenerator.outputPath')}</label>
                        <div className="path-input-group">
                            <input
                                type="text"
                                value={outputPath}
                                onChange={(e) => setOutputPath(e.target.value)}
                                disabled={isGenerating}
                            />
                            <button
                                className="select-path-btn"
                                onClick={handleSelectPath}
                                disabled={isGenerating}
                            >
                                <FolderOpen size={16} />
                                {t('pluginGenerator.selectPath')}
                            </button>
                        </div>
                    </div>

                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={includeExample}
                                onChange={(e) => setIncludeExample(e.target.checked)}
                                disabled={isGenerating}
                            />
                            <span>{t('pluginGenerator.includeExample')}</span>
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
                        {isGenerating ? t('pluginGenerator.generating') : t('pluginGenerator.generate')}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={isGenerating}
                    >
                        {t('pluginGenerator.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
}
