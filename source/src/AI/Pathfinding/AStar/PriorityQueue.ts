class PriorityQueue<T extends PriorityQueueNode> {
    private _numNodes: number;
    private _nodes: T[];
    private _numNodesEverEnqueued;

    constructor(maxNodes: number) {
        this._numNodes = 0;
        this._nodes = new Array(maxNodes + 1);
        this._numNodesEverEnqueued = 0;
    }

    public clear() {
        this._nodes.splice(1, this._numNodes);
        this._numNodes = 0;
    }

    public get count() {
        return this._numNodes;
    }

    public contains(node: T): boolean {
        return (this._nodes[node.queueIndex] == node);
    }

    public enqueue(node: T, priority: number) {
        node.priority = priority;
        this._numNodes++;
        this._nodes[this._numNodes] = node;
        node.queueIndex = this._numNodes;
        node.insertionIndex = this._numNodesEverEnqueued++;
        this.cascadeUp(this._nodes[this._numNodes]);
    }

    public dequeue(): T {
        let returnMe = this._nodes[1];
        this.remove(returnMe);
        return returnMe;
    }

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
        let parentIndex = Math.floor(node.queueIndex / 2);
        let parentNode = this._nodes[parentIndex];

        if (parentIndex > 0 && this.hasHigherPriority(node, parentNode)) {
            this.cascadeUp(node);
        } else {
            this.cascadeDown(node);
        }
    }

    private cascadeDown(node: T) {
        let newParent: T;
        let finalQueueIndex = node.queueIndex;
        while (true) {
            newParent = node;
            let childLeftIndex = 2 * finalQueueIndex;

            if (childLeftIndex > this._numNodes) {
                node.queueIndex = finalQueueIndex;
                this._nodes[finalQueueIndex] = node;
                break;
            }

            let childLeft = this._nodes[childLeftIndex];
            if (this.hasHigherPriority(childLeft, newParent)) {
                newParent = childLeft;
            }

            let childRightIndex = childLeftIndex + 1;
            if (childRightIndex <= this._numNodes) {
                let childRight = this._nodes[childRightIndex];
                if (this.hasHigherPriority(childRight, newParent)) {
                    newParent = childRight;
                }
            }

            if (newParent != node) {
                this._nodes[finalQueueIndex] = newParent;

                let temp = newParent.queueIndex;
                newParent.queueIndex = finalQueueIndex;
                finalQueueIndex = temp;
            } else {
                node.queueIndex = finalQueueIndex;
                this._nodes[finalQueueIndex] = node;
                break;
            }
        }
    }

    private cascadeUp(node: T) {
        let parent = Math.floor(node.queueIndex / 2);
        while (parent >= 1) {
            let parentNode = this._nodes[parent];
            if (this.hasHigherPriority(parentNode, node))
                break;

            this.swap(node, parentNode);

            parent = Math.floor(node.queueIndex / 2);
        }
    }

    private swap(node1: T, node2: T) {
        this._nodes[node1.queueIndex] = node2;
        this._nodes[node2.queueIndex] = node1;

        let temp = node1.queueIndex;
        node1.queueIndex = node2.queueIndex;
        node2.queueIndex = temp;
    }

    private hasHigherPriority(higher: T, lower: T) {
        return (higher.priority < lower.priority ||
            (higher.priority == lower.priority && higher.insertionIndex < lower.insertionIndex));
    }
}