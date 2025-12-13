//! System operations
//!
//! OS-level operations like opening files, showing in folder, devtools, etc.

use std::path::PathBuf;
use std::process::Command;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::net::UdpSocket;
use tauri::{AppHandle, Manager};
use tiny_http::{Server, Response};
use qrcode::QrCode;
use image::Luma;

// Global server state
static SERVER_RUNNING: AtomicBool = AtomicBool::new(false);
static SERVER_STOP_FLAG: once_cell::sync::Lazy<Arc<AtomicBool>> =
    once_cell::sync::Lazy::new(|| Arc::new(AtomicBool::new(false)));

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

/// Open folder in system file explorer
/// 在系统文件管理器中打开文件夹
#[tauri::command]
pub fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let normalized_path = path.replace('/', "\\");
        Command::new("explorer")
            .arg(&normalized_path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    Ok(())
}

/// Show file in system file explorer
#[tauri::command]
pub fn show_in_folder(file_path: String) -> Result<(), String> {
    println!("[show_in_folder] Received path: {}", file_path);

    #[cfg(target_os = "windows")]
    {
        use std::path::Path;

        // Normalize path separators for Windows
        // 规范化路径分隔符
        let normalized_path = file_path.replace('/', "\\");
        println!("[show_in_folder] Normalized path: {}", normalized_path);

        // Verify the path exists before trying to show it
        // 验证路径存在
        let path = Path::new(&normalized_path);
        let exists = path.exists();
        println!("[show_in_folder] Path exists: {}", exists);

        if !exists {
            return Err(format!("Path does not exist: {}", normalized_path));
        }

        // Windows explorer requires /select, to be concatenated with the path
        // without spaces. Use a single argument to avoid shell parsing issues.
        // Windows 资源管理器要求 /select, 与路径连接在一起，中间没有空格
        let select_arg = format!("/select,{}", normalized_path);
        println!("[show_in_folder] Explorer arg: {}", select_arg);

        Command::new("explorer")
            .arg(&select_arg)
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

/// Get system temp directory
#[tauri::command]
pub fn get_temp_dir() -> Result<String, String> {
    std::env::temp_dir()
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Failed to get temp directory".to_string())
}

/// 使用 where 命令查找可执行文件路径
/// Use 'where' command to find executable path
#[cfg(target_os = "windows")]
fn find_command_path(cmd: &str) -> Option<String> {
    use std::process::Command as StdCommand;
    use std::path::Path;

    // 使用 where 命令查找
    let output = StdCommand::new("where")
        .arg(cmd)
        .output()
        .ok()?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        // 取第一行结果（可能有多个匹配）
        if let Some(first_line) = stdout.lines().next() {
            let path = first_line.trim();
            if !path.is_empty() {
                let path_obj = Path::new(path);

                // 检查是否是 bin 目录下的脚本（VSCode/Cursor 特征）
                // Check if it's a script in bin directory (VSCode/Cursor pattern)
                let is_bin_script = path_obj.parent()
                    .map(|p| p.ends_with("bin"))
                    .unwrap_or(false);

                // 如果找到的是 .cmd 或 .bat，或者是 bin 目录下的脚本（where 可能不返回扩展名）
                // If found .cmd or .bat, or a script in bin directory (where may not return extension)
                let has_script_ext = path.ends_with(".cmd") || path.ends_with(".bat");

                if has_script_ext || is_bin_script {
                    // 尝试找 Code.exe (VSCode) 或 Cursor.exe 等
                    // Try to find Code.exe (VSCode) or Cursor.exe etc.
                    if let Some(bin_dir) = path_obj.parent() {
                        if let Some(parent_dir) = bin_dir.parent() {
                            // VSCode: bin/code.cmd -> Code.exe
                            let exe_path = parent_dir.join("Code.exe");
                            if exe_path.exists() {
                                let exe_str = exe_path.to_string_lossy().to_string();
                                println!("[find_command_path] Found {} exe at: {}", cmd, exe_str);
                                return Some(exe_str);
                            }

                            // Cursor: bin/cursor.cmd -> Cursor.exe
                            let cursor_exe = parent_dir.join("Cursor.exe");
                            if cursor_exe.exists() {
                                let exe_str = cursor_exe.to_string_lossy().to_string();
                                println!("[find_command_path] Found {} exe at: {}", cmd, exe_str);
                                return Some(exe_str);
                            }
                        }
                    }
                }

                println!("[find_command_path] Found {} at: {}", cmd, path);
                return Some(path.to_string());
            }
        }
    }
    None
}

#[cfg(not(target_os = "windows"))]
fn find_command_path(cmd: &str) -> Option<String> {
    use std::process::Command as StdCommand;

    let output = StdCommand::new("which")
        .arg(cmd)
        .output()
        .ok()?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let path = stdout.trim();
        if !path.is_empty() {
            return Some(path.to_string());
        }
    }
    None
}

