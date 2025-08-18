use crate::core::entity::Entity;
use crate::storage::component_storage::ComponentStorageManager;
use crate::core::component::Component;
use crate::utils::IdentifierPool;
use rustc_hash::FxHashMap;

/**
 * 实体管理器
 * 提供统一的实体管理和查询机制，支持高效的实体操作
 * 使用IdentifierPool进行世代式ID管理，防止悬空引用
 */
pub struct EntityManager {
    entities: FxHashMap<u32, Entity>,
    entities_by_name: FxHashMap<String, Vec<u32>>,
    entities_by_tag: FxHashMap<u32, Vec<u32>>,
    id_pool: IdentifierPool,
    destroyed_entities: std::collections::HashSet<u32>,
    component_storage_manager: ComponentStorageManager,
}

impl EntityManager {
    /**
     * 创建实体管理器实例
     */
    pub fn new() -> Self {
        Self {
            entities: FxHashMap::default(),
            entities_by_name: FxHashMap::default(),
            entities_by_tag: FxHashMap::default(),
            id_pool: IdentifierPool::with_defaults(),
            destroyed_entities: std::collections::HashSet::new(),
            component_storage_manager: ComponentStorageManager::new(),
        }
    }

    /**
     * 获取实体总数
     */
    pub fn entity_count(&self) -> usize {
        self.entities.len()
    }

    /**
     * 获取激活状态的实体数量
     */
    pub fn active_entity_count(&self) -> usize {
        self.entities
            .values()
            .filter(|entity| entity.active() && !entity.is_destroyed())
            .count()
    }

    /**
     * 创建新实体
     * @param name 实体名称，如果未指定则使用实体ID生成默认名称
     * @returns 创建的实体ID（世代式ID）
     */
    pub fn create_entity(&mut self, name: Option<String>) -> u32 {
        let id = match self.id_pool.check_out() {
            Ok(id) => id,
            Err(e) => {
                // ID池已满，记录错误并返回一个无效ID
                eprintln!("Failed to create entity: {}", e);
                return u32::MAX; // 返回无效ID作为错误标识
            }
        };

        let entity_name = name.unwrap_or_else(|| format!("Entity_{}", id));
        let mut entity = Entity::new(id);
        entity.set_name(entity_name.clone());

        self.entities.insert(id, entity);
        self.update_name_index(id, &entity_name, true);
        self.update_tag_index(id, 0, true);

        id
    }

    /**
     * 批量创建实体
     * @param count 要创建的实体数量
     * @param name_prefix 实体名称前缀，默认为 Entity
     * @returns 创建的实体ID数组
     */
    pub fn create_entities_batch(&mut self, count: u32, name_prefix: Option<String>) -> Vec<u32> {
        if count == 0 {
            return Vec::new();
        }

        let prefix = name_prefix.unwrap_or_else(|| "Entity".to_string());
        let mut entity_ids = Vec::with_capacity(count as usize);

        for _ in 0..count {
            let id = match self.id_pool.check_out() {
                Ok(id) => id,
                Err(e) => {
                    eprintln!("Failed to create entity in batch: {}", e);
                    break; // 停止创建更多实体
                }
            };

            let entity_name = format!("{}_{}", prefix, id);
            let mut entity = Entity::new(id);
            entity.set_name(entity_name.clone());

            entity_ids.push(id);
            self.entities.insert(id, entity);
        }

        for &id in &entity_ids {
            if let Some(entity) = self.entities.get(&id) {
                let name = entity.name.clone();
                let tag = entity.tag();
                self.update_name_index(id, &name, true);
                self.update_tag_index(id, tag, true);
            }
        }

        entity_ids
    }

    /**
     * 销毁实体
     * @param entity_id 要销毁的实体ID
     * @returns 是否成功销毁实体
     */
    pub fn destroy_entity(&mut self, entity_id: u32) -> bool {
        // 首先验证ID是否有效
        if !self.id_pool.is_valid(entity_id) {
            return false;
        }

        if let Some(mut entity) = self.entities.remove(&entity_id) {
            self.destroyed_entities.insert(entity_id);
            self.update_name_index(entity_id, &entity.name, false);
            self.update_tag_index(entity_id, entity.tag(), false);

            self.component_storage_manager.remove_all_components(entity_id);

            entity.destroy();
            
            // 回收ID到池中
            self.id_pool.check_in(entity_id);
            
            true
        } else {
            false
        }
    }

