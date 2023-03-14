module es {
    export class CollisionResult {
        /**
         * 与之相撞的对撞机
         */
        public collider: Collider;
        /**
         * 被形状击中的表面的法向量
         */
        public normal: Vector2 = Vector2.zero;
        /**
         * 应用于第一个形状以推入形状的转换
         */
        public minimumTranslationVector: Vector2 = Vector2.zero;
        /**
         * 不是所有冲突类型都使用!在依赖这个字段之前，请检查ShapeCollisions切割类!
         */
        public point: Vector2 = Vector2.zero;

        public reset() {
            this.collider = null;
            this.normal.setTo(0, 0);
            this.minimumTranslationVector.setTo(0, 0);
            if (this.point) {
                this.point.setTo(0, 0);
            }
        }

        public cloneTo(cr: CollisionResult) {
            cr.collider = this.collider;
            cr.normal.setTo(this.normal.x, this.normal.y);
            cr.minimumTranslationVector.setTo(
                this.minimumTranslationVector.x,
                this.minimumTranslationVector.y
            );
            if (this.point) {
                if (!cr.point) {
                    cr.point = new Vector2(0, 0);
                }
                cr.point.setTo(this.point.x, this.point.y);
            }
        }

        /**
         * 从移动向量中移除水平方向的位移，以确保形状只沿垂直方向运动。如果移动向量包含水平移动，则通过计算垂直位移来修复响应距离。
         * @param deltaMovement - 移动向量
         */
        public removeHorizontalTranslation(deltaMovement: Vector2) {
            // 如果运动方向和法线方向不在同一方向或者移动量为0且法线方向不为0，则需要修复
            if (Math.sign(this.normal.x) !== Math.sign(deltaMovement.x) || (deltaMovement.x === 0 && this.normal.x !== 0)) {
                // 获取响应距离
                const responseDistance = this.minimumTranslationVector.magnitude();
                // 计算需要修复的位移
                const fix = responseDistance / this.normal.y;

                // 如果法线方向不是完全水平或垂直，并且修复距离小于移动向量的3倍，则修复距离
                if (Math.abs(this.normal.x) != 1 && Math.abs(fix) < Math.abs(deltaMovement.y * 3)) {
                    this.minimumTranslationVector = new Vector2(0, -fix);
                }
            }
        }

        public invertResult() {
            this.minimumTranslationVector = this.minimumTranslationVector.negate();
            this.normal = this.normal.negate();
        }

        public toString() {
            return `[CollisionResult] normal: ${this.normal}, minimumTranslationVector: ${this.minimumTranslationVector}`;
        }
    }
}
