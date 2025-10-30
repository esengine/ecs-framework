import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import { IEditorPlugin, EditorPluginCategory, PanelPosition, MessageHub } from '@esengine/editor-core';
import type { MenuItem, ToolbarItem, PanelDescriptor, ISerializer } from '@esengine/editor-core';
import { BehaviorTreeData } from '@esengine/behavior-tree';

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
        return [
            {
                id: 'view-behavior-tree-editor',
                label: 'Behavior Tree Editor',
                parentId: 'window',
                onClick: () => {
                    this.messageHub?.publish('ui:openWindow', { windowId: 'behavior-tree-editor' });
                },
                icon: 'Network',
                order: 50
            }
        ];
    }

    registerToolbar(): ToolbarItem[] {
        return [
            {
                id: 'toolbar-new-behavior-tree',
                label: 'New Behavior Tree',
                groupId: 'behavior-tree-tools',
                icon: 'FilePlus',
                onClick: () => this.createNewBehaviorTree(),
                order: 10
            },
            {
                id: 'toolbar-save-behavior-tree',
                label: 'Save Behavior Tree',
                groupId: 'behavior-tree-tools',
                icon: 'Save',
                onClick: () => this.saveBehaviorTree(),
                order: 20
            },
            {
                id: 'toolbar-validate-behavior-tree',
                label: 'Validate Behavior Tree',
                groupId: 'behavior-tree-tools',
                icon: 'CheckCircle',
                onClick: () => this.validateBehaviorTree(),
                order: 30
            }
        ];
    }

    registerPanels(): PanelDescriptor[] {
        return [
            {
                id: 'panel-behavior-tree-editor',
                title: 'Behavior Tree Editor',
                position: PanelPosition.Center,
                resizable: true,
                closable: true,
                icon: 'Network',
                order: 10
            },
            {
                id: 'panel-behavior-tree-nodes',
                title: 'Behavior Tree Nodes',
                position: PanelPosition.Left,
                defaultSize: 250,
                resizable: true,
                closable: true,
                icon: 'Package',
                order: 20
            },
            {
                id: 'panel-behavior-tree-properties',
                title: 'Node Properties',
                position: PanelPosition.Right,
                defaultSize: 300,
                resizable: true,
                closable: true,
                icon: 'Settings',
                order: 20
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

    private createNewBehaviorTree(): void {
        console.log('[BehaviorTreePlugin] Creating new behavior tree');
    }

    private openBehaviorTree(): void {
        console.log('[BehaviorTreePlugin] Opening behavior tree');
    }

    private saveBehaviorTree(): void {
        console.log('[BehaviorTreePlugin] Saving behavior tree');
    }

    private validateBehaviorTree(): void {
        console.log('[BehaviorTreePlugin] Validating behavior tree');
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
