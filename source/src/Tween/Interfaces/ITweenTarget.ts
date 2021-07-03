module es {
    /**
     * 任何想要被weened的对象都需要实现这个功能。
     * TweenManager内部喜欢做一个简单的对象来实现这个接口，并存储一个对被tweened对象的引用
     */
    export interface ITweenTarget<T> {
        /**
         * 在你选择的对象上设置最终的tweened值
         * @param value 
         */
        setTweenedValue(value: T);

        getTweenedValue(): T;
        /**
         * 获取tween的目标，如果TweenTargets不一定都是一个对象，则为null，它的唯一真正用途是让TweenManager按目标查找tweens的列表
         */
        getTargetObject(): any;
    }
}