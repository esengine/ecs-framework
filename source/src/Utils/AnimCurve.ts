module es {
    export interface IAnimFrame {
        t: number;
        value: number;
    }

    export class AnimCurve {
        public get points(): IAnimFrame[] {
            return this._points;
        }

        public constructor(points: IAnimFrame[]) {
            if (points.length < 2) {
                throw new Error('curve length must be >= 2');
            }
            points.sort((a: IAnimFrame, b: IAnimFrame) => {
                return a.t - b.t;
            });
            if (points[0].t !== 0) {
                throw new Error('curve must start with 0');
            }
            if (points[points.length - 1].t !== 1) {
                throw new Error('curve must end with 1');
            }
            this._points = points;
        }

        public lerp(t: number): number {
            for (let i = 1; i < this._points.length; i++) {
                if (t <= this._points[i].t) {
                    const m = MathHelper.map01(
                        t,
                        this._points[i - 1].t,
                        this._points[i].t
                    );
                    return MathHelper.lerp(
                        this._points[i - 1].value,
                        this._points[i].value,
                        m
                    );
                }
            }
            throw new Error('should never be here');
        }

        public _points: IAnimFrame[];
    }
}