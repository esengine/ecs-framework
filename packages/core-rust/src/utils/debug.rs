use rustc_hash::FxHashMap;
use serde::{Serialize, Deserialize};

/**
 * Debug数据类型
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugEntityData {
    pub entity_id: u32,
    pub name: String,
    pub enabled: bool,
    pub component_count: usize,
    pub components: Vec<DebugComponentInfo>,
    pub memory_usage: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugComponentInfo {
    pub type_name: String,
    pub enabled: bool,
    pub memory_size: usize,
    pub properties: FxHashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugSystemInfo {
    pub name: String,
    pub enabled: bool,
    pub priority: i32,
    pub execution_time_ms: f64,
    pub entity_count: usize,
    pub update_frequency: f64,
    pub last_execution: u64,
    pub total_executions: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugArchetypeInfo {
    pub signature: String,
    pub entity_count: usize,
    pub component_types: Vec<String>,
    pub memory_usage: usize,
    pub entities: Vec<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugPerformanceInfo {
    pub fps: f64,
    pub frame_time_ms: f64,
    pub delta_time_ms: f64,
    pub memory_usage_bytes: usize,
    pub total_entities: usize,
    pub total_systems: usize,
    pub total_components: usize,
    pub warnings: Vec<DebugWarning>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugWarning {
    pub level: WarningLevel,
    pub message: String,
    pub timestamp: u64,
    pub source: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum WarningLevel {
    Info,
    Warning,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugStats {
    pub total_memory: usize,
    pub entity_memory: usize,
    pub component_memory: usize,
    pub system_memory: usize,
    pub pool_memory: usize,
}

/**
 * 实体数据收集器
 * 负责收集和格式化实体相关的调试信息
 */
pub struct EntityDataCollector {
    entity_cache: FxHashMap<u32, DebugEntityData>,
    last_update_time: u64,
    cache_duration: u64,
}

impl EntityDataCollector {
    /**
     * 创建新的实体数据收集器
     */
    pub fn new() -> Self {
        Self {
            entity_cache: FxHashMap::default(),
            last_update_time: 0,
            cache_duration: 1000, // 1秒缓存
        }
    }

    /**
     * 收集所有实体的调试数据
     */
    pub fn collect_entity_data(&mut self) -> Vec<DebugEntityData> {
        let current_time = current_timestamp();
        
        // 如果缓存仍然有效，直接返回
        if current_time - self.last_update_time < self.cache_duration && !self.entity_cache.is_empty() {
            return self.entity_cache.values().cloned().collect();
        }

        // 重新收集数据
        self.refresh_entity_cache();
        self.last_update_time = current_time;
        
        self.entity_cache.values().cloned().collect()
    }

    /**
     * 获取指定实体的详细信息
     */
    pub fn get_entity_details(&self, entity_id: u32) -> Option<DebugEntityData> {
        self.entity_cache.get(&entity_id).cloned()
    }

    /**
     * 计算实体内存使用
     */
    pub fn calculate_entity_memory_usage(&self, entity_id: u32) -> usize {
        if let Some(entity_data) = self.entity_cache.get(&entity_id) {
            entity_data.memory_usage
        } else {
            std::mem::size_of::<u32>() * 2 // 基本实体开销
        }
    }

    /**
     * 刷新实体缓存
     */
    fn refresh_entity_cache(&mut self) {
        self.entity_cache.clear();
        
        // 模拟收集实体数据（在实际实现中会从Scene中获取）
        // TODO: 从实际的Scene和EntityManager中获取数据
        
        // 示例数据
        for i in 1..=10 {
            let entity_data = DebugEntityData {
                entity_id: i,
                name: format!("Entity_{}", i),
                enabled: true,
                component_count: ((i % 3) + 1) as usize,
                components: vec![
                    DebugComponentInfo {
                        type_name: "Transform".to_string(),
                        enabled: true,
                        memory_size: 48,
                        properties: {
                            let mut props = FxHashMap::default();
                            props.insert("x".to_string(), "0.0".to_string());
                            props.insert("y".to_string(), "0.0".to_string());
                            props.insert("rotation".to_string(), "0.0".to_string());
                            props
                        },
                    }
                ],
                memory_usage: 64 + (48 * ((i % 3) + 1) as usize),
            };
            
            self.entity_cache.insert(i, entity_data);
        }
    }

