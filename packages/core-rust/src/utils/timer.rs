use crate::utils::Time;
use std::any::Any;

/**
 * 定时器回调函数类型
 */
pub type TimerCallback = Box<dyn FnMut(&mut dyn TimerContext) + Send + Sync>;

/**
 * 定时器上下文trait
 * 用于提供回调函数访问的上下文数据
 */
pub trait TimerContext: Send + Sync {
    fn as_any(&self) -> &dyn Any;
    fn as_any_mut(&mut self) -> &mut dyn Any;
}

/**
 * 默认的空上下文实现
 */
#[derive(Debug)]
pub struct EmptyContext;

impl TimerContext for EmptyContext {
    fn as_any(&self) -> &dyn Any {
        self
    }

    fn as_any_mut(&mut self) -> &mut dyn Any {
        self
    }
}

/**
 * 定时器接口trait
 */
pub trait ITimer {
    /**
     * 停止此计时器再次运行。这对非重复计时器没有影响。
     */
    fn stop(&mut self);

    /**
     * 将计时器的运行时间重置为0
     */
    fn reset(&mut self);

    /**
     * 返回上下文
     */
    fn get_context(&self) -> &dyn TimerContext;

    /**
     * 返回可变上下文
     */
    fn get_context_mut(&mut self) -> &mut dyn TimerContext;

    /**
     * 检查定时器是否已完成
     */
    fn is_done(&self) -> bool;

    /**
     * 获取已运行的时间
     */
    fn elapsed_time(&self) -> f64;
}

/**
 * 定时器实现
 */
pub struct Timer {
    /// 上下文数据
    context: Box<dyn TimerContext>,
    /// 定时器间隔时间（秒）
    time_in_seconds: f64,
    /// 是否重复执行
    repeats: bool,
    /// 回调函数
    on_time: Option<TimerCallback>,
    /// 是否已完成
    is_done: bool,
    /// 已运行时间
    elapsed_time: f64,
}

impl Timer {
    /**
     * 创建新的定时器
     */
    pub fn new() -> Self {
        Self {
            context: Box::new(EmptyContext),
            time_in_seconds: 0.0,
            repeats: false,
            on_time: None,
            is_done: false,
            elapsed_time: 0.0,
        }
    }

    /**
     * 初始化定时器
     */
    pub fn initialize<F>(
        &mut self,
        time_in_seconds: f64,
        repeats: bool,
        context: Box<dyn TimerContext>,
        on_time: F,
    ) where
        F: FnMut(&mut dyn TimerContext) + Send + Sync + 'static,
    {
        self.time_in_seconds = time_in_seconds;
        self.repeats = repeats;
        self.context = context;
        self.on_time = Some(Box::new(on_time));
        self.is_done = false;
        self.elapsed_time = 0.0;
    }

    /**
     * 使用简单回调初始化定时器
     */
    pub fn initialize_simple<F>(
        &mut self,
        time_in_seconds: f64,
        repeats: bool,
        on_time: F,
    ) where
        F: FnMut(&mut dyn TimerContext) + Send + Sync + 'static,
    {
        self.initialize(time_in_seconds, repeats, Box::new(EmptyContext), on_time);
    }

    /**
     * 更新定时器状态
     * 返回是否已完成
     */
    pub fn tick(&mut self, delta_time: f64) -> bool {
        if self.is_done {
            return true;
        }

        self.elapsed_time += delta_time;

        // 检查是否到达触发时间
        if self.elapsed_time >= self.time_in_seconds {
            if let Some(callback) = &mut self.on_time {
                // 调用回调函数
                callback(self.context.as_mut());
            }

            if self.repeats {
                // 重复定时器，重置经过时间但保留超出部分
                self.elapsed_time -= self.time_in_seconds;
            } else {
                // 一次性定时器，标记为完成
                self.is_done = true;
            }
        }

        self.is_done
    }

    /**
     * 清理定时器资源
     */
    pub fn unload(&mut self) {
        self.on_time = None;
        self.context = Box::new(EmptyContext);
    }
}

impl Default for Timer {
    fn default() -> Self {
        Self::new()
    }
}

