use crate::utils::ComponentType;
use rustc_hash::FxHashMap;
use std::collections::HashSet;

/**
 * 原型标识符
 * 基于组件类型组合生成的唯一标识符
 */
pub type ArchetypeId = String;

/**
 * 原型数据结构
 * 将具有相同组件组合的实体分组存储
 */
#[derive(Debug, Clone)]
pub struct Archetype {
    /// 原型唯一标识符
    pub id: ArchetypeId,
    /// 包含的组件类型集合
    pub component_types: Vec<ComponentType>,
    /// 属于该原型的实体列表
    pub entities: Vec<u32>,
    /// 原型创建时间（毫秒时间戳）
    pub created_at: u64,
    /// 最后更新时间（毫秒时间戳）
    pub updated_at: u64,
    /// 组件类型的位掩码（快速匹配）
    pub component_mask: u64,
}

impl Archetype {
    /**
     * 创建新的原型
     */
    pub fn new(component_types: Vec<ComponentType>) -> Self {
        let id = Self::generate_id(&component_types);
        let component_mask = Self::calculate_mask(&component_types);
        let now = current_timestamp();
        
        Self {
            id,
            component_types,
            entities: Vec::new(),
            created_at: now,
            updated_at: now,
            component_mask,
        }
    }

    /**
     * 生成原型ID
     */
    fn generate_id(component_types: &[ComponentType]) -> ArchetypeId {
        let mut sorted_types = component_types.to_vec();
        sorted_types.sort_by_key(|t| format!("{:?}", t));
        
        // 使用组件类型的哈希值组合生成ID
        let combined = sorted_types.iter()
            .map(|t| format!("{:?}", t))
            .collect::<Vec<_>>()
            .join("|");
        
        format!("archetype_{:x}", hash_string(&combined))
    }

    /**
     * 计算组件类型的位掩码
     */
    fn calculate_mask(component_types: &[ComponentType]) -> u64 {
        // 简化实现：使用组件类型哈希的前64位作为掩码
        let mut mask = 0u64;
        for (i, component_type) in component_types.iter().enumerate() {
            if i >= 64 { break; } // 最多支持64种组件类型的掩码
            let type_hash = hash_component_type(*component_type);
            mask |= 1u64 << (type_hash % 64);
        }
        mask
    }

    /**
     * 添加实体到原型
     */
    pub fn add_entity(&mut self, entity_id: u32) {
        if !self.entities.contains(&entity_id) {
            self.entities.push(entity_id);
            self.updated_at = current_timestamp();
        }
    }

    /**
     * 从原型中移除实体
     */
    pub fn remove_entity(&mut self, entity_id: u32) -> bool {
        if let Some(pos) = self.entities.iter().position(|&id| id == entity_id) {
            self.entities.remove(pos);
            self.updated_at = current_timestamp();
            true
        } else {
            false
        }
    }

    /**
     * 检查原型是否包含指定组件类型
     */
    pub fn contains_component(&self, component_type: ComponentType) -> bool {
        self.component_types.contains(&component_type)
    }

    /**
     * 检查原型是否包含所有指定的组件类型
     */
    pub fn contains_all_components(&self, component_types: &[ComponentType]) -> bool {
        component_types.iter().all(|t| self.contains_component(*t))
    }

    /**
     * 检查原型是否包含任意一个指定的组件类型
     */
    pub fn contains_any_component(&self, component_types: &[ComponentType]) -> bool {
        component_types.iter().any(|t| self.contains_component(*t))
    }

    /**
     * 获取实体数量
     */
    pub fn entity_count(&self) -> usize {
        self.entities.len()
    }

    /**
     * 检查原型是否为空
     */
    pub fn is_empty(&self) -> bool {
        self.entities.is_empty()
    }
}

/**
 * 原型查询结果
 */
#[derive(Debug)]
pub struct ArchetypeQueryResult {
    /// 匹配的原型列表
    pub archetypes: Vec<Archetype>,
    /// 所有匹配实体的总数
    pub total_entities: usize,
    /// 查询执行时间（毫秒）
    pub execution_time: f64,
    /// 是否使用了缓存
    pub from_cache: bool,
}

/**
 * 原型查询统计信息
 */
