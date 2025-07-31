/**
 * Matcher完整测试套件
 * 包含功能测试、性能测试和向后兼容性测试
 */

import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { Matcher } from '../../../src/ECS/Utils/Matcher';

// 测试组件
class Position extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class Velocity extends Component {
    constructor(public vx: number = 0, public vy: number = 0) {
        super();
    }
}

class Health extends Component {
    constructor(public hp: number = 100) {
        super();
    }
}

class Dead extends Component {}

describe('Matcher测试套件', () => {
    let scene: Scene;
    let entities: Entity[];
    
    beforeEach(() => {
        scene = new Scene();
        scene.begin();
        
        // 创建测试实体
        entities = [];
        
        // 实体1: 移动的活体
        const entity1 = scene.createEntity('MovingAlive');
        entity1.addComponent(new Position(10, 20));
        entity1.addComponent(new Velocity(1, 0));
        entity1.addComponent(new Health(100));
        entities.push(entity1);
        
        // 实体2: 静止的活体
        const entity2 = scene.createEntity('StillAlive');
        entity2.addComponent(new Position(30, 40));
        entity2.addComponent(new Health(50));
        entities.push(entity2);
        
        // 实体3: 移动的死体
        const entity3 = scene.createEntity('MovingDead');
        entity3.addComponent(new Position(50, 60));
        entity3.addComponent(new Velocity(0, 1));
        entity3.addComponent(new Dead());
        entities.push(entity3);
        
        // 实体4: 静止的死体
        const entity4 = scene.createEntity('StillDead');
        entity4.addComponent(new Position(70, 80));
        entity4.addComponent(new Dead());
        entities.push(entity4);
    });
    
    afterEach(() => {
        scene.end();
    });

    describe('新API测试', () => {
        test('create()应该创建有效的matcher', () => {
            const matcher = Matcher.create(scene.querySystem);
            expect(matcher).toBeInstanceOf(Matcher);
        });
        
        test('all()查询应该正确工作', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Position, Health);
            
            const result = matcher.query();
            expect(result).toHaveLength(2);
            expect(result.map(e => e.name).sort()).toEqual(['MovingAlive', 'StillAlive']);
        });
        
        test('any()查询应该正确工作', () => {
            const matcher = Matcher.create(scene.querySystem)
                .any(Health, Dead);
            
            const result = matcher.query();
            expect(result).toHaveLength(4); // 所有实体
        });
        
        test('none()查询应该正确工作', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Position)
                .none(Dead);
            
            const result = matcher.query();
            expect(result).toHaveLength(2);
            expect(result.map(e => e.name).sort()).toEqual(['MovingAlive', 'StillAlive']);
        });
        
        test('复合查询应该正确工作', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Position)
                .any(Health, Velocity)
                .none(Dead);
            
            const result = matcher.query();
            expect(result).toHaveLength(2);
            expect(result.map(e => e.name).sort()).toEqual(['MovingAlive', 'StillAlive']);
        });
        
        test('matches()应该正确检查单个实体', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Position, Velocity);
            
            expect(matcher.matches(entities[0])).toBe(true);  // MovingAlive
            expect(matcher.matches(entities[1])).toBe(false); // StillAlive
            expect(matcher.matches(entities[2])).toBe(true);  // MovingDead
            expect(matcher.matches(entities[3])).toBe(false); // StillDead
        });
        
        test('count()和exists()应该正确工作', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Health);
            
            expect(matcher.count()).toBe(2);
            expect(matcher.exists()).toBe(true);
            
            const emptyMatcher = Matcher.create(scene.querySystem)
                .all(Health, Dead);
            
            expect(emptyMatcher.count()).toBe(0);
            expect(emptyMatcher.exists()).toBe(false);
        });
        
        test('clone()应该创建独立的matcher', () => {
            const baseMatcher = Matcher.create(scene.querySystem)
                .all(Position);
            
            const livingMatcher = baseMatcher.clone()
                .all(Health)
                .none(Dead);
            
            const deadMatcher = baseMatcher.clone()
                .all(Dead);
            
            expect(livingMatcher.count()).toBe(2);
            expect(deadMatcher.count()).toBe(2);
            expect(baseMatcher.count()).toBe(4); // 原始matcher不受影响
        });
        
        test('reset()应该清空所有条件', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Position)
                .any(Health)
                .none(Dead);
            
            expect(matcher.count()).toBe(2);
            
            matcher.reset();
            expect(matcher.count()).toBe(4); // 所有实体
        });
    });

    describe('向后兼容性测试', () => {
        test('empty()和withQuerySystem()应该正常工作', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const matcher = Matcher.empty()
                .all(Position, Health)
                .withQuerySystem(scene.querySystem);
            
            const result = matcher.query();
            expect(result).toHaveLength(2);
            
            // 应该有deprecation警告
            expect(consoleSpy).toHaveBeenCalledWith(
                'withQuerySystem() is deprecated. Use Matcher.create(querySystem) instead.'
            );
            
            consoleSpy.mockRestore();
        });
        
        test('deprecated方法应该工作并显示警告', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const matcher = Matcher.empty()
                .all(Position)
                .withQuerySystem(scene.querySystem);
            
            // 测试deprecated方法
            expect(matcher.isInterestedEntity(entities[0])).toBe(true);
            const result = matcher.queryEntities();
            expect(result).toHaveLength(4);
            
            // 测试getter方法
            expect(matcher.getAllSet()).toEqual([Position]);
            expect(matcher.getExclusionSet()).toEqual([]);
            expect(matcher.getOneSet()).toEqual([]);
            
            // 验证警告
            expect(consoleSpy).toHaveBeenCalledWith(
                'isInterestedEntity() is deprecated. Use matches() instead.'
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                'queryEntities() is deprecated. Use query() instead.'
            );
            
            consoleSpy.mockRestore();
        });
        
        test('无QuerySystem时应该抛出错误', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const matcher = Matcher.empty()
                .all(Position, Health);
            
            // 应该抛出错误而不是回退
            expect(() => matcher.matches(entities[0])).toThrow(
                'Matcher requires QuerySystem. Use Matcher.create(querySystem) or call withQuerySystem() first.'
            );
            
            expect(() => matcher.query()).toThrow(
                'Matcher requires QuerySystem. Use Matcher.create(querySystem) or call withQuerySystem() first.'
            );
            
            consoleSpy.mockRestore();
        });
        
        test('新旧API应该产生相同结果', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // 旧API
            const oldMatcher = Matcher.empty()
                .all(Position)
                .exclude(Dead)
                .withQuerySystem(scene.querySystem);
            
            // 新API
            const newMatcher = Matcher.create(scene.querySystem)
                .all(Position)
                .none(Dead);
            
            // 结果应该相同
            const oldResult = oldMatcher.query().sort((a, b) => a.id - b.id);
            const newResult = newMatcher.query().sort((a, b) => a.id - b.id);
            
            expect(oldResult).toEqual(newResult);
            
            // 单个实体检查也应该相同
            for (const entity of entities) {
                expect(oldMatcher.matches(entity)).toBe(newMatcher.matches(entity));
            }
            
            consoleSpy.mockRestore();
        });
    });

    describe('缓存机制测试', () => {
        test('条件变更应该使缓存失效', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Position);
            
            const result1 = matcher.query();
            
            // 添加条件
            matcher.all(Health);
            const result2 = matcher.query();
            
            // 结果应该不同
            expect(result2.length).toBeLessThan(result1.length);
        });
        
        test('QuerySystem版本变更应该使缓存失效', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Position);
            
            const result1 = matcher.query();
            
            // 添加新实体触发版本变更
            const newEntity = scene.createEntity('NewEntity');
            newEntity.addComponent(new Position(100, 100));
            
            const result2 = matcher.query();
            
            // 结果应该包含新实体
            expect(result2.length).toBe(result1.length + 1);
        });
        
        test('重复查询应该使用缓存', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Position);
            
            const result1 = matcher.query();
            const result2 = matcher.query();
            
            // 结果应该相同（功能测试，不测性能）
            expect(result1).toEqual(result2);
        });
    });

    describe('边界情况测试', () => {
        test('空条件应该返回所有实体', () => {
            const matcher = Matcher.create(scene.querySystem);
            const result = matcher.query();
            expect(result.length).toBeGreaterThan(0);
        });
        
        test('不存在的组件查询应该返回空结果', () => {
            class NonExistentComponent extends Component {}
            
            const matcher = Matcher.create(scene.querySystem)
                .all(NonExistentComponent);
            
            expect(matcher.query()).toEqual([]);
            expect(matcher.count()).toBe(0);
            expect(matcher.exists()).toBe(false);
        });
        
        test('复杂的排除条件应该正确工作', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Position)
                .none(Health, Dead); // 排除有血量或死亡的
            
            // 应该没有结果，因为所有有Position的实体都有Health或Dead
            expect(matcher.query()).toEqual([]);
        });
        
        test('toString()应该提供有用的描述', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Position, Health)
                .any(Velocity)
                .none(Dead);
            
            const description = matcher.toString();
            expect(description).toContain('all(Position, Health)');
            expect(description).toContain('any(Velocity)');
            expect(description).toContain('none(Dead)');
        });
        
        test('getCondition()应该返回只读条件', () => {
            const matcher = Matcher.create(scene.querySystem)
                .all(Position)
                .any(Health)
                .none(Dead);
            
            const condition = matcher.getCondition();
            expect(condition.all).toEqual([Position]);
            expect(condition.any).toEqual([Health]);
            expect(condition.none).toEqual([Dead]);
            
            // 修改返回的条件不应该影响原matcher
            condition.all.push(Velocity as any);
            expect(matcher.getCondition().all).toEqual([Position]);
        });
    });
});