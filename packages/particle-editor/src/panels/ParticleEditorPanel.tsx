/**
 * 粒子编辑器面板
 * Particle Editor Panel
 *
 * Main editor panel for editing .particle files with live preview.
 * 用于编辑 .particle 文件的主编辑器面板，带实时预览。
 */

import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import {
    Play, Pause, RotateCcw, Save, Sparkles, FolderOpen,
    ChevronRight, ChevronDown, Plus, X, Image,
    Maximize2, Minimize2, MousePointer2, Target, Zap
} from 'lucide-react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub, IFileSystemService, IDialogService, AssetRegistryService } from '@esengine/editor-core';
import type { IFileSystem, IDialog } from '@esengine/editor-core';
import {
    EmissionShape,
    ParticleBlendMode,
    SimulationSpace,
    AllPresets,
    getPresetByName,
    type IParticleAsset,
    type IParticleModuleConfig,
    type ParticlePreset,
    createDefaultParticleAsset,
    valueNoise2D,
    ScaleCurveType,
    BoundaryType,
    CollisionBehavior,
    ForceFieldType,
    type ColorKey,
    type ScaleKey,
    type ForceField,
} from '@esengine/particle';
import { PathResolutionService } from '@esengine/asset-system';
import { useParticleEditorStore } from '../stores/ParticleEditorStore';
import { GradientEditor } from '../components/GradientEditor';
import { CurveEditor } from '../components/CurveEditor';
import { TexturePicker } from '../components/TexturePicker';

// 创建路径解析服务实例 | Create path resolution service instance
const pathResolver = new PathResolutionService();

// ============= Types =============

/**
 * 预览粒子数据结构
 * Preview particle data structure
 */
interface PreviewParticle {
    /** 位置X | Position X */
    x: number;
    /** 位置Y | Position Y */
    y: number;
    /** 速度X | Velocity X */
    vx: number;
    /** 速度Y | Velocity Y */
    vy: number;
    /** 加速度X | Acceleration X */
    ax: number;
    /** 加速度Y | Acceleration Y */
    ay: number;
    /** 旋转角度 | Rotation angle */
    rotation: number;
    /** 角速度 | Angular velocity */
    angularVelocity: number;
    /** 缩放X | Scale X */
    scaleX: number;
    /** 缩放Y | Scale Y */
    scaleY: number;
    /** 初始缩放X | Start scale X */
    startScaleX: number;
    /** 初始缩放Y | Start scale Y */
    startScaleY: number;
    /** 颜色R | Color R */
    r: number;
    /** 颜色G | Color G */
    g: number;
    /** 颜色B | Color B */
    b: number;
    /** 透明度 | Alpha */
    alpha: number;
    /** 初始颜色R | Start color R */
    startR: number;
    /** 初始颜色G | Start color G */
    startG: number;
    /** 初始颜色B | Start color B */
    startB: number;
    /** 初始透明度 | Start alpha */
    startAlpha: number;
    /** 当前年龄 | Current age */
    age: number;
    /** 生命时间 | Lifetime */
    lifetime: number;
    /** 初始世界坐标X | Initial world X */
    startWorldX: number;
    /** 初始世界坐标Y | Initial world Y */
    startWorldY: number;
}


/**
 * 爆发配置
 * Burst configuration
 */
interface BurstConfig {
    time: number;
    count: number;
    cycles: number;
    interval: number;
}

// ============= Utility Functions =============

/** 线性插值 | Linear interpolation */
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/** 限制值范围 | Clamp value to range */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/** 随机范围值 | Random value in range */
function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

/** 评估缩放曲线 | Evaluate scale curve */
function evaluateScaleCurve(t: number, curveType: string): number {
    switch (curveType) {
        case 'easeIn':
            return t * t;
        case 'easeOut':
            return 1 - (1 - t) * (1 - t);
        case 'easeInOut':
            return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        case 'linear':
        default:
            return t;
    }
}

/** 评估缩放关键帧 | Evaluate scale keys */
function evaluateScaleKeys(keys: ScaleKey[], normalizedAge: number): number {
    if (keys.length === 0) return 1;
    if (keys.length === 1) return keys[0].scale;

    // 找到当前时间所在的两个关键帧
    let startKey = keys[0];
    let endKey = keys[keys.length - 1];

    for (let i = 0; i < keys.length - 1; i++) {
        if (normalizedAge >= keys[i].time && normalizedAge <= keys[i + 1].time) {
            startKey = keys[i];
            endKey = keys[i + 1];
            break;
        }
    }

    const range = endKey.time - startKey.time;
    const t = range > 0 ? (normalizedAge - startKey.time) / range : 0;
    return lerp(startKey.scale, endKey.scale, t);
}

/** 评估颜色渐变 | Evaluate color gradient */
function evaluateColorGradient(gradient: ColorKey[], normalizedAge: number): ColorKey {
    if (gradient.length === 0) {
        return { time: 0, r: 1, g: 1, b: 1, a: 1 };
    }
    if (gradient.length === 1) {
        return gradient[0];
    }

    let startKey = gradient[0];
    let endKey = gradient[gradient.length - 1];

    for (let i = 0; i < gradient.length - 1; i++) {
        if (normalizedAge >= gradient[i].time && normalizedAge <= gradient[i + 1].time) {
            startKey = gradient[i];
            endKey = gradient[i + 1];
            break;
        }
    }

    const range = endKey.time - startKey.time;
    const t = range > 0 ? (normalizedAge - startKey.time) / range : 0;

    return {
        time: normalizedAge,
        r: lerp(startKey.r, endKey.r, t),
        g: lerp(startKey.g, endKey.g, t),
        b: lerp(startKey.b, endKey.b, t),
        a: lerp(startKey.a, endKey.a, t)
    };
}

// ============= Preview Hook =============

interface PreviewOptions {
    followMouse: boolean;
    mousePosition: { x: number; y: number };
    triggerBurst: number; // 触发爆发的计数器 | Burst trigger counter
}

/**
 * 完整的粒子预览渲染器
 * Complete particle preview renderer
 */
