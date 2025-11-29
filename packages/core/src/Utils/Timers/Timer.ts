import { ITimer } from './ITimer';
import { Time } from '../Time';

/**
 * 私有类隐藏ITimer的实现
 */
export class Timer<TContext = unknown> implements ITimer<TContext>{
    public context!: TContext;
    private _timeInSeconds: number = 0;
    private _repeats: boolean = false;
    private _onTime!: (timer: ITimer<TContext>) => void;
    private _isDone: boolean = false;
    private _elapsedTime: number = 0;

    public getContext<T>(): T {
        return this.context as unknown as T;
    }

    /**
     * 定时器是否已完成
     */
    public get isDone(): boolean {
        return this._isDone;
    }

    /**
     * 定时器已运行的时间
     */
    public get elapsedTime(): number {
        return this._elapsedTime;
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

    public initialize(timeInsSeconds: number, repeats: boolean, context: TContext, onTime: (timer: ITimer<TContext>)=>void){
        this._timeInSeconds = timeInsSeconds;
        this._repeats = repeats;
        this.context = context;
        this._onTime = onTime.bind(context);
    }

    /**
     * 空出对象引用，以便在js需要时GC可以清理它们的引用
     */
    public unload(){
        this.context = null as unknown as TContext;
        this._onTime = null!;
    }
}
