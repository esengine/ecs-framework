//! Viewport and RenderTarget management for multi-view rendering.
//! 多视图渲染的视口和渲染目标管理。

use std::collections::HashMap;
use web_sys::{HtmlCanvasElement, WebGl2RenderingContext};
use wasm_bindgen::JsCast;

use super::camera::Camera2D;
use crate::core::error::{EngineError, Result};

/// Viewport configuration and settings.
/// 视口配置和设置。
#[derive(Debug, Clone)]
pub struct ViewportConfig {
    /// Whether to show grid overlay.
    pub show_grid: bool,
    /// Whether to show gizmos.
    pub show_gizmos: bool,
    /// Clear color (RGBA).
    pub clear_color: [f32; 4],
}

impl Default for ViewportConfig {
    fn default() -> Self {
        Self {
            show_grid: true,
            show_gizmos: true,
            clear_color: [0.1, 0.1, 0.12, 1.0],
        }
    }
}

/// A render target representing a viewport.
/// 表示视口的渲染目标。
pub struct RenderTarget {
    /// Unique identifier for this viewport.
    pub id: String,
    /// The canvas element this viewport renders to.
    canvas: HtmlCanvasElement,
    /// WebGL context for this canvas.
    gl: WebGl2RenderingContext,
    /// Camera for this viewport.
    pub camera: Camera2D,
    /// Viewport configuration.
    pub config: ViewportConfig,
    /// Width in pixels.
    width: u32,
    /// Height in pixels.
    height: u32,
}

impl RenderTarget {
    /// Create a new render target from a canvas ID.
    pub fn new(id: &str, canvas_id: &str) -> Result<Self> {
        let window = web_sys::window().expect("No window found");
        let document = window.document().expect("No document found");

        let canvas = document
            .get_element_by_id(canvas_id)
            .ok_or_else(|| EngineError::CanvasNotFound(canvas_id.to_string()))?
            .dyn_into::<HtmlCanvasElement>()
            .map_err(|_| EngineError::CanvasNotFound(canvas_id.to_string()))?;

        let gl = canvas
            .get_context("webgl2")
            .map_err(|_| EngineError::ContextCreationFailed)?
            .ok_or(EngineError::ContextCreationFailed)?
            .dyn_into::<WebGl2RenderingContext>()
            .map_err(|_| EngineError::ContextCreationFailed)?;

        let width = canvas.width();
        let height = canvas.height();
        let camera = Camera2D::new(width as f32, height as f32);

        log::info!(
            "RenderTarget created: {} ({}x{})",
            id, width, height
        );

        Ok(Self {
            id: id.to_string(),
            canvas,
            gl,
            camera,
            config: ViewportConfig::default(),
            width,
            height,
        })
    }

    /// Get the WebGL context.
    #[inline]
    pub fn gl(&self) -> &WebGl2RenderingContext {
        &self.gl
    }

    /// Get canvas reference.
    #[inline]
    pub fn canvas(&self) -> &HtmlCanvasElement {
        &self.canvas
    }

    /// Get viewport dimensions.
    #[inline]
    pub fn dimensions(&self) -> (u32, u32) {
        (self.width, self.height)
    }

    /// Resize the viewport.
    pub fn resize(&mut self, width: u32, height: u32) {
        self.width = width;
        self.height = height;
        self.canvas.set_width(width);
        self.canvas.set_height(height);
        self.gl.viewport(0, 0, width as i32, height as i32);
        self.camera.set_viewport(width as f32, height as f32);
    }

    /// Clear the viewport with configured color.
    pub fn clear(&self) {
        let [r, g, b, a] = self.config.clear_color;
        self.gl.clear_color(r, g, b, a);
        self.gl.clear(
            WebGl2RenderingContext::COLOR_BUFFER_BIT | WebGl2RenderingContext::DEPTH_BUFFER_BIT,
        );
    }

    /// Make this render target current (bind its context).
    pub fn bind(&self) {
        self.gl.viewport(0, 0, self.width as i32, self.height as i32);
    }

    /// Set camera parameters.
    pub fn set_camera(&mut self, x: f32, y: f32, zoom: f32, rotation: f32) {
        self.camera.position.x = x;
        self.camera.position.y = y;
        self.camera.set_zoom(zoom);
        self.camera.rotation = rotation;
    }

    /// Get camera parameters.
    pub fn get_camera(&self) -> (f32, f32, f32, f32) {
        (
            self.camera.position.x,
            self.camera.position.y,
            self.camera.zoom,
            self.camera.rotation,
        )
    }

    /// Set clear color (RGBA, each component 0.0-1.0).
    pub fn set_clear_color(&mut self, r: f32, g: f32, b: f32, a: f32) {
        self.config.clear_color = [r, g, b, a];
    }

    /// Get clear color.
    pub fn get_clear_color(&self) -> [f32; 4] {
        self.config.clear_color
    }
}

/// Manages multiple viewports for the engine.
/// 管理引擎的多个视口。
pub struct ViewportManager {
    /// All registered viewports.
    viewports: HashMap<String, RenderTarget>,
    /// Currently active viewport ID.
    active_viewport: Option<String>,
}

impl ViewportManager {
    /// Create a new viewport manager.
    pub fn new() -> Self {
        Self {
            viewports: HashMap::new(),
            active_viewport: None,
        }
    }

    /// Register a new viewport.
    pub fn register(&mut self, id: &str, canvas_id: &str) -> Result<()> {
        if self.viewports.contains_key(id) {
            log::warn!("Viewport already registered: {}", id);
            return Ok(());
        }

        let target = RenderTarget::new(id, canvas_id)?;
        self.viewports.insert(id.to_string(), target);

        // Set as active if it's the first viewport
        if self.active_viewport.is_none() {
            self.active_viewport = Some(id.to_string());
        }

        Ok(())
    }

    /// Unregister a viewport.
    pub fn unregister(&mut self, id: &str) {
        self.viewports.remove(id);
        if self.active_viewport.as_deref() == Some(id) {
            self.active_viewport = self.viewports.keys().next().cloned();
        }
    }

    /// Set the active viewport.
    pub fn set_active(&mut self, id: &str) -> bool {
        if self.viewports.contains_key(id) {
            self.active_viewport = Some(id.to_string());
            true
        } else {
            false
        }
    }

    /// Get the active viewport.
    pub fn active(&self) -> Option<&RenderTarget> {
        self.active_viewport
            .as_ref()
            .and_then(|id| self.viewports.get(id))
    }

    /// Get mutable active viewport.
    pub fn active_mut(&mut self) -> Option<&mut RenderTarget> {
        let id = self.active_viewport.clone()?;
        self.viewports.get_mut(&id)
    }

    /// Get a viewport by ID.
    pub fn get(&self, id: &str) -> Option<&RenderTarget> {
        self.viewports.get(id)
    }

    /// Get mutable viewport by ID.
    pub fn get_mut(&mut self, id: &str) -> Option<&mut RenderTarget> {
        self.viewports.get_mut(id)
    }

    /// Get all viewport IDs.
    pub fn viewport_ids(&self) -> Vec<&String> {
        self.viewports.keys().collect()
    }

    /// Iterate over all viewports.
    pub fn iter(&self) -> impl Iterator<Item = (&String, &RenderTarget)> {
        self.viewports.iter()
    }

    /// Iterate over all viewports mutably.
    pub fn iter_mut(&mut self) -> impl Iterator<Item = (&String, &mut RenderTarget)> {
        self.viewports.iter_mut()
    }
}

impl Default for ViewportManager {
    fn default() -> Self {
        Self::new()
    }
}
