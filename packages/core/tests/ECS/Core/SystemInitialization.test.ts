import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { ECSComponent } from '../../../src/ECS/Decorators';

/**
 * System初始化测试套件
 *
 * 测试覆盖：
 * - 系统初始化时序问题（先添加实体 vs 先添加系统）
 * - 系统重复初始化防护
 * - 动态组件修改响应
 * - 系统生命周期管理
 */

// 测试组件
@ECSComponent('SysInit_PositionComponent')
class PositionComponent extends Component {
    public x: number;
    public y: number;

    constructor(...args: unknown[]) {
        super();
        const [x = 0, y = 0] = args as [number?, number?];
        this.x = x;
        this.y = y;
    }
}

@ECSComponent('SysInit_VelocityComponent')
class VelocityComponent extends Component {
    public vx: number;
    public vy: number;

    constructor(...args: unknown[]) {
        super();
        const [vx = 0, vy = 0] = args as [number?, number?];
        this.vx = vx;
        this.vy = vy;
    }
}

@ECSComponent('SysInit_HealthComponent')
class HealthComponent extends Component {
    public health: number;

    constructor(...args: unknown[]) {
        super();
        const [health = 100] = args as [number?];
        this.health = health;
    }
}

@ECSComponent('SysInit_TagComponent')
class TagComponent extends Component {
    public tag: string;

    constructor(...args: unknown[]) {
        super();
        const [tag = ''] = args as [string?];
        this.tag = tag;
    }
}

@ECSComponent('SysInit_TestComponent')
class TestComponent extends Component {
    public value: number;

    constructor(...args: unknown[]) {
        super();
        const [value = 0] = args as [number?];
        this.value = value;
    }
}

// 测试系统
class MovementSystem extends EntitySystem {
    public processedEntities: Entity[] = [];
    public initializeCalled = false;
    public onAddedEntities: Entity[] = [];
    public onRemovedEntities: Entity[] = [];

    constructor() {
        super(Matcher.empty().all(PositionComponent, VelocityComponent));
    }

    public override initialize(): void {
        this.initializeCalled = true;
        super.initialize();
    }

    protected override onAdded(entity: Entity): void {
        this.onAddedEntities.push(entity);
    }

    protected override onRemoved(entity: Entity): void {
        this.onRemovedEntities.push(entity);
    }

    protected override process(entities: Entity[]): void {
        this.processedEntities = [...entities];
        for (const entity of entities) {
            const position = entity.getComponent(PositionComponent)!;
            const velocity = entity.getComponent(VelocityComponent)!;
            position.x += velocity.vx;
            position.y += velocity.vy;
        }
    }
}

class HealthSystem extends EntitySystem {
    public processedEntities: Entity[] = [];
    public initializeCalled = false;
    public onAddedEntities: Entity[] = [];
    public onRemovedEntities: Entity[] = [];

    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }

    public override initialize(): void {
        this.initializeCalled = true;
        super.initialize();
    }

    protected override onAdded(entity: Entity): void {
        this.onAddedEntities.push(entity);
    }

    protected override onRemoved(entity: Entity): void {
        this.onRemovedEntities.push(entity);
    }

    protected override process(entities: Entity[]): void {
        this.processedEntities = [...entities];
        for (const entity of entities) {
            const health = entity.getComponent(HealthComponent)!;
            if (health.health <= 0) {
                entity.enabled = false;
            }
        }
    }
}

class MultiComponentSystem extends EntitySystem {
    public processedEntities: Entity[] = [];
    public initializeCalled = false;
    public onAddedEntities: Entity[] = [];

    constructor() {
        super(Matcher.empty().all(PositionComponent, HealthComponent, TagComponent));
    }

    public override initialize(): void {
        this.initializeCalled = true;
        super.initialize();
    }

    protected override onAdded(entity: Entity): void {
        this.onAddedEntities.push(entity);
    }

    protected override process(entities: Entity[]): void {
        this.processedEntities = [...entities];
    }
}

class TrackingSystem extends EntitySystem {
    public initializeCallCount = 0;
    public onChangedCallCount = 0;
    public trackedEntities: Entity[] = [];

    public override initialize(): void {
        const wasInitialized = (this as any)._initialized;
        super.initialize();

        if (!wasInitialized) {
            this.initializeCallCount++;

            if (this.scene) {
                for (const entity of this.scene.entities.buffer) {
                    this.onChanged(entity);
                }
            }
        }
    }

    public onChanged(entity: Entity): void {
        this.onChangedCallCount++;
        if (this.isInterestedEntity(entity)) {
            if (!this.trackedEntities.includes(entity)) {
                this.trackedEntities.push(entity);
            }
        } else {
            const index = this.trackedEntities.indexOf(entity);
            if (index !== -1) {
                this.trackedEntities.splice(index, 1);
            }
        }
    }

