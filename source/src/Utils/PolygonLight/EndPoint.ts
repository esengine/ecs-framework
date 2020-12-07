module es {
    /**
     * 一段的终点
     */
    export class EndPoint {
        /** 该部分的位置 */
        public position: Vector2;
        /** 如果这个端点是一个段的起始点或终点（每个段只有一个起始点和一个终点） */
        public begin: boolean;
        /** 该端点所属的段 */
        public segment: Segment;
        /** 端点相对于能见度测试位置的角度 */
        public angle: number;

        constructor() {
            this.position = Vector2.zero;
            this.begin = false;
            this.segment = null;
            this.angle = 0;
        }
    }

    export class EndPointComparer implements IComparer<EndPoint> {
        /**
         * 按角度对点进行排序的比较功能
         * @param a 
         * @param b 
         */
        public compare(a: EndPoint, b: EndPoint) {
            // 按角度顺序移动
            if (a.angle > b.angle)
                return 1;

            if (a.angle < b.angle)
                return -1;

            // 但对于纽带，我们希望Begin节点在End节点之前
            if (!a.begin && b.begin)
                return 1;
            
            if (a.begin && !b.begin)
                return -1;

            return 0;
        }
    }
}