    /**
     * 获取实体数量统计
     */
    pub fn get_entity_count_stats(&self) -> (usize, usize) {
        let total = self.entity_cache.len();
        let active = self.entity_cache.values().filter(|e| e.enabled).count();
        (total, active)
    }

    /**
     * 按组件数量排序实体
     */
    pub fn get_entities_by_component_count(&self) -> Vec<DebugEntityData> {
        let mut entities: Vec<_> = self.entity_cache.values().cloned().collect();
        entities.sort_by(|a, b| b.component_count.cmp(&a.component_count));
        entities
    }

    /**
     * 清空缓存
     */
    pub fn clear_cache(&mut self) {
        self.entity_cache.clear();
        self.last_update_time = 0;
    }
}

/**
 * 系统数据收集器
 * 负责收集和格式化系统相关的调试信息
 */
pub struct SystemDataCollector {
    system_stats: FxHashMap<String, DebugSystemInfo>,
    execution_history: FxHashMap<String, Vec<f64>>,
    history_size: usize,
}

impl SystemDataCollector {
    /**
     * 创建新的系统数据收集器
     */
    pub fn new() -> Self {
        Self {
            system_stats: FxHashMap::default(),
            execution_history: FxHashMap::default(),
            history_size: 60, // 保持60帧的历史记录
        }
    }

    /**
     * 收集所有系统的调试数据
     */
    pub fn collect_system_data(&mut self) -> Vec<DebugSystemInfo> {
        // TODO: 从实际的SystemManager中获取数据
        // 这里是示例数据
        
        let system_names = vec!["RenderSystem", "PhysicsSystem", "InputSystem", "AudioSystem"];
        
        for (i, name) in system_names.iter().enumerate() {
            let execution_time = 1.0 + (i as f64 * 0.5); // 模拟执行时间
            
            let system_info = DebugSystemInfo {
                name: name.to_string(),
                enabled: true,
                priority: i as i32,
                execution_time_ms: execution_time,
                entity_count: (i + 1) * 10,
                update_frequency: 60.0,
                last_execution: current_timestamp(),
                total_executions: 1000 + (i as u64 * 100),
            };
            
            self.system_stats.insert(name.to_string(), system_info);
            self.update_execution_history(name, execution_time);
        }
        
        self.system_stats.values().cloned().collect()
    }

    /**
     * 记录系统执行时间
     */
    pub fn record_system_execution(&mut self, system_name: &str, execution_time_ms: f64) {
        self.update_execution_history(system_name, execution_time_ms);
        
        // 如果系统信息不存在，创建一个默认的
        let system_info = self.system_stats.entry(system_name.to_string()).or_insert_with(|| {
            DebugSystemInfo {
                name: system_name.to_string(),
                enabled: true,
                priority: 0,
                execution_time_ms: 0.0,
                entity_count: 0,
                update_frequency: 60.0,
                last_execution: 0,
                total_executions: 0,
            }
        });
        
        system_info.execution_time_ms = execution_time_ms;
        system_info.last_execution = current_timestamp();
        system_info.total_executions += 1;
    }

    /**
     * 获取系统性能统计
     */
    pub fn get_system_performance(&self, system_name: &str) -> Option<(f64, f64, f64)> {
        if let Some(history) = self.execution_history.get(system_name) {
            if history.is_empty() {
                return None;
            }
            
            let average = history.iter().sum::<f64>() / history.len() as f64;
            let min = history.iter().cloned().fold(f64::INFINITY, f64::min);
            let max = history.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
            
            Some((average, min, max))
        } else {
            None
        }
    }

    /**
     * 更新执行历史
     */
    fn update_execution_history(&mut self, system_name: &str, execution_time: f64) {
        let history = self.execution_history.entry(system_name.to_string()).or_insert_with(Vec::new);
        
        history.push(execution_time);
        
        // 保持历史大小限制
        if history.len() > self.history_size {
            history.remove(0);
        }
    }

