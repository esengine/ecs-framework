/** 
 * 计算路径给定的IUnweightedGraph和开始/目标位置
 */
class BreadthFirstPathfinder {
    public static search<T>(graph: IUnweightedGraph<T>, start: T, goal: T): T[]{
        let foundPath = false;
        let frontier = [];
        frontier.unshift(start);

        let cameFrom = new Map<T, T>();
        cameFrom.set(start, start);

        while (frontier.length > 0){
            let current = frontier.shift();
            if (JSON.stringify(current) == JSON.stringify(goal)){
                foundPath = true;
                break;
            }

            graph.getNeighbors(current).forEach(next => {
                if (!this.hasKey(cameFrom, next)){
                    frontier.unshift(next);
                    cameFrom.set(next, current);
                }
            });
        }

        return foundPath ? AStarPathfinder.recontructPath(cameFrom, start, goal) : null;
    }

    private static hasKey<T>(map: Map<T, T>, compareKey: T){
        let iterator = map.keys();
        let r: IteratorResult<T>;
        while (r = iterator.next() , !r.done) {
            if (JSON.stringify(r.value) == JSON.stringify(compareKey))
                return true;
        }

        return false;
    }
}