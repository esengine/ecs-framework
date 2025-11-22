//! Main engine implementation.
//! 主引擎实现。

use wasm_bindgen::prelude::*;

use super::context::WebGLContext;
use super::error::Result;
use crate::input::InputManager;
use crate::renderer::{Renderer2D, GridRenderer, GizmoRenderer, TransformMode, ViewportManager};
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

    /// Viewport manager for multi-viewport rendering.
    /// 多视口渲染的视口管理器。
    viewport_manager: ViewportManager,

    /// Whether to show gizmos.
    /// 是否显示辅助工具。
    show_gizmos: bool,
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
            viewport_manager: ViewportManager::new(),
            show_gizmos: true,
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
            viewport_manager: ViewportManager::new(),
            show_gizmos: true,
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
        // Clear background with clear color
        let [r, g, b, a] = self.renderer.get_clear_color();
        self.context.clear(r, g, b, a);

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
        show_handles: bool,
    ) {
        self.gizmo_renderer.add_rect(x, y, width, height, rotation, origin_x, origin_y, r, g, b, a, show_handles);
    }

    /// Set transform tool mode.
    /// 设置变换工具模式。
    pub fn set_transform_mode(&mut self, mode: u8) {
        let transform_mode = match mode {
            1 => TransformMode::Move,
            2 => TransformMode::Rotate,
            3 => TransformMode::Scale,
            _ => TransformMode::Select,
        };
        self.gizmo_renderer.set_transform_mode(transform_mode);
    }

    /// Load a texture from URL.
    /// 从URL加载纹理。
    pub fn load_texture(&mut self, id: u32, url: &str) -> Result<()> {
        self.texture_manager.load_texture(id, url)
    }

    /// Load texture by path, returning texture ID.
    /// 按路径加载纹理，返回纹理ID。
    pub fn load_texture_by_path(&mut self, path: &str) -> Result<u32> {
        self.texture_manager.load_texture_by_path(path)
    }

    /// Get texture ID by path.
    /// 按路径获取纹理ID。
    pub fn get_texture_id_by_path(&self, path: &str) -> Option<u32> {
        self.texture_manager.get_texture_id_by_path(path)
    }

    /// Get or load texture by path.
    /// 按路径获取或加载纹理。
    pub fn get_or_load_by_path(&mut self, path: &str) -> Result<u32> {
        self.texture_manager.get_or_load_by_path(path)
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

    /// Set gizmo visibility.
    /// 设置辅助工具可见性。
    pub fn set_show_gizmos(&mut self, show: bool) {
        self.show_gizmos = show;
    }

    /// Get gizmo visibility.
    /// 获取辅助工具可见性。
    pub fn show_gizmos(&self) -> bool {
        self.show_gizmos
    }

    /// Set clear color for the active viewport.
    /// 设置活动视口的清除颜色。
    pub fn set_clear_color(&mut self, r: f32, g: f32, b: f32, a: f32) {
        if let Some(target) = self.viewport_manager.active_mut() {
            target.set_clear_color(r, g, b, a);
        } else {
            // Fallback to primary renderer
            self.renderer.set_clear_color(r, g, b, a);
        }
    }

    // ===== Multi-viewport API =====
    // ===== 多视口 API =====

    /// Register a new viewport.
    /// 注册新视口。
    pub fn register_viewport(&mut self, id: &str, canvas_id: &str) -> Result<()> {
        self.viewport_manager.register(id, canvas_id)
    }

    /// Unregister a viewport.
    /// 注销视口。
    pub fn unregister_viewport(&mut self, id: &str) {
        self.viewport_manager.unregister(id);
    }

    /// Set the active viewport.
    /// 设置活动视口。
    pub fn set_active_viewport(&mut self, id: &str) -> bool {
        self.viewport_manager.set_active(id)
    }

    /// Get active viewport ID.
    /// 获取活动视口ID。
    pub fn active_viewport_id(&self) -> Option<&str> {
        self.viewport_manager.active().map(|v| v.id.as_str())
    }

    /// Set camera for a specific viewport.
    /// 为特定视口设置相机。
    pub fn set_viewport_camera(&mut self, viewport_id: &str, x: f32, y: f32, zoom: f32, rotation: f32) {
        if let Some(viewport) = self.viewport_manager.get_mut(viewport_id) {
            viewport.set_camera(x, y, zoom, rotation);
        }
    }

    /// Get camera for a specific viewport.
    /// 获取特定视口的相机。
    pub fn get_viewport_camera(&self, viewport_id: &str) -> Option<(f32, f32, f32, f32)> {
        self.viewport_manager.get(viewport_id).map(|v| v.get_camera())
    }

    /// Set viewport configuration.
    /// 设置视口配置。
    pub fn set_viewport_config(&mut self, viewport_id: &str, show_grid: bool, show_gizmos: bool) {
        if let Some(viewport) = self.viewport_manager.get_mut(viewport_id) {
            viewport.config.show_grid = show_grid;
            viewport.config.show_gizmos = show_gizmos;
        }
    }

    /// Resize a specific viewport.
    /// 调整特定视口大小。
    pub fn resize_viewport(&mut self, viewport_id: &str, width: u32, height: u32) {
        if let Some(viewport) = self.viewport_manager.get_mut(viewport_id) {
            viewport.resize(width, height);
        }
    }

    /// Render to a specific viewport.
    /// 渲染到特定视口。
    pub fn render_to_viewport(&mut self, viewport_id: &str) -> Result<()> {
        let viewport = match self.viewport_manager.get(viewport_id) {
            Some(v) => v,
            None => return Ok(()),
        };

        // Get viewport settings
        let show_grid = viewport.config.show_grid;
        let show_gizmos = viewport.config.show_gizmos;
        let camera = viewport.camera.clone();

        // Bind viewport and clear
        viewport.bind();
        viewport.clear();

        // Update renderer camera to match viewport camera
        let renderer_camera = self.renderer.camera_mut();
        renderer_camera.position = camera.position;
        renderer_camera.set_zoom(camera.zoom);
        renderer_camera.rotation = camera.rotation;
        renderer_camera.set_viewport(camera.viewport_width(), camera.viewport_height());

        // Render grid if enabled
        if show_grid {
            self.grid_renderer.render(viewport.gl(), &camera);
            self.grid_renderer.render_axes(viewport.gl(), &camera);
        }

        // Render sprites
        self.renderer.render(viewport.gl(), &self.texture_manager)?;

        // Render gizmos if enabled
        if show_gizmos {
            self.gizmo_renderer.render(viewport.gl(), &camera);
        }
        self.gizmo_renderer.clear();

        Ok(())
    }

    /// Get all registered viewport IDs.
    /// 获取所有已注册的视口ID。
    pub fn viewport_ids(&self) -> Vec<String> {
        self.viewport_manager.viewport_ids().into_iter().cloned().collect()
    }
}
