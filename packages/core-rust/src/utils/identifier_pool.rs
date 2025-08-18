use std::collections::HashMap;

/**
 * 延迟回收项结构
 */
#[derive(Debug, Clone)]
struct PendingRecycleItem {
    index: u16,
    generation: u16,
    timestamp: u64,
}

/**
 * 世代式ID池统计信息
 */
#[derive(Debug, Clone, Default)]
pub struct IdentifierPoolStats {
    /// 已分配的总索引数
    pub total_allocated: u64,
    /// 总计回收次数
    pub total_recycled: u64,
    /// 当前活跃实体数
    pub current_active: u32,
    /// 当前空闲的索引数
    pub currently_free: u32,
    /// 等待回收的ID数
    pub pending_recycle: u32,
    /// 理论最大实体数（设计限制）
    pub max_possible_entities: u32,
    /// 当前使用的最大索引
    pub max_used_index: u16,
    /// 内存使用（字节）
    pub memory_usage: usize,
    /// 内存扩展次数
    pub memory_expansions: u32,
    /// 平均世代版本
    pub average_generation: f64,
    /// 世代存储大小
    pub generation_storage_size: usize,
}

/**
 * 世代式ID池管理器
 * 
 * 用于管理实体ID的分配和回收，支持世代版本控制以防止悬空引用问题。
 * 世代式ID由索引和版本组成，当ID被回收时版本会递增，确保旧引用失效。
 * 
 * 支持动态扩展，理论上可以支持到65535个索引（16位），每个索引65535个版本（16位）。
 * 总计可以处理超过42亿个独特的ID组合，完全满足ECS大规模实体需求。
 */
#[derive(Debug)]
pub struct IdentifierPool {
    /// 下一个可用的索引
    next_available_index: u16,
    
    /// 空闲的索引列表
    free_indices: Vec<u16>,
    
    /// 每个索引对应的世代版本
    /// 使用HashMap实现动态扩展
    generations: HashMap<u16, u16>,
    
    /// 延迟回收队列
    /// 防止在同一帧内立即重用ID，避免时序问题
    pending_recycle: Vec<PendingRecycleItem>,
    
    /// 延迟回收时间（毫秒）
    recycle_delay: u64,
    
    /// 内存扩展块大小
    expansion_block_size: u16,
    
    /// 统计信息
    stats: IdentifierPoolStats,
}

impl IdentifierPool {
    /// 最大索引限制（16位）
    /// 这是框架设计选择：16位索引 + 16位版本 = 32位ID，确保高效位操作
    pub const MAX_INDEX: u16 = 0xFFFF; // 65535
    
    /// 最大世代限制（16位）
    pub const MAX_GENERATION: u16 = 0xFFFF; // 65535

    /**
     * 构造函数
     * 
     * @param recycle_delay 延迟回收时间（毫秒），默认为100ms
     * @param expansion_block_size 内存扩展块大小，默认为1024
     */
    pub fn new(recycle_delay: u64, expansion_block_size: u16) -> Self {
        let mut pool = Self {
            next_available_index: 0,
            free_indices: Vec::new(),
            generations: HashMap::new(),
            pending_recycle: Vec::new(),
            recycle_delay,
            expansion_block_size,
            stats: IdentifierPoolStats::default(),
        };
        
        // 预分配第一个块的世代信息
        pool.pre_allocate_generations(0, pool.expansion_block_size);
        pool
    }

    /**
     * 使用默认参数创建ID池
     */
    pub fn with_defaults() -> Self {
        Self::new(100, 1024)
    }

    /**
     * 获取一个可用的ID
     * 
     * 返回一个32位ID，高16位为世代版本，低16位为索引。
     * 
     * @returns 新分配的实体ID
     * @throws Error 当达到索引限制时
     */
    pub fn check_out(&mut self) -> Result<u32, String> {
        // 处理延迟回收队列
        self.process_delayed_recycle(false);
        
        let index: u16;
        
        if let Some(recycled_index) = self.free_indices.pop() {
            // 重用回收的索引
            index = recycled_index;
        } else {
            // 分配新索引
            if self.next_available_index >= Self::MAX_INDEX {
                return Err(format!(
                    "实体索引已达到框架设计限制 ({})。\
                    这意味着您已经分配了超过65535个不同的实体索引。\
                    这是16位索引设计的限制，考虑优化实体回收策略或升级到64位ID设计。",
                    Self::MAX_INDEX
                ));
            }
            
            index = self.next_available_index;
            self.next_available_index += 1;
            
            // 按需扩展世代存储
            self.ensure_generation_capacity(index);
        }
        
        let generation = self.generations.get(&index).copied().unwrap_or(1);
        self.stats.total_allocated += 1;
        self.stats.current_active += 1;
        
        Ok(self.pack_id(index, generation))
    }

