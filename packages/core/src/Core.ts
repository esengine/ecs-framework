import { TimerManager } from './Utils/Timers/TimerManager';
import { ITimer } from './Utils/Timers/ITimer';
import { Timer } from './Utils/Timers/Timer';
import { Time } from './Utils/Time';
import { PerformanceMonitor } from './Utils/PerformanceMonitor';
import { PoolManager } from './Utils/Pool/PoolManager';
import { DebugManager } from './Utils/Debug';
import { ICoreConfig, IECSDebugConfig, IUpdatable, isUpdatable } from './Types';
import { createLogger } from './Utils/Logger';
import { SceneManager } from './ECS/SceneManager';
import { IScene } from './ECS/IScene';
import { ServiceContainer } from './Core/ServiceContainer';
import { PluginManager } from './Core/PluginManager';
import { IPlugin } from './Core/Plugin';

/**
 * 游戏引擎核心类
 *
 * 职责：
 * - 提供全局服务（Timer、Performance、Pool等）
 * - 管理场景生命周期（内置SceneManager）
 * - 管理全局管理器的生命周期
 * - 提供统一的游戏循环更新入口
 *
 * @example
 * ```typescript
 * // 初始化并设置场景
 * Core.create({ debug: true });
 * Core.setScene(new GameScene());
 *
 * // 游戏循环（自动更新全局服务和场景）
 * function gameLoop(deltaTime: number) {
 *     Core.update(deltaTime);
 * }
 *
 * // 使用定时器
 * Core.schedule(1.0, false, null, (timer) => {
 *     console.log("1秒后执行");
 * });
 *
 * // 切换场景
 * Core.loadScene(new MenuScene());  // 延迟切换
 * Core.setScene(new GameScene());   // 立即切换
 *
 * // 获取当前场景
 * const currentScene = Core.scene;
 * ```
 */
export class Core {
    /**
     * 游戏暂停状态
     *
     * 当设置为true时，游戏循环将暂停执行。
     */
    public static paused = false;

    /**
     * 全局核心实例
     *
     * 可能为null表示Core尚未初始化或已被销毁
     */
    private static _instance: Core | null = null;

    /**
     * Core专用日志器
     */
    private static _logger = createLogger('Core');

    /**
     * 实体系统启用状态
     *
     * 控制是否启用ECS实体系统功能。
     */
    public static entitySystemsEnabled: boolean;

    /**
     * 调试模式标志
     *
     * 在调试模式下会启用额外的性能监控和错误检查。
     */
    public readonly debug: boolean;

    /**
     * 服务容器
     *
     * 管理所有服务的注册、解析和生命周期。
     */
    private _serviceContainer: ServiceContainer;

    /**
     * 定时器管理器
     *
     * 负责管理所有的游戏定时器。
     */
    public _timerManager: TimerManager;

    /**
     * 性能监控器
     *
     * 监控游戏性能并提供优化建议。
     */
    public _performanceMonitor: PerformanceMonitor;

    /**
     * 对象池管理器
     *
     * 管理所有对象池的生命周期。
     */
    public _poolManager: PoolManager;

    /**
     * 调试管理器
     *
     * 负责收集和发送调试数据。
     */
    public _debugManager?: DebugManager;

    /**
     * 场景管理器
     *
     * 管理当前场景的生命周期。
     */
    private _sceneManager: SceneManager;

    /**
     * 插件管理器
     *
     * 管理所有插件的生命周期。
     */
    private _pluginManager: PluginManager;

    /**
     * Core配置
     */
    private _config: ICoreConfig;

