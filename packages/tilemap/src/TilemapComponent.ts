import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';
import type { IResourceComponent, ResourceReference } from '@esengine/asset-system';
import { UVHelper } from '@esengine/asset-system';
import { SortingLayers, type ISortable } from '@esengine/engine-core';

/**
 * Resize anchor point for tilemap expansion
 * 瓦片地图扩展的锚点位置
 */
export type ResizeAnchor =
    | 'top-left' | 'top-center' | 'top-right'
    | 'middle-left' | 'center' | 'middle-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Animation frame definition
 * 动画帧定义
 */
export interface ITileAnimationFrame {
    /** Tile ID to display for this frame (local ID within tileset) | 此帧显示的瓦片ID（图块集内的本地ID） */
    tileId: number;
    /** Frame duration in milliseconds | 帧持续时间（毫秒） */
    duration: number;
}

/**
 * Tile animation definition
 * 瓦片动画定义
 */
export interface ITileAnimation {
    /** Animation frame sequence | 动画帧序列 */
    frames: ITileAnimationFrame[];
}

/**
 * Individual tile metadata
 * 单个瓦片元数据
 */
export interface ITileMetadata {
    /** Tile ID (local ID within tileset) | 瓦片ID（图块集内的本地ID） */
    id: number;
    /** Tile class/type | 瓦片类型 */
    type?: string;
    /** Custom properties | 自定义属性 */
    properties?: Record<string, unknown>;
    /** Tile animation (if any) | 瓦片动画（如果有） */
    animation?: ITileAnimation;
}

/**
 * Tileset data interface
 * 图块集数据接口
 */
export interface ITilesetData {
    /** Tileset name | 图块集名称 */
    name: string;
    /** Data format version | 数据格式版本 */
    version: number;
    /** Image file path | 图片文件路径 */
    image: string;
    /** Image width in pixels | 图片宽度（像素） */
    imageWidth: number;
    /** Image height in pixels | 图片高度（像素） */
    imageHeight: number;
    /** Single tile width in pixels | 单个图块宽度（像素） */
    tileWidth: number;
    /** Single tile height in pixels | 单个图块高度（像素） */
    tileHeight: number;
    /** Total number of tiles | 图块总数 */
    tileCount: number;
    /** Number of tile columns | 图块列数 */
    columns: number;
    /** Number of tile rows | 图块行数 */
    rows: number;
    /** Margin around tileset in pixels | 图块集边距（像素） */
    margin?: number;
    /** Spacing between tiles in pixels | 图块间距（像素） */
    spacing?: number;
    /** Individual tile metadata | 单个图块元数据 */
    tiles?: ITileMetadata[];
}

/**
 * Layer data interface
 * 图层数据接口
 */
export interface ITilemapLayerData {
    /** Unique layer identifier | 图层唯一标识符 */
    id: string;
    /** Layer display name | 图层显示名称 */
    name: string;
    /** Layer visibility | 图层可见性 */
    visible: boolean;
    /** Layer opacity (0-1) | 图层不透明度（0-1） */
    opacity: number;
    /** Tile index data array (row-major order) | 图块索引数据数组（行优先顺序） */
    data: number[];
    /** Default tileset index for this layer | 此图层的默认图块集索引 */
    tilesetIndex?: number;
    /** Layer X offset in pixels | 图层X偏移（像素） */
    offsetX?: number;
    /** Layer Y offset in pixels | 图层Y偏移（像素） */
    offsetY?: number;
    /** Material asset path for this layer (.mat file) | 此图层的材质资源路径（.mat 文件） */
    materialPath?: string;
    /** Runtime material ID (set after loading) | 运行时材质ID（加载后设置） */
    materialId?: number;
    /** Tint color in hex format | 着色颜色（十六进制格式） */
    color?: string;
    /** Hidden in game (visible only in editor) | 游戏中隐藏（仅在编辑器中可见） */
    hiddenInGame?: boolean;
    /** Custom layer properties | 自定义图层属性 */
    properties?: Record<string, unknown>;
}

/**
 * Tileset reference info
 * 图块集引用信息
 */
export interface ITilesetRef {
    /** Tileset image source path | 图块集图片源路径 */
    source: string;
    /** First global tile ID for this tileset | 此图块集的第一个全局图块ID */
    firstGid: number;
    /** Loaded tileset data | 已加载的图块集数据 */
    data?: ITilesetData;
    /** GPU texture ID for rendering | 用于渲染的GPU纹理ID */
    textureId?: number;
}

/**
 * Tilemap data interface
 * 瓦片地图数据接口
 */
