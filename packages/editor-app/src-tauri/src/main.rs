// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri::AppHandle;
use tauri::Emitter;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::io::Write;
use ecs_editor_lib::profiler_ws::ProfilerServer;

// IPC Commands
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to ECS Framework Editor.", name)
}

#[tauri::command]
fn open_project(path: String) -> Result<String, String> {
    // 项目打开逻辑
    Ok(format!("Project opened: {}", path))
}

#[tauri::command]
fn save_project(path: String, data: String) -> Result<(), String> {
    // 项目保存逻辑
    std::fs::write(&path, data)
        .map_err(|e| format!("Failed to save project: {}", e))?;
    Ok(())
}

#[tauri::command]
fn export_binary(data: Vec<u8>, output_path: String) -> Result<(), String> {
    std::fs::write(&output_path, data)
        .map_err(|e| format!("Failed to export binary: {}", e))?;
    Ok(())
}

#[tauri::command]
fn create_directory(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    Ok(())
}

#[tauri::command]
fn write_file_content(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(())
}

#[tauri::command]
fn path_exists(path: String) -> Result<bool, String> {
    use std::path::Path;
    Ok(Path::new(&path).exists())
}

#[tauri::command]
fn rename_file_or_folder(old_path: String, new_path: String) -> Result<(), String> {
    std::fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Failed to rename: {}", e))?;
    Ok(())
}

#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    std::fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete file: {}", e))?;
    Ok(())
}

#[tauri::command]
fn delete_folder(path: String) -> Result<(), String> {
    std::fs::remove_dir_all(&path)
        .map_err(|e| format!("Failed to delete folder: {}", e))?;
    Ok(())
}

#[tauri::command]
fn create_file(path: String) -> Result<(), String> {
    use std::fs::File;
    File::create(&path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn open_project_dialog(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let folder = app.dialog()
        .file()
        .set_title("Select Project Directory")
        .blocking_pick_folder();

    Ok(folder.map(|path| path.to_string()))
}

#[tauri::command]
async fn save_scene_dialog(app: AppHandle, default_name: Option<String>) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let mut dialog = app.dialog()
        .file()
        .set_title("Save ECS Scene")
        .add_filter("ECS Scene Files", &["ecs"]);

    if let Some(name) = default_name {
        dialog = dialog.set_file_name(&name);
    }

    let file = dialog.blocking_save_file();

    Ok(file.map(|path| path.to_string()))
}

#[tauri::command]
async fn open_scene_dialog(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file = app.dialog()
        .file()
        .set_title("Open ECS Scene")
        .add_filter("ECS Scene Files", &["ecs"])
        .blocking_pick_file();

    Ok(file.map(|path| path.to_string()))
}

#[tauri::command]
async fn open_behavior_tree_dialog(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file = app.dialog()
        .file()
        .set_title("Select Behavior Tree")
        .add_filter("Behavior Tree Files", &["btree"])
        .blocking_pick_file();

    Ok(file.map(|path| path.to_string()))
}

#[tauri::command]
fn scan_behavior_trees(project_path: String) -> Result<Vec<String>, String> {
    use std::path::Path;
    use std::fs;

    let behaviors_path = Path::new(&project_path).join(".ecs").join("behaviors");

    if !behaviors_path.exists() {
        fs::create_dir_all(&behaviors_path)
            .map_err(|e| format!("Failed to create behaviors directory: {}", e))?;
        return Ok(Vec::new());
    }

    let mut btree_files = Vec::new();
    scan_directory_recursive(&behaviors_path, &behaviors_path, &mut btree_files)?;

    Ok(btree_files)
}

fn scan_directory_recursive(
    base_path: &std::path::Path,
    current_path: &std::path::Path,
    results: &mut Vec<String>
) -> Result<(), String> {
    use std::fs;

    let entries = fs::read_dir(current_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.is_dir() {
            scan_directory_recursive(base_path, &path, results)?;
        } else if path.extension().and_then(|s| s.to_str()) == Some("btree") {
            if let Ok(relative) = path.strip_prefix(base_path) {
                let relative_str = relative.to_string_lossy()
                    .replace('\\', "/")
                    .trim_end_matches(".btree")
                    .to_string();
                results.push(relative_str);
            }
        }
    }

    Ok(())
}

#[tauri::command]
fn scan_directory(path: String, pattern: String) -> Result<Vec<String>, String> {
    use glob::glob;
    use std::path::Path;

    let base_path = Path::new(&path);
    if !base_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    let separator = if path.contains('\\') { '\\' } else { '/' };
    let glob_pattern = format!("{}{}{}", path.trim_end_matches(&['/', '\\'][..]), separator, pattern);
    let normalized_pattern = if cfg!(windows) {
        glob_pattern.replace('/', "\\")
    } else {
        glob_pattern.replace('\\', "/")
    };

    let mut files = Vec::new();

    match glob(&normalized_pattern) {
        Ok(entries) => {
            for entry in entries {
                match entry {
                    Ok(path) => {
                        if path.is_file() {
                            files.push(path.to_string_lossy().to_string());
                        }
                    }
                    Err(e) => eprintln!("Error reading entry: {}", e),
                }
            }
        }
        Err(e) => return Err(format!("Failed to scan directory: {}", e)),
    }

    Ok(files)
}

#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file {}: {}", path, e))
}

