module es {
    /**
     * 性能优化的位组实现。某些操作是以不安全为前缀的, 这些方法不执行验证，主要是在内部利用来优化实体ID位集的访问
     */
    export class BitVector {
        private words: number[] = [0];

        /**
         * 创建一个初始大小足够大的bitset，以明确表示0到nbits-1范围内指数的bit
         * @param nbits nbits 位集的初始大小
         */
        constructor(nbits?: number | BitVector) {
            if (nbits) {
                if (typeof nbits == 'number')
                    this.checkCapacity(nbits >>> 6);
                else {
                    // 基于另一个位向量创建一个位集
                    this.words = nbits.words.slice(0);
                }
            }
        }

        /**
         * 
         * @param index 位的索引
         * @returns 该位是否被设置
         */
        public get(index: number): boolean {
            const word = index >>> 6;
            return word < this.words.length &&
                (this.words[word] & (1 << index)) != 0;
        }

        /**
         * 
         * @param index 位的索引
         */
        public set(index: number, value: boolean = true) {
            if (value) {
                const word = index >>> 6;
                this.checkCapacity(word);
                this.words[word] |= 1 << index;
            } else {
                this.clear(index);
            }
        }

        /**
         * 
         * @param index 位的索引
         * @returns 该位是否被设置
         */
        public unsafeGet(index: number): boolean {
            return (this.words[index >>> 6] & (1 << index)) != 0;
        }

        /**
         * 
         * @param index 要设置的位的索引
         */
        public unsafeSet(index: number) {
            this.words[index >>> 6] |= 1 << index;
        }

        /**
         * 
         * @param index 要翻转的位的索引
         */
        public flip(index: number) {
            const word = index >>> 6;
            this.checkCapacity(word);
            this.words[word] ^= 1 << index;
        }

        /**
         * 要清除的位的索引
         * @param index 
         */
        public clear(index?: number) {
            if (index != null) {
                const word = index >>> 6;
                if (word >= this.words.length) return;
                this.words[word] &= ~(1 << index);
            } else {
                this.words.fill(0);
            }
        }

        /**
         * 返回该位组的 "逻辑大小"：位组中最高设置位的索引加1。如果比特集不包含集合位，则返回0
         */
        public length(): number {
            let bits = this.words.slice(0);
            for (let word = bits.length - 1; word >= 0; --word) {
                let bitsAtWord = bits[word];
                if (bitsAtWord != 0)
                    return (word << 6) + 64 - this.numberOfLeadingZeros(bitsAtWord);
            }

            return 0;
        }

        /**
         * @returns 如果这个位组中没有设置为true的位，则为true
         */
        public isEmpty(): boolean {
            let bits = this.words.slice(0);
            let length = bits.length;
            for (let i = 0; i < length; i++) {
                if (bits[i] != 0)
                    return false;
            }

            return true;
        }

        /**
         * 返回在指定的起始索引上或之后出现的第一个被设置为真的位的索引。
         * 如果不存在这样的位，则返回-1
         * @param fromIndex 
         */
        public nextSetBit(fromIndex: number): number {
            let word = fromIndex >>> 6;
            if (word >= this.words.length)
                return -1;

            let bitmap = this.words[word] >>> fromIndex;
            if (bitmap != 0)
                return fromIndex + this.numberOfTrailingZeros(bitmap);

            for (let i = 1 + word; i < this.words.length; i++) {
                bitmap = this.words[i];
                if (bitmap != 0) {
                    return i * 64 + this.numberOfTrailingZeros(bitmap);
                }
            }

            return -1;
        }

        /**
         * 返回在指定的起始索引上或之后发生的第一个被设置为false的位的索引
         * @param fromIndex 
         */
        public nextClearBit(fromIndex: number): number {
            let word = fromIndex >>> 6;
            if (word >= this.words.length)
                return Math.min(fromIndex, this.words.length << 6);

            let bitmap = ~(this.words[word] >>> fromIndex);
            if (bitmap != 0)
                return fromIndex + this.numberOfTrailingZeros(bitmap);

            for (let i = 1 + word; i < this.words.length; i++) {
                bitmap = ~this.words[i];
                if (bitmap != 0) {
                    return i * 64 + this.numberOfTrailingZeros(bitmap);
                }
            }

            return Math.min(fromIndex, this.words.length << 6);
        }

        /**
         * 对这个目标位集和参数位集进行逻辑AND。
         * 这个位集被修改，使它的每一个位都有值为真，如果且仅当它最初的值为真，并且位集参数中的相应位也有值为真
         * @param other 
         */
        public and(other: BitVector) {
            let commonWords = Math.min(this.words.length, other.words.length);
            for (let i = 0; commonWords > i; i++) {
                this.words[i] &= other.words[i];
            }

            if (this.words.length > commonWords) {
                for (let i = commonWords, s = this.words.length; s > i; i++) {
                    this.words[i] = 0;
                }
            }
        }

        /**
         * 清除该位集的所有位，其对应的位被设置在指定的位集中
         * @param other 
         */
        public andNot(other: BitVector) {
            let commonWords = Math.min(this.words.length, other.words.length);
            for (let i = 0; commonWords > i; i++)
                this.words[i] &= ~other.words[i];
        }

