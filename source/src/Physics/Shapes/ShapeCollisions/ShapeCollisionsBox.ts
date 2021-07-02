module es {
    export class ShapeCollisionsBox {
        public static boxToBox(first: Box, second: Box, result: CollisionResult): boolean {
            const minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)) {
                // 计算MTV。如果它是零，我们就可以称它为非碰撞
                result.minimumTranslationVector = minkowskiDiff.getClosestPointOnBoundsToOrigin();

                if (result.minimumTranslationVector.equals(Vector2.zero))
                    return false;

                result.normal = result.minimumTranslationVector.scale(-1);
                result.normal = result.normal.normalize();

                return true;
            }

            return false;
        }

        /**
         * 用second检查被deltaMovement移动的框的结果
         * @param first
         * @param second
         * @param movement
         * @param hit
         */
        public static boxToBoxCast(first: Box, second: Box, movement: Vector2, hit: RaycastHit): boolean {
            // 首先，我们检查是否有重叠。如果有重叠，我们就不做扫描测试
            const minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)) {
                // 计算MTV。如果它是零，我们就可以称它为非碰撞
                const mtv = minkowskiDiff.getClosestPointOnBoundsToOrigin();
                if (mtv.equals(Vector2.zero))
                    return false;

                hit.normal = new Vector2(-mtv.x, -mtv.y);
                hit.normal = hit.normal.normalize();
                hit.distance = 0;
                hit.fraction = 0;

                return true;
            } else {
                // 射线投射移动矢量
                const ray = new Ray2D(Vector2.zero, movement.scale(-1));
                const res = minkowskiDiff.rayIntersects(ray);
                if (res.intersected && res.distance <= 1) {
                    hit.fraction = res.distance;
                    hit.distance = movement.magnitude() * res.distance;
                    hit.normal = movement.scale(-1);
                    hit.normal = hit.normal.normalize();
                    hit.centroid = first.bounds.center.add(movement.scale(res.distance));

                    return true;
                }
            }

            return false;
        }

        private static minkowskiDifference(first: Box, second: Box): Rectangle {
            // 我们需要第一个框的左上角
            // 碰撞器只会修改运动的位置所以我们需要用位置来计算出运动是什么。
            const positionOffset = first.position.sub(first.bounds.center);
            const topLeft = first.bounds.location.add(positionOffset.sub(second.bounds.max));
            const fullSize = first.bounds.size.add(second.bounds.size);

            return new Rectangle(topLeft.x, topLeft.y, fullSize.x, fullSize.y)
        }
    }
}