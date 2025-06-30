import type { IComponent } from '../Types';

/**
 * 游戏组件基类
 * 
 * ECS架构中的组件（Component），用于实现具体的游戏功能。
 * 组件包含数据和行为，可以被添加到实体上以扩展实体的功能。
 * 
 * @example
 * ```typescript
 * class HealthComponent extends Component {
 *     public health: number = 100;
 *     
 *     public takeDamage(damage: number): void {
 *         this.health -= damage;
 *         if (this.health <= 0) {
 *             this.entity.destroy();
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
     * 组件所属的实体
     * 
     * 指向拥有此组件的实体实例。
     */
    public entity!: Entity;
    
    /**
     * 组件启用状态
     * 
     * 控制组件是否参与更新循环。
     */
    private _enabled: boolean = true;
    
    /**
     * 更新顺序
     * 
     * 决定组件在更新循环中的执行顺序。
     */
    private _updateOrder: number = 0;

    /**
     * 创建组件实例
     * 
     * 自动分配唯一ID给组件。
     */
    constructor() {
        this.id = Component._idGenerator++;
    }

    /**
     * 获取组件启用状态
     * 
     * 组件的实际启用状态取决于自身状态和所属实体的状态。
     * 
     * @returns 如果组件和所属实体都启用则返回true
     */
    public get enabled(): boolean {
        return this.entity ? this.entity.enabled && this._enabled : this._enabled;
    }

    /**
     * 设置组件启用状态
     * 
     * 当状态改变时会触发相应的生命周期回调。
     * 
     * @param value - 新的启用状态
     */
    public set enabled(value: boolean) {
        if (this._enabled !== value) {
            this._enabled = value;
            if (this._enabled) {
                this.onEnabled();
            } else {
                this.onDisabled();
            }
        }
    }

    /**
     * 获取更新顺序
     * 
     * @returns 组件的更新顺序值
     */
    public get updateOrder(): number {
        return this._updateOrder;
    }

    /**
     * 设置更新顺序
     * 
     * @param value - 新的更新顺序值
     */
    public set updateOrder(value: number) {
        this._updateOrder = value;
    }

    /**
     * 组件添加到实体时的回调
     * 
     * 当组件被添加到实体时调用，可以在此方法中进行初始化操作。
     */
    public onAddedToEntity(): void {
    }

    /**
     * 组件从实体移除时的回调
     * 
     * 当组件从实体中移除时调用，可以在此方法中进行清理操作。
     */
    public onRemovedFromEntity(): void {
    }

    /**
     * 组件启用时的回调
     * 
     * 当组件被启用时调用。
     */
    public onEnabled(): void {
    }

    /**
     * 组件禁用时的回调
     * 
     * 当组件被禁用时调用。
     */
    public onDisabled(): void {
    }

    /**
     * 更新组件
     * 
     * 每帧调用，用于更新组件的逻辑。
     * 子类应该重写此方法来实现具体的更新逻辑。
     */
    public update(): void {
    }
}

// 避免循环引用，在文件末尾导入Entity
import type { Entity } from './Entity'; 