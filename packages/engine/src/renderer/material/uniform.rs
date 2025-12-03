//! Material uniform values and types.
//! 材质uniform值和类型。

use std::collections::HashMap;
use web_sys::{WebGl2RenderingContext, WebGlUniformLocation};

use crate::renderer::shader::ShaderProgram;

/// Uniform value types supported by the material system.
/// 材质系统支持的uniform值类型。
#[derive(Clone, Debug)]
pub enum UniformValue {
    /// Single float value | 单精度浮点值
    Float(f32),
    /// Two component vector | 二维向量
    Vec2([f32; 2]),
    /// Three component vector | 三维向量
    Vec3([f32; 3]),
    /// Four component vector (also used for colors) | 四维向量（也用于颜色）
    Vec4([f32; 4]),
    /// Single integer value | 整数值
    Int(i32),
    /// 3x3 matrix | 3x3矩阵
    Mat3([f32; 9]),
    /// 4x4 matrix | 4x4矩阵
    Mat4([f32; 16]),
    /// Texture sampler slot | 纹理采样器槽位
    Sampler(i32),
}

impl UniformValue {
    /// Apply this uniform value to a shader.
    /// 将此uniform值应用到着色器。
    pub fn apply(&self, gl: &WebGl2RenderingContext, location: &WebGlUniformLocation) {
        match self {
            UniformValue::Float(v) => {
                gl.uniform1f(Some(location), *v);
            }
            UniformValue::Vec2(v) => {
                gl.uniform2f(Some(location), v[0], v[1]);
            }
            UniformValue::Vec3(v) => {
                gl.uniform3f(Some(location), v[0], v[1], v[2]);
            }
            UniformValue::Vec4(v) => {
                gl.uniform4f(Some(location), v[0], v[1], v[2], v[3]);
            }
            UniformValue::Int(v) => {
                gl.uniform1i(Some(location), *v);
            }
            UniformValue::Mat3(v) => {
                gl.uniform_matrix3fv_with_f32_array(Some(location), false, v);
            }
            UniformValue::Mat4(v) => {
                gl.uniform_matrix4fv_with_f32_array(Some(location), false, v);
            }
            UniformValue::Sampler(slot) => {
                gl.uniform1i(Some(location), *slot);
            }
        }
    }
}

/// Collection of material uniform values.
/// 材质uniform值集合。
#[derive(Clone, Debug, Default)]
pub struct MaterialUniforms {
    /// Named uniform values | 命名的uniform值
    values: HashMap<String, UniformValue>,
}

impl MaterialUniforms {
    /// Create empty uniforms collection.
    /// 创建空的uniform集合。
    pub fn new() -> Self {
        Self {
            values: HashMap::new(),
        }
    }

    /// Set a uniform value.
    /// 设置uniform值。
    pub fn set(&mut self, name: &str, value: UniformValue) {
        self.values.insert(name.to_string(), value);
    }

    /// Get a uniform value.
    /// 获取uniform值。
    pub fn get(&self, name: &str) -> Option<&UniformValue> {
        self.values.get(name)
    }

    /// Remove a uniform value.
    /// 移除uniform值。
    pub fn remove(&mut self, name: &str) -> Option<UniformValue> {
        self.values.remove(name)
    }

    /// Check if a uniform exists.
    /// 检查uniform是否存在。
    pub fn has(&self, name: &str) -> bool {
        self.values.contains_key(name)
    }

    /// Apply all uniforms to a shader program.
    /// 将所有uniform应用到着色器程序。
    pub fn apply_to_shader(&self, gl: &WebGl2RenderingContext, shader: &ShaderProgram) {
        for (name, value) in &self.values {
            if let Some(location) = shader.get_uniform_location(gl, name) {
                value.apply(gl, &location);
            }
        }
    }

    /// Get all uniform names.
    /// 获取所有uniform名称。
    pub fn names(&self) -> Vec<&String> {
        self.values.keys().collect()
    }

    /// Clear all uniforms.
    /// 清除所有uniform。
    pub fn clear(&mut self) {
        self.values.clear();
    }

    /// Get uniform count.
    /// 获取uniform数量。
    pub fn len(&self) -> usize {
        self.values.len()
    }

    /// Check if empty.
    /// 检查是否为空。
    pub fn is_empty(&self) -> bool {
        self.values.is_empty()
    }
}

// ============= Convenience setters =============
// ============= 便捷设置方法 =============

impl MaterialUniforms {
    /// Set a float uniform.
    /// 设置浮点uniform。
    pub fn set_float(&mut self, name: &str, value: f32) {
        self.set(name, UniformValue::Float(value));
    }

    /// Set a vec2 uniform.
    /// 设置vec2 uniform。
    pub fn set_vec2(&mut self, name: &str, x: f32, y: f32) {
        self.set(name, UniformValue::Vec2([x, y]));
    }

    /// Set a vec3 uniform.
    /// 设置vec3 uniform。
    pub fn set_vec3(&mut self, name: &str, x: f32, y: f32, z: f32) {
        self.set(name, UniformValue::Vec3([x, y, z]));
    }

    /// Set a vec4 uniform (also used for colors).
    /// 设置vec4 uniform（也用于颜色）。
    pub fn set_vec4(&mut self, name: &str, x: f32, y: f32, z: f32, w: f32) {
        self.set(name, UniformValue::Vec4([x, y, z, w]));
    }

    /// Set a color uniform (RGBA, 0.0-1.0).
    /// 设置颜色uniform（RGBA，0.0-1.0）。
    pub fn set_color(&mut self, name: &str, r: f32, g: f32, b: f32, a: f32) {
        self.set(name, UniformValue::Vec4([r, g, b, a]));
    }

    /// Set an integer uniform.
    /// 设置整数uniform。
    pub fn set_int(&mut self, name: &str, value: i32) {
        self.set(name, UniformValue::Int(value));
    }

    /// Set a texture sampler uniform.
    /// 设置纹理采样器uniform。
    pub fn set_sampler(&mut self, name: &str, slot: i32) {
        self.set(name, UniformValue::Sampler(slot));
    }
}
