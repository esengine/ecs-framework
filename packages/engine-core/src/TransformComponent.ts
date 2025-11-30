import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

@ECSComponent('Transform')
@Serializable({ version: 1, typeId: 'Transform' })
export class TransformComponent extends Component {
    @Serialize()
    @Property({ type: 'vector3', label: 'Position' })
    position: Vector3 = { x: 0, y: 0, z: 0 };

    /** 欧拉角，单位：度 */
    @Serialize()
    @Property({ type: 'vector3', label: 'Rotation' })
    rotation: Vector3 = { x: 0, y: 0, z: 0 };

    @Serialize()
    @Property({ type: 'vector3', label: 'Scale' })
    scale: Vector3 = { x: 1, y: 1, z: 1 };

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.position = { x, y, z };
    }

    setPosition(x: number, y: number, z: number = 0): this {
        this.position = { x, y, z };
        return this;
    }

    setRotation(x: number, y: number, z: number): this {
        this.rotation = { x, y, z };
        return this;
    }

    setScale(x: number, y: number, z: number = 1): this {
        this.scale = { x, y, z };
        return this;
    }
}
