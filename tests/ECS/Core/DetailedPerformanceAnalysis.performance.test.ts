import { EntityManager } from '../../../src/ECS/Core/EntityManager';
import { ComponentTypeManager } from '../../../src/ECS/Utils/ComponentTypeManager';
import { Entity } from '../../../src/ECS/Entity';

describe('详细性能分析 - 逐步测量', () => {
    let entityManager: EntityManager;

    beforeEach(() => {
        ComponentTypeManager.instance.reset();
        entityManager = new EntityManager();
    });

    test('精确测量createEntity中每个步骤的耗时', () => {
        const testCount = 1000;
        console.log(`\n=== 详细性能分析 (${testCount}个实体) ===`);

        const timings = {
            idCheckOut: 0,
            nameGeneration: 0,
            entityConstruction: 0,
            mapSet: 0,
            nameIndexUpdate: 0,
            tagIndexUpdate: 0,
            componentIndexManager: 0,
            archetypeSystem: 0,
            dirtyTracking: 0,
            eventEmission: 0,
            total: 0
        };

        const totalStart = performance.now();

        for (let i = 0; i < testCount; i++) {
            // 步骤1: ID分配
            let stepStart = performance.now();
            const id = entityManager['_identifierPool'].checkOut();
            timings.idCheckOut += performance.now() - stepStart;

            // 步骤2: 名称生成
            stepStart = performance.now();
            const name = `Entity_${id}`;
            timings.nameGeneration += performance.now() - stepStart;

            // 步骤3: Entity构造
            stepStart = performance.now();
            const entity = new Entity(name, id);
            timings.entityConstruction += performance.now() - stepStart;

            // 步骤4: Map存储
            stepStart = performance.now();
            entityManager['_entities'].set(id, entity);
            timings.mapSet += performance.now() - stepStart;

            // 步骤5: 名称索引更新
            stepStart = performance.now();
            entityManager['updateNameIndex'](entity, true);
            timings.nameIndexUpdate += performance.now() - stepStart;

            // 步骤6: 标签索引更新
            stepStart = performance.now();
            entityManager['updateTagIndex'](entity, true);
            timings.tagIndexUpdate += performance.now() - stepStart;

            // 步骤7: 组件索引管理器
            stepStart = performance.now();
            entityManager['_componentIndexManager'].addEntity(entity);
            timings.componentIndexManager += performance.now() - stepStart;

            // 步骤8: 原型系统
            stepStart = performance.now();
            entityManager['_archetypeSystem'].addEntity(entity);
            timings.archetypeSystem += performance.now() - stepStart;

            // 步骤9: 脏标记系统
            stepStart = performance.now();
            entityManager['_dirtyTrackingSystem'].markDirty(entity, 1); // DirtyFlag.COMPONENT_ADDED
            timings.dirtyTracking += performance.now() - stepStart;

            // 步骤10: 事件发射
            stepStart = performance.now();
            entityManager['_eventBus'].emitEntityCreated({
                timestamp: Date.now(),
                source: 'EntityManager',
                entityId: entity.id,
                entityName: entity.name,
                entityTag: entity.tag?.toString()
            });
            timings.eventEmission += performance.now() - stepStart;
        }

        timings.total = performance.now() - totalStart;

        console.log('\n各步骤耗时统计:');
        console.log(`总耗时: ${timings.total.toFixed(2)}ms`);
        console.log(`平均每个实体: ${(timings.total / testCount).toFixed(3)}ms`);
        console.log('\n详细分解:');

        const sortedTimings = Object.entries(timings)
            .filter(([key]) => key !== 'total')
            .sort(([,a], [,b]) => b - a)
            .map(([key, time]) => ({
                step: key,
                timeMs: time,
                percentage: (time / timings.total * 100),
                avgPerEntity: (time / testCount * 1000) // 转换为微秒
            }));

        for (const timing of sortedTimings) {
            console.log(`  ${timing.step.padEnd(20)}: ${timing.timeMs.toFixed(2)}ms (${timing.percentage.toFixed(1)}%) - ${timing.avgPerEntity.toFixed(1)}μs/entity`);
        }

        console.log('\n最耗时的前3个步骤:');
        for (let i = 0; i < Math.min(3, sortedTimings.length); i++) {
            const timing = sortedTimings[i];
            console.log(`  ${i + 1}. ${timing.step}: ${timing.percentage.toFixed(1)}% (${timing.timeMs.toFixed(2)}ms)`);
        }
    });

    test('对比纯Entity创建和完整创建流程', () => {
        const testCount = 1000;
        console.log(`\n=== 创建方式对比 (${testCount}个实体) ===`);

        // 1. 纯Entity创建
        let startTime = performance.now();
        const pureEntities = [];
        for (let i = 0; i < testCount; i++) {
            pureEntities.push(new Entity(`Pure_${i}`, i));
        }
        const pureTime = performance.now() - startTime;

        // 2. 完整EntityManager创建
        startTime = performance.now();
        const managedEntities = [];
        for (let i = 0; i < testCount; i++) {
            managedEntities.push(entityManager.createEntity(`Managed_${i}`));
        }
        const managedTime = performance.now() - startTime;

        console.log(`纯Entity创建: ${pureTime.toFixed(2)}ms`);
        console.log(`EntityManager创建: ${managedTime.toFixed(2)}ms`);
        console.log(`性能差距: ${(managedTime / pureTime).toFixed(1)}倍`);
        console.log(`管理开销: ${(managedTime - pureTime).toFixed(2)}ms (${((managedTime - pureTime) / managedTime * 100).toFixed(1)}%)`);
    });

    test('测量批量操作的效果', () => {
        const testCount = 1000;
        console.log(`\n=== 批量操作效果测试 (${testCount}个实体) ===`);

        // 1. 逐个处理
        let startTime = performance.now();
        for (let i = 0; i < testCount; i++) {
            entityManager.createEntity(`Individual_${i}`);
        }
        const individualTime = performance.now() - startTime;

        entityManager = new EntityManager();

        // 2. 批量处理
        startTime = performance.now();
        entityManager.createEntitiesBatch(testCount, "Batch", false);
        const batchTime = performance.now() - startTime;

        entityManager = new EntityManager();

        // 3. 批量处理（跳过事件）
        startTime = performance.now();
        entityManager.createEntitiesBatch(testCount, "BatchNoEvents", true);
        const batchNoEventsTime = performance.now() - startTime;

        console.log(`逐个创建: ${individualTime.toFixed(2)}ms`);
        console.log(`批量创建: ${batchTime.toFixed(2)}ms`);
        console.log(`批量创建(跳过事件): ${batchNoEventsTime.toFixed(2)}ms`);
        console.log(`批量vs逐个: ${(individualTime / batchTime).toFixed(2)}x`);
        console.log(`跳过事件优化: ${(batchTime / batchNoEventsTime).toFixed(2)}x`);
    });

    test('分析最耗时组件的内部实现', () => {
        console.log(`\n=== 最耗时组件内部分析 ===`);
        
        const testCount = 500; // 较少数量以便详细分析

        // 单独测试各个重要组件
        const entity = new Entity("TestEntity", 1);
        
        // 测试组件索引管理器
        let startTime = performance.now();
        for (let i = 0; i < testCount; i++) {
            const testEntity = new Entity(`Test_${i}`, i);
            entityManager['_componentIndexManager'].addEntity(testEntity);
        }
        const componentIndexTime = performance.now() - startTime;

        // 测试原型系统
        startTime = performance.now();
        for (let i = 0; i < testCount; i++) {
            const testEntity = new Entity(`Test_${i}`, i + testCount);
            entityManager['_archetypeSystem'].addEntity(testEntity);
        }
        const archetypeTime = performance.now() - startTime;

        // 测试脏标记系统
        startTime = performance.now();
        for (let i = 0; i < testCount; i++) {
            const testEntity = new Entity(`Test_${i}`, i + testCount * 2);
            entityManager['_dirtyTrackingSystem'].markDirty(testEntity, 1);
        }
        const dirtyTrackingTime = performance.now() - startTime;

        // 测试事件发射
        startTime = performance.now();
        for (let i = 0; i < testCount; i++) {
            entityManager['_eventBus'].emitEntityCreated({
                timestamp: Date.now(),
                source: 'EntityManager',
                entityId: i,
                entityName: `Event_${i}`,
                entityTag: undefined
            });
        }
        const eventTime = performance.now() - startTime;

        console.log(`组件索引管理器: ${componentIndexTime.toFixed(2)}ms (${(componentIndexTime / testCount * 1000).toFixed(1)}μs/entity)`);
        console.log(`原型系统: ${archetypeTime.toFixed(2)}ms (${(archetypeTime / testCount * 1000).toFixed(1)}μs/entity)`);
        console.log(`脏标记系统: ${dirtyTrackingTime.toFixed(2)}ms (${(dirtyTrackingTime / testCount * 1000).toFixed(1)}μs/entity)`);
        console.log(`事件发射: ${eventTime.toFixed(2)}ms (${(eventTime / testCount * 1000).toFixed(1)}μs/entity)`);
    });
});