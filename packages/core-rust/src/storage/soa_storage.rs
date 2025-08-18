use crate::core::Component;
use crate::utils::ComponentType;
use rustc_hash::FxHashMap;
use std::any::Any;
use std::marker::PhantomData;

/**
 * SoA字段类型枚举
 * 定义TypedArray字段的存储类型
 */
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SoAFieldType {
    Float32,
    Float64,
    Int32,
    Boolean,
    String,
    Serialized,
    Complex,
}

/**
 * SoA字段元数据
 * 记录字段的配置信息
 */
#[derive(Debug, Clone)]
pub struct SoAFieldMetadata {
    pub field_type: SoAFieldType,
    pub high_precision: bool,
    pub serialize_map: bool,
    pub serialize_set: bool,
    pub serialize_array: bool,
    pub deep_copy: bool,
}

impl Default for SoAFieldMetadata {
    fn default() -> Self {
        Self {
            field_type: SoAFieldType::Float32,
            high_precision: false,
            serialize_map: false,
            serialize_set: false,
            serialize_array: false,
            deep_copy: false,
        }
    }
}

/**
 * SoA存储统计信息
 */
#[derive(Debug, Clone)]
pub struct SoAStorageStats {
    pub size: usize,
    pub capacity: usize,
    pub used_slots: usize,
    pub fragmentation: f64,
    pub memory_usage: usize,
    pub field_stats: FxHashMap<String, SoAFieldStats>,
}

/**
 * SoA字段统计信息
 */
#[derive(Debug, Clone)]
pub struct SoAFieldStats {
    pub size: usize,
    pub capacity: usize,
    pub field_type: String,
    pub memory: usize,
}

/**
 * SoA存储器
 * 使用Structure of Arrays存储模式，在大规模批量操作时提供优异性能
 */
pub struct SoAStorage<T: Component> {
    /// Float32数值字段
    float32_fields: FxHashMap<String, Vec<f32>>,
    /// Float64数值字段
    float64_fields: FxHashMap<String, Vec<f64>>,
    /// Int32数值字段
    int32_fields: FxHashMap<String, Vec<i32>>,
    /// 字符串字段
    string_fields: FxHashMap<String, Vec<Option<String>>>,
    /// 序列化字段（用于复杂对象）
    serialized_fields: FxHashMap<String, Vec<Option<String>>>,
    /// 复杂对象字段（高精度或非序列化对象）
    complex_fields: FxHashMap<u32, FxHashMap<String, Box<dyn Any + Send>>>,
    /// 实体ID到索引的映射
    entity_to_index: FxHashMap<u32, usize>,
    /// 索引到实体ID的映射
    index_to_entity: Vec<Option<u32>>,
    /// 空闲索引列表
    free_indices: Vec<usize>,
    /// 当前大小
    size: usize,
    /// 当前容量
    capacity: usize,
    /// 组件类型
    component_type: ComponentType,
    /// 字段元数据
    field_metadata: FxHashMap<String, SoAFieldMetadata>,
    /// 类型标记
    _phantom: PhantomData<T>,
}

impl<T: Component> SoAStorage<T> {
    /**
     * 创建新的SoA存储器
     */
    pub fn new() -> Self {
        let initial_capacity = 1000;
        
        Self {
            float32_fields: FxHashMap::default(),
            float64_fields: FxHashMap::default(),
            int32_fields: FxHashMap::default(),
            string_fields: FxHashMap::default(),
            serialized_fields: FxHashMap::default(),
            complex_fields: FxHashMap::default(),
            entity_to_index: FxHashMap::default(),
            index_to_entity: vec![None; initial_capacity],
            free_indices: Vec::new(),
            size: 0,
            capacity: initial_capacity,
            component_type: std::any::TypeId::of::<T>(),
            field_metadata: FxHashMap::default(),
            _phantom: PhantomData,
        }
    }

