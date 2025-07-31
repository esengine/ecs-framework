/**
 * Matcher完整测试套件
 * 测试新的Matcher条件构建功能和QuerySystem集成
 */

import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { Matcher } from '../../../src/ECS/Utils/Matcher';

// 测试组件
class Position extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [x = 0, y = 0] = args as [number?, number?];
        this.x = x;
        this.y = y;
    }
}

class Velocity extends Component {
    public vx: number = 0;
    public vy: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [vx = 0, vy = 0] = args as [number?, number?];
        this.vx = vx;
        this.vy = vy;
    }
}

class Health extends Component {
    public hp: number = 100;
    
    constructor(...args: unknown[]) {
        super();
        const [hp = 100] = args as [number?];
        this.hp = hp;
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

    describe('Matcher条件构建测试', () => {
        test('Matcher.all()应该创建正确的查询条件', () => {
            const matcher = Matcher.all(Position, Health);
            const condition = matcher.getCondition();
            
            expect(condition.all).toContain(Position);
            expect(condition.all).toContain(Health);
            expect(condition.all.length).toBe(2);
        });
        
        test('Matcher.any()应该创建正确的查询条件', () => {
            const matcher = Matcher.any(Health, Dead);
            const condition = matcher.getCondition();
            
            expect(condition.any).toContain(Health);
            expect(condition.any).toContain(Dead);
            expect(condition.any.length).toBe(2);
        });
        
        test('Matcher.none()应该创建正确的查询条件', () => {
            const matcher = Matcher.none(Dead);
            const condition = matcher.getCondition();
            
            expect(condition.none).toContain(Dead);
            expect(condition.none.length).toBe(1);
        });
        
        test('链式调用应该正确工作', () => {
            const matcher = Matcher.all(Position)
                .any(Health, Velocity)
                .none(Dead);
            
            const condition = matcher.getCondition();
            expect(condition.all).toContain(Position);
            expect(condition.any).toContain(Health);
            expect(condition.any).toContain(Velocity);
            expect(condition.none).toContain(Dead);
        });
        
        test('byComponent()应该创建单组件查询条件', () => {
            const matcher = Matcher.byComponent(Position);
            const condition = matcher.getCondition();
            
            expect(condition.component).toBe(Position);
        });
        
        test('byTag()应该创建标签查询条件', () => {
            const matcher = Matcher.byTag(123);
            const condition = matcher.getCondition();
            
            expect(condition.tag).toBe(123);
        });
        
        test('byName()应该创建名称查询条件', () => {
            const matcher = Matcher.byName('TestEntity');
            const condition = matcher.getCondition();
            
            expect(condition.name).toBe('TestEntity');
        });
    });
    
    describe('QuerySystem集成测试', () => {
        test('使用QuerySystem的queryAll()查询所有匹配实体', () => {
            const result = scene.querySystem.queryAll(Position, Health);
            expect(result.entities.map(e => e.name).sort()).toEqual(['MovingAlive', 'StillAlive']);
        });
        
        test('使用QuerySystem的queryAny()查询任一匹配实体', () => {
            const result = scene.querySystem.queryAny(Health, Dead);
            expect(result.entities.length).toBe(4); // 所有实体都有Health或Dead
        });
        
        test('使用QuerySystem的queryNone()查询排除实体', () => {
            const result = scene.querySystem.queryNone(Dead);
            const aliveEntities = result.entities.filter(e => e.hasComponent(Position));
            expect(aliveEntities.map(e => e.name).sort()).toEqual(['MovingAlive', 'StillAlive']);
        });
        
        test('QuerySystem查询性能统计', () => {
            scene.querySystem.queryAll(Position, Velocity);
            const stats = scene.querySystem.getStats();
            
            expect(stats.queryStats.totalQueries).toBeGreaterThan(0);
            expect(stats.queryStats.cacheHits).toBeGreaterThanOrEqual(0);
        });
    });
    
    describe('实际使用场景测试', () => {
        test('游戏系统中的移动实体查询', () => {
            // 查询所有可移动的实体（有位置和速度的）
            const movableEntities = scene.querySystem.queryAll(Position, Velocity);
            expect(movableEntities.entities.length).toBe(2); // MovingAlive, MovingDead
            
            movableEntities.entities.forEach(entity => {
                const pos = entity.getComponent(Position)!;
                const vel = entity.getComponent(Velocity)!;
                expect(pos).toBeDefined();
                expect(vel).toBeDefined();
            });
        });
        
        test('游戏系统中的活体实体查询', () => {
            // 查询所有活体实体（有血量，没有死亡标记的）
            const aliveEntitiesAll = scene.querySystem.queryAll(Health);
            const deadEntitiesAll = scene.querySystem.queryAll(Dead);
            
            expect(aliveEntitiesAll.entities.length).toBe(2); // MovingAlive, StillAlive
            expect(deadEntitiesAll.entities.length).toBe(2); // MovingDead, StillDead
        });
        
        test('复杂查询：查找活着的移动实体', () => {
            // 首先获取所有有位置和速度的实体
            const movableEntities = scene.querySystem.queryAll(Position, Velocity);
            
            // 然后过滤出活着的（有血量的）
            const aliveMovableEntities = movableEntities.entities.filter(entity => 
                entity.hasComponent(Health)
            );
            
            expect(aliveMovableEntities.length).toBe(1); // 只有MovingAlive
            expect(aliveMovableEntities[0].name).toBe('MovingAlive');
        });
        
        test('复合查询条件应用', () => {
            // 使用Matcher建立复杂条件，然后用QuerySystem执行
            const matcher = Matcher.all(Position).any(Health, Dead);
            const condition = matcher.getCondition();
            
            // 这里演示如何用条件，实际执行需要QuerySystem支持复合条件
            expect(condition.all).toContain(Position);
            expect(condition.any).toContain(Health);
            expect(condition.any).toContain(Dead);
        });
    });
    
    describe('性能测试', () => {
        test('大量简单查询的性能', () => {
            const startTime = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                scene.querySystem.queryAll(Position);
            }
            
            const executionTime = performance.now() - startTime;
            expect(executionTime).toBeLessThan(100); // 应该在100ms内完成
        });
        
        test('复杂查询的性能', () => {
            const startTime = performance.now();
            
            for (let i = 0; i < 100; i++) {
                scene.querySystem.queryAll(Position, Health);
                scene.querySystem.queryAny(Health, Dead);
                scene.querySystem.queryNone(Dead);
            }
            
            const executionTime = performance.now() - startTime;
            expect(executionTime).toBeLessThan(50);
        });
        
        test('不存在组件的查询性能', () => {
            class NonExistentComponent extends Component {
                constructor(...args: unknown[]) {
                    super();
                }
            }
            
            const result = scene.querySystem.queryAll(NonExistentComponent);
            expect(result.entities.length).toBe(0);
        });
    });
    
    describe('边界情况测试', () => {
        test('空查询应该返回所有实体', () => {
            const result = scene.querySystem.queryAll();
            expect(result.entities.length).toBe(entities.length);
        });
        
        test('查询不存在的组件应该返回空结果', () => {
            class NonExistentComponent extends Component {
                constructor(...args: unknown[]) {
                    super();
                }
            }
            
            const result = scene.querySystem.queryAll(NonExistentComponent);
            expect(result.entities.length).toBe(0);
        });
        
        test('Matcher条件构建的边界情况', () => {
            const emptyMatcher = Matcher.complex();
            const condition = emptyMatcher.getCondition();
            
            expect(condition.all.length).toBe(0);
            expect(condition.any.length).toBe(0);
            expect(condition.none.length).toBe(0);
        });
    });
});