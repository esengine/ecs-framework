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

            function debugRender(obj: TmxObject, pos: Vector2){
                if (!container)
                    return;

                if (!Core.debugRenderEndabled)
                    return;

                if (!obj.textField.parent && obj.name){
                    obj.textField.text = obj.name;
                    obj.textField.size = 12;
                    obj.textField.fontFamily = "sans-serif";
                    if (obj.shape){
                        obj.textField.x = pos.x + (obj.shape.getBounds().width - obj.textField.width) / 2 + obj.shape.getBounds().x;
                        obj.textField.y = pos.y - obj.textField.height - 5 + obj.shape.getBounds().y;
                    }else{
                        obj.textField.x = pos.x + (obj.width - obj.textField.width) / 2;
                        obj.textField.y = pos.y - obj.textField.height - 5;
                    }
                    obj.textField.background = true;
                    obj.textField.backgroundColor = 0xa0a0a4;
                    obj.textField.textColor = 0xffffff;
                    container.addChild(obj.textField);
                }
            }

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
                        if (!obj.shape.parent){
                            obj.shape.x = obj.x;
                            obj.shape.y = obj.y;
                            container.addChild(obj.shape);

                            obj.shape.graphics.clear();
                            obj.shape.graphics.lineStyle(1, 0xa0a0a4);
                            obj.shape.graphics.beginFill(0x979798, 0.5);
                            obj.shape.graphics.drawRect(0, 0, obj.width * scale.x, obj.height * scale.y);
                            obj.shape.graphics.endFill();
                            debugRender(obj, pos);
                        }
                        break;
                    case TmxObjectType.point:
                        let size = objGroup.map.tileWidth * 0.5;
                        pos.x -= size * 0.5;
                        pos.y -= size * 0.5;
                        if (!obj.shape.parent){
                            obj.shape.x = pos.x;
                            obj.shape.y = pos.y;
                            container.addChild(obj.shape);

                            obj.shape.graphics.clear();
                            obj.shape.graphics.lineStyle(1, 0xa0a0a4);
                            obj.shape.graphics.beginFill(0x979798, 0.5);
                            obj.shape.graphics.drawCircle(0, 0, 1);
                            obj.shape.graphics.endFill();
                            debugRender(obj, pos);
                        }
                        break;
                    case TmxObjectType.tile:
                        this.renderTilesetTile(objGroup, obj, container, pos, scale, debugRender);
                        break;
                    case TmxObjectType.ellipse:
                        pos = new Vector2(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5).multiply(scale);
                        if (!obj.shape.parent){
                            obj.shape.x = pos.x;
                            obj.shape.y = pos.y;
                            container.addChild(obj.shape);

                            obj.shape.graphics.clear();
                            obj.shape.graphics.lineStyle(1, 0xa0a0a4);
                            obj.shape.graphics.beginFill(0x979798, 0.5);
                            obj.shape.graphics.drawCircle(0, 0, obj.width * 0.5);
                            obj.shape.graphics.endFill();
                            debugRender(obj, pos);
                        }
                        break;
                    case TmxObjectType.polygon:
                    case TmxObjectType.polyline:
                        let points: Vector2[] = [];
                        for (let i = 0; i < obj.points.length; i++)
                            points[i] = Vector2.multiply(obj.points[i], scale);

                        if (!obj.shape.parent && points.length > 0){
                            obj.shape.x = pos.x;
                            obj.shape.y = pos.y;
                            container.addChild(obj.shape);

                            obj.shape.graphics.clear();
                            obj.shape.graphics.lineStyle(1, 0xa0a0a4);
                            for (let i = 0; i < points.length; i ++){
                                if (i == 0){
                                    obj.shape.graphics.moveTo(points[i].x, points[i].y);
                                }else{
                                    obj.shape.graphics.lineTo(points[i].x, points[i].y);
                                }
                            }
                            obj.shape.graphics.endFill();
                            debugRender(obj, pos);
                        }
                        break;
                    case TmxObjectType.text:
                        if (!obj.textField.parent){
                            obj.textField.x = pos.x;
                            obj.textField.y = pos.y;
                            container.addChild(obj.textField);

                            obj.textField.text = obj.text.value;
                            obj.textField.textColor = obj.text.color;
                            obj.textField.bold = obj.text.bold != undefined ? obj.text.bold : false;
                            obj.textField.italic = obj.text.italic != undefined ? obj.text.italic : false;
                            obj.textField.size = obj.text.pixelSize;
                            obj.textField.fontFamily = obj.text.fontFamily;
                        }
                        break;
                    default:
                        break;
                }
            }
        }

        private static renderTilesetTile(objGroup: es.TmxObjectGroup, obj, container: egret.DisplayObjectContainer, pos, scale: es.Vector2, debugRender) {
            let tileset = objGroup.map.getTilesetForTileGid(obj.tile.gid);
            let sourceRect = tileset.tileRegions.get(obj.tile.gid);

            if (container) {
                if (tileset.image) {
                    if (obj.tile.horizontalFlip && obj.tile.verticalFlip) {
                        pos.x += tileset.tileHeight + (sourceRect.height * scale.y - tileset.tileHeight);
                        pos.y -= (sourceRect.width * scale.x - tileset.tileWidth);
                    } else if (obj.tile.horizontalFlip) {
                        pos.x += tileset.tileWidth + (sourceRect.height * scale.y - tileset.tileHeight);
                    } else if (obj.tile.verticalFlip) {
                        pos.y += (tileset.tileWidth - sourceRect.width * scale.x);
                    } else {
                        pos.y += (tileset.tileHeight - sourceRect.height * scale.y);
                    }
                    let texture: egret.Texture = tileset.image.bitmap.getTexture(`${obj.tile.gid}`);
                    if (!texture) {
                        texture = tileset.image.bitmap.createTexture(`${obj.tile.gid}`, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
                    }

                    tileset.image.texture = new Bitmap(texture);
                    container.addChild(tileset.image.texture);

                    tileset.image.texture.x = pos.x;
                    tileset.image.texture.y = pos.y;
                    if (obj.tile.verticalFlip && obj.tile.horizontalFlip) {
                        tileset.image.texture.scaleX = -1;
                        tileset.image.texture.scaleY = -1;
                    } else if (obj.tile.verticalFlip) {
                        tileset.image.texture.scaleX = scale.x;
                        tileset.image.texture.scaleY = -1;
                    } else if (obj.tile.horizontalFlip) {
                        tileset.image.texture.scaleX = -1;
                        tileset.image.texture.scaleY = scale.y;
                    } else {
                        tileset.image.texture.scaleX = scale.x;
                        tileset.image.texture.scaleY = scale.y;
                    }
                    tileset.image.texture.anchorOffsetX = 0;
                    tileset.image.texture.anchorOffsetY = 0;
                    debugRender(obj, pos);
                } else {
                    let tilesetTile = tileset.tiles.get(obj.tile.gid);
                    let texture: egret.Texture = tilesetTile.image.bitmap.getTexture(`${obj.tile.gid}`);
                    if (!texture) {
                        texture = tilesetTile.image.bitmap.createTexture(`${obj.tile.gid}`, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
                    }

                    pos.y -= obj.height;
                    tilesetTile.image.texture = new Bitmap(texture);
                    container.addChild(tilesetTile.image.texture);

                    tilesetTile.image.texture.width = obj.width;
                    tilesetTile.image.texture.height = obj.height;
                    tilesetTile.image.texture.x = pos.x;
                    tilesetTile.image.texture.y = pos.y;
                    if (obj.tile.verticalFlip && obj.tile.horizontalFlip) {
                        tilesetTile.image.texture.scaleX = -1;
                        tilesetTile.image.texture.scaleY = -1;
                    } else if (obj.tile.verticalFlip) {
                        tilesetTile.image.texture.scaleX = scale.x;
                        tilesetTile.image.texture.scaleY = -1;
                    } else if (obj.tile.horizontalFlip) {
                        tilesetTile.image.texture.scaleX = -1;
                        tilesetTile.image.texture.scaleY = scale.y;
                    } else {
                        tilesetTile.image.texture.scaleX = scale.x;
                        tilesetTile.image.texture.scaleY = scale.y;
                    }
                    tilesetTile.image.texture.anchorOffsetX = 0;
                    tilesetTile.image.texture.anchorOffsetY = 0;
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
            } else if (tile.verticalFlip) {
                ty += (tileWidth - sourceRect.width * scale.x);
            } else {
                ty += (tileHeight - sourceRect.height * scale.y);
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