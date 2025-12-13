//! Sprite batch renderer for efficient 2D rendering.
//! 用于高效2D渲染的精灵批处理渲染器。

use indexmap::IndexMap;
use web_sys::{
    WebGl2RenderingContext, WebGlBuffer, WebGlVertexArrayObject,
};

use crate::core::error::{EngineError, Result};
use crate::math::Color;
use crate::resource::TextureManager;
use super::vertex::FLOATS_PER_VERTEX;

/// Number of vertices per sprite (quad).
/// 每个精灵的顶点数（四边形）。
const VERTICES_PER_SPRITE: usize = 4;

/// Number of indices per sprite (2 triangles).
/// 每个精灵的索引数（2个三角形）。
const INDICES_PER_SPRITE: usize = 6;

/// Transform data stride (x, y, rotation, scaleX, scaleY, originX, originY).
/// 变换数据步长。
const TRANSFORM_STRIDE: usize = 7;

/// UV data stride (u0, v0, u1, v1).
/// UV数据步长。
const UV_STRIDE: usize = 4;

/// Batch key combining material and texture IDs.
/// 组合材质ID和纹理ID的批次键。
#[derive(Hash, Eq, PartialEq, Clone, Copy, Debug)]
pub struct BatchKey {
    /// Material ID (0 = default material).
    /// 材质ID（0 = 默认材质）。
    pub material_id: u32,
    /// Texture ID.
    /// 纹理ID。
    pub texture_id: u32,
}

/// Sprite batch renderer.
/// 精灵批处理渲染器。
///
/// Batches multiple sprites into a single draw call for optimal performance.
/// 将多个精灵合并为单次绘制调用以获得最佳性能。
///
/// # Performance | 性能
/// - Uses dynamic vertex buffer for efficient updates | 使用动态顶点缓冲区以高效更新
/// - Groups sprites by material and texture to minimize state changes | 按材质和纹理分组精灵以最小化状态更改
/// - Supports up to 10000+ sprites per batch | 每批次支持10000+精灵
pub struct SpriteBatch {
    /// Vertex array object.
    /// 顶点数组对象。
    vao: WebGlVertexArrayObject,

    /// Vertex buffer object.
    /// 顶点缓冲区对象。
    vbo: WebGlBuffer,

    /// Index buffer object.
    /// 索引缓冲区对象。
    ibo: WebGlBuffer,

    /// Maximum number of sprites.
    /// 最大精灵数。
    max_sprites: usize,

    /// Per-material-texture vertex data buffers (insertion-ordered).
    /// 按材质和纹理分组的顶点数据缓冲区（保持插入顺序）。
    ///
    /// Uses IndexMap to preserve render order - sprites submitted first
    /// are rendered first (appear behind later sprites).
    /// 使用 IndexMap 保持渲染顺序 - 先提交的精灵先渲染（显示在后面）。
    batches: IndexMap<BatchKey, Vec<f32>>,

    /// Total sprite count across all batches.
    /// 所有批次的总精灵数。
    sprite_count: usize,
}

impl SpriteBatch {
    /// Create a new sprite batch.
    /// 创建新的精灵批处理器。
    ///
    /// # Arguments | 参数
    /// * `gl` - WebGL2 context | WebGL2上下文
    /// * `max_sprites` - Maximum sprites per batch | 每批次最大精灵数
    pub fn new(gl: &WebGl2RenderingContext, max_sprites: usize) -> Result<Self> {
        // Create VAO | 创建VAO
        let vao = gl
            .create_vertex_array()
            .ok_or(EngineError::BufferCreationFailed)?;
        gl.bind_vertex_array(Some(&vao));

        // Create vertex buffer | 创建顶点缓冲区
        let vbo = gl
            .create_buffer()
            .ok_or(EngineError::BufferCreationFailed)?;
        gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, Some(&vbo));

        // Allocate vertex buffer memory | 分配顶点缓冲区内存
        let vertex_buffer_size = max_sprites * VERTICES_PER_SPRITE * FLOATS_PER_VERTEX * 4;
        gl.buffer_data_with_i32(
            WebGl2RenderingContext::ARRAY_BUFFER,
            vertex_buffer_size as i32,
            WebGl2RenderingContext::DYNAMIC_DRAW,
        );

        // Create and populate index buffer | 创建并填充索引缓冲区
        let ibo = gl
            .create_buffer()
            .ok_or(EngineError::BufferCreationFailed)?;
        gl.bind_buffer(WebGl2RenderingContext::ELEMENT_ARRAY_BUFFER, Some(&ibo));