export interface ITilemapData {
    /** Tilemap name | 瓦片地图名称 */
    name: string;
    /** Data format version | 数据格式版本 */
    version: number;
    /** Map width in tiles | 地图宽度（图块数） */
    width: number;
    /** Map height in tiles | 地图高度（图块数） */
    height: number;
    /** Single tile width in pixels | 单个图块宽度（像素） */
    tileWidth: number;
    /** Single tile height in pixels | 单个图块高度（像素） */
    tileHeight: number;
    /** Array of tileset references | 图块集引用数组 */
    tilesets: ITilesetRef[];
    /** Array of layer data | 图层数据数组 */
    layers: ITilemapLayerData[];
    /** Collision data array | 碰撞数据数组 */
    collisionData?: number[];
    /** Custom tilemap properties | 自定义瓦片地图属性 */
    properties?: Record<string, unknown>;
}

/**
 * Tilemap Component - Manages tile-based 2D map rendering
 * 瓦片地图组件 - 管理基于瓦片的2D地图渲染
 */
@ECSComponent('Tilemap')
@Serializable({ version: 2, typeId: 'Tilemap' })
export class TilemapComponent extends Component implements IResourceComponent, ISortable {
    /** Tilemap asset GUID reference | 瓦片地图资源GUID引用 */
    @Serialize()
    @Property({ type: 'asset', label: 'Tilemap', extensions: ['.tilemap', '.tilemap.json'] })
    public tilemapAssetGuid: string = '';

    @Serialize()
    private _width: number = 10;

    @Serialize()
    private _height: number = 10;

    /** Map width in tiles | 地图宽度（图块数） */
    @Property({ type: 'integer', label: 'Width (Tiles)', min: 1 })
    public get width(): number {
        return this._width;
    }

    public set width(value: number) {
        if (value !== this._width && value > 0) {
            this.resize(value, this._height);
        }
    }

    /** Map height in tiles | 地图高度（图块数） */
    @Property({ type: 'integer', label: 'Height (Tiles)', min: 1 })
    public get height(): number {
        return this._height;
    }

    public set height(value: number) {
        if (value !== this._height && value > 0) {
            this.resize(this._width, value);
        }
    }

    /** Single tile width in pixels | 单个图块宽度（像素） */
    @Serialize()
    @Property({ type: 'integer', label: 'Tile Width', min: 1 })
    public tileWidth: number = 32;

    /** Single tile height in pixels | 单个图块高度（像素） */
    @Serialize()
    @Property({ type: 'integer', label: 'Tile Height', min: 1 })
    public tileHeight: number = 32;

    /** Component visibility | 组件可见性 */
    @Serialize()
    @Property({ type: 'boolean', label: 'Visible' })
    public visible: boolean = true;

    /** Rendering sort order (deprecated, use sortingLayer + orderInLayer) | 渲染排序顺序（已弃用，使用 sortingLayer + orderInLayer） */
    @Serialize()
    @Property({ type: 'integer', label: 'Sorting Order' })
    public sortingOrder: number = 0;

    /**
     * 排序层
     * Sorting layer
     *
     * 决定渲染的大类顺序，如 Background, Default, UI, Overlay 等。
     * Determines the major render order category.
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Sorting Layer',
        options: ['Background', 'Default', 'Foreground', 'WorldOverlay', 'UI', 'ScreenOverlay', 'Modal']
    })
    public sortingLayer: string = SortingLayers.Default;

    /**
     * 层内顺序（越高越在上面）
     * Order within layer (higher = rendered on top)
     *
     * 同一排序层内的细分顺序。
     * Fine-grained order within the same sorting layer.
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Order in Layer' })
    public orderInLayer: number = 0;

    /** Tint color in hex format | 着色颜色（十六进制格式） */
    @Serialize()
    @Property({ type: 'color', label: 'Color' })
    public color: string = '#ffffff';

    /** Opacity value (0-1) | 不透明度（0-1） */
    @Serialize()
    @Property({ type: 'number', label: 'Alpha', min: 0, max: 1, step: 0.01 })
    public alpha: number = 1;

    /** Flag indicating render data needs update | 标记渲染数据需要更新 */
    public renderDirty: boolean = true;

    // ===== 多Tileset =====

    @Serialize()
    private _tilesets: ITilesetRef[] = [];

    private _tilesetsData: Map<number, ITilesetData> = new Map();

    // ===== 多图层 =====

    @Serialize()
    private _layers: ITilemapLayerData[] = [];

    private _layersData: Map<string, Uint32Array> = new Map();

    @Serialize()
    private _activeLayerIndex: number = 0;

    // ===== 碰撞数据 =====

    @Serialize()
    private _collisionDataArray: number[] = [];

    private _collisionData: Uint32Array = new Uint32Array(0);

    // ===== Getters =====

    /** All tileset references | 所有图块集引用 */
    get tilesets(): readonly ITilesetRef[] {
        return this._tilesets;
    }

