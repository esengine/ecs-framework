use crate::core::component::{Component, ComponentRegistry};
use rustc_hash::FxHashMap;
use std::any::TypeId;

/**
 * 高性能组件存储器
 */
pub struct ComponentStorage<T: Component + 'static> {
    components: Vec<Option<T>>,
    entity_to_index: FxHashMap<u32, usize>,
    index_to_entity: Vec<u32>,
    free_indices: Vec<usize>,
    size: usize,
}

impl<T: Component + 'static> ComponentStorage<T> {
    pub fn new() -> Self {
        Self {
            components: Vec::new(),
            entity_to_index: FxHashMap::default(),
            index_to_entity: Vec::new(),
            free_indices: Vec::new(),
            size: 0,
        }
    }

    /**
     * 添加组件
     * @param entity_id 实体ID
     * @param component 组件实例
     */
    pub fn add_component(&mut self, entity_id: u32, component: T) -> Result<(), String> {
        if self.entity_to_index.contains_key(&entity_id) {
            return Err(format!("Entity {} already has this component", entity_id));
        }

        let index = if let Some(free_index) = self.free_indices.pop() {
            self.components[free_index] = Some(component);
            self.index_to_entity[free_index] = entity_id;
            free_index
        } else {
            let index = self.components.len();
            self.components.push(Some(component));
            self.index_to_entity.push(entity_id);
            index
        };

        self.entity_to_index.insert(entity_id, index);
        self.size += 1;
        Ok(())
    }

    /**
     * 获取组件
     * @param entity_id 实体ID
     * @returns 组件引用或None
     */
    pub fn get_component(&self, entity_id: u32) -> Option<&T> {
        self.entity_to_index
            .get(&entity_id)
            .and_then(|&index| self.components.get(index))
            .and_then(|component| component.as_ref())
    }

    /**
     * 获取可变组件
     * @param entity_id 实体ID
     * @returns 可变组件引用或None
     */
    pub fn get_component_mut(&mut self, entity_id: u32) -> Option<&mut T> {
        self.entity_to_index
            .get(&entity_id)
            .and_then(|&index| self.components.get_mut(index))
            .and_then(|component| component.as_mut())
    }

    /**
     * 检查实体是否有此组件
     * @param entity_id 实体ID
     * @returns 是否有组件
     */
    pub fn has_component(&self, entity_id: u32) -> bool {
        self.entity_to_index.contains_key(&entity_id)
    }

    /**
     * 移除组件
     * @param entity_id 实体ID
     * @returns 被移除的组件或None
     */
    pub fn remove_component(&mut self, entity_id: u32) -> Option<T> {
        let index = self.entity_to_index.remove(&entity_id)?;
        let component = self.components[index].take()?;
        self.free_indices.push(index);
        self.size -= 1;
        Some(component)
    }

    /**
     * 高效遍历所有组件
     * @param callback 回调函数
     */
    pub fn for_each<F>(&self, mut callback: F)
    where
        F: FnMut(&T, u32, usize),
    {
        for (index, component) in self.components.iter().enumerate() {
            if let Some(comp) = component {
                let entity_id = self.index_to_entity[index];
                callback(comp, entity_id, index);
            }
        }
    }

    /**
     * 获取所有组件（密集数组）
     */
    pub fn get_dense_array(&self) -> (Vec<&T>, Vec<u32>) {
        let mut components = Vec::new();
        let mut entity_ids = Vec::new();

        for (index, component) in self.components.iter().enumerate() {
            if let Some(comp) = component {
                components.push(comp);
                entity_ids.push(self.index_to_entity[index]);
            }
        }

        (components, entity_ids)
    }

    /**
     * 清空所有组件
     */
    pub fn clear(&mut self) {
        self.components.clear();
        self.entity_to_index.clear();
        self.index_to_entity.clear();
        self.free_indices.clear();
        self.size = 0;
    }

    /**
     * 获取组件数量
     */
    pub fn size(&self) -> usize {
        self.size
    }

    /**
     * 获取存储统计信息
     */
    pub fn get_stats(&self) -> ComponentStorageStats {
        let total_slots = self.components.len();
        let used_slots = self.size;
        let free_slots = self.free_indices.len();
        let fragmentation = if total_slots > 0 {
            free_slots as f32 / total_slots as f32
        } else {
            0.0
        };

        ComponentStorageStats {
            total_slots,
            used_slots,
            free_slots,
            fragmentation,
        }
    }
}

