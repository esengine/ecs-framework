use crate::core::{Scene, Entity, System};
use crate::core::fluent_api::EntityBuilder;

/**
 * 场景构建器
 * 提供流式API创建和配置场景
 */
pub struct SceneBuilder {
    scene: Scene,
}

impl SceneBuilder {
    /**
     * 创建场景构建器
     */
    pub fn new() -> Self {
        Self {
            scene: Scene::new(),
        }
    }

    /**
     * 设置场景名称
     */
    pub fn named(mut self, name: &str) -> Self {
        self.scene.set_name(name.to_string());
        self
    }

    /**
     * 设置场景是否启用
     */
    pub fn enabled(mut self, enabled: bool) -> Self {
        self.scene.set_enabled(enabled);
        self
    }

    /**
     * 添加实体
     */
    pub fn with_entity(mut self, entity: Entity) -> Self {
        self.scene.add_entity(entity);
        self
    }

    /**
     * 批量添加实体
     */
    pub fn with_entities(mut self, entities: Vec<Entity>) -> Self {
        for entity in entities {
            self.scene.add_entity(entity);
        }
        self
    }

    /**
     * 使用实体构建器添加实体
     */
    pub fn with_entity_builder<F>(mut self, builder_fn: F) -> Self
    where
        F: FnOnce(EntityBuilder) -> EntityBuilder,
    {
        let builder = EntityBuilder::new("", 0);
        let configured_builder = builder_fn(builder);
        let entity = configured_builder.build();
        self.scene.add_entity(entity);
        self
    }

    /**
     * 批量使用实体构建器添加实体
     */
    pub fn with_entity_builders<F>(mut self, count: usize, builder_fn: F) -> Self
    where
        F: Fn(usize, EntityBuilder) -> EntityBuilder,
    {
        for i in 0..count {
            let builder = EntityBuilder::new("", 0);
            let configured_builder = builder_fn(i, builder);
            let entity = configured_builder.build();
            self.scene.add_entity(entity);
        }
        self
    }

    /**
     * 添加系统
     */
    pub fn with_system(mut self, system: Box<dyn System>) -> Self {
        self.scene.add_system_boxed(system);
        self
    }

    /**
     * 批量添加系统
     */
    pub fn with_systems(mut self, systems: Vec<Box<dyn System>>) -> Self {
        for system in systems {
            self.scene.add_system_boxed(system);
        }
        self
    }

    /**
     * 条件性添加实体
     */
    pub fn with_entity_if(mut self, condition: bool, entity: Entity) -> Self {
        if condition {
            self.scene.add_entity(entity);
        }
        self
    }

    /**
     * 条件性添加系统
     */
    pub fn with_system_if(mut self, condition: bool, system: Box<dyn System>) -> Self {
        if condition {
            self.scene.add_system_boxed(system);
        }
        self
    }

    /**
     * 使用配置函数配置场景
     */
    pub fn configure<F>(mut self, configurator: F) -> Self
    where
        F: FnOnce(&mut Scene),
    {
        configurator(&mut self.scene);
        self
    }

    /**
     * 条件性配置场景
     */
    pub fn configure_if<F>(mut self, condition: bool, configurator: F) -> Self
    where
        F: FnOnce(&mut Scene),
    {
        if condition {
            configurator(&mut self.scene);
        }
        self
    }

    /**
     * 批量创建简单实体
     */
    pub fn with_simple_entities(mut self, count: usize, name_prefix: &str) -> Self {
        for i in 0..count {
            let mut entity = Entity::new(0); // ID将由EntityManager分配
            entity.set_name(format!("{}{}", name_prefix, i));
            self.scene.add_entity(entity);
        }
        self
    }

    /**
     * 使用预定义场景模板
     */
    pub fn from_template(self, template: SceneTemplate) -> Self {
        match template {
            SceneTemplate::Empty => self,
            SceneTemplate::Basic => {
                self.named("Basic Scene")
                    .enabled(true)
                    .with_simple_entities(10, "Entity_")
            },
            SceneTemplate::Testing => {
                self.named("Test Scene")
                    .enabled(true)
                    .with_simple_entities(5, "TestEntity_")
            },
        }
    }

    /**
     * 设置场景容量预估
     */
    pub fn with_capacity(mut self, entity_capacity: usize, system_capacity: usize) -> Self {
        self.scene.reserve_capacity(entity_capacity, system_capacity);
        self
    }

    /**
     * 验证场景配置
     */
    pub fn validate(self) -> Result<Self, String> {
        // 基本验证
        if self.scene.name().is_empty() {
            return Err("Scene name cannot be empty".to_string());
        }

        if self.scene.entity_count() == 0 {
            return Err("Scene must have at least one entity".to_string());
        }

        Ok(self)
    }

    /**
     * 构建并返回场景
     */
    pub fn build(self) -> Scene {
        self.scene
    }

    /**
     * 验证并构建场景
     */
    pub fn validate_and_build(self) -> Result<Scene, String> {
        self.validate().map(|builder| builder.build())
    }

