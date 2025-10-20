import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import { IEditorPlugin, EditorPluginCategory, PanelPosition, MessageHub } from '@esengine/editor-core';
import type { MenuItem, ToolbarItem, PanelDescriptor, ISerializer } from '@esengine/editor-core';
import { BehaviorTreePersistence } from '@esengine/behavior-tree';

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
    readonly icon = '🌲';

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
                shortcut: 'Ctrl+Shift+T',
                icon: '🌲',
                order: 50
            },
            {
                id: 'view-behavior-tree-nodes',
                label: 'Behavior Tree Nodes',
                parentId: 'window',
                onClick: () => {
                    // Show Behavior Tree Nodes Panel
                },
                order: 51
            },
            {
                id: 'view-node-properties',
                label: 'Node Properties',
                parentId: 'window',
                onClick: () => {
                    // Show Node Properties Panel
                },
                order: 52
            }
        ];
    }

    registerToolbar(): ToolbarItem[] {
        return [
            {
                id: 'toolbar-new-behavior-tree',
                label: 'New Behavior Tree',
                groupId: 'behavior-tree-tools',
                icon: '🌲',
                onClick: () => this.createNewBehaviorTree(),
                order: 10
            },
            {
                id: 'toolbar-save-behavior-tree',
                label: 'Save Behavior Tree',
                groupId: 'behavior-tree-tools',
                icon: '💾',
                onClick: () => this.saveBehaviorTree(),
                order: 20
            },
            {
                id: 'toolbar-validate-behavior-tree',
                label: 'Validate Behavior Tree',
                groupId: 'behavior-tree-tools',
                icon: '✓',
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
                icon: '🌲',
                order: 10
            },
            {
                id: 'panel-behavior-tree-nodes',
                title: 'Behavior Tree Nodes',
                position: PanelPosition.Left,
                defaultSize: 250,
                resizable: true,
                closable: true,
                icon: '📦',
                order: 20
            },
            {
                id: 'panel-behavior-tree-properties',
                title: 'Node Properties',
                position: PanelPosition.Right,
                defaultSize: 300,
                resizable: true,
                closable: true,
                icon: '⚙️',
                order: 20
            }
        ];
    }

    getSerializers(): ISerializer[] {
        return [
            {
                serialize: (data: any) => {
                    // 使用行为树持久化工具
                    const result = BehaviorTreePersistence.serialize(data.entity, data.pretty ?? true);
                    if (typeof result === 'string') {
                        const encoder = new TextEncoder();
                        return encoder.encode(result);
                    }
                    return result;
                },
                deserialize: (data: Uint8Array) => {
                    // 返回原始数据，让上层决定如何反序列化到场景
                    return data;
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
        // 验证行为树数据
        if (filePath.endsWith('.behavior-tree.json')) {
            console.log('[BehaviorTreePlugin] Validating behavior tree before save');
            const isValid = BehaviorTreePersistence.validate(JSON.stringify(data));
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

    // 私有方法

    private createNewBehaviorTree(): void {
        console.log('[BehaviorTreePlugin] Creating new behavior tree');
        // TODO: 实现创建新行为树的逻辑
    }

    private openBehaviorTree(): void {
        console.log('[BehaviorTreePlugin] Opening behavior tree');
        // TODO: 实现打开行为树的逻辑
    }

    private saveBehaviorTree(): void {
        console.log('[BehaviorTreePlugin] Saving behavior tree');
        // TODO: 实现保存行为树的逻辑
    }

    private validateBehaviorTree(): void {
        console.log('[BehaviorTreePlugin] Validating behavior tree');
        // TODO: 实现验证行为树的逻辑
    }
}
