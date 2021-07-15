module es {
    /**
     * 多边形应该以顺时针方式定义
     */
    export class PolygonCollider extends Collider {
        /**
         * 如果这些点没有居中，它们将以localOffset的差异为居中。
         * @param points
         */
        constructor(points: Vector2[]) {
            super();

            // 第一点和最后一点决不能相同。我们想要一个开放的多边形
            let isPolygonClosed = points[0] == points[points.length - 1];

            // 最后一个移除
            if (isPolygonClosed)
                points = points.slice(0, points.length - 1);

            let center = Polygon.findPolygonCenter(points);
            this.setLocalOffset(center);
            Polygon.recenterPolygonVerts(points);
            this.shape = new Polygon(points);
        }
    }
}
