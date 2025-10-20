import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize, IgnoreSerialization } from '@esengine/ecs-framework';

/**
 * 等待动作组件
 *
 * 等待指定时间后返回成功
 */
@ECSComponent('WaitAction')
@Serializable({ version: 1 })
export class WaitAction extends Component {
    /** 等待时间（秒） */
    @Serialize()
    waitTime: number = 1.0;

    /** 已等待时间（秒） */
    @IgnoreSerialization()
    elapsedTime: number = 0;

    /**
     * 重置等待状态
     */
    reset(): void {
        this.elapsedTime = 0;
    }
}
