use rustc_hash::FxHashMap;
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use std::collections::VecDeque;

/**
 * 性能数据
 */
#[derive(Debug, Clone)]
pub struct PerformanceData {
    /// 系统名称
    pub name: String,
    /// 执行时间（毫秒）
    pub execution_time: f64,
    /// 处理的实体数量
    pub entity_count: usize,
    /// 平均每个实体的处理时间
    pub average_time_per_entity: f64,
    /// 最后更新时间戳
    pub last_update_time: u64,
    /// 内存使用量（字节）
    pub memory_usage: Option<usize>,
    /// CPU使用率（百分比）
    pub cpu_usage: Option<f64>,
}

/**
 * 性能统计信息
 */
#[derive(Debug, Clone)]
pub struct PerformanceStats {
    /// 总执行时间
    pub total_time: f64,
    /// 平均执行时间
    pub average_time: f64,
    /// 最小执行时间
    pub min_time: f64,
    /// 最大执行时间
    pub max_time: f64,
    /// 执行次数
    pub execution_count: u64,
    /// 最近的执行时间列表
    pub recent_times: VecDeque<f64>,
    /// 标准差
    pub standard_deviation: f64,
    /// 95百分位数
    pub percentile_95: f64,
    /// 99百分位数
    pub percentile_99: f64,
}

impl Default for PerformanceStats {
    fn default() -> Self {
        Self {
            total_time: 0.0,
            average_time: 0.0,
            min_time: f64::MAX,
            max_time: 0.0,
            execution_count: 0,
            recent_times: VecDeque::new(),
            standard_deviation: 0.0,
            percentile_95: 0.0,
            percentile_99: 0.0,
        }
    }
}

/**
 * 性能警告类型
 */
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PerformanceWarningType {
    HighExecutionTime,
    HighMemoryUsage,
    HighCpuUsage,
    FrequentGc,
    LowFps,
    HighEntityCount,
}

/**
 * 性能警告
 */
#[derive(Debug, Clone)]
pub struct PerformanceWarning {
    pub warning_type: PerformanceWarningType,
    pub system_name: String,
    pub message: String,
    pub severity: WarningSeverity,
    pub timestamp: u64,
    pub value: f64,
    pub threshold: f64,
    pub suggestion: Option<String>,
}

/**
 * 警告严重程度
 */
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WarningSeverity {
    Low,
    Medium,
    High,
    Critical,
}

/**
 * 性能阈值配置
 */
#[derive(Debug, Clone)]
pub struct PerformanceThresholds {
    /// 执行时间阈值（毫秒）
    pub execution_time: ThresholdPair,
    /// 内存使用阈值（MB）
    pub memory_usage: ThresholdPair,
    /// CPU使用率阈值（百分比）
    pub cpu_usage: ThresholdPair,
    /// FPS阈值
    pub fps: ThresholdPair,
    /// 实体数量阈值
    pub entity_count: ThresholdPair,
}

/**
 * 阈值对（警告和临界值）
 */
#[derive(Debug, Clone)]
pub struct ThresholdPair {
    pub warning: f64,
    pub critical: f64,
}

impl Default for PerformanceThresholds {
    fn default() -> Self {
        Self {
            execution_time: ThresholdPair { warning: 16.67, critical: 33.33 }, // 60fps和30fps对应的帧时间
            memory_usage: ThresholdPair { warning: 100.0, critical: 200.0 }, // MB
            cpu_usage: ThresholdPair { warning: 70.0, critical: 90.0 }, // 百分比
            fps: ThresholdPair { warning: 45.0, critical: 30.0 },
            entity_count: ThresholdPair { warning: 1000.0, critical: 5000.0 },
        }
    }
}

/**
 * 高性能监控器
 * 用于监控ECS系统的性能表现，提供详细的分析和优化建议
 */
pub struct PerformanceMonitor {
    system_data: FxHashMap<String, PerformanceData>,
    system_stats: FxHashMap<String, PerformanceStats>,
    warnings: Vec<PerformanceWarning>,
    is_enabled: bool,
    max_recent_samples: usize,
    max_warnings: usize,
    
