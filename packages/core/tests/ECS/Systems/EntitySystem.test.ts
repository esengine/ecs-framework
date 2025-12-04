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

        it('dispose 方法应该调用 onDestroy 回调', () => {
            const plainSystem = new PlainEntitySystem();
            scene.addSystem(plainSystem);

            // 直接调用 dispose
            plainSystem.dispose();

            // 验证 onDestroy 被调用
            expect(plainSystem.onDestroyCallCount).toBe(1);
        });

        it('多次调用 dispose 或 destroy 不应该重复调用 onDestroy', () => {
            const plainSystem = new PlainEntitySystem();
            scene.addSystem(plainSystem);

            // 调用 dispose
            plainSystem.dispose();
            expect(plainSystem.onDestroyCallCount).toBe(1);

            // 再次调用 dispose
            plainSystem.dispose();
            expect(plainSystem.onDestroyCallCount).toBe(1);

            // 调用 destroy
            plainSystem.destroy();
            expect(plainSystem.onDestroyCallCount).toBe(1);
        });

        it('先调用 destroy 再调用 dispose 不应该重复调用 onDestroy', () => {
            const plainSystem = new PlainEntitySystem();
            scene.addSystem(plainSystem);

            // 先调用 destroy
            plainSystem.destroy();
            expect(plainSystem.onDestroyCallCount).toBe(1);

            // 再调用 dispose
            plainSystem.dispose();
            expect(plainSystem.onDestroyCallCount).toBe(1);
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

    describe('nothing 匹配器与系统', () => {
        class NothingSystem extends EntitySystem {
            public onBeginCallCount = 0;
            public processCallCount = 0;
            public onEndCallCount = 0;

            constructor() {
                super(Matcher.nothing());
            }

            protected override onBegin(): void {
                this.onBeginCallCount++;
            }

            protected override process(entities: readonly Entity[]): void {
                this.processCallCount++;
                // nothing 匹配器不应该有任何实体
                expect(entities).toHaveLength(0);
            }

            protected override onEnd(): void {
                this.onEndCallCount++;
            }
        }

        it('使用 nothing 匹配器的系统应该正常运行生命周期方法', () => {
            const nothingSystem = new NothingSystem();
            scene.addSystem(nothingSystem);

            // 手动触发更新
            nothingSystem.update();
            nothingSystem.lateUpdate();

            // 生命周期方法应该被调用
            expect(nothingSystem.onBeginCallCount).toBe(1);
            expect(nothingSystem.processCallCount).toBe(1);
            expect(nothingSystem.onEndCallCount).toBe(1);

            // 清理
            scene.removeSystem(nothingSystem);
        });

        it('nothing 匹配器系统的 entities 应该为空', () => {
            const nothingSystem = new NothingSystem();
            scene.addSystem(nothingSystem);

            // 即使场景中有实体，entities 也应该为空
            expect(nothingSystem.entities).toHaveLength(0);

            scene.removeSystem(nothingSystem);
        });
    });

    describe('系统更新顺序', () => {
        it('setUpdateOrder 应该能够设置更新顺序', () => {
            const plainSystem = new PlainEntitySystem();
            scene.addSystem(plainSystem);

            expect(plainSystem.updateOrder).toBe(0);

            plainSystem.setUpdateOrder(10);
            expect(plainSystem.updateOrder).toBe(10);

            plainSystem.updateOrder = 20;
            expect(plainSystem.updateOrder).toBe(20);

            scene.removeSystem(plainSystem);
        });

        it('设置相同的 updateOrder 不应该触发重排序', () => {
            const plainSystem = new PlainEntitySystem();
            scene.addSystem(plainSystem);

            plainSystem.setUpdateOrder(10);
            // 设置相同的值不应该有问题
            plainSystem.setUpdateOrder(10);

            expect(plainSystem.updateOrder).toBe(10);

            scene.removeSystem(plainSystem);
        });
    });

    describe('系统启用/禁用', () => {
        it('禁用系统时不应该调用 process', () => {
            const plainSystem = new PlainEntitySystem();
            scene.addSystem(plainSystem);

            plainSystem.enabled = false;
            plainSystem.update();

            expect(plainSystem.processCallCount).toBe(0);

            scene.removeSystem(plainSystem);
        });

        it('重新启用系统后应该正常调用 process', () => {
            const plainSystem = new PlainEntitySystem();
            scene.addSystem(plainSystem);

            plainSystem.enabled = false;
            plainSystem.update();
            expect(plainSystem.processCallCount).toBe(0);

            plainSystem.enabled = true;
            plainSystem.update();
            expect(plainSystem.processCallCount).toBe(1);

            scene.removeSystem(plainSystem);
        });
    });

    describe('实体跟踪回调', () => {
        class TrackingSystem extends EntitySystem {
            public addedEntities: Entity[] = [];
            public removedEntities: Entity[] = [];

            constructor() {
                super(Matcher.all(TestComponent));
            }

            protected override process(entities: readonly Entity[]): void {
                // 处理实体
            }

            protected override onAdded(entity: Entity): void {
                this.addedEntities.push(entity);
            }

            protected override onRemoved(entity: Entity): void {
                this.removedEntities.push(entity);
            }
        }

        it('当实体添加组件后应该触发 onAdded', () => {
            const trackingSystem = new TrackingSystem();
            scene.addSystem(trackingSystem);

            // 创建新实体并添加组件
            const newEntity = scene.createEntity('new_entity');
            newEntity.addComponent(new TestComponent(5));
            scene.addEntity(newEntity);

            // 触发更新以检测变化
            trackingSystem.update();

            // 应该检测到新实体
            expect(trackingSystem.addedEntities.length).toBeGreaterThan(0);

            scene.removeSystem(trackingSystem);
        });

        it('当实体移除组件后应该触发 onRemoved', () => {
            const trackingSystem = new TrackingSystem();
            scene.addSystem(trackingSystem);

            // 先触发更新来跟踪现有实体
            trackingSystem.update();

            // 移除组件
            const comp = entity.getComponent(TestComponent);
            if (comp) {
                entity.removeComponent(comp);
            }

            // 再次更新
            trackingSystem.update();

            // 应该检测到实体被移除
            expect(trackingSystem.removedEntities.length).toBeGreaterThan(0);

            scene.removeSystem(trackingSystem);
        });

        it('在系统 process 中添加组件时应立即触发其他系统的 onAdded', () => {
            // 使用独立的场景，避免 beforeEach 创建的实体干扰
            // Use independent scene to avoid interference from beforeEach entities
            const testScene = new Scene();

            // 组件定义
            class TagComponent extends TestComponent {}

            // SystemA: 匹配 TestComponent + TagComponent
            class SystemA extends EntitySystem {
                public onAddedEntities: Entity[] = [];

                constructor() {
                    super(Matcher.all(TestComponent, TagComponent));
                }

                protected override onAdded(entity: Entity): void {
                    this.onAddedEntities.push(entity);
                }
            }

            // TriggerSystem: 在 process 中添加 TagComponent
            class TriggerSystem extends EntitySystem {
                constructor() {
                    super(Matcher.all(TestComponent));
                }

                protected override process(entities: readonly Entity[]): void {
                    for (const entity of entities) {
                        if (!entity.hasComponent(TagComponent)) {
                            entity.addComponent(new TagComponent());
                        }
                    }
                }
            }

            const systemA = new SystemA();
            const triggerSystem = new TriggerSystem();

            // 注意：SystemA 先注册，TriggerSystem 后注册
            // 事件驱动设计确保即使 SystemA 已执行完毕，也能收到 onAdded 通知
            testScene.addSystem(systemA);
            testScene.addSystem(triggerSystem);

            // 创建实体（已有 TestComponent）
            const testEntity = testScene.createEntity('test');
            testEntity.addComponent(new TestComponent());

            // 执行一帧：TriggerSystem 会添加 TagComponent，SystemA 应立即收到 onAdded
            testScene.update();

            expect(systemA.onAddedEntities.length).toBe(1);
            expect(systemA.onAddedEntities[0]).toBe(testEntity);

            testScene.removeSystem(systemA);
            testScene.removeSystem(triggerSystem);
        });

        it('同一帧内添加后移除组件，onAdded 和 onRemoved 都应触发', () => {
            // 使用独立的场景，避免 beforeEach 创建的实体干扰
            // Use independent scene to avoid interference from beforeEach entities
            const testScene = new Scene();

            class TagComponent extends TestComponent {}

            class TrackingSystemWithTag extends EntitySystem {
                public onAddedEntities: Entity[] = [];
                public onRemovedEntities: Entity[] = [];

                constructor() {
                    super(Matcher.all(TestComponent, TagComponent));
                }

                protected override onAdded(entity: Entity): void {
                    this.onAddedEntities.push(entity);
                }

                protected override onRemoved(entity: Entity): void {
                    this.onRemovedEntities.push(entity);
                }
            }

            // AddSystem: 在 process 中添加 TagComponent
            class AddSystem extends EntitySystem {
                constructor() {
                    super(Matcher.all(TestComponent));
                }

                protected override process(entities: readonly Entity[]): void {
                    for (const entity of entities) {
                        if (!entity.hasComponent(TagComponent)) {
                            entity.addComponent(new TagComponent());
                        }
                    }
                }
            }

            // RemoveSystem: 在 lateProcess 中移除 TagComponent
            class RemoveSystem extends EntitySystem {
                constructor() {
                    super(Matcher.all(TagComponent));
                }

                protected override lateProcess(entities: readonly Entity[]): void {
                    for (const entity of entities) {
                        const tag = entity.getComponent(TagComponent);
                        if (tag) {
                            entity.removeComponent(tag);
                        }
                    }
                }
            }

            const trackingSystem = new TrackingSystemWithTag();
            const addSystem = new AddSystem();
            const removeSystem = new RemoveSystem();

            testScene.addSystem(trackingSystem);
            testScene.addSystem(addSystem);
            testScene.addSystem(removeSystem);

            const testEntity = testScene.createEntity('test');
            testEntity.addComponent(new TestComponent());

            // 执行一帧
            testScene.update();

            // AddSystem 添加了 TagComponent，RemoveSystem 在 lateProcess 中移除
            expect(testEntity.hasComponent(TagComponent)).toBe(false);

            // 事件驱动：onAdded 应该在组件添加时立即触发
            expect(trackingSystem.onAddedEntities.length).toBe(1);
            // onRemoved 应该在组件移除时立即触发
            expect(trackingSystem.onRemovedEntities.length).toBe(1);

            testScene.removeSystem(trackingSystem);
            testScene.removeSystem(addSystem);
            testScene.removeSystem(removeSystem);
        });

        it('多个系统监听同一组件变化时都应收到 onAdded 通知', () => {
            // 使用独立的场景，避免 beforeEach 创建的实体干扰
            // Use independent scene to avoid interference from beforeEach entities
            const testScene = new Scene();

            // 使用独立的组件类，避免继承带来的问题
            // Use independent component class to avoid inheritance issues
            class TagComponent2 extends Component {}

            class SystemA extends EntitySystem {
                public onAddedEntities: Entity[] = [];

                constructor() {
                    super(Matcher.all(TestComponent, TagComponent2));
                }

                protected override onAdded(entity: Entity): void {
                    this.onAddedEntities.push(entity);
                }
            }

            class SystemB extends EntitySystem {
                public onAddedEntities: Entity[] = [];

                constructor() {
                    super(Matcher.all(TestComponent, TagComponent2));
                }

                protected override onAdded(entity: Entity): void {
                    this.onAddedEntities.push(entity);
                }
            }

            class TriggerSystem extends EntitySystem {
                constructor() {
                    super(Matcher.all(TestComponent));
                }

                protected override process(entities: readonly Entity[]): void {
                    for (const entity of entities) {
                        if (!entity.hasComponent(TagComponent2)) {
                            entity.addComponent(new TagComponent2());
                        }
                    }
                }
            }

            const systemA = new SystemA();
            const systemB = new SystemB();
            const triggerSystem = new TriggerSystem();

            testScene.addSystem(systemA);
            testScene.addSystem(systemB);
            testScene.addSystem(triggerSystem);

            const testEntity = testScene.createEntity('test');
            testEntity.addComponent(new TestComponent());

            testScene.update();

            // 两个系统都应收到 onAdded 通知
            expect(systemA.onAddedEntities.length).toBe(1);
            expect(systemB.onAddedEntities.length).toBe(1);

            testScene.removeSystem(systemA);
            testScene.removeSystem(systemB);
            testScene.removeSystem(triggerSystem);
        });
    });

    describe('reset 方法', () => {
        it('reset 后系统应该可以重新初始化', () => {
            const plainSystem = new PlainEntitySystem();
            scene.addSystem(plainSystem);

            // 调用 reset
            plainSystem.reset();

            // 验证系统被重置
            expect(plainSystem.scene).toBeNull();
        });

        it('已销毁的系统调用 reset 不应该执行任何操作', () => {
            const plainSystem = new PlainEntitySystem();
            scene.addSystem(plainSystem);

            // 先销毁系统
            plainSystem.destroy();

            // reset 不应该有任何效果
            plainSystem.reset();

            // onDestroy 只应被调用一次
            expect(plainSystem.onDestroyCallCount).toBe(1);
        });
    });

    describe('辅助方法', () => {
        class HelperSystem extends EntitySystem {
            constructor() {
                super(Matcher.all(TestComponent));
            }

            protected override process(entities: readonly Entity[]): void {}

            // 暴露 protected 方法供测试
            public testRequireComponent<T extends new (...args: any[]) => Component>(
                entity: Entity,
                componentType: T
            ): InstanceType<T> {
                return this.requireComponent(entity, componentType) as InstanceType<T>;
            }

            public testForEach(
                entities: readonly Entity[],
                processor: (entity: Entity, index: number) => void
            ): void {
                this.forEach(entities, processor);
            }

            public testFilterEntities(
                entities: readonly Entity[],
                predicate: (entity: Entity, index: number) => boolean
            ): Entity[] {
                return this.filterEntities(entities, predicate);
            }

            public testFindEntity(
                entities: readonly Entity[],
                predicate: (entity: Entity, index: number) => boolean
            ): Entity | undefined {
                return this.findEntity(entities, predicate);
            }

            public testSomeEntity(
                entities: readonly Entity[],
                predicate: (entity: Entity, index: number) => boolean
            ): boolean {
                return this.someEntity(entities, predicate);
            }

            public testEveryEntity(
                entities: readonly Entity[],
                predicate: (entity: Entity, index: number) => boolean
            ): boolean {
                return this.everyEntity(entities, predicate);
            }
        }

        let helperSystem: HelperSystem;

        beforeEach(() => {
            helperSystem = new HelperSystem();
            scene.addSystem(helperSystem);
        });

        afterEach(() => {
            scene.removeSystem(helperSystem);
        });

        it('requireComponent 应该返回存在的组件', () => {
            const component = helperSystem.testRequireComponent(entity, TestComponent);
            expect(component).toBeDefined();
            expect(component.value).toBe(10);
        });

        it('requireComponent 应该在组件不存在时抛出错误', () => {
            class NonExistentComponent extends Component {}

            expect(() => {
                helperSystem.testRequireComponent(entity, NonExistentComponent);
            }).toThrow();
        });

        it('forEach 应该遍历所有实体', () => {
            const entities = [entity];
            const visited: Entity[] = [];

            helperSystem.testForEach(entities, (e) => {
                visited.push(e);
            });

            expect(visited).toHaveLength(1);
            expect(visited[0]).toBe(entity);
        });

        it('filterEntities 应该正确过滤实体', () => {
            const entity2 = scene.createEntity('entity2');
            entity2.addComponent(new TestComponent(20));
            scene.addEntity(entity2);

            const entities = [entity, entity2];

            const filtered = helperSystem.testFilterEntities(entities, (e) => {
                const comp = e.getComponent(TestComponent);
                return comp !== null && comp.value > 15;
            });

            expect(filtered).toHaveLength(1);
            expect(filtered[0]).toBe(entity2);
        });

        it('findEntity 应该返回第一个匹配的实体', () => {
            const entities = [entity];

            const found = helperSystem.testFindEntity(entities, (e) => {
                const comp = e.getComponent(TestComponent);
                return comp !== null && comp.value === 10;
            });

            expect(found).toBe(entity);
        });

        it('findEntity 应该在未找到时返回 undefined', () => {
            const entities = [entity];

            const found = helperSystem.testFindEntity(entities, () => false);

            expect(found).toBeUndefined();
        });

        it('someEntity 应该正确判断是否存在匹配实体', () => {
            const entities = [entity];

            const hasMatch = helperSystem.testSomeEntity(entities, (e) => {
                const comp = e.getComponent(TestComponent);
                return comp !== null && comp.value === 10;
            });

            expect(hasMatch).toBe(true);

            const noMatch = helperSystem.testSomeEntity(entities, () => false);
            expect(noMatch).toBe(false);
        });

        it('everyEntity 应该正确判断是否所有实体都匹配', () => {
            const entities = [entity];

            const allMatch = helperSystem.testEveryEntity(entities, (e) => {
                return e.getComponent(TestComponent) !== null;
            });

            expect(allMatch).toBe(true);

            const notAllMatch = helperSystem.testEveryEntity(entities, () => false);
            expect(notAllMatch).toBe(false);
        });
    });

});