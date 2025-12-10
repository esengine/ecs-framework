//! Build related commands.
//! 构建相关命令。
//!
//! Provides file operations and compilation for build pipelines.
//! 为构建管线提供文件操作和编译功能。

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

/// Build progress event.
/// 构建进度事件。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildProgressEvent {
    /// Progress percentage (0-100) | 进度百分比
    pub progress: u32,
    /// Current step message | 当前步骤消息
    pub message: String,
    /// Current step index | 当前步骤索引
    pub current_step: u32,
    /// Total steps | 总步骤数
    pub total_steps: u32,
}

/// Clean and recreate output directory.
/// 清理并重建输出目录。
#[tauri::command]
pub async fn prepare_build_directory(output_path: String) -> Result<(), String> {
    let path = Path::new(&output_path);

    // Remove existing directory if exists | 如果存在则删除现有目录
    if path.exists() {
        fs::remove_dir_all(path)
            .map_err(|e| format!("Failed to clean output directory | 清理输出目录失败: {}", e))?;
    }

    // Create fresh directory | 创建新目录
    fs::create_dir_all(path)
        .map_err(|e| format!("Failed to create output directory | 创建输出目录失败: {}", e))?;

    Ok(())
}

/// Copy directory recursively.
/// 递归复制目录。
#[tauri::command]
pub async fn copy_directory(
    src: String,
    dst: String,
    patterns: Option<Vec<String>>,
) -> Result<u32, String> {
    let src_path = Path::new(&src);
    let dst_path = Path::new(&dst);

    if !src_path.exists() {
        return Err(format!("Source directory does not exist | 源目录不存在: {}", src));
    }

    // Create destination directory | 创建目标目录
    fs::create_dir_all(dst_path)
        .map_err(|e| format!("Failed to create destination directory | 创建目标目录失败: {}", e))?;

    let mut copied_count = 0u32;

    // Recursively copy | 递归复制
    copy_dir_recursive(src_path, dst_path, &patterns, &mut copied_count)?;

    Ok(copied_count)
}

/// Helper function to copy directory recursively.
/// 递归复制目录的辅助函数。
fn copy_dir_recursive(
    src: &Path,
    dst: &Path,
    patterns: &Option<Vec<String>>,
    count: &mut u32,
) -> Result<(), String> {
    for entry in fs::read_dir(src)
        .map_err(|e| format!("Failed to read directory | 读取目录失败: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry | 读取条目失败: {}", e))?;
        let src_path = entry.path();
        let file_name = entry.file_name();
        let dst_path = dst.join(&file_name);

        if src_path.is_dir() {
            // Skip hidden directories | 跳过隐藏目录
            if file_name.to_string_lossy().starts_with('.') {
                continue;
            }

            fs::create_dir_all(&dst_path)
                .map_err(|e| format!("Failed to create directory | 创建目录失败: {}", e))?;
            copy_dir_recursive(&src_path, &dst_path, patterns, count)?;
        } else {
            // Check if file matches patterns | 检查文件是否匹配模式
            if let Some(ref pats) = patterns {
                let file_name_str = file_name.to_string_lossy();
                let matches = pats.iter().any(|p| {
                    if p.starts_with("*.") {
                        let ext = &p[2..];
                        file_name_str.ends_with(&format!(".{}", ext))
                    } else {
                        file_name_str.contains(p)
                    }
                });

                if !matches {
                    continue;
                }
            }

            fs::copy(&src_path, &dst_path)
                .map_err(|e| format!("Failed to copy file | 复制文件失败: {} -> {}: {}",
                    src_path.display(), dst_path.display(), e))?;
            *count += 1;
        }
    }

    Ok(())
}

