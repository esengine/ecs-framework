import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 设置黑板变量值动作组件
 *
 * 将指定值或另一个黑板变量的值设置到目标变量
 */
@ECSComponent('SetBlackboardValueAction')
@Serializable({ version: 1 })
export class SetBlackboardValueAction extends Component {
    /** 目标变量名 */
    @Serialize()
    variableName: string = '';

    /** 要设置的值（与 sourceVariable 二选一） */
    @Serialize()
    value: any = null;

    /** 源变量名（与 value 二选一） */
    @Serialize()
    sourceVariable?: string;

    /** 是否强制设置（忽略只读限制） */
    @Serialize()
    force: boolean = false;
}
