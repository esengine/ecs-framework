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
        public _cellDict: NumberDictionary<Collider> = new NumberDictionary<Collider>();
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
         * 注册一个碰撞器
         * @param collider 碰撞器
         */
        public register(collider: Collider): void {
            // 克隆碰撞器的 bounds 属性
            const bounds = collider.bounds.clone();
            // 存储克隆后的 bounds 属性到 registeredPhysicsBounds 属性中
            collider.registeredPhysicsBounds = bounds;
            // 获取碰撞器所在的网格坐标
            const p1 = this.cellCoords(bounds.x, bounds.y);
            const p2 = this.cellCoords(bounds.right, bounds.bottom);

            // 更新网格边界，以确保其覆盖所有碰撞器
            if (!this.gridBounds.contains(p1.x, p1.y)) {
                this.gridBounds = RectangleExt.union(this.gridBounds, p1);
            }
            if (!this.gridBounds.contains(p2.x, p2.y)) {
                this.gridBounds = RectangleExt.union(this.gridBounds, p2);
            }

            // 将碰撞器添加到所在的所有单元格中
            for (let x = p1.x; x <= p2.x; x++) {
                for (let y = p1.y; y <= p2.y; y++) {
                    // 如果该单元格不存在，创建一个新的单元格
                    const cell: Collider[] = this.cellAtPosition(x, y, /* createIfNotExists = */ true);
                    cell.push(collider);
                }
            }
        }

        /**
         * 从空间哈希中移除一个碰撞器
         * @param collider 碰撞器
         */
        public remove(collider: Collider): void {
            // 克隆碰撞器的 registeredPhysicsBounds 属性
            const bounds = collider.registeredPhysicsBounds.clone();
            // 获取碰撞器所在的网格坐标
            const p1 = this.cellCoords(bounds.x, bounds.y);
            const p2 = this.cellCoords(bounds.right, bounds.bottom);

            // 从所有单元格中移除该碰撞器
            for (let x = p1.x; x <= p2.x; x++) {
                for (let y = p1.y; y <= p2.y; y++) {
                    // 单元格应该始终存在，因为该碰撞器应该在所有查询的单元格中
                    const cell = this.cellAtPosition(x, y);
                    Insist.isNotNull(cell, `从不存在碰撞器的单元格中移除碰撞器: [${collider}]`);
                    if (cell != null) {
                        new es.List(cell).remove(collider);
                    }
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
         * 执行基于 AABB 的广域相交检测并返回碰撞器列表
         * @param bounds 边界矩形
         * @param excludeCollider 排除的碰撞器
         * @param layerMask 碰撞层掩码
         * @returns 碰撞器列表
         */
        public aabbBroadphase(bounds: Rectangle, excludeCollider: Collider, layerMask: number): Collider[] {
            this._tempHashSet.clear();

            // 获取边界矩形所在的网格单元格
            const p1 = this.cellCoords(bounds.x, bounds.y);
            const p2 = this.cellCoords(bounds.right, bounds.bottom);

            // 对所有相交的单元格中的碰撞器执行检测
            for (let x = p1.x; x <= p2.x; x++) {
                for (let y = p1.y; y <= p2.y; y++) {
                    const cell = this.cellAtPosition(x, y);
                    if (!cell) {
                        continue;
                    }

                    // 如果单元格不为空，循环并取回所有碰撞器
                    if (cell.length > 0) {
                        for (let i = 0; i < cell.length; i++) {
                            const collider = cell[i];

                            // 如果它是自身或者如果它不匹配我们的层掩码跳过这个碰撞器
                            if (collider === excludeCollider || !Flags.isFlagSet(layerMask, collider.physicsLayer.value)) {
                                continue;
                            }

                            // 检查碰撞器的 bounds 是否与边界矩形相交
                            if (bounds.intersects(collider.bounds)) {
                                this._tempHashSet.add(collider);
                            }
                        }
                    }
                }
            }

            // 返回所有相交的碰撞器列表
            return Array.from(this._tempHashSet);
        }

        /**
         * 执行基于线段的射线检测并返回所有命中的碰撞器
         * @param start 射线起点
         * @param end 射线终点
         * @param hits 射线命中结果
         * @param layerMask 碰撞层掩码
         * @param ignoredColliders 忽略的碰撞器
         * @returns 命中的碰撞器数量
         */
        public linecast(start: Vector2, end: Vector2, hits: RaycastHit[], layerMask: number, ignoredColliders: Set<Collider>): number {
            // 创建一个射线
            const ray = new Ray2D(start, end);
            // 使用射线解析器初始化线段命中结果
            this._raycastParser.start(ray, hits, layerMask, ignoredColliders);

            // 获取起点和终点所在的网格单元格
            let currentCell = this.cellCoords(start.x, start.y);
            const lastCell = this.cellCoords(end.x, end.y);

            // 计算射线在 x 和 y 方向上的步长
            let stepX = Math.sign(ray.direction.x);
            let stepY = Math.sign(ray.direction.y);
            if (currentCell.x === lastCell.x) {
                stepX = 0;
            }
            if (currentCell.y === lastCell.y) {
                stepY = 0;
            }

            // 计算 x 和 y 方向上的网格单元格步长
            const xStep = stepX < 0 ? 0 : stepX;
            const yStep = stepY < 0 ? 0 : stepY;
            let nextBoundaryX = (currentCell.x + xStep) * this._cellSize;
            let nextBoundaryY = (currentCell.y + yStep) * this._cellSize;

            // 计算 t 值的最大值和步长
            let tMaxX = ray.direction.x !== 0 ? (nextBoundaryX - ray.start.x) / ray.direction.x : Number.MAX_VALUE;
            let tMaxY = ray.direction.y !== 0 ? (nextBoundaryY - ray.start.y) / ray.direction.y : Number.MAX_VALUE;
            const tDeltaX = ray.direction.x !== 0 ? this._cellSize / (ray.direction.x * stepX) : Number.MAX_VALUE;
            const tDeltaY = ray.direction.y !== 0 ? this._cellSize / (ray.direction.y * stepY) : Number.MAX_VALUE;

            // 检查射线起点所在的单元格是否与射线相交
            let cell = this.cellAtPosition(currentCell.x, currentCell.y);
            if (cell !== null && this._raycastParser.checkRayIntersection(currentCell.x, currentCell.y, cell)) {
                this._raycastParser.reset();
                return this._raycastParser.hitCounter;
            }

            // 在所有相交的单元格中沿着射线前进并检查碰撞器
            while (currentCell.x !== lastCell.x || currentCell.y !== lastCell.y) {
                if (tMaxX < tMaxY) {
                    currentCell.x = MathHelper.toInt(MathHelper.approach(currentCell.x, lastCell.x, Math.abs(stepX)));
                    tMaxX += tDeltaX;
                } else {
                    currentCell.y = MathHelper.toInt(MathHelper.approach(currentCell.y, lastCell.y, Math.abs(stepY)));
                    tMaxY += tDeltaY;
                }

                cell = this.cellAtPosition(currentCell.x, currentCell.y);
                if (cell && this._raycastParser.checkRayIntersection(currentCell.x, currentCell.y, cell)) {
                    this._raycastParser.reset();
                    return this._raycastParser.hitCounter;
                }
            }

            // 重置射线解析器并返回命中的碰撞器数量
            this._raycastParser.reset();
            return this._raycastParser.hitCounter;
        }


        /**
         * 执行矩形重叠检测并返回所有命中的碰撞器
         * @param rect 矩形
         * @param results 碰撞器命中结果
         * @param layerMask 碰撞层掩码
         * @returns 命中的碰撞器数量
         */
        public overlapRectangle(rect: Rectangle, results: Collider[], layerMask: number): number {
            // 更新重叠检测框的位置和大小
            this._overlapTestBox.updateBox(rect.width, rect.height);
            this._overlapTestBox.position = rect.location;

            let resultCounter = 0;
            // 获取潜在的相交碰撞器
            const potentials = this.aabbBroadphase(rect, null, layerMask);

            // 遍历所有潜在的碰撞器并检查它们是否与矩形相交
            for (let i = 0; i < potentials.length; i++) {
                const collider = potentials[i];
                if (collider instanceof BoxCollider) {
                    // 如果是 BoxCollider，直接将其添加到命中结果中
                    results[resultCounter] = collider;
                    resultCounter++;
                } else if (collider instanceof CircleCollider) {
                    // 如果是 CircleCollider，使用 rectToCircle 函数检查矩形与圆是否相交
                    if (Collisions.rectToCircle(rect, collider.bounds.center, collider.bounds.width * 0.5)) {
                        results[resultCounter] = collider;
                        resultCounter++;
                    }
                } else if (collider instanceof PolygonCollider) {
                    // 如果是 PolygonCollider，使用 Polygon.shape.overlaps 函数检查矩形与多边形是否相交
                    if (collider.shape.overlaps(this._overlapTestBox)) {
                        results[resultCounter] = collider;
                        resultCounter++;
                    }
                } else {
                    throw new Error("overlapRectangle对这个类型没有实现!");
                }

                if (resultCounter === results.length) {
                    return resultCounter;
                }
            }

            return resultCounter;
        }


        /**
         * 执行圆形重叠检测并返回所有命中的碰撞器
         * @param circleCenter 圆心坐标
         * @param radius 圆形半径
         * @param results 碰撞器命中结果
         * @param layerMask 碰撞层掩码
         * @returns 命中的碰撞器数量
         */
        public overlapCircle(circleCenter: Vector2, radius: number, results: Collider[], layerMask: number): number {
            // 计算包含圆形的最小矩形框
            const bounds = new Rectangle(circleCenter.x - radius, circleCenter.y - radius, radius * 2, radius * 2);

            // 更新重叠检测圆的位置和半径
            this._overlapTestCircle.radius = radius;
            this._overlapTestCircle.position = circleCenter;

            let resultCounter = 0;
            // 获取潜在的相交碰撞器
            const potentials = this.aabbBroadphase(bounds, null, layerMask);

            // 遍历所有潜在的碰撞器并检查它们是否与圆相交
            if (potentials.length > 0) {
                for (let i = 0; i < potentials.length; i++) {
                    const collider = potentials[i];
                    if (collider instanceof BoxCollider) {
                        // 如果是 BoxCollider，使用 BoxCollider.shape.overlaps 函数检查矩形与圆是否相交
                        if (collider.shape.overlaps(this._overlapTestCircle)) {
                            results[resultCounter] = collider;
                            resultCounter++;
                        }
                    } else if (collider instanceof CircleCollider) {
                        // 如果是 CircleCollider，使用 CircleCollider.shape.overlaps 函数检查圆与圆是否相交
                        if (collider.shape.overlaps(this._overlapTestCircle)) {
                            results[resultCounter] = collider;
                            resultCounter++;
                        }
                    } else if (collider instanceof PolygonCollider) {
                        // 如果是 PolygonCollider，使用 PolygonCollider.shape.overlaps 函数检查多边形与圆是否相交
                        if (collider.shape.overlaps(this._overlapTestCircle)) {
                            results[resultCounter] = collider;
                            resultCounter++;
                        }
                    } else {
                        throw new Error("对这个对撞机类型的overlapCircle没有实现!");
                    }

                    if (resultCounter === results.length) {
                        return resultCounter;
                    }
                }
            }

            return resultCounter;
        }

        /**
         * 将给定的 x 和 y 坐标转换为单元格坐标
         * @param x X 坐标
         * @param y Y 坐标
         * @returns 转换后的单元格坐标
         */
        public cellCoords(x: number, y: number): Vector2 {
            // 使用 inverseCellSize 计算出单元格的 x 和 y 坐标
            return new Vector2(Math.floor(x * this._inverseCellSize), Math.floor(y * this._inverseCellSize));
        }

        /**
         * 返回一个包含特定位置处的所有碰撞器的数组
         * 如果此位置上没有单元格并且createCellIfEmpty参数为true，则会创建一个新的单元格
         * @param x 单元格 x 坐标
         * @param y 单元格 y 坐标
         * @param createCellIfEmpty 如果该位置上没有单元格是否创建一个新单元格，默认为false
         * @returns 该位置上的所有碰撞器
         */
        public cellAtPosition(x: number, y: number, createCellIfEmpty: boolean = false): Collider[] {
            // 获取指定位置的单元格
            let cell: Collider[] = this._cellDict.tryGetValue(x, y);

            // 如果不存在此位置的单元格，并且需要创建，则创建并返回空单元格
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
     * 数字字典
     */
    export class NumberDictionary<T> {
        // 存储数据的 Map 对象
        public _store: Map<string, T[]> = new Map<string, T[]>();

        /**
         * 将指定的列表添加到以给定 x 和 y 为键的字典条目中
         * @param x 字典的 x 坐标
         * @param y 字典的 y 坐标
         * @param list 要添加到字典的列表
         */
        public add(x: number, y: number, list: T[]) {
            this._store.set(this.getKey(x, y), list);
        }

        /**
         * 从字典中删除给定的对象
         * @param obj 要删除的对象
         */
        public remove(obj: T) {
            // 遍历 Map 中的所有值，从值中查找并删除给定的对象
            this._store.forEach(list => {
                let index = list.indexOf(obj);
                list.splice(index, 1);
            })
        }

        /**
         * 尝试从字典中检索指定键的值
         * @param x 字典的 x 坐标
         * @param y 字典的 y 坐标
         * @returns 指定键的值，如果不存在则返回 null
         */
        public tryGetValue(x: number, y: number): T[] {
            return this._store.get(this.getKey(x, y));
        }

        /**
         * 根据给定的 x 和 y 坐标返回一个唯一的字符串键
         * @param x 字典的 x 坐标
         * @param y 字典的 y 坐标
         * @returns 唯一的字符串键
         */
        public getKey(x: number, y: number) {
            return `${x}_${y}`;
        }

        /**
         * 清空字典
         */
        public clear() {
            this._store.clear();
        }
    }

    export class RaycastResultParser {
        public hitCounter: number;
        public static compareRaycastHits = (a: RaycastHit, b: RaycastHit) => {
            if (a.distance !== b.distance) {
                return a.distance - b.distance;
            } else {
                return a.collider.castSortOrder - b.collider.castSortOrder;
            }
        };

        public _hits: RaycastHit[];
        public _tempHit: RaycastHit = new RaycastHit();
        public _checkedColliders: Collider[] = [];
        public _cellHits: RaycastHit[] = [];
        public _ray: Ray2D;
        public _layerMask: number;
        private _ignoredColliders: Set<Collider>;

        public start(ray: Ray2D, hits: RaycastHit[], layerMask: number, ignoredColliders: Set<Collider>) {
            this._ray = ray;
            this._hits = hits;
            this._layerMask = layerMask;
            this._ignoredColliders = ignoredColliders;
            this.hitCounter = 0;
        }

        /**
         * 对射线检测到的碰撞器进行进一步的处理，将结果存储在传递的碰撞数组中。
         * @param cellX 当前单元格的x坐标
         * @param cellY 当前单元格的y坐标
         * @param cell 该单元格中的碰撞器列表
         * @returns 如果当前单元格有任何碰撞器与射线相交，则返回true
         */
        public checkRayIntersection(cellX: number, cellY: number, cell: Collider[]): boolean {
            for (let i = 0; i < cell.length; i++) {
                const potential = cell[i];

                // 如果该碰撞器已经处理过，则跳过它
                if (this._checkedColliders.indexOf(potential) != -1)
                    continue;

                // 将该碰撞器标记为已处理
                this._checkedColliders.push(potential);

                // 如果该碰撞器是触发器且当前不允许触发器响应射线检测，则跳过它
                if (potential.isTrigger && !Physics.raycastsHitTriggers)
                    continue;

                // 确保碰撞器的图层与所提供的图层掩码相匹配
                if (!Flags.isFlagSet(this._layerMask, potential.physicsLayer.value))
                    continue;

                // 如果设置了要忽略的碰撞器并且该碰撞器是被忽略的，则跳过它
                if (this._ignoredColliders && this._ignoredColliders.has(potential)) {
                    continue;
                }

                // TODO: Collisions.rectToLine方法可能会更快一些，因为它没有涉及到浮点数除法和平方根计算，而且更简单
                // 但是，rayIntersects方法也很快，并且在实际情况下可能更适合用于特定的应用程序
                // 先进行一个边界检查
                const colliderBounds = potential.bounds;
                const res = colliderBounds.rayIntersects(this._ray);
                if (res.intersected && res.distance <= 1) { // 只有当该碰撞器与射线相交且交点在射线长度范围内才进一步进行形状检测
                    let tempHit = new Out<RaycastHit>(this._tempHit);

                    // 调用形状的方法，检查该碰撞器是否与射线相交，并将结果保存在tempHit中
                    if (potential.shape.collidesWithLine(this._ray.start, this._ray.end, tempHit)) {
                        // 如果碰撞器包含射线起点，而且不允许射线起点在碰撞器中启动检测，那么跳过该碰撞器
                        if (!Physics.raycastsStartInColliders && potential.shape.containsPoint(this._ray.start))
                            continue;

                        // 将碰撞信息添加到列表中
                        tempHit.value.collider = potential;
                        this._cellHits.push(tempHit.value);
                    }
                }
            }

            if (this._cellHits.length === 0)
                return false;

            // 所有处理单元完成。对结果进行排序并将命中结果打包到结果数组中
            this._cellHits = this._cellHits.sort(RaycastResultParser.compareRaycastHits);
            for (let i = 0; i < this._cellHits.length; i++) {
                this._hits[this.hitCounter] = this._cellHits[i];

                // 增加命中计数器，如果它已经达到数组大小的限制，我们就完成了
                this.hitCounter++;
                if (this.hitCounter === this._hits.length)
                    return true;
            }

            return false;
        }

        public reset() {
            this._hits = null;
            this._checkedColliders.length = 0;
            this._cellHits.length = 0;
            this._ignoredColliders = null;
        }
    }
}
