///<reference path="./Collider.ts" />
module es {
    export class BoxCollider extends Collider {
        public hollowShape: egret.Shape = new egret.Shape();
        public polygonShape: egret.Shape = new egret.Shape();
        public pixelShape1: egret.Shape = new egret.Shape();
        public pixelShape2: egret.Shape = new egret.Shape();
        /**
         * 零参数构造函数要求RenderableComponent在实体上，这样碰撞器可以在实体被添加到场景时调整自身的大小。
         */
        constructor() {
            super();

            // 我们在这里插入一个1x1框作为占位符，直到碰撞器在下一阵被添加到实体并可以获得更精确的自动调整大小数据
            this.shape = new Box(1, 1);
            this._colliderRequiresAutoSizing = true;
        }

        public get width() {
            return (this.shape as Box).width;
        }

        public set width(value: number) {
            this.setWidth(value);
        }

        public get height() {
            return (this.shape as Box).height;
        }

        public set height(value: number) {
            this.setHeight(value);
        }

        /**
         * 创建一个BoxCollider并使用x/y组件作为localOffset
         * @param x
         * @param y
         * @param width
         * @param height
         */
        public createBoxRect(x: number, y: number, width: number, height: number): BoxCollider{
            this._localOffset = new Vector2(x + width / 2, y + width / 2);
            this.shape = new Box(width, height);
            this._colliderRequiresAutoSizing = false;
            return this;
        }

        /**
         * 设置BoxCollider的大小
         * @param width
         * @param height
         */
        public setSize(width: number, height: number) {
            this._colliderRequiresAutoSizing = false;
            let box = this.shape as Box;
            if (width != box.width || height != box.height) {
                // 更新框，改变边界，如果我们需要更新物理系统中的边界
                box.updateBox(width, height);
                if (this.entity && this._isParentEntityAddedToScene)
                    Physics.updateCollider(this);
            }

            return this;
        }

        /**
         * 设置BoxCollider的宽度
         * @param width
         */
        public setWidth(width: number): BoxCollider {
            this._colliderRequiresAutoSizing = false;
            let box = this.shape as Box;
            if (width != box.width) {
                // 更新框，改变边界，如果我们需要更新物理系统中的边界
                box.updateBox(width, box.height);
                if (this.entity && this._isParentEntityAddedToScene)
                    Physics.updateCollider(this);
            }

            return this;
        }

        /**
         * 设置BoxCollider的高度
         * @param height
         */
        public setHeight(height: number) {
            this._colliderRequiresAutoSizing = false;
            let box = this.shape as Box;
            if (height != box.height) {
                // 更新框，改变边界，如果我们需要更新物理系统中的边界
                box.updateBox(box.width, height);
                if (this.entity && this._isParentEntityAddedToScene)
                    Physics.updateCollider(this);
            }
        }

        public debugRender() {
            let poly = this.shape;
            if (!this.hollowShape.parent)
                this.debugDisplayObject.addChild(this.hollowShape);

            if (!this.polygonShape.parent)
                this.debugDisplayObject.addChild(this.polygonShape);

            if (!this.pixelShape1.parent)
                this.debugDisplayObject.addChild(this.pixelShape1);

            if (!this.pixelShape2.parent)
                this.debugDisplayObject.addChild(this.pixelShape2);

            this.hollowShape.graphics.clear();
            this.hollowShape.graphics.beginFill(Colors.colliderBounds, 0);
            this.hollowShape.graphics.lineStyle(Size.lineSizeMultiplier, Colors.colliderBounds);
            this.hollowShape.graphics.drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
            this.hollowShape.graphics.endFill();
        }

        public toString() {
            return `[BoxCollider: bounds: ${this.bounds}]`;
        }
    }
}
