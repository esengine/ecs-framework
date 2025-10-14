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
    use tauri::api::dialog::blocking::FileDialogBuilder;

    let result = FileDialogBuilder::new()
        .set_title("Select Project Directory")
        .pick_folder();

    Ok(result.map(|path| path.to_string_lossy().to_string()))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
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
            open_project_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
