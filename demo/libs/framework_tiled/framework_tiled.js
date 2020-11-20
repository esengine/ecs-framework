var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var es;
(function (es) {
    var TiledMapRenderer = (function (_super) {
        __extends(TiledMapRenderer, _super);
        function TiledMapRenderer(tiledMap, collisionLayerName, shouldCreateColliders) {
            if (collisionLayerName === void 0) { collisionLayerName = null; }
            if (shouldCreateColliders === void 0) { shouldCreateColliders = true; }
            var _this = _super.call(this) || this;
            _this.physicsLayer = new es.Ref(1 << 0);
            _this.toContainer = false;
            _this.tiledMap = tiledMap;
            _this._shouldCreateColliders = shouldCreateColliders;
            _this.displayObject = new egret.DisplayObjectContainer();
            if (collisionLayerName) {
                _this.collisionLayer = tiledMap.tileLayers.find(function (layer) { return layer.name == collisionLayerName; });
            }
            return _this;
        }
        Object.defineProperty(TiledMapRenderer.prototype, "width", {
            get: function () {
                return this.tiledMap.width * this.tiledMap.tileWidth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TiledMapRenderer.prototype, "height", {
            get: function () {
                return this.tiledMap.height * this.tiledMap.tileHeight;
            },
            enumerable: true,
            configurable: true
        });
        TiledMapRenderer.prototype.setLayerToRender = function (layerName) {
            this.layerIndicesToRender = [];
            this.layerIndicesToRender[0] = this.getLayerIndex(layerName);
        };
        TiledMapRenderer.prototype.setLayersToRender = function () {
            var layerNames = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                layerNames[_i] = arguments[_i];
            }
            this.layerIndicesToRender = [];
            for (var i = 0; i < layerNames.length; i++)
                this.layerIndicesToRender[i] = this.getLayerIndex(layerNames[i]);
        };
        TiledMapRenderer.prototype.getLayerIndex = function (layerName) {
            var index = 0;
            var layerType = this.tiledMap.getLayer(layerName);
            for (var layer in this.tiledMap.layers) {
                if (this.tiledMap.layers.hasOwnProperty(layer) &&
                    this.tiledMap.layers[layer] == layerType) {
                    return index;
                }
            }
            return -1;
        };
        TiledMapRenderer.prototype.getRowAtWorldPosition = function (yPos) {
            yPos -= this.entity.transform.position.y + this._localOffset.y;
            return this.tiledMap.worldToTilePositionY(yPos);
        };
        TiledMapRenderer.prototype.getColumnAtWorldPosition = function (xPos) {
            xPos -= this.entity.transform.position.x + this._localOffset.x;
            return this.tiledMap.worldToTilePositionX(xPos);
        };
        TiledMapRenderer.prototype.onEntityTransformChanged = function (comp) {
            if (this._shouldCreateColliders && comp == transform.Component.position) {
                this.removeColliders();
                this.addColliders();
            }
        };
        TiledMapRenderer.prototype.onAddedToEntity = function () {
            this.addColliders();
        };
        TiledMapRenderer.prototype.onRemovedFromEntity = function () {
            this.removeColliders();
        };
        TiledMapRenderer.prototype.update = function () {
            this.tiledMap.update();
        };
        TiledMapRenderer.prototype.render = function (camera) {
            this.sync(camera);
            if (!this.layerIndicesToRender) {
                es.TiledRendering.renderMap(this.tiledMap, !this.toContainer ? this.displayObject : null, es.Vector2.add(this.entity.transform.position, this._localOffset), this.transform.scale, this.renderLayer);
            }
            else {
                for (var i = 0; i < this.tiledMap.layers.length; i++) {
                    if (this.tiledMap.layers[i].visible && this.layerIndicesToRender.contains(i))
                        es.TiledRendering.renderLayerRenderCamera(this.tiledMap.layers[i], !this.toContainer ? this.displayObject : null, es.Vector2.add(this.entity.transform.position, this._localOffset), this.transform.scale, this.renderLayer, camera.bounds);
                }
            }
            if (!this.toContainer) {
                this.displayObject.cacheAsBitmap = true;
                this.toContainer = true;
            }
        };
        TiledMapRenderer.prototype.addColliders = function () {
            if (!this.collisionLayer || !this._shouldCreateColliders)
                return;
            var collisionRects = this.collisionLayer.getCollisionRectangles();
            this._colliders = [];
            for (var i = 0; i < collisionRects.length; i++) {
                var collider = new es.BoxCollider(collisionRects[i].x + this._localOffset.x, collisionRects[i].y + this._localOffset.y, collisionRects[i].width, collisionRects[i].height);
                collider.physicsLayer = this.physicsLayer;
                collider.entity = this.entity;
                this._colliders[i] = collider;
                es.Physics.addCollider(collider);
            }
        };
        TiledMapRenderer.prototype.removeColliders = function () {
            if (this._colliders == null)
                return;
            for (var _i = 0, _a = this._colliders; _i < _a.length; _i++) {
                var collider = _a[_i];
                es.Physics.removeCollider(collider);
            }
            this._colliders = null;
        };
        return TiledMapRenderer;
    }(es.RenderableComponent));
    es.TiledMapRenderer = TiledMapRenderer;
})(es || (es = {}));
var es;
(function (es) {
    var TmxGroup = (function () {
        function TmxGroup() {
        }
        return TmxGroup;
    }());
    es.TmxGroup = TmxGroup;
})(es || (es = {}));
var es;
(function (es) {
    var TmxImageLayer = (function () {
        function TmxImageLayer() {
        }
        return TmxImageLayer;
    }());
    es.TmxImageLayer = TmxImageLayer;
})(es || (es = {}));
var es;
(function (es) {
    var TmxLayer = (function () {
        function TmxLayer() {
        }
        Object.defineProperty(TmxLayer.prototype, "offset", {
            get: function () {
                return new es.Vector2(this.offsetX, this.offsetY);
            },
            enumerable: true,
            configurable: true
        });
        TmxLayer.prototype.getTileWithGid = function (gid) {
            for (var i = 0; i < this.tiles.length; i++) {
                if (this.tiles[i] && this.tiles[i].gid == gid)
                    return this.tiles[i];
            }
            return null;
        };
        TmxLayer.prototype.getTile = function (x, y) {
            return this.tiles[x + y * this.width];
        };
        TmxLayer.prototype.getCollisionRectangles = function () {
            var checkedIndexes = new Array(this.tiles.length);
            var rectangles = [];
            var startCol = -1;
            var index = -1;
            for (var y = 0; y < this.map.height; y++) {
                for (var x = 0; x < this.map.width; x++) {
                    index = y * this.map.width + x;
                    var tile = this.getTile(x, y);
                    if (tile && !checkedIndexes[index]) {
                        if (startCol < 0)
                            startCol = x;
                        checkedIndexes[index] = true;
                    }
                    else if (!tile || checkedIndexes[index] == true) {
                        if (startCol >= 0) {
                            rectangles.push(this.findBoundsRect(startCol, x, y, checkedIndexes));
                            startCol = -1;
                        }
                    }
                }
                if (startCol >= 0) {
                    rectangles.push(this.findBoundsRect(startCol, this.map.width, y, checkedIndexes));
                    startCol = -1;
                }
            }
            return rectangles;
        };
        TmxLayer.prototype.findBoundsRect = function (startX, endX, startY, checkedIndexes) {
            var index = -1;
            for (var y = startY + 1; y < this.map.height; y++) {
                for (var x = startX; x < endX; x++) {
                    index = y * this.map.width + x;
                    var tile = this.getTile(x, y);
                    if (!tile || checkedIndexes[index]) {
                        for (var _x = startX; _x < x; _x++) {
                            index = y * this.map.width + _x;
                            checkedIndexes[index] = false;
                        }
                        return new es.Rectangle(startX * this.map.tileWidth, startY * this.map.tileHeight, (endX - startX) * this.map.tileWidth, (y - startY) * this.map.tileHeight);
                    }
                    checkedIndexes[index] = true;
                }
            }
            return new es.Rectangle(startX * this.map.tileWidth, startY * this.map.tileHeight, (endX - startX) * this.map.tileWidth, (this.map.height - startY) * this.map.tileHeight);
        };
        return TmxLayer;
    }());
    es.TmxLayer = TmxLayer;
    var TmxLayerTile = (function () {
        function TmxLayerTile(map, id, x, y) {
            this.x = x;
            this.y = y;
            var rawGid = id;
            var flip;
            flip = (rawGid & TmxLayerTile.FLIPPED_HORIZONTALLY_FLAG) != 0;
            this.horizontalFlip = flip;
            flip = (rawGid & TmxLayerTile.FLIPPED_VERTICALLY_FLAG) != 0;
            this.verticalFlip = flip;
            rawGid &= ~(TmxLayerTile.FLIPPED_HORIZONTALLY_FLAG | TmxLayerTile.FLIPPED_VERTICALLY_FLAG);
            this.gid = Math.floor(rawGid);
            this.tileset = map.getTilesetForTileGid(this.gid);
        }
        Object.defineProperty(TmxLayerTile.prototype, "position", {
            get: function () {
                return new es.Vector2(this.x, this.y);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TmxLayerTile.prototype, "tilesetTile", {
            get: function () {
                if (!this._tilesetTileIndex) {
                    this._tilesetTileIndex = -1;
                    if (this.tileset.firstGid <= this.gid) {
                        var tilesetTile = this.tileset.tiles.get(this.gid - this.tileset.firstGid);
                        if (tilesetTile) {
                            this._tilesetTileIndex = this.gid - this.tileset.firstGid;
                        }
                    }
                }
                if (this._tilesetTileIndex < 0)
                    return null;
                return this.tileset.tiles.get(this._tilesetTileIndex);
            },
            enumerable: true,
            configurable: true
        });
        TmxLayerTile.FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
        TmxLayerTile.FLIPPED_VERTICALLY_FLAG = 0x40000000;
        return TmxLayerTile;
    }());
    es.TmxLayerTile = TmxLayerTile;
})(es || (es = {}));
var es;
(function (es) {
    var TmxDocument = (function () {
        function TmxDocument() {
            this.tmxDirectory = "resource/assets/";
        }
        return TmxDocument;
    }());
    es.TmxDocument = TmxDocument;
    var TmxImage = (function () {
        function TmxImage() {
        }
        TmxImage.prototype.dispose = function () {
            if (this.bitmap) {
                this.bitmap.dispose();
                this.bitmap = null;
            }
        };
        return TmxImage;
    }());
    es.TmxImage = TmxImage;
})(es || (es = {}));
var es;
(function (es) {
    var TmxMap = (function (_super) {
        __extends(TmxMap, _super);
        function TmxMap() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(TmxMap.prototype, "worldWidth", {
            get: function () {
                return this.width * this.tileWidth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TmxMap.prototype, "worldHeight", {
            get: function () {
                return this.height * this.tileHeight;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TmxMap.prototype, "requiresLargeTileCulling", {
            get: function () {
                return this.maxTileHeight > this.tileHeight || this.maxTileWidth > this.tileWidth;
            },
            enumerable: true,
            configurable: true
        });
        TmxMap.prototype.getTilesetForTileGid = function (gid) {
            if (gid == 0)
                return null;
            for (var i = this.tilesets.length - 1; i >= 0; i--) {
                if (this.tilesets[i].firstGid <= gid)
                    return this.tilesets[i];
            }
            console.error("tile gid" + gid + "\u672A\u5728\u4EFB\u4F55tileset\u4E2D\u627E\u5230");
        };
        TmxMap.prototype.worldToTilePositionX = function (x, clampToTilemapBounds) {
            if (clampToTilemapBounds === void 0) { clampToTilemapBounds = true; }
            var tileX = Math.floor(x / this.tileWidth);
            if (!clampToTilemapBounds)
                return tileX;
            return es.MathHelper.clamp(tileX, 0, this.width - 1);
        };
        TmxMap.prototype.worldToTilePositionY = function (y, clampToTilemapBounds) {
            if (clampToTilemapBounds === void 0) { clampToTilemapBounds = true; }
            var tileY = Math.floor(y / this.tileHeight);
            if (!clampToTilemapBounds)
                return tileY;
            return es.MathHelper.clamp(tileY, 0, this.height - 1);
        };
        TmxMap.prototype.getLayer = function (name) {
            return this.layers[name];
        };
        TmxMap.prototype.update = function () {
            this.tilesets.forEach(function (tileset) { tileset.update(); });
        };
        TmxMap.prototype.dispose = function (disposing) {
            if (disposing === void 0) { disposing = true; }
            if (!this._isDisposed) {
                if (disposing) {
                    this.tilesets.forEach(function (tileset) { if (tileset.image)
                        tileset.image.dispose(); });
                    this.imageLayers.forEach(function (layer) { if (layer.image)
                        layer.image.dispose(); });
                }
                this._isDisposed = true;
            }
        };
        return TmxMap;
    }(es.TmxDocument));
    es.TmxMap = TmxMap;
    var OrientationType;
    (function (OrientationType) {
        OrientationType[OrientationType["unknown"] = 0] = "unknown";
        OrientationType[OrientationType["orthogonal"] = 1] = "orthogonal";
        OrientationType[OrientationType["isometric"] = 2] = "isometric";
        OrientationType[OrientationType["staggered"] = 3] = "staggered";
        OrientationType[OrientationType["hexagonal"] = 4] = "hexagonal";
    })(OrientationType = es.OrientationType || (es.OrientationType = {}));
    var StaggerAxisType;
    (function (StaggerAxisType) {
        StaggerAxisType[StaggerAxisType["x"] = 0] = "x";
        StaggerAxisType[StaggerAxisType["y"] = 1] = "y";
    })(StaggerAxisType = es.StaggerAxisType || (es.StaggerAxisType = {}));
    var StaggerIndexType;
    (function (StaggerIndexType) {
        StaggerIndexType[StaggerIndexType["odd"] = 0] = "odd";
        StaggerIndexType[StaggerIndexType["even"] = 1] = "even";
    })(StaggerIndexType = es.StaggerIndexType || (es.StaggerIndexType = {}));
    var RenderOrderType;
    (function (RenderOrderType) {
        RenderOrderType[RenderOrderType["rightDown"] = 0] = "rightDown";
        RenderOrderType[RenderOrderType["rightUp"] = 1] = "rightUp";
        RenderOrderType[RenderOrderType["leftDown"] = 2] = "leftDown";
        RenderOrderType[RenderOrderType["leftUp"] = 3] = "leftUp";
    })(RenderOrderType = es.RenderOrderType || (es.RenderOrderType = {}));
})(es || (es = {}));
var es;
(function (es) {
    var TmxObjectGroup = (function () {
        function TmxObjectGroup() {
        }
        return TmxObjectGroup;
    }());
    es.TmxObjectGroup = TmxObjectGroup;
    var TmxObject = (function () {
        function TmxObject() {
            this.shape = new egret.Shape();
            this.textField = new egret.TextField();
        }
        return TmxObject;
    }());
    es.TmxObject = TmxObject;
    var TmxText = (function () {
        function TmxText() {
        }
        return TmxText;
    }());
    es.TmxText = TmxText;
    var TmxAlignment = (function () {
        function TmxAlignment() {
        }
        return TmxAlignment;
    }());
    es.TmxAlignment = TmxAlignment;
    var TmxObjectType;
    (function (TmxObjectType) {
        TmxObjectType[TmxObjectType["basic"] = 0] = "basic";
        TmxObjectType[TmxObjectType["point"] = 1] = "point";
        TmxObjectType[TmxObjectType["tile"] = 2] = "tile";
        TmxObjectType[TmxObjectType["ellipse"] = 3] = "ellipse";
        TmxObjectType[TmxObjectType["polygon"] = 4] = "polygon";
        TmxObjectType[TmxObjectType["polyline"] = 5] = "polyline";
        TmxObjectType[TmxObjectType["text"] = 6] = "text";
    })(TmxObjectType = es.TmxObjectType || (es.TmxObjectType = {}));
    var DrawOrderType;
    (function (DrawOrderType) {
        DrawOrderType[DrawOrderType["unkownOrder"] = -1] = "unkownOrder";
        DrawOrderType[DrawOrderType["TopDown"] = 0] = "TopDown";
        DrawOrderType[DrawOrderType["IndexOrder"] = 1] = "IndexOrder";
    })(DrawOrderType = es.DrawOrderType || (es.DrawOrderType = {}));
    var TmxHorizontalAlignment;
    (function (TmxHorizontalAlignment) {
        TmxHorizontalAlignment[TmxHorizontalAlignment["left"] = 0] = "left";
        TmxHorizontalAlignment[TmxHorizontalAlignment["center"] = 1] = "center";
        TmxHorizontalAlignment[TmxHorizontalAlignment["right"] = 2] = "right";
        TmxHorizontalAlignment[TmxHorizontalAlignment["justify"] = 3] = "justify";
    })(TmxHorizontalAlignment = es.TmxHorizontalAlignment || (es.TmxHorizontalAlignment = {}));
    var TmxVerticalAlignment;
    (function (TmxVerticalAlignment) {
        TmxVerticalAlignment[TmxVerticalAlignment["top"] = 0] = "top";
        TmxVerticalAlignment[TmxVerticalAlignment["center"] = 1] = "center";
        TmxVerticalAlignment[TmxVerticalAlignment["bottom"] = 2] = "bottom";
    })(TmxVerticalAlignment = es.TmxVerticalAlignment || (es.TmxVerticalAlignment = {}));
})(es || (es = {}));
var es;
(function (es) {
    var TiledMapLoader = (function () {
        function TiledMapLoader() {
        }
        TiledMapLoader.loadTmxMap = function (map, filePath) {
            var xMap = RES.getRes(filePath);
            return this.loadTmxMapData(map, xMap, RES.getResourceInfo(filePath));
        };
        TiledMapLoader.loadTmxMapData = function (map, xMap, info) {
            return __awaiter(this, void 0, void 0, function () {
                var _i, _a, e, tileset;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
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
                            map.backgroundColor = es.TmxUtils.color16ToUnit(xMap["color"]);
                            map.properties = this.parsePropertyDict(xMap["properties"]);
                            map.maxTileWidth = map.tileWidth;
                            map.maxTileHeight = map.tileHeight;
                            map.tmxDirectory = info.root + info.url.replace(".", "_").replace(info.name, "");
                            map.tilesets = [];
                            _i = 0, _a = xMap["tilesets"];
                            _b.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3, 4];
                            e = _a[_i];
                            return [4, this.parseTmxTileset(map, e)];
                        case 2:
                            tileset = _b.sent();
                            map.tilesets.push(tileset);
                            this.updateMaxTileSizes(tileset);
                            _b.label = 3;
                        case 3:
                            _i++;
                            return [3, 1];
                        case 4:
                            map.layers = [];
                            map.tileLayers = [];
                            map.objectGroups = [];
                            map.imageLayers = [];
                            map.groups = [];
                            this.parseLayers(map, xMap, map, map.width, map.height, map.tmxDirectory);
                            return [2, map];
                    }
                });
            });
        };
        TiledMapLoader.parseLayers = function (container, xEle, map, width, height, tmxDirectory) {
            return __awaiter(this, void 0, void 0, function () {
                var _i, _a, e, layer, _b, tileLayer, objectgroup, imagelayer, newGroup;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _i = 0, _a = ObjectUtils.elements(xEle).where(function (x) {
                                return x.type == "tilelayer" || x.type == "objectgroup" || x.type == "imagelayer" || x.type == "group";
                            });
                            _c.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3, 11];
                            e = _a[_i];
                            layer = void 0;
                            _b = e.type;
                            switch (_b) {
                                case "tilelayer": return [3, 2];
                                case "objectgroup": return [3, 3];
                                case "imagelayer": return [3, 4];
                                case "group": return [3, 6];
                            }
                            return [3, 8];
                        case 2:
                            tileLayer = this.loadTmxLayer(new es.TmxLayer(), map, e, width, height);
                            layer = tileLayer;
                            if (container instanceof es.TmxMap || container instanceof es.TmxGroup)
                                container.tileLayers.push(tileLayer);
                            return [3, 9];
                        case 3:
                            objectgroup = this.loadTmxObjectGroup(new es.TmxObjectGroup(), map, e);
                            layer = objectgroup;
                            if (container instanceof es.TmxMap || container instanceof es.TmxGroup)
                                container.objectGroups.push(objectgroup);
                            return [3, 9];
                        case 4: return [4, this.loadTmxImageLayer(new es.TmxImageLayer(), map, e, tmxDirectory)];
                        case 5:
                            imagelayer = _c.sent();
                            layer = imagelayer;
                            if (container instanceof es.TmxMap || container instanceof es.TmxGroup)
                                container.imageLayers.push(imagelayer);
                            return [3, 9];
                        case 6: return [4, this.loadTmxGroup(new es.TmxGroup(), map, e, width, height, tmxDirectory)];
                        case 7:
                            newGroup = _c.sent();
                            layer = newGroup;
                            if (container instanceof es.TmxMap || container instanceof es.TmxGroup)
                                container.groups.push(newGroup);
                            return [3, 9];
                        case 8: throw new Error("无效的操作");
                        case 9:
                            if (container instanceof es.TmxMap || container instanceof es.TmxGroup)
                                container.layers.push(layer);
                            _c.label = 10;
                        case 10:
                            _i++;
                            return [3, 1];
                        case 11: return [2];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxGroup = function (group, map, xGroup, width, height, tmxDirectory) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            group.map = map;
                            group.name = xGroup["name"] != undefined ? xGroup["name"] : "";
                            group.opacity = xGroup["opacity"] != undefined ? xGroup["opacity"] : 1;
                            group.visible = xGroup["visible"] != undefined ? xGroup["visible"] : true;
                            group.offsetX = xGroup["offsetx"] != undefined ? xGroup["offsetx"] : 0;
                            group.offsetY = xGroup["offsety"] != undefined ? xGroup["offsety"] : 0;
                            group.properties = this.parsePropertyDict(xGroup["properties"]);
                            group.layers = [];
                            group.tileLayers = [];
                            group.objectGroups = [];
                            group.imageLayers = [];
                            group.groups = [];
                            return [4, this.parseLayers(group, xGroup, map, width, height, tmxDirectory)];
                        case 1:
                            _a.sent();
                            return [2, group];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxImageLayer = function (layer, map, xImageLayer, tmxDirectory) {
            return __awaiter(this, void 0, void 0, function () {
                var xImage, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            layer.map = map;
                            layer.name = xImageLayer["name"];
                            layer.width = xImageLayer["width"];
                            layer.height = xImageLayer["height"];
                            layer.visible = xImageLayer["visible"] != undefined ? xImageLayer["visible"] : true;
                            layer.opacity = xImageLayer["opacity"] != undefined ? xImageLayer["opacity"] : 1;
                            layer.offsetX = xImageLayer["offsetx"] != undefined ? xImageLayer["offsetx"] : 0;
                            layer.offsetY = xImageLayer["offsety"] != undefined ? xImageLayer["offsety"] : 0;
                            xImage = xImageLayer["image"];
                            if (!xImage) return [3, 2];
                            _a = layer;
                            return [4, this.loadTmxImage(new es.TmxImage(), xImage, tmxDirectory)];
                        case 1:
                            _a.image = _b.sent();
                            _b.label = 2;
                        case 2:
                            layer.properties = this.parsePropertyDict(xImageLayer["properties"]);
                            return [2, layer];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxLayer = function (layer, map, xLayer, width, height) {
            layer.map = map;
            layer.name = xLayer["name"];
            layer.opacity = xLayer["opacity"] != undefined ? xLayer["opacity"] : 1;
            layer.visible = xLayer["visible"] != undefined ? xLayer["visible"] : true;
            layer.offsetX = xLayer["offsetx"] != undefined ? xLayer["offsetx"] : 0;
            layer.offsetY = xLayer["offsety"] != undefined ? xLayer["offsety"] : 0;
            layer.width = xLayer["width"];
            layer.height = xLayer["height"];
            var xData = xLayer["data"];
            var encoding = xData["encoding"] != undefined ? xData["encoding"] : "csv";
            layer.tiles = new Array(width * height);
            if (encoding == "base64") {
                var br = es.TmxUtils.decode(xData.toString(), encoding, xData["compression"]);
                var index = 0;
                for (var j = 0; j < height; j++) {
                    for (var i = 0; i < width; i++) {
                        var gid = br[index];
                        layer.tiles[index++] = gid != 0 ? new es.TmxLayerTile(map, gid, i, j) : null;
                    }
                }
            }
            else if (encoding == "csv") {
                var k = 0;
                for (var _i = 0, xData_1 = xData; _i < xData_1.length; _i++) {
                    var s = xData_1[_i];
                    var gid = s;
                    var x = k % width;
                    var y = k / width;
                    layer.tiles[k++] = gid != 0 ? new es.TmxLayerTile(map, gid, x, y) : null;
                }
            }
            else if (!encoding) {
                var k = 0;
                for (var _a = 0, _b = xData["tile"]; _a < _b.length; _a++) {
                    var e = _b[_a];
                    var gid = e["gid"] != undefined ? e["gid"] : 0;
                    var x = k % width;
                    var y = k / width;
                    layer.tiles[k++] = gid != 0 ? new es.TmxLayerTile(map, gid, x, y) : null;
                }
            }
            else {
                throw new Error("TmxLayer:未知编码");
            }
            layer.properties = TiledMapLoader.parsePropertyDict(xLayer["properties"]);
            return layer;
        };
        TiledMapLoader.updateMaxTileSizes = function (tileset) {
            tileset.tiles.forEach(function (tile) {
                if (tile.image) {
                    if (tile.image.width > tileset.map.maxTileWidth)
                        tileset.map.maxTileWidth = tile.image.width;
                    if (tile.image.height > tileset.map.maxTileHeight)
                        tileset.map.maxTileHeight = tile.image.height;
                }
            });
            tileset.tileRegions.forEach(function (region) {
                var width = region.width;
                var height = region.height;
                if (width > tileset.map.maxTileWidth)
                    tileset.map.maxTileWidth = width;
                if (width > tileset.map.maxTileHeight)
                    tileset.map.maxTileHeight = height;
            });
        };
        TiledMapLoader.parseOrientationType = function (type) {
            if (type == "unknown")
                return es.OrientationType.unknown;
            if (type == "orthogonal")
                return es.OrientationType.orthogonal;
            if (type == "isometric")
                return es.OrientationType.isometric;
            if (type == "staggered")
                return es.OrientationType.staggered;
            if (type == "hexagonal")
                return es.OrientationType.hexagonal;
            return es.OrientationType.unknown;
        };
        TiledMapLoader.parseStaggerAxisType = function (type) {
            if (type == "y")
                return es.StaggerAxisType.y;
            return es.StaggerAxisType.x;
        };
        TiledMapLoader.parseStaggerIndexType = function (type) {
            if (type == "even")
                return es.StaggerIndexType.even;
            return es.StaggerIndexType.odd;
        };
        TiledMapLoader.parseRenderOrderType = function (type) {
            if (type == "right-up")
                return es.RenderOrderType.rightUp;
            if (type == "left-down")
                return es.RenderOrderType.leftDown;
            if (type == "left-up")
                return es.RenderOrderType.leftUp;
            return es.RenderOrderType.rightDown;
        };
        TiledMapLoader.parsePropertyDict = function (prop) {
            if (!prop)
                return null;
            var dict = new Map();
            for (var _i = 0, prop_1 = prop; _i < prop_1.length; _i++) {
                var p = prop_1[_i];
                var pname = p["name"];
                var valueAttr = p["value"];
                if (p["type"] == "color")
                    dict.set(pname, es.TmxUtils.color16ToUnit(valueAttr).toString());
                else
                    dict.set(pname, valueAttr);
            }
            return dict;
        };
        TiledMapLoader.parseTmxTileset = function (map, xTileset) {
            return __awaiter(this, void 0, void 0, function () {
                var xFirstGid, firstGid, source, xDocTileset;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            xFirstGid = xTileset["firstgid"];
                            firstGid = xFirstGid;
                            source = xTileset["source"];
                            if (!(source != undefined)) return [3, 2];
                            source = map.tmxDirectory + source;
                            return [4, RES.getResByUrl(source).catch(function (err) {
                                    throw new Error(err);
                                })];
                        case 1:
                            xDocTileset = _a.sent();
                            return [2, this.loadTmxTileset(new es.TmxTileset(), map, xDocTileset["tileset"], firstGid)];
                        case 2: return [2, this.loadTmxTileset(new es.TmxTileset(), map, xTileset, firstGid)];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxTileset = function (tileset, map, xTileset, firstGid) {
            return __awaiter(this, void 0, void 0, function () {
                var xImage, _i, _a, e, _b, _c, _d, t, xTile, tile, id, y, column, x;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
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
                            xImage = xTileset["image"];
                            if (!xImage) return [3, 2];
                            return [4, this.loadTmxImage(new es.TmxImage(), xTileset, map.tmxDirectory).then(function (image) {
                                    tileset.image = image;
                                }).catch(function (err) {
                                    throw new Error(err);
                                })];
                        case 1:
                            _e.sent();
                            _e.label = 2;
                        case 2:
                            tileset.terrains = [];
                            if (xTileset["terrains"])
                                for (_i = 0, _a = xTileset["terrains"]; _i < _a.length; _i++) {
                                    e = _a[_i];
                                    tileset.terrains.push(this.parseTmxTerrain(e));
                                }
                            tileset.tiles = new Map();
                            _b = [];
                            for (_c in xTileset["tiles"])
                                _b.push(_c);
                            _d = 0;
                            _e.label = 3;
                        case 3:
                            if (!(_d < _b.length)) return [3, 6];
                            t = _b[_d];
                            if (!xTileset["tiles"].hasOwnProperty(t)) return [3, 5];
                            xTile = xTileset["tiles"][t];
                            return [4, this.loadTmxTilesetTile(new es.TmxTilesetTile(), tileset, xTile, tileset.terrains, map.tmxDirectory)];
                        case 4:
                            tile = _e.sent();
                            tileset.tiles.set(tile.id == undefined ? Number(t) + 1 : tile.id, tile);
                            _e.label = 5;
                        case 5:
                            _d++;
                            return [3, 3];
                        case 6:
                            tileset.properties = this.parsePropertyDict(xTileset["properties"]);
                            tileset.tileRegions = new Map();
                            if (tileset.image) {
                                id = firstGid;
                                for (y = tileset.margin; y < tileset.image.height - tileset.margin; y += tileset.tileHeight + tileset.spacing) {
                                    column = 0;
                                    for (x = tileset.margin; x < tileset.image.width - tileset.margin; x += tileset.tileWidth + tileset.spacing) {
                                        tileset.tileRegions.set(id++, new es.Rectangle(x, y, tileset.tileWidth, tileset.tileHeight));
                                        if (++column >= tileset.columns)
                                            break;
                                    }
                                }
                            }
                            else {
                                tileset.tiles.forEach(function (tile, key) {
                                    tileset.tileRegions.set(key, new es.Rectangle(0, 0, tile.image.width, tile.image.height));
                                });
                            }
                            return [2, tileset];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxTilesetTile = function (tile, tileset, xTile, terrains, tmxDirectory) {
            return __awaiter(this, void 0, void 0, function () {
                var strTerrain, index, _i, strTerrain_1, v, edge, xImage, _a, _b, _c, e, _d, _e, e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            tile.tileset = tileset;
                            tile.id = xTile["id"];
                            strTerrain = xTile["terrain"];
                            if (strTerrain) {
                                tile.terrainEdges = new Array(4);
                                index = 0;
                                for (_i = 0, strTerrain_1 = strTerrain; _i < strTerrain_1.length; _i++) {
                                    v = strTerrain_1[_i];
                                    edge = terrains[v];
                                    tile.terrainEdges[index++] = edge;
                                }
                            }
                            tile.probability = xTile["probability"] != undefined ? xTile["probability"] : 1;
                            tile.type = xTile["type"];
                            xImage = xTile["image"];
                            if (!xImage) return [3, 2];
                            _a = tile;
                            return [4, this.loadTmxImage(new es.TmxImage(), xImage, tmxDirectory)];
                        case 1:
                            _a.image = _f.sent();
                            _f.label = 2;
                        case 2:
                            tile.objectGroups = [];
                            if (xTile["objectgroup"])
                                for (_b = 0, _c = xTile["objectgroup"]; _b < _c.length; _b++) {
                                    e = _c[_b];
                                    tile.objectGroups.push(this.loadTmxObjectGroup(new es.TmxObjectGroup(), tileset.map, e));
                                }
                            tile.animationFrames = [];
                            if (xTile["animation"]) {
                                for (_d = 0, _e = xTile["animation"]["frame"]; _d < _e.length; _d++) {
                                    e = _e[_d];
                                    tile.animationFrames.push(this.loadTmxAnimationFrame(new es.TmxAnimationFrame(), e));
                                }
                            }
                            tile.properties = this.parsePropertyDict(xTile["properties"]);
                            if (tile.properties)
                                tile.processProperties();
                            return [2, tile];
                    }
                });
            });
        };
        TiledMapLoader.loadTmxAnimationFrame = function (frame, xFrame) {
            frame.gid = xFrame["tileid"];
            frame.duration = xFrame["duration"] / 1000;
            return frame;
        };
        TiledMapLoader.loadTmxObjectGroup = function (group, map, xObjectGroup) {
            group.map = map;
            group.name = xObjectGroup["name"] != undefined ? xObjectGroup["name"] : "";
            group.color = es.TmxUtils.color16ToUnit(xObjectGroup["color"]);
            group.opacity = xObjectGroup["opacity"] != undefined ? xObjectGroup["opacity"] : 1;
            group.visible = xObjectGroup["visible"] != undefined ? xObjectGroup["visible"] : true;
            group.offsetX = xObjectGroup["offsetx"] != undefined ? xObjectGroup["offsetx"] : 0;
            group.offsetY = xObjectGroup["offsety"] != undefined ? xObjectGroup["offsety"] : 0;
            var drawOrderDict = new Map();
            drawOrderDict.set("unknown", es.DrawOrderType.unkownOrder);
            drawOrderDict.set("topdown", es.DrawOrderType.IndexOrder);
            drawOrderDict.set("index", es.DrawOrderType.TopDown);
            var drawOrderValue = xObjectGroup["draworder"];
            if (drawOrderValue)
                group.drawOrder = drawOrderDict.get(drawOrderValue);
            group.objects = [];
            for (var _i = 0, _a = xObjectGroup["objects"]; _i < _a.length; _i++) {
                var e = _a[_i];
                group.objects.push(this.loadTmxObject(new es.TmxObject(), map, e));
            }
            group.properties = this.parsePropertyDict(xObjectGroup["properties"]);
            return group;
        };
        TiledMapLoader.loadTmxObject = function (obj, map, xObject) {
            obj.id = xObject["id"] != undefined ? xObject["id"] : 0;
            obj.name = xObject["name"] != undefined ? xObject["name"] : "";
            obj.x = xObject["x"];
            obj.y = xObject["y"];
            obj.width = xObject["width"] != undefined ? xObject["width"] : 0;
            obj.height = xObject["height"] != undefined ? xObject["height"] : 0;
            obj.type = xObject["type"] != undefined ? xObject["type"] : "";
            obj.visible = xObject["visible"] != undefined ? xObject["visible"] : true;
            obj.rotation = xObject["rotation"] != undefined ? xObject["rotation"] : 0;
            var xGid = xObject["gid"];
            var xEllipse = xObject["ellipse"];
            var xPolygon = xObject["polygon"];
            var xPolyline = xObject["polyline"];
            var xText = xObject["text"];
            var xPoint = xObject["point"];
            if (xGid) {
                obj.tile = new es.TmxLayerTile(map, xGid, Math.round(obj.x), Math.round(obj.y));
                obj.objectType = es.TmxObjectType.tile;
            }
            else if (xEllipse) {
                obj.objectType = es.TmxObjectType.ellipse;
            }
            else if (xPolygon) {
                obj.points = this.parsePoints(xPolygon);
                obj.objectType = es.TmxObjectType.polygon;
            }
            else if (xPolyline) {
                obj.points = this.parsePoints(xPolyline);
                obj.objectType = es.TmxObjectType.polyline;
            }
            else if (xText) {
                obj.text = this.loadTmxText(new es.TmxText(), xText);
                obj.objectType = es.TmxObjectType.text;
            }
            else if (xPoint) {
                obj.objectType = es.TmxObjectType.point;
            }
            else {
                obj.objectType = es.TmxObjectType.basic;
            }
            obj.properties = this.parsePropertyDict(xObject["properties"]);
            return obj;
        };
        TiledMapLoader.loadTmxText = function (text, xText) {
            text.fontFamily = xText["fontfamily"] != undefined ? xText["fontfamily"] : "sans-serif";
            text.pixelSize = xText["pixelsize"] != undefined ? xText["pixelsize"] : 16;
            text.wrap = xText["wrap"] != undefined ? xText["wrap"] : false;
            text.color = es.TmxUtils.color16ToUnit(xText["color"]);
            text.bold = xText["bold"] ? xText["bold"] : false;
            text.italic = xText["italic"] ? xText["italic"] : false;
            text.underline = xText["underline"] ? xText["underline"] : false;
            text.strikeout = xText["strikeout"] ? xText["strikeout"] : false;
            text.kerning = xText["kerning"] ? xText["kerning"] : true;
            text.alignment = this.loadTmxAlignment(new es.TmxAlignment(), xText);
            text.value = xText;
            return text;
        };
        TiledMapLoader.loadTmxAlignment = function (alignment, xText) {
            function firstLetterToUpperCase(str) {
                if (!str || str == "")
                    return str;
                return str[0].toString().toUpperCase() + str.substr(1);
            }
            var xHorizontal = xText["halign"] != undefined ? xText["halign"] : "left";
            alignment.horizontal = es.TmxHorizontalAlignment[firstLetterToUpperCase(xHorizontal)];
            var xVertical = xText["valign"] != undefined ? xText["valign"] : "top";
            alignment.vertical = es.TmxVerticalAlignment[firstLetterToUpperCase((xVertical))];
            return alignment;
        };
        TiledMapLoader.parsePoints = function (xPoints) {
            var points = [];
            var index = 0;
            for (var _i = 0, xPoints_1 = xPoints; _i < xPoints_1.length; _i++) {
                var s = xPoints_1[_i];
                points[index++] = this.parsePoint(s);
            }
            return points;
        };
        TiledMapLoader.parsePoint = function (pt) {
            return new es.Vector2(pt.x, pt.y);
        };
        TiledMapLoader.parseTmxTerrain = function (xTerrain) {
            var terrain = new es.TmxTerrain();
            terrain.name = xTerrain["name"];
            terrain.tile = xTerrain["tile"];
            terrain.properties = this.parsePropertyDict(xTerrain["properties"]);
            return terrain;
        };
        TiledMapLoader.parseTmxTileOffset = function (xTileOffset) {
            var tmxTileOffset = new es.TmxTileOffset();
            if (!xTileOffset) {
                tmxTileOffset.x = 0;
                tmxTileOffset.y = 0;
                return tmxTileOffset;
            }
            tmxTileOffset.x = xTileOffset["x"];
            tmxTileOffset.y = xTileOffset["y"];
            return tmxTileOffset;
        };
        TiledMapLoader.loadTmxImage = function (image, xImage, tmxDirectory) {
            return __awaiter(this, void 0, void 0, function () {
                var xSource, texture;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            xSource = xImage["image"];
                            if (xSource != undefined) {
                                image.source = tmxDirectory + xSource;
                            }
                            else {
                                image.source = tmxDirectory + xImage;
                            }
                            return [4, RES.getResByUrl(image.source, null, this, RES.ResourceItem.TYPE_IMAGE).catch(function (err) {
                                    throw new Error(err);
                                })];
                        case 1:
                            texture = _a.sent();
                            image.bitmap = new egret.SpriteSheet(texture);
                            image.trans = es.TmxUtils.color16ToUnit(xImage["trans"]);
                            image.width = xImage["imagewidth"] != undefined ? xImage["imagewidth"] : texture.textureWidth;
                            image.height = xImage["imageheight"] != undefined ? xImage["imageheight"] : texture.textureHeight;
                            return [2, image];
                    }
                });
            });
        };
        return TiledMapLoader;
    }());
    es.TiledMapLoader = TiledMapLoader;
})(es || (es = {}));
var es;
(function (es) {
    var Bitmap = egret.Bitmap;
    var TiledRendering = (function () {
        function TiledRendering() {
        }
        TiledRendering.renderMap = function (map, container, position, scale, layerDepth) {
            var _this = this;
            map.layers.forEach(function (layer) {
                if (layer instanceof es.TmxLayer && layer.visible) {
                    _this.renderLayer(layer, container, position, scale, layerDepth);
                }
                else if (layer instanceof es.TmxImageLayer && layer.visible) {
                    _this.renderImageLayer(layer, container, position, scale, layerDepth);
                }
                else if (layer instanceof es.TmxGroup && layer.visible) {
                    _this.renderGroup(layer, container, position, scale, layerDepth);
                }
                else if (layer instanceof es.TmxObjectGroup && layer.visible) {
                    _this.renderObjectGroup(layer, container, position, scale, layerDepth);
                }
            });
        };
        TiledRendering.renderLayer = function (layer, container, position, scale, layerDepth) {
            if (!layer.visible)
                return;
            var tileWidth = layer.map.tileWidth * scale.x;
            var tileHeight = layer.map.tileHeight * scale.y;
            var color = es.DrawUtils.getColorMatrix(0xFFFFFF);
            for (var i = 0; i < layer.tiles.length; i++) {
                var tile = layer.tiles[i];
                if (!tile)
                    continue;
                this.renderTile(tile, container, position, scale, tileWidth, tileHeight, color, layerDepth);
            }
        };
        TiledRendering.renderLayerRenderCamera = function (layer, container, position, scale, layerDepth, camerClipBounds) {
            if (layer instanceof es.TmxLayer && layer.visible) {
                this.renderLayerCamera(layer, container, position, scale, layerDepth, camerClipBounds);
            }
            else if (layer instanceof es.TmxImageLayer && layer.visible) {
                this.renderImageLayer(layer, container, position, scale, layerDepth);
            }
            else if (layer instanceof es.TmxGroup && layer.visible) {
                this.renderGroup(layer, container, position, scale, layerDepth);
            }
            else if (layer instanceof es.TmxObjectGroup && layer.visible) {
                this.renderObjectGroup(layer, container, position, scale, layerDepth);
            }
        };
        TiledRendering.renderLayerCamera = function (layer, container, position, scale, layerDepth, camerClipBounds) {
            if (!layer.visible)
                return;
            position = position.add(layer.offset);
            camerClipBounds.location = camerClipBounds.location.subtract(position);
            var tileWidth = layer.map.tileWidth * scale.x;
            var tileHeight = layer.map.tileHeight * scale.y;
            var minX, minY, maxX, maxY = 0;
            if (layer.map.requiresLargeTileCulling) {
                minX = layer.map.worldToTilePositionX(camerClipBounds.left - (layer.map.maxTileWidth * scale.x - tileWidth));
                minY = layer.map.worldToTilePositionY(camerClipBounds.top - (layer.map.maxTileHeight * scale.y - tileHeight));
                maxX = layer.map.worldToTilePositionX(camerClipBounds.right + (layer.map.maxTileWidth * scale.x - tileWidth));
                maxY = layer.map.worldToTilePositionY(camerClipBounds.bottom + (layer.map.maxTileHeight * scale.y - tileHeight));
            }
            else {
                minX = layer.map.worldToTilePositionX(camerClipBounds.left);
                minY = layer.map.worldToTilePositionY(camerClipBounds.top);
                maxX = layer.map.worldToTilePositionX(camerClipBounds.right);
                maxY = layer.map.worldToTilePositionY(camerClipBounds.bottom);
            }
            var color = es.DrawUtils.getColorMatrix(0xFFFFFF);
            for (var y = minY; y <= maxY; y++) {
                for (var x = minX; x <= maxX; x++) {
                    var tile = layer.getTile(x, y);
                    if (tile)
                        this.renderTile(tile, container, position, scale, tileWidth, tileHeight, color, layerDepth);
                }
            }
        };
        TiledRendering.renderImageLayer = function (layer, container, position, scale, layerDepth) {
            if (!layer.visible)
                return;
            var color = es.DrawUtils.getColorMatrix(0xFFFFFF);
            var pos = es.Vector2.add(position, new es.Vector2(layer.offsetX, layer.offsetY).multiply(scale));
            if (!layer.image.texture.parent)
                container.addChild(layer.image.texture);
            layer.image.texture.x = pos.x;
            layer.image.texture.y = pos.y;
            layer.image.texture.scaleX = scale.x;
            layer.image.texture.scaleY = scale.y;
            layer.image.texture.filters = [color];
        };
        TiledRendering.renderObjectGroup = function (objGroup, container, position, scale, layerDepth) {
            if (!objGroup.visible)
                return;
            function debugRender(obj, pos) {
                if (!container)
                    return;
                if (!es.Core.debugRenderEndabled)
                    return;
                if (!obj.textField.parent && obj.name) {
                    obj.textField.text = obj.name;
                    obj.textField.size = 12;
                    obj.textField.fontFamily = "sans-serif";
                    if (obj.shape) {
                        obj.textField.x = pos.x + (obj.shape.getBounds().width - obj.textField.width) / 2 + obj.shape.getBounds().x;
                        obj.textField.y = pos.y - obj.textField.height - 5 + obj.shape.getBounds().y;
                    }
                    else {
                        obj.textField.x = pos.x + (obj.width - obj.textField.width) / 2;
                        obj.textField.y = pos.y - obj.textField.height - 5;
                    }
                    obj.textField.background = true;
                    obj.textField.backgroundColor = 0xa0a0a4;
                    obj.textField.textColor = 0xffffff;
                    container.addChild(obj.textField);
                }
            }
            for (var object in objGroup.objects) {
                var obj = objGroup.objects[object];
                if (!obj.visible)
                    continue;
                if (!es.Core.debugRenderEndabled) {
                    if (obj.objectType != es.TmxObjectType.tile && obj.objectType != es.TmxObjectType.text)
                        continue;
                }
                var pos = es.Vector2.add(position, new es.Vector2(obj.x, obj.y).multiply(scale));
                switch (obj.objectType) {
                    case es.TmxObjectType.basic:
                        if (!obj.shape.parent) {
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
                    case es.TmxObjectType.point:
                        var size = objGroup.map.tileWidth * 0.5;
                        pos.x -= size * 0.5;
                        pos.y -= size * 0.5;
                        if (!obj.shape.parent) {
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
                    case es.TmxObjectType.tile:
                        this.renderTilesetTile(objGroup, obj, container, pos, scale, debugRender);
                        break;
                    case es.TmxObjectType.ellipse:
                        pos = new es.Vector2(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5).multiply(scale);
                        if (!obj.shape.parent) {
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
                    case es.TmxObjectType.polygon:
                    case es.TmxObjectType.polyline:
                        var points = [];
                        for (var i = 0; i < obj.points.length; i++)
                            points[i] = es.Vector2.multiply(obj.points[i], scale);
                        if (!obj.shape.parent && points.length > 0) {
                            obj.shape.x = pos.x;
                            obj.shape.y = pos.y;
                            container.addChild(obj.shape);
                            obj.shape.graphics.clear();
                            obj.shape.graphics.lineStyle(1, 0xa0a0a4);
                            for (var i = 0; i < points.length; i++) {
                                if (i == 0) {
                                    obj.shape.graphics.moveTo(points[i].x, points[i].y);
                                }
                                else {
                                    obj.shape.graphics.lineTo(points[i].x, points[i].y);
                                }
                            }
                            obj.shape.graphics.endFill();
                            debugRender(obj, pos);
                        }
                        break;
                    case es.TmxObjectType.text:
                        if (!obj.textField.parent) {
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
        };
        TiledRendering.renderTilesetTile = function (objGroup, obj, container, pos, scale, debugRender) {
            var tileset = objGroup.map.getTilesetForTileGid(obj.tile.gid);
            var sourceRect = tileset.tileRegions.get(obj.tile.gid);
            if (container) {
                if (tileset.image) {
                    if (obj.tile.horizontalFlip && obj.tile.verticalFlip) {
                        pos.x += tileset.tileHeight + (sourceRect.height * scale.y - tileset.tileHeight);
                        pos.y -= (sourceRect.width * scale.x - tileset.tileWidth);
                    }
                    else if (obj.tile.horizontalFlip) {
                        pos.x += tileset.tileWidth + (sourceRect.height * scale.y - tileset.tileHeight);
                    }
                    else if (obj.tile.verticalFlip) {
                        pos.y += (tileset.tileWidth - sourceRect.width * scale.x);
                    }
                    else {
                        pos.y += (tileset.tileHeight - sourceRect.height * scale.y);
                    }
                    var texture = tileset.image.bitmap.getTexture("" + obj.tile.gid);
                    if (!texture) {
                        texture = tileset.image.bitmap.createTexture("" + obj.tile.gid, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
                    }
                    tileset.image.texture = new Bitmap(texture);
                    container.addChild(tileset.image.texture);
                    tileset.image.texture.x = pos.x;
                    tileset.image.texture.y = pos.y;
                    if (obj.tile.verticalFlip && obj.tile.horizontalFlip) {
                        tileset.image.texture.scaleX = -1;
                        tileset.image.texture.scaleY = -1;
                    }
                    else if (obj.tile.verticalFlip) {
                        tileset.image.texture.scaleX = scale.x;
                        tileset.image.texture.scaleY = -1;
                    }
                    else if (obj.tile.horizontalFlip) {
                        tileset.image.texture.scaleX = -1;
                        tileset.image.texture.scaleY = scale.y;
                    }
                    else {
                        tileset.image.texture.scaleX = scale.x;
                        tileset.image.texture.scaleY = scale.y;
                    }
                    tileset.image.texture.anchorOffsetX = 0;
                    tileset.image.texture.anchorOffsetY = 0;
                    debugRender(obj, pos);
                }
                else {
                    var tilesetTile = tileset.tiles.get(obj.tile.gid);
                    var texture = tilesetTile.image.bitmap.getTexture("" + obj.tile.gid);
                    if (!texture) {
                        texture = tilesetTile.image.bitmap.createTexture("" + obj.tile.gid, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
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
                    }
                    else if (obj.tile.verticalFlip) {
                        tilesetTile.image.texture.scaleX = scale.x;
                        tilesetTile.image.texture.scaleY = -1;
                    }
                    else if (obj.tile.horizontalFlip) {
                        tilesetTile.image.texture.scaleX = -1;
                        tilesetTile.image.texture.scaleY = scale.y;
                    }
                    else {
                        tilesetTile.image.texture.scaleX = scale.x;
                        tilesetTile.image.texture.scaleY = scale.y;
                    }
                    tilesetTile.image.texture.anchorOffsetX = 0;
                    tilesetTile.image.texture.anchorOffsetY = 0;
                }
            }
        };
        TiledRendering.renderGroup = function (group, container, position, scale, layerDepth) {
            var _this = this;
            if (!group.visible)
                return;
            group.layers.forEach(function (layer) {
                if (layer instanceof es.TmxGroup) {
                    _this.renderGroup(layer, container, position, scale, layerDepth);
                }
                if (layer instanceof es.TmxObjectGroup) {
                    _this.renderObjectGroup(layer, container, position, scale, layerDepth);
                }
                if (layer instanceof es.TmxLayer) {
                    _this.renderLayer(layer, container, position, scale, layerDepth);
                }
                if (layer instanceof es.TmxImageLayer) {
                    _this.renderImageLayer(layer, container, position, scale, layerDepth);
                }
            });
        };
        TiledRendering.renderTile = function (tile, container, position, scale, tileWidth, tileHeight, color, layerDepth) {
            var gid = tile.gid;
            var tilesetTile = tile.tilesetTile;
            if (tilesetTile && tilesetTile.animationFrames.length > 0)
                gid = tilesetTile.currentAnimationFrameGid;
            var sourceRect = tile.tileset.tileRegions.get(gid);
            var tx = Math.floor(tile.x) * tileWidth;
            var ty = Math.floor(tile.y) * tileHeight;
            var rotation = 0;
            if (tile.horizontalFlip && tile.verticalFlip) {
                tx += tileHeight + (sourceRect.height * scale.y - tileHeight);
                ty -= (sourceRect.width * scale.x - tileWidth);
            }
            else if (tile.horizontalFlip) {
                tx += tileWidth + (sourceRect.height * scale.y - tileHeight);
            }
            else if (tile.verticalFlip) {
                ty += (tileWidth - sourceRect.width * scale.x);
            }
            else {
                ty += (tileHeight - sourceRect.height * scale.y);
            }
            var pos = new es.Vector2(tx, ty).add(position);
            if (tile.tileset.image) {
                if (container) {
                    var texture = tile.tileset.image.bitmap.getTexture("" + gid);
                    if (!texture) {
                        texture = tile.tileset.image.bitmap.createTexture("" + gid, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
                    }
                    tile.tileset.image.texture = new Bitmap(texture);
                    container.addChild(tile.tileset.image.texture);
                    if (tile.tileset.image.texture.x != pos.x)
                        tile.tileset.image.texture.x = pos.x;
                    if (tile.tileset.image.texture.y != pos.y)
                        tile.tileset.image.texture.y = pos.y;
                    if (tile.verticalFlip && tile.horizontalFlip) {
                        tile.tileset.image.texture.scaleX = -1;
                        tile.tileset.image.texture.scaleY = -1;
                    }
                    else if (tile.verticalFlip) {
                        tile.tileset.image.texture.scaleX = scale.x;
                        tile.tileset.image.texture.scaleY = -1;
                    }
                    else if (tile.horizontalFlip) {
                        tile.tileset.image.texture.scaleX = -1;
                        tile.tileset.image.texture.scaleY = scale.y;
                    }
                    else {
                        tile.tileset.image.texture.scaleX = scale.x;
                        tile.tileset.image.texture.scaleY = scale.y;
                    }
                    if (tile.tileset.image.texture.rotation != rotation)
                        tile.tileset.image.texture.rotation = rotation;
                    if (tile.tileset.image.texture.anchorOffsetX != 0)
                        tile.tileset.image.texture.anchorOffsetX = 0;
                    if (tile.tileset.image.texture.anchorOffsetY != 0)
                        tile.tileset.image.texture.anchorOffsetY = 0;
                }
            }
            else {
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
        };
        return TiledRendering;
    }());
    es.TiledRendering = TiledRendering;
})(es || (es = {}));
var es;
(function (es) {
    var TmxTileset = (function (_super) {
        __extends(TmxTileset, _super);
        function TmxTileset() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TmxTileset.prototype.update = function () {
            this.tiles.forEach(function (value) {
                value.updateAnimatedTiles();
            });
        };
        return TmxTileset;
    }(es.TmxDocument));
    es.TmxTileset = TmxTileset;
    var TmxTileOffset = (function () {
        function TmxTileOffset() {
        }
        return TmxTileOffset;
    }());
    es.TmxTileOffset = TmxTileOffset;
    var TmxTerrain = (function () {
        function TmxTerrain() {
        }
        return TmxTerrain;
    }());
    es.TmxTerrain = TmxTerrain;
})(es || (es = {}));
var es;
(function (es) {
    var TmxTilesetTile = (function () {
        function TmxTilesetTile() {
        }
        Object.defineProperty(TmxTilesetTile.prototype, "currentAnimationFrameGid", {
            get: function () {
                return this.animationFrames[this._animationCurrentFrame].gid + this.tileset.firstGid;
            },
            enumerable: true,
            configurable: true
        });
        TmxTilesetTile.prototype.processProperties = function () {
            var value;
            value = this.properties.get("engine.isDestructable");
            if (value)
                this.isDestructable = Boolean(value);
            value = this.properties.get("engine:isSlope");
            if (value)
                this.isSlope = Boolean(value);
            value = this.properties.get("engine:isOneWayPlatform");
            if (value)
                this.isOneWayPlatform = Boolean(value);
            value = this.properties.get("engine:slopeTopLeft");
            if (value)
                this.slopeTopLeft = Number(value);
            value = this.properties.get("engine:slopeTopRight");
            if (value)
                this.slopeTopRight = Number(value);
        };
        TmxTilesetTile.prototype.updateAnimatedTiles = function () {
            if (this.animationFrames.length == 0)
                return;
            this._animationElapsedTime += es.Time.deltaTime;
            if (this._animationElapsedTime > this.animationFrames[this._animationCurrentFrame].duration) {
                this._animationCurrentFrame = es.MathHelper.incrementWithWrap(this._animationCurrentFrame, this.animationFrames.length);
                this._animationElapsedTime = 0;
            }
        };
        return TmxTilesetTile;
    }());
    es.TmxTilesetTile = TmxTilesetTile;
    var TmxAnimationFrame = (function () {
        function TmxAnimationFrame() {
        }
        return TmxAnimationFrame;
    }());
    es.TmxAnimationFrame = TmxAnimationFrame;
})(es || (es = {}));
var es;
(function (es) {
    var TmxUtils = (function () {
        function TmxUtils() {
        }
        TmxUtils.decode = function (data, encoding, compression) {
            compression = compression || "none";
            encoding = encoding || "none";
            switch (encoding) {
                case "base64":
                    var decoded = es.Base64Utils.decodeBase64AsArray(data, 4);
                    return (compression === "none") ? decoded : es.Base64Utils.decompress(data, decoded, compression);
                case "csv":
                    return es.Base64Utils.decodeCSV(data);
                case "none":
                    var datas = [];
                    for (var i = 0; i < data.length; i++) {
                        datas[i] = +data[i].gid;
                    }
                    return datas;
                default:
                    throw new Error("未定义的编码:" + encoding);
            }
        };
        TmxUtils.color16ToUnit = function ($color) {
            if (!$color)
                return 0xFFFFFF;
            var colorStr = "0x" + $color.slice(1);
            return parseInt(colorStr, 16);
        };
        return TmxUtils;
    }());
    es.TmxUtils = TmxUtils;
})(es || (es = {}));
