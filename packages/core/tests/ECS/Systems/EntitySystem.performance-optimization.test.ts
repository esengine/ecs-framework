import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage';
import { QuerySystem } from '../../../src/ECS/Core/QuerySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { Scene } from '../../../src/ECS/Scene';
import { Core } from '../../../src/Core';

// 测试组件
class TestComponent extends Component {
    public value: number;

    constructor(value: number = 0) {
        super();
        this.value = value;
    }
}

// 测试系统
class TestEntitySystem extends EntitySystem {
    constructor() {
        super(Matcher.all(TestComponent));
    }

    protected override process(entities: Entity[]): void {
        // 简单的处理逻辑
    }
}

describe('EntitySystem - 性能优化验证', () => {
    let scene: Scene;
    let querySystem: QuerySystem;
    let testSystem: TestEntitySystem;
    let entities: Entity[] = [];

    beforeAll(() => {
        Core.deterministicSortingEnabled = true;
    });

    afterAll(() => {
        Core.deterministicSortingEnabled = false;
    });

    beforeEach(() => {
        ComponentRegistry.reset();
        ComponentRegistry.register(TestComponent);

        scene = new Scene();
        querySystem = new QuerySystem();
        (scene as any).querySystem = querySystem;

        testSystem = new TestEntitySystem();
        testSystem.scene = scene;

        // 创建测试实体
        entities = [];
        for (let i = 0; i < 20; i++) {
            const entity = new Entity(`entity_${i}`, i);
            entity.addComponent(new TestComponent(i));
            entities.push(entity);
            querySystem.addEntity(entity);
        }

        testSystem.initialize();
    });

    describe('排序优化验证', () => {
        it('EntitySystem不应该在update时进行排序', () => {
            const originalSort = Array.prototype.sort;
            let sortCallCount = 0;
            
            // 监控所有数组的sort调用
            Array.prototype.sort = function(compareFn) {
                // 只统计实体数组的排序
                if (this.length > 0 && this[0] && typeof this[0].id === 'number') {
                    sortCallCount++;
                }
                return originalSort.call(this, compareFn);
            };

            try {
                const initialSortCalls = sortCallCount;

                // 多次调用update不应该触发排序
                testSystem.update();
                testSystem.update();
                testSystem.update();
                testSystem.fixedUpdate();
                testSystem.lateUpdate();

                // EntitySystem的update方法不应该触发额外排序
                expect(sortCallCount).toBe(initialSortCalls);

            } finally {
                Array.prototype.sort = originalSort;
            }
        });

        it('EntitySystem的缓存实体列表应该已经是排序的', () => {
            const cachedEntities = testSystem.entities;
            
            // 验证实体是按ID排序的
            for (let i = 1; i < cachedEntities.length; i++) {
                expect(cachedEntities[i].id).toBeGreaterThan(cachedEntities[i - 1].id);
            }

            expect(cachedEntities.map(e => e.id)).toEqual(
                Array.from({ length: 20 }, (_, i) => i)
            );
        });

        it('多次访问entities属性应该返回相同引用', () => {
            const entitiesRef1 = testSystem.entities;
            const entitiesRef2 = testSystem.entities;
            const entitiesRef3 = testSystem.entities;

            // 应该返回相同的数组引用（缓存）
            expect(entitiesRef1).toBe(entitiesRef2);
            expect(entitiesRef2).toBe(entitiesRef3);
        });
    });

    describe('性能基准测试', () => {
        it('大量update调用应该保持高效', () => {
            // 添加更多实体增加测试强度
            for (let i = 20; i < 100; i++) {
                const entity = new Entity(`entity_${i}`, i);
                entity.addComponent(new TestComponent(i));
                querySystem.addEntity(entity);
            }

            const startTime = performance.now();
            
            // 执行大量update调用
            for (let i = 0; i < 1000; i++) {
                testSystem.update();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;

            // 1000次update应该在合理时间内完成（不超过50ms）
            expect(duration).toBeLessThan(50);
            
            console.log(`1000次EntitySystem.update()用时: ${duration.toFixed(2)}ms`);
        });

        it('实体变更时的排序成本应该很低', () => {
            const startTime = performance.now();

            // 添加一些新实体
            for (let i = 0; i < 10; i++) {
                const entity = new Entity(`new_entity_${i}`, 1000 + i);
                entity.addComponent(new TestComponent(1000 + i));
                querySystem.addEntity(entity);
            }

            // 移除一些实体
            for (let i = 0; i < 5; i++) {
                querySystem.removeEntity(entities[i]);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            // 实体变更操作应该很快完成
            expect(duration).toBeLessThan(10);
            
            // 验证排序仍然正确
            const finalEntities = testSystem.entities;
            for (let i = 1; i < finalEntities.length; i++) {
                expect(finalEntities[i].id).toBeGreaterThan(finalEntities[i - 1].id);
            }
        });
    });
});