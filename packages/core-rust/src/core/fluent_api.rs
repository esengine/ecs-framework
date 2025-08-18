use crate::core::Entity;
use crate::utils::ComponentType;

/**
 * 实体构建器
 * 提供流式API创建和配置实体
 */
pub struct EntityBuilder {
    entity: Entity,
    scene_id: Option<u32>,
}

impl EntityBuilder {
    /**
     * 创建新的实体构建器
     */
    pub fn new(name: &str, entity_id: u32) -> Self {
        let mut entity = Entity::new(entity_id);
        entity.set_name(name.to_string());
        Self {
            entity,
            scene_id: None,
        }
    }

    /**
     * 设置实体名称
     */
    pub fn named(mut self, name: &str) -> Self {
        self.entity.name = name.to_string();
        self
    }

    /**
     * 设置实体标签
     */
    pub fn tagged(mut self, tag: u32) -> Self {
        self.entity.set_tag(tag);
        self
    }

    /**
     * 设置实体为启用状态
     */
    pub fn enabled(mut self, enabled: bool) -> Self {
        self.entity.set_enabled(enabled);
        self
    }

    /**
     * 设置实体为活跃状态
     */
    pub fn active(mut self, active: bool) -> Self {
        self.entity.set_active(active);
        self
    }

    /**
     * 设置更新顺序
     */
    pub fn with_update_order(mut self, order: i32) -> Self {
        self.entity.set_update_order(order);
        self
    }

    /**
     * 添加子实体ID
     */
    pub fn with_child(mut self, child_id: u32) -> Self {
        let _ = self.entity.add_child_id(child_id);
        self
    }

    /**
     * 批量添加子实体ID
     */
    pub fn with_children(mut self, child_ids: Vec<u32>) -> Self {
        for child_id in child_ids {
            let _ = self.entity.add_child_id(child_id);
        }
        self
    }

    /**
     * 条件性设置属性
     */
    pub fn with_if<F>(self, condition: bool, func: F) -> Self
    where
        F: FnOnce(Self) -> Self,
    {
        if condition {
            func(self)
        } else {
            self
        }
    }

    /**
     * 获取构建的实体（消耗builder）
     */
    pub fn build(self) -> Entity {
        self.entity
    }

    /**
     * 获取实体的引用
     */
    pub fn get_entity(&self) -> &Entity {
        &self.entity
    }

    /**
     * 获取实体的可变引用
     */
    pub fn get_entity_mut(&mut self) -> &mut Entity {
        &mut self.entity
    }

    /**
     * 克隆构建器
     */
    pub fn clone_builder(&self, new_entity_id: u32) -> Self {
        // 由于Entity没有实现Clone，我们创建一个新的Entity
        let mut new_entity = Entity::new(new_entity_id);
        if let Some(name) = self.entity.name() {
            new_entity.set_name(name);
        }
        new_entity.set_tag(self.entity.tag());
        new_entity.set_active(self.entity.active());
        new_entity.set_enabled(self.entity.enabled());
        new_entity.set_update_order(self.entity.update_order());
        
        Self {
            entity: new_entity,
            scene_id: self.scene_id,
        }
    }
}

/**
 * 查询构建器
 * 提供流式API构建复杂查询
 */
pub struct QueryBuilder {
    component_types: Vec<ComponentType>,
    any_component_types: Vec<ComponentType>,
    none_component_types: Vec<ComponentType>,
    tag_filter: Option<u32>,
    name_filter: Option<String>,
    active_only: bool,
    enabled_only: bool,
}

impl QueryBuilder {
    /**
     * 创建新的查询构建器
     */
    pub fn new() -> Self {
        Self {
            component_types: Vec::new(),
            any_component_types: Vec::new(),
            none_component_types: Vec::new(),
            tag_filter: None,
            name_filter: None,
            active_only: false,
            enabled_only: false,
        }
    }

    /**
     * 添加必须包含的组件类型
     */
    pub fn with_component(mut self, component_type: ComponentType) -> Self {
        self.component_types.push(component_type);
        self
    }

    /**
     * 添加多个必须包含的组件类型
     */
    pub fn with_components(mut self, component_types: Vec<ComponentType>) -> Self {
        self.component_types.extend(component_types);
        self
    }

    /**
     * 添加任意一个包含的组件类型
     */
    pub fn with_any_component(mut self, component_type: ComponentType) -> Self {
        self.any_component_types.push(component_type);
        self
    }

    /**
     * 添加多个任意一个包含的组件类型
     */
    pub fn with_any_components(mut self, component_types: Vec<ComponentType>) -> Self {
        self.any_component_types.extend(component_types);
        self
    }