/// Bundle options for esbuild.
/// esbuild 打包选项。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BundleOptions {
    /// Entry files | 入口文件
    pub entry_points: Vec<String>,
    /// Output directory | 输出目录
    pub output_dir: String,
    /// Output format (esm or iife) | 输出格式
    pub format: String,
    /// Bundle name | 打包名称
    pub bundle_name: String,
    /// Whether to minify | 是否压缩
    pub minify: bool,
    /// Whether to generate source map | 是否生成 source map
    pub source_map: bool,
    /// External dependencies | 外部依赖
    pub external: Vec<String>,
    /// Project root for resolving imports | 项目根目录
    pub project_root: String,
    /// Define replacements | 宏定义替换
    pub define: Option<std::collections::HashMap<String, String>>,
    /// Module alias mappings (e.g., @esengine/ecs-framework -> /path/to/module)
    /// 模块别名映射（例如 @esengine/ecs-framework -> /path/to/module）
    pub alias: Option<std::collections::HashMap<String, String>>,
    /// Global name for IIFE format (assigns exports to window.{globalName})
    /// IIFE 格式的全局变量名（将导出赋值给 window.{globalName}）
    pub global_name: Option<String>,
    /// Files to inject at the start of bundle (esbuild --inject)
    /// 在打包开始时注入的文件（esbuild --inject）
    pub inject: Option<Vec<String>>,
    /// Banner code to prepend to bundle
    /// 添加到打包文件开头的代码
    pub banner: Option<String>,
}

/// Bundle result.
/// 打包结果。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BundleResult {
    /// Whether bundling succeeded | 是否打包成功
    pub success: bool,
    /// Output file path | 输出文件路径
    pub output_file: Option<String>,
    /// Output file size in bytes | 输出文件大小（字节）
    pub output_size: Option<u64>,
    /// Error message if failed | 失败时的错误信息
    pub error: Option<String>,
    /// Warnings | 警告
    pub warnings: Vec<String>,
}

/// Bundle JavaScript/TypeScript files using esbuild.
/// 使用 esbuild 打包 JavaScript/TypeScript 文件。
#[tauri::command]
pub async fn bundle_scripts(options: BundleOptions) -> Result<BundleResult, String> {
    let esbuild_path = find_esbuild(&options.project_root)?;

    // Build output file path | 构建输出文件路径
    // Note: Don't use .with_extension() as it replaces the last dot-segment
    // 注意：不要使用 .with_extension()，因为它会替换最后一个点分段
    // e.g., "esengine.core" would become "esengine.js" instead of "esengine.core.js"
    let output_file = Path::new(&options.output_dir)
        .join(format!("{}.js", &options.bundle_name));

    // Ensure output directory exists | 确保输出目录存在
    if let Some(parent) = output_file.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create output directory | 创建输出目录失败: {}", e))?;
    }

    // Build esbuild arguments | 构建 esbuild 参数
    let mut args: Vec<String> = options.entry_points.clone();

    args.push("--bundle".to_string());
    args.push(format!("--outfile={}", output_file.display()));
    args.push(format!("--format={}", options.format));
    args.push("--platform=browser".to_string());
    args.push("--target=es2020".to_string());
    // Show detailed warnings instead of just count
    // 显示详细警告而不仅仅是数量
    args.push("--log-level=warning".to_string());

    if options.source_map {
        args.push("--sourcemap".to_string());
    }

    if options.minify {
        args.push("--minify".to_string());
    }

    for external in &options.external {
        args.push(format!("--external:{}", external));
    }

    // Add define replacements | 添加宏定义替换
    if let Some(ref defines) = options.define {
        for (key, value) in defines {
            args.push(format!("--define:{}={}", key, value));
        }
    }

    // Add alias mappings | 添加别名映射
    if let Some(ref aliases) = options.alias {
        for (from, to) in aliases {
            args.push(format!("--alias:{}={}", from, to));
        }
    }

    // Add global name for IIFE format | 为 IIFE 格式添加全局变量名
    if let Some(ref global_name) = options.global_name {
        args.push(format!("--global-name={}", global_name));
    }

    // Add inject files | 添加注入文件
    if let Some(ref inject_files) = options.inject {
        for file in inject_files {
            args.push(format!("--inject:{}", file));
        }
    }

    // Add banner | 添加 banner
    if let Some(ref banner) = options.banner {
        args.push(format!("--banner:js={}", banner));
    }

    // Log esbuild command for debugging
    println!("[esbuild] bundle_name: {}", options.bundle_name);
    println!("[esbuild] format: {}", options.format);
    println!("[esbuild] output_file: {}", output_file.display());
    println!("[esbuild] entry_points: {:?}", options.entry_points);
    println!("[esbuild] args: {:?}", args);

    // Run esbuild | 运行 esbuild
    let output = Command::new(&esbuild_path)
        .args(&args)
        .current_dir(&options.project_root)
        .output()
        .map_err(|e| format!("Failed to run esbuild | 运行 esbuild 失败: {}", e))?;

    if output.status.success() {
        // Get output file size | 获取输出文件大小
        let output_size = fs::metadata(&output_file)
            .map(|m| m.len())
            .ok();

        // Parse warnings from stderr | 从 stderr 解析警告
        // esbuild outputs warnings to stderr even on success
        // esbuild 即使成功也会将警告输出到 stderr
        let stderr = String::from_utf8_lossy(&output.stderr);
        let mut warnings: Vec<String> = Vec::new();

        if !stderr.is_empty() {
            println!("[esbuild] stderr output:\n{}", stderr);

            // Collect all non-empty lines as warnings
            // esbuild warning format varies, so collect everything
            // 收集所有非空行作为警告，因为 esbuild 警告格式多变
            for line in stderr.lines() {
                let trimmed = line.trim();
                if !trimmed.is_empty() {
                    warnings.push(trimmed.to_string());
                }
            }
        }

        Ok(BundleResult {
            success: true,
            output_file: Some(output_file.to_string_lossy().to_string()),
            output_size,
            error: None,
            warnings,
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);

        Ok(BundleResult {
            success: false,
            output_file: None,
            output_size: None,
            error: Some(stderr.to_string()),
            warnings: vec![],
        })
    }
}