    /**
     * 获取最慢的系统
     */
    pub fn get_slowest_systems(&self, count: usize) -> Vec<DebugSystemInfo> {
        let mut systems: Vec<_> = self.system_stats.values().cloned().collect();
        systems.sort_by(|a, b| b.execution_time_ms.partial_cmp(&a.execution_time_ms).unwrap());
        systems.into_iter().take(count).collect()
    }

    /**
     * 清空统计数据
     */
    pub fn clear_stats(&mut self) {
        self.system_stats.clear();
        self.execution_history.clear();
    }
}

/**
 * 组件数据收集器
 * 负责收集和格式化组件相关的调试信息
 */
pub struct ComponentDataCollector {
    component_stats: FxHashMap<String, ComponentTypeStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentTypeStats {
    pub type_name: String,
    pub instance_count: usize,
    pub total_memory: usize,
    pub average_memory: usize,
    pub enabled_count: usize,
}

impl ComponentDataCollector {
    /**
     * 创建新的组件数据收集器
     */
    pub fn new() -> Self {
        Self {
            component_stats: FxHashMap::default(),
        }
    }

    /**
     * 收集组件类型统计
     */
    pub fn collect_component_stats(&mut self) -> Vec<ComponentTypeStats> {
        self.component_stats.clear();
        
        // TODO: 从实际的ComponentRegistry中获取数据
        // 这里是示例数据
        
        let component_types = vec![
            ("Transform", 100, 48),
            ("Renderer", 50, 128),
            ("Physics", 30, 256),
            ("Audio", 20, 64),
        ];
        
        for (type_name, count, memory_per_instance) in component_types {
            let stats = ComponentTypeStats {
                type_name: type_name.to_string(),
                instance_count: count,
                total_memory: count * memory_per_instance,
                average_memory: memory_per_instance,
                enabled_count: count - (count / 10), // 90%启用
            };
            
            self.component_stats.insert(type_name.to_string(), stats);
        }
        
        self.component_stats.values().cloned().collect()
    }

    /**
     * 获取指定类型的组件统计
     */
    pub fn get_component_type_stats(&self, type_name: &str) -> Option<ComponentTypeStats> {
        self.component_stats.get(type_name).cloned()
    }

    /**
     * 计算总内存使用
     */
    pub fn get_total_component_memory(&self) -> usize {
        self.component_stats.values().map(|s| s.total_memory).sum()
    }

    /**
     * 获取最消耗内存的组件类型
     */
    pub fn get_memory_intensive_components(&self, count: usize) -> Vec<ComponentTypeStats> {
        let mut components: Vec<_> = self.component_stats.values().cloned().collect();
        components.sort_by(|a, b| b.total_memory.cmp(&a.total_memory));
        components.into_iter().take(count).collect()
    }
}

/**
 * 性能数据收集器
 * 负责收集和格式化性能相关的调试信息
 */
pub struct PerformanceDataCollector {
    frame_times: Vec<f64>,
    fps_history: Vec<f64>,
    warnings: Vec<DebugWarning>,
    max_history_size: usize,
}

impl PerformanceDataCollector {
    /**
     * 创建新的性能数据收集器
     */
    pub fn new() -> Self {
        Self {
            frame_times: Vec::new(),
            fps_history: Vec::new(),
            warnings: Vec::new(),
            max_history_size: 60,
        }
    }

    /**
     * 记录帧时间
     */
    pub fn record_frame_time(&mut self, frame_time_ms: f64) {
        self.frame_times.push(frame_time_ms);
        
        if self.frame_times.len() > self.max_history_size {
            self.frame_times.remove(0);
        }

        // 计算FPS
        if frame_time_ms > 0.0 {
            let fps = 1000.0 / frame_time_ms;
            self.fps_history.push(fps);
            
            if self.fps_history.len() > self.max_history_size {
                self.fps_history.remove(0);
            }
        }

        // 检查性能警告
        self.check_performance_warnings(frame_time_ms);
    }

