module es {
    export enum CoreEvents {
        /**
         * 当场景发生变化时触发
         */
        sceneChanged,
        /**
         * 每帧更新事件
         */
        frameUpdated,
        /**
         * 当渲染发生时触发
         */
        renderChanged,
        /**
         * 当zIndex发生改变时触发
         */
        zIndexChanged,
    }
}
