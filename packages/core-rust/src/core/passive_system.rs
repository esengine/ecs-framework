use crate::core::Entity;
use crate::core::systems::{System, SystemContext};
use crate::utils::{Matcher, Time};

/**
 * 被动实体系统
 * 
 * 定义一个被动的实体系统，继承自EntitySystem类。
 * 被动的实体系统不会对实体进行任何修改，只会被动地接收实体的变化事件。
 * 主要用于监听、记录或收集数据的场景。
 */
pub struct PassiveSystem {
    pub matcher: Option<Matcher>,
    pub priority: i32,
    pub enabled: bool,
    pub name: String,
}

impl PassiveSystem {
    /**
     * 创建新的被动系统
     */
    pub fn new(name: String, matcher: Option<Matcher>) -> Self {
        Self {
            matcher,
            priority: 0,
            enabled: true,
            name,
        }
    }

    /**
     * 设置系统优先级
     */
    pub fn with_priority(mut self, priority: i32) -> Self {
        self.priority = priority;
        self
    }

    /**
     * 设置系统启用状态
     */
    pub fn with_enabled(mut self, enabled: bool) -> Self {
        self.enabled = enabled;
        self
    }

    /**
     * 获取系统名称
     */
    pub fn get_name(&self) -> &str {
        &self.name
    }

    /**
     * 获取匹配器
     */
    pub fn get_matcher(&self) -> Option<&Matcher> {
        self.matcher.as_ref()
    }

    /**
     * 检查是否启用
     */
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /**
     * 设置启用状态
     */
    pub fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
    }

    /**
     * 获取优先级
     */
    pub fn get_priority(&self) -> i32 {
        self.priority
    }

    /**
     * 设置优先级
     */
    pub fn set_priority(&mut self, priority: i32) {
        self.priority = priority;
    }

    /**
     * 系统初始化
     * 子类可以重写此方法进行自定义初始化
     */
    pub fn initialize(&mut self) {
        // 默认空实现，子类可以重写
    }

    /**
     * 系统更新前调用
     * 子类可以重写此方法进行预处理
     */
    pub fn before_update(&mut self, _time: &Time) {
        // 默认空实现，子类可以重写
    }

    /**
     * 系统更新后调用
     * 子类可以重写此方法进行后处理
     */
    pub fn after_update(&mut self, _time: &Time) {
        // 默认空实现，子类可以重写
    }

    /**
     * 系统清理
     * 子类可以重写此方法进行清理工作
     */
    pub fn cleanup(&mut self) {
        // 默认空实现，子类可以重写
    }

    /**
     * 实体添加通知
     * 当匹配的实体被添加到系统时调用
     */
    pub fn on_entity_added(&mut self, _entity: &Entity) {
        // 默认空实现，子类可以重写进行处理
    }

    /**
     * 实体移除通知
     * 当匹配的实体从系统中移除时调用
     */
    pub fn on_entity_removed(&mut self, _entity: &Entity) {
        // 默认空实现，子类可以重写进行处理
    }

    /**
     * 组件添加通知
     * 当实体添加组件时调用
     */
    pub fn on_component_added(&mut self, _entity: &Entity, _component_type: std::any::TypeId) {
        // 默认空实现，子类可以重写进行处理
    }

    /**
     * 组件移除通知
     * 当实体移除组件时调用
     */
    pub fn on_component_removed(&mut self, _entity: &Entity, _component_type: std::any::TypeId) {
        // 默认空实现，子类可以重写进行处理
    }
}

impl System for PassiveSystem {
    fn update(&mut self, _context: &mut SystemContext) {
        // 被动系统不进行任何处理
        // 所有的业务逻辑都应该在事件处理方法中实现
    }

    fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
    }

    fn set_update_order(&mut self, order: i32) {
        self.priority = order;
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn as_any_mut(&mut self) -> &mut dyn std::any::Any {
        self
    }
}

/**
 * 被动系统构建器
 * 提供链式调用构建被动系统
 */
pub struct PassiveSystemBuilder {
    name: String,
    matcher: Option<Matcher>,
    priority: i32,
    enabled: bool,
}

