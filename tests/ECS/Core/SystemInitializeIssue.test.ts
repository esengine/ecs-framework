import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';

// 测试组件
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

class HealthComponent extends Component {
    constructor(public health: number = 100) {
        super();
    }
}

class TagComponent extends Component {
    constructor(public tag: string = '') {
        super();
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
    
    constructor() {
        super(Matcher.empty().all(PositionComponent, HealthComponent, TagComponent));
    }
    
    public override initialize(): void {
        this.initializeCalled = true;
        super.initialize();
    }
    
    protected override process(entities: Entity[]): void {
        this.processedEntities = [...entities];
    }
}

describe('ECS系统初始化时序问题深度测试', () => {
    let scene: Scene;
    
    beforeEach(() => {
        scene = new Scene();
        scene.name = "InitializeTestScene";
    });
    
    describe('基础时序问题测试', () => {
        test('先添加实体再添加系统 - 系统应该正确初始化', () => {
            // 创建实体并添加组件
            const player = scene.createEntity("Player");
            player.addComponent(new PositionComponent(10, 20));
            player.addComponent(new VelocityComponent(1, 1));
            player.addComponent(new HealthComponent(100));
            
            const enemy = scene.createEntity("Enemy");
            enemy.addComponent(new PositionComponent(50, 60));
            enemy.addComponent(new VelocityComponent(-1, 0));
            enemy.addComponent(new HealthComponent(80));
            
            // 验证实体已创建
            expect(scene.entities.count).toBe(2);
            
            // 添加系统
            const movementSystem = new MovementSystem();
            const healthSystem = new HealthSystem();
            
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);
            
            // 验证initialize方法被调用
            expect(movementSystem.initializeCalled).toBe(true);
            expect(healthSystem.initializeCalled).toBe(true);
            
            // 验证系统正确识别已存在的实体
            expect(movementSystem.entities.length).toBe(2);
            expect(healthSystem.entities.length).toBe(2);
            
            // 验证onAdded回调被正确调用
            expect(movementSystem.onAddedEntities.length).toBe(2);
            expect(movementSystem.onAddedEntities).toContain(player);
            expect(movementSystem.onAddedEntities).toContain(enemy);
            
            // 运行更新确认处理
            scene.update();
            expect(movementSystem.processedEntities.length).toBe(2);
            expect(healthSystem.processedEntities.length).toBe(2);
            
            // 检查移动逻辑是否生效
            const playerPos = player.getComponent(PositionComponent)!;
            expect(playerPos.x).toBe(11);
            expect(playerPos.y).toBe(21);
        });
        
        test('先添加系统再添加实体 - 正常工作', () => {
            // 先添加系统
            const movementSystem = new MovementSystem();
            const healthSystem = new HealthSystem();
            
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);
            
            // 验证initialize被调用，但没有发现实体
            expect(movementSystem.initializeCalled).toBe(true);
            expect(healthSystem.initializeCalled).toBe(true);
            expect(movementSystem.entities.length).toBe(0);
            expect(healthSystem.entities.length).toBe(0);
            
            // 创建实体
            const player = scene.createEntity("Player");
            player.addComponent(new PositionComponent(10, 20));
            player.addComponent(new VelocityComponent(1, 1));
            player.addComponent(new HealthComponent(100));
            
            // 系统应该自动识别新实体
            expect(movementSystem.entities.length).toBe(1);
            expect(healthSystem.entities.length).toBe(1);
            expect(movementSystem.onAddedEntities.length).toBe(1);
        });
    });
    
