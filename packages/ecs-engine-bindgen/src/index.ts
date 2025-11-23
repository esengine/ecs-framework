/**
 * ECS Engine Bindgen - Bridge layer between ECS Framework and Rust Engine.
 * ECS引擎桥接层 - ECS框架与Rust引擎之间的桥接层。
 *
 * @packageDocumentation
 */

export { EngineBridge, EngineBridgeConfig } from './core/EngineBridge';
export { RenderBatcher } from './core/RenderBatcher';
export { SpriteRenderHelper, ITransformComponent } from './core/SpriteRenderHelper';
export { EngineRenderSystem, type TransformComponentType } from './systems/EngineRenderSystem';
export { CameraSystem } from './systems/CameraSystem';
export * from './types';