    /**
     * 获取所有实体ID
     */
    pub fn get_all_entity_ids(&self) -> Vec<u32> {
        self.entities.keys().copied().collect()
    }

    /**
     * 根据ID获取实体
     * @param id 实体ID
     * @returns 对应的实体引用，如果不存在则返回None
     */
    pub fn get_entity(&self, id: u32) -> Option<&Entity> {
        self.entities.get(&id)
    }

    /**
     * 根据ID获取可变实体
     * @param id 实体ID
     * @returns 对应的可变实体引用，如果不存在则返回None
     */
    pub fn get_entity_mut(&mut self, id: u32) -> Option<&mut Entity> {
        self.entities.get_mut(&id)
    }

    /**
     * 根据名称获取实体
     * @param name 实体名称
     * @returns 匹配的实体ID，如果不存在则返回None
     */
    pub fn get_entity_by_name(&self, name: &str) -> Option<u32> {
        self.entities_by_name
            .get(name)
            .and_then(|entities| entities.first())
            .copied()
    }

    /**
     * 根据标签获取实体列表
     * @param tag 标签值
     * @returns 具有指定标签的实体ID数组
     */
    pub fn get_entities_by_tag(&self, tag: u32) -> Vec<u32> {
        self.entities_by_tag
            .get(&tag)
            .cloned()
            .unwrap_or_else(Vec::new)
    }

    /**
     * 为实体添加组件
     * @param entity_id 实体ID
     * @param component 组件实例
     */
    pub fn add_component<T: Component + Clone + 'static>(&mut self, entity_id: u32, component: T) -> Result<(), String> {
        if !self.entities.contains_key(&entity_id) {
            return Err(format!("Entity {} does not exist", entity_id));
        }

        self.component_storage_manager.add_component(entity_id, component)?;

        if let Some(entity) = self.entities.get_mut(&entity_id) {
            let mask = self.component_storage_manager.get_component_mask(entity_id);
            entity.set_component_mask(mask);
        }

