//! Project management commands

use std::fs;
use std::path::Path;
use crate::state::ProjectPaths;

#[tauri::command]
pub fn open_project(path: String) -> Result<String, String> {
    Ok(format!("Project opened: {}", path))
}

/// Save project data
#[tauri::command]
pub fn save_project(path: String, data: String) -> Result<(), String> {
    fs::write(&path, data).map_err(|e| format!("Failed to save project: {}", e))
}

/// Export binary data
#[tauri::command]
pub fn export_binary(data: Vec<u8>, output_path: String) -> Result<(), String> {
    fs::write(&output_path, data).map_err(|e| format!("Failed to export binary: {}", e))
}

/// Set current project base path
#[tauri::command]
pub fn set_project_base_path(path: String, state: tauri::State<ProjectPaths>) -> Result<(), String> {
    let mut paths = state
        .lock()
        .map_err(|e| format!("Failed to lock state: {}", e))?;
    paths.insert("current".to_string(), path);
    Ok(())
}

/// Scan for behavior tree files in project
#[tauri::command]
pub fn scan_behavior_trees(project_path: String) -> Result<Vec<String>, String> {
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
    base_path: &Path,
    current_path: &Path,
    results: &mut Vec<String>,
) -> Result<(), String> {
    let entries =
        fs::read_dir(current_path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();

        if path.is_dir() {
            scan_directory_recursive(base_path, &path, results)?;
        } else if path.extension().and_then(|s| s.to_str()) == Some("btree") {
            if let Ok(relative) = path.strip_prefix(base_path) {
                let relative_str = relative
                    .to_string_lossy()
                    .replace('\\', "/")
                    .trim_end_matches(".btree")
                    .to_string();
                results.push(relative_str);
            }
        }
    }

    Ok(())
}
