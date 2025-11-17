//! Application state definitions
//!
//! Centralized state management for the Tauri application.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as TokioMutex;
use crate::profiler_ws::ProfilerServer;

/// Project paths state
///
/// Stores the current project path and other path-related information.
pub type ProjectPaths = Arc<Mutex<HashMap<String, String>>>;

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
