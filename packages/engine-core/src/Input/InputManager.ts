/**
 * 输入管理器 - 统一管理所有输入状态
 * Input Manager - Unified input state management
 *
 * 提供简单易用的 API 供游戏代码查询输入状态。
 * Provides simple API for game code to query input state.
 *
 * @example
 * ```typescript
 * // 在游戏系统中使用 | Use in game system
 * class PlayerMovementSystem extends EntitySystem {
 *     protected process(entities: readonly Entity[]): void {
 *         const input = Input;
 *
 *         for (const entity of entities) {
 *             const transform = entity.getComponent(TransformComponent);
 *
 *             // 键盘移动 | Keyboard movement
 *             if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) {
 *                 transform.position.y -= 5;
 *             }
 *             if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) {
 *                 transform.position.y += 5;
 *             }
 *
 *             // 鼠标点击 | Mouse click
 *             if (input.isMouseButtonJustPressed(MouseButton.Left)) {
 *                 console.log('Clicked at:', input.mousePosition);
 *             }
 *         }
 *     }
 * }
 * ```
 */

import { MouseButton } from '@esengine/platform-common';
import type { KeyboardEventInfo, MouseEventInfo, WheelEventInfo, TouchInfo } from '@esengine/platform-common';
import type { IVector2 } from '@esengine/ecs-framework-math';

/**
 * 按键状态
 * Key state
 */
export interface KeyState {
    /** 是否按下 | Is pressed */
    pressed: boolean;
    /** 本帧刚按下 | Just pressed this frame */
    justPressed: boolean;
    /** 本帧刚释放 | Just released this frame */
    justReleased: boolean;
}

/**
 * 鼠标按钮状态
 * Mouse button state
 */
export interface MouseButtonState {
    /** 是否按下 | Is pressed */
    pressed: boolean;
    /** 本帧刚按下 | Just pressed this frame */
    justPressed: boolean;
    /** 本帧刚释放 | Just released this frame */
    justReleased: boolean;
}


/**
 * 输入管理器类
 * Input Manager class
 */
export class InputManager {
    // ========== 键盘状态 | Keyboard state ==========
    private _keyStates: Map<string, KeyState> = new Map();
    private _keysJustPressed: Set<string> = new Set();
    private _keysJustReleased: Set<string> = new Set();

    // ========== 鼠标状态 | Mouse state ==========
    private _mousePosition: IVector2 = { x: 0, y: 0 };
    private _mouseMovement: IVector2 = { x: 0, y: 0 };
    private _mouseButtonStates: Map<MouseButton, MouseButtonState> = new Map();
    private _mouseButtonsJustPressed: Set<MouseButton> = new Set();
    private _mouseButtonsJustReleased: Set<MouseButton> = new Set();
    private _scrollDelta: IVector2 = { x: 0, y: 0 };

    // ========== 触摸状态 | Touch state ==========
    private _touches: Map<number, TouchInfo> = new Map();
    private _touchesJustStarted: Set<number> = new Set();
    private _touchesJustEnded: Set<number> = new Set();

    // ========== 修饰键状态 | Modifier key state ==========
    private _altKey: boolean = false;
    private _ctrlKey: boolean = false;
    private _shiftKey: boolean = false;
    private _metaKey: boolean = false;

    constructor() {
        // 初始化鼠标按钮状态 | Initialize mouse button states
        this._mouseButtonStates.set(MouseButton.Left, { pressed: false, justPressed: false, justReleased: false });
        this._mouseButtonStates.set(MouseButton.Middle, { pressed: false, justPressed: false, justReleased: false });
        this._mouseButtonStates.set(MouseButton.Right, { pressed: false, justPressed: false, justReleased: false });
    }

    // ========== 键盘 API | Keyboard API ==========

    /**
     * 检查按键是否按下
     * Check if a key is pressed
     *
     * @param code 按键代码 (如 'KeyW', 'Space', 'ArrowUp') | Key code
     */
    isKeyDown(code: string): boolean {
        return this._keyStates.get(code)?.pressed ?? false;
    }

    /**
     * 检查按键是否本帧刚按下
     * Check if a key was just pressed this frame
     *
     * @param code 按键代码 | Key code
     */
    isKeyJustPressed(code: string): boolean {
        return this._keyStates.get(code)?.justPressed ?? false;
    }

    /**
     * 检查按键是否本帧刚释放
     * Check if a key was just released this frame
     *
     * @param code 按键代码 | Key code
     */
    isKeyJustReleased(code: string): boolean {
        return this._keyStates.get(code)?.justReleased ?? false;
    }

    /**
     * 获取所有按下的按键
     * Get all pressed keys
     */
    getPressedKeys(): string[] {
        const result: string[] = [];
        this._keyStates.forEach((state, code) => {
            if (state.pressed) {
                result.push(code);
            }
        });
        return result;
    }

    // ========== 鼠标 API | Mouse API ==========

    /**
     * 获取鼠标位置（屏幕坐标）
     * Get mouse position (screen coordinates)
     */
    get mousePosition(): Readonly<IVector2> {
        return this._mousePosition;
    }

