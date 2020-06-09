interface IAstarGraph<T> {
    getNeighbors(node: T): Array<T>;
    cost(from: T, to: T): number;
    heuristic(node: T, goal: T);
}