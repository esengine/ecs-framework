/**
 * graph的接口，可以提供给AstarPathfinder.search方法
 */
interface IAstarGraph<T> {
    /**
     * getNeighbors方法应该返回从传入的节点可以到达的任何相邻节点
     * @param node 
     */
    getNeighbors(node: T): Array<T>;
    /**
     * 计算从从from到to的成本
     * @param from 
     * @param to 
     */
    cost(from: T, to: T): number;
    /**
     * 计算从node到to的启发式。参见WeightedGridGraph了解常用的Manhatten方法。
     * @param node 
     * @param goal 
     */
    heuristic(node: T, goal: T);
}