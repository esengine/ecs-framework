import { Component, ECSComponent, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 圆形碰撞器组件
 */
@ECSComponent('CircleCollider')
@Serializable({ version: 1, typeId: 'CircleCollider' })
export class CircleColliderComponent extends Component {
    /** 是否为触发器 */
    @Serialize() public isTrigger: boolean = false;

    /** 中心点X偏移 */
    @Serialize() public centerX: number = 0;

    /** 中心点Y偏移 */
    @Serialize() public centerY: number = 0;

    /** 半径 */
    @Serialize() public radius: number = 0.5;

    constructor() {
        super();
    }
}
