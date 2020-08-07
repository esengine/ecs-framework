///<reference path="./PriorityQueueNode.ts" />
module es {
    /**
     * 计算路径给定的IAstarGraph和开始/目标位置
     */
    export class AStarPathfinder {
        /**
         * 尽可能从开始到目标找到一条路径。如果没有找到路径，则返回null。
         * @param graph
         * @param start
         * @param goal
         */
        public static search<T>(graph: IAstarGraph<T>, start: T, goal: T) {
            let foundPath = false;
            let cameFrom = new Map<T, T>();
            cameFrom.set(start, start);

            let costSoFar = new Map<T, number>();
            let frontier = new PriorityQueue<AStarNode<T>>(1000);
            frontier.enqueue(new AStarNode<T>(start), 0);

            costSoFar.set(start, 0);

            while (frontier.count > 0) {
                let current = frontier.dequeue();

                if (JSON.stringify(current.data) == JSON.stringify(goal)) {
                    foundPath = true;
                    break;
                }

                graph.getNeighbors(current.data).forEach(next => {
                    let newCost = costSoFar.get(current.data) + graph.cost(current.data, next);
                    if (!this.hasKey(costSoFar, next) || newCost < costSoFar.get(next)) {
                        costSoFar.set(next, newCost);
                        let priority = newCost + graph.heuristic(next, goal);
                        frontier.enqueue(new AStarNode<T>(next), priority);
                        cameFrom.set(next, current.data);
                    }
                });
            }

            return foundPath ? this.recontructPath(cameFrom, start, goal) : null;
        }

        /**
         * 从cameFrom字典重新构造路径
         * @param cameFrom
         * @param start
         * @param goal
         */
        public static recontructPath<T>(cameFrom: Map<T, T>, start: T, goal: T): T[] {
            let path = [];
            let current = goal;
            path.push(goal);

            while (current != start) {
                current = this.getKey(cameFrom, current);
                path.push(current);
            }

            path.reverse();

            return path;
        }

        private static hasKey<T>(map: Map<T, number>, compareKey: T) {
            let iterator = map.keys();
            let r: IteratorResult<T>;
            while (r = iterator.next() , !r.done) {
                if (JSON.stringify(r.value) == JSON.stringify(compareKey))
                    return true;
            }

            return false;
        }

        private static getKey<T>(map: Map<T, T>, compareKey: T) {
            let iterator = map.keys();
            let valueIterator = map.values();
            let r: IteratorResult<T>;
            let v: IteratorResult<T>;
            while (r = iterator.next(), v = valueIterator.next(), !r.done) {
                if (JSON.stringify(r.value) == JSON.stringify(compareKey))
                    return v.value;
            }

            return null;
        }
    }

    /**
     * 使用PriorityQueue需要的额外字段将原始数据封装在一个小类中
     */
    export class AStarNode<T> extends PriorityQueueNode {
        public data: T;

        constructor(data: T) {
            super();
            this.data = data;
        }
    }
}
