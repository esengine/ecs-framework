use std::collections::HashMap;
use crate::core::{Entity, ComponentRegistry};

/**
 * 实体批量操作器
 * 提供对多个实体的批量操作功能
 */
pub struct EntityBatchOperator {
    entities: Vec<Entity>,
    component_registry: ComponentRegistry,
}

impl EntityBatchOperator {
    /**
     * 创建批量操作器
     */
    pub fn new(entities: Vec<Entity>) -> Self {
        Self {
            entities,
            component_registry: ComponentRegistry::new(),
        }
    }

    /**
     * 从实体ID创建批量操作器
     */
    pub fn from_ids(entity_ids: Vec<u32>) -> Self {
        let entities: Vec<Entity> = entity_ids
            .into_iter()
            .map(|id| {
                let mut entity = Entity::new(id);
                entity.set_id(id);
                entity
            })
            .collect();
        Self::new(entities)
    }

    /**
     * 批量设置活跃状态
     */
    pub fn set_enabled(&mut self, enabled: bool) -> &mut Self {
        for entity in &mut self.entities {
            entity.set_enabled(enabled);
        }
        self
    }

    /**
     * 批量设置名称
     */
    pub fn set_name(&mut self, name: &str) -> &mut Self {
        for entity in &mut self.entities {
            entity.set_name(name.to_string());
        }
        self
    }

    /**
     * 批量设置标签
     */
    pub fn set_tag(&mut self, tag: u32) -> &mut Self {
        for entity in &mut self.entities {
            entity.set_tag(tag);
        }
        self
    }

    /**
     * 批量添加标签
     */
    pub fn add_tag(&mut self, tag: u32) -> &mut Self {
        for entity in &mut self.entities {
            entity.add_tag(tag);
        }
        self
    }

    /**
     * 批量移除标签
     */
    pub fn remove_tag(&mut self, tag: u32) -> &mut Self {
        for entity in &mut self.entities {
            entity.remove_tag(tag);
        }
        self
    }

    /**
     * 批量执行操作
     */
    pub fn for_each<F>(&mut self, mut operation: F) -> &mut Self
    where
        F: FnMut(&mut Entity, usize),
    {
        for (index, entity) in self.entities.iter_mut().enumerate() {
            operation(entity, index);
        }
        self
    }

    /**
     * 批量执行只读操作
     */
    pub fn for_each_readonly<F>(&self, mut operation: F) -> &Self
    where
        F: FnMut(&Entity, usize),
    {
        for (index, entity) in self.entities.iter().enumerate() {
            operation(entity, index);
        }
        self
    }

    /**
     * 过滤实体
     */
    pub fn filter<F>(self, predicate: F) -> Self
    where
        F: Fn(&Entity) -> bool,
    {
        let filtered_entities: Vec<Entity> = self.entities
            .into_iter()
            .filter(|entity| predicate(entity))
            .collect();
        
        Self::new(filtered_entities)
    }

    /**
     * 按条件分组
     */
    pub fn group_by<F, K>(self, key_fn: F) -> HashMap<K, EntityBatchOperator>
    where
        F: Fn(&Entity) -> K,
        K: Eq + std::hash::Hash,
    {
        let mut groups: HashMap<K, Vec<Entity>> = HashMap::new();
        
        for entity in self.entities {
            let key = key_fn(&entity);
            groups.entry(key).or_insert_with(Vec::new).push(entity);
        }
        
        groups.into_iter()
            .map(|(key, entities)| (key, EntityBatchOperator::new(entities)))
            .collect()
    }

    /**
     * 获取实体数量
     */
    pub fn count(&self) -> usize {
        self.entities.len()
    }

    /**
     * 检查是否为空
     */
    pub fn is_empty(&self) -> bool {
        self.entities.is_empty()
    }

    /**
     * 获取第一个实体的只读引用
     */
    pub fn first(&self) -> Option<&Entity> {
        self.entities.first()
    }