    /** All layer data | 所有图层数据 */
    get layers(): readonly ITilemapLayerData[] {
        return this._layers;
    }

    /** Current active layer index | 当前活动图层索引 */
    get activeLayerIndex(): number {
        return this._activeLayerIndex;
    }

    set activeLayerIndex(value: number) {
        if (value >= 0 && value < this._layers.length) {
            this._activeLayerIndex = value;
        }
    }

    /** Current active layer data | 当前活动图层数据 */
    get activeLayer(): ITilemapLayerData | undefined {
        return this._layers[this._activeLayerIndex];
    }

    /** Total map width in pixels | 地图总宽度（像素） */
    get pixelWidth(): number {
        return this._width * this.tileWidth;
    }

    /** Total map height in pixels | 地图总高度（像素） */
    get pixelHeight(): number {
        return this._height * this.tileHeight;
    }

    /** Raw collision data array | 原始碰撞数据数组 */
    get collisionData(): Uint32Array {
        return this._collisionData;
    }

    // ===== Initialization | 初始化 =====

    /**
     * Initialize an empty tilemap with default layer
     * 初始化一个带有默认图层的空瓦片地图
     * @param width Map width in tiles | 地图宽度（图块数）
     * @param height Map height in tiles | 地图高度（图块数）
     */
    initializeEmpty(width: number, height: number): void {
        this._width = width;
        this._height = height;

        const defaultLayer: ITilemapLayerData = {
            id: 'default',
            name: 'Layer 0',
            visible: true,
            opacity: 1,
            data: new Array(width * height).fill(0)
        };
        this._layers = [defaultLayer];
        this._layersData.set('default', new Uint32Array(width * height));
        this._activeLayerIndex = 0;

        this.renderDirty = true;
    }

    /**
     * Apply tilemap data from external source
     * 从外部数据源应用瓦片地图数据
     * @param data Tilemap data to apply | 要应用的瓦片地图数据
     */
    applyTilemapData(data: ITilemapData): void {
        this._width = data.width;
        this._height = data.height;
        this.tileWidth = data.tileWidth;
        this.tileHeight = data.tileHeight;

        // 加载Tilesets
        this._tilesets = data.tilesets.map((ts) => ({ ...ts }));
        this._tilesetsData.clear();

        // 加载图层
        this._layers = data.layers.map((layer) => ({
            ...layer,
            data: [...layer.data]
        }));
        this._layersData.clear();
        for (const layer of this._layers) {
            this._layersData.set(layer.id, new Uint32Array(layer.data));
        }

        // 加载碰撞数据
        if (data.collisionData) {
            this._collisionData = new Uint32Array(data.collisionData);
            this._collisionDataArray = [...data.collisionData];
        } else {
            this._collisionData = new Uint32Array(0);
            this._collisionDataArray = [];
        }

        this.renderDirty = true;
    }

    // ===== Tileset Methods | 图块集方法 =====

    /**
     * Add a new tileset reference
     * 添加新的图块集引用
     * @param source Tileset image source path | 图块集图片源路径
     * @param firstGid Optional first global tile ID | 可选的第一个全局图块ID
     * @returns Index of the added tileset | 添加的图块集索引
     */
    addTileset(source: string, firstGid?: number): number {
        const gid = firstGid ?? this.calculateNextFirstGid();
        this._tilesets.push({ source, firstGid: gid });
        this.renderDirty = true;
        return this._tilesets.length - 1;
    }

    /**
     * Remove a tileset by index
     * 按索引移除图块集
     * @param index Tileset index to remove | 要移除的图块集索引
     */
    removeTileset(index: number): void {
        if (index >= 0 && index < this._tilesets.length) {
            this._tilesets.splice(index, 1);
            this._tilesetsData.delete(index);
            this.renderDirty = true;
        }
    }

    /**
     * Set tileset data for a specific index
     * 设置指定索引的图块集数据
     * @param index Tileset index | 图块集索引
     * @param data Tileset data to set | 要设置的图块集数据
     */
    setTilesetData(index: number, data: ITilesetData): void {
        if (index >= 0 && index < this._tilesets.length) {
            this._tilesets[index].data = data;
            this._tilesetsData.set(index, data);
            this.renderDirty = true;
        }
    }

    /**
     * Get tileset data by index
     * 按索引获取图块集数据
     * @param index Tileset index | 图块集索引
     * @returns Tileset data or undefined | 图块集数据或undefined
     */
    getTilesetData(index: number): ITilesetData | undefined {
        return this._tilesetsData.get(index) || this._tilesets[index]?.data;
    }

