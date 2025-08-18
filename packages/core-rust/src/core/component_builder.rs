use std::marker::PhantomData;
use crate::core::{Component, BaseComponent};

/**
 * 组件构建器
 * 提供流式API创建和配置组件
 */
pub struct ComponentBuilder<T: Component> {
    component: T,
    _phantom: PhantomData<T>,
}

impl<T: Component> ComponentBuilder<T> {
    /**
     * 创建组件构建器
     */
    pub fn new(component: T) -> Self {
        Self {
            component,
            _phantom: PhantomData,
        }
    }

    /**
     * 设置组件启用状态
     */
    pub fn enabled(mut self, enabled: bool) -> Self {
        self.component.set_enabled(enabled);
        self
    }

    /**
     * 条件性设置启用状态
     */
    pub fn enabled_if(mut self, condition: bool, enabled: bool) -> Self {
        if condition {
            self.component.set_enabled(enabled);
        }
        self
    }

    /**
     * 使用配置函数设置组件
     */
    pub fn configure<F>(mut self, configurator: F) -> Self
    where
        F: FnOnce(&mut T),
    {
        configurator(&mut self.component);
        self
    }

    /**
     * 条件性配置组件
     */
    pub fn configure_if<F>(mut self, condition: bool, configurator: F) -> Self
    where
        F: FnOnce(&mut T),
    {
        if condition {
            configurator(&mut self.component);
        }
        self
    }

    /**
     * 构建并返回组件
     */
    pub fn build(self) -> T {
        self.component
    }

    /**
     * 验证组件配置并构建
     */
    pub fn validate_and_build<F>(self, validator: F) -> Result<T, String>
    where
        F: FnOnce(&T) -> Result<(), String>,
    {
        match validator(&self.component) {
            Ok(()) => Ok(self.component),
            Err(error) => Err(error),
        }
    }
}

/**
 * 基础组件构建器
 * 为BaseComponent提供特化的构建器实现
 */
pub struct BaseComponentBuilder {
    component: BaseComponent,
}

impl BaseComponentBuilder {
    /**
     * 创建基础组件构建器
     */
    pub fn new() -> Self {
        Self {
            component: BaseComponent::new(),
        }
    }

    /**
     * 设置组件启用状态
     */
    pub fn enabled(mut self, enabled: bool) -> Self {
        self.component.set_enabled(enabled);
        self
    }

    /**
     * 设置组件ID
     */
    pub fn with_id(mut self, id: u32) -> Self {
        self.component.set_id(id);
        self
    }

    /**
     * 条件性设置启用状态
     */
    pub fn enabled_if(mut self, condition: bool, enabled: bool) -> Self {
        if condition {
            self.component.set_enabled(enabled);
        }
        self
    }

    /**
     * 使用配置函数设置组件
     */
    pub fn configure<F>(mut self, configurator: F) -> Self
    where
        F: FnOnce(&mut BaseComponent),
    {
        configurator(&mut self.component);
        self
    }

    /**
     * 构建并返回组件
     */
    pub fn build(self) -> BaseComponent {
        self.component
    }
}

/**
 * 组件构建器工厂
 * 提供创建各种组件构建器的便捷方法
 */
pub struct ComponentBuilderFactory;

impl ComponentBuilderFactory {
    /**
     * 创建基础组件构建器
     */
    pub fn base_component() -> BaseComponentBuilder {
        BaseComponentBuilder::new()
    }

    /**
     * 创建通用组件构建器
     */
    pub fn component<T: Component>(component: T) -> ComponentBuilder<T> {
        ComponentBuilder::new(component)
    }

    /**
     * 创建启用的基础组件
     */
    pub fn enabled_base_component() -> BaseComponentBuilder {
        BaseComponentBuilder::new().enabled(true)
    }

    /**
     * 创建禁用的基础组件
     */
    pub fn disabled_base_component() -> BaseComponentBuilder {
        BaseComponentBuilder::new().enabled(false)
    }
}

/**
 * 组件构建器统计信息
 */
#[derive(Debug, Clone)]
pub struct ComponentBuilderStats {
    pub total_components_built: u64,
    pub base_components_built: u64,
    pub custom_components_built: u64,
    pub validation_failures: u64,
}