impl PassiveSystemBuilder {
    /**
     * 创建新的被动系统构建器
     */
    pub fn new(name: String) -> Self {
        Self {
            name,
            matcher: None,
            priority: 0,
            enabled: true,
        }
    }

    /**
     * 设置匹配器
     */
    pub fn with_matcher(mut self, matcher: Matcher) -> Self {
        self.matcher = Some(matcher);
        self
    }

    /**
     * 设置优先级
     */
    pub fn with_priority(mut self, priority: i32) -> Self {
        self.priority = priority;
        self
    }

    /**
     * 设置启用状态
     */
    pub fn with_enabled(mut self, enabled: bool) -> Self {
        self.enabled = enabled;
        self
    }

    /**
     * 构建被动系统
     */
    pub fn build(self) -> PassiveSystem {
        PassiveSystem {
            name: self.name,
            matcher: self.matcher,
            priority: self.priority,
            enabled: self.enabled,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{Entity, ComponentRegistry};

    #[test]
    fn test_passive_system_creation() {
        let system = PassiveSystem::new("TestPassive".to_string(), None);
        
        assert_eq!(system.get_name(), "TestPassive");
        assert!(system.enabled());
        assert_eq!(system.get_priority(), 0);
        assert!(system.get_matcher().is_none());
    }

    #[test]
    fn test_passive_system_builder() {
        let system = PassiveSystemBuilder::new("TestPassive".to_string())
            .with_priority(10)
            .with_enabled(false)
            .build();
        
        assert_eq!(system.get_name(), "TestPassive");
        assert!(!system.enabled());
        assert_eq!(system.get_priority(), 10);
    }

    #[test]
    fn test_passive_system_with_matcher() {
        let matcher = Matcher::new();
        let system = PassiveSystemBuilder::new("TestPassive".to_string())
            .with_matcher(matcher)
            .build();
        
        assert!(system.get_matcher().is_some());
    }

    #[test]
    fn test_passive_system_update_does_nothing() {
        use crate::core::systems::{System, SystemContext};
        use crate::core::EntityManager;
        use crate::storage::ComponentStorageManager;
        
        let mut system = PassiveSystem::new("TestPassive".to_string(), None);
        let mut entity_manager = EntityManager::new();
        let mut component_storage_manager = ComponentStorageManager::new();
        let mut context = SystemContext {
            entity_manager: &mut entity_manager,
            component_storage_manager: &mut component_storage_manager,
        };
        
        // update方法不应该做任何事情
        system.update(&mut context);
        
        // 如果没有panic，说明update方法正确地什么都没做
    }

    #[test]
    fn test_passive_system_properties() {
        let mut system = PassiveSystem::new("TestPassive".to_string(), None);
        
        // 测试系统属性
        assert!(system.enabled());
        
        system.set_enabled(false);
        assert!(!system.enabled());
        
        assert_eq!(system.get_name(), "TestPassive");
        assert_eq!(system.get_priority(), 0);
    }

    #[test]
    fn test_passive_system_lifecycle() {
        let mut system = PassiveSystem::new("TestPassive".to_string(), None);
        let time = Time::new();
        
        // 测试生命周期方法（都应该是安全的空操作）
        system.initialize();
        system.before_update(&time);
        system.after_update(&time);
        system.cleanup();
        
        // 如果没有panic，说明所有生命周期方法都正确工作
    }

    #[test]
    fn test_passive_system_entity_events() {
        let mut system = PassiveSystem::new("TestPassive".to_string(), None);
        let mut registry = ComponentRegistry::new();
        let entity = Entity::new("test_entity".to_string(), 1);
        
        // 测试实体事件方法（都应该是安全的空操作）
        system.on_entity_added(&entity);
        system.on_entity_removed(&entity);
        system.on_component_added(&entity, std::any::TypeId::of::<String>());
        system.on_component_removed(&entity, std::any::TypeId::of::<String>());
        
        // 如果没有panic，说明所有事件处理方法都正确工作
    }

    #[test]
    fn test_passive_system_priority_modification() {
        let mut system = PassiveSystem::new("TestPassive".to_string(), None);
        
        assert_eq!(system.get_priority(), 0);
        
        system.set_priority(100);
        assert_eq!(system.get_priority(), 100);
        
        system.set_priority(-50);
        assert_eq!(system.get_priority(), -50);
    }
}