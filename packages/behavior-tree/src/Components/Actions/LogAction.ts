import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 日志动作组件
 *
 * 输出日志信息
 */
@ECSComponent('LogAction')
@Serializable({ version: 1 })
export class LogAction extends Component {
    /** 日志消息 */
    @Serialize()
    message: string = '';

    /** 日志级别 */
    @Serialize()
    level: 'log' | 'info' | 'warn' | 'error' = 'log';

    /** 是否包含实体信息 */
    @Serialize()
    includeEntityInfo: boolean = false;
}
