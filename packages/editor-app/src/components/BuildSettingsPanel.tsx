/**
 * Build Settings Panel.
 * 构建设置面板。
 *
 * Provides build settings interface for managing platform builds,
 * scenes, and player settings.
 * 提供构建设置界面，用于管理平台构建、场景和玩家设置。
 *
 * 使用 Zustand store 管理状态，避免 useEffect 过多导致的重渲染问题
 * Uses Zustand store for state management to avoid re-render issues from too many useEffects
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Monitor, Apple, Smartphone, Globe, Server, Gamepad2,
    Plus, Minus, ChevronDown, ChevronRight, Settings,
    Package, Loader2, CheckCircle, XCircle, AlertTriangle, X, Copy, Check, FolderOpen
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import type { BuildService, SceneManagerService, ProjectService } from '@esengine/editor-core';
import { BuildStatus } from '@esengine/editor-core';
import { useLocale } from '../hooks/useLocale';
import { useShallow } from 'zustand/react/shallow';
import {
    useBuildSettingsStore,
    type PlatformType,
    type BuildProfile,
    type BuildSettings,
} from '../stores/BuildSettingsStore';
import '../styles/BuildSettingsPanel.css';

// ==================== Types | 类型定义 ====================
// 类型定义已移至 BuildSettingsStore.ts
// Type definitions moved to BuildSettingsStore.ts

/** Platform configuration | 平台配置 */
interface PlatformConfig {
    platform: PlatformType;
    label: string;
    icon: React.ReactNode;
    available: boolean;
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

    // 使用 Zustand store 替代本地状态（使用 useShallow 避免不必要的重渲染）
    // Use Zustand store instead of local state (use useShallow to avoid unnecessary re-renders)
    const {
        profiles,
        selectedPlatform,
        selectedProfile,
        settings,
        expandedSections,
        isBuilding,
        buildProgress,
        buildResult,
        showBuildProgress,
    } = useBuildSettingsStore(useShallow(state => ({
        profiles: state.profiles,
        selectedPlatform: state.selectedPlatform,
        selectedProfile: state.selectedProfile,
        settings: state.settings,
        expandedSections: state.expandedSections,
        isBuilding: state.isBuilding,
        buildProgress: state.buildProgress,
        buildResult: state.buildResult,
        showBuildProgress: state.showBuildProgress,
    })));

    // 获取 store actions（通过 getState 获取，这些不会触发重渲染）
    // Get store actions via getState (these don't trigger re-renders)
    const store = useBuildSettingsStore.getState();
    const {
        setSelectedPlatform: handlePlatformSelect,
        setSelectedProfile: handleProfileSelect,
        addProfile: handleAddProfile,
        updateSettings,
        setSceneEnabled,
        addDefine,
        removeDefine: handleRemoveDefine,
        toggleSection,
        cancelBuild: handleCancelBuild,
        closeBuildProgress: handleCloseBuildProgress,
    } = store;

    // 初始化 store（仅在 mount 时）
    // Initialize store (only on mount)
    useEffect(() => {
        if (projectPath) {
            useBuildSettingsStore.getState().initialize({
                projectPath,
                buildService,
                projectService,
                availableScenes,
            });
        }
        return () => useBuildSettingsStore.getState().cleanup();
    }, [projectPath]); // 只依赖 projectPath，避免频繁重初始化

    // 当前平台的配置列表（使用 useMemo 避免每次重新过滤）
    // Profiles for current platform (use useMemo to avoid re-filtering every time)
    const platformProfiles = useMemo(
        () => profiles.filter(p => p.platform === selectedPlatform),
        [profiles, selectedPlatform]
    );

    // 构建处理 | Build handler
    const handleBuild = useCallback(async () => {
        if (!selectedProfile || !projectPath) return;

        // Call external handler if provided
        if (onBuild) {
            onBuild(selectedProfile, settings);
        }

        // 使用 store 的构建操作 | Use store's build action
        await useBuildSettingsStore.getState().startBuild();
    }, [selectedProfile, projectPath, onBuild, settings]);

    // 添加当前场景 | Add current scene
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

        // 检查场景是否已在列表中 | Check if scene is already in the list
        const exists = settings.scenes.some(s => s.path === currentScenePath);
        if (exists) {
            console.log('Scene already in list:', currentScenePath);
            return;
        }

        // 使用 store 添加场景 | Use store to add scene
        useBuildSettingsStore.getState().addScene(currentScenePath);
    }, [sceneManager, settings.scenes]);

    // 添加脚本定义（带 prompt）| Add scripting define (with prompt)
    const handleAddDefine = useCallback(() => {
        const define = prompt('Enter scripting define:');
        if (define) {
            addDefine(define);
        }
    }, [addDefine]);

    // 获取状态消息 | Get status message
    const getStatusMessage = useCallback((status: BuildStatus): string => {
        return t(buildStatusKeys[status]) || status;
    }, [t]);

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
                                                                onChange={e => setSceneEnabled(index, e.target.checked)}
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
                                                        onChange={e => updateSettings({ developmentBuild: e.target.checked })}
                                                    />
                                                </div>
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.sourceMap')}</label>
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.sourceMap}
                                                        onChange={e => updateSettings({ sourceMap: e.target.checked })}
                                                    />
                                                </div>
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.compressionMethod')}</label>
                                                    <select
                                                        value={settings.compressionMethod}
                                                        onChange={e => updateSettings({ compressionMethod: e.target.value as 'Default' | 'LZ4' | 'LZ4HC' })}
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
                                                            onChange={e => updateSettings({ buildMode: e.target.value as 'split-bundles' | 'single-bundle' | 'single-file' })}
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
                                                        onChange={e => updateSettings({ companyName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.productName')}</label>
                                                    <input
                                                        type="text"
                                                        value={settings.productName}
                                                        onChange={e => updateSettings({ productName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="build-settings-form-row">
                                                    <label>{t('buildSettings.version')}</label>
                                                    <input
                                                        type="text"
                                                        value={settings.version}
                                                        onChange={e => updateSettings({ version: e.target.value })}
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
                                    <Loader2 size={36} className="build-progress-spinner" />
                                ) : buildResult?.success ? (
                                    <CheckCircle size={40} className="build-progress-success" />
                                ) : (
                                    <XCircle size={40} className="build-progress-error" />
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
                                <>
                                    <button
                                        className="build-settings-btn secondary"
                                        onClick={handleCloseBuildProgress}
                                    >
                                        {t('buildSettings.close')}
                                    </button>
                                    {buildResult?.success && buildResult.outputPath && (
                                        <button
                                            className="build-settings-btn primary"
                                            onClick={() => {
                                                // 使用 Tauri 打开文件夹
                                                // Use Tauri to open folder
                                                invoke('open_folder', { path: buildResult.outputPath }).catch(e => {
                                                    console.error('Failed to open folder:', e);
                                                });
                                            }}
                                        >
                                            <FolderOpen size={14} />
                                            {t('buildSettings.openFolder')}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BuildSettingsPanel;
