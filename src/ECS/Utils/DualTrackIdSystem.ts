import { CompressedEntityPool, EntityIdUtils } from './CompressedEntityPool';
import { GlobalIdMapper, GlobalId, GlobalIdUtils } from './GlobalIdMapper';

/**
 * 双轨制ID系统
 *
 * 结合压缩实体ID和全局ID的高性能ECS标识符管理系统。
 * 压缩ID用于ECS内部高频操作，全局ID用于跨系统通信和持久化。
 *
 * 设计特点：
 * - 压缩ID：32位设计，支持1048576个实体，适用于ECS核心循环
 * - 全局ID：64位唯一标识，支持网络同步和数据库存储
 * - 双向映射：提供两种ID间的高效转换机制
 * - 批量操作：支持批量分配和转换，优化大规模场景性能
 *
 * 应用场景：
 * - 压缩ID：组件查询、系统更新、物理计算等高频操作
 * - 全局ID：网络同步、数据库存储、跨场景引用、日志记录
 *
 * @example
 * ```typescript
 * const idSystem = new DualTrackIdSystem();
 *
 * // 分配实体ID
 * const entity = idSystem.allocateEntity();
 * const isValid = idSystem.isValidEntity(entity);
 *
 * // 获取全局ID用于网络同步
 * const globalId = idSystem.getGlobalId(entity);
 * const networkMsg = { entityId: GlobalIdUtils.toString(globalId) };
 *
 * // 批量转换
 * const batch = idSystem.convertToGlobalBatch(entities);
 * ```
 */
export class DualTrackIdSystem {
    /**
     * 压缩实体ID池
     */
    private readonly entityPool: CompressedEntityPool;

    /**
     * 全局ID映射器
     */
    private readonly globalMapper: GlobalIdMapper;
    
    /**
     * 系统级统计信息
     */
    private readonly stats = {
        startTime: Date.now(),
        totalEntitiesCreated: 0,
        totalEntitiesDestroyed: 0,
        globalMappingsCreated: 0,
        batchOperationsPerformed: 0
    };
    
    constructor(processId?: number) {
        this.entityPool = new CompressedEntityPool();
        this.globalMapper = new GlobalIdMapper(processId);
    }
    
    // ======================== 实体生命周期管理 ========================
    
    /**
     * 分配新实体ID
     *
     * @returns 32位压缩实体ID，失败时返回0
     */
    public allocateEntity(): number {
        const entityId = this.entityPool.allocate();
        if (entityId !== 0) {
            this.stats.totalEntitiesCreated++;
        }
        return entityId;
    }
    
    /**
     * 回收实体ID
     * 
     * @param entityId 要回收的实体ID
     * @returns 是否成功回收
     */
    public destroyEntity(entityId: number): boolean {
        // 首先移除全局映射（如果存在）
        this.globalMapper.removeMapping(entityId);
        
        // 然后回收压缩ID
        const success = this.entityPool.recycle(entityId);
        if (success) {
            this.stats.totalEntitiesDestroyed++;
        }
        
        return success;
    }
    
    /**
     * 验证实体ID是否有效
     *
     * @param entityId 要验证的实体ID
     * @returns ID是否有效
     */
    public isValidEntity(entityId: number): boolean {
        return this.entityPool.isValid(entityId);
    }
    
    // ======================== 全局ID管理 ========================
    
    /**
     * 获取实体的全局ID
     *
     * @param entityId 压缩实体ID
     * @returns 全局ID，失败时返回空ID
     */
    public getGlobalId(entityId: number): GlobalId {
        if (!this.isValidEntity(entityId)) {
            return GlobalIdUtils.empty();
        }
        
        const globalId = this.globalMapper.getOrCreateGlobalId(entityId);
        return globalId;
    }
    
