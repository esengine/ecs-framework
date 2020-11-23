module es {
    export class CircleCollider extends Collider {
        /**
         * 创建一个有半径的圆
         *
         * @param radius
         */
        constructor(radius: number) {
            super();

            this.shape = new Circle(radius);
        }

        public get radius(): number {
            return (this.shape as Circle).radius;
        }

        public set radius(value: number) {
            this.setRadius(value);
        }

        /**
         * 设置圆的半径
         * @param radius
         */
        public setRadius(radius: number): CircleCollider {
            let circle = this.shape as Circle;
            if (radius != circle.radius) {
                circle.radius = radius;
                circle._originalRadius = radius;

                if (this.entity && this._isParentEntityAddedToScene)
                    Physics.updateCollider(this);
            }

            return this;
        }

        public toString() {
            return `[CircleCollider: bounds: ${this.bounds}, radius: ${(this.shape as Circle).radius}]`
        }
    }
}
