use wasm_bindgen::prelude::*;
use js_sys::Uint32Array;
use crate::core::scene::Scene;

/**
 * Scene WASM绑定包装器
 * 提供场景管理功能，只暴露用户需要的API
 */
#[wasm_bindgen]
pub struct SceneWrapper {
    inner: Scene,
}

#[wasm_bindgen]
impl SceneWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String) -> Self {
        let mut scene = Scene::new();
        scene.set_name(name);
        Self {
            inner: scene,
        }
    }

    // ========== 场景属性 ==========

    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.inner.name().to_string()
    }

    pub fn set_name(&mut self, name: String) {
        self.inner.set_name(name);
    }

    #[wasm_bindgen(getter)]
    pub fn active(&self) -> bool {
        self.inner.active()
    }

    #[wasm_bindgen(setter)]
    pub fn set_active(&mut self, active: bool) {
        self.inner.set_active(active);
    }

    // ========== 实体管理 ==========

    /**
     * 创建实体
     */
    pub fn create_entity(&mut self, name: Option<String>) -> u32 {
        self.inner.create_entity(name)
    }

    /**
     * 批量创建实体
     */
    pub fn create_entities_batch(&mut self, count: u32, name_prefix: Option<String>) -> Uint32Array {
        let entities = self.inner.create_entities_batch(count, name_prefix);
        Uint32Array::from(&entities[..])
    }

    /**
     * 销毁实体
     */
    pub fn destroy_entity(&mut self, entity_id: u32) -> bool {
        self.inner.destroy_entity(entity_id)
    }

    /**
     * 根据名称获取实体
     */
    pub fn get_entity_by_name(&self, name: &str) -> Option<u32> {
        self.inner.entity_manager().get_entity_by_name(name)
    }

    /**
     * 根据标签获取实体列表
     */
    pub fn get_entities_by_tag(&self, tag: u32) -> Uint32Array {
        let entities = self.inner.entity_manager().get_entities_by_tag(tag);
        Uint32Array::from(&entities[..])
    }

    /**
     * 获取所有实体ID
     */
    pub fn get_all_entity_ids(&self) -> Uint32Array {
        let ids = self.inner.entity_manager().get_all_entity_ids();
        Uint32Array::from(&ids[..])
    }

    // ========== 场景生命周期 ==========

    /**
     * 初始化场景
     */
    pub fn initialize(&mut self) {
        self.inner.initialize();
    }

    /**
     * 更新场景
     */
    pub fn update(&mut self, delta_time: f64) {
        self.inner.update(delta_time);
    }

    /**
     * 清空场景
     */
    pub fn clear(&mut self) {
        self.inner.clear();
    }

    // ========== 统计信息 ==========

    /**
     * 获取实体数量
     */
    pub fn entity_count(&self) -> usize {
        self.inner.entity_count()
    }

    /**
     * 获取激活实体数量
     */
    pub fn active_entity_count(&self) -> usize {
        self.inner.active_entity_count()
    }

    /**
     * 获取调试信息
     */
    pub fn get_debug_info(&self) -> String {
        self.inner.get_debug_info()
    }

    /**
     * 获取统计信息JSON字符串
     */
    pub fn get_stats(&self) -> String {
        let stats = self.inner.get_stats();
        let system_count = self.inner.system_manager().system_count();
        let enabled_system_count = self.inner.system_manager().enabled_system_count();
        
        format!(
            "{{\"total_entities_created\":{},\"total_entities_destroyed\":{},\"total_updates\":{},\"system_count\":{},\"enabled_system_count\":{}}}",
            stats.total_entities_created,
            stats.total_entities_destroyed,
            stats.total_updates,
            system_count,
            enabled_system_count
        )
    }
}

impl SceneWrapper {
    /**
     * 内部访问原始Scene的方法（不暴露给WASM）
     */
    pub fn inner(&self) -> &Scene {
        &self.inner
    }

    pub fn inner_mut(&mut self) -> &mut Scene {
        &mut self.inner
    }
}