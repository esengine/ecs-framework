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
    }

    export class TmxLayerTile {
        public static readonly FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
        public static readonly FLIPPED_VERTICALLY_FLAG = 0x40000000;
        public static readonly FLIPPED_DIAGONALLY_FLAG = 0x20000000;

        public tileset: TmxTileset;
        public gid: number;
        public x: number;
        public y: number;
        public get position(): Vector2{
            return new Vector2(this.x, this.y);
        }
        public horizontalFlip: boolean;
        public verticalFlip: boolean;
        public diagonalFlip: boolean;
        public _tilesetTileIndex?: number;

        /**
         * 获取此TmxLayerTile(如果存在)的TmxTilesetTile
         * TmxTilesetTile只存在于动态的tiles和带有附加属性的tiles中。
         */
        public get tilesetTile(): TmxTilesetTile {
            if (this._tilesetTileIndex == undefined){
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

            flip = (rawGid & TmxLayerTile.FLIPPED_DIAGONALLY_FLAG) != 0;
            this.diagonalFlip = flip;

            // 零位标志
            rawGid &= ~(TmxLayerTile.FLIPPED_HORIZONTALLY_FLAG | TmxLayerTile.FLIPPED_VERTICALLY_FLAG | TmxLayerTile.FLIPPED_DIAGONALLY_FLAG);

            // 将GID保存
            this.gid = rawGid;
            this.tileset = map.getTilesetForTileGid(this.gid);
        }
    }
}