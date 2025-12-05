/**
 * 实体生命周期策略
 *
 * 定义实体在场景切换时的行为。
 *
 * Entity lifecycle policy.
 * Defines entity behavior during scene transitions.
 */
export const enum EEntityLifecyclePolicy {
    /**
     * 默认策略 - 随场景销毁
     *
     * Default policy - destroyed with scene.
     */
    SceneLocal = 0,

    /**
     * 持久化策略 - 跨场景保留
     *
     * 实体在场景切换时自动迁移到新场景。
     *
     * Persistent policy - survives scene transitions.
     * Entity is automatically migrated to the new scene.
     */
    Persistent = 1
}
