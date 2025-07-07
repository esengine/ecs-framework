/**
 * 可序列化接口
 * 
 * 实现此接口的类可以被快照系统序列化和反序列化
 */
export interface ISnapshotable {
    /**
     * 序列化对象到可传输的数据格式
     * 
     * @returns 序列化后的数据
     */
    serialize(): any;
    
    /**
     * 从序列化数据恢复对象状态
     * 
     * @param data - 序列化数据
     */
    deserialize(data: any): void;
}

/**
 * 快照配置接口
 */
export interface SnapshotConfig {
    /** 是否包含在快照中 */
    includeInSnapshot: boolean;
    /** 压缩级别 (0-9) */
    compressionLevel: number;
    /** 同步优先级 (数字越大优先级越高) */
    syncPriority: number;
    /** 是否启用增量快照 */
    enableIncremental: boolean;
}

/**
 * 组件快照数据
 */
export interface ComponentSnapshot {
    /** 组件类型名称 */
    type: string;
    /** 组件ID */
    id: number;
    /** 序列化数据 */
    data: any;
    /** 是否启用 */
    enabled: boolean;
    /** 快照配置 */
    config?: SnapshotConfig;
}

/**
 * 实体快照数据
 */
export interface EntitySnapshot {
    /** 实体ID */
    id: number;
    /** 实体名称 */
    name: string;
    /** 是否启用 */
    enabled: boolean;
    /** 是否激活 */
    active: boolean;
    /** 标签 */
    tag: number;
    /** 更新顺序 */
    updateOrder: number;
    /** 组件快照列表 */
    components: ComponentSnapshot[];
    /** 子实体ID列表 */
    children: number[];
    /** 父实体ID */
    parent?: number;
    /** 快照时间戳 */
    timestamp: number;
}

/**
 * 场景快照数据
 */
export interface SceneSnapshot {
    /** 实体快照列表 */
    entities: EntitySnapshot[];
    /** 快照时间戳 */
    timestamp: number;
    /** 框架版本 */
    version: string;
    /** 快照类型 */
    type: 'full' | 'incremental';
    /** 基础快照ID（增量快照使用） */
    baseSnapshotId?: string;
} 