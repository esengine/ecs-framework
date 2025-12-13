/**
 * 输入系统模块
 * Input System Module
 *
 * 提供统一的输入处理能力，支持键盘、鼠标和触摸输入。
 * Provides unified input handling for keyboard, mouse, and touch.
 *
 * @example
 * ```typescript
 * import { Input, InputSystem, MouseButton } from '@esengine/engine-core';
 *
 * // 在游戏代码中查询输入状态
 * if (Input.isKeyDown('KeyW')) {
 *     // 向上移动
 * }
 *
 * if (Input.isMouseButtonJustPressed(MouseButton.Left)) {
 *     console.log('点击位置:', Input.mousePosition);
 * }
 *
 * // 触摸输入
 * if (Input.isTouching) {
 *     for (const [id, touch] of Input.touches) {
 *         console.log('触摸点:', id, touch.x, touch.y);
 *     }
 * }
 * ```
 */

export { InputManager, Input, type KeyState, type MouseButtonState } from './InputManager';
export { InputSystem, type InputSystemConfig } from './InputSystem';

// 重导出平台公共类型 | Re-export platform common types
export { MouseButton } from '@esengine/platform-common';
export type {
    KeyboardEventInfo,
    MouseEventInfo,
    WheelEventInfo,
    TouchInfo,
    TouchEvent
} from '@esengine/platform-common';
