use crate::core::entity_manager::EntityManager;
use crate::utils::{Matcher, QueryCondition, ComponentType};
use rustc_hash::FxHashMap;

/**
 * 查询结果
 */
#[derive(serde::Serialize, serde::Deserialize)]
pub struct QueryResult {
    pub entities: Vec<u32>,
    pub count: usize,
    pub execution_time: f64,
    pub from_cache: bool,
}

/**
 * 查询缓存条目
 */
struct QueryCacheEntry {
    entities: Vec<u32>,
    timestamp: f64,
    hit_count: u32,
}

/**
 * 高性能实体查询系统
 * 提供快速的实体查询功能，支持按组件类型等多种方式查询实体
 */
pub struct QuerySystem {
    entity_index: EntityIndex,
    #[allow(dead_code)]
    index_dirty: bool,
    query_cache: FxHashMap<String, QueryCacheEntry>,
    cache_max_size: usize,
    cache_timeout: f64,
    query_stats: QueryStats,
}

/**
 * 实体索引结构
 */
struct EntityIndex {
    by_mask: FxHashMap<String, std::collections::HashSet<u32>>,
    by_tag: FxHashMap<u32, std::collections::HashSet<u32>>,
    by_name: FxHashMap<String, std::collections::HashSet<u32>>,
}

/**
 * 性能统计
 */
struct QueryStats {
    total_queries: u32,
    cache_hits: u32,
    index_hits: u32,
    linear_scans: u32,
}

impl QuerySystem {
    pub fn new() -> Self {
        Self {
            entity_index: EntityIndex {
                by_mask: FxHashMap::default(),
                by_tag: FxHashMap::default(),
                by_name: FxHashMap::default(),
            },
            index_dirty: true,
            query_cache: FxHashMap::default(),
            cache_max_size: 1000,
            cache_timeout: 5000.0, // 5秒
            query_stats: QueryStats {
                total_queries: 0,
                cache_hits: 0,
                index_hits: 0,
                linear_scans: 0,
            },
        }
    }

    /**
     * 添加实体到查询系统
     * @param entity_id 实体ID
     * @param entity_manager 实体管理器引用
     */
    pub fn add_entity(&mut self, entity_id: u32, entity_manager: &EntityManager) {
        if let Some(_entity) = entity_manager.get_entity(entity_id) {
            self.add_entity_to_indexes(entity_id, entity_manager);
            self.clear_query_cache();
        }
    }

    /**
     * 从查询系统移除实体
     * @param entity_id 实体ID
     * @param entity_manager 实体管理器引用
     */
    pub fn remove_entity(&mut self, entity_id: u32, entity_manager: &EntityManager) {
        self.remove_entity_from_indexes(entity_id, entity_manager);
        self.clear_query_cache();
    }

    /**
     * 查询包含所有指定组件的实体
     * @param component_mask 组件位掩码
     * @param entity_manager 实体管理器引用
     * @returns 查询结果，包含匹配的实体和性能信息
     */
    pub fn query_all(&mut self, component_mask: u64, entity_manager: &EntityManager) -> QueryResult {
        let start_time = self.get_current_time();
        self.query_stats.total_queries += 1;

        let cache_key = format!("all:{}", component_mask);

        // 检查缓存
        if let Some(cached_entities) = self.get_from_cache(&cache_key) {
            self.query_stats.cache_hits += 1;
            let entity_count = cached_entities.len();
            return QueryResult {
                entities: cached_entities,
                count: entity_count,
                execution_time: self.get_current_time() - start_time,
                from_cache: true,
            };
        }

        // 执行查询
        let entities = self.execute_mask_query(component_mask, entity_manager);

        // 缓存结果
        self.add_to_cache(cache_key, &entities);

        let entity_count = entities.len();
        QueryResult {
            entities,
            count: entity_count,
            execution_time: self.get_current_time() - start_time,
            from_cache: false,
        }
    }

