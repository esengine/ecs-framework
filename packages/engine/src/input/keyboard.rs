//! Keyboard input handling.
//! 键盘输入处理。

use std::collections::HashSet;

/// Keyboard input state.
/// 键盘输入状态。
#[derive(Debug, Default)]
pub struct KeyboardState {
    /// Currently pressed keys.
    /// 当前按下的键。
    pressed: HashSet<String>,

    /// Keys pressed this frame.
    /// 本帧按下的键。
    just_pressed: HashSet<String>,

    /// Keys released this frame.
    /// 本帧释放的键。
    just_released: HashSet<String>,
}

impl KeyboardState {
    /// Create new keyboard state.
    /// 创建新的键盘状态。
    pub fn new() -> Self {
        Self::default()
    }

    /// Handle key down event.
    /// 处理按键按下事件。
    pub fn key_down(&mut self, key: String) {
        if !self.pressed.contains(&key) {
            self.just_pressed.insert(key.clone());
        }
        self.pressed.insert(key);
    }

    /// Handle key up event.
    /// 处理按键释放事件。
    pub fn key_up(&mut self, key: String) {
        if self.pressed.remove(&key) {
            self.just_released.insert(key);
        }
    }

    /// Check if a key is currently pressed.
    /// 检查某个键是否当前被按下。
    #[inline]
    pub fn is_key_down(&self, key: &str) -> bool {
        self.pressed.contains(key)
    }

    /// Check if a key was just pressed this frame.
    /// 检查某个键是否在本帧刚被按下。
    #[inline]
    pub fn is_key_just_pressed(&self, key: &str) -> bool {
        self.just_pressed.contains(key)
    }

    /// Check if a key was just released this frame.
    /// 检查某个键是否在本帧刚被释放。
    #[inline]
    pub fn is_key_just_released(&self, key: &str) -> bool {
        self.just_released.contains(key)
    }

    /// Update state for new frame.
    /// 为新帧更新状态。
    pub fn update(&mut self) {
        self.just_pressed.clear();
        self.just_released.clear();
    }

    /// Clear all input state.
    /// 清除所有输入状态。
    pub fn clear(&mut self) {
        self.pressed.clear();
        self.just_pressed.clear();
        self.just_released.clear();
    }
}
