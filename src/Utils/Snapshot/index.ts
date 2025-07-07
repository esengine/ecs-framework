/**
 * 快照系统模块
 * 
 * 提供ECS系统的快照功能，支持实体和组件的序列化与反序列化
 */

// 核心接口
export * from './ISnapshotable';

// 快照管理器
export { SnapshotManager } from './SnapshotManager';

// 快照扩展
export { 
    ISnapshotExtension, 
    Serializable, 
    SnapshotConfigDecorator,
    SnapshotExtension 
} from './SnapshotExtension'; 