#[derive(Debug, Default)]
pub struct ArchetypeSystemStats {
    /// 总原型数量
    pub total_archetypes: usize,
    /// 总实体数量
    pub total_entities: usize,
    /// 平均每个原型的实体数量
    pub average_entities_per_archetype: f64,
    /// 查询次数
    pub total_queries: u32,
    /// 缓存命中次数
    pub cache_hits: u32,
    /// 缓存命中率
    pub cache_hit_rate: f32,
    /// 内存使用量（估算）
    pub memory_usage_bytes: usize,
}

/**
 * 原型系统
 * 
 * 根据实体的组件组合将实体分组到不同的原型中，提供高效的查询性能。
 * 这是现代ECS的核心优化技术之一。
 */
pub struct ArchetypeSystem {
    /// 所有原型的映射表（ID -> 原型）
    archetypes: FxHashMap<ArchetypeId, Archetype>,
    
    /// 实体到原型的映射
    entity_to_archetype: FxHashMap<u32, ArchetypeId>,
    
    /// 组件类型到原型集合的映射（用于快速查找）
    component_to_archetypes: FxHashMap<ComponentType, HashSet<ArchetypeId>>,
    
    /// 查询缓存
    query_cache: FxHashMap<String, CachedQueryResult>,
    
    /// 缓存配置
    cache_timeout_ms: u64,
    max_cache_size: usize,
    
    /// 统计信息
    stats: ArchetypeSystemStats,
}

/**
 * 缓存查询结果
 */
struct CachedQueryResult {
    result: ArchetypeQueryResult,
    timestamp: u64,
}

impl ArchetypeSystem {
    /**
     * 创建新的原型系统
     */
    pub fn new() -> Self {
        Self {
            archetypes: FxHashMap::default(),
            entity_to_archetype: FxHashMap::default(),
            component_to_archetypes: FxHashMap::default(),
            query_cache: FxHashMap::default(),
            cache_timeout_ms: 5000, // 5秒缓存超时
            max_cache_size: 100,
            stats: ArchetypeSystemStats::default(),
        }
    }

    /**
     * 设置缓存配置
     */
    pub fn configure_cache(&mut self, timeout_ms: u64, max_size: usize) {
        self.cache_timeout_ms = timeout_ms;
        self.max_cache_size = max_size;
    }

    /**
     * 添加实体到原型系统
     */
    pub fn add_entity(&mut self, entity_id: u32, component_types: Vec<ComponentType>) {
        if component_types.is_empty() {
            return; // 不处理没有组件的实体
        }

        let archetype_id = Archetype::generate_id(&component_types);
        
        // 如果原型不存在，创建新原型
        if !self.archetypes.contains_key(&archetype_id) {
            let archetype = Archetype::new(component_types.clone());
            self.create_archetype(archetype);
        }

        // 添加实体到原型
        if let Some(archetype) = self.archetypes.get_mut(&archetype_id) {
            archetype.add_entity(entity_id);
        }

        // 更新实体到原型的映射
        if let Some(old_archetype_id) = self.entity_to_archetype.get(&entity_id).cloned() {
            // 如果实体已存在于其他原型中，先移除
            if old_archetype_id != archetype_id {
                self.remove_entity_from_archetype(entity_id, &old_archetype_id);
            }
        }
        
        self.entity_to_archetype.insert(entity_id, archetype_id);
        
        // 清空查询缓存（因为原型变化了）
        self.invalidate_query_cache();
    }

    /**
     * 从原型系统中移除实体
     */
    pub fn remove_entity(&mut self, entity_id: u32) -> bool {
        if let Some(archetype_id) = self.entity_to_archetype.remove(&entity_id) {
            let success = self.remove_entity_from_archetype(entity_id, &archetype_id);
            
            if success {
                self.invalidate_query_cache();
                
                // 如果原型变空了，可以考虑清理（但这里保留空原型以提高性能）
                // 实际生产中可能需要定期清理空原型
            }
            
            success
        } else {
            false
        }
    }

    /**
     * 实体组件发生变化时更新原型
     */
    pub fn update_entity_components(&mut self, entity_id: u32, new_component_types: Vec<ComponentType>) {
        // 先移除实体，再重新添加
        self.remove_entity(entity_id);
        if !new_component_types.is_empty() {
            self.add_entity(entity_id, new_component_types);
        }
    }

