/**
 * 基本静态网格图与A*一起使用
 * 将walls添加到walls HashSet，并将加权节点添加到weightedNodes
 */
class AstarGridGraph implements IAstarGraph<Point> {
    public dirs: Point[] = [
        new Point(1, 0),
        new Point(0, -1),
        new Point(-1, 0),
        new Point(0, 1)
    ];

    public walls: Point[] = [];
    public weightedNodes: Point[] = [];
    public defaultWeight: number = 1;
    public weightedNodeWeight = 5;

    private _width;
    private _height;
    private _neighbors: Point[] = new Array(4);

    constructor(width: number, height: number){
        this._width = width;
        this._height = height;
    }

    /**
     * 确保节点在网格图的边界内
     * @param node 
     */
    public isNodeInBounds(node: Point): boolean {
        return 0 <= node.x && node.x < this._width && 0 <= node.y && node.y < this._height;
    }

    /**
     * 检查节点是否可以通过。墙壁是不可逾越的。
     * @param node 
     */
    public isNodePassable(node: Point): boolean {
        return !this.walls.contains(node);
    }

    public search(start: Point, goal: Point){
        return AStarPathfinder.search(this, start, goal);
    }

    public getNeighbors(node: Point): Point[] {
        this._neighbors.length = 0;

        this.dirs.forEach(dir => {
            let next = new Point(node.x + dir.x, node.y + dir.y);
            if (this.isNodeInBounds(next) && this.isNodePassable(next))
                this._neighbors.push(next);
        });

        return this._neighbors;
    }

    public cost(from: Point, to: Point): number {
        return this.weightedNodes.find((p)=> JSON.stringify(p) == JSON.stringify(to)) ? this.weightedNodeWeight : this.defaultWeight;
    }

    public heuristic(node: Point, goal: Point) {
        return Math.abs(node.x - goal.x) + Math.abs(node.y - goal.y);
    }

}