#[derive(serde::Serialize)]
struct DirectoryEntry {
    name: String,
    path: String,
    is_dir: bool,
    size: Option<u64>,
    modified: Option<u64>,
}

#[tauri::command]
fn list_directory(path: String) -> Result<Vec<DirectoryEntry>, String> {
    use std::fs;
    use std::path::Path;

    let dir_path = Path::new(&path);
    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let mut entries = Vec::new();

    match fs::read_dir(dir_path) {
        Ok(read_dir) => {
            for entry in read_dir {
                match entry {
                    Ok(entry) => {
                        let entry_path = entry.path();
                        if let Some(name) = entry_path.file_name() {
                            let is_dir = entry_path.is_dir();

                            // 获取文件元数据
                            let (size, modified) = match fs::metadata(&entry_path) {
                                Ok(metadata) => {
                                    let size = if is_dir {
                                        None
                                    } else {
                                        Some(metadata.len())
                                    };

                                    let modified = metadata.modified()
                                        .ok()
                                        .and_then(|time| {
                                            time.duration_since(std::time::UNIX_EPOCH)
                                                .ok()
                                                .map(|d| d.as_secs())
                                        });

                                    (size, modified)
                                }
                                Err(_) => (None, None),
                            };

                            entries.push(DirectoryEntry {
                                name: name.to_string_lossy().to_string(),
                                path: entry_path.to_string_lossy().to_string(),
                                is_dir,
                                size,
                                modified,
                            });
                        }
                    }
                    Err(e) => eprintln!("Error reading directory entry: {}", e),
                }
            }
        }
        Err(e) => return Err(format!("Failed to read directory: {}", e)),
    }

    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

#[tauri::command]
fn set_project_base_path(
    path: String,
    state: tauri::State<Arc<Mutex<HashMap<String, String>>>>
) -> Result<(), String> {
    let mut paths = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    paths.insert("current".to_string(), path);
    Ok(())
}

#[tauri::command]
fn toggle_devtools(app: AppHandle) -> Result<(), String> {
    #[cfg(debug_assertions)]
    {
        if let Some(window) = app.get_webview_window("main") {
            if window.is_devtools_open() {
                window.close_devtools();
            } else {
                window.open_devtools();
            }
            Ok(())
        } else {
            Err("Window not found".to_string())
        }
    }

    #[cfg(not(debug_assertions))]
    {
        Err("DevTools are only available in debug mode".to_string())
    }
}

// Profiler State
pub struct ProfilerState {
    pub server: Arc<tokio::sync::Mutex<Option<Arc<ProfilerServer>>>>,
}

#[tauri::command]
async fn start_profiler_server(
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
async fn stop_profiler_server(
    state: tauri::State<'_, ProfilerState>,
) -> Result<String, String> {
    let mut server_lock = state.server.lock().await;

    if server_lock.is_none() {
        return Err("Profiler server is not running".to_string());
    }

    // 调用 stop 方法正确关闭服务器
    if let Some(server) = server_lock.as_ref() {
        server.stop().await;
    }

    *server_lock = None;
    Ok("Profiler server stopped".to_string())
}

#[tauri::command]
async fn get_profiler_status(
    state: tauri::State<'_, ProfilerState>,
) -> Result<bool, String> {
    let server_lock = state.server.lock().await;
    Ok(server_lock.is_some())
}

#[tauri::command]
async fn read_behavior_tree_file(file_path: String) -> Result<String, String> {
    use std::fs;

    // 使用 Rust 标准库直接读取文件，绕过 Tauri 的 scope 限制
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file {}: {}", file_path, e))
}

#[tauri::command]
async fn write_behavior_tree_file(file_path: String, content: String) -> Result<(), String> {
    use std::fs;

    // 使用 Rust 标准库直接写入文件
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file {}: {}", file_path, e))
}

#[tauri::command]
async fn write_binary_file(file_path: String, content: Vec<u8>) -> Result<(), String> {
    use std::fs;

    // 写入二进制文件
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write binary file {}: {}", file_path, e))
}

#[tauri::command]
async fn read_global_blackboard(project_path: String) -> Result<String, String> {
    use std::fs;
    use std::path::Path;

    let config_path = Path::new(&project_path).join(".ecs").join("global-blackboard.json");

    if !config_path.exists() {
        return Ok(String::from(r#"{"version":"1.0","variables":[]}"#));
    }

    fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read global blackboard: {}", e))
}

#[tauri::command]
async fn write_global_blackboard(project_path: String, content: String) -> Result<(), String> {
    use std::fs;
    use std::path::Path;

    let ecs_dir = Path::new(&project_path).join(".ecs");
    let config_path = ecs_dir.join("global-blackboard.json");

    // 创建 .ecs 目录（如果不存在）
    if !ecs_dir.exists() {
        fs::create_dir_all(&ecs_dir)
            .map_err(|e| format!("Failed to create .ecs directory: {}", e))?;
    }

    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write global blackboard: {}", e))
}

#[tauri::command]
fn open_file_with_default_app(file_path: String) -> Result<(), String> {
    use std::process::Command;

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
fn show_in_folder(file_path: String) -> Result<(), String> {
    use std::process::Command;

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(["/select,", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to show in folder: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-R", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to show in folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        use std::path::Path;
        let path = Path::new(&file_path);
        let parent = path.parent()
            .ok_or_else(|| "Failed to get parent directory".to_string())?;

        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| format!("Failed to show in folder: {}", e))?;
    }

    Ok(())
}

#[derive(serde::Serialize, Clone)]
struct BuildProgress {
    step: String,
    output: Option<String>,
}

#[tauri::command]
fn read_file_as_base64(file_path: String) -> Result<String, String> {
    use std::fs;
    use base64::{Engine as _, engine::general_purpose};

    let file_content = fs::read(&file_path)
        .map_err(|e| format!("Failed to read file {}: {}", file_path, e))?;

    let base64_content = general_purpose::STANDARD.encode(&file_content);

    Ok(base64_content)
}

#[tauri::command]
async fn build_plugin(plugin_folder: String, app: AppHandle) -> Result<String, String> {
    use std::fs;
    use std::path::Path;
    use std::process::Command;
    use std::io::Write;
    use zip::write::FileOptions;

    let plugin_path = Path::new(&plugin_folder);
    if !plugin_path.exists() {
        return Err(format!("Plugin folder does not exist: {}", plugin_folder));
    }

    let package_json_path = plugin_path.join("package.json");
    if !package_json_path.exists() {
        return Err("package.json not found in plugin folder".to_string());
    }

    let build_cache_dir = plugin_path.join(".build-cache");
    if !build_cache_dir.exists() {
        fs::create_dir_all(&build_cache_dir)
            .map_err(|e| format!("Failed to create .build-cache directory: {}", e))?;
    }

    let npm_command = if cfg!(target_os = "windows") {
        "npm.cmd"
    } else {
        "npm"
    };

    app.emit(
        "plugin-build-progress",
        BuildProgress {
            step: "install".to_string(),
            output: None,
        },
    )
    .ok();

    let install_output = Command::new(npm_command)
        .args(["install"])
        .current_dir(&plugin_folder)
        .output()
        .map_err(|e| format!("Failed to run npm install: {}", e))?;

    if !install_output.status.success() {
        return Err(format!(
            "npm install failed: {}",
            String::from_utf8_lossy(&install_output.stderr)
        ));
    }

    app.emit(
        "plugin-build-progress",
        BuildProgress {
            step: "build".to_string(),
            output: None,
        },
    )
    .ok();

    let build_output = Command::new(npm_command)
        .args(["run", "build"])
        .current_dir(&plugin_folder)
        .output()
        .map_err(|e| format!("Failed to run npm run build: {}", e))?;

    if !build_output.status.success() {
        return Err(format!(
            "npm run build failed: {}",
            String::from_utf8_lossy(&build_output.stderr)
        ));
    }

    let dist_path = plugin_path.join("dist");
    if !dist_path.exists() {
        return Err("dist directory not found after build".to_string());
    }

    app.emit(
        "plugin-build-progress",
        BuildProgress {
            step: "package".to_string(),
            output: None,
        },
    )
    .ok();

    let zip_path = build_cache_dir.join("index.zip");
    let zip_file = fs::File::create(&zip_path)
        .map_err(|e| format!("Failed to create zip file: {}", e))?;

    let mut zip = zip::ZipWriter::new(zip_file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    let package_json_content = fs::read(&package_json_path)
        .map_err(|e| format!("Failed to read package.json: {}", e))?;
    zip.start_file("package.json", options)
        .map_err(|e| format!("Failed to add package.json to zip: {}", e))?;
    zip.write_all(&package_json_content)
        .map_err(|e| format!("Failed to write package.json to zip: {}", e))?;

    add_directory_to_zip(&mut zip, plugin_path, &dist_path, options)?;

    zip.finish()
        .map_err(|e| format!("Failed to finalize zip: {}", e))?;

    app.emit(
        "plugin-build-progress",
        BuildProgress {
            step: "complete".to_string(),
            output: None,
        },
    )
    .ok();

    Ok(zip_path.to_string_lossy().to_string())
}

fn add_directory_to_zip<W: std::io::Write + std::io::Seek>(
    zip: &mut zip::ZipWriter<W>,
    base_path: &std::path::Path,
    current_path: &std::path::Path,
    options: zip::write::FileOptions,
) -> Result<(), String> {
    use std::fs;

    let entries = fs::read_dir(current_path)
        .map_err(|e| format!("Failed to read directory {}: {}", current_path.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_dir() {
            add_directory_to_zip(zip, base_path, &path, options)?;
        } else {
            let relative_path = path
                .strip_prefix(base_path)
                .map_err(|e| format!("Failed to get relative path: {}", e))?;

            let zip_path = relative_path.to_string_lossy().replace('\\', "/");

            let file_content = fs::read(&path)
                .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;

            zip.start_file(&zip_path, options)
                .map_err(|e| format!("Failed to add file {} to zip: {}", zip_path, e))?;

            zip.write_all(&file_content)
                .map_err(|e| format!("Failed to write file {} to zip: {}", zip_path, e))?;
        }
    }

    Ok(())
}

fn main() {
    let project_paths: Arc<Mutex<HashMap<String, String>>> = Arc::new(Mutex::new(HashMap::new()));
    let project_paths_clone = Arc::clone(&project_paths);

    let profiler_state = ProfilerState {
        server: Arc::new(tokio::sync::Mutex::new(None)),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .register_uri_scheme_protocol("project", move |_app, request| {
            let project_paths = Arc::clone(&project_paths_clone);

            let uri = request.uri();
            let path = uri.path();

            let file_path = {
                let paths = project_paths.lock().unwrap();
                if let Some(base_path) = paths.get("current") {
                    format!("{}{}", base_path, path)
                } else {
                    return tauri::http::Response::builder()
                        .status(404)
                        .body(Vec::new())
                        .unwrap();
                }
            };

            match std::fs::read(&file_path) {
                Ok(content) => {
                    let mime_type = if file_path.ends_with(".ts") || file_path.ends_with(".tsx") {
                        "application/javascript"
                    } else if file_path.ends_with(".js") {
                        "application/javascript"
                    } else if file_path.ends_with(".json") {
                        "application/json"
                    } else {
                        "text/plain"
                    };

                    tauri::http::Response::builder()
                        .status(200)
                        .header("Content-Type", mime_type)
                        .header("Access-Control-Allow-Origin", "*")
                        .body(content)
                        .unwrap()
                }
                Err(e) => {
                    eprintln!("Failed to read file {}: {}", file_path, e);
                    tauri::http::Response::builder()
                        .status(404)
                        .body(Vec::new())
                        .unwrap()
                }
            }
        })
        .setup(move |app| {
            app.manage(project_paths);
            app.manage(profiler_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            open_project,
            save_project,
            export_binary,
            create_directory,
            write_file_content,
            path_exists,
            rename_file_or_folder,
            delete_file,
            delete_folder,
            create_file,
            open_project_dialog,
            save_scene_dialog,
            open_scene_dialog,
            open_behavior_tree_dialog,
            scan_directory,
            scan_behavior_trees,
            read_file_content,
            list_directory,
            set_project_base_path,
            toggle_devtools,
            start_profiler_server,
            stop_profiler_server,
            get_profiler_status,
            read_behavior_tree_file,
            write_behavior_tree_file,
            write_binary_file,
            read_global_blackboard,
            write_global_blackboard,
            open_file_with_default_app,
            show_in_folder,
            build_plugin,
            read_file_as_base64
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
