//! Profiler server commands
//!
//! WebSocket profiler server management.

use std::sync::Arc;
use crate::profiler_ws::ProfilerServer;
use crate::state::ProfilerState;

/// Start the profiler WebSocket server
#[tauri::command]
pub async fn start_profiler_server(
    port: u16,
    state: tauri::State<'_, ProfilerState>,
) -> Result<String, String> {
    let mut server_lock = state.server.lock().await;

    if server_lock.is_some() {
        return Err("Profiler server is already running".to_string());
    }

    let server = Arc::new(ProfilerServer::new(port));

    match server.start().await {
        Ok(_) => {
            *server_lock = Some(server);
            Ok(format!("Profiler server started on port {}", port))
        }
        Err(e) => Err(format!("Failed to start profiler server: {}", e)),
    }
}

/// Stop the profiler WebSocket server
#[tauri::command]
pub async fn stop_profiler_server(
    state: tauri::State<'_, ProfilerState>,
) -> Result<String, String> {
    let mut server_lock = state.server.lock().await;

    if server_lock.is_none() {
        return Err("Profiler server is not running".to_string());
    }

    if let Some(server) = server_lock.as_ref() {
        server.stop().await;
    }

    *server_lock = None;
    Ok("Profiler server stopped".to_string())
}

/// Get profiler server status
#[tauri::command]
pub async fn get_profiler_status(
    state: tauri::State<'_, ProfilerState>,
) -> Result<bool, String> {
    let server_lock = state.server.lock().await;
    Ok(server_lock.is_some())
}
