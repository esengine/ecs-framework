module es {
    /**
     * 不是真正的射线(射线只有开始和方向)，作为一条线和射线。
     */
    export class Ray2D {
        public get start(): Vector2 {
            return this._start;
        }

        public get direction(): Vector2 {
            return this._direction;
        }

        public get end(): Vector2 {
            return this._end;
        }

        constructor(pos: Vector2, end: Vector2) {
            this._start = pos.clone();
            this._end = end.clone();
            this._direction = this._end.sub(this._start);
        }

        private _start: Vector2;
        private _direction: Vector2;
        private _end: Vector2;
    }
}