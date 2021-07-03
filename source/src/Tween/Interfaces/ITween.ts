module es {
    /**
     * 一系列强类型、可链式的方法来设置各种tween属性
     */
    export interface ITween<T> extends ITweenControl {
        /**
         * 设置该tween的易用性类型
         * @param easeType 
         */
        setEaseType(easeType: EaseType): ITween<T>;
        /**
         * 设置启动tween前的延迟
         * @param delay 
         */
        setDelay(delay: number): ITween<T>;
        /**
         * 设置tween的持续时间
         * @param duration 
         */
        setDuration(duration: number): ITween<T>;
        /**
         * 设置这个tween使用的timeScale。
         * TimeScale将与Time.deltaTime/Time.unscaledDeltaTime相乘，从而得到tween实际使用的delta时间
         * @param timeScale 
         */
        setTimeScale(timeScale: number): ITween<T>;
        /**
         * 设置tween使用Time.unscaledDeltaTime代替Time.deltaTime
         */
        setIsTimeScaleIndependent(): ITween<T>;
        /**
         * 设置当tween完成时应该调用的动作
         * @param completionHandler 
         */
        setCompletionHandler(completionHandler: (tween: ITween<T>) => void): ITween<T>;
        /**
         * 设置tween的循环类型。一个pingpong循环意味着从开始-结束-开始
         * @param loopType 
         * @param loops 
         * @param delayBetweenLoops 
         */
        setLoops(loopType: LoopType, loops: number, delayBetweenLoops: number): ITween<T>;
        /**
         * 设置tween的起始位置
         * @param from 
         */
        setFrom(from: T): ITween<T>;
        /**
         * 通过重置tween的from/to值和持续时间，为重复使用tween做准备。
         * @param from 
         * @param to 
         * @param duration 
         */
        prepareForReuse(from: T, to: T, duration: number): ITween<T>;
        /**
         * 如果为true(默认值)，tween将在使用后被回收。
         * 如果在TweenManager类中进行了配置，所有的Tween<T>子类都有自己相关的自动缓存
         * @param shouldRecycleTween 
         */
        setRecycleTween(shouldRecycleTween: boolean): ITween<T>;
        /**
         * 帮助程序，只是将tween的to值设置为相对于其当前值的+从使tween
         */
        setIsRelative(): ITween<T>;
        /**
         * 允许你通过tween.context.context来设置任何可检索的对象引用。
         * 这对于避免完成处理程序方法的闭包分配是很方便的。
         * 你也可以在TweenManager中搜索具有特定上下文的所有tweens
         * @param context 
         */
        setContext(context): ITween<T>;
        /**
         * 允许你添加一个tween，这个tween完成后会被运行。
         * 注意 nextTween 必须是一个 ITweenable! 同时注意，所有的ITweenT都是ITweenable
         * @param nextTween 
         */
        setNextTween(nextTween: ITweenable): ITween<T>;
    }
}