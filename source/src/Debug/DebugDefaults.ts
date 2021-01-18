module es {
    /**
     * 我们在这里存储了各种系统的默认颜色，如对撞机调试渲染、Debug.drawText等。
     * 命名方式尽可能采用CLASS-THING，以明确它的使用位置
     */
    export class DebugDefault {
        public static debugText: number = 0xffffff;

        public static colliderBounds: number = 0xffffff * 0.3;
        public static colliderEdge: number = 0x8B0000;
        public static colliderPosition: number = 0xFFFF00;
        public static colliderCenter: number = 0xFF0000;

        public static renderableBounds: number = 0xFFFF00;
        public static renderableCenter: number = 0x9932CC;

        public static verletParticle: number = 0xDC345E;
        public static verletConstraintEdge: number = 0x433E36;
    }
}