    /**
     * 获取第一个实体的可变引用
     */
    pub fn first_mut(&mut self) -> Option<&mut Entity> {
        self.entities.first_mut()
    }

    /**
     * 获取最后一个实体的只读引用
     */
    pub fn last(&self) -> Option<&Entity> {
        self.entities.last()
    }

    /**
     * 获取最后一个实体的可变引用
     */
    pub fn last_mut(&mut self) -> Option<&mut Entity> {
        self.entities.last_mut()
    }

    /**
     * 获取指定索引的实体
     */
    pub fn get(&self, index: usize) -> Option<&Entity> {
        self.entities.get(index)
    }

    /**
     * 获取指定索引的可变实体
     */
    pub fn get_mut(&mut self, index: usize) -> Option<&mut Entity> {
        self.entities.get_mut(index)
    }

    /**
     * 清空所有实体
     */
    pub fn clear(&mut self) -> &mut Self {
        self.entities.clear();
        self
    }

    /**
     * 添加实体
     */
    pub fn add_entity(&mut self, entity: Entity) -> &mut Self {
        self.entities.push(entity);
        self
    }

    /**
     * 添加多个实体
     */
    pub fn add_entities(&mut self, mut entities: Vec<Entity>) -> &mut Self {
        self.entities.append(&mut entities);
        self
    }

    /**
     * 移除指定索引的实体
     */
    pub fn remove_at(&mut self, index: usize) -> Option<Entity> {
        if index < self.entities.len() {
            Some(self.entities.remove(index))
        } else {
            None
        }
    }

    /**
     * 移除满足条件的实体
     */
    pub fn remove_if<F>(&mut self, predicate: F) -> &mut Self
    where
        F: Fn(&Entity) -> bool,
    {
        self.entities.retain(|entity| !predicate(entity));
        self
    }

    /**
     * 获取所有实体ID
     */
    pub fn get_entity_ids(&self) -> Vec<u32> {
        self.entities.iter().map(|entity| entity.id()).collect()
    }

    /**
     * 检查是否包含指定ID的实体
     */
    pub fn contains_entity(&self, entity_id: u32) -> bool {
        self.entities.iter().any(|entity| entity.id() == entity_id)
    }

    /**
     * 按ID查找实体
     */
    pub fn find_by_id(&self, entity_id: u32) -> Option<&Entity> {
        self.entities.iter().find(|entity| entity.id() == entity_id)
    }

    /**
     * 按ID查找可变实体
     */
    pub fn find_by_id_mut(&mut self, entity_id: u32) -> Option<&mut Entity> {
        self.entities.iter_mut().find(|entity| entity.id() == entity_id)
    }

    /**
     * 按名称查找实体
     */
    pub fn find_by_name(&self, name: &str) -> Vec<&Entity> {
        self.entities
            .iter()
            .filter(|entity| entity.name().as_deref() == Some(name))
            .collect()
    }

    /**
     * 按标签查找实体
     */
    pub fn find_by_tag(&self, tag: u32) -> Vec<&Entity> {
        self.entities
            .iter()
            .filter(|entity| entity.has_tag(tag))
            .collect()
    }

    /**
     * 获取启用的实体
     */
    pub fn get_enabled(&self) -> Vec<&Entity> {
        self.entities
            .iter()
            .filter(|entity| entity.enabled())
            .collect()
    }

    /**
     * 获取禁用的实体
     */
    pub fn get_disabled(&self) -> Vec<&Entity> {
        self.entities
            .iter()
            .filter(|entity| !entity.enabled())
            .collect()
    }

    /**
     * 排序实体
     */
    pub fn sort_by<F>(&mut self, compare: F) -> &mut Self
    where
        F: FnMut(&Entity, &Entity) -> std::cmp::Ordering,
    {
        self.entities.sort_by(compare);
        self
    }

