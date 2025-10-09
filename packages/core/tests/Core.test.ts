import { Core } from '../src/Core';
import { Scene } from '../src/ECS/Scene';
import { SceneManager } from '../src/ECS/SceneManager';
import { Entity } from '../src/ECS/Entity';
import { Component } from '../src/ECS/Component';
import { GlobalManager } from '../src/Utils/GlobalManager';
import { ITimer } from '../src/Utils/Timers/ITimer';

// 测试组件
class TestComponent extends Component {
    public value: number;
    
    constructor(...args: unknown[]) {
        super();
        const [value = 0] = args as [number?];
        this.value = value;
    }
}

// 测试场景
class TestScene extends Scene {
    public initializeCalled = false;
    public beginCalled = false;
    public endCalled = false;
    public updateCallCount = 0;

    public override initialize(): void {
        this.initializeCalled = true;
    }

    public override begin(): void {
        this.beginCalled = true;
    }

    public override end(): void {
        this.endCalled = true;
    }

    public override update(): void {
        this.updateCallCount++;
    }
}

// 测试全局管理器
class TestGlobalManager extends GlobalManager {
    public updateCallCount = 0;
    public override _enabled = false;
    
    public override get enabled(): boolean {
        return this._enabled;
    }
    
    public override set enabled(value: boolean) {
        this._enabled = value;
    }

    public override update(): void {
        this.updateCallCount++;
    }
}

