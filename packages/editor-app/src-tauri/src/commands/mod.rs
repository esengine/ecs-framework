//! Command modules
//!
//! All Tauri commands organized by domain.

pub mod dialog;
pub mod file_system;
pub mod plugin;
pub mod profiler;
pub mod project;
pub mod system;

// Re-export all commands for convenience
pub use dialog::*;
pub use file_system::*;
pub use plugin::*;
pub use profiler::*;
pub use project::*;
pub use system::*;
