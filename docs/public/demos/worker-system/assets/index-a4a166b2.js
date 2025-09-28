(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity)
      fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy)
      fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
class GlobalManager {
  constructor() {
    this._enabled = false;
  }
  /**
   * 获取或设置管理器是否启用
   */
  get enabled() {
    return this._enabled;
  }
  set enabled(value) {
    this.setEnabled(value);
  }
  /**
   * 设置管理器是否启用
   * @param isEnabled 如果为true，则启用管理器；否则禁用管理器
   */
  setEnabled(isEnabled) {
    if (this._enabled != isEnabled) {
      this._enabled = isEnabled;
      if (this._enabled) {
        this.onEnabled();
      } else {
        this.onDisabled();
      }
    }
  }
  /**
   * 在启用管理器时调用的回调方法
   */
  onEnabled() {
  }
  /**
   * 在禁用管理器时调用的回调方法
   */
  onDisabled() {
  }
  /**
   * 更新管理器状态的方法
   */
  update() {
  }
}
class Time {
  /**
   * 使用外部引擎提供的deltaTime更新时间信息
   * @param deltaTime 外部引擎提供的帧时间间隔（秒）
   */
  static update(deltaTime) {
    this.unscaledDeltaTime = deltaTime;
    this.deltaTime = deltaTime * this.timeScale;
    this.unscaledTotalTime += this.unscaledDeltaTime;
    this.totalTime += this.deltaTime;
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
Time.deltaTime = 0;
Time.unscaledDeltaTime = 0;
Time.totalTime = 0;
Time.unscaledTotalTime = 0;
Time.timeScale = 1;
Time.frameCount = 0;
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
class TimerManager extends GlobalManager {
  constructor() {
    super(...arguments);
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
    let timer = new Timer();
    timer.initialize(timeInSeconds, repeats, context, onTime);
    this._timers.push(timer);
    return timer;
  }
}
var PerformanceWarningType;
(function(PerformanceWarningType2) {
  PerformanceWarningType2["HIGH_EXECUTION_TIME"] = "high_execution_time";
  PerformanceWarningType2["HIGH_MEMORY_USAGE"] = "high_memory_usage";
  PerformanceWarningType2["HIGH_CPU_USAGE"] = "high_cpu_usage";
  PerformanceWarningType2["FREQUENT_GC"] = "frequent_gc";
  PerformanceWarningType2["LOW_FPS"] = "low_fps";
  PerformanceWarningType2["HIGH_ENTITY_COUNT"] = "high_entity_count";
})(PerformanceWarningType || (PerformanceWarningType = {}));
class PerformanceMonitor {
  /**
   * 获取单例实例
   */
  static get instance() {
    if (!PerformanceMonitor._instance) {
      PerformanceMonitor._instance = new PerformanceMonitor();
    }
    return PerformanceMonitor._instance;
  }
  constructor() {
    this._systemData = /* @__PURE__ */ new Map();
    this._systemStats = /* @__PURE__ */ new Map();
    this._warnings = [];
    this._isEnabled = false;
    this._maxRecentSamples = 60;
    this._maxWarnings = 100;
    this._thresholds = {
      executionTime: { warning: 16.67, critical: 33.33 },
      // 60fps和30fps对应的帧时间
      memoryUsage: { warning: 100, critical: 200 },
      // MB
      cpuUsage: { warning: 70, critical: 90 },
      // 百分比
      fps: { warning: 45, critical: 30 },
      entityCount: { warning: 1e3, critical: 5e3 }
    };
    this._fpsHistory = [];
    this._lastFrameTime = 0;
    this._frameCount = 0;
    this._fpsUpdateInterval = 1e3;
    this._lastFpsUpdate = 0;
    this._currentFps = 60;
    this._memoryCheckInterval = 5e3;
    this._lastMemoryCheck = 0;
    this._memoryHistory = [];
    this._gcCount = 0;
    this._lastGcCheck = 0;
    this._gcCheckInterval = 1e3;
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
  startMonitoring(systemName) {
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
    const data = {
      name: systemName,
      executionTime,
      entityCount,
      averageTimePerEntity,
      lastUpdateTime: endTime
    };
    this._systemData.set(systemName, data);
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
    stats.totalTime += executionTime;
    stats.executionCount++;
    stats.averageTime = stats.totalTime / stats.executionCount;
    stats.minTime = Math.min(stats.minTime, executionTime);
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.recentTimes.push(executionTime);
    if (stats.recentTimes.length > this._maxRecentSamples) {
      stats.recentTimes.shift();
    }
    this.calculateAdvancedStats(stats);
  }
  /**
   * 计算高级统计信息
   * @param stats 统计信息对象
   */
  calculateAdvancedStats(stats) {
    if (stats.recentTimes.length === 0)
      return;
    const mean = stats.recentTimes.reduce((a, b) => a + b, 0) / stats.recentTimes.length;
    const variance = stats.recentTimes.reduce((acc, time) => acc + Math.pow(time - mean, 2), 0) / stats.recentTimes.length;
    stats.standardDeviation = Math.sqrt(variance);
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
      return "Performance monitoring is disabled.";
    }
    const lines = [];
    lines.push("=== ECS Performance Report ===");
    lines.push("");
    const sortedSystems = Array.from(this._systemStats.entries()).sort((a, b) => b[1].averageTime - a[1].averageTime);
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
      lines.push("");
    }
    const totalCurrentTime = Array.from(this._systemData.values()).reduce((sum, data) => sum + data.executionTime, 0);
    lines.push(`Total Frame Time: ${totalCurrentTime.toFixed(2)}ms`);
    lines.push(`Systems Count: ${this._systemData.size}`);
    return lines.join("\n");
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
    for (const stats of this._systemStats.values()) {
      while (stats.recentTimes.length > maxSamples) {
        stats.recentTimes.shift();
      }
    }
  }
}
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
    if (this._stats.size < this._maxSize) {
      obj.reset();
      this._objects.push(obj);
      this._stats.size++;
      this._updateMemoryUsage();
    }
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
    const lines = ["=== Object Pool Global Statistics ===", ""];
    if (Object.keys(stats).length === 0) {
      lines.push("No pools registered");
      return lines.join("\n");
    }
    for (const [typeName, stat] of Object.entries(stats)) {
      lines.push(`${typeName}:`);
      lines.push(`  Size: ${stat.size}/${stat.maxSize}`);
      lines.push(`  Hit Rate: ${(stat.hitRate * 100).toFixed(1)}%`);
      lines.push(`  Total Created: ${stat.totalCreated}`);
      lines.push(`  Total Obtained: ${stat.totalObtained}`);
      lines.push(`  Memory: ${(stat.estimatedMemoryUsage / 1024).toFixed(1)} KB`);
      lines.push("");
    }
    return lines.join("\n");
  }
  /**
   * 更新命中率
   */
  _updateHitRate() {
    if (this._stats.totalObtained === 0) {
      this._stats.hitRate = 0;
    } else {
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
Pool._pools = /* @__PURE__ */ new Map();
class PoolManager {
  constructor() {
    this.pools = /* @__PURE__ */ new Map();
    this.autoCompactInterval = 6e4;
    this.lastCompactTime = 0;
  }
  static getInstance() {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
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
    const stats = /* @__PURE__ */ new Map();
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
    const lines = ["=== Pool Manager Statistics ===", ""];
    if (this.pools.size === 0) {
      lines.push("No pools registered");
      return lines.join("\n");
    }
    const globalStats = this.getGlobalStats();
    lines.push(`Total Pools: ${this.pools.size}`);
    lines.push(`Global Hit Rate: ${(globalStats.hitRate * 100).toFixed(1)}%`);
    lines.push(`Global Memory Usage: ${(globalStats.estimatedMemoryUsage / 1024).toFixed(1)} KB`);
    lines.push("");
    for (const [name, pool] of this.pools) {
      const stats = pool.getStats();
      lines.push(`${name}:`);
      lines.push(`  Size: ${stats.size}/${stats.maxSize}`);
      lines.push(`  Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
      lines.push(`  Memory: ${(stats.estimatedMemoryUsage / 1024).toFixed(1)} KB`);
      lines.push("");
    }
    return lines.join("\n");
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
      const prewarmCount = Math.floor(stats.maxSize * 0.2);
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
}
class BitMask64Utils {
  /**
   * 根据位索引创建64位掩码
   * @param bitIndex 位索引，范围 [0, 63]
   * @returns 包含指定位设置为1的掩码
   * @throws 当位索引超出范围时抛出错误
   */
  static create(bitIndex) {
    if (bitIndex < 0 || bitIndex >= 64) {
      throw new Error(`Bit index ${bitIndex} out of range [0, 63]`);
    }
    if (bitIndex < 32) {
      return { lo: 1 << bitIndex, hi: 0 };
    } else {
      return { lo: 0, hi: 1 << bitIndex - 32 };
    }
  }
  /**
   * 从32位数字创建64位掩码
   * @param value 32位数字值
   * @returns 低32位为输入值、高32位为0的掩码
   */
  static fromNumber(value) {
    return { lo: value >>> 0, hi: 0 };
  }
  /**
   * 检查掩码是否包含任意指定的位
   * @param mask 要检查的掩码
   * @param bits 指定的位模式
   * @returns 如果掩码包含bits中的任意位则返回true
   */
  static hasAny(mask, bits) {
    return (mask.lo & bits.lo) !== 0 || (mask.hi & bits.hi) !== 0;
  }
  /**
   * 检查掩码是否包含所有指定的位
   * @param mask 要检查的掩码
   * @param bits 指定的位模式
   * @returns 如果掩码包含bits中的所有位则返回true
   */
  static hasAll(mask, bits) {
    return (mask.lo & bits.lo) === bits.lo && (mask.hi & bits.hi) === bits.hi;
  }
  /**
   * 检查掩码是否不包含任何指定的位
   * @param mask 要检查的掩码
   * @param bits 指定的位模式
   * @returns 如果掩码不包含bits中的任何位则返回true
   */
  static hasNone(mask, bits) {
    return (mask.lo & bits.lo) === 0 && (mask.hi & bits.hi) === 0;
  }
  /**
   * 检查掩码是否为零
   * @param mask 要检查的掩码
   * @returns 如果掩码所有位都为0则返回true
   */
  static isZero(mask) {
    return mask.lo === 0 && mask.hi === 0;
  }
  /**
   * 检查两个掩码是否相等
   * @param a 第一个掩码
   * @param b 第二个掩码
   * @returns 如果两个掩码完全相等则返回true
   */
  static equals(a, b) {
    return a.lo === b.lo && a.hi === b.hi;
  }
  /**
   * 设置掩码中指定位为1
   * @param mask 要修改的掩码（原地修改）
   * @param bitIndex 位索引，范围 [0, 63]
   * @throws 当位索引超出范围时抛出错误
   */
  static setBit(mask, bitIndex) {
    if (bitIndex < 0 || bitIndex >= 64) {
      throw new Error(`Bit index ${bitIndex} out of range [0, 63]`);
    }
    if (bitIndex < 32) {
      mask.lo |= 1 << bitIndex;
    } else {
      mask.hi |= 1 << bitIndex - 32;
    }
  }
  /**
   * 清除掩码中指定位为0
   * @param mask 要修改的掩码（原地修改）
   * @param bitIndex 位索引，范围 [0, 63]
   * @throws 当位索引超出范围时抛出错误
   */
  static clearBit(mask, bitIndex) {
    if (bitIndex < 0 || bitIndex >= 64) {
      throw new Error(`Bit index ${bitIndex} out of range [0, 63]`);
    }
    if (bitIndex < 32) {
      mask.lo &= ~(1 << bitIndex);
    } else {
      mask.hi &= ~(1 << bitIndex - 32);
    }
  }
  /**
   * 对目标掩码执行按位或操作
   * @param target 目标掩码（原地修改）
   * @param other 用于按位或的掩码
   */
  static orInPlace(target, other) {
    target.lo |= other.lo;
    target.hi |= other.hi;
  }
  /**
   * 对目标掩码执行按位与操作
   * @param target 目标掩码（原地修改）
   * @param other 用于按位与的掩码
   */
  static andInPlace(target, other) {
    target.lo &= other.lo;
    target.hi &= other.hi;
  }
  /**
   * 对目标掩码执行按位异或操作
   * @param target 目标掩码（原地修改）
   * @param other 用于按位异或的掩码
   */
  static xorInPlace(target, other) {
    target.lo ^= other.lo;
    target.hi ^= other.hi;
  }
  /**
   * 清除掩码的所有位为0
   * @param mask 要清除的掩码（原地修改）
   */
  static clear(mask) {
    mask.lo = 0;
    mask.hi = 0;
  }
  /**
   * 将源掩码的值复制到目标掩码
   * @param source 源掩码
   * @param target 目标掩码（原地修改）
   */
  static copy(source, target) {
    target.lo = source.lo;
    target.hi = source.hi;
  }
  /**
   * 创建掩码的深拷贝
   * @param mask 要拷贝的掩码
   * @returns 新的掩码对象，内容与源掩码相同
   */
  static clone(mask) {
    return { lo: mask.lo, hi: mask.hi };
  }
  /**
   * 将掩码转换为字符串表示
   * @param mask 要转换的掩码
   * @param radix 进制，支持2（二进制）或16（十六进制），默认为2
   * @returns 掩码的字符串表示，二进制不带前缀，十六进制带0x前缀
   * @throws 当进制不支持时抛出错误
   */
  static toString(mask, radix = 2) {
    if (radix === 2) {
      if (mask.hi === 0) {
        return mask.lo.toString(2);
      } else {
        const hiBits = mask.hi.toString(2);
        const loBits = mask.lo.toString(2).padStart(32, "0");
        return hiBits + loBits;
      }
    } else if (radix === 16) {
      if (mask.hi === 0) {
        return "0x" + mask.lo.toString(16).toUpperCase();
      } else {
        const hiBits = mask.hi.toString(16).toUpperCase();
        const loBits = mask.lo.toString(16).toUpperCase().padStart(8, "0");
        return "0x" + hiBits + loBits;
      }
    } else {
      throw new Error("Only radix 2 and 16 are supported");
    }
  }
  /**
   * 计算掩码中设置为1的位数
   * @param mask 要计算的掩码
   * @returns 掩码中1的位数
   */
  static popCount(mask) {
    let count = 0;
    let lo = mask.lo;
    let hi = mask.hi;
    while (lo) {
      lo &= lo - 1;
      count++;
    }
    while (hi) {
      hi &= hi - 1;
      count++;
    }
    return count;
  }
}
BitMask64Utils.ZERO = { lo: 0, hi: 0 };
var LogLevel;
(function(LogLevel2) {
  LogLevel2[LogLevel2["Debug"] = 0] = "Debug";
  LogLevel2[LogLevel2["Info"] = 1] = "Info";
  LogLevel2[LogLevel2["Warn"] = 2] = "Warn";
  LogLevel2[LogLevel2["Error"] = 3] = "Error";
  LogLevel2[LogLevel2["Fatal"] = 4] = "Fatal";
  LogLevel2[LogLevel2["None"] = 5] = "None";
})(LogLevel || (LogLevel = {}));
const Colors = {
  // 基础颜色
  BLACK: "\x1B[30m",
  RED: "\x1B[31m",
  GREEN: "\x1B[32m",
  YELLOW: "\x1B[33m",
  BLUE: "\x1B[34m",
  MAGENTA: "\x1B[35m",
  CYAN: "\x1B[36m",
  WHITE: "\x1B[37m",
  // 亮色版本
  BRIGHT_BLACK: "\x1B[90m",
  BRIGHT_RED: "\x1B[91m",
  BRIGHT_GREEN: "\x1B[92m",
  BRIGHT_YELLOW: "\x1B[93m",
  BRIGHT_BLUE: "\x1B[94m",
  BRIGHT_MAGENTA: "\x1B[95m",
  BRIGHT_CYAN: "\x1B[96m",
  BRIGHT_WHITE: "\x1B[97m",
  // 特殊
  RESET: "\x1B[0m",
  BOLD: "\x1B[1m",
  UNDERLINE: "\x1B[4m"
};
class ConsoleLogger {
  constructor(config = {}) {
    this._config = {
      level: LogLevel.Info,
      enableTimestamp: true,
      enableColors: typeof window === "undefined",
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
      delete this._config.colors;
    } else {
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
    if (this._config.enableTimestamp) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      formattedMessage = `[${timestamp}] ${formattedMessage}`;
    }
    if (this._config.prefix) {
      formattedMessage = `[${this._config.prefix}] ${formattedMessage}`;
    }
    const levelName = LogLevel[level].toUpperCase();
    formattedMessage = `[${levelName}] ${formattedMessage}`;
    if (this._config.output) {
      this._config.output(level, formattedMessage);
    } else {
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
        } else {
          console.debug(message, ...args);
        }
        break;
      case LogLevel.Info:
        if (colors) {
          console.info(`${colors.info}${message}${colors.reset}`, ...args);
        } else {
          console.info(message, ...args);
        }
        break;
      case LogLevel.Warn:
        if (colors) {
          console.warn(`${colors.warn}${message}${colors.reset}`, ...args);
        } else {
          console.warn(message, ...args);
        }
        break;
      case LogLevel.Error:
        if (colors) {
          console.error(`${colors.error}${message}${colors.reset}`, ...args);
        } else {
          console.error(message, ...args);
        }
        break;
      case LogLevel.Fatal:
        if (colors) {
          console.error(`${colors.fatal}${message}${colors.reset}`, ...args);
        } else {
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
    const defaultColors = {
      debug: Colors.BRIGHT_BLACK,
      // 灰色
      info: Colors.GREEN,
      // 绿色
      warn: Colors.YELLOW,
      // 黄色
      error: Colors.RED,
      // 红色
      fatal: Colors.BRIGHT_RED,
      // 亮红色
      reset: Colors.RESET
      // 重置
    };
    return {
      ...defaultColors,
      ...this._config.colors
    };
  }
}
class LoggerManager {
  constructor() {
    this._loggers = /* @__PURE__ */ new Map();
    this._defaultLevel = LogLevel.Info;
    this._defaultLogger = new ConsoleLogger({
      level: this._defaultLevel
    });
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
      return this._defaultLogger;
    }
    if (!this._loggers.has(name)) {
      const logger2 = new ConsoleLogger({
        prefix: name,
        level: this._defaultLevel
      });
      this._loggers.set(name, logger2);
    }
    return this._loggers.get(name);
  }
  /**
   * 设置日志器
   * @param name 日志器名称
   * @param logger 日志器实例
   */
  setLogger(name, logger2) {
    this._loggers.set(name, logger2);
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
    for (const logger2 of this._loggers.values()) {
      if (logger2 instanceof ConsoleLogger) {
        logger2.setLevel(level);
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
    for (const logger2 of this._loggers.values()) {
      if (logger2 instanceof ConsoleLogger) {
        logger2.setColors(colors);
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
    for (const logger2 of this._loggers.values()) {
      if (logger2 instanceof ConsoleLogger) {
        logger2.setColors({});
      }
    }
  }
}
LoggerManager.getInstance().getLogger();
function createLogger(name) {
  return LoggerManager.getInstance().getLogger(name);
}
class SoAStorage {
  constructor(componentType) {
    this.fields = /* @__PURE__ */ new Map();
    this.stringFields = /* @__PURE__ */ new Map();
    this.serializedFields = /* @__PURE__ */ new Map();
    this.complexFields = /* @__PURE__ */ new Map();
    this.entityToIndex = /* @__PURE__ */ new Map();
    this.indexToEntity = [];
    this.freeIndices = [];
    this._size = 0;
    this._capacity = 1e3;
    this.type = componentType;
    this.initializeFields(componentType);
  }
  initializeFields(componentType) {
    const instance = new componentType();
    const highPrecisionFields = componentType.__highPrecisionFields || /* @__PURE__ */ new Set();
    const float64Fields = componentType.__float64Fields || /* @__PURE__ */ new Set();
    const float32Fields = componentType.__float32Fields || /* @__PURE__ */ new Set();
    const int32Fields = componentType.__int32Fields || /* @__PURE__ */ new Set();
    const serializeMapFields = componentType.__serializeMapFields || /* @__PURE__ */ new Set();
    const serializeSetFields = componentType.__serializeSetFields || /* @__PURE__ */ new Set();
    const serializeArrayFields = componentType.__serializeArrayFields || /* @__PURE__ */ new Set();
    for (const key in instance) {
      if (instance.hasOwnProperty(key) && key !== "id") {
        const value = instance[key];
        const type = typeof value;
        if (type === "number") {
          if (highPrecisionFields.has(key))
            ;
          else if (float64Fields.has(key)) {
            this.fields.set(key, new Float64Array(this._capacity));
          } else if (int32Fields.has(key)) {
            this.fields.set(key, new Int32Array(this._capacity));
          } else if (float32Fields.has(key)) {
            this.fields.set(key, new Float32Array(this._capacity));
          } else {
            this.fields.set(key, new Float32Array(this._capacity));
          }
        } else if (type === "boolean") {
          this.fields.set(key, new Float32Array(this._capacity));
        } else if (type === "string") {
          this.stringFields.set(key, new Array(this._capacity));
        } else if (type === "object" && value !== null) {
          if (serializeMapFields.has(key) || serializeSetFields.has(key) || serializeArrayFields.has(key)) {
            this.serializedFields.set(key, new Array(this._capacity));
          }
        }
      }
    }
  }
  addComponent(entityId, component) {
    if (this.entityToIndex.has(entityId)) {
      const index2 = this.entityToIndex.get(entityId);
      this.updateComponentAtIndex(index2, component);
      return;
    }
    let index;
    if (this.freeIndices.length > 0) {
      index = this.freeIndices.pop();
    } else {
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
    const complexFieldMap = /* @__PURE__ */ new Map();
    const highPrecisionFields = this.type.__highPrecisionFields || /* @__PURE__ */ new Set();
    const serializeMapFields = this.type.__serializeMapFields || /* @__PURE__ */ new Set();
    const serializeSetFields = this.type.__serializeSetFields || /* @__PURE__ */ new Set();
    const serializeArrayFields = this.type.__serializeArrayFields || /* @__PURE__ */ new Set();
    const deepCopyFields = this.type.__deepCopyFields || /* @__PURE__ */ new Set();
    for (const key in component) {
      if (component.hasOwnProperty(key) && key !== "id") {
        const value = component[key];
        const type = typeof value;
        if (type === "number") {
          if (highPrecisionFields.has(key) || !this.fields.has(key)) {
            complexFieldMap.set(key, value);
          } else {
            const array = this.fields.get(key);
            array[index] = value;
          }
        } else if (type === "boolean" && this.fields.has(key)) {
          const array = this.fields.get(key);
          array[index] = value ? 1 : 0;
        } else if (this.stringFields.has(key)) {
          const stringArray = this.stringFields.get(key);
          stringArray[index] = String(value);
        } else if (this.serializedFields.has(key)) {
          const serializedArray = this.serializedFields.get(key);
          serializedArray[index] = this.serializeValue(value, key, serializeMapFields, serializeSetFields, serializeArrayFields);
        } else {
          if (deepCopyFields.has(key)) {
            complexFieldMap.set(key, this.deepClone(value));
          } else {
            complexFieldMap.set(key, value);
          }
        }
      }
    }
    if (complexFieldMap.size > 0) {
      this.complexFields.set(entityId, complexFieldMap);
    }
  }
  /**
   * 序列化值为JSON字符串
   */
  serializeValue(value, key, mapFields, setFields, arrayFields) {
    try {
      if (mapFields.has(key) && value instanceof Map) {
        return JSON.stringify(Array.from(value.entries()));
      } else if (setFields.has(key) && value instanceof Set) {
        return JSON.stringify(Array.from(value));
      } else if (arrayFields.has(key) && Array.isArray(value)) {
        return JSON.stringify(value);
      } else {
        return JSON.stringify(value);
      }
    } catch (error) {
      SoAStorage._logger.warn(`SoA序列化字段 ${key} 失败:`, error);
      return "{}";
    }
  }
  /**
   * 反序列化JSON字符串为值
   */
  deserializeValue(serialized, key, mapFields, setFields, arrayFields) {
    try {
      const parsed = JSON.parse(serialized);
      if (mapFields.has(key)) {
        return new Map(parsed);
      } else if (setFields.has(key)) {
        return new Set(parsed);
      } else if (arrayFields.has(key)) {
        return parsed;
      } else {
        return parsed;
      }
    } catch (error) {
      SoAStorage._logger.warn(`SoA反序列化字段 ${key} 失败:`, error);
      return null;
    }
  }
  /**
   * 深拷贝对象
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
      return obj.map((item) => this.deepClone(item));
    }
    if (obj instanceof Map) {
      const cloned2 = /* @__PURE__ */ new Map();
      for (const [key, value] of obj.entries()) {
        cloned2.set(key, this.deepClone(value));
      }
      return cloned2;
    }
    if (obj instanceof Set) {
      const cloned2 = /* @__PURE__ */ new Set();
      for (const value of obj.values()) {
        cloned2.add(this.deepClone(value));
      }
      return cloned2;
    }
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }
  getComponent(entityId) {
    const index = this.entityToIndex.get(entityId);
    if (index === void 0) {
      return null;
    }
    const component = new this.type();
    const serializeMapFields = this.type.__serializeMapFields || /* @__PURE__ */ new Set();
    const serializeSetFields = this.type.__serializeSetFields || /* @__PURE__ */ new Set();
    const serializeArrayFields = this.type.__serializeArrayFields || /* @__PURE__ */ new Set();
    for (const [fieldName, array] of this.fields.entries()) {
      const value = array[index];
      const fieldType = this.getFieldType(fieldName);
      if (fieldType === "boolean") {
        component[fieldName] = value === 1;
      } else {
        component[fieldName] = value;
      }
    }
    for (const [fieldName, stringArray] of this.stringFields.entries()) {
      component[fieldName] = stringArray[index];
    }
    for (const [fieldName, serializedArray] of this.serializedFields.entries()) {
      const serialized = serializedArray[index];
      if (serialized) {
        component[fieldName] = this.deserializeValue(serialized, fieldName, serializeMapFields, serializeSetFields, serializeArrayFields);
      }
    }
    const complexFieldMap = this.complexFields.get(entityId);
    if (complexFieldMap) {
      for (const [fieldName, value] of complexFieldMap.entries()) {
        component[fieldName] = value;
      }
    }
    return component;
  }
  getFieldType(fieldName) {
    const tempInstance = new this.type();
    const value = tempInstance[fieldName];
    return typeof value;
  }
  hasComponent(entityId) {
    return this.entityToIndex.has(entityId);
  }
  removeComponent(entityId) {
    const index = this.entityToIndex.get(entityId);
    if (index === void 0) {
      return null;
    }
    const component = this.getComponent(entityId);
    this.complexFields.delete(entityId);
    this.entityToIndex.delete(entityId);
    this.freeIndices.push(index);
    this._size--;
    return component;
  }
  resize(newCapacity) {
    for (const [fieldName, oldArray] of this.fields.entries()) {
      let newArray;
      if (oldArray instanceof Float32Array) {
        newArray = new Float32Array(newCapacity);
      } else if (oldArray instanceof Float64Array) {
        newArray = new Float64Array(newCapacity);
      } else {
        newArray = new Int32Array(newCapacity);
      }
      newArray.set(oldArray);
      this.fields.set(fieldName, newArray);
    }
    for (const [fieldName, oldArray] of this.stringFields.entries()) {
      const newArray = new Array(newCapacity);
      for (let i = 0; i < oldArray.length; i++) {
        newArray[i] = oldArray[i];
      }
      this.stringFields.set(fieldName, newArray);
    }
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
    for (const array of this.fields.values()) {
      array.fill(0);
    }
    for (const stringArray of this.stringFields.values()) {
      for (let i = 0; i < stringArray.length; i++) {
        stringArray[i] = void 0;
      }
    }
    for (const serializedArray of this.serializedFields.values()) {
      for (let i = 0; i < serializedArray.length; i++) {
        serializedArray[i] = void 0;
      }
    }
  }
  compact() {
    if (this.freeIndices.length === 0) {
      return;
    }
    const activeEntries = Array.from(this.entityToIndex.entries()).sort((a, b) => a[1] - b[1]);
    const newEntityToIndex = /* @__PURE__ */ new Map();
    const newIndexToEntity = [];
    for (let newIndex = 0; newIndex < activeEntries.length; newIndex++) {
      const [entityId, oldIndex] = activeEntries[newIndex];
      newEntityToIndex.set(entityId, newIndex);
      newIndexToEntity[newIndex] = entityId;
      if (newIndex !== oldIndex) {
        for (const [, array] of this.fields.entries()) {
          array[newIndex] = array[oldIndex];
        }
        for (const [, stringArray] of this.stringFields.entries()) {
          stringArray[newIndex] = stringArray[oldIndex];
        }
        for (const [, serializedArray] of this.serializedFields.entries()) {
          serializedArray[newIndex] = serializedArray[oldIndex];
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
    const fieldStats = /* @__PURE__ */ new Map();
    for (const [fieldName, array] of this.fields.entries()) {
      let bytesPerElement;
      let typeName;
      if (array instanceof Float32Array) {
        bytesPerElement = 4;
        typeName = "float32";
      } else if (array instanceof Float64Array) {
        bytesPerElement = 8;
        typeName = "float64";
      } else {
        bytesPerElement = 4;
        typeName = "int32";
      }
      const memory = array.length * bytesPerElement;
      totalMemory += memory;
      fieldStats.set(fieldName, {
        size: this._size,
        capacity: array.length,
        type: typeName,
        memory
      });
    }
    return {
      size: this._size,
      capacity: this._capacity,
      usedSlots: this._size,
      // 兼容原测试
      fragmentation: this.freeIndices.length / this._capacity,
      memoryUsage: totalMemory,
      fieldStats
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
SoAStorage._logger = createLogger("SoAStorage");
const COMPONENT_TYPE_NAME = Symbol("ComponentTypeName");
const SYSTEM_TYPE_NAME = Symbol("SystemTypeName");
function ECSComponent(typeName) {
  return function(target) {
    if (!typeName || typeof typeName !== "string") {
      throw new Error("ECSComponent装饰器必须提供有效的类型名称");
    }
    target[COMPONENT_TYPE_NAME] = typeName;
    return target;
  };
}
function ECSSystem(typeName) {
  return function(target) {
    if (!typeName || typeof typeName !== "string") {
      throw new Error("ECSSystem装饰器必须提供有效的类型名称");
    }
    target[SYSTEM_TYPE_NAME] = typeName;
    return target;
  };
}
function getComponentTypeName(componentType) {
  const decoratorName = componentType[COMPONENT_TYPE_NAME];
  if (decoratorName) {
    return decoratorName;
  }
  return componentType.name || "UnknownComponent";
}
function getSystemTypeName(systemType) {
  const decoratorName = systemType[SYSTEM_TYPE_NAME];
  if (decoratorName) {
    return decoratorName;
  }
  return systemType.name || "UnknownSystem";
}
function getComponentInstanceTypeName(component) {
  return getComponentTypeName(component.constructor);
}
function getSystemInstanceTypeName(system) {
  return getSystemTypeName(system.constructor);
}
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
    if (this.nextBitIndex >= this.maxComponents) {
      throw new Error(`Maximum number of component types (${this.maxComponents}) exceeded`);
    }
    const bitIndex = this.nextBitIndex++;
    this.componentTypes.set(componentType, bitIndex);
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
    if (bitIndex === void 0) {
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
    if (bitIndex === void 0) {
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
    if (this.nextBitIndex >= this.maxComponents) {
      throw new Error(`Maximum number of component types (${this.maxComponents}) exceeded`);
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
    if (componentId === void 0) {
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
    const cacheKey = `multi:${sortedNames.join(",")}`;
    if (this.maskCache.has(cacheKey)) {
      return this.maskCache.get(cacheKey);
    }
    let mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
    for (const name of componentNames) {
      const componentId = this.getComponentId(name);
      if (componentId !== void 0) {
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
    this.componentNameToType.clear();
    this.componentNameToId.clear();
    this.maskCache.clear();
    this.nextBitIndex = 0;
  }
}
ComponentRegistry._logger = createLogger("ComponentStorage");
ComponentRegistry.componentTypes = /* @__PURE__ */ new Map();
ComponentRegistry.componentNameToType = /* @__PURE__ */ new Map();
ComponentRegistry.componentNameToId = /* @__PURE__ */ new Map();
ComponentRegistry.maskCache = /* @__PURE__ */ new Map();
ComponentRegistry.nextBitIndex = 0;
ComponentRegistry.maxComponents = 64;
class ComponentStorage {
  constructor(componentType) {
    this.dense = [];
    this.entityIds = [];
    this.entityToIndex = /* @__PURE__ */ new Map();
    this.componentType = componentType;
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
    if (this.entityToIndex.has(entityId)) {
      throw new Error(`Entity ${entityId} already has component ${getComponentTypeName(this.componentType)}`);
    }
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
    return index !== void 0 ? this.dense[index] : null;
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
    if (index === void 0) {
      return null;
    }
    const component = this.dense[index];
    const lastIndex = this.dense.length - 1;
    if (index !== lastIndex) {
      const lastComponent = this.dense[lastIndex];
      const lastEntityId = this.entityIds[lastIndex];
      this.dense[index] = lastComponent;
      this.entityIds[index] = lastEntityId;
      this.entityToIndex.set(lastEntityId, index);
    }
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
    const freeSlots = 0;
    const fragmentation = 0;
    return {
      totalSlots,
      usedSlots,
      freeSlots,
      fragmentation
    };
  }
}
class ComponentStorageManager {
  constructor() {
    this.storages = /* @__PURE__ */ new Map();
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
    return soaStorage ? soaStorage.getEntityIndex(entityId) : void 0;
  }
  /**
   * 根据索引获取实体ID
   * @param componentType 组件类型
   * @param index 存储索引
   * @returns 实体ID或undefined
   */
  getEntityIdByIndex(componentType, index) {
    const soaStorage = this.getSoAStorage(componentType);
    return soaStorage ? soaStorage.getEntityIdByIndex(index) : void 0;
  }
  /**
   * 获取或创建组件存储器（默认原始存储）
   * @param componentType 组件类型
   * @returns 组件存储器
   */
  getStorage(componentType) {
    let storage = this.storages.get(componentType);
    if (!storage) {
      const enableSoA = componentType.__enableSoA;
      if (enableSoA) {
        storage = new SoAStorage(componentType);
        ComponentStorageManager._logger.info(`为 ${getComponentTypeName(componentType)} 启用SoA优化（适用于大规模批量操作）`);
      } else {
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
    let mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
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
    const stats = /* @__PURE__ */ new Map();
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
ComponentStorageManager._logger = createLogger("ComponentStorage");
class EntityComparer {
  /**
   * 比较两个实体
   *
   * @param self - 第一个实体
   * @param other - 第二个实体
   * @returns 比较结果，负数表示self优先级更高，正数表示other优先级更高，0表示相等
   */
  compare(self2, other) {
    let compare = self2.updateOrder - other.updateOrder;
    if (compare == 0)
      compare = self2.id - other.id;
    return compare;
  }
}
class Entity {
  /**
   * 通知Scene中的QuerySystem实体组件发生变动
   *
   * @param entity 发生组件变动的实体
   */
  static notifyQuerySystems(entity) {
    if (entity.scene && entity.scene.querySystem) {
      entity.scene.querySystem.updateEntity(entity);
      entity.scene.clearSystemEntityCaches();
    }
  }
  /**
   * 构造函数
   *
   * @param name - 实体名称
   * @param id - 实体唯一标识符
   */
  constructor(name, id) {
    this.components = [];
    this.scene = null;
    this.updateInterval = 1;
    this._isDestroyed = false;
    this._parent = null;
    this._children = [];
    this._active = true;
    this._tag = 0;
    this._enabled = true;
    this._updateOrder = 0;
    this._componentMask = BitMask64Utils.clone(BitMask64Utils.ZERO);
    this._componentsByTypeId = [];
    this._componentDenseIndexByTypeId = [];
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
   * @param componentType - 组件类型
   * @param args - 组件构造函数参数
   * @returns 创建的组件实例
   */
  createComponent(componentType, ...args) {
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
    const typeId = ComponentRegistry.getBitIndex(componentType);
    component.entity = this;
    this._componentsByTypeId[typeId] = component;
    const denseIndex = this.components.length;
    this._componentDenseIndexByTypeId[typeId] = denseIndex;
    this.components.push(component);
    const componentMask = ComponentRegistry.getBitMask(componentType);
    BitMask64Utils.orInPlace(this._componentMask, componentMask);
    return component;
  }
  /**
   * 添加组件到实体
   *
   * @param component - 要添加的组件实例
   * @returns 添加的组件实例
   * @throws {Error} 如果组件类型已存在
   */
  addComponent(component) {
    const componentType = component.constructor;
    if (this.hasComponent(componentType)) {
      throw new Error(`Entity ${this.name} already has component ${getComponentTypeName(componentType)}`);
    }
    this.addComponentInternal(component);
    if (this.scene && this.scene.componentStorageManager) {
      this.scene.componentStorageManager.addComponent(this.id, component);
    }
    component.onAddedToEntity();
    if (Entity.eventBus) {
      Entity.eventBus.emitComponentAdded({
        timestamp: Date.now(),
        source: "Entity",
        entityId: this.id,
        entityName: this.name,
        entityTag: this.tag?.toString(),
        componentType: getComponentTypeName(componentType),
        component
      });
    }
    Entity.notifyQuerySystems(this);
    return component;
  }
  /**
   * 获取指定类型的组件
   *
   * @param type - 组件类型
   * @returns 组件实例或null
   */
  getComponent(type) {
    if (!ComponentRegistry.isRegistered(type)) {
      return null;
    }
    const mask = ComponentRegistry.getBitMask(type);
    if (BitMask64Utils.hasNone(this._componentMask, mask)) {
      return null;
    }
    const typeId = ComponentRegistry.getBitIndex(type);
    const component = this._componentsByTypeId[typeId];
    if (component && component.constructor === type) {
      return component;
    }
    if (this.scene && this.scene.componentStorageManager) {
      const storageComponent = this.scene.componentStorageManager.getComponent(this.id, type);
      if (storageComponent) {
        this._componentsByTypeId[typeId] = storageComponent;
        if (!this.components.includes(storageComponent)) {
          const denseIndex = this.components.length;
          this._componentDenseIndexByTypeId[typeId] = denseIndex;
          this.components.push(storageComponent);
        }
        return storageComponent;
      }
    }
    for (let i = 0; i < this.components.length; i++) {
      const component2 = this.components[i];
      if (component2 instanceof type) {
        this._componentsByTypeId[typeId] = component2;
        this._componentDenseIndexByTypeId[typeId] = i;
        return component2;
      }
    }
    return null;
  }
  /**
   * 检查实体是否有指定类型的组件
   *
   * @param type - 组件类型
   * @returns 如果有该组件则返回true
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
   * @param type - 组件类型
   * @param args - 组件构造函数参数（仅在创建时使用）
   * @returns 组件实例
   */
  getOrCreateComponent(type, ...args) {
    let component = this.getComponent(type);
    if (!component) {
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
    const typeId = ComponentRegistry.getBitIndex(componentType);
    this._componentsByTypeId[typeId] = void 0;
    BitMask64Utils.clearBit(this._componentMask, typeId);
    const denseIndex = this._componentDenseIndexByTypeId[typeId];
    if (denseIndex !== void 0 && denseIndex < this.components.length) {
      const lastIndex = this.components.length - 1;
      if (denseIndex !== lastIndex) {
        const lastComponent = this.components[lastIndex];
        this.components[denseIndex] = lastComponent;
        const lastComponentType = lastComponent.constructor;
        const lastTypeId = ComponentRegistry.getBitIndex(lastComponentType);
        this._componentDenseIndexByTypeId[lastTypeId] = denseIndex;
      }
      this.components.pop();
    }
    this._componentDenseIndexByTypeId[typeId] = -1;
    if (this.scene && this.scene.componentStorageManager) {
      this.scene.componentStorageManager.removeComponent(this.id, componentType);
    }
    if (component.onRemovedFromEntity) {
      component.onRemovedFromEntity();
    }
    if (Entity.eventBus) {
      Entity.eventBus.emitComponentRemoved({
        timestamp: Date.now(),
        source: "Entity",
        entityId: this.id,
        entityName: this.name,
        entityTag: this.tag?.toString(),
        componentType: getComponentTypeName(componentType),
        component
      });
    }
    component.entity = null;
    Entity.notifyQuerySystems(this);
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
    this._componentsByTypeId.length = 0;
    this._componentDenseIndexByTypeId.length = 0;
    BitMask64Utils.clear(this._componentMask);
    for (const component of componentsToRemove) {
      const componentType = component.constructor;
      if (this.scene && this.scene.componentStorageManager) {
        this.scene.componentStorageManager.removeComponent(this.id, componentType);
      }
      component.onRemovedFromEntity();
      component.entity = null;
    }
    this.components.length = 0;
    Entity.notifyQuerySystems(this);
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
      } catch (error) {
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
   * 添加子实体
   *
   * @param child - 要添加的子实体
   * @returns 添加的子实体
   */
  addChild(child) {
    if (child === this) {
      throw new Error("Entity cannot be its own child");
    }
    if (child._parent === this) {
      return child;
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
    let root = this;
    while (root._parent) {
      root = root._parent;
    }
    return root;
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
      if ("onActiveChanged" in component && typeof component.onActiveChanged === "function") {
        component.onActiveChanged();
      }
    }
    if (this.scene && this.scene.eventSystem) {
      this.scene.eventSystem.emitSync("entity:activeChanged", {
        entity: this,
        active: this._active,
        activeInHierarchy: this.activeInHierarchy
      });
    }
  }
  /**
   * 更新实体
   *
   * 调用所有组件的更新方法，并更新子实体。
   */
  update() {
    if (!this.activeInHierarchy || this._isDestroyed) {
      return;
    }
    for (const component of this.components) {
      if (component.enabled) {
        component.update();
      }
    }
    for (const child of this._children) {
      child.update();
    }
  }
  /**
   * 销毁实体
   *
   * 移除所有组件、子实体并标记为已销毁。
   */
  destroy() {
    if (this._isDestroyed) {
      return;
    }
    this._isDestroyed = true;
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
      componentMask: BitMask64Utils.toString(this._componentMask, 2),
      // 二进制表示
      parentId: this._parent?.id || null,
      childCount: this._children.length,
      childIds: this._children.map((c) => c.id),
      depth: this.getDepth(),
      indexMappingSize: this._componentsByTypeId.filter((c) => c !== void 0).length,
      denseIndexMappingSize: this._componentDenseIndexByTypeId.filter((idx) => idx !== -1 && idx !== void 0).length
    };
  }
}
Entity._logger = createLogger("Entity");
Entity.entityComparer = new EntityComparer();
Entity.eventBus = null;
class EntityBuilder {
  constructor(scene, storageManager) {
    this.scene = scene;
    this.storageManager = storageManager;
    this.entity = new Entity("", scene.identifierPool.checkOut());
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
    newBuilder.entity = this.entity;
    return newBuilder;
  }
}
class EntityList {
  get count() {
    return this.buffer.length;
  }
  constructor(scene) {
    this.buffer = [];
    this._idToEntity = /* @__PURE__ */ new Map();
    this._nameToEntities = /* @__PURE__ */ new Map();
    this._entitiesToAdd = [];
    this._entitiesToRemove = [];
    this._isUpdating = false;
    this._enableEntityDirectUpdate = false;
    this._scene = scene;
  }
  /**
   * 设置是否启用实体直接更新
   */
  setEnableEntityDirectUpdate(enabled) {
    this._enableEntityDirectUpdate = enabled;
  }
  /**
   * 添加实体（立即添加或延迟添加）
   * @param entity 要添加的实体
   */
  add(entity) {
    if (this._isUpdating) {
      this._entitiesToAdd.push(entity);
    } else {
      this.addImmediate(entity);
    }
  }
  /**
   * 立即添加实体
   * @param entity 要添加的实体
   */
  addImmediate(entity) {
    if (this._idToEntity.has(entity.id)) {
      return;
    }
    this.buffer.push(entity);
    this._idToEntity.set(entity.id, entity);
    this.updateNameIndex(entity, true);
  }
  /**
   * 移除实体（立即移除或延迟移除）
   * @param entity 要移除的实体
   */
  remove(entity) {
    if (this._isUpdating) {
      this._entitiesToRemove.push(entity);
    } else {
      this.removeImmediate(entity);
    }
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
      this.updateNameIndex(entity, false);
      if (this._scene && this._scene.identifierPool) {
        this._scene.identifierPool.checkIn(entity.id);
      }
    }
  }
  /**
   * 移除所有实体
   */
  removeAllEntities() {
    const idsToRecycle = [];
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      idsToRecycle.push(this.buffer[i].id);
      this.buffer[i].destroy();
    }
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
    if (this._entitiesToAdd.length > 0) {
      for (const entity of this._entitiesToAdd) {
        this.addImmediate(entity);
      }
      this._entitiesToAdd.length = 0;
    }
    if (this._entitiesToRemove.length > 0) {
      for (const entity of this._entitiesToRemove) {
        this.removeImmediate(entity);
      }
      this._entitiesToRemove.length = 0;
    }
  }
  /**
   * 更新实体列表和实体
   */
  update() {
    this._isUpdating = true;
    try {
      if (this._enableEntityDirectUpdate) {
        for (let i = 0; i < this.buffer.length; i++) {
          const entity = this.buffer[i];
          if (entity.enabled && !entity.isDestroyed) {
            entity.update();
          }
        }
      }
    } finally {
      this._isUpdating = false;
    }
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
    } else {
      const entities = this._nameToEntities.get(entity.name);
      if (entities) {
        const index = entities.indexOf(entity);
        if (index !== -1) {
          entities.splice(index, 1);
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
class EntityProcessorList {
  constructor() {
    this._processors = [];
    this._isDirty = false;
  }
  /**
   * 设置为脏状态，需要重新排序
   */
  setDirty() {
    this._isDirty = true;
  }
  /**
   * 添加实体处理器
   * @param processor 要添加的处理器
   */
  add(processor) {
    this._processors.push(processor);
    this.setDirty();
  }
  /**
   * 移除实体处理器
   * @param processor 要移除的处理器
   */
  remove(processor) {
    const index = this._processors.indexOf(processor);
    if (index !== -1) {
      this._processors.splice(index, 1);
    }
  }
  /**
   * 获取指定类型的处理器
   * @param type 处理器类型
   */
  getProcessor(type) {
    for (const processor of this._processors) {
      if (processor instanceof type) {
        return processor;
      }
    }
    return null;
  }
  /**
   * 开始处理
   *
   * 对所有处理器进行排序以确保正确的执行顺序。
   */
  begin() {
    this.sortProcessors();
  }
  /**
   * 结束处理
   */
  end() {
    for (const processor of this._processors) {
      try {
        processor.reset();
      } catch (error) {
        EntityProcessorList._logger.error(`Error in processor ${getSystemInstanceTypeName(processor)}:`, error);
      }
    }
    this._isDirty = false;
    this._processors.length = 0;
  }
  /**
   * 更新所有处理器
   */
  update() {
    this.sortProcessors();
    for (const processor of this._processors) {
      try {
        processor.update();
      } catch (error) {
        EntityProcessorList._logger.error(`Error in processor ${getSystemInstanceTypeName(processor)}:`, error);
      }
    }
  }
  /**
   * 后期更新所有处理器
   */
  lateUpdate() {
    for (const processor of this._processors) {
      processor.lateUpdate();
    }
  }
  /**
   * 排序处理器
   */
  sortProcessors() {
    if (this._isDirty) {
      this._processors.sort((a, b) => a.updateOrder - b.updateOrder);
      this._isDirty = false;
    }
  }
  /** 获取处理器列表 */
  get processors() {
    return this._processors;
  }
  /** 获取处理器数量 */
  get count() {
    return this._processors.length;
  }
}
EntityProcessorList._logger = createLogger("EntityProcessorList");
class IdentifierPool {
  /**
   * 构造函数
   *
   * @param recycleDelay 延迟回收时间（毫秒），默认为100ms
   * @param expansionBlockSize 内存扩展块大小，默认为1024
   */
  constructor(recycleDelay = 100, expansionBlockSize = 1024) {
    this._nextAvailableIndex = 0;
    this._freeIndices = [];
    this._generations = /* @__PURE__ */ new Map();
    this._pendingRecycle = [];
    this._recycleDelay = 100;
    this._stats = {
      totalAllocated: 0,
      totalRecycled: 0,
      currentActive: 0,
      memoryExpansions: 0
    };
    this._recycleDelay = recycleDelay;
    this._expansionBlockSize = expansionBlockSize;
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
    this._processDelayedRecycle();
    let index;
    if (this._freeIndices.length > 0) {
      index = this._freeIndices.pop();
    } else {
      if (this._nextAvailableIndex > IdentifierPool.MAX_INDEX) {
        throw new Error(`实体索引已达到框架设计限制 (${IdentifierPool.MAX_INDEX})。这意味着您已经分配了超过65535个不同的实体索引。这是16位索引设计的限制，考虑优化实体回收策略或升级到64位ID设计。`);
      }
      index = this._nextAvailableIndex++;
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
    if (!this._isValidId(index, generation)) {
      return false;
    }
    const alreadyPending = this._pendingRecycle.some((item) => item.index === index && item.generation === generation);
    if (alreadyPending) {
      return false;
    }
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
    let totalGeneration = 0;
    let generationCount = 0;
    for (const [index, generation] of this._generations) {
      if (index < this._nextAvailableIndex) {
        totalGeneration += generation;
        generationCount++;
      }
    }
    const averageGeneration = generationCount > 0 ? totalGeneration / generationCount : 1;
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
    for (const item of this._pendingRecycle) {
      if (forceAll || now - item.timestamp >= this._recycleDelay) {
        readyToRecycle.push(item);
      } else {
        stillPending.push(item);
      }
    }
    for (const item of readyToRecycle) {
      if (this._isValidId(item.index, item.generation)) {
        let newGeneration = item.generation + 1;
        if (newGeneration > IdentifierPool.MAX_GENERATION) {
          newGeneration = 1;
        }
        this._generations.set(item.index, newGeneration);
        this._freeIndices.push(item.index);
      }
    }
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
      const expansionStart = Math.floor(index / this._expansionBlockSize) * this._expansionBlockSize;
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
    const generationMapSize = this._generations.size * 16;
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
    return generation << 16 | index;
  }
  /**
   * 从ID中解包索引
   *
   * @param id 32位ID
   * @returns 索引部分（16位）
   * @private
   */
  _unpackIndex(id) {
    return id & 65535;
  }
  /**
   * 从ID中解包世代版本
   *
   * @param id 32位ID
   * @returns 世代版本部分（16位）
   * @private
   */
  _unpackGeneration(id) {
    return id >>> 16 & 65535;
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
    return currentGeneration !== void 0 && currentGeneration === generation;
  }
}
IdentifierPool.MAX_INDEX = 65535;
IdentifierPool.MAX_GENERATION = 65535;
class SparseSet {
  constructor() {
    this._dense = [];
    this._sparse = /* @__PURE__ */ new Map();
  }
  /**
   * 添加元素到集合
   *
   * @param item 要添加的元素
   * @returns 是否成功添加（false表示元素已存在）
   */
  add(item) {
    if (this._sparse.has(item)) {
      return false;
    }
    const index = this._dense.length;
    this._dense.push(item);
    this._sparse.set(item, index);
    return true;
  }
  /**
   * 从集合中移除元素
   *
   * 使用swap-and-pop技术保持数组紧凑性：
   * 1. 将要删除的元素与最后一个元素交换
   * 2. 删除最后一个元素
   * 3. 更新映射表
   *
   * @param item 要移除的元素
   * @returns 是否成功移除（false表示元素不存在）
   */
  remove(item) {
    const index = this._sparse.get(item);
    if (index === void 0) {
      return false;
    }
    const lastIndex = this._dense.length - 1;
    if (index !== lastIndex) {
      const lastItem = this._dense[lastIndex];
      this._dense[index] = lastItem;
      this._sparse.set(lastItem, index);
    }
    this._dense.pop();
    this._sparse.delete(item);
    return true;
  }
  /**
   * 检查元素是否存在于集合中
   *
   * @param item 要检查的元素
   * @returns 元素是否存在
   */
  has(item) {
    return this._sparse.has(item);
  }
  /**
   * 获取元素在密集数组中的索引
   *
   * @param item 要查询的元素
   * @returns 索引，如果元素不存在则返回undefined
   */
  getIndex(item) {
    return this._sparse.get(item);
  }
  /**
   * 根据索引获取元素
   *
   * @param index 索引
   * @returns 元素，如果索引无效则返回undefined
   */
  getByIndex(index) {
    return this._dense[index];
  }
  /**
   * 获取集合大小
   */
  get size() {
    return this._dense.length;
  }
  /**
   * 检查集合是否为空
   */
  get isEmpty() {
    return this._dense.length === 0;
  }
  /**
   * 遍历集合中的所有元素
   *
   * 保证遍历顺序与添加顺序一致（除非中间有删除操作）。
   * 遍历性能优秀，因为数据在内存中连续存储。
   *
   * @param callback 遍历回调函数
   */
  forEach(callback) {
    for (let i = 0; i < this._dense.length; i++) {
      callback(this._dense[i], i);
    }
  }
  /**
   * 映射集合中的所有元素
   *
   * @param callback 映射回调函数
   * @returns 映射后的新数组
   */
  map(callback) {
    const result = [];
    for (let i = 0; i < this._dense.length; i++) {
      result.push(callback(this._dense[i], i));
    }
    return result;
  }
  /**
   * 过滤集合中的元素
   *
   * @param predicate 过滤条件
   * @returns 满足条件的元素数组
   */
  filter(predicate) {
    const result = [];
    for (let i = 0; i < this._dense.length; i++) {
      if (predicate(this._dense[i], i)) {
        result.push(this._dense[i]);
      }
    }
    return result;
  }
  /**
   * 查找第一个满足条件的元素
   *
   * @param predicate 查找条件
   * @returns 找到的元素，如果没有则返回undefined
   */
  find(predicate) {
    for (let i = 0; i < this._dense.length; i++) {
      if (predicate(this._dense[i], i)) {
        return this._dense[i];
      }
    }
    return void 0;
  }
  /**
   * 检查是否存在满足条件的元素
   *
   * @param predicate 检查条件
   * @returns 是否存在满足条件的元素
   */
  some(predicate) {
    for (let i = 0; i < this._dense.length; i++) {
      if (predicate(this._dense[i], i)) {
        return true;
      }
    }
    return false;
  }
  /**
   * 检查是否所有元素都满足条件
   *
   * @param predicate 检查条件
   * @returns 是否所有元素都满足条件
   */
  every(predicate) {
    for (let i = 0; i < this._dense.length; i++) {
      if (!predicate(this._dense[i], i)) {
        return false;
      }
    }
    return true;
  }
  /**
   * 获取密集数组的只读副本
   *
   * 返回数组的浅拷贝，确保外部无法直接修改内部数据。
   */
  getDenseArray() {
    return [...this._dense];
  }
  /**
   * 获取密集数组的直接引用（内部使用）
   *
   * 警告：直接修改返回的数组会破坏数据结构的完整性。
   * 仅在性能关键场景下使用，并确保不会修改数组内容。
   */
  getDenseArrayUnsafe() {
    return this._dense;
  }
  /**
   * 清空集合
   */
  clear() {
    this._dense.length = 0;
    this._sparse.clear();
  }
  /**
   * 转换为数组
   */
  toArray() {
    return [...this._dense];
  }
  /**
   * 转换为Set
   */
  toSet() {
    return new Set(this._dense);
  }
  /**
   * 获取内存使用统计信息
   */
  getMemoryStats() {
    const denseArraySize = this._dense.length * 8;
    const sparseMapSize = this._sparse.size * 16;
    return {
      denseArraySize,
      sparseMapSize,
      totalMemory: denseArraySize + sparseMapSize
    };
  }
  /**
   * 验证数据结构的完整性
   *
   * 调试用方法，检查内部数据结构是否一致。
   */
  validate() {
    if (this._dense.length !== this._sparse.size) {
      return false;
    }
    for (let i = 0; i < this._dense.length; i++) {
      const item = this._dense[i];
      const mappedIndex = this._sparse.get(item);
      if (mappedIndex !== i) {
        return false;
      }
    }
    for (const [item, index] of this._sparse) {
      if (index >= this._dense.length || this._dense[index] !== item) {
        return false;
      }
    }
    return true;
  }
}
class PoolableEntitySet extends Set {
  constructor(...args) {
    super();
  }
  reset() {
    this.clear();
  }
}
class ComponentSparseSet {
  constructor() {
    this._componentMasks = [];
    this._componentToEntities = /* @__PURE__ */ new Map();
    this._entities = new SparseSet();
  }
  /**
   * 添加实体到组件索引
   *
   * 分析实体的组件组成，生成位掩码，并更新所有相关索引。
   *
   * @param entity 要添加的实体
   */
  addEntity(entity) {
    if (this._entities.has(entity)) {
      this.removeEntity(entity);
    }
    let componentMask = BitMask64Utils.clone(BitMask64Utils.ZERO);
    const entityComponents = /* @__PURE__ */ new Set();
    for (const component of entity.components) {
      const componentType = component.constructor;
      entityComponents.add(componentType);
      if (!ComponentRegistry.isRegistered(componentType)) {
        ComponentRegistry.register(componentType);
      }
      const bitMask = ComponentRegistry.getBitMask(componentType);
      BitMask64Utils.orInPlace(componentMask, bitMask);
    }
    this._entities.add(entity);
    const entityIndex = this._entities.getIndex(entity);
    while (this._componentMasks.length <= entityIndex) {
      this._componentMasks.push(BitMask64Utils.clone(BitMask64Utils.ZERO));
    }
    this._componentMasks[entityIndex] = componentMask;
    this.updateComponentMappings(entity, entityComponents, true);
  }
  /**
   * 从组件索引中移除实体
   *
   * 清理实体相关的所有索引数据，保持数据结构的紧凑性。
   *
   * @param entity 要移除的实体
   */
  removeEntity(entity) {
    const entityIndex = this._entities.getIndex(entity);
    if (entityIndex === void 0) {
      return;
    }
    const entityComponents = this.getEntityComponentTypes(entity);
    this.updateComponentMappings(entity, entityComponents, false);
    this._entities.remove(entity);
    const lastIndex = this._componentMasks.length - 1;
    if (entityIndex !== lastIndex) {
      this._componentMasks[entityIndex] = this._componentMasks[lastIndex];
    }
    this._componentMasks.pop();
  }
  /**
   * 查询包含指定组件的所有实体
   *
   * @param componentType 组件类型
   * @returns 包含该组件的实体集合
   */
  queryByComponent(componentType) {
    const entities = this._componentToEntities.get(componentType);
    return entities ? new Set(entities) : /* @__PURE__ */ new Set();
  }
  /**
   * 多组件查询（AND操作）
   *
   * 查找同时包含所有指定组件的实体。
   *
   * @param componentTypes 组件类型数组
   * @returns 满足条件的实体集合
   */
  queryMultipleAnd(componentTypes) {
    if (componentTypes.length === 0) {
      return /* @__PURE__ */ new Set();
    }
    if (componentTypes.length === 1) {
      return this.queryByComponent(componentTypes[0]);
    }
    let targetMask = BitMask64Utils.clone(BitMask64Utils.ZERO);
    for (const componentType of componentTypes) {
      if (!ComponentRegistry.isRegistered(componentType)) {
        return /* @__PURE__ */ new Set();
      }
      const bitMask = ComponentRegistry.getBitMask(componentType);
      BitMask64Utils.orInPlace(targetMask, bitMask);
    }
    const result = ComponentSparseSet._entitySetPool.obtain();
    this._entities.forEach((entity, index) => {
      const entityMask = this._componentMasks[index];
      if (BitMask64Utils.hasAll(entityMask, targetMask)) {
        result.add(entity);
      }
    });
    return result;
  }
  /**
   * 多组件查询（OR操作）
   *
   * 查找包含任意一个指定组件的实体。
   *
   * @param componentTypes 组件类型数组
   * @returns 满足条件的实体集合
   */
  queryMultipleOr(componentTypes) {
    if (componentTypes.length === 0) {
      return /* @__PURE__ */ new Set();
    }
    if (componentTypes.length === 1) {
      return this.queryByComponent(componentTypes[0]);
    }
    let targetMask = BitMask64Utils.clone(BitMask64Utils.ZERO);
    for (const componentType of componentTypes) {
      if (ComponentRegistry.isRegistered(componentType)) {
        const bitMask = ComponentRegistry.getBitMask(componentType);
        BitMask64Utils.orInPlace(targetMask, bitMask);
      }
    }
    if (BitMask64Utils.equals(targetMask, BitMask64Utils.ZERO)) {
      return /* @__PURE__ */ new Set();
    }
    const result = ComponentSparseSet._entitySetPool.obtain();
    this._entities.forEach((entity, index) => {
      const entityMask = this._componentMasks[index];
      if (BitMask64Utils.hasAny(entityMask, targetMask)) {
        result.add(entity);
      }
    });
    return result;
  }
  /**
   * 检查实体是否包含指定组件
   *
   * @param entity 实体
   * @param componentType 组件类型
   * @returns 是否包含该组件
   */
  hasComponent(entity, componentType) {
    const entityIndex = this._entities.getIndex(entity);
    if (entityIndex === void 0) {
      return false;
    }
    if (!ComponentRegistry.isRegistered(componentType)) {
      return false;
    }
    const entityMask = this._componentMasks[entityIndex];
    const componentMask = ComponentRegistry.getBitMask(componentType);
    return BitMask64Utils.hasAny(entityMask, componentMask);
  }
  /**
   * 获取实体的组件位掩码
   *
   * @param entity 实体
   * @returns 组件位掩码，如果实体不存在则返回undefined
   */
  getEntityMask(entity) {
    const entityIndex = this._entities.getIndex(entity);
    if (entityIndex === void 0) {
      return void 0;
    }
    return this._componentMasks[entityIndex];
  }
  /**
   * 获取所有实体
   *
   * @returns 所有实体的数组
   */
  getAllEntities() {
    return this._entities.toArray();
  }
  /**
   * 获取实体数量
   */
  get size() {
    return this._entities.size;
  }
  /**
   * 检查是否为空
   */
  get isEmpty() {
    return this._entities.isEmpty;
  }
  /**
   * 遍历所有实体
   *
   * @param callback 遍历回调函数
   */
  forEach(callback) {
    this._entities.forEach((entity, index) => {
      callback(entity, this._componentMasks[index], index);
    });
  }
  /**
   * 清空所有数据
   */
  clear() {
    this._entities.clear();
    this._componentMasks.length = 0;
    for (const entitySet of this._componentToEntities.values()) {
      ComponentSparseSet._entitySetPool.release(entitySet);
    }
    this._componentToEntities.clear();
  }
  /**
   * 获取内存使用统计
   */
  getMemoryStats() {
    const entitiesStats = this._entities.getMemoryStats();
    const masksMemory = this._componentMasks.length * 16;
    let mappingsMemory = this._componentToEntities.size * 16;
    for (const entitySet of this._componentToEntities.values()) {
      mappingsMemory += entitySet.size * 8;
    }
    return {
      entitiesMemory: entitiesStats.totalMemory,
      masksMemory,
      mappingsMemory,
      totalMemory: entitiesStats.totalMemory + masksMemory + mappingsMemory
    };
  }
  /**
   * 验证数据结构完整性
   */
  validate() {
    if (!this._entities.validate()) {
      return false;
    }
    if (this._componentMasks.length !== this._entities.size) {
      return false;
    }
    const allMappedEntities = /* @__PURE__ */ new Set();
    for (const entitySet of this._componentToEntities.values()) {
      for (const entity of entitySet) {
        allMappedEntities.add(entity);
      }
    }
    for (const entity of allMappedEntities) {
      if (!this._entities.has(entity)) {
        return false;
      }
    }
    return true;
  }
  /**
   * 获取实体的组件类型集合
   */
  getEntityComponentTypes(entity) {
    const componentTypes = /* @__PURE__ */ new Set();
    for (const component of entity.components) {
      componentTypes.add(component.constructor);
    }
    return componentTypes;
  }
  /**
   * 更新组件类型到实体的映射
   */
  updateComponentMappings(entity, componentTypes, add) {
    for (const componentType of componentTypes) {
      let entities = this._componentToEntities.get(componentType);
      if (add) {
        if (!entities) {
          entities = ComponentSparseSet._entitySetPool.obtain();
          this._componentToEntities.set(componentType, entities);
        }
        entities.add(entity);
      } else {
        if (entities) {
          entities.delete(entity);
          if (entities.size === 0) {
            this._componentToEntities.delete(componentType);
            ComponentSparseSet._entitySetPool.release(entities);
          }
        }
      }
    }
  }
}
ComponentSparseSet._entitySetPool = Pool.getPool(PoolableEntitySet, 50, 512);
class ComponentIndex {
  constructor() {
    this._queryCount = 0;
    this._totalQueryTime = 0;
    this._lastUpdated = Date.now();
    this._sparseSet = new ComponentSparseSet();
  }
  addEntity(entity) {
    this._sparseSet.addEntity(entity);
    this._lastUpdated = Date.now();
  }
  removeEntity(entity) {
    this._sparseSet.removeEntity(entity);
    this._lastUpdated = Date.now();
  }
  query(componentType) {
    const startTime = performance.now();
    const result = this._sparseSet.queryByComponent(componentType);
    this._queryCount++;
    this._totalQueryTime += performance.now() - startTime;
    return result;
  }
  queryMultiple(componentTypes, operation) {
    const startTime = performance.now();
    let result;
    if (componentTypes.length === 0) {
      result = /* @__PURE__ */ new Set();
    } else if (componentTypes.length === 1) {
      result = this.query(componentTypes[0]);
    } else if (operation === "AND") {
      result = this._sparseSet.queryMultipleAnd(componentTypes);
    } else {
      result = this._sparseSet.queryMultipleOr(componentTypes);
    }
    this._queryCount++;
    this._totalQueryTime += performance.now() - startTime;
    return result;
  }
  clear() {
    this._sparseSet.clear();
    this._lastUpdated = Date.now();
  }
  getStats() {
    const memoryStats = this._sparseSet.getMemoryStats();
    return {
      size: this._sparseSet.size,
      memoryUsage: memoryStats.totalMemory,
      queryCount: this._queryCount,
      avgQueryTime: this._queryCount > 0 ? this._totalQueryTime / this._queryCount : 0,
      lastUpdated: this._lastUpdated
    };
  }
}
class ComponentIndexManager {
  constructor() {
    this._index = new ComponentIndex();
  }
  /**
   * 添加实体到索引
   */
  addEntity(entity) {
    this._index.addEntity(entity);
  }
  /**
   * 从索引中移除实体
   */
  removeEntity(entity) {
    this._index.removeEntity(entity);
  }
  /**
   * 查询包含指定组件的实体
   */
  query(componentType) {
    return this._index.query(componentType);
  }
  /**
   * 批量查询多个组件
   */
  queryMultiple(componentTypes, operation) {
    return this._index.queryMultiple(componentTypes, operation);
  }
  /**
   * 获取索引统计信息
   */
  getStats() {
    return this._index.getStats();
  }
  /**
   * 清空索引
   */
  clear() {
    this._index.clear();
  }
}
class ArchetypeSystem {
  constructor() {
    this._archetypes = /* @__PURE__ */ new Map();
    this._entityToArchetype = /* @__PURE__ */ new Map();
    this._componentToArchetypes = /* @__PURE__ */ new Map();
    this._queryCache = /* @__PURE__ */ new Map();
    this._cacheTimeout = 5e3;
    this._maxCacheSize = 100;
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
    archetype.entities.push(entity);
    archetype.updatedAt = Date.now();
    this._entityToArchetype.set(entity, archetype);
    this.updateComponentIndexes(archetype, componentTypes, true);
    this.invalidateQueryCache();
  }
  /**
   * 从原型系统中移除实体
   */
  removeEntity(entity) {
    const archetype = this._entityToArchetype.get(entity);
    if (!archetype)
      return;
    const index = archetype.entities.indexOf(entity);
    if (index !== -1) {
      archetype.entities.splice(index, 1);
      archetype.updatedAt = Date.now();
    }
    this._entityToArchetype.delete(entity);
    this.invalidateQueryCache();
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
    const newComponentTypes = this.getEntityComponentTypes(entity);
    const newArchetypeId = this.generateArchetypeId(newComponentTypes);
    if (currentArchetype && currentArchetype.id === newArchetypeId) {
      return;
    }
    if (currentArchetype) {
      const index = currentArchetype.entities.indexOf(entity);
      if (index !== -1) {
        currentArchetype.entities.splice(index, 1);
        currentArchetype.updatedAt = Date.now();
      }
    }
    let newArchetype = this._archetypes.get(newArchetypeId);
    if (!newArchetype) {
      newArchetype = this.createArchetype(newComponentTypes);
    }
    newArchetype.entities.push(entity);
    newArchetype.updatedAt = Date.now();
    this._entityToArchetype.set(entity, newArchetype);
    if (currentArchetype) {
      this.updateComponentIndexes(currentArchetype, currentArchetype.componentTypes, false);
    }
    this.updateComponentIndexes(newArchetype, newComponentTypes, true);
    this.invalidateQueryCache();
  }
  /**
   * 查询包含指定组件组合的原型
   */
  queryArchetypes(componentTypes, operation = "AND") {
    const startTime = performance.now();
    const cacheKey = `${operation}:${componentTypes.map((t) => getComponentTypeName(t)).sort().join(",")}`;
    const cached = this._queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this._cacheTimeout) {
      return {
        ...cached.result,
        executionTime: performance.now() - startTime,
        fromCache: true
      };
    }
    const matchingArchetypes = [];
    let totalEntities = 0;
    if (operation === "AND") {
      for (const archetype of this._archetypes.values()) {
        if (this.archetypeContainsAllComponents(archetype, componentTypes)) {
          matchingArchetypes.push(archetype);
          totalEntities += archetype.entities.length;
        }
      }
    } else {
      const foundArchetypes = /* @__PURE__ */ new Set();
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
        totalEntities += archetype.entities.length;
      }
    }
    const result = {
      archetypes: matchingArchetypes,
      totalEntities,
      executionTime: performance.now() - startTime,
      fromCache: false
    };
    this._queryCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    return result;
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
    return Array.from(this._archetypes.values());
  }
  /**
   * 清空所有数据
   */
  clear() {
    this._archetypes.clear();
    this._entityToArchetype.clear();
    this._componentToArchetypes.clear();
    this._queryCache.clear();
  }
  /**
   * 获取实体的组件类型列表
   */
  getEntityComponentTypes(entity) {
    return entity.components.map((component) => component.constructor);
  }
  /**
   * 生成原型ID
   */
  generateArchetypeId(componentTypes) {
    return componentTypes.map((type) => getComponentTypeName(type)).sort().join("|");
  }
  /**
   * 创建新原型
   */
  createArchetype(componentTypes) {
    const id = this.generateArchetypeId(componentTypes);
    const archetype = {
      id,
      componentTypes: [...componentTypes],
      entities: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this._archetypes.set(id, archetype);
    return archetype;
  }
  /**
   * 检查原型是否包含所有指定组件
   */
  archetypeContainsAllComponents(archetype, componentTypes) {
    for (const componentType of componentTypes) {
      if (!archetype.componentTypes.includes(componentType)) {
        return false;
      }
    }
    return true;
  }
  /**
   * 更新组件索引
   */
  updateComponentIndexes(archetype, componentTypes, add) {
    for (const componentType of componentTypes) {
      let archetypes = this._componentToArchetypes.get(componentType);
      if (!archetypes) {
        archetypes = /* @__PURE__ */ new Set();
        this._componentToArchetypes.set(componentType, archetypes);
      }
      if (add) {
        archetypes.add(archetype);
      } else {
        archetypes.delete(archetype);
        if (archetypes.size === 0) {
          this._componentToArchetypes.delete(componentType);
        }
      }
    }
  }
  /**
   * 使查询缓存失效
   */
  invalidateQueryCache() {
    this._queryCache.clear();
  }
}
var QueryConditionType;
(function(QueryConditionType2) {
  QueryConditionType2["ALL"] = "all";
  QueryConditionType2["ANY"] = "any";
  QueryConditionType2["NONE"] = "none";
})(QueryConditionType || (QueryConditionType = {}));
class QuerySystem {
  constructor() {
    this._logger = createLogger("QuerySystem");
    this.entities = [];
    this._version = 0;
    this.queryCache = /* @__PURE__ */ new Map();
    this.cacheMaxSize = 1e3;
    this.cacheTimeout = 5e3;
    this.componentNameCache = /* @__PURE__ */ new WeakMap();
    this.cacheKeyCache = /* @__PURE__ */ new Map();
    this.componentMaskCache = /* @__PURE__ */ new Map();
    this.queryStats = {
      totalQueries: 0,
      cacheHits: 0,
      indexHits: 0,
      linearScans: 0,
      archetypeHits: 0,
      dirtyChecks: 0
    };
    this.entityIndex = {
      byMask: /* @__PURE__ */ new Map(),
      byComponentType: /* @__PURE__ */ new Map(),
      byTag: /* @__PURE__ */ new Map(),
      byName: /* @__PURE__ */ new Map()
    };
    this.componentIndexManager = new ComponentIndexManager();
    this.archetypeSystem = new ArchetypeSystem();
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
    this.entities = entities;
    this.clearQueryCache();
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
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
      this.addEntityToIndexes(entity);
      this.componentIndexManager.addEntity(entity);
      this.archetypeSystem.addEntity(entity);
      if (!deferCacheClear) {
        this.clearQueryCache();
      }
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
    const existingIds = new Set(this.entities.map((e) => e.id));
    let addedCount = 0;
    for (const entity of entities) {
      if (!existingIds.has(entity.id)) {
        this.entities.push(entity);
        this.addEntityToIndexes(entity);
        this.componentIndexManager.addEntity(entity);
        this.archetypeSystem.addEntity(entity);
        existingIds.add(entity.id);
        addedCount++;
      }
    }
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
    for (const entity of entities) {
      this.entities.push(entity);
    }
    for (const entity of entities) {
      this.addEntityToIndexes(entity);
      this.componentIndexManager.addEntity(entity);
      this.archetypeSystem.addEntity(entity);
    }
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
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
      this.removeEntityFromIndexes(entity);
      this.componentIndexManager.removeEntity(entity);
      this.archetypeSystem.removeEntity(entity);
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
    if (!this.entities.includes(entity)) {
      this.addEntity(entity);
      return;
    }
    this.removeEntityFromIndexes(entity);
    this.archetypeSystem.updateEntity(entity);
    this.componentIndexManager.removeEntity(entity);
    this.componentIndexManager.addEntity(entity);
    this.addEntityToIndexes(entity);
    this.clearQueryCache();
    this._version++;
  }
  /**
   * 将实体添加到各种索引中
   */
  addEntityToIndexes(entity) {
    const mask = entity.componentMask;
    const maskKey = mask.toString();
    const maskSet = this.entityIndex.byMask.get(maskKey) || this.createAndSetMaskIndex(maskKey);
    maskSet.add(entity);
    const components = entity.components;
    for (let i = 0; i < components.length; i++) {
      const componentType = components[i].constructor;
      const typeSet = this.entityIndex.byComponentType.get(componentType) || this.createAndSetComponentIndex(componentType);
      typeSet.add(entity);
    }
    const tag = entity.tag;
    if (tag !== void 0) {
      const tagSet = this.entityIndex.byTag.get(tag) || this.createAndSetTagIndex(tag);
      tagSet.add(entity);
    }
    const name = entity.name;
    if (name) {
      const nameSet = this.entityIndex.byName.get(name) || this.createAndSetNameIndex(name);
      nameSet.add(entity);
    }
  }
  createAndSetMaskIndex(maskKey) {
    const set = /* @__PURE__ */ new Set();
    this.entityIndex.byMask.set(maskKey, set);
    return set;
  }
  createAndSetComponentIndex(componentType) {
    const set = /* @__PURE__ */ new Set();
    this.entityIndex.byComponentType.set(componentType, set);
    return set;
  }
  createAndSetTagIndex(tag) {
    const set = /* @__PURE__ */ new Set();
    this.entityIndex.byTag.set(tag, set);
    return set;
  }
  createAndSetNameIndex(name) {
    const set = /* @__PURE__ */ new Set();
    this.entityIndex.byName.set(name, set);
    return set;
  }
  /**
   * 从各种索引中移除实体
   */
  removeEntityFromIndexes(entity) {
    const mask = entity.componentMask;
    const maskKey = mask.toString();
    const maskSet = this.entityIndex.byMask.get(maskKey);
    if (maskSet) {
      maskSet.delete(entity);
      if (maskSet.size === 0) {
        this.entityIndex.byMask.delete(maskKey);
      }
    }
    for (const component of entity.components) {
      const componentType = component.constructor;
      const typeSet = this.entityIndex.byComponentType.get(componentType);
      if (typeSet) {
        typeSet.delete(entity);
        if (typeSet.size === 0) {
          this.entityIndex.byComponentType.delete(componentType);
        }
      }
    }
    if (entity.tag !== void 0) {
      const tagSet = this.entityIndex.byTag.get(entity.tag);
      if (tagSet) {
        tagSet.delete(entity);
        if (tagSet.size === 0) {
          this.entityIndex.byTag.delete(entity.tag);
        }
      }
    }
    if (entity.name) {
      const nameSet = this.entityIndex.byName.get(entity.name);
      if (nameSet) {
        nameSet.delete(entity);
        if (nameSet.size === 0) {
          this.entityIndex.byName.delete(entity.name);
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
    this.entityIndex.byMask.clear();
    this.entityIndex.byComponentType.clear();
    this.entityIndex.byTag.clear();
    this.entityIndex.byName.clear();
    this.archetypeSystem.clear();
    this.componentIndexManager.clear();
    for (const entity of this.entities) {
      this.addEntityToIndexes(entity);
      this.componentIndexManager.addEntity(entity);
      this.archetypeSystem.addEntity(entity);
    }
  }
  /**
   * 查询包含所有指定组件的实体
   *
   * 返回同时包含所有指定组件类型的实体列表。
   * 系统会自动选择最高效的查询策略，包括索引查找和缓存机制。
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
    this.queryStats.totalQueries++;
    const cacheKey = this.generateCacheKey("all", componentTypes);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.queryStats.cacheHits++;
      return {
        entities: cached,
        count: cached.length,
        executionTime: performance.now() - startTime,
        fromCache: true
      };
    }
    let entities = [];
    const archetypeResult = this.archetypeSystem.queryArchetypes(componentTypes, "AND");
    if (archetypeResult.archetypes.length > 0) {
      this.queryStats.archetypeHits++;
      for (const archetype of archetypeResult.archetypes) {
        entities.push(...archetype.entities);
      }
    } else {
      try {
        if (componentTypes.length === 1) {
          this.queryStats.indexHits++;
          const indexResult = this.componentIndexManager.query(componentTypes[0]);
          entities = Array.from(indexResult);
        } else {
          const indexResult = this.componentIndexManager.queryMultiple(componentTypes, "AND");
          entities = Array.from(indexResult);
        }
      } catch (error) {
        entities = [];
      }
    }
    this.addToCache(cacheKey, entities);
    return {
      entities,
      count: entities.length,
      executionTime: performance.now() - startTime,
      fromCache: false
    };
  }
  /**
   * 多组件查询算法
   *
   * 针对多组件查询场景的高效算法实现。
   * 通过选择最小的组件集合作为起点，减少需要检查的实体数量。
   *
   * @param componentTypes 组件类型列表
   * @returns 匹配的实体列表
   */
  queryMultipleComponents(componentTypes) {
    let smallestSet = null;
    let smallestSize = Infinity;
    for (const componentType of componentTypes) {
      const set = this.entityIndex.byComponentType.get(componentType);
      if (!set || set.size === 0) {
        return [];
      }
      if (set.size < smallestSize) {
        smallestSize = set.size;
        smallestSet = set;
      }
    }
    if (!smallestSet) {
      return [];
    }
    const mask = this.createComponentMask(componentTypes);
    const result = [];
    for (const entity of smallestSet) {
      if (BitMask64Utils.hasAll(entity.componentMask, mask)) {
        result.push(entity);
      }
    }
    return result;
  }
  /**
   * 查询包含任意指定组件的实体
   *
   * 返回包含任意一个指定组件类型的实体列表。
   * 使用集合合并算法确保高效的查询性能。
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
    this.queryStats.totalQueries++;
    const cacheKey = this.generateCacheKey("any", componentTypes);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.queryStats.cacheHits++;
      return {
        entities: cached,
        count: cached.length,
        executionTime: performance.now() - startTime,
        fromCache: true
      };
    }
    const archetypeResult = this.archetypeSystem.queryArchetypes(componentTypes, "OR");
    let entities;
    if (archetypeResult.archetypes.length > 0) {
      this.queryStats.archetypeHits++;
      entities = [];
      for (const archetype of archetypeResult.archetypes) {
        entities.push(...archetype.entities);
      }
    } else {
      const indexResult = this.componentIndexManager.queryMultiple(componentTypes, "OR");
      entities = Array.from(indexResult);
    }
    this.addToCache(cacheKey, entities);
    return {
      entities,
      count: entities.length,
      executionTime: performance.now() - startTime,
      fromCache: false
    };
  }
  /**
   * 查询不包含任何指定组件的实体
   *
   * 返回不包含任何指定组件类型的实体列表。
   * 适用于排除特定类型实体的查询场景。
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
    this.queryStats.totalQueries++;
    const cacheKey = this.generateCacheKey("none", componentTypes);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.queryStats.cacheHits++;
      return {
        entities: cached,
        count: cached.length,
        executionTime: performance.now() - startTime,
        fromCache: true
      };
    }
    const mask = this.createComponentMask(componentTypes);
    const entities = this.entities.filter((entity) => BitMask64Utils.hasNone(entity.componentMask, mask));
    this.addToCache(cacheKey, entities);
    return {
      entities,
      count: entities.length,
      executionTime: performance.now() - startTime,
      fromCache: false
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
    this.queryStats.totalQueries++;
    const cacheKey = `tag:${tag}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.queryStats.cacheHits++;
      return {
        entities: cached,
        count: cached.length,
        executionTime: performance.now() - startTime,
        fromCache: true
      };
    }
    this.queryStats.indexHits++;
    const entities = Array.from(this.entityIndex.byTag.get(tag) || []);
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
    this.queryStats.totalQueries++;
    const cacheKey = `name:${name}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.queryStats.cacheHits++;
      return {
        entities: cached,
        count: cached.length,
        executionTime: performance.now() - startTime,
        fromCache: true
      };
    }
    this.queryStats.indexHits++;
    const entities = Array.from(this.entityIndex.byName.get(name) || []);
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
    this.queryStats.totalQueries++;
    const cacheKey = this.generateCacheKey("component", [componentType]);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.queryStats.cacheHits++;
      return {
        entities: cached,
        count: cached.length,
        executionTime: performance.now() - startTime,
        fromCache: true
      };
    }
    this.queryStats.indexHits++;
    const entities = Array.from(this.entityIndex.byComponentType.get(componentType) || []);
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
    const entry = this.queryCache.get(cacheKey);
    if (!entry)
      return null;
    if (Date.now() - entry.timestamp > this.cacheTimeout || entry.version !== this._version) {
      this.queryCache.delete(cacheKey);
      return null;
    }
    entry.hitCount++;
    return entry.entities;
  }
  /**
   * 添加查询结果到缓存
   */
  addToCache(cacheKey, entities) {
    if (this.queryCache.size >= this.cacheMaxSize) {
      this.cleanupCache();
    }
    this.queryCache.set(cacheKey, {
      entities,
      // 直接使用引用，通过版本号控制失效
      timestamp: Date.now(),
      hitCount: 0,
      version: this._version
    });
  }
  /**
   * 清理缓存
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.queryCache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.queryCache.delete(key);
      }
    }
    if (this.queryCache.size >= this.cacheMaxSize) {
      let minHitCount = Infinity;
      let oldestKey = "";
      let oldestTimestamp = Infinity;
      for (const [key, entry] of this.queryCache.entries()) {
        if (entry.hitCount < minHitCount || entry.hitCount === minHitCount && entry.timestamp < oldestTimestamp) {
          minHitCount = entry.hitCount;
          oldestKey = key;
          oldestTimestamp = entry.timestamp;
        }
      }
      if (oldestKey) {
        this.queryCache.delete(oldestKey);
      }
    }
  }
  /**
   * 清除所有查询缓存
   */
  clearQueryCache() {
    this.queryCache.clear();
    this.cacheKeyCache.clear();
    this.componentMaskCache.clear();
  }
  /**
   * 高效的缓存键生成
   */
  generateCacheKey(prefix, componentTypes) {
    if (componentTypes.length === 1) {
      let name = this.componentNameCache.get(componentTypes[0]);
      if (!name) {
        name = getComponentTypeName(componentTypes[0]);
        this.componentNameCache.set(componentTypes[0], name);
      }
      return `${prefix}:${name}`;
    }
    const sortKey = componentTypes.map((t) => {
      let name = this.componentNameCache.get(t);
      if (!name) {
        name = getComponentTypeName(t);
        this.componentNameCache.set(t, name);
      }
      return name;
    }).sort().join(",");
    const fullKey = `${prefix}:${sortKey}`;
    let cachedKey = this.cacheKeyCache.get(fullKey);
    if (!cachedKey) {
      cachedKey = fullKey;
      this.cacheKeyCache.set(fullKey, cachedKey);
    }
    return cachedKey;
  }
  /**
   * 清理查询缓存
   *
   * 用于外部调用清理缓存，通常在批量操作后使用。
   */
  clearCache() {
    this.clearQueryCache();
  }
  /**
   * 创建组件掩码
   *
   * 根据组件类型列表生成对应的位掩码。
   * 使用缓存避免重复计算。
   *
   * @param componentTypes 组件类型列表
   * @returns 生成的位掩码
   */
  createComponentMask(componentTypes) {
    const cacheKey = componentTypes.map((t) => {
      let name = this.componentNameCache.get(t);
      if (!name) {
        name = getComponentTypeName(t);
        this.componentNameCache.set(t, name);
      }
      return name;
    }).sort().join(",");
    const cached = this.componentMaskCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    let mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
    let hasValidComponents = false;
    for (const type of componentTypes) {
      try {
        const bitMask = ComponentRegistry.getBitMask(type);
        BitMask64Utils.orInPlace(mask, bitMask);
        hasValidComponents = true;
      } catch (error) {
        this._logger.warn(`组件类型 ${getComponentTypeName(type)} 未注册，跳过`);
      }
    }
    if (!hasValidComponents) {
      mask = { lo: 4294967295, hi: 4294967295 };
    }
    this.componentMaskCache.set(cacheKey, mask);
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
    return this.entities;
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
      entityCount: this.entities.length,
      indexStats: {
        maskIndexSize: this.entityIndex.byMask.size,
        componentIndexSize: this.entityIndex.byComponentType.size,
        tagIndexSize: this.entityIndex.byTag.size,
        nameIndexSize: this.entityIndex.byName.size
      },
      queryStats: {
        ...this.queryStats,
        cacheHitRate: this.queryStats.totalQueries > 0 ? (this.queryStats.cacheHits / this.queryStats.totalQueries * 100).toFixed(2) + "%" : "0%"
      },
      optimizationStats: {
        componentIndex: this.componentIndexManager.getStats(),
        archetypeSystem: this.archetypeSystem.getAllArchetypes().map((a) => ({
          id: a.id,
          componentTypes: a.componentTypes.map((t) => getComponentTypeName(t)),
          entityCount: a.entities.length
        }))
      },
      cacheStats: {
        size: this.queryCache.size,
        hitRate: this.queryStats.totalQueries > 0 ? (this.queryStats.cacheHits / this.queryStats.totalQueries * 100).toFixed(2) + "%" : "0%"
      }
    };
  }
  /**
   * 获取实体所属的原型信息
   *
   * @param entity 要查询的实体
   */
  getEntityArchetype(entity) {
    return this.archetypeSystem.getEntityArchetype(entity);
  }
}
class QueryBuilder {
  constructor(querySystem) {
    this._logger = createLogger("QueryBuilder");
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
    let mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
    for (const type of componentTypes) {
      try {
        const bitMask = ComponentRegistry.getBitMask(type);
        BitMask64Utils.orInPlace(mask, bitMask);
      } catch (error) {
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
class TypeSafeEventSystem {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
    this.stats = /* @__PURE__ */ new Map();
    this.batchQueue = /* @__PURE__ */ new Map();
    this.batchTimers = /* @__PURE__ */ new Map();
    this.batchConfigs = /* @__PURE__ */ new Map();
    this.nextListenerId = 0;
    this.isEnabled = true;
    this.maxListeners = 100;
  }
  /**
   * 添加事件监听器
   * @param eventType 事件类型
   * @param handler 事件处理器
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
    const sortedListeners = this.sortListenersByPriority(listeners);
    for (const listener of sortedListeners) {
      if (listener.config.async)
        continue;
      try {
        if (listener.config.context) {
          listener.handler.call(listener.config.context, event);
        } else {
          listener.handler(event);
        }
        if (listener.config.once) {
          toRemove.push(listener.id);
        }
      } catch (error) {
        TypeSafeEventSystem._logger.error(`事件处理器执行错误 ${eventType}:`, error);
      }
    }
    this.removeListeners(eventType, toRemove);
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
    const timer = this.batchTimers.get(eventType);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(eventType);
    }
    this.processBatch(eventType, batch);
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
    } else {
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
    if (listeners.length >= this.maxListeners) {
      TypeSafeEventSystem._logger.warn(`事件类型 ${eventType} 的监听器数量超过最大限制 (${this.maxListeners})`);
      return "";
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
    const sortedListeners = this.sortListenersByPriority(listeners);
    const syncListeners = sortedListeners.filter((l) => !l.config.async);
    const asyncListeners = sortedListeners.filter((l) => l.config.async);
    for (const listener of syncListeners) {
      try {
        if (listener.config.context) {
          listener.handler.call(listener.config.context, event);
        } else {
          listener.handler(event);
        }
        if (listener.config.once) {
          toRemove.push(listener.id);
        }
      } catch (error) {
        TypeSafeEventSystem._logger.error(`同步事件处理器执行错误 ${eventType}:`, error);
      }
    }
    const asyncPromises = asyncListeners.map(async (listener) => {
      try {
        if (listener.config.context) {
          await listener.handler.call(listener.config.context, event);
        } else {
          await listener.handler(event);
        }
        if (listener.config.once) {
          toRemove.push(listener.id);
        }
      } catch (error) {
        TypeSafeEventSystem._logger.error(`异步事件处理器执行错误 ${eventType}:`, error);
      }
    });
    await Promise.all(asyncPromises);
    this.removeListeners(eventType, toRemove);
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
    if (batch.length >= config.batchSize) {
      this.flushBatch(eventType);
      return;
    }
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
    const batchEvent = {
      type: eventType,
      events: batch,
      count: batch.length,
      timestamp: Date.now()
    };
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
TypeSafeEventSystem._logger = createLogger("EventSystem");
var ECSEventType;
(function(ECSEventType2) {
  ECSEventType2["ENTITY_CREATED"] = "entity:created";
  ECSEventType2["ENTITY_DESTROYED"] = "entity:destroyed";
  ECSEventType2["ENTITY_ENABLED"] = "entity:enabled";
  ECSEventType2["ENTITY_DISABLED"] = "entity:disabled";
  ECSEventType2["ENTITY_TAG_ADDED"] = "entity:tag:added";
  ECSEventType2["ENTITY_TAG_REMOVED"] = "entity:tag:removed";
  ECSEventType2["ENTITY_NAME_CHANGED"] = "entity:name:changed";
  ECSEventType2["COMPONENT_ADDED"] = "component:added";
  ECSEventType2["COMPONENT_REMOVED"] = "component:removed";
  ECSEventType2["COMPONENT_MODIFIED"] = "component:modified";
  ECSEventType2["COMPONENT_ENABLED"] = "component:enabled";
  ECSEventType2["COMPONENT_DISABLED"] = "component:disabled";
  ECSEventType2["SYSTEM_ADDED"] = "system:added";
  ECSEventType2["SYSTEM_REMOVED"] = "system:removed";
  ECSEventType2["SYSTEM_ENABLED"] = "system:enabled";
  ECSEventType2["SYSTEM_DISABLED"] = "system:disabled";
  ECSEventType2["SYSTEM_PROCESSING_START"] = "system:processing:start";
  ECSEventType2["SYSTEM_PROCESSING_END"] = "system:processing:end";
  ECSEventType2["SYSTEM_ERROR"] = "system:error";
  ECSEventType2["SCENE_CREATED"] = "scene:created";
  ECSEventType2["SCENE_DESTROYED"] = "scene:destroyed";
  ECSEventType2["SCENE_ACTIVATED"] = "scene:activated";
  ECSEventType2["SCENE_DEACTIVATED"] = "scene:deactivated";
  ECSEventType2["SCENE_PAUSED"] = "scene:paused";
  ECSEventType2["SCENE_RESUMED"] = "scene:resumed";
  ECSEventType2["QUERY_EXECUTED"] = "query:executed";
  ECSEventType2["QUERY_CACHE_HIT"] = "query:cache:hit";
  ECSEventType2["QUERY_CACHE_MISS"] = "query:cache:miss";
  ECSEventType2["QUERY_OPTIMIZED"] = "query:optimized";
  ECSEventType2["PERFORMANCE_WARNING"] = "performance:warning";
  ECSEventType2["PERFORMANCE_CRITICAL"] = "performance:critical";
  ECSEventType2["MEMORY_USAGE_HIGH"] = "memory:usage:high";
  ECSEventType2["FRAME_RATE_DROP"] = "frame:rate:drop";
  ECSEventType2["INDEX_CREATED"] = "index:created";
  ECSEventType2["INDEX_UPDATED"] = "index:updated";
  ECSEventType2["INDEX_OPTIMIZED"] = "index:optimized";
  ECSEventType2["ARCHETYPE_CREATED"] = "archetype:created";
  ECSEventType2["ARCHETYPE_ENTITY_ADDED"] = "archetype:entity:added";
  ECSEventType2["ARCHETYPE_ENTITY_REMOVED"] = "archetype:entity:removed";
  ECSEventType2["DIRTY_MARK_ADDED"] = "dirty:mark:added";
  ECSEventType2["DIRTY_BATCH_PROCESSED"] = "dirty:batch:processed";
  ECSEventType2["ERROR_OCCURRED"] = "error:occurred";
  ECSEventType2["WARNING_ISSUED"] = "warning:issued";
  ECSEventType2["FRAMEWORK_INITIALIZED"] = "framework:initialized";
  ECSEventType2["FRAMEWORK_SHUTDOWN"] = "framework:shutdown";
  ECSEventType2["DEBUG_INFO"] = "debug:info";
  ECSEventType2["DEBUG_STATS_UPDATED"] = "debug:stats:updated";
})(ECSEventType || (ECSEventType = {}));
var EventPriority;
(function(EventPriority2) {
  EventPriority2[EventPriority2["LOWEST"] = 0] = "LOWEST";
  EventPriority2[EventPriority2["LOW"] = 25] = "LOW";
  EventPriority2[EventPriority2["NORMAL"] = 50] = "NORMAL";
  EventPriority2[EventPriority2["HIGH"] = 75] = "HIGH";
  EventPriority2[EventPriority2["HIGHEST"] = 100] = "HIGHEST";
  EventPriority2[EventPriority2["CRITICAL"] = 200] = "CRITICAL";
})(EventPriority || (EventPriority = {}));
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
class EventTypeValidator {
  /**
   * 验证事件类型是否有效
   * @param eventType 事件类型
   * @returns 是否有效
   */
  static isValid(eventType) {
    return this.validTypes.has(eventType);
  }
  /**
   * 获取所有有效的事件类型
   * @returns 事件类型数组
   */
  static getAllValidTypes() {
    return Array.from(this.validTypes);
  }
  /**
   * 添加自定义事件类型
   * @param eventType 事件类型
   */
  static addCustomType(eventType) {
    this.validTypes.add(eventType);
  }
  /**
   * 移除自定义事件类型
   * @param eventType 事件类型
   */
  static removeCustomType(eventType) {
    this.validTypes.delete(eventType);
  }
}
EventTypeValidator.validTypes = /* @__PURE__ */ new Set([
  ...Object.values(ECSEventType),
  ...Object.values(EVENT_TYPES.ENTITY),
  ...Object.values(EVENT_TYPES.COMPONENT),
  ...Object.values(EVENT_TYPES.SYSTEM),
  ...Object.values(EVENT_TYPES.PERFORMANCE)
]);
class EventBus {
  constructor(debugMode = false) {
    this.eventIdCounter = 0;
    this.isDebugMode = false;
    this.eventSystem = new TypeSafeEventSystem();
    this.isDebugMode = debugMode;
  }
  /**
   * 发射事件
   * @param eventType 事件类型
   * @param data 事件数据
   * @param enhance 是否增强事件数据（添加timestamp、eventId等），默认false提升性能
   */
  emit(eventType, data, enhance = false) {
    this.validateEventType(eventType);
    const finalData = enhance ? this.enhanceEventData(eventType, data) : data;
    if (this.isDebugMode) {
      EventBus._logger.info(`发射事件: ${eventType}`, finalData);
    }
    this.eventSystem.emitSync(eventType, finalData);
  }
  /**
   * 异步发射事件
   * @param eventType 事件类型
   * @param data 事件数据
   * @param enhance 是否增强事件数据（添加timestamp、eventId等），默认false提升性能
   */
  async emitAsync(eventType, data, enhance = false) {
    this.validateEventType(eventType);
    const finalData = enhance ? this.enhanceEventData(eventType, data) : data;
    if (this.isDebugMode) {
      EventBus._logger.info(`发射异步事件: ${eventType}`, finalData);
    }
    await this.eventSystem.emit(eventType, finalData);
  }
  /**
   * 监听事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   * @param config 监听器配置
   * @returns 监听器ID
   */
  on(eventType, handler, config = {}) {
    this.validateEventType(eventType);
    const eventConfig = {
      once: config.once || false,
      priority: config.priority || EventPriority.NORMAL,
      async: config.async || false,
      context: config.context
    };
    if (this.isDebugMode) {
      EventBus._logger.info(`添加监听器: ${eventType}`, eventConfig);
    }
    return this.eventSystem.on(eventType, handler, eventConfig);
  }
  /**
   * 监听事件（一次性）
   * @param eventType 事件类型
   * @param handler 事件处理器
   * @param config 监听器配置
   * @returns 监听器ID
   */
  once(eventType, handler, config = {}) {
    return this.on(eventType, handler, { ...config, once: true });
  }
  /**
   * 异步监听事件
   * @param eventType 事件类型
   * @param handler 异步事件处理器
   * @param config 监听器配置
   * @returns 监听器ID
   */
  onAsync(eventType, handler, config = {}) {
    return this.on(eventType, handler, { ...config, async: true });
  }
  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listenerId 监听器ID
   */
  off(eventType, listenerId) {
    if (this.isDebugMode) {
      EventBus._logger.info(`移除监听器: ${listenerId} 事件: ${eventType}`);
    }
    return this.eventSystem.off(eventType, listenerId);
  }
  /**
   * 移除指定事件类型的所有监听器
   * @param eventType 事件类型
   */
  offAll(eventType) {
    if (this.isDebugMode) {
      EventBus._logger.info(`移除所有监听器: ${eventType}`);
    }
    this.eventSystem.offAll(eventType);
  }
  /**
   * 检查是否有指定事件的监听器
   * @param eventType 事件类型
   */
  hasListeners(eventType) {
    return this.eventSystem.hasListeners(eventType);
  }
  /**
   * 获取事件统计信息
   * @param eventType 事件类型（可选）
   */
  getStats(eventType) {
    const stats = this.eventSystem.getStats(eventType);
    if (stats instanceof Map) {
      const result = /* @__PURE__ */ new Map();
      stats.forEach((stat, key) => {
        result.set(key, this.convertEventStats(stat));
      });
      return result;
    } else {
      return this.convertEventStats(stats);
    }
  }
  /**
   * 清空所有监听器
   */
  clear() {
    if (this.isDebugMode) {
      EventBus._logger.info("清空所有监听器");
    }
    this.eventSystem.clear();
  }
  /**
   * 启用或禁用事件系统
   * @param enabled 是否启用
   */
  setEnabled(enabled) {
    this.eventSystem.setEnabled(enabled);
  }
  /**
   * 设置调试模式
   * @param debug 是否启用调试
   */
  setDebugMode(debug) {
    this.isDebugMode = debug;
  }
  /**
   * 设置最大监听器数量
   * @param max 最大数量
   */
  setMaxListeners(max) {
    this.eventSystem.setMaxListeners(max);
  }
  /**
   * 获取监听器数量
   * @param eventType 事件类型
   */
  getListenerCount(eventType) {
    return this.eventSystem.getListenerCount(eventType);
  }
  /**
   * 设置事件批处理配置
   * @param eventType 事件类型
   * @param batchSize 批处理大小
   * @param delay 延迟时间（毫秒）
   */
  setBatchConfig(eventType, batchSize, delay) {
    this.eventSystem.setBatchConfig(eventType, {
      batchSize,
      delay,
      enabled: true
    });
  }
  /**
   * 刷新指定事件的批处理队列
   * @param eventType 事件类型
   */
  flushBatch(eventType) {
    this.eventSystem.flushBatch(eventType);
  }
  /**
   * 重置事件统计
   * @param eventType 事件类型（可选）
   */
  resetStats(eventType) {
    this.eventSystem.resetStats(eventType);
  }
  // 便捷方法：发射预定义的ECS事件
  /**
   * 发射实体创建事件
   * @param entityData 实体事件数据
   */
  emitEntityCreated(entityData) {
    this.emit(ECSEventType.ENTITY_CREATED, entityData);
  }
  /**
   * 发射实体销毁事件
   * @param entityData 实体事件数据
   */
  emitEntityDestroyed(entityData) {
    this.emit(ECSEventType.ENTITY_DESTROYED, entityData);
  }
  /**
   * 发射组件添加事件
   * @param componentData 组件事件数据
   */
  emitComponentAdded(componentData) {
    this.emit(ECSEventType.COMPONENT_ADDED, componentData);
  }
  /**
   * 发射组件移除事件
   * @param componentData 组件事件数据
   */
  emitComponentRemoved(componentData) {
    this.emit(ECSEventType.COMPONENT_REMOVED, componentData);
  }
  /**
   * 发射系统添加事件
   * @param systemData 系统事件数据
   */
  emitSystemAdded(systemData) {
    this.emit(ECSEventType.SYSTEM_ADDED, systemData);
  }
  /**
   * 发射系统移除事件
   * @param systemData 系统事件数据
   */
  emitSystemRemoved(systemData) {
    this.emit(ECSEventType.SYSTEM_REMOVED, systemData);
  }
  /**
   * 发射场景变化事件
   * @param sceneData 场景事件数据
   */
  emitSceneChanged(sceneData) {
    this.emit(ECSEventType.SCENE_ACTIVATED, sceneData);
  }
  /**
   * 发射性能警告事件
   * @param performanceData 性能事件数据
   */
  emitPerformanceWarning(performanceData) {
    this.emit(ECSEventType.PERFORMANCE_WARNING, performanceData);
  }
  // 便捷方法：监听预定义的ECS事件
  /**
   * 监听实体创建事件
   * @param handler 事件处理器
   * @param config 监听器配置
   */
  onEntityCreated(handler, config) {
    return this.on(ECSEventType.ENTITY_CREATED, handler, config);
  }
  /**
   * 监听组件添加事件
   * @param handler 事件处理器
   * @param config 监听器配置
   */
  onComponentAdded(handler, config) {
    return this.on(ECSEventType.COMPONENT_ADDED, handler, config);
  }
  /**
   * 监听系统错误事件
   * @param handler 事件处理器
   * @param config 监听器配置
   */
  onSystemError(handler, config) {
    return this.on(ECSEventType.SYSTEM_ERROR, handler, config);
  }
  /**
   * 监听性能警告事件
   * @param handler 事件处理器
   * @param config 监听器配置
   */
  onPerformanceWarning(handler, config) {
    return this.on(ECSEventType.PERFORMANCE_WARNING, handler, config);
  }
  // 私有方法
  /**
   * 验证事件类型（仅在debug模式下执行，提升性能）
   * @param eventType 事件类型
   */
  validateEventType(eventType) {
    if (this.isDebugMode) {
      if (!EventTypeValidator.isValid(eventType)) {
        EventBus._logger.warn(`未知事件类型: ${eventType}`);
        EventTypeValidator.addCustomType(eventType);
      }
    }
  }
  /**
   * 增强事件数据
   * @param eventType 事件类型
   * @param data 原始数据
   */
  enhanceEventData(eventType, data) {
    if (data === null || data === void 0) {
      return {
        timestamp: Date.now(),
        eventId: `${eventType}_${++this.eventIdCounter}`,
        source: "EventBus"
      };
    }
    const enhanced = data;
    if (!enhanced.timestamp) {
      enhanced.timestamp = Date.now();
    }
    if (!enhanced.eventId) {
      enhanced.eventId = `${eventType}_${++this.eventIdCounter}`;
    }
    if (!enhanced.source) {
      enhanced.source = "EventBus";
    }
    return enhanced;
  }
  /**
   * 转换EventStats为IEventStats
   * @param stats EventStats实例
   */
  convertEventStats(stats) {
    return {
      eventType: stats.eventType,
      listenerCount: stats.listenerCount,
      triggerCount: stats.triggerCount,
      totalExecutionTime: stats.totalExecutionTime,
      averageExecutionTime: stats.averageExecutionTime,
      lastTriggerTime: stats.lastTriggerTime
    };
  }
}
EventBus._logger = createLogger("EventBus");
class Scene {
  /**
   * 获取系统列表（兼容性属性）
   */
  get systems() {
    return this.entityProcessors.processors;
  }
  /**
   * 创建场景实例
   */
  constructor(config) {
    this.name = "";
    this._didSceneBegin = false;
    this.entities = new EntityList(this);
    this.entityProcessors = new EntityProcessorList();
    this.identifierPool = new IdentifierPool();
    this.componentStorageManager = new ComponentStorageManager();
    this.querySystem = new QuerySystem();
    this.eventSystem = new TypeSafeEventSystem();
    if (config?.name) {
      this.name = config.name;
    }
    if (config?.enableEntityDirectUpdate !== void 0) {
      this.entities.setEnableEntityDirectUpdate(config.enableEntityDirectUpdate);
    }
    if (!Entity.eventBus) {
      Entity.eventBus = new EventBus(false);
    }
    if (Entity.eventBus) {
      Entity.eventBus.onComponentAdded((data) => {
        this.eventSystem.emitSync("component:added", data);
      });
    }
  }
  /**
   * 初始化场景
   *
   * 在场景创建时调用，子类可以重写此方法来设置初始实体和组件。
   */
  initialize() {
  }
  /**
   * 场景开始运行时的回调
   *
   * 在场景开始运行时调用，可以在此方法中执行场景启动逻辑。
   */
  onStart() {
  }
  /**
   * 场景卸载时的回调
   *
   * 在场景被销毁时调用，可以在此方法中执行清理工作。
   */
  unload() {
  }
  /**
   * 开始场景，启动实体处理器等
   *
   * 这个方法会启动场景。它将启动实体处理器等，并调用onStart方法。
   */
  begin() {
    if (this.entityProcessors != null)
      this.entityProcessors.begin();
    this._didSceneBegin = true;
    this.onStart();
  }
  /**
   * 结束场景，清除实体、实体处理器等
   *
   * 这个方法会结束场景。它将移除所有实体，结束实体处理器等，并调用unload方法。
   */
  end() {
    this._didSceneBegin = false;
    this.entities.removeAllEntities();
    this.querySystem.setEntities([]);
    this.componentStorageManager.clear();
    if (this.entityProcessors)
      this.entityProcessors.end();
    this.unload();
  }
  /**
   * 更新场景
   */
  update() {
    this.entities.updateLists();
    if (this.entityProcessors != null)
      this.entityProcessors.update();
    this.entities.update();
    if (this.entityProcessors != null)
      this.entityProcessors.lateUpdate();
  }
  /**
   * 将实体添加到此场景，并返回它
   * @param name 实体名称
   */
  createEntity(name) {
    let entity = new Entity(name, this.identifierPool.checkOut());
    this.eventSystem.emitSync("entity:created", { entityName: name, entity, scene: this });
    return this.addEntity(entity);
  }
  /**
   * 清除所有EntitySystem的实体缓存
   * 当实体或组件发生变化时调用
   */
  clearSystemEntityCaches() {
    for (const system of this.entityProcessors.processors) {
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
    this.querySystem.addEntity(entity, deferCacheClear);
    if (!deferCacheClear) {
      this.clearSystemEntityCaches();
    }
    this.eventSystem.emitSync("entity:added", { entity, scene: this });
    return entity;
  }
  /**
   * 批量创建实体（高性能版本）
   * @param count 要创建的实体数量
   * @param namePrefix 实体名称前缀
   * @returns 创建的实体列表
   */
  createEntities(count, namePrefix = "Entity") {
    const entities = [];
    for (let i = 0; i < count; i++) {
      const entity = new Entity(`${namePrefix}_${i}`, this.identifierPool.checkOut());
      entity.scene = this;
      entities.push(entity);
    }
    for (const entity of entities) {
      this.entities.add(entity);
    }
    this.querySystem.addEntitiesUnchecked(entities);
    this.eventSystem.emitSync("entities:batch_added", { entities, scene: this, count });
    return entities;
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
   * @param name 实体名称
   */
  getEntityByName(name) {
    return this.findEntity(name);
  }
  /**
   * 根据标签查找实体（别名方法）
   * @param tag 实体标签
   */
  getEntitiesByTag(tag) {
    return this.findEntitiesByTag(tag);
  }
  /**
   * 在场景中添加一个EntitySystem处理器
   * @param processor 处理器
   */
  addEntityProcessor(processor) {
    if (this.entityProcessors.processors.includes(processor)) {
      return processor;
    }
    processor.scene = this;
    this.entityProcessors.add(processor);
    processor.initialize();
    processor.setUpdateOrder(this.entityProcessors.count - 1);
    return processor;
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
    this.entityProcessors.remove(processor);
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
   * @param type 处理器类型
   */
  getEntityProcessor(type) {
    return this.entityProcessors.getProcessor(type);
  }
  /**
   * 获取场景统计信息
   */
  getStats() {
    return {
      entityCount: this.entities.count,
      processorCount: this.entityProcessors.count,
      componentStorageStats: this.componentStorageManager.getAllStats()
    };
  }
  /**
   * 获取场景的调试信息
   */
  getDebugInfo() {
    return {
      name: this.name || this.constructor.name,
      entityCount: this.entities.count,
      processorCount: this.entityProcessors.count,
      isRunning: this._didSceneBegin,
      entities: this.entities.buffer.map((entity) => ({
        name: entity.name,
        id: entity.id,
        componentCount: entity.components.length,
        componentTypes: entity.components.map((c) => getComponentInstanceTypeName(c))
      })),
      processors: this.entityProcessors.processors.map((processor) => ({
        name: getSystemInstanceTypeName(processor),
        updateOrder: processor.updateOrder,
        entityCount: processor._entities?.length || 0
      })),
      componentStats: this.componentStorageManager.getAllStats()
    };
  }
}
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
function createECSAPI(scene, querySystem, eventSystem) {
  return new ECSFluentAPI(scene, querySystem, eventSystem);
}
const logger$1 = createLogger("World");
class World {
  constructor(config = {}) {
    this._scenes = /* @__PURE__ */ new Map();
    this._activeScenes = /* @__PURE__ */ new Set();
    this._globalSystems = [];
    this._isActive = false;
    this._config = {
      name: "World",
      debug: false,
      maxScenes: 10,
      autoCleanup: true,
      ...config
    };
    this.name = this._config.name;
    this._createdAt = Date.now();
    logger$1.info(`创建World: ${this.name}`);
  }
  // ===== Scene管理 =====
  /**
   * 创建并添加Scene到World
   */
  createScene(sceneId, sceneInstance) {
    if (this._scenes.has(sceneId)) {
      throw new Error(`Scene ID '${sceneId}' 已存在于World '${this.name}' 中`);
    }
    if (this._scenes.size >= this._config.maxScenes) {
      throw new Error(`World '${this.name}' 已达到最大Scene数量限制: ${this._config.maxScenes}`);
    }
    const scene = sceneInstance || new Scene();
    if ("id" in scene) {
      scene.id = sceneId;
    }
    if ("name" in scene && !scene.name) {
      scene.name = sceneId;
    }
    this._scenes.set(sceneId, scene);
    scene.initialize();
    logger$1.info(`在World '${this.name}' 中创建Scene: ${sceneId}`);
    return scene;
  }
  /**
   * 移除Scene
   */
  removeScene(sceneId) {
    const scene = this._scenes.get(sceneId);
    if (!scene) {
      return false;
    }
    if (this._activeScenes.has(sceneId)) {
      this.setSceneActive(sceneId, false);
    }
    scene.end();
    this._scenes.delete(sceneId);
    logger$1.info(`从World '${this.name}' 中移除Scene: ${sceneId}`);
    return true;
  }
  /**
   * 获取Scene
   */
  getScene(sceneId) {
    return this._scenes.get(sceneId) || null;
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
   * 设置Scene激活状态
   */
  setSceneActive(sceneId, active) {
    const scene = this._scenes.get(sceneId);
    if (!scene) {
      logger$1.warn(`Scene '${sceneId}' 不存在于World '${this.name}' 中`);
      return;
    }
    if (active) {
      this._activeScenes.add(sceneId);
      if (scene.begin) {
        scene.begin();
      }
      logger$1.debug(`在World '${this.name}' 中激活Scene: ${sceneId}`);
    } else {
      this._activeScenes.delete(sceneId);
      logger$1.debug(`在World '${this.name}' 中停用Scene: ${sceneId}`);
    }
  }
  /**
   * 检查Scene是否激活
   */
  isSceneActive(sceneId) {
    return this._activeScenes.has(sceneId);
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
    logger$1.debug(`在World '${this.name}' 中添加全局System: ${system.name}`);
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
    logger$1.debug(`从World '${this.name}' 中移除全局System: ${system.name}`);
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
    for (const system of this._globalSystems) {
      if (system.initialize) {
        system.initialize();
      }
    }
    logger$1.info(`启动World: ${this.name}`);
  }
  /**
   * 停止World
   */
  stop() {
    if (!this._isActive) {
      return;
    }
    for (const sceneId of this._activeScenes) {
      this.setSceneActive(sceneId, false);
    }
    for (const system of this._globalSystems) {
      if (system.reset) {
        system.reset();
      }
    }
    this._isActive = false;
    logger$1.info(`停止World: ${this.name}`);
  }
  /**
   * 更新World中的全局System
   * 注意：此方法由Core.update()调用，不应直接调用
   */
  updateGlobalSystems() {
    if (!this._isActive) {
      return;
    }
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
    for (const sceneId of this._activeScenes) {
      const scene = this._scenes.get(sceneId);
      if (scene && scene.update) {
        scene.update();
      }
    }
    if (this._config.autoCleanup && this.shouldAutoCleanup()) {
      this.cleanup();
    }
  }
  /**
   * 销毁World
   */
  destroy() {
    logger$1.info(`销毁World: ${this.name}`);
    this.stop();
    const sceneIds = Array.from(this._scenes.keys());
    for (const sceneId of sceneIds) {
      this.removeScene(sceneId);
    }
    for (const system of this._globalSystems) {
      if (system.destroy) {
        system.destroy();
      } else if (system.reset) {
        system.reset();
      }
    }
    this._globalSystems.length = 0;
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
      scenes: Array.from(this._scenes.keys()).map((sceneId) => ({
        id: sceneId,
        isActive: this._activeScenes.has(sceneId),
        name: this._scenes.get(sceneId)?.name || sceneId
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
    const currentTime = Date.now();
    const cleanupThreshold = 5 * 60 * 1e3;
    for (const [sceneId, scene] of this._scenes) {
      if (!this._activeScenes.has(sceneId) && scene.entities && scene.entities.count === 0 && currentTime - this._createdAt > cleanupThreshold) {
        return true;
      }
    }
    return false;
  }
  /**
   * 执行清理操作
   */
  cleanup() {
    const sceneIds = Array.from(this._scenes.keys());
    const currentTime = Date.now();
    const cleanupThreshold = 5 * 60 * 1e3;
    for (const sceneId of sceneIds) {
      const scene = this._scenes.get(sceneId);
      if (scene && !this._activeScenes.has(sceneId) && scene.entities && scene.entities.count === 0 && currentTime - this._createdAt > cleanupThreshold) {
        this.removeScene(sceneId);
        logger$1.debug(`自动清理空Scene: ${sceneId} from World ${this.name}`);
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
const logger = createLogger("WorldManager");
class WorldManager {
  constructor(config = {}) {
    this._worlds = /* @__PURE__ */ new Map();
    this._activeWorlds = /* @__PURE__ */ new Set();
    this._cleanupTimer = null;
    this._isRunning = false;
    this._config = {
      maxWorlds: 50,
      autoCleanup: true,
      cleanupInterval: 3e4,
      // 30秒
      debug: false,
      ...config
    };
    logger.info("WorldManager已初始化", {
      maxWorlds: this._config.maxWorlds,
      autoCleanup: this._config.autoCleanup,
      cleanupInterval: this._config.cleanupInterval
    });
    this.startCleanupTimer();
  }
  /**
   * 获取WorldManager单例实例
   */
  static getInstance(config) {
    if (!this._instance) {
      this._instance = new WorldManager(config);
    }
    return this._instance;
  }
  /**
   * 重置WorldManager实例（主要用于测试）
   */
  static reset() {
    if (this._instance) {
      this._instance.destroy();
      this._instance = null;
    }
  }
  // ===== World管理 =====
  /**
   * 创建新World
   */
  createWorld(worldId, config) {
    if (!worldId || typeof worldId !== "string" || worldId.trim() === "") {
      throw new Error("World ID不能为空");
    }
    if (this._worlds.has(worldId)) {
      throw new Error(`World ID '${worldId}' 已存在`);
    }
    if (this._worlds.size >= this._config.maxWorlds) {
      throw new Error(`已达到最大World数量限制: ${this._config.maxWorlds}`);
    }
    const worldConfig = {
      name: worldId,
      debug: this._config.debug,
      ...config
    };
    const world = new World(worldConfig);
    this._worlds.set(worldId, world);
    logger.info(`创建World: ${worldId}`, { config: worldConfig });
    return world;
  }
  /**
   * 移除World
   */
  removeWorld(worldId) {
    const world = this._worlds.get(worldId);
    if (!world) {
      return false;
    }
    if (this._activeWorlds.has(worldId)) {
      this.setWorldActive(worldId, false);
    }
    world.destroy();
    this._worlds.delete(worldId);
    logger.info(`移除World: ${worldId}`);
    return true;
  }
  /**
   * 获取World
   */
  getWorld(worldId) {
    return this._worlds.get(worldId) || null;
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
  setWorldActive(worldId, active) {
    const world = this._worlds.get(worldId);
    if (!world) {
      logger.warn(`World '${worldId}' 不存在`);
      return;
    }
    if (active) {
      this._activeWorlds.add(worldId);
      world.start();
      logger.debug(`激活World: ${worldId}`);
    } else {
      this._activeWorlds.delete(worldId);
      world.stop();
      logger.debug(`停用World: ${worldId}`);
    }
  }
  /**
   * 检查World是否激活
   */
  isWorldActive(worldId) {
    return this._activeWorlds.has(worldId);
  }
  // ===== 批量操作 =====
  /**
   * 获取所有激活的World
   * 注意：此方法供Core.update()使用
   */
  getActiveWorlds() {
    const activeWorlds = [];
    for (const worldId of this._activeWorlds) {
      const world = this._worlds.get(worldId);
      if (world) {
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
    for (const worldId of this._worlds.keys()) {
      this.setWorldActive(worldId, true);
    }
    logger.info("启动所有World");
  }
  /**
   * 停止所有World
   */
  stopAll() {
    this._isRunning = false;
    for (const worldId of this._activeWorlds) {
      this.setWorldActive(worldId, false);
    }
    logger.info("停止所有World");
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
      activeWorlds: this._activeWorlds.size,
      totalScenes: 0,
      totalEntities: 0,
      totalSystems: 0,
      memoryUsage: 0,
      isRunning: this._isRunning,
      config: { ...this._config },
      worlds: []
    };
    for (const [worldId, world] of this._worlds) {
      const worldStats = world.getStats();
      stats.totalScenes += worldStats.totalSystems;
      stats.totalEntities += worldStats.totalEntities;
      stats.totalSystems += worldStats.totalSystems;
      stats.worlds.push({
        id: worldId,
        name: world.name,
        isActive: this._activeWorlds.has(worldId),
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
      worlds: Array.from(this._worlds.entries()).map(([worldId, world]) => ({
        id: worldId,
        isActive: this._activeWorlds.has(worldId),
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
    for (const [worldId, world] of this._worlds) {
      if (this.shouldCleanupWorld(world)) {
        worldsToRemove.push(worldId);
      }
    }
    for (const worldId of worldsToRemove) {
      this.removeWorld(worldId);
    }
    if (worldsToRemove.length > 0) {
      logger.debug(`清理了 ${worldsToRemove.length} 个World`);
    }
    return worldsToRemove.length;
  }
  /**
   * 销毁WorldManager
   */
  destroy() {
    logger.info("正在销毁WorldManager...");
    this.stopCleanupTimer();
    this.stopAll();
    const worldIds = Array.from(this._worlds.keys());
    for (const worldId of worldIds) {
      this.removeWorld(worldId);
    }
    this._worlds.clear();
    this._activeWorlds.clear();
    this._isRunning = false;
    logger.info("WorldManager已销毁");
  }
  // ===== 私有方法 =====
  /**
   * 启动清理定时器
   */
  startCleanupTimer() {
    if (!this._config.autoCleanup || this._cleanupTimer) {
      return;
    }
    this._cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this._config.cleanupInterval);
    logger.debug(`启动World清理定时器，间隔: ${this._config.cleanupInterval}ms`);
  }
  /**
   * 停止清理定时器
   */
  stopCleanupTimer() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
      logger.debug("停止World清理定时器");
    }
  }
  /**
   * 判断World是否应该被清理
   */
  shouldCleanupWorld(world) {
    if (world.isActive) {
      return false;
    }
    if (world.sceneCount === 0) {
      const age = Date.now() - world.createdAt;
      return age > 10 * 60 * 1e3;
    }
    const allScenes = world.getAllScenes();
    const hasEntities = allScenes.some((scene) => scene.entities && scene.entities.count > 0);
    if (!hasEntities) {
      const age = Date.now() - world.createdAt;
      return age > 10 * 60 * 1e3;
    }
    return false;
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
    return this._activeWorlds.size;
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
WorldManager._instance = null;
class Bits {
  /**
   * 构造函数，创建位集合
   * @param initialValue 初始值，可以是BitMask64Data对象、数字或字符串
   */
  constructor(initialValue) {
    if (initialValue && typeof initialValue === "object") {
      this._value = BitMask64Utils.clone(initialValue);
    } else if (typeof initialValue === "number") {
      this._value = BitMask64Utils.fromNumber(initialValue);
    } else if (typeof initialValue === "string") {
      const num = parseInt(initialValue, 10);
      this._value = BitMask64Utils.fromNumber(num);
    } else {
      this._value = BitMask64Utils.clone(BitMask64Utils.ZERO);
    }
  }
  /**
   * 设置指定位为1
   * @param index 位索引，范围 [0, 63]
   * @throws 当位索引为负数或超过64位限制时抛出错误
   */
  set(index) {
    if (index < 0) {
      throw new Error("Bit index cannot be negative");
    }
    if (index >= 64) {
      throw new Error("Bit index exceeds 64-bit limit. ECS framework supports max 64 component types.");
    }
    BitMask64Utils.setBit(this._value, index);
  }
  /**
   * 清除指定位为0
   * @param index 位索引，范围 [0, 63]
   * @throws 当位索引为负数时抛出错误
   */
  clear(index) {
    if (index < 0) {
      throw new Error("Bit index cannot be negative");
    }
    if (index >= 64) {
      return;
    }
    BitMask64Utils.clearBit(this._value, index);
  }
  /**
   * 获取指定位的值
   * @param index 位索引
   * @returns 如果位被设置为1则返回true，否则返回false
   */
  get(index) {
    if (index < 0 || index >= 64) {
      return false;
    }
    const mask = BitMask64Utils.create(index);
    return BitMask64Utils.hasAny(this._value, mask);
  }
  /**
   * 检查是否包含另一个位集合的所有位
   * @param other 另一个位集合
   * @returns 如果包含other的所有设置位则返回true
   */
  containsAll(other) {
    return BitMask64Utils.hasAll(this._value, other._value);
  }
  /**
   * 检查是否与另一个位集合有交集
   * @param other 另一个位集合
   * @returns 如果有共同的设置位则返回true
   */
  intersects(other) {
    return BitMask64Utils.hasAny(this._value, other._value);
  }
  /**
   * 检查是否与另一个位集合没有交集
   * @param other 另一个位集合
   * @returns 如果没有共同的设置位则返回true
   */
  excludes(other) {
    return BitMask64Utils.hasNone(this._value, other._value);
  }
  /**
   * 清除所有位为0
   */
  clearAll() {
    BitMask64Utils.clear(this._value);
  }
  /**
   * 检查位集合是否为空
   * @returns 如果所有位都为0则返回true
   */
  isEmpty() {
    return BitMask64Utils.isZero(this._value);
  }
  /**
   * 计算设置为1的位数
   * @returns 设置位的总数
   */
  cardinality() {
    return BitMask64Utils.popCount(this._value);
  }
  /**
   * 与另一个位集合执行按位与操作
   * @param other 另一个位集合
   * @returns 新的位集合，包含按位与的结果
   */
  and(other) {
    const result = new Bits();
    BitMask64Utils.copy(this._value, result._value);
    BitMask64Utils.andInPlace(result._value, other._value);
    return result;
  }
  /**
   * 与另一个位集合执行按位或操作
   * @param other 另一个位集合
   * @returns 新的位集合，包含按位或的结果
   */
  or(other) {
    const result = new Bits();
    BitMask64Utils.copy(this._value, result._value);
    BitMask64Utils.orInPlace(result._value, other._value);
    return result;
  }
  /**
   * 与另一个位集合执行按位异或操作
   * @param other 另一个位集合
   * @returns 新的位集合，包含按位异或的结果
   */
  xor(other) {
    const result = new Bits();
    BitMask64Utils.copy(this._value, result._value);
    BitMask64Utils.xorInPlace(result._value, other._value);
    return result;
  }
  /**
   * 执行按位取反操作
   * @param maxBits 最大位数，默认为64
   * @returns 新的位集合，包含按位取反的结果
   */
  not(maxBits = 64) {
    if (maxBits > 64) {
      maxBits = 64;
    }
    const result = new Bits();
    BitMask64Utils.copy(this._value, result._value);
    if (maxBits <= 32) {
      const mask = (1 << maxBits) - 1;
      result._value.lo = ~result._value.lo & mask;
      result._value.hi = 0;
    } else {
      result._value.lo = ~result._value.lo;
      if (maxBits < 64) {
        const remainingBits = maxBits - 32;
        const mask = (1 << remainingBits) - 1;
        result._value.hi = ~result._value.hi & mask;
      } else {
        result._value.hi = ~result._value.hi;
      }
    }
    return result;
  }
  /**
   * 从另一个位集合复制值
   * @param other 源位集合
   */
  copyFrom(other) {
    BitMask64Utils.copy(other._value, this._value);
  }
  /**
   * 创建当前位集合的深拷贝
   * @returns 新的位集合，内容与当前位集合相同
   */
  clone() {
    return new Bits(this._value);
  }
  /**
   * 获取内部的64位掩码数据
   * @returns 内部存储的BitMask64Data对象
   */
  getValue() {
    return this._value;
  }
  /**
   * 设置位集合的值
   * @param value 新值，可以是BitMask64Data对象、数字或字符串
   */
  setValue(value) {
    if (typeof value === "object") {
      BitMask64Utils.copy(value, this._value);
    } else if (typeof value === "number") {
      this._value = BitMask64Utils.fromNumber(value);
    } else {
      const num = parseInt(value, 10);
      this._value = BitMask64Utils.fromNumber(num);
    }
  }
  /**
   * 将位集合转换为可读字符串
   * @returns 格式为"Bits[index1, index2, ...]"的字符串
   */
  toString() {
    const bits = [];
    for (let i = 0; i < 64; i++) {
      if (this.get(i)) {
        bits.push(i.toString());
      }
    }
    return `Bits[${bits.join(", ")}]`;
  }
  /**
   * 将位集合转换为二进制字符串
   * @param maxBits 最大位数，默认为64
   * @returns 二进制字符串表示，每8位用空格分隔
   */
  toBinaryString(maxBits = 64) {
    if (maxBits > 64)
      maxBits = 64;
    let result = "";
    for (let i = maxBits - 1; i >= 0; i--) {
      result += this.get(i) ? "1" : "0";
      if (i % 8 === 0 && i > 0) {
        result += " ";
      }
    }
    return result;
  }
  /**
   * 将位集合转换为十六进制字符串
   * @returns 十六进制字符串表示，带0x前缀
   */
  toHexString() {
    return BitMask64Utils.toString(this._value, 16);
  }
  /**
   * 从二进制字符串创建位集合
   * @param binaryString 二进制字符串，可以包含空格
   * @returns 新的位集合对象
   */
  static fromBinaryString(binaryString) {
    const cleanString = binaryString.replace(/\s/g, "");
    let data;
    if (cleanString.length <= 32) {
      const num = parseInt(cleanString, 2);
      data = { lo: num >>> 0, hi: 0 };
    } else {
      const loBits = cleanString.substring(cleanString.length - 32);
      const hiBits = cleanString.substring(0, cleanString.length - 32);
      const lo = parseInt(loBits, 2);
      const hi = parseInt(hiBits, 2);
      data = { lo: lo >>> 0, hi: hi >>> 0 };
    }
    return new Bits(data);
  }
  /**
   * 从十六进制字符串创建位集合
   * @param hexString 十六进制字符串，可以带或不带0x前缀
   * @returns 新的位集合对象
   */
  static fromHexString(hexString) {
    const cleanString = hexString.replace(/^0x/i, "");
    let data;
    if (cleanString.length <= 8) {
      const num = parseInt(cleanString, 16);
      data = { lo: num >>> 0, hi: 0 };
    } else {
      const loBits = cleanString.substring(cleanString.length - 8);
      const hiBits = cleanString.substring(0, cleanString.length - 8);
      const lo = parseInt(loBits, 16);
      const hi = parseInt(hiBits, 16);
      data = { lo: lo >>> 0, hi: hi >>> 0 };
    }
    return new Bits(data);
  }
  /**
   * 检查是否与另一个位集合相等
   * @param other 另一个位集合
   * @returns 如果两个位集合完全相同则返回true
   */
  equals(other) {
    return BitMask64Utils.equals(this._value, other._value);
  }
  /**
   * 获取最高位设置位的索引
   * @returns 最高位设置位的索引，如果位集合为空则返回-1
   */
  getHighestBitIndex() {
    if (BitMask64Utils.isZero(this._value)) {
      return -1;
    }
    if (this._value.hi !== 0) {
      for (let i = 31; i >= 0; i--) {
        if ((this._value.hi & 1 << i) !== 0) {
          return i + 32;
        }
      }
    }
    for (let i = 31; i >= 0; i--) {
      if ((this._value.lo & 1 << i) !== 0) {
        return i;
      }
    }
    return -1;
  }
  /**
   * 获取最低位设置位的索引
   * @returns 最低位设置位的索引，如果位集合为空则返回-1
   */
  getLowestBitIndex() {
    if (BitMask64Utils.isZero(this._value)) {
      return -1;
    }
    for (let i = 0; i < 32; i++) {
      if ((this._value.lo & 1 << i) !== 0) {
        return i;
      }
    }
    for (let i = 0; i < 32; i++) {
      if ((this._value.hi & 1 << i) !== 0) {
        return i + 32;
      }
    }
    return -1;
  }
}
class ComponentTypeManager {
  /**
   * 获取单例实例
   */
  static get instance() {
    if (!ComponentTypeManager._instance) {
      ComponentTypeManager._instance = new ComponentTypeManager();
    }
    return ComponentTypeManager._instance;
  }
  constructor() {
    this._componentTypes = /* @__PURE__ */ new Map();
    this._typeNames = /* @__PURE__ */ new Map();
    this._nextTypeId = 0;
  }
  /**
   * 获取组件类型的ID
   * @param componentType 组件类型构造函数
   * @returns 组件类型ID
   */
  getTypeId(componentType) {
    let typeId = this._componentTypes.get(componentType);
    if (typeId === void 0) {
      typeId = this._nextTypeId++;
      this._componentTypes.set(componentType, typeId);
      this._typeNames.set(typeId, getComponentTypeName(componentType));
    }
    return typeId;
  }
  /**
   * 获取组件类型名称
   * @param typeId 组件类型ID
   * @returns 组件类型名称
   */
  getTypeName(typeId) {
    return this._typeNames.get(typeId) || "Unknown";
  }
  /**
   * 创建包含指定组件类型的Bits对象
   * @param componentTypes 组件类型构造函数数组
   * @returns Bits对象
   */
  createBits(...componentTypes) {
    const bits = new Bits();
    for (const componentType of componentTypes) {
      const typeId = this.getTypeId(componentType);
      bits.set(typeId);
    }
    return bits;
  }
  /**
   * 获取实体的组件位掩码
   * @param components 组件数组
   * @returns Bits对象
   */
  getEntityBits(components) {
    const bits = new Bits();
    for (const component of components) {
      const typeId = this.getTypeId(component.constructor);
      bits.set(typeId);
    }
    return bits;
  }
  /**
   * 重置管理器（主要用于测试）
   */
  reset() {
    this._componentTypes.clear();
    this._typeNames.clear();
    this._nextTypeId = 0;
  }
  /**
   * 获取已注册的组件类型数量
   */
  get registeredTypeCount() {
    return this._componentTypes.size;
  }
}
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
    } catch (error) {
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
      const baseDebugInfo = entity.getDebugInfo ? entity.getDebugInfo() : this.buildFallbackEntityInfo(entity, scene);
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
    } catch (error) {
      return {
        error: `获取实体详情失败: ${error instanceof Error ? error.message : String(error)}`,
        scene: "获取失败",
        components: [],
        componentCount: 0,
        componentTypes: []
      };
    }
  }
  getSceneInfo(scene) {
    let sceneName = "当前场景";
    let sceneType = "Scene";
    try {
      if (scene.name && typeof scene.name === "string" && scene.name.trim()) {
        sceneName = scene.name.trim();
      } else if (scene.constructor && scene.constructor.name) {
        sceneName = scene.constructor.name;
        sceneType = scene.constructor.name;
      } else if (scene._name && typeof scene._name === "string" && scene._name.trim()) {
        sceneName = scene._name.trim();
      } else {
        const sceneClassName = Object.getPrototypeOf(scene)?.constructor?.name;
        if (sceneClassName && sceneClassName !== "Object") {
          sceneName = sceneClassName;
          sceneType = sceneClassName;
        }
      }
    } catch (error) {
      sceneName = "场景名获取失败";
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
    } catch (error) {
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
    if (scene && scene.archetypeSystem && typeof scene.archetypeSystem.getAllArchetypes === "function") {
      return this.extractArchetypeStatistics(scene.archetypeSystem);
    }
    const entityContainer = { entities: scene.entities?.buffer || [] };
    return {
      distribution: this.getArchetypeDistributionFast(entityContainer),
      topEntities: this.getTopEntitiesByComponentsFast(entityContainer)
    };
  }
  getArchetypeDistributionFast(entityContainer) {
    const distribution = /* @__PURE__ */ new Map();
    if (entityContainer && entityContainer.entities) {
      entityContainer.entities.forEach((entity) => {
        const componentTypes = entity.components?.map((comp) => getComponentInstanceTypeName(comp)) || [];
        const signature = componentTypes.length > 0 ? componentTypes.sort().join(", ") : "无组件";
        const existing = distribution.get(signature);
        if (existing) {
          existing.count++;
        } else {
          distribution.set(signature, { count: 1, componentTypes });
        }
      });
    }
    return Array.from(distribution.entries()).map(([signature, data]) => ({
      signature,
      count: data.count,
      memory: 0
    })).sort((a, b) => b.count - a.count).slice(0, 20);
  }
  getTopEntitiesByComponentsFast(entityContainer) {
    if (!entityContainer || !entityContainer.entities) {
      return [];
    }
    return entityContainer.entities.map((entity) => ({
      id: entity.id.toString(),
      name: entity.name || `Entity_${entity.id}`,
      componentCount: entity.components?.length || 0,
      memory: 0
    })).sort((a, b) => b.componentCount - a.componentCount).slice(0, 10);
  }
  collectArchetypeDataWithMemory(scene) {
    if (scene && scene.archetypeSystem && typeof scene.archetypeSystem.getAllArchetypes === "function") {
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
      const signature = archetype.componentTypes?.map((type) => type.name).join(",") || "Unknown";
      const entityCount = archetype.entities?.length || 0;
      distribution.push({
        signature,
        count: entityCount,
        memory: 0
      });
      if (archetype.entities) {
        archetype.entities.slice(0, 5).forEach((entity) => {
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
      const signature = archetype.componentTypes?.map((type) => type.name).join(",") || "Unknown";
      const entityCount = archetype.entities?.length || 0;
      let actualMemory = 0;
      if (archetype.entities && archetype.entities.length > 0) {
        const sampleSize = Math.min(5, archetype.entities.length);
        let sampleMemory = 0;
        for (let i = 0; i < sampleSize; i++) {
          sampleMemory += this.estimateEntityMemoryUsage(archetype.entities[i]);
        }
        actualMemory = sampleMemory / sampleSize * entityCount;
      }
      distribution.push({
        signature,
        count: entityCount,
        memory: actualMemory
      });
      if (archetype.entities) {
        archetype.entities.slice(0, 5).forEach((entity) => {
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
  getArchetypeDistribution(entityContainer) {
    const distribution = /* @__PURE__ */ new Map();
    if (entityContainer && entityContainer.entities) {
      entityContainer.entities.forEach((entity) => {
        const signature = entity.componentMask?.toString() || "0";
        const existing = distribution.get(signature);
        distribution.set(signature, (existing || 0) + 1);
      });
    }
    return Array.from(distribution.entries()).map(([signature, count]) => ({ signature, count, memory: 0 })).sort((a, b) => b.count - a.count);
  }
  getArchetypeDistributionWithMemory(entityContainer) {
    const distribution = /* @__PURE__ */ new Map();
    if (entityContainer && entityContainer.entities) {
      entityContainer.entities.forEach((entity) => {
        const componentTypes = entity.components?.map((comp) => getComponentInstanceTypeName(comp)) || [];
        const signature = componentTypes.length > 0 ? componentTypes.sort().join(", ") : "无组件";
        const existing = distribution.get(signature);
        let memory = this.estimateEntityMemoryUsage(entity);
        if (isNaN(memory) || memory < 0) {
          memory = 0;
        }
        if (existing) {
          existing.count++;
          existing.memory += memory;
        } else {
          distribution.set(signature, { count: 1, memory, componentTypes });
        }
      });
    }
    return Array.from(distribution.entries()).map(([signature, data]) => ({
      signature,
      count: data.count,
      memory: isNaN(data.memory) ? 0 : data.memory
    })).sort((a, b) => b.count - a.count);
  }
  getTopEntitiesByComponents(entityContainer) {
    if (!entityContainer || !entityContainer.entities) {
      return [];
    }
    return entityContainer.entities.map((entity) => ({
      id: entity.id.toString(),
      name: entity.name || `Entity_${entity.id}`,
      componentCount: entity.components?.length || 0,
      memory: 0
    })).sort((a, b) => b.componentCount - a.componentCount);
  }
  getTopEntitiesByComponentsWithMemory(entityContainer) {
    if (!entityContainer || !entityContainer.entities) {
      return [];
    }
    return entityContainer.entities.map((entity) => ({
      id: entity.id.toString(),
      name: entity.name || `Entity_${entity.id}`,
      componentCount: entity.components?.length || 0,
      memory: this.estimateEntityMemoryUsage(entity)
    })).sort((a, b) => b.componentCount - a.componentCount);
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
    const activeEntities = allEntities.filter((entity) => entity.enabled && !entity._isDestroyed);
    return {
      totalEntities: allEntities.length,
      activeEntities: activeEntities.length,
      pendingAdd: 0,
      pendingRemove: 0,
      averageComponentsPerEntity: activeEntities.length > 0 ? allEntities.reduce((sum, e) => sum + (e.components?.length || 0), 0) / activeEntities.length : 0
    };
  }
  estimateEntityMemoryUsage(entity) {
    try {
      let totalSize = 0;
      const entitySize = this.calculateObjectSize(entity, ["components", "children", "parent"]);
      if (!isNaN(entitySize) && entitySize > 0) {
        totalSize += entitySize;
      }
      if (entity.components && Array.isArray(entity.components)) {
        entity.components.forEach((component) => {
          const componentSize = this.calculateObjectSize(component, ["entity"]);
          if (!isNaN(componentSize) && componentSize > 0) {
            totalSize += componentSize;
          }
        });
      }
      return isNaN(totalSize) || totalSize < 0 ? 0 : totalSize;
    } catch (error) {
      return 0;
    }
  }
  calculateObjectSize(obj, excludeKeys = []) {
    if (!obj || typeof obj !== "object")
      return 0;
    const visited = /* @__PURE__ */ new WeakSet();
    const maxDepth = 2;
    const calculate = (item, depth = 0) => {
      if (!item || typeof item !== "object" || depth >= maxDepth) {
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
          if (excludeKeys.includes(key) || key === "constructor" || key === "__proto__" || key.startsWith("_cc_") || key.startsWith("__")) {
            continue;
          }
          const value = item[key];
          itemSize += key.length * 2;
          if (typeof value === "string") {
            itemSize += Math.min(value.length * 2, 200);
          } else if (typeof value === "number") {
            itemSize += 8;
          } else if (typeof value === "boolean") {
            itemSize += 4;
          } else if (Array.isArray(value)) {
            itemSize += 40 + Math.min(value.length * 8, 160);
          } else if (typeof value === "object" && value !== null) {
            itemSize += calculate(value, depth + 1);
          }
        }
      } catch (error) {
        return 64;
      }
      return itemSize;
    };
    try {
      const size = calculate(obj);
      return Math.max(size, 32);
    } catch (error) {
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
    if (entity.children && entity.children.length > 0) {
      node.children = entity.children.map((child) => this.buildEntityHierarchyNode(child));
    }
    if (typeof entity.getDebugInfo === "function") {
      const debugInfo = entity.getDebugInfo();
      node = {
        ...node,
        ...debugInfo
      };
    }
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
        const baseDebugInfo = entity.getDebugInfo ? entity.getDebugInfo() : this.buildFallbackEntityInfo(entity, scene);
        const componentCacheStats = entity.getComponentCacheStats ? entity.getComponentCacheStats() : null;
        const componentDetails = this.extractComponentDetails(entity.components);
        entityDetailsMap[entity.id] = {
          ...baseDebugInfo,
          parentName: entity.parent?.name || null,
          components: componentDetails,
          componentTypes: baseDebugInfo.componentTypes || componentDetails.map((comp) => comp.typeName),
          cachePerformance: componentCacheStats ? {
            hitRate: componentCacheStats.cacheStats.hitRate,
            size: componentCacheStats.cacheStats.size,
            maxSize: componentCacheStats.cacheStats.maxSize
          } : null
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
      componentMask: entity.componentMask?.toString() || "0",
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
      let typeName = getComponentInstanceTypeName(component);
      if (!typeName || typeName === "Object" || typeName === "Function") {
        try {
          const typeManager = ComponentTypeManager.instance;
          const componentType = component.constructor;
          const typeId = typeManager.getTypeId(componentType);
          typeName = typeManager.getTypeName(typeId);
        } catch (error) {
          typeName = "UnknownComponent";
        }
      }
      const properties = {};
      try {
        const propertyKeys = Object.keys(component);
        propertyKeys.forEach((propertyKey) => {
          if (!propertyKey.startsWith("_") && propertyKey !== "entity" && propertyKey !== "constructor") {
            const propertyValue = component[propertyKey];
            if (propertyValue !== void 0 && propertyValue !== null) {
              properties[propertyKey] = this.formatPropertyValue(propertyValue);
            }
          }
        });
        if (Object.keys(properties).length === 0) {
          properties._info = "该组件没有公开属性";
          properties._componentId = getComponentInstanceTypeName(component);
        }
      } catch (error) {
        properties._error = "属性提取失败";
        properties._componentId = getComponentInstanceTypeName(component);
      }
      return {
        typeName,
        properties
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
        if (!propertyKey.startsWith("_") && propertyKey !== "entity") {
          const propertyValue = component[propertyKey];
          if (propertyValue !== void 0 && propertyValue !== null) {
            properties[propertyKey] = this.formatPropertyValue(propertyValue);
          }
        }
      });
      return properties;
    } catch (error) {
      return { _error: "属性提取失败" };
    }
  }
  /**
   * 格式化属性值
   */
  formatPropertyValue(value, depth = 0) {
    if (value === null || value === void 0) {
      return value;
    }
    if (typeof value !== "object") {
      if (typeof value === "string" && value.length > 200) {
        return `[长字符串: ${value.length}字符] ${value.substring(0, 100)}...`;
      }
      return value;
    }
    if (depth === 0) {
      return this.formatObjectFirstLevel(value);
    } else {
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
        if (key.startsWith("_") || key.startsWith("$") || typeof obj[key] === "function") {
          continue;
        }
        try {
          const value = obj[key];
          if (value !== null && value !== void 0) {
            result[key] = this.formatPropertyValue(value, 1);
            processedCount++;
          }
        } catch (error) {
          result[key] = `[访问失败: ${error instanceof Error ? error.message : String(error)}]`;
          processedCount++;
        }
      }
      return result;
    } catch (error) {
      return `[对象解析失败: ${error instanceof Error ? error.message : String(error)}]`;
    }
  }
  /**
   * 创建懒加载占位符
   */
  createLazyLoadPlaceholder(obj) {
    try {
      const typeName = obj.constructor?.name || "Object";
      const summary = this.getObjectSummary(obj, typeName);
      return {
        _isLazyObject: true,
        _typeName: typeName,
        _summary: summary,
        _objectId: this.generateObjectId(obj)
      };
    } catch (error) {
      return {
        _isLazyObject: true,
        _typeName: "Unknown",
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
      if (typeName.toLowerCase().includes("vec") || typeName.toLowerCase().includes("vector")) {
        if (obj.x !== void 0 && obj.y !== void 0) {
          const z = obj.z !== void 0 ? obj.z : "";
          return `${typeName}(${obj.x}, ${obj.y}${z ? ", " + z : ""})`;
        }
      }
      if (typeName.toLowerCase().includes("color")) {
        if (obj.r !== void 0 && obj.g !== void 0 && obj.b !== void 0) {
          const a = obj.a !== void 0 ? obj.a : 1;
          return `${typeName}(${obj.r}, ${obj.g}, ${obj.b}, ${a})`;
        }
      }
      if (typeName.toLowerCase().includes("node")) {
        const name = obj.name || obj._name || "未命名";
        return `${typeName}: ${name}`;
      }
      if (typeName.toLowerCase().includes("component")) {
        const nodeName = obj.node?.name || obj.node?._name || "";
        return `${typeName}${nodeName ? ` on ${nodeName}` : ""}`;
      }
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return `${typeName} (空对象)`;
      }
      return `${typeName} (${keys.length}个属性)`;
    } catch (error) {
      return `${typeName} (无法分析)`;
    }
  }
  /**
   * 生成对象ID
   */
  generateObjectId(obj) {
    try {
      if (obj.id !== void 0)
        return `obj_${obj.id}`;
      if (obj._id !== void 0)
        return `obj_${obj._id}`;
      if (obj.uuid !== void 0)
        return `obj_${obj.uuid}`;
      if (obj._uuid !== void 0)
        return `obj_${obj._uuid}`;
      return `obj_${Math.random().toString(36).substr(2, 9)}`;
    } catch {
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
      const entity = entityList.buffer.find((e) => e.id === entityId);
      if (!entity)
        return null;
      if (componentIndex >= entity.components.length)
        return null;
      const component = entity.components[componentIndex];
      const targetObject = this.getObjectByPath(component, propertyPath);
      if (!targetObject)
        return null;
      return this.formatObjectFirstLevel(targetObject);
    } catch (error) {
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
    const parts = path.split(".");
    let current = root;
    for (const part of parts) {
      if (current === null || current === void 0)
        return null;
      if (part.includes("[") && part.includes("]")) {
        const arrayName = part.substring(0, part.indexOf("["));
        const index = parseInt(part.substring(part.indexOf("[") + 1, part.indexOf("]")));
        if (arrayName) {
          current = current[arrayName];
        }
        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current = current[index];
        } else {
          return null;
        }
      } else {
        current = current[part];
      }
    }
    return current;
  }
}
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
    let systemStats = /* @__PURE__ */ new Map();
    let systemData = /* @__PURE__ */ new Map();
    if (performanceMonitor) {
      try {
        systemStats = performanceMonitor.getAllSystemStats();
        systemData = performanceMonitor.getAllSystemData();
      } catch (error) {
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
          minExecutionTime: stats?.minTime === Number.MAX_VALUE ? 0 : stats?.minTime || 0,
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
class PerformanceDataCollector {
  constructor() {
    this.frameTimeHistory = [];
    this.maxHistoryLength = 60;
    this.lastGCCount = 0;
    this.gcCollections = 0;
    this.lastMemoryCheck = 0;
  }
  /**
   * 收集性能数据
   */
  collectPerformanceData(performanceMonitor) {
    const frameTimeSeconds = Time.deltaTime;
    const engineFrameTimeMs = frameTimeSeconds * 1e3;
    const currentFps = frameTimeSeconds > 0 ? Math.round(1 / frameTimeSeconds) : 0;
    const ecsPerformanceData = this.getECSPerformanceData(performanceMonitor);
    const ecsExecutionTimeMs = ecsPerformanceData.totalExecutionTime;
    const ecsPercentage = engineFrameTimeMs > 0 ? ecsExecutionTimeMs / engineFrameTimeMs * 100 : 0;
    let memoryUsage = 0;
    if (performance.memory) {
      memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
    }
    this.frameTimeHistory.push(ecsExecutionTimeMs);
    if (this.frameTimeHistory.length > this.maxHistoryLength) {
      this.frameTimeHistory.shift();
    }
    const history = this.frameTimeHistory.filter((t) => t >= 0);
    const averageECSTime = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : ecsExecutionTimeMs;
    const minECSTime = history.length > 0 ? Math.min(...history) : ecsExecutionTimeMs;
    const maxECSTime = history.length > 0 ? Math.max(...history) : ecsExecutionTimeMs;
    return {
      frameTime: ecsExecutionTimeMs,
      engineFrameTime: engineFrameTimeMs,
      ecsPercentage,
      memoryUsage,
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
    if (!performanceMonitor) {
      return { totalExecutionTime: 0, systemBreakdown: [] };
    }
    if (!performanceMonitor.enabled) {
      try {
        performanceMonitor.enabled = true;
      } catch (error) {
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
      for (const [systemName, stat] of stats.entries()) {
        const systemTime = stat.recentTimes && stat.recentTimes.length > 0 ? stat.recentTimes[stat.recentTimes.length - 1] : stat.averageTime || 0;
        totalTime += systemTime;
        systemBreakdown.push({
          systemName,
          executionTime: systemTime,
          percentage: 0
          // 后面计算
        });
      }
      systemBreakdown.forEach((system) => {
        system.percentage = totalTime > 0 ? system.executionTime / totalTime * 100 : 0;
      });
      systemBreakdown.sort((a, b) => b.executionTime - a.executionTime);
      return {
        totalExecutionTime: totalTime,
        systemBreakdown
      };
    } catch (error) {
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
          systemName,
          averageTime: stat.averageTime || 0,
          maxTime: stat.maxTime || 0,
          minTime: stat.minTime === Number.MAX_VALUE ? 0 : stat.minTime || 0,
          samples: stat.executionCount || 0,
          percentage: 0,
          entityCount: data?.entityCount || 0,
          lastExecutionTime: data?.executionTime || 0
        };
      });
    } catch (error) {
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
        if (this.lastMemoryCheck > 0) {
          const memoryDrop = this.lastMemoryCheck - memoryInfo.usedMemory;
          if (memoryDrop > 1024 * 1024) {
            this.gcCollections++;
          }
        }
        this.lastMemoryCheck = memoryInfo.usedMemory;
      } else {
        memoryInfo.totalMemory = 512 * 1024 * 1024;
        memoryInfo.freeMemory = 512 * 1024 * 1024;
      }
    } catch (error) {
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
      if (typeof PerformanceObserver !== "undefined") {
        return this.gcCollections;
      }
      if (performance.measureUserAgentSpecificMemory) {
        return this.gcCollections;
      }
      return this.gcCollections;
    } catch (error) {
      return this.gcCollections;
    }
  }
}
class ComponentPool {
  constructor(createFn, resetFn, maxSize = 1e3) {
    this.pool = [];
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }
  /**
   * 获取一个组件实例
   */
  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.createFn();
  }
  /**
   * 释放一个组件实例回池中
   */
  release(component) {
    if (this.pool.length < this.maxSize) {
      if (this.resetFn) {
        this.resetFn(component);
      }
      this.pool.push(component);
    }
  }
  /**
   * 预填充对象池
   */
  prewarm(count) {
    for (let i = 0; i < count && this.pool.length < this.maxSize; i++) {
      this.pool.push(this.createFn());
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
}
class ComponentPoolManager {
  constructor() {
    this.pools = /* @__PURE__ */ new Map();
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
  registerPool(componentName, createFn, resetFn, maxSize) {
    this.pools.set(componentName, new ComponentPool(createFn, resetFn, maxSize));
  }
  /**
   * 获取组件实例
   */
  acquireComponent(componentName) {
    const pool = this.pools.get(componentName);
    return pool ? pool.acquire() : null;
  }
  /**
   * 释放组件实例
   */
  releaseComponent(componentName, component) {
    const pool = this.pools.get(componentName);
    if (pool) {
      pool.release(component);
    }
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
   * 重置管理器，移除所有注册的池
   */
  reset() {
    this.pools.clear();
  }
  /**
   * 获取池统计信息
   */
  getPoolStats() {
    const stats = /* @__PURE__ */ new Map();
    for (const [name, pool] of this.pools) {
      stats.set(name, {
        available: pool.getAvailableCount(),
        maxSize: pool.getMaxSize()
      });
    }
    return stats;
  }
  /**
   * 获取池利用率信息（用于调试）
   */
  getPoolUtilization() {
    const utilization = /* @__PURE__ */ new Map();
    for (const [name, pool] of this.pools) {
      const available = pool.getAvailableCount();
      const maxSize = pool.getMaxSize();
      const used = maxSize - available;
      const utilRate = maxSize > 0 ? used / maxSize * 100 : 0;
      utilization.set(name, {
        used,
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
    return maxSize > 0 ? used / maxSize * 100 : 0;
  }
}
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
    const componentStats = /* @__PURE__ */ new Map();
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
    let poolUtilizations = /* @__PURE__ */ new Map();
    let poolSizes = /* @__PURE__ */ new Map();
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
    } catch (error) {
    }
    return {
      componentTypes: componentStats.size,
      componentInstances: totalInstances,
      componentStats: Array.from(componentStats.entries()).map(([typeName, stats]) => {
        const poolSize = poolSizes.get(typeName) || 0;
        const poolUtilization = poolUtilizations.get(typeName) || 0;
        const memoryPerInstance = this.getEstimatedComponentSize(typeName, scene);
        return {
          typeName,
          instanceCount: stats.count,
          memoryPerInstance,
          totalMemory: stats.count * memoryPerInstance,
          poolSize,
          poolUtilization,
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
    } catch (error) {
      calculatedSize = 64;
    }
    ComponentDataCollector.componentSizeCache.set(typeName, calculatedSize);
    return calculatedSize;
  }
  calculateQuickObjectSize(obj) {
    if (!obj || typeof obj !== "object")
      return 8;
    let size = 32;
    const visited = /* @__PURE__ */ new WeakSet();
    const calculate = (item, depth = 0) => {
      if (!item || typeof item !== "object" || visited.has(item) || depth > 3) {
        return 0;
      }
      visited.add(item);
      let itemSize = 0;
      try {
        const keys = Object.keys(item);
        for (let i = 0; i < Math.min(keys.length, 20); i++) {
          const key = keys[i];
          if (key === "entity" || key === "_entity" || key === "constructor")
            continue;
          const value = item[key];
          itemSize += key.length * 2;
          if (typeof value === "string") {
            itemSize += Math.min(value.length * 2, 200);
          } else if (typeof value === "number") {
            itemSize += 8;
          } else if (typeof value === "boolean") {
            itemSize += 4;
          } else if (typeof value === "object" && value !== null) {
            itemSize += calculate(value, depth + 1);
          }
        }
      } catch (error) {
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
      for (const entity of entityList.buffer) {
        if (entity.components) {
          const component = entity.components.find((c) => getComponentInstanceTypeName(c) === typeName);
          if (component) {
            return this.estimateObjectSize(component);
          }
        }
      }
    } catch (error) {
    }
    return this.getEstimatedComponentSize(typeName, scene);
  }
  /**
   * 估算对象内存大小（仅用于内存快照）
   * 优化版本：减少递归深度，提高性能
   */
  estimateObjectSize(obj, visited = /* @__PURE__ */ new WeakSet(), depth = 0) {
    if (obj === null || obj === void 0 || depth > 10)
      return 0;
    if (visited.has(obj))
      return 0;
    let size = 0;
    const type = typeof obj;
    switch (type) {
      case "boolean":
        size = 4;
        break;
      case "number":
        size = 8;
        break;
      case "string":
        size = 24 + Math.min(obj.length * 2, 1e3);
        break;
      case "object":
        visited.add(obj);
        if (Array.isArray(obj)) {
          size = 40 + obj.length * 8;
          const maxElements = Math.min(obj.length, 50);
          for (let i = 0; i < maxElements; i++) {
            size += this.estimateObjectSize(obj[i], visited, depth + 1);
          }
        } else {
          size = 32;
          try {
            const ownKeys = Object.getOwnPropertyNames(obj);
            const maxProps = Math.min(ownKeys.length, 30);
            for (let i = 0; i < maxProps; i++) {
              const key = ownKeys[i];
              if (key === "constructor" || key === "__proto__" || key === "entity" || key === "_entity" || key.startsWith("_cc_") || key.startsWith("__")) {
                continue;
              }
              try {
                size += 16 + key.length * 2;
                const value = obj[key];
                if (value !== void 0 && value !== null) {
                  size += this.estimateObjectSize(value, visited, depth + 1);
                }
              } catch (error) {
                continue;
              }
            }
          } catch (error) {
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
ComponentDataCollector.componentSizeCache = /* @__PURE__ */ new Map();
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
        currentSceneName: "No Scene",
        isInitialized: false,
        sceneRunTime: 0,
        sceneEntityCount: 0,
        sceneSystemCount: 0,
        sceneMemory: 0,
        sceneUptime: 0
      };
    }
    const currentTime = Date.now();
    const runTime = (currentTime - this.sceneStartTime) / 1e3;
    const entityList = scene.entities;
    const entityProcessors = scene.entityProcessors;
    return {
      currentSceneName: scene.name || "Unnamed Scene",
      isInitialized: scene._didSceneBegin || false,
      sceneRunTime: runTime,
      sceneEntityCount: entityList?.buffer?.length || 0,
      sceneSystemCount: entityProcessors?.processors?.length || 0,
      sceneMemory: 0,
      // TODO: 计算实际场景内存
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
class WebSocketManager {
  constructor(url, autoReconnect = true) {
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 2e3;
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
      } catch (error) {
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
      this.autoReconnect = false;
      this.ws.close();
      this.ws = void 0;
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
      const message = typeof data === "string" ? data : JSON.stringify(data);
      this.ws.send(message);
    } catch (error) {
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
   * 设置重连间隔
   */
  setReconnectInterval(interval) {
    this.reconnectInterval = interval;
  }
  /**
   * 计划重连
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    const delay = Math.min(1e3 * Math.pow(2, this.reconnectAttempts), 3e4);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
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
      if (this.messageHandler) {
        this.messageHandler(message);
      }
    } catch (error) {
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
class DebugManager {
  /**
   * 构造调试管理器
   * @param core Core实例
   * @param config 调试配置
   */
  constructor(core, config) {
    this.frameCounter = 0;
    this.lastSendTime = 0;
    this.isRunning = false;
    this.config = config;
    this.sceneProvider = () => core.scene || core.constructor.scene;
    this.performanceMonitorProvider = () => core._performanceMonitor;
    this.entityCollector = new EntityDataCollector();
    this.systemCollector = new SystemDataCollector();
    this.performanceCollector = new PerformanceDataCollector();
    this.componentCollector = new ComponentDataCollector();
    this.sceneCollector = new SceneDataCollector();
    this.webSocketManager = new WebSocketManager(config.websocketUrl, config.autoReconnect !== false);
    this.webSocketManager.setMessageHandler(this.handleMessage.bind(this));
    const debugFrameRate = config.debugFrameRate || 30;
    this.sendInterval = 1e3 / debugFrameRate;
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
   * 更新配置
   */
  updateConfig(config) {
    this.config = config;
    const debugFrameRate = config.debugFrameRate || 30;
    this.sendInterval = 1e3 / debugFrameRate;
    if (this.webSocketManager && config.websocketUrl) {
      this.webSocketManager.disconnect();
      this.webSocketManager = new WebSocketManager(config.websocketUrl, config.autoReconnect !== false);
      this.webSocketManager.setMessageHandler(this.handleMessage.bind(this));
      this.connectWebSocket();
    }
  }
  /**
   * 帧更新回调
   */
  onFrameUpdate(deltaTime) {
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
        case "capture_memory_snapshot":
          this.handleMemorySnapshotRequest();
          break;
        case "config_update":
          if (message.config) {
            this.updateConfig({ ...this.config, ...message.config });
          }
          break;
        case "expand_lazy_object":
          this.handleExpandLazyObjectRequest(message);
          break;
        case "get_component_properties":
          this.handleGetComponentPropertiesRequest(message);
          break;
        case "get_raw_entity_list":
          this.handleGetRawEntityListRequest(message);
          break;
        case "get_entity_details":
          this.handleGetEntityDetailsRequest(message);
          break;
        case "ping":
          this.webSocketManager.send({
            type: "pong",
            timestamp: Date.now()
          });
          break;
        default:
          break;
      }
    } catch (error) {
      if (message.requestId) {
        this.webSocketManager.send({
          type: "error_response",
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
      if (entityId === void 0 || componentIndex === void 0 || !propertyPath) {
        this.webSocketManager.send({
          type: "expand_lazy_object_response",
          requestId,
          error: "缺少必要参数"
        });
        return;
      }
      const expandedData = this.entityCollector.expandLazyObject(entityId, componentIndex, propertyPath);
      this.webSocketManager.send({
        type: "expand_lazy_object_response",
        requestId,
        data: expandedData
      });
    } catch (error) {
      this.webSocketManager.send({
        type: "expand_lazy_object_response",
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
      if (entityId === void 0 || componentIndex === void 0) {
        this.webSocketManager.send({
          type: "get_component_properties_response",
          requestId,
          error: "缺少必要参数"
        });
        return;
      }
      const properties = this.entityCollector.getComponentProperties(entityId, componentIndex);
      this.webSocketManager.send({
        type: "get_component_properties_response",
        requestId,
        data: properties
      });
    } catch (error) {
      this.webSocketManager.send({
        type: "get_component_properties_response",
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
      const rawEntityList = this.entityCollector.getRawEntityList();
      this.webSocketManager.send({
        type: "get_raw_entity_list_response",
        requestId,
        data: rawEntityList
      });
    } catch (error) {
      this.webSocketManager.send({
        type: "get_raw_entity_list_response",
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
      if (entityId === void 0) {
        this.webSocketManager.send({
          type: "get_entity_details_response",
          requestId,
          error: "缺少实体ID参数"
        });
        return;
      }
      const entityDetails = this.entityCollector.getEntityDetails(entityId);
      this.webSocketManager.send({
        type: "get_entity_details_response",
        requestId,
        data: entityDetails
      });
    } catch (error) {
      this.webSocketManager.send({
        type: "get_entity_details_response",
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
        type: "memory_snapshot_response",
        data: memorySnapshot
      });
    } catch (error) {
      this.webSocketManager.send({
        type: "memory_snapshot_error",
        error: error instanceof Error ? error.message : "内存快照捕获失败"
      });
    }
  }
  /**
   * 捕获内存快照
   */
  captureMemorySnapshot() {
    const timestamp = Date.now();
    const baseMemoryInfo = this.collectBaseMemoryInfo();
    const scene = this.sceneProvider();
    const entityData = this.entityCollector.collectEntityDataWithMemory(scene);
    const componentMemoryStats = scene?.entities ? this.collectComponentMemoryStats(scene.entities) : { totalMemory: 0, componentTypes: 0, totalInstances: 0, breakdown: [] };
    const systemMemoryStats = this.collectSystemMemoryStats();
    const poolMemoryStats = this.collectPoolMemoryStats();
    const performanceStats = this.collectPerformanceStats();
    const totalEntityMemory = entityData.entitiesPerArchetype.reduce((sum, arch) => sum + arch.memory, 0);
    return {
      timestamp,
      version: "2.0",
      summary: {
        totalEntities: entityData.totalEntities,
        totalMemoryUsage: baseMemoryInfo.usedMemory,
        totalMemoryLimit: baseMemoryInfo.totalMemory,
        memoryUtilization: baseMemoryInfo.usedMemory / baseMemoryInfo.totalMemory * 100,
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
      detailedMemory: void 0
    };
    try {
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
      } else {
        memoryInfo.totalMemory = 512 * 1024 * 1024;
        memoryInfo.freeMemory = 512 * 1024 * 1024;
      }
      if (performanceWithMemory.measureUserAgentSpecificMemory) {
        performanceWithMemory.measureUserAgentSpecificMemory().then((result) => {
          memoryInfo.detailedMemory = result;
        }).catch(() => {
        });
      }
    } catch (error) {
    }
    return memoryInfo;
  }
  /**
   * 收集组件内存统计（仅用于内存快照）
   */
  collectComponentMemoryStats(entityList) {
    const componentStats = /* @__PURE__ */ new Map();
    let totalComponentMemory = 0;
    const componentTypeCounts = /* @__PURE__ */ new Map();
    for (const entity of entityList.buffer) {
      if (!entity || entity.destroyed || !entity.components)
        continue;
      for (const component of entity.components) {
        const typeName = getComponentInstanceTypeName(component);
        componentTypeCounts.set(typeName, (componentTypeCounts.get(typeName) || 0) + 1);
      }
    }
    for (const [typeName, count] of componentTypeCounts.entries()) {
      const detailedMemoryPerInstance = this.componentCollector.calculateDetailedComponentMemory(typeName);
      const totalMemoryForType = detailedMemoryPerInstance * count;
      totalComponentMemory += totalMemoryForType;
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
              memory: detailedMemoryPerInstance
              // 使用统一的详细计算结果
            });
            instanceCount++;
            if (instanceCount >= 100)
              break;
          }
        }
        if (instanceCount >= 100)
          break;
      }
      componentStats.set(typeName, {
        count,
        totalMemory: totalMemoryForType,
        instances: instances.slice(0, 10)
        // 只保留前10个实例用于显示
      });
    }
    const componentBreakdown = Array.from(componentStats.entries()).map(([typeName, stats]) => ({
      typeName,
      instanceCount: stats.count,
      totalMemory: stats.totalMemory,
      averageMemory: stats.totalMemory / stats.count,
      percentage: totalComponentMemory > 0 ? stats.totalMemory / totalComponentMemory * 100 : 0,
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
    const scene = this.sceneProvider();
    let totalSystemMemory = 0;
    const systemBreakdown = [];
    try {
      const entityProcessors = scene?.entityProcessors;
      if (entityProcessors && entityProcessors.processors) {
        const systemTypeMemoryCache = /* @__PURE__ */ new Map();
        for (const system of entityProcessors.processors) {
          const systemTypeName = getSystemInstanceTypeName(system);
          let systemMemory;
          if (systemTypeMemoryCache.has(systemTypeName)) {
            systemMemory = systemTypeMemoryCache.get(systemTypeName);
          } else {
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
    } catch (error) {
    }
    return {
      totalMemory: totalSystemMemory,
      systemCount: systemBreakdown.length,
      breakdown: systemBreakdown.sort((a, b) => b.memory - a.memory)
    };
  }
  calculateQuickSystemSize(system) {
    if (!system || typeof system !== "object")
      return 64;
    let size = 128;
    try {
      const keys = Object.keys(system);
      for (let i = 0; i < Math.min(keys.length, 15); i++) {
        const key = keys[i];
        if (key === "entities" || key === "scene" || key === "constructor")
          continue;
        const value = system[key];
        size += key.length * 2;
        if (typeof value === "string") {
          size += Math.min(value.length * 2, 100);
        } else if (typeof value === "number") {
          size += 8;
        } else if (typeof value === "boolean") {
          size += 4;
        } else if (Array.isArray(value)) {
          size += 40 + Math.min(value.length * 8, 200);
        } else if (typeof value === "object" && value !== null) {
          size += 64;
        }
      }
    } catch (error) {
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
      const poolManager = ComponentPoolManager.getInstance();
      const poolStats = poolManager.getPoolStats();
      for (const [typeName, stats] of poolStats.entries()) {
        const poolData = stats;
        const poolMemory = poolData.maxSize * 32;
        totalPoolMemory += poolMemory;
        poolBreakdown.push({
          typeName,
          maxSize: poolData.maxSize,
          currentSize: poolData.currentSize || 0,
          estimatedMemory: poolMemory,
          utilization: poolData.currentSize ? poolData.currentSize / poolData.maxSize * 100 : 0
        });
      }
    } catch (error) {
    }
    try {
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
    } catch (error) {
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
      const performanceMonitor = this.performanceMonitorProvider();
      if (!performanceMonitor) {
        return { enabled: false };
      }
      const stats = performanceMonitor.getAllSystemStats();
      const warnings = performanceMonitor.getPerformanceWarnings();
      return {
        enabled: performanceMonitor.enabled ?? false,
        systemCount: stats.size,
        warnings: warnings.slice(0, 10),
        // 最多10个警告
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
    } catch (error) {
      return { enabled: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  /**
   * 获取调试数据
   */
  getDebugData() {
    const currentTime = Date.now();
    const scene = this.sceneProvider();
    const debugData = {
      timestamp: currentTime,
      frameworkVersion: "1.0.0",
      // 可以从package.json读取
      isRunning: this.isRunning,
      frameworkLoaded: true,
      currentScene: scene?.name || "Unknown"
    };
    if (this.config.channels.entities) {
      debugData.entities = this.entityCollector.collectEntityData(scene);
    }
    if (this.config.channels.systems) {
      const performanceMonitor = this.performanceMonitorProvider();
      debugData.systems = this.systemCollector.collectSystemData(performanceMonitor, scene);
    }
    if (this.config.channels.performance) {
      const performanceMonitor = this.performanceMonitorProvider();
      debugData.performance = this.performanceCollector.collectPerformanceData(performanceMonitor);
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
    } catch (error) {
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
      const message = {
        type: "debug_data",
        data: debugData
      };
      this.webSocketManager.send(message);
    } catch (error) {
    }
  }
}
class Core {
  /**
   * 创建核心实例
   *
   * @param config - Core配置对象
   */
  constructor(config = {}) {
    this._globalManagers = [];
    Core._instance = this;
    this._config = {
      debug: true,
      enableEntitySystems: true,
      ...config
    };
    this._timerManager = new TimerManager();
    Core.registerGlobalManager(this._timerManager);
    this._performanceMonitor = PerformanceMonitor.instance;
    if (this._config.debug) {
      this._performanceMonitor.enable();
    }
    this._poolManager = PoolManager.getInstance();
    Core.entitySystemsEnabled = this._config.enableEntitySystems ?? true;
    this.debug = this._config.debug ?? true;
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
  static get Instance() {
    return this._instance;
  }
  /**
   * 获取当前活动的场景（属性访问器）
   *
   * @returns 当前场景实例，如果没有则返回null
   */
  static get scene() {
    return this.getScene();
  }
  /**
   * 获取当前活动的场景（方法调用）
   *
   * @returns 当前场景实例，如果没有则返回null
   */
  static getScene() {
    if (!this._instance) {
      return null;
    }
    this._instance.ensureDefaultWorld();
    const defaultWorld = this._instance._worldManager.getWorld(this.DEFAULT_WORLD_ID);
    return defaultWorld?.getScene(this.DEFAULT_SCENE_ID) || null;
  }
  /**
   * 设置当前场景
   *
   * @param scene - 要设置的场景实例
   * @returns 设置的场景实例，便于链式调用
   */
  static setScene(scene) {
    if (!this._instance) {
      throw new Error("Core实例未创建，请先调用Core.create()");
    }
    this._instance.ensureDefaultWorld();
    const defaultWorld = this._instance._worldManager.getWorld(this.DEFAULT_WORLD_ID);
    if (defaultWorld.getScene(this.DEFAULT_SCENE_ID)) {
      defaultWorld.removeScene(this.DEFAULT_SCENE_ID);
    }
    defaultWorld.createScene(this.DEFAULT_SCENE_ID, scene);
    defaultWorld.setSceneActive(this.DEFAULT_SCENE_ID, true);
    this._instance.onSceneChanged();
    return scene;
  }
  /**
   * 创建Core实例
   *
   * 如果实例已存在，则返回现有实例。
   *
   * @param config - Core配置，也可以直接传入boolean表示debug模式（向后兼容）
   * @returns Core实例
   */
  static create(config = true) {
    if (this._instance == null) {
      const coreConfig = typeof config === "boolean" ? { debug: config, enableEntitySystems: true } : config;
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
  static update(deltaTime) {
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
  static registerGlobalManager(manager) {
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
  static unregisterGlobalManager(manager) {
    this._instance._globalManagers.splice(this._instance._globalManagers.indexOf(manager), 1);
    manager.enabled = false;
  }
  /**
   * 获取指定类型的全局管理器
   *
   * @param type - 管理器类型构造函数
   * @returns 管理器实例，如果未找到则返回null
   */
  static getGlobalManager(type) {
    for (const manager of this._instance._globalManagers) {
      if (manager instanceof type)
        return manager;
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
  static schedule(timeInSeconds, repeats = false, context, onTime) {
    if (!onTime) {
      throw new Error("onTime callback is required");
    }
    return this._instance._timerManager.schedule(timeInSeconds, repeats, context, onTime);
  }
  /**
   * 获取ECS流式API
   *
   * @returns ECS API实例，如果未初始化则返回null
   */
  static get ecsAPI() {
    return this._instance?._ecsAPI || null;
  }
  /**
   * 启用调试功能
   *
   * @param config 调试配置
   */
  static enableDebug(config) {
    if (!this._instance) {
      Core._logger.warn("Core实例未创建，请先调用Core.create()");
      return;
    }
    if (this._instance._debugManager) {
      this._instance._debugManager.updateConfig(config);
    } else {
      this._instance._debugManager = new DebugManager(this._instance, config);
    }
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
      this._instance._debugManager = void 0;
    }
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
   * 获取WorldManager实例
   *
   * @param config 可选的WorldManager配置，用于覆盖默认配置
   * @returns WorldManager实例，如果未初始化则自动创建
   */
  static getWorldManager(config) {
    if (!this._instance) {
      throw new Error("Core实例未创建，请先调用Core.create()");
    }
    if (!this._instance._worldManager) {
      const defaultConfig = {
        maxWorlds: 50,
        autoCleanup: true,
        cleanupInterval: 6e4,
        debug: this._instance._config.debug
      };
      this._instance._worldManager = WorldManager.getInstance({
        ...defaultConfig,
        ...config
        // 用户传入的配置会覆盖默认配置
      });
    }
    return this._instance._worldManager;
  }
  /**
   * 启用World管理
   *
   * 显式启用World功能，用于多房间/多世界架构
   *
   * @param config 可选的WorldManager配置，用于覆盖默认配置
   */
  static enableWorldManager(config) {
    return this.getWorldManager(config);
  }
  /**
   * 确保默认World存在
   *
   * 内部方法，用于懒初始化默认World
   */
  ensureDefaultWorld() {
    if (!this._worldManager) {
      this._worldManager = WorldManager.getInstance({
        maxWorlds: 1,
        // 单场景用户只需要1个World
        autoCleanup: false,
        // 单场景不需要自动清理
        cleanupInterval: 0,
        // 禁用清理定时器
        debug: this._config.debug
      });
    }
    if (!this._worldManager.getWorld(Core.DEFAULT_WORLD_ID)) {
      this._worldManager.createWorld(Core.DEFAULT_WORLD_ID, {
        name: "DefaultWorld",
        maxScenes: 1,
        autoCleanup: false
      });
      this._worldManager.setWorldActive(Core.DEFAULT_WORLD_ID, true);
    }
  }
  /**
   * 场景切换回调
   *
   * 在场景切换时调用，用于重置时间系统等。
   */
  onSceneChanged() {
    Time.sceneChanged();
    const currentScene = Core.getScene();
    if (currentScene && currentScene.querySystem && currentScene.eventSystem) {
      this._ecsAPI = createECSAPI(currentScene, currentScene.querySystem, currentScene.eventSystem);
    }
    if (this._debugManager) {
      queueMicrotask(() => {
        this._debugManager?.onSceneChanged();
      });
    }
  }
  /**
   * 初始化核心系统
   *
   * 执行核心系统的初始化逻辑。
   */
  initialize() {
  }
  /**
   * 内部更新方法
   *
   * @param deltaTime - 帧时间间隔（秒）
   */
  updateInternal(deltaTime) {
    if (Core.paused)
      return;
    const frameStartTime = this._performanceMonitor.startMonitoring("Core.update");
    Time.update(deltaTime);
    if ("updateFPS" in this._performanceMonitor && typeof this._performanceMonitor.updateFPS === "function") {
      this._performanceMonitor.updateFPS(Time.deltaTime);
    }
    const managersStartTime = this._performanceMonitor.startMonitoring("GlobalManagers.update");
    for (const globalManager of this._globalManagers) {
      if (globalManager.enabled)
        globalManager.update();
    }
    this._performanceMonitor.endMonitoring("GlobalManagers.update", managersStartTime, this._globalManagers.length);
    this._poolManager.update();
    if (this._worldManager) {
      const worldsStartTime = this._performanceMonitor.startMonitoring("Worlds.update");
      const activeWorlds = this._worldManager.getActiveWorlds();
      let totalWorldEntities = 0;
      for (const world of activeWorlds) {
        world.updateGlobalSystems();
        world.updateScenes();
        const worldStats = world.getStats();
        totalWorldEntities += worldStats.totalEntities;
      }
      this._performanceMonitor.endMonitoring("Worlds.update", worldsStartTime, totalWorldEntities);
    }
    if (this._debugManager) {
      this._debugManager.onFrameUpdate(deltaTime);
    }
    this._performanceMonitor.endMonitoring("Core.update", frameStartTime);
  }
}
Core.paused = false;
Core.DEFAULT_WORLD_ID = "__default__";
Core.DEFAULT_SCENE_ID = "__main__";
Core._logger = createLogger("Core");
class Component {
  /**
   * 创建组件实例
   *
   * 自动分配唯一ID给组件。
   */
  constructor() {
    this._enabled = true;
    this._updateOrder = 0;
    this.id = Component._idGenerator++;
  }
  /**
   * 获取组件启用状态
   *
   * 组件的实际启用状态取决于自身状态和所属实体的状态。
   *
   * @deprecated 不符合ECS架构规范，建议自己实现DisabledComponent标记组件替代
   * @returns 如果组件和所属实体都启用则返回true
   */
  get enabled() {
    return this.entity ? this.entity.enabled && this._enabled : this._enabled;
  }
  /**
   * 设置组件启用状态
   *
   * 当状态改变时会触发相应的生命周期回调。
   *
   * @deprecated 不符合ECS架构规范，建议自己实现DisabledComponent标记组件替代
   * @param value - 新的启用状态
   */
  set enabled(value) {
    if (this._enabled !== value) {
      this._enabled = value;
      if (this._enabled) {
        this.onEnabled();
      } else {
        this.onDisabled();
      }
    }
  }
  /**
   * 获取更新顺序
   *
   * @deprecated 不符合ECS架构规范，更新顺序应该由EntitySystem管理
   * @see EntitySystem
   * @returns 组件的更新顺序值
   */
  get updateOrder() {
    return this._updateOrder;
  }
  /**
   * 设置更新顺序
   *
   * @deprecated 不符合ECS架构规范，更新顺序应该由EntitySystem管理
   * @see EntitySystem
   * @param value - 新的更新顺序值
   */
  set updateOrder(value) {
    this._updateOrder = value;
  }
  /**
   * 组件添加到实体时的回调
   *
   * 当组件被添加到实体时调用，可以在此方法中进行初始化操作。
   */
  onAddedToEntity() {
  }
  /**
   * 组件从实体移除时的回调
   *
   * 当组件从实体中移除时调用，可以在此方法中进行清理操作。
   */
  onRemovedFromEntity() {
  }
  /**
   * 组件启用时的回调
   *
   * 当组件被启用时调用。
   */
  onEnabled() {
  }
  /**
   * 组件禁用时的回调
   *
   * 当组件被禁用时调用。
   */
  onDisabled() {
  }
  /**
   * 更新组件
   *
   * @deprecated 不符合ECS架构规范，建议使用EntitySystem来处理更新逻辑
   */
  update() {
  }
}
Component._idGenerator = 0;
class Matcher {
  constructor() {
    this.condition = {
      all: [],
      any: [],
      none: []
    };
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
      tag: this.condition.tag,
      name: this.condition.name,
      component: this.condition.component
    };
  }
  /**
   * 检查是否为空条件
   */
  isEmpty() {
    return this.condition.all.length === 0 && this.condition.any.length === 0 && this.condition.none.length === 0 && this.condition.tag === void 0 && this.condition.name === void 0 && this.condition.component === void 0;
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
    if (this.condition.tag !== void 0) {
      cloned.condition.tag = this.condition.tag;
    }
    if (this.condition.name !== void 0) {
      cloned.condition.name = this.condition.name;
    }
    if (this.condition.component !== void 0) {
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
      parts.push(`all(${this.condition.all.map((t) => getComponentTypeName(t)).join(", ")})`);
    }
    if (this.condition.any.length > 0) {
      parts.push(`any(${this.condition.any.map((t) => getComponentTypeName(t)).join(", ")})`);
    }
    if (this.condition.none.length > 0) {
      parts.push(`none(${this.condition.none.map((t) => getComponentTypeName(t)).join(", ")})`);
    }
    if (this.condition.tag !== void 0) {
      parts.push(`tag(${this.condition.tag})`);
    }
    if (this.condition.name !== void 0) {
      parts.push(`name(${this.condition.name})`);
    }
    if (this.condition.component !== void 0) {
      parts.push(`component(${getComponentTypeName(this.condition.component)})`);
    }
    return `Matcher[${parts.join(" & ")}]`;
  }
}
class EntitySystem {
  /**
   * 获取系统处理的实体列表
   */
  get entities() {
    if (this._entityCache.frame !== null) {
      return this._entityCache.frame;
    }
    if (this._entityCache.persistent === null) {
      this._entityCache.persistent = this.queryEntities();
    }
    return this._entityCache.persistent;
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
    this._performanceMonitor = PerformanceMonitor.instance;
    this._systemName = getSystemInstanceTypeName(this);
    this._initialized = false;
    this._matcher = matcher || Matcher.empty();
    this._eventListeners = [];
    this._scene = null;
    this._entityIdMap = null;
    this._entityIdMapVersion = -1;
    this._entityIdMapSize = 0;
    this._entityCache = {
      frame: null,
      persistent: null,
      tracked: /* @__PURE__ */ new Set(),
      invalidate() {
        this.persistent = null;
      },
      clearFrame() {
        this.frame = null;
      },
      clearAll() {
        this.frame = null;
        this.persistent = null;
        this.tracked.clear();
      }
    };
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
    this._updateOrder = order;
    if (this.scene && this.scene.entityProcessors) {
      this.scene.entityProcessors.setDirty();
    }
  }
  /**
   * 系统初始化（框架调用）
   *
   * 在系统创建时调用。框架内部使用，用户不应直接调用。
   */
  initialize() {
    if (this._initialized) {
      return;
    }
    this._initialized = true;
    if (this.scene) {
      this._entityCache.invalidate();
      this.queryEntities();
    }
    this.onInitialize();
  }
  /**
   * 系统初始化回调
   *
   * 子类可以重写此方法进行初始化操作。
   */
  onInitialize() {
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
   */
  reset() {
    this.scene = null;
    this._initialized = false;
    this._entityCache.clearAll();
    this._entityIdMap = null;
    this._entityIdMapVersion = -1;
    this._entityIdMapSize = 0;
    this.cleanupEventListeners();
    this.onDestroy();
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
    if (this._matcher.isEmpty()) {
      currentEntities = querySystem.getAllEntities();
    } else if (this.isSingleCondition(condition)) {
      currentEntities = this.executeSingleConditionQuery(condition, querySystem);
    } else {
      currentEntities = this.executeComplexQuery(condition, querySystem);
    }
    this.updateEntityTracking(currentEntities);
    return currentEntities;
  }
  /**
   * 检查是否为单一条件查询
   */
  isSingleCondition(condition) {
    const flags = (condition.all.length > 0 ? 1 : 0) | (condition.any.length > 0 ? 2 : 0) | (condition.none.length > 0 ? 4 : 0) | (condition.tag !== void 0 ? 8 : 0) | (condition.name !== void 0 ? 16 : 0) | (condition.component !== void 0 ? 32 : 0);
    return flags !== 0 && (flags & flags - 1) === 0;
  }
  /**
   * 执行单一条件查询
   */
  executeSingleConditionQuery(condition, querySystem) {
    if (condition.tag !== void 0) {
      return querySystem.queryByTag(condition.tag).entities;
    }
    if (condition.name !== void 0) {
      return querySystem.queryByName(condition.name).entities;
    }
    if (condition.component !== void 0) {
      return querySystem.queryByComponent(condition.component).entities;
    }
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
    if (condition.tag !== void 0) {
      const tagResult = querySystem.queryByTag(condition.tag);
      resultIds = this.extractEntityIds(tagResult.entities);
    }
    if (condition.name !== void 0) {
      const nameIds = this.extractEntityIds(querySystem.queryByName(condition.name).entities);
      resultIds = resultIds ? this.intersectIdSets(resultIds, nameIds) : nameIds;
    }
    if (condition.component !== void 0) {
      const componentIds = this.extractEntityIds(querySystem.queryByComponent(condition.component).entities);
      resultIds = resultIds ? this.intersectIdSets(resultIds, componentIds) : componentIds;
    }
    if (condition.all.length > 0) {
      const allIds = this.extractEntityIds(querySystem.queryAll(...condition.all).entities);
      resultIds = resultIds ? this.intersectIdSets(resultIds, allIds) : allIds;
    }
    if (condition.any.length > 0) {
      const anyIds = this.extractEntityIds(querySystem.queryAny(...condition.any).entities);
      resultIds = resultIds ? this.intersectIdSets(resultIds, anyIds) : anyIds;
    }
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
    const idSet = /* @__PURE__ */ new Set();
    for (let i = 0; i < len; i = i + 1 | 0) {
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
    } else {
      smaller = setB;
      larger = setA;
    }
    const result = /* @__PURE__ */ new Set();
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
    const result = /* @__PURE__ */ new Set();
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
      entityMap = /* @__PURE__ */ new Map();
    } else {
      entityMap.clear();
    }
    const len = allEntities.length;
    for (let i = 0; i < len; i = i + 1 | 0) {
      const entity = allEntities[i];
      entityMap.set(entity.id | 0, entity);
    }
    this._entityIdMap = entityMap;
    this._entityIdMapVersion = version;
    this._entityIdMapSize = len;
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
      if (entity !== void 0) {
        result[index] = entity;
        index = index + 1 | 0;
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
    const startTime = this._performanceMonitor.startMonitoring(this._systemName);
    let entityCount = 0;
    try {
      this.onBegin();
      this._entityCache.frame = this.queryEntities();
      entityCount = this._entityCache.frame.length;
      this.process(this._entityCache.frame);
    } finally {
      this._performanceMonitor.endMonitoring(this._systemName, startTime, entityCount);
    }
  }
  /**
   * 后期更新系统
   */
  lateUpdate() {
    if (!this._enabled || !this.onCheckProcessing()) {
      return;
    }
    const startTime = this._performanceMonitor.startMonitoring(`${this._systemName}_Late`);
    let entityCount = 0;
    try {
      const entities = this._entityCache.frame || [];
      entityCount = entities.length;
      this.lateProcess(entities);
      this.onEnd();
    } finally {
      this._performanceMonitor.endMonitoring(`${this._systemName}_Late`, startTime, entityCount);
      this._entityCache.clearFrame();
    }
  }
  /**
   * 在系统处理开始前调用
   *
   * 子类可以重写此方法进行预处理操作。
   */
  onBegin() {
  }
  /**
   * 处理实体列表
   *
   * 系统的核心逻辑，子类必须实现此方法来定义具体的处理逻辑。
   *
   * @param entities 要处理的实体列表
   */
  process(entities) {
  }
  /**
   * 后期处理实体列表
   *
   * 在主要处理逻辑之后执行，子类可以重写此方法。
   *
   * @param entities 要处理的实体列表
   */
  lateProcess(_entities) {
  }
  /**
   * 系统处理完毕后调用
   *
   * 子类可以重写此方法进行后处理操作。
   */
  onEnd() {
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
    return this._performanceMonitor.getSystemData(this._systemName);
  }
  /**
   * 获取系统的性能统计
   *
   * @returns 性能统计或undefined
   */
  getPerformanceStats() {
    return this._performanceMonitor.getSystemStats(this._systemName);
  }
  /**
   * 重置系统的性能数据
   */
  resetPerformanceData() {
    this._performanceMonitor.resetSystem(this._systemName);
  }
  /**
   * 获取系统信息的字符串表示
   *
   * @returns 系统信息字符串
   */
  toString() {
    const entityCount = this.entities.length;
    const perfData = this.getPerformanceData();
    const perfInfo = perfData ? ` (${perfData.executionTime.toFixed(2)}ms)` : "";
    return `${this._systemName}[${entityCount} entities]${perfInfo}`;
  }
  /**
   * 更新实体跟踪，检查新增和移除的实体
   */
  updateEntityTracking(currentEntities) {
    const currentSet = new Set(currentEntities);
    let hasChanged = false;
    for (const entity of currentEntities) {
      if (!this._entityCache.tracked.has(entity)) {
        this._entityCache.tracked.add(entity);
        this.onAdded(entity);
        hasChanged = true;
      }
    }
    for (const entity of this._entityCache.tracked) {
      if (!currentSet.has(entity)) {
        this._entityCache.tracked.delete(entity);
        this.onRemoved(entity);
        hasChanged = true;
      }
    }
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
  onAdded(entity) {
  }
  /**
   * 当实体从系统中移除时调用
   *
   * 子类可以重写此方法来处理实体移除事件。
   *
   * @param entity 被移除的实体
   */
  onRemoved(entity) {
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
   */
  addEventListener(eventType, handler, config) {
    if (!this.scene?.eventSystem) {
      console.warn(`[${this.systemName}] Cannot add event listener: scene.eventSystem not available`);
      return;
    }
    const listenerRef = this.scene.eventSystem.on(eventType, handler, config);
    if (listenerRef) {
      this._eventListeners.push({
        eventSystem: this.scene.eventSystem,
        eventType,
        handler,
        listenerRef
      });
    }
  }
  /**
   * 移除特定的事件监听器
   *
   * @param eventType 事件类型
   * @param handler 事件处理函数
   */
  removeEventListener(eventType, handler) {
    const listenerIndex = this._eventListeners.findIndex((listener) => listener.eventType === eventType && listener.handler === handler);
    if (listenerIndex >= 0) {
      const listener = this._eventListeners[listenerIndex];
      listener.eventSystem.off(eventType, listener.listenerRef);
      this._eventListeners.splice(listenerIndex, 1);
    }
  }
  /**
   * 清理所有事件监听器
   *
   * 系统移除时自动调用，清理所有通过addEventListener添加的监听器。
   */
  cleanupEventListeners() {
    for (const listener of this._eventListeners) {
      try {
        listener.eventSystem.off(listener.eventType, listener.listenerRef);
      } catch (error) {
        console.warn(`[${this.systemName}] Failed to remove event listener for "${listener.eventType}":`, error);
      }
    }
    this._eventListeners.length = 0;
  }
  /**
   * 系统销毁时的回调
   *
   * 当系统从场景中移除时调用，子类可以重写此方法进行清理操作。
   * 注意：事件监听器会被框架自动清理，无需手动处理。
   */
  onDestroy() {
  }
}
class WorkerEntitySystem extends EntitySystem {
  constructor(matcher, config = {}) {
    super(matcher);
    this.workerPool = null;
    this.isProcessing = false;
    this.sharedBuffer = null;
    this.sharedFloatArray = null;
    this.config = {
      enableWorker: config.enableWorker ?? true,
      workerCount: config.workerCount ?? this.getOptimalWorkerCount(),
      systemConfig: config.systemConfig,
      useSharedArrayBuffer: config.useSharedArrayBuffer ?? this.isSharedArrayBufferSupported(),
      entityDataSize: config.entityDataSize ?? this.getDefaultEntityDataSize(),
      maxEntities: config.maxEntities ?? 1e4
    };
    if (this.config.enableWorker && this.isWorkerSupported()) {
      if (this.config.useSharedArrayBuffer) {
        this.initializeSharedArrayBuffer();
      }
      this.initializeWorkerPool();
    }
  }
  /**
   * 检查是否支持Worker
   */
  isWorkerSupported() {
    return typeof Worker !== "undefined" && typeof Blob !== "undefined";
  }
  /**
   * 检查是否支持SharedArrayBuffer
   */
  isSharedArrayBufferSupported() {
    return typeof SharedArrayBuffer !== "undefined" && self.crossOriginIsolated;
  }
  /**
   * 获取最优Worker数量
   */
  getOptimalWorkerCount() {
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
      return Math.min(navigator.hardwareConcurrency, 4);
    }
    return 2;
  }
  /**
   * 初始化SharedArrayBuffer
   */
  initializeSharedArrayBuffer() {
    try {
      const bufferSize = this.config.maxEntities * this.config.entityDataSize * 4;
      this.sharedBuffer = new SharedArrayBuffer(bufferSize);
      this.sharedFloatArray = new Float32Array(this.sharedBuffer);
    } catch (error) {
      console.warn(`[${this.systemName}] SharedArrayBuffer init failed:`, error);
      this.config.useSharedArrayBuffer = false;
    }
  }
  /**
   * 初始化Worker池
   */
  initializeWorkerPool() {
    try {
      const script = this.createWorkerScript();
      this.workerPool = new WebWorkerPool(
        this.config.workerCount,
        script,
        this.sharedBuffer
        // 传递SharedArrayBuffer给Worker池
      );
    } catch (error) {
      console.error(`[${this.systemName}] Failed to initialize worker pool:`, error);
      this.config.enableWorker = false;
    }
  }
  /**
   * 创建Worker脚本
   */
  createWorkerScript() {
    const methodStr = this.workerProcess.toString();
    const functionBodyMatch = methodStr.match(/\{([\s\S]*)\}/);
    if (!functionBodyMatch) {
      throw new Error("无法解析workerProcess方法");
    }
    const functionBody = functionBodyMatch[1];
    const entityDataSize = this.config.entityDataSize;
    const sharedProcessMethod = this.getSharedArrayBufferProcessFunction?.() || null;
    let sharedProcessFunctionBody = "";
    if (sharedProcessMethod) {
      const sharedMethodStr = sharedProcessMethod.toString();
      const sharedFunctionBodyMatch = sharedMethodStr.match(/\{([\s\S]*)\}/);
      if (sharedFunctionBodyMatch) {
        sharedProcessFunctionBody = sharedFunctionBodyMatch[1];
      }
    }
    return `
            // Worker脚本 - 支持SharedArrayBuffer
            let sharedFloatArray = null;
            const ENTITY_DATA_SIZE = ${entityDataSize};

            self.onmessage = function(e) {
                const { type, id, entities, deltaTime, systemConfig, startIndex, endIndex, sharedBuffer } = e.data;


                try {
                    // 处理SharedArrayBuffer初始化
                    if (type === 'init' && sharedBuffer) {
                        sharedFloatArray = new Float32Array(sharedBuffer);
                        self.postMessage({ type: 'init', success: true });
                        return;
                    }

                    // 处理SharedArrayBuffer数据
                    if (type === 'shared' && sharedFloatArray) {
                        processSharedArrayBuffer(startIndex, endIndex, deltaTime, systemConfig);
                        self.postMessage({ id, result: null }); // SharedArrayBuffer不需要返回数据
                        return;
                    }

                    // 传统处理方式
                    if (entities) {
                        // 定义处理函数
                        function workerProcess(entities, deltaTime, systemConfig) {
                            ${functionBody}
                        }

                        // 执行处理
                        const result = workerProcess(entities, deltaTime, systemConfig);

                        // 处理Promise返回值
                        if (result && typeof result.then === 'function') {
                            result.then(finalResult => {
                                self.postMessage({ id, result: finalResult });
                            }).catch(error => {
                                self.postMessage({ id, error: error.message });
                            });
                        } else {
                            self.postMessage({ id, result });
                        }
                    }
                } catch (error) {
                    self.postMessage({ id, error: error.message });
                }
            };

            // SharedArrayBuffer处理函数 - 由子类定义
            function processSharedArrayBuffer(startIndex, endIndex, deltaTime, systemConfig) {
                if (!sharedFloatArray) return;

                ${sharedProcessFunctionBody ? `
                    // 用户定义的处理函数
                    const userProcessFunction = function(sharedFloatArray, startIndex, endIndex, deltaTime, systemConfig) {
                        ${sharedProcessFunctionBody}
                    };
                    userProcessFunction(sharedFloatArray, startIndex, endIndex, deltaTime, systemConfig);
                ` : ``}
            }
        `;
  }
  /**
   * 重写process方法，支持Worker并行处理
   */
  process(entities) {
    if (this.isProcessing)
      return;
    this.isProcessing = true;
    try {
      if (this.config.enableWorker && this.workerPool) {
        if (this.config.useSharedArrayBuffer && this.sharedFloatArray) {
          this.processWithSharedArrayBuffer(entities).finally(() => {
            this.isProcessing = false;
          });
        } else {
          this.processWithWorker(entities).finally(() => {
            this.isProcessing = false;
          });
        }
      } else {
        this.processSynchronously(entities);
        this.isProcessing = false;
      }
    } catch (error) {
      this.isProcessing = false;
      throw error;
    }
  }
  /**
   * 使用SharedArrayBuffer优化的Worker处理
   */
  async processWithSharedArrayBuffer(entities) {
    if (!this.sharedFloatArray) {
      throw new Error("SharedArrayBuffer not initialized");
    }
    this.writeEntitiesToSharedBuffer(entities);
    const promises = this.createSharedArrayBufferTasks(entities.length);
    await Promise.all(promises);
    this.readResultsFromSharedBuffer(entities);
  }
  /**
   * 使用Worker并行处理
   */
  async processWithWorker(entities) {
    const entityData = [];
    for (let i = 0; i < entities.length; i++) {
      entityData[i] = this.extractEntityData(entities[i]);
    }
    const batches = this.createBatches(entityData);
    const deltaTime = Time.deltaTime;
    const promises = batches.map((batch) => this.workerPool.execute({
      entities: batch,
      deltaTime,
      systemConfig: this.config.systemConfig
    }));
    const results = await Promise.all(promises);
    let entityIndex = 0;
    for (const batchResult of results) {
      for (const result of batchResult) {
        if (entityIndex < entities.length) {
          const entity = entities[entityIndex];
          if (entity && result) {
            this.applyResult(entity, result);
          }
        }
        entityIndex++;
      }
    }
  }
  /**
   * 同步处理（fallback）
   */
  processSynchronously(entities) {
    const entityData = entities.map((entity) => this.extractEntityData(entity));
    const deltaTime = Time.deltaTime;
    const results = this.workerProcess(entityData, deltaTime, this.config.systemConfig);
    if (results && typeof results.then === "function") {
      results.then((finalResults) => {
        entities.forEach((entity, index) => {
          this.applyResult(entity, finalResults[index]);
        });
      });
    } else {
      entities.forEach((entity, index) => {
        this.applyResult(entity, results[index]);
      });
    }
  }
  /**
   * 创建数据批次 - 按Worker数量平均分配
   */
  createBatches(data) {
    const workerCount = this.config.workerCount;
    const batches = [];
    const batchSize = Math.ceil(data.length / workerCount);
    for (let i = 0; i < workerCount; i++) {
      const startIndex = i * batchSize;
      const endIndex = Math.min(startIndex + batchSize, data.length);
      if (startIndex < data.length) {
        batches.push(data.slice(startIndex, endIndex));
      }
    }
    return batches;
  }
  /**
   * 将实体数据写入SharedArrayBuffer
   */
  writeEntitiesToSharedBuffer(entities) {
    if (!this.sharedFloatArray)
      return;
    for (let i = 0; i < entities.length && i < this.config.maxEntities; i++) {
      const entity = entities[i];
      const data = this.extractEntityData(entity);
      const offset = i * this.config.entityDataSize;
      this.writeEntityToBuffer(data, offset);
    }
  }
  /**
   * 创建SharedArrayBuffer任务
   */
  createSharedArrayBufferTasks(entityCount) {
    const promises = [];
    const entitiesPerWorker = Math.ceil(entityCount / this.config.workerCount);
    for (let i = 0; i < this.config.workerCount; i++) {
      const startIndex = i * entitiesPerWorker;
      const endIndex = Math.min(startIndex + entitiesPerWorker, entityCount);
      if (startIndex < entityCount) {
        const promise = this.workerPool.executeSharedBuffer({
          startIndex,
          endIndex,
          deltaTime: Time.deltaTime,
          systemConfig: this.config.systemConfig
        });
        promises.push(promise);
      }
    }
    return promises;
  }
  /**
   * 从SharedArrayBuffer读取结果并应用
   */
  readResultsFromSharedBuffer(entities) {
    if (!this.sharedFloatArray)
      return;
    for (let i = 0; i < entities.length && i < this.config.maxEntities; i++) {
      const entity = entities[i];
      const offset = i * this.config.entityDataSize;
      const result = this.readEntityFromBuffer(offset);
      if (result) {
        this.applyResult(entity, result);
      }
    }
  }
  /**
   * 更新Worker配置
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    if (!this.config.enableWorker && this.workerPool) {
      this.workerPool.destroy();
      this.workerPool = null;
    }
    if (this.config.enableWorker && !this.workerPool && this.isWorkerSupported()) {
      this.initializeWorkerPool();
    }
  }
  /**
   * 获取系统性能信息
   */
  getWorkerInfo() {
    return {
      enabled: this.config.enableWorker,
      workerCount: this.config.workerCount,
      isProcessing: this.isProcessing
    };
  }
  /**
   * 销毁系统时清理Worker池
   */
  onDestroy() {
    super.onDestroy();
    if (this.workerPool) {
      this.workerPool.destroy();
      this.workerPool = null;
    }
  }
}
class WebWorkerPool {
  constructor(workerCount, script, sharedBuffer) {
    this.workers = [];
    this.taskQueue = [];
    this.busyWorkers = /* @__PURE__ */ new Set();
    this.taskCounter = 0;
    this.sharedBuffer = null;
    this.sharedBuffer = sharedBuffer || null;
    const blob = new Blob([script], { type: "application/javascript" });
    const scriptURL = URL.createObjectURL(blob);
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(scriptURL);
      worker.onmessage = (e) => this.handleWorkerMessage(i, e.data);
      worker.onerror = (error) => this.handleWorkerError(i, error);
      if (sharedBuffer) {
        worker.postMessage({
          type: "init",
          sharedBuffer
        });
      }
      this.workers.push(worker);
    }
    URL.revokeObjectURL(scriptURL);
  }
  /**
   * 执行SharedArrayBuffer任务
   */
  executeSharedBuffer(data) {
    return new Promise((resolve, reject) => {
      const task = {
        id: `shared-task-${++this.taskCounter}`,
        data: { ...data, type: "shared" },
        resolve: () => resolve(),
        // SharedArrayBuffer不需要返回数据
        reject
      };
      this.taskQueue.push(task);
      this.processQueue();
    });
  }
  /**
   * 执行任务
   */
  execute(data) {
    return new Promise((resolve, reject) => {
      const task = {
        id: `task-${++this.taskCounter}`,
        data,
        resolve: (result) => {
          resolve(result);
        },
        reject
      };
      this.taskQueue.push(task);
      this.processQueue();
    });
  }
  /**
   * 处理任务队列
   */
  processQueue() {
    if (this.taskQueue.length === 0)
      return;
    for (let i = 0; i < this.workers.length; i++) {
      if (!this.busyWorkers.has(i) && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        this.busyWorkers.add(i);
        this.workers[i].postMessage({
          id: task.id,
          ...task.data
        });
        this.workers[i]._currentTask = task;
      }
    }
  }
  /**
   * 处理Worker消息
   */
  handleWorkerMessage(workerIndex, data) {
    const worker = this.workers[workerIndex];
    const task = worker._currentTask;
    if (!task)
      return;
    this.busyWorkers.delete(workerIndex);
    worker._currentTask = null;
    if (data.error) {
      task.reject(new Error(data.error));
    } else {
      task.resolve(data.result);
    }
    this.processQueue();
  }
  /**
   * 处理Worker错误
   */
  handleWorkerError(workerIndex, error) {
    const worker = this.workers[workerIndex];
    const task = worker._currentTask;
    if (task) {
      this.busyWorkers.delete(workerIndex);
      worker._currentTask = null;
      task.reject(new Error(error.message));
    }
    this.processQueue();
  }
  /**
   * 销毁Worker池
   */
  destroy() {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers.length = 0;
    this.taskQueue.length = 0;
    this.busyWorkers.clear();
  }
}
var __defProp$3 = Object.defineProperty;
var __getOwnPropDesc$3 = Object.getOwnPropertyDescriptor;
var __decorateClass$3 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$3(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$3(target, key, result);
  return result;
};
let Position = class extends Component {
  constructor(x = 0, y = 0) {
    super();
    this.x = 0;
    this.y = 0;
    this.x = x;
    this.y = y;
  }
  set(x, y) {
    this.x = x;
    this.y = y;
  }
};
Position = __decorateClass$3([
  ECSComponent("Position")
], Position);
let Velocity = class extends Component {
  constructor(dx = 0, dy = 0) {
    super();
    this.dx = 0;
    this.dy = 0;
    this.dx = dx;
    this.dy = dy;
  }
  set(dx, dy) {
    this.dx = dx;
    this.dy = dy;
  }
  scale(factor) {
    this.dx *= factor;
    this.dy *= factor;
  }
};
Velocity = __decorateClass$3([
  ECSComponent("Velocity")
], Velocity);
let Physics = class extends Component {
  constructor(mass = 1, bounce = 0.8, friction = 0.95) {
    super();
    this.mass = 1;
    this.bounce = 0.8;
    this.friction = 0.95;
    this.mass = mass;
    this.bounce = bounce;
    this.friction = friction;
  }
};
Physics = __decorateClass$3([
  ECSComponent("Physics")
], Physics);
let Renderable = class extends Component {
  constructor(color = "#ffffff", size = 5, shape = "circle") {
    super();
    this.color = "#ffffff";
    this.size = 5;
    this.shape = "circle";
    this.color = color;
    this.size = size;
    this.shape = shape;
  }
};
Renderable = __decorateClass$3([
  ECSComponent("Renderable")
], Renderable);
let Lifetime = class extends Component {
  constructor(maxAge = 5) {
    super();
    this.maxAge = 5;
    this.currentAge = 0;
    this.maxAge = maxAge;
    this.currentAge = 0;
  }
  isDead() {
    return this.currentAge >= this.maxAge;
  }
};
Lifetime = __decorateClass$3([
  ECSComponent("Lifetime")
], Lifetime);
var __defProp$2 = Object.defineProperty;
var __getOwnPropDesc$2 = Object.getOwnPropertyDescriptor;
var __decorateClass$2 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$2(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$2(target, key, result);
  return result;
};
let PhysicsWorkerSystem = class extends WorkerEntitySystem {
  constructor(enableWorker = true) {
    const defaultConfig = {
      gravity: 100,
      canvasWidth: 800,
      canvasHeight: 600,
      groundFriction: 0.98
    };
    super(
      Matcher.empty().all(Position, Velocity, Physics),
      {
        enableWorker,
        workerCount: navigator.hardwareConcurrency || 2,
        systemConfig: defaultConfig,
        useSharedArrayBuffer: true
        // 启用SharedArrayBuffer优化
      }
    );
    this.physicsConfig = {
      gravity: 100,
      canvasWidth: 800,
      canvasHeight: 600,
      groundFriction: 0.98
      // 减少地面摩擦
    };
    this.startTime = 0;
  }
  extractEntityData(entity) {
    const position = entity.getComponent(Position);
    const velocity = entity.getComponent(Velocity);
    const physics = entity.getComponent(Physics);
    const renderable = entity.getComponent(Renderable);
    return {
      id: entity.id,
      x: position.x,
      y: position.y,
      dx: velocity.dx,
      dy: velocity.dy,
      mass: physics.mass,
      bounce: physics.bounce,
      friction: physics.friction,
      radius: renderable.size
    };
  }
  /**
   * Worker处理函数 - 纯函数，会被序列化到Worker中执行
   * 注意：这个函数内部不能访问外部变量，必须是纯函数
   * 添加了小球间碰撞检测，大大增加计算复杂度
   */
  workerProcess(entities, deltaTime, systemConfig) {
    const config = systemConfig || {
      gravity: 100,
      canvasWidth: 800,
      canvasHeight: 600,
      groundFriction: 0.98
    };
    const result = entities.map((e) => ({ ...e }));
    for (let i = 0; i < result.length; i++) {
      const entity = result[i];
      entity.dy += config.gravity * deltaTime;
      entity.x += entity.dx * deltaTime;
      entity.y += entity.dy * deltaTime;
      if (entity.x <= entity.radius) {
        entity.x = entity.radius;
        entity.dx = -entity.dx * entity.bounce;
      } else if (entity.x >= config.canvasWidth - entity.radius) {
        entity.x = config.canvasWidth - entity.radius;
        entity.dx = -entity.dx * entity.bounce;
      }
      if (entity.y <= entity.radius) {
        entity.y = entity.radius;
        entity.dy = -entity.dy * entity.bounce;
      } else if (entity.y >= config.canvasHeight - entity.radius) {
        entity.y = config.canvasHeight - entity.radius;
        entity.dy = -entity.dy * entity.bounce;
        entity.dx *= config.groundFriction;
      }
      entity.dx *= entity.friction;
      entity.dy *= entity.friction;
    }
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const ball1 = result[i];
        const ball2 = result[j];
        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = ball1.radius + ball2.radius;
        if (distance < minDistance && distance > 0) {
          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = minDistance - distance;
          const separationX = nx * overlap * 0.5;
          const separationY = ny * overlap * 0.5;
          ball1.x -= separationX;
          ball1.y -= separationY;
          ball2.x += separationX;
          ball2.y += separationY;
          const relativeVelocityX = ball2.dx - ball1.dx;
          const relativeVelocityY = ball2.dy - ball1.dy;
          const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;
          if (velocityAlongNormal > 0)
            continue;
          const restitution = (ball1.bounce + ball2.bounce) * 0.5;
          const impulseScalar = -(1 + restitution) * velocityAlongNormal / (1 / ball1.mass + 1 / ball2.mass);
          const impulseX = impulseScalar * nx;
          const impulseY = impulseScalar * ny;
          ball1.dx -= impulseX / ball1.mass;
          ball1.dy -= impulseY / ball1.mass;
          ball2.dx += impulseX / ball2.mass;
          ball2.dy += impulseY / ball2.mass;
          const energyLoss = 0.98;
          ball1.dx *= energyLoss;
          ball1.dy *= energyLoss;
          ball2.dx *= energyLoss;
          ball2.dy *= energyLoss;
        }
      }
    }
    return result;
  }
  /**
   * 应用处理结果 - 将Worker计算结果应用回组件
   */
  applyResult(entity, result) {
    if (!entity || !entity.enabled) {
      return;
    }
    const position = entity.getComponent(Position);
    const velocity = entity.getComponent(Velocity);
    if (!position || !velocity) {
      return;
    }
    position.set(result.x, result.y);
    velocity.set(result.dx, result.dy);
  }
  /**
   * 更新物理配置
   */
  updatePhysicsConfig(newConfig) {
    Object.assign(this.physicsConfig, newConfig);
    this.updateConfig({ systemConfig: this.physicsConfig });
  }
  /**
   * 获取物理配置
   */
  getPhysicsConfig() {
    return { ...this.physicsConfig };
  }
  /**
   * 性能监控 - 重写onEnd来计算执行时间
   */
  onEnd() {
    super.onEnd();
    const endTime = performance.now();
    const executionTime = endTime - this.startTime;
    window.physicsExecutionTime = executionTime;
  }
  /**
   * 获取实体数据大小 - 物理系统使用9个Float32值
   */
  getDefaultEntityDataSize() {
    return 9;
  }
  /**
   * 将实体数据写入SharedArrayBuffer
   */
  writeEntityToBuffer(entityData, offset) {
    const sharedArray = this.sharedFloatArray;
    if (!sharedArray)
      return;
    const currentEntityCount = Math.floor(offset / 9) + 1;
    sharedArray[0] = currentEntityCount;
    const dataOffset = offset + 9;
    sharedArray[dataOffset + 0] = entityData.id;
    sharedArray[dataOffset + 1] = entityData.x;
    sharedArray[dataOffset + 2] = entityData.y;
    sharedArray[dataOffset + 3] = entityData.dx;
    sharedArray[dataOffset + 4] = entityData.dy;
    sharedArray[dataOffset + 5] = entityData.mass;
    sharedArray[dataOffset + 6] = entityData.bounce;
    sharedArray[dataOffset + 7] = entityData.friction;
    sharedArray[dataOffset + 8] = entityData.radius;
  }
  /**
   * 性能监控 - 重写onBegin来记录开始时间
   */
  onBegin() {
    super.onBegin();
    this.startTime = performance.now();
  }
  /**
   * 从SharedArrayBuffer读取实体数据
   */
  readEntityFromBuffer(offset) {
    const sharedArray = this.sharedFloatArray;
    if (!sharedArray)
      return null;
    const dataOffset = offset + 9;
    return {
      id: sharedArray[dataOffset + 0],
      x: sharedArray[dataOffset + 1],
      y: sharedArray[dataOffset + 2],
      dx: sharedArray[dataOffset + 3],
      dy: sharedArray[dataOffset + 4],
      mass: sharedArray[dataOffset + 5],
      bounce: sharedArray[dataOffset + 6],
      friction: sharedArray[dataOffset + 7],
      radius: sharedArray[dataOffset + 8]
    };
  }
  /**
   * 提供SharedArrayBuffer处理函数 - 物理系统的具体实现
   * 包含小球间碰撞检测的复杂计算
   */
  getSharedArrayBufferProcessFunction() {
    return function(sharedFloatArray, startIndex, endIndex, deltaTime, systemConfig) {
      const config = systemConfig || {
        gravity: 100,
        canvasWidth: 800,
        canvasHeight: 600,
        groundFriction: 0.98
      };
      const actualEntityCount = sharedFloatArray[0];
      for (let i = startIndex; i < endIndex && i < actualEntityCount; i++) {
        const offset = i * 9 + 9;
        const id = sharedFloatArray[offset + 0];
        if (id === 0)
          continue;
        let x = sharedFloatArray[offset + 1];
        let y = sharedFloatArray[offset + 2];
        let dx = sharedFloatArray[offset + 3];
        let dy = sharedFloatArray[offset + 4];
        sharedFloatArray[offset + 5];
        const bounce = sharedFloatArray[offset + 6];
        const friction = sharedFloatArray[offset + 7];
        const radius = sharedFloatArray[offset + 8];
        dy += config.gravity * deltaTime;
        x += dx * deltaTime;
        y += dy * deltaTime;
        if (x <= radius) {
          x = radius;
          dx = -dx * bounce;
        } else if (x >= config.canvasWidth - radius) {
          x = config.canvasWidth - radius;
          dx = -dx * bounce;
        }
        if (y <= radius) {
          y = radius;
          dy = -dy * bounce;
        } else if (y >= config.canvasHeight - radius) {
          y = config.canvasHeight - radius;
          dy = -dy * bounce;
          dx *= config.groundFriction;
        }
        dx *= friction;
        dy *= friction;
        sharedFloatArray[offset + 1] = x;
        sharedFloatArray[offset + 2] = y;
        sharedFloatArray[offset + 3] = dx;
        sharedFloatArray[offset + 4] = dy;
      }
      for (let i = startIndex; i < endIndex && i < actualEntityCount; i++) {
        const offset1 = i * 9 + 9;
        const id1 = sharedFloatArray[offset1 + 0];
        if (id1 === 0)
          continue;
        let x1 = sharedFloatArray[offset1 + 1];
        let y1 = sharedFloatArray[offset1 + 2];
        let dx1 = sharedFloatArray[offset1 + 3];
        let dy1 = sharedFloatArray[offset1 + 4];
        const mass1 = sharedFloatArray[offset1 + 5];
        const bounce1 = sharedFloatArray[offset1 + 6];
        const radius1 = sharedFloatArray[offset1 + 8];
        for (let j = 0; j < actualEntityCount; j++) {
          if (i === j)
            continue;
          const offset2 = j * 9 + 9;
          const id2 = sharedFloatArray[offset2 + 0];
          if (id2 === 0)
            continue;
          const x2 = sharedFloatArray[offset2 + 1];
          const y2 = sharedFloatArray[offset2 + 2];
          const dx2 = sharedFloatArray[offset2 + 3];
          const dy2 = sharedFloatArray[offset2 + 4];
          const mass2 = sharedFloatArray[offset2 + 5];
          const bounce2 = sharedFloatArray[offset2 + 6];
          const radius2 = sharedFloatArray[offset2 + 8];
          if (isNaN(x2) || isNaN(y2) || isNaN(radius2) || radius2 <= 0)
            continue;
          const deltaX = x2 - x1;
          const deltaY = y2 - y1;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const minDistance = radius1 + radius2;
          if (distance < minDistance && distance > 0) {
            const nx = deltaX / distance;
            const ny = deltaY / distance;
            const overlap = minDistance - distance;
            const separationX = nx * overlap * 0.5;
            const separationY = ny * overlap * 0.5;
            x1 -= separationX;
            y1 -= separationY;
            const relativeVelocityX = dx2 - dx1;
            const relativeVelocityY = dy2 - dy1;
            const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;
            if (velocityAlongNormal > 0)
              continue;
            const restitution = (bounce1 + bounce2) * 0.5;
            const impulseScalar = -(1 + restitution) * velocityAlongNormal / (1 / mass1 + 1 / mass2);
            const impulseX = impulseScalar * nx;
            const impulseY = impulseScalar * ny;
            dx1 -= impulseX / mass1;
            dy1 -= impulseY / mass1;
            if (i < j) {
              const energyLoss = 0.98;
              dx1 *= energyLoss;
              dy1 *= energyLoss;
            }
          }
        }
        sharedFloatArray[offset1 + 1] = x1;
        sharedFloatArray[offset1 + 2] = y1;
        sharedFloatArray[offset1 + 3] = dx1;
        sharedFloatArray[offset1 + 4] = dy1;
      }
    };
  }
};
PhysicsWorkerSystem = __decorateClass$2([
  ECSSystem("PhysicsWorkerSystem")
], PhysicsWorkerSystem);
var __defProp$1 = Object.defineProperty;
var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
var __decorateClass$1 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$1(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$1(target, key, result);
  return result;
};
let RenderSystem = class extends EntitySystem {
  constructor(canvas) {
    super(Matcher.empty().all(Position, Renderable));
    this.startTime = 0;
    this.batchCount = 0;
    this.drawCallCount = 0;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }
  onBegin() {
    super.onBegin();
    this.startTime = performance.now();
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  process(entities) {
    let lastColor = "";
    this.drawCallCount = 0;
    for (const entity of entities) {
      const position = entity.getComponent(Position);
      const renderable = entity.getComponent(Renderable);
      if (renderable.color !== lastColor) {
        this.ctx.fillStyle = renderable.color;
        lastColor = renderable.color;
      }
      if (renderable.shape === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, renderable.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.drawCallCount++;
      } else if (renderable.shape === "square") {
        this.ctx.fillRect(
          position.x - renderable.size / 2,
          position.y - renderable.size / 2,
          renderable.size,
          renderable.size
        );
        this.drawCallCount++;
      }
    }
    const uniqueColors = new Set(entities.map((e) => e.getComponent(Renderable).color));
    this.batchCount = uniqueColors.size;
  }
  onEnd() {
    super.onEnd();
    const endTime = performance.now();
    const executionTime = endTime - this.startTime;
    window.renderExecutionTime = executionTime;
    this.drawDebugInfo();
  }
  drawDebugInfo() {
    const entities = this.entities;
    this.ctx.fillStyle = "#00ff00";
    this.ctx.font = "14px Arial";
    this.ctx.fillText(`实体数量: ${entities.length}`, 10, 20);
    this.ctx.fillText(`渲染批次: ${this.batchCount}`, 10, 140);
    this.ctx.fillText(`绘制调用: ${this.drawCallCount}`, 10, 160);
    const workerInfo = window.workerInfo;
    if (workerInfo) {
      this.ctx.fillStyle = workerInfo.enabled ? "#00ff00" : "#ff0000";
      this.ctx.fillText(`Worker: ${workerInfo.enabled ? "启用" : "禁用"}`, 10, 40);
      if (workerInfo.enabled) {
        this.ctx.fillStyle = "#ffff00";
        const entitiesPerWorker = Math.ceil(entities.length / workerInfo.workerCount);
        this.ctx.fillText(`每个Worker实体: ${entitiesPerWorker}`, 10, 60);
        this.ctx.fillText(`Worker数量: ${workerInfo.workerCount}`, 10, 80);
      }
    }
    const physicsTime = window.physicsExecutionTime || 0;
    const renderTime = window.renderExecutionTime || 0;
    this.ctx.fillStyle = physicsTime > 16 ? "#ff0000" : physicsTime > 8 ? "#ffff00" : "#00ff00";
    this.ctx.fillText(`物理: ${physicsTime.toFixed(2)}ms`, 10, 100);
    this.ctx.fillStyle = renderTime > 16 ? "#ff0000" : renderTime > 8 ? "#ffff00" : "#00ff00";
    this.ctx.fillText(`渲染: ${renderTime.toFixed(2)}ms`, 10, 120);
  }
};
RenderSystem = __decorateClass$1([
  ECSSystem("RenderSystem")
], RenderSystem);
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
let LifetimeSystem = class extends EntitySystem {
  constructor() {
    super(Matcher.empty().all(Lifetime));
  }
  process(entities) {
    const entitiesToRemove = [];
    for (const entity of entities) {
      const lifetime = entity.getComponent(Lifetime);
      lifetime.currentAge += Time.deltaTime;
      if (lifetime.isDead()) {
        entitiesToRemove.push(entity);
      }
    }
    for (const entity of entitiesToRemove) {
      entity.destroy();
    }
  }
};
LifetimeSystem = __decorateClass([
  ECSSystem("LifetimeSystem")
], LifetimeSystem);
class GameScene extends Scene {
  constructor(canvas) {
    super();
    this.canvas = canvas;
  }
  initialize() {
    this.name = "WorkerDemoScene";
    this.physicsSystem = new PhysicsWorkerSystem(true);
    this.renderSystem = new RenderSystem(this.canvas);
    this.lifetimeSystem = new LifetimeSystem();
    this.physicsSystem.updateOrder = 1;
    this.lifetimeSystem.updateOrder = 2;
    this.renderSystem.updateOrder = 3;
    this.addSystem(this.physicsSystem);
    this.addSystem(this.lifetimeSystem);
    this.addSystem(this.renderSystem);
  }
  onStart() {
    console.log("Worker演示场景已启动");
    this.spawnInitialEntities();
  }
  unload() {
    console.log("Worker演示场景已卸载");
  }
  /**
   * 生成初始实体
   */
  spawnInitialEntities(count = 1e3) {
    this.clearAllEntities();
    for (let i = 0; i < count; i++) {
      this.createParticle();
    }
  }
  /**
   * 创建一个粒子实体
   */
  createParticle() {
    const entity = this.createEntity(`Particle_${Date.now()}_${Math.random()}`);
    const x = Math.random() * (this.canvas.width - 20) + 10;
    const y = Math.random() * (this.canvas.height - 20) + 10;
    const dx = (Math.random() - 0.5) * 200;
    const dy = (Math.random() - 0.5) * 200;
    const mass = Math.random() * 3 + 2;
    const bounce = 0.85 + Math.random() * 0.15;
    const friction = 0.998 + Math.random() * 2e-3;
    const colors = [
      "#ff4444",
      "#44ff44",
      "#4444ff",
      "#ffff44",
      "#ff44ff",
      "#44ffff",
      "#ffffff",
      "#ff8844",
      "#88ff44",
      "#4488ff",
      "#ff4488",
      "#88ff88",
      "#8888ff",
      "#ffaa44",
      "#aaff44",
      "#44aaff",
      "#ff44aa",
      "#aa44ff",
      "#44ffaa",
      "#cccccc"
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 6 + 3;
    entity.addComponent(new Position(x, y));
    entity.addComponent(new Velocity(dx, dy));
    entity.addComponent(new Physics(mass, bounce, friction));
    entity.addComponent(new Renderable(color, size, "circle"));
    entity.addComponent(new Lifetime(5 + Math.random() * 10));
  }
  /**
   * 生成粒子爆发效果
   */
  spawnParticleExplosion(centerX, centerY, count = 50) {
    for (let i = 0; i < count; i++) {
      const entity = this.createEntity(`Explosion_${Date.now()}_${i}`);
      const angle = Math.PI * 2 * i / count + (Math.random() - 0.5) * 0.5;
      const distance = Math.random() * 30;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const speed = 100 + Math.random() * 150;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      const mass = 0.5 + Math.random() * 1;
      const bounce = 0.8 + Math.random() * 0.2;
      const colors = ["#ffaa00", "#ff6600", "#ff0066", "#ff3300", "#ffff00"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 4 + 2;
      entity.addComponent(new Position(x, y));
      entity.addComponent(new Velocity(dx, dy));
      entity.addComponent(new Physics(mass, bounce, 0.999));
      entity.addComponent(new Renderable(color, size, "circle"));
      entity.addComponent(new Lifetime(2 + Math.random() * 3));
    }
  }
  /**
   * 清空所有实体
   */
  clearAllEntities() {
    const entities = [...this.entities.buffer];
    for (const entity of entities) {
      entity.destroy();
    }
  }
  /**
   * 切换Worker启用状态
   */
  toggleWorker() {
    const workerInfo = this.physicsSystem.getWorkerInfo();
    const newWorkerEnabled = !workerInfo.enabled;
    this.removeSystem(this.physicsSystem);
    this.physicsSystem = new PhysicsWorkerSystem(newWorkerEnabled);
    this.physicsSystem.updateOrder = 1;
    this.addSystem(this.physicsSystem);
    return newWorkerEnabled;
  }
  /**
   * 更新Worker配置
   */
  updateWorkerConfig(config) {
    if (config.gravity !== void 0 || config.friction !== void 0) {
      const physicsConfig = this.physicsSystem.getPhysicsConfig();
      this.physicsSystem.updatePhysicsConfig({
        gravity: config.gravity ?? physicsConfig.gravity,
        groundFriction: config.friction ?? physicsConfig.groundFriction
      });
    }
  }
  /**
   * 获取系统信息
   */
  getSystemInfo() {
    return {
      physics: this.physicsSystem.getWorkerInfo(),
      entityCount: this.entities.count,
      physicsConfig: this.physicsSystem.getPhysicsConfig()
    };
  }
}
class WorkerDemo {
  constructor() {
    this.isRunning = false;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;
    this.currentFPS = 0;
    this.lastWorkerStatusUpdate = 0;
    this.elements = {};
    this.gameLoop = () => {
      if (!this.isRunning)
        return;
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1e3;
      this.lastTime = currentTime;
      const frameStartTime = performance.now();
      Core.update(deltaTime);
      const frameEndTime = performance.now();
      this.updatePerformanceStats({
        fps: this.currentFPS,
        frameTime: frameEndTime - frameStartTime,
        physicsTime: window.physicsExecutionTime || 0,
        renderTime: window.renderExecutionTime || 0,
        memoryUsage: this.getMemoryUsage()
      });
      this.frameCount++;
      if (currentTime - this.fpsUpdateTime >= 1e3) {
        this.currentFPS = this.frameCount;
        this.frameCount = 0;
        this.fpsUpdateTime = currentTime;
      }
      this.updateUI();
      requestAnimationFrame(this.gameLoop);
    };
    this.canvas = document.getElementById("gameCanvas");
    if (!this.canvas) {
      throw new Error("Canvas element not found");
    }
    this.initializeUIElements();
    Core.create({
      debug: true,
      enableEntitySystems: true
    });
    this.gameScene = new GameScene(this.canvas);
    Core.setScene(this.gameScene);
    this.bindEvents();
    this.start();
  }
  initializeUIElements() {
    const elementIds = [
      "entityCount",
      "entityCountValue",
      "toggleWorker",
      "gravity",
      "gravityValue",
      "friction",
      "frictionValue",
      "spawnParticles",
      "clearEntities",
      "resetDemo",
      "fps",
      "entityCountStat",
      "workerStatus",
      "workerLoad",
      "physicsTime",
      "renderTime",
      "frameTime",
      "memoryUsage"
    ];
    for (const id of elementIds) {
      const element = document.getElementById(id);
      if (element) {
        this.elements[id] = element;
      } else {
        console.warn(`Element with id '${id}' not found`);
      }
    }
  }
  bindEvents() {
    if (this.elements.entityCount && this.elements.entityCountValue) {
      const slider = this.elements.entityCount;
      slider.addEventListener("input", () => {
        this.elements.entityCountValue.textContent = slider.value;
      });
      slider.addEventListener("change", () => {
        const count = parseInt(slider.value);
        this.gameScene.spawnInitialEntities(count);
      });
    }
    if (this.elements.toggleWorker) {
      this.elements.toggleWorker.addEventListener("click", () => {
        const workerEnabled = this.gameScene.toggleWorker();
        this.elements.toggleWorker.textContent = workerEnabled ? "禁用 Worker" : "启用 Worker";
        this.updateWorkerStatus();
      });
    }
    if (this.elements.gravity && this.elements.gravityValue) {
      const slider = this.elements.gravity;
      slider.addEventListener("input", () => {
        this.elements.gravityValue.textContent = slider.value;
      });
      slider.addEventListener("change", () => {
        const gravity = parseInt(slider.value);
        this.gameScene.updateWorkerConfig({ gravity });
      });
    }
    if (this.elements.friction && this.elements.frictionValue) {
      const slider = this.elements.friction;
      slider.addEventListener("input", () => {
        const value = parseInt(slider.value);
        this.elements.frictionValue.textContent = `${value}%`;
      });
      slider.addEventListener("change", () => {
        const friction = parseInt(slider.value) / 100;
        this.gameScene.updateWorkerConfig({ friction });
      });
    }
    if (this.elements.spawnParticles) {
      this.elements.spawnParticles.addEventListener("click", () => {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.gameScene.spawnParticleExplosion(centerX, centerY, 100);
      });
    }
    if (this.elements.clearEntities) {
      this.elements.clearEntities.addEventListener("click", () => {
        this.gameScene.clearAllEntities();
      });
    }
    if (this.elements.resetDemo) {
      this.elements.resetDemo.addEventListener("click", () => {
        this.resetDemo();
      });
    }
    this.canvas.addEventListener("click", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.gameScene.spawnParticleExplosion(x, y, 30);
    });
  }
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
    console.log("Worker演示已启动");
  }
  updatePerformanceStats(stats) {
    if (this.elements.fps) {
      this.elements.fps.textContent = stats.fps.toString();
      this.elements.fps.className = stats.fps >= 55 ? "performance-high" : stats.fps >= 30 ? "performance-medium" : "performance-low";
    }
    if (this.elements.frameTime) {
      this.elements.frameTime.textContent = stats.frameTime.toFixed(2);
      this.elements.frameTime.className = stats.frameTime <= 16 ? "performance-high" : stats.frameTime <= 33 ? "performance-medium" : "performance-low";
    }
    if (this.elements.physicsTime) {
      this.elements.physicsTime.textContent = stats.physicsTime.toFixed(2);
      this.elements.physicsTime.className = stats.physicsTime <= 8 ? "performance-high" : stats.physicsTime <= 16 ? "performance-medium" : "performance-low";
    }
    if (this.elements.renderTime) {
      this.elements.renderTime.textContent = stats.renderTime.toFixed(2);
      this.elements.renderTime.className = stats.renderTime <= 8 ? "performance-high" : stats.renderTime <= 16 ? "performance-medium" : "performance-low";
    }
    if (this.elements.memoryUsage) {
      this.elements.memoryUsage.textContent = stats.memoryUsage.toFixed(1);
    }
  }
  updateUI() {
    const currentTime = performance.now();
    const systemInfo = this.gameScene.getSystemInfo();
    if (this.elements.entityCountStat) {
      this.elements.entityCountStat.textContent = systemInfo.entityCount.toString();
    }
    if (currentTime - this.lastWorkerStatusUpdate >= 500) {
      this.updateWorkerStatus();
      this.lastWorkerStatusUpdate = currentTime;
    }
    window.workerInfo = systemInfo.physics;
  }
  updateWorkerStatus() {
    const systemInfo = this.gameScene.getSystemInfo();
    const workerInfo = systemInfo.physics;
    const entityCount = systemInfo.entityCount;
    if (this.elements.workerStatus) {
      if (workerInfo.enabled) {
        this.elements.workerStatus.textContent = `启用 (${workerInfo.workerCount} Workers)`;
        this.elements.workerStatus.className = "worker-enabled";
      } else {
        this.elements.workerStatus.textContent = "禁用";
        this.elements.workerStatus.className = "worker-disabled";
      }
    }
    if (this.elements.workerLoad) {
      if (workerInfo.enabled && entityCount > 0) {
        const entitiesPerWorker = Math.ceil(entityCount / workerInfo.workerCount);
        this.elements.workerLoad.textContent = `${entitiesPerWorker}/Worker (共${workerInfo.workerCount}个)`;
      } else {
        this.elements.workerLoad.textContent = "N/A";
      }
    }
  }
  getMemoryUsage() {
    if ("memory" in performance) {
      const memory = performance.memory;
      return memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }
  resetDemo() {
    if (this.elements.entityCount) {
      this.elements.entityCount.value = "1000";
      this.elements.entityCountValue.textContent = "1000";
    }
    if (this.elements.gravity) {
      this.elements.gravity.value = "100";
      this.elements.gravityValue.textContent = "100";
    }
    if (this.elements.friction) {
      this.elements.friction.value = "95";
      this.elements.frictionValue.textContent = "95%";
    }
    const workerInfo = this.gameScene.getSystemInfo().physics;
    if (!workerInfo.enabled) {
      this.gameScene.toggleWorker();
    }
    if (this.elements.toggleWorker) {
      this.elements.toggleWorker.textContent = "禁用 Worker";
    }
    this.gameScene.spawnInitialEntities(1e3);
    this.gameScene.updateWorkerConfig({
      gravity: 100,
      friction: 0.95
    });
    console.log("演示已重置");
  }
  stop() {
    this.isRunning = false;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  try {
    new WorkerDemo();
  } catch (error) {
    console.error("启动演示失败:", error);
    document.body.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h1>启动失败</h1>
                <p>错误: ${error}</p>
                <p>请确保浏览器支持Web Workers和Canvas API</p>
            </div>
        `;
  }
});
