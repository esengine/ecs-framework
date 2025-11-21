//! Texture loading and management.
//! 纹理加载和管理。

use std::collections::HashMap;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{HtmlImageElement, WebGl2RenderingContext, WebGlTexture};

use crate::core::error::{EngineError, Result};
use super::Texture;

/// Texture manager for loading and caching textures.
/// 用于加载和缓存纹理的纹理管理器。
pub struct TextureManager {
    /// WebGL context.
    /// WebGL上下文。
    gl: WebGl2RenderingContext,

    /// Loaded textures.
    /// 已加载的纹理。
    textures: HashMap<u32, Texture>,

    /// Default white texture for untextured rendering.
    /// 用于无纹理渲染的默认白色纹理。
    default_texture: Option<WebGlTexture>,
}

impl TextureManager {
    /// Create a new texture manager.
    /// 创建新的纹理管理器。
    pub fn new(gl: WebGl2RenderingContext) -> Self {
        let mut manager = Self {
            gl,
            textures: HashMap::new(),
            default_texture: None,
        };

        // Create default white texture | 创建默认白色纹理
        manager.create_default_texture();

        manager
    }

    /// Create a 1x1 white texture as default.
    /// 创建1x1白色纹理作为默认纹理。
    fn create_default_texture(&mut self) {
        let texture = self.gl.create_texture();
        if let Some(tex) = &texture {
            self.gl.bind_texture(WebGl2RenderingContext::TEXTURE_2D, Some(tex));

            let white_pixel: [u8; 4] = [255, 255, 255, 255];
            let _ = self.gl.tex_image_2d_with_i32_and_i32_and_i32_and_format_and_type_and_opt_u8_array(
                WebGl2RenderingContext::TEXTURE_2D,
                0,
                WebGl2RenderingContext::RGBA as i32,
                1,
                1,
                0,
                WebGl2RenderingContext::RGBA,
                WebGl2RenderingContext::UNSIGNED_BYTE,
                Some(&white_pixel),
            );

            self.gl.tex_parameteri(
                WebGl2RenderingContext::TEXTURE_2D,
                WebGl2RenderingContext::TEXTURE_MIN_FILTER,
                WebGl2RenderingContext::NEAREST as i32,
            );
            self.gl.tex_parameteri(
                WebGl2RenderingContext::TEXTURE_2D,
                WebGl2RenderingContext::TEXTURE_MAG_FILTER,
                WebGl2RenderingContext::NEAREST as i32,
            );
        }

        self.default_texture = texture;
    }