    /**
     * 添加必须不包含的组件类型
     */
    pub fn without_component(mut self, component_type: ComponentType) -> Self {
        self.none_component_types.push(component_type);
        self
    }

    /**
     * 添加多个必须不包含的组件类型
     */
    pub fn without_components(mut self, component_types: Vec<ComponentType>) -> Self {
        self.none_component_types.extend(component_types);
        self
    }

    /**
     * 按标签过滤
     */
    pub fn with_tag(mut self, tag: u32) -> Self {
        self.tag_filter = Some(tag);
        self
    }

    /**
     * 按名称过滤
     */
    pub fn with_name(mut self, name: &str) -> Self {
        self.name_filter = Some(name.to_string());
        self
    }

    /**
     * 只查询活跃实体
     */
    pub fn active_only(mut self) -> Self {
        self.active_only = true;
        self
    }

    /**
     * 只查询启用实体
     */
    pub fn enabled_only(mut self) -> Self {
        self.enabled_only = true;
        self
    }

    /**
     * 获取所有查询条件
     */
    pub fn get_all_components(&self) -> &Vec<ComponentType> {
        &self.component_types
    }

    /**
     * 获取任意查询条件
     */
    pub fn get_any_components(&self) -> &Vec<ComponentType> {
        &self.any_component_types
    }

    /**
     * 获取排除查询条件
     */
    pub fn get_none_components(&self) -> &Vec<ComponentType> {
        &self.none_component_types
    }

    /**
     * 获取标签过滤器
     */
    pub fn get_tag_filter(&self) -> Option<u32> {
        self.tag_filter
    }

    /**
     * 获取名称过滤器
     */
    pub fn get_name_filter(&self) -> Option<&String> {
        self.name_filter.as_ref()
    }

    /**
     * 是否只查询活跃实体
     */
    pub fn is_active_only(&self) -> bool {
        self.active_only
    }

    /**
     * 是否只查询启用实体
     */
    pub fn is_enabled_only(&self) -> bool {
        self.enabled_only
    }
}

impl Default for QueryBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/**
 * 流式API统计信息
 */
#[derive(Debug, Clone)]
pub struct FluentAPIStats {
    /// 创建的实体构建器数量
    pub entity_builders_created: u32,
    /// 创建的查询构建器数量
    pub query_builders_created: u32,
    /// 执行的批量操作数量
    pub batch_operations_executed: u32,
    /// 使用的工厂函数数量
    pub factory_functions_used: u32,
    /// 条件操作执行次数
    pub conditional_operations: u32,
}

impl Default for FluentAPIStats {
    fn default() -> Self {
        Self {
            entity_builders_created: 0,
            query_builders_created: 0,
            batch_operations_executed: 0,
            factory_functions_used: 0,
            conditional_operations: 0,
        }
    }
}

/**
 * ECS流式API主入口
 * 提供统一的流式接口
 */
pub struct ECSFluentAPI {
    /// 统计信息
    stats: FluentAPIStats,
}

impl ECSFluentAPI {
    /**
     * 创建新的流式API实例
     */
    pub fn new() -> Self {
        Self {
            stats: FluentAPIStats::default(),
        }
    }

    /**
     * 创建实体构建器
     */
    pub fn create_entity(&mut self, name: &str, entity_id: u32) -> EntityBuilder {
        self.stats.entity_builders_created += 1;
        EntityBuilder::new(name, entity_id)
    }

    /**
     * 创建查询构建器
     */
    pub fn query(&mut self) -> QueryBuilder {
        self.stats.query_builders_created += 1;
        QueryBuilder::new()
    }

    /**
     * 条件性执行操作
     */
    pub fn when<F, T>(&mut self, condition: bool, operation: F) -> Option<T>
    where
        F: FnOnce() -> T,
    {
        self.stats.conditional_operations += 1;
        if condition {
            Some(operation())
        } else {
            None
        }
    }

    /**
     * 批量创建实体
     */
    pub fn create_entities_batch(
        &mut self,
        count: u32,
        name_prefix: &str,
        start_id: u32,
    ) -> Vec<EntityBuilder> {
        self.stats.batch_operations_executed += 1;
        
        let mut builders = Vec::with_capacity(count as usize);
        for i in 0..count {
            let name = format!("{}_{}", name_prefix, i);
            let builder = EntityBuilder::new(&name, start_id + i);
            builders.push(builder);
        }
        
        self.stats.entity_builders_created += count;
        builders
    }

