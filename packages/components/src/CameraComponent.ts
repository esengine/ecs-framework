import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';

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
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Projection',
        options: [
            { label: 'Orthographic', value: CameraProjection.Orthographic },
            { label: 'Perspective', value: CameraProjection.Perspective }
        ]
    })
    public projection: CameraProjection = CameraProjection.Orthographic;

    /** 视野角度（透视模式） */
    @Serialize()
    @Property({ type: 'number', label: 'Field of View', min: 1, max: 179 })
    public fieldOfView: number = 60;

    /** 正交尺寸（正交模式） */
    @Serialize()
    @Property({ type: 'number', label: 'Orthographic Size', min: 0.1, step: 0.1 })
    public orthographicSize: number = 5;

    /** 近裁剪面 */
    @Serialize()
    @Property({ type: 'number', label: 'Near Clip', min: 0.01, step: 0.1 })
    public nearClipPlane: number = 0.1;

    /** 远裁剪面 */
    @Serialize()
    @Property({ type: 'number', label: 'Far Clip', min: 1, step: 10 })
    public farClipPlane: number = 1000;

    /** 视口X */
    @Serialize()
    @Property({ type: 'number', label: 'Viewport X', min: 0, max: 1, step: 0.01 })
    public viewportX: number = 0;

    /** 视口Y */
    @Serialize()
    @Property({ type: 'number', label: 'Viewport Y', min: 0, max: 1, step: 0.01 })
    public viewportY: number = 0;

    /** 视口宽度 */
    @Serialize()
    @Property({ type: 'number', label: 'Viewport Width', min: 0, max: 1, step: 0.01 })
    public viewportWidth: number = 1;

    /** 视口高度 */
    @Serialize()
    @Property({ type: 'number', label: 'Viewport Height', min: 0, max: 1, step: 0.01 })
    public viewportHeight: number = 1;

    /** 渲染优先级 */
    @Serialize()
    @Property({ type: 'integer', label: 'Depth' })
    public depth: number = 0;

    /** 背景颜色 */
    @Serialize()
    @Property({ type: 'color', label: 'Background Color' })
    public backgroundColor: string = '#000000';

    constructor() {
        super();
    }
}
