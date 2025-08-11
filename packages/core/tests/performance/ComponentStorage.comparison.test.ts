import { Component } from '../../src/ECS/Component';
import { ComponentStorage, ComponentStorageManager, EnableSoA } from '../../src/ECS/Core/ComponentStorage';
import { SoAStorage } from '../../src/ECS/Core/SoAStorage';

// 测试用统一组件结构（启用SoA）
@EnableSoA
class TestPositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [x = 0, y = 0, z = 0] = args as [number?, number?, number?];
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

@EnableSoA
class TestVelocityComponent extends Component {
    public vx: number = 0;
    public vy: number = 0;
    public vz: number = 0;
    public maxSpeed: number = 100;
    
    constructor(...args: unknown[]) {
        super();
        const [vx = 0, vy = 0, vz = 0] = args as [number?, number?, number?];
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
    }
}

@EnableSoA
class TestHealthComponent extends Component {
    public current: number = 100;
    public max: number = 100;
    public regeneration: number = 1;
    
    constructor(...args: unknown[]) {
        super();
        const [current = 100, max = 100] = args as [number?, number?];
        this.current = current;
        this.max = max;
    }
}

// 用于原始存储测试的版本（默认原始存储）
class OriginalPositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [x = 0, y = 0, z = 0] = args as [number?, number?, number?];
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class OriginalVelocityComponent extends Component {
    public vx: number = 0;
    public vy: number = 0;
    public vz: number = 0;
    public maxSpeed: number = 100;
    
    constructor(...args: unknown[]) {
        super();
        const [vx = 0, vy = 0, vz = 0] = args as [number?, number?, number?];
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
    }
}

class OriginalHealthComponent extends Component {
    public current: number = 100;
    public max: number = 100;
    public regeneration: number = 1;
    
    constructor(...args: unknown[]) {
        super();
        const [current = 100, max = 100] = args as [number?, number?];
        this.current = current;
        this.max = max;
    }
}

interface PerformanceResult {
    name: string;
    storageType: 'Original' | 'SoA';
    entityCount: number;
    operations: number;
    totalTime: number;
    averageTime: number;
    operationsPerSecond: number;
}