    // 性能阈值配置
    thresholds: PerformanceThresholds,
    
    // FPS监控
    fps_history: VecDeque<f64>,
    last_frame_time: Option<Instant>,
    frame_count: u64,
    fps_update_interval: u64, // 毫秒
    last_fps_update: u64,
    current_fps: f64,
    
    // 内存监控
    memory_check_interval: u64, // 毫秒
    last_memory_check: u64,
    memory_history: Vec<usize>,
    
    // GC监控
    gc_count: u64,
    last_gc_check: u64,
    gc_check_interval: u64,
}

impl Default for PerformanceMonitor {
    fn default() -> Self {
        Self::new()
    }
}

impl PerformanceMonitor {
    /**
     * 创建新的性能监控器
     */
    pub fn new() -> Self {
        Self {
            system_data: FxHashMap::default(),
            system_stats: FxHashMap::default(),
            warnings: Vec::new(),
            is_enabled: false,
            max_recent_samples: 60, // 保留最近60帧的数据
            max_warnings: 100, // 最大警告数量
            thresholds: PerformanceThresholds::default(),
            fps_history: VecDeque::new(),
            last_frame_time: None,
            frame_count: 0,
            fps_update_interval: 1000, // 1秒更新一次FPS
            last_fps_update: 0,
            current_fps: 60.0,
            memory_check_interval: 5000, // 5秒检查一次内存
            last_memory_check: 0,
            memory_history: Vec::new(),
            gc_count: 0,
            last_gc_check: 0,
            gc_check_interval: 1000,
        }
    }

    /**
     * 启用性能监控
     */
    pub fn enable(&mut self) {
        self.is_enabled = true;
    }

    /**
     * 禁用性能监控
     */
    pub fn disable(&mut self) {
        self.is_enabled = false;
    }

    /**
     * 检查是否启用了性能监控
     */
    pub fn is_enabled(&self) -> bool {
        self.is_enabled
    }

    /**
     * 开始监控系统性能
     * 返回开始时间戳（用于endMonitoring）
     */
    pub fn start_monitoring(&self, _system_name: &str) -> Option<Instant> {
        if !self.is_enabled {
            return None;
        }
        Some(Instant::now())
    }

    /**
     * 结束监控并记录性能数据
     */
    pub fn end_monitoring(
        &mut self, 
        system_name: &str, 
        start_time: Option<Instant>, 
        entity_count: usize
    ) {
        if !self.is_enabled || start_time.is_none() {
            return;
        }

        let end_time = Instant::now();
        let execution_time = end_time.duration_since(start_time.unwrap()).as_secs_f64() * 1000.0;
        let average_time_per_entity = if entity_count > 0 {
            execution_time / entity_count as f64
        } else {
            0.0
        };

        // 更新当前性能数据
        let data = PerformanceData {
            name: system_name.to_string(),
            execution_time,
            entity_count,
            average_time_per_entity,
            last_update_time: current_timestamp(),
            memory_usage: None,
            cpu_usage: None,
        };

        self.system_data.insert(system_name.to_string(), data);

        // 更新统计信息
        self.update_stats(system_name, execution_time);

        // 检查警告
        self.check_warnings(system_name, execution_time, entity_count);
    }

    /**
     * 更新系统统计信息
     */
    fn update_stats(&mut self, system_name: &str, execution_time: f64) {
        {
            let stats = self.system_stats.entry(system_name.to_string()).or_insert_with(PerformanceStats::default);

            // 更新基本统计
            stats.total_time += execution_time;
            stats.execution_count += 1;
            stats.average_time = stats.total_time / stats.execution_count as f64;
            stats.min_time = stats.min_time.min(execution_time);
            stats.max_time = stats.max_time.max(execution_time);

            // 更新最近时间列表
            stats.recent_times.push_back(execution_time);
            if stats.recent_times.len() > self.max_recent_samples {
                stats.recent_times.pop_front();
            }
        }

        // 计算高级统计信息
        if let Some(stats) = self.system_stats.get_mut(system_name) {
            Self::calculate_advanced_stats_static(stats);
        }
    }

