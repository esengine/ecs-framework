// Core types
export { type Particle, createParticle, resetParticle, ParticlePool } from './Particle';

// Emitter
export {
    ParticleEmitter,
    EmissionShape,
    createDefaultEmitterConfig,
    type EmitterConfig,
    type ValueRange,
    type ColorValue
} from './ParticleEmitter';

// Component
export { ParticleSystemComponent, ParticleBlendMode, SimulationSpace, RenderSpace, type BurstConfig } from './ParticleSystemComponent';
export { ClickFxComponent, ClickFxTriggerMode } from './ClickFxComponent';

// System
export { ParticleUpdateSystem } from './systems/ParticleSystem';
export { ClickFxSystem } from './systems/ClickFxSystem';

// Modules
export {
    type IParticleModule,
    ColorOverLifetimeModule,
    type ColorKey,
    SizeOverLifetimeModule,
    ScaleCurveType,
    type ScaleKey,
    VelocityOverLifetimeModule,
    VelocityCurveType,
    type VelocityKey,
    RotationOverLifetimeModule,
    NoiseModule,
    valueNoise2D,
    noiseHash,
    TextureSheetAnimationModule,
    AnimationPlayMode,
    AnimationLoopMode,
    CollisionModule,
    BoundaryType,
    CollisionBehavior,
    ForceFieldModule,
    ForceFieldType,
    createDefaultForceField,
    type ForceField,
    // Physics 2D collision module | 2D 物理碰撞模块
    Physics2DCollisionModule,
    Physics2DCollisionBehavior,
    type IPhysics2DQuery,
    type ParticleCollisionInfo
} from './modules';

// Rendering
export {
    ParticleRenderDataProvider,
    type ParticleProviderRenderData
} from './rendering';

// Presets
export {
    type ParticlePreset,
    PresetCategory,
    AllPresets,
    DefaultPreset,
    FirePreset,
    SmokePreset,
    SparklePreset,
    ExplosionPreset,
    RainPreset,
    SnowPreset,
    MagicAuraPreset,
    DustPreset,
    BubblePreset,
    StarTrailPreset,
    VortexPreset,
    LeavesPreset,
    BouncingPreset,
    getPresetsByCategory,
    getPresetNames,
    getPresetByName,
} from './presets';

// Loaders
export {
    ParticleLoader,
    ParticleAssetType,
    createDefaultParticleAsset,
    type IParticleAsset,
    type IParticleModuleConfig
} from './loaders';

// Plugin
export { ParticleRuntimeModule, ParticlePlugin } from './ParticleRuntimeModule';

// Service tokens | 服务令牌
export { ParticleUpdateSystemToken } from './tokens';
