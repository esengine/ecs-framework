use std::collections::HashMap;
use std::any::Any;

/**
 * ECS事件类型
 * 定义实体组件系统中的核心事件类型
 */
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ECSEventType {
    // 实体相关事件
    EntityCreated,
    EntityDestroyed,
    EntityEnabled,
    EntityDisabled,
    EntityTagChanged,
    EntityNameChanged,
    
    // 组件相关事件
    ComponentAdded,
    ComponentRemoved,
    ComponentModified,
    ComponentEnabled,
    ComponentDisabled,
    
    // 系统相关事件
    SystemAdded,
    SystemRemoved,
    SystemEnabled,
    SystemDisabled,
    SystemProcessingStart,
    SystemProcessingEnd,
    SystemError,
    
    // 场景相关事件
    SceneCreated,
    SceneDestroyed,
    SceneActivated,
    SceneDeactivated,
    
    // 性能相关事件
    PerformanceWarning,
    PerformanceCritical,
    MemoryUsageHigh,
    
    // 查询相关事件
    QueryExecuted,
    QueryCacheHit,
    QueryCacheMiss,
}

impl ECSEventType {
    /**
     * 转换为字符串表示
     */
    pub fn as_str(&self) -> &'static str {
        match self {
            ECSEventType::EntityCreated => "entity:created",
            ECSEventType::EntityDestroyed => "entity:destroyed",
            ECSEventType::EntityEnabled => "entity:enabled",
            ECSEventType::EntityDisabled => "entity:disabled",
            ECSEventType::EntityTagChanged => "entity:tag:changed",
            ECSEventType::EntityNameChanged => "entity:name:changed",
            ECSEventType::ComponentAdded => "component:added",
            ECSEventType::ComponentRemoved => "component:removed",
            ECSEventType::ComponentModified => "component:modified",
            ECSEventType::ComponentEnabled => "component:enabled",
            ECSEventType::ComponentDisabled => "component:disabled",
            ECSEventType::SystemAdded => "system:added",
            ECSEventType::SystemRemoved => "system:removed",
            ECSEventType::SystemEnabled => "system:enabled",
            ECSEventType::SystemDisabled => "system:disabled",
            ECSEventType::SystemProcessingStart => "system:processing:start",
            ECSEventType::SystemProcessingEnd => "system:processing:end",
            ECSEventType::SystemError => "system:error",
            ECSEventType::SceneCreated => "scene:created",
            ECSEventType::SceneDestroyed => "scene:destroyed",
            ECSEventType::SceneActivated => "scene:activated",
            ECSEventType::SceneDeactivated => "scene:deactivated",
            ECSEventType::PerformanceWarning => "performance:warning",
            ECSEventType::PerformanceCritical => "performance:critical",
            ECSEventType::MemoryUsageHigh => "memory:usage:high",
            ECSEventType::QueryExecuted => "query:executed",
            ECSEventType::QueryCacheHit => "query:cache:hit",
            ECSEventType::QueryCacheMiss => "query:cache:miss",
        }
    }
}

/**
 * 事件优先级
 */
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum EventPriority {
    Lowest = 0,
    Low = 25,
    Normal = 50,
    High = 75,
    Highest = 100,
    Critical = 200,
}

/**
 * 事件数据
 * 包含事件的所有信息
 */
#[derive(Debug)]
pub struct Event {
    pub event_type: ECSEventType,
    pub priority: EventPriority,
    pub timestamp: u64,
    pub entity_id: Option<u32>,
    pub data: Option<Box<dyn Any + Send + Sync>>,
    pub metadata: HashMap<String, String>,
}

impl Event {
    /**
     * 创建新事件
     */
    pub fn new(event_type: ECSEventType, priority: EventPriority) -> Self {
        Self {
            event_type,
            priority,
            timestamp: current_timestamp(),
            entity_id: None,
            data: None,
            metadata: HashMap::new(),
        }
    }

    /**
     * 设置实体ID
     */
    pub fn with_entity_id(mut self, entity_id: u32) -> Self {
        self.entity_id = Some(entity_id);
        self
    }

    /**
     * 设置事件数据
     */
    pub fn with_data<T: Any + Send + Sync>(mut self, data: T) -> Self {
        self.data = Some(Box::new(data));
        self
    }

    /**
     * 添加元数据
     */
    pub fn with_metadata<K: Into<String>, V: Into<String>>(mut self, key: K, value: V) -> Self {
        self.metadata.insert(key.into(), value.into());
        self
    }

    /**
     * 获取类型化的数据
     */
    pub fn get_data<T: Any>(&self) -> Option<&T> {
        self.data.as_ref()?.downcast_ref::<T>()
    }

    /**
     * 获取元数据
     */
    pub fn get_metadata(&self, key: &str) -> Option<&String> {
        self.metadata.get(key)
    }
}

/**
 * 事件监听器trait
 */
pub trait EventListener: Send + Sync {
    /**
     * 处理事件
     */
    fn handle_event(&mut self, event: &Event);

