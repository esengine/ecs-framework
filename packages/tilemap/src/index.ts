/**
 * Tilemap System for ECS Framework
 * ECS框架的瓦片地图系统
 */

// Constants
export { TilemapAssetType, TilesetAssetType } from './constants';

// Component
export { TilemapComponent } from './TilemapComponent';
export type { ITilemapData, ITilesetData, ITileMetadata, ITileAnimation, ITileAnimationFrame } from './TilemapComponent';
export type { ResizeAnchor } from './TilemapComponent';

// Animation System
export { TilemapAnimationSystem, tilemapAnimationSystem } from './TilemapAnimationSystem';

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

// Runtime module and plugin
export { TilemapRuntimeModule, TilemapPlugin } from './TilemapRuntimeModule';

// Service tokens | 服务令牌
export {
    TilemapSystemToken,
    TilemapPhysicsSystemToken
} from './tokens';
