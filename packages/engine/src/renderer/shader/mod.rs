//! Shader management system.
//! Shader管理系统。

mod program;
mod builtin;
mod manager;

pub use program::ShaderProgram;
pub use builtin::{SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER};
pub use manager::{ShaderManager, SHADER_ID_DEFAULT_SPRITE};