describe('Core - 核心管理系统测试', () => {
    let originalConsoleWarn: typeof console.warn;

    beforeEach(() => {
        // 清除之前的实例
        (Core as any)._instance = null;

        // 注意：WorldManager不再是单例，无需reset

        // 模拟console.warn以避免测试输出
        originalConsoleWarn = console.warn;
        console.warn = jest.fn();
    });

    afterEach(() => {
        // 恢复console.warn
        console.warn = originalConsoleWarn;

        // 清理Core实例
        if (Core.Instance) {
            Core.destroy();
        }
    });

    describe('实例创建和管理', () => {
        test('应该能够创建Core实例', () => {
            const core = Core.create(true);
            
            expect(core).toBeDefined();
            expect(core).toBeInstanceOf(Core);
            expect(core.debug).toBe(true);
            expect(Core.entitySystemsEnabled).toBe(true);
        });

        test('应该能够通过配置对象创建Core实例', () => {
            const config = {
                debug: false,
                enableEntitySystems: false
            };
            
            const core = Core.create(config);
            
            expect(core.debug).toBe(false);
            expect(Core.entitySystemsEnabled).toBe(false);
        });

        test('重复调用create应该返回同一个实例', () => {
            const core1 = Core.create(true);
            const core2 = Core.create(false); // 不同参数
            
            expect(core1).toBe(core2);
        });

        test('应该能够获取Core实例', () => {
            const core = Core.create(true);
            const instance = Core.Instance;
            
            expect(instance).toBe(core);
        });

        test('在未创建实例时调用update应该显示警告', () => {
            Core.update(0.016);
            
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Core实例未创建，请先调用Core.create()"));
        });
    });

    // 注意：场景管理功能已移至SceneManager
    // 相关测试请查看 SceneManager.test.ts

    describe('更新循环 - 全局服务', () => {
        let core: Core;
        let globalManager: TestGlobalManager;

        beforeEach(() => {
            core = Core.create(true);
            globalManager = new TestGlobalManager();
            Core.registerGlobalManager(globalManager);
        });

        test('应该能够更新全局管理器', () => {
            Core.update(0.016);
            expect(globalManager.updateCallCount).toBe(1);
        });

        test('暂停状态下不应该执行更新', () => {
            Core.paused = true;
            Core.update(0.016);
            expect(globalManager.updateCallCount).toBe(0);

            // 恢复状态
            Core.paused = false;
        });

        test('禁用的全局管理器不应该被更新', () => {
            globalManager.enabled = false;
            Core.update(0.016);
            expect(globalManager.updateCallCount).toBe(0);
        });

        test('多次更新应该累积调用', () => {
            Core.update(0.016);
            Core.update(0.016);
            Core.update(0.016);
            expect(globalManager.updateCallCount).toBe(3);
        });
    });

    describe('全局管理器管理', () => {
        let core: Core;
        let manager1: TestGlobalManager;
        let manager2: TestGlobalManager;

        beforeEach(() => {
            core = Core.create(true);
            manager1 = new TestGlobalManager();
            manager2 = new TestGlobalManager();
        });

        test('应该能够注册全局管理器', () => {
            Core.registerGlobalManager(manager1);
            
            expect(manager1.enabled).toBe(true);
            
            // 测试更新是否被调用
            Core.update(0.016);
            expect(manager1.updateCallCount).toBe(1);
        });

        test('应该能够注销全局管理器', () => {
            Core.registerGlobalManager(manager1);
            Core.unregisterGlobalManager(manager1);
            
            expect(manager1.enabled).toBe(false);
            
            // 测试更新不应该被调用
            Core.update(0.016);
            expect(manager1.updateCallCount).toBe(0);
        });

        test('应该能够获取指定类型的全局管理器', () => {
            Core.registerGlobalManager(manager1);
            
            const retrieved = Core.getGlobalManager(TestGlobalManager);
            expect(retrieved).toBe(manager1);
        });

        test('获取不存在的管理器应该返回null', () => {
            const retrieved = Core.getGlobalManager(TestGlobalManager);
            expect(retrieved).toBeNull();
        });

        test('应该能够管理多个全局管理器', () => {
            Core.registerGlobalManager(manager1);
            Core.registerGlobalManager(manager2);
            
            Core.update(0.016);
            
            expect(manager1.updateCallCount).toBe(1);
            expect(manager2.updateCallCount).toBe(1);
        });
    });

    describe('定时器系统', () => {
        let core: Core;

        beforeEach(() => {
            core = Core.create(true);
        });

        test('应该能够调度定时器', () => {
            let callbackExecuted = false;
            let timerInstance: ITimer | null = null;
            
            const timer = Core.schedule(0.1, false, null, (timer) => {
                callbackExecuted = true;
                timerInstance = timer;
            });
            
            expect(timer).toBeDefined();
            
            // 模拟时间推进
            for (let i = 0; i < 10; i++) {
                Core.update(0.016); // 约160ms总计
            }
            
            expect(callbackExecuted).toBe(true);
            expect(timerInstance).toBe(timer);
        });

        test('应该能够调度重复定时器', () => {
            let callbackCount = 0;
            
            Core.schedule(0.05, true, null, () => {
                callbackCount++;
            });
            
            // 模拟足够长的时间以触发多次回调
            for (let i = 0; i < 15; i++) {
                Core.update(0.016); // 约240ms总计，应该触发4-5次
            }
            
            expect(callbackCount).toBeGreaterThan(1);
        });

        test('应该支持带上下文的定时器', () => {
            const context = { value: 42 };
            let receivedContext: any = null;
            
            Core.schedule(0.05, false, context, function(this: any, timer) {
                receivedContext = this;
            });
            
            // 模拟时间推进
            for (let i = 0; i < 5; i++) {
                Core.update(0.016);
            }
            
            expect(receivedContext).toBe(context);
        });
    });

    describe('调试功能', () => {
        test('应该能够启用调试功能', () => {
            const core = Core.create(true);
            const debugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:8080',
                autoReconnect: true,
                updateInterval: 1000,
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
        });

        test('应该能够禁用调试功能', () => {
            const core = Core.create(true);
            const debugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:8080',
                autoReconnect: true,
                updateInterval: 1000,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };
            
            Core.enableDebug(debugConfig);
            Core.disableDebug();
            
            expect(Core.isDebugEnabled).toBe(false);
        });

        test('在未创建实例时启用调试应该显示警告', () => {
            const debugConfig = {
                enabled: true,
                websocketUrl: 'ws://localhost:8080',
                autoReconnect: true,
                updateInterval: 1000,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };
            
            Core.enableDebug(debugConfig);
            
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Core实例未创建，请先调用Core.create()"));
        });
    });

    // ECS API 现在由 SceneManager 管理
    // 相关测试请查看 SceneManager.test.ts

    describe('性能监控集成', () => {
        let core: Core;

        beforeEach(() => {
            core = Core.create(true);
        });

        test('调试模式下应该启用性能监控', () => {
            const performanceMonitor = (core as any)._performanceMonitor;

            expect(performanceMonitor).toBeDefined();
            // 性能监控器应该在调试模式下被启用
            expect(performanceMonitor.isEnabled).toBe(true);
        });

        test('更新循环应该包含性能监控', () => {
            const performanceMonitor = (core as any)._performanceMonitor;
            const startMonitoringSpy = jest.spyOn(performanceMonitor, 'startMonitoring');
            const endMonitoringSpy = jest.spyOn(performanceMonitor, 'endMonitoring');

            Core.update(0.016);

            expect(startMonitoringSpy).toHaveBeenCalled();
            expect(endMonitoringSpy).toHaveBeenCalled();
        });
    });
});