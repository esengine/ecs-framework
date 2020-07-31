module es {
    export class RaycastHit {
        /**
         * 对撞机被射线击中
         */
        public collider: Collider;

        /**
         * 撞击发生时沿射线的距离。
         */
        public fraction: number = 0;

        /**
         * 从射线原点到碰撞点的距离
         */
        public distance: number = 0;

        /**
         * 世界空间中光线击中对撞机表面的点
         */
        public point: Vector2 = Vector2.zero;

        /**
         * 被射线击中的表面的法向量
         */
        public normal: Vector2 = Vector2.zero;

        /**
         * 用于执行转换的质心。使其接触的形状的位置。
         */
        public centroid: Vector2;

        constructor(collider: Collider, fraction: number, distance: number, point: Vector2, normal: Vector2){
            this.collider = collider;
            this.fraction = fraction;
            this.distance = distance;
            this.point = point;
            this.centroid = Vector2.zero;
        }

        public setValues(collider: Collider, fraction: number, distance: number, point: Vector2){
            this.collider = collider;
            this.fraction = fraction;
            this.distance = distance;
            this.point = point;
        }

        public reset(){
            this.collider = null;
            this.fraction = this.distance = 0;
        }

        public toString(){
            return `[RaycastHit] fraction: ${this.fraction}, distance: ${this.distance}, normal: ${this.normal}, centroid: ${this.centroid}, point: ${this.point}`;
        }
    }
}