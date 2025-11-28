/**
 * @esengine/behavior-tree
 *
 * AI Behavior Tree System with runtime execution and visual editor support
 * AI 行为树系统，支持运行时执行和可视化编辑
 *
 * @packageDocumentation
 */

// Asset type constant for behavior tree
// 行为树资产类型常量
export const BehaviorTreeAssetType = 'behaviortree' as const;

// Types
export * from './Types/TaskStatus';

// Execution (runtime core)
export * from './execution';

// Utilities
export * from './BehaviorTreeStarter';
export * from './BehaviorTreeBuilder';

// Serialization
export * from './Serialization/NodeTemplates';
export * from './Serialization/BehaviorTreeAsset';
export * from './Serialization/EditorFormatConverter';
export * from './Serialization/BehaviorTreeAssetSerializer';
export * from './Serialization/EditorToBehaviorTreeDataConverter';

// Services
export * from './Services/GlobalBlackboardService';

// Blackboard types (excluding BlackboardValueType which is already exported from TaskStatus)
export type { BlackboardTypeDefinition } from './Blackboard/BlackboardTypes';
export { BlackboardTypes } from './Blackboard/BlackboardTypes';

// Runtime module (no editor dependencies)
export { BehaviorTreeRuntimeModule } from './BehaviorTreeRuntimeModule';

// Plugin (for PluginManager - includes editor dependencies)
export { BehaviorTreePlugin } from './editor/index';