    /**
     * 获取性能信息
     */
    pub fn get_performance_info(&self) -> DebugPerformanceInfo {
        let current_fps = self.fps_history.last().copied().unwrap_or(0.0);
        let current_frame_time = self.frame_times.last().copied().unwrap_or(0.0);
        
        DebugPerformanceInfo {
            fps: current_fps,
            frame_time_ms: current_frame_time,
            delta_time_ms: current_frame_time,
            memory_usage_bytes: self.estimate_memory_usage(),
            total_entities: 0, // TODO: 从EntityManager获取
            total_systems: 0,  // TODO: 从SystemManager获取
            total_components: 0, // TODO: 从ComponentRegistry获取
            warnings: self.warnings.clone(),
        }
    }

    /**
     * 添加警告
     */
    pub fn add_warning(&mut self, level: WarningLevel, message: String, source: String) {
        let warning = DebugWarning {
            level,
            message,
            timestamp: current_timestamp(),
            source,
        };
        
        self.warnings.push(warning);
        
        // 限制警告数量
        if self.warnings.len() > 100 {
            self.warnings.remove(0);
        }
    }

    /**
     * 获取平均FPS
     */
    pub fn get_average_fps(&self) -> f64 {
        if self.fps_history.is_empty() {
            0.0
        } else {
            self.fps_history.iter().sum::<f64>() / self.fps_history.len() as f64
        }
    }

    /**
     * 检查性能警告
     */
    fn check_performance_warnings(&mut self, frame_time_ms: f64) {
        // 低FPS警告
        if frame_time_ms > 33.33 { // 低于30FPS
            self.add_warning(
                WarningLevel::Warning,
                format!("低FPS检测: {:.1}ms (约{:.1} FPS)", frame_time_ms, 1000.0 / frame_time_ms),
                "PerformanceMonitor".to_string(),
            );
        }
        
        // 严重性能问题
        if frame_time_ms > 66.66 { // 低于15FPS
            self.add_warning(
                WarningLevel::Error,
                format!("严重性能问题: {:.1}ms (约{:.1} FPS)", frame_time_ms, 1000.0 / frame_time_ms),
                "PerformanceMonitor".to_string(),
            );
        }
    }

    /**
     * 估算内存使用
     */
    fn estimate_memory_usage(&self) -> usize {
        // 简单的内存使用估算
        let base_memory = 1024 * 1024; // 1MB基础内存
        let history_memory = (self.frame_times.len() + self.fps_history.len()) * 8; // 每个f64 8字节
        let warnings_memory = self.warnings.len() * 256; // 每个警告估算256字节
        
        base_memory + history_memory + warnings_memory
    }

    /**
     * 清空历史数据
     */
    pub fn clear_history(&mut self) {
        self.frame_times.clear();
        self.fps_history.clear();
        self.warnings.clear();
    }
}

/**
 * 调试管理器
 * 整合所有调试数据收集器
 */
pub struct DebugManager {
    entity_collector: EntityDataCollector,
    system_collector: SystemDataCollector,
    component_collector: ComponentDataCollector,
    performance_collector: PerformanceDataCollector,
    enabled: bool,
}

impl DebugManager {
    /**
     * 创建新的调试管理器
     */
    pub fn new() -> Self {
        Self {
            entity_collector: EntityDataCollector::new(),
            system_collector: SystemDataCollector::new(),
            component_collector: ComponentDataCollector::new(),
            performance_collector: PerformanceDataCollector::new(),
            enabled: false,
        }
    }

    /**
     * 启用调试模式
     */
    pub fn enable(&mut self) {
        self.enabled = true;
    }

    /**
     * 禁用调试模式
     */
    pub fn disable(&mut self) {
        self.enabled = false;
    }

    /**
     * 检查调试模式是否启用
     */
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /**
     * 更新调试数据（每帧调用）
     */
    pub fn update(&mut self, delta_time_ms: f64) {
        if !self.enabled {
            return;
        }

        // 记录性能数据
        self.performance_collector.record_frame_time(delta_time_ms);
    }