    /**
     * 使用指定容量创建SoA存储器
     */
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            float32_fields: FxHashMap::default(),
            float64_fields: FxHashMap::default(),
            int32_fields: FxHashMap::default(),
            string_fields: FxHashMap::default(),
            serialized_fields: FxHashMap::default(),
            complex_fields: FxHashMap::default(),
            entity_to_index: FxHashMap::default(),
            index_to_entity: vec![None; capacity],
            free_indices: Vec::new(),
            size: 0,
            capacity,
            component_type: std::any::TypeId::of::<T>(),
            field_metadata: FxHashMap::default(),
            _phantom: PhantomData,
        }
    }

    /**
     * 初始化字段结构
     * 根据组件类型的特征来设置字段存储类型
     */
    pub fn initialize_fields(&mut self) {
        // 在Rust中，我们需要手动注册字段类型
        // 这里提供一个基础的初始化，具体的字段配置需要通过register_field方法添加
    }

    /**
     * 注册字段
     */
    pub fn register_field(&mut self, field_name: &str, metadata: SoAFieldMetadata) {
        self.field_metadata.insert(field_name.to_string(), metadata.clone());

        match metadata.field_type {
            SoAFieldType::Float32 => {
                self.float32_fields.insert(field_name.to_string(), vec![0.0; self.capacity]);
            },
            SoAFieldType::Float64 => {
                self.float64_fields.insert(field_name.to_string(), vec![0.0; self.capacity]);
            },
            SoAFieldType::Int32 => {
                self.int32_fields.insert(field_name.to_string(), vec![0; self.capacity]);
            },
            SoAFieldType::Boolean => {
                // 布尔值使用Float32存储为0/1
                self.float32_fields.insert(field_name.to_string(), vec![0.0; self.capacity]);
            },
            SoAFieldType::String => {
                self.string_fields.insert(field_name.to_string(), vec![None; self.capacity]);
            },
            SoAFieldType::Serialized => {
                self.serialized_fields.insert(field_name.to_string(), vec![None; self.capacity]);
            },
            SoAFieldType::Complex => {
                // 复杂字段在运行时按需添加到complex_fields中
            },
        }
    }

    /**
     * 添加组件
     */
    pub fn add_component(&mut self, entity_id: u32, component: T) {
        if let Some(index) = self.entity_to_index.get(&entity_id) {
            // 更新现有组件
            self.update_component_at_index(*index, entity_id, component);
            return;
        }

        // 获取可用索引
        let index = if let Some(free_index) = self.free_indices.pop() {
            free_index
        } else {
            if self.size >= self.capacity {
                self.resize(self.capacity * 2);
            }
            self.size
        };

        // 设置映射关系
        self.entity_to_index.insert(entity_id, index);
        self.index_to_entity[index] = Some(entity_id);
        
        // 更新组件数据
        self.update_component_at_index(index, entity_id, component);
        
        if index == self.size {
            self.size += 1;
        }
    }

    /**
     * 在指定索引处更新组件数据
     */
    fn update_component_at_index(&mut self, index: usize, entity_id: u32, component: T) {
        // 在Rust中，我们无法像TypeScript那样动态遍历对象属性
        // 需要使用trait或者其他方式来序列化组件数据
        // 这里提供一个基础实现，具体的字段设置需要在具体使用时实现
        
        // 将组件转换为Any trait对象存储在complex_fields中
        let mut entity_complex_fields = FxHashMap::default();
        entity_complex_fields.insert("component".to_string(), Box::new(component) as Box<dyn Any + Send>);
        self.complex_fields.insert(entity_id, entity_complex_fields);
    }

    /**
     * 获取组件
     */
    pub fn get_component(&self, entity_id: u32) -> Option<&T> {
        if let Some(index) = self.entity_to_index.get(&entity_id) {
            if let Some(complex_fields) = self.complex_fields.get(&entity_id) {
                if let Some(component_any) = complex_fields.get("component") {
                    if let Some(component) = component_any.downcast_ref::<T>() {
                        return Some(component);
                    }
                }
            }
        }
        None
    }

    /**
     * 获取可变组件引用
     */
    pub fn get_component_mut(&mut self, entity_id: u32) -> Option<&mut T> {
        if let Some(_index) = self.entity_to_index.get(&entity_id) {
            if let Some(complex_fields) = self.complex_fields.get_mut(&entity_id) {
                if let Some(component_any) = complex_fields.get_mut("component") {
                    if let Some(component) = component_any.downcast_mut::<T>() {
                        return Some(component);
                    }
                }
            }
        }
        None
    }

    /**
     * 检查是否包含指定实体的组件
     */
    pub fn has_component(&self, entity_id: u32) -> bool {
        self.entity_to_index.contains_key(&entity_id)
    }

    /**
     * 移除组件
     */
    pub fn remove_component(&mut self, entity_id: u32) -> bool {
        if let Some(index) = self.entity_to_index.remove(&entity_id) {
            // 清理复杂字段
            self.complex_fields.remove(&entity_id);
            
            // 清理索引映射
            self.index_to_entity[index] = None;
            self.free_indices.push(index);
            
            // 清理各类型字段的数据（设为默认值）
            for array in self.float32_fields.values_mut() {
                if index < array.len() {
                    array[index] = 0.0;
                }
            }
            
            for array in self.float64_fields.values_mut() {
                if index < array.len() {
                    array[index] = 0.0;
                }
            }
            
            for array in self.int32_fields.values_mut() {
                if index < array.len() {
                    array[index] = 0;
                }
            }
            
            for array in self.string_fields.values_mut() {
                if index < array.len() {
                    array[index] = None;
                }
            }
            
            for array in self.serialized_fields.values_mut() {
                if index < array.len() {
                    array[index] = None;
                }
            }

            true
        } else {
            false
        }
    }

    /**
     * 调整存储容量
     */
    fn resize(&mut self, new_capacity: usize) {
        // 调整数值字段
        for array in self.float32_fields.values_mut() {
            array.resize(new_capacity, 0.0);
        }
        
        for array in self.float64_fields.values_mut() {
            array.resize(new_capacity, 0.0);
        }
        
        for array in self.int32_fields.values_mut() {
            array.resize(new_capacity, 0);
        }
        
        for array in self.string_fields.values_mut() {
            array.resize(new_capacity, None);
        }
        
        for array in self.serialized_fields.values_mut() {
            array.resize(new_capacity, None);
        }
        
        // 调整索引映射
        self.index_to_entity.resize(new_capacity, None);
        
        self.capacity = new_capacity;
    }

    /**
     * 获取活跃索引列表
     */
    pub fn get_active_indices(&self) -> Vec<usize> {
        self.entity_to_index.values().cloned().collect()
    }

    /**
     * 获取Float32字段数组
     */
    pub fn get_float32_field(&self, field_name: &str) -> Option<&[f32]> {
        self.float32_fields.get(field_name).map(|v| v.as_slice())
    }

    /**
     * 获取可变Float32字段数组
     */
    pub fn get_float32_field_mut(&mut self, field_name: &str) -> Option<&mut [f32]> {
        self.float32_fields.get_mut(field_name).map(|v| v.as_mut_slice())
    }

    /**
     * 获取Float64字段数组
     */
    pub fn get_float64_field(&self, field_name: &str) -> Option<&[f64]> {
        self.float64_fields.get(field_name).map(|v| v.as_slice())
    }

    /**
     * 获取可变Float64字段数组
     */
    pub fn get_float64_field_mut(&mut self, field_name: &str) -> Option<&mut [f64]> {
        self.float64_fields.get_mut(field_name).map(|v| v.as_mut_slice())
    }

    /**
     * 获取Int32字段数组
     */
    pub fn get_int32_field(&self, field_name: &str) -> Option<&[i32]> {
        self.int32_fields.get(field_name).map(|v| v.as_slice())
    }

    /**
     * 获取可变Int32字段数组
     */
    pub fn get_int32_field_mut(&mut self, field_name: &str) -> Option<&mut [i32]> {
        self.int32_fields.get_mut(field_name).map(|v| v.as_mut_slice())
    }

    /**
     * 获取实体索引
     */
    pub fn get_entity_index(&self, entity_id: u32) -> Option<usize> {
        self.entity_to_index.get(&entity_id).copied()
    }

    /**
     * 根据索引获取实体ID
     */
    pub fn get_entity_id_by_index(&self, index: usize) -> Option<u32> {
        if index < self.index_to_entity.len() {
            self.index_to_entity[index]
        } else {
            None
        }
    }

    /**
     * 获取当前大小
     */
    pub fn size(&self) -> usize {
        self.size - self.free_indices.len()
    }

    /**
     * 获取容量
     */
    pub fn capacity(&self) -> usize {
        self.capacity
    }

    /**
     * 清空所有数据
     */
    pub fn clear(&mut self) {
        self.entity_to_index.clear();
        self.complex_fields.clear();
        self.free_indices.clear();
        self.size = 0;
        
        // 重置所有字段数组
        for array in self.float32_fields.values_mut() {
            array.fill(0.0);
        }
        
        for array in self.float64_fields.values_mut() {
            array.fill(0.0);
        }
        
        for array in self.int32_fields.values_mut() {
            array.fill(0);
        }
        
        for array in self.string_fields.values_mut() {
            array.fill(None);
        }
        
        for array in self.serialized_fields.values_mut() {
            array.fill(None);
        }
        
        for i in 0..self.index_to_entity.len() {
            self.index_to_entity[i] = None;
        }
    }

    /**
     * 压缩存储（移除空洞）
     */
    pub fn compact(&mut self) {
        if self.free_indices.is_empty() {
            return;
        }

        // 收集所有活跃的实体并按索引排序
        let mut active_entries: Vec<(u32, usize)> = self.entity_to_index.iter()
            .map(|(&entity_id, &index)| (entity_id, index))
            .collect();
        active_entries.sort_by_key(|(_, index)| *index);

        // 重新映射索引
        let mut new_entity_to_index = FxHashMap::default();
        let mut new_index_to_entity = vec![None; self.capacity];

        for (new_index, (entity_id, old_index)) in active_entries.iter().enumerate() {
            new_entity_to_index.insert(*entity_id, new_index);
            new_index_to_entity[new_index] = Some(*entity_id);

            if new_index != *old_index {
                // 移动数据
                self.move_data_between_indices(*old_index, new_index);
            }
        }

        self.entity_to_index = new_entity_to_index;
        self.index_to_entity = new_index_to_entity;
        self.free_indices.clear();
        self.size = active_entries.len();
    }

    /**
     * 在索引间移动数据
     */
    fn move_data_between_indices(&mut self, from: usize, to: usize) {
        // 移动Float32字段
        for array in self.float32_fields.values_mut() {
            if from < array.len() && to < array.len() {
                array[to] = array[from];
            }
        }
        
        // 移动Float64字段
        for array in self.float64_fields.values_mut() {
            if from < array.len() && to < array.len() {
                array[to] = array[from];
            }
        }
        
        // 移动Int32字段
        for array in self.int32_fields.values_mut() {
            if from < array.len() && to < array.len() {
                array[to] = array[from];
            }
        }
        
        // 移动String字段
        for array in self.string_fields.values_mut() {
            if from < array.len() && to < array.len() {
                array[to] = array[from].take();
            }
        }
        
        // 移动序列化字段
        for array in self.serialized_fields.values_mut() {
            if from < array.len() && to < array.len() {
                array[to] = array[from].take();
            }
        }
    }

    /**
     * 获取存储统计信息
     */
    pub fn get_stats(&self) -> SoAStorageStats {
        let mut total_memory = 0usize;
        let mut field_stats = FxHashMap::default();

        // 计算Float32字段统计
        for (field_name, array) in &self.float32_fields {
            let memory = array.len() * std::mem::size_of::<f32>();
            total_memory += memory;
            field_stats.insert(field_name.clone(), SoAFieldStats {
                size: self.size(),
                capacity: array.len(),
                field_type: "float32".to_string(),
                memory,
            });
        }

        // 计算Float64字段统计
        for (field_name, array) in &self.float64_fields {
            let memory = array.len() * std::mem::size_of::<f64>();
            total_memory += memory;
            field_stats.insert(field_name.clone(), SoAFieldStats {
                size: self.size(),
                capacity: array.len(),
                field_type: "float64".to_string(),
                memory,
            });
        }

        // 计算Int32字段统计
        for (field_name, array) in &self.int32_fields {
            let memory = array.len() * std::mem::size_of::<i32>();
            total_memory += memory;
            field_stats.insert(field_name.clone(), SoAFieldStats {
                size: self.size(),
                capacity: array.len(),
                field_type: "int32".to_string(),
                memory,
            });
        }

        // 估算字符串和序列化字段内存（简单估算）
        for (field_name, array) in &self.string_fields {
            let estimated_memory = array.len() * 64; // 假设平均64字节每个字符串
            total_memory += estimated_memory;
            field_stats.insert(field_name.clone(), SoAFieldStats {
                size: self.size(),
                capacity: array.len(),
                field_type: "string".to_string(),
                memory: estimated_memory,
            });
        }

        SoAStorageStats {
            size: self.size(),
            capacity: self.capacity,
            used_slots: self.size(),
            fragmentation: self.free_indices.len() as f64 / self.capacity as f64,
            memory_usage: total_memory,
            field_stats,
        }
    }

    /**
     * 执行向量化批量操作
     */
    pub fn perform_vectorized_operation<F>(&mut self, operation: F)
    where
        F: FnOnce(&mut SoAStorage<T>),
    {
        operation(self);
    }
}

