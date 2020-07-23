module es {
    /**
     * 基本静态网格图与A*一起使用
     * 将walls添加到walls HashSet，并将加权节点添加到weightedNodes
     */
    export class AstarGridGraph implements IAstarGraph<Vector2> {
        public dirs: Vector2[] = [
            new Vector2(1, 0),
            new Vector2(0, -1),
            new Vector2(-1, 0),
            new Vector2(0, 1)
        ];

        public walls: Vector2[] = [];
        public weightedNodes: Vector2[] = [];
        public defaultWeight: number = 1;
        public weightedNodeWeight = 5;

        private _width;
        private _height;
        private _neighbors: Vector2[] = new Array(4);

        constructor(width: number, height: number){
            this._width = width;
            this._height = height;
        }

        /**
         * 确保节点在网格图的边界内
         * @param node
         */
        public isNodeInBounds(node: Vector2): boolean {
            return 0 <= node.x && node.x < this._width && 0 <= node.y && node.y < this._height;
        }

        /**
         * 检查节点是否可以通过。walls是不可逾越的。
         * @param node
         */
        public isNodePassable(node: Vector2): boolean {
            return !this.walls.firstOrDefault(wall => JSON.stringify(wall) == JSON.stringify(node));
        }

        /**
         * 调用AStarPathfinder.search的快捷方式
         * @param start
         * @param goal
         */
        public search(start: Vector2, goal: Vector2){
            return AStarPathfinder.search(this, start, goal);
        }

        public getNeighbors(node: Vector2): Vector2[] {
            this._neighbors.length = 0;

            this.dirs.forEach(dir => {
                let next = new Vector2(node.x + dir.x, node.y + dir.y);
                if (this.isNodeInBounds(next) && this.isNodePassable(next))
                    this._neighbors.push(next);
            });

            return this._neighbors;
        }

        public cost(from: Vector2, to: Vector2): number {
            return this.weightedNodes.find((p)=> JSON.stringify(p) == JSON.stringify(to)) ? this.weightedNodeWeight : this.defaultWeight;
        }

        public heuristic(node: Vector2, goal: Vector2) {
            return Math.abs(node.x - goal.x) + Math.abs(node.y - goal.y);
        }

    }
}
