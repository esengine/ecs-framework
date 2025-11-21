//! Vertex data structures for sprite rendering.
//! 用于精灵渲染的顶点数据结构。

use bytemuck::{Pod, Zeroable};

/// Size of a single sprite vertex in bytes.
/// 单个精灵顶点的字节大小。
pub const VERTEX_SIZE: usize = std::mem::size_of::<SpriteVertex>();

/// Number of floats per vertex.
/// 每个顶点的浮点数数量。
pub const FLOATS_PER_VERTEX: usize = 8;

/// Sprite vertex data.
/// 精灵顶点数据。
///
/// Each sprite requires 4 vertices (quad), each with position, UV, and color.
/// 每个精灵需要4个顶点（四边形），每个顶点包含位置、UV和颜色。
#[derive(Debug, Clone, Copy, Pod, Zeroable)]
#[repr(C)]
pub struct SpriteVertex {
    /// Position (x, y).
    /// 位置。
    pub position: [f32; 2],

    /// Texture coordinates (u, v).
    /// 纹理坐标。
    pub tex_coord: [f32; 2],

    /// Color (r, g, b, a).
    /// 颜色。
    pub color: [f32; 4],
}

impl SpriteVertex {
    /// Create a new sprite vertex.
    /// 创建新的精灵顶点。
    #[inline]
    pub const fn new(
        position: [f32; 2],
        tex_coord: [f32; 2],
        color: [f32; 4],
    ) -> Self {
        Self {
            position,
            tex_coord,
            color,
        }
    }
}

impl Default for SpriteVertex {
    fn default() -> Self {
        Self {
            position: [0.0, 0.0],
            tex_coord: [0.0, 0.0],
            color: [1.0, 1.0, 1.0, 1.0],
        }
    }
}
