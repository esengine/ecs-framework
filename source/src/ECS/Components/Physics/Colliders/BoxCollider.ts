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
        constructor(x: number, y: number, width: number, height: number) {
            super();

            this._localOffset = new Vector2(x + width / 2, y + height / 2);
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
                this._isPositionDirty = true;
                if (this.entity && this._isParentEntityAddedToScene)
                    Physics.updateCollider(this);
            }
        }

        public toString() {
            return `[BoxCollider: bounds: ${this.bounds}]`;
        }
    }
}
