//! Shader program compilation and management.
//! Shader程序编译和管理。

use web_sys::{WebGl2RenderingContext, WebGlProgram, WebGlShader, WebGlUniformLocation};
use crate::core::error::{EngineError, Result};

/// Compiled shader program.
/// 已编译的Shader程序。
///
/// Manages vertex and fragment shaders, including compilation and linking.
/// 管理顶点和片段着色器，包括编译和链接。
pub struct ShaderProgram {
    program: WebGlProgram,
}

impl ShaderProgram {
    /// Create and compile a new shader program.
    /// 创建并编译新的Shader程序。
    ///
    /// # Arguments | 参数
    /// * `gl` - WebGL2 context | WebGL2上下文
    /// * `vertex_source` - Vertex shader source code | 顶点着色器源代码
    /// * `fragment_source` - Fragment shader source code | 片段着色器源代码
    ///
    /// # Returns | 返回
    /// A compiled shader program or an error | 已编译的Shader程序或错误
    pub fn new(
        gl: &WebGl2RenderingContext,
        vertex_source: &str,
        fragment_source: &str,
    ) -> Result<Self> {
        // Compile shaders | 编译着色器
        let vertex_shader = Self::compile_shader(
            gl,
            WebGl2RenderingContext::VERTEX_SHADER,
            vertex_source,
        )?;

        let fragment_shader = Self::compile_shader(
            gl,
            WebGl2RenderingContext::FRAGMENT_SHADER,
            fragment_source,
        )?;

        // Create and link program | 创建并链接程序
        let program = gl
            .create_program()
            .ok_or_else(|| EngineError::ProgramLinkFailed("Failed to create program".into()))?;

        gl.attach_shader(&program, &vertex_shader);
        gl.attach_shader(&program, &fragment_shader);
        gl.link_program(&program);

        // Check for linking errors | 检查链接错误
        let success = gl
            .get_program_parameter(&program, WebGl2RenderingContext::LINK_STATUS)
            .as_bool()
            .unwrap_or(false);

        if !success {
            let log = gl.get_program_info_log(&program).unwrap_or_default();
            return Err(EngineError::ProgramLinkFailed(log));
        }

        // Clean up shaders (they're linked to the program now)
        // 清理着色器（它们现在已链接到程序）
        gl.delete_shader(Some(&vertex_shader));
        gl.delete_shader(Some(&fragment_shader));

        log::debug!("Shader program compiled successfully | Shader程序编译成功");

        Ok(Self { program })
    }

    /// Compile a single shader.
    /// 编译单个着色器。
    fn compile_shader(
        gl: &WebGl2RenderingContext,
        shader_type: u32,
        source: &str,
    ) -> Result<WebGlShader> {
        let shader = gl
            .create_shader(shader_type)
            .ok_or_else(|| EngineError::ShaderCompileFailed("Failed to create shader".into()))?;

        gl.shader_source(&shader, source);
        gl.compile_shader(&shader);

        // Check for compilation errors | 检查编译错误
        let success = gl
            .get_shader_parameter(&shader, WebGl2RenderingContext::COMPILE_STATUS)
            .as_bool()
            .unwrap_or(false);

        if !success {
            let log = gl.get_shader_info_log(&shader).unwrap_or_default();
            let shader_type_name = if shader_type == WebGl2RenderingContext::VERTEX_SHADER {
                "Vertex"
            } else {
                "Fragment"
            };
            return Err(EngineError::ShaderCompileFailed(format!(
                "{} shader: {}",
                shader_type_name, log
            )));
        }

        Ok(shader)
    }

    /// Use this shader program for rendering.
    /// 使用此Shader程序进行渲染。
    #[inline]
    pub fn bind(&self, gl: &WebGl2RenderingContext) {
        gl.use_program(Some(&self.program));
    }

    /// Get uniform location by name.
    /// 按名称获取uniform位置。
    #[inline]
    pub fn get_uniform_location(
        &self,
        gl: &WebGl2RenderingContext,
        name: &str,
    ) -> Option<WebGlUniformLocation> {
        gl.get_uniform_location(&self.program, name)
    }

    /// Set a mat3 uniform.
    /// 设置mat3 uniform。
    pub fn set_uniform_mat3(
        &self,
        gl: &WebGl2RenderingContext,
        name: &str,
        value: &[f32; 9],
    ) {
        if let Some(location) = self.get_uniform_location(gl, name) {
            gl.uniform_matrix3fv_with_f32_array(Some(&location), false, value);
        }
    }

    /// Set an i32 uniform (for texture samplers).
    /// 设置i32 uniform（用于纹理采样器）。
    pub fn set_uniform_i32(
        &self,
        gl: &WebGl2RenderingContext,
        name: &str,
        value: i32,
    ) {
        if let Some(location) = self.get_uniform_location(gl, name) {
            gl.uniform1i(Some(&location), value);
        }
    }
}