    /**
     * Find tileset for a global tile ID
     * 根据全局图块ID查找图块集
     * @param gid Global tile ID | 全局图块ID
     * @returns Tileset info with local ID, or null if not found | 包含本地ID的图块集信息，未找到返回null
     */
    getTilesetForGid(gid: number): { tileset: ITilesetRef; localId: number; index: number } | null {
        if (gid <= 0) return null;

        for (let i = this._tilesets.length - 1; i >= 0; i--) {
            const tileset = this._tilesets[i];
            if (gid >= tileset.firstGid) {
                return {
                    tileset,
                    localId: gid - tileset.firstGid + 1,
                    index: i
                };
            }
        }
        return null;
    }

    private calculateNextFirstGid(): number {
        if (this._tilesets.length === 0) return 1;

        let maxGid = 1;
        for (const tileset of this._tilesets) {
            const tileCount = tileset.data?.tileCount || 256;
            const nextGid = tileset.firstGid + tileCount;
            if (nextGid > maxGid) maxGid = nextGid;
        }
        return maxGid;
    }

    // ===== Layer Methods | 图层方法 =====

    /**
     * Add a new layer to the tilemap
     * 向瓦片地图添加新图层
     * @param name Optional layer name | 可选的图层名称
     * @param index Optional insertion index | 可选的插入索引
     * @returns The created layer data | 创建的图层数据
     */
    addLayer(name?: string, index?: number): ITilemapLayerData {
        const id = `layer_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const layerName = name || `Layer ${this._layers.length}`;
        const data = new Array(this._width * this._height).fill(0);

        const layer: ITilemapLayerData = {
            id,
            name: layerName,
            visible: true,
            opacity: 1,
            data
        };

        if (index !== undefined && index >= 0 && index <= this._layers.length) {
            this._layers.splice(index, 0, layer);
        } else {
            this._layers.push(layer);
        }

        this._layersData.set(id, new Uint32Array(data));
        this.renderDirty = true;
        return layer;
    }

    /**
     * Duplicate a layer
     * 复制图层
     * @param index Layer index to duplicate | 要复制的图层索引
     * @returns The duplicated layer data, or null if index is invalid | 复制的图层数据，如果索引无效则返回 null
     */
    duplicateLayer(index: number): ITilemapLayerData | null {
        if (index < 0 || index >= this._layers.length) {
            return null;
        }

        const sourceLayer = this._layers[index];
        const sourceData = this._layersData.get(sourceLayer.id);
        if (!sourceData) {
            return null;
        }

        const id = `layer_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const newLayer: ITilemapLayerData = {
            id,
            name: `${sourceLayer.name} (副本)`,
            visible: sourceLayer.visible,
            opacity: sourceLayer.opacity,
            data: Array.from(sourceData)
        };

        // Insert after the source layer
        this._layers.splice(index + 1, 0, newLayer);
        this._layersData.set(id, new Uint32Array(sourceData));
        this.renderDirty = true;

        return newLayer;
    }

    /**
     * Remove a layer by index (cannot remove last layer)
     * 按索引移除图层（不能移除最后一个图层）
     * @param index Layer index to remove | 要移除的图层索引
     */
    removeLayer(index: number): void {
        if (index >= 0 && index < this._layers.length && this._layers.length > 1) {
            const layer = this._layers[index];
            this._layers.splice(index, 1);
            this._layersData.delete(layer.id);

            if (this._activeLayerIndex >= this._layers.length) {
                this._activeLayerIndex = this._layers.length - 1;
            }

            this.renderDirty = true;
        }
    }

    /**
     * Move a layer from one position to another
     * 将图层从一个位置移动到另一个位置
     * @param fromIndex Source index | 源索引
     * @param toIndex Target index | 目标索引
     */
    moveLayer(fromIndex: number, toIndex: number): void {
        if (
            fromIndex >= 0 &&
            fromIndex < this._layers.length &&
            toIndex >= 0 &&
            toIndex < this._layers.length &&
            fromIndex !== toIndex
        ) {
            const [layer] = this._layers.splice(fromIndex, 1);
            this._layers.splice(toIndex, 0, layer);
            this.renderDirty = true;
        }
    }

    /**
     * Get layer data by index
     * 按索引获取图层数据
     */
    getLayer(index: number): ITilemapLayerData | undefined {
        return this._layers[index];
    }

    /**
     * Get layer data by ID
     * 按ID获取图层数据
     */
    getLayerById(id: string): ITilemapLayerData | undefined {
        return this._layers.find((l) => l.id === id);
    }

    /**
     * Set layer visibility
     * 设置图层可见性
     */
    setLayerVisible(index: number, visible: boolean): void {
        if (index >= 0 && index < this._layers.length) {
            this._layers[index].visible = visible;
            this.renderDirty = true;
        }
    }

    /**
     * Set layer opacity
     * 设置图层不透明度
     */
    setLayerOpacity(index: number, opacity: number): void {
        if (index >= 0 && index < this._layers.length) {
            this._layers[index].opacity = Math.max(0, Math.min(1, opacity));
            this.renderDirty = true;
        }
    }

