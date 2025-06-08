/**
 * 统一的WASM ECS核心模块
 * 
 * 为小游戏优化的高性能ECS引擎，提供简洁的API和自动回退机制
 * 适用于NPM包发布和多种部署环境
 * 
 */

/** 实体ID类型 */
export type EntityId = number;

/** 组件掩码类型 */
export type ComponentMask = bigint;

/** 查询结果接口 */
export interface QueryResult {
    /** 查询到的实体ID数组 */
    entities: Uint32Array;
    /** 实体数量 */
    count: number;
}

/** 性能统计接口 */
export interface PerformanceStats {
    /** 实体总数 */
    entityCount: number;
    /** 索引数量 */
    indexCount: number;
    /** 查询次数 */
    queryCount: number;
    /** 更新次数 */
    updateCount: number;
    /** 是否使用WASM */
    wasmEnabled: boolean;
}

/** WASM模块类型定义 */
interface WasmEcsCoreInstance {
    create_entity(): number;
    destroy_entity(entity_id: number): boolean;
    update_entity_mask(entity_id: number, mask: bigint): void;
    batch_update_masks(entity_ids: Uint32Array, masks: BigUint64Array): void;
    query_entities(mask: bigint, max_results: number): number;
    get_query_result_count(): number;
    query_cached(mask: bigint): number;
    get_cached_query_count(mask: bigint): number;
    query_multiple_components(masks: BigUint64Array, max_results: number): number;
    query_with_exclusion(include_mask: bigint, exclude_mask: bigint, max_results: number): number;
    get_entity_mask(entity_id: number): bigint;
    entity_exists(entity_id: number): boolean;
    get_entity_count(): number;
    get_performance_stats(): Array<any>;
    clear(): void;
    rebuild_query_cache(): void;
    free?(): void;
}

interface WasmModule {
    EcsCore: new () => WasmEcsCoreInstance;
    create_component_mask: (componentIds: Uint32Array) => ComponentMask;
    mask_contains_component: (mask: ComponentMask, componentId: number) => boolean;
    default: (input?: any) => Promise<any>;
    initSync?: (input: any) => any;
    memory?: WebAssembly.Memory;
}

/**
 * 统一的WASM ECS核心类
 * 
 * 提供高性能的ECS操作，自动选择WASM或JavaScript实现
 * 针对小游戏场景优化，易于使用且性能卓越
 * 支持NPM包发布和多种部署环境
 */
export class WasmEcsCore {
    /** WASM核心实例 */
    private wasmCore: WasmEcsCoreInstance | null = null;
    /** WASM模块 */
    private wasmModule: WasmModule | null = null;
    /** 是否已初始化 */
    private initialized = false;
    /** 是否使用WASM */
    private usingWasm = false;
    private silent = false;

    
    // JavaScript回退实现
    private jsEntityMasks = new Map<EntityId, ComponentMask>();
    private jsNextEntityId = 1;
    private jsQueryCount = 0;
    private jsUpdateCount = 0;

    /**
     * 设置静默模式
     */
    public setSilent(silent: boolean): void {
        this.silent = silent;
    }

