//! Shader management system.
//! Shader管理系统。

mod program;
mod builtin;

pub use program::ShaderProgram;
pub use builtin::{SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER};
