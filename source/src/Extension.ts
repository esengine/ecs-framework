declare interface Array<T> {
    /**
     * 获取满足表达式的数组元素索引
     * @param predicate 表达式
     */
    findIndex(predicate: Function): number;
    /**
     * 是否存在满足表达式的数组元素
     * @param predicate 表达式
     */
    any(predicate: Function): boolean;
    /**
     * 获取满足表达式的第一个或默认数组元素
     * @param predicate 表达式
     */
    firstOrDefault(predicate: Function): T;
    /**
     * 获取满足表达式的第一个数组元素
     * @param predicate 表达式
     */
    find(predicate: Function): T;
    /**
     * 筛选满足表达式的数组元素
     * @param predicate 表达式
     */
    where(predicate: Function): Array<T>;
    /**
     * 获取满足表达式的数组元素的计数
     * @param predicate 表达式
     */
    count(predicate: Function): number;
    /**
     * 获取满足表达式的数组元素的数组
     * @param predicate 表达式
     */
    findAll(predicate: Function): Array<T>;
    /**
     * 是否有获取满足表达式的数组元素
     * @param value 值
     */
    contains(value): boolean;
    /**
     * 移除满足表达式的数组元素
     * @param predicate 表达式
     */
    removeAll(predicate: Function): void;
    /**
     * 移除数组元素
     * @param element 数组元素
     */
    remove(element: T): boolean;
    /**
     * 移除特定索引数组元素
     * @param index 索引
     */
    removeAt(index): void;
    /**
     * 移除范围数组元素
     * @param index 开始索引
     * @param count 删除的个数
     */
    removeRange(index, count): void;
    /**
     * 获取通过选择器转换的数组
     * @param selector 选择器
     */
    select(selector: Function): Array<T>;
    /**
     * 排序（升序）
     * @param keySelector key选择器
     * @param comparer 比较器
     */
    orderBy(keySelector: Function, comparer: Function): Array<T>;
    /**
     * 排序（降序）
     * @param keySelector key选择器
     * @param comparer 比较器
     */
    orderByDescending(keySelector: Function, comparer: Function): Array<T>;
    /**
     * 分组
     * @param keySelector key选择器
     */
    groupBy(keySelector: Function): Array<T>;
    /**
     * 求和
     * @param selector  选择器
     */
    sum(selector);
}

Array.prototype.findIndex = function (predicate) {
    function findIndex(array, predicate) {
        for (let i = 0, len = array.length; i < len; i++) {
            if (predicate.call(arguments[2], array[i], i, array)) {
                return i;
            }
        }

        return -1;
    }

    return findIndex(this, predicate);
}

Array.prototype.any = function (predicate) {
    function any(array, predicate) {
        return array.findIndex(predicate) > -1;
    }

    return any(this, predicate);
}

Array.prototype.firstOrDefault = function (predicate) {
    function firstOrDefault(array, predicate) {
        let index = array.findIndex(predicate);
        return index == -1 ? null : array[index];
    }

    return firstOrDefault(this, predicate);
}

Array.prototype.find = function (predicate) {
    function find(array, predicate) {
        return array.firstOrDefault(predicate);
    }

    return find(this, predicate);
}

Array.prototype.where = function (predicate) {
    function where(array, predicate) {
        if (typeof (array.reduce) === "function") {
            return array.reduce(function (ret, element, index) {
                if (predicate.call(arguments[2], element, index, array)) {
                    ret.push(element);
                }

                return ret;
            }, []);
        }
        else {
            let ret = [];
            for (let i = 0, len = array.length; i < len; i++) {
                let element = array[i];
                if (predicate.call(arguments[2], element, i, array)) {
                    ret.push(element);
                }
            }

            return ret;
        }
    }

    return where(this, predicate);
}

Array.prototype.count = function (predicate) {
    function count(array, predicate) {
        return array.where(predicate).length;
    }

    return count(this, predicate);
}

Array.prototype.findAll = function (predicate) {
    function findAll(array, predicate) {
        return array.where(predicate);
    }

    return findAll(this, predicate);
}

