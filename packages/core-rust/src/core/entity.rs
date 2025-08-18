use crate::core::component::Component;
use rustc_hash::FxHashMap;
use std::any::TypeId;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

/// 将TypeId转换为u64的帮助函数
fn type_id_to_u64(type_id: TypeId) -> u64 {
    let mut hasher = DefaultHasher::new();
    type_id.hash(&mut hasher);
    hasher.finish()
}

/**
 * 实体比较器
 * 
 * 用于比较两个实体的优先级，首先按更新顺序比较，然后按ID比较
 */
pub struct EntityComparer;

impl EntityComparer {
    /**
     * 比较两个实体
     * 
     * @param self_entity - 第一个实体
     * @param other_entity - 第二个实体
     * @returns 比较结果，负数表示self优先级更高，正数表示other优先级更高，0表示相等
     */
    pub fn compare(self_entity: &Entity, other_entity: &Entity) -> i32 {
        let mut compare = self_entity.update_order - other_entity.update_order;
        if compare == 0 {
            compare = self_entity.id as i32 - other_entity.id as i32;
        }
        compare
    }
}

/**
 * 游戏实体类
 * 
 * ECS架构中的实体（Entity），作为组件的容器。
 * 实体本身不包含游戏逻辑，所有功能都通过组件来实现。
 * 支持父子关系，可以构建实体层次结构。
 */
#[derive(Clone)]
pub struct Entity {
    /// 实体名称，用于标识和调试的友好名称
    pub name: String,
    
    /// 实体唯一标识符，在场景中唯一的数字标识符
    pub id: u32,
    
    /// 更新间隔，控制实体更新的频率，值越大更新越不频繁
    pub update_interval: u32,
    
    /// 私有字段，通过getter/setter访问
    active: bool,
    enabled: bool,
    is_destroyed: bool,
    tag: u32,
    update_order: i32,
    
    /// 父实体ID
    parent_id: Option<u32>,
    
    /// 子实体ID集合
    children_ids: Vec<u32>,
    
    /// 组件位掩码，用于快速查询实体拥有的组件类型
    component_mask: u64,
    
    /// 组件实例存储 (TypeId -> 组件数据)
    components: FxHashMap<TypeId, Box<dyn Component>>,
    
    /// 组件类型到索引的映射，用于快速定位组件在数组中的位置
    component_type_to_index: FxHashMap<TypeId, usize>,
    
    /// 组件列表（用于保持插入顺序和索引访问）
    component_list: Vec<Option<Box<dyn Component>>>,
}


impl Entity {
    /**
     * 构造函数
     */
    pub fn new(id: u32) -> Self {
        Self {
            name: String::new(),
            id,
            update_interval: 1,
            active: true,
            enabled: true,
            is_destroyed: false,
            tag: 0,
            update_order: 0,
            parent_id: None,
            children_ids: Vec::new(),
            component_mask: 0,
            components: FxHashMap::default(),
            component_type_to_index: FxHashMap::default(),
            component_list: Vec::new(),
        }
    }

    /**
     * 构造函数（带名称）
     */
    pub fn new_with_name(name: String, id: u32) -> Self {
        Self {
            name,
            id,
            update_interval: 1,
            active: true,
            enabled: true,
            is_destroyed: false,
            tag: 0,
            update_order: 0,
            parent_id: None,
            children_ids: Vec::new(),
            component_mask: 0,
            components: FxHashMap::default(),
            component_type_to_index: FxHashMap::default(),
            component_list: Vec::new(),
        }
    }

    // ========== 属性访问器 ==========

    /**
     * 获取实体ID
     */
    pub fn id(&self) -> u32 {
        self.id
    }

    /**
     * 设置实体ID
     */
    pub fn set_id(&mut self, id: u32) {
        self.id = id;
    }

    /**
     * 获取实体名称
     */
    pub fn name(&self) -> Option<String> {
        if self.name.is_empty() {
            None
        } else {
            Some(self.name.clone())
        }
    }

    /**
     * 设置实体名称
     */
    pub fn set_name(&mut self, name: String) {
        self.name = name;
    }

