module es {
    export class Physics {
        private static _spatialHash: SpatialHash;
        /** 调用reset并创建一个新的SpatialHash时使用的单元格大小 */
        public static spatialHashCellSize = 100;
        /** 接受layerMask的所有方法的默认值 */
        public static readonly allLayers: number = -1;

        public static reset(){
            this._spatialHash = new SpatialHash(this.spatialHashCellSize);
        }

        /**
         * 从SpatialHash中移除所有碰撞器
         */
        public static clear(){
            this._spatialHash.clear();
        }

        public static overlapCircleAll(center: Vector2, randius: number, results: any[], layerMask = -1){
            return this._spatialHash.overlapCircle(center, randius, results, layerMask);
        }

        public static boxcastBroadphase(rect: Rectangle, layerMask: number = this.allLayers){
            let boxcastResult = this._spatialHash.aabbBroadphase(rect, null, layerMask);
            return {colliders: boxcastResult.tempHashSet, rect: boxcastResult.bounds};
        }

        public static boxcastBroadphaseExcludingSelf(collider: Collider, rect: Rectangle, layerMask = this.allLayers){
            return this._spatialHash.aabbBroadphase(rect, collider, layerMask);
        }

        /**
         * 将对撞机添加到物理系统中
         * @param collider
         */
        public static addCollider(collider: Collider){
            Physics._spatialHash.register(collider);
        }

        /**
         * 从物理系统中移除对撞机
         * @param collider
         */
        public static removeCollider(collider: Collider){
            Physics._spatialHash.remove(collider);
        }

        /**
         * 更新物理系统中对撞机的位置。这实际上只是移除然后重新添加带有新边界的碰撞器
         * @param collider
         */
        public static updateCollider(collider: Collider){
            this._spatialHash.remove(collider);
            this._spatialHash.register(collider);
        }

        /**
         * debug绘制空间散列的内容
         * @param secondsToDisplay
         */
        public static debugDraw(secondsToDisplay){
            this._spatialHash.debugDraw(secondsToDisplay, 2);
        }
    }
}
