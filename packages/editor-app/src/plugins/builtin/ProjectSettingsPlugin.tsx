/**
 * Project Settings Plugin
 * 项目设置插件
 *
 * Registers project-level settings like UI design resolution.
 * 注册项目级别的设置，如 UI 设计分辨率。
 */

import type { ServiceContainer } from '@esengine/ecs-framework';
import { createLogger, Core } from '@esengine/ecs-framework';
import type { IPlugin, IEditorModuleLoader, PluginDescriptor } from '@esengine/editor-core';
import { SettingsRegistry, ProjectService } from '@esengine/editor-core';
import EngineService from '../../services/EngineService';

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

        settingsRegistry.registerCategory({
            id: 'project',
            title: '项目',
            description: '项目级别的配置',
            sections: [
                {
                    id: 'ui-settings',
                    title: 'UI 设置',
                    description: '配置 UI 系统的基础参数',
                    settings: [
                        {
                            key: 'project.uiDesignResolution.width',
                            label: '设计宽度',
                            type: 'number',
                            defaultValue: 1920,
                            description: 'UI 画布的设计宽度（像素）',
                            min: 320,
                            max: 7680,
                            step: 1
                        },
                        {
                            key: 'project.uiDesignResolution.height',
                            label: '设计高度',
                            type: 'number',
                            defaultValue: 1080,
                            description: 'UI 画布的设计高度（像素）',
                            min: 240,
                            max: 4320,
                            step: 1
                        },
                        {
                            key: 'project.uiDesignResolution.preset',
                            label: '分辨率预设',
                            type: 'select',
                            defaultValue: '1920x1080',
                            description: '选择常见的分辨率预设',
                            options: UI_RESOLUTION_PRESETS.map(p => ({
                                label: p.label,
                                value: `${p.value.width}x${p.value.height}`
                            }))
                        }
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

const descriptor: PluginDescriptor = {
    id: '@esengine/project-settings',
    name: 'Project Settings',
    version: '1.0.0',
    description: 'Configure project-level settings',
    category: 'tools',
    icon: 'Settings',
    enabledByDefault: true,
    canContainContent: false,
    isEnginePlugin: true,
    isCore: true,
    modules: [
        {
            name: 'ProjectSettingsEditor',
            type: 'editor',
            loadingPhase: 'postDefault'
        }
    ]
};

export const ProjectSettingsPlugin: IPlugin = {
    descriptor,
    editorModule: new ProjectSettingsEditorModule()
};
