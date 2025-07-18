/**
 * IdentifierPool 世代式ID池测试
 * 
 * 测试实体ID的分配、回收、验证和世代版本控制功能
 */
import { IdentifierPool } from '../../../src/ECS/Utils/IdentifierPool';
import { TestUtils } from '../../setup';

describe('IdentifierPool 世代式ID池测试', () => {
    let pool: IdentifierPool;

    beforeEach(() => {
        pool = new IdentifierPool();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // 测试基本功能
    describe('基本功能测试', () => {
        test('应该能创建IdentifierPool实例', () => {
            expect(pool).toBeDefined();
            expect(pool).toBeInstanceOf(IdentifierPool);
        });

        test('应该能分配连续的ID', () => {
            const id1 = pool.checkOut();
            const id2 = pool.checkOut();
            const id3 = pool.checkOut();

            expect(id1).toBe(65536); // 世代1，索引0
            expect(id2).toBe(65537); // 世代1，索引1
            expect(id3).toBe(65538); // 世代1，索引2
        });

        test('应该能验证有效的ID', () => {
            const id = pool.checkOut();
            expect(pool.isValid(id)).toBe(true);
        });

        test('应该能获取统计信息', () => {
            const id1 = pool.checkOut();
            const id2 = pool.checkOut();

            const stats = pool.getStats();
            expect(stats.totalAllocated).toBe(2);
            expect(stats.currentActive).toBe(2);
            expect(stats.currentlyFree).toBe(0);
            expect(stats.pendingRecycle).toBe(0);
            expect(stats.maxPossibleEntities).toBe(65536); // 2^16
            expect(stats.averageGeneration).toBe(1);
            expect(stats.memoryUsage).toBeGreaterThan(0);
        });
    });

    // 测试回收功能
    describe('ID回收功能测试', () => {
        test('应该能回收有效的ID', () => {
            const id = pool.checkOut();
            const result = pool.checkIn(id);
            
            expect(result).toBe(true);
            
            const stats = pool.getStats();
            expect(stats.pendingRecycle).toBe(1);
            expect(stats.currentActive).toBe(0);
        });

        test('应该拒绝回收无效的ID', () => {
            const invalidId = 999999;
            const result = pool.checkIn(invalidId);
            
            expect(result).toBe(false);
            
            const stats = pool.getStats();
            expect(stats.pendingRecycle).toBe(0);
        });

        test('应该拒绝重复回收同一个ID', () => {
            const id = pool.checkOut();
            
            const firstResult = pool.checkIn(id);
            const secondResult = pool.checkIn(id);
            
            expect(firstResult).toBe(true);
            expect(secondResult).toBe(false);
        });
    });

    // 测试延迟回收
    describe('延迟回收机制测试', () => {
        test('应该支持延迟回收', () => {
            const pool = new IdentifierPool(100); // 100ms延迟
            
            const id = pool.checkOut();
            pool.checkIn(id);
            
            // 立即检查，ID应该还在延迟队列中
            let stats = pool.getStats();
            expect(stats.pendingRecycle).toBe(1);
            expect(stats.currentlyFree).toBe(0);
            
            // 模拟时间前进150ms
            jest.advanceTimersByTime(150);
            
            // 触发延迟回收处理（通过分配新ID）
            pool.checkOut();
            
            // 现在ID应该被真正回收了
            stats = pool.getStats();
            expect(stats.pendingRecycle).toBe(0);
            expect(stats.currentlyFree).toBe(0); // 因为被重新分配了
        });

        test('延迟时间内ID应该仍然有效', () => {
            const pool = new IdentifierPool(100);
            
            const id = pool.checkOut();
            pool.checkIn(id);
            
            // 在延迟时间内，ID应该仍然有效
            expect(pool.isValid(id)).toBe(true);
            
            // 模拟时间前进150ms并触发处理
            jest.advanceTimersByTime(150);
            pool.checkOut(); // 触发延迟回收处理
            
            // 现在ID应该无效了（世代已递增）
            expect(pool.isValid(id)).toBe(false);
        });

        test('应该支持强制延迟回收处理', () => {
            const id = pool.checkOut();
            pool.checkIn(id);
            
            // 在延迟时间内强制处理
            pool.forceProcessDelayedRecycle();
            
            // ID应该立即变为无效
            expect(pool.isValid(id)).toBe(false);
            
            const stats = pool.getStats();
            expect(stats.pendingRecycle).toBe(0);
            expect(stats.currentlyFree).toBe(1);
        });
    });

    // 测试世代版本控制
    describe('世代版本控制测试', () => {
        test('回收后的ID应该增加世代版本', () => {
            const pool = new IdentifierPool(0); // 无延迟，立即回收
            
            const originalId = pool.checkOut();
            pool.checkIn(originalId);
            
            // 分配新ID触发回收处理
            const newId = pool.checkOut();
            
            // 原ID应该无效
            expect(pool.isValid(originalId)).toBe(false);
            
            // 新ID应该有不同的世代版本
            expect(newId).not.toBe(originalId);
            expect(newId).toBe(131072); // 世代2，索引0
        });

        test('应该能重用回收的索引', () => {
            const pool = new IdentifierPool(0);
            
            const id1 = pool.checkOut(); // 索引0
            const id2 = pool.checkOut(); // 索引1
            
            pool.checkIn(id1);
            
            const id3 = pool.checkOut(); // 应该重用索引0，但世代递增
            
            expect(id3 & 0xFFFF).toBe(0); // 索引部分应该是0
            expect(id3 >> 16).toBe(2); // 世代应该是2
        });

        test('世代版本溢出应该重置为1', () => {
            const pool = new IdentifierPool(0);
            
            // 手动设置一个即将溢出的世代
            const id = pool.checkOut();
            
            // 通过反射访问私有成员来模拟溢出情况
            const generations = (pool as any)._generations;
            generations.set(0, 65535); // 设置为最大值
            
            pool.checkIn(id);
            const newId = pool.checkOut();
            
            // 世代应该重置为1而不是0
            expect(newId >> 16).toBe(1);
        });
    });

    // 测试错误处理
    describe('错误处理测试', () => {
        test('超过最大索引数应该抛出错误', () => {
            // 创建一个模拟的池，直接设置到达到限制
            const pool = new IdentifierPool();
            
            // 通过反射设置到达到限制（65536会触发错误）
            (pool as any)._nextAvailableIndex = 65536;
            
            expect(() => {
                pool.checkOut();
            }).toThrow('实体索引已达到框架设计限制');
        });

        test('应该能处理边界值', () => {
            const pool = new IdentifierPool();
            
            const id = pool.checkOut();
            expect(id).toBe(65536); // 世代1，索引0
            
            // 回收并重新分配
            pool.checkIn(id);
            
            jest.advanceTimersByTime(200);
            const newId = pool.checkOut();
            
            expect(newId).toBe(131072); // 世代2，索引0
        });
    });

    // 测试动态扩展
    describe('动态内存扩展测试', () => {
        test('应该能动态扩展内存', () => {
            const pool = new IdentifierPool(0, 10); // 小的扩展块用于测试
            
            // 分配超过初始块大小的ID
            const ids: number[] = [];
            for (let i = 0; i < 25; i++) {
                ids.push(pool.checkOut());
            }
            
            expect(ids.length).toBe(25);
            
            // 验证所有ID都是唯一的
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(25);
            
            // 检查内存扩展统计
            const stats = pool.getStats();
            expect(stats.memoryExpansions).toBeGreaterThan(1);
            expect(stats.generationStorageSize).toBeGreaterThanOrEqual(25);
        });

        test('内存扩展应该按块进行', () => {
            const blockSize = 5;
            const pool = new IdentifierPool(0, blockSize);
            
            // 分配第一个块
            for (let i = 0; i < blockSize; i++) {
                pool.checkOut();
            }
            
            let stats = pool.getStats();
            const initialExpansions = stats.memoryExpansions;
            
            // 分配一个会触发新块的ID
            pool.checkOut();
            
            stats = pool.getStats();
            expect(stats.memoryExpansions).toBe(initialExpansions + 1);
        });
    });

    // 测试性能和内存
    describe('性能和内存测试', () => {
        test('应该能处理大量ID分配', () => {
            const count = 10000; // 增加测试规模
            const ids: number[] = [];
            
            const startTime = performance.now();
            
            for (let i = 0; i < count; i++) {
                ids.push(pool.checkOut());
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(ids.length).toBe(count);
            expect(duration).toBeLessThan(1000); // 10k个ID应该在1秒内完成
            
            // 验证所有ID都是唯一的
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(count);
        });

        test('应该能处理大量回收操作', () => {
            const count = 5000; // 增加测试规模
            const ids: number[] = [];
            
            // 分配ID
            for (let i = 0; i < count; i++) {
                ids.push(pool.checkOut());
            }
            
            // 回收ID
            const startTime = performance.now();
            
            for (const id of ids) {
                pool.checkIn(id);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(500); // 5k个回收应该在500ms内完成
            
            const stats = pool.getStats();
            expect(stats.pendingRecycle).toBe(count);
            expect(stats.currentActive).toBe(0);
        });

        test('内存使用应该是合理的', () => {
            const stats = pool.getStats();
            const initialMemory = stats.memoryUsage;
            
            // 分配大量ID
            for (let i = 0; i < 5000; i++) {
                pool.checkOut();
            }
            
            const newStats = pool.getStats();
            const memoryIncrease = newStats.memoryUsage - initialMemory;
            
            // 内存增长应该是合理的（动态分配应该更高效）
            expect(memoryIncrease).toBeLessThan(5000 * 50); // 每个ID少于50字节
        });
    });

    // 测试并发安全性（模拟）
    describe('并发安全性测试', () => {
        test('应该能处理并发分配', async () => {
            const promises: Promise<number>[] = [];
            
            // 模拟并发分配
            for (let i = 0; i < 1000; i++) {
                promises.push(Promise.resolve(pool.checkOut()));
            }
            
            const ids = await Promise.all(promises);
            
            // 所有ID应该是唯一的
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(1000);
        });

        test('应该能处理并发回收', async () => {
            const ids: number[] = [];
            
            // 先分配一些ID
            for (let i = 0; i < 500; i++) {
                ids.push(pool.checkOut());
            }
            
            // 模拟并发回收
            const promises = ids.map(id => Promise.resolve(pool.checkIn(id)));
            const results = await Promise.all(promises);
            
            // 所有回收操作都应该成功
            expect(results.every(result => result === true)).toBe(true);
        });
    });

    // 测试统计信息
    describe('统计信息测试', () => {
        test('统计信息应该准确反映池状态', () => {
            // 分配一些ID
            const ids = [pool.checkOut(), pool.checkOut(), pool.checkOut()];
            
            let stats = pool.getStats();
            expect(stats.totalAllocated).toBe(3);
            expect(stats.currentActive).toBe(3);
            expect(stats.currentlyFree).toBe(0);
            expect(stats.pendingRecycle).toBe(0);
            
            // 回收一个ID
            pool.checkIn(ids[0]);
            
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

        test('应该正确计算平均世代版本', () => {
            const pool = new IdentifierPool(0); // 无延迟
            
            // 分配、回收、再分配来增加世代
            const id1 = pool.checkOut();
            pool.checkIn(id1);
            const id2 = pool.checkOut(); // 这会触发世代递增
            
            const stats = pool.getStats();
            expect(stats.averageGeneration).toBeGreaterThan(1);
        });
    });
}); 