    /**
     * 初始化ECS核心
     * 
     * 尝试加载WASM模块，失败时自动回退到JavaScript实现
     * 
     * @returns 初始化是否成功
     */
    async initialize(): Promise<boolean> {
        if (this.initialized) return true;

        if (!this.silent) {
            console.log('🔄 初始化ECS核心...');
        }

        try {
            // 尝试从bin目录加载WASM模块
            const wasmPath = '../../bin/wasm/ecs_wasm_core';
            if (!this.silent) {
                console.log(`🔍 尝试加载WASM模块: ${wasmPath}`);
                console.log(`📁 当前文件位置: ${typeof __filename !== 'undefined' ? __filename : 'unknown'}`);
                console.log(`📂 工作目录: ${typeof process !== 'undefined' ? process.cwd() : 'unknown'}`);
                
                // 计算绝对路径
                if (typeof __filename !== 'undefined' && typeof require !== 'undefined') {
                    const path = require('path');
                    const fs = require('fs');
                    const currentDir = path.dirname(__filename);
                    const absoluteWasmPath = path.resolve(currentDir, wasmPath);
                    console.log(`📍 计算的绝对路径: ${absoluteWasmPath}`);
                    
                    // 检查文件是否存在
                    const jsFile = absoluteWasmPath + '.js';
                    const wasmFile = path.resolve(currentDir, '../../bin/wasm/ecs_wasm_core_bg.wasm');
                    console.log(`📄 检查JS文件: ${jsFile} - ${fs.existsSync(jsFile) ? '存在' : '不存在'}`);
                    console.log(`📄 检查WASM文件: ${wasmFile} - ${fs.existsSync(wasmFile) ? '存在' : '不存在'}`);
                }
            }
            
            this.wasmModule = await import(wasmPath);
            
            if (!this.silent) {
                console.log('✅ WASM模块导入成功，正在初始化...');
            }
            
            if (this.wasmModule) {
                // 在初始化前，先检查.wasm文件的加载路径
                if (!this.silent) {
                    console.log('🔍 WASM模块将尝试加载 .wasm 文件...');
                    // 模拟WASM模块内部的路径计算
                    if (typeof __filename !== 'undefined' && typeof require !== 'undefined') {
                        const path = require('path');
                        const { pathToFileURL } = require('url');
                        const currentDir = path.dirname(__filename);
                        const wasmJsFile = path.resolve(currentDir, '../../bin/wasm/ecs_wasm_core.js');
                        const wasmBgFile = path.resolve(currentDir, '../../bin/wasm/ecs_wasm_core_bg.wasm');
                        const wasmJsUrl = pathToFileURL(wasmJsFile).href;
                        const expectedWasmUrl = new URL('ecs_wasm_core_bg.wasm', wasmJsUrl).href;
                        console.log(`📍 WASM JS文件URL: ${wasmJsUrl}`);
                        console.log(`📍 预期的.wasm文件URL: ${expectedWasmUrl}`);
                        console.log(`📍 实际.wasm文件路径: ${wasmBgFile}`);
                        
                        const fs = require('fs');
                        console.log(`📄 .wasm文件是否存在: ${fs.existsSync(wasmBgFile) ? '存在' : '不存在'}`);
                    }
                }
                
                // 在Node.js环境中，需要手动读取WASM文件
                if (typeof require !== 'undefined') {
                    const fs = require('fs');
                    const path = require('path');
                    const currentDir = path.dirname(__filename);
                    const wasmPath = path.resolve(currentDir, '../../bin/wasm/ecs_wasm_core_bg.wasm');
                    
                    if (!this.silent) {
                        console.log(`🔧 在Node.js环境中手动加载WASM文件: ${wasmPath}`);
                    }
                    
                    if (fs.existsSync(wasmPath)) {
                        const wasmBytes = fs.readFileSync(wasmPath);
                        // 使用initSync同步初始化WASM模块
                        if (this.wasmModule.initSync) {
                            this.wasmModule.initSync(wasmBytes);
                        } else {
                            await this.wasmModule.default({ module_or_path: wasmBytes });
                        }
                    } else {
                        throw new Error(`WASM文件不存在: ${wasmPath}`);
                    }
                } else {
                    await this.wasmModule.default();
                }
                
                this.wasmCore = new this.wasmModule.EcsCore();
            }
            this.usingWasm = true;
            
            if (!this.silent) {
                console.log('✅ WASM模块加载成功');
            }
        } catch (error) {
            if (!this.silent) {
                console.warn('⚠️ WASM加载失败，使用JavaScript实现');
                console.warn(`❌ 错误详情: ${error}`);
            }
            this.usingWasm = false;
        }

        this.initialized = true;
        if (!this.silent) {
            console.log(`🎮 ECS核心初始化完成 (${this.usingWasm ? 'WASM' : 'JavaScript'})`);
        }
        return true;
    }

    /**
     * 创建新实体
     * 
     * @returns 新实体的ID
     */
    createEntity(): EntityId {
        this.ensureInitialized();
        
        if (this.usingWasm && this.wasmCore) {
            return this.wasmCore.create_entity();
        } else {
            const entityId = this.jsNextEntityId++;
            this.jsEntityMasks.set(entityId, BigInt(0));
            return entityId;
        }
    }

