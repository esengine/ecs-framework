import { Entity, IScene, createLogger } from '@esengine/ecs-framework';
import type { BehaviorTreeAsset, BehaviorTreeNodeData, BlackboardVariableDefinition, PropertyBinding } from './BehaviorTreeAsset';
import { BehaviorTreeNode } from '../Components/BehaviorTreeNode';
import { BlackboardComponent } from '../Components/BlackboardComponent';
import { PropertyBindings } from '../Components/PropertyBindings';
import { NodeType } from '../Types/TaskStatus';

// 导入所有节点组件
import { RootNode } from '../Components/Composites/RootNode';
import { SequenceNode } from '../Components/Composites/SequenceNode';
import { SelectorNode } from '../Components/Composites/SelectorNode';
import { ParallelNode } from '../Components/Composites/ParallelNode';
import { ParallelSelectorNode } from '../Components/Composites/ParallelSelectorNode';
import { RandomSequenceNode } from '../Components/Composites/RandomSequenceNode';
import { RandomSelectorNode } from '../Components/Composites/RandomSelectorNode';

import { InverterNode } from '../Components/Decorators/InverterNode';
import { RepeaterNode } from '../Components/Decorators/RepeaterNode';
import { UntilSuccessNode } from '../Components/Decorators/UntilSuccessNode';
import { UntilFailNode } from '../Components/Decorators/UntilFailNode';
import { AlwaysSucceedNode } from '../Components/Decorators/AlwaysSucceedNode';
import { AlwaysFailNode } from '../Components/Decorators/AlwaysFailNode';
import { ConditionalNode } from '../Components/Decorators/ConditionalNode';
import { CooldownNode } from '../Components/Decorators/CooldownNode';
import { TimeoutNode } from '../Components/Decorators/TimeoutNode';

import { WaitAction } from '../Components/Actions/WaitAction';
import { LogAction } from '../Components/Actions/LogAction';
import { SetBlackboardValueAction } from '../Components/Actions/SetBlackboardValueAction';
import { ModifyBlackboardValueAction } from '../Components/Actions/ModifyBlackboardValueAction';
import { ExecuteAction } from '../Components/Actions/ExecuteAction';

import { BlackboardCompareCondition, CompareOperator } from '../Components/Conditions/BlackboardCompareCondition';
import { BlackboardExistsCondition } from '../Components/Conditions/BlackboardExistsCondition';
import { RandomProbabilityCondition } from '../Components/Conditions/RandomProbabilityCondition';
import { ExecuteCondition } from '../Components/Conditions/ExecuteCondition';
import { AbortType } from '../Types/TaskStatus';

const logger = createLogger('BehaviorTreeAssetLoader');

/**
 * 实例化选项
 */
export interface InstantiateOptions {
    /**
     * 实体名称前缀
     */
    namePrefix?: string;

    /**
     * 是否共享黑板（如果为true，将使用全局黑板服务）
     */
    sharedBlackboard?: boolean;

    /**
     * 黑板变量覆盖（用于运行时动态设置初始值）
     */
    blackboardOverrides?: Record<string, any>;
}

/**
 * 行为树资产加载器
 *
 * 将BehaviorTreeAsset实例化为可运行的Entity树
 */
export class BehaviorTreeAssetLoader {
    /**
     * 从资产实例化行为树
     *
     * @param asset 行为树资产
     * @param scene 目标场景
     * @param options 实例化选项
     * @returns 根实体
     *
     * @example
     * ```typescript
     * const asset = await loadAssetFromFile('enemy-ai.btree.bin');
     * const aiRoot = BehaviorTreeAssetLoader.instantiate(asset, scene);
     * BehaviorTreeStarter.start(aiRoot);
     * ```
     */
    static instantiate(
        asset: BehaviorTreeAsset,
        scene: IScene,
        options: InstantiateOptions = {}
    ): Entity {
        logger.info(`开始实例化行为树: ${asset.metadata.name}`);

        // 创建节点映射
        const nodeMap = new Map<string, BehaviorTreeNodeData>();
        for (const node of asset.nodes) {
            nodeMap.set(node.id, node);
        }

        // 查找根节点
        const rootNodeData = nodeMap.get(asset.rootNodeId);
        if (!rootNodeData) {
            throw new Error(`未找到根节点: ${asset.rootNodeId}`);
        }

        // 创建实体映射
        const entityMap = new Map<string, Entity>();

        // 递归创建实体树
        const rootEntity = this.createEntityTree(
            rootNodeData,
            nodeMap,
            entityMap,
            scene,
            options.namePrefix
        );

        // 添加黑板
        this.setupBlackboard(rootEntity, asset.blackboard, options.blackboardOverrides);

        // 设置属性绑定
        if (asset.propertyBindings && asset.propertyBindings.length > 0) {
            this.setupPropertyBindings(asset.propertyBindings, entityMap);
        }

        logger.info(`行为树实例化完成: ${asset.nodes.length} 个节点`);

        return rootEntity;
    }

