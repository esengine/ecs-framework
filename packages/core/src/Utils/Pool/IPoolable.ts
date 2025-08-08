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