module es {
    export class TiledRendering {
        public static renderMap(map: TmxMap, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number) {
            map.layers.forEach(layer => {
                if (layer instanceof TmxLayer && layer.visible) {
                    this.renderLayer(layer, container, position, scale, layerDepth);
                } else if (layer instanceof TmxImageLayer && layer.visible) {
                    this.renderImageLayer(layer, container, position, scale, layerDepth);
                } else if (layer instanceof TmxGroup && layer.visible) {
                    this.renderGroup(layer, container, position, scale, layerDepth);
                } else if (layer instanceof TmxObjectGroup && layer.visible) {
                    this.renderObjectGroup(layer, container, position, scale, layerDepth);
                }
            });
        }

        public static renderLayer(layer: TmxLayer, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number) {
            if (!layer.visible)
                return;

            let tileWidth = layer.map.tileWidth * scale.x;
            let tileHeight = layer.map.tileHeight * scale.y;

            let color = DrawUtils.getColorMatrix(0x000000);
            for (let i = 0; i < layer.tiles.length; i++) {
                let tile = layer.tiles[i];
                if (!tile)
                    continue;

                this.renderTile(tile, container, position, scale, tileWidth, tileHeight, color, layerDepth);
            }
        }


        public static renderImageLayer(layer: TmxImageLayer, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number) {
            if (!layer.visible)
                return;

            let color = DrawUtils.getColorMatrix(0x000000);
            let pos = Vector2.add(position, new Vector2(layer.offsetX, layer.offsetY).multiply(scale));
            if (!layer.image.bitmap.parent)
                container.addChild(layer.image.bitmap);
            layer.image.bitmap.x = pos.x;
            layer.image.bitmap.y = pos.y;
            layer.image.bitmap.scaleX = scale.x;
            layer.image.bitmap.scaleY = scale.y;
            layer.image.bitmap.filters = [color];
        }

        public static renderObjectGroup(objGroup: TmxObjectGroup, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number) {
            if (!objGroup.visible)
                return;

            for (let object in objGroup.objects) {
                let obj = objGroup.objects[object];
                if (!obj.visible)
                    continue;

                // 如果我们不调试渲染，我们只渲染平铺块和文本类型
                if (!Core.debugRenderEndabled){
                    if (obj.objectType != TmxObjectType.tile && obj.objectType != TmxObjectType.text)
                        continue;
                }


                let pos = Vector2.add(position, new Vector2(obj.x, obj.y).multiply(scale));
                switch (obj.objectType) {
                    case TmxObjectType.basic:
                        if (!obj.shape.parent)
                            container.addChild(obj.shape);

                        let rect = new Rectangle(pos.x, pos.y, obj.width * scale.x, obj.height * scale.y);
                        DrawUtils.drawHollowRect(obj.shape, rect, objGroup.color);
                        break;
                    case TmxObjectType.point:
                        let size = objGroup.map.tileWidth * 0.5;
                        pos.x -= size * 0.5;
                        pos.y -= size * 0.5;
                        if (!obj.shape.parent)
                            container.addChild(obj.shape);

                        DrawUtils.drawPixel(obj.shape, pos, objGroup.color, size);
                        break;
                    case TmxObjectType.tile:
                        let tileset = objGroup.map.getTilesetForTileGid(obj.tile.gid);
                        let sourceRect = tileset.tileRegions[obj.tile.gid];
                        pos.y -= obj.tile.tilesetTile.image.height;

                        if (!obj.tile.tilesetTile.image.bitmap)
                            container.addChild(obj.tile.tilesetTile.image.bitmap);
                        obj.tile.tilesetTile.image.bitmap.x = pos.x;
                        obj.tile.tilesetTile.image.bitmap.y = pos.y;
                        obj.tile.tilesetTile.image.bitmap.filters = [];
                        obj.tile.tilesetTile.image.bitmap.rotation = 0;
                        obj.tile.tilesetTile.image.bitmap.scaleX = scale.x;
                        obj.tile.tilesetTile.image.bitmap.scaleY = scale.y;
                        break;
                    case TmxObjectType.ellipse:
                        pos = new Vector2(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5).multiply(scale);
                        if (!obj.shape.parent)
                            container.addChild(obj.shape);
                        DrawUtils.drawCircle(obj.shape, pos, obj.width * 0.5, objGroup.color);
                        break;
                    case TmxObjectType.polygon:
                    case TmxObjectType.polyline:
                        let points = [];
                        for (let i = 0; i < obj.points.length; i++)
                            points[i] = Vector2.multiply(obj.points[i], scale);
                        DrawUtils.drawPoints(obj.shape, pos, points, objGroup.color, obj.objectType == TmxObjectType.polygon);
                        break;
                    case TmxObjectType.text:
                        if (!obj.textField.parent)
                            container.addChild(obj.textField);
                        DrawUtils.drawString(obj.textField, obj.text.value, pos, obj.text.color, MathHelper.toRadians(obj.rotation),
                            Vector2.zero, 1);
                        break;
                    default:
                        if (Core.debugRenderEndabled){
                            if (!obj.textField.parent)
                                container.addChild(obj.textField);
                            DrawUtils.drawString(obj.textField, `${obj.name}(${obj.type})`, Vector2.subtract(pos, new Vector2(0, 15)), 0xffffff, 0, Vector2.zero, 1);
                        }
                        break;
                }
            }
        }

        public static renderGroup(group: TmxGroup, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number) {
            if (!group.visible)
                return;

            group.layers.forEach(layer => {
                if (layer instanceof TmxGroup) {
                    this.renderGroup(layer, container, position, scale, layerDepth);
                }

                if (layer instanceof TmxObjectGroup) {
                    this.renderObjectGroup(layer, container, position, scale, layerDepth);
                }

                if (layer instanceof TmxLayer) {
                    this.renderLayer(layer, container, position, scale, layerDepth);
                }

                if (layer instanceof TmxImageLayer) {
                    this.renderImageLayer(layer, container, position, scale, layerDepth);
                }
            });
        }

        public static renderTile(tile: TmxLayerTile, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, tileWidth: number, tileHeight: number, color: egret.ColorMatrixFilter, layerDepth: number) {
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
                if (!tile.tileset.image.bitmap.parent)
                    container.addChild(tile.tileset.image.bitmap);
                tile.tileset.image.bitmap.x = pos.x;
                tile.tileset.image.bitmap.y = pos.y;
                tile.tileset.image.bitmap.scaleX = scale.x;
                tile.tileset.image.bitmap.scaleY = scale.y;
                tile.tileset.image.bitmap.rotation = rotation;
                tile.tileset.image.bitmap.filters = [color];
            } else {
                if (tilesetTile.image.bitmap){
                    if (!tilesetTile.image.bitmap.parent)
                        container.addChild(tilesetTile.image.bitmap);

                    tilesetTile.image.bitmap.x = pos.x;
                    tilesetTile.image.bitmap.y = pos.y;
                    tilesetTile.image.bitmap.scaleX = scale.x;
                    tilesetTile.image.bitmap.scaleY = scale.y;
                    tilesetTile.image.bitmap.rotation = rotation;
                    tilesetTile.image.bitmap.filters = [color];
                }
            }
        }
    }
}