function useParticlePreview(
    canvasRef: React.RefObject<HTMLCanvasElement>,
    data: IParticleAsset | null,
    isPlaying: boolean,
    options: PreviewOptions
) {
    const particlesRef = useRef<PreviewParticle[]>([]);
    const emissionAccumulatorRef = useRef(0);
    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const noiseTimeRef = useRef<number>(0);
    const elapsedTimeRef = useRef<number>(0);
    const burstFiredRef = useRef<Set<number>>(new Set());
    const lastTriggerBurstRef = useRef<number>(0);
    const textureImageRef = useRef<HTMLImageElement | null>(null);
    const textureLoadedRef = useRef<string | null>(null); // 记录已加载的 GUID | Track loaded GUID

    const { followMouse, mousePosition, triggerBurst } = options;

    // 加载纹理图片 | Load texture image
    useEffect(() => {
        const textureGuid = data?.textureGuid;
        if (!textureGuid) {
            textureImageRef.current = null;
            textureLoadedRef.current = null;
            return;
        }

        // 如果已经加载了相同的纹理，跳过 | Skip if same texture already loaded
        if (textureLoadedRef.current === textureGuid) {
            return;
        }

        // 通过 AssetRegistryService 解析 GUID 到路径 | Resolve GUID to path via AssetRegistryService
        const assetRegistry = Core.services.tryResolve(AssetRegistryService) as AssetRegistryService | null;
        if (!assetRegistry) {
            console.warn('[ParticlePreview] AssetRegistryService not available');
            return;
        }

        const metadata = assetRegistry.getAsset(textureGuid);
        if (!metadata) {
            console.warn('[ParticlePreview] Asset not found for GUID:', textureGuid);
            return;
        }

        // 使用 PathResolutionService 将资产路径转换为可加载的 URL
        // Use PathResolutionService to convert asset path to loadable URL
        const textureUrl = pathResolver.catalogToRuntime(metadata.path);

        const img = document.createElement('img');
        img.onload = () => {
            textureImageRef.current = img;
            textureLoadedRef.current = textureGuid;
        };
        img.onerror = () => {
            console.error('[ParticlePreview] Failed to load texture:', textureUrl);
            textureImageRef.current = null;
            textureLoadedRef.current = null;
        };
        img.src = textureUrl;

        return () => {
            // 清理 | Cleanup
            img.onload = null;
            img.onerror = null;
        };
    }, [data?.textureGuid]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 调整画布大小 | Adjust canvas size
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        // 发射器位置 - 跟随鼠标或居中 | Emitter position - follow mouse or center
        const centerX = followMouse ? mousePosition.x : canvas.width / 2;
        const centerY = followMouse ? mousePosition.y : canvas.height / 2;

        // 解析模块配置 | Parse module configurations
        const modules = data.modules || [];
        const colorModule = modules.find(m => m.type === 'ColorOverLifetime');
        const sizeModule = modules.find(m => m.type === 'SizeOverLifetime');
        const noiseModule = modules.find(m => m.type === 'Noise');
        const rotationModule = modules.find(m => m.type === 'RotationOverLifetime');
        const velocityModule = modules.find(m => m.type === 'VelocityOverLifetime');
        const collisionModule = modules.find(m => m.type === 'Collision');
        const forceFieldModule = modules.find(m => m.type === 'ForceField');

        // 颜色渐变 | Color gradient
        const colorGradient: ColorKey[] = colorModule?.enabled && colorModule.params?.gradient
            ? colorModule.params.gradient as ColorKey[]
            : [
                { time: 0, r: 1, g: 1, b: 1, a: 1 },
                { time: 1, r: 1, g: 1, b: 1, a: data.endAlpha }
            ];

        // 缩放曲线 | Scale curve
        const sizeEnabled = sizeModule?.enabled ?? false;
        const scaleKeys: ScaleKey[] = sizeModule?.params?.keys
            ? sizeModule.params.keys as ScaleKey[]
            : [{ time: 0, scale: 1 }, { time: 1, scale: data.endScale }];

        // 噪声参数 | Noise parameters
        const noiseEnabled = noiseModule?.enabled ?? false;
        const noisePositionAmount: number = (noiseModule?.params?.positionAmount as number) ?? 0;
        const noiseVelocityAmount: number = (noiseModule?.params?.velocityAmount as number) ?? 0;
        const noiseRotationAmount: number = (noiseModule?.params?.rotationAmount as number) ?? 0;
        const noiseFrequency: number = (noiseModule?.params?.frequency as number) ?? 1;
        const noiseScrollSpeed: number = (noiseModule?.params?.scrollSpeed as number) ?? 1;

        // 旋转参数 | Rotation parameters
        const rotationEnabled = rotationModule?.enabled ?? false;
        const angularVelocityMultiplierStart: number = (rotationModule?.params?.angularVelocityMultiplierStart as number) ?? 1;
        const angularVelocityMultiplierEnd: number = (rotationModule?.params?.angularVelocityMultiplierEnd as number) ?? 1;
        const additionalRotation: number = (rotationModule?.params?.additionalRotation as number) ?? 0;

        // 速度参数 | Velocity parameters
        const velocityEnabled = velocityModule?.enabled ?? false;
        const linearDrag: number = (velocityModule?.params?.linearDrag as number) ?? 0;
        const speedMultiplierStart: number = (velocityModule?.params?.speedMultiplierStart as number) ?? 1;
        const speedMultiplierEnd: number = (velocityModule?.params?.speedMultiplierEnd as number) ?? 1;
        const orbitalVelocity: number = (velocityModule?.params?.orbitalVelocity as number) ?? 0;
        const radialVelocity: number = (velocityModule?.params?.radialVelocity as number) ?? 0;

        // 碰撞参数 | Collision parameters
        const collisionEnabled = collisionModule?.enabled ?? false;
        const collisionBoundaryType: string = (collisionModule?.params?.boundaryType as string) ?? 'rectangle';
        const collisionBehavior: string = (collisionModule?.params?.behavior as string) ?? 'kill';
        const collisionLeft: number = (collisionModule?.params?.left as number) ?? -200;
        const collisionRight: number = (collisionModule?.params?.right as number) ?? 200;
        const collisionTop: number = (collisionModule?.params?.top as number) ?? -200;
        const collisionBottom: number = (collisionModule?.params?.bottom as number) ?? 200;
        const collisionRadius: number = (collisionModule?.params?.radius as number) ?? 200;
        const collisionBounceFactor: number = (collisionModule?.params?.bounceFactor as number) ?? 0.8;
        const collisionLifeLoss: number = (collisionModule?.params?.lifeLossOnBounce as number) ?? 0;
        const collisionMinVelocity: number = (collisionModule?.params?.minVelocityThreshold as number) ?? 5;

        // 力场参数 | Force field parameters
        const forceFieldEnabled = forceFieldModule?.enabled ?? false;
        const forceFieldType: string = (forceFieldModule?.params?.type as string) ?? 'wind';
        const forceFieldStrength: number = (forceFieldModule?.params?.strength as number) ?? 100;
        const forceFieldDirX: number = (forceFieldModule?.params?.directionX as number) ?? 1;
        const forceFieldDirY: number = (forceFieldModule?.params?.directionY as number) ?? 0;
        const forceFieldPosX: number = (forceFieldModule?.params?.positionX as number) ?? 0;
        const forceFieldPosY: number = (forceFieldModule?.params?.positionY as number) ?? 0;
        const forceFieldRadius: number = (forceFieldModule?.params?.radius as number) ?? 100;
        const forceFieldFalloff: string = (forceFieldModule?.params?.falloff as string) ?? 'linear';
        const forceFieldCenterX: number = (forceFieldModule?.params?.centerX as number) ?? 0;
        const forceFieldCenterY: number = (forceFieldModule?.params?.centerY as number) ?? 0;
        const forceFieldInward: number = (forceFieldModule?.params?.inwardStrength as number) ?? 0;
        const forceFieldFrequency: number = (forceFieldModule?.params?.frequency as number) ?? 1;
        const forceFieldAmplitude: number = (forceFieldModule?.params?.amplitude as number) ?? 50;

        // 爆发配置 | Burst configuration
        const bursts: BurstConfig[] = (data as any).bursts || [];

        /**
         * 获取发射形状偏移
         * Get emission shape offset
         */
        const getShapeOffset = (): [number, number] => {
            const shape = data.emissionShape;
            const radius = data.shapeRadius || 50;
            const width = data.shapeWidth || 100;
            const height = data.shapeHeight || 100;
            const coneAngle = (data.shapeAngle || 30) * Math.PI / 180;
            const direction = (data.direction - 90) * Math.PI / 180;

            switch (shape) {
                case EmissionShape.Point:
                    return [0, 0];

                case EmissionShape.Circle: {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * radius;
                    return [Math.cos(angle) * r, Math.sin(angle) * r];
                }

                case EmissionShape.Ring: {
                    const angle = Math.random() * Math.PI * 2;
                    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
                }

                case EmissionShape.Rectangle: {
                    const x = randomRange(-width / 2, width / 2);
                    const y = randomRange(-height / 2, height / 2);
                    return [x, y];
                }

                case EmissionShape.Edge: {
                    const perimeter = 2 * (width + height);
                    const t = Math.random() * perimeter;

                    if (t < width) {
                        return [t - width / 2, height / 2];
                    } else if (t < width + height) {
                        return [width / 2, height / 2 - (t - width)];
                    } else if (t < 2 * width + height) {
                        return [width / 2 - (t - width - height), -height / 2];
                    } else {
                        return [-width / 2, -height / 2 + (t - 2 * width - height)];
                    }
                }

                case EmissionShape.Line: {
                    const t = Math.random() - 0.5;
                    const cos = Math.cos(direction + Math.PI / 2);
                    const sin = Math.sin(direction + Math.PI / 2);
                    return [cos * width * t, sin * width * t];
                }

                case EmissionShape.Cone: {
                    const angle = direction + randomRange(-coneAngle / 2, coneAngle / 2);
                    const r = Math.random() * radius;
                    return [Math.cos(angle) * r, Math.sin(angle) * r];
                }

                default:
                    return [0, 0];
            }
        };

        /**
         * 发射新粒子
         * Emit new particle
         */
        const emitParticle = () => {
            const lifetime = randomRange(data.lifetimeMin, data.lifetimeMax);
            const speed = randomRange(data.speedMin, data.speedMax);
            const scale = randomRange(data.scaleMin, data.scaleMax);

            const baseAngle = (data.direction - 90) * Math.PI / 180;
            const spreadAngle = randomRange(-0.5, 0.5) * data.directionSpread * Math.PI / 180;
            const angle = baseAngle + spreadAngle;

            const [ox, oy] = getShapeOffset();

            const startRotation = randomRange(0, Math.PI * 2);
            const angularVelocity = randomRange(-1, 1);

            const colorVariance = 0.1;
            const startColor = data.startColor || { r: 1, g: 1, b: 1, a: 1 };

            const worldX = centerX + ox;
            const worldY = centerY + oy;

            const p: PreviewParticle = {
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                ax: data.gravityX || 0,
                ay: data.gravityY || 0,
                rotation: startRotation,
                angularVelocity: angularVelocity,
                scaleX: scale,
                scaleY: scale,
                startScaleX: scale,
                startScaleY: scale,
                r: clamp(startColor.r + randomRange(-colorVariance, colorVariance), 0, 1),
                g: clamp(startColor.g + randomRange(-colorVariance, colorVariance), 0, 1),
                b: clamp(startColor.b + randomRange(-colorVariance, colorVariance), 0, 1),
                alpha: data.startAlpha,
                startR: startColor.r,
                startG: startColor.g,
                startB: startColor.b,
                startAlpha: data.startAlpha,
                age: 0,
                lifetime: lifetime,
                startWorldX: worldX,
                startWorldY: worldY
            };

            particlesRef.current.push(p);
        };

        /**
         * 更新循环
         * Update loop
         */
        const update = (time: number) => {
            const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
            lastTimeRef.current = time;

            const dt = isPlaying ? deltaTime * data.playbackSpeed : 0;
            noiseTimeRef.current += dt * noiseScrollSpeed;

            // 手动触发爆发（点击触发）| Manual burst trigger (click to emit)
            if (triggerBurst !== lastTriggerBurstRef.current) {
                lastTriggerBurstRef.current = triggerBurst;
                // 触发所有 burst 配置 | Trigger all burst configs
                if (bursts.length > 0) {
                    for (const burst of bursts) {
                        for (let j = 0; j < burst.count && particlesRef.current.length < data.maxParticles; j++) {
                            emitParticle();
                        }
                    }
                } else {
                    // 如果没有 burst 配置，发射一些默认粒子 | If no burst config, emit some default particles
                    const defaultCount = Math.min(data.maxParticles, 50);
                    for (let j = 0; j < defaultCount && particlesRef.current.length < data.maxParticles; j++) {
                        emitParticle();
                    }
                }
            }

            if (isPlaying) {
                elapsedTimeRef.current += dt;

                // 持续发射 | Continuous emission
                emissionAccumulatorRef.current += data.emissionRate * dt;
                while (emissionAccumulatorRef.current >= 1 && particlesRef.current.length < data.maxParticles) {
                    emitParticle();
                    emissionAccumulatorRef.current -= 1;
                }

                // 爆发发射 | Burst emission
                for (let i = 0; i < bursts.length; i++) {
                    const burst = bursts[i];
                    if (!burstFiredRef.current.has(i) && elapsedTimeRef.current >= burst.time) {
                        for (let j = 0; j < burst.count && particlesRef.current.length < data.maxParticles; j++) {
                            emitParticle();
                        }
                        burstFiredRef.current.add(i);
                    }
                }

                // 更新粒子 | Update particles
                particlesRef.current = particlesRef.current.filter(p => {
                    p.age += dt;
                    if (p.age >= p.lifetime) return false;

                    const normalizedAge = p.age / p.lifetime;

                    // VelocityOverLifetime 模块 | Velocity module
                    if (velocityEnabled) {
                        // 阻力 | Drag
                        if (linearDrag > 0) {
                            const dragFactor = 1 - linearDrag * dt;
                            p.vx *= dragFactor;
                            p.vy *= dragFactor;
                        }

                        // 轨道速度 | Orbital velocity
                        if (orbitalVelocity !== 0) {
                            const dx = p.x - centerX;
                            const dy = p.y - centerY;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist > 0.001) {
                                const currentAngle = Math.atan2(dy, dx);
                                const newAngle = currentAngle + orbitalVelocity * dt;
                                p.x = centerX + Math.cos(newAngle) * dist;
                                p.y = centerY + Math.sin(newAngle) * dist;
                            }
                        }

                        // 径向速度 | Radial velocity
                        if (radialVelocity !== 0) {
                            const dx = p.x - centerX;
                            const dy = p.y - centerY;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist > 0.001) {
                                const nx = dx / dist;
                                const ny = dy / dist;
                                p.vx += nx * radialVelocity * dt;
                                p.vy += ny * radialVelocity * dt;
                            }
                        }
                    }

                    // 物理更新 | Physics update
                    p.vx += p.ax * dt;
                    p.vy += p.ay * dt;
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;

                    // RotationOverLifetime 模块 | Rotation module
                    if (rotationEnabled) {
                        const multiplier = lerp(angularVelocityMultiplierStart, angularVelocityMultiplierEnd, normalizedAge);
                        p.rotation += p.angularVelocity * multiplier * dt;
                        p.rotation += additionalRotation * dt;
                    } else {
                        p.rotation += p.angularVelocity * dt;
                    }

                    // 颜色渐变 | Color gradient
                    const color = evaluateColorGradient(colorGradient, normalizedAge);
                    p.r = p.startR * color.r;
                    p.g = p.startG * color.g;
                    p.b = p.startB * color.b;
                    p.alpha = p.startAlpha * color.a;

                    // 缩放曲线 | Scale curve
                    if (sizeEnabled) {
                        const scaleMult = evaluateScaleKeys(scaleKeys, normalizedAge);
                        p.scaleX = p.startScaleX * scaleMult;
                        p.scaleY = p.startScaleY * scaleMult;
                    }

                    // 噪声模块 | Noise module
                    if (noiseEnabled) {
                        const noiseX = valueNoise2D(p.x * noiseFrequency + noiseTimeRef.current, p.y * noiseFrequency);
                        const noiseY = valueNoise2D(p.x * noiseFrequency, p.y * noiseFrequency + noiseTimeRef.current);

                        if (noisePositionAmount !== 0) {
                            p.x += noiseX * noisePositionAmount * dt;
                            p.y += noiseY * noisePositionAmount * dt;
                        }
                        if (noiseVelocityAmount !== 0) {
                            p.vx += noiseX * noiseVelocityAmount * dt;
                            p.vy += noiseY * noiseVelocityAmount * dt;
                        }
                        if (noiseRotationAmount !== 0) {
                            p.rotation += noiseX * noiseRotationAmount * dt;
                        }
                    }

                    // 力场模块 | Force field module
                    if (forceFieldEnabled) {
                        switch (forceFieldType) {
                            case 'wind': {
                                // 风力 | Wind force
                                const dirLen = Math.sqrt(forceFieldDirX * forceFieldDirX + forceFieldDirY * forceFieldDirY);
                                if (dirLen > 0.001) {
                                    p.vx += (forceFieldDirX / dirLen) * forceFieldStrength * dt;
                                    p.vy += (forceFieldDirY / dirLen) * forceFieldStrength * dt;
                                }
                                break;
                            }
                            case 'point': {
                                // 吸引/排斥力 | Attraction/repulsion
                                const fieldX = centerX + forceFieldPosX;
                                const fieldY = centerY + forceFieldPosY;
                                const dx = fieldX - p.x;
                                const dy = fieldY - p.y;
                                const distSq = dx * dx + dy * dy;
                                const dist = Math.sqrt(distSq);
                                if (dist > 0.001 && dist < forceFieldRadius) {
                                    let falloffFactor = 1;
                                    if (forceFieldFalloff === 'linear') {
                                        falloffFactor = 1 - dist / forceFieldRadius;
                                    } else if (forceFieldFalloff === 'quadratic') {
                                        falloffFactor = 1 - (distSq / (forceFieldRadius * forceFieldRadius));
                                    }
                                    const force = forceFieldStrength * falloffFactor * dt;
                                    p.vx += (dx / dist) * force;
                                    p.vy += (dy / dist) * force;
                                }
                                break;
                            }
                            case 'vortex': {
                                // 漩涡力 | Vortex force
                                const vcx = centerX + forceFieldCenterX;
                                const vcy = centerY + forceFieldCenterY;
                                const vdx = p.x - vcx;
                                const vdy = p.y - vcy;
                                const vdist = Math.sqrt(vdx * vdx + vdy * vdy);
                                if (vdist > 0.001) {
                                    // 切向力 | Tangential force
                                    const tangentX = -vdy / vdist;
                                    const tangentY = vdx / vdist;
                                    p.vx += tangentX * forceFieldStrength * dt;
                                    p.vy += tangentY * forceFieldStrength * dt;
                                    // 向心力 | Centripetal force
                                    if (forceFieldInward !== 0) {
                                        p.vx -= (vdx / vdist) * forceFieldInward * dt;
                                        p.vy -= (vdy / vdist) * forceFieldInward * dt;
                                    }
                                }
                                break;
                            }
                            case 'turbulence': {
                                // 湍流 | Turbulence
                                const turbNoiseX = Math.sin(p.x * forceFieldFrequency * 0.01 + noiseTimeRef.current * forceFieldFrequency) *
                                    Math.cos(p.y * forceFieldFrequency * 0.013 + noiseTimeRef.current * forceFieldFrequency * 0.7);
                                const turbNoiseY = Math.cos(p.x * forceFieldFrequency * 0.011 + noiseTimeRef.current * forceFieldFrequency * 0.8) *
                                    Math.sin(p.y * forceFieldFrequency * 0.01 + noiseTimeRef.current * forceFieldFrequency);
                                p.vx += turbNoiseX * forceFieldAmplitude * dt;
                                p.vy += turbNoiseY * forceFieldAmplitude * dt;
                                break;
                            }
                        }
                    }

                    // 碰撞模块 | Collision module
                    if (collisionEnabled && collisionBoundaryType !== 'none') {
                        const relX = p.x - centerX;
                        const relY = p.y - centerY;
                        let collision = false;
                        let normalX = 0;
                        let normalY = 0;

                        if (collisionBoundaryType === 'rectangle') {
                            // 矩形边界 | Rectangle boundary
                            if (relX < collisionLeft) {
                                collision = true;
                                normalX = 1;
                                if (collisionBehavior === 'wrap') {
                                    p.x = centerX + collisionRight;
                                } else if (collisionBehavior === 'bounce') {
                                    p.x = centerX + collisionLeft;
                                }
                            } else if (relX > collisionRight) {
                                collision = true;
                                normalX = -1;
                                if (collisionBehavior === 'wrap') {
                                    p.x = centerX + collisionLeft;
                                } else if (collisionBehavior === 'bounce') {
                                    p.x = centerX + collisionRight;
                                }
                            }
                            if (relY < collisionTop) {
                                collision = true;
                                normalY = 1;
                                if (collisionBehavior === 'wrap') {
                                    p.y = centerY + collisionBottom;
                                } else if (collisionBehavior === 'bounce') {
                                    p.y = centerY + collisionTop;
                                }
                            } else if (relY > collisionBottom) {
                                collision = true;
                                normalY = -1;
                                if (collisionBehavior === 'wrap') {
                                    p.y = centerY + collisionTop;
                                } else if (collisionBehavior === 'bounce') {
                                    p.y = centerY + collisionBottom;
                                }
                            }
                        } else if (collisionBoundaryType === 'circle') {
                            // 圆形边界 | Circle boundary
                            const dist = Math.sqrt(relX * relX + relY * relY);
                            if (dist > collisionRadius) {
                                collision = true;
                                if (dist > 0.001) {
                                    normalX = -relX / dist;
                                    normalY = -relY / dist;
                                }
                                if (collisionBehavior === 'wrap') {
                                    p.x = centerX - relX * (collisionRadius / dist) * 0.9;
                                    p.y = centerY - relY * (collisionRadius / dist) * 0.9;
                                } else if (collisionBehavior === 'bounce') {
                                    p.x = centerX + relX * (collisionRadius / dist) * 0.99;
                                    p.y = centerY + relY * (collisionRadius / dist) * 0.99;
                                }
                            }
                        }

                        if (collision) {
                            if (collisionBehavior === 'kill') {
                                return false;
                            } else if (collisionBehavior === 'bounce') {
                                // 反弹 | Bounce
                                if (normalX !== 0) {
                                    p.vx = -p.vx * collisionBounceFactor;
                                }
                                if (normalY !== 0) {
                                    p.vy = -p.vy * collisionBounceFactor;
                                }
                                // 生命损失 | Life loss
                                if (collisionLifeLoss > 0) {
                                    p.lifetime *= (1 - collisionLifeLoss);
                                }
                                // 检查最小速度 | Check minimum velocity
                                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                                if (speed < collisionMinVelocity) {
                                    return false;
                                }
                            }
                            // wrap 已处理位置 | wrap position already handled
                        }
                    }

                    return true;
                });
            }

            // 渲染 | Render
            ctx.fillStyle = '#0a0a12';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 绘制网格背景 | Draw grid background
            ctx.strokeStyle = '#1a1a2a';
            ctx.lineWidth = 1;
            const gridSize = 20;
            for (let x = gridSize; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = gridSize; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // 绘制发射器位置指示 | Draw emitter position indicator
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(centerX - 8, centerY);
            ctx.lineTo(centerX + 8, centerY);
            ctx.moveTo(centerX, centerY - 8);
            ctx.lineTo(centerX, centerY + 8);
            ctx.stroke();

            // 绘制发射形状轮廓 | Draw emission shape outline
            ctx.strokeStyle = '#333';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            switch (data.emissionShape) {
                case EmissionShape.Circle:
                case EmissionShape.Ring:
                    ctx.arc(centerX, centerY, data.shapeRadius || 50, 0, Math.PI * 2);
                    break;
                case EmissionShape.Rectangle:
                case EmissionShape.Edge:
                    ctx.rect(
                        centerX - (data.shapeWidth || 100) / 2,
                        centerY - (data.shapeHeight || 100) / 2,
                        data.shapeWidth || 100,
                        data.shapeHeight || 100
                    );
                    break;
                case EmissionShape.Line: {
                    const dir = (data.direction - 90) * Math.PI / 180;
                    const lineWidth = data.shapeWidth || 100;
                    const cos = Math.cos(dir + Math.PI / 2);
                    const sin = Math.sin(dir + Math.PI / 2);
                    ctx.moveTo(centerX - cos * lineWidth / 2, centerY - sin * lineWidth / 2);
                    ctx.lineTo(centerX + cos * lineWidth / 2, centerY + sin * lineWidth / 2);
                    break;
                }
                case EmissionShape.Cone: {
                    const dir = (data.direction - 90) * Math.PI / 180;
                    const coneAngle = (data.shapeAngle || 30) * Math.PI / 180;
                    const radius = data.shapeRadius || 50;
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(
                        centerX + Math.cos(dir - coneAngle / 2) * radius,
                        centerY + Math.sin(dir - coneAngle / 2) * radius
                    );
                    ctx.arc(centerX, centerY, radius, dir - coneAngle / 2, dir + coneAngle / 2);
                    ctx.lineTo(centerX, centerY);
                    break;
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // 设置混合模式 | Set blend mode
            if (data.blendMode === ParticleBlendMode.Additive) {
                ctx.globalCompositeOperation = 'lighter';
            } else if (data.blendMode === ParticleBlendMode.Multiply) {
                ctx.globalCompositeOperation = 'multiply';
            } else {
                ctx.globalCompositeOperation = 'source-over';
            }

            // 绘制粒子 | Draw particles
            const textureImg = textureImageRef.current;
            for (const p of particlesRef.current) {
                const size = (data.particleSize || 8);
                const r = Math.round(clamp(p.r, 0, 1) * 255);
                const g = Math.round(clamp(p.g, 0, 1) * 255);
                const b = Math.round(clamp(p.b, 0, 1) * 255);

                ctx.globalAlpha = clamp(p.alpha, 0, 1);

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.scale(p.scaleX, p.scaleY);

                // 如果有纹理，绘制纹理图片；否则绘制渐变圆 | Draw texture if available, otherwise gradient circle
                if (textureImg) {
                    // 绘制带颜色调制的纹理 | Draw texture with color modulation
                    const halfSize = size / 2;
                    ctx.drawImage(textureImg, -halfSize, -halfSize, size, size);
                } else {
                    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
                    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
                    gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.6)`);
                    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }

            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';

            // 绘制 UI 信息 | Draw UI info
            ctx.fillStyle = '#666';
            ctx.font = '10px monospace';
            ctx.fillText(`Particles: ${particlesRef.current.length}/${data.maxParticles}`, 6, canvas.height - 20);
            ctx.fillText(`FPS: ${Math.round(1 / deltaTime)}`, 6, canvas.height - 6);

            ctx.fillStyle = isPlaying ? '#4a9' : '#a94';
            ctx.fillText(isPlaying ? 'Playing' : 'Paused', canvas.width - 50, canvas.height - 6);

            if (followMouse) {
                ctx.fillStyle = '#59a';
                ctx.fillText('Mouse Follow', canvas.width - 80, canvas.height - 20);
            }

            // 提示点击触发 | Click to trigger hint
            if (data.emissionRate === 0 || bursts.length > 0) {
                ctx.fillStyle = '#666';
                ctx.fillText('Click to emit', canvas.width - 70, 14);
            }

            animationFrameRef.current = requestAnimationFrame(update);
        };

        animationFrameRef.current = requestAnimationFrame(update);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [canvasRef, data, isPlaying, followMouse, mousePosition, triggerBurst]);

    const reset = useCallback(() => {
        particlesRef.current = [];
        emissionAccumulatorRef.current = 0;
        noiseTimeRef.current = 0;
        lastTimeRef.current = 0;
        elapsedTimeRef.current = 0;
        burstFiredRef.current.clear();
    }, []);

    return { reset };
}

// ============= Property Components =============

interface PropertyInputProps {
    label: string;
    type: 'text' | 'number';
    value: string | number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: any) => void;
}

function PropertyInput({ label, type, value, min, max, step, onChange }: PropertyInputProps) {
    return (
        <div className="property-row">
            <label>{label}</label>
            <input
                type={type}
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            />
        </div>
    );
}

interface PropertyCheckboxProps {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

function PropertyCheckbox({ label, checked, onChange }: PropertyCheckboxProps) {
    return (
        <div className="property-row">
            <label>{label}</label>
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
        </div>
    );
}

interface PropertySelectProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}

function PropertySelect({ label, value, options, onChange }: PropertySelectProps) {
    return (
        <div className="property-row">
            <label>{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)}>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

interface PropertyRangeProps {
    label: string;
    minValue: number;
    maxValue: number;
    min?: number;
    max?: number;
    step?: number;
    onMinChange: (value: number) => void;
    onMaxChange: (value: number) => void;
}

function PropertyRange({ label, minValue, maxValue, min, max, step = 1, onMinChange, onMaxChange }: PropertyRangeProps) {
    return (
        <div className="range-field-row">
            <label>{label}</label>
            <div className="range-field-inputs">
                <span>Min</span>
                <input
                    type="number"
                    value={minValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={e => onMinChange(parseFloat(e.target.value) || 0)}
                />
                <span>Max</span>
                <input
                    type="number"
                    value={maxValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={e => onMaxChange(parseFloat(e.target.value) || 0)}
                />
            </div>
        </div>
    );
}

/**
 * Vector2 输入组件
 * Vector2 input component with X/Y axis indicators
 */
function Vector2Field({
    label,
    x,
    y,
    onXChange,
    onYChange,
    step = 1,
}: {
    label: string;
    x: number;
    y: number;
    onXChange: (value: number) => void;
    onYChange: (value: number) => void;
    step?: number;
}) {
    return (
        <div className="vector-field-row">
            <label>{label}</label>
            <div className="vector-field-inputs">
                <div className="vector-axis-input">
                    <div className="vector-axis-bar x" />
                    <input
                        type="number"
                        value={x}
                        step={step}
                        onChange={e => onXChange(parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div className="vector-axis-input">
                    <div className="vector-axis-bar y" />
                    <input
                        type="number"
                        value={y}
                        step={step}
                        onChange={e => onYChange(parseFloat(e.target.value) || 0)}
                    />
                </div>
            </div>
        </div>
    );
}

// ============= Module Section Component =============

interface ModuleSectionProps {
    name: string;
    enabled: boolean;
    expanded: boolean;
    onToggle: (enabled: boolean) => void;
    onExpandToggle: () => void;
    children: React.ReactNode;
}

function ModuleSection({ name, enabled, expanded, onToggle, onExpandToggle, children }: ModuleSectionProps) {
    return (
        <div className="module-section">
            <div className="module-header" onClick={onExpandToggle}>
                <span className={`module-expand-icon ${expanded ? 'expanded' : ''}`}>
                    <ChevronRight size={12} />
                </span>
                <input
                    type="checkbox"
                    className="module-checkbox"
                    checked={enabled}
                    onChange={e => {
                        e.stopPropagation();
                        onToggle(e.target.checked);
                    }}
                    onClick={e => e.stopPropagation()}
                />
                <span className="module-name">{name}</span>
            </div>
            <div className={`module-content ${expanded ? '' : 'collapsed'}`}>
                {children}
            </div>
        </div>
    );
}

// ============= Property Sections =============

interface PropertySectionProps {
    data: IParticleAsset;
    onChange: <K extends keyof IParticleAsset>(key: K, value: IParticleAsset[K]) => void;
}

interface BasicPropertiesProps extends PropertySectionProps {
    onBrowseTexture?: () => Promise<string | null>;
    /** 通过 GUID 获取资产显示名称 | Get asset display name by GUID */
    resolveGuidToName?: (guid: string) => string | null;
}

function BasicProperties({ data, onChange, onBrowseTexture, resolveGuidToName }: BasicPropertiesProps) {
    // 调试日志 | Debug log

    // 解析 textureGuid 为显示名称 | Resolve textureGuid to display name
    const textureDisplayName = useMemo(() => {
        if (!data.textureGuid) return null;
        if (resolveGuidToName) {
            const name = resolveGuidToName(data.textureGuid);
            return name;
        }
        // 如果没有解析函数，显示 GUID 的前8位 | If no resolver, show first 8 chars of GUID
        return data.textureGuid.substring(0, 8) + '...';
    }, [data.textureGuid, resolveGuidToName]);

    return (
        <div className="property-group">
            <PropertyInput
                label="Name"
                type="text"
                value={data.name}
                onChange={v => onChange('name', v)}
            />
            <TexturePicker
                value={textureDisplayName}
                onChange={() => {/* GUID 通过 onBrowse 设置 | GUID is set via onBrowse */}}
                onBrowse={onBrowseTexture}
            />
            <PropertyInput
                label="Max Particles"
                type="number"
                value={data.maxParticles}
                min={1}
                max={10000}
                onChange={v => onChange('maxParticles', v)}
            />
            <PropertyCheckbox
                label="Looping"
                checked={data.looping}
                onChange={v => onChange('looping', v)}
            />
            <PropertyInput
                label="Duration"
                type="number"
                value={data.duration}
                min={0.1}
                step={0.1}
                onChange={v => onChange('duration', v)}
            />
            <PropertyInput
                label="Prewarm"
                type="number"
                value={(data as any).prewarmTime || 0}
                min={0}
                step={0.1}
                onChange={v => onChange('prewarmTime' as any, v)}
            />
            <PropertyInput
                label="Play Speed"
                type="number"
                value={data.playbackSpeed}
                min={0.01}
                max={10}
                step={0.1}
                onChange={v => onChange('playbackSpeed', v)}
            />
            <PropertySelect
                label="Blend Mode"
                value={data.blendMode}
                options={[
                    { value: ParticleBlendMode.Normal, label: 'Normal' },
                    { value: ParticleBlendMode.Additive, label: 'Additive' },
                    { value: ParticleBlendMode.Multiply, label: 'Multiply' },
                ]}
                onChange={v => onChange('blendMode', v as ParticleBlendMode)}
            />
            <PropertySelect
                label="Space"
                value={(data as any).simulationSpace || SimulationSpace.World}
                options={[
                    { value: SimulationSpace.World, label: 'World' },
                    { value: SimulationSpace.Local, label: 'Local' },
                ]}
                onChange={v => onChange('simulationSpace' as any, v)}
            />
            <PropertyInput
                label="Particle Size"
                type="number"
                value={data.particleSize}
                min={1}
                onChange={v => onChange('particleSize', v)}
            />
            <PropertySelect
                label="Sorting Layer"
                value={data.sortingLayer || 'Default'}
                options={[
                    { value: 'Background', label: 'Background' },
                    { value: 'Default', label: 'Default' },
                    { value: 'Foreground', label: 'Foreground' },
                    { value: 'WorldOverlay', label: 'World Overlay' },
                    { value: 'UI', label: 'UI' },
                    { value: 'ScreenOverlay', label: 'Screen Overlay' },
                    { value: 'Modal', label: 'Modal' },
                ]}
                onChange={v => onChange('sortingLayer', v)}
            />
            <PropertyInput
                label="Order in Layer"
                type="number"
                value={data.orderInLayer ?? 0}
                onChange={v => onChange('orderInLayer', v)}
            />
        </div>
    );
}

function EmissionProperties({ data, onChange }: PropertySectionProps) {
    return (
        <div className="property-group">
            <PropertyInput
                label="Rate"
                type="number"
                value={data.emissionRate}
                min={0}
                onChange={v => onChange('emissionRate', v)}
            />
            <PropertySelect
                label="Shape"
                value={data.emissionShape}
                options={[
                    { value: EmissionShape.Point, label: 'Point' },
                    { value: EmissionShape.Circle, label: 'Circle' },
                    { value: EmissionShape.Ring, label: 'Ring' },
                    { value: EmissionShape.Rectangle, label: 'Rectangle' },
                    { value: EmissionShape.Edge, label: 'Edge' },
                    { value: EmissionShape.Line, label: 'Line' },
                    { value: EmissionShape.Cone, label: 'Cone' },
                ]}
                onChange={v => onChange('emissionShape', v as EmissionShape)}
            />
            {(data.emissionShape === EmissionShape.Circle ||
              data.emissionShape === EmissionShape.Ring ||
              data.emissionShape === EmissionShape.Cone) && (
                <PropertyInput
                    label="Radius"
                    type="number"
                    value={data.shapeRadius}
                    min={0}
                    onChange={v => onChange('shapeRadius', v)}
                />
            )}
            {(data.emissionShape === EmissionShape.Rectangle ||
              data.emissionShape === EmissionShape.Edge ||
              data.emissionShape === EmissionShape.Line) && (
                <>
                    <PropertyInput
                        label="Width"
                        type="number"
                        value={data.shapeWidth}
                        min={0}
                        onChange={v => onChange('shapeWidth', v)}
                    />
                    {data.emissionShape !== EmissionShape.Line && (
                        <PropertyInput
                            label="Height"
                            type="number"
                            value={data.shapeHeight}
                            min={0}
                            onChange={v => onChange('shapeHeight', v)}
                        />
                    )}
                </>
            )}
            {data.emissionShape === EmissionShape.Cone && (
                <PropertyInput
                    label="Cone Angle"
                    type="number"
                    value={data.shapeAngle}
                    min={0}
                    max={360}
                    onChange={v => onChange('shapeAngle', v)}
                />
            )}
        </div>
    );
}

function ParticleProperties({ data, onChange }: PropertySectionProps) {
    return (
        <div className="property-group">
            <PropertyRange
                label="Lifetime"
                minValue={data.lifetimeMin}
                maxValue={data.lifetimeMax}
                min={0.01}
                step={0.1}
                onMinChange={v => onChange('lifetimeMin', v)}
                onMaxChange={v => onChange('lifetimeMax', v)}
            />
            <PropertyRange
                label="Speed"
                minValue={data.speedMin}
                maxValue={data.speedMax}
                min={0}
                onMinChange={v => onChange('speedMin', v)}
                onMaxChange={v => onChange('speedMax', v)}
            />
            <PropertyInput
                label="Direction"
                type="number"
                value={data.direction}
                min={-180}
                max={180}
                onChange={v => onChange('direction', v)}
            />
            <PropertyInput
                label="Spread"
                type="number"
                value={data.directionSpread}
                min={0}
                max={360}
                onChange={v => onChange('directionSpread', v)}
            />
            <PropertyRange
                label="Scale"
                minValue={data.scaleMin}
                maxValue={data.scaleMax}
                min={0.01}
                step={0.1}
                onMinChange={v => onChange('scaleMin', v)}
                onMaxChange={v => onChange('scaleMax', v)}
            />
            <Vector2Field
                label="Gravity"
                x={data.gravityX}
                y={data.gravityY}
                onXChange={v => onChange('gravityX', v)}
                onYChange={v => onChange('gravityY', v)}
            />
        </div>
    );
}

function ColorProperties({ data, onChange }: PropertySectionProps) {
    const hexColor = data.startColor
        ? `#${Math.round(data.startColor.r * 255).toString(16).padStart(2, '0')}${Math.round(data.startColor.g * 255).toString(16).padStart(2, '0')}${Math.round(data.startColor.b * 255).toString(16).padStart(2, '0')}`
        : '#ffffff';

    const handleColorChange = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        onChange('startColor', { r, g, b, a: data.startColor?.a ?? 1 });
    };

    return (
        <div className="property-group">
            <div className="property-row">
                <label>Start Color</label>
                <input
                    type="color"
                    value={hexColor}
                    onChange={e => handleColorChange(e.target.value)}
                />
            </div>
            <PropertyInput
                label="Start Alpha"
                type="number"
                value={data.startAlpha}
                min={0}
                max={1}
                step={0.01}
                onChange={v => onChange('startAlpha', v)}
            />
            <PropertyInput
                label="End Alpha"
                type="number"
                value={data.endAlpha}
                min={0}
                max={1}
                step={0.01}
                onChange={v => onChange('endAlpha', v)}
            />
            <PropertyInput
                label="End Scale"
                type="number"
                value={data.endScale}
                min={0}
                step={0.1}
                onChange={v => onChange('endScale', v)}
            />
        </div>
    );
}

// ============= Modules Properties =============

interface ModulesPropertiesProps {
    data: IParticleAsset;
    onModuleChange: (moduleType: string, params: Record<string, unknown>) => void;
    onModuleToggle: (moduleType: string, enabled: boolean) => void;
}

function ModulesProperties({ data, onModuleChange, onModuleToggle }: ModulesPropertiesProps) {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['ColorOverLifetime', 'SizeOverLifetime']));

    const modules = data.modules || [];

    const getModule = (type: string): IParticleModuleConfig | undefined => {
        return modules.find(m => m.type === type);
    };

    const toggleExpand = (type: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(type)) {
                next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
    };

    const colorModule = getModule('ColorOverLifetime');
    const sizeModule = getModule('SizeOverLifetime');
    const velocityModule = getModule('VelocityOverLifetime');
    const rotationModule = getModule('RotationOverLifetime');
    const noiseModule = getModule('Noise');
    const collisionModule = getModule('Collision');
    const forceFieldModule = getModule('ForceField');

    // 颜色渐变数据 | Color gradient data
    const colorGradient: ColorKey[] = (colorModule?.params?.gradient as ColorKey[]) ?? [
        { time: 0, r: 1, g: 1, b: 1, a: 1 },
        { time: 1, r: 1, g: 1, b: 1, a: 0 }
    ];

    // 缩放曲线数据 | Scale curve data
    const scaleKeys: ScaleKey[] = (sizeModule?.params?.keys as ScaleKey[]) ?? [
        { time: 0, scale: 1 },
        { time: 1, scale: 0 }
    ];

    const scaleCurveType = (sizeModule?.params?.curveType as ScaleCurveType) ?? ScaleCurveType.Linear;

    return (
        <div className="property-group">
            {/* Color Over Lifetime */}
            <ModuleSection
                name="Color Over Lifetime"
                enabled={colorModule?.enabled ?? false}
                expanded={expandedModules.has('ColorOverLifetime')}
                onToggle={enabled => onModuleToggle('ColorOverLifetime', enabled)}
                onExpandToggle={() => toggleExpand('ColorOverLifetime')}
            >
                <GradientEditor
                    colorKeys={colorGradient}
                    onChange={keys => onModuleChange('ColorOverLifetime', { ...colorModule?.params, gradient: keys })}
                />
            </ModuleSection>

            {/* Size Over Lifetime */}
            <ModuleSection
                name="Size Over Lifetime"
                enabled={sizeModule?.enabled ?? false}
                expanded={expandedModules.has('SizeOverLifetime')}
                onToggle={enabled => onModuleToggle('SizeOverLifetime', enabled)}
                onExpandToggle={() => toggleExpand('SizeOverLifetime')}
            >
                <CurveEditor
                    keys={scaleKeys}
                    onChange={keys => onModuleChange('SizeOverLifetime', { ...sizeModule?.params, keys })}
                    curveType={scaleCurveType}
                    onCurveTypeChange={type => onModuleChange('SizeOverLifetime', { ...sizeModule?.params, curveType: type })}
                    minY={0}
                    maxY={2}
                />
            </ModuleSection>

            {/* Velocity Over Lifetime */}
            <ModuleSection
                name="Velocity Over Lifetime"
                enabled={velocityModule?.enabled ?? false}
                expanded={expandedModules.has('VelocityOverLifetime')}
                onToggle={enabled => onModuleToggle('VelocityOverLifetime', enabled)}
                onExpandToggle={() => toggleExpand('VelocityOverLifetime')}
            >
                <PropertyInput
                    label="Drag"
                    type="number"
                    value={(velocityModule?.params?.linearDrag as number) ?? 0}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={v => onModuleChange('VelocityOverLifetime', { ...velocityModule?.params, linearDrag: v })}
                />
                <PropertyInput
                    label="Orbital"
                    type="number"
                    value={(velocityModule?.params?.orbitalVelocity as number) ?? 0}
                    step={0.1}
                    onChange={v => onModuleChange('VelocityOverLifetime', { ...velocityModule?.params, orbitalVelocity: v })}
                />
                <PropertyInput
                    label="Radial"
                    type="number"
                    value={(velocityModule?.params?.radialVelocity as number) ?? 0}
                    step={1}
                    onChange={v => onModuleChange('VelocityOverLifetime', { ...velocityModule?.params, radialVelocity: v })}
                />
            </ModuleSection>

            {/* Rotation Over Lifetime */}
            <ModuleSection
                name="Rotation Over Lifetime"
                enabled={rotationModule?.enabled ?? false}
                expanded={expandedModules.has('RotationOverLifetime')}
                onToggle={enabled => onModuleToggle('RotationOverLifetime', enabled)}
                onExpandToggle={() => toggleExpand('RotationOverLifetime')}
            >
                <PropertyInput
                    label="Start Mult"
                    type="number"
                    value={(rotationModule?.params?.angularVelocityMultiplierStart as number) ?? 1}
                    step={0.1}
                    onChange={v => onModuleChange('RotationOverLifetime', { ...rotationModule?.params, angularVelocityMultiplierStart: v })}
                />
                <PropertyInput
                    label="End Mult"
                    type="number"
                    value={(rotationModule?.params?.angularVelocityMultiplierEnd as number) ?? 1}
                    step={0.1}
                    onChange={v => onModuleChange('RotationOverLifetime', { ...rotationModule?.params, angularVelocityMultiplierEnd: v })}
                />
                <PropertyInput
                    label="Additional"
                    type="number"
                    value={(rotationModule?.params?.additionalRotation as number) ?? 0}
                    step={0.1}
                    onChange={v => onModuleChange('RotationOverLifetime', { ...rotationModule?.params, additionalRotation: v })}
                />
            </ModuleSection>

            {/* Noise */}
            <ModuleSection
                name="Noise"
                enabled={noiseModule?.enabled ?? false}
                expanded={expandedModules.has('Noise')}
                onToggle={enabled => onModuleToggle('Noise', enabled)}
                onExpandToggle={() => toggleExpand('Noise')}
            >
                <PropertyInput
                    label="Position"
                    type="number"
                    value={(noiseModule?.params?.positionAmount as number) ?? 0}
                    step={1}
                    onChange={v => onModuleChange('Noise', { ...noiseModule?.params, positionAmount: v })}
                />
                <PropertyInput
                    label="Velocity"
                    type="number"
                    value={(noiseModule?.params?.velocityAmount as number) ?? 0}
                    step={1}
                    onChange={v => onModuleChange('Noise', { ...noiseModule?.params, velocityAmount: v })}
                />
                <PropertyInput
                    label="Rotation"
                    type="number"
                    value={(noiseModule?.params?.rotationAmount as number) ?? 0}
                    step={0.1}
                    onChange={v => onModuleChange('Noise', { ...noiseModule?.params, rotationAmount: v })}
                />
                <PropertyInput
                    label="Frequency"
                    type="number"
                    value={(noiseModule?.params?.frequency as number) ?? 1}
                    min={0.01}
                    step={0.1}
                    onChange={v => onModuleChange('Noise', { ...noiseModule?.params, frequency: v })}
                />
                <PropertyInput
                    label="Scroll"
                    type="number"
                    value={(noiseModule?.params?.scrollSpeed as number) ?? 1}
                    step={0.1}
                    onChange={v => onModuleChange('Noise', { ...noiseModule?.params, scrollSpeed: v })}
                />
            </ModuleSection>

            {/* Collision */}
            <ModuleSection
                name="Collision"
                enabled={collisionModule?.enabled ?? false}
                expanded={expandedModules.has('Collision')}
                onToggle={enabled => onModuleToggle('Collision', enabled)}
                onExpandToggle={() => toggleExpand('Collision')}
            >
                <PropertySelect
                    label="Boundary"
                    value={(collisionModule?.params?.boundaryType as string) ?? BoundaryType.Rectangle}
                    options={[
                        { value: BoundaryType.None, label: 'None' },
                        { value: BoundaryType.Rectangle, label: 'Rectangle' },
                        { value: BoundaryType.Circle, label: 'Circle' },
                    ]}
                    onChange={v => onModuleChange('Collision', { ...collisionModule?.params, boundaryType: v })}
                />
                <PropertySelect
                    label="Behavior"
                    value={(collisionModule?.params?.behavior as string) ?? CollisionBehavior.Kill}
                    options={[
                        { value: CollisionBehavior.Kill, label: 'Kill' },
                        { value: CollisionBehavior.Bounce, label: 'Bounce' },
                        { value: CollisionBehavior.Wrap, label: 'Wrap' },
                    ]}
                    onChange={v => onModuleChange('Collision', { ...collisionModule?.params, behavior: v })}
                />
                {((collisionModule?.params?.boundaryType as string) ?? BoundaryType.Rectangle) === BoundaryType.Rectangle && (
                    <>
                        <PropertyInput
                            label="Left"
                            type="number"
                            value={(collisionModule?.params?.left as number) ?? -200}
                            onChange={v => onModuleChange('Collision', { ...collisionModule?.params, left: v })}
                        />
                        <PropertyInput
                            label="Right"
                            type="number"
                            value={(collisionModule?.params?.right as number) ?? 200}
                            onChange={v => onModuleChange('Collision', { ...collisionModule?.params, right: v })}
                        />
                        <PropertyInput
                            label="Top"
                            type="number"
                            value={(collisionModule?.params?.top as number) ?? -200}
                            onChange={v => onModuleChange('Collision', { ...collisionModule?.params, top: v })}
                        />
                        <PropertyInput
                            label="Bottom"
                            type="number"
                            value={(collisionModule?.params?.bottom as number) ?? 200}
                            onChange={v => onModuleChange('Collision', { ...collisionModule?.params, bottom: v })}
                        />
                    </>
                )}
                {((collisionModule?.params?.boundaryType as string) ?? BoundaryType.Rectangle) === BoundaryType.Circle && (
                    <PropertyInput
                        label="Radius"
                        type="number"
                        value={(collisionModule?.params?.radius as number) ?? 200}
                        min={1}
                        onChange={v => onModuleChange('Collision', { ...collisionModule?.params, radius: v })}
                    />
                )}
                {((collisionModule?.params?.behavior as string) ?? CollisionBehavior.Kill) === CollisionBehavior.Bounce && (
                    <>
                        <PropertyInput
                            label="Bounce"
                            type="number"
                            value={(collisionModule?.params?.bounceFactor as number) ?? 0.8}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={v => onModuleChange('Collision', { ...collisionModule?.params, bounceFactor: v })}
                        />
                        <PropertyInput
                            label="Life Loss"
                            type="number"
                            value={(collisionModule?.params?.lifeLossOnBounce as number) ?? 0}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={v => onModuleChange('Collision', { ...collisionModule?.params, lifeLossOnBounce: v })}
                        />
                    </>
                )}
            </ModuleSection>

            {/* Force Field */}
            <ModuleSection
                name="Force Field"
                enabled={forceFieldModule?.enabled ?? false}
                expanded={expandedModules.has('ForceField')}
                onToggle={enabled => onModuleToggle('ForceField', enabled)}
                onExpandToggle={() => toggleExpand('ForceField')}
            >
                <PropertySelect
                    label="Type"
                    value={(forceFieldModule?.params?.type as string) ?? ForceFieldType.Wind}
                    options={[
                        { value: ForceFieldType.Wind, label: 'Wind' },
                        { value: ForceFieldType.Point, label: 'Point' },
                        { value: ForceFieldType.Vortex, label: 'Vortex' },
                        { value: ForceFieldType.Turbulence, label: 'Turbulence' },
                    ]}
                    onChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, type: v })}
                />
                <PropertyInput
                    label="Strength"
                    type="number"
                    value={(forceFieldModule?.params?.strength as number) ?? 100}
                    onChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, strength: v })}
                />
                {((forceFieldModule?.params?.type as string) ?? ForceFieldType.Wind) === ForceFieldType.Wind && (
                    <Vector2Field
                        label="Direction"
                        x={(forceFieldModule?.params?.directionX as number) ?? 1}
                        y={(forceFieldModule?.params?.directionY as number) ?? 0}
                        onXChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, directionX: v })}
                        onYChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, directionY: v })}
                        step={0.1}
                    />
                )}
                {((forceFieldModule?.params?.type as string) ?? ForceFieldType.Wind) === ForceFieldType.Point && (
                    <>
                        <Vector2Field
                            label="Position"
                            x={(forceFieldModule?.params?.positionX as number) ?? 0}
                            y={(forceFieldModule?.params?.positionY as number) ?? 0}
                            onXChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, positionX: v })}
                            onYChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, positionY: v })}
                        />
                        <PropertyInput
                            label="Radius"
                            type="number"
                            value={(forceFieldModule?.params?.radius as number) ?? 100}
                            min={1}
                            onChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, radius: v })}
                        />
                        <PropertySelect
                            label="Falloff"
                            value={(forceFieldModule?.params?.falloff as string) ?? 'linear'}
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'linear', label: 'Linear' },
                                { value: 'quadratic', label: 'Quadratic' },
                            ]}
                            onChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, falloff: v })}
                        />
                    </>
                )}
                {((forceFieldModule?.params?.type as string) ?? ForceFieldType.Wind) === ForceFieldType.Vortex && (
                    <>
                        <Vector2Field
                            label="Center"
                            x={(forceFieldModule?.params?.centerX as number) ?? 0}
                            y={(forceFieldModule?.params?.centerY as number) ?? 0}
                            onXChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, centerX: v })}
                            onYChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, centerY: v })}
                        />
                        <PropertyInput
                            label="Inward"
                            type="number"
                            value={(forceFieldModule?.params?.inwardStrength as number) ?? 0}
                            onChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, inwardStrength: v })}
                        />
                    </>
                )}
                {((forceFieldModule?.params?.type as string) ?? ForceFieldType.Wind) === ForceFieldType.Turbulence && (
                    <>
                        <PropertyInput
                            label="Frequency"
                            type="number"
                            value={(forceFieldModule?.params?.frequency as number) ?? 1}
                            min={0.01}
                            step={0.1}
                            onChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, frequency: v })}
                        />
                        <PropertyInput
                            label="Amplitude"
                            type="number"
                            value={(forceFieldModule?.params?.amplitude as number) ?? 50}
                            onChange={v => onModuleChange('ForceField', { ...forceFieldModule?.params, amplitude: v })}
                        />
                    </>
                )}
            </ModuleSection>
        </div>
    );
}