    /**
     * Rename a layer
     * 重命名图层
     */
    renameLayer(index: number, name: string): void {
        if (index >= 0 && index < this._layers.length) {
            this._layers[index].name = name;
        }
    }

    /**
     * Set layer color (tint)
     * 设置图层颜色（着色）
     */
    setLayerColor(index: number, color: string): void {
        if (index >= 0 && index < this._layers.length) {
            this._layers[index].color = color;
            this.renderDirty = true;
        }
    }

    /**
     * Get layer color
     * 获取图层颜色
     */
    getLayerColor(index: number): string {
        if (index >= 0 && index < this._layers.length) {
            return this._layers[index].color ?? '#ffffff';
        }
        return '#ffffff';
    }

    /**
     * Set layer hidden in game
     * 设置图层在游戏中隐藏
     */
    setLayerHiddenInGame(index: number, hidden: boolean): void {
        if (index >= 0 && index < this._layers.length) {
            this._layers[index].hiddenInGame = hidden;
        }
    }

    /**
     * Get layer hidden in game
     * 获取图层在游戏中是否隐藏
     */
    getLayerHiddenInGame(index: number): boolean {
        if (index >= 0 && index < this._layers.length) {
            return this._layers[index].hiddenInGame ?? false;
        }
        return false;
    }

    /**
     * Set layer material path
     * 设置图层材质路径
     * @param index Layer index | 图层索引
     * @param materialPath Material asset path (.mat file) | 材质资源路径（.mat 文件）
     */
    setLayerMaterial(index: number, materialPath: string): void {
        if (index >= 0 && index < this._layers.length) {
            this._layers[index].materialPath = materialPath;
            this._layers[index].materialId = undefined;
            this.renderDirty = true;
        }
    }

    /**
     * Get layer material path
     * 获取图层材质路径
     * @param index Layer index | 图层索引
     * @returns Material path or undefined | 材质路径或 undefined
     */
    getLayerMaterial(index: number): string | undefined {
        return this._layers[index]?.materialPath;
    }

    /**
     * Set layer material ID (runtime)
     * 设置图层材质ID（运行时）
     * @param index Layer index | 图层索引
     * @param materialId Runtime material ID | 运行时材质ID
     */
    setLayerMaterialId(index: number, materialId: number): void {
        if (index >= 0 && index < this._layers.length) {
            this._layers[index].materialId = materialId;
            this.renderDirty = true;
        }
    }

    /**
     * Get layer material ID
     * 获取图层材质ID
     * @param index Layer index | 图层索引
     * @returns Material ID or 0 (default) | 材质ID 或 0（默认）
     */
    getLayerMaterialId(index: number): number {
        return this._layers[index]?.materialId ?? 0;
    }

    // ===== Tile Operations | 瓦片操作 =====

    /**
     * Get tile index at position
     * 获取指定位置的图块索引
     * @param layerIndex Layer index | 图层索引
     * @param col Column (X) | 列（X）
     * @param row Row (Y) | 行（Y）
     * @returns Tile index (0 = empty) | 图块索引（0表示空）
     */
    getTile(layerIndex: number, col: number, row: number): number {
        if (col < 0 || col >= this._width || row < 0 || row >= this._height) {
            return 0;
        }
        const layer = this._layers[layerIndex];
        if (!layer) return 0;

        const layerData = this._layersData.get(layer.id);
        if (layerData) {
            return layerData[row * this._width + col];
        }
        return layer.data[row * this._width + col] || 0;
    }

    /**
     * Set tile index at position
     * 设置指定位置的图块索引
     * @param layerIndex Layer index | 图层索引
     * @param col Column (X) | 列（X）
     * @param row Row (Y) | 行（Y）
     * @param tileIndex Tile index to set (0 = clear) | 要设置的图块索引（0表示清除）
     */
    setTile(layerIndex: number, col: number, row: number, tileIndex: number): void {
        if (col < 0 || col >= this._width || row < 0 || row >= this._height) {
            return;
        }
        const layer = this._layers[layerIndex];
        if (!layer) return;

        const index = row * this._width + col;
        layer.data[index] = tileIndex;

        let layerData = this._layersData.get(layer.id);
        if (!layerData) {
            layerData = new Uint32Array(layer.data);
            this._layersData.set(layer.id, layerData);
        }
        layerData[index] = tileIndex;

        this.renderDirty = true;
    }

    /**
     * Get raw tile data array for a layer
     * 获取图层的原始图块数据数组
     * @param layerIndex Layer index | 图层索引
     * @returns Uint32Array of tile indices | 图块索引的Uint32Array
     */
    getLayerData(layerIndex: number): Uint32Array | undefined {
        const layer = this._layers[layerIndex];
        if (!layer) return undefined;
        return this._layersData.get(layer.id);
    }