    /**
     * 获取当前场景的统计信息
     */
    pub fn get_stats(&self) -> SceneBuilderStats {
        SceneBuilderStats {
            entity_count: self.scene.entity_count(),
            system_count: self.scene.system_count(),
            is_enabled: self.scene.is_enabled(),
            name_length: self.scene.name().len(),
        }
    }
}

/**
 * 场景模板枚举
 * 提供预定义的场景配置
 */
#[derive(Debug, Clone)]
pub enum SceneTemplate {
    Empty,
    Basic,
    Testing,
}

/**
 * 场景构建器统计信息
 */
#[derive(Debug, Clone)]
pub struct SceneBuilderStats {
    pub entity_count: usize,
    pub system_count: usize,
    pub is_enabled: bool,
    pub name_length: usize,
}

impl SceneBuilderStats {
    /**
     * 检查场景是否为空
     */
    pub fn is_empty(&self) -> bool {
        self.entity_count == 0 && self.system_count == 0
    }

    /**
     * 检查场景是否已配置
     */
    pub fn is_configured(&self) -> bool {
        self.entity_count > 0 || self.system_count > 0
    }

    /**
     * 获取场景复杂度评分
     */
    pub fn complexity_score(&self) -> f64 {
        (self.entity_count as f64 * 1.0) + (self.system_count as f64 * 2.0)
    }
}

/**
 * 场景构建器工厂
 * 提供创建各种场景构建器的便捷方法
 */
pub struct SceneBuilderFactory;

impl SceneBuilderFactory {
    /**
     * 创建空场景构建器
     */
    pub fn empty() -> SceneBuilder {
        SceneBuilder::new()
    }

    /**
     * 创建基础场景构建器
     */
    pub fn basic(name: &str) -> SceneBuilder {
        SceneBuilder::new()
            .named(name)
            .enabled(true)
    }

    /**
     * 创建测试场景构建器
     */
    pub fn for_testing() -> SceneBuilder {
        SceneBuilder::new()
            .from_template(SceneTemplate::Testing)
    }

    /**
     * 创建指定容量的场景构建器
     */
    pub fn with_capacity(entity_capacity: usize, system_capacity: usize) -> SceneBuilder {
        SceneBuilder::new()
            .with_capacity(entity_capacity, system_capacity)
    }

    /**
     * 从模板创建场景构建器
     */
    pub fn from_template(template: SceneTemplate) -> SceneBuilder {
        SceneBuilder::new().from_template(template)
    }
}

/**
 * 场景构建器管理器
 * 管理多个场景构建器的全局统计
 */
#[derive(Debug)]
pub struct SceneBuilderManager {
    total_scenes_built: u64,
    total_entities_created: u64,
    total_systems_added: u64,
    validation_failures: u64,
}

impl SceneBuilderManager {
    pub fn new() -> Self {
        Self {
            total_scenes_built: 0,
            total_entities_created: 0,
            total_systems_added: 0,
            validation_failures: 0,
        }
    }

    /**
     * 记录场景构建
     */
    pub fn record_scene_built(&mut self, stats: &SceneBuilderStats) {
        self.total_scenes_built += 1;
        self.total_entities_created += stats.entity_count as u64;
        self.total_systems_added += stats.system_count as u64;
    }

    /**
     * 记录验证失败
     */
    pub fn record_validation_failure(&mut self) {
        self.validation_failures += 1;
    }

    /**
     * 重置统计信息
     */
    pub fn reset(&mut self) {
        self.total_scenes_built = 0;
        self.total_entities_created = 0;
        self.total_systems_added = 0;
        self.validation_failures = 0;
    }

    /**
     * 获取平均每个场景的实体数
     */
    pub fn average_entities_per_scene(&self) -> f64 {
        if self.total_scenes_built == 0 {
            0.0
        } else {
            self.total_entities_created as f64 / self.total_scenes_built as f64
        }
    }

    /**
     * 获取平均每个场景的系统数
     */
    pub fn average_systems_per_scene(&self) -> f64 {
        if self.total_scenes_built == 0 {
            0.0
        } else {
            self.total_systems_added as f64 / self.total_scenes_built as f64
        }
    }

