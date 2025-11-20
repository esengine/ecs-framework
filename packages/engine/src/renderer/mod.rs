//! 2D rendering system with batch optimization.
//! 带批处理优化的2D渲染系统。

pub mod batch;
pub mod shader;
pub mod texture;

mod renderer2d;
mod camera;

pub use renderer2d::Renderer2D;
pub use camera::Camera2D;
pub use batch::SpriteBatch;
pub use texture::{Texture, TextureManager};
