/**
 * 可池化对象接口
 */
export interface IPoolable {
    /**
     * 重置对象状态，准备重用
     */
    reset(): void;
}

/**
 * 对象池统计信息
 */
export interface PoolStats {
    /** 池中对象数量 */
    size: number;
    /** 池的最大大小 */
    maxSize: number;
    /** 总共创建的对象数量 */
    totalCreated: number;
    /** 总共获取的次数 */
    totalObtained: number;
    /** 总共释放的次数 */
    totalReleased: number;
    /** 命中率（从池中获取的比例） */
    hitRate: number;
    /** 内存使用估算（字节） */
    estimatedMemoryUsage: number;
}

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
        type: new (...args: any[]) => T, 
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
        
        // 池中没有对象，创建新的
        const obj = this._createFn();
        this._stats.totalCreated++;
        this._updateHitRate();
        return obj;
    }

    /**
     * 将对象归还到池中
     * @param obj 要归还的对象
     */
    public free(obj: T): void {
        if (this._objects.length < this._maxSize) {
            obj.reset();
            this._objects.push(obj);
            this._stats.size++;
            this._stats.totalReleased++;
            this._updateMemoryUsage();
        }
        // 如果池已满，对象会被丢弃（由GC回收）
    }

    /**
     * 预热池，创建指定数量的对象
     * @param count 要创建的对象数量
     */
    public warmUp(count: number): void {
        const targetSize = Math.min(count, this._maxSize);
        
        while (this._objects.length < targetSize) {
            const obj = this._createFn();
            this._stats.totalCreated++;
            this._objects.push(obj);
            this._stats.size++;
        }
        
        this._updateMemoryUsage();
    }

    /**
     * 清空池
     */
    public clear(): void {
        this._objects.length = 0;
        this._stats.size = 0;
        this._updateMemoryUsage();
    }

    /**
     * 获取池中对象数量
     */
    public get size(): number {
        return this._objects.length;
    }

    /**
     * 获取池的最大大小
     */
    public get maxSize(): number {
        return this._maxSize;
    }

    /**
     * 设置池的最大大小
     */
    public set maxSize(value: number) {
        this._maxSize = value;
        this._stats.maxSize = value;
        
        // 如果当前池大小超过新的最大值，则移除多余的对象
        while (this._objects.length > this._maxSize) {
            this._objects.pop();
            this._stats.size--;
        }
        
        this._updateMemoryUsage();
    }

    /**
     * 获取池的统计信息
     */
    public getStats(): PoolStats {
        return { ...this._stats };
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this._stats.totalCreated = 0;
        this._stats.totalObtained = 0;
        this._stats.totalReleased = 0;
        this._stats.hitRate = 0;
    }

    /**
     * 更新命中率
     */
    private _updateHitRate(): void {
        if (this._stats.totalObtained > 0) {
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

    /**
     * 静态方法：从指定类型的池中获取对象
     * @param type 对象类型
     * @returns 对象实例
     */
    public static obtain<T extends IPoolable>(type: new (...args: any[]) => T): T {
        return this.getPool(type).obtain();
    }

    /**
     * 静态方法：将对象归还到对应类型的池中
     * @param type 对象类型
     * @param obj 要归还的对象
     */
    public static free<T extends IPoolable>(type: new (...args: any[]) => T, obj: T): void {
        this.getPool(type).free(obj);
    }

    /**
     * 静态方法：预热指定类型的池
     * @param type 对象类型
     * @param count 要创建的对象数量
     */
    public static warmUp<T extends IPoolable>(type: new (...args: any[]) => T, count: number): void {
        this.getPool(type).warmUp(count);
    }

    /**
     * 静态方法：清空指定类型的池
     * @param type 对象类型
     */
    public static clearPool<T extends IPoolable>(type: new (...args: any[]) => T): void {
        const pool = this._pools.get(type);
        if (pool) {
            pool.clear();
        }
    }

    /**
     * 静态方法：清空所有池
     */
    public static clearAllPools(): void {
        for (const pool of this._pools.values()) {
            pool.clear();
        }
        this._pools.clear();
    }

    /**
     * 静态方法：获取池的统计信息
     * @returns 池的统计信息
     */
    public static getStats(): { [typeName: string]: PoolStats } {
        const stats: { [typeName: string]: PoolStats } = {};
        
        for (const [type, pool] of this._pools.entries()) {
            const typeName = (type as any).name || 'Unknown';
            stats[typeName] = pool.getStats();
        }
        
        return stats;
    }

    /**
     * 静态方法：获取所有池的总内存使用量
     * @returns 总内存使用量（字节）
     */
    public static getTotalMemoryUsage(): number {
        let total = 0;
        for (const pool of this._pools.values()) {
            total += pool.getStats().estimatedMemoryUsage;
        }
        return total;
    }

    /**
     * 静态方法：获取性能报告
     * @returns 格式化的性能报告
     */
    public static getPerformanceReport(): string {
        const stats = this.getStats();
        const lines: string[] = [];
        
        lines.push('=== Object Pool Performance Report ===');
        lines.push(`Total Memory Usage: ${(this.getTotalMemoryUsage() / 1024 / 1024).toFixed(2)} MB`);
        lines.push('');
        
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
}

/**
 * 分层对象池
 * 使用多个不同大小的池来优化内存使用
 */
export class TieredObjectPool<T extends IPoolable> {
    private pools: Pool<T>[] = [];
    private createFn: () => T;
    private resetFn: (obj: T) => void;
    private tierSizes: number[];
    private totalObtained = 0;
    private totalReleased = 0;

    /**
     * 构造函数
     * @param createFn 创建对象的函数
     * @param resetFn 重置对象的函数
     * @param tierSizes 各层级的大小，默认[10, 50, 200]
     * @param estimatedObjectSize 估算的单个对象大小
     */
    constructor(
        createFn: () => T, 
        resetFn: (obj: T) => void, 
        tierSizes: number[] = [10, 50, 200],
        estimatedObjectSize: number = 1024
    ) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.tierSizes = tierSizes;
        
        // 初始化不同层级的池
        for (const size of tierSizes) {
            this.pools.push(new Pool(createFn, size, estimatedObjectSize));
        }
    }

    /**
     * 获取对象
     * @returns 对象实例
     */
    public obtain(): T {
        this.totalObtained++;
        
        // 从最小的池开始尝试获取
        for (const pool of this.pools) {
            if (pool.size > 0) {
                return pool.obtain();
            }
        }
        
        // 所有池都空了，创建新对象
        return this.createFn();
    }

    /**
     * 释放对象
     * @param obj 要释放的对象
     */
    public release(obj: T): void {
        this.totalReleased++;
        this.resetFn(obj);
        
        // 放入第一个有空间的池
        for (const pool of this.pools) {
            if (pool.size < pool.maxSize) {
                pool.free(obj);
                return;
            }
        }
        
        // 所有池都满了，直接丢弃
    }

    /**
     * 预热所有池
     * @param totalCount 总预热数量
     */
    public warmUp(totalCount: number): void {
        let remaining = totalCount;
        
        for (const pool of this.pools) {
            const warmUpCount = Math.min(remaining, pool.maxSize);
            pool.warmUp(warmUpCount);
            remaining -= warmUpCount;
            
            if (remaining <= 0) break;
        }
    }

    /**
     * 清空所有池
     */
    public clear(): void {
        for (const pool of this.pools) {
            pool.clear();
        }
    }

    /**
     * 获取统计信息
     */
    public getStats(): {
        totalSize: number;
        totalMaxSize: number;
        totalMemoryUsage: number;
        tierStats: PoolStats[];
        hitRate: number;
    } {
        let totalSize = 0;
        let totalMaxSize = 0;
        let totalMemoryUsage = 0;
        const tierStats: PoolStats[] = [];
        
        for (const pool of this.pools) {
            const stats = pool.getStats();
            tierStats.push(stats);
            totalSize += stats.size;
            totalMaxSize += stats.maxSize;
            totalMemoryUsage += stats.estimatedMemoryUsage;
        }
        
        const hitRate = this.totalObtained > 0 ? 
            (this.totalObtained - this.getTotalCreated()) / this.totalObtained : 0;
        
        return {
            totalSize,
            totalMaxSize,
            totalMemoryUsage,
            tierStats,
            hitRate
        };
    }

    /**
     * 获取总创建数量
     */
    private getTotalCreated(): number {
        return this.pools.reduce((total, pool) => total + pool.getStats().totalCreated, 0);
    }
}

/**
 * 池管理器
 * 统一管理所有对象池
 */
export class PoolManager {
    private static instance: PoolManager;
    private pools = new Map<string, Pool<any> | TieredObjectPool<any>>();
    private autoCompactInterval = 60000; // 60秒
    private lastCompactTime = 0;

    public static getInstance(): PoolManager {
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
    public registerPool<T extends IPoolable>(name: string, pool: Pool<T> | TieredObjectPool<T>): void {
        this.pools.set(name, pool);
    }

    /**
     * 获取池
     * @param name 池名称
     * @returns 池实例
     */
    public getPool<T extends IPoolable>(name: string): Pool<T> | TieredObjectPool<T> | null {
        return this.pools.get(name) || null;
    }

    /**
     * 更新池管理器（应在游戏循环中调用）
     */
    public update(): void {
        const now = Date.now();
        
        if (now - this.lastCompactTime > this.autoCompactInterval) {
            this.compactAllPools();
            this.lastCompactTime = now;
        }
    }

    /**
     * 压缩所有池（清理碎片）
     */
    public compactAllPools(): void {
        // 对于标准池，可以考虑清理一些长时间未使用的对象
        // 这里简单实现为重置统计信息
        for (const pool of this.pools.values()) {
            if (pool instanceof Pool) {
                pool.resetStats();
            }
        }
    }

    /**
     * 获取所有池的统计信息
     */
    public getAllStats(): Map<string, any> {
        const stats = new Map<string, any>();
        
        for (const [name, pool] of this.pools.entries()) {
            if (pool instanceof Pool) {
                stats.set(name, pool.getStats());
            } else if (pool instanceof TieredObjectPool) {
                stats.set(name, pool.getStats());
            }
        }
        
        return stats;
    }

    /**
     * 生成性能报告
     */
    public generateReport(): string {
        const lines: string[] = [];
        lines.push('=== Pool Manager Report ===');
        
        let totalMemory = 0;
        
        for (const [name, pool] of this.pools.entries()) {
            lines.push(`\n${name}:`);
            
            if (pool instanceof Pool) {
                const stats = pool.getStats();
                lines.push(`  Type: Standard Pool`);
                lines.push(`  Size: ${stats.size}/${stats.maxSize}`);
                lines.push(`  Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
                lines.push(`  Memory: ${(stats.estimatedMemoryUsage / 1024).toFixed(1)} KB`);
                totalMemory += stats.estimatedMemoryUsage;
            } else if (pool instanceof TieredObjectPool) {
                const stats = pool.getStats();
                lines.push(`  Type: Tiered Pool`);
                lines.push(`  Total Size: ${stats.totalSize}/${stats.totalMaxSize}`);
                lines.push(`  Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
                lines.push(`  Memory: ${(stats.totalMemoryUsage / 1024).toFixed(1)} KB`);
                totalMemory += stats.totalMemoryUsage;
            }
        }
        
        lines.push(`\nTotal Memory Usage: ${(totalMemory / 1024 / 1024).toFixed(2)} MB`);
        
        return lines.join('\n');
    }
} 