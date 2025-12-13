/**
 * 粒子效果资源加载器
 * Particle effect asset loader
 */

import type {
    IAssetLoader,
    IAssetContent,
    IAssetParseContext,
    AssetContentType
} from '@esengine/asset-system';
import { SortingLayers } from '@esengine/engine-core';
import { EmissionShape, type ColorValue } from '../ParticleEmitter';
import { ParticleBlendMode } from '../ParticleSystemComponent';

/**
 * 粒子资产类型常量
 * Particle asset type constant
 */
export const ParticleAssetType = 'particle';

/**
 * 粒子模块配置
 * Particle module configuration
 */
export interface IParticleModuleConfig {
    /** 模块类型 | Module type */
    type: string;
    /** 是否启用 | Enabled */
    enabled: boolean;
    /** 模块参数 | Module parameters */
    params: Record<string, unknown>;
}

/**
 * 爆发配置
 * Burst configuration
 */
export interface IBurstConfig {
    /** 触发时间（秒）| Trigger time (seconds) */
    time: number;
    /** 发射数量 | Particle count */
    count: number;
    /** 循环次数（0=无限）| Number of cycles (0=infinite) */
    cycles: number;
    /** 循环间隔（秒）| Interval between cycles (seconds) */
    interval: number;
}

/**
 * 粒子效果资源数据接口
 * Particle effect asset data interface
 */
export interface IParticleAsset {
    /** 资源版本 | Asset version */
    version: number;
    /** 效果名称 | Effect name */
    name: string;
    /** 效果描述 | Effect description */
    description?: string;

    // 基础属性 | Basic properties
    /** 最大粒子数 | Maximum particles */
    maxParticles: number;
    /** 是否循环 | Looping */
    looping: boolean;
    /** 持续时间 | Duration in seconds */
    duration: number;
    /** 播放速度 | Playback speed */
    playbackSpeed: number;
    /** 启动时自动播放 | Auto play on start */
    playOnAwake: boolean;

    // 发射属性 | Emission properties
    /** 发射速率 | Emission rate */
    emissionRate: number;
    /** 发射形状 | Emission shape */
    emissionShape: EmissionShape;
    /** 形状半径 | Shape radius */
    shapeRadius: number;
    /** 形状宽度 | Shape width */
    shapeWidth: number;
    /** 形状高度 | Shape height */
    shapeHeight: number;
    /** 圆锥角度 | Cone angle */
    shapeAngle: number;

    // 粒子属性 | Particle properties
    /** 生命时间最小值 | Lifetime min */
    lifetimeMin: number;
    /** 生命时间最大值 | Lifetime max */
    lifetimeMax: number;
    /** 速度最小值 | Speed min */
    speedMin: number;
    /** 速度最大值 | Speed max */
    speedMax: number;
    /** 发射方向（度数）| Direction in degrees */
    direction: number;
    /** 方向扩散（度数）| Direction spread in degrees */
    directionSpread: number;
    /** 缩放最小值 | Scale min */
    scaleMin: number;
    /** 缩放最大值 | Scale max */
    scaleMax: number;
    /** 重力 X | Gravity X */
    gravityX: number;
    /** 重力 Y | Gravity Y */
    gravityY: number;

    // 颜色属性 | Color properties
    /** 起始颜色 | Start color */
    startColor: ColorValue;
    /** 起始透明度 | Start alpha */
    startAlpha: number;
    /** 结束透明度 | End alpha */
    endAlpha: number;
    /** 结束缩放 | End scale */
    endScale: number;

    // 渲染属性 | Rendering properties
    /** 粒子大小 | Particle size */
    particleSize: number;
    /** 混合模式 | Blend mode */
    blendMode: ParticleBlendMode;
    /**
     * 排序层名称
     * Sorting layer name
     */
    sortingLayer: string;
    /**
     * 层内排序顺序
     * Order within the sorting layer
     */
    orderInLayer: number;
    /** 纹理资产 GUID | Texture asset GUID */
    textureGuid?: string;

    // 模块配置 | Module configurations
    /** 模块列表 | Module list */
    modules?: IParticleModuleConfig[];

    // 爆发配置 | Burst configurations
    /** 爆发列表 | Burst list */
    bursts?: IBurstConfig[];

    // 纹理动画（可选）| Texture animation (optional)
    /** 纹理图集列数 | Texture sheet columns */
    textureTilesX?: number;
    /** 纹理图集行数 | Texture sheet rows */
    textureTilesY?: number;
    /** 动画帧率 | Animation frame rate */
    textureAnimationFPS?: number;
}

/**
 * 创建默认粒子资源数据
 * Create default particle asset data
 */
export function createDefaultParticleAsset(name: string = 'New Particle'): IParticleAsset {
    return {
        version: 1,
        name,
        description: '',

        maxParticles: 100,
        looping: true,
        duration: 5,
        playbackSpeed: 1,
        playOnAwake: true,

        emissionRate: 10,
        emissionShape: EmissionShape.Point,
        shapeRadius: 0,
        shapeWidth: 0,
        shapeHeight: 0,
        shapeAngle: 30,

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

        startColor: { r: 1, g: 1, b: 1, a: 1 },
        startAlpha: 1,
        endAlpha: 0,
        endScale: 1,

        particleSize: 8,
        blendMode: ParticleBlendMode.Normal,
        sortingLayer: SortingLayers.Default,
        orderInLayer: 0,

        modules: [],
    };
}

/**
 * 粒子效果加载器实现
 * Particle effect loader implementation
 */
export class ParticleLoader implements IAssetLoader<IParticleAsset> {
    readonly supportedType = ParticleAssetType;
    readonly supportedExtensions = ['.particle', '.particle.json'];
    readonly contentType: AssetContentType = 'text';

    /**
     * 从文本内容解析粒子资源
     * Parse particle asset from text content
     */
    async parse(content: IAssetContent, _context: IAssetParseContext): Promise<IParticleAsset> {
        if (!content.text) {
            throw new Error('Particle content is empty');
        }

        const jsonData = JSON.parse(content.text) as IParticleAsset;

        // 验证必要字段 | Validate required fields
        if (jsonData.maxParticles === undefined) {
            throw new Error('Invalid particle format: missing maxParticles');
        }

        // 填充默认值 | Fill default values
        const defaults = createDefaultParticleAsset();
        return { ...defaults, ...jsonData };
    }

    /**
     * 释放已加载的资源
     * Dispose loaded asset
     */
    dispose(asset: IParticleAsset): void {
        // 清理模块引用 | Clean up module references
        if (asset.modules) {
            asset.modules.length = 0;
        }
    }
}
