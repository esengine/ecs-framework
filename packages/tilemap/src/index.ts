/**
 * Tilemap System for ECS Framework
 * ECS框架的瓦片地图系统
 */

// Component
export { TilemapComponent } from './TilemapComponent';
export type { ITilemapData, ITilesetData } from './TilemapComponent';
export type { ResizeAnchor } from './TilemapComponent';

// Systems
export { TilemapRenderingSystem } from './systems/TilemapRenderingSystem';
export type { TilemapRenderData, ViewportBounds } from './systems/TilemapRenderingSystem';

// Loaders
export { TilemapLoader } from './loaders/TilemapLoader';
export type { ITilemapAsset } from './loaders/TilemapLoader';
export { TilesetLoader } from './loaders/TilesetLoader';
export type { ITilesetAsset } from './loaders/TilesetLoader';

// Tiled converter
export { TiledConverter } from './loaders/TiledConverter';
export type { ITiledMap, ITiledConversionResult } from './loaders/TiledConverter';

// Module (for ModuleRegistry)
export { TilemapModule } from './TilemapModule';

// Plugin (for PluginManager)
export { TilemapPlugin, TilemapRuntimeModule } from './editor/TilemapPlugin';
