module es {
    /**
     * 类用于在容器矩形内包装矩形，并具有接近最优解。
     */
    export class RectanglePacker {
        private _width: number = 0;
        private _height: number = 0;
        private _padding: number = 8;

        private _packedWidth = 0;
        private _packedHeight = 0;

        private _insertList: SortableSize[] = [];
        private _insertedRectangles: IntegerRectangle[] = [];
        private _freeAreas: IntegerRectangle[] = [];
        private _newFreeAreas: IntegerRectangle[] = [];

        private _outsideRectangle: IntegerRectangle;

        private _sortableSizeStack: SortableSize[] = [];
        private _rectangleStack: IntegerRectangle[] = [];

        public get rectangleCount() {
            return this._insertedRectangles.length;
        }

        public get packedWidth() {
            return this._packedWidth;
        }

        public get packedHeight() {
            return this._packedHeight;
        }

        public get padding() {
            return this._padding;
        }

        constructor(width: number, height: number, padding: number = 0) {
            this._outsideRectangle = new IntegerRectangle(width + 1, height + 1, 0, 0);
            this.reset(width, height, padding);
        }

        public reset(width: number, height: number, padding: number = 0) {
            while (this._insertedRectangles.length > 0)
                this.freeRectangle(this._insertedRectangles.pop());

            while (this._freeAreas.length > 0)
                this.freeRectangle(this._freeAreas.pop());

            this._width = width;
            this._height = height;

            this._packedWidth = 0;
            this._packedHeight = 0;

            this._freeAreas.push(this.allocateRectangle(0, 0, this._width, this._height));

            while (this._insertedRectangles.length > 0)
                this.freeSize(this._insertList.pop());

            this._padding = padding;
        }

        public insertRectangle(width: number, height: number, id: number) {
            let sortableSize = this.allocateSize(width, height, id);
            this._insertList.push(sortableSize);
        }

        public packRectangles(sort: boolean = true) {
            if (sort)
                this._insertList.sort((emp1, emp2) => {
                    return emp1.width - emp2.width;
                });

            while (this._insertList.length > 0) {
                let sortableSize = this._insertList.pop();
                let width = sortableSize.width;
                let height = sortableSize.height;

                let index = this.getFreeAreaIndex(width, height);
                if (index >= 0) {
                    let freeArea = this._freeAreas[index];
                    let target = this.allocateRectangle(freeArea.x, freeArea.y, width, height);
                    target.id = sortableSize.id;

                    this.generateNewFreeAreas(target, this._freeAreas, this._newFreeAreas);

                    while (this._newFreeAreas.length > 0)
                        this._freeAreas.push(this._newFreeAreas.pop());

                    this._insertedRectangles.push(target);

                    if (target.right > this._packedWidth)
                        this._packedWidth = target.right;

                    if (target.bottom > this._packedHeight)
                        this._packedHeight = target.bottom;
                }

                this.freeSize(sortableSize);
            }

            return this.rectangleCount;
        }

        public getRectangle(index: number, rectangle: IntegerRectangle){
            let inserted = this._insertedRectangles[index];
            rectangle.x = inserted.x;
            rectangle.y = inserted.y;
            rectangle.width = inserted.width;
            rectangle.height = inserted.height;

            return rectangle;
        }

        public getRectangleId(index: number){
            let inserted = this._insertedRectangles[index];
            return inserted.id;
        }

        private generateNewFreeAreas(target: IntegerRectangle, areas: IntegerRectangle[], results: IntegerRectangle[]) {
            let x = target.x;
            let y = target.y;
            let right = target.right + 1 + this._padding;
            let bottom = target.bottom + 1 + this._padding;

            let targetWithPadding: IntegerRectangle = null;
            if (this._padding == 0)
                targetWithPadding = target;

            for (let i = areas.length - 1; i >= 0; i --){
                let area = areas[i];
                if (!(x >= area.right || right <= area.x || y >= area.bottom || bottom <= area.y)){
                    if (targetWithPadding == null)
                        targetWithPadding = this.allocateRectangle(target.x, target.y, target.width + this._padding, target.height + this._padding);

                    this.generateDividedAreas(targetWithPadding, area, results);
                    let topOfStack = areas.pop();
                    if (i < areas.length){
                        areas[i] = topOfStack;
                    }
                }
            }

            if (targetWithPadding != null && targetWithPadding != target)
                this.freeRectangle(targetWithPadding);

            this.filterSelfSubAreas(results);
        }