impl ITimer for Timer {
    fn stop(&mut self) {
        self.is_done = true;
    }

    fn reset(&mut self) {
        self.elapsed_time = 0.0;
        self.is_done = false;
    }

    fn get_context(&self) -> &dyn TimerContext {
        self.context.as_ref()
    }

    fn get_context_mut(&mut self) -> &mut dyn TimerContext {
        self.context.as_mut()
    }

    fn is_done(&self) -> bool {
        self.is_done
    }

    fn elapsed_time(&self) -> f64 {
        self.elapsed_time
    }
}

/**
 * 定时器管理器
 * 允许动作的延迟和重复执行
 */
pub struct TimerManager {
    /// 活跃的定时器列表
    timers: Vec<Timer>,
    /// 管理器是否启用
    enabled: bool,
}

impl TimerManager {
    /**
     * 创建新的定时器管理器
     */
    pub fn new() -> Self {
        Self {
            timers: Vec::new(),
            enabled: true,
        }
    }

    /**
     * 启用管理器
     */
    pub fn enable(&mut self) {
        self.enabled = true;
    }

    /**
     * 禁用管理器
     */
    pub fn disable(&mut self) {
        self.enabled = false;
    }

    /**
     * 检查管理器是否启用
     */
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /**
     * 更新所有定时器
     */
    pub fn update(&mut self, time: &Time) {
        if !self.enabled {
            return;
        }

        let delta_time = Time::delta_time();

        // 从后向前遍历以安全地移除完成的定时器
        let mut i = self.timers.len();
        while i > 0 {
            i -= 1;
            if self.timers[i].tick(delta_time) {
                self.timers[i].unload();
                self.timers.remove(i);
            }
        }
    }

    /**
     * 调度一个一次性或重复的计时器
     */
    pub fn schedule<F>(
        &mut self,
        time_in_seconds: f64,
        repeats: bool,
        context: Box<dyn TimerContext>,
        on_time: F,
    ) -> usize
    where
        F: FnMut(&mut dyn TimerContext) + Send + Sync + 'static,
    {
        let mut timer = Timer::new();
        timer.initialize(time_in_seconds, repeats, context, on_time);
        
        self.timers.push(timer);
        self.timers.len() - 1 // 返回定时器的索引
    }

    /**
     * 调度简单定时器（无上下文）
     */
    pub fn schedule_simple<F>(
        &mut self,
        time_in_seconds: f64,
        repeats: bool,
        on_time: F,
    ) -> usize
    where
        F: FnMut(&mut dyn TimerContext) + Send + Sync + 'static,
    {
        self.schedule(time_in_seconds, repeats, Box::new(EmptyContext), on_time)
    }

    /**
     * 停止指定索引的定时器
     */
    pub fn stop_timer(&mut self, index: usize) -> bool {
        if index < self.timers.len() {
            self.timers[index].stop();
            true
        } else {
            false
        }
    }

    /**
     * 重置指定索引的定时器
     */
    pub fn reset_timer(&mut self, index: usize) -> bool {
        if index < self.timers.len() {
            self.timers[index].reset();
            true
        } else {
            false
        }
    }

    /**
     * 获取活跃定时器数量
     */
    pub fn active_timer_count(&self) -> usize {
        self.timers.len()
    }

    /**
     * 清除所有定时器
     */
    pub fn clear(&mut self) {
        for timer in &mut self.timers {
            timer.unload();
        }
        self.timers.clear();
    }

    /**
     * 获取指定索引的定时器
     */
    pub fn get_timer(&self, index: usize) -> Option<&Timer> {
        self.timers.get(index)
    }

    /**
     * 获取指定索引的可变定时器
     */
    pub fn get_timer_mut(&mut self, index: usize) -> Option<&mut Timer> {
        self.timers.get_mut(index)
    }

    /**
     * 移除所有已完成的定时器
     */
    pub fn cleanup_completed(&mut self) {
        self.timers.retain_mut(|timer| {
            if timer.is_done() {
                timer.unload();
                false
            } else {
                true
            }
        });
    }
}

