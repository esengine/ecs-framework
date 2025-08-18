use crate::utils::ComponentType;
use rustc_hash::FxHashMap;
use std::collections::HashSet;

/**
 * 脏标记类型
 * 使用位标记来表示不同类型的变更
 */
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DirtyFlag(pub u32);

impl DirtyFlag {
    /// 组件数据已修改
    pub const COMPONENT_MODIFIED: DirtyFlag = DirtyFlag(1 << 0);
    /// 组件已添加
    pub const COMPONENT_ADDED: DirtyFlag = DirtyFlag(1 << 1);
    /// 组件已移除
    pub const COMPONENT_REMOVED: DirtyFlag = DirtyFlag(1 << 2);
    /// 实体位置已改变
    pub const TRANSFORM_CHANGED: DirtyFlag = DirtyFlag(1 << 3);
    /// 实体状态已改变
    pub const STATE_CHANGED: DirtyFlag = DirtyFlag(1 << 4);
    /// 实体层次结构已改变
    pub const HIERARCHY_CHANGED: DirtyFlag = DirtyFlag(1 << 5);
    /// 实体可见性已改变
    pub const VISIBILITY_CHANGED: DirtyFlag = DirtyFlag(1 << 6);
    /// 实体启用状态已改变
    pub const ENABLED_CHANGED: DirtyFlag = DirtyFlag(1 << 7);
    /// 自定义标记1
    pub const CUSTOM_1: DirtyFlag = DirtyFlag(1 << 8);
    /// 自定义标记2
    pub const CUSTOM_2: DirtyFlag = DirtyFlag(1 << 9);
    /// 自定义标记3
    pub const CUSTOM_3: DirtyFlag = DirtyFlag(1 << 10);
    /// 自定义标记4
    pub const CUSTOM_4: DirtyFlag = DirtyFlag(1 << 11);
    /// 所有标记
    pub const ALL: DirtyFlag = DirtyFlag(0xFFFFFFFF);

    /**
     * 检查是否包含指定标记
     */
    pub fn contains(self, other: DirtyFlag) -> bool {
        (self.0 & other.0) != 0
    }

    /**
     * 添加标记
     */
    pub fn add(&mut self, other: DirtyFlag) {
        self.0 |= other.0;
    }

    /**
     * 移除标记
     */
    pub fn remove(&mut self, other: DirtyFlag) {
        self.0 &= !other.0;
    }

    /**
     * 清空所有标记
     */
    pub fn clear(&mut self) {
        self.0 = 0;
    }

    /**
     * 检查是否为空
     */
    pub fn is_empty(self) -> bool {
        self.0 == 0
    }

    /**
     * 与操作
     */
    pub fn and(self, other: DirtyFlag) -> DirtyFlag {
        DirtyFlag(self.0 & other.0)
    }

    /**
     * 或操作
     */
    pub fn or(self, other: DirtyFlag) -> DirtyFlag {
        DirtyFlag(self.0 | other.0)
    }
}

impl std::ops::BitOr for DirtyFlag {
    type Output = Self;
    
    fn bitor(self, rhs: Self) -> Self::Output {
        DirtyFlag(self.0 | rhs.0)
    }
}

impl std::ops::BitAnd for DirtyFlag {
    type Output = Self;
    
    fn bitand(self, rhs: Self) -> Self::Output {
        DirtyFlag(self.0 & rhs.0)
    }
}

impl std::ops::BitOrAssign for DirtyFlag {
    fn bitor_assign(&mut self, rhs: Self) {
        self.0 |= rhs.0;
    }
}

impl std::ops::BitAndAssign for DirtyFlag {
    fn bitand_assign(&mut self, rhs: Self) {
        self.0 &= rhs.0;
    }
}

/**
 * 脏标记数据
 * 记录实体的变更信息
 */
