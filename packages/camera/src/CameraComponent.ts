import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';

export enum ECameraProjection {
    Perspective = 'perspective',
    Orthographic = 'orthographic'
}

@ECSComponent('Camera')
@Serializable({ version: 1, typeId: 'Camera' })
export class CameraComponent extends Component {
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Projection',
        options: [
            { label: 'Orthographic', value: ECameraProjection.Orthographic },
            { label: 'Perspective', value: ECameraProjection.Perspective }
        ]
    })
    public projection: ECameraProjection = ECameraProjection.Orthographic;

    /** 透视模式下的视野角度，范围 [1, 179] 度 */
    @Serialize()
    @Property({ type: 'number', label: 'Field of View', min: 1, max: 179 })
    public fieldOfView: number = 60;

    /** 正交模式下的可见区域半高度（世界单位） */
    @Serialize()
    @Property({ type: 'number', label: 'Orthographic Size', min: 0.1, step: 0.1 })
    public orthographicSize: number = 5;

    @Serialize()
    @Property({ type: 'number', label: 'Near Clip', min: 0.01, step: 0.1 })
    public nearClipPlane: number = 0.1;

    @Serialize()
    @Property({ type: 'number', label: 'Far Clip', min: 1, step: 10 })
    public farClipPlane: number = 1000;

    /** 视口归一化坐标，范围 [0, 1] */
    @Serialize()
    @Property({ type: 'number', label: 'Viewport X', min: 0, max: 1, step: 0.01 })
    public viewportX: number = 0;

    @Serialize()
    @Property({ type: 'number', label: 'Viewport Y', min: 0, max: 1, step: 0.01 })
    public viewportY: number = 0;

    @Serialize()
    @Property({ type: 'number', label: 'Viewport Width', min: 0, max: 1, step: 0.01 })
    public viewportWidth: number = 1;

    @Serialize()
    @Property({ type: 'number', label: 'Viewport Height', min: 0, max: 1, step: 0.01 })
    public viewportHeight: number = 1;

    /** 渲染优先级，值越大越后渲染（覆盖在上层） */
    @Serialize()
    @Property({ type: 'integer', label: 'Depth' })
    public depth: number = 0;

    @Serialize()
    @Property({ type: 'color', label: 'Background Color' })
    public backgroundColor: string = '#000000';

    constructor() {
        super();
    }
}

/** @deprecated 使用 ECameraProjection 代替 */
export const CameraProjection = ECameraProjection;
