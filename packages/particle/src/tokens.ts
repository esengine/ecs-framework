/**
 * 粒子模块服务令牌
 * Particle module service tokens
 *
 * 定义粒子模块导出的服务令牌。
 * Defines service tokens exported by particle module.
 */

import { createServiceToken } from '@esengine/ecs-framework';
import type { ParticleUpdateSystem } from './systems/ParticleSystem';

// ============================================================================
// 粒子模块导出的令牌 | Tokens exported by particle module
// ============================================================================

/**
 * 粒子更新系统令牌
 * Particle update system token
 */
export const ParticleUpdateSystemToken = createServiceToken<ParticleUpdateSystem>('particleUpdateSystem');
