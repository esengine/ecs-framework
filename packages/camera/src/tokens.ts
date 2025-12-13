/**
 * Camera Module Service Tokens
 * 相机模块服务令牌
 *
 * 遵循"谁定义接口，谁导出 Token"原则。
 * Following "who defines interface, who exports Token" principle.
 */

import { createServiceToken } from '@esengine/ecs-framework';
import type { ICameraManager } from './CameraManager';

// Re-export interface for consumers
// 重新导出接口供消费者使用
export type { ICameraManager };

/**
 * 相机管理器服务令牌
 * Camera manager service token
 */
export const CameraManagerToken = createServiceToken<ICameraManager>('cameraManager');
