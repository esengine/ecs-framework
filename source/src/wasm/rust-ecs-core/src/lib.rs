use wasm_bindgen::prelude::*;
use js_sys::Array;

mod query;
use query::QueryEngine;

// 当wasm-bindgen功能启用时，提供console.log绑定
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// 定义一个宏来简化日志记录
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

/// 实体ID类型
pub type EntityId = u32;

/// 组件掩码类型
pub type ComponentMask = u64;

/// 高性能ECS核心，专注于实体查询和掩码管理
#[wasm_bindgen]
pub struct EcsCore {
    /// 查询引擎
    query_engine: QueryEngine,
    /// 下一个可用的实体ID
    next_entity_id: EntityId,
    /// 更新计数
    update_count: u32,
}

#[wasm_bindgen]
impl EcsCore {
    /// 创建新的ECS核心
    #[wasm_bindgen(constructor)]
    pub fn new() -> EcsCore {
        EcsCore {
            query_engine: QueryEngine::new(),
            next_entity_id: 1,
            update_count: 0,
        }
    }

    /// 创建新实体
    #[wasm_bindgen]
    pub fn create_entity(&mut self) -> EntityId {
        let entity_id = self.next_entity_id;
        self.next_entity_id += 1;
        self.query_engine.add_entity(entity_id, 0);
        entity_id
    }

    /// 删除实体
    #[wasm_bindgen]
    pub fn destroy_entity(&mut self, entity_id: EntityId) -> bool {
        self.query_engine.remove_entity(entity_id)
    }

    /// 更新实体的组件掩码
    #[wasm_bindgen]
    pub fn update_entity_mask(&mut self, entity_id: EntityId, mask: ComponentMask) {
        self.query_engine.update_entity_mask(entity_id, mask);
        self.update_count += 1;
    }

    /// 批量更新实体掩码
    #[wasm_bindgen]
    pub fn batch_update_masks(&mut self, entity_ids: &[u32], masks: &[u64]) {
        self.query_engine.batch_update_masks(entity_ids, masks);
        self.update_count += entity_ids.len() as u32;
    }

    /// 查询实体
    #[wasm_bindgen]
    pub fn query_entities(&mut self, mask: ComponentMask, max_results: u32) -> *const u32 {
        let results = self.query_engine.query_entities(mask, max_results as usize);
        results.as_ptr()
    }

    /// 获取查询结果数量
    #[wasm_bindgen]
    pub fn get_query_result_count(&self) -> usize {
        self.query_engine.get_last_query_result_count()
    }

    /// 缓存查询实体
    #[wasm_bindgen]
    pub fn query_cached(&mut self, mask: ComponentMask) -> *const u32 {
        let results = self.query_engine.query_cached(mask);
        results.as_ptr()
    }

    /// 获取缓存查询结果数量
    #[wasm_bindgen]
    pub fn get_cached_query_count(&mut self, mask: ComponentMask) -> usize {
        self.query_engine.query_cached(mask).len()
    }

    /// 多组件查询
    #[wasm_bindgen]
    pub fn query_multiple_components(&mut self, masks: &[u64], max_results: u32) -> *const u32 {
        let results = self.query_engine.query_multiple_components(masks, max_results as usize);
        results.as_ptr()
    }

    /// 排除查询
    #[wasm_bindgen]
    pub fn query_with_exclusion(&mut self, include_mask: ComponentMask, exclude_mask: ComponentMask, max_results: u32) -> *const u32 {
        let results = self.query_engine.query_with_exclusion(include_mask, exclude_mask, max_results as usize);
        results.as_ptr()
    }

    /// 获取实体的组件掩码
    #[wasm_bindgen]
    pub fn get_entity_mask(&self, entity_id: EntityId) -> ComponentMask {
        self.query_engine.get_entity_mask(entity_id)
    }

    /// 检查实体是否存在
    #[wasm_bindgen]
    pub fn entity_exists(&self, entity_id: EntityId) -> bool {
        self.query_engine.entity_exists(entity_id)
    }

    /// 获取实体数量
    #[wasm_bindgen]
    pub fn get_entity_count(&self) -> u32 {
        self.query_engine.get_entity_count()
    }

    /// 获取性能统计信息
    #[wasm_bindgen]
    pub fn get_performance_stats(&self) -> Array {
        let stats = Array::new();
        stats.push(&JsValue::from(self.query_engine.get_entity_count())); // 实体数量
        stats.push(&JsValue::from(self.query_engine.get_query_count())); // 查询次数
        stats.push(&JsValue::from(self.update_count)); // 更新次数
        stats
    }

    /// 清理所有数据
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.query_engine.clear();
        self.next_entity_id = 1;
        self.update_count = 0;
    }

    /// 重建查询缓存
    #[wasm_bindgen]
    pub fn rebuild_query_cache(&mut self) {
        self.query_engine.force_rebuild_cache();
    }
}

/// 创建组件掩码的辅助函数
#[wasm_bindgen]
pub fn create_component_mask(component_ids: &[u32]) -> ComponentMask {
    let mut mask = 0u64;
    for &id in component_ids {
        if id < 64 {
            mask |= 1u64 << id;
        }
    }
    mask
}

/// 检查掩码是否包含指定组件
#[wasm_bindgen]
pub fn mask_contains_component(mask: ComponentMask, component_id: u32) -> bool {
    if component_id >= 64 {
        return false;
    }
    (mask & (1u64 << component_id)) != 0
}

/// 初始化函数
#[wasm_bindgen(start)]
pub fn main() {
    console_log!("Rust ECS WASM模块已加载");
}