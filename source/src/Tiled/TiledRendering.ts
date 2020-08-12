module es {
    export class TiledRendering {
        public static renderMap(map: TmxMap, position: Vector2, scale: Vector2, layerDepth: number) {
            map.layers.forEach(layer => {
                if (layer instanceof TmxLayer && layer.visible) {
                    this.renderLayer(layer, position, scale, layerDepth);
                } else if (layer instanceof TmxImageLayer && layer.visible) {
                    this.renderImageLayer(layer, position, scale, layerDepth);
                } else if (layer instanceof TmxGroup && layer.visible) {
                    this.renderGroup(layer, position, scale, layerDepth);
                } else if (layer instanceof TmxObjectGroup && layer.visible) {
                    this.renderObjectGroup(layer, position, scale, layerDepth);
                }
            });
        }

        public static renderLayer(layer: TmxLayer, position: Vector2, scale: Vector2, layerDepth: number) {
            if (!layer.visible)
                return;

            let tileWidth = layer.map.tileWidth * scale.x;
            let tileHeight = layer.map.tileHeight * scale.y;

            let color = new Color(0, 0, 0, layer.opacity * 255);
            for (let i = 0; i < layer.tiles.length; i ++){
                let tile = layer.tiles[i];
                if (!tile)
                    continue;

                this.renderTile(tile, position, scale, tileWidth, tileHeight, color, layerDepth);
            }
        }


        public static renderImageLayer(layer: TmxImageLayer, position: Vector2, scale: Vector2, layerDepth: number) {
            if (!layer.visible)
                return;

            let color = new Color(0, 0, 0, layer.opacity * 255);
            let pos = Vector2.add(position, new Vector2(layer.offsetX, layer.offsetY).multiply(scale));
            // TODO: draw
        }

        public static renderObjectGroup(objGroup: TmxObjectGroup, position: Vector2, scale: Vector2, layerDepth: number) {
            if (!objGroup.visible)
                return;

            for (let object in objGroup.objects) {
                let obj = objGroup.objects.get(object);
                if (!obj.visible)
                    continue;

                // TODO: debug draw

                let pos = Vector2.add(position, new Vector2(obj.x, obj.y).multiply(scale));
                switch (obj.objectType) {
                    case TmxObjectType.basic:
                        // TODO: draw
                        break;
                    case TmxObjectType.point:
                        let size = objGroup.map.tileWidth * 0.5;
                        pos.x -= size * 0.5;
                        pos.y -= size * 0.5;
                        // TODO: draw
                        break;
                    case TmxObjectType.tile:
                        let tileset = objGroup.map.getTilesetForTileGid(obj.tile.gid);
                        let sourceRect = tileset.tileRegions[obj.tile.gid];
                        pos.y -= obj.tile.tilesetTile.image.height;
                        // TODO: draw
                        break;
                    case TmxObjectType.ellipse:
                        pos = new Vector2(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5).multiply(scale);
                        // TODO: draw
                        break;
                    case TmxObjectType.polygon:
                    case TmxObjectType.polyline:
                        let points = [];
                        for (let i = 0; i < obj.points.length; i++)
                            points[i] = Vector2.multiply(obj.points[i], scale);
                        // TODO: draw
                        break;
                    case TmxObjectType.text:
                        // TODO: draw
                        break;
                    default:
                        // TODO: debug draw
                        break;
                }
            }
        }

        public static renderGroup(group: TmxGroup, position: Vector2, scale: Vector2, layerDepth: number) {
            if (!group.visible)
                return;

            group.layers.forEach(layer => {
                if (layer instanceof TmxGroup) {
                    this.renderGroup(layer, position, scale, layerDepth);
                }

                if (layer instanceof TmxObjectGroup) {
                    this.renderObjectGroup(layer, position, scale,layerDepth);
                }

                if (layer instanceof TmxLayer){
                    this.renderLayer(layer, position, scale, layerDepth);
                }

                if (layer instanceof TmxImageLayer){
                    this.renderImageLayer(layer, position, scale, layerDepth);
                }
            });
        }

        public static renderTile(tile: TmxLayerTile, position: Vector2, scale: Vector2, tileWidth: number, tileHeight: number, color: Color, layerDepth: number) {
            let gid = tile.gid;

            // 动画tiles(以及来自图像tile的tiles)将位于Tileset本身内，位于单独的TmxTilesetTile对象中，不要与我们在此循环中处理的TmxLayerTiles混淆
            let tilesetTile = tile.tilesetTile;
            if (tilesetTile && tilesetTile.animationFrames.length > 0)
                gid = tilesetTile.currentAnimationFrameGid;

            let sourceRect = tile.tileset.tileRegions.get(gid);

            // 对于y位置，我们需要考虑瓦片是否大于瓦片的高度和移位。
            // tiled使用左下角的坐标系统，而egret则使用左上角的坐标系统
            let tx = tile.x * tileWidth;
            let ty = tile.y * tileHeight;
            let rotation = 0;

            if (tile.diagonalFlip) {
                if (tile.horizontalFlip && tile.verticalFlip) {
                    rotation = MathHelper.PiOver2;
                    tx += tileHeight + (sourceRect.height * scale.y - tileHeight);
                    ty -= (sourceRect.width * scale.x - tileWidth);
                } else if (tile.horizontalFlip) {
                    rotation = -MathHelper.PiOver2;
                    ty += tileHeight;
                } else if (tile.verticalFlip) {
                    rotation = MathHelper.PiOver2;
                    tx += tileWidth + (sourceRect.height * scale.y - tileHeight);
                    ty += (tileWidth - sourceRect.width * scale.x);
                } else {
                    rotation = -MathHelper.PiOver2;
                    ty += tileHeight;
                }
            }

            // 如果我们没有旋转(对角线翻转)移动y轴
            if (rotation == 0)
                ty += (tileHeight - sourceRect.height * scale.y);

            let pos = new Vector2(tx, ty).add(position);
            if (tile.tileset.image) {
                // TODO: draw
            } else {
                // TODO: draw
            }
        }
    }
}