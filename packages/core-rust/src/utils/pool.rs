use rustc_hash::FxHashMap;
use std::any::Any;

/**
 * 可池化对象trait
 */
pub trait Poolable: Send + Sync {
    /**
     * 重置对象状态，准备重用
     */
    fn reset(&mut self);

    /**
     * 获取对象的估算大小（字节）
     */
    fn estimated_size(&self) -> usize {
        std::mem::size_of_val(self)
    }
}

/**
 * 对象池统计信息
 */
#[derive(Debug, Clone)]
pub struct PoolStats {
    /// 池中对象数量
    pub size: usize,
    /// 池的最大大小
    pub max_size: usize,
    /// 总共创建的对象数量
    pub total_created: u64,
    /// 总共获取的次数
    pub total_obtained: u64,
    /// 总共释放的次数
    pub total_released: u64,
    /// 命中率（从池中获取的比例）
    pub hit_rate: f64,
    /// 内存使用估算（字节）
    pub estimated_memory_usage: usize,
}

impl Default for PoolStats {
    fn default() -> Self {
        Self {
            size: 0,
            max_size: 0,
            total_created: 0,
            total_obtained: 0,
            total_released: 0,
            hit_rate: 0.0,
            estimated_memory_usage: 0,
        }
    }
}

/**
 * 高性能通用对象池
 * 支持任意类型的对象池化，包含详细的统计信息
 */
pub struct Pool<T: Poolable> {
    /// 池中的对象
    objects: Vec<T>,
    /// 创建对象的函数
    create_fn: Box<dyn Fn() -> T + Send + Sync>,
    /// 池的最大大小
    max_size: usize,
    /// 统计信息
    stats: PoolStats,
    /// 估算的单个对象大小
    object_size: usize,
}

impl<T: Poolable> Pool<T> {
    /**
     * 创建新的对象池
     */
    pub fn new<F>(create_fn: F, max_size: usize, estimated_object_size: usize) -> Self
    where
        F: Fn() -> T + Send + Sync + 'static,
    {
        Self {
            objects: Vec::new(),
            create_fn: Box::new(create_fn),
            max_size,
            stats: PoolStats {
                max_size,
                ..Default::default()
            },
            object_size: estimated_object_size,
        }
    }

    /**
     * 从池中获取对象
     */
    pub fn obtain(&mut self) -> T {
        self.stats.total_obtained += 1;

        if let Some(mut obj) = self.objects.pop() {
            self.stats.size -= 1;
            self.update_hit_rate();
            self.update_memory_usage();
            obj.reset(); // 重置对象状态
            obj
        } else {
            // 池中没有可用对象，创建新对象
            self.stats.total_created += 1;
            self.update_hit_rate();
            (self.create_fn)()
        }
    }

    /**
     * 释放对象回池中
     */
    pub fn release(&mut self, mut obj: T) {
        self.stats.total_released += 1;

        // 如果池未满，将对象放回池中
        if self.stats.size < self.max_size {
            obj.reset();
            self.objects.push(obj);
            self.stats.size += 1;
            self.update_memory_usage();
        }
        // 如果池已满，让对象被drop
    }

    /**
     * 获取池统计信息
     */
    pub fn get_stats(&self) -> &PoolStats {
        &self.stats
    }

    /**
     * 清空池
     */
    pub fn clear(&mut self) {
        self.objects.clear();
        self.stats.size = 0;
        self.update_memory_usage();
    }

    /**
     * 压缩池（移除多余的对象）
     */
    pub fn compact(&mut self, target_size: Option<usize>) {
        let target = target_size.unwrap_or(self.objects.len() / 2);
        
        while self.objects.len() > target {
            self.objects.pop();
            self.stats.size -= 1;
        }
        
        self.update_memory_usage();
    }

    /**
     * 预填充池
     */
    pub fn prewarm(&mut self, count: usize) {
        let actual_count = count.min(self.max_size - self.objects.len());
        
        for _ in 0..actual_count {
            let mut obj = (self.create_fn)();
            obj.reset();
            self.objects.push(obj);
            self.stats.total_created += 1;
            self.stats.size += 1;
        }
        
        self.update_memory_usage();
    }

    /**
     * 设置最大池大小
     */
    pub fn set_max_size(&mut self, max_size: usize) {
        self.max_size = max_size;
        self.stats.max_size = max_size;
        
        // 如果当前池大小超过新的最大值，进行压缩
        if self.objects.len() > max_size {
            self.compact(Some(max_size));
        }
    }

