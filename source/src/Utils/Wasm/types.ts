/**
 * WASM ECS核心类型定义
 */

export type EntityId = number;
export type ComponentMask = bigint;

export interface QueryResult {
    entities: Uint32Array;
    count: number;
}

export interface PerformanceStats {
    entityCount: number;
    indexCount: number;
    queryCount: number;
    updateCount: number;
    wasmEnabled: boolean;
}

export interface WasmEcsCoreInstance {
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

export interface WasmModule {
    EcsCore: new () => WasmEcsCoreInstance;
    create_component_mask: (componentIds: Uint32Array) => ComponentMask;
    mask_contains_component: (mask: ComponentMask, componentId: number) => boolean;
    default: (input?: any) => Promise<any>;
    initSync?: (input: any) => any;
    memory?: WebAssembly.Memory;
} 