import { Core } from '../src/Core';
import { Scene } from '../src/ECS/Scene';
import { DebugManager } from '../src/Utils/Debug/DebugManager';
import { DebugConfigService } from '../src/Utils/Debug/DebugConfigService';
import { AdvancedProfilerCollector } from '../src/Utils/Debug/AdvancedProfilerCollector';
import { ProfilerSDK } from '../src/Utils/Profiler/ProfilerSDK';
import { ProfileCategory } from '../src/Utils/Profiler/ProfilerTypes';
import { IECSDebugConfig } from '../src/Types';
import { createLogger } from '../src/Utils/Logger';

const logger = createLogger('DebugManagerTest');

class TestScene extends Scene {
    public initializeCalled = false;

    public override initialize(): void {
        this.initializeCalled = true;
    }

    public override begin(): void {
    }

    public override end(): void {
    }
}

describe('DebugManager DI Architecture Tests', () => {
    let originalConsoleWarn: typeof console.warn;
    let originalConsoleError: typeof console.error;

    beforeEach(() => {
        (Core as any)._instance = null;
        originalConsoleWarn = console.warn;
        originalConsoleError = console.error;
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
        if (Core.Instance) {
            Core.destroy();
        }
    });

    describe('DebugConfigService - Configuration Service', () => {
        test('should create with default configuration', () => {
            const configService = new DebugConfigService();
            const config = configService.getConfig();

            expect(config).toBeDefined();
            expect(config.enabled).toBe(false);
            expect(config.websocketUrl).toBe('');
            expect(config.debugFrameRate).toBe(30);
            expect(config.autoReconnect).toBe(true);
            expect(config.channels).toBeDefined();
        });

        test('should set and get configuration', () => {
            const configService = new DebugConfigService();
            const newConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 60,
                autoReconnect: false,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            configService.setConfig(newConfig);
            const retrievedConfig = configService.getConfig();

            expect(retrievedConfig).toEqual(newConfig);
            expect(retrievedConfig.enabled).toBe(true);
            expect(retrievedConfig.websocketUrl).toBe('ws://localhost:9229');
            expect(retrievedConfig.debugFrameRate).toBe(60);
        });

        test('should return correct enabled status', () => {
            const configService = new DebugConfigService();
            expect(configService.isEnabled()).toBe(false);

            configService.setConfig({
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            });

            expect(configService.isEnabled()).toBe(true);
        });

        test('should implement dispose method', () => {
            const configService = new DebugConfigService();
            expect(() => configService.dispose()).not.toThrow();
        });
    });

    describe('DebugManager - DI Initialization', () => {
        test('should initialize DebugManager through DI when debug config is enabled', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            const core = Core.create({
                debug: true,
                debugConfig: debugConfig
            });

            expect((core as any)._debugManager).toBeDefined();
            expect((core as any)._debugManager).toBeInstanceOf(DebugManager);
        });

        test('should not create DebugManager when debug config is disabled', () => {
            const core = Core.create({
                debug: true,
                debugConfig: {
                    enabled: false,
                    websocketUrl: '',
                    debugFrameRate: 30,
                    autoReconnect: true,
                    channels: {
                        entities: true,
                        systems: true,
                        performance: true,
                        components: true,
                        scenes: true
                    }
                }
            });

            expect((core as any)._debugManager).toBeUndefined();
        });

        test('should not create DebugManager when no debug config provided', () => {
            const core = Core.create({ debug: true });
            expect((core as any)._debugManager).toBeUndefined();
        });

        test('should register DebugConfigService in ServiceContainer', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.create({
                debug: true,
                debugConfig: debugConfig
            });

            const configService = Core.services.resolve(DebugConfigService);
            expect(configService).toBeDefined();
            expect(configService).toBeInstanceOf(DebugConfigService);
        });

        test('should inject all dependencies correctly', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            const core = Core.create({
                debug: true,
                debugConfig: debugConfig
            });

            const debugManager = (core as any)._debugManager as DebugManager;
            expect(debugManager).toBeDefined();

            const sceneManager = (debugManager as any).sceneManager;
            const performanceMonitor = (debugManager as any).performanceMonitor;
            const config = (debugManager as any).config;

            expect(sceneManager).toBeDefined();
            expect(performanceMonitor).toBeDefined();
            expect(config).toBeDefined();
            expect(config.enabled).toBe(true);
            expect(config.websocketUrl).toBe('ws://localhost:9229');
        });
    });

    describe('Core.enableDebug - Runtime Activation', () => {
        test('should enable debug at runtime', () => {
            const core = Core.create({ debug: true });
            expect(Core.isDebugEnabled).toBe(false);

            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.enableDebug(debugConfig);

            expect(Core.isDebugEnabled).toBe(true);
            expect((core as any)._debugManager).toBeDefined();
        });

        test('should create DebugConfigService when enabling debug at runtime', () => {
            Core.create({ debug: true });

            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.enableDebug(debugConfig);

            const configService = Core.services.resolve(DebugConfigService);
            expect(configService).toBeDefined();
            expect(configService.getConfig()).toEqual(debugConfig);
        });

        test('should update existing DebugManager config when already enabled', () => {
            const initialConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.create({ debug: true, debugConfig: initialConfig });

            const updatedConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:8080',
                debugFrameRate: 60,
                autoReconnect: false,
                channels: {
                    entities: false,
                    systems: true,
                    performance: true,
                    components: false,
                    scenes: true
                }
            };

            Core.enableDebug(updatedConfig);

            expect(Core.isDebugEnabled).toBe(true);
            const debugManager = (Core.Instance as any)._debugManager;
            expect(debugManager).toBeDefined();
        });

        test('should show warning when enabling debug without Core instance', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.enableDebug(debugConfig);

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('Core实例未创建，请先调用Core.create()')
            );
        });
    });

    describe('Core.disableDebug', () => {
        test('should disable debug functionality', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.create({ debug: true, debugConfig: debugConfig });
            expect(Core.isDebugEnabled).toBe(true);

            Core.disableDebug();

            expect(Core.isDebugEnabled).toBe(false);
            expect((Core.Instance as any)._debugManager).toBeUndefined();
        });

        test('should handle disabling when Core instance does not exist', () => {
            expect(() => Core.disableDebug()).not.toThrow();
        });

        test('should handle disabling when debug was never enabled', () => {
            Core.create({ debug: true });
            expect(() => Core.disableDebug()).not.toThrow();
        });
    });

    describe('DebugManager - Auto Update Integration', () => {
        test('should be registered as updatable service', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.create({ debug: true, debugConfig: debugConfig });

            const serviceContainer = (Core.Instance as any)._serviceContainer;
            const updatableCount = serviceContainer.getUpdatableCount();

            expect(updatableCount).toBeGreaterThan(0);
        });

        test('should be updated during Core.update cycle', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            const core = Core.create({ debug: true, debugConfig: debugConfig });
            const debugManager = (core as any)._debugManager as DebugManager;
            const updateSpy = jest.spyOn(debugManager, 'update');

            Core.update(0.016);

            expect(updateSpy).toHaveBeenCalledWith(0.016);
        });
    });

    describe('DebugManager - Scene Integration', () => {
        test('should respond to scene changes', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            const core = Core.create({ debug: true, debugConfig: debugConfig });
            const debugManager = (core as any)._debugManager as DebugManager;
            const sceneChangeSpy = jest.spyOn(debugManager, 'onSceneChanged');

            const testScene = new TestScene();
            Core.setScene(testScene);

            expect(sceneChangeSpy).toHaveBeenCalled();
        });

        test('should collect debug data from current scene', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.create({ debug: true, debugConfig: debugConfig });
            const testScene = new TestScene();
            Core.setScene(testScene);

            const debugData = Core.getDebugData();

            expect(debugData).toBeDefined();
            expect(debugData).toHaveProperty('timestamp');
            expect(debugData).toHaveProperty('frameworkVersion');
            expect(debugData).toHaveProperty('currentScene');
        });
    });

    describe('DebugManager - Configuration Management', () => {
        test('should use correct debug frame rate', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 60,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            const core = Core.create({ debug: true, debugConfig: debugConfig });
            const debugManager = (core as any)._debugManager as DebugManager;
            const sendInterval = (debugManager as any).sendInterval;

            expect(sendInterval).toBe(1000 / 60);
        });

        test('should handle channel configuration correctly', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: false,
                    performance: false,
                    components: true,
                    scenes: false
                }
            };

            Core.create({ debug: true, debugConfig: debugConfig });
            const testScene = new TestScene();
            Core.setScene(testScene);

            const debugData = Core.getDebugData() as any;

            expect(debugData.entities).toBeDefined();
            expect(debugData.components).toBeDefined();
            expect(debugData.systems).toBeUndefined();
            expect(debugData.performance).toBeUndefined();
            expect(debugData.scenes).toBeUndefined();
        });
    });

    describe('DebugManager - Lifecycle', () => {
        test('should start automatically on creation', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            const core = Core.create({ debug: true, debugConfig: debugConfig });
            const debugManager = (core as any)._debugManager as DebugManager;
            const isRunning = (debugManager as any).isRunning;

            expect(isRunning).toBe(true);
        });

        test('should stop when disabling debug', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.create({ debug: true, debugConfig: debugConfig });
            const debugManager = (Core.Instance as any)._debugManager as DebugManager;
            const stopSpy = jest.spyOn(debugManager, 'stop');

            Core.disableDebug();

            expect(stopSpy).toHaveBeenCalled();
        });

        test('should dispose properly on Core.destroy', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.create({ debug: true, debugConfig: debugConfig });
            const debugManager = (Core.Instance as any)._debugManager as DebugManager;
            const stopSpy = jest.spyOn(debugManager, 'stop');

            Core.destroy();

            expect(stopSpy).toHaveBeenCalled();
        });
    });

    describe('DebugManager - Pure DI Architecture Validation', () => {
        test('should resolve all dependencies through ServiceContainer', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.create({ debug: true, debugConfig: debugConfig });

            const debugConfigService = Core.services.resolve(DebugConfigService);
            expect(debugConfigService).toBeDefined();

            const config = debugConfigService.getConfig();
            expect(config).toEqual(debugConfig);
        });

        test('should not have mixed DI patterns', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            const core = Core.create({ debug: true, debugConfig: debugConfig });
            const debugManager = (core as any)._debugManager as DebugManager;

            const sceneManager = (debugManager as any).sceneManager;
            const performanceMonitor = (debugManager as any).performanceMonitor;
            const config = (debugManager as any).config;

            expect(sceneManager).toBeDefined();
            expect(performanceMonitor).toBeDefined();
            expect(config).toBeDefined();
            expect(config.enabled).toBe(true);
        });

        test('should use factory pattern for registration', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.create({ debug: true, debugConfig: debugConfig });

            const debugManager1 = (Core.Instance as any)._debugManager;
            const debugManager2 = Core.services.resolve(DebugManager);

            expect(debugManager1).toBe(debugManager2);
        });
    });

    describe('DebugManager - Advanced Profiler Integration', () => {
        beforeEach(() => {
            ProfilerSDK.reset();
        });

        afterEach(() => {
            ProfilerSDK.reset();
        });

        test('should initialize AdvancedProfilerCollector', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            const core = Core.create({ debug: true, debugConfig: debugConfig });
            const debugManager = (core as any)._debugManager as DebugManager;
            const advancedProfilerCollector = (debugManager as any).advancedProfilerCollector;

            expect(advancedProfilerCollector).toBeDefined();
            expect(advancedProfilerCollector).toBeInstanceOf(AdvancedProfilerCollector);
        });

        test('should enable ProfilerSDK when debug manager initializes', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            Core.create({ debug: true, debugConfig: debugConfig });

            expect(ProfilerSDK.isEnabled()).toBe(true);
        });

        test('should collect advanced profiler data', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            const core = Core.create({ debug: true, debugConfig: debugConfig });
            const debugManager = (core as any)._debugManager as DebugManager;
            const advancedProfilerCollector = (debugManager as any).advancedProfilerCollector as AdvancedProfilerCollector;

            // Generate some profiler data
            ProfilerSDK.beginFrame();
            ProfilerSDK.measure('TestSystem', () => {
                let sum = 0;
                for (let i = 0; i < 100; i++) sum += i;
            }, ProfileCategory.ECS);
            ProfilerSDK.endFrame();

            const data = advancedProfilerCollector.collectAdvancedData();

            expect(data).toBeDefined();
            expect(data.currentFrame).toBeDefined();
            expect(data.categoryStats).toBeDefined();
            expect(data.hotspots).toBeDefined();
            expect(data.summary).toBeDefined();
        });

        test('should set selected function for call graph', () => {
            const debugConfig: IECSDebugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:9229',
                debugFrameRate: 30,
                autoReconnect: true,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };

            const core = Core.create({ debug: true, debugConfig: debugConfig });
            const debugManager = (core as any)._debugManager as DebugManager;
            const advancedProfilerCollector = (debugManager as any).advancedProfilerCollector as AdvancedProfilerCollector;

            advancedProfilerCollector.setSelectedFunction('TestFunction');

            ProfilerSDK.beginFrame();
            ProfilerSDK.measure('TestFunction', () => {}, ProfileCategory.Script);
            ProfilerSDK.endFrame();

            const data = advancedProfilerCollector.collectAdvancedData();

            expect(data.callGraph.currentFunction).toBe('TestFunction');
        });

        test('should handle legacy monitor data when profiler disabled', () => {
            ProfilerSDK.setEnabled(false);

            const collector = new AdvancedProfilerCollector();

            const mockMonitor = {
                getAllSystemStats: () => new Map([
                    ['System1', { averageTime: 5, executionCount: 10 }]
                ]),
                getAllSystemData: () => new Map([
                    ['System1', { executionTime: 5, entityCount: 100 }]
                ])
            };

            const data = collector.collectFromLegacyMonitor(mockMonitor);

            expect(data).toBeDefined();
            expect(data.categoryStats.length).toBeGreaterThan(0);
            expect(data.hotspots.length).toBeGreaterThan(0);
        });
    });
});
