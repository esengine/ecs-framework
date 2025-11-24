import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';
import type { AssetReference } from '@esengine/asset-system';

/**
 * Tileset data interface
 * 瓦片集数据接口
 */
export interface ITilesetData {
    /** 名称 */
    name: string;
    /** 版本 */
    version: number;
    /** 纹理图像资源GUID或路径 */
    image: string;
    /** 图像宽度（像素） */
    imageWidth: number;
    /** 图像高度（像素） */
    imageHeight: number;
    /** 瓦片宽度（像素） */
    tileWidth: number;
    /** 瓦片高度（像素） */
    tileHeight: number;
    /** 瓦片总数 */
    tileCount: number;
    /** 列数 */
    columns: number;
    /** 行数 */
    rows: number;
    /** 边距（像素） */
    margin?: number;
    /** 间距（像素） */
    spacing?: number;
    /** 每个瓦片的元数据 */
    tiles?: Array<{
        id: number;
        type?: string;
        properties?: Record<string, unknown>;
    }>;
}

/**
 * Tilemap data interface
 * 瓦片地图数据接口
 */
export interface ITilemapData {
    /** 名称 */
    name: string;
    /** 版本 */
    version: number;
    /** 宽度（瓦片数） */
    width: number;
    /** 高度（瓦片数） */
    height: number;
    /** 瓦片宽度（像素） */
    tileWidth: number;
    /** 瓦片高度（像素） */
    tileHeight: number;
    /** 瓦片集资源GUID */
    tileset: string;
    /** 瓦片数据（行主序，0表示空） */
    data: number[];
    /** 图层（可选） */
    layers?: Array<{
        name: string;
        visible: boolean;
        opacity: number;
        data?: number[];
    }>;
    /** 碰撞数据（可选） */
    collisionData?: number[];
    /** 自定义属性 */
    properties?: Record<string, unknown>;
}

/**
 * 瓦片地图组件 - 管理基于瓦片的2D地图渲染
 * Tilemap component - manages tile-based 2D map rendering
 */
@ECSComponent('Tilemap')
@Serializable({ version: 1, typeId: 'Tilemap' })
export class TilemapComponent extends Component {
    /**
     * 瓦片地图资源GUID
     * Tilemap asset GUID
     */
    @Serialize()
    @Property({ type: 'asset', label: 'Tilemap', fileExtension: '.tilemap.json' })
    public tilemapAssetGuid: string = '';

    /**
     * 瓦片集资源GUID
     * Tileset asset GUID
     */
    @Serialize()
    @Property({ type: 'asset', label: 'Tileset', fileExtension: '.tileset.json' })
    public tilesetAssetGuid: string = '';

    /**
     * 瓦片集图片路径（直接使用PNG）
     * Tileset image path (direct PNG)
     */
    @Serialize()
    @Property({ type: 'asset', label: 'Tileset Image', fileExtension: '.png' })
    public tilesetImage: string = '';

    /**
     * 地图宽度（瓦片数）- 内部存储
     */
    @Serialize()
    private _width: number = 10;

    /**
     * 地图高度（瓦片数）- 内部存储
     */
    @Serialize()
    private _height: number = 10;

    /**
     * 地图宽度（瓦片数）
     * Map width in tiles
     */
    @Property({ type: 'integer', label: 'Width (Tiles)', min: 1 })
    public get width(): number {
        return this._width;
    }

    public set width(value: number) {
        if (value !== this._width && value > 0) {
            this.resize(value, this._height);
        }
    }

    /**
     * 地图高度（瓦片数）
     * Map height in tiles
     */
    @Property({ type: 'integer', label: 'Height (Tiles)', min: 1 })
    public get height(): number {
        return this._height;
    }

    public set height(value: number) {
        if (value !== this._height && value > 0) {
            this.resize(this._width, value);
        }
    }

    /**
     * 瓦片宽度（像素）
     * Tile width in pixels
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Tile Width', min: 1 })
    public tileWidth: number = 32;

    /**
     * 瓦片高度（像素）
     * Tile height in pixels
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Tile Height', min: 1 })
    public tileHeight: number = 32;

    /**
     * 是否可见
     * Whether tilemap is visible
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Visible' })
    public visible: boolean = true;

    /**
     * 渲染层级/顺序（越高越在上面）
     * Render layer/order (higher = rendered on top)
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Sorting Order' })
    public sortingOrder: number = 0;

    /**
     * 颜色着色（十六进制）
     * Color tint (hex string)
     */
    @Serialize()
    @Property({ type: 'color', label: 'Color' })
    public color: string = '#ffffff';

