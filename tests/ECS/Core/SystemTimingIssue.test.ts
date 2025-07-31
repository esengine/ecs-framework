import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';

// 测试组件
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [x = 0, y = 0] = args as [number?, number?];
        this.x = x;
        this.y = y;
    }
}

class VelocityComponent extends Component {
    public vx: number = 0;
    public vy: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [vx = 0, vy = 0] = args as [number?, number?];
        this.vx = vx;
        this.vy = vy;
    }
}

class HealthComponent extends Component {
    public health: number = 100;
    
    constructor(...args: unknown[]) {
        super();
        const [health = 100] = args as [number?];
        this.health = health;
    }
}

// 测试系统
class MovementSystem extends EntitySystem {
    public processedEntities: Entity[] = [];
    
    constructor() {
        super(Matcher.empty().all(PositionComponent, VelocityComponent));
    }
    
    protected override process(entities: Entity[]): void {
        this.processedEntities = [...entities];
        // 简单的移动逻辑
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
    
    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }
    
    protected override process(entities: Entity[]): void {
        this.processedEntities = [...entities];
        // 简单的健康检查逻辑
        for (const entity of entities) {
            const health = entity.getComponent(HealthComponent)!;
            if (health.health <= 0) {
                // 标记为死亡，但不在这里销毁实体
                entity.enabled = false;
            }
        }
    }
}

