import type { IComponent } from '../Types';

/**
 * 游戏组件基类
 *
 * ECS架构中的组件（Component）应该是纯数据容器。
 * 所有游戏逻辑应该在 EntitySystem 中实现，而不是在组件内部。
 *
 * @example
 * 推荐做法：纯数据组件
 * ```typescript
 * class HealthComponent extends Component {
 *     public health: number = 100;
 *     public maxHealth: number = 100;
 * }
 * ```
 *
 * @example
 * 推荐做法：在 System 中处理逻辑
 * ```typescript
 * class HealthSystem extends EntitySystem {
 *     process(entities: Entity[]): void {
 *         for (const entity of entities) {
 *             const health = entity.getComponent(HealthComponent);
 *             if (health && health.health <= 0) {
 *                 entity.destroy();
 *             }
 *         }
 *     }
 * }
 * ```
 */
export abstract class Component implements IComponent {
    /**
     * 组件ID生成器
     *
     * 用于为每个组件分配唯一的ID。
     */
    public static _idGenerator: number = 0;

    /**
     * 组件唯一标识符
     *
     * 在整个游戏生命周期中唯一的数字ID。
     */
    public readonly id: number;

    /**
     * 所属实体ID
     *
     * 存储实体ID而非引用，避免循环引用，符合ECS数据导向设计。
     */
    public entityId: number | null = null;

    /**
     * 创建组件实例
     *
     * 自动分配唯一ID给组件。
     */
    constructor() {
        this.id = Component._idGenerator++;
    }

    /**
     * 组件添加到实体时的回调
     *
     * 当组件被添加到实体时调用，可以在此方法中进行初始化操作。
     *
     * @remarks
     * 这是一个生命周期钩子，用于组件的初始化逻辑。
     * 虽然保留此方法，但建议将复杂的初始化逻辑放在 System 中处理。
     */
    public onAddedToEntity(): void {
    }

    /**
     * 组件从实体移除时的回调
     *
     * 当组件从实体中移除时调用，可以在此方法中进行清理操作。
     *
     * @remarks
     * 这是一个生命周期钩子，用于组件的清理逻辑。
     * 虽然保留此方法，但建议将复杂的清理逻辑放在 System 中处理。
     */
    public onRemovedFromEntity(): void {
    }

}