    /**
     * 获取池中可用对象数量
     */
    pub fn get_available_count(&self) -> usize {
        self.objects.len()
    }

    /**
     * 检查池是否为空
     */
    pub fn is_empty(&self) -> bool {
        self.objects.is_empty()
    }

    /**
     * 检查池是否已满
     */
    pub fn is_full(&self) -> bool {
        self.objects.len() >= self.max_size
    }

    /**
     * 获取池的最大大小
     */
    pub fn max_size(&self) -> usize {
        self.max_size
    }

    /**
     * 更新命中率
     */
    fn update_hit_rate(&mut self) {
        if self.stats.total_obtained == 0 {
            self.stats.hit_rate = 0.0;
        } else {
            let hits = self.stats.total_obtained - self.stats.total_created;
            self.stats.hit_rate = hits as f64 / self.stats.total_obtained as f64;
        }
    }

    /**
     * 更新内存使用估算
     */
    fn update_memory_usage(&mut self) {
        self.stats.estimated_memory_usage = self.stats.size * self.object_size;
    }
}

/**
 * Pool trait object for heterogeneous storage
 */
trait AnyPool: Send + Sync {
    fn clear(&mut self);
    fn compact(&mut self);
    fn get_stats(&self) -> PoolStats;
    fn as_any(&self) -> &dyn Any;
    fn as_any_mut(&mut self) -> &mut dyn Any;
}

impl<T: Poolable + 'static> AnyPool for Pool<T> {
    fn clear(&mut self) {
        Pool::clear(self);
    }

    fn compact(&mut self) {
        Pool::compact(self, None);
    }

    fn get_stats(&self) -> PoolStats {
        self.stats.clone()
    }

    fn as_any(&self) -> &dyn Any {
        self
    }

    fn as_any_mut(&mut self) -> &mut dyn Any {
        self
    }
}

/**
 * 池管理器
 * 统一管理所有对象池
 */
pub struct PoolManager {
    /// 池映射
    pools: FxHashMap<String, Box<dyn AnyPool>>,
    /// 自动压缩间隔（毫秒）
    auto_compact_interval: u64,
    /// 上次压缩时间
    last_compact_time: u64,
}

impl PoolManager {
    /**
     * 创建新的池管理器
     */
    pub fn new() -> Self {
        Self {
            pools: FxHashMap::default(),
            auto_compact_interval: 60000, // 60秒
            last_compact_time: 0,
        }
    }

