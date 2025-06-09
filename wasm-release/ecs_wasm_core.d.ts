/* tslint:disable */
/* eslint-disable */
/**
 * 创建组件掩码的辅助函数
 */
export function create_component_mask(component_ids: Uint32Array): bigint;
/**
 * 检查掩码是否包含指定组件
 */
export function mask_contains_component(mask: bigint, component_id: number): boolean;
/**
 * 初始化函数
 */
export function main(): void;
/**
 * 高性能ECS核心，专注于实体查询和掩码管理
 */
export class EcsCore {
  free(): void;
  /**
   * 创建新的ECS核心
   */
  constructor();
  /**
   * 创建新实体
   */
  create_entity(): number;
  /**
   * 删除实体
   */
  destroy_entity(entity_id: number): boolean;
  /**
   * 更新实体的组件掩码
   */
  update_entity_mask(entity_id: number, mask: bigint): void;
  /**
   * 批量更新实体掩码
   */
  batch_update_masks(entity_ids: Uint32Array, masks: BigUint64Array): void;
  /**
   * 查询实体
   */
  query_entities(mask: bigint, max_results: number): number;
  /**
   * 获取查询结果数量
   */
  get_query_result_count(): number;
  /**
   * 缓存查询实体
   */
  query_cached(mask: bigint): number;
  /**
   * 获取缓存查询结果数量
   */
  get_cached_query_count(mask: bigint): number;
  /**
   * 多组件查询
   */
  query_multiple_components(masks: BigUint64Array, max_results: number): number;
  /**
   * 排除查询
   */
  query_with_exclusion(include_mask: bigint, exclude_mask: bigint, max_results: number): number;
  /**
   * 获取实体的组件掩码
   */
  get_entity_mask(entity_id: number): bigint;
  /**
   * 检查实体是否存在
   */
  entity_exists(entity_id: number): boolean;
  /**
   * 获取实体数量
   */
  get_entity_count(): number;
  /**
   * 获取性能统计信息
   */
  get_performance_stats(): Array<any>;
  /**
   * 清理所有数据
   */
  clear(): void;
  /**
   * 重建查询缓存
   */
  rebuild_query_cache(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_ecscore_free: (a: number, b: number) => void;
  readonly ecscore_new: () => number;
  readonly ecscore_create_entity: (a: number) => number;
  readonly ecscore_destroy_entity: (a: number, b: number) => number;
  readonly ecscore_update_entity_mask: (a: number, b: number, c: bigint) => void;
  readonly ecscore_batch_update_masks: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly ecscore_query_entities: (a: number, b: bigint, c: number) => number;
  readonly ecscore_get_query_result_count: (a: number) => number;
  readonly ecscore_query_cached: (a: number, b: bigint) => number;
  readonly ecscore_get_cached_query_count: (a: number, b: bigint) => number;
  readonly ecscore_query_multiple_components: (a: number, b: number, c: number, d: number) => number;
  readonly ecscore_query_with_exclusion: (a: number, b: bigint, c: bigint, d: number) => number;
  readonly ecscore_get_entity_mask: (a: number, b: number) => bigint;
  readonly ecscore_entity_exists: (a: number, b: number) => number;
  readonly ecscore_get_entity_count: (a: number) => number;
  readonly ecscore_get_performance_stats: (a: number) => any;
  readonly ecscore_clear: (a: number) => void;
  readonly ecscore_rebuild_query_cache: (a: number) => void;
  readonly create_component_mask: (a: number, b: number) => bigint;
  readonly mask_contains_component: (a: bigint, b: number) => number;
  readonly main: () => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
