/**
 * 压缩实体ID池
 *
 * 采用20位索引(1048576个实体槽位) + 12位世代(4096个版本)的设计。
 * 32位EntityID = [12位世代][20位索引]，专为ECS核心循环优化。
 *
 * 设计特点：
 * - 使用TypedArray确保内存连续性
 * - 支持延迟回收避免同帧重用
 * - 提供批量操作减少函数调用开销
 * - O(1)时间复杂度的分配和验证
 *
 * @example
 * ```typescript
 * const pool = new CompressedEntityPool();
 *
 * // 分配和验证实体ID
 * const entityId = pool.allocate();
 * const isValid = pool.isValid(entityId);
 * pool.recycle(entityId);
 * ```
 */
export class CompressedEntityPool {
    /**
     * 世代存储数组
     */
    private readonly generations: Uint16Array;

    /**
     * 空闲索引栈
     */
    private readonly freeIndices: Uint32Array;
    private freeTop: number = 0;

    /**
     * 下一个可分配的索引
     */
    private nextIndex: number = 0;

    /**
     * 延迟回收队列
     */
    private readonly recycleQueue: Uint32Array;
    private recycleHead: number = 0;
    private recycleTail: number = 0;
    private recycleCount: number = 0;
    
    /**
     * 常量定义
     */
    public static readonly MAX_ENTITIES = 1048576; // 2^20
    public static readonly MAX_GENERATION = 4095; // 2^12 - 1
    public static readonly INDEX_MASK = 0x0FFFFF; // 20位索引掩码
    public static readonly GENERATION_MASK = 0xFFF00000; // 12位世代掩码
    public static readonly GENERATION_SHIFT = 20; // 世代位移
    public static readonly RECYCLE_QUEUE_SIZE = 256;

    /**
     * 统计信息
     */
    private totalAllocated: number = 0;
    private totalRecycled: number = 0;
    private currentActive: number = 0;
    
    constructor() {
        // 预分配所有必需的TypedArray
        this.generations = new Uint16Array(CompressedEntityPool.MAX_ENTITIES);
        this.freeIndices = new Uint32Array(CompressedEntityPool.MAX_ENTITIES);
        this.recycleQueue = new Uint32Array(CompressedEntityPool.RECYCLE_QUEUE_SIZE);

        // 初始化所有世代为1
        this.generations.fill(1);
    }
    
    /**
     * 分配新的实体ID
     *
     * @returns 32位压缩实体ID，失败时返回0
     */
    public allocate(): number {
        // 处理延迟回收
        this.processRecycleQueue();

        let index: number;

        // 优先重用空闲索引
        if (this.freeTop > 0) {
            index = this.freeIndices[--this.freeTop];
        } else {
            // 分配新索引
            if (this.nextIndex >= CompressedEntityPool.MAX_ENTITIES) {
                return 0;
            }
            index = this.nextIndex++;
        }

        // 获取当前世代并打包ID
        const generation = this.generations[index];
        const entityId = (generation << CompressedEntityPool.GENERATION_SHIFT) | index;

        // 更新统计
        this.totalAllocated++;
        this.currentActive++;
        
        return entityId;
    }
    
    /**
     * 回收实体ID
     *
     * @param entityId 要回收的实体ID
     * @returns 是否成功加入回收队列
     */
    public recycle(entityId: number): boolean {
        // 验证ID格式
        if (entityId === 0) return false;

        const index = entityId & CompressedEntityPool.INDEX_MASK;
        const generation = (entityId & CompressedEntityPool.GENERATION_MASK) >>> CompressedEntityPool.GENERATION_SHIFT;

        if (index >= this.nextIndex) return false;
        if (this.generations[index] !== generation) return false;

        // 递增世代使ID无效
        let newGeneration = generation + 1;
        if (newGeneration > CompressedEntityPool.MAX_GENERATION) {
            newGeneration = 1;
        }
        this.generations[index] = newGeneration;

        // 检查回收队列是否已满
        if (this.recycleCount >= CompressedEntityPool.RECYCLE_QUEUE_SIZE) {
            this.processRecycleQueue();
            if (this.recycleCount >= CompressedEntityPool.RECYCLE_QUEUE_SIZE) {
                return false;
            }
        }

        // 加入回收队列
        this.recycleQueue[this.recycleTail] = index;
        this.recycleTail = (this.recycleTail + 1) % CompressedEntityPool.RECYCLE_QUEUE_SIZE;
        this.recycleCount++;
        
        this.currentActive--;
        this.totalRecycled++;
        
        return true;
    }
    
    /**
     * 验证实体ID是否有效
     *
     * @param entityId 要验证的实体ID
     * @returns ID是否有效
     */
    public isValid(entityId: number): boolean {
        // 排除无效值
        if (entityId === 0) return false;

        const index = entityId & CompressedEntityPool.INDEX_MASK;

        // 范围检查
        if (index >= this.nextIndex) return false;

        // 世代匹配检查
        const generation = (entityId & CompressedEntityPool.GENERATION_MASK) >>> CompressedEntityPool.GENERATION_SHIFT;
        return this.generations[index] === generation;
    }
    
