use rustc_hash::FxHashMap;
use std::any::{Any, TypeId};
use std::sync::atomic::{AtomicU32, Ordering};

/**
 * 组件ID生成器
 * 全局静态变量，为每个组件实例分配唯一ID
 */
static COMPONENT_ID_GENERATOR: AtomicU32 = AtomicU32::new(0);


/**
 * 组件注册表
 * 管理组件类型的位掩码分配
 */
pub struct ComponentRegistry {
    component_types: FxHashMap<TypeId, u32>,
    component_names: FxHashMap<String, TypeId>,
    component_name_to_id: FxHashMap<String, u32>,
    next_bit_index: u32,
    max_components: u32,
}

impl ComponentRegistry {
    pub fn new() -> Self {
        Self {
            component_types: FxHashMap::default(),
            component_names: FxHashMap::default(),
            component_name_to_id: FxHashMap::default(),
            next_bit_index: 0,
            max_components: 64,
        }
    }

    /**
     * 注册组件类型并分配位掩码
     * @param type_id 组件类型ID
     * @param name 组件名称
     * @returns 分配的位索引
     */
    pub fn register(&mut self, type_id: TypeId, name: String) -> Result<u32, String> {
        if let Some(&existing_index) = self.component_types.get(&type_id) {
            return Ok(existing_index);
        }

        if self.next_bit_index >= self.max_components {
            return Err(format!(
                "Maximum number of component types ({}) exceeded",
                self.max_components
            ));
        }

        let bit_index = self.next_bit_index;
        self.next_bit_index += 1;

        self.component_types.insert(type_id, bit_index);
        self.component_names.insert(name.clone(), type_id);
        self.component_name_to_id.insert(name, bit_index);

        Ok(bit_index)
    }

    /**
     * 获取组件类型的位掩码
     * @param type_id 组件类型ID
     * @returns 位掩码
     */
    pub fn get_bit_mask(&self, type_id: &TypeId) -> Option<u64> {
        self.component_types.get(type_id).map(|&bit_index| 1u64 << bit_index)
    }

    /**
     * 获取组件类型的位索引
     * @param type_id 组件类型ID
     * @returns 位索引
     */
    pub fn get_bit_index(&self, type_id: &TypeId) -> Option<u32> {
        self.component_types.get(type_id).copied()
    }

    /**
     * 检查组件类型是否已注册
     * @param type_id 组件类型ID
     * @returns 是否已注册
     */
    pub fn is_registered(&self, type_id: &TypeId) -> bool {
        self.component_types.contains_key(type_id)
    }

    /**
     * 通过名称获取组件类型ID
     * @param name 组件名称
     * @returns 组件类型ID
     */
    pub fn get_component_id(&self, name: &str) -> Option<u32> {
        self.component_name_to_id.get(name).copied()
    }

    /**
     * 创建组件掩码
     * @param component_names 组件名称数组
     * @returns 组合掩码
     */
    pub fn create_component_mask(&self, component_names: &[String]) -> u64 {
        let mut mask = 0u64;
        for name in component_names {
            if let Some(&component_id) = self.component_name_to_id.get(name) {
                mask |= 1u64 << component_id;
            }
        }
        mask
    }

    /**
     * 重置注册表
     */
    pub fn reset(&mut self) {
        self.component_types.clear();
        self.component_names.clear();
        self.component_name_to_id.clear();
        self.next_bit_index = 0;
    }
}

/**
 * 游戏组件基础trait
 * 
 * ECS架构中的组件（Component），用于实现具体的游戏功能。
 * 组件包含数据和行为，可以被添加到实体上以扩展实体的功能。
 */
