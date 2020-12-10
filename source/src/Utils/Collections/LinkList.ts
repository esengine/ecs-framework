module es {
    export class Node<T>{
        element: T;
        next: Node<T>;
        // next为可选参数，如果不传则为undefined
        constructor(element: T, next?: Node<T>) {
            this.element = element;
            this.next = next;
        }
    }

    // 定义验证函数要传的参数和返回结果
    interface equalsFnType<T> {
        (a: T, b: T): boolean;
    }

    export function defaultEquals<T>(a: T, b: T): boolean {
        return a === b;
    }

    export class LinkedList<T> {
        // 声明链表内需要的变量并定义其类型
        protected count: number;
        protected next: any;
        protected equalsFn: equalsFnType<T>;
        protected head: Node<T>;

        constructor(equalsFn = defaultEquals) {
            // 初始化链表内部变量
            this.count = 0;
            this.next = undefined;
            this.equalsFn = equalsFn;
            this.head = null;
        }

        // 链表尾部添加元素
        push(element: T) {
            // 声明结点变量，将元素当作参数传入生成结点
            const node = new Node(element);
            // 存储遍历到的链表元素
            let current;
            if (this.head == null) {
                // 链表为空，直接将链表头部赋值为结点变量
                this.head = node;
            } else {
                // 链表不为空，我们只能拿到链表中第一个元素的引用
                current = this.head;
                // 循环访问链表
                while (current.next != null) {
                    // 赋值遍历到的元素
                    current = current.next;
                }
                // 此时已经得到了链表的最后一个元素(null)，将链表的下一个元素赋值为结点变量。
                current.next = node;
            }
            // 链表长度自增
            this.count++;
        }

        // 移除链表指定位置的元素
        removeAt(index: number) {
            // 边界判断: 参数是否有效
            if (index >= 0 && index < this.count) {
                // 获取当前链表头部元素
                let current = this.head;
                // 移除第一项
                if (index === 0) {
                    this.head = current.next;
                } else {
                    // 获取目标参数上一个结点
                    const previous = this.getElementAt(index - 1);
                    // 当前结点指向目标结点
                    current = previous.next;
                    /**
                     * 目标结点元素已找到
                     * previous.next指向目标结点
                     * current.next指向undefined
                     * previous.next指向current.next即删除目标结点的元素
                     */
                    previous.next = current.next;
                }
                // 链表长度自减
                this.count--;
                // 返回当前删除的目标结点
                return current.element;
            }
            return undefined;
        }

        // 获取链表指定位置的结点
        getElementAt(index: number) {
            // 参数校验
            if (index >= 0 && index <= this.count) {
                // 获取链表头部元素
                let current = this.head;
                // 从链表头部遍历至目标结点位置
                for (let i = 0; i < index && current != null; i++) {
                    // 当前结点指向下一个目标结点
                    current = current.next;
                }
                // 返回目标结点数据
                return current;
            }
            return undefined;
        }

        // 向链表中插入元素
        insert(element: T, index: number) {
            // 参数有效性判断
            if (index >= 0 && index <= this.count) {
                // 声明节点变量，将当前要插入的元素作为参数生成结点
                const node = new Node(element);
                // 第一个位置添加元素
                if (index === 0) {
                    // 将节点变量(node)的下一个元素指向链表的头部元素
                    node.next = this.head;
                    // 链表头部元素赋值为节点变量
                    this.head = node;
                } else {
                    // 获取目标结点的上一个结点
                    const previous = this.getElementAt(index - 1);
                    // 将节点变量的下一个元素指向目标节点
                    node.next = previous.next;
                    /**
                     * 此时node中当前结点为要插入的值
                     * next为原位置处的结点
                     * 因此将当前结点赋值为node，就完成了结点插入操作
                     */
                    previous.next = node;
                }
                // 链表长度自增
                this.count++;
                return true;
            }
            return false;
        }

        // 根据元素获取其在链表中的索引
        indexOf(element: T) {
            // 获取链表顶部元素
            let current = this.head;
            // 遍历链表内的元素
            for (let i = 0; i < this.count && current != null; i++) {
                // 判断当前链表中的结点与目标结点是否相等
                if (this.equalsFn(element, current.element)) {
                    // 返回索引
                    return i;
                }
                // 当前结点指向下一个结点
                current = current.next;
            }
            // 目标元素不存在
            return -1;
        }

        // 移除链表中的指定元素
        remove(element: T) {
            // 获取element的索引,移除索引位置的元素
            this.removeAt(this.indexOf(element));
        }

        clear() {
            this.head = undefined;
            this.count = 0;
        }

        // 获取链表长度
        size() {
            return this.count;
        }

        // 判断链表是否为空
        isEmpty() {
            return this.size() === 0;
        }

        // 获取链表头部元素
        getHead() {
            return this.head;
        }

        // 获取链表中的所有元素
        toString() {
            if (this.head == null) {
                return "";
            }
            let objString = `${this.head.element}`;
            // 获取链表顶点的下一个结点
            let current = this.head.next;
            // 遍历链表中的所有结点
            for (let i = 1; i < this.size() && current != null; i++) {
                // 将当前结点的元素拼接到最终要生成的字符串对象中
                objString = `${objString}, ${current.element}`;
                // 当前结点指向链表的下一个元素
                current = current.next;
            }
            return objString;
        }
    }
}