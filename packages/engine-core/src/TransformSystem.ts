import { EntitySystem, Matcher, Entity, ECSSystem, HierarchySystem, HierarchyComponent } from '@esengine/ecs-framework';
import { TransformComponent, Matrix2D } from './TransformComponent';

const DEG_TO_RAD = Math.PI / 180;

/**
 * 变换系统
 * Transform System - Calculates world transforms based on hierarchy
 *
 * 根据实体层级关系计算世界变换矩阵。
 * 子实体的世界变换 = 父实体世界变换 * 子实体本地变换
 */
@ECSSystem('Transform', { updateOrder: -100 })
export class TransformSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(TransformComponent));
    }

    protected override process(entities: readonly Entity[]): void {
        // 获取所有根实体（没有父级或父级没有 TransformComponent）
        const rootEntities = entities.filter(e => {
            const hierarchy = e.getComponent(HierarchyComponent);
            if (!hierarchy || hierarchy.parentId === null) {
                return true;
            }
            const parent = this.scene?.findEntityById(hierarchy.parentId);
            return !parent || !parent.hasComponent(TransformComponent);
        });

        // 从根实体开始递归计算世界变换
        for (const entity of rootEntities) {
            this.updateWorldTransform(entity, null);
        }
    }

    /**
     * 递归更新实体及其子实体的世界变换
     */
    private updateWorldTransform(entity: Entity, parentMatrix: Matrix2D | null): void {
        const transform = entity.getComponent(TransformComponent);
        if (!transform) return;

        // 计算本地变换矩阵
        const localMatrix = this.calculateLocalMatrix(transform);

        // 计算世界变换矩阵
        if (parentMatrix) {
            // 世界矩阵 = 父矩阵 * 本地矩阵
            transform.localToWorldMatrix = this.multiplyMatrices(parentMatrix, localMatrix);
        } else {
            // 没有父级，本地矩阵就是世界矩阵
            transform.localToWorldMatrix = localMatrix;
        }

        // 从世界矩阵提取世界位置、旋转、缩放
        this.decomposeMatrix(transform);

        transform.bDirty = false;

        // 递归处理子实体
        const hierarchy = entity.getComponent(HierarchyComponent);
        if (hierarchy && hierarchy.childIds.length > 0) {
            for (const childId of hierarchy.childIds) {
                const child = this.scene?.findEntityById(childId);
                if (child) {
                    this.updateWorldTransform(child, transform.localToWorldMatrix);
                }
            }
        }
    }

    /**
     * 计算本地变换矩阵
     */
    private calculateLocalMatrix(transform: TransformComponent): Matrix2D {
        const { position, rotation, scale } = transform;

        // 只使用 z 轴旋转（2D）
        const rad = rotation.z * DEG_TO_RAD;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // 构建仿射变换矩阵: Scale -> Rotate -> Translate
        // [a c tx]   [sx  0 0]   [cos -sin 0]   [1 0 tx]
        // [b d ty] = [0  sy 0] * [sin  cos 0] * [0 1 ty]
        // [0 0  1]   [0   0 1]   [0    0   1]   [0 0  1]

        return {
            a: scale.x * cos,
            b: scale.x * sin,
            c: scale.y * -sin,
            d: scale.y * cos,
            tx: position.x,
            ty: position.y
        };
    }

    /**
     * 矩阵乘法: result = a * b
     */
    private multiplyMatrices(a: Matrix2D, b: Matrix2D): Matrix2D {
        return {
            a: a.a * b.a + a.c * b.b,
            b: a.b * b.a + a.d * b.b,
            c: a.a * b.c + a.c * b.d,
            d: a.b * b.c + a.d * b.d,
            tx: a.a * b.tx + a.c * b.ty + a.tx,
            ty: a.b * b.tx + a.d * b.ty + a.ty
        };
    }

    /**
     * 从世界矩阵分解出位置、旋转、缩放
     */
    private decomposeMatrix(transform: TransformComponent): void {
        const m = transform.localToWorldMatrix;

        // 位置直接从矩阵获取
        transform.worldPosition.x = m.tx;
        transform.worldPosition.y = m.ty;
        transform.worldPosition.z = transform.position.z;

        // 计算缩放
        const scaleX = Math.sqrt(m.a * m.a + m.b * m.b);
        const scaleY = Math.sqrt(m.c * m.c + m.d * m.d);

        // 检测负缩放（通过行列式符号）
        const det = m.a * m.d - m.b * m.c;
        const sign = det < 0 ? -1 : 1;

        transform.worldScale.x = scaleX;
        transform.worldScale.y = scaleY * sign;
        transform.worldScale.z = transform.scale.z;

        // 计算旋转（从归一化的矩阵）
        if (scaleX > 1e-10) {
            const rotation = Math.atan2(m.b / scaleX, m.a / scaleX);
            transform.worldRotation.z = rotation / DEG_TO_RAD;
        } else {
            transform.worldRotation.z = 0;
        }
        transform.worldRotation.x = transform.rotation.x;
        transform.worldRotation.y = transform.rotation.y;
    }
}
