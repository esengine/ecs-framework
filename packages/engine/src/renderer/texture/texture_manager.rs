//! Texture loading and management.
//! 纹理加载和管理。

use std::collections::HashMap;
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

    /// Path to texture ID mapping.
    /// 路径到纹理ID的映射。
    path_to_id: HashMap<String, u32>,

    /// Next texture ID for auto-assignment.
    /// 下一个自动分配的纹理ID。
    next_id: u32,

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
            path_to_id: HashMap::new(),
            next_id: 1, // Start from 1, 0 is reserved for default
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

        // Clone texture handle for async loading before storing | 在存储前克隆纹理句柄用于异步加载
        let texture_for_closure = texture.clone();

        // Store texture with placeholder size | 存储带占位符尺寸的纹理
        self.textures.insert(id, Texture::new(texture, 1, 1));

        // Load actual image asynchronously | 异步加载实际图片
        let gl = self.gl.clone();

        let image = HtmlImageElement::new()
            .map_err(|_| EngineError::TextureLoadFailed("Failed to create image element".into()))?;

        // Set crossOrigin for CORS support | 设置crossOrigin以支持CORS
        image.set_cross_origin(Some("anonymous"));

        // Clone image for use in closure | 克隆图片用于闭包
        let image_clone = image.clone();

        // Set up load callback | 设置加载回调
        let onload = Closure::wrap(Box::new(move || {
            gl.bind_texture(WebGl2RenderingContext::TEXTURE_2D, Some(&texture_for_closure));

            // Flip Y axis for correct orientation (image coords vs WebGL coords)
            // 翻转Y轴以获得正确的方向（图像坐标系 vs WebGL坐标系）
            gl.pixel_storei(WebGl2RenderingContext::UNPACK_FLIP_Y_WEBGL, 1);

            // Use the captured image element | 使用捕获的图片元素
            let result = gl.tex_image_2d_with_u32_and_u32_and_html_image_element(
                WebGl2RenderingContext::TEXTURE_2D,
                0,
                WebGl2RenderingContext::RGBA as i32,
                WebGl2RenderingContext::RGBA,
                WebGl2RenderingContext::UNSIGNED_BYTE,
                &image_clone,
            );

            if let Err(e) = result {
                log::error!("Failed to upload texture: {:?} | 纹理上传失败: {:?}", e, e);
            }

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
            // ID 0 is the default texture, no warning needed
            // ID 0 是默认纹理，不需要警告
            if id != 0 {
                log::warn!("Texture {} not found, using default | 未找到纹理 {}，使用默认纹理", id, id);
            }
            self.gl.bind_texture(WebGl2RenderingContext::TEXTURE_2D, Some(default));
        } else {
            log::error!("Texture {} not found and no default texture! | 未找到纹理 {} 且没有默认纹理！", id, id);
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
        // Also remove from path mapping | 同时从路径映射中移除
        self.path_to_id.retain(|_, &mut v| v != id);
    }

    /// Load texture by path, returning texture ID.
    /// 按路径加载纹理，返回纹理ID。
    ///
    /// If the texture is already loaded, returns existing ID.
    /// 如果纹理已加载，返回现有ID。
    pub fn load_texture_by_path(&mut self, path: &str) -> Result<u32> {
        // Check if already loaded | 检查是否已加载
        if let Some(&id) = self.path_to_id.get(path) {
            return Ok(id);
        }

        // Assign new ID and load | 分配新ID并加载
        let id = self.next_id;
        self.next_id += 1;

        // Store path mapping first | 先存储路径映射
        self.path_to_id.insert(path.to_string(), id);

        // Load texture with assigned ID | 用分配的ID加载纹理
        self.load_texture(id, path)?;

        Ok(id)
    }

    /// Get texture ID by path.
    /// 按路径获取纹理ID。
    ///
    /// Returns None if texture is not loaded.
    /// 如果纹理未加载，返回None。
    #[inline]
    pub fn get_texture_id_by_path(&self, path: &str) -> Option<u32> {
        self.path_to_id.get(path).copied()
    }

    /// Get or load texture by path.
    /// 按路径获取或加载纹理。
    ///
    /// If texture is already loaded, returns existing ID.
    /// If not loaded, loads it and returns new ID.
    /// 如果纹理已加载，返回现有ID。
    /// 如果未加载，加载它并返回新ID。
    pub fn get_or_load_by_path(&mut self, path: &str) -> Result<u32> {
        // Empty path means default texture | 空路径表示默认纹理
        if path.is_empty() {
            return Ok(0);
        }

        self.load_texture_by_path(path)
    }
}
