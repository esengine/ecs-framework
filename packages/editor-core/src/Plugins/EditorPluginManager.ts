import { PluginManager } from '@esengine/ecs-framework';
import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';
import type { IEditorPlugin, IEditorPluginMetadata } from './IEditorPlugin';
import { EditorPluginCategory } from './IEditorPlugin';
import { UIRegistry } from '../Services/UIRegistry';
import { MessageHub } from '../Services/MessageHub';
import { SerializerRegistry } from '../Services/SerializerRegistry';
import { FileActionRegistry } from '../Services/FileActionRegistry';
import { EntityCreationRegistry } from '../Services/EntityCreationRegistry';
import { ComponentActionRegistry } from '../Services/ComponentActionRegistry';
import { pluginRegistry } from './PluginRegistry';
import type { EditorPluginDefinition } from './PluginTypes';

const logger = createLogger('EditorPluginManager');

/**
 * 编辑器插件管理器
 *
 * 扩展运行时插件管理器，提供编辑器特定的插件管理功能。
 */
@Injectable()
export class EditorPluginManager extends PluginManager {
    private editorPlugins: Map<string, IEditorPlugin> = new Map();
    private pluginMetadata: Map<string, IEditorPluginMetadata> = new Map();
    private uiRegistry: UIRegistry | null = null;
    private messageHub: MessageHub | null = null;
    private serializerRegistry: SerializerRegistry | null = null;
    private fileActionRegistry: FileActionRegistry | null = null;
    private entityCreationRegistry: EntityCreationRegistry | null = null;
    private componentActionRegistry: ComponentActionRegistry | null = null;

    /**
     * 初始化编辑器插件管理器
     */
    public override initialize(core: Core, services: ServiceContainer): void {
        super.initialize(core, services);

        this.uiRegistry = services.resolve(UIRegistry);
        this.messageHub = services.resolve(MessageHub);
        this.serializerRegistry = services.resolve(SerializerRegistry);
        this.fileActionRegistry = services.resolve(FileActionRegistry);
        this.entityCreationRegistry = services.resolve(EntityCreationRegistry);
        this.componentActionRegistry = services.resolve(ComponentActionRegistry);

        logger.info('EditorPluginManager initialized');
    }

    /**
     * 安装编辑器插件
     */
    public async installEditor(plugin: IEditorPlugin): Promise<void> {
        if (!this.uiRegistry || !this.messageHub || !this.serializerRegistry) {
            throw new Error('EditorPluginManager not initialized. Call initialize() first.');
        }

        logger.info(`Installing editor plugin: ${plugin.name} (${plugin.displayName})`);

        await super.install(plugin);

        this.editorPlugins.set(plugin.name, plugin);

        const metadata: IEditorPluginMetadata = {
            name: plugin.name,
            displayName: plugin.displayName,
            version: plugin.version,
            category: plugin.category,
            description: plugin.description,
            icon: plugin.icon,
            enabled: true,
            installedAt: Date.now()
        };
        this.pluginMetadata.set(plugin.name, metadata);

        try {
            if (plugin.registerMenuItems) {
                const menuItems = plugin.registerMenuItems();
                this.uiRegistry.registerMenus(menuItems);
                logger.debug(`Registered ${menuItems.length} menu items for ${plugin.name}`);
            }

            if (plugin.registerToolbar) {
                const toolbarItems = plugin.registerToolbar();
                this.uiRegistry.registerToolbarItems(toolbarItems);
                logger.debug(`Registered ${toolbarItems.length} toolbar items for ${plugin.name}`);
            }

            if (plugin.registerPanels) {
                const panels = plugin.registerPanels();
                this.uiRegistry.registerPanels(panels);
                logger.debug(`Registered ${panels.length} panels for ${plugin.name}`);
            }

            if (plugin.getSerializers) {
                const serializers = plugin.getSerializers();
                this.serializerRegistry.registerMultiple(plugin.name, serializers);
                logger.debug(`Registered ${serializers.length} serializers for ${plugin.name}`);
            }

            if (plugin.registerFileActionHandlers && this.fileActionRegistry) {
                const handlers = plugin.registerFileActionHandlers();
                for (const handler of handlers) {
                    this.fileActionRegistry.registerActionHandler(handler);
                }
                logger.debug(`Registered ${handlers.length} file action handlers for ${plugin.name}`);
            }

            if (plugin.registerFileCreationTemplates && this.fileActionRegistry) {
                const templates = plugin.registerFileCreationTemplates();
                for (const template of templates) {
                    this.fileActionRegistry.registerCreationTemplate(template);
                }
                logger.debug(`Registered ${templates.length} file creation templates for ${plugin.name}`);
            }

            if (plugin.registerEntityCreationTemplates && this.entityCreationRegistry) {
                const templates = plugin.registerEntityCreationTemplates();
                this.entityCreationRegistry.registerMany(templates);
                logger.debug(`Registered ${templates.length} entity creation templates for ${plugin.name}`);
            }

            if (plugin.registerComponentActions && this.componentActionRegistry) {
                const actions = plugin.registerComponentActions();
                this.componentActionRegistry.registerMany(actions);
                logger.debug(`Registered ${actions.length} component actions for ${plugin.name}`);
            }

            if (plugin.onEditorReady) {
                await plugin.onEditorReady();
            }

            await this.messageHub.publish('plugin:installed', {
                name: plugin.name,
                displayName: plugin.displayName,
                category: plugin.category
            });

            logger.info(`Editor plugin ${plugin.name} installed successfully`);
        } catch (error) {
            logger.error(`Failed to install editor plugin ${plugin.name}:`, error);
            throw error;
        }
    }