    /**
     * 批量分配实体ID
     *
     * @param count 要分配的数量
     * @param output 输出数组
     * @returns 实际分配的数量
     */
    public allocateBatch(count: number, output: Uint32Array): number {
        let allocated = 0;
        
        // 批量处理回收队列
        this.processRecycleQueue();
        
        // 尽量从空闲列表分配
        while (allocated < count && this.freeTop > 0) {
            const index = this.freeIndices[--this.freeTop];
            const generation = this.generations[index];
            output[allocated++] = (generation << CompressedEntityPool.GENERATION_SHIFT) | index;
        }
        
        // 从新索引分配剩余部分
        while (allocated < count && this.nextIndex < CompressedEntityPool.MAX_ENTITIES) {
            const index = this.nextIndex++;
            const generation = this.generations[index];
            output[allocated++] = (generation << CompressedEntityPool.GENERATION_SHIFT) | index;
        }
        
        // 更新统计
        this.totalAllocated += allocated;
        this.currentActive += allocated;
        
        return allocated;
    }
    
    /**
     * 批量回收实体ID
     *
     * @param entityIds 要回收的ID数组
     * @param count 数组中有效ID的数量
     * @returns 实际回收的数量
     */
    public recycleBatch(entityIds: Uint32Array, count: number): number {
        let recycled = 0;
        
        for (let i = 0; i < count; i++) {
            if (this.recycle(entityIds[i])) {
                recycled++;
            }
        }
        
        return recycled;
    }
    
    /**
     * 获取池的统计信息
     */
    public getStats(): {
        totalAllocated: number;
        totalRecycled: number;
        currentActive: number;
        currentFree: number;
        pendingRecycle: number;
        capacity: number;
        memoryUsage: number;
        utilization: number;
    } {
        const memoryUsage = 
            this.generations.byteLength +
            this.freeIndices.byteLength +
            this.recycleQueue.byteLength;
            
        return {
            totalAllocated: this.totalAllocated,
            totalRecycled: this.totalRecycled,
            currentActive: this.currentActive,
            currentFree: this.freeTop,
            pendingRecycle: this.recycleCount,
            capacity: CompressedEntityPool.MAX_ENTITIES,
            memoryUsage,
            utilization: this.nextIndex / CompressedEntityPool.MAX_ENTITIES
        };
    }
    
    /**
     * 强制处理所有延迟回收项
     */
    public forceProcessRecycle(): void {
        this.processRecycleQueue(true);
    }
    
    /**
     * 处理回收队列的内部实现
     *
     * @param forceAll 是否处理所有项
     */
    private processRecycleQueue(forceAll: boolean = false): void {
        if (this.recycleCount === 0) return;
        
        const batchSize = forceAll ? this.recycleCount : Math.min(16, this.recycleCount);
        
        for (let i = 0; i < batchSize; i++) {
            const index = this.recycleQueue[this.recycleHead];
            this.recycleHead = (this.recycleHead + 1) % CompressedEntityPool.RECYCLE_QUEUE_SIZE;
            this.recycleCount--;
            
            // 添加到空闲列表
            this.freeIndices[this.freeTop++] = index;
        }
    }
    
    /**
     * 重置池状态
     */
    public reset(): void {
        this.generations.fill(1);
        this.freeTop = 0;
        this.nextIndex = 0;
        this.recycleHead = 0;
        this.recycleTail = 0;
        this.recycleCount = 0;
        this.totalAllocated = 0;
        this.totalRecycled = 0;
        this.currentActive = 0;
    }
    
    /**
     * 检查池是否已满
     */
    public isFull(): boolean {
        return this.nextIndex >= CompressedEntityPool.MAX_ENTITIES && this.freeTop === 0;
    }
    
    /**
     * 获取当前容量利用率
     */
    public getUtilization(): number {
        return this.nextIndex / CompressedEntityPool.MAX_ENTITIES;
    }
}

/**
 * 实体ID工具类
 */
export class EntityIdUtils {
    /**
     * 从实体ID中提取索引部分
     */
    public static getIndex(entityId: number): number {
        return entityId & CompressedEntityPool.INDEX_MASK;
    }
    
    /**
     * 从实体ID中提取世代部分
     */
    public static getGeneration(entityId: number): number {
        return (entityId & CompressedEntityPool.GENERATION_MASK) >>> CompressedEntityPool.GENERATION_SHIFT;
    }
    
    /**
     * 构造实体ID
     */
    public static makeId(index: number, generation: number): number {
        return (generation << CompressedEntityPool.GENERATION_SHIFT) | index;
    }
    
    /**
     * 检查ID是否在有效范围内
     */
    public static isValidFormat(entityId: number): boolean {
        if (entityId === 0) return false;
        
        const index = EntityIdUtils.getIndex(entityId);
        const generation = EntityIdUtils.getGeneration(entityId);
        
        return index < CompressedEntityPool.MAX_ENTITIES && 
               generation > 0 && 
               generation <= CompressedEntityPool.MAX_GENERATION;
    }
} 