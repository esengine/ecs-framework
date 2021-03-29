module es {
    export class ArrayUtils {
        /**
         * 执行冒泡排序
         * @param ary
         */
        public static bubbleSort(ary: number[]): void {
            let isExchange: Boolean = false;
            for (let i: number = 0; i < ary.length; i++) {
                isExchange = false;
                for (let j: number = ary.length - 1; j > i; j--) {
                    if (ary[j] < ary[j - 1]) {
                        let temp: number = ary[j];
                        ary[j] = ary[j - 1];
                        ary[j - 1] = temp;
                        isExchange = true;
                    }
                }
                if (!isExchange)
                    break;
            }
        }
    
        /**
         * 执行插入排序
         * @param ary 
         */
        public static insertionSort(ary: number[]): void {
            let len: number = ary.length;
            for (let i: number = 1; i < len; i++) {
                let val: number = ary[i];
                for (var j: number = i; j > 0 && ary[j - 1] > val; j--) {
                    ary[j] = ary[j - 1];
                }
                ary[j] = val;
            }
        }
    
        /**
         * 执行二分搜索
         * @param ary 搜索的数组（必须排序过）
         * @param value 需要搜索的值
         * @returns 返回匹配结果的数组索引
         */
        public static binarySearch(ary: number[], value: number): number {
            let startIndex: number = 0;
            let endIndex: number = ary.length;
            let sub: number = (startIndex + endIndex) >> 1;
            while (startIndex < endIndex) {
                if (value <= ary[sub]) endIndex = sub;
                else if (value >= ary[sub]) startIndex = sub + 1;
                sub = (startIndex + endIndex) >> 1;
            }
            if (ary[startIndex] == value) return startIndex;
            return -1;
        }
    
    
        /**
         * 返回匹配项的索引
         * @param ary 
         * @param num 
         */
        public static findElementIndex(ary: any[], num: any): any {
            let len: number = ary.length;
            for (let i: number = 0; i < len; ++i) {
                if (ary[i] == num)
                    return i;
            }
            return null;
        }
    
        /**
         * 返回数组中最大值的索引
         * @param ary 
         */
        public static getMaxElementIndex(ary: number[]): number {
            let matchIndex: number = 0;
            let len: number = ary.length;
            for (let j: number = 1; j < len; j++) {
                if (ary[j] > ary[matchIndex])
                    matchIndex = j;
            }
            return matchIndex;
        }
    
        /**
         * 返回数组中最小值的索引
         * @param ary 
         */
        public static getMinElementIndex(ary: number[]): number {
            let matchIndex: number = 0;
            let len: number = ary.length;
            for (let j: number = 1; j < len; j++) {
                if (ary[j] < ary[matchIndex])
                    matchIndex = j;
            }
            return matchIndex;
        }
    
        /**
         * 返回一个"唯一性"数组
         * @param ary 需要唯一性的数组
         * @returns 唯一性的数组
         * 
         * @tutorial
         * 比如: [1, 2, 2, 3, 4]
         * 返回: [1, 2, 3, 4]
         */
        public static getUniqueAry(ary: number[]): number[] {
            let uAry: number[] = [];
            let newAry: number[] = [];
            let count = ary.length;
            for (let i: number = 0; i < count; ++i) {
                let value: number = ary[i];
                if (uAry.indexOf(value) == -1) uAry.push(value);
            }
    
            count = uAry.length;
            for (let i: number = count - 1; i >= 0; --i) {
                newAry.unshift(uAry[i]);
            }
            return newAry;
        }
    
    
        /**
         * 返回2个数组中不同的部分
         * 比如数组A = [1, 2, 3, 4, 6]
         *    数组B = [0, 2, 1, 3, 4]
         * 返回[6, 0]
         * @param    aryA
         * @param    aryB
         * @return
         */
        public static getDifferAry(aryA: number[], aryB: number[]): number[] {
            aryA = this.getUniqueAry(aryA);
            aryB = this.getUniqueAry(aryB);
            let ary: number[] = aryA.concat(aryB);
            let uObj: Object = {};
            let newAry: number[] = [];
            let count: number = ary.length;
            for (let j: number = 0; j < count; ++j) {
                if (!uObj[ary[j]]) {
                    uObj[ary[j]] = {};
                    uObj[ary[j]].count = 0;
                    uObj[ary[j]].key = ary[j];
                    uObj[ary[j]].count++;
                } else {
                    if (uObj[ary[j]] instanceof Object) {
                        uObj[ary[j]].count++;
                    }
                }
            }
            for (let i in uObj) {
                if (uObj[i].count != 2) {
                    newAry.unshift(uObj[i].key);
                }
            }
            return newAry;
        }
    
        /**
         * 交换数组元素
         * @param    array    目标数组
         * @param    index1    交换后的索引
         * @param    index2    交换前的索引
         */
        public static swap(array: any[], index1: number, index2: number): void {
            let temp: any = array[index1];
            array[index1] = array[index2];
            array[index2] = temp;
        }
    
    
        /**
         * 清除列表
         * @param ary 
         */
        public static clearList(ary: any[]): void {
            if (!ary) return;
            let length: number = ary.length;
            for (let i: number = length - 1; i >= 0; i -= 1) {
                ary.splice(i, 1);
            }
        }
    
        /**
         * 克隆一个数组
         * @param    ary 需要克隆的数组
         * @return  克隆的数组
         */
        public static cloneList(ary: any[]): any[] {
            if (!ary) return null;
            return ary.slice(0, ary.length);
        }
    
        /**
         * 判断2个数组是否相同
         * @param ary1 数组1
         * @param ary2 数组2
         */
        public static equals(ary1: number[], ary2: number[]): Boolean {
            if (ary1 == ary2) return true;
            let length: number = ary1.length;
            if (length != ary2.length) return false;
            while (length--) {
                if (ary1[length] != ary2[length])
                    return false;
            }
            return true;
        }
    
        /**
         * 根据索引插入元素，索引和索引后的元素都向后移动一位
         * @param ary
         * @param index 插入索引
         * @param value 插入的元素
         * @returns 插入的元素 未插入则返回空
         */
        public static insert(ary: any[], index: number, value: any): any {
            if (!ary) return null;
            let length: number = ary.length;
            if (index > length) index = length;
            if (index < 0) index = 0;
            if (index == length) ary.push(value); //插入最后
            else if (index == 0) ary.unshift(value); //插入头
            else {
                for (let i: number = length - 1; i >= index; i -= 1) {
                    ary[i + 1] = ary[i];
                }
                ary[index] = value;
            }
            return value;
        }
    
        /**
         * 打乱数组 Fisher–Yates shuffle
         * @param list 
         */
        public static shuffle<T>(list: T[]) {
            let n = list.length;
            while (n > 1) {
                n--;
                let k = RandomUtils.randint(0, n + 1);
                let value: T = list[k];
                list[k] = list[n];
                list[n] = value;
            }
        }
    
        /**
         * 如果项目已经在列表中，返回false，如果成功添加，返回true
         * @param list 
         * @param item 
         */
        public static addIfNotPresent<T>(list: T[], item: T) {
            if (new es.List(list).contains(item))
                return false;
    
            list.push(item);
            return true;
        }
    
        /**
         * 返回列表中的最后一项。列表中至少应该有一个项目
         * @param list 
         */
        public static lastItem<T>(list: T[]) {
            return list[list.length - 1];
        }
    
        /**
         * 从列表中随机获取一个项目。不清空检查列表!
         * @param list 
         */
        public static randomItem<T>(list: T[]) {
            return list[RandomUtils.randint(0, list.length - 1)];
        }
    
        /**
         * 从列表中随机获取物品。不清空检查列表，也不验证列表数是否大于项目数。返回的List可以通过ListPool.free放回池中
         * @param list 
         * @param itemCount 从列表中返回的随机项目的数量
         */
        public static randomItems<T>(list: T[], itemCount: number){
            let set = new Set<T>();
            while (set.size != itemCount) {
                let item = this.randomItem(list);
                if (!set.has(item))
                    set.add(item);
            }
    
            let items = es.ListPool.obtain<T>();
            set.forEach(value => items.push(value));
            return items;
        }
    }
}
