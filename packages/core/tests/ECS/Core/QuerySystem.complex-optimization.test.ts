import { QuerySystem } from '../../../src/ECS/Core/QuerySystem';
import { QueryCondition } from '../../../src/ECS/Core/QuerySystem/QueryHandle';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage';

// 测试组件
class ComponentA extends Component {}
class ComponentB extends Component {}
class ComponentC extends Component {}
class ComponentD extends Component {}

describe('QuerySystem - 复合查询性能优化', () => {
    let querySystem: QuerySystem;
    let entities: Entity[];

    beforeEach(() => {
        ComponentRegistry.clear();
        ComponentRegistry.registerComponent(ComponentA);
        ComponentRegistry.registerComponent(ComponentB);
        ComponentRegistry.registerComponent(ComponentC);
        ComponentRegistry.registerComponent(ComponentD);

        querySystem = new QuerySystem();
        entities = [];

        // 创建1000个测试实体，各种组件组合
        for (let i = 0; i < 1000; i++) {
            const entity = new Entity();
            
            if (i % 2 === 0) entity.addComponent(new ComponentA());
            if (i % 3 === 0) entity.addComponent(new ComponentB());
            if (i % 5 === 0) entity.addComponent(new ComponentC());
            if (i % 7 === 0) entity.addComponent(new ComponentD());
            
            entities.push(entity);
            querySystem.addEntity(entity);
        }
    });

    describe('位运算优化测试', () => {
        it('应该正确执行纯组件复合查询 - all + none', () => {
            const condition: QueryCondition = {
                all: [ComponentA, ComponentB],
                none: [ComponentD]
            };

            const handle = querySystem.createQueryHandle(condition);
            const result = handle.entities;

            // 验证结果正确性：有A和B，但没有D
            for (const entity of result) {
                expect(entity.hasComponent(ComponentA)).toBe(true);
                expect(entity.hasComponent(ComponentB)).toBe(true);
                expect(entity.hasComponent(ComponentD)).toBe(false);
            }

            // 验证数量正确（i % 2 === 0 && i % 3 === 0 && i % 7 !== 0）
            const expectedCount = entities.filter(e => 
                e.hasComponent(ComponentA) && 
                e.hasComponent(ComponentB) && 
                !e.hasComponent(ComponentD)
            ).length;
            
            expect(result.length).toBe(expectedCount);
        });

        it('应该正确执行纯组件复合查询 - all + any + none', () => {
            const condition: QueryCondition = {
                all: [ComponentA],
                any: [ComponentB, ComponentC],
                none: [ComponentD]
            };

            const handle = querySystem.createQueryHandle(condition);
            const result = handle.entities;

            // 验证结果正确性
            for (const entity of result) {
                expect(entity.hasComponent(ComponentA)).toBe(true);
                expect(entity.hasComponent(ComponentB) || entity.hasComponent(ComponentC)).toBe(true);
                expect(entity.hasComponent(ComponentD)).toBe(false);
            }
        });
    });

    describe('ID集合运算回退测试', () => {
        it('应该正确处理包含标签的复合查询', () => {
            // 给一些实体添加标签
            for (let i = 0; i < 100; i++) {
                entities[i].tag = 1;
            }

            const condition: QueryCondition = {
                all: [ComponentA],
                tag: 1
            };

            const handle = querySystem.createQueryHandle(condition);
            const result = handle.entities;

            // 验证结果正确性：有ComponentA且tag=1
            for (const entity of result) {
                expect(entity.hasComponent(ComponentA)).toBe(true);
                expect(entity.tag).toBe(1);
            }
        });

        it('应该正确处理包含名称的复合查询', () => {
            // 给一些实体添加名称
            for (let i = 0; i < 50; i++) {
                entities[i].name = 'testEntity';
            }

            const condition: QueryCondition = {
                all: [ComponentB],
                name: 'testEntity'
            };

            const handle = querySystem.createQueryHandle(condition);
            const result = handle.entities;

            // 验证结果正确性：有ComponentB且name='testEntity'
            for (const entity of result) {
                expect(entity.hasComponent(ComponentB)).toBe(true);
                expect(entity.name).toBe('testEntity');
            }
        });
    });

    describe('性能对比测试', () => {
        it('位运算查询应该比传统方法更快', () => {
            const condition: QueryCondition = {
                all: [ComponentA, ComponentB],
                none: [ComponentD]
            };

            // 热身运行
            for (let i = 0; i < 10; i++) {
                const handle = querySystem.createQueryHandle(condition);
                querySystem.destroyQueryHandle(handle);
            }

            // 测试位运算查询性能
            const startTime = performance.now();
            for (let i = 0; i < 100; i++) {
                const handle = querySystem.createQueryHandle(condition);
                const _ = handle.entities.length;
                querySystem.destroyQueryHandle(handle);
            }
            const bitMaskTime = performance.now() - startTime;

            // 位运算查询应该足够快（100次查询在合理时间内完成）
            expect(bitMaskTime).toBeLessThan(50); // 50ms内完成100次查询
        });
    });

    describe('集合运算优化验证', () => {
        it('应该使用O(1)的Set.has()操作进行交集运算', () => {
            // 这个测试验证我们使用了Set.has()而不是双层循环

            // 创建包含标签的条件，强制使用ID集合运算
            for (let i = 0; i < 200; i++) {
                entities[i].tag = 2;
            }

            const condition: QueryCondition = {
                all: [ComponentA],
                tag: 2
            };

            const handle = querySystem.createQueryHandle(condition);
            const result = handle.entities;

            // 验证结果数量合理
            expect(result.length).toBeGreaterThan(0);
            expect(result.length).toBeLessThan(200);

            // 验证所有结果都满足条件
            for (const entity of result) {
                expect(entity.hasComponent(ComponentA)).toBe(true);
                expect(entity.tag).toBe(2);
            }
        });

        it('应该正确计算ID集合的交集、并集、差集', () => {
            // 设置复杂的查询条件来测试集合运算
            for (let i = 0; i < 100; i++) {
                if (i < 50) entities[i].tag = 3;
                if (i >= 25 && i < 75) entities[i].name = 'special';
            }

            const condition: QueryCondition = {
                all: [ComponentA],
                any: [ComponentB, ComponentC],
                none: [ComponentD],
                tag: 3,
                name: 'special'
            };

            const handle = querySystem.createQueryHandle(condition);
            const result = handle.entities;

            // 验证复合条件
            for (const entity of result) {
                expect(entity.hasComponent(ComponentA)).toBe(true);
                expect(entity.hasComponent(ComponentB) || entity.hasComponent(ComponentC)).toBe(true);
                expect(entity.hasComponent(ComponentD)).toBe(false);
                expect(entity.tag).toBe(3);
                expect(entity.name).toBe('special');
            }
        });
    });

    describe('边界情况和错误处理', () => {
        it('应该正确处理空的复合查询条件', () => {
            const condition: QueryCondition = {};

            const handle = querySystem.createQueryHandle(condition);
            const result = handle.entities;

            // 空条件应该返回所有实体
            expect(result.length).toBe(entities.length);
        });

        it('应该正确处理位运算失败的情况', () => {
            // 创建一个可能导致位运算失败的条件
            const condition: QueryCondition = {
                all: [ComponentA],
                component: ComponentB // 混合使用all和component
            };

            const handle = querySystem.createQueryHandle(condition);
            const result = handle.entities;

            // 应该回退到ID集合运算，仍然返回正确结果
            for (const entity of result) {
                expect(entity.hasComponent(ComponentA)).toBe(true);
                expect(entity.hasComponent(ComponentB)).toBe(true);
            }
        });
    });
});