    /**
     * 按ID排序
     */
    pub fn sort_by_id(&mut self) -> &mut Self {
        self.entities.sort_by(|a, b| a.id().cmp(&b.id()));
        self
    }

    /**
     * 按名称排序
     */
    pub fn sort_by_name(&mut self) -> &mut Self {
        self.entities.sort_by(|a, b| a.name().cmp(&b.name()));
        self
    }

    /**
     * 转换为实体数组
     */
    pub fn to_vec(self) -> Vec<Entity> {
        self.entities
    }

    /**
     * 转换为实体ID数组
     */
    pub fn to_id_vec(&self) -> Vec<u32> {
        self.get_entity_ids()
    }

    /**
     * 克隆实体数组
     */
    pub fn clone_entities(&self) -> Vec<Entity> {
        self.entities.clone()
    }
}

/**
 * 批量操作统计信息
 */
#[derive(Debug, Clone)]
pub struct BatchOperatorStats {
    pub total_operations: u64,
    pub entities_processed: u64,
    pub filters_applied: u64,
    pub groups_created: u64,
    pub sorts_performed: u64,
}

impl BatchOperatorStats {
    pub fn new() -> Self {
        Self {
            total_operations: 0,
            entities_processed: 0,
            filters_applied: 0,
            groups_created: 0,
            sorts_performed: 0,
        }
    }

    /**
     * 重置统计信息
     */
    pub fn reset(&mut self) {
        self.total_operations = 0;
        self.entities_processed = 0;
        self.filters_applied = 0;
        self.groups_created = 0;
        self.sorts_performed = 0;
    }

    /**
     * 记录操作
     */
    pub fn record_operation(&mut self, entities_count: usize) {
        self.total_operations += 1;
        self.entities_processed += entities_count as u64;
    }

    /**
     * 记录过滤操作
     */
    pub fn record_filter(&mut self) {
        self.filters_applied += 1;
    }

    /**
     * 记录分组操作
     */
    pub fn record_group(&mut self) {
        self.groups_created += 1;
    }

    /**
     * 记录排序操作
     */
    pub fn record_sort(&mut self) {
        self.sorts_performed += 1;
    }

