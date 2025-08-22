import { GlobalRNG } from '../../../src/Utils/PRNG/GlobalRNG';
import { Xoroshiro128 } from '../../../src/Utils/PRNG/Xoroshiro128';

describe('GlobalRNG全局随机数管理器测试', () => {
    describe('种子管理', () => {
        it('应该能够设置全局种子', () => {
            const testSeed = 12345;
            GlobalRNG.seed(testSeed);
            
            const retrievedSeed = GlobalRNG.getGlobalSeed();
            expect(retrievedSeed.valueOf()).toBe(testSeed);
        });

        it('应该为不同种子产生不同的随机数生成器', () => {
            GlobalRNG.seed(12345);
            const rng1 = GlobalRNG.forSystem('testSystem');
            const value1 = rng1.nextU32();

            GlobalRNG.seed(54321);
            const rng2 = GlobalRNG.forSystem('testSystem');
            const value2 = rng2.nextU32();

            expect(value1).not.toBe(value2);
        });

        it('应该为相同种子产生相同的随机数生成器', () => {
            const testSeed = 42;
            
            GlobalRNG.seed(testSeed);
            const rng1 = GlobalRNG.forSystem('testSystem');
            const value1 = rng1.nextU32();

            GlobalRNG.seed(testSeed);
            const rng2 = GlobalRNG.forSystem('testSystem');
            const value2 = rng2.nextU32();

            expect(value1).toBe(value2);
        });
    });

    describe('系统级随机数生成器', () => {
        beforeEach(() => {
            GlobalRNG.seed(12345);
        });

        it('应该为系统名称创建Xoroshiro128实例', () => {
            const rng = GlobalRNG.forSystem('TestSystem');
            expect(rng).toBeInstanceOf(Xoroshiro128);
        });

        it('应该为相同系统名称产生相同的随机数序列', () => {
            const rng1 = GlobalRNG.forSystem('System1');
            const rng2 = GlobalRNG.forSystem('System1');
            
            for (let i = 0; i < 10; i++) {
                expect(rng1.nextU32()).toBe(rng2.nextU32());
            }
        });

        it('应该为不同系统名称产生不同的随机数序列', () => {
            const rng1 = GlobalRNG.forSystem('System1');
            const rng2 = GlobalRNG.forSystem('System2');
            
            const values1: number[] = [];
            const values2: number[] = [];
            
            for (let i = 0; i < 10; i++) {
                values1.push(rng1.nextU32());
                values2.push(rng2.nextU32());
            }
            
            expect(values1).not.toEqual(values2);
        });

        it('应该处理特殊字符的系统名称', () => {
            const rng1 = GlobalRNG.forSystem('System@#$%');
            const rng2 = GlobalRNG.forSystem('测试系统');
            
            expect(rng1).toBeInstanceOf(Xoroshiro128);
            expect(rng2).toBeInstanceOf(Xoroshiro128);
            expect(rng1.nextU32()).not.toBe(rng2.nextU32());
        });

        it('应该处理空字符串系统名称', () => {
            const rng = GlobalRNG.forSystem('');
            expect(rng).toBeInstanceOf(Xoroshiro128);
            expect(() => rng.nextU32()).not.toThrow();
        });

        it('应该处理长系统名称', () => {
            const longName = 'A'.repeat(1000);
            const rng = GlobalRNG.forSystem(longName);
            expect(rng).toBeInstanceOf(Xoroshiro128);
            expect(() => rng.nextU32()).not.toThrow();
        });
    });

    describe('实体级随机数生成器', () => {
        beforeEach(() => {
            GlobalRNG.seed(12345);
        });

        it('应该为实体ID创建Xoroshiro128实例', () => {
            const rng = GlobalRNG.forEntity(1);
            expect(rng).toBeInstanceOf(Xoroshiro128);
        });

        it('应该为相同实体ID产生相同的随机数序列', () => {
            const rng1 = GlobalRNG.forEntity(100);
            const rng2 = GlobalRNG.forEntity(100);
            
            for (let i = 0; i < 10; i++) {
                expect(rng1.nextU32()).toBe(rng2.nextU32());
            }
        });

        it('应该为不同实体ID产生不同的随机数序列', () => {
            const rng1 = GlobalRNG.forEntity(1);
            const rng2 = GlobalRNG.forEntity(2);
            
            const values1: number[] = [];
            const values2: number[] = [];
            
            for (let i = 0; i < 10; i++) {
                values1.push(rng1.nextU32());
                values2.push(rng2.nextU32());
            }
            
            expect(values1).not.toEqual(values2);
        });

        it('应该处理负数实体ID', () => {
            const rng = GlobalRNG.forEntity(-1);
            expect(rng).toBeInstanceOf(Xoroshiro128);
            expect(() => rng.nextU32()).not.toThrow();
        });

        it('应该处理零实体ID', () => {
            const rng = GlobalRNG.forEntity(0);
            expect(rng).toBeInstanceOf(Xoroshiro128);
            expect(() => rng.nextU32()).not.toThrow();
        });

        it('应该处理大数值实体ID', () => {
            const largeId = 0xFFFFFFFF;
            const rng = GlobalRNG.forEntity(largeId);
            expect(rng).toBeInstanceOf(Xoroshiro128);
            expect(() => rng.nextU32()).not.toThrow();
        });
    });

    describe('隔离性测试', () => {
        beforeEach(() => {
            GlobalRNG.seed(12345);
        });

        it('系统级和实体级随机数生成器应该相互独立', () => {
            const systemRng = GlobalRNG.forSystem('TestSystem');
            const entityRng = GlobalRNG.forEntity(1);
            
            const systemValues = [];
            const entityValues = [];
            
            for (let i = 0; i < 10; i++) {
                systemValues.push(systemRng.nextU32());
                entityValues.push(entityRng.nextU32());
            }
            
            expect(systemValues).not.toEqual(entityValues);
        });

        it('多个系统的随机数生成器应该相互独立', () => {
            const rng1 = GlobalRNG.forSystem('System1');
            const rng2 = GlobalRNG.forSystem('System2');
            const rng3 = GlobalRNG.forSystem('System3');
            
            const sequences: number[][] = [[], [], []];
            const rngs = [rng1, rng2, rng3];
            
            for (let i = 0; i < 10; i++) {
                rngs.forEach((rng, index) => {
                    sequences[index].push(rng.nextU32());
                });
            }
            
            expect(sequences[0]).not.toEqual(sequences[1]);
            expect(sequences[1]).not.toEqual(sequences[2]);
            expect(sequences[0]).not.toEqual(sequences[2]);
        });

        it('多个实体的随机数生成器应该相互独立', () => {
            const rng1 = GlobalRNG.forEntity(1);
            const rng2 = GlobalRNG.forEntity(2);
            const rng3 = GlobalRNG.forEntity(3);
            
            const sequences: number[][] = [[], [], []];
            const rngs = [rng1, rng2, rng3];
            
            for (let i = 0; i < 10; i++) {
                rngs.forEach((rng, index) => {
                    sequences[index].push(rng.nextU32());
                });
            }
            
            expect(sequences[0]).not.toEqual(sequences[1]);
            expect(sequences[1]).not.toEqual(sequences[2]);
            expect(sequences[0]).not.toEqual(sequences[2]);
        });
    });

    describe('可重现性测试', () => {
        it('应该能够重置种子并重现相同的随机数序列', () => {
            const seed = 42;
            
            GlobalRNG.seed(seed);
            const systemRng1 = GlobalRNG.forSystem('TestSystem');
            const entityRng1 = GlobalRNG.forEntity(100);
            
            const systemSequence1: number[] = [];
            const entitySequence1: number[] = [];
            
            for (let i = 0; i < 10; i++) {
                systemSequence1.push(systemRng1.nextU32());
                entitySequence1.push(entityRng1.nextU32());
            }
            
            GlobalRNG.seed(seed);
            const systemRng2 = GlobalRNG.forSystem('TestSystem');
            const entityRng2 = GlobalRNG.forEntity(100);
            
            const systemSequence2: number[] = [];
            const entitySequence2: number[] = [];
            
            for (let i = 0; i < 10; i++) {
                systemSequence2.push(systemRng2.nextU32());
                entitySequence2.push(entityRng2.nextU32());
            }
            
            expect(systemSequence1).toEqual(systemSequence2);
            expect(entitySequence1).toEqual(entitySequence2);
        });
    });
});