/**
 * 统一插件注册中心
 * Unified plugin registry
 */

import type { ComponentType } from '@esengine/ecs-framework';
import type { ComponentType as ReactComponentType } from 'react';
import {
    EditorPluginDefinition,
    RegisteredPlugin,
    PluginState,
    ComponentRegistration,
    MenuItemRegistration,
    PanelRegistration,
    ToolbarItemRegistration,
    AssetHandlerRegistration,
    MenuTreeNode,
    ComponentActionDefinition
} from './PluginTypes';

/**
 * 插件注册中心
 * Plugin registry - central hub for all plugin registrations
 */
export class PluginRegistry {
    private static _instance: PluginRegistry | null = null;

    /** 已注册的插件 */
    private plugins: Map<string, RegisteredPlugin> = new Map();

    /** 组件到检查器的映射 */
    private componentInspectors: Map<string, ReactComponentType<any>> = new Map();

    /** 组件元数据 */
    private componentMeta: Map<string, ComponentRegistration> = new Map();

    /** 组件操作 */
    private componentActions: Map<string, ComponentActionDefinition[]> = new Map();

    /** 菜单树 */
    private menuTree: MenuTreeNode = {
        name: 'root',
        path: '',
        children: new Map()
    };

    /** 面板注册 */
    private panels: Map<string, PanelRegistration & { pluginId: string }> = new Map();

    /** 工具栏项 */
    private toolbarItems: Map<string, ToolbarItemRegistration & { pluginId: string }> = new Map();

    /** 资产处理器 */
    private assetHandlers: Map<string, AssetHandlerRegistration & { pluginId: string }> = new Map();

    /** 事件监听器 */
    private listeners: Map<string, Set<Function>> = new Map();

    private constructor() {}

    /**
     * 获取单例实例
     */
    static getInstance(): PluginRegistry {
        if (!PluginRegistry._instance) {
            PluginRegistry._instance = new PluginRegistry();
        }
        return PluginRegistry._instance;
    }

    /**
     * 注册插件
     * Register a plugin
     */
    async register(definition: EditorPluginDefinition): Promise<void> {
        if (this.plugins.has(definition.id)) {
            console.warn(`Plugin ${definition.id} is already registered`);
            return;
        }

        // 检查依赖
        if (definition.dependencies) {
            for (const dep of definition.dependencies) {
                if (!this.plugins.has(dep)) {
                    throw new Error(`Plugin ${definition.id} depends on ${dep}, which is not registered`);
                }
                const depPlugin = this.plugins.get(dep)!;
                if (depPlugin.state !== 'active') {
                    throw new Error(`Plugin ${definition.id} depends on ${dep}, which is not active`);
                }
            }
        }

        // 创建注册记录
        const registered: RegisteredPlugin = {
            definition,
            state: 'inactive'
        };
        this.plugins.set(definition.id, registered);

        // 激活插件
        await this.activatePlugin(definition.id);
    }

    /**
     * 激活插件
     */
    private async activatePlugin(pluginId: string): Promise<void> {
        const registered = this.plugins.get(pluginId);
        if (!registered) return;

        const { definition } = registered;
        registered.state = 'activating';

        try {
            // 注册组件
            if (definition.components) {
                for (const comp of definition.components) {
                    this.registerComponent(pluginId, comp);
                }
            }

            // 注册菜单项
            if (definition.menuItems) {
                for (const item of definition.menuItems) {
                    this.registerMenuItem(pluginId, item);
                }
            }

            // 注册面板
            if (definition.panels) {
                for (const panel of definition.panels) {
                    this.registerPanel(pluginId, panel);
                }
            }

            // 注册工具栏项
            if (definition.toolbarItems) {
                for (const item of definition.toolbarItems) {
                    this.registerToolbarItem(pluginId, item);
                }
            }

            // 注册资产处理器
            if (definition.assetHandlers) {
                for (const handler of definition.assetHandlers) {
                    this.registerAssetHandler(pluginId, handler);
                }
            }

            // 调用激活钩子
            if (definition.onActivate) {
                await definition.onActivate();
            }

            registered.state = 'active';
            registered.activatedAt = Date.now();

            this.emit('plugin:activated', { pluginId });
        } catch (error) {
            registered.state = 'error';
            registered.error = error instanceof Error ? error.message : String(error);
            console.error(`Failed to activate plugin ${pluginId}:`, error);
            throw error;
        }
    }