impl ComponentBuilderStats {
    pub fn new() -> Self {
        Self {
            total_components_built: 0,
            base_components_built: 0,
            custom_components_built: 0,
            validation_failures: 0,
        }
    }

    /**
     * 重置统计信息
     */
    pub fn reset(&mut self) {
        self.total_components_built = 0;
        self.base_components_built = 0;
        self.custom_components_built = 0;
        self.validation_failures = 0;
    }

    /**
     * 记录基础组件构建
     */
    pub fn record_base_component_built(&mut self) {
        self.total_components_built += 1;
        self.base_components_built += 1;
    }

    /**
     * 记录自定义组件构建
     */
    pub fn record_custom_component_built(&mut self) {
        self.total_components_built += 1;
        self.custom_components_built += 1;
    }

    /**
     * 记录验证失败
     */
    pub fn record_validation_failure(&mut self) {
        self.validation_failures += 1;
    }

    /**
     * 获取构建成功率
     */
    pub fn success_rate(&self) -> f64 {
        if self.total_components_built + self.validation_failures == 0 {
            return 1.0;
        }
        self.total_components_built as f64 / 
        (self.total_components_built + self.validation_failures) as f64
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base_component_builder() {
        let component = BaseComponentBuilder::new()
            .enabled(true)
            .with_id(123)
            .build();

        assert!(component.enabled());
        assert_eq!(component.id(), 123);
    }

    #[test]
    fn test_base_component_builder_conditional() {
        let component = BaseComponentBuilder::new()
            .enabled_if(true, true)
            .enabled_if(false, false)
            .build();

        assert!(component.enabled());
    }

    #[test]
    fn test_base_component_builder_configure() {
        let component = BaseComponentBuilder::new()
            .configure(|comp| {
                comp.set_enabled(true);
                comp.set_id(456);
            })
            .build();

        assert!(component.enabled());
        assert_eq!(component.id(), 456);
    }

    #[test]
    fn test_component_builder_factory() {
        let base_comp = ComponentBuilderFactory::base_component().build();
        assert!(!base_comp.enabled()); // 默认为禁用

        let enabled_comp = ComponentBuilderFactory::enabled_base_component().build();
        assert!(enabled_comp.enabled());

        let disabled_comp = ComponentBuilderFactory::disabled_base_component().build();
        assert!(!disabled_comp.enabled());
    }

    #[test]
    fn test_component_builder_validation() {
        let component = BaseComponent::new();
        let builder = ComponentBuilder::new(component);

        // 验证成功
        let result = builder.validate_and_build(|_| Ok(()));
        assert!(result.is_ok());

        // 验证失败
        let component2 = BaseComponent::new();
        let builder2 = ComponentBuilder::new(component2);
        let result2 = builder2.validate_and_build(|_| Err("Invalid component".to_string()));
        assert!(result2.is_err());
        assert_eq!(result2.unwrap_err(), "Invalid component");
    }

    #[test]
    fn test_component_builder_stats() {
        let mut stats = ComponentBuilderStats::new();
        
        stats.record_base_component_built();
        stats.record_custom_component_built();
        stats.record_validation_failure();

        assert_eq!(stats.total_components_built, 2);
        assert_eq!(stats.base_components_built, 1);
        assert_eq!(stats.custom_components_built, 1);
        assert_eq!(stats.validation_failures, 1);
        assert!((stats.success_rate() - 0.6666666666666666).abs() < 0.0001);
    }

    #[test]
    fn test_component_builder_stats_reset() {
        let mut stats = ComponentBuilderStats::new();
        
        stats.record_base_component_built();
        stats.reset();

        assert_eq!(stats.total_components_built, 0);
        assert_eq!(stats.base_components_built, 0);
        assert_eq!(stats.custom_components_built, 0);
        assert_eq!(stats.validation_failures, 0);
    }

    #[test]
    fn test_component_builder_stats_success_rate_empty() {
        let stats = ComponentBuilderStats::new();
        assert_eq!(stats.success_rate(), 1.0);
    }
}