    /**
     * 创建核心实例
     *
     * @param config - Core配置对象
     */
    private constructor(config: ICoreConfig = {}) {
        Core._instance = this;

        // 保存配置
        this._config = {
            debug: true,
            enableEntitySystems: true,
            ...config
        };

        // 初始化服务容器
        this._serviceContainer = new ServiceContainer();

        // 初始化定时器管理器
        this._timerManager = new TimerManager();
        this._serviceContainer.registerInstance(TimerManager, this._timerManager);

        // 初始化性能监控器
        this._performanceMonitor = new PerformanceMonitor();
        this._serviceContainer.registerInstance(PerformanceMonitor, this._performanceMonitor);

        // 在调试模式下启用性能监控
        if (this._config.debug) {
            this._performanceMonitor.enable();
        }

        // 初始化对象池管理器
        this._poolManager = new PoolManager();
        this._serviceContainer.registerInstance(PoolManager, this._poolManager);

        // 初始化场景管理器
        this._sceneManager = new SceneManager();
        this._serviceContainer.registerInstance(SceneManager, this._sceneManager);

        // 初始化插件管理器
        this._pluginManager = new PluginManager();
        this._pluginManager.initialize(this, this._serviceContainer);
        this._serviceContainer.registerInstance(PluginManager, this._pluginManager);

        Core.entitySystemsEnabled = this._config.enableEntitySystems ?? true;
        this.debug = this._config.debug ?? true;

        // 初始化调试管理器
        if (this._config.debugConfig?.enabled) {
            // 使用DI容器创建DebugManager（前两个参数从容器解析，config手动传入）
            const config = this._config.debugConfig;
            this._debugManager = new DebugManager(
                this._serviceContainer.resolve(SceneManager),
                this._serviceContainer.resolve(PerformanceMonitor),
                config
            );
            this._serviceContainer.registerInstance(DebugManager, this._debugManager);
        }

        this.initialize();
    }

    /**
     * 获取核心实例
     *
     * @returns 全局核心实例
     */
    public static get Instance() {
        return this._instance;
    }

    /**
     * 获取服务容器
     *
     * 用于注册和解析自定义服务。
     *
     * @returns 服务容器实例
     * @throws 如果Core实例未创建
     *
     * @example
     * ```typescript
     * // 注册自定义服务
     * Core.services.registerSingleton(MyService);
     *
     * // 解析服务
     * const myService = Core.services.resolve(MyService);
     * ```
     */
    public static get services(): ServiceContainer {
        if (!this._instance) {
            throw new Error('Core实例未创建，请先调用Core.create()');
        }
        return this._instance._serviceContainer;
    }

    /**
     * 创建Core实例
     *
     * 如果实例已存在，则返回现有实例。
     *
     * @param config - Core配置，也可以直接传入boolean表示debug模式（向后兼容）
     * @returns Core实例
     *
     * @example
     * ```typescript
     * // 方式1：使用配置对象
     * Core.create({
     *     debug: true,
     *     enableEntitySystems: true,
     *     debugConfig: {
     *         enabled: true,
     *         websocketUrl: 'ws://localhost:9229'
     *     }
     * });
     *
     * // 方式2：简单模式（向后兼容）
     * Core.create(true);  // debug = true
     * ```
     */
    public static create(config: ICoreConfig | boolean = true): Core {
        if (this._instance == null) {
            // 向后兼容：如果传入boolean，转换为配置对象
            const coreConfig: ICoreConfig = typeof config === 'boolean'
                ? { debug: config, enableEntitySystems: true }
                : config;
            this._instance = new Core(coreConfig);
        } else {
            this._logger.warn('Core实例已创建，返回现有实例');
        }
        return this._instance;
    }

    /**
     * 设置当前场景
     *
     * @param scene - 要设置的场景
     * @returns 设置的场景实例
     *
     * @example
     * ```typescript
     * Core.create({ debug: true });
     *
     * // 创建并设置场景
     * const gameScene = new GameScene();
     * Core.setScene(gameScene);
     * ```
     */
    public static setScene<T extends IScene>(scene: T): T {
        if (!this._instance) {
            Core._logger.warn("Core实例未创建，请先调用Core.create()");
            throw new Error("Core实例未创建");
        }

        return this._instance._sceneManager.setScene(scene);
    }

    /**
     * 获取当前场景
     *
     * @returns 当前场景，如果没有场景则返回null
     */
    public static get scene(): IScene | null {
        if (!this._instance) {
            return null;
        }
        return this._instance._sceneManager.currentScene;
    }

    /**
     * 获取ECS流式API
     *
     * @returns ECS API实例，如果当前没有场景则返回null
     *
     * @example
     * ```typescript
     * // 使用流式API创建实体
     * const player = Core.ecsAPI?.createEntity('Player')
     *     .addComponent(Position, 100, 100)
     *     .addComponent(Velocity, 50, 0);
     *
     * // 查询实体
     * const enemies = Core.ecsAPI?.query(Enemy, Transform);
     *
     * // 发射事件
     * Core.ecsAPI?.emit('game:start', { level: 1 });
     * ```
     */
    public static get ecsAPI() {
        if (!this._instance) {
            return null;
        }
        return this._instance._sceneManager.api;
    }

