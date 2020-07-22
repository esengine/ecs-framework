module es {
    export abstract class Shape {
        /**
         * 有一个单独的位置字段可以让我们改变形状的位置来进行碰撞检查，而不是改变entity.position。
         * 触发碰撞器/边界/散列更新的位置。
         * 内部字段
         */
        public position: Vector2;
        /**
         * 这不是中心。这个值不一定是物体的中心。对撞机更准确。
         * 应用任何转换旋转的localOffset
         * 内部字段
         */
        public center: Vector2;
        /** 缓存的形状边界 内部字段 */
        public bounds: Rectangle;

        public abstract recalculateBounds(collider: Collider);
        public abstract pointCollidesWithShape(point: Vector2): CollisionResult;
        public abstract overlaps(other: Shape);
        public abstract collidesWithShape(other: Shape): CollisionResult;
    }
}
