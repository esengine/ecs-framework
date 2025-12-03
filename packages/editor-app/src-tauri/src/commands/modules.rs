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
/// Uses compile-time CARGO_MANIFEST_DIR in dev mode to locate dist/engine.
/// 在开发模式下使用编译时的 CARGO_MANIFEST_DIR 来定位 dist/engine。
#[allow(unused_variables)]
fn get_engine_modules_path(app: &AppHandle) -> Result<PathBuf, String> {
    // In development mode, use compile-time path
    // 在开发模式下，使用编译时路径
    #[cfg(debug_assertions)]
    {
        // CARGO_MANIFEST_DIR is set at compile time, pointing to src-tauri
        // CARGO_MANIFEST_DIR 在编译时设置，指向 src-tauri
        let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .map(|p| p.join("dist/engine"))
            .unwrap_or_else(|| PathBuf::from("dist/engine"));

        if dev_path.exists() {
            println!("[modules] Using dev path: {:?}", dev_path);
            return Ok(dev_path);
        }

        // Fallback: try current working directory
        // 回退：尝试当前工作目录
        let cwd_path = std::env::current_dir()
            .map(|p| p.join("dist/engine"))
            .unwrap_or_else(|_| PathBuf::from("dist/engine"));

        if cwd_path.exists() {
            println!("[modules] Using cwd path: {:?}", cwd_path);
            return Ok(cwd_path);
        }

        return Err(format!(
            "Engine modules directory not found in dev mode. Tried: {:?}, {:?}. Run 'pnpm copy-modules' first.",
            dev_path, cwd_path
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
