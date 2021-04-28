module es {
    export class ShapeCollisionsBox {
        public static boxToBox(first: Box, second: Box, result: CollisionResult): boolean {
            let minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)) {
                // 计算MTV。如果它是零，我们就可以称它为非碰撞
                result.minimumTranslationVector = minkowskiDiff.getClosestPointOnBoundsToOrigin();

                if (result.minimumTranslationVector.equals(Vector2.zero))
                    return false;

                result.normal = new Vector2(-result.minimumTranslationVector.x, -result.minimumTranslationVector.y);
                result.normal.normalize();

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
            let minkowskiDiff = this.minkowskiDifference(first, second);
            if (minkowskiDiff.contains(0, 0)) {
                // 计算MTV。如果它是零，我们就可以称它为非碰撞
                let mtv = minkowskiDiff.getClosestPointOnBoundsToOrigin();
                if (mtv.equals(Vector2.zero))
                    return false;

                hit.normal = new Vector2(-mtv.x);
                hit.normal.normalize();
                hit.distance = 0;
                hit.fraction = 0;

                return true;
            } else {
                // 射线投射移动矢量
                let ray = new Ray2D(Vector2.zero, new Vector2(-movement.x));
                let fraction = new Ref(0);
                if (minkowskiDiff.rayIntersects(ray, fraction) && fraction.value <= 1) {
                    hit.fraction = fraction.value;
                    hit.distance = movement.length() * fraction.value;
                    hit.normal = new Vector2(-movement.x, -movement.y);
                    hit.normal.normalize();
                    hit.centroid = Vector2.add(first.bounds.center, Vector2.multiply(movement, new Vector2(fraction.value)));

                    return true;
                }
            }

            return false;
        }

        private static minkowskiDifference(first: Box, second: Box): Rectangle {
            // 我们需要第一个框的左上角
            // 碰撞器只会修改运动的位置所以我们需要用位置来计算出运动是什么。
            let positionOffset = Vector2.subtract(first.position, Vector2.add(first.bounds.location, new Vector2(first.bounds.size.x / 2, first.bounds.size.y / 2)));
            let topLeft = Vector2.subtract(Vector2.add(first.bounds.location, positionOffset), second.bounds.max);
            let fullSize = Vector2.add(first.bounds.size, second.bounds.size);

            return new Rectangle(topLeft.x, topLeft.y, fullSize.x, fullSize.y)
        }
    }
}