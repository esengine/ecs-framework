import { EntityManager } from '../../../src/ECS/Core/EntityManager';
import { ComponentTypeManager } from '../../../src/ECS/Utils/ComponentTypeManager';

describe('批量创建功能测试', () => {
    let entityManager: EntityManager;

    beforeEach(() => {
        ComponentTypeManager.instance.reset();
        entityManager = new EntityManager();
    });

    test('批量创建实体应该使用ID作为名称', () => {
        const entities = entityManager.createEntitiesBatch(5, "Test");
        
        expect(entities).toHaveLength(5);
        
        // 验证实体名称使用ID而不是索引
        for (const entity of entities) {
            expect(entity.name).toBe(`Test_${entity.id}`);
        }
        
        // 验证ID是唯一的
        const ids = entities.map(e => e.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(5);
    });

    test('单个创建实体应该使用ID作为默认名称', () => {
        const entity1 = entityManager.createEntity();
        const entity2 = entityManager.createEntity();
        const entity3 = entityManager.createEntity("CustomName");
        
        expect(entity1.name).toBe(`Entity_${entity1.id}`);
        expect(entity2.name).toBe(`Entity_${entity2.id}`);
        expect(entity3.name).toBe("CustomName");
        
        // 确保ID是连续的或至少是唯一的
        expect(entity1.id).not.toBe(entity2.id);
        expect(entity2.id).not.toBe(entity3.id);
    });

    test('混合创建方式的名称应该一致', () => {
        // 先单个创建
        const single = entityManager.createEntity();
        
        // 再批量创建
        const batch = entityManager.createEntitiesBatch(3, "Batch");
        
        // 再单个创建
        const single2 = entityManager.createEntity();
        
        // 验证名称格式一致
        expect(single.name).toBe(`Entity_${single.id}`);
        expect(single2.name).toBe(`Entity_${single2.id}`);
        
        for (const entity of batch) {
            expect(entity.name).toBe(`Batch_${entity.id}`);
        }
    });
});