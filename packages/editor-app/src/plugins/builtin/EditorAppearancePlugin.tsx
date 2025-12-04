/**
 * Editor Appearance Plugin
 * 编辑器外观插件
 */

import type { ServiceContainer } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';
import type { IPlugin, IEditorModuleLoader, ModuleManifest } from '@esengine/editor-core';
import { SettingsRegistry } from '@esengine/editor-core';
import { SettingsService } from '../../services/SettingsService';

const logger = createLogger('EditorAppearancePlugin');

/**
 * Editor Appearance 编辑器模块
 */
class EditorAppearanceEditorModule implements IEditorModuleLoader {
    async install(services: ServiceContainer): Promise<void> {
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
                },
                {
                    id: 'scriptEditor',
                    title: '脚本编辑器',
                    description: '配置用于打开脚本文件的外部编辑器',
                    settings: [
                        {
                            key: 'editor.scriptEditor',
                            label: '脚本编辑器',
                            type: 'select',
                            defaultValue: 'system',
                            description: '双击脚本文件时使用的编辑器',
                            options: SettingsService.SCRIPT_EDITORS.map(editor => ({
                                value: editor.id,
                                label: editor.name
                            }))
                        },
                        {
                            key: 'editor.customScriptEditorCommand',
                            label: '自定义编辑器命令',
                            type: 'string',
                            defaultValue: '',
                            description: '当选择"自定义"时，填写编辑器的命令行命令（如 notepad++）',
                            placeholder: '例如：notepad++'
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

    private applyFontSettings(): void {
        const settings = SettingsService.getInstance();
        const baseFontSize = settings.get<number>('editor.fontSize', 13);

        logger.info(`Applying font size: ${baseFontSize}px`);

        const root = document.documentElement;
        root.style.setProperty('--font-size-xs', `${baseFontSize - 2}px`);
        root.style.setProperty('--font-size-sm', `${baseFontSize - 1}px`);
        root.style.setProperty('--font-size-base', `${baseFontSize}px`);
        root.style.setProperty('--font-size-md', `${baseFontSize + 1}px`);
        root.style.setProperty('--font-size-lg', `${baseFontSize + 3}px`);
        root.style.setProperty('--font-size-xl', `${baseFontSize + 5}px`);
    }

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

const manifest: ModuleManifest = {
    id: '@esengine/editor-appearance',
    name: '@esengine/editor-appearance',
    displayName: 'Editor Appearance',
    version: '1.0.0',
    description: 'Configure editor appearance settings',
    category: 'Other',
    icon: 'Palette',
    isCore: true,
    defaultEnabled: true,
    isEngineModule: true,
    canContainContent: false,
    dependencies: [],
    exports: {}
};

export const EditorAppearancePlugin: IPlugin = {
    manifest,
    editorModule: new EditorAppearanceEditorModule()
};
