//! 2D vector implementation.
//! 2D向量实现。

use bytemuck::{Pod, Zeroable};

/// 2D vector for positions, velocities, and directions.
/// 用于位置、速度和方向的2D向量。
///
/// # Examples | 示例
/// ```rust
/// let pos = Vec2::new(100.0, 200.0);
/// let velocity = Vec2::new(1.0, 0.0);
/// let new_pos = pos + velocity * 16.0;
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Default, Pod, Zeroable)]
#[repr(C)]
pub struct Vec2 {
    /// X component.
    /// X分量。
    pub x: f32,
    /// Y component.
    /// Y分量。
    pub y: f32,
}

impl Vec2 {
    /// Zero vector (0, 0).
    /// 零向量。
    pub const ZERO: Self = Self { x: 0.0, y: 0.0 };

    /// Unit vector pointing right (1, 0).
    /// 指向右的单位向量。
    pub const RIGHT: Self = Self { x: 1.0, y: 0.0 };

    /// Unit vector pointing up (0, 1).
    /// 指向上的单位向量。
    pub const UP: Self = Self { x: 0.0, y: 1.0 };

    /// Create a new 2D vector.
    /// 创建新的2D向量。
    #[inline]
    pub const fn new(x: f32, y: f32) -> Self {
        Self { x, y }
    }

    /// Create a vector with both components set to the same value.
    /// 创建两个分量相同的向量。
    #[inline]
    pub const fn splat(v: f32) -> Self {
        Self { x: v, y: v }
    }

    /// Calculate the length (magnitude) of the vector.
    /// 计算向量的长度（模）。
    #[inline]
    pub fn length(&self) -> f32 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    /// Calculate the squared length (avoids sqrt).
    /// 计算长度的平方（避免开方运算）。
    #[inline]
    pub fn length_squared(&self) -> f32 {
        self.x * self.x + self.y * self.y
    }

    /// Normalize the vector (make it unit length).
    /// 归一化向量（使其成为单位长度）。
    #[inline]
    pub fn normalize(&self) -> Self {
        let len = self.length();
        if len > 0.0 {
            Self {
                x: self.x / len,
                y: self.y / len,
            }
        } else {
            Self::ZERO
        }
    }

    /// Calculate dot product with another vector.
    /// 计算与另一个向量的点积。
    #[inline]
    pub fn dot(&self, other: &Self) -> f32 {
        self.x * other.x + self.y * other.y
    }

    /// Calculate cross product (returns scalar for 2D).
    /// 计算叉积（2D返回标量）。
    #[inline]
    pub fn cross(&self, other: &Self) -> f32 {
        self.x * other.y - self.y * other.x
    }

    /// Calculate distance to another point.
    /// 计算到另一点的距离。
    #[inline]
    pub fn distance(&self, other: &Self) -> f32 {
        (*self - *other).length()
    }

    /// Linear interpolation between two vectors.
    /// 两个向量之间的线性插值。
    #[inline]
    pub fn lerp(&self, other: &Self, t: f32) -> Self {
        Self {
            x: self.x + (other.x - self.x) * t,
            y: self.y + (other.y - self.y) * t,
        }
    }

    /// Rotate the vector by an angle (in radians).
    /// 按角度旋转向量（弧度）。
    #[inline]
    pub fn rotate(&self, angle: f32) -> Self {
        let cos = angle.cos();
        let sin = angle.sin();
        Self {
            x: self.x * cos - self.y * sin,
            y: self.x * sin + self.y * cos,
        }
    }

    /// Convert to glam Vec2.
    /// 转换为glam Vec2。
    #[inline]
    pub fn to_glam(&self) -> glam::Vec2 {
        glam::Vec2::new(self.x, self.y)
    }

    /// Create from glam Vec2.
    /// 从glam Vec2创建。
    #[inline]
    pub fn from_glam(v: glam::Vec2) -> Self {
        Self { x: v.x, y: v.y }
    }
}

// Operator implementations | 运算符实现

impl std::ops::Add for Vec2 {
    type Output = Self;

    #[inline]
    fn add(self, rhs: Self) -> Self::Output {
        Self {
            x: self.x + rhs.x,
            y: self.y + rhs.y,
        }
    }
}

impl std::ops::Sub for Vec2 {
    type Output = Self;

    #[inline]
    fn sub(self, rhs: Self) -> Self::Output {
        Self {
            x: self.x - rhs.x,
            y: self.y - rhs.y,
        }
    }
}

impl std::ops::Mul<f32> for Vec2 {
    type Output = Self;

    #[inline]
    fn mul(self, rhs: f32) -> Self::Output {
        Self {
            x: self.x * rhs,
            y: self.y * rhs,
        }
    }
}

impl std::ops::Div<f32> for Vec2 {
    type Output = Self;

    #[inline]
    fn div(self, rhs: f32) -> Self::Output {
        Self {
            x: self.x / rhs,
            y: self.y / rhs,
        }
    }
}

impl std::ops::Neg for Vec2 {
    type Output = Self;

    #[inline]
    fn neg(self) -> Self::Output {
        Self {
            x: -self.x,
            y: -self.y,
        }
    }
}

impl From<(f32, f32)> for Vec2 {
    #[inline]
    fn from((x, y): (f32, f32)) -> Self {
        Self { x, y }
    }
}

impl From<[f32; 2]> for Vec2 {
    #[inline]
    fn from([x, y]: [f32; 2]) -> Self {
        Self { x, y }
    }
}
