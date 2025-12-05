/**
 * 粒子效果预设
 * Particle effect presets
 *
 * Collection of pre-configured particle system settings.
 * 预配置的粒子系统设置集合。
 */

import { EmissionShape, type ColorValue } from '../ParticleEmitter';
import { ParticleBlendMode, SimulationSpace } from '../ParticleSystemComponent';
import { ForceFieldType } from '../modules/ForceFieldModule';
import { BoundaryType, CollisionBehavior } from '../modules/CollisionModule';

/**
 * 辅助函数：十六进制转 ColorValue
 * Helper: hex to ColorValue
 */
function hexToColor(hex: string, alpha = 1): ColorValue {
    const h = hex.replace('#', '');
    return {
        r: parseInt(h.slice(0, 2), 16) / 255,
        g: parseInt(h.slice(2, 4), 16) / 255,
        b: parseInt(h.slice(4, 6), 16) / 255,
        a: alpha,
    };
}

/**
 * 预设配置接口
 * Preset configuration interface
 */
export interface ParticlePreset {
    /** 预设名称 | Preset name */
    name: string;
    /** 预设描述 | Preset description */
    description: string;
    /** 预设分类 | Preset category */
    category: PresetCategory;
    /** 预设图标 | Preset icon */
    icon?: string;

    // 基础属性 | Basic properties
    maxParticles: number;
    looping: boolean;
    duration: number;
    playbackSpeed: number;

    // 发射属性 | Emission properties
    emissionRate: number;
    emissionShape: EmissionShape;
    shapeRadius: number;
    shapeWidth: number;
    shapeHeight: number;
    shapeAngle: number;

    // 粒子属性 | Particle properties
    lifetimeMin: number;
    lifetimeMax: number;
    speedMin: number;
    speedMax: number;
    direction: number;
    directionSpread: number;
    scaleMin: number;
    scaleMax: number;
    gravityX: number;
    gravityY: number;

    // 颜色属性 | Color properties
    startColor: ColorValue;
    endColor?: ColorValue;
    startAlpha: number;
    endAlpha: number;
    endScale: number;

    // 渲染属性 | Rendering properties
    particleSize: number;
    blendMode: ParticleBlendMode;

    // 可选模块 | Optional modules
    simulationSpace?: SimulationSpace;
    forceField?: {
        type: ForceFieldType;
        strength: number;
        directionX?: number;
        directionY?: number;
        centerX?: number;
        centerY?: number;
        inwardStrength?: number;
        frequency?: number;
    };
    collision?: {
        boundaryType: BoundaryType;
        behavior: CollisionBehavior;
        radius?: number;
        bounceFactor?: number;
    };
}

/**
 * 预设分类
 * Preset category
 */
export enum PresetCategory {
    /** 自然效果 | Natural effects */
    Nature = 'nature',
    /** 魔法效果 | Magic effects */
    Magic = 'magic',
    /** 爆炸效果 | Explosion effects */
    Explosion = 'explosion',
    /** 环境效果 | Environment effects */
    Environment = 'environment',
    /** UI 效果 | UI effects */
    UI = 'ui',
    /** 基础效果 | Basic effects */
    Basic = 'basic',
}

/**
 * 火焰预设
 * Fire preset
 */
export const FirePreset: ParticlePreset = {
    name: 'Fire',
    description: 'Realistic fire effect with hot colors',
    category: PresetCategory.Nature,
    icon: 'Flame',

    maxParticles: 200,
    looping: true,
    duration: 5,
    playbackSpeed: 1,

    emissionRate: 40,
    emissionShape: EmissionShape.Rectangle,
    shapeRadius: 20,
    shapeWidth: 30,
    shapeHeight: 5,
    shapeAngle: 30,

    lifetimeMin: 0.5,
    lifetimeMax: 1.2,
    speedMin: 80,
    speedMax: 150,
    direction: 90,
    directionSpread: 25,
    scaleMin: 0.8,
    scaleMax: 1.2,
    gravityX: 0,
    gravityY: 50,

    startColor: hexToColor('#ff6600'),
    endColor: hexToColor('#ff0000'),
    startAlpha: 1,
    endAlpha: 0,
    endScale: 0.3,

    particleSize: 16,
    blendMode: ParticleBlendMode.Additive,
};

/**
 * 烟雾预设
 * Smoke preset
 */
