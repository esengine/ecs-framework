//! User code compilation commands.
//! 用户代码编译命令。
//!
//! Provides TypeScript compilation using esbuild for user scripts.
//! 使用 esbuild 为用户脚本提供 TypeScript 编译。

use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher, Event, EventKind};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use std::sync::mpsc::channel;
use std::time::Duration;
use tauri::{command, AppHandle, Emitter, State};
use crate::state::ScriptWatcherState;

/// Compilation options.
/// 编译选项。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileOptions {
    /// Entry file path | 入口文件路径
    pub entry_path: String,
    /// Output file path | 输出文件路径
    pub output_path: String,
    /// Output format (esm or iife) | 输出格式
    pub format: String,
    /// Global name for IIFE format | IIFE 格式的全局名称
    pub global_name: Option<String>,
    /// Whether to generate source map | 是否生成 source map
    pub source_map: bool,
    /// Whether to minify | 是否压缩
    pub minify: bool,
    /// External dependencies | 外部依赖
    pub external: Vec<String>,
    /// Module aliases (e.g., "@esengine/esengine" -> "/path/to/shim.js")
    /// 模块别名
    pub alias: Option<std::collections::HashMap<String, String>>,
    /// Project root for resolving imports | 项目根目录用于解析导入
    pub project_root: String,
}

/// Compilation error.
/// 编译错误。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileError {
    /// Error message | 错误信息
    pub message: String,
    /// File path | 文件路径
    pub file: Option<String>,
    /// Line number | 行号
    pub line: Option<u32>,
    /// Column number | 列号
    pub column: Option<u32>,
}

/// Compilation result.
/// 编译结果。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileResult {
    /// Whether compilation succeeded | 是否编译成功
    pub success: bool,
    /// Compilation errors | 编译错误
    pub errors: Vec<CompileError>,
    /// Output file path (if successful) | 输出文件路径（如果成功）
    pub output_path: Option<String>,
}

/// Environment check result.
/// 环境检测结果。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentCheckResult {
    /// Whether all required tools are available | 所有必需工具是否可用
    pub ready: bool,
    /// esbuild availability status | esbuild 可用性状态
    pub esbuild: ToolStatus,
}

/// Tool availability status.
/// 工具可用性状态。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolStatus {
    /// Whether the tool is available | 工具是否可用
    pub available: bool,
    /// Tool version (if available) | 工具版本（如果可用）
    pub version: Option<String>,
    /// Tool path (if available) | 工具路径（如果可用）
    pub path: Option<String>,
    /// Source of the tool: "bundled", "local", "global" | 工具来源
    pub source: Option<String>,
    /// Error message (if not available) | 错误信息（如果不可用）
    pub error: Option<String>,
}

/// File change event sent to frontend.
/// 发送到前端的文件变更事件。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileChangeEvent {
    /// Type of change: "create", "modify", "remove" | 变更类型
    pub change_type: String,
    /// File paths that changed | 发生变更的文件路径
    pub paths: Vec<String>,
}

/// Check development environment.
/// 检测开发环境。
///
/// Checks if all required tools (esbuild, etc.) are available.
/// 检查所有必需的工具是否可用。
#[command]
pub async fn check_environment() -> Result<EnvironmentCheckResult, String> {
    let esbuild_status = check_esbuild_status();

    Ok(EnvironmentCheckResult {
        ready: esbuild_status.available,
        esbuild: esbuild_status,
    })
}

/// Check esbuild availability and get its status.
/// 检查 esbuild 可用性并获取其状态。
fn check_esbuild_status() -> ToolStatus {
    // Try bundled esbuild first | 首先尝试打包的 esbuild
    if let Some(bundled_path) = find_bundled_esbuild() {
        match get_esbuild_version(&bundled_path) {
            Ok(version) => {
                return ToolStatus {
                    available: true,
                    version: Some(version),
                    path: Some(bundled_path),
                    source: Some("bundled".to_string()),
                    error: None,
                };
            }
            Err(e) => {
                println!("[Environment] Bundled esbuild found but failed to get version: {}", e);
            }
        }
    }

    // Try global esbuild | 尝试全局 esbuild
    let global_esbuild = if cfg!(windows) { "esbuild.cmd" } else { "esbuild" };
    match get_esbuild_version(global_esbuild) {
        Ok(version) => {
            ToolStatus {
                available: true,
                version: Some(version),
                path: Some(global_esbuild.to_string()),
                source: Some("global".to_string()),
                error: None,
            }
        }
        Err(_) => {
            ToolStatus {
                available: false,
                version: None,
                path: None,
                source: None,
                error: Some("esbuild not found | 未找到 esbuild".to_string()),
            }
        }
    }
}

