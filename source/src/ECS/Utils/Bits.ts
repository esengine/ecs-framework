/**
 * 高性能位操作类
 * 用于快速操作位数组，支持组件匹配等场景
 */
export class Bits {
    private _words: number[] = [];
    private static readonly WORD_SIZE = 32;

    constructor() {
        this._words = [];
    }

    /**
     * 设置指定位置的位为1
     * @param index 位置索引
     */
    public set(index: number): void {
        const wordIndex = Math.floor(index / Bits.WORD_SIZE);
        const bitIndex = index % Bits.WORD_SIZE;
        
        // 确保数组足够大
        while (this._words.length <= wordIndex) {
            this._words.push(0);
        }
        
        this._words[wordIndex] |= (1 << bitIndex);
    }

    /**
     * 清除指定位置的位（设为0）
     * @param index 位置索引
     */
    public clear(index: number): void {
        const wordIndex = Math.floor(index / Bits.WORD_SIZE);
        const bitIndex = index % Bits.WORD_SIZE;
        
        if (wordIndex < this._words.length) {
            this._words[wordIndex] &= ~(1 << bitIndex);
        }
    }

    /**
     * 获取指定位置的位值
     * @param index 位置索引
     * @returns 位值（true或false）
     */
    public get(index: number): boolean {
        const wordIndex = Math.floor(index / Bits.WORD_SIZE);
        const bitIndex = index % Bits.WORD_SIZE;
        
        if (wordIndex >= this._words.length) {
            return false;
        }
        
        return (this._words[wordIndex] & (1 << bitIndex)) !== 0;
    }

    /**
     * 检查是否包含所有指定的位
     * @param other 另一个Bits对象
     * @returns 如果包含所有位则返回true
     */
    public containsAll(other: Bits): boolean {
        const maxLength = Math.max(this._words.length, other._words.length);
        
        for (let i = 0; i < maxLength; i++) {
            const thisWord = i < this._words.length ? this._words[i] : 0;
            const otherWord = i < other._words.length ? other._words[i] : 0;
            
            if ((thisWord & otherWord) !== otherWord) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 检查是否包含任意一个指定的位
     * @param other 另一个Bits对象
     * @returns 如果包含任意位则返回true
     */
    public intersects(other: Bits): boolean {
        const minLength = Math.min(this._words.length, other._words.length);
        
        for (let i = 0; i < minLength; i++) {
            if ((this._words[i] & other._words[i]) !== 0) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 检查是否不包含任何指定的位
     * @param other 另一个Bits对象
     * @returns 如果不包含任何位则返回true
     */
    public excludes(other: Bits): boolean {
        return !this.intersects(other);
    }

    /**
     * 清空所有位
     */
    public clearAll(): void {
        this._words.length = 0;
    }

    /**
     * 检查是否为空（没有设置任何位）
     * @returns 如果为空则返回true
     */
    public isEmpty(): boolean {
        for (const word of this._words) {
            if (word !== 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * 获取设置的位数量
     * @returns 设置的位数量
     */
    public cardinality(): number {
        let count = 0;
        for (const word of this._words) {
            count += this.popCount(word);
        }
        return count;
    }

    /**
     * 计算一个32位整数中设置的位数量
     * @param n 32位整数
     * @returns 设置的位数量
     */
    private popCount(n: number): number {
        n = n - ((n >>> 1) & 0x55555555);
        n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
        return (((n + (n >>> 4)) & 0xF0F0F0F) * 0x1010101) >>> 24;
    }

    /**
     * 复制另一个Bits对象
     * @param other 要复制的Bits对象
     */
    public copyFrom(other: Bits): void {
        this._words = [...other._words];
    }

    /**
     * 创建当前Bits的副本
     * @returns 新的Bits对象
     */
    public clone(): Bits {
        const newBits = new Bits();
        newBits.copyFrom(this);
        return newBits;
    }
}