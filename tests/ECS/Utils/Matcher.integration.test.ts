import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentTypeManager } from '../../../src/ECS/Utils/ComponentTypeManager';

// 简单测试组件
class SimplePositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class SimpleVelocityComponent extends Component {
    constructor(public vx: number = 0, public vy: number = 0) {
        super();
    }
}

class SimpleHealthComponent extends Component {
    constructor(public health: number = 100) {
        super();
    }
}

describe('Matcher集成测试', () => {
    beforeEach(() => {
        // 重置组件类型管理器
        ComponentTypeManager.instance.reset();
        // 重置Entity的静态eventBus以避免副作用
        Entity.eventBus = null;
    });
    
    describe('基础实体匹配测试', () => {
        test('空匹配器匹配所有实体', () => {
            const matcher = Matcher.empty();
            
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            expect(matcher.isInterestedEntity(entity1)).toBe(true);
            expect(matcher.isInterestedEntity(entity2)).toBe(true);
        });
        
        test('单一组件匹配测试', () => {
            const matcher = Matcher.empty().all(SimplePositionComponent);
            
            const entityWithoutComponents = new Entity('Empty', 1);
            expect(matcher.isInterestedEntity(entityWithoutComponents)).toBe(false);
            
            // 小心添加组件，这里可能是问题所在
            const entityWithPosition = new Entity('WithPosition', 2);
            try {
                entityWithPosition.addComponent(new SimplePositionComponent(10, 20));
                expect(matcher.isInterestedEntity(entityWithPosition)).toBe(true);
            } catch (error) {
                console.error('Error adding component:', error);
                throw error;
            }
        });
        
        test('多组件匹配测试', () => {
            const matcher = Matcher.empty().all(SimplePositionComponent, SimpleVelocityComponent);
            
            const completeEntity = new Entity('Complete', 1);
            completeEntity.addComponent(new SimplePositionComponent(10, 20));
            completeEntity.addComponent(new SimpleVelocityComponent(1, 1));
            
            const partialEntity = new Entity('Partial', 2);
            partialEntity.addComponent(new SimplePositionComponent(0, 0));
            
            expect(matcher.isInterestedEntity(completeEntity)).toBe(true);
            expect(matcher.isInterestedEntity(partialEntity)).toBe(false);
        });
        
        test('排除组件匹配测试', () => {
            const matcher = Matcher.empty()
                .all(SimplePositionComponent)
                .exclude(SimpleHealthComponent);
            
            const normalEntity = new Entity('Normal', 1);
            normalEntity.addComponent(new SimplePositionComponent(10, 20));
            
            const excludedEntity = new Entity('Excluded', 2);
            excludedEntity.addComponent(new SimplePositionComponent(50, 60));
            excludedEntity.addComponent(new SimpleHealthComponent(100));
            
            expect(matcher.isInterestedEntity(normalEntity)).toBe(true);
            expect(matcher.isInterestedEntity(excludedEntity)).toBe(false);
        });
        
        test('任一组件匹配测试', () => {
            const matcher = Matcher.empty().one(SimpleVelocityComponent, SimpleHealthComponent);
            
            const velocityEntity = new Entity('Velocity', 1);
            velocityEntity.addComponent(new SimpleVelocityComponent(1, 1));
            
            const healthEntity = new Entity('Health', 2);
            healthEntity.addComponent(new SimpleHealthComponent(100));
            
            const neitherEntity = new Entity('Neither', 3);
            neitherEntity.addComponent(new SimplePositionComponent(0, 0));
            
            expect(matcher.isInterestedEntity(velocityEntity)).toBe(true);
            expect(matcher.isInterestedEntity(healthEntity)).toBe(true);
            expect(matcher.isInterestedEntity(neitherEntity)).toBe(false);
        });
    });
    
    describe('复杂匹配组合测试', () => {
        test('all + exclude组合', () => {
            const matcher = Matcher.empty()
                .all(SimplePositionComponent, SimpleVelocityComponent)
                .exclude(SimpleHealthComponent);
            
            const validEntity = new Entity('Valid', 1);
            validEntity.addComponent(new SimplePositionComponent(10, 20));
            validEntity.addComponent(new SimpleVelocityComponent(1, 1));
            
            const excludedEntity = new Entity('Excluded', 2);
            excludedEntity.addComponent(new SimplePositionComponent(30, 40));
            excludedEntity.addComponent(new SimpleVelocityComponent(2, 2));
            excludedEntity.addComponent(new SimpleHealthComponent(100));
            
            const incompleteEntity = new Entity('Incomplete', 3);
            incompleteEntity.addComponent(new SimplePositionComponent(50, 60));
            
            expect(matcher.isInterestedEntity(validEntity)).toBe(true);
            expect(matcher.isInterestedEntity(excludedEntity)).toBe(false);
            expect(matcher.isInterestedEntity(incompleteEntity)).toBe(false);
        });
        
        test('all + one组合', () => {
            const matcher = Matcher.empty()
                .all(SimplePositionComponent)
                .one(SimpleVelocityComponent, SimpleHealthComponent);
            
            const velocityEntity = new Entity('Velocity', 1);
            velocityEntity.addComponent(new SimplePositionComponent(10, 20));
            velocityEntity.addComponent(new SimpleVelocityComponent(1, 1));
            
            const healthEntity = new Entity('Health', 2);
            healthEntity.addComponent(new SimplePositionComponent(30, 40));
            healthEntity.addComponent(new SimpleHealthComponent(100));
            
            const bothEntity = new Entity('Both', 3);
            bothEntity.addComponent(new SimplePositionComponent(50, 60));
            bothEntity.addComponent(new SimpleVelocityComponent(2, 2));
            bothEntity.addComponent(new SimpleHealthComponent(80));
            
            const invalidEntity = new Entity('Invalid', 4);
            invalidEntity.addComponent(new SimplePositionComponent(70, 80));
            
            expect(matcher.isInterestedEntity(velocityEntity)).toBe(true);
            expect(matcher.isInterestedEntity(healthEntity)).toBe(true);
            expect(matcher.isInterestedEntity(bothEntity)).toBe(true);
            expect(matcher.isInterestedEntity(invalidEntity)).toBe(false);
        });
    });
    
    describe('动态组件变化测试', () => {
        test('实体组件动态添加', () => {
            const matcher = Matcher.empty().all(SimplePositionComponent, SimpleVelocityComponent);
            
            const entity = new Entity('Dynamic', 1);
            
            // 初始状态：不匹配
            expect(matcher.isInterestedEntity(entity)).toBe(false);
            
            // 添加位置组件：仍不匹配
            entity.addComponent(new SimplePositionComponent(10, 20));
            expect(matcher.isInterestedEntity(entity)).toBe(false);
            
            // 添加速度组件：现在匹配
            entity.addComponent(new SimpleVelocityComponent(1, 1));
            expect(matcher.isInterestedEntity(entity)).toBe(true);
        });
        
        test('匹配器配置修改', () => {
            const matcher = Matcher.empty().all(SimplePositionComponent);
            
            const entity = new Entity('Test', 1);
            entity.addComponent(new SimplePositionComponent(10, 20));
            entity.addComponent(new SimpleVelocityComponent(1, 1));
            
            // 初始匹配
            expect(matcher.isInterestedEntity(entity)).toBe(true);
            
            // 修改匹配器，添加更多要求
            matcher.all(SimpleHealthComponent);
            
            // 现在应该不匹配（缺少健康组件）
            expect(matcher.isInterestedEntity(entity)).toBe(false);
            
            // 添加健康组件后应该匹配
            entity.addComponent(new SimpleHealthComponent(100));
            expect(matcher.isInterestedEntity(entity)).toBe(true);
        });
    });
    
    describe('边界情况测试', () => {
        test('空实体测试', () => {
            const allMatcher = Matcher.empty().all(SimplePositionComponent);
            const excludeMatcher = Matcher.empty().exclude(SimplePositionComponent);
            const oneMatcher = Matcher.empty().one(SimplePositionComponent, SimpleVelocityComponent);
            
            const emptyEntity = new Entity('Empty', 1);
            
            expect(allMatcher.isInterestedEntity(emptyEntity)).toBe(false);
            expect(excludeMatcher.isInterestedEntity(emptyEntity)).toBe(true);
            expect(oneMatcher.isInterestedEntity(emptyEntity)).toBe(false);
        });
        
        test('重复组件类型配置', () => {
            const matcher = Matcher.empty()
                .all(SimplePositionComponent)
                .all(SimplePositionComponent); // 重复添加
            
            const entity = new Entity('Test', 1);
            entity.addComponent(new SimplePositionComponent(10, 20));
            
            // 应该仍然正常工作
            expect(matcher.isInterestedEntity(entity)).toBe(true);
            
            // 内部应该有重复的组件类型
            expect(matcher.getAllSet().length).toBe(2);
        });
    });
    
    describe('匹配器工具方法测试', () => {
        test('toString方法', () => {
            const emptyMatcher = Matcher.empty();
            expect(emptyMatcher.toString()).toBe('Matcher()');
            
            const simpleMatcher = Matcher.empty().all(SimplePositionComponent);
            const str = simpleMatcher.toString();
            expect(str).toContain('all: [SimplePositionComponent]');
            
            const complexMatcher = Matcher.empty()
                .all(SimplePositionComponent, SimpleVelocityComponent)
                .exclude(SimpleHealthComponent);
            
            const complexStr = complexMatcher.toString();
            expect(complexStr).toContain('all: [SimplePositionComponent, SimpleVelocityComponent]');
            expect(complexStr).toContain('exclude: [SimpleHealthComponent]');
        });
        
        test('配置获取方法', () => {
            const matcher = Matcher.empty()
                .all(SimplePositionComponent, SimpleVelocityComponent)
                .exclude(SimpleHealthComponent);
            
            expect(matcher.getAllSet()).toEqual([SimplePositionComponent, SimpleVelocityComponent]);
            expect(matcher.getExclusionSet()).toEqual([SimpleHealthComponent]);
            expect(matcher.getOneSet()).toEqual([]);
        });
        
        test('链式调用', () => {
            const matcher = Matcher.empty();
            const result = matcher
                .all(SimplePositionComponent)
                .exclude(SimpleHealthComponent)
                .one(SimpleVelocityComponent);
            
            expect(result).toBe(matcher);
        });
    });
    
    afterEach(() => {
        // 清理
        ComponentTypeManager.instance.reset();
        Entity.eventBus = null;
    });
});