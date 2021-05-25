module es {
    export class SpatialHash {
        public gridBounds: Rectangle = new Rectangle();

        public _raycastParser: RaycastResultParser;
        /**
         * 散列中每个单元格的大小
         */
        public _cellSize: number;
        /**
         * 1除以单元格大小。缓存结果，因为它被大量使用。
         */
        public _inverseCellSize: number;
        /**
         * 重叠检查缓存框
         */
        public _overlapTestBox: Box = new Box(0, 0);
        /**
         * 重叠检查缓存圈
         */
        public _overlapTestCircle: Circle = new Circle(0);
        /**
         * 保存所有数据的字典
         */
        public _cellDict: NumberDictionary = new NumberDictionary();
        /**
         * 用于返回冲突信息的共享HashSet
         */
        public _tempHashSet: Set<Collider> = new Set<Collider>();

        constructor(cellSize: number = 100) {
            this._cellSize = cellSize;
            this._inverseCellSize = 1 / this._cellSize;
            this._raycastParser = new RaycastResultParser();
        }

        /**
         * 将对象添加到SpatialHash
         * @param collider
         */
        public register(collider: Collider) {
            let bounds = collider.bounds.clone();
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
                    let c: Collider[] = this.cellAtPosition(x, y, true);
                    c.push(collider);
                }
            }
        }

        /**
         * 从SpatialHash中删除对象
         * @param collider
         */
        public remove(collider: Collider) {
            let bounds = collider.registeredPhysicsBounds.clone();
            let p1 = this.cellCoords(bounds.x, bounds.y);
            let p2 = this.cellCoords(bounds.right, bounds.bottom);

            for (let x = p1.x; x <= p2.x; x++) {
                for (let y = p1.y; y <= p2.y; y++) {
                    // 单元格应该始终存在，因为这个碰撞器应该在所有查询的单元格中
                    let cell = this.cellAtPosition(x, y);
                    Insist.isNotNull(cell, `从不存在碰撞器的单元格中移除碰撞器: [${collider}]`);
                    if (cell != null)
                        new es.List(cell).remove(collider);
                }
            }
        }

        /**
         * 使用蛮力方法从SpatialHash中删除对象
         * @param obj
         */
        public removeWithBruteForce(obj: Collider) {
            this._cellDict.remove(obj);
        }

        public clear() {
            this._cellDict.clear();
        }

        /**
         * 返回边框与单元格相交的所有对象
         * @param bounds
         * @param excludeCollider
         * @param layerMask
         */
        public aabbBroadphase(bounds: Rectangle, excludeCollider: Collider, layerMask: number): Set<Collider> {
            this._tempHashSet.clear();

            let p1 = this.cellCoords(bounds.x, bounds.y);
            let p2 = this.cellCoords(bounds.right, bounds.bottom);

            for (let x = p1.x; x <= p2.x; x++) {
                for (let y = p1.y; y <= p2.y; y++) {
                    let cell = this.cellAtPosition(x, y);
                    if (cell == null)
                        continue;

                    // 当cell不为空。循环并取回所有碰撞器
                    for (let i = 0; i < cell.length; i++) {
                        let collider = cell[i];

                        // 如果它是自身或者如果它不匹配我们的层掩码 跳过这个碰撞器
                        if (collider == excludeCollider || !Flags.isFlagSet(layerMask, collider.physicsLayer.value))
                            continue;

                        if (bounds.intersects(collider.bounds)) {
                            this._tempHashSet.add(collider);
                        }
                    }
                }
            }

            return this._tempHashSet;
        }

        /**
         * 通过空间散列投掷一条线，并将该线碰到的任何碰撞器填入碰撞数组
         * https://github.com/francisengelmann/fast_voxel_traversal/blob/master/main.cpp
         * http://www.cse.yorku.ca/~amana/research/grid.pdf
         * @param start
         * @param end
         * @param hits
         * @param layerMask
         */
        public linecast(start: Vector2, end: Vector2, hits: RaycastHit[], layerMask: number){
            let ray = new Ray2D(start, end);
            this._raycastParser.start(ray, hits, layerMask);

            // 获取我们的起始/结束位置，与我们的网格在同一空间内
            let currentCell = this.cellCoords(start.x, start.y);
            let lastCell = this.cellCoords(end.x, end.y);

            // 我们向什么方向递增单元格检查？
            let stepX = Math.sign(ray.direction.x);
            let stepY = Math.sign(ray.direction.y);

            // 我们要确保，如果我们在同一条线上或同一排上，就不会踩到不必要的方向上
            if (currentCell.x == lastCell.x) stepX = 0;
            if (currentCell.y == lastCell.y) stepY = 0;

            // 计算单元格的边界。
            // 当步长为正数时，下一个单元格在这个单元格之后，意味着我们要加1。
            let xStep = stepX < 0 ? 0 : stepX;
            let yStep = stepY < 0 ? 0 : stepY;
            let nextBoundaryX = (currentCell.x + xStep) * this._cellSize;
            let nextBoundaryY = (currentCell.y + yStep) * this._cellSize;

            // 确定射线穿过第一个垂直体素边界时的t值，y/水平也是如此。
            // 这两个值的最小值将表明我们可以沿着射线移动多少，并且仍然保持在当前的体素中，对于接近垂直/水平的射线可能是无限的。
            let tMaxX = ray.direction.x != 0 ? (nextBoundaryX - ray.start.x) / ray.direction.x : Number.MAX_VALUE;
            let tMaxY = ray.direction.y != 0 ? (nextBoundaryY - ray.start.y) / ray.direction.y : Number.MAX_VALUE;

            // 我们要走多远才能从一个单元格的边界穿过一个单元格
            let tDeltaX = ray.direction.x != 0 ? this._cellSize / (ray.direction.x * stepX) : Number.MAX_VALUE;
            let tDeltaY = ray.direction.y != 0 ? this._cellSize / (ray.direction.y * stepY) : Number.MAX_VALUE;

            // 开始遍历并返回交叉单元格。
            let cell = this.cellAtPosition(currentCell.x, currentCell.y);

            if (cell && this._raycastParser.checkRayIntersection(currentCell.x, currentCell.y, cell)){
                this._raycastParser.reset();
                return this._raycastParser.hitCounter;
            }

            while (currentCell.x != lastCell.x || currentCell.y != lastCell.y){
                if (tMaxX < tMaxY){
                    currentCell.x = Math.trunc(MathHelper.approach(currentCell.x, lastCell.x, Math.abs(stepX)));

                    tMaxX += tDeltaX;
                }else{
                    currentCell.y = Math.trunc(MathHelper.approach(currentCell.y, lastCell.y, Math.abs(stepY)));

                    tMaxY += tDeltaY;
                }

                cell = this.cellAtPosition(currentCell.x, currentCell.y);
                if (cell && this._raycastParser.checkRayIntersection(currentCell.x, currentCell.y, cell)){
                    this._raycastParser.reset();
                    return this._raycastParser.hitCounter;
                }
            }

            // 复位
            this._raycastParser.reset();
            return this._raycastParser.hitCounter;
        }

        /**
         * 获取所有在指定矩形范围内的碰撞器
         * @param rect 
         * @param results 
         * @param layerMask 
         */
        public overlapRectangle(rect: Rectangle, results: Collider[], layerMask: number) {
            this._overlapTestBox.updateBox(rect.width, rect.height);
            this._overlapTestBox.position = rect.location;

            let resultCounter = 0;
            let potentials = this.aabbBroadphase(rect, null, layerMask);
            for (let collider of potentials) {
                if (collider instanceof BoxCollider) {
                    results[resultCounter] = collider;
                    resultCounter ++;
                } else if(collider instanceof CircleCollider) {
                    if (Collisions.rectToCircle(rect, collider.bounds.center, collider.bounds.width * 0.5)) {
                        results[resultCounter] = collider;
                        resultCounter ++;
                    }
                } else if(collider instanceof PolygonCollider) {
                    if (collider.shape.overlaps(this._overlapTestBox)) {
                        results[resultCounter] = collider;
                        resultCounter ++;
                    }
                } else {
                    throw new Error("overlapRectangle对这个类型没有实现!");
                }

                if (resultCounter == results.length)
                    return resultCounter;
            }

            return resultCounter;
        }

        /**
         * 获取所有落在指定圆圈内的碰撞器
         * @param circleCenter
         * @param radius
         * @param results
         * @param layerMask
         */
        public overlapCircle(circleCenter: Vector2, radius: number, results: Collider[], layerMask): number {
            let bounds = new Rectangle(circleCenter.x - radius, circleCenter.y - radius, radius * 2, radius * 2);

            this._overlapTestCircle.radius = radius;
            this._overlapTestCircle.position = circleCenter;

            let resultCounter = 0;
            let potentials = this.aabbBroadphase(bounds, null, layerMask);
            for (let collider of potentials) {
                if (collider instanceof BoxCollider) {
                    results[resultCounter] = collider;
                    resultCounter++;
                } else if (collider instanceof CircleCollider) {
                    if (collider.shape.overlaps(this._overlapTestCircle)) {
                        results[resultCounter] = collider;
                        resultCounter++;
                    }
                } else if (collider instanceof PolygonCollider) {
                    if (collider.shape.overlaps(this._overlapTestCircle)) {
                        results[resultCounter] = collider;
                        resultCounter++;
                    }
                } else {
                    throw new Error("对这个对撞机类型的overlapCircle没有实现!");
                }

                // 如果我们所有的结果数据有了则返回
                if (resultCounter == results.length)
                    return resultCounter;
            }

            return resultCounter;
        }

        /**
         * 获取单元格的x,y值作为世界空间的x,y值
         * @param x
         * @param y
         */
        public cellCoords(x: number, y: number): Vector2 {
            return new Vector2(MathHelper.floorToInt(x * this._inverseCellSize), MathHelper.floorToInt(y * this._inverseCellSize));
        }

        /**
         * 获取世界空间x,y值的单元格。
         * 如果单元格为空且createCellIfEmpty为true，则会创建一个新的单元格
         * @param x
         * @param y
         * @param createCellIfEmpty
         */
        public cellAtPosition(x: number, y: number, createCellIfEmpty: boolean = false): Collider[] {
            let cell: Collider[] = this._cellDict.tryGetValue(x, y);
            if (!cell) {
                if (createCellIfEmpty) {
                    cell = [];
                    this._cellDict.add(x, y, cell);
                }
            }
            return cell;
        }
    }

    /**
     * 包装一个Unit32，列表碰撞器字典
     * 它的主要目的是将int、int x、y坐标散列到单个Uint32键中，使用O(1)查找。
     */
    export class NumberDictionary {
        public _store: Map<number, Collider[]> = new Map<number, Collider[]>();

        public add(x: number, y: number, list: Collider[]) {
            this._store.set(this.getKey(x, y), list);
        }

        /**
         * 使用蛮力方法从字典存储列表中移除碰撞器
         * @param obj
         */
        public remove(obj: Collider) {
            this._store.forEach(list => {
                let linqList = new es.List(list);
                if (linqList.contains(obj))
                    linqList.remove(obj);
            })
        }

        public tryGetValue(x: number, y: number): Collider[] {
            return this._store.get(this.getKey(x, y));
        }

        public getKey(x: number, y: number){
            return x << 16 | (y >>> 0);
        }

        /**
         * 清除字典数据
         */
        public clear() {
            this._store.clear();
        }
    }

    export class RaycastResultParser {
        public hitCounter: number;
        public static compareRaycastHits = (a: RaycastHit, b: RaycastHit) => {
            return a.distance - b.distance;
        };

        public _hits: RaycastHit[];
        public _tempHit: RaycastHit = new RaycastHit();
        public _checkedColliders: Collider[] = [];
        public _cellHits: RaycastHit[] = [];
        public _ray: Ray2D;
        public _layerMask: number;

        public start(ray: Ray2D, hits: RaycastHit[], layerMask: number) {
            this._ray = ray;
            this._hits = hits;
            this._layerMask = layerMask;
            this.hitCounter = 0;
        }

        /**
         * 如果hits数组被填充，返回true。单元格不能为空!
         * @param cellX
         * @param cellY
         * @param cell
         */
        public checkRayIntersection(cellX: number, cellY: number, cell: Collider[]): boolean {
            let fraction: Ref<number> = new Ref(0);
            for (let i = 0; i < cell.length; i++) {
                let potential = cell[i];

                // 管理我们已经处理过的碰撞器
                if (new es.List(this._checkedColliders).contains(potential))
                    continue;

                this._checkedColliders.push(potential);
                // 只有当我们被设置为这样做时才会点击触发器
                if (potential.isTrigger && !Physics.raycastsHitTriggers)
                    continue;

                // 确保碰撞器在图层蒙版上
                if (!Flags.isFlagSet(this._layerMask, potential.physicsLayer.value))
                    continue;

                // TODO: rayIntersects的性能够吗?需要测试它。Collisions.rectToLine可能更快
                // TODO: 如果边界检查返回更多数据，我们就不需要为BoxCollider检查做任何事情
                // 在做形状测试之前先做一个边界检查
                let colliderBounds = potential.bounds.clone();
                if (colliderBounds.rayIntersects(this._ray, fraction) && fraction.value <= 1){
                    if (potential.shape.collidesWithLine(this._ray.start, this._ray.end, this._tempHit)) {
                        // 检查一下，我们应该排除这些射线，射线cast是否在碰撞器中开始
                        if (!Physics.raycastsStartInColliders && potential.shape.containsPoint(this._ray.start))
                            continue;

                        // TODO: 确保碰撞点在当前单元格中，如果它没有保存它以供以后计算

                        this._tempHit.collider = potential;
                        this._cellHits.push(this._tempHit);
                    }
                }
            }

            if (this._cellHits.length == 0)
                return false;

            // 所有处理单元完成。对结果进行排序并将命中结果打包到结果数组中
            this._cellHits.sort(RaycastResultParser.compareRaycastHits);
            for (let i = 0; i < this._cellHits.length; i ++){
                this._hits[this.hitCounter] = this._cellHits[i];

                // 增加命中计数器，如果它已经达到数组大小的限制，我们就完成了
                this.hitCounter ++;
                if (this.hitCounter == this._hits.length)
                    return true;
            }

            return false;
        }

        public reset(){
            this._hits = null;
            this._checkedColliders.length = 0;
            this._cellHits.length = 0;
        }
    }
}
