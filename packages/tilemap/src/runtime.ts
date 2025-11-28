/**
 * @esengine/tilemap Runtime Entry Point
 *
 * This entry point exports only runtime-related code without any editor dependencies.
 * Use this for standalone game runtime builds.
 *
 * 此入口点仅导出运行时相关代码，不包含任何编辑器依赖。
 * 用于独立游戏运行时构建。
 */

// Components
export { TilemapComponent } from './TilemapComponent';
export type { ITilemapData, ITilesetData } from './TilemapComponent';
export type { ResizeAnchor } from './TilemapComponent';

export { TilemapCollider2DComponent, TilemapColliderMode } from './physics/TilemapCollider2DComponent';
export type { CollisionRect } from './physics/TilemapCollider2DComponent';

// Systems
export { TilemapRenderingSystem } from './systems/TilemapRenderingSystem';
export type { TilemapRenderData, ViewportBounds } from './systems/TilemapRenderingSystem';

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

// Runtime module
export { TilemapRuntimeModule } from './TilemapRuntimeModule';