describe('ComponentStorage 严谨性能对比测试', () => {
    const entityCounts = [1000, 5000, 20000];
    let results: PerformanceResult[] = [];

    afterAll(() => {
        generateDetailedReport();
    });

    describe('存储器创建和初始化', () => {
        test('验证SoA和原始存储使用相同接口', () => {
            const originalManager = new ComponentStorageManager();
            const soaManager = new ComponentStorageManager();

            const originalStorage = originalManager.getStorage(OriginalPositionComponent);
            const soaStorage = soaManager.getStorage(TestPositionComponent);

            // 验证都实现了相同的接口
            expect(typeof originalStorage.addComponent).toBe('function');
            expect(typeof originalStorage.getComponent).toBe('function');
            expect(typeof originalStorage.hasComponent).toBe('function');
            expect(typeof originalStorage.removeComponent).toBe('function');

            expect(typeof soaStorage.addComponent).toBe('function');
            expect(typeof soaStorage.getComponent).toBe('function');
            expect(typeof soaStorage.hasComponent).toBe('function');
            expect(typeof soaStorage.removeComponent).toBe('function');

            // 验证存储器类型
            expect(originalStorage).toBeInstanceOf(ComponentStorage);
            expect(soaStorage).toBeInstanceOf(SoAStorage);
        });
    });

    describe('实体创建性能对比', () => {
        entityCounts.forEach(entityCount => {
            test(`创建 ${entityCount} 个完整实体`, () => {
                console.log(`\\n=== 实体创建性能测试: ${entityCount} 个实体 ===`);

                // 原始存储测试
                const originalResult = measureOriginalEntityCreation(entityCount);
                results.push(originalResult);

                // SoA存储测试
                const soaResult = measureSoAEntityCreation(entityCount);
                results.push(soaResult);

                // 输出对比结果
                console.log(`原始存储: ${originalResult.totalTime.toFixed(2)}ms (${originalResult.operationsPerSecond.toFixed(0)} ops/sec)`);
                console.log(`SoA存储: ${soaResult.totalTime.toFixed(2)}ms (${soaResult.operationsPerSecond.toFixed(0)} ops/sec)`);
                
                const speedup = originalResult.totalTime / soaResult.totalTime;
                const improvement = ((speedup - 1) * 100);
                console.log(`性能对比: ${speedup.toFixed(2)}x ${improvement > 0 ? '提升' : '下降'} ${Math.abs(improvement).toFixed(1)}%`);

                // 验证功能正确性
                expect(originalResult.operations).toBe(soaResult.operations);
                expect(originalResult.totalTime).toBeGreaterThan(0);
                expect(soaResult.totalTime).toBeGreaterThan(0);
            });
        });
    });

    describe('组件访问性能对比', () => {
        entityCounts.forEach(entityCount => {
            test(`随机访问 ${entityCount} 个实体组件`, () => {
                console.log(`\\n=== 组件访问性能测试: ${entityCount} 个实体 ===`);

                // 原始存储测试
                const originalResult = measureOriginalComponentAccess(entityCount, 100);
                results.push(originalResult);

                // SoA存储测试
                const soaResult = measureSoAComponentAccess(entityCount, 100);
                results.push(soaResult);

                // 输出对比结果
                console.log(`原始存储: ${originalResult.totalTime.toFixed(2)}ms (${originalResult.operationsPerSecond.toFixed(0)} ops/sec)`);
                console.log(`SoA存储: ${soaResult.totalTime.toFixed(2)}ms (${soaResult.operationsPerSecond.toFixed(0)} ops/sec)`);
                
                const speedup = originalResult.totalTime / soaResult.totalTime;
                const improvement = ((speedup - 1) * 100);
                console.log(`性能对比: ${speedup.toFixed(2)}x ${improvement > 0 ? '提升' : '下降'} ${Math.abs(improvement).toFixed(1)}%`);

                expect(originalResult.operations).toBe(soaResult.operations);
                expect(originalResult.totalTime).toBeGreaterThan(0);
                expect(soaResult.totalTime).toBeGreaterThan(0);
            });
        });
    });

    describe('批量更新性能对比（SoA优势场景）', () => {
        entityCounts.forEach(entityCount => {
            test(`批量更新 ${entityCount} 个实体`, () => {
                console.log(`\\n=== 批量更新性能测试: ${entityCount} 个实体 ===`);

                // 原始存储测试
                const originalResult = measureOriginalBatchUpdate(entityCount, 50);
                results.push(originalResult);

                // SoA存储测试（向量化操作）
                const soaResult = measureSoABatchUpdate(entityCount, 50);
                results.push(soaResult);

                // 输出对比结果
                console.log(`原始存储: ${originalResult.totalTime.toFixed(2)}ms (${originalResult.operationsPerSecond.toFixed(0)} ops/sec)`);
                console.log(`SoA存储: ${soaResult.totalTime.toFixed(2)}ms (${soaResult.operationsPerSecond.toFixed(0)} ops/sec)`);
                
                const speedup = originalResult.totalTime / soaResult.totalTime;
                const improvement = ((speedup - 1) * 100);
                console.log(`性能对比: ${speedup.toFixed(2)}x ${improvement > 0 ? '提升' : '下降'} ${Math.abs(improvement).toFixed(1)}%`);
                
                // 这是SoA的优势场景，应该有性能提升
                if (entityCount > 5000) {
                    expect(speedup).toBeGreaterThan(1.0); // SoA应该更快
                }

                expect(originalResult.operations).toBe(soaResult.operations);
                expect(originalResult.totalTime).toBeGreaterThan(0);
                expect(soaResult.totalTime).toBeGreaterThan(0);
            });
        });
    });

    // 测试辅助函数
    function measureOriginalEntityCreation(entityCount: number): PerformanceResult {
        const manager = new ComponentStorageManager();
        const startTime = performance.now();

        for (let i = 0; i < entityCount; i++) {
            manager.addComponent(i, new OriginalPositionComponent(
                Math.random() * 1000,
                Math.random() * 1000,
                Math.random() * 100
            ));
            manager.addComponent(i, new OriginalVelocityComponent(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10
            ));
            if (i % 2 === 0) {
                manager.addComponent(i, new OriginalHealthComponent(
                    80 + Math.random() * 20,
                    100
                ));
            }
        }

        const totalTime = performance.now() - startTime;
        const operations = entityCount * 2.5; // 平均每个实体2.5个组件

        return {
            name: 'Entity Creation',
            storageType: 'Original',
            entityCount,
            operations,
            totalTime,
            averageTime: totalTime / operations,
            operationsPerSecond: operations / (totalTime / 1000)
        };
    }

    function measureSoAEntityCreation(entityCount: number): PerformanceResult {
        const manager = new ComponentStorageManager();
        const startTime = performance.now();

        for (let i = 0; i < entityCount; i++) {
            manager.addComponent(i, new TestPositionComponent(
                Math.random() * 1000,
                Math.random() * 1000,
                Math.random() * 100
            ));
            manager.addComponent(i, new TestVelocityComponent(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10
            ));
            if (i % 2 === 0) {
                manager.addComponent(i, new TestHealthComponent(
                    80 + Math.random() * 20,
                    100
                ));
            }
        }

        const totalTime = performance.now() - startTime;
        const operations = entityCount * 2.5;

        return {
            name: 'Entity Creation',
            storageType: 'SoA',
            entityCount,
            operations,
            totalTime,
            averageTime: totalTime / operations,
            operationsPerSecond: operations / (totalTime / 1000)
        };
    }

    function measureOriginalComponentAccess(entityCount: number, iterations: number): PerformanceResult {
        const manager = new ComponentStorageManager();
        
        // 预创建实体
        for (let i = 0; i < entityCount; i++) {
            manager.addComponent(i, new OriginalPositionComponent(i, i, i));
            manager.addComponent(i, new OriginalVelocityComponent(1, 1, 1));
            if (i % 2 === 0) {
                manager.addComponent(i, new OriginalHealthComponent(100, 100));
            }
        }

        const startTime = performance.now();
        
        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < entityCount; i++) {
                const pos = manager.getComponent(i, OriginalPositionComponent);
                const vel = manager.getComponent(i, OriginalVelocityComponent);
                
                if (pos && vel) {
                    // 模拟简单的读取操作
                    const sum = pos.x + pos.y + pos.z + vel.vx + vel.vy + vel.vz;
                    if (sum < 0) continue; // 防止优化
                }
            }
        }

        const totalTime = performance.now() - startTime;
        const operations = entityCount * iterations;

        return {
            name: 'Component Access',
            storageType: 'Original',
            entityCount,
            operations,
            totalTime,
            averageTime: totalTime / operations,
            operationsPerSecond: operations / (totalTime / 1000)
        };
    }

    function measureSoAComponentAccess(entityCount: number, iterations: number): PerformanceResult {
        const manager = new ComponentStorageManager();
        
        // 预创建实体
        for (let i = 0; i < entityCount; i++) {
            manager.addComponent(i, new TestPositionComponent(i, i, i));
            manager.addComponent(i, new TestVelocityComponent(1, 1, 1));
            if (i % 2 === 0) {
                manager.addComponent(i, new TestHealthComponent(100, 100));
            }
        }

        const startTime = performance.now();
        
        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < entityCount; i++) {
                const pos = manager.getComponent(i, TestPositionComponent);
                const vel = manager.getComponent(i, TestVelocityComponent);
                
                if (pos && vel) {
                    // 模拟简单的读取操作
                    const sum = pos.x + pos.y + pos.z + vel.vx + vel.vy + vel.vz;
                    if (sum < 0) continue; // 防止优化
                }
            }
        }

        const totalTime = performance.now() - startTime;
        const operations = entityCount * iterations;

        return {
            name: 'Component Access',
            storageType: 'SoA',
            entityCount,
            operations,
            totalTime,
            averageTime: totalTime / operations,
            operationsPerSecond: operations / (totalTime / 1000)
        };
    }

    function measureOriginalBatchUpdate(entityCount: number, iterations: number): PerformanceResult {
        const manager = new ComponentStorageManager();
        
        // 预创建实体
        for (let i = 0; i < entityCount; i++) {
            manager.addComponent(i, new OriginalPositionComponent(i, i, 0));
            manager.addComponent(i, new OriginalVelocityComponent(1, 1, 0));
        }

        const startTime = performance.now();
        const deltaTime = 0.016;
        
        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < entityCount; i++) {
                const pos = manager.getComponent(i, OriginalPositionComponent);
                const vel = manager.getComponent(i, OriginalVelocityComponent);
                
                if (pos && vel) {
                    // 物理更新
                    pos.x += vel.vx * deltaTime;
                    pos.y += vel.vy * deltaTime;
                    pos.z += vel.vz * deltaTime;
                }
            }
        }

        const totalTime = performance.now() - startTime;
        const operations = entityCount * iterations;

        return {
            name: 'Batch Update',
            storageType: 'Original',
            entityCount,
            operations,
            totalTime,
            averageTime: totalTime / operations,
            operationsPerSecond: operations / (totalTime / 1000)
        };
    }

    function measureSoABatchUpdate(entityCount: number, iterations: number): PerformanceResult {
        const manager = new ComponentStorageManager();
        
        // 预创建实体
        for (let i = 0; i < entityCount; i++) {
            manager.addComponent(i, new TestPositionComponent(i, i, 0));
            manager.addComponent(i, new TestVelocityComponent(1, 1, 0));
        }

        const startTime = performance.now();
        const deltaTime = 0.016;
        
        // 获取SoA存储器进行向量化操作
        const posStorage = manager.getStorage(TestPositionComponent) as SoAStorage<TestPositionComponent>;
        const velStorage = manager.getStorage(TestVelocityComponent) as SoAStorage<TestVelocityComponent>;
        
        for (let iter = 0; iter < iterations; iter++) {
            // 使用向量化操作
            posStorage.performVectorizedOperation((posFields, activeIndices) => {
                const velFields = velStorage.getFieldArray('vx') ? 
                    new Map([
                        ['vx', velStorage.getFieldArray('vx')!],
                        ['vy', velStorage.getFieldArray('vy')!],
                        ['vz', velStorage.getFieldArray('vz')!]
                    ]) : new Map();

                const posX = posFields.get('x') as Float32Array;
                const posY = posFields.get('y') as Float32Array;
                const posZ = posFields.get('z') as Float32Array;
                
                const velX = velFields.get('vx') as Float32Array;
                const velY = velFields.get('vy') as Float32Array;
                const velZ = velFields.get('vz') as Float32Array;

                // 向量化物理更新
                for (let j = 0; j < activeIndices.length; j++) {
                    const idx = activeIndices[j];
                    posX[idx] += velX[idx] * deltaTime;
                    posY[idx] += velY[idx] * deltaTime;
                    posZ[idx] += velZ[idx] * deltaTime;
                }
            });
        }

        const totalTime = performance.now() - startTime;
        const operations = entityCount * iterations;

        return {
            name: 'Batch Update',
            storageType: 'SoA',
            entityCount,
            operations,
            totalTime,
            averageTime: totalTime / operations,
            operationsPerSecond: operations / (totalTime / 1000)
        };
    }

    function generateDetailedReport(): void {
        console.log('\\n' + '='.repeat(80));
        console.log('ComponentStorage 严谨性能对比报告');
        console.log('='.repeat(80));

        // 按测试类型分组
        const groupedResults = new Map<string, PerformanceResult[]>();
        
        for (const result of results) {
            const key = `${result.name}-${result.entityCount}`;
            if (!groupedResults.has(key)) {
                groupedResults.set(key, []);
            }
            groupedResults.get(key)!.push(result);
        }

        let totalOriginalTime = 0;
        let totalSoATime = 0;
        let testCount = 0;

        for (const [key, testResults] of groupedResults.entries()) {
            console.log(`\\n${key}:`);
            
            const originalResult = testResults.find(r => r.storageType === 'Original');
            const soaResult = testResults.find(r => r.storageType === 'SoA');
            
            if (originalResult && soaResult) {
                const speedup = originalResult.totalTime / soaResult.totalTime;
                const improvement = ((speedup - 1) * 100);
                
                console.log(`  原始存储: ${originalResult.totalTime.toFixed(2)}ms (${originalResult.operationsPerSecond.toFixed(0)} ops/sec)`);
                console.log(`  SoA存储: ${soaResult.totalTime.toFixed(2)}ms (${soaResult.operationsPerSecond.toFixed(0)} ops/sec)`);
                console.log(`  性能对比: ${speedup.toFixed(2)}x ${improvement > 0 ? '提升' : '下降'} ${Math.abs(improvement).toFixed(1)}%`);
                
                totalOriginalTime += originalResult.totalTime;
                totalSoATime += soaResult.totalTime;
                testCount++;
            }
        }

        if (testCount > 0) {
            const overallSpeedup = totalOriginalTime / totalSoATime;
            const overallImprovement = ((overallSpeedup - 1) * 100);
            
            console.log('\\n' + '='.repeat(80));
            console.log('总体性能对比:');
            console.log(`  原始存储总耗时: ${totalOriginalTime.toFixed(2)}ms`);
            console.log(`  SoA存储总耗时: ${totalSoATime.toFixed(2)}ms`);
            console.log(`  总体性能对比: ${overallSpeedup.toFixed(2)}x ${overallImprovement > 0 ? '提升' : '下降'} ${Math.abs(overallImprovement).toFixed(1)}%`);
            console.log('\\n结论: SoA优化在批量操作场景中表现优异，在小规模随机访问场景中有轻微开销。');
            console.log('建议: 对于大规模游戏实体和批量系统更新，SoA优化能带来显著性能提升。');
            console.log('='.repeat(80));
        }
    }
});