/// Get esbuild version.
/// 获取 esbuild 版本。
fn get_esbuild_version(esbuild_path: &str) -> Result<String, String> {
    let output = Command::new(esbuild_path)
        .arg("--version")
        .output()
        .map_err(|e| format!("Failed to run esbuild: {}", e))?;

    if output.status.success() {
        let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(version)
    } else {
        Err("esbuild --version failed".to_string())
    }
}

/// Compile TypeScript using esbuild.
/// 使用 esbuild 编译 TypeScript。
///
/// # Arguments | 参数
/// * `options` - Compilation options | 编译选项
///
/// # Returns | 返回
/// Compilation result | 编译结果
#[command]
pub async fn compile_typescript(options: CompileOptions) -> Result<CompileResult, String> {
    // Check if esbuild is available | 检查 esbuild 是否可用
    let esbuild_path = find_esbuild(&options.project_root)?;

    // Build esbuild arguments | 构建 esbuild 参数
    let mut args = vec![
        options.entry_path.clone(),
        "--bundle".to_string(),
        format!("--outfile={}", options.output_path),
        format!("--format={}", options.format),
        "--platform=browser".to_string(),
        "--target=es2020".to_string(),
    ];

    // Add source map option | 添加 source map 选项
    if options.source_map {
        args.push("--sourcemap".to_string());
    }

    // Add minify option | 添加压缩选项
    if options.minify {
        args.push("--minify".to_string());
    }

    // Add global name for IIFE format | 添加 IIFE 格式的全局名称
    if let Some(ref global_name) = options.global_name {
        args.push(format!("--global-name={}", global_name));
    }

    // Add external dependencies | 添加外部依赖
    for external in &options.external {
        args.push(format!("--external:{}", external));
    }

    // Add module aliases | 添加模块别名
    if let Some(ref aliases) = options.alias {
        for (from, to) in aliases {
            args.push(format!("--alias:{}={}", from, to));
        }
    }

    // Build full command string for error reporting | 构建完整命令字符串用于错误报告
    let cmd_str = format!("{} {}", esbuild_path, args.join(" "));
    println!("[Compiler] Running: {}", cmd_str);

    // Run esbuild | 运行 esbuild
    let output = Command::new(&esbuild_path)
        .args(&args)
        .current_dir(&options.project_root)
        .output()
        .map_err(|e| format!("Failed to run esbuild | 运行 esbuild 失败: {}", e))?;

    if output.status.success() {
        println!("[Compiler] Compilation successful: {}", options.output_path);
        Ok(CompileResult {
            success: true,
            errors: vec![],
            output_path: Some(options.output_path),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);

        println!("[Compiler] Compilation failed");
        println!("[Compiler] stdout: {}", stdout);
        println!("[Compiler] stderr: {}", stderr);

        // Try to parse errors from both stdout and stderr | 尝试从 stdout 和 stderr 解析错误
        let mut errors = parse_esbuild_errors(&stderr);
        if errors.is_empty() {
            errors = parse_esbuild_errors(&stdout);
        }

        // If still no parsed errors, include the raw output and command | 如果仍然没有解析到错误，包含原始输出和命令
        if errors.is_empty() {
            let combined_output = if !stderr.is_empty() && !stdout.is_empty() {
                format!("stdout: {}\nstderr: {}", stdout.trim(), stderr.trim())
            } else if !stderr.is_empty() {
                stderr.trim().to_string()
            } else if !stdout.is_empty() {
                stdout.trim().to_string()
            } else {
                format!("Command failed: {}", cmd_str)
            };

            errors.push(CompileError {
                message: combined_output,
                file: None,
                line: None,
                column: None,
            });
        }

        Ok(CompileResult {
            success: false,
            errors,
            output_path: None,
        })
    }
}

/// Watch for file changes in scripts directory.
/// 监视脚本目录中的文件变更。
///
/// Emits "user-code:file-changed" events when files change.
/// 当文件发生变更时触发 "user-code:file-changed" 事件。
#[command]
pub async fn watch_scripts(
    app: AppHandle,
    watcher_state: State<'_, ScriptWatcherState>,
    project_path: String,
    scripts_dir: String,
) -> Result<(), String> {
    let watch_path = Path::new(&project_path).join(&scripts_dir);

    if !watch_path.exists() {
        return Err(format!(
            "Scripts directory does not exist | 脚本目录不存在: {}",
            watch_path.display()
        ));
    }

    // Check if already watching this project | 检查是否已在监视此项目
    {
        let watchers = watcher_state.watchers.lock().await;
        if watchers.contains_key(&project_path) {
            println!("[UserCode] Already watching: {}", project_path);
            return Ok(());
        }
    }

    // Create a channel for shutdown signal | 创建关闭信号通道
    let (shutdown_tx, mut shutdown_rx) = tokio::sync::oneshot::channel::<()>();

    // Clone values for the spawned task | 克隆值以供任务使用
    let project_path_clone = project_path.clone();
    let watch_path_clone = watch_path.clone();
    let app_clone = app.clone();

    // Spawn file watcher task | 启动文件监视任务
    tokio::spawn(async move {
        // Create notify watcher | 创建 notify 监视器
        let (tx, rx) = channel();

        let mut watcher = match RecommendedWatcher::new(
            move |res: Result<Event, notify::Error>| {
                if let Ok(event) = res {
                    let _ = tx.send(event);
                }
            },
            Config::default().with_poll_interval(Duration::from_millis(500)),
        ) {
            Ok(w) => w,
            Err(e) => {
                eprintln!("[UserCode] Failed to create watcher: {}", e);
                return;
            }
        };

        // Start watching | 开始监视
        if let Err(e) = watcher.watch(&watch_path_clone, RecursiveMode::Recursive) {
            eprintln!("[UserCode] Failed to watch path: {}", e);
            return;
        }

        println!("[UserCode] Started watching: {}", watch_path_clone.display());

        // Debounce state | 防抖状态
        let mut pending_paths: std::collections::HashSet<String> = std::collections::HashSet::new();
        let mut last_event_time = std::time::Instant::now();
        let debounce_duration = Duration::from_millis(300);

        // Event loop | 事件循环
        loop {
            // Check for shutdown | 检查关闭信号
            if shutdown_rx.try_recv().is_ok() {
                println!("[UserCode] Stopping watcher for: {}", project_path_clone);
                break;
            }

            // Check for file events with timeout | 带超时检查文件事件
            match rx.recv_timeout(Duration::from_millis(100)) {
                Ok(event) => {
                    // Filter for TypeScript/JavaScript files | 过滤 TypeScript/JavaScript 文件
                    let ts_paths: Vec<String> = event
                        .paths
                        .iter()
                        .filter(|p| {
                            let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("");
                            matches!(ext, "ts" | "tsx" | "js" | "jsx")
                        })
                        .map(|p| p.to_string_lossy().to_string())
                        .collect();

                    if !ts_paths.is_empty() {
                        // Only handle create/modify/remove events | 只处理创建/修改/删除事件
                        match event.kind {
                            EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
                                // Add to pending paths and update last event time | 添加到待处理路径并更新最后事件时间
                                for path in ts_paths {
                                    pending_paths.insert(path);
                                }
                                last_event_time = std::time::Instant::now();
                            }
                            _ => continue,
                        };
                    }
                }
                Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                    // Check if we should emit pending events (debounce) | 检查是否应该发送待处理事件（防抖）
                    if !pending_paths.is_empty() && last_event_time.elapsed() >= debounce_duration {
                        let file_event = FileChangeEvent {
                            change_type: "modify".to_string(),
                            paths: pending_paths.drain().collect(),
                        };

                        println!("[UserCode] File change detected (debounced): {:?}", file_event);

                        // Emit event to frontend | 向前端发送事件
                        if let Err(e) = app_clone.emit("user-code:file-changed", file_event) {
                            eprintln!("[UserCode] Failed to emit event: {}", e);
                        }
                    }
                }
                Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
                    println!("[UserCode] Watcher channel disconnected");
                    break;
                }
            }
        }
    });

    // Store watcher handle | 存储监视器句柄
    {
        let mut watchers = watcher_state.watchers.lock().await;
        watchers.insert(
            project_path.clone(),
            crate::state::WatcherHandle { shutdown_tx },
        );
    }

    println!("[UserCode] Watch scripts started for: {}/{}", project_path, scripts_dir);
    Ok(())
}

