//! Mathematical primitives for 2D game development.
//! 用于2D游戏开发的数学基元。
//!
//! This module provides wrappers around `glam` types with additional
//! game-specific functionality.
//! 此模块提供对`glam`类型的封装，并添加游戏特定的功能。

mod vec2;
mod transform;
mod rect;
mod color;

pub use vec2::Vec2;
pub use transform::Transform2D;
pub use rect::Rect;
pub use color::Color;

// Re-export glam types for internal use | 重新导出glam类型供内部使用
pub use glam::{Mat3, Mat4, Vec3, Vec4};