/// 解析编辑器命令，返回实际可执行路径
/// Resolve editor command to actual executable path
fn resolve_editor_command(editor_command: &str) -> String {
    use std::path::Path;

    // 如果命令已经是完整路径且存在，直接返回
    // If command is already a full path and exists, return it
    if Path::new(editor_command).exists() {
        return editor_command.to_string();
    }

    // 使用系统命令查找可执行文件路径
    // Use system command to find executable path
    if let Some(path) = find_command_path(editor_command) {
        return path;
    }

    // 回退到原始命令 | Fall back to original command
    editor_command.to_string()
}

/// Open project folder with specified editor
/// 使用指定编辑器打开项目文件夹
///
/// @param project_path - Project folder path | 项目文件夹路径
/// @param editor_command - Editor command (e.g., "code", "cursor") | 编辑器命令
/// @param file_path - Optional file to open (will be opened in the editor) | 可选的要打开的文件
#[tauri::command]
pub fn open_with_editor(
    project_path: String,
    editor_command: String,
    file_path: Option<String>,
) -> Result<(), String> {
    use std::path::Path;

    // Normalize paths
    let normalized_project = project_path.replace('/', "\\");
    let normalized_file = file_path.map(|f| f.replace('/', "\\"));

    // Verify project path exists
    let project = Path::new(&normalized_project);
    if !project.exists() {
        return Err(format!("Project path does not exist: {}", normalized_project));
    }

    // 解析编辑器命令到实际路径
    // Resolve editor command to actual path
    let resolved_command = resolve_editor_command(&editor_command);

    println!(
        "[open_with_editor] editor: {} -> {}, project: {}, file: {:?}",
        editor_command, resolved_command, normalized_project, normalized_file
    );

    let mut cmd = Command::new(&resolved_command);

    // VSCode/Cursor CLI 正确用法：
    // 1. 使用 --folder-uri 或直接传文件夹路径会打开新窗口
    // 2. 使用 --add 可以将文件夹添加到当前工作区
    // 3. 使用 --goto file:line:column 可以打开文件并定位
    //
    // VSCode/Cursor CLI correct usage:
    // 1. Use --folder-uri or pass folder path directly to open new window
    // 2. Use --add to add folder to current workspace
    // 3. Use --goto file:line:column to open file and navigate
    //
    // 正确命令格式: code <folder> <file>
    // 这会打开文件夹并同时打开文件
    // Correct command format: code <folder> <file>
    // This opens the folder and also opens the file

    // Add project folder first
    // 先添加项目文件夹
    cmd.arg(&normalized_project);

    // If a specific file is provided, add it directly (not with -g)
    // VSCode will open the folder AND the file
    // 如果提供了文件，直接添加（不使用 -g）
    // VSCode 会同时打开文件夹和文件
    if let Some(ref file) = normalized_file {
        let file_path_obj = Path::new(file);
        if file_path_obj.exists() {
            cmd.arg(file);
        }
    }

    cmd.spawn()
        .map_err(|e| format!("Failed to open with editor '{}': {}", resolved_command, e))?;

    Ok(())
}

/// Get application resource directory
#[tauri::command]
pub fn get_app_resource_dir(app: AppHandle) -> Result<String, String> {
    app.path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource directory: {}", e))
        .and_then(|p| {
            p.to_str()
                .map(|s| s.to_string())
                .ok_or_else(|| "Invalid path encoding".to_string())
        })
}

