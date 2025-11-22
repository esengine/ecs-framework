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

/// Get system temp directory
#[tauri::command]
pub fn get_temp_dir() -> Result<String, String> {
    std::env::temp_dir()
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Failed to get temp directory".to_string())
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
                        let query = &url[7..]; // Skip "/asset?"
                        if let Some(path_value) = query.strip_prefix("path=") {
                            urlencoding::decode(path_value)
                                .map(|s| s.to_string())
                                .unwrap_or_default()
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
