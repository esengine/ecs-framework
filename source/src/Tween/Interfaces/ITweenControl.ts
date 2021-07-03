module es {
    /**
     * 更多具体的Tween播放控制在这里
     */
    export interface ITweenControl extends ITweenable {
        /**
         * 当使用匿名方法时，您可以在任何回调（如完成处理程序）中使用该属性来避免分配
         */
        context;
        /**
         * 将tween扭曲为elapsedTime，并将其限制在0和duration之间，无论tween对象是暂停、完成还是运行，都会立即更新
         * @param elapsedTime 所用时间
         */
        jumpToElapsedTime(elapsedTime: number);
        /**
         * 当从StartCoroutine调用时，它将直到tween完成
         */
        waitForCompletion(): any;
        /**
         *  获取tween的目标，如果TweenTargets不一定都是一个对象，则为null，它的唯一真正用途是让TweenManager按目标查找tweens的列表
         */
        getTargetObject(): any;
    }
}