import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentTypeManager } from '../../../src/ECS/Utils/ComponentTypeManager';

// 简单测试组件
class TestPositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class TestVelocityComponent extends Component {
    constructor(public vx: number = 0, public vy: number = 0) {
        super();
    }
}

class TestHealthComponent extends Component {
    constructor(public health: number = 100) {
        super();
    }
}

describe('Matcher基础功能测试', () => {
    let typeManager: ComponentTypeManager;
    
    beforeEach(() => {
        typeManager = ComponentTypeManager.instance;
        typeManager.reset();
    });
    
    describe('基础匹配测试', () => {
        test('空匹配器匹配所有实体', () => {
            const matcher = Matcher.empty();
            
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            entity2.addComponent(new TestPositionComponent(10, 20));
            
            expect(matcher.isInterestedEntity(entity1)).toBe(true);
            expect(matcher.isInterestedEntity(entity2)).toBe(true);
        });
        
        test('单一all条件匹配', () => {
            const matcher = Matcher.empty().all(TestPositionComponent);
            
            const entityWith = new Entity('With', 1);
            entityWith.addComponent(new TestPositionComponent(10, 20));
            
            const entityWithout = new Entity('Without', 2);
            
            expect(matcher.isInterestedEntity(entityWith)).toBe(true);
            expect(matcher.isInterestedEntity(entityWithout)).toBe(false);
        });
        
        test('多个all条件匹配', () => {
            const matcher = Matcher.empty().all(TestPositionComponent, TestVelocityComponent);
            
            const completeEntity = new Entity('Complete', 1);
            completeEntity.addComponent(new TestPositionComponent(10, 20));
            completeEntity.addComponent(new TestVelocityComponent(1, 1));
            
            const partialEntity = new Entity('Partial', 2);
            partialEntity.addComponent(new TestPositionComponent(0, 0));
            
            expect(matcher.isInterestedEntity(completeEntity)).toBe(true);
            expect(matcher.isInterestedEntity(partialEntity)).toBe(false);
        });
        
        test('exclude条件匹配', () => {
            const matcher = Matcher.empty()
                .all(TestPositionComponent)
                .exclude(TestHealthComponent);
            
            const normalEntity = new Entity('Normal', 1);
            normalEntity.addComponent(new TestPositionComponent(10, 20));
            
            const excludedEntity = new Entity('Excluded', 2);
            excludedEntity.addComponent(new TestPositionComponent(50, 60));
            excludedEntity.addComponent(new TestHealthComponent(100));
            
            expect(matcher.isInterestedEntity(normalEntity)).toBe(true);
            expect(matcher.isInterestedEntity(excludedEntity)).toBe(false);
        });
        
        test('one条件匹配', () => {
            const matcher = Matcher.empty().one(TestVelocityComponent, TestHealthComponent);
            
            const velocityEntity = new Entity('Velocity', 1);
            velocityEntity.addComponent(new TestVelocityComponent(1, 1));
            
            const healthEntity = new Entity('Health', 2);
            healthEntity.addComponent(new TestHealthComponent(100));
            
            const bothEntity = new Entity('Both', 3);
            bothEntity.addComponent(new TestVelocityComponent(2, 2));
            bothEntity.addComponent(new TestHealthComponent(80));
            
            const neitherEntity = new Entity('Neither', 4);
            neitherEntity.addComponent(new TestPositionComponent(0, 0));
            
            expect(matcher.isInterestedEntity(velocityEntity)).toBe(true);
            expect(matcher.isInterestedEntity(healthEntity)).toBe(true);
            expect(matcher.isInterestedEntity(bothEntity)).toBe(true);
            expect(matcher.isInterestedEntity(neitherEntity)).toBe(false);
        });
    });
    
    describe('复杂组合测试', () => {
        test('all + exclude组合', () => {
            const matcher = Matcher.empty()
                .all(TestPositionComponent, TestVelocityComponent)
                .exclude(TestHealthComponent);
            
            const validEntity = new Entity('Valid', 1);
            validEntity.addComponent(new TestPositionComponent(10, 20));
            validEntity.addComponent(new TestVelocityComponent(1, 1));
            
            const excludedEntity = new Entity('Excluded', 2);
            excludedEntity.addComponent(new TestPositionComponent(30, 40));
            excludedEntity.addComponent(new TestVelocityComponent(2, 2));
            excludedEntity.addComponent(new TestHealthComponent(100));
            
            expect(matcher.isInterestedEntity(validEntity)).toBe(true);
            expect(matcher.isInterestedEntity(excludedEntity)).toBe(false);
        });
        
        test('all + one组合', () => {
            const matcher = Matcher.empty()
                .all(TestPositionComponent)
                .one(TestVelocityComponent, TestHealthComponent);
            
            const velocityEntity = new Entity('Velocity', 1);
            velocityEntity.addComponent(new TestPositionComponent(10, 20));
            velocityEntity.addComponent(new TestVelocityComponent(1, 1));
            
            const healthEntity = new Entity('Health', 2);
            healthEntity.addComponent(new TestPositionComponent(30, 40));
            healthEntity.addComponent(new TestHealthComponent(100));
            
            const invalidEntity = new Entity('Invalid', 3);
            invalidEntity.addComponent(new TestPositionComponent(50, 60));
            
            expect(matcher.isInterestedEntity(velocityEntity)).toBe(true);
            expect(matcher.isInterestedEntity(healthEntity)).toBe(true);
            expect(matcher.isInterestedEntity(invalidEntity)).toBe(false);
        });
    });
    
    describe('匹配器属性测试', () => {
        test('获取匹配器配置', () => {
            const matcher = Matcher.empty()
                .all(TestPositionComponent, TestVelocityComponent)
                .exclude(TestHealthComponent);
            
            expect(matcher.getAllSet()).toEqual([TestPositionComponent, TestVelocityComponent]);
            expect(matcher.getExclusionSet()).toEqual([TestHealthComponent]);
            expect(matcher.getOneSet()).toEqual([]);
        });
        
        test('toString方法', () => {
            const emptyMatcher = Matcher.empty();
            expect(emptyMatcher.toString()).toBe('Matcher()');
            
            const simpleMatcher = Matcher.empty().all(TestPositionComponent);
            expect(simpleMatcher.toString()).toContain('all: [TestPositionComponent]');
        });
        
        test('链式调用返回同一实例', () => {
            const matcher = Matcher.empty();
            const result = matcher.all(TestPositionComponent).exclude(TestHealthComponent);
            expect(result).toBe(matcher);
        });
    });
    
    afterEach(() => {
        typeManager.reset();
    });
});