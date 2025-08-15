import { SparseSet } from '../../../src/ECS/Utils/SparseSet';

describe('SparseSet', () => {
    let sparseSet: SparseSet<number>;

    beforeEach(() => {
        sparseSet = new SparseSet<number>();
    });

    describe('基本操作', () => {
        it('应该能添加元素', () => {
            expect(sparseSet.add(1)).toBe(true);
            expect(sparseSet.add(2)).toBe(true);
            expect(sparseSet.size).toBe(2);
        });

        it('应该防止重复添加', () => {
            expect(sparseSet.add(1)).toBe(true);
            expect(sparseSet.add(1)).toBe(false);
            expect(sparseSet.size).toBe(1);
        });

        it('应该能移除元素', () => {
            sparseSet.add(1);
            sparseSet.add(2);
            
            expect(sparseSet.remove(1)).toBe(true);
            expect(sparseSet.size).toBe(1);
            expect(sparseSet.has(1)).toBe(false);
            expect(sparseSet.has(2)).toBe(true);
        });

        it('应该处理移除不存在的元素', () => {
            expect(sparseSet.remove(99)).toBe(false);
        });

        it('应该能检查元素存在性', () => {
            sparseSet.add(42);
            
            expect(sparseSet.has(42)).toBe(true);
            expect(sparseSet.has(99)).toBe(false);
        });
    });

    describe('索引操作', () => {
        it('应该返回正确的索引', () => {
            sparseSet.add(10);
            sparseSet.add(20);
            sparseSet.add(30);
            
            expect(sparseSet.getIndex(10)).toBe(0);
            expect(sparseSet.getIndex(20)).toBe(1);
            expect(sparseSet.getIndex(30)).toBe(2);
        });

        it('应该能根据索引获取元素', () => {
            sparseSet.add(100);
            sparseSet.add(200);
            
            expect(sparseSet.getByIndex(0)).toBe(100);
            expect(sparseSet.getByIndex(1)).toBe(200);
            expect(sparseSet.getByIndex(999)).toBeUndefined();
        });

        it('移除中间元素后应该保持紧凑性', () => {
            sparseSet.add(1);
            sparseSet.add(2);
            sparseSet.add(3);
            
            // 移除中间元素
            sparseSet.remove(2);
            
            // 最后一个元素应该移动到中间
            expect(sparseSet.getByIndex(0)).toBe(1);
            expect(sparseSet.getByIndex(1)).toBe(3);
            expect(sparseSet.size).toBe(2);
        });
    });

    describe('遍历操作', () => {
        beforeEach(() => {
            sparseSet.add(10);
            sparseSet.add(20);
            sparseSet.add(30);
        });

        it('应该能正确遍历', () => {
            const items: number[] = [];
            const indices: number[] = [];
            
            sparseSet.forEach((item, index) => {
                items.push(item);
                indices.push(index);
            });
            
            expect(items).toEqual([10, 20, 30]);
            expect(indices).toEqual([0, 1, 2]);
        });

        it('应该能映射元素', () => {
            const doubled = sparseSet.map(x => x * 2);
            expect(doubled).toEqual([20, 40, 60]);
        });

        it('应该能过滤元素', () => {
            const filtered = sparseSet.filter(x => x > 15);
            expect(filtered).toEqual([20, 30]);
        });

        it('应该能查找元素', () => {
            const found = sparseSet.find(x => x > 15);
            expect(found).toBe(20);
            
            const notFound = sparseSet.find(x => x > 100);
            expect(notFound).toBeUndefined();
        });

        it('应该能检查存在性', () => {
            expect(sparseSet.some(x => x > 25)).toBe(true);
            expect(sparseSet.some(x => x > 100)).toBe(false);
        });

        it('应该能检查全部条件', () => {
            expect(sparseSet.every(x => x > 0)).toBe(true);
            expect(sparseSet.every(x => x > 15)).toBe(false);
        });
    });

    describe('数据获取', () => {
        beforeEach(() => {
            sparseSet.add(1);
            sparseSet.add(2);
            sparseSet.add(3);
        });

        it('应该返回只读数组副本', () => {
            const array = sparseSet.getDenseArray();
            expect(array).toEqual([1, 2, 3]);
            
            // 尝试修改应该不影响原数据
            expect(() => {
                (array as any).push(4);
            }).not.toThrow();
            
            expect(sparseSet.size).toBe(3);
        });

        it('应该能转换为数组', () => {
            const array = sparseSet.toArray();
            expect(array).toEqual([1, 2, 3]);
        });

        it('应该能转换为Set', () => {
            const set = sparseSet.toSet();
            expect(set).toEqual(new Set([1, 2, 3]));
        });
    });

    describe('工具方法', () => {
        it('应该能检查空状态', () => {
            expect(sparseSet.isEmpty).toBe(true);
            
            sparseSet.add(1);
            expect(sparseSet.isEmpty).toBe(false);
        });

        it('应该能清空数据', () => {
            sparseSet.add(1);
            sparseSet.add(2);
            
            sparseSet.clear();
            
            expect(sparseSet.size).toBe(0);
            expect(sparseSet.isEmpty).toBe(true);
            expect(sparseSet.has(1)).toBe(false);
        });

        it('应该提供内存统计', () => {
            sparseSet.add(1);
            sparseSet.add(2);
            
            const stats = sparseSet.getMemoryStats();
            
            expect(stats.denseArraySize).toBeGreaterThan(0);
            expect(stats.sparseMapSize).toBeGreaterThan(0);
            expect(stats.totalMemory).toBe(stats.denseArraySize + stats.sparseMapSize);
        });

        it('应该能验证数据结构完整性', () => {
            sparseSet.add(1);
            sparseSet.add(2);
            sparseSet.add(3);
            sparseSet.remove(2);
            
            expect(sparseSet.validate()).toBe(true);
        });
    });

    describe('性能场景', () => {
        it('应该处理大量数据操作', () => {
            const items = Array.from({ length: 1000 }, (_, i) => i);
            
            // 批量添加
            for (const item of items) {
                sparseSet.add(item);
            }
            expect(sparseSet.size).toBe(1000);
            
            // 批量移除偶数
            for (let i = 0; i < 1000; i += 2) {
                sparseSet.remove(i);
            }
            expect(sparseSet.size).toBe(500);
            
            // 验证只剩奇数
            const remaining = sparseSet.toArray().sort((a, b) => a - b);
            for (let i = 0; i < remaining.length; i++) {
                expect(remaining[i] % 2).toBe(1);
            }
        });

        it('应该保持O(1)访问性能', () => {
            // 添加大量元素
            for (let i = 0; i < 1000; i++) {
                sparseSet.add(i);
            }
            
            // 随机访问应该很快
            const start = performance.now();
            for (let i = 0; i < 100; i++) {
                const randomItem = Math.floor(Math.random() * 1000);
                sparseSet.has(randomItem);
                sparseSet.getIndex(randomItem);
            }
            const duration = performance.now() - start;
            
            // 应该在很短时间内完成
            expect(duration).toBeLessThan(10);
        });
    });
});