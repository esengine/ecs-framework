import { Core } from '@esengine/ecs-framework';
import {
    EditorPluginManager,
    UIRegistry,
    MessageHub,
    SerializerRegistry,
    EditorPluginCategory,
    PanelPosition
} from '../src';
import type { IEditorPlugin, ISerializer } from '../src';

class TestSerializer implements ISerializer<string> {
    serialize(data: string): Uint8Array {
        const encoder = new TextEncoder();
        return encoder.encode(data);
    }

    deserialize(data: Uint8Array): string {
        const decoder = new TextDecoder();
        return decoder.decode(data);
    }

    getSupportedType(): string {
        return 'string';
    }
}

class TestEditorPlugin implements IEditorPlugin {
    readonly name = 'test-editor-plugin';
    readonly version = '1.0.0';
    readonly displayName = 'Test Editor Plugin';
    readonly category = EditorPluginCategory.Tool;
    readonly description = 'A test plugin for editor';

    async install(): Promise<void> {
        // 测试安装
    }

    async uninstall(): Promise<void> {
        // 测试卸载
    }

    registerMenuItems() {
        return [
            {
                id: 'test-menu',
                label: 'Test Menu',
                onClick: () => {}
            }
        ];
    }

    registerToolbar() {
        return [
            {
                id: 'test-toolbar',
                label: 'Test Toolbar',
                groupId: 'test-group',
                onClick: () => {}
            }
        ];
    }

    registerPanels() {
        return [
            {
                id: 'test-panel',
                title: 'Test Panel',
                position: PanelPosition.Left
            }
        ];
    }

    getSerializers() {
        return [new TestSerializer()];
    }
}

describe('EditorPluginManager', () => {
    let core: Core;
    let pluginManager: EditorPluginManager;
    let uiRegistry: UIRegistry;
    let messageHub: MessageHub;
    let serializerRegistry: SerializerRegistry;

    beforeEach(() => {
        core = Core.create({ debug: false });

        uiRegistry = new UIRegistry();
        messageHub = new MessageHub();
        serializerRegistry = new SerializerRegistry();

        Core.services.registerInstance(UIRegistry, uiRegistry);
        Core.services.registerInstance(MessageHub, messageHub);
        Core.services.registerInstance(SerializerRegistry, serializerRegistry);

        pluginManager = new EditorPluginManager();
        pluginManager.initialize(core, Core.services);
    });

    afterEach(() => {
        pluginManager.dispose();
        Core.destroy();
    });

    describe('基本功能', () => {
        it('应该能够安装编辑器插件', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);

            expect(pluginManager.isInstalled(plugin.name)).toBe(true);
            expect(pluginManager.getEditorPlugin(plugin.name)).toBe(plugin);
        });

        it('应该能够卸载编辑器插件', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);
            await pluginManager.uninstallEditor(plugin.name);

            expect(pluginManager.isInstalled(plugin.name)).toBe(false);
            expect(pluginManager.getEditorPlugin(plugin.name)).toBeUndefined();
        });

        it('应该能够获取插件元数据', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);

            const metadata = pluginManager.getPluginMetadata(plugin.name);
            expect(metadata).toBeDefined();
            expect(metadata?.name).toBe(plugin.name);
            expect(metadata?.displayName).toBe(plugin.displayName);
            expect(metadata?.category).toBe(plugin.category);
            expect(metadata?.enabled).toBe(true);
        });
    });

    describe('UI 注册', () => {
        it('应该注册菜单项', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);

            const menu = uiRegistry.getMenu('test-menu');
            expect(menu).toBeDefined();
            expect(menu?.label).toBe('Test Menu');
        });

        it('应该注册工具栏项', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);

            const toolbar = uiRegistry.getToolbarItem('test-toolbar');
            expect(toolbar).toBeDefined();
            expect(toolbar?.label).toBe('Test Toolbar');
        });

        it('应该注册面板', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);

            const panel = uiRegistry.getPanel('test-panel');
            expect(panel).toBeDefined();
            expect(panel?.title).toBe('Test Panel');
        });

        it('卸载插件时应该注销 UI 元素', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);
            await pluginManager.uninstallEditor(plugin.name);

            expect(uiRegistry.getMenu('test-menu')).toBeUndefined();
            expect(uiRegistry.getToolbarItem('test-toolbar')).toBeUndefined();
            expect(uiRegistry.getPanel('test-panel')).toBeUndefined();
        });
    });

    describe('序列化器注册', () => {
        it('应该注册序列化器', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);

            expect(serializerRegistry.has(plugin.name, 'string')).toBe(true);
        });

        it('应该能够使用序列化器', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);

            const testData = 'Hello World';
            const serialized = serializerRegistry.serialize(plugin.name, 'string', testData);
            const deserialized = serializerRegistry.deserialize(plugin.name, 'string', serialized);

            expect(deserialized).toBe(testData);
        });

        it('卸载插件时应该注销序列化器', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);
            await pluginManager.uninstallEditor(plugin.name);

            expect(serializerRegistry.has(plugin.name, 'string')).toBe(false);
        });
    });

    describe('事件通知', () => {
        it('应该发送插件安装事件', async () => {
            let eventReceived = false;

            messageHub.subscribe('plugin:installed', (data: any) => {
                eventReceived = true;
                expect(data.name).toBe('test-editor-plugin');
            });

            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);

            expect(eventReceived).toBe(true);
        });

        it('应该发送项目打开事件', async () => {
            let eventReceived = false;

            messageHub.subscribe('project:opened', (data: any) => {
                eventReceived = true;
                expect(data.path).toBe('/test/project');
            });

            await pluginManager.notifyProjectOpen('/test/project');

            expect(eventReceived).toBe(true);
        });

        it('应该发送项目关闭事件', async () => {
            let eventReceived = false;

            messageHub.subscribe('project:closed', () => {
                eventReceived = true;
            });

            await pluginManager.notifyProjectClose();

            expect(eventReceived).toBe(true);
        });
    });

    describe('插件管理', () => {
        it('应该能够按类别获取插件', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);

            const plugins = pluginManager.getPluginsByCategory(EditorPluginCategory.Tool);
            expect(plugins.length).toBe(1);
            expect(plugins[0]).toBe(plugin);
        });

        it('应该能够启用/禁用插件', async () => {
            const plugin = new TestEditorPlugin();
            await pluginManager.installEditor(plugin);

            await pluginManager.disablePlugin(plugin.name);
            let metadata = pluginManager.getPluginMetadata(plugin.name);
            expect(metadata?.enabled).toBe(false);

            await pluginManager.enablePlugin(plugin.name);
            metadata = pluginManager.getPluginMetadata(plugin.name);
            expect(metadata?.enabled).toBe(true);
        });
    });
});
