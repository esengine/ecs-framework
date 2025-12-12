/**
 * 点击特效系统 - 处理点击输入并生成粒子效果
 * Click FX System - Handles click input and spawns particle effects
 *
 * 监听用户点击/触摸事件，在点击位置创建粒子效果实体。
 * Listens for user click/touch events and creates particle effect entities at click position.
 */

import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { Input, MouseButton, TransformComponent, PluginServiceRegistry, createServiceToken } from '@esengine/engine-core';
import { ClickFxComponent, ClickFxTriggerMode } from '../ClickFxComponent';
import { ParticleSystemComponent } from '../ParticleSystemComponent';

/**
 * EngineBridge 接口（最小定义，用于坐标转换）
 * EngineBridge interface (minimal definition for coordinate conversion)
 */
interface IEngineBridge {
    screenToWorld(screenX: number, screenY: number): { x: number; y: number };
}

// 定义 EngineBridge 的服务令牌（与 ecs-engine-bindgen 中的一致）
// Define EngineBridge service token (consistent with ecs-engine-bindgen)
const EngineBridgeToken = createServiceToken<IEngineBridge>('engineBridge');

/**
 * 点击特效系统
 * Click FX System
 *
 * @example
 * ```typescript
 * // 在场景中添加系统
 * scene.addSystem(new ClickFxSystem());
 *
 * // 创建带有 ClickFxComponent 的实体
 * const clickFxEntity = scene.createEntity('ClickFx');
 * const clickFx = clickFxEntity.addComponent(new ClickFxComponent());
 * clickFx.particleAssets = ['particle-guid-1', 'particle-guid-2'];
 * ```
 */
@ECSSystem('ClickFx', { updateOrder: 100 })
export class ClickFxSystem extends EntitySystem {
    private _engineBridge: IEngineBridge | null = null;
    private _entitiesToDestroy: Entity[] = [];
    private _canvas: HTMLCanvasElement | null = null;

    constructor() {
        super(Matcher.empty().all(ClickFxComponent));
    }

    /**
     * 设置服务注册表（用于获取 EngineBridge）
     * Set service registry (for getting EngineBridge)
     */
    setServiceRegistry(services: PluginServiceRegistry): void {
        this._engineBridge = services.get(EngineBridgeToken) ?? null;
    }

    /**
     * 设置 EngineBridge（直接注入）
     * Set EngineBridge (direct injection)
     */
    setEngineBridge(bridge: IEngineBridge): void {
        this._engineBridge = bridge;
    }

    /**
     * 设置 Canvas 元素（用于计算相对坐标）
     * Set canvas element (for calculating relative coordinates)
     */
    setCanvas(canvas: HTMLCanvasElement): void {
        this._canvas = canvas;
    }

    /**
     * 检查是否应该处理
     * Check if should process
     *
     * 只在运行时模式（非编辑器模式）下处理点击事件
     * Only process click events in runtime mode (not editor mode)
     */
    protected override onCheckProcessing(): boolean {
        // 编辑器模式下不处理（预览时也不处理，只有 Play 模式才处理）
        // Don't process in editor mode (including preview, only in Play mode)
        if (this.scene?.isEditorMode) {
            return false;
        }
        return super.onCheckProcessing();
    }

