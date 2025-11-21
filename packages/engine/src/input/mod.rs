//! Input handling system.
//! 输入处理系统。

mod keyboard;
mod mouse;
mod touch;
mod input_manager;

pub use input_manager::InputManager;
pub use keyboard::KeyboardState;
pub use mouse::{MouseState, MouseButton};
pub use touch::{TouchState, TouchPoint};
