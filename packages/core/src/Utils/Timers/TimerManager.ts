import { GlobalManager } from '../GlobalManager';
import { Timer } from './Timer';
import { ITimer } from './ITimer';

/**
 * 允许动作的延迟和重复执行
 */
export class TimerManager extends GlobalManager {
    public _timers: Array<Timer<unknown>> = [];

    public override update() {
        for (let i = this._timers.length - 1; i >= 0; i --){
            if (this._timers[i].tick()){
                this._timers[i].unload();
                this._timers.splice(i, 1);
            }
        }
    }

    /**
     * 调度一个一次性或重复的计时器，该计时器将调用已传递的动作
     * @param timeInSeconds - 计时器的持续时间（秒）
     * @param repeats - 是否重复执行
     * @param context - 上下文对象
     * @param onTime - 定时器触发时调用的回调
     */
    public schedule<TContext = unknown>(timeInSeconds: number, repeats: boolean, context: TContext, onTime: (timer: ITimer<TContext>)=>void): Timer<TContext> {
        let timer = new Timer<TContext>();
        timer.initialize(timeInSeconds, repeats, context, onTime);
        this._timers.push(timer as Timer<unknown>);

        return timer;
    }
}