module es {
    export class CircleCollider extends Collider {
        /**
         * 创建一个有半径的圆
         *
         * @param radius
         */
        constructor(radius?: number) {
            super();

            if (radius)
                this._colliderRequiresAutoSizing = true;
            // 我们在这里插入一个1px的圆圈作为占位符
            // 直到碰撞器被添加到实体并可以获得更精确的自动调整大小数据的下一帧
            this.shape = new Circle(radius ? radius : 1);
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
            this._colliderRequiresAutoSizing = false;
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
