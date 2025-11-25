//! Plugin management commands
//!
//! Building, installing, and uninstalling editor plugins.

use std::fs;
use std::io::{Cursor, Write};
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Emitter};
use zip::write::FileOptions;
use zip::ZipArchive;

/// Build progress event payload
#[derive(serde::Serialize, Clone)]
pub struct BuildProgress {
    pub step: String,
    pub output: Option<String>,
}

/// Build a plugin from source
#[tauri::command]
pub async fn build_plugin(plugin_folder: String, app: AppHandle) -> Result<String, String> {
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

    let pnpm_command = if cfg!(target_os = "windows") {
        "pnpm.cmd"
    } else {
        "pnpm"
    };

    // Step 1: Install dependencies
    app.emit(
        "plugin-build-progress",
        BuildProgress {
            step: "install".to_string(),
            output: None,
        },
    )
    .ok();

    let install_output = Command::new(&pnpm_command)
        .args(["install"])
        .current_dir(&plugin_folder)
        .output()
        .map_err(|e| format!("Failed to run pnpm install: {}", e))?;

    if !install_output.status.success() {
        return Err(format!(
            "pnpm install failed: {}",
            String::from_utf8_lossy(&install_output.stderr)
        ));
    }

    // Step 2: Build
    app.emit(
        "plugin-build-progress",
        BuildProgress {
            step: "build".to_string(),
            output: None,
        },
    )
    .ok();

    let build_output = Command::new(&pnpm_command)
        .args(["run", "build"])
        .current_dir(&plugin_folder)
        .output()
        .map_err(|e| format!("Failed to run pnpm run build: {}", e))?;

    if !build_output.status.success() {
        return Err(format!(
            "pnpm run build failed: {}",
            String::from_utf8_lossy(&build_output.stderr)
        ));
    }

    let dist_path = plugin_path.join("dist");
    if !dist_path.exists() {
        return Err("dist directory not found after build".to_string());
    }

    // Step 3: Package
    app.emit(
        "plugin-build-progress",
        BuildProgress {
            step: "package".to_string(),
            output: None,
        },
    )
    .ok();

    let zip_path = build_cache_dir.join("index.zip");
    let zip_file =
        fs::File::create(&zip_path).map_err(|e| format!("Failed to create zip file: {}", e))?;

    let mut zip = zip::ZipWriter::new(zip_file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    // Add package.json
    let package_json_content = fs::read(&package_json_path)
        .map_err(|e| format!("Failed to read package.json: {}", e))?;
    zip.start_file("package.json", options)
        .map_err(|e| format!("Failed to add package.json to zip: {}", e))?;
    zip.write_all(&package_json_content)
        .map_err(|e| format!("Failed to write package.json to zip: {}", e))?;

    // Add dist directory
    add_directory_to_zip(&mut zip, plugin_path, &dist_path, options)
        .map_err(|e| format!("Failed to add dist directory to zip: {}", e))?;

    zip.finish()
        .map_err(|e| format!("Failed to finalize zip: {}", e))?;

    // Step 4: Complete
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
    base_path: &Path,
    current_path: &Path,
    options: FileOptions,
) -> Result<(), String> {
    let entries = fs::read_dir(current_path)
        .map_err(|e| format!("Failed to read directory {}: {}", current_path.display(), e))?;

    for entry in entries.flatten() {
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

/// Install a plugin from marketplace
#[tauri::command]
pub async fn install_marketplace_plugin(
    project_path: String,
    plugin_id: String,
    zip_data_base64: String,
) -> Result<String, String> {
    use base64::{engine::general_purpose, Engine as _};

    let project_path = Path::new(&project_path);
    if !project_path.exists() {
        return Err(format!(
            "Project path does not exist: {}",
            project_path.display()
        ));
    }

    let plugins_dir = project_path.join("plugins");
    if !plugins_dir.exists() {
        fs::create_dir_all(&plugins_dir)
            .map_err(|e| format!("Failed to create plugins directory: {}", e))?;
    }

    let plugin_dir = plugins_dir.join(&plugin_id);
    if plugin_dir.exists() {
        fs::remove_dir_all(&plugin_dir)
            .map_err(|e| format!("Failed to remove old plugin directory: {}", e))?;
    }

    fs::create_dir_all(&plugin_dir)
        .map_err(|e| format!("Failed to create plugin directory: {}", e))?;

    let zip_bytes = general_purpose::STANDARD
        .decode(&zip_data_base64)
        .map_err(|e| format!("Failed to decode base64 ZIP data: {}", e))?;

    let cursor = Cursor::new(zip_bytes);
    let mut archive =
        ZipArchive::new(cursor).map_err(|e| format!("Failed to read ZIP archive: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read ZIP entry {}: {}", i, e))?;

        let file_path = match file.enclosed_name() {
            Some(path) => path,
            None => continue,
        };

        let out_path = plugin_dir.join(file_path);

        if file.is_dir() {
            fs::create_dir_all(&out_path)
                .map_err(|e| format!("Failed to create directory {}: {}", out_path.display(), e))?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create parent directory: {}", e))?;
            }

            let mut out_file = fs::File::create(&out_path)
                .map_err(|e| format!("Failed to create file {}: {}", out_path.display(), e))?;

            std::io::copy(&mut file, &mut out_file)
                .map_err(|e| format!("Failed to write file {}: {}", out_path.display(), e))?;
        }
    }

    Ok(plugin_dir.to_string_lossy().to_string())
}

/// Uninstall a plugin
#[tauri::command]
pub async fn uninstall_marketplace_plugin(
    project_path: String,
    plugin_id: String,
) -> Result<(), String> {
    let project_path = Path::new(&project_path);
    let plugin_dir = project_path.join("plugins").join(&plugin_id);

    if !plugin_dir.exists() {
        return Err(format!(
            "Plugin directory does not exist: {}",
            plugin_dir.display()
        ));
    }

    fs::remove_dir_all(&plugin_dir)
        .map_err(|e| format!("Failed to remove plugin directory: {}", e))?;

    Ok(())
}
