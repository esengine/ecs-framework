//! Mouse input handling.
//! 鼠标输入处理。

use crate::math::Vec2;

/// Mouse button identifiers.
/// 鼠标按钮标识符。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum MouseButton {
    /// Left mouse button.
    /// 鼠标左键。
    Left,
    /// Middle mouse button (scroll wheel).
    /// 鼠标中键（滚轮）。
    Middle,
    /// Right mouse button.
    /// 鼠标右键。
    Right,
}

impl MouseButton {
    /// Convert from button index.
    /// 从按钮索引转换。
    pub fn from_index(index: i16) -> Option<Self> {
        match index {
            0 => Some(MouseButton::Left),
            1 => Some(MouseButton::Middle),
            2 => Some(MouseButton::Right),
            _ => None,
        }
    }
}

/// Mouse input state.
/// 鼠标输入状态。
#[derive(Debug, Default)]
pub struct MouseState {
    /// Current mouse position.
    /// 当前鼠标位置。
    pub position: Vec2,

    /// Mouse movement delta since last frame.
    /// 自上一帧以来的鼠标移动增量。
    pub delta: Vec2,

    /// Scroll wheel delta.
    /// 滚轮增量。
    pub scroll_delta: f32,

    /// Button states (left, middle, right).
    /// 按钮状态（左、中、右）。
    buttons: [bool; 3],

    /// Buttons just pressed this frame.
    /// 本帧刚按下的按钮。
    just_pressed: [bool; 3],

    /// Buttons just released this frame.
    /// 本帧刚释放的按钮。
    just_released: [bool; 3],

    /// Previous position for delta calculation.
    /// 用于计算增量的上一位置。
    prev_position: Vec2,
}

impl MouseState {
    /// Create new mouse state.
    /// 创建新的鼠标状态。
    pub fn new() -> Self {
        Self::default()
    }

    /// Handle mouse move event.
    /// 处理鼠标移动事件。
    pub fn mouse_move(&mut self, x: f32, y: f32) {
        self.position = Vec2::new(x, y);
    }

    /// Handle mouse button down event.
    /// 处理鼠标按钮按下事件。
    pub fn button_down(&mut self, button: MouseButton) {
        let index = button as usize;
        if !self.buttons[index] {
            self.just_pressed[index] = true;
        }
        self.buttons[index] = true;
    }

    /// Handle mouse button up event.
    /// 处理鼠标按钮释放事件。
    pub fn button_up(&mut self, button: MouseButton) {
        let index = button as usize;
        if self.buttons[index] {
            self.just_released[index] = true;
        }
        self.buttons[index] = false;
    }

    /// Handle scroll wheel event.
    /// 处理滚轮事件。
    pub fn scroll(&mut self, delta: f32) {
        self.scroll_delta = delta;
    }

    /// Check if a button is currently pressed.
    /// 检查某个按钮是否当前被按下。
    #[inline]
    pub fn is_button_down(&self, button: MouseButton) -> bool {
        self.buttons[button as usize]
    }

    /// Check if a button was just pressed this frame.
    /// 检查某个按钮是否在本帧刚被按下。
    #[inline]
    pub fn is_button_just_pressed(&self, button: MouseButton) -> bool {
        self.just_pressed[button as usize]
    }

    /// Check if a button was just released this frame.
    /// 检查某个按钮是否在本帧刚被释放。
    #[inline]
    pub fn is_button_just_released(&self, button: MouseButton) -> bool {
        self.just_released[button as usize]
    }

    /// Update state for new frame.
    /// 为新帧更新状态。
    pub fn update(&mut self) {
        self.delta = self.position - self.prev_position;
        self.prev_position = self.position;
        self.scroll_delta = 0.0;
        self.just_pressed = [false; 3];
        self.just_released = [false; 3];
    }
}
