export interface ITimer {
    context: any;

    /**
     * 调用stop以停止此计时器再次运行。这对非重复计时器没有影响。
     */
    stop(): void;

    /**
     * 将计时器的运行时间重置为0
     */
    reset(): void;

    /**
     * 返回投向T的上下文，作为方便
     */
    getContext<T>(): T;
}