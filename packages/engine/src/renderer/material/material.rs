//! Material definition and properties.
//! 材质定义和属性。

use super::uniform::MaterialUniforms;

/// Blend modes for material rendering.
/// 材质渲染的混合模式。
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum BlendMode {
    /// No blending, fully opaque | 无混合，完全不透明
    None,
    /// Standard alpha blending | 标准透明度混合
    #[default]
    Alpha,
    /// Additive blending (good for glow effects) | 加法混合（适用于发光效果）
    Additive,
    /// Multiplicative blending (good for shadows) | 乘法混合（适用于阴影）
    Multiply,
    /// Screen blending (opposite of multiply) | 滤色混合（与乘法相反）
    Screen,
    /// Premultiplied alpha | 预乘透明度
    PremultipliedAlpha,
}

/// Cull modes for material rendering.
/// 材质渲染的剔除模式。
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum CullMode {
    /// No face culling | 不剔除
    #[default]
    None,
    /// Cull front faces | 剔除正面
    Front,
    /// Cull back faces | 剔除背面
    Back,
}

/// Material definition for 2D rendering.
/// 2D渲染的材质定义。
///
/// A material combines a shader program with uniform parameters and render states.
/// 材质将着色器程序与uniform参数和渲染状态组合在一起。
#[derive(Clone, Debug)]
pub struct Material {
    /// Shader program ID | 着色器程序ID
    pub shader_id: u32,

    /// Material uniform parameters | 材质uniform参数
    pub uniforms: MaterialUniforms,

    /// Blend mode | 混合模式
    pub blend_mode: BlendMode,

    /// Cull mode | 剔除模式
    pub cull_mode: CullMode,

    /// Depth test enabled | 是否启用深度测试
    pub depth_test: bool,

    /// Depth write enabled | 是否启用深度写入
    pub depth_write: bool,

    /// Material name (for debugging) | 材质名称（用于调试）
    pub name: String,
}

impl Default for Material {
    fn default() -> Self {
        Self {
            shader_id: 0, // Default sprite shader
            uniforms: MaterialUniforms::new(),
            blend_mode: BlendMode::Alpha,
            cull_mode: CullMode::None,
            depth_test: false,
            depth_write: false,
            name: "Default".to_string(),
        }
    }
}

impl Material {
    /// Create a new material with default settings.
    /// 使用默认设置创建新材质。
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            ..Default::default()
        }
    }

    /// Create a material with a specific shader.
    /// 使用特定着色器创建材质。
    pub fn with_shader(name: &str, shader_id: u32) -> Self {
        Self {
            name: name.to_string(),
            shader_id,
            ..Default::default()
        }
    }

    /// Set the blend mode.
    /// 设置混合模式。
    pub fn set_blend_mode(&mut self, mode: BlendMode) -> &mut Self {
        self.blend_mode = mode;
        self
    }

    /// Set a float uniform.
    /// 设置浮点uniform。
    pub fn set_float(&mut self, name: &str, value: f32) -> &mut Self {
        self.uniforms.set_float(name, value);
        self
    }

    /// Set a vec2 uniform.
    /// 设置vec2 uniform。
    pub fn set_vec2(&mut self, name: &str, x: f32, y: f32) -> &mut Self {
        self.uniforms.set_vec2(name, x, y);
        self
    }

    /// Set a vec3 uniform.
    /// 设置vec3 uniform。
    pub fn set_vec3(&mut self, name: &str, x: f32, y: f32, z: f32) -> &mut Self {
        self.uniforms.set_vec3(name, x, y, z);
        self
    }

    /// Set a vec4 uniform.
    /// 设置vec4 uniform。
    pub fn set_vec4(&mut self, name: &str, x: f32, y: f32, z: f32, w: f32) -> &mut Self {
        self.uniforms.set_vec4(name, x, y, z, w);
        self
    }

    /// Set a color uniform (RGBA, 0.0-1.0).
    /// 设置颜色uniform（RGBA，0.0-1.0）。
    pub fn set_color(&mut self, name: &str, r: f32, g: f32, b: f32, a: f32) -> &mut Self {
        self.uniforms.set_color(name, r, g, b, a);
        self
    }
}

// ============= Built-in material presets =============
// ============= 内置材质预设 =============

impl Material {
    /// Create a standard sprite material.
    /// 创建标准精灵材质。
    pub fn sprite() -> Self {
        Self::new("Sprite")
    }

    /// Create an additive (glow) material.
    /// 创建加法（发光）材质。
    pub fn additive() -> Self {
        let mut mat = Self::new("Additive");
        mat.blend_mode = BlendMode::Additive;
        mat
    }

    /// Create a multiply (shadow) material.
    /// 创建乘法（阴影）材质。
    pub fn multiply() -> Self {
        let mut mat = Self::new("Multiply");
        mat.blend_mode = BlendMode::Multiply;
        mat
    }

    /// Create an unlit/opaque material.
    /// 创建无光照/不透明材质。
    pub fn unlit() -> Self {
        let mut mat = Self::new("Unlit");
        mat.blend_mode = BlendMode::None;
        mat
    }
}
