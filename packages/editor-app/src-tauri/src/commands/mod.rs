//! Command modules.
//! 命令模块。
//!
//! All Tauri commands organized by domain.
//! 所有按领域组织的 Tauri 命令。

pub mod build;
pub mod compiler;
pub mod dialog;
pub mod file_system;
pub mod modules;
pub mod plugin;
pub mod profiler;
pub mod project;
pub mod system;

// Re-export all commands for convenience | 重新导出所有命令以方便使用
pub use build::*;
pub use compiler::*;
pub use dialog::*;
pub use file_system::*;
pub use modules::*;
pub use plugin::*;
pub use profiler::*;
pub use project::*;
pub use system::*;