    /**
     * 停用插件
     */
    async deactivate(pluginId: string): Promise<void> {
        const registered = this.plugins.get(pluginId);
        if (!registered || registered.state !== 'active') return;

        const { definition } = registered;
        registered.state = 'deactivating';

        try {
            // 调用停用钩子
            if (definition.onDeactivate) {
                definition.onDeactivate();
            }

            // 清理注册的资源
            this.unregisterPluginResources(pluginId);

            registered.state = 'inactive';
            this.emit('plugin:deactivated', { pluginId });
        } catch (error) {
            registered.state = 'error';
            registered.error = error instanceof Error ? error.message : String(error);
            throw error;
        }
    }

    /**
     * 注册组件
     */
    private registerComponent(pluginId: string, config: ComponentRegistration): void {
        const typeName = config.type.name;

        // 保存元数据
        this.componentMeta.set(typeName, config);

        // 注册检查器
        if (config.inspector) {
            this.componentInspectors.set(typeName, config.inspector);
        }

        // 注册操作
        if (config.actions) {
            this.componentActions.set(typeName, config.actions);
        }

        this.emit('component:registered', { pluginId, typeName, config });
    }

    /**
     * 注册菜单项
     */
    private registerMenuItem(pluginId: string, item: MenuItemRegistration): void {
        const parts = item.path.split('/');
        let current = this.menuTree;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;

            if (!current.children.has(part)) {
                current.children.set(part, {
                    name: part,
                    path: parts.slice(0, i + 1).join('/'),
                    children: new Map()
                });
            }

            current = current.children.get(part)!;

            if (isLast) {
                current.item = item;
                current.pluginId = pluginId;
            }
        }

