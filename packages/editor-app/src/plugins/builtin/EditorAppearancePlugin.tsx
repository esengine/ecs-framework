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

        // Register settings using translation keys (prefixed with '$')
        // 使用翻译键注册设置（以 '$' 为前缀）
        settingsRegistry.registerCategory({
            id: 'appearance',
            title: '$pluginSettings.appearance.title',
            description: '$pluginSettings.appearance.description',
            sections: [
                {
                    id: 'font',
                    title: '$pluginSettings.appearance.font.title',
                    description: '$pluginSettings.appearance.font.description',
                    settings: [
                        {
                            key: 'editor.fontSize',
                            label: '$pluginSettings.appearance.font.fontSize.label',
                            type: 'range',
                            defaultValue: 13,
                            description: '$pluginSettings.appearance.font.fontSize.description',
                            min: 11,
                            max: 18,
                            step: 1
                        }
                    ]
                },
                {
                    id: 'inspector',
                    title: '$pluginSettings.appearance.inspector.title',
                    description: '$pluginSettings.appearance.inspector.description',
                    settings: [
                        {
                            key: 'inspector.decimalPlaces',
                            label: '$pluginSettings.appearance.inspector.decimalPlaces.label',
                            type: 'number',
                            defaultValue: 4,
                            description: '$pluginSettings.appearance.inspector.decimalPlaces.description',
                            min: -1,
                            max: 10,
                            step: 1
                        }
                    ]
                },
                {
                    id: 'scriptEditor',
                    title: '$pluginSettings.appearance.scriptEditor.title',
                    description: '$pluginSettings.appearance.scriptEditor.description',
                    settings: [
                        {
                            key: 'editor.scriptEditor',
                            label: '$pluginSettings.appearance.scriptEditor.editor.label',
                            type: 'select',
                            defaultValue: 'system',
                            description: '$pluginSettings.appearance.scriptEditor.editor.description',
                            options: SettingsService.SCRIPT_EDITORS.map(editor => ({
                                value: editor.id,
                                label: editor.name
                            }))
                        },
                        {
                            key: 'editor.customScriptEditorCommand',
                            label: '$pluginSettings.appearance.scriptEditor.customCommand.label',
                            type: 'string',
                            defaultValue: '',
                            description: '$pluginSettings.appearance.scriptEditor.customCommand.description',
                            placeholder: '$pluginSettings.appearance.scriptEditor.customCommand.placeholder'
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
