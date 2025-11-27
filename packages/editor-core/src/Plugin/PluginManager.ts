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
    LoadingPhase
} from './PluginDescriptor';
import type {
    IPluginLoader,
    SystemContext
} from './IPluginLoader';
import { EntityCreationRegistry } from '../Services/EntityCreationRegistry';
import { ComponentActionRegistry } from '../Services/ComponentActionRegistry';
import { FileActionRegistry } from '../Services/FileActionRegistry';
import { UIRegistry } from '../Services/UIRegistry';

const logger = createLogger('PluginManager');

/**
 * PluginManager 服务标识符
 * PluginManager service identifier
 */
export const IPluginManager = Symbol.for('IPluginManager');

/**
 * 已注册的插件信息
 * Registered plugin info
 */
export interface RegisteredPlugin {
    /** 插件加载器 | Plugin loader */
    loader: IPluginLoader;
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

    constructor() {}

    /**
     * 释放资源
     * Dispose resources
     */
    dispose(): void {
        this.reset();
    }

    /**
     * 注册插件
     * Register plugin
     */
    register(loader: IPluginLoader): void {
        if (!loader) {
            logger.error('Cannot register plugin: loader is null or undefined');
            return;
        }

        if (!loader.descriptor) {
            logger.error('Cannot register plugin: descriptor is null or undefined', loader);
            return;
        }

        const { id } = loader.descriptor;

        if (!id) {
            logger.error('Cannot register plugin: descriptor.id is null or undefined', loader.descriptor);
            return;
        }

        if (this.plugins.has(id)) {
            logger.warn(`Plugin ${id} is already registered, skipping`);
            return;
        }

        const enabled = loader.descriptor.isCore || loader.descriptor.enabledByDefault;

        this.plugins.set(id, {
            loader,
            state: 'loaded',
            enabled,
            loadedAt: Date.now()
        });

        logger.info(`Plugin registered: ${id} (${loader.descriptor.name})`);
    }

    /**
     * 启用插件
     * Enable plugin
     */
    enable(pluginId: string): boolean {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            logger.error(`Plugin ${pluginId} not found`);
            return false;
        }

        if (plugin.loader.descriptor.isCore) {
            logger.warn(`Core plugin ${pluginId} cannot be disabled/enabled`);
            return false;
        }

        // 检查依赖
        const deps = plugin.loader.descriptor.dependencies || [];
        for (const dep of deps) {
            if (dep.optional) continue;
            const depPlugin = this.plugins.get(dep.id);
            if (!depPlugin || !depPlugin.enabled) {
                logger.error(`Cannot enable ${pluginId}: dependency ${dep.id} is not enabled`);
                return false;
            }
        }

