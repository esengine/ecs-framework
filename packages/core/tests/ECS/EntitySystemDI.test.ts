import { Scene } from '../../src/ECS/Scene';
import { EntitySystem } from '../../src/ECS/Systems/EntitySystem';
import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';
import { Matcher } from '../../src/ECS/Utils/Matcher';
import { Injectable, InjectProperty } from '../../src/Core/DI';
import { Core } from '../../src/Core';
import type { IService } from '../../src/Core/ServiceContainer';
import { ECSSystem, ECSComponent } from '../../src/ECS/Decorators';

@ECSComponent('DI_Transform')
class Transform extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

@ECSComponent('DI_Velocity')
class Velocity extends Component {
    constructor(public vx: number = 0, public vy: number = 0) {
        super();
    }
}

@ECSComponent('DI_Health')
class Health extends Component {
    constructor(public value: number = 100) {
        super();
    }
}

describe('EntitySystem - 依赖注入测试', () => {
    let scene: Scene;

    beforeAll(() => {
        Core.create();
    });

    beforeEach(() => {
        scene = new Scene();
    });

    afterEach(() => {
        scene.end();
    });

    afterAll(() => {
        Core.destroy();
    });

    describe('基本DI功能', () => {
        test('应该支持无依赖的System通过类型添加', () => {
            @Injectable()
            @ECSSystem('Movement')
            class MovementSystem extends EntitySystem implements IService {
                constructor() {
                    super(Matcher.empty().all(Transform, Velocity));
                }
                override dispose() {}
            }

            const system = scene.addEntityProcessor(MovementSystem);

            expect(system).toBeInstanceOf(MovementSystem);
            expect(scene.systems.length).toBe(1);
        });

        test('应该支持有依赖的System自动注入', () => {
            @Injectable()
            @ECSSystem('Collision')
            class CollisionSystem extends EntitySystem implements IService {
                public checkCount = 0;

                constructor() {
                    super(Matcher.empty().all(Transform));
                }

                public checkCollisions() {
                    this.checkCount++;
                }

                override dispose() {}
            }

            @Injectable()
            @ECSSystem('Physics')
            class PhysicsSystem extends EntitySystem implements IService {
                @InjectProperty(CollisionSystem)
                public collision!: CollisionSystem;

                constructor() {
                    super(Matcher.empty().all(Transform, Velocity));
                }

                protected override process(entities: readonly Entity[]): void {
                    this.collision.checkCollisions();
                }

                override dispose() {}
            }

            scene.addEntityProcessor(CollisionSystem);
            const physics = scene.addEntityProcessor(PhysicsSystem);

            expect(physics).toBeInstanceOf(PhysicsSystem);
            expect(physics.collision).toBeInstanceOf(CollisionSystem);
            expect(scene.systems.length).toBe(2);

            const entity = scene.createEntity('test');
            entity.addComponent(new Transform());
            entity.addComponent(new Velocity());

            scene.update();

            expect(physics.collision.checkCount).toBe(1);
        });

        test('应该支持多层级依赖注入', () => {
            @Injectable()
            @ECSSystem('A')
            class SystemA extends EntitySystem implements IService {
                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            @Injectable()
            @ECSSystem('B')
            class SystemB extends EntitySystem implements IService {
                @InjectProperty(SystemA)
                public systemA!: SystemA;

                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            @Injectable()
            @ECSSystem('C')
            class SystemC extends EntitySystem implements IService {
                @InjectProperty(SystemA)
                public systemA!: SystemA;

                @InjectProperty(SystemB)
                public systemB!: SystemB;

                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            scene.addEntityProcessor(SystemA);
            scene.addEntityProcessor(SystemB);
            const systemC = scene.addEntityProcessor(SystemC);

            expect(systemC.systemA).toBeInstanceOf(SystemA);
            expect(systemC.systemB).toBeInstanceOf(SystemB);
            expect(systemC.systemB.systemA).toBe(systemC.systemA);
        });
    });

    describe('批量注册', () => {
        test('应该支持批量注册System并自动解析依赖', () => {
            @Injectable()
            @ECSSystem('Collision')
            class CollisionSystem extends EntitySystem implements IService {
                constructor() {
                    super(Matcher.empty().all(Transform));
                }
                override dispose() {}
            }

            @Injectable()
            @ECSSystem('Physics', { updateOrder: 10 })
            class PhysicsSystem extends EntitySystem implements IService {
                @InjectProperty(CollisionSystem)
                public collision!: CollisionSystem;

                constructor() {
                    super(Matcher.empty().all(Transform, Velocity));
                }
                override dispose() {}
            }

            @Injectable()
            @ECSSystem('Render', { updateOrder: 20 })
            class RenderSystem extends EntitySystem implements IService {
                @InjectProperty(PhysicsSystem)
                public physics!: PhysicsSystem;

                constructor() {
                    super(Matcher.empty().all(Transform));
                }
                override dispose() {}
            }

            const systems = scene.registerSystems([
                CollisionSystem,
                PhysicsSystem,
                RenderSystem
            ]);

            expect(systems.length).toBe(3);
            expect(scene.systems.length).toBe(3);

            const [collision, physics, render] = systems;
            expect(collision).toBeInstanceOf(CollisionSystem);
            expect(physics).toBeInstanceOf(PhysicsSystem);
            expect(render).toBeInstanceOf(RenderSystem);

            expect((physics as any).collision).toBe(collision);
            expect((render as any).physics).toBe(physics);
        });

        test('批量注册的System应该按updateOrder排序', () => {
            @Injectable()
            @ECSSystem('C', { updateOrder: 30 })
            class SystemC extends EntitySystem implements IService {
                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            @Injectable()
            @ECSSystem('A', { updateOrder: 10 })
            class SystemA extends EntitySystem implements IService {
                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            @Injectable()
            @ECSSystem('B', { updateOrder: 20 })
            class SystemB extends EntitySystem implements IService {
                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            scene.registerSystems([SystemC, SystemA, SystemB]);

            const systems = scene.systems;
            expect(systems[0]).toBeInstanceOf(SystemA);
            expect(systems[1]).toBeInstanceOf(SystemB);
            expect(systems[2]).toBeInstanceOf(SystemC);
        });
    });

    describe('场景隔离', () => {
        test('不同Scene的System实例应该相互独立', () => {
            @Injectable()
            @ECSSystem('Counter')
            class CounterSystem extends EntitySystem implements IService {
                public count = 0;

                constructor() {
                    super(Matcher.empty());
                }

                protected override process(): void {
                    this.count++;
                }

                override dispose() {}
            }

            const scene1 = new Scene();
            const scene2 = new Scene();

            const counter1 = scene1.addEntityProcessor(CounterSystem);
            const counter2 = scene2.addEntityProcessor(CounterSystem);

            expect(counter1).not.toBe(counter2);

            scene1.update();
            expect(counter1.count).toBe(1);
            expect(counter2.count).toBe(0);

            scene2.update();
            expect(counter1.count).toBe(1);
            expect(counter2.count).toBe(1);

            scene1.end();
            scene2.end();
        });
    });

    describe('getSystem方法', () => {
        test('应该能通过getSystem获取已注册的System', () => {
            @Injectable()
            @ECSSystem('Test')
            class TestSystem extends EntitySystem implements IService {
                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            scene.addEntityProcessor(TestSystem);

            const system = scene.getSystem(TestSystem);
            expect(system).toBeInstanceOf(TestSystem);
        });

        test('获取未注册的System应该返回null', () => {
            @Injectable()
            @ECSSystem('Test')
            class TestSystem extends EntitySystem implements IService {
                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            const system = scene.getSystem(TestSystem);
            expect(system).toBeNull();
        });
    });

    describe('向后兼容性', () => {
        test('应该继续支持手动创建实例的方式', () => {
            class LegacySystem extends EntitySystem {
                constructor() {
                    super(Matcher.empty().all(Transform));
                }
            }

            const system = new LegacySystem();
            scene.addEntityProcessor(system);

            expect(scene.systems.length).toBe(1);
            expect(scene.systems[0]).toBe(system);
        });

        test('混合使用DI和手动创建应该正常工作', () => {
            @Injectable()
            @ECSSystem('DI')
            class DISystem extends EntitySystem implements IService {
                constructor() {
                    super(Matcher.empty().all(Transform));
                }
                override dispose() {}
            }

            class ManualSystem extends EntitySystem {
                constructor() {
                    super(Matcher.empty().all(Velocity));
                }
            }

            scene.addEntityProcessor(DISystem);
            scene.addEntityProcessor(new ManualSystem());

            expect(scene.systems.length).toBe(2);
        });
    });

    describe('Issue #76 场景验证', () => {
        test('应该消除硬编码依赖，使用属性注入', () => {
            @Injectable()
            @ECSSystem('TimeService')
            class TimeService extends EntitySystem implements IService {
                public getDeltaTime(): number {
                    return 0.016;
                }

                constructor() {
                    super(Matcher.empty());
                }

                override dispose() {}
            }

            @Injectable()
            @ECSSystem('CollisionService')
            class CollisionService extends EntitySystem implements IService {
                public detectCollisions(): string[] {
                    return ['collision1', 'collision2'];
                }

                constructor() {
                    super(Matcher.empty());
                }

                override dispose() {}
            }

            @Injectable()
            @ECSSystem('Physics')
            class PhysicsSystem extends EntitySystem implements IService {
                @InjectProperty(TimeService)
                private time!: TimeService;

                @InjectProperty(CollisionService)
                private collision!: CollisionService;

                constructor() {
                    super(Matcher.empty().all(Transform, Velocity));
                }

                protected override process(entities: readonly Entity[]): void {
                    const dt = this.time.getDeltaTime();
                    const collisions = this.collision.detectCollisions();

                    for (const entity of entities) {
                        const transform = entity.getComponent(Transform)!;
                        const velocity = entity.getComponent(Velocity)!;

                        transform.x += velocity.vx * dt;
                        transform.y += velocity.vy * dt;
                    }
                }

                override dispose() {}
            }

            scene.registerSystems([
                TimeService,
                CollisionService,
                PhysicsSystem
            ]);

            const entity = scene.createEntity('player');
            entity.addComponent(new Transform(0, 0));
            entity.addComponent(new Velocity(100, 50));

            const physics = scene.getSystem(PhysicsSystem);
            expect(physics).not.toBeNull();
            expect((physics as any).time).toBeInstanceOf(TimeService);
            expect((physics as any).collision).toBeInstanceOf(CollisionService);

            scene.update();

            const transform = entity.getComponent(Transform)!;
            expect(transform.x).toBeCloseTo(1.6, 1);
            expect(transform.y).toBeCloseTo(0.8, 1);
        });
    });

    describe('属性注入 @InjectProperty', () => {
        test('应该支持单个属性注入', () => {
            @Injectable()
            @ECSSystem('Config')
            class GameConfig extends EntitySystem implements IService {
                public bulletDamage = 10;

                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            @Injectable()
            @ECSSystem('Combat')
            class CombatSystem extends EntitySystem implements IService {
                @InjectProperty(GameConfig)
                gameConfig!: GameConfig;

                constructor() {
                    super(Matcher.empty().all(Health));
                }

                protected override onInitialize(): void {
                    expect(this.gameConfig).toBeInstanceOf(GameConfig);
                    expect(this.gameConfig.bulletDamage).toBe(10);
                }

                override dispose() {}
            }

            scene.addEntityProcessor(GameConfig);
            scene.addEntityProcessor(CombatSystem);
        });

        test('应该支持多个属性注入', () => {
            @Injectable()
            @ECSSystem('Time')
            class TimeService extends EntitySystem implements IService {
                public deltaTime = 0.016;
                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            @Injectable()
            @ECSSystem('Collision')
            class CollisionSystem extends EntitySystem implements IService {
                public checkCount = 0;
                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            @Injectable()
            @ECSSystem('Physics')
            class PhysicsSystem extends EntitySystem implements IService {
                @InjectProperty(TimeService)
                time!: TimeService;

                @InjectProperty(CollisionSystem)
                collision!: CollisionSystem;

                constructor() {
                    super(Matcher.empty());
                }

                protected override onInitialize(): void {
                    expect(this.time).toBeInstanceOf(TimeService);
                    expect(this.collision).toBeInstanceOf(CollisionSystem);
                    expect(this.time.deltaTime).toBe(0.016);
                }

                override dispose() {}
            }

            scene.registerSystems([TimeService, CollisionSystem, PhysicsSystem]);
        });

        test('属性注入应该在onInitialize之前完成', () => {
            @Injectable()
            @ECSSystem('Service')
            class TestService extends EntitySystem implements IService {
                public value = 42;
                constructor() {
                    super(Matcher.empty());
                }
                override dispose() {}
            }

            @Injectable()
            @ECSSystem('Consumer')
            class ConsumerSystem extends EntitySystem implements IService {
                @InjectProperty(TestService)
                service!: TestService;

                private initializeValue = 0;

                constructor() {
                    super(Matcher.empty());
                }

                protected override onInitialize(): void {
                    this.initializeValue = this.service.value;
                }

                public getInitializeValue(): number {
                    return this.initializeValue;
                }

                override dispose() {}
            }

            scene.addEntityProcessor(TestService);
            const consumer = scene.addEntityProcessor(ConsumerSystem);

            expect(consumer.getInitializeValue()).toBe(42);
        });
    });
});
