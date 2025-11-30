/**
 * 统一插件管理器
 * Unified Plugin Manager
 */

import { createLogger, ComponentRegistry } from '@esengine/ecs-framework';
import type { IScene, ServiceContainer, IService } from '@esengine/ecs-framework';
import type {
    PluginDescriptor,
    PluginState,
    PluginCategory,
    LoadingPhase,
    IPlugin
} from './PluginDescriptor';
import type {
    SystemContext,
    IEditorModuleLoader
} from './IPluginLoader';
import { EntityCreationRegistry } from '../Services/EntityCreationRegistry';
import { ComponentActionRegistry } from '../Services/ComponentActionRegistry';
import { FileActionRegistry } from '../Services/FileActionRegistry';
import { UIRegistry } from '../Services/UIRegistry';
import { MessageHub } from '../Services/MessageHub';

const logger = createLogger('PluginManager');

/**
 * PluginManager 服务标识符
 * PluginManager service identifier
 */
export const IPluginManager = Symbol.for('IPluginManager');

/**
 * 标准化后的插件描述符（所有字段都有值）
 * Normalized plugin descriptor (all fields have values)
 */
export interface NormalizedPluginDescriptor {
    id: string;
    name: string;
    version: string;
    description: string;
    category: PluginCategory;
    tags: string[];
    icon?: string;
    enabledByDefault: boolean;
    canContainContent: boolean;
    isEnginePlugin: boolean;
    isCore: boolean;
    modules: Array<{ name: string; type: 'runtime' | 'editor'; loadingPhase: LoadingPhase }>;
    dependencies: Array<{ id: string; version?: string; optional?: boolean }>;
    platforms: ('web' | 'desktop' | 'mobile')[];
}

/**
 * 标准化后的插件（内部使用）
 * Normalized plugin (internal use)
 */
export interface NormalizedPlugin {
    descriptor: NormalizedPluginDescriptor;
    runtimeModule?: IPlugin['runtimeModule'];
    editorModule?: IEditorModuleLoader;
}

/**
 * 插件注册的资源（用于卸载时清理）
 * Resources registered by plugin (for cleanup on unload)
 */
export interface PluginRegisteredResources {
    /** 注册的面板ID | Registered panel IDs */
    panelIds: string[];
    /** 注册的菜单ID | Registered menu IDs */
    menuIds: string[];
    /** 注册的工具栏ID | Registered toolbar IDs */
    toolbarIds: string[];
    /** 注册的实体模板ID | Registered entity template IDs */
    entityTemplateIds: string[];
    /** 注册的组件操作 | Registered component actions */
    componentActions: Array<{ componentName: string; actionId: string }>;
    /** 注册的文件处理器 | Registered file handlers */
    fileHandlers: any[];
    /** 注册的文件模板 | Registered file templates */
    fileTemplates: any[];
}

/**
 * 已注册的插件信息
 * Registered plugin info
 */
export interface RegisteredPlugin {
    /** 标准化后的插件 | Normalized plugin */
    plugin: NormalizedPlugin;
    /** 插件状态 | Plugin state */
    state: PluginState;
    /** 错误信息 | Error info */
    error?: Error;
    /** 是否启用 | Is enabled */
    enabled: boolean;
    /** 加载时间 | Load time */
    loadedAt?: number;
    /** 激活时间 | Activation time */
    activatedAt?: number;
    /** 插件注册的资源 | Resources registered by plugin */
    registeredResources?: PluginRegisteredResources;
}

/**
 * 插件配置
 * Plugin configuration
 */
export interface PluginConfig {
    /** 启用的插件ID列表 | Enabled plugin IDs */
    enabledPlugins: string[];
}

/**
 * 加载阶段顺序
 * Loading phase order
 */
const LOADING_PHASE_ORDER: LoadingPhase[] = [
    'earliest',
    'preDefault',
    'default',
    'postDefault',
    'postEngine'
];

/**
 * 统一插件管理器
 * Unified Plugin Manager
 *
 * 使用方式:
 * 1. 在 ServiceContainer 中注册: services.registerInstance(IPluginManager, new PluginManager())
 * 2. 获取实例: services.resolve<PluginManager>(IPluginManager)
 */