pub trait Component: Send + Sync where Self: 'static {
    /**
     * 获取组件的唯一标识符
     * 在整个游戏生命周期中唯一的数字ID
     */
    fn id(&self) -> u32;

    /**
     * 获取组件启用状态
     * 组件的实际启用状态取决于自身状态和所属实体的状态
     */
    fn enabled(&self) -> bool {
        true // 默认启用
    }

    /**
     * 设置组件启用状态
     * 当状态改变时会触发相应的生命周期回调
     */
    fn set_enabled(&mut self, enabled: bool);

    /**
     * 获取更新顺序
     * 决定组件在更新循环中的执行顺序
     */
    fn update_order(&self) -> i32 {
        0 // 默认更新顺序
    }

    /**
     * 设置更新顺序
     */
    fn set_update_order(&mut self, order: i32);

    /**
     * 组件添加到实体时的回调
     * 当组件被添加到实体时调用，可以在此方法中进行初始化操作
     */
    fn on_added_to_entity(&mut self) {}

    /**
     * 组件从实体移除时的回调
     * 当组件从实体中移除时调用，可以在此方法中进行清理操作
     */
    fn on_removed_from_entity(&mut self) {}

    /**
     * 组件启用时的回调
     * 当组件被启用时调用
     */
    fn on_enabled(&mut self) {}

    /**
     * 组件禁用时的回调
     * 当组件被禁用时调用
     */
    fn on_disabled(&mut self) {}

    /**
     * 实体激活状态改变时的回调
     * 当所属实体的激活状态改变时调用
     */
    fn on_active_changed(&mut self) {}

    /**
     * 更新组件
     * 每帧调用，用于更新组件的逻辑
     * 子类应该重写此方法来实现具体的更新逻辑
     */
    fn update(&mut self) {}

    // ========== Any trait 方法 ==========
    
    /**
     * 获取组件作为Any引用，用于类型转换
     */
    fn as_any(&self) -> &dyn Any;

    /**
     * 获取组件作为可变Any引用，用于类型转换
     */
    fn as_any_mut(&mut self) -> &mut dyn Any;

    /**
     * 克隆组件到Box中
     */
    fn clone_box(&self) -> Box<dyn Component>;

    /**
     * 获取组件的TypeId
     */
    fn type_id(&self) -> TypeId {
        TypeId::of::<Self>()
    }

    /**
     * 获取组件类型名称（用于调试）
     */
    fn type_name(&self) -> &'static str {
        std::any::type_name::<Self>()
    }
}

/**
 * 为Box<dyn Component>实现Clone
 */
impl Clone for Box<dyn Component> {
    fn clone(&self) -> Box<dyn Component> {
        self.clone_box()
    }
}

/**
 * 基础组件实现
 * 提供默认的组件行为，具体组件可以继承此结构体
 */
#[derive(Debug, Clone)]
pub struct BaseComponent {
    /// 组件唯一标识符
    id: u32,
    /// 组件启用状态
    enabled: bool,
    /// 更新顺序
    update_order: i32,
}

impl BaseComponent {
    /**
     * 创建新的基础组件
     */
    pub fn new() -> Self {
        Self {
            id: COMPONENT_ID_GENERATOR.fetch_add(1, Ordering::SeqCst),
            enabled: true,
            update_order: 0,
        }
    }

    /**
     * 生成下一个组件ID
     */
    pub fn next_component_id() -> u32 {
        COMPONENT_ID_GENERATOR.fetch_add(1, Ordering::SeqCst)
    }

    /**
     * 设置组件ID
     */
    pub fn set_id(&mut self, id: u32) {
        self.id = id;
    }
}

impl Default for BaseComponent {
    fn default() -> Self {
        Self::new()
    }
}

impl Component for BaseComponent {
    fn id(&self) -> u32 {
        self.id
    }

    fn enabled(&self) -> bool {
        self.enabled
    }

    fn set_enabled(&mut self, enabled: bool) {
        if self.enabled != enabled {
            self.enabled = enabled;
            if enabled {
                self.on_enabled();
            } else {
                self.on_disabled();
            }
        }
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
        Box::new(BaseComponent {
            id: BaseComponent::next_component_id(), // 新的克隆应该有新的ID
            enabled: self.enabled,
            update_order: self.update_order,
        })
    }
}

/**
 * 组件宏，用于简化自定义组件的实现
 */
#[macro_export]
macro_rules! impl_component {
    ($component_type:ty) => {
        impl Component for $component_type {
            fn id(&self) -> u32 {
                self.base.id()
            }

            fn enabled(&self) -> bool {
                self.base.enabled()
            }

            fn set_enabled(&mut self, enabled: bool) {
                self.base.set_enabled(enabled)
            }

            fn update_order(&self) -> i32 {
                self.base.update_order()
            }

            fn set_update_order(&mut self, order: i32) {
                self.base.set_update_order(order)
            }

            fn as_any(&self) -> &dyn std::any::Any {
                self
            }

            fn as_any_mut(&mut self) -> &mut dyn std::any::Any {
                self
            }

            fn clone_box(&self) -> Box<dyn Component> {
                Box::new(self.clone())
            }
        }
    };
}

