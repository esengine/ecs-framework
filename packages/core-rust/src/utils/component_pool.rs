use crate::core::Component;
use crate::utils::ComponentType;
use rustc_hash::FxHashMap;
use std::any::Any;

/**
 * 组件对象池，用于复用组件实例以减少内存分配
 */
pub struct ComponentPool<T> 
where 
    T: Component + Clone + Default,
{
    /// 池中存储的组件实例
    pool: Vec<T>,
    /// 创建新组件实例的函数
    create_fn: Box<dyn Fn() -> T + Send + Sync>,
    /// 重置组件状态的函数（可选）
    reset_fn: Option<Box<dyn Fn(&mut T) + Send + Sync>>,
    /// 池的最大容量
    max_size: usize,
    /// 统计信息
    stats: ComponentPoolStats,
}

/**
 * 组件池统计信息
 */
#[derive(Debug, Clone)]
pub struct ComponentPoolStats {
    /// 总共创建的组件数量
    pub total_created: u32,
    /// 总共获取的次数
    pub total_acquires: u32,
    /// 总共释放的次数
    pub total_releases: u32,
    /// 池命中次数（从池中获取而不是创建新的）
    pub pool_hits: u32,
    /// 池未命中次数（需要创建新实例）
    pub pool_misses: u32,
}

impl Default for ComponentPoolStats {
    fn default() -> Self {
        Self {
            total_created: 0,
            total_acquires: 0,
            total_releases: 0,
            pool_hits: 0,
            pool_misses: 0,
        }
    }
}

impl<T> ComponentPool<T>
where 
    T: Component + Clone + Default,
{
    /**
     * 创建新的组件池
     */
    pub fn new<F, R>(create_fn: F, reset_fn: Option<R>, max_size: usize) -> Self
    where
        F: Fn() -> T + Send + Sync + 'static,
        R: Fn(&mut T) + Send + Sync + 'static,
    {
        Self {
            pool: Vec::with_capacity(max_size.min(100)), // 预分配一些空间
            create_fn: Box::new(create_fn),
            reset_fn: reset_fn.map(|f| Box::new(f) as Box<dyn Fn(&mut T) + Send + Sync>),
            max_size,
            stats: ComponentPoolStats::default(),
        }
    }

    /**
     * 创建默认的组件池（使用Default trait）
     */
    pub fn with_default(max_size: usize) -> Self {
        Self::new(T::default, None::<fn(&mut T)>, max_size)
    }

    /**
     * 创建带重置函数的默认组件池
     */
    pub fn with_default_and_reset<R>(reset_fn: R, max_size: usize) -> Self
    where
        R: Fn(&mut T) + Send + Sync + 'static,
    {
        Self::new(T::default, Some(reset_fn), max_size)
    }

    /**
     * 获取一个组件实例
     */
    pub fn acquire(&mut self) -> T {
        self.stats.total_acquires += 1;

        if let Some(component) = self.pool.pop() {
            self.stats.pool_hits += 1;
            component
        } else {
            self.stats.pool_misses += 1;
            self.stats.total_created += 1;
            (self.create_fn)()
        }
    }

    /**
     * 释放一个组件实例回池中
     */
    pub fn release(&mut self, mut component: T) {
        self.stats.total_releases += 1;

        if self.pool.len() < self.max_size {
            // 调用重置函数（如果有）
            if let Some(ref reset_fn) = self.reset_fn {
                reset_fn(&mut component);
            }
            
            self.pool.push(component);
        }
        // 如果池已满，组件会被丢弃（由Rust自动清理）
    }

    /**
     * 预填充对象池
     */
    pub fn prewarm(&mut self, count: usize) {
        let needed = (self.max_size - self.pool.len()).min(count);
        
        for _ in 0..needed {
            let component = (self.create_fn)();
            self.pool.push(component);
            self.stats.total_created += 1;
        }
    }

    /**
     * 清空对象池
     */
    pub fn clear(&mut self) {
        self.pool.clear();
    }

    /**
     * 获取池中可用对象数量
     */
    pub fn available_count(&self) -> usize {
        self.pool.len()
    }

    /**
     * 获取池的最大容量
     */
    pub fn max_size(&self) -> usize {
        self.max_size
    }

    /**
     * 获取使用中的对象数量估算
     */
    pub fn used_count(&self) -> u32 {
        // 基于统计信息估算（总创建 - 池中可用）
        if self.stats.total_created as usize >= self.pool.len() {
            self.stats.total_created - self.pool.len() as u32
        } else {
            0
        }
    }

    /**
     * 获取池利用率（百分比）
     */
    pub fn utilization_rate(&self) -> f32 {
        if self.max_size == 0 {
            return 0.0;
        }
        
        let used = self.used_count() as f32;
        let total = self.max_size as f32;
        (used / total) * 100.0
    }

    /**
     * 获取池命中率（百分比）
     */
    pub fn hit_rate(&self) -> f32 {
        if self.stats.total_acquires == 0 {
            return 0.0;
        }
        
        (self.stats.pool_hits as f32 / self.stats.total_acquires as f32) * 100.0
    }

    /**
     * 获取统计信息
     */
    pub fn get_stats(&self) -> ComponentPoolStats {
        self.stats.clone()
    }

    /**
     * 重置统计信息
     */
    pub fn reset_stats(&mut self) {
        self.stats = ComponentPoolStats::default();
    }

    /**
     * 获取内存使用估算（字节）
     */
    pub fn estimated_memory_usage(&self) -> usize {
        let component_size = std::mem::size_of::<T>();
        let pool_size = self.pool.len() * component_size;
        let vec_overhead = self.pool.capacity() * std::mem::size_of::<T>();
        
        pool_size + vec_overhead
    }
}

