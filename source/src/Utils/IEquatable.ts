module es {
    /**
     * 实现该接口用于判定两个对象是否相等的快速接口
     */
    export interface IEquatable<T> {
        equals(other: T): boolean;
    }
}