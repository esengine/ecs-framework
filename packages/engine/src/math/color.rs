//! Color utilities.
//! 颜色工具。

use bytemuck::{Pod, Zeroable};

/// RGBA color representation.
/// RGBA颜色表示。
///
/// Colors are stored as normalized floats (0.0-1.0) and can be converted
/// to packed u32 format for efficient GPU transfer.
/// 颜色以归一化浮点数（0.0-1.0）存储，可转换为打包的u32格式以高效传输到GPU。
///
/// # Examples | 示例
/// ```rust
/// let red = Color::RED;
/// let custom = Color::new(0.5, 0.7, 0.3, 1.0);
/// let packed = custom.to_packed(); // For GPU
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Pod, Zeroable)]
#[repr(C)]
pub struct Color {
    /// Red component (0.0-1.0).
    /// 红色分量。
    pub r: f32,
    /// Green component (0.0-1.0).
    /// 绿色分量。
    pub g: f32,
    /// Blue component (0.0-1.0).
    /// 蓝色分量。
    pub b: f32,
    /// Alpha component (0.0-1.0).
    /// 透明度分量。
    pub a: f32,
}

impl Color {
    /// White (1, 1, 1, 1).
    /// 白色。
    pub const WHITE: Self = Self { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

    /// Black (0, 0, 0, 1).
    /// 黑色。
    pub const BLACK: Self = Self { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };

    /// Red (1, 0, 0, 1).
    /// 红色。
    pub const RED: Self = Self { r: 1.0, g: 0.0, b: 0.0, a: 1.0 };

    /// Green (0, 1, 0, 1).
    /// 绿色。
    pub const GREEN: Self = Self { r: 0.0, g: 1.0, b: 0.0, a: 1.0 };

    /// Blue (0, 0, 1, 1).
    /// 蓝色。
    pub const BLUE: Self = Self { r: 0.0, g: 0.0, b: 1.0, a: 1.0 };

    /// Transparent (0, 0, 0, 0).
    /// 透明。
    pub const TRANSPARENT: Self = Self { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };

    /// Create a new color.
    /// 创建新颜色。
    #[inline]
    pub const fn new(r: f32, g: f32, b: f32, a: f32) -> Self {
        Self { r, g, b, a }
    }

    /// Create a color from RGB values (alpha = 1.0).
    /// 从RGB值创建颜色（alpha = 1.0）。
    #[inline]
    pub const fn rgb(r: f32, g: f32, b: f32) -> Self {
        Self { r, g, b, a: 1.0 }
    }

    /// Create from u8 values (0-255).
    /// 从u8值创建（0-255）。
    #[inline]
    pub fn from_rgba8(r: u8, g: u8, b: u8, a: u8) -> Self {
        Self {
            r: r as f32 / 255.0,
            g: g as f32 / 255.0,
            b: b as f32 / 255.0,
            a: a as f32 / 255.0,
        }
    }

    /// Create from hex value (0xRRGGBB or 0xRRGGBBAA).
    /// 从十六进制值创建。
    #[inline]
    pub fn from_hex(hex: u32) -> Self {
        if hex > 0xFFFFFF {
            // 0xRRGGBBAA format
            Self::from_rgba8(
                ((hex >> 24) & 0xFF) as u8,
                ((hex >> 16) & 0xFF) as u8,
                ((hex >> 8) & 0xFF) as u8,
                (hex & 0xFF) as u8,
            )
        } else {
            // 0xRRGGBB format
            Self::from_rgba8(
                ((hex >> 16) & 0xFF) as u8,
                ((hex >> 8) & 0xFF) as u8,
                (hex & 0xFF) as u8,
                255,
            )
        }
    }

    /// Convert to packed u32 (ABGR format for WebGL).
    /// 转换为打包的u32（WebGL的ABGR格式）。
    #[inline]
    pub fn to_packed(&self) -> u32 {
        let r = (self.r.clamp(0.0, 1.0) * 255.0) as u32;
        let g = (self.g.clamp(0.0, 1.0) * 255.0) as u32;
        let b = (self.b.clamp(0.0, 1.0) * 255.0) as u32;
        let a = (self.a.clamp(0.0, 1.0) * 255.0) as u32;

        (a << 24) | (b << 16) | (g << 8) | r
    }

    /// Create from packed u32 (ABGR format).
    /// 从打包的u32创建（ABGR格式）。
    #[inline]
    pub fn from_packed(packed: u32) -> Self {
        Self::from_rgba8(
            (packed & 0xFF) as u8,
            ((packed >> 8) & 0xFF) as u8,
            ((packed >> 16) & 0xFF) as u8,
            ((packed >> 24) & 0xFF) as u8,
        )
    }

    /// Linear interpolation between two colors.
    /// 两个颜色之间的线性插值。
    #[inline]
    pub fn lerp(&self, other: &Self, t: f32) -> Self {
        Self {
            r: self.r + (other.r - self.r) * t,
            g: self.g + (other.g - self.g) * t,
            b: self.b + (other.b - self.b) * t,
            a: self.a + (other.a - self.a) * t,
        }
    }

    /// Multiply color by alpha (premultiplied alpha).
    /// 颜色乘以alpha（预乘alpha）。
    #[inline]
    pub fn premultiply(&self) -> Self {
        Self {
            r: self.r * self.a,
            g: self.g * self.a,
            b: self.b * self.a,
            a: self.a,
        }
    }

    /// Set the alpha value.
    /// 设置alpha值。
    #[inline]
    pub fn with_alpha(self, a: f32) -> Self {
        Self { a, ..self }
    }
}

impl Default for Color {
    fn default() -> Self {
        Self::WHITE
    }
}

impl From<[f32; 4]> for Color {
    #[inline]
    fn from([r, g, b, a]: [f32; 4]) -> Self {
        Self { r, g, b, a }
    }
}

impl From<Color> for [f32; 4] {
    #[inline]
    fn from(c: Color) -> Self {
        [c.r, c.g, c.b, c.a]
    }
}
