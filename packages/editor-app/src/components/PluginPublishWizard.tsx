import { useState } from 'react';
import { X, AlertCircle, CheckCircle, Loader, ExternalLink, FolderOpen, FileArchive } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { GitHubService } from '../services/GitHubService';
import { GitHubAuth } from './GitHubAuth';
import { PluginPublishService, type PluginPublishInfo, type PublishProgress } from '../services/PluginPublishService';
import { PluginBuildService, type BuildProgress } from '../services/PluginBuildService';
import { PluginSourceParser, type ParsedPluginInfo } from '../services/PluginSourceParser';
import { open } from '@tauri-apps/plugin-shell';
import { EditorPluginCategory, type IEditorPluginMetadata } from '@esengine/editor-core';
import '../styles/PluginPublishWizard.css';

interface PluginPublishWizardProps {
    githubService: GitHubService;
    onClose: () => void;
    locale: string;
    inline?: boolean; // 是否内联显示（在 tab 中）而不是弹窗
}

type Step = 'auth' | 'selectSource' | 'info' | 'building' | 'confirm' | 'publishing' | 'success' | 'error';

type SourceType = 'folder' | 'zip';

function calculateNextVersion(currentVersion: string): string {
    const parts = currentVersion.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return currentVersion;

    const [major, minor, patch] = parts;
    return `${major}.${minor}.${(patch ?? 0) + 1}`;
}