/// Get current working directory
#[tauri::command]
pub fn get_current_dir() -> Result<String, String> {
    std::env::current_dir()
        .and_then(|p| Ok(p.to_string_lossy().to_string()))
        .map_err(|e| format!("Failed to get current directory: {}", e))
}

/// Update project tsconfig.json with engine type paths
/// 更新项目的 tsconfig.json，添加引擎类型路径
///
/// Scans dist/engine/ directory and adds paths for all modules with .d.ts files.
/// 扫描 dist/engine/ 目录，为所有有 .d.ts 文件的模块添加路径。
#[tauri::command]
pub fn update_project_tsconfig(app: AppHandle, project_path: String) -> Result<(), String> {
    use std::path::Path;

    let project = Path::new(&project_path);
    if !project.exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    // Get engine modules path (dist/engine/)
    // 获取引擎模块路径
    let engine_path = get_engine_modules_base_path_internal(&app)?;

    // Read existing tsconfig.json
    // 读取现有的 tsconfig.json
    let tsconfig_path = project.join("tsconfig.json");
    let tsconfig_editor_path = project.join("tsconfig.editor.json");

    // Update runtime tsconfig
    // 更新运行时 tsconfig
    if tsconfig_path.exists() {
        update_tsconfig_file(&tsconfig_path, &engine_path, false)?;
        println!("[update_project_tsconfig] Updated {}", tsconfig_path.display());
    }

    // Update editor tsconfig
    // 更新编辑器 tsconfig
    if tsconfig_editor_path.exists() {
        update_tsconfig_file(&tsconfig_editor_path, &engine_path, true)?;
        println!("[update_project_tsconfig] Updated {}", tsconfig_editor_path.display());
    }

    Ok(())
}

/// Internal function to get engine modules base path
/// 内部函数：获取引擎模块基础路径
fn get_engine_modules_base_path_internal(app: &AppHandle) -> Result<String, String> {
    let resource_dir = app.path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource directory: {}", e))?;

    // Production mode: resource_dir/engine/
    // 生产模式
    let prod_path = resource_dir.join("engine");
    if prod_path.exists() {
        return prod_path.to_str()
            .map(|s| s.to_string())
            .ok_or_else(|| "Invalid path encoding".to_string());
    }

    // Development mode: workspace/packages/editor-app/dist/engine/
    // 开发模式
    if let Some(ws_root) = find_workspace_root() {
        let dev_path = ws_root.join("packages").join("editor-app").join("dist").join("engine");
        if dev_path.exists() {
            return dev_path.to_str()
                .map(|s| s.to_string())
                .ok_or_else(|| "Invalid path encoding".to_string());
        }
    }

    Err("Engine modules directory not found".to_string())
}

/// Find workspace root directory
/// 查找工作区根目录
fn find_workspace_root() -> Option<std::path::PathBuf> {
    std::env::current_dir()
        .ok()
        .and_then(|cwd| {
            let mut dir = cwd.as_path();
            loop {
                if dir.join("pnpm-workspace.yaml").exists() {
                    return Some(dir.to_path_buf());
                }
                match dir.parent() {
                    Some(parent) => dir = parent,
                    None => return None,
                }
            }
        })
}

