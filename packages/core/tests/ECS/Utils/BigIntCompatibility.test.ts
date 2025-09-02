import { 
    BigIntFactory, 
    IBigIntLike 
} from '../../../src/ECS/Utils/BigIntCompatibility';

describe('BigInt兼容性测试', () => {
    describe('基本功能', () => {
        it('应该能够创建和获取数值', () => {
            const zero = BigIntFactory.zero();
            const one = BigIntFactory.one();
            const value = BigIntFactory.create(42);
            
            expect(zero.isZero()).toBe(true);
            expect(one.valueOf()).toBe(1);
            expect(value.valueOf()).toBe(42);
        });

        it('应该支持字符串创建', () => {
            const value = BigIntFactory.create('123');
            expect(value.valueOf()).toBe(123);
        });
    });

    describe('位运算', () => {
        let value1: IBigIntLike;
        let value2: IBigIntLike;

        beforeEach(() => {
            value1 = BigIntFactory.create(5); // 101
            value2 = BigIntFactory.create(3); // 011
        });

        it('AND运算', () => {
            const result = value1.and(value2); // 101 & 011 = 001
            expect(result.valueOf()).toBe(1);
        });

        it('OR运算', () => {
            const result = value1.or(value2); // 101 | 011 = 111
            expect(result.valueOf()).toBe(7);
        });

        it('XOR运算', () => {
            const result = value1.xor(value2); // 101 ^ 011 = 110
            expect(result.valueOf()).toBe(6);
        });

        it('NOT运算', () => {
            const value = BigIntFactory.create(5); // 00000101
            const result = value.not(8); // 11111010
            expect(result.valueOf()).toBe(250);
        });

        it('移位运算', () => {
            const value = BigIntFactory.create(5);
            const left = value.shiftLeft(1);
            const right = value.shiftRight(1);
            
            expect(left.valueOf()).toBe(10);
            expect(right.valueOf()).toBe(2);
        });
    });

    describe('字符串解析', () => {
        it('二进制字符串', () => {
            const value = BigIntFactory.fromBinaryString('10101');
            expect(value.valueOf()).toBe(21);
        });

        it('十六进制字符串', () => {
            const value = BigIntFactory.fromHexString('0xFF');
            expect(value.valueOf()).toBe(255);
        });
    });

    describe('ECS位掩码操作', () => {
        it('组件掩码操作', () => {
            const componentMasks: IBigIntLike[] = [];
            for (let i = 0; i < 10; i++) {
                componentMasks.push(BigIntFactory.one().shiftLeft(i));
            }
            
            let combinedMask = BigIntFactory.zero();
            for (const mask of componentMasks) {
                combinedMask = combinedMask.or(mask);
            }
            
            expect(combinedMask.valueOf()).toBe(1023); // 2^10 - 1
        });
    });
});