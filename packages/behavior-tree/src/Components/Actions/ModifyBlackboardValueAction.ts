import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { NodeType } from '../../Types/TaskStatus';
import { BehaviorNode, BehaviorProperty } from '../../Decorators/BehaviorNodeDecorator';

/**
 * 修改操作类型
 */
export enum ModifyOperation {
    /** 加法 */
    Add = 'add',
    /** 减法 */
    Subtract = 'subtract',
    /** 乘法 */
    Multiply = 'multiply',
    /** 除法 */
    Divide = 'divide',
    /** 取模 */
    Modulo = 'modulo',
    /** 追加（数组/字符串） */
    Append = 'append',
    /** 移除（数组） */
    Remove = 'remove'
}

/**
 * 修改黑板变量值动作组件
 *
 * 对黑板变量执行数学或逻辑操作
 */
@BehaviorNode({
    displayName: '修改变量',
    category: '动作',
    type: NodeType.Action,
    icon: 'Calculator',
    description: '对黑板变量执行数学或逻辑操作',
    color: '#FF9800'
})
@ECSComponent('ModifyBlackboardValueAction')
@Serializable({ version: 1 })
export class ModifyBlackboardValueAction extends Component {
    @BehaviorProperty({
        label: '变量名',
        type: 'variable',
        required: true
    })
    @Serialize()
    variableName: string = '';

    @BehaviorProperty({
        label: '操作类型',
        type: 'select',
        options: [
            { label: '加法', value: 'add' },
            { label: '减法', value: 'subtract' },
            { label: '乘法', value: 'multiply' },
            { label: '除法', value: 'divide' },
            { label: '取模', value: 'modulo' },
            { label: '追加', value: 'append' },
            { label: '移除', value: 'remove' }
        ]
    })
    @Serialize()
    operation: ModifyOperation = ModifyOperation.Add;

    @BehaviorProperty({
        label: '操作数',
        type: 'string',
        description: '可以是固定值或变量引用 {{varName}}'
    })
    @Serialize()
    operand: any = 0;

    @Serialize()
    force: boolean = false;
}