/**
 * 类型擦除的组件池特征
 * 用于在ComponentPoolManager中统一管理不同类型的池
 */
trait AnyComponentPool {
    fn clear(&mut self);
    fn available_count(&self) -> usize;
    fn max_size(&self) -> usize;
    fn used_count(&self) -> u32;
    fn utilization_rate(&self) -> f32;
    fn hit_rate(&self) -> f32;
    fn estimated_memory_usage(&self) -> usize;
    fn prewarm(&mut self, count: usize);
    fn as_any(&self) -> &dyn Any;
    fn as_any_mut(&mut self) -> &mut dyn Any;
}

impl<T> AnyComponentPool for ComponentPool<T>
where 
    T: Component + Clone + Default,
{
    fn clear(&mut self) {
        self.clear();
    }

    fn available_count(&self) -> usize {
        self.available_count()
    }

    fn max_size(&self) -> usize {
        self.max_size()
    }

    fn used_count(&self) -> u32 {
        self.used_count()
    }

    fn utilization_rate(&self) -> f32 {
        self.utilization_rate()
    }

    fn hit_rate(&self) -> f32 {
        self.hit_rate()
    }

    fn estimated_memory_usage(&self) -> usize {
        self.estimated_memory_usage()
    }

    fn prewarm(&mut self, count: usize) {
        self.prewarm(count);
    }

    fn as_any(&self) -> &dyn Any {
        self
    }

    fn as_any_mut(&mut self) -> &mut dyn Any {
        self
    }
}

/**
 * 池统计信息摘要
 */
#[derive(Debug, Clone)]
pub struct PoolStatsSummary {
    pub available: usize,
    pub max_size: usize,
    pub used: u32,
    pub utilization_rate: f32,
    pub hit_rate: f32,
    pub memory_usage: usize,
}

/**
 * 全局组件池管理器
 * 使用单例模式管理所有组件类型的对象池
 */
pub struct ComponentPoolManager {
    /// 存储各种组件类型的池
    pools: FxHashMap<ComponentType, Box<dyn AnyComponentPool>>,
    /// 管理器统计信息
    stats: ComponentPoolManagerStats,
}

/**
 * 组件池管理器统计信息
 */
#[derive(Debug, Clone)]
pub struct ComponentPoolManagerStats {
    pub registered_pools: u32,
    pub total_memory_usage: usize,
    pub total_components_managed: u32,
}

impl Default for ComponentPoolManagerStats {
    fn default() -> Self {
        Self {
            registered_pools: 0,
            total_memory_usage: 0,
            total_components_managed: 0,
        }
    }
}

impl ComponentPoolManager {
    /**
     * 创建新的组件池管理器
     */
    pub fn new() -> Self {
        Self {
            pools: FxHashMap::default(),
            stats: ComponentPoolManagerStats::default(),
        }
    }

