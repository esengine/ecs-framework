//! Gizmo renderer for editor overlays.
//! 编辑器叠加层的Gizmo渲染器。

use web_sys::{WebGl2RenderingContext, WebGlBuffer, WebGlProgram};
use crate::core::error::{Result, EngineError};
use super::camera::Camera2D;

const GIZMO_VERTEX_SHADER: &str = r#"#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

uniform mat3 u_projection;

void main() {
    vec3 pos = u_projection * vec3(a_position, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
}
"#;

const GIZMO_FRAGMENT_SHADER: &str = r#"#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 fragColor;

void main() {
    fragColor = u_color;
}
"#;

/// Transform tool mode.
/// 变换工具模式。
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum TransformMode {
    /// Selection mode - show bounds only
    Select,
    /// Move mode - show translation arrows
    Move,
    /// Rotate mode - show rotation circle
    Rotate,
    /// Scale mode - show scale handles
    Scale,
}

impl Default for TransformMode {
    fn default() -> Self {
        TransformMode::Select
    }
}

/// Gizmo renderer for drawing editor overlays like selection bounds.
/// 用于绘制编辑器叠加层（如选择边界）的Gizmo渲染器。
pub struct GizmoRenderer {
    program: WebGlProgram,
    vertex_buffer: WebGlBuffer,
    /// Pending rectangle data: [x, y, width, height, rotation, origin_x, origin_y, r, g, b, a]
    /// 待渲染的矩形数据
    rects: Vec<f32>,
    /// Current transform mode
    transform_mode: TransformMode,
}

impl GizmoRenderer {
    /// Create a new gizmo renderer.
    /// 创建新的Gizmo渲染器。
    pub fn new(gl: &WebGl2RenderingContext) -> Result<Self> {
        let program = Self::create_program(gl)?;
        let vertex_buffer = gl.create_buffer()
            .ok_or(EngineError::BufferCreationFailed)?;

        Ok(Self {
            program,
            vertex_buffer,
            rects: Vec::new(),
            transform_mode: TransformMode::default(),
        })
    }

    fn create_program(gl: &WebGl2RenderingContext) -> Result<WebGlProgram> {
        let vert_shader = gl.create_shader(WebGl2RenderingContext::VERTEX_SHADER)
            .ok_or_else(|| EngineError::ShaderCompileFailed("Failed to create vertex shader".into()))?;
        gl.shader_source(&vert_shader, GIZMO_VERTEX_SHADER);
        gl.compile_shader(&vert_shader);

        if !gl.get_shader_parameter(&vert_shader, WebGl2RenderingContext::COMPILE_STATUS)
            .as_bool()
            .unwrap_or(false)
        {
            let log = gl.get_shader_info_log(&vert_shader).unwrap_or_default();
            return Err(EngineError::ShaderCompileFailed(format!("Gizmo vertex shader: {}", log)));
        }

        let frag_shader = gl.create_shader(WebGl2RenderingContext::FRAGMENT_SHADER)
            .ok_or_else(|| EngineError::ShaderCompileFailed("Failed to create fragment shader".into()))?;
        gl.shader_source(&frag_shader, GIZMO_FRAGMENT_SHADER);
        gl.compile_shader(&frag_shader);

        if !gl.get_shader_parameter(&frag_shader, WebGl2RenderingContext::COMPILE_STATUS)
            .as_bool()
            .unwrap_or(false)
        {
            let log = gl.get_shader_info_log(&frag_shader).unwrap_or_default();
            return Err(EngineError::ShaderCompileFailed(format!("Gizmo fragment shader: {}", log)));
        }

        let program = gl.create_program()
            .ok_or_else(|| EngineError::ProgramLinkFailed("Failed to create gizmo program".into()))?;
        gl.attach_shader(&program, &vert_shader);
        gl.attach_shader(&program, &frag_shader);
        gl.link_program(&program);

        if !gl.get_program_parameter(&program, WebGl2RenderingContext::LINK_STATUS)
            .as_bool()
            .unwrap_or(false)
        {
            let log = gl.get_program_info_log(&program).unwrap_or_default();
            return Err(EngineError::ProgramLinkFailed(format!("Gizmo program: {}", log)));
        }

        gl.delete_shader(Some(&vert_shader));
        gl.delete_shader(Some(&frag_shader));

        Ok(program)
    }

    /// Clear all pending gizmos.
    /// 清空所有待渲染的Gizmo。
    pub fn clear(&mut self) {
        self.rects.clear();
    }

    /// Add a rectangle outline gizmo.
    /// 添加矩形边框Gizmo。
    ///
    /// # Arguments | 参数
    /// * `x` - Center X position | 中心X位置
    /// * `y` - Center Y position | 中心Y位置
    /// * `width` - Rectangle width | 矩形宽度
    /// * `height` - Rectangle height | 矩形高度
    /// * `rotation` - Rotation in radians | 旋转角度（弧度）
    /// * `origin_x` - Origin X (0-1) | 原点X (0-1)
    /// * `origin_y` - Origin Y (0-1) | 原点Y (0-1)
    /// * `r`, `g`, `b`, `a` - Color | 颜色
    pub fn add_rect(
        &mut self,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        rotation: f32,
        origin_x: f32,
        origin_y: f32,
        r: f32,
        g: f32,
        b: f32,
        a: f32,
    ) {
        self.rects.extend_from_slice(&[
            x, y, width, height, rotation, origin_x, origin_y, r, g, b, a
        ]);
    }

    /// Render all pending gizmos.
    /// 渲染所有待渲染的Gizmo。
    pub fn render(&mut self, gl: &WebGl2RenderingContext, camera: &Camera2D) {
        if self.rects.is_empty() {
            return;
        }

        gl.use_program(Some(&self.program));

        let projection = camera.projection_matrix();
        let proj_loc = gl.get_uniform_location(&self.program, "u_projection");
        gl.uniform_matrix3fv_with_f32_array(proj_loc.as_ref(), false, &projection.to_cols_array());

        let color_loc = gl.get_uniform_location(&self.program, "u_color");

        gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, Some(&self.vertex_buffer));
        gl.enable_vertex_attrib_array(0);
        gl.vertex_attrib_pointer_with_i32(0, 2, WebGl2RenderingContext::FLOAT, false, 0, 0);

        // Process each rectangle (11 floats per rect)
        let rect_stride = 11;
        let rect_count = self.rects.len() / rect_stride;

        for i in 0..rect_count {
            let offset = i * rect_stride;
            let x = self.rects[offset];
            let y = self.rects[offset + 1];
            let width = self.rects[offset + 2];
            let height = self.rects[offset + 3];
            let rotation = self.rects[offset + 4];
            let origin_x = self.rects[offset + 5];
            let origin_y = self.rects[offset + 6];
            let r = self.rects[offset + 7];
            let g = self.rects[offset + 8];
            let b = self.rects[offset + 9];
            let a = self.rects[offset + 10];

            // Calculate transformed corners
            let vertices = self.calculate_rect_vertices(x, y, width, height, rotation, origin_x, origin_y);

            unsafe {
                let array = js_sys::Float32Array::view(&vertices);
                gl.buffer_data_with_array_buffer_view(
                    WebGl2RenderingContext::ARRAY_BUFFER,
                    &array,
                    WebGl2RenderingContext::DYNAMIC_DRAW,
                );
            }

            gl.uniform4f(color_loc.as_ref(), r, g, b, a);
            gl.draw_arrays(WebGl2RenderingContext::LINE_LOOP, 0, 4);

            // Draw transform handles based on mode
            match self.transform_mode {
                TransformMode::Select => {
                    // Just the selection box (already drawn)
                }
                TransformMode::Move => {
                    // Draw move arrows at center
                    self.draw_move_handles(gl, &color_loc, x, y, rotation, camera);
                }
                TransformMode::Rotate => {
                    // Draw rotation circle
                    self.draw_rotate_handles(gl, &color_loc, x, y, width.max(height) * 0.6, camera);
                }
                TransformMode::Scale => {
                    // Draw scale handles at corners
                    self.draw_scale_handles(gl, &color_loc, x, y, width, height, rotation, origin_x, origin_y, camera);
                }
            }
        }

        gl.disable_vertex_attrib_array(0);
    }

    /// Set transform mode.
    /// 设置变换模式。
    pub fn set_transform_mode(&mut self, mode: TransformMode) {
        self.transform_mode = mode;
    }

    /// Get transform mode.
    /// 获取变换模式。
    pub fn get_transform_mode(&self) -> TransformMode {
        self.transform_mode
    }

    /// Draw move handles (arrows).
    /// 绘制移动手柄（箭头）。
    fn draw_move_handles(
        &self,
        gl: &WebGl2RenderingContext,
        color_loc: &Option<web_sys::WebGlUniformLocation>,
        x: f32,
        y: f32,
        rotation: f32,
        camera: &Camera2D,
    ) {
        let arrow_length = 50.0 / camera.zoom;
        let arrow_head = 10.0 / camera.zoom;
        let cos = rotation.cos();
        let sin = rotation.sin();

        // X axis (red)
        let x_end_x = x + arrow_length * cos;
        let x_end_y = y + arrow_length * sin;
        let x_arrow = [
            x, y,
            x_end_x, x_end_y,
            x_end_x - arrow_head * cos + arrow_head * 0.3 * sin,
            x_end_y - arrow_head * sin - arrow_head * 0.3 * cos,
            x_end_x, x_end_y,
            x_end_x - arrow_head * cos - arrow_head * 0.3 * sin,
            x_end_y - arrow_head * sin + arrow_head * 0.3 * cos,
        ];

        unsafe {
            let array = js_sys::Float32Array::view(&x_arrow);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
        gl.uniform4f(color_loc.as_ref(), 1.0, 0.3, 0.3, 1.0);
        gl.draw_arrays(WebGl2RenderingContext::LINE_STRIP, 0, 5);

        // Y axis (green)
        let y_end_x = x - arrow_length * sin;
        let y_end_y = y + arrow_length * cos;
        let y_arrow = [
            x, y,
            y_end_x, y_end_y,
            y_end_x + arrow_head * sin + arrow_head * 0.3 * cos,
            y_end_y - arrow_head * cos + arrow_head * 0.3 * sin,
            y_end_x, y_end_y,
            y_end_x + arrow_head * sin - arrow_head * 0.3 * cos,
            y_end_y - arrow_head * cos - arrow_head * 0.3 * sin,
        ];

        unsafe {
            let array = js_sys::Float32Array::view(&y_arrow);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
        gl.uniform4f(color_loc.as_ref(), 0.3, 1.0, 0.3, 1.0);
        gl.draw_arrays(WebGl2RenderingContext::LINE_STRIP, 0, 5);
    }

    /// Draw rotation handle (circle).
    /// 绘制旋转手柄（圆形）。
    fn draw_rotate_handles(
        &self,
        gl: &WebGl2RenderingContext,
        color_loc: &Option<web_sys::WebGlUniformLocation>,
        x: f32,
        y: f32,
        radius: f32,
        _camera: &Camera2D,
    ) {
        let segments = 32;
        let mut vertices = Vec::with_capacity(segments * 2);

        for i in 0..segments {
            let angle = (i as f32 / segments as f32) * std::f32::consts::PI * 2.0;
            vertices.push(x + radius * angle.cos());
            vertices.push(y + radius * angle.sin());
        }

        unsafe {
            let array = js_sys::Float32Array::view(&vertices);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
        gl.uniform4f(color_loc.as_ref(), 0.3, 0.6, 1.0, 1.0);
        gl.draw_arrays(WebGl2RenderingContext::LINE_LOOP, 0, segments as i32);
    }

    /// Draw scale handles (squares at corners).
    /// 绘制缩放手柄（角落的方块）。
    fn draw_scale_handles(
        &self,
        gl: &WebGl2RenderingContext,
        color_loc: &Option<web_sys::WebGlUniformLocation>,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        rotation: f32,
        origin_x: f32,
        origin_y: f32,
        camera: &Camera2D,
    ) {
        let handle_size = 6.0 / camera.zoom;
        let corners = self.calculate_rect_vertices(x, y, width, height, rotation, origin_x, origin_y);

        // Draw a small square at each corner
        for i in 0..4 {
            let cx = corners[i * 2];
            let cy = corners[i * 2 + 1];

            let square = [
                cx - handle_size, cy - handle_size,
                cx + handle_size, cy - handle_size,
                cx + handle_size, cy + handle_size,
                cx - handle_size, cy + handle_size,
            ];

            unsafe {
                let array = js_sys::Float32Array::view(&square);
                gl.buffer_data_with_array_buffer_view(
                    WebGl2RenderingContext::ARRAY_BUFFER,
                    &array,
                    WebGl2RenderingContext::DYNAMIC_DRAW,
                );
            }
            gl.uniform4f(color_loc.as_ref(), 1.0, 0.8, 0.2, 1.0);
            gl.draw_arrays(WebGl2RenderingContext::LINE_LOOP, 0, 4);
        }
    }

    /// Calculate the 4 corner vertices of a rotated rectangle.
    /// 计算旋转矩形的4个角点顶点。
    fn calculate_rect_vertices(
        &self,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        rotation: f32,
        origin_x: f32,
        origin_y: f32,
    ) -> [f32; 8] {
        let cos = rotation.cos();
        let sin = rotation.sin();

        // Origin offset
        let ox = origin_x * width;
        let oy = origin_y * height;

        // Local corner positions (relative to origin)
        // Y-up coordinate system
        let corners = [
            (-ox, height - oy),         // Top-left
            (width - ox, height - oy),  // Top-right
            (width - ox, -oy),          // Bottom-right
            (-ox, -oy),                 // Bottom-left
        ];

        let mut vertices = [0.0f32; 8];
        for (i, (lx, ly)) in corners.iter().enumerate() {
            // Apply rotation
            let rx = lx * cos - ly * sin;
            let ry = lx * sin + ly * cos;

            // Apply translation
            vertices[i * 2] = rx + x;
            vertices[i * 2 + 1] = ry + y;
        }

        vertices
    }
}
