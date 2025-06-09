/**
 * ECS框架性能基准测试
 * 测试框架在不同场景下的性能表现
 */

import { Scene } from '../../ECS/Scene';
import { Entity } from '../../ECS/Entity';
import { Component } from '../../ECS/Component';

console.log('🚀 ECS框架性能基准测试');
console.log('============================================================');
console.log('测试目标: 评估ECS框架在不同场景下的性能表现');
console.log('============================================================');

/**
 * 位置组件
 */
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

/**
 * 速度组件
 */
class VelocityComponent extends Component {
    public vx: number = 0;
    public vy: number = 0;

    constructor(vx: number = 0, vy: number = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
    }
}

/**
 * 生命值组件
 */
class HealthComponent extends Component {
    public health: number = 100;
    public maxHealth: number = 100;

    constructor(health: number = 100) {
        super();
        this.health = health;
        this.maxHealth = health;
    }
}

/**
 * 渲染组件
 */
class RenderComponent extends Component {
    public sprite: string = '';
    public visible: boolean = true;

    constructor(sprite: string = '') {
        super();
        this.sprite = sprite;
    }
}

/**
 * AI组件
 */
class AIComponent extends Component {
    public state: string = 'idle';
    public target: Entity | null = null;

    constructor(state: string = 'idle') {
        super();
        this.state = state;
    }
}

/**
 * 测试配置接口
 */
interface TestConfig {
    entityCounts: number[];
    queryIterations: number;
    updateIterations: number;
}

/**
 * 测试配置
 */
const TEST_CONFIG: TestConfig = {
    entityCounts: [1000, 5000, 10000, 25000, 50000, 100000, 200000, 500000],
    queryIterations: 1000,
    updateIterations: 100
};

/**
 * 性能测试结果
 */
interface PerformanceResult {
    entityCount: number;
    singleQuery: number;
    multiQuery: number;
    complexQuery: number;
    tagQuery: number;
    singleTagQuery: number;
    entityUpdate: number;
    memoryUsage: number;
}

/**
 * 测试创建实体的性能
 */
function testEntityCreation(scene: Scene, count: number): {
    totalTime: number;
    averageTime: number;
    entitiesPerSecond: number;
    breakdown: {
        entityCreation: number;
        componentAddition: number;
        tagAssignment: number;
    };
} {
    const startTime = performance.now();
    let entityCreationTime = 0;
    let componentAdditionTime = 0;
    let tagAssignmentTime = 0;

    // 批量创建实体（不添加组件）
    const entityStart = performance.now();
    const entities = scene.createEntities(count, "Entity");
    entityCreationTime = performance.now() - entityStart;

    // 批量添加组件
    const componentStart = performance.now();
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        
        // 所有实体都有位置组件
        entity.addComponent(new PositionComponent(
            Math.random() * 1000,
            Math.random() * 1000
        ));

        // 70%的实体有速度组件
        if (Math.random() < 0.7) {
            entity.addComponent(new VelocityComponent(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            ));
        }

        // 50%的实体有生命值组件
        if (Math.random() < 0.5) {
            entity.addComponent(new HealthComponent(
                Math.floor(Math.random() * 100) + 50
            ));
        }

        // 30%的实体有渲染组件
        if (Math.random() < 0.3) {
            entity.addComponent(new RenderComponent(`sprite_${i % 10}`));
        }

        // 20%的实体有AI组件
        if (Math.random() < 0.2) {
            entity.addComponent(new AIComponent(['idle', 'patrol', 'chase'][Math.floor(Math.random() * 3)]));
        }
    }
    componentAdditionTime = performance.now() - componentStart;

    // 批量设置标签
    const tagStart = performance.now();
    for (const entity of entities) {
        entity.tag = Math.floor(Math.random() * 10);
    }
    tagAssignmentTime = performance.now() - tagStart;

    const totalTime = performance.now() - startTime;
    
    return {
        totalTime,
        averageTime: totalTime / count,
        entitiesPerSecond: count / (totalTime / 1000),
        breakdown: {
            entityCreation: entityCreationTime,
            componentAddition: componentAdditionTime,
            tagAssignment: tagAssignmentTime
        }
    };
}

