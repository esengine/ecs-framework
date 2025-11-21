import { Component, ECSComponent, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 刚体类型
 */
export enum BodyType {
    Static = 'static',
    Dynamic = 'dynamic',
    Kinematic = 'kinematic'
}

/**
 * 刚体组件 - 管理物理模拟
 */
@ECSComponent('RigidBody')
@Serializable({ version: 1, typeId: 'RigidBody' })
export class RigidBodyComponent extends Component {
    /** 刚体类型 */
    @Serialize() public bodyType: BodyType = BodyType.Dynamic;

    /** 质量 */
    @Serialize() public mass: number = 1;

    /** 线性阻尼 */
    @Serialize() public linearDamping: number = 0;

    /** 角阻尼 */
    @Serialize() public angularDamping: number = 0.05;

    /** 重力缩放 */
    @Serialize() public gravityScale: number = 1;

    /** 是否使用连续碰撞检测 */
    @Serialize() public continuousDetection: boolean = false;

    /** 是否冻结X轴旋转 */
    @Serialize() public freezeRotationX: boolean = false;

    /** 是否冻结Y轴旋转 */
    @Serialize() public freezeRotationY: boolean = false;

    /** 是否冻结Z轴旋转 */
    @Serialize() public freezeRotationZ: boolean = false;

    /** X轴速度 */
    @Serialize() public velocityX: number = 0;

    /** Y轴速度 */
    @Serialize() public velocityY: number = 0;

    /** Z轴速度 */
    @Serialize() public velocityZ: number = 0;

    constructor() {
        super();
    }
}