    /**
     * 使用工厂函数创建实体
     */
    pub fn create_entity_with_factory<F>(
        &mut self,
        name: &str,
        entity_id: u32,
        factory: F,
    ) -> EntityBuilder
    where
        F: FnOnce(EntityBuilder) -> EntityBuilder,
    {
        self.stats.factory_functions_used += 1;
        self.stats.entity_builders_created += 1;
        
        let builder = EntityBuilder::new(name, entity_id);
        factory(builder)
    }

    /**
     * 获取统计信息
     */
    pub fn get_stats(&self) -> FluentAPIStats {
        self.stats.clone()
    }

    /**
     * 重置统计信息
     */
    pub fn reset_stats(&mut self) {
        self.stats = FluentAPIStats::default();
    }

    /**
     * 清空所有状态
     */
    pub fn clear(&mut self) {
        self.reset_stats();
    }
}

impl Default for ECSFluentAPI {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::any::TypeId;

    // 测试用的示例组件类型
    struct TestComponentA;
    struct TestComponentB;
    struct TestComponentC;

    #[test]
    fn test_entity_builder_basic() {
        let builder = EntityBuilder::new("test_entity", 1);
        let entity = builder
            .named("my_entity")
            .tagged(42)
            .enabled(true)
            .active(true)
            .with_update_order(10)
            .build();

        assert_eq!(entity.name, "my_entity");
        assert_eq!(entity.tag(), 42);
        assert_eq!(entity.enabled(), true);
        assert_eq!(entity.active(), true);
        assert_eq!(entity.update_order(), 10);
    }

    #[test]
    fn test_entity_builder_children() {
        let builder = EntityBuilder::new("parent", 1);
        let entity = builder
            .with_child(2)
            .with_children(vec![3, 4, 5])
            .build();

        assert_eq!(entity.children_ids().len(), 4);
        assert_eq!(entity.children_ids(), &[2, 3, 4, 5]);
    }

    #[test]
    fn test_entity_builder_conditional() {
        let builder = EntityBuilder::new("test", 1);
        let entity = builder
            .with_if(true, |b| b.tagged(100))
            .with_if(false, |b| b.tagged(200))
            .build();

        assert_eq!(entity.tag(), 100);
    }

    #[test]
    fn test_query_builder() {
        let query = QueryBuilder::new()
            .with_component(TypeId::of::<TestComponentA>())
            .with_components(vec![
                TypeId::of::<TestComponentB>(),
                TypeId::of::<TestComponentC>(),
            ])
            .with_any_component(TypeId::of::<TestComponentA>())
            .without_component(TypeId::of::<TestComponentB>())
            .with_tag(42)
            .with_name("test")
            .active_only()
            .enabled_only();

        assert_eq!(query.get_all_components().len(), 3);
        assert_eq!(query.get_any_components().len(), 1);
        assert_eq!(query.get_none_components().len(), 1);
        assert_eq!(query.get_tag_filter(), Some(42));
        assert_eq!(query.get_name_filter(), Some(&"test".to_string()));
        assert!(query.is_active_only());
        assert!(query.is_enabled_only());
    }

    #[test]
    fn test_fluent_api_basic() {
        let mut api = ECSFluentAPI::new();
        
        let _builder = api.create_entity("test", 1);
        let _query = api.query();

        let stats = api.get_stats();
        assert_eq!(stats.entity_builders_created, 1);
        assert_eq!(stats.query_builders_created, 1);
    }

    #[test]
    fn test_fluent_api_batch() {
        let mut api = ECSFluentAPI::new();
        
        let builders = api.create_entities_batch(5, "entity", 100);
        assert_eq!(builders.len(), 5);

        let stats = api.get_stats();
        assert_eq!(stats.entity_builders_created, 5);
        assert_eq!(stats.batch_operations_executed, 1);
    }

    #[test]
    fn test_fluent_api_factory() {
        let mut api = ECSFluentAPI::new();
        
        let entity = api
            .create_entity_with_factory("test", 1, |builder| {
                builder.tagged(42).enabled(true)
            })
            .build();

        assert_eq!(entity.tag(), 42);
        assert_eq!(entity.enabled(), true);

        let stats = api.get_stats();
        assert_eq!(stats.factory_functions_used, 1);
        assert_eq!(stats.entity_builders_created, 1);
    }

    #[test]
    fn test_fluent_api_conditional() {
        let mut api = ECSFluentAPI::new();
        
        let result1 = api.when(true, || "executed");
        let result2 = api.when(false, || "not executed");

        assert_eq!(result1, Some("executed"));
        assert_eq!(result2, None);

        let stats = api.get_stats();
        assert_eq!(stats.conditional_operations, 2);
    }
}