import { BehaviorTreeData, BehaviorNodeData } from './execution/BehaviorTreeData';
import { NodeType } from './Types/TaskStatus';

/**
 * 行为树构建器
 *
 * 提供流式API构建行为树数据结构
 */
export class BehaviorTreeBuilder {
    private treeData: BehaviorTreeData;
    private nodeStack: string[] = [];
    private nodeIdCounter: number = 0;

    private constructor(treeName: string) {
        this.treeData = {
            id: `tree_${Date.now()}`,
            name: treeName,
            rootNodeId: '',
            nodes: new Map(),
            blackboardVariables: new Map()
        };
    }

    /**
     * 创建构建器
     */
    static create(treeName: string = 'BehaviorTree'): BehaviorTreeBuilder {
        return new BehaviorTreeBuilder(treeName);
    }

    /**
     * 定义黑板变量
     */
    defineBlackboardVariable(key: string, initialValue: any): BehaviorTreeBuilder {
        if (!this.treeData.blackboardVariables) {
            this.treeData.blackboardVariables = new Map();
        }
        this.treeData.blackboardVariables.set(key, initialValue);
        return this;
    }

    /**
     * 添加序列节点
     */
    sequence(name?: string): BehaviorTreeBuilder {
        return this.addCompositeNode('Sequence', name || 'Sequence');
    }

    /**
     * 添加选择器节点
     */
    selector(name?: string): BehaviorTreeBuilder {
        return this.addCompositeNode('Selector', name || 'Selector');
    }

    /**
     * 添加并行节点
     */
    parallel(name?: string, config?: { successPolicy?: string; failurePolicy?: string }): BehaviorTreeBuilder {
        return this.addCompositeNode('Parallel', name || 'Parallel', config);
    }

    /**
     * 添加并行选择器节点
     */
    parallelSelector(name?: string, config?: { failurePolicy?: string }): BehaviorTreeBuilder {
        return this.addCompositeNode('ParallelSelector', name || 'ParallelSelector', config);
    }

    /**
     * 添加随机序列节点
     */
    randomSequence(name?: string): BehaviorTreeBuilder {
        return this.addCompositeNode('RandomSequence', name || 'RandomSequence');
    }

    /**
     * 添加随机选择器节点
     */
    randomSelector(name?: string): BehaviorTreeBuilder {
        return this.addCompositeNode('RandomSelector', name || 'RandomSelector');
    }

    /**
     * 添加反转装饰器
     */
    inverter(name?: string): BehaviorTreeBuilder {
        return this.addDecoratorNode('Inverter', name || 'Inverter');
    }

    /**
     * 添加重复装饰器
     */
    repeater(repeatCount: number, name?: string): BehaviorTreeBuilder {
        return this.addDecoratorNode('Repeater', name || 'Repeater', { repeatCount });
    }

    /**
     * 添加总是成功装饰器
     */
    alwaysSucceed(name?: string): BehaviorTreeBuilder {
        return this.addDecoratorNode('AlwaysSucceed', name || 'AlwaysSucceed');
    }

    /**
     * 添加总是失败装饰器
     */
    alwaysFail(name?: string): BehaviorTreeBuilder {
        return this.addDecoratorNode('AlwaysFail', name || 'AlwaysFail');
    }

    /**
     * 添加直到成功装饰器
     */
    untilSuccess(name?: string): BehaviorTreeBuilder {
        return this.addDecoratorNode('UntilSuccess', name || 'UntilSuccess');
    }

    /**
     * 添加直到失败装饰器
     */
    untilFail(name?: string): BehaviorTreeBuilder {
        return this.addDecoratorNode('UntilFail', name || 'UntilFail');
    }

    /**
     * 添加条件装饰器
     */
    conditional(blackboardKey: string, expectedValue: any, operator?: string, name?: string): BehaviorTreeBuilder {
        return this.addDecoratorNode('Conditional', name || 'Conditional', {
            blackboardKey,
            expectedValue,
            operator: operator || 'equals'
        });
    }

    /**
     * 添加冷却装饰器
     */
    cooldown(cooldownTime: number, name?: string): BehaviorTreeBuilder {
        return this.addDecoratorNode('Cooldown', name || 'Cooldown', { cooldownTime });
    }

    /**
     * 添加超时装饰器
     */
    timeout(timeout: number, name?: string): BehaviorTreeBuilder {
        return this.addDecoratorNode('Timeout', name || 'Timeout', { timeout });
    }

    /**
     * 添加等待动作
     */
    wait(duration: number, name?: string): BehaviorTreeBuilder {
        return this.addActionNode('Wait', name || 'Wait', { duration });
    }

    /**
     * 添加日志动作
     */
    log(message: string, name?: string): BehaviorTreeBuilder {
        return this.addActionNode('Log', name || 'Log', { message });
    }

    /**
     * 添加设置黑板值动作
     */
    setBlackboardValue(key: string, value: any, name?: string): BehaviorTreeBuilder {
        return this.addActionNode('SetBlackboardValue', name || 'SetBlackboardValue', { key, value });
    }