export const SmokePreset: ParticlePreset = {
    name: 'Smoke',
    description: 'Soft rising smoke effect',
    category: PresetCategory.Nature,
    icon: 'Cloud',

    maxParticles: 150,
    looping: true,
    duration: 5,
    playbackSpeed: 1,

    emissionRate: 15,
    emissionShape: EmissionShape.Circle,
    shapeRadius: 15,
    shapeWidth: 30,
    shapeHeight: 30,
    shapeAngle: 30,

    lifetimeMin: 2,
    lifetimeMax: 4,
    speedMin: 20,
    speedMax: 50,
    direction: 90,
    directionSpread: 20,
    scaleMin: 0.5,
    scaleMax: 1,
    gravityX: 10,
    gravityY: -5,

    startColor: hexToColor('#888888'),
    endColor: hexToColor('#cccccc'),
    startAlpha: 0.6,
    endAlpha: 0,
    endScale: 2.5,

    particleSize: 32,
    blendMode: ParticleBlendMode.Normal,
};

/**
 * 火花预设
 * Sparkle preset
 */
export const SparklePreset: ParticlePreset = {
    name: 'Sparkle',
    description: 'Twinkling star-like particles',
    category: PresetCategory.Magic,
    icon: 'Sparkles',

    maxParticles: 100,
    looping: true,
    duration: 5,
    playbackSpeed: 1,

    emissionRate: 20,
    emissionShape: EmissionShape.Circle,
    shapeRadius: 40,
    shapeWidth: 40,
    shapeHeight: 40,
    shapeAngle: 360,

    lifetimeMin: 0.3,
    lifetimeMax: 0.8,
    speedMin: 10,
    speedMax: 30,
    direction: 90,
    directionSpread: 360,
    scaleMin: 0.5,
    scaleMax: 1.5,
    gravityX: 0,
    gravityY: -20,

    startColor: hexToColor('#ffffff'),
    startAlpha: 1,
    endAlpha: 0,
    endScale: 0,

    particleSize: 8,
    blendMode: ParticleBlendMode.Additive,
};

/**
 * 爆炸预设
 * Explosion preset
 */
export const ExplosionPreset: ParticlePreset = {
    name: 'Explosion',
    description: 'Radial burst explosion effect',
    category: PresetCategory.Explosion,
    icon: 'Zap',

    maxParticles: 300,
    looping: false,
    duration: 1,
    playbackSpeed: 1,

    emissionRate: 0, // Burst only
    emissionShape: EmissionShape.Point,
    shapeRadius: 5,
    shapeWidth: 10,
    shapeHeight: 10,
    shapeAngle: 360,

    lifetimeMin: 0.3,
    lifetimeMax: 0.8,
    speedMin: 200,
    speedMax: 400,
    direction: 0,
    directionSpread: 360,
    scaleMin: 0.8,
    scaleMax: 1.2,
    gravityX: 0,
    gravityY: 200,

    startColor: hexToColor('#ffaa00'),
    endColor: hexToColor('#ff4400'),
    startAlpha: 1,
    endAlpha: 0,
    endScale: 0.2,

    particleSize: 12,
    blendMode: ParticleBlendMode.Additive,
};

/**
 * 雨滴预设
 * Rain preset
 */
export const RainPreset: ParticlePreset = {
    name: 'Rain',
    description: 'Falling rain drops',
    category: PresetCategory.Environment,
    icon: 'CloudRain',

    maxParticles: 500,
    looping: true,
    duration: 10,
    playbackSpeed: 1,

    emissionRate: 80,
    emissionShape: EmissionShape.Line,
    shapeRadius: 200,
    shapeWidth: 400,
    shapeHeight: 10,
    shapeAngle: 0,

    lifetimeMin: 0.5,
    lifetimeMax: 1,
    speedMin: 400,
    speedMax: 600,
    direction: -80,
    directionSpread: 5,
    scaleMin: 0.8,
    scaleMax: 1,
    gravityX: 0,
    gravityY: 0,

    startColor: hexToColor('#88ccff'),
    startAlpha: 0.7,
    endAlpha: 0.3,
    endScale: 1,

    particleSize: 6,
    blendMode: ParticleBlendMode.Normal,
};

/**
 * 雪花预设
 * Snow preset
 */
export const SnowPreset: ParticlePreset = {
    name: 'Snow',
    description: 'Gently falling snowflakes',
    category: PresetCategory.Environment,
    icon: 'Snowflake',

    maxParticles: 300,
    looping: true,
    duration: 10,
    playbackSpeed: 1,

    emissionRate: 30,
    emissionShape: EmissionShape.Line,
    shapeRadius: 200,
    shapeWidth: 400,
    shapeHeight: 10,
    shapeAngle: 0,

    lifetimeMin: 3,
    lifetimeMax: 6,
    speedMin: 20,
    speedMax: 50,
    direction: -90,
    directionSpread: 30,
    scaleMin: 0.3,
    scaleMax: 1,
    gravityX: 0,
    gravityY: 0,

    startColor: hexToColor('#ffffff'),
    startAlpha: 0.9,
    endAlpha: 0.5,
    endScale: 1,

    particleSize: 8,
    blendMode: ParticleBlendMode.Normal,
};

