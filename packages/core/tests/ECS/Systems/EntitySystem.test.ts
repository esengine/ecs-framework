import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { Scene } from '../../../src/ECS/Scene';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { EventHandler, AsyncEventHandler, GlobalEventBus } from '../../../src/ECS/Core/EventBus';
import { TypeSafeEventSystem } from '../../../src/ECS/Core/EventSystem';

// 测试组件
class TestComponent extends Component {
    public value: number = 0;

    constructor(...args: unknown[]) {
        super();
        const [value = 0] = args as [number?];
        this.value = value;
    }
}

// 测试事件
interface TestEvent {
    id: number;
    message: string;
}

interface AsyncTestEvent {
    data: string;
    timestamp: number;
}

// 具体的实体系统实现
class ConcreteEntitySystem extends EntitySystem {
    public processCallCount = 0;
    public eventHandlerCallCount = 0;
    public asyncEventHandlerCallCount = 0;
    public lastEvent: TestEvent | null = null;
    public lastAsyncEvent: AsyncTestEvent | null = null;

    constructor() {
        super(Matcher.all(TestComponent));
    }

    protected override process(entities: readonly Entity[]): void {
        this.processCallCount++;
    }

    @EventHandler('test_event')
    onTestEvent(event: TestEvent): void {
        this.eventHandlerCallCount++;
        this.lastEvent = event;
    }

    @AsyncEventHandler('async_test_event')
    async onAsyncTestEvent(event: AsyncTestEvent): Promise<void> {
        this.asyncEventHandlerCallCount++;
        this.lastAsyncEvent = event;
        // 模拟异步操作
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    // 测试用的手动事件监听器
    public addManualEventListener(): void {
        this.addEventListener('manual_event', (event: any) => {
            this.eventHandlerCallCount++;
        });
    }

    // 测试用的移除事件监听器
    public removeManualEventListener(): void {
        const handler = (event: any) => {
            this.eventHandlerCallCount++;
        };
        this.addEventListener('manual_event', handler);
        this.removeEventListener('manual_event', handler);
    }

    // 公开测试方法
    public testAddEventListener(eventType: string, handler: (event: any) => void): void {
        this.addEventListener(eventType, handler);
    }

    public testRemoveEventListener(eventType: string, handler: (event: any) => void): void {
        this.removeEventListener(eventType, handler);
    }
}

// 没有装饰器的系统（用于对比测试）
class PlainEntitySystem extends EntitySystem {
    public processCallCount = 0;
    public onDestroyCallCount = 0;

    constructor() {
        super(Matcher.all(TestComponent));
    }

    protected override process(entities: readonly Entity[]): void {
        this.processCallCount++;
    }

