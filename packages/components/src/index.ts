// Re-exports for backward compatibility
export { TransformComponent, type Vector3 } from '@esengine/engine-core';
export { CameraComponent, ECameraProjection, CameraProjection } from '@esengine/camera';
export { SpriteComponent, SpriteAnimatorComponent, SpriteAnimatorSystem } from '@esengine/sprite';
export type { AnimationFrame, AnimationClip } from '@esengine/sprite';

export { TextComponent, TextAlignment } from './TextComponent';
export { AudioSourceComponent } from './AudioSourceComponent';

export { CorePlugin, CoreRuntimeModule } from './CorePlugin';
export type { SystemContext, PluginDescriptor, IRuntimeModuleLoader, IPluginLoader } from './CorePlugin';