    protected override process(entities: readonly Entity[]): void {
        // 处理延迟销毁 | Process delayed destruction
        if (this._entitiesToDestroy.length > 0 && this.scene) {
            this.scene.destroyEntities(this._entitiesToDestroy);
            this._entitiesToDestroy = [];
        }

        for (const entity of entities) {
            const clickFx = entity.getComponent(ClickFxComponent);
            if (!clickFx || !clickFx.fxEnabled) continue;

            // 清理过期的特效 | Clean up expired effects
            this._cleanupExpiredEffects(clickFx);

            // 检查触发条件 | Check trigger conditions
            const triggered = this._checkTrigger(clickFx);
            if (!triggered) continue;

            // 检查是否可以添加新特效 | Check if can add new effect
            if (!clickFx.canAddEffect()) continue;

            // 获取点击/触摸位置 | Get click/touch position
            const screenPos = this._getInputPosition(clickFx);
            if (!screenPos) continue;

            // 转换为世界坐标 | Convert to world coordinates
            const worldPos = this._screenToWorld(screenPos.x, screenPos.y);

            // 应用偏移 | Apply offset
            worldPos.x += clickFx.positionOffset.x;
            worldPos.y += clickFx.positionOffset.y;

            // 创建粒子效果 | Create particle effect
            this._spawnEffect(clickFx, worldPos.x, worldPos.y);
        }
    }

    /**
     * 屏幕坐标转世界坐标
     * Screen to world coordinate conversion
     */
    private _screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        // 将窗口坐标转换为 canvas 相对坐标
        // Convert window coordinates to canvas-relative coordinates
        let canvasX = screenX;
        let canvasY = screenY;

        if (this._canvas) {
            const rect = this._canvas.getBoundingClientRect();
            // 计算 CSS 坐标 | Calculate CSS coordinates
            canvasX = screenX - rect.left;
            canvasY = screenY - rect.top;

            // 使用 canvas 实际尺寸与 CSS 尺寸的比例来缩放
            // 这样不管是否使用 DPR，都能正确处理
            // Use the ratio of canvas actual size to CSS size for scaling
            // This works correctly regardless of DPR usage
            const scaleX = this._canvas.width / rect.width;
            const scaleY = this._canvas.height / rect.height;
            canvasX *= scaleX;
            canvasY *= scaleY;
        }

        // 使用 EngineBridge 进行坐标转换（考虑相机位置、缩放、旋转）
        // Use EngineBridge for coordinate conversion (considers camera position, zoom, rotation)
        if (this._engineBridge) {
            return this._engineBridge.screenToWorld(canvasX, canvasY);
        }

