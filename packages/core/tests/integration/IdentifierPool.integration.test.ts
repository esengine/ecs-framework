/**
 * IdentifierPool 集成测试
 * 
 * 测试新的世代式IdentifierPool与现有ECS系统的兼容性
 */
import { IdentifierPool } from '../../src/ECS/Utils/IdentifierPool';
import { Scene } from '../../src/ECS/Scene';
import { Entity } from '../../src/ECS/Entity';

describe('IdentifierPool 集成测试', () => {
    let scene: Scene;

    beforeEach(() => {
        scene = new Scene();
    });

    describe('与Scene系统集成', () => {
        test('Scene应该能使用新的IdentifierPool', () => {
            // Scene内部使用IdentifierPool
            expect(scene.identifierPool).toBeInstanceOf(IdentifierPool);
        });

        test('Scene应该能正常创建实体', () => {
            const entity1 = scene.createEntity('TestEntity1');
            const entity2 = scene.createEntity('TestEntity2');
            const entity3 = scene.createEntity('TestEntity3');

            expect(entity1).toBeInstanceOf(Entity);
            expect(entity2).toBeInstanceOf(Entity);
            expect(entity3).toBeInstanceOf(Entity);

            // ID应该是唯一的
            expect(entity1.id).not.toBe(entity2.id);
            expect(entity2.id).not.toBe(entity3.id);
            expect(entity1.id).not.toBe(entity3.id);

            // 验证新的ID格式（世代式）
            expect(entity1.id).toBeGreaterThan(65535); // 应该包含世代信息
            expect(entity2.id).toBeGreaterThan(65535);
            expect(entity3.id).toBeGreaterThan(65535);
        });

        test('实体销毁应该能正确回收ID', () => {
            const entity = scene.createEntity('ToDestroy');
            const originalId = entity.id;

            // 销毁实体
            entity.destroy();

            // 验证ID池统计
            const stats = scene.identifierPool.getStats();
            expect(stats.pendingRecycle).toBeGreaterThan(0);

            // 在当前时间点，ID应该仍然有效（因为有延迟回收）
            expect(scene.identifierPool.isValid(originalId)).toBe(true);
        });

        test('大量实体创建和销毁应该正常工作', () => {
            const entities: Entity[] = [];
            const count = 100;

            // 创建大量实体
            for (let i = 0; i < count; i++) {
                entities.push(scene.createEntity(`Entity_${i}`));
            }

            // 验证实体数量
            expect(entities.length).toBe(count);

            // 验证所有ID唯一
            const ids = entities.map(e => e.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(count);

            // 销毁一半实体
            const toDestroy = entities.slice(0, 50);
            toDestroy.forEach(entity => entity.destroy());

            // 验证ID池状态
            const stats = scene.identifierPool.getStats();
            expect(stats.pendingRecycle).toBe(50);
            expect(stats.totalAllocated).toBe(count);
        });

        test('批量创建实体应该正常工作', () => {
            const count = 50;
            const entities = scene.createEntities(count, 'BatchEntity');

            expect(entities.length).toBe(count);

            // 验证所有实体都有有效ID
            entities.forEach(entity => {
                expect(scene.identifierPool.isValid(entity.id)).toBe(true);
            });

            // 验证ID唯一性
            const ids = entities.map(e => e.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(count);
        });
    });


    describe('向后兼容性', () => {
        test('现有的Entity API应该继续工作', () => {
            const entity = scene.createEntity('CompatTest');

            // 基本属性应该存在
            expect(typeof entity.id).toBe('number');
            expect(typeof entity.name).toBe('string');
            expect(entity.name).toBe('CompatTest');

            // 基本方法应该工作
            expect(typeof entity.destroy).toBe('function');
            expect(typeof entity.addComponent).toBe('function');
            expect(typeof entity.getComponent).toBe('function');
        });

        test('Scene的createEntity方法应该继续工作', () => {
            // 传入名称
            const entity1 = scene.createEntity('TestEntity');
            expect(entity1).toBeInstanceOf(Entity);
            
            const entity2 = scene.createEntity('Named');
            expect(entity2.name).toBe('Named');

            // 批量创建
            const entities = scene.createEntities(5);
            expect(entities.length).toBe(5);
        });

        test('实体销毁应该继续工作', () => {
            const entity = scene.createEntity('ToDestroy');
            const initialCount = scene.entities.count;

            entity.destroy();

            expect(entity.isDestroyed).toBe(true);
            expect(scene.entities.count).toBe(initialCount - 1);
        });
    });

    describe('世代版本特性验证', () => {
        test('回收的ID应该不能被误用', () => {
            const entity = scene.createEntity('GenerationTest');
            const oldId = entity.id;

            // 销毁实体
            entity.destroy();

            // 等待延迟回收处理
            jest.useFakeTimers();
            jest.advanceTimersByTime(150);

            // 创建新实体触发回收处理
            const newEntity = scene.createEntity('NewEntity');

            // 旧ID应该无效
            expect(scene.identifierPool.isValid(oldId)).toBe(false);

            // 新ID应该有效
            expect(scene.identifierPool.isValid(newEntity.id)).toBe(true);

            jest.useRealTimers();
        });

        test('ID验证应该工作正常', () => {
            const entity = scene.createEntity('ValidateTest');
            const validId = entity.id;
            const invalidId = 999999;

            expect(scene.identifierPool.isValid(validId)).toBe(true);
            expect(scene.identifierPool.isValid(invalidId)).toBe(false);
        });
    });
}); 