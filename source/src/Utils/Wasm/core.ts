/**
 * WASM ECS核心模块
 */

import { EntityId, ComponentMask, QueryResult, PerformanceStats, WasmEcsCoreInstance, WasmModule } from './types';
import { WasmLoader } from './loader';
import { JavaScriptFallback } from './fallback';

export class WasmEcsCore {
    private wasmLoader: WasmLoader;
    private jsFallback: JavaScriptFallback;
    private initialized = false;
    private usingWasm = false;

    constructor() {
        this.wasmLoader = new WasmLoader();
        this.jsFallback = new JavaScriptFallback();
    }

    public setSilent(silent: boolean): void {
        this.wasmLoader.setSilent(silent);
    }

    async initialize(): Promise<boolean> {
        if (this.initialized) return true;

        console.log('🔄 初始化ECS核心...');
        this.usingWasm = await this.wasmLoader.loadWasmModule();
        this.initialized = true;

        return true;
    }

    createEntity(): EntityId {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            return wasmCore ? wasmCore.create_entity() : this.jsFallback.createEntity();
        }
        
        return this.jsFallback.createEntity();
    }

    destroyEntity(entityId: EntityId): boolean {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            return wasmCore ? wasmCore.destroy_entity(entityId) : this.jsFallback.destroyEntity(entityId);
        }
        
        return this.jsFallback.destroyEntity(entityId);
    }

    updateEntityMask(entityId: EntityId, mask: ComponentMask): void {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            if (wasmCore) {
                wasmCore.update_entity_mask(entityId, mask);
            } else {
                this.jsFallback.updateEntityMask(entityId, mask);
            }
        } else {
            this.jsFallback.updateEntityMask(entityId, mask);
        }
    }

    batchUpdateMasks(entityIds: EntityId[], masks: ComponentMask[]): void {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            if (wasmCore) {
                const entityIdArray = new Uint32Array(entityIds);
                const maskArray = new BigUint64Array(masks);
                wasmCore.batch_update_masks(entityIdArray, maskArray);
            } else {
                this.jsFallback.batchUpdateMasks(entityIds, masks);
            }
        } else {
            this.jsFallback.batchUpdateMasks(entityIds, masks);
        }
    }

    queryEntities(mask: ComponentMask, maxResults: number = 10000): QueryResult {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            if (wasmCore) {
                const resultPtr = wasmCore.query_entities(mask, maxResults);
                const count = wasmCore.get_query_result_count();
                
                const wasmModule = this.wasmLoader.getWasmModule();
                if (wasmModule && wasmModule.memory) {
                    const memory = new Uint32Array(wasmModule.memory.buffer);
                    const entities = new Uint32Array(count);
                    for (let i = 0; i < count; i++) {
                        entities[i] = memory[resultPtr / 4 + i];
                    }
                    return { entities, count };
                }
            }
        }
        
        return this.jsFallback.queryEntities(mask, maxResults);
    }

    queryCached(mask: ComponentMask): QueryResult {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            if (wasmCore) {
                const resultPtr = wasmCore.query_cached(mask);
                const count = wasmCore.get_cached_query_count(mask);
                
                const wasmModule = this.wasmLoader.getWasmModule();
                if (wasmModule && wasmModule.memory) {
                    const memory = new Uint32Array(wasmModule.memory.buffer);
                    const entities = new Uint32Array(count);
                    for (let i = 0; i < count; i++) {
                        entities[i] = memory[resultPtr / 4 + i];
                    }
                    return { entities, count };
                }
            }
        }
        
        return this.jsFallback.queryCached(mask);
    }

    queryMultipleComponents(masks: ComponentMask[], maxResults: number = 10000): QueryResult {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            if (wasmCore) {
                const maskArray = new BigUint64Array(masks);
                const resultPtr = wasmCore.query_multiple_components(maskArray, maxResults);
                const count = wasmCore.get_query_result_count();
                
                const wasmModule = this.wasmLoader.getWasmModule();
                if (wasmModule && wasmModule.memory) {
                    const memory = new Uint32Array(wasmModule.memory.buffer);
                    const entities = new Uint32Array(count);
                    for (let i = 0; i < count; i++) {
                        entities[i] = memory[resultPtr / 4 + i];
                    }
                    return { entities, count };
                }
            }
        }
        
        return this.jsFallback.queryMultipleComponents(masks, maxResults);
    }

    queryWithExclusion(includeMask: ComponentMask, excludeMask: ComponentMask, maxResults: number = 10000): QueryResult {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            if (wasmCore) {
                const resultPtr = wasmCore.query_with_exclusion(includeMask, excludeMask, maxResults);
                const count = wasmCore.get_query_result_count();
                
                const wasmModule = this.wasmLoader.getWasmModule();
                if (wasmModule && wasmModule.memory) {
                    const memory = new Uint32Array(wasmModule.memory.buffer);
                    const entities = new Uint32Array(count);
                    for (let i = 0; i < count; i++) {
                        entities[i] = memory[resultPtr / 4 + i];
                    }
                    return { entities, count };
                }
            }
        }
        
        return this.jsFallback.queryWithExclusion(includeMask, excludeMask, maxResults);
    }

    getEntityMask(entityId: EntityId): ComponentMask | null {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            if (wasmCore) {
                return wasmCore.get_entity_mask(entityId);
            }
        }
        
        return this.jsFallback.getEntityMask(entityId);
    }

    entityExists(entityId: EntityId): boolean {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            if (wasmCore) {
                return wasmCore.entity_exists(entityId);
            }
        }
        
        return this.jsFallback.entityExists(entityId);
    }

    createComponentMask(componentIds: number[]): ComponentMask {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmModule = this.wasmLoader.getWasmModule();
            if (wasmModule) {
                const componentIdArray = new Uint32Array(componentIds);
                return wasmModule.create_component_mask(componentIdArray);
            }
        }
        
        return this.jsFallback.createComponentMask(componentIds);
    }

    maskContainsComponent(mask: ComponentMask, componentId: number): boolean {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmModule = this.wasmLoader.getWasmModule();
            if (wasmModule) {
                return wasmModule.mask_contains_component(mask, componentId);
            }
        }
        
        return this.jsFallback.maskContainsComponent(mask, componentId);
    }

    getPerformanceStats(): PerformanceStats {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            if (wasmCore) {
                const stats = wasmCore.get_performance_stats();
                return {
                    entityCount: stats[0] || 0,
                    indexCount: stats[1] || 0,
                    queryCount: stats[2] || 0,
                    updateCount: stats[3] || 0,
                    wasmEnabled: true
                };
            }
        }
        
        return this.jsFallback.getPerformanceStats();
    }

    clear(): void {
        this.ensureInitialized();
        
        if (this.usingWasm) {
            const wasmCore = this.wasmLoader.getWasmCore();
            if (wasmCore) {
                wasmCore.clear();
            }
        }
        
        this.jsFallback.clear();
    }

    isUsingWasm(): boolean {
        return this.usingWasm;
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('ECS核心未初始化，请先调用 initialize() 方法');
        }
    }

    cleanup(): void {
        this.wasmLoader.cleanup();
        this.jsFallback.clear();
        this.initialized = false;
        this.usingWasm = false;
    }
} 