module es {
    export class EdgeExt {
        public static oppositeEdge(self: Edge) {
            switch (self) {
                case Edge.bottom:
                    return Edge.top;
                case Edge.top:
                    return Edge.bottom;
                case Edge.left:
                    return Edge.right;
                case Edge.right:
                    return Edge.left;
            }
        }

        /**
         * 如果边是右或左，则返回true
         * @param self
         */
        public static isHorizontal(self: Edge): boolean{
            return self == Edge.right || self == Edge.left;
        }

        /**
         * 如果边是顶部或底部，则返回true
         * @param self
         */
        public static isVertical(self: Edge): boolean {
            return self == Edge.top || self == Edge.bottom;
        }
    }
}