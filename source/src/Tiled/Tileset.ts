module es {
    export class TmxTileset extends TmxDocument implements ITmxElement {
        public map: TmxMap;
        public firstGid: number;
        public name;
        public tileWidth: number;
        public tileHeight: number;
        public spacing: number;
        public margin: number;
        public columns?: number;
        public tileCount?: number;
        public tiles: Map<number, TmxTilesetTile>;
        public tileOffset: TmxTileOffset;
        public properties: Map<string, string>;
        public image: TmxImage;
        public terrains: TmxTerrain[];
        /**
         * 为每个块缓存源矩形
         */
        public tileRegions: Map<number, Rectangle>;

        public update(){
            this.tiles.forEach(value => {
                value.updateAnimatedTiles();
            });
        }
    }

    export class TmxTileOffset {
        public x: number;
        public y: number;
    }

    export class TmxTerrain implements ITmxElement {
        public name;
        public tile: number;
        public properties: Map<string, string>;
    }
}