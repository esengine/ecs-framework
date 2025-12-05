import type { Particle } from '../Particle';

/**
 * 粒子模块接口
 * Particle module interface
 *
 * Modules modify particle properties over their lifetime.
 * 模块在粒子生命周期内修改粒子属性。
 */
export interface IParticleModule {
    /** 模块名称 | Module name */
    readonly name: string;

    /** 是否启用 | Whether enabled */
    enabled: boolean;

    /**
     * 更新粒子
     * Update particle
     *
     * @param p - Particle to update
     * @param dt - Delta time in seconds
     * @param normalizedAge - Age / Lifetime (0-1)
     */
    update(p: Particle, dt: number, normalizedAge: number): void;
}