    /**
     * 获取所有调试数据
     */
    pub fn get_debug_data(&mut self) -> DebugData {
        if !self.enabled {
            return DebugData::empty();
        }

        DebugData {
            entities: self.entity_collector.collect_entity_data(),
            systems: self.system_collector.collect_system_data(),
            components: self.component_collector.collect_component_stats(),
            performance: self.performance_collector.get_performance_info(),
            stats: self.calculate_debug_stats(),
        }
    }

    /**
     * 获取实体数据收集器的可变引用
     */
    pub fn get_entity_collector_mut(&mut self) -> &mut EntityDataCollector {
        &mut self.entity_collector
    }

    /**
     * 获取系统数据收集器的可变引用
     */
    pub fn get_system_collector_mut(&mut self) -> &mut SystemDataCollector {
        &mut self.system_collector
    }

    /**
     * 获取组件数据收集器的可变引用
     */
    pub fn get_component_collector_mut(&mut self) -> &mut ComponentDataCollector {
        &mut self.component_collector
    }

    /**
     * 获取性能数据收集器的可变引用
     */
    pub fn get_performance_collector_mut(&mut self) -> &mut PerformanceDataCollector {
        &mut self.performance_collector
    }

    /**
     * 记录系统执行
     */
    pub fn record_system_execution(&mut self, system_name: &str, execution_time_ms: f64) {
        if self.enabled {
            self.system_collector.record_system_execution(system_name, execution_time_ms);
        }
    }

    /**
     * 添加性能警告
     */
    pub fn add_warning(&mut self, level: WarningLevel, message: String, source: String) {
        if self.enabled {
            self.performance_collector.add_warning(level, message, source);
        }
    }

    /**
     * 计算调试统计信息
     */
    fn calculate_debug_stats(&self) -> DebugStats {
        let entity_memory = self.entity_collector.entity_cache.len() * 64; // 估算
        let component_memory = self.component_collector.get_total_component_memory();
        let system_memory = self.system_collector.system_stats.len() * 256; // 估算
        let performance_memory = self.performance_collector.estimate_memory_usage();
        
        DebugStats {
            total_memory: entity_memory + component_memory + system_memory + performance_memory,
            entity_memory,
            component_memory,
            system_memory,
            pool_memory: 0, // TODO: 从PoolManager获取
        }
    }

    /**
     * 清空所有调试数据
     */
    pub fn clear_all_data(&mut self) {
        self.entity_collector.clear_cache();
        self.system_collector.clear_stats();
        self.performance_collector.clear_history();
    }

    /**
     * 获取调试统计的格式化字符串
     */
    pub fn get_debug_stats_string(&mut self) -> String {
        if !self.enabled {
            return "Debug mode disabled".to_string();
        }

        let data = self.get_debug_data();
        let mut lines = vec![
            "=== ECS Debug Statistics ===".to_string(),
            "".to_string(),
        ];

        // 性能信息
        lines.push(format!("Performance:"));
        lines.push(format!("  FPS: {:.1}", data.performance.fps));
        lines.push(format!("  Frame Time: {:.2}ms", data.performance.frame_time_ms));
        lines.push(format!("  Memory: {:.1} KB", data.stats.total_memory as f64 / 1024.0));
        lines.push("".to_string());

        // 实体信息
        lines.push(format!("Entities: {}", data.entities.len()));
        let active_entities = data.entities.iter().filter(|e| e.enabled).count();
        lines.push(format!("  Active: {}", active_entities));
        lines.push(format!("  Entity Memory: {:.1} KB", data.stats.entity_memory as f64 / 1024.0));
        lines.push("".to_string());

        // 系统信息
        lines.push(format!("Systems: {}", data.systems.len()));
        let enabled_systems = data.systems.iter().filter(|s| s.enabled).count();
        lines.push(format!("  Enabled: {}", enabled_systems));
        if let Some(slowest) = data.systems.iter().max_by(|a, b| a.execution_time_ms.partial_cmp(&b.execution_time_ms).unwrap()) {
            lines.push(format!("  Slowest: {} ({:.2}ms)", slowest.name, slowest.execution_time_ms));
        }
        lines.push("".to_string());

        // 组件信息
        lines.push(format!("Components: {} types", data.components.len()));
        lines.push(format!("  Component Memory: {:.1} KB", data.stats.component_memory as f64 / 1024.0));
        lines.push("".to_string());

        // 警告信息
        let warning_count = data.performance.warnings.len();
        if warning_count > 0 {
            lines.push(format!("Warnings: {}", warning_count));
            for warning in data.performance.warnings.iter().take(3) {
                lines.push(format!("  [{:?}] {}", warning.level, warning.message));
            }
            if warning_count > 3 {
                lines.push(format!("  ... and {} more", warning_count - 3));
            }
        }

        lines.join("\n")
    }
}

/**
 * 完整的调试数据结构
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugData {
    pub entities: Vec<DebugEntityData>,
    pub systems: Vec<DebugSystemInfo>,
    pub components: Vec<ComponentTypeStats>,
    pub performance: DebugPerformanceInfo,
    pub stats: DebugStats,
}

impl DebugData {
    /**
     * 创建空的调试数据
     */
    pub fn empty() -> Self {
        Self {
            entities: Vec::new(),
            systems: Vec::new(),
            components: Vec::new(),
            performance: DebugPerformanceInfo {
                fps: 0.0,
                frame_time_ms: 0.0,
                delta_time_ms: 0.0,
                memory_usage_bytes: 0,
                total_entities: 0,
                total_systems: 0,
                total_components: 0,
                warnings: Vec::new(),
            },
            stats: DebugStats {
                total_memory: 0,
                entity_memory: 0,
                component_memory: 0,
                system_memory: 0,
                pool_memory: 0,
            },
        }
    }
}

