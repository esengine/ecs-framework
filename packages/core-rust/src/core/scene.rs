use crate::core::entity_manager::EntityManager;
use crate::core::query_system::QuerySystem;
use crate::core::systems::{System, SystemManager, SystemContext};
use crate::storage::component_storage::ComponentStorageManager;
use crate::utils::time::Time;

/**
 * 场景管理器
 * 
 * Scene是ECS系统中的顶层容器，管理所有实体、组件和系统
 * 提供统一的实体管理、组件存储和查询功能
 */
pub struct Scene {
    /// 场景名称
    name: String,
    
    /// 是否激活状态
    active: bool,
    
    /// 实体管理器
    entity_manager: EntityManager,
    
    /// 组件存储管理器
    component_storage_manager: ComponentStorageManager,
    
    /// 查询系统
    query_system: QuerySystem,
    
    /// 系统管理器
    system_manager: SystemManager,
    
    /// 场景统计信息
    stats: SceneStats,
}

impl Scene {
    /**
     * 创建新场景
     */
    pub fn new() -> Self {
        Self {
            name: String::new(),
            active: true,
            entity_manager: EntityManager::new(),
            component_storage_manager: ComponentStorageManager::new(),
            query_system: QuerySystem::new(),
            system_manager: SystemManager::new(),
            stats: SceneStats::default(),
        }
    }

    /**
     * 创建带名称的新场景
     */
    pub fn new_with_name(name: String) -> Self {
        Self {
            name,
            active: true,
            entity_manager: EntityManager::new(),
            component_storage_manager: ComponentStorageManager::new(),
            query_system: QuerySystem::new(),
            system_manager: SystemManager::new(),
            stats: SceneStats::default(),
        }
    }

    // ========== 场景属性 ==========

    /**
     * 获取场景名称
     */
    pub fn name(&self) -> &str {
        &self.name
    }

    /**
     * 设置场景名称
     */
    pub fn set_name(&mut self, name: String) {
        self.name = name;
    }

    /**
     * 获取激活状态
     */
    pub fn active(&self) -> bool {
        self.active
    }

    /**
     * 设置激活状态
     */
    pub fn set_active(&mut self, active: bool) {
        self.active = active;
    }

    // ========== 实体管理 ==========

    /**
     * 创建实体
     */
    pub fn create_entity(&mut self, name: Option<String>) -> u32 {
        let entity_id = self.entity_manager.create_entity(name);
        self.stats.total_entities_created += 1;
        entity_id
    }

    /**
     * 批量创建实体
     */
    pub fn create_entities_batch(&mut self, count: u32, name_prefix: Option<String>) -> Vec<u32> {
        let entities = self.entity_manager.create_entities_batch(count, name_prefix);
        self.stats.total_entities_created += count as u64;
        entities
    }

    /**
     * 销毁实体
     */
    pub fn destroy_entity(&mut self, entity_id: u32) -> bool {
        if self.entity_manager.destroy_entity(entity_id) {
            // 清理组件存储
            self.component_storage_manager.remove_all_components(entity_id);
            self.stats.total_entities_destroyed += 1;
            true
        } else {
            false
        }
    }

    /**
     * 获取实体管理器引用
     */
    pub fn entity_manager(&self) -> &EntityManager {
        &self.entity_manager
    }

    /**
     * 获取实体管理器可变引用
     */
    pub fn entity_manager_mut(&mut self) -> &mut EntityManager {
        &mut self.entity_manager
    }

    // ========== 组件管理 ==========

    /**
     * 获取组件存储管理器引用
     */
    pub fn component_storage_manager(&self) -> &ComponentStorageManager {
        &self.component_storage_manager
    }

    /**
     * 获取组件存储管理器可变引用
     */
    pub fn component_storage_manager_mut(&mut self) -> &mut ComponentStorageManager {
        &mut self.component_storage_manager
    }

    // ========== 查询系统 ==========

    /**
     * 获取查询系统引用
     */
    pub fn query_system(&self) -> &QuerySystem {
        &self.query_system
    }

    /**
     * 获取查询系统可变引用
     */
    pub fn query_system_mut(&mut self) -> &mut QuerySystem {
        &mut self.query_system
    }

    // ========== 系统管理 ==========

