import { useState } from 'react';
import { X, FolderOpen, Loader, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import type { GitHubService, PublishedPlugin } from '../services/GitHubService';
import { PluginPublishService, type PublishProgress } from '../services/PluginPublishService';
import { PluginBuildService, type BuildProgress } from '../services/PluginBuildService';
import { open } from '@tauri-apps/plugin-shell';
import { EditorPluginCategory } from '@esengine/editor-core';
import type { IEditorPluginMetadata } from '@esengine/editor-core';
import '../styles/PluginUpdateDialog.css';

interface PluginUpdateDialogProps {
    plugin: PublishedPlugin;
    githubService: GitHubService;
    onClose: () => void;
    onSuccess: () => void;
    locale: string;
}

type Step = 'selectFolder' | 'info' | 'building' | 'publishing' | 'success' | 'error';

function calculateNextVersion(currentVersion: string): string {
    const parts = currentVersion.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return currentVersion;

    const [major, minor, patch] = parts;
    return `${major}.${minor}.${(patch ?? 0) + 1}`;
}

export function PluginUpdateDialog({ plugin, githubService, onClose, onSuccess, locale }: PluginUpdateDialogProps) {
    const [publishService] = useState(() => new PluginPublishService(githubService));
    const [buildService] = useState(() => new PluginBuildService());

    const [step, setStep] = useState<Step>('selectFolder');
    const [pluginFolder, setPluginFolder] = useState('');
    const [version, setVersion] = useState('');
    const [releaseNotes, setReleaseNotes] = useState('');
    const [suggestedVersion] = useState(() => calculateNextVersion(plugin.version));
    const [error, setError] = useState('');
    const [buildLog, setBuildLog] = useState<string[]>([]);
    const [buildProgress, setBuildProgress] = useState<BuildProgress | null>(null);
    const [publishProgress, setPublishProgress] = useState<PublishProgress | null>(null);
    const [prUrl, setPrUrl] = useState('');

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                title: '更新插件',
                currentVersion: '当前版本',
                newVersion: '新版本号',
                useSuggested: '使用建议版本',
                releaseNotes: '更新说明',
                releaseNotesPlaceholder: '描述这个版本的变更...',
                selectFolder: '选择插件文件夹',
                selectFolderDesc: '选择包含更新后插件源代码的文件夹',
                browseFolder: '浏览文件夹',
                selectedFolder: '已选择文件夹',
                next: '下一步',
                back: '上一步',
                buildAndPublish: '构建并发布',
                building: '构建中...',
                publishing: '发布中...',
                success: '更新成功！',
                error: '更新失败',
                viewPR: '查看 PR',
                close: '关闭',
                buildError: '构建失败',
                publishError: '发布失败',
                buildingStep1: '正在安装依赖...',
                buildingStep2: '正在构建项目...',
                buildingStep3: '正在打包 ZIP...',
                publishingStep1: '正在 Fork 仓库...',
                publishingStep2: '正在创建分支...',
                publishingStep3: '正在上传文件...',
                publishingStep4: '正在创建 Pull Request...',
                reviewMessage: '你的插件更新已创建 PR，维护者将进行审核。审核通过后，新版本将自动发布到市场。'
            },
            en: {
                title: 'Update Plugin',
                currentVersion: 'Current Version',
                newVersion: 'New Version',
                useSuggested: 'Use Suggested',
                releaseNotes: 'Release Notes',
                releaseNotesPlaceholder: 'Describe the changes in this version...',
                selectFolder: 'Select Plugin Folder',
                selectFolderDesc: 'Select the folder containing your updated plugin source code',
                browseFolder: 'Browse Folder',
                selectedFolder: 'Selected Folder',
                next: 'Next',
                back: 'Back',
                buildAndPublish: 'Build & Publish',
                building: 'Building...',
                publishing: 'Publishing...',
                success: 'Update Successful!',
                error: 'Update Failed',
                viewPR: 'View PR',
                close: 'Close',
                buildError: 'Build Failed',
                publishError: 'Publish Failed',
                buildingStep1: 'Installing dependencies...',
                buildingStep2: 'Building project...',
                buildingStep3: 'Packaging ZIP...',
                publishingStep1: 'Forking repository...',
                publishingStep2: 'Creating branch...',
                publishingStep3: 'Uploading files...',
                publishingStep4: 'Creating Pull Request...',
                reviewMessage: 'Your plugin update has been created as a PR. Maintainers will review it. Once approved, the new version will be published to the marketplace.'
            }
        };
        return translations[locale]?.[key] || translations.en?.[key] || key;
    };

    const handleSelectFolder = async () => {
        try {
            const selected = await openDialog({
                directory: true,
                multiple: false,
                title: t('selectFolder')
            });

            if (!selected) return;

            setPluginFolder(selected as string);
            setStep('info');
        } catch (err) {
            console.error('[PluginUpdateDialog] Failed to select folder:', err);
            setError(err instanceof Error ? err.message : 'Failed to select folder');
        }
    };

    const handleBuildAndPublish = async () => {
        if (!version || !releaseNotes) {
            alert('Please fill in all required fields');
            return;
        }

        setStep('building');
        setBuildLog([]);
        setError('');

        try {
            buildService.setProgressCallback((progress) => {
                setBuildProgress(progress);
                if (progress.output) {
                    setBuildLog((prev) => [...prev, progress.output!]);
                }
            });

            const zipPath = await buildService.buildPlugin(pluginFolder);
            console.log('[PluginUpdateDialog] Build completed:', zipPath);

            setStep('publishing');
            publishService.setProgressCallback((progress) => {
                setPublishProgress(progress);
            });

            const { readTextFile } = await import('@tauri-apps/plugin-fs');
            const packageJsonPath = `${pluginFolder}/package.json`;
            const packageJsonContent = await readTextFile(packageJsonPath);
            const pkgJson = JSON.parse(packageJsonContent);

            const pluginMetadata: IEditorPluginMetadata = {
                name: pkgJson.name,
                displayName: pkgJson.description || pkgJson.name,
                description: pkgJson.description || '',
                version: pkgJson.version,
                category: EditorPluginCategory.Tool,
                icon: 'Package',
                enabled: true,
                installedAt: Date.now()
            };

            const publishInfo = {
                pluginMetadata,
                version,
                releaseNotes,
                category: plugin.category_type as 'official' | 'community',
                repositoryUrl: plugin.repositoryUrl || '',
                tags: []
            };

            const prUrl = await publishService.publishPluginWithZip(publishInfo, zipPath);

            console.log('[PluginUpdateDialog] Update published:', prUrl);
            setPrUrl(prUrl);
            setStep('success');
            onSuccess();
        } catch (err) {
            console.error('[PluginUpdateDialog] Failed to update plugin:', err);
            setError(err instanceof Error ? err.message : 'Update failed');
            setStep('error');
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 'selectFolder':
                return (
                    <div className="update-dialog-step">
                        <h3>{t('selectFolder')}</h3>
                        <p className="step-description">{t('selectFolderDesc')}</p>
                        <button className="btn-browse" onClick={handleSelectFolder}>
                            <FolderOpen size={16} />
                            {t('browseFolder')}
                        </button>
                    </div>
                );

            case 'info':
                return (
                    <div className="update-dialog-step">
                        <div className="current-plugin-info">
                            <h4>{plugin.name}</h4>
                            <p>
                                {t('currentVersion')}: <strong>v{plugin.version}</strong>
                            </p>
                        </div>

                        {pluginFolder && (
                            <div className="selected-folder-info">
                                <FolderOpen size={16} />
                                <span>{pluginFolder}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label>{t('newVersion')} *</label>
                            <div className="version-input-group">
                                <input
                                    type="text"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder={suggestedVersion}
                                />
                                <button
                                    type="button"
                                    className="btn-suggest"
                                    onClick={() => setVersion(suggestedVersion)}
                                >
                                    {t('useSuggested')} ({suggestedVersion})
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t('releaseNotes')} *</label>
                            <textarea
                                rows={6}
                                value={releaseNotes}
                                onChange={(e) => setReleaseNotes(e.target.value)}
                                placeholder={t('releaseNotesPlaceholder')}
                            />
                        </div>

                        <div className="update-dialog-actions">
                            <button className="btn-back" onClick={() => setStep('selectFolder')}>
                                {t('back')}
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleBuildAndPublish}
                                disabled={!version || !releaseNotes}
                            >
                                {t('buildAndPublish')}
                            </button>
                        </div>
                    </div>
                );

            case 'building':
                return (
                    <div className="update-dialog-step">
                        <h3>{t('building')}</h3>
                        {buildProgress && (
                            <div className="progress-container">
                                <p className="progress-message">{buildProgress.message}</p>
                            </div>
                        )}
                        {buildLog.length > 0 && (
                            <div className="build-log">
                                {buildLog.map((log, index) => (
                                    <div key={index} className="log-line">
                                        {log}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'publishing':
                return (
                    <div className="update-dialog-step">
                        <h3>{t('publishing')}</h3>
                        {publishProgress && (
                            <div className="progress-container">
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${publishProgress.progress}%` }} />
                                </div>
                                <p className="progress-message">{publishProgress.message}</p>
                            </div>
                        )}
                    </div>
                );

            case 'success':
                return (
                    <div className="update-dialog-step success-step">
                        <CheckCircle size={64} className="success-icon" />
                        <h3>{t('success')}</h3>
                        <p className="success-message">{t('reviewMessage')}</p>
                        {prUrl && (
                            <button className="btn-view-pr" onClick={() => open(prUrl)}>
                                {t('viewPR')}
                            </button>
                        )}
                        <button className="btn-close" onClick={onClose}>
                            {t('close')}
                        </button>
                    </div>
                );

            case 'error':
                return (
                    <div className="update-dialog-step error-step">
                        <AlertCircle size={64} className="error-icon" />
                        <h3>{t('error')}</h3>
                        <p className="error-message">{error}</p>
                        <button className="btn-close" onClick={onClose}>
                            {t('close')}
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="plugin-update-dialog-overlay">
            <div className="plugin-update-dialog">
                <div className="update-dialog-header">
                    <h2>{t('title')}: {plugin.name}</h2>
                    <button className="update-dialog-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="update-dialog-content">{renderStepContent()}</div>
            </div>
        </div>
    );
}
