//! Texture representation.
//! 纹理表示。

use web_sys::WebGlTexture;

/// 2D texture.
/// 2D纹理。
pub struct Texture {
    /// WebGL texture handle.
    /// WebGL纹理句柄。
    pub(crate) handle: WebGlTexture,

    /// Texture width in pixels.
    /// 纹理宽度（像素）。
    pub width: u32,

    /// Texture height in pixels.
    /// 纹理高度（像素）。
    pub height: u32,
}

impl Texture {
    /// Create a new texture.
    /// 创建新纹理。
    pub fn new(handle: WebGlTexture, width: u32, height: u32) -> Self {
        Self {
            handle,
            width,
            height,
        }
    }

    /// Get the WebGL texture handle.
    /// 获取WebGL纹理句柄。
    #[inline]
    pub fn handle(&self) -> &WebGlTexture {
        &self.handle
    }
}
