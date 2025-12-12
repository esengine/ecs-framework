/**
 * ECS Engine Bindgen - Bridge layer between ECS Framework and Rust Engine.
 * ECS引擎桥接层 - ECS框架与Rust引擎之间的桥接层。
 *
 * @packageDocumentation
 */

// Service tokens and interfaces (谁定义接口，谁导出 Token)
export {
    RenderSystemToken,
    EngineBridgeToken,
    EngineIntegrationToken,
    type IRenderSystem,
    type IEngineBridge,
    type IEngineIntegration,
    type IRenderDataProvider
} from './tokens';

export { EngineBridge } from './core/EngineBridge';
export type { EngineBridgeConfig } from './core/EngineBridge';
export { RenderBatcher } from './core/RenderBatcher';
export { SpriteRenderHelper } from './core/SpriteRenderHelper';
export type { ITransformComponent } from './core/SpriteRenderHelper';
export { EngineRenderSystem, type TransformComponentType, type IUIRenderDataProvider, type GizmoDataProviderFn, type HasGizmoProviderFn, type ProviderRenderData, type AssetPathResolverFn } from './systems/EngineRenderSystem';
export * from './types';
