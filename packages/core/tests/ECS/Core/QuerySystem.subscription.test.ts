import { QuerySystem } from '../../../src/ECS/Core/QuerySystem';
import { QueryHandle, IQueryHandle, QueryCondition } from '../../../src/ECS/Core/QuerySystem/QueryHandle';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry, ComponentType } from '../../../src/ECS/Core/ComponentStorage';

// 测试组件
class PositionComponent extends Component {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

class VelocityComponent extends Component {
    public vx: number;
    public vy: number;

    constructor(vx: number = 0, vy: number = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
    }
}

class HealthComponent extends Component {
    public health: number;

    constructor(health: number = 100) {
        super();
        this.health = health;
    }
}

describe('QuerySystem - 订阅式查询机制', () => {
    let querySystem: QuerySystem;
    let entity1: Entity;
    let entity2: Entity;
    let entity3: Entity;

    beforeEach(() => {
        // 重置组件注册表
        ComponentRegistry.clear();

        // 注册测试组件
        ComponentRegistry.registerComponent(PositionComponent);
        ComponentRegistry.registerComponent(VelocityComponent);
        ComponentRegistry.registerComponent(HealthComponent);

        querySystem = new QuerySystem();

        // 创建测试实体
        entity1 = new Entity();
        entity1.addComponent(new PositionComponent(10, 20));
        entity1.addComponent(new VelocityComponent(1, 2));

        entity2 = new Entity();
        entity2.addComponent(new PositionComponent(30, 40));
        entity2.addComponent(new HealthComponent(80));

        entity3 = new Entity();
        entity3.addComponent(new VelocityComponent(3, 4));
        entity3.addComponent(new HealthComponent(60));

        // 添加实体到查询系统
        querySystem.addEntity(entity1);
        querySystem.addEntity(entity2);
        querySystem.addEntity(entity3);
    });

    describe('QueryHandle 创建和基本功能', () => {
        it('应该能够创建QueryHandle并获取初始实体', () => {
            const condition: QueryCondition = {
                all: [PositionComponent]
            };

            const handle = querySystem.createQueryHandle(condition);

            expect(handle).toBeDefined();
            expect(handle.entities).toHaveLength(2);
            expect(handle.entities).toContain(entity1);
            expect(handle.entities).toContain(entity2);
            expect(handle.destroyed).toBe(false);
        });

        it('应该能够订阅实体变更事件', () => {
            const condition: QueryCondition = {
                all: [VelocityComponent]
            };

            const handle = querySystem.createQueryHandle(condition);
            const addedEvents: any[] = [];
            const removedEvents: any[] = [];

            handle.subscribe(event => {
                if (event.type === 'added') {
                    addedEvents.push(event);
                } else if (event.type === 'removed') {
                    removedEvents.push(event);
                }
            });

            // 添加新实体
            const newEntity = new Entity();
            newEntity.addComponent(new VelocityComponent(5, 6));
            querySystem.addEntity(newEntity);

            expect(addedEvents).toHaveLength(1);
            expect(addedEvents[0].entity).toBe(newEntity);
            expect(addedEvents[0].type).toBe('added');

            // 移除实体
            querySystem.removeEntity(entity1);

            expect(removedEvents).toHaveLength(1);
            expect(removedEvents[0].entity).toBe(entity1);
            expect(removedEvents[0].type).toBe('removed');
        });

        it('应该能够销毁QueryHandle', () => {
            const condition: QueryCondition = {
                all: [PositionComponent]
            };

            const handle = querySystem.createQueryHandle(condition);
            expect(handle.destroyed).toBe(false);

            querySystem.destroyQueryHandle(handle);
            expect(handle.destroyed).toBe(true);
        });
    });

    describe('复合查询条件', () => {
        it('应该支持复合查询条件 - all + none', () => {
            const condition: QueryCondition = {
                all: [PositionComponent],
                none: [VelocityComponent]
            };

            const handle = querySystem.createQueryHandle(condition);

            // 应该只匹配entity2（有Position但没有Velocity）
            expect(handle.entities).toHaveLength(1);
            expect(handle.entities).toContain(entity2);
            expect(handle.entities).not.toContain(entity1);
            expect(handle.entities).not.toContain(entity3);
        });

        it('应该支持any查询条件', () => {
            const condition: QueryCondition = {
                any: [PositionComponent, HealthComponent]
            };

            const handle = querySystem.createQueryHandle(condition);

            // 应该匹配所有实体（每个都有Position或Health）
            expect(handle.entities).toHaveLength(3);
            expect(handle.entities).toContain(entity1);
            expect(handle.entities).toContain(entity2);
            expect(handle.entities).toContain(entity3);
        });
    });

    describe('性能优化验证', () => {
        it('应该避免每次查询时重新分配内存', () => {
            const condition: QueryCondition = {
                all: [PositionComponent]
            };

            const handle = querySystem.createQueryHandle(condition);
            const firstEntities = handle.entities;
            const secondEntities = handle.entities;

            // 应该返回相同的数组引用（缓存）
            expect(firstEntities).toBe(secondEntities);
        });

        it('应该在实体变更时才更新缓存', () => {
            const condition: QueryCondition = {
                all: [VelocityComponent]
            };

            const handle = querySystem.createQueryHandle(condition);
            const initialEntities = handle.entities;
            const initialLength = initialEntities.length;

            // 多次访问entities不应改变引用
            expect(handle.entities).toBe(initialEntities);

            // 添加新实体后应该更新缓存
            const newEntity = new Entity();
            newEntity.addComponent(new VelocityComponent(7, 8));
            querySystem.addEntity(newEntity);

            const updatedEntities = handle.entities;
            expect(updatedEntities).not.toBe(initialEntities);
            expect(updatedEntities.length).toBe(initialLength + 1);
        });
    });

    describe('多订阅者支持', () => {
        it('应该支持多个订阅者', () => {
            const condition: QueryCondition = {
                all: [PositionComponent]
            };

            const handle = querySystem.createQueryHandle(condition);
            const subscriber1Events: any[] = [];
            const subscriber2Events: any[] = [];

            handle.subscribe(event => subscriber1Events.push(event));
            handle.subscribe(event => subscriber2Events.push(event));

            // 添加新实体
            const newEntity = new Entity();
            newEntity.addComponent(new PositionComponent(100, 200));
            querySystem.addEntity(newEntity);

            // 两个订阅者都应该收到事件
            expect(subscriber1Events).toHaveLength(1);
            expect(subscriber2Events).toHaveLength(1);
            expect(subscriber1Events[0].entity).toBe(newEntity);
            expect(subscriber2Events[0].entity).toBe(newEntity);
        });

        it('应该支持取消订阅', () => {
            const condition: QueryCondition = {
                all: [VelocityComponent]
            };

            const handle = querySystem.createQueryHandle(condition);
            const events: any[] = [];

            const unsubscribe = handle.subscribe(event => events.push(event));

            // 添加实体，应该收到事件
            const newEntity1 = new Entity();
            newEntity1.addComponent(new VelocityComponent(1, 1));
            querySystem.addEntity(newEntity1);

            expect(events).toHaveLength(1);

            // 取消订阅
            unsubscribe();

            // 再次添加实体，不应该收到事件
            const newEntity2 = new Entity();
            newEntity2.addComponent(new VelocityComponent(2, 2));
            querySystem.addEntity(newEntity2);

            expect(events).toHaveLength(1); // 还是之前的1个事件
        });
    });

    describe('边界情况处理', () => {
        it('应该处理空查询条件', () => {
            const condition: QueryCondition = {};

            const handle = querySystem.createQueryHandle(condition);

            // 空条件应该匹配所有实体
            expect(handle.entities.length).toBeGreaterThan(0);
        });

        it('应该处理不匹配任何实体的查询条件', () => {
            // 创建一个不存在的组件类型查询
            class NonExistentComponent extends Component {}
            ComponentRegistry.registerComponent(NonExistentComponent);

            const condition: QueryCondition = {
                all: [NonExistentComponent]
            };

            const handle = querySystem.createQueryHandle(condition);

            expect(handle.entities).toHaveLength(0);
        });

        it('应该处理QueryHandle销毁后的订阅', () => {
            const condition: QueryCondition = {
                all: [PositionComponent]
            };

            const handle = querySystem.createQueryHandle(condition);
            
            querySystem.destroyQueryHandle(handle);

            // 销毁后不应该能再订阅
            expect(() => {
                handle.subscribe(() => {});
            }).toThrow();
        });
    });
});