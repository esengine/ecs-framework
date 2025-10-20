import { Entity, IScene } from '@esengine/ecs-framework';
import { BehaviorTreeNode } from './Components/BehaviorTreeNode';
import { CompositeNodeComponent } from './Components/CompositeNodeComponent';
import { DecoratorNodeComponent } from './Components/DecoratorNodeComponent';
import { BlackboardComponent } from './Components/BlackboardComponent';
import { NodeType, CompositeType, DecoratorType, BlackboardValueType } from './Types/TaskStatus';

// 导入动作组件
import { WaitAction } from './Components/Actions/WaitAction';
import { LogAction } from './Components/Actions/LogAction';
import { SetBlackboardValueAction } from './Components/Actions/SetBlackboardValueAction';
import { ModifyBlackboardValueAction, ModifyOperation } from './Components/Actions/ModifyBlackboardValueAction';
import { ExecuteAction, CustomActionFunction } from './Components/Actions/ExecuteAction';

// 导入条件组件
import { BlackboardCompareCondition, CompareOperator } from './Components/Conditions/BlackboardCompareCondition';
import { BlackboardExistsCondition } from './Components/Conditions/BlackboardExistsCondition';
import { RandomProbabilityCondition } from './Components/Conditions/RandomProbabilityCondition';
import { ExecuteCondition, CustomConditionFunction } from './Components/Conditions/ExecuteCondition';

/**
 * 行为树构建器
 *
 * 提供流式 API 来构建行为树结构
 *
 * @example
 * ```typescript
 * const aiRoot = BehaviorTreeBuilder.create(scene, 'AI')
 *     .blackboard()
 *         .defineVariable('health', BlackboardValueType.Number, 100)
 *         .defineVariable('target', BlackboardValueType.Object, null)
 *     .endBlackboard()
 *     .selector('MainSelector')
 *         .sequence('AttackSequence')
 *             .condition((entity, blackboard) => {
 *                 return blackboard?.getValue('health') > 50;
 *             })
 *             .action('Attack', (entity) => TaskStatus.Success)
 *         .end()
 *         .action('Flee', (entity) => TaskStatus.Success)
 *     .end()
 *     .build();
 * ```
 */
export class BehaviorTreeBuilder {
    private scene: IScene;
    private currentEntity: Entity;
    private entityStack: Entity[] = [];
    private blackboardEntity?: Entity;

    private constructor(scene: IScene, rootName: string) {
        this.scene = scene;
        this.currentEntity = scene.createEntity(rootName);
    }

    /**
     * 创建行为树构建器
     *
     * @param scene 场景实例
     * @param rootName 根节点名称
     * @returns 构建器实例
     */
    static create(scene: IScene, rootName: string = 'BehaviorTreeRoot'): BehaviorTreeBuilder {
        return new BehaviorTreeBuilder(scene, rootName);
    }

    /**
     * 添加黑板组件到根节点
     */
    blackboard(): BehaviorTreeBuilder {
        this.blackboardEntity = this.currentEntity;
        this.currentEntity.addComponent(new BlackboardComponent());
        return this;
    }

    /**
     * 定义黑板变量
     */
    defineVariable(
        name: string,
        type: BlackboardValueType,
        initialValue: any,
        options?: { readonly?: boolean; description?: string }
    ): BehaviorTreeBuilder {
        if (!this.blackboardEntity) {
            throw new Error('Must call blackboard() first');
        }

        const blackboard = this.blackboardEntity.getComponent(BlackboardComponent);
        if (blackboard) {
            blackboard.defineVariable(name, type, initialValue, options);
        }

        return this;
    }

    /**
     * 结束黑板定义
     */
    endBlackboard(): BehaviorTreeBuilder {
        this.blackboardEntity = undefined;
        return this;
    }

    /**
     * 创建序列节点
     */
    sequence(name: string = 'Sequence'): BehaviorTreeBuilder {
        return this.composite(name, CompositeType.Sequence);
    }

    /**
     * 创建选择器节点
     */
    selector(name: string = 'Selector'): BehaviorTreeBuilder {
        return this.composite(name, CompositeType.Selector);
    }

    /**
     * 创建并行节点
     */
    parallel(name: string = 'Parallel'): BehaviorTreeBuilder {
        return this.composite(name, CompositeType.Parallel);
    }

    /**
     * 创建并行选择器节点
     */
    parallelSelector(name: string = 'ParallelSelector'): BehaviorTreeBuilder {
        return this.composite(name, CompositeType.ParallelSelector);
    }

    /**
     * 创建随机序列节点
     */
    randomSequence(name: string = 'RandomSequence'): BehaviorTreeBuilder {
        return this.composite(name, CompositeType.RandomSequence);
    }

