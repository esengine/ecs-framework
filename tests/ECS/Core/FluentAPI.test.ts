import { 
    EntityBuilder, 
    SceneBuilder, 
    ComponentBuilder, 
    ECSFluentAPI, 
    EntityBatchOperator,
    createECSAPI,
    initializeECS,
    ECS
} from '../../../src/ECS/Core/FluentAPI';
import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { QuerySystem } from '../../../src/ECS/Core/QuerySystem';
import { TypeSafeEventSystem } from '../../../src/ECS/Core/EventSystem';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';

// 测试组件
class TestComponent extends Component {
    constructor(public value: number = 0) {
        super();
    }
}

class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class VelocityComponent extends Component {
    constructor(public vx: number = 0, public vy: number = 0) {
        super();
    }
}

// 测试系统
class TestSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(TestComponent));
    }

    protected override process(entities: Entity[]): void {
        // 测试系统
    }
}

describe('FluentAPI - 流式API测试', () => {
    let scene: Scene;
    let querySystem: QuerySystem;
    let eventSystem: TypeSafeEventSystem;

    beforeEach(() => {
        scene = new Scene();
        querySystem = new QuerySystem();
        eventSystem = new TypeSafeEventSystem();
    });

    describe('EntityBuilder - 实体构建器', () => {
        let builder: EntityBuilder;

        beforeEach(() => {
            builder = new EntityBuilder(scene, scene.componentStorageManager);
        });

        test('应该能够创建实体构建器', () => {
            expect(builder).toBeInstanceOf(EntityBuilder);
        });

        test('应该能够设置实体名称', () => {
            const entity = builder.named('TestEntity').build();
            expect(entity.name).toBe('TestEntity');
        });

        test('应该能够设置实体标签', () => {
            const entity = builder.tagged(42).build();
            expect(entity.tag).toBe(42);
        });

        test('应该能够添加组件', () => {
            const component = new TestComponent(100);
            const entity = builder.with(component).build();
            
            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.getComponent(TestComponent)).toBe(component);
        });

        test('应该能够添加多个组件', () => {
            const comp1 = new TestComponent(100);
            const comp2 = new PositionComponent(10, 20);
            const comp3 = new VelocityComponent(1, 2);
            
            const entity = builder.withComponents(comp1, comp2, comp3).build();
            
            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.hasComponent(PositionComponent)).toBe(true);
            expect(entity.hasComponent(VelocityComponent)).toBe(true);
        });

        test('应该能够条件性添加组件', () => {
            const comp1 = new TestComponent(100);
            const comp2 = new PositionComponent(10, 20);
            
            const entity = builder
                .withIf(true, comp1)
                .withIf(false, comp2)
                .build();
            
            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.hasComponent(PositionComponent)).toBe(false);
        });

        test('应该能够使用工厂函数创建组件', () => {
            const entity = builder
                .withFactory(() => new TestComponent(200))
                .build();
            
            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.getComponent(TestComponent)!.value).toBe(200);
        });

        test('应该能够配置组件属性', () => {
            const entity = builder
                .with(new TestComponent(100))
                .configure(TestComponent, (comp) => {
                    comp.value = 300;
                })
                .build();
            
            expect(entity.getComponent(TestComponent)!.value).toBe(300);
        });

        test('配置不存在的组件应该安全处理', () => {
            expect(() => {
                builder.configure(TestComponent, (comp) => {
                    comp.value = 300;
                }).build();
            }).not.toThrow();
        });

        test('应该能够设置实体启用状态', () => {
            const entity1 = builder.enabled(true).build();
            const entity2 = new EntityBuilder(scene, scene.componentStorageManager).enabled(false).build();
            
            expect(entity1.enabled).toBe(true);
            expect(entity2.enabled).toBe(false);
        });

        test('应该能够设置实体活跃状态', () => {
            const entity1 = builder.active(true).build();
            const entity2 = new EntityBuilder(scene, scene.componentStorageManager).active(false).build();
            
            expect(entity1.active).toBe(true);
            expect(entity2.active).toBe(false);
        });

        test('应该能够添加子实体', () => {
            const childBuilder = new EntityBuilder(scene, scene.componentStorageManager)
                .named('Child')
                .with(new TestComponent(50));
            
            const parent = builder
                .named('Parent')
                .withChild(childBuilder)
                .build();
            
            expect(parent.children.length).toBe(1);
            expect(parent.children[0].name).toBe('Child');
        });

        test('应该能够添加多个子实体', () => {
            const child1 = new EntityBuilder(scene, scene.componentStorageManager).named('Child1');
            const child2 = new EntityBuilder(scene, scene.componentStorageManager).named('Child2');
            const child3 = new EntityBuilder(scene, scene.componentStorageManager).named('Child3');
            
            const parent = builder
                .named('Parent')
                .withChildren(child1, child2, child3)
                .build();
            
            expect(parent.children.length).toBe(3);
            expect(parent.children[0].name).toBe('Child1');
            expect(parent.children[1].name).toBe('Child2');
            expect(parent.children[2].name).toBe('Child3');
        });

        test('应该能够使用工厂函数创建子实体', () => {
            const parent = builder
                .named('Parent')
                .withChildFactory((parentEntity) => {
                    return new EntityBuilder(scene, scene.componentStorageManager)
                        .named(`Child_of_${parentEntity.name}`)
                        .with(new TestComponent(100));
                })
                .build();
            
            expect(parent.children.length).toBe(1);
            expect(parent.children[0].name).toBe('Child_of_Parent');
        });

        test('应该能够条件性添加子实体', () => {
            const child1 = new EntityBuilder(scene, scene.componentStorageManager).named('Child1');
            const child2 = new EntityBuilder(scene, scene.componentStorageManager).named('Child2');
            
            const parent = builder
                .named('Parent')
                .withChildIf(true, child1)
                .withChildIf(false, child2)
                .build();
            
            expect(parent.children.length).toBe(1);
            expect(parent.children[0].name).toBe('Child1');
        });

        test('应该能够构建实体并添加到场景', () => {
            const entity = builder
                .named('SpawnedEntity')
                .with(new TestComponent(100))
                .spawn();
            
            expect(entity.name).toBe('SpawnedEntity');
            expect(entity.scene).toBe(scene);
        });

        test('应该能够克隆构建器', () => {
            const originalBuilder = builder.named('Original').with(new TestComponent(100));
            const clonedBuilder = originalBuilder.clone();
            
            expect(clonedBuilder).toBeInstanceOf(EntityBuilder);
            expect(clonedBuilder).not.toBe(originalBuilder);
        });

        test('流式调用应该工作正常', () => {
            const entity = builder
                .named('ComplexEntity')
                .tagged(42)
                .with(new TestComponent(100))
                .with(new PositionComponent(10, 20))
                .enabled(true)
                .active(true)
                .configure(TestComponent, (comp) => {
                    comp.value = 200;
                })
                .build();
            
            expect(entity.name).toBe('ComplexEntity');
            expect(entity.tag).toBe(42);
            expect(entity.enabled).toBe(true);
            expect(entity.active).toBe(true);
            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.hasComponent(PositionComponent)).toBe(true);
            expect(entity.getComponent(TestComponent)!.value).toBe(200);
        });
    });

    describe('SceneBuilder - 场景构建器', () => {
        let builder: SceneBuilder;

        beforeEach(() => {
            builder = new SceneBuilder();
        });

        test('应该能够创建场景构建器', () => {
            expect(builder).toBeInstanceOf(SceneBuilder);
        });

        test('应该能够设置场景名称', () => {
            const scene = builder.named('TestScene').build();
            expect(scene.name).toBe('TestScene');
        });

        test('应该能够添加实体', () => {
            const entity = new Entity('TestEntity', 1);
            const scene = builder.withEntity(entity).build();
            
            expect(scene.entities.count).toBe(1);
            expect(scene.findEntity('TestEntity')).toBe(entity);
        });

        test('应该能够使用实体构建器添加实体', () => {
            const scene = builder
                .withEntityBuilder((builder) => {
                    return builder
                        .named('BuilderEntity')
                        .with(new TestComponent(100));
                })
                .build();
            
            expect(scene.entities.count).toBe(1);
            expect(scene.findEntity('BuilderEntity')).not.toBeNull();
        });

        test('应该能够批量添加实体', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            const entity3 = new Entity('Entity3', 3);
            
            const scene = builder
                .withEntities(entity1, entity2, entity3)
                .build();
            
            expect(scene.entities.count).toBe(3);
        });

        test('应该能够添加系统', () => {
            const system = new TestSystem();
            const scene = builder.withSystem(system).build();
            
            expect(scene.systems.length).toBe(1);
            expect(scene.systems[0]).toBe(system);
        });

        test('应该能够批量添加系统', () => {
            const system1 = new TestSystem();
            const system2 = new TestSystem();
            
            const scene = builder
                .withSystems(system1, system2)
                .build();
            
            expect(scene.systems.length).toBe(2);
        });

        test('流式调用应该工作正常', () => {
            const entity = new Entity('TestEntity', 1);
            const system = new TestSystem();
            
            const scene = builder
                .named('ComplexScene')
                .withEntity(entity)
                .withSystem(system)
                .withEntityBuilder((builder) => {
                    return builder.named('BuilderEntity');
                })
                .build();
            
            expect(scene.name).toBe('ComplexScene');
            expect(scene.entities.count).toBe(2);
            expect(scene.systems.length).toBe(1);
        });
    });

    describe('ComponentBuilder - 组件构建器', () => {
        test('应该能够创建组件构建器', () => {
            const builder = new ComponentBuilder(TestComponent, 100);
            expect(builder).toBeInstanceOf(ComponentBuilder);
        });

        test('应该能够设置组件属性', () => {
            const component = new ComponentBuilder(TestComponent, 100)
                .set('value', 200)
                .build();
            
            expect(component.value).toBe(200);
        });

        test('应该能够使用配置函数', () => {
            const component = new ComponentBuilder(PositionComponent, 10, 20)
                .configure((comp) => {
                    comp.x = 30;
                    comp.y = 40;
                })
                .build();
            
            expect(component.x).toBe(30);
            expect(component.y).toBe(40);
        });

        test('应该能够条件性设置属性', () => {
            const component = new ComponentBuilder(TestComponent, 100)
                .setIf(true, 'value', 200)
                .setIf(false, 'value', 300)
                .build();
            
            expect(component.value).toBe(200);
        });

        test('流式调用应该工作正常', () => {
            const component = new ComponentBuilder(PositionComponent, 0, 0)
                .set('x', 10)
                .set('y', 20)
                .setIf(true, 'x', 30)
                .configure((comp) => {
                    comp.y = 40;
                })
                .build();
            
            expect(component.x).toBe(30);
            expect(component.y).toBe(40);
        });
    });

    describe('ECSFluentAPI - 主API', () => {
        let api: ECSFluentAPI;

        beforeEach(() => {
            api = new ECSFluentAPI(scene, querySystem, eventSystem);
        });

        test('应该能够创建ECS API', () => {
            expect(api).toBeInstanceOf(ECSFluentAPI);
        });

        test('应该能够创建实体构建器', () => {
            const builder = api.createEntity();
            expect(builder).toBeInstanceOf(EntityBuilder);
        });

        test('应该能够创建场景构建器', () => {
            const builder = api.createScene();
            expect(builder).toBeInstanceOf(SceneBuilder);
        });

        test('应该能够创建组件构建器', () => {
            const builder = api.createComponent(TestComponent, 100);
            expect(builder).toBeInstanceOf(ComponentBuilder);
        });

        test('应该能够创建查询构建器', () => {
            const builder = api.query();
            expect(builder).toBeDefined();
        });

        test('应该能够查找实体', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestComponent(100));
            querySystem.setEntities([entity]);
            
            const results = api.find(TestComponent);
            expect(results.length).toBe(1);
            expect(results[0]).toBe(entity);
        });

        test('应该能够查找第一个匹配的实体', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            entity1.addComponent(new TestComponent(100));
            entity2.addComponent(new TestComponent(200));
            querySystem.setEntities([entity1, entity2]);
            
            const result = api.findFirst(TestComponent);
            expect(result).not.toBeNull();
            expect([entity1, entity2]).toContain(result);
        });

        test('查找不存在的实体应该返回null', () => {
            const result = api.findFirst(TestComponent);
            expect(result).toBeNull();
        });

        test('应该能够按名称查找实体', () => {
            const entity = scene.createEntity('TestEntity');
            
            const result = api.findByName('TestEntity');
            expect(result).toBe(entity);
        });

        test('应该能够按标签查找实体', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            entity1.tag = 42;
            entity2.tag = 42;
            
            const results = api.findByTag(42);
            expect(results.length).toBe(2);
            expect(results).toContain(entity1);
            expect(results).toContain(entity2);
        });

        test('应该能够触发同步事件', () => {
            let eventReceived = false;
            let eventData: any = null;
            
            api.on('test:event', (data) => {
                eventReceived = true;
                eventData = data;
            });
            
            api.emit('test:event', { message: 'hello' });
            
            expect(eventReceived).toBe(true);
            expect(eventData.message).toBe('hello');
        });

        test('应该能够触发异步事件', async () => {
            let eventReceived = false;
            let eventData: any = null;
            
            api.on('test:event', (data) => {
                eventReceived = true;
                eventData = data;
            });
            
            await api.emitAsync('test:event', { message: 'hello' });
            
            expect(eventReceived).toBe(true);
            expect(eventData.message).toBe('hello');
        });

        test('应该能够一次性监听事件', () => {
            let callCount = 0;
            
            api.once('test:event', () => {
                callCount++;
            });
            
            api.emit('test:event', {});
            api.emit('test:event', {});
            
            expect(callCount).toBe(1);
        });

        test('应该能够移除事件监听器', () => {
            let callCount = 0;
            
            const listenerId = api.on('test:event', () => {
                callCount++;
            });
            
            api.emit('test:event', {});
            api.off('test:event', listenerId);
            api.emit('test:event', {});
            
            expect(callCount).toBe(1);
        });

        test('应该能够创建批量操作器', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            const batch = api.batch([entity1, entity2]);
            expect(batch).toBeInstanceOf(EntityBatchOperator);
        });

        test('应该能够获取统计信息', () => {
            const stats = api.getStats();
            
            expect(stats).toBeDefined();
            expect(stats.entityCount).toBeDefined();
            expect(stats.systemCount).toBeDefined();
            expect(stats.componentStats).toBeDefined();
            expect(stats.queryStats).toBeDefined();
            expect(stats.eventStats).toBeDefined();
        });
    });

    describe('EntityBatchOperator - 批量操作器', () => {
        let entity1: Entity;
        let entity2: Entity;
        let entity3: Entity;
        let batchOp: EntityBatchOperator;

        beforeEach(() => {
            entity1 = new Entity('Entity1', 1);
            entity2 = new Entity('Entity2', 2);
            entity3 = new Entity('Entity3', 3);
            batchOp = new EntityBatchOperator([entity1, entity2, entity3]);
        });

        test('应该能够创建批量操作器', () => {
            expect(batchOp).toBeInstanceOf(EntityBatchOperator);
        });

        test('应该能够批量添加组件', () => {
            const component = new TestComponent(100);
            batchOp.addComponent(component);
            
            expect(entity1.hasComponent(TestComponent)).toBe(true);
            expect(entity2.hasComponent(TestComponent)).toBe(true);
            expect(entity3.hasComponent(TestComponent)).toBe(true);
        });

        test('应该能够批量移除组件', () => {
            entity1.addComponent(new TestComponent(100));
            entity2.addComponent(new TestComponent(200));
            entity3.addComponent(new TestComponent(300));
            
            batchOp.removeComponent(TestComponent);
            
            expect(entity1.hasComponent(TestComponent)).toBe(false);
            expect(entity2.hasComponent(TestComponent)).toBe(false);
            expect(entity3.hasComponent(TestComponent)).toBe(false);
        });

        test('应该能够批量设置活跃状态', () => {
            batchOp.setActive(false);
            
            expect(entity1.active).toBe(false);
            expect(entity2.active).toBe(false);
            expect(entity3.active).toBe(false);
        });

        test('应该能够批量设置标签', () => {
            batchOp.setTag(42);
            
            expect(entity1.tag).toBe(42);
            expect(entity2.tag).toBe(42);
            expect(entity3.tag).toBe(42);
        });

        test('应该能够批量执行操作', () => {
            const names: string[] = [];
            const indices: number[] = [];
            
            batchOp.forEach((entity, index) => {
                names.push(entity.name);
                indices.push(index);
            });
            
            expect(names).toEqual(['Entity1', 'Entity2', 'Entity3']);
            expect(indices).toEqual([0, 1, 2]);
        });

        test('应该能够过滤实体', () => {
            entity1.tag = 1;
            entity2.tag = 2;
            entity3.tag = 1;
            
            const filtered = batchOp.filter(entity => entity.tag === 1);
            
            expect(filtered.count()).toBe(2);
            expect(filtered.toArray()).toContain(entity1);
            expect(filtered.toArray()).toContain(entity3);
        });

        test('应该能够获取实体数组', () => {
            const entities = batchOp.toArray();
            
            expect(entities.length).toBe(3);
            expect(entities).toContain(entity1);
            expect(entities).toContain(entity2);
            expect(entities).toContain(entity3);
        });

        test('应该能够获取实体数量', () => {
            expect(batchOp.count()).toBe(3);
        });

        test('流式调用应该工作正常', () => {
            const result = batchOp
                .addComponent(new TestComponent(100))
                .setActive(false)
                .setTag(42)
                .forEach((entity) => {
                    entity.name = entity.name + '_Modified';
                });
            
            expect(result).toBe(batchOp);
            expect(entity1.hasComponent(TestComponent)).toBe(true);
            expect(entity1.active).toBe(false);
            expect(entity1.tag).toBe(42);
            expect(entity1.name).toBe('Entity1_Modified');
        });
    });

    describe('工厂函数和全局API', () => {
        test('createECSAPI应该创建API实例', () => {
            const api = createECSAPI(scene, querySystem, eventSystem);
            expect(api).toBeInstanceOf(ECSFluentAPI);
        });

        test('initializeECS应该初始化全局ECS', () => {
            initializeECS(scene, querySystem, eventSystem);
            expect(ECS).toBeInstanceOf(ECSFluentAPI);
        });

        test('全局ECS应该可用', () => {
            initializeECS(scene, querySystem, eventSystem);
            
            const builder = ECS.createEntity();
            expect(builder).toBeInstanceOf(EntityBuilder);
        });
    });
});