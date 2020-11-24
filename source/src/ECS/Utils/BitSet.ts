module es {
    /**
     * 这个类可以从两方面来考虑。你可以把它看成一个位向量或者一组非负整数。这个名字有点误导人。
     *
     * 它是由一个位向量实现的，但同样可以把它看成是一个非负整数的集合;集合中的每个整数由对应索引处的集合位表示。该结构的大小由集合中的最大整数决定。
     */
    export class BitSet {
        private static LONG_MASK: number = 0x3f;
        private _bits: number[];

        constructor(nbits: number = 64) {
            let length = nbits >> 6 >>> 0;
            if ((nbits & BitSet.LONG_MASK) != 0)
                length++;

            this._bits = new Array(length);
            this._bits.fill(0);
        }

        public and(bs: BitSet) {
            let max = Math.min(this._bits.length, bs._bits.length);
            let i;
            for (let i = 0; i < max; ++i)
                this._bits[i] &= bs._bits[i];

            while (i < this._bits.length)
                this._bits[i++] = 0;
        }

        public andNot(bs: BitSet) {
            let i = Math.min(this._bits.length, bs._bits.length);
            while (--i >= 0)
                this._bits[i] &= ~bs._bits[i];
        }

        public cardinality(): number {
            let card = 0 >>> 0;
            for (let i = this._bits.length - 1; i >= 0; i--) {
                let a = this._bits[i];

                if (a == 0)
                    continue;

                if (a == -1) {
                    card += 64;
                    continue;
                }

                a = ((a >> 1) & 0x5555555555555555) + (a & 0x5555555555555555);
                a = ((a >> 2) & 0x3333333333333333) + (a & 0x3333333333333333);
                let b = ((a >> 32) + a) >>> 0;
                b = ((b >> 4) & 0x0f0f0f0f) + (b & 0x0f0f0f0f);
                b = ((b >> 8) & 0x00ff00ff) + (b & 0x00ff00ff);
                card += ((b >> 16) & 0x0000ffff) + (b & 0x0000ffff);
            }

            return card;
        }

        public clear(pos?: number) {
            if (pos != undefined) {
                let offset = pos >> 6;
                this.ensure(offset);
                this._bits[offset] &= ~(1 << pos);
            } else {
                for (let i = 0; i < this._bits.length; i++)
                    this._bits[i] = 0;
            }
        }

        public get(pos: number): boolean {
            let offset = pos >> 6;
            if (offset >= this._bits.length)
                return false;

            return (this._bits[offset] & (1 << pos)) != 0;
        }

        public intersects(set: BitSet) {
            let i = Math.min(this._bits.length, set._bits.length);
            while (--i >= 0) {
                if ((this._bits[i] & set._bits[i]) != 0)
                    return true;
            }

            return false;
        }

        public isEmpty(): boolean {
            for (let i = this._bits.length - 1; i >= 0; i--) {
                if (this._bits[i])
                    return false;
            }

            return true;
        }

        public nextSetBit(from: number) {
            let offset = from >> 6;
            let mask = 1 << from;
            while (offset < this._bits.length) {
                let h = this._bits[offset];
                do {
                    if ((h & mask) != 0)
                        return from;

                    mask <<= 1;
                    from++;
                } while (mask != 0);

                mask = 1;
                offset++;
            }

            return -1;
        }

        public set(pos: number, value: boolean = true) {
            if (value) {
                let offset = pos >> 6;
                this.ensure(offset);
                this._bits[offset] |= 1 << pos;
            } else {
                this.clear(pos);
            }
        }

        private ensure(lastElt: number) {
            if (lastElt >= this._bits.length) {
                let startIndex = this._bits.length;
                this._bits.length = lastElt + 1;
                this._bits.fill(0, startIndex, lastElt + 1);
            }
        }
    }
}