    /**
     * 通过全局ID查找实体
     * 
     * @param globalId 全局ID
     * @returns 对应的实体ID，未找到时返回0
     */
    public findEntityByGlobalId(globalId: GlobalId): number {
        if (GlobalIdUtils.isEmpty(globalId)) {
            return 0;
        }
        
        return this.globalMapper.findEntityId(globalId.high, globalId.low);
    }
    
    /**
     * 通过全局ID字符串查找实体
     *
     * @param globalIdStr 全局ID字符串表示
     * @returns 对应的实体ID，未找到时返回0
     */
    public findEntityByGlobalIdString(globalIdStr: string): number {
        const globalId = GlobalIdUtils.fromString(globalIdStr);
        if (!globalId) {
            return 0;
        }
        
        return this.findEntityByGlobalId(globalId);
    }
    
    // ======================== 批量操作 ========================
    
    /**
     * 批量分配实体ID
     *
     * @param count 要分配的数量
     * @param output 输出数组
     * @returns 实际分配的数量
     */
    public allocateEntitiesBatch(count: number, output: Uint32Array): number {
        const allocated = this.entityPool.allocateBatch(count, output);
        this.stats.totalEntitiesCreated += allocated;
        this.stats.batchOperationsPerformed++;
        return allocated;
    }
    
    /**
     * 批量回收实体ID
     *
     * @param entityIds 要回收的ID数组
     * @param count 数组中有效ID的数量
     * @returns 实际回收的数量
     */
    public destroyEntitiesBatch(entityIds: Uint32Array, count: number): number {
        // 批量移除全局映射
        for (let i = 0; i < count; i++) {
            this.globalMapper.removeMapping(entityIds[i]);
        }
        
        // 批量回收压缩ID
        const recycled = this.entityPool.recycleBatch(entityIds, count);
        this.stats.totalEntitiesDestroyed += recycled;
        this.stats.batchOperationsPerformed++;
        
        return recycled;
    }
    
    /**
     * 批量转换为全局ID
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
        const converted = this.globalMapper.convertToGlobalBatch(
            entityIds, count, outputHigh, outputLow
        );
        
        this.stats.batchOperationsPerformed++;
        return converted;
    }
    
    /**
     * 批量转换为实体ID
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
        const converted = this.globalMapper.convertToEntityBatch(
            globalIdsHigh, globalIdsLow, count, output
        );
        
        this.stats.batchOperationsPerformed++;
        return converted;
    }
    
    // ======================== 系统管理 ========================
    
    /**
     * 获取系统统计信息
     */
    public getSystemStats(): {
        /** 实体池统计 */
        entityPool: ReturnType<CompressedEntityPool['getStats']>;
        /** 全局映射统计 */
        globalMapper: ReturnType<GlobalIdMapper['getStats']>;
        /** 系统级统计 */
        system: {
            uptime: number;
            totalEntitiesCreated: number;
            totalEntitiesDestroyed: number;
            currentActiveEntities: number;
            globalMappingsCreated: number;
            batchOperationsPerformed: number;
            memoryUsage: number;
            performanceIndex: number;
        };
    } {
        const entityStats = this.entityPool.getStats();
        const mapperStats = this.globalMapper.getStats();
        
        const uptime = Date.now() - this.stats.startTime;
        const totalMemory = entityStats.memoryUsage + mapperStats.memoryUsage;
        
        // 计算性能指数
        const performanceIndex = Math.round(
            (1000 / (mapperStats.avgProbesPerLookup + 1)) * 
            (entityStats.utilization * 100) / 
            (totalMemory / 1024)
        );
        
        return {
            entityPool: entityStats,
            globalMapper: mapperStats,
            system: {
                uptime,
                totalEntitiesCreated: this.stats.totalEntitiesCreated,
                totalEntitiesDestroyed: this.stats.totalEntitiesDestroyed,
                currentActiveEntities: entityStats.currentActive,
                globalMappingsCreated: this.stats.globalMappingsCreated,
                batchOperationsPerformed: this.stats.batchOperationsPerformed,
                memoryUsage: totalMemory,
                performanceIndex
            }
        };
    }
    