    /**
     * 注册组件池
     */
    pub fn register_pool<T, F, R>(
        &mut self,
        component_type: ComponentType,
        create_fn: F,
        reset_fn: Option<R>,
        max_size: Option<usize>,
    ) where
        T: Component + Clone + Default + 'static,
        F: Fn() -> T + Send + Sync + 'static,
        R: Fn(&mut T) + Send + Sync + 'static,
    {
        let max_size = max_size.unwrap_or(1000);
        let pool = ComponentPool::new(create_fn, reset_fn, max_size);
        
        self.pools.insert(component_type, Box::new(pool));
        self.update_stats();
    }

    /**
     * 注册使用Default的组件池
     */
    pub fn register_pool_default<T>(&mut self, component_type: ComponentType, max_size: Option<usize>)
    where
        T: Component + Clone + Default + 'static,
    {
        let max_size = max_size.unwrap_or(1000);
        let pool = ComponentPool::<T>::with_default(max_size);
        
        self.pools.insert(component_type, Box::new(pool));
        self.update_stats();
    }

    /**
     * 获取组件实例
     */
    pub fn acquire_component<T>(&mut self, component_type: ComponentType) -> Option<T>
    where
        T: Component + Clone + Default + 'static,
    {
        if let Some(pool) = self.pools.get_mut(&component_type) {
            if let Some(typed_pool) = pool.as_any_mut().downcast_mut::<ComponentPool<T>>() {
                return Some(typed_pool.acquire());
            }
        }
        None
    }

    /**
     * 释放组件实例
     */
    pub fn release_component<T>(&mut self, component_type: ComponentType, component: T)
    where
        T: Component + Clone + Default + 'static,
    {
        if let Some(pool) = self.pools.get_mut(&component_type) {
            if let Some(typed_pool) = pool.as_any_mut().downcast_mut::<ComponentPool<T>>() {
                typed_pool.release(component);
            }
        }
    }

    /**
     * 预热所有池
     */
    pub fn prewarm_all(&mut self, count: usize) {
        for pool in self.pools.values_mut() {
            pool.prewarm(count);
        }
        self.update_stats();
    }

    /**
     * 预热指定池
     */
    pub fn prewarm_pool(&mut self, component_type: ComponentType, count: usize) {
        if let Some(pool) = self.pools.get_mut(&component_type) {
            pool.prewarm(count);
            self.update_stats();
        }
    }

    /**
     * 清空所有池
     */
    pub fn clear_all(&mut self) {
        for pool in self.pools.values_mut() {
            pool.clear();
        }
        self.update_stats();
    }

    /**
     * 清空指定池
     */
    pub fn clear_pool(&mut self, component_type: ComponentType) {
        if let Some(pool) = self.pools.get_mut(&component_type) {
            pool.clear();
            self.update_stats();
        }
    }

    /**
     * 移除所有注册的池
     */
    pub fn reset(&mut self) {
        self.pools.clear();
        self.stats = ComponentPoolManagerStats::default();
    }

    /**
     * 获取池统计信息
     */
    pub fn get_pool_stats(&self) -> FxHashMap<ComponentType, PoolStatsSummary> {
        let mut stats = FxHashMap::default();
        
        for (&component_type, pool) in &self.pools {
            let summary = PoolStatsSummary {
                available: pool.available_count(),
                max_size: pool.max_size(),
                used: pool.used_count(),
                utilization_rate: pool.utilization_rate(),
                hit_rate: pool.hit_rate(),
                memory_usage: pool.estimated_memory_usage(),
            };
            stats.insert(component_type, summary);
        }
        
        stats
    }

    /**
     * 获取指定组件的池利用率
     */
    pub fn get_component_utilization(&self, component_type: ComponentType) -> f32 {
        self.pools.get(&component_type)
            .map(|pool| pool.utilization_rate())
            .unwrap_or(0.0)
    }

    /**
     * 获取指定组件的池命中率
     */
    pub fn get_component_hit_rate(&self, component_type: ComponentType) -> f32 {
        self.pools.get(&component_type)
            .map(|pool| pool.hit_rate())
            .unwrap_or(0.0)
    }

    /**
     * 获取管理器统计信息
     */
    pub fn get_manager_stats(&self) -> ComponentPoolManagerStats {
        self.stats.clone()
    }

    /**
     * 获取所有池的总内存使用量
     */
    pub fn get_total_memory_usage(&self) -> usize {
        self.pools.values()
            .map(|pool| pool.estimated_memory_usage())
            .sum()
    }

