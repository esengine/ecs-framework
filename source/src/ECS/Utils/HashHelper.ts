module es {
    export class HashHelpers {
        // 哈希冲突阈值，超过此值将使用另一种哈希算法
        public static readonly hashCollisionThreshold: number = 100;
        // 哈希值用于计算哈希表索引的质数
        public static readonly hashPrime: number = 101;
        // 一组预定义的质数，用于计算哈希表容量
        public static readonly primes = [
            3, 7, 11, 17, 23, 29, 37, 47, 59, 71, 89, 107, 131, 163, 197, 239, 293, 353, 431, 521, 631, 761, 919,
            1103, 1327, 1597, 1931, 2333, 2801, 3371, 4049, 4861, 5839, 7013, 8419, 10103, 12143, 14591,
            17519, 21023, 25229, 30293, 36353, 43627, 52361, 62851, 75431, 90523, 108631, 130363, 156437,
            187751, 225307, 270371, 324449, 389357, 467237, 560689, 672827, 807403, 968897, 1162687, 1395263,
            1674319, 2009191, 2411033, 2893249, 3471899, 4166287, 4999559, 5999471, 7199369
        ];
        // 可分配的最大数组长度，用于避免 OutOfMemoryException
        public static readonly maxPrimeArrayLength = 0x7FEFFFFD;

        /**
         * 判断一个数是否为质数
         * @param candidate 要判断的数
         * @returns 是否为质数
         */
        public static isPrime(candidate: number): boolean {
            if ((candidate & 1) !== 0) { // 位运算判断奇偶性
                let limit = Math.sqrt(candidate);
                for (let divisor = 3; divisor <= limit; divisor += 2) { // 奇数因子判断
                    if ((candidate % divisor) === 0) {
                        return false;
                    }
                }
                return true;
            }
            return (candidate === 2); // 2是质数
        }

        /**
         * 获取大于等于指定值的最小质数
         * @param min 指定值
         * @returns 大于等于指定值的最小质数
         */
        public static getPrime(min: number): number {
            if (min < 0) {
                throw new Error("参数错误 min 不能小于0");
            }

            for (let i = 0; i < this.primes.length; i++) {
                let prime = this.primes[i];
                if (prime >= min) {
                    return prime;
                }
            }

            // 在预定义的质数列表之外，需要计算最小的质数
            for (let i = (min | 1); i < Number.MAX_VALUE; i += 2) { // 从 min 向上计算奇数
                if (this.isPrime(i) && ((i - 1) % this.hashPrime !== 0)) { // i是质数且不是hashPrime的倍数
                    return i;
                }
            }
            return min;
        }

        /**
         * 扩展哈希表容量
         * @param oldSize 原哈希表容量
         * @returns 扩展后的哈希表容量
         */
        public static expandPrime(oldSize: number): number {
            let newSize = 2 * oldSize;

            // 在遇到容量溢出之前，允许哈希特表增长到最大可能的大小
            // 请注意，即使当_items.Length溢出时，这项检查也会起作用
            if (newSize > this.maxPrimeArrayLength && this.maxPrimeArrayLength > oldSize) {
                return this.maxPrimeArrayLength;
            }

            return this.getPrime(newSize);
        }

        /**
         * 计算字符串的哈希值
         * @param str 要计算哈希值的字符串
         * @returns 哈希值
         */
        public static getHashCode(str: string): number {
            let hash = 0;
            if (str.length === 0) {
                return hash;
            }
            for (let i = 0; i < str.length; i++) {
                let char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char; // 采用 FNV-1a 哈希算法
                hash = hash & hash; // 将hash值转换为32位整数
            }
            return hash;
        }
    }
}