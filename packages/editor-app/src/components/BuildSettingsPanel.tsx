/**
 * Build Settings Panel.
 * 构建设置面板。
 *
 * Provides build settings interface for managing platform builds,
 * scenes, and player settings.
 * 提供构建设置界面，用于管理平台构建、场景和玩家设置。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Monitor, Apple, Smartphone, Globe, Server, Gamepad2,
    Plus, Minus, ChevronDown, ChevronRight, Settings,
    Package, Loader2, CheckCircle, XCircle, AlertTriangle, X, Copy, Check
} from 'lucide-react';
import type { BuildService, BuildProgress, BuildConfig, WebBuildConfig, WeChatBuildConfig, SceneManagerService, ProjectService, BuildSettingsConfig } from '@esengine/editor-core';
import { BuildPlatform, BuildStatus } from '@esengine/editor-core';
import { useLocale } from '../hooks/useLocale';
import '../styles/BuildSettingsPanel.css';

// ==================== Types | 类型定义 ====================

/** Platform type | 平台类型 */
type PlatformType =
    | 'windows'
    | 'macos'
    | 'linux'
    | 'android'
    | 'ios'
    | 'web'
    | 'wechat-minigame';

/** Build profile | 构建配置 */
interface BuildProfile {
    id: string;
    name: string;
    platform: PlatformType;
    isActive?: boolean;
}

/** Scene entry | 场景条目 */
interface SceneEntry {
    path: string;
    enabled: boolean;
}

/** Platform configuration | 平台配置 */
interface PlatformConfig {
    platform: PlatformType;
    label: string;
    icon: React.ReactNode;
    available: boolean;
}

/** Build settings | 构建设置 */
interface BuildSettings {
    scenes: SceneEntry[];
    scriptingDefines: string[];
    companyName: string;
    productName: string;
    version: string;
    // Platform-specific | 平台特定
    developmentBuild: boolean;
    sourceMap: boolean;
    compressionMethod: 'Default' | 'LZ4' | 'LZ4HC';
    /** Web build mode | Web 构建模式 */
    buildMode: 'split-bundles' | 'single-bundle' | 'single-file';
}

// ==================== Constants | 常量 ====================

const PLATFORMS: PlatformConfig[] = [
    { platform: 'windows', label: 'Windows', icon: <Monitor size={16} />, available: true },
    { platform: 'macos', label: 'macOS', icon: <Apple size={16} />, available: true },
    { platform: 'linux', label: 'Linux', icon: <Server size={16} />, available: true },
    { platform: 'android', label: 'Android', icon: <Smartphone size={16} />, available: true },
    { platform: 'ios', label: 'iOS', icon: <Smartphone size={16} />, available: true },
    { platform: 'web', label: 'Web', icon: <Globe size={16} />, available: true },
    { platform: 'wechat-minigame', label: 'WeChat Mini Game', icon: <Gamepad2 size={16} />, available: true },
];

const DEFAULT_SETTINGS: BuildSettings = {
    scenes: [],
    scriptingDefines: [],
    companyName: 'DefaultCompany',
    productName: 'MyGame',
    version: '0.1.0',
    developmentBuild: false,
    sourceMap: false,
    compressionMethod: 'Default',
    buildMode: 'split-bundles',
};

// ==================== Status Key Mapping | 状态键映射 ====================

/** Map BuildStatus to translation key | 将 BuildStatus 映射到翻译键 */
const buildStatusKeys: Record<BuildStatus, string> = {
    [BuildStatus.Idle]: 'buildSettings.preparing',
    [BuildStatus.Preparing]: 'buildSettings.preparing',
    [BuildStatus.Compiling]: 'buildSettings.compiling',
    [BuildStatus.Packaging]: 'buildSettings.packaging',
    [BuildStatus.Copying]: 'buildSettings.copying',
    [BuildStatus.PostProcessing]: 'buildSettings.postProcessing',
    [BuildStatus.Completed]: 'buildSettings.completed',
    [BuildStatus.Failed]: 'buildSettings.failed',
    [BuildStatus.Cancelled]: 'buildSettings.cancelled'
};

// ==================== Build Error Display Component | 构建错误显示组件 ====================

/**
 * Format and display build errors in a readable way.
 * 以可读的方式格式化和显示构建错误。
 */
