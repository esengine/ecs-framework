#!/usr/bin/env node

/**
 * ECS框架基准测试 - 简化版本
 * 专门测试框架本身的性能，不依赖复杂的ECS实现
 */

console.log('🚀 ECS框架性能基准测试');
console.log('='.repeat(60));
console.log('测试目标: 框架本身的性能极限，不包含复杂游戏逻辑');
console.log('='.repeat(60));

// 模拟简单的实体和组件
class MockEntity {
    public id: number;
    public components = new Map<string, any>();
    public tags = new Set<string>();
    public enabled: boolean = true;
    
    constructor(id: number) {
        this.id = id;
    }
    
    addComponent(type: string, data: any): void {
        this.components.set(type, data);
    }
    
    getComponent(type: string): any {
        return this.components.get(type);
    }
    
    hasComponent(type: string): boolean {
        return this.components.has(type);
    }
    
    removeComponent(type: string): void {
        this.components.delete(type);
    }
    
    addTag(tag: string): void {
        this.tags.add(tag);
    }
    
    hasTag(tag: string): boolean {
        return this.tags.has(tag);
    }
    
    removeTag(tag: string): void {
        this.tags.delete(tag);
    }
}

// 模拟查询系统
class MockQuery {
    private entities: MockEntity[] = [];
    
    constructor(entities: MockEntity[]) {
        this.entities = entities;
    }
    
    // 查询包含指定组件的实体
    withComponents(...componentTypes: string[]): MockEntity[] {
        return this.entities.filter(entity => 
            componentTypes.every(type => entity.hasComponent(type))
        );
    }
    
    // 查询包含指定标签的实体
    withTags(...tags: string[]): MockEntity[] {
        return this.entities.filter(entity => 
            tags.every(tag => entity.hasTag(tag))
        );
    }
    
    // 查询启用的实体
    enabled(): MockEntity[] {
        return this.entities.filter(entity => entity.enabled);
    }
    
    // 查询禁用的实体
    disabled(): MockEntity[] {
        return this.entities.filter(entity => !entity.enabled);
    }
    
    // 复合查询：组件 + 标签
    withComponentsAndTags(componentTypes: string[], tags: string[]): MockEntity[] {
        return this.entities.filter(entity => 
            componentTypes.every(type => entity.hasComponent(type)) &&
            tags.every(tag => entity.hasTag(tag)) &&
            entity.enabled
        );
    }
    
    // 排除查询：不包含指定组件
    withoutComponents(...componentTypes: string[]): MockEntity[] {
        return this.entities.filter(entity => 
            !componentTypes.some(type => entity.hasComponent(type))
        );
    }
}

// 测试函数
function testEntityCreation(count: number): number {
    const startTime = performance.now();
    
    const entities: MockEntity[] = [];
    for (let i = 0; i < count; i++) {
        const entity = new MockEntity(i);
        entity.addComponent('position', { x: i * 0.1, y: i * 0.2 });
        entity.addComponent('velocity', { vx: 1, vy: 1 });
        
        // 添加一些标签和状态
        if (i % 2 === 0) entity.addTag('even');
        if (i % 3 === 0) entity.addTag('player');
        if (i % 5 === 0) entity.addTag('enemy');
        if (i % 10 === 0) entity.enabled = false;
        
        entities.push(entity);
    }
    
    return performance.now() - startTime;
}

function testComponentAccess(entities: MockEntity[], iterations: number): number {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        for (const entity of entities) {
            const pos = entity.getComponent('position');
            const vel = entity.getComponent('velocity');
            if (pos && vel) {
                pos.x += vel.vx * 0.016;
                pos.y += vel.vy * 0.016;
            }
        }
    }
    
    return performance.now() - startTime;
}

function testComponentAddRemove(entities: MockEntity[], iterations: number): number {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        for (const entity of entities) {
            entity.addComponent('temp', { value: i });
            entity.removeComponent('temp');
        }
    }
    
    return performance.now() - startTime;
}

function testSingleComponentQuery(entities: MockEntity[], iterations: number): number {
    const query = new MockQuery(entities);
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        const result = query.withComponents('position');
    }
    
    return performance.now() - startTime;
}

function testMultiComponentQuery(entities: MockEntity[], iterations: number): number {
    const query = new MockQuery(entities);
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        const result = query.withComponents('position', 'velocity');
    }
    
    return performance.now() - startTime;
}

function testTagQuery(entities: MockEntity[], iterations: number): number {
    const query = new MockQuery(entities);
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        const players = query.withTags('player');
        const enemies = query.withTags('enemy');
    }
    
    return performance.now() - startTime;
}

function testComplexQuery(entities: MockEntity[], iterations: number): number {
    const query = new MockQuery(entities);
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        const result = query.withComponentsAndTags(['position', 'velocity'], ['player']);
    }
    
    return performance.now() - startTime;
}

