/**
 * 微信小游戏输入子系统
 */

import type {
    IPlatformInputSubsystem,
    TouchHandler,
    TouchEvent
} from '@esengine/platform-common';
import { getWx } from '../utils';

/**
 * 微信小游戏输入子系统实现
 */
export class WeChatInputSubsystem implements IPlatformInputSubsystem {
    onTouchStart(handler: TouchHandler): void {
        getWx().onTouchStart((res) => {
            handler(this.convertTouchEvent(res));
        });
    }

    onTouchMove(handler: TouchHandler): void {
        getWx().onTouchMove((res) => {
            handler(this.convertTouchEvent(res));
        });
    }

    onTouchEnd(handler: TouchHandler): void {
        getWx().onTouchEnd((res) => {
            handler(this.convertTouchEvent(res));
        });
    }

    onTouchCancel(handler: TouchHandler): void {
        getWx().onTouchCancel((res) => {
            handler(this.convertTouchEvent(res));
        });
    }

    offTouchStart(handler: TouchHandler): void {
        getWx().offTouchStart(handler as any);
    }

    offTouchMove(handler: TouchHandler): void {
        getWx().offTouchMove(handler as any);
    }

    offTouchEnd(handler: TouchHandler): void {
        getWx().offTouchEnd(handler as any);
    }

    offTouchCancel(handler: TouchHandler): void {
        getWx().offTouchCancel(handler as any);
    }

    supportsPressure(): boolean {
        return true;
    }

    private convertTouchEvent(res: WechatMinigame.OnTouchStartListenerResult): TouchEvent {
        return {
            touches: res.touches.map((t: WechatMinigame.Touch) => ({
                identifier: t.identifier,
                x: t.clientX,
                y: t.clientY,
                force: t.force
            })),
            changedTouches: res.changedTouches.map((t: WechatMinigame.Touch) => ({
                identifier: t.identifier,
                x: t.clientX,
                y: t.clientY,
                force: t.force
            })),
            timeStamp: res.timeStamp
        };
    }
}
