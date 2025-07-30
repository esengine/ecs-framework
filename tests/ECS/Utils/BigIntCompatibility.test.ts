import { 
    BigIntFactory, 
    IBigIntLike, 
    EnvironmentInfo 
} from '../../../src/ECS/Utils/BigIntCompatibility';

describe('BigInt兼容性测试', () => {
    describe('BigIntFactory环境检测', () => {
        it('应该能够检测BigInt支持情况', () => {
            const isSupported = BigIntFactory.isNativeSupported();
            expect(typeof isSupported).toBe('boolean');
        });

        it('应该返回环境信息', () => {
            const envInfo = BigIntFactory.getEnvironmentInfo();
            expect(envInfo).toBeDefined();
            expect(typeof envInfo.supportsBigInt).toBe('boolean');
            expect(typeof envInfo.environment).toBe('string');
            expect(typeof envInfo.jsEngine).toBe('string');
        });

        it('环境信息应该包含合理的字段', () => {
            const envInfo = BigIntFactory.getEnvironmentInfo();
            expect(envInfo.environment).not.toBe('');
            expect(envInfo.jsEngine).not.toBe('');
        });
    });

    describe('BigIntFactory基本创建', () => {
        it('应该能够创建零值', () => {
            const zero = BigIntFactory.zero();
            expect(zero.isZero()).toBe(true);
            expect(zero.toString()).toBe('0');
        });

        it('应该能够创建1值', () => {
            const one = BigIntFactory.one();
            expect(one.isZero()).toBe(false);
            expect(one.toString()).toBe('1');
        });

        it('应该能够从数值创建', () => {
            const value = BigIntFactory.create(42);
            expect(value.toString()).toBe('42');
            expect(value.valueOf()).toBe(42);
        });

        it('应该能够从字符串创建', () => {
            const value = BigIntFactory.create('123');
            expect(value.toString()).toBe('123');
        });

        it('应该能够从原生BigInt创建（如果支持）', () => {
            if (BigIntFactory.isNativeSupported()) {
                const value = BigIntFactory.create(BigInt(456));
                expect(value.toString()).toBe('456');
            }
        });
    });

    describe('IBigIntLike基本操作', () => {
        let value1: IBigIntLike;
        let value2: IBigIntLike;

        beforeEach(() => {
            value1 = BigIntFactory.create(5); // 101 in binary
            value2 = BigIntFactory.create(3); // 011 in binary
        });

        it('should支持字符串转换', () => {
            expect(value1.toString()).toBe('5');
            expect(value2.toString()).toBe('3');
        });

        it('应该支持十六进制转换', () => {
            const value = BigIntFactory.create(255);
            expect(value.toString(16)).toBe('FF');
        });

        it('应该支持二进制转换', () => {
            expect(value1.toString(2)).toBe('101');
            expect(value2.toString(2)).toBe('11');
        });

        it('应该支持相等比较', () => {
            const value1Copy = BigIntFactory.create(5);
            expect(value1.equals(value1Copy)).toBe(true);
            expect(value1.equals(value2)).toBe(false);
        });

        it('应该支持零值检查', () => {
            const zero = BigIntFactory.zero();
            expect(zero.isZero()).toBe(true);
            expect(value1.isZero()).toBe(false);
        });

        it('应该支持克隆操作', () => {
            const cloned = value1.clone();
            expect(cloned.equals(value1)).toBe(true);
            expect(cloned).not.toBe(value1); // 不同的对象引用
        });
    });

    describe('位运算操作', () => {
        let value1: IBigIntLike; // 5 = 101
        let value2: IBigIntLike; // 3 = 011

        beforeEach(() => {
            value1 = BigIntFactory.create(5);
            value2 = BigIntFactory.create(3);
        });

        it('AND运算应该正确', () => {
            const result = value1.and(value2);
            expect(result.toString()).toBe('1'); // 101 & 011 = 001
        });

        it('OR运算应该正确', () => {
            const result = value1.or(value2);
            expect(result.toString()).toBe('7'); // 101 | 011 = 111
        });

        it('XOR运算应该正确', () => {
            const result = value1.xor(value2);
            expect(result.toString()).toBe('6'); // 101 ^ 011 = 110
        });

        it('NOT运算应该正确（8位限制）', () => {
            const value = BigIntFactory.create(5); // 00000101
            const result = value.not(8);
            expect(result.toString()).toBe('250'); // 11111010 = 250
        });

        it('左移位运算应该正确', () => {
            const result = value1.shiftLeft(2);
            expect(result.toString()).toBe('20'); // 101 << 2 = 10100 = 20
        });

        it('右移位运算应该正确', () => {
            const result = value1.shiftRight(1);
            expect(result.toString()).toBe('2'); // 101 >> 1 = 10 = 2
        });

        it('移位0位应该返回相同值', () => {
            const result = value1.shiftLeft(0);
            expect(result.equals(value1)).toBe(true);
        });

        it('右移超过位数应该返回0', () => {
            const result = value1.shiftRight(10);
            expect(result.isZero()).toBe(true);
        });
    });

    describe('复杂位运算场景', () => {
        it('应该正确处理大数值位运算', () => {
            const large1 = BigIntFactory.create(0xFFFFFFFF); // 32位全1
            const large2 = BigIntFactory.create(0x12345678);

            const andResult = large1.and(large2);
            expect(andResult.toString(16)).toBe('12345678');

            const orResult = large1.or(large2);
            expect(orResult.toString(16)).toBe('FFFFFFFF');
        });

        it('应该正确处理连续位运算', () => {
            let result = BigIntFactory.create(1);
            
            // 构建 111111 (6个1)
            for (let i = 1; i < 6; i++) {
                const shifted = BigIntFactory.one().shiftLeft(i);
                result = result.or(shifted);
            }
            
            expect(result.toString()).toBe('63'); // 111111 = 63
            expect(result.toString(2)).toBe('111111');
        });

        it('应该正确处理掩码操作', () => {
            const value = BigIntFactory.create(0b10110101); // 181
            const mask = BigIntFactory.create(0b00001111);  // 15, 低4位掩码

            const masked = value.and(mask);
            expect(masked.toString()).toBe('5'); // 0101 = 5
        });
    });

    describe('字符串解析功能', () => {
        it('应该支持从二进制字符串创建', () => {
            const value = BigIntFactory.fromBinaryString('10101');
            expect(value.toString()).toBe('21');
        });

        it('应该支持从十六进制字符串创建', () => {
            const value1 = BigIntFactory.fromHexString('0xFF');
            const value2 = BigIntFactory.fromHexString('FF');
            
            expect(value1.toString()).toBe('255');
            expect(value2.toString()).toBe('255');
            expect(value1.equals(value2)).toBe(true);
        });

        it('应该正确处理大的十六进制值', () => {
            const value = BigIntFactory.fromHexString('0x12345678');
            expect(value.toString()).toBe('305419896');
        });

        it('应该正确处理长二进制字符串', () => {
            const binaryStr = '11111111111111111111111111111111'; // 32个1
            const value = BigIntFactory.fromBinaryString(binaryStr);
            expect(value.toString()).toBe('4294967295'); // 2^32 - 1
        });
    });

    describe('边界情况和错误处理', () => {
        it('应该正确处理零值的所有操作', () => {
            const zero = BigIntFactory.zero();
            const one = BigIntFactory.one();

            expect(zero.and(one).isZero()).toBe(true);
            expect(zero.or(one).equals(one)).toBe(true);
            expect(zero.xor(one).equals(one)).toBe(true);
            expect(zero.shiftLeft(5).isZero()).toBe(true);
            expect(zero.shiftRight(5).isZero()).toBe(true);
        });

        it('应该正确处理1值的位运算', () => {
            const one = BigIntFactory.one();
            const zero = BigIntFactory.zero();

            expect(one.and(zero).isZero()).toBe(true);
            expect(one.or(zero).equals(one)).toBe(true);
            expect(one.xor(zero).equals(one)).toBe(true);
        });

        it('应该处理不支持的字符串进制', () => {
            const value = BigIntFactory.create(255);
            expect(() => value.toString(8)).toThrow();
        });

        it('NOT运算应该正确处理不同的位数限制', () => {
            const value = BigIntFactory.one(); // 1

            const not8 = value.not(8);
            expect(not8.toString()).toBe('254'); // 11111110 = 254

            const not16 = value.not(16);
            expect(not16.toString()).toBe('65534'); // 1111111111111110 = 65534
        });
    });

    describe('性能和兼容性测试', () => {
        it('两种实现应该产生相同的运算结果', () => {
            // 测试各种运算在两种模式下的一致性
            const testCases = [
                { a: 0, b: 0 },
                { a: 1, b: 1 },
                { a: 5, b: 3 },
                { a: 255, b: 128 },
                { a: 65535, b: 32768 }
            ];

            testCases.forEach(({ a, b }) => {
                const val1 = BigIntFactory.create(a);
                const val2 = BigIntFactory.create(b);

                // 基本运算
                const and = val1.and(val2);
                const or = val1.or(val2);
                const xor = val1.xor(val2);

                // 验证运算结果的一致性
                expect(and.toString()).toBe((a & b).toString());
                expect(or.toString()).toBe((a | b).toString());
                expect(xor.toString()).toBe((a ^ b).toString());
            });
        });

        it('大量运算应该保持高性能', () => {
            const startTime = performance.now();
            
            let result = BigIntFactory.zero();
            for (let i = 0; i < 1000; i++) {
                const value = BigIntFactory.create(i);
                result = result.or(value.shiftLeft(i % 32));
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
            expect(result.isZero()).toBe(false);
        });

        it('应该支持ECS框架中常见的位掩码操作', () => {
            // 模拟组件位掩码
            const componentMasks: IBigIntLike[] = [];
            
            // 创建64个组件的位掩码
            for (let i = 0; i < 64; i++) {
                componentMasks.push(BigIntFactory.one().shiftLeft(i));
            }

            // 组合多个组件掩码
            let combinedMask = BigIntFactory.zero();
            for (let i = 0; i < 10; i++) {
                combinedMask = combinedMask.or(componentMasks[i * 2]);
            }

            // 检查是否包含特定组件
            for (let i = 0; i < 10; i++) {
                const hasComponent = !combinedMask.and(componentMasks[i * 2]).isZero();
                expect(hasComponent).toBe(true);
                
                const hasOtherComponent = !combinedMask.and(componentMasks[i * 2 + 1]).isZero();
                expect(hasOtherComponent).toBe(false);
            }
        });
    });

    describe('与Core类集成测试', () => {
        // 这里我们不直接导入Core来避免循环依赖，而是测试工厂方法
        it('BigIntFactory应该能够为Core提供环境信息', () => {
            const envInfo = BigIntFactory.getEnvironmentInfo();
            
            // 验证所有必需的字段都存在
            expect(envInfo.supportsBigInt).toBeDefined();
            expect(envInfo.environment).toBeDefined();
            expect(envInfo.jsEngine).toBeDefined();
        });

        it('应该提供详细的环境检测信息', () => {
            const envInfo = BigIntFactory.getEnvironmentInfo();
            
            // 环境信息应该有意义
            expect(envInfo.environment).not.toBe('Unknown');
        });
    });
});