    /**
     * 递归创建实体树
     */
    private static createEntityTree(
        nodeData: BehaviorTreeNodeData,
        nodeMap: Map<string, BehaviorTreeNodeData>,
        entityMap: Map<string, Entity>,
        scene: IScene,
        namePrefix?: string
    ): Entity {
        const entityName = namePrefix ? `${namePrefix}_${nodeData.name}` : nodeData.name;
        const entity = scene.createEntity(entityName);

        // 记录实体
        entityMap.set(nodeData.id, entity);

        // 添加BehaviorTreeNode组件
        const btNode = entity.addComponent(new BehaviorTreeNode());
        btNode.nodeType = nodeData.nodeType;
        btNode.nodeName = nodeData.name;

        // 添加节点特定组件
        this.addNodeComponents(entity, nodeData);

        // 递归创建子节点
        for (const childId of nodeData.children) {
            const childData = nodeMap.get(childId);
            if (!childData) {
                logger.warn(`子节点未找到: ${childId}`);
                continue;
            }

            const childEntity = this.createEntityTree(
                childData,
                nodeMap,
                entityMap,
                scene,
                namePrefix
            );
            entity.addChild(childEntity);
        }

        return entity;
    }

    /**
     * 添加节点特定组件
     */
    private static addNodeComponents(entity: Entity, nodeData: BehaviorTreeNodeData): void {
        const { nodeType, data, name } = nodeData;

        // 根据节点类型和名称添加对应组件
        if (data.nodeType === 'root' || name === '根节点' || name === 'Root') {
            entity.addComponent(new RootNode());
        }
        // 组合节点
        else if (nodeType === NodeType.Composite) {
            this.addCompositeComponent(entity, name, data);
        }
        // 装饰器节点
        else if (nodeType === NodeType.Decorator) {
            this.addDecoratorComponent(entity, name, data);
        }
        // 动作节点
        else if (nodeType === NodeType.Action) {
            this.addActionComponent(entity, name, data);
        }
        // 条件节点
        else if (nodeType === NodeType.Condition) {
            this.addConditionComponent(entity, name, data);
        }
    }

    /**
     * 添加组合节点组件
     */
    private static addCompositeComponent(entity: Entity, name: string, data: Record<string, any>): void {
        const nameLower = name.toLowerCase();

        if (nameLower.includes('sequence') || nameLower.includes('序列')) {
            const node = entity.addComponent(new SequenceNode());
            node.abortType = (data.abortType as AbortType) ?? AbortType.None;
        } else if (nameLower.includes('selector') || nameLower.includes('选择')) {
            const node = entity.addComponent(new SelectorNode());
            node.abortType = (data.abortType as AbortType) ?? AbortType.None;
        } else if (nameLower.includes('parallelselector') || nameLower.includes('并行选择')) {
            const node = entity.addComponent(new ParallelSelectorNode());
            node.failurePolicy = data.failurePolicy ?? 'one';
        } else if (nameLower.includes('parallel') || nameLower.includes('并行')) {
            const node = entity.addComponent(new ParallelNode());
            node.successPolicy = data.successPolicy ?? 'all';
            node.failurePolicy = data.failurePolicy ?? 'one';
        } else if (nameLower.includes('randomsequence') || nameLower.includes('随机序列')) {
            entity.addComponent(new RandomSequenceNode());
        } else if (nameLower.includes('randomselector') || nameLower.includes('随机选择')) {
            entity.addComponent(new RandomSelectorNode());
        } else {
            logger.warn(`未知的组合节点类型: ${name}`);
        }
    }

    /**
     * 添加装饰器组件
     */
    private static addDecoratorComponent(entity: Entity, name: string, data: Record<string, any>): void {
        const nameLower = name.toLowerCase();

        if (nameLower.includes('inverter') || nameLower.includes('反转')) {
            entity.addComponent(new InverterNode());
        } else if (nameLower.includes('repeater') || nameLower.includes('重复')) {
            const node = entity.addComponent(new RepeaterNode());
            node.repeatCount = data.repeatCount ?? -1;
            node.endOnFailure = data.endOnFailure ?? false;
        } else if (nameLower.includes('untilsuccess') || nameLower.includes('直到成功')) {
            entity.addComponent(new UntilSuccessNode());
        } else if (nameLower.includes('untilfail') || nameLower.includes('直到失败')) {
            entity.addComponent(new UntilFailNode());
        } else if (nameLower.includes('alwayssucceed') || nameLower.includes('总是成功')) {
            entity.addComponent(new AlwaysSucceedNode());
        } else if (nameLower.includes('alwaysfail') || nameLower.includes('总是失败')) {
            entity.addComponent(new AlwaysFailNode());
        } else if (nameLower.includes('conditional') || nameLower.includes('条件装饰')) {
            const node = entity.addComponent(new ConditionalNode());
            node.conditionCode = data.conditionCode ?? '';
            node.shouldReevaluate = data.shouldReevaluate ?? true;
        } else if (nameLower.includes('cooldown') || nameLower.includes('冷却')) {
            const node = entity.addComponent(new CooldownNode());
            node.cooldownTime = data.cooldownTime ?? 1.0;
        } else if (nameLower.includes('timeout') || nameLower.includes('超时')) {
            const node = entity.addComponent(new TimeoutNode());
            node.timeoutDuration = data.timeoutDuration ?? 1.0;
        } else {
            logger.warn(`未知的装饰器类型: ${name}`);
        }
    }