/**
 * 创建测试实体
 */
function createTestEntities(scene: Scene, count: number): Entity[] {
    const entities: Entity[] = [];

    for (let i = 0; i < count; i++) {
        const entity = scene.createEntity(`Entity_${i}`);
        
        // 所有实体都有位置组件
        entity.addComponent(new PositionComponent(
            Math.random() * 1000,
            Math.random() * 1000
        ));

        // 70%的实体有速度组件
        if (Math.random() < 0.7) {
            entity.addComponent(new VelocityComponent(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            ));
        }

        // 50%的实体有生命值组件
        if (Math.random() < 0.5) {
            entity.addComponent(new HealthComponent(
                Math.floor(Math.random() * 100) + 50
            ));
        }

        // 30%的实体有渲染组件
        if (Math.random() < 0.3) {
            entity.addComponent(new RenderComponent(`sprite_${i % 10}`));
        }

        // 20%的实体有AI组件
        if (Math.random() < 0.2) {
            entity.addComponent(new AIComponent(['idle', 'patrol', 'chase'][Math.floor(Math.random() * 3)]));
        }

        // 设置随机标签
        entity.tag = Math.floor(Math.random() * 10);

        entities.push(entity);
    }

    return entities;
}

/**
 * 测试单组件查询性能
 */
function testSingleComponentQuery(scene: Scene, iterations: number): number {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        scene.querySystem.queryAll(PositionComponent);
    }
    
    return performance.now() - startTime;
}

/**
 * 测试多组件查询性能
 */
function testMultiComponentQuery(scene: Scene, iterations: number): number {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        scene.querySystem.queryAll(PositionComponent, VelocityComponent);
    }
    
    return performance.now() - startTime;
}

/**
 * 测试复杂查询性能
 */
function testComplexQuery(scene: Scene, iterations: number): number {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        scene.querySystem.queryAll(PositionComponent, VelocityComponent, HealthComponent);
    }
    
    return performance.now() - startTime;
}

/**
 * 测试标签查询性能
 */
function testTagQuery(scene: Scene, iterations: number): number {
    const startTime = performance.now();
    
    // 优化：预先获取所有标签查询结果，然后重复使用
    // 这更符合实际游戏中的使用模式
    const tags = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    for (let i = 0; i < iterations; i++) {
        // 批量查询所有标签
        for (const tag of tags) {
            scene.querySystem.queryByTag(tag);
        }
    }
    
    return performance.now() - startTime;
}

/**
 * 测试单个标签查询性能
 */
function testSingleTagQuery(scene: Scene, iterations: number): number {
    const startTime = performance.now();
    
    // 只查询标签0，测试单个标签的查询性能和缓存效果
    for (let i = 0; i < iterations; i++) {
        scene.querySystem.queryByTag(0);
    }
    
    return performance.now() - startTime;
}

/**
 * 测试实体更新性能
 */
function testEntityUpdate(scene: Scene, iterations: number): number {
    const entities = scene.querySystem.queryAll(PositionComponent, VelocityComponent).entities;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        for (const entity of entities) {
            const pos = entity.getComponent(PositionComponent);
            const vel = entity.getComponent(VelocityComponent);
            if (pos && vel) {
                pos.x += vel.vx;
                pos.y += vel.vy;
            }
        }
    }
    
    return performance.now() - startTime;
}

/**
 * 获取内存使用情况
 */
function getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    return 0;
}

/**
 * 运行性能测试
 */