        /**
         * 用位集参数执行这个位集的逻辑OR。
         * 如果且仅当位集参数中的位已经有值为真或位集参数中的对应位有值为真时，该位集才会被修改，从而使位集中的位有值为真
         * @param other 
         */
        public or(other: BitVector) {
            let commonWords = Math.min(this.words.length, other.words.length);
            for (let i = 0; commonWords > i; i++)
                this.words[i] |= other.words[i];

            if (commonWords < other.words.length) {
                this.checkCapacity(other.words.length);
                for (let i = commonWords, s = other.words.length; s > i; i++) {
                    this.words[i] = other.words[i];
                }
            }
        }

        /**
         * 用位集参数对这个位集进行逻辑XOR。
         * 这个位集被修改了，所以如果且仅当以下语句之一成立时，位集中的一个位的值为真
         * @param other 
         */
        public xor(other: BitVector) {
            let commonWords = Math.min(this.words.length, other.words.length);

            for (let i = 0; commonWords > i; i++)
                this.words[i] ^= other.words[i];

            if (commonWords < other.words.length) {
                this.checkCapacity(other.words.length);
                for (let i = commonWords, s = other.words.length; s > i; i++) {
                    this.words[i] = other.words[i];
                }
            }
        }

        /**
         * 如果指定的BitVector有任何位被设置为true，并且在这个BitVector中也被设置为true，则返回true
         * @param other 
         */
        public intersects(other: BitVector): boolean {
            let bits = this.words.slice(0);
            let otherBits = other.words;
            for (let i = 0, s = Math.min(bits.length, otherBits.length); s > i; i++) {
                if ((bits[i] & otherBits[i]) != 0)
                    return true;
            }
            return false;
        }

        /**
         * 如果这个位集是指定位集的超级集，即它的所有位都被设置为真，那么返回true
         * @param other 
         */
        public containsAll(other: BitVector): boolean {
            let bits = this.words.slice(0);
            let otherBits = other.words;
            let otherBitsLength = otherBits.length;
            let bitsLength = bits.length;


            for (let i = bitsLength; i < otherBitsLength; i++) {
                if (otherBits[i] != 0) {
                    return false;
                }
            }

            for (let i = 0, s = Math.min(bitsLength, otherBitsLength); s > i; i++) {
                if ((bits[i] & otherBits[i]) != otherBits[i]) {
                    return false;
                }
            }

            return true;
        }

        public cardinality() {
            let count = 0;
            for (let i = 0; i < this.words.length; i++)
                count += this.bitCount(this.words[i]);

            return count;
        }

        public hashCode() {
            const word = this.length() >>> 6;
            let hash = 0;
            for (let i = 0; word >= i; i++)
                hash = 127 * hash + (this.words[i] ^ (this.words[i] >>> 32));
            return hash;
        }

        private bitCount(i: number) {
            i = i - ((i >>> 1) & 0x55555555);
            i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);
            i = (i + (i >>> 4)) & 0x0f0f0f0f;
            i = i + (i >>> 8);
            i = i + (i >>> 16);
            return i & 0x3f;
        }

        /**
         * 返回二进制补码二进制表示形式中最高位（“最左端”）一位之前的零位数量 
         * @param i 
         */
        private numberOfLeadingZeros(i: number) {
            if (i == 0) return 64;
            let n = 1;
            let x = i >>> 32;
            if (x == 0) { n += 32; x = i; }
            if (x >>> 16 == 0) { n += 16; x <<= 16; }
            if (x >>> 24 == 0) { n += 8; x <<= 8; }
            if (x >>> 28 == 0) { n += 4; x <<= 4; }
            if (x >>> 30 == 0) { n += 2; x <<= 2; }
            n -= x >>> 31;
            return n;
        }

        /**
         * 返回指定二进制数的补码二进制表示形式中最低序（“最右”）一位之后的零位数量 
         * @param i 
         */
        public numberOfTrailingZeros(i: number) {
            let x: number = 0, y: number = 0;
            if (i == 0) return 64;
            let n = 63;
            y = i; if (y != 0) { n = n - 32; x = y; } else x = (i >>> 32);
            y = x << 16; if (y != 0) { n = n - 16; x = y; }
            y = x << 8; if (y != 0) { n = n - 8; x = y; }
            y = x << 4; if (y != 0) { n = n - 4; x = y; }
            y = x << 2; if (y != 0) { n = n - 2; x = y; }
            return n - ((x << 1) >>> 31);
        }

        /**
         * 
         * @param index 要清除的位的索引
         */
        public unsafeClear(index: number) {
            this.words[index >>> 6] &= ~(1 << index);
        }

        /**
         * 增长支持数组，使其能够容纳所请求的位
         * @param bits 位数
         */
        public ensureCapacity(bits: number) {
            this.checkCapacity(bits >>> 6);
        }

        private checkCapacity(len: number) {
            if (len >= this.words.length) {
                let newBits: number[] = new Array(len + 1);
                for (let i = 0; i < this.words.length; i++) {
                    newBits[i] = this.words[i];
                }
                this.words = newBits;
            }
        }
    }
}