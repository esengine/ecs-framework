/**
 * Project Settings Plugin
 * 项目设置插件
 *
 * Registers project-level settings like UI design resolution.
 * 注册项目级别的设置，如 UI 设计分辨率。
 */

import type { ServiceContainer } from '@esengine/ecs-framework';
import { createLogger, Core } from '@esengine/ecs-framework';
import type { IPlugin, IEditorModuleLoader, ModuleManifest } from '@esengine/editor-core';
import { SettingsRegistry, ProjectService, moduleRegistry } from '@esengine/editor-core';
import EngineService from '../../services/EngineService';

/**
 * Get engine modules from ModuleRegistry.
 * 从 ModuleRegistry 获取引擎模块。
 *
 * Returns all registered modules from the module registry.
 * 返回模块注册表中的所有已注册模块。
 */
function getModuleManifests(): ModuleManifest[] {
    // Get modules from moduleRegistry singleton
    // 从 moduleRegistry 单例获取模块
    const modules = moduleRegistry.getAllModules();
    console.log('[ProjectSettingsPlugin] getModuleManifests: got', modules.length, 'modules from registry');
    return modules;
}

const logger = createLogger('ProjectSettingsPlugin');

/**
 * Common UI design resolution presets
 * 常见的 UI 设计分辨率预设
 */
export const UI_RESOLUTION_PRESETS = [
    { label: '1920 x 1080 (Full HD)', value: { width: 1920, height: 1080 } },
    { label: '1280 x 720 (HD)', value: { width: 1280, height: 720 } },
    { label: '1366 x 768 (HD+)', value: { width: 1366, height: 768 } },
    { label: '2560 x 1440 (2K)', value: { width: 2560, height: 1440 } },
    { label: '3840 x 2160 (4K)', value: { width: 3840, height: 2160 } },
    { label: '750 x 1334 (iPhone 6/7/8)', value: { width: 750, height: 1334 } },
    { label: '1125 x 2436 (iPhone X/11/12)', value: { width: 1125, height: 2436 } },
    { label: '1080 x 1920 (Mobile Portrait)', value: { width: 1080, height: 1920 } },
    { label: '800 x 600 (SVGA)', value: { width: 800, height: 600 } },
    { label: '1024 x 768 (XGA)', value: { width: 1024, height: 768 } },
];

/**
 * Project Settings 编辑器模块
 */
class ProjectSettingsEditorModule implements IEditorModuleLoader {
    private settingsListener: ((event: Event) => void) | null = null;

