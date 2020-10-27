module es {
    /**
     * 用于管理一对对象的简单DTO
     */
    export class Pair<T> implements IEquatable<Pair<T>> {
        public first: T;
        public second: T;

        constructor(first: T, second: T) {
            this.first = first;
            this.second = second;
        }

        public clear() {
            this.first = this.second = null;
        }

        public equals(other: Pair<T>): boolean {
            // 这两种方法在功能上应该是等价的
            return this.first == other.first && this.second == other.second;
        }
    }
}
