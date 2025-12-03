//! Material system for 2D rendering.
//! 2D渲染的材质系统。

mod material;
mod manager;
mod uniform;

pub use material::{Material, BlendMode, CullMode};
pub use manager::MaterialManager;
pub use uniform::{UniformValue, MaterialUniforms};
