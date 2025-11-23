import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';

/**
 * 3D向量
 */
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

/**
 * 变换组件 - 管理实体的位置、旋转和缩放
 */
@ECSComponent('Transform')
@Serializable({ version: 1, typeId: 'Transform' })
export class TransformComponent extends Component {
    /** 位置 */
    @Serialize()
    @Property({ type: 'vector3', label: 'Position' })
    public position: Vector3 = { x: 0, y: 0, z: 0 };

    /** 旋转（欧拉角，度） */
    @Serialize()
    @Property({ type: 'vector3', label: 'Rotation' })
    public rotation: Vector3 = { x: 0, y: 0, z: 0 };

    /** 缩放 */
    @Serialize()
    @Property({ type: 'vector3', label: 'Scale' })
    public scale: Vector3 = { x: 1, y: 1, z: 1 };

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.position = { x, y, z };
    }

    /**
     * 设置位置
     */
    public setPosition(x: number, y: number, z: number = 0): this {
        this.position = { x, y, z };
        return this;
    }

    /**
     * 设置旋转
     */
    public setRotation(x: number, y: number, z: number): this {
        this.rotation = { x, y, z };
        return this;
    }

    /**
     * 设置缩放
     */
    public setScale(x: number, y: number, z: number = 1): this {
        this.scale = { x, y, z };
        return this;
    }
}