#[derive(Debug, Clone)]
pub struct DirtyData {
    /// 实体ID
    pub entity_id: u32,
    /// 脏标记位
    pub flags: DirtyFlag,
    /// 修改的组件类型列表
    pub modified_components: HashSet<ComponentType>,
    /// 标记时间戳（毫秒）
    pub timestamp: u64,
    /// 帧编号
    pub frame_number: u64,
}

impl DirtyData {
    /**
     * 创建新的脏标记数据
     */
    pub fn new(entity_id: u32, flags: DirtyFlag, frame_number: u64) -> Self {
        Self {
            entity_id,
            flags,
            modified_components: HashSet::new(),
            timestamp: current_timestamp(),
            frame_number,
        }
    }

    /**
     * 添加修改的组件类型
     */
    pub fn add_modified_component(&mut self, component_type: ComponentType) {
        self.modified_components.insert(component_type);
    }

    /**
     * 检查是否包含指定的脏标记
     */
    pub fn has_flags(&self, flags: DirtyFlag) -> bool {
        self.flags.contains(flags)
    }

    /**
     * 更新时间戳
     */
    pub fn update_timestamp(&mut self) {
        self.timestamp = current_timestamp();
    }

    /**
     * 获取年龄（当前时间与标记时间的差值，毫秒）
     */
    pub fn age(&self) -> u64 {
        current_timestamp().saturating_sub(self.timestamp)
    }
}

/**
 * 脏标记监听器类型
 */
pub type DirtyListener = Box<dyn Fn(&DirtyData) + Send + Sync>;

/**
 * 脏标记监听器配置
 */
#[derive(Debug)]
pub struct DirtyListenerConfig {
    /// 感兴趣的标记类型
    pub flags: DirtyFlag,
    /// 监听器优先级（数字越小优先级越高）
    pub priority: i32,
    /// 监听器ID（用于移除）
    pub id: u64,
}

/**
 * 脏标记监听器条目
 */
pub struct DirtyListenerEntry {
    pub config: DirtyListenerConfig,
    pub callback: DirtyListener,
}

/**
 * 脏标记统计信息
 */
#[derive(Debug, Clone)]
pub struct DirtyTrackingStats {
    /// 当前脏实体数量
    pub dirty_entity_count: usize,
    /// 总标记次数
    pub total_markings: u64,
    /// 总清理次数
    pub total_cleanups: u64,
    /// 监听器数量
    pub listener_count: usize,
    /// 当前帧编号
    pub current_frame: u64,
    /// 平均每帧脏实体数量
    pub avg_dirty_per_frame: f64,
    /// 处理的实体总数
    pub total_processed_entities: u64,
    /// 内存使用量估算（字节）
    pub estimated_memory_usage: usize,
    /// 最大处理时间（毫秒）
    pub max_processing_time: f64,
    /// 平均处理时间（毫秒）
    pub avg_processing_time: f64,
}

impl Default for DirtyTrackingStats {
    fn default() -> Self {
        Self {
            dirty_entity_count: 0,
            total_markings: 0,
            total_cleanups: 0,
            listener_count: 0,
            current_frame: 0,
            avg_dirty_per_frame: 0.0,
            total_processed_entities: 0,
            estimated_memory_usage: 0,
            max_processing_time: 0.0,
            avg_processing_time: 0.0,
        }
    }
}

/**
 * 脏标记追踪系统
 * 
 * 提供高效的组件和实体变更追踪，避免不必要的计算和更新。
 * 支持细粒度的脏标记和批量处理机制。
 */
pub struct DirtyTrackingSystem {
    /// 脏实体映射表
    dirty_entities: FxHashMap<u32, DirtyData>,
    /// 脏标记监听器
    listeners: Vec<DirtyListenerEntry>,
    /// 下一个监听器ID
    next_listener_id: u64,
    /// 当前帧编号
    current_frame: u64,
    /// 批处理配置
    batch_size: usize,
    max_processing_time_ms: f64,
    /// 处理队列
    processing_queue: Vec<DirtyData>,
    is_processing: bool,
    /// 统计信息
    stats: DirtyTrackingStats,
    /// 帧统计累积
    frame_stats: FrameStats,
    /// 处理时间记录
    processing_times: Vec<f64>,
    max_processing_time_history: usize,
}

