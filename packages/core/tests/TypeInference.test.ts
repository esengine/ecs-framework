/**
 * TypeScript类型推断测试
 *
 * 验证组件类型自动推断功能
 */

import { Component } from '../src/ECS/Component';
import { Entity } from '../src/ECS/Entity';
import { Scene } from '../src/ECS/Scene';
import { Core } from '../src/Core';
import { ECSComponent } from '../src/ECS/Decorators';
import { requireComponent, tryGetComponent, getComponents } from '../src/ECS/TypedEntity';

// 测试组件
@ECSComponent('Position')
class Position extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

@ECSComponent('Velocity')
class Velocity extends Component {
    constructor(public dx: number = 0, public dy: number = 0) {
        super();
    }
}

@ECSComponent('Health')
class Health extends Component {
    constructor(public value: number = 100, public maxValue: number = 100) {
        super();
    }
}

describe('TypeScript类型推断', () => {
    let scene: Scene;
    let entity: Entity;

    beforeEach(() => {
        Core.create({ debug: false, enableEntitySystems: true });
        scene = new Scene();
        scene.initialize();
        entity = scene.createEntity('TestEntity');
    });

    afterEach(() => {
        scene.end();
    });

    describe('Entity.getComponent 类型推断', () => {
        test('getComponent 应该自动推断正确的返回类型', () => {
            entity.addComponent(new Position(100, 200));

            // 类型推断为 Position | null
            const position = entity.getComponent(Position);

            // TypeScript应该知道position可能为null
            expect(position).not.toBeNull();

            // 在null检查后，TypeScript应该知道position是Position类型
            if (position) {
                expect(position.x).toBe(100);
                expect(position.y).toBe(200);

                // 这些操作应该有完整的类型提示
                position.x += 10;
                position.y += 20;

                expect(position.x).toBe(110);
                expect(position.y).toBe(220);
            }
        });

        test('getComponent 返回null时类型安全', () => {
            // 实体没有Velocity组件
            const velocity = entity.getComponent(Velocity);

            // 应该返回null
            expect(velocity).toBeNull();
        });

        test('多个不同类型组件的类型推断', () => {
            entity.addComponent(new Position(10, 20));
            entity.addComponent(new Velocity(1, 2));
            entity.addComponent(new Health(100));

            const pos = entity.getComponent(Position);
            const vel = entity.getComponent(Velocity);
            const health = entity.getComponent(Health);

            // 所有组件都应该被正确推断
            if (pos && vel && health) {
                // Position类型的字段
                pos.x = 50;
                pos.y = 60;

                // Velocity类型的字段
                vel.dx = 5;
                vel.dy = 10;

                // Health类型的字段
                health.value = 80;
                health.maxValue = 150;

                expect(pos.x).toBe(50);
                expect(vel.dx).toBe(5);
                expect(health.value).toBe(80);
            }
        });
    });

    describe('Entity.createComponent 类型推断', () => {
        test('createComponent 应该自动推断返回类型', () => {
            // 应该推断为Position类型（非null）
            const position = entity.createComponent(Position, 100, 200);

            expect(position).toBeInstanceOf(Position);
            expect(position.x).toBe(100);
            expect(position.y).toBe(200);

            // 应该有完整的类型提示
            position.x = 300;
            expect(position.x).toBe(300);
        });
    });

    describe('Entity.hasComponent 类型守卫', () => {
        test('hasComponent 可以用作类型守卫', () => {
            entity.addComponent(new Position(10, 20));

            if (entity.hasComponent(Position)) {
                // 在这个作用域内，我们知道组件存在
                const pos = entity.getComponent(Position)!;
                pos.x = 100;
                expect(pos.x).toBe(100);
            }
        });
    });

    describe('Entity.getOrCreateComponent 类型推断', () => {
        test('getOrCreateComponent 应该自动推断返回类型', () => {
            // 第一次调用：创建新组件
            const position1 = entity.getOrCreateComponent(Position, 50, 60);
            expect(position1.x).toBe(50);
            expect(position1.y).toBe(60);

            // 第二次调用：返回已存在的组件
            const position2 = entity.getOrCreateComponent(Position, 100, 200);

            // 应该是同一个组件
            expect(position2).toBe(position1);
            expect(position2.x).toBe(50); // 值未改变
        });
    });

    describe('TypedEntity工具函数类型推断', () => {
        test('requireComponent 返回非空类型', () => {
            entity.addComponent(new Position(100, 200));

            // requireComponent 返回非null类型
            const position = requireComponent(entity, Position);

            // 不需要null检查
            expect(position.x).toBe(100);
            position.x = 300;
            expect(position.x).toBe(300);
        });

        test('tryGetComponent 返回可选类型', () => {
            entity.addComponent(new Position(50, 50));

            const position = tryGetComponent(entity, Position);

            // 应该返回组件
            expect(position).toBeDefined();
            if (position) {
                expect(position.x).toBe(50);
            }

            // 不存在的组件返回undefined
            const velocity = tryGetComponent(entity, Velocity);
            expect(velocity).toBeUndefined();
        });

        test('getComponents 批量获取组件', () => {
            entity.addComponent(new Position(10, 20));
            entity.addComponent(new Velocity(1, 2));
            entity.addComponent(new Health(100));

            const [pos, vel, health] = getComponents(entity, Position, Velocity, Health);

            // 应该推断为数组类型
            expect(pos).not.toBeNull();
            expect(vel).not.toBeNull();
            expect(health).not.toBeNull();

            if (pos && vel && health) {
                expect(pos.x).toBe(10);
                expect(vel.dx).toBe(1);
                expect(health.value).toBe(100);
            }
        });
    });
});
