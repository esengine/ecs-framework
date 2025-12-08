/**
 * Blueprint Editor Plugin
 * 蓝图编辑器插件
 */

import { Core, type ServiceContainer } from '@esengine/ecs-framework';
import type { ModuleManifest } from '@esengine/engine-core';
import type { IEditorPlugin, IEditorModuleLoader, PanelDescriptor, FileActionHandler, FileCreationTemplate } from '@esengine/editor-core';
import { MessageHub, PanelPosition } from '@esengine/editor-core';

// Re-export from @esengine/blueprint for runtime module
import { NodeRegistry, BlueprintVM, createBlueprintSystem } from '@esengine/blueprint';

// Store for pending file path
import { useBlueprintEditorStore } from './stores/blueprintEditorStore';

// Direct import of panel component (not dynamic import)
import { BlueprintEditorPanel } from './components/BlueprintEditorPanel';

/**
 * Blueprint Editor Module Implementation
 * 蓝图编辑器模块实现
 */
class BlueprintEditorModuleImpl implements IEditorModuleLoader {
    async install(_services: ServiceContainer): Promise<void> {
        // Editor module installation
    }

    async uninstall(): Promise<void> {
        // Cleanup
    }

    getPanels(): PanelDescriptor[] {
        return [
            {
                id: 'blueprint-editor',
                title: 'Blueprint Editor',
                position: PanelPosition.Center,
                icon: 'Workflow',
                closable: true,
                resizable: true,
                order: 50,
                component: BlueprintEditorPanel,
                isDynamic: true
            }
        ];
    }

    getFileActionHandlers(): FileActionHandler[] {
        return [
            {
                // 扩展名不带点号，与 FileActionRegistry.getFileExtension() 保持一致
                // Extensions without dot prefix, consistent with FileActionRegistry.getFileExtension()
                extensions: ['blueprint', 'bp'],
                onDoubleClick: (filePath: string) => {
                    // 设置待加载的文件路径到 store
                    // Set pending file path to store
                    useBlueprintEditorStore.getState().setPendingFilePath(filePath);

                    // 通过 MessageHub 打开蓝图编辑器面板
                    // Open blueprint editor panel via MessageHub
                    const messageHub = Core.services.resolve(MessageHub);
                    if (messageHub) {
                        messageHub.publish('dynamic-panel:open', {
                            panelId: 'blueprint-editor',
                            title: `Blueprint - ${filePath.split(/[\\/]/).pop()}`
                        });
                    }
                }
            }
        ];
    }

    getFileCreationTemplates(): FileCreationTemplate[] {
        return [
            {
                id: 'blueprint',
                label: 'Blueprint',
                // 扩展名不带点号，FileTree 会自动添加点号
                // Extension without dot, FileTree will add the dot automatically
                extension: 'blueprint',
                icon: 'Workflow',
                getContent: (fileName: string) => {
                    const name = fileName.replace(/\.blueprint$/i, '') || 'NewBlueprint';
                    return JSON.stringify({
                        version: '1.0.0',
                        name,
                        nodes: [],
                        connections: [],
                        variables: []
                    }, null, 2);
                }
            }
        ];
    }
}

const manifest: ModuleManifest = {
    id: '@esengine/blueprint',
    name: '@esengine/blueprint',
    displayName: 'Blueprint',
    version: '1.0.0',
    description: 'Visual scripting system for ECS Framework',
    category: 'Other',
    isCore: false,
    defaultEnabled: false,
    isEngineModule: true,
    canContainContent: true,
    dependencies: ['engine-core'],
    exports: {
        components: ['BlueprintComponent'],
        systems: ['BlueprintSystem'],
        other: ['NodeRegistry', 'BlueprintVM']
    }
};

/**
 * Complete Blueprint plugin with both runtime and editor modules
 * 完整的蓝图插件，包含运行时和编辑器模块
 */
export const BlueprintPlugin: IEditorPlugin = {
    manifest,
    editorModule: new BlueprintEditorModuleImpl()
};

// Also export the editor module instance for direct use
export const BlueprintEditorModule = new BlueprintEditorModuleImpl();

// Re-export useful items
export { NodeRegistry, BlueprintVM, createBlueprintSystem };
