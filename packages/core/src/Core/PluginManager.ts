import { IPlugin, IPluginMetadata, PluginState } from './Plugin';
import type { IService } from './ServiceContainer';
import type { Core } from '../Core';
import type { ServiceContainer } from './ServiceContainer';
import { createLogger } from '../Utils/Logger';

const logger = createLogger('PluginManager');

/**
 * 插件管理器
 *
 * 负责插件的注册、安装、卸载和生命周期管理。
 * 支持依赖检查和异步加载。
 *
 * @example
 * ```typescript
 * const core = Core.create();
 * const pluginManager = core.getService(PluginManager);
 *
 * // 注册插件
 * await pluginManager.install(new MyPlugin());
 *
 * // 查询插件
 * const plugin = pluginManager.getPlugin('my-plugin');
 *
 * // 卸载插件
 * await pluginManager.uninstall('my-plugin');
 * ```
 */
export class PluginManager implements IService {
    /**
     * 已安装的插件
     */
    private _plugins: Map<string, IPlugin> = new Map();

    /**
     * 插件元数据
     */
    private _metadata: Map<string, IPluginMetadata> = new Map();

    /**
     * Core实例引用
     */
    private _core: Core | null = null;

    /**
     * 服务容器引用
     */
    private _services: ServiceContainer | null = null;

    /**
     * 初始化插件管理器
     *
     * @param core - Core实例
     * @param services - 服务容器
     */
    public initialize(core: Core, services: ServiceContainer): void {
        this._core = core;
        this._services = services;
        logger.info('PluginManager initialized');
    }

    /**
     * 安装插件
     *
     * 会自动检查依赖并按正确顺序安装。
     *
     * @param plugin - 插件实例
     * @throws 如果依赖检查失败或安装失败
     */
    public async install(plugin: IPlugin): Promise<void> {
        if (!this._core || !this._services) {
            throw new Error('PluginManager not initialized. Call initialize() first.');
        }

        // 检查是否已安装
        if (this._plugins.has(plugin.name)) {
            logger.warn(`Plugin ${plugin.name} is already installed`);
            return;
        }

        // 检查依赖
        if (plugin.dependencies && plugin.dependencies.length > 0) {
            this._checkDependencies(plugin);
        }

        // 创建元数据
        const metadata: IPluginMetadata = {
            name: plugin.name,
            version: plugin.version,
            state: PluginState.NotInstalled,
            installedAt: Date.now()
        };

        this._metadata.set(plugin.name, metadata);

        try {
            // 调用插件的安装方法
            logger.info(`Installing plugin: ${plugin.name} v${plugin.version}`);
            await plugin.install(this._core, this._services);

            // 标记为已安装
            this._plugins.set(plugin.name, plugin);
            metadata.state = PluginState.Installed;

            logger.info(`Plugin ${plugin.name} installed successfully`);
        } catch (error) {
            // 安装失败
            metadata.state = PluginState.Failed;
            metadata.error = error instanceof Error ? error.message : String(error);

            logger.error(`Failed to install plugin ${plugin.name}:`, error);
            throw error;
        }
    }

    /**
     * 卸载插件
     *
     * @param name - 插件名称
     * @throws 如果插件未安装或卸载失败
     */
    public async uninstall(name: string): Promise<void> {
        const plugin = this._plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin ${name} is not installed`);
        }

        // 检查是否有其他插件依赖此插件
        this._checkDependents(name);

        try {
            logger.info(`Uninstalling plugin: ${name}`);
            await plugin.uninstall();

            // 从注册表中移除
            this._plugins.delete(name);
            this._metadata.delete(name);

            logger.info(`Plugin ${name} uninstalled successfully`);
        } catch (error) {
            logger.error(`Failed to uninstall plugin ${name}:`, error);
            throw error;
        }
    }

    /**
     * 获取插件实例
     *
     * @param name - 插件名称
     * @returns 插件实例，如果未安装则返回undefined
     */
    public getPlugin(name: string): IPlugin | undefined {
        return this._plugins.get(name);
    }

    /**
     * 获取插件元数据
     *
     * @param name - 插件名称
     * @returns 插件元数据，如果未安装则返回undefined
     */
    public getMetadata(name: string): IPluginMetadata | undefined {
        return this._metadata.get(name);
    }

    /**
     * 获取所有已安装的插件
     *
     * @returns 插件列表
     */
    public getAllPlugins(): IPlugin[] {
        return Array.from(this._plugins.values());
    }

    /**
     * 获取所有插件元数据
     *
     * @returns 元数据列表
     */
    public getAllMetadata(): IPluginMetadata[] {
        return Array.from(this._metadata.values());
    }

    /**
     * 检查插件是否已安装
     *
     * @param name - 插件名称
     * @returns 是否已安装
     */
    public isInstalled(name: string): boolean {
        return this._plugins.has(name);
    }

    /**
     * 检查插件依赖
     *
     * @param plugin - 插件实例
     * @throws 如果依赖未满足
     */
    private _checkDependencies(plugin: IPlugin): void {
        if (!plugin.dependencies) {
            return;
        }

        const missingDeps: string[] = [];

        for (const dep of plugin.dependencies) {
            if (!this._plugins.has(dep)) {
                missingDeps.push(dep);
            }
        }

        if (missingDeps.length > 0) {
            throw new Error(
                `Plugin ${plugin.name} has unmet dependencies: ${missingDeps.join(', ')}`
            );
        }
    }

    /**
     * 检查是否有其他插件依赖指定插件
     *
     * @param name - 插件名称
     * @throws 如果有其他插件依赖此插件
     */
    private _checkDependents(name: string): void {
        const dependents: string[] = [];

        for (const plugin of this._plugins.values()) {
            if (plugin.dependencies && plugin.dependencies.includes(name)) {
                dependents.push(plugin.name);
            }
        }

        if (dependents.length > 0) {
            throw new Error(
                `Cannot uninstall plugin ${name}: it is required by ${dependents.join(', ')}`
            );
        }
    }

    /**
     * 释放资源
     */
    public dispose(): void {
        // 卸载所有插件（逆序，先卸载依赖项）
        const plugins = Array.from(this._plugins.values()).reverse();

        for (const plugin of plugins) {
            try {
                logger.info(`Disposing plugin: ${plugin.name}`);
                plugin.uninstall();
            } catch (error) {
                logger.error(`Error disposing plugin ${plugin.name}:`, error);
            }
        }

        this._plugins.clear();
        this._metadata.clear();
        this._core = null;
        this._services = null;

        logger.info('PluginManager disposed');
    }
}
