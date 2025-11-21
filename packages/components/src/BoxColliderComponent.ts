import { Component, ECSComponent, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 盒型碰撞器组件
 */
@ECSComponent('BoxCollider')
@Serializable({ version: 1, typeId: 'BoxCollider' })
export class BoxColliderComponent extends Component {
    /** 是否为触发器 */
    @Serialize() public isTrigger: boolean = false;

    /** 中心点X偏移 */
    @Serialize() public centerX: number = 0;

    /** 中心点Y偏移 */
    @Serialize() public centerY: number = 0;

    /** 中心点Z偏移 */
    @Serialize() public centerZ: number = 0;

    /** 宽度 */
    @Serialize() public width: number = 1;

    /** 高度 */
    @Serialize() public height: number = 1;

    /** 深度 */
    @Serialize() public depth: number = 1;

    constructor() {
        super();
    }
}