/// Update a tsconfig file with engine paths
/// 使用引擎路径更新 tsconfig 文件
///
/// Scans all subdirectories in engine_path for index.d.ts files.
/// 扫描 engine_path 下所有子目录的 index.d.ts 文件。
fn update_tsconfig_file(
    tsconfig_path: &std::path::Path,
    engine_path: &str,
    include_editor: bool,
) -> Result<(), String> {
    use std::fs;

    let content = fs::read_to_string(tsconfig_path)
        .map_err(|e| format!("Failed to read tsconfig: {}", e))?;

    let mut config: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse tsconfig: {}", e))?;

    // Normalize path for cross-platform compatibility
    // 规范化路径以实现跨平台兼容
    let engine_path_normalized = engine_path.replace('\\', "/");

    // Build paths mapping by scanning engine modules directory
    // 通过扫描引擎模块目录构建路径映射
    let mut paths = serde_json::Map::new();
    let mut module_count = 0;

    let engine_dir = std::path::Path::new(engine_path);
    if let Ok(entries) = fs::read_dir(engine_dir) {
        for entry in entries.flatten() {
            let module_path = entry.path();
            if !module_path.is_dir() {
                continue;
            }

            let module_id = module_path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("");

            // Skip editor modules for runtime tsconfig
            // 运行时 tsconfig 跳过编辑器模块
            if !include_editor && module_id.ends_with("-editor") {
                continue;
            }

            // Check for index.d.ts
            // 检查是否存在 index.d.ts
            let dts_path = module_path.join("index.d.ts");
            if !dts_path.exists() {
                continue;
            }

            // Read module.json to get the actual package name
            // 读取 module.json 获取实际的包名
            let module_json_path = module_path.join("module.json");
            let module_name = if module_json_path.exists() {
                fs::read_to_string(&module_json_path)
                    .ok()
                    .and_then(|content| serde_json::from_str::<serde_json::Value>(&content).ok())
                    .and_then(|json| json.get("name").and_then(|n| n.as_str()).map(|s| s.to_string()))
                    .unwrap_or_else(|| format!("@esengine/{}", module_id))
            } else {
                format!("@esengine/{}", module_id)
            };

            let dts_path_str = format!("{}/{}/index.d.ts", engine_path_normalized, module_id);
            paths.insert(module_name, serde_json::json!([dts_path_str]));
            module_count += 1;
        }
    }

    println!("[update_tsconfig_file] Found {} modules with type definitions", module_count);

    // Update compilerOptions.paths
    // 更新 compilerOptions.paths
    if let Some(compiler_options) = config.get_mut("compilerOptions") {
        if let Some(obj) = compiler_options.as_object_mut() {
            obj.insert("paths".to_string(), serde_json::Value::Object(paths));
            // Remove typeRoots since we're using paths
            // 移除 typeRoots，因为我们使用 paths
            obj.remove("typeRoots");
        }
    }

    // Write back
    // 写回文件
    let output = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize tsconfig: {}", e))?;

    fs::write(tsconfig_path, output)
        .map_err(|e| format!("Failed to write tsconfig: {}", e))?;

    Ok(())
}

/// Start a local HTTP server for runtime preview
#[tauri::command]
pub fn start_local_server(root_path: String, port: u16) -> Result<String, String> {
    // If server already running, just return the URL (server persists)
    if SERVER_RUNNING.load(Ordering::SeqCst) {
        return Ok(format!("http://127.0.0.1:{}", port));
    }

    SERVER_STOP_FLAG.store(false, Ordering::SeqCst);
    SERVER_RUNNING.store(true, Ordering::SeqCst);

    // Bind to 0.0.0.0 to allow LAN access
    let addr = format!("0.0.0.0:{}", port);
    let server = Server::http(&addr)
        .map_err(|e| format!("Failed to start server: {}", e))?;

    let root = root_path.clone();
    let stop_flag = Arc::clone(&SERVER_STOP_FLAG);

    thread::spawn(move || {
        loop {
            if stop_flag.load(Ordering::SeqCst) {
                break;
            }

            // Use recv_timeout to allow checking stop flag periodically
            match server.recv_timeout(std::time::Duration::from_millis(100)) {
                Ok(Some(request)) => {
                    let url = request.url().to_string();

                    // Split URL and query string
                    let url_without_query = url.split('?').next().unwrap_or(&url);

                    // Handle different request types
                    let file_path = if url.starts_with("/asset?path=") {
                        // Asset proxy - extract and decode path parameter
                        // 资产代理 - 提取并解码路径参数
                        let query = &url[7..]; // Skip "/asset?"
                        if let Some(path_value) = query.strip_prefix("path=") {
                            let decoded = urlencoding::decode(path_value)
                                .map(|s| s.to_string())
                                .unwrap_or_default();
                            // Normalize path: remove ./ prefix and join with root
                            // 规范化路径：移除 ./ 前缀并与根目录连接
                            let normalized = decoded.trim_start_matches("./");
                            PathBuf::from(&root).join(normalized)
                                .to_string_lossy()
                                .to_string()
                        } else {
                            String::new()
                        }
                    } else if url_without_query == "/" || url_without_query.is_empty() {
                        // Root - serve index.html
                        PathBuf::from(&root).join("index.html")
                            .to_string_lossy()
                            .to_string()
                    } else {
                        // Static files - remove leading slash and append to root
                        let path = url_without_query.trim_start_matches('/');
                        PathBuf::from(&root).join(path)
                            .to_string_lossy()
                            .to_string()
                    };

                    println!("[DevServer] Request: {} -> {}", url, file_path);

                    let response = match std::fs::read(&file_path) {
                        Ok(content) => {
                            let content_type = if file_path.ends_with(".html") {
                                "text/html; charset=utf-8"
                            } else if file_path.ends_with(".js") {
                                "application/javascript"
                            } else if file_path.ends_with(".wasm") {
                                "application/wasm"
                            } else if file_path.ends_with(".css") {
                                "text/css"
                            } else if file_path.ends_with(".json") {
                                "application/json"
                            } else if file_path.ends_with(".png") {
                                "image/png"
                            } else if file_path.ends_with(".jpg") || file_path.ends_with(".jpeg") {
                                "image/jpeg"
                            } else {
                                "application/octet-stream"
                            };

                            Response::from_data(content)
                                .with_header(
                                    tiny_http::Header::from_bytes(&b"Content-Type"[..], content_type.as_bytes())
                                        .unwrap(),
                                )
                                .with_header(
                                    tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..])
                                        .unwrap(),
                                )
                        }
                        Err(_) => Response::from_string("Not Found")
                            .with_status_code(404),
                    };

                    let _ = request.respond(response);
                }
                Ok(None) => {
                    // Timeout, continue loop
                }
                Err(_) => {
                    // Error, exit loop
                    break;
                }
            }
        }

        SERVER_RUNNING.store(false, Ordering::SeqCst);
    });

    Ok(format!("http://127.0.0.1:{}", port))
}