function runPerformanceTest(scene: Scene, entityCount: number, config: TestConfig): PerformanceResult {
    console.log(`\n📊 测试 ${entityCount.toLocaleString()} 个实体...`);

    // 测试实体创建性能
    const startMemory = getMemoryUsage();
    console.log(`   🔧 测试实体创建性能...`);
         const creationStats = testEntityCreation(scene, entityCount);
    const endMemory = getMemoryUsage();
    
    console.log(`   📈 实体创建性能分析:`);
    console.log(`      总时间: ${creationStats.totalTime.toFixed(2)}ms`);
    console.log(`      平均时间: ${creationStats.averageTime.toFixed(4)}ms/实体`);
    console.log(`      创建速度: ${creationStats.entitiesPerSecond.toFixed(0)} 实体/秒`);
    console.log(`      时间分解:`);
    console.log(`        - 实体创建: ${creationStats.breakdown.entityCreation.toFixed(2)}ms (${(creationStats.breakdown.entityCreation / creationStats.totalTime * 100).toFixed(1)}%)`);
    console.log(`        - 组件添加: ${creationStats.breakdown.componentAddition.toFixed(2)}ms (${(creationStats.breakdown.componentAddition / creationStats.totalTime * 100).toFixed(1)}%)`);
    console.log(`        - 标签分配: ${creationStats.breakdown.tagAssignment.toFixed(2)}ms (${(creationStats.breakdown.tagAssignment / creationStats.totalTime * 100).toFixed(1)}%)`);
    console.log(`      内存使用: ${(endMemory - startMemory).toFixed(1)}MB`);

    // 运行测试
    console.log(`   🔍 执行查询测试...`);
    const singleQuery = testSingleComponentQuery(scene, config.queryIterations);
    const multiQuery = testMultiComponentQuery(scene, config.queryIterations);
    const complexQuery = testComplexQuery(scene, config.queryIterations);
    const tagQuery = testTagQuery(scene, config.queryIterations);
    const singleTagQuery = testSingleTagQuery(scene, config.queryIterations);
    
    console.log(`   ⚡ 执行更新测试...`);
    const entityUpdate = testEntityUpdate(scene, config.updateIterations);
    
    console.log(`   ✅ 测试完成`);

    return {
        entityCount,
        singleQuery,
        multiQuery,
        complexQuery,
        tagQuery,
        singleTagQuery,
        entityUpdate,
        memoryUsage: endMemory - startMemory
    };
}

/**
 * 显示系统信息
 */
function displaySystemInfo(scene: Scene): void {
    const status = scene.querySystem.getAccelerationStatus();
    const stats = scene.querySystem.getStats();

    console.log('\n🔍 系统信息:');
    console.log(`   当前提供者: ${status.currentProvider}`);
    console.log(`   WebAssembly: ${status.wasmEnabled ? '已启用' : '未启用'}`);
    console.log(`   可用提供者: ${status.availableProviders.join(', ')}`);
    console.log(`   索引统计:`);
    console.log(`     组件掩码索引: ${stats.indexStats.maskIndexSize}`);
    console.log(`     组件类型索引: ${stats.indexStats.componentIndexSize}`);
    console.log(`     标签索引: ${stats.indexStats.tagIndexSize}`);
    console.log(`     名称索引: ${stats.indexStats.nameIndexSize}`);
    
    if (status.performanceInfo?.cacheStats) {
        console.log(`   查询缓存:`);
        console.log(`     缓存大小: ${status.performanceInfo.cacheStats.size}`);
        console.log(`     命中率: ${status.performanceInfo.cacheStats.hitRate}`);
    }
}

/**
 * 显示性能结果
 */
