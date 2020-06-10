/**
 * 一个未加权图的基本实现。所有的边都被缓存。这种类型的图最适合于非基于网格的图。
 * 作为边添加的任何节点都必须在边字典中有一个条目作为键。
 */
class UnweightedGraph<T> implements IUnweightedGraph<T> {
    public edges: Map<T, T[]> = new Map<T, T[]>();

    public addEdgesForNode(node: T, edges: T[]){
        this.edges.set(node, edges);
        return this;
    }

    public getNeighbors(node: T){
        return this.edges.get(node);
    }
}