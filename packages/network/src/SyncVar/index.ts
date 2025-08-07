/**
 * SyncVar同步变量系统导出
 * 
 * 提供自动变量同步功能，支持网络状态的实时同步
 */

// 装饰器和元数据
export * from './SyncVarDecorator';

// 管理器
export { SyncVarManager } from './SyncVarManager';

// 代理系统
export * from './SyncVarProxy';

// 工厂函数
export * from './SyncVarFactory';

// 消息处理器
export { SyncVarMessageHandler } from './SyncVarMessageHandler';

// 同步调度器
export { 
    SyncVarSyncScheduler, 
    DefaultSyncPriorityCalculator 
} from './SyncVarSyncScheduler';
export type { 
    SyncVarSyncConfig, 
    ISyncPriorityCalculator 
} from './SyncVarSyncScheduler';

// 性能优化器
export { 
    SyncVarOptimizer,
    SyncVarMessageMerger,
    SyncVarRateLimiter,
    SyncVarDistanceCuller
} from './SyncVarOptimizer';
export type { 
    SyncVarOptimizationConfig 
} from './SyncVarOptimizer';