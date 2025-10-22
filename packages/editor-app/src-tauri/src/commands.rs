use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::profiler_ws::ProfilerServer;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectInfo {
    pub name: String,
    pub path: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EditorConfig {
    pub theme: String,
    pub auto_save: bool,
    pub recent_projects: Vec<String>,
}

impl Default for EditorConfig {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            auto_save: true,
            recent_projects: Vec::new(),
        }
    }
}

pub struct ProfilerState {
    pub server: Arc<Mutex<Option<Arc<ProfilerServer>>>>,
}

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

#[tauri::command]
pub async fn stop_profiler_server(
    state: tauri::State<'_, ProfilerState>,
) -> Result<String, String> {
    let mut server_lock = state.server.lock().await;

    if server_lock.is_none() {
        return Err("Profiler server is not running".to_string());
    }

    *server_lock = None;
    Ok("Profiler server stopped".to_string())
}

#[tauri::command]
pub async fn get_profiler_status(
    state: tauri::State<'_, ProfilerState>,
) -> Result<bool, String> {
    let server_lock = state.server.lock().await;
    Ok(server_lock.is_some())
}

#[tauri::command]
pub async fn read_behavior_tree_file(file_path: String) -> Result<String, String> {
    use std::fs;

    // 使用 Rust 标准库直接读取文件，绕过 Tauri 的 scope 限制
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file {}: {}", file_path, e))
}

#[tauri::command]
pub async fn write_behavior_tree_file(file_path: String, content: String) -> Result<(), String> {
    use std::fs;

    // 使用 Rust 标准库直接写入文件
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file {}: {}", file_path, e))
}

