//! ES Engine - High-performance 2D game engine for web and mobile platforms.
//! ES引擎 - 高性能2D游戏引擎，支持Web和移动平台。
//!
//! # Architecture | 架构
//!
//! The engine is designed with a modular architecture:
//! 引擎采用模块化架构设计：
//!
//! - `core` - Engine lifecycle and context management | 引擎生命周期和上下文管理
//! - `renderer` - 2D rendering with batch optimization | 2D渲染与批处理优化
//! - `math` - Mathematical primitives (vectors, matrices) | 数学基元（向量、矩阵）
//! - `resource` - Asset loading and management | 资源加载和管理
//! - `input` - Keyboard, mouse, and touch input | 键盘、鼠标和触摸输入
//! - `platform` - Platform abstraction layer | 平台抽象层
//!
//! # Example | 示例
//!
//! ```typescript
//! import { GameEngine } from 'es-engine';
//!
//! const engine = new GameEngine('canvas');
//! engine.loadTexture('player', 'assets/player.png');
//!
//! function gameLoop() {
//!     engine.clear(0.0, 0.0, 0.0, 1.0);
//!     engine.submitSpriteBatch(transforms, textureIds, uvs, colors);
//!     engine.render();
//!     requestAnimationFrame(gameLoop);
//! }
//! ```

#![warn(missing_docs)]
#![warn(rustdoc::missing_crate_level_docs)]

use wasm_bindgen::prelude::*;

// Module declarations | 模块声明
pub mod core;
pub mod math;
pub mod platform;
pub mod renderer;
pub mod resource;
pub mod input;

// Re-exports | 重新导出
pub use crate::core::{Engine, EngineConfig};
pub use crate::core::error::{EngineError, Result};

/// Initialize panic hook for better error messages in console.
/// 初始化panic hook以在控制台显示更好的错误信息。
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    // Initialize logger | 初始化日志
    console_log::init_with_level(log::Level::Debug)
        .expect("Failed to initialize logger | 日志初始化失败");

    log::info!("ES Engine initialized | ES引擎初始化完成");
}

/// Game engine main interface exposed to JavaScript.
/// 暴露给JavaScript的游戏引擎主接口。
///
/// This is the primary entry point for the engine from TypeScript/JavaScript.
/// 这是从TypeScript/JavaScript访问引擎的主要入口点。
#[wasm_bindgen]
pub struct GameEngine {
    engine: Engine,
}

