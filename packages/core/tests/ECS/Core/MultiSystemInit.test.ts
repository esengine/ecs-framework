import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { ECSComponent } from '../../../src/ECS/Decorators';

// 测试组件
@ECSComponent('MultiSysInit_PositionComponent')
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

@ECSComponent('MultiSysInit_VelocityComponent')
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

@ECSComponent('MultiSysInit_HealthComponent')
class HealthComponent extends Component {
    public health: number;

    constructor(...args: unknown[]) {
        super();
        const [health = 100] = args as [number?];
        this.health = health;
    }
}

// 测试系统
class MovementSystem extends EntitySystem {
    public onAddedEntities: Entity[] = [];

    constructor() {
        super(Matcher.empty().all(PositionComponent, VelocityComponent));
    }

    protected override onAdded(entity: Entity): void {
        console.log('[MovementSystem] onAdded:', { id: entity.id, name: entity.name });
        this.onAddedEntities.push(entity);
    }
}

class HealthSystem extends EntitySystem {
    public onAddedEntities: Entity[] = [];

    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }

    protected override onAdded(entity: Entity): void {
        console.log('[HealthSystem] onAdded:', { id: entity.id, name: entity.name });
        this.onAddedEntities.push(entity);
    }
}

describe('MultiSystemInit - 多系统初始化测试', () => {
    let scene: Scene;

    beforeEach(() => {
        scene = new Scene();
    });

    afterEach(() => {
        if (scene) {
            scene.end();
        }
    });

    test('多个系统同时响应同一实体 - 复现失败场景', () => {
        console.log('\\n=== Test: 多个系统同时响应同一实体 ===');

        // 1. 创建实体并添加所有组件
        const entity = scene.createEntity('Entity');
        entity.addComponent(new PositionComponent(0, 0));
        entity.addComponent(new VelocityComponent(1, 1));
        entity.addComponent(new HealthComponent(100));

        console.log('[Test] Entity created with Position, Velocity, Health');

        // 2. 验证QuerySystem能查询到实体
        const movementQuery = scene.querySystem.queryAll(PositionComponent, VelocityComponent);
        const healthQuery = scene.querySystem.queryAll(HealthComponent);
        console.log('[Test] MovementQuery result:', { count: movementQuery.count });
        console.log('[Test] HealthQuery result:', { count: healthQuery.count });

        // 3. 添加两个系统
        console.log('[Test] Adding MovementSystem...');
        const movementSystem = new MovementSystem();
        scene.addEntityProcessor(movementSystem);
        console.log('[Test] MovementSystem added, onAddedEntities.length =', movementSystem.onAddedEntities.length);

        console.log('[Test] Adding HealthSystem...');
        const healthSystem = new HealthSystem();
        scene.addEntityProcessor(healthSystem);
        console.log('[Test] HealthSystem added, onAddedEntities.length =', healthSystem.onAddedEntities.length);

        // 4. 验证
        console.log('[Test] Final check:');
        console.log('  MovementSystem.onAddedEntities.length =', movementSystem.onAddedEntities.length);
        console.log('  HealthSystem.onAddedEntities.length =', healthSystem.onAddedEntities.length);

        expect(movementSystem.onAddedEntities).toHaveLength(1);
        expect(healthSystem.onAddedEntities).toHaveLength(1);
    });

    test('不同系统匹配不同实体 - 复现失败场景', () => {
        console.log('\\n=== Test: 不同系统匹配不同实体 ===');

        // 1. 创建两个实体
        const movingEntity = scene.createEntity('Moving');
        movingEntity.addComponent(new PositionComponent(0, 0));
        movingEntity.addComponent(new VelocityComponent(1, 1));

        const healthEntity = scene.createEntity('Health');
        healthEntity.addComponent(new HealthComponent(100));

        console.log('[Test] Two entities created');

        // 2. 验证QuerySystem
        const movementQuery = scene.querySystem.queryAll(PositionComponent, VelocityComponent);
        const healthQuery = scene.querySystem.queryAll(HealthComponent);
        console.log('[Test] MovementQuery result:', { count: movementQuery.count });
        console.log('[Test] HealthQuery result:', { count: healthQuery.count });

        // 3. 添加系统
        console.log('[Test] Adding systems...');
        const movementSystem = new MovementSystem();
        const healthSystem = new HealthSystem();

        scene.addEntityProcessor(movementSystem);
        scene.addEntityProcessor(healthSystem);

        console.log('[Test] Systems added');
        console.log('  MovementSystem.onAddedEntities.length =', movementSystem.onAddedEntities.length);
        console.log('  HealthSystem.onAddedEntities.length =', healthSystem.onAddedEntities.length);

        // 4. 验证
        expect(movementSystem.onAddedEntities).toHaveLength(1);
        expect(movementSystem.onAddedEntities[0]).toBe(movingEntity);

        expect(healthSystem.onAddedEntities).toHaveLength(1);
        expect(healthSystem.onAddedEntities[0]).toBe(healthEntity);
    });
});
