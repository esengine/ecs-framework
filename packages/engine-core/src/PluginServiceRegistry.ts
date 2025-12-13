/**
 * 插件服务令牌（engine-core 特定）
 * Plugin Service Tokens (engine-core specific)
 *
 * 核心类型 (PluginServiceRegistry, createServiceToken, ServiceToken) 从 @esengine/ecs-framework 导入。
 * 这里只定义 engine-core 特有的服务令牌。
 *
 * Core types (PluginServiceRegistry, createServiceToken, ServiceToken) are imported from @esengine/ecs-framework.
 * This file only defines engine-core specific service tokens.
 */

import { createServiceToken } from '@esengine/ecs-framework';

// Re-export from ecs-framework for backwards compatibility
export { PluginServiceRegistry, createServiceToken, type ServiceToken } from '@esengine/ecs-framework';

// ============================================================================
// engine-core 内部 Token | engine-core Internal Tokens
// ============================================================================

/**
 * Transform 组件类型 | Transform component type
 *
 * 使用 any 类型以允许各模块使用自己的 ITransformComponent 接口定义。
 * Using any type to allow modules to use their own ITransformComponent interface definition.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TransformTypeToken = createServiceToken<new (...args: any[]) => any>('transformType');

/**
 * Canvas 元素的服务令牌
 * Service token for the canvas element
 */
export const CanvasElementToken = createServiceToken<HTMLCanvasElement>('canvasElement');

// ============================================================================
// 引擎桥接接口 | Engine Bridge Interface
// ============================================================================

/**
 * 引擎桥接接口
 * Engine bridge interface
 *
 * 定义 WASM 引擎桥接的核心契约，供各模块使用。
 * Defines the core contract of WASM engine bridge for modules to use.
 */
export interface IEngineBridge {
    /** 加载纹理 | Load texture */
    loadTexture(id: number, url: string): Promise<void>;

    /**
     * 屏幕坐标转世界坐标
     * Screen to world coordinate conversion
     */
    screenToWorld(screenX: number, screenY: number): { x: number; y: number };

    /**
     * 世界坐标转屏幕坐标
     * World to screen coordinate conversion
     */
    worldToScreen(worldX: number, worldY: number): { x: number; y: number };

    /**
     * 设置清除颜色
     * Set clear color
     */
    setClearColor(r: number, g: number, b: number, a: number): void;
}

/**
 * 引擎桥接服务令牌
 * Engine bridge service token
 */
export const EngineBridgeToken = createServiceToken<IEngineBridge>('engineBridge');