    /**
     * 卸载编辑器插件
     */
    public async uninstallEditor(name: string): Promise<void> {
        const plugin = this.editorPlugins.get(name);
        if (!plugin) {
            throw new Error(`Editor plugin ${name} is not installed`);
        }

        logger.info(`Uninstalling editor plugin: ${name}`);

        try {
            if (plugin.registerMenuItems) {
                const menuItems = plugin.registerMenuItems();
                for (const item of menuItems) {
                    this.uiRegistry?.unregisterMenu(item.id);
                }
            }

            if (plugin.registerToolbar) {
                const toolbarItems = plugin.registerToolbar();
                for (const item of toolbarItems) {
                    this.uiRegistry?.unregisterToolbarItem(item.id);
                }
            }

            if (plugin.registerPanels) {
                const panels = plugin.registerPanels();
                for (const panel of panels) {
                    this.uiRegistry?.unregisterPanel(panel.id);
                }
            }

            if (plugin.registerFileActionHandlers && this.fileActionRegistry) {
                const handlers = plugin.registerFileActionHandlers();
                for (const handler of handlers) {
                    this.fileActionRegistry.unregisterActionHandler(handler);
                }
            }

            if (plugin.registerFileCreationTemplates && this.fileActionRegistry) {
                const templates = plugin.registerFileCreationTemplates();
                for (const template of templates) {
                    this.fileActionRegistry.unregisterCreationTemplate(template);
                }
            }

            if (plugin.registerEntityCreationTemplates && this.entityCreationRegistry) {
                const templates = plugin.registerEntityCreationTemplates();
                for (const template of templates) {
                    this.entityCreationRegistry.unregister(template.id);
                }
            }

            if (plugin.registerComponentActions && this.componentActionRegistry) {
                const actions = plugin.registerComponentActions();
                for (const action of actions) {
                    this.componentActionRegistry.unregister(action.componentName, action.id);
                }
            }

            this.serializerRegistry?.unregisterAll(name);

            await super.uninstall(name);

            this.editorPlugins.delete(name);
            this.pluginMetadata.delete(name);

            await this.messageHub?.publish('plugin:uninstalled', { name });

            logger.info(`Editor plugin ${name} uninstalled successfully`);
        } catch (error) {
            logger.error(`Failed to uninstall editor plugin ${name}:`, error);
            throw error;
        }
    }

    /**
     * 获取编辑器插件
     */
    public getEditorPlugin(name: string): IEditorPlugin | undefined {
        return this.editorPlugins.get(name);
    }

    /**
     * 获取所有编辑器插件
     */
    public getAllEditorPlugins(): IEditorPlugin[] {
        return Array.from(this.editorPlugins.values());
    }

    /**
     * 获取插件元数据
     */
    public getPluginMetadata(name: string): IEditorPluginMetadata | undefined {
        return this.pluginMetadata.get(name);
    }

    /**
     * 获取所有插件元数据
     *
     * 实时从插件实例获取 displayName 和 description，以支持多语言切换
     */
    public getAllPluginMetadata(): IEditorPluginMetadata[] {
        const metadataList: IEditorPluginMetadata[] = [];

        for (const [name, metadata] of this.pluginMetadata.entries()) {
            const plugin = this.editorPlugins.get(name);

            // 如果插件实例存在，使用实时的 displayName 和 description
            if (plugin) {
                metadataList.push({
                    ...metadata,
                    displayName: plugin.displayName,
                    description: plugin.description
                });
            } else {
                // 回退到缓存的元数据
                metadataList.push(metadata);
            }
        }

        return metadataList;
    }

    /**
     * 按类别获取插件
     */
    public getPluginsByCategory(category: EditorPluginCategory): IEditorPlugin[] {
        return this.getAllEditorPlugins().filter((plugin) => plugin.category === category);
    }

    /**
     * 启用插件
     */
    public async enablePlugin(name: string): Promise<void> {
        const metadata = this.pluginMetadata.get(name);
        if (!metadata) {
            throw new Error(`Plugin ${name} not found`);
        }

        if (metadata.enabled) {
            logger.warn(`Plugin ${name} is already enabled`);
            return;
        }

        metadata.enabled = true;
        await this.messageHub?.publish('plugin:enabled', { name });
        logger.info(`Plugin ${name} enabled`);
    }

