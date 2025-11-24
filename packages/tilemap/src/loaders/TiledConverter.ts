/**
 * Tiled Map Editor format converter
 * Tiled 地图编辑器格式转换器
 *
 * Converts Tiled JSON export format to our internal tilemap/tileset format.
 * 将 Tiled JSON 导出格式转换为内部 tilemap/tileset 格式。
 */

import { ITilemapAsset } from './TilemapLoader';
import { ITilesetAsset } from './TilesetLoader';

/**
 * Tiled map JSON format (exported from Tiled)
 * Tiled 地图 JSON 格式
 */
export interface ITiledMap {
    /** Map width in tiles */
    width: number;
    /** Map height in tiles */
    height: number;
    /** Tile width in pixels */
    tilewidth: number;
    /** Tile height in pixels */
    tileheight: number;
    /** Map orientation (orthogonal, isometric, etc.) */
    orientation: string;
    /** Render order */
    renderorder: string;
    /** Layers array */
    layers: ITiledLayer[];
    /** Tilesets array */
    tilesets: ITiledTileset[];
    /** Custom properties */
    properties?: ITiledProperty[];
    /** Tiled version */
    tiledversion?: string;
    /** Map version */
    version?: string | number;
}

/**
 * Tiled layer format
 * Tiled 图层格式
 */
export interface ITiledLayer {
    /** Layer name */
    name: string;
    /** Layer type (tilelayer, objectgroup, imagelayer, group) */
    type: string;
    /** Layer ID */
    id: number;
    /** Layer width in tiles */
    width?: number;
    /** Layer height in tiles */
    height?: number;
    /** Tile data (for tilelayer) */
    data?: number[];
    /** Layer visibility */
    visible: boolean;
    /** Layer opacity (0-1) */
    opacity: number;
    /** Layer X offset */
    x: number;
    /** Layer Y offset */
    y: number;
    /** Objects (for objectgroup) */
    objects?: ITiledObject[];
    /** Custom properties */
    properties?: ITiledProperty[];
}

/**
 * Tiled object format
 * Tiled 对象格式
 */
export interface ITiledObject {
    id: number;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    visible: boolean;
    properties?: ITiledProperty[];
}

/**
 * Tiled tileset format
 * Tiled 瓦片集格式
 */
export interface ITiledTileset {
    /** First GID (global tile ID) */
    firstgid: number;
    /** Tileset name */
    name: string;
    /** Image path */
    image: string;
    /** Image width */
    imagewidth: number;
    /** Image height */
    imageheight: number;
    /** Tile width */
    tilewidth: number;
    /** Tile height */
    tileheight: number;
    /** Tile count */
    tilecount: number;
    /** Columns */
    columns: number;
    /** Margin */
    margin: number;
    /** Spacing */
    spacing: number;
    /** Tile properties/metadata */
    tiles?: ITiledTile[];
    /** External tileset source (if embedded) */
    source?: string;
}

/**
 * Tiled tile metadata
 * Tiled 瓦片元数据
 */
export interface ITiledTile {
    id: number;
    type?: string;
    properties?: ITiledProperty[];
}

/**
 * Tiled property format
 * Tiled 属性格式
 */
export interface ITiledProperty {
    name: string;
    type: string;
    value: unknown;
}

/**
 * Conversion result
 * 转换结果
 */
export interface ITiledConversionResult {
    /** Converted tilemap */
    tilemap: ITilemapAsset;
    /** Converted tilesets */
    tilesets: ITilesetAsset[];
    /** Object layers (if any) */
    objects: Array<{
        name: string;
        objects: ITiledObject[];
    }>;
}

/**
 * Tiled format converter
 * Tiled 格式转换器
 */