    /**
     * 强制处理所有延迟操作
     */
    public forceProcessDelayedOperations(): void {
        this.entityPool.forceProcessRecycle();
    }
    
    /**
     * 清理所有映射关系
     */
    public clearGlobalMappings(): void {
        this.globalMapper.clear();
        this.stats.globalMappingsCreated = 0;
    }
    
    /**
     * 重置整个ID系统
     */
    public reset(): void {
        this.entityPool.reset();
        this.globalMapper.clear();
        
        this.stats.totalEntitiesCreated = 0;
        this.stats.totalEntitiesDestroyed = 0;
        this.stats.globalMappingsCreated = 0;
        this.stats.batchOperationsPerformed = 0;
    }
    
    /**
     * 检查系统健康状况
     */
    public getHealthStatus(): {
        status: 'excellent' | 'good' | 'warning' | 'critical';
        issues: string[];
        recommendations: string[];
    } {
        const stats = this.getSystemStats();
        const issues: string[] = [];
        const recommendations: string[] = [];
        
        // 检查内存使用
        if (stats.system.memoryUsage > 10 * 1024 * 1024) {
            issues.push('高内存使用');
            recommendations.push('考虑清理未使用的全局映射');
        }

        // 检查哈希冲突率
        if (stats.globalMapper.avgProbesPerLookup > 3) {
            issues.push('哈希冲突较多');
            recommendations.push('可能需要增大哈希表大小');
        }

        // 检查实体池利用率
        if (stats.entityPool.utilization > 0.9) {
            issues.push('实体池接近满载');
            recommendations.push('准备扩展到64位ID或优化回收策略');
        }

        // 确定总体状态
        let status: 'excellent' | 'good' | 'warning' | 'critical';
        if (issues.length === 0) {
            status = 'excellent';
        } else if (issues.length <= 1) {
            status = 'good';
        } else if (issues.length <= 2) {
            status = 'warning';
        } else {
            status = 'critical';
        }
        
        return { status, issues, recommendations };
    }
}

/**
 * 实体ID辅助工具类
 */
export class DualTrackIdUtils {
    /**
     * 检查是否为有效的压缩实体ID格式
     */
    public static isValidCompressedId(entityId: number): boolean {
        return EntityIdUtils.isValidFormat(entityId);
    }
    
    /**
     * 检查是否为有效的全局ID格式
     */
    public static isValidGlobalId(globalId: GlobalId): boolean {
        return !GlobalIdUtils.isEmpty(globalId);
    }
    
    /**
     * 从压缩ID中提取索引
     */
    public static getEntityIndex(entityId: number): number {
        return EntityIdUtils.getIndex(entityId);
    }
    
    /**
     * 从压缩ID中提取世代
     */
    public static getEntityGeneration(entityId: number): number {
        return EntityIdUtils.getGeneration(entityId);
    }
    
    /**
     * 格式化实体ID为调试字符串
     */
    public static formatEntityId(entityId: number): string {
        const index = EntityIdUtils.getIndex(entityId);
        const generation = EntityIdUtils.getGeneration(entityId);
        return `EntityID(idx=${index}, gen=${generation})`;
    }
    
    /**
     * 格式化全局ID为调试字符串
     */
    public static formatGlobalId(globalId: GlobalId): string {
        return `GlobalID(${GlobalIdUtils.toString(globalId)})`;
    }
    
    /**
     * 比较两个全局ID
     */
    public static compareGlobalIds(a: GlobalId, b: GlobalId): boolean {
        return GlobalIdUtils.equals(a, b);
    }
}

// 导出核心组件以便单独使用
export { CompressedEntityPool, EntityIdUtils } from './CompressedEntityPool';
export { GlobalIdMapper, GlobalId, GlobalIdUtils } from './GlobalIdMapper'; 