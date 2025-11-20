//! Platform abstraction layer.
//! 平台抽象层。
//!
//! Provides abstractions for platform-specific functionality.
//! 提供平台特定功能的抽象。

mod web;

pub use web::WebPlatform;

/// Platform capabilities and information.
/// 平台能力和信息。
#[derive(Debug, Clone)]
pub struct PlatformInfo {
    /// Platform name.
    /// 平台名称。
    pub name: String,

    /// Whether WebGL2 is supported.
    /// 是否支持WebGL2。
    pub webgl2_supported: bool,

    /// Whether touch input is supported.
    /// 是否支持触摸输入。
    pub touch_supported: bool,

    /// Device pixel ratio.
    /// 设备像素比。
    pub pixel_ratio: f32,

    /// Screen width.
    /// 屏幕宽度。
    pub screen_width: u32,

    /// Screen height.
    /// 屏幕高度。
    pub screen_height: u32,
}

impl Default for PlatformInfo {
    fn default() -> Self {
        Self {
            name: "Unknown".to_string(),
            webgl2_supported: false,
            touch_supported: false,
            pixel_ratio: 1.0,
            screen_width: 0,
            screen_height: 0,
        }
    }
}