    protected override onDestroy(): void {
        this.onDestroyCallCount++;
    }
}

describe('EntitySystem', () => {
    let scene: Scene;
    let system: ConcreteEntitySystem;
    let entity: Entity;

    beforeEach(() => {
        scene = new Scene();
        system = new ConcreteEntitySystem();
        entity = new Entity('test_entity', 1);
        entity.addComponent(new TestComponent(10));

        scene.addEntity(entity);
        scene.addSystem(system);
    });

    afterEach(() => {
        // 清理场景
        scene.removeSystem(system);
    });

    describe('装饰器事件处理', () => {
        it('应该自动注册 @EventHandler 装饰器标记的方法', () => {
            const testEvent: TestEvent = { id: 1, message: 'test' };

            // 发射事件（使用全局事件总线，因为装饰器注册在那里）
            GlobalEventBus.getInstance().emit('test_event', testEvent);

            // 验证事件处理器被调用
            expect(system.eventHandlerCallCount).toBe(1);
            expect(system.lastEvent).toEqual(testEvent);
        });

        it('应该自动注册 @AsyncEventHandler 装饰器标记的方法', async () => {
            const asyncEvent: AsyncTestEvent = {
                data: 'async test',
                timestamp: Date.now()
            };

            // 发射异步事件（使用全局事件总线）
            await GlobalEventBus.getInstance().emitAsync('async_test_event', asyncEvent);

            // 等待异步处理完成
            await new Promise(resolve => setTimeout(resolve, 20));

            // 验证异步事件处理器被调用
            expect(system.asyncEventHandlerCallCount).toBe(1);
            expect(system.lastAsyncEvent).toEqual(asyncEvent);
        });

        it('当系统被销毁时，应该自动清理装饰器事件监听器', () => {
            const testEvent: TestEvent = { id: 2, message: 'test after destroy' };

            // 验证事件监听器工作正常
            GlobalEventBus.getInstance().emit('test_event', testEvent);
            expect(system.eventHandlerCallCount).toBe(1);

            // 销毁系统
            scene.removeSystem(system);

            // 重置计数器并再次发射事件
            system.eventHandlerCallCount = 0;
            GlobalEventBus.getInstance().emit('test_event', testEvent);

            // 验证事件监听器已被清理，不再响应事件
            expect(system.eventHandlerCallCount).toBe(0);
        });
    });

    describe('手动事件监听器管理', () => {
        it('应该能够手动添加事件监听器', () => {
            system.addManualEventListener();

            // 发射手动事件
            scene.eventSystem.emitSync('manual_event', { test: true });

            // 验证手动事件监听器被调用
            expect(system.eventHandlerCallCount).toBe(1);
        });

        it('应该能够手动移除事件监听器', () => {
            const handler = jest.fn();

            // 添加监听器
            system.testAddEventListener('manual_remove_event', handler);

            // 发射事件验证监听器工作
            scene.eventSystem.emitSync('manual_remove_event', {});
            expect(handler).toHaveBeenCalledTimes(1);

            // 移除监听器
            system.testRemoveEventListener('manual_remove_event', handler);

            // 再次发射事件
            scene.eventSystem.emitSync('manual_remove_event', {});

            // 验证监听器已被移除
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('当系统被销毁时，应该清理手动添加的事件监听器', () => {
            const handler = jest.fn();

            // 添加手动监听器
            system.testAddEventListener('destroy_test_event', handler);

            // 验证监听器工作
            scene.eventSystem.emitSync('destroy_test_event', {});
            expect(handler).toHaveBeenCalledTimes(1);

            // 销毁系统
            scene.removeSystem(system);

            // 再次发射事件
            scene.eventSystem.emitSync('destroy_test_event', {});

            // 验证监听器已被清理
            expect(handler).toHaveBeenCalledTimes(1);
        });
    });

    describe('生命周期管理', () => {
        it('应该按正确的顺序执行销毁流程', () => {
            const plainSystem = new PlainEntitySystem();
            scene.addSystem(plainSystem);

            // 销毁系统
            scene.removeSystem(plainSystem);

            // 验证用户的 onDestroy 被调用
            expect(plainSystem.onDestroyCallCount).toBe(1);
        });

        it('框架的 destroy 方法应该清理所有资源并调用用户回调', () => {
            const testEvent: TestEvent = { id: 3, message: 'destroy test' };
            const handler = jest.fn();

            // 添加手动监听器
            system.testAddEventListener('destroy_order_test', handler);

            // 验证装饰器和手动监听器都工作
            GlobalEventBus.getInstance().emit('test_event', testEvent);
            scene.eventSystem.emitSync('destroy_order_test', {});
            expect(system.eventHandlerCallCount).toBe(1);
            expect(handler).toHaveBeenCalledTimes(1);

            // 直接调用框架的销毁方法
            system.destroy();

            // 重置计数器并验证所有监听器都被清理
            system.eventHandlerCallCount = 0;
            handler.mockClear();

            GlobalEventBus.getInstance().emit('test_event', testEvent);
            scene.eventSystem.emitSync('destroy_order_test', {});

            expect(system.eventHandlerCallCount).toBe(0);
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('错误处理', () => {
        it('当事件系统不可用时，应该安全地处理监听器注册', () => {
            // 创建没有事件系统的场景
            const sceneWithoutEvents = new Scene();
            (sceneWithoutEvents as any).eventSystem = null;

            const systemWithoutEvents = new ConcreteEntitySystem();

            // 应该不会抛出错误
            expect(() => {
                sceneWithoutEvents.addSystem(systemWithoutEvents);
            }).not.toThrow();
        });

        it('当移除不存在的监听器时，应该安全处理', () => {
            const nonExistentHandler = () => {};

            // 应该不会抛出错误
            expect(() => {
                system.testRemoveEventListener('non_existent_event', nonExistentHandler);
            }).not.toThrow();
        });
    });

    describe('多个事件监听器', () => {
        it('应该支持同一个系统监听多个不同的事件', () => {
            const event1: TestEvent = { id: 1, message: 'first' };
            const event2: AsyncTestEvent = { data: 'second', timestamp: Date.now() };

            // 发射两个不同的事件
            GlobalEventBus.getInstance().emit('test_event', event1);
            GlobalEventBus.getInstance().emitAsync('async_test_event', event2);

            // 等待异步处理
            return new Promise<void>(resolve => {
                setTimeout(() => {
                    expect(system.eventHandlerCallCount).toBe(1);
                    expect(system.asyncEventHandlerCallCount).toBe(1);
                    expect(system.lastEvent).toEqual(event1);
                    expect(system.lastAsyncEvent).toEqual(event2);
                    resolve();
                }, 50);
            });
        });

        it('应该支持多个系统监听同一个事件', () => {
            const system2 = new ConcreteEntitySystem();
            scene.addSystem(system2);

            const testEvent: TestEvent = { id: 4, message: 'shared event' };

            // 发射事件
            GlobalEventBus.getInstance().emit('test_event', testEvent);

            // 验证两个系统都接收到了事件
            expect(system.eventHandlerCallCount).toBe(1);
            expect(system2.eventHandlerCallCount).toBe(1);
            expect(system.lastEvent).toEqual(testEvent);
            expect(system2.lastEvent).toEqual(testEvent);
        });
    });
});