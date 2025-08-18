pub mod sparse_set;
pub mod time;
pub mod matcher;
pub mod identifier_pool;
pub mod component_pool;
pub mod dirty_tracking;
pub mod performance_monitor;
pub mod timer;
pub mod pool;
pub mod debug;
pub mod updatable;
pub mod extensions;

pub use sparse_set::SparseSet;
pub use time::Time;
pub use matcher::{Matcher, QueryCondition, ComponentType};
pub use identifier_pool::{IdentifierPool, IdentifierPoolStats};
pub use component_pool::{ComponentPool, ComponentPoolManager, ComponentPoolStats, ComponentPoolManagerStats, PoolStatsSummary};
pub use dirty_tracking::{DirtyTrackingSystem, DirtyFlag, DirtyData, DirtyTrackingStats, DirtyListener, DirtyListenerConfig};
pub use performance_monitor::{PerformanceMonitor, PerformanceData, PerformanceStats, PerformanceWarning, PerformanceWarningType, WarningSeverity, PerformanceThresholds, ThresholdPair};
pub use timer::{Timer, TimerManager, ITimer, TimerContext, TimerCallback, EmptyContext};
pub use pool::{Pool, PoolManager, Poolable, PoolStats};
pub use debug::{DebugManager, EntityDataCollector, SystemDataCollector, ComponentDataCollector, PerformanceDataCollector, DebugEntityData, DebugComponentInfo, DebugSystemInfo, DebugArchetypeInfo, DebugPerformanceInfo, DebugWarning, WarningLevel, DebugStats, DebugData};
pub use updatable::{IUpdatable, IUpdatableComparer, SceneComponent, SceneComponentTrait, UpdatableManager, SceneComponentManager, is_updatable};
pub use extensions::{NumberExtension, TypeUtils, StringExtension, CollectionExtension};

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn error(msg: String);
}

#[cfg(feature = "console_error_panic_hook")]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}

#[cfg(not(feature = "console_error_panic_hook"))]
pub fn set_panic_hook() {}

#[allow(dead_code)]
pub fn log_error(msg: &str) {
    error(msg.to_string());
}