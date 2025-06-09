/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const __wbg_ecscore_free: (a: number, b: number) => void;
export const ecscore_new: () => number;
export const ecscore_create_entity: (a: number) => number;
export const ecscore_destroy_entity: (a: number, b: number) => number;
export const ecscore_update_entity_mask: (a: number, b: number, c: bigint) => void;
export const ecscore_batch_update_masks: (a: number, b: number, c: number, d: number, e: number) => void;
export const ecscore_query_entities: (a: number, b: bigint, c: number) => number;
export const ecscore_get_query_result_count: (a: number) => number;
export const ecscore_query_cached: (a: number, b: bigint) => number;
export const ecscore_get_cached_query_count: (a: number, b: bigint) => number;
export const ecscore_query_multiple_components: (a: number, b: number, c: number, d: number) => number;
export const ecscore_query_with_exclusion: (a: number, b: bigint, c: bigint, d: number) => number;
export const ecscore_get_entity_mask: (a: number, b: number) => bigint;
export const ecscore_entity_exists: (a: number, b: number) => number;
export const ecscore_get_entity_count: (a: number) => number;
export const ecscore_get_performance_stats: (a: number) => any;
export const ecscore_clear: (a: number) => void;
export const ecscore_rebuild_query_cache: (a: number) => void;
export const create_component_mask: (a: number, b: number) => bigint;
export const mask_contains_component: (a: bigint, b: number) => number;
export const main: () => void;
export const __wbindgen_exn_store: (a: number) => void;
export const __externref_table_alloc: () => number;
export const __wbindgen_export_2: WebAssembly.Table;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_start: () => void;
