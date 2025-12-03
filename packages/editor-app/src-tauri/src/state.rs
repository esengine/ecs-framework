//! Application state definitions.
//! 应用状态定义。
//!
//! Centralized state management for the Tauri application.
//! Tauri 应用的集中状态管理。

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as TokioMutex;
use crate::profiler_ws::ProfilerServer;

/// Project paths state.
/// 项目路径状态。
///
/// Stores the current project path and other path-related information.
/// 存储当前项目路径和其他路径相关信息。
pub type ProjectPaths = Arc<Mutex<HashMap<String, String>>>;

/// Script watcher state.
/// 脚本监视器状态。
///
/// Manages file watchers for hot reload functionality.
/// 管理用于热重载功能的文件监视器。
pub struct ScriptWatcherState {
    /// Active watchers keyed by project path | 按项目路径索引的活动监视器
    pub watchers: Arc<TokioMutex<HashMap<String, WatcherHandle>>>,
}

/// Handle to a running file watcher.
/// 正在运行的文件监视器句柄。
pub struct WatcherHandle {
    /// Shutdown signal sender | 关闭信号发送器
    pub shutdown_tx: tokio::sync::oneshot::Sender<()>,
}

impl ScriptWatcherState {
    pub fn new() -> Self {
        Self {
            watchers: Arc::new(TokioMutex::new(HashMap::new())),
        }
    }
}

impl Default for ScriptWatcherState {
    fn default() -> Self {
        Self::new()
    }
}

/// Profiler server state
///
/// Manages the lifecycle of the WebSocket profiler server.
pub struct ProfilerState {
    pub server: Arc<TokioMutex<Option<Arc<ProfilerServer>>>>,
}

impl ProfilerState {
    pub fn new() -> Self {
        Self {
            server: Arc::new(TokioMutex::new(None)),
        }
    }
}

impl Default for ProfilerState {
    fn default() -> Self {
        Self::new()
    }
}