/// Stop the local HTTP server
#[tauri::command]
pub fn stop_local_server() -> Result<(), String> {
    SERVER_STOP_FLAG.store(true, Ordering::SeqCst);
    Ok(())
}

/// Get local IP address for LAN access
#[tauri::command]
pub fn get_local_ip() -> Result<String, String> {
    // Use ipconfig on Windows to get the real LAN IP
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("cmd")
            .args(["/C", "ipconfig"])
            .output()
            .map_err(|e| format!("Failed to run ipconfig: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);

        // Parse ipconfig output to find IPv4 addresses
        let mut found_ips: Vec<String> = Vec::new();

        for line in output_str.lines() {
            if line.contains("IPv4") || line.contains("IP Address") {
                // Extract IP from line like "   IPv4 Address. . . . . . . . . . . : 192.168.1.100"
                if let Some(ip_part) = line.split(':').nth(1) {
                    let ip = ip_part.trim().to_string();
                    // Prefer 192.168.x.x or 10.x.x.x addresses
                    if ip.starts_with("192.168.") || ip.starts_with("10.") {
                        return Ok(ip);
                    }
                    // Collect other IPs as fallback, skip virtual ones
                    if !ip.starts_with("172.") && !ip.starts_with("127.") && !ip.starts_with("169.254.") {
                        found_ips.push(ip);
                    }
                }
            }
        }

        // Return first non-virtual IP found
        if let Some(ip) = found_ips.first() {
            return Ok(ip.clone());
        }
    }

    // Fallback for non-Windows or if ipconfig fails
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;

    socket.connect("8.8.8.8:80")
        .map_err(|e| format!("Failed to connect: {}", e))?;

    let local_addr = socket.local_addr()
        .map_err(|e| format!("Failed to get local address: {}", e))?;

    Ok(local_addr.ip().to_string())
}

/// Generate QR code as base64 PNG
#[tauri::command]
pub fn generate_qrcode(text: String) -> Result<String, String> {
    let code = QrCode::new(text.as_bytes())
        .map_err(|e| format!("Failed to create QR code: {}", e))?;

    let image = code.render::<Luma<u8>>()
        .min_dimensions(200, 200)
        .build();

    let mut png_data = Vec::new();
    let mut cursor = std::io::Cursor::new(&mut png_data);
    image.write_to(&mut cursor, image::ImageFormat::Png)
        .map_err(|e| format!("Failed to encode PNG: {}", e))?;

    Ok(base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &png_data))
}
