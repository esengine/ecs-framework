module es {
    export interface ITimer {
        context: any;

        /**
         * 调用stop以停止此计时器再次运行。这对非重复计时器没有影响。
         */
        stop();

        /**
         * 将计时器的运行时间重置为0
         */
        reset();

        /**
         *
         */
        getContext<T>(): T;
    }
}