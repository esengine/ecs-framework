///<reference path="../../../Math/Point.ts" />
/**
 * 基本的未加权网格图形用于BreadthFirstPathfinder
 */
class UnweightedGridGraph implements IUnweightedGraph<Point> {
    private static readonly CARDINAL_DIRS: Point[] = [
        new Point(1, 0),
        new Point(0, -1),
        new Point(-1, 0),
        new Point(0, -1)
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

    private _width: number;
    private _hegiht: number;

    private _dirs: Point[];
    private _neighbors: Point[] = new Array(4);

    constructor(width: number, height: number, allowDiagonalSearch: boolean = false) {
        this._width = width;
        this._hegiht = height;
        this._dirs = allowDiagonalSearch ? UnweightedGridGraph.COMPASS_DIRS : UnweightedGridGraph.CARDINAL_DIRS;
    }

    public isNodeInBounds(node: Point): boolean {
        return 0 <= node.x && node.x < this._width && 0 <= node.y && node.y < this._hegiht;
    }

    public isNodePassable(node: Point): boolean {
        return !this.walls.firstOrDefault(wall => JSON.stringify(wall) == JSON.stringify(node));
    }

    public getNeighbors(node: Point) {
        this._neighbors.length = 0;

        this._dirs.forEach(dir => {
            let next = new Point(node.x + dir.x, node.y + dir.y);
            if (this.isNodeInBounds(next) && this.isNodePassable(next))
                this._neighbors.push(next);
        });

        return this._neighbors;
    }

    public search(start: Point, goal: Point): Point[] {
        return BreadthFirstPathfinder.search(this, start, goal);
    }
}