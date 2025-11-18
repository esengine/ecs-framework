//! System operations
//!
//! OS-level operations like opening files, showing in folder, devtools, etc.

use std::process::Command;
use tauri::{AppHandle, Manager};

/// Toggle developer tools (debug mode only)
#[tauri::command]
pub fn toggle_devtools(app: AppHandle) -> Result<(), String> {
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
        let _ = app;
        Err("DevTools are only available in debug mode".to_string())
    }
}

/// Open file with system default application
#[tauri::command]
pub fn open_file_with_default_app(file_path: String) -> Result<(), String> {
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

/// Show file in system file explorer
#[tauri::command]
pub fn show_in_folder(file_path: String) -> Result<(), String> {
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
        let parent = path
            .parent()
            .ok_or_else(|| "Failed to get parent directory".to_string())?;

        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| format!("Failed to show in folder: {}", e))?;
    }

    Ok(())
}
