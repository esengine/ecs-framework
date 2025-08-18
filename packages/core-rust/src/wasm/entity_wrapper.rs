use wasm_bindgen::prelude::*;
use js_sys::Uint32Array;
use crate::core::entity::Entity;

/**
 * Entity WASM绑定包装器
 * 只暴露用户需要操作的核心API
 */
#[wasm_bindgen]
pub struct EntityWrapper {
    inner: Entity,
}

#[wasm_bindgen]
impl EntityWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String, id: u32) -> Self {
        Self {
            inner: {
                let mut entity = Entity::new(id);
                entity.set_name(name);
                entity
            },
        }
    }

    #[wasm_bindgen(getter)]
    pub fn id(&self) -> u32 {
        self.inner.id
    }

    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.inner.name.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn active(&self) -> bool {
        self.inner.active()
    }

    #[wasm_bindgen(setter)]
    pub fn set_active(&mut self, value: bool) {
        self.inner.set_active(value);
    }

    #[wasm_bindgen(getter)]
    pub fn enabled(&self) -> bool {
        self.inner.enabled()
    }

    #[wasm_bindgen(setter)]
    pub fn set_enabled(&mut self, value: bool) {
        self.inner.set_enabled(value);
    }

    #[wasm_bindgen(getter)]
    pub fn tag(&self) -> u32 {
        self.inner.tag()
    }

    #[wasm_bindgen(setter)]
    pub fn set_tag(&mut self, value: u32) {
        self.inner.set_tag(value);
    }

    #[wasm_bindgen(getter)]
    pub fn update_order(&self) -> i32 {
        self.inner.update_order()
    }

    #[wasm_bindgen(setter)]
    pub fn set_update_order(&mut self, value: i32) {
        self.inner.set_update_order(value);
    }

    pub fn is_destroyed(&self) -> bool {
        self.inner.is_destroyed()
    }

    pub fn get_parent_id(&self) -> Option<u32> {
        self.inner.get_parent_id()
    }

    pub fn get_children_ids(&self) -> Uint32Array {
        let children = self.inner.get_children_ids();
        Uint32Array::from(&children[..])
    }

    pub fn child_count(&self) -> usize {
        self.inner.child_count()
    }

    pub fn component_count(&self) -> usize {
        self.inner.component_count()
    }

    pub fn get_component_mask(&self) -> u64 {
        self.inner.get_component_mask()
    }

    pub fn destroy(&mut self) {
        self.inner.destroy();
    }

    pub fn update(&mut self) {
        self.inner.update();
    }

    pub fn get_debug_info(&self) -> String {
        self.inner.get_debug_info()
    }

    #[wasm_bindgen(js_name = toString)]
    pub fn to_string(&self) -> String {
        self.inner.to_string()
    }
}

impl EntityWrapper {
    /**
     * 内部访问原始Entity的方法（不暴露给WASM）
     */
    pub fn inner(&self) -> &Entity {
        &self.inner
    }

    pub fn inner_mut(&mut self) -> &mut Entity {
        &mut self.inner
    }

    pub fn from_entity(entity: Entity) -> Self {
        Self { inner: entity }
    }

    pub fn into_entity(self) -> Entity {
        self.inner
    }
}