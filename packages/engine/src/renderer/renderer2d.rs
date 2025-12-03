//! Main 2D renderer implementation.
//! 主2D渲染器实现。

use wasm_bindgen::JsCast;
use web_sys::WebGl2RenderingContext;

use crate::core::error::Result;
use crate::resource::TextureManager;
use super::batch::SpriteBatch;
use super::camera::Camera2D;
use super::shader::ShaderManager;
use super::material::MaterialManager;

/// 2D renderer with batched sprite rendering.
/// 带批处理精灵渲染的2D渲染器。
///
/// Coordinates sprite batching, shader management, and camera transforms.
/// 协调精灵批处理、Shader管理和相机变换。
pub struct Renderer2D {
    /// Sprite batch renderer.
    /// 精灵批处理渲染器。
    sprite_batch: SpriteBatch,

    /// Shader manager.
    /// 着色器管理器。
    shader_manager: ShaderManager,

    /// Material manager.
    /// 材质管理器。
    material_manager: MaterialManager,

    /// 2D camera.
    /// 2D相机。
    camera: Camera2D,

    /// Clear color (RGBA).
    /// 清除颜色 (RGBA)。
    clear_color: [f32; 4],

    /// Current active shader ID.
    /// 当前激活的着色器ID。
    #[allow(dead_code)]
    current_shader_id: u32,

    /// Current active material ID.
    /// 当前激活的材质ID。
    #[allow(dead_code)]
    current_material_id: u32,
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
        let shader_manager = ShaderManager::new(gl)?;
        let material_manager = MaterialManager::new();

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
            shader_manager,
            material_manager,
            camera,
            clear_color: [0.1, 0.1, 0.12, 1.0],
            current_shader_id: 0,
            current_material_id: 0,
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
    /// * `material_ids` - Material ID for each sprite (0 = default) | 每个精灵的材质ID（0 = 默认）
    /// * `texture_manager` - Texture manager | 纹理管理器
    pub fn submit_batch(
        &mut self,
        transforms: &[f32],
        texture_ids: &[u32],
        uvs: &[f32],
        colors: &[u32],
        material_ids: &[u32],
        texture_manager: &TextureManager,
    ) -> Result<()> {
        self.sprite_batch.add_sprites(
            transforms,
            texture_ids,
            uvs,
            colors,
            material_ids,
            texture_manager,
        )
    }

