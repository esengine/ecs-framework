module es {
    export interface ITweenable {
        /**
         * 就像内部的Update一样，每一帧都被TweenManager调用
         */
        tick(): boolean;
        /**
         * 当一个tween被移除时，由TweenManager调用。子
         * 类可以选择自己回收。子类应该首先在其实现中检查_shouldRecycleTween bool!
         */
        recycleSelf();
        /**
         * 检查是否有tween在运行
         */
        isRunning(): boolean;
        /**
         * 启动tween
         */
        start();
        /**
         * 暂停
         */
        pause();
        /**
         * 暂停后恢复tween
         */
        resume();
        /**
         * 停止tween，并可选择将其完成
         * @param bringToCompletion 
         */
        stop(bringToCompletion: boolean);
    }
}