//! Generic file system operations
//!
//! Provides low-level file system commands that can be composed by the frontend
//! for business logic. No business-specific logic should be in this module.

use std::fs;
use std::path::Path;

/// Directory entry information
#[derive(serde::Serialize)]
pub struct DirectoryEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: Option<u64>,
    pub modified: Option<u64>,
}

/// Read text file content
#[tauri::command]
pub fn read_file_content(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file {}: {}", path, e))
}

/// Write text content to file (auto-creates parent directories)
#[tauri::command]
pub fn write_file_content(path: String, content: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory {}: {}", parent.display(), e))?;
        }
    }

    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file {}: {}", path, e))
}

/// Write binary content to file (auto-creates parent directories)
#[tauri::command]
pub async fn write_binary_file(file_path: String, content: Vec<u8>) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&file_path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory {}: {}", parent.display(), e))?;
        }
    }

    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write binary file {}: {}", file_path, e))
}

/// Check if path exists
#[tauri::command]
pub fn path_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

/// Create directory (recursive)
#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory {}: {}", path, e))
}

/// Create empty file
#[tauri::command]
pub fn create_file(path: String) -> Result<(), String> {
    fs::File::create(&path)
        .map_err(|e| format!("Failed to create file {}: {}", path, e))?;
    Ok(())
}

/// Delete file
#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete file {}: {}", path, e))
}

/// Delete directory (recursive)
#[tauri::command]
pub fn delete_folder(path: String) -> Result<(), String> {
    fs::remove_dir_all(&path)
        .map_err(|e| format!("Failed to delete folder {}: {}", path, e))
}

/// Rename or move file/folder
#[tauri::command]
pub fn rename_file_or_folder(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Failed to rename {} to {}: {}", old_path, new_path, e))
}

/// List directory contents with metadata
#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<DirectoryEntry>, String> {
    let dir_path = Path::new(&path);

    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let mut entries = Vec::new();

    let read_dir = fs::read_dir(dir_path)
        .map_err(|e| format!("Failed to read directory {}: {}", path, e))?;

    for entry in read_dir.flatten() {
        let entry_path = entry.path();
        if let Some(name) = entry_path.file_name() {
            let is_dir = entry_path.is_dir();

            let (size, modified) = fs::metadata(&entry_path)
                .map(|metadata| {
                    let size = if is_dir { None } else { Some(metadata.len()) };
                    let modified = metadata
                        .modified()
                        .ok()
                        .and_then(|time| {
                            time.duration_since(std::time::UNIX_EPOCH)
                                .ok()
                                .map(|d| d.as_secs())
                        });
                    (size, modified)
                })
                .unwrap_or((None, None));

            entries.push(DirectoryEntry {
                name: name.to_string_lossy().to_string(),
                path: entry_path.to_string_lossy().to_string(),
                is_dir,
                size,
                modified,
            });
        }
    }

    // Sort: directories first, then alphabetically
    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

/// Scan directory for files matching a glob pattern
#[tauri::command]
pub fn scan_directory(path: String, pattern: String) -> Result<Vec<String>, String> {
    use glob::glob;

    let base_path = Path::new(&path);
    if !base_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    let separator = if path.contains('\\') { '\\' } else { '/' };
    let glob_pattern = format!(
        "{}{}{}",
        path.trim_end_matches(&['/', '\\'][..]),
        separator,
        pattern
    );

    let normalized_pattern = if cfg!(windows) {
        glob_pattern.replace('/', "\\")
    } else {
        glob_pattern.replace('\\', "/")
    };

    let mut files = Vec::new();

    match glob(&normalized_pattern) {
        Ok(entries) => {
            for entry in entries.flatten() {
                if entry.is_file() {
                    files.push(entry.to_string_lossy().to_string());
                }
            }
        }
        Err(e) => return Err(format!("Failed to scan directory: {}", e)),
    }

    Ok(files)
}

/// Read file as base64 encoded string
#[tauri::command]
pub fn read_file_as_base64(file_path: String) -> Result<String, String> {
    use base64::{engine::general_purpose, Engine as _};

    let file_content = fs::read(&file_path)
        .map_err(|e| format!("Failed to read file {}: {}", file_path, e))?;

    Ok(general_purpose::STANDARD.encode(&file_content))
}