function displayResults(results: PerformanceResult[], scene: Scene): void {
    console.log('\n📈 ECS框架性能测试结果');
    console.log('='.repeat(130));
    console.log('| 实体数量   | 单组件查询 | 双组件查询 | 三组件查询 | 多标签查询 | 单标签查询 | 实体更新  | 内存使用  |');
    console.log('|' + '-'.repeat(128) + '|');

    for (const result of results) {
        const entityCount = result.entityCount.toLocaleString().padStart(9);
        const singleQuery = `${result.singleQuery.toFixed(2)}ms`.padStart(10);
        const multiQuery = `${result.multiQuery.toFixed(2)}ms`.padStart(10);
        const complexQuery = `${result.complexQuery.toFixed(2)}ms`.padStart(10);
        const tagQuery = `${result.tagQuery.toFixed(2)}ms`.padStart(10);
        const singleTagQuery = `${result.singleTagQuery.toFixed(2)}ms`.padStart(10);
        const entityUpdate = `${result.entityUpdate.toFixed(2)}ms`.padStart(9);
        const memoryUsage = `${result.memoryUsage.toFixed(1)}MB`.padStart(9);

        console.log(`| ${entityCount} | ${singleQuery} | ${multiQuery} | ${complexQuery} | ${tagQuery} | ${singleTagQuery} | ${entityUpdate} | ${memoryUsage} |`);
    }

    console.log('|' + '-'.repeat(128) + '|');

    // 计算性能指标
    const maxEntities = Math.max(...results.map(r => r.entityCount));
    const maxResult = results.find(r => r.entityCount === maxEntities)!;
    
    console.log(`\n🎯 性能峰值 (${maxEntities.toLocaleString()} 个实体):`);
    console.log(`   单组件查询: ${(TEST_CONFIG.queryIterations / maxResult.singleQuery * 1000).toFixed(0)} 次/秒`);
    console.log(`   双组件查询: ${(TEST_CONFIG.queryIterations / maxResult.multiQuery * 1000).toFixed(0)} 次/秒`);
    console.log(`   三组件查询: ${(TEST_CONFIG.queryIterations / maxResult.complexQuery * 1000).toFixed(0)} 次/秒`);
    console.log(`   多标签查询: ${(TEST_CONFIG.queryIterations * 10 / maxResult.tagQuery * 1000).toFixed(0)} 次/秒`);
    console.log(`   单标签查询: ${(TEST_CONFIG.queryIterations / maxResult.singleTagQuery * 1000).toFixed(0)} 次/秒`);
    console.log(`   实体更新: ${(maxResult.entityCount * TEST_CONFIG.updateIterations / maxResult.entityUpdate * 1000).toFixed(0)} 个/秒`);
    console.log(`   内存效率: ${(maxResult.entityCount / (maxResult.memoryUsage || 1)).toFixed(0)} 实体/MB`);

    // 性能评级
    const avgQueryTime = (maxResult.singleQuery + maxResult.multiQuery + maxResult.complexQuery + maxResult.singleTagQuery) / 4;
    let rating = '';
    if (avgQueryTime < 50) rating = '🚀 优秀';
    else if (avgQueryTime < 100) rating = '✅ 良好';
    else if (avgQueryTime < 200) rating = '⚠️ 一般';
    else rating = '❌ 需要优化';

    console.log(`\n📊 性能评级: ${rating}`);
    console.log(`   平均查询时间: ${avgQueryTime.toFixed(2)}ms`);
    
    // 显示查询统计信息
    const queryStats = scene.querySystem.getStats().queryStats;
    console.log(`\n🔍 查询统计:`);
    console.log(`   总查询次数: ${queryStats.totalQueries.toLocaleString()}`);
    console.log(`   缓存命中: ${queryStats.cacheHits.toLocaleString()}`);
    console.log(`   索引命中: ${queryStats.indexHits.toLocaleString()}`);
    console.log(`   线性扫描: ${queryStats.linearScans.toLocaleString()}`);
    console.log(`   缓存命中率: ${queryStats.cacheHitRate}`);
    
    // 标签查询性能分析
    console.log(`\n🏷️ 标签查询分析:`);
    const tagQueryRatio = maxResult.tagQuery / maxResult.singleTagQuery;
    console.log(`   多标签查询 vs 单标签查询: ${tagQueryRatio.toFixed(2)}x (预期约10x)`);
    if (tagQueryRatio > 15) {
        console.log(`   ⚠️ 多标签查询性能异常，可能存在缓存问题`);
    } else if (tagQueryRatio < 5) {
        console.log(`   ✅ 标签查询缓存效果良好`);
    } else {
        console.log(`   📊 标签查询性能正常`);
    }
    
    // 性能改进分析
    const improvement = calculatePerformanceImprovement(results);
    if (improvement) {
        console.log(`\n📈 性能改进分析:`);
        console.log(`   双组件查询改进: ${improvement.multiQuery}x`);
        console.log(`   三组件查询改进: ${improvement.complexQuery}x`);
        console.log(`   整体查询改进: ${improvement.overall}x`);
    }
    
    // 扩展性分析
    console.log(`\n📊 扩展性分析:`);
    analyzeScalability(results);
}

