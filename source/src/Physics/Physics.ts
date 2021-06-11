///<reference path="./RaycastHit.ts" />
module es {
    export class Physics {
        public static _spatialHash: SpatialHash;
        /** 用于在全局范围内存储重力值的方便字段 */
        public static gravity = new Vector2(0, -300);
        /** 调用reset并创建一个新的SpatialHash时使用的单元格大小 */
        public static spatialHashCellSize = 100;
        /** 接受layerMask的所有方法的默认值 */
        public static readonly allLayers: number = -1;
        /**
         * raycast是否检测配置为触发器的碰撞器
         */
        public static raycastsHitTriggers: boolean = false;
        /**
         * 在碰撞器中开始的射线/直线是否强制转换检测到那些碰撞器
         */
        public static raycastsStartInColliders = false;
        public static debugRender: boolean = false;
        /**
         * 我们保留它以避免在每次raycast发生时分配它
         */
        public static _hitArray: RaycastHit[] = [
            new RaycastHit()
        ];
        /**
         * 避免重叠检查和形状投射的分配
         */
        public static _colliderArray: Collider[] = [
            null
        ];

        public static reset() {
            this._spatialHash = new SpatialHash(this.spatialHashCellSize);
            this._hitArray[0].reset();
            this._colliderArray[0] = null;
        }

        /**
         * 从SpatialHash中移除所有碰撞器
         */
        public static clear() {
            this._spatialHash.clear();
        }

        public static debugDraw(secondsToDisplay) {
            if (this.debugRender)
                this._spatialHash.debugDraw(secondsToDisplay);
        }

        /**
         * 检查是否有对撞机落在一个圆形区域内。返回遇到的第一个对撞机
         * @param center 
         * @param radius 
         * @param layerMask 
         */
        public static overlapCircle(center: Vector2, radius: number, layerMask: number = Physics.allLayers) {
            this._colliderArray[0] = null;
            this._spatialHash.overlapCircle(center, radius, this._colliderArray, layerMask);
            return this._colliderArray[0];
        }

        /**
         * 获取所有落在指定圆圈内的碰撞器
         * @param center
         * @param randius
         * @param results
         * @param layerMask
         */
        public static overlapCircleAll(center: Vector2, randius: number, results: any[], layerMask = -1) {
            if (results.length == 0) {
                console.warn("传入了一个空的结果数组。不会返回任何结果");
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
         * 返回所有被边界交错的碰撞器，但不包括传入的碰撞器（self）。
         * 如果你想为其他查询自己创建扫描边界，这个方法很有用
         * @param collider
         * @param rect
         * @param layerMask
         */
        public static boxcastBroadphaseExcludingSelf(collider: Collider, rect: Rectangle, layerMask = this.allLayers) {
            return this._spatialHash.aabbBroadphase(rect, collider, layerMask);
        }

        /**
         * 返回所有边界与 collider.bounds 相交的碰撞器，但不包括传入的碰撞器(self)
         * @param collider 
         * @param layerMask 
         */
        public static boxcastBroadphaseExcludingSelfNonRect(collider: Collider, layerMask = this.allLayers) {
            let bounds = collider.bounds;
            return this._spatialHash.aabbBroadphase(bounds, collider, layerMask);
        }

        /**
         * 返回所有被 collider.bounds 扩展为包含 deltaX/deltaY 的碰撞器，但不包括传入的碰撞器（self）
         * @param collider 
         * @param deltaX 
         * @param deltaY 
         * @param layerMask 
         */
        public static boxcastBroadphaseExcludingSelfDelta(collider: Collider, deltaX: number, deltaY: number, layerMask: number = Physics.allLayers) {
            let colliderBounds = collider.bounds;
            let sweptBounds = colliderBounds.getSweptBroadphaseBounds(deltaX, deltaY);
            return this._spatialHash.aabbBroadphase(sweptBounds, collider, layerMask);
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
         * 返回与layerMask匹配的碰撞器的第一次命中
         * @param start
         * @param end
         * @param layerMask
         */
        public static linecast(start: Vector2, end: Vector2, layerMask: number = Physics.allLayers): RaycastHit{
            this._hitArray[0].reset();
            this.linecastAll(start, end, this._hitArray, layerMask);
            return this._hitArray[0];
        }

        /**
         * 通过空间散列强制执行一行，并用该行命中的任何碰撞器填充hits数组
         * @param start
         * @param end
         * @param hits
         * @param layerMask
         */
        public static linecastAll(start: Vector2, end: Vector2, hits: RaycastHit[], layerMask: number = Physics.allLayers){
            if (hits.length == 0){
                console.warn("传入了一个空的hits数组。没有点击会被返回");
                return 0;
            }

            return this._spatialHash.linecast(start, end, hits, layerMask);
        }

        /**
         * 检查是否有对撞机落在一个矩形区域中
         * @param rect 
         * @param layerMask 
         */
        public static overlapRectangle(rect: Rectangle, layerMask: number = Physics.allLayers) {
            this._colliderArray[0] = null;
            this._spatialHash.overlapRectangle(rect, this._colliderArray, layerMask);
            return this._colliderArray[0];
        }

        /**
         * 获取所有在指定矩形范围内的碰撞器
         * @param rect 
         * @param results 
         * @param layerMask 
         */
        public static overlapRectangleAll(rect: Rectangle, results: Collider[], layerMask: number = Physics.allLayers) {
            if (results.length == 0){
                console.warn("传入了一个空的结果数组。不会返回任何结果");
                return 0;
            }
            return this._spatialHash.overlapRectangle(rect, results, layerMask);
        }
    }
}
