class SpatialHash {
    public gridBounds: Rectangle = new Rectangle();

    private _raycastParser: RaycastResultParser;
    /** 散列中每个单元格的大小 */
    private _cellSize: number;
    /** 1除以单元格大小。缓存结果，因为它被大量使用。 */
    private _inverseCellSize: number;
    /** 缓存的循环用于重叠检查 */
    private _overlapTestCircle: Circle = new Circle(0);
    /** 用于返回冲突信息的共享HashSet */
    private _tempHashSet: Collider[] = [];
    /** 保存所有数据的字典 */
    private _cellDict: NumberDictionary = new NumberDictionary();

    constructor(cellSize: number = 100) {
        this._cellSize = cellSize;
        this._inverseCellSize = 1 / this._cellSize;
        this._raycastParser = new RaycastResultParser();
    }

    /**
     * 从SpatialHash中删除对象
     * @param collider 
     */
    public remove(collider: Collider) {
        let bounds = collider.registeredPhysicsBounds;
        let p1 = this.cellCoords(bounds.x, bounds.y);
        let p2 = this.cellCoords(bounds.right, bounds.bottom);

        for (let x = p1.x; x <= p2.x; x++) {
            for (let y = p1.y; y <= p2.y; y++) {
                // 单元格应该始终存在，因为这个碰撞器应该在所有查询的单元格中
                let cell = this.cellAtPosition(x, y);
                if (!cell)
                    console.error(`removing Collider [${collider}] from a cell that it is not present in`);
                else
                    cell.remove(collider);
            }
        }
    }

    /**
     * 将对象添加到SpatialHash
     * @param collider 
     */
    public register(collider: Collider) {
        let bounds = collider.bounds;
        collider.registeredPhysicsBounds = bounds;
        let p1 = this.cellCoords(bounds.x, bounds.y);
        let p2 = this.cellCoords(bounds.right, bounds.bottom);

        // 更新边界以跟踪网格大小
        if (!this.gridBounds.contains(p1.x, p1.y)) {
            this.gridBounds = RectangleExt.union(this.gridBounds, p1);
        }

        if (!this.gridBounds.contains(p2.x, p2.y)) {
            this.gridBounds = RectangleExt.union(this.gridBounds, p2);
        }

        for (let x = p1.x; x <= p2.x; x++) {
            for (let y = p1.y; y <= p2.y; y++) {
                // 如果没有单元格，我们需要创建它
                let c = this.cellAtPosition(x, y, true);
                c.push(collider);
            }
        }
    }

    public clear(){
        this._cellDict.clear();
    }

    /**
     * 获取位于指定圆内的所有碰撞器
     * @param circleCenter 
     * @param radius 
     * @param results 
     * @param layerMask 
     */
    public overlapCircle(circleCenter: Vector2, radius: number, results: Collider[], layerMask) {
        let bounds = new Rectangle(circleCenter.x - radius, circleCenter.y - radius, radius * 2, radius * 2);

        this._overlapTestCircle.radius = radius;
        this._overlapTestCircle.position = circleCenter;
        
        let resultCounter = 0;
        let aabbBroadphaseResult = this.aabbBroadphase(bounds, null, layerMask);
        bounds = aabbBroadphaseResult.bounds;
        let potentials = aabbBroadphaseResult.tempHashSet;
        for (let i = 0; i < potentials.length; i++) {
            let collider = potentials[i];
            if (collider instanceof BoxCollider) {
                results[resultCounter] = collider;
                resultCounter++;
            } else if (collider instanceof CircleCollider) {
                if (collider.shape.overlaps(this._overlapTestCircle)){
                    results[resultCounter] = collider;
                    resultCounter ++;
                }
            } else if(collider instanceof PolygonCollider) {
                if (collider.shape.overlaps(this._overlapTestCircle)){
                    results[resultCounter] = collider;
                    resultCounter ++;
                }
            } else {
                throw new Error("overlapCircle against this collider type is not implemented!");
            }

            // 如果我们所有的结果数据有了则返回
            if (resultCounter == results.length)
                return resultCounter;
        }

        return resultCounter;
    }

