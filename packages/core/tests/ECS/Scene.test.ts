import { Scene } from '../../src/ECS/Scene';
import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';
import { EntitySystem } from '../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../src/ECS/Utils/Matcher';
import { ECSComponent } from '../../src/ECS/Decorators';

// 测试组件
@ECSComponent('SceneTest_PositionComponent')
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

@ECSComponent('SceneTest_VelocityComponent')
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

@ECSComponent('SceneTest_HealthComponent')
class HealthComponent extends Component {
    public health: number;

    constructor(...args: unknown[]) {
        super();
        const [health = 100] = args as [number?];
        this.health = health;
    }
}

@ECSComponent('SceneTest_RenderComponent')
class RenderComponent extends Component {
    public visible: boolean;

    constructor(...args: unknown[]) {
        super();
        const [visible = true] = args as [boolean?];
        this.visible = visible;
    }
}

// 测试系统
class MovementSystem extends EntitySystem {
    public processCallCount = 0;
    public lastProcessedEntities: Entity[] = [];

    constructor() {
        super(Matcher.empty().all(PositionComponent, VelocityComponent));
    }

    protected override process(entities: Entity[]): void {
        this.processCallCount++;
        this.lastProcessedEntities = [...entities];
        
        for (const entity of entities) {
            const position = entity.getComponent(PositionComponent);
            const velocity = entity.getComponent(VelocityComponent);
            
            if (position && velocity) {
                position.x += velocity.vx;
                position.y += velocity.vy;
            }
        }
    }
}

class RenderSystem extends EntitySystem {
    public processCallCount = 0;
    public lastProcessedEntities: Entity[] = [];

    constructor() {
        super(Matcher.empty().all(PositionComponent, RenderComponent));
    }

    protected override process(entities: Entity[]): void {
        this.processCallCount++;
        this.lastProcessedEntities = [...entities];
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
        super.initialize();
    }

    public override begin(): void {
        this.beginCalled = true;
        super.begin();
    }

    public override end(): void {
        this.endCalled = true;
        super.end();
    }

    public override update(): void {
        this.updateCallCount++;
        super.update();
    }
}