    /**
     * 延迟加载场景（下一帧切换）
     *
     * @param scene - 要加载的场景
     *
     * @example
     * ```typescript
     * // 延迟切换场景（在下一帧生效）
     * Core.loadScene(new MenuScene());
     * ```
     */
    public static loadScene<T extends IScene>(scene: T): void {
        if (!this._instance) {
            Core._logger.warn("Core实例未创建，请先调用Core.create()");
            return;
        }

        this._instance._sceneManager.loadScene(scene);
    }

    /**
     * 更新游戏逻辑
     *
     * 此方法应该在游戏引擎的更新循环中调用。
     * 会自动更新全局服务和当前场景。
     *
     * @param deltaTime - 外部引擎提供的帧时间间隔（秒）
     *
     * @example
     * ```typescript
     * // 初始化
     * Core.create({ debug: true });
     * Core.setScene(new GameScene());
     *
     * // Laya引擎集成
     * Laya.timer.frameLoop(1, this, () => {
     *     const deltaTime = Laya.timer.delta / 1000;
     *     Core.update(deltaTime);  // 自动更新全局服务和场景
     * });
     *
     * // Cocos Creator集成
     * update(deltaTime: number) {
     *     Core.update(deltaTime);  // 自动更新全局服务和场景
     * }
     * ```
     */
    public static update(deltaTime: number): void {
        if (!this._instance) {
            Core._logger.warn("Core实例未创建，请先调用Core.create()");
            return;
        }

        this._instance.updateInternal(deltaTime);
    }


    /**
     * 调度定时器
     *
     * 创建一个定时器，在指定时间后执行回调函数。
     *
     * @param timeInSeconds - 延迟时间（秒）
     * @param repeats - 是否重复执行，默认为false
     * @param context - 回调函数的上下文，默认为null
     * @param onTime - 定时器触发时的回调函数
     * @returns 创建的定时器实例
     * @throws 如果Core实例未创建或onTime回调未提供
     *
     * @example
     * ```typescript
     * // 一次性定时器
     * Core.schedule(1.0, false, null, (timer) => {
     *     console.log("1秒后执行一次");
     * });
     *
     * // 重复定时器
     * Core.schedule(0.5, true, null, (timer) => {
     *     console.log("每0.5秒执行一次");
     * });
     * ```
     */
    public static schedule<TContext = unknown>(timeInSeconds: number, repeats: boolean = false, context?: TContext, onTime?: (timer: ITimer<TContext>) => void): Timer<TContext> {
        if (!this._instance) {
            throw new Error('Core实例未创建，请先调用Core.create()');
        }
        if (!onTime) {
            throw new Error('onTime callback is required');
        }
        return this._instance._timerManager.schedule(timeInSeconds, repeats, context as TContext, onTime);
    }

    /**
     * 启用调试功能
     *
     * @param config 调试配置
     */
    public static enableDebug(config: IECSDebugConfig): void {
        if (!this._instance) {
            Core._logger.warn("Core实例未创建，请先调用Core.create()");
            return;
        }

        if (this._instance._debugManager) {
            this._instance._debugManager.updateConfig(config);
        } else {
            // 使用DI容器创建DebugManager
            this._instance._debugManager = new DebugManager(
                this._instance._serviceContainer.resolve(SceneManager),
                this._instance._serviceContainer.resolve(PerformanceMonitor),
                config
            );
            this._instance._serviceContainer.registerInstance(DebugManager, this._instance._debugManager);
        }

        // 更新Core配置
        this._instance._config.debugConfig = config;
    }

    /**
     * 禁用调试功能
     */
    public static disableDebug(): void {
        if (!this._instance) return;

        if (this._instance._debugManager) {
            this._instance._debugManager.stop();
            this._instance._debugManager = undefined;
        }

        // 更新Core配置
        if (this._instance._config.debugConfig) {
            this._instance._config.debugConfig.enabled = false;
        }
    }

    /**
     * 获取调试数据
     *
     * @returns 当前调试数据，如果调试未启用则返回null
     */
    public static getDebugData(): unknown {
        if (!this._instance?._debugManager) {
            return null;
        }

        return this._instance._debugManager.getDebugData();
    }

