import { Timer } from './Timer';
import { ITimer } from './ITimer';
import type { IService } from '../../Core/ServiceContainer';
import type { IUpdatable } from '../../Types/IUpdatable';
import { Updatable } from '../../Core/DI';

/**
 * 定时器管理器
 *
 * 允许动作的延迟和重复执行
 */
@Updatable()
export class TimerManager implements IService, IUpdatable {
    private _timers: Array<Timer<unknown>> = [];

    public update() {
        for (let i = this._timers.length - 1; i >= 0; i --){
            if (this._timers[i]!.tick()){
                this._timers[i]!.unload();
                this._timers.splice(i, 1);
            }
        }
    }

    /**
     * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
     * @param timeInSeconds
     * @param repeats
     * @param context
     * @param onTime
     */
    public schedule<TContext = unknown>(timeInSeconds: number, repeats: boolean, context: TContext, onTime: (timer: ITimer<TContext>)=>void): Timer<TContext> {
        const timer = new Timer<TContext>();
        timer.initialize(timeInSeconds, repeats, context, onTime);
        this._timers.push(timer as Timer<unknown>);

        return timer;
    }

    /**
     * 释放资源
     */
    public dispose(): void {
        for (const timer of this._timers) {
            timer.unload();
        }
        this._timers = [];
    }
}
