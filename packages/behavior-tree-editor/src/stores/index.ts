/**
 * Store 导出
 */

// 业务数据 Store（唯一数据源）
export { useBehaviorTreeDataStore, TreeStateAdapter } from '../application/state/BehaviorTreeDataStore';
export type { NodeExecutionStatus } from '../application/state/BehaviorTreeDataStore';

// UI Store
export { useUIStore } from './useUIStore';

// 执行统计 Store
export { useExecutionStatsStore } from './ExecutionStatsStore';
export type { NodeExecutionStats, ExecutionHistoryEntry, ExecutionPath } from './ExecutionStatsStore';

// 常量
export { ROOT_NODE_ID } from '../domain/constants/RootNode';

// 类型
export type { Node as BehaviorTreeNode } from '../domain/models/Node';
export type { Connection } from '../domain/models/Connection';