/**
 * 魔法光环预设
 * Magic aura preset
 */
export const MagicAuraPreset: ParticlePreset = {
    name: 'Magic Aura',
    description: 'Mystical swirling aura',
    category: PresetCategory.Magic,
    icon: 'Star',

    maxParticles: 100,
    looping: true,
    duration: 5,
    playbackSpeed: 1,

    emissionRate: 20,
    emissionShape: EmissionShape.Circle,
    shapeRadius: 50,
    shapeWidth: 50,
    shapeHeight: 50,
    shapeAngle: 360,

    lifetimeMin: 1,
    lifetimeMax: 2,
    speedMin: 5,
    speedMax: 15,
    direction: 0,
    directionSpread: 360,
    scaleMin: 0.5,
    scaleMax: 1,
    gravityX: 0,
    gravityY: -30,

    startColor: hexToColor('#aa55ff'),
    endColor: hexToColor('#5555ff'),
    startAlpha: 0.8,
    endAlpha: 0,
    endScale: 0.5,

    particleSize: 10,
    blendMode: ParticleBlendMode.Additive,
};

/**
 * 灰尘预设
 * Dust preset
 */
export const DustPreset: ParticlePreset = {
    name: 'Dust',
    description: 'Floating dust particles',
    category: PresetCategory.Environment,
    icon: 'Wind',

    maxParticles: 200,
    looping: true,
    duration: 10,
    playbackSpeed: 1,

    emissionRate: 15,
    emissionShape: EmissionShape.Rectangle,
    shapeRadius: 100,
    shapeWidth: 200,
    shapeHeight: 150,
    shapeAngle: 0,

    lifetimeMin: 4,
    lifetimeMax: 8,
    speedMin: 5,
    speedMax: 15,
    direction: 45,
    directionSpread: 90,
    scaleMin: 0.2,
    scaleMax: 0.6,
    gravityX: 10,
    gravityY: -2,

    startColor: hexToColor('#ccbb99'),
    startAlpha: 0.3,
    endAlpha: 0.1,
    endScale: 1.2,

    particleSize: 4,
    blendMode: ParticleBlendMode.Normal,
};

/**
 * 泡泡预设
 * Bubble preset
 */
export const BubblePreset: ParticlePreset = {
    name: 'Bubbles',
    description: 'Rising soap bubbles',
    category: PresetCategory.Environment,
    icon: 'CircleDot',

    maxParticles: 50,
    looping: true,
    duration: 10,
    playbackSpeed: 1,

    emissionRate: 5,
    emissionShape: EmissionShape.Rectangle,
    shapeRadius: 40,
    shapeWidth: 80,
    shapeHeight: 20,
    shapeAngle: 0,

    lifetimeMin: 2,
    lifetimeMax: 4,
    speedMin: 30,
    speedMax: 60,
    direction: 90,
    directionSpread: 20,
    scaleMin: 0.5,
    scaleMax: 1.5,
    gravityX: 10,
    gravityY: -10,

    startColor: hexToColor('#aaddff'),
    startAlpha: 0.5,
    endAlpha: 0.2,
    endScale: 1.3,

    particleSize: 16,
    blendMode: ParticleBlendMode.Normal,
};

/**
 * 星轨预设
 * Star trail preset
 */
export const StarTrailPreset: ParticlePreset = {
    name: 'Star Trail',
    description: 'Glowing star trail effect',
    category: PresetCategory.Magic,
    icon: 'Sparkle',

    maxParticles: 150,
    looping: true,
    duration: 5,
    playbackSpeed: 1,

    emissionRate: 50,
    emissionShape: EmissionShape.Point,
    shapeRadius: 2,
    shapeWidth: 4,
    shapeHeight: 4,
    shapeAngle: 0,

    lifetimeMin: 0.2,
    lifetimeMax: 0.6,
    speedMin: 5,
    speedMax: 20,
    direction: 180,
    directionSpread: 30,
    scaleMin: 0.8,
    scaleMax: 1.2,
    gravityX: 0,
    gravityY: 0,

    startColor: hexToColor('#ffff88'),
    endColor: hexToColor('#ffaa44'),
    startAlpha: 1,
    endAlpha: 0,
    endScale: 0.1,

    particleSize: 6,
    blendMode: ParticleBlendMode.Additive,
};

/**
 * 默认预设（简单）
 * Default preset (simple)
 */
