import { EntitySystem } from './EntitySystem';
import { Entity } from '../Entity';

/**
 * 被动实体系统
 * 定义一个被动的实体系统，继承自EntitySystem类
 * 被动的实体系统不会对实体进行任何修改，只会被动地接收实体的变化事件
 */
export abstract class PassiveSystem extends EntitySystem {
    /**
     * 当实体发生变化时，不进行任何操作
     * @param entity 发生变化的实体
     */
    public override onChanged(entity: Entity): void { }

    /**
     * 不进行任何处理
     * @param entities 实体数组，未被使用
     */
    protected override process(entities: Entity[]): void {
        // 被动系统不进行任何处理
    }
}
