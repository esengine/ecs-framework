import { Entity, EntityComparer } from '../../src/ECS/Entity';

describe('EntityComparer', () => {
    let comparer: EntityComparer;

    beforeEach(() => {
        comparer = new EntityComparer();
    });

    describe('compare', () => {
        it('应该首先按updateOrder排序', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            entity1.updateOrder = 1;
            entity2.updateOrder = 2;
            
            expect(comparer.compare(entity1, entity2)).toBeLessThan(0);
            expect(comparer.compare(entity2, entity1)).toBeGreaterThan(0);
        });

        it('当updateOrder相等时应该按id排序', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            entity1.updateOrder = 1;
            entity2.updateOrder = 1;
            
            expect(comparer.compare(entity1, entity2)).toBeLessThan(0);
            expect(comparer.compare(entity2, entity1)).toBeGreaterThan(0);
        });

        it('当updateOrder和id都相等时应该返回0', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 1);
            
            entity1.updateOrder = 1;
            entity2.updateOrder = 1;
            
            expect(comparer.compare(entity1, entity2)).toBe(0);
        });

        it('应该保持比较器的稳定性和传递性', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            const entity3 = new Entity('Entity3', 3);
            
            entity1.updateOrder = 1;
            entity2.updateOrder = 2;
            entity3.updateOrder = 3;
            
            const result12 = comparer.compare(entity1, entity2);
            const result23 = comparer.compare(entity2, entity3);
            const result13 = comparer.compare(entity1, entity3);
            
            // 传递性：如果 entity1 < entity2 且 entity2 < entity3，那么 entity1 < entity3
            expect(result12).toBeLessThan(0);
            expect(result23).toBeLessThan(0);
            expect(result13).toBeLessThan(0);
        });

        it('应该满足反对称性', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            entity1.updateOrder = 1;
            entity2.updateOrder = 2;
            
            const result12 = comparer.compare(entity1, entity2);
            const result21 = comparer.compare(entity2, entity1);
            
            expect(result12).toBeLessThan(0);
            expect(result21).toBeGreaterThan(0);
            expect(result12 + result21).toBe(0);
        });

        it('应该是纯函数，多次调用结果相同', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            entity1.updateOrder = 1;
            entity2.updateOrder = 2;
            
            const result1 = comparer.compare(entity1, entity2);
            const result2 = comparer.compare(entity1, entity2);
            const result3 = comparer.compare(entity1, entity2);
            
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });

        it('应该处理负数updateOrder', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            entity1.updateOrder = -1;
            entity2.updateOrder = -2;
            
            expect(comparer.compare(entity1, entity2)).toBeGreaterThan(0);
            expect(comparer.compare(entity2, entity1)).toBeLessThan(0);
        });

        it('应该处理零updateOrder', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            entity1.updateOrder = 0;
            entity2.updateOrder = 0;
            
            expect(comparer.compare(entity1, entity2)).toBeLessThan(0);
            expect(comparer.compare(entity2, entity1)).toBeGreaterThan(0);
        });

        it('应该处理大的updateOrder差值', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            entity1.updateOrder = Number.MIN_SAFE_INTEGER;
            entity2.updateOrder = Number.MAX_SAFE_INTEGER;
            
            expect(comparer.compare(entity1, entity2)).toBeLessThan(0);
            expect(comparer.compare(entity2, entity1)).toBeGreaterThan(0);
        });

        it('不应该依赖实体的可变状态', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            entity1.updateOrder = 1;
            entity2.updateOrder = 2;
            
            const initialResult = comparer.compare(entity1, entity2);
            
            // 修改实体的其他状态
            entity1.name = 'ModifiedEntity1';
            entity1.active = false;
            entity1.enabled = false;
            
            const resultAfterChange = comparer.compare(entity1, entity2);
            
            expect(initialResult).toBe(resultAfterChange);
        });
    });
});