    /**
     * 创建随机选择器节点
     */
    randomSelector(name: string = 'RandomSelector'): BehaviorTreeBuilder {
        return this.composite(name, CompositeType.RandomSelector);
    }

    /**
     * 创建复合节点
     */
    private composite(name: string, type: CompositeType): BehaviorTreeBuilder {
        this.entityStack.push(this.currentEntity);

        const entity = this.scene.createEntity(name);
        this.currentEntity.addChild(entity);

        const node = entity.addComponent(new BehaviorTreeNode());
        node.nodeType = NodeType.Composite;
        node.nodeName = name;

        const composite = entity.addComponent(new CompositeNodeComponent());
        composite.compositeType = type;

        this.currentEntity = entity;
        return this;
    }

    /**
     * 创建反转装饰器
     */
    inverter(name: string = 'Inverter'): BehaviorTreeBuilder {
        return this.decorator(name, DecoratorType.Inverter);
    }

    /**
     * 创建重复装饰器
     */
    repeater(name: string = 'Repeater', count: number = -1, endOnFailure: boolean = false): BehaviorTreeBuilder {
        this.decorator(name, DecoratorType.Repeater);

        const decorator = this.currentEntity.getComponent(DecoratorNodeComponent);
        if (decorator) {
            decorator.repeatCount = count;
            decorator.endOnFailure = endOnFailure;
        }

        return this;
    }

    /**
     * 创建直到成功装饰器
     */
    untilSuccess(name: string = 'UntilSuccess'): BehaviorTreeBuilder {
        return this.decorator(name, DecoratorType.UntilSuccess);
    }

    /**
     * 创建直到失败装饰器
     */
    untilFail(name: string = 'UntilFail'): BehaviorTreeBuilder {
        return this.decorator(name, DecoratorType.UntilFail);
    }

    /**
     * 创建总是成功装饰器
     */
    alwaysSucceed(name: string = 'AlwaysSucceed'): BehaviorTreeBuilder {
        return this.decorator(name, DecoratorType.AlwaysSucceed);
    }

    /**
     * 创建总是失败装饰器
     */
    alwaysFail(name: string = 'AlwaysFail'): BehaviorTreeBuilder {
        return this.decorator(name, DecoratorType.AlwaysFail);
    }

    /**
     * 创建条件装饰器
     */
    conditional(name: string, conditionCode: string): BehaviorTreeBuilder {
        this.decorator(name, DecoratorType.Conditional);

        const decorator = this.currentEntity.getComponent(DecoratorNodeComponent);
        if (decorator) {
            decorator.conditionCode = conditionCode;
        }

        return this;
    }

    /**
     * 创建冷却装饰器
     */
    cooldown(name: string = 'Cooldown', cooldownTime: number = 1.0): BehaviorTreeBuilder {
        this.decorator(name, DecoratorType.Cooldown);

        const decorator = this.currentEntity.getComponent(DecoratorNodeComponent);
        if (decorator) {
            decorator.cooldownTime = cooldownTime;
        }

        return this;
    }

    /**
     * 创建超时装饰器
     */
    timeout(name: string = 'Timeout', timeoutDuration: number = 5.0): BehaviorTreeBuilder {
        this.decorator(name, DecoratorType.Timeout);

        const decorator = this.currentEntity.getComponent(DecoratorNodeComponent);
        if (decorator) {
            decorator.timeoutDuration = timeoutDuration;
        }

        return this;
    }

    /**
     * 创建装饰器节点
     */
    private decorator(name: string, type: DecoratorType): BehaviorTreeBuilder {
        this.entityStack.push(this.currentEntity);

        const entity = this.scene.createEntity(name);
        this.currentEntity.addChild(entity);

        const node = entity.addComponent(new BehaviorTreeNode());
        node.nodeType = NodeType.Decorator;
        node.nodeName = name;

        const decorator = entity.addComponent(new DecoratorNodeComponent());
        decorator.decoratorType = type;

        this.currentEntity = entity;
        return this;
    }

    /**
     * 创建等待动作
     */
    wait(waitTime: number, name: string = 'Wait'): BehaviorTreeBuilder {
        const entity = this.scene.createEntity(name);
        this.currentEntity.addChild(entity);

        const node = entity.addComponent(new BehaviorTreeNode());
        node.nodeType = NodeType.Action;
        node.nodeName = name;

        const action = entity.addComponent(new WaitAction());
        action.waitTime = waitTime;

        return this;
    }