    /**
     * 添加动作组件
     */
    private static addActionComponent(entity: Entity, name: string, data: Record<string, any>): void {
        const nameLower = name.toLowerCase();

        if (nameLower.includes('wait') || nameLower.includes('等待')) {
            const action = entity.addComponent(new WaitAction());
            action.waitTime = data.waitTime ?? 1.0;
        } else if (nameLower.includes('log') || nameLower.includes('日志')) {
            const action = entity.addComponent(new LogAction());
            action.message = data.message ?? '';
            action.level = data.level ?? 'log';
        } else if (nameLower.includes('setblackboard') || nameLower.includes('setvalue') || nameLower.includes('设置变量')) {
            const action = entity.addComponent(new SetBlackboardValueAction());
            action.variableName = data.variableName ?? '';
            action.value = data.value;
        } else if (nameLower.includes('modifyblackboard') || nameLower.includes('modifyvalue') || nameLower.includes('修改变量')) {
            const action = entity.addComponent(new ModifyBlackboardValueAction());
            action.variableName = data.variableName ?? '';
            action.operation = data.operation ?? 'add';
            action.operand = data.operand ?? 0;
        } else if (nameLower.includes('execute') || nameLower.includes('自定义')) {
            const action = entity.addComponent(new ExecuteAction());
            action.actionCode = data.actionCode ?? 'return TaskStatus.Success;';
        } else {
            logger.warn(`未知的动作类型: ${name}`);
        }
    }

    /**
     * 添加条件组件
     */
    private static addConditionComponent(entity: Entity, name: string, data: Record<string, any>): void {
        const nameLower = name.toLowerCase();

        if (nameLower.includes('compare') || nameLower.includes('比较变量')) {
            const condition = entity.addComponent(new BlackboardCompareCondition());
            condition.variableName = data.variableName ?? '';
            condition.operator = (data.operator as CompareOperator) ?? CompareOperator.Equal;
            condition.compareValue = data.compareValue;
            condition.invertResult = data.invertResult ?? false;
        } else if (nameLower.includes('exists') || nameLower.includes('变量存在')) {
            const condition = entity.addComponent(new BlackboardExistsCondition());
            condition.variableName = data.variableName ?? '';
            condition.checkNotNull = data.checkNotNull ?? false;
            condition.invertResult = data.invertResult ?? false;
        } else if (nameLower.includes('random') || nameLower.includes('概率')) {
            const condition = entity.addComponent(new RandomProbabilityCondition());
            condition.probability = data.probability ?? 0.5;
        } else if (nameLower.includes('execute') || nameLower.includes('执行条件')) {
            const condition = entity.addComponent(new ExecuteCondition());
            condition.conditionCode = data.conditionCode ?? '';
            condition.invertResult = data.invertResult ?? false;
        } else {
            logger.warn(`未知的条件类型: ${name}`);
        }
    }

    /**
     * 设置黑板
     */
    private static setupBlackboard(
        rootEntity: Entity,
        blackboardDef: BlackboardVariableDefinition[],
        overrides?: Record<string, any>
    ): void {
        const blackboard = rootEntity.addComponent(new BlackboardComponent());

        for (const variable of blackboardDef) {
            const value = overrides && overrides[variable.name] !== undefined
                ? overrides[variable.name]
                : variable.defaultValue;

            blackboard.defineVariable(
                variable.name,
                variable.type,
                value,
                {
                    readonly: variable.readonly,
                    description: variable.description
                }
            );
        }

        logger.info(`已设置黑板: ${blackboardDef.length} 个变量`);
    }

    /**
     * 设置属性绑定
     */
    private static setupPropertyBindings(
        bindings: PropertyBinding[],
        entityMap: Map<string, Entity>
    ): void {
        for (const binding of bindings) {
            const entity = entityMap.get(binding.nodeId);
            if (!entity) {
                logger.warn(`属性绑定引用的节点不存在: ${binding.nodeId}`);
                continue;
            }

            let propertyBindings = entity.getComponent(PropertyBindings);
            if (!propertyBindings) {
                propertyBindings = entity.addComponent(new PropertyBindings());
            }

            propertyBindings.addBinding(binding.propertyName, binding.variableName);
        }

        logger.info(`已设置属性绑定: ${bindings.length} 个绑定`);
    }
}
