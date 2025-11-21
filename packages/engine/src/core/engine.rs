//! Main engine implementation.
//! 主引擎实现。

use wasm_bindgen::prelude::*;

use super::context::WebGLContext;
use super::error::Result;
use crate::input::InputManager;
use crate::renderer::{Renderer2D, GridRenderer, GizmoRenderer};
use crate::resource::TextureManager;

/// Engine configuration options.
/// 引擎配置选项。
#[derive(Debug, Clone)]
pub struct EngineConfig {
    /// Maximum sprites per batch.
    /// 每批次最大精灵数。
    pub max_sprites: usize,

    /// Enable debug mode.
    /// 启用调试模式。
    pub debug: bool,
}

impl Default for EngineConfig {
    fn default() -> Self {
        Self {
            max_sprites: 10000,
            debug: false,
        }
    }
}

/// Main game engine.
/// 主游戏引擎。
///
/// Coordinates all engine subsystems including rendering, input, and resources.
/// 协调所有引擎子系统，包括渲染、输入和资源。
pub struct Engine {
    /// WebGL context.
    /// WebGL上下文。
    context: WebGLContext,

    /// 2D renderer.
    /// 2D渲染器。
    renderer: Renderer2D,

    /// Grid renderer for editor.
    /// 编辑器网格渲染器。
    grid_renderer: GridRenderer,

    /// Gizmo renderer for editor overlays.
    /// 编辑器叠加层Gizmo渲染器。
    gizmo_renderer: GizmoRenderer,

    /// Texture manager.
    /// 纹理管理器。
    texture_manager: TextureManager,

    /// Input manager.
    /// 输入管理器。
    input_manager: InputManager,

    /// Engine configuration.
    /// 引擎配置。
    #[allow(dead_code)]
    config: EngineConfig,

    /// Whether to show grid.
    /// 是否显示网格。
    show_grid: bool,
}

impl Engine {
    /// Create a new engine instance.
    /// 创建新的引擎实例。
    ///
    /// # Arguments | 参数
    /// * `canvas_id` - The HTML canvas element ID | HTML canvas元素ID
    /// * `config` - Engine configuration | 引擎配置
    ///
    /// # Returns | 返回
    /// A new Engine instance or an error | 新的Engine实例或错误
    pub fn new(canvas_id: &str, config: EngineConfig) -> Result<Self> {
        let context = WebGLContext::new(canvas_id)?;

        // Initialize WebGL state | 初始化WebGL状态
        context.set_viewport();
        context.enable_blend();

        // Create subsystems | 创建子系统
        let renderer = Renderer2D::new(context.gl(), config.max_sprites)?;
        let grid_renderer = GridRenderer::new(context.gl())?;
        let gizmo_renderer = GizmoRenderer::new(context.gl())?;
        let texture_manager = TextureManager::new(context.gl().clone());
        let input_manager = InputManager::new();

        log::info!("Engine created successfully | 引擎创建成功");

        Ok(Self {
            context,
            renderer,
            grid_renderer,
            gizmo_renderer,
            texture_manager,
            input_manager,
            config,
            show_grid: true,
        })
    }

    /// Create a new engine instance from external WebGL context.
    /// 从外部 WebGL 上下文创建引擎实例。
    ///
    /// This is designed for environments like WeChat MiniGame.
    /// 适用于微信小游戏等环境。
    pub fn from_external(
        gl_context: JsValue,
        width: u32,
        height: u32,
        config: EngineConfig,
    ) -> Result<Self> {
        let context = WebGLContext::from_external(gl_context, width, height)?;

        context.set_viewport();
        context.enable_blend();

        let renderer = Renderer2D::new(context.gl(), config.max_sprites)?;
        let grid_renderer = GridRenderer::new(context.gl())?;
        let gizmo_renderer = GizmoRenderer::new(context.gl())?;
        let texture_manager = TextureManager::new(context.gl().clone());
        let input_manager = InputManager::new();

        log::info!("Engine created from external context | 从外部上下文创建引擎");

        Ok(Self {
            context,
            renderer,
            grid_renderer,
            gizmo_renderer,
            texture_manager,
            input_manager,
            config,
            show_grid: true,
        })
    }

