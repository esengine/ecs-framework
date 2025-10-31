import type {Core} from "../Core";
import type {ServiceContainer} from "./ServiceContainer";

/**
 * 插件状态
 */
export enum PluginState {
    /**
     * 未安装
     */
    NotInstalled = "not_installed",

    /**
     * 已安装
     */
    Installed = "installed",

    /**
     * 安装失败
     */
    Failed = "failed"
}

/**
 * 插件接口
 *
 * 所有插件都必须实现此接口。
 * 插件提供了一种扩展框架功能的标准方式。
 *
 * @example
 * ```typescript
 * class MyPlugin implements IPlugin {
 *     readonly name = 'my-plugin';
 *     readonly version = '1.0.0';
 *     readonly dependencies = ['other-plugin'];
 *
 *     async install(core: Core, services: ServiceContainer) {
 *         // 注册服务
 *         services.registerSingleton(MyService);
 *
 *         // 添加系统
 *         const world = core.getWorld();
 *         if (world) {
 *             world.addSystem(new MySystem());
 *         }
 *     }
 *
 *     async uninstall() {
 *         // 清理资源
 *     }
 * }
 * ```
 */
export interface IPlugin {
    /**
     * 插件唯一名称
     *
     * 用于依赖解析和插件管理。
     */
    readonly name: string;

    /**
     * 插件版本
     *
     * 遵循语义化版本规范 (semver)。
     */
    readonly version: string;

    /**
     * 依赖的其他插件名称列表
     *
     * 这些插件必须在当前插件之前安装。
     */
    readonly dependencies?: readonly string[];

    /**
     * 安装插件
     *
     * 在此方法中初始化插件，注册服务、系统等。
     * 可以是同步或异步的。
     *
     * @param core - Core实例，用于访问World等
     * @param services - 服务容器，用于注册服务
     */
    install(core: Core, services: ServiceContainer): void | Promise<void>;

    /**
     * 卸载插件
     *
     * 清理插件占用的资源。
     * 可以是同步或异步的。
     */
    uninstall(): void | Promise<void>;
}

/**
 * 插件元数据
 */
export interface IPluginMetadata {
    /**
     * 插件名称
     */
    name: string;

    /**
     * 插件版本
     */
    version: string;

    /**
     * 插件状态
     */
    state: PluginState;

    /**
     * 安装时间戳
     */
    installedAt?: number;

    /**
     * 错误信息（如果安装失败）
     */
    error?: string;
}