// ============= Burst Properties =============

interface BurstPropertiesProps {
    bursts: BurstConfig[];
    onBurstsChange: (bursts: BurstConfig[]) => void;
}

function BurstProperties({ bursts, onBurstsChange }: BurstPropertiesProps) {
    const addBurst = () => {
        onBurstsChange([...bursts, { time: 0, count: 10, cycles: 1, interval: 0 }]);
    };

    const removeBurst = (index: number) => {
        onBurstsChange(bursts.filter((_, i) => i !== index));
    };

    const updateBurst = (index: number, field: keyof BurstConfig, value: number) => {
        const newBursts = [...bursts];
        newBursts[index] = { ...newBursts[index], [field]: value };
        onBurstsChange(newBursts);
    };

    return (
        <div className="burst-list">
            {bursts.map((burst, index) => (
                <div key={index} className="burst-item">
                    <span className="burst-item-label">T:</span>
                    <input
                        type="number"
                        value={burst.time}
                        min={0}
                        step={0.1}
                        onChange={e => updateBurst(index, 'time', parseFloat(e.target.value) || 0)}
                        title="Time"
                    />
                    <span className="burst-item-label">N:</span>
                    <input
                        type="number"
                        value={burst.count}
                        min={1}
                        onChange={e => updateBurst(index, 'count', parseInt(e.target.value) || 1)}
                        title="Count"
                    />
                    <button
                        className="burst-remove-btn"
                        onClick={() => removeBurst(index)}
                        title="Remove"
                    >
                        <X size={10} />
                    </button>
                </div>
            ))}
            <button className="burst-add-btn" onClick={addBurst}>
                <Plus size={12} /> Add Burst
            </button>
        </div>
    );
}