function BuildErrorDisplay({ error }: { error: string }) {
    const { t } = useLocale();
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    // Extract first line as summary | 提取第一行作为摘要
    const lines = error.split('\n');
    const firstErrorMatch = error.match(/X \[ERROR\][^\n]*/);
    const firstLine = lines[0] || '';
    const matchedError = firstErrorMatch?.[0] || '';
    const summary = matchedError
        ? matchedError.slice(0, 100) + (matchedError.length > 100 ? '...' : '')
        : firstLine.slice(0, 100) + (firstLine.length > 100 ? '...' : '');

    // Check if error is long (needs expansion) | 检查错误是否很长（需要展开）
    const isLongError = error.length > 200 || lines.length > 3;

    // Copy error to clipboard | 复制错误到剪贴板
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(error);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    return (
        <div className="build-result-error">
            <div className="build-error-header">
                <AlertTriangle size={16} />
                <span className="build-error-summary">{summary}</span>
                <button
                    className="build-error-copy-btn"
                    onClick={handleCopy}
                    title={t('buildSettings.copyError')}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
            </div>

            {isLongError && (
                <>
                    <button
                        className="build-error-expand-btn"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? t('buildSettings.collapse') : t('buildSettings.showDetails')}
                        <ChevronDown
                            size={14}
                            className={isExpanded ? 'rotated' : ''}
                        />
                    </button>

                    {isExpanded && (
                        <pre className="build-error-details">{error}</pre>
                    )}
                </>
            )}
        </div>
    );
}

// ==================== Props | 属性 ====================

interface BuildSettingsPanelProps {
    projectPath?: string;
    buildService?: BuildService;
    sceneManager?: SceneManagerService;
    projectService?: ProjectService;
    /** Available scenes in the project | 项目中可用的场景列表 */
    availableScenes?: string[];
    onBuild?: (profile: BuildProfile, settings: BuildSettings) => void;
    onClose?: () => void;
}

// ==================== Component | 组件 ====================