    /**
     * 透明度 (0-1)
     * Alpha (0-1)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Alpha', min: 0, max: 1, step: 0.01 })
    public alpha: number = 1;

    // ===== 运行时数据（不序列化）=====

    /**
     * 纹理ID（运行时使用）
     * Texture ID for runtime rendering
     */
    public textureId: number = 0;

    /**
     * 瓦片数据数组（序列化为普通数组）
     * Tile data array (serialized as regular array)
     */
    @Serialize()
    private _tileDataArray: number[] = [];

    /**
     * Tileset 图片宽度（序列化用于恢复 _tilesetData）
     * Tileset image width (serialized for restoring _tilesetData)
     */
    @Serialize()
    private _tilesetImageWidth: number = 0;

    /**
     * Tileset 图片高度（序列化用于恢复 _tilesetData）
     * Tileset image height (serialized for restoring _tilesetData)
     */
    @Serialize()
    private _tilesetImageHeight: number = 0;

    /**
     * 瓦片数据数组（运行时使用 Uint32Array 提高性能）
     * Tile data array (runtime uses Uint32Array for performance)
     */
    private _tileData: Uint32Array = new Uint32Array(0);

    /**
     * Tilemap资产引用
     * Tilemap asset reference
     */
    private _tilemapReference?: AssetReference<ITilemapData>;

    /**
     * Tileset资产引用
     * Tileset asset reference
     */
    private _tilesetReference?: AssetReference<ITilesetData>;

    /**
     * 缓存的tileset数据
     * Cached tileset data
     */
    private _tilesetData?: ITilesetData;

    /**
     * 渲染是否需要更新
     * Whether rendering needs update
     */
    public renderDirty: boolean = true;

    /**
     * 碰撞数据数组（运行时）
     * Collision data array (runtime)
     * 0 = no collision, >0 = collision type
     */
    private _collisionData: Uint32Array = new Uint32Array(0);

    /**
     * 获取瓦片数据
     * Get tile data
     */
    get tileData(): Uint32Array {
        return this._tileData;
    }

    /**
     * 获取tileset数据
     * Get tileset data
     */
    get tilesetData(): ITilesetData | undefined {
        return this._tilesetData;
    }

    /**
     * 获取地图像素宽度
     * Get map width in pixels
     */
    get pixelWidth(): number {
        return this.width * this.tileWidth;
    }

    /**
     * 获取地图像素高度
     * Get map height in pixels
     */
    get pixelHeight(): number {
        return this.height * this.tileHeight;
    }

    /**
     * 设置瓦片地图资产引用
     * Set tilemap asset reference
     */
    setTilemapReference(reference: AssetReference<ITilemapData>): void {
        if (this._tilemapReference) {
            this._tilemapReference.release();
        }
        this._tilemapReference = reference;
        if (reference) {
            this.tilemapAssetGuid = reference.guid;
        }
    }

    /**
     * 设置瓦片集资产引用
     * Set tileset asset reference
     */
    setTilesetReference(reference: AssetReference<ITilesetData>): void {
        if (this._tilesetReference) {
            this._tilesetReference.release();
        }
        this._tilesetReference = reference;
        if (reference) {
            this.tilesetAssetGuid = reference.guid;
        }
    }

    /**
     * 直接设置瓦片集信息（用于直接使用PNG图片时）
     * Set tileset info directly (for using PNG images directly)
     */
    setTilesetInfo(
        imageWidth: number,
        imageHeight: number,
        tileWidth: number,
        tileHeight: number,
        columns: number,
        rows: number
    ): void {
        this._tilesetData = {
            name: 'direct-tileset',
            version: 1,
            image: this.tilesetImage,
            imageWidth,
            imageHeight,
            tileWidth,
            tileHeight,
            tileCount: columns * rows,
            columns,
            rows
        };
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        // 保存图片尺寸用于序列化恢复
        this._tilesetImageWidth = imageWidth;
        this._tilesetImageHeight = imageHeight;
        this.renderDirty = true;
    }

    /**
     * 异步加载瓦片地图
     * Load tilemap asynchronously
     */
    async loadTilemapAsync(): Promise<void> {
        if (this._tilemapReference) {
            try {
                const tilemapData = await this._tilemapReference.loadAsync();
                if (tilemapData) {
                    this.applyTilemapData(tilemapData);
                }
            } catch (error) {
                console.error('Failed to load tilemap:', error);
            }
        }
    }

