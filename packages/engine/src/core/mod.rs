//! Core engine module containing lifecycle management and context.
//! 核心引擎模块，包含生命周期管理和上下文。

pub mod error;
pub mod context;
mod engine;

pub use engine::{Engine, EngineConfig};
pub use context::WebGLContext;
pub use error::{EngineError, Result};