    /**
     * 计算高级统计信息
     */
    fn calculate_advanced_stats_static(stats: &mut PerformanceStats) {
        if stats.recent_times.is_empty() {
            return;
        }

        // 计算标准差
        let mean: f64 = stats.recent_times.iter().sum::<f64>() / stats.recent_times.len() as f64;
        let variance: f64 = stats.recent_times.iter()
            .map(|&time| (time - mean).powi(2))
            .sum::<f64>() / stats.recent_times.len() as f64;
        stats.standard_deviation = variance.sqrt();

        // 计算百分位数
        let mut sorted_times: Vec<f64> = stats.recent_times.iter().cloned().collect();
        sorted_times.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let len = sorted_times.len();

        if len > 0 {
            let index_95 = ((len as f64 * 0.95) as usize).min(len - 1);
            let index_99 = ((len as f64 * 0.99) as usize).min(len - 1);
            
            stats.percentile_95 = sorted_times[index_95];
            stats.percentile_99 = sorted_times[index_99];
        }
    }

    /**
     * 检查性能警告
     */
    fn check_warnings(&mut self, system_name: &str, execution_time: f64, entity_count: usize) {
        // 检查执行时间
        if execution_time > self.thresholds.execution_time.critical {
            self.add_warning(PerformanceWarning {
                warning_type: PerformanceWarningType::HighExecutionTime,
                system_name: system_name.to_string(),
                message: format!("System {} execution time is critically high: {:.2}ms", system_name, execution_time),
                severity: WarningSeverity::Critical,
                timestamp: current_timestamp(),
                value: execution_time,
                threshold: self.thresholds.execution_time.critical,
                suggestion: Some("Consider optimizing system logic or reducing entity count".to_string()),
            });
        } else if execution_time > self.thresholds.execution_time.warning {
            self.add_warning(PerformanceWarning {
                warning_type: PerformanceWarningType::HighExecutionTime,
                system_name: system_name.to_string(),
                message: format!("System {} execution time is high: {:.2}ms", system_name, execution_time),
                severity: WarningSeverity::Medium,
                timestamp: current_timestamp(),
                value: execution_time,
                threshold: self.thresholds.execution_time.warning,
                suggestion: Some("Monitor system performance and consider optimization".to_string()),
            });
        }

        // 检查实体数量
        let entity_count_f64 = entity_count as f64;
        if entity_count_f64 > self.thresholds.entity_count.critical {
            self.add_warning(PerformanceWarning {
                warning_type: PerformanceWarningType::HighEntityCount,
                system_name: system_name.to_string(),
                message: format!("System {} processing critically high entity count: {}", system_name, entity_count),
                severity: WarningSeverity::Critical,
                timestamp: current_timestamp(),
                value: entity_count_f64,
                threshold: self.thresholds.entity_count.critical,
                suggestion: Some("Consider entity pooling or batch processing".to_string()),
            });
        } else if entity_count_f64 > self.thresholds.entity_count.warning {
            self.add_warning(PerformanceWarning {
                warning_type: PerformanceWarningType::HighEntityCount,
                system_name: system_name.to_string(),
                message: format!("System {} processing high entity count: {}", system_name, entity_count),
                severity: WarningSeverity::Medium,
                timestamp: current_timestamp(),
                value: entity_count_f64,
                threshold: self.thresholds.entity_count.warning,
                suggestion: Some("Monitor entity count and consider optimization if it continues growing".to_string()),
            });
        }
    }

    /**
     * 添加警告
     */
    fn add_warning(&mut self, warning: PerformanceWarning) {
        self.warnings.push(warning);

        // 限制警告数量
        if self.warnings.len() > self.max_warnings {
            self.warnings.remove(0);
        }
    }

    /**
     * 获取系统的当前性能数据
     */
    pub fn get_system_data(&self, system_name: &str) -> Option<&PerformanceData> {
        self.system_data.get(system_name)
    }

