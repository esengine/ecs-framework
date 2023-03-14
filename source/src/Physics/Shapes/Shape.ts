module es {
    export abstract class Shape {
        public position: Vector2; // 形状的位置，表示形状在 2D 空间中的位置。
        public center: Vector2; // 形状的中心，表示形状的重心或几何中心。
        public bounds: Rectangle; // 形状的边界矩形，表示形状所占用的矩形区域。

        /**
         * 根据形状的碰撞器重新计算形状的边界。
         * @param {Collider} collider - 用于重新计算形状边界的碰撞器。
         */
        public abstract recalculateBounds(collider: Collider);

        /**
         * 确定形状是否与另一个形状重叠。
         * @param {Shape} other - 要检查重叠的形状。
         * @returns {boolean} 如果形状重叠，则为 true；否则为 false。
         */
        public abstract overlaps(other: Shape): boolean;

        /**
         * 确定形状是否与另一个形状碰撞。
         * @param {Shape} other - 要检查碰撞的形状。
         * @param {Out<CollisionResult>} collisionResult - 如果形状碰撞，则要填充的碰撞结果对象。
         * @returns {boolean} 如果形状碰撞，则为 true；否则为 false。
         */
        public abstract collidesWithShape(other: Shape, collisionResult: Out<CollisionResult>): boolean;

        /**
         * 确定形状是否与线段相交。
         * @param {Vector2} start - 线段的起点。
         * @param {Vector2} end - 线段的终点。
         * @param {Out<RaycastHit>} hit - 如果形状与线段相交，则要填充的射线命中结果对象。
         * @returns {boolean} 如果形状与线段相交，则为 true；否则为 false。
         */
        public abstract collidesWithLine(start: Vector2, end: Vector2, hit: Out<RaycastHit>): boolean;

        /**
         * 确定形状是否包含一个点。
         * @param {Vector2} point - 要检查包含的点。
         */
        public abstract containsPoint(point: Vector2);

        /**
         * 确定一个点是否与形状相交。
         * @param {Vector2} point - 要检查与形状相交的点。
         * @param {Out<CollisionResult>} result - 如果点与形状相交，则要填充的碰撞结果对象。
         * @returns {boolean} 如果点与形状相交，则为 true；否则为 false。
         */
        public abstract pointCollidesWithShape(point: Vector2, result: Out<CollisionResult>): boolean;
    }
}