/// Generate HTML file from template.
/// 从模板生成 HTML 文件。
#[tauri::command]
pub async fn generate_html(
    output_path: String,
    title: String,
    scripts: Vec<String>,
    body_content: Option<String>,
) -> Result<(), String> {
    let scripts_html: String = scripts
        .iter()
        .map(|s| format!(r#"    <script src="{}"></script>"#, s))
        .collect::<Vec<_>>()
        .join("\n");

    let body = body_content.unwrap_or_else(|| {
        r#"    <canvas id="game-canvas" style="width: 100%; height: 100%;"></canvas>"#.to_string()
    });

    let html = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        html, body {{ width: 100%; height: 100%; overflow: hidden; background: #000; }}
    </style>
</head>
<body>
{}
{}
</body>
</html>"#,
        title, body, scripts_html
    );

    // Ensure parent directory exists | 确保父目录存在
    let path = Path::new(&output_path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory | 创建目录失败: {}", e))?;
    }

    fs::write(&output_path, html)
        .map_err(|e| format!("Failed to write HTML file | 写入 HTML 文件失败: {}", e))?;

    Ok(())
}

/// Get file size.
/// 获取文件大小。
#[tauri::command]
pub async fn get_file_size(file_path: String) -> Result<u64, String> {
    fs::metadata(&file_path)
        .map(|m| m.len())
        .map_err(|e| format!("Failed to get file size | 获取文件大小失败: {}", e))
}

/// Get directory size recursively.
/// 递归获取目录大小。
#[tauri::command]
pub async fn get_directory_size(dir_path: String) -> Result<u64, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err(format!("Directory does not exist | 目录不存在: {}", dir_path));
    }

    calculate_dir_size(path)
}

/// Helper to calculate directory size.
/// 计算目录大小的辅助函数。
fn calculate_dir_size(path: &Path) -> Result<u64, String> {
    let mut total_size = 0u64;

    for entry in fs::read_dir(path)
        .map_err(|e| format!("Failed to read directory | 读取目录失败: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry | 读取条目失败: {}", e))?;
        let entry_path = entry.path();

        if entry_path.is_dir() {
            total_size += calculate_dir_size(&entry_path)?;
        } else {
            total_size += fs::metadata(&entry_path)
                .map(|m| m.len())
                .unwrap_or(0);
        }
    }

    Ok(total_size)
}

