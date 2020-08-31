module es {
    export abstract class Constraint {
        /**
         * 如果为true，约束将用标准碰撞器检查碰撞。内部约束不需要将此设置为true。
         */
        public collidesWithColliders: boolean = true;
        /**
         * 解决约束
         */
        public abstract solve();

        /**
         * 如果collidesWithColliders为true，这个会被调用
         * @param collidesWithLayers
         */
        public handleCollisions(collidesWithLayers: number){}
    }
}