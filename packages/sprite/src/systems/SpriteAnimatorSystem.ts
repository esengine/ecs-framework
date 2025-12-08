import { EntitySystem, Matcher, ECSSystem, Time, Entity } from '@esengine/ecs-framework';
import { SpriteAnimatorComponent } from '../SpriteAnimatorComponent';
import { SpriteComponent } from '../SpriteComponent';

/**
 * 精灵动画系统 - 更新所有精灵动画
 * Sprite animator system - updates all sprite animations
 */
@ECSSystem('SpriteAnimator', { updateOrder: 50 })
export class SpriteAnimatorSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(SpriteAnimatorComponent));
    }

    /**
     * 系统初始化时调用
     * Called when system is initialized
     */
    protected override onInitialize(): void {
        // System initialized
    }

    /**
     * 每帧开始时调用
     * Called at the beginning of each frame
     */
    protected override onBegin(): void {
        // Frame begin
    }

    /**
     * 处理匹配的实体
     * Process matched entities
     */
    protected override process(entities: readonly Entity[]): void {
        const deltaTime = Time.deltaTime;

        for (const entity of entities) {
            if (!entity.enabled) continue;

            const animator = entity.getComponent(SpriteAnimatorComponent) as SpriteAnimatorComponent | null;
            if (!animator) continue;

            // Only call update if playing
            if (animator.isPlaying()) {
                animator.update(deltaTime);
            }

            // Sync current frame to sprite component (always, even if not playing)
            const sprite = entity.getComponent(SpriteComponent) as SpriteComponent | null;
            if (sprite) {
                const frame = animator.getCurrentFrame();
                if (frame) {
                    sprite.textureGuid = frame.textureGuid;

                    // Update UV if specified
                    if (frame.uv) {
                        sprite.uv = frame.uv;
                    }
                }
            }
        }
    }

    /**
     * 实体添加到系统时调用
     * Called when entity is added to system
     */
    protected override onAdded(entity: Entity): void {
        const animator = entity.getComponent(SpriteAnimatorComponent) as SpriteAnimatorComponent | null;
        if (animator && animator.autoPlay && animator.defaultAnimation) {
            animator.play();
        }
    }

    /**
     * 实体从系统移除时调用
     * Called when entity is removed from system
     */
    protected override onRemoved(entity: Entity): void {
        const animator = entity.getComponent(SpriteAnimatorComponent) as SpriteAnimatorComponent | null;
        if (animator) {
            animator.stop();
        }
    }
}
