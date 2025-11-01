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
export class IdentifierPool {
    /**
     * 下一个可用的索引
     */
    private _nextAvailableIndex = 0;

    /**
     * 空闲的索引列表
     */
    private _freeIndices: number[] = [];

    /**
     * 每个索引对应的世代版本
     * 动态扩展的Map，按需分配内存
     */
    private _generations = new Map<number, number>();

    /**
     * 延迟回收队列
     * 防止在同一帧内立即重用ID，避免时序问题
     */
    private _pendingRecycle: Array<{
        index: number;
        generation: number;
        timestamp: number;
    }> = [];

    /**
     * 延迟回收时间（毫秒）
     */
    private _recycleDelay: number = 100;

    /**
     * 最大索引限制（16位）
     * 这是框架设计选择：16位索引 + 16位版本 = 32位ID，确保高效位操作
     * 不是硬件限制，而是性能和内存效率的权衡
     */
    private static readonly MAX_INDEX = 0xFFFF; // 65535

    /**
     * 最大世代限制（16位）
     */
    private static readonly MAX_GENERATION = 0xFFFF; // 65535

    /**
     * 内存扩展块大小
     * 当需要更多内存时，一次性预分配的索引数量
     */
    private _expansionBlockSize: number;

    /**
     * 统计信息
     */
    private _stats = {
        totalAllocated: 0,
        totalRecycled: 0,
        currentActive: 0,
        memoryExpansions: 0
    };

    /**
     * 构造函数
     *
     * @param recycleDelay 延迟回收时间（毫秒），默认为100ms
     * @param expansionBlockSize 内存扩展块大小，默认为1024
     */
    constructor(recycleDelay: number = 100, expansionBlockSize: number = 1024) {
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
    public checkOut(): number {
        // 处理延迟回收队列
        this._processDelayedRecycle();

        let index: number;

        if (this._freeIndices.length > 0) {
            // 重用回收的索引
            index = this._freeIndices.pop()!;
        } else {
            // 分配新索引
            if (this._nextAvailableIndex > IdentifierPool.MAX_INDEX) {
                throw new Error(
                    `实体索引已达到框架设计限制 (${IdentifierPool.MAX_INDEX})。` +
                    '这意味着您已经分配了超过65535个不同的实体索引。' +
                    '这是16位索引设计的限制，考虑优化实体回收策略或升级到64位ID设计。'
                );
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
    public checkIn(id: number): boolean {
        const index = this._unpackIndex(id);
        const generation = this._unpackGeneration(id);

        // 验证ID有效性
        if (!this._isValidId(index, generation)) {
            return false;
        }

        // 检查是否已经在待回收队列中
        const alreadyPending = this._pendingRecycle.some(
            (item) => item.index === index && item.generation === generation
        );

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
    public isValid(id: number): boolean {
        const index = this._unpackIndex(id);
        const generation = this._unpackGeneration(id);
        return this._isValidId(index, generation);
    }

    /**
     * 获取统计信息
     *
     * @returns 池的当前状态统计
     */
    public getStats(): {
        /** 已分配的总索引数 */
        totalAllocated: number;
        /** 总计回收次数 */
        totalRecycled: number;
        /** 当前活跃实体数 */
        currentActive: number;
        /** 当前空闲的索引数 */
        currentlyFree: number;
        /** 等待回收的ID数 */
        pendingRecycle: number;
        /** 理论最大实体数（设计限制） */
        maxPossibleEntities: number;
        /** 当前使用的最大索引 */
        maxUsedIndex: number;
        /** 内存使用（字节） */
        memoryUsage: number;
        /** 内存扩展次数 */
        memoryExpansions: number;
        /** 平均世代版本 */
        averageGeneration: number;
        /** 世代存储大小 */
        generationStorageSize: number;
        } {
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
    public forceProcessDelayedRecycle(): void {
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
    private _processDelayedRecycle(forceAll: boolean = false): void {
        if (this._pendingRecycle.length === 0) return;

        const now = Date.now();
        const readyToRecycle: typeof this._pendingRecycle = [];
        const stillPending: typeof this._pendingRecycle = [];

        // 分离已到期和未到期的项
        for (const item of this._pendingRecycle) {
            if (forceAll || now - item.timestamp >= this._recycleDelay) {
                readyToRecycle.push(item);
            } else {
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
    private _preAllocateGenerations(startIndex: number, count: number): void {
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
    private _ensureGenerationCapacity(index: number): void {
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
    private _calculateMemoryUsage(): number {
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
    private _packId(index: number, generation: number): number {
        return (generation << 16) | index;
    }

    /**
     * 从ID中解包索引
     *
     * @param id 32位ID
     * @returns 索引部分（16位）
     * @private
     */
    private _unpackIndex(id: number): number {
        return id & 0xFFFF;
    }

    /**
     * 从ID中解包世代版本
     *
     * @param id 32位ID
     * @returns 世代版本部分（16位）
     * @private
     */
    private _unpackGeneration(id: number): number {
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
    private _isValidId(index: number, generation: number): boolean {
        if (index < 0 || index >= this._nextAvailableIndex) {
            return false;
        }

        const currentGeneration = this._generations.get(index);
        return currentGeneration !== undefined && currentGeneration === generation;
    }
}
