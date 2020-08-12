///<reference path="./TiledCore.ts" />
module es {
    export class TmxMap extends TmxDocument {
        public version: string;
        public tiledVersion: string;
        public width: number;
        public height: number;
        public get worldWidth(){
            return this.width * this.tileWidth;
        }
        public get worldHeight(){
            return this.height * this.tileHeight;
        }

        public tileWidth: number;
        public tileHeight: number;
        public hexSideLength?: number;
        public orientation: OrientationType;
        public staggerAxis: StaggerAxisType;
        public staggerIndex: StaggerIndexType;
        public renderOrder: RenderOrderType;
        public backgroundColor: number;
        public nextObjectID?: number;

        /**
         * 包含所有的ITmxLayers，不管它们的具体类型是什么。
         * 注意，TmxGroup中的层将不在此列表中。TmxGroup管理自己的层列表。
         */
        public layers: TmxList<any>;
        public tilesets: TmxList<TmxTileset>;
        public tileLayers: TmxList<TmxLayer>;
        public objectGroups: TmxList<TmxObjectGroup>;
        public imageLayers: TmxList<TmxImageLayer>;
        public groups: TmxList<TmxGroup>;
        public properties: Map<string, string>;

        /**
         * 当我们有一个图像tileset，tile可以是任何大小，所以我们记录的最大大小来剔除
         */
        public maxTileWidth: number;

        /**
         * 当我们有一个图像tileset，tile可以是任何大小，所以我们记录的最大大小来剔除
         */
        public maxTileHeight: number;

        /**
         * 此地图是否具有需要非默认平铺大小的特殊剔除
         */
        public get requiresLargeTileCulling(): boolean {
            return this.maxTileHeight > this.tileHeight || this.maxTileWidth > this.tileWidth;
        }

        /**
         * 获取给定tileId的tile tileset
         * @param gid
         */
        public getTilesetForTileGid(gid: number): TmxTileset {
            if (gid == 0)
                return null;

            for (let i = this.tilesets.size - 1; i >= 0; i --){
                if (this.tilesets.get(i.toString()).firstGid <= gid)
                    return this.tilesets.get(i.toString());
            }

            console.error(`tile gid${gid}未在任何tileset中找到`);
        }

        /**
         * 更新他们的动画tile
         */
        public update(){
            this.tilesets.forEach(tileset => {tileset.update();});
        }

        public _isDisposed;
        public dispose(disposing: boolean = true){
            if (!this._isDisposed){
                if (disposing){
                    this.tilesets.forEach(tileset => {if (tileset.image) tileset.image.dispose()});
                    this.imageLayers.forEach(layer => {if (layer.image) layer.image.dispose();});
                }

                this._isDisposed = true;
            }
        }
    }

    export enum OrientationType {
        unknown,
        orthogonal,
        isometric,
        staggered,
        hexagonal
    }

    export enum StaggerAxisType {
        x,
        y
    }

    export enum StaggerIndexType {
        odd,
        even
    }

    export enum RenderOrderType {
        rightDown,
        rightUp,
        leftDown,
        leftUp
    }
}