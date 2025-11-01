import { IPoolable, PoolStats } from './IPoolable';

/**
 * 高性能通用对象池
 * 支持任意类型的对象池化，包含详细的统计信息
 */
export class Pool<T extends IPoolable> {
    private static _pools = new Map<Function, Pool<any>>();

    private _objects: T[] = [];
    private _createFn: () => T;
    private _maxSize: number;
    private _stats: PoolStats;
    private _objectSize: number; // 估算的单个对象大小

    /**
     * 构造函数
     * @param createFn 创建对象的函数
     * @param maxSize 池的最大大小，默认100
     * @param estimatedObjectSize 估算的单个对象大小（字节），默认1024
     */
    constructor(createFn: () => T, maxSize: number = 100, estimatedObjectSize: number = 1024) {
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
    public static getPool<T extends IPoolable>(
        type: new (...args: unknown[]) => T,
        maxSize: number = 100,
        estimatedObjectSize: number = 1024
    ): Pool<T> {
        let pool = this._pools.get(type);

        if (!pool) {
            pool = new Pool<T>(() => new type(), maxSize, estimatedObjectSize);
            this._pools.set(type, pool);
        }

        return pool;
    }

    /**
     * 从池中获取对象
     * @returns 对象实例
     */
    public obtain(): T {
        this._stats.totalObtained++;

        if (this._objects.length > 0) {
            const obj = this._objects.pop()!;
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
    public release(obj: T): void {
        if (!obj) return;

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
    public getStats(): Readonly<PoolStats> {
        return { ...this._stats };
    }

    /**
     * 清空池
     */
    public clear(): void {
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
    public compact(targetSize?: number): void {
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
    public prewarm(count: number): void {
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
    public setMaxSize(maxSize: number): void {
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
    public getAvailableCount(): number {
        return this._objects.length;
    }

    /**
     * 检查池是否为空
     * @returns 如果池为空返回true
     */
    public isEmpty(): boolean {
        return this._objects.length === 0;
    }

    /**
     * 检查池是否已满
     * @returns 如果池已满返回true
     */
    public isFull(): boolean {
        return this._objects.length >= this._maxSize;
    }

    /**
     * 获取所有已注册的池类型
     * @returns 所有池类型的数组
     */
    public static getAllPoolTypes(): Function[] {
        return Array.from(this._pools.keys());
    }

    /**
     * 获取所有池的统计信息
     * @returns 包含所有池统计信息的对象
     */
    public static getAllPoolStats(): Record<string, PoolStats> {
        const stats: Record<string, PoolStats> = {};

        for (const [type, pool] of this._pools) {
            const typeName = type.name || type.toString();
            stats[typeName] = pool.getStats();
        }

        return stats;
    }

    /**
     * 压缩所有池
     */
    public static compactAllPools(): void {
        for (const pool of this._pools.values()) {
            pool.compact();
        }
    }

    /**
     * 清空所有池
     */
    public static clearAllPools(): void {
        for (const pool of this._pools.values()) {
            pool.clear();
        }
        this._pools.clear();
    }

    /**
     * 获取全局池统计信息的格式化字符串
     * @returns 格式化的统计信息字符串
     */
    public static getGlobalStatsString(): string {
        const stats = this.getAllPoolStats();
        const lines: string[] = ['=== Object Pool Global Statistics ===', ''];

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
    private _updateHitRate(): void {
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
    private _updateMemoryUsage(): void {
        this._stats.estimatedMemoryUsage = this._stats.size * this._objectSize;
    }
}