export function BuildSettingsPanel({
    projectPath,
    buildService,
    sceneManager,
    projectService,
    availableScenes,
    onBuild,
    onClose
}: BuildSettingsPanelProps) {
    const { t } = useLocale();

    // State | 状态
    const [profiles, setProfiles] = useState<BuildProfile[]>([
        { id: 'web-dev', name: 'Web - Development', platform: 'web', isActive: true },
        { id: 'web-prod', name: 'Web - Production', platform: 'web' },
        { id: 'wechat', name: 'WeChat Mini Game', platform: 'wechat-minigame' },
    ]);
    const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('web');
    const [selectedProfile, setSelectedProfile] = useState<BuildProfile | null>(profiles[0] || null);
    const [settings, setSettings] = useState<BuildSettings>(DEFAULT_SETTINGS);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        sceneList: true,
        scriptingDefines: true,
        platformSettings: true,
        playerSettings: true,
    });

    // Build state | 构建状态
    const [isBuilding, setIsBuilding] = useState(false);
    const [buildProgress, setBuildProgress] = useState<BuildProgress | null>(null);
    const [buildResult, setBuildResult] = useState<{
        success: boolean;
        outputPath: string;
        duration: number;
        warnings: string[];
        error?: string;
    } | null>(null);
    const [showBuildProgress, setShowBuildProgress] = useState(false);
    const buildAbortRef = useRef<AbortController | null>(null);

    // Handlers | 处理函数
    const toggleSection = useCallback((section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    const handlePlatformSelect = useCallback((platform: PlatformType) => {
        setSelectedPlatform(platform);
        // Find first profile for this platform | 查找此平台的第一个配置
        const profile = profiles.find(p => p.platform === platform);
        setSelectedProfile(profile || null);
    }, [profiles]);

    const handleProfileSelect = useCallback((profile: BuildProfile) => {
        setSelectedProfile(profile);
        setSelectedPlatform(profile.platform);
    }, []);

    const handleAddProfile = useCallback(() => {
        const newProfile: BuildProfile = {
            id: `profile-${Date.now()}`,
            name: `${selectedPlatform} - New Profile`,
            platform: selectedPlatform,
        };
        setProfiles(prev => [...prev, newProfile]);
        setSelectedProfile(newProfile);
    }, [selectedPlatform]);

    // Map platform type to BuildPlatform enum | 将平台类型映射到 BuildPlatform 枚举
    const getPlatformEnum = useCallback((platformType: PlatformType): BuildPlatform => {
        const platformMap: Record<PlatformType, BuildPlatform> = {
            'web': BuildPlatform.Web,
            'wechat-minigame': BuildPlatform.WeChatMiniGame,
            'windows': BuildPlatform.Desktop,
            'macos': BuildPlatform.Desktop,
            'linux': BuildPlatform.Desktop,
            'android': BuildPlatform.Android,
            'ios': BuildPlatform.iOS
        };
        return platformMap[platformType];
    }, []);

    const handleBuild = useCallback(async () => {
        if (!selectedProfile || !projectPath) {
            return;
        }

        // Call external handler if provided | 如果提供了外部处理程序则调用
        if (onBuild) {
            onBuild(selectedProfile, settings);
        }

        // Use BuildService if available | 如果可用则使用 BuildService
        if (buildService) {
            setIsBuilding(true);
            setBuildProgress(null);
            setBuildResult(null);
            setShowBuildProgress(true);

            try {
                const platform = getPlatformEnum(selectedProfile.platform);
                const baseConfig = {
                    platform,
                    outputPath: `${projectPath}/build/${selectedProfile.platform}`,
                    isRelease: !settings.developmentBuild,
                    sourceMap: settings.sourceMap,
                    scenes: settings.scenes.filter(s => s.enabled).map(s => s.path)
                };

                // Build platform-specific config | 构建平台特定配置
                let buildConfig: BuildConfig;
                if (platform === BuildPlatform.Web) {
                    const webConfig: WebBuildConfig = {
                        ...baseConfig,
                        platform: BuildPlatform.Web,
                        buildMode: settings.buildMode,
                        generateHtml: true,
                        minify: !settings.developmentBuild,
                        generateAssetCatalog: true,
                        assetLoadingStrategy: 'on-demand'
                    };
                    buildConfig = webConfig;
                } else if (platform === BuildPlatform.WeChatMiniGame) {
                    const wechatConfig: WeChatBuildConfig = {
                        ...baseConfig,
                        platform: BuildPlatform.WeChatMiniGame,
                        appId: '',
                        useSubpackages: false,
                        mainPackageLimit: 4096,
                        usePlugins: false
                    };
                    buildConfig = wechatConfig;
                } else {
                    buildConfig = baseConfig;
                }

                // Execute build with progress callback | 执行构建并传入进度回调
                const result = await buildService.build(buildConfig, (progress) => {
                    setBuildProgress(progress);
                });

                // Set result | 设置结果
                setBuildResult({
                    success: result.success,
                    outputPath: result.outputPath,
                    duration: result.duration,
                    warnings: result.warnings,
                    error: result.error
                });

            } catch (error) {
                console.error('Build failed:', error);
                setBuildResult({
                    success: false,
                    outputPath: '',
                    duration: 0,
                    warnings: [],
                    error: error instanceof Error ? error.message : String(error)
                });
            } finally {
                setIsBuilding(false);
            }
        }
    }, [selectedProfile, settings, projectPath, buildService, onBuild, getPlatformEnum]);

    // Load saved build settings from project config
    // 从项目配置加载已保存的构建设置
    useEffect(() => {
        if (!projectService) return;

        const savedSettings = projectService.getBuildSettings();
        if (savedSettings) {
            setSettings(prev => ({
                ...prev,
                scriptingDefines: savedSettings.scriptingDefines || [],
                companyName: savedSettings.companyName || prev.companyName,
                productName: savedSettings.productName || prev.productName,
                version: savedSettings.version || prev.version,
                developmentBuild: savedSettings.developmentBuild ?? prev.developmentBuild,
                sourceMap: savedSettings.sourceMap ?? prev.sourceMap,
                compressionMethod: savedSettings.compressionMethod || prev.compressionMethod,
                buildMode: savedSettings.buildMode || prev.buildMode
            }));
        }
    }, [projectService]);

    // Initialize scenes from availableScenes prop and saved settings
    // 从 availableScenes prop 和已保存设置初始化场景列表
    useEffect(() => {
        if (availableScenes && availableScenes.length > 0) {
            const savedSettings = projectService?.getBuildSettings();
            const savedScenes = savedSettings?.scenes || [];

            setSettings(prev => ({
                ...prev,
                scenes: availableScenes.map(path => ({
                    path,
                    enabled: savedScenes.length > 0 ? savedScenes.includes(path) : true
                }))
            }));
        }
    }, [availableScenes, projectService]);

    // Auto-save build settings when changed
    // 设置变化时自动保存
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (!projectService) return;

        // Debounce save to avoid too many writes
        // 防抖保存，避免频繁写入
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            const configToSave: BuildSettingsConfig = {
                scenes: settings.scenes.filter(s => s.enabled).map(s => s.path),
                scriptingDefines: settings.scriptingDefines,
                companyName: settings.companyName,
                productName: settings.productName,
                version: settings.version,
                developmentBuild: settings.developmentBuild,
                sourceMap: settings.sourceMap,
                compressionMethod: settings.compressionMethod,
                buildMode: settings.buildMode
            };
            projectService.updateBuildSettings(configToSave);
        }, 500);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [settings, projectService]);

    // Monitor build progress from service | 从服务监控构建进度
    useEffect(() => {
        if (!buildService || !isBuilding) {
            return;
        }

        const interval = setInterval(() => {
            const task = buildService.getCurrentTask();
            if (task) {
                setBuildProgress(task.progress);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [buildService, isBuilding]);

    const handleCancelBuild = useCallback(() => {
        if (buildService) {
            buildService.cancelBuild();
        }
    }, [buildService]);

    const handleCloseBuildProgress = useCallback(() => {
        if (!isBuilding) {
            setShowBuildProgress(false);
            setBuildProgress(null);
            setBuildResult(null);
        }
    }, [isBuilding]);

    // Get status message | 获取状态消息
    const getStatusMessage = useCallback((status: BuildStatus): string => {
        return t(buildStatusKeys[status]) || status;
    }, [t]);

    const handleAddScene = useCallback(() => {
        if (!sceneManager) {
            console.warn('SceneManagerService not available');
            return;
        }

        const sceneState = sceneManager.getSceneState();
        const currentScenePath = sceneState.currentScenePath;

        if (!currentScenePath) {
            console.warn('No scene is currently open');
            return;
        }

        // Check if scene is already in the list | 检查场景是否已在列表中
        const exists = settings.scenes.some(s => s.path === currentScenePath);
        if (exists) {
            console.log('Scene already in list:', currentScenePath);
            return;
        }

        // Add current scene to the list | 将当前场景添加到列表中
        setSettings(prev => ({
            ...prev,
            scenes: [...prev.scenes, { path: currentScenePath, enabled: true }]
        }));
    }, [sceneManager, settings.scenes]);

    const handleAddDefine = useCallback(() => {
        const define = prompt('Enter scripting define:');
        if (define) {
            setSettings(prev => ({
                ...prev,
                scriptingDefines: [...prev.scriptingDefines, define]
            }));
        }
    }, []);

    const handleRemoveDefine = useCallback((index: number) => {
        setSettings(prev => ({
            ...prev,
            scriptingDefines: prev.scriptingDefines.filter((_, i) => i !== index)
        }));
    }, []);

    // Get platform config | 获取平台配置
    const currentPlatformConfig = PLATFORMS.find(p => p.platform === selectedPlatform);

    return (
        <div className="build-settings-panel">
            {/* Header Tabs | 头部标签 */}
            <div className="build-settings-header">
                <div className="build-settings-tabs">
                    <div className="build-settings-tab active">
                        <Package size={14} />
                        {t('buildSettings.buildProfiles')}
                    </div>
                </div>
                <div className="build-settings-header-actions">
                    <button className="build-settings-header-btn">{t('buildSettings.playerSettings')}</button>
                    <button className="build-settings-header-btn">{t('buildSettings.assetImportOverrides')}</button>
                </div>
            </div>

            {/* Add Profile Bar | 添加配置栏 */}
            <div className="build-settings-add-bar">
                <button className="build-settings-add-btn" onClick={handleAddProfile}>
                    <Plus size={14} />
                    {t('buildSettings.addBuildProfile')}
                </button>
            </div>

            {/* Main Content | 主要内容 */}
            <div className="build-settings-content">
                {/* Left Sidebar | 左侧边栏 */}
                <div className="build-settings-sidebar">
                    {/* Platforms Section | 平台部分 */}
                    <div className="build-settings-section">
                        <div className="build-settings-section-header">{t('buildSettings.platforms')}</div>
                        <div className="build-settings-platform-list">
                            {PLATFORMS.map(platform => {
                                const isActive = profiles.some(p => p.platform === platform.platform && p.isActive);
                                return (
                                    <div
                                        key={platform.platform}
                                        className={`build-settings-platform-item ${selectedPlatform === platform.platform ? 'selected' : ''}`}
                                        onClick={() => handlePlatformSelect(platform.platform)}
                                    >
                                        <span className="build-settings-platform-icon">{platform.icon}</span>
                                        <span className="build-settings-platform-label">{platform.label}</span>
                                        {isActive && <span className="build-settings-active-badge">{t('buildSettings.active')}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Build Profiles Section | 构建配置部分 */}
                    <div className="build-settings-section">
                        <div className="build-settings-section-header">{t('buildSettings.buildProfiles')}</div>
                        <div className="build-settings-profile-list">
                            {profiles
                                .filter(p => p.platform === selectedPlatform)
                                .map(profile => (
                                    <div
                                        key={profile.id}
                                        className={`build-settings-profile-item ${selectedProfile?.id === profile.id ? 'selected' : ''}`}
                                        onClick={() => handleProfileSelect(profile)}
                                    >
                                        <span className="build-settings-profile-icon">
                                            {currentPlatformConfig?.icon}
                                        </span>
                                        <span className="build-settings-profile-name">{profile.name}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel | 右侧面板 */}
                <div className="build-settings-details">
                    {selectedProfile ? (
                        <>
                            {/* Profile Header | 配置头部 */}
                            <div className="build-settings-details-header">
                                <div className="build-settings-details-title">
                                    <span className="build-settings-details-icon">
                                        {currentPlatformConfig?.icon}
                                    </span>
                                    <div className="build-settings-details-info">
                                        <h3>{selectedProfile.name}</h3>
                                        <span>{currentPlatformConfig?.label}</span>
                                    </div>
                                </div>
                                <div className="build-settings-details-actions">
                                    <button className="build-settings-btn secondary">{t('buildSettings.switchProfile')}</button>
                                    <button className="build-settings-btn primary" onClick={handleBuild}>
                                        {t('buildSettings.build')}
                                        <ChevronDown size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Build Data Section | 构建数据部分 */}
                            <div className="build-settings-card">
                                <div className="build-settings-card-header">{t('buildSettings.buildData')}</div>

                                {/* Scene List | 场景列表 */}
                                <div className="build-settings-field-group">
                                    <div
                                        className="build-settings-field-header"
                                        onClick={() => toggleSection('sceneList')}
                                    >
                                        {expandedSections.sceneList ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        <span>{t('buildSettings.sceneList')}</span>
                                    </div>
                                    {expandedSections.sceneList && (
                                        <div className="build-settings-field-content">
                                            <div className="build-settings-scene-list">
                                                {settings.scenes.length === 0 ? (
                                                    <div className="build-settings-empty-list">
                                                        {t('buildSettings.noScenesFound')}
                                                    </div>
                                                ) : (
                                                    settings.scenes.map((scene, index) => (
                                                        <div key={index} className="build-settings-scene-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={scene.enabled}
                                                                onChange={e => {
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        scenes: prev.scenes.map((s, i) =>
                                                                            i === index ? { ...s, enabled: e.target.checked } : s
                                                                        )
                                                                    }));
                                                                }}
                                                            />
                                                            <span>{scene.path}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="build-settings-field-actions">
                                                <button className="build-settings-btn text" onClick={handleAddScene}>
                                                    {t('buildSettings.addOpenScenes')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Scripting Defines | 脚本定义 */}
                                <div className="build-settings-field-group">
                                    <div
                                        className="build-settings-field-header"
                                        onClick={() => toggleSection('scriptingDefines')}
                                    >
                                        {expandedSections.scriptingDefines ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        <span>{t('buildSettings.scriptingDefines')}</span>
                                    </div>
                                    {expandedSections.scriptingDefines && (
                                        <div className="build-settings-field-content">
                                            <div className="build-settings-defines-list">
                                                {settings.scriptingDefines.length === 0 ? (
                                                    <div className="build-settings-empty-text">{t('buildSettings.listIsEmpty')}</div>
                                                ) : (
                                                    settings.scriptingDefines.map((define, index) => (
                                                        <div key={index} className="build-settings-define-item">
                                                            <span>{define}</span>
                                                            <button onClick={() => handleRemoveDefine(index)}>
                                                                <Minus size={12} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="build-settings-list-actions">
                                                <button onClick={handleAddDefine}><Plus size={14} /></button>
                                                <button disabled={settings.scriptingDefines.length === 0}>
                                                    <Minus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Platform Settings Section | 平台设置部分 */}
                            <div className="build-settings-card">
                                <div className="build-settings-card-header">{t('buildSettings.platformSettings')}</div>

                                <div className="build-settings-field-group">
                                    <div
                                        className="build-settings-field-header"
                                        onClick={() => toggleSection('platformSettings')}
                                    >
                                        {expandedSections.platformSettings ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        <span>{currentPlatformConfig?.label} {t('buildSettings.settings')}</span>
                                    </div>
                                    {expandedSections.platformSettings && (
                                        <div className="build-settings-field-content">
                                            <div className="build-settings-form">
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.developmentBuild')}</label>
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.developmentBuild}
                                                        onChange={e => setSettings(prev => ({
                                                            ...prev,
                                                            developmentBuild: e.target.checked
                                                        }))}
                                                    />
                                                </div>
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.sourceMap')}</label>
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.sourceMap}
                                                        onChange={e => setSettings(prev => ({
                                                            ...prev,
                                                            sourceMap: e.target.checked
                                                        }))}
                                                    />
                                                </div>
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.compressionMethod')}</label>
                                                    <select
                                                        value={settings.compressionMethod}
                                                        onChange={e => setSettings(prev => ({
                                                            ...prev,
                                                            compressionMethod: e.target.value as any
                                                        }))}
                                                    >
                                                        <option value="Default">Default</option>
                                                        <option value="LZ4">LZ4</option>
                                                        <option value="LZ4HC">LZ4HC</option>
                                                    </select>
                                                </div>
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.buildMode')}</label>
                                                    <div className="build-settings-toggle-group">
                                                        <select
                                                            value={settings.buildMode}
                                                            onChange={e => setSettings(prev => ({
                                                                ...prev,
                                                                buildMode: e.target.value as 'split-bundles' | 'single-bundle' | 'single-file'
                                                            }))}
                                                        >
                                                            <option value="split-bundles">{t('buildSettings.splitBundles')}</option>
                                                            <option value="single-bundle">{t('buildSettings.singleBundle')}</option>
                                                            <option value="single-file">{t('buildSettings.singleFile')}</option>
                                                        </select>
                                                        <span className="build-settings-hint">
                                                            {settings.buildMode === 'split-bundles'
                                                                ? t('buildSettings.splitBundlesHint')
                                                                : settings.buildMode === 'single-bundle'
                                                                    ? t('buildSettings.singleBundleHint')
                                                                    : t('buildSettings.singleFileHint')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Player Settings Overrides | 玩家设置覆盖 */}
                            <div className="build-settings-card">
                                <div className="build-settings-card-header">
                                    {t('buildSettings.playerSettingsOverrides')}
                                    <button className="build-settings-more-btn">
                                        <Settings size={14} />
                                    </button>
                                </div>

                                <div className="build-settings-field-group">
                                    <div
                                        className="build-settings-field-header"
                                        onClick={() => toggleSection('playerSettings')}
                                    >
                                        {expandedSections.playerSettings ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        <span>{t('buildSettings.playerSettings')}</span>
                                    </div>
                                    {expandedSections.playerSettings && (
                                        <div className="build-settings-field-content">
                                            <div className="build-settings-form">
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.companyName')}</label>
                                                    <input
                                                        type="text"
                                                        value={settings.companyName}
                                                        onChange={e => setSettings(prev => ({
                                                            ...prev,
                                                            companyName: e.target.value
                                                        }))}
                                                    />
                                                </div>
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.productName')}</label>
                                                    <input
                                                        type="text"
                                                        value={settings.productName}
                                                        onChange={e => setSettings(prev => ({
                                                            ...prev,
                                                            productName: e.target.value
                                                        }))}
                                                    />
                                                </div>
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.version')}</label>
                                                    <input
                                                        type="text"
                                                        value={settings.version}
                                                        onChange={e => setSettings(prev => ({
                                                            ...prev,
                                                            version: e.target.value
                                                        }))}
                                                    />
                                                </div>
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.defaultIcon')}</label>
                                                    <div className="build-settings-icon-picker">
                                                        <span>{t('buildSettings.none')}</span>
                                                        <span className="build-settings-icon-hint">(Texture 2D)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="build-settings-no-selection">
                            <p>{t('buildSettings.selectPlatform')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Build Progress Dialog | 构建进度对话框 */}
            {showBuildProgress && (
                <div className="build-progress-overlay">
                    <div className="build-progress-dialog">
                        <div className="build-progress-header">
                            <h3>{t('buildSettings.buildInProgress')}</h3>
                            {!isBuilding && (
                                <button
                                    className="build-progress-close"
                                    onClick={handleCloseBuildProgress}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <div className="build-progress-content">
                            {/* Status Icon | 状态图标 */}
                            <div className="build-progress-status-icon">
                                {isBuilding ? (
                                    <Loader2 size={48} className="build-progress-spinner" />
                                ) : buildResult?.success ? (
                                    <CheckCircle size={48} className="build-progress-success" />
                                ) : (
                                    <XCircle size={48} className="build-progress-error" />
                                )}
                            </div>

                            {/* Status Message | 状态消息 */}
                            <div className="build-progress-message">
                                {isBuilding ? (
                                    buildProgress?.message || getStatusMessage(buildProgress?.status || BuildStatus.Preparing)
                                ) : buildResult?.success ? (
                                    t('buildSettings.buildSucceeded')
                                ) : (
                                    t('buildSettings.buildFailed')
                                )}
                            </div>

                            {/* Progress Bar | 进度条 */}
                            {isBuilding && buildProgress && (
                                <div className="build-progress-bar-container">
                                    <div
                                        className="build-progress-bar"
                                        style={{ width: `${buildProgress.progress}%` }}
                                    />
                                    <span className="build-progress-percent">
                                        {Math.round(buildProgress.progress)}%
                                    </span>
                                </div>
                            )}

                            {/* Build Result Details | 构建结果详情 */}
                            {!isBuilding && buildResult && (
                                <div className="build-result-details">
                                    {buildResult.success && (
                                        <>
                                            <div className="build-result-row">
                                                <span className="build-result-label">{t('buildSettings.outputPath')}:</span>
                                                <span className="build-result-value">{buildResult.outputPath}</span>
                                            </div>
                                            <div className="build-result-row">
                                                <span className="build-result-label">{t('buildSettings.duration')}:</span>
                                                <span className="build-result-value">
                                                    {(buildResult.duration / 1000).toFixed(2)}s
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {/* Error Message | 错误消息 */}
                                    {buildResult.error && (
                                        <BuildErrorDisplay error={buildResult.error} />
                                    )}

                                    {/* Warnings | 警告 */}
                                    {buildResult.warnings.length > 0 && (
                                        <div className="build-result-warnings">
                                            <div className="build-result-warnings-header">
                                                <AlertTriangle size={14} />
                                                <span>{t('buildSettings.warnings')} ({buildResult.warnings.length})</span>
                                            </div>
                                            <ul className="build-result-warnings-list">
                                                {buildResult.warnings.map((warning, index) => (
                                                    <li key={index}>{warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions | 操作按钮 */}
                        <div className="build-progress-actions">
                            {isBuilding ? (
                                <button
                                    className="build-settings-btn secondary"
                                    onClick={handleCancelBuild}
                                >
                                    {t('buildSettings.cancel')}
                                </button>
                            ) : (
                                <button
                                    className="build-settings-btn primary"
                                    onClick={handleCloseBuildProgress}
                                >
                                    {t('buildSettings.close')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BuildSettingsPanel;
