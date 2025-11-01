import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { Scene } from '../../../src/ECS/Scene';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { GlobalEventBus } from '../../../src/ECS/Core/EventBus';
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


// 具体的实体系统实现
class ConcreteEntitySystem extends EntitySystem {
    public processCallCount = 0;
    public eventHandlerCallCount = 0;

    constructor() {
        super(Matcher.all(TestComponent));
    }

    protected override process(entities: readonly Entity[]): void {
        this.processCallCount++;
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
        const listenerRef = this.addEventListener('manual_event', handler);
        if (listenerRef) {
            this.removeEventListener('manual_event', listenerRef);
        }
    }

    // 公开测试方法
    public testAddEventListener(eventType: string, handler: (event: any) => void): string | null {
        return this.addEventListener(eventType, handler);
    }

    public testRemoveEventListener(eventType: string, listenerRef: string): void {
        this.removeEventListener(eventType, listenerRef);
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
        entity = scene.createEntity('test_entity');
        entity.addComponent(new TestComponent(10));

        scene.addEntity(entity);
        scene.addSystem(system);
    });

    afterEach(() => {
        // 清理场景
        scene.removeSystem(system);
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
            const listenerRef = system.testAddEventListener('manual_remove_event', handler);

            // 发射事件验证监听器工作
            scene.eventSystem.emitSync('manual_remove_event', {});
            expect(handler).toHaveBeenCalledTimes(1);

            // 移除监听器
            if (listenerRef) {
                system.testRemoveEventListener('manual_remove_event', listenerRef);
            }

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

            // 验证手动监听器工作
            scene.eventSystem.emitSync('destroy_order_test', {});
            expect(handler).toHaveBeenCalledTimes(1);

            // 直接调用框架的销毁方法
            system.destroy();

            // 重置计数器并验证监听器被清理
            handler.mockClear();

            scene.eventSystem.emitSync('destroy_order_test', {});

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
            const nonExistentListenerRef = 'non_existent_listener_ref';

            // 应该不会抛出错误
            expect(() => {
                system.testRemoveEventListener('non_existent_event', nonExistentListenerRef);
            }).not.toThrow();
        });
    });

    describe('日志器命名', () => {
        it('应该使用类名作为日志器名称', () => {
            const loggerName = (system as any).getLoggerName();
            expect(loggerName).toBe('ConcreteEntitySystem');
        });
    });

});