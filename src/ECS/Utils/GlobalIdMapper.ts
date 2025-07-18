/**
 * 全局ID映射器
 *
 * 连接压缩EntityID与全局ID的双向映射系统。
 * 提供高效的ID转换和查找功能，支持网络同步和持久化场景。
 *
 * 技术特点：
 * - 拆分64位全局ID为2个Uint32避免bigint性能开销
 * - 使用线性探测哈希表实现高效查找
 * - 支持批量转换操作优化网络同步性能
 *
 * 内存布局：
 * ```
 * EntityID -> GlobalID (2x Uint32Array)
 * eid2gidHigh[index] = GlobalID高32位
 * eid2gidLow[index]  = GlobalID低32位
 *
 * GlobalID -> EntityID (线性探测哈希表)
 * gid2eid[hash_slot] = EntityID
 * ```
 *
 * @example
 * ```typescript
 * const mapper = new GlobalIdMapper();
 *
 * // 为实体ID生成全局ID
 * const globalId = mapper.getOrCreateGlobalId(0x1234);
 *
 * // 通过全局ID查找实体
 * const entityId = mapper.findEntityId(globalId.high, globalId.low);
 *
 * // 批量转换
 * const converted = mapper.convertBatch(entityIds);
 * ```
 */
export class GlobalIdMapper {
    /**
     * EntityID到GlobalID的映射
     */
    private readonly eid2gidHigh: Uint32Array;
    private readonly eid2gidLow: Uint32Array;

    /**
     * GlobalID到EntityID的反向映射
     */
    private readonly gid2eid: Uint32Array;
    private readonly gidHashMask: number;
    
    /**
     * ID分配器状态
     */
    private nextIdLow: number = 1;
    private readonly processId: number;

    /**
     * 常量定义
     */
    public static readonly MAX_ENTITIES = 1048576; // 2^20
    public static readonly INDEX_MASK = 0x0FFFFF; // 20位索引掩码
    public static readonly HASH_TABLE_SIZE = 1 << 18;
    public static readonly HASH_MASK = (1 << 18) - 1;
    public static readonly EMPTY_SLOT = 0;
    
    /**
     * 统计信息
     */
    private mappingsCreated: number = 0;
    private hashCollisions: number = 0;
    private lookupCount: number = 0;
    private totalProbes: number = 0;
    
    constructor(processId?: number) {
        // 预分配所有TypedArray
        this.eid2gidHigh = new Uint32Array(GlobalIdMapper.MAX_ENTITIES);
        this.eid2gidLow = new Uint32Array(GlobalIdMapper.MAX_ENTITIES);
        this.gid2eid = new Uint32Array(GlobalIdMapper.HASH_TABLE_SIZE);
        this.gidHashMask = GlobalIdMapper.HASH_MASK;

        // 生成进程ID
        this.processId = processId ?? this.generateProcessId();

        // 初始化哈希表
        this.gid2eid.fill(GlobalIdMapper.EMPTY_SLOT);
    }
    
    /**
     * 获取或创建实体的全局ID
     *
     * @param entityId 32位压缩实体ID
     * @returns 64位全局ID的分离表示
     */
    public getOrCreateGlobalId(entityId: number): { high: number; low: number } {
        const index = entityId & GlobalIdMapper.INDEX_MASK;
        
        // 检查是否已存在映射
        const existingHigh = this.eid2gidHigh[index];
        const existingLow = this.eid2gidLow[index];
        
        if (existingHigh !== 0 || existingLow !== 0) {
            return { high: existingHigh, low: existingLow };
        }
        
        // 生成新的全局ID
        const globalId = this.generateGlobalId();

        // 建立双向映射
        this.eid2gidHigh[index] = globalId.high;
        this.eid2gidLow[index] = globalId.low;

        // 插入哈希表
        this.insertToHashTable(globalId.high, globalId.low, entityId);
        
        this.mappingsCreated++;
        return globalId;
    }
    
    /**
     * 通过全局ID查找对应的实体ID
     *
     * @param high 全局ID高32位
     * @param low 全局ID低32位
     * @returns 对应的实体ID，未找到时返回0
     */
    public findEntityId(high: number, low: number): number {
        this.lookupCount++;
        
        // 计算哈希值
        let slot = this.hashGlobalId(high, low);
        let probes = 0;
        
        // 线性探测查找
        while (this.gid2eid[slot] !== GlobalIdMapper.EMPTY_SLOT) {
            const candidateEntityId = this.gid2eid[slot];
            const candidateIndex = candidateEntityId & GlobalIdMapper.INDEX_MASK;
            
            // 检查全局ID是否匹配
            if (this.eid2gidHigh[candidateIndex] === high && 
                this.eid2gidLow[candidateIndex] === low) {
                this.totalProbes += probes;
                return candidateEntityId;
            }
            
            // 继续探测
            slot = (slot + 1) & this.gidHashMask;
            probes++;
            
            // 防止无限循环
            if (probes > GlobalIdMapper.HASH_TABLE_SIZE) {
                this.totalProbes += probes;
                return 0;
            }
        }
        
        this.totalProbes += probes;
        return 0; // 未找到
    }
    
