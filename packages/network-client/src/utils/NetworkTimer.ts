/**
 * 网络层专用Timer实现
 * 实现core库的ITimer接口，但使用浏览器/Node.js的原生定时器
 */
import { ITimer } from '@esengine/ecs-framework';

/**
 * 网络层Timer实现
 */
export class NetworkTimer<TContext = unknown> implements ITimer<TContext> {
    public context: TContext;
    private timerId?: number;
    private callback: (timer: ITimer<TContext>) => void;
    private _isDone = false;

    constructor(
        timeInMilliseconds: number,
        repeats: boolean,
        context: TContext,
        onTime: (timer: ITimer<TContext>) => void
    ) {
        this.context = context;
        this.callback = onTime;

        if (repeats) {
            this.timerId = window.setInterval(() => {
                this.callback(this);
            }, timeInMilliseconds) as any;
        } else {
            this.timerId = window.setTimeout(() => {
                this.callback(this);
                this._isDone = true;
            }, timeInMilliseconds) as any;
        }
    }

    stop(): void {
        if (this.timerId !== undefined) {
            clearTimeout(this.timerId);
            clearInterval(this.timerId);
            this.timerId = undefined;
        }
        this._isDone = true;
    }

    reset(): void {
        // 对于基于setTimeout的实现，reset意义不大
        // 如果需要重置，应该stop然后重新创建
    }

    getContext<T>(): T {
        return this.context as unknown as T;
    }

    get isDone(): boolean {
        return this._isDone;
    }
}

/**
 * 网络Timer管理器
 */
export class NetworkTimerManager {
    private static timers: Set<NetworkTimer> = new Set();

    /**
     * 创建一个定时器
     */
    static schedule<TContext = unknown>(
        timeInSeconds: number,
        repeats: boolean,
        context: TContext,
        onTime: (timer: ITimer<TContext>) => void
    ): ITimer<TContext> {
        const timer = new NetworkTimer(
            timeInSeconds * 1000, // 转为毫秒
            repeats,
            context,
            onTime
        );

        this.timers.add(timer as any);

        // 如果是一次性定时器，完成后自动清理
        if (!repeats) {
            setTimeout(() => {
                this.timers.delete(timer as any);
            }, timeInSeconds * 1000 + 100);
        }

        return timer;
    }

    /**
     * 清理所有定时器
     */
    static cleanup(): void {
        for (const timer of this.timers) {
            timer.stop();
        }
        this.timers.clear();
    }
}
