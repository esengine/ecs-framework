//! Material manager for storing and retrieving materials.
//! 材质管理器，用于存储和检索材质。

use std::collections::HashMap;
use web_sys::WebGl2RenderingContext;

use super::material::{Material, BlendMode};

/// Reserved material IDs for built-in materials.
/// 内置材质的保留ID。
pub const MATERIAL_ID_DEFAULT: u32 = 0;
pub const MATERIAL_ID_ADDITIVE: u32 = 1;
pub const MATERIAL_ID_MULTIPLY: u32 = 2;
pub const MATERIAL_ID_UNLIT: u32 = 3;

/// Material manager for creating and caching materials.
/// 材质管理器，用于创建和缓存材质。
pub struct MaterialManager {
    /// Stored materials indexed by ID.
    /// 按ID索引的存储材质。
    materials: HashMap<u32, Material>,

    /// Next available material ID for custom materials.
    /// 下一个可用的自定义材质ID。
    next_material_id: u32,
}

impl MaterialManager {
    /// Create a new material manager with built-in materials.
    /// 创建带有内置材质的新材质管理器。
    pub fn new() -> Self {
        let mut manager = Self {
            materials: HashMap::new(),
            next_material_id: 100, // Reserve 0-99 for built-in materials
        };

        // Register built-in materials | 注册内置材质
        manager.materials.insert(MATERIAL_ID_DEFAULT, Material::sprite());
        manager.materials.insert(MATERIAL_ID_ADDITIVE, Material::additive());
        manager.materials.insert(MATERIAL_ID_MULTIPLY, Material::multiply());
        manager.materials.insert(MATERIAL_ID_UNLIT, Material::unlit());

        log::info!("MaterialManager initialized with {} built-in materials | 材质管理器初始化完成，内置材质数量: {}",
            manager.materials.len(), manager.materials.len());

        manager
    }

    /// Register a custom material.
    /// 注册自定义材质。
    ///
    /// # Returns | 返回
    /// The material ID for referencing this material | 用于引用此材质的ID
    pub fn register_material(&mut self, material: Material) -> u32 {
        let material_id = self.next_material_id;
        self.next_material_id += 1;

        log::debug!("Registered material '{}' with ID: {} | 注册材质 '{}' ID: {}",
            material.name, material_id, material.name, material_id);

        self.materials.insert(material_id, material);
        material_id
    }

    /// Register a material with a specific ID.
    /// 使用特定ID注册材质。
    pub fn register_material_with_id(&mut self, material_id: u32, material: Material) {
        log::debug!("Registered material '{}' with ID: {} | 注册材质 '{}' ID: {}",
            material.name, material_id, material.name, material_id);

        self.materials.insert(material_id, material);

        // Update next_material_id if necessary
        if material_id >= self.next_material_id {
            self.next_material_id = material_id + 1;
        }
    }

    /// Get a material by ID.
    /// 按ID获取材质。
    #[inline]
    pub fn get_material(&self, material_id: u32) -> Option<&Material> {
        self.materials.get(&material_id)
    }

    /// Get a mutable material by ID.
    /// 按ID获取可变材质。
    #[inline]
    pub fn get_material_mut(&mut self, material_id: u32) -> Option<&mut Material> {
        self.materials.get_mut(&material_id)
    }

    /// Get the default material.
    /// 获取默认材质。
    #[inline]
    pub fn get_default_material(&self) -> &Material {
        self.materials.get(&MATERIAL_ID_DEFAULT)
            .expect("Default material should always exist | 默认材质应该始终存在")
    }

    /// Check if a material exists.
    /// 检查材质是否存在。
    #[inline]
    pub fn has_material(&self, material_id: u32) -> bool {
        self.materials.contains_key(&material_id)
    }

    /// Remove a material.
    /// 移除材质。
    ///
    /// Note: Cannot remove built-in materials (ID < 100).
    /// 注意：无法移除内置材质（ID < 100）。
    pub fn remove_material(&mut self, material_id: u32) -> bool {
        if material_id < 100 {
            log::warn!("Cannot remove built-in material: {} | 无法移除内置材质: {}", material_id, material_id);
            return false;
        }

        self.materials.remove(&material_id).is_some()
    }

    /// Update a material's uniform value.
    /// 更新材质的uniform值。
    pub fn set_material_float(&mut self, material_id: u32, name: &str, value: f32) -> bool {
        if let Some(material) = self.materials.get_mut(&material_id) {
            material.uniforms.set_float(name, value);
            true
        } else {
            false
        }
    }

    /// Update a material's vec4 uniform.
    /// 更新材质的vec4 uniform。
    pub fn set_material_vec4(&mut self, material_id: u32, name: &str, x: f32, y: f32, z: f32, w: f32) -> bool {
        if let Some(material) = self.materials.get_mut(&material_id) {
            material.uniforms.set_vec4(name, x, y, z, w);
            true
        } else {
            false
        }
    }

    /// Apply blend mode to WebGL context.
    /// 将混合模式应用到WebGL上下文。
    pub fn apply_blend_mode(gl: &WebGl2RenderingContext, blend_mode: BlendMode) {
        match blend_mode {
            BlendMode::None => {
                gl.disable(WebGl2RenderingContext::BLEND);
            }
            BlendMode::Alpha => {
                gl.enable(WebGl2RenderingContext::BLEND);
                gl.blend_func(
                    WebGl2RenderingContext::SRC_ALPHA,
                    WebGl2RenderingContext::ONE_MINUS_SRC_ALPHA,
                );
            }
            BlendMode::Additive => {
                gl.enable(WebGl2RenderingContext::BLEND);
                gl.blend_func(
                    WebGl2RenderingContext::SRC_ALPHA,
                    WebGl2RenderingContext::ONE,
                );
            }
            BlendMode::Multiply => {
                gl.enable(WebGl2RenderingContext::BLEND);
                gl.blend_func(
                    WebGl2RenderingContext::DST_COLOR,
                    WebGl2RenderingContext::ZERO,
                );
            }
            BlendMode::Screen => {
                gl.enable(WebGl2RenderingContext::BLEND);
                gl.blend_func(
                    WebGl2RenderingContext::ONE,
                    WebGl2RenderingContext::ONE_MINUS_SRC_COLOR,
                );
            }
            BlendMode::PremultipliedAlpha => {
                gl.enable(WebGl2RenderingContext::BLEND);
                gl.blend_func(
                    WebGl2RenderingContext::ONE,
                    WebGl2RenderingContext::ONE_MINUS_SRC_ALPHA,
                );
            }
        }
    }

    /// Get all material IDs.
    /// 获取所有材质ID。
    pub fn material_ids(&self) -> Vec<u32> {
        self.materials.keys().copied().collect()
    }

    /// Get material count.
    /// 获取材质数量。
    #[inline]
    pub fn material_count(&self) -> usize {
        self.materials.len()
    }
}

impl Default for MaterialManager {
    fn default() -> Self {
        Self::new()
    }
}
