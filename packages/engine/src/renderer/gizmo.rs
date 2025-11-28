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
    /// Pending rectangle data: [x, y, width, height, rotation, origin_x, origin_y, r, g, b, a, show_handles]
    /// 待渲染的矩形数据
    rects: Vec<f32>,
    /// Pending circle data: [x, y, radius, r, g, b, a, segments]
    /// 待渲染的圆形数据
    circles: Vec<f32>,
    /// Pending line data: stored as separate line commands
    /// 待渲染的线条数据
    lines: Vec<LineGizmo>,
    /// Pending capsule data: [x, y, radius, half_height, rotation, r, g, b, a]
    /// 待渲染的胶囊数据
    capsules: Vec<f32>,
    /// Current transform mode
    transform_mode: TransformMode,
}

/// Line gizmo data
/// 线条 gizmo 数据
struct LineGizmo {
    points: Vec<f32>,
    r: f32,
    g: f32,
    b: f32,
    a: f32,
    closed: bool,
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
            circles: Vec::new(),
            lines: Vec::new(),
            capsules: Vec::new(),
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
        self.circles.clear();
        self.lines.clear();
        self.capsules.clear();
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
    /// * `show_handles` - Whether to show transform handles | 是否显示变换手柄
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
        show_handles: bool,
    ) {
        self.rects.extend_from_slice(&[
            x, y, width, height, rotation, origin_x, origin_y, r, g, b, a, if show_handles { 1.0 } else { 0.0 }
        ]);
    }

    /// Add a circle outline gizmo.
    /// 添加圆形边框Gizmo。
    pub fn add_circle(
        &mut self,
        x: f32,
        y: f32,
        radius: f32,
        r: f32,
        g: f32,
        b: f32,
        a: f32,
    ) {
        self.circles.extend_from_slice(&[x, y, radius, r, g, b, a, 32.0]);
    }

    /// Add a line gizmo.
    /// 添加线条Gizmo。
    pub fn add_line(
        &mut self,
        points: Vec<f32>,
        r: f32,
        g: f32,
        b: f32,
        a: f32,
        closed: bool,
    ) {
        self.lines.push(LineGizmo { points, r, g, b, a, closed });
    }

    /// Add a capsule outline gizmo.
    /// 添加胶囊边框Gizmo。
    ///
    /// Capsule is defined by center position, radius, half-height (distance from center to cap centers), and rotation.
    /// 胶囊由中心位置、半径、半高度（从中心到端帽圆心的距离）和旋转定义。
    pub fn add_capsule(
        &mut self,
        x: f32,
        y: f32,
        radius: f32,
        half_height: f32,
        rotation: f32,
        r: f32,
        g: f32,
        b: f32,
        a: f32,
    ) {
        self.capsules.extend_from_slice(&[x, y, radius, half_height, rotation, r, g, b, a]);
    }

    /// Render axis indicator at top-right corner of the viewport.
    /// 在视口右上角渲染坐标轴指示器。
    ///
    /// This is drawn in screen space and is not affected by camera pan/zoom.
    /// 这是在屏幕空间绘制的，不受相机平移/缩放影响。
    pub fn render_axis_indicator(
        &self,
        gl: &WebGl2RenderingContext,
        viewport_width: f32,
        viewport_height: f32,
    ) {
        // Skip if viewport is too small
        if viewport_width < 100.0 || viewport_height < 100.0 {
            return;
        }

        gl.use_program(Some(&self.program));

        // Disable depth test for screen-space UI
        gl.disable(WebGl2RenderingContext::DEPTH_TEST);

        // Create orthographic projection for screen space (NDC: -1 to 1)
        let half_w = viewport_width / 2.0;
        let half_h = viewport_height / 2.0;

        let projection = [
            1.0 / half_w, 0.0, 0.0,
            0.0, 1.0 / half_h, 0.0,
            0.0, 0.0, 1.0,
        ];

        let proj_loc = gl.get_uniform_location(&self.program, "u_projection");
        gl.uniform_matrix3fv_with_f32_array(proj_loc.as_ref(), false, &projection);

        let color_loc = gl.get_uniform_location(&self.program, "u_color");

        gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, Some(&self.vertex_buffer));
        gl.enable_vertex_attrib_array(0);
        gl.vertex_attrib_pointer_with_i32(0, 2, WebGl2RenderingContext::FLOAT, false, 0, 0);

        // Position in top-right corner (increased padding to prevent X label clipping)
        // 位置在右上角（增加边距防止 X 标签被裁剪）
        let padding_x = 70.0;  // More padding on X for the label
        let padding_y = 55.0;
        let center_x = half_w - padding_x;
        let center_y = half_h - padding_y;
        let axis_length = 30.0;  // Longer axes for better visibility
        let arrow_size = 8.0;
        let label_offset = 10.0;
        let label_size = 4.0;

        // Draw semi-transparent background circle for better visibility
        // 绘制半透明背景圆以提高可见性
        let bg_segments = 32;
        let bg_radius = 45.0;
        let mut bg_vertices = Vec::with_capacity((bg_segments + 1) * 2);
        bg_vertices.push(center_x);
        bg_vertices.push(center_y);
        for i in 0..=bg_segments {
            let angle = (i as f32 / bg_segments as f32) * std::f32::consts::PI * 2.0;
            bg_vertices.push(center_x + bg_radius * angle.cos());
            bg_vertices.push(center_y + bg_radius * angle.sin());
        }

        unsafe {
            let array = js_sys::Float32Array::view(&bg_vertices);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
        gl.uniform4f(color_loc.as_ref(), 0.1, 0.1, 0.1, 0.7);
        gl.draw_arrays(WebGl2RenderingContext::TRIANGLE_FAN, 0, (bg_segments + 2) as i32);

        // Draw origin point (filled circle)
        // 绘制原点（实心圆）
        let origin_segments = 12;
        let origin_radius = 3.0;
        let mut origin_vertices = Vec::with_capacity((origin_segments + 1) * 2);
        origin_vertices.push(center_x);
        origin_vertices.push(center_y);
        for i in 0..=origin_segments {
            let angle = (i as f32 / origin_segments as f32) * std::f32::consts::PI * 2.0;
            origin_vertices.push(center_x + origin_radius * angle.cos());
            origin_vertices.push(center_y + origin_radius * angle.sin());
        }

        unsafe {
            let array = js_sys::Float32Array::view(&origin_vertices);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
        gl.uniform4f(color_loc.as_ref(), 0.8, 0.8, 0.8, 1.0);
        gl.draw_arrays(WebGl2RenderingContext::TRIANGLE_FAN, 0, (origin_segments + 2) as i32);

        // X axis (red, pointing right)
        let x_end_x = center_x + axis_length;
        let x_end_y = center_y;

        // X axis line (thicker effect with multiple lines)
        let x_axis = [
            center_x + origin_radius, center_y,
            x_end_x - arrow_size * 0.3, x_end_y,
        ];
        unsafe {
            let array = js_sys::Float32Array::view(&x_axis);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
        gl.uniform4f(color_loc.as_ref(), 1.0, 0.4, 0.4, 1.0);
        gl.draw_arrays(WebGl2RenderingContext::LINES, 0, 2);

        // X arrow head (filled triangle)
        let x_arrow = [
            x_end_x, x_end_y,
            x_end_x - arrow_size, x_end_y + arrow_size * 0.4,
            x_end_x - arrow_size, x_end_y - arrow_size * 0.4,
        ];
        unsafe {
            let array = js_sys::Float32Array::view(&x_arrow);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
        gl.draw_arrays(WebGl2RenderingContext::TRIANGLES, 0, 3);

        // X label
        let lx = x_end_x + label_offset;
        let ly = x_end_y;
        let x_label = [
            lx - label_size, ly + label_size,
            lx + label_size, ly - label_size,
            lx - label_size, ly - label_size,
            lx + label_size, ly + label_size,
        ];
        unsafe {
            let array = js_sys::Float32Array::view(&x_label);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
        gl.draw_arrays(WebGl2RenderingContext::LINES, 0, 4);

        // Y axis (green, pointing up)
        let y_end_x = center_x;
        let y_end_y = center_y + axis_length;

        // Y axis line
        let y_axis = [
            center_x, center_y + origin_radius,
            y_end_x, y_end_y - arrow_size * 0.3,
        ];
        unsafe {
            let array = js_sys::Float32Array::view(&y_axis);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
        gl.uniform4f(color_loc.as_ref(), 0.4, 1.0, 0.4, 1.0);
        gl.draw_arrays(WebGl2RenderingContext::LINES, 0, 2);

        // Y arrow head (filled triangle)
        let y_arrow = [
            y_end_x, y_end_y,
            y_end_x - arrow_size * 0.4, y_end_y - arrow_size,
            y_end_x + arrow_size * 0.4, y_end_y - arrow_size,
        ];
        unsafe {
            let array = js_sys::Float32Array::view(&y_arrow);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
        gl.draw_arrays(WebGl2RenderingContext::TRIANGLES, 0, 3);

        // Y label
        let lx = y_end_x;
        let ly = y_end_y + label_offset;
        let y_label = [
            lx - label_size, ly + label_size,
            lx, ly,
            lx + label_size, ly + label_size,
            lx, ly,
            lx, ly,
            lx, ly - label_size * 0.8,
        ];
        unsafe {
            let array = js_sys::Float32Array::view(&y_label);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
        gl.draw_arrays(WebGl2RenderingContext::LINES, 0, 6);

        // Cleanup
        gl.disable_vertex_attrib_array(0);
    }

    /// Render all pending gizmos.
    /// 渲染所有待渲染的Gizmo。
    pub fn render(&mut self, gl: &WebGl2RenderingContext, camera: &Camera2D) {
        if self.rects.is_empty() && self.circles.is_empty() && self.lines.is_empty() && self.capsules.is_empty() {
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

        // Render rectangles
        self.render_rects(gl, &color_loc, camera);

        // Render circles
        self.render_circles(gl, &color_loc);

        // Render lines
        self.render_lines(gl, &color_loc);

        // Render capsules
        self.render_capsules(gl, &color_loc);

        gl.disable_vertex_attrib_array(0);
    }

    /// Render all pending rectangles.
    fn render_rects(&self, gl: &WebGl2RenderingContext, color_loc: &Option<web_sys::WebGlUniformLocation>, camera: &Camera2D) {
        let rect_stride = 12;
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
            let show_handles = self.rects[offset + 11] > 0.5;

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

            if show_handles {
                match self.transform_mode {
                    TransformMode::Select => {}
                    TransformMode::Move => {
                        self.draw_move_handles(gl, color_loc, x, y, rotation, camera);
                    }
                    TransformMode::Rotate => {
                        self.draw_rotate_handles(gl, color_loc, x, y, width.max(height) * 0.6, camera);
                    }
                    TransformMode::Scale => {
                        self.draw_scale_handles(gl, color_loc, x, y, width, height, rotation, origin_x, origin_y, camera);
                    }
                }
            }
        }
    }

    /// Render all pending circles.
    fn render_circles(&self, gl: &WebGl2RenderingContext, color_loc: &Option<web_sys::WebGlUniformLocation>) {
        let circle_stride = 8;
        let circle_count = self.circles.len() / circle_stride;

        for i in 0..circle_count {
            let offset = i * circle_stride;
            let x = self.circles[offset];
            let y = self.circles[offset + 1];
            let radius = self.circles[offset + 2];
            let r = self.circles[offset + 3];
            let g = self.circles[offset + 4];
            let b = self.circles[offset + 5];
            let a = self.circles[offset + 6];
            let segments = self.circles[offset + 7] as usize;

            let mut vertices = Vec::with_capacity(segments * 2);
            for j in 0..segments {
                let angle = (j as f32 / segments as f32) * std::f32::consts::PI * 2.0;
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

            gl.uniform4f(color_loc.as_ref(), r, g, b, a);
            gl.draw_arrays(WebGl2RenderingContext::LINE_LOOP, 0, segments as i32);
        }
    }

    /// Render all pending lines.
    fn render_lines(&self, gl: &WebGl2RenderingContext, color_loc: &Option<web_sys::WebGlUniformLocation>) {
        for line in &self.lines {
            if line.points.len() < 4 {
                continue;
            }

            unsafe {
                let array = js_sys::Float32Array::view(&line.points);
                gl.buffer_data_with_array_buffer_view(
                    WebGl2RenderingContext::ARRAY_BUFFER,
                    &array,
                    WebGl2RenderingContext::DYNAMIC_DRAW,
                );
            }

            gl.uniform4f(color_loc.as_ref(), line.r, line.g, line.b, line.a);
            let point_count = (line.points.len() / 2) as i32;
            if line.closed {
                gl.draw_arrays(WebGl2RenderingContext::LINE_LOOP, 0, point_count);
            } else {
                gl.draw_arrays(WebGl2RenderingContext::LINE_STRIP, 0, point_count);
            }
        }
    }

    /// Render all pending capsules.
    fn render_capsules(&self, gl: &WebGl2RenderingContext, color_loc: &Option<web_sys::WebGlUniformLocation>) {
        let capsule_stride = 9;
        let capsule_count = self.capsules.len() / capsule_stride;
        let segments = 16;

        for i in 0..capsule_count {
            let offset = i * capsule_stride;
            let cx = self.capsules[offset];
            let cy = self.capsules[offset + 1];
            let radius = self.capsules[offset + 2];
            let half_height = self.capsules[offset + 3];
            let rotation = self.capsules[offset + 4];
            let r = self.capsules[offset + 5];
            let g = self.capsules[offset + 6];
            let b = self.capsules[offset + 7];
            let a = self.capsules[offset + 8];

            let cos_r = rotation.cos();
            let sin_r = rotation.sin();

            let mut vertices = Vec::with_capacity((segments * 2 + 4) * 2);

            // Draw capsule in local space then rotate:
            // - Top semicircle at y = +half_height, arc from angle 0 to PI
            // - Right line from top-right to bottom-right
            // - Bottom semicircle at y = -half_height, arc from angle PI to 2*PI
            // - Left line from bottom-left to top-left (closed by LINE_LOOP)

            // Top semicircle (arc curving upward)
            for j in 0..=segments {
                let angle = (j as f32 / segments as f32) * std::f32::consts::PI;
                // Local coordinates: semicircle centered at (0, half_height)
                // angle 0 -> (radius, half_height), angle PI -> (-radius, half_height)
                // We want it to curve UP, so use cos for x, sin for y offset
                let lx = radius * angle.cos();
                let ly = half_height + radius * angle.sin();
                // Rotate and translate to world
                let wx = cx + lx * cos_r - ly * sin_r;
                let wy = cy + lx * sin_r + ly * cos_r;
                vertices.push(wx);
                vertices.push(wy);
            }

            // Bottom semicircle (arc curving downward)
            for j in 0..=segments {
                let angle = (j as f32 / segments as f32) * std::f32::consts::PI;
                // Local coordinates: semicircle centered at (0, -half_height)
                // angle 0 -> (-radius, -half_height), angle PI -> (radius, -half_height)
                // We want it to curve DOWN, so negate both cos and sin offset
                let lx = -radius * angle.cos();
                let ly = -half_height - radius * angle.sin();
                // Rotate and translate to world
                let wx = cx + lx * cos_r - ly * sin_r;
                let wy = cy + lx * sin_r + ly * cos_r;
                vertices.push(wx);
                vertices.push(wy);
            }

            unsafe {
                let array = js_sys::Float32Array::view(&vertices);
                gl.buffer_data_with_array_buffer_view(
                    WebGl2RenderingContext::ARRAY_BUFFER,
                    &array,
                    WebGl2RenderingContext::DYNAMIC_DRAW,
                );
            }

            gl.uniform4f(color_loc.as_ref(), r, g, b, a);
            gl.draw_arrays(WebGl2RenderingContext::LINE_LOOP, 0, ((segments + 1) * 2) as i32);
        }
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
