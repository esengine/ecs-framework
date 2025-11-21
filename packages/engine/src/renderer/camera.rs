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
    /// Creates an orthographic projection that maps world coordinates
    /// to normalized device coordinates [-1, 1].
    /// 创建将世界坐标映射到标准化设备坐标[-1, 1]的正交投影。
    ///
    /// Coordinate system | 坐标系统:
    /// - World: Y-up, origin at camera position | 世界坐标：Y向上，原点在相机位置
    /// - Screen: Y-down, origin at top-left | 屏幕坐标：Y向下，原点在左上角
    /// - NDC: Y-up, origin at center [-1, 1] | NDC：Y向上，原点在中心
    ///
    /// When zoom=1, 1 world unit = 1 screen pixel.
    /// 当zoom=1时，1个世界单位 = 1个屏幕像素。
    pub fn projection_matrix(&self) -> Mat3 {
        // Standard orthographic projection
        // 标准正交投影
        // Maps world coordinates to NDC [-1, 1]
        // 将世界坐标映射到NDC [-1, 1]

        // Scale factors: world units to NDC
        // 缩放因子：世界单位到NDC
        let sx = 2.0 / self.width * self.zoom;
        let sy = 2.0 / self.height * self.zoom;

        // Handle rotation
        // 处理旋转
        let cos = self.rotation.cos();
        let sin = self.rotation.sin();

        // Translation: camera position to NDC
        // 平移：相机位置到NDC
        // We negate position because moving camera right should move world left
        // 取反位置，因为相机向右移动应该使世界向左移动
        let tx = -self.position.x * sx;
        let ty = -self.position.y * sy;

        // Combine scale, rotation, and translation
        // 组合缩放、旋转和平移
        // Matrix = Scale * Rotation * Translation (applied right to left)
        // 矩阵 = 缩放 * 旋转 * 平移（从右到左应用）
        if self.rotation != 0.0 {
            // With rotation: need to rotate the translation as well
            // 有旋转时：平移也需要旋转
            let rtx = tx * cos - ty * sin;
            let rty = tx * sin + ty * cos;

            Mat3::from_cols(
                glam::Vec3::new(sx * cos, sx * sin, 0.0),
                glam::Vec3::new(-sy * sin, sy * cos, 0.0),
                glam::Vec3::new(rtx, rty, 1.0),
            )
        } else {
            // No rotation: simplified matrix
            // 无旋转：简化矩阵
            Mat3::from_cols(
                glam::Vec3::new(sx, 0.0, 0.0),
                glam::Vec3::new(0.0, sy, 0.0),
                glam::Vec3::new(tx, ty, 1.0),
            )
        }
    }

    /// Convert screen coordinates to world coordinates.
    /// 将屏幕坐标转换为世界坐标。
    ///
    /// Screen: (0,0) at top-left, Y-down | 屏幕：(0,0)在左上角，Y向下
    /// World: Y-up, camera at center | 世界：Y向上，相机在中心
    pub fn screen_to_world(&self, screen: Vec2) -> Vec2 {
        // Convert screen to NDC-like coordinates (centered, Y-up)
        // 将屏幕坐标转换为类NDC坐标（居中，Y向上）
        let centered_x = screen.x - self.width / 2.0;
        let centered_y = self.height / 2.0 - screen.y; // Flip Y

        // Apply inverse zoom and add camera position
        // 应用反向缩放并加上相机位置
        let world_x = centered_x / self.zoom + self.position.x;
        let world_y = centered_y / self.zoom + self.position.y;

        if self.rotation != 0.0 {
            // Apply inverse rotation around camera position
            // 围绕相机位置应用反向旋转
            let dx = world_x - self.position.x;
            let dy = world_y - self.position.y;
            let cos = (-self.rotation).cos();
            let sin = (-self.rotation).sin();

            Vec2::new(
                dx * cos - dy * sin + self.position.x,
                dx * sin + dy * cos + self.position.y,
            )
        } else {
            Vec2::new(world_x, world_y)
        }
    }

    /// Convert world coordinates to screen coordinates.
    /// 将世界坐标转换为屏幕坐标。
    ///
    /// World: Y-up | 世界：Y向上
    /// Screen: (0,0) at top-left, Y-down | 屏幕：(0,0)在左上角，Y向下
    pub fn world_to_screen(&self, world: Vec2) -> Vec2 {
        let dx = world.x - self.position.x;
        let dy = world.y - self.position.y;

        let (rx, ry) = if self.rotation != 0.0 {
            let cos = self.rotation.cos();
            let sin = self.rotation.sin();
            (dx * cos - dy * sin, dx * sin + dy * cos)
        } else {
            (dx, dy)
        };

        // Apply zoom and convert to screen coordinates
        // 应用缩放并转换为屏幕坐标
        let screen_x = rx * self.zoom + self.width / 2.0;
        let screen_y = self.height / 2.0 - ry * self.zoom; // Flip Y

        Vec2::new(screen_x, screen_y)
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
        self.zoom = zoom.clamp(0.01, 100.0);
    }
}

impl Default for Camera2D {
    fn default() -> Self {
        Self::new(800.0, 600.0)
    }
}