    /**
     * 回收一个ID
     * 
     * 验证ID的有效性后，将其加入延迟回收队列。
     * ID不会立即可重用，而是在延迟时间后才真正回收。
     * 
     * @param id 要回收的实体ID
     * @returns 是否成功回收（ID是否有效且未被重复回收）
     */
    pub fn check_in(&mut self, id: u32) -> bool {
        let index = self.unpack_index(id);
        let generation = self.unpack_generation(id);
        
        // 验证ID有效性
        if !self.is_valid_id(index, generation) {
            return false;
        }
        
        // 检查是否已经在待回收队列中
        let already_pending = self.pending_recycle.iter()
            .any(|item| item.index == index && item.generation == generation);
        
        if already_pending {
            return false; // 已经在回收队列中，拒绝重复回收
        }
        
        // 加入延迟回收队列
        self.pending_recycle.push(PendingRecycleItem {
            index,
            generation,
            timestamp: self.get_current_time_ms(),
        });
        
        self.stats.current_active -= 1;
        self.stats.total_recycled += 1;
        
        true
    }

    /**
     * 验证ID是否有效
     * 
     * 检查ID的索引和世代版本是否匹配当前状态。
     * 
     * @param id 要验证的实体ID
     * @returns ID是否有效
     */
    pub fn is_valid(&self, id: u32) -> bool {
        let index = self.unpack_index(id);
        let generation = self.unpack_generation(id);
        self.is_valid_id(index, generation)
    }

    /**
     * 获取统计信息
     * 
     * @returns 池的当前状态统计
     */
    pub fn get_stats(&self) -> IdentifierPoolStats {
        // 计算平均世代版本
        let (total_generation, generation_count) = self.generations.iter()
            .filter(|(&index, _)| index < self.next_available_index)
            .fold((0u64, 0u32), |(sum, count), (_, &generation)| {
                (sum + generation as u64, count + 1)
            });
        
        let average_generation = if generation_count > 0 {
            (total_generation as f64) / (generation_count as f64)
        } else {
            1.0
        };

        IdentifierPoolStats {
            total_allocated: self.stats.total_allocated,
            total_recycled: self.stats.total_recycled,
            current_active: self.stats.current_active,
            currently_free: self.free_indices.len() as u32,
            pending_recycle: self.pending_recycle.len() as u32,
            max_possible_entities: (Self::MAX_INDEX as u32) + 1,
            max_used_index: if self.next_available_index > 0 {
                self.next_available_index - 1
            } else {
                0
            },
            memory_usage: self.calculate_memory_usage(),
            memory_expansions: self.stats.memory_expansions,
            average_generation: (average_generation * 100.0).round() / 100.0,
            generation_storage_size: self.generations.len(),
        }
    }

    /**
     * 强制执行延迟回收处理
     * 
     * 在某些情况下可能需要立即处理延迟回收队列，
     * 比如内存压力大或者需要精确的统计信息时。
     */
    pub fn force_process_delayed_recycle(&mut self) {
        self.process_delayed_recycle(true);
    }

    /**
     * 清理过期的延迟回收项
     * 
     * 将超过延迟时间的回收项真正回收到空闲列表中。
     * 
     * @param force_all 是否强制处理所有延迟回收项
     */
    fn process_delayed_recycle(&mut self, force_all: bool) {
        if self.pending_recycle.is_empty() {
            return;
        }
        
        let now = self.get_current_time_ms();
        let mut ready_to_recycle = Vec::new();
        let mut still_pending = Vec::new();
        
        // 分离已到期和未到期的项
        for item in self.pending_recycle.drain(..) {
            if force_all || now.saturating_sub(item.timestamp) >= self.recycle_delay {
                ready_to_recycle.push(item);
            } else {
                still_pending.push(item);
            }
        }
        
        // 处理到期的回收项
        for item in ready_to_recycle {
            // 再次验证ID有效性（防止重复回收）
            if self.is_valid_id(item.index, item.generation) {
                // 递增世代版本
                let new_generation = if item.generation >= Self::MAX_GENERATION {
                    1 // 重置为1而不是0
                } else {
                    item.generation + 1
                };
                
                self.generations.insert(item.index, new_generation);
                
                // 添加到空闲列表
                self.free_indices.push(item.index);
            }
        }
        
        // 更新待回收队列
        self.pending_recycle = still_pending;
    }

    /**
     * 预分配世代信息
     * 
     * @param start_index 起始索引
     * @param count 分配数量
     */
    fn pre_allocate_generations(&mut self, start_index: u16, count: u16) {
        for i in 0..count {
            let index = start_index.saturating_add(i);
            if index <= Self::MAX_INDEX {
                self.generations.insert(index, 1);
            } else {
                break;
            }
        }
        self.stats.memory_expansions += 1;
    }

    /**
     * 确保指定索引的世代信息存在
     * 
     * @param index 索引
     */
    fn ensure_generation_capacity(&mut self, index: u16) {
        if !self.generations.contains_key(&index) {
            // 计算需要扩展的起始位置
            let expansion_start = (index / self.expansion_block_size) * self.expansion_block_size;
            
            // 预分配一个块
            self.pre_allocate_generations(expansion_start, self.expansion_block_size);
        }
    }