export function PluginPublishWizard({ githubService, onClose, locale, inline = false }: PluginPublishWizardProps) {
    const [publishService] = useState(() => new PluginPublishService(githubService));
    const [buildService] = useState(() => new PluginBuildService());
    const [sourceParser] = useState(() => new PluginSourceParser());

    const [step, setStep] = useState<Step>(githubService.isAuthenticated() ? 'selectSource' : 'auth');
    const [sourceType, setSourceType] = useState<SourceType | null>(null);
    const [parsedPluginInfo, setParsedPluginInfo] = useState<ParsedPluginInfo | null>(null);
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
    const [existingVersions, setExistingVersions] = useState<string[]>([]);
    const [suggestedVersion, setSuggestedVersion] = useState<string>('');
    const [existingManifest, setExistingManifest] = useState<any>(null);
    const [isUpdate, setIsUpdate] = useState(false);

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                title: '发布插件到市场',
                updateTitle: '更新插件版本',
                stepAuth: '步骤 1: GitHub 登录',
                stepSelectSource: '步骤 2: 选择插件源',
                stepInfo: '步骤 3: 插件信息',
                stepInfoUpdate: '步骤 3: 版本更新',
                stepBuilding: '步骤 4: 构建打包',
                stepConfirm: '步骤 5: 确认发布',
                stepConfirmNoBuilding: '步骤 4: 确认发布',
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
                selectSource: '选择插件源',
                selectSourceDesc: '选择插件的来源类型',
                selectFolder: '选择源代码文件夹',
                selectFolderDesc: '选择包含你的插件源代码的文件夹（需要有 package.json，系统将自动构建）',
                selectZip: '选择 ZIP 文件',
                selectZipDesc: '选择已构建好的插件 ZIP 包（必须包含 package.json 和 dist 目录）',
                zipRequirements: 'ZIP 文件要求',
                zipStructure: 'ZIP 结构',
                zipStructureDetails: 'ZIP 文件必须包含以下内容：',
                zipFile1: 'package.json - 插件元数据',
                zipFile2: 'dist/ - 构建后的代码目录（包含 index.esm.js）',
                zipExample: '示例结构',
                zipBuildScript: '打包脚本',
                zipBuildScriptDesc: '可以使用以下命令打包：',
                recommendFolder: '💡 建议使用"源代码文件夹"方式，系统会自动构建',
                browseFolder: '浏览文件夹',
                browseZip: '浏览 ZIP 文件',
                selectedFolder: '已选择文件夹',
                selectedZip: '已选择 ZIP',
                sourceTypeFolder: '源代码文件夹',
                sourceTypeZip: 'ZIP 文件',
                pluginInfo: '插件信息',
                version: '版本号',
                currentVersion: '当前版本',
                suggestedVersion: '建议版本',
                versionHistory: '版本历史',
                updatePlugin: '更新插件',
                newPlugin: '新插件',
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
                updateTitle: 'Update Plugin Version',
                stepAuth: 'Step 1: GitHub Authentication',
                stepSelectSource: 'Step 2: Select Plugin Source',
                stepInfo: 'Step 3: Plugin Information',
                stepInfoUpdate: 'Step 3: Version Update',
                stepBuilding: 'Step 4: Build & Package',
                stepConfirm: 'Step 5: Confirm Publication',
                stepConfirmNoBuilding: 'Step 4: Confirm Publication',
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
                selectSource: 'Select Plugin Source',
                selectSourceDesc: 'Choose the plugin source type',
                selectFolder: 'Select Source Folder',
                selectFolderDesc: 'Select the folder containing your plugin source code (must have package.json, will be built automatically)',
                selectZip: 'Select ZIP File',
                selectZipDesc: 'Select a pre-built plugin ZIP package (must contain package.json and dist directory)',
                zipRequirements: 'ZIP File Requirements',
                zipStructure: 'ZIP Structure',
                zipStructureDetails: 'The ZIP file must contain:',
                zipFile1: 'package.json - Plugin metadata',
                zipFile2: 'dist/ - Built code directory (with index.esm.js)',
                zipExample: 'Example Structure',
                zipBuildScript: 'Build Script',
                zipBuildScriptDesc: 'You can use the following commands to package:',
                recommendFolder: '💡 Recommended: Use "Source Folder" mode for automatic build',
                browseFolder: 'Browse Folder',
                browseZip: 'Browse ZIP File',
                selectedFolder: 'Selected Folder',
                selectedZip: 'Selected ZIP',
                sourceTypeFolder: 'Source Folder',
                sourceTypeZip: 'ZIP File',
                pluginInfo: 'Plugin Information',
                version: 'Version',
                currentVersion: 'Current Version',
                suggestedVersion: 'Suggested Version',
                versionHistory: 'Version History',
                updatePlugin: 'Update Plugin',
                newPlugin: 'New Plugin',
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
        setStep('selectSource');
    };

    /**
     * 选择并解析插件源（文件夹或 ZIP）
     * 统一处理逻辑，避免代码重复
     */
    const handleSelectSource = async (type: SourceType) => {
        setError('');
        setSourceType(type);

        try {
            let parsedInfo: ParsedPluginInfo;

            if (type === 'folder') {
                // 选择文件夹
                const selected = await openDialog({
                    directory: true,
                    multiple: false,
                    title: t('selectFolder')
                });

                if (!selected) return;

                // 使用 PluginSourceParser 解析文件夹
                parsedInfo = await sourceParser.parseFromFolder(selected as string);
            } else {
                // 选择 ZIP 文件
                const selected = await openDialog({
                    directory: false,
                    multiple: false,
                    title: t('selectZip'),
                    filters: [
                        {
                            name: 'ZIP Files',
                            extensions: ['zip']
                        }
                    ]
                });

                if (!selected) return;

                // 使用 PluginSourceParser 解析 ZIP
                parsedInfo = await sourceParser.parseFromZip(selected as string);
            }

            // 验证 package.json
            sourceParser.validatePackageJson(parsedInfo.packageJson);

            setParsedPluginInfo(parsedInfo);

            // 检测已发布的版本
            await checkExistingVersions(parsedInfo.packageJson);

            // 检测是否已有待审核的 PR
            await checkExistingPR(parsedInfo.packageJson);

            // 进入下一步
            setStep('info');
        } catch (err) {
            console.error('[PluginPublishWizard] Failed to parse plugin source:', err);
            setError(err instanceof Error ? err.message : 'Failed to parse plugin source');
        }
    };

    /**
     * 检测插件是否已发布，获取版本信息
     */
    const checkExistingVersions = async (packageJson: { name: string; version: string }) => {
        try {
            const pluginId = sourceParser.generatePluginId(packageJson.name);
            const manifestContent = await githubService.getFileContent(
                'esengine',
                'ecs-editor-plugins',
                `plugins/community/${pluginId}/manifest.json`,
                'main'
            );
            const manifest = JSON.parse(manifestContent);

            if (Array.isArray(manifest.versions)) {
                const versions = manifest.versions.map((v: any) => v.version);
                setExistingVersions(versions);
                setExistingManifest(manifest);
                setIsUpdate(true);

                // 计算建议版本号
                const latestVersion = manifest.latestVersion || versions[0];
                const suggested = calculateNextVersion(latestVersion);
                setSuggestedVersion(suggested);

                // 更新模式：自动填充现有信息
                setPublishInfo((prev) => ({
                    ...prev,
                    version: suggested,
                    repositoryUrl: manifest.repository?.url || '',
                    category: manifest.category_type || 'community',
                    tags: manifest.tags || [],
                    homepage: manifest.homepage
                }));
            } else {
                // 首次发布
                resetToNewPlugin(packageJson.version);
            }
        } catch (err) {
            console.log('[PluginPublishWizard] No existing versions found, this is a new plugin');
            resetToNewPlugin(packageJson.version);
        }
    };

    /**
     * 重置为新插件状态
     */
    const resetToNewPlugin = (version: string) => {
        setExistingVersions([]);
        setExistingManifest(null);
        setIsUpdate(false);
        setPublishInfo((prev) => ({
            ...prev,
            version
        }));
    };

    /**
     * 检测是否已有待审核的 PR
     */
    const checkExistingPR = async (packageJson: { name: string; version: string }) => {
        try {
            const user = githubService.getUser();
            if (user) {
                const branchName = `add-plugin-${packageJson.name}-v${packageJson.version}`;
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
    };

    /**
     * 从信息填写步骤进入下一步
     * - 如果是 ZIP，直接跳到确认发布
     * - 如果是文件夹，需要先构建
     */
    const handleNext = () => {
        if (!publishInfo.version || !publishInfo.repositoryUrl || !publishInfo.releaseNotes) {
            setError('Please fill in all required fields');
            return;
        }

        if (!parsedPluginInfo) {
            setError('Plugin source not selected');
            return;
        }

        // ZIP 文件已经构建好，直接跳到确认步骤
        if (parsedPluginInfo.sourceType === 'zip' && parsedPluginInfo.zipPath) {
            setBuiltZipPath(parsedPluginInfo.zipPath);
            setStep('confirm');
        } else {
            // 文件夹需要构建
            setStep('building');
            handleBuild();
        }
    };

    /**
     * 构建插件（仅对文件夹源有效）
     */
    const handleBuild = async () => {
        if (!parsedPluginInfo || parsedPluginInfo.sourceType !== 'folder') {
            setError('Cannot build: plugin source is not a folder');
            setStep('error');
            return;
        }

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
            const zipPath = await buildService.buildPlugin(parsedPluginInfo.sourcePath);
            console.log('[PluginPublishWizard] Build completed, ZIP at:', zipPath);
            setBuiltZipPath(zipPath);
            setStep('confirm');
        } catch (err) {
            console.error('[PluginPublishWizard] Build failed:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            setStep('error');
        }
    };

    /**
     * 发布插件到市场
     */
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

            // 验证插件源
            if (!parsedPluginInfo) {
                throw new Error('Plugin source not selected');
            }

            // 验证 ZIP 路径
            if (!builtZipPath) {
                throw new Error('Plugin ZIP file not available');
            }

            const { packageJson } = parsedPluginInfo;

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

            const prUrl = await publishService.publishPlugin(fullPublishInfo, builtZipPath);
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

                    {step === 'selectSource' && (
                        <div className="publish-step">
                            <h3>{t('stepSelectSource')}</h3>
                            <p>{t('selectSourceDesc')}</p>

                            <div className="source-type-selection">
                                <button
                                    className={`source-type-btn ${sourceType === 'folder' ? 'active' : ''}`}
                                    onClick={() => handleSelectSource('folder')}
                                >
                                    <FolderOpen size={24} />
                                    <div className="source-type-info">
                                        <strong>{t('sourceTypeFolder')}</strong>
                                        <p>{t('selectFolderDesc')}</p>
                                    </div>
                                </button>

                                <button
                                    className={`source-type-btn ${sourceType === 'zip' ? 'active' : ''}`}
                                    onClick={() => handleSelectSource('zip')}
                                >
                                    <FileArchive size={24} />
                                    <div className="source-type-info">
                                        <strong>{t('sourceTypeZip')}</strong>
                                        <p>{t('selectZipDesc')}</p>
                                    </div>
                                </button>
                            </div>

                            {/* ZIP 文件要求说明 */}
                            <details className="zip-requirements-details">
                                <summary>
                                    <AlertCircle size={16} />
                                    {t('zipRequirements')}
                                </summary>
                                <div className="zip-requirements-content">
                                    <div className="requirement-section">
                                        <h4>{t('zipStructure')}</h4>
                                        <p>{t('zipStructureDetails')}</p>
                                        <ul>
                                            <li><code>package.json</code> - {t('zipFile1')}</li>
                                            <li><code>dist/</code> - {t('zipFile2')}</li>
                                        </ul>
                                    </div>

                                    <div className="requirement-section">
                                        <h4>{t('zipBuildScript')}</h4>
                                        <p>{t('zipBuildScriptDesc')}</p>
                                        <pre className="build-script-example">
{`npm install
npm run build
# 然后将 package.json 和 dist/ 目录一起压缩为 ZIP
# ZIP 结构：
#   plugin.zip
#   ├── package.json
#   └── dist/
#       └── index.esm.js`}
                                        </pre>
                                    </div>

                                    <div className="recommendation-notice">
                                        {t('recommendFolder')}
                                    </div>
                                </div>
                            </details>

                            {parsedPluginInfo && (
                                <div className="selected-source">
                                    {parsedPluginInfo.sourceType === 'folder' ? (
                                        <FolderOpen size={20} />
                                    ) : (
                                        <FileArchive size={20} />
                                    )}
                                    <div className="source-details">
                                        <span className="source-path">{parsedPluginInfo.sourcePath}</span>
                                        <span className="source-name">{parsedPluginInfo.packageJson.name} v{parsedPluginInfo.packageJson.version}</span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="error-message">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {parsedPluginInfo && (
                                <div className="button-group">
                                    <button className="btn-secondary" onClick={() => setStep('auth')}>
                                        {t('back')}
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
                                {isUpdate && (
                                    <div className="version-info">
                                        <div className="version-notice">
                                            <CheckCircle size={16} />
                                            <span>{t('updatePlugin')}: {existingManifest?.name} v{existingVersions[0]}</span>
                                        </div>
                                        {suggestedVersion && (
                                            <button
                                                type="button"
                                                className="btn-version-suggest"
                                                onClick={() => setPublishInfo({ ...publishInfo, version: suggestedVersion })}
                                            >
                                                {t('suggestedVersion')}: {suggestedVersion}
                                            </button>
                                        )}
                                    </div>
                                )}
                                <input
                                    type="text"
                                    value={publishInfo.version || ''}
                                    onChange={(e) => setPublishInfo({ ...publishInfo, version: e.target.value })}
                                    placeholder="1.0.0"
                                />
                                {isUpdate && (
                                    <details className="version-history">
                                        <summary>{t('versionHistory')} ({existingVersions.length})</summary>
                                        <ul>
                                            {existingVersions.map((v) => (
                                                <li key={v}>v{v}</li>
                                            ))}
                                        </ul>
                                    </details>
                                )}
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

                            {!isUpdate && (
                                <>
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
                                </>
                            )}

                            {error && (
                                <div className="error-message">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="button-group">
                                <button className="btn-secondary" onClick={() => setStep('selectSource')}>
                                    {t('back')}
                                </button>
                                <button className="btn-primary" onClick={handleNext}>
                                    {sourceType === 'zip' ? t('next') : t('build')}
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
                                    <span className="detail-label">{t('selectSource')}:</span>
                                    <span className="detail-value">
                                        {parsedPluginInfo?.sourceType === 'zip' ? t('selectedZip') : t('selectedFolder')}: {parsedPluginInfo?.sourcePath}
                                    </span>
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
                                        <span className="detail-label">Package Path:</span>
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
