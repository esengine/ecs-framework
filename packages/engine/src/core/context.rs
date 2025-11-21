//! WebGL context management.
//! WebGL上下文管理。

use web_sys::{HtmlCanvasElement, WebGl2RenderingContext};
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;

use super::error::{EngineError, Result};

/// WebGL2 rendering context wrapper.
/// WebGL2渲染上下文包装器。
///
/// Manages the WebGL2 context and provides helper methods for common operations.
/// 管理WebGL2上下文并提供常用操作的辅助方法。
pub struct WebGLContext {
    /// The WebGL2 rendering context.
    /// WebGL2渲染上下文。
    gl: WebGl2RenderingContext,

    /// The canvas element.
    /// Canvas元素。
    canvas: HtmlCanvasElement,
}

impl WebGLContext {
    /// Create a new WebGL context from a canvas ID.
    /// 从canvas ID创建新的WebGL上下文。
    ///
    /// # Arguments | 参数
    /// * `canvas_id` - The ID of the canvas element | canvas元素的ID
    ///
    /// # Returns | 返回
    /// A new WebGLContext or an error | 新的WebGLContext或错误
    pub fn new(canvas_id: &str) -> Result<Self> {
        // Get document and canvas | 获取document和canvas
        let window = web_sys::window().expect("No window found | 未找到window");
        let document = window.document().expect("No document found | 未找到document");

        let canvas = document
            .get_element_by_id(canvas_id)
            .ok_or_else(|| EngineError::CanvasNotFound(canvas_id.to_string()))?
            .dyn_into::<HtmlCanvasElement>()
            .map_err(|_| EngineError::CanvasNotFound(canvas_id.to_string()))?;

        // Create WebGL2 context | 创建WebGL2上下文
        let gl = canvas
            .get_context("webgl2")
            .map_err(|_| EngineError::ContextCreationFailed)?
            .ok_or(EngineError::ContextCreationFailed)?
            .dyn_into::<WebGl2RenderingContext>()
            .map_err(|_| EngineError::ContextCreationFailed)?;

        log::info!(
            "WebGL2 context created | WebGL2上下文已创建: {}x{}",
            canvas.width(),
            canvas.height()
        );

        Ok(Self { gl, canvas })
    }

    /// Create a new WebGL context from external JavaScript objects.
    /// 从外部 JavaScript 对象创建 WebGL 上下文。
    ///
    /// This method is designed for environments like WeChat MiniGame
    /// where the canvas is not a standard HTML element.
    /// 此方法适用于微信小游戏等环境，其中 canvas 不是标准 HTML 元素。
    pub fn from_external(
        gl_context: JsValue,
        canvas_width: u32,
        canvas_height: u32,
    ) -> Result<Self> {
        // Convert JsValue to WebGl2RenderingContext
        let gl = gl_context
            .dyn_into::<WebGl2RenderingContext>()
            .map_err(|_| EngineError::ContextCreationFailed)?;

        // Create a dummy canvas for compatibility
        // In MiniGame environment, we don't have HtmlCanvasElement
        let window = web_sys::window().ok_or(EngineError::ContextCreationFailed)?;
        let document = window.document().ok_or(EngineError::ContextCreationFailed)?;
        let canvas = document
            .create_element("canvas")
            .map_err(|_| EngineError::ContextCreationFailed)?
            .dyn_into::<HtmlCanvasElement>()
            .map_err(|_| EngineError::ContextCreationFailed)?;

        canvas.set_width(canvas_width);
        canvas.set_height(canvas_height);

        log::info!(
            "WebGL2 context created from external | 从外部创建WebGL2上下文: {}x{}",
            canvas_width,
            canvas_height
        );

        Ok(Self { gl, canvas })
    }

    /// Get a reference to the WebGL2 context.
    /// 获取WebGL2上下文的引用。
    #[inline]
    pub fn gl(&self) -> &WebGl2RenderingContext {
        &self.gl
    }

    /// Get a reference to the canvas element.
    /// 获取canvas元素的引用。
    #[inline]
    pub fn canvas(&self) -> &HtmlCanvasElement {
        &self.canvas
    }

    /// Get canvas width.
    /// 获取canvas宽度。
    #[inline]
    pub fn width(&self) -> u32 {
        self.canvas.width()
    }

    /// Get canvas height.
    /// 获取canvas高度。
    #[inline]
    pub fn height(&self) -> u32 {
        self.canvas.height()
    }

    /// Clear the canvas with specified color.
    /// 使用指定颜色清除canvas。
    pub fn clear(&self, r: f32, g: f32, b: f32, a: f32) {
        self.gl.clear_color(r, g, b, a);
        self.gl.clear(
            WebGl2RenderingContext::COLOR_BUFFER_BIT | WebGl2RenderingContext::DEPTH_BUFFER_BIT,
        );
    }

    /// Set the viewport to match canvas size.
    /// 设置视口以匹配canvas大小。
    pub fn set_viewport(&self) {
        self.gl
            .viewport(0, 0, self.width() as i32, self.height() as i32);
    }

    /// Resize the canvas and viewport.
    /// 调整canvas和视口大小。
    pub fn resize(&mut self, width: u32, height: u32) {
        self.canvas.set_width(width);
        self.canvas.set_height(height);
        self.gl.viewport(0, 0, width as i32, height as i32);
    }

    /// Enable alpha blending for transparency.
    /// 启用透明度的alpha混合。
    pub fn enable_blend(&self) {
        self.gl.enable(WebGl2RenderingContext::BLEND);
        self.gl.blend_func(
            WebGl2RenderingContext::SRC_ALPHA,
            WebGl2RenderingContext::ONE_MINUS_SRC_ALPHA,
        );
    }
}
