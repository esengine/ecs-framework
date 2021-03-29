module es {
    type PredicateType<T> = (value?: T, index?: number, list?: T[]) => boolean

    export class List<T> {
        protected _elements: T[];

        /**
         * 默认为列表的元素
         */
        constructor(elements: T[] = []) {
            this._elements = elements
        }

        /**
         * 在列表的末尾添加一个对象。
         */
        public add(element: T): void {
            this._elements.push(element)
        }

        /**
         * 将一个对象追加到列表的末尾。
         */
        public append(element: T): void {
            this.add(element)
        }

        /**
         * 在列表的开头添加一个对象。
         */
        public prepend(element: T): void {
            this._elements.unshift(element)
        }

        /**
         * 将指定集合的元素添加到列表的末尾。
         */
        public addRange(elements: T[]): void {
            this._elements.push(...elements)
        }

        /**
         * 对序列应用累加器函数。
         */
        public aggregate<U>(
            accumulator: (accum: U, value?: T, index?: number, list?: T[]) => any,
            initialValue?: U
        ): any {
            return this._elements.reduce(accumulator, initialValue)
        }

        /**
         * 确定序列的所有元素是否满足一个条件。
         */
        public all(predicate: PredicateType<T>): boolean {
            return this._elements.every(predicate)
        }

        /**
         * 确定序列是否包含任何元素。
         */
        public any(): boolean
        public any(predicate: PredicateType<T>): boolean
        public any(predicate?: PredicateType<T>): boolean {
            return predicate
                ? this._elements.some(predicate)
                : this._elements.length > 0
        }

        /**
         * 计算通过对输入序列的每个元素调用转换函数获得的一系列数值的平均值。
         */
        public average(): number
        public average(
            transform: (value?: T, index?: number, list?: T[]) => any
        ): number
        public average(
            transform?: (value?: T, index?: number, list?: T[]) => any
        ): number {
            return this.sum(transform) / this.count(transform)
        }

        /**
         * 将序列的元素转换为指定的类型。
         */
        public cast<U>(): List<U> {
            return new List<U>(this._elements as any)
        }

        /**
         * 从列表中删除所有元素。
         */
        public clear(): void {
            this._elements.length = 0
        }

        /**
         * 连接两个序列。
         */
        public concat(list: List<T>): List<T> {
            return new List<T>(this._elements.concat(list.toArray()))
        }

        /**
         * 确定一个元素是否在列表中。
         */
        public contains(element: T): boolean {
            return this.any(x => x === element)
        }

        /**
         * 返回序列中元素的数量。
         */
        public count(): number
        public count(predicate: PredicateType<T>): number
        public count(predicate?: PredicateType<T>): number {
            return predicate ? this.where(predicate).count() : this._elements.length
        }

        /**
         * 返回指定序列的元素，或者如果序列为空，则返回单例集合中类型参数的默认值。
         */
        public defaultIfEmpty(defaultValue?: T): List<T> {
            return this.count() ? this : new List<T>([defaultValue])
        }

        /**
         * 根据指定的键选择器从序列中返回不同的元素。
         */
        public distinctBy(keySelector: (key: T) => string | number): List<T> {
            const groups = this.groupBy(keySelector);
            return Object.keys(groups).reduce((res, key) => {
                res.add(groups[key][0] as T);
                return res
            }, new List<T>())
        }

        /**
         * 返回序列中指定索引处的元素。
         */
        public elementAt(index: number): T {
            if (index < this.count() && index >= 0) {
                return this._elements[index]
            } else {
                throw new Error(
                    'ArgumentOutOfRangeException: index is less than 0 or greater than or equal to the number of elements in source.'
                )
            }
        }

        /**
         * 返回序列中指定索引处的元素，如果索引超出范围，则返回默认值。
         */
        public elementAtOrDefault(index: number): T | null {
            return index < this.count() && index >= 0
                ? this._elements[index]
                : undefined
        }

        /**
         * 通过使用默认的相等比较器来比较值，生成两个序列的差值集。
         */
        public except(source: List<T>): List<T> {
            return this.where(x => !source.contains(x))
        }

        /**
         * 返回序列的第一个元素。
         */
        public first(): T
        public first(predicate: PredicateType<T>): T
        public first(predicate?: PredicateType<T>): T {
            if (this.count()) {
                return predicate ? this.where(predicate).first() : this._elements[0]
            } else {
                throw new Error(
                    'InvalidOperationException: The source sequence is empty.'
                )
            }
        }

        /**
         * 返回序列的第一个元素，如果序列不包含元素，则返回默认值。
         */
        public firstOrDefault(): T
        public firstOrDefault(predicate: PredicateType<T>): T
        public firstOrDefault(predicate?: PredicateType<T>): T {
            return this.count(predicate) ? this.first(predicate) : undefined
        }

        /**
         * 对列表中的每个元素执行指定的操作。
         */
        public forEach(action: (value?: T, index?: number, list?: T[]) => any): void {
            return this._elements.forEach(action)
        }

        /**
         * 根据指定的键选择器函数对序列中的元素进行分组。
         */
        public groupBy<TResult>(
            grouper: (key: T) => string | number,
            mapper: (element: T) => TResult = val => (val as any) as TResult
        ): { [key: string]: TResult[] } {
            const initialValue: { [key: string]: TResult[] } = {};
            return this.aggregate((ac, v: any) => {
                const key = grouper(v);
                const existingGroup = ac[key];
                const mappedValue = mapper(v);
                existingGroup
                    ? existingGroup.push(mappedValue)
                    : (ac[key] = [mappedValue]);
                return ac
            }, initialValue)
        }

        /**
         * 根据键的相等将两个序列的元素关联起来，并将结果分组。默认的相等比较器用于比较键。
         */
        public groupJoin<U, R>(
            list: List<U>,
            key1: (k: T) => any,
            key2: (k: U) => any,
            result: (first: T, second: List<U>) => R
        ): List<R> {
            return this.select(x =>
                result(
                    x,
                    list.where(z => key1(x) === key2(z))
                )
            )
        }

        /**
         * 返回列表中某个元素第一次出现的索引。
         */
        public indexOf(element: T): number {
            return this._elements.indexOf(element)
        }

        /**
         * 向列表中插入一个元素在指定索引处。
         */
        public insert(index: number, element: T): void | Error {
            if (index < 0 || index > this._elements.length) {
                throw new Error('Index is out of range.')
            }

            this._elements.splice(index, 0, element)
        }

        /**
         * 通过使用默认的相等比较器来比较值，生成两个序列的交集集。
         */
        public intersect(source: List<T>): List<T> {
            return this.where(x => source.contains(x))
        }

        /**
         * 基于匹配的键将两个序列的元素关联起来。默认的相等比较器用于比较键。
         */
        public join<U, R>(
            list: List<U>,
            key1: (key: T) => any,
            key2: (key: U) => any,
            result: (first: T, second: U) => R
        ): List<R> {
            return this.selectMany(x =>
                list.where(y => key2(y) === key1(x)).select(z => result(x, z))
            )
        }

        /**
         * 返回序列的最后一个元素。
         */
        public last(): T
        public last(predicate: PredicateType<T>): T
        public last(predicate?: PredicateType<T>): T {
            if (this.count()) {
                return predicate
                    ? this.where(predicate).last()
                    : this._elements[this.count() - 1]
            } else {
                throw Error('InvalidOperationException: The source sequence is empty.')
            }
        }

        /**
         * 返回序列的最后一个元素，如果序列不包含元素，则返回默认值。
         */
        public lastOrDefault(): T
        public lastOrDefault(predicate: PredicateType<T>): T
        public lastOrDefault(predicate?: PredicateType<T>): T {
            return this.count(predicate) ? this.last(predicate) : undefined
        }

        /**
         * 返回泛型序列中的最大值。
         */
        public max(): number
        public max(selector: (value: T, index: number, array: T[]) => number): number
        public max(
            selector?: (value: T, index: number, array: T[]) => number
        ): number {
            const id = x => x;
            return Math.max(...this._elements.map(selector || id))
        }

        /**
         * 返回泛型序列中的最小值。
         */
        public min(): number
        public min(selector: (value: T, index: number, array: T[]) => number): number
        public min(
            selector?: (value: T, index: number, array: T[]) => number
        ): number {
            const id = x => x;
            return Math.min(...this._elements.map(selector || id))
        }

        /**
         * 根据指定的类型筛选序列中的元素。
         */
        public ofType<U>(type: any): List<U> {
            let typeName;
            switch (type) {
                case Number:
                    typeName = typeof 0;
                    break;
                case String:
                    typeName = typeof '';
                    break;
                case Boolean:
                    typeName = typeof true;
                    break;
                case Function:
                    typeName = typeof function () { }; // tslint:disable-line no-empty
                    break;
                default:
                    typeName = null;
                    break
            }
            return typeName === null
                ? this.where(x => x instanceof type).cast<U>()
                : this.where(x => typeof x === typeName).cast<U>()
        }

        /**
         * 根据键按升序对序列中的元素进行排序。
         */
        public orderBy(
            keySelector: (key: T) => any,
            comparer = keyComparer(keySelector, false)
        ): List<T> {
            // tslint:disable-next-line: no-use-before-declare
            return new OrderedList<T>(this._elements, comparer)
        }

        /**
         * 根据键值降序对序列中的元素进行排序。
         */
        public orderByDescending(
            keySelector: (key: T) => any,
            comparer = keyComparer(keySelector, true)
        ): List<T> {
            // tslint:disable-next-line: no-use-before-declare
            return new OrderedList<T>(this._elements, comparer)
        }

        /**
         * 按键按升序对序列中的元素执行后续排序。
         */
        public thenBy(keySelector: (key: T) => any): List<T> {
            return this.orderBy(keySelector)
        }

        /**
         * 根据键值按降序对序列中的元素执行后续排序。
         */
        public thenByDescending(keySelector: (key: T) => any): List<T> {
            return this.orderByDescending(keySelector)
        }

        /**
         * 从列表中删除第一个出现的特定对象。
         */
        public remove(element: T): boolean {
            return this.indexOf(element) !== -1
                ? (this.removeAt(this.indexOf(element)), true)
                : false
        }

        /**
         * 删除与指定谓词定义的条件匹配的所有元素。
         */
        public removeAll(predicate: PredicateType<T>): List<T> {
            return this.where(negate(predicate as any))
        }

        /**
         * 删除列表指定索引处的元素。
         */
        public removeAt(index: number): void {
            this._elements.splice(index, 1)
        }

        /**
         * 颠倒整个列表中元素的顺序。
         */
        public reverse(): List<T> {
            return new List<T>(this._elements.reverse())
        }

        /**
         * 将序列中的每个元素投射到一个新形式中。
         */
        public select<TOut>(
            selector: (element: T, index: number) => TOut
        ): List<TOut> {
            return new List<TOut>(this._elements.map(selector))
        }

        /**
         * 将序列的每个元素投影到一个列表中。并将得到的序列扁平化为一个序列。
         */
        public selectMany<TOut extends List<any>>(
            selector: (element: T, index: number) => TOut
        ): TOut {
            return this.aggregate(
                (ac, _, i) => (
                    ac.addRange(
                        this.select(selector)
                            .elementAt(i)
                            .toArray()
                    ),
                    ac
                ),
                new List<TOut>()
            )
        }

        /**
         * 通过使用默认的相等比较器对元素的类型进行比较，确定两个序列是否相等。
         */
        public sequenceEqual(list: List<T>): boolean {
            return this.all(e => list.contains(e))
        }

        /**
         * 返回序列中唯一的元素，如果序列中没有恰好一个元素，则抛出异常。
         */
        public single(predicate?: PredicateType<T>): T {
            if (this.count(predicate) !== 1) {
                throw new Error('The collection does not contain exactly one element.')
            } else {
                return this.first(predicate)
            }
        }

        /**
         * 返回序列中唯一的元素，如果序列为空，则返回默认值;如果序列中有多个元素，此方法将抛出异常。
         */
        public singleOrDefault(predicate?: PredicateType<T>): T {
            return this.count(predicate) ? this.single(predicate) : undefined
        }

        /**
         * 绕过序列中指定数量的元素，然后返回剩余的元素。
         */
        public skip(amount: number): List<T> {
            return new List<T>(this._elements.slice(Math.max(0, amount)))
        }

        /**
         * 省略序列中最后指定数量的元素，然后返回剩余的元素。
         */
        public skipLast(amount: number): List<T> {
            return new List<T>(this._elements.slice(0, -Math.max(0, amount)))
        }

        /**
         * 只要指定条件为真，就绕过序列中的元素，然后返回剩余的元素。
         */
        public skipWhile(predicate: PredicateType<T>): List<T> {
            return this.skip(
                this.aggregate(ac => (predicate(this.elementAt(ac)) ? ++ac : ac), 0)
            )
        }

        /**
         * 计算通过对输入序列的每个元素调用转换函数获得的数值序列的和。
         */
        public sum(): number
        public sum(
            transform: (value?: T, index?: number, list?: T[]) => number
        ): number
        public sum(
            transform?: (value?: T, index?: number, list?: T[]) => number
        ): number {
            return transform
                ? this.select(transform).sum()
                : this.aggregate((ac, v) => (ac += +v), 0)
        }

        /**
         * 从序列的开始返回指定数量的连续元素。
         */
        public take(amount: number): List<T> {
            return new List<T>(this._elements.slice(0, Math.max(0, amount)))
        }

        /**
         * 从序列的末尾返回指定数目的连续元素。
         */
        public takeLast(amount: number): List<T> {
            return new List<T>(this._elements.slice(-Math.max(0, amount)))
        }

        /**
         * 返回序列中的元素，只要指定的条件为真。
         */
        public takeWhile(predicate: PredicateType<T>): List<T> {
            return this.take(
                this.aggregate(ac => (predicate(this.elementAt(ac)) ? ++ac : ac), 0)
            )
        }

        /**
         * 复制列表中的元素到一个新数组。
         */
        public toArray(): T[] {
            return this._elements
        }

        /**
         * 创建一个<dictionary>从List< T>根据指定的键选择器函数。
         */
        public toDictionary<TKey>(
            key: (key: T) => TKey
        ): List<{ Key: TKey; Value: T }>
        public toDictionary<TKey, TValue>(
            key: (key: T) => TKey,
            value: (value: T) => TValue
        ): List<{ Key: TKey; Value: T | TValue }>
        public toDictionary<TKey, TValue>(
            key: (key: T) => TKey,
            value?: (value: T) => TValue
        ): List<{ Key: TKey; Value: T | TValue }> {
            return this.aggregate((dicc, v, i) => {
                dicc[
                    this.select(key)
                        .elementAt(i)
                        .toString()
                ] = value ? this.select(value).elementAt(i) : v;
                dicc.add({
                    Key: this.select(key).elementAt(i),
                    Value: value ? this.select(value).elementAt(i) : v
                });
                return dicc
            }, new List<{ Key: TKey; Value: T | TValue }>())
        }

        /**
         * 创建一个Set从一个Enumerable.List< T>。
         */
        public toSet() {
            let result = new Set();
            for (let x of this._elements)
                result.add(x);

            return result;
        }

        /**
         * 创建一个List< T>从一个Enumerable.List< T>。
         */
        public toList(): List<T> {
            return this
        }

        /**
         * 创建一个查找，TElement>从一个IEnumerable< T>根据指定的键选择器和元素选择器函数。
         */
        public toLookup<TResult>(
            keySelector: (key: T) => string | number,
            elementSelector: (element: T) => TResult
        ): { [key: string]: TResult[] } {
            return this.groupBy(keySelector, elementSelector)
        }

        /**
         * 基于谓词过滤一系列值。
         */
        public where(predicate: PredicateType<T>): List<T> {
            return new List<T>(this._elements.filter(predicate))
        }

        /**
         * 将指定的函数应用于两个序列的对应元素，生成结果序列。
         */
        public zip<U, TOut>(
            list: List<U>,
            result: (first: T, second: U) => TOut
        ): List<TOut> {
            return list.count() < this.count()
                ? list.select((x, y) => result(this.elementAt(y), x))
                : this.select((x, y) => result(x, list.elementAt(y)))
        }
    }

    /**
     * 表示已排序的序列。该类的方法是通过使用延迟执行来实现的。
     * 即时返回值是一个存储执行操作所需的所有信息的对象。
     * 在通过调用对象的ToDictionary、ToLookup、ToList或ToArray方法枚举对象之前，不会执行由该方法表示的查询
     */
    export class OrderedList<T> extends List<T> {
        constructor(elements: T[], private _comparer: (a: T, b: T) => number) {
            super(elements);
            this._elements.sort(this._comparer)
        }

        /**
         * 按键按升序对序列中的元素执行后续排序。
         * @override
         */
        public thenBy(keySelector: (key: T) => any): List<T> {
            return new OrderedList(
                this._elements,
                composeComparers(this._comparer, keyComparer(keySelector, false))
            )
        }

        /**
         * 根据键值按降序对序列中的元素执行后续排序。
         * @override
         */
        public thenByDescending(keySelector: (key: T) => any): List<T> {
            return new OrderedList(
                this._elements,
                composeComparers(this._comparer, keyComparer(keySelector, true))
            )
        }
    }
}