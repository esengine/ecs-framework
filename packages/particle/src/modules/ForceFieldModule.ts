import type { Particle } from '../Particle';
import type { IParticleModule } from './IParticleModule';

/**
 * 力场类型
 * Force field type
 */
export enum ForceFieldType {
    /** 风力（方向性力）| Wind (directional force) */
    Wind = 'wind',
    /** 吸引/排斥点 | Attraction/repulsion point */
    Point = 'point',
    /** 漩涡 | Vortex */
    Vortex = 'vortex',
    /** 湍流 | Turbulence */
    Turbulence = 'turbulence'
}

/**
 * 力场配置
 * Force field configuration
 */
export interface ForceField {
    /** 力场类型 | Force field type */
    type: ForceFieldType;
    /** 启用 | Enabled */
    enabled: boolean;
    /** 强度 | Strength */
    strength: number;

    // 风力参数 | Wind parameters
    /** 风向 X | Wind direction X */
    directionX?: number;
    /** 风向 Y | Wind direction Y */
    directionY?: number;

    // 点力场参数 | Point force parameters
    /** 力场位置 X（相对于发射器）| Position X (relative to emitter) */
    positionX?: number;
    /** 力场位置 Y（相对于发射器）| Position Y (relative to emitter) */
    positionY?: number;
    /** 影响半径 | Influence radius */
    radius?: number;
    /** 衰减类型 | Falloff type */
    falloff?: 'none' | 'linear' | 'quadratic';

    // 漩涡参数 | Vortex parameters
    /** 漩涡轴心 X | Vortex center X */
    centerX?: number;
    /** 漩涡轴心 Y | Vortex center Y */
    centerY?: number;
    /** 向内拉力 | Inward pull strength */
    inwardStrength?: number;

    // 湍流参数 | Turbulence parameters
    /** 湍流频率 | Turbulence frequency */
    frequency?: number;
    /** 湍流振幅 | Turbulence amplitude */
    amplitude?: number;
}

/**
 * 创建默认力场配置
 * Create default force field
 */
export function createDefaultForceField(type: ForceFieldType): ForceField {
    const base = {
        type,
        enabled: true,
        strength: 100,
    };

    switch (type) {
        case ForceFieldType.Wind:
            return { ...base, directionX: 1, directionY: 0 };
        case ForceFieldType.Point:
            return { ...base, positionX: 0, positionY: 0, radius: 100, falloff: 'linear' as const };
        case ForceFieldType.Vortex:
            return { ...base, centerX: 0, centerY: 0, inwardStrength: 0 };
        case ForceFieldType.Turbulence:
            return { ...base, frequency: 1, amplitude: 50 };
        default:
            return base;
    }
}

/**
 * 力场模块
 * Force field module for applying external forces to particles
 */
export class ForceFieldModule implements IParticleModule {
    readonly name = 'ForceField';
    enabled = true;

    /** 力场列表 | Force field list */
    forceFields: ForceField[] = [];

    /** 发射器位置（运行时设置）| Emitter position (set at runtime) */
    emitterX: number = 0;
    emitterY: number = 0;

    /** 时间累计（用于湍流）| Time accumulator (for turbulence) */
    private _time: number = 0;

    /**
     * 添加力场
     * Add force field
     */
    addForceField(field: ForceField): void {
        this.forceFields.push(field);
    }

    /**
     * 添加风力
     * Add wind force
     */
    addWind(directionX: number, directionY: number, strength: number = 100): ForceField {
        const field: ForceField = {
            type: ForceFieldType.Wind,
            enabled: true,
            strength,
            directionX,
            directionY,
        };
        this.forceFields.push(field);
        return field;
    }

    /**
     * 添加吸引/排斥点
     * Add attraction/repulsion point
     */
    addAttractor(x: number, y: number, strength: number = 100, radius: number = 100): ForceField {
        const field: ForceField = {
            type: ForceFieldType.Point,
            enabled: true,
            strength, // 正数=吸引，负数=排斥 | positive=attract, negative=repel
            positionX: x,
            positionY: y,
            radius,
            falloff: 'linear',
        };
        this.forceFields.push(field);
        return field;
    }

