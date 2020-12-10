module es {
    /**
     * 创建这个字典的原因只有一个：
     * 我需要一个能让我直接以数组的形式对值进行迭代的字典，而不需要生成一个数组或使用迭代器。
     * 对于这个目标是比标准字典快N倍。
     * Faster dictionary在大部分操作上也比标准字典快，但差别可以忽略不计。
     * 唯一较慢的操作是在添加时调整内存大小，因为与标准数组相比，这个实现需要使用两个单独的数组。
     */
    export class FasterDictionary<TKey, TValue> {
        public _values: TValue[];
        public _valuesInfo: FastNode[];
        public _buckets: number[];
        public _freeValueCellIndex: number = 0;
        public _collisions: number = 0;

        constructor(size: number = 1) {
            this._valuesInfo = new Array(size);
            this._values = new Array(size);
            this._buckets = new Array(HashHelpers.getPrime(size));
        }

        public getValuesArray(count: {value: number}): TValue[] {
            count.value = this._freeValueCellIndex;

            return this._values;
        }

        public get valuesArray(): TValue[] {
            return this._values;
        }

        public get count(): number {
            return this._freeValueCellIndex;
        }

        public add(key: TKey, value: TValue) {
            if (!this.addValue(key, value, {value: 0}))
                throw new Error("key 已经存在")
        }

        public addValue(key: TKey, value: TValue, indexSet: {value: number}) {
            let hash = HashHelpers.getHashCode(key);
            let bucketIndex = FasterDictionary.reduce(hash, this._buckets.length);

            if (this._freeValueCellIndex == this._values.length) {
                let expandPrime = HashHelpers.expandPrime(this._freeValueCellIndex);

                this._values.length = expandPrime;
                this._valuesInfo.length = expandPrime;
            }

            // buckets值-1表示它是空的
            let valueIndex = NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;

            if (valueIndex == -1) {
                // 在最后一个位置创建信息节点，并填入相关信息
                this._valuesInfo[this._freeValueCellIndex] = new FastNode(key, hash);
            } else {
                {
                    let currentValueIndex = valueIndex;
                    do {
                        // 必须检查键是否已经存在于字典中
                        if (this._valuesInfo[currentValueIndex].hashcode == hash &&
                            this._valuesInfo[currentValueIndex].key == key) {
                            // 键已经存在，只需将其值替换掉即可
                            this._values[currentValueIndex] = value;
                            indexSet.value = currentValueIndex;
                            return false;
                        }

                        currentValueIndex = this._valuesInfo[currentValueIndex].previous;
                    }
                    while (currentValueIndex != -1); // -1表示没有更多的值与相同的哈希值的键
                }

                this._collisions++;
                // 创建一个新的节点，该节点之前的索引指向当前指向桶的节点
                this._valuesInfo[this._freeValueCellIndex] = new FastNode(key, hash, valueIndex);
                // 更新现有单元格的下一个单元格指向新的单元格，旧的单元格 -> 新的单元格 -> 旧的单元格 <- 下一个单元格
                this._valuesInfo[valueIndex].next = this._freeValueCellIndex;
            }
            // 重要的是：新的节点总是被桶单元格指向的那个节点，所以我可以假设被桶指向的那个节点总是最后添加的值(next = -1)
            // item与这个bucketIndex将指向最后创建的值 
            // TODO: 如果相反，我假设原来的那个是bucket中的那个，我就不需要在这里更新bucket了
            this._buckets[bucketIndex] = (this._freeValueCellIndex + 1);

            this._values[this._freeValueCellIndex] = value;
            indexSet.value = this._freeValueCellIndex;

            this._freeValueCellIndex++;

            if (this._collisions > this._buckets.length) {
                // 我们需要更多的空间和更少的碰撞
                this._buckets = new Array(HashHelpers.expandPrime(this._collisions));
                this._collisions = 0;
                // 我们需要得到目前存储的所有值的哈希码，并将它们分布在新的桶长上
                for (let newValueIndex = 0; newValueIndex < this._freeValueCellIndex; newValueIndex++) {
                    // 获取原始哈希码，并根据新的长度找到新的bucketIndex
                    bucketIndex = FasterDictionary.reduce(this._valuesInfo[newValueIndex].hashcode, this._buckets.length);
                    // bucketsIndex可以是-1或下一个值。
                    // 如果是-1意味着没有碰撞。
                    // 如果有碰撞，我们创建一个新节点，它的上一个指向旧节点。
                    // 旧节点指向新节点，新节点指向旧节点，旧节点指向新节点，现在bucket指向新节点，这样我们就可以重建linkedlist.
                    // 获取当前值Index，如果没有碰撞，则为-1。
                    let existingValueIndex = NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;
                    // 将bucket索引更新为共享bucketIndex的当前项目的索引（最后找到的总是bucket中的那个）
                    this._buckets[bucketIndex] = newValueIndex + 1;
                    if (existingValueIndex != -1) {
                        // 这个单元格已经指向了新的bucket list中的一个值，这意味着有一个碰撞，出了问题
                        this._collisions++;
                        // bucket将指向这个值，所以新的值将使用以前的索引
                        this._valuesInfo[newValueIndex].previous = existingValueIndex;
                        this._valuesInfo[newValueIndex].next = -1;
                        // 并将之前的下一个索引更新为新的索引
                        this._valuesInfo[existingValueIndex].next = newValueIndex;
                    } else {
                        // 什么都没有被索引，桶是空的。我们需要更新之前的 next 和 previous 的值。
                        this._valuesInfo[newValueIndex].next = -1;
                        this._valuesInfo[newValueIndex].previous = -1;
                    }
                }
            }

            return true;
        }

        public remove(key: TKey): boolean {
            let hash = FasterDictionary.hash(key);
            let bucketIndex = FasterDictionary.reduce(hash, this._buckets.length);

            // 找桶
            let indexToValueToRemove = NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;

            // 第一部分：在bucket list中寻找实际的键，如果找到了，我就更新bucket list，使它不再指向要删除的单元格。
            while (indexToValueToRemove != -1) {
                if (this._valuesInfo[indexToValueToRemove].hashcode == hash &&
                    this._valuesInfo[indexToValueToRemove].key == key) {
                    // 如果找到了密钥，并且桶直接指向了要删除的节点
                    if (this._buckets[bucketIndex] - 1 == indexToValueToRemove){
                        if (this._valuesInfo[indexToValueToRemove].next != -1)
                            throw new Error("如果 bucket 指向单元格，那么 next 必须不存在。");
                        
                        // 如果前一个单元格存在，它的下一个指针必须被更新!
                        //<---迭代顺序  
                        // B(ucket总是指向最后一个)
                        // ------- ------- -------
                        // 1 | | | | 2 | | | 3 | //bucket不能有下一个，只能有上一个。
                        // ------- ------- -------
                        //--> 插入
                        let value = this._valuesInfo[indexToValueToRemove].previous;
                        this._buckets[bucketIndex] = value + 1;
                    }else{
                        if (this._valuesInfo[indexToValueToRemove].next == -1)
                            throw new Error("如果 bucket 指向另一个单元格，则 NEXT 必须存在");
                    }

                    FasterDictionary.updateLinkedList(indexToValueToRemove, this._valuesInfo);

                    break;
                }

                indexToValueToRemove = this._valuesInfo[indexToValueToRemove].previous;
            }

            if (indexToValueToRemove == -1)
                return false;   // 未找到

            this._freeValueCellIndex --; // 少了一个需要反复计算的值

            // 第二部分
            // 这时节点指针和水桶会被更新，但_values数组会被更新仍然有要删除的值
            // 这个字典的目标是能够做到像数组一样对数值进行迭代，所以数值数组必须始终是最新的

            // 如果要删除的单元格是列表中的最后一个，我们可以执行较少的操作（不需要交换），否则我们要将最后一个值的单元格移到要删除的值上。
            if (indexToValueToRemove != this._freeValueCellIndex){
                // 我们可以将两个数组的最后一个值移到要删除的数组中。
                // 为了做到这一点，我们需要确保 bucket 指针已经更新了
                // 首先我们在桶列表中找到指向要移动的单元格的指针的索引
                let movingBucketIndex = FasterDictionary.reduce(this._valuesInfo[this._freeValueCellIndex].hashcode, this._buckets.length);

                // 如果找到了键，并且桶直接指向要删除的节点，现在必须指向要移动的单元格。
                if (this._buckets[movingBucketIndex] - 1 == this._freeValueCellIndex)
                    this._buckets[movingBucketIndex] = (indexToValueToRemove + 1);

                // 否则意味着有多个键具有相同的哈希值（碰撞），所以我们需要更新链接列表和它的指针
                let next = this._valuesInfo[this._freeValueCellIndex].next;
                let previous = this._valuesInfo[this._freeValueCellIndex].previous;

                // 现在它们指向最后一个值被移入的单元格
                if (next != -1)
                    this._valuesInfo[next].previous = indexToValueToRemove;
                if (previous != -1)
                    this._valuesInfo[previous].next = indexToValueToRemove;

                // 最后，实际上是移动值
                this._valuesInfo[indexToValueToRemove] = this._valuesInfo[this._freeValueCellIndex];
                this._values[indexToValueToRemove] = this._values[this._freeValueCellIndex];
            }

            return true;
        }

        public trim(){
            let expandPrime = HashHelpers.expandPrime(this._freeValueCellIndex);

            if (expandPrime < this._valuesInfo.length){
                this._values.length = expandPrime;
                this._valuesInfo.length = expandPrime;
            }
        }

        public clear(){
            if (this._freeValueCellIndex == 0) return;

            this._freeValueCellIndex = 0;
            this._buckets.length = 0;
            this._values.length = 0;
            this._valuesInfo.length = 0;
        }

        public fastClear(){
            if (this._freeValueCellIndex == 0) return;

            this._freeValueCellIndex = 0;

            this._buckets.length = 0;
            this._valuesInfo.length = 0;
        }

        public containsKey(key: TKey){
            if (this.tryFindIndex(key, {value: 0})){
                return true;
            }

            return false;
        }

        public tryGetValue(key: TKey): TValue {
            let findIndex = {value: 0};
            if (this.tryFindIndex(key, findIndex)){
                return this._values[findIndex.value];
            }

            return null;
        }

        public tryFindIndex(key: TKey, findIndex: {value: number}){
            // 我把所有的索引都用偏移量+1来存储，这样在bucket list中0就意味着实际上不存在
            // 当读取时，偏移量必须再偏移-1才是真实的
            // 这样我就避免了将数组初始化为-1
            let hash = FasterDictionary.hash(key);
            let bucketIndex = FasterDictionary.reduce(hash, this._buckets.length);

            let valueIndex = NumberExtension.toNumber(this._buckets[bucketIndex]) - 1;

            // 即使我们找到了一个现有的值，我们也需要确定它是我们所要求的值
            while (valueIndex != -1){
                if (this._valuesInfo[valueIndex].hashcode == hash && this._valuesInfo[valueIndex].key == key){
                    findIndex.value = valueIndex;
                    return true;
                }

                valueIndex = this._valuesInfo[valueIndex].previous;
            }

            findIndex.value = 0;
            return false;
        }

        public getDirectValue(index: number): TValue {
            return this._values[index];
        }

        public getIndex(key: TKey): number {
            let findIndex = {value: 0};
            if (this.tryFindIndex(key, findIndex))
                return findIndex.value;

            throw new Error("未找到key");
        }

        public static updateLinkedList(index: number, valuesInfo: FastNode[]){
            let next = valuesInfo[index].next;
            let previous = valuesInfo[index].previous;

            if (next != -1)
                valuesInfo[next].previous = previous;
            if (previous != -1)
                valuesInfo[previous].next = next;
        }

        public static hash(key) {
            return HashHelpers.getHashCode(key);
        }

        public static reduce(x: number, n: number) {
            if (x >= n)
                return x % n;

            return x;
        }
    }

    export class FastNode {
        readonly key;
        readonly hashcode: number;
        previous: number;
        next: number;

        constructor(key, hash: number, previousNode: number = -1) {
            this.key = key;
            this.hashcode = hash;
            this.previous = previousNode;
            this.next = -1;
        }
    }
}