use crate::{EntityId, ComponentMask};
use ahash::AHashMap;

/// 查询引擎，负责高性能的实体查询
pub struct QueryEngine {
    /// 实体到组件掩码的映射
    entity_masks: AHashMap<EntityId, ComponentMask>,
    
    /// 常用查询掩码的缓存
    cached_queries: AHashMap<ComponentMask, Vec<EntityId>>,
    
    /// 查询结果缓冲区
    query_buffer: Vec<EntityId>,
    
    /// 缓存有效性标志
    cache_dirty: bool,
    
    /// 性能统计
    query_count: u32,
    
    /// 最后查询结果数量
    last_query_result_count: usize,
}

impl QueryEngine {
    pub fn new() -> Self {
        QueryEngine {
            entity_masks: AHashMap::with_capacity(50000),
            cached_queries: AHashMap::with_capacity(32),
            query_buffer: Vec::with_capacity(50000),
            cache_dirty: true,
            query_count: 0,
            last_query_result_count: 0,
        }
    }

    /// 添加实体掩码
    pub fn add_entity(&mut self, entity_id: EntityId, mask: ComponentMask) {
        self.entity_masks.insert(entity_id, mask);
        self.cache_dirty = true;
    }

    /// 移除实体
    pub fn remove_entity(&mut self, entity_id: EntityId) -> bool {
        if self.entity_masks.remove(&entity_id).is_some() {
            self.cache_dirty = true;
            true
        } else {
            false
        }
    }

    /// 更新实体掩码
    pub fn update_entity_mask(&mut self, entity_id: EntityId, mask: ComponentMask) {
        if self.entity_masks.contains_key(&entity_id) {
            self.entity_masks.insert(entity_id, mask);
            self.cache_dirty = true;
        }
    }

    /// 批量更新实体掩码
    pub fn batch_update_masks(&mut self, entity_ids: &[EntityId], masks: &[ComponentMask]) {
        if entity_ids.len() != masks.len() {
            return;
        }

        for (i, &entity_id) in entity_ids.iter().enumerate() {
            if self.entity_masks.contains_key(&entity_id) {
                self.entity_masks.insert(entity_id, masks[i]);
            }
        }
        
        self.cache_dirty = true;
    }

    /// 重建查询缓存
    pub fn rebuild_cache(&mut self) {
        if !self.cache_dirty {
            return;
        }

        // 清空所有缓存
        for cached_entities in self.cached_queries.values_mut() {
            cached_entities.clear();
        }

        // 重建所有缓存的查询
        for (&query_mask, cached_entities) in &mut self.cached_queries {
            for (&entity_id, &entity_mask) in &self.entity_masks {
                if (entity_mask & query_mask) == query_mask {
                    cached_entities.push(entity_id);
                }
            }
        }

        self.cache_dirty = false;
    }

    /// 通用查询方法
    pub fn query_entities(&mut self, mask: ComponentMask, max_results: usize) -> &[EntityId] {
        self.query_buffer.clear();
        self.query_count += 1;

        for (&entity_id, &entity_mask) in &self.entity_masks {
            if (entity_mask & mask) == mask {
                self.query_buffer.push(entity_id);
                if self.query_buffer.len() >= max_results {
                    break;
                }
            }
        }

        self.last_query_result_count = self.query_buffer.len();
        &self.query_buffer
    }

    /// 查询指定掩码的实体（带缓存）
    pub fn query_cached(&mut self, mask: ComponentMask) -> &[EntityId] {
        // 如果缓存中没有这个查询，添加它
        if !self.cached_queries.contains_key(&mask) {
            self.cached_queries.insert(mask, Vec::new());
            self.cache_dirty = true;
        }

        self.rebuild_cache();
        self.query_count += 1;
        
        self.cached_queries.get(&mask).unwrap()
    }

    /// 多组件查询
    pub fn query_multiple_components(&mut self, masks: &[ComponentMask], max_results: usize) -> &[EntityId] {
        self.query_buffer.clear();
        self.query_count += 1;

        if masks.is_empty() {
            return &self.query_buffer;
        }

        for (&entity_id, &entity_mask) in &self.entity_masks {
            let mut matches_all = true;
            for &mask in masks {
                if (entity_mask & mask) != mask {
                    matches_all = false;
                    break;
                }
            }
            
            if matches_all {
                self.query_buffer.push(entity_id);
                if self.query_buffer.len() >= max_results {
                    break;
                }
            }
        }

        &self.query_buffer
    }

    /// 带排除条件的查询
    pub fn query_with_exclusion(&mut self, include_mask: ComponentMask, exclude_mask: ComponentMask, max_results: usize) -> &[EntityId] {
        self.query_buffer.clear();
        self.query_count += 1;

        for (&entity_id, &entity_mask) in &self.entity_masks {
            if (entity_mask & include_mask) == include_mask && (entity_mask & exclude_mask) == 0 {
                self.query_buffer.push(entity_id);
                if self.query_buffer.len() >= max_results {
                    break;
                }
            }
        }

        &self.query_buffer
    }

    /// 获取实体的组件掩码
    pub fn get_entity_mask(&self, entity_id: EntityId) -> ComponentMask {
        self.entity_masks.get(&entity_id).copied().unwrap_or(0)
    }

    /// 检查实体是否存在
    pub fn entity_exists(&self, entity_id: EntityId) -> bool {
        self.entity_masks.contains_key(&entity_id)
    }

    /// 获取实体数量
    pub fn get_entity_count(&self) -> u32 {
        self.entity_masks.len() as u32
    }

    /// 获取查询统计
    pub fn get_query_count(&self) -> u32 {
        self.query_count
    }

    /// 获取最后查询结果数量
    pub fn get_last_query_result_count(&self) -> usize {
        self.last_query_result_count
    }

    /// 清理所有数据
    pub fn clear(&mut self) {
        self.entity_masks.clear();
        self.cached_queries.clear();
        self.query_buffer.clear();
        
        self.cache_dirty = true;
        self.query_count = 0;
        self.last_query_result_count = 0;
    }

    /// 强制重建查询缓存
    pub fn force_rebuild_cache(&mut self) {
        self.cache_dirty = true;
        self.rebuild_cache();
    }
} 