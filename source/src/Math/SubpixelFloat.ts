module es {
    /**
     * 它存储值，直到累计的总数大于1。一旦超过1，该值将在调用update时添加到amount中
     * 一般用法如下:
     *
     *  let deltaMove = this.velocity * es.Time.deltaTime;
     *  deltaMove.x = this._x.update(deltaMove.x);
     *  deltaMove.y = this._y.update(deltaMove.y);
     */
    export class SubpixelFloat {
        public remainder: number = 0;

        /**
         * 以amount递增余数，将值截断，存储新的余数并将amount设置为当前值
         * @param amount
         */
        public update(amount: number){
            this.remainder += amount;
            let motion = Math.trunc(this.remainder);
            this.remainder -= motion;
            amount = motion;
            return amount;
        }

        /**
         * 将余数重置为0
         */
        public reset(){
            this.remainder = 0;
        }
    }
}