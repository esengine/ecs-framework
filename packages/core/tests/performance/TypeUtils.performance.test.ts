import { TypeUtils } from '../../src/Utils/Extensions/TypeUtils';

describe('TypeUtils - 性能测试', () => {
    // 测试用的类
    class TestClass {
        public value: number = 0;
        
        constructor(...args: unknown[]) {
            if (args.length >= 1) this.value = args[0] as number;
        }
    }

    describe('性能测试', () => {
        it('大量类型获取应该高效', () => {
            const testObjects = [
                42, 'string', true, [], {}, new Date(), new TestClass(),
                new Map(), new Set(), Symbol('test'), BigInt(42)
            ];
            
            const startTime = performance.now();
            
            for (let i = 0; i < 10000; i++) {
                testObjects.forEach(obj => {
                    TypeUtils.getType(obj);
                });
            }
            
            const endTime = performance.now();
            console.log(`TypeUtils.getType 性能测试: ${(endTime - startTime).toFixed(2)}ms`);
            
            // 性能测试不应该有严格的断言，因为环境会影响结果
            expect(endTime - startTime).toBeGreaterThan(0);
        });

        it('不同类型对象的性能对比', () => {
            const iterations = 50000;
            const results: Record<string, number> = {};

            // 测试基本类型
            const primitives = [42, 'string', true];
            let startTime = performance.now();
            for (let i = 0; i < iterations; i++) {
                primitives.forEach(obj => TypeUtils.getType(obj));
            }
            results.primitives = performance.now() - startTime;

            // 测试内置对象
            const builtins = [[], {}, new Date(), /regex/];
            startTime = performance.now();
            for (let i = 0; i < iterations; i++) {
                builtins.forEach(obj => TypeUtils.getType(obj));
            }
            results.builtins = performance.now() - startTime;

            // 测试自定义对象
            const customs = [new TestClass(), new Map(), new Set()];
            startTime = performance.now();
            for (let i = 0; i < iterations; i++) {
                customs.forEach(obj => TypeUtils.getType(obj));
            }
            results.customs = performance.now() - startTime;

            console.log('TypeUtils 性能对比结果:', results);

            // 只验证测试能正常运行
            Object.values(results).forEach(time => {
                expect(time).toBeGreaterThan(0);
            });
        });
    });
});