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
         * 改变最小平移向量，如果没有相同方向上的运动，它将移除平移的x分量。
         * @param deltaMovement
         */
        public removeHorizontalTranslation(deltaMovement: Vector2){
            // 检查是否需要横向移动，如果需要，移除并固定响应
            if (Math.sign(this.normal.x) !== Math.sign(deltaMovement.x) || (deltaMovement.x === 0 && this.normal.x !== 0)){
                const responseDistance = this.minimumTranslationVector.magnitude();
                const fix = responseDistance / this.normal.y;

                // 检查一些边界情况。因为我们除以法线 使得x == 1和一个非常小的y这将导致一个巨大的固定值
                if (Math.abs(this.normal.x) != 1 && Math.abs(fix) < Math.abs(deltaMovement.y * 3)){
                    this.minimumTranslationVector = new Vector2(0, -fix);
                }
            }
        }

        public invertResult() {
            this.minimumTranslationVector = this.minimumTranslationVector.negate();
            this.normal = this.normal.negate();
        }

        public toString(){
            return `[CollisionResult] normal: ${this.normal}, minimumTranslationVector: ${this.minimumTranslationVector}`;
        }
    }
}