/// Stop watching for file changes.
/// 停止监视文件变更。
#[command]
pub async fn stop_watch_scripts(
    watcher_state: State<'_, ScriptWatcherState>,
    project_path: Option<String>,
) -> Result<(), String> {
    let mut watchers = watcher_state.watchers.lock().await;

    match project_path {
        Some(path) => {
            // Stop specific watcher | 停止特定监视器
            if let Some(handle) = watchers.remove(&path) {
                let _ = handle.shutdown_tx.send(());
                println!("[UserCode] Stopped watching: {}", path);
            }
        }
        None => {
            // Stop all watchers | 停止所有监视器
            for (path, handle) in watchers.drain() {
                let _ = handle.shutdown_tx.send(());
                println!("[UserCode] Stopped watching: {}", path);
            }
        }
    }

    Ok(())
}

/// Find esbuild executable path.
/// 查找 esbuild 可执行文件路径。
///
/// Search order | 搜索顺序:
/// 1. Bundled esbuild in app resources | 应用资源中打包的 esbuild
/// 2. Local node_modules | 本地 node_modules
/// 3. Global esbuild | 全局 esbuild
fn find_esbuild(project_root: &str) -> Result<String, String> {
    let project_path = Path::new(project_root);

    // Try bundled esbuild first (in app resources) | 首先尝试打包的 esbuild（在应用资源中）
    if let Some(bundled) = find_bundled_esbuild() {
        println!("[Compiler] Using bundled esbuild: {}", bundled);
        return Ok(bundled);
    }

    // Try local node_modules | 尝试本地 node_modules
    let local_esbuild = if cfg!(windows) {
        project_path.join("node_modules/.bin/esbuild.cmd")
    } else {
        project_path.join("node_modules/.bin/esbuild")
    };

    if local_esbuild.exists() {
        println!("[Compiler] Using local esbuild: {}", local_esbuild.display());
        return Ok(local_esbuild.to_string_lossy().to_string());
    }

    // Try global esbuild | 尝试全局 esbuild
    let global_esbuild = if cfg!(windows) { "esbuild.cmd" } else { "esbuild" };

    // Check if global esbuild exists | 检查全局 esbuild 是否存在
    let check = Command::new(global_esbuild)
        .arg("--version")
        .output();

    match check {
        Ok(output) if output.status.success() => {
            println!("[Compiler] Using global esbuild");
            Ok(global_esbuild.to_string())
        },
        _ => Err("esbuild not found. Please install esbuild: npm install -g esbuild | 未找到 esbuild，请安装: npm install -g esbuild".to_string())
    }
}