        private filterSelfSubAreas(areas: IntegerRectangle[]){
            for (let i = areas.length - 1; i >= 0; i --){
                let filtered = areas[i];
                for (let j = areas.length - 1; j >= 0; j --){
                    if (i != j){
                        let area = areas[j];
                        if (filtered.x >= area.x && filtered.y >= area.y && filtered.right <= area.right && filtered.bottom <= area.bottom){
                            this.freeRectangle(filtered);
                            let topOfStack = areas.pop();
                            if (i < areas.length){
                                areas[i] = topOfStack;
                            }
                            break;
                        }
                    }
                }
            }
        }

        private generateDividedAreas(divider: IntegerRectangle, area: IntegerRectangle, results: IntegerRectangle[]){
            let count = 0;

            let rightDelta = area.right - divider.right;
            if (rightDelta > 0){
                results.push(this.allocateRectangle(divider.right, area.y, rightDelta, area.height));
                count ++;
            }

            let leftDelta = divider.x - area.x;
            if (leftDelta > 0){
                results.push(this.allocateRectangle(area.x, area.y, leftDelta, area.height));
                count ++;
            }

            let bottomDelta = area.bottom - divider.bottom;
            if (bottomDelta > 0){
                results.push(this.allocateRectangle(area.x, divider.bottom, area.width, bottomDelta));
                count ++;
            }

            let topDelta = divider.y - area.y;
            if (topDelta > 0){
                results.push(this.allocateRectangle(area.x, area.y, area.width, topDelta));
                count ++;
            }

            if (count == 0 && (divider.width < area.width || divider.height < area.height)){
                results.push(area);
            }else{
                this.freeRectangle(area);
            }
        }

        private getFreeAreaIndex(width: number, height: number) {
            let best = this._outsideRectangle;
            let index = -1;

            let paddedWidth = width + this._padding;
            let paddedHeight = height + this._padding;

            let count = this._freeAreas.length;
            for (let i = count - 1; i >= 0; i--) {
                let free = this._freeAreas[i];
                if (free.x < this._packedWidth || free.y < this.packedHeight) {
                    if (free.x < best.x && paddedWidth <= free.width && paddedHeight <= free.height) {
                        index = i;
                        if ((paddedWidth == free.width && free.width <= free.height && free.right < this._width) ||
                            (paddedHeight == free.height && free.height <= free.width)) {
                            break;
                        }

                        best = free;
                    }
                } else {
                    if (free.x < best.x && width <= free.width && height <= free.height) {
                        index = i;
                        if ((width == free.width && free.width <= free.height && free.right < this._width) ||
                            (height == free.height && free.height <= free.width)) {
                            break;
                        }

                        best = free;
                    }
                }
            }

            return index;
        }

        private allocateSize(width: number, height: number, id: number): SortableSize {
            if (this._sortableSizeStack.length > 0) {
                let size: SortableSize = this._sortableSizeStack.pop();
                size.width = width;
                size.height = height;
                size.id = id;

                return size;
            }

            return new SortableSize(width, height, id);
        }

        private freeSize(size: SortableSize) {
            this._sortableSizeStack.push(size);
        }

        private allocateRectangle(x: number, y: number, width: number, height: number) {
            if (this._rectangleStack.length > 0) {
                let rectangle = this._rectangleStack.pop();
                rectangle.x = x;
                rectangle.y = y;
                rectangle.width = width;
                rectangle.height = height;
                rectangle.right = x + width;
                rectangle.bottom = y + height;

                return rectangle;
            }

            return new IntegerRectangle(x, y, width, height);
        }

        private freeRectangle(rectangle: IntegerRectangle) {
            this._rectangleStack.push(rectangle);
        }
    }
}