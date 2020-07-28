module es {
    /**
     * 使用堆实现最小优先级队列 O(1)复杂度
     * 这种查找速度比使用字典快5-10倍
     * 但是，由于IPriorityQueue.contains()是许多寻路算法中调用最多的方法，因此尽可能快地实现它对于我们的应用程序非常重要。
     */
    export class PriorityQueue<T extends PriorityQueueNode> {
        private _numNodes: number;
        private _nodes: T[];
        private _numNodesEverEnqueued;

        /**
         * 实例化一个新的优先级队列
         * @param maxNodes 允许加入队列的最大节点(执行此操作将导致undefined的行为)
         */
        constructor(maxNodes: number) {
            this._numNodes = 0;
            this._nodes = new Array(maxNodes + 1);
            this._numNodesEverEnqueued = 0;
        }

        /**
         * 返回队列中的节点数。
         * O(1)复杂度
         */
        public get count() {
            return this._numNodes;
        }

        /**
         * 返回可同时进入此队列的最大项数。一旦你达到这个数字(即。一旦Count == MaxSize)，尝试加入另一个项目将导致undefined的行为
         * O(1)复杂度
         */
        public get maxSize() {
            return this._nodes.length - 1;
        }

        /**
         * 从队列中删除每个节点。
         *  O(n)复杂度 所有尽可能少调用该方法
         */
        public clear() {
            this._nodes.splice(1, this._numNodes);
            this._numNodes = 0;
        }

        /**
         * 返回(在O(1)中)给定节点是否在队列中
         * O (1)复杂度
         * @param node
         */
        public contains(node: T): boolean {
            if (!node) {
                console.error("node cannot be null");
                return false;
            }

            if (node.queueIndex < 0 || node.queueIndex >= this._nodes.length) {
                console.error("node.QueueIndex has been corrupted. Did you change it manually? Or add this node to another queue?");
                return false;
            }

            return (this._nodes[node.queueIndex] == node);
        }

        /**
         * 将节点放入优先队列 较低的值放在前面 先入先出
         * 如果队列已满，则结果undefined。如果节点已经加入队列，则结果undefined。
         * O(log n)
         * @param node
         * @param priority
         */
        public enqueue(node: T, priority: number) {
            node.priority = priority;
            this._numNodes++;
            this._nodes[this._numNodes] = node;
            node.queueIndex = this._numNodes;
            node.insertionIndex = this._numNodesEverEnqueued++;
            this.cascadeUp(this._nodes[this._numNodes]);
        }

        /**
         * 删除队列头(具有最小优先级的节点;按插入顺序断开连接)，并返回它。如果队列为空，结果undefined
         * O(log n)
         */
        public dequeue(): T {
            let returnMe = this._nodes[1];
            this.remove(returnMe);
            return returnMe;
        }

        /**
         * 从队列中删除一个节点。节点不需要是队列的头。如果节点不在队列中，则结果未定义。如果不确定，首先检查Contains()
         * O(log n)
         * @param node
         */
        public remove(node: T) {
            if (node.queueIndex == this._numNodes) {
                this._nodes[this._numNodes] = null;
                this._numNodes--;
                return;
            }

            let formerLastNode = this._nodes[this._numNodes];
            this.swap(node, formerLastNode);
            delete this._nodes[this._numNodes];
            this._numNodes--;

            this.onNodeUpdated(formerLastNode);
        }

        /**
         * 检查以确保队列仍然处于有效状态。用于测试/调试队列。
         */
        public isValidQueue(): boolean {
            for (let i = 1; i < this._nodes.length; i++) {
                if (this._nodes[i]) {
                    let childLeftIndex = 2 * i;
                    if (childLeftIndex < this._nodes.length && this._nodes[childLeftIndex] &&
                        this.hasHigherPriority(this._nodes[childLeftIndex], this._nodes[i]))
                        return false;

                    let childRightIndex = childLeftIndex + 1;
                    if (childRightIndex < this._nodes.length && this._nodes[childRightIndex] &&
                        this.hasHigherPriority(this._nodes[childRightIndex], this._nodes[i]))
                        return false;
                }
            }

            return true;
        }

        private onNodeUpdated(node: T) {
            // 将更新后的节点按适当的方式向上或向下冒泡
            let parentIndex = Math.floor(node.queueIndex / 2);
            let parentNode = this._nodes[parentIndex];

            if (parentIndex > 0 && this.hasHigherPriority(node, parentNode)) {
                this.cascadeUp(node);
            } else {
                // 注意，如果parentNode == node(即节点是根)，则将调用CascadeDown。
                this.cascadeDown(node);
            }
        }

        private cascadeDown(node: T) {
            // 又名Heapify-down
            let newParent: T;
            let finalQueueIndex = node.queueIndex;
            while (true) {
                newParent = node;
                let childLeftIndex = 2 * finalQueueIndex;

                // 检查左子节点的优先级是否高于当前节点
                if (childLeftIndex > this._numNodes) {
                    // 这可以放在循环之外，但是我们必须检查newParent != node两次
                    node.queueIndex = finalQueueIndex;
                    this._nodes[finalQueueIndex] = node;
                    break;
                }

                let childLeft = this._nodes[childLeftIndex];
                if (this.hasHigherPriority(childLeft, newParent)) {
                    newParent = childLeft;
                }

                // 检查右子节点的优先级是否高于当前节点或左子节点
                let childRightIndex = childLeftIndex + 1;
                if (childRightIndex <= this._numNodes) {
                    let childRight = this._nodes[childRightIndex];
                    if (this.hasHigherPriority(childRight, newParent)) {
                        newParent = childRight;
                    }
                }

                // 如果其中一个子节点具有更高(更小)的优先级，则交换并继续级联
                if (newParent != node) {
                    // 将新的父节点移动到它的新索引
                    // 节点将被移动一次，这样做比调用Swap()少一个赋值操作。
                    this._nodes[finalQueueIndex] = newParent;

                    let temp = newParent.queueIndex;
                    newParent.queueIndex = finalQueueIndex;
                    finalQueueIndex = temp;
                } else {
                    // 参见上面的笔记
                    node.queueIndex = finalQueueIndex;
                    this._nodes[finalQueueIndex] = node;
                    break;
                }
            }
        }

        /**
         * 当没有内联时，性能会稍微好一些
         * @param node
         */
        private cascadeUp(node: T) {
            // 又名Heapify-up
            let parent = Math.floor(node.queueIndex / 2);
            while (parent >= 1) {
                let parentNode = this._nodes[parent];
                if (this.hasHigherPriority(parentNode, node))
                    break;

                // 节点具有较低的优先级值，因此将其向上移动到堆中
                // 出于某种原因，使用Swap()比使用单独的操作更快，如CascadeDown()
                this.swap(node, parentNode);

                parent = Math.floor(node.queueIndex / 2);
            }
        }

        private swap(node1: T, node2: T) {
            // 交换节点
            this._nodes[node1.queueIndex] = node2;
            this._nodes[node2.queueIndex] = node1;

            // 交换他们的indicies
            let temp = node1.queueIndex;
            node1.queueIndex = node2.queueIndex;
            node2.queueIndex = temp;
        }

        /**
         * 如果higher的优先级高于lower，则返回true，否则返回false。
         * 注意，调用HasHigherPriority(节点，节点)(即。两个参数为同一个节点)将返回false
         * @param higher
         * @param lower
         */
        private hasHigherPriority(higher: T, lower: T) {
            return (higher.priority < lower.priority ||
                (higher.priority == lower.priority && higher.insertionIndex < lower.insertionIndex));
        }
    }
}
