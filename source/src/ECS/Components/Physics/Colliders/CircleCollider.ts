module es {
    export class CircleCollider extends Collider {
        private rectShape: egret.Shape = new egret.Shape();
        private circleShape: egret.Shape = new egret.Shape();
        private pixelShape1: egret.Shape = new egret.Shape();
        private pixelShape2: egret.Shape = new egret.Shape();

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

        public debugRender() {
            if (!this.rectShape.parent)
                this.debugDisplayObject.addChild(this.rectShape);

            if (!this.circleShape.parent)
                this.debugDisplayObject.addChild(this.circleShape);

            if (!this.pixelShape1.parent)
                this.debugDisplayObject.addChild(this.pixelShape1);

            if (!this.pixelShape2.parent)
                this.debugDisplayObject.addChild(this.pixelShape2);

            this.rectShape.graphics.clear();
            this.rectShape.graphics.beginFill(Colors.colliderBounds, 0);
            this.rectShape.graphics.lineStyle(Size.lineSizeMultiplier, Colors.colliderBounds);
            this.rectShape.graphics.drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
            this.rectShape.graphics.endFill();

            this.circleShape.graphics.clear();
            this.circleShape.graphics.beginFill(Colors.colliderEdge, 0);
            this.circleShape.graphics.lineStyle(Size.lineSizeMultiplier, Colors.colliderEdge);
            this.circleShape.graphics.drawCircle(this.shape.position.x, this.shape.position.y, (this.shape as Circle).radius);
            this.circleShape.graphics.endFill();

            this.pixelShape1.graphics.clear();
            this.pixelShape1.graphics.beginFill(Colors.colliderPosition, 0);
            this.pixelShape1.graphics.lineStyle(4 * Size.lineSizeMultiplier, Colors.colliderPosition);
            this.pixelShape1.graphics.moveTo(this.entity.transform.position.x, this.entity.transform.position.y);
            this.pixelShape1.graphics.lineTo(this.entity.transform.position.x, this.entity.transform.position.y);
            this.pixelShape1.graphics.endFill();

            this.pixelShape2.graphics.clear();
            this.pixelShape2.graphics.beginFill(Colors.colliderCenter, 0);
            this.pixelShape2.graphics.lineStyle(2 * Size.lineSizeMultiplier, Colors.colliderCenter);
            this.pixelShape2.graphics.moveTo(this.shape.position.x, this.shape.position.y);
            this.pixelShape2.graphics.lineTo(this.shape.position.x, this.shape.position.y);
            this.pixelShape2.graphics.endFill();
        }

        public toString() {
            return `[CircleCollider: bounds: ${this.bounds}, radius: ${(this.shape as Circle).radius}]`
        }
    }
}