impl Default for EntityDataCollector {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for SystemDataCollector {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for ComponentDataCollector {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for PerformanceDataCollector {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for DebugManager {
    fn default() -> Self {
        Self::new()
    }
}

// 辅助函数
fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_entity_data_collector_creation() {
        let collector = EntityDataCollector::new();
        assert_eq!(collector.entity_cache.len(), 0);
        assert_eq!(collector.last_update_time, 0);
        assert_eq!(collector.cache_duration, 1000);
    }

    #[test]
    fn test_entity_data_collection() {
        let mut collector = EntityDataCollector::new();
        let entities = collector.collect_entity_data();
        
        assert!(!entities.is_empty());
        let (total, active) = collector.get_entity_count_stats();
        assert_eq!(total, entities.len());
        assert!(active <= total);
    }

    #[test]
    fn test_system_data_collector_creation() {
        let collector = SystemDataCollector::new();
        assert_eq!(collector.system_stats.len(), 0);
        assert_eq!(collector.execution_history.len(), 0);
        assert_eq!(collector.history_size, 60);
    }

    #[test]
    fn test_system_data_collection() {
        let mut collector = SystemDataCollector::new();
        let systems = collector.collect_system_data();
        
        assert!(!systems.is_empty());
        
        // 测试性能记录
        collector.record_system_execution("TestSystem", 5.5);
        let performance = collector.get_system_performance("TestSystem");
        assert!(performance.is_some());
    }

    #[test]
    fn test_component_data_collector() {
        let mut collector = ComponentDataCollector::new();
        let components = collector.collect_component_stats();
        
        assert!(!components.is_empty());
        
        let total_memory = collector.get_total_component_memory();
        assert!(total_memory > 0);
        
        let memory_intensive = collector.get_memory_intensive_components(2);
        assert!(memory_intensive.len() <= 2);
    }

    #[test]
    fn test_performance_data_collector() {
        let mut collector = PerformanceDataCollector::new();
        
        // 记录一些帧时间
        collector.record_frame_time(16.67); // 60 FPS
        collector.record_frame_time(33.33); // 30 FPS
        collector.record_frame_time(50.0);  // 20 FPS
        
        let performance_info = collector.get_performance_info();
        assert!(performance_info.fps > 0.0);
        assert!(performance_info.frame_time_ms > 0.0);
        
        let avg_fps = collector.get_average_fps();
        assert!(avg_fps > 0.0);
        
        // 应该有性能警告
        assert!(!performance_info.warnings.is_empty());
    }

