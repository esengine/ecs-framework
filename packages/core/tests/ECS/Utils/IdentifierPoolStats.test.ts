import { IdentifierPool } from '../../../src/ECS/Utils/IdentifierPool';
import { IdentifierPoolStats } from '../../../src/Types';

describe('IdentifierPoolStats Interface', () => {
    let pool: IdentifierPool;

    beforeEach(() => {
        pool = new IdentifierPool();
    });

    test('getStats应该返回正确的IdentifierPoolStats接口类型', () => {
        const stats = pool.getStats();
        
        // 验证返回的对象包含所有必需的属性
        expect(stats).toHaveProperty('totalAllocated');
        expect(stats).toHaveProperty('totalRecycled');
        expect(stats).toHaveProperty('currentActive');
        expect(stats).toHaveProperty('currentlyFree');
        expect(stats).toHaveProperty('pendingRecycle');
        expect(stats).toHaveProperty('maxPossibleEntities');
        expect(stats).toHaveProperty('maxUsedIndex');
        expect(stats).toHaveProperty('memoryUsage');
        expect(stats).toHaveProperty('memoryExpansions');
        expect(stats).toHaveProperty('averageGeneration');
        expect(stats).toHaveProperty('generationStorageSize');
    });

    test('统计信息的类型应该正确', () => {
        const stats = pool.getStats();
        
        expect(typeof stats.totalAllocated).toBe('number');
        expect(typeof stats.totalRecycled).toBe('number');
        expect(typeof stats.currentActive).toBe('number');
        expect(typeof stats.currentlyFree).toBe('number');
        expect(typeof stats.pendingRecycle).toBe('number');
        expect(typeof stats.maxPossibleEntities).toBe('number');
        expect(typeof stats.maxUsedIndex).toBe('number');
        expect(typeof stats.memoryUsage).toBe('number');
        expect(typeof stats.memoryExpansions).toBe('number');
        expect(typeof stats.averageGeneration).toBe('number');
        expect(typeof stats.generationStorageSize).toBe('number');
    });

    test('初始状态的统计信息应该正确', () => {
        const stats = pool.getStats();
        
        expect(stats.totalAllocated).toBe(0);
        expect(stats.totalRecycled).toBe(0);
        expect(stats.currentActive).toBe(0);
        expect(stats.currentlyFree).toBe(0);
        expect(stats.pendingRecycle).toBe(0);
        expect(stats.maxPossibleEntities).toBe(65536); // MAX_INDEX + 1
        expect(stats.maxUsedIndex).toBe(-1); // nextAvailableIndex - 1
        expect(stats.memoryUsage).toBeGreaterThan(0);
        expect(stats.memoryExpansions).toBe(1); // 初始预分配
        expect(stats.averageGeneration).toBe(1);
        expect(stats.generationStorageSize).toBeGreaterThan(0);
    });

    test('分配和回收后的统计信息应该正确更新', () => {
        // 分配几个ID
        const id1 = pool.checkOut();
        const id2 = pool.checkOut();
        const id3 = pool.checkOut();
        
        let stats = pool.getStats();
        expect(stats.totalAllocated).toBe(3);
        expect(stats.currentActive).toBe(3);
        
        // 回收一个ID
        pool.checkIn(id2);
        
        stats = pool.getStats();
        expect(stats.totalRecycled).toBe(1);
        expect(stats.currentActive).toBe(2);
        expect(stats.pendingRecycle).toBe(1);
        
        // 强制处理延迟回收
        pool.forceProcessDelayedRecycle();
        
        stats = pool.getStats();
        expect(stats.pendingRecycle).toBe(0);
        expect(stats.currentlyFree).toBe(1);
    });
});