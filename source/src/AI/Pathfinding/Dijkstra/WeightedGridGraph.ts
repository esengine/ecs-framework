///<reference path="../../../Math/Point.ts" />
/**
 * 支持一种加权节点的基本网格图
 */
class WeightedGridGraph implements IWeightedGraph<Point> {
    public static readonly CARDINAL_DIRS = [
        new Point(1, 0),
        new Point(0, -1),
        new Point(-1, 0),
        new Point(0, 1)
    ];

    private static readonly COMPASS_DIRS = [
        new Point(1, 0),
        new Point(1, -1),
        new Point(0, -1),
        new Point(-1, -1),
        new Point(-1, 0),
        new Point(-1, 1),
        new Point(0, 1),
        new Point(1, 1),
    ];

    public walls: Point[] = [];
    public weightedNodes: Point[] = [];
    public defaultWeight = 1;
    public weightedNodeWeight = 5;

    private _width: number;
    private _height: number;
    private _dirs: Point[];
    private _neighbors: Point[] = new Array(4);

    constructor(width: number, height: number, allowDiagonalSearch: boolean = false){
        this._width = width;
        this._height = height;
        this._dirs = allowDiagonalSearch ? WeightedGridGraph.COMPASS_DIRS : WeightedGridGraph.CARDINAL_DIRS;
    }

    public isNodeInBounds(node: Point){
        return 0 <= node.x && node.x < this._width && 0 <= node.y && node.y < this._height;
    }

    public isNodePassable(node: Point): boolean {
        return !this.walls.firstOrDefault(wall => JSON.stringify(wall) == JSON.stringify(node));
    }

    public search(start: Point, goal: Point){
        return WeightedPathfinder.search(this, start, goal);
    }

    public getNeighbors(node: Point): Point[]{
        this._neighbors.length = 0;

        this._dirs.forEach(dir => {
            let next = new Point(node.x + dir.x, node.y + dir.y);
            if (this.isNodeInBounds(next) && this.isNodePassable(next))
                this._neighbors.push(next);
        });

        return this._neighbors;
    }

    public cost(from: Point, to: Point): number{
        return this.weightedNodes.find(t => JSON.stringify(t) == JSON.stringify(to)) ? this.weightedNodeWeight : this.defaultWeight;
    }
}