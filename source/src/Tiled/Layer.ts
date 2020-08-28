module es {
    export class TmxLayer implements ITmxLayer {
        public map: TmxMap;
        public name: string;
        public opacity: number;
        public offsetX: number;
        public offsetY: number;
        public properties: Map<string, string>;
        public visible: boolean;
        public get offset(): Vector2 {
            return new Vector2(this.offsetX, this.offsetY);
        }

        /**
         * 这一层tile的宽度。对于固定大小的地图，始终与地图宽度相同。
         */
        public width: number;
        /**
         * 这一层的tile高度。对于固定大小的地图，始终与地图高度相同。
         */
        public height: number;
        public tiles: TmxLayerTile[];

        /**
         * 回带有gid的TmxLayerTile。这是一个慢查询，所以要缓存它
         * @param gid
         */
        public getTileWithGid(gid: number){
            for (let i = 0; i < this.tiles.length; i ++){
                if (this.tiles[i] && this.tiles[i].gid == gid)
                    return this.tiles[i];
            }

            return null;
        }

        /**
         * 获取x/y坐标处的TmxLayerTile。注意，这些是平铺坐标而不是世界坐标!
         * @param x
         * @param y
         */
        public getTile(x: number, y: number): TmxLayerTile {
            return this.tiles[x + y * this.width];
        }

        /**
         * 返回平铺空间中的矩形列表，其中任何非空平铺组合为边界区域
         */
        public getCollisionRectangles(): Rectangle[] {
            let checkedIndexes: boolean[] = new Array(this.tiles.length);
            let rectangles = [];
            let startCol = -1;
            let index = -1;

            for (let y = 0; y < this.map.height; y ++){
                for (let x = 0; x< this.map.width; x ++){
                    index = y * this.map.width + x;
                    let tile = this.getTile(x, y);
                    if (tile && !checkedIndexes[index]){
                        if (startCol < 0)
                            startCol = x;
                        checkedIndexes[index] = true;
                    }else if(!tile || checkedIndexes[index] == true){
                        if (startCol >= 0){
                            rectangles.push(this.findBoundsRect(startCol, x, y, checkedIndexes));
                            startCol = -1;
                        }
                    }
                }

                if (startCol >= 0){
                    rectangles.push(this.findBoundsRect(startCol, this.map.width, y, checkedIndexes));
                    startCol = -1;
                }
            }

            return rectangles;
        }

        /**
         * 在startX和endX之间的tile周围找到最大的边界矩形，从startY开始，尽可能向下
         * @param startX
         * @param endX
         * @param startY
         * @param checkedIndexes
         */
        public findBoundsRect(startX: number, endX: number, startY: number, checkedIndexes?: boolean[]){
            let index = -1;
            for (let y = startY + 1; y < this.map.height; y ++){
                for (let x = startX; x < endX; x ++){
                    index = y * this.map.width + x;
                    let tile = this.getTile(x, y);
                    if (!tile || checkedIndexes[index]){
                        // 再次将我们到目前为止在这一行中访问过的所有内容设置为false，因为它不会包含在矩形中，应该再次进行检查
                        for (let _x = startX; _x < x; _x++){
                            index = y * this.map.width + _x;
                            checkedIndexes[index] = false;
                        }

                        return new Rectangle(startX * this.map.tileWidth, startY * this.map.tileHeight,
                            (endX - startX) * this.map.tileWidth, (y - startY) * this.map.tileHeight);
                    }

                    checkedIndexes[index] = true;
                }
            }

            return new Rectangle(startX * this.map.tileWidth, startY * this.map.tileHeight,
                (endX - startX) * this.map.tileWidth, (this.map.height - startY) * this.map.tileHeight);
        }
    }

    export class TmxLayerTile {
        public static readonly FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
        public static readonly FLIPPED_VERTICALLY_FLAG = 0x40000000;
        // public static readonly FLIPPED_DIAGONALLY_FLAG = 0x20000000;

        public tileset: TmxTileset;
        public gid: number;
        public x: number;
        public y: number;
        public get position(): Vector2{
            return new Vector2(this.x, this.y);
        }
        public horizontalFlip: boolean;
        public verticalFlip: boolean;
        // public diagonalFlip: boolean;
        public _tilesetTileIndex?: number;

        /**
         * 获取此TmxLayerTile(如果存在)的TmxTilesetTile
         * TmxTilesetTile只存在于动态的tiles和带有附加属性的tiles中。
         */
        public get tilesetTile(): TmxTilesetTile {
            if (!this._tilesetTileIndex){
                this._tilesetTileIndex = -1;
                if (this.tileset.firstGid <= this.gid){
                    let tilesetTile = this.tileset.tiles.get(this.gid - this.tileset.firstGid);
                    if (tilesetTile){
                        this._tilesetTileIndex = this.gid - this.tileset.firstGid;
                    }
                }
            }

            if (this._tilesetTileIndex < 0)
                return null;

            return this.tileset.tiles.get(this._tilesetTileIndex);
        }

        constructor(map: TmxMap, id: number, x: number, y: number){
            this.x = x;
            this.y = y;
            let rawGid = id;

            // 扫描平铺反转位标志
            let flip: boolean;
            flip = (rawGid & TmxLayerTile.FLIPPED_HORIZONTALLY_FLAG) != 0;
            this.horizontalFlip = flip;

            flip = (rawGid & TmxLayerTile.FLIPPED_VERTICALLY_FLAG) != 0;
            this.verticalFlip = flip;

            // flip = (rawGid & TmxLayerTile.FLIPPED_DIAGONALLY_FLAG) != 0;
            // this.diagonalFlip = flip;

            // 零位标志
            rawGid &= ~(TmxLayerTile.FLIPPED_HORIZONTALLY_FLAG | TmxLayerTile.FLIPPED_VERTICALLY_FLAG);

            // 将GID保存
            this.gid = Math.floor(rawGid);
            this.tileset = map.getTilesetForTileGid(this.gid);
        }
    }
}