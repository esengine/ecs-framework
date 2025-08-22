/**
 * PRNG模块统一导出
 * 
 * 导出所有PRNG相关的类、函数和便捷接口，
 * 提供完整的伪随机数生成器功能。
 * 
 * @example
 * ```typescript
 * import { seed, forSystem, forEntity, Xoroshiro128 } from '@esengine/ecs-framework';
 * 
 * // 设置全局种子
 * seed(12345);
 * 
 * // 创建系统随机数生成器
 * const systemRng = forSystem('AISystem');
 * 
 * // 创建实体随机数生成器
 * const entityRng = forEntity(1);
 * 
 * // 生成随机数
 * const randomValue = systemRng.nextFloat();
 * ```
 */

export { Xoroshiro128, splitmix64, hashString32 } from './Xoroshiro128';
export { GlobalRNG } from './GlobalRNG';
export { PRNGFactory } from './PRNGFactory';

import { PRNGFactory as Factory } from './PRNGFactory';

/**
 * 设置全局随机数种子的便捷函数
 */
export const seed = Factory.seed;

/**
 * 为系统创建随机数生成器的便捷函数
 */
export const forSystem = Factory.forSystem;

/**
 * 为实体创建随机数生成器的便捷函数
 */
export const forEntity = Factory.forEntity;