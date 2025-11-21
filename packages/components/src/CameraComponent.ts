import { Component, ECSComponent, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 相机投影类型
 */
export enum CameraProjection {
    Perspective = 'perspective',
    Orthographic = 'orthographic'
}

/**
 * 相机组件 - 管理视图和投影
 */
@ECSComponent('Camera')
@Serializable({ version: 1, typeId: 'Camera' })
export class CameraComponent extends Component {
    /** 投影类型 */
    @Serialize() public projection: CameraProjection = CameraProjection.Orthographic;

    /** 视野角度（透视模式） */
    @Serialize() public fieldOfView: number = 60;

    /** 正交尺寸（正交模式） */
    @Serialize() public orthographicSize: number = 5;

    /** 近裁剪面 */
    @Serialize() public nearClipPlane: number = 0.1;

    /** 远裁剪面 */
    @Serialize() public farClipPlane: number = 1000;

    /** 视口X */
    @Serialize() public viewportX: number = 0;

    /** 视口Y */
    @Serialize() public viewportY: number = 0;

    /** 视口宽度 */
    @Serialize() public viewportWidth: number = 1;

    /** 视口高度 */
    @Serialize() public viewportHeight: number = 1;

    /** 渲染优先级 */
    @Serialize() public depth: number = 0;

    /** 背景颜色 */
    @Serialize() public backgroundColor: string = '#000000';

    constructor() {
        super();
    }
}