    /**
     * 获取系统的统计信息
     */
    pub fn get_system_stats(&self, system_name: &str) -> Option<&PerformanceStats> {
        self.system_stats.get(system_name)
    }

    /**
     * 获取所有系统的性能数据
     */
    pub fn get_all_system_data(&self) -> &FxHashMap<String, PerformanceData> {
        &self.system_data
    }

    /**
     * 获取所有系统的统计信息
     */
    pub fn get_all_system_stats(&self) -> &FxHashMap<String, PerformanceStats> {
        &self.system_stats
    }

    /**
     * 获取性能报告
     */
    pub fn get_performance_report(&self) -> String {
        if !self.is_enabled {
            return "Performance monitoring is disabled.".to_string();
        }

        let mut lines = Vec::new();
        lines.push("=== ECS Performance Report ===".to_string());
        lines.push("".to_string());

        // 按平均执行时间排序
        let mut sorted_systems: Vec<_> = self.system_stats.iter().collect();
        sorted_systems.sort_by(|a, b| b.1.average_time.partial_cmp(&a.1.average_time).unwrap());

        for (system_name, stats) in sorted_systems {
            if let Some(data) = self.system_data.get(system_name) {
                lines.push(format!("System: {}", system_name));
                lines.push(format!("  Current: {:.2}ms ({} entities)", data.execution_time, data.entity_count));
                lines.push(format!("  Average: {:.2}ms", stats.average_time));
                lines.push(format!("  Min/Max: {:.2}ms / {:.2}ms", stats.min_time, stats.max_time));
                lines.push(format!("  Total: {:.2}ms ({} calls)", stats.total_time, stats.execution_count));
                
                if data.average_time_per_entity > 0.0 {
                    lines.push(format!("  Per Entity: {:.4}ms", data.average_time_per_entity));
                }
                
                lines.push("".to_string());
            }
        }

        // 总体统计
        let total_current_time: f64 = self.system_data.values()
            .map(|data| data.execution_time)
            .sum();
        
        lines.push(format!("Total Frame Time: {:.2}ms", total_current_time));
        lines.push(format!("Systems Count: {}", self.system_data.len()));
        lines.push(format!("Current FPS: {:.1}", self.current_fps));

        lines.join("\n")
    }

    /**
     * 获取性能警告
     */
    pub fn get_performance_warnings(&self, threshold_ms: Option<f64>) -> Vec<String> {
        let threshold = threshold_ms.unwrap_or(16.67); // 默认60fps阈值
        let mut warnings = Vec::new();
        
        for (system_name, data) in &self.system_data {
            if data.execution_time > threshold {
                warnings.push(format!("{}: {:.2}ms (>{:.0}ms)", 
                    system_name, data.execution_time, threshold));
            }
        }
        
        warnings
    }

    /**
     * 获取所有警告
     */
    pub fn get_warnings(&self) -> &[PerformanceWarning] {
        &self.warnings
    }

    /**
     * 清除所有警告
     */
    pub fn clear_warnings(&mut self) {
        self.warnings.clear();
    }

    /**
     * 重置所有性能数据
     */
    pub fn reset(&mut self) {
        self.system_data.clear();
        self.system_stats.clear();
        self.warnings.clear();
    }

    /**
     * 重置指定系统的性能数据
     */
    pub fn reset_system(&mut self, system_name: &str) {
        self.system_data.remove(system_name);
        self.system_stats.remove(system_name);
    }

    /**
     * 设置最大保留样本数
     */
    pub fn set_max_recent_samples(&mut self, max_samples: usize) {
        self.max_recent_samples = max_samples;
        
        // 裁剪现有数据
        for stats in self.system_stats.values_mut() {
            while stats.recent_times.len() > max_samples {
                stats.recent_times.pop_front();
            }
        }
    }

    /**
     * 设置性能阈值
     */
    pub fn set_thresholds(&mut self, thresholds: PerformanceThresholds) {
        self.thresholds = thresholds;
    }

    /**
     * 获取性能阈值
     */
    pub fn get_thresholds(&self) -> &PerformanceThresholds {
        &self.thresholds
    }