    /**
     * 注册池
     */
    pub fn register_pool<T: Poolable + 'static>(&mut self, name: String, pool: Pool<T>) {
        self.pools.insert(name, Box::new(pool));
    }

    /**
     * 获取池
     */
    pub fn get_pool<T: Poolable + 'static>(&mut self, name: &str) -> Option<&mut Pool<T>> {
        if let Some(pool) = self.pools.get_mut(name) {
            pool.as_any_mut().downcast_mut::<Pool<T>>()
        } else {
            None
        }
    }

    /**
     * 创建或获取池
     */
    pub fn create_pool<T, F>(
        &mut self,
        name: String,
        create_fn: F,
        max_size: usize,
        estimated_object_size: usize,
    ) -> &mut Pool<T>
    where
        T: Poolable + 'static,
        F: Fn() -> T + Send + Sync + 'static,
    {
        if !self.pools.contains_key(&name) {
            let pool = Pool::new(create_fn, max_size, estimated_object_size);
            self.pools.insert(name.clone(), Box::new(pool));
        }
        
        self.get_pool(&name).unwrap()
    }

    /**
     * 更新池管理器（应在游戏循环中调用）
     */
    pub fn update(&mut self) {
        let now = current_timestamp();
        
        if now - self.last_compact_time > self.auto_compact_interval {
            self.compact_all_pools();
            self.last_compact_time = now;
        }
    }

    /**
     * 移除池
     */
    pub fn remove_pool(&mut self, name: &str) -> bool {
        if let Some(mut pool) = self.pools.remove(name) {
            pool.clear();
            true
        } else {
            false
        }
    }

    /**
     * 获取所有池名称
     */
    pub fn get_pool_names(&self) -> Vec<String> {
        self.pools.keys().cloned().collect()
    }

    /**
     * 获取池数量
     */
    pub fn get_pool_count(&self) -> usize {
        self.pools.len()
    }

    /**
     * 压缩所有池
     */
    pub fn compact_all_pools(&mut self) {
        for pool in self.pools.values_mut() {
            pool.compact();
        }
    }

    /**
     * 清空所有池
     */
    pub fn clear_all_pools(&mut self) {
        for pool in self.pools.values_mut() {
            pool.clear();
        }
    }

    /**
     * 获取所有池的统计信息
     */
    pub fn get_all_stats(&self) -> FxHashMap<String, PoolStats> {
        let mut stats = FxHashMap::default();
        
        for (name, pool) in &self.pools {
            stats.insert(name.clone(), pool.get_stats());
        }
        
        stats
    }

    /**
     * 获取总体统计信息
     */
    pub fn get_global_stats(&self) -> PoolStats {
        let mut total_size = 0;
        let mut total_max_size = 0;
        let mut total_created = 0;
        let mut total_obtained = 0;
        let mut total_released = 0;
        let mut total_memory_usage = 0;
        
        for pool in self.pools.values() {
            let stats = pool.get_stats();
            total_size += stats.size;
            total_max_size += stats.max_size;
            total_created += stats.total_created;
            total_obtained += stats.total_obtained;
            total_released += stats.total_released;
            total_memory_usage += stats.estimated_memory_usage;
        }
        
        let hit_rate = if total_obtained == 0 {
            0.0
        } else {
            (total_obtained - total_created) as f64 / total_obtained as f64
        };
        
        PoolStats {
            size: total_size,
            max_size: total_max_size,
            total_created,
            total_obtained,
            total_released,
            hit_rate,
            estimated_memory_usage: total_memory_usage,
        }
    }

    /**
     * 获取格式化的统计信息字符串
     */
    pub fn get_stats_string(&self) -> String {
        let mut lines = vec![
            "=== Pool Manager Statistics ===".to_string(),
            "".to_string(),
        ];
        
        if self.pools.is_empty() {
            lines.push("No pools registered".to_string());
            return lines.join("\n");
        }
        
        let global_stats = self.get_global_stats();
        lines.push(format!("Total Pools: {}", self.pools.len()));
        lines.push(format!("Global Hit Rate: {:.1}%", global_stats.hit_rate * 100.0));
        lines.push(format!(
            "Global Memory Usage: {:.1} KB", 
            global_stats.estimated_memory_usage as f64 / 1024.0
        ));
        lines.push("".to_string());
        
        for (name, pool) in &self.pools {
            let stats = pool.get_stats();
            lines.push(format!("{}:", name));
            lines.push(format!("  Size: {}/{}", stats.size, stats.max_size));
            lines.push(format!("  Hit Rate: {:.1}%", stats.hit_rate * 100.0));
            lines.push(format!(
                "  Memory: {:.1} KB", 
                stats.estimated_memory_usage as f64 / 1024.0
            ));
            lines.push("".to_string());
        }
        
        lines.join("\n")
    }

    /**
     * 设置自动压缩间隔
     */
    pub fn set_auto_compact_interval(&mut self, interval_ms: u64) {
        self.auto_compact_interval = interval_ms;
    }

    /**
     * 预填充所有池
     */
    pub fn prewarm_all_pools(&mut self) {
        for pool in self.pools.values_mut() {
            let stats = pool.get_stats();
            let prewarm_count = (stats.max_size as f64 * 0.2) as usize; // 预填充20%
            // 注意：这里需要访问具体的池类型来调用prewarm
            // 在实际使用中，可能需要为AnyPool trait添加prewarm方法
        }
    }

    /**
     * 重置池管理器
     */
    pub fn reset(&mut self) {
        self.clear_all_pools();
        self.pools.clear();
        self.last_compact_time = 0;
    }
}

impl Default for PoolManager {
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

    // 测试对象
    #[derive(Debug, Clone)]
    struct TestObject {
        value: i32,
        data: String,
    }

    impl TestObject {
        fn new() -> Self {
            Self {
                value: 0,
                data: String::new(),
            }
        }
        
        fn with_value(value: i32) -> Self {
            Self {
                value,
                data: format!("data_{}", value),
            }
        }
    }

    impl Poolable for TestObject {
        fn reset(&mut self) {
            self.value = 0;
            self.data.clear();
        }

