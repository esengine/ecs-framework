// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri::AppHandle;

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
async fn open_project_dialog(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let folder = app.dialog()
        .file()
        .set_title("Select Project Directory")
        .blocking_pick_folder();

    Ok(folder.map(|path| path.to_string()))
}

#[tauri::command]
fn scan_directory(path: String, pattern: String) -> Result<Vec<String>, String> {
    use glob::glob;
    use std::path::{Path, MAIN_SEPARATOR};

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
                            entries.push(DirectoryEntry {
                                name: name.to_string_lossy().to_string(),
                                path: entry_path.to_string_lossy().to_string(),
                                is_dir: entry_path.is_dir(),
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

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // 应用启动时的初始化逻辑
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            open_project,
            save_project,
            export_binary,
            open_project_dialog,
            scan_directory,
            read_file_content,
            list_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