/// Find esbuild executable.
/// 查找 esbuild 可执行文件。
fn find_esbuild(project_root: &str) -> Result<String, String> {
    let project_path = Path::new(project_root);

    // Try local node_modules first | 首先尝试本地 node_modules
    let local_esbuild = if cfg!(windows) {
        project_path.join("node_modules/.bin/esbuild.cmd")
    } else {
        project_path.join("node_modules/.bin/esbuild")
    };

    if local_esbuild.exists() {
        return Ok(local_esbuild.to_string_lossy().to_string());
    }

    // Try global esbuild | 尝试全局 esbuild
    let global_esbuild = if cfg!(windows) { "esbuild.cmd" } else { "esbuild" };

    let check = Command::new(global_esbuild)
        .arg("--version")
        .output();

    match check {
        Ok(output) if output.status.success() => Ok(global_esbuild.to_string()),
        _ => Err("esbuild not found | 未找到 esbuild".to_string())
    }
}

/// Write JSON file.
/// 写入 JSON 文件。
#[tauri::command]
pub async fn write_json_file(file_path: String, content: String) -> Result<(), String> {
    let path = Path::new(&file_path);

    // Ensure parent directory exists | 确保父目录存在
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory | 创建目录失败: {}", e))?;
    }

    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write JSON file | 写入 JSON 文件失败: {}", e))?;

    Ok(())
}

/// List files in directory with extension filter.
/// 列出目录中指定扩展名的文件。
#[tauri::command]
pub async fn list_files_by_extension(
    dir_path: String,
    extensions: Vec<String>,
    recursive: bool,
) -> Result<Vec<String>, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Ok(vec![]);
    }

    let mut files = Vec::new();
    list_files_recursive(path, &extensions, recursive, &mut files)?;

    Ok(files)
}

/// Helper to list files recursively.
/// 递归列出文件的辅助函数。
fn list_files_recursive(
    path: &Path,
    extensions: &[String],
    recursive: bool,
    files: &mut Vec<String>,
) -> Result<(), String> {
    for entry in fs::read_dir(path)
        .map_err(|e| format!("Failed to read directory | 读取目录失败: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry | 读取条目失败: {}", e))?;
        let entry_path = entry.path();
        let file_name = entry.file_name();
        let file_name_str = file_name.to_string_lossy();

        if entry_path.is_dir() {
            // Skip node_modules, hidden directories, and other large directories
            // 跳过 node_modules、隐藏目录和其他大型目录
            if file_name_str.starts_with('.')
                || file_name_str == "node_modules"
                || file_name_str == "target"
                || file_name_str == ".git"
            {
                continue;
            }

            if recursive {
                list_files_recursive(&entry_path, extensions, recursive, files)?;
            }
        } else if let Some(ext) = entry_path.extension() {
            let ext_str = ext.to_string_lossy().to_lowercase();
            if extensions.iter().any(|e| e.to_lowercase() == ext_str) {
                files.push(entry_path.to_string_lossy().to_string());
            }
        }
    }

    Ok(())
}

/// Read binary file and return as base64.
/// 读取二进制文件并返回 base64 编码。
#[tauri::command]
pub async fn read_binary_file_as_base64(path: String) -> Result<String, String> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};

    let bytes = fs::read(&path)
        .map_err(|e| format!("Failed to read binary file | 读取二进制文件失败: {}", e))?;

    Ok(STANDARD.encode(&bytes))
}
