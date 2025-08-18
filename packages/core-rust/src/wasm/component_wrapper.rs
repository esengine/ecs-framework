use wasm_bindgen::prelude::*;
use crate::core::component::{Component, BaseComponent};

/**
 * Component WASM绑定包装器
 * 提供组件管理功能，只暴露用户需要的API
 */
#[wasm_bindgen]
pub struct ComponentWrapper {
    inner: BaseComponent,
}

#[wasm_bindgen]
impl ComponentWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new(id: u32) -> Self {
        let mut component = BaseComponent::new();
        component.set_id(id);
        Self {
            inner: component,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn id(&self) -> u32 {
        self.inner.id()
    }

    #[wasm_bindgen(setter)]
    pub fn set_id(&mut self, id: u32) {
        self.inner.set_id(id);
    }

    #[wasm_bindgen(getter)]
    pub fn enabled(&self) -> bool {
        self.inner.enabled()
    }

    #[wasm_bindgen(setter)]
    pub fn set_enabled(&mut self, enabled: bool) {
        self.inner.set_enabled(enabled);
    }

    /**
     * 更新组件
     */
    pub fn update(&mut self) {
        self.inner.update();
    }

    /**
     * 获取组件调试信息
     */
    pub fn get_debug_info(&self) -> String {
        format!(
            "{{\"id\":{},\"enabled\":{},\"type\":\"Component\"}}",
            self.inner.id(),
            self.inner.enabled()
        )
    }

    /**
     * 获取组件名称
     */
    pub fn get_name(&self) -> String {
        "Component".to_string()
    }

    /**
     * 检查组件是否已销毁
     */
    pub fn is_destroyed(&self) -> bool {
        false // BaseComponent不支持销毁状态，暂时返回false
    }
}

/**
 * ComponentRegistry WASM绑定包装器
 * 提供组件注册和类型管理功能
 */
#[wasm_bindgen]
pub struct ComponentRegistryWrapper {
    // 暂时为空，因为ComponentRegistry主要是静态方法
    _placeholder: u8,
}

#[wasm_bindgen]
impl ComponentRegistryWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            _placeholder: 0,
        }
    }

    /**
     * 获取已注册的组件数量
     */
    pub fn get_component_count(&self) -> usize {
        // TODO: 从实际的ComponentRegistry获取
        0
    }

    /**
     * 获取组件类型信息JSON字符串
     */
    pub fn get_component_types_info(&self) -> String {
        "[]".to_string() // TODO: 返回实际的组件类型信息
    }
}