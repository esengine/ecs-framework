module es {
    /**
     * 计算投影和重叠区域
     */
    export class Projection {
        public min: number;
        public max: number;
      
        constructor() {
          this.min = Number.MAX_VALUE;
          this.max = -Number.MAX_VALUE;
        }
      
        public project(axis: Vector2, polygon: Polygon) {
          const points = polygon.points;
          let min = axis.dot(points[0]);
          let max = min;
      
          for (let i = 1; i < points.length; i++) {
            const p = points[i];
            const dot = axis.dot(p);
            if (dot < min) {
              min = dot;
            } else if (dot > max) {
              max = dot;
            }
          }
      
          this.min = min;
          this.max = max;
        }
      
        public overlap(other: Projection): boolean {
          return this.max >= other.min && other.max >= this.min;
        }
      
        public getOverlap(other: Projection): number {
          return Math.min(this.max, other.max) - Math.max(this.min, other.min);
        }
    }
}