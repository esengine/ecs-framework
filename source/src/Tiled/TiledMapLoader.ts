module es {
    import Bitmap = egret.Bitmap;

    export class TiledMapLoader {
        public static loadTmxMap(map: TmxMap, filePath: string){
            let xMap = RES.getRes(filePath);
            return this.loadTmxMapData(map, xMap);
        }

        public static async loadTmxMapData(map: TmxMap, xMap: any){
            map.version = xMap["version"];
            map.tiledVersion = xMap["tiledversion"];
            map.width = xMap["width"];
            map.height = xMap["height"];
            map.tileWidth = xMap["tilewidth"];
            map.tileHeight = xMap["tileheight"];
            map.hexSideLength = xMap["hexsidelength"];

            map.orientation = this.parseOrientationType(xMap["orientation"]);
            map.staggerAxis = this.parseStaggerAxisType(xMap["staggeraxis"]);
            map.staggerIndex = this.parseStaggerIndexType(xMap["staggerindex"]);
            map.renderOrder = this.parseRenderOrderType(xMap["renderorder"]);

            map.nextObjectID = xMap["nextobjectid"];
            map.backgroundColor = TmxUtils.color16ToUnit(xMap["color"]);

            map.properties = this.parsePropertyDict(xMap["properties"]);

            // 我们保持记录的最大瓷砖大小的情况下，图像tileset随机大小
            map.maxTileWidth = map.tileWidth;
            map.maxTileHeight = map.tileHeight;

            map.tilesets = [];
            for (let e of xMap["tilesets"]){
                let tileset = await this.parseTmxTileset(map, e);
                map.tilesets.push(tileset);

                this.updateMaxTileSizes(tileset);
            }

            map.layers = [];
            map.tileLayers = [];
            map.objectGroups = [];
            map.imageLayers = [];
            map.groups = [];

            this.parseLayers(map, xMap, map, map.width, map.height, map.tmxDirectory);

            return map;
        }

        /**
         * 解析xEle中的所有层，将它们放入容器中
         * @param container
         * @param xEle
         * @param map
         * @param width
         * @param height
         * @param tmxDirectory
         */
        public static parseLayers(container: any, xEle: any, map: TmxMap, width: number, height: number, tmxDirectory: string){

        }

        private static updateMaxTileSizes(tileset: TmxTileset){
            // 必须迭代字典，因为tile.gid可以是任意顺序的的任何数字
            tileset.tiles.forEach(tile => {
                if (tile.image){
                    if (tile.image.width > tileset.map.maxTileWidth)
                        tileset.map.maxTileWidth = tile.image.width;
                    if (tile.image.height > tileset.map.maxTileHeight)
                        tileset.map.maxTileHeight = tile.image.height;
                }
            });

            tileset.tileRegions.forEach(region => {
                let width = region.width;
                let height = region.height;
                if (width > tileset.map.maxTileWidth) tileset.map.maxTileWidth = width;
                if (width > tileset.map.maxTileHeight) tileset.map.maxTileHeight = height;
            });
        }

        public static parseOrientationType(type: string){
            if (type == "unknown")
                return OrientationType.unknown;
            if (type == "orthogonal")
                return OrientationType.orthogonal;
            if (type == "isometric")
                return OrientationType.isometric;
            if (type == "staggered")
                return OrientationType.staggered;
            if (type == "hexagonal")
                return OrientationType.hexagonal;

            return OrientationType.unknown;
        }

        public static parseStaggerAxisType(type: string){
            if (type == "y")
                return StaggerAxisType.y;
            return StaggerAxisType.x;
        }

        public static parseStaggerIndexType(type: string){
            if (type == "even")
                return StaggerIndexType.even;
            return StaggerIndexType.odd;
        }

        public static parseRenderOrderType(type: string){
            if (type == "right-up")
                return RenderOrderType.rightUp;
            if (type == "left-down")
                return RenderOrderType.leftDown;
            if (type == "left-up")
                return RenderOrderType.leftUp;
            return RenderOrderType.rightDown;
        }

        public static parsePropertyDict(prop) {
            if (!prop)
                return null;

            let dict = new Map<string, string>();
            for (let p of prop["property"]){
                let pname = p["name"];
                let valueAttr = p["value"];
                let pval = valueAttr ? valueAttr : p;

                dict.set(pname, pval);
            }
            return dict;
        }

        public static async parseTmxTileset(map: TmxMap, xTileset: any){
            // firstgid总是在TMX中，而不是在TSX中
            let xFirstGid = xTileset["firstgid"];
            let firstGid = xFirstGid;
            let source = xTileset["image"];

            // 如果是嵌入式TmxTileset，即不是外部的，source将为null
            if (!source){
                source = "resource/assets/" + source;
                // 其他所有内容都在TSX文件中
                let xDocTileset = await RES.getResByUrl(source, null, this, RES.ResourceItem.TYPE_IMAGE);
                let tileset = this.loadTmxTileset(new TmxTileset(), map, xDocTileset["tileset"], firstGid);

                return tileset;
            }

            return this.loadTmxTileset(new TmxTileset(), map, xTileset, firstGid);
        }

        public static async loadTmxTileset(tileset: TmxTileset, map: TmxMap, xTileset: any,
                                     firstGid: number){
            tileset.map = map;
            tileset.firstGid = firstGid;

            tileset.name = xTileset["name"];
            tileset.tileWidth = xTileset["tilewidth"];
            tileset.tileHeight = xTileset["tileheight"];
            tileset.spacing = xTileset["spacing"] != undefined ? xTileset["spacing"] : 0;
            tileset.margin = xTileset["margin"] != undefined ? xTileset["margin"] : 0;
            tileset.columns = xTileset["columns"];
            tileset.tileCount = xTileset["tilecount"];
            tileset.tileOffset = this.parseTmxTileOffset(xTileset["tileoffset"]);

            let xImage = xTileset["image"];
            if (xImage)
                tileset.image = await this.loadTmxImage(new TmxImage(), xTileset);

            let xTerrainType = xTileset["terraintypes"];
            if (xTerrainType){
                tileset.terrains = [];
                for (let e of xTerrainType["terrains"])
                    tileset.terrains.push(this.parseTmxTerrain(e));
            }

            tileset.tiles = new Map<number, TmxTilesetTile>();
            for (let xTile of xTileset["tiles"]){
                let tile = await this.loadTmxTilesetTile(new TmxTilesetTile(), tileset, xTile, tileset.terrains);
                tileset.tiles[tile.id] = tile;
            }

            tileset.properties = this.parsePropertyDict(xTileset["properties"]);

            // 缓存我们的源矩形为每个瓷砖，所以我们不必每次我们渲染计算他们。
            // 如果我们有一个image，这是一个普通的tileset，否则它是一个image tileset
            tileset.tileRegions = new Map<number, Rectangle>();
            if (tileset.image){
                let id = firstGid;
                for (let y = tileset.margin; y < tileset.image.height - tileset.margin; y += tileset.tileHeight + tileset.spacing){
                    let column = 0;
                    for (let x = tileset.margin; x < tileset.image.width - tileset.margin; x += tileset.tileWidth + tileset.spacing){
                        tileset.tileRegions.set(id++, new Rectangle(x, y, tileset.tileWidth, tileset.tileHeight));

                        if (++column >= tileset.columns)
                            break;
                    }
                }
            }else{
                tileset.tiles.forEach(tile => {
                    tileset.tileRegions.set(firstGid + tile.id, new Rectangle(0, 0, tile.image.width, tile.image.height));
                });
            }

            return tileset;
        }

        public static async loadTmxTilesetTile(tile: TmxTilesetTile, tileset: TmxTileset, xTile: any, terrains: TmxTerrain[]){
            tile.tileset = tileset;
            tile.id = xTile["id"];

            tile.terrainEdges = xTile["terrain"];
            tile.probability = xTile["probability"] != undefined ? xTile["probability"] : 1;
            tile.type = xTile["type"];
            let xImage = xTile["image"];
            if (xImage){
                tile.image = await this.loadTmxImage(new TmxImage(), xImage);
            }

            tile.objectGroups = [];
            if (xTile["objectgroup"])
                for (let e of xTile["objectgroup"])
                    tile.objectGroups.push(this.loadTmxObjectGroup(new TmxObjectGroup(), tileset.map, e));

            tile.animationFrames = [];
            if (xTile["animation"]){
                for (let e of xTile["animation"]["frame"])
                    tile.animationFrames.push(this.loadTmxAnimationFrame(new TmxAnimationFrame(), e));
            }

            tile.properties = this.parsePropertyDict(xTile["properties"]);
            if (tile.properties)
                tile.processProperties();
            return tile;
        }

        public static loadTmxAnimationFrame(frame: TmxAnimationFrame, xFrame: any){
            frame.gid = xFrame["tileid"];
            frame.duration = xFrame["duration"] / 1000;

            return frame;
        }

        public static loadTmxObjectGroup(group: TmxObjectGroup, map: TmxMap, xObjectGroup: any) {
            group.map = map;
            group.name = xObjectGroup["name"] != undefined ? xObjectGroup["name"] : "";
            group.color = TmxUtils.color16ToUnit(xObjectGroup["color"]);
            group.opacity = xObjectGroup["opacity"] != undefined ? xObjectGroup["opacity"] : 1;
            group.visible = xObjectGroup["visible"] != undefined ? xObjectGroup["visible"] : true;
            group.offsetX = xObjectGroup["offsetx"] != undefined ? xObjectGroup["offsetx"] : 0;
            group.offsetY = xObjectGroup["offsety"] != undefined ? xObjectGroup["offsety"] : 0;

            let drawOrderDict = new Map<string, DrawOrderType>();
            drawOrderDict.set("unknown", DrawOrderType.unkownOrder);
            drawOrderDict.set("topdown", DrawOrderType.IndexOrder);
            drawOrderDict.set("index", DrawOrderType.TopDown);

            let drawOrderValue = xObjectGroup["draworder"];
            if (drawOrderValue)
                group.drawOrder = drawOrderDict[drawOrderValue];

            group.objects = [];
            for (let e of xObjectGroup["object"])
                group.objects.push(this.loadTmxObject(new TmxObject(), map, e));
            group.properties = this.parsePropertyDict(xObjectGroup["properties"]);
            return group;
        }

        public static loadTmxObject(obj: TmxObject, map: TmxMap, xObject: any){
            obj.id = xObject["id"] != undefined ? xObject["id"] : 0;
            obj.name = xObject["name"] != undefined ? xObject["name"] : "";
            obj.x = xObject["x"];
            obj.y = xObject["y"];
            obj.width = xObject["width"] != undefined ? xObject["width"] : 0;
            obj.height = xObject["height"] != undefined ? xObject["height"] : 0;
            obj.type = xObject["type"] != undefined ? xObject["type"] : "";
            obj.visible = xObject["visible"] != undefined ? xObject["visible"] : true;
            obj.rotation = xObject["rotation"] != undefined ? xObject["rotation"] : 0;

            // 评估对象类型并分配适当的内容
            let xGid = xObject["gid"];
            let xEllipse = xObject["ellipse"];
            let xPolygon = xObject["polygon"];
            let xPolyline = xObject["polyline"];
            let xText = xObject["text"];
            let xPoint = xObject["point"];

            if (xGid){
                obj.tile = new TmxLayerTile(map, xGid, Math.round(obj.x), Math.round(obj.y));
                obj.objectType = TmxObjectType.tile;
            }else if(xEllipse){
                obj.objectType = TmxObjectType.ellipse;
            } else if(xPolygon){
                obj.points = this.parsePoints(xPolygon);
                obj.objectType = TmxObjectType.polygon;
            }else if(xPolyline){
                obj.points = this.parsePoints(xPolyline);
                obj.objectType = TmxObjectType.polyline;
            }else if(xText){
                obj.text = this.loadTmxText(new TmxText(), xText);
                obj.objectType = TmxObjectType.text;
            }else if(xPoint){
                obj.objectType = TmxObjectType.point;
            }else{
                obj.objectType = TmxObjectType.basic;
            }

            obj.properties = this.parsePropertyDict(xObject["properties"]);
            return obj;
        }

        public static loadTmxText(text: TmxText, xText: any){
            text.fontFamily = xText["fontfamily"] != undefined ? xText["fontfamily"] : "sans-serif";
            text.pixelSize = xText["pixelsize"] != undefined ? xText["pixelsize"] : 16;
            text.wrap = xText["wrap"] != undefined ? xText["wrap"] : false;
            text.color = TmxUtils.color16ToUnit(xText["color"]);
            text.bold = xText["bold"] ? xText["bold"] : false;
            text.italic = xText["italic"] ? xText["italic"] : false;
            text.underline = xText["underline"] ? xText["underline"] : false;
            text.strikeout = xText["strikeout"] ? xText["strikeout"] : false;
            text.kerning = xText["kerning"] ? xText["kerning"] : true;
            text.alignment = this.loadTmxAlignment(new TmxAlignment(), xText);
            text.value = xText;

            return text;
        }

        public static loadTmxAlignment(alignment: TmxAlignment, xText: any){
            function firstLetterToUpperCase(str: string) {
                if (!str || str == "")
                    return str;
                return str[0].toString().toUpperCase() + str.substr(1);
            }

            let xHorizontal = xText["halign"] != undefined ? xText["halign"] : "left";
            alignment.horizontal = TmxHorizontalAlignment[firstLetterToUpperCase(xHorizontal)];

            let xVertical = xText["valign"] != undefined ? xText["valign"] : "top";
            alignment.vertical = TmxVerticalAlignment[firstLetterToUpperCase((xVertical))];

            return alignment;
        }

        public static parsePoints(xPoints: any){
            let pointString: string = xPoints["points"];
            let pointStringPair = pointString.split(' ');
            let points = [];

            let index = 0;
            for (let s of pointStringPair)
                points[index ++] = this.parsePoint(s);
            return points;
        }

        public static parsePoint(s: string){
            let pt = s.split(',');
            let x = Number(pt[0]);
            let y = Number(pt[1]);
            return new Vector2(x, y);
        }


        public static parseTmxTerrain(xTerrain: any){
            let terrain = new TmxTerrain();
            terrain.name = xTerrain["name"];
            terrain.tile = xTerrain["tile"];
            terrain.properties = this.parsePropertyDict(xTerrain["properties"]);

            return terrain;
        }

        public static parseTmxTileOffset(xTileOffset: any){
            let tmxTileOffset = new TmxTileOffset();
            if (!xTileOffset){
                tmxTileOffset.x = 0;
                tmxTileOffset.y = 0;
                return tmxTileOffset;
            }

            tmxTileOffset.x = xTileOffset["x"];
            tmxTileOffset.y = xTileOffset["y"];
            return tmxTileOffset;
        }

        public static async loadTmxImage(image: TmxImage, xImage: any){
            let xSource = xImage["image"];
            if (xSource) {
                image.source = "resource/assets/" + xSource;
                image.bitmap = new Bitmap(await RES.getResByUrl(image.source, null, this, RES.ResourceItem.TYPE_IMAGE));
            }else {
                image.format = xImage["format"];
                let xData = xImage["data"];
                image.data = TmxUtils.decode(xData, xData["encoding"], xData["compression"]);
            }

            image.trans = TmxUtils.color16ToUnit(xImage["trans"]);
            image.width = xImage["width"] != undefined ? xImage["width"] : 0;
            image.height = xImage["height"] != undefined ? xImage["height"] : 0;

            return image;
        }
    }
}