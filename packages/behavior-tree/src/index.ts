/**
 * @esengine/behavior-tree
 *
 * 完全ECS化的行为树系统
 *
 * @packageDocumentation
 */

// 类型定义
export * from './Types/TaskStatus';

// 基础组件
export * from './Components/BehaviorTreeNode';
export * from './Components/BlackboardComponent';
export * from './Components/CompositeNodeComponent';
export * from './Components/DecoratorNodeComponent';
export * from './Components/ActiveNode';

// 动作组件
export * from './Components/Actions/WaitAction';
export * from './Components/Actions/LogAction';
export * from './Components/Actions/SetBlackboardValueAction';
export * from './Components/Actions/ModifyBlackboardValueAction';
export * from './Components/Actions/ExecuteAction';

// 条件组件
export * from './Components/Conditions/BlackboardCompareCondition';
export * from './Components/Conditions/BlackboardExistsCondition';
export * from './Components/Conditions/RandomProbabilityCondition';
export * from './Components/Conditions/ExecuteCondition';

// 系统
export * from './Systems/LeafExecutionSystem';
export * from './Systems/DecoratorExecutionSystem';
export * from './Systems/CompositeExecutionSystem';

// 插件
export * from './BehaviorTreePlugin';

// 辅助工具
export * from './BehaviorTreeStarter';
export * from './BehaviorTreeBuilder';

// 序列化（编辑器支持）
export * from './Serialization/BehaviorTreePersistence';
export * from './Serialization/NodeTemplates';
