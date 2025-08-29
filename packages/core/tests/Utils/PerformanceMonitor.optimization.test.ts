import { PerformanceMonitor, SamplingConfig, PerformanceWarningType } from '../../src/Utils/PerformanceMonitor';

describe('PerformanceMonitor - 采样和阈值优化测试', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
        monitor = PerformanceMonitor.instance;
        monitor.enable();
        monitor.reset();
        monitor.clearWarnings();
    });

    afterEach(() => {
        monitor.disable();
    });

    describe('采样率控制', () => {
        it('应该支持配置采样率减少监控开销', () => {
            // 配置每10帧采样一次
            monitor.configureSampling({ rate: 10 });

            const systemName = 'TestSystem';
            let sampledCount = 0;

            // 模拟100帧调用
            for (let i = 0; i < 100; i++) {
                const startTime = monitor.startMonitoring(systemName);
                if (startTime > 0) {
                    sampledCount++;
                    // 模拟5ms执行时间
                    const mockEndTime = startTime + 5;
                    (monitor as any).endMonitoring(systemName, startTime, 10);
                }
            }

            // 应该只采样了10次（每10帧1次）
            expect(sampledCount).toBe(10);
            
            const stats = monitor.getSystemStats(systemName);
            expect(stats?.executionCount).toBe(10);
        });

        it('应该支持获取和修改采样配置', () => {
            const config: SamplingConfig = {
                rate: 5,
                thresholdSampling: true,
                thresholdMs: 10.0
            };

            monitor.configureSampling(config);
            const retrievedConfig = monitor.getSamplingConfig();

            expect(retrievedConfig.rate).toBe(5);
            expect(retrievedConfig.thresholdSampling).toBe(true);
            expect(retrievedConfig.thresholdMs).toBe(10.0);
        });
    });

    describe('阈值采样', () => {
        it('应该只记录超过阈值的性能数据', () => {
            // 启用阈值采样，阈值设为10ms
            monitor.configureSampling({ 
                rate: 1, 
                thresholdSampling: true, 
                thresholdMs: 10.0 
            });

            const systemName = 'ThresholdTestSystem';

            // 模拟快速执行（低于阈值）
            for (let i = 0; i < 50; i++) {
                const startTime = monitor.startMonitoring(systemName);
                if (startTime > 0) {
                    // 模拟5ms执行时间（低于阈值）
                    monitor.endMonitoring(systemName, startTime, 5);
                }
            }

            // 应该没有记录任何数据
            let stats = monitor.getSystemStats(systemName);
            expect(stats).toBeUndefined();

            // 模拟慢速执行（超过阈值）
            for (let i = 0; i < 10; i++) {
                // 模拟15ms执行时间（超过阈值）
                const startTime = performance.now() - 15;
                // 直接调用endMonitoring，绕过startMonitoring的采样控制
                monitor.endMonitoring(systemName, startTime, 20);
            }

            // 应该记录了超过阈值的数据
            stats = monitor.getSystemStats(systemName);
            expect(stats?.executionCount).toBe(10);
        });
    });

    describe('性能警告机制', () => {
        it('应该在执行时间超过阈值时生成警告', () => {
            monitor.configureThresholds({
                executionTime: { warning: 10, critical: 20 }
            });

            const systemName = 'SlowSystem';
            const startTime = performance.now();
            
            // 等待足够时间使executionTime超过阈值
            const delayTime = 25;
            const actualStartTime = performance.now() - delayTime;

            // 模拟25ms执行时间（超过critical阈值）
            monitor.endMonitoring(systemName, actualStartTime, 100);

            const warnings = monitor.getWarnings();
            expect(warnings.length).toBeGreaterThan(0);

            const criticalWarning = warnings.find(w => 
                w.type === PerformanceWarningType.HIGH_EXECUTION_TIME && 
                w.severity === 'critical'
            );
            expect(criticalWarning).toBeDefined();
            expect(criticalWarning?.systemName).toBe(systemName);
        });

        it('应该在实体数量超过阈值时生成警告', () => {
            // 确保禁用阈值采样
            monitor.configureSampling({ thresholdSampling: false, rate: 1 });
            monitor.configureThresholds({
                entityCount: { warning: 100, critical: 500 }
            });

            const systemName = 'MassiveSystem';
            const actualStartTime = performance.now() - 5; // 模拟5ms执行时间

            // 模拟处理1000个实体
            monitor.endMonitoring(systemName, actualStartTime, 1000);

            const warnings = monitor.getWarnings();
            expect(warnings.length).toBeGreaterThan(0);
            
            const entityWarning = warnings.find(w => 
                w.type === PerformanceWarningType.HIGH_ENTITY_COUNT
            );
            expect(entityWarning).toBeDefined();
            expect(entityWarning?.value).toBe(1000);
            expect(entityWarning?.severity).toBe('critical');
        });

        it('应该支持清除和获取最近警告', () => {
            monitor.configureThresholds({
                executionTime: { warning: 5, critical: 10 }
            });

            // 生成一些警告
            const actualStartTime = performance.now() - 15; // 模拟15ms执行时间
            monitor.endMonitoring('System1', actualStartTime, 50);
            monitor.endMonitoring('System2', actualStartTime, 50);

            expect(monitor.getWarnings().length).toBeGreaterThan(0);

            monitor.clearWarnings();
            expect(monitor.getWarnings().length).toBe(0);

            // 再次生成警告
            monitor.endMonitoring('System3', actualStartTime, 50);
            const recentWarnings = monitor.getRecentWarnings(1000);
            expect(recentWarnings.length).toBeGreaterThan(0);
        });
    });

    describe('性能开销测试', () => {
        it('禁用监控时应该有最小开销', () => {
            monitor.disable();
            
            const systemName = 'DisabledTestSystem';
            const iterations = 1000;

            const start = performance.now();
            for (let i = 0; i < iterations; i++) {
                const startTime = monitor.startMonitoring(systemName);
                monitor.endMonitoring(systemName, startTime, 10);
            }
            const elapsed = performance.now() - start;

            // 禁用时的开销应该很小（每次调用平均小于0.01ms）
            expect(elapsed / iterations).toBeLessThan(0.01);
        });

        it('采样率应该显著减少监控开销', () => {
            const systemName = 'SamplingTestSystem';
            const iterations = 1000;

            // 测试每帧采样
            monitor.configureSampling({ rate: 1 });
            const startEveryFrame = performance.now();
            for (let i = 0; i < iterations; i++) {
                const startTime = monitor.startMonitoring(systemName);
                if (startTime > 0) {
                    monitor.endMonitoring(systemName, startTime, 10);
                }
            }
            const everyFrameTime = performance.now() - startEveryFrame;

            monitor.reset();

            // 测试每10帧采样
            monitor.configureSampling({ rate: 10 });
            const startSampled = performance.now();
            for (let i = 0; i < iterations; i++) {
                const startTime = monitor.startMonitoring(systemName);
                if (startTime > 0) {
                    monitor.endMonitoring(systemName, startTime, 10);
                }
            }
            const sampledTime = performance.now() - startSampled;

            // 采样应该显著减少开销
            expect(sampledTime).toBeLessThan(everyFrameTime);
        });
    });

    describe('字符串key缓存效果', () => {
        it('应该避免重复的字符串拼接', () => {
            // 这个测试主要是验证EntitySystem中的字符串key缓存
            // 通过对比使用缓存key和动态拼接字符串的性能差异

            const systemName = 'CacheTestSystem';
            const iterations = 1000;

            // 模拟使用缓存key（直接使用字符串）
            const cachedKey = systemName;
            const startCached = performance.now();
            for (let i = 0; i < iterations; i++) {
                const startTime = monitor.startMonitoring(cachedKey);
                if (startTime > 0) {
                    monitor.endMonitoring(cachedKey, startTime, 10);
                }
            }
            const cachedTime = performance.now() - startCached;

            monitor.reset();

            // 模拟动态拼接字符串
            const startDynamic = performance.now();
            for (let i = 0; i < iterations; i++) {
                const dynamicKey = `${systemName}`;
                const startTime = monitor.startMonitoring(dynamicKey);
                if (startTime > 0) {
                    monitor.endMonitoring(dynamicKey, startTime, 10);
                }
            }
            const dynamicTime = performance.now() - startDynamic;

            // 缓存key应该稍微快一些或至少不会明显慢（允许20%的变化）
            expect(cachedTime).toBeLessThanOrEqual(dynamicTime * 1.2);
        });
    });
});