        plugin.enabled = true;
        plugin.state = 'loaded';
        logger.info(`Plugin enabled: ${pluginId}`);
        return true;
    }

    /**
     * 禁用插件
     * Disable plugin
     */
    disable(pluginId: string): boolean {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            logger.error(`Plugin ${pluginId} not found`);
            return false;
        }

        if (plugin.loader.descriptor.isCore) {
            logger.warn(`Core plugin ${pluginId} cannot be disabled`);
            return false;
        }

        // 检查是否有其他插件依赖此插件
        for (const [id, p] of this.plugins) {
            if (!p.enabled || id === pluginId) continue;
            const deps = p.loader.descriptor.dependencies || [];
            const hasDep = deps.some(d => d.id === pluginId && !d.optional);
            if (hasDep) {
                logger.error(`Cannot disable ${pluginId}: plugin ${id} depends on it`);
                return false;
            }
        }

        plugin.enabled = false;
        plugin.state = 'disabled';
        logger.info(`Plugin disabled: ${pluginId}`);
        return true;
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
            p => p.loader.descriptor.category === category
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

        logger.info('Initializing runtime modules...');

        const sortedPlugins = this.sortByLoadingPhase('runtime');

        // 注册组件
        for (const pluginId of sortedPlugins) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin?.enabled) continue;

            const runtimeModule = plugin.loader.runtimeModule;
            if (runtimeModule) {
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

            const runtimeModule = plugin.loader.runtimeModule;
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

            const runtimeModule = plugin.loader.runtimeModule;
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
        logger.info('Creating systems for scene...');

        const sortedPlugins = this.sortByLoadingPhase('runtime');

        for (const pluginId of sortedPlugins) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin?.enabled || plugin.state === 'error') continue;

            const runtimeModule = plugin.loader.runtimeModule;
            if (runtimeModule?.createSystems) {
                try {
                    runtimeModule.createSystems(scene, context);
                    logger.debug(`Systems created for: ${pluginId}`);
                } catch (e) {
                    logger.error(`Failed to create systems for ${pluginId}:`, e);
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

        logger.info('Initializing editor modules...');

        const sortedPlugins = this.sortByLoadingPhase('editor');

        // 获取注册表服务 | Get registry services
        const entityCreationRegistry = services.tryResolve(EntityCreationRegistry);
        const componentActionRegistry = services.tryResolve(ComponentActionRegistry);
        const fileActionRegistry = services.tryResolve(FileActionRegistry);
        const uiRegistry = services.tryResolve(UIRegistry);

        for (const pluginId of sortedPlugins) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin?.enabled) continue;

            const editorModule = plugin.loader.editorModule;
            if (editorModule) {
                try {
                    // 安装编辑器模块 | Install editor module
                    await editorModule.install(services);
                    logger.debug(`Editor module installed: ${pluginId}`);

                    // 注册实体创建模板 | Register entity creation templates
                    if (entityCreationRegistry && editorModule.getEntityCreationTemplates) {
                        const templates = editorModule.getEntityCreationTemplates();
                        if (templates && templates.length > 0) {
                            entityCreationRegistry.registerMany(templates);
                            logger.debug(`Registered ${templates.length} entity templates from: ${pluginId}`);
                        }
                    }

                    // 注册组件操作 | Register component actions
                    if (componentActionRegistry && editorModule.getComponentActions) {
                        const actions = editorModule.getComponentActions();
                        if (actions && actions.length > 0) {
                            for (const action of actions) {
                                componentActionRegistry.register(action);
                            }
                            logger.debug(`Registered ${actions.length} component actions from: ${pluginId}`);
                        }
                    }

                    // 注册文件操作处理器 | Register file action handlers
                    if (fileActionRegistry && editorModule.getFileActionHandlers) {
                        const handlers = editorModule.getFileActionHandlers();
                        if (handlers && handlers.length > 0) {
                            for (const handler of handlers) {
                                fileActionRegistry.registerActionHandler(handler);
                            }
                            logger.debug(`Registered ${handlers.length} file action handlers from: ${pluginId}`);
                        }
                    }

                    // 注册文件创建模板 | Register file creation templates
                    if (fileActionRegistry && editorModule.getFileCreationTemplates) {
                        const templates = editorModule.getFileCreationTemplates();
                        if (templates && templates.length > 0) {
                            for (const template of templates) {
                                fileActionRegistry.registerCreationTemplate(template);
                            }
                            logger.debug(`Registered ${templates.length} file creation templates from: ${pluginId}`);
                        }
                    }

                    // 注册面板 | Register panels
                    if (uiRegistry && editorModule.getPanels) {
                        const panels = editorModule.getPanels();
                        if (panels && panels.length > 0) {
                            uiRegistry.registerPanels(panels);
                            logger.debug(`Registered ${panels.length} panels from: ${pluginId}`);
                        }
                    }
                } catch (e) {
                    logger.error(`Failed to install editor module for ${pluginId}:`, e);
                    plugin.state = 'error';
                    plugin.error = e as Error;
                }
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

        const editorModule = plugin.loader.editorModule;
        if (!editorModule) {
            return;
        }

        // 获取注册表服务 | Get registry services
        const entityCreationRegistry = services.tryResolve(EntityCreationRegistry);
        const componentActionRegistry = services.tryResolve(ComponentActionRegistry);
        const fileActionRegistry = services.tryResolve(FileActionRegistry);
        const uiRegistry = services.tryResolve(UIRegistry);

        try {
            // 安装编辑器模块 | Install editor module
            await editorModule.install(services);
            logger.debug(`Editor module installed: ${pluginId}`);

            // 注册实体创建模板 | Register entity creation templates
            if (entityCreationRegistry && editorModule.getEntityCreationTemplates) {
                const templates = editorModule.getEntityCreationTemplates();
                if (templates && templates.length > 0) {
                    entityCreationRegistry.registerMany(templates);
                    logger.debug(`Registered ${templates.length} entity templates from: ${pluginId}`);
                }
            }

            // 注册组件操作 | Register component actions
            if (componentActionRegistry && editorModule.getComponentActions) {
                const actions = editorModule.getComponentActions();
                if (actions && actions.length > 0) {
                    for (const action of actions) {
                        componentActionRegistry.register(action);
                    }
                    logger.debug(`Registered ${actions.length} component actions from: ${pluginId}`);
                }
            }

            // 注册文件操作处理器 | Register file action handlers
            if (fileActionRegistry && editorModule.getFileActionHandlers) {
                const handlers = editorModule.getFileActionHandlers();
                if (handlers && handlers.length > 0) {
                    for (const handler of handlers) {
                        fileActionRegistry.registerActionHandler(handler);
                    }
                    logger.debug(`Registered ${handlers.length} file action handlers from: ${pluginId}`);
                }
            }

            // 注册文件创建模板 | Register file creation templates
            if (fileActionRegistry && editorModule.getFileCreationTemplates) {
                const templates = editorModule.getFileCreationTemplates();
                if (templates && templates.length > 0) {
                    for (const template of templates) {
                        fileActionRegistry.registerCreationTemplate(template);
                    }
                    logger.debug(`Registered ${templates.length} file creation templates from: ${pluginId}`);
                }
            }

            // 注册面板 | Register panels
            if (uiRegistry && editorModule.getPanels) {
                const panels = editorModule.getPanels();
                if (panels && panels.length > 0) {
                    uiRegistry.registerPanels(panels);
                    logger.debug(`Registered ${panels.length} panels from: ${pluginId}`);
                }
            }

            // 调用 onEditorReady（如果编辑器已就绪）
            if (this.editorInitialized && editorModule.onEditorReady) {
                await editorModule.onEditorReady();
            }
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
            const editorModule = plugin.loader.editorModule;
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
            const editorModule = plugin.loader.editorModule;
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
            const editorModule = plugin.loader.editorModule;
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
            const editorModule = plugin.loader.editorModule;
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
            const editorModule = plugin.loader.editorModule;
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
            const editorModule = plugin.loader.editorModule;
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
            if (plugin.enabled && !plugin.loader.descriptor.isCore) {
                enabledPlugins.push(id);
            }
        }
        return { enabledPlugins };
    }

    /**
     * 加载配置
     * Load configuration
     */
    loadConfig(config: PluginConfig): void {
        const { enabledPlugins } = config;

        for (const [id, plugin] of this.plugins) {
            if (plugin.loader.descriptor.isCore) {
                plugin.enabled = true;
            } else {
                plugin.enabled = enabledPlugins.includes(id);
                plugin.state = plugin.enabled ? 'loaded' : 'disabled';
            }
        }

        logger.info(`Loaded config: ${enabledPlugins.length} plugins enabled`);
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
                ? pluginA?.loader.descriptor.modules.find(m => m.type === 'runtime')
                : pluginA?.loader.descriptor.modules.find(m => m.type === 'editor');

            const moduleB = moduleType === 'runtime'
                ? pluginB?.loader.descriptor.modules.find(m => m.type === 'runtime')
                : pluginB?.loader.descriptor.modules.find(m => m.type === 'editor');

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
                const deps = plugin.loader.descriptor.dependencies || [];
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
            const runtimeModule = plugin.loader.runtimeModule;
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
