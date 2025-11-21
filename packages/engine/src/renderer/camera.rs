//! 2D camera implementation.
//! 2D相机实现。

use crate::math::Vec2;
use glam::Mat3;

/// 2D orthographic camera.
/// 2D正交相机。
///
/// Provides view and projection matrices for 2D rendering.
/// 提供用于2D渲染的视图和投影矩阵。
#[derive(Debug, Clone)]
pub struct Camera2D {
    /// Camera position in world space.
    /// 相机在世界空间中的位置。
    pub position: Vec2,

    /// Rotation in radians.
    /// 旋转角度（弧度）。
    pub rotation: f32,

    /// Zoom level (1.0 = normal).
    /// 缩放级别（1.0 = 正常）。
    pub zoom: f32,

    /// Viewport width.
    /// 视口宽度。
    width: f32,

    /// Viewport height.
    /// 视口高度。
    height: f32,
}

impl Camera2D {
    /// Create a new 2D camera.
    /// 创建新的2D相机。
    ///
    /// # Arguments | 参数
    /// * `width` - Viewport width | 视口宽度
    /// * `height` - Viewport height | 视口高度
    pub fn new(width: f32, height: f32) -> Self {
        Self {
            position: Vec2::ZERO,
            rotation: 0.0,
            zoom: 1.0,
            width,
            height,
        }
    }

    /// Update viewport size.
    /// 更新视口大小。
    pub fn set_viewport(&mut self, width: f32, height: f32) {
        self.width = width;
        self.height = height;
    }

    /// Get the projection matrix.
    /// 获取投影矩阵。
    ///
    /// Creates an orthographic projection that maps screen coordinates
    /// to normalized device coordinates.
    /// 创建将屏幕坐标映射到标准化设备坐标的正交投影。
    pub fn projection_matrix(&self) -> Mat3 {
        // Orthographic projection | 正交投影
        // Maps [0, width] x [0, height] to [-1, 1] x [-1, 1]
        let sx = 2.0 / self.width * self.zoom;
        let sy = -2.0 / self.height * self.zoom; // Flip Y axis | 翻转Y轴

        let cos = self.rotation.cos();
        let sin = self.rotation.sin();

        // Apply zoom, rotation, and translation
        // 应用缩放、旋转和平移
        let tx = -self.position.x * sx * cos - self.position.y * sy * sin - 1.0;
        let ty = -self.position.x * sx * sin + self.position.y * sy * cos + 1.0;

        Mat3::from_cols(
            glam::Vec3::new(sx * cos, sx * sin, 0.0),
            glam::Vec3::new(sy * -sin, sy * cos, 0.0),
            glam::Vec3::new(tx, ty, 1.0),
        )
    }

    /// Convert screen coordinates to world coordinates.
    /// 将屏幕坐标转换为世界坐标。
    pub fn screen_to_world(&self, screen: Vec2) -> Vec2 {
        let x = (screen.x / self.zoom) + self.position.x;
        let y = (screen.y / self.zoom) + self.position.y;

        if self.rotation != 0.0 {
            let dx = x - self.position.x;
            let dy = y - self.position.y;
            let cos = (-self.rotation).cos();
            let sin = (-self.rotation).sin();

            Vec2::new(
                dx * cos - dy * sin + self.position.x,
                dx * sin + dy * cos + self.position.y,
            )
        } else {
            Vec2::new(x, y)
        }
    }

    /// Convert world coordinates to screen coordinates.
    /// 将世界坐标转换为屏幕坐标。
    pub fn world_to_screen(&self, world: Vec2) -> Vec2 {
        let dx = world.x - self.position.x;
        let dy = world.y - self.position.y;

        if self.rotation != 0.0 {
            let cos = self.rotation.cos();
            let sin = self.rotation.sin();
            let rx = dx * cos - dy * sin;
            let ry = dx * sin + dy * cos;

            Vec2::new(rx * self.zoom, ry * self.zoom)
        } else {
            Vec2::new(dx * self.zoom, dy * self.zoom)
        }
    }

    /// Move camera by delta.
    /// 按增量移动相机。
    #[inline]
    pub fn translate(&mut self, delta: Vec2) {
        self.position = self.position + delta;
    }

    /// Set zoom level with clamping.
    /// 设置缩放级别并限制范围。
    #[inline]
    pub fn set_zoom(&mut self, zoom: f32) {
        self.zoom = zoom.clamp(0.1, 10.0);
    }
}

impl Default for Camera2D {
    fn default() -> Self {
        Self::new(800.0, 600.0)
    }
}