    /**
     * 按标签查询实体
     * @param tag 要查询的标签值
     * @param entity_manager 实体管理器引用
     * @returns 查询结果
     */
    pub fn query_by_tag(&mut self, tag: u32, entity_manager: &EntityManager) -> QueryResult {
        let start_time = self.get_current_time();
        self.query_stats.total_queries += 1;

        let cache_key = format!("tag:{}", tag);

        if let Some(cached_entities) = self.get_from_cache(&cache_key) {
            self.query_stats.cache_hits += 1;
            let entity_count = cached_entities.len();
            return QueryResult {
                entities: cached_entities,
                count: entity_count,
                execution_time: self.get_current_time() - start_time,
                from_cache: true,
            };
        }

        let entities = entity_manager.get_entities_by_tag(tag);
        self.add_to_cache(cache_key, &entities);

        let entity_count = entities.len();
        QueryResult {
            entities,
            count: entity_count,
            execution_time: self.get_current_time() - start_time,
            from_cache: false,
        }
    }

    /**
     * 按名称查询实体
     * @param name 要查询的实体名称
     * @param entity_manager 实体管理器引用
     * @returns 查询结果
     */
    pub fn query_by_name(&mut self, name: &str, entity_manager: &EntityManager) -> QueryResult {
        let start_time = self.get_current_time();
        self.query_stats.total_queries += 1;

        let cache_key = format!("name:{}", name);

        if let Some(cached_entities) = self.get_from_cache(&cache_key) {
            self.query_stats.cache_hits += 1;
            let entity_count = cached_entities.len();
            return QueryResult {
                entities: cached_entities,
                count: entity_count,
                execution_time: self.get_current_time() - start_time,
                from_cache: true,
            };
        }

        let entities = if let Some(entity_id) = entity_manager.get_entity_by_name(name) {
            vec![entity_id]
        } else {
            Vec::new()
        };

        self.add_to_cache(cache_key, &entities);

        let entity_count = entities.len();
        QueryResult {
            entities,
            count: entity_count,
            execution_time: self.get_current_time() - start_time,
            from_cache: false,
        }
    }

    /**
     * 执行掩码查询
     */
    fn execute_mask_query(&mut self, component_mask: u64, entity_manager: &EntityManager) -> Vec<u32> {
        let mut result = Vec::new();

        for &entity_id in entity_manager.get_all_entity_ids().iter() {
            let entity_mask = entity_manager.get_component_mask(entity_id);
            if (entity_mask & component_mask) == component_mask {
                result.push(entity_id);
            }
        }

        self.query_stats.linear_scans += 1;
        result
    }

    /**
     * 将实体添加到各种索引中
     */
    fn add_entity_to_indexes(&mut self, entity_id: u32, entity_manager: &EntityManager) {
        if let Some(entity) = entity_manager.get_entity(entity_id) {
            let mask = entity_manager.get_component_mask(entity_id);
            let mask_key = mask.to_string();

            self.entity_index
                .by_mask
                .entry(mask_key)
                .or_insert_with(std::collections::HashSet::new)
                .insert(entity_id);

            self.entity_index
                .by_tag
                .entry(entity.tag())
                .or_insert_with(std::collections::HashSet::new)
                .insert(entity_id);

            self.entity_index
                .by_name
                .entry(entity.name.clone())
                .or_insert_with(std::collections::HashSet::new)
                .insert(entity_id);
        }
    }

    /**
     * 从各种索引中移除实体
     */
    fn remove_entity_from_indexes(&mut self, entity_id: u32, entity_manager: &EntityManager) {
        if let Some(entity) = entity_manager.get_entity(entity_id) {
            let mask = entity_manager.get_component_mask(entity_id);
            let mask_key = mask.to_string();

            if let Some(mask_set) = self.entity_index.by_mask.get_mut(&mask_key) {
                mask_set.remove(&entity_id);
                if mask_set.is_empty() {
                    self.entity_index.by_mask.remove(&mask_key);
                }
            }

            if let Some(tag_set) = self.entity_index.by_tag.get_mut(&entity.tag()) {
                tag_set.remove(&entity_id);
                if tag_set.is_empty() {
                    self.entity_index.by_tag.remove(&entity.tag());
                }
            }

            if let Some(name_set) = self.entity_index.by_name.get_mut(&entity.name) {
                name_set.remove(&entity_id);
                if name_set.is_empty() {
                    self.entity_index.by_name.remove(&entity.name);
                }
            }
        }
    }