    /**
     * 删除实体
     * 
     * @param entityId 实体ID
     * @returns 是否删除成功
     */
    destroyEntity(entityId: EntityId): boolean {
        this.ensureInitialized();
        
        if (this.usingWasm && this.wasmCore) {
            return this.wasmCore.destroy_entity(entityId);
        } else {
            return this.jsEntityMasks.delete(entityId);
        }
    }

    /**
     * 更新实体的组件掩码
     * 
     * @param entityId 实体ID
     * @param mask 组件掩码
     */
    updateEntityMask(entityId: EntityId, mask: ComponentMask): void {
        this.ensureInitialized();
        
        if (this.usingWasm && this.wasmCore) {
            this.wasmCore.update_entity_mask(entityId, mask);
        } else {
            this.jsEntityMasks.set(entityId, mask);
            this.jsUpdateCount++;
        }
    }

    /**
     * 批量更新实体掩码（高性能）
     * 
     * @param entityIds 实体ID数组
     * @param masks 组件掩码数组
     */
    batchUpdateMasks(entityIds: EntityId[], masks: ComponentMask[]): void {
        this.ensureInitialized();
        
        if (entityIds.length !== masks.length) {
            throw new Error('实体ID和掩码数组长度必须相同');
        }

        if (this.usingWasm && this.wasmCore) {
            const entityIdsArray = new Uint32Array(entityIds);
            const masksArray = new BigUint64Array(masks);
            this.wasmCore.batch_update_masks(entityIdsArray, masksArray);
        } else {
            for (let i = 0; i < entityIds.length; i++) {
                this.jsEntityMasks.set(entityIds[i], masks[i]);
            }
            this.jsUpdateCount += entityIds.length;
        }
    }

    /**
     * 查询包含指定组件的实体
     * 
     * @param mask 组件掩码
     * @param maxResults 最大结果数
     * @returns 查询结果
     */
    queryEntities(mask: ComponentMask, maxResults: number = 10000): QueryResult {
        this.ensureInitialized();
        
        if (this.usingWasm && this.wasmCore) {
            try {
                const ptr = this.wasmCore.query_entities(mask, maxResults);
                const count = this.wasmCore.get_query_result_count();
                
                if (ptr && count > 0 && this.wasmModule?.memory) {
                    const entities = new Uint32Array(this.wasmModule.memory.buffer, ptr, count);
                    return { 
                        entities: new Uint32Array(entities), // 创建副本以确保数据安全
                        count 
                    };
                } else {
                    return { entities: new Uint32Array(0), count: 0 };
                }
            } catch (error) {
                if (!this.silent) {
                    console.warn('WASM查询失败，回退到JavaScript实现:', error);
                }
                // 回退到JavaScript实现
            }
        }
        
        // JavaScript实现
        this.jsQueryCount++;
        const entities: EntityId[] = [];
        
        for (const [entityId, entityMask] of this.jsEntityMasks) {
            if ((entityMask & mask) === mask) {
                entities.push(entityId);
                if (entities.length >= maxResults) break;
            }
        }
        
        return {
            entities: new Uint32Array(entities),
            count: entities.length
        };
    }

    /**
     * 查询指定掩码的实体（带缓存优化）
     * 
     * @param mask 组件掩码
     * @returns 查询结果
     */
    queryCached(mask: ComponentMask): QueryResult {
        this.ensureInitialized();
        
        if (this.usingWasm && this.wasmCore) {
            try {
                const ptr = this.wasmCore.query_cached(mask);
                const count = this.wasmCore.get_cached_query_count(mask);
                
                if (ptr && count > 0 && this.wasmModule?.memory) {
                    const entities = new Uint32Array(this.wasmModule.memory.buffer, ptr, count);
                    return {
                        entities: new Uint32Array(entities), // 复制数据
                        count
                    };
                }
                
                return { entities: new Uint32Array(0), count: 0 };
            } catch (error) {
                if (!this.silent) {
                    console.warn('WASM缓存查询失败，回退到通用查询:', error);
                }
                // 回退到通用查询
                return this.queryEntities(mask);
            }
        }

        // JavaScript实现 - 直接使用通用查询
        return this.queryEntities(mask);
    }