    /**
     * 获取平均处理实体数
     */
    pub fn average_entities_per_operation(&self) -> f64 {
        if self.total_operations == 0 {
            0.0
        } else {
            self.entities_processed as f64 / self.total_operations as f64
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_entities() -> Vec<Entity> {
        vec![
            {
                let mut e = Entity::new(1);
                e.set_name("Entity1".to_string());
                e.set_tag(100);
                e
            },
            {
                let mut e = Entity::new(2);
                e.set_name("Entity2".to_string());
                e.set_tag(200);
                e.set_enabled(false);
                e
            },
            {
                let mut e = Entity::new(3);
                e.set_name("Entity3".to_string());
                e.set_tag(100);
                e
            },
        ]
    }

    #[test]
    fn test_batch_operator_creation() {
        let entities = create_test_entities();
        let operator = EntityBatchOperator::new(entities);
        assert_eq!(operator.count(), 3);
        assert!(!operator.is_empty());
    }

    #[test]
    fn test_batch_operator_from_ids() {
        let ids = vec![1, 2, 3];
        let operator = EntityBatchOperator::from_ids(ids);
        assert_eq!(operator.count(), 3);
        assert_eq!(operator.get_entity_ids(), vec![1, 2, 3]);
    }

    #[test]
    fn test_batch_set_enabled() {
        let entities = create_test_entities();
        let mut operator = EntityBatchOperator::new(entities);
        
        operator.set_enabled(false);
        assert_eq!(operator.get_enabled().len(), 0);
        assert_eq!(operator.get_disabled().len(), 3);
    }

    #[test]
    fn test_batch_set_name() {
        let entities = create_test_entities();
        let mut operator = EntityBatchOperator::new(entities);
        
        operator.set_name("NewName");
        for entity in operator.entities.iter() {
            assert_eq!(entity.name().as_deref(), Some("NewName"));
        }
    }

    #[test]
    fn test_batch_tags() {
        let entities = create_test_entities();
        let mut operator = EntityBatchOperator::new(entities);
        
        operator.add_tag(999);
        for entity in operator.entities.iter() {
            assert!(entity.has_tag(999));
        }
        
        operator.remove_tag(999);
        for entity in operator.entities.iter() {
            assert!(!entity.has_tag(999));
        }
    }

    #[test]
    fn test_batch_for_each() {
        let entities = create_test_entities();
        let mut operator = EntityBatchOperator::new(entities);
        
        let mut count = 0;
        operator.for_each(|_, index| {
            count += index + 1;
        });
        assert_eq!(count, 6); // 1 + 2 + 3
    }

    #[test]
    fn test_batch_filter() {
        let entities = create_test_entities();
        let operator = EntityBatchOperator::new(entities);
        
        let filtered = operator.filter(|entity| entity.has_tag(100));
        assert_eq!(filtered.count(), 2);
    }

    #[test]
    fn test_batch_group_by() {
        let entities = create_test_entities();
        let operator = EntityBatchOperator::new(entities);
        
        let groups = operator.group_by(|entity| entity.enabled());
        assert_eq!(groups.len(), 2);
        assert!(groups.contains_key(&true));
        assert!(groups.contains_key(&false));
    }

    #[test]
    fn test_batch_first_last() {
        let entities = create_test_entities();
        let mut operator = EntityBatchOperator::new(entities);
        
        assert_eq!(operator.first().unwrap().id(), 1);
        assert_eq!(operator.last().unwrap().id(), 3);
        
        operator.first_mut().unwrap().set_name("Modified".to_string());
        assert_eq!(operator.first().unwrap().name().as_deref(), Some("Modified"));
    }

    #[test]
    fn test_batch_find_operations() {
        let entities = create_test_entities();
        let operator = EntityBatchOperator::new(entities);
        
        assert!(operator.find_by_id(2).is_some());
        assert!(operator.find_by_id(999).is_none());
        
        let found_by_name = operator.find_by_name("Entity2");
        assert_eq!(found_by_name.len(), 1);
        
        let found_by_tag = operator.find_by_tag(100);
        assert_eq!(found_by_tag.len(), 2);
    }

    #[test]
    fn test_batch_sort() {
        let entities = create_test_entities();
        let mut operator = EntityBatchOperator::new(entities);
        
        // 按ID降序排序
        operator.sort_by(|a, b| b.id().cmp(&a.id()));
        assert_eq!(operator.get(0).unwrap().id(), 3);
        assert_eq!(operator.get(2).unwrap().id(), 1);
        
        // 按ID升序排序
        operator.sort_by_id();
        assert_eq!(operator.get(0).unwrap().id(), 1);
        assert_eq!(operator.get(2).unwrap().id(), 3);
    }

    #[test]
    fn test_batch_stats() {
        let mut stats = BatchOperatorStats::new();
        
        stats.record_operation(5);
        stats.record_filter();
        stats.record_group();
        stats.record_sort();
        
        assert_eq!(stats.total_operations, 1);
        assert_eq!(stats.entities_processed, 5);
        assert_eq!(stats.filters_applied, 1);
        assert_eq!(stats.groups_created, 1);
        assert_eq!(stats.sorts_performed, 1);
        assert_eq!(stats.average_entities_per_operation(), 5.0);
    }

    #[test]
    fn test_batch_remove_operations() {
        let entities = create_test_entities();
        let mut operator = EntityBatchOperator::new(entities);
        
        let removed = operator.remove_at(1);
        assert!(removed.is_some());
        assert_eq!(removed.unwrap().id(), 2);
        assert_eq!(operator.count(), 2);
        
        operator.remove_if(|entity| entity.has_tag(100));
        assert_eq!(operator.count(), 0);
    }
}