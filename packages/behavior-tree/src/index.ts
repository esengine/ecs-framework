/**
 * @esengine/behavior-tree
 *
 * 完全ECS化的行为树系统
 *
 * @packageDocumentation
 */

// 注册所有内置节点
import './RegisterAllNodes';

// 类型定义
export * from './Types/TaskStatus';

// 基础组件
export * from './Components/BehaviorTreeNode';
export * from './Components/BlackboardComponent';
export * from './Components/CompositeNodeComponent';
export * from './Components/DecoratorNodeComponent';
export * from './Components/ActiveNode';
export * from './Components/PropertyBindings';

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

// 组合节点
export * from './Components/Composites/RootNode';
export * from './Components/Composites/SequenceNode';
export * from './Components/Composites/SelectorNode';
export * from './Components/Composites/ParallelNode';
export * from './Components/Composites/ParallelSelectorNode';
export * from './Components/Composites/RandomSequenceNode';
export * from './Components/Composites/RandomSelectorNode';

// 装饰器节点
export * from './Components/Decorators/InverterNode';
export * from './Components/Decorators/RepeaterNode';
export * from './Components/Decorators/UntilSuccessNode';
export * from './Components/Decorators/UntilFailNode';
export * from './Components/Decorators/AlwaysSucceedNode';
export * from './Components/Decorators/AlwaysFailNode';
export * from './Components/Decorators/ConditionalNode';
export * from './Components/Decorators/CooldownNode';
export * from './Components/Decorators/TimeoutNode';

// 系统
export * from './Systems/RootExecutionSystem';
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

// 装饰器（扩展支持）
export * from './Decorators/BehaviorNodeDecorator';
