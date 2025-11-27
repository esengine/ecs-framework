/**
 * @esengine/behavior-tree Runtime Entry Point
 *
 * This entry point exports only runtime-related code without any editor dependencies.
 * Use this for standalone game runtime builds.
 *
 * 此入口点仅导出运行时相关代码，不包含任何编辑器依赖。
 * 用于独立游戏运行时构建。
 */

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

// Runtime module
export { BehaviorTreeRuntimeModule } from './BehaviorTreeRuntimeModule';
