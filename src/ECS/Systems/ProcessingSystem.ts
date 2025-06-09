import { EntitySystem } from './EntitySystem';
import { Entity } from '../Entity';

/**
 * 处理系统抽象类
 * 定义一个处理实体的抽象类，继承自EntitySystem类
 * 子类需要实现processSystem方法，用于实现具体的处理逻辑
 */
export abstract class ProcessingSystem extends EntitySystem {
    /**
     * 当实体发生变化时，不进行任何操作
     * @param entity 发生变化的实体
     */
    public override onChanged(entity: Entity): void { }

    /**
     * 处理实体，每帧调用processSystem方法进行处理
     * @param entities 实体数组，未被使用
     */
    protected override process(entities: Entity[]): void {
        // 调用子类实现的processSystem方法进行实体处理
        this.processSystem();
    }

    /**
     * 处理实体的具体方法，由子类实现
     */
    public abstract processSystem(): void;
}