impl<T: Component> Default for SoAStorage<T> {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::any::Any;

    // 测试组件
    #[derive(Debug, Clone)]
    struct TestComponent {
        pub x: f32,
        pub y: f32,
        pub name: String,
        pub active: bool,
        pub id: u32,
        pub enabled: bool,
        pub update_order: i32,
    }

    impl TestComponent {
        fn new() -> Self {
            Self {
                x: 0.0,
                y: 0.0,
                name: String::new(),
                active: false,
                id: 0,
                enabled: true,
                update_order: 0,
            }
        }
    }

    impl Component for TestComponent {
        fn id(&self) -> u32 {
            self.id
        }


        fn enabled(&self) -> bool {
            self.enabled
        }

        fn set_enabled(&mut self, enabled: bool) {
            self.enabled = enabled;
        }

        fn update_order(&self) -> i32 {
            self.update_order
        }

        fn set_update_order(&mut self, order: i32) {
            self.update_order = order;
        }

        fn as_any(&self) -> &dyn Any {
            self
        }

        fn as_any_mut(&mut self) -> &mut dyn Any {
            self
        }

        fn clone_box(&self) -> Box<dyn Component> {
            Box::new(self.clone())
        }
    }

    #[test]
    fn test_soa_storage_creation() {
        let storage: SoAStorage<TestComponent> = SoAStorage::new();
        assert_eq!(storage.size(), 0);
        assert_eq!(storage.capacity(), 1000);
    }