    /**
     * 查询包含所有指定组件的原型
     */
    pub fn query_all_components(&mut self, component_types: &[ComponentType]) -> ArchetypeQueryResult {
        let cache_key = format!("all:{:?}", component_types);
        
        // 检查缓存
        if let Some(cached) = self.get_cached_result(&cache_key) {
            self.stats.cache_hits += 1;
            self.stats.total_queries += 1;
            return cached;
        }

        let start_time = current_timestamp_f64();
        let mut matching_archetypes = Vec::new();
        let mut total_entities = 0;

        for archetype in self.archetypes.values() {
            if archetype.contains_all_components(component_types) {
                total_entities += archetype.entity_count();
                matching_archetypes.push(archetype.clone());
            }
        }

        let execution_time = current_timestamp_f64() - start_time;
        let result = ArchetypeQueryResult {
            archetypes: matching_archetypes,
            total_entities,
            execution_time,
            from_cache: false,
        };

        // 缓存结果
        self.cache_query_result(cache_key, &result);
        self.stats.total_queries += 1;
        
        result
    }

    /**
     * 查询包含任意指定组件的原型
     */
    pub fn query_any_component(&mut self, component_types: &[ComponentType]) -> ArchetypeQueryResult {
        let cache_key = format!("any:{:?}", component_types);
        
        if let Some(cached) = self.get_cached_result(&cache_key) {
            self.stats.cache_hits += 1;
            self.stats.total_queries += 1;
            return cached;
        }

        let start_time = current_timestamp_f64();
        let mut matching_archetypes = Vec::new();
        let mut total_entities = 0;

        for archetype in self.archetypes.values() {
            if archetype.contains_any_component(component_types) {
                total_entities += archetype.entity_count();
                matching_archetypes.push(archetype.clone());
            }
        }

        let execution_time = current_timestamp_f64() - start_time;
        let result = ArchetypeQueryResult {
            archetypes: matching_archetypes,
            total_entities,
            execution_time,
            from_cache: false,
        };

        self.cache_query_result(cache_key, &result);
        self.stats.total_queries += 1;
        
        result
    }

    /**
     * 根据组件掩码查询原型
     */
    pub fn query_by_mask(&mut self, component_mask: u64) -> ArchetypeQueryResult {
        let cache_key = format!("mask:{}", component_mask);
        
        if let Some(cached) = self.get_cached_result(&cache_key) {
            self.stats.cache_hits += 1;
            self.stats.total_queries += 1;
            return cached;
        }

        let start_time = current_timestamp_f64();
        let mut matching_archetypes = Vec::new();
        let mut total_entities = 0;

        for archetype in self.archetypes.values() {
            if (archetype.component_mask & component_mask) == component_mask {
                total_entities += archetype.entity_count();
                matching_archetypes.push(archetype.clone());
            }
        }

        let execution_time = current_timestamp_f64() - start_time;
        let result = ArchetypeQueryResult {
            archetypes: matching_archetypes,
            total_entities,
            execution_time,
            from_cache: false,
        };

        self.cache_query_result(cache_key, &result);
        self.stats.total_queries += 1;
        
        result
    }

    /**
     * 获取实体所属的原型
     */
    pub fn get_entity_archetype(&self, entity_id: u32) -> Option<&Archetype> {
        if let Some(archetype_id) = self.entity_to_archetype.get(&entity_id) {
            self.archetypes.get(archetype_id)
        } else {
            None
        }
    }

    /**
     * 获取所有原型的列表
     */
    pub fn get_all_archetypes(&self) -> Vec<&Archetype> {
        self.archetypes.values().collect()
    }

    /**
     * 获取统计信息
     */
    pub fn get_stats(&self) -> ArchetypeSystemStats {
        let total_archetypes = self.archetypes.len();
        let total_entities = self.archetypes.values()
            .map(|a| a.entity_count())
            .sum();
        
        let average_entities = if total_archetypes > 0 {
            total_entities as f64 / total_archetypes as f64
        } else {
            0.0
        };

        let cache_hit_rate = if self.stats.total_queries > 0 {
            (self.stats.cache_hits as f32 / self.stats.total_queries as f32) * 100.0
        } else {
            0.0
        };

        let memory_usage = self.estimate_memory_usage();

        ArchetypeSystemStats {
            total_archetypes,
            total_entities,
            average_entities_per_archetype: average_entities,
            total_queries: self.stats.total_queries,
            cache_hits: self.stats.cache_hits,
            cache_hit_rate,
            memory_usage_bytes: memory_usage,
        }
    }