    /**
     * 创建日志动作
     */
    log(message: string, level: 'log' | 'info' | 'warn' | 'error' = 'log', name: string = 'Log'): BehaviorTreeBuilder {
        const entity = this.scene.createEntity(name);
        this.currentEntity.addChild(entity);

        const node = entity.addComponent(new BehaviorTreeNode());
        node.nodeType = NodeType.Action;
        node.nodeName = name;

        const action = entity.addComponent(new LogAction());
        action.message = message;
        action.level = level;

        return this;
    }

    /**
     * 创建设置黑板值动作
     */
    setBlackboardValue(variableName: string, value: any, name: string = 'SetValue'): BehaviorTreeBuilder {
        const entity = this.scene.createEntity(name);
        this.currentEntity.addChild(entity);

        const node = entity.addComponent(new BehaviorTreeNode());
        node.nodeType = NodeType.Action;
        node.nodeName = name;

        const action = entity.addComponent(new SetBlackboardValueAction());
        action.variableName = variableName;
        action.value = value;

        return this;
    }

    /**
     * 创建修改黑板值动作
     */
    modifyBlackboardValue(
        variableName: string,
        operation: ModifyOperation,
        operand: any,
        name: string = 'ModifyValue'
    ): BehaviorTreeBuilder {
        const entity = this.scene.createEntity(name);
        this.currentEntity.addChild(entity);

        const node = entity.addComponent(new BehaviorTreeNode());
        node.nodeType = NodeType.Action;
        node.nodeName = name;

        const action = entity.addComponent(new ModifyBlackboardValueAction());
        action.variableName = variableName;
        action.operation = operation;
        action.operand = operand;

        return this;
    }

    /**
     * 创建自定义动作
     */
    action(name: string, func: CustomActionFunction): BehaviorTreeBuilder {
        const entity = this.scene.createEntity(name);
        this.currentEntity.addChild(entity);

        const node = entity.addComponent(new BehaviorTreeNode());
        node.nodeType = NodeType.Action;
        node.nodeName = name;

        const action = entity.addComponent(new ExecuteAction());
        action.setFunction(func);

        return this;
    }

    /**
     * 创建黑板比较条件
     */
    compareBlackboardValue(
        variableName: string,
        operator: CompareOperator,
        compareValue: any,
        name: string = 'Compare'
    ): BehaviorTreeBuilder {
        const entity = this.scene.createEntity(name);
        this.currentEntity.addChild(entity);

        const node = entity.addComponent(new BehaviorTreeNode());
        node.nodeType = NodeType.Condition;
        node.nodeName = name;

        const condition = entity.addComponent(new BlackboardCompareCondition());
        condition.variableName = variableName;
        condition.operator = operator;
        condition.compareValue = compareValue;

        return this;
    }

    /**
     * 创建黑板变量存在条件
     */
    checkBlackboardExists(variableName: string, checkNotNull: boolean = false, name: string = 'Exists'): BehaviorTreeBuilder {
        const entity = this.scene.createEntity(name);
        this.currentEntity.addChild(entity);

        const node = entity.addComponent(new BehaviorTreeNode());
        node.nodeType = NodeType.Condition;
        node.nodeName = name;

        const condition = entity.addComponent(new BlackboardExistsCondition());
        condition.variableName = variableName;
        condition.checkNotNull = checkNotNull;

        return this;
    }

    /**
     * 创建随机概率条件
     */
    randomProbability(probability: number, name: string = 'Random'): BehaviorTreeBuilder {
        const entity = this.scene.createEntity(name);
        this.currentEntity.addChild(entity);

        const node = entity.addComponent(new BehaviorTreeNode());
        node.nodeType = NodeType.Condition;
        node.nodeName = name;

        const condition = entity.addComponent(new RandomProbabilityCondition());
        condition.probability = probability;

        return this;
    }

    /**
     * 创建自定义条件
     */
    condition(func: CustomConditionFunction, name: string = 'Condition'): BehaviorTreeBuilder {
        const entity = this.scene.createEntity(name);
        this.currentEntity.addChild(entity);

        const node = entity.addComponent(new BehaviorTreeNode());
        node.nodeType = NodeType.Condition;
        node.nodeName = name;

        const condition = entity.addComponent(new ExecuteCondition());
        condition.setFunction(func);

        return this;
    }

    /**
     * 结束当前节点，返回父节点
     */
    end(): BehaviorTreeBuilder {
        if (this.entityStack.length === 0) {
            throw new Error('No parent node to return to');
        }

        this.currentEntity = this.entityStack.pop()!;
        return this;
    }

    /**
     * 构建并返回根节点实体
     */
    build(): Entity {
        // 确保返回到根节点
        while (this.entityStack.length > 0) {
            this.currentEntity = this.entityStack.pop()!;
        }

        return this.currentEntity;
    }
}
