/**
 * Camera Module Service Tokens
 * 相机模块服务令牌
 *
 * 遵循"谁定义接口，谁导出 Token"原则。
 * Following "who defines interface, who exports Token" principle.
 *
 * 当前模块仅提供组件，暂无服务定义。
 * 此文件预留用于未来可能添加的 CameraManager 服务。
 *
 * Currently this module only provides components, no services defined yet.
 * This file is reserved for potential future CameraManager service.
 */

// import { createServiceToken } from '@esengine/engine-core';

// ============================================================================
// Reserved for future service tokens
// 预留用于未来的服务令牌
// ============================================================================

// export interface ICameraManager {
//     // 获取主相机 | Get main camera
//     getMainCamera(): CameraComponent | null;
//     // 设置主相机 | Set main camera
//     setMainCamera(camera: CameraComponent): void;
//     // 屏幕坐标转世界坐标 | Screen to world coordinates
//     screenToWorld(screenX: number, screenY: number): { x: number; y: number };
// }

// export const CameraManagerToken = createServiceToken<ICameraManager>('cameraManager');