    /**
     * 获取构建成功率
     */
    pub fn success_rate(&self) -> f64 {
        let total_attempts = self.total_scenes_built + self.validation_failures;
        if total_attempts == 0 {
            1.0
        } else {
            self.total_scenes_built as f64 / total_attempts as f64
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::any::Any;
    use crate::core::systems::SystemContext;

    // 测试用的简单系统
    struct TestSystem {
        enabled: bool,
        update_order: i32,
    }

    impl TestSystem {
        fn new() -> Self {
            Self {
                enabled: true,
                update_order: 0,
            }
        }
    }

    impl System for TestSystem {
        fn initialize(&mut self, _context: &mut SystemContext) {}
        fn update(&mut self, _context: &mut SystemContext) {}
        fn late_update(&mut self, _context: &mut SystemContext) {}
        fn cleanup(&mut self, _context: &mut SystemContext) {}
        fn enabled(&self) -> bool { self.enabled }
        fn set_enabled(&mut self, enabled: bool) { self.enabled = enabled; }
        fn name(&self) -> &str { "TestSystem" }
        fn update_order(&self) -> i32 { self.update_order }
        fn set_update_order(&mut self, order: i32) { self.update_order = order; }
        fn as_any(&self) -> &dyn Any { self }
        fn as_any_mut(&mut self) -> &mut dyn Any { self }
    }

    #[test]
    fn test_scene_builder_basic() {
        let scene = SceneBuilder::new()
            .named("Test Scene")
            .enabled(true)
            .build();

        assert_eq!(scene.name(), "Test Scene");
        assert!(scene.enabled());
    }

    #[test]
    fn test_scene_builder_with_entities() {
        let entity1 = Entity::new(1);
        let entity2 = Entity::new(2);
        
        let scene = SceneBuilder::new()
            .with_entity(entity1)
            .with_entity(entity2)
            .build();

        assert_eq!(scene.entity_count(), 2);
    }

    #[test]
    fn test_scene_builder_with_simple_entities() {
        let scene = SceneBuilder::new()
            .with_simple_entities(5, "Entity_")
            .build();

        assert_eq!(scene.entity_count(), 5);
    }

    #[test]
    fn test_scene_builder_with_systems() {
        let system = Box::new(TestSystem::new());
        
        let scene = SceneBuilder::new()
            .with_system(system)
            .build();

        assert_eq!(scene.system_count(), 1);
    }

    #[test]
    fn test_scene_builder_conditional() {
        let entity = Entity::new(1);
        let system = Box::new(TestSystem::new());
        
        let scene = SceneBuilder::new()
            .with_entity_if(true, entity)
            .with_system_if(false, system)
            .build();

        assert_eq!(scene.entity_count(), 1);
        assert_eq!(scene.system_count(), 0);
    }

    #[test]
    fn test_scene_builder_configure() {
        let scene = SceneBuilder::new()
            .configure(|scene| {
                scene.set_name("Configured Scene".to_string());
            })
            .build();

        assert_eq!(scene.name(), "Configured Scene");
    }

    #[test]
    fn test_scene_builder_from_template() {
        let scene = SceneBuilder::new()
            .from_template(SceneTemplate::Basic)
            .build();

        assert_eq!(scene.name(), "Basic Scene");
        assert_eq!(scene.entity_count(), 10);
    }

    #[test]
    fn test_scene_builder_validation() {
        // 验证失败 - 空名称
        let result1 = SceneBuilder::new()
            .validate_and_build();
        assert!(result1.is_err());

        // 验证失败 - 无实体
        let result2 = SceneBuilder::new()
            .named("Test")
            .validate_and_build();
        assert!(result2.is_err());

        // 验证成功
        let result3 = SceneBuilder::new()
            .named("Test")
            .with_simple_entities(1, "Entity_")
            .validate_and_build();
        assert!(result3.is_ok());
    }

    #[test]
    fn test_scene_builder_stats() {
        let builder = SceneBuilder::new()
            .named("Test Scene")
            .with_simple_entities(3, "Entity_")
            .with_system(Box::new(TestSystem::new()));

        let stats = builder.get_stats();
        assert_eq!(stats.entity_count, 3);
        assert_eq!(stats.system_count, 1);
        assert!(!stats.is_empty());
        assert!(stats.is_configured());
        assert_eq!(stats.complexity_score(), 5.0); // 3*1 + 1*2
    }

    #[test]
    fn test_scene_builder_factory() {
        let empty_scene = SceneBuilderFactory::empty().build();
        assert_eq!(empty_scene.entity_count(), 0);

        let basic_scene = SceneBuilderFactory::basic("Test").build();
        assert_eq!(basic_scene.name(), "Test");

        let test_scene = SceneBuilderFactory::for_testing().build();
        assert_eq!(test_scene.name(), "Test Scene");
        assert_eq!(test_scene.entity_count(), 5);
    }

    #[test]
    fn test_scene_builder_manager() {
        let mut manager = SceneBuilderManager::new();
        
        let stats1 = SceneBuilderStats {
            entity_count: 5,
            system_count: 2,
            is_enabled: true,
            name_length: 10,
        };
        
        let stats2 = SceneBuilderStats {
            entity_count: 3,
            system_count: 1,
            is_enabled: true,
            name_length: 8,
        };

        manager.record_scene_built(&stats1);
        manager.record_scene_built(&stats2);
        manager.record_validation_failure();

        assert_eq!(manager.total_scenes_built, 2);
        assert_eq!(manager.total_entities_created, 8);
        assert_eq!(manager.total_systems_added, 3);
        assert_eq!(manager.validation_failures, 1);
        assert_eq!(manager.average_entities_per_scene(), 4.0);
        assert_eq!(manager.average_systems_per_scene(), 1.5);
        assert!((manager.success_rate() - 0.6666666666666666).abs() < 0.0001);
    }
}