        fn estimated_size(&self) -> usize {
            std::mem::size_of::<Self>() + self.data.capacity()
        }
    }

    #[test]
    fn test_pool_creation() {
        let pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        
        assert_eq!(pool.get_available_count(), 0);
        assert_eq!(pool.max_size(), 10);
        assert!(pool.is_empty());
        assert!(!pool.is_full());
    }

    #[test]
    fn test_pool_obtain_release() {
        let mut pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        
        // 获取对象（池为空，应该创建新对象）
        let obj = pool.obtain();
        assert_eq!(obj.value, 0);
        
        let stats = pool.get_stats();
        assert_eq!(stats.total_created, 1);
        assert_eq!(stats.total_obtained, 1);
        
        // 释放对象
        pool.release(obj);
        
        let stats = pool.get_stats();
        assert_eq!(stats.total_released, 1);
        assert_eq!(stats.size, 1);
        assert_eq!(pool.get_available_count(), 1);
    }

    #[test]
    fn test_pool_reuse() {
        let mut pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        
        // 创建并释放一个对象
        let mut obj = pool.obtain();
        obj.value = 42;
        obj.data = "test".to_string();
        pool.release(obj);
        
        // 再次获取应该得到重置后的对象
        let obj = pool.obtain();
        assert_eq!(obj.value, 0);
        assert!(obj.data.is_empty());
        
        let stats = pool.get_stats();
        assert_eq!(stats.total_created, 1); // 只创建了一次
        assert_eq!(stats.total_obtained, 2); // 获取了两次
        assert!(stats.hit_rate > 0.0); // 有命中率
    }

    #[test]
    fn test_pool_max_size() {
        let mut pool: Pool<TestObject> = Pool::new(TestObject::new, 2, 64);
        
        // 释放3个对象，但池最大大小为2
        pool.release(TestObject::new());
        pool.release(TestObject::new());
        pool.release(TestObject::new()); // 这个应该被丢弃
        
        assert_eq!(pool.get_available_count(), 2);
        assert!(pool.is_full());
    }

    #[test]
    fn test_pool_prewarm() {
        let mut pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        
        pool.prewarm(5);
        
        assert_eq!(pool.get_available_count(), 5);
        
        let stats = pool.get_stats();
        assert_eq!(stats.total_created, 5);
        assert_eq!(stats.size, 5);
    }

    #[test]
    fn test_pool_compact() {
        let mut pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        
        // 预填充
        pool.prewarm(8);
        assert_eq!(pool.get_available_count(), 8);
        
        // 压缩到一半
        pool.compact(Some(4));
        assert_eq!(pool.get_available_count(), 4);
        
        // 默认压缩
        pool.compact(None);
        assert_eq!(pool.get_available_count(), 2);
    }

    #[test]
    fn test_pool_clear() {
        let mut pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        
        pool.prewarm(5);
        assert_eq!(pool.get_available_count(), 5);
        
        pool.clear();
        assert_eq!(pool.get_available_count(), 0);
        assert!(pool.is_empty());
    }

    #[test]
    fn test_pool_set_max_size() {
        let mut pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        
        pool.prewarm(8);
        assert_eq!(pool.get_available_count(), 8);
        
        // 减小最大大小应该自动压缩
        pool.set_max_size(5);
        assert_eq!(pool.max_size(), 5);
        assert_eq!(pool.get_available_count(), 5);
    }

    #[test]
    fn test_pool_stats() {
        let mut pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        
        // 获取和释放一些对象
        let obj1 = pool.obtain();
        let obj2 = pool.obtain();
        pool.release(obj1);
        
        let obj3 = pool.obtain(); // 应该重用obj1
        pool.release(obj2);
        pool.release(obj3);
        
        let stats = pool.get_stats();
        assert_eq!(stats.total_created, 2);
        assert_eq!(stats.total_obtained, 3);
        assert_eq!(stats.total_released, 3);
        assert!(stats.hit_rate > 0.0);
        assert_eq!(stats.size, 2);
    }

    #[test]
    fn test_pool_manager_creation() {
        let manager = PoolManager::new();
        assert_eq!(manager.get_pool_count(), 0);
        assert!(manager.get_pool_names().is_empty());
    }