    #[test]
    fn test_soa_storage_with_capacity() {
        let storage: SoAStorage<TestComponent> = SoAStorage::with_capacity(500);
        assert_eq!(storage.size(), 0);
        assert_eq!(storage.capacity(), 500);
    }

    #[test]
    fn test_field_registration() {
        let mut storage: SoAStorage<TestComponent> = SoAStorage::new();
        
        storage.register_field("x", SoAFieldMetadata {
            field_type: SoAFieldType::Float32,
            ..Default::default()
        });
        
        storage.register_field("name", SoAFieldMetadata {
            field_type: SoAFieldType::String,
            ..Default::default()
        });
        
        assert!(storage.get_float32_field("x").is_some());
        assert_eq!(storage.get_float32_field("x").unwrap().len(), 1000);
    }

    #[test]
    fn test_component_add_remove() {
        let mut storage: SoAStorage<TestComponent> = SoAStorage::new();
        
        let component = TestComponent {
            x: 1.0,
            y: 2.0,
            name: "test".to_string(),
            active: true,
            id: 1,
            enabled: true,
            update_order: 0,
        };
        
        let entity_id = 1;
        
        // 添加组件
        storage.add_component(entity_id, component.clone());
        assert_eq!(storage.size(), 1);
        assert!(storage.has_component(entity_id));
        
        // 获取组件
        let retrieved = storage.get_component(entity_id);
        assert!(retrieved.is_some());
        
        // 移除组件
        assert!(storage.remove_component(entity_id));
        assert_eq!(storage.size(), 0);
        assert!(!storage.has_component(entity_id));
    }

