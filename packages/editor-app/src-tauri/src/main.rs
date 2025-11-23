//! ECS Framework Editor - Tauri Backend
//!
//! Clean entry point that handles application setup and command registration.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod profiler_ws;
mod state;

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::Manager;

use state::{ProfilerState, ProjectPaths};

fn main() {
    // Initialize shared state
    let project_paths: ProjectPaths = Arc::new(Mutex::new(HashMap::new()));
    let project_paths_for_protocol = Arc::clone(&project_paths);

    let profiler_state = ProfilerState::new();

    // Build and run the Tauri application
    tauri::Builder::default()
        // Register plugins
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_cli::init())
        // Register custom URI scheme for project files
        .register_uri_scheme_protocol("project", move |_app, request| {
            handle_project_protocol(request, &project_paths_for_protocol)
        })
        // Setup application state
        .setup(move |app| {
            app.manage(project_paths);
            app.manage(profiler_state);
            Ok(())
        })
        // Register all commands
        .invoke_handler(tauri::generate_handler![
            // Project management
            commands::open_project,
            commands::save_project,
            commands::export_binary,
            commands::set_project_base_path,
            commands::scan_behavior_trees,
            // File system operations
            commands::read_file_content,
            commands::write_file_content,
            commands::write_binary_file,
            commands::path_exists,
            commands::create_directory,
            commands::create_file,
            commands::delete_file,
            commands::delete_folder,
            commands::rename_file_or_folder,
            commands::list_directory,
            commands::scan_directory,
            commands::read_file_as_base64,
            commands::copy_file,
            // Dialog operations
            commands::open_folder_dialog,
            commands::open_file_dialog,
            commands::save_file_dialog,
            // Profiler server
            commands::start_profiler_server,
            commands::stop_profiler_server,
            commands::get_profiler_status,
            // Plugin management
            commands::build_plugin,
            commands::install_marketplace_plugin,
            commands::uninstall_marketplace_plugin,
            // System operations
            commands::toggle_devtools,
            commands::open_file_with_default_app,
            commands::show_in_folder,
            commands::get_temp_dir,
            commands::get_app_resource_dir,
            commands::get_current_dir,
            commands::start_local_server,
            commands::stop_local_server,
            commands::get_local_ip,
            commands::generate_qrcode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Handle the custom 'project://' URI scheme protocol
///
/// This allows the frontend to load project files through a custom protocol,
/// enabling features like hot-reloading plugins from the project directory.
fn handle_project_protocol(
    request: tauri::http::Request<Vec<u8>>,
    project_paths: &ProjectPaths,
) -> tauri::http::Response<Vec<u8>> {
    let uri = request.uri();
    let path = uri.path();

    let file_path = {
        let paths = match project_paths.lock() {
            Ok(p) => p,
            Err(_) => {
                return tauri::http::Response::builder()
                    .status(500)
                    .body(Vec::new())
                    .unwrap();
            }
        };

        match paths.get("current") {
            Some(base_path) => format!("{}{}", base_path, path),
            None => {
                return tauri::http::Response::builder()
                    .status(404)
                    .body(Vec::new())
                    .unwrap();
            }
        }
    };

    match std::fs::read(&file_path) {
        Ok(content) => {
            let mime_type = get_mime_type(&file_path);

            tauri::http::Response::builder()
                .status(200)
                .header("Content-Type", mime_type)
                .header("Access-Control-Allow-Origin", "*")
                .body(content)
                .unwrap()
        }
        Err(e) => {
            eprintln!("Failed to read file {}: {}", file_path, e);
            tauri::http::Response::builder()
                .status(404)
                .body(Vec::new())
                .unwrap()
        }
    }
}

/// Get MIME type based on file extension
fn get_mime_type(file_path: &str) -> &'static str {
    if file_path.ends_with(".ts") || file_path.ends_with(".tsx") {
        "application/javascript"
    } else if file_path.ends_with(".js") {
        "application/javascript"
    } else if file_path.ends_with(".json") {
        "application/json"
    } else if file_path.ends_with(".css") {
        "text/css"
    } else if file_path.ends_with(".html") {
        "text/html"
    } else {
        "text/plain"
    }
}
