/**
 * 全局随机数生成器管理模块
 * 
 * 提供统一的随机数管理机制，支持全局种子设置和独立的系统/实体级随机数生成器。
 * 确保可重现的随机数序列，适用于游戏回放和调试场景。
 * 
 * @example
 * ```typescript
 * // 设置全局种子
 * GlobalRNG.seed(12345);
 * 
 * // 为系统创建独立的随机数生成器
 * const aiRng = GlobalRNG.forSystem('AISystem');
 * const movementRng = GlobalRNG.forSystem('MovementSystem');
 * 
 * // 为实体创建独立的随机数生成器
 * const entity1Rng = GlobalRNG.forEntity(1);
 * const entity2Rng = GlobalRNG.forEntity(2);
 * ```
 */

import { BigIntFactory, IBigIntLike } from '../../ECS/Utils/BigIntCompatibility';
import { Xoroshiro128, splitmix64, hashString32 } from './Xoroshiro128';

/**
 * 全局随机数生成器管理器
 * 
 * 管理全局随机数种子，并为不同的系统和实体提供独立的随机数生成器实例。
 * 保证相同种子下的完全可重现性。
 */
export class GlobalRNG {
    /**
     * 全局随机数种子
     * 
     * 默认初始化为固定的64位常量，可通过seed方法修改。
     */
    private static _globalSeed: IBigIntLike = BigIntFactory.fromHexString('9E3779B97F4A7C15');
    
    /**
     * 设置全局随机数种子
     * 
     * 修改全局种子值，影响后续创建的所有随机数生成器。
     * 相同的种子值保证产生相同的随机数序列。
     * 
     * @param seedValue 新的种子值
     */
    static seed(seedValue: number): void {
        this._globalSeed = BigIntFactory.create(seedValue);
    }
    
    /**
     * 获取当前全局种子
     * 
     * @returns 当前的全局种子值
     */
    static getGlobalSeed(): IBigIntLike {
        return this._globalSeed;
    }
    
    /**
     * 为指定系统创建独立的随机数生成器
     * 
     * 根据系统名称和全局种子生成独立的随机数生成器，
     * 确保不同系统之间的随机数序列相互独立。
     * 
     * @param systemName 系统名称
     * @returns 该系统专用的随机数生成器
     */
    static forSystem(systemName: string): Xoroshiro128 {
        const hashedName = hashString32(systemName);
        const seedModifier = BigIntFactory.create(hashedName);
        
        const k0 = splitmix64(this._globalSeed.xor(seedModifier));
        const k1 = splitmix64(k0);
        
        return Xoroshiro128.fromKeys(k0, k1);
    }
    
    /**
     * 为指定实体创建独立的随机数生成器
     * 
     * 根据实体ID和全局种子生成独立的随机数生成器，
     * 确保不同实体之间的随机数序列相互独立。
     * 
     * @param entityId 实体ID
     * @returns 该实体专用的随机数生成器
     */
    static forEntity(entityId: number): Xoroshiro128 {
        const entitySeed = BigIntFactory.create(entityId >>> 0);
        
        const k0 = splitmix64(this._globalSeed.xor(entitySeed));
        const k1 = splitmix64(k0);
        
        return Xoroshiro128.fromKeys(k0, k1);
    }
}