import { Vector2 } from '../Math/Vector2';
import { MathHelper } from '../Math/MathHelper';

/**
 * 变换组件类
 * 
 * 管理游戏对象的空间变换信息，包括位置、旋转和缩放。
 * 支持父子层级关系，可以构建复杂的变换层次结构。
 * 
 * @example
 * ```typescript
 * const transform = new Transform();
 * transform.setPosition(100, 200);
 * transform.setRotationDegrees(45);
 * transform.setScale(2, 2);
 * 
 * // 设置父子关系
 * childTransform.setParent(transform);
 * ```
 */
export class Transform {
    /**
     * 本地位置坐标
     * 
     * 相对于父变换的位置，如果没有父变换则为世界坐标。
     */
    public position: Vector2 = Vector2.zero;

    /**
     * 本地旋转角度
     * 
     * 以弧度为单位的旋转角度，相对于父变换的旋转。
     */
    public rotation: number = 0;

    /**
     * 本地缩放比例
     * 
     * 相对于父变换的缩放比例。
     */
    public scale: Vector2 = Vector2.one;

    /**
     * 父变换引用
     * 
     * 指向父级变换，如果为null则表示这是根变换。
     */
    public parent: Transform | null = null;

    /**
     * 子变换集合
     * 
     * 存储所有子级变换的数组。
     */
    private _children: Transform[] = [];

    /**
     * 创建变换实例
     * 
     * @param position - 初始位置，默认为零向量
     * @param rotation - 初始旋转角度（弧度），默认为0
     * @param scale - 初始缩放，默认为单位向量
     */
    constructor(position?: Vector2, rotation: number = 0, scale?: Vector2) {
        if (position) this.position = position.clone();
        this.rotation = rotation;
        if (scale) this.scale = scale.clone();
    }

    /**
     * 获取旋转角度（度数）
     * 
     * @returns 以度数为单位的旋转角度
     */
    public get rotationDegrees(): number {
        return MathHelper.toDegrees(this.rotation);
    }

    /**
     * 设置旋转角度（度数）
     * 
     * @param value - 以度数为单位的旋转角度
     */
    public set rotationDegrees(value: number) {
        this.rotation = MathHelper.toRadians(value);
    }

    /**
     * 获取世界坐标位置
     * 
     * 计算并返回在世界坐标系中的绝对位置。
     * 
     * @returns 世界坐标位置
     */
    public get worldPosition(): Vector2 {
        if (!this.parent) {
            return this.position.clone();
        }

        // 计算世界位置
        const parentWorld = this.parent.worldPosition;
        const cos = Math.cos(this.parent.worldRotation);
        const sin = Math.sin(this.parent.worldRotation);
        const parentScale = this.parent.worldScale;

        const scaledPos = Vector2.multiply(this.position, parentScale);
        const rotatedX = scaledPos.x * cos - scaledPos.y * sin;
        const rotatedY = scaledPos.x * sin + scaledPos.y * cos;

        return new Vector2(parentWorld.x + rotatedX, parentWorld.y + rotatedY);
    }

    /**
     * 获取世界旋转角度
     * 
     * 计算并返回在世界坐标系中的绝对旋转角度。
     * 
     * @returns 世界旋转角度（弧度）
     */
    public get worldRotation(): number {
        if (!this.parent) {
            return this.rotation;
        }
        return this.parent.worldRotation + this.rotation;
    }

    /**
     * 获取世界缩放比例
     * 
     * 计算并返回在世界坐标系中的绝对缩放比例。
     * 
     * @returns 世界缩放比例
     */
    public get worldScale(): Vector2 {
        if (!this.parent) {
            return this.scale.clone();
        }
        return Vector2.multiply(this.parent.worldScale, this.scale);
    }

    /**
     * 获取子变换数量
     * 
     * @returns 子变换的数量
     */
    public get childCount(): number {
        return this._children.length;
    }

    /**
     * 获取指定索引的子变换
     * 
     * @param index - 子变换的索引
     * @returns 子变换实例，如果索引无效则返回null
     */
    public getChild(index: number): Transform | null {
        if (index >= 0 && index < this._children.length) {
            return this._children[index];
        }
        return null;
    }

    /**
     * 设置父变换
     * 
     * 建立或断开与父变换的层级关系。
     * 
     * @param parent - 新的父变换，传入null表示断开父子关系
     */
    public setParent(parent: Transform | null): void {
        if (this.parent === parent) return;

        // 从旧父级移除
        if (this.parent) {
            const index = this.parent._children.indexOf(this);
            if (index >= 0) {
                this.parent._children.splice(index, 1);
            }
        }

        // 设置新父级
        this.parent = parent;
        if (parent) {
            parent._children.push(this);
        }
    }

    /**
     * 设置本地位置
     * 
     * @param x - X坐标
     * @param y - Y坐标
     */
    public setPosition(x: number, y: number): void {
        this.position.set(x, y);
    }

    /**
     * 设置本地旋转角度（弧度）
     * 
     * @param radians - 旋转角度（弧度）
     */
    public setRotation(radians: number): void {
        this.rotation = radians;
    }

    /**
     * 设置本地旋转角度（度数）
     * 
     * @param degrees - 旋转角度（度数）
     */
    public setRotationDegrees(degrees: number): void {
        this.rotation = MathHelper.toRadians(degrees);
    }

    /**
     * 设置本地缩放比例
     * 
     * @param scale - 缩放向量
     */
    public setScale(scale: Vector2): void;
    /**
     * 设置本地缩放比例
     * 
     * @param x - X轴缩放比例
     * @param y - Y轴缩放比例
     */
    public setScale(x: number, y: number): void;
    public setScale(scaleOrX: Vector2 | number, y?: number): void {
        if (typeof scaleOrX === 'number') {
            this.scale.set(scaleOrX, y!);
        } else {
            this.scale.copyFrom(scaleOrX);
        }
    }

    /**
     * 朝向指定位置
     * 
     * 调整旋转角度使变换朝向目标位置。
     * 
     * @param target - 目标位置
     */
    public lookAt(target: Vector2): void {
        const direction = target.subtract(this.worldPosition);
        this.rotation = Math.atan2(direction.y, direction.x);
    }

    /**
     * 平移变换
     * 
     * 在当前位置基础上添加偏移量。
     * 
     * @param offset - 位置偏移量
     */
    public translate(offset: Vector2): void {
        this.position = this.position.add(offset);
    }

    /**
     * 旋转
     * @param radians 旋转角度（弧度）
     */
    public rotate(radians: number): void {
        this.rotation += radians;
    }

    /**
     * 复制另一个变换的值
     * @param other 另一个变换
     */
    public copyFrom(other: Transform): void {
        this.position.copyFrom(other.position);
        this.rotation = other.rotation;
        this.scale.copyFrom(other.scale);
    }

    /**
     * 克隆变换
     */
    public clone(): Transform {
        const transform = new Transform(this.position, this.rotation, this.scale);
        return transform;
    }
} 