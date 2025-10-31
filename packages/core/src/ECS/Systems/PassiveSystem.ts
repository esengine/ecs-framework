import { EntitySystem } from './EntitySystem';
import { Entity } from '../Entity';
import { Matcher } from '../Utils/Matcher';

/**
 * 被动实体系统
 * 定义一个被动的实体系统，继承自EntitySystem类
 * 被动的实体系统不会对实体进行任何修改，只会被动地接收实体的变化事件
 */
export abstract class PassiveSystem extends EntitySystem {

    constructor(matcher?: Matcher) {
        super(matcher);
    }

    /**
     * 不进行任何处理
     * @param entities 实体数组，未被使用
     */
    protected override process(_entities: Entity[]): void {
        // 被动系统不进行任何处理
    }
}
