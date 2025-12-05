/**
 * Web 平台输入子系统
 * Web platform input subsystem
 */

import type {
    IPlatformInputSubsystem,
    TouchHandler,
    TouchEvent,
    KeyboardHandler,
    KeyboardEventInfo,
    MouseHandler,
    MouseEventInfo,
    WheelHandler,
    WheelEventInfo
} from '@esengine/platform-common';
import { MouseButton } from '@esengine/platform-common';

/**
 * Web 平台输入子系统实现
 * Web platform input subsystem implementation
 */
export class WebInputSubsystem implements IPlatformInputSubsystem {
    // ========== Touch handlers ==========
    private _touchStartHandlers: Map<TouchHandler, (e: globalThis.TouchEvent) => void> = new Map();
    private _touchMoveHandlers: Map<TouchHandler, (e: globalThis.TouchEvent) => void> = new Map();
    private _touchEndHandlers: Map<TouchHandler, (e: globalThis.TouchEvent) => void> = new Map();
    private _touchCancelHandlers: Map<TouchHandler, (e: globalThis.TouchEvent) => void> = new Map();

    // ========== Keyboard handlers ==========
    private _keyDownHandlers: Map<KeyboardHandler, (e: globalThis.KeyboardEvent) => void> = new Map();
    private _keyUpHandlers: Map<KeyboardHandler, (e: globalThis.KeyboardEvent) => void> = new Map();

    // ========== Mouse handlers ==========
    private _mouseMoveHandlers: Map<MouseHandler, (e: globalThis.MouseEvent) => void> = new Map();
    private _mouseDownHandlers: Map<MouseHandler, (e: globalThis.MouseEvent) => void> = new Map();
    private _mouseUpHandlers: Map<MouseHandler, (e: globalThis.MouseEvent) => void> = new Map();
    private _wheelHandlers: Map<WheelHandler, (e: globalThis.WheelEvent) => void> = new Map();

    // ========== Touch events ==========

    onTouchStart(handler: TouchHandler): void {
        const nativeHandler = (e: globalThis.TouchEvent) => {
            handler(this.convertTouchEvent(e));
        };
        this._touchStartHandlers.set(handler, nativeHandler);
        window.addEventListener('touchstart', nativeHandler);
    }

    onTouchMove(handler: TouchHandler): void {
        const nativeHandler = (e: globalThis.TouchEvent) => {
            handler(this.convertTouchEvent(e));
        };
        this._touchMoveHandlers.set(handler, nativeHandler);
        window.addEventListener('touchmove', nativeHandler);
    }

    onTouchEnd(handler: TouchHandler): void {
        const nativeHandler = (e: globalThis.TouchEvent) => {
            handler(this.convertTouchEvent(e));
        };
        this._touchEndHandlers.set(handler, nativeHandler);
        window.addEventListener('touchend', nativeHandler);
    }

    onTouchCancel(handler: TouchHandler): void {
        const nativeHandler = (e: globalThis.TouchEvent) => {
            handler(this.convertTouchEvent(e));
        };
        this._touchCancelHandlers.set(handler, nativeHandler);
        window.addEventListener('touchcancel', nativeHandler);
    }

    offTouchStart(handler: TouchHandler): void {
        const nativeHandler = this._touchStartHandlers.get(handler);
        if (nativeHandler) {
            window.removeEventListener('touchstart', nativeHandler);
            this._touchStartHandlers.delete(handler);
        }
    }

    offTouchMove(handler: TouchHandler): void {
        const nativeHandler = this._touchMoveHandlers.get(handler);
        if (nativeHandler) {
            window.removeEventListener('touchmove', nativeHandler);
            this._touchMoveHandlers.delete(handler);
        }
    }

    offTouchEnd(handler: TouchHandler): void {
        const nativeHandler = this._touchEndHandlers.get(handler);
        if (nativeHandler) {
            window.removeEventListener('touchend', nativeHandler);
            this._touchEndHandlers.delete(handler);
        }
    }

    offTouchCancel(handler: TouchHandler): void {
        const nativeHandler = this._touchCancelHandlers.get(handler);
        if (nativeHandler) {
            window.removeEventListener('touchcancel', nativeHandler);
            this._touchCancelHandlers.delete(handler);
        }
    }

    supportsPressure(): boolean {
        return typeof Touch !== 'undefined' && 'force' in Touch.prototype;
    }

    // ========== Keyboard events ==========

    onKeyDown(handler: KeyboardHandler): void {
        const nativeHandler = (e: globalThis.KeyboardEvent) => {
            handler(this.convertKeyboardEvent(e));
        };
        this._keyDownHandlers.set(handler, nativeHandler);
        window.addEventListener('keydown', nativeHandler);
    }

    onKeyUp(handler: KeyboardHandler): void {
        const nativeHandler = (e: globalThis.KeyboardEvent) => {
            handler(this.convertKeyboardEvent(e));
        };
        this._keyUpHandlers.set(handler, nativeHandler);
        window.addEventListener('keyup', nativeHandler);
    }

    offKeyDown(handler: KeyboardHandler): void {
        const nativeHandler = this._keyDownHandlers.get(handler);
        if (nativeHandler) {
            window.removeEventListener('keydown', nativeHandler);
            this._keyDownHandlers.delete(handler);
        }
    }

    offKeyUp(handler: KeyboardHandler): void {
        const nativeHandler = this._keyUpHandlers.get(handler);
        if (nativeHandler) {
            window.removeEventListener('keyup', nativeHandler);
            this._keyUpHandlers.delete(handler);
        }
    }

