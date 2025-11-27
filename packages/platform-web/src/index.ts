/**
 * Web/H5 平台适配器包
 * @packageDocumentation
 */

// 引擎桥接
export { EngineBridge } from './EngineBridge';
export type { EngineBridgeConfig } from './EngineBridge';

// 子系统
export { WebCanvasSubsystem } from './subsystems/WebCanvasSubsystem';
export { WebInputSubsystem } from './subsystems/WebInputSubsystem';
export { WebStorageSubsystem } from './subsystems/WebStorageSubsystem';
export { WebWASMSubsystem } from './subsystems/WebWASMSubsystem';

// 运行时系统配置
export {
    registerAvailableModules,
    initializeRuntime,
    initializeModulesForProject,
    createRuntimeSystems
} from './RuntimeSystems';
export type { RuntimeSystems, RuntimeModuleConfig } from './RuntimeSystems';

// 工具
export function isWebPlatform(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}
