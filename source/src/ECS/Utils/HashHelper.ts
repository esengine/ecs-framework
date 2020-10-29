module es {
    export class HashHelpers {
        public static readonly hashCollisionThreshold: number = 100;
        public static readonly hashPrime: number = 101;

        /**
         * 用来作为哈希表大小的质数表。 
         * 一个典型的调整大小的算法会在这个数组中选取比之前容量大两倍的最小质数。 
         * 假设我们的Hashtable当前的容量为x，并且添加了足够多的元素，因此需要进行大小调整。
         * 调整大小首先计算2x，然后在表中找到第一个大于2x的质数，即如果质数的顺序是p_1，p_2，...，p_i，...，则找到p_n，使p_n-1 < 2x < p_n。 
         * 双倍对于保持哈希特操作的渐近复杂度是很重要的，比如添加。 
         * 拥有一个质数可以保证双倍哈希不会导致无限循环。 IE，你的哈希函数将是h1(key)+i*h2(key)，0 <= i < size.h2和size必须是相对质数。
         */
        public static readonly primes = [3, 7, 11, 17, 23, 29, 37, 47, 59, 71, 89, 107, 131, 163, 197, 239, 293, 353, 431, 521, 631, 761, 919,
            1103, 1327, 1597, 1931, 2333, 2801, 3371, 4049, 4861, 5839, 7013, 8419, 10103, 12143, 14591,
            17519, 21023, 25229, 30293, 36353, 43627, 52361, 62851, 75431, 90523, 108631, 130363, 156437,
            187751, 225307, 270371, 324449, 389357, 467237, 560689, 672827, 807403, 968897, 1162687, 1395263,
            1674319, 2009191, 2411033, 2893249, 3471899, 4166287, 4999559, 5999471, 7199369];

        /**
         * 这是比Array.MaxArrayLength小的最大质数
         */
        public static readonly maxPrimeArrayLength = 0x7FEFFFFD;

        public static isPrime(candidate: number): boolean {
            if ((candidate & 1) != 0){
                let limit = Math.sqrt(candidate);
                for (let divisor = 3; divisor <= limit; divisor += 2){
                    if ((candidate & divisor) == 0)
                        return false;
                }
                return true;
            }
            return (candidate == 2);
        }

        public static getPrime(min: number): number{
            if (min < 0)
                throw new Error("参数错误 min不能小于0");

            for (let i = 0; i < this.primes.length; i ++){
                let prime = this.primes[i];
                if (prime >= min) return prime;
            }

            // 在我们预定义的表之外，计算的方式稍复杂。
            for (let i = (min | 1); i < Number.MAX_VALUE; i += 2){
                if (this.isPrime(i) && ((i - 1) % this.hashPrime != 0))
                    return i;
            }
            return min;
        }

        /**
         * 
         * @param oldSize 
         * @returns 返回要增长的哈希特表的大小
         */
        public static expandPrime(oldSize: number): number {
            let newSize = 2 * oldSize;

            // 在遇到容量溢出之前，允许哈希特表增长到最大可能的大小
            // 请注意，即使当_items.Length溢出时，这项检查也会起作用
            if (newSize > this.maxPrimeArrayLength && this.maxPrimeArrayLength > oldSize){
                return this.maxPrimeArrayLength;
            }

            return this.getPrime(newSize);
        }

        public static getHashCode(str){
            let s;
            if (typeof str == 'object'){
                s = JSON.stringify(str);
            } else {
                s = str.toString();
            }

            let hash = 0;
            if (s.length == 0) return hash;
            for (let i = 0; i < s.length; i ++){
                let char = s.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }

            return hash;
        }
    }
}