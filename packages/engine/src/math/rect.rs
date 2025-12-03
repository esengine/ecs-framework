//! Rectangle implementation.
//! 矩形实现。

use super::Vec2;

/// Axis-aligned rectangle.
/// 轴对齐矩形。
///
/// # Examples | 示例
/// ```rust
/// use es_engine::math::{Rect, Vec2};
/// let rect = Rect::new(10.0, 20.0, 100.0, 50.0);
/// let point = Vec2::new(50.0, 40.0);
/// assert!(rect.contains_point(point));
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Rect {
    /// X position (left edge).
    /// X位置（左边缘）。
    pub x: f32,
    /// Y position (top edge).
    /// Y位置（上边缘）。
    pub y: f32,
    /// Width.
    /// 宽度。
    pub width: f32,
    /// Height.
    /// 高度。
    pub height: f32,
}

impl Rect {
    /// Create a new rectangle.
    /// 创建新矩形。
    #[inline]
    pub const fn new(x: f32, y: f32, width: f32, height: f32) -> Self {
        Self { x, y, width, height }
    }

    /// Create a rectangle from two corner points.
    /// 从两个角点创建矩形。
    #[inline]
    pub fn from_corners(min: Vec2, max: Vec2) -> Self {
        Self {
            x: min.x,
            y: min.y,
            width: max.x - min.x,
            height: max.y - min.y,
        }
    }

    /// Create a rectangle centered at a point.
    /// 创建以某点为中心的矩形。
    #[inline]
    pub fn from_center(center: Vec2, width: f32, height: f32) -> Self {
        Self {
            x: center.x - width * 0.5,
            y: center.y - height * 0.5,
            width,
            height,
        }
    }

    /// Get the minimum (top-left) corner.
    /// 获取最小（左上）角点。
    #[inline]
    pub fn min(&self) -> Vec2 {
        Vec2::new(self.x, self.y)
    }

    /// Get the maximum (bottom-right) corner.
    /// 获取最大（右下）角点。
    #[inline]
    pub fn max(&self) -> Vec2 {
        Vec2::new(self.x + self.width, self.y + self.height)
    }

    /// Get the center point.
    /// 获取中心点。
    #[inline]
    pub fn center(&self) -> Vec2 {
        Vec2::new(self.x + self.width * 0.5, self.y + self.height * 0.5)
    }

    /// Get the size as a vector.
    /// 获取尺寸向量。
    #[inline]
    pub fn size(&self) -> Vec2 {
        Vec2::new(self.width, self.height)
    }

    /// Check if the rectangle contains a point.
    /// 检查矩形是否包含某点。
    #[inline]
    pub fn contains_point(&self, point: Vec2) -> bool {
        point.x >= self.x
            && point.x <= self.x + self.width
            && point.y >= self.y
            && point.y <= self.y + self.height
    }

    /// Check if this rectangle intersects with another.
    /// 检查此矩形是否与另一个相交。
    #[inline]
    pub fn intersects(&self, other: &Rect) -> bool {
        self.x < other.x + other.width
            && self.x + self.width > other.x
            && self.y < other.y + other.height
            && self.y + self.height > other.y
    }

    /// Get the intersection of two rectangles.
    /// 获取两个矩形的交集。
    pub fn intersection(&self, other: &Rect) -> Option<Rect> {
        let x = self.x.max(other.x);
        let y = self.y.max(other.y);
        let right = (self.x + self.width).min(other.x + other.width);
        let bottom = (self.y + self.height).min(other.y + other.height);

        if right > x && bottom > y {
            Some(Rect::new(x, y, right - x, bottom - y))
        } else {
            None
        }
    }

    /// Get the union of two rectangles (bounding box).
    /// 获取两个矩形的并集（包围盒）。
    pub fn union(&self, other: &Rect) -> Rect {
        let x = self.x.min(other.x);
        let y = self.y.min(other.y);
        let right = (self.x + self.width).max(other.x + other.width);
        let bottom = (self.y + self.height).max(other.y + other.height);

        Rect::new(x, y, right - x, bottom - y)
    }

    /// Expand the rectangle by a margin.
    /// 按边距扩展矩形。
    #[inline]
    pub fn expand(&self, margin: f32) -> Rect {
        Rect::new(
            self.x - margin,
            self.y - margin,
            self.width + margin * 2.0,
            self.height + margin * 2.0,
        )
    }
}
