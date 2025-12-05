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
export { ParticleSystemComponent, ParticleBlendMode, SimulationSpace, type BurstConfig } from './ParticleSystemComponent';

// System
export { ParticleUpdateSystem } from './systems/ParticleSystem';

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
    type ForceField
} from './modules';

// Rendering
export {
    ParticleRenderDataProvider,
    type ParticleProviderRenderData,
    type IRenderDataProvider
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
export type { ParticleSystemContext } from './ParticleRuntimeModule';