        this.emit('menu:registered', { pluginId, path: item.path });
    }

    /**
     * 注册面板
     */
    private registerPanel(pluginId: string, panel: PanelRegistration): void {
        this.panels.set(panel.id, { ...panel, pluginId });
        this.emit('panel:registered', { pluginId, panelId: panel.id });
    }

    /**
     * 注册工具栏项
     */
    private registerToolbarItem(pluginId: string, item: ToolbarItemRegistration): void {
        this.toolbarItems.set(item.id, { ...item, pluginId });
        this.emit('toolbar:registered', { pluginId, itemId: item.id });
    }

    /**
     * 注册资产处理器
     */
    private registerAssetHandler(pluginId: string, handler: AssetHandlerRegistration): void {
        for (const ext of handler.extensions) {
            this.assetHandlers.set(ext.toLowerCase(), { ...handler, pluginId });
        }
        this.emit('assetHandler:registered', { pluginId, extensions: handler.extensions });
    }

    /**
     * 清理插件资源
     */
    private unregisterPluginResources(pluginId: string): void {
        const definition = this.plugins.get(pluginId)?.definition;
        if (!definition) return;

        // 清理组件
        if (definition.components) {
            for (const comp of definition.components) {
                const typeName = comp.type.name;
                this.componentMeta.delete(typeName);
                this.componentInspectors.delete(typeName);
                this.componentActions.delete(typeName);
            }
        }

        // 清理面板
        if (definition.panels) {
            for (const panel of definition.panels) {
                this.panels.delete(panel.id);
            }
        }

        // 清理工具栏项
        if (definition.toolbarItems) {
            for (const item of definition.toolbarItems) {
                this.toolbarItems.delete(item.id);
            }
        }

        // 清理资产处理器
        if (definition.assetHandlers) {
            for (const handler of definition.assetHandlers) {
                for (const ext of handler.extensions) {
                    this.assetHandlers.delete(ext.toLowerCase());
                }
            }
        }

        // 清理菜单项（需要遍历树）
        this.removeMenuItemsForPlugin(pluginId, this.menuTree);
    }

    /**
     * 递归移除插件的菜单项
     */
    private removeMenuItemsForPlugin(pluginId: string, node: MenuTreeNode): void {
        for (const [key, child] of node.children) {
            if (child.pluginId === pluginId) {
                node.children.delete(key);
            } else {
                this.removeMenuItemsForPlugin(pluginId, child);
            }
        }
    }

    // === 查询 API ===

    /**
     * 获取组件的检查器
     */
    getComponentInspector(typeName: string): ReactComponentType<any> | undefined {
        return this.componentInspectors.get(typeName);
    }

    /**
     * 获取组件元数据
     */
    getComponentMeta(typeName: string): ComponentRegistration | undefined {
        return this.componentMeta.get(typeName);
    }

    /**
     * 获取组件操作
     */
    getComponentActionDefinitions(typeName: string): ComponentActionDefinition[] {
        return this.componentActions.get(typeName) || [];
    }

    /**
     * 获取所有已注册的组件
     */
    getAllComponents(): Map<string, ComponentRegistration> {
        return new Map(this.componentMeta);
    }

    /**
     * 获取菜单树
     */
    getMenuTree(): MenuTreeNode {
        return this.menuTree;
    }

    /**
     * 获取指定路径下的菜单项
     */
    getMenuItems(parentPath: string): MenuItemRegistration[] {
        const parts = parentPath ? parentPath.split('/') : [];
        let current = this.menuTree;

        for (const part of parts) {
            if (!current.children.has(part)) {
                return [];
            }
            current = current.children.get(part)!;
        }

        const items: MenuItemRegistration[] = [];
        for (const child of current.children.values()) {
            if (child.item) {
                items.push(child.item);
            }
        }

        return items.sort((a, b) => (a.priority || 100) - (b.priority || 100));
    }

    /**
     * 获取所有面板
     */
    getAllPanels(): Map<string, PanelRegistration & { pluginId: string }> {
        return new Map(this.panels);
    }

    /**
     * 获取面板
     */
    getPanel(panelId: string): (PanelRegistration & { pluginId: string }) | undefined {
        return this.panels.get(panelId);
    }

    /**
     * 获取所有工具栏项
     */
    getAllToolbarItems(): (ToolbarItemRegistration & { pluginId: string })[] {
        return Array.from(this.toolbarItems.values())
            .sort((a, b) => (a.priority || 100) - (b.priority || 100));
    }

    /**
     * 获取资产处理器
     */
    getAssetHandler(extension: string): (AssetHandlerRegistration & { pluginId: string }) | undefined {
        return this.assetHandlers.get(extension.toLowerCase());
    }

    /**
     * 获取插件状态
     */
    getPluginState(pluginId: string): PluginState | undefined {
        return this.plugins.get(pluginId)?.state;
    }

    /**
     * 获取所有已注册插件
     */
    getAllPlugins(): Map<string, RegisteredPlugin> {
        return new Map(this.plugins);
    }

    /**
     * 检查插件是否已激活
     */
    isPluginActive(pluginId: string): boolean {
        return this.plugins.get(pluginId)?.state === 'active';
    }

    // === 事件系统 ===

    /**
     * 添加事件监听器
     */
    on(event: string, listener: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
    }

    /**
     * 移除事件监听器
     */
    off(event: string, listener: Function): void {
        this.listeners.get(event)?.delete(listener);
    }

    /**
     * 发射事件
     */
    private emit(event: string, data: any): void {
        const listeners = this.listeners.get(event);
        if (listeners) {
            for (const listener of listeners) {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            }
        }
    }

    /**
     * 通知编辑器准备就绪
     */
    notifyEditorReady(): void {
        for (const [pluginId, registered] of this.plugins) {
            if (registered.state === 'active' && registered.definition.onEditorReady) {
                try {
                    registered.definition.onEditorReady();
                } catch (error) {
                    console.error(`Error in onEditorReady for plugin ${pluginId}:`, error);
                }
            }
        }
    }

    /**
     * 通知场景加载
     */
    notifySceneLoaded(scenePath: string): void {
        for (const [pluginId, registered] of this.plugins) {
            if (registered.state === 'active' && registered.definition.onSceneLoaded) {
                try {
                    registered.definition.onSceneLoaded(scenePath);
                } catch (error) {
                    console.error(`Error in onSceneLoaded for plugin ${pluginId}:`, error);
                }
            }
        }
    }

    /**
     * 通知场景保存
     */
    notifySceneSaving(scenePath: string): boolean {
        for (const [pluginId, registered] of this.plugins) {
            if (registered.state === 'active' && registered.definition.onSceneSaving) {
                try {
                    const result = registered.definition.onSceneSaving(scenePath);
                    if (result === false) {
                        return false; // 取消保存
                    }
                } catch (error) {
                    console.error(`Error in onSceneSaving for plugin ${pluginId}:`, error);
                }
            }
        }
        return true;
    }
}

// 导出单例访问
export const pluginRegistry = PluginRegistry.getInstance();