#[wasm_bindgen]
impl GameEngine {
    /// Create a new game engine instance.
    /// 创建新的游戏引擎实例。
    ///
    /// # Arguments | 参数
    /// * `canvas_id` - The HTML canvas element ID | HTML canvas元素ID
    ///
    /// # Returns | 返回
    /// A new GameEngine instance or an error | 新的GameEngine实例或错误
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_id: &str) -> std::result::Result<GameEngine, JsValue> {
        let config = EngineConfig::default();
        let engine = Engine::new(canvas_id, config)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(GameEngine { engine })
    }

    /// Create a new game engine from external WebGL context.
    /// 从外部 WebGL 上下文创建引擎。
    ///
    /// This is designed for WeChat MiniGame and similar environments.
    /// 适用于微信小游戏等环境。
    #[wasm_bindgen(js_name = fromExternal)]
    pub fn from_external(
        gl_context: JsValue,
        width: u32,
        height: u32,
    ) -> std::result::Result<GameEngine, JsValue> {
        let config = EngineConfig::default();
        let engine = Engine::from_external(gl_context, width, height, config)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(GameEngine { engine })
    }

    /// Clear the screen with specified color.
    /// 使用指定颜色清除屏幕。
    ///
    /// # Arguments | 参数
    /// * `r` - Red component (0.0-1.0) | 红色分量
    /// * `g` - Green component (0.0-1.0) | 绿色分量
    /// * `b` - Blue component (0.0-1.0) | 蓝色分量
    /// * `a` - Alpha component (0.0-1.0) | 透明度分量
    pub fn clear(&self, r: f32, g: f32, b: f32, a: f32) {
        self.engine.clear(r, g, b, a);
    }

    /// Get canvas width.
    /// 获取画布宽度。
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        self.engine.width()
    }

    /// Get canvas height.
    /// 获取画布高度。
    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.engine.height()
    }

    /// Submit sprite batch data for rendering.
    /// 提交精灵批次数据进行渲染。
    ///
    /// # Arguments | 参数
    /// * `transforms` - Float32Array [x, y, rotation, scaleX, scaleY, originX, originY] per sprite
    ///                  每个精灵的变换数据
    /// * `texture_ids` - Uint32Array of texture IDs | 纹理ID数组
    /// * `uvs` - Float32Array [u0, v0, u1, v1] per sprite | 每个精灵的UV坐标
    /// * `colors` - Uint32Array of packed RGBA colors | 打包的RGBA颜色数组
    #[wasm_bindgen(js_name = submitSpriteBatch)]
    pub fn submit_sprite_batch(
        &mut self,
        transforms: &[f32],
        texture_ids: &[u32],
        uvs: &[f32],
        colors: &[u32],
    ) -> std::result::Result<(), JsValue> {
        self.engine
            .submit_sprite_batch(transforms, texture_ids, uvs, colors)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Render the current frame.
    /// 渲染当前帧。
    pub fn render(&mut self) -> std::result::Result<(), JsValue> {
        self.engine
            .render()
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Load a texture from URL.
    /// 从URL加载纹理。
    ///
    /// # Arguments | 参数
    /// * `id` - Unique texture identifier | 唯一纹理标识符
    /// * `url` - Image URL to load | 要加载的图片URL
    #[wasm_bindgen(js_name = loadTexture)]
    pub fn load_texture(&mut self, id: u32, url: &str) -> std::result::Result<(), JsValue> {
        self.engine
            .load_texture(id, url)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Load texture by path, returning texture ID.
    /// 按路径加载纹理，返回纹理ID。
    ///
    /// # Arguments | 参数
    /// * `path` - Image path/URL to load | 要加载的图片路径/URL
    #[wasm_bindgen(js_name = loadTextureByPath)]
    pub fn load_texture_by_path(&mut self, path: &str) -> std::result::Result<u32, JsValue> {
        self.engine
            .load_texture_by_path(path)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Get texture ID by path.
    /// 按路径获取纹理ID。
    ///
    /// # Arguments | 参数
    /// * `path` - Image path to lookup | 要查找的图片路径
    #[wasm_bindgen(js_name = getTextureIdByPath)]
    pub fn get_texture_id_by_path(&self, path: &str) -> Option<u32> {
        self.engine.get_texture_id_by_path(path)
    }

    /// Get or load texture by path.
    /// 按路径获取或加载纹理。
    ///
    /// # Arguments | 参数
    /// * `path` - Image path/URL | 图片路径/URL
    #[wasm_bindgen(js_name = getOrLoadTextureByPath)]
    pub fn get_or_load_by_path(&mut self, path: &str) -> std::result::Result<u32, JsValue> {
        self.engine
            .get_or_load_by_path(path)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Check if a key is currently pressed.
    /// 检查某个键是否当前被按下。
    ///
    /// # Arguments | 参数
    /// * `key_code` - The key code to check | 要检查的键码
    #[wasm_bindgen(js_name = isKeyDown)]
    pub fn is_key_down(&self, key_code: &str) -> bool {
        self.engine.is_key_down(key_code)
    }

    /// Update input state. Should be called once per frame.
    /// 更新输入状态。应该每帧调用一次。
    #[wasm_bindgen(js_name = updateInput)]
    pub fn update_input(&mut self) {
        self.engine.update_input();
    }

    /// Resize viewport.
    /// 调整视口大小。
    ///
    /// # Arguments | 参数
    /// * `width` - New viewport width | 新视口宽度
    /// * `height` - New viewport height | 新视口高度
    pub fn resize(&mut self, width: u32, height: u32) {
        self.engine.resize(width as f32, height as f32);
    }

    /// Set camera position, zoom, and rotation.
    /// 设置相机位置、缩放和旋转。
    ///
    /// # Arguments | 参数
    /// * `x` - Camera X position | 相机X位置
    /// * `y` - Camera Y position | 相机Y位置
    /// * `zoom` - Zoom level | 缩放级别
    /// * `rotation` - Rotation in radians | 旋转角度（弧度）
    #[wasm_bindgen(js_name = setCamera)]
    pub fn set_camera(&mut self, x: f32, y: f32, zoom: f32, rotation: f32) {
        self.engine.set_camera(x, y, zoom, rotation);
    }

    /// Get camera state.
    /// 获取相机状态。
    ///
    /// # Returns | 返回
    /// Array of [x, y, zoom, rotation] | 数组 [x, y, zoom, rotation]
    #[wasm_bindgen(js_name = getCamera)]
    pub fn get_camera(&self) -> Vec<f32> {
        let (x, y, zoom, rotation) = self.engine.get_camera();
        vec![x, y, zoom, rotation]
    }

    /// Set grid visibility.
    /// 设置网格可见性。
    #[wasm_bindgen(js_name = setShowGrid)]
    pub fn set_show_grid(&mut self, show: bool) {
        self.engine.set_show_grid(show);
    }

    /// Set clear color (background color).
    /// 设置清除颜色（背景颜色）。
    ///
    /// # Arguments | 参数
    /// * `r`, `g`, `b`, `a` - Color components (0.0-1.0) | 颜色分量 (0.0-1.0)
    #[wasm_bindgen(js_name = setClearColor)]
    pub fn set_clear_color(&mut self, r: f32, g: f32, b: f32, a: f32) {
        self.engine.set_clear_color(r, g, b, a);
    }

    /// Add a rectangle gizmo outline.
    /// 添加矩形Gizmo边框。
    ///
    /// # Arguments | 参数
    /// * `x` - Center X position | 中心X位置
    /// * `y` - Center Y position | 中心Y位置
    /// * `width` - Rectangle width | 矩形宽度
    /// * `height` - Rectangle height | 矩形高度
    /// * `rotation` - Rotation in radians | 旋转角度（弧度）
    /// * `origin_x` - Origin X (0-1) | 原点X (0-1)
    /// * `origin_y` - Origin Y (0-1) | 原点Y (0-1)
    /// * `r`, `g`, `b`, `a` - Color (0.0-1.0) | 颜色
    /// * `show_handles` - Whether to show transform handles | 是否显示变换手柄
    #[wasm_bindgen(js_name = addGizmoRect)]
    pub fn add_gizmo_rect(
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
        self.engine.add_gizmo_rect(x, y, width, height, rotation, origin_x, origin_y, r, g, b, a, show_handles);
    }

    /// Set transform tool mode.
    /// 设置变换工具模式。
    ///
    /// # Arguments | 参数
    /// * `mode` - 0=Select, 1=Move, 2=Rotate, 3=Scale
    #[wasm_bindgen(js_name = setTransformMode)]
    pub fn set_transform_mode(&mut self, mode: u8) {
        self.engine.set_transform_mode(mode);
    }

    /// Set gizmo visibility.
    /// 设置辅助工具可见性。
    #[wasm_bindgen(js_name = setShowGizmos)]
    pub fn set_show_gizmos(&mut self, show: bool) {
        self.engine.set_show_gizmos(show);
    }

    // ===== Multi-viewport API =====
    // ===== 多视口 API =====

    /// Register a new viewport.
    /// 注册新视口。
    ///
    /// # Arguments | 参数
    /// * `id` - Unique viewport identifier | 唯一视口标识符
    /// * `canvas_id` - HTML canvas element ID | HTML canvas元素ID
    #[wasm_bindgen(js_name = registerViewport)]
    pub fn register_viewport(&mut self, id: &str, canvas_id: &str) -> std::result::Result<(), JsValue> {
        self.engine
            .register_viewport(id, canvas_id)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Unregister a viewport.
    /// 注销视口。
    #[wasm_bindgen(js_name = unregisterViewport)]
    pub fn unregister_viewport(&mut self, id: &str) {
        self.engine.unregister_viewport(id);
    }

    /// Set the active viewport.
    /// 设置活动视口。
    #[wasm_bindgen(js_name = setActiveViewport)]
    pub fn set_active_viewport(&mut self, id: &str) -> bool {
        self.engine.set_active_viewport(id)
    }

    /// Set camera for a specific viewport.
    /// 为特定视口设置相机。
    #[wasm_bindgen(js_name = setViewportCamera)]
    pub fn set_viewport_camera(&mut self, viewport_id: &str, x: f32, y: f32, zoom: f32, rotation: f32) {
        self.engine.set_viewport_camera(viewport_id, x, y, zoom, rotation);
    }

    /// Get camera for a specific viewport.
    /// 获取特定视口的相机。
    #[wasm_bindgen(js_name = getViewportCamera)]
    pub fn get_viewport_camera(&self, viewport_id: &str) -> Option<Vec<f32>> {
        self.engine
            .get_viewport_camera(viewport_id)
            .map(|(x, y, zoom, rotation)| vec![x, y, zoom, rotation])
    }

    /// Set viewport configuration.
    /// 设置视口配置。
    #[wasm_bindgen(js_name = setViewportConfig)]
    pub fn set_viewport_config(&mut self, viewport_id: &str, show_grid: bool, show_gizmos: bool) {
        self.engine.set_viewport_config(viewport_id, show_grid, show_gizmos);
    }

    /// Resize a specific viewport.
    /// 调整特定视口大小。
    #[wasm_bindgen(js_name = resizeViewport)]
    pub fn resize_viewport(&mut self, viewport_id: &str, width: u32, height: u32) {
        self.engine.resize_viewport(viewport_id, width, height);
    }

    /// Render to a specific viewport.
    /// 渲染到特定视口。
    #[wasm_bindgen(js_name = renderToViewport)]
    pub fn render_to_viewport(&mut self, viewport_id: &str) -> std::result::Result<(), JsValue> {
        self.engine
            .render_to_viewport(viewport_id)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Get all registered viewport IDs.
    /// 获取所有已注册的视口ID。
    #[wasm_bindgen(js_name = getViewportIds)]
    pub fn get_viewport_ids(&self) -> Vec<String> {
        self.engine.viewport_ids()
    }
}
