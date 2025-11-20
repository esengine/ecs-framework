//! Main 2D renderer implementation.
//! 主2D渲染器实现。

use wasm_bindgen::JsCast;
use web_sys::WebGl2RenderingContext;

use crate::core::error::Result;
use crate::resource::TextureManager;
use super::batch::SpriteBatch;
use super::camera::Camera2D;
use super::shader::{ShaderProgram, SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER};

/// 2D renderer with batched sprite rendering.
/// 带批处理精灵渲染的2D渲染器。
///
/// Coordinates sprite batching, shader management, and camera transforms.
/// 协调精灵批处理、Shader管理和相机变换。
pub struct Renderer2D {
    /// Sprite batch renderer.
    /// 精灵批处理渲染器。
    sprite_batch: SpriteBatch,

    /// Sprite shader program.
    /// 精灵Shader程序。
    shader: ShaderProgram,

    /// 2D camera.
    /// 2D相机。
    camera: Camera2D,
}

impl Renderer2D {
    /// Create a new 2D renderer.
    /// 创建新的2D渲染器。
    ///
    /// # Arguments | 参数
    /// * `gl` - WebGL2 context | WebGL2上下文
    /// * `max_sprites` - Maximum sprites per batch | 每批次最大精灵数
    pub fn new(gl: &WebGl2RenderingContext, max_sprites: usize) -> Result<Self> {
        let sprite_batch = SpriteBatch::new(gl, max_sprites)?;
        let shader = ShaderProgram::new(gl, SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER)?;

        // Get canvas size for camera | 获取canvas尺寸用于相机
        let canvas = gl.canvas()
            .and_then(|c| c.dyn_into::<web_sys::HtmlCanvasElement>().ok())
            .map(|c| (c.width() as f32, c.height() as f32))
            .unwrap_or((800.0, 600.0));

        let camera = Camera2D::new(canvas.0, canvas.1);

        log::info!(
            "Renderer2D initialized | Renderer2D初始化完成: {}x{}, max sprites: {}",
            canvas.0, canvas.1, max_sprites
        );

        Ok(Self {
            sprite_batch,
            shader,
            camera,
        })
    }

    /// Submit sprite batch data for rendering.
    /// 提交精灵批次数据进行渲染。
    ///
    /// # Arguments | 参数
    /// * `transforms` - Transform data for each sprite | 每个精灵的变换数据
    /// * `texture_ids` - Texture ID for each sprite | 每个精灵的纹理ID
    /// * `uvs` - UV coordinates for each sprite | 每个精灵的UV坐标
    /// * `colors` - Packed color for each sprite | 每个精灵的打包颜色
    /// * `texture_manager` - Texture manager | 纹理管理器
    pub fn submit_batch(
        &mut self,
        transforms: &[f32],
        texture_ids: &[u32],
        uvs: &[f32],
        colors: &[u32],
        texture_manager: &TextureManager,
    ) -> Result<()> {
        self.sprite_batch.add_sprites(
            transforms,
            texture_ids,
            uvs,
            colors,
            texture_manager,
        )
    }

    /// Render the current frame.
    /// 渲染当前帧。
    pub fn render(&mut self, gl: &WebGl2RenderingContext) -> Result<()> {
        if self.sprite_batch.sprite_count() == 0 {
            return Ok(());
        }

        // Bind shader | 绑定Shader
        self.shader.bind(gl);

        // Set projection matrix | 设置投影矩阵
        let projection = self.camera.projection_matrix();
        self.shader.set_uniform_mat3(gl, "u_projection", &projection.to_cols_array());

        // Set texture sampler | 设置纹理采样器
        self.shader.set_uniform_i32(gl, "u_texture", 0);

        // Flush sprite batch | 刷新精灵批处理
        self.sprite_batch.flush(gl);

        // Clear batch for next frame | 清空批处理以供下一帧使用
        self.sprite_batch.clear();

        Ok(())
    }

    /// Get mutable reference to camera.
    /// 获取相机的可变引用。
    #[inline]
    pub fn camera_mut(&mut self) -> &mut Camera2D {
        &mut self.camera
    }

    /// Get reference to camera.
    /// 获取相机的引用。
    #[inline]
    pub fn camera(&self) -> &Camera2D {
        &self.camera
    }

    /// Update camera viewport size.
    /// 更新相机视口大小。
    pub fn resize(&mut self, width: f32, height: f32) {
        self.camera.set_viewport(width, height);
    }
}
