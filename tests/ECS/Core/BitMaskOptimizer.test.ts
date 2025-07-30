import { BitMaskOptimizer } from '../../../src/ECS/Core/BitMaskOptimizer';
import { BigIntFactory } from '../../../src/ECS/Utils/BigIntCompatibility';

describe('BitMaskOptimizer - 位掩码优化器测试', () => {
    let optimizer: BitMaskOptimizer;

    beforeEach(() => {
        optimizer = BitMaskOptimizer.getInstance();
        optimizer.reset(); // 确保每个测试开始时都是干净的状态
    });

    describe('单例模式测试', () => {
        it('应该返回同一个实例', () => {
            const instance1 = BitMaskOptimizer.getInstance();
            const instance2 = BitMaskOptimizer.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('组件类型注册', () => {
        it('应该能够注册组件类型', () => {
            const id = optimizer.registerComponentType('Transform');
            expect(id).toBe(0);
        });

        it('重复注册相同组件应该返回相同ID', () => {
            const id1 = optimizer.registerComponentType('Transform');
            const id2 = optimizer.registerComponentType('Transform');
            expect(id1).toBe(id2);
        });

        it('应该能够注册多个不同组件类型', () => {
            const id1 = optimizer.registerComponentType('Transform');
            const id2 = optimizer.registerComponentType('Velocity');
            const id3 = optimizer.registerComponentType('Health');
            
            expect(id1).toBe(0);
            expect(id2).toBe(1);
            expect(id3).toBe(2);
        });

        it('应该能够获取已注册组件的类型ID', () => {
            optimizer.registerComponentType('Transform');
            const id = optimizer.getComponentTypeId('Transform');
            expect(id).toBe(0);
        });

        it('获取未注册组件的类型ID应该返回undefined', () => {
            const id = optimizer.getComponentTypeId('UnknownComponent');
            expect(id).toBeUndefined();
        });
    });

    describe('单组件掩码创建', () => {
        beforeEach(() => {
            optimizer.registerComponentType('Transform');
            optimizer.registerComponentType('Velocity');
        });

        it('应该能够创建单个组件的掩码', () => {
            const mask = optimizer.createSingleComponentMask('Transform');
            expect(mask.toString()).toBe('1');
        });

        it('不同组件应该有不同的掩码', () => {
            const transformMask = optimizer.createSingleComponentMask('Transform');
            const velocityMask = optimizer.createSingleComponentMask('Velocity');
            
            expect(transformMask.toString()).toBe('1');
            expect(velocityMask.toString()).toBe('2');
        });

        it('创建未注册组件的掩码应该抛出错误', () => {
            expect(() => {
                optimizer.createSingleComponentMask('UnknownComponent');
            }).toThrow('Component type not registered: UnknownComponent');
        });

        it('相同组件的掩码应该使用缓存', () => {
            const mask1 = optimizer.createSingleComponentMask('Transform');
            const mask2 = optimizer.createSingleComponentMask('Transform');
            expect(mask1).toBe(mask2);
        });
    });

    describe('组合掩码创建', () => {
        beforeEach(() => {
            optimizer.registerComponentType('Transform');
            optimizer.registerComponentType('Velocity');
            optimizer.registerComponentType('Health');
        });

        it('应该能够创建多个组件的组合掩码', () => {
            const mask = optimizer.createCombinedMask(['Transform', 'Velocity']);
            expect(mask.toString()).toBe('3'); // 1 | 2 = 3
        });

        it('组件顺序不应该影响掩码结果', () => {
            const mask1 = optimizer.createCombinedMask(['Transform', 'Velocity']);
            const mask2 = optimizer.createCombinedMask(['Velocity', 'Transform']);
            expect(mask1).toBe(mask2);
        });

        it('三个组件的组合掩码应该正确', () => {
            const mask = optimizer.createCombinedMask(['Transform', 'Velocity', 'Health']);
            expect(mask.toString()).toBe('7'); // 1 | 2 | 4 = 7
        });

        it('空数组应该返回0掩码', () => {
            const mask = optimizer.createCombinedMask([]);
            expect(mask.isZero()).toBe(true);
        });

        it('包含未注册组件应该抛出错误', () => {
            expect(() => {
                optimizer.createCombinedMask(['Transform', 'UnknownComponent']);
            }).toThrow('Component type not registered: UnknownComponent');
        });
    });

    describe('掩码检查功能', () => {
        beforeEach(() => {
            optimizer.registerComponentType('Transform');
            optimizer.registerComponentType('Velocity');
            optimizer.registerComponentType('Health');
        });

        it('应该能够检查掩码是否包含指定组件', () => {
            const mask = optimizer.createCombinedMask(['Transform', 'Velocity']);
            
            expect(optimizer.maskContainsComponent(mask, 'Transform')).toBe(true);
            expect(optimizer.maskContainsComponent(mask, 'Velocity')).toBe(true);
            expect(optimizer.maskContainsComponent(mask, 'Health')).toBe(false);
        });

        it('应该能够检查掩码是否包含所有指定组件', () => {
            const mask = optimizer.createCombinedMask(['Transform', 'Velocity', 'Health']);
            
            expect(optimizer.maskContainsAllComponents(mask, ['Transform'])).toBe(true);
            expect(optimizer.maskContainsAllComponents(mask, ['Transform', 'Velocity'])).toBe(true);
            expect(optimizer.maskContainsAllComponents(mask, ['Transform', 'Velocity', 'Health'])).toBe(true);
        });

        it('不完全包含时maskContainsAllComponents应该返回false', () => {
            const mask = optimizer.createCombinedMask(['Transform']);
            
            expect(optimizer.maskContainsAllComponents(mask, ['Transform', 'Velocity'])).toBe(false);
        });

        it('应该能够检查掩码是否包含任一指定组件', () => {
            const mask = optimizer.createCombinedMask(['Transform']);
            
            expect(optimizer.maskContainsAnyComponent(mask, ['Transform', 'Velocity'])).toBe(true);
            expect(optimizer.maskContainsAnyComponent(mask, ['Velocity', 'Health'])).toBe(false);
        });
    });

    describe('掩码操作功能', () => {
        beforeEach(() => {
            optimizer.registerComponentType('Transform');
            optimizer.registerComponentType('Velocity');
            optimizer.registerComponentType('Health');
        });

        it('应该能够向掩码添加组件', () => {
            let mask = optimizer.createSingleComponentMask('Transform');
            mask = optimizer.addComponentToMask(mask, 'Velocity');
            
            expect(optimizer.maskContainsComponent(mask, 'Transform')).toBe(true);
            expect(optimizer.maskContainsComponent(mask, 'Velocity')).toBe(true);
        });

        it('应该能够从掩码移除组件', () => {
            let mask = optimizer.createCombinedMask(['Transform', 'Velocity']);
            mask = optimizer.removeComponentFromMask(mask, 'Velocity');
            
            expect(optimizer.maskContainsComponent(mask, 'Transform')).toBe(true);
            expect(optimizer.maskContainsComponent(mask, 'Velocity')).toBe(false);
        });

        it('移除不存在的组件不应该影响掩码', () => {
            const originalMask = optimizer.createSingleComponentMask('Transform');
            const newMask = optimizer.removeComponentFromMask(originalMask, 'Velocity');
            
            expect(newMask.equals(originalMask)).toBe(true);
        });
    });

    describe('工具功能', () => {
        beforeEach(() => {
            optimizer.registerComponentType('Transform');
            optimizer.registerComponentType('Velocity');
            optimizer.registerComponentType('Health');
        });

        it('应该能够将掩码转换为组件名称数组', () => {
            const mask = optimizer.createCombinedMask(['Transform', 'Health']);
            const componentNames = optimizer.maskToComponentNames(mask);
            
            expect(componentNames).toContain('Transform');
            expect(componentNames).toContain('Health');
            expect(componentNames).not.toContain('Velocity');
            expect(componentNames.length).toBe(2);
        });

        it('空掩码应该返回空数组', () => {
            const componentNames = optimizer.maskToComponentNames(BigIntFactory.zero());
            expect(componentNames).toEqual([]);
        });

        it('应该能够获取掩码中组件的数量', () => {
            const mask1 = optimizer.createSingleComponentMask('Transform');
            const mask2 = optimizer.createCombinedMask(['Transform', 'Velocity']);
            const mask3 = optimizer.createCombinedMask(['Transform', 'Velocity', 'Health']);
            
            expect(optimizer.getComponentCount(mask1)).toBe(1);
            expect(optimizer.getComponentCount(mask2)).toBe(2);
            expect(optimizer.getComponentCount(mask3)).toBe(3);
        });

        it('空掩码的组件数量应该为0', () => {
            expect(optimizer.getComponentCount(BigIntFactory.zero())).toBe(0);
        });
    });

    describe('缓存和性能优化', () => {
        beforeEach(() => {
            optimizer.registerComponentType('Transform');
            optimizer.registerComponentType('Velocity');
            optimizer.registerComponentType('Health');
        });

        it('应该能够预计算常用掩码组合', () => {
            const commonCombinations = [
                ['Transform', 'Velocity'],
                ['Transform', 'Health'],
                ['Velocity', 'Health']
            ];
            
            optimizer.precomputeCommonMasks(commonCombinations);
            
            // 验证掩码已被缓存
            const stats = optimizer.getCacheStats();
            expect(stats.size).toBeGreaterThan(0);
        });

        it('应该能够获取缓存统计信息', () => {
            optimizer.createSingleComponentMask('Transform');
            optimizer.createCombinedMask(['Transform', 'Velocity']);
            
            const stats = optimizer.getCacheStats();
            expect(stats.size).toBeGreaterThan(0);
            expect(stats.componentTypes).toBe(3);
        });

        it('应该能够清空缓存', () => {
            optimizer.createSingleComponentMask('Transform');
            optimizer.clearCache();
            
            const stats = optimizer.getCacheStats();
            expect(stats.size).toBe(0);
            expect(stats.componentTypes).toBe(3); // 组件类型不会被清除
        });

        it('应该能够重置优化器', () => {
            optimizer.registerComponentType('NewComponent');
            optimizer.createSingleComponentMask('Transform');
            
            optimizer.reset();
            
            const stats = optimizer.getCacheStats();
            expect(stats.size).toBe(0);
            expect(stats.componentTypes).toBe(0);
        });
    });

    describe('边界情况和错误处理', () => {
        it('处理大量组件类型注册', () => {
            for (let i = 0; i < 100; i++) {
                const id = optimizer.registerComponentType(`Component${i}`);
                expect(id).toBe(i);
            }
        });

        it('处理大掩码值', () => {
            // 注册64个组件类型
            for (let i = 0; i < 64; i++) {
                optimizer.registerComponentType(`Component${i}`);
            }
            
            const mask = optimizer.createSingleComponentMask('Component63');
            expect(mask.toString()).toBe(BigIntFactory.one().shiftLeft(63).toString());
        });

        it('空组件名称数组的组合掩码', () => {
            const mask = optimizer.createCombinedMask([]);
            expect(mask.isZero()).toBe(true);
            expect(optimizer.getComponentCount(mask)).toBe(0);
        });
    });

    describe('性能测试', () => {
        beforeEach(() => {
            // 注册一些组件类型
            for (let i = 0; i < 10; i++) {
                optimizer.registerComponentType(`Component${i}`);
            }
        });

        it('大量掩码创建应该高效', () => {
            const startTime = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                optimizer.createSingleComponentMask('Component0');
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
        });

        it('大量掩码检查应该高效', () => {
            const mask = optimizer.createCombinedMask(['Component0', 'Component1', 'Component2']);
            const startTime = performance.now();
            
            for (let i = 0; i < 10000; i++) {
                optimizer.maskContainsComponent(mask, 'Component1');
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
        });
    });
});