/**
 * 帧统计信息累积
 */
#[derive(Debug, Default)]
struct FrameStats {
    total_dirty_entities: u64,
    frame_count: u64,
    total_processing_time: f64,
}

impl DirtyTrackingSystem {
    /**
     * 创建新的脏标记追踪系统
     */
    pub fn new() -> Self {
        Self {
            dirty_entities: FxHashMap::default(),
            listeners: Vec::new(),
            next_listener_id: 1,
            current_frame: 0,
            batch_size: 100,
            max_processing_time_ms: 16.0,
            processing_queue: Vec::new(),
            is_processing: false,
            stats: DirtyTrackingStats::default(),
            frame_stats: FrameStats::default(),
            processing_times: Vec::new(),
            max_processing_time_history: 100,
        }
    }

    /**
     * 标记实体为脏状态
     */
    pub fn mark_dirty(
        &mut self, 
        entity_id: u32, 
        flags: DirtyFlag, 
        modified_components: Option<Vec<ComponentType>>
    ) {
        self.stats.total_markings += 1;
        
        let dirty_data = self.dirty_entities.entry(entity_id).or_insert_with(|| {
            DirtyData::new(entity_id, DirtyFlag(0), self.current_frame)
        });
        
        dirty_data.flags |= flags;
        dirty_data.update_timestamp();
        dirty_data.frame_number = self.current_frame;
        
        if let Some(components) = modified_components {
            for component_type in components {
                dirty_data.add_modified_component(component_type);
            }
        }

        // 克隆dirty_data以避免借用冲突
        let dirty_data_for_notify = dirty_data.clone();
        
        // 立即通知监听器
        self.notify_listeners(&dirty_data_for_notify, flags);
    }

    /**
     * 检查实体是否有指定的脏标记
     */
    pub fn is_dirty(&self, entity_id: u32, flags: DirtyFlag) -> bool {
        self.dirty_entities
            .get(&entity_id)
            .map(|data| data.has_flags(flags))
            .unwrap_or(false)
    }

    /**
     * 清除实体的脏标记
     */
    pub fn clear_dirty(&mut self, entity_id: u32, flags: DirtyFlag) {
        if let Some(dirty_data) = self.dirty_entities.get_mut(&entity_id) {
            dirty_data.flags.remove(flags);
            
            if dirty_data.flags.is_empty() {
                self.dirty_entities.remove(&entity_id);
            }
            
            self.stats.total_cleanups += 1;
        }
    }

    /**
     * 清除所有脏标记
     */
    pub fn clear_all_dirty(&mut self) {
        let count = self.dirty_entities.len();
        self.dirty_entities.clear();
        self.stats.total_cleanups += count as u64;
    }

    /**
     * 获取所有脏实体
     */
    pub fn get_dirty_entities(&self, flags: DirtyFlag) -> Vec<&DirtyData> {
        self.dirty_entities
            .values()
            .filter(|data| data.has_flags(flags))
            .collect()
    }

    /**
     * 获取脏实体数量
     */
    pub fn dirty_entity_count(&self) -> usize {
        self.dirty_entities.len()
    }

    /**
     * 获取指定标记的脏实体数量
     */
    pub fn dirty_entity_count_with_flags(&self, flags: DirtyFlag) -> usize {
        self.dirty_entities
            .values()
            .filter(|data| data.has_flags(flags))
            .count()
    }

