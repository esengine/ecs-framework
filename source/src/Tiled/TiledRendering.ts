module es {
    import Bitmap = egret.Bitmap;


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

            let color = DrawUtils.getColorMatrix(0xFFFFFF);
            for (let i = 0; i < layer.tiles.length; i++) {
                let tile = layer.tiles[i];
                if (!tile)
                    continue;

                this.renderTile(tile, container, position, scale, tileWidth, tileHeight, color, layerDepth);
            }
        }

        public static renderLayerRenderCamera(layer: ITmxLayer, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number, camerClipBounds: Rectangle){
            if (layer instanceof TmxLayer && layer.visible) {
                this.renderLayerCamera(layer, container, position, scale, layerDepth, camerClipBounds);
            } else if (layer instanceof TmxImageLayer && layer.visible) {
                this.renderImageLayer(layer, container, position, scale, layerDepth);
            } else if (layer instanceof TmxGroup && layer.visible) {
                this.renderGroup(layer, container, position, scale, layerDepth);
            } else if (layer instanceof TmxObjectGroup && layer.visible) {
                this.renderObjectGroup(layer, container, position, scale, layerDepth);
            }
        }

        public static renderLayerCamera(layer: TmxLayer, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number, camerClipBounds: Rectangle){
            if (!layer.visible)
                return;

            position = position.add(layer.offset);

            camerClipBounds.location = camerClipBounds.location.subtract(position);

            let tileWidth = layer.map.tileWidth * scale.x;
            let tileHeight = layer.map.tileHeight * scale.y;

            let minX, minY, maxX, maxY = 0;
            if (layer.map.requiresLargeTileCulling){
                minX = layer.map.worldToTilePositionX(camerClipBounds.left - (layer.map.maxTileWidth * scale.x - tileWidth));
                minY = layer.map.worldToTilePositionY(camerClipBounds.top - (layer.map.maxTileHeight * scale.y - tileHeight));
                maxX = layer.map.worldToTilePositionX(camerClipBounds.right + (layer.map.maxTileWidth * scale.x - tileWidth));
                maxY = layer.map.worldToTilePositionY(camerClipBounds.bottom + (layer.map.maxTileHeight * scale.y - tileHeight));
            }else{
                minX = layer.map.worldToTilePositionX(camerClipBounds.left);
                minY = layer.map.worldToTilePositionY(camerClipBounds.top);
                maxX = layer.map.worldToTilePositionX(camerClipBounds.right);
                maxY = layer.map.worldToTilePositionY(camerClipBounds.bottom);
            }

            let color = DrawUtils.getColorMatrix(0xFFFFFF);

            for (let y = minY; y <= maxY; y ++){
                for (let x = minX; x <= maxX; x ++){
                    let tile = layer.getTile(x, y);
                    if (tile)
                        this.renderTile(tile, container, position, scale, tileWidth, tileHeight, color, layerDepth);
                }
            }
        }


        public static renderImageLayer(layer: TmxImageLayer, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number) {
            if (!layer.visible)
                return;

            let color = DrawUtils.getColorMatrix(0xFFFFFF);
            let pos = Vector2.add(position, new Vector2(layer.offsetX, layer.offsetY).multiply(scale));
            if (!layer.image.texture.parent)
                container.addChild(layer.image.texture);
            layer.image.texture.x = pos.x;
            layer.image.texture.y = pos.y;
            layer.image.texture.scaleX = scale.x;
            layer.image.texture.scaleY = scale.y;
            layer.image.texture.filters = [color];
        }

        public static renderObjectGroup(objGroup: TmxObjectGroup, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number) {
            if (!objGroup.visible)
                return;

            for (let object in objGroup.objects) {
                let obj = objGroup.objects[object];
                if (!obj.visible)
                    continue;

                // 如果我们不调试渲染，我们只渲染平铺块和文本类型
                if (!Core.debugRenderEndabled) {
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

                        if (!obj.tile.tilesetTile.image.texture)
                            container.addChild(obj.tile.tilesetTile.image.texture);
                        obj.tile.tilesetTile.image.texture.x = pos.x;
                        obj.tile.tilesetTile.image.texture.y = pos.y;
                        obj.tile.tilesetTile.image.texture.filters = [];
                        obj.tile.tilesetTile.image.texture.rotation = 0;
                        obj.tile.tilesetTile.image.texture.scaleX = scale.x;
                        obj.tile.tilesetTile.image.texture.scaleY = scale.y;
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
                        if (Core.debugRenderEndabled) {
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
            let tx = Math.floor(tile.x) * tileWidth;
            let ty = Math.floor(tile.y) * tileHeight;
            let rotation = 0;

            if (tile.horizontalFlip && tile.verticalFlip) {
                tx += tileHeight + (sourceRect.height * scale.y - tileHeight);
                ty -= (sourceRect.width * scale.x - tileWidth);
            } else if (tile.horizontalFlip) {
                tx += tileWidth + (sourceRect.height * scale.y - tileHeight);
                ty += tileHeight;
            } else if (tile.verticalFlip) {
                ty += (tileWidth - sourceRect.width * scale.x);
            } else {
                ty += tileHeight;
                // ty += (tileHeight - sourceRect.height * scale.y);
            }

            let pos = new Vector2(tx, ty).add(position);

            if (tile.tileset.image) {
                if (container){
                    let texture: egret.Texture = tile.tileset.image.bitmap.getTexture(`${gid}`);
                    if (!texture) {
                        texture = tile.tileset.image.bitmap.createTexture(`${gid}`, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
                    }

                    tile.tileset.image.texture = new Bitmap(texture);
                    container.addChild(tile.tileset.image.texture);

                    if (tile.tileset.image.texture.x != pos.x) tile.tileset.image.texture.x = pos.x;
                    if (tile.tileset.image.texture.y != pos.y) tile.tileset.image.texture.y = pos.y;
                    if (tile.verticalFlip && tile.horizontalFlip){
                        tile.tileset.image.texture.scaleX = -1;
                        tile.tileset.image.texture.scaleY = -1;
                    }else if (tile.verticalFlip){
                        tile.tileset.image.texture.scaleX = scale.x;
                        tile.tileset.image.texture.scaleY = -1;
                    }else if(tile.horizontalFlip){
                        tile.tileset.image.texture.scaleX = -1;
                        tile.tileset.image.texture.scaleY = scale.y;
                    }else{
                        tile.tileset.image.texture.scaleX = scale.x;
                        tile.tileset.image.texture.scaleY = scale.y;
                    }
                    if (tile.tileset.image.texture.rotation != rotation) tile.tileset.image.texture.rotation = rotation;
                    if (tile.tileset.image.texture.anchorOffsetX != 0) tile.tileset.image.texture.anchorOffsetX = 0;
                    if (tile.tileset.image.texture.anchorOffsetY != 0) tile.tileset.image.texture.anchorOffsetY = 0;
                }
                // tile.tileset.image.texture.filters = [color];
            } else {
                if (tilesetTile.image.texture) {
                    if (!tilesetTile.image.bitmap.getTexture(gid.toString())) {
                        tilesetTile.image.texture = new Bitmap(tilesetTile.image.bitmap.createTexture(gid.toString(), sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height));
                        container.addChild(tilesetTile.image.texture);
                    }
                    tilesetTile.image.texture.x = pos.x;
                    tilesetTile.image.texture.y = pos.y;
                    tilesetTile.image.texture.scaleX = scale.x;
                    tilesetTile.image.texture.scaleY = scale.y;
                    tilesetTile.image.texture.rotation = rotation;
                    tilesetTile.image.texture.anchorOffsetX = 0;
                    tilesetTile.image.texture.anchorOffsetY = 0;
                    tilesetTile.image.texture.filters = [color];
                }
            }
        }
    }
}