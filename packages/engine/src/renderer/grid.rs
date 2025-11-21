//! Grid renderer for editor viewport.
//! 编辑器视口的网格渲染器。

use web_sys::{WebGl2RenderingContext, WebGlBuffer, WebGlProgram};
use crate::core::error::{Result, EngineError};
use super::camera::Camera2D;

const GRID_VERTEX_SHADER: &str = r#"#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

uniform mat3 u_projection;

void main() {
    vec3 pos = u_projection * vec3(a_position, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
}
"#;

const GRID_FRAGMENT_SHADER: &str = r#"#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 fragColor;

void main() {
    fragColor = u_color;
}
"#;

pub struct GridRenderer {
    program: WebGlProgram,
    vertex_buffer: WebGlBuffer,
    vertex_count: i32,
    last_zoom: f32,
    last_width: f32,
    last_height: f32,
}

impl GridRenderer {
    pub fn new(gl: &WebGl2RenderingContext) -> Result<Self> {
        let program = Self::create_program(gl)?;
        let vertex_buffer = gl.create_buffer()
            .ok_or(EngineError::BufferCreationFailed)?;

        Ok(Self {
            program,
            vertex_buffer,
            vertex_count: 0,
            last_zoom: 0.0,
            last_width: 0.0,
            last_height: 0.0,
        })
    }

    fn create_program(gl: &WebGl2RenderingContext) -> Result<WebGlProgram> {
        let vert_shader = gl.create_shader(WebGl2RenderingContext::VERTEX_SHADER)
            .ok_or_else(|| EngineError::ShaderCompileFailed("Failed to create vertex shader".into()))?;
        gl.shader_source(&vert_shader, GRID_VERTEX_SHADER);
        gl.compile_shader(&vert_shader);

        if !gl.get_shader_parameter(&vert_shader, WebGl2RenderingContext::COMPILE_STATUS)
            .as_bool()
            .unwrap_or(false)
        {
            let log = gl.get_shader_info_log(&vert_shader).unwrap_or_default();
            return Err(EngineError::ShaderCompileFailed(format!("Grid vertex shader: {}", log)));
        }

        let frag_shader = gl.create_shader(WebGl2RenderingContext::FRAGMENT_SHADER)
            .ok_or_else(|| EngineError::ShaderCompileFailed("Failed to create fragment shader".into()))?;
        gl.shader_source(&frag_shader, GRID_FRAGMENT_SHADER);
        gl.compile_shader(&frag_shader);

        if !gl.get_shader_parameter(&frag_shader, WebGl2RenderingContext::COMPILE_STATUS)
            .as_bool()
            .unwrap_or(false)
        {
            let log = gl.get_shader_info_log(&frag_shader).unwrap_or_default();
            return Err(EngineError::ShaderCompileFailed(format!("Grid fragment shader: {}", log)));
        }

        let program = gl.create_program()
            .ok_or_else(|| EngineError::ProgramLinkFailed("Failed to create grid program".into()))?;
        gl.attach_shader(&program, &vert_shader);
        gl.attach_shader(&program, &frag_shader);
        gl.link_program(&program);

        if !gl.get_program_parameter(&program, WebGl2RenderingContext::LINK_STATUS)
            .as_bool()
            .unwrap_or(false)
        {
            let log = gl.get_program_info_log(&program).unwrap_or_default();
            return Err(EngineError::ProgramLinkFailed(format!("Grid program: {}", log)));
        }

        gl.delete_shader(Some(&vert_shader));
        gl.delete_shader(Some(&frag_shader));

        Ok(program)
    }

    fn update_grid(&mut self, gl: &WebGl2RenderingContext, camera: &Camera2D) {
        let zoom = camera.zoom;
        let width = camera.viewport_width();
        let height = camera.viewport_height();

        if (zoom - self.last_zoom).abs() < 0.001
            && (width - self.last_width).abs() < 1.0
            && (height - self.last_height).abs() < 1.0
        {
            return;
        }

        self.last_zoom = zoom;
        self.last_width = width;
        self.last_height = height;

        let half_width = width / (2.0 * zoom);
        let half_height = height / (2.0 * zoom);
        let max_size = half_width.max(half_height) * 2.0;

        let base_step = if max_size > 10000.0 {
            1000.0
        } else if max_size > 1000.0 {
            100.0
        } else if max_size > 100.0 {
            10.0
        } else if max_size > 10.0 {
            1.0
        } else {
            0.1
        };

        let fine_step = base_step;
        let range = max_size * 1.5;
        let start = -range;
        let end = range;

        let mut vertices = Vec::new();

        let mut x = (start / fine_step).floor() * fine_step;
        while x <= end {
            vertices.extend_from_slice(&[x, start, x, end]);
            x += fine_step;
        }

        let mut y = (start / fine_step).floor() * fine_step;
        while y <= end {
            vertices.extend_from_slice(&[start, y, end, y]);
            y += fine_step;
        }

        self.vertex_count = (vertices.len() / 2) as i32;

        gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, Some(&self.vertex_buffer));
        unsafe {
            let array = js_sys::Float32Array::view(&vertices);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::DYNAMIC_DRAW,
            );
        }
    }

    pub fn render(&mut self, gl: &WebGl2RenderingContext, camera: &Camera2D) {
        self.update_grid(gl, camera);

        if self.vertex_count == 0 {
            return;
        }

        gl.use_program(Some(&self.program));

        let projection = camera.projection_matrix();
        let proj_loc = gl.get_uniform_location(&self.program, "u_projection");
        gl.uniform_matrix3fv_with_f32_array(proj_loc.as_ref(), false, &projection.to_cols_array());

        let color_loc = gl.get_uniform_location(&self.program, "u_color");
        gl.uniform4f(color_loc.as_ref(), 0.3, 0.3, 0.35, 1.0);

        gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, Some(&self.vertex_buffer));
        gl.enable_vertex_attrib_array(0);
        gl.vertex_attrib_pointer_with_i32(0, 2, WebGl2RenderingContext::FLOAT, false, 0, 0);

        gl.draw_arrays(WebGl2RenderingContext::LINES, 0, self.vertex_count);

        gl.disable_vertex_attrib_array(0);
    }

    pub fn render_axes(&self, gl: &WebGl2RenderingContext, camera: &Camera2D) {
        gl.use_program(Some(&self.program));

        let projection = camera.projection_matrix();
        let proj_loc = gl.get_uniform_location(&self.program, "u_projection");
        gl.uniform_matrix3fv_with_f32_array(proj_loc.as_ref(), false, &projection.to_cols_array());

        let half_width = camera.viewport_width() / (2.0 * camera.zoom);
        let half_height = camera.viewport_height() / (2.0 * camera.zoom);
        let axis_length = half_width.max(half_height) * 2.0;

        let color_loc = gl.get_uniform_location(&self.program, "u_color");

        let axis_buffer = gl.create_buffer().unwrap();
        gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, Some(&axis_buffer));
        gl.enable_vertex_attrib_array(0);
        gl.vertex_attrib_pointer_with_i32(0, 2, WebGl2RenderingContext::FLOAT, false, 0, 0);

        // X axis (red)
        let x_axis = [-axis_length, 0.0, axis_length, 0.0f32];
        unsafe {
            let array = js_sys::Float32Array::view(&x_axis);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::STATIC_DRAW,
            );
        }
        gl.uniform4f(color_loc.as_ref(), 1.0, 0.3, 0.3, 1.0);
        gl.draw_arrays(WebGl2RenderingContext::LINES, 0, 2);

        // Y axis (green)
        let y_axis = [0.0, -axis_length, 0.0, axis_length];
        unsafe {
            let array = js_sys::Float32Array::view(&y_axis);
            gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &array,
                WebGl2RenderingContext::STATIC_DRAW,
            );
        }
        gl.uniform4f(color_loc.as_ref(), 0.3, 1.0, 0.3, 1.0);
        gl.draw_arrays(WebGl2RenderingContext::LINES, 0, 2);

        gl.disable_vertex_attrib_array(0);
        gl.delete_buffer(Some(&axis_buffer));
    }
}