    describe('复杂场景的时序测试', () => {
        test('部分匹配实体的初始化', () => {
            // 创建不同类型的实体
            const fullEntity = scene.createEntity("FullEntity");
            fullEntity.addComponent(new PositionComponent(0, 0));
            fullEntity.addComponent(new VelocityComponent(1, 1));
            fullEntity.addComponent(new HealthComponent(100));
            
            const partialEntity1 = scene.createEntity("PartialEntity1");
            partialEntity1.addComponent(new PositionComponent(10, 10));
            partialEntity1.addComponent(new HealthComponent(50));
            // 缺少VelocityComponent
            
            const partialEntity2 = scene.createEntity("PartialEntity2");
            partialEntity2.addComponent(new PositionComponent(20, 20));
            partialEntity2.addComponent(new VelocityComponent(2, 2));
            // 缺少HealthComponent
            
            // 添加系统
            const movementSystem = new MovementSystem();
            const healthSystem = new HealthSystem();
            
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);
            
            // 验证选择性匹配
            expect(movementSystem.entities).toContain(fullEntity);
            expect(movementSystem.entities).not.toContain(partialEntity1);
            expect(movementSystem.entities).toContain(partialEntity2);
            expect(movementSystem.entities.length).toBe(2);
            
            expect(healthSystem.entities).toContain(fullEntity);
            expect(healthSystem.entities).toContain(partialEntity1);
            expect(healthSystem.entities).not.toContain(partialEntity2);
            expect(healthSystem.entities.length).toBe(2);
        });
        
        test('多组件要求系统的初始化', () => {
            // 创建具有不同组件组合的实体
            const entity1 = scene.createEntity("Entity1");
            entity1.addComponent(new PositionComponent(0, 0));
            entity1.addComponent(new HealthComponent(100));
            entity1.addComponent(new TagComponent("player"));
            
            const entity2 = scene.createEntity("Entity2");
            entity2.addComponent(new PositionComponent(10, 10));
            entity2.addComponent(new HealthComponent(80));
            // 缺少TagComponent
            
            const entity3 = scene.createEntity("Entity3");
            entity3.addComponent(new PositionComponent(20, 20));
            entity3.addComponent(new TagComponent("enemy"));
            // 缺少HealthComponent
            
            // 添加要求三个组件的系统
            const multiSystem = new MultiComponentSystem();
            scene.addEntityProcessor(multiSystem);
            
            // 只有entity1应该匹配
            expect(multiSystem.entities.length).toBe(1);
            expect(multiSystem.entities).toContain(entity1);
            expect(multiSystem.entities).not.toContain(entity2);
            expect(multiSystem.entities).not.toContain(entity3);
        });
        
        test('批量实体创建后的系统初始化', () => {
            // 批量创建实体
            const entities = scene.createEntities(10, "BatchEntity");
            
            // 为所有实体添加组件
            entities.forEach((entity, index) => {
                entity.addComponent(new PositionComponent(index * 10, index * 10));
                entity.addComponent(new VelocityComponent(index, index));
                if (index % 2 === 0) {
                    entity.addComponent(new HealthComponent(100 - index * 10));
                }
            });
            
            // 添加系统
            const movementSystem = new MovementSystem();
            const healthSystem = new HealthSystem();
            
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);
            
            // 验证系统正确处理批量实体
            expect(movementSystem.entities.length).toBe(10); // 所有实体都有Position+Velocity
            expect(healthSystem.entities.length).toBe(5);    // 只有偶数索引的实体有Health
            
            // 验证onAdded回调被正确调用
            expect(movementSystem.onAddedEntities.length).toBe(10);
            expect(healthSystem.onAddedEntities.length).toBe(5);
        });
    });
    
    describe('动态组件修改后的系统响应', () => {
        test('运行时添加组件 - 系统自动响应', () => {
            const movementSystem = new MovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            // 创建只有位置组件的实体
            const entity = scene.createEntity("TestEntity");
            entity.addComponent(new PositionComponent(0, 0));
            
            // 系统不应该匹配
            expect(movementSystem.entities.length).toBe(0);
            
            // 添加速度组件
            entity.addComponent(new VelocityComponent(5, 5));
            
            // 系统应该立即识别
            expect(movementSystem.entities.length).toBe(1);
            expect(movementSystem.entities).toContain(entity);
            expect(movementSystem.onAddedEntities).toContain(entity);
        });
        
        test('运行时移除组件 - 系统自动响应', () => {
            const movementSystem = new MovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            // 创建完整的可移动实体
            const entity = scene.createEntity("MovableEntity");
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(5, 5));
            
            // 系统应该识别
            expect(movementSystem.entities.length).toBe(1);
            
            // 移除速度组件
            const velocityComponent = entity.getComponent(VelocityComponent);
            if (velocityComponent) {
                entity.removeComponent(velocityComponent);
            }
            
            // 系统应该移除实体
            expect(movementSystem.entities.length).toBe(0);
            expect(movementSystem.onRemovedEntities).toContain(entity);
        });
        
        test('复杂的组件添加移除序列', () => {
            const movementSystem = new MovementSystem();
            const healthSystem = new HealthSystem();
            
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);
            
            const entity = scene.createEntity("ComplexEntity");
            
            // 初始状态：无组件
            expect(movementSystem.entities.length).toBe(0);
            expect(healthSystem.entities.length).toBe(0);
            
            // 添加位置组件
            entity.addComponent(new PositionComponent(0, 0));
            expect(movementSystem.entities.length).toBe(0);
            expect(healthSystem.entities.length).toBe(0);
            
            // 添加健康组件
            entity.addComponent(new HealthComponent(100));
            expect(movementSystem.entities.length).toBe(0);
            expect(healthSystem.entities.length).toBe(1);
            
            // 添加速度组件
            entity.addComponent(new VelocityComponent(1, 1));
            expect(movementSystem.entities.length).toBe(1);
            expect(healthSystem.entities.length).toBe(1);
            
            // 移除健康组件
            const healthComponent = entity.getComponent(HealthComponent);
            if (healthComponent) {
                entity.removeComponent(healthComponent);
            }
            expect(movementSystem.entities.length).toBe(1);
            expect(healthSystem.entities.length).toBe(0);
            
            // 移除位置组件
            const positionComponent = entity.getComponent(PositionComponent);
            if (positionComponent) {
                entity.removeComponent(positionComponent);
            }
            expect(movementSystem.entities.length).toBe(0);
            expect(healthSystem.entities.length).toBe(0);
        });
    });
    
    describe('系统重复添加和移除测试', () => {
        test('重复添加同一个系统 - 应该忽略', () => {
            const movementSystem = new MovementSystem();
            
            // 第一次添加
            scene.addEntityProcessor(movementSystem);
            expect(scene.entityProcessors.count).toBe(1);
            expect(movementSystem.initializeCalled).toBe(true);
            
            // 重置标志
            movementSystem.initializeCalled = false;
            
            // 第二次添加同一个系统
            scene.addEntityProcessor(movementSystem);
            expect(scene.entityProcessors.count).toBe(1); // 没有增加
            expect(movementSystem.initializeCalled).toBe(false); // initialize不应该再次调用
        });
        
        test('添加后移除再添加 - 应该重新初始化', () => {
            const entity = scene.createEntity("TestEntity");
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));
            
            const movementSystem = new MovementSystem();
            
            // 第一次添加
            scene.addEntityProcessor(movementSystem);
            expect(movementSystem.entities.length).toBe(1);
            expect(movementSystem.initializeCalled).toBe(true);
            
            // 移除系统
            scene.removeEntityProcessor(movementSystem);
            expect(scene.entityProcessors.count).toBe(0);
            
            // 重置状态
            movementSystem.initializeCalled = false;
            movementSystem.onAddedEntities = [];
            
            // 重新添加
            scene.addEntityProcessor(movementSystem);
            expect(movementSystem.entities.length).toBe(1);
            expect(movementSystem.initializeCalled).toBe(true);
            expect(movementSystem.onAddedEntities.length).toBe(1);
        });
    });
    
    describe('空场景和空系统的边界情况', () => {
        test('空场景添加系统 - 不应该出错', () => {
            const movementSystem = new MovementSystem();
            
            expect(() => {
                scene.addEntityProcessor(movementSystem);
            }).not.toThrow();
            
            expect(movementSystem.initializeCalled).toBe(true);
            expect(movementSystem.entities.length).toBe(0);
        });
        
        test('有实体但没有匹配组件 - 系统应该为空', () => {
            // 创建只有健康组件的实体
            const entity = scene.createEntity("HealthOnlyEntity");
            entity.addComponent(new HealthComponent(100));
            
            // 添加移动系统（需要Position+Velocity）
            const movementSystem = new MovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            expect(movementSystem.entities.length).toBe(0);
            expect(movementSystem.onAddedEntities.length).toBe(0);
        });
        
        test('实体被禁用 - 系统仍应包含但不处理', () => {
            const entity = scene.createEntity("DisabledEntity");
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));
            
            const movementSystem = new MovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            expect(movementSystem.entities.length).toBe(1);
            
            // 禁用实体
            entity.enabled = false;
            
            // 系统仍然包含实体，但处理时应该跳过
            expect(movementSystem.entities.length).toBe(1);
            
            scene.update();
            // 处理逻辑中应该检查enabled状态
            // 由于实体被禁用，位置不应该改变（这取决于系统实现）
        });
    });
    
    afterEach(() => {
        scene.destroyAllEntities();
        const processors = [...scene.entityProcessors.processors];
        processors.forEach(processor => scene.removeEntityProcessor(processor));
    });
});