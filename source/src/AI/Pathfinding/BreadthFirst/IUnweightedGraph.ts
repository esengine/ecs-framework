module es {
    export interface IUnweightedGraph<T>{
        /**
         * getNeighbors方法应该返回从传入的节点可以到达的任何相邻节点。
         * @param node
         */
        getNeighbors(node: T): T[];
    }
}