    /**
     * 查询包含多个组件的实体
     * 
     * @param masks 组件掩码数组
     * @param maxResults 最大结果数
     * @returns 查询结果
     */
    queryMultipleComponents(masks: ComponentMask[], maxResults: number = 10000): QueryResult {
        this.ensureInitialized();
        
        if (this.usingWasm && this.wasmCore) {
            try {
                const masksArray = new BigUint64Array(masks);
                const ptr = this.wasmCore.query_multiple_components(masksArray, maxResults);
                
                if (ptr && this.wasmModule?.memory) {
                    // 暂时返回空结果，需要实现内存访问
                    return { entities: new Uint32Array(0), count: 0 };
                }
                
                return { entities: new Uint32Array(0), count: 0 };
            } catch (error) {
                if (!this.silent) {
                    console.warn('WASM多组件查询失败，回退到JavaScript实现:', error);
                }
                // 回退到JavaScript实现
            }
        }
        
        // JavaScript实现
        this.jsQueryCount++;
        const entities: EntityId[] = [];
        
        for (const [entityId, entityMask] of this.jsEntityMasks) {
            let hasAll = true;
            for (const mask of masks) {
                if ((entityMask & mask) !== mask) {
                    hasAll = false;
                    break;
                }
            }
            
            if (hasAll) {
                entities.push(entityId);
                if (entities.length >= maxResults) break;
            }
        }
        
        return {
            entities: new Uint32Array(entities),
            count: entities.length
        };
    }

    /**
     * 排除查询：包含某些组件但不包含其他组件
     * 
     * @param includeMask 必须包含的组件掩码
     * @param excludeMask 必须排除的组件掩码
     * @param maxResults 最大结果数
     * @returns 查询结果
     */
    queryWithExclusion(includeMask: ComponentMask, excludeMask: ComponentMask, maxResults: number = 10000): QueryResult {
        this.ensureInitialized();
        
        if (this.usingWasm && this.wasmCore) {
            try {
                const ptr = this.wasmCore.query_with_exclusion(includeMask, excludeMask, maxResults);
                
                if (ptr && this.wasmModule?.memory) {
                    // 暂时返回空结果，需要实现内存访问
                    return { entities: new Uint32Array(0), count: 0 };
                }
                
                return { entities: new Uint32Array(0), count: 0 };
            } catch (error) {
                if (!this.silent) {
                    console.warn('WASM排除查询失败，回退到JavaScript实现:', error);
                }
                // 回退到JavaScript实现
            }
        }
        
        // JavaScript实现
        this.jsQueryCount++;
        const entities: EntityId[] = [];
        
        for (const [entityId, entityMask] of this.jsEntityMasks) {
            if ((entityMask & includeMask) === includeMask && (entityMask & excludeMask) === BigInt(0)) {
                entities.push(entityId);
                if (entities.length >= maxResults) break;
            }
        }
        
        return {
            entities: new Uint32Array(entities),
            count: entities.length
        };
    }

    /**
     * 获取实体的组件掩码
     * 
     * @param entityId 实体ID
     * @returns 组件掩码，如果实体不存在则返回null
     */
    getEntityMask(entityId: EntityId): ComponentMask | null {
        this.ensureInitialized();
        
        if (this.usingWasm && this.wasmCore) {
            return this.wasmCore.get_entity_mask(entityId) || null;
        } else {
            return this.jsEntityMasks.get(entityId) || null;
        }
    }

    /**
     * 检查实体是否存在
     * 
     * @param entityId 实体ID
     * @returns 是否存在
     */
    entityExists(entityId: EntityId): boolean {
        this.ensureInitialized();
        
        if (this.usingWasm && this.wasmCore) {
            return this.wasmCore.entity_exists(entityId);
        } else {
            return this.jsEntityMasks.has(entityId);
        }
    }

    /**
     * 创建组件掩码
     * 
     * @param componentIds 组件ID数组
     * @returns 组件掩码
     */
    createComponentMask(componentIds: number[]): ComponentMask {
        if (this.usingWasm && this.wasmModule) {
            return this.wasmModule.create_component_mask(new Uint32Array(componentIds));
        } else {
            let mask = BigInt(0);
            for (const id of componentIds) {
                if (id < 64) {
                    mask |= BigInt(1) << BigInt(id);
                }
            }
            return mask;
        }
    }

