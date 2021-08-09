module es {
    /**
     * 对象声明自己的平等方法和Hashcode的生成
     */
    export interface IEqualityComparable {
        /**
         * 确定另一个对象是否等于这个实例
         * @param other 
         */
        equals(other: any): boolean;
    }
}