    /**
     * 从缓存获取查询结果
     */
    fn get_from_cache(&mut self, cache_key: &str) -> Option<Vec<u32>> {
        let current_time = self.get_current_time();
        
        if let Some(entry) = self.query_cache.get_mut(cache_key) {
            if current_time - entry.timestamp <= self.cache_timeout {
                entry.hit_count += 1;
                return Some(entry.entities.clone());
            } else {
                self.query_cache.remove(cache_key);
            }
        }
        None
    }

    /**
     * 添加查询结果到缓存
     */
    fn add_to_cache(&mut self, cache_key: String, entities: &[u32]) {
        if self.query_cache.len() >= self.cache_max_size {
            self.cleanup_cache();
        }

        self.query_cache.insert(cache_key, QueryCacheEntry {
            entities: entities.to_vec(),
            timestamp: self.get_current_time(),
            hit_count: 0,
        });
    }

    /**
     * 清理缓存
     */
    fn cleanup_cache(&mut self) {
        let current_time = self.get_current_time();
        
        // 移除过期的缓存条目
        self.query_cache.retain(|_, entry| {
            current_time - entry.timestamp <= self.cache_timeout
        });

        // 如果还是太满，移除最少使用的条目
        if self.query_cache.len() >= self.cache_max_size {
            let entries: Vec<_> = self.query_cache.iter().map(|(k, v)| (k.clone(), v.hit_count)).collect();
            let mut sorted_entries = entries;
            sorted_entries.sort_by_key(|(_, hit_count)| *hit_count);

            let to_remove = (self.cache_max_size as f32 * 0.2) as usize;
            for (key, _) in sorted_entries.into_iter().take(to_remove) {
                self.query_cache.remove(&key);
            }
        }
    }

    /**
     * 清除所有查询缓存
     */
    fn clear_query_cache(&mut self) {
        self.query_cache.clear();
    }

    /**
     * 获取当前时间戳（毫秒）
     */
    fn get_current_time(&self) -> f64 {
        // 在WASM环境中，这将使用js-sys获取时间
        // 这里使用简化实现，转换为f64毫秒
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as f64
    }

    /**
     * 获取系统统计信息
     */
    /**
     * 清空查询缓存
     */
    pub fn clear_cache(&mut self) {
        self.query_cache.clear();
    }

    /**
     * 基于Matcher的高级查询
     * 
     * 使用Matcher描述复杂查询条件，支持all/any/none组合查询
     */
    pub fn query_with_matcher(&mut self, matcher: &Matcher, entity_manager: &EntityManager) -> QueryResult {
        let start_time = self.get_current_time();
        
        // 生成查询缓存键
        let cache_key = self.generate_matcher_cache_key(matcher);
        
        // 检查缓存
        if let Some(cached_result) = self.get_from_cache(&cache_key) {
            let count = cached_result.len();
            return QueryResult {
                entities: cached_result,
                count,
                execution_time: self.get_current_time() - start_time,
                from_cache: true,
            };
        }
        
        // 执行查询
        let entities = self.execute_matcher_query(matcher, entity_manager);
        
        // 添加到缓存
        self.add_to_cache(cache_key, &entities);
        
        let entity_count = entities.len();
        QueryResult {
            entities,
            count: entity_count,
            execution_time: self.get_current_time() - start_time,
            from_cache: false,
        }
    }

    /**
     * 执行Matcher查询的核心逻辑
     */
    fn execute_matcher_query(&mut self, matcher: &Matcher, entity_manager: &EntityManager) -> Vec<u32> {
        let condition = matcher.get_condition();
        let all_entity_ids = entity_manager.get_all_entity_ids();
        let mut matching_entities = Vec::new();
        
        // 遍历所有实体进行匹配
        for &entity_id in &all_entity_ids {
            if self.entity_matches_condition(entity_id, condition, entity_manager) {
                matching_entities.push(entity_id);
            }
        }
        
        self.query_stats.linear_scans += 1;
        matching_entities
    }

