import { QuerySystem } from '../../../src/ECS/Core/QuerySystem';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { Core } from '../../../src/Core';

// 测试组件
class TestComponent extends Component {
    public value: number;

    constructor(value: number = 0) {
        super();
        this.value = value;
    }
}

describe('QuerySystem - 确定性排序优化测试', () => {
    let querySystem: QuerySystem;
    let entities: Entity[] = [];

    beforeAll(() => {
        // 启用确定性排序
        Core.deterministicSortingEnabled = true;
    });

    afterAll(() => {
        // 恢复默认设置
        Core.deterministicSortingEnabled = false;
    });

    beforeEach(() => {
        ComponentRegistry.reset();
        ComponentRegistry.register(TestComponent);

        querySystem = new QuerySystem();
        entities = [];

        // 创建一些测试实体（故意不按ID顺序添加）
        const entityIds = [5, 1, 3, 8, 2, 7, 4, 6];
        for (const id of entityIds) {
            const entity = new Entity(`entity_${id}`, id);
            entity.addComponent(new TestComponent(id));
            entities.push(entity);
            querySystem.addEntity(entity);
        }
    });

    describe('QueryHandle确定性排序', () => {
        it('应该在创建QueryHandle时返回按ID排序的实体', () => {
            const matcher = Matcher.all(TestComponent);
            const queryHandle = (querySystem as any).createQueryHandleFromMatcher(matcher);

            const resultEntities = Array.from(queryHandle.entities as Set<Entity>);
            
            // 验证排序
            for (let i = 1; i < resultEntities.length; i++) {
                expect(resultEntities[i].id).toBeGreaterThan(resultEntities[i - 1].id);
            }

            // 验证包含所有实体
            expect(resultEntities).toHaveLength(8);
            expect(resultEntities.map(e => e.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        });

        it('应该在实体添加后保持排序', () => {
            const matcher = Matcher.all(TestComponent);
            const queryHandle = (querySystem as any).createQueryHandleFromMatcher(matcher);

            // 添加一个新实体（ID在中间）
            const newEntity = new Entity('new_entity', 4.5);
            newEntity.addComponent(new TestComponent(100));
            querySystem.addEntity(newEntity);

            const resultEntities = Array.from(queryHandle.entities as Set<Entity>);
            
            // 验证排序仍然正确
            for (let i = 1; i < resultEntities.length; i++) {
                expect(resultEntities[i].id).toBeGreaterThan(resultEntities[i - 1].id);
            }

            expect(resultEntities).toHaveLength(9);
        });

        it('应该在实体移除后保持排序', () => {
            const matcher = Matcher.all(TestComponent);
            const queryHandle = (querySystem as any).createQueryHandleFromMatcher(matcher);

            // 移除一个实体
            querySystem.removeEntity(entities[2]); // 移除ID=3的实体

            const resultEntities = Array.from(queryHandle.entities as Set<Entity>);
            
            // 验证排序仍然正确
            for (let i = 1; i < resultEntities.length; i++) {
                expect(resultEntities[i].id).toBeGreaterThan(resultEntities[i - 1].id);
            }

            expect(resultEntities).toHaveLength(7);
            expect(resultEntities.map(e => e.id)).toEqual([1, 2, 4, 5, 6, 7, 8]);
        });
    });

    describe('性能优化验证', () => {
        it('QueryHandle内的排序应该只在实体变更时执行', () => {
            const matcher = Matcher.all(TestComponent);
            const queryHandle = (querySystem as any).createQueryHandleFromMatcher(matcher);

            // 监控sort调用次数
            const originalSort = Array.prototype.sort;
            let sortCallCount = 0;
            
            Array.prototype.sort = function(compareFn) {
                if (this.length > 0 && this[0] && typeof this[0].id === 'number') {
                    sortCallCount++;
                }
                return originalSort.call(this, compareFn);
            };

            try {
                // 多次访问entities不应该触发额外排序
                const initialSortCalls = sortCallCount;
                queryHandle.entities;
                queryHandle.entities;
                queryHandle.entities;
                
                expect(sortCallCount).toBe(initialSortCalls);

                // 只有在实体变更时才应该排序
                const newEntity = new Entity('new_entity', 100);
                newEntity.addComponent(new TestComponent(999));
                querySystem.addEntity(newEntity);

                expect(sortCallCount).toBeGreaterThan(initialSortCalls);

            } finally {
                Array.prototype.sort = originalSort;
            }
        });

        it('多个QueryHandle应该独立维护排序', () => {
            const matcher1 = Matcher.all(TestComponent);
            const matcher2 = Matcher.all(TestComponent);
            
            const queryHandle1 = (querySystem as any).createQueryHandleFromMatcher(matcher1);
            const queryHandle2 = (querySystem as any).createQueryHandleFromMatcher(matcher2);

            const entities1 = Array.from(queryHandle1.entities as Set<Entity>);
            const entities2 = Array.from(queryHandle2.entities as Set<Entity>);

            // 两个QueryHandle应该都返回排序的结果
            expect(entities1.map(e => e.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
            expect(entities2.map(e => e.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

            // 但它们应该是不同的数组实例
            expect(entities1).not.toBe(entities2);
        });
    });

    describe('确定性排序配置测试', () => {
        it('禁用确定性排序时不应该排序', () => {
            Core.deterministicSortingEnabled = false;

            const matcher = Matcher.all(TestComponent);
            const queryHandle = (querySystem as any).createQueryHandleFromMatcher(matcher);
            const resultEntities = Array.from(queryHandle.entities as Set<Entity>);

            // 由于禁用了排序，实体顺序可能不是按ID排序的
            expect(resultEntities).toHaveLength(8);
            
            // 重新启用排序以便后续测试
            Core.deterministicSortingEnabled = true;
        });
    });
});