// ============= Helper Functions =============

function presetToAsset(preset: ParticlePreset): Partial<IParticleAsset> {
    const modules: IParticleModuleConfig[] = [];

    // 添加碰撞模块 | Add collision module
    if (preset.collision) {
        modules.push({
            type: 'Collision',
            enabled: true,
            params: {
                boundaryType: preset.collision.boundaryType,
                behavior: preset.collision.behavior,
                radius: preset.collision.radius,
                bounceFactor: preset.collision.bounceFactor,
                left: -200,
                right: 200,
                top: -200,
                bottom: 200,
            },
        });
    }

    // 添加力场模块 | Add force field module
    if (preset.forceField) {
        modules.push({
            type: 'ForceField',
            enabled: true,
            params: {
                type: preset.forceField.type,
                strength: preset.forceField.strength,
                directionX: preset.forceField.directionX,
                directionY: preset.forceField.directionY,
                centerX: preset.forceField.centerX,
                centerY: preset.forceField.centerY,
                inwardStrength: preset.forceField.inwardStrength,
                frequency: preset.forceField.frequency,
            },
        });
    }

    return {
        maxParticles: preset.maxParticles,
        looping: preset.looping,
        duration: preset.duration,
        playbackSpeed: preset.playbackSpeed,
        emissionRate: preset.emissionRate,
        emissionShape: preset.emissionShape,
        shapeRadius: preset.shapeRadius,
        shapeWidth: preset.shapeWidth,
        shapeHeight: preset.shapeHeight,
        shapeAngle: preset.shapeAngle,
        lifetimeMin: preset.lifetimeMin,
        lifetimeMax: preset.lifetimeMax,
        speedMin: preset.speedMin,
        speedMax: preset.speedMax,
        direction: preset.direction,
        directionSpread: preset.directionSpread,
        scaleMin: preset.scaleMin,
        scaleMax: preset.scaleMax,
        gravityX: preset.gravityX,
        gravityY: preset.gravityY,
        startColor: preset.startColor,
        startAlpha: preset.startAlpha,
        endAlpha: preset.endAlpha,
        endScale: preset.endScale,
        particleSize: preset.particleSize,
        blendMode: preset.blendMode,
        modules: modules.length > 0 ? modules : undefined,
    };
}

