module es {
    /**
     * 为确定对象的哈希码和两个项目是否相等提供接口
     */
    export interface IEqualityComparer<T> {
        /**
         * 判断两个对象是否相等
         * @param x 
         * @param y 
         */
        equals(x: T, y: T): boolean;

        /**
         * 生成对象的哈希码
         * @param value 
         */
        getHashCode(value: T): number;
    }
}