    /**
     * Set raw tile data array for a layer
     * 设置图层的原始图块数据数组
     * @param layerIndex Layer index | 图层索引
     * @param data Uint32Array of tile indices | 图块索引的Uint32Array
     */
    setLayerData(layerIndex: number, data: Uint32Array): void {
        const layer = this._layers[layerIndex];
        if (!layer) return;

        // Copy data to both the layer object and the internal map
        layer.data = Array.from(data);
        this._layersData.set(layer.id, new Uint32Array(data));
        this.renderDirty = true;
    }

    /**
     * Get merged tile data from all visible layers
     * 获取所有可见图层合并后的图块数据
     * @returns Merged tile data array | 合并的图块数据数组
     */
    getMergedTileData(): Uint32Array {
        const merged = new Uint32Array(this._width * this._height);

        for (const layer of this._layers) {
            if (!layer.visible) continue;

            const layerData = this._layersData.get(layer.id);
            if (!layerData) continue;

            for (let i = 0; i < merged.length; i++) {
                if (layerData[i] > 0) {
                    merged[i] = layerData[i];
                }
            }
        }

        return merged;
    }

    // ===== Collision | 碰撞 =====

    /**
     * Check if tile has collision
     * 检查图块是否有碰撞
     * @param col Column (X) | 列（X）
     * @param row Row (Y) | 行（Y）
     * @returns True if has collision | 如果有碰撞返回true
     */
    hasCollision(col: number, row: number): boolean {
        if (col < 0 || col >= this._width || row < 0 || row >= this._height) {
            return true;
        }
        if (this._collisionData.length === 0) {
            return false;
        }
        return this._collisionData[row * this._width + col] > 0;
    }

    /**
     * Get collision type at tile position
     * 获取图块位置的碰撞类型
     */
    getCollisionType(col: number, row: number): number {
        if (col < 0 || col >= this._width || row < 0 || row >= this._height) {
            return 0;
        }
        if (this._collisionData.length === 0) {
            return 0;
        }
        return this._collisionData[row * this._width + col];
    }

    /**
     * Set collision type at tile position
     * 设置图块位置的碰撞类型
     * @param col Column (X) | 列（X）
     * @param row Row (Y) | 行（Y）
     * @param collisionType Collision type (0 = none) | 碰撞类型（0表示无）
     */
    setCollision(col: number, row: number, collisionType: number): void {
        if (col < 0 || col >= this._width || row < 0 || row >= this._height) {
            return;
        }
        if (this._collisionData.length === 0) {
            this._collisionData = new Uint32Array(this._width * this._height);
            this._collisionDataArray = new Array(this._width * this._height).fill(0);
        }
        const index = row * this._width + col;
        this._collisionData[index] = collisionType;
        this._collisionDataArray[index] = collisionType;
    }

    /**
     * Check collision at world coordinates
     * 检查世界坐标处的碰撞
     */
    hasCollisionAt(worldX: number, worldY: number): boolean {
        const [col, row] = this.worldToTile(worldX, worldY);
        return this.hasCollision(col, row);
    }