    /**
     * 移除实体的全局ID映射
     * 
     * @param entityId 要移除的实体ID
     * @returns 是否成功移除
     */
    public removeMapping(entityId: number): boolean {
        const index = entityId & GlobalIdMapper.INDEX_MASK;
        
        const high = this.eid2gidHigh[index];
        const low = this.eid2gidLow[index];
        
        if (high === 0 && low === 0) {
            return false;
        }

        // 清除正向映射
        this.eid2gidHigh[index] = 0;
        this.eid2gidLow[index] = 0;

        // 从哈希表中移除
        this.removeFromHashTable(high, low);
        
        return true;
    }
    
    /**
     * 批量转换实体ID到全局ID
     *
     * @param entityIds 实体ID数组
     * @param count 有效ID数量
     * @param outputHigh 输出高位数组
     * @param outputLow 输出低位数组
     * @returns 成功转换的数量
     */
    public convertToGlobalBatch(
        entityIds: Uint32Array,
        count: number,
        outputHigh: Uint32Array,
        outputLow: Uint32Array
    ): number {
        let converted = 0;
        
        for (let i = 0; i < count; i++) {
            const globalId = this.getOrCreateGlobalId(entityIds[i]);
            outputHigh[converted] = globalId.high;
            outputLow[converted] = globalId.low;
            converted++;
        }
        
        return converted;
    }
    
    /**
     * 批量转换全局ID到实体ID
     * 
     * @param globalIdsHigh 全局ID高位数组
     * @param globalIdsLow 全局ID低位数组
     * @param count 输入数量
     * @param output 输出实体ID数组
     * @returns 成功转换的数量
     */
    public convertToEntityBatch(
        globalIdsHigh: Uint32Array,
        globalIdsLow: Uint32Array,
        count: number,
        output: Uint32Array
    ): number {
        let converted = 0;
        
        for (let i = 0; i < count; i++) {
            const entityId = this.findEntityId(globalIdsHigh[i], globalIdsLow[i]);
            if (entityId !== 0) {
                output[converted++] = entityId;
            }
        }
        
        return converted;
    }
    
    /**
     * 获取映射器统计信息
     */
    public getStats(): {
        mappingsCreated: number;
        hashCollisions: number;
        lookupCount: number;
        avgProbesPerLookup: number;
        memoryUsage: number;
        loadFactor: number;
        processId: number;
    } {
        const memoryUsage = 
            this.eid2gidHigh.byteLength +
            this.eid2gidLow.byteLength +
            this.gid2eid.byteLength;
            
        const avgProbes = this.lookupCount > 0 ? this.totalProbes / this.lookupCount : 0;
        const loadFactor = this.mappingsCreated / GlobalIdMapper.HASH_TABLE_SIZE;
        
        return {
            mappingsCreated: this.mappingsCreated,
            hashCollisions: this.hashCollisions,
            lookupCount: this.lookupCount,
            avgProbesPerLookup: Math.round(avgProbes * 100) / 100,
            memoryUsage,
            loadFactor: Math.round(loadFactor * 1000) / 1000,
            processId: this.processId
        };
    }
    
    /**
     * 清理所有映射
     */
    public clear(): void {
        this.eid2gidHigh.fill(0);
        this.eid2gidLow.fill(0);
        this.gid2eid.fill(GlobalIdMapper.EMPTY_SLOT);
        
        this.mappingsCreated = 0;
        this.hashCollisions = 0;
        this.lookupCount = 0;
        this.totalProbes = 0;
        this.nextIdLow = 1;
    }
    
    /**
     * 生成全局ID
     */
    private generateGlobalId(): { high: number; low: number } {
        const low = this.nextIdLow++;

        // 处理计数器溢出
        if (this.nextIdLow > 0xFFFFFFFF) {
            this.nextIdLow = 1;
        }
        
        return {
            high: this.processId,
            low: low
        };
    }
    
    /**
     * 计算全局ID的哈希值
     */
    private hashGlobalId(high: number, low: number): number {
        // 哈希混合算法
        let hash = high ^ low;
        hash ^= hash >>> 16;
        hash *= 0x85ebca6b;
        hash ^= hash >>> 13;
        hash *= 0xc2b2ae35;
        hash ^= hash >>> 16;
        
        return hash & this.gidHashMask;
    }
    
