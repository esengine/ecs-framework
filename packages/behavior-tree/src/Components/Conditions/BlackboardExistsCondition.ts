import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 黑板变量存在性检查条件组件
 *
 * 检查黑板变量是否存在
 */
@ECSComponent('BlackboardExistsCondition')
@Serializable({ version: 1 })
export class BlackboardExistsCondition extends Component {
    /** 要检查的变量名 */
    @Serialize()
    variableName: string = '';

    /** 是否检查值不为 null/undefined */
    @Serialize()
    checkNotNull: boolean = false;

    /** 是否反转结果（检查不存在） */
    @Serialize()
    invertResult: boolean = false;
}