    /**
     * 更新FPS
     */
    pub fn update_fps(&mut self) {
        let now = Instant::now();
        
        if let Some(last_time) = self.last_frame_time {
            let frame_time = now.duration_since(last_time).as_secs_f64() * 1000.0;
            self.fps_history.push_back(1000.0 / frame_time);
            
            // 保持历史记录在合理范围内
            if self.fps_history.len() > self.max_recent_samples {
                self.fps_history.pop_front();
            }
            
            // 每秒更新一次平均FPS
            let current_time = current_timestamp();
            if current_time - self.last_fps_update > self.fps_update_interval {
                if !self.fps_history.is_empty() {
                    self.current_fps = self.fps_history.iter().sum::<f64>() / self.fps_history.len() as f64;
                }
                self.last_fps_update = current_time;
            }
        }
        
        self.last_frame_time = Some(now);
        self.frame_count += 1;
    }

    /**
     * 获取当前FPS
     */
    pub fn get_current_fps(&self) -> f64 {
        self.current_fps
    }

    /**
     * 获取平均FPS
     */
    pub fn get_average_fps(&self) -> f64 {
        if self.fps_history.is_empty() {
            60.0
        } else {
            self.fps_history.iter().sum::<f64>() / self.fps_history.len() as f64
        }
    }
}

// 辅助函数

/**
 * 获取当前时间戳（毫秒）
 */
fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;
    use std::time::Duration;

    #[test]
    fn test_performance_monitor_creation() {
        let monitor = PerformanceMonitor::new();
        assert!(!monitor.enabled());
        assert_eq!(monitor.get_current_fps(), 60.0);
        assert!(monitor.get_all_system_data().is_empty());
    }

    #[test]
    fn test_performance_monitor_enable_disable() {
        let mut monitor = PerformanceMonitor::new();
        
        assert!(!monitor.enabled());
        
        monitor.enable();
        assert!(monitor.enabled());
        
        monitor.disable();
        assert!(!monitor.enabled());
    }

    #[test]
    fn test_performance_monitoring_disabled() {
        let mut monitor = PerformanceMonitor::new();
        let start_time = monitor.start_monitoring("TestSystem");
        
        assert!(start_time.is_none());
        
        monitor.end_monitoring("TestSystem", start_time, 10);
        assert!(monitor.get_system_data("TestSystem").is_none());
    }

    #[test]
    fn test_performance_monitoring_enabled() {
        let mut monitor = PerformanceMonitor::new();
        monitor.enable();
        
        let start_time = monitor.start_monitoring("TestSystem");
        assert!(start_time.is_some());
        
        thread::sleep(Duration::from_millis(10));
        
        monitor.end_monitoring("TestSystem", start_time, 5);
        
        let data = monitor.get_system_data("TestSystem");
        assert!(data.is_some());
        
        let data = data.unwrap();
        assert_eq!(data.name, "TestSystem");
        assert_eq!(data.entity_count, 5);
        assert!(data.execution_time >= 10.0);
        assert!(data.average_time_per_entity > 0.0);
    }

    #[test]
    fn test_performance_stats_update() {
        let mut monitor = PerformanceMonitor::new();
        monitor.enable();
        
        // 模拟多次执行
        for i in 0..3 {
            let start_time = monitor.start_monitoring("TestSystem");
            thread::sleep(Duration::from_millis(5 + i)); // 不同的执行时间
            monitor.end_monitoring("TestSystem", start_time, 10);
        }
        
        let stats = monitor.get_system_stats("TestSystem");
        assert!(stats.is_some());
        
        let stats = stats.unwrap();
        assert_eq!(stats.execution_count, 3);
        assert!(stats.total_time > 0.0);
        assert!(stats.average_time > 0.0);
        assert!(stats.min_time > 0.0);
        assert!(stats.max_time > 0.0);
        assert_eq!(stats.recent_times.len(), 3);
    }

    #[test]
    fn test_performance_warnings() {
        let mut monitor = PerformanceMonitor::new();
        monitor.enable();
        
        // 设置较低的阈值以触发警告
        let mut thresholds = PerformanceThresholds::default();
        thresholds.execution_time.warning = 1.0;
        thresholds.execution_time.critical = 2.0;
        monitor.set_thresholds(thresholds);
        
        let start_time = monitor.start_monitoring("TestSystem");
        thread::sleep(Duration::from_millis(5)); // 足够触发警告
        monitor.end_monitoring("TestSystem", start_time, 10);
        
        let warnings = monitor.get_warnings();
        assert!(!warnings.is_empty());
        assert_eq!(warnings[0].system_name, "TestSystem");
        assert_eq!(warnings[0].warning_type, PerformanceWarningType::HighExecutionTime);
    }

    #[test]
    fn test_performance_report() {
        let mut monitor = PerformanceMonitor::new();
        monitor.enable();
        
        let start_time = monitor.start_monitoring("TestSystem");
        thread::sleep(Duration::from_millis(5));
        monitor.end_monitoring("TestSystem", start_time, 10);
        
        let report = monitor.get_performance_report();
        assert!(report.contains("ECS Performance Report"));
        assert!(report.contains("TestSystem"));
    }

    #[test]
    fn test_fps_monitoring() {
        let mut monitor = PerformanceMonitor::new();
        
        // 模拟几帧
        for _ in 0..3 {
            monitor.update_fps();
            thread::sleep(Duration::from_millis(16)); // ~60fps
        }
        
        let fps = monitor.get_current_fps();
        assert!(fps > 0.0);
    }

    #[test]
    fn test_reset_functionality() {
        let mut monitor = PerformanceMonitor::new();
        monitor.enable();
        
        let start_time = monitor.start_monitoring("TestSystem");
        monitor.end_monitoring("TestSystem", start_time, 10);
        
        assert!(monitor.get_system_data("TestSystem").is_some());
        
        monitor.reset();
        assert!(monitor.get_system_data("TestSystem").is_none());
        assert!(monitor.get_warnings().is_empty());
    }

    #[test]
    fn test_max_recent_samples() {
        let mut monitor = PerformanceMonitor::new();
        monitor.enable();
        monitor.set_max_recent_samples(2);
        
        // 执行3次，但只应该保留最近2次的数据
        for _ in 0..3 {
            let start_time = monitor.start_monitoring("TestSystem");
            monitor.end_monitoring("TestSystem", start_time, 10);
        }
        
        let stats = monitor.get_system_stats("TestSystem").unwrap();
        assert_eq!(stats.recent_times.len(), 2);
        assert_eq!(stats.execution_count, 3); // 总次数应该还是3
    }

    #[test]
    fn test_system_reset() {
        let mut monitor = PerformanceMonitor::new();
        monitor.enable();
        
        let start_time1 = monitor.start_monitoring("TestSystem1");
        monitor.end_monitoring("TestSystem1", start_time1, 10);
        
        let start_time2 = monitor.start_monitoring("TestSystem2");
        monitor.end_monitoring("TestSystem2", start_time2, 20);
        
        assert!(monitor.get_system_data("TestSystem1").is_some());
        assert!(monitor.get_system_data("TestSystem2").is_some());
        
        monitor.reset_system("TestSystem1");
        
        assert!(monitor.get_system_data("TestSystem1").is_none());
        assert!(monitor.get_system_data("TestSystem2").is_some());
    }

    #[test]
    fn test_percentile_calculations() {
        let mut monitor = PerformanceMonitor::new();
        monitor.enable();
        
        // 添加一些已知的执行时间
        let times = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
        
        for &time in &times {
            // 直接设置执行时间进行测试
            monitor.update_stats("TestSystem", time);
        }
        
        let stats = monitor.get_system_stats("TestSystem").unwrap();
        
        // 95%应该是9.5左右，99%应该是9.9左右
        assert!(stats.percentile_95 >= 9.0);
        assert!(stats.percentile_99 >= 9.0);
        
        // 标准差应该大于0
        assert!(stats.standard_deviation > 0.0);
    }
}