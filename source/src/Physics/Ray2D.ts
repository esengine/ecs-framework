module es {
    /**
     * 不是真正的射线(射线只有开始和方向)，作为一条线和射线。
     */
    export class Ray2D {
        public start: Vector2;
        public end: Vector2;
        public direction: Vector2;

        constructor(position: Vector2, end: Vector2){
            this.start = position;
            this.end = end;
            this.direction = Vector2.subtract(this.end, this.start);
        }
    }
}