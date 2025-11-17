import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';
import { IEditorPlugin, EditorPluginCategory, SettingsRegistry } from '@esengine/editor-core';
import { SettingsService } from '../services/SettingsService';

const logger = createLogger('EditorAppearancePlugin');

/**
 * Editor Appearance Plugin
 *
 * Manages editor appearance settings like font size
 */
export class EditorAppearancePlugin implements IEditorPlugin {
    readonly name = '@esengine/editor-appearance';
    readonly version = '1.0.0';
    readonly displayName = 'Editor Appearance';
    readonly category = EditorPluginCategory.System;
    readonly description = 'Configure editor appearance settings';
    readonly icon = '🎨';

    async install(_core: Core, services: ServiceContainer): Promise<void> {
        const settingsRegistry = services.resolve(SettingsRegistry);

        settingsRegistry.registerCategory({
            id: 'appearance',
            title: '外观',
            description: '配置编辑器的外观设置',
            sections: [
                {
                    id: 'font',
                    title: '字体设置',
                    description: '配置编辑器字体样式',
                    settings: [
                        {
                            key: 'editor.fontSize',
                            label: '字体大小 (px)',
                            type: 'range',
                            defaultValue: 13,
                            description: '编辑器界面的字体大小',
                            min: 11,
                            max: 18,
                            step: 1
                        }
                    ]
                },
                {
                    id: 'inspector',
                    title: '检视器设置',
                    description: '配置属性检视器显示',
                    settings: [
                        {
                            key: 'inspector.decimalPlaces',
                            label: '数字小数位数',
                            type: 'number',
                            defaultValue: 4,
                            description: '数字类型属性显示的小数位数，设置为 -1 表示不限制',
                            min: -1,
                            max: 10,
                            step: 1
                        }
                    ]
                }
            ]
        });

        this.applyFontSettings();
        this.setupSettingsListener();

        logger.info('Installed');
    }

    async uninstall(): Promise<void> {
        logger.info('Uninstalled');
    }

    async onEditorReady(): Promise<void> {
        logger.info('Editor is ready');
    }

    /**
   * Apply font settings from settings
   */
    private applyFontSettings(): void {
        const settings = SettingsService.getInstance();
        const baseFontSize = settings.get<number>('editor.fontSize', 13);

        logger.info(`Applying font size: ${baseFontSize}px`);

        const root = document.documentElement;

        // Apply font sizes
        root.style.setProperty('--font-size-xs', `${baseFontSize - 2}px`);
        root.style.setProperty('--font-size-sm', `${baseFontSize - 1}px`);
        root.style.setProperty('--font-size-base', `${baseFontSize}px`);
        root.style.setProperty('--font-size-md', `${baseFontSize + 1}px`);
        root.style.setProperty('--font-size-lg', `${baseFontSize + 3}px`);
        root.style.setProperty('--font-size-xl', `${baseFontSize + 5}px`);
    }

    /**
   * Listen for settings changes
   */
    private setupSettingsListener(): void {
        window.addEventListener('settings:changed', ((event: CustomEvent) => {
            const changedSettings = event.detail;
            logger.info('Settings changed event received', changedSettings);

            if ('editor.fontSize' in changedSettings) {
                logger.info('Font size changed, applying...');
                this.applyFontSettings();
            }
        }) as EventListener);
    }
}
