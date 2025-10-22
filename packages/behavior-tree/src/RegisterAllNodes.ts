/**
 * 注册所有内置节点
 *
 * 导入所有节点类以确保装饰器被执行
 */

// Actions
import './Components/Actions/ExecuteAction';
import './Components/Actions/WaitAction';
import './Components/Actions/LogAction';
import './Components/Actions/SetBlackboardValueAction';
import './Components/Actions/ModifyBlackboardValueAction';

// Conditions
import './Components/Conditions/BlackboardCompareCondition';
import './Components/Conditions/BlackboardExistsCondition';
import './Components/Conditions/RandomProbabilityCondition';
import './Components/Conditions/ExecuteCondition';

// Composites
import './Components/Composites/SequenceNode';
import './Components/Composites/SelectorNode';
import './Components/Composites/ParallelNode';
import './Components/Composites/ParallelSelectorNode';
import './Components/Composites/RandomSequenceNode';
import './Components/Composites/RandomSelectorNode';

// Decorators
import './Components/Decorators/InverterNode';
import './Components/Decorators/RepeaterNode';
import './Components/Decorators/UntilSuccessNode';
import './Components/Decorators/UntilFailNode';
import './Components/Decorators/AlwaysSucceedNode';
import './Components/Decorators/AlwaysFailNode';
import './Components/Decorators/ConditionalNode';
import './Components/Decorators/CooldownNode';
import './Components/Decorators/TimeoutNode';

/**
 * 确保所有节点已注册
 */
export function ensureAllNodesRegistered(): void {
    // 这个函数的调用会确保上面的 import 被执行
}
