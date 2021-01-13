module es {
    export class CircleCollider extends Collider {
        /**
         * 创建一个具有半径的CircleCollider。
         * 请注意，当指定半径时，如果在实体上使用RenderableComponent，您将需要设置原点来对齐CircleCollider。
         * 例如，如果RenderableComponent有一个0,0的原点，并且创建了一个半径为1.5f * renderable.width的CircleCollider，你可以通过设置originNormalied为中心除以缩放尺寸来偏移原点
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
            this._colliderRequiresAutoSizing = false;
            let circle = this.shape as Circle;
            if (radius != circle.radius) {
                circle.radius = radius;
                circle._originalRadius = radius;
                this._isPositionDirty = true;

                if (this.entity != null && this._isParentEntityAddedToScene)
                    Physics.updateCollider(this);
            }

            return this;
        }

        public toString() {
            return `[CircleCollider: bounds: ${this.bounds}, radius: ${(this.shape as Circle).radius}]`
        }
    }
}