    /**
     * 获取监听器感兴趣的事件类型
     */
    fn get_interested_events(&self) -> Vec<ECSEventType>;

    /**
     * 获取监听器优先级
     */
    fn get_priority(&self) -> EventPriority {
        EventPriority::Normal
    }

    /**
     * 检查是否应该处理此事件
     */
    fn should_handle(&self, event: &Event) -> bool {
        self.get_interested_events().contains(&event.event_type)
    }
}

/**
 * 事件回调函数类型
 */
pub type EventCallback = Box<dyn Fn(&Event) + Send + Sync>;

/**
 * 监听器注册信息
 */
struct ListenerRegistration {
    callback: EventCallback,
    id: u32,
    priority: EventPriority,
}

/**
 * 事件总线
 * 负责事件的分发和监听器管理
 */
pub struct EventBus {
    listeners: HashMap<ECSEventType, Vec<ListenerRegistration>>,
    next_listener_id: u32,
    event_queue: Vec<Event>,
    stats: EventBusStats,
}

/**
 * 事件总线统计信息
 */
#[derive(Debug, Default)]
pub struct EventBusStats {
    pub total_events_fired: u64,
    pub total_listeners_notified: u64,
    pub events_by_type: HashMap<ECSEventType, u32>,
    pub listener_count: u32,
    pub queue_size: usize,
}

impl EventBus {
    /**
     * 创建新的事件总线
     */
    pub fn new() -> Self {
        Self {
            listeners: HashMap::new(),
            next_listener_id: 1,
            event_queue: Vec::new(),
            stats: EventBusStats::default(),
        }
    }

    /**
     * 注册事件回调函数
     */
    pub fn register_callback<F>(&mut self, event_type: ECSEventType, callback: F, priority: EventPriority) -> u32
    where
        F: Fn(&Event) + Send + Sync + 'static,
    {
        let id = self.next_listener_id;
        self.next_listener_id += 1;

        let registration = ListenerRegistration {
            callback: Box::new(callback),
            id,
            priority,
        };

        let listeners = self.listeners.entry(event_type).or_insert_with(Vec::new);
        listeners.push(registration);
        
        // 按优先级排序
        listeners.sort_by(|a, b| b.priority.cmp(&a.priority));

        self.stats.listener_count += 1;
        id
    }

    /**
     * 注册多个事件类型的回调
     */
    pub fn register_callback_multi<F>(&mut self, event_types: Vec<ECSEventType>, callback: F, priority: EventPriority) -> Vec<u32>
    where
        F: Fn(&Event) + Send + Sync + Clone + 'static,
    {
        let mut ids = Vec::new();
        for event_type in event_types {
            let id = self.register_callback(event_type, callback.clone(), priority);
            ids.push(id);
        }
        ids
    }

    /**
     * 注销事件监听器
     */
    pub fn unregister_callback(&mut self, listener_id: u32) -> bool {
        let mut found = false;
        
        for listeners in self.listeners.values_mut() {
            listeners.retain(|reg| {
                if reg.id == listener_id {
                    found = true;
                    false
                } else {
                    true
                }
            });
        }

        if found {
            self.stats.listener_count -= 1;
        }

        found
    }

    /**
     * 立即触发事件
     */
    pub fn fire_event(&mut self, event: Event) {
        self.stats.total_events_fired += 1;
        *self.stats.events_by_type.entry(event.event_type).or_insert(0) += 1;

        if let Some(listeners) = self.listeners.get(&event.event_type) {
            for registration in listeners {
                (registration.callback)(&event);
                self.stats.total_listeners_notified += 1;
            }
        }
    }

    /**
     * 将事件添加到队列（延迟处理）
     */
    pub fn queue_event(&mut self, event: Event) {
        self.event_queue.push(event);
        self.stats.queue_size = self.event_queue.len();
    }

    /**
     * 处理队列中的所有事件
     */
    pub fn process_queued_events(&mut self) {
        let events = std::mem::take(&mut self.event_queue);
        for event in events {
            self.fire_event(event);
        }
        self.stats.queue_size = 0;
    }

    /**
     * 清空事件队列
     */
    pub fn clear_queue(&mut self) {
        self.event_queue.clear();
        self.stats.queue_size = 0;
    }

    /**
     * 获取统计信息
     */
    pub fn get_stats(&self) -> &EventBusStats {
        &self.stats
    }

    /**
     * 检查是否有指定类型的监听器
     */
    pub fn has_listeners(&self, event_type: ECSEventType) -> bool {
        self.listeners.get(&event_type).map_or(false, |listeners| !listeners.is_empty())
    }

    /**
     * 获取指定事件类型的监听器数量
     */
    pub fn get_listener_count(&self, event_type: ECSEventType) -> usize {
        self.listeners.get(&event_type).map_or(0, |listeners| listeners.len())
    }
}

impl Default for EventBus {
    fn default() -> Self {
        Self::new()
    }
}

/**
 * 简单的事件监听器实现
 */
