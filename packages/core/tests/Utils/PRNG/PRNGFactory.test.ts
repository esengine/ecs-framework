import { PRNGFactory } from '../../../src/Utils/PRNG/PRNGFactory';
import { Xoroshiro128 } from '../../../src/Utils/PRNG/Xoroshiro128';
import { GlobalRNG } from '../../../src/Utils/PRNG/GlobalRNG';

describe('PRNGFactory工厂类测试', () => {
    describe('基本功能', () => {
        it('应该提供种子设置功能', () => {
            const testSeed = 12345;
            PRNGFactory.seed(testSeed);
            
            const retrievedSeed = PRNGFactory.getGlobalSeed();
            expect(retrievedSeed.valueOf()).toBe(testSeed);
        });

        it('应该提供系统级随机数生成器创建功能', () => {
            PRNGFactory.seed(42);
            const rng = PRNGFactory.forSystem('TestSystem');
            expect(rng).toBeInstanceOf(Xoroshiro128);
        });

        it('应该提供实体级随机数生成器创建功能', () => {
            PRNGFactory.seed(42);
            const rng = PRNGFactory.forEntity(100);
            expect(rng).toBeInstanceOf(Xoroshiro128);
        });
    });

    describe('与GlobalRNG的一致性', () => {
        beforeEach(() => {
            PRNGFactory.seed(12345);
            GlobalRNG.seed(12345);
        });

        it('PRNGFactory.forSystem应该与GlobalRNG.forSystem产生相同结果', () => {
            const factoryRng = PRNGFactory.forSystem('TestSystem');
            const globalRng = GlobalRNG.forSystem('TestSystem');
            
            for (let i = 0; i < 10; i++) {
                expect(factoryRng.nextU32()).toBe(globalRng.nextU32());
            }
        });

        it('PRNGFactory.forEntity应该与GlobalRNG.forEntity产生相同结果', () => {
            const factoryRng = PRNGFactory.forEntity(100);
            const globalRng = GlobalRNG.forEntity(100);
            
            for (let i = 0; i < 10; i++) {
                expect(factoryRng.nextU32()).toBe(globalRng.nextU32());
            }
        });

        it('PRNGFactory.seed应该与GlobalRNG.seed效果相同', () => {
            const testSeed = 54321;
            
            PRNGFactory.seed(testSeed);
            const factoryRng = PRNGFactory.forSystem('TestSystem');
            const factoryValue = factoryRng.nextU32();
            
            GlobalRNG.seed(testSeed);
            const globalRng = GlobalRNG.forSystem('TestSystem');
            const globalValue = globalRng.nextU32();
            
            expect(factoryValue).toBe(globalValue);
        });
    });

    describe('便捷API测试', () => {
        it('应该提供简洁的API接口', () => {
            expect(typeof PRNGFactory.seed).toBe('function');
            expect(typeof PRNGFactory.forSystem).toBe('function');
            expect(typeof PRNGFactory.forEntity).toBe('function');
            expect(typeof PRNGFactory.getGlobalSeed).toBe('function');
        });

        it('应该支持链式调用模式', () => {
            PRNGFactory.seed(42);
            const rng1 = PRNGFactory.forSystem('System1');
            const rng2 = PRNGFactory.forEntity(1);
            
            expect(rng1).toBeInstanceOf(Xoroshiro128);
            expect(rng2).toBeInstanceOf(Xoroshiro128);
            
            const value1 = rng1.nextU32();
            const value2 = rng2.nextU32();
            
            expect(typeof value1).toBe('number');
            expect(typeof value2).toBe('number');
        });
    });

    describe('多线程安全性模拟', () => {
        it('应该在多次快速调用中保持一致性', () => {
            PRNGFactory.seed(42);
            
            const results = [];
            for (let i = 0; i < 100; i++) {
                const rng = PRNGFactory.forSystem(`System${i % 10}`);
                results.push(rng.nextU32());
            }
            
            PRNGFactory.seed(42);
            
            const results2 = [];
            for (let i = 0; i < 100; i++) {
                const rng = PRNGFactory.forSystem(`System${i % 10}`);
                results2.push(rng.nextU32());
            }
            
            expect(results).toEqual(results2);
        });
    });

    describe('边界条件测试', () => {
        it('应该处理极端种子值', () => {
            const extremeSeeds = [0, -1, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
            
            extremeSeeds.forEach(seed => {
                expect(() => {
                    PRNGFactory.seed(seed);
                    const rng = PRNGFactory.forSystem('TestSystem');
                    rng.nextU32();
                }).not.toThrow();
            });
        });

        it('应该处理各种系统名称', () => {
            PRNGFactory.seed(42);
            
            const names = ['', 'normalName', '特殊字符名称', 'name@#$%^&*()'];
            
            names.forEach(name => {
                expect(() => {
                    const rng = PRNGFactory.forSystem(name);
                    rng.nextU32();
                }).not.toThrow();
            });
        });

        it('应该处理各种实体ID', () => {
            PRNGFactory.seed(42);
            
            const ids = [0, -1, 1, 0xFFFFFFFF, Number.MAX_SAFE_INTEGER];
            
            ids.forEach(id => {
                expect(() => {
                    const rng = PRNGFactory.forEntity(id);
                    rng.nextU32();
                }).not.toThrow();
            });
        });
    });
});