/**
 * Physics 2D Runtime Entry
 * 2D 物理运行时入口
 *
 * 包含 WASM 依赖，用于实际运行时环境
 * Contains WASM dependencies, for actual runtime environment
 */

// Re-export runtime module and plugin with WASM
export { PhysicsRuntimeModule, PhysicsPlugin } from '../PhysicsRuntimeModule';

// Re-export world and system (they have WASM type dependencies)
export { Physics2DWorld } from '../world/Physics2DWorld';
export type { Physics2DWorldState } from '../world/Physics2DWorld';

export { Physics2DSystem } from '../systems/Physics2DSystem';
export type { Physics2DSystemConfig } from '../systems/Physics2DSystem';