    public isInterestedEntity(entity: Entity): boolean {
        return entity.hasComponent(TestComponent);
    }
}

describe('SystemInitialization - 系统初始化测试', () => {
    let scene: Scene;

    beforeEach(() => {
        scene = new Scene();
        scene.name = 'InitializationTestScene';
    });

    afterEach(() => {
        if (scene) {
            scene.end();
        }
    });

    describe('初始化时序', () => {
        test('先添加实体再添加系统 - 系统应该正确初始化', () => {
            const player = scene.createEntity('Player');
            player.addComponent(new PositionComponent(10, 20));
            player.addComponent(new VelocityComponent(1, 1));

            const system = new MovementSystem();
            scene.addEntityProcessor(system);

            expect(system.initializeCalled).toBe(true);
            expect(system.onAddedEntities).toHaveLength(1);
            expect(system.onAddedEntities[0]).toBe(player);
        });

        test('先添加系统再添加实体 - 系统应该正确响应', () => {
            const system = new MovementSystem();
            scene.addEntityProcessor(system);

            expect(system.initializeCalled).toBe(true);
            expect(system.onAddedEntities).toHaveLength(0);

            const player = scene.createEntity('Player');
            player.addComponent(new PositionComponent(10, 20));
            player.addComponent(new VelocityComponent(1, 1));

            scene.update(); // 触发系统查询

            expect(system.onAddedEntities).toHaveLength(1);
            expect(system.onAddedEntities[0]).toBe(player);
        });

        test('先添加部分实体，再添加系统，再添加更多实体', () => {
            const entity1 = scene.createEntity('Entity1');
            entity1.addComponent(new PositionComponent(0, 0));
            entity1.addComponent(new VelocityComponent(1, 0));

            const system = new MovementSystem();
            scene.addEntityProcessor(system);

            expect(system.onAddedEntities).toHaveLength(1);

            const entity2 = scene.createEntity('Entity2');
            entity2.addComponent(new PositionComponent(0, 0));
            entity2.addComponent(new VelocityComponent(0, 1));

            scene.update(); // 触发系统查询

            expect(system.onAddedEntities).toHaveLength(2);
            expect(system.onAddedEntities[1]).toBe(entity2);
        });

        test('批量实体创建后系统初始化应该正确', () => {
            const entities: Entity[] = [];
            for (let i = 0; i < 5; i++) {
                const entity = scene.createEntity(`Entity_${i}`);
                entity.addComponent(new PositionComponent(i, i));
                entity.addComponent(new VelocityComponent(1, 1));
                entities.push(entity);
            }

            const system = new MovementSystem();
            scene.addEntityProcessor(system);

            expect(system.onAddedEntities).toHaveLength(5);
            for (let i = 0; i < 5; i++) {
                expect(system.onAddedEntities).toContain(entities[i]);
            }
        });
    });

    describe('重复初始化防护', () => {
        test('系统被多次添加到场景 - 应该防止重复初始化', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestComponent(10));

            const system = new TrackingSystem();

            scene.addEntityProcessor(system);
            expect(system.initializeCallCount).toBe(1);
            expect(system.trackedEntities).toHaveLength(1);
            expect(system.onChangedCallCount).toBe(1);

            scene.addEntityProcessor(system);
            expect(system.initializeCallCount).toBe(1);
            expect(system.trackedEntities).toHaveLength(1);
            expect(system.onChangedCallCount).toBe(1);
        });

        test('手动多次调用initialize - 应该防止重复处理', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestComponent(10));

            const system = new TrackingSystem();
            scene.addEntityProcessor(system);

            expect(system.initializeCallCount).toBe(1);
            expect(system.trackedEntities).toHaveLength(1);
            expect(system.onChangedCallCount).toBe(1);

            system.initialize();
            expect(system.initializeCallCount).toBe(1);
            expect(system.onChangedCallCount).toBe(1);
            expect(system.trackedEntities).toHaveLength(1);
        });

        test('系统被移除后重新添加 - 应该重新初始化', () => {
            const system = new TrackingSystem();
            scene.addEntityProcessor(system);

            expect(system.initializeCallCount).toBe(1);

            scene.removeEntityProcessor(system);

            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestComponent(10));

            scene.addEntityProcessor(system);
            expect(system.initializeCallCount).toBe(2);
            expect(system.trackedEntities).toHaveLength(1);
        });
    });

    describe('动态组件修改响应', () => {
        test('运行时添加组件 - 系统应该自动响应', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent(0, 0));

            const system = new MovementSystem();
            scene.addEntityProcessor(system);

            expect(system.onAddedEntities).toHaveLength(0);

            entity.addComponent(new VelocityComponent(1, 1));

            scene.update(); // 触发系统查询

            expect(system.onAddedEntities).toHaveLength(1);
            expect(system.onAddedEntities[0]).toBe(entity);
        });

        test('运行时移除组件 - 系统应该自动响应', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent(0, 0));
            const velocity = entity.addComponent(new VelocityComponent(1, 1));

            const system = new MovementSystem();
            scene.addEntityProcessor(system);

            expect(system.onAddedEntities).toHaveLength(1);

            entity.removeComponent(velocity);

            scene.update(); // 触发系统查询

            expect(system.onRemovedEntities).toHaveLength(1);
            expect(system.onRemovedEntities[0]).toBe(entity);
        });

        test('复杂的组件添加移除序列', () => {
            const entity = scene.createEntity('Entity');
            const system = new MovementSystem();
            scene.addEntityProcessor(system);

            entity.addComponent(new PositionComponent(0, 0));
            scene.update();
            expect(system.onAddedEntities).toHaveLength(0);

            const velocity1 = entity.addComponent(new VelocityComponent(1, 1));
            scene.update();
            expect(system.onAddedEntities).toHaveLength(1);

            entity.removeComponent(velocity1);
            scene.update();
            expect(system.onRemovedEntities).toHaveLength(1);

            entity.addComponent(new VelocityComponent(2, 2));
            scene.update();
            expect(system.onAddedEntities).toHaveLength(2);
        });

        test('多个组件同时满足条件', () => {
            const entity = scene.createEntity('Entity');
            const system = new MultiComponentSystem();
            scene.addEntityProcessor(system);

            entity.addComponent(new PositionComponent(0, 0));
            scene.update();
            expect(system.onAddedEntities).toHaveLength(0);

            entity.addComponent(new HealthComponent(100));
            scene.update();
            expect(system.onAddedEntities).toHaveLength(0);

            entity.addComponent(new TagComponent('player'));
            scene.update();
            expect(system.onAddedEntities).toHaveLength(1);
        });
    });

    describe('多系统协同', () => {
        test('多个系统同时响应同一实体', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));
            entity.addComponent(new HealthComponent(100));

            const movementSystem = new MovementSystem();
            const healthSystem = new HealthSystem();

            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);

            expect(movementSystem.onAddedEntities).toHaveLength(1);
            expect(healthSystem.onAddedEntities).toHaveLength(1);
            expect(movementSystem.onAddedEntities[0]).toBe(entity);
            expect(healthSystem.onAddedEntities[0]).toBe(entity);
        });

        test('不同系统匹配不同实体', () => {
            const movingEntity = scene.createEntity('Moving');
            movingEntity.addComponent(new PositionComponent(0, 0));
            movingEntity.addComponent(new VelocityComponent(1, 1));

            const healthEntity = scene.createEntity('Health');
            healthEntity.addComponent(new HealthComponent(100));

            const movementSystem = new MovementSystem();
            const healthSystem = new HealthSystem();

            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);

            expect(movementSystem.onAddedEntities).toHaveLength(1);
            expect(movementSystem.onAddedEntities[0]).toBe(movingEntity);

            expect(healthSystem.onAddedEntities).toHaveLength(1);
            expect(healthSystem.onAddedEntities[0]).toBe(healthEntity);
        });

        test('组件变化影响多个系统', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));
            entity.addComponent(new HealthComponent(100));

            const movementSystem = new MovementSystem();
            const healthSystem = new HealthSystem();
            const multiSystem = new MultiComponentSystem();

            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);
            scene.addEntityProcessor(multiSystem);

            entity.addComponent(new TagComponent('player'));

            scene.update(); // 触发系统查询

            expect(multiSystem.onAddedEntities).toHaveLength(1);
            expect(multiSystem.onAddedEntities[0]).toBe(entity);
        });
    });

    describe('边界情况', () => {
        test('空场景添加系统', () => {
            const system = new MovementSystem();
            scene.addEntityProcessor(system);

            expect(system.initializeCalled).toBe(true);
            expect(system.onAddedEntities).toHaveLength(0);
        });

        test('实体禁用状态不影响系统初始化', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));
            entity.enabled = false;

            const system = new MovementSystem();
            scene.addEntityProcessor(system);

            // 禁用的实体仍然被系统跟踪，但在process时会被过滤
            expect(system.onAddedEntities).toHaveLength(1);
        });

        test('系统初始化时实体被销毁', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));

            const system = new MovementSystem();
            scene.addEntityProcessor(system);

            entity.destroy();

            scene.update(); // 触发系统查询检测移除

            expect(system.onRemovedEntities).toHaveLength(1);
        });
    });
});