    /**
     * 清空所有数据
     */
    pub fn clear(&mut self) {
        self.archetypes.clear();
        self.entity_to_archetype.clear();
        self.component_to_archetypes.clear();
        self.query_cache.clear();
        self.stats = ArchetypeSystemStats::default();
    }

    // ========== 私有方法 ==========

    /**
     * 创建新原型并建立索引
     */
    fn create_archetype(&mut self, archetype: Archetype) {
        let archetype_id = archetype.id.clone();
        
        // 为每个组件类型建立索引
        for &component_type in &archetype.component_types {
            self.component_to_archetypes
                .entry(component_type)
                .or_insert_with(HashSet::new)
                .insert(archetype_id.clone());
        }

        self.archetypes.insert(archetype_id, archetype);
    }

    /**
     * 从指定原型中移除实体
     */
    fn remove_entity_from_archetype(&mut self, entity_id: u32, archetype_id: &str) -> bool {
        if let Some(archetype) = self.archetypes.get_mut(archetype_id) {
            archetype.remove_entity(entity_id)
        } else {
            false
        }
    }

    /**
     * 获取缓存的查询结果
     */
    fn get_cached_result(&self, cache_key: &str) -> Option<ArchetypeQueryResult> {
        if let Some(cached) = self.query_cache.get(cache_key) {
            let now = current_timestamp();
            if now - cached.timestamp < self.cache_timeout_ms {
                return Some(ArchetypeQueryResult {
                    archetypes: cached.result.archetypes.clone(),
                    total_entities: cached.result.total_entities,
                    execution_time: cached.result.execution_time,
                    from_cache: true,
                });
            }
        }
        None
    }

    /**
     * 缓存查询结果
     */
    fn cache_query_result(&mut self, cache_key: String, result: &ArchetypeQueryResult) {
        // 如果缓存已满，清理旧条目
        if self.query_cache.len() >= self.max_cache_size {
            self.cleanup_old_cache_entries();
        }

        let cached_result = CachedQueryResult {
            result: ArchetypeQueryResult {
                archetypes: result.archetypes.clone(),
                total_entities: result.total_entities,
                execution_time: result.execution_time,
                from_cache: false,
            },
            timestamp: current_timestamp(),
        };

        self.query_cache.insert(cache_key, cached_result);
    }

    /**
     * 清理过期的缓存条目
     */
    fn cleanup_old_cache_entries(&mut self) {
        let now = current_timestamp();
        let timeout = self.cache_timeout_ms;
        
        self.query_cache.retain(|_, cached| {
            now - cached.timestamp < timeout
        });

        // 如果清理后仍然太多，移除最旧的一半
        if self.query_cache.len() >= self.max_cache_size {
            let keys_to_remove: Vec<_> = self.query_cache.keys()
                .take(self.query_cache.len() / 2)
                .cloned()
                .collect();
            
            for key in keys_to_remove {
                self.query_cache.remove(&key);
            }
        }
    }

    /**
     * 使查询缓存失效
     */
    fn invalidate_query_cache(&mut self) {
        self.query_cache.clear();
    }

    /**
     * 估算内存使用量
     */
    fn estimate_memory_usage(&self) -> usize {
        let archetypes_size = self.archetypes.len() * std::mem::size_of::<Archetype>();
        let entity_mapping_size = self.entity_to_archetype.len() * (std::mem::size_of::<u32>() + std::mem::size_of::<String>());
        let component_mapping_size = self.component_to_archetypes.len() * std::mem::size_of::<(ComponentType, HashSet<ArchetypeId>)>();
        let cache_size = self.query_cache.len() * std::mem::size_of::<CachedQueryResult>();
        
        archetypes_size + entity_mapping_size + component_mapping_size + cache_size
    }
}

impl Default for ArchetypeSystem {
    fn default() -> Self {
        Self::new()
    }
}