// ============= Main Component =============

/**
 * 粒子编辑器面板组件
 * Particle editor panel component
 */
export function ParticleEditorPanel() {
    // 从 Store 获取所有状态和 actions | Get all state and actions from Store
    const {
        filePath,
        pendingFilePath,
        particleData,
        isDirty,
        isPlaying,
        isLoading,
        selectedPreset,
        activeTab,
        isFullscreen,
        followMouse,
        burstTrigger,
        setParticleData,
        updateProperty,
        setPlaying,
        setSelectedPreset,
        createNew,
        setActiveTab,
        toggleFullscreen,
        toggleFollowMouse,
        triggerBurst: storeTriggerBurst,
        loadFile: storeLoadFile,
        saveFile: storeSaveFile,
        markSaved,
    } = useParticleEditorStore();

    // mousePosition 保留为本地状态，因为更新频率极高 | Keep mousePosition as local state due to high update frequency
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // 预览选项 | Preview options
    const previewOptions = useMemo<PreviewOptions>(() => ({
        followMouse,
        mousePosition,
        triggerBurst: burstTrigger,
    }), [followMouse, mousePosition, burstTrigger]);

    const { reset: resetPreview } = useParticlePreview(previewCanvasRef, particleData, isPlaying, previewOptions);

    // 处理鼠标移动 | Handle mouse move
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!followMouse) return;
        const canvas = previewCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    }, [followMouse]);

    // 处理待打开文件 | Handle pending file - 使用 subscribeWithSelector 替代 useEffect
    // Using store subscription instead of useEffect
    useEffect(() => {
        if (pendingFilePath) {
            const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
            if (fileSystem) {
                storeLoadFile(pendingFilePath, fileSystem);
            }
        }
    }, [pendingFilePath, storeLoadFile]);

    // 保存处理 | Save handler - 使用 Store action
    const handleSave = useCallback(async () => {
        const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
        if (!fileSystem) return;

        const dialog = Core.services.tryResolve(IDialogService) as IDialog | null;
        const success = await storeSaveFile(
            fileSystem,
            dialog ? { saveDialog: (opts) => dialog.saveDialog(opts) } : undefined
        );

        if (success) {
            const messageHub = Core.services.tryResolve(MessageHub);
            if (messageHub) {
                messageHub.publish('assets:refresh', {});
            }
        }
    }, [storeSaveFile]);

    // 面板容器 ref | Panel container ref
    const panelRef = useRef<HTMLDivElement>(null);

    // 自动获取焦点以接收键盘事件 | Auto focus to receive keyboard events
    useEffect(() => {
        // 延迟获取焦点，确保面板已挂载 | Delay focus to ensure panel is mounted
        const timer = setTimeout(() => {
            panelRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // 点击面板时获取焦点 | Focus on panel click
    const handlePanelClick = useCallback(() => {
        panelRef.current?.focus();
    }, []);

    // 键盘快捷键处理 | Keyboard shortcut handler
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            e.stopPropagation();
            // 阻止原生事件传播到全局处理器 | Stop native event from reaching global handler
            e.nativeEvent.stopImmediatePropagation();
            handleSave();
        }
    }, [handleSave]);

    const handleOpen = useCallback(async () => {
        const dialog = Core.services.tryResolve(IDialogService) as IDialog | null;
        if (!dialog) return;

        const path = await dialog.openDialog({
            title: 'Open Particle Effect',
            filters: [{ name: 'Particle Effect', extensions: ['particle', 'particle.json'] }],
        });

        if (path && typeof path === 'string') {
            const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
            if (fileSystem) {
                await storeLoadFile(path, fileSystem);
            }
        }
    }, [storeLoadFile]);

    const handleBrowseTexture = useCallback(async (): Promise<string | null> => {
        const dialog = Core.services.tryResolve(IDialogService) as IDialog | null;
        if (!dialog) return null;

        const path = await dialog.openDialog({
            title: 'Select Particle Texture',
            filters: [{ name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
        });

        if (path && typeof path === 'string') {
            // 将路径转换为 GUID | Convert path to GUID
            const assetRegistry = Core.services.tryResolve(AssetRegistryService) as AssetRegistryService | null;
            if (assetRegistry) {
                const relativePath = assetRegistry.absoluteToRelative(path);
                if (relativePath) {
                    const guid = assetRegistry.getGuidByPath(relativePath);
                    if (guid) {
                        // 设置 textureGuid | Set textureGuid
                        updateProperty('textureGuid', guid);
                        return guid;
                    }
                }
            }
            // 如果无法获取 GUID，返回 null | Return null if cannot get GUID
            console.warn('[ParticleEditor] Failed to get GUID for texture path:', path);
            return null;
        }
        return null;
    }, [updateProperty]);

    // 通过 GUID 获取资产显示名称 | Get asset display name by GUID
    const resolveGuidToName = useCallback((guid: string): string | null => {
        const assetRegistry = Core.services.tryResolve(AssetRegistryService) as AssetRegistryService | null;
        if (!assetRegistry) return null;

        const metadata = assetRegistry.getAsset(guid);
        if (metadata) {
            return metadata.name;
        }
        // 如果找不到，返回 GUID 前8位 | If not found, return first 8 chars of GUID
        return guid.substring(0, 8) + '...';
    }, []);

    const handleApplyPreset = useCallback(async (presetName: string) => {
        const preset = getPresetByName(presetName);
        if (!preset || !particleData) return;

        const assetData = presetToAsset(preset);

        // 对于爆炸类预设（emissionRate=0），自动添加 burst 配置
        // For explosion-type presets (emissionRate=0), auto-add burst config
        if (preset.emissionRate === 0) {
            (assetData as any).bursts = [
                {
                    time: 0,
                    count: Math.min(preset.maxParticles, 100),
                    cycles: 1,
                    interval: 0,
                }
            ];
        }

        setParticleData({
            ...particleData,
            ...assetData,
        });
        setSelectedPreset(presetName);

        // 重置预览 | Reset preview
        resetPreview();

        // 自动保存（如果已有文件路径）| Auto-save if file path exists
        if (filePath) {
            const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
            if (fileSystem) {
                const newData = { ...particleData, ...assetData };
                if (preset.emissionRate === 0) {
                    (newData as any).bursts = (assetData as any).bursts;
                }
                try {
                    await fileSystem.writeFile(filePath, JSON.stringify(newData, null, 2));
                    // 标记为已保存 | Mark as saved
                    markSaved();
                    // 通知资产刷新 | Notify asset refresh
                    const messageHub = Core.services.tryResolve(MessageHub);
                    messageHub?.publish('assets:refresh', {});
                } catch (error) {
                    console.error('[ParticleEditor] Auto-save failed:', error);
                }
            }
        }
    }, [particleData, filePath, setParticleData, setSelectedPreset, resetPreview, markSaved]);

    const handleNew = useCallback(() => {
        createNew();
    }, [createNew]);

    const handleTogglePlay = useCallback(() => {
        setPlaying(!isPlaying);
    }, [isPlaying, setPlaying]);

    const handleReset = useCallback(() => {
        setPlaying(false);
        resetPreview();
    }, [setPlaying, resetPreview]);

    const handleModuleChange = useCallback((moduleType: string, params: Record<string, unknown>) => {
        if (!particleData) return;

        const modules = [...(particleData.modules || [])];
        const index = modules.findIndex(m => m.type === moduleType);

        if (index >= 0) {
            modules[index] = { ...modules[index], params };
        } else {
            modules.push({ type: moduleType, enabled: true, params });
        }

        setParticleData({ ...particleData, modules });
    }, [particleData, setParticleData]);

    const handleModuleToggle = useCallback((moduleType: string, enabled: boolean) => {
        if (!particleData) return;

        const modules = [...(particleData.modules || [])];
        const index = modules.findIndex(m => m.type === moduleType);

        if (index >= 0) {
            modules[index] = { ...modules[index], enabled };
        } else {
            modules.push({ type: moduleType, enabled, params: {} });
        }

        setParticleData({ ...particleData, modules });
    }, [particleData, setParticleData]);

    const handleBurstsChange = useCallback((bursts: BurstConfig[]) => {
        if (!particleData) return;
        setParticleData({ ...particleData, bursts } as IParticleAsset);
    }, [particleData, setParticleData]);

    if (!particleData) {
        return (
            <div className="particle-editor-empty">
                <Sparkles size={48} />
                <h3>Particle Editor</h3>
                <p>Double-click a .particle file to open, or create a new effect</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button onClick={handleNew} className="editor-button primary">
                        <Sparkles size={16} />
                        New Effect
                    </button>
                    <button onClick={handleOpen} className="editor-button">
                        <FolderOpen size={16} />
                        Open File
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={panelRef}
            className="particle-editor-panel"
            tabIndex={0}
            onKeyDownCapture={handleKeyDown}
            onClick={handlePanelClick}
        >
            {/* Toolbar */}
            <div className="particle-editor-toolbar">
                <div className="toolbar-left">
                    <button onClick={handleNew} title="New">
                        <Sparkles size={14} />
                    </button>
                    <button onClick={handleOpen} title="Open">
                        <FolderOpen size={14} />
                    </button>
                    <button onClick={handleSave} title="Save" disabled={!isDirty}>
                        <Save size={14} />
                    </button>
                    <span className="separator" />
                    <button onClick={handleTogglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={handleReset} title="Reset">
                        <RotateCcw size={14} />
                    </button>
                </div>
                <div className="toolbar-right">
                    <span className="file-name">
                        {filePath ? filePath.split(/[\\/]/).pop() : 'Unsaved'}
                        {isDirty && ' *'}
                    </span>
                </div>
            </div>

            <div className="particle-editor-content">
                {/* Preview Area */}
                <div
                    ref={previewContainerRef}
                    className={`particle-preview-area ${isFullscreen ? 'fullscreen' : ''}`}
                >
                    {/* 预览控制栏 | Preview control bar */}
                    <div className="preview-controls">
                        <button
                            className="preview-control-btn burst-btn"
                            onClick={storeTriggerBurst}
                            title="Trigger Burst (Click canvas also works)"
                        >
                            <Zap size={14} />
                            <span>Emit</span>
                        </button>
                        <div className="preview-control-separator" />
                        <button
                            className={`preview-control-btn ${followMouse ? 'active' : ''}`}
                            onClick={toggleFollowMouse}
                            title="Mouse Follow Mode"
                        >
                            <MousePointer2 size={14} />
                        </button>
                        <button
                            className="preview-control-btn"
                            onClick={() => setMousePosition({ x: 0, y: 0 })}
                            title="Center Emitter"
                        >
                            <Target size={14} />
                        </button>
                        <div className="preview-control-separator" />
                        <button
                            className="preview-control-btn"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                    </div>
                    <canvas
                        ref={previewCanvasRef}
                        className="particle-preview-canvas"
                        onMouseMove={handleMouseMove}
                        onClick={(e) => {
                            const canvas = previewCanvasRef.current;
                            if (!canvas) return;
                            const rect = canvas.getBoundingClientRect();
                            // 更新鼠标位置 | Update mouse position
                            if (!followMouse) {
                                setMousePosition({
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top,
                                });
                            }
                            // 触发爆发 | Trigger burst
                            storeTriggerBurst();
                        }}
                    />
                </div>

                {/* Properties Panel */}
                <div className="particle-properties-panel">
                    {/* Preset Selector */}
                    <div className="property-section">
                        <div className="section-header">Presets</div>
                        <div className="preset-grid">
                            {AllPresets.map(preset => (
                                <button
                                    key={preset.name}
                                    className={`preset-button ${selectedPreset === preset.name ? 'selected' : ''}`}
                                    onClick={() => handleApplyPreset(preset.name)}
                                    title={preset.description}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="property-tabs">
                        <button
                            className={activeTab === 'basic' ? 'active' : ''}
                            onClick={() => setActiveTab('basic')}
                        >
                            Basic
                        </button>
                        <button
                            className={activeTab === 'emission' ? 'active' : ''}
                            onClick={() => setActiveTab('emission')}
                        >
                            Emit
                        </button>
                        <button
                            className={activeTab === 'particle' ? 'active' : ''}
                            onClick={() => setActiveTab('particle')}
                        >
                            Particle
                        </button>
                        <button
                            className={activeTab === 'color' ? 'active' : ''}
                            onClick={() => setActiveTab('color')}
                        >
                            Color
                        </button>
                        <button
                            className={activeTab === 'modules' ? 'active' : ''}
                            onClick={() => setActiveTab('modules')}
                        >
                            Modules
                        </button>
                        <button
                            className={activeTab === 'burst' ? 'active' : ''}
                            onClick={() => setActiveTab('burst')}
                        >
                            Burst
                        </button>
                    </div>

                    {/* Property Content */}
                    <div className="property-content">
                        {activeTab === 'basic' && (
                            <BasicProperties
                                data={particleData}
                                onChange={updateProperty}
                                onBrowseTexture={handleBrowseTexture}
                                resolveGuidToName={resolveGuidToName}
                            />
                        )}
                        {activeTab === 'emission' && (
                            <EmissionProperties data={particleData} onChange={updateProperty} />
                        )}
                        {activeTab === 'particle' && (
                            <ParticleProperties data={particleData} onChange={updateProperty} />
                        )}
                        {activeTab === 'color' && (
                            <ColorProperties data={particleData} onChange={updateProperty} />
                        )}
                        {activeTab === 'modules' && (
                            <ModulesProperties
                                data={particleData}
                                onModuleChange={handleModuleChange}
                                onModuleToggle={handleModuleToggle}
                            />
                        )}
                        {activeTab === 'burst' && (
                            <BurstProperties
                                bursts={(particleData as any).bursts || []}
                                onBurstsChange={handleBurstsChange}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