    /**
     * 获取鼠标本帧移动量
     * Get mouse movement this frame
     */
    get mouseMovement(): Readonly<IVector2> {
        return this._mouseMovement;
    }

    /**
     * 获取滚轮滚动量
     * Get scroll delta
     */
    get scrollDelta(): Readonly<IVector2> {
        return this._scrollDelta;
    }

    /**
     * 检查鼠标按钮是否按下
     * Check if a mouse button is pressed
     *
     * @param button 鼠标按钮 | Mouse button
     */
    isMouseButtonDown(button: MouseButton): boolean {
        return this._mouseButtonStates.get(button)?.pressed ?? false;
    }

    /**
     * 检查鼠标按钮是否本帧刚按下
     * Check if a mouse button was just pressed this frame
     *
     * @param button 鼠标按钮 | Mouse button
     */
    isMouseButtonJustPressed(button: MouseButton): boolean {
        return this._mouseButtonStates.get(button)?.justPressed ?? false;
    }

    /**
     * 检查鼠标按钮是否本帧刚释放
     * Check if a mouse button was just released this frame
     *
     * @param button 鼠标按钮 | Mouse button
     */
    isMouseButtonJustReleased(button: MouseButton): boolean {
        return this._mouseButtonStates.get(button)?.justReleased ?? false;
    }

    // ========== 触摸 API | Touch API ==========

    /**
     * 获取所有触摸点
     * Get all touch points
     */
    get touches(): ReadonlyMap<number, TouchInfo> {
        return this._touches;
    }

    /**
     * 获取触摸点数量
     * Get touch count
     */
    get touchCount(): number {
        return this._touches.size;
    }

    /**
     * 获取指定触摸点
     * Get a specific touch point
     *
     * @param identifier 触摸点标识符 | Touch identifier
     */
    getTouch(identifier: number): TouchInfo | undefined {
        return this._touches.get(identifier);
    }

    /**
     * 检查是否有触摸
     * Check if there are any touches
     */
    get isTouching(): boolean {
        return this._touches.size > 0;
    }

    /**
     * 检查触摸点是否本帧刚开始
     * Check if a touch just started this frame
     *
     * @param identifier 触摸点标识符 | Touch identifier
     */
    isTouchJustStarted(identifier: number): boolean {
        return this._touchesJustStarted.has(identifier);
    }

    /**
     * 检查触摸点是否本帧刚结束
     * Check if a touch just ended this frame
     *
     * @param identifier 触摸点标识符 | Touch identifier
     */
    isTouchJustEnded(identifier: number): boolean {
        return this._touchesJustEnded.has(identifier);
    }

    // ========== 修饰键 API | Modifier keys API ==========

    /** Alt 键是否按下 | Is Alt key pressed */
    get altKey(): boolean { return this._altKey; }

    /** Ctrl 键是否按下 | Is Ctrl key pressed */
    get ctrlKey(): boolean { return this._ctrlKey; }

    /** Shift 键是否按下 | Is Shift key pressed */
    get shiftKey(): boolean { return this._shiftKey; }

    /** Meta 键是否按下 (Windows/Command) | Is Meta key pressed */
    get metaKey(): boolean { return this._metaKey; }

    // ========== 内部更新方法 | Internal update methods ==========

    /**
     * 处理键盘按下事件
     * Handle key down event
     * @internal
     */
    handleKeyDown(event: KeyboardEventInfo): void {
        let state = this._keyStates.get(event.code);
        if (!state) {
            state = { pressed: false, justPressed: false, justReleased: false };
            this._keyStates.set(event.code, state);
        }

        if (!state.pressed && !event.repeat) {
            state.justPressed = true;
            this._keysJustPressed.add(event.code);
        }
        state.pressed = true;

        // 更新修饰键 | Update modifier keys
        this._altKey = event.altKey;
        this._ctrlKey = event.ctrlKey;
        this._shiftKey = event.shiftKey;
        this._metaKey = event.metaKey;
    }

    /**
     * 处理键盘释放事件
     * Handle key up event
     * @internal
     */
    handleKeyUp(event: KeyboardEventInfo): void {
        let state = this._keyStates.get(event.code);
        if (!state) {
            state = { pressed: false, justPressed: false, justReleased: false };
            this._keyStates.set(event.code, state);
        }

        if (state.pressed) {
            state.justReleased = true;
            this._keysJustReleased.add(event.code);
        }
        state.pressed = false;

        // 更新修饰键 | Update modifier keys
        this._altKey = event.altKey;
        this._ctrlKey = event.ctrlKey;
        this._shiftKey = event.shiftKey;
        this._metaKey = event.metaKey;
    }

    /**
     * 处理鼠标移动事件
     * Handle mouse move event
     * @internal
     */
    handleMouseMove(event: MouseEventInfo): void {
        this._mousePosition.x = event.x;
        this._mousePosition.y = event.y;
        this._mouseMovement.x += event.movementX;
        this._mouseMovement.y += event.movementY;
    }