Array.prototype.contains = function (value) {
    function contains(array, value) {
        for (let i = 0, len = array.length; i < len; i++) {
            if (array[i] == value) {
                return true;
            }
        }

        return false;
    }

    return contains(this, value);
}

Array.prototype.removeAll = function (predicate) {
    function removeAll(array, predicate) {
        let index;
        do {
            index = array.findIndex(predicate);
            if (index >= 0) {
                array.splice(index, 1);
            }
        }
        while (index >= 0)
    }

    removeAll(this, predicate);
}

Array.prototype.remove = function (element) {
    function remove(array, element) {
        let index = array.findIndex(function (x) {
            return x === element;
        });

        if (index >= 0) {
            array.splice(index, 1);
            return true;
        }
        else {
            return false;
        }
    }

    return remove(this, element);
}

Array.prototype.removeAt = function (index) {
    function removeAt(array, index) {
        array.splice(index, 1);
    }

    return removeAt(this, index);
}

Array.prototype.removeRange = function (index, count) {
    function removeRange(array, index, count) {
        array.splice(index, count);
    }

    return removeRange(this, index, count);
}

Array.prototype.select = function (selector) {
    function select(array, selector) {
        if (typeof (array.reduce) === "function") {
            return array.reduce(function (ret, element, index) {
                ret.push(selector.call(arguments[2], element, index, array));
                return ret;
            }, []);
        }
        else {
            let ret = [];
            for (let i = 0, len = array.length; i < len; i++) {
                ret.push(selector.call(arguments[2], array[i], i, array))
            }

            return ret;
        }
    }

    return select(this, selector);
}

Array.prototype.orderBy = function (keySelector, comparer) {
    function orderBy(array, keySelector, comparer) {
        array.sort(function (x, y) {
            let v1 = keySelector(x)
            let v2 = keySelector(y)
            if (comparer) {
                return comparer(v1, v2);
            }
            else {
                return (v1 > v2) ? 1 : -1;
            }
        });

        return array;
    }

    return orderBy(this, keySelector, comparer);
}

Array.prototype.orderByDescending = function (keySelector, comparer) {
    function orderByDescending(array, keySelector, comparer) {
        array.sort(function (x, y) {
            let v1 = keySelector(x)
            let v2 = keySelector(y)
            if (comparer) {
                return -comparer(v1, v2);
            }
            else {
                return (v1 < v2) ? 1 : -1;
            }
        });

        return array;
    }

    return orderByDescending(this, keySelector, comparer);
}

Array.prototype.groupBy = function (keySelector) {
    function groupBy(array, keySelector) {
        if (typeof (array.reduce) === "function") {
            let keys = [];
            return array.reduce(function (groups, element, index) {
                let key = JSON.stringify(keySelector.call(arguments[1], element, index, array))
                let index2 = keys.findIndex(function (x) { return x === key });

                if (index2 < 0) {
                    index2 = keys.push(key) - 1;
                }

                if (!groups[index2]) {
                    groups[index2] = [];
                }

                groups[index2].push(element);
                return groups;
            }, []);
        }
        else {
            let groups = [];
            let keys = [];
            for (let i = 0, len = array.length; i < len; i++) {
                let key = JSON.stringify(keySelector.call(arguments[1], array[i], i, array));
                let index = keys.findIndex(function (x) { return x === key });

                if (index < 0) {
                    index = keys.push(key) - 1;
                }

                if (!groups[index]) {
                    groups[index] = [];
                }

                groups[index].push(array[i]);
            }

            return groups;
        }
    }

    return groupBy(this, keySelector);
}

Array.prototype.sum = function (selector) {
    function sum(array, selector) {
        let ret;
        for (let i = 0, len = array.length; i < len; i++) {
            if (i == 0) {
                if (selector) {
                    ret = selector.call(arguments[2], array[i], i, array);
                }
                else {
                    ret = array[i]
                }
            }
            else {
                if (selector) {
                    ret += selector.call(arguments[2], array[i], i, array);
                }
                else {
                    ret += array[i]
                }
            }
        }

        return ret;
    }

    return sum(this, selector);
}