    /**
     * 获取标签集合（暂时返回单个标签作为集合）
     */
    pub fn tags(&self) -> std::collections::HashSet<u32> {
        let mut tags = std::collections::HashSet::new();
        if self.tag != 0 {
            tags.insert(self.tag);
        }
        tags
    }

    /**
     * 检查是否有指定标签
     */
    pub fn has_tag(&self, tag: u32) -> bool {
        self.tag == tag
    }

    /**
     * 添加标签
     */
    pub fn add_tag(&mut self, tag: u32) {
        self.tag = tag; // 简化版本，只支持单个标签
    }

    /**
     * 移除标签
     */
    pub fn remove_tag(&mut self, tag: u32) {
        if self.tag == tag {
            self.tag = 0;
        }
    }

    pub fn active(&self) -> bool {
        self.active
    }

    pub fn set_active(&mut self, value: bool) {
        if self.active != value {
            self.active = value;
            self.on_active_changed();
        }
    }

    pub fn enabled(&self) -> bool {
        self.enabled
    }

    pub fn set_enabled(&mut self, value: bool) {
        self.enabled = value;
    }

    pub fn tag(&self) -> u32 {
        self.tag
    }

    pub fn set_tag(&mut self, value: u32) {
        self.tag = value;
    }

    pub fn update_order(&self) -> i32 {
        self.update_order
    }

    pub fn set_update_order(&mut self, value: i32) {
        self.update_order = value;
    }

    pub fn is_destroyed(&self) -> bool {
        self.is_destroyed
    }

    pub fn get_parent_id(&self) -> Option<u32> {
        self.parent_id
    }

    pub fn child_count(&self) -> usize {
        self.children_ids.len()
    }

    pub fn get_component_mask(&self) -> u64 {
        self.component_mask
    }

    pub fn get_children_ids(&self) -> Vec<u32> {
        self.children_ids.clone()
    }

    // ========== 内部访问方法 ==========
    
    /**
     * 获取子实体ID的切片引用（内部使用）
     */
    pub fn children_ids(&self) -> &[u32] {
        &self.children_ids
    }

    /**
     * 获取父实体ID（内部使用）
     */
    pub fn parent_id(&self) -> Option<u32> {
        self.parent_id
    }

    /**
     * 设置组件位掩码（内部使用）
     */
    pub fn set_component_mask(&mut self, mask: u64) {
        self.component_mask = mask;
    }

    /**
     * 获取调试信息字符串
     */
    pub fn get_debug_info(&self) -> String {
        format!(
            "{{\"name\":\"{}\",\"id\":{},\"enabled\":{},\"active\":{},\"destroyed\":{},\"component_count\":{},\"tag\":{},\"update_order\":{},\"child_count\":{}}}",
            self.name,
            self.id,
            self.enabled,
            self.active,
            self.is_destroyed,
            self.components.len(),
            self.tag,
            self.update_order,
            self.children_ids.len()
        )
    }

    /**
     * 获取调试信息结构体（内部使用）
     */
    pub fn get_debug_info_struct(&self) -> EntityDebugInfo {
        EntityDebugInfo {
            name: self.name.clone(),
            id: self.id,
            enabled: self.enabled,
            active: self.active,
            destroyed: self.is_destroyed,
            component_count: self.components.len(),
            component_mask: format!("{:b}", self.component_mask),
            parent_id: self.parent_id,
            child_count: self.children_ids.len(),
            child_ids: self.children_ids.clone(),
            tag: self.tag,
            update_order: self.update_order,
            index_mapping_size: self.component_type_to_index.len(),
        }
    }

    // ========== 组件管理 ==========

    /**
     * 内部添加组件方法（不进行重复检查，用于初始化）
     */
    fn add_component_internal<T: Component + 'static>(&mut self, component: T) -> &T {
        let type_id = TypeId::of::<T>();
        let boxed_component = Box::new(component);
        
        // 添加到组件列表并建立索引映射
        let index = self.component_list.len();
        self.component_list.push(Some(boxed_component.clone_box()));
        self.component_type_to_index.insert(type_id, index);
        
        // 添加到类型映射
        self.components.insert(type_id, boxed_component);
        