    /// Load a texture from URL.
    /// 从URL加载纹理。
    ///
    /// Note: This is an async operation. The texture will be available
    /// after the image loads.
    /// 注意：这是一个异步操作。纹理在图片加载后可用。
    pub fn load_texture(&mut self, id: u32, url: &str) -> Result<()> {
        // Create placeholder texture | 创建占位纹理
        let texture = self.gl
            .create_texture()
            .ok_or_else(|| EngineError::TextureLoadFailed("Failed to create texture".into()))?;

        // Set up temporary 1x1 texture | 设置临时1x1纹理
        self.gl.bind_texture(WebGl2RenderingContext::TEXTURE_2D, Some(&texture));
        let placeholder: [u8; 4] = [128, 128, 128, 255];
        let _ = self.gl.tex_image_2d_with_i32_and_i32_and_i32_and_format_and_type_and_opt_u8_array(
            WebGl2RenderingContext::TEXTURE_2D,
            0,
            WebGl2RenderingContext::RGBA as i32,
            1,
            1,
            0,
            WebGl2RenderingContext::RGBA,
            WebGl2RenderingContext::UNSIGNED_BYTE,
            Some(&placeholder),
        );

        // Store texture with placeholder size | 存储带占位符尺寸的纹理
        self.textures.insert(id, Texture::new(texture.clone(), 1, 1));

        // Load actual image asynchronously | 异步加载实际图片
        let gl = self.gl.clone();
        let texture_rc = Rc::new(RefCell::new(texture));
        let texture_clone = Rc::clone(&texture_rc);

        // We need to update the stored texture size after loading
        // For MVP, we'll handle this through a callback mechanism
        // 加载后需要更新存储的纹理尺寸
        // 对于MVP，我们通过回调机制处理

        let image = HtmlImageElement::new()
            .map_err(|_| EngineError::TextureLoadFailed("Failed to create image element".into()))?;

        // Clone image for use in closure | 克隆图片用于闭包
        let image_clone = image.clone();

        // Set up load callback | 设置加载回调
        let onload = Closure::wrap(Box::new(move || {
            let tex = texture_clone.borrow();
            gl.bind_texture(WebGl2RenderingContext::TEXTURE_2D, Some(&tex));

            // Use the captured image element | 使用捕获的图片元素
            let _ = gl.tex_image_2d_with_u32_and_u32_and_html_image_element(
                WebGl2RenderingContext::TEXTURE_2D,
                0,
                WebGl2RenderingContext::RGBA as i32,
                WebGl2RenderingContext::RGBA,
                WebGl2RenderingContext::UNSIGNED_BYTE,
                &image_clone,
            );

            // Set texture parameters | 设置纹理参数
            gl.tex_parameteri(
                WebGl2RenderingContext::TEXTURE_2D,
                WebGl2RenderingContext::TEXTURE_WRAP_S,
                WebGl2RenderingContext::CLAMP_TO_EDGE as i32,
            );
            gl.tex_parameteri(
                WebGl2RenderingContext::TEXTURE_2D,
                WebGl2RenderingContext::TEXTURE_WRAP_T,
                WebGl2RenderingContext::CLAMP_TO_EDGE as i32,
            );
            gl.tex_parameteri(
                WebGl2RenderingContext::TEXTURE_2D,
                WebGl2RenderingContext::TEXTURE_MIN_FILTER,
                WebGl2RenderingContext::LINEAR as i32,
            );
            gl.tex_parameteri(
                WebGl2RenderingContext::TEXTURE_2D,
                WebGl2RenderingContext::TEXTURE_MAG_FILTER,
                WebGl2RenderingContext::LINEAR as i32,
            );

            log::debug!("Texture loaded | 纹理加载完成");
        }) as Box<dyn Fn()>);

        image.set_onload(Some(onload.as_ref().unchecked_ref()));
        onload.forget(); // Prevent closure from being dropped | 防止闭包被销毁

        image.set_src(url);

        Ok(())
    }

    /// Get texture by ID.
    /// 按ID获取纹理。
    #[inline]
    pub fn get_texture(&self, id: u32) -> Option<&Texture> {
        self.textures.get(&id)
    }

    /// Get texture size by ID.
    /// 按ID获取纹理尺寸。
    #[inline]
    pub fn get_texture_size(&self, id: u32) -> Option<(f32, f32)> {
        self.textures
            .get(&id)
            .map(|t| (t.width as f32, t.height as f32))
    }

    /// Bind texture for rendering.
    /// 绑定纹理用于渲染。
    pub fn bind_texture(&self, id: u32, slot: u32) {
        self.gl.active_texture(WebGl2RenderingContext::TEXTURE0 + slot);

        if let Some(texture) = self.textures.get(&id) {
            self.gl.bind_texture(WebGl2RenderingContext::TEXTURE_2D, Some(&texture.handle));
        } else if let Some(default) = &self.default_texture {
            self.gl.bind_texture(WebGl2RenderingContext::TEXTURE_2D, Some(default));
        }
    }

    /// Check if texture is loaded.
    /// 检查纹理是否已加载。
    #[inline]
    pub fn has_texture(&self, id: u32) -> bool {
        self.textures.contains_key(&id)
    }

    /// Remove texture.
    /// 移除纹理。
    pub fn remove_texture(&mut self, id: u32) {
        if let Some(texture) = self.textures.remove(&id) {
            self.gl.delete_texture(Some(&texture.handle));
        }
    }
}
