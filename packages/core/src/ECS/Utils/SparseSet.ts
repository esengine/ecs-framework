/**
 * 稀疏集合实现
 *
 * 提供O(1)的插入、删除、查找操作，同时保持数据的紧凑存储。
 * 使用密集数组存储实际数据，稀疏映射提供快速访问
 *
 * @template T 存储的数据类型
 *
 * @example
 * ```typescript
 * const sparseSet = new SparseSet<Entity>();
 *
 * sparseSet.add(entity1);
 * sparseSet.add(entity2);
 *
 * if (sparseSet.has(entity1)) {
 *     sparseSet.remove(entity1);
 * }
 *
 * sparseSet.forEach((entity, index) => {
 *     console.log(`Entity at index ${index}: ${entity.name}`);
 * });
 * ```
 */
export class SparseSet<T> {
    /**
     * 密集存储数组
     *
     * 连续存储所有有效数据，确保遍历时的缓存友好性。
     */
    private _dense: T[] = [];

    /**
     * 稀疏映射表
     *
     * 将数据项映射到密集数组中的索引，提供O(1)的查找性能。
     */
    private _sparse = new Map<T, number>();

    /**
     * 添加元素到集合
     *
     * @param item 要添加的元素
     * @returns 是否成功添加（false表示元素已存在）
     */
    public add(item: T): boolean {
        if (this._sparse.has(item)) {
            return false; // 元素已存在
        }

        const index = this._dense.length;
        this._dense.push(item);
        this._sparse.set(item, index);
        return true;
    }

    /**
     * 从集合中移除元素
     *
     * 使用swap-and-pop技术保持数组紧凑性：
     * 1. 将要删除的元素与最后一个元素交换
     * 2. 删除最后一个元素
     * 3. 更新映射表
     *
     * @param item 要移除的元素
     * @returns 是否成功移除（false表示元素不存在）
     */
    public remove(item: T): boolean {
        const index = this._sparse.get(item);
        if (index === undefined) {
            return false; // 元素不存在
        }

        const lastIndex = this._dense.length - 1;

        // 如果不是最后一个元素，则与最后一个元素交换
        if (index !== lastIndex) {
            const lastItem = this._dense[lastIndex]!;
            this._dense[index] = lastItem;
            this._sparse.set(lastItem, index);
        }

        // 移除最后一个元素
        this._dense.pop();
        this._sparse.delete(item);
        return true;
    }

    /**
     * 检查元素是否存在于集合中
     *
     * @param item 要检查的元素
     * @returns 元素是否存在
     */
    public has(item: T): boolean {
        return this._sparse.has(item);
    }

    /**
     * 获取元素在密集数组中的索引
     *
     * @param item 要查询的元素
     * @returns 索引，如果元素不存在则返回undefined
     */
    public getIndex(item: T): number | undefined {
        return this._sparse.get(item);
    }

    /**
     * 根据索引获取元素
     *
     * @param index 索引
     * @returns 元素，如果索引无效则返回undefined
     */
    public getByIndex(index: number): T | undefined {
        return this._dense[index];
    }

    /**
     * 获取集合大小
     */
    public get size(): number {
        return this._dense.length;
    }

    /**
     * 检查集合是否为空
     */
    public get isEmpty(): boolean {
        return this._dense.length === 0;
    }

    /**
     * 遍历集合中的所有元素
     *
     * 保证遍历顺序与添加顺序一致（除非中间有删除操作）。
     * 遍历性能优秀，因为数据在内存中连续存储。
     *
     * @param callback 遍历回调函数
     */
    public forEach(callback: (item: T, index: number) => void): void {
        for (let i = 0; i < this._dense.length; i++) {
            callback(this._dense[i]!, i);
        }
    }

    /**
     * 映射集合中的所有元素
     *
     * @param callback 映射回调函数
     * @returns 映射后的新数组
     */
    public map<U>(callback: (item: T, index: number) => U): U[] {
        const result: U[] = [];
        for (let i = 0; i < this._dense.length; i++) {
            result.push(callback(this._dense[i]!, i));
        }
        return result;
    }

    /**
     * 过滤集合中的元素
     *
     * @param predicate 过滤条件
     * @returns 满足条件的元素数组
     */
    public filter(predicate: (item: T, index: number) => boolean): T[] {
        const result: T[] = [];
        for (let i = 0; i < this._dense.length; i++) {
            if (predicate(this._dense[i]!, i)) {
                result.push(this._dense[i]!);
            }
        }
        return result;
    }

    /**
     * 查找第一个满足条件的元素
     *
     * @param predicate 查找条件
     * @returns 找到的元素，如果没有则返回undefined
     */
    public find(predicate: (item: T, index: number) => boolean): T | undefined {
        for (let i = 0; i < this._dense.length; i++) {
            if (predicate(this._dense[i]!, i)) {
                return this._dense[i];
            }
        }
        return undefined;
    }

    /**
     * 检查是否存在满足条件的元素
     *
     * @param predicate 检查条件
     * @returns 是否存在满足条件的元素
     */
    public some(predicate: (item: T, index: number) => boolean): boolean {
        for (let i = 0; i < this._dense.length; i++) {
            if (predicate(this._dense[i]!, i)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查是否所有元素都满足条件
     *
     * @param predicate 检查条件
     * @returns 是否所有元素都满足条件
     */
    public every(predicate: (item: T, index: number) => boolean): boolean {
        for (let i = 0; i < this._dense.length; i++) {
            if (!predicate(this._dense[i]!, i)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 获取密集数组的只读副本
     *
     * 返回数组的浅拷贝，确保外部无法直接修改内部数据。
     */
    public getDenseArray(): readonly T[] {
        return [...this._dense];
    }

    /**
     * 获取密集数组的直接引用（内部使用）
     *
     * 警告：直接修改返回的数组会破坏数据结构的完整性。
     * 仅在性能关键场景下使用，并确保不会修改数组内容。
     */
    public getDenseArrayUnsafe(): readonly T[] {
        return this._dense;
    }

    /**
     * 清空集合
     */
    public clear(): void {
        this._dense.length = 0;
        this._sparse.clear();
    }

    /**
     * 转换为数组
     */
    public toArray(): T[] {
        return [...this._dense];
    }

    /**
     * 转换为Set
     */
    public toSet(): Set<T> {
        return new Set(this._dense);
    }

    /**
     * 获取内存使用统计信息
     */
    public getMemoryStats(): {
        denseArraySize: number;
        sparseMapSize: number;
        totalMemory: number;
        } {
        const denseArraySize = this._dense.length * 8; // 估计每个引用8字节
        const sparseMapSize = this._sparse.size * 16;  // 估计每个Map条目16字节

        return {
            denseArraySize,
            sparseMapSize,
            totalMemory: denseArraySize + sparseMapSize
        };
    }

    /**
     * 验证数据结构的完整性
     *
     * 调试用方法，检查内部数据结构是否一致。
     */
    public validate(): boolean {
        // 检查大小一致性
        if (this._dense.length !== this._sparse.size) {
            return false;
        }

        // 检查映射关系的正确性
        for (let i = 0; i < this._dense.length; i++) {
            const item = this._dense[i]!;
            const mappedIndex = this._sparse.get(item);
            if (mappedIndex !== i) {
                return false;
            }
        }

        // 检查稀疏映射中的所有项都在密集数组中
        for (const [item, index] of this._sparse) {
            if (index >= this._dense.length || this._dense[index] !== item) {
                return false;
            }
        }

        return true;
    }
}