export const DefaultPreset: ParticlePreset = {
    name: 'Default',
    description: 'Basic particle emitter',
    category: PresetCategory.Basic,
    icon: 'Circle',

    maxParticles: 100,
    looping: true,
    duration: 5,
    playbackSpeed: 1,

    emissionRate: 10,
    emissionShape: EmissionShape.Point,
    shapeRadius: 0,
    shapeWidth: 0,
    shapeHeight: 0,
    shapeAngle: 0,

    lifetimeMin: 1,
    lifetimeMax: 2,
    speedMin: 50,
    speedMax: 100,
    direction: 90,
    directionSpread: 30,
    scaleMin: 1,
    scaleMax: 1,
    gravityX: 0,
    gravityY: 0,

    startColor: hexToColor('#ffffff'),
    startAlpha: 1,
    endAlpha: 0,
    endScale: 1,

    particleSize: 8,
    blendMode: ParticleBlendMode.Normal,
};

/**
 * 漩涡预设
 * Vortex preset
 */
export const VortexPreset: ParticlePreset = {
    name: 'Vortex',
    description: 'Swirling vortex with inward pull',
    category: PresetCategory.Magic,
    icon: 'Tornado',

    maxParticles: 200,
    looping: true,
    duration: 10,
    playbackSpeed: 1,

    emissionRate: 30,
    emissionShape: EmissionShape.Circle,
    shapeRadius: 80,
    shapeWidth: 160,
    shapeHeight: 160,
    shapeAngle: 360,

    lifetimeMin: 2,
    lifetimeMax: 4,
    speedMin: 10,
    speedMax: 30,
    direction: 0,
    directionSpread: 360,
    scaleMin: 0.5,
    scaleMax: 1,
    gravityX: 0,
    gravityY: 0,

    startColor: hexToColor('#88ccff'),
    startAlpha: 0.8,
    endAlpha: 0,
    endScale: 0.3,

    particleSize: 8,
    blendMode: ParticleBlendMode.Additive,

    forceField: {
        type: ForceFieldType.Vortex,
        strength: 150,
        centerX: 0,
        centerY: 0,
        inwardStrength: 30,
    },
};

/**
 * 落叶预设
 * Falling leaves preset
 */
export const LeavesPreset: ParticlePreset = {
    name: 'Leaves',
    description: 'Falling leaves with wind effect',
    category: PresetCategory.Environment,
    icon: 'Leaf',

    maxParticles: 100,
    looping: true,
    duration: 10,
    playbackSpeed: 1,

    emissionRate: 8,
    emissionShape: EmissionShape.Line,
    shapeRadius: 200,
    shapeWidth: 400,
    shapeHeight: 10,
    shapeAngle: 0,

    lifetimeMin: 4,
    lifetimeMax: 8,
    speedMin: 30,
    speedMax: 60,
    direction: -90,
    directionSpread: 20,
    scaleMin: 0.6,
    scaleMax: 1.2,
    gravityX: 0,
    gravityY: 20,

    startColor: hexToColor('#dd8844'),
    startAlpha: 0.9,
    endAlpha: 0.6,
    endScale: 1,

    particleSize: 12,
    blendMode: ParticleBlendMode.Normal,

    forceField: {
        type: ForceFieldType.Turbulence,
        strength: 40,
        frequency: 0.5,
    },
};

/**
 * 弹球预设
 * Bouncing balls preset
 */
export const BouncingPreset: ParticlePreset = {
    name: 'Bouncing',
    description: 'Bouncing particles in a box',
    category: PresetCategory.Basic,
    icon: 'Circle',

    maxParticles: 50,
    looping: true,
    duration: 10,
    playbackSpeed: 1,

    emissionRate: 5,
    emissionShape: EmissionShape.Point,
    shapeRadius: 0,
    shapeWidth: 0,
    shapeHeight: 0,
    shapeAngle: 0,

    lifetimeMin: 8,
    lifetimeMax: 12,
    speedMin: 100,
    speedMax: 200,
    direction: 90,
    directionSpread: 60,
    scaleMin: 0.8,
    scaleMax: 1.2,
    gravityX: 0,
    gravityY: 200,

    startColor: hexToColor('#66aaff'),
    startAlpha: 1,
    endAlpha: 0.8,
    endScale: 1,

    particleSize: 16,
    blendMode: ParticleBlendMode.Normal,

    collision: {
        boundaryType: BoundaryType.Rectangle,
        behavior: CollisionBehavior.Bounce,
        bounceFactor: 0.8,
    },
};

/**
 * 所有预设
 * All presets
 */
export const AllPresets: ParticlePreset[] = [
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
];

/**
 * 按分类获取预设
 * Get presets by category
 */
export function getPresetsByCategory(category: PresetCategory): ParticlePreset[] {
    return AllPresets.filter(p => p.category === category);
}

/**
 * 获取预设名称列表
 * Get preset name list
 */
export function getPresetNames(): string[] {
    return AllPresets.map(p => p.name);
}

/**
 * 按名称获取预设
 * Get preset by name
 */
export function getPresetByName(name: string): ParticlePreset | undefined {
    return AllPresets.find(p => p.name === name);
}
