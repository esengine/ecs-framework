import { GlobalManager } from './Utils/GlobalManager';
import { TimerManager } from './Utils/Timers/TimerManager';
import { ITimer } from './Utils/Timers/ITimer';
import { Time } from './Utils/Time';
import { PerformanceMonitor } from './Utils/PerformanceMonitor';
import { PoolManager } from './Utils/Pool';
import { ECSFluentAPI, createECSAPI } from './ECS/Core/FluentAPI';
import { Scene } from './ECS/Scene';

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
 *     console.log("1秒后执行");
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
    public _nextScene: Scene | null = null;
    
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
    public _scene?: Scene;

    /**
     * 创建核心实例
     * 
     * @param debug - 是否启用调试模式，默认为true
     * @param enableEntitySystems - 是否启用实体系统，默认为true
     */
    private constructor(debug: boolean = true, enableEntitySystems: boolean = true) {
        Core._instance = this;

        // 初始化管理器
        this._timerManager = new TimerManager();
        Core.registerGlobalManager(this._timerManager);

        // 初始化性能监控器
        this._performanceMonitor = PerformanceMonitor.instance;

        // 初始化对象池管理器
        this._poolManager = PoolManager.getInstance();
        
        Core.entitySystemsEnabled = enableEntitySystems;
        this.debug = debug;
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
    public static get scene(): Scene | null {
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
     * @throws {Error} 当场景为空时抛出错误
     */
    public static set scene(value: Scene | null) {
        if (!value) return;
        
        if (!value) {
            throw new Error("场景不能为空");
        }

        if (this._instance._scene == null) {
            this._instance._scene = value;
            this._instance.onSceneChanged();
            this._instance._scene.begin();
        } else {
            this._instance._nextScene = value;
        }
    }

    /**
     * 创建Core实例
     * 
     * 如果实例已存在，则返回现有实例。
     * 
     * @param debug - 是否为调试模式，默认为true
     * @returns Core实例
     */
    public static create(debug: boolean = true): Core {
        if (this._instance == null) {
            this._instance = new Core(debug);
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
            console.warn("Core实例未创建，请先调用Core.create()");
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
    public static getGlobalManager<T extends GlobalManager>(type: new (...args: any[]) => T): T | null {
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
    public static schedule(timeInSeconds: number, repeats: boolean = false, context: any = null, onTime: (timer: ITimer) => void) {
        return this._instance._timerManager.schedule(timeInSeconds, repeats, context, onTime);
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
     * 场景切换回调
     * 
     * 在场景切换时调用，用于重置时间系统等。
     */
    public onSceneChanged() {
        Time.sceneChanged();
        
        // 初始化ECS API（如果场景支持）
        if (this._scene && typeof (this._scene as any).querySystem !== 'undefined') {
            const scene = this._scene as any;
            this._ecsAPI = createECSAPI(scene, scene.querySystem, scene.eventSystem);
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
        if (typeof (this._performanceMonitor as any).updateFPS === 'function') {
            (this._performanceMonitor as any).updateFPS(Time.deltaTime);
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
            const entityCount = (this._scene as any).entities?.count || 0;
            this._performanceMonitor.endMonitoring('Scene.update', sceneStartTime, entityCount);
        }

        // 结束性能监控
        this._performanceMonitor.endMonitoring('Core.update', frameStartTime);
    }
}
