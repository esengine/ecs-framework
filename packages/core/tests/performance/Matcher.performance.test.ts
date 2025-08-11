import { Component } from '../../src/ECS/Component';
import { Matcher } from '../../src/ECS/Utils/Matcher';

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

describe('Matcher 性能测试', () => {
    test('大量 Matcher 创建性能', () => {
        console.log('\n=== Matcher 创建性能测试 ===');
        
        const iterationCount = 10000;
        
        const staticStart = performance.now();
        for (let i = 0; i < iterationCount; i++) {
            Matcher.all(Position, Velocity);
        }
        const staticTime = performance.now() - staticStart;
        
        const complexStart = performance.now();
        for (let i = 0; i < iterationCount; i++) {
            Matcher.complex()
                .all(Position, Velocity)
                .any(Health, Weapon)
                .none(Weapon);
        }
        const complexTime = performance.now() - complexStart;
        
        console.log(`静态方法创建: ${staticTime.toFixed(3)}ms (${(staticTime/iterationCount*1000).toFixed(3)}μs/次)`);
        console.log(`复杂链式创建: ${complexTime.toFixed(3)}ms (${(complexTime/iterationCount*1000).toFixed(3)}μs/次)`);
        
        expect(staticTime).toBeLessThan(1000);
        expect(complexTime).toBeLessThan(2000);
    });
    
    test('Matcher getCondition() 性能', () => {
        console.log('\n=== getCondition() 性能测试 ===');
        
        const matcher = Matcher.all(Position, Velocity, Health)
            .any(Weapon)
            .none(Health)
            .withTag(123)
            .withName('TestEntity')
            .withComponent(Position);
        
        const iterationCount = 50000;
        
        const start = performance.now();
        for (let i = 0; i < iterationCount; i++) {
            matcher.getCondition();
        }
        const time = performance.now() - start;
        
        console.log(`getCondition() 调用: ${time.toFixed(3)}ms (${(time/iterationCount*1000).toFixed(3)}μs/次)`);
        
        expect(time).toBeLessThan(500);
    });
    
    test('Matcher clone() 性能', () => {
        console.log('\n=== clone() 性能测试 ===');
        
        const originalMatcher = Matcher.all(Position, Velocity, Health)
            .any(Weapon)
            .none(Health)
            .withTag(123)
            .withName('TestEntity')
            .withComponent(Position);
        
        const iterationCount = 10000;
        
        const start = performance.now();
        for (let i = 0; i < iterationCount; i++) {
            originalMatcher.clone();
        }
        const time = performance.now() - start;
        
        console.log(`clone() 调用: ${time.toFixed(3)}ms (${(time/iterationCount*1000).toFixed(3)}μs/次)`);
        
        expect(time).toBeLessThan(1000);
    });
    
    test('Matcher toString() 性能', () => {
        console.log('\n=== toString() 性能测试 ===');
        
        const simpleMatcherStart = performance.now();
        const simpleMatcher = Matcher.all(Position);
        for (let i = 0; i < 10000; i++) {
            simpleMatcher.toString();
        }
        const simpleTime = performance.now() - simpleMatcherStart;
        
        const complexMatcherStart = performance.now();
        const complexMatcher = Matcher.all(Position, Velocity, Health)
            .any(Weapon)
            .none(Health)
            .withTag(123)
            .withName('TestEntity')
            .withComponent(Position);
        for (let i = 0; i < 10000; i++) {
            complexMatcher.toString();
        }
        const complexTime = performance.now() - complexMatcherStart;
        
        console.log(`简单 toString(): ${simpleTime.toFixed(3)}ms (${(simpleTime/10000*1000).toFixed(3)}μs/次)`);
        console.log(`复杂 toString(): ${complexTime.toFixed(3)}ms (${(complexTime/10000*1000).toFixed(3)}μs/次)`);
        
        expect(simpleTime).toBeLessThan(200);
        expect(complexTime).toBeLessThan(500);
    });
    
    test('Matcher isEmpty() 性能', () => {
        console.log('\n=== isEmpty() 性能测试 ===');
        
        const emptyMatcher = Matcher.empty();
        const fullMatcher = Matcher.all(Position, Velocity)
            .any(Health)
            .none(Weapon)
            .withTag(123);
        
        const iterationCount = 100000;
        
        const emptyStart = performance.now();
        for (let i = 0; i < iterationCount; i++) {
            emptyMatcher.isEmpty();
        }
        const emptyTime = performance.now() - emptyStart;
        
        const fullStart = performance.now();
        for (let i = 0; i < iterationCount; i++) {
            fullMatcher.isEmpty();
        }
        const fullTime = performance.now() - fullStart;
        
        console.log(`空匹配器 isEmpty(): ${emptyTime.toFixed(3)}ms (${(emptyTime/iterationCount*1000).toFixed(3)}μs/次)`);
        console.log(`复杂匹配器 isEmpty(): ${fullTime.toFixed(3)}ms (${(fullTime/iterationCount*1000).toFixed(3)}μs/次)`);
        
        expect(emptyTime).toBeLessThan(100);
        expect(fullTime).toBeLessThan(200);
    });
    
    test('Matcher reset() 性能', () => {
        console.log('\n=== reset() 性能测试 ===');
        
        const iterationCount = 50000;
        
        const start = performance.now();
        for (let i = 0; i < iterationCount; i++) {
            const matcher = Matcher.all(Position, Velocity, Health)
                .any(Weapon)
                .none(Health)
                .withTag(123)
                .withName('TestEntity')
                .withComponent(Position);
            matcher.reset();
        }
        const time = performance.now() - start;
        
        console.log(`reset() 调用: ${time.toFixed(3)}ms (${(time/iterationCount*1000).toFixed(3)}μs/次)`);
        
        expect(time).toBeLessThan(1000);
    });
    
    test('大规模链式调用性能', () => {
        console.log('\n=== 大规模链式调用性能测试 ===');
        
        const iterationCount = 5000;
        
        const start = performance.now();
        for (let i = 0; i < iterationCount; i++) {
            Matcher.empty()
                .all(Position)
                .all(Velocity)
                .all(Health)
                .any(Weapon)
                .any(Health)
                .none(Weapon)
                .none(Health)
                .withTag(i)
                .withName(`Entity${i}`)
                .withComponent(Position)
                .withoutTag()
                .withoutName()
                .withoutComponent()
                .withTag(i * 2)
                .withName(`NewEntity${i}`)
                .withComponent(Velocity);
        }
        const time = performance.now() - start;
        
        console.log(`大规模链式调用: ${time.toFixed(3)}ms (${(time/iterationCount*1000).toFixed(3)}μs/次)`);
        
        expect(time).toBeLessThan(2000);
    });
    
    test('内存分配性能测试', () => {
        console.log('\n=== 内存分配性能测试 ===');
        
        const iterationCount = 10000;
        const matchers: Matcher[] = [];
        
        const start = performance.now();
        for (let i = 0; i < iterationCount; i++) {
            const matcher = Matcher.all(Position, Velocity)
                .any(Health, Weapon)
                .none(Health)
                .withTag(i)
                .withName(`Entity${i}`);
            matchers.push(matcher);
        }
        const allocationTime = performance.now() - start;
        
        const cloneStart = performance.now();
        const clonedMatchers = matchers.map(m => m.clone());
        const cloneTime = performance.now() - cloneStart;
        
        const conditionStart = performance.now();
        const conditions = matchers.map(m => m.getCondition());
        const conditionTime = performance.now() - conditionStart;
        
        console.log(`创建 ${iterationCount} 个 Matcher: ${allocationTime.toFixed(3)}ms`);
        console.log(`克隆 ${iterationCount} 个 Matcher: ${cloneTime.toFixed(3)}ms`);
        console.log(`获取 ${iterationCount} 个条件: ${conditionTime.toFixed(3)}ms`);
        
        expect(allocationTime).toBeLessThan(1500);
        expect(cloneTime).toBeLessThan(1000);
        expect(conditionTime).toBeLessThan(500);
        
        expect(matchers.length).toBe(iterationCount);
        expect(clonedMatchers.length).toBe(iterationCount);
        expect(conditions.length).toBe(iterationCount);
    });
    
    test('字符串操作性能对比', () => {
        console.log('\n=== 字符串操作性能对比 ===');
        
        const simpleMatcher = Matcher.all(Position);
        const complexMatcher = Matcher.all(Position, Velocity, Health, Weapon)
            .any(Health, Weapon)
            .none(Position, Velocity)
            .withTag(123456)
            .withName('VeryLongEntityNameForPerformanceTesting')
            .withComponent(Health);
        
        const iterationCount = 10000;
        
        const simpleStart = performance.now();
        for (let i = 0; i < iterationCount; i++) {
            simpleMatcher.toString();
        }
        const simpleTime = performance.now() - simpleStart;
        
        const complexStart = performance.now();
        for (let i = 0; i < iterationCount; i++) {
            complexMatcher.toString();
        }
        const complexTime = performance.now() - complexStart;
        
        console.log(`简单匹配器字符串化: ${simpleTime.toFixed(3)}ms`);
        console.log(`复杂匹配器字符串化: ${complexTime.toFixed(3)}ms`);
        console.log(`复杂度影响: ${(complexTime/simpleTime).toFixed(2)}x`);
        
        expect(simpleTime).toBeLessThan(200);
        expect(complexTime).toBeLessThan(800);
    });
    
    test('批量操作性能基准', () => {
        console.log('\n=== 批量操作性能基准 ===');
        
        const batchSize = 1000;
        const operationCount = 10;
        
        const totalStart = performance.now();
        
        for (let batch = 0; batch < operationCount; batch++) {
            const matchers: Matcher[] = [];
            
            for (let i = 0; i < batchSize; i++) {
                const matcher = Matcher.complex()
                    .all(Position, Velocity)
                    .any(Health, Weapon)
                    .withTag(batch * batchSize + i);
                
                matchers.push(matcher);
            }
            
            matchers.forEach(m => {
                m.getCondition();
                m.toString();
                m.isEmpty();
            });
            
            const cloned = matchers.map(m => m.clone());
            cloned.forEach(m => m.reset());
        }
        
        const totalTime = performance.now() - totalStart;
        const totalOperations = batchSize * operationCount * 5; // 每个matcher执行5个操作
        
        console.log(`批量操作总时间: ${totalTime.toFixed(3)}ms`);
        console.log(`总操作数: ${totalOperations}`);
        console.log(`平均每操作: ${(totalTime/totalOperations*1000).toFixed(3)}μs`);
        
        expect(totalTime).toBeLessThan(5000);
    });
});