    /**
     * 计算内存使用量
     * 
     * @returns 内存使用字节数
     */
    fn calculate_memory_usage(&self) -> usize {
        let generation_map_size = self.generations.len() * (std::mem::size_of::<u16>() * 2 + 24); // HashMap overhead
        let free_indices_size = self.free_indices.capacity() * std::mem::size_of::<u16>();
        let pending_recycle_size = self.pending_recycle.capacity() * std::mem::size_of::<PendingRecycleItem>();
        
        generation_map_size + free_indices_size + pending_recycle_size
    }

    /**
     * 打包索引和世代为32位ID
     * 
     * @param index 索引（16位）
     * @param generation 世代版本（16位）
     * @returns 打包后的32位ID
     */
    fn pack_id(&self, index: u16, generation: u16) -> u32 {
        ((generation as u32) << 16) | (index as u32)
    }

    /**
     * 从ID中解包索引
     * 
     * @param id 32位ID
     * @returns 索引部分（16位）
     */
    fn unpack_index(&self, id: u32) -> u16 {
        (id & 0xFFFF) as u16
    }

    /**
     * 从ID中解包世代版本
     * 
     * @param id 32位ID
     * @returns 世代版本部分（16位）
     */
    fn unpack_generation(&self, id: u32) -> u16 {
        ((id >> 16) & 0xFFFF) as u16
    }

    /**
     * 内部ID有效性检查
     * 
     * @param index 索引
     * @param generation 世代版本
     * @returns 是否有效
     */
    fn is_valid_id(&self, index: u16, generation: u16) -> bool {
        if index >= self.next_available_index {
            return false;
        }
        
        if let Some(&current_generation) = self.generations.get(&index) {
            current_generation == generation
        } else {
            false
        }
    }

    /**
     * 获取当前时间（毫秒）
     * 在实际应用中应该使用更准确的时间源
     */
    fn get_current_time_ms(&self) -> u64 {
        // 简单的时间实现，实际使用中可能需要更精确的时间源
        // 在WASM环境中可以通过js_sys::Date获取
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64
    }
}

impl Default for IdentifierPool {
    fn default() -> Self {
        Self::with_defaults()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_identifier_pool_basic() {
        let mut pool = IdentifierPool::with_defaults();
        
        // 分配ID
        let id1 = pool.check_out().unwrap();
        let id2 = pool.check_out().unwrap();
        
        assert_ne!(id1, id2);
        assert!(pool.is_valid(id1));
        assert!(pool.is_valid(id2));
        
        let stats = pool.get_stats();
        assert_eq!(stats.current_active, 2);
        assert_eq!(stats.total_allocated, 2);
    }

    #[test]
    fn test_identifier_pool_recycle() {
        let mut pool = IdentifierPool::with_defaults();
        
        let id = pool.check_out().unwrap();
        assert!(pool.is_valid(id));
        
        // 回收ID
        assert!(pool.check_in(id));
        
        // ID应该仍然有效直到延迟回收处理
        assert!(pool.is_valid(id));
        
        // 强制处理延迟回收
        pool.force_process_delayed_recycle();
        
        // 现在ID应该无效
        assert!(!pool.is_valid(id));
        
        let stats = pool.get_stats();
        assert_eq!(stats.current_active, 0);
        assert_eq!(stats.currently_free, 1);
    }

    #[test]
    fn test_identifier_pool_generation_increment() {
        let mut pool = IdentifierPool::with_defaults();
        
        let id1 = pool.check_out().unwrap();
        let index = pool.unpack_index(id1);
        let generation1 = pool.unpack_generation(id1);
        
        // 回收并强制处理
        pool.check_in(id1);
        pool.force_process_delayed_recycle();
        
        // 重新分配同一个索引
        let id2 = pool.check_out().unwrap();
        let index2 = pool.unpack_index(id2);
        let generation2 = pool.unpack_generation(id2);
        
        assert_eq!(index, index2); // 同一个索引
        assert_eq!(generation2, generation1 + 1); // 世代递增
        assert!(!pool.is_valid(id1)); // 旧ID无效
        assert!(pool.is_valid(id2)); // 新ID有效
    }

    #[test]
    fn test_identifier_pool_double_recycle() {
        let mut pool = IdentifierPool::with_defaults();
        
        let id = pool.check_out().unwrap();
        
        // 第一次回收应该成功
        assert!(pool.check_in(id));
        
        // 第二次回收应该失败
        assert!(!pool.check_in(id));
    }

    #[test]
    fn test_identifier_pool_stats() {
        let mut pool = IdentifierPool::with_defaults();
        
        let _id1 = pool.check_out().unwrap();
        let id2 = pool.check_out().unwrap();
        let _id3 = pool.check_out().unwrap();
        
        pool.check_in(id2);
        
        let stats = pool.get_stats();
        assert_eq!(stats.total_allocated, 3);
        assert_eq!(stats.total_recycled, 1);
        assert_eq!(stats.current_active, 2);
        assert_eq!(stats.pending_recycle, 1);
        assert_eq!(stats.max_used_index, 2);
    }
}