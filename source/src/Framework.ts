///<reference path="./Utils/Emitter.ts" />
module es {
    /**
     * 这里作为框架的核心件
     * 全局函数移动到这
     */
    export class Framework {
        /**
         * 核心发射器。只发出核心级别的事件
         */
        public static emitter: Emitter<CoreEvents> = new Emitter<CoreEvents>();
        public static batcher: IBatcher;
    }
}