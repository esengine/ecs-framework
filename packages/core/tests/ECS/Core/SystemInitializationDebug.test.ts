import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { ComponentTypeManager } from '../../../src/ECS/Utils/ComponentTypeManager';

/**
 * System初始化调试测试
 */

class HealthComponent extends Component {
    public health: number;

    constructor(health: number = 100) {
        super();
        this.health = health;
    }
}

class HealthSystem extends EntitySystem {
    public initializeCalled = false;
    public onAddedEntities: Entity[] = [];
    public queryResults: readonly Entity[] = [];

    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }

    public override initialize(): void {
        console.log('[HealthSystem] initialize() 开始');
        console.log('[HealthSystem] scene:', !!this.scene);
        console.log('[HealthSystem] matcher:', this.matcher.toString());

        this.initializeCalled = true;
        super.initialize();

        // 初始化后立即查询
        if (this.scene?.querySystem) {
            const result = this.scene.querySystem.queryAll(HealthComponent);
            console.log('[HealthSystem] 初始化后立即查询结果:', {
                count: result.count,
                entities: result.entities.map(e => ({ id: e.id, name: e.name }))
            });
        }

        console.log('[HealthSystem] initialize() 完成, onAddedEntities.length=', this.onAddedEntities.length);
    }

    protected override onAdded(entity: Entity): void {
        console.log('[HealthSystem] onAdded() 被调用:', { id: entity.id, name: entity.name });
        this.onAddedEntities.push(entity);
    }

    protected override process(entities: readonly Entity[]): void {
        this.queryResults = entities;
        for (const entity of entities) {
            const health = entity.getComponent(HealthComponent)!;
            if (health.health <= 0) {
                entity.enabled = false;
            }
        }
    }
}

describe('SystemInitializationDebug - 系统初始化调试', () => {
    let scene: Scene;

    beforeEach(() => {
        ComponentTypeManager.instance.reset();
        scene = new Scene();
        scene.name = 'DebugScene';
    });

    test('先创建实体再添加系统 - 应该触发onAdded', () => {
        console.log('\n=== 测试开始 ===');

        // 1. 创建实体并添加组件
        const entity = scene.createEntity('TestEntity');
        console.log('[Test] 创建实体:', { id: entity.id, name: entity.name });

        entity.addComponent(new HealthComponent(100));
        console.log('[Test] 添加HealthComponent');

        // 2. 验证QuerySystem能查询到实体
        const queryResult = scene.querySystem!.queryAll(HealthComponent);
        console.log('[Test] QuerySystem查询结果:', {
            count: queryResult.count,
            entities: queryResult.entities.map(e => ({ id: e.id, name: e.name }))
        });

        expect(queryResult.count).toBe(1);
        expect(queryResult.entities[0]).toBe(entity);

        // 3. 添加系统
        const system = new HealthSystem();
        console.log('[Test] 准备添加系统到场景');
        scene.addEntityProcessor(system);
        console.log('[Test] 系统已添加');

        // 4. 验证系统状态
        console.log('[Test] 系统状态:', {
            initializeCalled: system.initializeCalled,
            onAddedEntitiesLength: system.onAddedEntities.length,
            onAddedEntities: system.onAddedEntities.map(e => ({ id: e.id, name: e.name }))
        });

        expect(system.initializeCalled).toBe(true);
        expect(system.onAddedEntities).toHaveLength(1);
        expect(system.onAddedEntities[0]).toBe(entity);

        console.log('=== 测试结束 ===\n');
    });

    test('添加同类型的第二个系统 - 应该返回已注册的实例', () => {
        console.log('\n=== 单例模式测试开始 ===');

        // 1. 创建实体并添加组件
        const entity = scene.createEntity('TestEntity');
        console.log('[Test] 创建实体:', { id: entity.id, name: entity.name });

        entity.addComponent(new HealthComponent(100));
        console.log('[Test] 添加HealthComponent');

        // 2. 添加第一个系统
        const system1 = new HealthSystem();
        console.log('[Test] 准备添加第一个系统');
        const returnedSystem1 = scene.addEntityProcessor(system1);
        console.log('[Test] 第一个系统已添加, system1===returnedSystem1?', system1 === returnedSystem1);

        console.log('[Test] 第一个系统状态:', {
            initializeCalled: system1.initializeCalled,
            onAddedEntitiesLength: system1.onAddedEntities.length
        });

        expect(system1.initializeCalled).toBe(true);
        expect(system1.onAddedEntities).toHaveLength(1);
        expect(system1.onAddedEntities[0]).toBe(entity);

        // 3. 尝试添加第二个同类型系统 - 应该返回已注册的system1
        const system2 = new HealthSystem();
        console.log('[Test] 准备添加第二个系统, system1===system2?', system1 === system2);
        console.log('[Test] 系统是否已在ServiceContainer注册:', scene.services.isRegistered(HealthSystem));
        const returnedSystem2 = scene.addEntityProcessor(system2);
        console.log('[Test] 第二个系统调用完成');
        console.log('[Test] system2===returnedSystem2?', system2 === returnedSystem2);
        console.log('[Test] returnedSystem1===returnedSystem2?', returnedSystem1 === returnedSystem2);

        // 验证单例行为: returnedSystem2应该是system1而不是system2
        expect(returnedSystem1).toBe(returnedSystem2);
        expect(returnedSystem2).toBe(system1);
        expect(returnedSystem2).not.toBe(system2);

        // system2不应该被初始化(因为被拒绝了)
        expect(system2.initializeCalled).toBe(false);
        expect(system2.onAddedEntities).toHaveLength(0);

        // 返回的应该是已初始化的system1
        expect(returnedSystem2.initializeCalled).toBe(true);
        expect(returnedSystem2.onAddedEntities).toHaveLength(1);

        console.log('=== 单例模式测试结束 ===\n');
    });
});
