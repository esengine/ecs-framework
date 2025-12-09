/**
 * @esengine/physics-rapier2d
 *
 * Deterministic 2D physics engine based on Rapier2D with enhanced-determinism support.
 * 基于 Rapier2D 的确定性 2D 物理引擎。
 *
 * 注意：此入口不包含 WASM 依赖，可安全地在编辑器中同步导入。
 * 运行时模块（含 WASM）请使用 '@esengine/physics-rapier2d/runtime' 导入。
 *
 * @packageDocumentation
 */

// Types (no WASM dependency)
export * from './types';

// Components (no WASM dependency)
export * from './components';

// Services (no WASM dependency)
export * from './services';

// Systems (type only for editor usage)
export type { Physics2DSystem } from './systems/Physics2DSystem';

// Editor plugin (no WASM dependency)
export { Physics2DPlugin } from './PhysicsEditorPlugin';

// Runtime plugin (for game builds)
export { PhysicsPlugin } from './PhysicsRuntimeModule';

// Service tokens and interfaces (谁定义接口，谁导出 Token)
export {
    Physics2DQueryToken,
    Physics2DSystemToken,
    Physics2DWorldToken,
    PhysicsConfigToken,
    CollisionLayerConfigToken,
    type IPhysics2DQuery,
    type IPhysics2DWorld,
    type ICollisionLayerConfig,
    type PhysicsConfig
} from './tokens';
