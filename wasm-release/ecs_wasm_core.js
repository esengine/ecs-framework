let wasm;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let WASM_VECTOR_LEN = 0;

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedBigUint64ArrayMemory0 = null;

function getBigUint64ArrayMemory0() {
    if (cachedBigUint64ArrayMemory0 === null || cachedBigUint64ArrayMemory0.byteLength === 0) {
        cachedBigUint64ArrayMemory0 = new BigUint64Array(wasm.memory.buffer);
    }
    return cachedBigUint64ArrayMemory0;
}

function passArray64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getBigUint64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
 * 创建组件掩码的辅助函数
 * @param {Uint32Array} component_ids
 * @returns {bigint}
 */
export function create_component_mask(component_ids) {
    const ptr0 = passArray32ToWasm0(component_ids, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.create_component_mask(ptr0, len0);
    return BigInt.asUintN(64, ret);
}

/**
 * 检查掩码是否包含指定组件
 * @param {bigint} mask
 * @param {number} component_id
 * @returns {boolean}
 */
export function mask_contains_component(mask, component_id) {
    const ret = wasm.mask_contains_component(mask, component_id);
    return ret !== 0;
}

/**
 * 初始化函数
 */
export function main() {
    wasm.main();
}

const EcsCoreFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ecscore_free(ptr >>> 0, 1));
/**
 * 高性能ECS核心，专注于实体查询和掩码管理
 */
export class EcsCore {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EcsCoreFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ecscore_free(ptr, 0);
    }
    /**
     * 创建新的ECS核心
     */
    constructor() {
        const ret = wasm.ecscore_new();
        this.__wbg_ptr = ret >>> 0;
        EcsCoreFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * 创建新实体
     * @returns {number}
     */
    create_entity() {
        const ret = wasm.ecscore_create_entity(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 删除实体
     * @param {number} entity_id
     * @returns {boolean}
     */
    destroy_entity(entity_id) {
        const ret = wasm.ecscore_destroy_entity(this.__wbg_ptr, entity_id);
        return ret !== 0;
    }
    /**
     * 更新实体的组件掩码
     * @param {number} entity_id
     * @param {bigint} mask
     */
    update_entity_mask(entity_id, mask) {
        wasm.ecscore_update_entity_mask(this.__wbg_ptr, entity_id, mask);
    }
    /**
     * 批量更新实体掩码
     * @param {Uint32Array} entity_ids
     * @param {BigUint64Array} masks
     */
    batch_update_masks(entity_ids, masks) {
        const ptr0 = passArray32ToWasm0(entity_ids, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray64ToWasm0(masks, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.ecscore_batch_update_masks(this.__wbg_ptr, ptr0, len0, ptr1, len1);
    }
    /**
     * 查询实体
     * @param {bigint} mask
     * @param {number} max_results
     * @returns {number}
     */
    query_entities(mask, max_results) {
        const ret = wasm.ecscore_query_entities(this.__wbg_ptr, mask, max_results);
        return ret >>> 0;
    }
    /**
     * 获取查询结果数量
     * @returns {number}
     */
    get_query_result_count() {
        const ret = wasm.ecscore_get_query_result_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 缓存查询实体
     * @param {bigint} mask
     * @returns {number}
     */
    query_cached(mask) {
        const ret = wasm.ecscore_query_cached(this.__wbg_ptr, mask);
        return ret >>> 0;
    }
    /**
     * 获取缓存查询结果数量
     * @param {bigint} mask
     * @returns {number}
     */
    get_cached_query_count(mask) {
        const ret = wasm.ecscore_get_cached_query_count(this.__wbg_ptr, mask);
        return ret >>> 0;
    }
    /**
     * 多组件查询
     * @param {BigUint64Array} masks
     * @param {number} max_results
     * @returns {number}
     */
    query_multiple_components(masks, max_results) {
        const ptr0 = passArray64ToWasm0(masks, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.ecscore_query_multiple_components(this.__wbg_ptr, ptr0, len0, max_results);
        return ret >>> 0;
    }
    /**
     * 排除查询
     * @param {bigint} include_mask
     * @param {bigint} exclude_mask
     * @param {number} max_results
     * @returns {number}
     */
    query_with_exclusion(include_mask, exclude_mask, max_results) {
        const ret = wasm.ecscore_query_with_exclusion(this.__wbg_ptr, include_mask, exclude_mask, max_results);
        return ret >>> 0;
    }
    /**
     * 获取实体的组件掩码
     * @param {number} entity_id
     * @returns {bigint}
     */
    get_entity_mask(entity_id) {
        const ret = wasm.ecscore_get_entity_mask(this.__wbg_ptr, entity_id);
        return BigInt.asUintN(64, ret);
    }
    /**
     * 检查实体是否存在
     * @param {number} entity_id
     * @returns {boolean}
     */
    entity_exists(entity_id) {
        const ret = wasm.ecscore_entity_exists(this.__wbg_ptr, entity_id);
        return ret !== 0;
    }
    /**
     * 获取实体数量
     * @returns {number}
     */
    get_entity_count() {
        const ret = wasm.ecscore_get_entity_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * 获取性能统计信息
     * @returns {Array<any>}
     */
    get_performance_stats() {
        const ret = wasm.ecscore_get_performance_stats(this.__wbg_ptr);
        return ret;
    }
    /**
     * 清理所有数据
     */
    clear() {
        wasm.ecscore_clear(this.__wbg_ptr);
    }
    /**
     * 重建查询缓存
     */
    rebuild_query_cache() {
        wasm.ecscore_rebuild_query_cache(this.__wbg_ptr);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_getRandomValues_3c9c0d586e575a16 = function() { return handleError(function (arg0, arg1) {
        globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
    }, arguments) };
    imports.wbg.__wbg_log_bb5387ff27ac9b37 = function(arg0, arg1) {
        console.log(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_new_78feb108b6472713 = function() {
        const ret = new Array();
        return ret;
    };
    imports.wbg.__wbg_push_737cfc8c1432c2c6 = function(arg0, arg1) {
        const ret = arg0.push(arg1);
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_2;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedBigUint64ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('ecs_wasm_core_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
