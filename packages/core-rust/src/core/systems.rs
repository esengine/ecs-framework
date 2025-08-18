use crate::core::entity::Entity;
use crate::core::entity_manager::EntityManager;
use crate::storage::component_storage::ComponentStorageManager;
use crate::utils::time::Time;
use std::any::Any;

/**
 * 系统上下文
 * 提供系统执行时需要的各种管理器引用
 */
pub struct SystemContext<'a> {
    pub entity_manager: &'a mut EntityManager,
    pub component_storage_manager: &'a mut ComponentStorageManager,
}

/**
 * 系统基础trait
 * 定义ECS系统的基本接口
 */
pub trait System: Send + Sync {
    /**
     * 系统初始化
     */
    #[allow(unused_variables)]
    fn initialize(&mut self, context: &mut SystemContext) {
        // 默认空实现
    }

    /**
     * 系统更新
     */
    fn update(&mut self, context: &mut SystemContext);

    /**
     * 系统后更新（在所有update完成后调用）
     */
    #[allow(unused_variables)]
    fn late_update(&mut self, context: &mut SystemContext) {
        // 默认空实现
    }

    /**
     * 系统销毁清理
     */
    #[allow(unused_variables)]
    fn cleanup(&mut self, context: &mut SystemContext) {
        // 默认空实现
    }

    /**
     * 获取系统更新顺序
     */
    fn update_order(&self) -> i32 {
        0
    }

    /**
     * 设置系统更新顺序
     */
    fn set_update_order(&mut self, order: i32);

    /**
     * 获取系统启用状态
     */
    fn enabled(&self) -> bool {
        true
    }

    /**
     * 设置系统启用状态
     */
    fn set_enabled(&mut self, enabled: bool);

    /**
     * 获取系统名称
     */
    fn name(&self) -> &str {
        "System"
    }

    /**
     * 转换为Any以支持动态转换
     */
    fn as_any(&self) -> &dyn Any;

    /**
     * 转换为可变Any以支持动态转换
     */
    fn as_any_mut(&mut self) -> &mut dyn Any;
}

/**
 * 实体系统基类
 * 用于处理一组符合特定条件的实体
 */
pub struct EntitySystem {
    update_order: i32,
    enabled: bool,
    name: String,
    initialized: bool,
}

impl EntitySystem {
    pub fn new(name: String) -> Self {
        Self {
            update_order: 0,
            enabled: true,
            name,
            initialized: false,
        }
    }

    /**
     * 检查是否需要处理
     */
    pub fn check_processing(&self) -> bool {
        self.enabled
    }

    /**
     * 处理实体列表
     */
    pub fn process(&mut self, entities: &[&Entity], context: &mut SystemContext) {
        if !self.check_processing() {
            return;
        }
        
        self.process_entities(entities, context);
    }

    /**
     * 处理实体的具体实现（由子类重写）
     */
    #[allow(unused_variables)]
    pub fn process_entities(&mut self, entities: &[&Entity], context: &mut SystemContext) {
        // 默认空实现
    }

    /**
     * 根据实体ID列表处理实体
     * 子类可以重写这个方法实现自定义的实体处理逻辑
     */
    #[allow(unused_variables)]
    pub fn process_entity_ids(&mut self, entity_ids: &[u32], context: &mut SystemContext) {
        // 默认空实现，由子类根据需要重写
        // 这样避免了借用检查问题，因为子类可以自己决定如何访问实体
    }

    /**
     * 处理单个实体（由子类重写）
     */
    #[allow(unused_variables)]
    pub fn process_single_entity(&mut self, entity: &Entity, context: &mut SystemContext) {
        // 默认空实现
    }

    /**
     * 系统初始化回调
     */
    #[allow(unused_variables)]
    pub fn on_initialize(&mut self, context: &mut SystemContext) {
        // 默认空实现
    }

    /**
     * 实体添加到系统时的回调
     */
    #[allow(unused_variables)]
    pub fn on_entity_added(&mut self, entity: &Entity, context: &mut SystemContext) {
        // 默认空实现
    }

    /**
     * 实体从系统移除时的回调
     */
    #[allow(unused_variables)]
    pub fn on_entity_removed(&mut self, entity: &Entity, context: &mut SystemContext) {
        // 默认空实现
    }
}

impl System for EntitySystem {
    fn initialize(&mut self, context: &mut SystemContext) {
        if !self.initialized {
            self.on_initialize(context);
            self.initialized = true;
        }
    }

    fn update(&mut self, context: &mut SystemContext) {
        if !self.enabled {
            return;
        }

        // 先获取所有实体ID
        let entity_ids = context.entity_manager.get_all_entity_ids();
        
        // 然后直接处理，避免同时持有不可变和可变引用
        self.process_entity_ids(&entity_ids, context);
    }

    fn set_update_order(&mut self, order: i32) {
        self.update_order = order;
    }

    fn update_order(&self) -> i32 {
        self.update_order
    }

    fn enabled(&self) -> bool {
        self.enabled
    }

    fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
    }

    fn name(&self) -> &str {
        &self.name
    }

    fn as_any(&self) -> &dyn Any {
        self
    }

    fn as_any_mut(&mut self) -> &mut dyn Any {
        self
    }
}

/**
 * 处理系统
 * 每帧调用processSystem方法
 */
pub struct ProcessingSystem {
    base: EntitySystem,
}

impl ProcessingSystem {
    pub fn new(name: String) -> Self {
        Self {
            base: EntitySystem::new(name),
        }
    }

    /**
     * 处理系统的具体方法，由子类实现
     */
    #[allow(unused_variables)]
    pub fn process_system(&mut self, context: &mut SystemContext) {
        // 默认空实现，由子类重写
    }
}