    /**
     * 批量处理脏实体
     */
    pub fn process_dirty_entities(&mut self) {
        if self.is_processing {
            return;
        }

        self.is_processing = true;
        let start_time = current_timestamp_f64();

        // 填充处理队列
        if self.processing_queue.is_empty() {
            self.processing_queue.extend(
                self.dirty_entities.values().cloned()
            );
        }

        let mut processed = 0;
        while !self.processing_queue.is_empty() && processed < self.batch_size {
            let elapsed = current_timestamp_f64() - start_time;
            if elapsed > self.max_processing_time_ms {
                break;
            }

            if let Some(dirty_data) = self.processing_queue.pop() {
                self.process_entity(&dirty_data);
                processed += 1;
            }
        }

        // 如果处理完成，更新统计信息
        if self.processing_queue.is_empty() {
            self.is_processing = false;
            
            let processing_time = current_timestamp_f64() - start_time;
            self.record_processing_time(processing_time);
            self.stats.total_processed_entities += processed as u64;
        }
    }

    /**
     * 添加脏标记监听器
     */
    pub fn add_listener<F>(&mut self, flags: DirtyFlag, priority: i32, callback: F) -> u64
    where
        F: Fn(&DirtyData) + Send + Sync + 'static,
    {
        let listener_id = self.next_listener_id;
        self.next_listener_id += 1;

        let config = DirtyListenerConfig {
            flags,
            priority,
            id: listener_id,
        };

        let entry = DirtyListenerEntry {
            config,
            callback: Box::new(callback),
        };

        self.listeners.push(entry);
        
        // 按优先级排序
        self.listeners.sort_by_key(|entry| entry.config.priority);

        listener_id
    }

    /**
     * 移除脏标记监听器
     */
    pub fn remove_listener(&mut self, listener_id: u64) -> bool {
        if let Some(pos) = self.listeners.iter().position(|entry| entry.config.id == listener_id) {
            self.listeners.remove(pos);
            true
        } else {
            false
        }
    }

    /**
     * 开始新的帧
     */
    pub fn begin_frame(&mut self) {
        self.current_frame += 1;
        self.stats.current_frame = self.current_frame;
    }

    /**
     * 结束当前帧
     */
    pub fn end_frame(&mut self) {
        if !self.is_processing {
            self.process_dirty_entities();
        }
        
        // 更新帧统计
        self.frame_stats.total_dirty_entities += self.dirty_entities.len() as u64;
        self.frame_stats.frame_count += 1;
        
        // 更新平均值
        if self.frame_stats.frame_count > 0 {
            self.stats.avg_dirty_per_frame = 
                self.frame_stats.total_dirty_entities as f64 / self.frame_stats.frame_count as f64;
        }
    }

    /**
     * 获取统计信息
     */
    pub fn get_stats(&self) -> DirtyTrackingStats {
        let mut stats = self.stats.clone();
        stats.dirty_entity_count = self.dirty_entities.len();
        stats.listener_count = self.listeners.len();
        stats.estimated_memory_usage = self.estimate_memory_usage();
        
        // 计算平均处理时间
        if !self.processing_times.is_empty() {
            let total_time: f64 = self.processing_times.iter().sum();
            stats.avg_processing_time = total_time / self.processing_times.len() as f64;
        }
        
        stats
    }

    /**
     * 配置批量处理参数
     */
    pub fn configure_batch_processing(&mut self, batch_size: usize, max_processing_time_ms: f64) {
        self.batch_size = batch_size;
        self.max_processing_time_ms = max_processing_time_ms;
    }

    /**
     * 清空所有数据
     */
    pub fn clear(&mut self) {
        self.dirty_entities.clear();
        self.processing_queue.clear();
        self.is_processing = false;
        self.stats = DirtyTrackingStats::default();
        self.frame_stats = FrameStats::default();
        self.processing_times.clear();
    }

    /**
     * 获取老旧的脏标记（超过指定时间未更新）
     */
    pub fn get_stale_dirty_entities(&self, max_age_ms: u64) -> Vec<&DirtyData> {
        self.dirty_entities
            .values()
            .filter(|data| data.age() > max_age_ms)
            .collect()
    }

    /**
     * 清理老旧的脏标记
     */
    pub fn cleanup_stale_dirty_entities(&mut self, max_age_ms: u64) -> usize {
        let initial_count = self.dirty_entities.len();
        
        self.dirty_entities.retain(|_, data| data.age() <= max_age_ms);
        
        let removed_count = initial_count - self.dirty_entities.len();
        self.stats.total_cleanups += removed_count as u64;
        
        removed_count
    }

