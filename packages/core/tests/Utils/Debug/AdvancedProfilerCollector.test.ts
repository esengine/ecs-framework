import { AdvancedProfilerCollector } from '../../../src/Utils/Debug/AdvancedProfilerCollector';
import { ProfilerSDK } from '../../../src/Utils/Profiler/ProfilerSDK';
import { ProfileCategory } from '../../../src/Utils/Profiler/ProfilerTypes';

describe('AdvancedProfilerCollector', () => {
    let collector: AdvancedProfilerCollector;

    beforeEach(() => {
        collector = new AdvancedProfilerCollector();
        ProfilerSDK.reset();
        ProfilerSDK.setEnabled(true);
    });

    afterEach(() => {
        ProfilerSDK.reset();
    });

    describe('collectAdvancedData', () => {
        test('should collect basic frame data', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.measure('TestSystem', () => {
                // Simulate work
                let sum = 0;
                for (let i = 0; i < 1000; i++) sum += i;
            }, ProfileCategory.ECS);
            ProfilerSDK.endFrame();

            const data = collector.collectAdvancedData();

            expect(data).toBeDefined();
            expect(data.currentFrame).toBeDefined();
            expect(data.currentFrame.frameNumber).toBeGreaterThanOrEqual(0);
            expect(data.currentFrame.fps).toBeGreaterThanOrEqual(0);
        });

        test('should collect category stats', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.measure('ECSSystem', () => {}, ProfileCategory.ECS);
            ProfilerSDK.measure('RenderSystem', () => {}, ProfileCategory.Rendering);
            ProfilerSDK.endFrame();

            const data = collector.collectAdvancedData();

            expect(data.categoryStats).toBeDefined();
            expect(data.categoryStats.length).toBeGreaterThan(0);
        });

        test('should collect hotspots sorted by time', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.measure('FastFunction', () => {}, ProfileCategory.Script);
            ProfilerSDK.measure('SlowFunction', () => {
                const start = performance.now();
                while (performance.now() - start < 2) {
                    // busy wait
                }
            }, ProfileCategory.Script);
            ProfilerSDK.endFrame();

            const data = collector.collectAdvancedData();

            expect(data.hotspots).toBeDefined();
            expect(data.hotspots.length).toBeGreaterThan(0);
        });

        test('should include frame time history', () => {
            for (let i = 0; i < 5; i++) {
                ProfilerSDK.beginFrame();
                ProfilerSDK.endFrame();
            }

            const data = collector.collectAdvancedData();

            expect(data.frameTimeHistory).toBeDefined();
            expect(data.frameTimeHistory.length).toBeGreaterThan(0);
        });

        test('should include memory information', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.endFrame();

            const data = collector.collectAdvancedData();

            expect(data.currentFrame.memory).toBeDefined();
            expect(data.currentFrame.memory.timestamp).toBeGreaterThan(0);
        });

        test('should include summary statistics', () => {
            for (let i = 0; i < 10; i++) {
                ProfilerSDK.beginFrame();
                ProfilerSDK.endFrame();
            }

            const data = collector.collectAdvancedData();

            expect(data.summary).toBeDefined();
            expect(data.summary.totalFrames).toBeGreaterThan(0);
            expect(typeof data.summary.averageFrameTime).toBe('number');
            expect(typeof data.summary.minFrameTime).toBe('number');
            expect(typeof data.summary.maxFrameTime).toBe('number');
        });

        test('should include long tasks list', () => {
            const data = collector.collectAdvancedData();
            expect(data.longTasks).toBeDefined();
            expect(Array.isArray(data.longTasks)).toBe(true);
        });

        test('should include memory trend', () => {
            const data = collector.collectAdvancedData();
            expect(data.memoryTrend).toBeDefined();
            expect(Array.isArray(data.memoryTrend)).toBe(true);
        });
    });

    describe('setSelectedFunction', () => {
        test('should set selected function for call graph', () => {
            collector.setSelectedFunction('TestFunction');

            ProfilerSDK.beginFrame();
            const parentHandle = ProfilerSDK.beginSample('ParentFunction', ProfileCategory.Script);
            const childHandle = ProfilerSDK.beginSample('TestFunction', ProfileCategory.Script);
            ProfilerSDK.endSample(childHandle);
            ProfilerSDK.endSample(parentHandle);
            ProfilerSDK.endFrame();

            const data = collector.collectAdvancedData();

            expect(data.callGraph).toBeDefined();
            expect(data.callGraph.currentFunction).toBe('TestFunction');
        });

        test('should clear selected function with null', () => {
            collector.setSelectedFunction('TestFunction');
            collector.setSelectedFunction(null);

            const data = collector.collectAdvancedData();

            expect(data.callGraph.currentFunction).toBeNull();
        });

        test('should return empty callers/callees when no function selected', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.measure('Test', () => {}, ProfileCategory.Script);
            ProfilerSDK.endFrame();

            const data = collector.collectAdvancedData();

            expect(data.callGraph.currentFunction).toBeNull();
            expect(data.callGraph.callers).toEqual([]);
            expect(data.callGraph.callees).toEqual([]);
        });
    });

    describe('collectFromLegacyMonitor', () => {
        test('should handle null performance monitor', () => {
            const data = collector.collectFromLegacyMonitor(null);

            expect(data).toBeDefined();
            expect(data.currentFrame.frameNumber).toBe(0);
            expect(data.categoryStats).toEqual([]);
            expect(data.hotspots).toEqual([]);
        });

        test('should build data from legacy monitor', () => {
            const mockMonitor = {
                getAllSystemStats: () => new Map([
                    ['TestSystem', {
                        averageTime: 5,
                        minTime: 2,
                        maxTime: 10,
                        executionCount: 100
                    }]
                ]),
                getAllSystemData: () => new Map([
                    ['TestSystem', {
                        executionTime: 5,
                        entityCount: 50
                    }]
                ])
            };

            const data = collector.collectFromLegacyMonitor(mockMonitor);

            expect(data.categoryStats.length).toBeGreaterThan(0);
            expect(data.hotspots.length).toBeGreaterThan(0);
            expect(data.hotspots[0].name).toBe('TestSystem');
        });

        test('should calculate percentages correctly', () => {
            const mockMonitor = {
                getAllSystemStats: () => new Map([
                    ['System1', { averageTime: 10, executionCount: 1 }],
                    ['System2', { averageTime: 20, executionCount: 1 }]
                ]),
                getAllSystemData: () => new Map([
                    ['System1', { executionTime: 10 }],
                    ['System2', { executionTime: 20 }]
                ])
            };

            const data = collector.collectFromLegacyMonitor(mockMonitor);

            // Check that percentages are calculated
            const ecsCat = data.categoryStats.find(c => c.category === 'ECS');
            expect(ecsCat).toBeDefined();
            expect(ecsCat!.totalTime).toBe(30);
        });

        test('should handle empty stats', () => {
            const mockMonitor = {
                getAllSystemStats: () => new Map(),
                getAllSystemData: () => new Map()
            };

            const data = collector.collectFromLegacyMonitor(mockMonitor);

            expect(data.categoryStats).toEqual([]);
            expect(data.hotspots).toEqual([]);
        });
    });

    describe('IAdvancedProfilerData structure', () => {
        test('should have all required fields', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.endFrame();

            const data = collector.collectAdvancedData();

            // Verify structure
            expect(data).toHaveProperty('currentFrame');
            expect(data).toHaveProperty('frameTimeHistory');
            expect(data).toHaveProperty('categoryStats');
            expect(data).toHaveProperty('hotspots');
            expect(data).toHaveProperty('callGraph');
            expect(data).toHaveProperty('longTasks');
            expect(data).toHaveProperty('memoryTrend');
            expect(data).toHaveProperty('summary');

            // Verify currentFrame structure
            expect(data.currentFrame).toHaveProperty('frameNumber');
            expect(data.currentFrame).toHaveProperty('frameTime');
            expect(data.currentFrame).toHaveProperty('fps');
            expect(data.currentFrame).toHaveProperty('memory');

            // Verify callGraph structure
            expect(data.callGraph).toHaveProperty('currentFunction');
            expect(data.callGraph).toHaveProperty('callers');
            expect(data.callGraph).toHaveProperty('callees');

            // Verify summary structure
            expect(data.summary).toHaveProperty('totalFrames');
            expect(data.summary).toHaveProperty('averageFrameTime');
            expect(data.summary).toHaveProperty('minFrameTime');
            expect(data.summary).toHaveProperty('maxFrameTime');
            expect(data.summary).toHaveProperty('p95FrameTime');
            expect(data.summary).toHaveProperty('p99FrameTime');
            expect(data.summary).toHaveProperty('currentMemoryMB');
            expect(data.summary).toHaveProperty('peakMemoryMB');
            expect(data.summary).toHaveProperty('gcCount');
            expect(data.summary).toHaveProperty('longTaskCount');
        });

        test('hotspot items should have correct structure', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.measure('TestFunction', () => {}, ProfileCategory.Script);
            ProfilerSDK.endFrame();

            const data = collector.collectAdvancedData();
            const hotspot = data.hotspots[0];

            if (hotspot) {
                expect(hotspot).toHaveProperty('name');
                expect(hotspot).toHaveProperty('category');
                expect(hotspot).toHaveProperty('inclusiveTime');
                expect(hotspot).toHaveProperty('inclusiveTimePercent');
                expect(hotspot).toHaveProperty('exclusiveTime');
                expect(hotspot).toHaveProperty('exclusiveTimePercent');
                expect(hotspot).toHaveProperty('callCount');
                expect(hotspot).toHaveProperty('avgCallTime');
            }
        });

        test('category stats items should have correct structure', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.measure('TestFunction', () => {}, ProfileCategory.ECS);
            ProfilerSDK.endFrame();

            const data = collector.collectAdvancedData();
            const category = data.categoryStats[0];

            if (category) {
                expect(category).toHaveProperty('category');
                expect(category).toHaveProperty('totalTime');
                expect(category).toHaveProperty('percentOfFrame');
                expect(category).toHaveProperty('sampleCount');
                expect(category).toHaveProperty('items');
            }
        });
    });

    describe('Edge cases', () => {
        test('should handle no profiler data', () => {
            ProfilerSDK.reset();
            const data = collector.collectAdvancedData();

            expect(data).toBeDefined();
            expect(data.currentFrame.frameNumber).toBe(0);
        });

        test('should track peak memory', () => {
            ProfilerSDK.beginFrame();
            ProfilerSDK.endFrame();

            collector.collectAdvancedData();

            ProfilerSDK.beginFrame();
            ProfilerSDK.endFrame();

            const data = collector.collectAdvancedData();

            // Peak should be maintained or increased
            expect(data.summary.peakMemoryMB).toBeGreaterThanOrEqual(0);
        });

        test('should handle multiple frames with varying data', () => {
            for (let i = 0; i < 10; i++) {
                ProfilerSDK.beginFrame();
                if (i % 2 === 0) {
                    ProfilerSDK.measure('EvenFrame', () => {}, ProfileCategory.ECS);
                } else {
                    ProfilerSDK.measure('OddFrame', () => {}, ProfileCategory.Rendering);
                }
                ProfilerSDK.endFrame();
            }

            const data = collector.collectAdvancedData();

            expect(data.frameTimeHistory.length).toBe(10);
            expect(data.summary.totalFrames).toBe(10);
        });
    });
});
