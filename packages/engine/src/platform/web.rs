//! Web platform implementation.
//! Web平台实现。

use wasm_bindgen::JsCast;
use web_sys::Window;

use super::PlatformInfo;

/// Web platform utilities.
/// Web平台工具。
pub struct WebPlatform;

impl WebPlatform {
    /// Get platform information.
    /// 获取平台信息。
    pub fn get_info() -> PlatformInfo {
        let window = match web_sys::window() {
            Some(w) => w,
            None => return PlatformInfo::default(),
        };

        let navigator = window.navigator();
        let user_agent = navigator.user_agent().unwrap_or_default();

        // Detect platform name | 检测平台名称
        let name = Self::detect_platform_name(&user_agent);

        // Check WebGL2 support | 检查WebGL2支持
        let webgl2_supported = Self::check_webgl2_support(&window);

        // Check touch support | 检查触摸支持
        let touch_supported = Self::check_touch_support(&window);

        // Get device pixel ratio | 获取设备像素比
        let pixel_ratio = window.device_pixel_ratio() as f32;

        // Get screen size | 获取屏幕尺寸
        let screen = window.screen().ok();
        let (screen_width, screen_height) = screen
            .map(|s| {
                (
                    s.width().unwrap_or(0) as u32,
                    s.height().unwrap_or(0) as u32,
                )
            })
            .unwrap_or((0, 0));

        PlatformInfo {
            name,
            webgl2_supported,
            touch_supported,
            pixel_ratio,
            screen_width,
            screen_height,
        }
    }

    /// Detect platform name from user agent.
    /// 从用户代理检测平台名称。
    fn detect_platform_name(user_agent: &str) -> String {
        let ua = user_agent.to_lowercase();

        if ua.contains("micromessenger") {
            "WeChat MiniGame".to_string()
        } else if ua.contains("bytedance") || ua.contains("toutiao") {
            "ByteDance MiniGame".to_string()
        } else if ua.contains("alipay") {
            "Alipay MiniGame".to_string()
        } else if ua.contains("iphone") || ua.contains("ipad") {
            "iOS Web".to_string()
        } else if ua.contains("android") {
            "Android Web".to_string()
        } else if ua.contains("windows") {
            "Windows Web".to_string()
        } else if ua.contains("macintosh") {
            "macOS Web".to_string()
        } else {
            "Web".to_string()
        }
    }

    /// Check if WebGL2 is supported.
    /// 检查是否支持WebGL2。
    fn check_webgl2_support(window: &Window) -> bool {
        let document = match window.document() {
            Some(d) => d,
            None => return false,
        };

        let canvas = match document.create_element("canvas") {
            Ok(c) => c,
            Err(_) => return false,
        };

        let canvas = match canvas.dyn_into::<web_sys::HtmlCanvasElement>() {
            Ok(c) => c,
            Err(_) => return false,
        };

        canvas.get_context("webgl2").ok().flatten().is_some()
    }

    /// Check if touch input is supported.
    /// 检查是否支持触摸输入。
    fn check_touch_support(window: &Window) -> bool {
        // Check for touch events | 检查触摸事件
        let has_touch_event = js_sys::Reflect::has(
            window,
            &wasm_bindgen::JsValue::from_str("ontouchstart"),
        )
        .unwrap_or(false);

        if has_touch_event {
            return true;
        }

        // Check navigator.maxTouchPoints | 检查navigator.maxTouchPoints
        let navigator = window.navigator();
        navigator.max_touch_points() > 0
    }

    /// Request animation frame.
    /// 请求动画帧。
    pub fn request_animation_frame(callback: &wasm_bindgen::closure::Closure<dyn FnMut()>) -> i32 {
        let window = web_sys::window().expect("No window found");
        window
            .request_animation_frame(callback.as_ref().unchecked_ref())
            .expect("Failed to request animation frame")
    }

    /// Get current timestamp in milliseconds.
    /// 获取当前时间戳（毫秒）。
    pub fn now() -> f64 {
        let window = web_sys::window().expect("No window found");
        window
            .performance()
            .expect("No performance object")
            .now()
    }

    /// Log a message to the console.
    /// 向控制台输出消息。
    pub fn console_log(message: &str) {
        web_sys::console::log_1(&wasm_bindgen::JsValue::from_str(message));
    }
}
