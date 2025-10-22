import { Component, ECSComponent, Entity } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';
import { TaskStatus, NodeType } from '../../Types/TaskStatus';
import { BlackboardComponent } from '../BlackboardComponent';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';

/**
 * 自定义动作函数类型
 */
export type CustomActionFunction = (
    entity: Entity,
    blackboard?: BlackboardComponent,
    deltaTime?: number
) => TaskStatus;

/**
 * 执行自定义函数动作组件
 *
 * 允许用户提供自定义的动作执行函数
 */
@BehaviorNode({
    displayName: '自定义动作',
    category: '动作',
    type: NodeType.Action,
    icon: 'Code',
    description: '执行自定义代码',
    color: '#FFC107'
})
@ECSComponent('ExecuteAction')
@Serializable({ version: 1 })
export class ExecuteAction extends Component {
    @BehaviorProperty({
        label: '动作代码',
        type: 'code',
        description: 'JavaScript 代码，返回 TaskStatus',
        required: true
    })
    @Serialize()
    actionCode?: string = 'return TaskStatus.Success;';

    @Serialize()
    parameters: Record<string, any> = {};

    /** 编译后的函数（不序列化） */
    @IgnoreSerialization()
    private compiledFunction?: CustomActionFunction;

    /**
     * 获取或编译执行函数
     */
    getFunction(): CustomActionFunction | undefined {
        if (!this.compiledFunction && this.actionCode) {
            try {
                const func = new Function(
                    'entity',
                    'blackboard',
                    'deltaTime',
                    'parameters',
                    'TaskStatus',
                    `
                    const { Success, Failure, Running, Invalid } = TaskStatus;
                    try {
                        ${this.actionCode}
                    } catch (error) {
                        return TaskStatus.Failure;
                    }
                    `
                );

                this.compiledFunction = (entity, blackboard, deltaTime) => {
                    return func(entity, blackboard, deltaTime, this.parameters, TaskStatus) || TaskStatus.Success;
                };
            } catch (error) {
                return undefined;
            }
        }

        return this.compiledFunction;
    }

    /**
     * 设置自定义函数（运行时使用）
     */
    setFunction(func: CustomActionFunction): void {
        this.compiledFunction = func;
    }
}
