module es {
    /**
     * 该类用于存储具有亚像素分辨率的浮点数。
     */
    export class SubpixelFloat {
        /**
         * 存储 SubpixelFloat 值的浮点余数。
         */
        public remainder: number = 0;

        /**
         * 通过将给定数量的像素添加到余数中来更新 SubpixelFloat 值。
         * 返回更新后的整数部分，余数表示当前值中包含的亚像素部分。
         * @param {number} amount - 要添加到余数中的像素数。
         * @returns {number} 更新后的整数部分。
         */
        public update(amount: number): number {
            // 将给定的像素数量添加到余数中
            this.remainder += amount;

            // 检查余数是否超过一个像素的大小
            let motion = Math.trunc(this.remainder);
            this.remainder -= motion;

            // 返回整数部分作为更新后的值
            return motion;
        }

        /**
         * 将 SubpixelFloat 值重置为零。
         */
        public reset(): void {
            this.remainder = 0;
        }
    }
}