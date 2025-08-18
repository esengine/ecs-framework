// ECS Framework Rust Core - WASM Entry Point
// 只暴露用户需要操作的核心API，内部实现保持私有

mod core;
mod storage;
mod utils;
mod wasm;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// 只导出WASM包装器，隐藏内部实现
pub use wasm::{EntityWrapper, EntityManagerWrapper, QuerySystemWrapper, SceneWrapper, ComponentWrapper, ComponentRegistryWrapper};

// 导出核心类型供内部使用（不暴露给JavaScript）
pub use core::{Entity, Component, ComponentRegistry, BaseComponent, EntityManager, QuerySystem, QueryResult, Scene, System, EntitySystem, ProcessingSystem, IntervalSystem, SystemManager, ECSEventType, EventPriority, Event, EventListener, EventBus, EventBusStats, SimpleEventListener, ArchetypeSystem, Archetype, ArchetypeId, ArchetypeQueryResult, ArchetypeSystemStats, EntityBuilder, QueryBuilder, ECSFluentAPI, FluentAPIStats, PassiveSystem, PassiveSystemBuilder, ComponentBuilder, BaseComponentBuilder, ComponentBuilderFactory, ComponentBuilderStats, EntityBatchOperator, BatchOperatorStats, SceneBuilder, SceneTemplate, SceneBuilderStats, SceneBuilderFactory, SceneBuilderManager};
pub use storage::{ComponentStorage, ComponentStorageManager, SoAStorage, SoAFieldType, SoAFieldMetadata, SoAStorageStats, SoAFieldStats};
pub use utils::{SparseSet, Time, Matcher, QueryCondition, ComponentType, IdentifierPool, IdentifierPoolStats, ComponentPool, ComponentPoolManager, ComponentPoolStats, ComponentPoolManagerStats, PoolStatsSummary, DirtyTrackingSystem, DirtyFlag, DirtyData, DirtyTrackingStats, DirtyListener, DirtyListenerConfig, PerformanceMonitor, PerformanceData, PerformanceStats, PerformanceWarning, PerformanceWarningType, WarningSeverity, PerformanceThresholds, ThresholdPair, Timer, TimerManager, ITimer, TimerContext, TimerCallback, EmptyContext, Pool, PoolManager, Poolable, PoolStats, DebugManager, EntityDataCollector, SystemDataCollector, ComponentDataCollector, PerformanceDataCollector, DebugEntityData, DebugComponentInfo, DebugSystemInfo, DebugArchetypeInfo, DebugPerformanceInfo, DebugWarning, WarningLevel, DebugStats, DebugData, IUpdatable, IUpdatableComparer, SceneComponent, SceneComponentTrait, UpdatableManager, SceneComponentManager, is_updatable, NumberExtension, TypeUtils, StringExtension, CollectionExtension};

#[wasm_bindgen(start)]
pub fn main() {
    utils::set_panic_hook();
    console_log!("ECS Core Rust initialized - WASM API ready");
}