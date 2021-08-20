module es {

    export enum OverlapBehavior {
        /**
         * 重复的输入将导致相互抵消，并且不会记录任何输入。
         * 例如:按左箭头键，按住时按右箭头键。这将导致相互抵消。
         */
        cancelOut,
        /**
         * 将使用找到的第一个输入
         */
        takeOlder,
        /**
         * 将使用找到的最后一个输入
         */
        takeNewer,
    }

    /**
     * 虚拟按钮，其状态由其VirtualInputNodes的状态决定
     */
    export abstract class VirtualInput {
        protected constructor() {
            Input._virtualInputs.push(this);
        }

        /**
         * 从输入系统取消虚拟输入的注册。在轮询VirtualInput之后调用这个函数
         */
        public deregister() {
            new es.List(Input._virtualInputs).remove(this);
        }

        public abstract update(): void;
    }

    /**
     * 将它们添加到您的VirtualInput中，以定义它如何确定当前输入状态。
     * 例如，如果你想检查一个键盘键是否被按下，创建一个VirtualButton并添加一个VirtualButton.keyboardkey
     */
    export abstract class VirtualInputNode {
        public update() { }
    }
}