    /**
     * 返回边框与单元格相交的所有对象
     * @param bounds 
     * @param excludeCollider 
     * @param layerMask 
     */
    public aabbBroadphase(bounds: Rectangle, excludeCollider: Collider, layerMask: number) {
        this._tempHashSet.length = 0;

        let p1 = this.cellCoords(bounds.x, bounds.y);
        let p2 = this.cellCoords(bounds.right, bounds.bottom);

        for (let x = p1.x; x <= p2.x; x++) {
            for (let y = p1.y; y <= p2.y; y++) {
                let cell = this.cellAtPosition(x, y);
                if (!cell)
                    continue;

                // 当cell不为空。循环并取回所有碰撞器
                for (let i = 0; i < cell.length; i++) {
                    let collider = cell[i];

                    // 如果它是自身或者如果它不匹配我们的层掩码 跳过这个碰撞器
                    if (collider == excludeCollider || !Flags.isFlagSet(layerMask, collider.physicsLayer))
                        continue;

                    if (bounds.intersects(collider.bounds)){
                        if (this._tempHashSet.indexOf(collider) == -1)
                            this._tempHashSet.push(collider);
                    }
                }
            }
        }

        return {tempHashSet: this._tempHashSet, bounds: bounds};
    }

    /**
     * 获取世界空间x,y值的单元格。
     * 如果单元格为空且createCellIfEmpty为true，则会创建一个新的单元格
     * @param x 
     * @param y 
     * @param createCellIfEmpty 
     */
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

    /**
     * 获取单元格的x,y值作为世界空间的x,y值
     * @param x 
     * @param y 
     */
    private cellCoords(x: number, y: number): Vector2 {
        return new Vector2(Math.floor(x * this._inverseCellSize), Math.floor(y * this._inverseCellSize));
    }

    /**
     * debug绘制空间散列的内容
     * @param secondsToDisplay 
     * @param textScale 
     */
    public debugDraw(secondsToDisplay: number, textScale: number = 1){
        for (let x = this.gridBounds.x; x <= this.gridBounds.right; x ++){
            for (let y = this.gridBounds.y; y <= this.gridBounds.bottom; y ++){
                let cell = this.cellAtPosition(x, y);
                if (cell && cell.length > 0)
                    this.debugDrawCellDetails(x, y, cell.length, secondsToDisplay, textScale);
            }
        }
    }

    private debugDrawCellDetails(x: number, y: number, cellCount: number, secondsToDisplay = 0.5, textScale = 1){
        
    }
}

class RaycastResultParser {

}

/**
 * 包装一个Unit32，列表碰撞器字典
 * 它的主要目的是将int、int x、y坐标散列到单个Uint32键中，使用O(1)查找。
 */
class NumberDictionary {
    private _store: Map<string, Collider[]> = new Map<string, Collider[]>();

    /**
     * 根据x和y值计算并返回散列键
     * @param x 
     * @param y 
     */
    private getKey(x: number, y: number): string {
        return Long.fromNumber(x).shiftLeft(32).or(Long.fromNumber(y, false)).toString();
    }

    public add(x: number, y: number, list: Collider[]) {
        this._store.set(this.getKey(x, y), list);
    }

    /**
     * 使用蛮力方法从字典存储列表中移除碰撞器
     * @param obj 
     */
    public remove(obj: Collider) {
        this._store.forEach(list => {
            if (list.contains(obj))
                list.remove(obj);
        })
    }

    public tryGetValue(x: number, y: number): Collider[] {
        return this._store.get(this.getKey(x, y));
    }

    /**
     * 清除字典数据
     */
    public clear() {
        this._store.clear();
    }
}