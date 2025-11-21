//! Built-in shader source code.
//! 内置Shader源代码。

/// Sprite vertex shader source.
/// 精灵顶点着色器源代码。
///
/// Handles sprite transformation with position, UV, and color attributes.
/// 处理带有位置、UV和颜色属性的精灵变换。
pub const SPRITE_VERTEX_SHADER: &str = r#"#version 300 es
precision highp float;

// Vertex attributes | 顶点属性
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;
layout(location = 2) in vec4 a_color;

// Uniforms | 统一变量
uniform mat3 u_projection;

// Outputs to fragment shader | 输出到片段着色器
out vec2 v_texCoord;
out vec4 v_color;

void main() {
    // Apply projection matrix | 应用投影矩阵
    vec3 pos = u_projection * vec3(a_position, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);

    // Pass through to fragment shader | 传递到片段着色器
    v_texCoord = a_texCoord;
    v_color = a_color;
}
"#;

/// Sprite fragment shader source.
/// 精灵片段着色器源代码。
///
/// Samples texture and applies vertex color tinting.
/// 采样纹理并应用顶点颜色着色。
pub const SPRITE_FRAGMENT_SHADER: &str = r#"#version 300 es
precision highp float;

// Inputs from vertex shader | 来自顶点着色器的输入
in vec2 v_texCoord;
in vec4 v_color;

// Texture sampler | 纹理采样器
uniform sampler2D u_texture;

// Output color | 输出颜色
out vec4 fragColor;

void main() {
    // Sample texture and multiply by vertex color | 采样纹理并乘以顶点颜色
    vec4 texColor = texture(u_texture, v_texCoord);
    fragColor = texColor * v_color;

    // Discard fully transparent pixels | 丢弃完全透明的像素
    if (fragColor.a < 0.01) {
        discard;
    }
}
"#;
