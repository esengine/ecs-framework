/**
 * 点击特效组件 - 在点击位置播放粒子效果
 * Click FX Component - Play particle effects at click position
 *
 * @example
 * ```typescript
 * // 在编辑器中添加此组件到相机或空实体上
 * // Add this component to camera or empty entity in editor
 *
 * // 配置粒子资产列表，点击时会轮换播放
 * // Configure particle asset list, will cycle through on click
 * clickFx.particleAssets = ['guid1', 'guid2', 'guid3'];
 * ```
 */

import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 点击特效触发模式
 * Click FX trigger mode
 */
export enum ClickFxTriggerMode {
    /** 鼠标左键点击 | Left mouse button click */
    LeftClick = 'leftClick',
    /** 鼠标右键点击 | Right mouse button click */
    RightClick = 'rightClick',
    /** 任意鼠标按钮 | Any mouse button */
    AnyClick = 'anyClick',
    /** 触摸 | Touch */
    Touch = 'touch',
    /** 鼠标和触摸都响应 | Both mouse and touch */
    All = 'all'
}

/**
 * 点击特效组件
 * Click FX Component
 *
 * 在用户点击/触摸屏幕时，在点击位置播放粒子效果。
 * Plays particle effects at the click/touch position when user interacts.
 */
@ECSComponent('ClickFx')
@Serializable({ version: 1, typeId: 'ClickFx' })
export class ClickFxComponent extends Component {
    /**
     * 粒子资产 GUID 列表
     * List of particle asset GUIDs
     *
     * 多个资产会轮换播放，实现多样化的点击效果。
     * Multiple assets will cycle through for varied click effects.
     */
    @Serialize()
    @Property({
        type: 'array',
        label: 'Particle Assets',
        itemType: { type: 'asset', extensions: ['.particle', '.particle.json'] },
        reorderable: true
    })
    public particleAssets: string[] = [];

    /**
     * 触发模式
     * Trigger mode
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Trigger Mode',
        options: [
            { label: 'Left Click', value: ClickFxTriggerMode.LeftClick },
            { label: 'Right Click', value: ClickFxTriggerMode.RightClick },
            { label: 'Any Click', value: ClickFxTriggerMode.AnyClick },
            { label: 'Touch', value: ClickFxTriggerMode.Touch },
            { label: 'All', value: ClickFxTriggerMode.All }
        ]
    })
    public triggerMode: ClickFxTriggerMode = ClickFxTriggerMode.All;

    /**
     * 是否启用
     * Whether enabled
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Enabled' })
    public fxEnabled: boolean = true;

    /**
     * 最大同时播放数量
     * Maximum concurrent effects
     *
     * 限制同时播放的粒子效果数量，防止性能问题。
     * Limits concurrent particle effects to prevent performance issues.
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Max Concurrent', min: 1, max: 50 })
    public maxConcurrent: number = 10;

    /**
     * 粒子效果生命周期（秒）
     * Particle effect lifetime in seconds
     *
     * 效果播放多长时间后自动销毁。
     * How long before the effect is automatically destroyed.
     */
    @Serialize()
    @Property({ type: 'number', label: 'Effect Lifetime', min: 0.1, max: 30, step: 0.1 })
    public effectLifetime: number = 3;

    /**
     * 位置偏移（相对于点击位置）
     * Position offset (relative to click position)
     */
    @Serialize()
    @Property({ type: 'vector2', label: 'Position Offset' })
    public positionOffset: { x: number; y: number } = { x: 0, y: 0 };

    /**
     * 缩放
     * Scale
     */
    @Serialize()
    @Property({ type: 'number', label: 'Scale', min: 0.1, max: 10, step: 0.1 })
    public scale: number = 1;

    // ============= 运行时状态（不序列化）| Runtime state (not serialized) =============

    /** 当前粒子索引 | Current particle index */
    private _currentIndex: number = 0;

    /** 活跃的特效实体 ID 列表 | Active effect entity IDs */
    private _activeEffects: { entityId: number; startTime: number }[] = [];

    /**
     * 获取下一个要播放的粒子资产 GUID
     * Get next particle asset GUID to play
     */
    public getNextParticleAsset(): string | null {
        if (this.particleAssets.length === 0) {
            return null;
        }

        const guid = this.particleAssets[this._currentIndex];
        this._currentIndex = (this._currentIndex + 1) % this.particleAssets.length;
        return guid;
    }

    /**
     * 添加活跃特效
     * Add active effect
     */
    public addActiveEffect(entityId: number): void {
        this._activeEffects.push({ entityId, startTime: Date.now() });
    }

    /**
     * 获取活跃特效列表
     * Get active effects list
     */
    public getActiveEffects(): ReadonlyArray<{ entityId: number; startTime: number }> {
        return this._activeEffects;
    }

    /**
     * 移除活跃特效
     * Remove active effect
     */
    public removeActiveEffect(entityId: number): void {
        const index = this._activeEffects.findIndex(e => e.entityId === entityId);
        if (index !== -1) {
            this._activeEffects.splice(index, 1);
        }
    }

    /**
     * 清除所有活跃特效记录
     * Clear all active effect records
     */
    public clearActiveEffects(): void {
        this._activeEffects = [];
    }

    /**
     * 获取活跃特效数量
     * Get active effect count
     */
    public get activeEffectCount(): number {
        return this._activeEffects.length;
    }

    /**
     * 是否可以添加新特效
     * Whether can add new effect
     */
    public canAddEffect(): boolean {
        return this._activeEffects.length < this.maxConcurrent;
    }

    /**
     * 重置状态
     * Reset state
     */
    public reset(): void {
        this._currentIndex = 0;
        this._activeEffects = [];
    }

    override onRemovedFromEntity(): void {
        this.reset();
    }
}