/**
 * 计算性能改进（与优化前对比）
 */
function calculatePerformanceImprovement(results: PerformanceResult[]): {
    multiQuery: string;
    complexQuery: string;
    overall: string;
} | null {
    // 基于50,000实体的结果进行分析
    const maxResult = results.find(r => r.entityCount === 50000);
    if (!maxResult) return null;
    
    // 优化前的基准时间（基于之前的测试结果）
    const baselineMultiQuery = 1270.54; // ms
    const baselineComplexQuery = 981.76; // ms
    
    const multiImprovement = (baselineMultiQuery / maxResult.multiQuery).toFixed(2);
    const complexImprovement = (baselineComplexQuery / maxResult.complexQuery).toFixed(2);
    const overallImprovement = ((baselineMultiQuery + baselineComplexQuery) / 
                               (maxResult.multiQuery + maxResult.complexQuery)).toFixed(2);
    
    return {
        multiQuery: multiImprovement,
        complexQuery: complexImprovement,
        overall: overallImprovement
    };
}

/**
 * 分析系统扩展性
 */
function analyzeScalability(results: PerformanceResult[]): void {
    if (results.length < 2) return;
    
    // 分析查询时间随实体数量的变化趋势
    const first = results[0];
    const last = results[results.length - 1];
    
    const entityRatio = last.entityCount / first.entityCount;
    const singleQueryRatio = last.singleQuery / first.singleQuery;
    const multiQueryRatio = last.multiQuery / first.multiQuery;
    const complexQueryRatio = last.complexQuery / first.complexQuery;
    
    console.log(`   实体数量增长: ${entityRatio.toFixed(1)}x (${first.entityCount.toLocaleString()} → ${last.entityCount.toLocaleString()})`);
    console.log(`   单组件查询时间增长: ${singleQueryRatio.toFixed(2)}x`);
    console.log(`   双组件查询时间增长: ${multiQueryRatio.toFixed(2)}x`);
    console.log(`   三组件查询时间增长: ${complexQueryRatio.toFixed(2)}x`);
    
    // 计算复杂度
    const avgComplexity = (singleQueryRatio + multiQueryRatio + complexQueryRatio) / 3;
    let complexityRating = '';
    if (avgComplexity < entityRatio * 0.1) complexityRating = '🚀 近似O(1) - 优秀';
    else if (avgComplexity < entityRatio * 0.5) complexityRating = '✅ 亚线性 - 良好';
    else if (avgComplexity < entityRatio) complexityRating = '⚠️ 接近线性 - 一般';
    else complexityRating = '❌ 超线性 - 需要优化';
    
    console.log(`   时间复杂度评估: ${complexityRating}`);
    
    // 内存效率分析
    const memoryEfficiencyFirst = first.entityCount / first.memoryUsage;
    const memoryEfficiencyLast = last.entityCount / last.memoryUsage;
    const memoryEfficiencyRatio = memoryEfficiencyLast / memoryEfficiencyFirst;
    
    console.log(`   内存效率变化: ${memoryEfficiencyRatio.toFixed(2)}x (${memoryEfficiencyFirst.toFixed(0)} → ${memoryEfficiencyLast.toFixed(0)} 实体/MB)`);
}

