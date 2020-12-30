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

            let linqPoints = new linq.List(points);
            // 最后一个移除
            if (isPolygonClosed)
                linqPoints.remove(linqPoints.last());

            let center = Polygon.findPolygonCenter(points);
            this.setLocalOffset(center);
            Polygon.recenterPolygonVerts(points);
            this.shape = new Polygon(points);
        }

        public debugRender(batcher: IBatcher) {
            let poly = this.shape as Polygon;
            batcher.drawHollowRect(this.bounds, Debug.colliderBounds, 1);
            batcher.drawPolygon(this.shape.position, poly.points, Debug.colliderEdge, true, 1);
            batcher.drawPixel(this.entity.transform.position, Debug.colliderPosition, 4);
            batcher.drawPixel(this.shape.position, Debug.colliderCenter, 2);
        }
    }
}
