import { Bits } from '../../../src/ECS/Utils/Bits';
import { BitMask64Utils } from '../../../src/ECS/Utils/BigIntCompatibility';

describe('Bits - 高性能位操作类测试', () => {
    let bits: Bits;

    beforeEach(() => {
        bits = new Bits();
    });

    describe('基本构造和初始化', () => {
        it('应该能够创建空的Bits对象', () => {
            expect(bits).toBeDefined();
            expect(bits.isEmpty()).toBe(true);
            expect(BitMask64Utils.isZero(bits.getValue())).toBe(true);
        });

        it('应该能够使用初始值创建Bits对象', () => {
            const bitsWithValue = new Bits(5); // 二进制: 101
            expect(bitsWithValue.toHexString()).toBe('0x5');
            expect(bitsWithValue.isEmpty()).toBe(false);
            expect(bitsWithValue.get(0)).toBe(true);  // 第0位
            expect(bitsWithValue.get(1)).toBe(false); // 第1位
            expect(bitsWithValue.get(2)).toBe(true);  // 第2位
        });

        it('默认构造函数应该创建值为0的对象', () => {
            const defaultBits = new Bits();
            expect(BitMask64Utils.isZero(defaultBits.getValue())).toBe(true);
        });
    });

    describe('位设置和清除操作', () => {
        it('应该能够设置指定位置的位', () => {
            bits.set(0);
            expect(bits.get(0)).toBe(true);
            expect(bits.toHexString()).toBe('0x1');

            bits.set(3);
            expect(bits.get(3)).toBe(true);
            expect(bits.toHexString()).toBe('0x9'); // 1001 in binary
        });

        it('应该能够清除指定位置的位', () => {
            bits.set(0);
            bits.set(1);
            bits.set(2);
            expect(bits.toHexString()).toBe('0x7'); // 111 in binary

            bits.clear(1);
            expect(bits.get(1)).toBe(false);
            expect(bits.toHexString()).toBe('0x5'); // 101 in binary
        });

        it('重复设置同一位应该保持不变', () => {
            bits.set(0);
            const value1 = bits.getValue();
            bits.set(0);
            const value2 = bits.getValue();
            expect(BitMask64Utils.equals(value1, value2)).toBe(true);
        });

        it('清除未设置的位应该安全', () => {
            bits.clear(5);
            expect(BitMask64Utils.isZero(bits.getValue())).toBe(true);
        });

        it('设置负索引应该抛出错误', () => {
            expect(() => {
                bits.set(-1);
            }).toThrow('Bit index cannot be negative');
        });

        it('清除负索引应该抛出错误', () => {
            expect(() => {
                bits.clear(-1);
            }).toThrow('Bit index cannot be negative');
        });
    });

    describe('位获取操作', () => {
        beforeEach(() => {
            bits.set(0);
            bits.set(2);
            bits.set(4);
        });

        it('应该能够正确获取设置的位', () => {
            expect(bits.get(0)).toBe(true);
            expect(bits.get(2)).toBe(true);
            expect(bits.get(4)).toBe(true);
        });

        it('应该能够正确获取未设置的位', () => {
            expect(bits.get(1)).toBe(false);
            expect(bits.get(3)).toBe(false);
            expect(bits.get(5)).toBe(false);
        });

        it('获取负索引应该返回false', () => {
            expect(bits.get(-1)).toBe(false);
            expect(bits.get(-10)).toBe(false);
        });

        it('获取超大索引应该正确处理', () => {
            expect(bits.get(1000)).toBe(false);
        });
    });

    describe('位运算操作', () => {
        let otherBits: Bits;

        beforeEach(() => {
            bits.set(0);
            bits.set(2);
            bits.set(4); // 10101 in binary = 21

            otherBits = new Bits();
            otherBits.set(1);
            otherBits.set(2);
            otherBits.set(3); // 1110 in binary = 14
        });

        it('AND运算应该正确', () => {
            const result = bits.and(otherBits);
            expect(result.toHexString()).toBe('0x4'); // 10101 & 01110 = 00100 = 4
            expect(result.get(2)).toBe(true);
            expect(result.get(0)).toBe(false);
            expect(result.get(1)).toBe(false);
        });

        it('OR运算应该正确', () => {
            const result = bits.or(otherBits);
            expect(result.toHexString()).toBe('0x1F'); // 10101 | 01110 = 11111 = 31
            expect(result.get(0)).toBe(true);
            expect(result.get(1)).toBe(true);
            expect(result.get(2)).toBe(true);
            expect(result.get(3)).toBe(true);
            expect(result.get(4)).toBe(true);
        });

        it('XOR运算应该正确', () => {
            const result = bits.xor(otherBits);
            expect(result.toHexString()).toBe('0x1B'); // 10101 ^ 01110 = 11011 = 27
            expect(result.get(0)).toBe(true);
            expect(result.get(1)).toBe(true);
            expect(result.get(2)).toBe(false); // 相同位XOR为0
            expect(result.get(3)).toBe(true);
            expect(result.get(4)).toBe(true);
        });

        it('NOT运算应该正确', () => {
            const simpleBits = new Bits(5); // 101 in binary
            const result = simpleBits.not(8); // 限制为8位
            expect(result.toHexString()).toBe('0xFA'); // ~00000101 = 11111010 = 250 (8位)
        });

        it('NOT运算默认64位应该正确', () => {
            const simpleBits = new Bits(1);
            const result = simpleBits.not();
            // 64位全1减去最低位，但由于JavaScript数字精度问题，我们检查特定位
            expect(result.get(0)).toBe(false); // 位0应该是0
            expect(result.get(1)).toBe(true);  // 位1应该是1
            expect(result.get(63)).toBe(true); // 最高位应该是1
        });
    });

    describe('包含性检查', () => {
        let otherBits: Bits;

        beforeEach(() => {
            bits.set(0);
            bits.set(2);
            bits.set(4); // 10101

            otherBits = new Bits();
        });

        it('containsAll应该正确检查包含所有位', () => {
            otherBits.set(0);
            otherBits.set(2); // 101
            expect(bits.containsAll(otherBits)).toBe(true);

            otherBits.set(1); // 111
            expect(bits.containsAll(otherBits)).toBe(false);
        });

        it('intersects应该正确检查交集', () => {
            otherBits.set(1);
            otherBits.set(3); // 1010
            expect(bits.intersects(otherBits)).toBe(false);

            otherBits.set(0); // 1011
            expect(bits.intersects(otherBits)).toBe(true);
        });

        it('excludes应该正确检查互斥', () => {
            otherBits.set(1);
            otherBits.set(3); // 1010
            expect(bits.excludes(otherBits)).toBe(true);

            otherBits.set(0); // 1011
            expect(bits.excludes(otherBits)).toBe(false);
        });

        it('空Bits对象的包含性检查', () => {
            const emptyBits = new Bits();
            expect(bits.containsAll(emptyBits)).toBe(true);
            expect(bits.intersects(emptyBits)).toBe(false);
            expect(bits.excludes(emptyBits)).toBe(true);
        });
    });

    describe('状态检查和计数', () => {
        it('isEmpty应该正确检查空状态', () => {
            expect(bits.isEmpty()).toBe(true);
            
            bits.set(0);
            expect(bits.isEmpty()).toBe(false);
            
            bits.clear(0);
            expect(bits.isEmpty()).toBe(true);
        });

        it('cardinality应该正确计算设置的位数量', () => {
            expect(bits.cardinality()).toBe(0);

            bits.set(0);
            expect(bits.cardinality()).toBe(1);

            bits.set(2);
            bits.set(4);
            expect(bits.cardinality()).toBe(3);

            bits.clear(2);
            expect(bits.cardinality()).toBe(2);
        });

        it('最大64位的cardinality应该正确', () => {
            // 设置很多位，但不超过64位限制
            for (let i = 0; i < 64; i += 2) {
                bits.set(i);
            }
            expect(bits.cardinality()).toBe(32); // 32个偶数位
        });
    });

    describe('清空和重置操作', () => {
        beforeEach(() => {
            bits.set(0);
            bits.set(1);
            bits.set(2);
        });

        it('clearAll应该清空所有位', () => {
            expect(bits.isEmpty()).toBe(false);
            bits.clearAll();
            expect(bits.isEmpty()).toBe(true);
            expect(BitMask64Utils.isZero(bits.getValue())).toBe(true);
        });

        it('clearAll后应该能重新设置位', () => {
            bits.clearAll();
            bits.set(5);
            expect(bits.get(5)).toBe(true);
            expect(bits.cardinality()).toBe(1);
        });
    });

    describe('复制和克隆操作', () => {
        beforeEach(() => {
            bits.set(1);
            bits.set(3);
            bits.set(5);
        });

        it('copyFrom应该正确复制另一个Bits对象', () => {
            const newBits = new Bits();
            newBits.copyFrom(bits);
            
            expect(BitMask64Utils.equals(newBits.getValue(), bits.getValue())).toBe(true);
            expect(newBits.equals(bits)).toBe(true);
        });

        it('clone应该创建相同的副本', () => {
            const clonedBits = bits.clone();
            
            expect(BitMask64Utils.equals(clonedBits.getValue(), bits.getValue())).toBe(true);
            expect(clonedBits.equals(bits)).toBe(true);
            expect(clonedBits).not.toBe(bits); // 应该是不同的对象
        });

        it('修改克隆对象不应该影响原对象', () => {
            const clonedBits = bits.clone();
            clonedBits.set(7);
            
            expect(bits.get(7)).toBe(false);
            expect(clonedBits.get(7)).toBe(true);
        });
    });

    describe('值操作', () => {
        it('getValue和setValue应该正确工作', () => {
            bits.setValue(42);
            expect(bits.toHexString()).toBe('0x2A');
        });

        it('setValue应该正确反映在位操作中', () => {
            bits.setValue(5); // 101 in binary
            expect(bits.get(0)).toBe(true);
            expect(bits.get(1)).toBe(false);
            expect(bits.get(2)).toBe(true);
        });

        it('setValue为0应该清空所有位', () => {
            bits.set(1);
            bits.set(2);
            bits.setValue(0);
            expect(bits.isEmpty()).toBe(true);
        });
    });

    describe('字符串表示和解析', () => {
        beforeEach(() => {
            bits.set(0);
            bits.set(2);
            bits.set(4); // 10101 = 21
        });

        it('toString应该返回可读的位表示', () => {
            const str = bits.toString();
            expect(str).toBe('Bits[0, 2, 4]');
        });

        it('空Bits的toString应该正确', () => {
            const emptyBits = new Bits();
            expect(emptyBits.toString()).toBe('Bits[]');
        });

        it('toBinaryString应该返回正确的二进制表示', () => {
            const binaryStr = bits.toBinaryString(8);
            expect(binaryStr).toBe('00010101');
        });

        it('toBinaryString应该正确处理空格分隔', () => {
            const binaryStr = bits.toBinaryString(16);
            expect(binaryStr).toBe('00000000 00010101');
        });

        it('toHexString应该返回正确的十六进制表示', () => {
            const hexStr = bits.toHexString();
            expect(hexStr).toBe('0x15'); // 21 in hex
        });

        it('fromBinaryString应该正确解析', () => {
            const parsedBits = Bits.fromBinaryString('10101');
            expect(parsedBits.toHexString()).toBe('0x15');
            expect(parsedBits.equals(bits)).toBe(true);
        });

        it('fromBinaryString应该处理带空格的字符串', () => {
            const parsedBits = Bits.fromBinaryString('0001 0101');
            expect(parsedBits.toHexString()).toBe('0x15');
        });

        it('fromHexString应该正确解析', () => {
            const parsedBits = Bits.fromHexString('0x15');
            expect(parsedBits.toHexString()).toBe('0x15');
            expect(parsedBits.equals(bits)).toBe(true);
        });

        it('fromHexString应该处理不带0x前缀的字符串', () => {
            const parsedBits = Bits.fromHexString('15');
            expect(parsedBits.toHexString()).toBe('0x15');
        });
    });

    describe('比较操作', () => {
        let otherBits: Bits;

        beforeEach(() => {
            bits.set(0);
            bits.set(2);
            
            otherBits = new Bits();
        });

        it('equals应该正确比较相等的Bits', () => {
            otherBits.set(0);
            otherBits.set(2);
            expect(bits.equals(otherBits)).toBe(true);
        });

        it('equals应该正确比较不相等的Bits', () => {
            otherBits.set(0);
            otherBits.set(1);
            expect(bits.equals(otherBits)).toBe(false);
        });

        it('空Bits对象应该相等', () => {
            const emptyBits1 = new Bits();
            const emptyBits2 = new Bits();
            expect(emptyBits1.equals(emptyBits2)).toBe(true);
        });
    });

    describe('索引查找操作', () => {
        it('getHighestBitIndex应该返回最高设置位的索引', () => {
            bits.set(0);
            bits.set(5);
            bits.set(10);
            expect(bits.getHighestBitIndex()).toBe(10);
        });

        it('getLowestBitIndex应该返回最低设置位的索引', () => {
            bits.set(3);
            bits.set(7);
            bits.set(1);
            expect(bits.getLowestBitIndex()).toBe(1);
        });

        it('空Bits的索引查找应该返回-1', () => {
            expect(bits.getHighestBitIndex()).toBe(-1);
            expect(bits.getLowestBitIndex()).toBe(-1);
        });

        it('只有一个位设置时索引查找应该正确', () => {
            bits.set(5);
            expect(bits.getHighestBitIndex()).toBe(5);
            expect(bits.getLowestBitIndex()).toBe(5);
        });
    });

    describe('64位边界处理', () => {
        it('应该正确处理64位边界', () => {
            bits.set(63); // 最高位
            expect(bits.get(63)).toBe(true);
            expect(bits.cardinality()).toBe(1);
        });

        it('超过64位索引应该自动扩展', () => {
            // 现在支持自动扩展到 128/256 位
            expect(() => bits.set(64)).not.toThrow();
            expect(() => bits.set(100)).not.toThrow();

            // 验证扩展后的位可以正确读取
            expect(bits.get(64)).toBe(true);
            expect(bits.get(100)).toBe(true);
            expect(bits.get(65)).toBe(false);
        });

        it('64位范围内的位运算应该正确', () => {
            const bits1 = new Bits();
            const bits2 = new Bits();
            
            bits1.set(10);
            bits1.set(20);
            
            bits2.set(10);
            bits2.set(30);
            
            const result = bits1.and(bits2);
            expect(result.get(10)).toBe(true);
            expect(result.get(20)).toBe(false);
            expect(result.get(30)).toBe(false);
        });
    });

    describe('性能测试', () => {
        it('64位范围内的位设置操作应该高效', () => {
            const startTime = performance.now();
            
            // 只在64位范围内设置
            for (let i = 0; i < 64; i++) {
                bits.set(i);
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
            expect(bits.cardinality()).toBe(64);
        });

        it('64位范围内的位查询操作应该高效', () => {
            // 先设置一些位
            for (let i = 0; i < 64; i += 2) {
                bits.set(i);
            }
            
            const startTime = performance.now();
            
            let trueCount = 0;
            for (let i = 0; i < 64; i++) {
                if (bits.get(i)) {
                    trueCount++;
                }
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(10); // 应该在10ms内完成
            expect(trueCount).toBe(32); // 32个偶数位
        });

        it('位运算操作应该高效', () => {
            const otherBits = new Bits();
            
            // 设置一些位，限制在64位范围内
            for (let i = 0; i < 32; i++) {
                bits.set(i * 2);     // 偶数位
                otherBits.set(i * 2 + 1); // 奇数位
            }
            
            const startTime = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                const result = bits.or(otherBits);
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(50); // 应该在50ms内完成
        });
    });

    describe('边界情况和错误处理', () => {
        it('应该处理0值的各种操作', () => {
            const zeroBits = new Bits(0);
            expect(zeroBits.isEmpty()).toBe(true);
            expect(zeroBits.cardinality()).toBe(0);
            expect(zeroBits.getHighestBitIndex()).toBe(-1);
            expect(zeroBits.getLowestBitIndex()).toBe(-1);
        });

        it('应该处理最大BigInt值', () => {
            const maxBits = new Bits(Number.MAX_SAFE_INTEGER);
            expect(maxBits.isEmpty()).toBe(false);
            expect(maxBits.cardinality()).toBeGreaterThan(0);
        });

        it('位操作的结果应该是新对象', () => {
            bits.set(0);
            const otherBits = new Bits();
            otherBits.set(1);
            
            const result = bits.or(otherBits);
            expect(result).not.toBe(bits);
            expect(result).not.toBe(otherBits);
        });

        it('连续的设置和清除操作应该正确', () => {
            for (let i = 0; i < 64; i++) {
                bits.set(i);
                expect(bits.get(i)).toBe(true);
                bits.clear(i);
                expect(bits.get(i)).toBe(false);
            }
            
            expect(bits.isEmpty()).toBe(true);
        });
    });
});