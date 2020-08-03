module es {
    export class Physics {
        /** 调用reset并创建一个新的SpatialHash时使用的单元格大小 */
        public static spatialHashCellSize = 100;
        /** 接受layerMask的所有方法的默认值 */
        public static readonly allLayers: number = -1;
        private static _spatialHash: SpatialHash;
        /**
         * raycast是否检测配置为触发器的碰撞器
         */
        public static raycastsHitTriggers: boolean = false;
        /**
         * 在碰撞器中开始的射线/直线是否强制转换检测到那些碰撞器
         */
        public static raycastsStartInColliders = false;

        public static reset() {
            this._spatialHash = new SpatialHash(this.spatialHashCellSize);
        }

        /**
         * 从SpatialHash中移除所有碰撞器
         */
        public static clear() {
            this._spatialHash.clear();
        }

        /**
         * 获取位于指定圆内的所有碰撞器
         * @param center
         * @param randius
         * @param results
         * @param layerMask
         */
        public static overlapCircleAll(center: Vector2, randius: number, results: any[], layerMask = -1) {
            if (results.length == 0) {
                console.error("An empty results array was passed in. No results will ever be returned.");
                return;
            }

            return this._spatialHash.overlapCircle(center, randius, results, layerMask);
        }

        /**
         * 返回所有碰撞器与边界相交的碰撞器。bounds。请注意，这是一个broadphase检查，所以它只检查边界，不做单个碰撞到碰撞器的检查!
         * @param rect
         * @param layerMask
         */
        public static boxcastBroadphase(rect: Rectangle, layerMask: number = this.allLayers) {
            return this._spatialHash.aabbBroadphase(rect, null, layerMask);
        }

        /**
         * 返回所有与边界相交的碰撞器，不包括传入的碰撞器(self)。如果您希望为其他查询自行创建扫过的边界，则此方法非常有用
         * @param collider
         * @param rect
         * @param layerMask
         */
        public static boxcastBroadphaseExcludingSelf(collider: Collider, rect: Rectangle, layerMask = this.allLayers) {
            return this._spatialHash.aabbBroadphase(rect, collider, layerMask);
        }

        /**
         * 将对撞机添加到物理系统中
         * @param collider
         */
        public static addCollider(collider: Collider) {
            Physics._spatialHash.register(collider);
        }

        /**
         * 从物理系统中移除对撞机
         * @param collider
         */
        public static removeCollider(collider: Collider) {
            Physics._spatialHash.remove(collider);
        }

        /**
         * 更新物理系统中对撞机的位置。这实际上只是移除然后重新添加带有新边界的碰撞器
         * @param collider
         */
        public static updateCollider(collider: Collider) {
            this._spatialHash.remove(collider);
            this._spatialHash.register(collider);
        }

        /**
         * debug绘制空间散列的内容
         * @param secondsToDisplay
         */
        public static debugDraw(secondsToDisplay) {
            this._spatialHash.debugDraw(secondsToDisplay, 2);
        }
    }
}