impl Default for TimerManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Mutex};

    // 测试上下文
    #[derive(Debug)]
    struct TestContext {
        pub value: i32,
        pub name: String,
    }

    impl TimerContext for TestContext {
        fn as_any(&self) -> &dyn Any {
            self
        }

        fn as_any_mut(&mut self) -> &mut dyn Any {
            self
        }
    }

    #[test]
    fn test_timer_creation() {
        let timer = Timer::new();
        assert!(!timer.is_done());
        assert_eq!(timer.elapsed_time(), 0.0);
    }

    #[test]
    fn test_timer_simple_initialization() {
        let mut timer = Timer::new();
        let mut callback_called = false;
        
        timer.initialize_simple(1.0, false, move |_context| {
            callback_called = true;
        });
        
        assert!(!timer.is_done());
        assert_eq!(timer.elapsed_time(), 0.0);
    }

    #[test]
    fn test_timer_tick_completion() {
        let mut timer = Timer::new();
        let callback_count = Arc::new(Mutex::new(0));
        let callback_count_clone = Arc::clone(&callback_count);
        
        timer.initialize_simple(1.0, false, move |_context| {
            *callback_count_clone.lock().unwrap() += 1;
        });
        
        // 第一次tick，时间不够
        assert!(!timer.tick(0.5));
        assert!(!timer.is_done());
        assert_eq!(timer.elapsed_time(), 0.5);
        assert_eq!(*callback_count.lock().unwrap(), 0);
        
        // 第二次tick，时间足够
        assert!(timer.tick(0.6));
        assert!(timer.is_done());
        assert_eq!(*callback_count.lock().unwrap(), 1);
    }

    #[test]
    fn test_timer_repeat() {
        let mut timer = Timer::new();
        let callback_count = Arc::new(Mutex::new(0));
        let callback_count_clone = Arc::clone(&callback_count);
        
        timer.initialize_simple(0.5, true, move |_context| {
            *callback_count_clone.lock().unwrap() += 1;
        });
        
        // 多次tick测试重复执行
        assert!(!timer.tick(0.6)); // 第一次触发
        assert_eq!(*callback_count.lock().unwrap(), 1);
        assert!(!timer.is_done());
        
        assert!(!timer.tick(0.5)); // 第二次触发
        assert_eq!(*callback_count.lock().unwrap(), 2);
        assert!(!timer.is_done());
        
        // 停止定时器
        timer.stop();
        assert!(timer.is_done());
    }

    #[test]
    fn test_timer_reset() {
        let mut timer = Timer::new();
        let callback_count = Arc::new(Mutex::new(0));
        let callback_count_clone = Arc::clone(&callback_count);
        
        timer.initialize_simple(1.0, false, move |_context| {
            *callback_count_clone.lock().unwrap() += 1;
        });
        
        // 部分执行后重置
        timer.tick(0.5);
        assert_eq!(timer.elapsed_time(), 0.5);
        
        timer.reset();
        assert_eq!(timer.elapsed_time(), 0.0);
        assert!(!timer.is_done());
        
        // 重新执行
        timer.tick(1.1);
        assert_eq!(*callback_count.lock().unwrap(), 1);
        assert!(timer.is_done());
    }

    #[test]
    fn test_timer_with_context() {
        let mut timer = Timer::new();
        let context = TestContext {
            value: 10,
            name: "test".to_string(),
        };
        
        timer.initialize(1.0, false, Box::new(context), |context| {
            if let Some(test_context) = context.as_any_mut().downcast_mut::<TestContext>() {
                test_context.value += 5;
            }
        });
        
        timer.tick(1.1);
        
        let context = timer.get_context();
        if let Some(test_context) = context.as_any().downcast_ref::<TestContext>() {
            assert_eq!(test_context.value, 15);
            assert_eq!(test_context.name, "test");
        } else {
            panic!("Context type mismatch");
        }
    }

    #[test]
    fn test_timer_manager_creation() {
        let manager = TimerManager::new();
        assert!(manager.enabled());
        assert_eq!(manager.active_timer_count(), 0);
    }

    #[test]
    fn test_timer_manager_schedule_simple() {
        let mut manager = TimerManager::new();
        let callback_count = Arc::new(Mutex::new(0));
        let callback_count_clone = Arc::clone(&callback_count);
        
        let timer_id = manager.schedule_simple(1.0, false, move |_context| {
            *callback_count_clone.lock().unwrap() += 1;
        });
        
        assert_eq!(manager.active_timer_count(), 1);
        assert_eq!(timer_id, 0);
        
        let time = Time::new();
        manager.update(&time);
        
        assert_eq!(*callback_count.lock().unwrap(), 0); // 时间不够
    }

    #[test]
    fn test_timer_manager_schedule_with_context() {
        let mut manager = TimerManager::new();
        let context = TestContext {
            value: 0,
            name: "manager_test".to_string(),
        };
        
        manager.schedule(0.5, false, Box::new(context), |context| {
            if let Some(test_context) = context.as_any_mut().downcast_mut::<TestContext>() {
                test_context.value = 42;
            }
        });
        
        assert_eq!(manager.active_timer_count(), 1);
    }

    #[test]
    fn test_timer_manager_update() {
        let mut manager = TimerManager::new();
        let callback_count = Arc::new(Mutex::new(0));
        let callback_count_clone = Arc::clone(&callback_count);
        
        manager.schedule_simple(0.5, false, move |_context| {
            *callback_count_clone.lock().unwrap() += 1;
        });
        
        // 创建一个模拟的时间对象
        let mut time = Time::new();
        
        // 第一次更新，时间不够
        manager.update(&time);
        assert_eq!(manager.active_timer_count(), 1);
        assert_eq!(*callback_count.lock().unwrap(), 0);
        
        // 手动设置delta_time来模拟时间流逝
        // 注意：这里我们需要用实际的时间更新机制
        // 在实际使用中，Time对象会自动更新delta_time
    }

    #[test]
    fn test_timer_manager_stop_timer() {
        let mut manager = TimerManager::new();
        
        let timer_id = manager.schedule_simple(1.0, true, |_context| {
            // 回调函数
        });
        
        assert_eq!(manager.active_timer_count(), 1);
        
        assert!(manager.stop_timer(timer_id));
        assert!(!manager.stop_timer(999)); // 无效索引
        
        // 定时器被停止但还在列表中
        assert_eq!(manager.active_timer_count(), 1);
        
        let time = Time::new();
        manager.update(&time);
        
        // 更新后被移除
        // 注意：需要足够的时间让tick返回true
    }

    #[test]
    fn test_timer_manager_clear() {
        let mut manager = TimerManager::new();
        
        manager.schedule_simple(1.0, false, |_context| {});
        manager.schedule_simple(2.0, true, |_context| {});
        
        assert_eq!(manager.active_timer_count(), 2);
        
        manager.clear();
        assert_eq!(manager.active_timer_count(), 0);
    }

    #[test]
    fn test_timer_manager_enable_disable() {
        let mut manager = TimerManager::new();
        
        assert!(manager.enabled());
        
        manager.disable();
        assert!(!manager.enabled());
        
        manager.enable();
        assert!(manager.enabled());
    }

    #[test]
    fn test_timer_manager_cleanup_completed() {
        let mut manager = TimerManager::new();
        
        // 添加一个已完成的定时器
        let timer_id = manager.schedule_simple(0.1, false, |_context| {});
        
        // 手动标记为完成
        if let Some(timer) = manager.get_timer_mut(timer_id) {
            timer.stop();
        }
        
        assert_eq!(manager.active_timer_count(), 1);
        
        manager.cleanup_completed();
        assert_eq!(manager.active_timer_count(), 0);
    }

    #[test]
    fn test_timer_manager_get_timer() {
        let mut manager = TimerManager::new();
        
        let timer_id = manager.schedule_simple(1.0, false, |_context| {});
        
        assert!(manager.get_timer(timer_id).is_some());
        assert!(manager.get_timer(999).is_none());
        
        assert!(manager.get_timer_mut(timer_id).is_some());
        assert!(manager.get_timer_mut(999).is_none());
    }
}