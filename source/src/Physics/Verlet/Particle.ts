module es {
    export class Particle {
        /**
         * 粒子的当前位置
         */
        public position: Vector2;
        /**
         * 粒子最近移动之前的位置
         */
        public lastPosition: Vector2;
        /**
         * 粒子的质量。考虑到所有的力量和限制
         */
        public mass: number = 1;
        /**
         * 粒子的半径
         */
        public radius: number = 0;
        /**
         * 如果为true，粒子将与标准对撞机相撞
         */
        public collidesWithColliders: boolean = true;

        public isPinned: boolean;
        public acceleration: Vector2;
        public pinnedPosition: Vector2;

        /**
         * 对质点施加一个考虑质量的力
         * @param force
         */
        public applyForce(force: Vector2){
            this.acceleration.add(Vector2.divide(force, new Vector2(this.mass)));
        }
    }
}