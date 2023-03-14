module es {
    /**
     * 该类用于存储具有亚像素分辨率的二维向量。
     */
    export class SubpixelVector2 {
        /**
         * 用于存储 x 坐标的 SubpixelFloat 对象。
         */
        public _x: SubpixelFloat = new SubpixelFloat();

        /**
         * 用于存储 y 坐标的 SubpixelFloat 对象。
         */
        public _y: SubpixelFloat = new SubpixelFloat();

        /**
         * 通过将给定数量的像素添加到余数中来更新 SubpixelVector2 值。
         * @param {Vector2} amount - 要添加到余数中的像素向量。
         */
        public update(amount: Vector2): void {
            // 更新 x 和 y 坐标
            amount.x = this._x.update(amount.x);
            amount.y = this._y.update(amount.y);
        }

        /**
         * 将 SubpixelVector2 值的余数重置为零。
         */
        public reset(): void {
            this._x.reset();
            this._y.reset();
        }
    }
}