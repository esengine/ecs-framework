/**
 * 微信小游戏音频子系统
 */

import type {
    IPlatformAudioSubsystem,
    IPlatformAudioContext
} from '@esengine/platform-common';
import { getWx, promisify } from '../utils';

/**
 * 微信音频上下文包装
 */
class WeChatAudioContext implements IPlatformAudioContext {
    private _ctx: WechatMinigame.InnerAudioContext;

    constructor(ctx: WechatMinigame.InnerAudioContext) {
        this._ctx = ctx;
    }

    get src(): string { return this._ctx.src; }
    set src(value: string) { this._ctx.src = value; }

    get autoplay(): boolean { return this._ctx.autoplay; }
    set autoplay(value: boolean) { this._ctx.autoplay = value; }

    get loop(): boolean { return this._ctx.loop; }
    set loop(value: boolean) { this._ctx.loop = value; }

    get volume(): number { return this._ctx.volume; }
    set volume(value: number) { this._ctx.volume = value; }

    get duration(): number { return this._ctx.duration; }
    get currentTime(): number { return this._ctx.currentTime; }
    get paused(): boolean { return this._ctx.paused; }
    get buffered(): number { return this._ctx.buffered; }

    play(): void { this._ctx.play(); }
    pause(): void { this._ctx.pause(); }
    stop(): void { this._ctx.stop(); }
    seek(position: number): void { this._ctx.seek(position); }
    destroy(): void { this._ctx.destroy(); }

    onPlay(callback: () => void): void { this._ctx.onPlay(callback); }
    onPause(callback: () => void): void { this._ctx.onPause(callback); }
    onStop(callback: () => void): void { this._ctx.onStop(callback); }
    onEnded(callback: () => void): void { this._ctx.onEnded(callback); }
    onError(callback: (error: { errCode: number; errMsg: string }) => void): void {
        this._ctx.onError(callback as any);
    }
    onTimeUpdate(callback: () => void): void { this._ctx.onTimeUpdate(callback); }
    onCanplay(callback: () => void): void { this._ctx.onCanplay(callback); }
    onSeeking(callback: () => void): void { this._ctx.onSeeking(callback); }
    onSeeked(callback: () => void): void { this._ctx.onSeeked(callback); }

    offPlay(callback: () => void): void { this._ctx.offPlay(callback); }
    offPause(callback: () => void): void { this._ctx.offPause(callback); }
    offStop(callback: () => void): void { this._ctx.offStop(callback); }
    offEnded(callback: () => void): void { this._ctx.offEnded(callback); }
    offError(callback: (error: { errCode: number; errMsg: string }) => void): void {
        this._ctx.offError(callback as any);
    }
    offTimeUpdate(callback: () => void): void { this._ctx.offTimeUpdate(callback); }
}

/**
 * 微信小游戏音频子系统实现
 */
export class WeChatAudioSubsystem implements IPlatformAudioSubsystem {
    createAudioContext(_options?: { useWebAudioImplement?: boolean }): IPlatformAudioContext {
        const ctx = getWx().createInnerAudioContext({
            useWebAudioImplement: _options?.useWebAudioImplement
        });
        return new WeChatAudioContext(ctx);
    }

    getSupportedFormats(): string[] {
        return ['mp3', 'wav', 'aac', 'm4a'];
    }

    async setInnerAudioOption(options: {
        mixWithOther?: boolean;
        obeyMuteSwitch?: boolean;
        speakerOn?: boolean;
    }): Promise<void> {
        return promisify(getWx().setInnerAudioOption.bind(getWx()), options);
    }
}
