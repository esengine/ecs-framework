import { EntityManager } from '../../src/ECS/Core/EntityManager';
import { ComponentTypeManager } from '../../src/ECS/Utils/ComponentTypeManager';

describe('实体创建性能分析', () => {
    let entityManager: EntityManager;

    beforeEach(() => {
        ComponentTypeManager.instance.reset();
        entityManager = new EntityManager();
    });

    test('性能分析：创建10000个实体', () => {
        const entityCount = 10000;
        console.log(`开始创建 ${entityCount} 个实体...`);

        // 预热
        for (let i = 0; i < 100; i++) {
            entityManager.createEntity(`Warmup_${i}`);
        }
        // 重新创建EntityManager来清理
        entityManager = new EntityManager();

        // 测试不同的创建方式
        console.log('\n=== 性能对比测试 ===');

        // 1. 使用默认名称（包含Date.now()）
        let startTime = performance.now();
        const entitiesWithDefaultName: any[] = [];
        for (let i = 0; i < entityCount; i++) {
            entitiesWithDefaultName.push(entityManager.createEntity());
        }
        let endTime = performance.now();
        console.log(`1. 默认名称创建: ${(endTime - startTime).toFixed(2)}ms`);
        entityManager = new EntityManager();

        // 2. 使用预设名称（避免Date.now()）
        startTime = performance.now();
        const entitiesWithPresetName: any[] = [];
        for (let i = 0; i < entityCount; i++) {
            entitiesWithPresetName.push(entityManager.createEntity(`Entity_${i}`));
        }
        endTime = performance.now();
        console.log(`2. 预设名称创建: ${(endTime - startTime).toFixed(2)}ms`);
        entityManager = new EntityManager();

        // 3. 使用相同名称（减少字符串创建）
        startTime = performance.now();
        const entitiesWithSameName: any[] = [];
        const sameName = 'SameName';
        for (let i = 0; i < entityCount; i++) {
            entitiesWithSameName.push(entityManager.createEntity(sameName));
        }
        endTime = performance.now();
        console.log(`3. 相同名称创建: ${(endTime - startTime).toFixed(2)}ms`);
        entityManager = new EntityManager();

        // 4. 直接创建Entity对象（绕过EntityManager）
        startTime = performance.now();
        const directEntities: any[] = [];
        for (let i = 0; i < entityCount; i++) {
            // 直接创建Entity，不通过EntityManager的复杂逻辑
            directEntities.push(new (require('../../src/ECS/Entity').Entity)(`Direct_${i}`, i));
        }
        endTime = performance.now();
        console.log(`4. 直接创建Entity: ${(endTime - startTime).toFixed(2)}ms`);

        console.log('\n=== 性能分析结论 ===');
        console.log('如果相同名称创建明显更快，说明字符串操作是瓶颈');
        console.log('如果直接创建Entity更快，说明EntityManager的逻辑太重');
    });

    test('详细分析EntityManager中的性能瓶颈', () => {
        const entityCount = 1000; // 较小数量便于分析
        
        console.log('\n=== 详细性能分析 ===');

        // 分析各个步骤的耗时
        let totalTime = 0;
        const stepTimes: Record<string, number> = {};

        for (let i = 0; i < entityCount; i++) {
            const stepStart = performance.now();
            
            // 模拟EntityManager.createEntity的各个步骤
            const name = `PerfTest_${i}`;
            
            // 步骤1: ID分配
            let stepTime = performance.now();
            const id = entityManager['_identifierPool'].checkOut();
            stepTimes['ID分配'] = (stepTimes['ID分配'] || 0) + (performance.now() - stepTime);
            
            // 步骤2: Entity创建
            stepTime = performance.now();
            const entity = new (require('../../src/ECS/Entity').Entity)(name, id);
            stepTimes['Entity创建'] = (stepTimes['Entity创建'] || 0) + (performance.now() - stepTime);
            
            // 步骤3: 各种索引更新
            stepTime = performance.now();
            entityManager['_entities'].set(id, entity);
            stepTimes['Map存储'] = (stepTimes['Map存储'] || 0) + (performance.now() - stepTime);
            
            stepTime = performance.now();
            entityManager['updateNameIndex'](entity, true);
            stepTimes['名称索引'] = (stepTimes['名称索引'] || 0) + (performance.now() - stepTime);
            
            stepTime = performance.now();
            entityManager['updateTagIndex'](entity, true);
            stepTimes['标签索引'] = (stepTimes['标签索引'] || 0) + (performance.now() - stepTime);
            
            stepTime = performance.now();
            entityManager['_componentIndexManager'].addEntity(entity);
            stepTimes['组件索引'] = (stepTimes['组件索引'] || 0) + (performance.now() - stepTime);
            
            stepTime = performance.now();
            entityManager['_archetypeSystem'].addEntity(entity);
            stepTimes['原型系统'] = (stepTimes['原型系统'] || 0) + (performance.now() - stepTime);
            
            stepTime = performance.now();
            entityManager['_dirtyTrackingSystem'].markDirty(entity, 1); // DirtyFlag.COMPONENT_ADDED
            stepTimes['脏标记'] = (stepTimes['脏标记'] || 0) + (performance.now() - stepTime);
            
            stepTime = performance.now();
            // 跳过事件发射，因为它涉及复杂的对象创建
            stepTimes['其他'] = (stepTimes['其他'] || 0) + (performance.now() - stepTime);
            
            totalTime += (performance.now() - stepStart);
        }

        console.log(`总耗时: ${totalTime.toFixed(2)}ms`);
        console.log('各步骤平均耗时:');
        for (const [step, time] of Object.entries(stepTimes)) {
            console.log(`  ${step}: ${(time / entityCount * 1000).toFixed(3)}μs/entity`);
        }
        
        // 找出最耗时的步骤
        const maxTime = Math.max(...Object.values(stepTimes));
        const slowestStep = Object.entries(stepTimes).find(([_, time]) => time === maxTime)?.[0];
        console.log(`最耗时的步骤: ${slowestStep} (${(maxTime / entityCount * 1000).toFixed(3)}μs/entity)`);
    });

    test('测试批量创建优化方案', () => {
        const entityCount = 10000;
        console.log(`\n=== 批量创建优化测试 ===`);

        // 当前方式：逐个创建
        let startTime = performance.now();
        for (let i = 0; i < entityCount; i++) {
            entityManager.createEntity(`Current_${i}`);
        }
        let endTime = performance.now();
        const currentTime = endTime - startTime;
        console.log(`当前方式: ${currentTime.toFixed(2)}ms`);

        entityManager = new EntityManager();

        // 如果有批量创建方法的话...
        // （这里只是演示概念，实际的批量创建需要在EntityManager中实现）
        console.log('建议：实现批量创建方法，减少重复的索引更新和事件发射');
    });

    test('验证批量创建优化效果', () => {
        const entityCount = 10000;
        console.log(`\n=== 批量创建优化效果验证 ===`);

        // 测试新的批量创建方法
        let startTime = performance.now();
        const batchEntities = entityManager.createEntitiesBatch(entityCount, "Batch", false);
        let endTime = performance.now();
        const batchTime = endTime - startTime;
        console.log(`批量创建(含事件): ${batchTime.toFixed(2)}ms`);

        entityManager = new EntityManager();

        // 测试跳过事件的批量创建
        startTime = performance.now();
        const batchEntitiesNoEvents = entityManager.createEntitiesBatch(entityCount, "BatchNoEvents", true);
        endTime = performance.now();
        const batchTimeNoEvents = endTime - startTime;
        console.log(`批量创建(跳过事件): ${batchTimeNoEvents.toFixed(2)}ms`);

        entityManager = new EntityManager();

        // 对比单个创建（使用优化后的createEntity）
        startTime = performance.now();
        const singleEntities: any[] = [];
        for (let i = 0; i < entityCount; i++) {
            singleEntities.push(entityManager.createEntity(`Single_${i}`));
        }
        endTime = performance.now();
        const singleTime = endTime - startTime;
        console.log(`优化后单个创建: ${singleTime.toFixed(2)}ms`);

        console.log(`\n性能提升:`);
        console.log(`批量创建 vs 单个创建: ${(singleTime / batchTime).toFixed(1)}x faster`);
        console.log(`批量创建(跳过事件) vs 单个创建: ${(singleTime / batchTimeNoEvents).toFixed(1)}x faster`);

        // 验证功能正确性
        expect(batchEntities.length).toBe(entityCount);
        expect(batchEntitiesNoEvents.length).toBe(entityCount);
        expect(singleEntities.length).toBe(entityCount);
    });

    test('验证createEntity的Date.now()优化', () => {
        console.log(`\n=== createEntity优化验证 ===`);
        
        const testCount = 1000;
        
        // 测试优化后的默认名称生成
        let startTime = performance.now();
        for (let i = 0; i < testCount; i++) {
            entityManager.createEntity(); // 使用优化后的计数器命名
        }
        let endTime = performance.now();
        console.log(`计数器命名: ${(endTime - startTime).toFixed(2)}ms`);
        
        entityManager = new EntityManager();
        
        // 对比：模拟使用Date.now()的方式
        startTime = performance.now();
        for (let i = 0; i < testCount; i++) {
            entityManager.createEntity(`Entity_${Date.now()}_${i}`); // 模拟原来的方式
        }
        endTime = performance.now();
        console.log(`Date.now()命名: ${(endTime - startTime).toFixed(2)}ms`);
    });
});