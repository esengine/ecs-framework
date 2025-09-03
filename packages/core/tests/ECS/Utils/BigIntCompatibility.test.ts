import { 
    BitMask64Data, 
    BitMask64Utils 
} from '../../../src/ECS/Utils/BigIntCompatibility';

describe('64位掩码兼容性测试', () => {
    describe('基本功能', () => {
        it('应该能够创建和检查掩码', () => {
            const zero = BitMask64Utils.ZERO;
            const mask1 = BitMask64Utils.create(0);
            const mask2 = BitMask64Utils.create(5);
            
            expect(BitMask64Utils.isZero(zero)).toBe(true);
            expect(BitMask64Utils.isZero(mask1)).toBe(false);
            expect(BitMask64Utils.isZero(mask2)).toBe(false);
        });

        it('应该支持数字创建', () => {
            const mask = BitMask64Utils.fromNumber(42);
            expect(mask.lo).toBe(42);
            expect(mask.hi).toBe(0);
        });
    });

    describe('位运算', () => {
        let mask1: BitMask64Data;
        let mask2: BitMask64Data;

        beforeEach(() => {
            mask1 = BitMask64Utils.create(2); // 位2
            mask2 = BitMask64Utils.create(3); // 位3
        });

        it('hasAny运算', () => {
            const combined = BitMask64Utils.clone(BitMask64Utils.ZERO);
            BitMask64Utils.orInPlace(combined, mask1);
            BitMask64Utils.orInPlace(combined, mask2);

            expect(BitMask64Utils.hasAny(combined, mask1)).toBe(true);
            expect(BitMask64Utils.hasAny(combined, mask2)).toBe(true);
            
            const mask4 = BitMask64Utils.create(4);
            expect(BitMask64Utils.hasAny(combined, mask4)).toBe(false);
        });

        it('hasAll运算', () => {
            const combined = BitMask64Utils.clone(BitMask64Utils.ZERO);
            BitMask64Utils.orInPlace(combined, mask1);
            BitMask64Utils.orInPlace(combined, mask2);

            expect(BitMask64Utils.hasAll(combined, mask1)).toBe(true);
            expect(BitMask64Utils.hasAll(combined, mask2)).toBe(true);
            
            const both = BitMask64Utils.clone(BitMask64Utils.ZERO);
            BitMask64Utils.orInPlace(both, mask1);
            BitMask64Utils.orInPlace(both, mask2);
            expect(BitMask64Utils.hasAll(combined, both)).toBe(true);
        });

        it('hasNone运算', () => {
            const mask4 = BitMask64Utils.create(4);
            const mask5 = BitMask64Utils.create(5);
            
            expect(BitMask64Utils.hasNone(mask1, mask2)).toBe(true);
            expect(BitMask64Utils.hasNone(mask1, mask4)).toBe(true);
            expect(BitMask64Utils.hasNone(mask1, mask1)).toBe(false);
        });

        it('原地位运算', () => {
            const target = BitMask64Utils.clone(mask1);
            
            // OR操作
            BitMask64Utils.orInPlace(target, mask2);
            expect(BitMask64Utils.hasAll(target, mask1)).toBe(true);
            expect(BitMask64Utils.hasAll(target, mask2)).toBe(true);
            
            // AND操作
            const andTarget = BitMask64Utils.clone(target);
            BitMask64Utils.andInPlace(andTarget, mask1);
            expect(BitMask64Utils.hasAll(andTarget, mask1)).toBe(true);
            expect(BitMask64Utils.hasAny(andTarget, mask2)).toBe(false);
            
            // XOR操作
            const xorTarget = BitMask64Utils.clone(target);
            BitMask64Utils.xorInPlace(xorTarget, mask1);
            expect(BitMask64Utils.hasAny(xorTarget, mask1)).toBe(false);
            expect(BitMask64Utils.hasAll(xorTarget, mask2)).toBe(true);
        });

        it('设置和清除位', () => {
            const mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            
            BitMask64Utils.setBit(mask, 5);
            expect(BitMask64Utils.hasAny(mask, BitMask64Utils.create(5))).toBe(true);
            
            BitMask64Utils.clearBit(mask, 5);
            expect(BitMask64Utils.isZero(mask)).toBe(true);
        });
    });

    describe('字符串表示', () => {
        it('二进制字符串', () => {
            const mask = BitMask64Utils.create(5); // 位5设置为1
            const binaryStr = BitMask64Utils.toString(mask, 2);
            expect(binaryStr).toBe('100000'); // 位5为1
        });

        it('十六进制字符串', () => {
            const mask = BitMask64Utils.fromNumber(255);
            const hexStr = BitMask64Utils.toString(mask, 16);
            expect(hexStr).toBe('0xFF');
        });

        it('大数字的十六进制表示', () => {
            const mask: BitMask64Data = { lo: 0xFFFFFFFF, hi: 0x12345678 };
            const hexStr = BitMask64Utils.toString(mask, 16);
            expect(hexStr).toBe('0x12345678FFFFFFFF');
        });
    });

    describe('位计数', () => {
        it('popCount应该正确计算设置位的数量', () => {
            const mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            expect(BitMask64Utils.popCount(mask)).toBe(0);
            
            BitMask64Utils.setBit(mask, 0);
            BitMask64Utils.setBit(mask, 2);
            BitMask64Utils.setBit(mask, 4);
            expect(BitMask64Utils.popCount(mask)).toBe(3);
        });

        it('大数的popCount', () => {
            const mask = BitMask64Utils.fromNumber(0xFF); // 8个1
            expect(BitMask64Utils.popCount(mask)).toBe(8);
        });
    });

    describe('ECS组件掩码操作', () => {
        it('多组件掩码组合', () => {
            const componentMasks: BitMask64Data[] = [];
            for (let i = 0; i < 10; i++) {
                componentMasks.push(BitMask64Utils.create(i));
            }
            
            let combinedMask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            for (const mask of componentMasks) {
                BitMask64Utils.orInPlace(combinedMask, mask);
            }
            
            expect(BitMask64Utils.popCount(combinedMask)).toBe(10);
            
            // 检查所有位都设置了
            for (let i = 0; i < 10; i++) {
                expect(BitMask64Utils.hasAny(combinedMask, BitMask64Utils.create(i))).toBe(true);
            }
        });

        it('实体匹配模拟', () => {
            // 模拟实体具有组件0, 2, 4
            const entityMask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            BitMask64Utils.setBit(entityMask, 0);
            BitMask64Utils.setBit(entityMask, 2);
            BitMask64Utils.setBit(entityMask, 4);
            
            // 查询需要组件0和2
            const queryMask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            BitMask64Utils.setBit(queryMask, 0);
            BitMask64Utils.setBit(queryMask, 2);
            
            expect(BitMask64Utils.hasAll(entityMask, queryMask)).toBe(true);
            
            // 查询需要组件1和3
            const queryMask2 = BitMask64Utils.clone(BitMask64Utils.ZERO);
            BitMask64Utils.setBit(queryMask2, 1);
            BitMask64Utils.setBit(queryMask2, 3);
            
            expect(BitMask64Utils.hasAll(entityMask, queryMask2)).toBe(false);
        });
    });

    describe('边界测试', () => {
        it('应该处理64位边界', () => {
            expect(() => BitMask64Utils.create(63)).not.toThrow();
            expect(() => BitMask64Utils.create(64)).toThrow();
            expect(() => BitMask64Utils.create(-1)).toThrow();
        });

        it('设置和清除边界位', () => {
            const mask = BitMask64Utils.clone(BitMask64Utils.ZERO);
            
            BitMask64Utils.setBit(mask, 63);
            expect(BitMask64Utils.hasAny(mask, BitMask64Utils.create(63))).toBe(true);
            expect(mask.hi).not.toBe(0);
            expect(mask.lo).toBe(0);
            
            BitMask64Utils.clearBit(mask, 63);
            expect(BitMask64Utils.isZero(mask)).toBe(true);
        });

        it('高32位和低32位操作', () => {
            const lowMask = BitMask64Utils.create(15); // 低32位
            const highMask = BitMask64Utils.create(47); // 高32位
            
            expect(lowMask.hi).toBe(0);
            expect(lowMask.lo).not.toBe(0);
            
            expect(highMask.hi).not.toBe(0);
            expect(highMask.lo).toBe(0);
            
            const combined = BitMask64Utils.clone(BitMask64Utils.ZERO);
            BitMask64Utils.orInPlace(combined, lowMask);
            BitMask64Utils.orInPlace(combined, highMask);
            
            expect(combined.hi).not.toBe(0);
            expect(combined.lo).not.toBe(0);
            expect(BitMask64Utils.popCount(combined)).toBe(2);
        });
    });

    describe('复制和相等性', () => {
        it('clone应该创建独立副本', () => {
            const original = BitMask64Utils.create(5);
            const cloned = BitMask64Utils.clone(original);
            
            expect(BitMask64Utils.equals(original, cloned)).toBe(true);
            
            BitMask64Utils.setBit(cloned, 6);
            expect(BitMask64Utils.equals(original, cloned)).toBe(false);
        });

        it('copy应该正确复制', () => {
            const source = BitMask64Utils.create(10);
            const target = BitMask64Utils.clone(BitMask64Utils.ZERO);
            
            BitMask64Utils.copy(source, target);
            expect(BitMask64Utils.equals(source, target)).toBe(true);
        });

        it('clear应该清除所有位', () => {
            const mask = BitMask64Utils.create(20);
            expect(BitMask64Utils.isZero(mask)).toBe(false);
            
            BitMask64Utils.clear(mask);
            expect(BitMask64Utils.isZero(mask)).toBe(true);
        });
    });
});