/**
 * 组件存储统计信息
 */
pub struct ComponentStorageStats {
    pub total_slots: usize,
    pub used_slots: usize,
    pub free_slots: usize,
    pub fragmentation: f32,
}

/**
 * 组件存储管理器
 * 管理所有组件类型的存储器
 */
pub struct ComponentStorageManager {
    storages: FxHashMap<TypeId, Box<dyn ComponentStorageInterface>>,
    registry: ComponentRegistry,
}

impl ComponentStorageManager {
    pub fn new() -> Self {
        Self {
            storages: FxHashMap::default(),
            registry: ComponentRegistry::new(),
        }
    }

    /**
     * 获取组件注册表
     */
    pub fn get_registry(&self) -> &ComponentRegistry {
        &self.registry
    }

    /**
     * 获取可变组件注册表
     */
    pub fn get_registry_mut(&mut self) -> &mut ComponentRegistry {
        &mut self.registry
    }

    /**
     * 添加组件
     * @param entity_id 实体ID
     * @param component 组件实例
     */
    pub fn add_component<T: Component + Clone + 'static>(&mut self, entity_id: u32, component: T) -> Result<(), String> {
        let type_id = TypeId::of::<T>();
        
        if !self.storages.contains_key(&type_id) {
            let storage = Box::new(ComponentStorage::<T>::new());
            self.storages.insert(type_id, storage);
        }

        if let Some(storage) = self.storages.get_mut(&type_id) {
            storage.add_component_boxed(entity_id, Box::new(component))
        } else {
            Err("Failed to get storage".to_string())
        }
    }

    /**
     * 移除实体的所有组件
     * @param entity_id 实体ID
     */
    pub fn remove_all_components(&mut self, entity_id: u32) {
        for storage in self.storages.values_mut() {
            storage.remove_component_by_entity(entity_id);
        }
    }

    /**
     * 获取实体的组件位掩码
     * @param entity_id 实体ID
     * @returns 组件位掩码
     */
    pub fn get_component_mask(&self, entity_id: u32) -> u64 {
        let mut mask = 0u64;
        for (&type_id, storage) in &self.storages {
            if storage.has_component(entity_id) {
                if let Some(bit_mask) = self.registry.get_bit_mask(&type_id) {
                    mask |= bit_mask;
                }
            }
        }
        mask
    }

    /**
     * 清空所有存储器
     */
    pub fn clear(&mut self) {
        for storage in self.storages.values_mut() {
            storage.clear();
        }
        self.storages.clear();
    }
}

/**
 * 组件存储接口
 */
trait ComponentStorageInterface: Send + Sync {
    fn add_component_boxed(&mut self, entity_id: u32, component: Box<dyn Component>) -> Result<(), String>;
    fn remove_component_by_entity(&mut self, entity_id: u32) -> bool;
    fn has_component(&self, entity_id: u32) -> bool;
    fn clear(&mut self);
}

impl<T: Component + Clone + 'static> ComponentStorageInterface for ComponentStorage<T> {
    fn add_component_boxed(&mut self, entity_id: u32, component: Box<dyn Component>) -> Result<(), String> {
        if let Some(downcasted) = component.as_any().downcast_ref::<T>() {
            self.add_component(entity_id, downcasted.clone())
        } else {
            Err("Failed to downcast component".to_string())
        }
    }

    fn remove_component_by_entity(&mut self, entity_id: u32) -> bool {
        self.remove_component(entity_id).is_some()
    }

    fn has_component(&self, entity_id: u32) -> bool {
        ComponentStorage::has_component(self, entity_id)
    }

    fn clear(&mut self) {
        ComponentStorage::clear(self)
    }
}