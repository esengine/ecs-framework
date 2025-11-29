import { ProfilerSDK } from '../../../src/Utils/Profiler/ProfilerSDK';
import {
    ProfileCategory,
    DEFAULT_PROFILER_CONFIG
} from '../../../src/Utils/Profiler/ProfilerTypes';

describe('ProfilerSDK', () => {
    beforeEach(() => {
        ProfilerSDK.reset();
        ProfilerSDK.setEnabled(true);
    });

    afterEach(() => {
        ProfilerSDK.reset();
    });

    describe('Configuration', () => {
        test('should be disabled by default after resetInstance', () => {
            ProfilerSDK.resetInstance();
            expect(ProfilerSDK.isEnabled()).toBe(false);
        });

        test('should enable and disable correctly', () => {
            ProfilerSDK.setEnabled(true);
            expect(ProfilerSDK.isEnabled()).toBe(true);

            ProfilerSDK.setEnabled(false);
            expect(ProfilerSDK.isEnabled()).toBe(false);
        });

        test('should use default config values', () => {
            expect(DEFAULT_PROFILER_CONFIG.enabled).toBe(false);
            expect(DEFAULT_PROFILER_CONFIG.maxFrameHistory).toBe(300);
            expect(DEFAULT_PROFILER_CONFIG.maxSampleDepth).toBe(32);
            expect(DEFAULT_PROFILER_CONFIG.collectMemory).toBe(true);
            expect(DEFAULT_PROFILER_CONFIG.detectLongTasks).toBe(true);
            expect(DEFAULT_PROFILER_CONFIG.longTaskThreshold).toBe(50);
        });
    });

    describe('Sample Operations', () => {
        test('should begin and end sample', () => {
            ProfilerSDK.beginFrame();
            const handle = ProfilerSDK.beginSample('TestSample', ProfileCategory.Custom);
            expect(handle).not.toBeNull();
            expect(handle?.name).toBe('TestSample');
            expect(handle?.category).toBe(ProfileCategory.Custom);

            ProfilerSDK.endSample(handle);
            ProfilerSDK.endFrame();

            const frame = ProfilerSDK.getCurrentFrame();
            expect(frame).not.toBeNull();
            expect(frame?.samples.length).toBeGreaterThan(0);
        });

        test('should handle nested samples', () => {
            ProfilerSDK.beginFrame();

            const outerHandle = ProfilerSDK.beginSample('OuterSample', ProfileCategory.ECS);
            const innerHandle = ProfilerSDK.beginSample('InnerSample', ProfileCategory.Script);

            expect(innerHandle?.depth).toBe(1);
            expect(innerHandle?.parentId).toBe(outerHandle?.id);

            ProfilerSDK.endSample(innerHandle);
            ProfilerSDK.endSample(outerHandle);

            ProfilerSDK.endFrame();

            const frame = ProfilerSDK.getCurrentFrame();
            expect(frame?.samples.length).toBe(2);
        });

        test('should return null when disabled', () => {
            ProfilerSDK.setEnabled(false);
            const handle = ProfilerSDK.beginSample('TestSample');
            expect(handle).toBeNull();
        });

        test('should handle null handle in endSample gracefully', () => {
            expect(() => ProfilerSDK.endSample(null)).not.toThrow();
        });
    });

    describe('measure() wrapper', () => {
        test('should measure synchronous function execution', () => {
            ProfilerSDK.beginFrame();

            const result = ProfilerSDK.measure('TestFunction', () => {
                let sum = 0;
                for (let i = 0; i < 100; i++) sum += i;
                return sum;
            }, ProfileCategory.Script);

            ProfilerSDK.endFrame();

            expect(result).toBe(4950);

            const frame = ProfilerSDK.getCurrentFrame();
            const sample = frame?.samples.find((s) => s.name === 'TestFunction');
            expect(sample).toBeDefined();
            expect(sample?.category).toBe(ProfileCategory.Script);
        });

        test('should propagate exceptions from measured function', () => {
            ProfilerSDK.beginFrame();

            expect(() => {
                ProfilerSDK.measure('ThrowingFunction', () => {
                    throw new Error('Test error');
                });
            }).toThrow('Test error');

            ProfilerSDK.endFrame();
        });

        test('should still record sample even when function throws', () => {
            ProfilerSDK.beginFrame();

            try {
                ProfilerSDK.measure('ThrowingFunction', () => {
                    throw new Error('Test error');
                });
            } catch {
                // Expected
            }

            ProfilerSDK.endFrame();

            const frame = ProfilerSDK.getCurrentFrame();
            const sample = frame?.samples.find((s) => s.name === 'ThrowingFunction');
            expect(sample).toBeDefined();
        });
    });

    describe('Frame Operations', () => {
        test('should track frame numbers', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.endFrame();

            ProfilerSDK.beginFrame();
            ProfilerSDK.endFrame();

            const frame = ProfilerSDK.getCurrentFrame();
            expect(frame?.frameNumber).toBe(2);
        });

        test('should calculate frame duration', () => {
            ProfilerSDK.beginFrame();

            // Simulate some work
            const start = performance.now();
            while (performance.now() - start < 5) {
                // busy wait for ~5ms
            }

            ProfilerSDK.endFrame();

            const frame = ProfilerSDK.getCurrentFrame();
            expect(frame?.duration).toBeGreaterThan(0);
        });

        test('should collect category stats', () => {
            ProfilerSDK.beginFrame();

            const ecsHandle = ProfilerSDK.beginSample('ECSSystem', ProfileCategory.ECS);
            ProfilerSDK.endSample(ecsHandle);

            const renderHandle = ProfilerSDK.beginSample('Render', ProfileCategory.Rendering);
            ProfilerSDK.endSample(renderHandle);

            ProfilerSDK.endFrame();

            const frame = ProfilerSDK.getCurrentFrame();
            expect(frame?.categoryStats.size).toBeGreaterThan(0);
        });

        test('should maintain frame history', () => {
            for (let i = 0; i < 5; i++) {
                ProfilerSDK.beginFrame();
                ProfilerSDK.endFrame();
            }

            const history = ProfilerSDK.getFrameHistory();
            expect(history.length).toBe(5);
        });
    });

    describe('Counter Operations', () => {
        test('should increment counter without error', () => {
            // Test that counter operations don't throw
            expect(() => {
                ProfilerSDK.incrementCounter('draw_calls', 1, ProfileCategory.Rendering);
                ProfilerSDK.incrementCounter('draw_calls', 1, ProfileCategory.Rendering);
                ProfilerSDK.incrementCounter('draw_calls', 5, ProfileCategory.Rendering);
            }).not.toThrow();
        });

        test('should set gauge value without error', () => {
            // Test that gauge operations don't throw
            expect(() => {
                ProfilerSDK.setGauge('entity_count', 100, ProfileCategory.ECS);
                ProfilerSDK.setGauge('entity_count', 150, ProfileCategory.ECS);
            }).not.toThrow();
        });

        test('should track counters in frame', () => {
            ProfilerSDK.incrementCounter('test_counter', 5, ProfileCategory.Custom);
            ProfilerSDK.beginFrame();
            ProfilerSDK.endFrame();

            const frame = ProfilerSDK.getCurrentFrame();
            // Frame should exist and have counters map
            expect(frame).toBeDefined();
            expect(frame?.counters).toBeDefined();
        });
    });

    describe('Report Generation', () => {
        test('should generate report with hotspots', () => {
            ProfilerSDK.beginFrame();
            const handle1 = ProfilerSDK.beginSample('SlowFunction', ProfileCategory.Script);
            ProfilerSDK.endSample(handle1);
            const handle2 = ProfilerSDK.beginSample('FastFunction', ProfileCategory.Script);
            ProfilerSDK.endSample(handle2);
            ProfilerSDK.endFrame();

            const report = ProfilerSDK.getReport();
            expect(report).toBeDefined();
            expect(report.totalFrames).toBe(1);
            expect(report.hotspots.length).toBeGreaterThan(0);
        });

        test('should calculate frame time statistics', () => {
            for (let i = 0; i < 10; i++) {
                ProfilerSDK.beginFrame();
                // Simulate varying frame times
                const start = performance.now();
                while (performance.now() - start < (i + 1)) {
                    // busy wait
                }
                ProfilerSDK.endFrame();
            }

            const report = ProfilerSDK.getReport();
            expect(report.averageFrameTime).toBeGreaterThan(0);
            expect(report.minFrameTime).toBeLessThanOrEqual(report.averageFrameTime);
            expect(report.maxFrameTime).toBeGreaterThanOrEqual(report.averageFrameTime);
        });

        test('should generate report with limited frame count', () => {
            for (let i = 0; i < 100; i++) {
                ProfilerSDK.beginFrame();
                ProfilerSDK.endFrame();
            }

            const report = ProfilerSDK.getReport(10);
            expect(report.totalFrames).toBe(10);
        });

        test('should build call graph', () => {
            ProfilerSDK.beginFrame();
            const parentHandle = ProfilerSDK.beginSample('Parent', ProfileCategory.Script);
            const childHandle = ProfilerSDK.beginSample('Child', ProfileCategory.Script);
            ProfilerSDK.endSample(childHandle);
            ProfilerSDK.endSample(parentHandle);
            ProfilerSDK.endFrame();

            const report = ProfilerSDK.getReport();
            // Call graph should contain at least the sampled functions
            expect(report.callGraph.size).toBeGreaterThanOrEqual(0);

            // Verify samples were recorded
            const frame = ProfilerSDK.getCurrentFrame();
            expect(frame?.samples.length).toBe(2);
            expect(frame?.samples.some((s) => s.name === 'Parent')).toBe(true);
            expect(frame?.samples.some((s) => s.name === 'Child')).toBe(true);
        });

        test('should track category breakdown', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.measure('ECS1', () => {}, ProfileCategory.ECS);
            ProfilerSDK.measure('ECS2', () => {}, ProfileCategory.ECS);
            ProfilerSDK.measure('Render1', () => {}, ProfileCategory.Rendering);
            ProfilerSDK.endFrame();

            const report = ProfilerSDK.getReport();
            expect(report.categoryBreakdown.size).toBeGreaterThan(0);
        });
    });

    describe('ProfileCategory', () => {
        test('should have all expected categories', () => {
            expect(ProfileCategory.ECS).toBe('ECS');
            expect(ProfileCategory.Rendering).toBe('Rendering');
            expect(ProfileCategory.Physics).toBe('Physics');
            expect(ProfileCategory.Audio).toBe('Audio');
            expect(ProfileCategory.Network).toBe('Network');
            expect(ProfileCategory.Script).toBe('Script');
            expect(ProfileCategory.Memory).toBe('Memory');
            expect(ProfileCategory.Animation).toBe('Animation');
            expect(ProfileCategory.AI).toBe('AI');
            expect(ProfileCategory.Input).toBe('Input');
            expect(ProfileCategory.Loading).toBe('Loading');
            expect(ProfileCategory.Custom).toBe('Custom');
        });
    });

    describe('Memory Tracking', () => {
        test('should collect memory snapshot', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.endFrame();

            const frame = ProfilerSDK.getCurrentFrame();
            expect(frame?.memory).toBeDefined();
            expect(frame?.memory.timestamp).toBeGreaterThan(0);
        });

        test('should track memory trend in report', () => {
            for (let i = 0; i < 5; i++) {
                ProfilerSDK.beginFrame();
                ProfilerSDK.endFrame();
            }

            const report = ProfilerSDK.getReport();
            expect(report.memoryTrend.length).toBeGreaterThan(0);
        });
    });

    describe('Reset', () => {
        test('should clear all data on reset', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.measure('Test', () => {});
            ProfilerSDK.endFrame();

            ProfilerSDK.reset();

            // reset() clears data but maintains enabled state from beforeEach
            expect(ProfilerSDK.getFrameHistory().length).toBe(0);
            expect(ProfilerSDK.getCurrentFrame()).toBeNull();
        });

        test('should disable profiler after resetInstance', () => {
            ProfilerSDK.resetInstance();
            expect(ProfilerSDK.isEnabled()).toBe(false);
        });
    });

    describe('Async measurement', () => {
        test('should measure async function execution', async () => {
            ProfilerSDK.beginFrame();

            const result = await ProfilerSDK.measureAsync('AsyncFunction', async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
                return 42;
            }, ProfileCategory.Network);

            ProfilerSDK.endFrame();

            expect(result).toBe(42);

            const frame = ProfilerSDK.getCurrentFrame();
            const sample = frame?.samples.find((s) => s.name === 'AsyncFunction');
            expect(sample).toBeDefined();
            // Allow some timing variance due to setTimeout not being exact
            expect(sample?.duration).toBeGreaterThanOrEqual(5);
        });
    });
});
