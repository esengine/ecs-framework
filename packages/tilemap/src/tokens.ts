/**
 * Tilemap 模块服务令牌
 * Tilemap module service tokens
 *
 * 定义 tilemap 模块导出的服务令牌。
 * Defines service tokens exported by tilemap module.
 */

import { createServiceToken } from '@esengine/ecs-framework';
import type { TilemapRenderingSystem } from './systems/TilemapRenderingSystem';
import type { TilemapPhysicsSystem } from './physics/TilemapPhysicsSystem';

// ============================================================================
// Tilemap 模块导出的令牌 | Tokens exported by Tilemap module
// ============================================================================

/**
 * Tilemap 渲染系统令牌
 * Tilemap rendering system token
 */
export const TilemapSystemToken = createServiceToken<TilemapRenderingSystem>('tilemapSystem');

/**
 * Tilemap 物理系统令牌
 * Tilemap physics system token
 */
export const TilemapPhysicsSystemToken = createServiceToken<TilemapPhysicsSystem>('tilemapPhysicsSystem');