describe('ECS系统时序问题测试', () => {
    let scene: Scene;
    
    beforeEach(() => {
        scene = new Scene();
        scene.name = "TimingTestScene";
    });
    
    describe('实体添加时序问题', () => {
        test(' 先添加实体再添加系统 - 暴露时序问题', () => {
            // 第一步：先创建并添加实体
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
            
            // 第二步：然后添加系统（这里可能出现时序问题）
            const movementSystem = new MovementSystem();
            const healthSystem = new HealthSystem();
            
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);
            
            // 验证系统已添加
            expect(scene.entityProcessors.count).toBe(2);
            
            //  关键测试：检查系统是否正确识别了已存在的实体
            console.log("MovementSystem匹配的实体数量:", movementSystem.entities.length);
            console.log("HealthSystem匹配的实体数量:", healthSystem.entities.length);
            console.log("Player组件:", player.components.map(c => c.constructor.name));
            console.log("Enemy组件:", enemy.components.map(c => c.constructor.name));
            
            // 预期结果：移动系统应该匹配到2个实体（都有Position+Velocity）
            expect(movementSystem.entities.length).toBe(2);
            // 预期结果：健康系统应该匹配到2个实体（都有Health）
            expect(healthSystem.entities.length).toBe(2);
            
            // 运行一次更新看看
            scene.update();
            
            // 检查系统是否处理了实体
            expect(movementSystem.processedEntities.length).toBe(2);
            expect(healthSystem.processedEntities.length).toBe(2);
            
            // 检查移动逻辑是否生效
            const playerPos = player.getComponent(PositionComponent)!;
            expect(playerPos.x).toBe(11); // 10 + 1
            expect(playerPos.y).toBe(21); // 20 + 1
        });
        
        test(' 先添加系统再添加实体 - 正常工作的情况', () => {
            // 第一步：先添加系统
            const movementSystem = new MovementSystem();
            const healthSystem = new HealthSystem();
            
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);
            
            // 验证系统已添加但没有实体
            expect(scene.entityProcessors.count).toBe(2);
            expect(movementSystem.entities.length).toBe(0);
            expect(healthSystem.entities.length).toBe(0);
            
            // 第二步：然后创建并添加实体
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
            
            //  关键测试：检查系统是否正确识别了新添加的实体
            console.log("MovementSystem匹配的实体数量:", movementSystem.entities.length);
            console.log("HealthSystem匹配的实体数量:", healthSystem.entities.length);
            
            // 预期结果：系统应该自动匹配到新实体
            expect(movementSystem.entities.length).toBe(2);
            expect(healthSystem.entities.length).toBe(2);
            
            // 运行一次更新
            scene.update();
            
            // 检查系统是否处理了实体
            expect(movementSystem.processedEntities.length).toBe(2);
            expect(healthSystem.processedEntities.length).toBe(2);
        });
    });
    
    describe('组件动态修改时序问题', () => {
        test(' 运行时动态添加组件 - 检查系统响应', () => {
            // 先设置好系统
            const movementSystem = new MovementSystem();
            const healthSystem = new HealthSystem();
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);
            
            // 创建只有位置组件的实体
            const entity = scene.createEntity("TestEntity");
            entity.addComponent(new PositionComponent(0, 0));
            
            // 初始状态：只有健康系统不匹配，移动系统不匹配
            expect(movementSystem.entities.length).toBe(0);
            expect(healthSystem.entities.length).toBe(0);
            
            // 动态添加速度组件
            entity.addComponent(new VelocityComponent(5, 5));
            
            //  关键测试：移动系统是否立即识别到这个实体
            console.log("添加VelocityComponent后MovementSystem实体数:", movementSystem.entities.length);
            expect(movementSystem.entities.length).toBe(1);
            
            // 动态添加健康组件
            entity.addComponent(new HealthComponent(50));
            
            //  关键测试：健康系统是否立即识别到这个实体  
            console.log("添加HealthComponent后HealthSystem实体数:", healthSystem.entities.length);
            expect(healthSystem.entities.length).toBe(1);
            
            // 运行更新确认处理
            scene.update();
            expect(movementSystem.processedEntities.length).toBe(1);
            expect(healthSystem.processedEntities.length).toBe(1);
        });
        
        test(' 运行时动态移除组件 - 检查系统响应', () => {
            // 先设置好系统
            const movementSystem = new MovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            // 创建完整的可移动实体
            const entity = scene.createEntity("MovableEntity");
            entity.addComponent(new PositionComponent(0, 0));
            entity.addComponent(new VelocityComponent(5, 5));
            
            // 确认系统识别了实体
            expect(movementSystem.entities.length).toBe(1);
            
            // 动态移除速度组件
            const velocityComponent = entity.getComponent(VelocityComponent);
            if (velocityComponent) {
                entity.removeComponent(velocityComponent);
            }
            
            //  关键测试：移动系统是否立即移除了这个实体
            console.log("移除VelocityComponent后MovementSystem实体数:", movementSystem.entities.length);
            expect(movementSystem.entities.length).toBe(0);
            
            // 重新添加速度组件
            entity.addComponent(new VelocityComponent(3, 3));
            
            //  关键测试：移动系统是否重新识别到这个实体
            console.log("重新添加VelocityComponent后MovementSystem实体数:", movementSystem.entities.length);
            expect(movementSystem.entities.length).toBe(1);
        });
    });
    
    describe('系统初始化时序问题', () => {
        test(' 系统initialize方法调用时机', () => {
            // 创建实体
            const entity1 = scene.createEntity("Entity1");
            entity1.addComponent(new PositionComponent(10, 10));
            entity1.addComponent(new VelocityComponent(1, 1));
            
            const entity2 = scene.createEntity("Entity2");
            entity2.addComponent(new PositionComponent(20, 20));
            entity2.addComponent(new VelocityComponent(2, 2));
            
            // 创建系统但先不添加到场景
            const movementSystem = new MovementSystem();
            
            // 检查系统初始状态
            expect(movementSystem.entities.length).toBe(0);
            
            // 添加系统到场景
            scene.addEntityProcessor(movementSystem);
            
            //  关键测试：系统是否在添加时正确初始化并发现已存在的实体
            console.log("系统添加后发现的实体数:", movementSystem.entities.length);
            
            // 这个测试会暴露initialize方法是否被正确调用
            expect(movementSystem.entities.length).toBe(2);
        });
        
        test(' 批量实体操作的时序问题', () => {
            const movementSystem = new MovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            // 批量创建实体
            const entities = scene.createEntities(5, "BatchEntity");
            
            // 为所有实体添加组件
            entities.forEach((entity, index) => {
                entity.addComponent(new PositionComponent(index * 10, index * 10));
                entity.addComponent(new VelocityComponent(index, index));
            });
            
            //  关键测试：系统是否识别了所有批量创建的实体
            console.log("批量操作后系统实体数:", movementSystem.entities.length);
            expect(movementSystem.entities.length).toBe(5);
            
            // 运行更新确认处理
            scene.update();
            expect(movementSystem.processedEntities.length).toBe(5);
        });
    });
    
    describe('事件装饰器时序问题', () => {
        // 模拟使用事件装饰器的系统
        class EventDecoratedSystem extends EntitySystem {
            public receivedEvents: any[] = [];
            
            constructor() {
                super(Matcher.empty().all(PositionComponent));
                // 模拟装饰器初始化
                this.initEventListeners();
            }
            
            // 模拟 @EventListener('entity:moved') 装饰器
            private initEventListeners() {
                // 这里应该通过装饰器自动完成
                scene.eventSystem?.on('entity:moved', (data) => {
                    this.onEntityMoved(data);
                });
            }
            
            public onEntityMoved(data: any) {
                this.receivedEvents.push(data);
            }
            
            protected override process(entities: Entity[]): void {
                // 处理实体移动并发射事件
                for (const entity of entities) {
                    const pos = entity.getComponent(PositionComponent)!;
                    // 模拟移动
                    pos.x += 1;
                    
                    // 发射移动事件
                    scene.eventSystem?.emit('entity:moved', {
                        entityId: entity.id,
                        position: { x: pos.x, y: pos.y }
                    });
                }
            }
        }
        
        test(' 事件装饰器系统的初始化时序', () => {
            // 先创建实体
            const entity = scene.createEntity("EventTestEntity");
            entity.addComponent(new PositionComponent(0, 0));
            
            // 然后添加使用事件装饰器的系统
            const eventSystem = new EventDecoratedSystem();
            scene.addEntityProcessor(eventSystem);
            
            // 验证系统正确识别了实体
            expect(eventSystem.entities.length).toBe(1);
            
            // 运行更新，应该触发事件
            scene.update();
            
            //  关键测试：事件装饰器是否正确工作
            console.log("接收到的事件数量:", eventSystem.receivedEvents.length);
            expect(eventSystem.receivedEvents.length).toBe(1);
            
            // 验证事件数据
            const event = eventSystem.receivedEvents[0];
            expect(event.entityId).toBe(entity.id);
            expect(event.position.x).toBe(1); // 移动后的位置
        });
    });
    
    afterEach(() => {
        // 清理场景
        scene.destroyAllEntities();
        
        // 手动清理系统
        const processors = [...scene.entityProcessors.processors];
        processors.forEach(processor => scene.removeEntityProcessor(processor));
    });
});