    #[test]
    fn test_pool_manager_register_get() {
        let mut manager = PoolManager::new();
        let pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        
        manager.register_pool("test_objects".to_string(), pool);
        assert_eq!(manager.get_pool_count(), 1);
        
        let retrieved_pool = manager.get_pool::<TestObject>("test_objects");
        assert!(retrieved_pool.is_some());
        
        let non_existent = manager.get_pool::<TestObject>("non_existent");
        assert!(non_existent.is_none());
    }

    #[test]
    fn test_pool_manager_create_pool() {
        let mut manager = PoolManager::new();
        
        let pool = manager.create_pool(
            "test_objects".to_string(),
            TestObject::new,
            10,
            64,
        );
        
        assert_eq!(pool.max_size(), 10);
        assert_eq!(manager.get_pool_count(), 1);
    }

    #[test]
    fn test_pool_manager_remove_pool() {
        let mut manager = PoolManager::new();
        let pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        
        manager.register_pool("test_objects".to_string(), pool);
        assert_eq!(manager.get_pool_count(), 1);
        
        assert!(manager.remove_pool("test_objects"));
        assert_eq!(manager.get_pool_count(), 0);
        
        assert!(!manager.remove_pool("non_existent"));
    }

    #[test]
    fn test_pool_manager_global_stats() {
        let mut manager = PoolManager::new();
        
        let pool1: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        let pool2: Pool<TestObject> = Pool::new(TestObject::new, 20, 128);
        
        manager.register_pool("pool1".to_string(), pool1);
        manager.register_pool("pool2".to_string(), pool2);
        
        let global_stats = manager.get_global_stats();
        assert_eq!(global_stats.max_size, 30); // 10 + 20
    }

    #[test]
    fn test_pool_manager_clear_all() {
        let mut manager = PoolManager::new();
        
        let mut pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        pool.prewarm(5);
        
        manager.register_pool("test_objects".to_string(), pool);
        
        manager.clear_all_pools();
        
        if let Some(pool) = manager.get_pool::<TestObject>("test_objects") {
            assert!(pool.is_empty());
        }
    }

    #[test]
    fn test_pool_manager_compact_all() {
        let mut manager = PoolManager::new();
        
        let mut pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        pool.prewarm(8);
        
        manager.register_pool("test_objects".to_string(), pool);
        
        manager.compact_all_pools();
        
        if let Some(pool) = manager.get_pool::<TestObject>("test_objects") {
            assert!(pool.get_available_count() <= 4); // 压缩后应该减少
        }
    }

    #[test]
    fn test_pool_manager_stats_string() {
        let mut manager = PoolManager::new();
        
        let pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        manager.register_pool("test_objects".to_string(), pool);
        
        let stats_string = manager.get_stats_string();
        assert!(stats_string.contains("Pool Manager Statistics"));
        assert!(stats_string.contains("test_objects"));
    }

    #[test]
    fn test_pool_manager_reset() {
        let mut manager = PoolManager::new();
        
        let pool: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        manager.register_pool("test_objects".to_string(), pool);
        
        assert_eq!(manager.get_pool_count(), 1);
        
        manager.reset();
        
        assert_eq!(manager.get_pool_count(), 0);
        assert_eq!(manager.last_compact_time, 0);
    }

    // 测试不同类型的Poolable对象
    #[derive(Debug)]
    struct AnotherTestObject {
        id: u32,
        active: bool,
    }

    impl AnotherTestObject {
        fn new() -> Self {
            Self {
                id: 0,
                active: false,
            }
        }
    }

    impl Poolable for AnotherTestObject {
        fn reset(&mut self) {
            self.id = 0;
            self.active = false;
        }
    }

    #[test]
    fn test_pool_manager_multiple_types() {
        let mut manager = PoolManager::new();
        
        let pool1: Pool<TestObject> = Pool::new(TestObject::new, 10, 64);
        let pool2: Pool<AnotherTestObject> = Pool::new(AnotherTestObject::new, 5, 32);
        
        manager.register_pool("test_objects".to_string(), pool1);
        manager.register_pool("another_objects".to_string(), pool2);
        
        assert_eq!(manager.get_pool_count(), 2);
        
        let pool1 = manager.get_pool::<TestObject>("test_objects");
        assert!(pool1.is_some());
        
        let pool2 = manager.get_pool::<AnotherTestObject>("another_objects");
        assert!(pool2.is_some());
        
        // 尝试用错误的类型获取池
        let wrong_pool = manager.get_pool::<AnotherTestObject>("test_objects");
        assert!(wrong_pool.is_none());
    }
}