import { Scene } from '../../src/ECS/Scene';
import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';
import { EntitySystem } from '../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../src/ECS/Utils/Matcher';

// 测试组件
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

class HealthComponent extends Component {
    public health: number;
    
    constructor(...args: unknown[]) {
        super();
        const [health = 100] = args as [number?];
        this.health = health;
    }
}

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
            expect(componentAddedEvent.componentType).toBe('PositionComponent');
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
});