// ========== 辅助函数 ==========

/**
 * 获取当前时间戳（毫秒）
 */
fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/**
 * 获取当前时间戳（浮点毫秒，用于精确计时）
 */
fn current_timestamp_f64() -> f64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs_f64() * 1000.0
}

/**
 * 计算字符串哈希
 */
fn hash_string(s: &str) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    s.hash(&mut hasher);
    hasher.finish()
}

/**
 * 计算组件类型哈希
 */
fn hash_component_type(component_type: ComponentType) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    component_type.hash(&mut hasher);
    hasher.finish()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::any::TypeId;

    // 测试用的示例组件
    struct TestComponentA;
    struct TestComponentB;
    struct TestComponentC;

    #[test]
    fn test_archetype_creation() {
        let component_types = vec![
            TypeId::of::<TestComponentA>(),
            TypeId::of::<TestComponentB>(),
        ];
        
        let archetype = Archetype::new(component_types.clone());
        assert_eq!(archetype.component_types.len(), 2);
        assert_eq!(archetype.entity_count(), 0);
        assert!(!archetype.id.is_empty());
    }

    #[test]
    fn test_archetype_system_basic() {
        let mut system = ArchetypeSystem::new();
        
        let component_types_a = vec![
            TypeId::of::<TestComponentA>(),
            TypeId::of::<TestComponentB>(),
        ];
        
        let component_types_b = vec![
            TypeId::of::<TestComponentA>(),
            TypeId::of::<TestComponentC>(),
        ];
        
        // 添加实体
        system.add_entity(1, component_types_a.clone());
        system.add_entity(2, component_types_a.clone());
        system.add_entity(3, component_types_b);
        
        let stats = system.get_stats();
        assert_eq!(stats.total_archetypes, 2);
        assert_eq!(stats.total_entities, 3);
    }

    #[test]
    fn test_archetype_queries() {
        let mut system = ArchetypeSystem::new();
        
        let component_types_ab = vec![
            TypeId::of::<TestComponentA>(),
            TypeId::of::<TestComponentB>(),
        ];
        
        let component_types_ac = vec![
            TypeId::of::<TestComponentA>(),
            TypeId::of::<TestComponentC>(),
        ];
        
        system.add_entity(1, component_types_ab);
        system.add_entity(2, component_types_ac);
        
        // 查询包含ComponentA的原型
        let result = system.query_all_components(&[TypeId::of::<TestComponentA>()]);
        assert_eq!(result.archetypes.len(), 2);
        assert_eq!(result.total_entities, 2);
        
        // 查询包含ComponentB的原型
        let result = system.query_all_components(&[TypeId::of::<TestComponentB>()]);
        assert_eq!(result.archetypes.len(), 1);
        assert_eq!(result.total_entities, 1);
    }

    #[test]
    fn test_entity_updates() {
        let mut system = ArchetypeSystem::new();
        
        let initial_components = vec![TypeId::of::<TestComponentA>()];
        system.add_entity(1, initial_components);
        
        assert_eq!(system.get_stats().total_archetypes, 1);
        
        // 更新实体组件
        let new_components = vec![
            TypeId::of::<TestComponentA>(),
            TypeId::of::<TestComponentB>(),
        ];
        system.update_entity_components(1, new_components);
        
        // 应该创建新的原型
        assert_eq!(system.get_stats().total_archetypes, 2);
        assert_eq!(system.get_stats().total_entities, 1);
    }

    #[test]
    fn test_cache_functionality() {
        let mut system = ArchetypeSystem::new();
        system.configure_cache(1000, 10); // 1秒缓存，最多10条
        
        let component_types = vec![TypeId::of::<TestComponentA>()];
        system.add_entity(1, component_types);
        
        // 第一次查询
        let result1 = system.query_all_components(&[TypeId::of::<TestComponentA>()]);
        assert!(!result1.from_cache);
        
        // 第二次查询应该从缓存获取
        let result2 = system.query_all_components(&[TypeId::of::<TestComponentA>()]);
        assert!(result2.from_cache);
        
        let stats = system.get_stats();
        assert_eq!(stats.cache_hits, 1);
        assert_eq!(stats.total_queries, 2);
    }
}