    /**
     * 禁用插件
     */
    public async disablePlugin(name: string): Promise<void> {
        const metadata = this.pluginMetadata.get(name);
        if (!metadata) {
            throw new Error(`Plugin ${name} not found`);
        }

        if (!metadata.enabled) {
            logger.warn(`Plugin ${name} is already disabled`);
            return;
        }

        metadata.enabled = false;
        await this.messageHub?.publish('plugin:disabled', { name });
        logger.info(`Plugin ${name} disabled`);
    }

    /**
     * 项目打开通知
     */
    public async notifyProjectOpen(projectPath: string): Promise<void> {
        logger.info(`Notifying plugins of project open: ${projectPath}`);

        for (const plugin of this.editorPlugins.values()) {
            if (plugin.onProjectOpen) {
                try {
                    await plugin.onProjectOpen(projectPath);
                } catch (error) {
                    logger.error(`Error in ${plugin.name}.onProjectOpen:`, error);
                }
            }
        }

        await this.messageHub?.publish('project:opened', { path: projectPath });
    }

    /**
     * 项目关闭通知
     */
    public async notifyProjectClose(): Promise<void> {
        logger.info('Notifying plugins of project close');

        for (const plugin of this.editorPlugins.values()) {
            if (plugin.onProjectClose) {
                try {
                    await plugin.onProjectClose();
                } catch (error) {
                    logger.error(`Error in ${plugin.name}.onProjectClose:`, error);
                }
            }
        }

        await this.messageHub?.publish('project:closed', {});
    }

    /**
     * 文件保存前通知
     */
    public async notifyBeforeSave(filePath: string, data: any): Promise<void> {
        for (const plugin of this.editorPlugins.values()) {
            if (plugin.onBeforeSave) {
                try {
                    await plugin.onBeforeSave(filePath, data);
                } catch (error) {
                    logger.error(`Error in ${plugin.name}.onBeforeSave:`, error);
                }
            }
        }

        await this.messageHub?.publish('file:beforeSave', { path: filePath, data });
    }

    /**
     * 文件保存后通知
     */
    public async notifyAfterSave(filePath: string): Promise<void> {
        for (const plugin of this.editorPlugins.values()) {
            if (plugin.onAfterSave) {
                try {
                    await plugin.onAfterSave(filePath);
                } catch (error) {
                    logger.error(`Error in ${plugin.name}.onAfterSave:`, error);
                }
            }
        }

        await this.messageHub?.publish('file:afterSave', { path: filePath });
    }

    /**
     * 使用声明式 API 注册插件
     * Register plugin using declarative API
     */
    public async registerPlugin(definition: EditorPluginDefinition): Promise<void> {
        logger.info(`Registering plugin with declarative API: ${definition.id}`);

        try {
            // 使用 PluginRegistry 注册
            await pluginRegistry.register(definition);

            // 同步到旧的元数据系统以保持兼容性
            const metadata: IEditorPluginMetadata = {
                name: definition.id,
                displayName: definition.name,
                version: definition.version || '1.0.0',
                category: EditorPluginCategory.Tool,
                description: definition.description,
                enabled: true,
                installedAt: Date.now()
            };
            this.pluginMetadata.set(definition.id, metadata);

            // 注册实体创建模板
            if (definition.entityTemplates && this.entityCreationRegistry) {
                for (const template of definition.entityTemplates) {
                    this.entityCreationRegistry.register({
                        id: `${definition.id}:${template.id}`,
                        label: template.label,
                        icon: template.icon,
                        order: template.priority,
                        create: template.create
                    });
                }
            }

            // 注册组件操作
            if (definition.components && this.componentActionRegistry) {
                for (const comp of definition.components) {
                    if (comp.actions) {
                        for (const action of comp.actions) {
                            this.componentActionRegistry.register({
                                id: action.id,
                                componentName: comp.type.name,
                                label: action.label,
                                icon: action.icon,
                                execute: action.execute as unknown as (component: any, entity: any) => void | Promise<void>
                            });
                        }
                    }
                }
            }

            await this.messageHub?.publish('plugin:installed', {
                name: definition.id,
                displayName: definition.name,
                category: EditorPluginCategory.Tool
            });

            logger.info(`Plugin ${definition.id} registered successfully`);
        } catch (error) {
            logger.error(`Failed to register plugin ${definition.id}:`, error);
            throw error;
        }
    }

    /**
     * 获取 PluginRegistry 实例
     * Get PluginRegistry instance
     */
    public getPluginRegistry() {
        return pluginRegistry;
    }

    /**
     * 释放资源
     */
    public override dispose(): void {
        super.dispose();

        this.editorPlugins.clear();
        this.pluginMetadata.clear();
        this.uiRegistry = null;
        this.messageHub = null;
        this.serializerRegistry = null;
        this.fileActionRegistry = null;
        this.entityCreationRegistry = null;
        this.componentActionRegistry = null;

        logger.info('EditorPluginManager disposed');
    }
}
