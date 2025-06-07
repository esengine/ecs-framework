/**
 * 核心事件枚举
 * 定义框架中的核心事件类型
 */
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
}