/**
 * 专门测试实体创建性能
 */
async function runEntityCreationBenchmark(): Promise<void> {
    console.log('\n🚀 实体创建性能基准测试');
    console.log('='.repeat(60));

    const testCounts = [1000, 5000, 10000, 50000, 100000];
    
    for (const count of testCounts) {
        console.log(`\n📊 测试创建 ${count.toLocaleString()} 个实体:`);
        
        // 创建新场景
        const scene = new Scene();
        
        // 测试创建性能
        const stats = testEntityCreation(scene, count);
        
        console.log(`   总时间: ${stats.totalTime.toFixed(2)}ms`);
        console.log(`   平均时间: ${stats.averageTime.toFixed(4)}ms/实体`);
        console.log(`   创建速度: ${stats.entitiesPerSecond.toFixed(0)} 实体/秒`);
        console.log(`   时间分解:`);
        console.log(`     - 实体创建: ${stats.breakdown.entityCreation.toFixed(2)}ms (${(stats.breakdown.entityCreation / stats.totalTime * 100).toFixed(1)}%)`);
        console.log(`     - 组件添加: ${stats.breakdown.componentAddition.toFixed(2)}ms (${(stats.breakdown.componentAddition / stats.totalTime * 100).toFixed(1)}%)`);
        console.log(`     - 标签分配: ${stats.breakdown.tagAssignment.toFixed(2)}ms (${(stats.breakdown.tagAssignment / stats.totalTime * 100).toFixed(1)}%)`);
        
        // 分析性能瓶颈
        const { entityCreation, componentAddition, tagAssignment } = stats.breakdown;
        const total = stats.totalTime;
        
        console.log(`   性能瓶颈分析:`);
        if (componentAddition / total > 0.5) {
            console.log(`     ⚠️  组件添加是主要瓶颈 (${(componentAddition / total * 100).toFixed(1)}%)`);
        }
        if (entityCreation / total > 0.3) {
            console.log(`     ⚠️  实体创建开销较高 (${(entityCreation / total * 100).toFixed(1)}%)`);
        }
        if (tagAssignment / total > 0.1) {
            console.log(`     ⚠️  标签分配开销异常 (${(tagAssignment / total * 100).toFixed(1)}%)`);
        }
        
                 // 分析组件添加性能（仅对较小的测试集）
         if (count <= 10000) {
             analyzeComponentAdditionPerformance(new Scene(), Math.min(count, 5000));
         }
         
         // 清理场景
         scene.end();
     }
    
    console.log('\n📈 实体创建性能总结:');
    console.log('   主要性能瓶颈通常在组件添加阶段');
    console.log('   建议优化方向:');
    console.log('   1. 减少组件注册开销');
    console.log('   2. 优化位掩码计算');
    console.log('   3. 减少内存分配次数');
    console.log('   4. 使用对象池复用组件实例');
}

/**
 * 测试组件添加性能的详细分析
 */
