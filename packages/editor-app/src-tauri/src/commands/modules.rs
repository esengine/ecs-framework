//! Engine Module Commands
//! 引擎模块命令
//!
//! Commands for reading engine module configurations.
//! 用于读取引擎模块配置的命令。

use std::path::PathBuf;
use tauri::{command, AppHandle};

#[cfg(not(debug_assertions))]
use tauri::Manager;

/// Module index structure.
/// 模块索引结构。
#[derive(serde::Serialize, serde::Deserialize)]
pub struct ModuleIndex {
    pub version: String,
    #[serde(rename = "generatedAt")]
    pub generated_at: String,
    pub modules: Vec<ModuleIndexEntry>,
}

/// Module index entry.
/// 模块索引条目。
#[derive(serde::Serialize, serde::Deserialize)]
pub struct ModuleIndexEntry {
    pub id: String,
    pub name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    #[serde(rename = "hasRuntime")]
    pub has_runtime: bool,
    #[serde(rename = "editorPackage")]
    pub editor_package: Option<String>,
    #[serde(rename = "isCore")]
    pub is_core: bool,
    pub category: String,
    /// JS bundle size in bytes | JS 包大小（字节）
    #[serde(rename = "jsSize")]
    pub js_size: Option<u64>,
    /// Whether this module requires WASM | 是否需要 WASM
    #[serde(rename = "requiresWasm")]
    pub requires_wasm: Option<bool>,
    /// WASM file size in bytes | WASM 文件大小（字节）
    #[serde(rename = "wasmSize")]
    pub wasm_size: Option<u64>,
}

/// Get the engine modules directory path.
/// 获取引擎模块目录路径。
///
/// In dev mode: First tries dist/engine, then falls back to packages/ source directory.
/// 在开发模式下：首先尝试 dist/engine，然后回退到 packages/ 源目录。
///
/// In production: Uses the bundled resource directory.
/// 在生产模式下：使用打包的资源目录。
#[allow(unused_variables)]
fn get_engine_modules_path(app: &AppHandle) -> Result<PathBuf, String> {
    // In development mode, use compile-time path
    // 在开发模式下，使用编译时路径
    #[cfg(debug_assertions)]
    {
        // CARGO_MANIFEST_DIR is set at compile time, pointing to src-tauri
        // CARGO_MANIFEST_DIR 在编译时设置，指向 src-tauri
        let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));

        // Try dist/engine first (if modules have been copied with actual content)
        // 首先尝试 dist/engine（如果模块已复制且包含实际内容）
        let dist_engine_path = manifest_dir
            .parent()
            .map(|p| p.join("dist/engine"))
            .unwrap_or_else(|| PathBuf::from("dist/engine"));

        // Check if dist/engine has actual module content (not just empty directories)
        // 检查 dist/engine 是否有实际模块内容（而不仅是空目录）
        let dist_core_output = dist_engine_path.join("core/dist/index.mjs");
        if dist_core_output.exists() {
            println!("[modules] Using dist/engine path: {:?}", dist_engine_path);
            return Ok(dist_engine_path);
        }

        // Fallback: use packages/ source directory directly (dev mode without copy)
        // 回退：直接使用 packages/ 源目录（开发模式无需复制）
        // This allows building without running copy-modules first
        // 这样可以在不运行 copy-modules 的情况下进行构建
        let packages_path = manifest_dir
            .parent()  // editor-app
            .and_then(|p| p.parent())  // packages
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| PathBuf::from("packages"));

        // Verify packages directory has module.json files
        // 验证 packages 目录包含 module.json 文件
        let core_module = packages_path.join("core/module.json");
        if core_module.exists() {
            println!("[modules] Using packages source path: {:?}", packages_path);
            return Ok(packages_path);
        }

        return Err(format!(
            "Engine modules directory not found in dev mode. Tried: {:?}, {:?}. \
            Either run 'pnpm copy-modules' or ensure packages/ directory exists.",
            dist_engine_path, packages_path
        ));
    }

    // Production: use resource directory
    // 生产环境：使用资源目录
    #[cfg(not(debug_assertions))]
    {
        let resource_path = app
            .path()
            .resource_dir()
            .map_err(|e| format!("Failed to get resource dir: {}", e))?;

        let prod_path = resource_path.join("engine");

        if prod_path.exists() {
            return Ok(prod_path);
        }

        // Fallback: try exe directory
        // 回退：尝试可执行文件目录
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get exe path: {}", e))?;
        let exe_dir = exe_path.parent()
            .ok_or("Failed to get exe directory")?;

        let exe_engine_path = exe_dir.join("engine");
        if exe_engine_path.exists() {
            return Ok(exe_engine_path);
        }

        Err(format!(
            "Engine modules directory not found. Tried: {:?}, {:?}",
            prod_path, exe_engine_path
        ))
    }
}

/// Read the engine modules index.
/// 读取引擎模块索引。
#[command]
pub async fn read_engine_modules_index(app: AppHandle) -> Result<ModuleIndex, String> {
    println!("[modules] read_engine_modules_index called");
    let engine_path = get_engine_modules_path(&app)?;
    println!("[modules] engine_path: {:?}", engine_path);
    let index_path = engine_path.join("index.json");

    if !index_path.exists() {
        return Err(format!(
            "Module index not found at {:?}. Run 'pnpm copy-modules' first.",
            index_path
        ));
    }

    let content = std::fs::read_to_string(&index_path)
        .map_err(|e| format!("Failed to read index.json: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse index.json: {}", e))
}

/// Read a specific module's manifest.
/// 读取特定模块的清单。
#[command]
pub async fn read_module_manifest(app: AppHandle, module_id: String) -> Result<serde_json::Value, String> {
    let engine_path = get_engine_modules_path(&app)?;
    let manifest_path = engine_path.join(&module_id).join("module.json");

    if !manifest_path.exists() {
        return Err(format!(
            "Module manifest not found for '{}' at {:?}",
            module_id, manifest_path
        ));
    }

    let content = std::fs::read_to_string(&manifest_path)
        .map_err(|e| format!("Failed to read module.json for {}: {}", module_id, e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse module.json for {}: {}", module_id, e))
}

/// Get the base path to engine modules directory.
/// 获取引擎模块目录的基础路径。
#[command]
pub async fn get_engine_modules_base_path(app: AppHandle) -> Result<String, String> {
    let path = get_engine_modules_path(&app)?;
    path.to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Failed to convert path to string".to_string())
}
