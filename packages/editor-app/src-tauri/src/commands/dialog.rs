//! Dialog operations
//!
//! Generic system dialog commands for file/folder selection.
//! No business-specific logic - all filtering is done via parameters.

use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

/// File filter definition
#[derive(serde::Deserialize)]
pub struct FileFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

/// Open folder selection dialog
#[tauri::command]
pub async fn open_folder_dialog(
    app: AppHandle,
    title: Option<String>,
) -> Result<Option<String>, String> {
    let mut dialog = app.dialog().file();

    if let Some(t) = title {
        dialog = dialog.set_title(&t);
    } else {
        dialog = dialog.set_title("Select Folder");
    }

    let folder = dialog.blocking_pick_folder();

    Ok(folder.map(|path| path.to_string()))
}

/// Open file selection dialog (generic)
#[tauri::command]
pub async fn open_file_dialog(
    app: AppHandle,
    title: Option<String>,
    filters: Option<Vec<FileFilter>>,
    multiple: Option<bool>,
) -> Result<Option<Vec<String>>, String> {
    let mut dialog = app.dialog().file();

    if let Some(t) = title {
        dialog = dialog.set_title(&t);
    } else {
        dialog = dialog.set_title("Select File");
    }

    if let Some(filter_list) = filters {
        for filter in filter_list {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            dialog = dialog.add_filter(&filter.name, &extensions);
        }
    }

    if multiple.unwrap_or(false) {
        let files = dialog.blocking_pick_files();
        Ok(files.map(|paths| paths.iter().map(|p| p.to_string()).collect()))
    } else {
        let file = dialog.blocking_pick_file();
        Ok(file.map(|path| vec![path.to_string()]))
    }
}

/// Save file dialog (generic)
/// 通用保存文件对话框
#[tauri::command]
pub async fn save_file_dialog(
    app: AppHandle,
    title: Option<String>,
    default_name: Option<String>,
    default_path: Option<String>,
    filters: Option<Vec<FileFilter>>,
) -> Result<Option<String>, String> {
    let mut dialog = app.dialog().file();

    if let Some(t) = title {
        dialog = dialog.set_title(&t);
    } else {
        dialog = dialog.set_title("Save File");
    }

    // Set default directory | 设置默认目录
    if let Some(path) = default_path {
        let path_buf = std::path::PathBuf::from(&path);
        if path_buf.exists() {
            dialog = dialog.set_directory(&path_buf);
        }
    }

    if let Some(name) = default_name {
        dialog = dialog.set_file_name(&name);
    }

    if let Some(filter_list) = filters {
        for filter in filter_list {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            dialog = dialog.add_filter(&filter.name, &extensions);
        }
    }

    let file = dialog.blocking_save_file();

    Ok(file.map(|path| path.to_string()))
}
