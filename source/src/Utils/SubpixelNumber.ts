module es {
    /**
     * 管理数值的简单助手类。它存储值，直到累计的总数大于1。一旦超过1，该值将在调用update时添加到amount中。
     */
    export class SubpixelNumber {
        public remainder: number;

        /**
         * 以amount递增余数，将值截断为int，存储新的余数并将amount设置为当前值。
         * @param amount
         */
        public update(amount: number){
            this.remainder += amount;
            let motion = Math.trunc(this.remainder);
            this.remainder -= motion;
            return motion;
        }

        /**
         * 将余数重置为0。当一个物体与一个不可移动的物体碰撞时有用。
         * 在这种情况下，您将希望将亚像素余数归零，因为它是空的和无效的碰撞。
         */
        public reset(){
            this.remainder = 0;
        }
    }
}