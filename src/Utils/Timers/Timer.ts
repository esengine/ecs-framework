import { ITimer } from './ITimer';
import { Time } from '../Time';

/**
 * 私有类隐藏ITimer的实现
 */
export class Timer implements ITimer{
    public context: any;
    public _timeInSeconds: number = 0;
    public _repeats: boolean = false;
    public _onTime!: (timer: ITimer) => void;
    public _isDone: boolean = false;
    public _elapsedTime: number = 0;

    public getContext<T>(): T {
        return this.context as T;
    }

    public reset(): void {
        this._elapsedTime = 0;
    }

    public stop(): void {
        this._isDone = true;
    }

    public tick(){
        // 如果stop在tick之前被调用，那么isDone将为true，我们不应该再做任何事情
        if (!this._isDone && this._elapsedTime > this._timeInSeconds){
            this._elapsedTime -= this._timeInSeconds;
            this._onTime(this);

            if (!this._isDone && !this._repeats)
                this._isDone = true;
        }

        this._elapsedTime += Time.deltaTime;

        return this._isDone;
    }

    public initialize(timeInsSeconds: number, repeats: boolean, context: any, onTime: (timer: ITimer)=>void){
        this._timeInSeconds = timeInsSeconds;
        this._repeats = repeats;
        this.context = context;
        this._onTime = onTime.bind(context);
    }

    /**
     * 空出对象引用，以便在js需要时GC可以清理它们的引用
     */
    public unload(){
        this.context = null;
        this._onTime = null as any;
    }
}