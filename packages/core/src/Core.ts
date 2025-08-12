import { GlobalManager } from './Utils/GlobalManager';
import { TimerManager } from './Utils/Timers/TimerManager';
import { ITimer } from './Utils/Timers/ITimer';
import { Timer } from './Utils/Timers/Timer';
import { Time } from './Utils/Time';
import { PerformanceMonitor } from './Utils/PerformanceMonitor';
import { PoolManager } from './Utils/Pool/PoolManager';
import { ECSFluentAPI, createECSAPI } from './ECS/Core/FluentAPI';
import { Scene } from './ECS/Scene';
import { IScene } from './ECS/IScene';
import { DebugManager } from './Utils/Debug';
import { ICoreConfig, IECSDebugConfig } from './Types';
import { BigIntFactory, EnvironmentInfo } from './ECS/Utils/BigIntCompatibility';
import { createLogger } from './Utils/Logger';

/**
 * 游戏引擎核心类
 * 
 * 负责管理游戏的生命周期、场景切换、全局管理器和定时器系统。
 * 提供统一的游戏循环管理。
 * 
 * @example
 * ```typescript
 * // 创建核心实例
 * const core = Core.create(true);
 * 
 * // 设置场景
 * Core.scene = new MyScene();
 * 
 * // 在游戏循环中更新（Laya引擎示例）
 * Laya.timer.frameLoop(1, this, () => {
 *     const deltaTime = Laya.timer.delta / 1000;
 *     Core.update(deltaTime);
 * });
 * 
 * // 调度定时器
 * Core.schedule(1.0, false, null, (timer) => {
 *     Core._logger.info("1秒后执行");
 * });
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
     * 待切换的场景
     * 
     * 存储下一帧要切换到的场景实例。
     */
    public _nextScene: IScene | null = null;
    
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
     * ECS流式API
     * 
     * 提供便捷的ECS操作接口。
     */
    public _ecsAPI?: ECSFluentAPI;
    
    /**
     * 当前活动场景
     */
    public _scene?: IScene;

    /**
     * 调试管理器
     * 
     * 负责收集和发送调试数据。
     */
    public _debugManager?: DebugManager;

    /**
     * Core配置
     */
    private _config: ICoreConfig;

    /**
     * 兼容性信息
     */
    private _environmentInfo: EnvironmentInfo;

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

        // 检测环境兼容性
        this._environmentInfo = BigIntFactory.getEnvironmentInfo();

        // 初始化管理器
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
        
        Core.entitySystemsEnabled = this._config.enableEntitySystems ?? true;
        this.debug = this._config.debug ?? true;

        // 初始化调试管理器
        if (this._config.debugConfig?.enabled) {
            this._debugManager = new DebugManager(this, this._config.debugConfig);
        }

        // 在调试模式下显示兼容性信息
        if (this._config.debug) {
            this.logCompatibilityInfo();
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
     * 获取当前活动的场景
     * 
     * @returns 当前场景实例，如果没有则返回null
     */
    public static get scene(): IScene | null {
        if (!this._instance)
            return null;
        return this._instance._scene || null;
    }

    /**
     * 设置当前活动的场景
     * 
     * 如果当前没有场景，会立即切换；否则会在下一帧切换。
     * 
     * @param value - 要设置的场景实例
     */
    public static set scene(value: IScene | null) {
        if (!value) return;

        if (this._instance._scene == null) {
            this._instance.setSceneInternal(value);
        } else {
            this._instance._nextScene = value;
        }
    }

    /**
     * 类型安全的场景设置方法
     * 
     * @param scene - 要设置的场景实例
     * @returns 设置的场景实例
     */
    public static setScene<T extends IScene>(scene: T): T {
        if (this._instance._scene == null) {
            this._instance.setSceneInternal(scene);
        } else {
            this._instance._nextScene = scene;
        }
        return scene;
    }

    /**
     * 类型安全的场景获取方法
     * 
     * @returns 当前场景实例
     */
    public static getScene<T extends IScene>(): T | null {
        return this._instance?._scene as T || null;
    }

    /**
     * 创建Core实例
     * 
     * 如果实例已存在，则返回现有实例。
     * 
     * @param config - Core配置，也可以直接传入boolean表示debug模式（向后兼容）
     * @returns Core实例
     */
    public static create(config: ICoreConfig | boolean = true): Core {
        if (this._instance == null) {
            // 向后兼容：如果传入boolean，转换为配置对象
            const coreConfig: ICoreConfig = typeof config === 'boolean' 
                ? { debug: config, enableEntitySystems: true }
                : config;
            this._instance = new Core(coreConfig);
        }
        return this._instance;
    }

    /**
     * 更新游戏逻辑
     * 
     * 此方法应该在游戏引擎的更新循环中调用。
     * 
     * @param deltaTime - 外部引擎提供的帧时间间隔（秒）
     * 
     * @example
     * ```typescript
     * // Laya引擎
     * Laya.timer.frameLoop(1, this, () => {
     *     const deltaTime = Laya.timer.delta / 1000;
     *     Core.update(deltaTime);
     * });
     * 
     * // Cocos Creator
     * update(deltaTime: number) {
     *     Core.update(deltaTime);
     * }
     * 

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
     */
    public static schedule<TContext = unknown>(timeInSeconds: number, repeats: boolean = false, context?: TContext, onTime?: (timer: ITimer<TContext>) => void): Timer<TContext> {
        if (!onTime) {
            throw new Error('onTime callback is required');
        }
        return this._instance._timerManager.schedule(timeInSeconds, repeats, context as TContext, onTime);
    }

    /**
     * 获取ECS流式API
     * 
     * @returns ECS API实例，如果未初始化则返回null
     */
    public static get ecsAPI(): ECSFluentAPI | null {
        return this._instance?._ecsAPI || null;
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
     * 获取环境兼容性信息
     * 
     * @returns 环境兼容性信息
     */
    public static getEnvironmentInfo(): EnvironmentInfo | null {
        return this._instance?._environmentInfo || null;
    }

    /**
     * 检查BigInt是否支持
     * 
     * @returns 是否支持BigInt
     */
    public static get supportsBigInt(): boolean {
        return this._instance?._environmentInfo.supportsBigInt || false;
    }

    /**
     * 内部场景设置方法
     * 
     * @param scene - 要设置的场景实例
     */
    private setSceneInternal(scene: IScene): void {
        this._scene = scene;
        this.onSceneChanged();
        this._scene.begin();
    }

    /**
     * 场景切换回调
     * 
     * 在场景切换时调用，用于重置时间系统等。
     */
    public onSceneChanged() {
        Time.sceneChanged();
        
        // 初始化ECS API（如果场景支持）
        if (this._scene && this._scene.querySystem && this._scene.eventSystem) {
            this._ecsAPI = createECSAPI(this._scene, this._scene.querySystem, this._scene.eventSystem);
        }

        // 延迟调试管理器通知，避免在场景初始化过程中干扰属性
        if (this._debugManager) {
            // 使用 requestAnimationFrame 确保在场景完全初始化后再收集数据
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => {
                    if (this._debugManager) {
                        this._debugManager.onSceneChanged();
                    }
                });
            } else {
                // 兜底：使用 setTimeout
                setTimeout(() => {
                    if (this._debugManager) {
                        this._debugManager.onSceneChanged();
                    }
                }, 0);
            }
        }
    }

    /**
     * 初始化核心系统
     * 
     * 执行核心系统的初始化逻辑。
     */
    protected initialize() {
        // 核心系统初始化
    }

    /**
     * 记录兼容性信息
     * 
     * 在控制台输出当前环境的兼容性信息和建议。
     */
    private logCompatibilityInfo(): void {
        const info = this._environmentInfo;
        
        Core._logger.info('ECS Framework 兼容性检测结果:');
        Core._logger.info(`   环境: ${info.environment}`);
        Core._logger.info(`   JavaScript引擎: ${info.jsEngine}`);
        Core._logger.info(`   BigInt支持: ${info.supportsBigInt ? '支持' : '不支持'}`);
        
        if (!info.supportsBigInt) {
            Core._logger.warn('BigInt兼容模式已启用');
        }
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

        // 处理场景切换
        if (this._nextScene != null) {
            if (this._scene != null)
                this._scene.end();

            this._scene = this._nextScene;
            this._nextScene = null;
            this.onSceneChanged();
            this._scene.begin();
        }

        // 更新当前场景
        if (this._scene != null && this._scene.update) {
            const sceneStartTime = this._performanceMonitor.startMonitoring('Scene.update');
            this._scene.update();
            const entityCount = this._scene.entities?.count || 0;
            this._performanceMonitor.endMonitoring('Scene.update', sceneStartTime, entityCount);
        }

        // 更新调试管理器（基于FPS的数据发送）
        if (this._debugManager) {
            this._debugManager.onFrameUpdate(deltaTime);
        }

        // 结束性能监控
        this._performanceMonitor.endMonitoring('Core.update', frameStartTime);
    }
}
