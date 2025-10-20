import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';

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
@ECSComponent('ModifyBlackboardValueAction')
@Serializable({ version: 1 })
export class ModifyBlackboardValueAction extends Component {
    /** 目标变量名 */
    @Serialize()
    variableName: string = '';

    /** 操作类型 */
    @Serialize()
    operation: ModifyOperation = ModifyOperation.Add;

    /** 操作数（可以是固定值或变量引用 "{{varName}}"） */
    @Serialize()
    operand: any = 0;

    /** 是否强制修改（忽略只读限制） */
    @Serialize()
    force: boolean = false;
}