function testExclusionQuery(entities: MockEntity[], iterations: number): number {
    const query = new MockQuery(entities);
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        const result = query.withoutComponents('temp', 'disabled');
    }
    
    return performance.now() - startTime;
}

function testComponentExistence(entities: MockEntity[], iterations: number): number {
    const startTime = performance.now();
    
    let count = 0;
    for (let i = 0; i < iterations; i++) {
        for (const entity of entities) {
            if (entity.hasComponent('position') && entity.hasComponent('velocity')) {
                count++;
            }
        }
    }
    
    return performance.now() - startTime;
}

// 运行基准测试
async function runBenchmarks(): Promise<void> {
    console.log('\n📊 1. 实体创建性能测试');
    console.log('-'.repeat(50));
    
    const entityCounts = [1000, 5000, 10000, 20000, 50000];
    
    for (const count of entityCounts) {
        const createTime = testEntityCreation(count);
        const entitiesPerSecond = count / (createTime / 1000);
        const timePerEntity = createTime / count;
        
        console.log(`${count.toString().padStart(6)} 个实体: ${createTime.toFixed(2)}ms (${entitiesPerSecond.toFixed(0)}个/秒, ${timePerEntity.toFixed(4)}ms/个)`);
    }
    
    console.log('\n🔍 2. 组件访问性能测试');
    console.log('-'.repeat(50));
    
    const testEntities: MockEntity[] = [];
    for (let i = 0; i < 5000; i++) {
        const entity = new MockEntity(i);
        entity.addComponent('position', { x: i * 0.1, y: i * 0.2 });
        entity.addComponent('velocity', { vx: 1, vy: 1 });
        
        // 添加标签和状态
        if (i % 2 === 0) entity.addTag('even');
        if (i % 3 === 0) entity.addTag('player');
        if (i % 5 === 0) entity.addTag('enemy');
        if (i % 10 === 0) entity.enabled = false;
        
        testEntities.push(entity);
    }
    
    const accessIterations = [100, 500, 1000, 2000];
    
    for (const iterations of accessIterations) {
        const accessTime = testComponentAccess(testEntities, iterations);
        const accessesPerSecond = (testEntities.length * iterations) / (accessTime / 1000);
        const timePerAccess = accessTime / (testEntities.length * iterations);
        
        console.log(`${iterations.toString().padStart(4)} 次迭代: ${accessTime.toFixed(2)}ms (${accessesPerSecond.toFixed(0)}次访问/秒, ${(timePerAccess * 1000).toFixed(3)}μs/次)`);
    }
    
    console.log('\n🧪 3. 组件添加/删除性能测试');
    console.log('-'.repeat(50));
    
    const addRemoveIterations = [100, 500, 1000];
    
    for (const iterations of addRemoveIterations) {
        const addRemoveTime = testComponentAddRemove(testEntities, iterations);
        const operationsPerSecond = (testEntities.length * iterations * 2) / (addRemoveTime / 1000); // *2 for add+remove
        const timePerOperation = addRemoveTime / (testEntities.length * iterations * 2);
        
        console.log(`${iterations.toString().padStart(4)} 次迭代: ${addRemoveTime.toFixed(2)}ms (${operationsPerSecond.toFixed(0)}次操作/秒, ${(timePerOperation * 1000).toFixed(3)}μs/次)`);
    }
    
    console.log('\n🔎 4. 查询系统性能测试');
    console.log('-'.repeat(50));
    
    const queryIterations = [100, 500, 1000];
    
    console.log('4.1 单组件查询:');
    for (const iterations of queryIterations) {
        const queryTime = testSingleComponentQuery(testEntities, iterations);
        const queriesPerSecond = iterations / (queryTime / 1000);
        const timePerQuery = queryTime / iterations;
        
        console.log(`  ${iterations.toString().padStart(4)} 次查询: ${queryTime.toFixed(2)}ms (${queriesPerSecond.toFixed(0)}次/秒, ${timePerQuery.toFixed(3)}ms/次)`);
    }
    
    console.log('4.2 多组件查询:');
    for (const iterations of queryIterations) {
        const queryTime = testMultiComponentQuery(testEntities, iterations);
        const queriesPerSecond = iterations / (queryTime / 1000);
        const timePerQuery = queryTime / iterations;
        
        console.log(`  ${iterations.toString().padStart(4)} 次查询: ${queryTime.toFixed(2)}ms (${queriesPerSecond.toFixed(0)}次/秒, ${timePerQuery.toFixed(3)}ms/次)`);
    }
    
    console.log('4.3 标签查询:');
    for (const iterations of queryIterations) {
        const queryTime = testTagQuery(testEntities, iterations);
        const queriesPerSecond = (iterations * 2) / (queryTime / 1000); // *2 for player+enemy queries
        const timePerQuery = queryTime / (iterations * 2);
        
        console.log(`  ${iterations.toString().padStart(4)} 次查询: ${queryTime.toFixed(2)}ms (${queriesPerSecond.toFixed(0)}次/秒, ${timePerQuery.toFixed(3)}ms/次)`);
    }
    
    console.log('4.4 复合查询 (组件+标签):');
    for (const iterations of queryIterations) {
        const queryTime = testComplexQuery(testEntities, iterations);
        const queriesPerSecond = iterations / (queryTime / 1000);
        const timePerQuery = queryTime / iterations;
        
        console.log(`  ${iterations.toString().padStart(4)} 次查询: ${queryTime.toFixed(2)}ms (${queriesPerSecond.toFixed(0)}次/秒, ${timePerQuery.toFixed(3)}ms/次)`);
    }
    
    console.log('4.5 排除查询:');
    for (const iterations of queryIterations) {
        const queryTime = testExclusionQuery(testEntities, iterations);
        const queriesPerSecond = iterations / (queryTime / 1000);
        const timePerQuery = queryTime / iterations;
        
        console.log(`  ${iterations.toString().padStart(4)} 次查询: ${queryTime.toFixed(2)}ms (${queriesPerSecond.toFixed(0)}次/秒, ${timePerQuery.toFixed(3)}ms/次)`);
    }
    
    console.log('4.6 组件存在性检查:');
    for (const iterations of queryIterations) {
        const checkTime = testComponentExistence(testEntities, iterations);
        const checksPerSecond = (testEntities.length * iterations) / (checkTime / 1000);
        const timePerCheck = checkTime / (testEntities.length * iterations);
        
        console.log(`  ${iterations.toString().padStart(4)} 次迭代: ${checkTime.toFixed(2)}ms (${checksPerSecond.toFixed(0)}次检查/秒, ${(timePerCheck * 1000).toFixed(3)}μs/次)`);
    }
    
    console.log('\n🎯 5. 寻找性能极限');
    console.log('-'.repeat(50));
    
    const limitTestSizes = [10000, 25000, 50000, 100000, 200000];
    const targetFrameTime = 16.67; // 60FPS
    
    for (const size of limitTestSizes) {
        // 强制垃圾回收以获得更一致的测试结果
        try {
            if (typeof globalThis !== 'undefined' && (globalThis as any).gc) {
                (globalThis as any).gc();
            }
        } catch (e) {
            // 忽略垃圾回收错误
        }
        
        const entities: MockEntity[] = [];
        
        // 创建实体 - 简化结构，只测试核心性能
        const createStart = performance.now();
        for (let i = 0; i < size; i++) {
            const entity = new MockEntity(i);
            entity.addComponent('position', { x: i * 0.1, y: i * 0.2 });
            entity.addComponent('velocity', { vx: 1, vy: 1 });
            entities.push(entity);
        }
        const createTime = performance.now() - createStart;
        
        // 预热测试，让JavaScript引擎优化代码
        for (let warmup = 0; warmup < 10; warmup++) {
            for (const entity of entities) {
                const pos = entity.getComponent('position');
                const vel = entity.getComponent('velocity');
                if (pos && vel) {
                    pos.x += vel.vx * 0.016;
                    pos.y += vel.vy * 0.016;
                }
            }
        }
        
        // 使用固定时间测试而不是固定次数，这样更能反映真实性能
        const testTimeMs = 1000; // 测试1秒钟
        let frameCount = 0;
        let totalFrameTime = 0;
        const startTime = performance.now();
        
        while (performance.now() - startTime < testTimeMs) {
            const frameStart = performance.now();
            for (const entity of entities) {
                const pos = entity.getComponent('position');
                const vel = entity.getComponent('velocity');
                if (pos && vel) {
                    pos.x += vel.vx * 0.016;
                    pos.y += vel.vy * 0.016;
                }
            }
            const frameTime = performance.now() - frameStart;
            totalFrameTime += frameTime;
            frameCount++;
        }
        
        const avgFrameTime = totalFrameTime / frameCount;
        const fps = 1000 / avgFrameTime;
        const actualFps = frameCount / ((performance.now() - startTime) / 1000);
        const status = avgFrameTime <= targetFrameTime ? '✅' : avgFrameTime <= targetFrameTime * 2 ? '⚠️' : '❌';
        
        console.log(`${size.toString().padStart(6)} 个实体: 创建${createTime.toFixed(2)}ms, 处理${avgFrameTime.toFixed(3)}ms/帧, 理论${fps.toFixed(1)}FPS, 实际${actualFps.toFixed(1)}FPS ${status}`);
        console.log(`${' '.repeat(14)} 测试${frameCount}帧, 总时间${(performance.now() - startTime).toFixed(0)}ms`);
        
        if (avgFrameTime > targetFrameTime * 3) {
            console.log(`💥 性能极限: 约 ${size} 个实体时框架开始出现严重性能问题`);
            break;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ECS框架基准测试完成');
}

// 运行测试
runBenchmarks().catch(console.error); 