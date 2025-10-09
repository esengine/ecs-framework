import { GlobalManager } from './Utils/GlobalManager';
import { TimerManager } from './Utils/Timers/TimerManager';
import { ITimer } from './Utils/Timers/ITimer';
import { Timer } from './Utils/Timers/Timer';
import { Time } from './Utils/Time';
import { PerformanceMonitor } from './Utils/PerformanceMonitor';
import { PoolManager } from './Utils/Pool/PoolManager';
import { DebugManager } from './Utils/Debug';
import { ICoreConfig, IECSDebugConfig } from './Types';
import { createLogger } from './Utils/Logger';
import { SceneManager } from './ECS/SceneManager';
import { IScene } from './ECS/IScene';

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
     */
    private static _instance: Core;

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
     * 全局管理器集合
     *
     * 存储所有注册的全局管理器实例。
     */
    public _globalManagers: GlobalManager[] = [];

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

        // 初始化定时器管理器
        this._timerManager = new TimerManager();
        Core.registerGlobalManager(this._timerManager);

        // 初始化性能监控器
        this._performanceMonitor = PerformanceMonitor.instance;

        // 在调试模式下启用性能监控
        if (this._config.debug) {
            this._performanceMonitor.enable();
        }

        // 初始化对象池管理器
        this._poolManager = PoolManager.getInstance();

        // 初始化场景管理器
        this._sceneManager = new SceneManager();

        Core.entitySystemsEnabled = this._config.enableEntitySystems ?? true;
        this.debug = this._config.debug ?? true;

        // 初始化调试管理器
        if (this._config.debugConfig?.enabled) {
            this._debugManager = new DebugManager(this, this._config.debugConfig);
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
     * 注册全局管理器
     *
     * 将管理器添加到全局管理器列表中，并启用它。
     *
     * @param manager - 要注册的全局管理器
     */
    public static registerGlobalManager(manager: GlobalManager) {
        this._instance._globalManagers.push(manager);
        manager.enabled = true;
    }

    /**
     * 注销全局管理器
     *
     * 从全局管理器列表中移除管理器，并禁用它。
     *
     * @param manager - 要注销的全局管理器
     */
    public static unregisterGlobalManager(manager: GlobalManager) {
        this._instance._globalManagers.splice(this._instance._globalManagers.indexOf(manager), 1);
        manager.enabled = false;
    }

    /**
     * 获取指定类型的全局管理器
     *
     * @param type - 管理器类型构造函数
     * @returns 管理器实例，如果未找到则返回null
     */
    public static getGlobalManager<T extends GlobalManager>(type: new (...args: unknown[]) => T): T | null {
        for (const manager of this._instance._globalManagers) {
            if (manager instanceof type)
                return manager as T;
        }
        return null;
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
            this._instance._debugManager = new DebugManager(this._instance, config);
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

        // 更新全局管理器
        const managersStartTime = this._performanceMonitor.startMonitoring('GlobalManagers.update');
        for (const globalManager of this._globalManagers) {
            if (globalManager.enabled)
                globalManager.update();
        }
        this._performanceMonitor.endMonitoring('GlobalManagers.update', managersStartTime, this._globalManagers.length);

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

        // 清理全局管理器
        for (const manager of this._instance._globalManagers) {
            manager.enabled = false;
        }
        this._instance._globalManagers = [];

        Core._logger.info('Core destroyed');

        // @ts-ignore - 清空实例引用
        this._instance = null;
    }
}
