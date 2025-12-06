import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';

/**
 * 流式锚点组件
 *
 * Marks an entity as a streaming anchor point.
 * Chunks are loaded/unloaded based on distance to anchors.
 *
 * 标记实体作为流式加载锚点。通常挂载在玩家或摄像机实体上，
 * 系统会根据锚点位置加载/卸载周围区块。
 */
@ECSComponent('StreamingAnchor')
@Serializable({ version: 1, typeId: 'StreamingAnchor' })
export class StreamingAnchorComponent extends Component {
    /**
     * 锚点权重
     *
     * Weight multiplier for this anchor's load radius.
     * Higher values mean larger load radius around this anchor.
     */
    @Serialize()
    @Property({ type: 'number', label: 'Weight', min: 0.1, max: 10 })
    weight: number = 1.0;

    /**
     * 是否启用预加载
     *
     * Enable directional prefetching based on movement.
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Enable Prefetch' })
    bEnablePrefetch: boolean = true;

    /**
     * 上一帧位置 X
     *
     * Previous frame X position for velocity calculation.
     */
    previousX: number = 0;

    /**
     * 上一帧位置 Y
     *
     * Previous frame Y position for velocity calculation.
     */
    previousY: number = 0;

    /**
     * 速度 X 分量
     *
     * X component of velocity (units per second).
     */
    velocityX: number = 0;

    /**
     * 速度 Y 分量
     *
     * Y component of velocity (units per second).
     */
    velocityY: number = 0;
}
