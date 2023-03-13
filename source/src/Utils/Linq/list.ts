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
         * 使用指定的累加器函数将数组中的所有元素聚合成一个值。
         * @param accumulator 用于计算聚合值的累加器函数。
         * @param initialValue 可选参数，用于指定累加器函数的初始值。
         * @returns 聚合后的值。
         */
        public aggregate<U>(
            accumulator: (accum: U, value?: T, index?: number, list?: T[]) => any,
            initialValue?: U
        ): any {
            return this._elements.reduce(accumulator, initialValue);
        }

        /**
         * 判断当前列表中的所有元素是否都满足指定条件
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {boolean} 如果列表中的所有元素都满足条件，则返回 true；否则返回 false
         */
        public all(predicate: PredicateType<T>): boolean {
            // 调用 every 方法，传入谓词函数，检查列表中的所有元素是否都满足条件
            return this._elements.every(predicate);
        }

        /**
         * 该方法用于判断数组中是否存在元素
         * @param predicate 可选参数，用于检查是否有至少一个元素满足该函数
         * @returns 如果存在元素，返回 true；如果不存在元素，返回 false
         */
        public any(predicate?: (element: T) => boolean): boolean {
            // 如果 predicate 函数提供了，则使用 some() 方法判断是否有任意元素满足该函数
            if (predicate) {
                return this._elements.some(predicate);
            }
            // 如果没有提供 predicate 函数，则检查数组的长度是否大于 0
            return this._elements.length > 0;
        }

        /**
         * 计算数组中所有元素的平均值
         * @param transform 可选参数，用于将数组中的每个元素转换成另外的值进行计算
         * @returns 数组的平均值
         */
        public average(
            transform?: (value?: T, index?: number, list?: T[]) => any
        ): number {
            // 调用 sum() 方法计算数组中所有元素的和
            const sum = this.sum(transform);
            // 调用 count() 方法计算数组中元素的个数
            const count = this.count(transform);
            // 如果元素的个数为 0，则返回 NaN
            if (count === 0) {
                return NaN;
            }
            // 计算数组的平均值并返回
            return sum / count;
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
         * 计算数组中所有元素的数量，或者根据指定的条件计算符合条件的元素的数量。
         * @param predicate 可选参数，用于过滤元素的条件函数。
         * @returns 数组元素的数量。
         */
        public count(): number
        public count(predicate: PredicateType<T>): number
        public count(predicate?: PredicateType<T>): number {
            return predicate ? this.where(predicate).count() : this._elements.length;
        }

        /**
         * 返回当前数组，如果当前数组为空，则返回一个只包含默认值的新数组。
         * @param defaultValue 默认值。
         * @returns 当前数组，或者只包含默认值的新数组。
         */
        public defaultIfEmpty(defaultValue?: T): List<T> {
            return this.count() ? this : new List<T>([defaultValue]);
        }

        /**
         * 根据指定的键选择器从数组中去除重复的元素。
         * @param keySelector 用于选择每个元素的键的函数。
         * @returns 去重后的数组。
         */
        public distinctBy(keySelector: (key: T) => string | number): List<T> {
            const groups = this.groupBy(keySelector); // 根据键选择器对数组进行分组。
            return Object.keys(groups).reduce((res, key) => { // 遍历分组后的对象。
                res.add(groups[key][0] as T); // 将每组的第一个元素加入结果集合。
                return res;
            }, new List<T>()); // 返回结果集合。
        }

        /**
         * 根据指定的索引获取数组中的元素
         * @param index 要获取的元素的索引
         * @returns 数组中的元素
         * @throws {Error} 如果索引小于 0 或大于等于数组长度，则抛出 "ArgumentOutOfRangeException" 异常。
         */
        public elementAt(index: number): T {
            if (index < this.count() && index >= 0) {
                return this._elements[index];
            } else {
                throw new Error(
                    'ArgumentOutOfRangeException: index is less than 0 or greater than or equal to the number of elements in source.'
                );
            }
        }

        /**
         * 获取指定索引处的元素，如果索引超出数组范围，则返回 null。
         * @param index 索引。
         * @returns 指定索引处的元素，如果索引超出数组范围，则返回 null。
         */
        public elementAtOrDefault(index: number): T | null {
            return index < this.count() && index >= 0 ? this._elements[index] : null;
        }

        /**
         * 返回当前数组中不在指定数组中的元素集合。
         * @param source 指定数组。
         * @returns 当前数组中不在指定数组中的元素集合。
         */
        public except(source: List<T>): List<T> {
            return this.where(x => !source.contains(x));
        }

        /**
         * 返回当前数组中第一个元素，或者符合条件的第一个元素。
         * @param predicate 符合条件的判断函数。
         * @returns 当前数组中第一个元素，或者符合条件的第一个元素。
         */
        public first(): T;
        public first(predicate: PredicateType<T>): T;
        public first(predicate?: PredicateType<T>): T {
            if (this.count()) {
                return predicate ? this.where(predicate).first() : this._elements[0];
            } else {
                throw new Error('InvalidOperationException: The source sequence is empty.');
            }
        }

        /**
         * 根据指定的条件查询数组中第一个符合条件的元素，如果不存在符合条件的元素，则返回默认值 null 或 undefined。
         * @param predicate 可选参数，表示查询条件的谓词函数
         * @returns 符合条件的元素或默认值 null 或 undefined
         */
        public firstOrDefault(): T
        public firstOrDefault(predicate: PredicateType<T>): T
        public firstOrDefault(predicate?: PredicateType<T>): T {
            return this.count(predicate) ? this.first(predicate) : undefined;
        }

        /**
         * 对数组中的每个元素执行指定的操作
         * @param action 要执行的操作，可以是一个函数或函数表达式
         */
        public forEach(action: (value?: T, index?: number, list?: T[]) => any): void {
            return this._elements.forEach(action);
        }

        /**
         * 根据指定的键对数组元素进行分组，并返回一个包含分组结果的对象
         * @param grouper 指定的键，用于分组
         * @param mapper 可选参数，用于对分组后的每个元素进行转换的函数
         * @returns 包含分组结果的对象，其中键为分组后的键，值为分组后的元素组成的数组
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
                return ac;
            }, initialValue);
        }

        /**
         * 将两个数组进行联接和分组操作
         * @param list 要联接的数组
         * @param key1 用于从第一个数组中选择分组键的函数
         * @param key2 用于从第二个数组中选择分组键的函数
         * @param result 用于将分组结果映射到输出元素的函数
         * @returns 经过联接和分组后的新数组
         */
        public groupJoin<U, R>(
            list: List<U>,
            key1: (k: T) => any,
            key2: (k: U) => any,
            result: (first: T, second: List<U>) => R
        ): List<R> {
            // 使用 select() 方法对第一个数组中的每个元素进行分组操作
            return this.select(x =>
                // 调用 result 函数将分组结果映射到输出元素
                result(
                    x,
                    // 使用 where() 方法从第二个数组中选择符合条件的元素，然后使用 List 对象进行包装
                    list.where(z => key1(x) === key2(z))
                )
            );
        }

        /**
         * 返回当前列表中指定元素的索引
         * @param element 要查找的元素
         * @returns {number} 元素在列表中的索引值，如果不存在，则返回 -1
         */
        public indexOf(element: T): number {
            // 调用 indexOf 方法，查找元素在列表中的索引值，如果不存在，则返回 -1
            return this._elements.indexOf(element);
        }

        /**
         * 在数组的指定位置插入一个元素
         * @param index 要插入元素的位置
         * @param element 要插入的元素
         * @throws 如果索引超出了数组的范围，则抛出异常
         */
        public insert(index: number, element: T): void {
            // 如果索引小于 0 或大于数组长度，则抛出异常
            if (index < 0 || index > this._elements.length) {
                throw new Error('Index is out of range.');
            }

            // 使用 splice() 方法在指定位置插入元素
            this._elements.splice(index, 0, element);
        }

        /**
         * 获取当前列表和另一个列表的交集
         * @param source 另一个列表
         * @returns {List<T>} 一个包含两个列表中相同元素的新列表对象
         */
        public intersect(source: List<T>): List<T> {
            // 调用 where 方法，传入一个谓词函数，返回一个包含两个列表中相同元素的新列表对象
            return this.where(x => source.contains(x));
        }

        /**
         * 将当前列表和另一个列表中的元素进行联接
         * @param list 另一个列表
         * @param key1 当前列表的键选择器函数
         * @param key2 另一个列表的键选择器函数
         * @param result 结果选择器函数
         * @returns {List<R>} 一个包含联接后元素的新列表对象
         */
        public join<U, R>(
            list: List<U>,
            key1: (key: T) => any,
            key2: (key: U) => any,
            result: (first: T, second: U) => R
        ): List<R> {
            // 对当前列表中的每个元素调用 selectMany 方法，并传入一个返回值为列表的函数，最终返回一个新的列表对象
            return this.selectMany(x =>
                // 调用 list.where 方法，传入一个谓词函数，返回一个包含与当前元素匹配的元素的新列表对象
                list.where(y => key2(y) === key1(x)).select(z => result(x, z))
            );
        }

        /**
         * 返回数组的最后一个元素或满足条件的最后一个元素
         * @param predicate 可选参数，用于筛选元素的函数
         * @returns 数组的最后一个元素或满足条件的最后一个元素
         * @throws 如果数组为空，则抛出异常
         */
        public last(predicate?: PredicateType<T>): T {
            // 如果数组不为空
            if (this.count()) {
                // 如果提供了 predicate 函数，则使用 where() 方法进行筛选，并递归调用 last() 方法
                if (predicate) {
                    return this.where(predicate).last();
                } else {
                    // 否则，直接返回数组的最后一个元素
                    return this._elements[this.count() - 1];
                }
            } else {
                // 如果数组为空，则抛出异常
                throw Error('InvalidOperationException: The source sequence is empty.');
            }
        }

        /**
         * 返回数组的最后一个元素或满足条件的最后一个元素，如果数组为空或没有满足条件的元素，则返回默认值 undefined
         * @param predicate 可选参数，用于筛选元素的函数
         * @returns 数组的最后一个元素或满足条件的最后一个元素，如果数组为空或没有满足条件的元素，则返回默认值 undefined
         */
        public lastOrDefault(predicate?: PredicateType<T>): T {
            // 如果数组中存在满足条件的元素，则返回最后一个满足条件的元素；否则，返回 undefined
            return this.count(predicate) ? this.last(predicate) : undefined;
        }

        /**
         * 返回数组中的最大值，也可以通过 selector 函数对数组元素进行转换后再求最大值
         * @param selector 可选参数，用于对数组元素进行转换的函数
         * @returns 数组中的最大值，或者通过 selector 函数对数组元素进行转换后求得的最大值
         */
        public max(selector?: (value: T, index: number, array: T[]) => number): number {
            // 定义一个默认的转换函数 id，用于当 selector 参数未指定时使用
            const id = x => x;
            // 使用 map() 方法对数组元素进行转换，并使用 Math.max() 方法求得最大值
            return Math.max(...this._elements.map(selector || id));
        }

        /**
         * 返回数组中的最小值，也可以通过 selector 函数对数组元素进行转换后再求最小值
         * @param selector 可选参数，用于对数组元素进行转换的函数
         * @returns 数组中的最小值，或者通过 selector 函数对数组元素进行转换后求得的最小值
         */
        public min(selector?: (value: T, index: number, array: T[]) => number): number {
            // 定义一个默认的转换函数 id，用于当 selector 参数未指定时使用
            const id = x => x;
            // 使用 map() 方法对数组元素进行转换，并使用 Math.min() 方法求得最小值
            return Math.min(...this._elements.map(selector || id));
        }

        /**
         * 根据指定的类型，筛选数组中的元素并返回一个新的数组
         * @param type 指定的类型
         * @returns 新的数组，其中包含了数组中所有指定类型的元素
         */
        public ofType<U>(type: any): List<U> {
            let typeName: string;
            // 使用 switch 语句根据指定类型设置 typeName 变量
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
                    typeName = typeof function () {
                    }; // 空函数，不做任何操作
                    break;
                default:
                    typeName = null;
                    break;
            }
            // 如果 typeName 为 null，则使用 "instanceof" 运算符检查类型；否则，使用 typeof 运算符检查类型
            return typeName === null
                ? this.where(x => x instanceof type).cast<U>()
                : this.where(x => typeof x === typeName).cast<U>();
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
         * 按照指定的键选择器和比较器，对列表元素进行降序排序
         * @param keySelector 用于选择排序键的函数
         * @param comparer 可选参数，用于比较元素的函数，如果未指定则使用 keySelector 和降序排序
         * @returns 排序后的新 List<T> 对象
         */
        public orderByDescending(
            keySelector: (key: T) => any,
            comparer = keyComparer(keySelector, true)
        ): List<T> {
            // 使用 Array.slice() 方法复制数组元素，避免修改原数组
            const elementsCopy = this._elements.slice();

            // 根据 keySelector 和 comparer 排序元素
            elementsCopy.sort(comparer);

            // 创建新的 OrderedList<T> 对象并返回
            return new OrderedList<T>(elementsCopy, comparer);
        }

        /**
         * 在已经按照一个或多个条件排序的列表上，再按照一个新的条件进行排序
         * @param keySelector 用于选择新排序键的函数
         * @returns 排序后的新 List<T> 对象
         */
        public thenBy(keySelector: (key: T) => any): List<T> {
            // 调用 orderBy 方法，使用 keySelector 函数对列表进行排序，并返回排序后的新列表
            return this.orderBy(keySelector);
        }

        /**
         * 对当前列表中的元素进行降序排序
         * @param keySelector 键选择器函数，用于对列表中的每个元素进行转换
         * @returns {List<T>} 一个包含排序后元素的新列表对象
         */
        public thenByDescending(keySelector: (key: T) => any): List<T> {
            // 调用 orderByDescending 方法，传入键选择器函数，对当前列表中的元素进行降序排序，并返回一个新的列表对象
            return this.orderByDescending(keySelector);
        }

        /**
         * 从当前列表中删除指定元素
         * @param element 要删除的元素
         * @returns {boolean} 如果删除成功，则返回 true，否则返回 false
         */
        public remove(element: T): boolean {
            // 调用 indexOf 方法，查找元素在列表中的索引值
            const index = this.indexOf(element);
            // 如果元素存在，则调用 removeAt 方法将其从列表中删除，并返回 true，否则返回 false
            return index !== -1 ? (this.removeAt(index), true) : false;
        }

        /**
         * 从当前列表中删除满足指定条件的所有元素，并返回一个新的列表对象
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {List<T>} 一个包含不满足条件的元素的新列表对象
         */
        public removeAll(predicate: PredicateType<T>): List<T> {
            // 调用 negate 函数对谓词函数进行取反，然后使用 where 方法筛选出不满足条件的元素
            const elements = this.where(negate(predicate as any)).toArray();
            // 创建一个新的列表对象，包含不满足条件的元素，并返回该对象
            return new List<T>(elements);
        }

        /**
         * 从当前列表中删除指定索引位置的元素
         * @param index 要删除的元素在列表中的索引值
         */
        public removeAt(index: number): void {
            // 使用 splice 方法，传入要删除的元素在列表中的索引值和要删除的元素个数，以从列表中删除指定索引位置的元素
            this._elements.splice(index, 1);
        }

        /**
         * 反转当前列表中的元素顺序
         * @returns {List<T>} 一个包含反转后元素的新列表对象
         */
        public reverse(): List<T> {
            // 调用 reverse 方法，反转当前列表中的元素顺序，并使用这些反转后的元素创建一个新的列表对象
            return new List<T>(this._elements.reverse());
        }

        /**
         * 对数组中的每个元素进行转换，生成新的数组
         * @param selector 将数组中的每个元素转换成另外的值
         * @returns 新的 List 对象，包含转换后的元素
         */
        public select<TOut>(
            selector: (element: T, index: number) => TOut
        ): List<TOut> {
            // 使用 map() 方法对数组中的每个元素进行转换，生成新的数组
            const transformedArray = this._elements.map(selector);
            // 将新数组封装成 List 对象并返回
            return new List<TOut>(transformedArray);
        }

        /**
         * 对数组中的每个元素进行转换，并将多个新数组合并成一个数组
         * @param selector 将数组中的每个元素转换成新的数组
         * @returns 合并后的新数组
         */
        public selectMany<TOut extends List<any>>(
            selector: (element: T, index: number) => TOut
        ): TOut {
            // 使用 aggregate() 方法对数组中的每个元素进行转换，并将多个新数组合并成一个数组
            return this.aggregate(
                (accumulator, _, index) => {
                    // 获取当前元素对应的新数组
                    const selectedArray = this.select(selector).elementAt(index);
                    // 将新数组中的所有元素添加到累加器中
                    return accumulator.addRange(selectedArray.toArray());
                },
                new List<TOut>()
            );
        }

        /**
         * 比较当前列表和指定列表是否相等
         * @param list 要比较的列表对象
         * @returns {boolean} 如果列表相等，则返回 true，否则返回 false
         */
        public sequenceEqual(list: List<T>): boolean {
            // 调用 all 方法，传入一个谓词函数，用于对当前列表中的每个元素进行评估
            // 在谓词函数中调用 contains 方法，传入当前元素和指定列表对象，以检查当前元素是否存在于指定列表中
            // 如果当前列表中的所有元素都存在于指定列表中，则返回 true，否则返回 false
            return this.all(e => list.contains(e));
        }

        /**
         * 从当前列表中获取一个满足指定条件的唯一元素
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {T} 列表中唯一满足指定条件的元素
         * @throws {Error} 如果列表中不恰好包含一个满足指定条件的元素，则抛出异常
         */
        public single(predicate?: PredicateType<T>): T {
            // 调用 count 方法，传入谓词函数，以获取满足指定条件的元素个数
            const count = this.count(predicate);
            // 如果元素个数不等于 1，则抛出异常
            if (count !== 1) {
                throw new Error('The collection does not contain exactly one element.');
            }
            // 调用 first 方法，传入谓词函数，以获取唯一元素并返回
            return this.first(predicate);
        }

        /**
         * 从当前列表中获取一个满足指定条件的唯一元素，如果没有元素满足条件，则返回默认值 undefined
         * @param predicate 谓词函数，用于对列表中的每个元素进行评估
         * @returns {T} 列表中唯一满足指定条件的元素，如果没有元素满足条件，则返回默认值 undefined
         */
        public singleOrDefault(predicate?: PredicateType<T>): T {
            // 如果元素个数为真值，则调用 single 方法，传入谓词函数，以获取唯一元素并返回
            // 否则，返回默认值 undefined
            return this.count(predicate) ? this.single(predicate) : undefined;
        }

        /**
         * 从 List 的开头跳过指定数量的元素并返回剩余元素的新 List。
         * 如果指定数量大于 List 中的元素数，则返回一个空的 List。
         * @param amount 要跳过的元素数量
         * @returns 新 List
         */
        public skip(amount: number): List<T> {
            return new List<T>(this._elements.slice(Math.max(0, amount)))
        }

        /**
         * 返回由源 List 中除了最后指定数量的元素之外的所有元素组成的 List。
         * @param amount 要跳过的元素数。
         * @returns 由源 List 中除了最后指定数量的元素之外的所有元素组成的 List。
         */
        public skipLast(amount: number): List<T> {
            return new List<T>(this._elements.slice(0, -Math.max(0, amount)));
        }

        /**
         * 从 List 的开头开始，跳过符合指定谓词的元素，并返回剩余元素。
         * @param predicate 用于测试每个元素是否应跳过的函数。
         * @returns 一个新 List，包含源 List 中从跳过元素之后到末尾的元素。
         */
        public skipWhile(predicate: PredicateType<T>): List<T> {
            // aggregate() 函数接收一个函数作为参数，将该函数应用于 List 的每个元素，并在每次应用后返回一个累加器的值。
            // 此处使用 aggregate() 函数来计算从 List 的开头开始符合指定谓词的元素个数。
            return this.skip(
                this.aggregate(ac => (predicate(this.elementAt(ac)) ? ++ac : ac), 0)
            );
        }

        /**
         * 计算数组中所有元素的和
         * @param transform 可选参数，用于将数组中的每个元素转换成另外的值进行计算
         * @returns 数组的和
         */
        public sum(
            transform?: (value?: T, index?: number, list?: T[]) => number
        ): number {
            // 如果提供了 transform 函数，则使用 select() 方法将每个元素转换成新的值，并调用 sum() 方法计算新数组的和
            if (transform) {
                return this.select(transform).sum();
            }
            // 如果没有提供 transform 函数，则使用 aggregate() 方法计算数组的和
            // 这里使用加号 + 将元素转换为数值型
            return this.aggregate((ac, v) => (ac += +v), 0);
        }

        /**
         * 从 List 的开头返回指定数量的连续元素。
         * @param amount 要返回的元素数量
         * @returns 一个新的 List，其中包含原始 List 中开头的指定数量的元素
         */
        public take(amount: number): List<T> {
            // 使用 slice() 函数截取原始 List 中的指定数量的元素
            return new List<T>(this._elements.slice(0, Math.max(0, amount)));
        }

        /**
         * 从列表末尾开始获取指定数量的元素，返回一个新的 List 对象。
         * @param amount 需要获取的元素数量。
         * @returns 一个新的 List 对象，包含从末尾开始的指定数量的元素。
         */
        public takeLast(amount: number): List<T> {
            // Math.max(0, amount) 确保 amount 大于 0，如果 amount 是负数，则返回 0。
            // slice() 方法从数组的指定位置开始提取元素，返回一个新的数组。
            // 此处使用 slice() 方法返回 List 中末尾指定数量的元素。
            return new List<T>(this._elements.slice(-Math.max(0, amount)));
        }

        /**
         * 从 List 的开头开始取出符合指定谓词的元素，直到不符合为止，返回这些元素组成的 List。
         * @param predicate 用于测试每个元素是否符合条件的函数。
         * @returns 符合条件的元素组成的 List。
         */
        public takeWhile(predicate: PredicateType<T>): List<T> {
            // aggregate() 函数接收一个函数作为参数，将该函数应用于 List 的每个元素，并在每次应用后返回一个累加器的值。
            // 此处使用 aggregate() 函数来计算从 List 的开头开始符合指定谓词的元素个数。
            return this.take(
                this.aggregate(ac => (predicate(this.elementAt(ac)) ? ++ac : ac), 0)
            );
        }

        /**
         * 复制列表中的元素到一个新数组。
         */
        public toArray(): T[] {
            return this._elements;
        }

        /**
         * 将数组转换为字典，根据指定的键和值对元素进行分组并返回一个新的字典
         * @param key 指定的键，用于分组
         * @param value 可选参数，指定的值，用于分组后的元素的值；如果未指定，则默认使用原始元素
         * @returns 分组后的元素组成的新的字典
         */
        public toDictionary<TKey, TValue = T>(
            key: (key: T) => TKey,
            value?: (value: T) => TValue
        ): List<{ Key: TKey; Value: T | TValue }> {
            return this.aggregate((dicc, v, i) => {
                // 使用 select() 方法获取元素的键和值，并将其添加到字典中
                dicc[
                    this.select(key)
                        .elementAt(i)
                        .toString()
                    ] = value ? this.select(value).elementAt(i) : v;
                // 将键和值添加到结果列表中
                dicc.add({
                    Key: this.select(key).elementAt(i),
                    Value: value ? this.select(value).elementAt(i) : v
                });
                return dicc;
            }, new List<{ Key: TKey; Value: T | TValue }>());
        }

        /**
         * 将数组转换为一个 Set 对象
         * @returns Set 对象，其中包含了数组中的所有元素
         */
        public toSet() {
            let result = new Set();
            for (let x of this._elements)
                result.add(x);

            return result;
        }

        /**
         * 将数组转换为一个查找表，根据指定的键对元素进行分组并返回一个包含键值对的对象
         * @param keySelector 指定的键，用于分组
         * @param elementSelector 可选参数，指定的值，用于分组后的元素的值；如果未指定，则默认使用原始元素
         * @returns 包含键值对的对象，其中键为分组后的键，值为分组后的元素组成的数组
         */
        public toLookup<TResult>(
            keySelector: (key: T) => string | number,
            elementSelector: (element: T) => TResult
        ): { [key: string]: TResult[] } {
            return this.groupBy(keySelector, elementSelector);
        }

        /**
         * 根据指定的条件，筛选数组中的元素并返回一个新的数组
         * @param predicate 指定的条件
         * @returns 新的数组，其中包含了数组中所有满足条件的元素
         */
        public where(predicate: PredicateType<T>): List<T> {
            return new List<T>(this._elements.filter(predicate));
        }

        /**
         * 根据指定的函数将两个数组合并成一个新的数组
         * @param list 要合并的数组
         * @param result 指定的函数，用于将两个元素合并为一个
         * @returns 合并后的新数组
         */
        public zip<U, TOut>(
            list: List<U>,
            result: (first: T, second: U) => TOut
        ): List<TOut> {
            if (list.count() < this.count()) {
                // 如果要合并的数组的长度小于当前数组的长度，就使用要合并的数组的长度进行循环迭代
                return list.select((x, y) => result(this.elementAt(y), x));
            } else {
                // 如果要合并的数组的长度大于或等于当前数组的长度，就使用当前数组的长度进行循环迭代
                return this.select((x, y) => result(x, list.elementAt(y)));
            }
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
            this._elements.sort(this._comparer); // 对元素数组进行排序
        }

        /**
         * 按键按升序对序列中的元素执行后续排序。
         * @override
         */
        public thenBy(keySelector: (key: T) => any): List<T> {
            return new OrderedList(
                this._elements,
                composeComparers(this._comparer, keyComparer(keySelector, false))
            );
        }

        /**
         * 根据键值按降序对序列中的元素执行后续排序。
         * @override
         */
        public thenByDescending(keySelector: (key: T) => any): List<T> {
            return new OrderedList(
                this._elements,
                composeComparers(this._comparer, keyComparer(keySelector, true))
            );
        }
    }
}