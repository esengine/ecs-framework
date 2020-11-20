declare module es {
    class TiledMapRenderer extends RenderableComponent {
        tiledMap: TmxMap;
        physicsLayer: Ref<number>;
        layerIndicesToRender: number[];
        private toContainer;
        readonly width: number;
        readonly height: number;
        collisionLayer: TmxLayer;
        _shouldCreateColliders: boolean;
        _colliders: Collider[];
        constructor(tiledMap: TmxMap, collisionLayerName?: string, shouldCreateColliders?: boolean);
        setLayerToRender(layerName: string): void;
        setLayersToRender(...layerNames: string[]): void;
        private getLayerIndex;
        getRowAtWorldPosition(yPos: number): number;
        getColumnAtWorldPosition(xPos: number): number;
        onEntityTransformChanged(comp: transform.Component): void;
        onAddedToEntity(): void;
        onRemovedFromEntity(): void;
        update(): void;
        render(camera: es.Camera): void;
        addColliders(): void;
        removeColliders(): void;
    }
}
declare module es {
    class TmxGroup implements ITmxLayer {
        map: TmxMap;
        offsetX: number;
        offsetY: number;
        opacity: number;
        properties: Map<string, string>;
        visible: boolean;
        name: string;
        layers: ITmxLayer[];
        tileLayers: TmxLayer[];
        objectGroups: TmxObjectGroup[];
        imageLayers: TmxImageLayer[];
        groups: TmxGroup[];
    }
}
declare module es {
    interface ITmxLayer {
        offsetX: number;
        offsetY: number;
        opacity: number;
        visible: boolean;
        properties: Map<string, string>;
    }
}
declare module es {
    class TmxImageLayer implements ITmxLayer {
        map: TmxMap;
        name: string;
        offsetX: number;
        offsetY: number;
        opacity: number;
        properties: Map<string, string>;
        visible: boolean;
        width?: number;
        height?: number;
        image: TmxImage;
    }
}
declare module es {
    class TmxLayer implements ITmxLayer {
        map: TmxMap;
        name: string;
        opacity: number;
        offsetX: number;
        offsetY: number;
        properties: Map<string, string>;
        visible: boolean;
        readonly offset: Vector2;
        width: number;
        height: number;
        tiles: TmxLayerTile[];
        getTileWithGid(gid: number): TmxLayerTile;
        getTile(x: number, y: number): TmxLayerTile;
        getCollisionRectangles(): Rectangle[];
        findBoundsRect(startX: number, endX: number, startY: number, checkedIndexes?: boolean[]): Rectangle;
    }
    class TmxLayerTile {
        static readonly FLIPPED_HORIZONTALLY_FLAG: number;
        static readonly FLIPPED_VERTICALLY_FLAG: number;
        tileset: TmxTileset;
        gid: number;
        x: number;
        y: number;
        readonly position: Vector2;
        horizontalFlip: boolean;
        verticalFlip: boolean;
        _tilesetTileIndex?: number;
        readonly tilesetTile: TmxTilesetTile;
        constructor(map: TmxMap, id: number, x: number, y: number);
    }
}
declare module es {
    class TmxDocument {
        tmxDirectory: string;
        constructor();
    }
    interface ITmxElement {
        name: string;
    }
    class TmxImage {
        texture: egret.Bitmap;
        bitmap: egret.SpriteSheet;
        source: string;
        format: string;
        data: any;
        trans: number;
        width: number;
        height: number;
        dispose(): void;
    }
}
declare module es {
    class TmxMap extends TmxDocument {
        version: string;
        tiledVersion: string;
        width: number;
        height: number;
        readonly worldWidth: number;
        readonly worldHeight: number;
        tileWidth: number;
        tileHeight: number;
        hexSideLength?: number;
        orientation: OrientationType;
        staggerAxis: StaggerAxisType;
        staggerIndex: StaggerIndexType;
        renderOrder: RenderOrderType;
        backgroundColor: number;
        nextObjectID?: number;
        layers: ITmxLayer[];
        tilesets: TmxTileset[];
        tileLayers: TmxLayer[];
        objectGroups: TmxObjectGroup[];
        imageLayers: TmxImageLayer[];
        groups: TmxGroup[];
        properties: Map<string, string>;
        maxTileWidth: number;
        maxTileHeight: number;
        readonly requiresLargeTileCulling: boolean;
        getTilesetForTileGid(gid: number): TmxTileset;
        worldToTilePositionX(x: number, clampToTilemapBounds?: boolean): number;
        worldToTilePositionY(y: number, clampToTilemapBounds?: boolean): number;
        getLayer(name: string): ITmxLayer;
        update(): void;
        _isDisposed: any;
        dispose(disposing?: boolean): void;
    }
    enum OrientationType {
        unknown = 0,
        orthogonal = 1,
        isometric = 2,
        staggered = 3,
        hexagonal = 4
    }
    enum StaggerAxisType {
        x = 0,
        y = 1
    }
    enum StaggerIndexType {
        odd = 0,
        even = 1
    }
    enum RenderOrderType {
        rightDown = 0,
        rightUp = 1,
        leftDown = 2,
        leftUp = 3
    }
}
declare module es {
    class TmxObjectGroup implements ITmxLayer {
        map: TmxMap;
        name: string;
        opacity: number;
        visible: boolean;
        offsetX: number;
        offsetY: number;
        color: number;
        drawOrder: DrawOrderType;
        objects: TmxObject[];
        properties: Map<string, string>;
    }
    class TmxObject implements ITmxElement {
        id: number;
        name: string;
        shape: egret.Shape;
        textField: egret.TextField;
        objectType: TmxObjectType;
        type: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        tile: TmxLayerTile;
        visible: boolean;
        text: TmxText;
        points: Vector2[];
        properties: Map<string, string>;
        constructor();
    }
    class TmxText {
        fontFamily: string;
        pixelSize: number;
        wrap: boolean;
        color: number;
        bold: boolean;
        italic: boolean;
        underline: boolean;
        strikeout: boolean;
        kerning: boolean;
        alignment: TmxAlignment;
        value: string;
    }
    class TmxAlignment {
        horizontal: TmxHorizontalAlignment;
        vertical: TmxVerticalAlignment;
    }
    enum TmxObjectType {
        basic = 0,
        point = 1,
        tile = 2,
        ellipse = 3,
        polygon = 4,
        polyline = 5,
        text = 6
    }
    enum DrawOrderType {
        unkownOrder = -1,
        TopDown = 0,
        IndexOrder = 1
    }
    enum TmxHorizontalAlignment {
        left = 0,
        center = 1,
        right = 2,
        justify = 3
    }
    enum TmxVerticalAlignment {
        top = 0,
        center = 1,
        bottom = 2
    }
}
declare module es {
    class TiledMapLoader {
        static loadTmxMap(map: TmxMap, filePath: string): Promise<TmxMap>;
        static loadTmxMapData(map: TmxMap, xMap: any, info: any): Promise<TmxMap>;
        static parseLayers(container: any, xEle: any, map: TmxMap, width: number, height: number, tmxDirectory: string): Promise<void>;
        static loadTmxGroup(group: TmxGroup, map: TmxMap, xGroup: any, width: number, height: number, tmxDirectory: string): Promise<TmxGroup>;
        static loadTmxImageLayer(layer: TmxImageLayer, map: TmxMap, xImageLayer: any, tmxDirectory: string): Promise<TmxImageLayer>;
        static loadTmxLayer(layer: TmxLayer, map: TmxMap, xLayer: any, width: number, height: number): TmxLayer;
        private static updateMaxTileSizes;
        static parseOrientationType(type: string): OrientationType;
        static parseStaggerAxisType(type: string): StaggerAxisType;
        static parseStaggerIndexType(type: string): StaggerIndexType;
        static parseRenderOrderType(type: string): RenderOrderType;
        static parsePropertyDict(prop: any): Map<string, string>;
        static parseTmxTileset(map: TmxMap, xTileset: any): Promise<TmxTileset>;
        static loadTmxTileset(tileset: TmxTileset, map: TmxMap, xTileset: any, firstGid: number): Promise<TmxTileset>;
        static loadTmxTilesetTile(tile: TmxTilesetTile, tileset: TmxTileset, xTile: any, terrains: TmxTerrain[], tmxDirectory: string): Promise<TmxTilesetTile>;
        static loadTmxAnimationFrame(frame: TmxAnimationFrame, xFrame: any): TmxAnimationFrame;
        static loadTmxObjectGroup(group: TmxObjectGroup, map: TmxMap, xObjectGroup: any): TmxObjectGroup;
        static loadTmxObject(obj: TmxObject, map: TmxMap, xObject: any): TmxObject;
        static loadTmxText(text: TmxText, xText: any): TmxText;
        static loadTmxAlignment(alignment: TmxAlignment, xText: any): TmxAlignment;
        static parsePoints(xPoints: any): any[];
        static parsePoint(pt: {
            x: number;
            y: number;
        }): Vector2;
        static parseTmxTerrain(xTerrain: any): TmxTerrain;
        static parseTmxTileOffset(xTileOffset: any): TmxTileOffset;
        static loadTmxImage(image: TmxImage, xImage: any, tmxDirectory: string): Promise<TmxImage>;
    }
}
declare module es {
    class TiledRendering {
        static renderMap(map: TmxMap, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number): void;
        static renderLayer(layer: TmxLayer, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number): void;
        static renderLayerRenderCamera(layer: ITmxLayer, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number, camerClipBounds: Rectangle): void;
        static renderLayerCamera(layer: TmxLayer, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number, camerClipBounds: Rectangle): void;
        static renderImageLayer(layer: TmxImageLayer, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number): void;
        static renderObjectGroup(objGroup: TmxObjectGroup, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number): void;
        private static renderTilesetTile;
        static renderGroup(group: TmxGroup, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, layerDepth: number): void;
        static renderTile(tile: TmxLayerTile, container: egret.DisplayObjectContainer, position: Vector2, scale: Vector2, tileWidth: number, tileHeight: number, color: egret.ColorMatrixFilter, layerDepth: number): void;
    }
}
declare module es {
    class TmxTileset extends TmxDocument implements ITmxElement {
        map: TmxMap;
        firstGid: number;
        name: any;
        tileWidth: number;
        tileHeight: number;
        spacing: number;
        margin: number;
        columns?: number;
        tileCount?: number;
        tiles: Map<number, TmxTilesetTile>;
        tileOffset: TmxTileOffset;
        properties: Map<string, string>;
        image: TmxImage;
        terrains: TmxTerrain[];
        tileRegions: Map<number, Rectangle>;
        update(): void;
    }
    class TmxTileOffset {
        x: number;
        y: number;
    }
    class TmxTerrain implements ITmxElement {
        name: any;
        tile: number;
        properties: Map<string, string>;
    }
}
declare module es {
    class TmxTilesetTile {
        tileset: TmxTileset;
        id: number;
        terrainEdges: TmxTerrain[];
        probability: number;
        type: string;
        properties: Map<string, string>;
        image: TmxImage;
        objectGroups: TmxObjectGroup[];
        animationFrames: TmxAnimationFrame[];
        readonly currentAnimationFrameGid: number;
        _animationElapsedTime: number;
        _animationCurrentFrame: number;
        isDestructable: boolean;
        isSlope: boolean;
        isOneWayPlatform: boolean;
        slopeTopLeft: number;
        slopeTopRight: number;
        processProperties(): void;
        updateAnimatedTiles(): void;
    }
    class TmxAnimationFrame {
        gid: number;
        duration: number;
    }
}
declare module es {
    class TmxUtils {
        static decode(data: any, encoding: any, compression: string): Array<number>;
        static color16ToUnit($color: string): number;
    }
}