    /**
     * 检查是否注册了指定组件类型的池
     */
    pub fn has_pool(&self, component_type: ComponentType) -> bool {
        self.pools.contains_key(&component_type)
    }

    /**
     * 获取注册的池数量
     */
    pub fn pool_count(&self) -> usize {
        self.pools.len()
    }

    // 私有方法

    /**
     * 更新管理器统计信息
     */
    fn update_stats(&mut self) {
        self.stats.registered_pools = self.pools.len() as u32;
        self.stats.total_memory_usage = self.get_total_memory_usage();
        self.stats.total_components_managed = self.pools.values()
            .map(|pool| pool.used_count() + pool.available_count() as u32)
            .sum();
    }
}

impl Default for ComponentPoolManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::any::TypeId;

    // 测试用的示例组件
    #[derive(Clone, Default, Debug, PartialEq)]
    struct TestComponent {
        pub value: i32,
        pub name: String,
    }

    impl Component for TestComponent {
        fn id(&self) -> u32 { 0 }
        fn set_enabled(&mut self, _enabled: bool) {}
        fn set_update_order(&mut self, _order: i32) {}
        fn as_any(&self) -> &dyn std::any::Any { self }
        fn as_any_mut(&mut self) -> &mut dyn std::any::Any { self }
        fn clone_box(&self) -> Box<dyn Component> { Box::new(self.clone()) }
    }

    #[derive(Clone, Default, Debug)]
    struct AnotherTestComponent {
        pub data: String,
    }

    impl Component for AnotherTestComponent {
        fn id(&self) -> u32 { 0 }
        fn set_enabled(&mut self, _enabled: bool) {}
        fn set_update_order(&mut self, _order: i32) {}
        fn as_any(&self) -> &dyn std::any::Any { self }
        fn as_any_mut(&mut self) -> &mut dyn std::any::Any { self }
        fn clone_box(&self) -> Box<dyn Component> { Box::new(self.clone()) }
    }

    #[test]
    fn test_component_pool_basic() {
        let pool = ComponentPool::<TestComponent>::with_default(10);
        
        // 测试基本属性
        assert_eq!(pool.available_count(), 0);
        assert_eq!(pool.max_size(), 10);
        assert_eq!(pool.utilization_rate(), 0.0);
    }

    #[test]
    fn test_component_pool_acquire_release() {
        let mut pool = ComponentPool::<TestComponent>::with_default(5);
        
        // 第一次获取应该创建新实例
        let mut component1 = pool.acquire();
        component1.value = 42;
        component1.name = "test".to_string();
        
        assert_eq!(pool.available_count(), 0);
        assert_eq!(pool.get_stats().pool_misses, 1);
        
        // 释放组件
        pool.release(component1);
        assert_eq!(pool.available_count(), 1);
        
        // 再次获取应该从池中获取
        let component2 = pool.acquire();
        assert_eq!(pool.available_count(), 0);
        assert_eq!(pool.get_stats().pool_hits, 1);
        
        // 验证是同一个实例（虽然值可能不同）
        assert_eq!(component2.value, 42); // 没有重置函数，值保持不变
    }

    #[test]
    fn test_component_pool_with_reset() {
        let reset_fn = |comp: &mut TestComponent| {
            comp.value = 0;
            comp.name.clear();
        };
        
        let mut pool = ComponentPool::with_default_and_reset(reset_fn, 5);
        
        let mut component = pool.acquire();
        component.value = 42;
        component.name = "test".to_string();
        
        pool.release(component);
        
        let component2 = pool.acquire();
        assert_eq!(component2.value, 0);
        assert_eq!(component2.name, "");
    }

    #[test]
    fn test_component_pool_max_capacity() {
        let mut pool = ComponentPool::<TestComponent>::with_default(2);
        
        // 获取3个组件
        let comp1 = pool.acquire();
        let comp2 = pool.acquire();
        let comp3 = pool.acquire();
        
        // 释放所有组件
        pool.release(comp1);
        pool.release(comp2);
        pool.release(comp3);
        
        // 只有2个组件被存储在池中（最大容量限制）
        assert_eq!(pool.available_count(), 2);
    }

    #[test]
    fn test_component_pool_prewarm() {
        let mut pool = ComponentPool::<TestComponent>::with_default(10);
        
        pool.prewarm(5);
        assert_eq!(pool.available_count(), 5);
        
        // 预热不应该超过最大容量
        pool.prewarm(10);
        assert_eq!(pool.available_count(), 10);
    }

    #[test]
    fn test_component_pool_stats() {
        let mut pool = ComponentPool::<TestComponent>::with_default(5);
        
        // 获取一些组件
        let _comp1 = pool.acquire();
        let _comp2 = pool.acquire();
        
        let stats = pool.get_stats();
        assert_eq!(stats.total_acquires, 2);
        assert_eq!(stats.pool_misses, 2);
        assert_eq!(stats.pool_hits, 0);
        assert_eq!(stats.total_created, 2);
    }

    #[test]
    fn test_component_pool_manager_basic() {
        let mut manager = ComponentPoolManager::new();
        
        // 注册池
        manager.register_pool_default::<TestComponent>(TypeId::of::<TestComponent>(), Some(20));
        
        assert!(manager.has_pool(TypeId::of::<TestComponent>()));
        assert_eq!(manager.pool_count(), 1);
    }

    #[test]
    fn test_component_pool_manager_acquire_release() {
        let mut manager = ComponentPoolManager::new();
        
        manager.register_pool_default::<TestComponent>(TypeId::of::<TestComponent>(), Some(10));
        
        // 获取组件
        let mut component = manager.acquire_component::<TestComponent>(TypeId::of::<TestComponent>()).unwrap();
        component.value = 42;
        
        // 释放组件
        manager.release_component(TypeId::of::<TestComponent>(), component);
        
        // 再次获取应该从池中获取
        let reused_component = manager.acquire_component::<TestComponent>(TypeId::of::<TestComponent>()).unwrap();
        assert_eq!(reused_component.value, 42);
    }

    #[test]
    fn test_component_pool_manager_multiple_types() {
        let mut manager = ComponentPoolManager::new();
        
        manager.register_pool_default::<TestComponent>(TypeId::of::<TestComponent>(), Some(10));
        manager.register_pool_default::<AnotherTestComponent>(TypeId::of::<AnotherTestComponent>(), Some(15));
        
        assert_eq!(manager.pool_count(), 2);
        
        // 测试不同类型的组件
        let _test_comp = manager.acquire_component::<TestComponent>(TypeId::of::<TestComponent>()).unwrap();
        let _another_comp = manager.acquire_component::<AnotherTestComponent>(TypeId::of::<AnotherTestComponent>()).unwrap();
    }

    #[test]
    fn test_component_pool_manager_stats() {
        let mut manager = ComponentPoolManager::new();
        
        manager.register_pool_default::<TestComponent>(TypeId::of::<TestComponent>(), Some(10));
        manager.prewarm_pool(TypeId::of::<TestComponent>(), 5);
        
        let stats = manager.get_pool_stats();
        let test_comp_stats = stats.get(&TypeId::of::<TestComponent>()).unwrap();
        
        assert_eq!(test_comp_stats.available, 5);
        assert_eq!(test_comp_stats.max_size, 10);
        assert!(test_comp_stats.memory_usage > 0);
    }

    #[test]
    fn test_component_pool_manager_prewarm_and_clear() {
        let mut manager = ComponentPoolManager::new();
        
        manager.register_pool_default::<TestComponent>(TypeId::of::<TestComponent>(), Some(10));
        manager.register_pool_default::<AnotherTestComponent>(TypeId::of::<AnotherTestComponent>(), Some(10));
        
        // 预热所有池
        manager.prewarm_all(5);
        
        let stats = manager.get_pool_stats();
        assert_eq!(stats.get(&TypeId::of::<TestComponent>()).unwrap().available, 5);
        assert_eq!(stats.get(&TypeId::of::<AnotherTestComponent>()).unwrap().available, 5);
        
        // 清空所有池
        manager.clear_all();
        
        let stats = manager.get_pool_stats();
        assert_eq!(stats.get(&TypeId::of::<TestComponent>()).unwrap().available, 0);
        assert_eq!(stats.get(&TypeId::of::<AnotherTestComponent>()).unwrap().available, 0);
    }

    #[test]
    fn test_component_pool_manager_unknown_type() {
        let mut manager = ComponentPoolManager::new();
        
        // 尝试获取未注册类型的组件
        let result = manager.acquire_component::<TestComponent>(TypeId::of::<TestComponent>());
        assert!(result.is_none());
        
        // 释放到未注册的池应该安全处理
        let component = TestComponent::default();
        manager.release_component(TypeId::of::<TestComponent>(), component); // 不应该panic
    }
}