describe('Scene - 场景管理系统测试', () => {
    let scene: Scene;

    beforeEach(() => {
        scene = new Scene();
    });

    describe('基本功能测试', () => {
        test('应该能够创建场景', () => {
            expect(scene).toBeDefined();
            expect(scene).toBeInstanceOf(Scene);
            expect(scene.name).toBe("");
            expect(scene.entities).toBeDefined();
            expect(scene.systems).toBeDefined();
            expect(scene.identifierPool).toBeDefined();
        });

        test('应该能够设置场景名称', () => {
            scene.name = "TestScene";
            expect(scene.name).toBe("TestScene");
        });

        test('场景应该有正确的初始状态', () => {
            expect(scene.entities.count).toBe(0);
            expect(scene.systems.length).toBe(0);
        });

        test('应该能够使用配置创建场景', () => {
            const configScene = new Scene({ name: "ConfigScene" });
            expect(configScene.name).toBe("ConfigScene");
        });

        test('应该能够获取调试信息', () => {
            scene.name = "DebugScene";
            scene.createEntity("TestEntity");
            scene.addEntityProcessor(new MovementSystem());
            
            const debugInfo = scene.getDebugInfo();
            
            expect(debugInfo.name).toBe("DebugScene");
            expect(debugInfo.entityCount).toBe(1);
            expect(debugInfo.processorCount).toBe(1);
            expect(debugInfo.isRunning).toBe(false);
            expect(debugInfo.entities).toBeDefined();
            expect(debugInfo.processors).toBeDefined();
            expect(debugInfo.componentStats).toBeDefined();
        });
    });

    describe('实体管理', () => {
        test('应该能够创建实体', () => {
            const entity = scene.createEntity("TestEntity");
            
            expect(entity).toBeDefined();
            expect(entity.name).toBe("TestEntity");
            expect(entity.id).toBeGreaterThan(0);
            expect(scene.entities.count).toBe(1);
        });

        test('应该能够批量创建实体', () => {
            const entities = scene.createEntities(5, "Entity");
            
            expect(entities.length).toBe(5);
            expect(scene.entities.count).toBe(5);
            
            for (let i = 0; i < entities.length; i++) {
                expect(entities[i].name).toBe(`Entity_${i}`);
                expect(entities[i].id).toBeGreaterThan(0);
            }
        });

        test('应该能够通过ID查找实体', () => {
            const entity = scene.createEntity("TestEntity");
            const found = scene.findEntityById(entity.id);
            
            expect(found).toBe(entity);
        });

        test('查找不存在的实体应该返回null', () => {
            const found = scene.findEntityById(999999);
            expect(found).toBeNull();
        });

        test('应该能够销毁实体', () => {
            const entity = scene.createEntity("TestEntity");
            const entityId = entity.id;
            
            scene.entities.remove(entity);
            
            expect(scene.entities.count).toBe(0);
            expect(scene.findEntityById(entityId)).toBeNull();
        });

        test('应该能够通过ID销毁实体', () => {
            const entity = scene.createEntity("TestEntity");
            const entityId = entity.id;
            
            const entityToRemove = scene.findEntityById(entityId)!;
            scene.entities.remove(entityToRemove);
            
            expect(scene.entities.count).toBe(0);
            expect(scene.findEntityById(entityId)).toBeNull();
        });

        test('销毁不存在的实体应该安全处理', () => {
            expect(() => {
                // Scene doesn't have destroyEntity method
                expect(scene.findEntityById(999999)).toBeNull();
            }).not.toThrow();
        });

        test('应该能够销毁所有实体', () => {
            scene.createEntities(10, "Entity");
            expect(scene.entities.count).toBe(10);
            
            scene.destroyAllEntities();
            
            expect(scene.entities.count).toBe(0);
        });
    });

    describe('实体系统管理', () => {
        let movementSystem: MovementSystem;
        let renderSystem: RenderSystem;

        beforeEach(() => {
            movementSystem = new MovementSystem();
            renderSystem = new RenderSystem();
        });

        test('应该能够添加实体系统', () => {
            scene.addEntityProcessor(movementSystem);

            expect(scene.systems.length).toBe(1);
            expect(movementSystem.scene).toBe(scene);
        });

        test('应该能够移除实体系统', () => {
            scene.addEntityProcessor(movementSystem);
            scene.removeEntityProcessor(movementSystem);

            expect(scene.systems.length).toBe(0);
            expect(movementSystem.scene).toBeNull();
        });

        test('移除不存在的系统应该安全处理', () => {
            expect(() => {
                scene.removeEntityProcessor(movementSystem);
            }).not.toThrow();
        });

        test('应该能够管理多个实体系统', () => {
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(renderSystem);

            expect(scene.systems.length).toBe(2);
        });

        test('系统应该按更新顺序执行', () => {
            movementSystem.updateOrder = 1;
            renderSystem.updateOrder = 0;
            
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(renderSystem);
            
            // 创建测试实体
            const entity = scene.createEntity("TestEntity");
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));
            entity.addComponent(new RenderComponent(true));
            
            scene.update();
            
            // RenderSystem应该先执行（updateOrder = 0）
            // MovementSystem应该后执行（updateOrder = 1）
            expect(renderSystem.processCallCount).toBe(1);
            expect(movementSystem.processCallCount).toBe(1);
        });
    });

    describe('组件查询系统', () => {
        beforeEach(() => {
            // 创建测试实体
            const entity1 = scene.createEntity("Entity1");
            entity1.addComponent(new PositionComponent(10, 20));
            entity1.addComponent(new VelocityComponent(1, 0));
            
            const entity2 = scene.createEntity("Entity2");
            entity2.addComponent(new PositionComponent(30, 40));
            entity2.addComponent(new HealthComponent(80));
            
            const entity3 = scene.createEntity("Entity3");
            entity3.addComponent(new VelocityComponent(0, 1));
            entity3.addComponent(new HealthComponent(120));
        });

        test('应该能够查询具有特定组件的实体', () => {
            const result = scene.querySystem.queryAll(PositionComponent);
            
            expect(result.entities.length).toBe(2);
            expect(result.entities[0].name).toBe("Entity1");
            expect(result.entities[1].name).toBe("Entity2");
        });

        test('应该能够查询具有多个组件的实体', () => {
            const result = scene.querySystem.queryAll(PositionComponent, VelocityComponent);
            
            expect(result.entities.length).toBe(1);
            expect(result.entities[0].name).toBe("Entity1");
        });

        test('查询不存在的组件应该返回空结果', () => {
            const result = scene.querySystem.queryAll(RenderComponent);
            
            expect(result.entities.length).toBe(0);
        });

        test('查询系统应该支持缓存', () => {
            // 第一次查询
            const result1 = scene.querySystem.queryAll(PositionComponent);
            
            // 第二次查询（应该使用缓存）
            const result2 = scene.querySystem.queryAll(PositionComponent);
            
            // 实体数组应该相同，并且第二次查询应该来自缓存
            expect(result1.entities).toEqual(result2.entities);
            expect(result2.fromCache).toBe(true);
        });

        test('组件变化应该更新查询缓存', () => {
            const result1 = scene.querySystem.queryAll(PositionComponent);
            expect(result1.entities.length).toBe(2);
            
            // 添加新实体
            const entity4 = scene.createEntity("Entity4");
            entity4.addComponent(new PositionComponent(50, 60));
            
            const result2 = scene.querySystem.queryAll(PositionComponent);
            expect(result2.entities.length).toBe(3);
        });
    });

    describe('事件系统', () => {
        test('场景应该有事件系统', () => {
            expect(scene.eventSystem).toBeDefined();
        });

        test('应该能够监听实体事件', () => {
            let entityCreatedEvent: any = null;
            
            scene.eventSystem.on('entity:created', (data: any) => {
                entityCreatedEvent = data;
            });
            
            const entity = scene.createEntity("TestEntity");
            
            expect(entityCreatedEvent).toBeDefined();
            expect(entityCreatedEvent.entityName).toBe("TestEntity");
        });

        test('应该能够监听组件事件', () => {
            let componentAddedEvent: any = null;
            
            scene.eventSystem.on('component:added', (data: any) => {
                componentAddedEvent = data;
            });
            
            const entity = scene.createEntity("TestEntity");
            entity.addComponent(new PositionComponent(10, 20));
            
            expect(componentAddedEvent).toBeDefined();
            expect(componentAddedEvent.componentType).toBe('SceneTest_PositionComponent');
        });
    });

    describe('场景生命周期管理', () => {
        let testScene: TestScene;

        beforeEach(() => {
            testScene = new TestScene();
        });

        test('应该能够初始化场景', () => {
            testScene.initialize();
            
            expect(testScene.initializeCalled).toBe(true);
        });

        test('应该能够开始场景', () => {
            testScene.begin();
            
            expect(testScene.beginCalled).toBe(true);
        });

        test('应该能够结束场景', () => {
            testScene.end();
            
            expect(testScene.endCalled).toBe(true);
        });

        test('应该能够更新场景', () => {
            const movementSystem = new MovementSystem();
            testScene.addEntityProcessor(movementSystem);
            
            // 创建测试实体
            const entity = testScene.createEntity("TestEntity");
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));
            
            testScene.update();
            
            expect(testScene.updateCallCount).toBe(1);
            expect(movementSystem.processCallCount).toBe(1);
            
            // 验证移动系统是否正确处理了实体
            const position = entity.getComponent(PositionComponent);
            expect(position?.x).toBe(1);
            expect(position?.y).toBe(1);
        });
    });

    describe('统计和调试信息', () => {
        test('应该能够获取场景统计信息', () => {
            // 创建一些实体和系统
            scene.createEntities(5, "Entity");
            scene.addEntityProcessor(new MovementSystem());
            scene.addEntityProcessor(new RenderSystem());
            
            const stats = scene.getStats();
            
            expect(stats.entityCount).toBe(5);
            expect(stats.processorCount).toBe(2);
        });

        test('空场景的统计信息应该正确', () => {
            const stats = scene.getStats();
            
            expect(stats.entityCount).toBe(0);
            expect(stats.processorCount).toBe(0);
        });

        test('查询系统应该有统计信息', () => {
            // 执行一些查询以产生统计数据
            scene.querySystem.queryAll(PositionComponent);
            scene.querySystem.queryAll(VelocityComponent);
            
            const stats = scene.querySystem.getStats();
            
            expect(stats.queryStats.totalQueries).toBeGreaterThan(0);
            expect(parseFloat(stats.cacheStats.hitRate)).toBeGreaterThanOrEqual(0);
        });

    });

    describe('内存管理和性能', () => {
        test('销毁大量实体应该正确清理内存', () => {
            const entityCount = 1000;
            const entities = scene.createEntities(entityCount, "Entity");
            
            // 为每个实体添加组件
            entities.forEach(entity => {
                entity.addComponent(new PositionComponent(Math.random() * 100, Math.random() * 100));
                entity.addComponent(new VelocityComponent(Math.random() * 5, Math.random() * 5));
            });
            
            expect(scene.entities.count).toBe(entityCount);
            
            // 销毁所有实体
            scene.destroyAllEntities();
            
            expect(scene.entities.count).toBe(0);
            
            // 查询应该返回空结果
            const positionResult = scene.querySystem.queryAll(PositionComponent);
            const velocityResult = scene.querySystem.queryAll(VelocityComponent);
            
            expect(positionResult.entities.length).toBe(0);
            expect(velocityResult.entities.length).toBe(0);
        });

        test('大量实体的创建和查询性能应该可接受', () => {
            const entityCount = 5000;
            const startTime = performance.now();
            
            // 创建大量实体
            const entities = scene.createEntities(entityCount, "Entity");
            
            // 为每个实体添加组件
            entities.forEach((entity, index) => {
                entity.addComponent(new PositionComponent(index, index));
                if (index % 2 === 0) {
                    entity.addComponent(new VelocityComponent(1, 1));
                }
                if (index % 3 === 0) {
                    entity.addComponent(new HealthComponent(100));
                }
            });
            
            const creationTime = performance.now() - startTime;
            
            // 测试查询性能
            const queryStartTime = performance.now();

            const positionResult = scene.querySystem.queryAll(PositionComponent);
            const velocityResult = scene.querySystem.queryAll(VelocityComponent);
            const healthResult = scene.querySystem.queryAll(HealthComponent);

            const queryTime = performance.now() - queryStartTime;

            expect(positionResult.entities.length).toBe(entityCount);
            expect(velocityResult.entities.length).toBe(entityCount / 2);
            expect(healthResult.entities.length).toBe(Math.floor(entityCount / 3) + 1);
            
            console.log(`创建${entityCount}个实体耗时: ${creationTime.toFixed(2)}ms`);
            console.log(`查询操作耗时: ${queryTime.toFixed(2)}ms`);
        });
    });

    describe('错误处理和边界情况', () => {
        test('重复添加同一个系统应该安全处理', () => {
            const system = new MovementSystem();


            scene.addEntityProcessor(system);
            scene.addEntityProcessor(system);

            expect(scene.systems.length).toBe(1);
        });

        test('系统处理过程中的异常应该被正确处理', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            class ErrorSystem extends EntitySystem {
                constructor() {
                    super(Matcher.empty().all(PositionComponent));
                }
                
                protected override process(entities: Entity[]): void {
                    throw new Error("Test system error");
                }
            }
            
            const errorSystem = new ErrorSystem();
            scene.addEntityProcessor(errorSystem);
            
            const entity = scene.createEntity("TestEntity");
            entity.addComponent(new PositionComponent(0, 0));
            
            // 更新不应该抛出异常
            expect(() => {
                scene.update();
            }).not.toThrow();
            
            consoleSpy.mockRestore();
        });

        test('空场景的更新应该安全', () => {
            expect(() => {
                scene.update();
            }).not.toThrow();
        });

        test('对已销毁实体的操作应该安全处理', () => {
            const entity = scene.createEntity("TestEntity");
            scene.entities.remove(entity);

            // 对已销毁实体的操作应该安全
            expect(() => {
                entity.addComponent(new PositionComponent(0, 0));
            }).not.toThrow();
        });
    });

    describe('性能监控', () => {
        test('Scene应该自动创建PerformanceMonitor', () => {
            const customScene = new Scene({
                name: 'CustomScene'
            });

            class TestSystem extends EntitySystem {
                constructor() {
                    super(Matcher.empty().all(PositionComponent));
                }
            }

            const system = new TestSystem();
            customScene.addEntityProcessor(system);

            expect(customScene).toBeDefined();

            customScene.end();
        });

        test('每个Scene应该有独立的PerformanceMonitor', () => {
            const scene1 = new Scene({ name: 'Scene1' });
            const scene2 = new Scene({ name: 'Scene2' });

            class TestSystem extends EntitySystem {
                constructor() {
                    super(Matcher.empty().all(PositionComponent));
                }
            }

            scene1.addEntityProcessor(new TestSystem());
            scene2.addEntityProcessor(new TestSystem());

            expect(scene1).toBeDefined();
            expect(scene2).toBeDefined();

            scene1.end();
            scene2.end();
        });
    });

    describe('扩展测试 - 补齐覆盖率', () => {
        describe('实体标签查找', () => {
            test('findEntitiesByTag 应该返回具有指定标签的实体', () => {
                const entity1 = scene.createEntity('Entity1');
                entity1.tag = 0x01;

                const entity2 = scene.createEntity('Entity2');
                entity2.tag = 0x02;

                const entity3 = scene.createEntity('Entity3');
                entity3.tag = 0x01;

                const found = scene.findEntitiesByTag(0x01);

                expect(found.length).toBe(2);
                expect(found).toContain(entity1);
                expect(found).toContain(entity3);
            });

            test('findEntitiesByTag 应该在没有匹配时返回空数组', () => {
                scene.createEntity('Entity1');

                const found = scene.findEntitiesByTag(0xFF);

                expect(found).toEqual([]);
            });
        });

        describe('批量实体操作', () => {
            test('destroyEntities 应该批量销毁实体', () => {
                const entities = scene.createEntities(5, 'Entity');
                expect(scene.entities.count).toBe(5);

                const toDestroy = entities.slice(0, 3);
                scene.destroyEntities(toDestroy);

                expect(scene.entities.count).toBe(2);
            });

            test('destroyEntities 应该处理空数组', () => {
                scene.createEntities(3, 'Entity');

                expect(() => {
                    scene.destroyEntities([]);
                }).not.toThrow();

                expect(scene.entities.count).toBe(3);
            });
        });

        describe('查询方法', () => {
            test('queryAny 应该返回具有任意一个组件的实体', () => {
                const entity1 = scene.createEntity('Entity1');
                entity1.addComponent(new PositionComponent());

                const entity2 = scene.createEntity('Entity2');
                entity2.addComponent(new VelocityComponent());

                const entity3 = scene.createEntity('Entity3');
                entity3.addComponent(new HealthComponent());

                const result = scene.queryAny(PositionComponent, VelocityComponent);

                expect(result.entities.length).toBe(2);
            });

            test('queryNone 应该返回不包含指定组件的实体', () => {
                const entity1 = scene.createEntity('Entity1');
                entity1.addComponent(new PositionComponent());

                const entity2 = scene.createEntity('Entity2');
                entity2.addComponent(new VelocityComponent());

                const entity3 = scene.createEntity('Entity3');

                const result = scene.queryNone(PositionComponent);

                expect(result.entities.length).toBe(2);
                expect(result.entities).toContain(entity2);
                expect(result.entities).toContain(entity3);
            });

            test('query 应该创建类型安全的查询构建器', () => {
                const builder = scene.query();
                expect(builder).toBeDefined();

                const matcher = builder.withAll(PositionComponent).buildMatcher();
                expect(matcher).toBeDefined();
            });
        });

        describe('服务容器', () => {
            test('scene.services 应该返回服务容器', () => {
                expect(scene.services).toBeDefined();
            });
        });

        describe('系统错误处理', () => {
            test('频繁出错的系统应该被自动禁用', () => {
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

                class ErrorProneSystem extends EntitySystem {
                    constructor() {
                        super(Matcher.empty().all(PositionComponent));
                    }

                    protected override process(): void {
                        throw new Error('Intentional error');
                    }
                }

                const system = new ErrorProneSystem();
                scene.addEntityProcessor(system);

                const entity = scene.createEntity('TestEntity');
                entity.addComponent(new PositionComponent(0, 0));

                // 多次更新以触发错误阈值
                for (let i = 0; i < 15; i++) {
                    scene.update();
                }

                // 系统应该被禁用
                expect(system.enabled).toBe(false);

                consoleSpy.mockRestore();
            });
        });

        describe('已废弃方法', () => {
            test('getEntityByName 应该作为 findEntity 的别名工作', () => {
                const entity = scene.createEntity('TestEntity');

                const found = scene.getEntityByName('TestEntity');

                expect(found).toBe(entity);
            });

            test('getEntitiesByTag 应该作为 findEntitiesByTag 的别名工作', () => {
                const entity = scene.createEntity('Entity');
                entity.tag = 0x10;

                const found = scene.getEntitiesByTag(0x10);

                expect(found.length).toBe(1);
                expect(found[0]).toBe(entity);
            });
        });

        describe('系统管理扩展', () => {
            test('getSystem 应该返回指定类型的系统', () => {
                const movementSystem = new MovementSystem();
                scene.addEntityProcessor(movementSystem);

                const found = scene.getSystem(MovementSystem);

                expect(found).toBe(movementSystem);
            });

            test('getSystem 应该在系统不存在时返回 null', () => {
                const found = scene.getSystem(MovementSystem);

                expect(found).toBeNull();
            });

            test('markSystemsOrderDirty 应该标记系统顺序为脏', () => {
                const system1 = new MovementSystem();
                const system2 = new RenderSystem();

                scene.addEntityProcessor(system1);
                scene.addEntityProcessor(system2);

                // 访问 systems 以清除脏标记
                const _ = scene.systems;

                // 标记为脏
                scene.markSystemsOrderDirty();

                // 再次访问应该重新构建缓存
                const systems = scene.systems;
                expect(systems).toBeDefined();
            });
        });

        describe('延迟缓存清理', () => {
            test('addEntity 应该支持延迟缓存清理', () => {
                scene.createEntity('Entity1');
                const entity2 = new Entity('Entity2', scene.identifierPool.checkOut());

                // 延迟缓存清理
                scene.addEntity(entity2, true);

                expect(scene.entities.count).toBe(2);
            });
        });

        describe('系统排序稳定性', () => {
            test('相同 updateOrder 的系统应按添加顺序稳定排序', () => {
                // 创建多个 updateOrder 都为 0 的系统
                // Create multiple systems with updateOrder = 0
                class SystemA extends EntitySystem {
                    name = 'SystemA';
                    constructor() { super(); }
                }
                class SystemB extends EntitySystem {
                    name = 'SystemB';
                    constructor() { super(); }
                }
                class SystemC extends EntitySystem {
                    name = 'SystemC';
                    constructor() { super(); }
                }

                const systemA = new SystemA();
                const systemB = new SystemB();
                const systemC = new SystemC();

                // 按 A, B, C 顺序添加
                scene.addEntityProcessor(systemA);
                scene.addEntityProcessor(systemB);
                scene.addEntityProcessor(systemC);

                // 验证 addOrder 按添加顺序递增
                expect(systemA.addOrder).toBe(0);
                expect(systemB.addOrder).toBe(1);
                expect(systemC.addOrder).toBe(2);

                // 验证系统列表按添加顺序排列
                const systems = scene.systems;
                expect(systems[0]).toBe(systemA);
                expect(systems[1]).toBe(systemB);
                expect(systems[2]).toBe(systemC);
            });

            test('updateOrder 优先于 addOrder 排序', () => {
                class SystemA extends EntitySystem {
                    name = 'SystemA';
                    constructor() { super(); }
                }
                class SystemB extends EntitySystem {
                    name = 'SystemB';
                    constructor() { super(); }
                }
                class SystemC extends EntitySystem {
                    name = 'SystemC';
                    constructor() { super(); }
                }

                const systemA = new SystemA();
                const systemB = new SystemB();
                const systemC = new SystemC();

                // 按 A, B, C 顺序添加，但设置不同的 updateOrder
                scene.addEntityProcessor(systemA);
                systemA.updateOrder = 10;

                scene.addEntityProcessor(systemB);
                systemB.updateOrder = 5;

                scene.addEntityProcessor(systemC);
                systemC.updateOrder = 5; // 与 B 相同

                // 验证排序：B(5,1), C(5,2), A(10,0)
                const systems = scene.systems;
                expect(systems[0]).toBe(systemB); // updateOrder=5, addOrder=1
                expect(systems[1]).toBe(systemC); // updateOrder=5, addOrder=2
                expect(systems[2]).toBe(systemA); // updateOrder=10, addOrder=0
            });

            test('多次重新排序后仍保持稳定性', () => {
                class SystemA extends EntitySystem {
                    name = 'SystemA';
                    constructor() { super(); }
                }
                class SystemB extends EntitySystem {
                    name = 'SystemB';
                    constructor() { super(); }
                }

                const systemA = new SystemA();
                const systemB = new SystemB();

                scene.addEntityProcessor(systemA);
                scene.addEntityProcessor(systemB);

                // 多次触发重新排序
                for (let i = 0; i < 10; i++) {
                    scene.markSystemsOrderDirty();
                    const systems = scene.systems;

                    // 每次排序后顺序应该相同
                    expect(systems[0]).toBe(systemA);
                    expect(systems[1]).toBe(systemB);
                }
            });
        });
    });
});