    async install(services: ServiceContainer): Promise<void> {
        const settingsRegistry = services.resolve(SettingsRegistry);

        // Setup listener for UI design resolution changes
        this.setupSettingsListener();

        // Register settings using translation keys (prefixed with '$')
        // 使用翻译键注册设置（以 '$' 为前缀）
        settingsRegistry.registerCategory({
            id: 'project',
            title: '$pluginSettings.project.title',
            description: '$pluginSettings.project.description',
            sections: [
                {
                    id: 'ui-settings',
                    title: '$pluginSettings.project.uiSettings.title',
                    description: '$pluginSettings.project.uiSettings.description',
                    settings: [
                        {
                            key: 'project.uiDesignResolution.width',
                            label: '$pluginSettings.project.uiSettings.designWidth.label',
                            type: 'number',
                            defaultValue: 1920,
                            description: '$pluginSettings.project.uiSettings.designWidth.description',
                            min: 320,
                            max: 7680,
                            step: 1
                        },
                        {
                            key: 'project.uiDesignResolution.height',
                            label: '$pluginSettings.project.uiSettings.designHeight.label',
                            type: 'number',
                            defaultValue: 1080,
                            description: '$pluginSettings.project.uiSettings.designHeight.description',
                            min: 240,
                            max: 4320,
                            step: 1
                        },
                        {
                            key: 'project.uiDesignResolution.preset',
                            label: '$pluginSettings.project.uiSettings.resolutionPreset.label',
                            type: 'select',
                            defaultValue: '1920x1080',
                            description: '$pluginSettings.project.uiSettings.resolutionPreset.description',
                            // Resolution preset options use static labels (not localized)
                            // 分辨率预设选项使用静态标签（不本地化）
                            options: UI_RESOLUTION_PRESETS.map(p => ({
                                label: p.label,
                                value: `${p.value.width}x${p.value.height}`
                            }))
                        }
                    ]
                },
                {
                    id: 'modules',
                    title: '$pluginSettings.project.modules.title',
                    description: '$pluginSettings.project.modules.description',
                    settings: [
                        {
                            key: 'project.disabledModules',
                            label: '$pluginSettings.project.modules.list.label',
                            type: 'moduleList',
                            // Default: no modules disabled (all enabled)
                            // 默认：没有禁用的模块（全部启用）
                            defaultValue: [],
                            description: '$pluginSettings.project.modules.list.description',
                            // Custom props for moduleList type
                            // Modules are loaded dynamically from ModuleRegistry (sizes from module.json)
                            // 模块从 ModuleRegistry 动态加载（大小来自 module.json）
                            getModules: getModuleManifests,
                            // Use blacklist mode: store disabled modules instead of enabled
                            // 使用黑名单模式：存储禁用的模块而不是启用的
                            useBlacklist: true,
                            validateDisable: async (moduleId: string) => {
                                // Use moduleRegistry singleton for validation
                                // 使用 moduleRegistry 单例进行验证
                                const validation = await moduleRegistry.validateDisable(moduleId);
                                if (!validation.canDisable) {
                                    return { canDisable: false, reason: validation.message };
                                }
                                return { canDisable: true };
                            }
                        } as any  // Cast to any to allow custom props
                    ]
                }
            ]
        });

        logger.info('Installed');
    }

    async uninstall(): Promise<void> {
        // Remove settings listener
        if (this.settingsListener) {
            window.removeEventListener('settings:changed', this.settingsListener);
            this.settingsListener = null;
        }
        logger.info('Uninstalled');
    }

    async onEditorReady(): Promise<void> {
        logger.info('Editor is ready');
    }

    /**
     * Setup listener for settings changes
     * 设置设置变化监听器
     */
    private setupSettingsListener(): void {
        this.settingsListener = ((event: CustomEvent) => {
            const changedSettings = event.detail;

            // Check if UI design resolution changed
            if ('project.uiDesignResolution.width' in changedSettings ||
                'project.uiDesignResolution.height' in changedSettings ||
                'project.uiDesignResolution.preset' in changedSettings) {

                logger.info('UI design resolution changed, applying...');
                this.applyUIDesignResolution();
            }
        }) as EventListener;

        window.addEventListener('settings:changed', this.settingsListener);
    }

    /**
     * Apply UI design resolution from ProjectService
     * 从 ProjectService 应用 UI 设计分辨率
     */
    private applyUIDesignResolution(): void {
        const projectService = Core.services.tryResolve<ProjectService>(ProjectService);
        if (!projectService) {
            logger.warn('ProjectService not available');
            return;
        }

        const resolution = projectService.getUIDesignResolution();
        const engineService = EngineService.getInstance();

        if (engineService.isInitialized()) {
            engineService.setUICanvasSize(resolution.width, resolution.height);
            logger.info(`Applied UI design resolution: ${resolution.width}x${resolution.height}`);
        }
    }
}

const manifest: ModuleManifest = {
    id: '@esengine/project-settings',
    name: '@esengine/project-settings',
    displayName: 'Project Settings',
    version: '1.0.0',
    description: 'Configure project-level settings',
    category: 'Other',
    icon: 'Settings',
    isCore: true,
    defaultEnabled: true,
    isEngineModule: true,
    canContainContent: false,
    dependencies: [],
    exports: {}
};

export const ProjectSettingsPlugin: IPlugin = {
    manifest,
    editorModule: new ProjectSettingsEditorModule()
};