    /**
     * 向哈希表插入映射
     */
    private insertToHashTable(high: number, low: number, entityId: number): void {
        let slot = this.hashGlobalId(high, low);
        let collisions = 0;
        
        // 线性探测找空槽位
        while (this.gid2eid[slot] !== GlobalIdMapper.EMPTY_SLOT) {
            slot = (slot + 1) & this.gidHashMask;
            collisions++;
        }
        
        this.gid2eid[slot] = entityId;
        
        if (collisions > 0) {
            this.hashCollisions++;
        }
    }
    
    /**
     * 从哈希表移除映射
     */
    private removeFromHashTable(high: number, low: number): void {
        let slot = this.hashGlobalId(high, low);
        
        // 找到要删除的槽位
        while (this.gid2eid[slot] !== GlobalIdMapper.EMPTY_SLOT) {
            const candidateEntityId = this.gid2eid[slot];
            const candidateIndex = candidateEntityId & GlobalIdMapper.INDEX_MASK;
            
            if (this.eid2gidHigh[candidateIndex] === high && 
                this.eid2gidLow[candidateIndex] === low) {
                
                // 标记为已删除
                this.gid2eid[slot] = GlobalIdMapper.EMPTY_SLOT;

                // 重新整理后续元素
                this.rehashAfterDeletion(slot);
                return;
            }
            
            slot = (slot + 1) & this.gidHashMask;
        }
    }
    
    /**
     * 删除后重新哈希优化
     */
    private rehashAfterDeletion(deletedSlot: number): void {
        let slot = (deletedSlot + 1) & this.gidHashMask;
        
        // 向前移动元素
        while (this.gid2eid[slot] !== GlobalIdMapper.EMPTY_SLOT) {
            const entityId = this.gid2eid[slot];
            const index = entityId & GlobalIdMapper.INDEX_MASK;
            const high = this.eid2gidHigh[index];
            const low = this.eid2gidLow[index];
            
            const idealSlot = this.hashGlobalId(high, low);
            
            // 检查是否可以移动到更靠前的位置
            if (this.shouldMoveElement(idealSlot, deletedSlot, slot)) {
                this.gid2eid[deletedSlot] = entityId;
                this.gid2eid[slot] = GlobalIdMapper.EMPTY_SLOT;
                deletedSlot = slot;
            }
            
            slot = (slot + 1) & this.gidHashMask;
        }
    }
    
    /**
     * 判断是否应该移动元素
     */
    private shouldMoveElement(idealSlot: number, deletedSlot: number, currentSlot: number): boolean {
        // 移动判断逻辑
        const d1 = (deletedSlot - idealSlot + GlobalIdMapper.HASH_TABLE_SIZE) & this.gidHashMask;
        const d2 = (currentSlot - idealSlot + GlobalIdMapper.HASH_TABLE_SIZE) & this.gidHashMask;
        return d1 < d2;
    }
    
    /**
     * 生成进程ID
     */
    private generateProcessId(): number {
        // 结合时间戳和随机数生成唯一进程ID
        const timestamp = Date.now() & 0xFFFF;
        const random = Math.floor(Math.random() * 0xFFFF);
        const processId = (timestamp << 16) | random;

        // 确保进程ID为正数
        return processId >>> 0;
    }
}

/**
 * 全局ID类型定义
 */
export interface GlobalId {
    high: number;
    low: number;
}

/**
 * 全局ID工具类
 */
export class GlobalIdUtils {
    /**
     * 将全局ID转换为字符串表示
     */
    public static toString(globalId: GlobalId): string {
        // 转换为无符号数
        const highUnsigned = (globalId.high >>> 0).toString(16).padStart(8, '0');
        const lowUnsigned = (globalId.low >>> 0).toString(16).padStart(8, '0');
        return `${highUnsigned}-${lowUnsigned}`;
    }
    
    /**
     * 从字符串解析全局ID
     */
    public static fromString(str: string): GlobalId | null {
        const parts = str.split('-');
        if (parts.length !== 2) return null;
        
        const high = parseInt(parts[0], 16);
        const low = parseInt(parts[1], 16);
        
        if (isNaN(high) || isNaN(low)) return null;
        
        return { high, low };
    }
    
    /**
     * 比较两个全局ID是否相等
     */
    public static equals(a: GlobalId, b: GlobalId): boolean {
        return a.high === b.high && a.low === b.low;
    }
    
    /**
     * 生成空的全局ID
     */
    public static empty(): GlobalId {
        return { high: 0, low: 0 };
    }
    
    /**
     * 检查全局ID是否为空
     */
    public static isEmpty(globalId: GlobalId): boolean {
        return globalId.high === 0 && globalId.low === 0;
    }
} 