    #[test]
    fn test_multiple_components() {
        let mut storage: SoAStorage<TestComponent> = SoAStorage::new();
        
        for i in 1..=10 {
            let component = TestComponent {
                x: i as f32,
                y: i as f32 * 2.0,
                name: format!("test{}", i),
                active: i % 2 == 0,
                id: i,
                enabled: true,
                update_order: 0,
            };
            storage.add_component(i, component);
        }
        
        assert_eq!(storage.size(), 10);
        
        // 验证所有组件都存在
        for i in 1..=10 {
            assert!(storage.has_component(i));
        }
        
        // 移除一半组件
        for i in (1..=10).step_by(2) {
            storage.remove_component(i);
        }
        
        assert_eq!(storage.size(), 5);
    }

    #[test]
    fn test_storage_resize() {
        let mut storage: SoAStorage<TestComponent> = SoAStorage::with_capacity(5);
        
        // 添加超过初始容量的组件
        for i in 1..=10 {
            let component = TestComponent {
                x: i as f32,
                y: i as f32,
                name: format!("test{}", i),
                active: true,
                id: i,
                enabled: true,
                update_order: 0,
            };
            storage.add_component(i, component);
        }
        
        assert_eq!(storage.size(), 10);
        assert!(storage.capacity() >= 10); // 应该已经扩容
    }

