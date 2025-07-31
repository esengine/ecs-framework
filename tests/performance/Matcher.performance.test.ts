/**
 * Matcher性能测试
 * 
 * 注意：性能测试结果可能因平台而异，主要用于性能回归检测
 */

import { Scene } from '../../src/ECS/Scene';
import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';
import { Matcher } from '../../src/ECS/Utils/Matcher';

// 测试组件
class Position extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        if (args.length >= 1) this.x = args[0] as number;
        if (args.length >= 2) this.y = args[1] as number;
    }
}

class Velocity extends Component {
    public vx: number = 0;
    public vy: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        if (args.length >= 1) this.vx = args[0] as number;
        if (args.length >= 2) this.vy = args[1] as number;
    }
}

class Health extends Component {
    public hp: number = 100;
    
    constructor(...args: unknown[]) {
        super();
        if (args.length >= 1) this.hp = args[0] as number;
    }
}

class Weapon extends Component {
    public damage: number = 10;
    
    constructor(...args: unknown[]) {
        super();
        if (args.length >= 1) this.damage = args[0] as number;
    }
}

describe('Matcher性能测试', () => {
    let scene: Scene;
    
    beforeEach(() => {
        scene = new Scene();
        scene.begin();
    });
    
    afterEach(() => {
        scene.end();
    });
    
    const createTestEntities = (count: number): Entity[] => {
        const entities: Entity[] = [];
        for (let i = 0; i < count; i++) {
            const entity = scene.createEntity(`Entity${i}`);
            
            // 确定性的组件分配
            if (i % 3 !== 0) entity.addComponent(new Position(i, i));
            if (i % 2 === 0) entity.addComponent(new Velocity(i % 10, i % 10));
            if (i % 4 !== 0) entity.addComponent(new Health(100 - (i % 50)));
            if (i % 5 === 0) entity.addComponent(new Weapon(i % 20));
            
            entities.push(entity);
        }
        return entities;
    };
    
    test('小规模性能测试 (100个实体)', () => {
        const entities = createTestEntities(100);
        const matcher = Matcher.create(scene.querySystem)
            .all(Position, Velocity);
        
        console.log('\n=== 小规模测试 (100个实体) ===');
        
        // 传统逐个检查
        const matcherStart = performance.now();
        let matcherCount = 0;
        for (const entity of entities) {
            if (matcher.matches(entity)) {
                matcherCount++;
            }
        }
        const matcherTime = performance.now() - matcherStart;
        
        // QuerySystem批量查询
        const queryStart = performance.now();
        const queryResult = scene.querySystem.queryAll(Position, Velocity);
        const queryTime = performance.now() - queryStart;
        
        // Matcher批量查询
        const batchStart = performance.now();
        const batchResult = matcher.query();
        const batchTime = performance.now() - batchStart;
        
        console.log(`传统逐个: ${matcherTime.toFixed(3)}ms (${matcherCount}个匹配)`);
        console.log(`QuerySystem: ${queryTime.toFixed(3)}ms (${queryResult.count}个匹配)`);
        console.log(`Matcher批量: ${batchTime.toFixed(3)}ms (${batchResult.length}个匹配)`);
        console.log(`性能提升: ${(matcherTime/batchTime).toFixed(1)}x`);
        
        // 验证结果一致性
        expect(matcherCount).toBe(queryResult.count);
        expect(batchResult.length).toBe(queryResult.count);
        
        // 性能断言（宽松，避免平台差异）
        expect(batchTime).toBeLessThan(matcherTime * 2);
    });
    
    test('中等规模性能测试 (1000个实体)', () => {
        const entities = createTestEntities(1000);
        const matcher = Matcher.create(scene.querySystem)
            .all(Position, Velocity);
        
        console.log('\n=== 中等规模测试 (1000个实体) ===');
        
        // 传统方式
        const matcherStart = performance.now();
        let matcherCount = 0;
        for (const entity of entities) {
            if (matcher.matches(entity)) {
                matcherCount++;
            }
        }
        const matcherTime = performance.now() - matcherStart;
        
        // QuerySystem方式
        const queryStart = performance.now();
        const queryResult = scene.querySystem.queryAll(Position, Velocity);
        const queryTime = performance.now() - queryStart;
        
        console.log(`传统逐个: ${matcherTime.toFixed(3)}ms (${matcherCount}个匹配)`);
        console.log(`QuerySystem: ${queryTime.toFixed(3)}ms (${queryResult.count}个匹配)`);
        console.log(`性能提升: ${(matcherTime/queryTime).toFixed(1)}x`);
        
        expect(matcherCount).toBe(queryResult.count);
        expect(queryTime).toBeLessThan(matcherTime);
    });
    
    test('大规模性能测试 (5000个实体)', () => {
        const entities = createTestEntities(5000);
        const matcher = Matcher.create(scene.querySystem)
            .all(Position, Velocity);
        
        console.log('\n=== 大规模测试 (5000个实体) ===');
        
        // 传统方式
        const matcherStart = performance.now();
        let matcherCount = 0;
        for (const entity of entities) {
            if (matcher.matches(entity)) {
                matcherCount++;
            }
        }
        const matcherTime = performance.now() - matcherStart;
        
        // QuerySystem方式
        const queryStart = performance.now();
        const queryResult = scene.querySystem.queryAll(Position, Velocity);
        const queryTime = performance.now() - queryStart;
        
        console.log(`传统逐个: ${matcherTime.toFixed(3)}ms (${matcherCount}个匹配)`);
        console.log(`QuerySystem: ${queryTime.toFixed(3)}ms (${queryResult.count}个匹配)`);
        console.log(`性能提升: ${(matcherTime/queryTime).toFixed(1)}x`);
        
        expect(matcherCount).toBe(queryResult.count);
        expect(queryTime).toBeLessThan(matcherTime);
    });
    
    test('重复查询缓存性能', () => {
        createTestEntities(2000);
        const matcher = Matcher.create(scene.querySystem)
            .all(Position, Velocity);
        const repeatCount = 10;
        
        console.log('\n=== 重复查询缓存测试 (2000个实体, 10次查询) ===');
        
        // 首次查询（建立缓存）
        const firstResult = matcher.query();
        
        // 重复查询测试
        const repeatStart = performance.now();
        for (let i = 0; i < repeatCount; i++) {
            const result = matcher.query();
            expect(result.length).toBe(firstResult.length);
        }
        const repeatTime = performance.now() - repeatStart;
        
        // QuerySystem重复查询对比
        const queryStart = performance.now();
        for (let i = 0; i < repeatCount; i++) {
            scene.querySystem.queryAll(Position, Velocity);
        }
        const queryTime = performance.now() - queryStart;
        
        console.log(`Matcher重复: ${repeatTime.toFixed(3)}ms (${(repeatTime/repeatCount).toFixed(3)}ms/次)`);
        console.log(`QuerySystem重复: ${queryTime.toFixed(3)}ms (${(queryTime/repeatCount).toFixed(3)}ms/次)`);
        console.log(`缓存优势: ${(queryTime/repeatTime).toFixed(1)}x`);
        
        // 宽松的性能断言（允许平台差异）
        expect(repeatTime).toBeLessThan(queryTime * 5);
    });
    
    test('复杂查询性能测试', () => {
        const entities = createTestEntities(1000);
        
        console.log('\n=== 复杂查询测试 (1000个实体) ===');
        console.log('查询条件: all(Position) + any(Velocity, Weapon) + none(Health)');
        
        // Matcher复杂查询
        const matcher = Matcher.create(scene.querySystem)
            .all(Position)
            .any(Velocity, Weapon)
            .none(Health);
        
        const matcherStart = performance.now();
        let matcherCount = 0;
        for (const entity of entities) {
            if (matcher.matches(entity)) {
                matcherCount++;
            }
        }
        const matcherTime = performance.now() - matcherStart;
        
        // QuerySystem分步查询
        const queryStart = performance.now();
        const posResult = scene.querySystem.queryAll(Position);
        const velResult = scene.querySystem.queryAll(Velocity);
        const weaponResult = scene.querySystem.queryAll(Weapon);
        const healthResult = scene.querySystem.queryAll(Health);
        
        const posSet = new Set(posResult.entities);
        const velSet = new Set(velResult.entities);
        const weaponSet = new Set(weaponResult.entities);
        const healthSet = new Set(healthResult.entities);
        
        let queryCount = 0;
        for (const entity of entities) {
            const hasPos = posSet.has(entity);
            const hasVelOrWeapon = velSet.has(entity) || weaponSet.has(entity);
            const hasHealth = healthSet.has(entity);
            
            if (hasPos && hasVelOrWeapon && !hasHealth) {
                queryCount++;
            }
        }
        const queryTime = performance.now() - queryStart;
        
        console.log(`Matcher复杂: ${matcherTime.toFixed(3)}ms (${matcherCount}个匹配)`);
        console.log(`分步QuerySystem: ${queryTime.toFixed(3)}ms (${queryCount}个匹配)`);
        console.log(`性能比: ${(matcherTime/queryTime).toFixed(2)}x`);
        
        // 验证结果一致性
        expect(matcherCount).toBe(queryCount);
        
        // 宽松的性能断言（复杂查询可能有差异）
        expect(matcherTime).toBeLessThan(queryTime * 10);
    });
    
    test('缓存失效性能影响', () => {
        createTestEntities(1000);
        const matcher = Matcher.create(scene.querySystem)
            .all(Position);
        
        console.log('\n=== 缓存失效性能测试 ===');
        
        // 首次查询
        const firstStart = performance.now();
        const firstResult = matcher.query();
        const firstTime = performance.now() - firstStart;
        
        // 重复查询（缓存命中）
        const cachedStart = performance.now();
        const cachedResult = matcher.query();
        const cachedTime = performance.now() - cachedStart;
        
        // 添加新实体（使缓存失效）
        const newEntity = scene.createEntity('CacheInvalidator');
        newEntity.addComponent(new Position(999, 999));
        
        // 缓存失效后的查询
        const invalidatedStart = performance.now();
        const invalidatedResult = matcher.query();
        const invalidatedTime = performance.now() - invalidatedStart;
        
        console.log(`首次查询: ${firstTime.toFixed(3)}ms (${firstResult.length}个结果)`);
        console.log(`缓存查询: ${cachedTime.toFixed(3)}ms (${cachedResult.length}个结果)`);
        console.log(`失效查询: ${invalidatedTime.toFixed(3)}ms (${invalidatedResult.length}个结果)`);
        
        // 验证功能正确性
        expect(cachedResult.length).toBe(firstResult.length);
        expect(invalidatedResult.length).toBe(firstResult.length + 1);
        
        // 性能验证
        expect(cachedTime).toBeLessThan(firstTime);
        expect(invalidatedTime).toBeGreaterThan(cachedTime);
    });
});