/**
 * Blueprint Editor Plugin - Integrates blueprint editor with the editor
 * 蓝图编辑器插件 - 将蓝图编辑器与编辑器集成
 */

import {
    type ServiceContainer,
    type IPluginLoader,
    type IEditorModuleLoader,
    type PluginDescriptor,
    type PanelDescriptor,
    type MenuItemDescriptor,
    type FileActionHandler,
    type FileCreationTemplate,
    PanelPosition,
    FileSystem,
    createLogger,
    MessageHub,
    IMessageHub
} from '@esengine/editor-runtime';
import { BlueprintEditorPanel } from './components/BlueprintEditorPanel';
import { useBlueprintEditorStore } from './stores/blueprintEditorStore';
import { createEmptyBlueprint, validateBlueprintAsset } from '../types/blueprint';

const logger = createLogger('BlueprintEditorModule');

/**
 * Blueprint 编辑器模块
 * Blueprint editor module
 */
class BlueprintEditorModule implements IEditorModuleLoader {
    private services?: ServiceContainer;

    async install(services: ServiceContainer): Promise<void> {
        this.services = services;
        logger.info('Blueprint editor module installed');
    }

    async uninstall(): Promise<void> {
        logger.info('Blueprint editor module uninstalled');
    }

    getPanels(): PanelDescriptor[] {
        return [
            {
                id: 'panel-blueprint-editor',
                title: 'Blueprint Editor',
                position: PanelPosition.Center,
                defaultSize: 800,
                resizable: true,
                closable: true,
                icon: 'Workflow',
                order: 20,
                isDynamic: true,
                component: BlueprintEditorPanel
            }
        ];
    }

    getMenuItems(): MenuItemDescriptor[] {
        return [
            {
                id: 'blueprint-new',
                label: 'New Blueprint',
                parentId: 'file',
                shortcut: 'Ctrl+Shift+B',
                execute: () => {
                    useBlueprintEditorStore.getState().createNewBlueprint('New Blueprint');
                }
            },
            {
                id: 'view-blueprint-editor',
                label: 'Blueprint Editor',
                parentId: 'view',
                shortcut: 'Ctrl+B'
            }
        ];
    }

    getFileActionHandlers(): FileActionHandler[] {
        const services = this.services;
        return [
            {
                extensions: ['bp'],
                onDoubleClick: async (filePath: string) => {
                    try {
                        // 使用 FileSystem API 读取文件
                        const content = await FileSystem.readTextFile(filePath);
                        const data = JSON.parse(content);

                        if (validateBlueprintAsset(data)) {
                            useBlueprintEditorStore.getState().loadBlueprint(data, filePath);
                            logger.info('Loaded blueprint:', filePath);

                            // 打开蓝图编辑器面板
                            if (services) {
                                const messageHub = services.resolve<MessageHub>(IMessageHub);
                                if (messageHub) {
                                    const fileName = filePath.split(/[\\/]/).pop() || 'Blueprint';
                                    messageHub.publish('dynamic-panel:open', {
                                        panelId: 'panel-blueprint-editor',
                                        title: `Blueprint - ${fileName}`
                                    });
                                }
                            }
                        } else {
                            logger.error('Invalid blueprint file:', filePath);
                        }
                    } catch (error) {
                        logger.error('Failed to load blueprint:', error);
                    }
                }
            }
        ];
    }

    getFileCreationTemplates(): FileCreationTemplate[] {
        return [
            {
                id: 'create-blueprint',
                label: 'Blueprint',
                extension: 'bp',
                icon: 'Workflow',
                category: 'scripting',
                getContent: (fileName: string) => {
                    const name = fileName.replace('.bp', '');
                    const blueprint = createEmptyBlueprint(name);
                    return JSON.stringify(blueprint, null, 2);
                }
            }
        ];
    }

    async onEditorReady(): Promise<void> {
        logger.info('Editor ready');
    }

    async onProjectOpen(_projectPath: string): Promise<void> {
        logger.info('Project opened');
    }

    async onProjectClose(): Promise<void> {
        useBlueprintEditorStore.getState().createNewBlueprint('New Blueprint');
        logger.info('Project closed');
    }
}

/**
 * Plugin descriptor
 * 插件描述符
 */
const descriptor: PluginDescriptor = {
    id: '@esengine/blueprint',
    name: 'Blueprint Visual Scripting',
    version: '1.0.0',
    description: 'Visual scripting system for creating game logic without code',
    category: 'scripting',
    icon: 'Workflow',
    enabledByDefault: true,
    canContainContent: true,
    isEnginePlugin: true,
    isCore: false,
    modules: [
        {
            name: 'BlueprintEditor',
            type: 'editor',
            loadingPhase: 'default',
            panels: ['panel-blueprint-editor']
        }
    ]
};

/**
 * Blueprint Plugin Export
 * 蓝图插件导出
 */
export const BlueprintPlugin: IPluginLoader = {
    descriptor,
    editorModule: new BlueprintEditorModule()
};