    /**
     * 添加漩涡
     * Add vortex
     */
    addVortex(x: number, y: number, strength: number = 100, inwardStrength: number = 0): ForceField {
        const field: ForceField = {
            type: ForceFieldType.Vortex,
            enabled: true,
            strength,
            centerX: x,
            centerY: y,
            inwardStrength,
        };
        this.forceFields.push(field);
        return field;
    }

    /**
     * 添加湍流
     * Add turbulence
     */
    addTurbulence(strength: number = 50, frequency: number = 1): ForceField {
        const field: ForceField = {
            type: ForceFieldType.Turbulence,
            enabled: true,
            strength,
            frequency,
            amplitude: strength,
        };
        this.forceFields.push(field);
        return field;
    }

    /**
     * 清除所有力场
     * Clear all force fields
     */
    clearForceFields(): void {
        this.forceFields = [];
    }

    update(p: Particle, dt: number, _normalizedAge: number): void {
        this._time += dt;

        for (const field of this.forceFields) {
            if (!field.enabled) continue;

            switch (field.type) {
                case ForceFieldType.Wind:
                    this._applyWind(p, field, dt);
                    break;
                case ForceFieldType.Point:
                    this._applyPointForce(p, field, dt);
                    break;
                case ForceFieldType.Vortex:
                    this._applyVortex(p, field, dt);
                    break;
                case ForceFieldType.Turbulence:
                    this._applyTurbulence(p, field, dt);
                    break;
            }
        }
    }

    /**
     * 应用风力
     * Apply wind force
     */
    private _applyWind(p: Particle, field: ForceField, dt: number): void {
        const dx = field.directionX ?? 1;
        const dy = field.directionY ?? 0;
        // 归一化方向 | Normalize direction
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0.001) {
            p.vx += (dx / len) * field.strength * dt;
            p.vy += (dy / len) * field.strength * dt;
        }
    }

    /**
     * 应用点力场（吸引/排斥）
     * Apply point force (attraction/repulsion)
     */
    private _applyPointForce(p: Particle, field: ForceField, dt: number): void {
        const fieldX = this.emitterX + (field.positionX ?? 0);
        const fieldY = this.emitterY + (field.positionY ?? 0);
        const radius = field.radius ?? 100;

        const dx = fieldX - p.x;
        const dy = fieldY - p.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist < 0.001 || dist > radius) return;

        // 计算衰减 | Calculate falloff
        let falloffFactor = 1;
        switch (field.falloff) {
            case 'linear':
                falloffFactor = 1 - dist / radius;
                break;
            case 'quadratic':
                falloffFactor = 1 - (distSq / (radius * radius));
                break;
            // 'none' - no falloff
        }

        // 归一化方向并应用力 | Normalize direction and apply force
        const force = field.strength * falloffFactor * dt;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
    }

    /**
     * 应用漩涡力
     * Apply vortex force
     */
    private _applyVortex(p: Particle, field: ForceField, dt: number): void {
        const centerX = this.emitterX + (field.centerX ?? 0);
        const centerY = this.emitterY + (field.centerY ?? 0);

        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.001) return;

        // 切向力（旋转）| Tangential force (rotation)
        const tangentX = -dy / dist;
        const tangentY = dx / dist;
        p.vx += tangentX * field.strength * dt;
        p.vy += tangentY * field.strength * dt;

        // 向心力（可选）| Centripetal force (optional)
        const inward = field.inwardStrength ?? 0;
        if (inward !== 0) {
            p.vx -= (dx / dist) * inward * dt;
            p.vy -= (dy / dist) * inward * dt;
        }
    }

    /**
     * 应用湍流
     * Apply turbulence
     */
    private _applyTurbulence(p: Particle, field: ForceField, dt: number): void {
        const freq = field.frequency ?? 1;
        const amp = field.amplitude ?? field.strength;

        // 使用简单的正弦波噪声 | Use simple sine wave noise
        const noiseX = Math.sin(p.x * freq * 0.01 + this._time * freq) *
                       Math.cos(p.y * freq * 0.013 + this._time * freq * 0.7);
        const noiseY = Math.cos(p.x * freq * 0.011 + this._time * freq * 0.8) *
                       Math.sin(p.y * freq * 0.01 + this._time * freq);

        p.vx += noiseX * amp * dt;
        p.vy += noiseY * amp * dt;
    }
}
