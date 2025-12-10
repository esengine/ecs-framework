import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { ECSComponent } from '../../../src/ECS/Decorators';

// 简单的测试组件
@ECSComponent('MinSysInit_HealthComponent')
class HealthComponent extends Component {
    public health: number;

    constructor(...args: unknown[]) {
        super();
        const [health = 100] = args as [number?];
        this.health = health;
    }
}

// 简单的测试系统
class HealthSystem extends EntitySystem {
    public onAddedEntities: Entity[] = [];

    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }

    protected override onAdded(entity: Entity): void {
        console.log('[HealthSystem] onAdded called:', { id: entity.id, name: entity.name });
        this.onAddedEntities.push(entity);
    }
}

describe('MinimalSystemInit - 最小化系统初始化测试', () => {
    let scene: Scene;

    beforeEach(() => {
        scene = new Scene();
    });

    afterEach(() => {
        if (scene) {
            scene.end();
        }
    });

    test('先创建实体和组件，再添加系统 - 应该触发onAdded', () => {
        console.log('\\n=== Test 1: 先创建实体再添加系统 ===');

        // 1. 创建实体并添加组件
        const entity = scene.createEntity('TestEntity');
        entity.addComponent(new HealthComponent(100));

        console.log('[Test] Entity created with HealthComponent');

        // 2. 验证QuerySystem能查询到实体
        const queryResult = scene.querySystem.queryAll(HealthComponent);
        console.log('[Test] QuerySystem result:', { count: queryResult.count });

        // 3. 添加系统
        const system = new HealthSystem();
        console.log('[Test] Adding system to scene...');
        scene.addEntityProcessor(system);

        console.log('[Test] System added, onAddedEntities.length =', system.onAddedEntities.length);

        // 4. 验证
        expect(system.onAddedEntities).toHaveLength(1);
    });

    test('先添加系统，再创建实体和组件 - 应该在update时触发onAdded', () => {
        console.log('\\n=== Test 2: 先添加系统再创建实体 ===');

        // 1. 先添加系统
        const system = new HealthSystem();
        scene.addEntityProcessor(system);
        console.log('[Test] System added, onAddedEntities.length =', system.onAddedEntities.length);

        // 2. 创建实体并添加组件
        const entity = scene.createEntity('TestEntity');
        entity.addComponent(new HealthComponent(100));
        console.log('[Test] Entity created with HealthComponent');

        // 3. 调用update触发系统查询
        console.log('[Test] Calling scene.update()...');
        scene.update();

        console.log('[Test] After update, onAddedEntities.length =', system.onAddedEntities.length);

        // 4. 验证
        expect(system.onAddedEntities).toHaveLength(1);
    });
});
