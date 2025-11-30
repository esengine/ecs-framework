import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

/**
 * 3x3 矩阵（用于 2D 变换：旋转 + 缩放）
 * 实际存储为 [a, b, c, d, tx, ty] 形式的仿射变换
 */
export interface Matrix2D {
    a: number;   // scaleX * cos(rotation)
    b: number;   // scaleX * sin(rotation)
    c: number;   // scaleY * -sin(rotation)
    d: number;   // scaleY * cos(rotation)
    tx: number;  // translateX
    ty: number;  // translateY
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

    // ===== 世界变换（由 TransformSystem 计算）=====

    /** 世界位置（只读，由 TransformSystem 计算） */
    worldPosition: Vector3 = { x: 0, y: 0, z: 0 };

    /** 世界旋转（只读，由 TransformSystem 计算） */
    worldRotation: Vector3 = { x: 0, y: 0, z: 0 };

    /** 世界缩放（只读，由 TransformSystem 计算） */
    worldScale: Vector3 = { x: 1, y: 1, z: 1 };

    /** 本地到世界的 2D 变换矩阵（只读，由 TransformSystem 计算） */
    localToWorldMatrix: Matrix2D = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };

    /** 变换是否需要更新 */
    bDirty: boolean = true;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.position = { x, y, z };
        // 初始化世界变换为本地变换值（在 TransformSystem 更新前使用）
        this.worldPosition = { x, y, z };
    }

    setPosition(x: number, y: number, z: number = 0): this {
        this.position = { x, y, z };
        this.bDirty = true;
        return this;
    }

    setRotation(x: number, y: number, z: number): this {
        this.rotation = { x, y, z };
        this.bDirty = true;
        return this;
    }

    setScale(x: number, y: number, z: number = 1): this {
        this.scale = { x, y, z };
        this.bDirty = true;
        return this;
    }

    /**
     * 将本地坐标转换为世界坐标
     */
    localToWorld(localX: number, localY: number): { x: number; y: number } {
        const m = this.localToWorldMatrix;
        return {
            x: m.a * localX + m.c * localY + m.tx,
            y: m.b * localX + m.d * localY + m.ty
        };
    }

    /**
     * 将世界坐标转换为本地坐标
     */
    worldToLocal(worldX: number, worldY: number): { x: number; y: number } {
        const m = this.localToWorldMatrix;
        const det = m.a * m.d - m.b * m.c;
        if (Math.abs(det) < 1e-10) {
            return { x: 0, y: 0 };
        }

        const invDet = 1 / det;
        const dx = worldX - m.tx;
        const dy = worldY - m.ty;

        return {
            x: (m.d * dx - m.c * dy) * invDet,
            y: (-m.b * dx + m.a * dy) * invDet
        };
    }
}
