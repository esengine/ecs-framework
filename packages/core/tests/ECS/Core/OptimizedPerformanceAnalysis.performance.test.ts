import { EntityManager } from '../../../src/ECS/Core/EntityManager';
import { ComponentTypeManager } from '../../../src/ECS/Utils/ComponentTypeManager';
import { Entity } from '../../../src/ECS/Entity';

describe('优化后的性能分析 - ComponentIndexManager优化', () => {
    let entityManager: EntityManager;

    beforeEach(() => {
        ComponentTypeManager.instance.reset();
        entityManager = new EntityManager();
    });

    test('测试优化后的实体创建性能', () => {
        const testCount = 10000;
        console.log(`\n=== 优化后的实体创建性能测试 (${testCount}个实体) ===`);

        const startTime = performance.now();
        const entities = [];
        
        for (let i = 0; i < testCount; i++) {
            entities.push(entityManager.createEntity(`Entity_${i}`));
        }
        
        const totalTime = performance.now() - startTime;
        const avgTime = totalTime / testCount;

        console.log(`总耗时: ${totalTime.toFixed(2)}ms`);
        console.log(`平均每个实体: ${avgTime.toFixed(3)}ms`);
        console.log(`每秒创建实体数: ${Math.round(1000 / avgTime)}`);

        if (totalTime < 140) {
            console.log(`✅ 性能优化成功！实际耗时 ${totalTime.toFixed(2)}ms < 140ms 目标`);
        } else {
            console.log(`❌ 仍需进一步优化，实际耗时 ${totalTime.toFixed(2)}ms >= 140ms 目标`);
        }

        // 性能基准：应该在140ms以下
        expect(totalTime).toBeLessThan(200); // 放宽一些给CI环境
    });

    test('对比批量创建与逐个创建的性能', () => {
        const testCount = 5000;
        console.log(`\n=== 批量创建vs逐个创建对比 (${testCount}个实体) ===`);

        // 逐个创建
        let startTime = performance.now();
        for (let i = 0; i < testCount; i++) {
            entityManager.createEntity(`Individual_${i}`);
        }
        const individualTime = performance.now() - startTime;

        // 重置管理器
        entityManager = new EntityManager();

        // 批量创建
        startTime = performance.now();
        entityManager.createEntitiesBatch(testCount, "Batch", false);
        const batchTime = performance.now() - startTime;

        // 重置管理器
        entityManager = new EntityManager();

        // 批量创建（跳过事件）
        startTime = performance.now();
        entityManager.createEntitiesBatch(testCount, "BatchNoEvents", true);
        const batchNoEventsTime = performance.now() - startTime;

        console.log(`逐个创建: ${individualTime.toFixed(2)}ms`);
        console.log(`批量创建: ${batchTime.toFixed(2)}ms`);
        console.log(`批量创建(跳过事件): ${batchNoEventsTime.toFixed(2)}ms`);
        console.log(`批量优化倍数: ${(individualTime / batchTime).toFixed(2)}x`);
        console.log(`跳过事件优化倍数: ${(individualTime / batchNoEventsTime).toFixed(2)}x`);
    });

    test('测试组件索引管理器对空实体的优化效果', () => {
        const testCount = 10000;
        console.log(`\n=== 空实体优化效果测试 (${testCount}个空实体) ===`);

        const startTime = performance.now();
        const entities = [];
        
        for (let i = 0; i < testCount; i++) {
            const entity = entityManager.createEntity(`EmptyEntity_${i}`);
            entities.push(entity);
        }
        
        const totalTime = performance.now() - startTime;
        
        // 验证前几个实体确实没有组件
        for (let i = 0; i < Math.min(5, entities.length); i++) {
            expect(entities[i].components.length).toBe(0);
        }
        
        console.log(`空实体创建总耗时: ${totalTime.toFixed(2)}ms`);
        console.log(`平均每个空实体: ${(totalTime / testCount).toFixed(3)}ms`);
        
        // 获取优化统计信息
        const stats = entityManager.getOptimizationStats();
        console.log(`组件索引统计:`, stats.componentIndex);
        
        // 空实体创建应该非常快，放宽限制以适应CI环境
        expect(totalTime).toBeLessThan(150);
    });

    test('测试Set对象池的效果', () => {
        const testCount = 1000;
        console.log(`\n=== Set对象池效果测试 (${testCount}次添加/删除) ===`);

        // 创建实体
        const entities = [];
        for (let i = 0; i < testCount; i++) {
            entities.push(entityManager.createEntity(`PoolTest_${i}`));
        }

        // 测试删除和重新创建的性能
        const startTime = performance.now();
        
        // 删除一半实体
        for (let i = 0; i < testCount / 2; i++) {
            entityManager.destroyEntity(entities[i]);
        }
        
        // 重新创建实体
        for (let i = 0; i < testCount / 2; i++) {
            entityManager.createEntity(`RecycledEntity_${i}`);
        }
        
        const totalTime = performance.now() - startTime;
        
        console.log(`删除+重新创建耗时: ${totalTime.toFixed(2)}ms`);
        console.log(`平均每次操作: ${(totalTime / testCount).toFixed(3)}ms`);
        
        // 对象池优化应该让重复操作更快，放宽限制适应不同环境
        expect(totalTime).toBeLessThan(100);
    });

    test('内存使用量分析', () => {
        const testCount = 5000;
        console.log(`\n=== 内存使用量分析 (${testCount}个实体) ===`);

        // 获取初始内存使用情况
        const initialStats = entityManager.getOptimizationStats();
        const initialMemory = initialStats.componentIndex.memoryUsage;

        // 创建实体
        const entities = [];
        for (let i = 0; i < testCount; i++) {
            entities.push(entityManager.createEntity(`MemoryTest_${i}`));
        }

        // 获取创建后的内存使用情况
        const afterStats = entityManager.getOptimizationStats();
        const afterMemory = afterStats.componentIndex.memoryUsage;

        console.log(`初始内存使用: ${initialMemory} 字节`);
        console.log(`创建后内存使用: ${afterMemory} 字节`);
        console.log(`增加的内存: ${afterMemory - initialMemory} 字节`);
        console.log(`平均每个实体内存: ${((afterMemory - initialMemory) / testCount).toFixed(2)} 字节`);

        // 清理并观察内存回收
        for (const entity of entities) {
            entityManager.destroyEntity(entity);
        }

        const cleanupStats = entityManager.getOptimizationStats();
        const cleanupMemory = cleanupStats.componentIndex.memoryUsage;
        
        console.log(`清理后内存使用: ${cleanupMemory} 字节`);
        console.log(`内存回收率: ${(((afterMemory - cleanupMemory) / (afterMemory - initialMemory)) * 100).toFixed(1)}%`);
    });
});