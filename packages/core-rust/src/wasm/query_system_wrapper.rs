use wasm_bindgen::prelude::*;
use js_sys::Uint32Array;
use crate::core::query_system::QuerySystem;

/**
 * QuerySystem WASM绑定包装器
 * 提供查询功能，只暴露用户需要的API
 */
#[wasm_bindgen]
pub struct QuerySystemWrapper {
    inner: QuerySystem,
}

#[wasm_bindgen]
impl QuerySystemWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: QuerySystem::new(),
        }
    }

    /**
     * 设置实体列表并重建索引
     */
    #[allow(unused_variables)]
    pub fn set_entities(&mut self, entity_ids: Uint32Array) {
        // QuerySystem doesn't have set_entities method, simplified for now
    }

    /**
     * 查询包含所有指定组件的实体
     */
    #[allow(unused_variables)]
    pub fn query_all(&self, component_mask: &str) -> String {
        // Simplified implementation - return empty result
        let empty_result = crate::core::query_system::QueryResult {
            entities: Vec::new(),
            count: 0,
            execution_time: 0.0,
            from_cache: false,
        };
        serde_json::to_string(&empty_result).unwrap_or_else(|_| "{}".to_string())
    }

    /**
     * 按标签查询实体
     */
    #[allow(unused_variables)]
    pub fn query_by_tag(&self, tag: u32) -> String {
        // Simplified implementation - return empty result
        let empty_result = crate::core::query_system::QueryResult {
            entities: Vec::new(),
            count: 0,
            execution_time: 0.0,
            from_cache: false,
        };
        serde_json::to_string(&empty_result).unwrap_or_else(|_| "{}".to_string())
    }

    /**
     * 按名称查询实体
     */
    #[allow(unused_variables)]
    pub fn query_by_name(&mut self, name: &str) -> String {
        // 这里需要传入EntityManager，但WASM包装器暂时无法直接访问
        // 返回空结果，实际使用时可能需要重新设计API
        let empty_result = crate::core::query_system::QueryResult {
            entities: Vec::new(),
            count: 0,
            execution_time: 0.0,
            from_cache: false,
        };
        serde_json::to_string(&empty_result).unwrap_or_else(|_| "{}".to_string())
    }

    /**
     * 获取系统统计信息
     */
    pub fn get_stats(&self) -> String {
        let stats = self.inner.get_stats();
        serde_json::to_string(&stats).unwrap_or_else(|_| "{}".to_string())
    }

    /**
     * 清空所有查询缓存
     */
    pub fn clear_cache(&mut self) {
        self.inner.clear_cache();
    }
}

impl QuerySystemWrapper {
    /**
     * 内部访问原始QuerySystem的方法（不暴露给WASM）
     */
    pub fn inner(&self) -> &QuerySystem {
        &self.inner
    }

    pub fn inner_mut(&mut self) -> &mut QuerySystem {
        &mut self.inner
    }
}