    /**
     * 处理鼠标按下事件
     * Handle mouse down event
     * @internal
     */
    handleMouseDown(event: MouseEventInfo): void {
        const button = event.button as MouseButton;
        let state = this._mouseButtonStates.get(button);
        if (!state) {
            state = { pressed: false, justPressed: false, justReleased: false };
            this._mouseButtonStates.set(button, state);
        }

        if (!state.pressed) {
            state.justPressed = true;
            this._mouseButtonsJustPressed.add(button);
        }
        state.pressed = true;

        this._mousePosition.x = event.x;
        this._mousePosition.y = event.y;
    }

    /**
     * 处理鼠标释放事件
     * Handle mouse up event
     * @internal
     */
    handleMouseUp(event: MouseEventInfo): void {
        const button = event.button as MouseButton;
        let state = this._mouseButtonStates.get(button);
        if (!state) {
            state = { pressed: false, justPressed: false, justReleased: false };
            this._mouseButtonStates.set(button, state);
        }

        if (state.pressed) {
            state.justReleased = true;
            this._mouseButtonsJustReleased.add(button);
        }
        state.pressed = false;

        this._mousePosition.x = event.x;
        this._mousePosition.y = event.y;
    }

    /**
     * 处理鼠标滚轮事件
     * Handle mouse wheel event
     * @internal
     */
    handleWheel(event: WheelEventInfo): void {
        this._scrollDelta.x += event.deltaX;
        this._scrollDelta.y += event.deltaY;
    }

    /**
     * 处理触摸开始事件
     * Handle touch start event
     * @internal
     */
    handleTouchStart(touches: TouchInfo[]): void {
        for (const touch of touches) {
            this._touches.set(touch.identifier, touch);
            this._touchesJustStarted.add(touch.identifier);
        }
    }

    /**
     * 处理触摸移动事件
     * Handle touch move event
     * @internal
     */
    handleTouchMove(touches: TouchInfo[]): void {
        for (const touch of touches) {
            this._touches.set(touch.identifier, touch);
        }
    }

    /**
     * 处理触摸结束事件
     * Handle touch end event
     * @internal
     */
    handleTouchEnd(touches: TouchInfo[]): void {
        for (const touch of touches) {
            this._touches.delete(touch.identifier);
            this._touchesJustEnded.add(touch.identifier);
        }
    }

    /**
     * 帧末清理临时状态
     * Clear temporary state at end of frame
     * @internal
     */
    endFrame(): void {
        // 清理键盘帧状态 | Clear keyboard frame state
        for (const code of this._keysJustPressed) {
            const state = this._keyStates.get(code);
            if (state) {
                state.justPressed = false;
            }
        }
        this._keysJustPressed.clear();

        for (const code of this._keysJustReleased) {
            const state = this._keyStates.get(code);
            if (state) {
                state.justReleased = false;
            }
        }
        this._keysJustReleased.clear();

        // 清理鼠标帧状态 | Clear mouse frame state
        for (const button of this._mouseButtonsJustPressed) {
            const state = this._mouseButtonStates.get(button);
            if (state) {
                state.justPressed = false;
            }
        }
        this._mouseButtonsJustPressed.clear();

        for (const button of this._mouseButtonsJustReleased) {
            const state = this._mouseButtonStates.get(button);
            if (state) {
                state.justReleased = false;
            }
        }
        this._mouseButtonsJustReleased.clear();

        // 清理鼠标移动和滚动 | Clear mouse movement and scroll
        this._mouseMovement.x = 0;
        this._mouseMovement.y = 0;
        this._scrollDelta.x = 0;
        this._scrollDelta.y = 0;

        // 清理触摸帧状态 | Clear touch frame state
        this._touchesJustStarted.clear();
        this._touchesJustEnded.clear();
    }

    /**
     * 重置所有输入状态
     * Reset all input state
     */
    reset(): void {
        this._keyStates.clear();
        this._keysJustPressed.clear();
        this._keysJustReleased.clear();

        this._mousePosition = { x: 0, y: 0 };
        this._mouseMovement = { x: 0, y: 0 };
        this._scrollDelta = { x: 0, y: 0 };
        this._mouseButtonStates.forEach(state => {
            state.pressed = false;
            state.justPressed = false;
            state.justReleased = false;
        });
        this._mouseButtonsJustPressed.clear();
        this._mouseButtonsJustReleased.clear();

        this._touches.clear();
        this._touchesJustStarted.clear();
        this._touchesJustEnded.clear();

        this._altKey = false;
        this._ctrlKey = false;
        this._shiftKey = false;
        this._metaKey = false;
    }
}

/**
 * 全局输入管理器实例
 * Global input manager instance
 *
 * 游戏代码可以直接使用这个实例查询输入状态。
 * Game code can use this instance directly to query input state.
 *
 * @example
 * ```typescript
 * import { Input, MouseButton } from '@esengine/engine-core';
 *
 * // 检查按键
 * if (Input.isKeyDown('KeyW')) {
 *     // 向上移动
 * }
 *
 * // 检查鼠标
 * if (Input.isMouseButtonJustPressed(MouseButton.Left)) {
 *     console.log('点击位置:', Input.mousePosition);
 * }
 * ```
 */
export const Input = new InputManager();