    // 私有方法

    /**
     * 处理单个脏实体
     */
    fn process_entity(&mut self, dirty_data: &DirtyData) {
        for entry in &self.listeners {
            if dirty_data.has_flags(entry.config.flags) {
                (entry.callback)(dirty_data);
            }
        }
        
        // 处理后清理
        self.clear_dirty(dirty_data.entity_id, DirtyFlag::ALL);
    }

    /**
     * 通知监听器
     */
    fn notify_listeners(&self, dirty_data: &DirtyData, new_flags: DirtyFlag) {
        for entry in &self.listeners {
            if new_flags.contains(entry.config.flags) {
                (entry.callback)(dirty_data);
            }
        }
    }

    /**
     * 记录处理时间
     */
    fn record_processing_time(&mut self, time: f64) {
        self.processing_times.push(time);
        
        // 保持历史记录长度限制
        if self.processing_times.len() > self.max_processing_time_history {
            self.processing_times.remove(0);
        }
        
        // 更新最大处理时间
        if time > self.stats.max_processing_time {
            self.stats.max_processing_time = time;
        }
        
        self.frame_stats.total_processing_time += time;
    }

    /**
     * 估算内存使用量
     */
    fn estimate_memory_usage(&self) -> usize {
        let dirty_entities_size = self.dirty_entities.len() * 
            (std::mem::size_of::<u32>() + std::mem::size_of::<DirtyData>());
        
        let listeners_size = self.listeners.len() * std::mem::size_of::<DirtyListenerEntry>();
        
        let processing_queue_size = self.processing_queue.len() * std::mem::size_of::<DirtyData>();
        
        let processing_times_size = self.processing_times.len() * std::mem::size_of::<f64>();
        
        dirty_entities_size + listeners_size + processing_queue_size + processing_times_size
    }
}

impl Default for DirtyTrackingSystem {
    fn default() -> Self {
        Self::new()
    }
}

