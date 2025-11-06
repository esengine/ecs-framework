import { useState } from 'react';
import { X, AlertCircle, CheckCircle, Loader, ExternalLink, FolderOpen } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { GitHubService } from '../services/GitHubService';
import { GitHubAuth } from './GitHubAuth';
import { PluginPublishService, type PluginPublishInfo, type PublishProgress } from '../services/PluginPublishService';
import { PluginBuildService, type BuildProgress } from '../services/PluginBuildService';
import { open } from '@tauri-apps/plugin-shell';
import { EditorPluginCategory, type IEditorPluginMetadata } from '@esengine/editor-core';
import '../styles/PluginPublishWizard.css';

interface PluginPublishWizardProps {
    githubService: GitHubService;
    onClose: () => void;
    locale: string;
    inline?: boolean; // 是否内联显示（在 tab 中）而不是弹窗
}

type Step = 'auth' | 'selectFolder' | 'info' | 'building' | 'confirm' | 'publishing' | 'success' | 'error';

interface PluginPackageJson {
    name: string;
    version: string;
    description?: string;
    author?: string | { name: string };
    repository?: string | { url: string };
    license?: string;
}

export function PluginPublishWizard({ githubService, onClose, locale, inline = false }: PluginPublishWizardProps) {
    const [publishService] = useState(() => new PluginPublishService(githubService));
    const [buildService] = useState(() => new PluginBuildService());

    const [step, setStep] = useState<Step>(githubService.isAuthenticated() ? 'selectFolder' : 'auth');
    const [pluginFolder, setPluginFolder] = useState('');
    const [packageJson, setPackageJson] = useState<PluginPackageJson | null>(null);
    const [publishInfo, setPublishInfo] = useState<Partial<PluginPublishInfo>>({
        category: 'community',
        tags: []
    });
    const [prUrl, setPrUrl] = useState('');
    const [error, setError] = useState('');
    const [buildLog, setBuildLog] = useState<string[]>([]);
    const [buildProgress, setBuildProgress] = useState<BuildProgress | null>(null);
    const [publishProgress, setPublishProgress] = useState<PublishProgress | null>(null);
    const [builtZipPath, setBuiltZipPath] = useState<string>('');
    const [existingPR, setExistingPR] = useState<{ number: number; url: string } | null>(null);

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                title: '发布插件到市场',
                stepAuth: '步骤 1: GitHub 登录',
                stepSelectFolder: '步骤 2: 选择插件文件夹',
                stepInfo: '步骤 3: 插件信息',
                stepBuilding: '步骤 4: 构建打包',
                stepConfirm: '步骤 5: 确认发布',
                githubLogin: 'GitHub 登录',
                oauthLogin: 'OAuth 登录（推荐）',
                tokenLogin: 'Token 登录',
                oauthInstructions: '点击下方按钮开始授权：',
                oauthStep1: '1. 点击"开始授权"按钮',
                oauthStep2: '2. 在浏览器中打开 GitHub 授权页面',
                oauthStep3: '3. 输入下方显示的代码并授权',
                oauthStep4: '4. 授权完成后会自动跳转',
                startAuth: '开始授权',
                authorizing: '等待授权中...',
                authorized: '授权成功！',
                authFailed: '授权失败',
                userCode: '授权码',
                copyCode: '复制代码',
                openBrowser: '打开浏览器',
                tokenLabel: 'GitHub Personal Access Token',
                tokenPlaceholder: '粘贴你的 GitHub Token',
                tokenHint: '需要 repo 和 workflow 权限',
                createToken: '创建 Token',
                login: '登录',
                switchToToken: '使用 Token 登录',
                switchToOAuth: '使用 OAuth 登录',
                selectFolder: '选择插件文件夹',
                selectFolderDesc: '选择包含你的插件源代码的文件夹（需要有 package.json）',
                browseFolder: '浏览文件夹',
                selectedFolder: '已选择文件夹',
                pluginInfo: '插件信息',
                version: '版本号',
                category: '分类',
                official: '官方',
                community: '社区',
                repositoryUrl: '仓库地址',
                repositoryPlaceholder: 'https://github.com/username/repo',
                releaseNotes: '更新说明',
                releaseNotesPlaceholder: '描述这个版本的变更...',
                tags: '标签（逗号分隔）',
                tagsPlaceholder: 'ui, tool, editor',
                homepage: '主页 URL（可选）',
                next: '下一步',
                back: '上一步',
                build: '构建并打包',
                building: '构建中...',
                confirm: '确认发布',
                publishing: '发布中...',
                publishSuccess: '发布成功！',
                publishError: '发布失败',
                buildError: '构建失败',
                prCreated: 'Pull Request 已创建',
                viewPR: '查看 PR',
                close: '关闭',
                buildingStep1: '正在安装依赖...',
                buildingStep2: '正在构建项目...',
                buildingStep3: '正在打包 ZIP...',
                publishingStep1: '正在 Fork 仓库...',
                publishingStep2: '正在创建分支...',
                publishingStep3: '正在上传文件...',
                publishingStep4: '正在创建 Pull Request...',
                confirmMessage: '确认要发布以下插件？',
                reviewMessage: '你的插件提交已创建 PR，维护者将进行审核。审核通过后，插件将自动发布到市场。',
                existingPRDetected: '检测到现有 PR',
                existingPRMessage: '该插件已有待审核的 PR #{{number}}。点击"确认"将更新现有 PR（不会创建新的 PR）。',
                viewExistingPR: '查看现有 PR'
            },
            en: {
                title: 'Publish Plugin to Marketplace',
                stepAuth: 'Step 1: GitHub Authentication',
                stepSelectFolder: 'Step 2: Select Plugin Folder',
                stepInfo: 'Step 3: Plugin Information',
                stepBuilding: 'Step 4: Build & Package',
                stepConfirm: 'Step 5: Confirm Publication',
                githubLogin: 'GitHub Login',
                oauthLogin: 'OAuth Login (Recommended)',
                tokenLogin: 'Token Login',
                oauthInstructions: 'Click the button below to start authorization:',
                oauthStep1: '1. Click "Start Authorization"',
                oauthStep2: '2. Open GitHub authorization page in browser',
                oauthStep3: '3. Enter the code shown below and authorize',
                oauthStep4: '4. Authorization will complete automatically',
                startAuth: 'Start Authorization',
                authorizing: 'Waiting for authorization...',
                authorized: 'Authorized!',
                authFailed: 'Authorization failed',
                userCode: 'Authorization Code',
                copyCode: 'Copy Code',
                openBrowser: 'Open Browser',
                tokenLabel: 'GitHub Personal Access Token',
                tokenPlaceholder: 'Paste your GitHub Token',
                tokenHint: 'Requires repo and workflow permissions',
                createToken: 'Create Token',
                login: 'Login',
                switchToToken: 'Use Token Login',
                switchToOAuth: 'Use OAuth Login',
                selectFolder: 'Select Plugin Folder',
                selectFolderDesc: 'Select the folder containing your plugin source code (must have package.json)',
                browseFolder: 'Browse Folder',
                selectedFolder: 'Selected Folder',
                pluginInfo: 'Plugin Information',
                version: 'Version',
                category: 'Category',
                official: 'Official',
                community: 'Community',
                repositoryUrl: 'Repository URL',
                repositoryPlaceholder: 'https://github.com/username/repo',
                releaseNotes: 'Release Notes',
                releaseNotesPlaceholder: 'Describe the changes in this version...',
                tags: 'Tags (comma separated)',
                tagsPlaceholder: 'ui, tool, editor',
                homepage: 'Homepage URL (optional)',
                next: 'Next',
                back: 'Back',
                build: 'Build & Package',
                building: 'Building...',
                confirm: 'Confirm & Publish',
                publishing: 'Publishing...',
                publishSuccess: 'Published Successfully!',
                publishError: 'Publication Failed',
                buildError: 'Build Failed',
                prCreated: 'Pull Request Created',
                viewPR: 'View PR',
                close: 'Close',
                buildingStep1: 'Installing dependencies...',
                buildingStep2: 'Building project...',
                buildingStep3: 'Packaging ZIP...',
                publishingStep1: 'Forking repository...',
                publishingStep2: 'Creating branch...',
                publishingStep3: 'Uploading files...',
                publishingStep4: 'Creating Pull Request...',
                confirmMessage: 'Confirm publishing this plugin?',
                reviewMessage:
                    'Your plugin submission has been created as a PR. Maintainers will review it. Once approved, the plugin will be published to the marketplace.',
                existingPRDetected: 'Existing PR Detected',
                existingPRMessage: 'This plugin already has a pending PR #{{number}}. Clicking "Confirm" will update the existing PR (no new PR will be created).',
                viewExistingPR: 'View Existing PR'
            }
        };
        return translations[locale]?.[key] || translations.en?.[key] || key;
    };

    const handleAuthSuccess = () => {
        setStep('selectFolder');
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

            // 读取 package.json
            try {
                const { readTextFile } = await import('@tauri-apps/plugin-fs');
                const packageJsonPath = `${selected}/package.json`;
                const packageJsonContent = await readTextFile(packageJsonPath);
                const pkgJson = JSON.parse(packageJsonContent) as PluginPackageJson;

                console.log('[PluginPublishWizard] Package.json loaded:', pkgJson);

                setPackageJson(pkgJson);

                // 自动填充一些字段
                setPublishInfo((prev) => ({
                    ...prev,
                    version: pkgJson.version
                }));

                // 检测是否已有待审核的 PR
                try {
                    const user = githubService.getUser();
                    if (user) {
                        const branchName = `add-plugin-${pkgJson.name}-v${pkgJson.version}`;
                        const headBranch = `${user.login}:${branchName}`;
                        const pr = await githubService.findPullRequestByBranch('esengine', 'ecs-editor-plugins', headBranch);
                        if (pr) {
                            setExistingPR({ number: pr.number, url: pr.html_url });
                        } else {
                            setExistingPR(null);
                        }
                    }
                } catch (err) {
                    console.log('[PluginPublishWizard] Failed to check existing PR:', err);
                    setExistingPR(null);
                }

                setStep('info');
                setError('');
            } catch (err) {
                console.error('[PluginPublishWizard] Failed to read package.json:', err);
                setError('Failed to read package.json. Please ensure the selected folder contains a valid package.json file.');
            }
        } catch {
            setError('Failed to select folder');
        }
    };

    const handleNext = () => {
        if (!publishInfo.version || !publishInfo.repositoryUrl || !publishInfo.releaseNotes) {
            setError('Please fill in all required fields');
            return;
        }

        setStep('building');
        handleBuild();
    };

    const handleBuild = async () => {
        setBuildLog([]);
        setBuildProgress(null);
        setError('');

        buildService.setProgressCallback((progress) => {
            console.log('[PluginPublishWizard] Build progress:', progress);
            setBuildProgress(progress);

            if (progress.step === 'install') {
                setBuildLog((prev) => {
                    if (prev[prev.length - 1] !== t('buildingStep1')) {
                        return [...prev, t('buildingStep1')];
                    }
                    return prev;
                });
            } else if (progress.step === 'build') {
                setBuildLog((prev) => {
                    if (prev[prev.length - 1] !== t('buildingStep2')) {
                        return [...prev, t('buildingStep2')];
                    }
                    return prev;
                });
            } else if (progress.step === 'package') {
                setBuildLog((prev) => {
                    if (prev[prev.length - 1] !== t('buildingStep3')) {
                        return [...prev, t('buildingStep3')];
                    }
                    return prev;
                });
            } else if (progress.step === 'complete') {
                setBuildLog((prev) => [...prev, t('buildComplete')]);
            }

            if (progress.output) {
                console.log('[Build output]', progress.output);
            }
        });

        try {
            const zipPath = await buildService.buildPlugin(pluginFolder);
            console.log('[PluginPublishWizard] Build completed, ZIP at:', zipPath);
            setBuiltZipPath(zipPath);
            setStep('confirm');
        } catch (err) {
            console.error('[PluginPublishWizard] Build failed:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            setStep('error');
        }
    };

    const handlePublish = async () => {
        setStep('publishing');
        setError('');
        setPublishProgress(null);

        // 设置进度回调
        publishService.setProgressCallback((progress) => {
            setPublishProgress(progress);
        });

        try {
            // 验证必填字段
            if (!publishInfo.version || !publishInfo.repositoryUrl || !publishInfo.releaseNotes) {
                throw new Error('Missing required fields');
            }

            // 从 packageJson 构造 pluginMetadata
            if (!packageJson) {
                throw new Error('Plugin package.json not found');
            }

            const pluginMetadata: IEditorPluginMetadata = {
                name: packageJson.name,
                displayName: packageJson.description || packageJson.name,
                description: packageJson.description || '',
                version: packageJson.version,
                category: EditorPluginCategory.Tool,
                icon: 'Package',
                enabled: true,
                installedAt: Date.now()
            };

            const fullPublishInfo: PluginPublishInfo = {
                pluginMetadata,
                version: publishInfo.version || packageJson.version,
                releaseNotes: publishInfo.releaseNotes || '',
                repositoryUrl: publishInfo.repositoryUrl || '',
                category: publishInfo.category || 'community',
                tags: publishInfo.tags,
                homepage: publishInfo.homepage,
                screenshots: publishInfo.screenshots
            };

            console.log('[PluginPublishWizard] Publishing with info:', fullPublishInfo);
            console.log('[PluginPublishWizard] Built ZIP path:', builtZipPath);

            const prUrl = await publishService.publishPluginWithZip(fullPublishInfo, builtZipPath);
            setPrUrl(prUrl);
            setStep('success');
        } catch (err) {
            console.error('[PluginPublishWizard] Publish failed:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            setStep('error');
        }
    };

    const openPR = async () => {
        if (prUrl) {
            await open(prUrl);
        }
    };

    const wizardContent = (
        <div className={inline ? "plugin-publish-wizard inline" : "plugin-publish-wizard"} onClick={(e) => inline ? undefined : e.stopPropagation()}>
            <div className="plugin-publish-header">
                <h2>{t('title')}</h2>
                {!inline && (
                    <button className="plugin-publish-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="plugin-publish-content">
                    {step === 'auth' && (
                        <div className="publish-step">
                            <h3>{t('stepAuth')}</h3>
                            <GitHubAuth
                                githubService={githubService}
                                onSuccess={handleAuthSuccess}
                                locale={locale}
                            />
                        </div>
                    )}

                    {step === 'selectFolder' && (
                        <div className="publish-step">
                            <h3>{t('stepSelectFolder')}</h3>
                            <p>{t('selectFolderDesc')}</p>

                            {pluginFolder && (
                                <div className="selected-folder">
                                    <FolderOpen size={20} />
                                    <span>{pluginFolder}</span>
                                </div>
                            )}

                            <button className="btn-primary" onClick={handleSelectFolder}>
                                <FolderOpen size={16} />
                                {t('browseFolder')}
                            </button>

                            {error && (
                                <div className="error-message">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {pluginFolder && (
                                <div className="button-group">
                                    <button className="btn-secondary" onClick={() => setStep('auth')}>
                                        {t('back')}
                                    </button>
                                    <button className="btn-primary" onClick={() => setStep('info')}>
                                        {t('next')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'info' && (
                        <div className="publish-step">
                            <h3>{t('stepInfo')}</h3>

                            {existingPR && (
                                <div className="existing-pr-notice">
                                    <AlertCircle size={20} />
                                    <div className="notice-content">
                                        <strong>{t('existingPRDetected')}</strong>
                                        <p>{t('existingPRMessage').replace('{{number}}', String(existingPR.number))}</p>
                                        <button
                                            className="btn-link"
                                            onClick={() => open(existingPR.url)}
                                        >
                                            <ExternalLink size={16} />
                                            {t('viewExistingPR')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>{t('version')} *</label>
                                <input
                                    type="text"
                                    value={publishInfo.version || ''}
                                    onChange={(e) => setPublishInfo({ ...publishInfo, version: e.target.value })}
                                    placeholder="1.0.0"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('category')} *</label>
                                <select
                                    value={publishInfo.category}
                                    onChange={(e) =>
                                        setPublishInfo({ ...publishInfo, category: e.target.value as 'official' | 'community' })
                                    }
                                >
                                    <option value="community">{t('community')}</option>
                                    <option value="official">{t('official')}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t('repositoryUrl')} *</label>
                                <input
                                    type="text"
                                    value={publishInfo.repositoryUrl || ''}
                                    onChange={(e) => setPublishInfo({ ...publishInfo, repositoryUrl: e.target.value })}
                                    placeholder={t('repositoryPlaceholder')}
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('releaseNotes')} *</label>
                                <textarea
                                    rows={4}
                                    value={publishInfo.releaseNotes || ''}
                                    onChange={(e) => setPublishInfo({ ...publishInfo, releaseNotes: e.target.value })}
                                    placeholder={t('releaseNotesPlaceholder')}
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('tags')}</label>
                                <input
                                    type="text"
                                    value={publishInfo.tags?.join(', ') || ''}
                                    onChange={(e) =>
                                        setPublishInfo({
                                            ...publishInfo,
                                            tags: e.target.value
                                                .split(',')
                                                .map((t) => t.trim())
                                                .filter(Boolean)
                                        })
                                    }
                                    placeholder={t('tagsPlaceholder')}
                                />
                            </div>

                            {error && (
                                <div className="error-message">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="button-group">
                                <button className="btn-secondary" onClick={() => setStep('selectFolder')}>
                                    {t('back')}
                                </button>
                                <button className="btn-primary" onClick={handleNext}>
                                    {t('build')}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'building' && (
                        <div className="publish-step publishing">
                            <Loader size={48} className="spinning" />
                            <h3>{t('building')}</h3>
                            <div className="build-log">
                                {buildLog.map((log, i) => (
                                    <div key={i} className="log-line">
                                        <CheckCircle size={16} style={{ color: '#34c759', flexShrink: 0 }} />
                                        <span>{log}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div className="publish-step">
                            <h3>{t('stepConfirm')}</h3>

                            <p>{t('confirmMessage')}</p>

                            {existingPR && (
                                <div className="existing-pr-notice">
                                    <AlertCircle size={20} />
                                    <div className="notice-content">
                                        <strong>{t('existingPRDetected')}</strong>
                                        <p>{t('existingPRMessage').replace('{{number}}', String(existingPR.number))}</p>
                                        <button
                                            className="btn-link"
                                            onClick={() => open(existingPR.url)}
                                        >
                                            <ExternalLink size={16} />
                                            {t('viewExistingPR')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="confirm-details">
                                <div className="detail-row">
                                    <span className="detail-label">{t('selectedFolder')}:</span>
                                    <span className="detail-value">{pluginFolder}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('version')}:</span>
                                    <span className="detail-value">{publishInfo.version}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('category')}:</span>
                                    <span className="detail-value">{t(publishInfo.category!)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('repositoryUrl')}:</span>
                                    <span className="detail-value">{publishInfo.repositoryUrl}</span>
                                </div>
                                {builtZipPath && (
                                    <div className="detail-row">
                                        <span className="detail-label">Built Package:</span>
                                        <span className="detail-value" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                                            {builtZipPath}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="button-group">
                                <button className="btn-secondary" onClick={() => setStep('info')}>
                                    {t('back')}
                                </button>
                                <button className="btn-primary" onClick={handlePublish}>
                                    {t('confirm')}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'publishing' && (
                        <div className="publish-step publishing">
                            <Loader size={48} className="spinning" />
                            <h3>{t('publishing')}</h3>
                            {publishProgress && (
                                <div className="publish-progress">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${publishProgress.progress}%` }}
                                        />
                                    </div>
                                    <p className="progress-message">{publishProgress.message}</p>
                                    <p className="progress-percent">{publishProgress.progress}%</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="publish-step success">
                            <CheckCircle size={48} style={{ color: '#34c759' }} />
                            <h3>{t('publishSuccess')}</h3>
                            <p>{t('prCreated')}</p>
                            <p className="review-message">{t('reviewMessage')}</p>

                            <button className="btn-link" onClick={openPR}>
                                <ExternalLink size={14} />
                                {t('viewPR')}
                            </button>

                            <button className="btn-primary" onClick={onClose}>
                                {t('close')}
                            </button>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="publish-step error">
                            <AlertCircle size={48} style={{ color: '#ff3b30' }} />
                            <h3>{t('publishError')}</h3>
                            <p>{error}</p>

                            <div className="button-group">
                                <button className="btn-secondary" onClick={() => setStep('info')}>
                                    {t('back')}
                                </button>
                                <button className="btn-primary" onClick={onClose}>
                                    {t('close')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
        </div>
    );

    return inline ? wizardContent : (
        <div className="plugin-publish-overlay" onClick={onClose}>
            {wizardContent}
        </div>
    );
}
