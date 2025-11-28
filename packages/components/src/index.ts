// 变换
export { TransformComponent, Vector3 } from './TransformComponent';

// 渲染
export { SpriteComponent } from './SpriteComponent';
export { SpriteAnimatorComponent, AnimationFrame, AnimationClip } from './SpriteAnimatorComponent';
export { TextComponent, TextAlignment } from './TextComponent';
export { CameraComponent, CameraProjection } from './CameraComponent';

// 系统
export { SpriteAnimatorSystem } from './systems/SpriteAnimatorSystem';

// 物理组件已移至 @esengine/physics-rapier2d 包
// Physics components have been moved to @esengine/physics-rapier2d package

// 音频
export { AudioSourceComponent } from './AudioSourceComponent';

// Plugin (unified plugin system)
export { CorePlugin, CoreRuntimeModule } from './CorePlugin';
export type { SystemContext, PluginDescriptor, IRuntimeModuleLoader, IPluginLoader } from './CorePlugin';