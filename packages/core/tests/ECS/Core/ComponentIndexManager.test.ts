import { EntityManager } from '../../../src/ECS/Core/EntityManager';
import { ComponentTypeManager } from '../../../src/ECS/Utils/ComponentTypeManager';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';

// 测试用组件
class TestComponent extends Component {
    public value: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        if (args.length >= 1) this.value = args[0] as number;
    }
}

class AnotherTestComponent extends Component {
    public name: string = 'test';
    
    constructor(...args: unknown[]) {
        super();
        if (args.length >= 1) this.name = args[0] as string;
    }
}

describe('ComponentIndexManager功能测试', () => {
    let entityManager: EntityManager;

    beforeEach(() => {
        ComponentTypeManager.instance.reset();
        entityManager = new EntityManager();
    });

    describe('基本功能测试', () => {
        test('应该能够正确创建空实体', () => {
            const entity = entityManager.createEntity('TestEntity');
            
            expect(entity).toBeDefined();
            expect(entity.name).toBe('TestEntity');
            expect(entity.components.length).toBe(0);
            expect(entity.id).toBeGreaterThanOrEqual(0);
        });

        test('应该能够正确管理实体的组件索引', () => {
            const entity = entityManager.createEntity('TestEntity');
            const component = new TestComponent(42);
            
            // 添加组件前
            expect(entity.hasComponent(TestComponent)).toBe(false);
            
            // 添加组件
            entity.addComponent(component);
            
            // 添加组件后
            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.getComponent(TestComponent)).toBe(component);
            expect(entity.components.length).toBe(1);
        });

        test('应该能够正确处理组件查询', () => {
            const entity1 = entityManager.createEntity('Entity1');
            const entity2 = entityManager.createEntity('Entity2');
            
            entity1.addComponent(new TestComponent(1));
            entity2.addComponent(new TestComponent(2));
            entity2.addComponent(new AnotherTestComponent('test2'));
            
            // 查询包含TestComponent的实体
            const entitiesWithTest = entityManager.getEntitiesWithComponent(TestComponent);
            expect(entitiesWithTest).toHaveLength(2);
            expect(entitiesWithTest).toContain(entity1);
            expect(entitiesWithTest).toContain(entity2);
            
            // 查询包含AnotherTestComponent的实体
            const entitiesWithAnother = entityManager.getEntitiesWithComponent(AnotherTestComponent);
            expect(entitiesWithAnother).toHaveLength(1);
            expect(entitiesWithAnother).toContain(entity2);
        });

        test('应该能够正确处理复杂查询', () => {
            const entity1 = entityManager.createEntity('Entity1');
            const entity2 = entityManager.createEntity('Entity2');
            const entity3 = entityManager.createEntity('Entity3');
            
            // entity1: TestComponent
            entity1.addComponent(new TestComponent(1));
            
            // entity2: TestComponent + AnotherTestComponent
            entity2.addComponent(new TestComponent(2));
            entity2.addComponent(new AnotherTestComponent('test2'));
            
            // entity3: AnotherTestComponent
            entity3.addComponent(new AnotherTestComponent('test3'));
            
            // AND查询：同时包含两个组件的实体
            const bothComponents = entityManager.queryWithComponentIndex(
                [TestComponent, AnotherTestComponent], 
                'AND'
            );
            expect(bothComponents.size).toBe(1);
            expect(bothComponents.has(entity2)).toBe(true);
            
            // OR查询：包含任一组件的实体
            const eitherComponent = entityManager.queryWithComponentIndex(
                [TestComponent, AnotherTestComponent], 
                'OR'
            );
            expect(eitherComponent.size).toBe(3);
            expect(eitherComponent.has(entity1)).toBe(true);
            expect(eitherComponent.has(entity2)).toBe(true);
            expect(eitherComponent.has(entity3)).toBe(true);
        });
    });

    describe('组件移除功能测试', () => {
        test('应该能够手动管理组件索引', () => {
            const entity1 = entityManager.createEntity('TestEntity1');
            const entity2 = entityManager.createEntity('TestEntity2');
            const component1 = new TestComponent(42);
            const component2 = new TestComponent(84);
            
            // 添加组件到实体
            entity1.addComponent(component1);
            entity2.addComponent(component2);
            
            // 手动将实体添加到索引
            entityManager['_componentIndexManager'].addEntity(entity1);
            entityManager['_componentIndexManager'].addEntity(entity2);
            
            // 验证能够查询到实体
            let entitiesWithTest = entityManager.getEntitiesWithComponent(TestComponent);
            expect(entitiesWithTest).toHaveLength(2);
            expect(entitiesWithTest).toContain(entity1);
            expect(entitiesWithTest).toContain(entity2);
            
            // 手动移除一个实体的索引
            entityManager['_componentIndexManager'].removeEntity(entity1);
            
            // 验证只能查询到剩余的实体
            entitiesWithTest = entityManager.getEntitiesWithComponent(TestComponent);
            expect(entitiesWithTest).toHaveLength(1);
            expect(entitiesWithTest[0]).toBe(entity2);
        });

        test('应该能够正确处理实体销毁', () => {
            const entity = entityManager.createEntity('TestEntity');
            entity.addComponent(new TestComponent(42));
            
            // 确认实体存在且有组件
            expect(entityManager.getEntity(entity.id)).toBe(entity);
            expect(entityManager.getEntitiesWithComponent(TestComponent)).toHaveLength(1);
            
            // 销毁实体
            const destroyed = entityManager.destroyEntity(entity);
            expect(destroyed).toBe(true);
            
            // 确认实体被正确销毁
            expect(entityManager.getEntity(entity.id)).toBeNull();
            expect(entityManager.getEntitiesWithComponent(TestComponent)).toHaveLength(0);
        });
    });

    describe('批量操作功能测试', () => {
        test('应该能够正确处理批量创建实体', () => {
            const entities = entityManager.createEntitiesBatch(5, 'BatchEntity');
            
            expect(entities).toHaveLength(5);
            entities.forEach((entity, index) => {
                expect(entity.name).toMatch(/^BatchEntity_\d+$/);
                expect(entity.components.length).toBe(0);
                expect(entityManager.getEntity(entity.id)).toBe(entity);
            });
            
            expect(entityManager.entityCount).toBe(5);
        });

        test('批量创建的实体应该有正确的索引', () => {
            const entities = entityManager.createEntitiesBatch(3, 'IndexTest');
            
            // 给第一个和第三个实体添加组件
            entities[0].addComponent(new TestComponent(1));
            entities[2].addComponent(new TestComponent(3));
            
            const entitiesWithTest = entityManager.getEntitiesWithComponent(TestComponent);
            expect(entitiesWithTest).toHaveLength(2);
            expect(entitiesWithTest).toContain(entities[0]);
            expect(entitiesWithTest).toContain(entities[2]);
        });
    });

    describe('查询构建器功能测试', () => {
        test('应该能够使用查询构建器进行复杂查询', () => {
            const entity1 = entityManager.createEntity('Active1');
            const entity2 = entityManager.createEntity('Active2');
            const entity3 = entityManager.createEntity('Inactive');
            
            entity1.addComponent(new TestComponent(1));
            entity1.active = true;
            
            entity2.addComponent(new TestComponent(2));
            entity2.addComponent(new AnotherTestComponent('test2'));
            entity2.active = true;
            
            entity3.addComponent(new TestComponent(3));
            entity3.active = false;
            
            // 查询激活状态且包含TestComponent的实体
            const activeWithTest = entityManager.query()
                .withAll(TestComponent)
                .active()
                .execute();
                
            expect(activeWithTest).toHaveLength(2);
            expect(activeWithTest).toContain(entity1);
            expect(activeWithTest).toContain(entity2);
            expect(activeWithTest).not.toContain(entity3);
            
            // 查询同时包含两个组件的实体
            const withBothComponents = entityManager.query()
                .withAll(TestComponent, AnotherTestComponent)
                .execute();
                
            expect(withBothComponents).toHaveLength(1);
            expect(withBothComponents).toContain(entity2);
        });

        test('查询构建器应该支持自定义过滤条件', () => {
            const entity1 = entityManager.createEntity('Player1');
            const entity2 = entityManager.createEntity('Enemy1');
            const entity3 = entityManager.createEntity('Player2');
            
            entity1.addComponent(new TestComponent(100));
            entity2.addComponent(new TestComponent(50));
            entity3.addComponent(new TestComponent(200));
            
            // 查询名称以"Player"开头且TestComponent值大于150的实体
            const strongPlayers = entityManager.query()
                .withAll(TestComponent)
                .where(entity => entity.name.startsWith('Player'))
                .where(entity => {
                    const testComp = entity.getComponent(TestComponent);
                    return testComp !== null && testComp.value > 150;
                })
                .execute();
                
            expect(strongPlayers).toHaveLength(1);
            expect(strongPlayers).toContain(entity3);
        });
    });

    describe('统计信息功能测试', () => {
        test('应该能够获取正确的统计信息', () => {
            // 创建一些实体和组件
            const entity1 = entityManager.createEntity('StatTest1');
            const entity2 = entityManager.createEntity('StatTest2');
            
            entity1.addComponent(new TestComponent(1));
            entity2.addComponent(new TestComponent(2));
            entity2.addComponent(new AnotherTestComponent('test'));
            
            const stats = entityManager.getOptimizationStats();
            
            expect(stats).toBeDefined();
            expect(stats.componentIndex).toBeDefined();
            expect(stats.archetypeSystem).toBeDefined();
            expect(stats.dirtyTracking).toBeDefined();
        });

        test('应该能够正确统计实体数量', () => {
            expect(entityManager.entityCount).toBe(0);
            expect(entityManager.activeEntityCount).toBe(0);
            
            const entity1 = entityManager.createEntity('Count1');
            const entity2 = entityManager.createEntity('Count2');
            
            expect(entityManager.entityCount).toBe(2);
            expect(entityManager.activeEntityCount).toBe(2);
            
            entity1.active = false;
            expect(entityManager.activeEntityCount).toBe(1);
            
            entityManager.destroyEntity(entity2);
            expect(entityManager.entityCount).toBe(1);
            expect(entityManager.activeEntityCount).toBe(0);
        });
    });

    describe('边界情况测试', () => {
        test('应该能够处理空组件列表的查询', () => {
            const entity = entityManager.createEntity('EmptyTest');
            
            const emptyQuery = entityManager.queryWithComponentIndex([], 'AND');
            expect(emptyQuery.size).toBe(0);
            
            const emptyOrQuery = entityManager.queryWithComponentIndex([], 'OR');
            expect(emptyOrQuery.size).toBe(0);
        });

        test('应该能够处理不存在的组件类型查询', () => {
            class NonExistentComponent extends Component {}
            
            const entities = entityManager.getEntitiesWithComponent(NonExistentComponent);
            expect(entities).toHaveLength(0);
        });

        test('应该能够处理重复添加相同组件类型', () => {
            const entity = entityManager.createEntity('DuplicateTest');
            const component1 = new TestComponent(1);
            const component2 = new TestComponent(2);
            
            entity.addComponent(component1);
            expect(() => entity.addComponent(component2)).toThrow();
            
            // 第一个组件应该仍然存在
            expect(entity.getComponent(TestComponent)).toBe(component1);
        });
    });
});