    #[test]
    fn test_storage_clear() {
        let mut storage: SoAStorage<TestComponent> = SoAStorage::new();
        
        // 添加一些组件
        for i in 1..=5 {
            let component = TestComponent {
                x: i as f32,
                y: i as f32,
                name: format!("test{}", i),
                active: true,
                id: i,
                enabled: true,
                update_order: 0,
            };
            storage.add_component(i, component);
        }
        
        assert_eq!(storage.size(), 5);
        
        storage.clear();
        
        assert_eq!(storage.size(), 0);
        for i in 1..=5 {
            assert!(!storage.has_component(i));
        }
    }

    #[test]
    fn test_storage_compact() {
        let mut storage: SoAStorage<TestComponent> = SoAStorage::new();
        
        // 添加组件
        for i in 1..=10 {
            let component = TestComponent {
                x: i as f32,
                y: i as f32,
                name: format!("test{}", i),
                active: true,
                id: i,
                enabled: true,
                update_order: 0,
            };
            storage.add_component(i, component);
        }
        
        // 移除一些组件制造空洞
        storage.remove_component(2);
        storage.remove_component(4);
        storage.remove_component(6);
        
        assert_eq!(storage.size(), 7);
        assert_eq!(storage.free_indices.len(), 3);
        
        storage.compact();
        
        assert_eq!(storage.size(), 7);
        assert!(storage.free_indices.is_empty());
    }

    #[test]
    fn test_storage_stats() {
        let mut storage: SoAStorage<TestComponent> = SoAStorage::new();
        
        storage.register_field("x", SoAFieldMetadata {
            field_type: SoAFieldType::Float32,
            ..Default::default()
        });
        
        storage.register_field("y", SoAFieldMetadata {
            field_type: SoAFieldType::Float64,
            ..Default::default()
        });
        
        let component = TestComponent {
            x: 1.0,
            y: 2.0,
            name: "test".to_string(),
            active: true,
            id: 1,
            enabled: true,
            update_order: 0,
        };
        
        storage.add_component(1, component);
        
        let stats = storage.get_stats();
        assert_eq!(stats.size, 1);
        assert_eq!(stats.capacity, 1000);
        assert!(stats.memory_usage > 0);
        assert!(!stats.field_stats.is_empty());
    }

    #[test]
    fn test_vectorized_operation() {
        let mut storage: SoAStorage<TestComponent> = SoAStorage::new();
        
        storage.register_field("x", SoAFieldMetadata {
            field_type: SoAFieldType::Float32,
            ..Default::default()
        });
        
        // 设置初始数据到Float32字段中
        if let Some(x_field) = storage.get_float32_field_mut("x") {
            for i in 0..5 {
                x_field[i] = (i + 1) as f32;
            }
        }
        
        // 执行向量化操作
        storage.perform_vectorized_operation(|storage| {
            if let Some(x_field) = storage.get_float32_field_mut("x") {
                // 将所有x值乘以2
                for i in 0..5 {
                    x_field[i] *= 2.0;
                }
            }
        });
        
        // 验证操作结果
        if let Some(x_field) = storage.get_float32_field("x") {
            assert_eq!(x_field[0], 2.0); // 第一个元素应该是2
        }
    }

    #[test]
    fn test_entity_index_mapping() {
        let mut storage: SoAStorage<TestComponent> = SoAStorage::new();
        
        let component = TestComponent {
            x: 1.0,
            y: 2.0,
            name: "test".to_string(),
            active: true,
            id: 1,
            enabled: true,
            update_order: 0,
        };
        
        storage.add_component(100, component);
        
        let index = storage.get_entity_index(100);
        assert!(index.is_some());
        
        let entity_id = storage.get_entity_id_by_index(index.unwrap());
        assert_eq!(entity_id, Some(100));
    }

    #[test]
    fn test_active_indices() {
        let mut storage: SoAStorage<TestComponent> = SoAStorage::new();
        
        let component1 = TestComponent {
            x: 1.0,
            y: 1.0,
            name: "test1".to_string(),
            active: true,
            id: 1,
            enabled: true,
            update_order: 0,
        };
        
        let component2 = TestComponent {
            x: 2.0,
            y: 2.0,
            name: "test2".to_string(),
            active: true,
            id: 2,
            enabled: true,
            update_order: 0,
        };
        
        storage.add_component(1, component1);
        storage.add_component(2, component2);
        
        let active_indices = storage.get_active_indices();
        assert_eq!(active_indices.len(), 2);
        
        storage.remove_component(1);
        
        let active_indices = storage.get_active_indices();
        assert_eq!(active_indices.len(), 1);
    }
}