export class PluginManager implements IService {
    private plugins: Map<string, RegisteredPlugin> = new Map();
    private initialized = false;
    private editorInitialized = false;
    private services: ServiceContainer | null = null;
    private currentScene: IScene | null = null;
    private currentContext: SystemContext | null = null;

    constructor() {}

    /**
     * 设置服务容器（用于动态启用插件）
     * Set service container (for dynamic plugin enabling)
     */
    setServiceContainer(services: ServiceContainer): void {
        this.services = services;
    }

    /**
     * 设置当前场景和上下文（用于动态创建系统）
     * Set current scene and context (for dynamic system creation)
     */
    setSceneContext(scene: IScene, context: SystemContext): void {
        this.currentScene = scene;
        this.currentContext = context;
    }

    /**
     * 释放资源
     * Dispose resources
     */
    dispose(): void {
        this.reset();
    }

    /**
     * 标准化插件描述符，填充默认值
     * Normalize plugin descriptor, fill in defaults
     */
    private normalizePlugin(input: IPlugin): NormalizedPlugin {
        const d = input.descriptor;
        return {
            descriptor: {
                id: d.id,
                name: d.name,
                version: d.version,
                description: d.description ?? '',
                category: d.category ?? 'tools',
                tags: d.tags ?? [],
                icon: d.icon,
                enabledByDefault: d.enabledByDefault ?? false,
                canContainContent: d.canContainContent ?? false,
                isEnginePlugin: d.isEnginePlugin ?? true,
                isCore: d.isCore ?? false,
                modules: (d.modules ?? [{ name: 'Runtime', type: 'runtime' as const, loadingPhase: 'default' as const }]).map((m: { name: string; type: 'runtime' | 'editor'; loadingPhase?: LoadingPhase }) => ({
                    name: m.name,
                    type: m.type,
                    loadingPhase: m.loadingPhase ?? 'default' as LoadingPhase
                })),
                dependencies: d.dependencies ?? [],
                platforms: d.platforms ?? ['web', 'desktop']
            },
            runtimeModule: input.runtimeModule,
            editorModule: input.editorModule as IEditorModuleLoader | undefined
        };
    }

    /**
     * 注册插件
     * Register plugin
     *
     * 接受任何符合 IPlugin 接口的插件，内部会标准化所有字段。
     * Accepts any plugin conforming to IPlugin interface, normalizes all fields internally.
     */
    register(plugin: IPlugin): void {
        if (!plugin) {
            logger.error('Cannot register plugin: plugin is null or undefined');
            return;
        }

        if (!plugin.descriptor) {
            logger.error('Cannot register plugin: descriptor is null or undefined', plugin);
            return;
        }

        const { id } = plugin.descriptor;

        if (!id) {
            logger.error('Cannot register plugin: descriptor.id is null or undefined', plugin.descriptor);
            return;
        }

        if (this.plugins.has(id)) {
            logger.warn(`Plugin ${id} is already registered, skipping`);
            return;
        }

        const normalized = this.normalizePlugin(plugin);
        const enabled = normalized.descriptor.isCore || normalized.descriptor.enabledByDefault;

        this.plugins.set(id, {
            plugin: normalized,
            state: 'loaded',
            enabled,
            loadedAt: Date.now()
        });

        logger.info(`Plugin registered: ${id} (${normalized.descriptor.name})`);
    }

