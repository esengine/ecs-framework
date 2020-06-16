class SpatialHash {
    public gridBounds: Rectangle = new Rectangle();

    private _raycastParser: RaycastResultParser;
    private _cellSize: number;
    private _inverseCellSize: number;
    private _overlapTestCircle: Circle;
    private _tempHashSet: Collider[] = [];
    private _cellDict: NumberDictionary = new NumberDictionary();

    constructor(cellSize: number = 100) {
        this._cellSize = cellSize;
        this._inverseCellSize = 1 / this._cellSize;
        this._raycastParser = new RaycastResultParser();
    }

    public remove(collider: Collider) {
        let bounds = collider.registeredPhysicsBounds;
        let p1 = this.cellCoords(bounds.x, bounds.y);
        let p2 = this.cellCoords(bounds.right, bounds.bottom);

        for (let x = p1.x; x <= p2.x; x++) {
            for (let y = p1.y; y <= p2.y; y++) {
                let cell = this.cellAtPosition(x, y);
                if (!cell)
                    console.error(`removing Collider [${collider}] from a cell that it is not present in`);
                else
                    cell.remove(collider);
            }
        }
    }

    public register(collider: Collider) {
        let bounds = collider.bounds;
        collider.registeredPhysicsBounds = bounds;
        let p1 = this.cellCoords(bounds.x, bounds.y);
        let p2 = this.cellCoords(bounds.right, bounds.bottom);

        if (!this.gridBounds.contains(new Vector2(p1.x, p1.y))) {
            this.gridBounds = RectangleExt.union(this.gridBounds, p1);
        }

        if (!this.gridBounds.contains(new Vector2(p2.x, p2.y))) {
            this.gridBounds = RectangleExt.union(this.gridBounds, p2);
        }

        for (let x = p1.x; x <= p2.x; x++) {
            for (let y = p1.y; y <= p2.y; y++) {
                let c = this.cellAtPosition(x, y, true);
                c.push(collider);
            }
        }
    }

    public overlapCircle(circleCenter: Vector2, radius: number, results: Collider[], layerMask) {
        let bounds = new Rectangle(circleCenter.x - radius, circleCenter.y - radius, radius * 2, radius * 2);

        this._overlapTestCircle.radius = radius;
        this._overlapTestCircle.position = circleCenter;

        let resultCounter = 0;
        let potentials = this.aabbBroadphase(bounds, null, layerMask);
        for (let i = 0; i < potentials.length; i ++){
            let collider = potentials[i];
            if (collider instanceof BoxCollider){
                results[resultCounter] = collider;
                resultCounter ++;
            }else{
                throw new Error("overlapCircle against this collider type is not implemented!");
            }

            if (resultCounter == results.length)
                return resultCounter;
        }

        return resultCounter;
    }

    public aabbBroadphase(bounds: Rectangle, excludeCollider: Collider, layerMask: number) {
        this._tempHashSet.length = 0;

        let p1 = this.cellCoords(bounds.x, bounds.y);
        let p2 = this.cellCoords(bounds.right, bounds.bottom);

        for (let x = p1.x; x <= p2.x; x++) {
            for (let y = p1.y; y <= p2.y; y++) {
                let cell = this.cellAtPosition(x, y);
                if (!cell)
                    continue;

                for (let i = 0; i < cell.length; i++) {
                    let collider = cell[i];

                    if (collider == excludeCollider || !Flags.isFlagSet(layerMask, collider.physicsLayer))
                        continue;

                    if (bounds.intersects(collider.bounds))
                        this._tempHashSet.push(collider);
                }
            }
        }

        return this._tempHashSet;
    }

    private cellAtPosition(x: number, y: number, createCellIfEmpty: boolean = false) {
        let cell: Collider[] = this._cellDict.tryGetValue(x, y);
        if (!cell) {
            if (createCellIfEmpty) {
                cell = [];
                this._cellDict.add(x, y, cell);
            }
        }
        return cell;
    }

    private cellCoords(x: number, y: number): Point {
        return new Point(Math.floor(x * this._inverseCellSize), Math.floor(y * this._inverseCellSize));
    }
}

class RaycastResultParser {

}

class NumberDictionary {
    private _store: Map<number, Collider[]> = new Map<number, Collider[]>();

    private getKey(x: number, y: number): number {
        return x << 32 | y;
    }

    public add(x: number, y: number, list: Collider[]) {
        this._store.set(this.getKey(x, y), list);
    }

    public remove(obj: Collider) {
        this._store.forEach(list => {
            if (list.contains(obj))
                list.remove(obj);
        })
    }

    public tryGetValue(x: number, y: number): Collider[] {
        return this._store.get(this.getKey(x, y));
    }

    public getAllObjects(): Collider[] {
        let set: Collider[] = [];

        this._store.forEach(list => set.concat(list));

        return set;
    }

    public clear() {
        this._store.clear();
    }
}