function analyzeComponentAdditionPerformance(scene: Scene, count: number): void {
    console.log(`\n🔬 组件添加性能详细分析 (${count.toLocaleString()} 个实体):`);
    
    // 创建实体但不添加组件
    const entities = scene.createEntities(count, "TestEntity");
    
    // 分别测试每种组件的添加性能
    const componentTests = [
        {
            name: "PositionComponent",
            create: () => new PositionComponent(Math.random() * 1000, Math.random() * 1000),
            probability: 1.0
        },
        {
            name: "VelocityComponent", 
            create: () => new VelocityComponent((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
            probability: 0.7
        },
        {
            name: "HealthComponent",
            create: () => new HealthComponent(Math.floor(Math.random() * 100) + 50),
            probability: 0.5
        },
        {
            name: "RenderComponent",
            create: () => new RenderComponent(`sprite_${Math.floor(Math.random() * 10)}`),
            probability: 0.3
        },
        {
            name: "AIComponent",
            create: () => new AIComponent(['idle', 'patrol', 'chase'][Math.floor(Math.random() * 3)]),
            probability: 0.2
        }
    ];
    
    for (const test of componentTests) {
        const startTime = performance.now();
        let addedCount = 0;
        
        for (const entity of entities) {
            if (Math.random() < test.probability) {
                entity.addComponent(test.create());
                addedCount++;
            }
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        console.log(`   ${test.name}:`);
        console.log(`     添加数量: ${addedCount.toLocaleString()}`);
        console.log(`     总时间: ${totalTime.toFixed(2)}ms`);
        console.log(`     平均时间: ${(totalTime / addedCount).toFixed(4)}ms/组件`);
        console.log(`     添加速度: ${(addedCount / (totalTime / 1000)).toFixed(0)} 组件/秒`);
    }
}

/**
 * 主测试函数
 */
async function runBenchmarks(): Promise<void> {
    console.log('🎯 ECS框架性能基准测试');
    console.log('='.repeat(60));

    // 先运行实体创建性能测试
    await runEntityCreationBenchmark();

    // 然后运行完整的框架测试
    console.log('\n🚀 完整框架性能测试');
    console.log('='.repeat(60));

    console.log(`\n⚙️ 测试配置:`);
    console.log(`   实体数量: ${TEST_CONFIG.entityCounts.map(n => n.toLocaleString()).join(', ')}`);
    console.log(`   查询迭代: ${TEST_CONFIG.queryIterations.toLocaleString()}`);
    console.log(`   更新迭代: ${TEST_CONFIG.updateIterations.toLocaleString()}`);
    console.log(`   预计测试时间: ${(TEST_CONFIG.entityCounts.length * 2).toFixed(0)}-${(TEST_CONFIG.entityCounts.length * 5).toFixed(0)} 分钟`);

    console.log('\n🔧 初始化ECS框架...');

    // 初始化WebAssembly模块
    try {
        const { ecsCore } = await import('../../Utils/WasmCore');
        await ecsCore.initialize();
        console.log(`✅ WebAssembly模块: ${ecsCore.isUsingWasm() ? '已加载' : '未加载'}`);
    } catch (error) {
        console.log('⚠️ WebAssembly模块加载失败，使用JavaScript实现');
    }

    const scene = new Scene();
    
    // 等待初始化完成
    await new Promise(resolve => setTimeout(resolve, 1000));

    displaySystemInfo(scene);

    const results: PerformanceResult[] = [];
    const totalTests = TEST_CONFIG.entityCounts.length;

    // 运行不同规模的测试
    for (let i = 0; i < TEST_CONFIG.entityCounts.length; i++) {
        const entityCount = TEST_CONFIG.entityCounts[i];
        console.log(`\n🔄 进度: ${i + 1}/${totalTests} (${((i + 1) / totalTests * 100).toFixed(1)}%)`);
        
        const result = runPerformanceTest(scene, entityCount, TEST_CONFIG);
        results.push(result);
        
        // 清理场景，准备下一轮测试
        console.log(`   🧹 清理内存...`);
        scene.end();
        scene.begin();
        
        // 强制垃圾回收
        if (typeof global !== 'undefined' && global.gc) {
            global.gc();
        }
        
        // 大规模测试间隔稍作休息
        if (entityCount >= 100000) {
            console.log(`   ⏱️ 等待系统稳定...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    displayResults(results, scene);

    scene.end();
    console.log('\n✅ 性能测试完成！');
    console.log(`📊 总测试时间: ${((Date.now() - startTime) / 1000 / 60).toFixed(1)} 分钟`);
}

// 记录开始时间
const startTime = Date.now();

// 运行测试
runBenchmarks().catch(error => {
    console.error('❌ 测试失败:', error);
}); 