/**
 * Web 平台输入子系统
 */

import type {
    IPlatformInputSubsystem,
    TouchHandler,
    TouchEvent
} from '@esengine/platform-common';

/**
 * Web 平台输入子系统实现
 */
export class WebInputSubsystem implements IPlatformInputSubsystem {
    private _touchStartHandlers: Map<TouchHandler, (e: globalThis.TouchEvent) => void> = new Map();
    private _touchMoveHandlers: Map<TouchHandler, (e: globalThis.TouchEvent) => void> = new Map();
    private _touchEndHandlers: Map<TouchHandler, (e: globalThis.TouchEvent) => void> = new Map();
    private _touchCancelHandlers: Map<TouchHandler, (e: globalThis.TouchEvent) => void> = new Map();

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
        return 'force' in Touch.prototype;
    }

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
}