    /**
     * 启用插件（动态加载编辑器模块和运行时系统）
     * Enable plugin (dynamically load editor module and runtime systems)
     */
    async enable(pluginId: string): Promise<boolean> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            logger.error(`Plugin ${pluginId} not found`);
            return false;
        }

        if (plugin.plugin.descriptor.isCore) {
            logger.warn(`Core plugin ${pluginId} cannot be disabled/enabled`);
            return false;
        }

        if (plugin.enabled) {
            logger.warn(`Plugin ${pluginId} is already enabled`);
            return true;
        }

        // 检查依赖
        const deps = plugin.plugin.descriptor.dependencies;
        for (const dep of deps) {
            if (dep.optional) continue;
            const depPlugin = this.plugins.get(dep.id);
            if (!depPlugin || !depPlugin.enabled) {
                logger.error(`Cannot enable ${pluginId}: dependency ${dep.id} is not enabled`);
                return false;
            }
        }

        plugin.enabled = true;
        plugin.state = 'loading';

        try {
            // 动态加载编辑器模块
            if (this.services && this.editorInitialized) {
                await this.activatePluginEditor(pluginId);
            }

            // 动态加载运行时模块
            if (this.currentScene && this.currentContext && this.initialized) {
                await this.activatePluginRuntime(pluginId);
            }

            plugin.state = 'active';
            plugin.activatedAt = Date.now();
            logger.info(`Plugin enabled and activated: ${pluginId}`);
            return true;
        } catch (e) {
            logger.error(`Failed to activate plugin ${pluginId}:`, e);
            plugin.state = 'error';
            plugin.error = e as Error;
            plugin.enabled = false;
            return false;
        }
    }

    /**
     * 禁用插件（动态卸载编辑器模块和运行时系统）
     * Disable plugin (dynamically unload editor module and runtime systems)
     */
    async disable(pluginId: string): Promise<boolean> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            logger.error(`Plugin ${pluginId} not found`);
            return false;
        }

        if (plugin.plugin.descriptor.isCore) {
            logger.warn(`Core plugin ${pluginId} cannot be disabled`);
            return false;
        }

        if (!plugin.enabled) {
            logger.warn(`Plugin ${pluginId} is already disabled`);
            return true;
        }

        // 检查是否有其他插件依赖此插件
        for (const [id, p] of this.plugins) {
            if (!p.enabled || id === pluginId) continue;
            const deps = p.plugin.descriptor.dependencies;
            const hasDep = deps.some(d => d.id === pluginId && !d.optional);
            if (hasDep) {
                logger.error(`Cannot disable ${pluginId}: plugin ${id} depends on it`);
                return false;
            }
        }

        try {
            // 卸载编辑器模块
            if (this.services) {
                await this.deactivatePluginEditor(pluginId);
            }

            // 卸载运行时模块（清理系统）
            if (this.currentScene) {
                this.deactivatePluginRuntime(pluginId);
            }

            plugin.enabled = false;
            plugin.state = 'disabled';
            plugin.registeredResources = undefined;
            logger.info(`Plugin disabled: ${pluginId}`);
            return true;
        } catch (e) {
            logger.error(`Failed to deactivate plugin ${pluginId}:`, e);
            return false;
        }
    }

    /**
     * 动态激活插件的编辑器模块
     * Dynamically activate plugin's editor module
     */
    private async activatePluginEditor(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin || !this.services) return;

        const editorModule = plugin.plugin.editorModule;
        if (!editorModule) return;

        // 初始化资源跟踪
        const resources: PluginRegisteredResources = {
            panelIds: [],
            menuIds: [],
            toolbarIds: [],
            entityTemplateIds: [],
            componentActions: [],
            fileHandlers: [],
            fileTemplates: []
        };

        // 获取注册表服务
        const entityCreationRegistry = this.services.tryResolve(EntityCreationRegistry);
        const componentActionRegistry = this.services.tryResolve(ComponentActionRegistry);
        const fileActionRegistry = this.services.tryResolve(FileActionRegistry);
        const uiRegistry = this.services.tryResolve(UIRegistry);

        // 安装编辑器模块
        await editorModule.install(this.services);
        logger.debug(`Editor module installed: ${pluginId}`);

        // 注册实体创建模板
        if (entityCreationRegistry && editorModule.getEntityCreationTemplates) {
            const templates = editorModule.getEntityCreationTemplates();
            if (templates && templates.length > 0) {
                entityCreationRegistry.registerMany(templates);
                resources.entityTemplateIds = templates.map(t => t.id);
                logger.debug(`Registered ${templates.length} entity templates from: ${pluginId}`);
            }
        }

        // 注册组件操作
        if (componentActionRegistry && editorModule.getComponentActions) {
            const actions = editorModule.getComponentActions();
            if (actions && actions.length > 0) {
                for (const action of actions) {
                    componentActionRegistry.register(action);
                    resources.componentActions.push({
                        componentName: action.componentName,
                        actionId: action.id
                    });
                }
                logger.debug(`Registered ${actions.length} component actions from: ${pluginId}`);
            }
        }

        // 注册文件操作处理器
        if (fileActionRegistry && editorModule.getFileActionHandlers) {
            const handlers = editorModule.getFileActionHandlers();
            if (handlers && handlers.length > 0) {
                for (const handler of handlers) {
                    fileActionRegistry.registerActionHandler(handler);
                    resources.fileHandlers.push(handler);
                }
                logger.debug(`Registered ${handlers.length} file action handlers from: ${pluginId}`);
            }
        }

        // 注册文件创建模板
        if (fileActionRegistry && editorModule.getFileCreationTemplates) {
            const templates = editorModule.getFileCreationTemplates();
            if (templates && templates.length > 0) {
                for (const template of templates) {
                    fileActionRegistry.registerCreationTemplate(template);
                    resources.fileTemplates.push(template);
                }
                logger.debug(`Registered ${templates.length} file creation templates from: ${pluginId}`);
            }
        }

        // 注册面板
        if (uiRegistry && editorModule.getPanels) {
            const panels = editorModule.getPanels();
            if (panels && panels.length > 0) {
                uiRegistry.registerPanels(panels);
                resources.panelIds = panels.map(p => p.id);
                logger.debug(`Registered ${panels.length} panels from: ${pluginId}`);
            }
        }

        // 注册菜单
        if (uiRegistry && editorModule.getMenuItems) {
            const menuItems = editorModule.getMenuItems();
            if (menuItems && menuItems.length > 0) {
                for (const item of menuItems) {
                    uiRegistry.registerMenu(item as any);
                    resources.menuIds.push(item.id);
                }
                logger.debug(`Registered ${menuItems.length} menu items from: ${pluginId}`);
            }
        }

        // 注册工具栏
        if (uiRegistry && editorModule.getToolbarItems) {
            const toolbarItems = editorModule.getToolbarItems();
            if (toolbarItems && toolbarItems.length > 0) {
                for (const item of toolbarItems) {
                    uiRegistry.registerToolbarItem(item as any);
                    resources.toolbarIds.push(item.id);
                }
                logger.debug(`Registered ${toolbarItems.length} toolbar items from: ${pluginId}`);
            }
        }

        // 保存注册的资源
        plugin.registeredResources = resources;

        // 调用 onEditorReady
        if (editorModule.onEditorReady) {
            await editorModule.onEditorReady();
        }

        // 发布插件安装事件，通知 UI 刷新
        const messageHub = this.services.tryResolve(MessageHub);
        if (messageHub) {
            messageHub.publish('plugin:installed', { pluginId });
        }
    }

    /**
     * 动态卸载插件的编辑器模块
     * Dynamically deactivate plugin's editor module
     */
    private async deactivatePluginEditor(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin || !this.services) return;

        const editorModule = plugin.plugin.editorModule;
        const resources = plugin.registeredResources;

        // 获取注册表服务
        const entityCreationRegistry = this.services.tryResolve(EntityCreationRegistry);
        const componentActionRegistry = this.services.tryResolve(ComponentActionRegistry);
        const fileActionRegistry = this.services.tryResolve(FileActionRegistry);
        const uiRegistry = this.services.tryResolve(UIRegistry);

        if (resources) {
            // 注销面板
            if (uiRegistry) {
                for (const panelId of resources.panelIds) {
                    uiRegistry.unregisterPanel(panelId);
                }
            }

            // 注销菜单
            if (uiRegistry) {
                for (const menuId of resources.menuIds) {
                    uiRegistry.unregisterMenu(menuId);
                }
            }

            // 注销工具栏
            if (uiRegistry) {
                for (const toolbarId of resources.toolbarIds) {
                    uiRegistry.unregisterToolbarItem(toolbarId);
                }
            }

            // 注销实体模板
            if (entityCreationRegistry) {
                for (const templateId of resources.entityTemplateIds) {
                    entityCreationRegistry.unregister(templateId);
                }
            }

            // 注销组件操作
            if (componentActionRegistry) {
                for (const action of resources.componentActions) {
                    componentActionRegistry.unregister(action.componentName, action.actionId);
                }
            }

            // 注销文件处理器
            if (fileActionRegistry) {
                for (const handler of resources.fileHandlers) {
                    fileActionRegistry.unregisterActionHandler(handler);
                }
            }

            // 注销文件模板
            if (fileActionRegistry) {
                for (const template of resources.fileTemplates) {
                    fileActionRegistry.unregisterCreationTemplate(template);
                }
            }

            logger.debug(`Unregistered resources for: ${pluginId}`);
        }

        // 调用 uninstall
        if (editorModule?.uninstall) {
            await editorModule.uninstall();
            logger.debug(`Editor module uninstalled: ${pluginId}`);
        }

        // 发布插件卸载事件，通知 UI 刷新
        const messageHub = this.services.tryResolve(MessageHub);
        if (messageHub) {
            messageHub.publish('plugin:uninstalled', { pluginId });
        }
    }

    /**
     * 动态激活插件的运行时模块
     * Dynamically activate plugin's runtime module
     */
    private async activatePluginRuntime(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin || !this.currentScene || !this.currentContext || !this.services) return;

        const runtimeModule = plugin.plugin.runtimeModule;
        if (!runtimeModule) return;

        // 注册组件
        if (runtimeModule.registerComponents) {
            runtimeModule.registerComponents(ComponentRegistry);
            logger.debug(`Components registered for: ${pluginId}`);
        }

        // 注册服务
        if (runtimeModule.registerServices) {
            runtimeModule.registerServices(this.services);
            logger.debug(`Services registered for: ${pluginId}`);
        }

        // 创建系统
        if (runtimeModule.createSystems) {
            runtimeModule.createSystems(this.currentScene, this.currentContext);
            logger.debug(`Systems created for: ${pluginId}`);
        }

        // 调用系统创建后回调
        if (runtimeModule.onSystemsCreated) {
            runtimeModule.onSystemsCreated(this.currentScene, this.currentContext);
            logger.debug(`Systems wired for: ${pluginId}`);
        }

        // 调用初始化
        if (runtimeModule.onInitialize) {
            await runtimeModule.onInitialize();
            logger.debug(`Runtime initialized for: ${pluginId}`);
        }
    }

    /**
     * 动态卸载插件的运行时模块
     * Dynamically deactivate plugin's runtime module
     */
    private deactivatePluginRuntime(pluginId: string): void {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return;

        const runtimeModule = plugin.plugin.runtimeModule;
        if (!runtimeModule) return;

        // 调用销毁回调
        if (runtimeModule.onDestroy) {
            runtimeModule.onDestroy();
            logger.debug(`Runtime destroyed for: ${pluginId}`);
        }

        // 注意：组件和服务无法动态注销，这是设计限制
        // 系统的移除需要场景支持，暂时只调用 onDestroy
    }

    /**
     * 检查插件是否启用
     * Check if plugin is enabled
     */
    isEnabled(pluginId: string): boolean {
        const plugin = this.plugins.get(pluginId);
        return plugin?.enabled ?? false;
    }

    /**
     * 获取插件状态
     * Get plugin state
     */
    getState(pluginId: string): PluginState | undefined {
        return this.plugins.get(pluginId)?.state;
    }

    /**
     * 获取插件
     * Get plugin
     */
    getPlugin(pluginId: string): RegisteredPlugin | undefined {
        return this.plugins.get(pluginId);
    }

    /**
     * 获取所有插件
     * Get all plugins
     */
    getAllPlugins(): RegisteredPlugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * 按类别获取插件
     * Get plugins by category
     */
    getPluginsByCategory(category: PluginCategory): RegisteredPlugin[] {
        return this.getAllPlugins().filter(
            p => p.plugin.descriptor.category === category
        );
    }

    /**
     * 获取已启用的插件
     * Get enabled plugins
     */
    getEnabledPlugins(): RegisteredPlugin[] {
        return this.getAllPlugins().filter(p => p.enabled);
    }

    /**
     * 初始化所有运行时模块
     * Initialize all runtime modules
     */
    async initializeRuntime(services: ServiceContainer): Promise<void> {
        if (this.initialized) {
            logger.warn('Runtime already initialized');
            return;
        }

        // 保存服务容器引用
        this.services = services;

        logger.info('Initializing runtime modules...');

        const sortedPlugins = this.sortByLoadingPhase('runtime');

        // 注册组件
        for (const pluginId of sortedPlugins) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin?.enabled) continue;

            const runtimeModule = plugin.plugin.runtimeModule;
            if (runtimeModule?.registerComponents) {
                try {
                    runtimeModule.registerComponents(ComponentRegistry);
                    logger.debug(`Components registered for: ${pluginId}`);
                } catch (e) {
                    logger.error(`Failed to register components for ${pluginId}:`, e);
                    plugin.state = 'error';
                    plugin.error = e as Error;
                }
            }
        }

        // 注册服务
        for (const pluginId of sortedPlugins) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin?.enabled || plugin.state === 'error') continue;

            const runtimeModule = plugin.plugin.runtimeModule;
            if (runtimeModule?.registerServices) {
                try {
                    runtimeModule.registerServices(services);
                    logger.debug(`Services registered for: ${pluginId}`);
                } catch (e) {
                    logger.error(`Failed to register services for ${pluginId}:`, e);
                    plugin.state = 'error';
                    plugin.error = e as Error;
                }
            }
        }

        // 调用初始化回调 | Call initialization callbacks
        for (const pluginId of sortedPlugins) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin?.enabled || plugin.state === 'error') continue;

            const runtimeModule = plugin.plugin.runtimeModule;
            if (runtimeModule?.onInitialize) {
                try {
                    await runtimeModule.onInitialize();
                    plugin.state = 'active';
                    plugin.activatedAt = Date.now();
                    logger.debug(`Initialized: ${pluginId}`);
                } catch (e) {
                    logger.error(`Failed to initialize ${pluginId}:`, e);
                    plugin.state = 'error';
                    plugin.error = e as Error;
                }
            } else {
                // 没有初始化回调，直接激活 | No init callback, activate directly
                plugin.state = 'active';
                plugin.activatedAt = Date.now();
            }
        }

        this.initialized = true;
        logger.info('Runtime modules initialized');
    }

    /**
     * 为场景创建系统
     * Create systems for scene
     */
    createSystemsForScene(scene: IScene, context: SystemContext): void {
        // 保存场景和上下文引用（用于动态启用插件）
        this.currentScene = scene;
        this.currentContext = context;

        logger.info('Creating systems for scene...');
        console.log('[PluginManager] createSystemsForScene called, context.assetManager:', context.assetManager ? 'exists' : 'null');

        const sortedPlugins = this.sortByLoadingPhase('runtime');
        console.log('[PluginManager] Sorted plugins for runtime:', sortedPlugins);

        // 第一阶段：创建所有系统
        // Phase 1: Create all systems
        for (const pluginId of sortedPlugins) {
            const plugin = this.plugins.get(pluginId);
            console.log(`[PluginManager] Plugin ${pluginId}: enabled=${plugin?.enabled}, state=${plugin?.state}, hasRuntimeModule=${!!plugin?.plugin.runtimeModule}`);
            if (!plugin?.enabled || plugin.state === 'error') continue;

            const runtimeModule = plugin.plugin.runtimeModule;
            if (runtimeModule?.createSystems) {
                try {
                    console.log(`[PluginManager] Calling createSystems for: ${pluginId}`);
                    runtimeModule.createSystems(scene, context);
                    logger.debug(`Systems created for: ${pluginId}`);
                } catch (e) {
                    logger.error(`Failed to create systems for ${pluginId}:`, e);
                }
            }
        }

        // 第二阶段：系统创建完成后的回调（用于跨插件依赖连接）
        // Phase 2: Post-creation callbacks (for cross-plugin dependency wiring)
        for (const pluginId of sortedPlugins) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin?.enabled || plugin.state === 'error') continue;

            const runtimeModule = plugin.plugin.runtimeModule;
            if (runtimeModule?.onSystemsCreated) {
                try {
                    runtimeModule.onSystemsCreated(scene, context);
                    logger.debug(`Systems wired for: ${pluginId}`);
                } catch (e) {
                    logger.error(`Failed to wire systems for ${pluginId}:`, e);
                }
            }
        }

        logger.info('Systems created for scene');
    }

    /**
     * 初始化所有编辑器模块
     * Initialize all editor modules
     */
    async initializeEditor(services: ServiceContainer): Promise<void> {
        if (this.editorInitialized) {
            logger.warn('Editor already initialized');
            return;
        }

        // 保存服务容器引用
        this.services = services;

        logger.info('Initializing editor modules...');

        const sortedPlugins = this.sortByLoadingPhase('editor');

        for (const pluginId of sortedPlugins) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin?.enabled) continue;

            try {
                // 使用统一的激活方法，自动跟踪注册的资源
                await this.activatePluginEditor(pluginId);
            } catch (e) {
                logger.error(`Failed to install editor module for ${pluginId}:`, e);
                plugin.state = 'error';
                plugin.error = e as Error;
            }
        }

        this.editorInitialized = true;
        logger.info('Editor modules initialized');
    }

    /**
     * 初始化单个插件的编辑器模块（用于动态加载的项目插件）
     * Initialize a single plugin's editor module (for dynamically loaded project plugins)
     */
    async initializePluginEditor(pluginId: string, services: ServiceContainer): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin?.enabled) {
            logger.warn(`Plugin ${pluginId} not found or not enabled`);
            return;
        }

        // 确保服务容器已设置
        if (!this.services) {
            this.services = services;
        }

        try {
            // 使用统一的激活方法
            await this.activatePluginEditor(pluginId);
        } catch (e) {
            logger.error(`Failed to install editor module for ${pluginId}:`, e);
            plugin.state = 'error';
            plugin.error = e as Error;
        }
    }

    /**
     * 通知编辑器就绪
     * Notify editor ready
     */
    async notifyEditorReady(): Promise<void> {
        for (const [pluginId, plugin] of this.plugins) {
            if (!plugin.enabled) continue;
            const editorModule = plugin.plugin.editorModule;
            if (editorModule?.onEditorReady) {
                try {
                    await editorModule.onEditorReady();
                } catch (e) {
                    logger.error(`Error in ${pluginId}.onEditorReady:`, e);
                }
            }
        }
    }

    /**
     * 通知项目打开
     * Notify project open
     */
    async notifyProjectOpen(projectPath: string): Promise<void> {
        for (const [pluginId, plugin] of this.plugins) {
            if (!plugin.enabled) continue;
            const editorModule = plugin.plugin.editorModule;
            if (editorModule?.onProjectOpen) {
                try {
                    await editorModule.onProjectOpen(projectPath);
                } catch (e) {
                    logger.error(`Error in ${pluginId}.onProjectOpen:`, e);
                }
            }
        }
    }

    /**
     * 通知项目关闭
     * Notify project close
     */
    async notifyProjectClose(): Promise<void> {
        for (const [pluginId, plugin] of this.plugins) {
            if (!plugin.enabled) continue;
            const editorModule = plugin.plugin.editorModule;
            if (editorModule?.onProjectClose) {
                try {
                    await editorModule.onProjectClose();
                } catch (e) {
                    logger.error(`Error in ${pluginId}.onProjectClose:`, e);
                }
            }
        }
    }

    /**
     * 通知场景加载
     * Notify scene loaded
     */
    notifySceneLoaded(scenePath: string): void {
        for (const [pluginId, plugin] of this.plugins) {
            if (!plugin.enabled) continue;
            const editorModule = plugin.plugin.editorModule;
            if (editorModule?.onSceneLoaded) {
                try {
                    editorModule.onSceneLoaded(scenePath);
                } catch (e) {
                    logger.error(`Error in ${pluginId}.onSceneLoaded:`, e);
                }
            }
        }
    }

    /**
     * 通知场景保存
     * Notify scene saving
     */
    notifySceneSaving(scenePath: string): boolean {
        for (const [pluginId, plugin] of this.plugins) {
            if (!plugin.enabled) continue;
            const editorModule = plugin.plugin.editorModule;
            if (editorModule?.onSceneSaving) {
                try {
                    const result = editorModule.onSceneSaving(scenePath);
                    if (result === false) {
                        return false;
                    }
                } catch (e) {
                    logger.error(`Error in ${pluginId}.onSceneSaving:`, e);
                }
            }
        }
        return true;
    }

    /**
     * 设置所有插件的语言
     * Set locale for all plugins
     */
    setLocale(locale: string): void {
        for (const [pluginId, plugin] of this.plugins) {
            if (!plugin.enabled) continue;
            const editorModule = plugin.plugin.editorModule;
            if (editorModule?.setLocale) {
                try {
                    editorModule.setLocale(locale);
                } catch (e) {
                    logger.error(`Error in ${pluginId}.setLocale:`, e);
                }
            }
        }
    }

    /**
     * 导出配置
     * Export configuration
     */
    exportConfig(): PluginConfig {
        const enabledPlugins: string[] = [];
        for (const [id, plugin] of this.plugins) {
            if (plugin.enabled && !plugin.plugin.descriptor.isCore) {
                enabledPlugins.push(id);
            }
        }
        return { enabledPlugins };
    }

    /**
     * 加载配置并激活插件
     * Load configuration and activate plugins
     *
     * 此方法会：
     * 1. 根据配置启用/禁用插件
     * 2. 激活新启用插件的编辑器模块
     * 3. 卸载新禁用插件的编辑器模块
     */
    async loadConfig(config: PluginConfig): Promise<void> {
        const { enabledPlugins } = config;
        logger.info(`loadConfig called with: ${enabledPlugins.join(', ')}`);

        // 收集状态变化的插件
        const toEnable: string[] = [];
        const toDisable: string[] = [];

        for (const [id, plugin] of this.plugins) {
            if (plugin.plugin.descriptor.isCore) {
                continue; // 核心插件始终启用
            }

            const shouldBeEnabled = enabledPlugins.includes(id);
            const wasEnabled = plugin.enabled;

            if (shouldBeEnabled && !wasEnabled) {
                toEnable.push(id);
            } else if (!shouldBeEnabled && wasEnabled) {
                toDisable.push(id);
            }
        }

        // 禁用不再需要的插件
        for (const pluginId of toDisable) {
            await this.disable(pluginId);
        }

        // 启用新插件
        for (const pluginId of toEnable) {
            await this.enable(pluginId);
        }

        logger.info(`Config loaded and applied: ${toEnable.length} enabled, ${toDisable.length} disabled`);
    }

    /**
     * 按加载阶段排序
     * Sort by loading phase
     */
    private sortByLoadingPhase(moduleType: 'runtime' | 'editor'): string[] {
        const pluginIds = Array.from(this.plugins.keys());

        // 先按依赖拓扑排序
        const sorted = this.topologicalSort(pluginIds);

        // 再按加载阶段排序（稳定排序）
        sorted.sort((a, b) => {
            const pluginA = this.plugins.get(a);
            const pluginB = this.plugins.get(b);

            const moduleA = moduleType === 'runtime'
                ? pluginA?.plugin.descriptor.modules.find(m => m.type === 'runtime')
                : pluginA?.plugin.descriptor.modules.find(m => m.type === 'editor');

            const moduleB = moduleType === 'runtime'
                ? pluginB?.plugin.descriptor.modules.find(m => m.type === 'runtime')
                : pluginB?.plugin.descriptor.modules.find(m => m.type === 'editor');

            const phaseA = moduleA?.loadingPhase || 'default';
            const phaseB = moduleB?.loadingPhase || 'default';

            return LOADING_PHASE_ORDER.indexOf(phaseA) - LOADING_PHASE_ORDER.indexOf(phaseB);
        });

        return sorted;
    }

    /**
     * 拓扑排序（处理依赖）
     * Topological sort (handle dependencies)
     */
    private topologicalSort(pluginIds: string[]): string[] {
        const visited = new Set<string>();
        const result: string[] = [];

        const visit = (id: string) => {
            if (visited.has(id)) return;
            visited.add(id);

            const plugin = this.plugins.get(id);
            if (plugin) {
                const deps = plugin.plugin.descriptor.dependencies || [];
                for (const dep of deps) {
                    if (pluginIds.includes(dep.id)) {
                        visit(dep.id);
                    }
                }
            }

            result.push(id);
        };

        for (const id of pluginIds) {
            visit(id);
        }

        return result;
    }

    /**
     * 清理所有场景系统
     * Clear scene systems
     */
    clearSceneSystems(): void {
        for (const [pluginId, plugin] of this.plugins) {
            if (!plugin.enabled) continue;
            const runtimeModule = plugin.plugin.runtimeModule;
            if (runtimeModule?.onDestroy) {
                try {
                    runtimeModule.onDestroy();
                } catch (e) {
                    logger.error(`Error in ${pluginId}.onDestroy:`, e);
                }
            }
        }
    }

    /**
     * 重置
     * Reset
     */
    reset(): void {
        this.clearSceneSystems();
        this.plugins.clear();
        this.initialized = false;
        this.editorInitialized = false;
        logger.info('PluginManager reset');
    }
}
