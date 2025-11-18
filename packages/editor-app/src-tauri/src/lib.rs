//! ECS Editor Library
//!
//! Exports all public modules for the Tauri application.

pub mod commands;
pub mod profiler_ws;
pub mod state;

// Re-export commonly used types
pub use state::{ProfilerState, ProjectPaths};
