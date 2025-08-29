import { Matcher, BitMaskCondition } from '../../../src/ECS/Utils/Matcher';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage';
import { Component } from '../../../src/ECS/Component';
import { BigIntFactory } from '../../../src/ECS/Utils/BigIntCompatibility';

// 测试组件
class ComponentA extends Component {}
class ComponentB extends Component {}
class ComponentC extends Component {}
class ComponentD extends Component {}

describe('Matcher - 位掩码预编译测试', () => {
    beforeEach(() => {
        ComponentRegistry.reset();
        ComponentRegistry.register(ComponentA);
        ComponentRegistry.register(ComponentB);
        ComponentRegistry.register(ComponentC);
        ComponentRegistry.register(ComponentD);
    });

    describe('位掩码预编译功能', () => {
        it('应该预编译all条件的位掩码', () => {
            const matcher = Matcher.all(ComponentA, ComponentB);
            const bitCondition = matcher.getBitMaskCondition();

            expect(bitCondition).toBeDefined();
            expect(bitCondition.hasNonComponentConditions).toBe(false);
            expect(bitCondition.anyMasks).toHaveLength(0);

            // 验证allMask包含ComponentA和ComponentB的位
            const maskA = ComponentRegistry.getBitMask(ComponentA);
            const maskB = ComponentRegistry.getBitMask(ComponentB);
            const expectedAllMask = maskA.or(maskB);

            expect(bitCondition.allMask.toString()).toBe(expectedAllMask.toString());
            expect(bitCondition.noneMask.isZero()).toBe(true);
        });

        it('应该预编译none条件的位掩码', () => {
            const matcher = Matcher.none(ComponentC, ComponentD);
            const bitCondition = matcher.getBitMaskCondition();

            expect(bitCondition.hasNonComponentConditions).toBe(false);
            
            // 验证noneMask包含ComponentC和ComponentD的位
            const maskC = ComponentRegistry.getBitMask(ComponentC);
            const maskD = ComponentRegistry.getBitMask(ComponentD);
            const expectedNoneMask = maskC.or(maskD);

            expect(bitCondition.noneMask.toString()).toBe(expectedNoneMask.toString());
            expect(bitCondition.allMask.isZero()).toBe(true);
            expect(bitCondition.anyMasks).toHaveLength(0);
        });

        it('应该预编译any条件的位掩码数组', () => {
            const matcher = Matcher.any(ComponentA, ComponentB, ComponentC);
            const bitCondition = matcher.getBitMaskCondition();

            expect(bitCondition.hasNonComponentConditions).toBe(false);
            expect(bitCondition.anyMasks).toHaveLength(3);

            // 验证anyMasks包含每个组件的单独掩码
            const maskA = ComponentRegistry.getBitMask(ComponentA);
            const maskB = ComponentRegistry.getBitMask(ComponentB);
            const maskC = ComponentRegistry.getBitMask(ComponentC);

            expect(bitCondition.anyMasks[0].toString()).toBe(maskA.toString());
            expect(bitCondition.anyMasks[1].toString()).toBe(maskB.toString());
            expect(bitCondition.anyMasks[2].toString()).toBe(maskC.toString());

            expect(bitCondition.allMask.isZero()).toBe(true);
            expect(bitCondition.noneMask.isZero()).toBe(true);
        });

        it('应该预编译复合条件', () => {
            const matcher = Matcher.all(ComponentA)
                .any(ComponentB, ComponentC)
                .none(ComponentD);
            
            const bitCondition = matcher.getBitMaskCondition();

            expect(bitCondition.hasNonComponentConditions).toBe(false);

            // 验证all条件
            const expectedAllMask = ComponentRegistry.getBitMask(ComponentA);
            expect(bitCondition.allMask.toString()).toBe(expectedAllMask.toString());

            // 验证none条件
            const expectedNoneMask = ComponentRegistry.getBitMask(ComponentD);
            expect(bitCondition.noneMask.toString()).toBe(expectedNoneMask.toString());

            // 验证any条件
            expect(bitCondition.anyMasks).toHaveLength(2);
            const maskB = ComponentRegistry.getBitMask(ComponentB);
            const maskC = ComponentRegistry.getBitMask(ComponentC);
            expect(bitCondition.anyMasks[0].toString()).toBe(maskB.toString());
            expect(bitCondition.anyMasks[1].toString()).toBe(maskC.toString());
        });

        it('应该处理单组件查询', () => {
            const matcher = Matcher.byComponent(ComponentA);
            const bitCondition = matcher.getBitMaskCondition();

            expect(bitCondition.hasNonComponentConditions).toBe(false);

            // 单组件查询应该转换为all条件
            const expectedMask = ComponentRegistry.getBitMask(ComponentA);
            expect(bitCondition.allMask.toString()).toBe(expectedMask.toString());
            expect(bitCondition.noneMask.isZero()).toBe(true);
            expect(bitCondition.anyMasks).toHaveLength(0);
        });
    });

    describe('非组件条件处理', () => {
        it('应该标记包含标签条件的查询', () => {
            const matcher = Matcher.all(ComponentA).withTag(123);
            const bitCondition = matcher.getBitMaskCondition();

            expect(bitCondition.hasNonComponentConditions).toBe(true);
            expect(bitCondition.fallbackCondition).toBeDefined();

            // 即使有非组件条件，组件部分仍应编译
            const expectedMask = ComponentRegistry.getBitMask(ComponentA);
            expect(bitCondition.allMask.toString()).toBe(expectedMask.toString());
        });

        it('应该标记包含名称条件的查询', () => {
            const matcher = Matcher.all(ComponentB).withName('testEntity');
            const bitCondition = matcher.getBitMaskCondition();

            expect(bitCondition.hasNonComponentConditions).toBe(true);
            expect(bitCondition.fallbackCondition).toBeDefined();
            expect(bitCondition.fallbackCondition?.name).toBe('testEntity');
        });

        it('应该标记同时包含标签和名称条件的查询', () => {
            const matcher = Matcher.all(ComponentA)
                .withTag(456)
                .withName('namedEntity');
            
            const bitCondition = matcher.getBitMaskCondition();

            expect(bitCondition.hasNonComponentConditions).toBe(true);
            expect(bitCondition.fallbackCondition).toBeDefined();
            expect(bitCondition.fallbackCondition?.tag).toBe(456);
            expect(bitCondition.fallbackCondition?.name).toBe('namedEntity');
        });
    });

    describe('缓存和重编译', () => {
        it('应该缓存编译结果', () => {
            const matcher = Matcher.all(ComponentA);
            
            const bitCondition1 = matcher.getBitMaskCondition();
            const bitCondition2 = matcher.getBitMaskCondition();

            // 应该返回相同的对象（缓存）
            expect(bitCondition1).toBe(bitCondition2);
        });

        it('应该在条件变更时重新编译', () => {
            const matcher = Matcher.all(ComponentA);
            const bitCondition1 = matcher.getBitMaskCondition();

            // 修改条件
            matcher.none(ComponentB);
            const bitCondition2 = matcher.getBitMaskCondition();

            // 应该返回新的对象（重新编译）
            expect(bitCondition1).not.toBe(bitCondition2);

            // 验证新条件
            const expectedNoneMask = ComponentRegistry.getBitMask(ComponentB);
            expect(bitCondition2.noneMask.toString()).toBe(expectedNoneMask.toString());
        });

        it('应该在重置后重新编译', () => {
            const matcher = Matcher.all(ComponentA);
            const bitCondition1 = matcher.getBitMaskCondition();

            matcher.reset();
            const bitCondition2 = matcher.getBitMaskCondition();

            expect(bitCondition1).not.toBe(bitCondition2);
            expect(bitCondition2.allMask.isZero()).toBe(true);
        });
    });

    describe('边界情况', () => {
        it('应该处理空Matcher', () => {
            const matcher = Matcher.empty();
            const bitCondition = matcher.getBitMaskCondition();

            expect(bitCondition.allMask.isZero()).toBe(true);
            expect(bitCondition.noneMask.isZero()).toBe(true);
            expect(bitCondition.anyMasks).toHaveLength(0);
            expect(bitCondition.hasNonComponentConditions).toBe(false);
        });

        it('应该处理未注册的组件类型', () => {
            class UnregisteredComponent extends Component {}
            
            const matcher = Matcher.all(ComponentA, UnregisteredComponent);
            const bitCondition = matcher.getBitMaskCondition();

            // 只应包含已注册组件的掩码
            const expectedMask = ComponentRegistry.getBitMask(ComponentA);
            expect(bitCondition.allMask.toString()).toBe(expectedMask.toString());
        });

        it('应该处理重复组件类型', () => {
            const matcher = Matcher.all(ComponentA, ComponentA);
            const bitCondition = matcher.getBitMaskCondition();

            // 重复的组件类型应该产生相同的掩码
            const expectedMask = ComponentRegistry.getBitMask(ComponentA);
            expect(bitCondition.allMask.toString()).toBe(expectedMask.toString());
        });
    });

    describe('性能验证', () => {
        it('编译过程应该足够快', () => {
            const matcher = Matcher.all(ComponentA, ComponentB)
                .any(ComponentC, ComponentD)
                .none(ComponentA);

            const startTime = performance.now();
            for (let i = 0; i < 1000; i++) {
                matcher.getBitMaskCondition();
            }
            const endTime = performance.now();

            // 1000次编译应该在10ms内完成（大部分是缓存命中）
            expect(endTime - startTime).toBeLessThan(10);
        });
    });
});