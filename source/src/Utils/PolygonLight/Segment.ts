module es {
    /**
     * 表示可见性网格中的遮挡线段
     */
    export class Segment {
        /**
         * 该部分的第一个终点
         */
        public p1: EndPoint;
        /**
         * 该部分的第二个终点
         */
        public p2: EndPoint;

        constructor(){
            this.p1 = null;
            this.p2 = null;
        }
    }
}