    /**
     * 添加系统
     */
    pub fn add_system<T: System + 'static>(&mut self, system: T) {
        self.system_manager.add_system(system);
    }

    /**
     * 移除系统
     */
    pub fn remove_system<T: System + 'static>(&mut self) -> bool {
        self.system_manager.remove_system::<T>()
    }

    /**
     * 获取系统
     */
    pub fn get_system<T: System + 'static>(&self) -> Option<&T> {
        self.system_manager.get_system::<T>()
    }

    /**
     * 获取可变系统
     */
    pub fn get_system_mut<T: System + 'static>(&mut self) -> Option<&mut T> {
        self.system_manager.get_system_mut::<T>()
    }

    /**
     * 获取系统管理器引用
     */
    pub fn system_manager(&self) -> &SystemManager {
        &self.system_manager
    }

    /**
     * 获取系统管理器可变引用
     */
    pub fn system_manager_mut(&mut self) -> &mut SystemManager {
        &mut self.system_manager
    }

    // ========== 场景生命周期 ==========

    /**
     * 初始化场景
     */
    pub fn initialize(&mut self) {
        // 创建系统上下文并初始化系统管理器
        let mut context = SystemContext {
            entity_manager: &mut self.entity_manager,
            component_storage_manager: &mut self.component_storage_manager,
        };
        self.system_manager.initialize(&mut context);
    }

    /**
     * 更新场景
     */
    pub fn update(&mut self, delta_time: f64) {
        if !self.active {
            return;
        }

        // 更新时间
        Time::update(delta_time);

        // 创建系统上下文
        let mut context = SystemContext {
            entity_manager: &mut self.entity_manager,
            component_storage_manager: &mut self.component_storage_manager,
        };

        // 更新所有系统
        self.system_manager.update(&mut context);

        // 重新创建系统上下文（避免借用检查问题）
        let mut context = SystemContext {
            entity_manager: &mut self.entity_manager,
            component_storage_manager: &mut self.component_storage_manager,
        };

        // 后更新系统
        self.system_manager.late_update(&mut context);

        // 更新所有激活的实体（在系统更新完成后）
        let active_entities = self.entity_manager.get_all_entity_ids();
        for entity_id in active_entities {
            if let Some(entity) = self.entity_manager.get_entity_mut(entity_id) {
                entity.update();
            }
        }

        self.stats.total_updates += 1;
    }

    /**
     * 清空场景
     */
    pub fn clear(&mut self) {
        // 创建系统上下文并清理系统
        let mut context = SystemContext {
            entity_manager: &mut self.entity_manager,
            component_storage_manager: &mut self.component_storage_manager,
        };
        self.system_manager.cleanup(&mut context);
        
        self.entity_manager = EntityManager::new();
        self.component_storage_manager.clear();
        self.query_system.clear_cache();
        self.system_manager = SystemManager::new();
        self.stats = SceneStats::default();
    }

    // ========== 统计信息 ==========

    /**
     * 获取场景统计信息
     */
    pub fn get_stats(&self) -> &SceneStats {
        &self.stats
    }

    /**
     * 获取实体数量
     */
    pub fn entity_count(&self) -> usize {
        self.entity_manager.entity_count()
    }

    /**
     * 获取激活实体数量
     */
    pub fn active_entity_count(&self) -> usize {
        self.entity_manager.active_entity_count()
    }

    /**
     * 获取调试信息
     */
    pub fn get_debug_info(&self) -> String {
        format!(
            "{{\"name\":\"{}\",\"active\":{},\"entity_count\":{},\"active_entity_count\":{},\"total_entities_created\":{},\"total_entities_destroyed\":{},\"total_updates\":{}}}",
            self.name,
            self.active,
            self.entity_count(),
            self.active_entity_count(),
            self.stats.total_entities_created,
            self.stats.total_entities_destroyed,
            self.stats.total_updates
        )
    }

    // ========== SceneBuilder支持方法 ==========

    /**
     * 添加实体到场景
     */
    pub fn add_entity(&mut self, entity: crate::core::Entity) {
        self.entity_manager.add_entity(entity);
        self.stats.total_entities_created += 1;
    }

    /**
     * 添加系统到场景（Box版本）
     */
    pub fn add_system_boxed(&mut self, system: Box<dyn System>) {
        self.system_manager.add_system_boxed(system);
    }

    /**
     * 获取系统数量
     */
    pub fn system_count(&self) -> usize {
        self.system_manager.system_count()
    }

    /**
     * 设置启用状态
     */
    pub fn set_enabled(&mut self, enabled: bool) {
        self.active = enabled;
    }

    /**
     * 检查是否启用
     */
    pub fn is_enabled(&self) -> bool {
        self.active
    }

    /**
     * 预留容量
     */
    pub fn reserve_capacity(&mut self, entity_capacity: usize, system_capacity: usize) {
        self.entity_manager.reserve_capacity(entity_capacity);
        self.system_manager.reserve_capacity(system_capacity);
    }
}

/**
 * 场景统计信息
 */
#[derive(Default)]
pub struct SceneStats {
    /// 创建的实体总数
    pub total_entities_created: u64,
    
    /// 销毁的实体总数
    pub total_entities_destroyed: u64,
    
    /// 更新总次数
    pub total_updates: u64,
}

impl std::fmt::Debug for Scene {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Scene")
            .field("name", &self.name)
            .field("active", &self.active)
            .field("entity_count", &self.entity_count())
            .field("active_entity_count", &self.active_entity_count())
            .finish()
    }
}