    /**
     * Get all collision tiles within bounds
     * 获取边界内的所有碰撞图块
     * @returns Array of [col, row, type] | [列, 行, 类型]数组
     */
    getCollisionTilesInBounds(
        left: number,
        bottom: number,
        right: number,
        top: number
    ): Array<[number, number, number]> {
        const result: Array<[number, number, number]> = [];

        if (this._collisionData.length === 0) {
            return result;
        }

        const startCol = Math.max(0, Math.floor(left / this.tileWidth));
        const endCol = Math.min(this._width, Math.ceil(right / this.tileWidth));
        const startRow = Math.max(0, Math.floor(bottom / this.tileHeight));
        const endRow = Math.min(this._height, Math.ceil(top / this.tileHeight));

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const type = this._collisionData[row * this._width + col];
                if (type > 0) {
                    result.push([col, row, type]);
                }
            }
        }

        return result;
    }

    /**
     * Generate collision rectangles for physics
     * 为物理系统生成碰撞矩形
     * @returns Array of collision rectangles | 碰撞矩形数组
     */
    generateCollisionRects(): Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        type: number;
    }> {
        const rects: Array<{
            x: number;
            y: number;
            width: number;
            height: number;
            type: number;
        }> = [];

        if (this._collisionData.length === 0) {
            return rects;
        }

        for (let row = 0; row < this._height; row++) {
            for (let col = 0; col < this._width; col++) {
                const type = this._collisionData[row * this._width + col];
                if (type > 0) {
                    rects.push({
                        x: col * this.tileWidth,
                        y: row * this.tileHeight,
                        width: this.tileWidth,
                        height: this.tileHeight,
                        type
                    });
                }
            }
        }

        return rects;
    }

    // ===== Coordinate Conversion | 坐标转换 =====

    /**
     * Convert world coordinates to tile coordinates
     * 将世界坐标转换为图块坐标
     * @returns [col, row] | [列, 行]
     */
    worldToTile(worldX: number, worldY: number): [number, number] {
        const col = Math.floor(worldX / this.tileWidth);
        const row = Math.floor(worldY / this.tileHeight);
        return [col, row];
    }

    /**
     * Convert tile coordinates to world coordinates (center of tile)
     * 将图块坐标转换为世界坐标（图块中心）
     * @returns [worldX, worldY] | [世界X, 世界Y]
     */
    tileToWorld(col: number, row: number): [number, number] {
        const worldX = col * this.tileWidth + this.tileWidth / 2;
        const worldY = row * this.tileHeight + this.tileHeight / 2;
        return [worldX, worldY];
    }

    // ===== UV Calculation | UV计算 =====

    /**
     * Get UV coordinates for a tile
     * 获取 tile 的 UV 坐标
     *
     * 使用 UVHelper 计算 OpenGL 纹理坐标。
     * Uses UVHelper to calculate OpenGL texture coordinates.
     *
     * @see UVHelper.calculateTileUV for coordinate system documentation
     * @param tilesetIndex Tileset index | Tileset 索引
     * @param localTileId Local tile ID (1-based) | 本地 tile ID（从1开始）
     * @returns [u0, v0, u1, v1] OpenGL UV coordinates, or null if invalid
     */
    getTileUV(tilesetIndex: number, localTileId: number): [number, number, number, number] | null {
        if (localTileId <= 0) return null;

        const tilesetData = this.getTilesetData(tilesetIndex);
        if (!tilesetData) {
            console.warn('[TilemapComponent] getTileUV: No tileset data for index', tilesetIndex);
            return null;
        }

        // Use UVHelper for coordinate calculation
        // 使用 UVHelper 计算坐标
        return UVHelper.calculateTileUV(localTileId - 1, {
            columns: tilesetData.columns,
            tileWidth: tilesetData.tileWidth,
            tileHeight: tilesetData.tileHeight,
            imageWidth: tilesetData.imageWidth,
            imageHeight: tilesetData.imageHeight,
            margin: tilesetData.margin,
            spacing: tilesetData.spacing
        });
    }

    // ===== Resize | 大小调整 =====

    /**
     * Calculate offset based on anchor point
     * 根据锚点计算偏移量
     */
    private calculateAnchorOffset(
        oldSize: number,
        newSize: number,
        anchor: 'start' | 'center' | 'end'
    ): number {
        const delta = newSize - oldSize;
        switch (anchor) {
            case 'start': return 0;
            case 'center': return Math.floor(delta / 2);
            case 'end': return delta;
        }
    }

    /**
     * Resize the tilemap, preserving existing data at the specified anchor position
     * 调整瓦片地图大小，在指定锚点位置保留现有数据
     * @param newWidth New width in tiles | 新宽度（图块数）
     * @param newHeight New height in tiles | 新高度（图块数）
     * @param anchor Anchor point for preserving data (default: 'bottom-left' for Y-up coordinate system) | 保留数据的锚点（默认：'bottom-left'，适用于Y轴向上的坐标系）
     */
    resize(newWidth: number, newHeight: number, anchor: ResizeAnchor = 'bottom-left'): void {
        if (newWidth === this._width && newHeight === this._height) {
            return;
        }

        // Parse anchor to get X and Y alignment
        // 解析锚点获取X和Y方向的对齐方式
        let xAnchor: 'start' | 'center' | 'end';
        let yAnchor: 'start' | 'center' | 'end';

        if (anchor.includes('left')) xAnchor = 'start';
        else if (anchor.includes('right')) xAnchor = 'end';
        else xAnchor = 'center';

        if (anchor.includes('bottom')) yAnchor = 'end';
        else if (anchor.includes('top')) yAnchor = 'start';
        else yAnchor = 'center';

        // Calculate offsets for placing old data in new array
        // 计算将旧数据放入新数组的偏移量
        const offsetX = this.calculateAnchorOffset(this._width, newWidth, xAnchor);
        const offsetY = this.calculateAnchorOffset(this._height, newHeight, yAnchor);

        // 调整所有图层
        for (const layer of this._layers) {
            const oldLayerData = this._layersData.get(layer.id);
            const newLayerData = new Uint32Array(newWidth * newHeight);
            const newDataArray = new Array(newWidth * newHeight).fill(0);

            if (oldLayerData) {
                for (let y = 0; y < this._height; y++) {
                    for (let x = 0; x < this._width; x++) {
                        const newX = x + offsetX;
                        const newY = y + offsetY;

                        // Check bounds
                        if (newX >= 0 && newX < newWidth && newY >= 0 && newY < newHeight) {
                            const value = oldLayerData[y * this._width + x];
                            newLayerData[newY * newWidth + newX] = value;
                            newDataArray[newY * newWidth + newX] = value;
                        }
                    }
                }
            }

            this._layersData.set(layer.id, newLayerData);
            layer.data = newDataArray;
        }

        // 调整碰撞数据
        if (this._collisionData.length > 0) {
            const newCollisionData = new Uint32Array(newWidth * newHeight);
            const newCollisionArray = new Array(newWidth * newHeight).fill(0);

            for (let y = 0; y < this._height; y++) {
                for (let x = 0; x < this._width; x++) {
                    const newX = x + offsetX;
                    const newY = y + offsetY;

                    if (newX >= 0 && newX < newWidth && newY >= 0 && newY < newHeight) {
                        const value = this._collisionData[y * this._width + x];
                        newCollisionData[newY * newWidth + newX] = value;
                        newCollisionArray[newY * newWidth + newX] = value;
                    }
                }
            }

            this._collisionData = newCollisionData;
            this._collisionDataArray = newCollisionArray;
        }

        this._width = newWidth;
        this._height = newHeight;
        this.renderDirty = true;
    }

    // ===== Serialization | 序列化 =====

    /**
     * Called after deserialization to restore runtime data
     * 反序列化后调用以恢复运行时数据
     */
    override onDeserialized(): void {
        // 恢复图层运行时数据
        for (const layer of this._layers) {
            if (layer.data && layer.data.length > 0) {
                this._layersData.set(layer.id, new Uint32Array(layer.data));
            }
        }

        // 恢复Tileset缓存数据
        for (let i = 0; i < this._tilesets.length; i++) {
            const tileset = this._tilesets[i];
            if (tileset.data) {
                this._tilesetsData.set(i, tileset.data);
            }
        }

        // 恢复碰撞数据
        if (this._collisionDataArray.length > 0) {
            this._collisionData = new Uint32Array(this._collisionDataArray);
        }

        this.renderDirty = true;
    }


    /**
     * Cleanup when component is destroyed
     * 组件销毁时清理资源
     */
    onDestroy(): void {
        this._tilesets = [];
        this._tilesetsData.clear();
        this._layers = [];
        this._layersData.clear();
        this._collisionData = new Uint32Array(0);
        this._collisionDataArray = [];
    }

    /**
     * Export tilemap to data format
     * 导出瓦片地图为数据格式
     * @returns Tilemap data object | 瓦片地图数据对象
     */
    exportToData(): ITilemapData {
        return {
            name: 'Tilemap',
            version: 2,
            width: this._width,
            height: this._height,
            tileWidth: this.tileWidth,
            tileHeight: this.tileHeight,
            tilesets: this._tilesets.map((ts) => ({ ...ts })),
            layers: this._layers.map((layer) => ({
                ...layer,
                data: [...layer.data]
            })),
            collisionData: this._collisionData.length > 0 ? Array.from(this._collisionData) : undefined
        };
    }

    // ===== IResourceComponent 实现 =====

    /**
     * 获取此组件需要的所有资源引用
     * Get all resource references needed by this component
     */
    getResourceReferences(): ResourceReference[] {
        const refs: ResourceReference[] = [];

        // 收集所有 tileset 纹理引用
        // Collect all tileset texture references
        for (const tileset of this._tilesets) {
            if (tileset.source) {
                refs.push({
                    path: tileset.source,
                    type: 'texture',
                    runtimeId: tileset.textureId
                });
            }
        }

        // 收集所有图层材质引用
        // Collect all layer material references
        for (const layer of this._layers) {
            if (layer.materialPath) {
                refs.push({
                    path: layer.materialPath,
                    type: 'data',
                    runtimeId: layer.materialId
                });
            }
        }

        return refs;
    }

    /**
     * 设置已加载资源的运行时 ID
     * Set runtime IDs for loaded resources
     */
    setResourceIds(pathToId: Map<string, number>): void {
        // 为每个 tileset 设置纹理 ID
        // Set texture ID for each tileset
        for (const tileset of this._tilesets) {
            if (tileset.source) {
                const textureId = pathToId.get(tileset.source);
                if (textureId !== undefined) {
                    tileset.textureId = textureId;
                }
            }
        }

        // 为每个图层设置材质 ID
        // Set material ID for each layer
        for (const layer of this._layers) {
            if (layer.materialPath) {
                const materialId = pathToId.get(layer.materialPath);
                if (materialId !== undefined) {
                    layer.materialId = materialId;
                }
            }
        }

        // 标记渲染数据为脏，需要重新构建
        // Mark render data as dirty, needs rebuild
        this.renderDirty = true;
    }
}
