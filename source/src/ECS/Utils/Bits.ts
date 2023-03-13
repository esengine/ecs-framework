module es {
    /**
     * 位操作类，用于操作一个位数组。
     */
    export class Bits {
        private _bit: { [index: number]: number } = {};

        /**
         * 设置指定位置的位值。
         * @param index 位置索引
         * @param value 位值（0 或 1）
         */
        public set(index: number, value: number) {
            this._bit[index] = value;
        }

        /**
         * 获取指定位置的位值。
         * @param index 位置索引
         * @returns 位值（0 或 1）
         */
        public get(index: number): number {
            let v = this._bit[index];
            return v == null ? 0 : v;
        }
    }

}