        Ok(())
    }

    /**
     * 获取实体的组件位掩码
     * @param entity_id 实体ID
     * @returns 组件位掩码
     */
    pub fn get_component_mask(&self, entity_id: u32) -> u64 {
        self.component_storage_manager.get_component_mask(entity_id)
    }

    /**
     * 获取组件存储管理器
     */
    pub fn get_component_storage_manager(&self) -> &ComponentStorageManager {
        &self.component_storage_manager
    }

    /**
     * 获取可变组件存储管理器
     */
    pub fn get_component_storage_manager_mut(&mut self) -> &mut ComponentStorageManager {
        &mut self.component_storage_manager
    }

    /**
     * 更新名称索引
     * @param entity_id 实体ID
     * @param name 实体名称
     * @param is_add true表示添加到索引，false表示从索引中移除
     */
    fn update_name_index(&mut self, entity_id: u32, name: &str, is_add: bool) {
        if is_add {
            self.entities_by_name
                .entry(name.to_string())
                .or_insert_with(Vec::new)
                .push(entity_id);
        } else {
            if let Some(entities) = self.entities_by_name.get_mut(name) {
                entities.retain(|&id| id != entity_id);
                if entities.is_empty() {
                    self.entities_by_name.remove(name);
                }
            }
        }
    }

    /**
     * 更新标签索引
     * @param entity_id 实体ID
     * @param tag 标签值
     * @param is_add true表示添加到索引，false表示从索引中移除
     */
    fn update_tag_index(&mut self, entity_id: u32, tag: u32, is_add: bool) {
        if is_add {
            self.entities_by_tag
                .entry(tag)
                .or_insert_with(Vec::new)
                .push(entity_id);
        } else {
            if let Some(entities) = self.entities_by_tag.get_mut(&tag) {
                entities.retain(|&id| id != entity_id);
                if entities.is_empty() {
                    self.entities_by_tag.remove(&tag);
                }
            }
        }
    }

    // ========== IdentifierPool相关方法 ==========

    /**
     * 验证实体ID是否有效（考虑世代版本）
     * @param entity_id 要验证的实体ID
     * @returns 是否为有效的ID
     */
    pub fn is_entity_id_valid(&self, entity_id: u32) -> bool {
        self.id_pool.is_valid(entity_id)
    }

    /**
     * 强制处理延迟回收的ID
     * 在某些情况下可能需要立即处理延迟回收队列
     */
    pub fn force_process_delayed_recycle(&mut self) {
        self.id_pool.force_process_delayed_recycle();
    }

    /**
     * 获取IdentifierPool统计信息
     * 用于调试和性能监控
     */
    pub fn get_id_pool_stats(&self) -> crate::utils::IdentifierPoolStats {
        self.id_pool.get_stats()
    }

    /**
     * 检查实体是否存在且有效
     * 结合ID有效性检查和实际存在性检查
     */
    pub fn entity_exists_and_valid(&self, entity_id: u32) -> bool {
        self.id_pool.is_valid(entity_id) && self.entities.contains_key(&entity_id)
    }

    /**
     * 获取有效实体的数量
     * 只计算ID有效且实际存在的实体
     */
    pub fn valid_entity_count(&self) -> usize {
        self.entities.iter()
            .filter(|(&id, _)| self.id_pool.is_valid(id))
            .count()
    }

    /**
     * 清理所有无效的实体引用
     * 清理那些ID已经无效的实体记录
     */
    pub fn cleanup_invalid_entities(&mut self) {
        let invalid_ids: Vec<u32> = self.entities.keys()
            .filter(|&&id| !self.id_pool.is_valid(id))
            .copied()
            .collect();

        for id in invalid_ids {
            if let Some(entity) = self.entities.remove(&id) {
                // 从索引中清理
                self.update_name_index(id, &entity.name, false);
                self.update_tag_index(id, entity.tag(), false);
                // 从销毁实体集合中清理
                self.destroyed_entities.remove(&id);
            }
        }
    }

    /**
     * 获取调试信息（包含ID池统计）
     */
    pub fn get_debug_info(&self) -> String {
        let id_stats = self.id_pool.get_stats();
        format!(
            "{{\"entities\":{},\"active_entities\":{},\"valid_entities\":{},\"destroyed_entities\":{},\"id_pool\":{{\"total_allocated\":{},\"current_active\":{},\"pending_recycle\":{},\"memory_usage\":{}}}}}",
            self.entity_count(),
            self.active_entity_count(),
            self.valid_entity_count(),
            self.destroyed_entities.len(),
            id_stats.total_allocated,
            id_stats.current_active,
            id_stats.pending_recycle,
            id_stats.memory_usage
        )
    }

    /**
     * 添加实体到管理器
     */
    pub fn add_entity(&mut self, mut entity: Entity) {
        let entity_id = if entity.id() == 0 {
            // 如果实体ID为0，分配新ID
            let new_id = self.id_pool.check_out().unwrap_or(0);
            entity.set_id(new_id);
            new_id
        } else {
            entity.id()
        };

        // 如果实体有名称，添加到名称索引
        if let Some(name) = entity.name() {
            self.entities_by_name.entry(name.clone()).or_insert_with(Vec::new).push(entity_id);
        }

        // 如果实体有标签，添加到标签索引
        for tag in &entity.tags() {
            self.entities_by_tag.entry(*tag).or_insert_with(Vec::new).push(entity_id);
        }

        self.entities.insert(entity_id, entity);
    }

    /**
     * 预留容量
     */
    pub fn reserve_capacity(&mut self, capacity: usize) {
        self.entities.reserve(capacity);
        self.entities_by_name.reserve(capacity / 10); // 假设10%的实体有名称
        self.entities_by_tag.reserve(capacity / 5);   // 假设20%的实体有标签
    }
}