    /// Render the current frame.
    /// 渲染当前帧。
    pub fn render(&mut self, gl: &WebGl2RenderingContext, texture_manager: &TextureManager) -> Result<()> {
        use super::batch::BatchKey;

        if self.sprite_batch.sprite_count() == 0 {
            return Ok(());
        }

        // Collect non-empty batch keys | 收集非空批次键
        let batch_keys: Vec<BatchKey> = self.sprite_batch.batches()
            .iter()
            .filter(|(_, vertices)| !vertices.is_empty())
            .map(|(key, _)| *key)
            .collect();

        // Track current state to minimize state changes | 跟踪当前状态以最小化状态切换
        let mut current_material_id: u32 = u32::MAX;
        let mut current_texture_id: u32 = u32::MAX;

        // Get projection matrix once | 一次性获取投影矩阵
        let projection = self.camera.projection_matrix();

        for batch_key in batch_keys {
            // Switch material if needed | 如需切换材质
            if batch_key.material_id != current_material_id {
                current_material_id = batch_key.material_id;

                // Get material (fallback to default if not found) | 获取材质（未找到则回退到默认）
                let material = self.material_manager.get_material(batch_key.material_id)
                    .unwrap_or_else(|| self.material_manager.get_default_material());

                // Bind shader | 绑定Shader
                let shader = self.shader_manager.get_shader(material.shader_id)
                    .unwrap_or_else(|| self.shader_manager.get_default_shader());
                shader.bind(gl);

                // Apply blend mode | 应用混合模式
                MaterialManager::apply_blend_mode(gl, material.blend_mode);

                // Set projection matrix | 设置投影矩阵
                shader.set_uniform_mat3(gl, "u_projection", &projection.to_cols_array());

                // Set texture sampler | 设置纹理采样器
                shader.set_uniform_i32(gl, "u_texture", 0);

                // Apply material uniforms | 应用材质uniform
                material.uniforms.apply_to_shader(gl, shader);
            }

            // Switch texture if needed | 如需切换纹理
            if batch_key.texture_id != current_texture_id {
                current_texture_id = batch_key.texture_id;
                texture_manager.bind_texture(batch_key.texture_id, 0);
            }

            // Flush this batch | 刷新此批次
            self.sprite_batch.flush_for_batch(gl, &batch_key);
        }

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

    /// Set clear color (RGBA, each component 0.0-1.0).
    /// 设置清除颜色。
    pub fn set_clear_color(&mut self, r: f32, g: f32, b: f32, a: f32) {
        self.clear_color = [r, g, b, a];
    }

    /// Get clear color.
    /// 获取清除颜色。
    pub fn get_clear_color(&self) -> [f32; 4] {
        self.clear_color
    }

    /// Update camera viewport size.
    /// 更新相机视口大小。
    pub fn resize(&mut self, width: f32, height: f32) {
        self.camera.set_viewport(width, height);
    }

    // ============= Shader Management =============
    // ============= 着色器管理 =============

    /// Compile and register a custom shader.
    /// 编译并注册自定义着色器。
    ///
    /// # Returns | 返回
    /// The shader ID for referencing this shader | 用于引用此着色器的ID
    pub fn compile_shader(
        &mut self,
        gl: &WebGl2RenderingContext,
        vertex_source: &str,
        fragment_source: &str,
    ) -> Result<u32> {
        self.shader_manager.compile_shader(gl, vertex_source, fragment_source)
    }

    /// Compile a shader with a specific ID.
    /// 使用特定ID编译着色器。
    pub fn compile_shader_with_id(
        &mut self,
        gl: &WebGl2RenderingContext,
        shader_id: u32,
        vertex_source: &str,
        fragment_source: &str,
    ) -> Result<()> {
        self.shader_manager.compile_shader_with_id(gl, shader_id, vertex_source, fragment_source)
    }

    /// Check if a shader exists.
    /// 检查着色器是否存在。
    pub fn has_shader(&self, shader_id: u32) -> bool {
        self.shader_manager.has_shader(shader_id)
    }

    /// Remove a shader.
    /// 移除着色器。
    pub fn remove_shader(&mut self, shader_id: u32) -> bool {
        self.shader_manager.remove_shader(shader_id)
    }

    /// Get shader manager reference.
    /// 获取着色器管理器引用。
    pub fn shader_manager(&self) -> &ShaderManager {
        &self.shader_manager
    }

    /// Get mutable shader manager reference.
    /// 获取可变着色器管理器引用。
    pub fn shader_manager_mut(&mut self) -> &mut ShaderManager {
        &mut self.shader_manager
    }

    // ============= Material Management =============
    // ============= 材质管理 =============

    /// Register a custom material.
    /// 注册自定义材质。
    ///
    /// # Returns | 返回
    /// The material ID for referencing this material | 用于引用此材质的ID
    pub fn register_material(&mut self, material: super::material::Material) -> u32 {
        self.material_manager.register_material(material)
    }

    /// Register a material with a specific ID.
    /// 使用特定ID注册材质。
    pub fn register_material_with_id(&mut self, material_id: u32, material: super::material::Material) {
        self.material_manager.register_material_with_id(material_id, material);
    }

    /// Get a material by ID.
    /// 按ID获取材质。
    pub fn get_material(&self, material_id: u32) -> Option<&super::material::Material> {
        self.material_manager.get_material(material_id)
    }

    /// Get a mutable material by ID.
    /// 按ID获取可变材质。
    pub fn get_material_mut(&mut self, material_id: u32) -> Option<&mut super::material::Material> {
        self.material_manager.get_material_mut(material_id)
    }

    /// Check if a material exists.
    /// 检查材质是否存在。
    pub fn has_material(&self, material_id: u32) -> bool {
        self.material_manager.has_material(material_id)
    }

    /// Remove a material.
    /// 移除材质。
    pub fn remove_material(&mut self, material_id: u32) -> bool {
        self.material_manager.remove_material(material_id)
    }

    /// Set a material's float uniform.
    /// 设置材质的浮点uniform。
    pub fn set_material_float(&mut self, material_id: u32, name: &str, value: f32) -> bool {
        self.material_manager.set_material_float(material_id, name, value)
    }

    /// Set a material's vec4 uniform.
    /// 设置材质的vec4 uniform。
    pub fn set_material_vec4(&mut self, material_id: u32, name: &str, x: f32, y: f32, z: f32, w: f32) -> bool {
        self.material_manager.set_material_vec4(material_id, name, x, y, z, w)
    }

    /// Get material manager reference.
    /// 获取材质管理器引用。
    pub fn material_manager(&self) -> &MaterialManager {
        &self.material_manager
    }

    /// Get mutable material manager reference.
    /// 获取可变材质管理器引用。
    pub fn material_manager_mut(&mut self) -> &mut MaterialManager {
        &mut self.material_manager
    }
}