    /**
     * 添加修改黑板值动作
     */
    modifyBlackboardValue(key: string, operation: string, value: number, name?: string): BehaviorTreeBuilder {
        return this.addActionNode('ModifyBlackboardValue', name || 'ModifyBlackboardValue', {
            key,
            operation,
            value
        });
    }

    /**
     * 添加执行动作
     */
    executeAction(actionName: string, name?: string): BehaviorTreeBuilder {
        return this.addActionNode('ExecuteAction', name || 'ExecuteAction', { actionName });
    }

    /**
     * 添加黑板比较条件
     */
    blackboardCompare(key: string, compareValue: any, operator?: string, name?: string): BehaviorTreeBuilder {
        return this.addConditionNode('BlackboardCompare', name || 'BlackboardCompare', {
            key,
            compareValue,
            operator: operator || 'equals'
        });
    }

    /**
     * 添加黑板存在检查条件
     */
    blackboardExists(key: string, name?: string): BehaviorTreeBuilder {
        return this.addConditionNode('BlackboardExists', name || 'BlackboardExists', { key });
    }

    /**
     * 添加随机概率条件
     */
    randomProbability(probability: number, name?: string): BehaviorTreeBuilder {
        return this.addConditionNode('RandomProbability', name || 'RandomProbability', { probability });
    }

    /**
     * 添加执行条件
     */
    executeCondition(conditionName: string, name?: string): BehaviorTreeBuilder {
        return this.addConditionNode('ExecuteCondition', name || 'ExecuteCondition', { conditionName });
    }

    /**
     * 结束当前节点，返回父节点
     */
    end(): BehaviorTreeBuilder {
        if (this.nodeStack.length > 0) {
            this.nodeStack.pop();
        }
        return this;
    }

    /**
     * 构建行为树数据
     */
    build(): BehaviorTreeData {
        if (!this.treeData.rootNodeId) {
            throw new Error('No root node defined. Add at least one node to the tree.');
        }
        return this.treeData;
    }

    private addCompositeNode(implementationType: string, name: string, config: Record<string, any> = {}): BehaviorTreeBuilder {
        const nodeId = this.generateNodeId();
        const node: BehaviorNodeData = {
            id: nodeId,
            name,
            nodeType: NodeType.Composite,
            implementationType,
            children: [],
            config
        };

        this.treeData.nodes.set(nodeId, node);

        if (!this.treeData.rootNodeId) {
            this.treeData.rootNodeId = nodeId;
        }

        if (this.nodeStack.length > 0) {
            const parentId = this.nodeStack[this.nodeStack.length - 1]!;
            const parentNode = this.treeData.nodes.get(parentId);
            if (parentNode && parentNode.children) {
                parentNode.children.push(nodeId);
            }
        }

        this.nodeStack.push(nodeId);
        return this;
    }

    private addDecoratorNode(implementationType: string, name: string, config: Record<string, any> = {}): BehaviorTreeBuilder {
        const nodeId = this.generateNodeId();
        const node: BehaviorNodeData = {
            id: nodeId,
            name,
            nodeType: NodeType.Decorator,
            implementationType,
            children: [],
            config
        };

        this.treeData.nodes.set(nodeId, node);

        if (!this.treeData.rootNodeId) {
            this.treeData.rootNodeId = nodeId;
        }

        if (this.nodeStack.length > 0) {
            const parentId = this.nodeStack[this.nodeStack.length - 1]!;
            const parentNode = this.treeData.nodes.get(parentId);
            if (parentNode && parentNode.children) {
                parentNode.children.push(nodeId);
            }
        }

        this.nodeStack.push(nodeId);
        return this;
    }

    private addActionNode(implementationType: string, name: string, config: Record<string, any> = {}): BehaviorTreeBuilder {
        const nodeId = this.generateNodeId();
        const node: BehaviorNodeData = {
            id: nodeId,
            name,
            nodeType: NodeType.Action,
            implementationType,
            config
        };

        this.treeData.nodes.set(nodeId, node);

        if (!this.treeData.rootNodeId) {
            this.treeData.rootNodeId = nodeId;
        }

        if (this.nodeStack.length > 0) {
            const parentId = this.nodeStack[this.nodeStack.length - 1]!;
            const parentNode = this.treeData.nodes.get(parentId);
            if (parentNode && parentNode.children) {
                parentNode.children.push(nodeId);
            }
        }

        return this;
    }

    private addConditionNode(implementationType: string, name: string, config: Record<string, any> = {}): BehaviorTreeBuilder {
        const nodeId = this.generateNodeId();
        const node: BehaviorNodeData = {
            id: nodeId,
            name,
            nodeType: NodeType.Condition,
            implementationType,
            config
        };

        this.treeData.nodes.set(nodeId, node);

        if (!this.treeData.rootNodeId) {
            this.treeData.rootNodeId = nodeId;
        }

        if (this.nodeStack.length > 0) {
            const parentId = this.nodeStack[this.nodeStack.length - 1]!;
            const parentNode = this.treeData.nodes.get(parentId);
            if (parentNode && parentNode.children) {
                parentNode.children.push(nodeId);
            }
        }

        return this;
    }

    private generateNodeId(): string {
        return `node_${this.nodeIdCounter++}`;
    }
}
