//! Shader manager for runtime shader compilation and caching.
//! 着色器管理器，用于运行时着色器编译和缓存。

use std::collections::HashMap;
use web_sys::WebGl2RenderingContext;

use crate::core::error::Result;
use super::program::ShaderProgram;
use super::builtin::{SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER};

/// Reserved shader IDs for built-in shaders.
/// 内置着色器的保留ID。
pub const SHADER_ID_DEFAULT_SPRITE: u32 = 0;

/// Shader manager for compiling and caching shader programs.
/// 着色器管理器，用于编译和缓存着色器程序。
///
/// Manages multiple shader programs, allowing runtime compilation of custom shaders.
/// 管理多个着色器程序，允许运行时编译自定义着色器。
pub struct ShaderManager {
    /// Compiled shader programs indexed by ID.
    /// 按ID索引的已编译着色器程序。
    shaders: HashMap<u32, ShaderProgram>,

    /// Next available shader ID for custom shaders.
    /// 下一个可用的自定义着色器ID。
    next_shader_id: u32,

    /// Shader source cache for hot-reloading (optional).
    /// 着色器源代码缓存，用于热重载（可选）。
    shader_sources: HashMap<u32, (String, String)>,
}

impl ShaderManager {
    /// Create a new shader manager with built-in shaders.
    /// 创建带有内置着色器的新着色器管理器。
    ///
    /// # Arguments | 参数
    /// * `gl` - WebGL2 context | WebGL2上下文
    pub fn new(gl: &WebGl2RenderingContext) -> Result<Self> {
        let mut manager = Self {
            shaders: HashMap::new(),
            next_shader_id: 100, // Reserve 0-99 for built-in shaders
            shader_sources: HashMap::new(),
        };

        // Compile built-in sprite shader | 编译内置精灵着色器
        let default_shader = ShaderProgram::new(gl, SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER)?;
        manager.shaders.insert(SHADER_ID_DEFAULT_SPRITE, default_shader);
        manager.shader_sources.insert(
            SHADER_ID_DEFAULT_SPRITE,
            (SPRITE_VERTEX_SHADER.to_string(), SPRITE_FRAGMENT_SHADER.to_string()),
        );

        log::info!("ShaderManager initialized with {} built-in shaders | 着色器管理器初始化完成，内置着色器数量: {}",
            manager.shaders.len(), manager.shaders.len());

        Ok(manager)
    }

    /// Compile and register a custom shader program.
    /// 编译并注册自定义着色器程序。
    ///
    /// # Arguments | 参数
    /// * `gl` - WebGL2 context | WebGL2上下文
    /// * `vertex_source` - Vertex shader GLSL source | 顶点着色器GLSL源代码
    /// * `fragment_source` - Fragment shader GLSL source | 片段着色器GLSL源代码
    ///
    /// # Returns | 返回
    /// The shader ID for referencing this shader | 用于引用此着色器的ID
    pub fn compile_shader(
        &mut self,
        gl: &WebGl2RenderingContext,
        vertex_source: &str,
        fragment_source: &str,
    ) -> Result<u32> {
        let shader = ShaderProgram::new(gl, vertex_source, fragment_source)?;
        let shader_id = self.next_shader_id;
        self.next_shader_id += 1;

        self.shaders.insert(shader_id, shader);
        self.shader_sources.insert(
            shader_id,
            (vertex_source.to_string(), fragment_source.to_string()),
        );

        log::debug!("Custom shader compiled with ID: {} | 自定义着色器编译完成，ID: {}", shader_id, shader_id);

        Ok(shader_id)
    }

    /// Compile and register a shader with a specific ID.
    /// 使用特定ID编译并注册着色器。
    ///
    /// # Arguments | 参数
    /// * `gl` - WebGL2 context | WebGL2上下文
    /// * `shader_id` - Desired shader ID | 期望的着色器ID
    /// * `vertex_source` - Vertex shader GLSL source | 顶点着色器GLSL源代码
    /// * `fragment_source` - Fragment shader GLSL source | 片段着色器GLSL源代码
    pub fn compile_shader_with_id(
        &mut self,
        gl: &WebGl2RenderingContext,
        shader_id: u32,
        vertex_source: &str,
        fragment_source: &str,
    ) -> Result<()> {
        let shader = ShaderProgram::new(gl, vertex_source, fragment_source)?;

        // Remove old shader if exists | 如果存在则移除旧着色器
        self.shaders.remove(&shader_id);

        self.shaders.insert(shader_id, shader);
        self.shader_sources.insert(
            shader_id,
            (vertex_source.to_string(), fragment_source.to_string()),
        );

        log::debug!("Shader compiled with ID: {} | 着色器编译完成，ID: {}", shader_id, shader_id);

        Ok(())
    }

    /// Get a shader program by ID.
    /// 按ID获取着色器程序。
    #[inline]
    pub fn get_shader(&self, shader_id: u32) -> Option<&ShaderProgram> {
        self.shaders.get(&shader_id)
    }

    /// Get the default sprite shader.
    /// 获取默认精灵着色器。
    #[inline]
    pub fn get_default_shader(&self) -> &ShaderProgram {
        self.shaders.get(&SHADER_ID_DEFAULT_SPRITE)
            .expect("Default shader should always exist | 默认着色器应该始终存在")
    }

    /// Check if a shader exists.
    /// 检查着色器是否存在。
    #[inline]
    pub fn has_shader(&self, shader_id: u32) -> bool {
        self.shaders.contains_key(&shader_id)
    }

    /// Remove a shader program.
    /// 移除着色器程序。
    ///
    /// Note: Cannot remove built-in shaders (ID < 100).
    /// 注意：无法移除内置着色器（ID < 100）。
    pub fn remove_shader(&mut self, shader_id: u32) -> bool {
        if shader_id < 100 {
            log::warn!("Cannot remove built-in shader: {} | 无法移除内置着色器: {}", shader_id, shader_id);
            return false;
        }

        self.shader_sources.remove(&shader_id);
        self.shaders.remove(&shader_id).is_some()
    }

    /// Get all shader IDs.
    /// 获取所有着色器ID。
    pub fn shader_ids(&self) -> Vec<u32> {
        self.shaders.keys().copied().collect()
    }

    /// Get shader count.
    /// 获取着色器数量。
    #[inline]
    pub fn shader_count(&self) -> usize {
        self.shaders.len()
    }
}