    /// Clear the screen with specified color.
    /// 使用指定颜色清除屏幕。
    pub fn clear(&self, r: f32, g: f32, b: f32, a: f32) {
        self.context.clear(r, g, b, a);
    }

    /// Get canvas width.
    /// 获取画布宽度。
    #[inline]
    pub fn width(&self) -> u32 {
        self.context.width()
    }

    /// Get canvas height.
    /// 获取画布高度。
    #[inline]
    pub fn height(&self) -> u32 {
        self.context.height()
    }

    /// Submit sprite batch data for rendering.
    /// 提交精灵批次数据进行渲染。
    pub fn submit_sprite_batch(
        &mut self,
        transforms: &[f32],
        texture_ids: &[u32],
        uvs: &[f32],
        colors: &[u32],
    ) -> Result<()> {
        // Debug: log once
        use std::sync::atomic::{AtomicBool, Ordering};
        static LOGGED: AtomicBool = AtomicBool::new(false);
        if !LOGGED.swap(true, Ordering::Relaxed) {
            let sprite_count = texture_ids.len();
            log::info!("Engine submit_sprite_batch: {} sprites, texture_ids: {:?}", sprite_count, texture_ids);
        }

        self.renderer.submit_batch(
            transforms,
            texture_ids,
            uvs,
            colors,
            &self.texture_manager,
        )
    }

    /// Render the current frame.
    /// 渲染当前帧。
    pub fn render(&mut self) -> Result<()> {
        // Render grid first (background)
        if self.show_grid {
            self.grid_renderer.render(self.context.gl(), self.renderer.camera());
            self.grid_renderer.render_axes(self.context.gl(), self.renderer.camera());
        }

        // Render sprites
        self.renderer.render(self.context.gl(), &self.texture_manager)?;

        // Render gizmos on top
        self.gizmo_renderer.render(self.context.gl(), self.renderer.camera());
        self.gizmo_renderer.clear();

        Ok(())
    }

    /// Add a rectangle gizmo.
    /// 添加矩形Gizmo。
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
    ) {
        self.gizmo_renderer.add_rect(x, y, width, height, rotation, origin_x, origin_y, r, g, b, a);
    }

    /// Load a texture from URL.
    /// 从URL加载纹理。
    pub fn load_texture(&mut self, id: u32, url: &str) -> Result<()> {
        self.texture_manager.load_texture(id, url)
    }

    /// Check if a key is currently pressed.
    /// 检查某个键是否当前被按下。
    pub fn is_key_down(&self, key_code: &str) -> bool {
        self.input_manager.is_key_down(key_code)
    }

    /// Update input state.
    /// 更新输入状态。
    pub fn update_input(&mut self) {
        self.input_manager.update();
    }

    /// Resize viewport.
    /// 调整视口大小。
    pub fn resize(&mut self, width: f32, height: f32) {
        self.context.resize(width as u32, height as u32);
        self.renderer.resize(width, height);
    }

    /// Set camera position, zoom, and rotation.
    /// 设置相机位置、缩放和旋转。
    ///
    /// # Arguments | 参数
    /// * `x` - Camera X position | 相机X位置
    /// * `y` - Camera Y position | 相机Y位置
    /// * `zoom` - Zoom level | 缩放级别
    /// * `rotation` - Rotation in radians | 旋转角度（弧度）
    pub fn set_camera(&mut self, x: f32, y: f32, zoom: f32, rotation: f32) {
        let camera = self.renderer.camera_mut();
        camera.position.x = x;
        camera.position.y = y;
        camera.set_zoom(zoom);
        camera.rotation = rotation;
    }

    /// Get camera position.
    /// 获取相机位置。
    pub fn get_camera(&self) -> (f32, f32, f32, f32) {
        let camera = self.renderer.camera();
        (camera.position.x, camera.position.y, camera.zoom, camera.rotation)
    }

    /// Set grid visibility.
    /// 设置网格可见性。
    pub fn set_show_grid(&mut self, show: bool) {
        self.show_grid = show;
    }
}
