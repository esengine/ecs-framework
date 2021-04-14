module es {
    /**
     * 这个类可以从两方面来考虑。你可以把它看成一个位向量或者一组非负整数。这个名字有点误导人。
     *
     * 它是由一个位向量实现的，但同样可以把它看成是一个非负整数的集合;集合中的每个整数由对应索引处的集合位表示。该结构的大小由集合中的最大整数决定。
     */
    export class BitSet {
        private static ADDRESS_BITS_PER_WORD = 5;
        private static BITS_PER_WORD = 1 << BitSet.ADDRESS_BITS_PER_WORD; // 32
        private static WORD_MASK : number = 0xffffffff;
        private words_: number[];

        constructor(nbits: number = 0) {
            this.words_ = [];
        }

        public clear(bitIndex?: number) {
            if (bitIndex === null) {
                const words = this.words_;
                let wordsInUse = words.length;
                while (wordsInUse > 0) {
                    words[--wordsInUse] = 0;
                }
                return;
            }
    
            const wordIndex = bitIndex >> BitSet.ADDRESS_BITS_PER_WORD;
            this.words_[wordIndex] &= ~(1 << bitIndex);
        }

        public get(bitIndex: number): boolean {
            const wordIndex = bitIndex >> BitSet.ADDRESS_BITS_PER_WORD;
            const words = this.words_;
            const wordsInUse = words.length;
    
            return wordIndex < wordsInUse && (words[wordIndex] & (1 << bitIndex)) != 0;
        }

        public intersects(set: BitSet) {
            const words = this.words_;
            const wordsInUse = words.length;

            for (let i = Math.min(wordsInUse, set.words_.length) - 1; i >= 0; i--)
                if ((words[i] & set.words_[i]) != 0) return true;
            return false;
        }

        public isEmpty(): boolean {
            return this.words_.length === 0;
        }

        public nextSetBit(fromIndex: number) {
            let u = fromIndex >> BitSet.ADDRESS_BITS_PER_WORD;
            const words = this.words_;
            const wordsInUse = words.length;

            let word = words[u] & (BitSet.WORD_MASK << fromIndex);
            while (true) {
                if (word !== 0) return u * BitSet.BITS_PER_WORD + this.numberOfTrailingZeros(word);
                if (++u === wordsInUse) return -1;
                word = words[u];
            }
        }

        private numberOfTrailingZeros(i: number): number {
            if (i == 0) return 64;
            let x: number = i;
            let y: number;
            let n = 63;
            y = x << 32;
            if (y != 0) {
                n -= 32;
                x = y;
            }
            y = x << 16;
            if (y != 0) {
                n -= 16;
                x = y;
            }
            y = x << 8;
            if (y != 0) {
                n -= 8;
                x = y;
            }
            y = x << 4;
            if (y != 0) {
                n -= 4;
                x = y;
            }
            y = x << 2;
            if (y != 0) {
                n -= 2;
                x = y;
            }
            return n - ((x << 1) >>> 63);
        }

        public set(bitIndex: number, value: boolean = true) {
            const wordIndex = bitIndex >> BitSet.ADDRESS_BITS_PER_WORD;
            const words = this.words_;
            const wordsInUse = words.length;
            const wordsRequired = wordIndex + 1;
    
            if (wordsInUse < wordsRequired) {
                words.length = Math.max(2 * wordsInUse, wordsRequired);
                for (let i = wordsInUse, l = words.length; i < l; i++) {
                    words[i] = 0;
                }
            }
    
            if (value) {
                return (words[wordIndex] |= 1 << bitIndex);
            } else {
                return (words[wordIndex] &= ~(1 << bitIndex));
            }
        }
    }
}