        let indices = Self::generate_indices(max_sprites);
        unsafe {
            let index_array = js_sys::Uint16Array::view(&indices);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ELEMENT_ARRAY_BUFFER,
                &index_array,
                WebGl2RenderingContext::STATIC_DRAW,
            );
        }

        // Set up vertex attributes | 设置顶点属性
        Self::setup_vertex_attributes(gl);

        // Unbind VAO | 解绑VAO
        gl.bind_vertex_array(None);

        log::debug!(
            "SpriteBatch created with capacity: {} sprites | SpriteBatch创建完成，容量: {}个精灵",
            max_sprites,
            max_sprites
        );

        Ok(Self {
            vao,
            vbo,
            ibo,
            max_sprites,
            batches: IndexMap::new(),
            sprite_count: 0,
        })
    }

    /// Generate index buffer data.
    /// 生成索引缓冲区数据。
    fn generate_indices(max_sprites: usize) -> Vec<u16> {
        let mut indices = Vec::with_capacity(max_sprites * INDICES_PER_SPRITE);

        for i in 0..max_sprites {
            let base = (i * VERTICES_PER_SPRITE) as u16;
            // Two triangles per sprite | 每个精灵两个三角形
            // Triangle 1: 0, 1, 2 | 三角形1
            // Triangle 2: 2, 3, 0 | 三角形2
            indices.push(base);
            indices.push(base + 1);
            indices.push(base + 2);
            indices.push(base + 2);
            indices.push(base + 3);
            indices.push(base);
        }

        indices
    }

    /// Set up vertex attribute pointers.
    /// 设置顶点属性指针。
    fn setup_vertex_attributes(gl: &WebGl2RenderingContext) {
        let stride = (FLOATS_PER_VERTEX * 4) as i32;

        // Position attribute (location = 0) | 位置属性
        gl.enable_vertex_attrib_array(0);
        gl.vertex_attrib_pointer_with_i32(
            0,
            2,
            WebGl2RenderingContext::FLOAT,
            false,
            stride,
            0,
        );

        // Texture coordinate attribute (location = 1) | 纹理坐标属性
        gl.enable_vertex_attrib_array(1);
        gl.vertex_attrib_pointer_with_i32(
            1,
            2,
            WebGl2RenderingContext::FLOAT,
            false,
            stride,
            8, // 2 floats * 4 bytes
        );

        // Color attribute (location = 2) | 颜色属性
        gl.enable_vertex_attrib_array(2);
        gl.vertex_attrib_pointer_with_i32(
            2,
            4,
            WebGl2RenderingContext::FLOAT,
            false,
            stride,
            16, // 4 floats * 4 bytes
        );
    }

    /// Clear the batch for a new frame.
    /// 为新帧清空批处理。
    pub fn clear(&mut self) {
        for batch in self.batches.values_mut() {
            batch.clear();
        }
        self.sprite_count = 0;
    }

    /// Add sprites from batch data.
    /// 从批处理数据添加精灵。
    ///
    /// # Arguments | 参数
    /// * `transforms` - [x, y, rotation, scaleX, scaleY, originX, originY] per sprite
    /// * `texture_ids` - Texture ID for each sprite | 每个精灵的纹理ID
    /// * `uvs` - [u0, v0, u1, v1] per sprite | 每个精灵的UV坐标
    /// * `colors` - Packed RGBA color per sprite | 每个精灵的打包RGBA颜色
    /// * `material_ids` - Material ID for each sprite (0 = default) | 每个精灵的材质ID（0 = 默认）
    /// * `_texture_manager` - Texture manager for getting texture sizes | 纹理管理器
    pub fn add_sprites(
        &mut self,
        transforms: &[f32],
        texture_ids: &[u32],
        uvs: &[f32],
        colors: &[u32],
        material_ids: &[u32],
        _texture_manager: &TextureManager,
    ) -> Result<()> {
        let sprite_count = texture_ids.len();

        // Validate input data | 验证输入数据
        if transforms.len() != sprite_count * TRANSFORM_STRIDE {
            return Err(EngineError::InvalidBatchData(format!(
                "Transform data length mismatch: expected {}, got {}",
                sprite_count * TRANSFORM_STRIDE,
                transforms.len()
            )));
        }

        if uvs.len() != sprite_count * UV_STRIDE {
            return Err(EngineError::InvalidBatchData(format!(
                "UV data length mismatch: expected {}, got {}",
                sprite_count * UV_STRIDE,
                uvs.len()
            )));
        }

        if colors.len() != sprite_count {
            return Err(EngineError::InvalidBatchData(format!(
                "Color data length mismatch: expected {}, got {}",
                sprite_count,
                colors.len()
            )));
        }

        if material_ids.len() != sprite_count {
            return Err(EngineError::InvalidBatchData(format!(
                "Material ID data length mismatch: expected {}, got {}",
                sprite_count,
                material_ids.len()
            )));
        }

        // Check capacity | 检查容量
        if self.sprite_count + sprite_count > self.max_sprites {
            return Err(EngineError::InvalidBatchData(format!(
                "Batch capacity exceeded: {} + {} > {}",
                self.sprite_count, sprite_count, self.max_sprites
            )));
        }

        // Add each sprite grouped by material and texture | 按材质和纹理分组添加每个精灵
        for i in 0..sprite_count {
            let t_offset = i * TRANSFORM_STRIDE;
            let uv_offset = i * UV_STRIDE;

            let x = transforms[t_offset];
            let y = transforms[t_offset + 1];
            let rotation = transforms[t_offset + 2];
            let scale_x = transforms[t_offset + 3];
            let scale_y = transforms[t_offset + 4];
            let origin_x = transforms[t_offset + 5];
            let origin_y = transforms[t_offset + 6];

            let u0 = uvs[uv_offset];
            let v0 = uvs[uv_offset + 1];
            let u1 = uvs[uv_offset + 2];
            let v1 = uvs[uv_offset + 3];

            let color = Color::from_packed(colors[i]);
            let color_arr = [color.r, color.g, color.b, color.a];

            // scale_x and scale_y are the actual display dimensions
            // scale_x 和 scale_y 是实际显示尺寸
            let width = scale_x;
            let height = scale_y;

            let batch_key = BatchKey {
                material_id: material_ids[i],
                texture_id: texture_ids[i],
            };

            // Get or create batch for this material+texture combination | 获取或创建此材质+纹理组合的批次
            let batch = self.batches
                .entry(batch_key)
                .or_insert_with(Vec::new);

            // Calculate transformed vertices and add to batch | 计算变换后的顶点并添加到批次
            Self::add_sprite_vertices_to_batch(
                batch,
                x, y, width, height, rotation, origin_x, origin_y,
                u0, v0, u1, v1, color_arr,
            );
        }

        self.sprite_count += sprite_count;
        Ok(())
    }

    /// Add vertices for a single sprite to a batch.
    /// 为单个精灵添加顶点到批次。
    #[inline]
    fn add_sprite_vertices_to_batch(
        batch: &mut Vec<f32>,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        rotation: f32,
        origin_x: f32,
        origin_y: f32,
        u0: f32,
        v0: f32,
        u1: f32,
        v1: f32,
        color: [f32; 4],
    ) {
        let cos = rotation.cos();
        let sin = rotation.sin();

        // Origin offset | 原点偏移
        // origin (0,0) = bottom-left, (1,1) = top-right
        // 原点 (0,0) = 左下角, (1,1) = 右上角
        let ox = origin_x * width;
        let oy = origin_y * height;

        // Local corner positions (relative to origin) | 局部角点位置（相对于原点）
        // Y-up coordinate system | Y向上坐标系
        let corners = [
            (-ox, height - oy),   // Top-left | 左上
            (width - ox, height - oy), // Top-right | 右上
            (width - ox, -oy),    // Bottom-right | 右下
            (-ox, -oy),           // Bottom-left | 左下
        ];

        // UV coordinates use image coordinate system (top-left origin, Y-down)
        // UV坐标使用图像坐标系（左上角为原点，Y轴向下）
        // Incoming UV: [u0, v0, u1, v1] where v0 < v1
        // 传入的 UV：[u0, v0, u1, v1] 其中 v0 < v1
        let tex_coords = [
            [u0, v0], // Top-left
            [u1, v0], // Top-right
            [u1, v1], // Bottom-right
            [u0, v1], // Bottom-left
        ];

        // Transform and add each vertex | 变换并添加每个顶点
        for i in 0..4 {
            let (lx, ly) = corners[i];

            // Apply rotation | 应用旋转
            let rx = lx * cos - ly * sin;
            let ry = lx * sin + ly * cos;

            // Apply translation | 应用平移
            let px = rx + x;
            let py = ry + y;

            // Position | 位置
            batch.push(px);
            batch.push(py);

            // Texture coordinates | 纹理坐标
            batch.push(tex_coords[i][0]);
            batch.push(tex_coords[i][1]);

            // Color | 颜色
            batch.extend_from_slice(&color);
        }
    }

    /// Flush a batch to GPU and render.
    /// 将批次刷新到GPU并渲染。
    fn flush_batch(&self, gl: &WebGl2RenderingContext, vertices: &[f32]) {
        if vertices.is_empty() {
            return;
        }

        let sprite_count = vertices.len() / (VERTICES_PER_SPRITE * FLOATS_PER_VERTEX);

        // Bind VAO | 绑定VAO
        gl.bind_vertex_array(Some(&self.vao));

        // Upload vertex data | 上传顶点数据
        gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, Some(&self.vbo));
        unsafe {
            let vertex_array = js_sys::Float32Array::view(vertices);
            gl.buffer_sub_data_with_i32_and_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                0,
                &vertex_array,
            );
        }

        // Draw | 绘制
        let index_count = (sprite_count * INDICES_PER_SPRITE) as i32;
        gl.draw_elements_with_i32(
            WebGl2RenderingContext::TRIANGLES,
            index_count,
            WebGl2RenderingContext::UNSIGNED_SHORT,
            0,
        );

        // Unbind VAO | 解绑VAO
        gl.bind_vertex_array(None);
    }

    /// Get all batches for rendering (in insertion order).
    /// 获取所有批次用于渲染（按插入顺序）。
    pub fn batches(&self) -> &IndexMap<BatchKey, Vec<f32>> {
        &self.batches
    }

    /// Flush a specific batch by key.
    /// 按键刷新特定批次。
    pub fn flush_for_batch(&self, gl: &WebGl2RenderingContext, key: &BatchKey) {
        if let Some(vertices) = self.batches.get(key) {
            self.flush_batch(gl, vertices);
        }
    }

    /// Get current sprite count.
    /// 获取当前精灵数量。
    #[inline]
    pub fn sprite_count(&self) -> usize {
        self.sprite_count
    }
}
