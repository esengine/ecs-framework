module es {
    export interface ISet<T> {
        add(item: T): boolean
        remove(item: T): boolean
        contains(item: T): boolean
        getCount(): number
        clear(): void
        toArray(): Array<T>
        /**
         * 从当前集合中删除指定集合中的所有元素
         * @param other 
         */
        exceptWith(other: Array<T>): void
        /**
         * 修改当前Set对象，使其只包含该对象和指定数组中的元素
         * @param other 
         */
        intersectWith(other: Array<T>): void
        /**
         * 修改当前的集合对象，使其包含所有存在于自身、指定集合中的元素，或者两者都包含
         * @param other 
         */
        unionWith(other: Array<T>): void
        isSubsetOf(other: Array<T>): boolean
        isSupersetOf(other: Array<T>): boolean
        overlaps(other: Array<T>): boolean
        setEquals(other: Array<T>): boolean
    }

    interface IBucketsWithCount<T> {
        Buckets: Array<Array<T>>
        Count: number
    }

    abstract class Set<T> implements ISet<T> {
        protected buckets: T[][];
        protected count: number;
        constructor(source?: Array<T>) {
            this.clear();
            if (source)
                source.forEach(value => {
                    this.add(value);
                });
        }
        abstract getHashCode(item: T): number;
        abstract areEqual(value1: T, value2: T): boolean;

        add(item: T) {
            let hashCode = this.getHashCode(item);
            let bucket = this.buckets[hashCode];
            if (bucket === undefined) {
                let newBucket = new Array<T>();
                newBucket.push(item);
                this.buckets[hashCode] = newBucket;
                this.count = this.count + 1;
                return true;
            }
            if (bucket.some((value) => this.areEqual(value,item)))
                return false;
            bucket.push(item);
            this.count = this.count + 1;
            return true;
        };

        remove(item: T) {
            let hashCode = this.getHashCode(item);
            let bucket = this.buckets[hashCode];
            if (bucket === undefined) {
                return false;
            }
            let result = false;
            let newBucket = new Array<T>();
            bucket.forEach((value) => {
                if (!this.areEqual(value, item))
                    newBucket.push(item);
                else
                    result = true;
            });
            this.buckets[hashCode] = newBucket;
            if (result)
                this.count = this.count - 1;
            return result;
        }

        contains(item: T) {
            return this.bucketsContains(this.buckets, item)
        };

        getCount() {
            return this.count;
        }

        clear() {
            this.buckets = new Array<Array<T>>();
            this.count = 0;
        }

        toArray() {
            let result = new Array<T>()
            this.buckets.forEach(value => {
                value.forEach(inner => {
                    result.push(inner);
                });
            });
            return result;
        }

        /**
         * 从当前集合中删除指定集合中的所有元素
         * @param other 
         */
        exceptWith(other: Array<T>) {
            if (other) {
                other.forEach(value => {
                    this.remove(value);
                })
            }
        }
        /**
         * 修改当前Set对象，使其只包含该对象和指定数组中的元素
         * @param other 
         */
        intersectWith(other: Array<T>) {            
            if (other) {
                let otherBuckets = this.buildInternalBuckets(other);
                this.toArray().forEach(value => {
                    if (!this.bucketsContains(otherBuckets.Buckets, value))
                        this.remove(value);
                });
            }
            else {
                this.clear();
            }
        }

        unionWith(other: Array<T>) {
            other.forEach(value => {
                this.add(value);
            });
        }

        isSubsetOf(other: Array<T>) {

            let otherBuckets = this.buildInternalBuckets(other);
            return this.toArray().every(value => this.bucketsContains(otherBuckets.Buckets, value));

        }
        isSupersetOf(other: Array<T>) {
            return other.every(value => this.contains(value));
        }

        overlaps(other: Array<T>) {
            return other.some(value => this.contains(value));
        }

        setEquals(other: Array<T>) {
            let otherBuckets = this.buildInternalBuckets(other);
            if (otherBuckets.Count !== this.count)
                return false
            return other.every(value => this.contains(value));
        }

        private buildInternalBuckets(source: Array<T>): IBucketsWithCount<T> {
            let internalBuckets = new Array<Array<T>>();
            let internalCount = 0;
            source.forEach(item=> {
                let hashCode = this.getHashCode(item);
                let bucket = internalBuckets[hashCode];
                if (bucket === undefined) {
                    let newBucket = new Array<T>();
                    newBucket.push(item);
                    internalBuckets[hashCode] = newBucket;
                    internalCount = internalCount + 1;
                }
                else if (!bucket.some((value) => this.areEqual(value, item))) {
                    bucket.push(item);
                    internalCount = internalCount + 1;
                }
            });
            return { Buckets: internalBuckets, Count: internalCount };
        }

        private bucketsContains(internalBuckets: Array<Array<T>>, item: T) {
            let hashCode = this.getHashCode(item);
            let bucket = internalBuckets[hashCode];
            if (bucket === undefined) {
                return false;
            }
            return bucket.some((value) => this.areEqual(value, item));
        }
    }

    export class HashSet<T extends IEqualityComparable> extends Set<T> {
        constructor(source?: Array<T>) {
            super(source)
        }
        getHashCode(item: T) {
            return item.getHashCode();
        }
        areEqual(value1: T, value2: T) {
            return value1.equals(value2);
        }
    }
}