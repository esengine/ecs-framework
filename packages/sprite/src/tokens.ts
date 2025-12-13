/**
 * Sprite 模块服务令牌
 * Sprite module service tokens
 */

import { createServiceToken } from '@esengine/ecs-framework';
import type { SpriteAnimatorSystem } from './systems/SpriteAnimatorSystem';

// ============================================================================
// Sprite 模块导出的令牌 | Tokens exported by Sprite module
// ============================================================================

/**
 * Sprite 动画系统令牌
 * Sprite animator system token
 */
export const SpriteAnimatorSystemToken = createServiceToken<SpriteAnimatorSystem>('spriteAnimatorSystem');
