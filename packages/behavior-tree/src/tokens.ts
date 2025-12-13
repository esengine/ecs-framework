/**
 * 行为树模块服务令牌
 * Behavior tree module service tokens
 */

import { createServiceToken } from '@esengine/ecs-framework';
import type { BehaviorTreeExecutionSystem } from './execution/BehaviorTreeExecutionSystem';

// ============================================================================
// 行为树模块导出的令牌 | Tokens exported by behavior tree module
// ============================================================================

/**
 * 行为树执行系统令牌
 * Behavior tree execution system token
 */
export const BehaviorTreeSystemToken = createServiceToken<BehaviorTreeExecutionSystem>('behaviorTreeSystem');
