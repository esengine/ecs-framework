//! 2D transform implementation.
//! 2D变换实现。

use super::Vec2;
use glam::Mat3;

/// 2D transformation combining position, rotation, and scale.
/// 组合位置、旋转和缩放的2D变换。
///
/// # Examples | 示例
/// ```rust
/// use es_engine::math::{Transform2D, Vec2};
/// let mut transform = Transform2D::new();
/// transform.position = Vec2::new(100.0, 200.0);
/// transform.rotation = std::f32::consts::PI / 4.0; // 45 degrees
/// transform.scale = Vec2::new(2.0, 2.0);
///
/// let matrix = transform.to_matrix();
/// ```
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Transform2D {
    /// Position in world space.
    /// 世界空间中的位置。
    pub position: Vec2,

    /// Rotation in radians.
    /// 旋转角度（弧度）。
    pub rotation: f32,

    /// Scale factor.
    /// 缩放因子。
    pub scale: Vec2,

    /// Origin point for rotation and scaling (0-1 range, relative to size).
    /// 旋转和缩放的原点（0-1范围，相对于尺寸）。
    pub origin: Vec2,
}

impl Default for Transform2D {
    fn default() -> Self {
        Self {
            position: Vec2::ZERO,
            rotation: 0.0,
            scale: Vec2::new(1.0, 1.0),
            origin: Vec2::new(0.5, 0.5), // Center by default | 默认居中
        }
    }
}

impl Transform2D {
    /// Create a new transform with default values.
    /// 使用默认值创建新变换。
    #[inline]
    pub fn new() -> Self {
        Self::default()
    }

    /// Create a transform with specified position.
    /// 使用指定位置创建变换。
    #[inline]
    pub fn from_position(x: f32, y: f32) -> Self {
        Self {
            position: Vec2::new(x, y),
            ..Default::default()
        }
    }

    /// Create a transform with position, rotation, and scale.
    /// 使用位置、旋转和缩放创建变换。
    #[inline]
    pub fn from_pos_rot_scale(position: Vec2, rotation: f32, scale: Vec2) -> Self {
        Self {
            position,
            rotation,
            scale,
            ..Default::default()
        }
    }

    /// Convert to a 3x3 transformation matrix.
    /// 转换为3x3变换矩阵。
    ///
    /// The matrix is constructed as: T * R * S (translate, rotate, scale).
    /// 矩阵构造顺序为：T * R * S（平移、旋转、缩放）。
    pub fn to_matrix(&self) -> Mat3 {
        let cos = self.rotation.cos();
        let sin = self.rotation.sin();

        // Construct TRS matrix directly for performance
        // 直接构造TRS矩阵以提高性能
        Mat3::from_cols(
            glam::Vec3::new(cos * self.scale.x, sin * self.scale.x, 0.0),
            glam::Vec3::new(-sin * self.scale.y, cos * self.scale.y, 0.0),
            glam::Vec3::new(self.position.x, self.position.y, 1.0),
        )
    }

    /// Convert to a 3x3 matrix with origin offset applied.
    /// 转换为应用原点偏移的3x3矩阵。
    ///
    /// # Arguments | 参数
    /// * `width` - Sprite width | 精灵宽度
    /// * `height` - Sprite height | 精灵高度
    pub fn to_matrix_with_origin(&self, width: f32, height: f32) -> Mat3 {
        let ox = -self.origin.x * width * self.scale.x;
        let oy = -self.origin.y * height * self.scale.y;

        let cos = self.rotation.cos();
        let sin = self.rotation.sin();

        // Apply origin offset after rotation
        // 在旋转后应用原点偏移
        let tx = self.position.x + ox * cos - oy * sin;
        let ty = self.position.y + ox * sin + oy * cos;

        Mat3::from_cols(
            glam::Vec3::new(cos * self.scale.x, sin * self.scale.x, 0.0),
            glam::Vec3::new(-sin * self.scale.y, cos * self.scale.y, 0.0),
            glam::Vec3::new(tx, ty, 1.0),
        )
    }

    /// Transform a local point to world space.
    /// 将局部点变换到世界空间。
    #[inline]
    pub fn transform_point(&self, point: Vec2) -> Vec2 {
        let rotated = point.rotate(self.rotation);
        Vec2::new(
            rotated.x * self.scale.x + self.position.x,
            rotated.y * self.scale.y + self.position.y,
        )
    }

    /// Inverse transform a world point to local space.
    /// 将世界点反变换到局部空间。
    #[inline]
    pub fn inverse_transform_point(&self, point: Vec2) -> Vec2 {
        let local = Vec2::new(
            (point.x - self.position.x) / self.scale.x,
            (point.y - self.position.y) / self.scale.y,
        );
        local.rotate(-self.rotation)
    }

    /// Translate the transform by a delta.
    /// 按增量平移变换。
    #[inline]
    pub fn translate(&mut self, delta: Vec2) {
        self.position = self.position + delta;
    }

    /// Rotate the transform by an angle (in radians).
    /// 按角度旋转变换（弧度）。
    #[inline]
    pub fn rotate(&mut self, angle: f32) {
        self.rotation += angle;
    }

    /// Scale the transform by a factor.
    /// 按因子缩放变换。
    #[inline]
    pub fn scale_by(&mut self, factor: Vec2) {
        self.scale = Vec2::new(self.scale.x * factor.x, self.scale.y * factor.y);
    }
}
