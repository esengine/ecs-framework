use wasm_bindgen::prelude::*;
use js_sys::Uint32Array;
use crate::core::entity_manager::EntityManager;

/**
 * EntityManager WASM绑定包装器
 * 提供实体管理功能，只暴露用户需要的API
 */
#[wasm_bindgen]
pub struct EntityManagerWrapper {
    inner: EntityManager,
}

#[wasm_bindgen]
impl EntityManagerWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: EntityManager::new(),
        }
    }

    /**
     * 创建新实体
     */
    pub fn create_entity(&mut self, name: Option<String>) -> u32 {
        let entity_name = name.unwrap_or_else(|| "Entity".to_string());
        self.inner.create_entity(Some(entity_name))
    }

    /**
     * 批量创建实体
     */
    pub fn create_entities_batch(&mut self, count: u32, name_prefix: Option<String>) -> Uint32Array {
        let prefix = name_prefix.unwrap_or_else(|| "Entity".to_string());
        let entities = self.inner.create_entities_batch(count, Some(prefix));
        Uint32Array::from(&entities[..])
    }

    /**
     * 销毁实体
     */
    pub fn destroy_entity(&mut self, entity_id: u32) -> bool {
        self.inner.destroy_entity(entity_id)
    }

    /**
     * 获取所有实体ID
     */
    pub fn get_all_entity_ids(&self) -> Uint32Array {
        let ids = self.inner.get_all_entity_ids();
        Uint32Array::from(&ids[..])
    }

    /**
     * 根据名称获取实体
     */
    pub fn get_entity_by_name(&self, name: &str) -> Option<u32> {
        self.inner.get_entity_by_name(name)
    }

    /**
     * 根据标签获取实体列表
     */
    pub fn get_entities_by_tag(&self, tag: u32) -> Uint32Array {
        let entities = self.inner.get_entities_by_tag(tag);
        Uint32Array::from(&entities[..])
    }

    /**
     * 获取实体总数
     */
    pub fn entity_count(&self) -> usize {
        self.inner.entity_count()
    }

    /**
     * 获取激活状态的实体数量
     */
    pub fn active_entity_count(&self) -> usize {
        self.inner.active_entity_count()
    }

    /**
     * 清空所有实体
     */
    pub fn clear(&mut self) {
        // EntityManager doesn't have clear method, would need implementation
    }

    /**
     * 获取统计信息JSON字符串
     */
    pub fn get_stats(&self) -> String {
        // 暂时返回简单的统计信息
        format!("{{\"entity_count\":{},\"active_entity_count\":{}}}", 
                self.inner.entity_count(), 
                self.inner.active_entity_count())
    }
}

impl EntityManagerWrapper {
    /**
     * 内部访问原始EntityManager的方法（不暴露给WASM）
     */
    pub fn inner(&self) -> &EntityManager {
        &self.inner
    }

    pub fn inner_mut(&mut self) -> &mut EntityManager {
        &mut self.inner
    }
}