        // 回退：简单的坐标转换（假设无相机偏移）
        // Fallback: simple conversion (assumes no camera offset)
        const width = this._canvas?.width ?? 800;
        const height = this._canvas?.height ?? 600;
        return {
            x: canvasX - width / 2,
            y: height / 2 - canvasY  // Y 轴翻转 | Flip Y axis
        };
    }

    /**
     * 检查触发条件
     * Check trigger conditions
     */
    private _checkTrigger(clickFx: ClickFxComponent): boolean {
        const mode = clickFx.triggerMode;

        switch (mode) {
            case ClickFxTriggerMode.LeftClick:
                return Input.isMouseButtonJustPressed(MouseButton.Left);

            case ClickFxTriggerMode.RightClick:
                return Input.isMouseButtonJustPressed(MouseButton.Right);

            case ClickFxTriggerMode.AnyClick:
                return Input.isMouseButtonJustPressed(MouseButton.Left) ||
                       Input.isMouseButtonJustPressed(MouseButton.Middle) ||
                       Input.isMouseButtonJustPressed(MouseButton.Right);

            case ClickFxTriggerMode.Touch:
                return this._checkTouchStart();

            case ClickFxTriggerMode.All:
                return Input.isMouseButtonJustPressed(MouseButton.Left) ||
                       Input.isMouseButtonJustPressed(MouseButton.Middle) ||
                       Input.isMouseButtonJustPressed(MouseButton.Right) ||
                       this._checkTouchStart();

            default:
                return false;
        }
    }

    /**
     * 检查是否有新的触摸开始
     * Check if there's a new touch start
     */
    private _checkTouchStart(): boolean {
        for (const [id] of Input.touches) {
            if (Input.isTouchJustStarted(id)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取输入位置
     * Get input position
     */
    private _getInputPosition(clickFx: ClickFxComponent): { x: number; y: number } | null {
        const mode = clickFx.triggerMode;

        // 优先检查触摸 | Check touch first
        if (mode === ClickFxTriggerMode.Touch || mode === ClickFxTriggerMode.All) {
            for (const [id, touch] of Input.touches) {
                if (Input.isTouchJustStarted(id)) {
                    return { x: touch.x, y: touch.y };
                }
            }
        }

        // 检查鼠标 | Check mouse
        if (mode !== ClickFxTriggerMode.Touch) {
            return { x: Input.mousePosition.x, y: Input.mousePosition.y };
        }

        return null;
    }

    /**
     * 生成粒子效果
     * Spawn particle effect
     */
    private _spawnEffect(clickFx: ClickFxComponent, worldX: number, worldY: number): void {
        const particleGuid = clickFx.getNextParticleAsset();
        if (!particleGuid) {
            console.warn('[ClickFxSystem] No particle assets configured');
            return;
        }

        if (!this.scene) {
            console.warn('[ClickFxSystem] No scene available');
            return;
        }

        // 创建特效实体 | Create effect entity
        const effectEntity = this.scene.createEntity(`ClickFx_${Date.now()}`);

        // 添加 Transform | Add Transform
        const transform = effectEntity.addComponent(new TransformComponent(worldX, worldY));
        transform.setScale(clickFx.scale, clickFx.scale, 1);

        // 添加 ParticleSystem | Add ParticleSystem
        const particleSystem = effectEntity.addComponent(new ParticleSystemComponent());
        particleSystem.particleAssetGuid = particleGuid;
        particleSystem.autoPlay = true;

        // 记录活跃特效 | Record active effect
        clickFx.addActiveEffect(effectEntity.id);

        // 异步加载并播放 | Async load and play
        particleSystem.loadAsset(particleGuid).then(success => {
            if (success) {
                particleSystem.play();
            } else {
                console.warn(`[ClickFxSystem] Failed to load particle asset: ${particleGuid}`);
            }
        });
    }

    /**
     * 清理过期的特效
     * Clean up expired effects
     */
    private _cleanupExpiredEffects(clickFx: ClickFxComponent): void {
        if (!this.scene) return;

        const now = Date.now();
        const lifetimeMs = clickFx.effectLifetime * 1000;
        const effectsToRemove: number[] = [];

        for (const effect of clickFx.getActiveEffects()) {
            const age = now - effect.startTime;

            if (age >= lifetimeMs) {
                // 标记为需要移除 | Mark for removal
                effectsToRemove.push(effect.entityId);

                // 查找并销毁实体 | Find and destroy entity
                const entity = this.scene.findEntityById(effect.entityId);
                if (entity) {
                    // 停止粒子系统 | Stop particle system
                    const particleSystem = entity.getComponent(ParticleSystemComponent);
                    if (particleSystem) {
                        particleSystem.stop(true);
                    }

                    // 添加到销毁队列 | Add to destroy queue
                    this._entitiesToDestroy.push(entity);
                }
            }
        }

        // 从记录中移除 | Remove from records
        for (const entityId of effectsToRemove) {
            clickFx.removeActiveEffect(entityId);
        }
    }

    protected override onDestroy(): void {
        // 清理所有特效 | Clean up all effects
        if (this.scene) {
            const entities = this.scene.entities.buffer;
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                const clickFx = entity.getComponent(ClickFxComponent);
                if (clickFx) {
                    for (const effect of clickFx.getActiveEffects()) {
                        const effectEntity = this.scene.findEntityById(effect.entityId);
                        if (effectEntity) {
                            this._entitiesToDestroy.push(effectEntity);
                        }
                    }
                    clickFx.clearActiveEffects();
                }
            }

            // 立即销毁 | Destroy immediately
            if (this._entitiesToDestroy.length > 0) {
                this.scene.destroyEntities(this._entitiesToDestroy);
                this._entitiesToDestroy = [];
            }
        }
    }
}
