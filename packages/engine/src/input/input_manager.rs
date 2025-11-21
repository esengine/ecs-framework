//! Unified input manager.
//! 统一输入管理器。

use super::{KeyboardState, MouseState, TouchState};

/// Unified input manager handling keyboard, mouse, and touch.
/// 处理键盘、鼠标和触摸的统一输入管理器。
///
/// Provides a single interface for all input types.
/// 为所有输入类型提供单一接口。
#[derive(Debug, Default)]
pub struct InputManager {
    /// Keyboard state.
    /// 键盘状态。
    pub keyboard: KeyboardState,

    /// Mouse state.
    /// 鼠标状态。
    pub mouse: MouseState,

    /// Touch state.
    /// 触摸状态。
    pub touch: TouchState,
}

impl InputManager {
    /// Create a new input manager.
    /// 创建新的输入管理器。
    pub fn new() -> Self {
        Self::default()
    }

    /// Update all input states for a new frame.
    /// 为新帧更新所有输入状态。
    pub fn update(&mut self) {
        self.keyboard.update();
        self.mouse.update();
        self.touch.update();
    }

    /// Check if a key is currently pressed.
    /// 检查某个键是否当前被按下。
    #[inline]
    pub fn is_key_down(&self, key: &str) -> bool {
        self.keyboard.is_key_down(key)
    }

    /// Check if a key was just pressed this frame.
    /// 检查某个键是否在本帧刚被按下。
    #[inline]
    pub fn is_key_just_pressed(&self, key: &str) -> bool {
        self.keyboard.is_key_just_pressed(key)
    }

    /// Clear all input states.
    /// 清除所有输入状态。
    pub fn clear(&mut self) {
        self.keyboard.clear();
        self.touch.clear();
    }
}