// 辅助函数

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::any::TypeId;
    use std::sync::{Arc, Mutex};

    #[test]
    fn test_dirty_flag_operations() {
        let mut flags = DirtyFlag::COMPONENT_MODIFIED;
        
        assert!(flags.contains(DirtyFlag::COMPONENT_MODIFIED));
        assert!(!flags.contains(DirtyFlag::COMPONENT_ADDED));
        
        flags.add(DirtyFlag::COMPONENT_ADDED);
        assert!(flags.contains(DirtyFlag::COMPONENT_MODIFIED));
        assert!(flags.contains(DirtyFlag::COMPONENT_ADDED));
        
        flags.remove(DirtyFlag::COMPONENT_MODIFIED);
        assert!(!flags.contains(DirtyFlag::COMPONENT_MODIFIED));
        assert!(flags.contains(DirtyFlag::COMPONENT_ADDED));
        
        flags.clear();
        assert!(flags.is_empty());
    }

    #[test]
    fn test_dirty_flag_bitwise_operations() {
        let flag1 = DirtyFlag::COMPONENT_MODIFIED;
        let flag2 = DirtyFlag::COMPONENT_ADDED;
        
        let combined = flag1 | flag2;
        assert!(combined.contains(DirtyFlag::COMPONENT_MODIFIED));
        assert!(combined.contains(DirtyFlag::COMPONENT_ADDED));
        
        let intersection = combined & DirtyFlag::COMPONENT_MODIFIED;
        assert!(intersection.contains(DirtyFlag::COMPONENT_MODIFIED));
        assert!(!intersection.contains(DirtyFlag::COMPONENT_ADDED));
    }

    #[test]
    fn test_dirty_data_creation() {
        let entity_id = 123;
        let flags = DirtyFlag::TRANSFORM_CHANGED;
        let frame_number = 42;
        
        let dirty_data = DirtyData::new(entity_id, flags, frame_number);
        
        assert_eq!(dirty_data.entity_id, entity_id);
        assert!(dirty_data.has_flags(flags));
        assert_eq!(dirty_data.frame_number, frame_number);
        assert!(dirty_data.modified_components.is_empty());
    }

    #[test]
    fn test_dirty_data_component_tracking() {
        let mut dirty_data = DirtyData::new(1, DirtyFlag::COMPONENT_MODIFIED, 0);
        let component_type = TypeId::of::<String>();
        
        dirty_data.add_modified_component(component_type);
        assert!(dirty_data.modified_components.contains(&component_type));
    }

    #[test]
    fn test_dirty_tracking_basic() {
        let mut system = DirtyTrackingSystem::new();
        let entity_id = 1;
        let flags = DirtyFlag::COMPONENT_MODIFIED;
        
        // 标记实体为脏状态
        system.mark_dirty(entity_id, flags, None);
        
        assert!(system.is_dirty(entity_id, flags));
        assert!(!system.is_dirty(entity_id, DirtyFlag::COMPONENT_ADDED));
        assert_eq!(system.dirty_entity_count(), 1);
        
        // 清除脏标记
        system.clear_dirty(entity_id, flags);
        assert!(!system.is_dirty(entity_id, flags));
        assert_eq!(system.dirty_entity_count(), 0);
    }

    #[test]
    fn test_dirty_tracking_multiple_flags() {
        let mut system = DirtyTrackingSystem::new();
        let entity_id = 1;
        
        // 标记多个类型的脏状态
        system.mark_dirty(entity_id, DirtyFlag::COMPONENT_MODIFIED, None);
        system.mark_dirty(entity_id, DirtyFlag::TRANSFORM_CHANGED, None);
        
        assert!(system.is_dirty(entity_id, DirtyFlag::COMPONENT_MODIFIED));
        assert!(system.is_dirty(entity_id, DirtyFlag::TRANSFORM_CHANGED));
        assert!(system.is_dirty(entity_id, DirtyFlag::COMPONENT_MODIFIED | DirtyFlag::TRANSFORM_CHANGED));
        
        // 部分清除
        system.clear_dirty(entity_id, DirtyFlag::COMPONENT_MODIFIED);
        assert!(!system.is_dirty(entity_id, DirtyFlag::COMPONENT_MODIFIED));
        assert!(system.is_dirty(entity_id, DirtyFlag::TRANSFORM_CHANGED));
        
        // 全部清除
        system.clear_dirty(entity_id, DirtyFlag::ALL);
        assert!(!system.is_dirty(entity_id, DirtyFlag::TRANSFORM_CHANGED));
    }

    #[test]
    fn test_dirty_tracking_listener() {
        let mut system = DirtyTrackingSystem::new();
        let entity_id = 1;
        
        // 使用Arc<Mutex>来在闭包中共享状态
        let callback_count = Arc::new(Mutex::new(0));
        let callback_count_clone = Arc::clone(&callback_count);
        
        // 添加监听器
        let listener_id = system.add_listener(
            DirtyFlag::COMPONENT_MODIFIED,
            0,
            move |_data| {
                *callback_count_clone.lock().unwrap() += 1;
            }
        );
        
        // 标记脏状态应该触发监听器
        system.mark_dirty(entity_id, DirtyFlag::COMPONENT_MODIFIED, None);
        assert_eq!(*callback_count.lock().unwrap(), 1);
        
        // 标记其他类型的脏状态不应该触发监听器
        system.mark_dirty(entity_id, DirtyFlag::TRANSFORM_CHANGED, None);
        assert_eq!(*callback_count.lock().unwrap(), 1);
        
        // 移除监听器
        assert!(system.remove_listener(listener_id));
        
        // 再次标记脏状态不应该触发监听器
        system.mark_dirty(entity_id, DirtyFlag::COMPONENT_MODIFIED, None);
        assert_eq!(*callback_count.lock().unwrap(), 1);
    }

    #[test]
    fn test_dirty_tracking_filtering() {
        let mut system = DirtyTrackingSystem::new();
        
        system.mark_dirty(1, DirtyFlag::COMPONENT_MODIFIED, None);
        system.mark_dirty(2, DirtyFlag::TRANSFORM_CHANGED, None);
        system.mark_dirty(3, DirtyFlag::COMPONENT_MODIFIED | DirtyFlag::TRANSFORM_CHANGED, None);
        
        // 获取包含组件修改标记的实体
        let component_modified = system.get_dirty_entities(DirtyFlag::COMPONENT_MODIFIED);
        assert_eq!(component_modified.len(), 2); // 实体1和3
        
        // 获取包含变换修改标记的实体
        let transform_changed = system.get_dirty_entities(DirtyFlag::TRANSFORM_CHANGED);
        assert_eq!(transform_changed.len(), 2); // 实体2和3
        
        // 获取包含两种标记的实体
        let both_flags = system.get_dirty_entities(DirtyFlag::COMPONENT_MODIFIED | DirtyFlag::TRANSFORM_CHANGED);
        assert_eq!(both_flags.len(), 3); // 所有实体
    }

    #[test]
    fn test_dirty_tracking_stats() {
        let mut system = DirtyTrackingSystem::new();
        
        system.mark_dirty(1, DirtyFlag::COMPONENT_MODIFIED, None);
        system.mark_dirty(2, DirtyFlag::TRANSFORM_CHANGED, None);
        system.clear_dirty(1, DirtyFlag::ALL);
        
        let stats = system.get_stats();
        assert_eq!(stats.total_markings, 2);
        assert_eq!(stats.total_cleanups, 1);
        assert_eq!(stats.dirty_entity_count, 1);
    }

    #[test]
    fn test_dirty_tracking_stale_cleanup() {
        let mut system = DirtyTrackingSystem::new();
        
        system.mark_dirty(1, DirtyFlag::COMPONENT_MODIFIED, None);
        system.mark_dirty(2, DirtyFlag::TRANSFORM_CHANGED, None);
        
        // 等待一小段时间让标记变老
        std::thread::sleep(std::time::Duration::from_millis(10));
        
        // 清理超过5毫秒的老标记
        let removed_count = system.cleanup_stale_dirty_entities(5);
        assert_eq!(removed_count, 2);
        assert_eq!(system.dirty_entity_count(), 0);
    }

    #[test]
    fn test_dirty_tracking_frame_management() {
        let mut system = DirtyTrackingSystem::new();
        
        system.begin_frame();
        assert_eq!(system.get_stats().current_frame, 1);
        
        system.mark_dirty(1, DirtyFlag::COMPONENT_MODIFIED, None);
        system.end_frame();
        
        let stats = system.get_stats();
        assert_eq!(stats.current_frame, 1);
    }

    #[test]
    fn test_dirty_tracking_batch_configuration() {
        let mut system = DirtyTrackingSystem::new();
        
        system.configure_batch_processing(50, 8.0);
        assert_eq!(system.batch_size, 50);
        assert_eq!(system.max_processing_time_ms, 8.0);
    }

    #[test]
    fn test_dirty_tracking_clear() {
        let mut system = DirtyTrackingSystem::new();
        
        system.mark_dirty(1, DirtyFlag::COMPONENT_MODIFIED, None);
        system.mark_dirty(2, DirtyFlag::TRANSFORM_CHANGED, None);
        
        let _listener_id = system.add_listener(DirtyFlag::ALL, 0, |_| {});
        
        assert_eq!(system.dirty_entity_count(), 2);
        assert_eq!(system.listeners.len(), 1);
        
        system.clear();
        
        assert_eq!(system.dirty_entity_count(), 0);
        // 注意：clear()不会清除监听器
        assert_eq!(system.listeners.len(), 1);
        assert_eq!(system.get_stats().total_markings, 0);
    }
}