    /**
     * 检查掩码是否包含组件
     * 
     * @param mask 组件掩码
     * @param componentId 组件ID
     * @returns 是否包含
     */
    maskContainsComponent(mask: ComponentMask, componentId: number): boolean {
        if (this.usingWasm && this.wasmModule) {
            return this.wasmModule.mask_contains_component(mask, componentId);
        } else {
            if (componentId >= 64) return false;
            return (mask & (BigInt(1) << BigInt(componentId))) !== BigInt(0);
        }
    }

    /**
     * 获取性能统计信息
     * 
     * @returns 性能统计
     */
    getPerformanceStats(): PerformanceStats {
        this.ensureInitialized();
        
        if (this.usingWasm && this.wasmCore) {
            const stats = Array.from(this.wasmCore.get_performance_stats());
            return {
                entityCount: stats[0] as number,
                indexCount: stats[1] as number,
                queryCount: stats[2] as number,
                updateCount: stats[3] as number,
                wasmEnabled: true
            };
        } else {
            return {
                entityCount: this.jsEntityMasks.size,
                indexCount: 0,
                queryCount: this.jsQueryCount,
                updateCount: this.jsUpdateCount,
                wasmEnabled: false
            };
        }
    }

    /**
     * 清空所有数据
     */
    clear(): void {
        this.ensureInitialized();
        
        if (this.usingWasm && this.wasmCore) {
            this.wasmCore.clear();
        } else {
            this.jsEntityMasks.clear();
            this.jsNextEntityId = 1;
            this.jsQueryCount = 0;
            this.jsUpdateCount = 0;
        }
    }

    /**
     * 是否使用WASM实现
     * 
     * @returns 是否使用WASM
     */
    isUsingWasm(): boolean {
        return this.usingWasm;
    }

    /**
     * 是否已初始化
     * 
     * @returns 是否已初始化
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * 确保已初始化
     */
    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('ECS核心未初始化，请先调用 initialize()');
        }
    }

    /**
     * 清理资源
     */
    cleanup(): void {
        if (this.usingWasm && this.wasmCore) {
            try {
                this.wasmCore.free?.();
            } catch (error) {
                if (!this.silent) {
                    console.warn('⚠️ 清理WASM资源时出错:', error);
                }
            }
        }
        
        this.wasmCore = null;
        this.wasmModule = null;
        this.jsEntityMasks.clear();
        this.initialized = false;
        this.usingWasm = false;
    }
}

/**
 * 全局ECS核心实例
 * 
 * 提供单例模式的ECS核心，确保整个应用使用同一个实例
 */
export const ecsCore = new WasmEcsCore();

/**
 * 初始化ECS引擎
 * 
 * 便捷的初始化函数，推荐在应用启动时调用
 * 
 * @param silent 是否静默模式
 * @returns 初始化是否成功
 * 
 * @example
 * ```typescript
 * import { initializeEcs } from 'ecs-framework';
 * 
 * async function main() {
 *     // 使用默认配置（JavaScript实现）
 *     await initializeEcs();
 *     
 *     // 或者自定义配置
 *     await initializeEcs({
 *         enabled: false,  // 禁用WASM
 *         silent: true     // 静默模式
 *     });
 * }
 * ```
 */
export async function initializeEcs(silent: boolean = false): Promise<boolean> {
    ecsCore.setSilent(silent);
    return ecsCore.initialize();
}

/**
 * 快速查询工具函数
 * 
 * 为常见查询操作提供便捷的API
 */
export const Query = {
    /**
     * 查询拥有指定组件的所有实体
     */
    withComponent: (componentId: number, maxResults?: number): QueryResult => {
        const mask = ecsCore.createComponentMask([componentId]);
        return ecsCore.queryEntities(mask, maxResults);
    },

    /**
     * 查询拥有多个组件的实体
     */
    withComponents: (componentIds: number[], maxResults?: number): QueryResult => {
        const masks = componentIds.map(id => ecsCore.createComponentMask([id]));
        return ecsCore.queryMultipleComponents(masks, maxResults);
    },

    /**
     * 查询拥有某些组件但不拥有其他组件的实体
     */
    withExclusion: (includeIds: number[], excludeIds: number[], maxResults?: number): QueryResult => {
        const includeMask = ecsCore.createComponentMask(includeIds);
        const excludeMask = ecsCore.createComponentMask(excludeIds);
        return ecsCore.queryWithExclusion(includeMask, excludeMask, maxResults);
    }
};

 