module es {
    export class Line {
        public start: Vector2;
        public end: Vector2;
    
        constructor(start: Vector2, end: Vector2) {
            this.start = start.clone();
            this.end = end.clone();
        }

        public get direction(): Vector2 {
            return this.end.sub(this.start).normalize();
        }

        public getNormal(): Vector2 {
            const angle = this.direction.getAngle() - Math.PI / 2;
            return new Vector2(Math.cos(angle), Math.sin(angle));
        }
    
        public getDirection(out: Vector2) {
            return out.copyFrom(this.end).sub(this.start).normalize();
        }
    
        public getLength() {
            return this.start.getDistance(this.end);
        }
    
        public getLengthSquared() {
            return this.start.getDistanceSquared(this.end);
        }

        public distanceToPoint(normal: Vector2, center: Vector2): number {
            return Math.abs((this.end.y - this.start.y) * normal.x - (this.end.x - this.start.x) * normal.y + this.end.x * this.start.y - this.end.y * this.start.x) / (2 * normal.magnitude());
        }
        
        public getFurthestPoint(direction: Vector2): Vector2 {
            const d1 = this.start.dot(direction);
            const d2 = this.end.dot(direction);
            return d1 > d2 ? this.start : this.end;
        }
    
        public getClosestPoint(point: Vector2, out: Vector2) {
            const delta = out.copyFrom(this.end).sub(this.start);
            const t = (point.sub(this.start)).dot(delta) / delta.lengthSquared();
    
            if (t < 0) {
                return out.copyFrom(this.start);
            } else if (t > 1) {
                return out.copyFrom(this.end);
            }
    
            return out.copyFrom(delta).multiplyScaler(t).add(this.start);
        }
    }
}