pub struct SimpleEventListener<F> 
where
    F: Fn(&Event) + Send + Sync,
{
    handler: F,
    interested_events: Vec<ECSEventType>,
    priority: EventPriority,
}

impl<F> SimpleEventListener<F>
where
    F: Fn(&Event) + Send + Sync,
{
    /**
     * 创建简单的事件监听器
     */
    pub fn new(handler: F, interested_events: Vec<ECSEventType>) -> Self {
        Self {
            handler,
            interested_events,
            priority: EventPriority::Normal,
        }
    }

    /**
     * 设置优先级
     */
    pub fn with_priority(mut self, priority: EventPriority) -> Self {
        self.priority = priority;
        self
    }
}

impl<F> EventListener for SimpleEventListener<F>
where
    F: Fn(&Event) + Send + Sync,
{
    fn handle_event(&mut self, event: &Event) {
        (self.handler)(event);
    }

    fn get_interested_events(&self) -> Vec<ECSEventType> {
        self.interested_events.clone()
    }

    fn get_priority(&self) -> EventPriority {
        self.priority
    }
}

/**
 * 获取当前时间戳（毫秒）
 */
fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Mutex};

    #[test]
    fn test_event_creation() {
        let event = Event::new(ECSEventType::EntityCreated, EventPriority::Normal)
            .with_entity_id(42)
            .with_data("test data".to_string())
            .with_metadata("key", "value");

        assert_eq!(event.event_type, ECSEventType::EntityCreated);
        assert_eq!(event.priority, EventPriority::Normal);
        assert_eq!(event.entity_id, Some(42));
        assert_eq!(event.get_data::<String>(), Some(&"test data".to_string()));
        assert_eq!(event.get_metadata("key"), Some(&"value".to_string()));
    }

    #[test]
    fn test_event_bus_basic() {
        let mut event_bus = EventBus::new();
        let events_received = Arc::new(Mutex::new(Vec::new()));
        let events_clone = events_received.clone();

        // 注册回调
        let listener_id = event_bus.register_callback(
            ECSEventType::EntityCreated,
            move |event: &Event| {
                if let Ok(mut events) = events_clone.lock() {
                    events.push(event.event_type);
                }
            },
            EventPriority::Normal,
        );

        // 触发事件
        let event = Event::new(ECSEventType::EntityCreated, EventPriority::Normal)
            .with_entity_id(123);
        event_bus.fire_event(event);

        // 验证事件被接收
        let events = events_received.lock().unwrap();
        assert_eq!(events.len(), 1);
        assert_eq!(events[0], ECSEventType::EntityCreated);

        // 验证统计信息
        let stats = event_bus.get_stats();
        assert_eq!(stats.total_events_fired, 1);
        assert_eq!(stats.total_listeners_notified, 1);

        // 注销监听器
        assert!(event_bus.unregister_callback(listener_id));
        assert!(!event_bus.unregister_callback(listener_id)); // 重复注销应该失败
    }

    #[test]
    fn test_event_queue() {
        let mut event_bus = EventBus::new();
        let events_received = Arc::new(Mutex::new(Vec::new()));
        let events_clone1 = events_received.clone();
        let events_clone2 = events_received.clone();

        event_bus.register_callback(
            ECSEventType::EntityCreated,
            move |event: &Event| {
                if let Ok(mut events) = events_clone1.lock() {
                    events.push(event.event_type);
                }
            },
            EventPriority::Normal,
        );

        event_bus.register_callback(
            ECSEventType::EntityDestroyed,
            move |event: &Event| {
                if let Ok(mut events) = events_clone2.lock() {
                    events.push(event.event_type);
                }
            },
            EventPriority::Normal,
        );

        // 将事件加入队列
        let event1 = Event::new(ECSEventType::EntityCreated, EventPriority::Normal);
        let event2 = Event::new(ECSEventType::EntityDestroyed, EventPriority::Normal);

        event_bus.queue_event(event1);
        event_bus.queue_event(event2);

        // 此时事件还没有被处理
        let events = events_received.lock().unwrap();
        assert_eq!(events.len(), 0);
        drop(events);

        // 处理队列中的事件
        event_bus.process_queued_events();

        let events = events_received.lock().unwrap();
        assert_eq!(events.len(), 2);
        assert_eq!(events[0], ECSEventType::EntityCreated);
        assert_eq!(events[1], ECSEventType::EntityDestroyed);
    }

    #[test]
    fn test_simple_event_listener() {
        let mut event_bus = EventBus::new();
        let received_events = Arc::new(Mutex::new(Vec::new()));
        let events_clone = received_events.clone();

        event_bus.register_callback(
            ECSEventType::ComponentAdded,
            move |event: &Event| {
                if let Ok(mut events) = events_clone.lock() {
                    events.push(event.event_type);
                }
            },
            EventPriority::Normal,
        );

        let event = Event::new(ECSEventType::ComponentAdded, EventPriority::Normal);
        event_bus.fire_event(event);

        let events = received_events.lock().unwrap();
        assert_eq!(events.len(), 1);
        assert_eq!(events[0], ECSEventType::ComponentAdded);
    }
}