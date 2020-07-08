///<reference path="../../../Math/Vector2.ts" />
/**
 * 支持一种加权节点的基本网格图
 */
class WeightedGridGraph implements IWeightedGraph<Vector2> {
    public static readonly CARDINAL_DIRS = [
        new Vector2(1, 0),
        new Vector2(0, -1),
        new Vector2(-1, 0),
        new Vector2(0, 1)
    ];

    private static readonly COMPASS_DIRS = [
        new Vector2(1, 0),
        new Vector2(1, -1),
        new Vector2(0, -1),
        new Vector2(-1, -1),
        new Vector2(-1, 0),
        new Vector2(-1, 1),
        new Vector2(0, 1),
        new Vector2(1, 1),
    ];

    public walls: Vector2[] = [];
    public weightedNodes: Vector2[] = [];
    public defaultWeight = 1;
    public weightedNodeWeight = 5;

    private _width: number;
    private _height: number;
    private _dirs: Vector2[];
    private _neighbors: Vector2[] = new Array(4);

    constructor(width: number, height: number, allowDiagonalSearch: boolean = false){
        this._width = width;
        this._height = height;
        this._dirs = allowDiagonalSearch ? WeightedGridGraph.COMPASS_DIRS : WeightedGridGraph.CARDINAL_DIRS;
    }

    public isNodeInBounds(node: Vector2){
        return 0 <= node.x && node.x < this._width && 0 <= node.y && node.y < this._height;
    }

    public isNodePassable(node: Vector2): boolean {
        return !this.walls.firstOrDefault(wall => JSON.stringify(wall) == JSON.stringify(node));
    }

    public search(start: Vector2, goal: Vector2){
        return WeightedPathfinder.search(this, start, goal);
    }

    public getNeighbors(node: Vector2): Vector2[]{
        this._neighbors.length = 0;

        this._dirs.forEach(dir => {
            let next = new Vector2(node.x + dir.x, node.y + dir.y);
            if (this.isNodeInBounds(next) && this.isNodePassable(next))
                this._neighbors.push(next);
        });

        return this._neighbors;
    }

    public cost(from: Vector2, to: Vector2): number{
        return this.weightedNodes.find(t => JSON.stringify(t) == JSON.stringify(to)) ? this.weightedNodeWeight : this.defaultWeight;
    }
}