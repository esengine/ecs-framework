/**
 * Tilemap System for ECS Framework
 * ECS框架的瓦片地图系统
 */

// Asset type constants for tilemap
// 瓦片地图资产类型常量
export const TilemapAssetType = 'tilemap' as const;
export const TilesetAssetType = 'tileset' as const;

// Component
export { TilemapComponent } from './TilemapComponent';
export type { ITilemapData, ITilesetData } from './TilemapComponent';
export type { ResizeAnchor } from './TilemapComponent';

// Systems
export { TilemapRenderingSystem } from './systems/TilemapRenderingSystem';
export type { TilemapRenderData, ViewportBounds } from './systems/TilemapRenderingSystem';

// Physics
export { TilemapCollider2DComponent, TilemapColliderMode } from './physics/TilemapCollider2DComponent';
export type { CollisionRect } from './physics/TilemapCollider2DComponent';
export { TilemapPhysicsSystem } from './physics/TilemapPhysicsSystem';
export type { IPhysicsWorld, IPhysics2DSystem } from './physics/TilemapPhysicsSystem';

// Loaders
export { TilemapLoader } from './loaders/TilemapLoader';
export type { ITilemapAsset } from './loaders/TilemapLoader';
export { TilesetLoader } from './loaders/TilesetLoader';
export type { ITilesetAsset } from './loaders/TilesetLoader';

// Tiled converter
export { TiledConverter } from './loaders/TiledConverter';
export type { ITiledMap, ITiledConversionResult } from './loaders/TiledConverter';

// Runtime module (no editor dependencies)
export { TilemapRuntimeModule } from './TilemapRuntimeModule';

// Plugin (for PluginManager - includes editor dependencies)
export { TilemapPlugin } from './editor/TilemapPlugin';
