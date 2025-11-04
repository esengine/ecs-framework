import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import { IEditorPlugin, EditorPluginCategory, PanelPosition, MessageHub } from '@esengine/editor-core';
import type { MenuItem, ToolbarItem, PanelDescriptor, ISerializer, FileActionHandler, FileCreationTemplate, FileContextMenuItem } from '@esengine/editor-core';
import { BehaviorTreeData } from '@esengine/behavior-tree';
import { BehaviorTreeEditorPanel } from '../presentation/components/behavior-tree/panels';
import { FileText } from 'lucide-react';
import { TauriAPI } from '../api/tauri';
import { createElement } from 'react';
import { useBehaviorTreeStore } from '../stores/behaviorTreeStore';

/**
 * 行为树编辑器插件
 *
 * 提供行为树的可视化编辑功能
 */
export class BehaviorTreePlugin implements IEditorPlugin {
    readonly name = '@esengine/behavior-tree-editor';
    readonly version = '1.0.0';
    readonly displayName = 'Behavior Tree Editor';
    readonly category = EditorPluginCategory.Tool;
    readonly description = 'Visual behavior tree editor for AI development';
    readonly icon = 'Network';

    private core?: Core;
    private services?: ServiceContainer;
    private messageHub?: MessageHub;

    async install(core: Core, services: ServiceContainer): Promise<void> {
        this.core = core;
        this.services = services;
        this.messageHub = services.resolve(MessageHub);
    }

    async uninstall(): Promise<void> {
        this.core = undefined;
        this.services = undefined;
    }

    registerMenuItems(): MenuItem[] {
        return [];
    }

    registerToolbar(): ToolbarItem[] {
        return [];
    }

    registerPanels(): PanelDescriptor[] {
        return [
            {
                id: 'behavior-tree-editor',
                title: '行为树编辑器',
                icon: 'Network',
                component: BehaviorTreeEditorPanel,
                position: PanelPosition.Center,
                defaultSize: 400,
                closable: true,
                isDynamic: true
            }
        ];
    }

    getSerializers(): ISerializer[] {
        return [
            {
                serialize: (data: BehaviorTreeData) => {
                    const json = this.serializeBehaviorTreeData(data);
                    const encoder = new TextEncoder();
                    return encoder.encode(json);
                },
                deserialize: (data: Uint8Array) => {
                    const decoder = new TextDecoder();
                    const json = decoder.decode(data);
                    return this.deserializeBehaviorTreeData(json);
                },
                getSupportedType: () => 'behavior-tree'
            }
        ];
    }

    async onEditorReady(): Promise<void> {
        console.log('[BehaviorTreePlugin] Editor is ready');
    }

    async onProjectOpen(projectPath: string): Promise<void> {
        console.log(`[BehaviorTreePlugin] Project opened: ${projectPath}`);
    }

    async onProjectClose(): Promise<void> {
        console.log('[BehaviorTreePlugin] Project closed');
    }

    async onBeforeSave(filePath: string, data: any): Promise<void> {
        if (filePath.endsWith('.behavior-tree.json')) {
            console.log('[BehaviorTreePlugin] Validating behavior tree before save');
            const isValid = this.validateBehaviorTreeData(data);
            if (!isValid) {
                throw new Error('Invalid behavior tree data');
            }
        }
    }

    async onAfterSave(filePath: string): Promise<void> {
        if (filePath.endsWith('.behavior-tree.json')) {
            console.log(`[BehaviorTreePlugin] Behavior tree saved: ${filePath}`);
        }
    }

    registerFileActionHandlers(): FileActionHandler[] {
        return [
            {
                extensions: ['btree'],
                onDoubleClick: async (filePath: string) => {
                    console.log('[BehaviorTreePlugin] onDoubleClick called for:', filePath);

                    if (this.messageHub) {
                        useBehaviorTreeStore.getState().setIsOpen(true);

                        await this.messageHub.publish('dynamic-panel:open', {
                            panelId: 'behavior-tree-editor'
                        });

                        await this.messageHub.publish('behavior-tree:open-file', {
                            filePath: filePath
                        });
                        console.log('[BehaviorTreePlugin] Panel opened and file loaded');
                    } else {
                        console.error('[BehaviorTreePlugin] MessageHub is not available!');
                    }
                },
                onOpen: async (filePath: string) => {
                    if (this.messageHub) {
                        useBehaviorTreeStore.getState().setIsOpen(true);

                        await this.messageHub.publish('dynamic-panel:open', {
                            panelId: 'behavior-tree-editor'
                        });

                        await this.messageHub.publish('behavior-tree:open-file', {
                            filePath: filePath
                        });
                    }
                },
                getContextMenuItems: (filePath: string, parentPath: string): FileContextMenuItem[] => {
                    return [
                        {
                            label: '打开行为树编辑器',
                            icon: createElement(FileText, { size: 16 }),
                            onClick: async (filePath: string) => {
                                if (this.messageHub) {
                                    useBehaviorTreeStore.getState().setIsOpen(true);

                                    await this.messageHub.publish('dynamic-panel:open', {
                                        panelId: 'behavior-tree-editor'
                                    });

                                    await this.messageHub.publish('behavior-tree:open-file', {
                                        filePath: filePath
                                    });
                                }
                            }
                        }
                    ];
                }
            }
        ];
    }

    registerFileCreationTemplates(): FileCreationTemplate[] {
        return [
            {
                label: '行为树',
                extension: 'btree',
                defaultFileName: 'NewBehaviorTree',
                icon: createElement(FileText, { size: 16 }),
                createContent: async (fileName: string) => {
                    const emptyTree: BehaviorTreeData = {
                        id: `tree_${Date.now()}`,
                        name: fileName,
                        rootNodeId: '',
                        nodes: new Map(),
                        blackboardVariables: new Map()
                    };
                    return this.serializeBehaviorTreeData(emptyTree);
                }
            }
        ];
    }

    private serializeBehaviorTreeData(treeData: BehaviorTreeData): string {
        const serializable = {
            id: treeData.id,
            name: treeData.name,
            rootNodeId: treeData.rootNodeId,
            nodes: Array.from(treeData.nodes.entries()).map(([, node]) => ({
                ...node
            })),
            blackboardVariables: treeData.blackboardVariables
                ? Array.from(treeData.blackboardVariables.entries()).map(([key, value]) => ({
                    key,
                    value
                }))
                : []
        };
        return JSON.stringify(serializable, null, 2);
    }

    private deserializeBehaviorTreeData(json: string): BehaviorTreeData {
        const parsed = JSON.parse(json);
        const treeData: BehaviorTreeData = {
            id: parsed.id,
            name: parsed.name,
            rootNodeId: parsed.rootNodeId,
            nodes: new Map(),
            blackboardVariables: new Map()
        };

        if (parsed.nodes) {
            for (const node of parsed.nodes) {
                treeData.nodes.set(node.id, node);
            }
        }

        if (parsed.blackboardVariables) {
            for (const variable of parsed.blackboardVariables) {
                treeData.blackboardVariables!.set(variable.key, variable.value);
            }
        }

        return treeData;
    }

    private validateBehaviorTreeData(data: any): boolean {
        if (!data || typeof data !== 'object') {
            return false;
        }

        if (!data.id || !data.name || !data.rootNodeId) {
            return false;
        }

        if (!data.nodes || !Array.isArray(data.nodes)) {
            return false;
        }

        const rootNode = data.nodes.find((n: any) => n.id === data.rootNodeId);
        if (!rootNode) {
            return false;
        }

        return true;
    }
}
