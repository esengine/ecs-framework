///<reference path="./Collider.ts" />
module es {
    export class BoxCollider extends Collider {
        /**
         * 创建一个BoxCollider，并使用x/y组件作为局部Offset
         * @param x 
         * @param y 
         * @param width 
         * @param height 
         */
        constructor(x: number = 0, y: number = 0, width: number = 1, height: number = 1) {
            super();

            if (width == 1 && height == 1) {
                this._colliderRequiresAutoSizing = true;
            } else {
                this._localOffset = new Vector2(x + width / 2, y + height / 2);
            }
            
            this.shape = new Box(width, height);
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
                this._isPositionDirty = true;
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
                this._isPositionDirty = true;
                if (this.entity != null && this._isParentEntityAddedToScene)
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
                this._isPositionDirty = true;
                if (this.entity && this._isParentEntityAddedToScene)
                    Physics.updateCollider(this);
            }
        }

        public debugRender(batcher: IBatcher) {
            let poly = this.shape as Polygon;
            batcher.drawHollowRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, new Color(76, 76, 76, 76), 2);
            batcher.end();
			batcher.drawPolygon(this.shape.position, poly.points, new Color(139, 0, 0, 255), true, 2);
            batcher.end();
			batcher.drawPixel(this.entity.position, new Color(255, 255, 0), 4);
            batcher.end();
			batcher.drawPixel(es.Vector2.add(this.transform.position, this.shape.center), new Color(255, 0, 0), 2);
            batcher.end();
        }

        public toString() {
            return `[BoxCollider: bounds: ${this.bounds}]`;
        }
    }
}