        // 这里应该更新位掩码，但需要ComponentRegistry
        // 暂时使用简单的类型ID哈希作为掩码
        self.component_mask |= 1u64.wrapping_shl(type_id_to_u64(type_id) as u32 % 64);
        
        // 返回引用（这里简化处理）
        self.components.get(&type_id).unwrap().as_any().downcast_ref::<T>().unwrap()
    }

    /**
     * 添加组件到实体
     */
    pub fn add_component<T: Component + 'static>(&mut self, component: T) -> Result<&T, String> {
        let type_id = TypeId::of::<T>();
        
        // 检查是否已有此类型的组件
        if self.has_component::<T>() {
            return Err(format!("Entity {} already has component of type {:?}", self.name, type_id));
        }

        // 使用内部方法添加组件
        Ok(self.add_component_internal(component))
    }

    /**
     * 获取指定类型的组件
     */
    pub fn get_component<T: Component + 'static>(&self) -> Option<&T> {
        let type_id = TypeId::of::<T>();
        
        // 首先检查位掩码，快速排除（简化版本）
        let type_mask = 1u64.wrapping_shl(type_id_to_u64(type_id) as u32 % 64);
        if (self.component_mask & type_mask) == 0 {
            return None;
        }

        // 从类型映射获取
        self.components.get(&type_id).and_then(|component| {
            component.as_any().downcast_ref::<T>()
        })
    }

    /**
     * 获取指定类型的可变组件
     */
    pub fn get_component_mut<T: Component + 'static>(&mut self) -> Option<&mut T> {
        let type_id = TypeId::of::<T>();
        
        // 首先检查位掩码，快速排除
        let type_mask = 1u64.wrapping_shl(type_id_to_u64(type_id) as u32 % 64);
        if (self.component_mask & type_mask) == 0 {
            return None;
        }

        // 从类型映射获取可变引用
        self.components.get_mut(&type_id).and_then(|component| {
            component.as_any_mut().downcast_mut::<T>()
        })
    }

    /**
     * 检查实体是否有指定类型的组件
     */
    pub fn has_component<T: Component + 'static>(&self) -> bool {
        let type_id = TypeId::of::<T>();
        let type_mask = 1u64.wrapping_shl(type_id_to_u64(type_id) as u32 % 64);
        (self.component_mask & type_mask) != 0
    }

    /**
     * 获取或创建指定类型的组件
     */
    pub fn get_or_create_component<T: Component + Default + 'static>(&mut self) -> &T {
        if self.has_component::<T>() {
            self.get_component::<T>().unwrap()
        } else {
            let component = T::default();
            self.add_component_internal(component)
        }
    }

    /**
     * 移除指定类型的组件
     */
    pub fn remove_component<T: Component + 'static>(&mut self) -> Option<Box<dyn Component>> {
        let type_id = TypeId::of::<T>();
        
        if let Some(component) = self.components.remove(&type_id) {
            // 更新位掩码
            let type_mask = 1u64.wrapping_shl(type_id_to_u64(type_id) as u32 % 64);
            self.component_mask &= !type_mask;
            
            // 从索引映射中移除并重建索引
            if let Some(index) = self.component_type_to_index.remove(&type_id) {
                if index < self.component_list.len() {
                    self.component_list[index] = None;
                }
                self.rebuild_component_index();
            }
            
            Some(component)
        } else {
            None
        }
    }

    /**
     * 移除所有组件
     */
    pub fn remove_all_components(&mut self) {
        self.component_type_to_index.clear();
        self.component_mask = 0;
        self.components.clear();
        self.component_list.clear();
    }

    /**
     * 获取组件数量
     */
    pub fn component_count(&self) -> usize {
        self.components.len()
    }

    /**
     * 重建组件索引映射
     */
    fn rebuild_component_index(&mut self) {
        self.component_type_to_index.clear();
        
        let mut new_list = Vec::new();
        for (_i, component_opt) in self.component_list.iter().enumerate() {
            if let Some(component) = component_opt {
                let type_id = component.type_id();
                self.component_type_to_index.insert(type_id, new_list.len());
                new_list.push(Some(component.clone_box()));
            }
        }
        self.component_list = new_list;
    }

    // ========== 层次结构管理 ==========

    /**
     * 添加子实体ID
     */
    pub fn add_child_id(&mut self, child_id: u32) -> Result<(), String> {
        if child_id == self.id {
            return Err("Entity cannot be its own child".to_string());
        }

        if self.children_ids.contains(&child_id) {
            return Ok(()); // 已经是子实体
        }

        self.children_ids.push(child_id);
        Ok(())
    }

    /**
     * 移除子实体ID
     */
    pub fn remove_child_id(&mut self, child_id: u32) -> bool {
        if let Some(pos) = self.children_ids.iter().position(|&id| id == child_id) {
            self.children_ids.remove(pos);
            true
        } else {
            false
        }
    }

    /**
     * 设置父实体ID
     */
    pub fn set_parent_id(&mut self, parent_id: Option<u32>) {
        self.parent_id = parent_id;
    }

    /**
     * 移除所有子实体ID
     */
    pub fn remove_all_children_ids(&mut self) {
        self.children_ids.clear();
    }

    // ========== 生命周期方法 ==========

    /**
     * 激活状态改变时的回调
     */
    fn on_active_changed(&mut self) {
        // 通知所有组件激活状态改变
        for component in self.components.values_mut() {
            component.on_active_changed();
        }
    }

    /**
     * 更新实体
     */
    pub fn update(&mut self) {
        if !self.active || self.is_destroyed {
            return;
        }

        // 更新所有组件
        for component in self.components.values_mut() {
            if component.enabled() {
                component.update();
            }
        }
    }

    /**
     * 销毁实体
     */
    pub fn destroy(&mut self) {
        if self.is_destroyed {
            return;
        }

        self.is_destroyed = true;
        
        // 移除所有组件
        self.remove_all_components();
        
        // 清空子实体ID（实际的子实体销毁由EntityManager处理）
        self.children_ids.clear();
        
        // 清空父实体引用
        self.parent_id = None;
    }

    /**
     * 比较实体
     */
    pub fn compare_to(&self, other: &Entity) -> i32 {
        EntityComparer::compare(self, other)
    }

    /**
     * 获取实体的字符串表示
     */
    pub fn to_string(&self) -> String {
        format!("Entity[{}:{}]", self.name, self.id)
    }

    /**
     * 获取实体的调试信息结构体
     */
    pub fn get_debug_info_detailed(&self) -> EntityDebugInfo {
        EntityDebugInfo {
            name: self.name.clone(),
            id: self.id,
            enabled: self.enabled,
            active: self.active,
            destroyed: self.is_destroyed,
            component_count: self.components.len(),
            component_mask: format!("{:b}", self.component_mask),
            parent_id: self.parent_id,
            child_count: self.children_ids.len(),
            child_ids: self.children_ids.clone(),
            tag: self.tag,
            update_order: self.update_order,
            index_mapping_size: self.component_type_to_index.len(),
        }
    }
}

/**
 * 实体调试信息
 */
#[derive(serde::Serialize, serde::Deserialize)]
pub struct EntityDebugInfo {
    pub name: String,
    pub id: u32,
    pub enabled: bool,
    pub active: bool,
    pub destroyed: bool,
    pub component_count: usize,
    pub component_mask: String,
    pub parent_id: Option<u32>,
    pub child_count: usize,
    pub child_ids: Vec<u32>,
    pub tag: u32,
    pub update_order: i32,
    pub index_mapping_size: usize,
}

impl std::fmt::Display for Entity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Entity[{}:{}]", self.name, self.id)
    }
}

impl std::fmt::Debug for Entity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Entity")
            .field("name", &self.name)
            .field("id", &self.id)
            .field("active", &self.active)
            .field("enabled", &self.enabled)
            .field("is_destroyed", &self.is_destroyed)
            .field("tag", &self.tag)
            .field("update_order", &self.update_order)
            .field("parent_id", &self.parent_id)
            .field("children_count", &self.children_ids.len())
            .field("component_count", &self.components.len())
            .finish()
    }
}