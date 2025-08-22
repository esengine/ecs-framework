import { Xoroshiro128, splitmix64, hashString32 } from '../../../src/Utils/PRNG/Xoroshiro128';
import { BigIntFactory } from '../../../src/ECS/Utils/BigIntCompatibility';

describe('Xoroshiro128 PRNG测试', () => {
    describe('hashString32函数', () => {
        it('应该为相同字符串产生相同hash值', () => {
            const str = 'test';
            const hash1 = hashString32(str);
            const hash2 = hashString32(str);
            expect(hash1).toBe(hash2);
        });

        it('应该为不同字符串产生不同hash值', () => {
            const hash1 = hashString32('string1');
            const hash2 = hashString32('string2');
            expect(hash1).not.toBe(hash2);
        });

        it('应该返回32位无符号整数', () => {
            const hash = hashString32('test');
            expect(hash).toBeGreaterThanOrEqual(0);
            expect(hash).toBeLessThanOrEqual(0xFFFFFFFF);
        });

        it('应该处理空字符串', () => {
            const hash = hashString32('');
            expect(typeof hash).toBe('number');
            expect(hash).toBeGreaterThanOrEqual(0);
        });

        it('应该处理特殊字符', () => {
            const hash = hashString32('测试中文@#$%');
            expect(typeof hash).toBe('number');
            expect(hash).toBeGreaterThanOrEqual(0);
        });
    });

    describe('splitmix64函数', () => {
        it('应该为相同输入产生相同输出', () => {
            const input = BigIntFactory.create(12345);
            const output1 = splitmix64(input);
            const output2 = splitmix64(input);
            expect(output1.equals(output2)).toBe(true);
        });

        it('应该为不同输入产生不同输出', () => {
            const input1 = BigIntFactory.create(12345);
            const input2 = BigIntFactory.create(54321);
            const output1 = splitmix64(input1);
            const output2 = splitmix64(input2);
            expect(output1.equals(output2)).toBe(false);
        });

        it('应该处理零值输入', () => {
            const input = BigIntFactory.zero();
            const output = splitmix64(input);
            expect(output.isZero()).toBe(false);
        });

        it('应该处理大数值输入', () => {
            const input = BigIntFactory.fromHexString('FFFFFFFFFFFFFFFF');
            const output = splitmix64(input);
            expect(output).toBeDefined();
        });
    });

    describe('Xoroshiro128类', () => {
        let rng: Xoroshiro128;
        
        beforeEach(() => {
            const k0 = BigIntFactory.create(12345);
            const k1 = BigIntFactory.create(67890);
            rng = Xoroshiro128.fromKeys(k0, k1);
        });

        describe('构造和创建', () => {
            it('应该能够通过fromKeys创建实例', () => {
                const k0 = BigIntFactory.create(1);
                const k1 = BigIntFactory.create(2);
                const instance = Xoroshiro128.fromKeys(k0, k1);
                expect(instance).toBeInstanceOf(Xoroshiro128);
            });

            it('应该能够直接构造实例', () => {
                const s0 = BigIntFactory.create(1);
                const s1 = BigIntFactory.create(2);
                const instance = new Xoroshiro128(s0, s1);
                expect(instance).toBeInstanceOf(Xoroshiro128);
            });
        });

        describe('nextU64方法', () => {
            it('应该返回BigInt值', () => {
                const value = rng.nextU64();
                expect(value).toBeDefined();
                expect(typeof value.valueOf()).toBe('number');
            });

            it('应该产生不同的随机数序列', () => {
                const values = [];
                for (let i = 0; i < 100; i++) {
                    values.push(rng.nextU64().valueOf());
                }
                
                const uniqueValues = new Set(values);
                expect(uniqueValues.size).toBeGreaterThan(90);
            });

            it('应该对相同种子产生相同序列', () => {
                const k0 = BigIntFactory.create(42);
                const k1 = BigIntFactory.create(84);
                
                const rng1 = Xoroshiro128.fromKeys(k0, k1);
                const rng2 = Xoroshiro128.fromKeys(k0, k1);
                
                for (let i = 0; i < 10; i++) {
                    const val1 = rng1.nextU64();
                    const val2 = rng2.nextU64();
                    expect(val1.equals(val2)).toBe(true);
                }
            });
        });

        describe('nextU32方法', () => {
            it('应该返回32位无符号整数', () => {
                const value = rng.nextU32();
                expect(typeof value).toBe('number');
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(0xFFFFFFFF);
            });

            it('应该产生不同的随机数', () => {
                const values = [];
                for (let i = 0; i < 100; i++) {
                    values.push(rng.nextU32());
                }
                
                const uniqueValues = new Set(values);
                expect(uniqueValues.size).toBeGreaterThan(90);
            });

            it('应该对相同种子产生相同序列', () => {
                const k0 = BigIntFactory.create(42);
                const k1 = BigIntFactory.create(84);
                
                const rng1 = Xoroshiro128.fromKeys(k0, k1);
                const rng2 = Xoroshiro128.fromKeys(k0, k1);
                
                for (let i = 0; i < 10; i++) {
                    expect(rng1.nextU32()).toBe(rng2.nextU32());
                }
            });
        });

        describe('nextFloat方法', () => {
            it('应该返回0到1之间的浮点数', () => {
                for (let i = 0; i < 100; i++) {
                    const value = rng.nextFloat();
                    expect(value).toBeGreaterThanOrEqual(0);
                    expect(value).toBeLessThan(1);
                }
            });

            it('应该产生均匀分布的随机数', () => {
                const values = [];
                for (let i = 0; i < 1000; i++) {
                    values.push(rng.nextFloat());
                }
                
                const low = values.filter(v => v < 0.5).length;
                const high = values.filter(v => v >= 0.5).length;
                
                expect(Math.abs(low - high)).toBeLessThan(100);
            });

            it('应该对相同种子产生相同序列', () => {
                const k0 = BigIntFactory.create(42);
                const k1 = BigIntFactory.create(84);
                
                const rng1 = Xoroshiro128.fromKeys(k0, k1);
                const rng2 = Xoroshiro128.fromKeys(k0, k1);
                
                for (let i = 0; i < 10; i++) {
                    expect(rng1.nextFloat()).toBeCloseTo(rng2.nextFloat(), 10);
                }
            });
        });

        describe('随机性质量', () => {
            it('应该通过基本随机性测试', () => {
                const values = [];
                for (let i = 0; i < 1000; i++) {
                    values.push(rng.nextU32());
                }
                
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const expectedMean = 0xFFFFFFFF / 2;
                const tolerance = expectedMean * 0.1;
                
                expect(Math.abs(mean - expectedMean)).toBeLessThan(tolerance);
            });

            it('应该避免连续值的强相关性', () => {
                const pairs = [];
                for (let i = 0; i < 100; i++) {
                    pairs.push([rng.nextFloat(), rng.nextFloat()]);
                }
                
                let sameQuadrant = 0;
                for (const [x, y] of pairs) {
                    if ((x < 0.5 && y < 0.5) || (x >= 0.5 && y >= 0.5)) {
                        sameQuadrant++;
                    }
                }
                
                expect(sameQuadrant).toBeLessThan(70);
                expect(sameQuadrant).toBeGreaterThan(30);
            });
        });
    });
});