impl System for ProcessingSystem {
    fn initialize(&mut self, context: &mut SystemContext) {
        self.base.initialize(context);
    }

    fn update(&mut self, context: &mut SystemContext) {
        if self.base.enabled() {
            self.process_system(context);
        }
    }

    fn set_update_order(&mut self, order: i32) {
        self.base.set_update_order(order);
    }

    fn update_order(&self) -> i32 {
        self.base.update_order()
    }

    fn enabled(&self) -> bool {
        self.base.enabled()
    }

    fn set_enabled(&mut self, enabled: bool) {
        self.base.set_enabled(enabled);
    }

    fn name(&self) -> &str {
        self.base.name()
    }

    fn as_any(&self) -> &dyn Any {
        self
    }

    fn as_any_mut(&mut self) -> &mut dyn Any {
        self
    }
}

/**
 * 间隔系统
 * 按指定时间间隔执行处理
 */
pub struct IntervalSystem {
    base: EntitySystem,
    interval: f64,
    accumulator: f64,
}

impl IntervalSystem {
    pub fn new(name: String, interval: f64) -> Self {
        Self {
            base: EntitySystem::new(name),
            interval,
            accumulator: 0.0,
        }
    }

    /**
     * 检查是否应该处理
     */
    fn should_process(&mut self) -> bool {
        if !self.base.enabled() {
            return false;
        }

        self.accumulator += Time::delta_time();

        if self.accumulator >= self.interval {
            self.accumulator -= self.interval;
            true
        } else {
            false
        }
    }

    /**
     * 间隔处理方法，由子类实现
     */
    #[allow(unused_variables)]
    pub fn process_interval(&mut self, context: &mut SystemContext) {
        // 默认空实现，由子类重写
    }
}

impl System for IntervalSystem {
    fn initialize(&mut self, context: &mut SystemContext) {
        self.base.initialize(context);
    }

    fn update(&mut self, context: &mut SystemContext) {
        if self.should_process() {
            self.process_interval(context);
        }
    }

    fn set_update_order(&mut self, order: i32) {
        self.base.set_update_order(order);
    }

    fn update_order(&self) -> i32 {
        self.base.update_order()
    }

    fn enabled(&self) -> bool {
        self.base.enabled()
    }

    fn set_enabled(&mut self, enabled: bool) {
        self.base.set_enabled(enabled);
    }

    fn name(&self) -> &str {
        self.base.name()
    }

    fn as_any(&self) -> &dyn Any {
        self
    }

    fn as_any_mut(&mut self) -> &mut dyn Any {
        self
    }
}

/**
 * 系统管理器
 * 管理所有系统的注册、更新和生命周期
 */
pub struct SystemManager {
    systems: Vec<Box<dyn System>>,
    initialized: bool,
}

impl SystemManager {
    pub fn new() -> Self {
        Self {
            systems: Vec::new(),
            initialized: false,
        }
    }

    /**
     * 添加系统
     */
    pub fn add_system<T: System + 'static>(&mut self, system: T) {
        self.systems.push(Box::new(system));
        // 按更新顺序排序
        self.systems.sort_by_key(|s| s.update_order());
    }

    /**
     * 添加系统（Box版本）
     */
    pub fn add_system_boxed(&mut self, system: Box<dyn System>) {
        self.systems.push(system);
        // 按更新顺序排序
        self.systems.sort_by_key(|s| s.update_order());
    }

    /**
     * 移除系统
     */
    pub fn remove_system<T: System + 'static>(&mut self) -> bool {
        let initial_len = self.systems.len();
        self.systems.retain(|system| {
            !system.as_any().is::<T>()
        });
        initial_len != self.systems.len()
    }

    /**
     * 获取系统
     */
    pub fn get_system<T: System + 'static>(&self) -> Option<&T> {
        for system in &self.systems {
            if let Some(s) = system.as_any().downcast_ref::<T>() {
                return Some(s);
            }
        }
        None
    }

    /**
     * 获取可变系统
     */
    pub fn get_system_mut<T: System + 'static>(&mut self) -> Option<&mut T> {
        for system in &mut self.systems {
            if let Some(s) = system.as_any_mut().downcast_mut::<T>() {
                return Some(s);
            }
        }
        None
    }

    /**
     * 初始化所有系统
     */
    pub fn initialize(&mut self, context: &mut SystemContext) {
        if !self.initialized {
            for system in &mut self.systems {
                system.initialize(context);
            }
            self.initialized = true;
        }
    }

    /**
     * 更新所有系统
     */
    pub fn update(&mut self, context: &mut SystemContext) {
        for system in &mut self.systems {
            if system.enabled() {
                system.update(context);
            }
        }
    }

    /**
     * 后更新所有系统
     */
    pub fn late_update(&mut self, context: &mut SystemContext) {
        for system in &mut self.systems {
            if system.enabled() {
                system.late_update(context);
            }
        }
    }

    /**
     * 清理所有系统
     */
    pub fn cleanup(&mut self, context: &mut SystemContext) {
        for system in &mut self.systems {
            system.cleanup(context);
        }
        self.systems.clear();
        self.initialized = false;
    }

    /**
     * 获取系统数量
     */
    pub fn system_count(&self) -> usize {
        self.systems.len()
    }

    /**
     * 获取启用的系统数量
     */
    pub fn enabled_system_count(&self) -> usize {
        self.systems.iter().filter(|s| s.enabled()).count()
    }
    /**
     * 预留系统容量
     */
    pub fn reserve_capacity(&mut self, capacity: usize) {
        self.systems.reserve(capacity);
    }
}

impl Default for SystemManager {
    fn default() -> Self {
        Self::new()
    }
}