//! Sprite batch rendering system.
//! 精灵批处理渲染系统。

mod sprite_batch;
mod vertex;

pub use sprite_batch::{BatchKey, SpriteBatch};
pub use vertex::{SpriteVertex, VERTEX_SIZE};
