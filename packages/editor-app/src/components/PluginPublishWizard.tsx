import { useState } from 'react';
import { X, Github, AlertCircle, CheckCircle, Loader, ExternalLink, FolderOpen } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { GitHubService } from '../services/GitHubService';
import { PluginPublishService, type PluginPublishInfo, type PublishProgress } from '../services/PluginPublishService';
import { open } from '@tauri-apps/plugin-shell';
import { EditorPluginCategory, type IEditorPluginMetadata } from '@esengine/editor-core';
import '../styles/PluginPublishWizard.css';

interface PluginPublishWizardProps {
    onClose: () => void;
    locale: string;
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

export function PluginPublishWizard({ onClose, locale }: PluginPublishWizardProps) {
    const [githubService] = useState(() => new GitHubService());
    const [publishService] = useState(() => new PluginPublishService(githubService));

    const [step, setStep] = useState<Step>(githubService.isAuthenticated() ? 'selectFolder' : 'auth');
    const [githubToken, setGithubToken] = useState('');
    const [pluginFolder, setPluginFolder] = useState('');
    const [packageJson, setPackageJson] = useState<PluginPackageJson | null>(null);
    const [publishInfo, setPublishInfo] = useState<Partial<PluginPublishInfo>>({
        category: 'community',
        tags: []
    });
    const [prUrl, setPrUrl] = useState('');
    const [error, setError] = useState('');
    const [buildLog, setBuildLog] = useState<string[]>([]);
    const [publishProgress, setPublishProgress] = useState<PublishProgress | null>(null);

    // OAuth Device Flow state
    const [useOAuth, setUseOAuth] = useState(true);
    const [userCode, setUserCode] = useState('');
    const [verificationUri, setVerificationUri] = useState('');
    const [authStatus, setAuthStatus] = useState<'idle' | 'pending' | 'authorized' | 'error'>('idle');

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
                reviewMessage: '你的插件提交已创建 PR，维护者将进行审核。审核通过后，插件将自动发布到市场。'
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
                    'Your plugin submission has been created as a PR. Maintainers will review it. Once approved, the plugin will be published to the marketplace.'
            }
        };
        return translations[locale]?.[key] || translations.en?.[key] || key;
    };

    const handleOAuthLogin = async () => {
        setAuthStatus('pending');
        setError('');

        try {
            console.log('[PluginPublishWizard] Starting OAuth login...');

            // 1. 请求设备代码
            console.log('[PluginPublishWizard] Requesting device code...');
            const deviceCodeResp = await githubService.requestDeviceCode();
            console.log('[PluginPublishWizard] Device code received:', deviceCodeResp.user_code);

            setUserCode(deviceCodeResp.user_code);
            setVerificationUri(deviceCodeResp.verification_uri);

            // 2. 自动打开浏览器
            console.log('[PluginPublishWizard] Opening browser...');
            await open(deviceCodeResp.verification_uri);

            // 3. 开始轮询检查授权状态
            console.log('[PluginPublishWizard] Starting authentication polling...');
            await githubService.authenticateWithDeviceFlow(
                deviceCodeResp.device_code,
                deviceCodeResp.interval,
                (status) => {
                    console.log('[PluginPublishWizard] Auth status changed:', status);
                    setAuthStatus(status === 'pending' ? 'pending' : status === 'authorized' ? 'authorized' : 'error');
                }
            );

            // 授权成功
            console.log('[PluginPublishWizard] Authorization successful!');
            setAuthStatus('authorized');
            setTimeout(() => {
                setStep('selectFolder');
            }, 1500);
        } catch (err) {
            console.error('[PluginPublishWizard] OAuth failed:', err);
            setAuthStatus('error');
            const errorMessage = err instanceof Error ? err.message : 'OAuth authorization failed';
            const fullError = err instanceof Error && err.stack ? `${errorMessage}\n\nDetails: ${err.stack}` : errorMessage;
            setError(fullError);
        }
    };

    const handleTokenAuth = async () => {
        if (!githubToken.trim()) return;

        try {
            await githubService.authenticate(githubToken);
            setStep('selectFolder');
            setError('');
        } catch {
            setError('Authentication failed. Please check your token.');
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
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
        setError('');

        try {
            // TODO: 实现本地构建
            // 1. 运行 npm install
            // 2. 运行 npm run build
            // 3. 打包 dist/ 目录为 ZIP
            // 4. 保存 ZIP 到临时目录

            setBuildLog((prev) => [...prev, t('buildingStep1')]);
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setBuildLog((prev) => [...prev, t('buildingStep2')]);
            await new Promise((resolve) => setTimeout(resolve, 2000));

            setBuildLog((prev) => [...prev, t('buildingStep3')]);
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setStep('confirm');
        } catch (err) {
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

            // 上传 ZIP 并创建 PR
            const prUrl = await publishService.publishPluginWithZip(fullPublishInfo, pluginFolder);
            setPrUrl(prUrl);
            setStep('success');
        } catch (err) {
            console.error('[PluginPublishWizard] Publish failed:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            setStep('error');
        }
    };

    const openCreateTokenPage = async () => {
        await githubService.openAuthorizationPage();
    };

    const openPR = async () => {
        if (prUrl) {
            await open(prUrl);
        }
    };

    return (
        <div className="plugin-publish-overlay" onClick={onClose}>
            <div className="plugin-publish-wizard" onClick={(e) => e.stopPropagation()}>
                <div className="plugin-publish-header">
                    <h2>{t('title')}</h2>
                    <button className="plugin-publish-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="plugin-publish-content">
                    {step === 'auth' && (
                        <div className="publish-step">
                            <h3>{t('stepAuth')}</h3>
                            <div className="github-auth">
                                <Github size={48} style={{ color: '#0366d6' }} />
                                <p>{t('githubLogin')}</p>

                                <div className="auth-tabs">
                                    <button
                                        className={`auth-tab ${useOAuth ? 'active' : ''}`}
                                        onClick={() => setUseOAuth(true)}
                                    >
                                        {t('oauthLogin')}
                                    </button>
                                    <button
                                        className={`auth-tab ${!useOAuth ? 'active' : ''}`}
                                        onClick={() => setUseOAuth(false)}
                                    >
                                        {t('tokenLogin')}
                                    </button>
                                </div>

                                {useOAuth ? (
                                    <div className="oauth-auth">
                                        {authStatus === 'idle' && (
                                            <>
                                                <div className="oauth-instructions">
                                                    <p>{t('oauthStep1')}</p>
                                                    <p>{t('oauthStep2')}</p>
                                                    <p>{t('oauthStep3')}</p>
                                                </div>

                                                <button className="btn-primary" onClick={handleOAuthLogin}>
                                                    <Github size={16} />
                                                    {t('startAuth')}
                                                </button>
                                            </>
                                        )}

                                        {authStatus === 'pending' && (
                                            <div className="oauth-pending">
                                                <Loader size={48} className="spinning" style={{ color: '#0366d6' }} />
                                                <h4>{t('authorizing')}</h4>

                                                {userCode && (
                                                    <div className="user-code-display">
                                                        <label>{t('userCode')}</label>
                                                        <div className="code-box">
                                                            <span className="code-text">{userCode}</span>
                                                            <button
                                                                className="btn-copy"
                                                                onClick={() => copyToClipboard(userCode)}
                                                                title={t('copyCode')}
                                                            >
                                                                📋
                                                            </button>
                                                        </div>
                                                        <button
                                                            className="btn-link"
                                                            onClick={() => open(verificationUri)}
                                                        >
                                                            <ExternalLink size={14} />
                                                            {t('openBrowser')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {authStatus === 'authorized' && (
                                            <div className="oauth-success">
                                                <CheckCircle size={48} style={{ color: '#34c759' }} />
                                                <h4>{t('authorized')}</h4>
                                            </div>
                                        )}

                                        {authStatus === 'error' && (
                                            <div className="oauth-error">
                                                <AlertCircle size={48} style={{ color: '#ff3b30' }} />
                                                <h4>{t('authFailed')}</h4>
                                                {error && (
                                                    <div className="error-details">
                                                        <pre>{error}</pre>
                                                    </div>
                                                )}
                                                <button className="btn-secondary" onClick={() => setAuthStatus('idle')}>
                                                    {t('back')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="token-auth">
                                        <div className="form-group">
                                            <label>{t('tokenLabel')}</label>
                                            <input
                                                type="password"
                                                value={githubToken}
                                                onChange={(e) => setGithubToken(e.target.value)}
                                                placeholder={t('tokenPlaceholder')}
                                            />
                                            <small>{t('tokenHint')}</small>
                                        </div>

                                        <button className="btn-link" onClick={openCreateTokenPage}>
                                            <ExternalLink size={14} />
                                            {t('createToken')}
                                        </button>

                                        <button className="btn-primary" onClick={handleTokenAuth}>
                                            {t('login')}
                                        </button>
                                    </div>
                                )}

                                {error && (
                                    <div className="error-message">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}
                            </div>
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
                                        <CheckCircle size={14} style={{ color: '#34c759' }} />
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div className="publish-step">
                            <h3>{t('stepConfirm')}</h3>

                            <p>{t('confirmMessage')}</p>

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
        </div>
    );
}
