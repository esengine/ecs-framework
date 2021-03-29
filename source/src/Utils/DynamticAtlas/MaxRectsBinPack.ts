module es {
    export class MaxRectsBinPack {
        public binWidth: number = 0;
        public binHeight: number = 0;
        public allowRotations: boolean;

        public usedRectangles: Rectangle[] = [];
        public freeRectangles: Rectangle[] = [];

        constructor(width: number, height: number, rotations: boolean = true) {
            this.init(width, height, rotations);
        }

        public init(width: number, height: number, rotations: boolean = true) {
            this.binWidth = width;
            this.binHeight = height;
            this.allowRotations = rotations;

            let n = new Rectangle();
            n.x = 0;
            n.y = 0;
            n.width = width;
            n.height = height;

            this.usedRectangles.length = 0;

            this.freeRectangles.length = 0;
            this.freeRectangles.push(n);
        }

        public insert(width: number, height: number): Rectangle {
            let newNode = new Rectangle();
            let score1 = new Ref(0);
            let score2 = new Ref(0);
            newNode = this.findPositionForNewNodeBestAreaFit(width, height, score1, score2);

            if (newNode.height == 0)
                return newNode;

            let numRectanglesToProcess = this.freeRectangles.length;
            for (let i = 0; i < numRectanglesToProcess; ++i) {
                if (this.splitFreeNode(this.freeRectangles[i], newNode)) {
                    new es.List(this.freeRectangles).removeAt(i);
                    --i;
                    --numRectanglesToProcess;
                }
            }

            this.pruneFreeList();

            this.usedRectangles.push(newNode);
            return newNode;
        }

        public findPositionForNewNodeBestAreaFit(width: number, height: number, bestAreaFit: Ref<number>, bestShortSideFit: Ref<number>) {
            let bestNode = new Rectangle();

            bestAreaFit.value = Number.MAX_VALUE;

            for (let i = 0; i < this.freeRectangles.length; ++i) {
                let areaFit = this.freeRectangles[i].width * this.freeRectangles[i].height - width * height;

                // 试着将长方形放在直立（非翻转）的方向
                if (this.freeRectangles[i].width >= width && this.freeRectangles[i].height >= height) {
                    let leftoverHoriz = Math.abs(this.freeRectangles[i].width - width);
                    let leftoverVert = Math.abs(this.freeRectangles[i].height - height);
                    let shortSideFit = Math.min(leftoverHoriz, leftoverVert);

                    if (areaFit < bestAreaFit.value || (areaFit == bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
                        bestNode.x = this.freeRectangles[i].x;
                        bestNode.y = this.freeRectangles[i].y;
                        bestNode.width = width;
                        bestNode.height = height;
                        bestShortSideFit.value = shortSideFit;
                        bestAreaFit.value = areaFit;
                    }
                }

                if (this.allowRotations && this.freeRectangles[i].width >= height && this.freeRectangles[i].height >= width) {
                    let leftoverHoriz = Math.abs(this.freeRectangles[i].width - height);
                    let leftoverVert = Math.abs(this.freeRectangles[i].height - width);
                    let shortSideFit = Math.min(leftoverHoriz, leftoverVert);

                    if (areaFit < bestAreaFit.value || (areaFit == bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
                        bestNode.x = this.freeRectangles[i].x;
                        bestNode.y = this.freeRectangles[i].y;
                        bestNode.width = height;
                        bestNode.height = width;
                        bestShortSideFit.value = shortSideFit;
                        bestAreaFit.value = areaFit;
                    }
                }

                return bestNode;
            }
        }

        public splitFreeNode(freeNode: Rectangle, usedNode: Rectangle) {
            // 用SAT测试长方形是否均匀相交
            if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
                usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y)
                return false;

            if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
                // 在使用过的节点的上边新建一个节点
                if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
                    let newNode = freeNode;
                    newNode.height = usedNode.y - newNode.y;
                    this.freeRectangles.push(newNode);
                }

                // 在使用过的节点的底边新建节点
                if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
                    let newNode = freeNode;
                    newNode.y = usedNode.y + usedNode.height;
                    newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
                    this.freeRectangles.push(newNode);
                }
            }

            if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
                // 在使用过的节点的左侧新建节点
                if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
                    let newNode = freeNode;
                    newNode.width = usedNode.x - newNode.x;
                    this.freeRectangles.push(newNode);
                }

                // 在使用过的节点右侧新建节点
                if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
                    let newNode = freeNode;
                    newNode.x = usedNode.x + usedNode.width;
                    newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
                    this.freeRectangles.push(newNode);
                }
            }

            return true;
        }

        public pruneFreeList() {
            for (let i = 0; i < this.freeRectangles.length; ++i)
                for (let j = i + 1; j < this.freeRectangles.length; ++j) {
                    if (this.isContainedIn(this.freeRectangles[i], this.freeRectangles[j])) {
                        new es.List(this.freeRectangles).removeAt(i);
                        --i;
                        break;
                    }
                    if (this.isContainedIn(this.freeRectangles[j], this.freeRectangles[i])) {
                        new es.List(this.freeRectangles).removeAt(j);
                        --j;
                    }
                }
        }

        public isContainedIn(a: Rectangle, b: Rectangle) {
            return a.x >= b.x && a.y >= b.y
                && a.x + a.width <= b.x + b.width
                && a.y + a.height <= b.y + b.height;
        }
    }
}