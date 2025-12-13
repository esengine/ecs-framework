/**
 * Build Settings Store - 构建设置状态管理
 * Build Settings State Management
 *
 * 使用 Zustand 替代 BuildSettingsPanel 中的大量 useEffect 和 useState
 * Using Zustand to replace numerous useEffect and useState in BuildSettingsPanel
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
    BuildService,
    BuildProgress,
    BuildConfig,
    WebBuildConfig,
    WeChatBuildConfig,
    ProjectService,
    BuildSettingsConfig
} from '@esengine/editor-core';
import { BuildPlatform, BuildStatus } from '@esengine/editor-core';
import { EngineService } from '../services/EngineService';

// ============= Types =============

export type PlatformType =
    | 'windows'
    | 'macos'
    | 'linux'
    | 'android'
    | 'ios'
    | 'web'
    | 'wechat-minigame';

export interface BuildProfile {
    id: string;
    name: string;
    platform: PlatformType;
    isActive?: boolean;
}

export interface SceneEntry {
    path: string;
    enabled: boolean;
}

export interface BuildSettings {
    scenes: SceneEntry[];
    scriptingDefines: string[];
    companyName: string;
    productName: string;
    version: string;
    developmentBuild: boolean;
    sourceMap: boolean;
    compressionMethod: 'Default' | 'LZ4' | 'LZ4HC';
    buildMode: 'split-bundles' | 'single-bundle' | 'single-file';
}

export interface BuildResult {
    success: boolean;
    outputPath: string;
    duration: number;
    warnings: string[];
    error?: string;
}

interface BuildSettingsState {
    // 配置状态 | Profile state
    profiles: BuildProfile[];
    selectedPlatform: PlatformType;
    selectedProfile: BuildProfile | null;
    settings: BuildSettings;

    // UI 状态 | UI state
    expandedSections: Record<string, boolean>;

    // 构建状态 | Build state
    isBuilding: boolean;
    buildProgress: BuildProgress | null;
    buildResult: BuildResult | null;
    showBuildProgress: boolean;

    // 服务引用 | Service references
    _buildService: BuildService | null;
    _projectService: ProjectService | null;
    _projectPath: string | null;

    // 内部状态 | Internal state
    _initialized: boolean;
    _saveTimeout: NodeJS.Timeout | null;
    _progressInterval: NodeJS.Timeout | null;
}

interface BuildSettingsActions {
    // 初始化 | Initialization
    initialize: (params: {
        projectPath: string;
        buildService?: BuildService;
        projectService?: ProjectService;
        availableScenes?: string[];
    }) => void;
    cleanup: () => void;

    // 配置操作 | Profile actions
    setSelectedPlatform: (platform: PlatformType) => void;
    setSelectedProfile: (profile: BuildProfile | null) => void;
    addProfile: () => void;

    // 设置操作 | Settings actions
    updateSettings: (partial: Partial<BuildSettings>) => void;
    setSceneEnabled: (index: number, enabled: boolean) => void;
    addScene: (path: string) => void;
    addDefine: (define: string) => void;
    removeDefine: (index: number) => void;

    // UI 操作 | UI actions
    toggleSection: (section: string) => void;

    // 构建操作 | Build actions
    startBuild: () => Promise<void>;
    cancelBuild: () => void;
    closeBuildProgress: () => void;
}

export type BuildSettingsStore = BuildSettingsState & BuildSettingsActions;

// ============= Constants =============

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

const DEFAULT_PROFILES: BuildProfile[] = [
    { id: 'web-dev', name: 'Web - Development', platform: 'web', isActive: true },
    { id: 'web-prod', name: 'Web - Production', platform: 'web' },
    { id: 'wechat', name: 'WeChat Mini Game', platform: 'wechat-minigame' },
];

// ============= Helper Functions =============

const getPlatformEnum = (platformType: PlatformType): BuildPlatform => {
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
};

// ============= Store =============

export const useBuildSettingsStore = create<BuildSettingsStore>()(
    subscribeWithSelector((set, get) => ({
        // 初始状态 | Initial state
        profiles: DEFAULT_PROFILES,
        selectedPlatform: 'web',
        selectedProfile: DEFAULT_PROFILES[0] ?? null,
        settings: DEFAULT_SETTINGS,
        expandedSections: {
            sceneList: true,
            scriptingDefines: true,
            platformSettings: true,
            playerSettings: true,
        },
        isBuilding: false,
        buildProgress: null,
        buildResult: null,
        showBuildProgress: false,
        _buildService: null,
        _projectService: null,
        _projectPath: null,
        _initialized: false,
        _saveTimeout: null,
        _progressInterval: null,

        // ===== 初始化 | Initialization =====
        initialize: ({ projectPath, buildService, projectService, availableScenes }) => {
            const state = get();
            if (state._initialized) return;

            set({
                _buildService: buildService || null,
                _projectService: projectService || null,
                _projectPath: projectPath,
                _initialized: true,
            });

            // 从 projectService 加载已保存的设置
            // Load saved settings from projectService
            if (projectService) {
                const savedSettings = projectService.getBuildSettings();
                if (savedSettings) {
                    set(prev => ({
                        settings: {
                            ...prev.settings,
                            scriptingDefines: savedSettings.scriptingDefines || [],
                            companyName: savedSettings.companyName || prev.settings.companyName,
                            productName: savedSettings.productName || prev.settings.productName,
                            version: savedSettings.version || prev.settings.version,
                            developmentBuild: savedSettings.developmentBuild ?? prev.settings.developmentBuild,
                            sourceMap: savedSettings.sourceMap ?? prev.settings.sourceMap,
                            compressionMethod: savedSettings.compressionMethod || prev.settings.compressionMethod,
                            buildMode: savedSettings.buildMode || prev.settings.buildMode
                        }
                    }));
                }

                // 初始化场景列表
                // Initialize scene list
                if (availableScenes && availableScenes.length > 0) {
                    const savedScenes = savedSettings?.scenes || [];
                    set(prev => ({
                        settings: {
                            ...prev.settings,
                            scenes: availableScenes.map(path => ({
                                path,
                                enabled: savedScenes.length > 0 ? savedScenes.includes(path) : true
                            }))
                        }
                    }));
                }
            }
        },

        cleanup: () => {
            const state = get();

            // 清理定时器 | Clear timers
            if (state._saveTimeout) {
                clearTimeout(state._saveTimeout);
            }
            if (state._progressInterval) {
                clearInterval(state._progressInterval);
            }

            set({
                _buildService: null,
                _projectService: null,
                _projectPath: null,
                _initialized: false,
                _saveTimeout: null,
                _progressInterval: null,
                isBuilding: false,
                buildProgress: null,
                buildResult: null,
                showBuildProgress: false,
            });
        },

        // ===== 配置操作 | Profile actions =====
        setSelectedPlatform: (platform) => {
            const { profiles } = get();
            const profile = profiles.find(p => p.platform === platform);
            set({
                selectedPlatform: platform,
                selectedProfile: profile || null
            });
        },

        setSelectedProfile: (profile) => {
            set({
                selectedProfile: profile,
                selectedPlatform: profile?.platform || get().selectedPlatform
            });
        },

        addProfile: () => {
            const { selectedPlatform, profiles } = get();
            const newProfile: BuildProfile = {
                id: `profile-${Date.now()}`,
                name: `${selectedPlatform} - New Profile`,
                platform: selectedPlatform,
            };
            set({
                profiles: [...profiles, newProfile],
                selectedProfile: newProfile
            });
        },

        // ===== 设置操作 | Settings actions =====
        updateSettings: (partial) => {
            set(prev => ({
                settings: { ...prev.settings, ...partial }
            }));

            // 防抖保存 | Debounced save
            const state = get();
            if (state._saveTimeout) {
                clearTimeout(state._saveTimeout);
            }

            const timeout = setTimeout(() => {
                const { _projectService, settings } = get();
                if (_projectService) {
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
                    _projectService.updateBuildSettings(configToSave);
                }
            }, 500);

            set({ _saveTimeout: timeout });
        },

        setSceneEnabled: (index, enabled) => {
            set(prev => ({
                settings: {
                    ...prev.settings,
                    scenes: prev.settings.scenes.map((s, i) =>
                        i === index ? { ...s, enabled } : s
                    )
                }
            }));
            // 触发保存 | Trigger save
            get().updateSettings({});
        },

        addScene: (path) => {
            const { settings } = get();
            if (settings.scenes.some(s => s.path === path)) return;

            set(prev => ({
                settings: {
                    ...prev.settings,
                    scenes: [...prev.settings.scenes, { path, enabled: true }]
                }
            }));
            get().updateSettings({});
        },

        addDefine: (define) => {
            set(prev => ({
                settings: {
                    ...prev.settings,
                    scriptingDefines: [...prev.settings.scriptingDefines, define]
                }
            }));
            get().updateSettings({});
        },

        removeDefine: (index) => {
            set(prev => ({
                settings: {
                    ...prev.settings,
                    scriptingDefines: prev.settings.scriptingDefines.filter((_, i) => i !== index)
                }
            }));
            get().updateSettings({});
        },

        // ===== UI 操作 | UI actions =====
        toggleSection: (section) => {
            set(prev => ({
                expandedSections: {
                    ...prev.expandedSections,
                    [section]: !prev.expandedSections[section]
                }
            }));
        },

        // ===== 构建操作 | Build actions =====
        startBuild: async () => {
            const { selectedProfile, settings, _buildService, _projectPath } = get();

            if (!selectedProfile || !_projectPath || !_buildService) {
                console.warn('Cannot start build: missing profile, path, or service');
                return;
            }

            set({
                isBuilding: true,
                buildProgress: null,
                buildResult: null,
                showBuildProgress: true,
            });

            // 启动进度轮询（但不用 setInterval，用 buildService 的回调）
            // Start progress polling (but use buildService callback, not setInterval)

            try {
                const platform = getPlatformEnum(selectedProfile.platform);
                const baseConfig = {
                    platform,
                    outputPath: `${_projectPath}/build/${selectedProfile.platform}`,
                    isRelease: !settings.developmentBuild,
                    sourceMap: settings.sourceMap,
                    scenes: settings.scenes.filter(s => s.enabled).map(s => s.path)
                };

                let buildConfig: BuildConfig;
                if (platform === BuildPlatform.Web) {
                    // 从 AssetLoaderFactory 获取插件注册的扩展名
                    // Get plugin-registered extensions from AssetLoaderFactory
                    let assetExtensions: string[] | undefined;
                    let assetTypeMap: Record<string, string> | undefined;

                    try {
                        const assetManager = EngineService.getInstance().getAssetManager();
                        if (assetManager) {
                            const loaderFactory = assetManager.getLoaderFactory();
                            assetExtensions = loaderFactory.getAllSupportedExtensions();
                            assetTypeMap = loaderFactory.getExtensionTypeMap();
                        }
                    } catch (e) {
                        console.warn('Failed to get asset extensions from loader factory:', e);
                    }

                    const webConfig: WebBuildConfig = {
                        ...baseConfig,
                        platform: BuildPlatform.Web,
                        buildMode: settings.buildMode,
                        generateHtml: true,
                        minify: !settings.developmentBuild,
                        generateAssetCatalog: true,
                        assetLoadingStrategy: 'on-demand',
                        assetExtensions,
                        assetTypeMap
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

                // 使用回调更新进度，而不是轮询
                // Use callback to update progress, not polling
                const result = await _buildService.build(buildConfig, (progress) => {
                    set({ buildProgress: progress });
                });

                set({
                    buildResult: {
                        success: result.success,
                        outputPath: result.outputPath,
                        duration: result.duration,
                        warnings: result.warnings,
                        error: result.error
                    }
                });
            } catch (error) {
                console.error('Build failed:', error);
                set({
                    buildResult: {
                        success: false,
                        outputPath: '',
                        duration: 0,
                        warnings: [],
                        error: error instanceof Error ? error.message : String(error)
                    }
                });
            } finally {
                set({ isBuilding: false });
            }
        },

        cancelBuild: () => {
            const { _buildService } = get();
            if (_buildService) {
                _buildService.cancelBuild();
            }
        },

        closeBuildProgress: () => {
            const { isBuilding } = get();
            if (!isBuilding) {
                set({
                    showBuildProgress: false,
                    buildProgress: null,
                    buildResult: null,
                });
            }
        },
    }))
);

// ============= Selectors =============

/** 获取当前平台的配置列表 | Get profiles for current platform */
export const selectProfilesForPlatform = (state: BuildSettingsStore): BuildProfile[] => {
    return state.profiles.filter(p => p.platform === state.selectedPlatform);
};

/** 获取启用的场景列表 | Get enabled scenes */
export const selectEnabledScenes = (state: BuildSettingsStore): string[] => {
    return state.settings.scenes.filter(s => s.enabled).map(s => s.path);
};
