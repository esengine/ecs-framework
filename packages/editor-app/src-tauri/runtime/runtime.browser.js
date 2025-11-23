var ECSRuntime = (function () {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    function __decorate$2(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata$2(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    /**
     * 时间管理工具类
     * 提供游戏时间相关的功能，包括帧时间、总时间、时间缩放等
     */
    class Time {
        /**
         * 使用外部引擎提供的deltaTime更新时间信息
         * @param deltaTime 外部引擎提供的帧时间间隔（秒）
         */
        static update(deltaTime) {
            // 设置未缩放的帧时间
            this.unscaledDeltaTime = deltaTime;
            this.deltaTime = deltaTime * this.timeScale;
            // 更新总时间
            this.unscaledTotalTime += this.unscaledDeltaTime;
            this.totalTime += this.deltaTime;
            // 更新帧数
            this.frameCount++;
        }
        /**
         * 场景改变时重置时间
         */
        static sceneChanged() {
            this.frameCount = 0;
            this.totalTime = 0;
            this.unscaledTotalTime = 0;
            this.deltaTime = 0;
            this.unscaledDeltaTime = 0;
        }
        /**
         * 检查指定的时间间隔是否已经过去
         * @param interval 时间间隔（秒）
         * @param lastTime 上次检查的时间
         * @returns 是否已经过去指定时间
         */
        static checkEvery(interval, lastTime) {
            return this.totalTime - lastTime >= interval;
        }
    }
    /**
     * 上一帧到当前帧的时间间隔（秒）
     */
    Time.deltaTime = 0;
    /**
     * 未缩放的帧时间间隔（秒）
     */
    Time.unscaledDeltaTime = 0;
    /**
     * 游戏开始以来的总时间（秒）
     */
    Time.totalTime = 0;
    /**
     * 未缩放的总时间（秒）
     */
    Time.unscaledTotalTime = 0;
    /**
     * 时间缩放比例
     */
    Time.timeScale = 1;
    /**
     * 当前帧数
     */
    Time.frameCount = 0;

    /**
     * 私有类隐藏ITimer的实现
     */
    class Timer {
        constructor() {
            this._timeInSeconds = 0;
            this._repeats = false;
            this._isDone = false;
            this._elapsedTime = 0;
        }
        getContext() {
            return this.context;
        }
        /**
         * 定时器是否已完成
         */
        get isDone() {
            return this._isDone;
        }
        /**
         * 定时器已运行的时间
         */
        get elapsedTime() {
            return this._elapsedTime;
        }
        reset() {
            this._elapsedTime = 0;
        }
        stop() {
            this._isDone = true;
        }
        tick() {
            // 如果stop在tick之前被调用，那么isDone将为true，我们不应该再做任何事情
            if (!this._isDone && this._elapsedTime > this._timeInSeconds) {
                this._elapsedTime -= this._timeInSeconds;
                this._onTime(this);
                if (!this._isDone && !this._repeats)
                    this._isDone = true;
            }
            this._elapsedTime += Time.deltaTime;
            return this._isDone;
        }
        initialize(timeInsSeconds, repeats, context, onTime) {
            this._timeInSeconds = timeInsSeconds;
            this._repeats = repeats;
            this.context = context;
            this._onTime = onTime.bind(context);
        }
        /**
         * 空出对象引用，以便在js需要时GC可以清理它们的引用
         */
        unload() {
            this.context = null;
            this._onTime = null;
        }
    }

    /**
     * 依赖注入装饰器
     *
     * 提供 @Injectable、@InjectProperty 和 @Updatable 装饰器，用于标记可注入的类和依赖注入点
     */
    const injectableMetadata = new WeakMap();
    const updatableMetadata = new WeakMap();
    /**
     * @Injectable() 装饰器
     *
     * 标记类为可注入的服务，使其可以通过ServiceContainer进行依赖注入
     *
     * @example
     * ```typescript
     * @Injectable()
     * class TimeService implements IService {
     *     constructor() {}
     *     dispose() {}
     * }
     *
     * @Injectable()
     * class PhysicsSystem extends EntitySystem {
     *     @InjectProperty(TimeService)
     *     private timeService!: TimeService;
     *
     *     constructor() {
     *         super(Matcher.empty());
     *     }
     * }
     * ```
     */
    function Injectable() {
        return function (target) {
            const existing = injectableMetadata.get(target);
            injectableMetadata.set(target, {
                injectable: true,
                dependencies: [],
                ...(existing?.properties && { properties: existing.properties })
            });
        };
    }
    /**
     * @Updatable() 装饰器
     *
     * 标记服务类为可更新的，使其在每帧自动被ServiceContainer调用update方法。
     * 使用此装饰器的类必须实现IUpdatable接口（包含update方法）。
     *
     * @param priority - 更新优先级（数值越小越先执行，默认0）
     * @throws 如果类没有实现update方法，将在运行时抛出错误
     *
     * @example
     * ```typescript
     * @Injectable()
     * @Updatable()
     * class TimerManager implements IService, IUpdatable {
     *     update(deltaTime?: number) {
     *         // 每帧更新逻辑
     *     }
     *     dispose() {}
     * }
     *
     * // 指定优先级
     * @Injectable()
     * @Updatable(10)
     * class PhysicsManager implements IService, IUpdatable {
     *     update() { }
     *     dispose() {}
     * }
     * ```
     */
    function Updatable(priority = 0) {
        return function (target) {
            // 验证类原型上是否有update方法
            const prototype = target.prototype;
            if (!prototype || typeof prototype.update !== 'function') {
                throw new Error(`@Updatable() decorator requires class ${target.name} to implement IUpdatable interface with update() method. ` +
                    'Please add \'implements IUpdatable\' and define update(deltaTime?: number): void method.');
            }
            // 标记为可更新
            updatableMetadata.set(target, {
                updatable: true,
                priority
            });
        };
    }
    /**
     * @InjectProperty() 装饰器
     *
     * 通过属性装饰器注入依赖
     *
     * 注入时机：在构造函数执行后、onInitialize() 调用前完成
     *
     * @param serviceType 服务类型
     *
     * @example
     * ```typescript
     * @Injectable()
     * class PhysicsSystem extends EntitySystem {
     *     @InjectProperty(TimeService)
     *     private timeService!: TimeService;
     *
     *     @InjectProperty(CollisionService)
     *     private collision!: CollisionService;
     *
     *     constructor() {
     *         super(Matcher.empty());
     *     }
     *
     *     public onInitialize(): void {
     *         // 此时属性已注入完成，可以安全使用
     *         console.log(this.timeService.getDeltaTime());
     *     }
     * }
     * ```
     */
    function InjectProperty(serviceType) {
        return function (target, propertyKey) {
            let metadata = injectableMetadata.get(target.constructor);
            if (!metadata) {
                metadata = {
                    injectable: true,
                    dependencies: []
                };
                injectableMetadata.set(target.constructor, metadata);
            }
            if (!metadata.properties) {
                metadata.properties = new Map();
            }
            metadata.properties.set(propertyKey, serviceType);
        };
    }
    /**
     * 检查类是否标记为可注入
     *
     * @param target 目标类
     * @returns 是否可注入
     */
    function isInjectable(target) {
        const metadata = injectableMetadata.get(target);
        return metadata?.injectable ?? false;
    }
    /**
     * 获取类的依赖注入元数据
     *
     * @param target 目标类
     * @returns 依赖注入元数据
     */
    function getInjectableMetadata(target) {
        return injectableMetadata.get(target);
    }
    /**
     * 创建实例并自动注入依赖
     *
     * @param constructor 构造函数
     * @param container 服务容器
     * @returns 创建的实例
     *
     * @example
     * ```typescript
     * const instance = createInstance(MySystem, container);
     * ```
     */
    function createInstance(constructor, container) {
        // 创建实例（无参数注入）
        const instance = new constructor();
        // 注入属性依赖
        injectProperties(instance, container);
        return instance;
    }
    /**
     * 为实例注入属性依赖
     *
     * @param instance 目标实例
     * @param container 服务容器
     */
    function injectProperties(instance, container) {
        const constructor = instance.constructor;
        const metadata = getInjectableMetadata(constructor);
        if (!metadata?.properties || metadata.properties.size === 0) {
            return;
        }
        for (const [propertyKey, serviceType] of metadata.properties) {
            const service = container.resolve(serviceType);
            if (service !== null) {
                instance[propertyKey] = service;
            }
        }
    }
    /**
     * 检查类是否标记为可更新
     *
     * @param target 目标类
     * @returns 是否可更新
     */
    function isUpdatable(target) {
        const metadata = updatableMetadata.get(target);
        return metadata?.updatable ?? false;
    }
    /**
     * 获取类的可更新元数据
     *
     * @param target 目标类
     * @returns 可更新元数据
     */
    function getUpdatableMetadata(target) {
        return updatableMetadata.get(target);
    }

    /**
     * 定时器管理器
     *
     * 允许动作的延迟和重复执行
     */
    let TimerManager = class TimerManager {
        constructor() {
            this._timers = [];
        }
        update() {
            for (let i = this._timers.length - 1; i >= 0; i--) {
                if (this._timers[i].tick()) {
                    this._timers[i].unload();
                    this._timers.splice(i, 1);
                }
            }
        }
        /**
         * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
         * @param timeInSeconds
         * @param repeats
         * @param context
         * @param onTime
         */
        schedule(timeInSeconds, repeats, context, onTime) {
            const timer = new Timer();
            timer.initialize(timeInSeconds, repeats, context, onTime);
            this._timers.push(timer);
            return timer;
        }
        /**
         * 释放资源
         */
        dispose() {
            for (const timer of this._timers) {
                timer.unload();
            }
            this._timers = [];
        }
    };
    TimerManager = __decorate$2([
        Updatable()
    ], TimerManager);

    /**
     * 性能警告类型
     */
    var PerformanceWarningType;
    (function (PerformanceWarningType) {
        PerformanceWarningType["HIGH_EXECUTION_TIME"] = "high_execution_time";
        PerformanceWarningType["HIGH_MEMORY_USAGE"] = "high_memory_usage";
        PerformanceWarningType["HIGH_CPU_USAGE"] = "high_cpu_usage";
        PerformanceWarningType["FREQUENT_GC"] = "frequent_gc";
        PerformanceWarningType["LOW_FPS"] = "low_fps";
        PerformanceWarningType["HIGH_ENTITY_COUNT"] = "high_entity_count";
    })(PerformanceWarningType || (PerformanceWarningType = {}));
    /**
     * 高性能监控器
     * 用于监控ECS系统的性能表现，提供详细的分析和优化建议
     */
    class PerformanceMonitor {
        constructor() {
            this._systemData = new Map();
            this._systemStats = new Map();
            this._isEnabled = false;
            this._maxRecentSamples = 60; // 保留最近60帧的数据
        }
        /**
         * 启用性能监控
         */
        enable() {
            this._isEnabled = true;
        }
        /**
         * 禁用性能监控
         */
        disable() {
            this._isEnabled = false;
        }
        /**
         * 检查是否启用了性能监控
         */
        get isEnabled() {
            return this._isEnabled;
        }
        /**
         * 开始监控系统性能
         * @param systemName 系统名称
         * @returns 开始时间戳
         */
        startMonitoring(_systemName) {
            if (!this._isEnabled) {
                return 0;
            }
            return performance.now();
        }
        /**
         * 结束监控并记录性能数据
         * @param systemName 系统名称
         * @param startTime 开始时间戳
         * @param entityCount 处理的实体数量
         */
        endMonitoring(systemName, startTime, entityCount = 0) {
            if (!this._isEnabled || startTime === 0) {
                return;
            }
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            const averageTimePerEntity = entityCount > 0 ? executionTime / entityCount : 0;
            // 更新当前性能数据
            const data = {
                name: systemName,
                executionTime,
                entityCount,
                averageTimePerEntity,
                lastUpdateTime: endTime
            };
            this._systemData.set(systemName, data);
            // 更新统计信息
            this.updateStats(systemName, executionTime);
        }
        /**
         * 更新系统统计信息
         * @param systemName 系统名称
         * @param executionTime 执行时间
         */
        updateStats(systemName, executionTime) {
            let stats = this._systemStats.get(systemName);
            if (!stats) {
                stats = {
                    totalTime: 0,
                    averageTime: 0,
                    minTime: Number.MAX_VALUE,
                    maxTime: 0,
                    executionCount: 0,
                    recentTimes: [],
                    standardDeviation: 0,
                    percentile95: 0,
                    percentile99: 0
                };
                this._systemStats.set(systemName, stats);
            }
            // 更新基本统计
            stats.totalTime += executionTime;
            stats.executionCount++;
            stats.averageTime = stats.totalTime / stats.executionCount;
            stats.minTime = Math.min(stats.minTime, executionTime);
            stats.maxTime = Math.max(stats.maxTime, executionTime);
            // 更新最近时间列表
            stats.recentTimes.push(executionTime);
            if (stats.recentTimes.length > this._maxRecentSamples) {
                stats.recentTimes.shift();
            }
            // 计算高级统计信息
            this.calculateAdvancedStats(stats);
        }
        /**
         * 计算高级统计信息
         * @param stats 统计信息对象
         */
        calculateAdvancedStats(stats) {
            if (stats.recentTimes.length === 0)
                return;
            // 计算标准差
            const mean = stats.recentTimes.reduce((a, b) => a + b, 0) / stats.recentTimes.length;
            const variance = stats.recentTimes.reduce((acc, time) => acc + Math.pow(time - mean, 2), 0) / stats.recentTimes.length;
            stats.standardDeviation = Math.sqrt(variance);
            // 计算百分位数
            const sortedTimes = [...stats.recentTimes].sort((a, b) => a - b);
            const len = sortedTimes.length;
            stats.percentile95 = sortedTimes[Math.floor(len * 0.95)] || 0;
            stats.percentile99 = sortedTimes[Math.floor(len * 0.99)] || 0;
        }
        /**
         * 获取系统的当前性能数据
         * @param systemName 系统名称
         * @returns 性能数据或undefined
         */
        getSystemData(systemName) {
            return this._systemData.get(systemName);
        }
        /**
         * 获取系统的统计信息
         * @param systemName 系统名称
         * @returns 统计信息或undefined
         */
        getSystemStats(systemName) {
            return this._systemStats.get(systemName);
        }
        /**
         * 获取所有系统的性能数据
         * @returns 所有系统的性能数据
         */
        getAllSystemData() {
            return new Map(this._systemData);
        }
        /**
         * 获取所有系统的统计信息
         * @returns 所有系统的统计信息
         */
        getAllSystemStats() {
            return new Map(this._systemStats);
        }
        /**
         * 获取性能报告
         * @returns 格式化的性能报告字符串
         */
        getPerformanceReport() {
            if (!this._isEnabled) {
                return 'Performance monitoring is disabled.';
            }
            const lines = [];
            lines.push('=== ECS Performance Report ===');
            lines.push('');
            // 按平均执行时间排序
            const sortedSystems = Array.from(this._systemStats.entries())
                .sort((a, b) => b[1].averageTime - a[1].averageTime);
            for (const [systemName, stats] of sortedSystems) {
                const data = this._systemData.get(systemName);
                lines.push(`System: ${systemName}`);
                lines.push(`  Current: ${data?.executionTime.toFixed(2)}ms (${data?.entityCount} entities)`);
                lines.push(`  Average: ${stats.averageTime.toFixed(2)}ms`);
                lines.push(`  Min/Max: ${stats.minTime.toFixed(2)}ms / ${stats.maxTime.toFixed(2)}ms`);
                lines.push(`  Total: ${stats.totalTime.toFixed(2)}ms (${stats.executionCount} calls)`);
                if (data?.averageTimePerEntity && data.averageTimePerEntity > 0) {
                    lines.push(`  Per Entity: ${data.averageTimePerEntity.toFixed(4)}ms`);
                }
                lines.push('');
            }
            // 总体统计
            const totalCurrentTime = Array.from(this._systemData.values())
                .reduce((sum, data) => sum + data.executionTime, 0);
            lines.push(`Total Frame Time: ${totalCurrentTime.toFixed(2)}ms`);
            lines.push(`Systems Count: ${this._systemData.size}`);
            return lines.join('\n');
        }
        /**
         * 重置所有性能数据
         */
        reset() {
            this._systemData.clear();
            this._systemStats.clear();
        }
        /**
         * 重置指定系统的性能数据
         * @param systemName 系统名称
         */
        resetSystem(systemName) {
            this._systemData.delete(systemName);
            this._systemStats.delete(systemName);
        }
        /**
         * 获取性能警告
         * @param thresholdMs 警告阈值（毫秒）
         * @returns 超过阈值的系统列表
         */
        getPerformanceWarnings(thresholdMs = 16.67) {
            const warnings = [];
            for (const [systemName, data] of this._systemData.entries()) {
                if (data.executionTime > thresholdMs) {
                    warnings.push(`${systemName}: ${data.executionTime.toFixed(2)}ms (>${thresholdMs}ms)`);
                }
            }
            return warnings;
        }
        /**
         * 设置最大保留样本数
         * @param maxSamples 最大样本数
         */
        setMaxRecentSamples(maxSamples) {
            this._maxRecentSamples = maxSamples;
            // 裁剪现有数据
            for (const stats of this._systemStats.values()) {
                while (stats.recentTimes.length > maxSamples) {
                    stats.recentTimes.shift();
                }
            }
        }
        /**
         * 释放资源
         */
        dispose() {
            this._systemData.clear();
            this._systemStats.clear();
            this._isEnabled = false;
        }
    }

    /**
     * 高性能通用对象池
     * 支持任意类型的对象池化，包含详细的统计信息
     */
    class Pool {
        /**
         * 构造函数
         * @param createFn 创建对象的函数
         * @param maxSize 池的最大大小，默认100
         * @param estimatedObjectSize 估算的单个对象大小（字节），默认1024
         */
        constructor(createFn, maxSize = 100, estimatedObjectSize = 1024) {
            this._objects = [];
            this._createFn = createFn;
            this._maxSize = maxSize;
            this._objectSize = estimatedObjectSize;
            this._stats = {
                size: 0,
                maxSize,
                totalCreated: 0,
                totalObtained: 0,
                totalReleased: 0,
                hitRate: 0,
                estimatedMemoryUsage: 0
            };
        }
        /**
         * 获取指定类型的对象池
         * @param type 对象类型
         * @param maxSize 池的最大大小
         * @param estimatedObjectSize 估算的单个对象大小
         * @returns 对象池实例
         */
        static getPool(type, maxSize = 100, estimatedObjectSize = 1024) {
            let pool = this._pools.get(type);
            if (!pool) {
                pool = new Pool(() => new type(), maxSize, estimatedObjectSize);
                this._pools.set(type, pool);
            }
            return pool;
        }
        /**
         * 从池中获取对象
         * @returns 对象实例
         */
        obtain() {
            this._stats.totalObtained++;
            if (this._objects.length > 0) {
                const obj = this._objects.pop();
                this._stats.size--;
                this._updateHitRate();
                this._updateMemoryUsage();
                return obj;
            }
            // 池中没有可用对象，创建新对象
            this._stats.totalCreated++;
            this._updateHitRate();
            return this._createFn();
        }
        /**
         * 释放对象回池中
         * @param obj 要释放的对象
         */
        release(obj) {
            if (!obj)
                return;
            this._stats.totalReleased++;
            // 如果池未满，将对象放回池中
            if (this._stats.size < this._maxSize) {
                // 重置对象状态
                obj.reset();
                this._objects.push(obj);
                this._stats.size++;
                this._updateMemoryUsage();
            }
            // 如果池已满，让对象被垃圾回收
        }
        /**
         * 获取池统计信息
         * @returns 统计信息对象
         */
        getStats() {
            return { ...this._stats };
        }
        /**
         * 清空池
         */
        clear() {
            // 重置所有对象
            for (const obj of this._objects) {
                obj.reset();
            }
            this._objects.length = 0;
            this._stats.size = 0;
            this._updateMemoryUsage();
        }
        /**
         * 压缩池（移除多余的对象）
         * @param targetSize 目标大小，默认为当前大小的一半
         */
        compact(targetSize) {
            const target = targetSize ?? Math.floor(this._objects.length / 2);
            while (this._objects.length > target) {
                const obj = this._objects.pop();
                if (obj) {
                    obj.reset();
                    this._stats.size--;
                }
            }
            this._updateMemoryUsage();
        }
        /**
         * 预填充池
         * @param count 预填充的对象数量
         */
        prewarm(count) {
            const actualCount = Math.min(count, this._maxSize - this._objects.length);
            for (let i = 0; i < actualCount; i++) {
                const obj = this._createFn();
                obj.reset();
                this._objects.push(obj);
                this._stats.totalCreated++;
                this._stats.size++;
            }
            this._updateMemoryUsage();
        }
        /**
         * 设置最大池大小
         * @param maxSize 新的最大大小
         */
        setMaxSize(maxSize) {
            this._maxSize = maxSize;
            this._stats.maxSize = maxSize;
            // 如果当前池大小超过新的最大值，进行压缩
            if (this._objects.length > maxSize) {
                this.compact(maxSize);
            }
        }
        /**
         * 获取池中可用对象数量
         * @returns 可用对象数量
         */
        getAvailableCount() {
            return this._objects.length;
        }
        /**
         * 检查池是否为空
         * @returns 如果池为空返回true
         */
        isEmpty() {
            return this._objects.length === 0;
        }
        /**
         * 检查池是否已满
         * @returns 如果池已满返回true
         */
        isFull() {
            return this._objects.length >= this._maxSize;
        }
        /**
         * 获取所有已注册的池类型
         * @returns 所有池类型的数组
         */
        static getAllPoolTypes() {
            return Array.from(this._pools.keys());
        }
        /**
         * 获取所有池的统计信息
         * @returns 包含所有池统计信息的对象
         */
        static getAllPoolStats() {
            const stats = {};
            for (const [type, pool] of this._pools) {
                const typeName = type.name || type.toString();
                stats[typeName] = pool.getStats();
            }
            return stats;
        }
        /**
         * 压缩所有池
         */
        static compactAllPools() {
            for (const pool of this._pools.values()) {
                pool.compact();
            }
        }
        /**
         * 清空所有池
         */
        static clearAllPools() {
            for (const pool of this._pools.values()) {
                pool.clear();
            }
            this._pools.clear();
        }
        /**
         * 获取全局池统计信息的格式化字符串
         * @returns 格式化的统计信息字符串
         */
        static getGlobalStatsString() {
            const stats = this.getAllPoolStats();
            const lines = ['=== Object Pool Global Statistics ===', ''];
            if (Object.keys(stats).length === 0) {
                lines.push('No pools registered');
                return lines.join('\n');
            }
            for (const [typeName, stat] of Object.entries(stats)) {
                lines.push(`${typeName}:`);
                lines.push(`  Size: ${stat.size}/${stat.maxSize}`);
                lines.push(`  Hit Rate: ${(stat.hitRate * 100).toFixed(1)}%`);
                lines.push(`  Total Created: ${stat.totalCreated}`);
                lines.push(`  Total Obtained: ${stat.totalObtained}`);
                lines.push(`  Memory: ${(stat.estimatedMemoryUsage / 1024).toFixed(1)} KB`);
                lines.push('');
            }
            return lines.join('\n');
        }
        /**
         * 更新命中率
         */
        _updateHitRate() {
            if (this._stats.totalObtained === 0) {
                this._stats.hitRate = 0;
            }
            else {
                const hits = this._stats.totalObtained - this._stats.totalCreated;
                this._stats.hitRate = hits / this._stats.totalObtained;
            }
        }
        /**
         * 更新内存使用估算
         */
        _updateMemoryUsage() {
            this._stats.estimatedMemoryUsage = this._stats.size * this._objectSize;
        }
    }
    Pool._pools = new Map();

    /**
     * 池管理器
     * 统一管理所有对象池
     */
    class PoolManager {
        constructor() {
            this.pools = new Map();
            this.autoCompactInterval = 60000; // 60秒
            this.lastCompactTime = 0;
            // 普通构造函数，不再使用单例模式
        }
        /**
         * 注册池
         * @param name 池名称
         * @param pool 池实例
         */
        registerPool(name, pool) {
            this.pools.set(name, pool);
        }
        /**
         * 获取池
         * @param name 池名称
         * @returns 池实例
         */
        getPool(name) {
            return this.pools.get(name) || null;
        }
        /**
         * 更新池管理器（应在游戏循环中调用）
         */
        update() {
            const now = Date.now();
            if (now - this.lastCompactTime > this.autoCompactInterval) {
                this.compactAllPools();
                this.lastCompactTime = now;
            }
        }
        /**
         * 创建或获取标准池
         * @param name 池名称
         * @param createFn 创建函数
         * @param maxSize 最大大小
         * @param estimatedObjectSize 估算对象大小
         * @returns 池实例
         */
        createPool(name, createFn, maxSize = 100, estimatedObjectSize = 1024) {
            let pool = this.pools.get(name);
            if (!pool) {
                pool = new Pool(createFn, maxSize, estimatedObjectSize);
                this.pools.set(name, pool);
            }
            return pool;
        }
        /**
         * 移除池
         * @param name 池名称
         * @returns 是否成功移除
         */
        removePool(name) {
            const pool = this.pools.get(name);
            if (pool) {
                pool.clear();
                this.pools.delete(name);
                return true;
            }
            return false;
        }
        /**
         * 获取所有池名称
         * @returns 池名称数组
         */
        getPoolNames() {
            return Array.from(this.pools.keys());
        }
        /**
         * 获取池数量
         * @returns 池数量
         */
        getPoolCount() {
            return this.pools.size;
        }
        /**
         * 压缩所有池
         */
        compactAllPools() {
            for (const pool of this.pools.values()) {
                pool.compact();
            }
        }
        /**
         * 清空所有池
         */
        clearAllPools() {
            for (const pool of this.pools.values()) {
                pool.clear();
            }
        }
        /**
         * 获取所有池的统计信息
         * @returns 统计信息映射
         */
        getAllStats() {
            const stats = new Map();
            for (const [name, pool] of this.pools) {
                stats.set(name, pool.getStats());
            }
            return stats;
        }
        /**
         * 获取总体统计信息
         * @returns 总体统计信息
         */
        getGlobalStats() {
            let totalSize = 0;
            let totalMaxSize = 0;
            let totalCreated = 0;
            let totalObtained = 0;
            let totalReleased = 0;
            let totalMemoryUsage = 0;
            for (const pool of this.pools.values()) {
                const stats = pool.getStats();
                totalSize += stats.size;
                totalMaxSize += stats.maxSize;
                totalCreated += stats.totalCreated;
                totalObtained += stats.totalObtained;
                totalReleased += stats.totalReleased;
                totalMemoryUsage += stats.estimatedMemoryUsage;
            }
            const hitRate = totalObtained === 0 ? 0 : (totalObtained - totalCreated) / totalObtained;
            return {
                size: totalSize,
                maxSize: totalMaxSize,
                totalCreated,
                totalObtained,
                totalReleased,
                hitRate,
                estimatedMemoryUsage: totalMemoryUsage
            };
        }
        /**
         * 获取格式化的统计信息字符串
         * @returns 格式化字符串
         */
        getStatsString() {
            const lines = ['=== Pool Manager Statistics ===', ''];
            if (this.pools.size === 0) {
                lines.push('No pools registered');
                return lines.join('\n');
            }
            const globalStats = this.getGlobalStats();
            lines.push(`Total Pools: ${this.pools.size}`);
            lines.push(`Global Hit Rate: ${(globalStats.hitRate * 100).toFixed(1)}%`);
            lines.push(`Global Memory Usage: ${(globalStats.estimatedMemoryUsage / 1024).toFixed(1)} KB`);
            lines.push('');
            for (const [name, pool] of this.pools) {
                const stats = pool.getStats();
                lines.push(`${name}:`);
                lines.push(`  Size: ${stats.size}/${stats.maxSize}`);
                lines.push(`  Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
                lines.push(`  Memory: ${(stats.estimatedMemoryUsage / 1024).toFixed(1)} KB`);
                lines.push('');
            }
            return lines.join('\n');
        }
        /**
         * 设置自动压缩间隔
         * @param intervalMs 间隔毫秒数
         */
        setAutoCompactInterval(intervalMs) {
            this.autoCompactInterval = intervalMs;
        }
        /**
         * 预填充所有池
         */
        prewarmAllPools() {
            for (const pool of this.pools.values()) {
                const stats = pool.getStats();
                const prewarmCount = Math.floor(stats.maxSize * 0.2); // 预填充20%
                pool.prewarm(prewarmCount);
            }
        }
        /**
         * 重置池管理器
         */
        reset() {
            this.clearAllPools();
            this.pools.clear();
            this.lastCompactTime = 0;
        }
        /**
         * 释放资源
         * 实现 IService 接口
         */
        dispose() {
            this.reset();
        }
    }

    /**
     * 存储组件类型名称的Symbol键
     */
    const COMPONENT_TYPE_NAME = Symbol('ComponentTypeName');
    /**
     * 存储系统类型名称的Symbol键
     */
    const SYSTEM_TYPE_NAME = Symbol('SystemTypeName');
    /**
     * 组件类型装饰器
     * 用于为组件类指定固定的类型名称，避免在代码混淆后失效
     *
     * @param typeName 组件类型名称
     * @example
     * ```typescript
     * @ECSComponent('Position')
     * class PositionComponent extends Component {
     *     x: number = 0;
     *     y: number = 0;
     * }
     * ```
     */
    function ECSComponent(typeName) {
        return function (target) {
            if (!typeName || typeof typeName !== 'string') {
                throw new Error('ECSComponent装饰器必须提供有效的类型名称');
            }
            // 在构造函数上存储类型名称
            target[COMPONENT_TYPE_NAME] = typeName;
            return target;
        };
    }
    /**
     * 系统类型装饰器
     * 用于为系统类指定固定的类型名称，避免在代码混淆后失效
     *
     * @param typeName 系统类型名称
     * @param metadata 系统元数据配置
     * @example
     * ```typescript
     * // 基本使用
     * @ECSSystem('Movement')
     * class MovementSystem extends EntitySystem {
     *     protected process(entities: Entity[]): void {
     *         // 系统逻辑
     *     }
     * }
     *
     * // 配置更新顺序和依赖注入
     * @Injectable()
     * @ECSSystem('Physics', { updateOrder: 10 })
     * class PhysicsSystem extends EntitySystem {
     *     @InjectProperty(CollisionSystem)
     *     private collision!: CollisionSystem;
     *
     *     constructor() {
     *         super(Matcher.empty().all(Transform, RigidBody));
     *     }
     * }
     * ```
     */
    function ECSSystem(typeName, metadata) {
        return function (target) {
            if (!typeName || typeof typeName !== 'string') {
                throw new Error('ECSSystem装饰器必须提供有效的类型名称');
            }
            // 在构造函数上存储类型名称
            target[SYSTEM_TYPE_NAME] = typeName;
            // 存储元数据
            if (metadata) {
                target.__systemMetadata__ = metadata;
            }
            return target;
        };
    }
    /**
     * 获取System的元数据
     */
    function getSystemMetadata(systemType) {
        return systemType.__systemMetadata__;
    }
    /**
     * 获取组件类型的名称，优先使用装饰器指定的名称
     *
     * @param componentType 组件构造函数
     * @returns 组件类型名称
     */
    function getComponentTypeName(componentType) {
        // 优先使用装饰器指定的名称
        const decoratorName = componentType[COMPONENT_TYPE_NAME];
        if (decoratorName) {
            return decoratorName;
        }
        // 回退到constructor.name
        return componentType.name || 'UnknownComponent';
    }
    /**
     * 获取系统类型的名称，优先使用装饰器指定的名称
     *
     * @param systemType 系统构造函数
     * @returns 系统类型名称
     */
    function getSystemTypeName(systemType) {
        // 优先使用装饰器指定的名称
        const decoratorName = systemType[SYSTEM_TYPE_NAME];
        if (decoratorName) {
            return decoratorName;
        }
        // 回退到constructor.name
        return systemType.name || 'UnknownSystem';
    }
    /**
     * 从组件实例获取类型名称
     *
     * @param component 组件实例
     * @returns 组件类型名称
     */
    function getComponentInstanceTypeName(component) {
        return getComponentTypeName(component.constructor);
    }
    /**
     * 从系统实例获取类型名称
     *
     * @param system 系统实例
     * @returns 系统类型名称
     */
    function getSystemInstanceTypeName(system) {
        return getSystemTypeName(system.constructor);
    }

    /**
     * WeakRef Polyfill for ES2020 compatibility
     *
     * 为了兼容 Cocos Creator、Laya、微信小游戏等目标平台（仅支持 ES2020），
     * 提供 WeakRef 的 Polyfill 实现。
     *
     * - 现代浏览器：自动使用原生 WeakRef (自动 GC)
     * - 旧环境：使用 Polyfill (无自动 GC，但 Scene 销毁时会手动清理)
     */
    class WeakRefPolyfill {
        constructor(target) {
            this._target = target;
        }
        deref() {
            return this._target;
        }
    }
    /**
     * WeakRef 实现
     *
     * 优先使用原生 WeakRef，不支持时降级到 Polyfill
     */
    const WeakRefImpl = ((typeof globalThis !== 'undefined' && globalThis.WeakRef) ||
        (typeof global !== 'undefined' && global.WeakRef) ||
        (typeof window !== 'undefined' && window.WeakRef) ||
        WeakRefPolyfill);
    /**
     * 全局EntityID到Scene的映射
     *
     * 使用全局Map记录每个Entity ID对应的Scene，用于装饰器通过Component.entityId查找Scene。
     */
    const globalEntitySceneMap = new Map();
    /**
     * Entity引用追踪器
     *
     * 追踪Component中对Entity的引用，当Entity被销毁时自动清理所有引用。
     *
     * @example
     * ```typescript
     * const tracker = new ReferenceTracker();
     * tracker.registerReference(targetEntity, component, 'parent');
     * targetEntity.destroy(); // 自动将 component.parent 设为 null
     * ```
     */
    class ReferenceTracker {
        constructor() {
            /**
             * Entity ID -> 引用该Entity的所有组件记录
             */
            this._references = new Map();
        }
        /**
         * 注册Entity引用
         *
         * @param entity 被引用的Entity
         * @param component 持有引用的Component
         * @param propertyKey Component中存储引用的属性名
         */
        registerReference(entity, component, propertyKey) {
            const entityId = entity.id;
            let records = this._references.get(entityId);
            if (!records) {
                records = new Set();
                this._references.set(entityId, records);
            }
            const existingRecord = this._findRecord(records, component, propertyKey);
            if (existingRecord) {
                return;
            }
            records.add({
                component: new WeakRefImpl(component),
                propertyKey
            });
        }
        /**
         * 注销Entity引用
         *
         * @param entity 被引用的Entity
         * @param component 持有引用的Component
         * @param propertyKey Component中存储引用的属性名
         */
        unregisterReference(entity, component, propertyKey) {
            const entityId = entity.id;
            const records = this._references.get(entityId);
            if (!records) {
                return;
            }
            const record = this._findRecord(records, component, propertyKey);
            if (record) {
                records.delete(record);
                if (records.size === 0) {
                    this._references.delete(entityId);
                }
            }
        }
        /**
         * 清理所有指向指定Entity的引用
         *
         * 将所有引用该Entity的Component属性设为null。
         *
         * @param entityId 被销毁的Entity ID
         */
        clearReferencesTo(entityId) {
            const records = this._references.get(entityId);
            if (!records) {
                return;
            }
            const validRecords = [];
            for (const record of records) {
                const component = record.component.deref();
                if (component) {
                    validRecords.push(record);
                }
            }
            for (const record of validRecords) {
                const component = record.component.deref();
                if (component) {
                    component[record.propertyKey] = null;
                }
            }
            this._references.delete(entityId);
        }
        /**
         * 清理Component的所有引用注册
         *
         * 当Component被移除时调用，清理该Component注册的所有引用。
         *
         * @param component 被移除的Component
         */
        clearComponentReferences(component) {
            for (const [entityId, records] of this._references.entries()) {
                const toDelete = [];
                for (const record of records) {
                    const comp = record.component.deref();
                    if (!comp || comp === component) {
                        toDelete.push(record);
                    }
                }
                for (const record of toDelete) {
                    records.delete(record);
                }
                if (records.size === 0) {
                    this._references.delete(entityId);
                }
            }
        }
        /**
         * 获取指向指定Entity的所有引用记录
         *
         * @param entityId Entity ID
         * @returns 引用记录数组（仅包含有效引用）
         */
        getReferencesTo(entityId) {
            const records = this._references.get(entityId);
            if (!records) {
                return [];
            }
            const validRecords = [];
            for (const record of records) {
                const component = record.component.deref();
                if (component) {
                    validRecords.push(record);
                }
            }
            return validRecords;
        }
        /**
         * 清理所有失效的WeakRef引用
         *
         * 遍历所有记录，移除已被GC回收的Component引用。
         */
        cleanup() {
            const entitiesToDelete = [];
            for (const [entityId, records] of this._references.entries()) {
                const toDelete = [];
                for (const record of records) {
                    if (!record.component.deref()) {
                        toDelete.push(record);
                    }
                }
                for (const record of toDelete) {
                    records.delete(record);
                }
                if (records.size === 0) {
                    entitiesToDelete.push(entityId);
                }
            }
            for (const entityId of entitiesToDelete) {
                this._references.delete(entityId);
            }
        }
        /**
         * 注册Entity到Scene的映射
         *
         * @param entityId Entity ID
         * @param scene Scene实例
         */
        registerEntityScene(entityId, scene) {
            globalEntitySceneMap.set(entityId, new WeakRefImpl(scene));
        }
        /**
         * 注销Entity到Scene的映射
         *
         * @param entityId Entity ID
         */
        unregisterEntityScene(entityId) {
            globalEntitySceneMap.delete(entityId);
        }
        /**
         * 获取调试信息
         */
        getDebugInfo() {
            const info = {};
            for (const [entityId, records] of this._references.entries()) {
                const validRecords = [];
                for (const record of records) {
                    const component = record.component.deref();
                    if (component) {
                        validRecords.push({
                            componentId: component.id,
                            propertyKey: record.propertyKey
                        });
                    }
                }
                if (validRecords.length > 0) {
                    info[`entity_${entityId}`] = validRecords;
                }
            }
            return info;
        }
        /**
         * 查找指定的引用记录
         */
        _findRecord(records, component, propertyKey) {
            for (const record of records) {
                const comp = record.component.deref();
                if (comp === component && record.propertyKey === propertyKey) {
                    return record;
                }
            }
            return undefined;
        }
    }

    /**
     * 日志级别
     */
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["Debug"] = 0] = "Debug";
        LogLevel[LogLevel["Info"] = 1] = "Info";
        LogLevel[LogLevel["Warn"] = 2] = "Warn";
        LogLevel[LogLevel["Error"] = 3] = "Error";
        LogLevel[LogLevel["Fatal"] = 4] = "Fatal";
        LogLevel[LogLevel["None"] = 5] = "None";
    })(LogLevel || (LogLevel = {}));
    /**
     * 预定义的颜色常量
     */
    const Colors = {
        RED: '\x1b[31m',
        GREEN: '\x1b[32m',
        YELLOW: '\x1b[33m',
        // 亮色版本
        BRIGHT_BLACK: '\x1b[90m',
        BRIGHT_RED: '\x1b[91m',
        // 特殊
        RESET: '\x1b[0m'};

    /**
     * 默认控制台日志实现
     */
    class ConsoleLogger {
        constructor(config = {}) {
            this._config = {
                level: LogLevel.Info,
                enableTimestamp: true,
                enableColors: typeof window === 'undefined',
                ...config
            };
        }
        /**
         * 输出调试级别日志
         * @param message 日志消息
         * @param args 附加参数
         */
        debug(message, ...args) {
            this.log(LogLevel.Debug, message, ...args);
        }
        /**
         * 输出信息级别日志
         * @param message 日志消息
         * @param args 附加参数
         */
        info(message, ...args) {
            this.log(LogLevel.Info, message, ...args);
        }
        /**
         * 输出警告级别日志
         * @param message 日志消息
         * @param args 附加参数
         */
        warn(message, ...args) {
            this.log(LogLevel.Warn, message, ...args);
        }
        /**
         * 输出错误级别日志
         * @param message 日志消息
         * @param args 附加参数
         */
        error(message, ...args) {
            this.log(LogLevel.Error, message, ...args);
        }
        /**
         * 输出致命错误级别日志
         * @param message 日志消息
         * @param args 附加参数
         */
        fatal(message, ...args) {
            this.log(LogLevel.Fatal, message, ...args);
        }
        /**
         * 设置日志级别
         * @param level 日志级别
         */
        setLevel(level) {
            this._config.level = level;
        }
        /**
         * 设置颜色配置
         * @param colors 颜色配置
         */
        setColors(colors) {
            if (Object.keys(colors).length === 0) {
                // 重置为默认颜色
                delete this._config.colors;
            }
            else {
                this._config.colors = {
                    ...this._config.colors,
                    ...colors
                };
            }
        }
        /**
         * 设置日志前缀
         * @param prefix 前缀字符串
         */
        setPrefix(prefix) {
            this._config.prefix = prefix;
        }
        /**
         * 内部日志输出方法
         * @param level 日志级别
         * @param message 日志消息
         * @param args 附加参数
         */
        log(level, message, ...args) {
            if (level < this._config.level) {
                return;
            }
            let formattedMessage = message;
            // 添加时间戳
            if (this._config.enableTimestamp) {
                const timestamp = new Date().toISOString();
                formattedMessage = `[${timestamp}] ${formattedMessage}`;
            }
            // 添加前缀
            if (this._config.prefix) {
                formattedMessage = `[${this._config.prefix}] ${formattedMessage}`;
            }
            // 添加日志级别
            const levelName = LogLevel[level].toUpperCase();
            formattedMessage = `[${levelName}] ${formattedMessage}`;
            // 使用自定义输出或默认控制台输出
            if (this._config.output) {
                this._config.output(level, formattedMessage);
            }
            else {
                this.outputToConsole(level, formattedMessage, ...args);
            }
        }
        /**
         * 输出到控制台
         * @param level 日志级别
         * @param message 格式化后的消息
         * @param args 附加参数
         */
        outputToConsole(level, message, ...args) {
            const colors = this._config.enableColors ? this.getColors() : null;
            switch (level) {
                case LogLevel.Debug:
                    if (colors) {
                        console.debug(`${colors.debug}${message}${colors.reset}`, ...args);
                    }
                    else {
                        console.debug(message, ...args);
                    }
                    break;
                case LogLevel.Info:
                    if (colors) {
                        console.info(`${colors.info}${message}${colors.reset}`, ...args);
                    }
                    else {
                        console.info(message, ...args);
                    }
                    break;
                case LogLevel.Warn:
                    if (colors) {
                        console.warn(`${colors.warn}${message}${colors.reset}`, ...args);
                    }
                    else {
                        console.warn(message, ...args);
                    }
                    break;
                case LogLevel.Error:
                    if (colors) {
                        console.error(`${colors.error}${message}${colors.reset}`, ...args);
                    }
                    else {
                        console.error(message, ...args);
                    }
                    break;
                case LogLevel.Fatal:
                    if (colors) {
                        console.error(`${colors.fatal}${message}${colors.reset}`, ...args);
                    }
                    else {
                        console.error(message, ...args);
                    }
                    break;
            }
        }
        /**
         * 获取控制台颜色配置
         * @returns 颜色配置对象
         */
        getColors() {
            // 默认颜色配置
            const defaultColors = {
                debug: Colors.BRIGHT_BLACK, // 灰色
                info: Colors.GREEN, // 绿色
                warn: Colors.YELLOW, // 黄色
                error: Colors.RED, // 红色
                fatal: Colors.BRIGHT_RED, // 亮红色
                reset: Colors.RESET // 重置
            };
            // 合并用户自定义颜色
            return {
                ...defaultColors,
                ...this._config.colors
            };
        }
    }

    /**
     * 日志管理器
     */
    class LoggerManager {
        constructor() {
            this._loggers = new Map();
            this._defaultLevel = LogLevel.Info;
        }
        get defaultLogger() {
            if (!this._defaultLogger) {
                this._defaultLogger = this.createDefaultLogger();
            }
            return this._defaultLogger;
        }
        // 新增: 创建默认 logger 的逻辑
        createDefaultLogger() {
            if (this._loggerFactory) {
                return this._loggerFactory();
            }
            return new ConsoleLogger({ level: this._defaultLevel });
        }
        /**
         * 获取日志管理器实例
         * @returns 日志管理器实例
         */
        static getInstance() {
            if (!LoggerManager._instance) {
                LoggerManager._instance = new LoggerManager();
            }
            return LoggerManager._instance;
        }
        /**
         * 获取或创建日志器
         * @param name 日志器名称
         * @returns 日志器实例
         */
        getLogger(name) {
            if (!name) {
                return this.defaultLogger;
            }
            // 如果有自定义 factory, 每次都调用(不缓存), 由使用方自行管理
            if (this._loggerFactory) {
                return this._loggerFactory(name);
            }
            // 默认 ConsoleLogger 仍然缓存(保持向后兼容)
            if (!this._loggers.has(name)) {
                this._loggers.set(name, new ConsoleLogger({ prefix: name, level: this._defaultLevel }));
            }
            return this._loggers.get(name);
        }
        /**
         * 设置日志器
         * @param name 日志器名称
         * @param logger 日志器实例
         */
        setLogger(name, logger) {
            this._loggers.set(name, logger);
        }
        /**
         * 设置全局日志级别
         * @param level 日志级别
         */
        setGlobalLevel(level) {
            this._defaultLevel = level;
            if (this._defaultLogger instanceof ConsoleLogger) {
                this._defaultLogger.setLevel(level);
            }
            for (const logger of this._loggers.values()) {
                if (logger instanceof ConsoleLogger) {
                    logger.setLevel(level);
                }
            }
        }
        /**
         * 创建子日志器
         * @param parentName 父日志器名称
         * @param childName 子日志器名称
         * @returns 子日志器实例
         */
        createChildLogger(parentName, childName) {
            const fullName = `${parentName}.${childName}`;
            return this.getLogger(fullName);
        }
        /**
         * 设置全局颜色配置
         * @param colors 颜色配置
         */
        setGlobalColors(colors) {
            if (this._defaultLogger instanceof ConsoleLogger) {
                this._defaultLogger.setColors(colors);
            }
            for (const logger of this._loggers.values()) {
                if (logger instanceof ConsoleLogger) {
                    logger.setColors(colors);
                }
            }
        }
        /**
         * 重置为默认颜色配置
         */
        resetColors() {
            if (this._defaultLogger instanceof ConsoleLogger) {
                this._defaultLogger.setColors({});
            }
            for (const logger of this._loggers.values()) {
                if (logger instanceof ConsoleLogger) {
                    logger.setColors({});
                }
            }
        }
        /**
         * 设置日志器工厂方法
         * @param factory 日志器工厂方法
         *
         * 注意: 应该在导入 ECS 模块之前调用此方法。
         * 设置后, 每次调用 getLogger() 都会通过 factory 创建新的 logger 实例, 由用户侧管理
         */
        setLoggerFactory(factory) {
            this._loggerFactory = factory;
            // 清空默认 logger,下次获取时使用新工厂方法
            delete this._defaultLogger;
            // 清空缓存
            this._loggers.clear();
        }
    }
    /**
     * 默认日志器实例
     */
    LoggerManager.getInstance().getLogger();
    /**
     * 创建命名日志器
     * @param name 日志器名称
     * @returns 日志器实例
     */
    function createLogger(name) {
        return LoggerManager.getInstance().getLogger(name);
    }

    createLogger('EntityRefDecorator');

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var _Reflect = {};

    /*! *****************************************************************************
    Copyright (C) Microsoft. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var hasRequired_Reflect;

    function require_Reflect () {
    	if (hasRequired_Reflect) return _Reflect;
    	hasRequired_Reflect = 1;
    	var Reflect;
    	(function (Reflect) {
    	    // Metadata Proposal
    	    // https://rbuckton.github.io/reflect-metadata/
    	    (function (factory) {
    	        var root = typeof globalThis === "object" ? globalThis :
    	            typeof commonjsGlobal === "object" ? commonjsGlobal :
    	                typeof self === "object" ? self :
    	                    typeof this === "object" ? this :
    	                        sloppyModeThis();
    	        var exporter = makeExporter(Reflect);
    	        if (typeof root.Reflect !== "undefined") {
    	            exporter = makeExporter(root.Reflect, exporter);
    	        }
    	        factory(exporter, root);
    	        if (typeof root.Reflect === "undefined") {
    	            root.Reflect = Reflect;
    	        }
    	        function makeExporter(target, previous) {
    	            return function (key, value) {
    	                Object.defineProperty(target, key, { configurable: true, writable: true, value: value });
    	                if (previous)
    	                    previous(key, value);
    	            };
    	        }
    	        function functionThis() {
    	            try {
    	                return Function("return this;")();
    	            }
    	            catch (_) { }
    	        }
    	        function indirectEvalThis() {
    	            try {
    	                return (void 0, eval)("(function() { return this; })()");
    	            }
    	            catch (_) { }
    	        }
    	        function sloppyModeThis() {
    	            return functionThis() || indirectEvalThis();
    	        }
    	    })(function (exporter, root) {
    	        var hasOwn = Object.prototype.hasOwnProperty;
    	        // feature test for Symbol support
    	        var supportsSymbol = typeof Symbol === "function";
    	        var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
    	        var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
    	        var supportsCreate = typeof Object.create === "function"; // feature test for Object.create support
    	        var supportsProto = { __proto__: [] } instanceof Array; // feature test for __proto__ support
    	        var downLevel = !supportsCreate && !supportsProto;
    	        var HashMap = {
    	            // create an object in dictionary mode (a.k.a. "slow" mode in v8)
    	            create: supportsCreate
    	                ? function () { return MakeDictionary(Object.create(null)); }
    	                : supportsProto
    	                    ? function () { return MakeDictionary({ __proto__: null }); }
    	                    : function () { return MakeDictionary({}); },
    	            has: downLevel
    	                ? function (map, key) { return hasOwn.call(map, key); }
    	                : function (map, key) { return key in map; },
    	            get: downLevel
    	                ? function (map, key) { return hasOwn.call(map, key) ? map[key] : undefined; }
    	                : function (map, key) { return map[key]; },
    	        };
    	        // Load global or shim versions of Map, Set, and WeakMap
    	        var functionPrototype = Object.getPrototypeOf(Function);
    	        var _Map = typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
    	        var _Set = typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
    	        var _WeakMap = typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
    	        var registrySymbol = supportsSymbol ? Symbol.for("@reflect-metadata:registry") : undefined;
    	        var metadataRegistry = GetOrCreateMetadataRegistry();
    	        var metadataProvider = CreateMetadataProvider(metadataRegistry);
    	        /**
    	         * Applies a set of decorators to a property of a target object.
    	         * @param decorators An array of decorators.
    	         * @param target The target object.
    	         * @param propertyKey (Optional) The property key to decorate.
    	         * @param attributes (Optional) The property descriptor for the target key.
    	         * @remarks Decorators are applied in reverse order.
    	         * @example
    	         *
    	         *     class Example {
    	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
    	         *         // static staticProperty;
    	         *         // property;
    	         *
    	         *         constructor(p) { }
    	         *         static staticMethod(p) { }
    	         *         method(p) { }
    	         *     }
    	         *
    	         *     // constructor
    	         *     Example = Reflect.decorate(decoratorsArray, Example);
    	         *
    	         *     // property (on constructor)
    	         *     Reflect.decorate(decoratorsArray, Example, "staticProperty");
    	         *
    	         *     // property (on prototype)
    	         *     Reflect.decorate(decoratorsArray, Example.prototype, "property");
    	         *
    	         *     // method (on constructor)
    	         *     Object.defineProperty(Example, "staticMethod",
    	         *         Reflect.decorate(decoratorsArray, Example, "staticMethod",
    	         *             Object.getOwnPropertyDescriptor(Example, "staticMethod")));
    	         *
    	         *     // method (on prototype)
    	         *     Object.defineProperty(Example.prototype, "method",
    	         *         Reflect.decorate(decoratorsArray, Example.prototype, "method",
    	         *             Object.getOwnPropertyDescriptor(Example.prototype, "method")));
    	         *
    	         */
    	        function decorate(decorators, target, propertyKey, attributes) {
    	            if (!IsUndefined(propertyKey)) {
    	                if (!IsArray(decorators))
    	                    throw new TypeError();
    	                if (!IsObject(target))
    	                    throw new TypeError();
    	                if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes))
    	                    throw new TypeError();
    	                if (IsNull(attributes))
    	                    attributes = undefined;
    	                propertyKey = ToPropertyKey(propertyKey);
    	                return DecorateProperty(decorators, target, propertyKey, attributes);
    	            }
    	            else {
    	                if (!IsArray(decorators))
    	                    throw new TypeError();
    	                if (!IsConstructor(target))
    	                    throw new TypeError();
    	                return DecorateConstructor(decorators, target);
    	            }
    	        }
    	        exporter("decorate", decorate);
    	        // 4.1.2 Reflect.metadata(metadataKey, metadataValue)
    	        // https://rbuckton.github.io/reflect-metadata/#reflect.metadata
    	        /**
    	         * A default metadata decorator factory that can be used on a class, class member, or parameter.
    	         * @param metadataKey The key for the metadata entry.
    	         * @param metadataValue The value for the metadata entry.
    	         * @returns A decorator function.
    	         * @remarks
    	         * If `metadataKey` is already defined for the target and target key, the
    	         * metadataValue for that key will be overwritten.
    	         * @example
    	         *
    	         *     // constructor
    	         *     @Reflect.metadata(key, value)
    	         *     class Example {
    	         *     }
    	         *
    	         *     // property (on constructor, TypeScript only)
    	         *     class Example {
    	         *         @Reflect.metadata(key, value)
    	         *         static staticProperty;
    	         *     }
    	         *
    	         *     // property (on prototype, TypeScript only)
    	         *     class Example {
    	         *         @Reflect.metadata(key, value)
    	         *         property;
    	         *     }
    	         *
    	         *     // method (on constructor)
    	         *     class Example {
    	         *         @Reflect.metadata(key, value)
    	         *         static staticMethod() { }
    	         *     }
    	         *
    	         *     // method (on prototype)
    	         *     class Example {
    	         *         @Reflect.metadata(key, value)
    	         *         method() { }
    	         *     }
    	         *
    	         */
    	        function metadata(metadataKey, metadataValue) {
    	            function decorator(target, propertyKey) {
    	                if (!IsObject(target))
    	                    throw new TypeError();
    	                if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
    	                    throw new TypeError();
    	                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
    	            }
    	            return decorator;
    	        }
    	        exporter("metadata", metadata);
    	        /**
    	         * Define a unique metadata entry on the target.
    	         * @param metadataKey A key used to store and retrieve metadata.
    	         * @param metadataValue A value that contains attached metadata.
    	         * @param target The target object on which to define metadata.
    	         * @param propertyKey (Optional) The property key for the target.
    	         * @example
    	         *
    	         *     class Example {
    	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
    	         *         // static staticProperty;
    	         *         // property;
    	         *
    	         *         constructor(p) { }
    	         *         static staticMethod(p) { }
    	         *         method(p) { }
    	         *     }
    	         *
    	         *     // constructor
    	         *     Reflect.defineMetadata("custom:annotation", options, Example);
    	         *
    	         *     // property (on constructor)
    	         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticProperty");
    	         *
    	         *     // property (on prototype)
    	         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "property");
    	         *
    	         *     // method (on constructor)
    	         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticMethod");
    	         *
    	         *     // method (on prototype)
    	         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "method");
    	         *
    	         *     // decorator factory as metadata-producing annotation.
    	         *     function MyAnnotation(options): Decorator {
    	         *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
    	         *     }
    	         *
    	         */
    	        function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
    	            if (!IsObject(target))
    	                throw new TypeError();
    	            if (!IsUndefined(propertyKey))
    	                propertyKey = ToPropertyKey(propertyKey);
    	            return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
    	        }
    	        exporter("defineMetadata", defineMetadata);
    	        /**
    	         * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
    	         * @param metadataKey A key used to store and retrieve metadata.
    	         * @param target The target object on which the metadata is defined.
    	         * @param propertyKey (Optional) The property key for the target.
    	         * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
    	         * @example
    	         *
    	         *     class Example {
    	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
    	         *         // static staticProperty;
    	         *         // property;
    	         *
    	         *         constructor(p) { }
    	         *         static staticMethod(p) { }
    	         *         method(p) { }
    	         *     }
    	         *
    	         *     // constructor
    	         *     result = Reflect.hasMetadata("custom:annotation", Example);
    	         *
    	         *     // property (on constructor)
    	         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticProperty");
    	         *
    	         *     // property (on prototype)
    	         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "property");
    	         *
    	         *     // method (on constructor)
    	         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticMethod");
    	         *
    	         *     // method (on prototype)
    	         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "method");
    	         *
    	         */
    	        function hasMetadata(metadataKey, target, propertyKey) {
    	            if (!IsObject(target))
    	                throw new TypeError();
    	            if (!IsUndefined(propertyKey))
    	                propertyKey = ToPropertyKey(propertyKey);
    	            return OrdinaryHasMetadata(metadataKey, target, propertyKey);
    	        }
    	        exporter("hasMetadata", hasMetadata);
    	        /**
    	         * Gets a value indicating whether the target object has the provided metadata key defined.
    	         * @param metadataKey A key used to store and retrieve metadata.
    	         * @param target The target object on which the metadata is defined.
    	         * @param propertyKey (Optional) The property key for the target.
    	         * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
    	         * @example
    	         *
    	         *     class Example {
    	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
    	         *         // static staticProperty;
    	         *         // property;
    	         *
    	         *         constructor(p) { }
    	         *         static staticMethod(p) { }
    	         *         method(p) { }
    	         *     }
    	         *
    	         *     // constructor
    	         *     result = Reflect.hasOwnMetadata("custom:annotation", Example);
    	         *
    	         *     // property (on constructor)
    	         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticProperty");
    	         *
    	         *     // property (on prototype)
    	         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "property");
    	         *
    	         *     // method (on constructor)
    	         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticMethod");
    	         *
    	         *     // method (on prototype)
    	         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "method");
    	         *
    	         */
    	        function hasOwnMetadata(metadataKey, target, propertyKey) {
    	            if (!IsObject(target))
    	                throw new TypeError();
    	            if (!IsUndefined(propertyKey))
    	                propertyKey = ToPropertyKey(propertyKey);
    	            return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
    	        }
    	        exporter("hasOwnMetadata", hasOwnMetadata);
    	        /**
    	         * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
    	         * @param metadataKey A key used to store and retrieve metadata.
    	         * @param target The target object on which the metadata is defined.
    	         * @param propertyKey (Optional) The property key for the target.
    	         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
    	         * @example
    	         *
    	         *     class Example {
    	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
    	         *         // static staticProperty;
    	         *         // property;
    	         *
    	         *         constructor(p) { }
    	         *         static staticMethod(p) { }
    	         *         method(p) { }
    	         *     }
    	         *
    	         *     // constructor
    	         *     result = Reflect.getMetadata("custom:annotation", Example);
    	         *
    	         *     // property (on constructor)
    	         *     result = Reflect.getMetadata("custom:annotation", Example, "staticProperty");
    	         *
    	         *     // property (on prototype)
    	         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "property");
    	         *
    	         *     // method (on constructor)
    	         *     result = Reflect.getMetadata("custom:annotation", Example, "staticMethod");
    	         *
    	         *     // method (on prototype)
    	         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "method");
    	         *
    	         */
    	        function getMetadata(metadataKey, target, propertyKey) {
    	            if (!IsObject(target))
    	                throw new TypeError();
    	            if (!IsUndefined(propertyKey))
    	                propertyKey = ToPropertyKey(propertyKey);
    	            return OrdinaryGetMetadata(metadataKey, target, propertyKey);
    	        }
    	        exporter("getMetadata", getMetadata);
    	        /**
    	         * Gets the metadata value for the provided metadata key on the target object.
    	         * @param metadataKey A key used to store and retrieve metadata.
    	         * @param target The target object on which the metadata is defined.
    	         * @param propertyKey (Optional) The property key for the target.
    	         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
    	         * @example
    	         *
    	         *     class Example {
    	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
    	         *         // static staticProperty;
    	         *         // property;
    	         *
    	         *         constructor(p) { }
    	         *         static staticMethod(p) { }
    	         *         method(p) { }
    	         *     }
    	         *
    	         *     // constructor
    	         *     result = Reflect.getOwnMetadata("custom:annotation", Example);
    	         *
    	         *     // property (on constructor)
    	         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticProperty");
    	         *
    	         *     // property (on prototype)
    	         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "property");
    	         *
    	         *     // method (on constructor)
    	         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticMethod");
    	         *
    	         *     // method (on prototype)
    	         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "method");
    	         *
    	         */
    	        function getOwnMetadata(metadataKey, target, propertyKey) {
    	            if (!IsObject(target))
    	                throw new TypeError();
    	            if (!IsUndefined(propertyKey))
    	                propertyKey = ToPropertyKey(propertyKey);
    	            return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
    	        }
    	        exporter("getOwnMetadata", getOwnMetadata);
    	        /**
    	         * Gets the metadata keys defined on the target object or its prototype chain.
    	         * @param target The target object on which the metadata is defined.
    	         * @param propertyKey (Optional) The property key for the target.
    	         * @returns An array of unique metadata keys.
    	         * @example
    	         *
    	         *     class Example {
    	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
    	         *         // static staticProperty;
    	         *         // property;
    	         *
    	         *         constructor(p) { }
    	         *         static staticMethod(p) { }
    	         *         method(p) { }
    	         *     }
    	         *
    	         *     // constructor
    	         *     result = Reflect.getMetadataKeys(Example);
    	         *
    	         *     // property (on constructor)
    	         *     result = Reflect.getMetadataKeys(Example, "staticProperty");
    	         *
    	         *     // property (on prototype)
    	         *     result = Reflect.getMetadataKeys(Example.prototype, "property");
    	         *
    	         *     // method (on constructor)
    	         *     result = Reflect.getMetadataKeys(Example, "staticMethod");
    	         *
    	         *     // method (on prototype)
    	         *     result = Reflect.getMetadataKeys(Example.prototype, "method");
    	         *
    	         */
    	        function getMetadataKeys(target, propertyKey) {
    	            if (!IsObject(target))
    	                throw new TypeError();
    	            if (!IsUndefined(propertyKey))
    	                propertyKey = ToPropertyKey(propertyKey);
    	            return OrdinaryMetadataKeys(target, propertyKey);
    	        }
    	        exporter("getMetadataKeys", getMetadataKeys);
    	        /**
    	         * Gets the unique metadata keys defined on the target object.
    	         * @param target The target object on which the metadata is defined.
    	         * @param propertyKey (Optional) The property key for the target.
    	         * @returns An array of unique metadata keys.
    	         * @example
    	         *
    	         *     class Example {
    	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
    	         *         // static staticProperty;
    	         *         // property;
    	         *
    	         *         constructor(p) { }
    	         *         static staticMethod(p) { }
    	         *         method(p) { }
    	         *     }
    	         *
    	         *     // constructor
    	         *     result = Reflect.getOwnMetadataKeys(Example);
    	         *
    	         *     // property (on constructor)
    	         *     result = Reflect.getOwnMetadataKeys(Example, "staticProperty");
    	         *
    	         *     // property (on prototype)
    	         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "property");
    	         *
    	         *     // method (on constructor)
    	         *     result = Reflect.getOwnMetadataKeys(Example, "staticMethod");
    	         *
    	         *     // method (on prototype)
    	         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "method");
    	         *
    	         */
    	        function getOwnMetadataKeys(target, propertyKey) {
    	            if (!IsObject(target))
    	                throw new TypeError();
    	            if (!IsUndefined(propertyKey))
    	                propertyKey = ToPropertyKey(propertyKey);
    	            return OrdinaryOwnMetadataKeys(target, propertyKey);
    	        }
    	        exporter("getOwnMetadataKeys", getOwnMetadataKeys);
    	        /**
    	         * Deletes the metadata entry from the target object with the provided key.
    	         * @param metadataKey A key used to store and retrieve metadata.
    	         * @param target The target object on which the metadata is defined.
    	         * @param propertyKey (Optional) The property key for the target.
    	         * @returns `true` if the metadata entry was found and deleted; otherwise, false.
    	         * @example
    	         *
    	         *     class Example {
    	         *         // property declarations are not part of ES6, though they are valid in TypeScript:
    	         *         // static staticProperty;
    	         *         // property;
    	         *
    	         *         constructor(p) { }
    	         *         static staticMethod(p) { }
    	         *         method(p) { }
    	         *     }
    	         *
    	         *     // constructor
    	         *     result = Reflect.deleteMetadata("custom:annotation", Example);
    	         *
    	         *     // property (on constructor)
    	         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticProperty");
    	         *
    	         *     // property (on prototype)
    	         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "property");
    	         *
    	         *     // method (on constructor)
    	         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticMethod");
    	         *
    	         *     // method (on prototype)
    	         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "method");
    	         *
    	         */
    	        function deleteMetadata(metadataKey, target, propertyKey) {
    	            if (!IsObject(target))
    	                throw new TypeError();
    	            if (!IsUndefined(propertyKey))
    	                propertyKey = ToPropertyKey(propertyKey);
    	            if (!IsObject(target))
    	                throw new TypeError();
    	            if (!IsUndefined(propertyKey))
    	                propertyKey = ToPropertyKey(propertyKey);
    	            var provider = GetMetadataProvider(target, propertyKey, /*Create*/ false);
    	            if (IsUndefined(provider))
    	                return false;
    	            return provider.OrdinaryDeleteMetadata(metadataKey, target, propertyKey);
    	        }
    	        exporter("deleteMetadata", deleteMetadata);
    	        function DecorateConstructor(decorators, target) {
    	            for (var i = decorators.length - 1; i >= 0; --i) {
    	                var decorator = decorators[i];
    	                var decorated = decorator(target);
    	                if (!IsUndefined(decorated) && !IsNull(decorated)) {
    	                    if (!IsConstructor(decorated))
    	                        throw new TypeError();
    	                    target = decorated;
    	                }
    	            }
    	            return target;
    	        }
    	        function DecorateProperty(decorators, target, propertyKey, descriptor) {
    	            for (var i = decorators.length - 1; i >= 0; --i) {
    	                var decorator = decorators[i];
    	                var decorated = decorator(target, propertyKey, descriptor);
    	                if (!IsUndefined(decorated) && !IsNull(decorated)) {
    	                    if (!IsObject(decorated))
    	                        throw new TypeError();
    	                    descriptor = decorated;
    	                }
    	            }
    	            return descriptor;
    	        }
    	        // 3.1.1.1 OrdinaryHasMetadata(MetadataKey, O, P)
    	        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasmetadata
    	        function OrdinaryHasMetadata(MetadataKey, O, P) {
    	            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
    	            if (hasOwn)
    	                return true;
    	            var parent = OrdinaryGetPrototypeOf(O);
    	            if (!IsNull(parent))
    	                return OrdinaryHasMetadata(MetadataKey, parent, P);
    	            return false;
    	        }
    	        // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
    	        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
    	        function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
    	            var provider = GetMetadataProvider(O, P, /*Create*/ false);
    	            if (IsUndefined(provider))
    	                return false;
    	            return ToBoolean(provider.OrdinaryHasOwnMetadata(MetadataKey, O, P));
    	        }
    	        // 3.1.3.1 OrdinaryGetMetadata(MetadataKey, O, P)
    	        // https://rbuckton.github.io/reflect-metadata/#ordinarygetmetadata
    	        function OrdinaryGetMetadata(MetadataKey, O, P) {
    	            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
    	            if (hasOwn)
    	                return OrdinaryGetOwnMetadata(MetadataKey, O, P);
    	            var parent = OrdinaryGetPrototypeOf(O);
    	            if (!IsNull(parent))
    	                return OrdinaryGetMetadata(MetadataKey, parent, P);
    	            return undefined;
    	        }
    	        // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
    	        // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
    	        function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
    	            var provider = GetMetadataProvider(O, P, /*Create*/ false);
    	            if (IsUndefined(provider))
    	                return;
    	            return provider.OrdinaryGetOwnMetadata(MetadataKey, O, P);
    	        }
    	        // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
    	        // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
    	        function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
    	            var provider = GetMetadataProvider(O, P, /*Create*/ true);
    	            provider.OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P);
    	        }
    	        // 3.1.6.1 OrdinaryMetadataKeys(O, P)
    	        // https://rbuckton.github.io/reflect-metadata/#ordinarymetadatakeys
    	        function OrdinaryMetadataKeys(O, P) {
    	            var ownKeys = OrdinaryOwnMetadataKeys(O, P);
    	            var parent = OrdinaryGetPrototypeOf(O);
    	            if (parent === null)
    	                return ownKeys;
    	            var parentKeys = OrdinaryMetadataKeys(parent, P);
    	            if (parentKeys.length <= 0)
    	                return ownKeys;
    	            if (ownKeys.length <= 0)
    	                return parentKeys;
    	            var set = new _Set();
    	            var keys = [];
    	            for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
    	                var key = ownKeys_1[_i];
    	                var hasKey = set.has(key);
    	                if (!hasKey) {
    	                    set.add(key);
    	                    keys.push(key);
    	                }
    	            }
    	            for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
    	                var key = parentKeys_1[_a];
    	                var hasKey = set.has(key);
    	                if (!hasKey) {
    	                    set.add(key);
    	                    keys.push(key);
    	                }
    	            }
    	            return keys;
    	        }
    	        // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
    	        // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
    	        function OrdinaryOwnMetadataKeys(O, P) {
    	            var provider = GetMetadataProvider(O, P, /*create*/ false);
    	            if (!provider) {
    	                return [];
    	            }
    	            return provider.OrdinaryOwnMetadataKeys(O, P);
    	        }
    	        // 6 ECMAScript Data Types and Values
    	        // https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values
    	        function Type(x) {
    	            if (x === null)
    	                return 1 /* Null */;
    	            switch (typeof x) {
    	                case "undefined": return 0 /* Undefined */;
    	                case "boolean": return 2 /* Boolean */;
    	                case "string": return 3 /* String */;
    	                case "symbol": return 4 /* Symbol */;
    	                case "number": return 5 /* Number */;
    	                case "object": return x === null ? 1 /* Null */ : 6 /* Object */;
    	                default: return 6 /* Object */;
    	            }
    	        }
    	        // 6.1.1 The Undefined Type
    	        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-undefined-type
    	        function IsUndefined(x) {
    	            return x === undefined;
    	        }
    	        // 6.1.2 The Null Type
    	        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-null-type
    	        function IsNull(x) {
    	            return x === null;
    	        }
    	        // 6.1.5 The Symbol Type
    	        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-symbol-type
    	        function IsSymbol(x) {
    	            return typeof x === "symbol";
    	        }
    	        // 6.1.7 The Object Type
    	        // https://tc39.github.io/ecma262/#sec-object-type
    	        function IsObject(x) {
    	            return typeof x === "object" ? x !== null : typeof x === "function";
    	        }
    	        // 7.1 Type Conversion
    	        // https://tc39.github.io/ecma262/#sec-type-conversion
    	        // 7.1.1 ToPrimitive(input [, PreferredType])
    	        // https://tc39.github.io/ecma262/#sec-toprimitive
    	        function ToPrimitive(input, PreferredType) {
    	            switch (Type(input)) {
    	                case 0 /* Undefined */: return input;
    	                case 1 /* Null */: return input;
    	                case 2 /* Boolean */: return input;
    	                case 3 /* String */: return input;
    	                case 4 /* Symbol */: return input;
    	                case 5 /* Number */: return input;
    	            }
    	            var hint = "string" ;
    	            var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
    	            if (exoticToPrim !== undefined) {
    	                var result = exoticToPrim.call(input, hint);
    	                if (IsObject(result))
    	                    throw new TypeError();
    	                return result;
    	            }
    	            return OrdinaryToPrimitive(input);
    	        }
    	        // 7.1.1.1 OrdinaryToPrimitive(O, hint)
    	        // https://tc39.github.io/ecma262/#sec-ordinarytoprimitive
    	        function OrdinaryToPrimitive(O, hint) {
    	            var valueOf, result, toString_2; {
    	                var toString_1 = O.toString;
    	                if (IsCallable(toString_1)) {
    	                    var result = toString_1.call(O);
    	                    if (!IsObject(result))
    	                        return result;
    	                }
    	                var valueOf = O.valueOf;
    	                if (IsCallable(valueOf)) {
    	                    var result = valueOf.call(O);
    	                    if (!IsObject(result))
    	                        return result;
    	                }
    	            }
    	            throw new TypeError();
    	        }
    	        // 7.1.2 ToBoolean(argument)
    	        // https://tc39.github.io/ecma262/2016/#sec-toboolean
    	        function ToBoolean(argument) {
    	            return !!argument;
    	        }
    	        // 7.1.12 ToString(argument)
    	        // https://tc39.github.io/ecma262/#sec-tostring
    	        function ToString(argument) {
    	            return "" + argument;
    	        }
    	        // 7.1.14 ToPropertyKey(argument)
    	        // https://tc39.github.io/ecma262/#sec-topropertykey
    	        function ToPropertyKey(argument) {
    	            var key = ToPrimitive(argument);
    	            if (IsSymbol(key))
    	                return key;
    	            return ToString(key);
    	        }
    	        // 7.2 Testing and Comparison Operations
    	        // https://tc39.github.io/ecma262/#sec-testing-and-comparison-operations
    	        // 7.2.2 IsArray(argument)
    	        // https://tc39.github.io/ecma262/#sec-isarray
    	        function IsArray(argument) {
    	            return Array.isArray
    	                ? Array.isArray(argument)
    	                : argument instanceof Object
    	                    ? argument instanceof Array
    	                    : Object.prototype.toString.call(argument) === "[object Array]";
    	        }
    	        // 7.2.3 IsCallable(argument)
    	        // https://tc39.github.io/ecma262/#sec-iscallable
    	        function IsCallable(argument) {
    	            // NOTE: This is an approximation as we cannot check for [[Call]] internal method.
    	            return typeof argument === "function";
    	        }
    	        // 7.2.4 IsConstructor(argument)
    	        // https://tc39.github.io/ecma262/#sec-isconstructor
    	        function IsConstructor(argument) {
    	            // NOTE: This is an approximation as we cannot check for [[Construct]] internal method.
    	            return typeof argument === "function";
    	        }
    	        // 7.2.7 IsPropertyKey(argument)
    	        // https://tc39.github.io/ecma262/#sec-ispropertykey
    	        function IsPropertyKey(argument) {
    	            switch (Type(argument)) {
    	                case 3 /* String */: return true;
    	                case 4 /* Symbol */: return true;
    	                default: return false;
    	            }
    	        }
    	        function SameValueZero(x, y) {
    	            return x === y || x !== x && y !== y;
    	        }
    	        // 7.3 Operations on Objects
    	        // https://tc39.github.io/ecma262/#sec-operations-on-objects
    	        // 7.3.9 GetMethod(V, P)
    	        // https://tc39.github.io/ecma262/#sec-getmethod
    	        function GetMethod(V, P) {
    	            var func = V[P];
    	            if (func === undefined || func === null)
    	                return undefined;
    	            if (!IsCallable(func))
    	                throw new TypeError();
    	            return func;
    	        }
    	        // 7.4 Operations on Iterator Objects
    	        // https://tc39.github.io/ecma262/#sec-operations-on-iterator-objects
    	        function GetIterator(obj) {
    	            var method = GetMethod(obj, iteratorSymbol);
    	            if (!IsCallable(method))
    	                throw new TypeError(); // from Call
    	            var iterator = method.call(obj);
    	            if (!IsObject(iterator))
    	                throw new TypeError();
    	            return iterator;
    	        }
    	        // 7.4.4 IteratorValue(iterResult)
    	        // https://tc39.github.io/ecma262/2016/#sec-iteratorvalue
    	        function IteratorValue(iterResult) {
    	            return iterResult.value;
    	        }
    	        // 7.4.5 IteratorStep(iterator)
    	        // https://tc39.github.io/ecma262/#sec-iteratorstep
    	        function IteratorStep(iterator) {
    	            var result = iterator.next();
    	            return result.done ? false : result;
    	        }
    	        // 7.4.6 IteratorClose(iterator, completion)
    	        // https://tc39.github.io/ecma262/#sec-iteratorclose
    	        function IteratorClose(iterator) {
    	            var f = iterator["return"];
    	            if (f)
    	                f.call(iterator);
    	        }
    	        // 9.1 Ordinary Object Internal Methods and Internal Slots
    	        // https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
    	        // 9.1.1.1 OrdinaryGetPrototypeOf(O)
    	        // https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
    	        function OrdinaryGetPrototypeOf(O) {
    	            var proto = Object.getPrototypeOf(O);
    	            if (typeof O !== "function" || O === functionPrototype)
    	                return proto;
    	            // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
    	            // Try to determine the superclass constructor. Compatible implementations
    	            // must either set __proto__ on a subclass constructor to the superclass constructor,
    	            // or ensure each class has a valid `constructor` property on its prototype that
    	            // points back to the constructor.
    	            // If this is not the same as Function.[[Prototype]], then this is definately inherited.
    	            // This is the case when in ES6 or when using __proto__ in a compatible browser.
    	            if (proto !== functionPrototype)
    	                return proto;
    	            // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
    	            var prototype = O.prototype;
    	            var prototypeProto = prototype && Object.getPrototypeOf(prototype);
    	            if (prototypeProto == null || prototypeProto === Object.prototype)
    	                return proto;
    	            // If the constructor was not a function, then we cannot determine the heritage.
    	            var constructor = prototypeProto.constructor;
    	            if (typeof constructor !== "function")
    	                return proto;
    	            // If we have some kind of self-reference, then we cannot determine the heritage.
    	            if (constructor === O)
    	                return proto;
    	            // we have a pretty good guess at the heritage.
    	            return constructor;
    	        }
    	        // Global metadata registry
    	        // - Allows `import "reflect-metadata"` and `import "reflect-metadata/no-conflict"` to interoperate.
    	        // - Uses isolated metadata if `Reflect` is frozen before the registry can be installed.
    	        /**
    	         * Creates a registry used to allow multiple `reflect-metadata` providers.
    	         */
    	        function CreateMetadataRegistry() {
    	            var fallback;
    	            if (!IsUndefined(registrySymbol) &&
    	                typeof root.Reflect !== "undefined" &&
    	                !(registrySymbol in root.Reflect) &&
    	                typeof root.Reflect.defineMetadata === "function") {
    	                // interoperate with older version of `reflect-metadata` that did not support a registry.
    	                fallback = CreateFallbackProvider(root.Reflect);
    	            }
    	            var first;
    	            var second;
    	            var rest;
    	            var targetProviderMap = new _WeakMap();
    	            var registry = {
    	                registerProvider: registerProvider,
    	                getProvider: getProvider,
    	                setProvider: setProvider,
    	            };
    	            return registry;
    	            function registerProvider(provider) {
    	                if (!Object.isExtensible(registry)) {
    	                    throw new Error("Cannot add provider to a frozen registry.");
    	                }
    	                switch (true) {
    	                    case fallback === provider: break;
    	                    case IsUndefined(first):
    	                        first = provider;
    	                        break;
    	                    case first === provider: break;
    	                    case IsUndefined(second):
    	                        second = provider;
    	                        break;
    	                    case second === provider: break;
    	                    default:
    	                        if (rest === undefined)
    	                            rest = new _Set();
    	                        rest.add(provider);
    	                        break;
    	                }
    	            }
    	            function getProviderNoCache(O, P) {
    	                if (!IsUndefined(first)) {
    	                    if (first.isProviderFor(O, P))
    	                        return first;
    	                    if (!IsUndefined(second)) {
    	                        if (second.isProviderFor(O, P))
    	                            return first;
    	                        if (!IsUndefined(rest)) {
    	                            var iterator = GetIterator(rest);
    	                            while (true) {
    	                                var next = IteratorStep(iterator);
    	                                if (!next) {
    	                                    return undefined;
    	                                }
    	                                var provider = IteratorValue(next);
    	                                if (provider.isProviderFor(O, P)) {
    	                                    IteratorClose(iterator);
    	                                    return provider;
    	                                }
    	                            }
    	                        }
    	                    }
    	                }
    	                if (!IsUndefined(fallback) && fallback.isProviderFor(O, P)) {
    	                    return fallback;
    	                }
    	                return undefined;
    	            }
    	            function getProvider(O, P) {
    	                var providerMap = targetProviderMap.get(O);
    	                var provider;
    	                if (!IsUndefined(providerMap)) {
    	                    provider = providerMap.get(P);
    	                }
    	                if (!IsUndefined(provider)) {
    	                    return provider;
    	                }
    	                provider = getProviderNoCache(O, P);
    	                if (!IsUndefined(provider)) {
    	                    if (IsUndefined(providerMap)) {
    	                        providerMap = new _Map();
    	                        targetProviderMap.set(O, providerMap);
    	                    }
    	                    providerMap.set(P, provider);
    	                }
    	                return provider;
    	            }
    	            function hasProvider(provider) {
    	                if (IsUndefined(provider))
    	                    throw new TypeError();
    	                return first === provider || second === provider || !IsUndefined(rest) && rest.has(provider);
    	            }
    	            function setProvider(O, P, provider) {
    	                if (!hasProvider(provider)) {
    	                    throw new Error("Metadata provider not registered.");
    	                }
    	                var existingProvider = getProvider(O, P);
    	                if (existingProvider !== provider) {
    	                    if (!IsUndefined(existingProvider)) {
    	                        return false;
    	                    }
    	                    var providerMap = targetProviderMap.get(O);
    	                    if (IsUndefined(providerMap)) {
    	                        providerMap = new _Map();
    	                        targetProviderMap.set(O, providerMap);
    	                    }
    	                    providerMap.set(P, provider);
    	                }
    	                return true;
    	            }
    	        }
    	        /**
    	         * Gets or creates the shared registry of metadata providers.
    	         */
    	        function GetOrCreateMetadataRegistry() {
    	            var metadataRegistry;
    	            if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
    	                metadataRegistry = root.Reflect[registrySymbol];
    	            }
    	            if (IsUndefined(metadataRegistry)) {
    	                metadataRegistry = CreateMetadataRegistry();
    	            }
    	            if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
    	                Object.defineProperty(root.Reflect, registrySymbol, {
    	                    enumerable: false,
    	                    configurable: false,
    	                    writable: false,
    	                    value: metadataRegistry
    	                });
    	            }
    	            return metadataRegistry;
    	        }
    	        function CreateMetadataProvider(registry) {
    	            // [[Metadata]] internal slot
    	            // https://rbuckton.github.io/reflect-metadata/#ordinary-object-internal-methods-and-internal-slots
    	            var metadata = new _WeakMap();
    	            var provider = {
    	                isProviderFor: function (O, P) {
    	                    var targetMetadata = metadata.get(O);
    	                    if (IsUndefined(targetMetadata))
    	                        return false;
    	                    return targetMetadata.has(P);
    	                },
    	                OrdinaryDefineOwnMetadata: OrdinaryDefineOwnMetadata,
    	                OrdinaryHasOwnMetadata: OrdinaryHasOwnMetadata,
    	                OrdinaryGetOwnMetadata: OrdinaryGetOwnMetadata,
    	                OrdinaryOwnMetadataKeys: OrdinaryOwnMetadataKeys,
    	                OrdinaryDeleteMetadata: OrdinaryDeleteMetadata,
    	            };
    	            metadataRegistry.registerProvider(provider);
    	            return provider;
    	            function GetOrCreateMetadataMap(O, P, Create) {
    	                var targetMetadata = metadata.get(O);
    	                var createdTargetMetadata = false;
    	                if (IsUndefined(targetMetadata)) {
    	                    if (!Create)
    	                        return undefined;
    	                    targetMetadata = new _Map();
    	                    metadata.set(O, targetMetadata);
    	                    createdTargetMetadata = true;
    	                }
    	                var metadataMap = targetMetadata.get(P);
    	                if (IsUndefined(metadataMap)) {
    	                    if (!Create)
    	                        return undefined;
    	                    metadataMap = new _Map();
    	                    targetMetadata.set(P, metadataMap);
    	                    if (!registry.setProvider(O, P, provider)) {
    	                        targetMetadata.delete(P);
    	                        if (createdTargetMetadata) {
    	                            metadata.delete(O);
    	                        }
    	                        throw new Error("Wrong provider for target.");
    	                    }
    	                }
    	                return metadataMap;
    	            }
    	            // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
    	            // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
    	            function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
    	                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
    	                if (IsUndefined(metadataMap))
    	                    return false;
    	                return ToBoolean(metadataMap.has(MetadataKey));
    	            }
    	            // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
    	            // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
    	            function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
    	                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
    	                if (IsUndefined(metadataMap))
    	                    return undefined;
    	                return metadataMap.get(MetadataKey);
    	            }
    	            // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
    	            // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
    	            function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
    	                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ true);
    	                metadataMap.set(MetadataKey, MetadataValue);
    	            }
    	            // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
    	            // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
    	            function OrdinaryOwnMetadataKeys(O, P) {
    	                var keys = [];
    	                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
    	                if (IsUndefined(metadataMap))
    	                    return keys;
    	                var keysObj = metadataMap.keys();
    	                var iterator = GetIterator(keysObj);
    	                var k = 0;
    	                while (true) {
    	                    var next = IteratorStep(iterator);
    	                    if (!next) {
    	                        keys.length = k;
    	                        return keys;
    	                    }
    	                    var nextValue = IteratorValue(next);
    	                    try {
    	                        keys[k] = nextValue;
    	                    }
    	                    catch (e) {
    	                        try {
    	                            IteratorClose(iterator);
    	                        }
    	                        finally {
    	                            throw e;
    	                        }
    	                    }
    	                    k++;
    	                }
    	            }
    	            function OrdinaryDeleteMetadata(MetadataKey, O, P) {
    	                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
    	                if (IsUndefined(metadataMap))
    	                    return false;
    	                if (!metadataMap.delete(MetadataKey))
    	                    return false;
    	                if (metadataMap.size === 0) {
    	                    var targetMetadata = metadata.get(O);
    	                    if (!IsUndefined(targetMetadata)) {
    	                        targetMetadata.delete(P);
    	                        if (targetMetadata.size === 0) {
    	                            metadata.delete(targetMetadata);
    	                        }
    	                    }
    	                }
    	                return true;
    	            }
    	        }
    	        function CreateFallbackProvider(reflect) {
    	            var defineMetadata = reflect.defineMetadata, hasOwnMetadata = reflect.hasOwnMetadata, getOwnMetadata = reflect.getOwnMetadata, getOwnMetadataKeys = reflect.getOwnMetadataKeys, deleteMetadata = reflect.deleteMetadata;
    	            var metadataOwner = new _WeakMap();
    	            var provider = {
    	                isProviderFor: function (O, P) {
    	                    var metadataPropertySet = metadataOwner.get(O);
    	                    if (!IsUndefined(metadataPropertySet) && metadataPropertySet.has(P)) {
    	                        return true;
    	                    }
    	                    if (getOwnMetadataKeys(O, P).length) {
    	                        if (IsUndefined(metadataPropertySet)) {
    	                            metadataPropertySet = new _Set();
    	                            metadataOwner.set(O, metadataPropertySet);
    	                        }
    	                        metadataPropertySet.add(P);
    	                        return true;
    	                    }
    	                    return false;
    	                },
    	                OrdinaryDefineOwnMetadata: defineMetadata,
    	                OrdinaryHasOwnMetadata: hasOwnMetadata,
    	                OrdinaryGetOwnMetadata: getOwnMetadata,
    	                OrdinaryOwnMetadataKeys: getOwnMetadataKeys,
    	                OrdinaryDeleteMetadata: deleteMetadata,
    	            };
    	            return provider;
    	        }
    	        /**
    	         * Gets the metadata provider for an object. If the object has no metadata provider and this is for a create operation,
    	         * then this module's metadata provider is assigned to the object.
    	         */
    	        function GetMetadataProvider(O, P, Create) {
    	            var registeredProvider = metadataRegistry.getProvider(O, P);
    	            if (!IsUndefined(registeredProvider)) {
    	                return registeredProvider;
    	            }
    	            if (Create) {
    	                if (metadataRegistry.setProvider(O, P, metadataProvider)) {
    	                    return metadataProvider;
    	                }
    	                throw new Error("Illegal state.");
    	            }
    	            return undefined;
    	        }
    	        // naive Map shim
    	        function CreateMapPolyfill() {
    	            var cacheSentinel = {};
    	            var arraySentinel = [];
    	            var MapIterator = /** @class */ (function () {
    	                function MapIterator(keys, values, selector) {
    	                    this._index = 0;
    	                    this._keys = keys;
    	                    this._values = values;
    	                    this._selector = selector;
    	                }
    	                MapIterator.prototype["@@iterator"] = function () { return this; };
    	                MapIterator.prototype[iteratorSymbol] = function () { return this; };
    	                MapIterator.prototype.next = function () {
    	                    var index = this._index;
    	                    if (index >= 0 && index < this._keys.length) {
    	                        var result = this._selector(this._keys[index], this._values[index]);
    	                        if (index + 1 >= this._keys.length) {
    	                            this._index = -1;
    	                            this._keys = arraySentinel;
    	                            this._values = arraySentinel;
    	                        }
    	                        else {
    	                            this._index++;
    	                        }
    	                        return { value: result, done: false };
    	                    }
    	                    return { value: undefined, done: true };
    	                };
    	                MapIterator.prototype.throw = function (error) {
    	                    if (this._index >= 0) {
    	                        this._index = -1;
    	                        this._keys = arraySentinel;
    	                        this._values = arraySentinel;
    	                    }
    	                    throw error;
    	                };
    	                MapIterator.prototype.return = function (value) {
    	                    if (this._index >= 0) {
    	                        this._index = -1;
    	                        this._keys = arraySentinel;
    	                        this._values = arraySentinel;
    	                    }
    	                    return { value: value, done: true };
    	                };
    	                return MapIterator;
    	            }());
    	            var Map = /** @class */ (function () {
    	                function Map() {
    	                    this._keys = [];
    	                    this._values = [];
    	                    this._cacheKey = cacheSentinel;
    	                    this._cacheIndex = -2;
    	                }
    	                Object.defineProperty(Map.prototype, "size", {
    	                    get: function () { return this._keys.length; },
    	                    enumerable: true,
    	                    configurable: true
    	                });
    	                Map.prototype.has = function (key) { return this._find(key, /*insert*/ false) >= 0; };
    	                Map.prototype.get = function (key) {
    	                    var index = this._find(key, /*insert*/ false);
    	                    return index >= 0 ? this._values[index] : undefined;
    	                };
    	                Map.prototype.set = function (key, value) {
    	                    var index = this._find(key, /*insert*/ true);
    	                    this._values[index] = value;
    	                    return this;
    	                };
    	                Map.prototype.delete = function (key) {
    	                    var index = this._find(key, /*insert*/ false);
    	                    if (index >= 0) {
    	                        var size = this._keys.length;
    	                        for (var i = index + 1; i < size; i++) {
    	                            this._keys[i - 1] = this._keys[i];
    	                            this._values[i - 1] = this._values[i];
    	                        }
    	                        this._keys.length--;
    	                        this._values.length--;
    	                        if (SameValueZero(key, this._cacheKey)) {
    	                            this._cacheKey = cacheSentinel;
    	                            this._cacheIndex = -2;
    	                        }
    	                        return true;
    	                    }
    	                    return false;
    	                };
    	                Map.prototype.clear = function () {
    	                    this._keys.length = 0;
    	                    this._values.length = 0;
    	                    this._cacheKey = cacheSentinel;
    	                    this._cacheIndex = -2;
    	                };
    	                Map.prototype.keys = function () { return new MapIterator(this._keys, this._values, getKey); };
    	                Map.prototype.values = function () { return new MapIterator(this._keys, this._values, getValue); };
    	                Map.prototype.entries = function () { return new MapIterator(this._keys, this._values, getEntry); };
    	                Map.prototype["@@iterator"] = function () { return this.entries(); };
    	                Map.prototype[iteratorSymbol] = function () { return this.entries(); };
    	                Map.prototype._find = function (key, insert) {
    	                    if (!SameValueZero(this._cacheKey, key)) {
    	                        this._cacheIndex = -1;
    	                        for (var i = 0; i < this._keys.length; i++) {
    	                            if (SameValueZero(this._keys[i], key)) {
    	                                this._cacheIndex = i;
    	                                break;
    	                            }
    	                        }
    	                    }
    	                    if (this._cacheIndex < 0 && insert) {
    	                        this._cacheIndex = this._keys.length;
    	                        this._keys.push(key);
    	                        this._values.push(undefined);
    	                    }
    	                    return this._cacheIndex;
    	                };
    	                return Map;
    	            }());
    	            return Map;
    	            function getKey(key, _) {
    	                return key;
    	            }
    	            function getValue(_, value) {
    	                return value;
    	            }
    	            function getEntry(key, value) {
    	                return [key, value];
    	            }
    	        }
    	        // naive Set shim
    	        function CreateSetPolyfill() {
    	            var Set = /** @class */ (function () {
    	                function Set() {
    	                    this._map = new _Map();
    	                }
    	                Object.defineProperty(Set.prototype, "size", {
    	                    get: function () { return this._map.size; },
    	                    enumerable: true,
    	                    configurable: true
    	                });
    	                Set.prototype.has = function (value) { return this._map.has(value); };
    	                Set.prototype.add = function (value) { return this._map.set(value, value), this; };
    	                Set.prototype.delete = function (value) { return this._map.delete(value); };
    	                Set.prototype.clear = function () { this._map.clear(); };
    	                Set.prototype.keys = function () { return this._map.keys(); };
    	                Set.prototype.values = function () { return this._map.keys(); };
    	                Set.prototype.entries = function () { return this._map.entries(); };
    	                Set.prototype["@@iterator"] = function () { return this.keys(); };
    	                Set.prototype[iteratorSymbol] = function () { return this.keys(); };
    	                return Set;
    	            }());
    	            return Set;
    	        }
    	        // naive WeakMap shim
    	        function CreateWeakMapPolyfill() {
    	            var UUID_SIZE = 16;
    	            var keys = HashMap.create();
    	            var rootKey = CreateUniqueKey();
    	            return /** @class */ (function () {
    	                function WeakMap() {
    	                    this._key = CreateUniqueKey();
    	                }
    	                WeakMap.prototype.has = function (target) {
    	                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
    	                    return table !== undefined ? HashMap.has(table, this._key) : false;
    	                };
    	                WeakMap.prototype.get = function (target) {
    	                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
    	                    return table !== undefined ? HashMap.get(table, this._key) : undefined;
    	                };
    	                WeakMap.prototype.set = function (target, value) {
    	                    var table = GetOrCreateWeakMapTable(target, /*create*/ true);
    	                    table[this._key] = value;
    	                    return this;
    	                };
    	                WeakMap.prototype.delete = function (target) {
    	                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
    	                    return table !== undefined ? delete table[this._key] : false;
    	                };
    	                WeakMap.prototype.clear = function () {
    	                    // NOTE: not a real clear, just makes the previous data unreachable
    	                    this._key = CreateUniqueKey();
    	                };
    	                return WeakMap;
    	            }());
    	            function CreateUniqueKey() {
    	                var key;
    	                do
    	                    key = "@@WeakMap@@" + CreateUUID();
    	                while (HashMap.has(keys, key));
    	                keys[key] = true;
    	                return key;
    	            }
    	            function GetOrCreateWeakMapTable(target, create) {
    	                if (!hasOwn.call(target, rootKey)) {
    	                    if (!create)
    	                        return undefined;
    	                    Object.defineProperty(target, rootKey, { value: HashMap.create() });
    	                }
    	                return target[rootKey];
    	            }
    	            function FillRandomBytes(buffer, size) {
    	                for (var i = 0; i < size; ++i)
    	                    buffer[i] = Math.random() * 0xff | 0;
    	                return buffer;
    	            }
    	            function GenRandomBytes(size) {
    	                if (typeof Uint8Array === "function") {
    	                    var array = new Uint8Array(size);
    	                    if (typeof crypto !== "undefined") {
    	                        crypto.getRandomValues(array);
    	                    }
    	                    else if (typeof msCrypto !== "undefined") {
    	                        msCrypto.getRandomValues(array);
    	                    }
    	                    else {
    	                        FillRandomBytes(array, size);
    	                    }
    	                    return array;
    	                }
    	                return FillRandomBytes(new Array(size), size);
    	            }
    	            function CreateUUID() {
    	                var data = GenRandomBytes(UUID_SIZE);
    	                // mark as random - RFC 4122 § 4.4
    	                data[6] = data[6] & 0x4f | 0x40;
    	                data[8] = data[8] & 0xbf | 0x80;
    	                var result = "";
    	                for (var offset = 0; offset < UUID_SIZE; ++offset) {
    	                    var byte = data[offset];
    	                    if (offset === 4 || offset === 6 || offset === 8)
    	                        result += "-";
    	                    if (byte < 16)
    	                        result += "0";
    	                    result += byte.toString(16).toLowerCase();
    	                }
    	                return result;
    	            }
    	        }
    	        // uses a heuristic used by v8 and chakra to force an object into dictionary mode.
    	        function MakeDictionary(obj) {
    	            obj.__ = undefined;
    	            delete obj.__;
    	            return obj;
    	        }
    	    });
    	})(Reflect || (Reflect = {}));
    	return _Reflect;
    }

    require_Reflect();

    const PROPERTY_METADATA = Symbol('property:metadata');
    /**
     * 属性装饰器 - 声明组件属性的编辑器元数据
     *
     * @example
     * ```typescript
     * @ECSComponent('Transform')
     * export class TransformComponent extends Component {
     *     @Property({ type: 'vector3', label: 'Position' })
     *     public position: Vector3 = { x: 0, y: 0, z: 0 };
     *
     *     @Property({ type: 'number', label: 'Speed', min: 0, max: 100 })
     *     public speed: number = 10;
     * }
     * ```
     */
    function Property(options) {
        return (target, propertyKey) => {
            const constructor = target.constructor;
            const existingMetadata = Reflect.getMetadata(PROPERTY_METADATA, constructor) || {};
            existingMetadata[propertyKey] = options;
            Reflect.defineMetadata(PROPERTY_METADATA, existingMetadata, constructor);
        };
    }

    /**
     * 实体数据收集器
     */
    class EntityDataCollector {
        /**
         * 收集实体数据
         * @param scene 场景实例
         */
        collectEntityData(scene) {
            if (!scene) {
                return this.getEmptyEntityDebugData();
            }
            const entityList = scene.entities;
            if (!entityList) {
                return this.getEmptyEntityDebugData();
            }
            let stats;
            try {
                stats = entityList.getStats ? entityList.getStats() : this.calculateFallbackEntityStats(entityList);
            }
            catch (error) {
                return {
                    totalEntities: 0,
                    activeEntities: 0,
                    pendingAdd: 0,
                    pendingRemove: 0,
                    entitiesPerArchetype: [],
                    topEntitiesByComponents: [],
                    entityHierarchy: [],
                    entityDetailsMap: {}
                };
            }
            const archetypeData = this.collectArchetypeData(scene);
            return {
                totalEntities: stats.totalEntities,
                activeEntities: stats.activeEntities,
                pendingAdd: stats.pendingAdd || 0,
                pendingRemove: stats.pendingRemove || 0,
                entitiesPerArchetype: archetypeData.distribution,
                topEntitiesByComponents: archetypeData.topEntities,
                entityHierarchy: [],
                entityDetailsMap: {}
            };
        }
        /**
         * 获取原始实体列表
         * @param scene 场景实例
         */
        getRawEntityList(scene) {
            if (!scene)
                return [];
            const entityList = scene.entities;
            if (!entityList?.buffer)
                return [];
            return entityList.buffer.map((entity) => ({
                id: entity.id,
                name: entity.name || `Entity_${entity.id}`,
                active: entity.active !== false,
                enabled: entity.enabled !== false,
                activeInHierarchy: entity.activeInHierarchy !== false,
                componentCount: entity.components.length,
                componentTypes: entity.components.map((component) => getComponentInstanceTypeName(component)),
                parentId: entity.parent?.id || null,
                childIds: entity.children?.map((child) => child.id) || [],
                depth: entity.getDepth ? entity.getDepth() : 0,
                tag: entity.tag || 0,
                updateOrder: entity.updateOrder || 0
            }));
        }
        /**
         * 获取实体详细信息
         * @param entityId 实体ID
         * @param scene 场景实例
         */
        getEntityDetails(entityId, scene) {
            try {
                if (!scene)
                    return null;
                const entityList = scene.entities;
                if (!entityList?.buffer)
                    return null;
                const entity = entityList.buffer.find((e) => e.id === entityId);
                if (!entity)
                    return null;
                const baseDebugInfo = entity.getDebugInfo
                    ? entity.getDebugInfo()
                    : this.buildFallbackEntityInfo(entity, scene);
                const componentDetails = this.extractComponentDetails(entity.components);
                const sceneInfo = this.getSceneInfo(scene);
                return {
                    ...baseDebugInfo,
                    scene: sceneInfo.name,
                    sceneName: sceneInfo.name,
                    sceneType: sceneInfo.type,
                    parentName: entity.parent?.name || null,
                    components: componentDetails || [],
                    componentCount: entity.components?.length || 0,
                    componentTypes: entity.components?.map((comp) => getComponentInstanceTypeName(comp)) || []
                };
            }
            catch (error) {
                return {
                    error: `获取实体详情失败: ${error instanceof Error ? error.message : String(error)}`,
                    scene: '获取失败',
                    components: [],
                    componentCount: 0,
                    componentTypes: []
                };
            }
        }
        getSceneInfo(scene) {
            let sceneName = '当前场景';
            let sceneType = 'Scene';
            try {
                if (scene.name && typeof scene.name === 'string' && scene.name.trim()) {
                    sceneName = scene.name.trim();
                }
                else if (scene.constructor && scene.constructor.name) {
                    sceneName = scene.constructor.name;
                    sceneType = scene.constructor.name;
                }
                else if (scene._name && typeof scene._name === 'string' && scene._name.trim()) {
                    sceneName = scene._name.trim();
                }
                else {
                    const sceneClassName = Object.getPrototypeOf(scene)?.constructor?.name;
                    if (sceneClassName && sceneClassName !== 'Object') {
                        sceneName = sceneClassName;
                        sceneType = sceneClassName;
                    }
                }
            }
            catch (error) {
                sceneName = '场景名获取失败';
            }
            return { name: sceneName, type: sceneType };
        }
        /**
         * 收集实体数据（包含内存信息）
         * @param scene 场景实例
         */
        collectEntityDataWithMemory(scene) {
            if (!scene) {
                return this.getEmptyEntityDebugData();
            }
            const entityList = scene.entities;
            if (!entityList) {
                return this.getEmptyEntityDebugData();
            }
            let stats;
            try {
                stats = entityList.getStats ? entityList.getStats() : this.calculateFallbackEntityStats(entityList);
            }
            catch (error) {
                return {
                    totalEntities: 0,
                    activeEntities: 0,
                    pendingAdd: 0,
                    pendingRemove: 0,
                    entitiesPerArchetype: [],
                    topEntitiesByComponents: [],
                    entityHierarchy: [],
                    entityDetailsMap: {}
                };
            }
            const archetypeData = this.collectArchetypeDataWithMemory(scene);
            return {
                totalEntities: stats.totalEntities,
                activeEntities: stats.activeEntities,
                pendingAdd: stats.pendingAdd || 0,
                pendingRemove: stats.pendingRemove || 0,
                entitiesPerArchetype: archetypeData.distribution,
                topEntitiesByComponents: archetypeData.topEntities,
                entityHierarchy: this.buildEntityHierarchyTree(entityList),
                entityDetailsMap: this.buildEntityDetailsMap(entityList, scene)
            };
        }
        collectArchetypeData(scene) {
            if (scene && scene.archetypeSystem && typeof scene.archetypeSystem.getAllArchetypes === 'function') {
                return this.extractArchetypeStatistics(scene.archetypeSystem);
            }
            const entityContainer = { entities: scene.entities?.buffer || [] };
            return {
                distribution: this.getArchetypeDistributionFast(entityContainer),
                topEntities: this.getTopEntitiesByComponentsFast(entityContainer)
            };
        }
        getArchetypeDistributionFast(entityContainer) {
            const distribution = new Map();
            if (entityContainer && entityContainer.entities) {
                entityContainer.entities.forEach((entity) => {
                    const componentTypes = entity.components?.map((comp) => getComponentInstanceTypeName(comp)) || [];
                    const signature = componentTypes.length > 0 ? componentTypes.sort().join(', ') : '无组件';
                    const existing = distribution.get(signature);
                    if (existing) {
                        existing.count++;
                    }
                    else {
                        distribution.set(signature, { count: 1, componentTypes });
                    }
                });
            }
            return Array.from(distribution.entries())
                .map(([signature, data]) => ({
                signature,
                count: data.count,
                memory: 0
            }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20);
        }
        getTopEntitiesByComponentsFast(entityContainer) {
            if (!entityContainer || !entityContainer.entities) {
                return [];
            }
            return entityContainer.entities
                .map((entity) => ({
                id: entity.id.toString(),
                name: entity.name || `Entity_${entity.id}`,
                componentCount: entity.components?.length || 0,
                memory: 0
            }))
                .sort((a, b) => b.componentCount - a.componentCount);
        }
        collectArchetypeDataWithMemory(scene) {
            if (scene && scene.archetypeSystem && typeof scene.archetypeSystem.getAllArchetypes === 'function') {
                return this.extractArchetypeStatisticsWithMemory(scene.archetypeSystem);
            }
            const entityContainer = { entities: scene.entities?.buffer || [] };
            return {
                distribution: this.getArchetypeDistributionWithMemory(entityContainer),
                topEntities: this.getTopEntitiesByComponentsWithMemory(entityContainer)
            };
        }
        extractArchetypeStatistics(archetypeSystem) {
            const archetypes = archetypeSystem.getAllArchetypes();
            const distribution = [];
            const topEntities = [];
            archetypes.forEach((archetype) => {
                const signature = archetype.componentTypes?.map((type) => type.name).join(',') || 'Unknown';
                const entityCount = archetype.entities?.length || 0;
                distribution.push({
                    signature,
                    count: entityCount,
                    memory: 0
                });
                if (archetype.entities) {
                    archetype.entities.forEach((entity) => {
                        topEntities.push({
                            id: entity.id.toString(),
                            name: entity.name || `Entity_${entity.id}`,
                            componentCount: entity.components?.length || 0,
                            memory: 0
                        });
                    });
                }
            });
            distribution.sort((a, b) => b.count - a.count);
            topEntities.sort((a, b) => b.componentCount - a.componentCount);
            return { distribution, topEntities };
        }
        extractArchetypeStatisticsWithMemory(archetypeSystem) {
            const archetypes = archetypeSystem.getAllArchetypes();
            const distribution = [];
            const topEntities = [];
            archetypes.forEach((archetype) => {
                const signature = archetype.componentTypes?.map((type) => type.name).join(',') || 'Unknown';
                const entityCount = archetype.entities?.length || 0;
                let actualMemory = 0;
                if (archetype.entities && archetype.entities.length > 0) {
                    const sampleSize = Math.min(5, archetype.entities.length);
                    let sampleMemory = 0;
                    for (let i = 0; i < sampleSize; i++) {
                        sampleMemory += this.estimateEntityMemoryUsage(archetype.entities[i]);
                    }
                    actualMemory = (sampleMemory / sampleSize) * entityCount;
                }
                distribution.push({
                    signature,
                    count: entityCount,
                    memory: actualMemory
                });
                if (archetype.entities) {
                    archetype.entities.forEach((entity) => {
                        topEntities.push({
                            id: entity.id.toString(),
                            name: entity.name || `Entity_${entity.id}`,
                            componentCount: entity.components?.length || 0,
                            memory: this.estimateEntityMemoryUsage(entity)
                        });
                    });
                }
            });
            distribution.sort((a, b) => b.count - a.count);
            topEntities.sort((a, b) => b.componentCount - a.componentCount);
            return { distribution, topEntities };
        }
        getArchetypeDistributionWithMemory(entityContainer) {
            const distribution = new Map();
            if (entityContainer && entityContainer.entities) {
                entityContainer.entities.forEach((entity) => {
                    const componentTypes = entity.components?.map((comp) => getComponentInstanceTypeName(comp)) || [];
                    const signature = componentTypes.length > 0 ? componentTypes.sort().join(', ') : '无组件';
                    const existing = distribution.get(signature);
                    let memory = this.estimateEntityMemoryUsage(entity);
                    if (isNaN(memory) || memory < 0) {
                        memory = 0;
                    }
                    if (existing) {
                        existing.count++;
                        existing.memory += memory;
                    }
                    else {
                        distribution.set(signature, { count: 1, memory, componentTypes });
                    }
                });
            }
            return Array.from(distribution.entries())
                .map(([signature, data]) => ({
                signature,
                count: data.count,
                memory: isNaN(data.memory) ? 0 : data.memory
            }))
                .sort((a, b) => b.count - a.count);
        }
        getTopEntitiesByComponentsWithMemory(entityContainer) {
            if (!entityContainer || !entityContainer.entities) {
                return [];
            }
            return entityContainer.entities
                .map((entity) => ({
                id: entity.id.toString(),
                name: entity.name || `Entity_${entity.id}`,
                componentCount: entity.components?.length || 0,
                memory: this.estimateEntityMemoryUsage(entity)
            }))
                .sort((a, b) => b.componentCount - a.componentCount);
        }
        getEmptyEntityDebugData() {
            return {
                totalEntities: 0,
                activeEntities: 0,
                pendingAdd: 0,
                pendingRemove: 0,
                entitiesPerArchetype: [],
                topEntitiesByComponents: [],
                entityHierarchy: [],
                entityDetailsMap: {}
            };
        }
        calculateFallbackEntityStats(entityList) {
            const allEntities = entityList.buffer || [];
            const activeEntities = allEntities.filter((entity) => entity.enabled && !entity.isDestroyed);
            return {
                totalEntities: allEntities.length,
                activeEntities: activeEntities.length,
                pendingAdd: 0,
                pendingRemove: 0,
                averageComponentsPerEntity: activeEntities.length > 0
                    ? allEntities.reduce((sum, e) => sum + (e.components?.length || 0), 0) /
                        activeEntities.length
                    : 0
            };
        }
        estimateEntityMemoryUsage(entity) {
            try {
                let totalSize = 0;
                const entitySize = this.calculateObjectSize(entity, ['components', 'children', 'parent']);
                if (!isNaN(entitySize) && entitySize > 0) {
                    totalSize += entitySize;
                }
                if (entity.components && Array.isArray(entity.components)) {
                    entity.components.forEach((component) => {
                        const componentSize = this.calculateObjectSize(component, ['entity']);
                        if (!isNaN(componentSize) && componentSize > 0) {
                            totalSize += componentSize;
                        }
                    });
                }
                return isNaN(totalSize) || totalSize < 0 ? 0 : totalSize;
            }
            catch (error) {
                return 0;
            }
        }
        calculateObjectSize(obj, excludeKeys = []) {
            if (!obj || typeof obj !== 'object')
                return 0;
            const visited = new WeakSet();
            const maxDepth = 2;
            const calculate = (item, depth = 0) => {
                if (!item || typeof item !== 'object' || depth >= maxDepth) {
                    return 0;
                }
                if (visited.has(item))
                    return 0;
                visited.add(item);
                let itemSize = 32;
                try {
                    const keys = Object.keys(item);
                    const maxKeys = Math.min(keys.length, 20);
                    for (let i = 0; i < maxKeys; i++) {
                        const key = keys[i];
                        if (!key ||
                            excludeKeys.includes(key) ||
                            key === 'constructor' ||
                            key === '__proto__' ||
                            key.startsWith('_cc_') ||
                            key.startsWith('__')) {
                            continue;
                        }
                        const value = item[key];
                        itemSize += key.length * 2;
                        if (typeof value === 'string') {
                            itemSize += Math.min(value.length * 2, 200);
                        }
                        else if (typeof value === 'number') {
                            itemSize += 8;
                        }
                        else if (typeof value === 'boolean') {
                            itemSize += 4;
                        }
                        else if (Array.isArray(value)) {
                            itemSize += 40 + Math.min(value.length * 8, 160);
                        }
                        else if (typeof value === 'object' && value !== null) {
                            itemSize += calculate(value, depth + 1);
                        }
                    }
                }
                catch (error) {
                    return 64;
                }
                return itemSize;
            };
            try {
                const size = calculate(obj);
                return Math.max(size, 32);
            }
            catch (error) {
                return 64;
            }
        }
        buildEntityHierarchyTree(entityList) {
            if (!entityList?.buffer)
                return [];
            const rootEntities = [];
            entityList.buffer.forEach((entity) => {
                if (!entity.parent) {
                    const hierarchyNode = this.buildEntityHierarchyNode(entity);
                    rootEntities.push(hierarchyNode);
                }
            });
            // 按实体名称排序，提供一致的显示顺序
            rootEntities.sort((nodeA, nodeB) => {
                if (nodeA.name < nodeB.name)
                    return -1;
                if (nodeA.name > nodeB.name)
                    return 1;
                return nodeA.id - nodeB.id;
            });
            return rootEntities;
        }
        /**
         * 构建实体层次结构节点
         */
        buildEntityHierarchyNode(entity) {
            let node = {
                id: entity.id,
                name: entity.name || `Entity_${entity.id}`,
                active: entity.active !== false,
                enabled: entity.enabled !== false,
                activeInHierarchy: entity.activeInHierarchy !== false,
                componentCount: entity.components.length,
                componentTypes: entity.components.map((component) => getComponentInstanceTypeName(component)),
                parentId: entity.parent?.id || null,
                children: [],
                depth: entity.getDepth ? entity.getDepth() : 0,
                tag: entity.tag || 0,
                updateOrder: entity.updateOrder || 0
            };
            // 递归构建子实体节点
            if (entity.children && entity.children.length > 0) {
                node.children = entity.children.map((child) => this.buildEntityHierarchyNode(child));
            }
            // 优先使用Entity的getDebugInfo方法
            if (typeof entity.getDebugInfo === 'function') {
                const debugInfo = entity.getDebugInfo();
                node = {
                    ...node,
                    ...debugInfo
                };
            }
            // 收集所有组件详细属性信息
            if (entity.components && entity.components.length > 0) {
                node.componentDetails = this.extractComponentDetails(entity.components);
            }
            return node;
        }
        /**
         * 构建实体详情映射
         */
        buildEntityDetailsMap(entityList, scene) {
            if (!entityList?.buffer)
                return {};
            const entityDetailsMap = {};
            const entities = entityList.buffer;
            const batchSize = 100;
            for (let i = 0; i < entities.length; i += batchSize) {
                const batch = entities.slice(i, i + batchSize);
                batch.forEach((entity) => {
                    const baseDebugInfo = entity.getDebugInfo
                        ? entity.getDebugInfo()
                        : this.buildFallbackEntityInfo(entity, scene);
                    const componentCacheStats = entity.getComponentCacheStats
                        ? entity.getComponentCacheStats()
                        : null;
                    const componentDetails = this.extractComponentDetails(entity.components);
                    entityDetailsMap[entity.id] = {
                        ...baseDebugInfo,
                        parentName: entity.parent?.name || null,
                        components: componentDetails,
                        componentTypes: baseDebugInfo.componentTypes || componentDetails.map((comp) => comp.typeName),
                        cachePerformance: componentCacheStats
                            ? {
                                hitRate: componentCacheStats.cacheStats.hitRate,
                                size: componentCacheStats.cacheStats.size,
                                maxSize: componentCacheStats.cacheStats.maxSize
                            }
                            : null
                    };
                });
            }
            return entityDetailsMap;
        }
        /**
         * 构建实体基础信息
         */
        buildFallbackEntityInfo(entity, scene) {
            const sceneInfo = this.getSceneInfo(scene);
            return {
                name: entity.name || `Entity_${entity.id}`,
                id: entity.id,
                enabled: entity.enabled !== false,
                active: entity.active !== false,
                activeInHierarchy: entity.activeInHierarchy !== false,
                destroyed: entity.isDestroyed || false,
                scene: sceneInfo.name,
                sceneName: sceneInfo.name,
                sceneType: sceneInfo.type,
                componentCount: entity.components.length,
                componentTypes: entity.components.map((component) => getComponentInstanceTypeName(component)),
                componentMask: entity.componentMask?.toString() || '0',
                parentId: entity.parent?.id || null,
                childCount: entity.children?.length || 0,
                childIds: entity.children.map((child) => child.id) || [],
                depth: entity.getDepth ? entity.getDepth() : 0,
                tag: entity.tag || 0,
                updateOrder: entity.updateOrder || 0
            };
        }
        /**
         * 提取组件详细信息
         */
        extractComponentDetails(components) {
            return components.map((component) => {
                const typeName = getComponentInstanceTypeName(component);
                const properties = {};
                try {
                    const propertyKeys = Object.keys(component);
                    propertyKeys.forEach((propertyKey) => {
                        if (!propertyKey.startsWith('_') && propertyKey !== 'entity' && propertyKey !== 'constructor') {
                            const propertyValue = component[propertyKey];
                            if (propertyValue !== undefined && propertyValue !== null) {
                                properties[propertyKey] = this.formatPropertyValue(propertyValue);
                            }
                        }
                    });
                    // 如果没有找到任何属性，添加一些调试信息
                    if (Object.keys(properties).length === 0) {
                        properties['_info'] = '该组件没有公开属性';
                        properties['_componentId'] = getComponentInstanceTypeName(component);
                    }
                }
                catch (error) {
                    properties['_error'] = '属性提取失败';
                    properties['_componentId'] = getComponentInstanceTypeName(component);
                }
                return {
                    typeName: typeName,
                    properties: properties
                };
            });
        }
        /**
         * 获取组件的完整属性信息（仅在需要时调用）
         * @param entityId 实体ID
         * @param componentIndex 组件索引
         * @param scene 场景实例
         */
        getComponentProperties(entityId, componentIndex, scene) {
            try {
                if (!scene)
                    return {};
                const entityList = scene.entities;
                if (!entityList?.buffer)
                    return {};
                const entity = entityList.buffer.find((e) => e.id === entityId);
                if (!entity || componentIndex >= entity.components.length)
                    return {};
                const component = entity.components[componentIndex];
                const properties = {};
                const propertyKeys = Object.keys(component);
                propertyKeys.forEach((propertyKey) => {
                    if (!propertyKey.startsWith('_') && propertyKey !== 'entity') {
                        const propertyValue = component[propertyKey];
                        if (propertyValue !== undefined && propertyValue !== null) {
                            properties[propertyKey] = this.formatPropertyValue(propertyValue);
                        }
                    }
                });
                return properties;
            }
            catch (error) {
                return { _error: '属性提取失败' };
            }
        }
        /**
         * 格式化属性值
         */
        formatPropertyValue(value, depth = 0) {
            if (value === null || value === undefined) {
                return value;
            }
            if (typeof value !== 'object') {
                if (typeof value === 'string' && value.length > 200) {
                    return `[长字符串: ${value.length}字符] ${value.substring(0, 100)}...`;
                }
                return value;
            }
            if (depth === 0) {
                return this.formatObjectFirstLevel(value);
            }
            else {
                return this.createLazyLoadPlaceholder(value);
            }
        }
        /**
         * 格式化对象第一层
         */
        formatObjectFirstLevel(obj) {
            try {
                if (Array.isArray(obj)) {
                    if (obj.length === 0)
                        return [];
                    if (obj.length > 10) {
                        const sample = obj.slice(0, 3).map((item) => this.formatPropertyValue(item, 1));
                        return {
                            _isLazyArray: true,
                            _arrayLength: obj.length,
                            _sample: sample,
                            _summary: `数组[${obj.length}个元素]`
                        };
                    }
                    return obj.map((item) => this.formatPropertyValue(item, 1));
                }
                const keys = Object.keys(obj);
                if (keys.length === 0)
                    return {};
                const result = {};
                let processedCount = 0;
                const maxProperties = 15;
                for (const key of keys) {
                    if (processedCount >= maxProperties) {
                        result._hasMoreProperties = true;
                        result._totalProperties = keys.length;
                        result._hiddenCount = keys.length - processedCount;
                        break;
                    }
                    if (key.startsWith('_') || key.startsWith('$') || typeof obj[key] === 'function') {
                        continue;
                    }
                    try {
                        const value = obj[key];
                        if (value !== null && value !== undefined) {
                            result[key] = this.formatPropertyValue(value, 1);
                            processedCount++;
                        }
                    }
                    catch (error) {
                        result[key] = `[访问失败: ${error instanceof Error ? error.message : String(error)}]`;
                        processedCount++;
                    }
                }
                return result;
            }
            catch (error) {
                return `[对象解析失败: ${error instanceof Error ? error.message : String(error)}]`;
            }
        }
        /**
         * 创建懒加载占位符
         */
        createLazyLoadPlaceholder(obj) {
            try {
                const typeName = obj.constructor?.name || 'Object';
                const summary = this.getObjectSummary(obj, typeName);
                return {
                    _isLazyObject: true,
                    _typeName: typeName,
                    _summary: summary,
                    _objectId: this.generateObjectId(obj)
                };
            }
            catch (error) {
                return {
                    _isLazyObject: true,
                    _typeName: 'Unknown',
                    _summary: `无法分析的对象: ${error instanceof Error ? error.message : String(error)}`,
                    _objectId: Math.random().toString(36).substr(2, 9)
                };
            }
        }
        /**
         * 获取对象摘要信息
         */
        getObjectSummary(obj, typeName) {
            try {
                if (typeName.toLowerCase().includes('vec') || typeName.toLowerCase().includes('vector')) {
                    if (obj.x !== undefined && obj.y !== undefined) {
                        const z = obj.z !== undefined ? obj.z : '';
                        return `${typeName}(${obj.x}, ${obj.y}${z ? ', ' + z : ''})`;
                    }
                }
                if (typeName.toLowerCase().includes('color')) {
                    if (obj.r !== undefined && obj.g !== undefined && obj.b !== undefined) {
                        const a = obj.a !== undefined ? obj.a : 1;
                        return `${typeName}(${obj.r}, ${obj.g}, ${obj.b}, ${a})`;
                    }
                }
                if (typeName.toLowerCase().includes('node')) {
                    const name = obj.name || obj._name || '未命名';
                    return `${typeName}: ${name}`;
                }
                if (typeName.toLowerCase().includes('component')) {
                    const nodeName = obj.node?.name || obj.node?._name || '';
                    return `${typeName}${nodeName ? ` on ${nodeName}` : ''}`;
                }
                const keys = Object.keys(obj);
                if (keys.length === 0) {
                    return `${typeName} (空对象)`;
                }
                return `${typeName} (${keys.length}个属性)`;
            }
            catch (error) {
                return `${typeName} (无法分析)`;
            }
        }
        /**
         * 生成对象ID
         */
        generateObjectId(obj) {
            try {
                if (obj.id !== undefined)
                    return `obj_${obj.id}`;
                if (obj._id !== undefined)
                    return `obj_${obj._id}`;
                if (obj.uuid !== undefined)
                    return `obj_${obj.uuid}`;
                if (obj._uuid !== undefined)
                    return `obj_${obj._uuid}`;
                return `obj_${Math.random().toString(36).substr(2, 9)}`;
            }
            catch {
                return `obj_${Math.random().toString(36).substr(2, 9)}`;
            }
        }
        /**
         * 展开懒加载对象（供调试面板调用）
         * @param entityId 实体ID
         * @param componentIndex 组件索引
         * @param propertyPath 属性路径
         * @param scene 场景实例
         */
        expandLazyObject(entityId, componentIndex, propertyPath, scene) {
            try {
                if (!scene)
                    return null;
                const entityList = scene.entities;
                if (!entityList?.buffer)
                    return null;
                // 找到对应的实体
                const entity = entityList.buffer.find((e) => e.id === entityId);
                if (!entity)
                    return null;
                // 找到对应的组件
                if (componentIndex >= entity.components.length)
                    return null;
                const component = entity.components[componentIndex];
                // 根据属性路径找到对象
                const targetObject = this.getObjectByPath(component, propertyPath);
                if (!targetObject)
                    return null;
                // 展开这个对象的第一层属性
                return this.formatObjectFirstLevel(targetObject);
            }
            catch (error) {
                return {
                    error: `展开失败: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }
        /**
         * 根据路径获取对象
         */
        getObjectByPath(root, path) {
            if (!path)
                return root;
            const parts = path.split('.');
            let current = root;
            for (const part of parts) {
                if (current === null || current === undefined)
                    return null;
                // 处理数组索引
                if (part.includes('[') && part.includes(']')) {
                    const arrayName = part.substring(0, part.indexOf('['));
                    const index = parseInt(part.substring(part.indexOf('[') + 1, part.indexOf(']')));
                    if (arrayName) {
                        current = current[arrayName];
                    }
                    if (Array.isArray(current) && index >= 0 && index < current.length) {
                        current = current[index];
                    }
                    else {
                        return null;
                    }
                }
                else {
                    current = current[part];
                }
            }
            return current;
        }
    }

    /**
     * 系统数据收集器
     */
    class SystemDataCollector {
        /**
         * 收集系统数据
         * @param performanceMonitor 性能监视器实例
         * @param scene 场景实例
         */
        collectSystemData(performanceMonitor, scene) {
            if (!scene) {
                return {
                    totalSystems: 0,
                    systemsInfo: []
                };
            }
            const entityProcessors = scene.entityProcessors;
            if (!entityProcessors) {
                return {
                    totalSystems: 0,
                    systemsInfo: []
                };
            }
            const systems = entityProcessors.processors || [];
            // 获取性能监控数据
            let systemStats = new Map();
            let systemData = new Map();
            if (performanceMonitor) {
                try {
                    systemStats = performanceMonitor.getAllSystemStats();
                    systemData = performanceMonitor.getAllSystemData();
                }
                catch (error) {
                    // 忽略错误，使用空的Map
                }
            }
            return {
                totalSystems: systems.length,
                systemsInfo: systems.map((system) => {
                    const systemName = system.systemName || getSystemInstanceTypeName(system);
                    const stats = systemStats.get(systemName);
                    const data = systemData.get(systemName);
                    return {
                        name: systemName,
                        type: getSystemInstanceTypeName(system),
                        entityCount: system.entities?.length || 0,
                        executionTime: stats?.averageTime || data?.executionTime || 0,
                        minExecutionTime: stats?.minTime === Number.MAX_VALUE ? 0 : (stats?.minTime || 0),
                        maxExecutionTime: stats?.maxTime || 0,
                        executionTimeHistory: stats?.recentTimes || [],
                        updateOrder: system.updateOrder || 0,
                        enabled: system.enabled !== false,
                        lastUpdateTime: data?.lastUpdateTime || 0
                    };
                })
            };
        }
    }

    /**
     * 性能数据收集器
     */
    class PerformanceDataCollector {
        constructor() {
            this.frameTimeHistory = [];
            this.maxHistoryLength = 60;
            this.gcCollections = 0;
            this.lastMemoryCheck = 0;
        }
        /**
         * 收集性能数据
         */
        collectPerformanceData(performanceMonitor) {
            const frameTimeSeconds = Time.deltaTime;
            const engineFrameTimeMs = frameTimeSeconds * 1000;
            const currentFps = frameTimeSeconds > 0 ? Math.round(1 / frameTimeSeconds) : 0;
            const ecsPerformanceData = this.getECSPerformanceData(performanceMonitor);
            const ecsExecutionTimeMs = ecsPerformanceData.totalExecutionTime;
            const ecsPercentage = engineFrameTimeMs > 0 ? (ecsExecutionTimeMs / engineFrameTimeMs * 100) : 0;
            let memoryUsage = 0;
            if (performance.memory) {
                memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
            }
            // 更新ECS执行时间历史记录
            this.frameTimeHistory.push(ecsExecutionTimeMs);
            if (this.frameTimeHistory.length > this.maxHistoryLength) {
                this.frameTimeHistory.shift();
            }
            // 计算ECS执行时间统计
            const history = this.frameTimeHistory.filter((t) => t >= 0);
            const averageECSTime = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : ecsExecutionTimeMs;
            const minECSTime = history.length > 0 ? Math.min(...history) : ecsExecutionTimeMs;
            const maxECSTime = history.length > 0 ? Math.max(...history) : ecsExecutionTimeMs;
            return {
                frameTime: ecsExecutionTimeMs,
                engineFrameTime: engineFrameTimeMs,
                ecsPercentage: ecsPercentage,
                memoryUsage: memoryUsage,
                fps: currentFps,
                averageFrameTime: averageECSTime,
                minFrameTime: minECSTime,
                maxFrameTime: maxECSTime,
                frameTimeHistory: [...this.frameTimeHistory],
                systemPerformance: this.getSystemPerformance(performanceMonitor),
                systemBreakdown: ecsPerformanceData.systemBreakdown,
                memoryDetails: this.getMemoryDetails()
            };
        }
        /**
         * 获取ECS框架整体性能数据
         */
        getECSPerformanceData(performanceMonitor) {
            // 检查性能监视器是否存在
            if (!performanceMonitor) {
                return { totalExecutionTime: 0, systemBreakdown: [] };
            }
            if (!performanceMonitor.enabled) {
                // 尝试启用性能监视器
                try {
                    performanceMonitor.enabled = true;
                }
                catch (error) {
                    // 如果无法启用，返回默认值
                }
                return { totalExecutionTime: 0, systemBreakdown: [] };
            }
            try {
                let totalTime = 0;
                const systemBreakdown = [];
                const stats = performanceMonitor.getAllSystemStats();
                if (stats.size === 0) {
                    return { totalExecutionTime: 0, systemBreakdown: [] };
                }
                // 计算各系统的执行时间
                for (const [systemName, stat] of stats.entries()) {
                    // 使用最近的执行时间而不是平均时间，这样更能反映当前状态
                    const systemTime = stat.recentTimes && stat.recentTimes.length > 0 ?
                        stat.recentTimes[stat.recentTimes.length - 1] :
                        (stat.averageTime || 0);
                    totalTime += systemTime;
                    systemBreakdown.push({
                        systemName: systemName,
                        executionTime: systemTime,
                        percentage: 0 // 后面计算
                    });
                }
                // 计算各系统占ECS总时间的百分比
                systemBreakdown.forEach((system) => {
                    system.percentage = totalTime > 0 ? (system.executionTime / totalTime * 100) : 0;
                });
                // 按执行时间排序
                systemBreakdown.sort((a, b) => b.executionTime - a.executionTime);
                return {
                    totalExecutionTime: totalTime,
                    systemBreakdown: systemBreakdown
                };
            }
            catch (error) {
                return { totalExecutionTime: 0, systemBreakdown: [] };
            }
        }
        /**
         * 获取系统性能数据
         */
        getSystemPerformance(performanceMonitor) {
            if (!performanceMonitor) {
                return [];
            }
            try {
                const stats = performanceMonitor.getAllSystemStats();
                const systemData = performanceMonitor.getAllSystemData();
                return Array.from(stats.entries()).map(([systemName, stat]) => {
                    const data = systemData.get(systemName);
                    return {
                        systemName: systemName,
                        averageTime: stat.averageTime || 0,
                        maxTime: stat.maxTime || 0,
                        minTime: stat.minTime === Number.MAX_VALUE ? 0 : (stat.minTime || 0),
                        samples: stat.executionCount || 0,
                        percentage: 0,
                        entityCount: data?.entityCount || 0,
                        lastExecutionTime: data?.executionTime || 0
                    };
                });
            }
            catch (error) {
                return [];
            }
        }
        /**
         * 获取内存详情
         */
        getMemoryDetails() {
            const memoryInfo = {
                entities: 0,
                components: 0,
                systems: 0,
                pooled: 0,
                totalMemory: 0,
                usedMemory: 0,
                freeMemory: 0,
                gcCollections: this.updateGCCount()
            };
            try {
                if (performance.memory) {
                    const perfMemory = performance.memory;
                    memoryInfo.totalMemory = perfMemory.jsHeapSizeLimit || 512 * 1024 * 1024;
                    memoryInfo.usedMemory = perfMemory.usedJSHeapSize || 0;
                    memoryInfo.freeMemory = memoryInfo.totalMemory - memoryInfo.usedMemory;
                    // 检测GC：如果使用的内存突然大幅减少，可能发生了GC
                    if (this.lastMemoryCheck > 0) {
                        const memoryDrop = this.lastMemoryCheck - memoryInfo.usedMemory;
                        if (memoryDrop > 1024 * 1024) { // 内存减少超过1MB
                            this.gcCollections++;
                        }
                    }
                    this.lastMemoryCheck = memoryInfo.usedMemory;
                }
                else {
                    memoryInfo.totalMemory = 512 * 1024 * 1024;
                    memoryInfo.freeMemory = 512 * 1024 * 1024;
                }
            }
            catch (error) {
                return {
                    totalMemory: 0,
                    usedMemory: 0,
                    freeMemory: 0,
                    entityMemory: 0,
                    componentMemory: 0,
                    systemMemory: 0,
                    pooledMemory: 0,
                    gcCollections: this.gcCollections
                };
            }
            return memoryInfo;
        }
        /**
         * 更新GC计数
         */
        updateGCCount() {
            try {
                // 尝试使用PerformanceObserver来检测GC
                if (typeof PerformanceObserver !== 'undefined') {
                    // 这是一个简化的GC检测方法
                    // 实际的GC检测需要更复杂的逻辑
                    return this.gcCollections;
                }
                // 如果有其他GC检测API，可以在这里添加
                if (performance.measureUserAgentSpecificMemory) {
                    // 实验性API，可能不可用
                    return this.gcCollections;
                }
                return this.gcCollections;
            }
            catch (error) {
                return this.gcCollections;
            }
        }
    }

    /**
     * 组件对象池，用于复用组件实例以减少内存分配
     */
    class ComponentPool {
        constructor(createFn, resetFn, maxSize = 1000, minSize = 10) {
            this.pool = [];
            this.stats = {
                totalCreated: 0,
                totalAcquired: 0,
                totalReleased: 0
            };
            this.createFn = createFn;
            if (resetFn) {
                this.resetFn = resetFn;
            }
            this.maxSize = maxSize;
            this.minSize = Math.max(1, minSize);
        }
        /**
         * 获取一个组件实例
         */
        acquire() {
            this.stats.totalAcquired++;
            if (this.pool.length > 0) {
                return this.pool.pop();
            }
            this.stats.totalCreated++;
            return this.createFn();
        }
        /**
         * 释放一个组件实例回池中
         */
        release(component) {
            this.stats.totalReleased++;
            if (this.pool.length >= this.maxSize) {
                return;
            }
            if (this.resetFn) {
                this.resetFn(component);
            }
            this.pool.push(component);
        }
        /**
         * 预填充对象池
         */
        prewarm(count) {
            const targetCount = Math.min(count, this.maxSize);
            for (let i = this.pool.length; i < targetCount; i++) {
                const component = this.createFn();
                if (this.resetFn) {
                    this.resetFn(component);
                }
                this.pool.push(component);
                this.stats.totalCreated++;
            }
        }
        /**
         * 自动收缩池大小
         */
        shrink() {
            while (this.pool.length > this.minSize) {
                this.pool.pop();
            }
        }
        /**
         * 清空对象池
         */
        clear() {
            this.pool.length = 0;
        }
        /**
         * 获取池中可用对象数量
         */
        getAvailableCount() {
            return this.pool.length;
        }
        /**
         * 获取池的最大容量
         */
        getMaxSize() {
            return this.maxSize;
        }
        /**
         * 获取统计信息
         */
        getStats() {
            const hitRate = this.stats.totalAcquired === 0
                ? 0
                : (this.stats.totalAcquired - this.stats.totalCreated) / this.stats.totalAcquired;
            return {
                totalCreated: this.stats.totalCreated,
                totalAcquired: this.stats.totalAcquired,
                totalReleased: this.stats.totalReleased,
                hitRate: hitRate,
                currentSize: this.pool.length,
                maxSize: this.maxSize,
                minSize: this.minSize,
                utilizationRate: this.pool.length / this.maxSize
            };
        }
    }
    /**
     * 全局组件池管理器
     */
    class ComponentPoolManager {
        constructor() {
            this.pools = new Map();
            this.usageTracker = new Map();
            this.autoCleanupInterval = 60000;
            this.lastCleanupTime = 0;
        }
        static getInstance() {
            if (!ComponentPoolManager.instance) {
                ComponentPoolManager.instance = new ComponentPoolManager();
            }
            return ComponentPoolManager.instance;
        }
        /**
         * 注册组件池
         */
        registerPool(componentName, createFn, resetFn, maxSize, minSize) {
            this.pools.set(componentName, new ComponentPool(createFn, resetFn, maxSize, minSize));
            this.usageTracker.set(componentName, {
                createCount: 0,
                releaseCount: 0,
                lastAccessTime: Date.now()
            });
        }
        /**
         * 获取组件实例
         */
        acquireComponent(componentName) {
            const pool = this.pools.get(componentName);
            this.trackUsage(componentName, 'create');
            return pool ? pool.acquire() : null;
        }
        /**
         * 释放组件实例
         */
        releaseComponent(componentName, component) {
            const pool = this.pools.get(componentName);
            this.trackUsage(componentName, 'release');
            if (pool) {
                pool.release(component);
            }
        }
        /**
         * 追踪使用情况
         */
        trackUsage(componentName, action) {
            let tracker = this.usageTracker.get(componentName);
            if (!tracker) {
                tracker = {
                    createCount: 0,
                    releaseCount: 0,
                    lastAccessTime: Date.now()
                };
                this.usageTracker.set(componentName, tracker);
            }
            if (action === 'create') {
                tracker.createCount++;
            }
            else {
                tracker.releaseCount++;
            }
            tracker.lastAccessTime = Date.now();
        }
        /**
         * 自动清理(定期调用)
         */
        update() {
            const now = Date.now();
            if (now - this.lastCleanupTime < this.autoCleanupInterval) {
                return;
            }
            for (const [name, tracker] of this.usageTracker.entries()) {
                const inactive = now - tracker.lastAccessTime > 120000;
                if (inactive) {
                    const pool = this.pools.get(name);
                    if (pool) {
                        pool.shrink();
                    }
                }
            }
            this.lastCleanupTime = now;
        }
        /**
         * 获取热点组件列表
         */
        getHotComponents(threshold = 100) {
            return Array.from(this.usageTracker.entries())
                .filter(([_, tracker]) => tracker.createCount > threshold)
                .map(([name]) => name);
        }
        /**
         * 预热所有池
         */
        prewarmAll(count = 100) {
            for (const pool of this.pools.values()) {
                pool.prewarm(count);
            }
        }
        /**
         * 清空所有池
         */
        clearAll() {
            for (const pool of this.pools.values()) {
                pool.clear();
            }
        }
        /**
         * 重置管理器
         */
        reset() {
            this.pools.clear();
            this.usageTracker.clear();
        }
        /**
         * 获取全局统计信息
         */
        getGlobalStats() {
            const stats = [];
            for (const [name, pool] of this.pools.entries()) {
                stats.push({
                    componentName: name,
                    poolStats: pool.getStats(),
                    usage: this.usageTracker.get(name)
                });
            }
            return stats;
        }
        /**
         * 获取池统计信息
         */
        getPoolStats() {
            const stats = new Map();
            for (const [name, pool] of this.pools) {
                stats.set(name, {
                    available: pool.getAvailableCount(),
                    maxSize: pool.getMaxSize()
                });
            }
            return stats;
        }
        /**
         * 获取池利用率信息
         */
        getPoolUtilization() {
            const utilization = new Map();
            for (const [name, pool] of this.pools) {
                const available = pool.getAvailableCount();
                const maxSize = pool.getMaxSize();
                const used = maxSize - available;
                const utilRate = maxSize > 0 ? (used / maxSize * 100) : 0;
                utilization.set(name, {
                    used: used,
                    total: maxSize,
                    utilization: utilRate
                });
            }
            return utilization;
        }
        /**
         * 获取指定组件的池利用率
         */
        getComponentUtilization(componentName) {
            const pool = this.pools.get(componentName);
            if (!pool)
                return 0;
            const available = pool.getAvailableCount();
            const maxSize = pool.getMaxSize();
            const used = maxSize - available;
            return maxSize > 0 ? (used / maxSize * 100) : 0;
        }
    }

    /**
     * 组件数据收集器
     */
    class ComponentDataCollector {
        /**
         * 收集组件数据（轻量版，不计算实际内存大小）
         * @param scene 场景实例
         */
        collectComponentData(scene) {
            if (!scene) {
                return {
                    componentTypes: 0,
                    componentInstances: 0,
                    componentStats: []
                };
            }
            const entityList = scene.entities;
            if (!entityList?.buffer) {
                return {
                    componentTypes: 0,
                    componentInstances: 0,
                    componentStats: []
                };
            }
            const componentStats = new Map();
            let totalInstances = 0;
            entityList.buffer.forEach((entity) => {
                if (entity.components) {
                    entity.components.forEach((component) => {
                        const typeName = getComponentInstanceTypeName(component);
                        const stats = componentStats.get(typeName) || { count: 0, entities: 0 };
                        stats.count++;
                        totalInstances++;
                        componentStats.set(typeName, stats);
                    });
                }
            });
            // 获取池利用率信息
            const poolUtilizations = new Map();
            const poolSizes = new Map();
            try {
                const poolManager = ComponentPoolManager.getInstance();
                const poolStats = poolManager.getPoolStats();
                const utilizations = poolManager.getPoolUtilization();
                for (const [typeName, stats] of poolStats.entries()) {
                    poolSizes.set(typeName, stats.maxSize);
                }
                for (const [typeName, util] of utilizations.entries()) {
                    poolUtilizations.set(typeName, util.utilization);
                }
            }
            catch (error) {
                // 如果无法获取池信息，使用默认值
            }
            return {
                componentTypes: componentStats.size,
                componentInstances: totalInstances,
                componentStats: Array.from(componentStats.entries()).map(([typeName, stats]) => {
                    const poolSize = poolSizes.get(typeName) || 0;
                    const poolUtilization = poolUtilizations.get(typeName) || 0;
                    // 使用预估的基础内存大小，避免每帧计算
                    const memoryPerInstance = this.getEstimatedComponentSize(typeName, scene);
                    return {
                        typeName,
                        instanceCount: stats.count,
                        memoryPerInstance: memoryPerInstance,
                        totalMemory: stats.count * memoryPerInstance,
                        poolSize: poolSize,
                        poolUtilization: poolUtilization,
                        averagePerEntity: stats.count / entityList.buffer.length
                    };
                })
            };
        }
        /**
         * 获取组件类型的估算内存大小（基于预设值，不进行实际计算）
         */
        getEstimatedComponentSize(typeName, scene) {
            if (ComponentDataCollector.componentSizeCache.has(typeName)) {
                return ComponentDataCollector.componentSizeCache.get(typeName);
            }
            if (!scene)
                return 64;
            const entityList = scene.entities;
            if (!entityList?.buffer)
                return 64;
            let calculatedSize = 64;
            try {
                for (const entity of entityList.buffer) {
                    if (entity.components) {
                        const component = entity.components.find((c) => getComponentInstanceTypeName(c) === typeName);
                        if (component) {
                            calculatedSize = this.calculateQuickObjectSize(component);
                            break;
                        }
                    }
                }
            }
            catch (error) {
                calculatedSize = 64;
            }
            ComponentDataCollector.componentSizeCache.set(typeName, calculatedSize);
            return calculatedSize;
        }
        calculateQuickObjectSize(obj) {
            if (!obj || typeof obj !== 'object')
                return 8;
            let size = 32;
            const visited = new WeakSet();
            const calculate = (item, depth = 0) => {
                if (!item || typeof item !== 'object' || visited.has(item) || depth > 3) {
                    return 0;
                }
                visited.add(item);
                let itemSize = 0;
                try {
                    const keys = Object.keys(item);
                    for (let i = 0; i < Math.min(keys.length, 20); i++) {
                        const key = keys[i];
                        if (!key || key === 'entity' || key === '_entity' || key === 'constructor')
                            continue;
                        const value = item[key];
                        itemSize += key.length * 2;
                        if (typeof value === 'string') {
                            itemSize += Math.min(value.length * 2, 200);
                        }
                        else if (typeof value === 'number') {
                            itemSize += 8;
                        }
                        else if (typeof value === 'boolean') {
                            itemSize += 4;
                        }
                        else if (typeof value === 'object' && value !== null) {
                            itemSize += calculate(value, depth + 1);
                        }
                    }
                }
                catch (error) {
                    return 32;
                }
                return itemSize;
            };
            size += calculate(obj);
            return Math.max(size, 32);
        }
        /**
         * 为内存快照功能提供的详细内存计算
         * 只在用户主动请求内存快照时调用
         * @param typeName 组件类型名称
         * @param scene 场景实例
         */
        calculateDetailedComponentMemory(typeName, scene) {
            if (!scene)
                return this.getEstimatedComponentSize(typeName, scene);
            const entityList = scene.entities;
            if (!entityList?.buffer)
                return this.getEstimatedComponentSize(typeName, scene);
            try {
                // 找到第一个包含此组件的实体，分析组件大小
                for (const entity of entityList.buffer) {
                    if (entity.components) {
                        const component = entity.components.find((c) => getComponentInstanceTypeName(c) === typeName);
                        if (component) {
                            return this.estimateObjectSize(component);
                        }
                    }
                }
            }
            catch (error) {
                // 忽略错误，使用估算值
            }
            return this.getEstimatedComponentSize(typeName, scene);
        }
        /**
         * 估算对象内存大小（仅用于内存快照）
         * 优化版本：减少递归深度，提高性能
         */
        estimateObjectSize(obj, visited = new WeakSet(), depth = 0) {
            if (obj === null || obj === undefined || depth > 10)
                return 0;
            if (visited.has(obj))
                return 0;
            let size = 0;
            const type = typeof obj;
            switch (type) {
                case 'boolean':
                    size = 4;
                    break;
                case 'number':
                    size = 8;
                    break;
                case 'string':
                    size = 24 + Math.min(obj.length * 2, 1000);
                    break;
                case 'object':
                    visited.add(obj);
                    if (Array.isArray(obj)) {
                        size = 40 + (obj.length * 8);
                        const maxElements = Math.min(obj.length, 50);
                        for (let i = 0; i < maxElements; i++) {
                            size += this.estimateObjectSize(obj[i], visited, depth + 1);
                        }
                    }
                    else {
                        size = 32;
                        try {
                            const ownKeys = Object.getOwnPropertyNames(obj);
                            const maxProps = Math.min(ownKeys.length, 30);
                            for (let i = 0; i < maxProps; i++) {
                                const key = ownKeys[i];
                                if (!key)
                                    continue;
                                if (key === 'constructor' ||
                                    key === '__proto__' ||
                                    key === 'entity' ||
                                    key === '_entity' ||
                                    key.startsWith('_cc_') ||
                                    key.startsWith('__')) {
                                    continue;
                                }
                                try {
                                    size += 16 + (key.length * 2);
                                    const value = obj[key];
                                    if (value !== undefined && value !== null) {
                                        size += this.estimateObjectSize(value, visited, depth + 1);
                                    }
                                }
                                catch (error) {
                                    continue;
                                }
                            }
                        }
                        catch (error) {
                            size = 128;
                        }
                    }
                    break;
                default:
                    size = 8;
            }
            return Math.ceil(size / 8) * 8;
        }
        static clearCache() {
            ComponentDataCollector.componentSizeCache.clear();
        }
    }
    ComponentDataCollector.componentSizeCache = new Map();

    /**
     * 场景数据收集器
     */
    class SceneDataCollector {
        constructor() {
            this.sceneStartTime = Date.now();
        }
        /**
         * 收集场景数据
         * @param scene 场景实例
         */
        collectSceneData(scene) {
            if (!scene) {
                return {
                    currentSceneName: 'No Scene',
                    isInitialized: false,
                    sceneRunTime: 0,
                    sceneEntityCount: 0,
                    sceneSystemCount: 0,
                    sceneUptime: 0
                };
            }
            const currentTime = Date.now();
            const runTime = (currentTime - this.sceneStartTime) / 1000;
            const entityList = scene.entities;
            const entityProcessors = scene.entityProcessors;
            return {
                currentSceneName: scene.name || 'Unnamed Scene',
                isInitialized: scene._didSceneBegin || false,
                sceneRunTime: runTime,
                sceneEntityCount: entityList?.buffer?.length || 0,
                sceneSystemCount: entityProcessors?.processors?.length || 0,
                sceneUptime: runTime
            };
        }
        /**
         * 设置场景开始时间
         */
        setSceneStartTime(time) {
            this.sceneStartTime = time;
        }
    }

    /**
     * WebSocket连接管理器
     */
    class WebSocketManager {
        constructor(url, autoReconnect = true) {
            this.isConnected = false;
            this.reconnectAttempts = 0;
            this.maxReconnectAttempts = 5;
            this.url = url;
            this.autoReconnect = autoReconnect;
        }
        /**
         * 设置消息处理回调
         */
        setMessageHandler(handler) {
            this.messageHandler = handler;
        }
        /**
         * 连接WebSocket
         */
        connect() {
            return new Promise((resolve, reject) => {
                try {
                    this.ws = new WebSocket(this.url);
                    this.ws.onopen = (event) => {
                        this.handleOpen(event);
                        resolve();
                    };
                    this.ws.onclose = (event) => {
                        this.handleClose(event);
                    };
                    this.ws.onerror = (error) => {
                        this.handleError(error);
                        reject(error);
                    };
                    this.ws.onmessage = (event) => {
                        this.handleMessage(event);
                    };
                }
                catch (error) {
                    this.handleConnectionFailure(error);
                    reject(error);
                }
            });
        }
        /**
         * 断开连接
         */
        disconnect() {
            if (this.ws) {
                this.autoReconnect = false; // 主动断开时不自动重连
                this.ws.close();
                delete this.ws;
            }
            this.isConnected = false;
        }
        /**
         * 发送数据
         */
        send(data) {
            if (!this.isConnected || !this.ws) {
                return;
            }
            try {
                const message = typeof data === 'string' ? data : JSON.stringify(data);
                this.ws.send(message);
            }
            catch (error) {
            }
        }
        /**
         * 获取连接状态
         */
        getConnectionStatus() {
            return this.isConnected;
        }
        /**
         * 设置最大重连次数
         */
        setMaxReconnectAttempts(attempts) {
            this.maxReconnectAttempts = attempts;
        }
        /**
         * 计划重连
         */
        scheduleReconnect() {
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
            }
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            this.reconnectAttempts++;
            this.reconnectTimer = setTimeout(() => {
                this.connect().catch((_error) => {
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                });
            }, delay);
        }
        /**
         * 处理接收到的消息
         */
        handleMessage(event) {
            try {
                const message = JSON.parse(event.data);
                // 调用消息处理回调
                if (this.messageHandler) {
                    this.messageHandler(message);
                }
            }
            catch (error) {
            }
        }
        handleOpen(event) {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            if (this.onOpen) {
                this.onOpen(event);
            }
        }
        handleClose(event) {
            this.isConnected = false;
            if (this.onClose) {
                this.onClose(event);
            }
            if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.scheduleReconnect();
            }
        }
        handleError(error) {
            if (this.onError) {
                this.onError(error);
            }
        }
        handleConnectionFailure(error) {
            if (this.onError) {
                this.onError(error);
            }
        }
    }

    /**
     * 位枚举
     */
    var SegmentPart;
    (function (SegmentPart) {
        SegmentPart[SegmentPart["LOW"] = 0] = "LOW";
        SegmentPart[SegmentPart["HIGH"] = 1] = "HIGH";
    })(SegmentPart || (SegmentPart = {}));
    class BitMask64Utils {
        /**
         * 根据位索引创建64位掩码
         * @param bitIndex 位索引，范围 [0, 63]
         * @returns 包含指定位设置为1的掩码
         * @throws 当位索引超出范围时抛出错误
         */
        static create(bitIndex) {
            if (bitIndex < 0) {
                throw new Error(`Bit index ${bitIndex} out of range [0, ∞)`);
            }
            const mask = { base: [0, 0] };
            BitMask64Utils.setBit(mask, bitIndex);
            return mask;
        }
        /**
         * 从32位数字创建64位掩码
         * @param value 32位数字值
         * @returns 低32位为输入值、高32位为0的掩码
         */
        static fromNumber(value) {
            return { base: [value >>> 0, 0] };
        }
        /**
         * 检查掩码是否包含任意指定的位
         * @param mask 要检查的掩码
         * @param bits 指定的位模式
         * @returns 如果掩码包含bits中的任意位则返回true
         */
        static hasAny(mask, bits) {
            const bitsBase = bits.base;
            const maskBase = mask.base;
            const bitsSegments = bits.segments;
            const maskSegments = mask.segments;
            const baseHasAny = (maskBase[SegmentPart.LOW] & bitsBase[SegmentPart.LOW]) !== 0 || (maskBase[SegmentPart.HIGH] & bitsBase[SegmentPart.HIGH]) !== 0;
            // 基础区段就包含指定的位,或任意一个参数不含扩展区段，直接短路
            if (baseHasAny || !bitsSegments || !maskSegments)
                return baseHasAny;
            // 额外检查扩展区域是否包含指定的位 - 如果bitsSegments[index]不存在，会被转为NaN，NaN的位运算始终返回0
            return maskSegments.some((seg, index) => {
                const bitsSeg = bitsSegments[index];
                return bitsSeg && ((seg[SegmentPart.LOW] & bitsSeg[SegmentPart.LOW]) !== 0 || (seg[SegmentPart.HIGH] & bitsSeg[SegmentPart.HIGH]) !== 0);
            });
        }
        /**
         * 检查掩码是否包含所有指定的位
         * @param mask 要检查的掩码
         * @param bits 指定的位模式
         * @returns 如果掩码包含bits中的所有位则返回true
         */
        static hasAll(mask, bits) {
            const maskBase = mask.base;
            const bitsBase = bits.base;
            const maskSegments = mask.segments;
            const bitsSegments = bits.segments;
            const baseHasAll = (maskBase[SegmentPart.LOW] & bitsBase[SegmentPart.LOW]) === bitsBase[SegmentPart.LOW] && (maskBase[SegmentPart.HIGH] & bitsBase[SegmentPart.HIGH]) === bitsBase[SegmentPart.HIGH];
            // 基础区域就不包含指定的位，或bits没有扩展区段，直接短路。
            if (!baseHasAll || !bitsSegments)
                return baseHasAll;
            // 扩展区段的hasAll匹配逻辑
            const maskSegmentsLength = maskSegments?.length ?? 0;
            // 对mask/bits中都存在的区段，进行hasAll判断
            if (maskSegments) {
                for (let i = 0; i < Math.min(maskSegmentsLength, bitsSegments.length); i++) {
                    const maskSeg = maskSegments[i];
                    const bitsSeg = bitsSegments[i];
                    if ((maskSeg[SegmentPart.LOW] & bitsSeg[SegmentPart.LOW]) !== bitsSeg[SegmentPart.LOW] || (maskSeg[SegmentPart.HIGH] & bitsSeg[SegmentPart.HIGH]) !== bitsSeg[SegmentPart.HIGH]) {
                        // 存在不匹配的位，直接短路
                        return false;
                    }
                }
            }
            // 对mask中不存在，但bits中存在的区段，进行isZero判断
            for (let i = maskSegmentsLength; i < bitsSegments.length; i++) {
                const bitsSeg = bitsSegments[i];
                if (bitsSeg[SegmentPart.LOW] !== 0 || bitsSeg[SegmentPart.HIGH] !== 0) {
                    // 存在不为0的区段，直接短路
                    return false;
                }
            }
            return true;
        }
        /**
         * 检查掩码是否不包含任何指定的位
         * @param mask 要检查的掩码
         * @param bits 指定的位模式
         * @returns 如果掩码不包含bits中的任何位则返回true
         */
        static hasNone(mask, bits) {
            const maskBase = mask.base;
            const bitsBase = bits.base;
            const maskSegments = mask.segments;
            const bitsSegments = bits.segments;
            const baseHasNone = (maskBase[SegmentPart.LOW] & bitsBase[SegmentPart.LOW]) === 0 && (maskBase[SegmentPart.HIGH] & bitsBase[SegmentPart.HIGH]) === 0;
            //不含扩展区域，或基础区域就包含指定的位，或bits不含拓展区段，直接短路。
            if (!maskSegments || !baseHasNone || !bitsSegments)
                return baseHasNone;
            // 额外检查扩展区域是否都包含指定的位 - 此时bitsSegments存在,如果bitsSegments[index]不存在，会被转为NaN，NaN的位运算始终返回0
            return maskSegments.every((seg, index) => {
                const bitsSeg = bitsSegments[index];
                if (!bitsSeg)
                    return true;
                return (seg[SegmentPart.LOW] & bitsSeg[SegmentPart.LOW]) === 0 && (seg[SegmentPart.HIGH] & bitsSeg[SegmentPart.HIGH]) === 0;
            });
        }
        /**
         * 检查掩码是否为零
         * @param mask 要检查的掩码
         * @returns 如果掩码所有位都为0则返回true
         */
        static isZero(mask) {
            const baseIsZero = mask.base[SegmentPart.LOW] === 0 && mask.base[SegmentPart.HIGH] === 0;
            if (!mask.segments || !baseIsZero) {
                // 不含扩展区域，或基础区域值就不为0，直接短路
                return baseIsZero;
            }
            // 额外检查扩展区域是否都为0
            return mask.segments.every((seg) => seg[SegmentPart.LOW] === 0 && seg[SegmentPart.HIGH] === 0);
        }
        /**
         * 检查两个掩码是否相等
         * @param a 第一个掩码
         * @param b 第二个掩码
         * @returns 如果两个掩码完全相等则返回true
         */
        static equals(a, b) {
            const baseEquals = a.base[SegmentPart.LOW] === b.base[SegmentPart.LOW] && a.base[SegmentPart.HIGH] === b.base[SegmentPart.HIGH];
            // base不相等，或ab都没有扩展区域位，直接返回base比较结果
            if (!baseEquals || (!a.segments && !b.segments))
                return baseEquals;
            // 不能假设a，b的segments都存在或长度相同.
            const aSegments = a.segments ?? [];
            const bSegments = b.segments ?? [];
            for (let i = 0; i < Math.max(aSegments.length, bSegments.length); i++) {
                const aSeg = aSegments[i]; // 可能为undefined
                const bSeg = bSegments[i]; // 可能为undefined
                if (aSeg && !bSeg) {
                    //bSeg不存在，则必须要求aSeg全为0
                    if (aSeg[SegmentPart.LOW] !== 0 || aSeg[SegmentPart.HIGH] !== 0)
                        return false;
                }
                else if (!aSeg && bSeg) {
                    //aSeg不存在，则必须要求bSeg全为0
                    if (bSeg[SegmentPart.LOW] !== 0 || bSeg[SegmentPart.HIGH] !== 0)
                        return false;
                }
                else if (aSeg && bSeg) {
                    //理想状态：aSeg/bSeg都存在
                    if (aSeg[SegmentPart.LOW] !== bSeg[SegmentPart.LOW] || aSeg[SegmentPart.HIGH] !== bSeg[SegmentPart.HIGH])
                        return false;
                }
            }
            return true;
        }
        /**
         * 设置掩码中指定位为1，必要时自动扩展
         * @param mask 要修改的掩码（原地修改）
         * @param bitIndex 位索引，不小于零
         * @throws 当位索引超出范围时抛出错误
         */
        static setBit(mask, bitIndex) {
            if (bitIndex < 0) {
                throw new Error(`Bit index ${bitIndex} out of range [0, 63]`);
            }
            const targetSeg = BitMask64Utils.getSegmentByBitIndex(mask, bitIndex);
            const mod = bitIndex & 63; // bitIndex % 64 优化方案
            if (mod < 32) {
                targetSeg[SegmentPart.LOW] |= (1 << mod);
            }
            else {
                targetSeg[SegmentPart.HIGH] |= (1 << (mod - 32));
            }
        }
        /**
         * 获取掩码中指定位，如果位超出当前掩码的区段长度，则直接返回0
         * @param mask 掩码
         * @param bitIndex 位索引，不小于零
         */
        static getBit(mask, bitIndex) {
            if (bitIndex < 0) {
                return false;
            }
            const targetSeg = BitMask64Utils.getSegmentByBitIndex(mask, bitIndex, false);
            if (!targetSeg)
                return false;
            const mod = bitIndex & 63; // bitIndex % 64 优化方案
            if (mod < 32) {
                return (targetSeg[SegmentPart.LOW] & (1 << mod)) !== 0;
            }
            else {
                return (targetSeg[SegmentPart.HIGH] & (1 << (mod - 32))) !== 0;
            }
        }
        /**
         * 清除掩码中指定位为0，如果位超出当前掩码的区段长度，则什么也不做
         * @param mask 要修改的掩码（原地修改）
         * @param bitIndex 位索引，不小于0
         */
        static clearBit(mask, bitIndex) {
            if (bitIndex < 0) {
                throw new Error(`Bit index ${bitIndex} out of range [0, 63]`);
            }
            const targetSeg = BitMask64Utils.getSegmentByBitIndex(mask, bitIndex, false);
            if (!targetSeg)
                return;
            const mod = bitIndex & 63; // bitIndex % 64 优化方案
            if (mod < 32) {
                targetSeg[SegmentPart.LOW] &= ~(1 << mod);
            }
            else {
                targetSeg[SegmentPart.HIGH] &= ~(1 << (mod - 32));
            }
        }
        /**
         * 对目标掩码执行按位或操作
         * @param target 目标掩码（原地修改）
         * @param other 用于按位或的掩码
         */
        static orInPlace(target, other) {
            target.base[SegmentPart.LOW] |= other.base[SegmentPart.LOW];
            target.base[SegmentPart.HIGH] |= other.base[SegmentPart.HIGH];
            // 处理扩展段
            const otherSegments = other.segments;
            if (otherSegments && otherSegments.length > 0) {
                if (!target.segments) {
                    target.segments = [];
                }
                const targetSegments = target.segments;
                // 确保 target 有足够的段
                while (targetSegments.length < otherSegments.length) {
                    targetSegments.push([0, 0]);
                }
                // 对每个段执行或操作
                for (let i = 0; i < otherSegments.length; i++) {
                    const targetSeg = targetSegments[i];
                    const otherSeg = otherSegments[i];
                    targetSeg[SegmentPart.LOW] |= otherSeg[SegmentPart.LOW];
                    targetSeg[SegmentPart.HIGH] |= otherSeg[SegmentPart.HIGH];
                }
            }
        }
        /**
         * 对目标掩码执行按位与操作
         * @param target 目标掩码（原地修改）
         * @param other 用于按位与的掩码
         */
        static andInPlace(target, other) {
            target.base[SegmentPart.LOW] &= other.base[SegmentPart.LOW];
            target.base[SegmentPart.HIGH] &= other.base[SegmentPart.HIGH];
            // 处理扩展段
            const otherSegments = other.segments;
            if (otherSegments && otherSegments.length > 0) {
                if (!target.segments) {
                    target.segments = [];
                }
                const targetSegments = target.segments;
                // 确保 target 有足够的段
                while (targetSegments.length < otherSegments.length) {
                    targetSegments.push([0, 0]);
                }
                // 对每个段执行与操作
                for (let i = 0; i < otherSegments.length; i++) {
                    const targetSeg = targetSegments[i];
                    const otherSeg = otherSegments[i];
                    targetSeg[SegmentPart.LOW] &= otherSeg[SegmentPart.LOW];
                    targetSeg[SegmentPart.HIGH] &= otherSeg[SegmentPart.HIGH];
                }
            }
        }
        /**
         * 对目标掩码执行按位异或操作
         * @param target 目标掩码（原地修改）
         * @param other 用于按位异或的掩码
         */
        static xorInPlace(target, other) {
            target.base[SegmentPart.LOW] ^= other.base[SegmentPart.LOW];
            target.base[SegmentPart.HIGH] ^= other.base[SegmentPart.HIGH];
            // 处理扩展段
            const otherSegments = other.segments;
            if (!otherSegments || otherSegments.length == 0)
                return;
            if (!target.segments)
                target.segments = [];
            const targetSegments = target.segments;
            // 确保 target 有足够的段
            while (targetSegments.length < otherSegments.length) {
                targetSegments.push([0, 0]);
            }
            // 对每个段执行异或操作
            for (let i = 0; i < otherSegments.length; i++) {
                const targetSeg = targetSegments[i];
                const otherSeg = otherSegments[i];
                targetSeg[SegmentPart.LOW] ^= otherSeg[SegmentPart.LOW];
                targetSeg[SegmentPart.HIGH] ^= otherSeg[SegmentPart.HIGH];
            }
        }
        /**
         * 清除掩码的所有位为0
         * @param mask 要清除的掩码（原地修改）
         */
        static clear(mask) {
            mask.base[SegmentPart.LOW] = 0;
            mask.base[SegmentPart.HIGH] = 0;
            if (mask.segments) {
                for (let i = 0; i < mask.segments.length; i++) {
                    const seg = mask.segments[i];
                    seg[SegmentPart.LOW] = 0;
                    seg[SegmentPart.HIGH] = 0;
                }
            }
        }
        /**
         * 将源掩码的值复制到目标掩码，如果source包含扩展段，则target也会至少扩展到source扩展段的长度
         * @param source 源掩码
         * @param target 目标掩码（原地修改）
         */
        static copy(source, target) {
            BitMask64Utils.clear(target);
            target.base[SegmentPart.LOW] = source.base[SegmentPart.LOW];
            target.base[SegmentPart.HIGH] = source.base[SegmentPart.HIGH];
            // source没有扩展段，直接退出
            if (!source.segments || source.segments.length == 0)
                return;
            // 没有拓展段,则直接复制数组
            if (!target.segments) {
                target.segments = source.segments.map((seg) => [...seg]);
                return;
            }
            // source有扩展段，target扩展段不足，则补充长度
            const copyLength = source.segments.length - target.segments.length;
            for (let i = 0; i < copyLength; i++) {
                target.segments.push([0, 0]);
            }
            // 逐个重写
            const targetSegments = target.segments;
            const sourceSegments = source.segments;
            for (let i = 0; i < sourceSegments.length; i++) {
                const targetSeg = targetSegments[i];
                const sourSeg = sourceSegments[i];
                targetSeg[SegmentPart.LOW] = sourSeg[SegmentPart.LOW];
                targetSeg[SegmentPart.HIGH] = sourSeg[SegmentPart.HIGH];
            }
        }
        /**
         * 创建掩码的深拷贝
         * @param mask 要拷贝的掩码
         * @returns 新的掩码对象，内容与源掩码相同
         */
        static clone(mask) {
            return {
                base: mask.base.slice(),
                ...(mask.segments && { segments: mask.segments.map((seg) => [...seg]) })
            };
        }
        /**
         * 将掩码转换为字符串表示,每个区段之间将使用空格分割。
         * @param mask 要转换的掩码
         * @param radix 进制，支持2（二进制）或16（十六进制），默认为2，其他的值被视为2
         * @param printHead 打印头
         * @returns 掩码的字符串表示，二进制不带前缀，十六进制带0x前缀
         */
        static toString(mask, radix = 2, printHead = false) {
            if (radix != 2 && radix != 16)
                radix = 2;
            const totalLength = mask.segments?.length ?? 0;
            let result = '';
            if (printHead) {
                let paddingLength = 0;
                if (radix === 2) {
                    paddingLength = 64 + 1 + 1;
                }
                else {
                    paddingLength = 16 + 2 + 1;
                }
                for (let i = 0; i <= totalLength; i++) {
                    const title = i === 0 ? '0 (Base):' : `${i} (${64 * i}):`;
                    result += title.toString().padEnd(paddingLength);
                }
                result += '\n';
            }
            for (let i = -1; i < totalLength; i++) {
                let segResult = '';
                const bitMaskData = i == -1 ? mask.base : mask.segments[i];
                const hi = bitMaskData[SegmentPart.HIGH];
                const lo = bitMaskData[SegmentPart.LOW];
                if (radix == 2) {
                    const hiBits = hi.toString(2).padStart(32, '0');
                    const loBits = lo.toString(2).padStart(32, '0');
                    segResult = hiBits + '_' + loBits; //高低位之间使用_隔离
                }
                else {
                    let hiBits = hi ? hi.toString(16).toUpperCase() : '';
                    if (printHead) {
                        // 存在标头，则输出高位之前需要补齐位数
                        hiBits = hiBits.padStart(8, '0');
                    }
                    let loBits = lo.toString(16).toUpperCase();
                    if (hiBits) {
                        // 存在高位 则输出低位之前需要补齐位数
                        loBits = loBits.padStart(8, '0');
                    }
                    segResult = '0x' + hiBits + loBits;
                }
                if (i === -1)
                    result += segResult;
                else
                    result += ' ' + segResult; // 不同段之间使用空格隔离
            }
            return result;
        }
        /**
         * 计算掩码中设置为1的位数
         * @param mask 要计算的掩码
         * @returns 掩码中1的位数
         */
        static popCount(mask) {
            let count = 0;
            for (let i = -1; i < (mask.segments?.length ?? 0); i++) {
                const bitMaskData = i == -1 ? mask.base : mask.segments[i];
                let lo = bitMaskData[SegmentPart.LOW];
                let hi = bitMaskData[SegmentPart.HIGH];
                while (lo) {
                    lo &= lo - 1;
                    count++;
                }
                while (hi) {
                    hi &= hi - 1;
                    count++;
                }
            }
            return count;
        }
        /**
         * 获取包含目标位的BitMask64Segment
         * @param mask 要操作的掩码
         * @param bitIndex 目标位
         * @param createNewSegment 如果bitIndex超过了当前范围，是否自动补充扩展区域，默认为真
         * @private
         */
        static getSegmentByBitIndex(mask, bitIndex, createNewSegment = true) {
            if (bitIndex <= 63) {
                // 基础位
                return mask.base;
            }
            else {
                // 扩展位
                let segments = mask.segments;
                if (!segments) {
                    if (!createNewSegment)
                        return null;
                    segments = mask.segments = [];
                }
                const targetSegIndex = (bitIndex >> 6) - 1; // Math.floor(bitIndex / 64) - 1的位运算优化
                if (segments.length <= targetSegIndex) {
                    if (!createNewSegment)
                        return null;
                    const diff = targetSegIndex - segments.length + 1;
                    for (let i = 0; i < diff; i++) {
                        segments.push([0, 0]);
                    }
                }
                return segments[targetSegIndex] ?? null;
            }
        }
    }
    /** 零掩码常量，所有位都为0 */
    BitMask64Utils.ZERO = { base: [0, 0] };

    /**
     * SoA 类型注册器
     * 负责类型推断、TypedArray 创建和元数据管理
     */
    class SoATypeRegistry {
        /**
         * 获取 TypedArray 构造函数
         */
        static getConstructor(typeName) {
            return this.TYPE_CONSTRUCTORS[typeName] || Float32Array;
        }
        /**
         * 获取每个元素的字节数
         */
        static getBytesPerElement(typeName) {
            return this.TYPE_BYTES[typeName] || 4;
        }
        /**
         * 从 TypedArray 实例获取类型名称
         */
        static getTypeName(array) {
            if (array instanceof Float32Array)
                return 'float32';
            if (array instanceof Float64Array)
                return 'float64';
            if (array instanceof Int32Array)
                return 'int32';
            if (array instanceof Uint32Array)
                return 'uint32';
            if (array instanceof Int16Array)
                return 'int16';
            if (array instanceof Uint16Array)
                return 'uint16';
            if (array instanceof Int8Array)
                return 'int8';
            if (array instanceof Uint8Array)
                return 'uint8';
            if (array instanceof Uint8ClampedArray)
                return 'uint8clamped';
            return 'float32';
        }
        /**
         * 创建新的 TypedArray（与原数组同类型）
         */
        static createSameType(source, capacity) {
            const typeName = this.getTypeName(source);
            const Constructor = this.getConstructor(typeName);
            return new Constructor(capacity);
        }
        /**
         * 从组件类型提取字段元数据
         */
        static extractFieldMetadata(componentType) {
            const instance = new componentType();
            const metadata = new Map();
            const typeWithMeta = componentType;
            // 收集装饰器标记
            const decoratorMap = new Map();
            const addDecorators = (fields, type) => {
                if (fields) {
                    for (const key of fields)
                        decoratorMap.set(key, type);
                }
            };
            addDecorators(typeWithMeta.__float64Fields, 'float64');
            addDecorators(typeWithMeta.__float32Fields, 'float32');
            addDecorators(typeWithMeta.__int32Fields, 'int32');
            addDecorators(typeWithMeta.__uint32Fields, 'uint32');
            addDecorators(typeWithMeta.__int16Fields, 'int16');
            addDecorators(typeWithMeta.__uint16Fields, 'uint16');
            addDecorators(typeWithMeta.__int8Fields, 'int8');
            addDecorators(typeWithMeta.__uint8Fields, 'uint8');
            addDecorators(typeWithMeta.__uint8ClampedFields, 'uint8clamped');
            // 遍历实例属性
            const instanceKeys = Object.keys(instance).filter((key) => key !== 'id');
            for (const key of instanceKeys) {
                const value = instance[key];
                const type = typeof value;
                if (type === 'function')
                    continue;
                const fieldMeta = {
                    name: key,
                    type: type
                };
                const decoratorType = decoratorMap.get(key);
                if (decoratorType) {
                    fieldMeta.arrayType = decoratorType;
                }
                else if (type === 'number') {
                    fieldMeta.arrayType = 'float32';
                }
                else if (type === 'boolean') {
                    fieldMeta.arrayType = 'uint8';
                }
                // 序列化标记
                if (typeWithMeta.__serializeMapFields?.has(key)) {
                    fieldMeta.isSerializedMap = true;
                }
                if (typeWithMeta.__serializeSetFields?.has(key)) {
                    fieldMeta.isSerializedSet = true;
                }
                if (typeWithMeta.__serializeArrayFields?.has(key)) {
                    fieldMeta.isSerializedArray = true;
                }
                if (typeWithMeta.__deepCopyFields?.has(key)) {
                    fieldMeta.isDeepCopy = true;
                }
                metadata.set(key, fieldMeta);
            }
            return metadata;
        }
    }
    SoATypeRegistry.TYPE_CONSTRUCTORS = {
        float32: Float32Array,
        float64: Float64Array,
        int32: Int32Array,
        uint32: Uint32Array,
        int16: Int16Array,
        uint16: Uint16Array,
        int8: Int8Array,
        uint8: Uint8Array,
        uint8clamped: Uint8ClampedArray
    };
    SoATypeRegistry.TYPE_BYTES = {
        float32: 4,
        float64: 8,
        int32: 4,
        uint32: 4,
        int16: 2,
        uint16: 2,
        int8: 1,
        uint8: 1,
        uint8clamped: 1
    };

    /**
     * SoA 序列化器
     * 负责复杂类型的序列化/反序列化和深拷贝
     */
    class SoASerializer {
        /**
         * 序列化值为 JSON 字符串
         */
        static serialize(value, fieldName, options = {}) {
            try {
                if (options.isMap && value instanceof Map) {
                    return JSON.stringify(Array.from(value.entries()));
                }
                if (options.isSet && value instanceof Set) {
                    return JSON.stringify(Array.from(value));
                }
                if (options.isArray && Array.isArray(value)) {
                    return JSON.stringify(value);
                }
                return JSON.stringify(value);
            }
            catch (error) {
                this._logger.warn(`SoA序列化字段 ${fieldName} 失败:`, error);
                return '{}';
            }
        }
        /**
         * 反序列化 JSON 字符串为值
         */
        static deserialize(serialized, fieldName, options = {}) {
            try {
                const parsed = JSON.parse(serialized);
                if (options.isMap) {
                    return new Map(parsed);
                }
                if (options.isSet) {
                    return new Set(parsed);
                }
                return parsed;
            }
            catch (error) {
                this._logger.warn(`SoA反序列化字段 ${fieldName} 失败:`, error);
                return null;
            }
        }
        /**
         * 深拷贝对象
         */
        static deepClone(obj) {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            if (obj instanceof Date) {
                return new Date(obj.getTime());
            }
            if (Array.isArray(obj)) {
                return obj.map((item) => this.deepClone(item));
            }
            if (obj instanceof Map) {
                const cloned = new Map();
                for (const [key, value] of obj.entries()) {
                    cloned.set(key, this.deepClone(value));
                }
                return cloned;
            }
            if (obj instanceof Set) {
                const cloned = new Set();
                for (const value of obj.values()) {
                    cloned.add(this.deepClone(value));
                }
                return cloned;
            }
            // 普通对象
            const cloned = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }
    SoASerializer._logger = createLogger('SoASerializer');

    /**
     * 32位整数装饰器
     * 标记字段使用Int32Array存储（适用于整数值）
     */
    function Int32(target, propertyKey) {
        const key = String(propertyKey);
        if (!target.constructor.__int32Fields) {
            target.constructor.__int32Fields = new Set();
        }
        target.constructor.__int32Fields.add(key);
    }
    /**
     * SoA存储器（需要装饰器启用）
     * 使用Structure of Arrays存储模式，在大规模批量操作时提供优异性能
     */
    class SoAStorage {
        constructor(componentType) {
            this.fields = new Map();
            this.stringFields = new Map();
            this.serializedFields = new Map();
            this.complexFields = new Map();
            this.entityToIndex = new Map();
            this.indexToEntity = [];
            this.freeIndices = [];
            this._size = 0;
            this._capacity = 1000;
            // 缓存字段类型信息，避免重复创建实例
            this.fieldTypes = new Map();
            // 缓存装饰器元数据
            this.serializeMapFields = new Set();
            this.serializeSetFields = new Set();
            this.serializeArrayFields = new Set();
            this.type = componentType;
            this.initializeFields(componentType);
        }
        initializeFields(componentType) {
            const instance = new componentType();
            const typeWithMeta = componentType;
            const float64Fields = typeWithMeta.__float64Fields || new Set();
            const float32Fields = typeWithMeta.__float32Fields || new Set();
            const int32Fields = typeWithMeta.__int32Fields || new Set();
            const uint32Fields = typeWithMeta.__uint32Fields || new Set();
            const int16Fields = typeWithMeta.__int16Fields || new Set();
            const uint16Fields = typeWithMeta.__uint16Fields || new Set();
            const int8Fields = typeWithMeta.__int8Fields || new Set();
            const uint8Fields = typeWithMeta.__uint8Fields || new Set();
            const uint8ClampedFields = typeWithMeta.__uint8ClampedFields || new Set();
            // 缓存装饰器元数据
            this.serializeMapFields = typeWithMeta.__serializeMapFields || new Set();
            this.serializeSetFields = typeWithMeta.__serializeSetFields || new Set();
            this.serializeArrayFields = typeWithMeta.__serializeArrayFields || new Set();
            // 先收集所有有装饰器的字段，避免重复遍历
            const decoratedFields = new Map(); // fieldName -> arrayType
            // 处理各类型装饰器标记的字段
            for (const key of float64Fields)
                decoratedFields.set(key, 'float64');
            for (const key of float32Fields)
                decoratedFields.set(key, 'float32');
            for (const key of int32Fields)
                decoratedFields.set(key, 'int32');
            for (const key of uint32Fields)
                decoratedFields.set(key, 'uint32');
            for (const key of int16Fields)
                decoratedFields.set(key, 'int16');
            for (const key of uint16Fields)
                decoratedFields.set(key, 'uint16');
            for (const key of int8Fields)
                decoratedFields.set(key, 'int8');
            for (const key of uint8Fields)
                decoratedFields.set(key, 'uint8');
            for (const key of uint8ClampedFields)
                decoratedFields.set(key, 'uint8clamped');
            // 只遍历实例自身的属性（不包括原型链），跳过 id
            const instanceKeys = Object.keys(instance).filter(key => key !== 'id');
            for (const key of instanceKeys) {
                const value = instance[key];
                const type = typeof value;
                // 跳过函数（通常不会出现在 Object.keys 中，但以防万一）
                if (type === 'function')
                    continue;
                // 检查装饰器类型
                const decoratorType = decoratedFields.get(key);
                const effectiveType = decoratorType ? 'number' : type;
                this.fieldTypes.set(key, effectiveType);
                if (decoratorType) {
                    // 有装饰器标记的数字字段
                    const ArrayConstructor = SoATypeRegistry.getConstructor(decoratorType);
                    this.fields.set(key, new ArrayConstructor(this._capacity));
                }
                else if (type === 'number') {
                    // 无装饰器的数字字段，默认使用 Float32Array
                    this.fields.set(key, new Float32Array(this._capacity));
                }
                else if (type === 'boolean') {
                    // 布尔值使用 Uint8Array 存储为 0/1
                    this.fields.set(key, new Uint8Array(this._capacity));
                }
                else if (type === 'string') {
                    // 字符串专门处理
                    this.stringFields.set(key, new Array(this._capacity));
                }
                else if (type === 'object' && value !== null) {
                    // 处理集合类型
                    if (this.serializeMapFields.has(key) || this.serializeSetFields.has(key) || this.serializeArrayFields.has(key)) {
                        // 序列化存储
                        this.serializedFields.set(key, new Array(this._capacity));
                    }
                    // 其他对象类型会在updateComponentAtIndex中作为复杂对象处理
                }
            }
        }
        addComponent(entityId, component) {
            if (this.entityToIndex.has(entityId)) {
                const index = this.entityToIndex.get(entityId);
                this.updateComponentAtIndex(index, component);
                return;
            }
            let index;
            if (this.freeIndices.length > 0) {
                index = this.freeIndices.pop();
            }
            else {
                index = this._size;
                if (index >= this._capacity) {
                    this.resize(this._capacity * 2);
                }
            }
            this.entityToIndex.set(entityId, index);
            this.indexToEntity[index] = entityId;
            this.updateComponentAtIndex(index, component);
            this._size++;
        }
        updateComponentAtIndex(index, component) {
            const entityId = this.indexToEntity[index];
            const complexFieldMap = new Map();
            const highPrecisionFields = this.type.__highPrecisionFields || new Set();
            const serializeMapFields = this.type.__serializeMapFields || new Set();
            const serializeSetFields = this.type.__serializeSetFields || new Set();
            const serializeArrayFields = this.type.__serializeArrayFields || new Set();
            const deepCopyFields = this.type.__deepCopyFields || new Set();
            // 处理所有字段
            for (const key in component) {
                if (component.hasOwnProperty(key) && key !== 'id') {
                    const value = component[key];
                    const type = typeof value;
                    if (type === 'number') {
                        if (highPrecisionFields.has(key) || !this.fields.has(key)) {
                            // 标记为高精度或未在TypedArray中的数值作为复杂对象存储
                            complexFieldMap.set(key, value);
                        }
                        else {
                            // 存储到TypedArray
                            const array = this.fields.get(key);
                            array[index] = value;
                        }
                    }
                    else if (type === 'boolean' && this.fields.has(key)) {
                        // 布尔值存储到TypedArray
                        const array = this.fields.get(key);
                        array[index] = value ? 1 : 0;
                    }
                    else if (this.stringFields.has(key)) {
                        // 字符串字段专门处理
                        const stringArray = this.stringFields.get(key);
                        stringArray[index] = String(value);
                    }
                    else if (this.serializedFields.has(key)) {
                        // 序列化字段处理
                        const serializedArray = this.serializedFields.get(key);
                        serializedArray[index] = SoASerializer.serialize(value, key, {
                            isMap: serializeMapFields.has(key),
                            isSet: serializeSetFields.has(key),
                            isArray: serializeArrayFields.has(key)
                        });
                    }
                    else {
                        // 复杂字段单独存储
                        if (deepCopyFields.has(key)) {
                            // 深拷贝处理
                            complexFieldMap.set(key, SoASerializer.deepClone(value));
                        }
                        else {
                            complexFieldMap.set(key, value);
                        }
                    }
                }
            }
            // 存储复杂字段
            if (complexFieldMap.size > 0) {
                this.complexFields.set(entityId, complexFieldMap);
            }
        }
        getComponent(entityId) {
            const index = this.entityToIndex.get(entityId);
            if (index === undefined) {
                return null;
            }
            // 返回 Proxy，直接操作底层 TypedArray
            return this.createProxyView(entityId, index);
        }
        /**
         * 创建组件的 Proxy 视图
         * 读写操作直接映射到底层 TypedArray，无数据复制
         */
        createProxyView(entityId, index) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this;
            // Proxy handler 类型定义
            const handler = {
                get(_, prop) {
                    const propStr = String(prop);
                    // TypedArray 字段
                    const array = self.fields.get(propStr);
                    if (array) {
                        const fieldType = self.getFieldType(propStr);
                        if (fieldType === 'boolean') {
                            return array[index] === 1;
                        }
                        return array[index];
                    }
                    // 字符串字段
                    const stringArray = self.stringFields.get(propStr);
                    if (stringArray) {
                        return stringArray[index];
                    }
                    // 序列化字段
                    const serializedArray = self.serializedFields.get(propStr);
                    if (serializedArray) {
                        const serialized = serializedArray[index];
                        if (serialized) {
                            return SoASerializer.deserialize(serialized, propStr, {
                                isMap: self.serializeMapFields.has(propStr),
                                isSet: self.serializeSetFields.has(propStr),
                                isArray: self.serializeArrayFields.has(propStr)
                            });
                        }
                        return undefined;
                    }
                    // 复杂字段
                    const complexFieldMap = self.complexFields.get(entityId);
                    if (complexFieldMap?.has(propStr)) {
                        return complexFieldMap.get(propStr);
                    }
                    return undefined;
                },
                set(_, prop, value) {
                    const propStr = String(prop);
                    // entityId 是只读的
                    if (propStr === 'entityId') {
                        return false;
                    }
                    // TypedArray 字段
                    const array = self.fields.get(propStr);
                    if (array) {
                        const fieldType = self.getFieldType(propStr);
                        if (fieldType === 'boolean') {
                            array[index] = value ? 1 : 0;
                        }
                        else {
                            array[index] = value;
                        }
                        return true;
                    }
                    // 字符串字段
                    const stringArray = self.stringFields.get(propStr);
                    if (stringArray) {
                        stringArray[index] = String(value);
                        return true;
                    }
                    // 序列化字段
                    if (self.serializedFields.has(propStr)) {
                        const serializedArray = self.serializedFields.get(propStr);
                        serializedArray[index] = SoASerializer.serialize(value, propStr, {
                            isMap: self.serializeMapFields.has(propStr),
                            isSet: self.serializeSetFields.has(propStr),
                            isArray: self.serializeArrayFields.has(propStr)
                        });
                        return true;
                    }
                    // 复杂字段
                    let complexFieldMap = self.complexFields.get(entityId);
                    if (!complexFieldMap) {
                        complexFieldMap = new Map();
                        self.complexFields.set(entityId, complexFieldMap);
                    }
                    complexFieldMap.set(propStr, value);
                    return true;
                },
                has(_, prop) {
                    const propStr = String(prop);
                    return self.fields.has(propStr) ||
                        self.stringFields.has(propStr) ||
                        self.serializedFields.has(propStr) ||
                        self.complexFields.get(entityId)?.has(propStr) || false;
                },
                ownKeys() {
                    const keys = [];
                    for (const key of self.fields.keys())
                        keys.push(key);
                    for (const key of self.stringFields.keys())
                        keys.push(key);
                    for (const key of self.serializedFields.keys())
                        keys.push(key);
                    const complexFieldMap = self.complexFields.get(entityId);
                    if (complexFieldMap) {
                        for (const key of complexFieldMap.keys())
                            keys.push(key);
                    }
                    return keys;
                },
                getOwnPropertyDescriptor(_, prop) {
                    const propStr = String(prop);
                    if (self.fields.has(propStr) ||
                        self.stringFields.has(propStr) ||
                        self.serializedFields.has(propStr) ||
                        self.complexFields.get(entityId)?.has(propStr)) {
                        return {
                            enumerable: true,
                            configurable: true,
                            // entityId 是只读的
                            writable: propStr !== 'entityId',
                        };
                    }
                    return undefined;
                }
            };
            return new Proxy({}, handler);
        }
        /**
         * 获取组件的快照副本（用于序列化等需要独立副本的场景）
         */
        getComponentSnapshot(entityId) {
            const index = this.entityToIndex.get(entityId);
            if (index === undefined) {
                return null;
            }
            // 需要 any 因为要动态写入泛型 T 的属性
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const component = new this.type();
            // 恢复数值字段
            for (const [fieldName, array] of this.fields.entries()) {
                const value = array[index];
                const fieldType = this.getFieldType(fieldName);
                if (fieldType === 'boolean') {
                    component[fieldName] = value === 1;
                }
                else {
                    component[fieldName] = value;
                }
            }
            // 恢复字符串字段
            for (const [fieldName, stringArray] of this.stringFields.entries()) {
                component[fieldName] = stringArray[index];
            }
            // 恢复序列化字段
            for (const [fieldName, serializedArray] of this.serializedFields.entries()) {
                const serialized = serializedArray[index];
                if (serialized) {
                    component[fieldName] = SoASerializer.deserialize(serialized, fieldName, {
                        isMap: this.serializeMapFields.has(fieldName),
                        isSet: this.serializeSetFields.has(fieldName),
                        isArray: this.serializeArrayFields.has(fieldName)
                    });
                }
            }
            // 恢复复杂字段
            const complexFieldMap = this.complexFields.get(entityId);
            if (complexFieldMap) {
                for (const [fieldName, value] of complexFieldMap.entries()) {
                    component[fieldName] = value;
                }
            }
            return component;
        }
        getFieldType(fieldName) {
            // 使用缓存的字段类型
            return this.fieldTypes.get(fieldName) || 'unknown';
        }
        hasComponent(entityId) {
            return this.entityToIndex.has(entityId);
        }
        removeComponent(entityId) {
            const index = this.entityToIndex.get(entityId);
            if (index === undefined) {
                return null;
            }
            // 获取组件副本以便返回
            const component = this.getComponent(entityId);
            // 清理复杂字段
            this.complexFields.delete(entityId);
            this.entityToIndex.delete(entityId);
            this.freeIndices.push(index);
            this._size--;
            return component;
        }
        resize(newCapacity) {
            // 调整数值字段的TypedArray
            for (const [fieldName, oldArray] of this.fields.entries()) {
                const newArray = SoATypeRegistry.createSameType(oldArray, newCapacity);
                newArray.set(oldArray);
                this.fields.set(fieldName, newArray);
            }
            // 调整字符串字段的数组
            for (const [fieldName, oldArray] of this.stringFields.entries()) {
                const newArray = new Array(newCapacity);
                for (let i = 0; i < oldArray.length; i++) {
                    newArray[i] = oldArray[i];
                }
                this.stringFields.set(fieldName, newArray);
            }
            // 调整序列化字段的数组
            for (const [fieldName, oldArray] of this.serializedFields.entries()) {
                const newArray = new Array(newCapacity);
                for (let i = 0; i < oldArray.length; i++) {
                    newArray[i] = oldArray[i];
                }
                this.serializedFields.set(fieldName, newArray);
            }
            this._capacity = newCapacity;
        }
        getActiveIndices() {
            return Array.from(this.entityToIndex.values());
        }
        getFieldArray(fieldName) {
            return this.fields.get(fieldName) || null;
        }
        getTypedFieldArray(fieldName) {
            return this.fields.get(String(fieldName)) || null;
        }
        getEntityIndex(entityId) {
            return this.entityToIndex.get(entityId);
        }
        getEntityIdByIndex(index) {
            return this.indexToEntity[index];
        }
        size() {
            return this._size;
        }
        clear() {
            this.entityToIndex.clear();
            this.indexToEntity = [];
            this.freeIndices = [];
            this.complexFields.clear();
            this._size = 0;
            // 重置数值字段数组
            for (const array of this.fields.values()) {
                array.fill(0);
            }
            // 重置字符串字段数组
            for (const stringArray of this.stringFields.values()) {
                for (let i = 0; i < stringArray.length; i++) {
                    stringArray[i] = undefined;
                }
            }
            // 重置序列化字段数组
            for (const serializedArray of this.serializedFields.values()) {
                for (let i = 0; i < serializedArray.length; i++) {
                    serializedArray[i] = undefined;
                }
            }
        }
        compact() {
            if (this.freeIndices.length === 0) {
                return;
            }
            const activeEntries = Array.from(this.entityToIndex.entries())
                .sort((a, b) => a[1] - b[1]);
            // 重新映射索引
            const newEntityToIndex = new Map();
            const newIndexToEntity = [];
            for (let newIndex = 0; newIndex < activeEntries.length; newIndex++) {
                const entry = activeEntries[newIndex];
                if (!entry)
                    continue;
                const [entityId, oldIndex] = entry;
                newEntityToIndex.set(entityId, newIndex);
                newIndexToEntity[newIndex] = entityId;
                // 移动字段数据
                if (newIndex !== oldIndex) {
                    // 移动数值字段
                    for (const [, array] of this.fields.entries()) {
                        const value = array[oldIndex];
                        if (value !== undefined) {
                            array[newIndex] = value;
                        }
                    }
                    // 移动字符串字段
                    for (const [, stringArray] of this.stringFields.entries()) {
                        const value = stringArray[oldIndex];
                        if (value !== undefined) {
                            stringArray[newIndex] = value;
                        }
                    }
                    // 移动序列化字段
                    for (const [, serializedArray] of this.serializedFields.entries()) {
                        const value = serializedArray[oldIndex];
                        if (value !== undefined) {
                            serializedArray[newIndex] = value;
                        }
                    }
                }
            }
            this.entityToIndex = newEntityToIndex;
            this.indexToEntity = newIndexToEntity;
            this.freeIndices = [];
            this._size = activeEntries.length;
        }
        getStats() {
            let totalMemory = 0;
            const fieldStats = new Map();
            for (const [fieldName, array] of this.fields.entries()) {
                const typeName = SoATypeRegistry.getTypeName(array);
                const bytesPerElement = SoATypeRegistry.getBytesPerElement(typeName);
                const memory = array.length * bytesPerElement;
                totalMemory += memory;
                fieldStats.set(fieldName, {
                    size: this._size,
                    capacity: array.length,
                    type: typeName,
                    memory: memory
                });
            }
            return {
                size: this._size,
                capacity: this._capacity,
                usedSlots: this._size, // 兼容原测试
                fragmentation: this.freeIndices.length / this._capacity,
                memoryUsage: totalMemory,
                fieldStats: fieldStats
            };
        }
        /**
         * 执行向量化批量操作
         * @param operation 操作函数，接收字段数组和活跃索引
         */
        performVectorizedOperation(operation) {
            const activeIndices = this.getActiveIndices();
            operation(this.fields, activeIndices);
        }
    }

    /**
     * 组件注册表
     * 管理组件类型的位掩码分配
     */
    class ComponentRegistry {
        /**
         * 注册组件类型并分配位掩码
         * @param componentType 组件类型
         * @returns 分配的位索引
         */
        static register(componentType) {
            const typeName = getComponentTypeName(componentType);
            if (this.componentTypes.has(componentType)) {
                const existingIndex = this.componentTypes.get(componentType);
                return existingIndex;
            }
            const bitIndex = this.nextBitIndex++;
            this.componentTypes.set(componentType, bitIndex);
            this.bitIndexToType.set(bitIndex, componentType);
            this.componentNameToType.set(typeName, componentType);
            this.componentNameToId.set(typeName, bitIndex);
            return bitIndex;
        }
        /**
         * 获取组件类型的位掩码
         * @param componentType 组件类型
         * @returns 位掩码
         */
        static getBitMask(componentType) {
            const bitIndex = this.componentTypes.get(componentType);
            if (bitIndex === undefined) {
                const typeName = getComponentTypeName(componentType);
                throw new Error(`Component type ${typeName} is not registered`);
            }
            return BitMask64Utils.create(bitIndex);
        }
        /**
         * 获取组件类型的位索引
         * @param componentType 组件类型
         * @returns 位索引
         */
        static getBitIndex(componentType) {
            const bitIndex = this.componentTypes.get(componentType);
            if (bitIndex === undefined) {
                const typeName = getComponentTypeName(componentType);
                throw new Error(`Component type ${typeName} is not registered`);
            }
            return bitIndex;
        }
        /**
         * 检查组件类型是否已注册
         * @param componentType 组件类型
         * @returns 是否已注册
         */
        static isRegistered(componentType) {
            return this.componentTypes.has(componentType);
        }
        /**
         * 通过位索引获取组件类型
         * @param bitIndex 位索引
         * @returns 组件类型构造函数或null
         */
        static getTypeByBitIndex(bitIndex) {
            return this.bitIndexToType.get(bitIndex) || null;
        }
        /**
         * 获取当前已注册的组件类型数量
         * @returns 已注册数量
         */
        static getRegisteredCount() {
            return this.nextBitIndex;
        }
        /**
         * 通过名称获取组件类型
         * @param componentName 组件名称
         * @returns 组件类型构造函数
         */
        static getComponentType(componentName) {
            return this.componentNameToType.get(componentName) || null;
        }
        /**
         * 获取所有已注册的组件类型
         * @returns 组件类型映射
         */
        static getAllRegisteredTypes() {
            return new Map(this.componentTypes);
        }
        /**
         * 获取所有组件名称到类型的映射
         * @returns 名称到类型的映射
         */
        static getAllComponentNames() {
            return new Map(this.componentNameToType);
        }
        /**
         * 通过名称获取组件类型ID
         * @param componentName 组件名称
         * @returns 组件类型ID
         */
        static getComponentId(componentName) {
            return this.componentNameToId.get(componentName);
        }
        /**
         * 注册组件类型（通过名称）
         * @param componentName 组件名称
         * @returns 分配的组件ID
         */
        static registerComponentByName(componentName) {
            if (this.componentNameToId.has(componentName)) {
                return this.componentNameToId.get(componentName);
            }
            const bitIndex = this.nextBitIndex++;
            this.componentNameToId.set(componentName, bitIndex);
            return bitIndex;
        }
        /**
         * 创建单个组件的掩码
         * @param componentName 组件名称
         * @returns 组件掩码
         */
        static createSingleComponentMask(componentName) {
            const cacheKey = `single:${componentName}`;
            if (this.maskCache.has(cacheKey)) {
                return this.maskCache.get(cacheKey);
            }
            const componentId = this.getComponentId(componentName);
            if (componentId === undefined) {
                throw new Error(`Component type ${componentName} is not registered`);
            }
            const mask = BitMask64Utils.create(componentId);
            this.maskCache.set(cacheKey, mask);
            return mask;
        }
        /**
         * 创建多个组件的掩码
         * @param componentNames 组件名称数组
         * @returns 组合掩码
         */
        static createComponentMask(componentNames) {
            const sortedNames = [...componentNames].sort();
            const cacheKey = `multi:${sortedNames.join(',')}`;
            if (this.maskCache.has(cacheKey)) {
                return this.maskCache.get(cacheKey);
            }
            const mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            for (const name of componentNames) {
                const componentId = this.getComponentId(name);
                if (componentId !== undefined) {
                    const componentMask = BitMask64Utils.create(componentId);
                    BitMask64Utils.orInPlace(mask, componentMask);
                }
            }
            this.maskCache.set(cacheKey, mask);
            return mask;
        }
        /**
         * 清除掩码缓存
         */
        static clearMaskCache() {
            this.maskCache.clear();
        }
        /**
         * 重置注册表（用于测试）
         */
        static reset() {
            this.componentTypes.clear();
            this.bitIndexToType.clear();
            this.componentNameToType.clear();
            this.componentNameToId.clear();
            this.maskCache.clear();
            this.nextBitIndex = 0;
        }
    }
    ComponentRegistry._logger = createLogger('ComponentStorage');
    ComponentRegistry.componentTypes = new Map();
    ComponentRegistry.bitIndexToType = new Map();
    ComponentRegistry.componentNameToType = new Map();
    ComponentRegistry.componentNameToId = new Map();
    ComponentRegistry.maskCache = new Map();
    ComponentRegistry.nextBitIndex = 0;

    /**
     * 高性能组件存储器
     */
    class ComponentStorage {
        constructor(componentType) {
            this.dense = [];
            this.entityIds = [];
            this.entityToIndex = new Map();
            this.componentType = componentType;
            // 确保组件类型已注册
            if (!ComponentRegistry.isRegistered(componentType)) {
                ComponentRegistry.register(componentType);
            }
        }
        /**
         * 添加组件
         * @param entityId 实体ID
         * @param component 组件实例
         */
        addComponent(entityId, component) {
            // 检查实体是否已有此组件
            if (this.entityToIndex.has(entityId)) {
                throw new Error(`Entity ${entityId} already has component ${getComponentTypeName(this.componentType)}`);
            }
            // 末尾插入到致密数组
            const index = this.dense.length;
            this.dense.push(component);
            this.entityIds.push(entityId);
            this.entityToIndex.set(entityId, index);
        }
        /**
         * 获取组件
         * @param entityId 实体ID
         * @returns 组件实例或null
         */
        getComponent(entityId) {
            const index = this.entityToIndex.get(entityId);
            return index !== undefined ? this.dense[index] : null;
        }
        /**
         * 检查实体是否有此组件
         * @param entityId 实体ID
         * @returns 是否有组件
         */
        hasComponent(entityId) {
            return this.entityToIndex.has(entityId);
        }
        /**
         * 移除组件
         * @param entityId 实体ID
         * @returns 被移除的组件或null
         */
        removeComponent(entityId) {
            const index = this.entityToIndex.get(entityId);
            if (index === undefined) {
                return null;
            }
            const component = this.dense[index];
            const lastIndex = this.dense.length - 1;
            if (index !== lastIndex) {
                // 将末尾元素交换到要删除的位置
                const lastComponent = this.dense[lastIndex];
                const lastEntityId = this.entityIds[lastIndex];
                this.dense[index] = lastComponent;
                this.entityIds[index] = lastEntityId;
                // 更新被交换元素的映射
                this.entityToIndex.set(lastEntityId, index);
            }
            // 移除末尾元素
            this.dense.pop();
            this.entityIds.pop();
            this.entityToIndex.delete(entityId);
            return component;
        }
        /**
         * 高效遍历所有组件
         * @param callback 回调函数
         */
        forEach(callback) {
            for (let i = 0; i < this.dense.length; i++) {
                callback(this.dense[i], this.entityIds[i], i);
            }
        }
        /**
         * 获取所有组件
         * @returns 组件数组
         */
        getDenseArray() {
            return {
                components: [...this.dense],
                entityIds: [...this.entityIds]
            };
        }
        /**
         * 清空所有组件
         */
        clear() {
            this.dense.length = 0;
            this.entityIds.length = 0;
            this.entityToIndex.clear();
        }
        /**
         * 获取组件数量
         */
        get size() {
            return this.dense.length;
        }
        /**
         * 获取组件类型
         */
        get type() {
            return this.componentType;
        }
        /**
         * 获取存储统计信息
         */
        getStats() {
            const totalSlots = this.dense.length;
            const usedSlots = this.dense.length;
            const freeSlots = 0; // 永远无空洞
            const fragmentation = 0; // 永远无碎片
            return {
                totalSlots,
                usedSlots,
                freeSlots,
                fragmentation
            };
        }
    }
    /**
     * 组件存储管理器
     * 管理所有组件类型的存储器
     */
    class ComponentStorageManager {
        constructor() {
            this.storages = new Map();
        }
        /**
         * 检查组件类型是否启用SoA存储
         * @param componentType 组件类型
         * @returns 是否为SoA存储
         */
        isSoAStorage(componentType) {
            const storage = this.storages.get(componentType);
            return storage instanceof SoAStorage;
        }
        /**
         * 获取SoA存储器（类型安全）
         * @param componentType 组件类型
         * @returns SoA存储器或null
         */
        getSoAStorage(componentType) {
            const storage = this.getStorage(componentType);
            return storage instanceof SoAStorage ? storage : null;
        }
        /**
         * 直接获取SoA字段数组（类型安全）
         * @param componentType 组件类型
         * @param fieldName 字段名
         * @returns TypedArray或null
         */
        getFieldArray(componentType, fieldName) {
            const soaStorage = this.getSoAStorage(componentType);
            return soaStorage ? soaStorage.getFieldArray(fieldName) : null;
        }
        /**
         * 直接获取SoA字段数组（类型安全，带字段名检查）
         * @param componentType 组件类型
         * @param fieldName 字段名（类型检查）
         * @returns TypedArray或null
         */
        getTypedFieldArray(componentType, fieldName) {
            const soaStorage = this.getSoAStorage(componentType);
            return soaStorage ? soaStorage.getTypedFieldArray(fieldName) : null;
        }
        /**
         * 获取SoA存储的活跃索引
         * @param componentType 组件类型
         * @returns 活跃索引数组或空数组
         */
        getActiveIndices(componentType) {
            const soaStorage = this.getSoAStorage(componentType);
            return soaStorage ? soaStorage.getActiveIndices() : [];
        }
        /**
         * 获取实体在SoA存储中的索引
         * @param componentType 组件类型
         * @param entityId 实体ID
         * @returns 存储索引或undefined
         */
        getEntityIndex(componentType, entityId) {
            const soaStorage = this.getSoAStorage(componentType);
            return soaStorage ? soaStorage.getEntityIndex(entityId) : undefined;
        }
        /**
         * 根据索引获取实体ID
         * @param componentType 组件类型
         * @param index 存储索引
         * @returns 实体ID或undefined
         */
        getEntityIdByIndex(componentType, index) {
            const soaStorage = this.getSoAStorage(componentType);
            return soaStorage ? soaStorage.getEntityIdByIndex(index) : undefined;
        }
        /**
         * 获取或创建组件存储器（默认原始存储）
         * @param componentType 组件类型
         * @returns 组件存储器
         */
        getStorage(componentType) {
            let storage = this.storages.get(componentType);
            if (!storage) {
                // 检查是否启用SoA优化
                const enableSoA = componentType.__enableSoA;
                if (enableSoA) {
                    // 使用SoA优化存储
                    storage = new SoAStorage(componentType);
                    ComponentStorageManager._logger.info(`为 ${getComponentTypeName(componentType)} 启用SoA优化（适用于大规模批量操作）`);
                }
                else {
                    // 默认使用原始存储
                    storage = new ComponentStorage(componentType);
                }
                this.storages.set(componentType, storage);
            }
            return storage;
        }
        /**
         * 添加组件
         * @param entityId 实体ID
         * @param component 组件实例
         */
        addComponent(entityId, component) {
            const componentType = component.constructor;
            const storage = this.getStorage(componentType);
            storage.addComponent(entityId, component);
        }
        /**
         * 获取组件
         * @param entityId 实体ID
         * @param componentType 组件类型
         * @returns 组件实例或null
         */
        getComponent(entityId, componentType) {
            const storage = this.storages.get(componentType);
            return storage ? storage.getComponent(entityId) : null;
        }
        /**
         * 检查实体是否有组件
         * @param entityId 实体ID
         * @param componentType 组件类型
         * @returns 是否有组件
         */
        hasComponent(entityId, componentType) {
            const storage = this.storages.get(componentType);
            return storage ? storage.hasComponent(entityId) : false;
        }
        /**
         * 移除组件
         * @param entityId 实体ID
         * @param componentType 组件类型
         * @returns 被移除的组件或null
         */
        removeComponent(entityId, componentType) {
            const storage = this.storages.get(componentType);
            return storage ? storage.removeComponent(entityId) : null;
        }
        /**
         * 移除实体的所有组件
         * @param entityId 实体ID
         */
        removeAllComponents(entityId) {
            for (const storage of this.storages.values()) {
                storage.removeComponent(entityId);
            }
        }
        /**
         * 获取实体的组件位掩码
         * @param entityId 实体ID
         * @returns 组件位掩码
         */
        getComponentMask(entityId) {
            const mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            for (const [componentType, storage] of this.storages.entries()) {
                if (storage.hasComponent(entityId)) {
                    const componentMask = ComponentRegistry.getBitMask(componentType);
                    BitMask64Utils.orInPlace(mask, componentMask);
                }
            }
            return mask;
        }
        /**
         * 获取所有存储器的统计信息
         */
        getAllStats() {
            const stats = new Map();
            for (const [componentType, storage] of this.storages.entries()) {
                const typeName = getComponentTypeName(componentType);
                stats.set(typeName, storage.getStats());
            }
            return stats;
        }
        /**
         * 清空所有存储器
         */
        clear() {
            for (const storage of this.storages.values()) {
                storage.clear();
            }
            this.storages.clear();
        }
    }
    ComponentStorageManager._logger = createLogger('ComponentStorage');

    /**
     * 实体比较器
     *
     * 用于比较两个实体的优先级，首先按更新顺序比较，然后按ID比较。
     */
    class EntityComparer {
        /**
         * 比较两个实体
         *
         * @param self - 第一个实体
         * @param other - 第二个实体
         * @returns 比较结果，负数表示self优先级更高，正数表示other优先级更高，0表示相等
         */
        compare(self, other) {
            let compare = self.updateOrder - other.updateOrder;
            if (compare == 0)
                compare = self.id - other.id;
            return compare;
        }
    }
    /**
     * 游戏实体类
     *
     * ECS架构中的实体（Entity），作为组件的容器。
     * 实体本身不包含游戏逻辑，所有功能都通过组件来实现。
     * 支持父子关系，可以构建实体层次结构。
     *
     * @example
     * ```typescript
     * // 创建实体
     * const entity = new Entity("Player", 1);
     *
     * // 添加组件
     * const healthComponent = entity.addComponent(new HealthComponent(100));
     *
     * // 获取组件
     * const health = entity.getComponent(HealthComponent);
     *
     * // 添加位置组件
     * entity.addComponent(new PositionComponent(100, 200));
     *
     * // 添加子实体
     * const weapon = new Entity("Weapon", 2);
     * entity.addChild(weapon);
     * ```
     */
    class Entity {
        /**
         * 构造函数
         *
         * @param name - 实体名称
         * @param id - 实体唯一标识符
         */
        constructor(name, id) {
            /**
             * 所属场景引用
             */
            this.scene = null;
            /**
             * 销毁状态标志
             */
            this._isDestroyed = false;
            /**
             * 父实体引用
             */
            this._parent = null;
            /**
             * 子实体集合
             */
            this._children = [];
            /**
             * 激活状态
             */
            this._active = true;
            /**
             * 实体标签
             */
            this._tag = 0;
            /**
             * 启用状态
             */
            this._enabled = true;
            /**
             * 更新顺序
             */
            this._updateOrder = 0;
            /**
             * 组件位掩码（用于快速 hasComponent 检查）
             */
            this._componentMask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            /**
             * 懒加载的组件数组缓存
             */
            this._componentCache = null;
            this.name = name;
            this.id = id;
        }
        /**
         * 获取销毁状态
         * @returns 如果实体已被销毁则返回true
         */
        get isDestroyed() {
            return this._isDestroyed;
        }
        /**
         * 设置销毁状态（内部使用）
         *
         * 此方法供Scene和批量操作使用，以提高性能。
         * 不应在普通业务逻辑中调用，应使用destroy()方法。
         *
         * @internal
         */
        setDestroyedState(destroyed) {
            this._isDestroyed = destroyed;
        }
        /**
         * 获取组件数组（懒加载）
         * @returns 只读的组件数组
         */
        get components() {
            if (this._componentCache === null) {
                this._rebuildComponentCache();
            }
            return this._componentCache;
        }
        /**
         * 从存储重建组件缓存
         */
        _rebuildComponentCache() {
            const components = [];
            if (!this.scene?.componentStorageManager) {
                this._componentCache = components;
                return;
            }
            const mask = this._componentMask;
            const maxBitIndex = ComponentRegistry.getRegisteredCount();
            for (let bitIndex = 0; bitIndex < maxBitIndex; bitIndex++) {
                if (BitMask64Utils.getBit(mask, bitIndex)) {
                    const componentType = ComponentRegistry.getTypeByBitIndex(bitIndex);
                    if (componentType) {
                        const component = this.scene.componentStorageManager.getComponent(this.id, componentType);
                        if (component) {
                            components.push(component);
                        }
                    }
                }
            }
            this._componentCache = components;
        }
        /**
         * 获取父实体
         * @returns 父实体，如果没有父实体则返回null
         */
        get parent() {
            return this._parent;
        }
        /**
         * 获取子实体数组的只读副本
         *
         * @returns 子实体数组的副本
         */
        get children() {
            return [...this._children];
        }
        /**
         * 获取子实体数量
         *
         * @returns 子实体的数量
         */
        get childCount() {
            return this._children.length;
        }
        /**
         * 获取活跃状态
         *
         * @returns 如果实体处于活跃状态则返回true
         */
        get active() {
            return this._active;
        }
        /**
         * 设置活跃状态
         *
         * 设置实体的活跃状态，会影响子实体的有效活跃状态。
         *
         * @param value - 新的活跃状态
         */
        set active(value) {
            if (this._active !== value) {
                this._active = value;
                this.onActiveChanged();
            }
        }
        /**
         * 获取实体的有效活跃状态
         *
         * 考虑父实体的活跃状态，只有当实体本身和所有父实体都处于活跃状态时才返回true。
         *
         * @returns 有效的活跃状态
         */
        get activeInHierarchy() {
            if (!this._active)
                return false;
            if (this._parent)
                return this._parent.activeInHierarchy;
            return true;
        }
        /**
         * 获取实体标签
         *
         * @returns 实体的数字标签
         */
        get tag() {
            return this._tag;
        }
        /**
         * 设置实体标签
         *
         * @param value - 新的标签值
         */
        set tag(value) {
            this._tag = value;
        }
        /**
         * 获取启用状态
         *
         * @returns 如果实体已启用则返回true
         */
        get enabled() {
            return this._enabled;
        }
        /**
         * 设置启用状态
         *
         * @param value - 新的启用状态
         */
        set enabled(value) {
            this._enabled = value;
        }
        /**
         * 获取更新顺序
         *
         * @returns 实体的更新顺序值
         */
        get updateOrder() {
            return this._updateOrder;
        }
        /**
         * 设置更新顺序
         *
         * @param value - 新的更新顺序值
         */
        set updateOrder(value) {
            this._updateOrder = value;
        }
        /**
         * 获取组件位掩码
         *
         * @returns 实体的组件位掩码
         */
        get componentMask() {
            return this._componentMask;
        }
        /**
         * 创建并添加组件
         *
         * @param componentType - 组件类型构造函数
         * @param args - 组件构造函数参数
         * @returns 创建的组件实例
         *
         * @example
         * ```typescript
         * const position = entity.createComponent(Position, 100, 200);
         * const health = entity.createComponent(Health, 100);
         * ```
         */
        createComponent(componentType, ...args) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const component = new componentType(...args);
            return this.addComponent(component);
        }
        /**
         * 内部添加组件方法（不进行重复检查，用于初始化）
         *
         * @param component - 要添加的组件实例
         * @returns 添加的组件实例
         */
        addComponentInternal(component) {
            const componentType = component.constructor;
            if (!ComponentRegistry.isRegistered(componentType)) {
                ComponentRegistry.register(componentType);
            }
            // 更新位掩码
            const componentMask = ComponentRegistry.getBitMask(componentType);
            BitMask64Utils.orInPlace(this._componentMask, componentMask);
            // 使缓存失效
            this._componentCache = null;
            return component;
        }
        /**
         * 通知Scene中的QuerySystem实体组件发生变动
         */
        notifyQuerySystems() {
            if (this.scene && this.scene.querySystem) {
                this.scene.querySystem.updateEntity(this);
                this.scene.clearSystemEntityCaches();
            }
        }
        /**
         * 添加组件到实体
         *
         * @param component - 要添加的组件实例
         * @returns 添加的组件实例
         * @throws {Error} 如果实体已存在该类型的组件
         *
         * @example
         * ```typescript
         * const position = new Position(100, 200);
         * entity.addComponent(position);
         * ```
         */
        addComponent(component) {
            const componentType = component.constructor;
            if (!this.scene) {
                throw new Error('Entity must be added to Scene before adding components. Use scene.createEntity() instead of new Entity()');
            }
            if (!this.scene.componentStorageManager) {
                throw new Error('Scene does not have componentStorageManager');
            }
            if (this.hasComponent(componentType)) {
                throw new Error(`Entity ${this.name} already has component ${getComponentTypeName(componentType)}`);
            }
            this.addComponentInternal(component);
            this.scene.componentStorageManager.addComponent(this.id, component);
            component.entityId = this.id;
            if (this.scene.referenceTracker) {
                this.scene.referenceTracker.registerEntityScene(this.id, this.scene);
            }
            component.onAddedToEntity();
            if (this.scene && this.scene.eventSystem) {
                this.scene.eventSystem.emitSync('component:added', {
                    timestamp: Date.now(),
                    source: 'Entity',
                    entityId: this.id,
                    entityName: this.name,
                    entityTag: this.tag?.toString(),
                    componentType: getComponentTypeName(componentType),
                    component: component
                });
            }
            this.notifyQuerySystems();
            return component;
        }
        /**
         * 获取指定类型的组件
         *
         * @param type - 组件类型构造函数
         * @returns 组件实例，如果不存在则返回null
         *
         * @example
         * ```typescript
         * const position = entity.getComponent(Position);
         * if (position) {
         *     position.x += 10;
         *     position.y += 20;
         * }
         * ```
         */
        getComponent(type) {
            // 快速检查：位掩码
            if (!this.hasComponent(type)) {
                return null;
            }
            // 从Scene存储获取
            if (!this.scene?.componentStorageManager) {
                return null;
            }
            const component = this.scene.componentStorageManager.getComponent(this.id, type);
            return component;
        }
        /**
         * 检查实体是否拥有指定类型的组件
         *
         * @param type - 组件类型构造函数
         * @returns 如果实体拥有该组件返回true，否则返回false
         *
         * @example
         * ```typescript
         * if (entity.hasComponent(Position)) {
         *     const position = entity.getComponent(Position)!;
         *     position.x += 10;
         * }
         * ```
         */
        hasComponent(type) {
            if (!ComponentRegistry.isRegistered(type)) {
                return false;
            }
            const mask = ComponentRegistry.getBitMask(type);
            return BitMask64Utils.hasAny(this._componentMask, mask);
        }
        /**
         * 获取或创建指定类型的组件
         *
         * 如果组件已存在则返回现有组件，否则创建新组件并添加到实体
         *
         * @param type - 组件类型构造函数
         * @param args - 组件构造函数参数（仅在创建新组件时使用）
         * @returns 组件实例
         *
         * @example
         * ```typescript
         * // 确保实体拥有Position组件
         * const position = entity.getOrCreateComponent(Position, 0, 0);
         * position.x = 100;
         * ```
         */
        getOrCreateComponent(type, ...args) {
            let component = this.getComponent(type);
            if (!component) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                component = this.createComponent(type, ...args);
            }
            return component;
        }
        /**
         * 移除指定的组件
         *
         * @param component - 要移除的组件实例
         */
        removeComponent(component) {
            const componentType = component.constructor;
            if (!ComponentRegistry.isRegistered(componentType)) {
                return;
            }
            const bitIndex = ComponentRegistry.getBitIndex(componentType);
            // 更新位掩码
            BitMask64Utils.clearBit(this._componentMask, bitIndex);
            // 使缓存失效
            this._componentCache = null;
            // 从Scene存储移除
            if (this.scene?.componentStorageManager) {
                this.scene.componentStorageManager.removeComponent(this.id, componentType);
            }
            if (this.scene?.referenceTracker) {
                this.scene.referenceTracker.clearComponentReferences(component);
            }
            if (component.onRemovedFromEntity) {
                component.onRemovedFromEntity();
            }
            component.entityId = null;
            if (this.scene && this.scene.eventSystem) {
                this.scene.eventSystem.emitSync('component:removed', {
                    timestamp: Date.now(),
                    source: 'Entity',
                    entityId: this.id,
                    entityName: this.name,
                    entityTag: this.tag?.toString(),
                    componentType: getComponentTypeName(componentType),
                    component: component
                });
            }
            this.notifyQuerySystems();
        }
        /**
         * 移除指定类型的组件
         *
         * @param type - 组件类型
         * @returns 被移除的组件实例或null
         */
        removeComponentByType(type) {
            const component = this.getComponent(type);
            if (component) {
                this.removeComponent(component);
                return component;
            }
            return null;
        }
        /**
         * 移除所有组件
         */
        removeAllComponents() {
            const componentsToRemove = [...this.components];
            // 清除位掩码
            BitMask64Utils.clear(this._componentMask);
            // 使缓存失效
            this._componentCache = null;
            for (const component of componentsToRemove) {
                const componentType = component.constructor;
                if (this.scene?.componentStorageManager) {
                    this.scene.componentStorageManager.removeComponent(this.id, componentType);
                }
                component.onRemovedFromEntity();
            }
            this.notifyQuerySystems();
        }
        /**
         * 批量添加组件
         *
         * @param components - 要添加的组件数组
         * @returns 添加的组件数组
         */
        addComponents(components) {
            const addedComponents = [];
            for (const component of components) {
                try {
                    addedComponents.push(this.addComponent(component));
                }
                catch (error) {
                    Entity._logger.warn(`添加组件失败 ${getComponentInstanceTypeName(component)}:`, error);
                }
            }
            return addedComponents;
        }
        /**
         * 批量移除组件类型
         *
         * @param componentTypes - 要移除的组件类型数组
         * @returns 被移除的组件数组
         */
        removeComponentsByTypes(componentTypes) {
            const removedComponents = [];
            for (const componentType of componentTypes) {
                removedComponents.push(this.removeComponentByType(componentType));
            }
            return removedComponents;
        }
        /**
         * 获取所有指定类型的组件
         *
         * @param type - 组件类型
         * @returns 组件实例数组
         */
        getComponents(type) {
            const result = [];
            for (const component of this.components) {
                if (component instanceof type) {
                    result.push(component);
                }
            }
            return result;
        }
        /**
         * 获取指定基类的组件（支持继承查找）
         *
         * 与 getComponent() 不同，此方法使用 instanceof 检查，支持子类查找。
         * 性能比位掩码查询稍慢，但支持继承层次结构。
         *
         * @param baseType - 组件基类类型
         * @returns 第一个匹配的组件实例，如果不存在则返回 null
         *
         * @example
         * ```typescript
         * // 查找 CompositeNodeComponent 或其子类
         * const composite = entity.getComponentByType(CompositeNodeComponent);
         * if (composite) {
         *     // composite 可能是 SequenceNode, SelectorNode 等
         * }
         * ```
         */
        getComponentByType(baseType) {
            for (const component of this.components) {
                if (component instanceof baseType) {
                    return component;
                }
            }
            return null;
        }
        /**
         * 添加子实体
         *
         * @param child - 要添加的子实体
         * @returns 添加的子实体
         */
        addChild(child) {
            if (child === this) {
                throw new Error('Entity cannot be its own child');
            }
            if (child._parent === this) {
                return child; // 已经是子实体
            }
            if (child._parent) {
                child._parent.removeChild(child);
            }
            child._parent = this;
            this._children.push(child);
            if (!child.scene && this.scene) {
                child.scene = this.scene;
                this.scene.addEntity(child);
            }
            return child;
        }
        /**
         * 移除子实体
         *
         * @param child - 要移除的子实体
         * @returns 是否成功移除
         */
        removeChild(child) {
            const index = this._children.indexOf(child);
            if (index === -1) {
                return false;
            }
            this._children.splice(index, 1);
            child._parent = null;
            return true;
        }
        /**
         * 移除所有子实体
         */
        removeAllChildren() {
            const childrenToRemove = [...this._children];
            for (const child of childrenToRemove) {
                this.removeChild(child);
            }
        }
        /**
         * 根据名称查找子实体
         *
         * @param name - 子实体名称
         * @param recursive - 是否递归查找
         * @returns 找到的子实体或null
         */
        findChild(name, recursive = false) {
            for (const child of this._children) {
                if (child.name === name) {
                    return child;
                }
            }
            if (recursive) {
                for (const child of this._children) {
                    const found = child.findChild(name, true);
                    if (found) {
                        return found;
                    }
                }
            }
            return null;
        }
        /**
         * 根据标签查找子实体
         *
         * @param tag - 标签
         * @param recursive - 是否递归查找
         * @returns 找到的子实体数组
         */
        findChildrenByTag(tag, recursive = false) {
            const result = [];
            for (const child of this._children) {
                if (child.tag === tag) {
                    result.push(child);
                }
            }
            if (recursive) {
                for (const child of this._children) {
                    result.push(...child.findChildrenByTag(tag, true));
                }
            }
            return result;
        }
        /**
         * 获取根实体
         *
         * @returns 层次结构的根实体
         */
        getRoot() {
            if (!this._parent) {
                return this;
            }
            return this._parent.getRoot();
        }
        /**
         * 检查是否是指定实体的祖先
         *
         * @param entity - 要检查的实体
         * @returns 如果是祖先则返回true
         */
        isAncestorOf(entity) {
            let current = entity._parent;
            while (current) {
                if (current === this) {
                    return true;
                }
                current = current._parent;
            }
            return false;
        }
        /**
         * 检查是否是指定实体的后代
         *
         * @param entity - 要检查的实体
         * @returns 如果是后代则返回true
         */
        isDescendantOf(entity) {
            return entity.isAncestorOf(this);
        }
        /**
         * 获取层次深度
         *
         * @returns 在层次结构中的深度（根实体为0）
         */
        getDepth() {
            let depth = 0;
            let current = this._parent;
            while (current) {
                depth++;
                current = current._parent;
            }
            return depth;
        }
        /**
         * 遍历所有子实体（深度优先）
         *
         * @param callback - 对每个子实体执行的回调函数
         * @param recursive - 是否递归遍历
         */
        forEachChild(callback, recursive = false) {
            this._children.forEach((child, index) => {
                callback(child, index);
                if (recursive) {
                    child.forEachChild(callback, true);
                }
            });
        }
        /**
         * 活跃状态改变时的回调
         */
        onActiveChanged() {
            for (const component of this.components) {
                if ('onActiveChanged' in component && typeof component.onActiveChanged === 'function') {
                    component.onActiveChanged();
                }
            }
            if (this.scene && this.scene.eventSystem) {
                this.scene.eventSystem.emitSync('entity:activeChanged', {
                    entity: this,
                    active: this._active,
                    activeInHierarchy: this.activeInHierarchy
                });
            }
        }
        /**
         * 销毁实体
         *
         * 移除所有组件、子实体并标记为已销毁
         */
        destroy() {
            if (this._isDestroyed) {
                return;
            }
            this._isDestroyed = true;
            if (this.scene && this.scene.referenceTracker) {
                this.scene.referenceTracker.clearReferencesTo(this.id);
                this.scene.referenceTracker.unregisterEntityScene(this.id);
            }
            const childrenToDestroy = [...this._children];
            for (const child of childrenToDestroy) {
                child.destroy();
            }
            if (this._parent) {
                this._parent.removeChild(this);
            }
            this.removeAllComponents();
            if (this.scene) {
                if (this.scene.querySystem) {
                    this.scene.querySystem.removeEntity(this);
                }
                if (this.scene.entities) {
                    this.scene.entities.remove(this);
                }
            }
        }
        /**
         * 批量销毁所有子实体
         */
        destroyAllChildren() {
            if (this._children.length === 0)
                return;
            const scene = this.scene;
            const toDestroy = [];
            const collectChildren = (entity) => {
                for (const child of entity._children) {
                    toDestroy.push(child);
                    collectChildren(child);
                }
            };
            collectChildren(this);
            for (const entity of toDestroy) {
                entity.setDestroyedState(true);
            }
            for (const entity of toDestroy) {
                entity.removeAllComponents();
            }
            if (scene) {
                for (const entity of toDestroy) {
                    scene.entities.remove(entity);
                    scene.querySystem.removeEntity(entity);
                }
                scene.clearSystemEntityCaches();
            }
            this._children.length = 0;
        }
        /**
         * 比较实体
         *
         * @param other - 另一个实体
         * @returns 比较结果
         */
        compareTo(other) {
            return EntityComparer.prototype.compare(this, other);
        }
        /**
         * 获取实体的字符串表示
         *
         * @returns 实体的字符串描述
         */
        toString() {
            return `Entity[${this.name}:${this.id}]`;
        }
        /**
         * 获取实体的调试信息（包含组件缓存信息）
         *
         * @returns 包含实体详细信息的对象
         */
        getDebugInfo() {
            return {
                name: this.name,
                id: this.id,
                enabled: this._enabled,
                active: this._active,
                activeInHierarchy: this.activeInHierarchy,
                destroyed: this._isDestroyed,
                componentCount: this.components.length,
                componentTypes: this.components.map((c) => getComponentInstanceTypeName(c)),
                componentMask: BitMask64Utils.toString(this._componentMask, 2), // 二进制表示
                parentId: this._parent?.id || null,
                childCount: this._children.length,
                childIds: this._children.map((c) => c.id),
                depth: this.getDepth(),
                cacheBuilt: this._componentCache !== null
            };
        }
    }
    /**
     * Entity专用日志器
     */
    Entity._logger = createLogger('Entity');
    /**
     * 实体比较器实例
     */
    Entity.entityComparer = new EntityComparer();

    /**
     * 实体构建器 - 提供流式API创建和配置实体
     */
    class EntityBuilder {
        constructor(scene, storageManager) {
            this.scene = scene;
            this.storageManager = storageManager;
            const id = scene.identifierPool.checkOut();
            this.entity = new Entity('', id);
            this.entity.scene = this.scene;
        }
        /**
         * 设置实体名称
         * @param name 实体名称
         * @returns 实体构建器
         */
        named(name) {
            this.entity.name = name;
            return this;
        }
        /**
         * 设置实体标签
         * @param tag 标签
         * @returns 实体构建器
         */
        tagged(tag) {
            this.entity.tag = tag;
            return this;
        }
        /**
         * 添加组件
         * @param component 组件实例
         * @returns 实体构建器
         */
        with(component) {
            this.entity.addComponent(component);
            return this;
        }
        /**
         * 添加多个组件
         * @param components 组件数组
         * @returns 实体构建器
         */
        withComponents(...components) {
            for (const component of components) {
                this.entity.addComponent(component);
            }
            return this;
        }
        /**
         * 条件性添加组件
         * @param condition 条件
         * @param component 组件实例
         * @returns 实体构建器
         */
        withIf(condition, component) {
            if (condition) {
                this.entity.addComponent(component);
            }
            return this;
        }
        /**
         * 使用工厂函数创建并添加组件
         * @param factory 组件工厂函数
         * @returns 实体构建器
         */
        withFactory(factory) {
            const component = factory();
            this.entity.addComponent(component);
            return this;
        }
        /**
         * 配置组件属性
         * @param componentType 组件类型
         * @param configurator 配置函数
         * @returns 实体构建器
         */
        configure(componentType, configurator) {
            const component = this.entity.getComponent(componentType);
            if (component) {
                configurator(component);
            }
            return this;
        }
        /**
         * 设置实体为启用状态
         * @param enabled 是否启用
         * @returns 实体构建器
         */
        enabled(enabled = true) {
            this.entity.enabled = enabled;
            return this;
        }
        /**
         * 设置实体为活跃状态
         * @param active 是否活跃
         * @returns 实体构建器
         */
        active(active = true) {
            this.entity.active = active;
            return this;
        }
        /**
         * 添加子实体
         * @param childBuilder 子实体构建器
         * @returns 实体构建器
         */
        withChild(childBuilder) {
            const child = childBuilder.build();
            this.entity.addChild(child);
            return this;
        }
        /**
         * 批量添加子实体
         * @param childBuilders 子实体构建器数组
         * @returns 实体构建器
         */
        withChildren(...childBuilders) {
            for (const childBuilder of childBuilders) {
                const child = childBuilder.build();
                this.entity.addChild(child);
            }
            return this;
        }
        /**
         * 使用工厂函数创建子实体
         * @param childFactory 子实体工厂函数
         * @returns 实体构建器
         */
        withChildFactory(childFactory) {
            const childBuilder = childFactory(this.entity);
            const child = childBuilder.build();
            this.entity.addChild(child);
            return this;
        }
        /**
         * 条件性添加子实体
         * @param condition 条件
         * @param childBuilder 子实体构建器
         * @returns 实体构建器
         */
        withChildIf(condition, childBuilder) {
            if (condition) {
                const child = childBuilder.build();
                this.entity.addChild(child);
            }
            return this;
        }
        /**
         * 构建并返回实体
         * @returns 构建的实体
         */
        build() {
            return this.entity;
        }
        /**
         * 构建实体并添加到场景
         * @returns 构建的实体
         */
        spawn() {
            this.scene.addEntity(this.entity);
            return this.entity;
        }
        /**
         * 克隆当前构建器
         * @returns 新的实体构建器
         */
        clone() {
            const newBuilder = new EntityBuilder(this.scene, this.storageManager);
            // 这里需要深度克隆实体，简化实现
            newBuilder.entity = this.entity; // 实际应该是深度克隆
            return newBuilder;
        }
    }

    /**
     * 高性能实体列表管理器
     * 管理场景中的所有实体，支持快速查找和批量操作
     */
    class EntityList {
        get count() {
            return this.buffer.length;
        }
        constructor(scene) {
            this.buffer = [];
            // 索引映射，提升查找性能
            this._idToEntity = new Map();
            this._nameToEntities = new Map();
            // 延迟操作队列
            this._entitiesToAdd = [];
            this._entitiesToRemove = [];
            this._scene = scene;
        }
        /**
         * 添加实体
         * @param entity 要添加的实体
         */
        add(entity) {
            this.addImmediate(entity);
        }
        /**
         * 立即添加实体
         * @param entity 要添加的实体
         */
        addImmediate(entity) {
            // 检查是否已存在
            if (this._idToEntity.has(entity.id)) {
                return;
            }
            this.buffer.push(entity);
            this._idToEntity.set(entity.id, entity);
            // 更新名称索引
            this.updateNameIndex(entity, true);
        }
        /**
         * 移除实体
         * @param entity 要移除的实体
         */
        remove(entity) {
            this.removeImmediate(entity);
        }
        /**
         * 立即移除实体
         * @param entity 要移除的实体
         */
        removeImmediate(entity) {
            const index = this.buffer.indexOf(entity);
            if (index !== -1) {
                this.buffer.splice(index, 1);
                this._idToEntity.delete(entity.id);
                // 更新名称索引
                this.updateNameIndex(entity, false);
                // 回收实体ID到ID池
                if (this._scene && this._scene.identifierPool) {
                    this._scene.identifierPool.checkIn(entity.id);
                }
            }
        }
        /**
         * 移除所有实体
         */
        removeAllEntities() {
            // 收集所有实体ID用于回收
            const idsToRecycle = [];
            for (let i = this.buffer.length - 1; i >= 0; i--) {
                idsToRecycle.push(this.buffer[i].id);
                this.buffer[i].destroy();
            }
            // 批量回收ID
            if (this._scene && this._scene.identifierPool) {
                for (const id of idsToRecycle) {
                    this._scene.identifierPool.checkIn(id);
                }
            }
            this.buffer.length = 0;
            this._idToEntity.clear();
            this._nameToEntities.clear();
            this._entitiesToAdd.length = 0;
            this._entitiesToRemove.length = 0;
        }
        /**
         * 更新实体列表，处理延迟操作
         */
        updateLists() {
            // 处理延迟添加的实体
            if (this._entitiesToAdd.length > 0) {
                for (const entity of this._entitiesToAdd) {
                    this.addImmediate(entity);
                }
                this._entitiesToAdd.length = 0;
            }
            // 处理延迟移除的实体
            if (this._entitiesToRemove.length > 0) {
                for (const entity of this._entitiesToRemove) {
                    this.removeImmediate(entity);
                }
                this._entitiesToRemove.length = 0;
            }
        }
        /**
         * 更新实体列表
         *
         * 处理延迟操作（添加/删除实体）
         */
        update() {
            // 处理延迟操作
            this.updateLists();
        }
        /**
         * 根据名称查找实体（使用索引，O(1)复杂度）
         * @param name 实体名称
         * @returns 找到的第一个实体或null
         */
        findEntity(name) {
            const entities = this._nameToEntities.get(name);
            return entities && entities.length > 0 ? entities[0] : null;
        }
        /**
         * 根据名称查找所有实体
         * @param name 实体名称
         * @returns 找到的所有实体数组
         */
        findEntitiesByName(name) {
            return this._nameToEntities.get(name) || [];
        }
        /**
         * 根据ID查找实体（使用索引，O(1)复杂度）
         * @param id 实体ID
         * @returns 找到的实体或null
         */
        findEntityById(id) {
            return this._idToEntity.get(id) || null;
        }
        /**
         * 根据标签查找实体
         * @param tag 标签
         * @returns 找到的所有实体数组
         */
        findEntitiesByTag(tag) {
            const result = [];
            for (const entity of this.buffer) {
                if (entity.tag === tag) {
                    result.push(entity);
                }
            }
            return result;
        }
        /**
         * 根据组件类型查找实体
         * @param componentType 组件类型
         * @returns 找到的所有实体数组
         */
        findEntitiesWithComponent(componentType) {
            const result = [];
            for (const entity of this.buffer) {
                if (entity.hasComponent(componentType)) {
                    result.push(entity);
                }
            }
            return result;
        }
        /**
         * 批量操作：对所有实体执行指定操作
         * @param action 要执行的操作
         */
        forEach(action) {
            for (const entity of this.buffer) {
                action(entity);
            }
        }
        /**
         * 批量操作：对符合条件的实体执行指定操作
         * @param predicate 筛选条件
         * @param action 要执行的操作
         */
        forEachWhere(predicate, action) {
            for (const entity of this.buffer) {
                if (predicate(entity)) {
                    action(entity);
                }
            }
        }
        /**
         * 更新名称索引
         * @param entity 实体
         * @param isAdd 是否为添加操作
         */
        updateNameIndex(entity, isAdd) {
            if (!entity.name) {
                return;
            }
            if (isAdd) {
                let entities = this._nameToEntities.get(entity.name);
                if (!entities) {
                    entities = [];
                    this._nameToEntities.set(entity.name, entities);
                }
                entities.push(entity);
            }
            else {
                const entities = this._nameToEntities.get(entity.name);
                if (entities) {
                    const index = entities.indexOf(entity);
                    if (index !== -1) {
                        entities.splice(index, 1);
                        // 如果数组为空，删除映射
                        if (entities.length === 0) {
                            this._nameToEntities.delete(entity.name);
                        }
                    }
                }
            }
        }
        /**
         * 获取实体列表的统计信息
         * @returns 统计信息
         */
        getStats() {
            let activeCount = 0;
            for (const entity of this.buffer) {
                if (entity.enabled && !entity.isDestroyed) {
                    activeCount++;
                }
            }
            return {
                totalEntities: this.buffer.length,
                activeEntities: activeCount,
                pendingAdd: this._entitiesToAdd.length,
                pendingRemove: this._entitiesToRemove.length,
                nameIndexSize: this._nameToEntities.size
            };
        }
    }

    /**
     * 世代式ID池管理器
     *
     * 用于管理实体ID的分配和回收，支持世代版本控制以防止悬空引用问题。
     * 世代式ID由索引和版本组成，当ID被回收时版本会递增，确保旧引用失效。
     *
     * 支持动态扩展，理论上可以支持到65535个索引（16位），每个索引65535个版本（16位）。
     * 总计可以处理超过42亿个独特的ID组合，完全满足ECS大规模实体需求。
     *
     * @example
     * ```typescript
     * const pool = new IdentifierPool();
     *
     * // 分配ID
     * const id = pool.checkOut(); // 例如: 65536 (版本1，索引0)
     *
     * // 回收ID
     * pool.checkIn(id);
     *
     * // 验证ID是否有效
     * const isValid = pool.isValid(id); // false，因为版本已递增
     * ```
     */
    class IdentifierPool {
        /**
         * 构造函数
         *
         * @param recycleDelay 延迟回收时间（毫秒），默认为100ms
         * @param expansionBlockSize 内存扩展块大小，默认为1024
         */
        constructor(recycleDelay = 100, expansionBlockSize = 1024) {
            /**
             * 下一个可用的索引
             */
            this._nextAvailableIndex = 0;
            /**
             * 空闲的索引列表
             */
            this._freeIndices = [];
            /**
             * 每个索引对应的世代版本
             * 动态扩展的Map，按需分配内存
             */
            this._generations = new Map();
            /**
             * 延迟回收队列
             * 防止在同一帧内立即重用ID，避免时序问题
             */
            this._pendingRecycle = [];
            /**
             * 延迟回收时间（毫秒）
             */
            this._recycleDelay = 100;
            /**
             * 统计信息
             */
            this._stats = {
                totalAllocated: 0,
                totalRecycled: 0,
                currentActive: 0,
                memoryExpansions: 0
            };
            this._recycleDelay = recycleDelay;
            this._expansionBlockSize = expansionBlockSize;
            // 预分配第一个块的世代信息
            this._preAllocateGenerations(0, this._expansionBlockSize);
        }
        /**
         * 获取一个可用的ID
         *
         * 返回一个32位ID，高16位为世代版本，低16位为索引。
         *
         * @returns 新分配的实体ID
         * @throws {Error} 当达到索引限制时抛出错误
         */
        checkOut() {
            // 处理延迟回收队列
            this._processDelayedRecycle();
            let index;
            if (this._freeIndices.length > 0) {
                // 重用回收的索引
                index = this._freeIndices.pop();
            }
            else {
                // 分配新索引
                if (this._nextAvailableIndex > IdentifierPool.MAX_INDEX) {
                    throw new Error(`实体索引已达到框架设计限制 (${IdentifierPool.MAX_INDEX})。` +
                        '这意味着您已经分配了超过65535个不同的实体索引。' +
                        '这是16位索引设计的限制，考虑优化实体回收策略或升级到64位ID设计。');
                }
                index = this._nextAvailableIndex++;
                // 按需扩展世代存储
                this._ensureGenerationCapacity(index);
            }
            const generation = this._generations.get(index) || 1;
            this._stats.totalAllocated++;
            this._stats.currentActive++;
            return this._packId(index, generation);
        }
        /**
         * 回收一个ID
         *
         * 验证ID的有效性后，将其加入延迟回收队列。
         * ID不会立即可重用，而是在延迟时间后才真正回收。
         *
         * @param id 要回收的实体ID
         * @returns 是否成功回收（ID是否有效且未被重复回收）
         */
        checkIn(id) {
            const index = this._unpackIndex(id);
            const generation = this._unpackGeneration(id);
            // 验证ID有效性
            if (!this._isValidId(index, generation)) {
                return false;
            }
            // 检查是否已经在待回收队列中
            const alreadyPending = this._pendingRecycle.some((item) => item.index === index && item.generation === generation);
            if (alreadyPending) {
                return false; // 已经在回收队列中，拒绝重复回收
            }
            // 加入延迟回收队列
            this._pendingRecycle.push({
                index,
                generation,
                timestamp: Date.now()
            });
            this._stats.currentActive--;
            this._stats.totalRecycled++;
            return true;
        }
        /**
         * 验证ID是否有效
         *
         * 检查ID的索引和世代版本是否匹配当前状态。
         *
         * @param id 要验证的实体ID
         * @returns ID是否有效
         */
        isValid(id) {
            const index = this._unpackIndex(id);
            const generation = this._unpackGeneration(id);
            return this._isValidId(index, generation);
        }
        /**
         * 获取统计信息
         *
         * @returns 池的当前状态统计
         */
        getStats() {
            // 计算平均世代版本
            let totalGeneration = 0;
            let generationCount = 0;
            for (const [index, generation] of this._generations) {
                if (index < this._nextAvailableIndex) {
                    totalGeneration += generation;
                    generationCount++;
                }
            }
            const averageGeneration = generationCount > 0
                ? totalGeneration / generationCount
                : 1;
            return {
                totalAllocated: this._stats.totalAllocated,
                totalRecycled: this._stats.totalRecycled,
                currentActive: this._stats.currentActive,
                currentlyFree: this._freeIndices.length,
                pendingRecycle: this._pendingRecycle.length,
                maxPossibleEntities: IdentifierPool.MAX_INDEX + 1,
                maxUsedIndex: this._nextAvailableIndex - 1,
                memoryUsage: this._calculateMemoryUsage(),
                memoryExpansions: this._stats.memoryExpansions,
                averageGeneration: Math.round(averageGeneration * 100) / 100,
                generationStorageSize: this._generations.size
            };
        }
        /**
         * 强制执行延迟回收处理
         *
         * 在某些情况下可能需要立即处理延迟回收队列，
         * 比如内存压力大或者需要精确的统计信息时。
         */
        forceProcessDelayedRecycle() {
            this._processDelayedRecycle(true);
        }
        /**
         * 清理过期的延迟回收项
         *
         * 将超过延迟时间的回收项真正回收到空闲列表中。
         *
         * @param forceAll 是否强制处理所有延迟回收项
         * @private
         */
        _processDelayedRecycle(forceAll = false) {
            if (this._pendingRecycle.length === 0)
                return;
            const now = Date.now();
            const readyToRecycle = [];
            const stillPending = [];
            // 分离已到期和未到期的项
            for (const item of this._pendingRecycle) {
                if (forceAll || now - item.timestamp >= this._recycleDelay) {
                    readyToRecycle.push(item);
                }
                else {
                    stillPending.push(item);
                }
            }
            // 处理到期的回收项
            for (const item of readyToRecycle) {
                // 再次验证ID有效性（防止重复回收）
                if (this._isValidId(item.index, item.generation)) {
                    // 递增世代版本
                    let newGeneration = item.generation + 1;
                    // 防止世代版本溢出
                    if (newGeneration > IdentifierPool.MAX_GENERATION) {
                        newGeneration = 1; // 重置为1而不是0
                    }
                    this._generations.set(item.index, newGeneration);
                    // 添加到空闲列表
                    this._freeIndices.push(item.index);
                }
            }
            // 更新待回收队列
            this._pendingRecycle = stillPending;
        }
        /**
         * 预分配世代信息
         *
         * @param startIndex 起始索引
         * @param count 分配数量
         * @private
         */
        _preAllocateGenerations(startIndex, count) {
            for (let i = 0; i < count; i++) {
                const index = startIndex + i;
                if (index <= IdentifierPool.MAX_INDEX) {
                    this._generations.set(index, 1);
                }
            }
            this._stats.memoryExpansions++;
        }
        /**
         * 确保指定索引的世代信息存在
         *
         * @param index 索引
         * @private
         */
        _ensureGenerationCapacity(index) {
            if (!this._generations.has(index)) {
                // 计算需要扩展的起始位置
                const expansionStart = Math.floor(index / this._expansionBlockSize) * this._expansionBlockSize;
                // 预分配一个块
                this._preAllocateGenerations(expansionStart, this._expansionBlockSize);
            }
        }
        /**
         * 计算内存使用量
         *
         * @returns 内存使用字节数
         * @private
         */
        _calculateMemoryUsage() {
            const generationMapSize = this._generations.size * 16; // Map overhead + number pair
            const freeIndicesSize = this._freeIndices.length * 8;
            const pendingRecycleSize = this._pendingRecycle.length * 32;
            return generationMapSize + freeIndicesSize + pendingRecycleSize;
        }
        /**
         * 打包索引和世代为32位ID
         *
         * @param index 索引（16位）
         * @param generation 世代版本（16位）
         * @returns 打包后的32位ID
         * @private
         */
        _packId(index, generation) {
            return (generation << 16) | index;
        }
        /**
         * 从ID中解包索引
         *
         * @param id 32位ID
         * @returns 索引部分（16位）
         * @private
         */
        _unpackIndex(id) {
            return id & 0xFFFF;
        }
        /**
         * 从ID中解包世代版本
         *
         * @param id 32位ID
         * @returns 世代版本部分（16位）
         * @private
         */
        _unpackGeneration(id) {
            return (id >>> 16) & 0xFFFF;
        }
        /**
         * 内部ID有效性检查
         *
         * @param index 索引
         * @param generation 世代版本
         * @returns 是否有效
         * @private
         */
        _isValidId(index, generation) {
            if (index < 0 || index >= this._nextAvailableIndex) {
                return false;
            }
            const currentGeneration = this._generations.get(index);
            return currentGeneration !== undefined && currentGeneration === generation;
        }
    }
    /**
     * 最大索引限制（16位）
     * 这是框架设计选择：16位索引 + 16位版本 = 32位ID，确保高效位操作
     * 不是硬件限制，而是性能和内存效率的权衡
     */
    IdentifierPool.MAX_INDEX = 0xFFFF; // 65535
    /**
     * 最大世代限制（16位）
     */
    IdentifierPool.MAX_GENERATION = 0xFFFF; // 65535

    /**
     * 实体匹配条件描述符
     *
     * 用于描述实体查询条件，不执行实际查询
     *
     * @example
     * ```typescript
     * const matcher = Matcher.all(Position, Velocity)
     *   .any(Health, Shield)
     *   .none(Dead);
     *
     * // 获取查询条件
     * const condition = matcher.getCondition();
     * ```
     */
    class Matcher {
        constructor() {
            this.condition = {
                all: [],
                any: [],
                none: []
            };
            // 私有构造函数，只能通过静态方法创建
        }
        /**
         * 创建匹配器，要求所有指定的组件
         * @param types 组件类型
         */
        static all(...types) {
            const matcher = new Matcher();
            return matcher.all(...types);
        }
        /**
         * 创建匹配器，要求至少一个指定的组件
         * @param types 组件类型
         */
        static any(...types) {
            const matcher = new Matcher();
            return matcher.any(...types);
        }
        /**
         * 创建匹配器，排除指定的组件
         * @param types 组件类型
         */
        static none(...types) {
            const matcher = new Matcher();
            return matcher.none(...types);
        }
        /**
         * 创建按标签查询的匙配器
         * @param tag 标签值
         */
        static byTag(tag) {
            const matcher = new Matcher();
            return matcher.withTag(tag);
        }
        /**
         * 创建按名称查询的匙配器
         * @param name 实体名称
         */
        static byName(name) {
            const matcher = new Matcher();
            return matcher.withName(name);
        }
        /**
         * 创建单组件查询的匙配器
         * @param componentType 组件类型
         */
        static byComponent(componentType) {
            const matcher = new Matcher();
            return matcher.withComponent(componentType);
        }
        /**
         * 创建复杂查询构建器
         */
        static complex() {
            return new Matcher();
        }
        /**
         * 创建空匙配器
         */
        static empty() {
            return new Matcher();
        }
        /**
         * 必须包含所有指定组件
         * @param types 组件类型
         */
        all(...types) {
            this.condition.all.push(...types);
            return this;
        }
        /**
         * 必须包含至少一个指定组件
         * @param types 组件类型
         */
        any(...types) {
            this.condition.any.push(...types);
            return this;
        }
        /**
         * 不能包含任何指定组件
         * @param types 组件类型
         */
        none(...types) {
            this.condition.none.push(...types);
            return this;
        }
        /**
         * 排除指定组件（别名方法）
         * @param types 组件类型
         */
        exclude(...types) {
            return this.none(...types);
        }
        /**
         * 至少包含其中之一（别名方法）
         * @param types 组件类型
         */
        one(...types) {
            return this.any(...types);
        }
        /**
         * 按标签查询
         * @param tag 标签值
         */
        withTag(tag) {
            this.condition.tag = tag;
            return this;
        }
        /**
         * 按名称查询
         * @param name 实体名称
         */
        withName(name) {
            this.condition.name = name;
            return this;
        }
        /**
         * 单组件查询
         * @param componentType 组件类型
         */
        withComponent(componentType) {
            this.condition.component = componentType;
            return this;
        }
        /**
         * 移除标签条件
         */
        withoutTag() {
            delete this.condition.tag;
            return this;
        }
        /**
         * 移除名称条件
         */
        withoutName() {
            delete this.condition.name;
            return this;
        }
        /**
         * 移除单组件条件
         */
        withoutComponent() {
            delete this.condition.component;
            return this;
        }
        /**
         * 获取查询条件（只读）
         */
        getCondition() {
            return {
                all: [...this.condition.all],
                any: [...this.condition.any],
                none: [...this.condition.none],
                ...(this.condition.tag !== undefined && { tag: this.condition.tag }),
                ...(this.condition.name !== undefined && { name: this.condition.name }),
                ...(this.condition.component !== undefined && { component: this.condition.component })
            };
        }
        /**
         * 检查是否为空条件
         */
        isEmpty() {
            return this.condition.all.length === 0 &&
                this.condition.any.length === 0 &&
                this.condition.none.length === 0 &&
                this.condition.tag === undefined &&
                this.condition.name === undefined &&
                this.condition.component === undefined;
        }
        /**
         * 重置所有条件
         */
        reset() {
            this.condition.all.length = 0;
            this.condition.any.length = 0;
            this.condition.none.length = 0;
            delete this.condition.tag;
            delete this.condition.name;
            delete this.condition.component;
            return this;
        }
        /**
         * 克隆匹配器
         */
        clone() {
            const cloned = new Matcher();
            cloned.condition.all.push(...this.condition.all);
            cloned.condition.any.push(...this.condition.any);
            cloned.condition.none.push(...this.condition.none);
            if (this.condition.tag !== undefined) {
                cloned.condition.tag = this.condition.tag;
            }
            if (this.condition.name !== undefined) {
                cloned.condition.name = this.condition.name;
            }
            if (this.condition.component !== undefined) {
                cloned.condition.component = this.condition.component;
            }
            return cloned;
        }
        /**
         * 字符串表示
         */
        toString() {
            const parts = [];
            if (this.condition.all.length > 0) {
                parts.push(`all(${this.condition.all.map((t) => getComponentTypeName(t)).join(', ')})`);
            }
            if (this.condition.any.length > 0) {
                parts.push(`any(${this.condition.any.map((t) => getComponentTypeName(t)).join(', ')})`);
            }
            if (this.condition.none.length > 0) {
                parts.push(`none(${this.condition.none.map((t) => getComponentTypeName(t)).join(', ')})`);
            }
            if (this.condition.tag !== undefined) {
                parts.push(`tag(${this.condition.tag})`);
            }
            if (this.condition.name !== undefined) {
                parts.push(`name(${this.condition.name})`);
            }
            if (this.condition.component !== undefined) {
                parts.push(`component(${getComponentTypeName(this.condition.component)})`);
            }
            return `Matcher[${parts.join(' & ')}]`;
        }
    }

    /**
     * 实体缓存管理器
     *
     * 负责管理 EntitySystem 中的实体缓存，提供帧缓存和持久缓存两级缓存机制。
     * 使用面向对象设计，将数据和行为封装在类中。
     *
     * @example
     * ```typescript
     * const cache = new EntityCache();
     * cache.setPersistent(entities);
     * const cached = cache.getPersistent();
     * cache.invalidate();
     * ```
     */
    class EntityCache {
        constructor() {
            /**
             * 帧缓存
             *
             * 在update周期内使用，每帧结束后清理
             */
            this._frameCache = null;
            /**
             * 持久缓存
             *
             * 跨帧使用，直到被显式失效
             */
            this._persistentCache = null;
            /**
             * 被跟踪的实体集合
             *
             * 用于跟踪哪些实体正在被此系统处理
             */
            this._trackedEntities = new Set();
        }
        /**
         * 获取帧缓存
         */
        getFrame() {
            return this._frameCache;
        }
        /**
         * 设置帧缓存
         *
         * @param entities 要缓存的实体列表
         */
        setFrame(entities) {
            this._frameCache = entities;
        }
        /**
         * 获取持久缓存
         */
        getPersistent() {
            return this._persistentCache;
        }
        /**
         * 设置持久缓存
         *
         * @param entities 要缓存的实体列表
         */
        setPersistent(entities) {
            this._persistentCache = entities;
        }
        /**
         * 获取被跟踪的实体集合
         */
        getTracked() {
            return this._trackedEntities;
        }
        /**
         * 添加被跟踪的实体
         *
         * @param entity 要跟踪的实体
         */
        addTracked(entity) {
            this._trackedEntities.add(entity);
        }
        /**
         * 移除被跟踪的实体
         *
         * @param entity 要移除的实体
         */
        removeTracked(entity) {
            this._trackedEntities.delete(entity);
        }
        /**
         * 检查实体是否被跟踪
         *
         * @param entity 要检查的实体
         */
        isTracked(entity) {
            return this._trackedEntities.has(entity);
        }
        /**
         * 使持久缓存失效
         *
         * 当实体变化时调用，强制下次查询时重新计算
         */
        invalidate() {
            this._persistentCache = null;
        }
        /**
         * 清除帧缓存
         *
         * 在每帧结束时调用
         */
        clearFrame() {
            this._frameCache = null;
        }
        /**
         * 清除所有缓存
         *
         * 在系统重置或销毁时调用
         */
        clearAll() {
            this._frameCache = null;
            this._persistentCache = null;
            this._trackedEntities.clear();
        }
        /**
         * 检查是否有有效的持久缓存
         */
        hasPersistent() {
            return this._persistentCache !== null;
        }
        /**
         * 检查是否有有效的帧缓存
         */
        hasFrame() {
            return this._frameCache !== null;
        }
        /**
         * 获取缓存统计信息
         */
        getStats() {
            return {
                hasFrame: this._frameCache !== null,
                hasPersistent: this._persistentCache !== null,
                trackedCount: this._trackedEntities.size,
                frameEntityCount: this._frameCache?.length ?? 0,
                persistentEntityCount: this._persistentCache?.length ?? 0
            };
        }
    }

    /**
     * 实体系统的基类
     *
     * 用于处理一组符合特定条件的实体。系统是ECS架构中的逻辑处理单元，
     * 负责对拥有特定组件组合的实体执行业务逻辑。
     *
     * 支持泛型参数以提供类型安全的组件访问：
     *
     * @template TComponents - 系统需要的组件类型数组
     *
     * @example
     * ```typescript
     * // 传统方式
     * class MovementSystem extends EntitySystem {
     *     constructor() {
     *         super(Matcher.empty().all(Transform, Velocity));
     *     }
     *
     *     protected process(entities: readonly Entity[]): void {
     *         for (const entity of entities) {
     *             const transform = entity.getComponent(Transform);
     *             const velocity = entity.getComponent(Velocity);
     *             transform.position.add(velocity.value);
     *         }
     *     }
     * }
     *
     * // 类型安全方式
     * class MovementSystem extends EntitySystem<[typeof Transform, typeof Velocity]> {
     *     constructor() {
     *         super(Matcher.empty().all(Transform, Velocity));
     *     }
     *
     *     protected process(entities: readonly Entity[]): void {
     *         for (const entity of entities) {
     *             // 类型安全的组件访问
     *             const [transform, velocity] = this.getComponents(entity);
     *             transform.position.add(velocity.value);
     *         }
     *     }
     * }
     * ```
     */
    class EntitySystem {
        /**
         * 获取系统处理的实体列表
         */
        get entities() {
            // 如果在update周期内，优先使用帧缓存
            const frameCache = this._entityCache.getFrame();
            if (frameCache !== null) {
                return frameCache;
            }
            // 否则使用持久缓存
            if (!this._entityCache.hasPersistent()) {
                this._entityCache.setPersistent(this.queryEntities());
            }
            return this._entityCache.getPersistent();
        }
        /**
         * 获取系统的更新时序
         */
        get updateOrder() {
            return this._updateOrder;
        }
        set updateOrder(value) {
            this.setUpdateOrder(value);
        }
        /**
         * 获取系统的启用状态
         */
        get enabled() {
            return this._enabled;
        }
        /**
         * 设置系统的启用状态
         */
        set enabled(value) {
            this._enabled = value;
        }
        /**
         * 获取系统名称
         */
        get systemName() {
            return this._systemName;
        }
        constructor(matcher) {
            this._updateOrder = 0;
            this._enabled = true;
            this._performanceMonitor = null;
            this._systemName = getSystemInstanceTypeName(this);
            this._initialized = false;
            this._matcher = matcher || Matcher.empty();
            this._eventListeners = [];
            this._scene = null;
            this._destroyed = false;
            this._entityIdMap = null;
            this._entityIdMapVersion = -1;
            // 初始化logger
            this.logger = createLogger(this.getLoggerName());
            this._entityCache = new EntityCache();
        }
        /**
         * 这个系统所属的场景
         */
        get scene() {
            return this._scene;
        }
        set scene(value) {
            this._scene = value;
        }
        /**
         * 设置性能监控器
         */
        setPerformanceMonitor(monitor) {
            this._performanceMonitor = monitor;
        }
        /**
         * 获取性能监控器
         */
        getPerformanceMonitor() {
            if (!this._performanceMonitor) {
                throw new Error(`${this._systemName}: PerformanceMonitor未注入，请确保在Core.create()之后再添加System到Scene`);
            }
            return this._performanceMonitor;
        }
        /**
         * 获取实体匹配器
         */
        get matcher() {
            return this._matcher;
        }
        /**
         * 设置更新时序
         * @param order 更新时序
         */
        setUpdateOrder(order) {
            if (this._updateOrder === order)
                return;
            this._updateOrder = order;
            this._scene?.markSystemsOrderDirty();
        }
        /**
         * 系统初始化（框架调用）
         *
         * 在系统创建时调用。框架内部使用，用户不应直接调用。
         */
        initialize() {
            // 防止重复初始化
            if (this._initialized) {
                return;
            }
            this._initialized = true;
            // 框架内部初始化：触发一次实体查询，以便正确跟踪现有实体
            if (this.scene) {
                // 清理缓存确保初始化时重新查询
                this._entityCache.invalidate();
                this.queryEntities();
            }
            // 调用用户可重写的初始化方法
            this.onInitialize();
        }
        /**
         * 系统初始化回调
         *
         * 子类可以重写此方法进行初始化操作。
         */
        onInitialize() {
            // 子类可以重写此方法进行初始化
        }
        /**
         * 清除实体缓存（内部使用）
         * 当Scene中的实体发生变化时调用
         */
        clearEntityCache() {
            this._entityCache.invalidate();
        }
        /**
         * 重置系统状态
         *
         * 当系统从场景中移除时调用，重置初始化状态以便重新添加时能正确初始化。
         *
         * 注意：此方法由 Scene.removeEntityProcessor 调用，在 unregister（触发dispose）之后调用。
         * dispose 已经调用了 onDestroy 并设置了 _destroyed 标志，所以这里不需要重置该标志。
         * 重置 _destroyed 会违反服务容器的语义（dispose 后不应重用）。
         */
        reset() {
            // 如果系统已经被销毁，不需要再次调用destroy
            if (this._destroyed) {
                return;
            }
            this.scene = null;
            this._initialized = false;
            this._entityCache.clearAll();
            // 清理实体ID映射缓存
            this._entityIdMap = null;
            this._entityIdMapVersion = -1;
            // 清理所有事件监听器并调用销毁回调
            this.destroy();
        }
        /**
         * 查询匹配的实体
         */
        queryEntities() {
            if (!this.scene?.querySystem || !this._matcher) {
                return [];
            }
            const condition = this._matcher.getCondition();
            const querySystem = this.scene.querySystem;
            let currentEntities = [];
            // 空条件返回所有实体
            if (this._matcher.isEmpty()) {
                currentEntities = querySystem.getAllEntities();
            }
            else if (this.isSingleCondition(condition)) {
                // 单一条件优化查询
                currentEntities = this.executeSingleConditionQuery(condition, querySystem);
            }
            else {
                // 复合查询
                currentEntities = this.executeComplexQuery(condition, querySystem);
            }
            // 检查实体变化并触发回调
            this.updateEntityTracking(currentEntities);
            return currentEntities;
        }
        /**
         * 检查是否为单一条件查询
         *
         * 使用位运算优化多条件检测。将每种查询条件映射到不同的位：
         * - all: 第0位 (1)
         * - any: 第1位 (2)
         * - none: 第2位 (4)
         * - tag: 第3位 (8)
         * - name: 第4位 (16)
         * - component: 第5位 (32)
         */
        isSingleCondition(condition) {
            // 使用位OR运算合并所有条件标记
            const flags = (condition.all.length > 0 ? 1 : 0) |
                (condition.any.length > 0 ? 2 : 0) |
                (condition.none.length > 0 ? 4 : 0) |
                (condition.tag !== undefined ? 8 : 0) |
                (condition.name !== undefined ? 16 : 0) |
                (condition.component !== undefined ? 32 : 0);
            // 位运算技巧：如果只有一个位被设置，则 flags & (flags - 1) == 0
            // 例如：flags=4 (100), flags-1=3 (011), 4&3=0
            // 但如果 flags=6 (110), flags-1=5 (101), 6&5=4≠0
            return flags !== 0 && (flags & (flags - 1)) === 0;
        }
        /**
         * 执行单一条件查询
         */
        executeSingleConditionQuery(condition, querySystem) {
            // 按标签查询
            if (condition.tag !== undefined) {
                return querySystem.queryByTag(condition.tag).entities;
            }
            // 按名称查询
            if (condition.name !== undefined) {
                return querySystem.queryByName(condition.name).entities;
            }
            // 单组件查询
            if (condition.component !== undefined) {
                return querySystem.queryByComponent(condition.component).entities;
            }
            // 基础组件查询
            if (condition.all.length > 0 && condition.any.length === 0 && condition.none.length === 0) {
                return querySystem.queryAll(...condition.all).entities;
            }
            if (condition.all.length === 0 && condition.any.length > 0 && condition.none.length === 0) {
                return querySystem.queryAny(...condition.any).entities;
            }
            if (condition.all.length === 0 && condition.any.length === 0 && condition.none.length > 0) {
                return querySystem.queryNone(...condition.none).entities;
            }
            return [];
        }
        /**
         * 执行复合查询
         */
        executeComplexQueryWithIdSets(condition, querySystem) {
            let resultIds = null;
            // 1. 应用标签条件作为基础集合
            if (condition.tag !== undefined) {
                const tagResult = querySystem.queryByTag(condition.tag);
                resultIds = this.extractEntityIds(tagResult.entities);
            }
            // 2. 应用名称条件 (交集)
            if (condition.name !== undefined) {
                const nameIds = this.extractEntityIds(querySystem.queryByName(condition.name).entities);
                resultIds = resultIds ? this.intersectIdSets(resultIds, nameIds) : nameIds;
            }
            // 3. 应用单组件条件 (交集)
            if (condition.component !== undefined) {
                const componentIds = this.extractEntityIds(querySystem.queryByComponent(condition.component).entities);
                resultIds = resultIds ? this.intersectIdSets(resultIds, componentIds) : componentIds;
            }
            // 4. 应用all条件 (交集)
            if (condition.all.length > 0) {
                const allIds = this.extractEntityIds(querySystem.queryAll(...condition.all).entities);
                resultIds = resultIds ? this.intersectIdSets(resultIds, allIds) : allIds;
            }
            // 5. 应用any条件 (交集)
            if (condition.any.length > 0) {
                const anyIds = this.extractEntityIds(querySystem.queryAny(...condition.any).entities);
                resultIds = resultIds ? this.intersectIdSets(resultIds, anyIds) : anyIds;
            }
            // 6. 应用none条件 (差集)
            if (condition.none.length > 0) {
                if (!resultIds) {
                    resultIds = this.extractEntityIds(querySystem.getAllEntities());
                }
                const noneResult = querySystem.queryAny(...condition.none);
                const noneIds = this.extractEntityIds(noneResult.entities);
                resultIds = this.differenceIdSets(resultIds, noneIds);
            }
            return resultIds ? this.idSetToEntityArray(resultIds, querySystem.getAllEntities()) : [];
        }
        /**
         * 提取实体ID集合
         */
        extractEntityIds(entities) {
            const len = entities.length;
            const idSet = new Set();
            for (let i = 0; i < len; i = (i + 1) | 0) {
                idSet.add(entities[i].id | 0);
            }
            return idSet;
        }
        /**
         * ID集合交集运算
         */
        intersectIdSets(setA, setB) {
            let smaller, larger;
            if (setA.size <= setB.size) {
                smaller = setA;
                larger = setB;
            }
            else {
                smaller = setB;
                larger = setA;
            }
            const result = new Set();
            for (const id of smaller) {
                if (larger.has(id)) {
                    result.add(id);
                }
            }
            return result;
        }
        /**
         * ID集合差集运算
         */
        differenceIdSets(setA, setB) {
            const result = new Set();
            for (const id of setA) {
                if (!setB.has(id)) {
                    result.add(id);
                }
            }
            return result;
        }
        /**
         * 获取或构建实体ID映射
         */
        getEntityIdMap(allEntities) {
            const currentVersion = this.scene?.querySystem?.version ?? 0;
            if (this._entityIdMap !== null && this._entityIdMapVersion === currentVersion) {
                return this._entityIdMap;
            }
            return this.rebuildEntityIdMap(allEntities, currentVersion);
        }
        /**
         * 重建实体ID映射
         */
        rebuildEntityIdMap(allEntities, version) {
            let entityMap = this._entityIdMap;
            if (!entityMap) {
                entityMap = new Map();
            }
            else {
                entityMap.clear();
            }
            const len = allEntities.length;
            for (let i = 0; i < len; i = (i + 1) | 0) {
                const entity = allEntities[i];
                entityMap.set(entity.id | 0, entity);
            }
            this._entityIdMap = entityMap;
            this._entityIdMapVersion = version;
            return entityMap;
        }
        /**
         * 从ID集合构建Entity数组
         */
        idSetToEntityArray(idSet, allEntities) {
            const entityMap = this.getEntityIdMap(allEntities);
            const size = idSet.size;
            const result = new Array(size);
            let index = 0;
            for (const id of idSet) {
                const entity = entityMap.get(id);
                if (entity !== undefined) {
                    result[index] = entity;
                    index = (index + 1) | 0;
                }
            }
            if (index < size) {
                result.length = index;
            }
            return result;
        }
        /**
         * 执行复合查询
         *
         * 使用基于ID集合的单次扫描算法进行复杂查询
         */
        executeComplexQuery(condition, querySystem) {
            return this.executeComplexQueryWithIdSets(condition, querySystem);
        }
        /**
         * 更新系统
         */
        update() {
            if (!this._enabled || !this.onCheckProcessing()) {
                return;
            }
            const monitor = this.getPerformanceMonitor();
            const startTime = monitor.startMonitoring(this._systemName);
            let entityCount = 0;
            try {
                this.onBegin();
                // 查询实体并存储到帧缓存中
                // 响应式查询会自动维护最新的实体列表，updateEntityTracking会在检测到变化时invalidate
                const queriedEntities = this.queryEntities();
                this._entityCache.setFrame(queriedEntities);
                entityCount = queriedEntities.length;
                this.process(queriedEntities);
            }
            finally {
                monitor.endMonitoring(this._systemName, startTime, entityCount);
            }
        }
        /**
         * 后期更新系统
         */
        lateUpdate() {
            if (!this._enabled || !this.onCheckProcessing()) {
                return;
            }
            const monitor = this.getPerformanceMonitor();
            const startTime = monitor.startMonitoring(`${this._systemName}_Late`);
            let entityCount = 0;
            try {
                // 使用缓存的实体列表，避免重复查询
                const entities = this._entityCache.getFrame() || [];
                entityCount = entities.length;
                this.lateProcess(entities);
                this.onEnd();
            }
            finally {
                monitor.endMonitoring(`${this._systemName}_Late`, startTime, entityCount);
                // 清理帧缓存
                this._entityCache.clearFrame();
            }
        }
        /**
         * 在系统处理开始前调用
         *
         * 子类可以重写此方法进行预处理操作。
         */
        onBegin() {
            // 子类可以重写此方法
        }
        /**
         * 处理实体列表
         *
         * 系统的核心逻辑，子类必须实现此方法来定义具体的处理逻辑。
         *
         * @param entities 要处理的实体列表
         */
        process(_entities) {
            // 子类必须实现此方法
        }
        /**
         * 后期处理实体列表
         *
         * 在主要处理逻辑之后执行，子类可以重写此方法。
         *
         * @param entities 要处理的实体列表
         */
        lateProcess(_entities) {
            // 子类可以重写此方法
        }
        /**
         * 系统处理完毕后调用
         *
         * 子类可以重写此方法进行后处理操作。
         */
        onEnd() {
            // 子类可以重写此方法
        }
        /**
         * 检查系统是否需要处理
         *
         * 在启用系统时有用，但仅偶尔需要处理。
         * 这只影响处理，不影响事件或订阅列表。
         *
         * @returns 如果系统应该处理，则为true，如果不处理则为false
         */
        onCheckProcessing() {
            return true;
        }
        /**
         * 获取系统的性能数据
         *
         * @returns 性能数据或undefined
         */
        getPerformanceData() {
            return this.getPerformanceMonitor().getSystemData(this._systemName);
        }
        /**
         * 获取系统的性能统计
         *
         * @returns 性能统计或undefined
         */
        getPerformanceStats() {
            return this.getPerformanceMonitor().getSystemStats(this._systemName);
        }
        /**
         * 重置系统的性能数据
         */
        resetPerformanceData() {
            this.getPerformanceMonitor().resetSystem(this._systemName);
        }
        /**
         * 获取系统信息的字符串表示
         *
         * @returns 系统信息字符串
         */
        toString() {
            const entityCount = this.entities.length;
            const perfData = this.getPerformanceData();
            const perfInfo = perfData ? ` (${perfData.executionTime.toFixed(2)}ms)` : '';
            return `${this._systemName}[${entityCount} entities]${perfInfo}`;
        }
        /**
         * 更新实体跟踪，检查新增和移除的实体
         */
        updateEntityTracking(currentEntities) {
            const currentSet = new Set(currentEntities);
            let hasChanged = false;
            // 检查新增的实体
            for (const entity of currentEntities) {
                if (!this._entityCache.isTracked(entity)) {
                    this._entityCache.addTracked(entity);
                    this.onAdded(entity);
                    hasChanged = true;
                }
            }
            // 检查移除的实体
            for (const entity of this._entityCache.getTracked()) {
                if (!currentSet.has(entity)) {
                    this._entityCache.removeTracked(entity);
                    this.onRemoved(entity);
                    hasChanged = true;
                }
            }
            // 如果实体发生了变化，使缓存失效
            if (hasChanged) {
                this._entityCache.invalidate();
            }
        }
        /**
         * 当实体被添加到系统时调用
         *
         * 子类可以重写此方法来处理实体添加事件。
         *
         * @param entity 被添加的实体
         */
        onAdded(_entity) {
            // 子类可以重写此方法
        }
        /**
         * 当实体从系统中移除时调用
         *
         * 子类可以重写此方法来处理实体移除事件。
         *
         * @param entity 被移除的实体
         */
        onRemoved(_entity) {
            // 子类可以重写此方法
        }
        /**
         * 释放系统资源
         *
         * 实现IService接口要求的dispose方法。
         * 当系统从Scene中移除或Scene销毁时调用。
         *
         * 默认行为：
         * - 移除所有事件监听器
         * - 调用 onDestroy 回调（仅首次）
         * - 清空所有缓存
         * - 重置初始化状态
         *
         * 子类可以重写此方法来清理自定义资源，但应该调用super.dispose()。
         */
        dispose() {
            // 防止重复销毁
            if (this._destroyed) {
                return;
            }
            // 移除所有事件监听器
            this.cleanupManualEventListeners();
            // 调用用户销毁回调
            this.onDestroy();
            // 清空所有缓存
            this._entityCache.clearAll();
            this._entityIdMap = null;
            // 重置状态
            this._initialized = false;
            this._scene = null;
            this._destroyed = true;
            this.logger.debug(`System ${this._systemName} disposed`);
        }
        /**
         * 添加事件监听器
         *
         * 推荐使用此方法而不是直接调用eventSystem.on()，
         * 这样可以确保系统移除时自动清理监听器，避免内存泄漏。
         *
         * @param eventType 事件类型
         * @param handler 事件处理函数
         * @param config 监听器配置
         * @returns 监听器引用ID，可用于手动移除监听器
         */
        addEventListener(eventType, handler, config) {
            if (!this.scene?.eventSystem) {
                this.logger.warn(`${this.systemName}: 无法添加事件监听器，scene.eventSystem 不可用`);
                return null;
            }
            const listenerRef = this.scene.eventSystem.on(eventType, handler, config);
            // 跟踪监听器以便后续清理
            if (listenerRef) {
                this._eventListeners.push({
                    eventSystem: this.scene.eventSystem,
                    eventType,
                    listenerRef
                });
            }
            return listenerRef;
        }
        /**
         * 移除特定的事件监听器
         *
         * @param eventType 事件类型
         * @param listenerRef 监听器引用ID（由 addEventListener 返回）
         */
        removeEventListener(eventType, listenerRef) {
            const listenerIndex = this._eventListeners.findIndex((listener) => listener.eventType === eventType && listener.listenerRef === listenerRef);
            if (listenerIndex >= 0) {
                const listener = this._eventListeners[listenerIndex];
                if (!listener)
                    return;
                // 从事件系统中移除
                listener.eventSystem.off(eventType, listener.listenerRef);
                // 从跟踪列表中移除
                this._eventListeners.splice(listenerIndex, 1);
            }
        }
        /**
         * 清理手动添加的事件监听器
         */
        cleanupManualEventListeners() {
            for (const listener of this._eventListeners) {
                try {
                    listener.eventSystem.off(listener.eventType, listener.listenerRef);
                }
                catch (error) {
                    this.logger.warn(`${this.systemName}: 移除事件监听器失败 "${listener.eventType}"`, error);
                }
            }
            // 清空跟踪列表
            this._eventListeners.length = 0;
        }
        /**
         * 框架内部销毁方法
         * 由框架调用，处理系统的完整销毁流程
         */
        destroy() {
            // 防止重复销毁
            if (this._destroyed) {
                return;
            }
            this.cleanupManualEventListeners();
            this._destroyed = true;
            this.onDestroy();
        }
        /**
         * 获取Logger名称
         * 默认返回类的构造函数名称, 子类可以重写此方法来自定义logger名称
         */
        getLoggerName() {
            return getSystemInstanceTypeName(this);
        }
        /**
         * 用户销毁回调
         *
         * 当系统从场景中移除时调用，子类可以重写此方法进行清理操作。
         * 注意：事件监听器会被框架自动清理，无需手动处理。
         */
        onDestroy() {
            // 子类可以重写此方法进行清理操作
        }
        // ============================================================
        // 类型安全的辅助方法
        // ============================================================
        /**
         * 类型安全地获取单个组件
         *
         * 相比Entity.getComponent，此方法保证返回非空值，
         * 如果组件不存在会抛出错误而不是返回null
         *
         * @param entity 实体
         * @param componentType 组件类型
         * @returns 组件实例（保证非空）
         * @throws 如果组件不存在则抛出错误
         *
         * @example
         * ```typescript
         * protected process(entities: readonly Entity[]): void {
         *     for (const entity of entities) {
         *         const transform = this.requireComponent(entity, Transform);
         *         // transform 保证非空，类型为 Transform
         *     }
         * }
         * ```
         */
        requireComponent(entity, componentType) {
            const component = entity.getComponent(componentType);
            if (!component) {
                throw new Error(`Component ${componentType.name} not found on entity ${entity.name} in ${this.systemName}`);
            }
            return component;
        }
        /**
         * 批量获取实体的所有必需组件
         *
         * 根据泛型参数TComponents推断返回类型，
         * 返回一个元组，包含所有组件实例
         *
         * @param entity 实体
         * @param components 组件类型数组
         * @returns 组件实例元组
         *
         * @example
         * ```typescript
         * class MySystem extends EntitySystem<[typeof Position, typeof Velocity]> {
         *     protected process(entities: readonly Entity[]): void {
         *         for (const entity of entities) {
         *             const [pos, vel] = this.getComponents(entity, Position, Velocity);
         *             // pos: Position, vel: Velocity (自动类型推断)
         *             pos.x += vel.x;
         *         }
         *     }
         * }
         * ```
         */
        getComponents(entity, ...components) {
            return components.map((type) => this.requireComponent(entity, type));
        }
        /**
         * 遍历实体并处理每个实体
         *
         * 提供更简洁的语法糖，避免手动遍历
         *
         * @param entities 实体列表
         * @param processor 处理函数
         *
         * @example
         * ```typescript
         * protected process(entities: readonly Entity[]): void {
         *     this.forEach(entities, (entity) => {
         *         const transform = this.requireComponent(entity, Transform);
         *         transform.position.y -= 9.8 * Time.deltaTime;
         *     });
         * }
         * ```
         */
        forEach(entities, processor) {
            for (let i = 0; i < entities.length; i++) {
                processor(entities[i], i);
            }
        }
        /**
         * 过滤实体
         *
         * @param entities 实体列表
         * @param predicate 过滤条件
         * @returns 过滤后的实体数组
         *
         * @example
         * ```typescript
         * protected process(entities: readonly Entity[]): void {
         *     const activeEntities = this.filterEntities(entities, (entity) => {
         *         const health = this.requireComponent(entity, Health);
         *         return health.value > 0;
         *     });
         * }
         * ```
         */
        filterEntities(entities, predicate) {
            return Array.from(entities).filter(predicate);
        }
        /**
         * 映射实体到另一种类型
         *
         * @param entities 实体列表
         * @param mapper 映射函数
         * @returns 映射后的结果数组
         *
         * @example
         * ```typescript
         * protected process(entities: readonly Entity[]): void {
         *     const positions = this.mapEntities(entities, (entity) => {
         *         const transform = this.requireComponent(entity, Transform);
         *         return transform.position;
         *     });
         * }
         * ```
         */
        mapEntities(entities, mapper) {
            return Array.from(entities).map(mapper);
        }
        /**
         * 查找第一个满足条件的实体
         *
         * @param entities 实体列表
         * @param predicate 查找条件
         * @returns 第一个满足条件的实体，或undefined
         *
         * @example
         * ```typescript
         * protected process(entities: readonly Entity[]): void {
         *     const player = this.findEntity(entities, (entity) =>
         *         entity.hasComponent(PlayerTag)
         *     );
         * }
         * ```
         */
        findEntity(entities, predicate) {
            for (let i = 0; i < entities.length; i++) {
                if (predicate(entities[i], i)) {
                    return entities[i];
                }
            }
            return undefined;
        }
        /**
         * 检查是否存在满足条件的实体
         *
         * @param entities 实体列表
         * @param predicate 检查条件
         * @returns 是否存在满足条件的实体
         *
         * @example
         * ```typescript
         * protected process(entities: readonly Entity[]): void {
         *     const hasLowHealth = this.someEntity(entities, (entity) => {
         *         const health = this.requireComponent(entity, Health);
         *         return health.value < 20;
         *     });
         * }
         * ```
         */
        someEntity(entities, predicate) {
            for (let i = 0; i < entities.length; i++) {
                if (predicate(entities[i], i)) {
                    return true;
                }
            }
            return false;
        }
        /**
         * 检查是否所有实体都满足条件
         *
         * @param entities 实体列表
         * @param predicate 检查条件
         * @returns 是否所有实体都满足条件
         *
         * @example
         * ```typescript
         * protected process(entities: readonly Entity[]): void {
         *     const allHealthy = this.everyEntity(entities, (entity) => {
         *         const health = this.requireComponent(entity, Health);
         *         return health.value > 50;
         *     });
         * }
         * ```
         */
        everyEntity(entities, predicate) {
            for (let i = 0; i < entities.length; i++) {
                if (!predicate(entities[i], i)) {
                    return false;
                }
            }
            return true;
        }
    }

    createLogger('EntityProcessorList');

    /**
     * 可池化的实体集合
     *
     * 实现IPoolable接口，支持对象池复用以减少内存分配开销。
     */
    class PoolableEntitySet extends Set {
        constructor(..._args) {
            super();
        }
        reset() {
            this.clear();
        }
    }
    /**
     * 实体集合对象池
     *
     * 使用core库的Pool系统来管理PoolableEntitySet对象的复用。
     */
    Pool.getPool(PoolableEntitySet, 50, 512);

    // FlatHashMapFast.ts
    /**
     * 高性能 HashMap，使用BitMask64Data作为Key。内部计算两层哈希：
     *  - primaryHash: MurmurHash3(seed1) => 定位 bucket
     *  - secondaryHash: MurmurHash3(seed2) => 处理 bucket 内碰撞判定
     *
     *  理论上，在1e5数量数据规模下碰撞概率在数学意义上的可忽略。
     *  在本地测试中，一千万次连续/随机BitMask64Data生成未发生一级哈希冲突，考虑到使用场景（原型系统、组件系统等）远达不到此数量级，因此可安全用于生产环境。
     */
    class BitMaskHashMap {
        constructor() {
            this.buckets = new Map();
            this._size = 0;
        }
        get size() {
            return this._size;
        }
        get innerBuckets() {
            return this.buckets;
        }
        /** MurmurHash3 (32bit) 简化实现 */
        murmur32(key, seed) {
            let h = seed >>> 0;
            const mix = (k) => {
                k = Math.imul(k, 0xcc9e2d51) >>> 0; // 第一个 32 位魔术常数
                k = (k << 15) | (k >>> 17);
                k = Math.imul(k, 0x1b873593) >>> 0; // 第二个 32 位魔术常数
                h ^= k;
                h = (h << 13) | (h >>> 19);
                h = (Math.imul(h, 5) + 0xe6546b64) >>> 0;
            };
            // base
            mix(key.base[0] >>> 0);
            mix(key.base[1] >>> 0);
            // segments
            if (key.segments) {
                for (const seg of key.segments) {
                    mix(seg[0] >>> 0);
                    mix(seg[1] >>> 0);
                }
            }
            h ^= (key.segments ? key.segments.length * 8 : 8);
            h ^= h >>> 16;
            h = Math.imul(h, 0x85ebca6b) >>> 0;
            h ^= h >>> 13;
            h = Math.imul(h, 0xc2b2ae35) >>> 0;
            h ^= h >>> 16;
            return h >>> 0;
        }
        /** primaryHash + secondaryHash 计算 */
        getHashes(key) {
            const primary = this.murmur32(key, 0x9747b28c); // seed1
            const secondary = this.murmur32(key, 0x12345678); // seed2
            return [primary, secondary];
        }
        set(key, value) {
            const [primary, secondary] = this.getHashes(key);
            let bucket = this.buckets.get(primary);
            if (!bucket) {
                bucket = [];
                this.buckets.set(primary, bucket);
            }
            // 查找是否存在 secondaryHash
            for (let i = 0; i < bucket.length; i++) {
                if (bucket[i][0] === secondary) {
                    bucket[i][1] = value;
                    return this;
                }
            }
            // 新增
            bucket.push([secondary, value]);
            this._size++;
            return this;
        }
        get(key) {
            const [primary, secondary] = this.getHashes(key);
            const bucket = this.buckets.get(primary);
            if (!bucket)
                return undefined;
            for (let i = 0; i < bucket.length; i++) {
                if (bucket[i][0] === secondary) {
                    return bucket[i][1];
                }
            }
            return undefined;
        }
        has(key) {
            return this.get(key) !== undefined;
        }
        delete(key) {
            const [primary, secondary] = this.getHashes(key);
            const bucket = this.buckets.get(primary);
            if (!bucket)
                return false;
            for (let i = 0; i < bucket.length; i++) {
                if (bucket[i][0] === secondary) {
                    bucket.splice(i, 1);
                    this._size--;
                    if (bucket.length === 0) {
                        this.buckets.delete(primary);
                    }
                    return true;
                }
            }
            return false;
        }
        clear() {
            this.buckets.clear();
            this._size = 0;
        }
        *entries() {
            for (const [_, bucket] of this.buckets) {
                for (const [_secondary, value] of bucket) {
                    // 无法还原原始 key（只存二级 hash），所以 entries 返回不了 key
                    yield [undefined, value];
                }
            }
        }
        *values() {
            for (const bucket of this.buckets.values()) {
                for (const [_, value] of bucket) {
                    yield value;
                }
            }
        }
    }

    /**
     * Archetype系统
     *
     * 根据实体的组件组合将实体分组到不同的原型中，提供高效的查询性能。
     */
    class ArchetypeSystem {
        constructor() {
            /** 所有原型的映射表 */
            this._archetypes = new BitMaskHashMap();
            /** 实体到原型的映射 */
            this._entityToArchetype = new Map();
            /** 组件类型到原型的映射 */
            this._componentToArchetypes = new Map();
            /** 实体组件类型缓存 */
            this._entityComponentTypesCache = new Map();
            /** 所有原型 */
            this._allArchetypes = [];
        }
        /**
         * 添加实体到原型系统
         */
        addEntity(entity) {
            const componentTypes = this.getEntityComponentTypes(entity);
            const archetypeId = this.generateArchetypeId(componentTypes);
            let archetype = this._archetypes.get(archetypeId);
            if (!archetype) {
                archetype = this.createArchetype(componentTypes);
            }
            archetype.entities.add(entity);
            this._entityToArchetype.set(entity, archetype);
        }
        /**
         * 从原型系统中移除实体
         */
        removeEntity(entity) {
            const archetype = this._entityToArchetype.get(entity);
            if (!archetype)
                return;
            archetype.entities.delete(entity);
            // 清理实体相关缓存
            this._entityComponentTypesCache.delete(entity);
            this._entityToArchetype.delete(entity);
        }
        /**
         * 更新实体的原型归属
         *
         * 当实体的组件组合发生变化时调用此方法，将实体从旧原型移动到新原型。
         * 如果新的组件组合对应的原型不存在，将自动创建新原型。
         *
         * @param entity 要更新的实体
         */
        updateEntity(entity) {
            const currentArchetype = this._entityToArchetype.get(entity);
            // 清理实体组件类型缓存，强制重新计算
            this._entityComponentTypesCache.delete(entity);
            const newComponentTypes = this.getEntityComponentTypes(entity);
            const newArchetypeId = this.generateArchetypeId(newComponentTypes);
            // 如果实体已在正确的原型中，无需更新
            if (currentArchetype && currentArchetype.id === newArchetypeId) {
                return;
            }
            // 从旧原型中移除实体
            if (currentArchetype) {
                currentArchetype.entities.delete(entity);
            }
            // 获取或创建新原型
            let newArchetype = this._archetypes.get(newArchetypeId);
            if (!newArchetype) {
                newArchetype = this.createArchetype(newComponentTypes);
            }
            // 将实体添加到新原型
            newArchetype.entities.add(entity);
            this._entityToArchetype.set(entity, newArchetype);
        }
        /**
         * 查询包含指定组件组合的原型
         *
         * @param componentTypes 要查询的组件类型列表
         * @param operation 查询操作类型：'AND'（包含所有）或 'OR'（包含任意）
         * @returns 匹配的原型列表及实体总数
         */
        queryArchetypes(componentTypes, operation = 'AND') {
            const matchingArchetypes = [];
            let totalEntities = 0;
            if (operation === 'AND') {
                if (componentTypes.length === 0) {
                    for (const archetype of this._allArchetypes) {
                        matchingArchetypes.push(archetype);
                        totalEntities += archetype.entities.size;
                    }
                    return { archetypes: matchingArchetypes, totalEntities };
                }
                if (componentTypes.length === 1) {
                    const archetypes = this._componentToArchetypes.get(componentTypes[0]);
                    if (archetypes) {
                        for (const archetype of archetypes) {
                            matchingArchetypes.push(archetype);
                            totalEntities += archetype.entities.size;
                        }
                    }
                    return { archetypes: matchingArchetypes, totalEntities };
                }
                let smallestSet;
                let smallestSize = Infinity;
                for (const componentType of componentTypes) {
                    const archetypes = this._componentToArchetypes.get(componentType);
                    if (!archetypes || archetypes.size === 0) {
                        return { archetypes: [], totalEntities: 0 };
                    }
                    if (archetypes.size < smallestSize) {
                        smallestSize = archetypes.size;
                        smallestSet = archetypes;
                    }
                }
                const queryMask = this.generateArchetypeId(componentTypes);
                if (smallestSet) {
                    for (const archetype of smallestSet) {
                        if (BitMask64Utils.hasAll(archetype.id, queryMask)) {
                            matchingArchetypes.push(archetype);
                            totalEntities += archetype.entities.size;
                        }
                    }
                }
            }
            else {
                const foundArchetypes = new Set();
                for (const componentType of componentTypes) {
                    const archetypes = this._componentToArchetypes.get(componentType);
                    if (archetypes) {
                        for (const archetype of archetypes) {
                            foundArchetypes.add(archetype);
                        }
                    }
                }
                for (const archetype of foundArchetypes) {
                    matchingArchetypes.push(archetype);
                    totalEntities += archetype.entities.size;
                }
            }
            return {
                archetypes: matchingArchetypes,
                totalEntities
            };
        }
        /**
         * 获取实体所属的原型
         */
        getEntityArchetype(entity) {
            return this._entityToArchetype.get(entity);
        }
        /**
         * 获取所有原型
         */
        getAllArchetypes() {
            return this._allArchetypes.slice();
        }
        /**
         * 获取包含指定组件类型的所有实体
         */
        getEntitiesByComponent(componentType) {
            const archetypes = this._componentToArchetypes.get(componentType);
            if (!archetypes || archetypes.size === 0) {
                return [];
            }
            const entities = [];
            for (const archetype of archetypes) {
                for (const entity of archetype.entities) {
                    entities.push(entity);
                }
            }
            return entities;
        }
        /**
         * 清空所有数据
         */
        clear() {
            this._archetypes.clear();
            this._entityToArchetype.clear();
            this._componentToArchetypes.clear();
            this._entityComponentTypesCache.clear();
            this._allArchetypes = [];
        }
        /**
         * 更新所有原型数组
         */
        updateAllArchetypeArrays() {
            this._allArchetypes = [];
            for (const archetype of this._archetypes.values()) {
                this._allArchetypes.push(archetype);
            }
        }
        /**
         * 获取实体的组件类型列表
         */
        getEntityComponentTypes(entity) {
            let componentTypes = this._entityComponentTypesCache.get(entity);
            if (!componentTypes) {
                componentTypes = entity.components.map((component) => component.constructor);
                this._entityComponentTypesCache.set(entity, componentTypes);
            }
            return componentTypes;
        }
        /**
         * 生成原型ID
         * 使用ComponentRegistry确保与Entity.componentMask使用相同的bitIndex
         */
        generateArchetypeId(componentTypes) {
            const mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            for (const type of componentTypes) {
                if (!ComponentRegistry.isRegistered(type)) {
                    ComponentRegistry.register(type);
                }
                const bitMask = ComponentRegistry.getBitMask(type);
                BitMask64Utils.orInPlace(mask, bitMask);
            }
            return mask;
        }
        /**
         * 创建新原型
         */
        createArchetype(componentTypes) {
            const id = this.generateArchetypeId(componentTypes);
            const archetype = {
                id,
                componentTypes: [...componentTypes],
                entities: new Set()
            };
            this._archetypes.set(id, archetype);
            this.updateAllArchetypeArrays();
            for (const componentType of componentTypes) {
                let archetypes = this._componentToArchetypes.get(componentType);
                if (!archetypes) {
                    archetypes = new Set();
                    this._componentToArchetypes.set(componentType, archetypes);
                }
                archetypes.add(archetype);
            }
            return archetype;
        }
    }

    /**
     * 查询条件类型
     */
    var QueryConditionType;
    (function (QueryConditionType) {
        /** 必须包含所有指定组件 */
        QueryConditionType["ALL"] = "all";
        /** 必须包含任意一个指定组件 */
        QueryConditionType["ANY"] = "any";
        /** 不能包含任何指定组件 */
        QueryConditionType["NONE"] = "none";
    })(QueryConditionType || (QueryConditionType = {}));

    const logger$5 = createLogger('ReactiveQuery');
    /**
     * 响应式查询变化类型
     */
    var ReactiveQueryChangeType;
    (function (ReactiveQueryChangeType) {
        /** 实体添加到查询结果 */
        ReactiveQueryChangeType["ADDED"] = "added";
        /** 实体从查询结果移除 */
        ReactiveQueryChangeType["REMOVED"] = "removed";
        /** 查询结果批量更新 */
        ReactiveQueryChangeType["BATCH_UPDATE"] = "batch_update";
    })(ReactiveQueryChangeType || (ReactiveQueryChangeType = {}));
    /**
     * 响应式查询类
     *
     * 提供基于事件驱动的实体查询机制,只在实体/组件真正变化时触发通知。
     *
     * 核心特性:
     * - Event-driven: 基于事件的增量更新
     * - 精确通知: 只通知真正匹配的变化
     * - 性能优化: 避免每帧重复查询
     *
     * @example
     * ```typescript
     * // 创建响应式查询
     * const query = new ReactiveQuery(querySystem, {
     *     type: QueryConditionType.ALL,
     *     componentTypes: [Position, Velocity],
     *     mask: createMask([Position, Velocity])
     * });
     *
     * // 订阅变化
     * query.subscribe((change) => {
     *     if (change.type === ReactiveQueryChangeType.ADDED) {
     *         console.log('新实体:', change.entity);
     *     }
     * });
     *
     * // 获取当前结果
     * const entities = query.getEntities();
     * ```
     */
    class ReactiveQuery {
        constructor(condition, config = {}) {
            /** 当前查询结果 */
            this._entities = [];
            /** 实体ID集合,用于快速查找 */
            this._entityIdSet = new Set();
            /** 监听器列表 */
            this._listeners = [];
            /** 是否已激活 */
            this._active = true;
            this._condition = condition;
            this._config = {
                enableBatchMode: config.enableBatchMode ?? true,
                batchDelay: config.batchDelay ?? 16, // 默认一帧
                debug: config.debug ?? false
            };
            this._id = this.generateQueryId();
            this._batchChanges = {
                added: [],
                removed: [],
                timer: null
            };
            if (this._config.debug) {
                logger$5.debug(`创建ReactiveQuery: ${this._id}`);
            }
        }
        /**
         * 生成查询ID
         */
        generateQueryId() {
            const typeStr = this._condition.type;
            const componentsStr = this._condition.componentTypes
                .map((t) => t.name)
                .sort()
                .join(',');
            return `${typeStr}:${componentsStr}`;
        }
        /**
         * 订阅查询变化
         *
         * @param listener 监听器函数
         * @returns 取消订阅的函数
         */
        subscribe(listener) {
            if (!this._active) {
                throw new Error(`Cannot subscribe to disposed ReactiveQuery ${this._id}`);
            }
            if (typeof listener !== 'function') {
                throw new TypeError('Listener must be a function');
            }
            this._listeners.push(listener);
            if (this._config.debug) {
                logger$5.debug(`订阅ReactiveQuery: ${this._id}, 监听器数量: ${this._listeners.length}`);
            }
            return () => {
                const index = this._listeners.indexOf(listener);
                if (index !== -1) {
                    this._listeners.splice(index, 1);
                }
            };
        }
        /**
         * 取消所有订阅
         */
        unsubscribeAll() {
            this._listeners.length = 0;
        }
        /**
         * 获取当前查询结果
         */
        getEntities() {
            return this._entities;
        }
        /**
         * 获取查询结果数量
         */
        get count() {
            return this._entities.length;
        }
        /**
         * 检查实体是否匹配查询条件
         *
         * @param entity 要检查的实体
         * @returns 是否匹配
         */
        matches(entity) {
            const entityMask = entity.componentMask;
            switch (this._condition.type) {
                case QueryConditionType.ALL:
                    return BitMask64Utils.hasAll(entityMask, this._condition.mask);
                case QueryConditionType.ANY:
                    return BitMask64Utils.hasAny(entityMask, this._condition.mask);
                case QueryConditionType.NONE:
                    return BitMask64Utils.hasNone(entityMask, this._condition.mask);
                default:
                    return false;
            }
        }
        /**
         * 通知实体添加
         *
         * 当Scene中添加实体时调用
         *
         * @param entity 添加的实体
         */
        notifyEntityAdded(entity) {
            if (!this._active)
                return;
            // 检查实体是否匹配查询条件
            if (!this.matches(entity)) {
                return;
            }
            // 检查是否已存在
            if (this._entityIdSet.has(entity.id)) {
                return;
            }
            // 添加到结果集
            this._entities.push(entity);
            this._entityIdSet.add(entity.id);
            // 通知监听器
            if (this._config.enableBatchMode) {
                this.addToBatch('added', entity);
            }
            else {
                this.notifyListeners({
                    type: ReactiveQueryChangeType.ADDED,
                    entity
                });
            }
            if (this._config.debug) {
                logger$5.debug(`ReactiveQuery ${this._id}: 实体添加 ${entity.name}(${entity.id})`);
            }
        }
        /**
         * 通知实体移除
         *
         * 当Scene中移除实体时调用
         *
         * @param entity 移除的实体
         */
        notifyEntityRemoved(entity) {
            if (!this._active)
                return;
            // 检查是否在结果集中
            if (!this._entityIdSet.has(entity.id)) {
                return;
            }
            // 从结果集移除
            const index = this._entities.indexOf(entity);
            if (index !== -1) {
                this._entities.splice(index, 1);
            }
            this._entityIdSet.delete(entity.id);
            // 通知监听器
            if (this._config.enableBatchMode) {
                this.addToBatch('removed', entity);
            }
            else {
                this.notifyListeners({
                    type: ReactiveQueryChangeType.REMOVED,
                    entity
                });
            }
            if (this._config.debug) {
                logger$5.debug(`ReactiveQuery ${this._id}: 实体移除 ${entity.name}(${entity.id})`);
            }
        }
        /**
         * 通知实体组件变化
         *
         * 当实体的组件发生变化时调用
         *
         * @param entity 变化的实体
         */
        notifyEntityChanged(entity) {
            if (!this._active)
                return;
            const wasMatching = this._entityIdSet.has(entity.id);
            const isMatching = this.matches(entity);
            if (wasMatching && !isMatching) {
                // 实体不再匹配,从结果集移除
                this.notifyEntityRemoved(entity);
            }
            else if (!wasMatching && isMatching) {
                // 实体现在匹配,添加到结果集
                this.notifyEntityAdded(entity);
            }
        }
        /**
         * 批量初始化查询结果
         *
         * @param entities 初始实体列表
         */
        initializeWith(entities) {
            // 清空现有结果
            this._entities.length = 0;
            this._entityIdSet.clear();
            // 筛选匹配的实体
            for (const entity of entities) {
                if (this.matches(entity)) {
                    this._entities.push(entity);
                    this._entityIdSet.add(entity.id);
                }
            }
            if (this._config.debug) {
                logger$5.debug(`ReactiveQuery ${this._id}: 初始化 ${this._entities.length} 个实体`);
            }
        }
        /**
         * 添加到批量变化缓存
         */
        addToBatch(type, entity) {
            if (type === 'added') {
                this._batchChanges.added.push(entity);
            }
            else {
                this._batchChanges.removed.push(entity);
            }
            // 启动批量通知定时器
            if (this._batchChanges.timer === null) {
                this._batchChanges.timer = setTimeout(() => {
                    this.flushBatchChanges();
                }, this._config.batchDelay);
            }
        }
        /**
         * 刷新批量变化
         */
        flushBatchChanges() {
            if (this._batchChanges.added.length === 0 && this._batchChanges.removed.length === 0) {
                this._batchChanges.timer = null;
                return;
            }
            const added = [...this._batchChanges.added];
            const removed = [...this._batchChanges.removed];
            // 清空缓存
            this._batchChanges.added.length = 0;
            this._batchChanges.removed.length = 0;
            this._batchChanges.timer = null;
            // 通知监听器
            this.notifyListeners({
                type: ReactiveQueryChangeType.BATCH_UPDATE,
                added,
                removed,
                entities: this._entities
            });
            if (this._config.debug) {
                logger$5.debug(`ReactiveQuery ${this._id}: 批量更新 +${added.length} -${removed.length}`);
            }
        }
        /**
         * 通知所有监听器
         */
        notifyListeners(change) {
            const listeners = [...this._listeners];
            for (const listener of listeners) {
                try {
                    listener(change);
                }
                catch (error) {
                    logger$5.error(`ReactiveQuery ${this._id}: 监听器执行出错`, error);
                }
            }
        }
        /**
         * 暂停响应式查询
         *
         * 暂停后不再响应实体变化,但可以继续获取当前结果
         */
        pause() {
            this._active = false;
            // 清空批量变化缓存
            if (this._batchChanges.timer !== null) {
                clearTimeout(this._batchChanges.timer);
                this._batchChanges.timer = null;
            }
            this._batchChanges.added.length = 0;
            this._batchChanges.removed.length = 0;
        }
        /**
         * 恢复响应式查询
         */
        resume() {
            this._active = true;
        }
        /**
         * 销毁响应式查询
         *
         * 释放所有资源,清空监听器和结果集
         */
        dispose() {
            if (this._batchChanges.timer !== null) {
                clearTimeout(this._batchChanges.timer);
                this._batchChanges.timer = null;
            }
            this._batchChanges.added.length = 0;
            this._batchChanges.removed.length = 0;
            this._active = false;
            this.unsubscribeAll();
            this._entities.length = 0;
            this._entityIdSet.clear();
            if (this._config.debug) {
                logger$5.debug(`ReactiveQuery ${this._id}: 已销毁`);
            }
        }
        /**
         * 获取查询条件
         */
        get condition() {
            return this._condition;
        }
        /**
         * 获取查询ID
         */
        get id() {
            return this._id;
        }
        /**
         * 检查是否激活
         */
        get active() {
            return this._active;
        }
        /**
         * 获取监听器数量
         */
        get listenerCount() {
            return this._listeners.length;
        }
    }

    /**
     * 高性能实体查询系统
     *
     * 提供快速的实体查询功能，支持按组件类型、标签、名称等多种方式查询实体。
     *
     * @example
     * ```typescript
     * // 查询所有包含Position和Velocity组件的实体
     * const movingEntities = querySystem.queryAll(PositionComponent, VelocityComponent);
     *
     * // 查询特定标签的实体
     * const playerEntities = querySystem.queryByTag(PLAYER_TAG);
     * ```
     */
    class QuerySystem {
        constructor() {
            this._logger = createLogger('QuerySystem');
            this._entities = [];
            this._version = 0;
            this._queryCache = new Map();
            this._cacheMaxSize = 1000;
            this._cacheTimeout = 5000;
            this._componentMaskCache = new Map();
            this._queryStats = {
                totalQueries: 0,
                cacheHits: 0,
                indexHits: 0,
                linearScans: 0,
                archetypeHits: 0,
                dirtyChecks: 0
            };
            // ============================================================
            // 响应式查询支持(内部智能缓存)
            // ============================================================
            /**
             * 响应式查询集合(内部使用,作为智能缓存)
             * 传统查询API(queryAll/queryAny/queryNone)内部自动使用响应式查询优化性能
             */
            this._reactiveQueries = new Map();
            /**
             * 按组件类型索引的响应式查询
             * 用于快速定位哪些查询关心某个组件类型
             */
            this._reactiveQueriesByComponent = new Map();
            this._entityIndex = {
                byTag: new Map(),
                byName: new Map()
            };
            this._archetypeSystem = new ArchetypeSystem();
        }
        /**
         * 设置实体列表并重建索引
         *
         * 当实体集合发生大规模变化时调用此方法。
         * 系统将重新构建所有索引以确保查询性能。
         *
         * @param entities 新的实体列表
         */
        setEntities(entities) {
            this._entities = entities;
            this.clearQueryCache();
            this.clearReactiveQueries();
            this.rebuildIndexes();
        }
        /**
         * 添加单个实体到查询系统
         *
         * 将新实体添加到查询系统中，并自动更新相关索引。
         * 为了提高批量添加性能，可以延迟缓存清理。
         *
         * @param entity 要添加的实体
         * @param deferCacheClear 是否延迟缓存清理（用于批量操作）
         */
        addEntity(entity, deferCacheClear = false) {
            if (!this._entities.includes(entity)) {
                this._entities.push(entity);
                this.addEntityToIndexes(entity);
                this._archetypeSystem.addEntity(entity);
                // 通知响应式查询
                this.notifyReactiveQueriesEntityAdded(entity);
                // 只有在非延迟模式下才立即清理缓存
                if (!deferCacheClear) {
                    this.clearQueryCache();
                }
                // 更新版本号
                this._version++;
            }
        }
        /**
         * 批量添加实体
         *
         * 高效地批量添加多个实体，减少缓存清理次数。
         * 使用Set来避免O(n)的重复检查。
         *
         * @param entities 要添加的实体列表
         */
        addEntities(entities) {
            if (entities.length === 0)
                return;
            // 使用Set来快速检查重复
            const existingIds = new Set(this._entities.map((e) => e.id));
            let addedCount = 0;
            for (const entity of entities) {
                if (!existingIds.has(entity.id)) {
                    this._entities.push(entity);
                    this.addEntityToIndexes(entity);
                    // 更新索引管理器
                    this._archetypeSystem.addEntity(entity);
                    existingIds.add(entity.id);
                    addedCount++;
                }
            }
            // 只在有实体被添加时才清理缓存
            if (addedCount > 0) {
                this.clearQueryCache();
            }
        }
        /**
         * 批量添加实体（无重复检查版本）
         *
         * 假设所有实体都是新的，跳过重复检查以获得最大性能。
         * 仅在确保没有重复实体时使用。
         *
         * @param entities 要添加的实体列表
         */
        addEntitiesUnchecked(entities) {
            if (entities.length === 0)
                return;
            // 避免调用栈溢出，分批添加
            for (const entity of entities) {
                this._entities.push(entity);
            }
            // 批量更新索引
            for (const entity of entities) {
                this.addEntityToIndexes(entity);
                // 更新索引管理器
                this._archetypeSystem.addEntity(entity);
            }
            // 清理缓存
            this.clearQueryCache();
        }
        /**
         * 从查询系统移除实体
         *
         * 从查询系统中移除指定实体，并清理相关索引。
         *
         * @param entity 要移除的实体
         */
        removeEntity(entity) {
            const index = this._entities.indexOf(entity);
            if (index !== -1) {
                const componentTypes = [];
                for (const component of entity.components) {
                    componentTypes.push(component.constructor);
                }
                this._entities.splice(index, 1);
                this.removeEntityFromIndexes(entity);
                this._archetypeSystem.removeEntity(entity);
                if (componentTypes.length > 0) {
                    this.notifyReactiveQueriesEntityRemoved(entity, componentTypes);
                }
                else {
                    this.notifyReactiveQueriesEntityRemovedFallback(entity);
                }
                this.clearQueryCache();
                this._version++;
            }
        }
        /**
         * 更新实体在查询系统中的索引
         *
         * 当实体的组件组合发生变化时调用此方法，高效地更新实体在查询系统中的索引。
         *
         * @param entity 要更新的实体
         */
        updateEntity(entity) {
            // 检查实体是否在查询系统中
            if (!this._entities.includes(entity)) {
                // 如果实体不在系统中，直接添加
                this.addEntity(entity);
                return;
            }
            // 先从索引中移除实体的旧状态
            this.removeEntityFromIndexes(entity);
            // 更新ArchetypeSystem中的实体状态
            this._archetypeSystem.updateEntity(entity);
            // 重新添加实体到索引（基于新的组件状态）
            this.addEntityToIndexes(entity);
            // 通知响应式查询
            this.notifyReactiveQueriesEntityChanged(entity);
            // 清理查询缓存，因为实体组件状态已改变
            this.clearQueryCache();
            // 更新版本号以使缓存失效
            this._version++;
        }
        /**
         * 将实体添加到各种索引中
         */
        addEntityToIndexes(entity) {
            // 标签索引
            const tag = entity.tag;
            if (tag !== undefined) {
                const tagSet = this._entityIndex.byTag.get(tag) || this.createAndSetTagIndex(tag);
                tagSet.add(entity);
            }
            // 名称索引
            const name = entity.name;
            if (name) {
                const nameSet = this._entityIndex.byName.get(name) || this.createAndSetNameIndex(name);
                nameSet.add(entity);
            }
        }
        createAndSetTagIndex(tag) {
            const set = new Set();
            this._entityIndex.byTag.set(tag, set);
            return set;
        }
        createAndSetNameIndex(name) {
            const set = new Set();
            this._entityIndex.byName.set(name, set);
            return set;
        }
        /**
         * 从各种索引中移除实体
         */
        removeEntityFromIndexes(entity) {
            // 从标签索引移除
            if (entity.tag !== undefined) {
                const tagSet = this._entityIndex.byTag.get(entity.tag);
                if (tagSet) {
                    tagSet.delete(entity);
                    if (tagSet.size === 0) {
                        this._entityIndex.byTag.delete(entity.tag);
                    }
                }
            }
            // 从名称索引移除
            if (entity.name) {
                const nameSet = this._entityIndex.byName.get(entity.name);
                if (nameSet) {
                    nameSet.delete(entity);
                    if (nameSet.size === 0) {
                        this._entityIndex.byName.delete(entity.name);
                    }
                }
            }
        }
        /**
         * 重建所有索引
         *
         * 清空并重新构建所有查询索引。
         * 通常在大量实体变更后调用以确保索引一致性。
         */
        rebuildIndexes() {
            this._entityIndex.byTag.clear();
            this._entityIndex.byName.clear();
            // 清理ArchetypeSystem和ComponentIndexManager
            this._archetypeSystem.clear();
            for (const entity of this._entities) {
                this.addEntityToIndexes(entity);
                this._archetypeSystem.addEntity(entity);
            }
        }
        /**
         * 查询包含所有指定组件的实体
         *
         * 返回同时包含所有指定组件类型的实体列表。
         * 内部使用响应式查询作为智能缓存,自动跟踪实体变化,性能更优。
         *
         * @param componentTypes 要查询的组件类型列表
         * @returns 查询结果，包含匹配的实体和性能信息
         *
         * @example
         * ```typescript
         * // 查询同时具有位置和速度组件的实体
         * const result = querySystem.queryAll(PositionComponent, VelocityComponent);
         * logger.info(`找到 ${result.count} 个移动实体`);
         * ```
         */
        queryAll(...componentTypes) {
            const startTime = performance.now();
            this._queryStats.totalQueries++;
            // 使用内部响应式查询作为智能缓存
            const reactiveQuery = this.getOrCreateReactiveQuery(QueryConditionType.ALL, componentTypes);
            // 从响应式查询获取结果(永远是最新的)
            const entities = reactiveQuery.getEntities();
            // 统计为缓存命中(响应式查询本质上是永不过期的智能缓存)
            this._queryStats.cacheHits++;
            return {
                entities,
                count: entities.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }
        /**
         * 查询包含任意指定组件的实体
         *
         * 返回包含任意一个指定组件类型的实体列表。
         * 内部使用响应式查询作为智能缓存,自动跟踪实体变化,性能更优。
         *
         * @param componentTypes 要查询的组件类型列表
         * @returns 查询结果，包含匹配的实体和性能信息
         *
         * @example
         * ```typescript
         * // 查询具有武器或护甲组件的实体
         * const result = querySystem.queryAny(WeaponComponent, ArmorComponent);
         * logger.info(`找到 ${result.count} 个装备实体`);
         * ```
         */
        queryAny(...componentTypes) {
            const startTime = performance.now();
            this._queryStats.totalQueries++;
            // 使用内部响应式查询作为智能缓存
            const reactiveQuery = this.getOrCreateReactiveQuery(QueryConditionType.ANY, componentTypes);
            // 从响应式查询获取结果(永远是最新的)
            const entities = reactiveQuery.getEntities();
            // 统计为缓存命中(响应式查询本质上是永不过期的智能缓存)
            this._queryStats.cacheHits++;
            return {
                entities,
                count: entities.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }
        /**
         * 查询不包含任何指定组件的实体
         *
         * 返回不包含任何指定组件类型的实体列表。
         * 内部使用响应式查询作为智能缓存,自动跟踪实体变化,性能更优。
         *
         * @param componentTypes 要排除的组件类型列表
         * @returns 查询结果，包含匹配的实体和性能信息
         *
         * @example
         * ```typescript
         * // 查询不具有AI和玩家控制组件的实体（如静态物体）
         * const result = querySystem.queryNone(AIComponent, PlayerControlComponent);
         * logger.info(`找到 ${result.count} 个静态实体`);
         * ```
         */
        queryNone(...componentTypes) {
            const startTime = performance.now();
            this._queryStats.totalQueries++;
            // 使用内部响应式查询作为智能缓存
            const reactiveQuery = this.getOrCreateReactiveQuery(QueryConditionType.NONE, componentTypes);
            // 从响应式查询获取结果(永远是最新的)
            const entities = reactiveQuery.getEntities();
            // 统计为缓存命中(响应式查询本质上是永不过期的智能缓存)
            this._queryStats.cacheHits++;
            return {
                entities,
                count: entities.length,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }
        /**
         * 按标签查询实体
         *
         * 返回具有指定标签的所有实体。
         * 标签查询使用专用索引，具有很高的查询性能。
         *
         * @param tag 要查询的标签值
         * @returns 查询结果，包含匹配的实体和性能信息
         *
         * @example
         * ```typescript
         * // 查询所有玩家实体
         * const players = querySystem.queryByTag(PLAYER_TAG);
         * ```
         */
        queryByTag(tag) {
            const startTime = performance.now();
            this._queryStats.totalQueries++;
            const cacheKey = `tag:${tag}`;
            // 检查缓存
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this._queryStats.cacheHits++;
                return {
                    entities: cached,
                    count: cached.length,
                    executionTime: performance.now() - startTime,
                    fromCache: true
                };
            }
            // 使用索引查询
            this._queryStats.indexHits++;
            const entities = Array.from(this._entityIndex.byTag.get(tag) || []);
            // 缓存结果
            this.addToCache(cacheKey, entities);
            return {
                entities,
                count: entities.length,
                executionTime: performance.now() - startTime,
                fromCache: false
            };
        }
        /**
         * 按名称查询实体
         *
         * 返回具有指定名称的所有实体。
         * 名称查询使用专用索引，适用于查找特定的命名实体。
         *
         * @param name 要查询的实体名称
         * @returns 查询结果，包含匹配的实体和性能信息
         *
         * @example
         * ```typescript
         * // 查找名为"Player"的实体
         * const player = querySystem.queryByName("Player");
         * ```
         */
        queryByName(name) {
            const startTime = performance.now();
            this._queryStats.totalQueries++;
            const cacheKey = `name:${name}`;
            // 检查缓存
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this._queryStats.cacheHits++;
                return {
                    entities: cached,
                    count: cached.length,
                    executionTime: performance.now() - startTime,
                    fromCache: true
                };
            }
            // 使用索引查询
            this._queryStats.indexHits++;
            const entities = Array.from(this._entityIndex.byName.get(name) || []);
            // 缓存结果
            this.addToCache(cacheKey, entities);
            return {
                entities,
                count: entities.length,
                executionTime: performance.now() - startTime,
                fromCache: false
            };
        }
        /**
         * 按单个组件类型查询实体
         *
         * 返回包含指定组件类型的所有实体。
         * 这是最基础的查询方法，具有最高的查询性能。
         *
         * @param componentType 要查询的组件类型
         * @returns 查询结果，包含匹配的实体和性能信息
         *
         * @example
         * ```typescript
         * // 查询所有具有位置组件的实体
         * const entitiesWithPosition = querySystem.queryByComponent(PositionComponent);
         * ```
         */
        queryByComponent(componentType) {
            const startTime = performance.now();
            this._queryStats.totalQueries++;
            const cacheKey = this.generateCacheKey('component', [componentType]);
            // 检查缓存
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this._queryStats.cacheHits++;
                return {
                    entities: cached,
                    count: cached.length,
                    executionTime: performance.now() - startTime,
                    fromCache: true
                };
            }
            this._queryStats.indexHits++;
            const entities = this._archetypeSystem.getEntitiesByComponent(componentType);
            // 缓存结果
            this.addToCache(cacheKey, entities);
            return {
                entities,
                count: entities.length,
                executionTime: performance.now() - startTime,
                fromCache: false
            };
        }
        /**
         * 从缓存获取查询结果
         */
        getFromCache(cacheKey) {
            const entry = this._queryCache.get(cacheKey);
            if (!entry)
                return null;
            // 检查缓存是否过期或版本过期
            if (Date.now() - entry.timestamp > this._cacheTimeout || entry.version !== this._version) {
                this._queryCache.delete(cacheKey);
                return null;
            }
            entry.hitCount++;
            return entry.entities;
        }
        /**
         * 添加查询结果到缓存
         */
        addToCache(cacheKey, entities) {
            // 如果缓存已满，清理最少使用的条目
            if (this._queryCache.size >= this._cacheMaxSize) {
                this.cleanupCache();
            }
            this._queryCache.set(cacheKey, {
                entities: entities, // 直接使用引用，通过版本号控制失效
                timestamp: Date.now(),
                hitCount: 0,
                version: this._version
            });
        }
        /**
         * 清理缓存
         */
        cleanupCache() {
            // 移除过期的缓存条目
            const now = Date.now();
            for (const [key, entry] of this._queryCache.entries()) {
                if (now - entry.timestamp > this._cacheTimeout) {
                    this._queryCache.delete(key);
                }
            }
            // 如果还是太满，移除最少使用的条目
            if (this._queryCache.size >= this._cacheMaxSize) {
                let minHitCount = Infinity;
                let oldestKey = '';
                let oldestTimestamp = Infinity;
                // 单次遍历找到最少使用或最旧的条目
                for (const [key, entry] of this._queryCache.entries()) {
                    if (entry.hitCount < minHitCount ||
                        (entry.hitCount === minHitCount && entry.timestamp < oldestTimestamp)) {
                        minHitCount = entry.hitCount;
                        oldestKey = key;
                        oldestTimestamp = entry.timestamp;
                    }
                }
                if (oldestKey) {
                    this._queryCache.delete(oldestKey);
                }
            }
        }
        /**
         * 清除所有查询缓存
         */
        clearQueryCache() {
            this._queryCache.clear();
            this._componentMaskCache.clear();
        }
        /**
         * 清除所有响应式查询
         *
         * 销毁所有响应式查询实例并清理索引
         * 通常在setEntities时调用以确保缓存一致性
         */
        clearReactiveQueries() {
            for (const query of this._reactiveQueries.values()) {
                query.dispose();
            }
            this._reactiveQueries.clear();
            this._reactiveQueriesByComponent.clear();
        }
        /**
         * 高效的缓存键生成
         */
        generateCacheKey(prefix, componentTypes) {
            // 快速路径：单组件查询
            if (componentTypes.length === 1) {
                const name = getComponentTypeName(componentTypes[0]);
                return `${prefix}:${name}`;
            }
            // 多组件查询：使用排序后的类型名称创建键
            const sortKey = componentTypes
                .map((t) => {
                const name = getComponentTypeName(t);
                return name;
            })
                .sort()
                .join(',');
            const fullKey = `${prefix}:${sortKey}`;
            return fullKey;
        }
        /**
         * 清理查询缓存
         *
         * 用于外部调用清理缓存，通常在批量操作后使用。
         * 注意:此方法也会清理响应式查询缓存
         */
        clearCache() {
            this.clearQueryCache();
            this.clearReactiveQueries();
        }
        /**
         * 创建响应式查询
         *
         * 响应式查询会自动跟踪实体/组件的变化,并通过事件通知订阅者。
         * 适合需要实时响应实体变化的场景(如UI更新、AI系统等)。
         *
         * @param componentTypes 查询的组件类型列表
         * @param config 可选的查询配置
         * @returns 响应式查询实例
         *
         * @example
         * ```typescript
         * const query = querySystem.createReactiveQuery([Position, Velocity], {
         *     enableBatchMode: true,
         *     batchDelay: 16
         * });
         *
         * query.subscribe((change) => {
         *     if (change.type === ReactiveQueryChangeType.ADDED) {
         *         console.log('新实体:', change.entity);
         *     }
         * });
         * ```
         */
        createReactiveQuery(componentTypes, config) {
            if (!componentTypes || componentTypes.length === 0) {
                throw new Error('组件类型列表不能为空');
            }
            const mask = this.createComponentMask(componentTypes);
            const condition = {
                type: QueryConditionType.ALL,
                componentTypes,
                mask
            };
            const query = new ReactiveQuery(condition, config);
            const initialEntities = this.executeTraditionalQuery(QueryConditionType.ALL, componentTypes);
            query.initializeWith(initialEntities);
            const cacheKey = this.generateCacheKey('all', componentTypes);
            this._reactiveQueries.set(cacheKey, query);
            for (const type of componentTypes) {
                let queries = this._reactiveQueriesByComponent.get(type);
                if (!queries) {
                    queries = new Set();
                    this._reactiveQueriesByComponent.set(type, queries);
                }
                queries.add(query);
            }
            return query;
        }
        /**
         * 销毁响应式查询
         *
         * 清理查询占用的资源,包括监听器和实体引用。
         * 销毁后的查询不应再被使用。
         *
         * @param query 要销毁的响应式查询
         *
         * @example
         * ```typescript
         * const query = querySystem.createReactiveQuery([Position, Velocity]);
         * // ... 使用查询
         * querySystem.destroyReactiveQuery(query);
         * ```
         */
        destroyReactiveQuery(query) {
            if (!query) {
                return;
            }
            const cacheKey = query.id;
            this._reactiveQueries.delete(cacheKey);
            for (const type of query.condition.componentTypes) {
                const queries = this._reactiveQueriesByComponent.get(type);
                if (queries) {
                    queries.delete(query);
                    if (queries.size === 0) {
                        this._reactiveQueriesByComponent.delete(type);
                    }
                }
            }
            query.dispose();
        }
        /**
         * 创建组件掩码
         *
         * 根据组件类型列表生成对应的位掩码。
         * 使用缓存避免重复计算。
         * 注意:必须使用ComponentRegistry来确保与Entity.componentMask使用相同的bitIndex
         *
         * @param componentTypes 组件类型列表
         * @returns 生成的位掩码
         */
        createComponentMask(componentTypes) {
            // 生成缓存键
            const cacheKey = componentTypes
                .map((t) => {
                return getComponentTypeName(t);
            })
                .sort()
                .join(',');
            // 检查缓存
            const cached = this._componentMaskCache.get(cacheKey);
            if (cached) {
                return cached;
            }
            // 使用ComponentRegistry而不是ComponentTypeManager,确保bitIndex一致
            const mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            for (const type of componentTypes) {
                // 确保组件已注册
                if (!ComponentRegistry.isRegistered(type)) {
                    ComponentRegistry.register(type);
                }
                const bitMask = ComponentRegistry.getBitMask(type);
                BitMask64Utils.orInPlace(mask, bitMask);
            }
            // 缓存结果
            this._componentMaskCache.set(cacheKey, mask);
            return mask;
        }
        /**
         * 获取当前版本号（用于缓存失效）
         */
        get version() {
            return this._version;
        }
        /**
         * 获取所有实体
         */
        getAllEntities() {
            return this._entities;
        }
        /**
         * 获取系统统计信息
         *
         * 返回查询系统的详细统计信息，包括实体数量、索引状态、
         * 查询性能统计等，用于性能监控和调试。
         *
         * @returns 系统统计信息对象
         */
        getStats() {
            return {
                entityCount: this._entities.length,
                indexStats: {
                    componentIndexSize: this._archetypeSystem.getAllArchetypes().length,
                    tagIndexSize: this._entityIndex.byTag.size,
                    nameIndexSize: this._entityIndex.byName.size
                },
                queryStats: {
                    ...this._queryStats,
                    cacheHitRate: this._queryStats.totalQueries > 0
                        ? ((this._queryStats.cacheHits / this._queryStats.totalQueries) * 100).toFixed(2) + '%'
                        : '0%'
                },
                optimizationStats: {
                    archetypeSystem: this._archetypeSystem.getAllArchetypes().map((a) => ({
                        id: a.id,
                        componentTypes: a.componentTypes.map((t) => getComponentTypeName(t)),
                        entityCount: a.entities.size
                    }))
                },
                cacheStats: {
                    size: this._reactiveQueries.size,
                    hitRate: this._queryStats.totalQueries > 0
                        ? ((this._queryStats.cacheHits / this._queryStats.totalQueries) * 100).toFixed(2) + '%'
                        : '0%'
                }
            };
        }
        /**
         * 获取实体所属的原型信息
         *
         * @param entity 要查询的实体
         */
        getEntityArchetype(entity) {
            return this._archetypeSystem.getEntityArchetype(entity);
        }
        /**
         * 获取或创建内部响应式查询(作为智能缓存)
         *
         * @param queryType 查询类型
         * @param componentTypes 组件类型列表
         * @returns 响应式查询实例
         */
        getOrCreateReactiveQuery(queryType, componentTypes) {
            // 生成缓存键(与传统缓存键格式一致)
            const cacheKey = this.generateCacheKey(queryType, componentTypes);
            // 检查是否已存在响应式查询
            let reactiveQuery = this._reactiveQueries.get(cacheKey);
            if (!reactiveQuery) {
                // 创建查询条件
                const mask = this.createComponentMask(componentTypes);
                const condition = {
                    type: queryType,
                    componentTypes,
                    mask
                };
                // 创建响应式查询(禁用批量模式,保持实时性)
                reactiveQuery = new ReactiveQuery(condition, {
                    enableBatchMode: false,
                    debug: false
                });
                // 初始化查询结果(使用传统方式获取初始数据)
                const initialEntities = this.executeTraditionalQuery(queryType, componentTypes);
                reactiveQuery.initializeWith(initialEntities);
                // 注册响应式查询
                this._reactiveQueries.set(cacheKey, reactiveQuery);
                // 为每个组件类型注册索引
                for (const type of componentTypes) {
                    let queries = this._reactiveQueriesByComponent.get(type);
                    if (!queries) {
                        queries = new Set();
                        this._reactiveQueriesByComponent.set(type, queries);
                    }
                    queries.add(reactiveQuery);
                }
                this._logger.debug(`创建内部响应式查询缓存: ${cacheKey}`);
            }
            return reactiveQuery;
        }
        /**
         * 执行传统查询(内部使用,用于响应式查询初始化)
         *
         * @param queryType 查询类型
         * @param componentTypes 组件类型列表
         * @returns 匹配的实体列表
         */
        executeTraditionalQuery(queryType, componentTypes) {
            switch (queryType) {
                case QueryConditionType.ALL: {
                    const archetypeResult = this._archetypeSystem.queryArchetypes(componentTypes, 'AND');
                    const entities = [];
                    for (const archetype of archetypeResult.archetypes) {
                        for (const entity of archetype.entities) {
                            entities.push(entity);
                        }
                    }
                    return entities;
                }
                case QueryConditionType.ANY: {
                    const archetypeResult = this._archetypeSystem.queryArchetypes(componentTypes, 'OR');
                    const entities = [];
                    for (const archetype of archetypeResult.archetypes) {
                        for (const entity of archetype.entities) {
                            entities.push(entity);
                        }
                    }
                    return entities;
                }
                case QueryConditionType.NONE: {
                    const mask = this.createComponentMask(componentTypes);
                    return this._entities.filter((entity) => BitMask64Utils.hasNone(entity.componentMask, mask));
                }
                default:
                    return [];
            }
        }
        /**
         * 通知所有响应式查询实体已添加
         *
         * 使用组件类型索引,只通知关心该实体组件的查询
         *
         * @param entity 添加的实体
         */
        notifyReactiveQueriesEntityAdded(entity) {
            if (this._reactiveQueries.size === 0)
                return;
            const notified = new Set();
            for (const component of entity.components) {
                const componentType = component.constructor;
                const queries = this._reactiveQueriesByComponent.get(componentType);
                if (queries) {
                    for (const query of queries) {
                        if (!notified.has(query)) {
                            query.notifyEntityAdded(entity);
                            notified.add(query);
                        }
                    }
                }
            }
        }
        /**
         * 通知响应式查询实体已移除
         *
         * 使用组件类型索引,只通知关心该实体组件的查询
         *
         * @param entity 移除的实体
         * @param componentTypes 实体移除前的组件类型列表
         */
        notifyReactiveQueriesEntityRemoved(entity, componentTypes) {
            if (this._reactiveQueries.size === 0)
                return;
            const notified = new Set();
            for (const componentType of componentTypes) {
                const queries = this._reactiveQueriesByComponent.get(componentType);
                if (queries) {
                    for (const query of queries) {
                        if (!notified.has(query)) {
                            query.notifyEntityRemoved(entity);
                            notified.add(query);
                        }
                    }
                }
            }
        }
        /**
         * 通知响应式查询实体已移除(后备方案)
         *
         * 当实体已经清空组件时使用,通知所有查询
         *
         * @param entity 移除的实体
         */
        notifyReactiveQueriesEntityRemovedFallback(entity) {
            if (this._reactiveQueries.size === 0)
                return;
            for (const query of this._reactiveQueries.values()) {
                query.notifyEntityRemoved(entity);
            }
        }
        /**
         * 通知响应式查询实体已变化
         *
         * 使用混合策略:
         * 1. 首先通知关心实体当前组件的查询
         * 2. 然后通知所有其他查询(包括那些可能因为组件移除而不再匹配的查询)
         *
         * @param entity 变化的实体
         */
        notifyReactiveQueriesEntityChanged(entity) {
            if (this._reactiveQueries.size === 0) {
                return;
            }
            const notified = new Set();
            for (const component of entity.components) {
                const componentType = component.constructor;
                const queries = this._reactiveQueriesByComponent.get(componentType);
                if (queries) {
                    for (const query of queries) {
                        if (!notified.has(query)) {
                            query.notifyEntityChanged(entity);
                            notified.add(query);
                        }
                    }
                }
            }
            for (const query of this._reactiveQueries.values()) {
                if (!notified.has(query)) {
                    query.notifyEntityChanged(entity);
                }
            }
        }
    }
    /**
     * 查询构建器
     *
     * 提供链式API来构建复杂的实体查询条件。
     * 支持组合多种查询条件，创建灵活的查询表达式。
     *
     * @example
     * ```typescript
     * const result = new QueryBuilder(querySystem)
     *     .withAll(PositionComponent, VelocityComponent)
     *     .without(DeadComponent)
     *     .execute();
     * ```
     */
    class QueryBuilder {
        constructor(querySystem) {
            this._logger = createLogger('QueryBuilder');
            this.conditions = [];
            this.querySystem = querySystem;
        }
        /**
         * 添加"必须包含所有组件"条件
         *
         * @param componentTypes 必须包含的组件类型
         * @returns 查询构建器实例，支持链式调用
         */
        withAll(...componentTypes) {
            this.conditions.push({
                type: QueryConditionType.ALL,
                componentTypes,
                mask: this.createComponentMask(componentTypes)
            });
            return this;
        }
        /**
         * 添加"必须包含任意组件"条件
         *
         * @param componentTypes 必须包含其中任意一个的组件类型
         * @returns 查询构建器实例，支持链式调用
         */
        withAny(...componentTypes) {
            this.conditions.push({
                type: QueryConditionType.ANY,
                componentTypes,
                mask: this.createComponentMask(componentTypes)
            });
            return this;
        }
        /**
         * 添加"不能包含任何组件"条件
         *
         * @param componentTypes 不能包含的组件类型
         * @returns 查询构建器实例，支持链式调用
         */
        without(...componentTypes) {
            this.conditions.push({
                type: QueryConditionType.NONE,
                componentTypes,
                mask: this.createComponentMask(componentTypes)
            });
            return this;
        }
        /**
         * 执行查询并返回结果
         *
         * 根据已添加的查询条件执行实体查询。
         *
         * @returns 查询结果，包含匹配的实体和性能信息
         */
        execute() {
            const startTime = performance.now();
            // 简化实现：目前只支持单一条件
            if (this.conditions.length === 1) {
                const condition = this.conditions[0];
                switch (condition.type) {
                    case QueryConditionType.ALL:
                        return this.querySystem.queryAll(...condition.componentTypes);
                    case QueryConditionType.ANY:
                        return this.querySystem.queryAny(...condition.componentTypes);
                    case QueryConditionType.NONE:
                        return this.querySystem.queryNone(...condition.componentTypes);
                }
            }
            // 多条件查询的复杂实现留待后续扩展
            return {
                entities: [],
                count: 0,
                executionTime: performance.now() - startTime,
                fromCache: false
            };
        }
        /**
         * 创建组件掩码
         */
        createComponentMask(componentTypes) {
            const mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            for (const type of componentTypes) {
                try {
                    const bitMask = ComponentRegistry.getBitMask(type);
                    BitMask64Utils.orInPlace(mask, bitMask);
                }
                catch (error) {
                    this._logger.warn(`组件类型 ${getComponentTypeName(type)} 未注册，跳过`);
                }
            }
            return mask;
        }
        /**
         * 重置查询构建器
         *
         * 清除所有已添加的查询条件，重新开始构建查询。
         *
         * @returns 查询构建器实例，支持链式调用
         */
        reset() {
            this.conditions = [];
            return this;
        }
    }

    /**
     * 类型安全的高性能事件系统
     * 支持同步/异步事件、优先级、批处理等功能
     */
    class TypeSafeEventSystem {
        constructor() {
            this.listeners = new Map();
            this.stats = new Map();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.batchQueue = new Map();
            this.batchTimers = new Map();
            this.batchConfigs = new Map();
            this.nextListenerId = 0;
            this.isEnabled = true;
            this.maxListeners = 100; // 每个事件类型的最大监听器数量
        }
        /**
         * 添加事件监听器
         * @param eventType 事件类型
         * @param handler 事件处理器（同步或异步，根据 config.async 决定）
         * @param config 监听器配置
         * @returns 监听器ID（用于移除）
         */
        on(eventType, handler, config = {}) {
            return this.addListener(eventType, handler, config);
        }
        /**
         * 添加一次性事件监听器
         * @param eventType 事件类型
         * @param handler 事件处理器
         * @param config 监听器配置
         * @returns 监听器ID
         */
        once(eventType, handler, config = {}) {
            return this.addListener(eventType, handler, { ...config, once: true });
        }
        /**
         * 添加异步事件监听器
         * @param eventType 事件类型
         * @param handler 异步事件处理器
         * @param config 监听器配置
         * @returns 监听器ID
         */
        onAsync(eventType, handler, config = {}) {
            return this.addListener(eventType, handler, { ...config, async: true });
        }
        /**
         * 移除事件监听器
         * @param eventType 事件类型
         * @param listenerId 监听器ID
         * @returns 是否成功移除
         */
        off(eventType, listenerId) {
            const listeners = this.listeners.get(eventType);
            if (!listeners)
                return false;
            const index = listeners.findIndex((l) => l.id === listenerId);
            if (index === -1)
                return false;
            listeners.splice(index, 1);
            // 如果没有监听器了，清理相关数据
            if (listeners.length === 0) {
                this.listeners.delete(eventType);
                this.stats.delete(eventType);
            }
            return true;
        }
        /**
         * 移除指定事件类型的所有监听器
         * @param eventType 事件类型
         */
        offAll(eventType) {
            this.listeners.delete(eventType);
            this.stats.delete(eventType);
            this.clearBatch(eventType);
        }
        /**
         * 触发事件
         * @param eventType 事件类型
         * @param event 事件数据
         * @returns Promise（如果有异步监听器）
         */
        async emit(eventType, event) {
            if (!this.isEnabled)
                return;
            // 检查是否启用了批处理
            const batchConfig = this.batchConfigs.get(eventType);
            if (batchConfig?.enabled) {
                this.addToBatch(eventType, event);
                return;
            }
            await this.executeEvent(eventType, event);
        }
        /**
         * 同步触发事件（忽略异步监听器）
         * @param eventType 事件类型
         * @param event 事件数据
         */
        emitSync(eventType, event) {
            if (!this.isEnabled)
                return;
            const listeners = this.listeners.get(eventType);
            if (!listeners || listeners.length === 0)
                return;
            const startTime = performance.now();
            const toRemove = [];
            // 按优先级排序
            const sortedListeners = this.sortListenersByPriority(listeners);
            for (const listener of sortedListeners) {
                if (listener.config.async)
                    continue; // 跳过异步监听器
                try {
                    if (listener.config.thisArg) {
                        listener.handler.call(listener.config.thisArg, event);
                    }
                    else {
                        listener.handler(event);
                    }
                    if (listener.config.once) {
                        toRemove.push(listener.id);
                    }
                }
                catch (error) {
                    TypeSafeEventSystem._logger.error(`事件处理器执行错误 ${eventType}:`, error);
                }
            }
            // 移除一次性监听器
            this.removeListeners(eventType, toRemove);
            // 更新统计信息
            this.updateStats(eventType, performance.now() - startTime);
        }
        /**
         * 设置事件批处理配置
         * @param eventType 事件类型
         * @param config 批处理配置
         */
        setBatchConfig(eventType, config) {
            this.batchConfigs.set(eventType, config);
        }
        /**
         * 立即处理指定事件类型的批处理队列
         * @param eventType 事件类型
         */
        flushBatch(eventType) {
            const batch = this.batchQueue.get(eventType);
            if (!batch || batch.length === 0)
                return;
            // 清除定时器
            const timer = this.batchTimers.get(eventType);
            if (timer) {
                clearTimeout(timer);
                this.batchTimers.delete(eventType);
            }
            // 处理批处理事件
            this.processBatch(eventType, batch);
            // 清空队列
            this.batchQueue.delete(eventType);
        }
        /**
         * 获取事件统计信息
         * @param eventType 事件类型（可选）
         * @returns 统计信息
         */
        getStats(eventType) {
            if (eventType) {
                return this.stats.get(eventType) || this.createEmptyStats(eventType);
            }
            return new Map(this.stats);
        }
        /**
         * 重置统计信息
         * @param eventType 事件类型（可选，不指定则重置所有）
         */
        resetStats(eventType) {
            if (eventType) {
                this.stats.delete(eventType);
            }
            else {
                this.stats.clear();
            }
        }
        /**
         * 启用/禁用事件系统
         * @param enabled 是否启用
         */
        setEnabled(enabled) {
            this.isEnabled = enabled;
        }
        /**
         * 检查是否有指定事件类型的监听器
         * @param eventType 事件类型
         * @returns 是否有监听器
         */
        hasListeners(eventType) {
            const listeners = this.listeners.get(eventType);
            return listeners ? listeners.length > 0 : false;
        }
        /**
         * 获取指定事件类型的监听器数量
         * @param eventType 事件类型
         * @returns 监听器数量
         */
        getListenerCount(eventType) {
            const listeners = this.listeners.get(eventType);
            return listeners ? listeners.length : 0;
        }
        /**
         * 清空所有事件监听器和数据
         */
        clear() {
            this.listeners.clear();
            this.stats.clear();
            this.clearAllBatches();
        }
        /**
         * 设置每个事件类型的最大监听器数量
         * @param max 最大数量
         */
        setMaxListeners(max) {
            this.maxListeners = max;
        }
        /**
         * 添加监听器的内部实现
         * @param eventType 事件类型
         * @param handler 事件处理器
         * @param config 配置
         * @returns 监听器ID
         */
        addListener(eventType, handler, config) {
            let listeners = this.listeners.get(eventType);
            if (!listeners) {
                listeners = [];
                this.listeners.set(eventType, listeners);
            }
            // 检查监听器数量限制
            if (listeners.length >= this.maxListeners) {
                TypeSafeEventSystem._logger.warn(`事件类型 ${eventType} 的监听器数量超过最大限制 (${this.maxListeners})`);
                return '';
            }
            const listenerId = `listener_${this.nextListenerId++}`;
            const listener = {
                handler,
                config: {
                    priority: 0,
                    ...config
                },
                id: listenerId
            };
            listeners.push(listener);
            // 初始化统计信息
            if (!this.stats.has(eventType)) {
                this.stats.set(eventType, this.createEmptyStats(eventType));
            }
            return listenerId;
        }
        /**
         * 执行事件的内部实现
         * @param eventType 事件类型
         * @param event 事件数据
         */
        async executeEvent(eventType, event) {
            const listeners = this.listeners.get(eventType);
            if (!listeners || listeners.length === 0)
                return;
            const startTime = performance.now();
            const toRemove = [];
            // 按优先级排序
            const sortedListeners = this.sortListenersByPriority(listeners);
            // 分离同步和异步监听器
            const syncListeners = sortedListeners.filter((l) => !l.config.async);
            const asyncListeners = sortedListeners.filter((l) => l.config.async);
            // 执行同步监听器
            for (const listener of syncListeners) {
                try {
                    if (listener.config.thisArg) {
                        listener.handler.call(listener.config.thisArg, event);
                    }
                    else {
                        listener.handler(event);
                    }
                    if (listener.config.once) {
                        toRemove.push(listener.id);
                    }
                }
                catch (error) {
                    TypeSafeEventSystem._logger.error(`同步事件处理器执行错误 ${eventType}:`, error);
                }
            }
            // 执行异步监听器
            const asyncPromises = asyncListeners.map(async (listener) => {
                try {
                    if (listener.config.thisArg) {
                        await listener.handler.call(listener.config.thisArg, event);
                    }
                    else {
                        await listener.handler(event);
                    }
                    if (listener.config.once) {
                        toRemove.push(listener.id);
                    }
                }
                catch (error) {
                    TypeSafeEventSystem._logger.error(`异步事件处理器执行错误 ${eventType}:`, error);
                }
            });
            // 等待所有异步监听器完成
            await Promise.all(asyncPromises);
            // 移除一次性监听器
            this.removeListeners(eventType, toRemove);
            // 更新统计信息
            this.updateStats(eventType, performance.now() - startTime);
        }
        /**
         * 按优先级排序监听器
         * @param listeners 监听器数组
         * @returns 排序后的监听器数组
         */
        sortListenersByPriority(listeners) {
            return listeners.slice().sort((a, b) => (b.config.priority || 0) - (a.config.priority || 0));
        }
        /**
         * 移除指定的监听器
         * @param eventType 事件类型
         * @param listenerIds 要移除的监听器ID数组
         */
        removeListeners(eventType, listenerIds) {
            if (listenerIds.length === 0)
                return;
            const listeners = this.listeners.get(eventType);
            if (!listeners)
                return;
            for (const id of listenerIds) {
                const index = listeners.findIndex((l) => l.id === id);
                if (index !== -1) {
                    listeners.splice(index, 1);
                }
            }
            // 如果没有监听器了，清理相关数据
            if (listeners.length === 0) {
                this.listeners.delete(eventType);
                this.stats.delete(eventType);
            }
        }
        /**
         * 添加事件到批处理队列
         * @param eventType 事件类型
         * @param event 事件数据
         */
        addToBatch(eventType, event) {
            let batch = this.batchQueue.get(eventType);
            if (!batch) {
                batch = [];
                this.batchQueue.set(eventType, batch);
            }
            batch.push(event);
            const config = this.batchConfigs.get(eventType);
            // 如果达到批处理大小，立即处理
            if (batch.length >= config.batchSize) {
                this.flushBatch(eventType);
                return;
            }
            // 设置延迟处理定时器
            if (!this.batchTimers.has(eventType)) {
                const timer = setTimeout(() => {
                    this.flushBatch(eventType);
                }, config.delay);
                this.batchTimers.set(eventType, timer);
            }
        }
        /**
         * 处理批处理事件
         * @param eventType 事件类型
         * @param batch 批处理事件数组
         */
        async processBatch(eventType, batch) {
            // 创建批处理事件对象
            const batchEvent = {
                type: eventType,
                events: batch,
                count: batch.length,
                timestamp: Date.now()
            };
            // 触发批处理事件
            await this.executeEvent(`${eventType}:batch`, batchEvent);
        }
        /**
         * 清除指定事件类型的批处理
         * @param eventType 事件类型
         */
        clearBatch(eventType) {
            this.batchQueue.delete(eventType);
            const timer = this.batchTimers.get(eventType);
            if (timer) {
                clearTimeout(timer);
                this.batchTimers.delete(eventType);
            }
        }
        /**
         * 清除所有批处理
         */
        clearAllBatches() {
            this.batchQueue.clear();
            for (const timer of this.batchTimers.values()) {
                clearTimeout(timer);
            }
            this.batchTimers.clear();
            this.batchConfigs.clear();
        }
        /**
         * 更新事件统计信息
         * @param eventType 事件类型
         * @param executionTime 执行时间
         */
        updateStats(eventType, executionTime) {
            let stats = this.stats.get(eventType);
            if (!stats) {
                stats = this.createEmptyStats(eventType);
                this.stats.set(eventType, stats);
            }
            stats.triggerCount++;
            stats.totalExecutionTime += executionTime;
            stats.averageExecutionTime = stats.totalExecutionTime / stats.triggerCount;
            stats.lastTriggerTime = Date.now();
            stats.listenerCount = this.getListenerCount(eventType);
        }
        /**
         * 创建空的统计信息
         * @param eventType 事件类型
         * @returns 空的统计信息
         */
        createEmptyStats(eventType) {
            return {
                eventType,
                listenerCount: 0,
                triggerCount: 0,
                totalExecutionTime: 0,
                averageExecutionTime: 0,
                lastTriggerTime: 0
            };
        }
    }
    TypeSafeEventSystem._logger = createLogger('EventSystem');

    /**
     * 类型安全的Query查询系统
     *
     * 提供完整的TypeScript类型推断，在编译时确保类型安全
     */
    /**
     * 类型安全的查询构建器
     *
     * 支持链式调用，自动推断查询结果的类型
     *
     * @example
     * ```typescript
     * // 基础查询
     * const query = new TypedQueryBuilder()
     *     .withAll(Position, Velocity)
     *     .build();
     *
     * // 复杂查询
     * const complexQuery = new TypedQueryBuilder()
     *     .withAll(Transform, Renderer)
     *     .withAny(BoxCollider, CircleCollider)
     *     .withNone(Disabled)
     *     .withTag(EntityTags.Enemy)
     *     .build();
     * ```
     */
    class TypedQueryBuilder {
        constructor(all, any, none, tag, name) {
            this._all = (all || []);
            this._any = (any || []);
            this._none = (none || []);
            if (tag !== undefined) {
                this._tag = tag;
            }
            if (name !== undefined) {
                this._name = name;
            }
        }
        /**
         * 要求实体拥有所有指定的组件
         *
         * @param types 组件类型
         * @returns 新的查询构建器，类型参数更新
         */
        withAll(...types) {
            return new TypedQueryBuilder([...this._all, ...types], this._any, this._none, this._tag, this._name);
        }
        /**
         * 要求实体至少拥有一个指定的组件
         *
         * @param types 组件类型
         * @returns 新的查询构建器
         */
        withAny(...types) {
            return new TypedQueryBuilder(this._all, [...this._any, ...types], this._none, this._tag, this._name);
        }
        /**
         * 排除拥有指定组件的实体
         *
         * @param types 组件类型
         * @returns 新的查询构建器
         */
        withNone(...types) {
            return new TypedQueryBuilder(this._all, this._any, [...this._none, ...types], this._tag, this._name);
        }
        /**
         * 按标签过滤实体
         *
         * @param tag 标签值
         * @returns 新的查询构建器
         */
        withTag(tag) {
            return new TypedQueryBuilder(this._all, this._any, this._none, tag, this._name);
        }
        /**
         * 按名称过滤实体
         *
         * @param name 实体名称
         * @returns 新的查询构建器
         */
        withName(name) {
            return new TypedQueryBuilder(this._all, this._any, this._none, this._tag, name);
        }
        /**
         * 构建Matcher对象
         *
         * @returns Matcher实例，用于传统查询API
         */
        buildMatcher() {
            let matcher = Matcher.complex();
            if (this._all.length > 0) {
                matcher = matcher.all(...this._all);
            }
            if (this._any.length > 0) {
                matcher = matcher.any(...this._any);
            }
            if (this._none.length > 0) {
                matcher = matcher.none(...this._none);
            }
            if (this._tag !== undefined) {
                matcher = matcher.withTag(this._tag);
            }
            if (this._name !== undefined) {
                matcher = matcher.withName(this._name);
            }
            return matcher;
        }
        /**
         * 获取查询条件
         *
         * @returns 查询条件对象
         */
        getCondition() {
            return {
                all: [...this._all],
                any: [...this._any],
                none: [...this._none],
                ...(this._tag !== undefined && { tag: this._tag }),
                ...(this._name !== undefined && { name: this._name })
            };
        }
        /**
         * 获取required组件类型（用于类型推断）
         */
        getRequiredTypes() {
            return this._all;
        }
        /**
         * 克隆查询构建器
         */
        clone() {
            return new TypedQueryBuilder([...this._all], [...this._any], [...this._none], this._tag, this._name);
        }
    }

    /**
     * 序列化装饰器
     *
     * 提供组件级别的序列化支持，包括字段级装饰器和类级装饰器
     */
    /**
     * 序列化元数据的Symbol键
     */
    const SERIALIZABLE_METADATA = Symbol('SerializableMetadata');
    /**
     * 组件可序列化装饰器
     *
     * 标记组件类为可序列化，必须与字段装饰器配合使用
     *
     * @param options 序列化配置选项
     *
     * @example
     * ```typescript
     * @ECSComponent('Player')
     * @Serializable({ version: 1 })
     * class PlayerComponent extends Component {
     *     @Serialize() name: string = 'Player';
     *     @Serialize() level: number = 1;
     * }
     * ```
     */
    function Serializable(options) {
        return function (target) {
            if (!options || typeof options.version !== 'number') {
                throw new Error('Serializable装饰器必须提供有效的版本号');
            }
            // 初始化或获取现有元数据
            let metadata = target[SERIALIZABLE_METADATA];
            if (!metadata) {
                metadata = {
                    options,
                    fields: new Map(),
                    ignoredFields: new Set()
                };
                target[SERIALIZABLE_METADATA] = metadata;
            }
            else {
                metadata.options = options;
            }
            return target;
        };
    }
    /**
     * 字段序列化装饰器
     *
     * 标记字段为可序列化
     *
     * @param options 字段序列化选项（可选）
     *
     * @example
     * ```typescript
     * @Serialize()
     * name: string = 'Player';
     *
     * @Serialize({ alias: 'hp' })
     * health: number = 100;
     * ```
     */
    function Serialize(options) {
        return function (target, propertyKey) {
            const constructor = target.constructor;
            // 获取或创建元数据
            let metadata = constructor[SERIALIZABLE_METADATA];
            if (!metadata) {
                metadata = {
                    options: { version: 1 }, // 默认版本
                    fields: new Map(),
                    ignoredFields: new Set()
                };
                constructor[SERIALIZABLE_METADATA] = metadata;
            }
            // 记录字段
            metadata.fields.set(propertyKey, {});
        };
    }
    /**
     * 获取组件的序列化元数据
     *
     * @param componentClass 组件类或组件实例
     * @returns 序列化元数据，如果组件不可序列化则返回null
     */
    function getSerializationMetadata(componentClass) {
        if (!componentClass) {
            return null;
        }
        // 如果是实例，获取其构造函数
        const constructor = typeof componentClass === 'function'
            ? componentClass
            : componentClass.constructor;
        return constructor[SERIALIZABLE_METADATA] || null;
    }

    /**
     * 组件序列化器
     *
     * 负责组件的序列化和反序列化操作
     */
    /**
     * 组件序列化器类
     */
    class ComponentSerializer {
        /**
         * 序列化单个组件
         *
         * @param component 要序列化的组件实例
         * @returns 序列化后的组件数据，如果组件不可序列化则返回null
         */
        static serialize(component) {
            const metadata = getSerializationMetadata(component);
            if (!metadata) {
                // 组件没有使用@Serializable装饰器，不可序列化
                return null;
            }
            const componentType = component.constructor;
            const typeName = metadata.options.typeId || getComponentTypeName(componentType);
            const data = {};
            // 序列化标记的字段
            for (const [fieldName, options] of metadata.fields) {
                const fieldKey = typeof fieldName === 'symbol' ? fieldName.toString() : fieldName;
                const value = component[fieldName];
                // 跳过忽略的字段
                if (metadata.ignoredFields.has(fieldName)) {
                    continue;
                }
                // 使用自定义序列化器或默认序列化
                const serializedValue = options.serializer
                    ? options.serializer(value)
                    : this.serializeValue(value);
                // 使用别名或原始字段名
                const key = options.alias || fieldKey;
                data[key] = serializedValue;
            }
            return {
                type: typeName,
                version: metadata.options.version,
                data
            };
        }
        /**
         * 反序列化组件
         *
         * @param serializedData 序列化的组件数据
         * @param componentRegistry 组件类型注册表 (类型名 -> 构造函数)
         * @returns 反序列化后的组件实例，如果失败则返回null
         */
        static deserialize(serializedData, componentRegistry) {
            const componentClass = componentRegistry.get(serializedData.type);
            if (!componentClass) {
                console.warn(`未找到组件类型: ${serializedData.type}`);
                return null;
            }
            const metadata = getSerializationMetadata(componentClass);
            if (!metadata) {
                console.warn(`组件 ${serializedData.type} 不可序列化`);
                return null;
            }
            // 创建组件实例
            const component = new componentClass();
            // 反序列化字段
            for (const [fieldName, options] of metadata.fields) {
                const fieldKey = typeof fieldName === 'symbol' ? fieldName.toString() : fieldName;
                const key = options.alias || fieldKey;
                const serializedValue = serializedData.data[key];
                if (serializedValue === undefined) {
                    continue; // 字段不存在于序列化数据中
                }
                // 使用自定义反序列化器或默认反序列化
                const value = options.deserializer
                    ? options.deserializer(serializedValue)
                    : this.deserializeValue(serializedValue);
                component[fieldName] = value;
            }
            return component;
        }
        /**
         * 批量序列化组件
         *
         * @param components 组件数组
         * @returns 序列化后的组件数据数组
         */
        static serializeComponents(components) {
            const result = [];
            for (const component of components) {
                const serialized = this.serialize(component);
                if (serialized) {
                    result.push(serialized);
                }
            }
            return result;
        }
        /**
         * 批量反序列化组件
         *
         * @param serializedComponents 序列化的组件数据数组
         * @param componentRegistry 组件类型注册表
         * @returns 反序列化后的组件数组
         */
        static deserializeComponents(serializedComponents, componentRegistry) {
            const result = [];
            for (const serialized of serializedComponents) {
                const component = this.deserialize(serialized, componentRegistry);
                if (component) {
                    result.push(component);
                }
            }
            return result;
        }
        /**
         * 默认值序列化
         *
         * 处理基本类型、数组、对象等的序列化
         */
        static serializeValue(value) {
            if (value === null || value === undefined) {
                return value;
            }
            // 基本类型
            const type = typeof value;
            if (type === 'string' || type === 'number' || type === 'boolean') {
                return value;
            }
            // 日期
            if (value instanceof Date) {
                return {
                    __type: 'Date',
                    value: value.toISOString()
                };
            }
            // 数组
            if (Array.isArray(value)) {
                return value.map((item) => this.serializeValue(item));
            }
            // Map (如果没有使用@SerializeMap装饰器)
            if (value instanceof Map) {
                return {
                    __type: 'Map',
                    value: Array.from(value.entries())
                };
            }
            // Set
            if (value instanceof Set) {
                return {
                    __type: 'Set',
                    value: Array.from(value)
                };
            }
            // 普通对象
            if (type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
                const result = {};
                const obj = value;
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        result[key] = this.serializeValue(obj[key]);
                    }
                }
                return result;
            }
            // 其他类型（函数等）不序列化
            return undefined;
        }
        /**
         * 默认值反序列化
         */
        static deserializeValue(value) {
            if (value === null || value === undefined) {
                return value;
            }
            // 基本类型直接返回
            const type = typeof value;
            if (type === 'string' || type === 'number' || type === 'boolean') {
                return value;
            }
            // 处理特殊类型标记
            if (type === 'object' && typeof value === 'object' && '__type' in value) {
                const typedValue = value;
                switch (typedValue.__type) {
                    case 'Date':
                        return { __type: 'Date', value: typeof typedValue.value === 'string' ? typedValue.value : String(typedValue.value) };
                    case 'Map':
                        return { __type: 'Map', value: typedValue.value };
                    case 'Set':
                        return { __type: 'Set', value: typedValue.value };
                }
            }
            // 数组
            if (Array.isArray(value)) {
                return value.map((item) => this.deserializeValue(item));
            }
            // 普通对象
            if (type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
                const result = {};
                const obj = value;
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        result[key] = this.deserializeValue(obj[key]);
                    }
                }
                return result;
            }
            return value;
        }
        /**
         * 验证序列化数据的版本
         *
         * @param serializedData 序列化数据
         * @param expectedVersion 期望的版本号
         * @returns 版本是否匹配
         */
        static validateVersion(serializedData, expectedVersion) {
            return serializedData.version === expectedVersion;
        }
        /**
         * 获取组件的序列化信息
         *
         * @param component 组件实例或组件类
         * @returns 序列化信息对象，包含类型名、版本、可序列化字段列表
         */
        static getSerializationInfo(component) {
            const metadata = getSerializationMetadata(component);
            if (!metadata) {
                return {
                    type: 'unknown',
                    version: 0,
                    fields: [],
                    ignoredFields: [],
                    isSerializable: false
                };
            }
            const componentType = typeof component === 'function'
                ? component
                : component.constructor;
            return {
                type: metadata.options.typeId || getComponentTypeName(componentType),
                version: metadata.options.version,
                fields: Array.from(metadata.fields.keys()).map((k) => typeof k === 'symbol' ? k.toString() : k),
                ignoredFields: Array.from(metadata.ignoredFields).map((k) => typeof k === 'symbol' ? k.toString() : k),
                isSerializable: true
            };
        }
    }

    /**
     * 实体序列化器
     *
     * 负责实体的序列化和反序列化操作
     */
    /**
     * 实体序列化器类
     */
    class EntitySerializer {
        /**
         * 序列化单个实体
         *
         * @param entity 要序列化的实体
         * @param includeChildren 是否包含子实体（默认true）
         * @returns 序列化后的实体数据
         */
        static serialize(entity, includeChildren = true) {
            const serializedComponents = ComponentSerializer.serializeComponents(Array.from(entity.components));
            const serializedEntity = {
                id: entity.id,
                name: entity.name,
                tag: entity.tag,
                active: entity.active,
                enabled: entity.enabled,
                updateOrder: entity.updateOrder,
                components: serializedComponents,
                children: []
            };
            // 序列化父实体引用
            if (entity.parent) {
                serializedEntity.parentId = entity.parent.id;
            }
            // 序列化子实体
            if (includeChildren) {
                for (const child of entity.children) {
                    serializedEntity.children.push(this.serialize(child, true));
                }
            }
            return serializedEntity;
        }
        /**
         * 反序列化实体
         *
         * @param serializedEntity 序列化的实体数据
         * @param componentRegistry 组件类型注册表
         * @param idGenerator 实体ID生成器（用于生成新ID或保持原ID）
         * @param preserveIds 是否保持原始ID（默认false）
         * @param scene 目标场景（可选，用于设置entity.scene以支持添加组件）
         * @returns 反序列化后的实体
         */
        static deserialize(serializedEntity, componentRegistry, idGenerator, preserveIds = false, scene) {
            // 创建实体（使用原始ID或新生成的ID）
            const entityId = preserveIds ? serializedEntity.id : idGenerator();
            const entity = new Entity(serializedEntity.name, entityId);
            // 如果提供了scene，先设置entity.scene以支持添加组件
            if (scene) {
                entity.scene = scene;
            }
            // 恢复实体属性
            entity.tag = serializedEntity.tag;
            entity.active = serializedEntity.active;
            entity.enabled = serializedEntity.enabled;
            entity.updateOrder = serializedEntity.updateOrder;
            // 反序列化组件
            const components = ComponentSerializer.deserializeComponents(serializedEntity.components, componentRegistry);
            for (const component of components) {
                entity.addComponent(component);
            }
            // 反序列化子实体
            for (const childData of serializedEntity.children) {
                const childEntity = this.deserialize(childData, componentRegistry, idGenerator, preserveIds, scene);
                entity.addChild(childEntity);
            }
            return entity;
        }
        /**
         * 批量序列化实体
         *
         * @param entities 实体数组
         * @param includeChildren 是否包含子实体
         * @returns 序列化后的实体数据数组
         */
        static serializeEntities(entities, includeChildren = true) {
            const result = [];
            for (const entity of entities) {
                // 只序列化顶层实体（没有父实体的实体）
                // 子实体会在父实体序列化时一并处理
                if (!entity.parent || !includeChildren) {
                    result.push(this.serialize(entity, includeChildren));
                }
            }
            return result;
        }
        /**
         * 批量反序列化实体
         *
         * @param serializedEntities 序列化的实体数据数组
         * @param componentRegistry 组件类型注册表
         * @param idGenerator 实体ID生成器
         * @param preserveIds 是否保持原始ID
         * @param scene 目标场景（可选，用于设置entity.scene以支持添加组件）
         * @returns 反序列化后的实体数组
         */
        static deserializeEntities(serializedEntities, componentRegistry, idGenerator, preserveIds = false, scene) {
            const result = [];
            for (const serialized of serializedEntities) {
                const entity = this.deserialize(serialized, componentRegistry, idGenerator, preserveIds, scene);
                result.push(entity);
            }
            return result;
        }
        /**
         * 创建实体的深拷贝
         *
         * @param entity 要拷贝的实体
         * @param componentRegistry 组件类型注册表
         * @param idGenerator ID生成器
         * @returns 拷贝后的新实体
         */
        static clone(entity, componentRegistry, idGenerator) {
            const serialized = this.serialize(entity, true);
            return this.deserialize(serialized, componentRegistry, idGenerator, false);
        }
    }

    /**
     * 二进制序列化器
     * 将对象转换为UTF8字节数组
     */
    class BinarySerializer {
        /**
         * 将字符串编码为UTF8字节数组
         */
        static stringToUtf8(str) {
            const len = str.length;
            let pos = 0;
            const bytes = [];
            for (let i = 0; i < len; i++) {
                let code = str.charCodeAt(i);
                if (code >= 0xD800 && code <= 0xDBFF && i + 1 < len) {
                    const high = code;
                    const low = str.charCodeAt(i + 1);
                    if (low >= 0xDC00 && low <= 0xDFFF) {
                        code = 0x10000 + ((high - 0xD800) << 10) + (low - 0xDC00);
                        i++;
                    }
                }
                if (code < 0x80) {
                    bytes[pos++] = code;
                }
                else if (code < 0x800) {
                    bytes[pos++] = 0xC0 | (code >> 6);
                    bytes[pos++] = 0x80 | (code & 0x3F);
                }
                else if (code < 0x10000) {
                    bytes[pos++] = 0xE0 | (code >> 12);
                    bytes[pos++] = 0x80 | ((code >> 6) & 0x3F);
                    bytes[pos++] = 0x80 | (code & 0x3F);
                }
                else {
                    bytes[pos++] = 0xF0 | (code >> 18);
                    bytes[pos++] = 0x80 | ((code >> 12) & 0x3F);
                    bytes[pos++] = 0x80 | ((code >> 6) & 0x3F);
                    bytes[pos++] = 0x80 | (code & 0x3F);
                }
            }
            return new Uint8Array(bytes);
        }
        /**
         * 将UTF8字节数组解码为字符串
         */
        static utf8ToString(bytes) {
            const len = bytes.length;
            let str = '';
            let i = 0;
            while (i < len) {
                const byte1 = bytes[i++];
                if (byte1 === undefined)
                    break;
                if (byte1 < 0x80) {
                    str += String.fromCharCode(byte1);
                }
                else if ((byte1 & 0xE0) === 0xC0) {
                    const byte2 = bytes[i++];
                    if (byte2 === undefined)
                        break;
                    str += String.fromCharCode(((byte1 & 0x1F) << 6) | (byte2 & 0x3F));
                }
                else if ((byte1 & 0xF0) === 0xE0) {
                    const byte2 = bytes[i++];
                    const byte3 = bytes[i++];
                    if (byte2 === undefined || byte3 === undefined)
                        break;
                    str += String.fromCharCode(((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F));
                }
                else if ((byte1 & 0xF8) === 0xF0) {
                    const byte2 = bytes[i++];
                    const byte3 = bytes[i++];
                    const byte4 = bytes[i++];
                    if (byte2 === undefined || byte3 === undefined || byte4 === undefined)
                        break;
                    let code = ((byte1 & 0x07) << 18) | ((byte2 & 0x3F) << 12) |
                        ((byte3 & 0x3F) << 6) | (byte4 & 0x3F);
                    code -= 0x10000;
                    str += String.fromCharCode(0xD800 + (code >> 10), 0xDC00 + (code & 0x3FF));
                }
            }
            return str;
        }
        /**
         * 将对象编码为二进制数据
         */
        static encode(value) {
            const jsonString = JSON.stringify(value);
            return this.stringToUtf8(jsonString);
        }
        /**
         * 将二进制数据解码为对象
         */
        static decode(bytes) {
            const jsonString = this.utf8ToString(bytes);
            return JSON.parse(jsonString);
        }
    }

    /**
     * 场景序列化器
     *
     * 负责整个场景的序列化和反序列化，包括实体、组件等
     */
    /**
     * 场景序列化器类
     */
    class SceneSerializer {
        /**
         * 序列化场景
         *
         * @param scene 要序列化的场景
         * @param options 序列化选项
         * @returns 序列化后的数据（JSON字符串或二进制Uint8Array）
         */
        static serialize(scene, options) {
            const opts = {
                systems: false,
                format: 'json',
                pretty: true,
                includeMetadata: true,
                ...options
            };
            // 过滤实体和组件
            const entities = this.filterEntities(scene, opts);
            // 序列化实体
            const serializedEntities = EntitySerializer.serializeEntities(entities, true);
            // 收集组件类型信息
            const componentTypeRegistry = this.buildComponentTypeRegistry(entities);
            // 序列化场景自定义数据
            const sceneData = this.serializeSceneData(scene.sceneData);
            // 构建序列化数据
            const serializedScene = {
                name: scene.name,
                version: this.SERIALIZATION_VERSION,
                entities: serializedEntities,
                componentTypeRegistry
            };
            // 添加场景数据（如果有）
            if (sceneData && Object.keys(sceneData).length > 0) {
                serializedScene.sceneData = sceneData;
            }
            // 添加元数据
            if (opts.includeMetadata) {
                serializedScene.timestamp = Date.now();
                serializedScene.metadata = {
                    entityCount: serializedEntities.length,
                    componentTypeCount: componentTypeRegistry.length,
                    serializationOptions: opts
                };
            }
            if (opts.format === 'json') {
                return opts.pretty
                    ? JSON.stringify(serializedScene, null, 2)
                    : JSON.stringify(serializedScene);
            }
            else {
                return BinarySerializer.encode(serializedScene);
            }
        }
        /**
         * 反序列化场景
         *
         * @param scene 目标场景
         * @param saveData 序列化的数据（JSON字符串或二进制Uint8Array）
         * @param options 反序列化选项
         */
        static deserialize(scene, saveData, options) {
            const opts = {
                strategy: 'replace',
                preserveIds: false,
                ...options
            };
            let serializedScene;
            try {
                if (typeof saveData === 'string') {
                    serializedScene = JSON.parse(saveData);
                }
                else {
                    serializedScene = BinarySerializer.decode(saveData);
                }
            }
            catch (error) {
                throw new Error(`Failed to parse save data: ${error}`);
            }
            // 版本迁移
            if (opts.migration && serializedScene.version !== this.SERIALIZATION_VERSION) {
                serializedScene = opts.migration(serializedScene.version, this.SERIALIZATION_VERSION, serializedScene);
            }
            // 构建组件注册表
            const componentRegistry = opts.componentRegistry || this.getGlobalComponentRegistry();
            // 根据策略处理场景
            if (opts.strategy === 'replace') {
                // 清空场景
                scene.destroyAllEntities();
            }
            // ID生成器
            const idGenerator = () => scene.identifierPool.checkOut();
            // 反序列化实体
            const entities = EntitySerializer.deserializeEntities(serializedScene.entities, componentRegistry, idGenerator, opts.preserveIds || false, scene);
            // 将实体添加到场景
            for (const entity of entities) {
                scene.addEntity(entity, true);
                this.addChildrenRecursively(entity, scene);
            }
            // 统一清理缓存（批量操作完成后）
            scene.querySystem.clearCache();
            scene.clearSystemEntityCaches();
            // 反序列化场景自定义数据
            if (serializedScene.sceneData) {
                this.deserializeSceneData(serializedScene.sceneData, scene.sceneData);
            }
        }
        /**
         * 递归添加实体的所有子实体到场景
         *
         * 修复反序列化时子实体丢失的问题：
         * EntitySerializer.deserialize会提前设置子实体的scene引用，
         * 导致Entity.addChild的条件判断(!child.scene)跳过scene.addEntity调用。
         * 因此需要在SceneSerializer中统一递归添加所有子实体。
         *
         * @param entity 父实体
         * @param scene 目标场景
         */
        static addChildrenRecursively(entity, scene) {
            for (const child of entity.children) {
                scene.addEntity(child, true); // 延迟缓存清理
                this.addChildrenRecursively(child, scene); // 递归处理子实体的子实体
            }
        }
        /**
         * 序列化场景自定义数据
         *
         * 将 Map<string, any> 转换为普通对象
         */
        static serializeSceneData(sceneData) {
            const result = {};
            for (const [key, value] of sceneData) {
                result[key] = this.serializeValue(value);
            }
            return result;
        }
        /**
         * 反序列化场景自定义数据
         *
         * 将普通对象还原为 Map<string, any>
         */
        static deserializeSceneData(data, targetMap) {
            targetMap.clear();
            for (const [key, value] of Object.entries(data)) {
                targetMap.set(key, this.deserializeValue(value));
            }
        }
        /**
         * 序列化单个值
         */
        static serializeValue(value) {
            if (value === null || value === undefined) {
                return value;
            }
            // 基本类型
            const type = typeof value;
            if (type === 'string' || type === 'number' || type === 'boolean') {
                return value;
            }
            // Date
            if (value instanceof Date) {
                return { __type: 'Date', value: value.toISOString() };
            }
            // Map
            if (value instanceof Map) {
                return { __type: 'Map', value: Array.from(value.entries()) };
            }
            // Set
            if (value instanceof Set) {
                return { __type: 'Set', value: Array.from(value) };
            }
            // 数组
            if (Array.isArray(value)) {
                return value.map((item) => this.serializeValue(item));
            }
            // 普通对象
            if (type === 'object') {
                const result = {};
                for (const key in value) {
                    if (value.hasOwnProperty(key)) {
                        result[key] = this.serializeValue(value[key]);
                    }
                }
                return result;
            }
            // 其他类型不序列化
            return undefined;
        }
        /**
         * 反序列化单个值
         */
        static deserializeValue(value) {
            if (value === null || value === undefined) {
                return value;
            }
            // 基本类型
            const type = typeof value;
            if (type === 'string' || type === 'number' || type === 'boolean') {
                return value;
            }
            // 处理特殊类型标记
            if (type === 'object' && value.__type) {
                switch (value.__type) {
                    case 'Date':
                        return new Date(value.value);
                    case 'Map':
                        return new Map(value.value);
                    case 'Set':
                        return new Set(value.value);
                }
            }
            // 数组
            if (Array.isArray(value)) {
                return value.map((item) => this.deserializeValue(item));
            }
            // 普通对象
            if (type === 'object') {
                const result = {};
                for (const key in value) {
                    if (value.hasOwnProperty(key)) {
                        result[key] = this.deserializeValue(value[key]);
                    }
                }
                return result;
            }
            return value;
        }
        /**
         * 过滤要序列化的实体和组件
         */
        static filterEntities(scene, options) {
            const entities = Array.from(scene.entities.buffer);
            // 如果指定了组件类型过滤
            if (options.components && options.components.length > 0) {
                const componentTypeSet = new Set(options.components);
                // 只返回拥有指定组件的实体
                return entities.filter((entity) => {
                    return Array.from(entity.components).some((component) => componentTypeSet.has(component.constructor));
                });
            }
            return entities;
        }
        /**
         * 构建组件类型注册表
         */
        static buildComponentTypeRegistry(entities) {
            const registry = new Map();
            for (const entity of entities) {
                for (const component of entity.components) {
                    const componentType = component.constructor;
                    const typeName = getComponentTypeName(componentType);
                    const metadata = getSerializationMetadata(component);
                    if (metadata && !registry.has(typeName)) {
                        registry.set(typeName, metadata.options.version);
                    }
                }
            }
            return Array.from(registry.entries()).map(([typeName, version]) => ({
                typeName,
                version
            }));
        }
        /**
         * 获取全局组件注册表
         *
         * 从所有已注册的组件类型构建注册表
         */
        static getGlobalComponentRegistry() {
            return ComponentRegistry.getAllComponentNames();
        }
        /**
         * 验证保存数据的有效性
         *
         * @param saveData 序列化的数据
         * @returns 验证结果
         */
        static validate(saveData) {
            const errors = [];
            try {
                const data = JSON.parse(saveData);
                if (!data.version) {
                    errors.push('Missing version field');
                }
                if (!data.entities || !Array.isArray(data.entities)) {
                    errors.push('Missing or invalid entities field');
                }
                if (!data.componentTypeRegistry || !Array.isArray(data.componentTypeRegistry)) {
                    errors.push('Missing or invalid componentTypeRegistry field');
                }
                return {
                    valid: errors.length === 0,
                    version: data.version,
                    ...(errors.length > 0 && { errors })
                };
            }
            catch (error) {
                return {
                    valid: false,
                    errors: [`JSON parse error: ${error}`]
                };
            }
        }
        /**
         * 获取保存数据的信息（不完全反序列化）
         *
         * @param saveData 序列化的数据
         * @returns 保存数据的元信息
         */
        static getInfo(saveData) {
            try {
                const data = JSON.parse(saveData);
                return {
                    name: data.name,
                    version: data.version,
                    ...(data.timestamp !== undefined && { timestamp: data.timestamp }),
                    entityCount: data.metadata?.entityCount || data.entities.length,
                    componentTypeCount: data.componentTypeRegistry.length
                };
            }
            catch (error) {
                return null;
            }
        }
    }
    /**
     * 当前序列化版本
     */
    SceneSerializer.SERIALIZATION_VERSION = 1;

    /**
     * 增量序列化器
     *
     * 提供高性能的增量序列化支持，只序列化变更的数据
     * 适用于网络同步、大场景存档、时间回溯等场景
     */
    /**
     * 变更操作类型
     */
    var ChangeOperation;
    (function (ChangeOperation) {
        /** 添加新实体 */
        ChangeOperation["EntityAdded"] = "entity_added";
        /** 删除实体 */
        ChangeOperation["EntityRemoved"] = "entity_removed";
        /** 实体属性更新 */
        ChangeOperation["EntityUpdated"] = "entity_updated";
        /** 添加组件 */
        ChangeOperation["ComponentAdded"] = "component_added";
        /** 删除组件 */
        ChangeOperation["ComponentRemoved"] = "component_removed";
        /** 组件数据更新 */
        ChangeOperation["ComponentUpdated"] = "component_updated";
        /** 场景数据更新 */
        ChangeOperation["SceneDataUpdated"] = "scene_data_updated";
    })(ChangeOperation || (ChangeOperation = {}));
    /**
     * 增量序列化器类
     */
    class IncrementalSerializer {
        /**
         * 创建场景快照
         *
         * @param scene 要快照的场景
         * @param options 序列化选项
         * @returns 场景快照对象
         */
        static createSnapshot(scene, options) {
            const opts = {
                deepComponentComparison: true,
                trackSceneData: true,
                ...options
            };
            const snapshot = {
                version: ++this.snapshotVersion,
                entityIds: new Set(),
                entities: new Map(),
                components: new Map(),
                sceneData: new Map()
            };
            // 快照所有实体
            for (const entity of scene.entities.buffer) {
                snapshot.entityIds.add(entity.id);
                // 存储实体基本信息
                snapshot.entities.set(entity.id, {
                    name: entity.name,
                    tag: entity.tag,
                    active: entity.active,
                    enabled: entity.enabled,
                    updateOrder: entity.updateOrder,
                    ...(entity.parent && { parentId: entity.parent.id })
                });
                // 快照组件
                if (opts.deepComponentComparison) {
                    const componentMap = new Map();
                    for (const component of entity.components) {
                        const serialized = ComponentSerializer.serialize(component);
                        if (serialized) {
                            // 使用JSON字符串存储，便于后续对比
                            componentMap.set(serialized.type, JSON.stringify(serialized.data));
                        }
                    }
                    if (componentMap.size > 0) {
                        snapshot.components.set(entity.id, componentMap);
                    }
                }
            }
            // 快照场景数据
            if (opts.trackSceneData) {
                for (const [key, value] of scene.sceneData) {
                    snapshot.sceneData.set(key, JSON.stringify(value));
                }
            }
            return snapshot;
        }
        /**
         * 计算增量变更
         *
         * @param scene 当前场景
         * @param baseSnapshot 基础快照
         * @param options 序列化选项
         * @returns 增量快照
         */
        static computeIncremental(scene, baseSnapshot, options) {
            const opts = {
                deepComponentComparison: true,
                trackSceneData: true,
                ...options
            };
            const incremental = {
                version: ++this.snapshotVersion,
                timestamp: Date.now(),
                sceneName: scene.name,
                baseVersion: baseSnapshot.version,
                entityChanges: [],
                componentChanges: [],
                sceneDataChanges: []
            };
            const currentEntityIds = new Set();
            // 检测实体变更
            for (const entity of scene.entities.buffer) {
                currentEntityIds.add(entity.id);
                if (!baseSnapshot.entityIds.has(entity.id)) {
                    // 新增实体
                    incremental.entityChanges.push({
                        operation: ChangeOperation.EntityAdded,
                        entityId: entity.id,
                        entityName: entity.name,
                        entityData: {
                            id: entity.id,
                            name: entity.name,
                            tag: entity.tag,
                            active: entity.active,
                            enabled: entity.enabled,
                            updateOrder: entity.updateOrder,
                            ...(entity.parent && { parentId: entity.parent.id }),
                            components: [],
                            children: []
                        }
                    });
                    // 新增实体的所有组件都是新增
                    for (const component of entity.components) {
                        const serialized = ComponentSerializer.serialize(component);
                        if (serialized) {
                            incremental.componentChanges.push({
                                operation: ChangeOperation.ComponentAdded,
                                entityId: entity.id,
                                componentType: serialized.type,
                                componentData: serialized
                            });
                        }
                    }
                }
                else {
                    // 检查实体属性变更
                    const oldData = baseSnapshot.entities.get(entity.id);
                    const entityChanged = oldData.name !== entity.name ||
                        oldData.tag !== entity.tag ||
                        oldData.active !== entity.active ||
                        oldData.enabled !== entity.enabled ||
                        oldData.updateOrder !== entity.updateOrder ||
                        oldData.parentId !== entity.parent?.id;
                    if (entityChanged) {
                        incremental.entityChanges.push({
                            operation: ChangeOperation.EntityUpdated,
                            entityId: entity.id,
                            entityData: {
                                name: entity.name,
                                tag: entity.tag,
                                active: entity.active,
                                enabled: entity.enabled,
                                updateOrder: entity.updateOrder,
                                ...(entity.parent && { parentId: entity.parent.id })
                            }
                        });
                    }
                    // 检查组件变更
                    if (opts.deepComponentComparison) {
                        this.detectComponentChanges(entity, baseSnapshot, incremental.componentChanges);
                    }
                }
            }
            // 检测删除的实体
            for (const oldEntityId of baseSnapshot.entityIds) {
                if (!currentEntityIds.has(oldEntityId)) {
                    incremental.entityChanges.push({
                        operation: ChangeOperation.EntityRemoved,
                        entityId: oldEntityId
                    });
                }
            }
            // 检测场景数据变更
            if (opts.trackSceneData) {
                this.detectSceneDataChanges(scene, baseSnapshot, incremental.sceneDataChanges);
            }
            return incremental;
        }
        /**
         * 检测组件变更
         */
        static detectComponentChanges(entity, baseSnapshot, componentChanges) {
            const oldComponents = baseSnapshot.components.get(entity.id);
            const currentComponents = new Map();
            // 收集当前组件
            for (const component of entity.components) {
                const serialized = ComponentSerializer.serialize(component);
                if (serialized) {
                    currentComponents.set(serialized.type, serialized);
                }
            }
            // 检测新增和更新的组件
            for (const [type, serialized] of currentComponents) {
                const currentData = JSON.stringify(serialized.data);
                if (!oldComponents || !oldComponents.has(type)) {
                    // 新增组件
                    componentChanges.push({
                        operation: ChangeOperation.ComponentAdded,
                        entityId: entity.id,
                        componentType: type,
                        componentData: serialized
                    });
                }
                else if (oldComponents.get(type) !== currentData) {
                    // 组件数据变更
                    componentChanges.push({
                        operation: ChangeOperation.ComponentUpdated,
                        entityId: entity.id,
                        componentType: type,
                        componentData: serialized
                    });
                }
            }
            // 检测删除的组件
            if (oldComponents) {
                for (const oldType of oldComponents.keys()) {
                    if (!currentComponents.has(oldType)) {
                        componentChanges.push({
                            operation: ChangeOperation.ComponentRemoved,
                            entityId: entity.id,
                            componentType: oldType
                        });
                    }
                }
            }
        }
        /**
         * 检测场景数据变更
         */
        static detectSceneDataChanges(scene, baseSnapshot, sceneDataChanges) {
            const currentKeys = new Set();
            // 检测新增和更新的场景数据
            for (const [key, value] of scene.sceneData) {
                currentKeys.add(key);
                const currentValue = JSON.stringify(value);
                const oldValue = baseSnapshot.sceneData.get(key);
                if (!oldValue || oldValue !== currentValue) {
                    sceneDataChanges.push({
                        operation: ChangeOperation.SceneDataUpdated,
                        key,
                        value
                    });
                }
            }
            // 检测删除的场景数据
            for (const oldKey of baseSnapshot.sceneData.keys()) {
                if (!currentKeys.has(oldKey)) {
                    sceneDataChanges.push({
                        operation: ChangeOperation.SceneDataUpdated,
                        key: oldKey,
                        value: undefined,
                        deleted: true
                    });
                }
            }
        }
        /**
         * 应用增量变更到场景
         *
         * @param scene 目标场景
         * @param incremental 增量快照
         * @param componentRegistry 组件类型注册表
         */
        static applyIncremental(scene, incremental, componentRegistry) {
            // 应用实体变更
            for (const change of incremental.entityChanges) {
                switch (change.operation) {
                    case ChangeOperation.EntityAdded:
                        this.applyEntityAdded(scene, change);
                        break;
                    case ChangeOperation.EntityRemoved:
                        this.applyEntityRemoved(scene, change);
                        break;
                    case ChangeOperation.EntityUpdated:
                        this.applyEntityUpdated(scene, change);
                        break;
                }
            }
            // 应用组件变更
            for (const change of incremental.componentChanges) {
                switch (change.operation) {
                    case ChangeOperation.ComponentAdded:
                        this.applyComponentAdded(scene, change, componentRegistry);
                        break;
                    case ChangeOperation.ComponentRemoved:
                        this.applyComponentRemoved(scene, change, componentRegistry);
                        break;
                    case ChangeOperation.ComponentUpdated:
                        this.applyComponentUpdated(scene, change, componentRegistry);
                        break;
                }
            }
            // 应用场景数据变更
            for (const change of incremental.sceneDataChanges) {
                if (change.deleted) {
                    scene.sceneData.delete(change.key);
                }
                else {
                    scene.sceneData.set(change.key, change.value);
                }
            }
        }
        static applyEntityAdded(scene, change) {
            if (!change.entityData)
                return;
            const entity = new Entity(change.entityName || 'Entity', change.entityId);
            entity.tag = change.entityData.tag || 0;
            entity.active = change.entityData.active ?? true;
            entity.enabled = change.entityData.enabled ?? true;
            entity.updateOrder = change.entityData.updateOrder || 0;
            scene.addEntity(entity);
        }
        static applyEntityRemoved(scene, change) {
            const entity = scene.entities.findEntityById(change.entityId);
            if (entity) {
                entity.destroy();
            }
        }
        static applyEntityUpdated(scene, change) {
            if (!change.entityData)
                return;
            const entity = scene.entities.findEntityById(change.entityId);
            if (!entity)
                return;
            if (change.entityData.name !== undefined)
                entity.name = change.entityData.name;
            if (change.entityData.tag !== undefined)
                entity.tag = change.entityData.tag;
            if (change.entityData.active !== undefined)
                entity.active = change.entityData.active;
            if (change.entityData.enabled !== undefined)
                entity.enabled = change.entityData.enabled;
            if (change.entityData.updateOrder !== undefined)
                entity.updateOrder = change.entityData.updateOrder;
            if (change.entityData.parentId !== undefined) {
                const newParent = scene.entities.findEntityById(change.entityData.parentId);
                if (newParent && entity.parent !== newParent) {
                    if (entity.parent) {
                        entity.parent.removeChild(entity);
                    }
                    newParent.addChild(entity);
                }
            }
            else if (entity.parent) {
                entity.parent.removeChild(entity);
            }
        }
        static applyComponentAdded(scene, change, componentRegistry) {
            if (!change.componentData)
                return;
            const entity = scene.entities.findEntityById(change.entityId);
            if (!entity)
                return;
            const component = ComponentSerializer.deserialize(change.componentData, componentRegistry);
            if (component) {
                entity.addComponent(component);
            }
        }
        static applyComponentRemoved(scene, change, componentRegistry) {
            const entity = scene.entities.findEntityById(change.entityId);
            if (!entity)
                return;
            const componentClass = componentRegistry.get(change.componentType);
            if (!componentClass)
                return;
            entity.removeComponentByType(componentClass);
        }
        static applyComponentUpdated(scene, change, componentRegistry) {
            if (!change.componentData)
                return;
            const entity = scene.entities.findEntityById(change.entityId);
            if (!entity)
                return;
            const componentClass = componentRegistry.get(change.componentType);
            if (!componentClass)
                return;
            entity.removeComponentByType(componentClass);
            const component = ComponentSerializer.deserialize(change.componentData, componentRegistry);
            if (component) {
                entity.addComponent(component);
            }
        }
        /**
         * 序列化增量快照
         *
         * @param incremental 增量快照
         * @param options 序列化选项
         * @returns 序列化后的数据（JSON字符串或二进制Uint8Array）
         *
         * @example
         * ```typescript
         * // JSON格式（默认）
         * const jsonData = IncrementalSerializer.serializeIncremental(snapshot);
         *
         * // 二进制格式
         * const binaryData = IncrementalSerializer.serializeIncremental(snapshot, {
         *     format: 'binary'
         * });
         *
         * // 美化JSON
         * const prettyJson = IncrementalSerializer.serializeIncremental(snapshot, {
         *     format: 'json',
         *     pretty: true
         * });
         * ```
         */
        static serializeIncremental(incremental, options) {
            const opts = {
                format: 'json',
                pretty: false,
                ...options
            };
            if (opts.format === 'binary') {
                return BinarySerializer.encode(incremental);
            }
            else {
                return opts.pretty
                    ? JSON.stringify(incremental, null, 2)
                    : JSON.stringify(incremental);
            }
        }
        /**
         * 反序列化增量快照
         *
         * @param data 序列化的数据（JSON字符串或二进制Uint8Array）
         * @returns 增量快照
         *
         * @example
         * ```typescript
         * // 从JSON反序列化
         * const snapshot = IncrementalSerializer.deserializeIncremental(jsonString);
         *
         * // 从二进制反序列化
         * const snapshot = IncrementalSerializer.deserializeIncremental(buffer);
         * ```
         */
        static deserializeIncremental(data) {
            if (typeof data === 'string') {
                return JSON.parse(data);
            }
            else {
                return BinarySerializer.decode(data);
            }
        }
        /**
         * 获取增量快照的统计信息
         *
         * @param incremental 增量快照
         * @returns 统计信息
         */
        static getIncrementalStats(incremental) {
            return {
                totalChanges: incremental.entityChanges.length +
                    incremental.componentChanges.length +
                    incremental.sceneDataChanges.length,
                entityChanges: incremental.entityChanges.length,
                componentChanges: incremental.componentChanges.length,
                sceneDataChanges: incremental.sceneDataChanges.length,
                addedEntities: incremental.entityChanges.filter((c) => c.operation === ChangeOperation.EntityAdded).length,
                removedEntities: incremental.entityChanges.filter((c) => c.operation === ChangeOperation.EntityRemoved).length,
                updatedEntities: incremental.entityChanges.filter((c) => c.operation === ChangeOperation.EntityUpdated).length,
                addedComponents: incremental.componentChanges.filter((c) => c.operation === ChangeOperation.ComponentAdded).length,
                removedComponents: incremental.componentChanges.filter((c) => c.operation === ChangeOperation.ComponentRemoved).length,
                updatedComponents: incremental.componentChanges.filter((c) => c.operation === ChangeOperation.ComponentUpdated).length
            };
        }
        /**
         * 重置快照版本号（用于测试）
         */
        static resetVersion() {
            this.snapshotVersion = 0;
        }
    }
    /** 当前快照版本号 */
    IncrementalSerializer.snapshotVersion = 0;

    const logger$4 = createLogger('ServiceContainer');
    /**
     * 服务生命周期
     */
    var ServiceLifetime;
    (function (ServiceLifetime) {
        /**
         * 单例模式 - 整个应用生命周期内只有一个实例
         */
        ServiceLifetime["Singleton"] = "singleton";
        /**
         * 瞬时模式 - 每次请求都创建新实例
         */
        ServiceLifetime["Transient"] = "transient";
    })(ServiceLifetime || (ServiceLifetime = {}));
    /**
     * 服务容器
     *
     * 负责管理所有服务的注册、解析和生命周期。
     * 支持依赖注入和服务定位模式。
     *
     * 特点：
     * - 单例和瞬时两种生命周期
     * - 支持工厂函数注册
     * - 支持实例注册
     * - 类型安全的服务解析
     *
     * @example
     * ```typescript
     * const container = new ServiceContainer();
     *
     * // 注册单例服务
     * container.registerSingleton(TimerManager);
     *
     * // 注册工厂函数
     * container.registerSingleton(Logger, (c) => createLogger('App'));
     *
     * // 注册实例
     * container.registerInstance(Config, new Config());
     *
     * // 解析服务
     * const timer = container.resolve(TimerManager);
     * ```
     */
    class ServiceContainer {
        constructor() {
            /**
             * 服务注册表
             */
            this._services = new Map();
            /**
             * 正在解析的服务栈（用于循环依赖检测）
             */
            this._resolving = new Set();
            /**
             * 可更新的服务列表
             *
             * 自动收集所有使用@Updatable装饰器标记的服务，供Core统一更新
             * 按优先级排序（数值越小越先执行）
             */
            this._updatableServices = [];
        }
        /**
         * 注册单例服务
         *
         * @param type - 服务类型
         * @param factory - 可选的工厂函数
         *
         * @example
         * ```typescript
         * // 直接注册类型
         * container.registerSingleton(TimerManager);
         *
         * // 使用工厂函数
         * container.registerSingleton(Logger, (c) => {
         *     return createLogger('App');
         * });
         * ```
         */
        registerSingleton(type, factory) {
            if (this._services.has(type)) {
                logger$4.warn(`Service ${type.name} is already registered`);
                return;
            }
            this._services.set(type, {
                type: type,
                ...(factory && { factory: factory }),
                lifetime: ServiceLifetime.Singleton
            });
            logger$4.debug(`Registered singleton service: ${type.name}`);
        }
        /**
         * 注册瞬时服务
         *
         * 每次解析都会创建新实例。
         *
         * @param type - 服务类型
         * @param factory - 可选的工厂函数
         *
         * @example
         * ```typescript
         * // 每次解析都创建新实例
         * container.registerTransient(Command);
         * ```
         */
        registerTransient(type, factory) {
            if (this._services.has(type)) {
                logger$4.warn(`Service ${type.name} is already registered`);
                return;
            }
            this._services.set(type, {
                type: type,
                ...(factory && { factory: factory }),
                lifetime: ServiceLifetime.Transient
            });
            logger$4.debug(`Registered transient service: ${type.name}`);
        }
        /**
         * 注册服务实例
         *
         * 直接注册已创建的实例，自动视为单例。
         *
         * @param type - 服务类型（构造函数，仅用作标识）
         * @param instance - 服务实例
         *
         * @example
         * ```typescript
         * const config = new Config();
         * container.registerInstance(Config, config);
         * ```
         */
        registerInstance(type, instance) {
            if (this._services.has(type)) {
                logger$4.warn(`Service ${type.name} is already registered`);
                return;
            }
            this._services.set(type, {
                type: type,
                instance: instance,
                lifetime: ServiceLifetime.Singleton
            });
            // 如果使用了@Updatable装饰器，添加到可更新列表
            if (isUpdatable(type)) {
                const metadata = getUpdatableMetadata(type);
                const priority = metadata?.priority ?? 0;
                this._updatableServices.push({ instance, priority });
                // 按优先级排序（数值越小越先执行）
                this._updatableServices.sort((a, b) => a.priority - b.priority);
                logger$4.debug(`Service ${type.name} is updatable (priority: ${priority}), added to update list`);
            }
            logger$4.debug(`Registered service instance: ${type.name}`);
        }
        /**
         * 解析服务
         *
         * @param type - 服务类型
         * @returns 服务实例
         * @throws 如果服务未注册或存在循环依赖
         *
         * @example
         * ```typescript
         * const timer = container.resolve(TimerManager);
         * ```
         */
        resolve(type) {
            const registration = this._services.get(type);
            if (!registration) {
                throw new Error(`Service ${type.name} is not registered`);
            }
            // 检测循环依赖
            if (this._resolving.has(type)) {
                const chain = Array.from(this._resolving).map((t) => t.name).join(' -> ');
                throw new Error(`Circular dependency detected: ${chain} -> ${type.name}`);
            }
            // 如果是单例且已经有实例，直接返回
            if (registration.lifetime === ServiceLifetime.Singleton && registration.instance) {
                return registration.instance;
            }
            // 添加到解析栈
            this._resolving.add(type);
            try {
                // 创建实例
                let instance;
                if (registration.factory) {
                    // 使用工厂函数
                    instance = registration.factory(this);
                }
                else {
                    // 直接构造
                    instance = new (registration.type)();
                }
                // 如果是单例，缓存实例
                if (registration.lifetime === ServiceLifetime.Singleton) {
                    registration.instance = instance;
                    // 如果使用了@Updatable装饰器，添加到可更新列表
                    if (isUpdatable(registration.type)) {
                        const metadata = getUpdatableMetadata(registration.type);
                        const priority = metadata?.priority ?? 0;
                        this._updatableServices.push({ instance, priority });
                        // 按优先级排序（数值越小越先执行）
                        this._updatableServices.sort((a, b) => a.priority - b.priority);
                        logger$4.debug(`Service ${type.name} is updatable (priority: ${priority}), added to update list`);
                    }
                }
                return instance;
            }
            finally {
                // 从解析栈移除
                this._resolving.delete(type);
            }
        }
        /**
         * 尝试解析服务
         *
         * 如果服务未注册，返回null而不是抛出异常。
         *
         * @param type - 服务类型
         * @returns 服务实例或null
         *
         * @example
         * ```typescript
         * const timer = container.tryResolve(TimerManager);
         * if (timer) {
         *     timer.schedule(...);
         * }
         * ```
         */
        tryResolve(type) {
            try {
                return this.resolve(type);
            }
            catch {
                return null;
            }
        }
        /**
         * 检查服务是否已注册
         *
         * @param type - 服务类型
         * @returns 是否已注册
         */
        isRegistered(type) {
            return this._services.has(type);
        }
        /**
         * 注销服务
         *
         * @param type - 服务类型
         * @returns 是否成功注销
         */
        unregister(type) {
            const registration = this._services.get(type);
            if (!registration) {
                return false;
            }
            // 如果有单例实例，调用 dispose
            if (registration.instance) {
                // 从可更新列表中移除
                const index = this._updatableServices.findIndex((item) => item.instance === registration.instance);
                if (index !== -1) {
                    this._updatableServices.splice(index, 1);
                }
                registration.instance.dispose();
            }
            this._services.delete(type);
            logger$4.debug(`Unregistered service: ${type.name}`);
            return true;
        }
        /**
         * 清空所有服务
         */
        clear() {
            // 清理所有单例实例
            for (const [, registration] of this._services) {
                if (registration.instance) {
                    registration.instance.dispose();
                }
            }
            this._services.clear();
            this._updatableServices = [];
            logger$4.debug('Cleared all services');
        }
        /**
         * 获取所有已注册的服务类型
         *
         * @returns 服务类型数组
         */
        getRegisteredServices() {
            return Array.from(this._services.keys());
        }
        /**
         * 更新所有使用@Updatable装饰器标记的服务
         *
         * 此方法会按优先级顺序遍历所有可更新的服务并调用它们的update方法。
         * 所有服务在注册时已经由@Updatable装饰器验证过必须实现IUpdatable接口。
         * 通常在Core的主更新循环中调用。
         *
         * @param deltaTime - 可选的帧时间间隔（秒）
         *
         * @example
         * ```typescript
         * // 在Core的update方法中
         * this._serviceContainer.updateAll(deltaTime);
         * ```
         */
        updateAll(deltaTime) {
            for (const { instance } of this._updatableServices) {
                instance.update(deltaTime);
            }
        }
        /**
         * 获取所有可更新的服务数量
         *
         * @returns 可更新服务的数量
         */
        getUpdatableCount() {
            return this._updatableServices.length;
        }
        /**
         * 获取所有已实例化的服务实例
         *
         * @returns 所有服务实例的数组
         */
        getAll() {
            const instances = [];
            for (const descriptor of this._services.values()) {
                if (descriptor.instance) {
                    instances.push(descriptor.instance);
                }
            }
            return instances;
        }
    }

    /**
     * 游戏场景默认实现类
     *
     * 实现IScene接口，提供场景的基础功能。
     * 推荐使用组合而非继承的方式来构建自定义场景。
     */
    class Scene {
        /**
         * 获取场景中所有已注册的EntitySystem
         *
         * 按updateOrder排序。使用缓存机制，仅在系统变化时重新排序。
         *
         * @returns 系统列表
         */
        get systems() {
            if (!this._systemsOrderDirty && this._cachedSystems) {
                return this._cachedSystems;
            }
            this._cachedSystems = this._rebuildSystemsCache();
            this._systemsOrderDirty = false;
            return this._cachedSystems;
        }
        /**
         * 重新构建系统缓存
         *
         * 从服务容器中提取所有EntitySystem并排序
         */
        _rebuildSystemsCache() {
            const allServices = this._services.getAll();
            const systems = this._filterEntitySystems(allServices);
            return this._sortSystemsByUpdateOrder(systems);
        }
        /**
         * 从服务列表中过滤出EntitySystem实例
         */
        _filterEntitySystems(services) {
            return services.filter((service) => service instanceof EntitySystem);
        }
        /**
         * 按updateOrder排序系统
         */
        _sortSystemsByUpdateOrder(systems) {
            return systems.sort((a, b) => a.updateOrder - b.updateOrder);
        }
        /**
         * 通过类型获取System实例
         *
         * @param systemType System类型
         * @returns System实例，如果未找到则返回null
         *
         * @example
         * ```typescript
         * const physics = scene.getSystem(PhysicsSystem);
         * if (physics) {
         *     physics.doSomething();
         * }
         * ```
         */
        getSystem(systemType) {
            return this._services.tryResolve(systemType);
        }
        /**
         * 标记系统顺序为脏
         *
         * 当系统列表或顺序发生变化时调用，使缓存失效
         */
        markSystemsOrderDirty() {
            this._systemsOrderDirty = true;
        }
        /**
         * 获取场景的服务容器
         *
         * 用于注册和解析场景级别的服务（如EntitySystem）。
         *
         * @example
         * ```typescript
         * // 注册服务
         * scene.services.registerSingleton(PhysicsSystem);
         *
         * // 解析服务
         * const physics = scene.services.resolve(PhysicsSystem);
         * ```
         */
        get services() {
            return this._services;
        }
        /**
         * 创建场景实例
         */
        constructor(config) {
            /**
             * 场景名称
             *
             * 用于标识和调试的友好名称。
             */
            this.name = '';
            /**
             * 场景自定义数据
             *
             * 用于存储场景级别的配置和状态数据。
             */
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.sceneData = new Map();
            /**
             * 性能监控器缓存
             *
             * 用于监控场景和系统的性能。从 ServiceContainer 获取。
             */
            this._performanceMonitor = null;
            /**
             * 场景是否已开始运行
             */
            this._didSceneBegin = false;
            /**
             * 系统列表缓存
             */
            this._cachedSystems = null;
            /**
             * 系统顺序脏标记
             *
             * 当系统增删或 updateOrder 改变时标记为 true，下次访问 systems 时重新构建缓存
             */
            this._systemsOrderDirty = true;
            /**
             * 系统错误计数器
             *
             * 跟踪每个系统的错误次数，用于自动禁用频繁出错的系统
             */
            this._systemErrorCount = new Map();
            /**
             * 最大允许错误次数
             *
             * 系统错误次数超过此阈值后将被自动禁用
             */
            this._maxErrorCount = 10;
            this.entities = new EntityList(this);
            this.identifierPool = new IdentifierPool();
            this.componentStorageManager = new ComponentStorageManager();
            this.querySystem = new QuerySystem();
            this.eventSystem = new TypeSafeEventSystem();
            this.referenceTracker = new ReferenceTracker();
            this._services = new ServiceContainer();
            this.logger = createLogger('Scene');
            if (config?.name) {
                this.name = config.name;
            }
        }
        /**
         * 获取性能监控器
         *
         * 从 ServiceContainer 获取，如果未注册则创建默认实例（向后兼容）
         */
        get performanceMonitor() {
            if (!this._performanceMonitor) {
                this._performanceMonitor = this._services.tryResolve(PerformanceMonitor) ?? new PerformanceMonitor();
            }
            return this._performanceMonitor;
        }
        /**
         * 初始化场景
         *
         * 在场景创建时调用，子类可以重写此方法来设置初始实体和组件。
         */
        initialize() { }
        /**
         * 场景开始运行时的回调
         *
         * 在场景开始运行时调用，可以在此方法中执行场景启动逻辑。
         */
        onStart() { }
        /**
         * 场景卸载时的回调
         *
         * 在场景被销毁时调用，可以在此方法中执行清理工作。
         */
        unload() { }
        /**
         * 开始场景，启动实体处理器等
         *
         * 这个方法会启动场景。它将启动实体处理器等，并调用onStart方法。
         */
        begin() {
            // 标记场景已开始运行并调用onStart方法
            this._didSceneBegin = true;
            this.onStart();
        }
        /**
         * 结束场景，清除实体、实体处理器等
         *
         * 这个方法会结束场景。它将移除所有实体，结束实体处理器等，并调用unload方法。
         *
         * 执行顺序：
         * 1. 调用 unload() - 用户可以在此访问实体和系统进行清理
         * 2. 清理所有实体
         * 3. 清空服务容器，触发所有系统的 onDestroy()
         *
         * 注意：
         * - onRemoved 回调不会在 Scene.end() 时触发，因为这是批量销毁场景
         * - 用户清理：在 Scene.unload() 中处理（可访问实体和系统）
         * - 系统清理：在 System.onDestroy() 中处理（实体已被清理）
         */
        end() {
            // 标记场景已结束运行
            this._didSceneBegin = false;
            // 先调用用户的卸载方法，此时用户可以访问实体和系统进行清理
            this.unload();
            // 移除所有实体
            this.entities.removeAllEntities();
            // 清理查询系统中的实体引用和缓存
            this.querySystem.setEntities([]);
            // 清空组件存储
            this.componentStorageManager.clear();
            // 清空服务容器（会调用所有服务的dispose方法，包括所有EntitySystem）
            // 系统的 onDestroy 回调会在这里被触发
            this._services.clear();
            // 清空系统缓存
            this._cachedSystems = null;
            this._systemsOrderDirty = true;
        }
        /**
         * 更新场景
         */
        update() {
            ComponentPoolManager.getInstance().update();
            this.entities.updateLists();
            const systems = this.systems;
            for (const system of systems) {
                if (system.enabled) {
                    try {
                        system.update();
                    }
                    catch (error) {
                        this._handleSystemError(system, 'update', error);
                    }
                }
            }
            for (const system of systems) {
                if (system.enabled) {
                    try {
                        system.lateUpdate();
                    }
                    catch (error) {
                        this._handleSystemError(system, 'lateUpdate', error);
                    }
                }
            }
        }
        /**
         * 处理系统执行错误
         *
         * 记录错误信息并跟踪错误次数。当系统错误次数超过阈值时自动禁用该系统。
         *
         * @param system 出错的系统
         * @param phase 错误发生的阶段（update 或 lateUpdate）
         * @param error 错误对象
         */
        _handleSystemError(system, phase, error) {
            const errorCount = (this._systemErrorCount.get(system) || 0) + 1;
            this._systemErrorCount.set(system, errorCount);
            this.logger.error(`Error in system ${system.constructor.name}.${phase}() [${errorCount}/${this._maxErrorCount}]:`, error);
            if (errorCount >= this._maxErrorCount) {
                system.enabled = false;
                this.logger.error(`System ${system.constructor.name} has been disabled due to excessive errors (${errorCount} errors)`);
            }
        }
        /**
         * 将实体添加到此场景，并返回它
         * @param name 实体名称
         */
        createEntity(name) {
            const entity = new Entity(name, this.identifierPool.checkOut());
            this.eventSystem.emitSync('entity:created', { entityName: name, entity, scene: this });
            return this.addEntity(entity);
        }
        /**
         * 清除所有EntitySystem的实体缓存
         * 当实体或组件发生变化时调用
         */
        clearSystemEntityCaches() {
            for (const system of this.systems) {
                system.clearEntityCache();
            }
        }
        /**
         * 在场景的实体列表中添加一个实体
         * @param entity 要添加的实体
         * @param deferCacheClear 是否延迟缓存清理（用于批量操作）
         */
        addEntity(entity, deferCacheClear = false) {
            this.entities.add(entity);
            entity.scene = this;
            // 将实体添加到查询系统（可延迟缓存清理）
            this.querySystem.addEntity(entity, deferCacheClear);
            // 清除系统缓存以确保系统能及时发现新实体
            if (!deferCacheClear) {
                this.clearSystemEntityCaches();
            }
            // 触发实体添加事件
            this.eventSystem.emitSync('entity:added', { entity, scene: this });
            return entity;
        }
        /**
         * 批量创建实体（高性能版本）
         * @param count 要创建的实体数量
         * @param namePrefix 实体名称前缀
         * @returns 创建的实体列表
         */
        createEntities(count, namePrefix = 'Entity') {
            const entities = [];
            // 批量创建实体对象，不立即添加到系统
            for (let i = 0; i < count; i++) {
                const entity = new Entity(`${namePrefix}_${i}`, this.identifierPool.checkOut());
                entity.scene = this;
                entities.push(entity);
            }
            // 批量添加到实体列表
            for (const entity of entities) {
                this.entities.add(entity);
            }
            // 批量添加到查询系统（无重复检查，性能最优）
            this.querySystem.addEntitiesUnchecked(entities);
            // 批量触发事件（可选，减少事件开销）
            this.eventSystem.emitSync('entities:batch_added', { entities, scene: this, count });
            return entities;
        }
        /**
         * 批量销毁实体
         */
        destroyEntities(entities) {
            if (entities.length === 0)
                return;
            for (const entity of entities) {
                entity.setDestroyedState(true);
            }
            for (const entity of entities) {
                entity.removeAllComponents();
            }
            for (const entity of entities) {
                this.entities.remove(entity);
                this.querySystem.removeEntity(entity);
            }
            this.querySystem.clearCache();
            this.clearSystemEntityCaches();
        }
        /**
         * 从场景中删除所有实体
         */
        destroyAllEntities() {
            this.entities.removeAllEntities();
            this.querySystem.setEntities([]);
        }
        /**
         * 搜索并返回第一个具有名称的实体
         * @param name 实体名称
         */
        findEntity(name) {
            return this.entities.findEntity(name);
        }
        /**
         * 根据ID查找实体
         * @param id 实体ID
         */
        findEntityById(id) {
            return this.entities.findEntityById(id);
        }
        /**
         * 根据标签查找实体
         * @param tag 实体标签
         */
        findEntitiesByTag(tag) {
            const result = [];
            for (const entity of this.entities.buffer) {
                if (entity.tag === tag) {
                    result.push(entity);
                }
            }
            return result;
        }
        /**
         * 根据名称查找实体（别名方法）
         *
         * @param name 实体名称
         * @deprecated 请使用 findEntity() 代替此方法
         */
        getEntityByName(name) {
            return this.findEntity(name);
        }
        /**
         * 根据标签查找实体（别名方法）
         *
         * @param tag 实体标签
         * @deprecated 请使用 findEntitiesByTag() 代替此方法
         */
        getEntitiesByTag(tag) {
            return this.findEntitiesByTag(tag);
        }
        /**
         * 查询拥有所有指定组件的实体
         *
         * @param componentTypes - 组件类型数组
         * @returns 查询结果
         *
         * @example
         * ```typescript
         * const result = scene.queryAll(Position, Velocity);
         * for (const entity of result.entities) {
         *     const pos = entity.getComponent(Position);
         *     const vel = entity.getComponent(Velocity);
         * }
         * ```
         */
        queryAll(...componentTypes) {
            return this.querySystem.queryAll(...componentTypes);
        }
        /**
         * 查询拥有任意一个指定组件的实体
         *
         * @param componentTypes - 组件类型数组
         * @returns 查询结果
         */
        queryAny(...componentTypes) {
            return this.querySystem.queryAny(...componentTypes);
        }
        /**
         * 查询不包含指定组件的实体
         *
         * @param componentTypes - 组件类型数组
         * @returns 查询结果
         */
        queryNone(...componentTypes) {
            return this.querySystem.queryNone(...componentTypes);
        }
        /**
         * 创建类型安全的查询构建器
         *
         * @returns 查询构建器，支持链式调用
         *
         * @example
         * ```typescript
         * // 使用查询构建器
         * const matcher = scene.query()
         *     .withAll(Position, Velocity)
         *     .withNone(Disabled)
         *     .buildMatcher();
         *
         * // 在System中使用
         * class MovementSystem extends EntitySystem {
         *     constructor() {
         *         super(matcher);
         *     }
         * }
         * ```
         */
        query() {
            return new TypedQueryBuilder();
        }
        /**
         * 在场景中添加一个EntitySystem处理器
         *
         * 支持两种使用方式：
         * 1. 传入类型（推荐）：自动使用DI创建实例，支持@Injectable和@InjectProperty装饰器
         * 2. 传入实例：直接使用提供的实例
         *
         * @param systemTypeOrInstance 系统类型或系统实例
         * @returns 添加的处理器实例
         *
         * @example
         * ```typescript
         * // 方式1：传入类型，自动DI（推荐）
         * @Injectable()
         * class PhysicsSystem extends EntitySystem {
         *     @InjectProperty(CollisionSystem)
         *     private collision!: CollisionSystem;
         *
         *     constructor() {
         *         super(Matcher.empty().all(Transform));
         *     }
         * }
         * scene.addEntityProcessor(PhysicsSystem);
         *
         * // 方式2：传入实例
         * const system = new MySystem();
         * scene.addEntityProcessor(system);
         * ```
         */
        addEntityProcessor(systemTypeOrInstance) {
            let system;
            let constructor;
            if (typeof systemTypeOrInstance === 'function') {
                constructor = systemTypeOrInstance;
                if (this._services.isRegistered(constructor)) {
                    const existingSystem = this._services.resolve(constructor);
                    this.logger.debug(`System ${constructor.name} already registered, returning existing instance`);
                    return existingSystem;
                }
                if (isInjectable(constructor)) {
                    system = createInstance(constructor, this._services);
                }
                else {
                    system = new constructor();
                }
            }
            else {
                system = systemTypeOrInstance;
                constructor = system.constructor;
                if (this._services.isRegistered(constructor)) {
                    const existingSystem = this._services.resolve(constructor);
                    if (existingSystem === system) {
                        this.logger.debug(`System ${constructor.name} instance already registered, returning it`);
                        return system;
                    }
                    else {
                        this.logger.warn(`Attempting to register a different instance of ${constructor.name}, ` +
                            'but type is already registered. Returning existing instance.');
                        return existingSystem;
                    }
                }
            }
            system.scene = this;
            system.setPerformanceMonitor(this.performanceMonitor);
            const metadata = getSystemMetadata(constructor);
            if (metadata?.updateOrder !== undefined) {
                system.setUpdateOrder(metadata.updateOrder);
            }
            if (metadata?.enabled !== undefined) {
                system.enabled = metadata.enabled;
            }
            this._services.registerInstance(constructor, system);
            // 标记系统列表已变化
            this.markSystemsOrderDirty();
            injectProperties(system, this._services);
            system.initialize();
            this.logger.debug(`System ${constructor.name} registered and initialized`);
            return system;
        }
        /**
         * 批量注册EntitySystem到场景（使用DI）
         *
         * 自动按照依赖顺序注册多个System。
         * 所有System必须使用@Injectable装饰器标记。
         *
         * @param systemTypes System类型数组
         * @returns 注册的System实例数组
         *
         * @example
         * ```typescript
         * @Injectable()
         * @ECSSystem('Collision', { updateOrder: 5 })
         * class CollisionSystem extends EntitySystem implements IService {
         *     constructor() { super(Matcher.empty().all(Collider)); }
         *     dispose() {}
         * }
         *
         * @Injectable()
         * @ECSSystem('Physics', { updateOrder: 10 })
         * class PhysicsSystem extends EntitySystem implements IService {
         *     @InjectProperty(CollisionSystem)
         *     private collision!: CollisionSystem;
         *
         *     constructor() {
         *         super(Matcher.empty().all(Transform, RigidBody));
         *     }
         *     dispose() {}
         * }
         *
         * // 批量注册（自动解析依赖顺序）
         * scene.registerSystems([
         *     CollisionSystem,
         *     PhysicsSystem,  // 自动注入CollisionSystem
         *     RenderSystem
         * ]);
         * ```
         */
        registerSystems(systemTypes) {
            const registeredSystems = [];
            for (const systemType of systemTypes) {
                const system = this.addEntityProcessor(systemType);
                registeredSystems.push(system);
            }
            return registeredSystems;
        }
        /**
         * 添加系统到场景（addEntityProcessor的别名）
         * @param system 系统
         */
        addSystem(system) {
            return this.addEntityProcessor(system);
        }
        /**
         * 从场景中删除EntitySystem处理器
         * @param processor 要删除的处理器
         */
        removeEntityProcessor(processor) {
            const constructor = processor.constructor;
            // 从ServiceContainer移除
            this._services.unregister(constructor);
            // 标记系统列表已变化
            this.markSystemsOrderDirty();
            // 重置System状态
            processor.reset();
        }
        /**
         * 从场景中删除系统（removeEntityProcessor的别名）
         * @param system 系统
         */
        removeSystem(system) {
            this.removeEntityProcessor(system);
        }
        /**
         * 获取指定类型的EntitySystem处理器
         *
         * @deprecated 推荐使用依赖注入代替此方法。使用 `scene.services.resolve(SystemType)` 或使用 `@InjectProperty(SystemType)` 装饰器。
         *
         * @param type 处理器类型
         * @returns 处理器实例，如果未找到则返回null
         *
         * @example
         * ```typescript
         * @Injectable()
         * class MySystem extends EntitySystem {
         *     @InjectProperty(PhysicsSystem)
         *     private physics!: PhysicsSystem;
         *
         *     constructor() {
         *         super(Matcher.empty());
         *     }
         * }
         * ```
         */
        getEntityProcessor(type) {
            return this._services.tryResolve(type);
        }
        /**
         * 获取场景统计信息
         */
        getStats() {
            return {
                entityCount: this.entities.count,
                processorCount: this.systems.length,
                componentStorageStats: this.componentStorageManager.getAllStats()
            };
        }
        /**
         * 获取场景的调试信息
         */
        getDebugInfo() {
            const systems = this.systems;
            return {
                name: this.name || this.constructor.name,
                entityCount: this.entities.count,
                processorCount: systems.length,
                isRunning: this._didSceneBegin,
                entities: this.entities.buffer.map((entity) => ({
                    name: entity.name,
                    id: entity.id,
                    componentCount: entity.components.length,
                    componentTypes: entity.components.map((c) => getComponentInstanceTypeName(c))
                })),
                processors: systems.map((processor) => ({
                    name: getSystemInstanceTypeName(processor),
                    updateOrder: processor.updateOrder,
                    entityCount: processor.entities.length
                })),
                componentStats: this.componentStorageManager.getAllStats()
            };
        }
        /**
         * 序列化场景
         *
         * 将场景及其所有实体、组件序列化为JSON字符串或二进制Uint8Array
         *
         * @param options 序列化选项
         * @returns 序列化后的数据（JSON字符串或二进制Uint8Array）
         *
         * @example
         * ```typescript
         * // JSON格式
         * const jsonData = scene.serialize({
         *     format: 'json',
         *     pretty: true
         * });
         *
         * // 二进制格式（更小、更快）
         * const binaryData = scene.serialize({
         *     format: 'binary'
         * });
         * ```
         */
        serialize(options) {
            return SceneSerializer.serialize(this, options);
        }
        /**
         * 反序列化场景
         *
         * 从序列化数据恢复场景状态
         *
         * @param saveData 序列化的数据（JSON字符串或二进制Uint8Array）
         * @param options 反序列化选项
         *
         * @example
         * ```typescript
         * // 从JSON恢复（自动从ComponentRegistry获取组件类型）
         * scene.deserialize(jsonData, {
         *     strategy: 'replace'
         * });
         *
         * // 从二进制恢复
         * scene.deserialize(binaryData, {
         *     strategy: 'replace'
         * });
         * ```
         */
        deserialize(saveData, options) {
            SceneSerializer.deserialize(this, saveData, options);
        }
        /**
         * 创建增量序列化的基础快照
         *
         * 在需要进行增量序列化前，先调用此方法创建基础快照
         *
         * @param options 序列化选项
         *
         * @example
         * ```typescript
         * // 创建基础快照
         * scene.createIncrementalSnapshot();
         *
         * // 进行一些修改...
         * entity.addComponent(new PositionComponent(100, 200));
         *
         * // 计算增量变更
         * const incremental = scene.serializeIncremental();
         * ```
         */
        createIncrementalSnapshot(options) {
            this._incrementalBaseSnapshot = IncrementalSerializer.createSnapshot(this, options);
        }
        /**
         * 增量序列化场景
         *
         * 只序列化相对于基础快照的变更部分
         *
         * @param options 序列化选项
         * @returns 增量快照对象
         *
         * @example
         * ```typescript
         * // 创建基础快照
         * scene.createIncrementalSnapshot();
         *
         * // 修改场景
         * const entity = scene.createEntity('NewEntity');
         * entity.addComponent(new PositionComponent(50, 100));
         *
         * // 获取增量变更
         * const incremental = scene.serializeIncremental();
         * console.log(`变更数量: ${incremental.entityChanges.length}`);
         *
         * // 序列化为JSON
         * const json = IncrementalSerializer.serializeIncremental(incremental);
         * ```
         */
        serializeIncremental(options) {
            if (!this._incrementalBaseSnapshot) {
                throw new Error('必须先调用 createIncrementalSnapshot() 创建基础快照');
            }
            return IncrementalSerializer.computeIncremental(this, this._incrementalBaseSnapshot, options);
        }
        /**
         * 应用增量变更到场景
         *
         * @param incremental 增量快照数据（IncrementalSnapshot对象、JSON字符串或二进制Uint8Array）
         * @param componentRegistry 组件类型注册表（可选，默认使用全局注册表）
         *
         * @example
         * ```typescript
         * // 应用增量变更对象
         * scene.applyIncremental(incrementalSnapshot);
         *
         * // 从JSON字符串应用
         * const jsonData = IncrementalSerializer.serializeIncremental(snapshot, { format: 'json' });
         * scene.applyIncremental(jsonData);
         *
         * // 从二进制Uint8Array应用
         * const binaryData = IncrementalSerializer.serializeIncremental(snapshot, { format: 'binary' });
         * scene.applyIncremental(binaryData);
         * ```
         */
        applyIncremental(incremental, componentRegistry) {
            const isSerializedData = typeof incremental === 'string' || incremental instanceof Uint8Array;
            const snapshot = isSerializedData
                ? IncrementalSerializer.deserializeIncremental(incremental)
                : incremental;
            const registry = componentRegistry || ComponentRegistry.getAllComponentNames();
            IncrementalSerializer.applyIncremental(this, snapshot, registry);
        }
        /**
         * 更新增量快照基准
         *
         * 将当前场景状态设为新的增量序列化基准
         *
         * @param options 序列化选项
         *
         * @example
         * ```typescript
         * // 创建初始快照
         * scene.createIncrementalSnapshot();
         *
         * // 进行一些修改并序列化
         * const incremental1 = scene.serializeIncremental();
         *
         * // 更新基准，之后的增量将基于当前状态
         * scene.updateIncrementalSnapshot();
         *
         * // 继续修改
         * const incremental2 = scene.serializeIncremental();
         * ```
         */
        updateIncrementalSnapshot(options) {
            this.createIncrementalSnapshot(options);
        }
        /**
         * 清除增量快照
         *
         * 释放快照占用的内存
         */
        clearIncrementalSnapshot() {
            this._incrementalBaseSnapshot = undefined;
        }
        /**
         * 检查是否有增量快照
         *
         * @returns 如果已创建增量快照返回true
         */
        hasIncrementalSnapshot() {
            return this._incrementalBaseSnapshot !== undefined;
        }
    }

    /**
     * 场景构建器 - 提供流式API创建和配置场景
     */
    class SceneBuilder {
        constructor() {
            this.scene = new Scene();
        }
        /**
         * 设置场景名称
         * @param name 场景名称
         * @returns 场景构建器
         */
        named(name) {
            this.scene.name = name;
            return this;
        }
        /**
         * 添加实体
         * @param entity 实体
         * @returns 场景构建器
         */
        withEntity(entity) {
            this.scene.addEntity(entity);
            return this;
        }
        /**
         * 使用实体构建器添加实体
         * @param builderFn 实体构建器函数
         * @returns 场景构建器
         */
        withEntityBuilder(builderFn) {
            const builder = new EntityBuilder(this.scene, this.scene.componentStorageManager);
            const configuredBuilder = builderFn(builder);
            const entity = configuredBuilder.build();
            this.scene.addEntity(entity);
            return this;
        }
        /**
         * 批量添加实体
         * @param entities 实体数组
         * @returns 场景构建器
         */
        withEntities(...entities) {
            for (const entity of entities) {
                this.scene.addEntity(entity);
            }
            return this;
        }
        /**
         * 添加系统
         * @param system 系统实例
         * @returns 场景构建器
         */
        withSystem(system) {
            this.scene.addSystem(system);
            return this;
        }
        /**
         * 批量添加系统
         * @param systems 系统数组
         * @returns 场景构建器
         */
        withSystems(...systems) {
            for (const system of systems) {
                this.scene.addSystem(system);
            }
            return this;
        }
        /**
         * 构建并返回场景
         * @returns 构建的场景
         */
        build() {
            return this.scene;
        }
    }

    /**
     * 组件构建器 - 提供流式API创建组件
     */
    class ComponentBuilder {
        constructor(componentClass, ...args) {
            this.component = new componentClass(...args);
        }
        /**
         * 设置组件属性
         * @param property 属性名
         * @param value 属性值
         * @returns 组件构建器
         */
        set(property, value) {
            this.component[property] = value;
            return this;
        }
        /**
         * 使用配置函数设置组件
         * @param configurator 配置函数
         * @returns 组件构建器
         */
        configure(configurator) {
            configurator(this.component);
            return this;
        }
        /**
         * 条件性设置属性
         * @param condition 条件
         * @param property 属性名
         * @param value 属性值
         * @returns 组件构建器
         */
        setIf(condition, property, value) {
            if (condition) {
                this.component[property] = value;
            }
            return this;
        }
        /**
         * 构建并返回组件
         * @returns 构建的组件
         */
        build() {
            return this.component;
        }
    }

    /**
     * 实体批量操作器
     * 提供对多个实体的批量操作
     */
    class EntityBatchOperator {
        constructor(entities) {
            this.entities = entities;
        }
        /**
         * 批量添加组件
         * @param component 组件实例
         * @returns 批量操作器
         */
        addComponent(component) {
            for (const entity of this.entities) {
                entity.addComponent(component);
            }
            return this;
        }
        /**
         * 批量移除组件
         * @param componentType 组件类型
         * @returns 批量操作器
         */
        removeComponent(componentType) {
            for (const entity of this.entities) {
                entity.removeComponentByType(componentType);
            }
            return this;
        }
        /**
         * 批量设置活跃状态
         * @param active 是否活跃
         * @returns 批量操作器
         */
        setActive(active) {
            for (const entity of this.entities) {
                entity.active = active;
            }
            return this;
        }
        /**
         * 批量设置标签
         * @param tag 标签
         * @returns 批量操作器
         */
        setTag(tag) {
            for (const entity of this.entities) {
                entity.tag = tag;
            }
            return this;
        }
        /**
         * 批量执行操作
         * @param operation 操作函数
         * @returns 批量操作器
         */
        forEach(operation) {
            this.entities.forEach(operation);
            return this;
        }
        /**
         * 过滤实体
         * @param predicate 过滤条件
         * @returns 新的批量操作器
         */
        filter(predicate) {
            return new EntityBatchOperator(this.entities.filter(predicate));
        }
        /**
         * 获取实体数组
         * @returns 实体数组
         */
        toArray() {
            return this.entities.slice();
        }
        /**
         * 获取实体数量
         * @returns 实体数量
         */
        count() {
            return this.entities.length;
        }
    }

    /**
     * ECS流式API主入口
     * 提供统一的流式接口
     */
    class ECSFluentAPI {
        constructor(scene, querySystem, eventSystem) {
            this.scene = scene;
            this.querySystem = querySystem;
            this.eventSystem = eventSystem;
        }
        /**
         * 创建实体构建器
         * @returns 实体构建器
         */
        createEntity() {
            return new EntityBuilder(this.scene, this.scene.componentStorageManager);
        }
        /**
         * 创建场景构建器
         * @returns 场景构建器
         */
        createScene() {
            return new SceneBuilder();
        }
        /**
         * 创建组件构建器
         * @param componentClass 组件类
         * @param args 构造参数
         * @returns 组件构建器
         */
        createComponent(componentClass, ...args) {
            return new ComponentBuilder(componentClass, ...args);
        }
        /**
         * 创建查询构建器
         * @returns 查询构建器
         */
        query() {
            return new QueryBuilder(this.querySystem);
        }
        /**
         * 查找实体
         * @param componentTypes 组件类型
         * @returns 实体数组
         */
        find(...componentTypes) {
            return this.querySystem.queryAll(...componentTypes).entities;
        }
        /**
         * 查找第一个匹配的实体
         * @param componentTypes 组件类型
         * @returns 实体或null
         */
        findFirst(...componentTypes) {
            const result = this.querySystem.queryAll(...componentTypes);
            return result.entities.length > 0 ? result.entities[0] : null;
        }
        /**
         * 按名称查找实体
         * @param name 实体名称
         * @returns 实体或null
         */
        findByName(name) {
            return this.scene.findEntity(name);
        }
        /**
         * 按标签查找实体
         * @param tag 标签
         * @returns 实体数组
         */
        findByTag(tag) {
            return this.scene.findEntitiesByTag(tag);
        }
        /**
         * 触发事件
         * @param eventType 事件类型
         * @param event 事件数据
         */
        emit(eventType, event) {
            this.eventSystem.emitSync(eventType, event);
        }
        /**
         * 异步触发事件
         * @param eventType 事件类型
         * @param event 事件数据
         */
        async emitAsync(eventType, event) {
            await this.eventSystem.emit(eventType, event);
        }
        /**
         * 监听事件
         * @param eventType 事件类型
         * @param handler 事件处理器
         * @returns 监听器ID
         */
        on(eventType, handler) {
            return this.eventSystem.on(eventType, handler);
        }
        /**
         * 一次性监听事件
         * @param eventType 事件类型
         * @param handler 事件处理器
         * @returns 监听器ID
         */
        once(eventType, handler) {
            return this.eventSystem.once(eventType, handler);
        }
        /**
         * 移除事件监听器
         * @param eventType 事件类型
         * @param listenerId 监听器ID
         */
        off(eventType, listenerId) {
            this.eventSystem.off(eventType, listenerId);
        }
        /**
         * 批量操作实体
         * @param entities 实体数组
         * @returns 批量操作器
         */
        batch(entities) {
            return new EntityBatchOperator(entities);
        }
        /**
         * 获取场景统计信息
         * @returns 统计信息
         */
        getStats() {
            return {
                entityCount: this.scene.entities.count,
                systemCount: this.scene.systems.length,
                componentStats: this.scene.componentStorageManager.getAllStats(),
                queryStats: this.querySystem.getStats(),
                eventStats: this.eventSystem.getStats()
            };
        }
    }
    /**
     * 创建ECS流式API实例
     * @param scene 场景
     * @param querySystem 查询系统
     * @param eventSystem 事件系统
     * @returns ECS流式API实例
     */
    function createECSAPI(scene, querySystem, eventSystem) {
        return new ECSFluentAPI(scene, querySystem, eventSystem);
    }

    const logger$3 = createLogger('World');
    /**
     * World类 - ECS世界管理器
     *
     * World是Scene的容器，每个World可以管理多个Scene。
     * World拥有独立的服务容器，用于管理World级别的全局服务。
     *
     * 服务容器层级：
     * - Core.services: 应用程序全局服务
     * - World.services: World级别服务（每个World独立）
     * - Scene.services: Scene级别服务（每个Scene独立）
     *
     * 这种设计允许创建独立的游戏世界，如：
     * - 游戏房间（每个房间一个World）
     * - 不同的游戏模式
     * - 独立的模拟环境
     *
     * @example
     * ```typescript
     * // 创建游戏房间的World
     * const roomWorld = new World({ name: 'Room_001' });
     *
     * // 注册World级别的服务
     * roomWorld.services.registerSingleton(RoomManager);
     *
     * // 在World中创建Scene
     * const gameScene = roomWorld.createScene('game', new Scene());
     * const uiScene = roomWorld.createScene('ui', new Scene());
     *
     * // 在Scene中使用World级别的服务
     * const roomManager = roomWorld.services.resolve(RoomManager);
     *
     * // 更新整个World
     * roomWorld.update(deltaTime);
     * ```
     */
    class World {
        constructor(config = {}) {
            this._scenes = new Map();
            this._activeScenes = new Set();
            this._globalSystems = [];
            this._isActive = false;
            this._config = {
                name: 'World',
                debug: false,
                maxScenes: 10,
                autoCleanup: true,
                ...config
            };
            this.name = this._config.name;
            this._createdAt = Date.now();
            this._services = new ServiceContainer();
        }
        // ===== 服务容器 =====
        /**
         * World级别的服务容器
         * 用于管理World范围内的全局服务
         */
        get services() {
            return this._services;
        }
        // ===== Scene管理 =====
        /**
         * 创建并添加Scene到World
         */
        createScene(sceneName, sceneInstance) {
            if (!sceneName || typeof sceneName !== 'string' || sceneName.trim() === '') {
                throw new Error('Scene name不能为空');
            }
            if (this._scenes.has(sceneName)) {
                throw new Error(`Scene name '${sceneName}' 已存在于World '${this.name}' 中`);
            }
            if (this._scenes.size >= this._config.maxScenes) {
                throw new Error(`World '${this.name}' 已达到最大Scene数量限制: ${this._config.maxScenes}`);
            }
            // 如果没有提供Scene实例，创建默认Scene
            const scene = sceneInstance || new Scene();
            // 如果配置了 debug，为 Scene 注册并启用 PerformanceMonitor
            if (this._config.debug) {
                const performanceMonitor = new PerformanceMonitor();
                performanceMonitor.enable();
                scene.services.registerInstance(PerformanceMonitor, performanceMonitor);
            }
            // 设置Scene的标识
            if ('id' in scene) {
                scene.id = sceneName;
            }
            if ('name' in scene && !scene.name) {
                scene.name = sceneName;
            }
            this._scenes.set(sceneName, scene);
            // 初始化Scene
            scene.initialize();
            return scene;
        }
        /**
         * 移除Scene
         */
        removeScene(sceneName) {
            const scene = this._scenes.get(sceneName);
            if (!scene) {
                return false;
            }
            // 如果Scene正在运行，先停止它
            if (this._activeScenes.has(sceneName)) {
                this.setSceneActive(sceneName, false);
            }
            // 清理Scene资源
            scene.end();
            this._scenes.delete(sceneName);
            logger$3.info(`从World '${this.name}' 中移除Scene: ${sceneName}`);
            return true;
        }
        /**
         * 获取Scene
         */
        getScene(sceneName) {
            return this._scenes.get(sceneName) || null;
        }
        /**
         * 获取所有Scene ID
         */
        getSceneIds() {
            return Array.from(this._scenes.keys());
        }
        /**
         * 获取所有Scene
         */
        getAllScenes() {
            return Array.from(this._scenes.values());
        }
        /**
         * 移除所有Scene
         */
        removeAllScenes() {
            const sceneNames = Array.from(this._scenes.keys());
            for (const sceneName of sceneNames) {
                this.removeScene(sceneName);
            }
            logger$3.info(`从World '${this.name}' 中移除所有Scene`);
        }
        /**
         * 设置Scene激活状态
         */
        setSceneActive(sceneName, active) {
            const scene = this._scenes.get(sceneName);
            if (!scene) {
                logger$3.warn(`Scene '${sceneName}' 不存在于World '${this.name}' 中`);
                return;
            }
            if (active) {
                this._activeScenes.add(sceneName);
                // 启动Scene
                if (scene.begin) {
                    scene.begin();
                }
                logger$3.debug(`在World '${this.name}' 中激活Scene: ${sceneName}`);
            }
            else {
                this._activeScenes.delete(sceneName);
                // 可选择性地停止Scene，或者让它继续运行但不更新
                logger$3.debug(`在World '${this.name}' 中停用Scene: ${sceneName}`);
            }
        }
        /**
         * 检查Scene是否激活
         */
        isSceneActive(sceneName) {
            return this._activeScenes.has(sceneName);
        }
        /**
         * 获取活跃Scene数量
         */
        getActiveSceneCount() {
            return this._activeScenes.size;
        }
        // ===== 全局System管理 =====
        /**
         * 添加全局System
         * 全局System会在所有激活Scene之前更新
         */
        addGlobalSystem(system) {
            if (this._globalSystems.includes(system)) {
                return system;
            }
            this._globalSystems.push(system);
            if (system.initialize) {
                system.initialize();
            }
            logger$3.debug(`在World '${this.name}' 中添加全局System: ${system.name}`);
            return system;
        }
        /**
         * 移除全局System
         */
        removeGlobalSystem(system) {
            const index = this._globalSystems.indexOf(system);
            if (index === -1) {
                return false;
            }
            this._globalSystems.splice(index, 1);
            if (system.reset) {
                system.reset();
            }
            logger$3.debug(`从World '${this.name}' 中移除全局System: ${system.name}`);
            return true;
        }
        /**
         * 获取全局System
         */
        getGlobalSystem(type) {
            for (const system of this._globalSystems) {
                if (system instanceof type) {
                    return system;
                }
            }
            return null;
        }
        // ===== World生命周期 =====
        /**
         * 启动World
         */
        start() {
            if (this._isActive) {
                return;
            }
            this._isActive = true;
            // 启动所有全局System
            for (const system of this._globalSystems) {
                if (system.initialize) {
                    system.initialize();
                }
            }
            logger$3.info(`启动World: ${this.name}`);
        }
        /**
         * 停止World
         */
        stop() {
            if (!this._isActive) {
                return;
            }
            // 停止所有Scene
            for (const sceneName of this._activeScenes) {
                this.setSceneActive(sceneName, false);
            }
            // 重置所有全局System
            for (const system of this._globalSystems) {
                if (system.reset) {
                    system.reset();
                }
            }
            this._isActive = false;
            logger$3.info(`停止World: ${this.name}`);
        }
        /**
         * 更新World中的全局System
         * 注意：此方法由Core.update()调用，不应直接调用
         */
        updateGlobalSystems() {
            if (!this._isActive) {
                return;
            }
            // 更新全局System
            for (const system of this._globalSystems) {
                if (system.update) {
                    system.update();
                }
            }
        }
        /**
         * 更新World中的所有激活Scene
         * 注意：此方法由Core.update()调用，不应直接调用
         */
        updateScenes() {
            if (!this._isActive) {
                return;
            }
            // 更新所有激活的Scene
            for (const sceneName of this._activeScenes) {
                const scene = this._scenes.get(sceneName);
                if (scene && scene.update) {
                    scene.update();
                }
            }
            // 自动清理（如果启用）
            if (this._config.autoCleanup && this.shouldAutoCleanup()) {
                this.cleanup();
            }
        }
        /**
         * 销毁World
         */
        destroy() {
            logger$3.info(`销毁World: ${this.name}`);
            // 停止World
            this.stop();
            // 销毁所有Scene
            const sceneNames = Array.from(this._scenes.keys());
            for (const sceneName of sceneNames) {
                this.removeScene(sceneName);
            }
            // 清理全局System
            for (const system of this._globalSystems) {
                if (system.destroy) {
                    system.destroy();
                }
                else if (system.reset) {
                    system.reset();
                }
            }
            this._globalSystems.length = 0;
            // 清空服务容器
            this._services.clear();
            this._scenes.clear();
            this._activeScenes.clear();
        }
        // ===== 状态信息 =====
        /**
         * 获取World状态
         */
        getStatus() {
            return {
                name: this.name,
                isActive: this._isActive,
                sceneCount: this._scenes.size,
                activeSceneCount: this._activeScenes.size,
                globalSystemCount: this._globalSystems.length,
                createdAt: this._createdAt,
                config: { ...this._config },
                scenes: Array.from(this._scenes.keys()).map((sceneName) => ({
                    id: sceneName,
                    isActive: this._activeScenes.has(sceneName),
                    name: this._scenes.get(sceneName)?.name || sceneName
                }))
            };
        }
        /**
         * 获取World统计信息
         */
        getStats() {
            const stats = {
                totalEntities: 0,
                totalSystems: this._globalSystems.length,
                memoryUsage: 0,
                performance: {
                    averageUpdateTime: 0,
                    maxUpdateTime: 0
                }
            };
            // 统计所有Scene的实体数量
            for (const scene of this._scenes.values()) {
                if (scene.entities) {
                    stats.totalEntities += scene.entities.count;
                }
                if (scene.systems) {
                    stats.totalSystems += scene.systems.length;
                }
            }
            return stats;
        }
        // ===== 私有方法 =====
        /**
         * 检查是否应该执行自动清理
         */
        shouldAutoCleanup() {
            // 简单的清理策略：如果有空Scene且超过5分钟没有实体
            const currentTime = Date.now();
            const cleanupThreshold = 5 * 60 * 1000; // 5分钟
            for (const [sceneName, scene] of this._scenes) {
                if (!this._activeScenes.has(sceneName) &&
                    scene.entities &&
                    scene.entities.count === 0 &&
                    (currentTime - this._createdAt) > cleanupThreshold) {
                    return true;
                }
            }
            return false;
        }
        /**
         * 执行清理操作
         */
        cleanup() {
            const sceneNames = Array.from(this._scenes.keys());
            const currentTime = Date.now();
            const cleanupThreshold = 5 * 60 * 1000; // 5分钟
            for (const sceneName of sceneNames) {
                const scene = this._scenes.get(sceneName);
                if (scene &&
                    !this._activeScenes.has(sceneName) &&
                    scene.entities &&
                    scene.entities.count === 0 &&
                    (currentTime - this._createdAt) > cleanupThreshold) {
                    this.removeScene(sceneName);
                    logger$3.debug(`自动清理空Scene: ${sceneName} from World ${this.name}`);
                }
            }
        }
        // ===== 访问器 =====
        /**
         * 检查World是否激活
         */
        get isActive() {
            return this._isActive;
        }
        /**
         * 获取Scene数量
         */
        get sceneCount() {
            return this._scenes.size;
        }
        /**
         * 获取创建时间
         */
        get createdAt() {
            return this._createdAt;
        }
    }

    /**
     * 单场景管理器
     *
     * 适用场景：
     * - 单人游戏
     * - 简单场景切换
     * - 不需要多World隔离的项目
     *
     * 特点：
     * - 轻量级，零额外开销
     * - 简单直观的API
     * - 支持延迟场景切换
     * - 自动管理ECS API
     *
     * @example
     * ```typescript
     * // 初始化Core
     * Core.create({ debug: true });
     *
     * // 创建场景管理器
     * const sceneManager = new SceneManager();
     *
     * // 设置场景
     * class GameScene extends Scene {
     *     initialize() {
     *         const player = this.createEntity('Player');
     *         player.addComponent(new Transform(100, 100));
     *     }
     * }
     *
     * sceneManager.setScene(new GameScene());
     *
     * // 游戏循环
     * function gameLoop(deltaTime: number) {
     *     Core.update(deltaTime);      // 更新全局服务
     *     sceneManager.update();       // 更新场景
     * }
     *
     * // 延迟切换场景（下一帧生效）
     * sceneManager.loadScene(new MenuScene());
     * ```
     */
    class SceneManager {
        constructor(performanceMonitor) {
            /**
             * 待切换的下一个场景（延迟切换用）
             */
            this._nextScene = null;
            /**
             * ECS流式API
             */
            this._ecsAPI = null;
            /**
             * 日志器
             */
            this._logger = createLogger('SceneManager');
            /**
             * 性能监控器（从 Core 注入）
             */
            this._performanceMonitor = null;
            this._defaultWorld = new World({ name: '__default__' });
            this._defaultWorld.start();
            this._performanceMonitor = performanceMonitor || null;
        }
        /**
         * 设置场景切换回调
         *
         * @param callback 场景切换时的回调函数
         * @internal
         */
        setSceneChangedCallback(callback) {
            this._onSceneChangedCallback = callback;
        }
        /**
         * 设置当前场景（立即切换）
         *
         * 会自动处理旧场景的结束和新场景的初始化。
         *
         * @param scene - 要设置的场景实例
         * @returns 返回设置的场景实例，便于链式调用
         *
         * @example
         * ```typescript
         * const gameScene = sceneManager.setScene(new GameScene());
         * console.log(gameScene.name); // 可以立即使用返回的场景
         * ```
         */
        setScene(scene) {
            // 移除旧场景
            this._defaultWorld.removeAllScenes();
            // 注册全局 PerformanceMonitor 到 Scene 的 ServiceContainer
            if (this._performanceMonitor) {
                scene.services.registerInstance(PerformanceMonitor, this._performanceMonitor);
            }
            // 通过 World 创建新场景
            this._defaultWorld.createScene(SceneManager.DEFAULT_SCENE_ID, scene);
            this._defaultWorld.setSceneActive(SceneManager.DEFAULT_SCENE_ID, true);
            // 重建ECS API
            if (scene.querySystem && scene.eventSystem) {
                this._ecsAPI = createECSAPI(scene, scene.querySystem, scene.eventSystem);
            }
            else {
                this._ecsAPI = null;
            }
            // 触发场景切换回调
            Time.sceneChanged();
            // 通知调试管理器（通过回调）
            if (this._onSceneChangedCallback) {
                this._onSceneChangedCallback();
            }
            this._logger.info(`Scene changed to: ${scene.name}`);
            return scene;
        }
        /**
         * 延迟加载场景（下一帧切换）
         *
         * 场景不会立即切换，而是在下一次调用 update() 时切换。
         * 这对于避免在当前帧的中途切换场景很有用。
         *
         * @param scene - 要加载的场景实例
         *
         * @example
         * ```typescript
         * // 在某个System中触发场景切换
         * class GameOverSystem extends EntitySystem {
         *     process(entities: readonly Entity[]) {
         *         if (playerHealth <= 0) {
         *             sceneManager.loadScene(new GameOverScene());
         *             // 当前帧继续执行，场景将在下一帧切换
         *         }
         *     }
         * }
         * ```
         */
        loadScene(scene) {
            this._nextScene = scene;
            this._logger.info(`Scheduled scene load: ${scene.name}`);
        }
        /**
         * 获取当前活跃的场景
         *
         * @returns 当前场景实例，如果没有场景则返回null
         */
        get currentScene() {
            return this._defaultWorld.getScene(SceneManager.DEFAULT_SCENE_ID);
        }
        /**
         * 获取ECS流式API
         *
         * 提供便捷的实体查询、事件发射等功能。
         *
         * @returns ECS API实例，如果当前没有场景则返回null
         *
         * @example
         * ```typescript
         * const api = sceneManager.api;
         * if (api) {
         *     // 查询所有敌人
         *     const enemies = api.find(Enemy, Transform);
         *
         *     // 发射事件
         *     api.emit('game:start', { level: 1 });
         * }
         * ```
         */
        get api() {
            return this._ecsAPI;
        }
        /**
         * 更新场景
         *
         * 应该在每帧的游戏循环中调用。
         * 会自动处理延迟场景切换。
         *
         * @example
         * ```typescript
         * function gameLoop(deltaTime: number) {
         *     Core.update(deltaTime);
         *     sceneManager.update();  // 每帧调用
         * }
         * ```
         */
        update() {
            // 处理延迟场景切换
            if (this._nextScene) {
                this.setScene(this._nextScene);
                this._nextScene = null;
            }
            // 通过 World 统一更新
            this._defaultWorld.updateGlobalSystems();
            this._defaultWorld.updateScenes();
        }
        /**
         * 销毁场景管理器
         *
         * 会自动结束当前场景并清理所有资源。
         * 通常在应用程序关闭时调用。
         */
        destroy() {
            this._logger.info('SceneManager destroying');
            this._defaultWorld.destroy();
            this._nextScene = null;
            this._ecsAPI = null;
            this._logger.info('SceneManager destroyed');
        }
        /**
         * 检查是否有活跃场景
         *
         * @returns 如果有活跃场景返回true，否则返回false
         */
        get hasScene() {
            return this._defaultWorld.getScene(SceneManager.DEFAULT_SCENE_ID) !== null;
        }
        /**
         * 检查是否有待切换的场景
         *
         * @returns 如果有待切换场景返回true，否则返回false
         */
        get hasPendingScene() {
            return this._nextScene !== null;
        }
        /**
         * 释放资源（IService接口）
         */
        dispose() {
            this.destroy();
        }
    }
    /**
     * 默认场景ID
     */
    SceneManager.DEFAULT_SCENE_ID = '__main__';

    /**
     * 调试配置服务
     *
     * 管理调试系统的配置信息
     */
    let DebugConfigService = class DebugConfigService {
        constructor() {
            this._config = {
                enabled: false,
                websocketUrl: '',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };
        }
        setConfig(config) {
            this._config = config;
        }
        getConfig() {
            return this._config;
        }
        isEnabled() {
            return this._config.enabled;
        }
        dispose() {
            // 清理资源
        }
    };
    DebugConfigService = __decorate$2([
        Injectable(),
        __metadata$2("design:paramtypes", [])
    ], DebugConfigService);

    /**
     * 调试管理器
     *
     * 整合所有调试数据收集器，负责收集和发送调试数据
     */
    let DebugManager = class DebugManager {
        constructor() {
            this.frameCounter = 0;
            this.lastSendTime = 0;
            this.sendInterval = 0;
            this.isRunning = false;
            this.originalConsole = {
                log: console.log.bind(console),
                debug: console.debug.bind(console),
                info: console.info.bind(console),
                warn: console.warn.bind(console),
                error: console.error.bind(console)
            };
        }
        onInitialize() {
            this.config = this.configService.getConfig();
            // 初始化数据收集器
            this.entityCollector = new EntityDataCollector();
            this.systemCollector = new SystemDataCollector();
            this.performanceCollector = new PerformanceDataCollector();
            this.componentCollector = new ComponentDataCollector();
            this.sceneCollector = new SceneDataCollector();
            // 初始化WebSocket管理器
            this.webSocketManager = new WebSocketManager(this.config.websocketUrl, this.config.autoReconnect !== false);
            // 设置消息处理回调
            this.webSocketManager.setMessageHandler(this.handleMessage.bind(this));
            // 计算发送间隔（基于帧率）
            const debugFrameRate = this.config.debugFrameRate || 30;
            this.sendInterval = 1000 / debugFrameRate;
            // 拦截 console 日志
            this.interceptConsole();
            this.start();
        }
        /**
         * 启动调试管理器
         */
        start() {
            if (this.isRunning)
                return;
            this.isRunning = true;
            this.connectWebSocket();
        }
        /**
         * 停止调试管理器
         */
        stop() {
            if (!this.isRunning)
                return;
            this.isRunning = false;
            this.webSocketManager.disconnect();
        }
        /**
         * 拦截 console 日志并转发到编辑器
         */
        interceptConsole() {
            console.log = (...args) => {
                this.sendLog('info', this.formatLogMessage(args));
                this.originalConsole.log(...args);
            };
            console.debug = (...args) => {
                this.sendLog('debug', this.formatLogMessage(args));
                this.originalConsole.debug(...args);
            };
            console.info = (...args) => {
                this.sendLog('info', this.formatLogMessage(args));
                this.originalConsole.info(...args);
            };
            console.warn = (...args) => {
                this.sendLog('warn', this.formatLogMessage(args));
                this.originalConsole.warn(...args);
            };
            console.error = (...args) => {
                this.sendLog('error', this.formatLogMessage(args));
                this.originalConsole.error(...args);
            };
        }
        /**
         * 格式化日志消息
         */
        formatLogMessage(args) {
            return args.map((arg) => {
                if (typeof arg === 'string')
                    return arg;
                if (arg instanceof Error)
                    return `${arg.name}: ${arg.message}`;
                if (arg === null)
                    return 'null';
                if (arg === undefined)
                    return 'undefined';
                if (typeof arg === 'object') {
                    try {
                        return this.safeStringify(arg, 6);
                    }
                    catch {
                        return Object.prototype.toString.call(arg);
                    }
                }
                return String(arg);
            }).join(' ');
        }
        /**
         * 安全的 JSON 序列化,支持循环引用和深度限制
         */
        safeStringify(obj, maxDepth = 6) {
            const seen = new WeakSet();
            const stringify = (value, depth) => {
                if (value === null)
                    return null;
                if (value === undefined)
                    return undefined;
                if (typeof value !== 'object')
                    return value;
                if (depth >= maxDepth) {
                    return '[Max Depth Reached]';
                }
                if (seen.has(value)) {
                    return '[Circular]';
                }
                seen.add(value);
                if (Array.isArray(value)) {
                    const result = value.map((item) => stringify(item, depth + 1));
                    seen.delete(value);
                    return result;
                }
                const result = {};
                for (const key in value) {
                    if (Object.prototype.hasOwnProperty.call(value, key)) {
                        result[key] = stringify(value[key], depth + 1);
                    }
                }
                seen.delete(value);
                return result;
            };
            return JSON.stringify(stringify(obj, 0));
        }
        /**
         * 发送日志到编辑器
         */
        sendLog(level, message) {
            if (!this.webSocketManager.getConnectionStatus()) {
                return;
            }
            try {
                this.webSocketManager.send({
                    type: 'log',
                    data: {
                        level,
                        message,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            catch (error) {
                // 静默失败，避免递归日志
            }
        }
        /**
         * 更新配置
         */
        updateConfig(config) {
            this.config = config;
            // 更新发送间隔
            const debugFrameRate = config.debugFrameRate || 30;
            this.sendInterval = 1000 / debugFrameRate;
            // 重新连接WebSocket（如果URL变化）
            if (this.webSocketManager && config.websocketUrl) {
                this.webSocketManager.disconnect();
                this.webSocketManager = new WebSocketManager(config.websocketUrl, config.autoReconnect !== false);
                this.webSocketManager.setMessageHandler(this.handleMessage.bind(this));
                this.connectWebSocket();
            }
        }
        update(_deltaTime) {
            if (!this.isRunning || !this.config.enabled)
                return;
            this.frameCounter++;
            const currentTime = Date.now();
            if (currentTime - this.lastSendTime >= this.sendInterval) {
                this.sendDebugData();
                this.lastSendTime = currentTime;
            }
        }
        /**
         * 场景变更回调
         */
        onSceneChanged() {
            // 场景变更时立即发送一次数据
            if (this.isRunning && this.config.enabled) {
                this.sendDebugData();
            }
        }
        /**
         * 处理来自调试面板的消息
         */
        handleMessage(message) {
            try {
                switch (message.type) {
                    case 'capture_memory_snapshot':
                        this.handleMemorySnapshotRequest();
                        break;
                    case 'config_update':
                        if (message.config) {
                            this.updateConfig({ ...this.config, ...message.config });
                        }
                        break;
                    case 'expand_lazy_object':
                        this.handleExpandLazyObjectRequest(message);
                        break;
                    case 'get_component_properties':
                        this.handleGetComponentPropertiesRequest(message);
                        break;
                    case 'get_raw_entity_list':
                        this.handleGetRawEntityListRequest(message);
                        break;
                    case 'get_entity_details':
                        this.handleGetEntityDetailsRequest(message);
                        break;
                    case 'ping':
                        this.webSocketManager.send({
                            type: 'pong',
                            timestamp: Date.now()
                        });
                        break;
                    default:
                        // 未知消息类型，忽略
                        break;
                }
            }
            catch (error) {
                // console.error('[ECS Debug] 处理消息失败:', error);
                if (message.requestId) {
                    this.webSocketManager.send({
                        type: 'error_response',
                        requestId: message.requestId,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
        }
        /**
         * 处理展开懒加载对象请求
         */
        handleExpandLazyObjectRequest(message) {
            try {
                const { entityId, componentIndex, propertyPath, requestId } = message;
                if (entityId === undefined || componentIndex === undefined || !propertyPath) {
                    this.webSocketManager.send({
                        type: 'expand_lazy_object_response',
                        requestId,
                        error: '缺少必要参数'
                    });
                    return;
                }
                const scene = this.sceneManager.currentScene;
                const expandedData = this.entityCollector.expandLazyObject(entityId, componentIndex, propertyPath, scene);
                this.webSocketManager.send({
                    type: 'expand_lazy_object_response',
                    requestId,
                    data: expandedData
                });
            }
            catch (error) {
                this.webSocketManager.send({
                    type: 'expand_lazy_object_response',
                    requestId: message.requestId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        /**
         * 处理获取组件属性请求
         */
        handleGetComponentPropertiesRequest(message) {
            try {
                const { entityId, componentIndex, requestId } = message;
                if (entityId === undefined || componentIndex === undefined) {
                    this.webSocketManager.send({
                        type: 'get_component_properties_response',
                        requestId,
                        error: '缺少必要参数'
                    });
                    return;
                }
                const scene = this.sceneManager.currentScene;
                const properties = this.entityCollector.getComponentProperties(entityId, componentIndex, scene);
                this.webSocketManager.send({
                    type: 'get_component_properties_response',
                    requestId,
                    data: properties
                });
            }
            catch (error) {
                this.webSocketManager.send({
                    type: 'get_component_properties_response',
                    requestId: message.requestId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        /**
         * 处理获取原始实体列表请求
         */
        handleGetRawEntityListRequest(message) {
            try {
                const { requestId } = message;
                const scene = this.sceneManager.currentScene;
                const rawEntityList = this.entityCollector.getRawEntityList(scene);
                this.webSocketManager.send({
                    type: 'get_raw_entity_list_response',
                    requestId,
                    data: rawEntityList
                });
            }
            catch (error) {
                this.webSocketManager.send({
                    type: 'get_raw_entity_list_response',
                    requestId: message.requestId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        /**
         * 处理获取实体详情请求
         */
        handleGetEntityDetailsRequest(message) {
            try {
                const { entityId, requestId } = message;
                if (entityId === undefined) {
                    this.webSocketManager.send({
                        type: 'get_entity_details_response',
                        requestId,
                        error: '缺少实体ID参数'
                    });
                    return;
                }
                const scene = this.sceneManager.currentScene;
                const entityDetails = this.entityCollector.getEntityDetails(entityId, scene);
                this.webSocketManager.send({
                    type: 'get_entity_details_response',
                    requestId,
                    data: entityDetails
                });
            }
            catch (error) {
                this.webSocketManager.send({
                    type: 'get_entity_details_response',
                    requestId: message.requestId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        /**
         * 处理内存快照请求
         */
        handleMemorySnapshotRequest() {
            try {
                const memorySnapshot = this.captureMemorySnapshot();
                this.webSocketManager.send({
                    type: 'memory_snapshot_response',
                    data: memorySnapshot
                });
            }
            catch (error) {
                this.webSocketManager.send({
                    type: 'memory_snapshot_error',
                    error: error instanceof Error ? error.message : '内存快照捕获失败'
                });
            }
        }
        /**
         * 捕获内存快照
         */
        captureMemorySnapshot() {
            const timestamp = Date.now();
            // 收集其他内存统计
            const baseMemoryInfo = this.collectBaseMemoryInfo();
            const scene = this.sceneManager.currentScene;
            // 使用专门的内存计算方法收集实体数据
            const entityData = this.entityCollector.collectEntityDataWithMemory(scene);
            const componentMemoryStats = scene?.entities ? this.collectComponentMemoryStats(scene.entities) : { totalMemory: 0, componentTypes: 0, totalInstances: 0, breakdown: [] };
            const systemMemoryStats = this.collectSystemMemoryStats();
            const poolMemoryStats = this.collectPoolMemoryStats();
            const performanceStats = this.collectPerformanceStats();
            // 计算总内存使用量
            const totalEntityMemory = entityData.entitiesPerArchetype.reduce((sum, arch) => sum + arch.memory, 0);
            return {
                timestamp,
                version: '2.0',
                summary: {
                    totalEntities: entityData.totalEntities,
                    totalMemoryUsage: baseMemoryInfo.usedMemory,
                    totalMemoryLimit: baseMemoryInfo.totalMemory,
                    memoryUtilization: (baseMemoryInfo.usedMemory / baseMemoryInfo.totalMemory * 100),
                    gcCollections: baseMemoryInfo.gcCollections,
                    entityMemory: totalEntityMemory,
                    componentMemory: componentMemoryStats.totalMemory,
                    systemMemory: systemMemoryStats.totalMemory,
                    poolMemory: poolMemoryStats.totalMemory
                },
                baseMemory: baseMemoryInfo,
                entities: {
                    totalMemory: totalEntityMemory,
                    entityCount: entityData.totalEntities,
                    archetypes: entityData.entitiesPerArchetype,
                    largestEntities: entityData.topEntitiesByComponents
                },
                components: componentMemoryStats,
                systems: systemMemoryStats,
                pools: poolMemoryStats,
                performance: performanceStats
            };
        }
        /**
         * 收集基础内存信息
         */
        collectBaseMemoryInfo() {
            const memoryInfo = {
                totalMemory: 0,
                usedMemory: 0,
                freeMemory: 0,
                gcCollections: 0,
                heapInfo: null,
                detailedMemory: undefined
            };
            try {
                // 类型安全的performance memory访问
                const performanceWithMemory = performance;
                if (performanceWithMemory.memory) {
                    const perfMemory = performanceWithMemory.memory;
                    memoryInfo.totalMemory = perfMemory.jsHeapSizeLimit || 512 * 1024 * 1024;
                    memoryInfo.usedMemory = perfMemory.usedJSHeapSize || 0;
                    memoryInfo.freeMemory = memoryInfo.totalMemory - memoryInfo.usedMemory;
                    memoryInfo.heapInfo = {
                        totalJSHeapSize: perfMemory.totalJSHeapSize || 0,
                        usedJSHeapSize: perfMemory.usedJSHeapSize || 0,
                        jsHeapSizeLimit: perfMemory.jsHeapSizeLimit || 0
                    };
                }
                else {
                    memoryInfo.totalMemory = 512 * 1024 * 1024;
                    memoryInfo.freeMemory = 512 * 1024 * 1024;
                }
                // 尝试获取GC信息
                if (performanceWithMemory.measureUserAgentSpecificMemory) {
                    performanceWithMemory.measureUserAgentSpecificMemory().then((result) => {
                        memoryInfo.detailedMemory = result;
                    }).catch(() => {
                        // 忽略错误
                    });
                }
            }
            catch (error) {
                // 使用默认值
            }
            return memoryInfo;
        }
        /**
         * 收集组件内存统计（仅用于内存快照）
         */
        collectComponentMemoryStats(entityList) {
            const componentStats = new Map();
            let totalComponentMemory = 0;
            // 首先统计组件类型和数量
            const componentTypeCounts = new Map();
            for (const entity of entityList.buffer) {
                if (!entity || entity.destroyed || !entity.components)
                    continue;
                for (const component of entity.components) {
                    const typeName = getComponentInstanceTypeName(component);
                    componentTypeCounts.set(typeName, (componentTypeCounts.get(typeName) || 0) + 1);
                }
            }
            // 为每种组件类型计算详细内存（只计算一次，然后乘以数量）
            for (const [typeName, count] of componentTypeCounts.entries()) {
                const detailedMemoryPerInstance = this.componentCollector.calculateDetailedComponentMemory(typeName);
                const totalMemoryForType = detailedMemoryPerInstance * count;
                totalComponentMemory += totalMemoryForType;
                // 收集该类型组件的实例信息（用于显示最大的几个实例）
                const instances = [];
                let instanceCount = 0;
                for (const entity of entityList.buffer) {
                    if (!entity || entity.destroyed || !entity.components)
                        continue;
                    for (const component of entity.components) {
                        if (getComponentInstanceTypeName(component) === typeName) {
                            instances.push({
                                entityId: entity.id,
                                entityName: entity.name || `Entity_${entity.id}`,
                                memory: detailedMemoryPerInstance // 使用统一的详细计算结果
                            });
                            instanceCount++;
                            // 限制收集的实例数量，避免过多数据
                            if (instanceCount >= 100)
                                break;
                        }
                    }
                    if (instanceCount >= 100)
                        break;
                }
                componentStats.set(typeName, {
                    count: count,
                    totalMemory: totalMemoryForType,
                    instances: instances.slice(0, 10) // 只保留前10个实例用于显示
                });
            }
            const componentBreakdown = Array.from(componentStats.entries()).map(([typeName, stats]) => ({
                typeName,
                instanceCount: stats.count,
                totalMemory: stats.totalMemory,
                averageMemory: stats.totalMemory / stats.count,
                percentage: totalComponentMemory > 0 ? (stats.totalMemory / totalComponentMemory * 100) : 0,
                largestInstances: stats.instances.sort((a, b) => b.memory - a.memory).slice(0, 3)
            })).sort((a, b) => b.totalMemory - a.totalMemory);
            return {
                totalMemory: totalComponentMemory,
                componentTypes: componentStats.size,
                totalInstances: Array.from(componentStats.values()).reduce((sum, stats) => sum + stats.count, 0),
                breakdown: componentBreakdown
            };
        }
        collectSystemMemoryStats() {
            const scene = this.sceneManager.currentScene;
            let totalSystemMemory = 0;
            const systemBreakdown = [];
            try {
                const systems = scene?.systems;
                if (systems) {
                    const systemTypeMemoryCache = new Map();
                    for (const system of systems) {
                        const systemTypeName = getSystemInstanceTypeName(system);
                        let systemMemory;
                        if (systemTypeMemoryCache.has(systemTypeName)) {
                            systemMemory = systemTypeMemoryCache.get(systemTypeName);
                        }
                        else {
                            systemMemory = this.calculateQuickSystemSize(system);
                            systemTypeMemoryCache.set(systemTypeName, systemMemory);
                        }
                        totalSystemMemory += systemMemory;
                        systemBreakdown.push({
                            name: systemTypeName,
                            memory: systemMemory,
                            enabled: system.enabled !== false,
                            updateOrder: system.updateOrder || 0
                        });
                    }
                }
            }
            catch (error) {
                // 忽略错误
            }
            return {
                totalMemory: totalSystemMemory,
                systemCount: systemBreakdown.length,
                breakdown: systemBreakdown.sort((a, b) => b.memory - a.memory)
            };
        }
        calculateQuickSystemSize(system) {
            if (!system || typeof system !== 'object')
                return 64;
            let size = 128;
            try {
                const keys = Object.keys(system);
                for (let i = 0; i < Math.min(keys.length, 15); i++) {
                    const key = keys[i];
                    if (!key || key === 'entities' || key === 'scene' || key === 'constructor')
                        continue;
                    const value = system[key];
                    size += key.length * 2;
                    if (typeof value === 'string') {
                        size += Math.min(value.length * 2, 100);
                    }
                    else if (typeof value === 'number') {
                        size += 8;
                    }
                    else if (typeof value === 'boolean') {
                        size += 4;
                    }
                    else if (Array.isArray(value)) {
                        size += 40 + Math.min(value.length * 8, 200);
                    }
                    else if (typeof value === 'object' && value !== null) {
                        size += 64;
                    }
                }
            }
            catch (error) {
                return 128;
            }
            return Math.max(size, 64);
        }
        /**
         * 收集对象池内存统计
         */
        collectPoolMemoryStats() {
            let totalPoolMemory = 0;
            const poolBreakdown = [];
            try {
                // 尝试获取组件池统计
                const poolManager = ComponentPoolManager.getInstance();
                const poolStats = poolManager.getPoolStats();
                for (const [typeName, stats] of poolStats.entries()) {
                    const poolData = stats;
                    const poolMemory = poolData.maxSize * 32; // 估算每个对象32字节
                    totalPoolMemory += poolMemory;
                    poolBreakdown.push({
                        typeName,
                        maxSize: poolData.maxSize,
                        currentSize: poolData.currentSize || 0,
                        estimatedMemory: poolMemory,
                        utilization: poolData.currentSize ? (poolData.currentSize / poolData.maxSize * 100) : 0
                    });
                }
            }
            catch (error) {
                // 如果无法获取池信息，使用默认值
            }
            try {
                // 尝试获取通用对象池统计
                const poolStats = Pool.getAllPoolStats();
                for (const [typeName, stats] of Object.entries(poolStats)) {
                    const poolData = stats;
                    totalPoolMemory += poolData.estimatedMemoryUsage;
                    poolBreakdown.push({
                        typeName: `Pool_${typeName}`,
                        maxSize: poolData.maxSize,
                        currentSize: poolData.size,
                        estimatedMemory: poolData.estimatedMemoryUsage,
                        utilization: poolData.size / poolData.maxSize * 100,
                        hitRate: poolData.hitRate * 100
                    });
                }
            }
            catch (error) {
                // 忽略错误
            }
            return {
                totalMemory: totalPoolMemory,
                poolCount: poolBreakdown.length,
                breakdown: poolBreakdown.sort((a, b) => b.estimatedMemory - a.estimatedMemory)
            };
        }
        /**
         * 收集性能统计信息
         */
        collectPerformanceStats() {
            try {
                if (!this.performanceMonitor) {
                    return { enabled: false };
                }
                const stats = this.performanceMonitor.getAllSystemStats();
                const warnings = this.performanceMonitor.getPerformanceWarnings();
                return {
                    enabled: this.performanceMonitor.enabled ?? false,
                    systemCount: stats.size,
                    warnings: warnings.slice(0, 10), // 最多10个警告
                    topSystems: Array.from(stats.entries()).map((entry) => {
                        const [name, stat] = entry;
                        return {
                            name,
                            averageTime: stat.averageTime,
                            maxTime: stat.maxTime,
                            samples: stat.executionCount
                        };
                    }).sort((a, b) => b.averageTime - a.averageTime).slice(0, 5)
                };
            }
            catch (error) {
                return { enabled: false, error: error instanceof Error ? error.message : String(error) };
            }
        }
        /**
         * 获取调试数据
         */
        getDebugData() {
            const currentTime = Date.now();
            const scene = this.sceneManager.currentScene;
            const debugData = {
                timestamp: currentTime,
                frameworkVersion: '1.0.0', // 可以从package.json读取
                isRunning: this.isRunning,
                frameworkLoaded: true,
                currentScene: scene?.name || 'Unknown'
            };
            // 根据配置收集各种数据
            if (this.config.channels.entities) {
                debugData.entities = this.entityCollector.collectEntityData(scene);
            }
            if (this.config.channels.systems) {
                debugData.systems = this.systemCollector.collectSystemData(this.performanceMonitor, scene);
            }
            if (this.config.channels.performance) {
                debugData.performance = this.performanceCollector.collectPerformanceData(this.performanceMonitor);
            }
            if (this.config.channels.components) {
                debugData.components = this.componentCollector.collectComponentData(scene);
            }
            if (this.config.channels.scenes) {
                debugData.scenes = this.sceneCollector.collectSceneData(scene);
            }
            return debugData;
        }
        /**
         * 连接WebSocket
         */
        async connectWebSocket() {
            try {
                await this.webSocketManager.connect();
                // console.log('[ECS Debug] 调试管理器已连接到调试服务器');
            }
            catch (error) {
                // console.warn('[ECS Debug] 无法连接到调试服务器:', error);
            }
        }
        /**
         * 发送调试数据
         */
        sendDebugData() {
            if (!this.webSocketManager.getConnectionStatus()) {
                return;
            }
            try {
                const debugData = this.getDebugData();
                // 包装成调试面板期望的消息格式
                const message = {
                    type: 'debug_data',
                    data: debugData
                };
                this.webSocketManager.send(message);
            }
            catch (error) {
                // console.error('[ECS Debug] 发送调试数据失败:', error);
            }
        }
        /**
         * 释放资源
         */
        dispose() {
            this.stop();
            // 恢复原始 console 方法
            console.log = this.originalConsole.log;
            console.debug = this.originalConsole.debug;
            console.info = this.originalConsole.info;
            console.warn = this.originalConsole.warn;
            console.error = this.originalConsole.error;
        }
    };
    __decorate$2([
        InjectProperty(SceneManager),
        __metadata$2("design:type", SceneManager)
    ], DebugManager.prototype, "sceneManager", void 0);
    __decorate$2([
        InjectProperty(PerformanceMonitor),
        __metadata$2("design:type", PerformanceMonitor)
    ], DebugManager.prototype, "performanceMonitor", void 0);
    __decorate$2([
        InjectProperty(DebugConfigService),
        __metadata$2("design:type", DebugConfigService)
    ], DebugManager.prototype, "configService", void 0);
    DebugManager = __decorate$2([
        Injectable(),
        Updatable()
    ], DebugManager);

    /**
     * 插件状态
     */
    var PluginState;
    (function (PluginState) {
        /**
         * 未安装
         */
        PluginState["NotInstalled"] = "not_installed";
        /**
         * 已安装
         */
        PluginState["Installed"] = "installed";
        /**
         * 安装失败
         */
        PluginState["Failed"] = "failed";
    })(PluginState || (PluginState = {}));

    const logger$2 = createLogger('PluginManager');
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
    class PluginManager {
        constructor() {
            /**
             * 已安装的插件
             */
            this._plugins = new Map();
            /**
             * 插件元数据
             */
            this._metadata = new Map();
            /**
             * Core实例引用
             */
            this._core = null;
            /**
             * 服务容器引用
             */
            this._services = null;
        }
        /**
         * 初始化插件管理器
         *
         * @param core - Core实例
         * @param services - 服务容器
         */
        initialize(core, services) {
            this._core = core;
            this._services = services;
            logger$2.info('PluginManager initialized');
        }
        /**
         * 安装插件
         *
         * 会自动检查依赖并按正确顺序安装。
         *
         * @param plugin - 插件实例
         * @throws 如果依赖检查失败或安装失败
         */
        async install(plugin) {
            if (!this._core || !this._services) {
                throw new Error('PluginManager not initialized. Call initialize() first.');
            }
            // 检查是否已安装
            if (this._plugins.has(plugin.name)) {
                logger$2.warn(`Plugin ${plugin.name} is already installed`);
                return;
            }
            // 检查依赖
            if (plugin.dependencies && plugin.dependencies.length > 0) {
                this._checkDependencies(plugin);
            }
            // 创建元数据
            const metadata = {
                name: plugin.name,
                version: plugin.version,
                state: PluginState.NotInstalled,
                installedAt: Date.now()
            };
            this._metadata.set(plugin.name, metadata);
            try {
                // 调用插件的安装方法
                logger$2.info(`Installing plugin: ${plugin.name} v${plugin.version}`);
                await plugin.install(this._core, this._services);
                // 标记为已安装
                this._plugins.set(plugin.name, plugin);
                metadata.state = PluginState.Installed;
                logger$2.info(`Plugin ${plugin.name} installed successfully`);
            }
            catch (error) {
                // 安装失败
                metadata.state = PluginState.Failed;
                metadata.error = error instanceof Error ? error.message : String(error);
                logger$2.error(`Failed to install plugin ${plugin.name}:`, error);
                throw error;
            }
        }
        /**
         * 卸载插件
         *
         * @param name - 插件名称
         * @throws 如果插件未安装或卸载失败
         */
        async uninstall(name) {
            const plugin = this._plugins.get(name);
            if (!plugin) {
                throw new Error(`Plugin ${name} is not installed`);
            }
            // 检查是否有其他插件依赖此插件
            this._checkDependents(name);
            try {
                logger$2.info(`Uninstalling plugin: ${name}`);
                await plugin.uninstall();
                // 从注册表中移除
                this._plugins.delete(name);
                this._metadata.delete(name);
                logger$2.info(`Plugin ${name} uninstalled successfully`);
            }
            catch (error) {
                logger$2.error(`Failed to uninstall plugin ${name}:`, error);
                throw error;
            }
        }
        /**
         * 获取插件实例
         *
         * @param name - 插件名称
         * @returns 插件实例，如果未安装则返回undefined
         */
        getPlugin(name) {
            return this._plugins.get(name);
        }
        /**
         * 获取插件元数据
         *
         * @param name - 插件名称
         * @returns 插件元数据，如果未安装则返回undefined
         */
        getMetadata(name) {
            return this._metadata.get(name);
        }
        /**
         * 获取所有已安装的插件
         *
         * @returns 插件列表
         */
        getAllPlugins() {
            return Array.from(this._plugins.values());
        }
        /**
         * 获取所有插件元数据
         *
         * @returns 元数据列表
         */
        getAllMetadata() {
            return Array.from(this._metadata.values());
        }
        /**
         * 检查插件是否已安装
         *
         * @param name - 插件名称
         * @returns 是否已安装
         */
        isInstalled(name) {
            return this._plugins.has(name);
        }
        /**
         * 检查插件依赖
         *
         * @param plugin - 插件实例
         * @throws 如果依赖未满足
         */
        _checkDependencies(plugin) {
            if (!plugin.dependencies) {
                return;
            }
            const missingDeps = [];
            for (const dep of plugin.dependencies) {
                if (!this._plugins.has(dep)) {
                    missingDeps.push(dep);
                }
            }
            if (missingDeps.length > 0) {
                throw new Error(`Plugin ${plugin.name} has unmet dependencies: ${missingDeps.join(', ')}`);
            }
        }
        /**
         * 检查是否有其他插件依赖指定插件
         *
         * @param name - 插件名称
         * @throws 如果有其他插件依赖此插件
         */
        _checkDependents(name) {
            const dependents = [];
            for (const plugin of this._plugins.values()) {
                if (plugin.dependencies && plugin.dependencies.includes(name)) {
                    dependents.push(plugin.name);
                }
            }
            if (dependents.length > 0) {
                throw new Error(`Cannot uninstall plugin ${name}: it is required by ${dependents.join(', ')}`);
            }
        }
        /**
         * 释放资源
         */
        dispose() {
            // 卸载所有插件（逆序，先卸载依赖项）
            const plugins = Array.from(this._plugins.values()).reverse();
            for (const plugin of plugins) {
                try {
                    logger$2.info(`Disposing plugin: ${plugin.name}`);
                    plugin.uninstall();
                }
                catch (error) {
                    logger$2.error(`Error disposing plugin ${plugin.name}:`, error);
                }
            }
            this._plugins.clear();
            this._metadata.clear();
            this._core = null;
            this._services = null;
            logger$2.info('PluginManager disposed');
        }
    }

    const logger$1 = createLogger('WorldManager');
    /**
     * World管理器 - 管理所有World实例
     *
     * WorldManager负责管理多个独立的World实例。
     * 每个World都是独立的ECS环境，可以包含多个Scene。
     *
     * 适用场景：
     * - MMO游戏的多房间管理
     * - 服务器端的多游戏实例
     * - 需要完全隔离的多个游戏环境
     *
     * @example
     * ```typescript
     * // 创建WorldManager实例
     * const worldManager = new WorldManager({
     *     maxWorlds: 100,
     *     autoCleanup: true
     * });
     *
     * // 创建游戏房间World
     * const room1 = worldManager.createWorld('room_001', {
     *     name: 'GameRoom_001',
     *     maxScenes: 5
     * });
     * room1.setActive(true);
     *
     * // 游戏循环
     * function gameLoop(deltaTime: number) {
     *     Core.update(deltaTime);
     *     worldManager.updateAll();  // 更新所有活跃World
     * }
     * ```
     */
    class WorldManager {
        constructor(config = {}) {
            this._worlds = new Map();
            this._isRunning = false;
            this._framesSinceCleanup = 0;
            this._config = {
                maxWorlds: 50,
                autoCleanup: true,
                cleanupFrameInterval: 1800, // 1800帧
                debug: false,
                ...config
            };
            // 默认启动运行状态
            this._isRunning = true;
            logger$1.info('WorldManager已初始化', {
                maxWorlds: this._config.maxWorlds,
                autoCleanup: this._config.autoCleanup,
                cleanupFrameInterval: this._config.cleanupFrameInterval
            });
        }
        // ===== World管理 =====
        /**
         * 创建新World
         */
        createWorld(worldName, config) {
            if (!worldName || typeof worldName !== 'string' || worldName.trim() === '') {
                throw new Error('World name不能为空');
            }
            if (this._worlds.has(worldName)) {
                throw new Error(`World name '${worldName}' 已存在`);
            }
            if (this._worlds.size >= this._config.maxWorlds) {
                throw new Error(`已达到最大World数量限制: ${this._config.maxWorlds}`);
            }
            // 优先级：config.debug > WorldManager.debug > 默认
            const worldConfig = {
                name: worldName,
                debug: config?.debug ?? this._config.debug ?? false,
                ...(config?.maxScenes !== undefined && { maxScenes: config.maxScenes }),
                ...(config?.autoCleanup !== undefined && { autoCleanup: config.autoCleanup })
            };
            const world = new World(worldConfig);
            this._worlds.set(worldName, world);
            return world;
        }
        /**
         * 移除World
         */
        removeWorld(worldName) {
            const world = this._worlds.get(worldName);
            if (!world) {
                return false;
            }
            // 销毁World
            world.destroy();
            this._worlds.delete(worldName);
            logger$1.info(`移除World: ${worldName}`);
            return true;
        }
        /**
         * 获取World
         */
        getWorld(worldName) {
            return this._worlds.get(worldName) || null;
        }
        /**
         * 获取所有World ID
         */
        getWorldIds() {
            return Array.from(this._worlds.keys());
        }
        /**
         * 获取所有World
         */
        getAllWorlds() {
            return Array.from(this._worlds.values());
        }
        /**
         * 设置World激活状态
         */
        setWorldActive(worldName, active) {
            const world = this._worlds.get(worldName);
            if (!world) {
                logger$1.warn(`World '${worldName}' 不存在`);
                return;
            }
            if (active) {
                world.start();
                logger$1.debug(`激活World: ${worldName}`);
            }
            else {
                world.stop();
                logger$1.debug(`停用World: ${worldName}`);
            }
        }
        /**
         * 检查World是否激活
         */
        isWorldActive(worldName) {
            const world = this._worlds.get(worldName);
            return world?.isActive ?? false;
        }
        // ===== 批量操作 =====
        /**
         * 更新所有活跃的World
         *
         * 应该在每帧的游戏循环中调用。
         * 会自动更新所有活跃World的全局系统和场景。
         *
         * @example
         * ```typescript
         * function gameLoop(deltaTime: number) {
         *     Core.update(deltaTime);      // 更新全局服务
         *     worldManager.updateAll();    // 更新所有World
         * }
         * ```
         */
        updateAll() {
            if (!this._isRunning)
                return;
            for (const world of this._worlds.values()) {
                if (world.isActive) {
                    // 更新World的全局System
                    world.updateGlobalSystems();
                    // 更新World中的所有Scene
                    world.updateScenes();
                }
            }
            // 基于帧的自动清理
            if (this._config.autoCleanup) {
                this._framesSinceCleanup++;
                if (this._framesSinceCleanup >= this._config.cleanupFrameInterval) {
                    this.cleanup();
                    this._framesSinceCleanup = 0; // 重置计数器
                    if (this._config.debug) {
                        logger$1.debug(`执行定期清理World (间隔: ${this._config.cleanupFrameInterval} 帧)`);
                    }
                }
            }
        }
        /**
         * 获取所有激活的World
         */
        getActiveWorlds() {
            const activeWorlds = [];
            for (const world of this._worlds.values()) {
                if (world.isActive) {
                    activeWorlds.push(world);
                }
            }
            return activeWorlds;
        }
        /**
         * 启动所有World
         */
        startAll() {
            this._isRunning = true;
            for (const world of this._worlds.values()) {
                world.start();
            }
            logger$1.info('启动所有World');
        }
        /**
         * 停止所有World
         */
        stopAll() {
            this._isRunning = false;
            for (const world of this._worlds.values()) {
                world.stop();
            }
            logger$1.info('停止所有World');
        }
        /**
         * 查找满足条件的World
         */
        findWorlds(predicate) {
            const results = [];
            for (const world of this._worlds.values()) {
                if (predicate(world)) {
                    results.push(world);
                }
            }
            return results;
        }
        /**
         * 根据名称查找World
         */
        findWorldByName(name) {
            for (const world of this._worlds.values()) {
                if (world.name === name) {
                    return world;
                }
            }
            return null;
        }
        // ===== 统计和监控 =====
        /**
         * 获取WorldManager统计信息
         */
        getStats() {
            const stats = {
                totalWorlds: this._worlds.size,
                activeWorlds: this.activeWorldCount,
                totalScenes: 0,
                totalEntities: 0,
                totalSystems: 0,
                memoryUsage: 0,
                isRunning: this._isRunning,
                config: { ...this._config },
                worlds: []
            };
            for (const [worldName, world] of this._worlds) {
                const worldStats = world.getStats();
                stats.totalScenes += worldStats.totalSystems; // World的getStats可能需要调整
                stats.totalEntities += worldStats.totalEntities;
                stats.totalSystems += worldStats.totalSystems;
                stats.worlds.push({
                    id: worldName,
                    name: world.name,
                    isActive: world.isActive,
                    sceneCount: world.sceneCount,
                    ...worldStats
                });
            }
            return stats;
        }
        /**
         * 获取详细状态信息
         */
        getDetailedStatus() {
            return {
                ...this.getStats(),
                worlds: Array.from(this._worlds.entries()).map(([worldName, world]) => ({
                    id: worldName,
                    isActive: world.isActive,
                    status: world.getStatus()
                }))
            };
        }
        // ===== 生命周期管理 =====
        /**
         * 清理空World
         */
        cleanup() {
            const worldsToRemove = [];
            for (const [worldName, world] of this._worlds) {
                if (this.shouldCleanupWorld(world)) {
                    worldsToRemove.push(worldName);
                }
            }
            for (const worldName of worldsToRemove) {
                this.removeWorld(worldName);
            }
            if (worldsToRemove.length > 0) {
                logger$1.debug(`清理了 ${worldsToRemove.length} 个World`);
            }
            return worldsToRemove.length;
        }
        /**
         * 销毁WorldManager
         */
        destroy() {
            logger$1.info('正在销毁WorldManager...');
            // 停止所有World
            this.stopAll();
            // 销毁所有World
            const worldNames = Array.from(this._worlds.keys());
            for (const worldName of worldNames) {
                this.removeWorld(worldName);
            }
            this._worlds.clear();
            this._isRunning = false;
            logger$1.info('WorldManager已销毁');
        }
        /**
         * 实现 IService 接口的 dispose 方法
         * 调用 destroy 方法进行清理
         */
        dispose() {
            this.destroy();
        }
        // ===== 私有方法 =====
        /**
         * 判断World是否应该被清理
         * 清理策略：
         * 1. World未激活
         * 2. 没有Scene或所有Scene都是空的
         * 3. 创建时间超过10分钟
         */
        shouldCleanupWorld(world) {
            if (world.isActive) {
                return false;
            }
            const age = Date.now() - world.createdAt;
            const isOldEnough = age > 10 * 60 * 1000; // 10分钟
            if (world.sceneCount === 0) {
                return isOldEnough;
            }
            // 检查是否所有Scene都是空的
            const allScenes = world.getAllScenes();
            const hasEntities = allScenes.some((scene) => scene.entities && scene.entities.count > 0);
            return !hasEntities && isOldEnough;
        }
        // ===== 访问器 =====
        /**
         * 获取World总数
         */
        get worldCount() {
            return this._worlds.size;
        }
        /**
         * 获取激活World数量
         */
        get activeWorldCount() {
            let count = 0;
            for (const world of this._worlds.values()) {
                if (world.isActive)
                    count++;
            }
            return count;
        }
        /**
         * 检查是否正在运行
         */
        get isRunning() {
            return this._isRunning;
        }
        /**
         * 获取配置
         */
        get config() {
            return { ...this._config };
        }
    }

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
    class Core {
        /**
         * 创建核心实例
         *
         * @param config - Core配置对象
         */
        constructor(config = {}) {
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
            this._sceneManager = new SceneManager(this._performanceMonitor);
            this._serviceContainer.registerInstance(SceneManager, this._sceneManager);
            // 设置场景切换回调，通知调试管理器
            this._sceneManager.setSceneChangedCallback(() => {
                if (this._debugManager) {
                    this._debugManager.onSceneChanged();
                }
            });
            // 初始化World管理器
            this._worldManager = new WorldManager({ debug: !!this._config.debug, ...this._config.worldManagerConfig });
            this._serviceContainer.registerInstance(WorldManager, this._worldManager);
            // 初始化插件管理器
            this._pluginManager = new PluginManager();
            this._pluginManager.initialize(this, this._serviceContainer);
            this._serviceContainer.registerInstance(PluginManager, this._pluginManager);
            Core.entitySystemsEnabled = this._config.enableEntitySystems ?? true;
            this.debug = this._config.debug ?? true;
            // 初始化调试管理器
            if (this._config.debugConfig?.enabled) {
                const configService = new DebugConfigService();
                configService.setConfig(this._config.debugConfig);
                this._serviceContainer.registerInstance(DebugConfigService, configService);
                this._serviceContainer.registerSingleton(DebugManager, (c) => createInstance(DebugManager, c));
                this._debugManager = this._serviceContainer.resolve(DebugManager);
                this._debugManager.onInitialize();
            }
            this.initialize();
        }
        /**
         * 获取核心实例
         *
         * @returns 全局核心实例
         */
        static get Instance() {
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
        static get services() {
            if (!this._instance) {
                throw new Error('Core实例未创建，请先调用Core.create()');
            }
            return this._instance._serviceContainer;
        }
        /**
         * 获取World管理器
         *
         * 用于管理多个独立的World实例（高级用户）。
         *
         * @returns WorldManager实例
         * @throws 如果Core实例未创建
         *
         * @example
         * ```typescript
         * // 创建多个游戏房间
         * const wm = Core.worldManager;
         * const room1 = wm.createWorld('room_001');
         * room1.createScene('game', new GameScene());
         * room1.start();
         * ```
         */
        static get worldManager() {
            if (!this._instance) {
                throw new Error('Core实例未创建，请先调用Core.create()');
            }
            return this._instance._worldManager;
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
        static create(config = true) {
            if (this._instance == null) {
                // 向后兼容：如果传入boolean，转换为配置对象
                const coreConfig = typeof config === 'boolean'
                    ? { debug: config, enableEntitySystems: true }
                    : config;
                this._instance = new Core(coreConfig);
            }
            else {
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
        static setScene(scene) {
            if (!this._instance) {
                Core._logger.warn('Core实例未创建，请先调用Core.create()');
                throw new Error('Core实例未创建');
            }
            return this._instance._sceneManager.setScene(scene);
        }
        /**
         * 获取当前场景
         *
         * @returns 当前场景，如果没有场景则返回null
         */
        static get scene() {
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
        static get ecsAPI() {
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
        static loadScene(scene) {
            if (!this._instance) {
                Core._logger.warn('Core实例未创建，请先调用Core.create()');
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
        static update(deltaTime) {
            if (!this._instance) {
                Core._logger.warn('Core实例未创建，请先调用Core.create()');
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
        static schedule(timeInSeconds, repeats = false, context, onTime) {
            if (!this._instance) {
                throw new Error('Core实例未创建，请先调用Core.create()');
            }
            if (!onTime) {
                throw new Error('onTime callback is required');
            }
            return this._instance._timerManager.schedule(timeInSeconds, repeats, context, onTime);
        }
        /**
         * 启用调试功能
         *
         * @param config 调试配置
         */
        static enableDebug(config) {
            if (!this._instance) {
                Core._logger.warn('Core实例未创建，请先调用Core.create()');
                return;
            }
            if (this._instance._debugManager) {
                this._instance._debugManager.updateConfig(config);
            }
            else {
                const configService = new DebugConfigService();
                configService.setConfig(config);
                this._instance._serviceContainer.registerInstance(DebugConfigService, configService);
                this._instance._serviceContainer.registerSingleton(DebugManager, (c) => createInstance(DebugManager, c));
                this._instance._debugManager = this._instance._serviceContainer.resolve(DebugManager);
                this._instance._debugManager.onInitialize();
            }
            // 更新Core配置
            this._instance._config.debugConfig = config;
        }
        /**
         * 禁用调试功能
         */
        static disableDebug() {
            if (!this._instance)
                return;
            if (this._instance._debugManager) {
                this._instance._debugManager.stop();
                delete this._instance._debugManager;
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
        static getDebugData() {
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
        static get isDebugEnabled() {
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
        static async installPlugin(plugin) {
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
        static async uninstallPlugin(name) {
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
        static getPlugin(name) {
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
        static isPluginInstalled(name) {
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
        initialize() {
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
        updateInternal(deltaTime) {
            if (Core.paused)
                return;
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
            // 更新默认场景（通过 SceneManager）
            this._sceneManager.update();
            // 更新额外的 WorldManager
            this._worldManager.updateAll();
            // 结束性能监控
            this._performanceMonitor.endMonitoring('Core.update', frameStartTime);
        }
        /**
         * 销毁Core实例
         *
         * 清理所有资源，通常在应用程序关闭时调用。
         */
        static destroy() {
            if (!this._instance)
                return;
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
    /**
     * 游戏暂停状态
     *
     * 当设置为true时，游戏循环将暂停执行。
     */
    Core.paused = false;
    /**
     * 全局核心实例
     *
     * 可能为null表示Core尚未初始化或已被销毁
     */
    Core._instance = null;
    /**
     * Core专用日志器
     */
    Core._logger = createLogger('Core');

    const logger = createLogger('DebugPlugin');
    /**
     * ECS 调试插件
     *
     * 提供运行时调试功能：
     * - 实时查看实体和组件信息
     * - System 执行统计
     * - 性能监控
     * - 实体查询
     *
     * @example
     * ```typescript
     * const core = Core.create();
     * const debugPlugin = new DebugPlugin({ autoStart: true, updateInterval: 1000 });
     * await core.pluginManager.install(debugPlugin);
     *
     * // 获取调试信息
     * const stats = debugPlugin.getStats();
     * console.log('Total entities:', stats.totalEntities);
     *
     * // 查询实体
     * const entities = debugPlugin.queryEntities({ tag: 1 });
     * ```
     */
    let DebugPlugin = class DebugPlugin {
        /**
         * 创建调试插件实例
         *
         * @param options - 配置选项
         */
        constructor(options) {
            this.name = '@esengine/debug-plugin';
            this.version = '1.0.0';
            this.worldManager = null;
            this.updateTimer = null;
            this.autoStart = options?.autoStart ?? false;
            this.updateInterval = options?.updateInterval ?? 1000;
        }
        /**
         * 安装插件
         */
        async install(_core, services) {
            this.worldManager = services.resolve(WorldManager);
            logger.info('ECS Debug Plugin installed');
            if (this.autoStart) {
                this.start();
            }
        }
        /**
         * 卸载插件
         */
        async uninstall() {
            this.stop();
            this.worldManager = null;
            logger.info('ECS Debug Plugin uninstalled');
        }
        /**
         * 实现 IService 接口
         */
        dispose() {
            this.stop();
            this.worldManager = null;
        }
        /**
         * 启动调试监控
         */
        start() {
            if (this.updateTimer) {
                logger.warn('Debug monitoring already started');
                return;
            }
            logger.info('Starting debug monitoring');
            this.updateTimer = setInterval(() => {
                this.logStats();
            }, this.updateInterval);
        }
        /**
         * 停止调试监控
         */
        stop() {
            if (this.updateTimer) {
                clearInterval(this.updateTimer);
                this.updateTimer = null;
                logger.info('Debug monitoring stopped');
            }
        }
        /**
         * 获取当前 ECS 统计信息
         */
        getStats() {
            if (!this.worldManager) {
                throw new Error('Plugin not installed');
            }
            const scenes = [];
            let totalEntities = 0;
            let totalSystems = 0;
            const worlds = this.worldManager.getAllWorlds();
            for (const world of worlds) {
                for (const scene of world.getAllScenes()) {
                    const sceneInfo = this.getSceneInfo(scene);
                    scenes.push(sceneInfo);
                    totalEntities += sceneInfo.entityCount;
                    totalSystems += sceneInfo.systems.length;
                }
            }
            return {
                scenes,
                totalEntities,
                totalSystems,
                timestamp: Date.now()
            };
        }
        /**
         * 获取场景调试信息
         */
        getSceneInfo(scene) {
            const entities = scene.entities.buffer;
            const systems = scene.systems;
            return {
                name: scene.name,
                entityCount: entities.length,
                systems: systems.map((sys) => this.getSystemInfo(sys)),
                entities: entities.map((entity) => this.getEntityInfo(entity))
            };
        }
        /**
         * 获取系统调试信息
         */
        getSystemInfo(system) {
            const perfStats = system.getPerformanceStats();
            const performance = perfStats ? {
                avgExecutionTime: perfStats.averageTime,
                maxExecutionTime: perfStats.maxTime,
                totalCalls: perfStats.executionCount
            } : undefined;
            return {
                name: system.constructor.name,
                enabled: system.enabled,
                updateOrder: system.updateOrder,
                entityCount: system.entities.length,
                ...(performance !== undefined && { performance })
            };
        }
        /**
         * 获取实体调试信息
         */
        getEntityInfo(entity) {
            const components = entity.components;
            return {
                id: entity.id,
                name: entity.name,
                enabled: entity.enabled,
                tag: entity.tag,
                componentCount: components.length,
                components: components.map((comp) => this.getComponentInfo(comp))
            };
        }
        /**
         * 获取组件调试信息
         */
        getComponentInfo(component) {
            const type = component.constructor.name;
            const data = {};
            for (const key of Object.keys(component)) {
                if (!key.startsWith('_')) {
                    const value = component[key];
                    if (typeof value !== 'function') {
                        data[key] = value;
                    }
                }
            }
            return { type, data };
        }
        /**
         * 查询实体
         *
         * @param filter - 查询过滤器
         */
        queryEntities(filter) {
            if (!this.worldManager) {
                throw new Error('Plugin not installed');
            }
            const results = [];
            const worlds = this.worldManager.getAllWorlds();
            for (const world of worlds) {
                for (const scene of world.getAllScenes()) {
                    if (filter.sceneName && scene.name !== filter.sceneName) {
                        continue;
                    }
                    for (const entity of scene.entities.buffer) {
                        if (filter.tag !== undefined && entity.tag !== filter.tag) {
                            continue;
                        }
                        if (filter.name && !entity.name.includes(filter.name)) {
                            continue;
                        }
                        if (filter.hasComponent) {
                            const hasComp = entity.components.some((c) => c.constructor.name === filter.hasComponent);
                            if (!hasComp) {
                                continue;
                            }
                        }
                        results.push(this.getEntityInfo(entity));
                    }
                }
            }
            return results;
        }
        /**
         * 打印统计信息到日志
         */
        logStats() {
            const stats = this.getStats();
            logger.info('=== ECS Debug Stats ===');
            logger.info(`Total Entities: ${stats.totalEntities}`);
            logger.info(`Total Systems: ${stats.totalSystems}`);
            logger.info(`Scenes: ${stats.scenes.length}`);
            for (const scene of stats.scenes) {
                logger.info(`\n[Scene: ${scene.name}]`);
                logger.info(`  Entities: ${scene.entityCount}`);
                logger.info(`  Systems: ${scene.systems.length}`);
                for (const system of scene.systems) {
                    const perfStr = system.performance
                        ? ` | Avg: ${system.performance.avgExecutionTime.toFixed(2)}ms, Max: ${system.performance.maxExecutionTime.toFixed(2)}ms`
                        : '';
                    logger.info(`    - ${system.name} (${system.enabled ? 'enabled' : 'disabled'}) | Entities: ${system.entityCount}${perfStr}`);
                }
            }
            logger.info('========================\n');
        }
        /**
         * 导出调试数据为 JSON
         */
        exportJSON() {
            const stats = this.getStats();
            return JSON.stringify(stats, null, 2);
        }
    };
    DebugPlugin = __decorate$2([
        Injectable(),
        __metadata$2("design:paramtypes", [Object])
    ], DebugPlugin);

    /**
     * 游戏组件基类
     *
     * ECS架构中的组件（Component）应该是纯数据容器。
     * 所有游戏逻辑应该在 EntitySystem 中实现，而不是在组件内部。
     *
     * @example
     * 推荐做法：纯数据组件
     * ```typescript
     * class HealthComponent extends Component {
     *     public health: number = 100;
     *     public maxHealth: number = 100;
     * }
     * ```
     *
     * @example
     * 推荐做法：在 System 中处理逻辑
     * ```typescript
     * class HealthSystem extends EntitySystem {
     *     process(entities: Entity[]): void {
     *         for (const entity of entities) {
     *             const health = entity.getComponent(HealthComponent);
     *             if (health && health.health <= 0) {
     *                 entity.destroy();
     *             }
     *         }
     *     }
     * }
     * ```
     */
    class Component {
        /**
         * 创建组件实例
         *
         * 自动分配唯一ID给组件。
         */
        constructor() {
            /**
             * 所属实体ID
             *
             * 存储实体ID而非引用，避免循环引用，符合ECS数据导向设计。
             */
            this.entityId = null;
            this.id = Component.idGenerator++;
        }
        /**
         * 组件添加到实体时的回调
         *
         * 当组件被添加到实体时调用，可以在此方法中进行初始化操作。
         *
         * @remarks
         * 这是一个生命周期钩子，用于组件的初始化逻辑。
         * 虽然保留此方法，但建议将复杂的初始化逻辑放在 System 中处理。
         */
        onAddedToEntity() { }
        /**
         * 组件从实体移除时的回调
         *
         * 当组件从实体中移除时调用，可以在此方法中进行清理操作。
         *
         * @remarks
         * 这是一个生命周期钩子，用于组件的清理逻辑。
         * 虽然保留此方法，但建议将复杂的清理逻辑放在 System 中处理。
         */
        onRemovedFromEntity() { }
    }
    /**
     * 组件ID生成器
     *
     * 用于为每个组件分配唯一的ID。
     */
    Component.idGenerator = 0;
    __decorate$2([
        Int32,
        __metadata$2("design:type", Object)
    ], Component.prototype, "entityId", void 0);

    /**
     * ECS事件类型枚举
     * 定义实体组件系统中的所有事件类型
     */
    var ECSEventType;
    (function (ECSEventType) {
        // 实体相关事件
        ECSEventType["ENTITY_CREATED"] = "entity:created";
        ECSEventType["ENTITY_DESTROYED"] = "entity:destroyed";
        ECSEventType["ENTITY_ENABLED"] = "entity:enabled";
        ECSEventType["ENTITY_DISABLED"] = "entity:disabled";
        ECSEventType["ENTITY_TAG_ADDED"] = "entity:tag:added";
        ECSEventType["ENTITY_TAG_REMOVED"] = "entity:tag:removed";
        ECSEventType["ENTITY_NAME_CHANGED"] = "entity:name:changed";
        // 组件相关事件
        ECSEventType["COMPONENT_ADDED"] = "component:added";
        ECSEventType["COMPONENT_REMOVED"] = "component:removed";
        ECSEventType["COMPONENT_MODIFIED"] = "component:modified";
        ECSEventType["COMPONENT_ENABLED"] = "component:enabled";
        ECSEventType["COMPONENT_DISABLED"] = "component:disabled";
        // 系统相关事件
        ECSEventType["SYSTEM_ADDED"] = "system:added";
        ECSEventType["SYSTEM_REMOVED"] = "system:removed";
        ECSEventType["SYSTEM_ENABLED"] = "system:enabled";
        ECSEventType["SYSTEM_DISABLED"] = "system:disabled";
        ECSEventType["SYSTEM_PROCESSING_START"] = "system:processing:start";
        ECSEventType["SYSTEM_PROCESSING_END"] = "system:processing:end";
        ECSEventType["SYSTEM_ERROR"] = "system:error";
        // 场景相关事件
        ECSEventType["SCENE_CREATED"] = "scene:created";
        ECSEventType["SCENE_DESTROYED"] = "scene:destroyed";
        ECSEventType["SCENE_ACTIVATED"] = "scene:activated";
        ECSEventType["SCENE_DEACTIVATED"] = "scene:deactivated";
        ECSEventType["SCENE_PAUSED"] = "scene:paused";
        ECSEventType["SCENE_RESUMED"] = "scene:resumed";
        // 查询相关事件
        ECSEventType["QUERY_EXECUTED"] = "query:executed";
        ECSEventType["QUERY_CACHE_HIT"] = "query:cache:hit";
        ECSEventType["QUERY_CACHE_MISS"] = "query:cache:miss";
        ECSEventType["QUERY_OPTIMIZED"] = "query:optimized";
        // 性能相关事件
        ECSEventType["PERFORMANCE_WARNING"] = "performance:warning";
        ECSEventType["PERFORMANCE_CRITICAL"] = "performance:critical";
        ECSEventType["MEMORY_USAGE_HIGH"] = "memory:usage:high";
        ECSEventType["FRAME_RATE_DROP"] = "frame:rate:drop";
        // 索引相关事件
        ECSEventType["INDEX_CREATED"] = "index:created";
        ECSEventType["INDEX_UPDATED"] = "index:updated";
        ECSEventType["INDEX_OPTIMIZED"] = "index:optimized";
        // Archetype相关事件
        ECSEventType["ARCHETYPE_CREATED"] = "archetype:created";
        ECSEventType["ARCHETYPE_ENTITY_ADDED"] = "archetype:entity:added";
        ECSEventType["ARCHETYPE_ENTITY_REMOVED"] = "archetype:entity:removed";
        // 脏标记相关事件
        ECSEventType["DIRTY_MARK_ADDED"] = "dirty:mark:added";
        ECSEventType["DIRTY_BATCH_PROCESSED"] = "dirty:batch:processed";
        // 错误和警告事件
        ECSEventType["ERROR_OCCURRED"] = "error:occurred";
        ECSEventType["WARNING_ISSUED"] = "warning:issued";
        // 生命周期事件
        ECSEventType["FRAMEWORK_INITIALIZED"] = "framework:initialized";
        ECSEventType["FRAMEWORK_SHUTDOWN"] = "framework:shutdown";
        // 调试相关事件
        ECSEventType["DEBUG_INFO"] = "debug:info";
        ECSEventType["DEBUG_STATS_UPDATED"] = "debug:stats:updated";
    })(ECSEventType || (ECSEventType = {}));
    /**
     * 事件优先级枚举
     * 定义事件处理的优先级级别
     */
    var EventPriority;
    (function (EventPriority) {
        EventPriority[EventPriority["LOWEST"] = 0] = "LOWEST";
        EventPriority[EventPriority["LOW"] = 25] = "LOW";
        EventPriority[EventPriority["NORMAL"] = 50] = "NORMAL";
        EventPriority[EventPriority["HIGH"] = 75] = "HIGH";
        EventPriority[EventPriority["HIGHEST"] = 100] = "HIGHEST";
        EventPriority[EventPriority["CRITICAL"] = 200] = "CRITICAL";
    })(EventPriority || (EventPriority = {}));
    /**
     * 预定义的事件类型常量
     * 提供类型安全的事件类型字符串
     */
    const EVENT_TYPES = {
        // 实体事件
        ENTITY: {
            CREATED: ECSEventType.ENTITY_CREATED,
            DESTROYED: ECSEventType.ENTITY_DESTROYED,
            ENABLED: ECSEventType.ENTITY_ENABLED,
            DISABLED: ECSEventType.ENTITY_DISABLED,
            TAG_ADDED: ECSEventType.ENTITY_TAG_ADDED,
            TAG_REMOVED: ECSEventType.ENTITY_TAG_REMOVED,
            NAME_CHANGED: ECSEventType.ENTITY_NAME_CHANGED
        },
        // 组件事件
        COMPONENT: {
            ADDED: ECSEventType.COMPONENT_ADDED,
            REMOVED: ECSEventType.COMPONENT_REMOVED,
            MODIFIED: ECSEventType.COMPONENT_MODIFIED,
            ENABLED: ECSEventType.COMPONENT_ENABLED,
            DISABLED: ECSEventType.COMPONENT_DISABLED
        },
        // 系统事件
        SYSTEM: {
            ADDED: ECSEventType.SYSTEM_ADDED,
            REMOVED: ECSEventType.SYSTEM_REMOVED,
            ENABLED: ECSEventType.SYSTEM_ENABLED,
            DISABLED: ECSEventType.SYSTEM_DISABLED,
            PROCESSING_START: ECSEventType.SYSTEM_PROCESSING_START,
            PROCESSING_END: ECSEventType.SYSTEM_PROCESSING_END,
            ERROR: ECSEventType.SYSTEM_ERROR
        },
        // 性能事件
        PERFORMANCE: {
            WARNING: ECSEventType.PERFORMANCE_WARNING,
            CRITICAL: ECSEventType.PERFORMANCE_CRITICAL,
            MEMORY_HIGH: ECSEventType.MEMORY_USAGE_HIGH,
            FRAME_DROP: ECSEventType.FRAME_RATE_DROP
        }
    };
    new Set([
        ...Object.values(ECSEventType),
        ...Object.values(EVENT_TYPES.ENTITY),
        ...Object.values(EVENT_TYPES.COMPONENT),
        ...Object.values(EVENT_TYPES.SYSTEM),
        ...Object.values(EVENT_TYPES.PERFORMANCE)
    ]);

    createLogger('EventBus');

    /**
     * Main bridge between TypeScript ECS and Rust Engine.
     * TypeScript ECS与Rust引擎之间的主桥接层。
     */
    /**
     * Bridge for communication between ECS Framework and Rust Engine.
     * ECS框架与Rust引擎之间的通信桥接。
     *
     * This class manages data transfer between the TypeScript ECS layer
     * and the WebAssembly-based Rust rendering engine.
     * 此类管理TypeScript ECS层与基于WebAssembly的Rust渲染引擎之间的数据传输。
     *
     * @example
     * ```typescript
     * const bridge = new EngineBridge({ canvasId: 'game-canvas' });
     * await bridge.initialize();
     *
     * // In game loop | 在游戏循环中
     * bridge.clear(0, 0, 0, 1);
     * bridge.submitSprites(spriteDataArray);
     * bridge.render();
     * ```
     */
    class EngineBridge {
        /**
         * Create a new engine bridge.
         * 创建新的引擎桥接。
         *
         * @param config - Bridge configuration | 桥接配置
         */
        constructor(config) {
            this.engine = null;
            this.initialized = false;
            // Statistics | 统计信息
            this.stats = {
                fps: 0,
                drawCalls: 0,
                spriteCount: 0,
                frameTime: 0
            };
            this.lastFrameTime = 0;
            this.frameCount = 0;
            this.fpsAccumulator = 0;
            this.debugLogged = false;
            this.config = {
                canvasId: config.canvasId,
                width: config.width ?? 800,
                height: config.height ?? 600,
                maxSprites: config.maxSprites ?? 10000,
                debug: config.debug ?? false
            };
            // Pre-allocate buffers | 预分配缓冲区
            const maxSprites = this.config.maxSprites;
            this.transformBuffer = new Float32Array(maxSprites * 7); // x, y, rot, sx, sy, ox, oy
            this.textureIdBuffer = new Uint32Array(maxSprites);
            this.uvBuffer = new Float32Array(maxSprites * 4); // u0, v0, u1, v1
            this.colorBuffer = new Uint32Array(maxSprites);
        }
        /**
         * Initialize the engine bridge with WASM module.
         * 使用WASM模块初始化引擎桥接。
         *
         * @param wasmModule - Pre-imported WASM module | 预导入的WASM模块
         */
        async initializeWithModule(wasmModule) {
            if (this.initialized) {
                console.warn('EngineBridge already initialized | EngineBridge已初始化');
                return;
            }
            try {
                // Initialize WASM | 初始化WASM
                if (wasmModule.default) {
                    await wasmModule.default();
                }
                // Create engine instance | 创建引擎实例
                this.engine = new wasmModule.GameEngine(this.config.canvasId);
                this.initialized = true;
                if (this.config.debug) {
                    console.log('EngineBridge initialized | EngineBridge初始化完成');
                }
            }
            catch (error) {
                throw new Error(`Failed to initialize engine: ${error} | 引擎初始化失败: ${error}`);
            }
        }
        /**
         * Initialize the engine bridge.
         * 初始化引擎桥接。
         *
         * Loads the WASM module and creates the engine instance.
         * 加载WASM模块并创建引擎实例。
         *
         * @param wasmPath - Path to WASM package | WASM包路径
         * @deprecated Use initializeWithModule instead | 请使用 initializeWithModule 代替
         */
        async initialize(wasmPath = '@esengine/engine') {
            if (this.initialized) {
                console.warn('EngineBridge already initialized | EngineBridge已初始化');
                return;
            }
            try {
                // Dynamic import of WASM module | 动态导入WASM模块
                const wasmModule = await import(/* @vite-ignore */ wasmPath);
                await this.initializeWithModule(wasmModule);
            }
            catch (error) {
                throw new Error(`Failed to initialize engine: ${error} | 引擎初始化失败: ${error}`);
            }
        }
        /**
         * Check if bridge is initialized.
         * 检查桥接是否已初始化。
         */
        get isInitialized() {
            return this.initialized;
        }
        /**
         * Get canvas width.
         * 获取画布宽度。
         */
        get width() {
            return this.engine?.width ?? 0;
        }
        /**
         * Get canvas height.
         * 获取画布高度。
         */
        get height() {
            return this.engine?.height ?? 0;
        }
        /**
         * Get engine instance (throws if not initialized)
         * 获取引擎实例（未初始化时抛出异常）
         */
        getEngine() {
            if (!this.engine) {
                throw new Error('Engine not initialized. Call initialize() first.');
            }
            return this.engine;
        }
        /**
         * Clear the screen.
         * 清除屏幕。
         *
         * @param r - Red (0-1) | 红色
         * @param g - Green (0-1) | 绿色
         * @param b - Blue (0-1) | 蓝色
         * @param a - Alpha (0-1) | 透明度
         */
        clear(r, g, b, a) {
            if (!this.initialized)
                return;
            this.getEngine().clear(r, g, b, a);
        }
        /**
         * Submit sprite data for rendering.
         * 提交精灵数据进行渲染。
         *
         * @param sprites - Array of sprite render data | 精灵渲染数据数组
         */
        submitSprites(sprites) {
            if (!this.initialized || sprites.length === 0)
                return;
            const count = Math.min(sprites.length, this.config.maxSprites);
            // Fill typed arrays | 填充类型数组
            for (let i = 0; i < count; i++) {
                const sprite = sprites[i];
                const tOffset = i * 7;
                const uvOffset = i * 4;
                // Transform data | 变换数据
                this.transformBuffer[tOffset] = sprite.x;
                this.transformBuffer[tOffset + 1] = sprite.y;
                this.transformBuffer[tOffset + 2] = sprite.rotation;
                this.transformBuffer[tOffset + 3] = sprite.scaleX;
                this.transformBuffer[tOffset + 4] = sprite.scaleY;
                this.transformBuffer[tOffset + 5] = sprite.originX;
                this.transformBuffer[tOffset + 6] = sprite.originY;
                // Texture ID | 纹理ID
                this.textureIdBuffer[i] = sprite.textureId;
                // UV coordinates | UV坐标
                this.uvBuffer[uvOffset] = sprite.uv[0];
                this.uvBuffer[uvOffset + 1] = sprite.uv[1];
                this.uvBuffer[uvOffset + 2] = sprite.uv[2];
                this.uvBuffer[uvOffset + 3] = sprite.uv[3];
                // Color | 颜色
                this.colorBuffer[i] = sprite.color;
            }
            // Debug: log texture IDs only once when we have 2+ sprites (for multi-texture test)
            if (!this.debugLogged && count >= 2) {
                const textureIds = Array.from(this.textureIdBuffer.subarray(0, count));
                console.log(`TS submitSprites: ${count} sprites, textureIds: [${textureIds.join(', ')}]`);
                this.debugLogged = true;
            }
            // Submit to engine (single WASM call) | 提交到引擎（单次WASM调用）
            this.getEngine().submitSpriteBatch(this.transformBuffer.subarray(0, count * 7), this.textureIdBuffer.subarray(0, count), this.uvBuffer.subarray(0, count * 4), this.colorBuffer.subarray(0, count));
            this.stats.spriteCount = count;
        }
        /**
         * Render the current frame.
         * 渲染当前帧。
         */
        render() {
            if (!this.initialized)
                return;
            const startTime = performance.now();
            this.getEngine().render();
            const endTime = performance.now();
            // Update statistics | 更新统计信息
            this.stats.frameTime = endTime - startTime;
            this.stats.drawCalls = 1; // Currently single batch | 当前单批次
            // Calculate FPS | 计算FPS
            this.frameCount++;
            this.fpsAccumulator += endTime - this.lastFrameTime;
            this.lastFrameTime = endTime;
            if (this.fpsAccumulator >= 1000) {
                this.stats.fps = this.frameCount;
                this.frameCount = 0;
                this.fpsAccumulator = 0;
            }
        }
        /**
         * Load a texture.
         * 加载纹理。
         *
         * @param id - Texture ID | 纹理ID
         * @param url - Image URL | 图片URL
         */
        loadTexture(id, url) {
            if (!this.initialized)
                return Promise.resolve();
            this.getEngine().loadTexture(id, url);
            // Currently synchronous, but return Promise for interface compatibility
            // 目前是同步的，但返回Promise以兼容接口
            return Promise.resolve();
        }
        /**
         * Load multiple textures.
         * 加载多个纹理。
         *
         * @param requests - Texture load requests | 纹理加载请求
         */
        async loadTextures(requests) {
            for (const req of requests) {
                await this.loadTexture(req.id, req.url);
            }
        }
        /**
         * Unload texture from GPU.
         * 从GPU卸载纹理。
         *
         * @param id - Texture ID | 纹理ID
         */
        unloadTexture(id) {
            if (!this.initialized)
                return;
            // TODO: Implement in Rust engine
            // TODO: 在Rust引擎中实现
            console.warn('unloadTexture not yet implemented in engine');
        }
        /**
         * Get texture information.
         * 获取纹理信息。
         *
         * @param id - Texture ID | 纹理ID
         */
        getTextureInfo(id) {
            if (!this.initialized)
                return null;
            // TODO: Implement in Rust engine
            // TODO: 在Rust引擎中实现
            // Return default values for now / 暂时返回默认值
            return { width: 64, height: 64 };
        }
        /**
         * Check if a key is pressed.
         * 检查按键是否按下。
         *
         * @param keyCode - Key code | 键码
         */
        isKeyDown(keyCode) {
            if (!this.initialized)
                return false;
            return this.getEngine().isKeyDown(keyCode);
        }
        /**
         * Update input state (call once per frame).
         * 更新输入状态（每帧调用一次）。
         */
        updateInput() {
            if (!this.initialized)
                return;
            this.getEngine().updateInput();
        }
        /**
         * Get engine statistics.
         * 获取引擎统计信息。
         */
        getStats() {
            return { ...this.stats };
        }
        /**
         * Resize the viewport.
         * 调整视口大小。
         *
         * @param width - New width | 新宽度
         * @param height - New height | 新高度
         */
        resize(width, height) {
            if (!this.initialized)
                return;
            const engine = this.getEngine();
            if (engine.resize) {
                engine.resize(width, height);
            }
        }
        /**
         * Set camera position, zoom, and rotation.
         * 设置相机位置、缩放和旋转。
         *
         * @param config - Camera configuration | 相机配置
         */
        setCamera(config) {
            if (!this.initialized)
                return;
            this.getEngine().setCamera(config.x, config.y, config.zoom, config.rotation);
        }
        /**
         * Get camera state.
         * 获取相机状态。
         */
        getCamera() {
            if (!this.initialized) {
                return { x: 0, y: 0, zoom: 1, rotation: 0 };
            }
            const state = this.getEngine().getCamera();
            return {
                x: state[0],
                y: state[1],
                zoom: state[2],
                rotation: state[3]
            };
        }
        /**
         * Set grid visibility.
         * 设置网格可见性。
         */
        setShowGrid(show) {
            if (!this.initialized)
                return;
            this.getEngine().setShowGrid(show);
        }
        /**
         * Set clear color (background color).
         * 设置清除颜色（背景颜色）。
         *
         * @param r - Red component (0.0-1.0) | 红色分量
         * @param g - Green component (0.0-1.0) | 绿色分量
         * @param b - Blue component (0.0-1.0) | 蓝色分量
         * @param a - Alpha component (0.0-1.0) | 透明度分量
         */
        setClearColor(r, g, b, a) {
            if (!this.initialized)
                return;
            this.getEngine().setClearColor(r, g, b, a);
        }
        /**
         * Add a rectangle gizmo outline.
         * 添加矩形Gizmo边框。
         *
         * @param x - Center X position | 中心X位置
         * @param y - Center Y position | 中心Y位置
         * @param width - Rectangle width | 矩形宽度
         * @param height - Rectangle height | 矩形高度
         * @param rotation - Rotation in radians | 旋转角度（弧度）
         * @param originX - Origin X (0-1) | 原点X (0-1)
         * @param originY - Origin Y (0-1) | 原点Y (0-1)
         * @param r - Red (0-1) | 红色
         * @param g - Green (0-1) | 绿色
         * @param b - Blue (0-1) | 蓝色
         * @param a - Alpha (0-1) | 透明度
         * @param showHandles - Whether to show transform handles | 是否显示变换手柄
         */
        addGizmoRect(x, y, width, height, rotation, originX, originY, r, g, b, a, showHandles = true) {
            if (!this.initialized)
                return;
            this.getEngine().addGizmoRect(x, y, width, height, rotation, originX, originY, r, g, b, a, showHandles);
        }
        /**
         * Set transform tool mode.
         * 设置变换工具模式。
         *
         * @param mode - 0=Select, 1=Move, 2=Rotate, 3=Scale
         */
        setTransformMode(mode) {
            if (!this.initialized)
                return;
            this.getEngine().setTransformMode(mode);
        }
        /**
         * Set gizmo visibility.
         * 设置辅助工具可见性。
         */
        setShowGizmos(show) {
            if (!this.initialized)
                return;
            this.getEngine().setShowGizmos(show);
        }
        // ===== Multi-viewport API =====
        // ===== 多视口 API =====
        /**
         * Register a new viewport.
         * 注册新视口。
         *
         * @param id - Unique viewport identifier | 唯一视口标识符
         * @param canvasId - HTML canvas element ID | HTML canvas元素ID
         */
        registerViewport(id, canvasId) {
            if (!this.initialized)
                return;
            this.getEngine().registerViewport(id, canvasId);
        }
        /**
         * Unregister a viewport.
         * 注销视口。
         */
        unregisterViewport(id) {
            if (!this.initialized)
                return;
            this.getEngine().unregisterViewport(id);
        }
        /**
         * Set the active viewport.
         * 设置活动视口。
         */
        setActiveViewport(id) {
            if (!this.initialized)
                return false;
            return this.getEngine().setActiveViewport(id);
        }
        /**
         * Set camera for a specific viewport.
         * 为特定视口设置相机。
         */
        setViewportCamera(viewportId, config) {
            if (!this.initialized)
                return;
            this.getEngine().setViewportCamera(viewportId, config.x, config.y, config.zoom, config.rotation);
        }
        /**
         * Get camera for a specific viewport.
         * 获取特定视口的相机。
         */
        getViewportCamera(viewportId) {
            if (!this.initialized)
                return null;
            const state = this.getEngine().getViewportCamera(viewportId);
            if (!state)
                return null;
            return {
                x: state[0],
                y: state[1],
                zoom: state[2],
                rotation: state[3]
            };
        }
        /**
         * Set viewport configuration.
         * 设置视口配置。
         */
        setViewportConfig(viewportId, showGrid, showGizmos) {
            if (!this.initialized)
                return;
            this.getEngine().setViewportConfig(viewportId, showGrid, showGizmos);
        }
        /**
         * Resize a specific viewport.
         * 调整特定视口大小。
         */
        resizeViewport(viewportId, width, height) {
            if (!this.initialized)
                return;
            this.getEngine().resizeViewport(viewportId, width, height);
        }
        /**
         * Render to a specific viewport.
         * 渲染到特定视口。
         */
        renderToViewport(viewportId) {
            if (!this.initialized)
                return;
            this.getEngine().renderToViewport(viewportId);
        }
        /**
         * Get all registered viewport IDs.
         * 获取所有已注册的视口ID。
         */
        getViewportIds() {
            if (!this.initialized)
                return [];
            return this.getEngine().getViewportIds();
        }
        /**
         * Dispose the bridge and release resources.
         * 销毁桥接并释放资源。
         */
        dispose() {
            this.engine = null;
            this.initialized = false;
        }
    }

    /**
     * Render batcher for collecting sprite data.
     * 用于收集精灵数据的渲染批处理器。
     */
    /**
     * Collects and sorts sprite render data for batch submission.
     * 收集和排序精灵渲染数据用于批量提交。
     *
     * This class is used to collect sprites during the ECS update loop
     * and then submit them all at once to the engine.
     * 此类用于在ECS更新循环中收集精灵，然后一次性提交到引擎。
     *
     * @example
     * ```typescript
     * const batcher = new RenderBatcher();
     *
     * // During ECS update | 在ECS更新期间
     * batcher.addSprite({
     *     x: 100, y: 200,
     *     rotation: 0,
     *     scaleX: 1, scaleY: 1,
     *     originX: 0.5, originY: 0.5,
     *     textureId: 1,
     *     uv: [0, 0, 1, 1],
     *     color: 0xFFFFFFFF
     * });
     *
     * // At end of frame | 在帧结束时
     * bridge.submitSprites(batcher.getSprites());
     * batcher.clear();
     * ```
     */
    class RenderBatcher {
        /**
         * Create a new render batcher.
         * 创建新的渲染批处理器。
         *
         * @param sortByZ - Whether to sort sprites by Z order | 是否按Z顺序排序精灵
         */
        constructor(sortByZ = false) {
            this.sprites = [];
            this.sortByZ = false;
            this.sortByZ = sortByZ;
        }
        /**
         * Add a sprite to the batch.
         * 将精灵添加到批处理。
         *
         * @param sprite - Sprite render data | 精灵渲染数据
         */
        addSprite(sprite) {
            this.sprites.push(sprite);
        }
        /**
         * Add multiple sprites to the batch.
         * 将多个精灵添加到批处理。
         *
         * @param sprites - Array of sprite render data | 精灵渲染数据数组
         */
        addSprites(sprites) {
            this.sprites.push(...sprites);
        }
        /**
         * Get all sprites in the batch.
         * 获取批处理中的所有精灵。
         *
         * @returns Sorted array of sprites | 排序后的精灵数组
         */
        getSprites() {
            // Sort by texture ID for better batching (fewer texture switches)
            // 按纹理ID排序以获得更好的批处理效果（减少纹理切换）
            if (!this.sortByZ) {
                this.sprites.sort((a, b) => a.textureId - b.textureId);
            }
            return this.sprites;
        }
        /**
         * Get sprite count.
         * 获取精灵数量。
         */
        get count() {
            return this.sprites.length;
        }
        /**
         * Clear all sprites from the batch.
         * 清除批处理中的所有精灵。
         */
        clear() {
            this.sprites.length = 0;
        }
        /**
         * Check if batch is empty.
         * 检查批处理是否为空。
         */
        get isEmpty() {
            return this.sprites.length === 0;
        }
    }

    /**
     * 变换组件 - 管理实体的位置、旋转和缩放
     */
    let TransformComponent = class TransformComponent extends Component {
        constructor(x = 0, y = 0, z = 0) {
            super();
            /** 位置 */
            this.position = { x: 0, y: 0, z: 0 };
            /** 旋转（欧拉角，度） */
            this.rotation = { x: 0, y: 0, z: 0 };
            /** 缩放 */
            this.scale = { x: 1, y: 1, z: 1 };
            this.position = { x, y, z };
        }
        /**
         * 设置位置
         */
        setPosition(x, y, z = 0) {
            this.position = { x, y, z };
            return this;
        }
        /**
         * 设置旋转
         */
        setRotation(x, y, z) {
            this.rotation = { x, y, z };
            return this;
        }
        /**
         * 设置缩放
         */
        setScale(x, y, z = 1) {
            this.scale = { x, y, z };
            return this;
        }
    };
    __decorate$2([
        Serialize(),
        Property({ type: 'vector3', label: 'Position' }),
        __metadata$2("design:type", Object)
    ], TransformComponent.prototype, "position", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'vector3', label: 'Rotation' }),
        __metadata$2("design:type", Object)
    ], TransformComponent.prototype, "rotation", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'vector3', label: 'Scale' }),
        __metadata$2("design:type", Object)
    ], TransformComponent.prototype, "scale", void 0);
    TransformComponent = __decorate$2([
        ECSComponent('Transform'),
        Serializable({ version: 1, typeId: 'Transform' }),
        __metadata$2("design:paramtypes", [Number, Number, Number])
    ], TransformComponent);

    /**
     * 精灵组件 - 管理2D图像渲染
     * Sprite component - manages 2D image rendering
     */
    let SpriteComponent = class SpriteComponent extends Component {
        /** 锚点X (0-1) - 别名为originX | Anchor X (0-1) - alias for originX */
        get anchorX() {
            return this.originX;
        }
        set anchorX(value) {
            this.originX = value;
        }
        /** 锚点Y (0-1) - 别名为originY | Anchor Y (0-1) - alias for originY */
        get anchorY() {
            return this.originY;
        }
        set anchorY(value) {
            this.originY = value;
        }
        constructor(texture = '') {
            super();
            /** 纹理路径或资源ID | Texture path or asset ID */
            this.texture = '';
            /**
             * 纹理ID（运行时使用）
             * Texture ID for runtime rendering
             */
            this.textureId = 0;
            /**
             * 精灵宽度（像素）
             * Sprite width in pixels
             */
            this.width = 64;
            /**
             * 精灵高度（像素）
             * Sprite height in pixels
             */
            this.height = 64;
            /**
             * UV坐标 [u0, v0, u1, v1]
             * UV coordinates [u0, v0, u1, v1]
             * 默认为完整纹理 [0, 0, 1, 1]
             * Default is full texture [0, 0, 1, 1]
             */
            this.uv = [0, 0, 1, 1];
            /** 颜色（十六进制）| Color (hex string) */
            this.color = '#ffffff';
            /** 透明度 (0-1) | Alpha (0-1) */
            this.alpha = 1;
            /**
             * 原点X (0-1, 0.5为中心)
             * Origin point X (0-1, where 0.5 is center)
             */
            this.originX = 0.5;
            /**
             * 原点Y (0-1, 0.5为中心)
             * Origin point Y (0-1, where 0.5 is center)
             */
            this.originY = 0.5;
            /**
             * 精灵是否可见
             * Whether sprite is visible
             */
            this.visible = true;
            /** 是否水平翻转 | Flip sprite horizontally */
            this.flipX = false;
            /** 是否垂直翻转 | Flip sprite vertically */
            this.flipY = false;
            /**
             * 渲染层级/顺序（越高越在上面）
             * Render layer/order (higher = rendered on top)
             */
            this.sortingOrder = 0;
            this.texture = texture;
        }
        /**
         * 从精灵图集区域设置UV
         * Set UV from a sprite atlas region
         *
         * @param x - 区域X（像素）| Region X in pixels
         * @param y - 区域Y（像素）| Region Y in pixels
         * @param w - 区域宽度（像素）| Region width in pixels
         * @param h - 区域高度（像素）| Region height in pixels
         * @param atlasWidth - 图集总宽度 | Atlas total width
         * @param atlasHeight - 图集总高度 | Atlas total height
         */
        setAtlasRegion(x, y, w, h, atlasWidth, atlasHeight) {
            this.uv = [
                x / atlasWidth,
                y / atlasHeight,
                (x + w) / atlasWidth,
                (y + h) / atlasHeight
            ];
            this.width = w;
            this.height = h;
        }
        /**
         * 设置资产引用
         * Set asset reference
         */
        setAssetReference(reference) {
            // 释放旧引用 / Release old reference
            if (this._assetReference) {
                this._assetReference.release();
            }
            this._assetReference = reference;
            if (reference) {
                this.assetGuid = reference.guid;
            }
        }
        /**
         * 获取资产引用
         * Get asset reference
         */
        getAssetReference() {
            return this._assetReference;
        }
        /**
         * 异步加载纹理
         * Load texture asynchronously
         */
        async loadTextureAsync() {
            if (this._assetReference) {
                try {
                    const textureAsset = await this._assetReference.loadAsync();
                    // 如果纹理资产有 textureId 属性，使用它
                    // If texture asset has textureId property, use it
                    if (textureAsset && typeof textureAsset === 'object' && 'textureId' in textureAsset) {
                        this.textureId = textureAsset.textureId;
                    }
                }
                catch (error) {
                    console.error('Failed to load texture:', error);
                }
            }
        }
        /**
         * 获取有效的纹理源
         * Get effective texture source
         */
        getTextureSource() {
            return this.assetGuid || this.texture;
        }
        /**
         * 组件销毁时调用
         * Called when component is destroyed
         */
        onDestroy() {
            // 释放资产引用 / Release asset reference
            if (this._assetReference) {
                this._assetReference.release();
                this._assetReference = undefined;
            }
        }
    };
    __decorate$2([
        Serialize(),
        Property({ type: 'asset', label: 'Texture', fileExtension: '.png' }),
        __metadata$2("design:type", String)
    ], SpriteComponent.prototype, "texture", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", String)
    ], SpriteComponent.prototype, "assetGuid", void 0);
    __decorate$2([
        Serialize(),
        Property({
            type: 'number',
            label: 'Width',
            min: 0,
            actions: [{
                    id: 'nativeSize',
                    label: 'Native',
                    tooltip: 'Set to texture native size',
                    icon: 'Maximize2'
                }]
        }),
        __metadata$2("design:type", Number)
    ], SpriteComponent.prototype, "width", void 0);
    __decorate$2([
        Serialize(),
        Property({
            type: 'number',
            label: 'Height',
            min: 0,
            actions: [{
                    id: 'nativeSize',
                    label: 'Native',
                    tooltip: 'Set to texture native size',
                    icon: 'Maximize2'
                }]
        }),
        __metadata$2("design:type", Number)
    ], SpriteComponent.prototype, "height", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Array)
    ], SpriteComponent.prototype, "uv", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'color', label: 'Color' }),
        __metadata$2("design:type", String)
    ], SpriteComponent.prototype, "color", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Alpha', min: 0, max: 1, step: 0.01 }),
        __metadata$2("design:type", Number)
    ], SpriteComponent.prototype, "alpha", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Origin X', min: 0, max: 1, step: 0.01 }),
        __metadata$2("design:type", Number)
    ], SpriteComponent.prototype, "originX", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Origin Y', min: 0, max: 1, step: 0.01 }),
        __metadata$2("design:type", Number)
    ], SpriteComponent.prototype, "originY", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'boolean', label: 'Visible' }),
        __metadata$2("design:type", Boolean)
    ], SpriteComponent.prototype, "visible", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'boolean', label: 'Flip X' }),
        __metadata$2("design:type", Boolean)
    ], SpriteComponent.prototype, "flipX", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'boolean', label: 'Flip Y' }),
        __metadata$2("design:type", Boolean)
    ], SpriteComponent.prototype, "flipY", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'integer', label: 'Sorting Order' }),
        __metadata$2("design:type", Number)
    ], SpriteComponent.prototype, "sortingOrder", void 0);
    SpriteComponent = __decorate$2([
        ECSComponent('Sprite'),
        Serializable({ version: 2, typeId: 'Sprite' }),
        __metadata$2("design:paramtypes", [String])
    ], SpriteComponent);

    /**
     * 精灵动画组件 - 管理精灵帧动画
     * Sprite animator component - manages sprite frame animation
     */
    let SpriteAnimatorComponent = class SpriteAnimatorComponent extends Component {
        constructor() {
            super();
            /**
             * 动画剪辑列表
             * Animation clips
             */
            this.clips = [];
            /**
             * 当前播放的动画名称
             * Currently playing animation name
             */
            this.defaultAnimation = '';
            /**
             * 是否自动播放
             * Auto play on start
             */
            this.autoPlay = true;
            /**
             * 全局播放速度
             * Global playback speed
             */
            this.speed = 1;
            // Runtime state (not serialized)
            this._currentClip = null;
            this._currentFrameIndex = 0;
            this._frameTimer = 0;
            this._isPlaying = false;
            this._isPaused = false;
        }
        /**
         * 添加动画剪辑
         * Add animation clip
         */
        addClip(clip) {
            // Remove existing clip with same name
            this.clips = this.clips.filter(c => c.name !== clip.name);
            this.clips.push(clip);
        }
        /**
         * 从精灵图集创建动画剪辑
         * Create animation clip from sprite atlas
         *
         * @param name - 动画名称 | Animation name
         * @param texture - 纹理路径 | Texture path
         * @param frameCount - 帧数 | Number of frames
         * @param frameWidth - 每帧宽度 | Frame width
         * @param frameHeight - 每帧高度 | Frame height
         * @param atlasWidth - 图集宽度 | Atlas width
         * @param atlasHeight - 图集高度 | Atlas height
         * @param fps - 帧率 | Frames per second
         * @param loop - 是否循环 | Whether to loop
         */
        createClipFromAtlas(name, texture, frameCount, frameWidth, frameHeight, atlasWidth, atlasHeight, fps = 12, loop = true) {
            const frames = [];
            const duration = 1 / fps;
            const cols = Math.floor(atlasWidth / frameWidth);
            for (let i = 0; i < frameCount; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = col * frameWidth;
                const y = row * frameHeight;
                frames.push({
                    texture,
                    duration,
                    uv: [
                        x / atlasWidth,
                        y / atlasHeight,
                        (x + frameWidth) / atlasWidth,
                        (y + frameHeight) / atlasHeight
                    ]
                });
            }
            const clip = {
                name,
                frames,
                loop,
                speed: 1
            };
            this.addClip(clip);
            return clip;
        }
        /**
         * 从帧序列创建动画剪辑
         * Create animation clip from frame sequence
         *
         * @param name - 动画名称 | Animation name
         * @param textures - 纹理路径数组 | Array of texture paths
         * @param fps - 帧率 | Frames per second
         * @param loop - 是否循环 | Whether to loop
         */
        createClipFromSequence(name, textures, fps = 12, loop = true) {
            const duration = 1 / fps;
            const frames = textures.map(texture => ({
                texture,
                duration
            }));
            const clip = {
                name,
                frames,
                loop,
                speed: 1
            };
            this.addClip(clip);
            return clip;
        }
        /**
         * 播放动画
         * Play animation
         */
        play(clipName) {
            const name = clipName || this.defaultAnimation;
            if (!name)
                return;
            const clip = this.clips.find(c => c.name === name);
            if (!clip || clip.frames.length === 0) {
                console.warn(`Animation clip not found: ${name}`);
                return;
            }
            this._currentClip = clip;
            this._currentFrameIndex = 0;
            this._frameTimer = 0;
            this._isPlaying = true;
            this._isPaused = false;
            this._notifyFrameChange();
        }
        /**
         * 停止动画
         * Stop animation
         */
        stop() {
            this._isPlaying = false;
            this._isPaused = false;
            this._currentFrameIndex = 0;
            this._frameTimer = 0;
        }
        /**
         * 暂停动画
         * Pause animation
         */
        pause() {
            if (this._isPlaying) {
                this._isPaused = true;
            }
        }
        /**
         * 恢复动画
         * Resume animation
         */
        resume() {
            if (this._isPlaying && this._isPaused) {
                this._isPaused = false;
            }
        }
        /**
         * 更新动画（由系统调用）
         * Update animation (called by system)
         */
        update(deltaTime) {
            if (!this._isPlaying || this._isPaused || !this._currentClip)
                return;
            const clip = this._currentClip;
            const frame = clip.frames[this._currentFrameIndex];
            if (!frame)
                return;
            this._frameTimer += deltaTime * this.speed * clip.speed;
            if (this._frameTimer >= frame.duration) {
                this._frameTimer -= frame.duration;
                this._currentFrameIndex++;
                if (this._currentFrameIndex >= clip.frames.length) {
                    if (clip.loop) {
                        this._currentFrameIndex = 0;
                    }
                    else {
                        this._currentFrameIndex = clip.frames.length - 1;
                        this._isPlaying = false;
                        this._onAnimationComplete?.(clip.name);
                        return;
                    }
                }
                this._notifyFrameChange();
            }
        }
        /**
         * 获取当前帧
         * Get current frame
         */
        getCurrentFrame() {
            if (!this._currentClip)
                return null;
            return this._currentClip.frames[this._currentFrameIndex] || null;
        }
        /**
         * 获取当前帧索引
         * Get current frame index
         */
        getCurrentFrameIndex() {
            return this._currentFrameIndex;
        }
        /**
         * 设置当前帧
         * Set current frame
         */
        setFrame(index) {
            if (!this._currentClip)
                return;
            this._currentFrameIndex = Math.max(0, Math.min(index, this._currentClip.frames.length - 1));
            this._frameTimer = 0;
            this._notifyFrameChange();
        }
        /**
         * 是否正在播放
         * Whether animation is playing
         */
        isPlaying() {
            return this._isPlaying && !this._isPaused;
        }
        /**
         * 获取当前动画名称
         * Get current animation name
         */
        getCurrentClipName() {
            return this._currentClip?.name || null;
        }
        /**
         * 设置动画完成回调
         * Set animation complete callback
         */
        onAnimationComplete(callback) {
            this._onAnimationComplete = callback;
        }
        /**
         * 设置帧变化回调
         * Set frame change callback
         */
        onFrameChange(callback) {
            this._onFrameChange = callback;
        }
        _notifyFrameChange() {
            const frame = this.getCurrentFrame();
            if (frame) {
                this._onFrameChange?.(this._currentFrameIndex, frame);
            }
        }
        /**
         * 获取动画剪辑
         * Get animation clip by name
         */
        getClip(name) {
            return this.clips.find(c => c.name === name);
        }
        /**
         * 移除动画剪辑
         * Remove animation clip
         */
        removeClip(name) {
            this.clips = this.clips.filter(c => c.name !== name);
            if (this._currentClip?.name === name) {
                this.stop();
                this._currentClip = null;
            }
        }
        /**
         * 获取所有动画名称
         * Get all animation names
         */
        getClipNames() {
            return this.clips.map(c => c.name);
        }
    };
    __decorate$2([
        Serialize(),
        Property({ type: 'animationClips', label: 'Animation Clips' }),
        __metadata$2("design:type", Array)
    ], SpriteAnimatorComponent.prototype, "clips", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'string', label: 'Default Animation' }),
        __metadata$2("design:type", String)
    ], SpriteAnimatorComponent.prototype, "defaultAnimation", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'boolean', label: 'Auto Play' }),
        __metadata$2("design:type", Boolean)
    ], SpriteAnimatorComponent.prototype, "autoPlay", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Speed', min: 0, max: 10, step: 0.1 }),
        __metadata$2("design:type", Number)
    ], SpriteAnimatorComponent.prototype, "speed", void 0);
    SpriteAnimatorComponent = __decorate$2([
        ECSComponent('SpriteAnimator'),
        Serializable({ version: 1, typeId: 'SpriteAnimator' }),
        __metadata$2("design:paramtypes", [])
    ], SpriteAnimatorComponent);

    /**
     * 文本对齐方式
     */
    var TextAlignment;
    (function (TextAlignment) {
        TextAlignment["Left"] = "left";
        TextAlignment["Center"] = "center";
        TextAlignment["Right"] = "right";
    })(TextAlignment || (TextAlignment = {}));
    /**
     * 文本组件 - 管理文本渲染
     */
    let TextComponent = class TextComponent extends Component {
        constructor(text = '') {
            super();
            /** 文本内容 */
            this.text = '';
            /** 字体 */
            this.font = 'Arial';
            /** 字体大小 */
            this.fontSize = 16;
            /** 颜色 */
            this.color = '#ffffff';
            /** 对齐方式 */
            this.alignment = TextAlignment.Left;
            /** 行高 */
            this.lineHeight = 1.2;
            /** 是否加粗 */
            this.bold = false;
            /** 是否斜体 */
            this.italic = false;
            this.text = text;
        }
    };
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", String)
    ], TextComponent.prototype, "text", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", String)
    ], TextComponent.prototype, "font", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], TextComponent.prototype, "fontSize", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", String)
    ], TextComponent.prototype, "color", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", String)
    ], TextComponent.prototype, "alignment", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], TextComponent.prototype, "lineHeight", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Boolean)
    ], TextComponent.prototype, "bold", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Boolean)
    ], TextComponent.prototype, "italic", void 0);
    TextComponent = __decorate$2([
        ECSComponent('Text'),
        Serializable({ version: 1, typeId: 'Text' }),
        __metadata$2("design:paramtypes", [String])
    ], TextComponent);

    /**
     * 相机投影类型
     */
    var CameraProjection;
    (function (CameraProjection) {
        CameraProjection["Perspective"] = "perspective";
        CameraProjection["Orthographic"] = "orthographic";
    })(CameraProjection || (CameraProjection = {}));
    /**
     * 相机组件 - 管理视图和投影
     */
    let CameraComponent = class CameraComponent extends Component {
        constructor() {
            super();
            /** 投影类型 */
            this.projection = CameraProjection.Orthographic;
            /** 视野角度（透视模式） */
            this.fieldOfView = 60;
            /** 正交尺寸（正交模式） */
            this.orthographicSize = 5;
            /** 近裁剪面 */
            this.nearClipPlane = 0.1;
            /** 远裁剪面 */
            this.farClipPlane = 1000;
            /** 视口X */
            this.viewportX = 0;
            /** 视口Y */
            this.viewportY = 0;
            /** 视口宽度 */
            this.viewportWidth = 1;
            /** 视口高度 */
            this.viewportHeight = 1;
            /** 渲染优先级 */
            this.depth = 0;
            /** 背景颜色 */
            this.backgroundColor = '#000000';
        }
    };
    __decorate$2([
        Serialize(),
        Property({
            type: 'enum',
            label: 'Projection',
            options: [
                { label: 'Orthographic', value: CameraProjection.Orthographic },
                { label: 'Perspective', value: CameraProjection.Perspective }
            ]
        }),
        __metadata$2("design:type", String)
    ], CameraComponent.prototype, "projection", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Field of View', min: 1, max: 179 }),
        __metadata$2("design:type", Number)
    ], CameraComponent.prototype, "fieldOfView", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Orthographic Size', min: 0.1, step: 0.1 }),
        __metadata$2("design:type", Number)
    ], CameraComponent.prototype, "orthographicSize", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Near Clip', min: 0.01, step: 0.1 }),
        __metadata$2("design:type", Number)
    ], CameraComponent.prototype, "nearClipPlane", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Far Clip', min: 1, step: 10 }),
        __metadata$2("design:type", Number)
    ], CameraComponent.prototype, "farClipPlane", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Viewport X', min: 0, max: 1, step: 0.01 }),
        __metadata$2("design:type", Number)
    ], CameraComponent.prototype, "viewportX", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Viewport Y', min: 0, max: 1, step: 0.01 }),
        __metadata$2("design:type", Number)
    ], CameraComponent.prototype, "viewportY", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Viewport Width', min: 0, max: 1, step: 0.01 }),
        __metadata$2("design:type", Number)
    ], CameraComponent.prototype, "viewportWidth", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'number', label: 'Viewport Height', min: 0, max: 1, step: 0.01 }),
        __metadata$2("design:type", Number)
    ], CameraComponent.prototype, "viewportHeight", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'integer', label: 'Depth' }),
        __metadata$2("design:type", Number)
    ], CameraComponent.prototype, "depth", void 0);
    __decorate$2([
        Serialize(),
        Property({ type: 'color', label: 'Background Color' }),
        __metadata$2("design:type", String)
    ], CameraComponent.prototype, "backgroundColor", void 0);
    CameraComponent = __decorate$2([
        ECSComponent('Camera'),
        Serializable({ version: 1, typeId: 'Camera' }),
        __metadata$2("design:paramtypes", [])
    ], CameraComponent);

    /**
     * 精灵动画系统 - 更新所有精灵动画
     * Sprite animator system - updates all sprite animations
     */
    let SpriteAnimatorSystem = class SpriteAnimatorSystem extends EntitySystem {
        constructor() {
            super(Matcher.empty().all(SpriteAnimatorComponent));
        }
        /**
         * 系统初始化时调用
         * Called when system is initialized
         */
        onInitialize() {
            // System initialized
        }
        /**
         * 每帧开始时调用
         * Called at the beginning of each frame
         */
        onBegin() {
            // Frame begin
        }
        /**
         * 处理匹配的实体
         * Process matched entities
         */
        process(entities) {
            const deltaTime = Time.deltaTime;
            for (const entity of entities) {
                if (!entity.enabled)
                    continue;
                const animator = entity.getComponent(SpriteAnimatorComponent);
                if (!animator)
                    continue;
                animator.update(deltaTime);
                // Sync current frame to sprite component
                const sprite = entity.getComponent(SpriteComponent);
                if (sprite) {
                    const frame = animator.getCurrentFrame();
                    if (frame) {
                        // Update texture if changed
                        if (sprite.texture !== frame.texture) {
                            sprite.texture = frame.texture;
                        }
                        // Update UV if specified
                        if (frame.uv) {
                            sprite.uv = frame.uv;
                        }
                    }
                }
            }
        }
        /**
         * 实体添加到系统时调用
         * Called when entity is added to system
         */
        onAdded(entity) {
            const animator = entity.getComponent(SpriteAnimatorComponent);
            if (animator && animator.autoPlay && animator.defaultAnimation) {
                animator.play();
            }
        }
        /**
         * 实体从系统移除时调用
         * Called when entity is removed from system
         */
        onRemoved(entity) {
            const animator = entity.getComponent(SpriteAnimatorComponent);
            if (animator) {
                animator.stop();
            }
        }
    };
    SpriteAnimatorSystem = __decorate$2([
        ECSSystem('SpriteAnimator', { updateOrder: 50 }),
        __metadata$2("design:paramtypes", [])
    ], SpriteAnimatorSystem);

    /**
     * 刚体类型
     */
    var BodyType;
    (function (BodyType) {
        BodyType["Static"] = "static";
        BodyType["Dynamic"] = "dynamic";
        BodyType["Kinematic"] = "kinematic";
    })(BodyType || (BodyType = {}));
    /**
     * 刚体组件 - 管理物理模拟
     */
    let RigidBodyComponent = class RigidBodyComponent extends Component {
        constructor() {
            super();
            /** 刚体类型 */
            this.bodyType = BodyType.Dynamic;
            /** 质量 */
            this.mass = 1;
            /** 线性阻尼 */
            this.linearDamping = 0;
            /** 角阻尼 */
            this.angularDamping = 0.05;
            /** 重力缩放 */
            this.gravityScale = 1;
            /** 是否使用连续碰撞检测 */
            this.continuousDetection = false;
            /** 是否冻结X轴旋转 */
            this.freezeRotationX = false;
            /** 是否冻结Y轴旋转 */
            this.freezeRotationY = false;
            /** 是否冻结Z轴旋转 */
            this.freezeRotationZ = false;
            /** X轴速度 */
            this.velocityX = 0;
            /** Y轴速度 */
            this.velocityY = 0;
            /** Z轴速度 */
            this.velocityZ = 0;
        }
    };
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", String)
    ], RigidBodyComponent.prototype, "bodyType", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], RigidBodyComponent.prototype, "mass", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], RigidBodyComponent.prototype, "linearDamping", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], RigidBodyComponent.prototype, "angularDamping", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], RigidBodyComponent.prototype, "gravityScale", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Boolean)
    ], RigidBodyComponent.prototype, "continuousDetection", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Boolean)
    ], RigidBodyComponent.prototype, "freezeRotationX", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Boolean)
    ], RigidBodyComponent.prototype, "freezeRotationY", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Boolean)
    ], RigidBodyComponent.prototype, "freezeRotationZ", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], RigidBodyComponent.prototype, "velocityX", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], RigidBodyComponent.prototype, "velocityY", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], RigidBodyComponent.prototype, "velocityZ", void 0);
    RigidBodyComponent = __decorate$2([
        ECSComponent('RigidBody'),
        Serializable({ version: 1, typeId: 'RigidBody' }),
        __metadata$2("design:paramtypes", [])
    ], RigidBodyComponent);

    /**
     * 盒型碰撞器组件
     */
    let BoxColliderComponent = class BoxColliderComponent extends Component {
        constructor() {
            super();
            /** 是否为触发器 */
            this.isTrigger = false;
            /** 中心点X偏移 */
            this.centerX = 0;
            /** 中心点Y偏移 */
            this.centerY = 0;
            /** 中心点Z偏移 */
            this.centerZ = 0;
            /** 宽度 */
            this.width = 1;
            /** 高度 */
            this.height = 1;
            /** 深度 */
            this.depth = 1;
        }
    };
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Boolean)
    ], BoxColliderComponent.prototype, "isTrigger", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], BoxColliderComponent.prototype, "centerX", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], BoxColliderComponent.prototype, "centerY", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], BoxColliderComponent.prototype, "centerZ", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], BoxColliderComponent.prototype, "width", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], BoxColliderComponent.prototype, "height", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], BoxColliderComponent.prototype, "depth", void 0);
    BoxColliderComponent = __decorate$2([
        ECSComponent('BoxCollider'),
        Serializable({ version: 1, typeId: 'BoxCollider' }),
        __metadata$2("design:paramtypes", [])
    ], BoxColliderComponent);

    /**
     * 圆形碰撞器组件
     */
    let CircleColliderComponent = class CircleColliderComponent extends Component {
        constructor() {
            super();
            /** 是否为触发器 */
            this.isTrigger = false;
            /** 中心点X偏移 */
            this.centerX = 0;
            /** 中心点Y偏移 */
            this.centerY = 0;
            /** 半径 */
            this.radius = 0.5;
        }
    };
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Boolean)
    ], CircleColliderComponent.prototype, "isTrigger", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], CircleColliderComponent.prototype, "centerX", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], CircleColliderComponent.prototype, "centerY", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], CircleColliderComponent.prototype, "radius", void 0);
    CircleColliderComponent = __decorate$2([
        ECSComponent('CircleCollider'),
        Serializable({ version: 1, typeId: 'CircleCollider' }),
        __metadata$2("design:paramtypes", [])
    ], CircleColliderComponent);

    /**
     * 音频源组件 - 管理音频播放
     */
    let AudioSourceComponent = class AudioSourceComponent extends Component {
        constructor() {
            super();
            /** 音频资源路径 */
            this.clip = '';
            /** 音量 (0-1) */
            this.volume = 1;
            /** 音调 */
            this.pitch = 1;
            /** 是否循环 */
            this.loop = false;
            /** 是否启动时播放 */
            this.playOnAwake = false;
            /** 是否静音 */
            this.mute = false;
            /** 空间混合 (0=2D, 1=3D) */
            this.spatialBlend = 0;
            /** 最小距离（3D音效） */
            this.minDistance = 1;
            /** 最大距离（3D音效） */
            this.maxDistance = 500;
        }
    };
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", String)
    ], AudioSourceComponent.prototype, "clip", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], AudioSourceComponent.prototype, "volume", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], AudioSourceComponent.prototype, "pitch", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Boolean)
    ], AudioSourceComponent.prototype, "loop", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Boolean)
    ], AudioSourceComponent.prototype, "playOnAwake", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Boolean)
    ], AudioSourceComponent.prototype, "mute", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], AudioSourceComponent.prototype, "spatialBlend", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], AudioSourceComponent.prototype, "minDistance", void 0);
    __decorate$2([
        Serialize(),
        __metadata$2("design:type", Number)
    ], AudioSourceComponent.prototype, "maxDistance", void 0);
    AudioSourceComponent = __decorate$2([
        ECSComponent('AudioSource'),
        Serializable({ version: 1, typeId: 'AudioSource' }),
        __metadata$2("design:paramtypes", [])
    ], AudioSourceComponent);

    /**
     * Engine render system for ECS.
     * 用于ECS的引擎渲染系统。
     */
    var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$1 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    /**
     * ECS System for rendering sprites using the Rust engine.
     * 使用Rust引擎渲染精灵的ECS系统。
     *
     * This system extends EntitySystem and integrates with the ECS lifecycle.
     * 此系统扩展EntitySystem并与ECS生命周期集成。
     *
     * @example
     * ```typescript
     * // Create transform component | 创建变换组件
     * @ECSComponent('Transform')
     * class Transform extends Component implements ITransformComponent {
     *     position = { x: 0, y: 0 };
     *     rotation = 0;
     *     scale = { x: 1, y: 1 };
     * }
     *
     * // Initialize bridge | 初始化桥接
     * const bridge = new EngineBridge({ canvasId: 'canvas' });
     * await bridge.initialize();
     *
     * // Add system to scene | 将系统添加到场景
     * const renderSystem = new EngineRenderSystem(bridge, Transform);
     * scene.addSystem(renderSystem);
     * ```
     */
    let EngineRenderSystem = class EngineRenderSystem extends EntitySystem {
        /**
         * Create a new engine render system.
         * 创建新的引擎渲染系统。
         *
         * @param bridge - Engine bridge instance | 引擎桥接实例
         * @param transformType - Transform component class (must implement ITransformComponent) | 变换组件类（必须实现ITransformComponent）
         */
        constructor(bridge, transformType) {
            // Match entities with both Sprite and Transform components
            // 匹配同时具有Sprite和Transform组件的实体
            super(Matcher.empty().all(SpriteComponent, transformType));
            this.showGizmos = true;
            this.selectedEntityIds = new Set();
            this.transformMode = 'select';
            // Reusable map to avoid allocation per frame
            // 可重用的映射以避免每帧分配
            this.entityRenderMap = new Map();
            this.bridge = bridge;
            this.batcher = new RenderBatcher();
            this.transformType = transformType;
        }
        /**
         * Called when system is initialized.
         * 系统初始化时调用。
         */
        initialize() {
            super.initialize();
            this.logger.info('EngineRenderSystem initialized | 引擎渲染系统初始化完成');
        }
        /**
         * Called before processing entities.
         * 处理实体之前调用。
         */
        onBegin() {
            // Clear the batch | 清空批处理
            this.batcher.clear();
            // Clear screen with dark background | 用深色背景清屏
            this.bridge.clear(0.1, 0.1, 0.12, 1);
            // Update input | 更新输入
            this.bridge.updateInput();
        }
        /**
         * Process all matched entities.
         * 处理所有匹配的实体。
         *
         * @param entities - Entities to process | 要处理的实体
         */
        process(entities) {
            // Clear and reuse map for gizmo drawing
            // 清空并重用映射用于绘制gizmo
            this.entityRenderMap.clear();
            for (const entity of entities) {
                const sprite = entity.getComponent(SpriteComponent);
                const transform = entity.getComponent(this.transformType);
                if (!sprite || !transform) {
                    continue;
                }
                // Calculate UV with flip | 计算带翻转的UV
                let uv = [0, 0, 1, 1];
                if (sprite.flipX || sprite.flipY) {
                    if (sprite.flipX) {
                        [uv[0], uv[2]] = [uv[2], uv[0]];
                    }
                    if (sprite.flipY) {
                        [uv[1], uv[3]] = [uv[3], uv[1]];
                    }
                }
                // Handle rotation as number or Vector3 (use z for 2D)
                const rotation = typeof transform.rotation === 'number'
                    ? transform.rotation
                    : transform.rotation.z;
                // Convert hex color string to packed RGBA | 将十六进制颜色字符串转换为打包的RGBA
                const color = this.hexToPackedColor(sprite.color, sprite.alpha);
                // Get texture ID from sprite component
                // 从精灵组件获取纹理ID
                // textureId 0 will use default white texture in Rust engine
                // textureId 0 将在 Rust 引擎中使用默认白色纹理
                const textureId = sprite.textureId ?? 0;
                // Pass actual display dimensions (sprite size * transform scale)
                // 传递实际显示尺寸（sprite尺寸 * 变换缩放）
                const renderData = {
                    x: transform.position.x,
                    y: transform.position.y,
                    rotation,
                    scaleX: sprite.width * transform.scale.x,
                    scaleY: sprite.height * transform.scale.y,
                    originX: sprite.anchorX,
                    originY: sprite.anchorY,
                    textureId,
                    uv,
                    color
                };
                this.batcher.addSprite(renderData);
                this.entityRenderMap.set(entity.id, renderData);
            }
            // Submit batch and render at the end of process | 在process结束时提交批处理并渲染
            if (!this.batcher.isEmpty) {
                const sprites = this.batcher.getSprites();
                this.bridge.submitSprites(sprites);
            }
            // Draw gizmos for selected entities (always, even if no sprites)
            // 为选中的实体绘制Gizmo（始终绘制，即使没有精灵）
            if (this.showGizmos && this.selectedEntityIds.size > 0) {
                for (const entityId of this.selectedEntityIds) {
                    const renderData = this.entityRenderMap.get(entityId);
                    if (renderData) {
                        this.bridge.addGizmoRect(renderData.x, renderData.y, renderData.scaleX, renderData.scaleY, renderData.rotation, renderData.originX, renderData.originY, 0.0, 1.0, 0.5, 1.0, // Green color | 绿色
                        true // Show transform handles for selection gizmo
                        );
                    }
                }
            }
            // Draw camera frustum gizmos
            // 绘制相机视锥体 gizmo
            if (this.showGizmos) {
                this.drawCameraFrustums();
            }
            this.bridge.render();
        }
        /**
         * Draw camera frustum gizmos for all cameras in scene.
         * 为场景中所有相机绘制视锥体 gizmo。
         */
        drawCameraFrustums() {
            const scene = Core.scene;
            if (!scene)
                return;
            const cameraEntities = scene.entities.findEntitiesWithComponent(CameraComponent);
            for (const entity of cameraEntities) {
                const camera = entity.getComponent(CameraComponent);
                const transform = entity.getComponent(TransformComponent);
                if (!camera || !transform)
                    continue;
                // Calculate frustum size based on canvas size and orthographicSize
                // 根据 canvas 尺寸和 orthographicSize 计算视锥体大小
                // At runtime, zoom = 1 / orthographicSize
                // So visible area = canvas size * orthographicSize
                const canvas = document.getElementById('viewport-canvas');
                if (!canvas)
                    continue;
                // The actual visible world units when running
                // 运行时实际可见的世界单位
                const zoom = camera.orthographicSize > 0 ? 1 / camera.orthographicSize : 1;
                const width = canvas.width / zoom;
                const height = canvas.height / zoom;
                // Handle rotation
                const rotation = typeof transform.rotation === 'number'
                    ? transform.rotation
                    : transform.rotation.z;
                // Draw frustum rectangle (white color for camera)
                // 绘制视锥体矩形（相机用白色）
                this.bridge.addGizmoRect(transform.position.x, transform.position.y, width, height, rotation, 0.5, // origin center
                0.5, 1.0, 1.0, 1.0, 0.8, // White color with some transparency
                false // Don't show transform handles for camera frustum
                );
            }
        }
        /**
         * Set gizmo visibility.
         * 设置Gizmo可见性。
         */
        setShowGizmos(show) {
            this.showGizmos = show;
        }
        /**
         * Get gizmo visibility.
         * 获取Gizmo可见性。
         */
        getShowGizmos() {
            return this.showGizmos;
        }
        /**
         * Set selected entity IDs.
         * 设置选中的实体ID。
         */
        setSelectedEntityIds(ids) {
            this.selectedEntityIds = new Set(ids);
        }
        /**
         * Get selected entity IDs.
         * 获取选中的实体ID。
         */
        getSelectedEntityIds() {
            return Array.from(this.selectedEntityIds);
        }
        /**
         * Set transform tool mode.
         * 设置变换工具模式。
         */
        setTransformMode(mode) {
            this.transformMode = mode;
            // Convert string mode to u8 for Rust engine
            const modeMap = {
                'select': 0,
                'move': 1,
                'rotate': 2,
                'scale': 3
            };
            this.bridge.setTransformMode(modeMap[mode]);
        }
        /**
         * Get transform tool mode.
         * 获取变换工具模式。
         */
        getTransformMode() {
            return this.transformMode;
        }
        /**
         * Convert hex color string to packed RGBA.
         * 将十六进制颜色字符串转换为打包的RGBA。
         */
        hexToPackedColor(hex, alpha) {
            // Parse hex color like "#ffffff" or "#fff"
            let r = 255, g = 255, b = 255;
            if (hex.startsWith('#')) {
                const hexValue = hex.slice(1);
                if (hexValue.length === 3) {
                    r = parseInt(hexValue[0] + hexValue[0], 16);
                    g = parseInt(hexValue[1] + hexValue[1], 16);
                    b = parseInt(hexValue[2] + hexValue[2], 16);
                }
                else if (hexValue.length === 6) {
                    r = parseInt(hexValue.slice(0, 2), 16);
                    g = parseInt(hexValue.slice(2, 4), 16);
                    b = parseInt(hexValue.slice(4, 6), 16);
                }
            }
            const a = Math.round(alpha * 255);
            // Pack as 0xAABBGGRR for WebGL
            return ((a & 0xFF) << 24) | ((b & 0xFF) << 16) | ((g & 0xFF) << 8) | (r & 0xFF);
        }
        /**
         * Get the number of sprites rendered.
         * 获取渲染的精灵数量。
         */
        get spriteCount() {
            return this.batcher.count;
        }
        /**
         * Get engine statistics.
         * 获取引擎统计信息。
         */
        getStats() {
            return this.bridge.getStats();
        }
        /**
         * Load a texture.
         * 加载纹理。
         */
        loadTexture(id, url) {
            this.bridge.loadTexture(id, url);
        }
    };
    EngineRenderSystem = __decorate$1([
        ECSSystem('EngineRender', { updateOrder: 1000 }) // Render system executes last | 渲染系统最后执行
        ,
        __metadata$1("design:paramtypes", [Function, Object])
    ], EngineRenderSystem);

    /**
     * Camera System
     * 相机系统
     */
    var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    let CameraSystem = class CameraSystem extends EntitySystem {
        constructor(bridge) {
            // Match entities with CameraComponent
            super(Matcher.empty().all(CameraComponent));
            this.lastAppliedCameraId = null;
            this.bridge = bridge;
        }
        onBegin() {
            // Will process cameras in process()
        }
        process(entities) {
            // Use first enabled camera
            for (const entity of entities) {
                if (!entity.enabled)
                    continue;
                const camera = entity.getComponent(CameraComponent);
                if (!camera)
                    continue;
                // Only apply if camera changed
                if (this.lastAppliedCameraId !== entity.id) {
                    this.applyCamera(camera);
                    this.lastAppliedCameraId = entity.id;
                }
                // Only use first active camera
                break;
            }
        }
        applyCamera(camera) {
            // Apply background color
            const bgColor = camera.backgroundColor || '#000000';
            const r = parseInt(bgColor.slice(1, 3), 16) / 255;
            const g = parseInt(bgColor.slice(3, 5), 16) / 255;
            const b = parseInt(bgColor.slice(5, 7), 16) / 255;
            this.bridge.setClearColor(r, g, b, 1.0);
        }
    };
    CameraSystem = __decorate([
        ECSSystem('Camera', { updateOrder: -100 }),
        __metadata("design:paramtypes", [Function])
    ], CameraSystem);

    /**
     * Core asset system types and enums
     * 核心资产系统类型和枚举
     */
    /**
     * Asset loading state
     * 资产加载状态
     */
    var AssetState;
    (function (AssetState) {
        /** 未加载 */
        AssetState["Unloaded"] = "unloaded";
        /** 加载中 */
        AssetState["Loading"] = "loading";
        /** 已加载 */
        AssetState["Loaded"] = "loaded";
        /** 加载失败 */
        AssetState["Failed"] = "failed";
        /** 释放中 */
        AssetState["Disposing"] = "disposing";
    })(AssetState || (AssetState = {}));
    /**
     * Asset types supported by the system
     * 系统支持的资产类型
     */
    var AssetType;
    (function (AssetType) {
        /** 纹理 */
        AssetType["Texture"] = "texture";
        /** 网格 */
        AssetType["Mesh"] = "mesh";
        /** 材质 */
        AssetType["Material"] = "material";
        /** 着色器 */
        AssetType["Shader"] = "shader";
        /** 音频 */
        AssetType["Audio"] = "audio";
        /** 字体 */
        AssetType["Font"] = "font";
        /** 预制体 */
        AssetType["Prefab"] = "prefab";
        /** 场景 */
        AssetType["Scene"] = "scene";
        /** 脚本 */
        AssetType["Script"] = "script";
        /** 动画片段 */
        AssetType["AnimationClip"] = "animation";
        /** 行为树 */
        AssetType["BehaviorTree"] = "behaviortree";
        /** JSON数据 */
        AssetType["Json"] = "json";
        /** 文本 */
        AssetType["Text"] = "text";
        /** 二进制 */
        AssetType["Binary"] = "binary";
        /** 自定义 */
        AssetType["Custom"] = "custom";
    })(AssetType || (AssetType = {}));
    /**
     * Platform variants for assets
     * 资产的平台变体
     */
    var AssetPlatform;
    (function (AssetPlatform) {
        /** H5平台（浏览器） */
        AssetPlatform["H5"] = "h5";
        /** 微信小游戏 */
        AssetPlatform["WeChat"] = "wechat";
        /** 试玩广告（Playable Ads） */
        AssetPlatform["Playable"] = "playable";
        /** Android平台 */
        AssetPlatform["Android"] = "android";
        /** iOS平台 */
        AssetPlatform["iOS"] = "ios";
        /** 编辑器（Tauri桌面） */
        AssetPlatform["Editor"] = "editor";
    })(AssetPlatform || (AssetPlatform = {}));
    /**
     * Quality levels for asset variants
     * 资产变体的质量级别
     */
    var AssetQuality;
    (function (AssetQuality) {
        /** 低质量 */
        AssetQuality["Low"] = "low";
        /** 中等质量 */
        AssetQuality["Medium"] = "medium";
        /** 高质量 */
        AssetQuality["High"] = "high";
        /** 超高质量 */
        AssetQuality["Ultra"] = "ultra";
    })(AssetQuality || (AssetQuality = {}));
    /**
     * Asset loading error
     * 资产加载错误
     */
    class AssetLoadError extends Error {
        constructor(message, guid, type, cause) {
            super(message);
            this.guid = guid;
            this.type = type;
            this.cause = cause;
            this.name = 'AssetLoadError';
            Object.setPrototypeOf(this, new.target.prototype);
        }
        /**
         * Factory method for file not found error
         * 文件未找到错误的工厂方法
         */
        static fileNotFound(guid, path) {
            return new AssetLoadError(`Asset file not found: ${path}`, guid, AssetType.Custom);
        }
        /**
         * Factory method for unsupported type error
         * 不支持的类型错误的工厂方法
         */
        static unsupportedType(guid, type) {
            return new AssetLoadError(`Unsupported asset type: ${type}`, guid, type);
        }
        /**
         * Factory method for load timeout error
         * 加载超时错误的工厂方法
         */
        static loadTimeout(guid, type, timeout) {
            return new AssetLoadError(`Asset load timeout after ${timeout}ms`, guid, type);
        }
        /**
         * Factory method for dependency failed error
         * 依赖加载失败错误的工厂方法
         */
        static dependencyFailed(guid, type, depGuid) {
            return new AssetLoadError(`Dependency failed to load: ${depGuid}`, guid, type);
        }
    }

    /**
     * Asset cache implementation
     * 资产缓存实现
     */
    /**
     * Asset cache implementation
     * 资产缓存实现
     */
    class AssetCache {
        constructor() {
            this._cache = new Map();
            // 无配置，无限制缓存 / No config, unlimited cache
        }
        /**
         * Get cached asset
         * 获取缓存的资产
         */
        get(guid) {
            const entry = this._cache.get(guid);
            if (!entry)
                return null;
            // 更新访问信息 / Update access info
            entry.lastAccessTime = Date.now();
            entry.accessCount++;
            return entry.asset;
        }
        /**
         * Set cached asset
         * 设置缓存的资产
         */
        set(guid, asset) {
            const now = Date.now();
            const entry = {
                guid,
                asset,
                lastAccessTime: now,
                accessCount: 1
            };
            // 如果已存在，更新 / Update if exists
            const oldEntry = this._cache.get(guid);
            if (oldEntry) {
                entry.accessCount = oldEntry.accessCount + 1;
            }
            this._cache.set(guid, entry);
        }
        /**
         * Check if asset is cached
         * 检查资产是否缓存
         */
        has(guid) {
            return this._cache.has(guid);
        }
        /**
         * Remove asset from cache
         * 从缓存移除资产
         */
        remove(guid) {
            this._cache.delete(guid);
        }
        /**
         * Clear all cache
         * 清空所有缓存
         */
        clear() {
            this._cache.clear();
        }
        /**
         * Get cache size
         * 获取缓存大小
         */
        getSize() {
            return this._cache.size;
        }
        /**
         * Get all cached GUIDs
         * 获取所有缓存的GUID
         */
        getAllGuids() {
            return Array.from(this._cache.keys());
        }
        /**
         * Get cache statistics
         * 获取缓存统计
         */
        getStatistics() {
            const entries = Array.from(this._cache.values()).map(entry => ({
                guid: entry.guid,
                accessCount: entry.accessCount,
                lastAccessTime: entry.lastAccessTime
            }));
            return {
                count: this._cache.size,
                entries
            };
        }
    }

    /**
     * Priority-based asset loading queue
     * 基于优先级的资产加载队列
     */
    /**
     * Asset load queue implementation
     * 资产加载队列实现
     */
    class AssetLoadQueue {
        constructor() {
            this._queue = [];
            this._guidToIndex = new Map();
        }
        /**
         * Add to queue
         * 添加到队列
         */
        enqueue(guid, priority, options) {
            // 检查是否已在队列中 / Check if already in queue
            if (this._guidToIndex.has(guid)) {
                this.reprioritize(guid, priority);
                return;
            }
            const item = {
                guid,
                priority,
                options,
                timestamp: Date.now()
            };
            // 二分查找插入位置 / Binary search for insertion position
            const index = this.findInsertIndex(priority);
            this._queue.splice(index, 0, item);
            // 更新索引映射 / Update index mapping
            this.updateIndices(index);
        }
        /**
         * Remove from queue
         * 从队列移除
         */
        dequeue() {
            if (this._queue.length === 0)
                return null;
            const item = this._queue.shift();
            if (!item)
                return null;
            // 更新索引映射 / Update index mapping
            this._guidToIndex.delete(item.guid);
            this.updateIndices(0);
            return {
                guid: item.guid,
                options: item.options
            };
        }
        /**
         * Check if queue is empty
         * 检查队列是否为空
         */
        isEmpty() {
            return this._queue.length === 0;
        }
        /**
         * Get queue size
         * 获取队列大小
         */
        getSize() {
            return this._queue.length;
        }
        /**
         * Clear queue
         * 清空队列
         */
        clear() {
            this._queue.length = 0;
            this._guidToIndex.clear();
        }
        /**
         * Reprioritize item
         * 重新设置优先级
         */
        reprioritize(guid, newPriority) {
            const index = this._guidToIndex.get(guid);
            if (index === undefined)
                return;
            const item = this._queue[index];
            if (!item || item.priority === newPriority)
                return;
            // 移除旧项 / Remove old item
            this._queue.splice(index, 1);
            this._guidToIndex.delete(guid);
            // 重新插入 / Reinsert with new priority
            item.priority = newPriority;
            const newIndex = this.findInsertIndex(newPriority);
            this._queue.splice(newIndex, 0, item);
            // 更新索引 / Update indices
            this.updateIndices(Math.min(index, newIndex));
        }
        /**
         * Find insertion index for priority
         * 查找优先级的插入索引
         */
        findInsertIndex(priority) {
            let left = 0;
            let right = this._queue.length;
            while (left < right) {
                const mid = Math.floor((left + right) / 2);
                // 高优先级在前 / Higher priority first
                if (this._queue[mid].priority >= priority) {
                    left = mid + 1;
                }
                else {
                    right = mid;
                }
            }
            return left;
        }
        /**
         * Update indices after modification
         * 修改后更新索引
         */
        updateIndices(startIndex) {
            for (let i = startIndex; i < this._queue.length; i++) {
                this._guidToIndex.set(this._queue[i].guid, i);
            }
        }
        /**
         * Get queue items (for debugging)
         * 获取队列项（用于调试）
         */
        getItems() {
            const now = Date.now();
            return this._queue.map(item => ({
                guid: item.guid,
                priority: item.priority,
                waitTime: now - item.timestamp
            }));
        }
        /**
         * Remove specific item from queue
         * 从队列中移除特定项
         */
        remove(guid) {
            const index = this._guidToIndex.get(guid);
            if (index === undefined)
                return false;
            this._queue.splice(index, 1);
            this._guidToIndex.delete(guid);
            this.updateIndices(index);
            return true;
        }
        /**
         * Check if guid is in queue
         * 检查guid是否在队列中
         */
        contains(guid) {
            return this._guidToIndex.has(guid);
        }
    }

    /**
     * Texture asset loader
     * 纹理资产加载器
     */
    /**
     * Texture loader implementation
     * 纹理加载器实现
     */
    class TextureLoader {
        constructor() {
            this.supportedType = AssetType.Texture;
            this.supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
            this._loadedTextures = new Map();
        }
        /**
         * Load texture asset
         * 加载纹理资产
         */
        async load(path, metadata, options) {
            const startTime = performance.now();
            // 检查缓存 / Check cache
            if (!options?.forceReload && this._loadedTextures.has(path)) {
                const cached = this._loadedTextures.get(path);
                return {
                    asset: cached,
                    handle: cached.textureId,
                    metadata,
                    loadTime: 0
                };
            }
            try {
                // 创建图像元素 / Create image element
                const image = await this.loadImage(path, options);
                // 创建纹理资产 / Create texture asset
                const textureAsset = {
                    textureId: TextureLoader._nextTextureId++,
                    width: image.width,
                    height: image.height,
                    format: 'rgba', // 默认格式 / Default format
                    hasMipmaps: false,
                    data: image
                };
                // 缓存纹理 / Cache texture
                this._loadedTextures.set(path, textureAsset);
                // 触发引擎纹理加载（如果有引擎桥接） / Trigger engine texture loading if bridge exists
                if (typeof window !== 'undefined' && window.engineBridge) {
                    await this.uploadToGPU(textureAsset, path);
                }
                return {
                    asset: textureAsset,
                    handle: textureAsset.textureId,
                    metadata,
                    loadTime: performance.now() - startTime
                };
            }
            catch (error) {
                throw AssetLoadError.fileNotFound(metadata.guid, path);
            }
        }
        /**
         * Load image from URL
         * 从URL加载图像
         */
        async loadImage(url, options) {
            // For Tauri asset URLs, use fetch to load the image
            // 对于Tauri资产URL，使用fetch加载图像
            if (url.startsWith('http://asset.localhost/') || url.startsWith('asset://')) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch image: ${response.statusText}`);
                    }
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    return new Promise((resolve, reject) => {
                        const image = new Image();
                        image.onload = () => {
                            // Clean up blob URL after loading
                            // 加载后清理blob URL
                            URL.revokeObjectURL(blobUrl);
                            resolve(image);
                        };
                        image.onerror = () => {
                            URL.revokeObjectURL(blobUrl);
                            reject(new Error(`Failed to load image from blob: ${url}`));
                        };
                        image.src = blobUrl;
                    });
                }
                catch (error) {
                    throw new Error(`Failed to load Tauri asset: ${url} - ${error}`);
                }
            }
            // For regular URLs, use standard Image loading
            // 对于常规URL，使用标准Image加载
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.crossOrigin = 'anonymous';
                // 超时处理 / Timeout handling
                const timeout = options?.timeout || 30000;
                const timeoutId = setTimeout(() => {
                    reject(new Error(`Image load timeout: ${url}`));
                }, timeout);
                // 进度回调 / Progress callback
                if (options?.onProgress) {
                    // 图像加载没有真正的进度事件，模拟进度 / Images don't have real progress events, simulate
                    let progress = 0;
                    const progressInterval = setInterval(() => {
                        progress = Math.min(progress + 0.1, 0.9);
                        options.onProgress(progress);
                    }, 100);
                    image.onload = () => {
                        clearInterval(progressInterval);
                        clearTimeout(timeoutId);
                        options.onProgress(1);
                        resolve(image);
                    };
                    image.onerror = () => {
                        clearInterval(progressInterval);
                        clearTimeout(timeoutId);
                        reject(new Error(`Failed to load image: ${url}`));
                    };
                }
                else {
                    image.onload = () => {
                        clearTimeout(timeoutId);
                        resolve(image);
                    };
                    image.onerror = () => {
                        clearTimeout(timeoutId);
                        reject(new Error(`Failed to load image: ${url}`));
                    };
                }
                image.src = url;
            });
        }
        /**
         * Upload texture to GPU
         * 上传纹理到GPU
         */
        async uploadToGPU(textureAsset, path) {
            const bridge = window.engineBridge;
            if (bridge && bridge.loadTexture) {
                await bridge.loadTexture(textureAsset.textureId, path);
            }
        }
        /**
         * Validate if the loader can handle this asset
         * 验证加载器是否可以处理此资产
         */
        canLoad(path, metadata) {
            const ext = path.toLowerCase().substring(path.lastIndexOf('.'));
            return this.supportedExtensions.includes(ext);
        }
        /**
         * Estimate memory usage for the asset
         * 估算资产的内存使用量
         */
        /**
         * Dispose loaded asset
         * 释放已加载的资产
         */
        dispose(asset) {
            // 从缓存中移除 / Remove from cache
            for (const [path, cached] of this._loadedTextures.entries()) {
                if (cached === asset) {
                    this._loadedTextures.delete(path);
                    break;
                }
            }
            // 释放GPU资源 / Release GPU resources
            if (typeof window !== 'undefined' && window.engineBridge) {
                const bridge = window.engineBridge;
                if (bridge.unloadTexture) {
                    bridge.unloadTexture(asset.textureId);
                }
            }
            // 清理图像数据 / Clean up image data
            if (asset.data instanceof HTMLImageElement) {
                asset.data.src = '';
            }
        }
    }
    TextureLoader._nextTextureId = 1;

    /**
     * JSON asset loader
     * JSON资产加载器
     */
    /**
     * JSON loader implementation
     * JSON加载器实现
     */
    class JsonLoader {
        constructor() {
            this.supportedType = AssetType.Json;
            this.supportedExtensions = ['.json', '.jsonc'];
        }
        /**
         * Load JSON asset
         * 加载JSON资产
         */
        async load(path, metadata, options) {
            const startTime = performance.now();
            try {
                const response = await this.fetchWithTimeout(path, options?.timeout);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // 获取总大小用于进度回调 / Get total size for progress callback
                const contentLength = response.headers.get('content-length');
                const total = contentLength ? parseInt(contentLength, 10) : 0;
                // 读取响应 / Read response
                let jsonData;
                if (options?.onProgress && total > 0) {
                    jsonData = await this.readResponseWithProgress(response, total, options.onProgress);
                }
                else {
                    jsonData = await response.json();
                }
                const asset = {
                    data: jsonData
                };
                return {
                    asset,
                    handle: 0,
                    metadata,
                    loadTime: performance.now() - startTime
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new AssetLoadError(`Failed to load JSON: ${error.message}`, metadata.guid, AssetType.Json, error);
                }
                throw AssetLoadError.fileNotFound(metadata.guid, path);
            }
        }
        /**
         * Fetch with timeout
         * 带超时的fetch
         */
        async fetchWithTimeout(url, timeout = 30000) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    mode: 'cors',
                    credentials: 'same-origin'
                });
                return response;
            }
            finally {
                clearTimeout(timeoutId);
            }
        }
        /**
         * Read response with progress
         * 带进度读取响应
         */
        async readResponseWithProgress(response, total, onProgress) {
            const reader = response.body?.getReader();
            if (!reader) {
                return response.json();
            }
            const chunks = [];
            let receivedLength = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                chunks.push(value);
                receivedLength += value.length;
                // 报告进度 / Report progress
                onProgress(receivedLength / total);
            }
            // 合并chunks / Merge chunks
            const allChunks = new Uint8Array(receivedLength);
            let position = 0;
            for (const chunk of chunks) {
                allChunks.set(chunk, position);
                position += chunk.length;
            }
            // 解码为字符串并解析JSON / Decode to string and parse JSON
            const decoder = new TextDecoder('utf-8');
            const jsonString = decoder.decode(allChunks);
            return JSON.parse(jsonString);
        }
        /**
         * Validate if the loader can handle this asset
         * 验证加载器是否可以处理此资产
         */
        canLoad(path, metadata) {
            const ext = path.toLowerCase().substring(path.lastIndexOf('.'));
            return this.supportedExtensions.includes(ext);
        }
        /**
         * Estimate memory usage for the asset
         * 估算资产的内存使用量
         */
        /**
         * Dispose loaded asset
         * 释放已加载的资产
         */
        dispose(asset) {
            // JSON资产通常不需要特殊清理 / JSON assets usually don't need special cleanup
            // 但可以清空引用以帮助GC / But can clear references to help GC
            asset.data = null;
        }
    }

    /**
     * Text asset loader
     * 文本资产加载器
     */
    /**
     * Text loader implementation
     * 文本加载器实现
     */
    class TextLoader {
        constructor() {
            this.supportedType = AssetType.Text;
            this.supportedExtensions = ['.txt', '.text', '.md', '.csv', '.xml', '.html', '.css', '.js', '.ts'];
        }
        /**
         * Load text asset
         * 加载文本资产
         */
        async load(path, metadata, options) {
            const startTime = performance.now();
            try {
                const response = await this.fetchWithTimeout(path, options?.timeout);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // 获取总大小用于进度回调 / Get total size for progress callback
                const contentLength = response.headers.get('content-length');
                const total = contentLength ? parseInt(contentLength, 10) : 0;
                // 读取响应 / Read response
                let content;
                if (options?.onProgress && total > 0) {
                    content = await this.readResponseWithProgress(response, total, options.onProgress);
                }
                else {
                    content = await response.text();
                }
                // 检测编码 / Detect encoding
                const encoding = this.detectEncoding(content);
                const asset = {
                    content,
                    encoding
                };
                return {
                    asset,
                    handle: 0,
                    metadata,
                    loadTime: performance.now() - startTime
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new AssetLoadError(`Failed to load text: ${error.message}`, metadata.guid, AssetType.Text, error);
                }
                throw AssetLoadError.fileNotFound(metadata.guid, path);
            }
        }
        /**
         * Fetch with timeout
         * 带超时的fetch
         */
        async fetchWithTimeout(url, timeout = 30000) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    mode: 'cors',
                    credentials: 'same-origin'
                });
                return response;
            }
            finally {
                clearTimeout(timeoutId);
            }
        }
        /**
         * Read response with progress
         * 带进度读取响应
         */
        async readResponseWithProgress(response, total, onProgress) {
            const reader = response.body?.getReader();
            if (!reader) {
                return response.text();
            }
            const decoder = new TextDecoder('utf-8');
            let result = '';
            let receivedLength = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                receivedLength += value.length;
                result += decoder.decode(value, { stream: true });
                // 报告进度 / Report progress
                onProgress(receivedLength / total);
            }
            return result;
        }
        /**
         * Detect text encoding
         * 检测文本编码
         */
        detectEncoding(content) {
            // 简单的编码检测 / Simple encoding detection
            // 检查是否包含非ASCII字符 / Check for non-ASCII characters
            for (let i = 0; i < content.length; i++) {
                const charCode = content.charCodeAt(i);
                if (charCode > 127) {
                    // 包含非ASCII字符，可能是UTF-8或UTF-16 / Contains non-ASCII, likely UTF-8 or UTF-16
                    return charCode > 255 ? 'utf16' : 'utf8';
                }
            }
            return 'ascii';
        }
        /**
         * Validate if the loader can handle this asset
         * 验证加载器是否可以处理此资产
         */
        canLoad(path, metadata) {
            const ext = path.toLowerCase().substring(path.lastIndexOf('.'));
            return this.supportedExtensions.includes(ext);
        }
        /**
         * Estimate memory usage for the asset
         * 估算资产的内存使用量
         */
        /**
         * Dispose loaded asset
         * 释放已加载的资产
         */
        dispose(asset) {
            // 清空内容以帮助GC / Clear content to help GC
            asset.content = '';
        }
    }

    /**
     * Binary asset loader
     * 二进制资产加载器
     */
    /**
     * Binary loader implementation
     * 二进制加载器实现
     */
    class BinaryLoader {
        constructor() {
            this.supportedType = AssetType.Binary;
            this.supportedExtensions = [
                '.bin', '.dat', '.raw', '.bytes',
                '.wasm', '.so', '.dll', '.dylib'
            ];
        }
        /**
         * Load binary asset
         * 加载二进制资产
         */
        async load(path, metadata, options) {
            const startTime = performance.now();
            try {
                const response = await this.fetchWithTimeout(path, options?.timeout);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // 获取MIME类型 / Get MIME type
                const mimeType = response.headers.get('content-type') || undefined;
                // 获取总大小用于进度回调 / Get total size for progress callback
                const contentLength = response.headers.get('content-length');
                const total = contentLength ? parseInt(contentLength, 10) : 0;
                // 读取响应 / Read response
                let data;
                if (options?.onProgress && total > 0) {
                    data = await this.readResponseWithProgress(response, total, options.onProgress);
                }
                else {
                    data = await response.arrayBuffer();
                }
                const asset = {
                    data,
                    mimeType
                };
                return {
                    asset,
                    handle: 0,
                    metadata,
                    loadTime: performance.now() - startTime
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new AssetLoadError(`Failed to load binary: ${error.message}`, metadata.guid, AssetType.Binary, error);
                }
                throw AssetLoadError.fileNotFound(metadata.guid, path);
            }
        }
        /**
         * Fetch with timeout
         * 带超时的fetch
         */
        async fetchWithTimeout(url, timeout = 30000) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    mode: 'cors',
                    credentials: 'same-origin'
                });
                return response;
            }
            finally {
                clearTimeout(timeoutId);
            }
        }
        /**
         * Read response with progress
         * 带进度读取响应
         */
        async readResponseWithProgress(response, total, onProgress) {
            const reader = response.body?.getReader();
            if (!reader) {
                return response.arrayBuffer();
            }
            const chunks = [];
            let receivedLength = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                chunks.push(value);
                receivedLength += value.length;
                // 报告进度 / Report progress
                onProgress(receivedLength / total);
            }
            // 合并chunks到ArrayBuffer / Merge chunks into ArrayBuffer
            const result = new Uint8Array(receivedLength);
            let position = 0;
            for (const chunk of chunks) {
                result.set(chunk, position);
                position += chunk.length;
            }
            return result.buffer;
        }
        /**
         * Validate if the loader can handle this asset
         * 验证加载器是否可以处理此资产
         */
        canLoad(path, metadata) {
            const ext = path.toLowerCase().substring(path.lastIndexOf('.'));
            return this.supportedExtensions.includes(ext);
        }
        /**
         * Estimate memory usage for the asset
         * 估算资产的内存使用量
         */
        /**
         * Dispose loaded asset
         * 释放已加载的资产
         */
        dispose(asset) {
            // ArrayBuffer无法直接释放，但可以清空引用 / Can't directly release ArrayBuffer, but clear reference
            asset.data = null;
        }
    }

    /**
     * Asset loader factory implementation
     * 资产加载器工厂实现
     */
    /**
     * Asset loader factory
     * 资产加载器工厂
     */
    class AssetLoaderFactory {
        constructor() {
            this._loaders = new Map();
            // 注册默认加载器 / Register default loaders
            this.registerDefaultLoaders();
        }
        /**
         * Register default loaders
         * 注册默认加载器
         */
        registerDefaultLoaders() {
            // 纹理加载器 / Texture loader
            this._loaders.set(AssetType.Texture, new TextureLoader());
            // JSON加载器 / JSON loader
            this._loaders.set(AssetType.Json, new JsonLoader());
            // 文本加载器 / Text loader
            this._loaders.set(AssetType.Text, new TextLoader());
            // 二进制加载器 / Binary loader
            this._loaders.set(AssetType.Binary, new BinaryLoader());
            // TODO: 添加更多默认加载器 / Add more default loaders
            // - MeshLoader
            // - AudioLoader
            // - MaterialLoader
            // - PrefabLoader
            // - SceneLoader
        }
        /**
         * Create loader for specific asset type
         * 为特定资产类型创建加载器
         */
        createLoader(type) {
            return this._loaders.get(type) || null;
        }
        /**
         * Register custom loader
         * 注册自定义加载器
         */
        registerLoader(type, loader) {
            this._loaders.set(type, loader);
        }
        /**
         * Unregister loader
         * 注销加载器
         */
        unregisterLoader(type) {
            this._loaders.delete(type);
        }
        /**
         * Check if loader exists for type
         * 检查类型是否有加载器
         */
        hasLoader(type) {
            return this._loaders.has(type);
        }
        /**
         * Get all registered loaders
         * 获取所有注册的加载器
         */
        getRegisteredTypes() {
            return Array.from(this._loaders.keys());
        }
        /**
         * Clear all loaders
         * 清空所有加载器
         */
        clear() {
            this._loaders.clear();
        }
    }

    /**
     * Asset database for managing asset metadata
     * 用于管理资产元数据的资产数据库
     */
    /**
     * Asset database implementation
     * 资产数据库实现
     */
    class AssetDatabase {
        constructor() {
            this._metadata = new Map();
            this._pathToGuid = new Map();
            this._typeToGuids = new Map();
            this._labelToGuids = new Map();
            this._dependencies = new Map();
            this._dependents = new Map();
        }
        /**
         * Add asset to database
         * 添加资产到数据库
         */
        addAsset(metadata) {
            const { guid, path, type, labels, dependencies } = metadata;
            // 存储元数据 / Store metadata
            this._metadata.set(guid, metadata);
            this._pathToGuid.set(path, guid);
            // 按类型索引 / Index by type
            if (!this._typeToGuids.has(type)) {
                this._typeToGuids.set(type, new Set());
            }
            this._typeToGuids.get(type).add(guid);
            // 按标签索引 / Index by labels
            labels.forEach(label => {
                if (!this._labelToGuids.has(label)) {
                    this._labelToGuids.set(label, new Set());
                }
                this._labelToGuids.get(label).add(guid);
            });
            // 建立依赖关系 / Establish dependencies
            this.updateDependencies(guid, dependencies);
        }
        /**
         * Remove asset from database
         * 从数据库移除资产
         */
        removeAsset(guid) {
            const metadata = this._metadata.get(guid);
            if (!metadata)
                return;
            // 清理元数据 / Clean up metadata
            this._metadata.delete(guid);
            this._pathToGuid.delete(metadata.path);
            // 清理类型索引 / Clean up type index
            const typeSet = this._typeToGuids.get(metadata.type);
            if (typeSet) {
                typeSet.delete(guid);
                if (typeSet.size === 0) {
                    this._typeToGuids.delete(metadata.type);
                }
            }
            // 清理标签索引 / Clean up label indices
            metadata.labels.forEach(label => {
                const labelSet = this._labelToGuids.get(label);
                if (labelSet) {
                    labelSet.delete(guid);
                    if (labelSet.size === 0) {
                        this._labelToGuids.delete(label);
                    }
                }
            });
            // 清理依赖关系 / Clean up dependencies
            this.clearDependencies(guid);
        }
        /**
         * Update asset metadata
         * 更新资产元数据
         */
        updateAsset(guid, updates) {
            const metadata = this._metadata.get(guid);
            if (!metadata)
                return;
            // 如果路径改变，更新索引 / Update index if path changed
            if (updates.path && updates.path !== metadata.path) {
                this._pathToGuid.delete(metadata.path);
                this._pathToGuid.set(updates.path, guid);
            }
            // 如果类型改变，更新索引 / Update index if type changed
            if (updates.type && updates.type !== metadata.type) {
                const oldTypeSet = this._typeToGuids.get(metadata.type);
                if (oldTypeSet) {
                    oldTypeSet.delete(guid);
                }
                if (!this._typeToGuids.has(updates.type)) {
                    this._typeToGuids.set(updates.type, new Set());
                }
                this._typeToGuids.get(updates.type).add(guid);
            }
            // 如果依赖改变，更新关系 / Update relations if dependencies changed
            if (updates.dependencies) {
                this.updateDependencies(guid, updates.dependencies);
            }
            // 合并更新 / Merge updates
            Object.assign(metadata, updates);
            metadata.lastModified = Date.now();
            metadata.version++;
        }
        /**
         * Get asset metadata
         * 获取资产元数据
         */
        getMetadata(guid) {
            return this._metadata.get(guid);
        }
        /**
         * Get metadata by path
         * 通过路径获取元数据
         */
        getMetadataByPath(path) {
            const guid = this._pathToGuid.get(path);
            return guid ? this._metadata.get(guid) : undefined;
        }
        /**
         * Find assets by type
         * 按类型查找资产
         */
        findAssetsByType(type) {
            const guids = this._typeToGuids.get(type);
            return guids ? Array.from(guids) : [];
        }
        /**
         * Find assets by label
         * 按标签查找资产
         */
        findAssetsByLabel(label) {
            const guids = this._labelToGuids.get(label);
            return guids ? Array.from(guids) : [];
        }
        /**
         * Find assets by multiple labels (AND operation)
         * 按多个标签查找资产（AND操作）
         */
        findAssetsByLabels(labels) {
            if (labels.length === 0)
                return [];
            let result = null;
            for (const label of labels) {
                const labelGuids = this._labelToGuids.get(label);
                if (!labelGuids || labelGuids.size === 0)
                    return [];
                if (!result) {
                    result = new Set(labelGuids);
                }
                else {
                    // 交集 / Intersection
                    const intersection = new Set();
                    labelGuids.forEach(guid => {
                        if (result.has(guid)) {
                            intersection.add(guid);
                        }
                    });
                    result = intersection;
                }
            }
            return result ? Array.from(result) : [];
        }
        /**
         * Search assets by query
         * 通过查询搜索资产
         */
        searchAssets(query) {
            let results = Array.from(this._metadata.keys());
            // 按名称过滤 / Filter by name
            if (query.name) {
                const nameLower = query.name.toLowerCase();
                results = results.filter(guid => {
                    const metadata = this._metadata.get(guid);
                    return metadata.name.toLowerCase().includes(nameLower);
                });
            }
            // 按类型过滤 / Filter by type
            if (query.type) {
                const typeGuids = this._typeToGuids.get(query.type);
                if (!typeGuids)
                    return [];
                results = results.filter(guid => typeGuids.has(guid));
            }
            // 按标签过滤 / Filter by labels
            if (query.labels && query.labels.length > 0) {
                const labelResults = this.findAssetsByLabels(query.labels);
                const labelSet = new Set(labelResults);
                results = results.filter(guid => labelSet.has(guid));
            }
            // 按路径过滤 / Filter by path
            if (query.path) {
                const pathLower = query.path.toLowerCase();
                results = results.filter(guid => {
                    const metadata = this._metadata.get(guid);
                    return metadata.path.toLowerCase().includes(pathLower);
                });
            }
            return results;
        }
        /**
         * Get asset dependencies
         * 获取资产依赖
         */
        getDependencies(guid) {
            const deps = this._dependencies.get(guid);
            return deps ? Array.from(deps) : [];
        }
        /**
         * Get asset dependents (assets that depend on this one)
         * 获取资产的依赖者（依赖此资产的其他资产）
         */
        getDependents(guid) {
            const deps = this._dependents.get(guid);
            return deps ? Array.from(deps) : [];
        }
        /**
         * Get all dependencies recursively
         * 递归获取所有依赖
         */
        getAllDependencies(guid, visited = new Set()) {
            if (visited.has(guid))
                return [];
            visited.add(guid);
            const result = [];
            const directDeps = this.getDependencies(guid);
            for (const dep of directDeps) {
                result.push(dep);
                const transitiveDeps = this.getAllDependencies(dep, visited);
                result.push(...transitiveDeps);
            }
            return result;
        }
        /**
         * Check for circular dependencies
         * 检查循环依赖
         */
        hasCircularDependency(guid) {
            const visited = new Set();
            const recursionStack = new Set();
            const checkCycle = (current) => {
                visited.add(current);
                recursionStack.add(current);
                const deps = this.getDependencies(current);
                for (const dep of deps) {
                    if (!visited.has(dep)) {
                        if (checkCycle(dep))
                            return true;
                    }
                    else if (recursionStack.has(dep)) {
                        return true;
                    }
                }
                recursionStack.delete(current);
                return false;
            };
            return checkCycle(guid);
        }
        /**
         * Update dependencies
         * 更新依赖关系
         */
        updateDependencies(guid, newDependencies) {
            // 清除旧的依赖关系 / Clear old dependencies
            this.clearDependencies(guid);
            // 建立新的依赖关系 / Establish new dependencies
            if (newDependencies.length > 0) {
                this._dependencies.set(guid, new Set(newDependencies));
                // 更新被依赖关系 / Update dependent relations
                newDependencies.forEach(dep => {
                    if (!this._dependents.has(dep)) {
                        this._dependents.set(dep, new Set());
                    }
                    this._dependents.get(dep).add(guid);
                });
            }
        }
        /**
         * Clear dependencies
         * 清除依赖关系
         */
        clearDependencies(guid) {
            // 清除依赖 / Clear dependencies
            const deps = this._dependencies.get(guid);
            if (deps) {
                deps.forEach(dep => {
                    const dependents = this._dependents.get(dep);
                    if (dependents) {
                        dependents.delete(guid);
                        if (dependents.size === 0) {
                            this._dependents.delete(dep);
                        }
                    }
                });
                this._dependencies.delete(guid);
            }
            // 清除被依赖 / Clear dependents
            const dependents = this._dependents.get(guid);
            if (dependents) {
                dependents.forEach(dependent => {
                    const dependencies = this._dependencies.get(dependent);
                    if (dependencies) {
                        dependencies.delete(guid);
                        if (dependencies.size === 0) {
                            this._dependencies.delete(dependent);
                        }
                    }
                });
                this._dependents.delete(guid);
            }
        }
        /**
         * Get database statistics
         * 获取数据库统计
         */
        getStatistics() {
            const assetsByType = new Map();
            this._typeToGuids.forEach((guids, type) => {
                assetsByType.set(type, guids.size);
            });
            let circularDependencies = 0;
            this._metadata.forEach((_, guid) => {
                if (this.hasCircularDependency(guid)) {
                    circularDependencies++;
                }
            });
            return {
                totalAssets: this._metadata.size,
                assetsByType,
                totalDependencies: Array.from(this._dependencies.values()).reduce((sum, deps) => sum + deps.size, 0),
                assetsWithDependencies: this._dependencies.size,
                circularDependencies
            };
        }
        /**
         * Export to catalog entries
         * 导出为目录条目
         */
        exportToCatalog() {
            const entries = [];
            this._metadata.forEach(metadata => {
                entries.push({
                    guid: metadata.guid,
                    path: metadata.path,
                    type: metadata.type,
                    size: metadata.size,
                    hash: metadata.hash
                });
            });
            return entries;
        }
        /**
         * Clear database
         * 清空数据库
         */
        clear() {
            this._metadata.clear();
            this._pathToGuid.clear();
            this._typeToGuids.clear();
            this._labelToGuids.clear();
            this._dependencies.clear();
            this._dependents.clear();
        }
    }

    /**
     * Asset manager implementation
     * 资产管理器实现
     */
    /**
     * Asset manager implementation
     * 资产管理器实现
     */
    class AssetManager {
        constructor(catalog) {
            this._assets = new Map();
            this._handleToGuid = new Map();
            this._pathToGuid = new Map();
            this._nextHandle = 1;
            this._statistics = {
                loadedCount: 0,
                failedCount: 0
            };
            this._isDisposed = false;
            this._loadingCount = 0;
            this._cache = new AssetCache();
            this._loadQueue = new AssetLoadQueue();
            this._loaderFactory = new AssetLoaderFactory();
            this._database = new AssetDatabase();
            // 如果提供了目录，初始化数据库 / Initialize database if catalog provided
            if (catalog) {
                this.initializeFromCatalog(catalog);
            }
        }
        /**
         * Initialize from catalog
         * 从目录初始化
         */
        initializeFromCatalog(catalog) {
            catalog.entries.forEach((entry, guid) => {
                const metadata = {
                    guid,
                    path: entry.path,
                    type: entry.type,
                    name: entry.path.split('/').pop() || '',
                    size: entry.size,
                    hash: entry.hash,
                    dependencies: [],
                    labels: [],
                    tags: new Map(),
                    lastModified: Date.now(),
                    version: 1
                };
                this._database.addAsset(metadata);
                this._pathToGuid.set(entry.path, guid);
            });
        }
        /**
         * Load asset by GUID
         * 通过GUID加载资产
         */
        async loadAsset(guid, options) {
            // 检查是否已加载 / Check if already loaded
            const entry = this._assets.get(guid);
            if (entry) {
                if (entry.state === AssetState.Loaded && !options?.forceReload) {
                    entry.lastAccessTime = Date.now();
                    return {
                        asset: entry.asset,
                        handle: entry.handle,
                        metadata: entry.metadata,
                        loadTime: 0
                    };
                }
                if (entry.state === AssetState.Loading && entry.loadPromise) {
                    return entry.loadPromise;
                }
            }
            // 获取元数据 / Get metadata
            const metadata = this._database.getMetadata(guid);
            if (!metadata) {
                throw AssetLoadError.fileNotFound(guid, 'Unknown');
            }
            // 创建加载器 / Create loader
            const loader = this._loaderFactory.createLoader(metadata.type);
            if (!loader) {
                throw AssetLoadError.unsupportedType(guid, metadata.type);
            }
            // 开始加载 / Start loading
            const loadStartTime = performance.now();
            const newEntry = {
                guid,
                handle: this._nextHandle++,
                asset: null,
                metadata,
                state: AssetState.Loading,
                referenceCount: 0,
                lastAccessTime: Date.now()
            };
            this._assets.set(guid, newEntry);
            this._handleToGuid.set(newEntry.handle, guid);
            this._loadingCount++;
            // 创建加载Promise / Create loading promise
            const loadPromise = this.performLoad(loader, metadata, options, loadStartTime, newEntry);
            newEntry.loadPromise = loadPromise;
            try {
                const result = await loadPromise;
                return result;
            }
            catch (error) {
                this._statistics.failedCount++;
                newEntry.state = AssetState.Failed;
                throw error;
            }
            finally {
                this._loadingCount--;
                delete newEntry.loadPromise;
            }
        }
        /**
         * Perform asset loading
         * 执行资产加载
         */
        async performLoad(loader, metadata, options, startTime, entry) {
            // 加载依赖 / Load dependencies
            if (metadata.dependencies.length > 0) {
                await this.loadDependencies(metadata.dependencies, options);
            }
            // 执行加载 / Execute loading
            const result = await loader.load(metadata.path, metadata, options);
            // 更新条目 / Update entry
            entry.asset = result.asset;
            entry.state = AssetState.Loaded;
            // 缓存资产 / Cache asset
            this._cache.set(metadata.guid, result.asset);
            // 更新统计 / Update statistics
            this._statistics.loadedCount++;
            const loadResult = {
                asset: result.asset,
                handle: entry.handle,
                metadata,
                loadTime: performance.now() - startTime
            };
            return loadResult;
        }
        /**
         * Load dependencies
         * 加载依赖
         */
        async loadDependencies(dependencies, options) {
            const promises = dependencies.map(dep => this.loadAsset(dep, options));
            await Promise.all(promises);
        }
        /**
         * Load asset by path
         * 通过路径加载资产
         */
        async loadAssetByPath(path, options) {
            const guid = this._pathToGuid.get(path);
            if (!guid) {
                // 尝试从数据库查找 / Try to find from database
                let metadata = this._database.getMetadataByPath(path);
                if (!metadata) {
                    // 动态创建元数据 / Create metadata dynamically
                    const fileExt = path.substring(path.lastIndexOf('.')).toLowerCase();
                    let assetType = AssetType.Custom;
                    // 根据文件扩展名确定资产类型 / Determine asset type by file extension
                    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(fileExt)) {
                        assetType = AssetType.Texture;
                    }
                    else if (['.json'].includes(fileExt)) {
                        assetType = AssetType.Json;
                    }
                    else if (['.txt', '.md', '.xml', '.yaml'].includes(fileExt)) {
                        assetType = AssetType.Text;
                    }
                    // 生成唯一GUID / Generate unique GUID
                    const dynamicGuid = `dynamic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    metadata = {
                        guid: dynamicGuid,
                        path: path,
                        type: assetType,
                        name: path.split('/').pop() || path.split('\\').pop() || 'unnamed',
                        size: 0, // 动态加载时未知大小 / Unknown size for dynamic loading
                        hash: '',
                        dependencies: [],
                        labels: [],
                        tags: new Map(),
                        lastModified: Date.now(),
                        version: 1
                    };
                    // 注册到数据库 / Register to database
                    this._database.addAsset(metadata);
                    this._pathToGuid.set(path, metadata.guid);
                }
                else {
                    this._pathToGuid.set(path, metadata.guid);
                }
                return this.loadAsset(metadata.guid, options);
            }
            return this.loadAsset(guid, options);
        }
        /**
         * Load multiple assets
         * 批量加载资产
         */
        async loadAssets(guids, options) {
            const results = new Map();
            // 并行加载所有资产 / Load all assets in parallel
            const promises = guids.map(async (guid) => {
                try {
                    const result = await this.loadAsset(guid, options);
                    results.set(guid, result);
                }
                catch (error) {
                    console.error(`Failed to load asset ${guid}:`, error);
                }
            });
            await Promise.all(promises);
            return results;
        }
        /**
         * Preload asset group
         * 预加载资产组
         */
        async preloadGroup(group, onProgress) {
            const totalCount = group.assets.length;
            let loadedCount = 0;
            let loadedBytes = 0;
            let totalBytes = 0;
            // 计算总大小 / Calculate total size
            for (const guid of group.assets) {
                const metadata = this._database.getMetadata(guid);
                if (metadata) {
                    totalBytes += metadata.size;
                }
            }
            // 加载每个资产 / Load each asset
            for (const guid of group.assets) {
                const metadata = this._database.getMetadata(guid);
                if (!metadata)
                    continue;
                if (onProgress) {
                    onProgress({
                        currentAsset: metadata.name,
                        loadedCount,
                        totalCount,
                        loadedBytes,
                        totalBytes,
                        progress: loadedCount / totalCount
                    });
                }
                await this.loadAsset(guid, { priority: group.priority });
                loadedCount++;
                loadedBytes += metadata.size;
            }
            // 最终进度 / Final progress
            if (onProgress) {
                onProgress({
                    currentAsset: '',
                    loadedCount: totalCount,
                    totalCount,
                    loadedBytes: totalBytes,
                    totalBytes,
                    progress: 1
                });
            }
        }
        /**
         * Get loaded asset
         * 获取已加载的资产
         */
        getAsset(guid) {
            const entry = this._assets.get(guid);
            if (entry && entry.state === AssetState.Loaded) {
                entry.lastAccessTime = Date.now();
                return entry.asset;
            }
            return null;
        }
        /**
         * Get asset by handle
         * 通过句柄获取资产
         */
        getAssetByHandle(handle) {
            const guid = this._handleToGuid.get(handle);
            if (!guid)
                return null;
            return this.getAsset(guid);
        }
        /**
         * Check if asset is loaded
         * 检查资产是否已加载
         */
        isLoaded(guid) {
            const entry = this._assets.get(guid);
            return entry?.state === AssetState.Loaded;
        }
        /**
         * Get asset state
         * 获取资产状态
         */
        getAssetState(guid) {
            const entry = this._assets.get(guid);
            return entry?.state || AssetState.Unloaded;
        }
        /**
         * Unload asset
         * 卸载资产
         */
        unloadAsset(guid) {
            const entry = this._assets.get(guid);
            if (!entry)
                return;
            // 检查引用计数 / Check reference count
            if (entry.referenceCount > 0) {
                console.warn(`Cannot unload asset ${guid} with ${entry.referenceCount} references`);
                return;
            }
            // 获取加载器以释放资源 / Get loader to dispose resources
            const loader = this._loaderFactory.createLoader(entry.metadata.type);
            if (loader) {
                loader.dispose(entry.asset);
            }
            // 清理条目 / Clean up entry
            this._handleToGuid.delete(entry.handle);
            this._assets.delete(guid);
            this._cache.remove(guid);
            // 更新统计 / Update statistics
            this._statistics.loadedCount--;
            entry.state = AssetState.Unloaded;
        }
        /**
         * Unload all assets
         * 卸载所有资产
         */
        unloadAllAssets() {
            const guids = Array.from(this._assets.keys());
            guids.forEach(guid => this.unloadAsset(guid));
        }
        /**
         * Unload unused assets
         * 卸载未使用的资产
         */
        unloadUnusedAssets() {
            const guids = Array.from(this._assets.keys());
            guids.forEach(guid => {
                const entry = this._assets.get(guid);
                if (entry && entry.referenceCount === 0) {
                    this.unloadAsset(guid);
                }
            });
        }
        /**
         * Add reference to asset
         * 增加资产引用
         */
        addReference(guid) {
            const entry = this._assets.get(guid);
            if (entry) {
                entry.referenceCount++;
            }
        }
        /**
         * Remove reference from asset
         * 移除资产引用
         */
        removeReference(guid) {
            const entry = this._assets.get(guid);
            if (entry && entry.referenceCount > 0) {
                entry.referenceCount--;
            }
        }
        /**
         * Get reference info
         * 获取引用信息
         */
        getReferenceInfo(guid) {
            const entry = this._assets.get(guid);
            if (!entry)
                return null;
            return {
                guid,
                handle: entry.handle,
                referenceCount: entry.referenceCount,
                lastAccessTime: entry.lastAccessTime,
                state: entry.state
            };
        }
        /**
         * Register custom loader
         * 注册自定义加载器
         */
        registerLoader(type, loader) {
            this._loaderFactory.registerLoader(type, loader);
        }
        /**
         * Get asset statistics
         * 获取资产统计信息
         */
        getStatistics() {
            return {
                loadedCount: this._statistics.loadedCount,
                loadQueue: this._loadQueue.getSize(),
                failedCount: this._statistics.failedCount
            };
        }
        /**
         * Clear cache
         * 清空缓存
         */
        clearCache() {
            this._cache.clear();
        }
        /**
         * Dispose manager
         * 释放管理器
         */
        dispose() {
            if (this._isDisposed)
                return;
            this.unloadAllAssets();
            this._cache.clear();
            this._loadQueue.clear();
            this._assets.clear();
            this._handleToGuid.clear();
            this._pathToGuid.clear();
            this._isDisposed = true;
        }
    }

    /**
     * Asset path resolver for different platforms and protocols
     * 不同平台和协议的资产路径解析器
     */
    /**
     * Asset path resolver
     * 资产路径解析器
     */
    class AssetPathResolver {
        constructor(config = {}) {
            this.config = {
                baseUrl: '',
                assetDir: 'assets',
                platform: AssetPlatform.H5,
                ...config
            };
        }
        /**
         * Update configuration
         * 更新配置
         */
        updateConfig(config) {
            this.config = { ...this.config, ...config };
        }
        /**
         * Resolve asset path to full URL
         * 解析资产路径为完整URL
         */
        resolve(path) {
            // Already a full URL
            // 已经是完整URL
            if (this.isAbsoluteUrl(path)) {
                return path;
            }
            // Data URL
            // 数据URL
            if (path.startsWith('data:')) {
                return path;
            }
            // Apply custom transformer if provided
            // 应用自定义转换器（如果提供）
            if (this.config.pathTransformer) {
                path = this.config.pathTransformer(path);
            }
            // Platform-specific resolution
            // 平台特定解析
            switch (this.config.platform) {
                case AssetPlatform.H5:
                    return this.resolveH5Path(path);
                case AssetPlatform.WeChat:
                    return this.resolveWeChatPath(path);
                case AssetPlatform.Playable:
                    return this.resolvePlayablePath(path);
                case AssetPlatform.Android:
                case AssetPlatform.iOS:
                    return this.resolveMobilePath(path);
                case AssetPlatform.Editor:
                    return this.resolveEditorPath(path);
                default:
                    return this.resolveH5Path(path);
            }
        }
        /**
         * Resolve path for H5 platform
         * 解析H5平台路径
         */
        resolveH5Path(path) {
            // Remove leading slash if present
            // 移除开头的斜杠（如果存在）
            path = path.replace(/^\//, '');
            // Combine with base URL and asset directory
            // 与基础URL和资产目录结合
            const base = this.config.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
            const assetDir = this.config.assetDir || 'assets';
            return `${base}/${assetDir}/${path}`.replace(/\/+/g, '/');
        }
        /**
         * Resolve path for WeChat Mini Game
         * 解析微信小游戏路径
         */
        resolveWeChatPath(path) {
            // WeChat mini games use relative paths
            // 微信小游戏使用相对路径
            return `${this.config.assetDir}/${path}`.replace(/\/+/g, '/');
        }
        /**
         * Resolve path for Playable Ads platform
         * 解析试玩广告平台路径
         */
        resolvePlayablePath(path) {
            // Playable ads typically use base64 embedded resources or relative paths
            // 试玩广告通常使用base64内嵌资源或相对路径
            // If custom transformer is provided (e.g., for base64 encoding)
            // 如果提供了自定义转换器（例如用于base64编码）
            if (this.config.pathTransformer) {
                return this.config.pathTransformer(path);
            }
            // Default to relative path without directory prefix
            // 默认使用不带目录前缀的相对路径
            return path;
        }
        /**
         * Resolve path for mobile platform (Android/iOS)
         * 解析移动平台路径（Android/iOS）
         */
        resolveMobilePath(path) {
            // Mobile platforms use relative paths or file:// protocol
            // 移动平台使用相对路径或file://协议
            return `./${this.config.assetDir}/${path}`.replace(/\/+/g, '/');
        }
        /**
         * Resolve path for Editor platform (Tauri)
         * 解析编辑器平台路径（Tauri）
         */
        resolveEditorPath(path) {
            // For Tauri editor, use pathTransformer if provided
            // 对于Tauri编辑器，使用pathTransformer（如果提供）
            if (this.config.pathTransformer) {
                return this.config.pathTransformer(path);
            }
            // Fallback to asset protocol
            // 回退到asset协议
            return `asset://localhost/${path}`;
        }
        /**
         * Check if path is absolute URL
         * 检查路径是否为绝对URL
         */
        isAbsoluteUrl(path) {
            return /^(https?:\/\/|file:\/\/|asset:\/\/)/.test(path);
        }
        /**
         * Get asset directory from path
         * 从路径获取资产目录
         */
        getAssetDirectory(path) {
            const resolved = this.resolve(path);
            const lastSlash = resolved.lastIndexOf('/');
            return lastSlash >= 0 ? resolved.substring(0, lastSlash) : '';
        }
        /**
         * Get asset filename from path
         * 从路径获取资产文件名
         */
        getAssetFilename(path) {
            const resolved = this.resolve(path);
            const lastSlash = resolved.lastIndexOf('/');
            return lastSlash >= 0 ? resolved.substring(lastSlash + 1) : resolved;
        }
        /**
         * Join paths
         * 连接路径
         */
        join(...paths) {
            return paths.join('/').replace(/\/+/g, '/');
        }
        /**
         * Normalize path
         * 规范化路径
         */
        normalize(path) {
            return path.replace(/\\/g, '/').replace(/\/+/g, '/');
        }
    }
    /**
     * Global asset path resolver instance
     * 全局资产路径解析器实例
     */
    new AssetPathResolver();

    /**
     * Engine integration for asset system
     * 资产系统的引擎集成
     */
    /**
     * Asset system engine integration
     * 资产系统引擎集成
     */
    class EngineIntegration {
        constructor(assetManager, engineBridge) {
            this._textureIdMap = new Map();
            this._pathToTextureId = new Map();
            this._assetManager = assetManager;
            this._engineBridge = engineBridge;
        }
        /**
         * Set engine bridge
         * 设置引擎桥接
         */
        setEngineBridge(bridge) {
            this._engineBridge = bridge;
        }
        /**
         * Load texture for component
         * 为组件加载纹理
         */
        async loadTextureForComponent(texturePath) {
            // 检查是否已有纹理ID / Check if texture ID exists
            const existingId = this._pathToTextureId.get(texturePath);
            if (existingId) {
                return existingId;
            }
            // 通过资产系统加载 / Load through asset system
            const result = await this._assetManager.loadAssetByPath(texturePath);
            const textureAsset = result.asset;
            // 如果有引擎桥接，上传到GPU / Upload to GPU if bridge exists
            if (this._engineBridge && textureAsset.data) {
                await this._engineBridge.loadTexture(textureAsset.textureId, texturePath);
            }
            // 缓存映射 / Cache mapping
            this._pathToTextureId.set(texturePath, textureAsset.textureId);
            return textureAsset.textureId;
        }
        /**
         * Load texture by GUID
         * 通过GUID加载纹理
         */
        async loadTextureByGuid(guid) {
            // 检查是否已有纹理ID / Check if texture ID exists
            const existingId = this._textureIdMap.get(guid);
            if (existingId) {
                return existingId;
            }
            // 通过资产系统加载 / Load through asset system
            const result = await this._assetManager.loadAsset(guid);
            const textureAsset = result.asset;
            // 如果有引擎桥接，上传到GPU / Upload to GPU if bridge exists
            if (this._engineBridge && textureAsset.data) {
                const metadata = result.metadata;
                await this._engineBridge.loadTexture(textureAsset.textureId, metadata.path);
            }
            // 缓存映射 / Cache mapping
            this._textureIdMap.set(guid, textureAsset.textureId);
            return textureAsset.textureId;
        }
        /**
         * Batch load textures
         * 批量加载纹理
         */
        async loadTexturesBatch(paths) {
            const results = new Map();
            // 收集需要加载的纹理 / Collect textures to load
            const toLoad = [];
            for (const path of paths) {
                const existingId = this._pathToTextureId.get(path);
                if (existingId) {
                    results.set(path, existingId);
                }
                else {
                    toLoad.push(path);
                }
            }
            if (toLoad.length === 0) {
                return results;
            }
            // 并行加载所有纹理 / Load all textures in parallel
            const loadPromises = toLoad.map(async (path) => {
                try {
                    const id = await this.loadTextureForComponent(path);
                    results.set(path, id);
                }
                catch (error) {
                    console.error(`Failed to load texture: ${path}`, error);
                    results.set(path, 0); // 使用默认纹理ID / Use default texture ID
                }
            });
            await Promise.all(loadPromises);
            return results;
        }
        /**
         * Unload texture
         * 卸载纹理
         */
        unloadTexture(textureId) {
            // 从引擎卸载 / Unload from engine
            if (this._engineBridge) {
                this._engineBridge.unloadTexture(textureId);
            }
            // 清理映射 / Clean up mappings
            for (const [path, id] of this._pathToTextureId.entries()) {
                if (id === textureId) {
                    this._pathToTextureId.delete(path);
                    break;
                }
            }
            for (const [guid, id] of this._textureIdMap.entries()) {
                if (id === textureId) {
                    this._textureIdMap.delete(guid);
                    // 也从资产管理器卸载 / Also unload from asset manager
                    this._assetManager.unloadAsset(guid);
                    break;
                }
            }
        }
        /**
         * Get texture ID for path
         * 获取路径的纹理ID
         */
        getTextureId(path) {
            return this._pathToTextureId.get(path) || null;
        }
        /**
         * Preload textures for scene
         * 为场景预加载纹理
         */
        async preloadSceneTextures(texturePaths) {
            await this.loadTexturesBatch(texturePaths);
        }
        /**
         * Clear all texture mappings
         * 清空所有纹理映射
         */
        clearTextureMappings() {
            this._textureIdMap.clear();
            this._pathToTextureId.clear();
        }
        /**
         * Get statistics
         * 获取统计信息
         */
        getStatistics() {
            return {
                loadedTextures: this._pathToTextureId.size
            };
        }
    }

    /**
     * Asset System for ECS Framework
     * ECS框架的资产系统
     */
    // Types
    /**
     * Default asset manager instance
     * 默认资产管理器实例
     */
    new AssetManager();

    /**
     * Browser Runtime Entry Point
     * 浏览器运行时入口
     *
     * Uses the same Rust WASM engine as the editor
     * 使用与编辑器相同的 Rust WASM 引擎
     */
    class BrowserRuntime {
        /**
         * Convert file path to asset proxy URL
         * 将文件路径转换为资产代理URL
         */
        convertToAssetUrl(path) {
            // If already a URL, return as-is
            if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/asset?')) {
                return path;
            }
            // Use asset proxy endpoint for local file paths
            // 使用资产代理端点访问本地文件路径
            return `/asset?path=${encodeURIComponent(path)}`;
        }
        constructor(config) {
            this.animationId = null;
            this.texturePathToId = new Map();
            // Initialize Core if not already created
            if (!Core.Instance) {
                Core.create();
            }
            // Initialize Core.scene if not already initialized
            if (!Core.scene) {
                const runtimeScene = new Scene({ name: 'Runtime Scene' });
                Core.setScene(runtimeScene);
            }
            // Initialize Rust WASM engine bridge
            this.bridge = new EngineBridge({
                canvasId: config.canvasId,
                width: config.width || window.innerWidth,
                height: config.height || window.innerHeight
            });
            // Initialize asset system
            // 初始化资产系统
            this.assetManager = new AssetManager();
            this.engineIntegration = new EngineIntegration(this.assetManager, this.bridge);
            // Add camera system (updates before render)
            this.cameraSystem = new CameraSystem(this.bridge);
            Core.scene.addSystem(this.cameraSystem);
            // Add sprite animator system
            this.animatorSystem = new SpriteAnimatorSystem();
            Core.scene.addSystem(this.animatorSystem);
            // Add render system
            this.renderSystem = new EngineRenderSystem(this.bridge, TransformComponent);
            Core.scene.addSystem(this.renderSystem);
        }
        async initialize(wasmModule) {
            await this.bridge.initializeWithModule(wasmModule);
            // Disable editor tools for game runtime
            this.bridge.setShowGrid(false);
            this.bridge.setShowGizmos(false);
        }
        async loadScene(sceneUrl) {
            try {
                const response = await fetch(sceneUrl);
                const sceneJson = await response.text();
                if (!Core.scene) {
                    throw new Error('Core.scene not initialized');
                }
                SceneSerializer.deserialize(Core.scene, sceneJson, {
                    strategy: 'replace',
                    preserveIds: true
                });
                // Load textures for all sprites in the scene
                // 为场景中的所有精灵加载纹理
                await this.loadSceneTextures();
                // Start auto-play animations
                // 启动自动播放的动画
                this.startAutoPlayAnimations();
                // Sync textures immediately after starting animations
                // 启动动画后立即同步纹理
                this.syncAnimatorTextures();
            }
            catch (error) {
                console.error('Failed to load scene:', error);
                throw error;
            }
        }
        /**
         * Start auto-play animations after scene load
         * 场景加载后启动自动播放的动画
         */
        startAutoPlayAnimations() {
            if (!Core.scene)
                return;
            for (const entity of Core.scene.entities.buffer) {
                const animator = entity.getComponent(SpriteAnimatorComponent);
                if (animator && animator.autoPlay && animator.defaultAnimation) {
                    animator.play();
                }
            }
        }
        /**
         * Load textures for all sprites in the scene
         * 为场景中的所有精灵加载纹理
         */
        async loadSceneTextures() {
            if (!Core.scene)
                return;
            // Find all sprites in the scene
            const sprites = [];
            // Collect all unique texture paths from animators
            const animatorTextures = new Set();
            for (const entity of Core.scene.entities.buffer) {
                const sprite = entity.getComponent(SpriteComponent);
                if (sprite && sprite.texture && sprite.texture !== '') {
                    // Convert local file paths to server asset proxy URL
                    // 将本地文件路径转换为服务器资产代理URL
                    const texturePath = this.convertToAssetUrl(sprite.texture);
                    sprites.push({ sprite, texturePath });
                }
                // Collect textures from SpriteAnimator clips
                const animator = entity.getComponent(SpriteAnimatorComponent);
                if (animator && animator.clips) {
                    for (const clip of animator.clips) {
                        for (const frame of clip.frames) {
                            if (frame.texture) {
                                const texturePath = this.convertToAssetUrl(frame.texture);
                                animatorTextures.add(texturePath);
                            }
                        }
                    }
                }
            }
            // Load sprite textures
            const loadPromises = sprites.map(async ({ sprite, texturePath }) => {
                try {
                    const textureId = await this.engineIntegration.loadTextureForComponent(texturePath);
                    sprite.textureId = textureId;
                    this.texturePathToId.set(texturePath, textureId);
                }
                catch (error) {
                    console.error(`Failed to load texture ${texturePath}:`, error);
                    // Set to 0 to use default white texture
                    sprite.textureId = 0;
                }
            });
            // Preload animator textures and build mapping
            const animatorLoadPromises = Array.from(animatorTextures).map(async (texturePath) => {
                try {
                    const textureId = await this.engineIntegration.loadTextureForComponent(texturePath);
                    this.texturePathToId.set(texturePath, textureId);
                }
                catch (error) {
                    console.error(`Failed to preload animator texture ${texturePath}:`, error);
                }
            });
            await Promise.all([...loadPromises, ...animatorLoadPromises]);
        }
        /**
         * Sync sprite textureId based on texture path
         * 根据纹理路径同步精灵的textureId
         */
        syncAnimatorTextures() {
            if (!Core.scene)
                return;
            for (const entity of Core.scene.entities.buffer) {
                const sprite = entity.getComponent(SpriteComponent);
                const animator = entity.getComponent(SpriteAnimatorComponent);
                if (sprite && animator) {
                    // Get current frame texture from animator
                    const frame = animator.getCurrentFrame();
                    if (frame && frame.texture) {
                        const texturePath = this.convertToAssetUrl(frame.texture);
                        const textureId = this.texturePathToId.get(texturePath);
                        if (textureId !== undefined) {
                            if (sprite.textureId !== textureId) {
                                sprite.textureId = textureId;
                            }
                        }
                    }
                }
            }
        }
        start() {
            if (this.animationId !== null)
                return;
            let lastTime = performance.now();
            const loop = () => {
                const currentTime = performance.now();
                const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
                lastTime = currentTime;
                // Update Core (includes Time.update and all scenes)
                Core.update(deltaTime);
                if (Core.scene) {
                    // Sync textureId for animated sprites
                    this.syncAnimatorTextures();
                }
                this.animationId = requestAnimationFrame(loop);
            };
            loop();
        }
        stop() {
            if (this.animationId !== null) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
        handleResize(width, height) {
            this.bridge.resize(width, height);
        }
        /**
         * Load texture for sprite
         * 为精灵加载纹理
         */
        async loadTextureForSprite(sprite, texturePath) {
            try {
                const textureId = await this.engineIntegration.loadTextureForComponent(texturePath);
                sprite.textureId = textureId;
            }
            catch (error) {
                console.error(`Failed to load texture ${texturePath}:`, error);
            }
        }
        getAssetManager() {
            return this.assetManager;
        }
        getEngineIntegration() {
            return this.engineIntegration;
        }
    }
    // Export everything on a single object for IIFE bundle
    var runtime = {
        create: (config) => {
            const runtime = new BrowserRuntime(config);
            return runtime;
        },
        BrowserRuntime,
        Core,
        TransformComponent,
        SpriteComponent,
        SpriteAnimatorComponent,
        CameraComponent
    };

    return runtime;

})();
//# sourceMappingURL=runtime.browser.js.map