    /**
     * 异步加载瓦片集
     * Load tileset asynchronously
     */
    async loadTilesetAsync(): Promise<void> {
        if (this._tilesetReference) {
            try {
                const tilesetData = await this._tilesetReference.loadAsync();
                if (tilesetData) {
                    this._tilesetData = tilesetData;
                    this.tileWidth = tilesetData.tileWidth;
                    this.tileHeight = tilesetData.tileHeight;
                    this.renderDirty = true;
                }
            } catch (error) {
                console.error('Failed to load tileset:', error);
            }
        }
    }

    /**
     * 应用瓦片地图数据
     * Apply tilemap data
     */
    applyTilemapData(data: ITilemapData): void {
        this.width = data.width;
        this.height = data.height;
        this.tileWidth = data.tileWidth;
        this.tileHeight = data.tileHeight;

        // 转换为Uint32Array
        this._tileData = new Uint32Array(data.data);

        // 加载碰撞数据
        if (data.collisionData) {
            this._collisionData = new Uint32Array(data.collisionData);
        } else {
            this._collisionData = new Uint32Array(0);
        }

        this.renderDirty = true;
    }

    /**
     * 获取碰撞数据
     * Get collision data
     */
    get collisionData(): Uint32Array {
        return this._collisionData;
    }

    /**
     * 检查指定瓦片位置是否有碰撞
     * Check if tile at position has collision
     */
    hasCollision(col: number, row: number): boolean {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
            return true; // 边界外视为碰撞
        }
        if (this._collisionData.length === 0) {
            return false;
        }
        return this._collisionData[row * this.width + col] > 0;
    }

    /**
     * 获取碰撞类型
     * Get collision type at position
     */
    getCollisionType(col: number, row: number): number {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
            return 0;
        }
        if (this._collisionData.length === 0) {
            return 0;
        }
        return this._collisionData[row * this.width + col];
    }

    /**
     * 设置碰撞数据
     * Set collision data for a tile
     */
    setCollision(col: number, row: number, collisionType: number): void {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
            return;
        }
        // 按需初始化碰撞数组
        if (this._collisionData.length === 0) {
            this._collisionData = new Uint32Array(this.width * this.height);
        }
        this._collisionData[row * this.width + col] = collisionType;
    }

    /**
     * 检查世界坐标是否有碰撞
     * Check collision at world position
     */
    hasCollisionAt(worldX: number, worldY: number): boolean {
        const [col, row] = this.worldToTile(worldX, worldY);
        return this.hasCollision(col, row);
    }

    /**
     * 获取AABB范围内所有碰撞瓦片
     * Get all collision tiles within AABB bounds
     * Returns array of [col, row, collisionType]
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
        const endCol = Math.min(this.width, Math.ceil(right / this.tileWidth));
        const startRow = Math.max(0, Math.floor(bottom / this.tileHeight));
        const endRow = Math.min(this.height, Math.ceil(top / this.tileHeight));

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const type = this._collisionData[row * this.width + col];
                if (type > 0) {
                    result.push([col, row, type]);
                }
            }
        }

        return result;
    }

    /**
     * 生成碰撞矩形列表（用于物理引擎）
     * Generate collision rectangles for physics engine
     * Returns array of {x, y, width, height, type}
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

        // 简单实现：每个碰撞瓦片生成一个矩形
        // 高级实现可以合并相邻瓦片
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const type = this._collisionData[row * this.width + col];
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

    /**
     * 获取指定位置的瓦片索引
     * Get tile index at position
     * @param col 列
     * @param row 行
     * @returns 瓦片索引，0表示空
     */
    getTile(col: number, row: number): number {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
            return 0;
        }
        return this._tileData[row * this.width + col];
    }

    /**
     * 设置指定位置的瓦片
     * Set tile at position
     * @param col 列
     * @param row 行
     * @param tileIndex 瓦片索引
     */
    setTile(col: number, row: number, tileIndex: number): void {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
            return;
        }
        const index = row * this.width + col;
        this._tileData[index] = tileIndex;
        this._tileDataArray[index] = tileIndex;
        this.renderDirty = true;
    }

    /**
     * 初始化空白地图
     * Initialize empty map
     */
    initializeEmpty(width: number, height: number): void {
        this._width = width;
        this._height = height;
        this._tileData = new Uint32Array(width * height);
        this._tileDataArray = Array.from(this._tileData);
        this.renderDirty = true;
    }

    /**
     * 调整地图大小（保留现有瓦片数据）
     * Resize map (preserves existing tile data)
     * @param newWidth 新宽度
     * @param newHeight 新高度
     */
    resize(newWidth: number, newHeight: number): void {
        if (newWidth === this._width && newHeight === this._height) {
            return;
        }

        const newData = new Uint32Array(newWidth * newHeight);

        // Copy existing data
        const minWidth = Math.min(this._width, newWidth);
        const minHeight = Math.min(this._height, newHeight);

        for (let y = 0; y < minHeight; y++) {
            for (let x = 0; x < minWidth; x++) {
                newData[y * newWidth + x] = this._tileData[y * this._width + x];
            }
        }

        this._tileData = newData;
        this._tileDataArray = Array.from(newData);
        this._width = newWidth;
        this._height = newHeight;
        this.renderDirty = true;
    }

    /**
     * 世界坐标转换为瓦片坐标
     * Convert world position to tile coordinates
     * @param worldX 世界X坐标
     * @param worldY 世界Y坐标
     * @returns [col, row]
     */
    worldToTile(worldX: number, worldY: number): [number, number] {
        const col = Math.floor(worldX / this.tileWidth);
        const row = Math.floor(worldY / this.tileHeight);
        return [col, row];
    }

    /**
     * 瓦片坐标转换为世界坐标（返回瓦片中心）
     * Convert tile coordinates to world position (returns tile center)
     * @param col 列
     * @param row 行
     * @returns [worldX, worldY]
     */
    tileToWorld(col: number, row: number): [number, number] {
        const worldX = col * this.tileWidth + this.tileWidth / 2;
        const worldY = row * this.tileHeight + this.tileHeight / 2;
        return [worldX, worldY];
    }

    /**
     * 获取瓦片在tileset中的UV坐标
     * Get tile UV coordinates in tileset
     * @param tileIndex 瓦片索引（从1开始，0表示空）
     * @returns [u0, v0, u1, v1] 或 null
     */
    getTileUV(tileIndex: number): [number, number, number, number] | null {
        if (tileIndex <= 0 || !this._tilesetData) {
            return null;
        }

        const { columns, imageWidth, imageHeight, tileWidth, tileHeight, margin = 0, spacing = 0 } = this._tilesetData;

        // 瓦片索引从1开始，转换为0开始
        const idx = tileIndex - 1;
        const col = idx % columns;
        const row = Math.floor(idx / columns);

        const x = margin + col * (tileWidth + spacing);
        const y = margin + row * (tileHeight + spacing);

        // Flip V coordinates because texture Y=0 is at bottom, but image Y=0 is at top
        const uv: [number, number, number, number] = [
            x / imageWidth,
            1 - (y + tileHeight) / imageHeight,
            (x + tileWidth) / imageWidth,
            1 - y / imageHeight
        ];

        return uv;
    }

    /**
     * 组件反序列化后恢复运行时数据
     * Restore runtime data after deserialization
     */
    override onDeserialized(): void {
        // 从序列化数组恢复 Uint32Array
        if (this._tileDataArray.length > 0) {
            this._tileData = new Uint32Array(this._tileDataArray);
        }

        // 从序列化的尺寸信息同步恢复 _tilesetData
        // Synchronously restore _tilesetData from serialized size info
        const tilesetPath = this.tilesetImage || this.tilesetAssetGuid;
        if (tilesetPath && !this._tilesetData && this._tilesetImageWidth > 0 && this._tilesetImageHeight > 0) {
            const columns = Math.floor(this._tilesetImageWidth / this.tileWidth);
            const rows = Math.floor(this._tilesetImageHeight / this.tileHeight);

            this._tilesetData = {
                name: 'direct-tileset',
                version: 1,
                image: tilesetPath,
                imageWidth: this._tilesetImageWidth,
                imageHeight: this._tilesetImageHeight,
                tileWidth: this.tileWidth,
                tileHeight: this.tileHeight,
                tileCount: columns * rows,
                columns,
                rows
            };
            this.renderDirty = true;
        }
    }

    /**
     * 组件销毁时调用
     * Called when component is destroyed
     */
    onDestroy(): void {
        if (this._tilemapReference) {
            this._tilemapReference.release();
            this._tilemapReference = undefined;
        }
        if (this._tilesetReference) {
            this._tilesetReference.release();
            this._tilesetReference = undefined;
        }
        this._tilesetData = undefined;
    }
}
