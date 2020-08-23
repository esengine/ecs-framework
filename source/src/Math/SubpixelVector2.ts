module es {
    export class SubpixelVector2 {
        public _x: SubpixelFloat = new SubpixelFloat();
        public _y: SubpixelFloat = new SubpixelFloat();

        /**
         * 以数量递增s/y余数，将值截断为整数，存储新的余数并将amount设置为当前值
         * @param amount
         */
        public update(amount: Vector2) {
            amount.x = this._x.update(amount.x);
            amount.y = this._y.update(amount.y);
        }

        /**
         * 将余数重置为0
         */
        public reset(){
            this._x.reset();
            this._y.reset();
        }
    }
}