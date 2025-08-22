/**
 * PRNG工厂类
 * 
 * 提供便捷的静态方法访问全局随机数生成器功能，
 * 作为GlobalRNG的简化接口，便于在代码中使用。
 * 
 * @example
 * ```typescript
 * // 设置种子
 * PRNGFactory.seed(42);
 * 
 * // 创建系统级随机数生成器
 * const rng = PRNGFactory.forSystem('MySystem');
 * 
 * // 创建实体级随机数生成器
 * const entityRng = PRNGFactory.forEntity(123);
 * ```
 */

import { Xoroshiro128 } from './Xoroshiro128';
import { GlobalRNG } from './GlobalRNG';

/**
 * PRNG工厂类
 * 
 * 封装GlobalRNG的功能，提供更简洁的API接口。
 */
export class PRNGFactory {
    /**
     * 设置全局随机数种子
     * 
     * @param seedValue 种子值
     */
    static seed(seedValue: number): void {
        GlobalRNG.seed(seedValue);
    }
    
    /**
     * 为系统创建随机数生成器
     * 
     * @param systemName 系统名称
     * @returns 随机数生成器实例
     */
    static forSystem(systemName: string): Xoroshiro128 {
        return GlobalRNG.forSystem(systemName);
    }
    
    /**
     * 为实体创建随机数生成器
     * 
     * @param entityId 实体ID
     * @returns 随机数生成器实例
     */
    static forEntity(entityId: number): Xoroshiro128 {
        return GlobalRNG.forEntity(entityId);
    }
    
    /**
     * 获取当前全局种子
     * 
     * @returns 全局种子值
     */
    static getGlobalSeed() {
        return GlobalRNG.getGlobalSeed();
    }
}