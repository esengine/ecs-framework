/**
 * ecs-engine-bindgen 服务令牌
 * ecs-engine-bindgen service tokens
 */

import { createServiceToken, EngineBridgeToken as CoreEngineBridgeToken, type IEngineBridge as CoreIEngineBridge } from '@esengine/engine-core';
import type { IRenderDataProvider as InternalIRenderDataProvider } from './systems/EngineRenderSystem';

// 从 engine-core 重新导出 | Re-export from engine-core
export { CoreEngineBridgeToken as EngineBridgeToken };
export type { CoreIEngineBridge as IEngineBridge };

export type IRenderDataProvider = InternalIRenderDataProvider;

/**
 * 渲染系统接口
 * Render system interface
 */
export interface IRenderSystem {
    addRenderDataProvider(provider: IRenderDataProvider): void;
    removeRenderDataProvider(provider: IRenderDataProvider): void;
}

/**
 * 引擎集成接口
 * Engine integration interface
 */
export interface IEngineIntegration {
    /** 通过相对路径加载纹理（用户脚本使用）| Load texture by relative path (for user scripts) */
    loadTextureForComponent(texturePath: string): Promise<number>;
    /** 通过 GUID 加载纹理（内部引用使用）| Load texture by GUID (for internal references) */
    loadTextureByGuid(guid: string): Promise<number>;
}

export const RenderSystemToken = createServiceToken<IRenderSystem>('renderSystem');
export const EngineIntegrationToken = createServiceToken<IEngineIntegration>('engineIntegration');