export class TiledConverter {
    /**
     * Convert Tiled JSON map to internal format
     * 将 Tiled JSON 地图转换为内部格式
     */
    static convert(tiledMap: ITiledMap, mapName: string = 'tilemap'): ITiledConversionResult {
        // Convert tilesets
        const tilesets = tiledMap.tilesets.map(ts => this.convertTileset(ts));

        // Find the first tile layer for main data
        const tileLayer = tiledMap.layers.find(l => l.type === 'tilelayer');

        // Convert tile data (Tiled uses global IDs, we need to adjust)
        let data: number[] = [];
        if (tileLayer && tileLayer.data) {
            data = this.convertTileData(tileLayer.data, tiledMap.tilesets);
        }

        // Extract collision layer if exists
        const collisionLayer = tiledMap.layers.find(
            l => l.type === 'tilelayer' &&
            (l.name.toLowerCase().includes('collision') || l.name.toLowerCase().includes('solid'))
        );
        const collisionData = collisionLayer?.data
            ? this.convertTileData(collisionLayer.data, tiledMap.tilesets)
            : undefined;

        // Collect all layers
        const layers = tiledMap.layers
            .filter(l => l.type === 'tilelayer')
            .map(l => ({
                name: l.name,
                visible: l.visible,
                opacity: l.opacity,
                data: l.data ? this.convertTileData(l.data, tiledMap.tilesets) : undefined
            }));

        // Collect object layers
        const objects = tiledMap.layers
            .filter(l => l.type === 'objectgroup')
            .map(l => ({
                name: l.name,
                objects: l.objects || []
            }));

        // Convert properties
        const properties: Record<string, unknown> = {};
        if (tiledMap.properties) {
            for (const prop of tiledMap.properties) {
                properties[prop.name] = prop.value;
            }
        }

        const tilemap: ITilemapAsset = {
            name: mapName,
            version: 1,
            width: tiledMap.width,
            height: tiledMap.height,
            tileWidth: tiledMap.tilewidth,
            tileHeight: tiledMap.tileheight,
            tileset: tilesets.length > 0 ? tilesets[0].name : '',
            data,
            layers: layers.length > 1 ? layers : undefined,
            collisionData,
            properties
        };

        return {
            tilemap,
            tilesets,
            objects
        };
    }

    /**
     * Convert Tiled tileset to internal format
     * 将 Tiled 瓦片集转换为内部格式
     */
    private static convertTileset(tiledTileset: ITiledTileset): ITilesetAsset {
        const tiles = tiledTileset.tiles?.map(t => ({
            id: t.id,
            type: t.type,
            properties: t.properties?.reduce((acc, p) => {
                acc[p.name] = p.value;
                return acc;
            }, {} as Record<string, unknown>)
        }));

        return {
            name: tiledTileset.name,
            version: 1,
            image: tiledTileset.image,
            imageWidth: tiledTileset.imagewidth,
            imageHeight: tiledTileset.imageheight,
            tileWidth: tiledTileset.tilewidth,
            tileHeight: tiledTileset.tileheight,
            tileCount: tiledTileset.tilecount,
            columns: tiledTileset.columns,
            rows: Math.ceil(tiledTileset.tilecount / tiledTileset.columns),
            margin: tiledTileset.margin || 0,
            spacing: tiledTileset.spacing || 0,
            tiles
        };
    }

    /**
     * Convert Tiled tile data (global IDs to local IDs)
     * 转换 Tiled 瓦片数据（全局ID到本地ID）
     *
     * Tiled uses global tile IDs where each tileset has a firstgid.
     * We convert to local IDs starting from 1 (0 = empty).
     */
    private static convertTileData(data: number[], tilesets: ITiledTileset[]): number[] {
        if (tilesets.length === 0) return data;

        // For single tileset, simple conversion
        if (tilesets.length === 1) {
            const firstgid = tilesets[0].firstgid;
            return data.map(gid => {
                if (gid === 0) return 0;
                // Clear flip flags (high bits in Tiled)
                const tileId = gid & 0x1FFFFFFF;
                return tileId - firstgid + 1;
            });
        }

        // For multiple tilesets, find which tileset each tile belongs to
        return data.map(gid => {
            if (gid === 0) return 0;

            const tileId = gid & 0x1FFFFFFF;

            // Find the tileset this tile belongs to
            let tileset: ITiledTileset | null = null;
            for (let i = tilesets.length - 1; i >= 0; i--) {
                if (tileId >= tilesets[i].firstgid) {
                    tileset = tilesets[i];
                    break;
                }
            }

            if (!tileset) return 0;

            return tileId - tileset.firstgid + 1;
        });
    }

    /**
     * Parse Tiled JSON string
     * 解析 Tiled JSON 字符串
     */
    static parse(jsonString: string): ITiledMap {
        return JSON.parse(jsonString) as ITiledMap;
    }

    /**
     * Convert and stringify to internal format
     * 转换并序列化为内部格式
     */
    static convertToJson(tiledMap: ITiledMap, mapName?: string): {
        tilemapJson: string;
        tilesetJsons: string[];
    } {
        const result = this.convert(tiledMap, mapName);

        return {
            tilemapJson: JSON.stringify(result.tilemap, null, 2),
            tilesetJsons: result.tilesets.map(ts => JSON.stringify(ts, null, 2))
        };
    }
}
