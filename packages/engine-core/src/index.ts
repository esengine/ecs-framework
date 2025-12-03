export { TransformComponent, type Vector3, type Matrix2D } from './TransformComponent';
export { TransformSystem } from './TransformSystem';
export { HierarchyComponent } from './HierarchyComponent';
export { HierarchySystem } from './HierarchySystem';
export {
    EnginePlugin,
    // 类型导出
    type LoadingPhase,
    type SystemContext,
    type IRuntimeModule,
    type IPlugin
} from './EnginePlugin';

// Module Manifest types (unified module/plugin configuration)
export {
    type ModuleManifest,
    type ModuleCategory,
    type ModulePlatform,
    type ModuleExports
} from './ModuleManifest';