/// Find bundled esbuild in app resources.
/// 在应用资源中查找打包的 esbuild。
fn find_bundled_esbuild() -> Option<String> {
    // Get the executable path | 获取可执行文件路径
    let exe_path = std::env::current_exe().ok()?;
    let exe_dir = exe_path.parent()?;

    // In development, resources are in src-tauri directory | 开发模式下，资源在 src-tauri 目录
    // In production, resources are next to the executable | 生产模式下，资源在可执行文件旁边
    let esbuild_name = if cfg!(windows) { "esbuild.exe" } else { "esbuild" };

    // Try production path (resources next to exe) | 尝试生产路径（资源在 exe 旁边）
    let prod_path = exe_dir.join("bin").join(esbuild_name);
    if prod_path.exists() {
        return Some(prod_path.to_string_lossy().to_string());
    }

    // Try development path (in src-tauri/bin) | 尝试开发路径（在 src-tauri/bin 中）
    // This handles running via `cargo tauri dev`
    let dev_path = exe_dir
        .ancestors()
        .find_map(|p| {
            let candidate = p.join("src-tauri").join("bin").join(esbuild_name);
            if candidate.exists() {
                Some(candidate)
            } else {
                None
            }
        });

    if let Some(path) = dev_path {
        return Some(path.to_string_lossy().to_string());
    }

    None
}

/// Parse esbuild error output.
/// 解析 esbuild 错误输出。
fn parse_esbuild_errors(stderr: &str) -> Vec<CompileError> {
    let mut errors = Vec::new();

    // Simple error parsing - esbuild outputs errors in a specific format
    // 简单的错误解析 - esbuild 以特定格式输出错误
    for line in stderr.lines() {
        if line.contains("error:") || line.contains("Error:") {
            // Try to parse file:line:column format | 尝试解析 file:line:column 格式
            let parts: Vec<&str> = line.splitn(2, ": ").collect();

            if parts.len() == 2 {
                let location = parts[0];
                let message = parts[1].to_string();

                // Parse location (file:line:column) | 解析位置
                let loc_parts: Vec<&str> = location.split(':').collect();

                let (file, line_num, column) = if loc_parts.len() >= 3 {
                    (
                        Some(loc_parts[0].to_string()),
                        loc_parts[1].parse().ok(),
                        loc_parts[2].parse().ok(),
                    )
                } else {
                    (None, None, None)
                };

                errors.push(CompileError {
                    message,
                    file,
                    line: line_num,
                    column,
                });
            } else {
                errors.push(CompileError {
                    message: line.to_string(),
                    file: None,
                    line: None,
                    column: None,
                });
            }
        }
    }

    // If no specific errors found, add the whole stderr as one error
    // 如果没有找到特定错误，将整个 stderr 作为一个错误
    if errors.is_empty() && !stderr.trim().is_empty() {
        errors.push(CompileError {
            message: stderr.to_string(),
            file: None,
            line: None,
            column: None,
        });
    }

    errors
}
