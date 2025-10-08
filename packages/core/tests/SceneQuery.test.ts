/**
 * Scene查询方法测试
 */

import { Component } from '../src/ECS/Component';
import { Entity } from '../src/ECS/Entity';
import { Scene } from '../src/ECS/Scene';
import { Core } from '../src/Core';
import { ECSComponent } from '../src/ECS/Decorators';
import { EntitySystem } from '../src/ECS/Systems/EntitySystem';

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

@ECSComponent('Disabled')
class Disabled extends Component {}

describe('Scene查询方法', () => {
    let scene: Scene;

    beforeEach(() => {
        Core.create({ debug: false, enableEntitySystems: true });
        scene = new Scene();
        scene.initialize();
    });

    afterEach(() => {
        scene.end();
    });

    describe('基础查询方法', () => {
        test('queryAll 查询拥有所有组件的实体', () => {
            const e1 = scene.createEntity('E1');
            e1.addComponent(new Position(10, 20));
            e1.addComponent(new Velocity(1, 2));

            const e2 = scene.createEntity('E2');
            e2.addComponent(new Position(30, 40));

            const result = scene.queryAll(Position, Velocity);

            expect(result.entities).toHaveLength(1);
            expect(result.entities[0]).toBe(e1);
        });

        test('queryAny 查询拥有任意组件的实体', () => {
            const e1 = scene.createEntity('E1');
            e1.addComponent(new Position(10, 20));

            const e2 = scene.createEntity('E2');
            e2.addComponent(new Velocity(1, 2));

            const e3 = scene.createEntity('E3');
            e3.addComponent(new Disabled());

            const result = scene.queryAny(Position, Velocity);

            expect(result.entities).toHaveLength(2);
        });

        test('queryNone 查询不包含指定组件的实体', () => {
            const e1 = scene.createEntity('E1');
            e1.addComponent(new Position(10, 20));

            const e2 = scene.createEntity('E2');
            e2.addComponent(new Position(30, 40));
            e2.addComponent(new Disabled());

            const result = scene.queryNone(Disabled);

            expect(result.entities).toHaveLength(1);
            expect(result.entities[0]).toBe(e1);
        });
    });

    describe('TypedQueryBuilder', () => {
        test('scene.query() 创建类型安全的查询构建器', () => {
            const e1 = scene.createEntity('E1');
            e1.addComponent(new Position(10, 20));
            e1.addComponent(new Velocity(1, 2));

            const e2 = scene.createEntity('E2');
            e2.addComponent(new Position(30, 40));
            e2.addComponent(new Velocity(3, 4));
            e2.addComponent(new Disabled());

            // 构建查询
            const query = scene.query()
                .withAll(Position, Velocity)
                .withNone(Disabled);

            const matcher = query.buildMatcher();

            // 创建System使用这个matcher
            class TestSystem extends EntitySystem {
                public processedCount = 0;

                constructor() {
                    super(matcher);
                }

                protected override process(entities: readonly Entity[]): void {
                    this.processedCount = entities.length;
                }
            }

            const system = new TestSystem();
            scene.addSystem(system);
            scene.update();

            // 应该只处理e1（e2被Disabled排除）
            expect(system.processedCount).toBe(1);
        });

        test('TypedQueryBuilder 支持复杂查询', () => {
            const e1 = scene.createEntity('E1');
            e1.addComponent(new Position(10, 20));
            e1.tag = 100;

            const e2 = scene.createEntity('E2');
            e2.addComponent(new Position(30, 40));
            e2.tag = 200;

            const query = scene.query()
                .withAll(Position)
                .withTag(100);

            const condition = query.getCondition();

            expect(condition.all).toContain(Position as any);
            expect(condition.tag).toBe(100);
        });
    });
});
