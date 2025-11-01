import { IPoolable, PoolStats } from './IPoolable';
import { Pool } from './Pool';
import type { IService } from '../../Core/ServiceContainer';

/**
 * 池管理器
 * 统一管理所有对象池
 */
export class PoolManager implements IService {
    private pools = new Map<string, Pool<any>>();
    private autoCompactInterval = 60000; // 60秒
    private lastCompactTime = 0;

    constructor() {
        // 普通构造函数，不再使用单例模式
    }

    /**
     * 注册池
     * @param name 池名称
     * @param pool 池实例
     */
    public registerPool<T extends IPoolable>(name: string, pool: Pool<T>): void {
        this.pools.set(name, pool);
    }

    /**
     * 获取池
     * @param name 池名称
     * @returns 池实例
     */
    public getPool<T extends IPoolable>(name: string): Pool<T> | null {
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
     * 创建或获取标准池
     * @param name 池名称
     * @param createFn 创建函数
     * @param maxSize 最大大小
     * @param estimatedObjectSize 估算对象大小
     * @returns 池实例
     */
    public createPool<T extends IPoolable>(
        name: string,
        createFn: () => T,
        maxSize: number = 100,
        estimatedObjectSize: number = 1024
    ): Pool<T> {
        let pool = this.pools.get(name) as Pool<T>;

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
    public removePool(name: string): boolean {
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
    public getPoolNames(): string[] {
        return Array.from(this.pools.keys());
    }

    /**
     * 获取池数量
     * @returns 池数量
     */
    public getPoolCount(): number {
        return this.pools.size;
    }

    /**
     * 压缩所有池
     */
    public compactAllPools(): void {
        for (const pool of this.pools.values()) {
            pool.compact();
        }
    }

    /**
     * 清空所有池
     */
    public clearAllPools(): void {
        for (const pool of this.pools.values()) {
            pool.clear();
        }
    }

    /**
     * 获取所有池的统计信息
     * @returns 统计信息映射
     */
    public getAllStats(): Map<string, PoolStats> {
        const stats = new Map<string, PoolStats>();

        for (const [name, pool] of this.pools) {
            stats.set(name, pool.getStats());
        }

        return stats;
    }

    /**
     * 获取总体统计信息
     * @returns 总体统计信息
     */
    public getGlobalStats(): PoolStats {
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
    public getStatsString(): string {
        const lines: string[] = ['=== Pool Manager Statistics ===', ''];

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
    public setAutoCompactInterval(intervalMs: number): void {
        this.autoCompactInterval = intervalMs;
    }

    /**
     * 预填充所有池
     */
    public prewarmAllPools(): void {
        for (const pool of this.pools.values()) {
            const stats = pool.getStats();
            const prewarmCount = Math.floor(stats.maxSize * 0.2); // 预填充20%
            pool.prewarm(prewarmCount);
        }
    }

    /**
     * 重置池管理器
     */
    public reset(): void {
        this.clearAllPools();
        this.pools.clear();
        this.lastCompactTime = 0;
    }

    /**
     * 释放资源
     * 实现 IService 接口
     */
    public dispose(): void {
        this.reset();
    }
}