    // ========== Mouse events ==========

    onMouseMove(handler: MouseHandler): void {
        const nativeHandler = (e: globalThis.MouseEvent) => {
            handler(this.convertMouseEvent(e));
        };
        this._mouseMoveHandlers.set(handler, nativeHandler);
        window.addEventListener('mousemove', nativeHandler);
    }

    onMouseDown(handler: MouseHandler): void {
        const nativeHandler = (e: globalThis.MouseEvent) => {
            handler(this.convertMouseEvent(e));
        };
        this._mouseDownHandlers.set(handler, nativeHandler);
        window.addEventListener('mousedown', nativeHandler);
    }

    onMouseUp(handler: MouseHandler): void {
        const nativeHandler = (e: globalThis.MouseEvent) => {
            handler(this.convertMouseEvent(e));
        };
        this._mouseUpHandlers.set(handler, nativeHandler);
        window.addEventListener('mouseup', nativeHandler);
    }

    onWheel(handler: WheelHandler): void {
        const nativeHandler = (e: globalThis.WheelEvent) => {
            handler(this.convertWheelEvent(e));
        };
        this._wheelHandlers.set(handler, nativeHandler);
        window.addEventListener('wheel', nativeHandler);
    }

    offMouseMove(handler: MouseHandler): void {
        const nativeHandler = this._mouseMoveHandlers.get(handler);
        if (nativeHandler) {
            window.removeEventListener('mousemove', nativeHandler);
            this._mouseMoveHandlers.delete(handler);
        }
    }

    offMouseDown(handler: MouseHandler): void {
        const nativeHandler = this._mouseDownHandlers.get(handler);
        if (nativeHandler) {
            window.removeEventListener('mousedown', nativeHandler);
            this._mouseDownHandlers.delete(handler);
        }
    }

    offMouseUp(handler: MouseHandler): void {
        const nativeHandler = this._mouseUpHandlers.get(handler);
        if (nativeHandler) {
            window.removeEventListener('mouseup', nativeHandler);
            this._mouseUpHandlers.delete(handler);
        }
    }

    offWheel(handler: WheelHandler): void {
        const nativeHandler = this._wheelHandlers.get(handler);
        if (nativeHandler) {
            window.removeEventListener('wheel', nativeHandler);
            this._wheelHandlers.delete(handler);
        }
    }

    // ========== Capability queries ==========

    supportsKeyboard(): boolean {
        return true;
    }

    supportsMouse(): boolean {
        // 检测是否有鼠标设备 | Check if mouse device exists
        return window.matchMedia('(pointer: fine)').matches;
    }

    // ========== Event converters ==========

    private convertTouchEvent(e: globalThis.TouchEvent): TouchEvent {
        const convertTouch = (touch: globalThis.Touch) => ({
            identifier: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            force: (touch as any).force
        });

        return {
            touches: Array.from(e.touches).map(convertTouch),
            changedTouches: Array.from(e.changedTouches).map(convertTouch),
            timeStamp: e.timeStamp
        };
    }

    private convertKeyboardEvent(e: globalThis.KeyboardEvent): KeyboardEventInfo {
        return {
            code: e.code,
            key: e.key,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
            repeat: e.repeat,
            timeStamp: e.timeStamp
        };
    }

    private convertMouseEvent(e: globalThis.MouseEvent): MouseEventInfo {
        return {
            x: e.clientX,
            y: e.clientY,
            movementX: e.movementX,
            movementY: e.movementY,
            button: e.button as MouseButton,
            buttons: e.buttons,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
            timeStamp: e.timeStamp
        };
    }

    private convertWheelEvent(e: globalThis.WheelEvent): WheelEventInfo {
        return {
            x: e.clientX,
            y: e.clientY,
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
            timeStamp: e.timeStamp
        };
    }

    /**
     * 销毁并移除所有事件监听器
     * Dispose and remove all event listeners
     */
    dispose(): void {
        // 清理触摸事件 | Clean up touch events
        this._touchStartHandlers.forEach((handler) => {
            window.removeEventListener('touchstart', handler);
        });
        this._touchStartHandlers.clear();

        this._touchMoveHandlers.forEach((handler) => {
            window.removeEventListener('touchmove', handler);
        });
        this._touchMoveHandlers.clear();

        this._touchEndHandlers.forEach((handler) => {
            window.removeEventListener('touchend', handler);
        });
        this._touchEndHandlers.clear();

        this._touchCancelHandlers.forEach((handler) => {
            window.removeEventListener('touchcancel', handler);
        });
        this._touchCancelHandlers.clear();

        // 清理键盘事件 | Clean up keyboard events
        this._keyDownHandlers.forEach((handler) => {
            window.removeEventListener('keydown', handler);
        });
        this._keyDownHandlers.clear();

        this._keyUpHandlers.forEach((handler) => {
            window.removeEventListener('keyup', handler);
        });
        this._keyUpHandlers.clear();

        // 清理鼠标事件 | Clean up mouse events
        this._mouseMoveHandlers.forEach((handler) => {
            window.removeEventListener('mousemove', handler);
        });
        this._mouseMoveHandlers.clear();

        this._mouseDownHandlers.forEach((handler) => {
            window.removeEventListener('mousedown', handler);
        });
        this._mouseDownHandlers.clear();

        this._mouseUpHandlers.forEach((handler) => {
            window.removeEventListener('mouseup', handler);
        });
        this._mouseUpHandlers.clear();

        this._wheelHandlers.forEach((handler) => {
            window.removeEventListener('wheel', handler);
        });
        this._wheelHandlers.clear();
    }
}
