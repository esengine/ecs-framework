/**
 * ecs-engine-bindgen 服务令牌
 * ecs-engine-bindgen service tokens
 *
 * 定义渲染系统和引擎桥接相关的服务令牌和接口。
 * 谁定义接口，谁导出 Token。
 *
 * Defines service tokens and interfaces for render system and engine bridge.
 * Who defines the interface, who exports the Token.
 *
 * @example
 * ```typescript
 * // 消费方导入 Token | Consumer imports Token
 * import { RenderSystemToken, type IRenderSystem } from '@esengine/ecs-engine-bindgen';
 *
 * // 获取服务 | Get service
 * const renderSystem = context.services.get(RenderSystemToken);
 * if (renderSystem) {
 *     renderSystem.addRenderDataProvider(myProvider);
 * }
 * ```
 */

import { createServiceToken } from '@esengine/engine-core';
import type { EngineBridge } from './core/EngineBridge';
import type { IRenderDataProvider as InternalIRenderDataProvider } from './systems/EngineRenderSystem';

// ============================================================================
// 共享渲染接口 | Shared Render Interfaces
// ============================================================================

/**
 * 渲染数据提供者接口
 * Render data provider interface
 *
 * 由各模块的渲染系统实现，用于向主渲染系统提供渲染数据。
 * Implemented by render systems of various modules, used to provide render data to main render system.
 */
export type IRenderDataProvider = InternalIRenderDataProvider;

/**
 * 渲染系统接口
 * Render system interface
 *
 * 跨模块共享的渲染系统契约。
 * Cross-module shared render system contract.
 */
export interface IRenderSystem {
    /**
     * 注册渲染数据提供者
     * Register a render data provider
     *
     * @param provider 渲染数据提供者 | Render data provider
     */
    addRenderDataProvider(provider: IRenderDataProvider): void;

    /**
     * 移除渲染数据提供者
     * Remove a render data provider
     *
     * @param provider 渲染数据提供者 | Render data provider
     */
    removeRenderDataProvider(provider: IRenderDataProvider): void;
}

/**
 * 引擎桥接接口
 * Engine bridge interface
 *
 * WASM 引擎桥接契约。
 * WASM engine bridge contract.
 */
export interface IEngineBridge {
    /**
     * 加载纹理
     * Load texture
     */
    loadTexture(id: number, url: string): Promise<void>;
}

/**
 * 引擎集成接口
 * Engine integration interface
 *
 * 纹理加载等引擎集成功能。
 * Engine integration features like texture loading.
 */
export interface IEngineIntegration {
    /**
     * 为组件加载纹理
     * Load texture for component
     */
    loadTextureForComponent(texturePath: string): Promise<number>;
}

// ============================================================================
// 服务令牌 | Service Tokens
// ============================================================================

/**
 * 渲染系统服务令牌
 * Render system service token
 *
 * 用于获取渲染系统实例。
 * For getting render system instance.
 */
export const RenderSystemToken = createServiceToken<IRenderSystem>('renderSystem');

/**
 * 引擎桥接服务令牌
 * Engine bridge service token
 *
 * 用于获取 WASM 引擎桥接实例。
 * For getting WASM engine bridge instance.
 */
export const EngineBridgeToken = createServiceToken<IEngineBridge>('engineBridge');

/**
 * 引擎集成服务令牌
 * Engine integration service token
 *
 * 用于获取引擎集成实例（纹理加载等）。
 * For getting engine integration instance (texture loading, etc.).
 */
export const EngineIntegrationToken = createServiceToken<IEngineIntegration>('engineIntegration');
