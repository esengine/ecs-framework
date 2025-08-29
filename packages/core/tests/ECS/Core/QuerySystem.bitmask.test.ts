import { QuerySystem } from '../../../src/ECS/Core/QuerySystem';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage';
import { Matcher } from '../../../src/ECS/Utils/Matcher';

// 测试组件
class TransformComponent extends Component {}
class VelocityComponent extends Component {}
class HealthComponent extends Component {}
class DeadComponent extends Component {}

describe('QuerySystem - 位掩码查询测试', () => {
    let querySystem: QuerySystem;
    let entities: Entity[];

    beforeEach(() => {
        ComponentRegistry.reset();
        ComponentRegistry.register(TransformComponent);
        ComponentRegistry.register(VelocityComponent);
        ComponentRegistry.register(HealthComponent);
        ComponentRegistry.register(DeadComponent);

        querySystem = new QuerySystem();
        entities = [];

        // 创建测试实体
        for (let i = 0; i < 20; i++) {
            const entity = new Entity(`entity_${i}`, i);
            
            // 给实体添加不同的组件组合
            if (i % 2 === 0) entity.addComponent(new TransformComponent());
            if (i % 3 === 0) entity.addComponent(new VelocityComponent());
            if (i % 5 === 0) entity.addComponent(new HealthComponent());
            if (i % 7 === 0) entity.addComponent(new DeadComponent());
            
            entities.push(entity);
            querySystem.addEntity(entity);
        }
    });

    describe('位掩码查询执行', () => {
        it('应该执行简单的all位掩码查询', () => {
            const matcher = Matcher.all(TransformComponent);
            const bitCondition = matcher.getBitMaskCondition();
            
            const result = querySystem.executeBitMaskQuery(bitCondition);

            // 验证结果正确性
            const expected = entities.filter(e => e.hasComponent(TransformComponent));
            expect(result.length).toBe(expected.length);
            
            for (const entity of result) {
                expect(entity.hasComponent(TransformComponent)).toBe(true);
            }
        });

        it('应该执行复合all位掩码查询', () => {
            const matcher = Matcher.all(TransformComponent, VelocityComponent);
            const bitCondition = matcher.getBitMaskCondition();
            
            const result = querySystem.executeBitMaskQuery(bitCondition);

            // 验证结果：同时有Transform和Velocity组件的实体
            const expected = entities.filter(e => 
                e.hasComponent(TransformComponent) && 
                e.hasComponent(VelocityComponent)
            );
            expect(result.length).toBe(expected.length);

            for (const entity of result) {
                expect(entity.hasComponent(TransformComponent)).toBe(true);
                expect(entity.hasComponent(VelocityComponent)).toBe(true);
            }
        });

        it('应该执行none位掩码查询', () => {
            const matcher = Matcher.none(DeadComponent);
            const bitCondition = matcher.getBitMaskCondition();
            
            const result = querySystem.executeBitMaskQuery(bitCondition);

            // 验证结果：没有Dead组件的实体
            const expected = entities.filter(e => !e.hasComponent(DeadComponent));
            expect(result.length).toBe(expected.length);

            for (const entity of result) {
                expect(entity.hasComponent(DeadComponent)).toBe(false);
            }
        });

        it('应该执行any位掩码查询', () => {
            const matcher = Matcher.any(HealthComponent, DeadComponent);
            const bitCondition = matcher.getBitMaskCondition();
            
            const result = querySystem.executeBitMaskQuery(bitCondition);

            // 验证结果：有Health或Dead组件的实体
            const expected = entities.filter(e => 
                e.hasComponent(HealthComponent) || 
                e.hasComponent(DeadComponent)
            );
            expect(result.length).toBe(expected.length);

            for (const entity of result) {
                expect(
                    entity.hasComponent(HealthComponent) || 
                    entity.hasComponent(DeadComponent)
                ).toBe(true);
            }
        });

        it('应该执行复合位掩码查询', () => {
            const matcher = Matcher.all(TransformComponent)
                .any(VelocityComponent, HealthComponent)
                .none(DeadComponent);
            
            const bitCondition = matcher.getBitMaskCondition();
            const result = querySystem.executeBitMaskQuery(bitCondition);

            // 验证复合条件
            for (const entity of result) {
                expect(entity.hasComponent(TransformComponent)).toBe(true);
                expect(
                    entity.hasComponent(VelocityComponent) || 
                    entity.hasComponent(HealthComponent)
                ).toBe(true);
                expect(entity.hasComponent(DeadComponent)).toBe(false);
            }
        });
    });

    describe('fallback到传统查询', () => {
        it('应该对包含标签条件的查询回退', () => {
            // 给一些实体设置标签
            for (let i = 0; i < 10; i++) {
                entities[i].tag = 100;
            }

            const matcher = Matcher.all(TransformComponent).withTag(100);
            const bitCondition = matcher.getBitMaskCondition();
            
            expect(bitCondition.hasNonComponentConditions).toBe(true);
            
            const result = querySystem.executeBitMaskQuery(bitCondition);

            // 验证结果：既有Transform组件又有tag=100的实体
            for (const entity of result) {
                expect(entity.hasComponent(TransformComponent)).toBe(true);
                expect(entity.tag).toBe(100);
            }
        });

        it('应该对包含名称条件的查询回退', () => {
            // 给一些实体设置特定名称
            for (let i = 0; i < 5; i++) {
                entities[i].name = 'special_entity';
            }

            const matcher = Matcher.all(VelocityComponent).withName('special_entity');
            const bitCondition = matcher.getBitMaskCondition();
            
            expect(bitCondition.hasNonComponentConditions).toBe(true);
            
            const result = querySystem.executeBitMaskQuery(bitCondition);

            // 验证结果
            for (const entity of result) {
                expect(entity.hasComponent(VelocityComponent)).toBe(true);
                expect(entity.name).toBe('special_entity');
            }
        });
    });

    describe('从Matcher创建查询句柄', () => {
        it('应该从简单Matcher创建优化的查询句柄', () => {
            const matcher = Matcher.all(TransformComponent, VelocityComponent);
            
            const handle = (querySystem as any).createQueryHandleFromMatcher(matcher);
            expect(handle).toBeDefined();
            expect(handle.entities).toBeDefined();

            // 验证查询结果的正确性
            const resultEntities = Array.from(handle.entities as Set<Entity>);
            for (const entity of resultEntities) {
                expect(entity.hasComponent(TransformComponent)).toBe(true);
                expect(entity.hasComponent(VelocityComponent)).toBe(true);
            }
        });

        it('应该从复合Matcher创建查询句柄', () => {
            const matcher = Matcher.all(TransformComponent)
                .none(DeadComponent)
                .any(VelocityComponent, HealthComponent);
            
            const handle = (querySystem as any).createQueryHandleFromMatcher(matcher);
            const entities = Array.from(handle.entities as Set<Entity>);

            // 验证复合条件
            for (const entity of entities) {
                expect(entity.hasComponent(TransformComponent)).toBe(true);
                expect(entity.hasComponent(DeadComponent)).toBe(false);
                expect(
                    entity.hasComponent(VelocityComponent) || 
                    entity.hasComponent(HealthComponent)
                ).toBe(true);
            }
        });

        it('应该为包含非组件条件的Matcher正确处理', () => {
            // 设置标签
            for (let i = 0; i < 5; i++) {
                entities[i].tag = 999;
            }

            const matcher = Matcher.all(TransformComponent).withTag(999);
            const handle = (querySystem as any).createQueryHandleFromMatcher(matcher);
            
            const resultEntities = Array.from(handle.entities as Set<Entity>);
            
            // 验证结果
            for (const entity of resultEntities) {
                expect(entity.hasComponent(TransformComponent)).toBe(true);
                expect(entity.tag).toBe(999);
            }
        });
    });

    describe('性能对比测试', () => {
        it('位掩码查询应该与传统查询产生相同结果', () => {
            const matcher = Matcher.all(TransformComponent)
                .any(VelocityComponent, HealthComponent)
                .none(DeadComponent);

            // 位掩码查询
            const bitCondition = matcher.getBitMaskCondition();
            const bitMaskResult = querySystem.executeBitMaskQuery(bitCondition);

            // 传统查询 - 使用公共方法替代
            const traditionalResult = entities.filter(entity => {
                // 手动验证复合条件
                const hasTransform = entity.hasComponent(TransformComponent);
                const hasVelOrHealth = entity.hasComponent(VelocityComponent) || entity.hasComponent(HealthComponent);
                const notDead = !entity.hasComponent(DeadComponent);
                return hasTransform && hasVelOrHealth && notDead;
            });

            // 排序后对比（确保顺序一致）
            const sortById = (a: Entity, b: Entity) => a.id - b.id;
            bitMaskResult.sort(sortById);
            traditionalResult.sort(sortById);

            expect(bitMaskResult.length).toBe(traditionalResult.length);
            for (let i = 0; i < bitMaskResult.length; i++) {
                expect(bitMaskResult[i].id).toBe(traditionalResult[i].id);
            }
        });

        it('位掩码查询应该有良好的性能', () => {
            const matcher = Matcher.all(TransformComponent, VelocityComponent);
            const bitCondition = matcher.getBitMaskCondition();

            const iterations = 1000;
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                querySystem.executeBitMaskQuery(bitCondition);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;

            // 1000次查询应该在合理时间内完成
            expect(duration).toBeLessThan(100); // 100ms内完成1000次查询

            console.log(`1000次位掩码查询用时: ${duration.toFixed(2)}ms, 平均: ${(duration/iterations).toFixed(4)}ms/次`);
        });
    });

    describe('边界情况', () => {
        it('应该处理空的位掩码查询', () => {
            const matcher = Matcher.empty();
            const bitCondition = matcher.getBitMaskCondition();
            
            const result = querySystem.executeBitMaskQuery(bitCondition);

            // 空查询应该返回所有实体
            expect(result.length).toBe(entities.length);
        });

        it('应该处理没有匹配实体的查询', () => {
            class NonExistentComponent extends Component {}
            ComponentRegistry.register(NonExistentComponent);

            const matcher = Matcher.all(NonExistentComponent);
            const bitCondition = matcher.getBitMaskCondition();
            
            const result = querySystem.executeBitMaskQuery(bitCondition);
            expect(result.length).toBe(0);
        });

        it('应该处理矛盾的查询条件', () => {
            // 既要包含又要排除同一个组件
            const matcher = Matcher.all(TransformComponent).none(TransformComponent);
            const bitCondition = matcher.getBitMaskCondition();
            
            const result = querySystem.executeBitMaskQuery(bitCondition);
            expect(result.length).toBe(0);
        });
    });
});