    #[test]
    fn test_debug_manager() {
        let mut manager = DebugManager::new();
        assert!(!manager.enabled());
        
        manager.enable();
        assert!(manager.enabled());
        
        // 更新调试数据
        manager.update(16.67);
        
        let debug_data = manager.get_debug_data();
        assert!(!debug_data.entities.is_empty());
        assert!(!debug_data.systems.is_empty());
        
        // 记录系统执行
        manager.record_system_execution("TestSystem", 2.5);
        
        // 添加警告
        manager.add_warning(
            WarningLevel::Warning,
            "Test warning".to_string(),
            "TestModule".to_string(),
        );
        
        let stats_string = manager.get_debug_stats_string();
        assert!(stats_string.contains("ECS Debug Statistics"));
        
        manager.clear_all_data();
        manager.disable();
        assert!(!manager.enabled());
    }

    #[test]
    fn test_debug_data_serialization() {
        let debug_data = DebugData::empty();
        
        // 测试序列化
        let json = serde_json::to_string(&debug_data);
        assert!(json.is_ok());
        
        // 测试反序列化
        let json_str = json.unwrap();
        let deserialized: Result<DebugData, _> = serde_json::from_str(&json_str);
        assert!(deserialized.is_ok());
    }

    #[test]
    fn test_warning_levels() {
        let mut collector = PerformanceDataCollector::new();
        
        collector.add_warning(
            WarningLevel::Info,
            "Info message".to_string(),
            "Test".to_string(),
        );
        
        collector.add_warning(
            WarningLevel::Warning,
            "Warning message".to_string(),
            "Test".to_string(),
        );
        
        collector.add_warning(
            WarningLevel::Error,
            "Error message".to_string(),
            "Test".to_string(),
        );
        
        let performance_info = collector.get_performance_info();
        assert_eq!(performance_info.warnings.len(), 3);
        
        let warning_levels: Vec<_> = performance_info.warnings.iter().map(|w| w.level).collect();
        assert!(warning_levels.contains(&WarningLevel::Info));
        assert!(warning_levels.contains(&WarningLevel::Warning));
        assert!(warning_levels.contains(&WarningLevel::Error));
    }

    #[test]
    fn test_memory_calculations() {
        let mut collector = EntityDataCollector::new();
        let entities = collector.collect_entity_data();
        
        for entity in &entities {
            let memory = collector.calculate_entity_memory_usage(entity.entity_id);
            assert!(memory > 0);
            assert_eq!(memory, entity.memory_usage);
        }
    }

    #[test]
    fn test_system_performance_tracking() {
        let mut collector = SystemDataCollector::new();
        let system_name = "TestSystem";
        
        // 记录多次执行时间
        let execution_times = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        for time in &execution_times {
            collector.record_system_execution(system_name, *time);
        }
        
        let performance = collector.get_system_performance(system_name);
        assert!(performance.is_some());
        
        let (avg, min, max) = performance.unwrap();
        assert_eq!(avg, 3.0); // 平均值
        assert_eq!(min, 1.0); // 最小值
        assert_eq!(max, 5.0); // 最大值
        
        let slowest = collector.get_slowest_systems(1);
        assert_eq!(slowest.len(), 1);
        assert_eq!(slowest[0].name, system_name);
        assert_eq!(slowest[0].execution_time_ms, 5.0);
    }

    #[test]
    fn test_cache_behavior() {
        let mut collector = EntityDataCollector::new();
        
        // 第一次收集数据
        let entities1 = collector.collect_entity_data();
        let cache_time1 = collector.last_update_time;
        
        // 立即再次收集，应该使用缓存
        let entities2 = collector.collect_entity_data();
        let cache_time2 = collector.last_update_time;
        
        assert_eq!(cache_time1, cache_time2); // 缓存时间应该相同
        assert_eq!(entities1.len(), entities2.len());
        
        // 清空缓存后再次收集
        collector.clear_cache();
        // 添加微小延迟确保时间戳不同
        std::thread::sleep(std::time::Duration::from_millis(1));
        let _entities3 = collector.collect_entity_data();
        let cache_time3 = collector.last_update_time;
        
        assert!(cache_time3 >= cache_time2); // 应该更新缓存时间（使用>=避免时间精度问题）
    }
}