    /**
     * 检查调试是否启用
     *
     * @returns 调试状态
     */
    public static get isDebugEnabled(): boolean {
        return this._instance?._config.debugConfig?.enabled || false;
    }

    /**
     * 安装插件
     *
     * @param plugin - 插件实例
     * @throws 如果Core实例未创建或插件安装失败
     *
     * @example
     * ```typescript
     * Core.create({ debug: true });
     *
     * // 安装插件
     * await Core.installPlugin(new MyPlugin());
     * ```
     */
    public static async installPlugin(plugin: IPlugin): Promise<void> {
        if (!this._instance) {
            throw new Error('Core实例未创建，请先调用Core.create()');
        }

        await this._instance._pluginManager.install(plugin);
    }

    /**
     * 卸载插件
     *
     * @param name - 插件名称
     * @throws 如果Core实例未创建或插件卸载失败
     *
     * @example
     * ```typescript
     * await Core.uninstallPlugin('my-plugin');
     * ```
     */
    public static async uninstallPlugin(name: string): Promise<void> {
        if (!this._instance) {
            throw new Error('Core实例未创建，请先调用Core.create()');
        }

        await this._instance._pluginManager.uninstall(name);
    }

    /**
     * 获取插件实例
     *
     * @param name - 插件名称
     * @returns 插件实例，如果未安装则返回undefined
     *
     * @example
     * ```typescript
     * const myPlugin = Core.getPlugin('my-plugin');
     * if (myPlugin) {
     *     console.log(myPlugin.version);
     * }
     * ```
     */
    public static getPlugin(name: string): IPlugin | undefined {
        if (!this._instance) {
            return undefined;
        }

        return this._instance._pluginManager.getPlugin(name);
    }

    /**
     * 检查插件是否已安装
     *
     * @param name - 插件名称
     * @returns 是否已安装
     *
     * @example
     * ```typescript
     * if (Core.isPluginInstalled('my-plugin')) {
     *     console.log('Plugin is installed');
     * }
     * ```
     */
    public static isPluginInstalled(name: string): boolean {
        if (!this._instance) {
            return false;
        }

        return this._instance._pluginManager.isInstalled(name);
    }

    /**
     * 初始化核心系统
     *
     * 执行核心系统的初始化逻辑。
     */
    protected initialize() {
        // 核心系统初始化
        Core._logger.info('Core initialized', {
            debug: this.debug,
            entitySystemsEnabled: Core.entitySystemsEnabled,
            debugEnabled: this._config.debugConfig?.enabled || false
        });
    }

    /**
     * 内部更新方法
     *
     * @param deltaTime - 帧时间间隔（秒）
     */
    private updateInternal(deltaTime: number): void {
        if (Core.paused) return;

        // 开始性能监控
        const frameStartTime = this._performanceMonitor.startMonitoring('Core.update');

        // 更新时间系统
        Time.update(deltaTime);

        // 更新FPS监控（如果性能监控器支持）
        if ('updateFPS' in this._performanceMonitor && typeof this._performanceMonitor.updateFPS === 'function') {
            this._performanceMonitor.updateFPS(Time.deltaTime);
        }

        // 更新所有可更新的服务
        const servicesStartTime = this._performanceMonitor.startMonitoring('Services.update');
        this._serviceContainer.updateAll(deltaTime);
        this._performanceMonitor.endMonitoring('Services.update', servicesStartTime, this._serviceContainer.getUpdatableCount());

        // 更新对象池管理器
        this._poolManager.update();

        // 更新场景
        this._sceneManager.update();

        // 更新调试管理器（基于FPS的数据发送）
        if (this._debugManager) {
            this._debugManager.onFrameUpdate(deltaTime);
        }

        // 结束性能监控
        this._performanceMonitor.endMonitoring('Core.update', frameStartTime);
    }

    /**
     * 销毁Core实例
     *
     * 清理所有资源，通常在应用程序关闭时调用。
     */
    public static destroy(): void {
        if (!this._instance) return;

        // 停止调试管理器
        if (this._instance._debugManager) {
            this._instance._debugManager.stop();
        }

        // 清理所有服务
        this._instance._serviceContainer.clear();

        Core._logger.info('Core destroyed');

        // 清空实例引用，允许重新创建Core实例
        this._instance = null;
    }
}