    /**
     * 检查实体是否匹配查询条件
     */
    fn entity_matches_condition(&self, entity_id: u32, condition: &QueryCondition, entity_manager: &EntityManager) -> bool {
        let entity = match entity_manager.get_entity(entity_id) {
            Some(entity) => entity,
            None => return false,
        };
        
        // 检查名称条件
        if let Some(ref name) = condition.name {
            if &entity.name != name {
                return false;
            }
        }
        
        // 检查标签条件
        if let Some(tag) = condition.tag {
            if entity.tag() != tag {
                return false;
            }
        }
        
        // 检查单组件条件
        if let Some(component_type) = condition.component {
            if !self.entity_has_component_type(entity_id, component_type, entity_manager) {
                return false;
            }
        }
        
        // 检查all条件（必须包含所有指定组件）
        if !condition.all.is_empty() {
            for &component_type in &condition.all {
                if !self.entity_has_component_type(entity_id, component_type, entity_manager) {
                    return false;
                }
            }
        }
        
        // 检查any条件（必须包含至少一个指定组件）
        if !condition.any.is_empty() {
            let has_any = condition.any.iter()
                .any(|&component_type| self.entity_has_component_type(entity_id, component_type, entity_manager));
            if !has_any {
                return false;
            }
        }
        
        // 检查none条件（不能包含任何指定组件）
        if !condition.none.is_empty() {
            for &component_type in &condition.none {
                if self.entity_has_component_type(entity_id, component_type, entity_manager) {
                    return false;
                }
            }
        }
        
        true
    }

    /**
     * 检查实体是否有指定类型的组件
     * 这里需要EntityManager提供按TypeId查询组件的功能
     */
    fn entity_has_component_type(&self, entity_id: u32, component_type: ComponentType, _entity_manager: &EntityManager) -> bool {
        // TODO: 这里需要EntityManager支持按TypeId查询组件
        // 目前先返回false作为占位实现
        // 实际实现需要EntityManager提供get_component_by_type_id方法
        let _ = (entity_id, component_type);
        false
    }

    /**
     * 为Matcher生成缓存键
     */
    fn generate_matcher_cache_key(&self, matcher: &Matcher) -> String {
        let condition = matcher.get_condition();
        let mut key_parts = Vec::new();
        
        // 添加各种条件到键中
        if !condition.all.is_empty() {
            let type_ids: Vec<String> = condition.all.iter()
                .map(|t| format!("{:?}", t))
                .collect();
            key_parts.push(format!("all:{}", type_ids.join(",")));
        }
        
        if !condition.any.is_empty() {
            let type_ids: Vec<String> = condition.any.iter()
                .map(|t| format!("{:?}", t))
                .collect();
            key_parts.push(format!("any:{}", type_ids.join(",")));
        }
        
        if !condition.none.is_empty() {
            let type_ids: Vec<String> = condition.none.iter()
                .map(|t| format!("{:?}", t))
                .collect();
            key_parts.push(format!("none:{}", type_ids.join(",")));
        }
        
        if let Some(tag) = condition.tag {
            key_parts.push(format!("tag:{}", tag));
        }
        
        if let Some(ref name) = condition.name {
            key_parts.push(format!("name:{}", name));
        }
        
        if let Some(component) = condition.component {
            key_parts.push(format!("comp:{:?}", component));
        }
        
        format!("matcher:{}", key_parts.join("|"))
    }

    pub fn get_stats(&self) -> QuerySystemStats {
        let cache_hit_rate = if self.query_stats.total_queries > 0 {
            (self.query_stats.cache_hits as f32 / self.query_stats.total_queries as f32) * 100.0
        } else {
            0.0
        };

        QuerySystemStats {
            total_queries: self.query_stats.total_queries,
            cache_hits: self.query_stats.cache_hits,
            index_hits: self.query_stats.index_hits,
            linear_scans: self.query_stats.linear_scans,
            cache_hit_rate,
            cache_size: self.query_cache.len(),
        }
    }
}

/**
 * 查询系统统计信息
 */
#[derive(serde::Serialize, serde::Deserialize)]
pub struct QuerySystemStats {
    pub total_queries: u32,
    pub cache_hits: u32,
    pub index_hits: u32,
    pub linear_scans: u32,
    pub cache_hit_rate: f32,
    pub cache_size: usize,
}