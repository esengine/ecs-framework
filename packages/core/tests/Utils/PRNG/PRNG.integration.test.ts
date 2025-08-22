import { seed, forSystem, forEntity, Xoroshiro128, GlobalRNG, PRNGFactory } from '../../../src/Utils/PRNG';

describe('PRNG模块集成测试', () => {
    describe('模块导出', () => {
        it('应该正确导出所有主要组件', () => {
            expect(typeof seed).toBe('function');
            expect(typeof forSystem).toBe('function');
            expect(typeof forEntity).toBe('function');
            expect(typeof Xoroshiro128).toBe('function');
            expect(typeof GlobalRNG).toBe('function');
            expect(typeof PRNGFactory).toBe('function');
        });

        it('导出的便捷函数应该工作正常', () => {
            seed(42);
            
            const systemRng = forSystem('TestSystem');
            const entityRng = forEntity(100);
            
            expect(systemRng).toBeInstanceOf(Xoroshiro128);
            expect(entityRng).toBeInstanceOf(Xoroshiro128);
            
            expect(typeof systemRng.nextU32()).toBe('number');
            expect(typeof entityRng.nextU32()).toBe('number');
        });
    });

    describe('统一PRNG系统完整性测试', () => {
        beforeEach(() => {
            seed(12345);
        });

        it('应该能够创建多个系统的独立随机数生成器', () => {
            const systems = ['MovementSystem', 'AISystem', 'RenderSystem', 'AudioSystem'];
            const rngs = systems.map(name => forSystem(name));
            
            expect(rngs).toHaveLength(4);
            rngs.forEach(rng => {
                expect(rng).toBeInstanceOf(Xoroshiro128);
            });
            
            const sequences = rngs.map(rng => {
                const seq = [];
                for (let i = 0; i < 5; i++) {
                    seq.push(rng.nextU32());
                }
                return seq;
            });
            
            for (let i = 0; i < sequences.length; i++) {
                for (let j = i + 1; j < sequences.length; j++) {
                    expect(sequences[i]).not.toEqual(sequences[j]);
                }
            }
        });

        it('应该能够为大量实体创建独立的随机数生成器', () => {
            const entityCount = 1000;
            const rngs = [];
            
            for (let i = 0; i < entityCount; i++) {
                rngs.push(forEntity(i));
            }
            
            expect(rngs).toHaveLength(entityCount);
            
            const samples = rngs.slice(0, 10).map(rng => rng.nextU32());
            const uniqueSamples = new Set(samples);
            expect(uniqueSamples.size).toBe(samples.length);
        });

        it('应该支持混合使用系统级和实体级随机数生成器', () => {
            const systemRng = forSystem('GameLogicSystem');
            const entityRngs = [forEntity(1), forEntity(2), forEntity(3)];
            
            const gameSequence: number[] = [];
            const entitySequences: number[][] = [[], [], []];
            
            for (let frame = 0; frame < 10; frame++) {
                gameSequence.push(systemRng.nextFloat());
                
                entityRngs.forEach((rng, index) => {
                    entitySequences[index].push(rng.nextFloat());
                });
            }
            
            expect(gameSequence).toHaveLength(10);
            entitySequences.forEach(seq => {
                expect(seq).toHaveLength(10);
                expect(seq).not.toEqual(gameSequence);
            });
            
            for (let i = 0; i < entitySequences.length; i++) {
                for (let j = i + 1; j < entitySequences.length; j++) {
                    expect(entitySequences[i]).not.toEqual(entitySequences[j]);
                }
            }
        });
    });

    describe('可重现性和确定性测试', () => {
        it('应该能够完全重现复杂的随机数序列', () => {
            const testSeed = 42;
            
            const firstRun = () => {
                seed(testSeed);
                
                const results = {
                    system1: [] as number[],
                    system2: [] as number[],
                    entities: {} as Record<number, number[]>
                };
                
                const sys1 = forSystem('System1');
                const sys2 = forSystem('System2');
                
                for (let i = 0; i < 5; i++) {
                    results.system1.push(sys1.nextFloat());
                    results.system2.push(sys2.nextU32());
                    
                    for (let entityId = 1; entityId <= 3; entityId++) {
                        if (!results.entities[entityId]) {
                            results.entities[entityId] = [];
                        }
                        const entityRng = forEntity(entityId);
                        results.entities[entityId].push(entityRng.nextU32());
                    }
                }
                
                return results;
            };
            
            const result1 = firstRun();
            const result2 = firstRun();
            
            expect(result1).toEqual(result2);
        });

        it('应该在不同种子下产生不同的随机数序列', () => {
            const runWithSeed = (seedValue: number) => {
                seed(seedValue);
                
                const systemRng = forSystem('TestSystem');
                const entityRng = forEntity(1);
                
                return {
                    systemValues: [systemRng.nextU32(), systemRng.nextU32()],
                    entityValues: [entityRng.nextU32(), entityRng.nextU32()]
                };
            };
            
            const result1 = runWithSeed(12345);
            const result2 = runWithSeed(54321);
            
            expect(result1.systemValues).not.toEqual(result2.systemValues);
            expect(result1.entityValues).not.toEqual(result2.entityValues);
        });
    });

    describe('性能和稳定性测试', () => {
        beforeEach(() => {
            seed(42);
        });

        it('应该能够处理大量随机数生成请求', () => {
            const rng = forSystem('PerformanceTestSystem');
            
            const startTime = Date.now();
            
            for (let i = 0; i < 10000; i++) {
                rng.nextU32();
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(1000);
        });

        it('应该能够并发创建多个随机数生成器', () => {
            const promises = [];
            
            for (let i = 0; i < 100; i++) {
                promises.push(
                    Promise.resolve().then(() => {
                        const rng = forSystem(`ConcurrentSystem${i}`);
                        return rng.nextU32();
                    })
                );
            }
            
            return Promise.all(promises).then(results => {
                expect(results).toHaveLength(100);
                const uniqueResults = new Set(results);
                expect(uniqueResults.size).toBeGreaterThan(90);
            });
        });

        it('应该在长时间运行中保持质量', () => {
            const rng = forSystem('LongRunSystem');
            const buckets = new Array(10).fill(0);
            const sampleCount = 10000;
            
            for (let i = 0; i < sampleCount; i++) {
                const value = rng.nextFloat();
                const bucket = Math.floor(value * 10);
                buckets[bucket]++;
            }
            
            const expectedPerBucket = sampleCount / 10;
            const tolerance = expectedPerBucket * 0.2;
            
            buckets.forEach(count => {
                expect(Math.abs(count - expectedPerBucket)).toBeLessThan(tolerance);
            });
        });
    });

    describe('实际使用场景模拟', () => {
        beforeEach(() => {
            seed(12345);
        });

        it('应该支持游戏系统的典型使用模式', () => {
            const movementSystem = forSystem('MovementSystem');
            const aiSystem = forSystem('AISystem');
            const spawnSystem = forSystem('SpawnSystem');
            
            for (let frame = 0; frame < 60; frame++) {
                const shouldSpawn = spawnSystem.nextFloat() < 0.1;
                
                if (shouldSpawn) {
                    const newEntityId = frame * 1000 + Math.floor(spawnSystem.nextFloat() * 1000);
                    const entityRng = forEntity(newEntityId);
                    
                    const spawnX = entityRng.nextFloat() * 100;
                    const spawnY = entityRng.nextFloat() * 100;
                    
                    expect(spawnX).toBeGreaterThanOrEqual(0);
                    expect(spawnX).toBeLessThan(100);
                    expect(spawnY).toBeGreaterThanOrEqual(0);
                    expect(spawnY).toBeLessThan(100);
                }
                
                const aiDecision = aiSystem.nextFloat();
                const movementNoise = movementSystem.nextFloat();
                
                expect(aiDecision).toBeGreaterThanOrEqual(0);
                expect(aiDecision).toBeLessThan(1);
                expect(movementNoise).toBeGreaterThanOrEqual(0);
                expect(movementNoise).toBeLessThan(1);
            }
        });

        it('应该支持保存和加载游戏状态', () => {
            const gameSeed = 98765;
            
            const saveGameState = () => {
                seed(gameSeed);
                
                const systemStates: number[] = [];
                const entityStates: number[] = [];
                
                const systems = ['AI', 'Movement', 'Combat'];
                systems.forEach(systemName => {
                    const rng = forSystem(systemName);
                    systemStates.push(rng.nextU32());
                });
                
                for (let entityId = 1; entityId <= 5; entityId++) {
                    const rng = forEntity(entityId);
                    entityStates.push(rng.nextU32());
                }
                
                return { systemStates, entityStates };
            };
            
            const state1 = saveGameState();
            const state2 = saveGameState();
            
            expect(state1).toEqual(state2);
        });
    });
});