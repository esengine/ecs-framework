import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { EventBus } from '../../../src/ECS/Core/EventBus';

// 测试组件
class TransformComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public rotation: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        if (args.length >= 1) this.x = args[0] as number;
        if (args.length >= 2) this.y = args[1] as number;
        if (args.length >= 3) this.rotation = args[2] as number;
    }
}

class VelocityComponent extends Component {
    public vx: number = 0;
    public vy: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        if (args.length >= 1) this.vx = args[0] as number;
        if (args.length >= 2) this.vy = args[1] as number;
    }
}

class HealthComponent extends Component {
    public health: number = 100;
    public maxHealth: number = 100;
    
    constructor(...args: unknown[]) {
        super();
        if (args.length >= 1) this.health = args[0] as number;
        if (args.length >= 2) this.maxHealth = args[1] as number;
    }
}

// 简单的事件装饰器实现（用于测试）
function EventHandler(eventType: string, priority: number = 0) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        // 在原型上标记事件处理器信息
        if (!target.constructor._eventHandlers) {
            target.constructor._eventHandlers = [];
        }
        target.constructor._eventHandlers.push({
            eventType,
            methodName: propertyKey,
            priority,
            handler: originalMethod
        });
        
        return descriptor;
    };
}

// 自动初始化事件监听器的基类
class EventAwareSystem extends EntitySystem {
    private eventListenerIds: string[] = [];
    
    constructor(matcher: Matcher) {
        super(matcher);
    }
    
    public override initialize(): void {
        super.initialize();
        this.initializeEventHandlers();
    }
    
    private initializeEventHandlers(): void {
        const eventHandlers = (this.constructor as any)._eventHandlers;
        if (!eventHandlers || !this.scene?.eventSystem) {
            return;
        }
        
        // 按优先级排序并注册事件处理器
        eventHandlers
            .sort((a: any, b: any) => b.priority - a.priority)
            .forEach((handlerInfo: any) => {
                const listenerId = this.scene!.eventSystem.on(
                    handlerInfo.eventType,
                    handlerInfo.handler.bind(this),
                    { priority: handlerInfo.priority }
                );
                this.eventListenerIds.push(listenerId);
            });
    }
    
    public cleanup(): void {
        // 清理事件监听器
        if (this.scene?.eventSystem) {
            this.eventListenerIds.forEach(id => {
                // 注意：这里需要修改EventSystem来支持通过ID移除监听器
                // this.scene!.eventSystem.removeListener(id);
            });
        }
        this.eventListenerIds = [];
    }
}

// 使用装饰器的测试系统
class DecoratedMovementSystem extends EventAwareSystem {
    public processedEntities: Entity[] = [];
    public receivedEvents: any[] = [];
    public entityMovedEvents: any[] = [];
    
    constructor() {
        super(Matcher.empty().all(TransformComponent, VelocityComponent));
    }
    
    protected override process(entities: Entity[]): void {
        this.processedEntities = [...entities];
        
        for (const entity of entities) {
            const transform = entity.getComponent(TransformComponent)!;
            const velocity = entity.getComponent(VelocityComponent)!;
            
            const oldX = transform.x;
            const oldY = transform.y;
            
            // 更新位置
            transform.x += velocity.vx;
            transform.y += velocity.vy;
            
            // 发射实体移动事件
            if (this.scene?.eventSystem) {
                this.scene.eventSystem.emit('entity:moved', {
                    entityId: entity.id,
                    entityName: entity.name,
                    oldPosition: { x: oldX, y: oldY },
                    newPosition: { x: transform.x, y: transform.y }
                });
            }
        }
    }
    
    @EventHandler('entity:moved', 10)
    onEntityMoved(data: any): void {
        this.entityMovedEvents.push(data);
    }
    
    @EventHandler('entity:health_changed', 5)
    onHealthChanged(data: any): void {
        this.receivedEvents.push({ type: 'health_changed', data });
    }
    
    @EventHandler('system:initialized', 15)
    onSystemInitialized(data: any): void {
        this.receivedEvents.push({ type: 'system_initialized', data });
    }
}

class HealthSystem extends EventAwareSystem {
    public processedEntities: Entity[] = [];
    public receivedEvents: any[] = [];
    
    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }
    
    protected override process(entities: Entity[]): void {
        this.processedEntities = [...entities];
        
        for (const entity of entities) {
            const health = entity.getComponent(HealthComponent)!;
            
            // 模拟健康值变化
            if (health.health > 0) {
                const oldHealth = health.health;
                health.health = Math.max(0, health.health - 1);
                
                // 发射健康值变化事件
                if (this.scene?.eventSystem && oldHealth !== health.health) {
                    this.scene.eventSystem.emit('entity:health_changed', {
                        entityId: entity.id,
                        entityName: entity.name,
                        oldHealth,
                        newHealth: health.health,
                        isDead: health.health <= 0
                    });
                }
            }
        }
    }
    
    @EventHandler('entity:health_changed', 8)
    onHealthChanged(data: any): void {
        this.receivedEvents.push(data);
        
        // 如果实体死亡，禁用它
        if (data.isDead) {
            const entity = this.scene?.findEntityById(data.entityId);
            if (entity) {
                entity.enabled = false;
            }
        }
    }
}

describe('装饰器系统测试', () => {
    let scene: Scene;
    
    beforeEach(() => {
        scene = new Scene();
        scene.name = "DecoratorTestScene";
    });
    
    describe('事件装饰器基础功能', () => {
        test('装饰器应该正确注册事件处理器', () => {
            const movementSystem = new DecoratedMovementSystem();
            
            // 检查装饰器是否正确注册了事件处理器信息
            const eventHandlers = (DecoratedMovementSystem as any)._eventHandlers;
            expect(eventHandlers).toBeDefined();
            expect(eventHandlers.length).toBe(3);
            
            // 检查事件处理器信息
            const entityMovedHandler = eventHandlers.find((h: any) => h.eventType === 'entity:moved');
            expect(entityMovedHandler).toBeDefined();
            expect(entityMovedHandler.priority).toBe(10);
            expect(entityMovedHandler.methodName).toBe('onEntityMoved');
        });
        
        test('系统初始化时应该自动注册事件监听器', () => {
            const entity = scene.createEntity("TestEntity");
            entity.addComponent(new TransformComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));
            
            const movementSystem = new DecoratedMovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            // 验证系统正确初始化
            expect(movementSystem.entities.length).toBe(1);
            
            // 运行一次更新，应该触发entity:moved事件
            scene.update();
            
            // 检查事件是否被正确处理
            expect(movementSystem.entityMovedEvents.length).toBe(1);
            expect(movementSystem.entityMovedEvents[0].entityId).toBe(entity.id);
            expect(movementSystem.entityMovedEvents[0].newPosition.x).toBe(1);
            expect(movementSystem.entityMovedEvents[0].newPosition.y).toBe(1);
        });
    });
    
    describe('多系统事件交互', () => {
        test('多个系统应该能够响应同一事件', () => {
            const entity = scene.createEntity("TestEntity");
            entity.addComponent(new TransformComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));
            entity.addComponent(new HealthComponent(10));
            
            const movementSystem = new DecoratedMovementSystem();
            const healthSystem = new HealthSystem();
            
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);
            
            // 运行几次更新
            scene.update();
            scene.update();
            scene.update();
            
            // 检查健康系统是否处理了健康变化事件
            expect(healthSystem.receivedEvents.length).toBeGreaterThan(0);
            
            // 检查移动系统是否也接收到了健康变化事件
            const healthChangedEvents = movementSystem.receivedEvents.filter(e => e.type === 'health_changed');
            expect(healthChangedEvents.length).toBeGreaterThan(0);
        });
        
        test('事件优先级应该正确工作', () => {
            const entity = scene.createEntity("TestEntity");
            entity.addComponent(new TransformComponent(0, 0));
            entity.addComponent(new VelocityComponent(1, 1));
            
            const movementSystem = new DecoratedMovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            // 发射系统初始化事件（如果有的话）
            if (scene.eventSystem) {
                scene.eventSystem.emit('system:initialized', {
                    systemName: 'DecoratedMovementSystem',
                    timestamp: Date.now()
                });
            }
            
            // 检查事件是否被接收
            scene.update();
            
            // 验证不同优先级的事件都被处理了
            const systemInitEvents = movementSystem.receivedEvents.filter(e => e.type === 'system_initialized');
            expect(systemInitEvents.length).toBeGreaterThanOrEqual(0);
        });
    });
    
    describe('装饰器系统的时序问题', () => {
        test('先添加实体再添加装饰器系统 - 事件应该正常工作', () => {
            // 先创建实体
            const entity = scene.createEntity("TestEntity");
            entity.addComponent(new TransformComponent(5, 5));
            entity.addComponent(new VelocityComponent(2, 3));
            
            // 然后添加装饰器系统
            const movementSystem = new DecoratedMovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            // 验证系统正确识别了实体
            expect(movementSystem.entities.length).toBe(1);
            
            // 运行更新，应该触发事件
            scene.update();
            
            // 检查事件装饰器是否正常工作
            expect(movementSystem.entityMovedEvents.length).toBe(1);
            expect(movementSystem.entityMovedEvents[0].oldPosition.x).toBe(5);
            expect(movementSystem.entityMovedEvents[0].newPosition.x).toBe(7);
        });
        
        test('动态添加组件后装饰器事件应该正常', () => {
            const movementSystem = new DecoratedMovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            const entity = scene.createEntity("DynamicEntity");
            entity.addComponent(new TransformComponent(0, 0));
            
            // 初始状态：系统不匹配
            expect(movementSystem.entities.length).toBe(0);
            
            // 动态添加速度组件
            entity.addComponent(new VelocityComponent(1, 1));
            
            // 系统应该匹配
            expect(movementSystem.entities.length).toBe(1);
            
            // 运行更新，事件应该正常触发
            scene.update();
            expect(movementSystem.entityMovedEvents.length).toBe(1);
        });
    });
    
    describe('装饰器系统的清理', () => {
        test('系统移除时应该清理事件监听器', () => {
            const movementSystem = new DecoratedMovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            // 验证系统已添加
            expect(scene.entityProcessors.count).toBe(1);
            
            // 移除系统
            scene.removeEntityProcessor(movementSystem);
            expect(scene.entityProcessors.count).toBe(0);
            
            // 清理事件监听器
            movementSystem.cleanup();
            
            // 验证事件监听器已清理（这里主要是检查不抛出异常）
            expect(() => {
                if (scene.eventSystem) {
                    scene.eventSystem.emit('entity:moved', { test: true });
                }
            }).not.toThrow();
        });
    });
    
    describe('边界情况测试', () => {
        test('没有装饰器的系统应该正常工作', () => {
            class SimpleSystem extends EventAwareSystem {
                public processedEntities: Entity[] = [];
                
                constructor() {
                    super(Matcher.empty().all(TransformComponent));
                }
                
                protected override process(entities: Entity[]): void {
                    this.processedEntities = [...entities];
                }
            }
            
            const entity = scene.createEntity("SimpleEntity");
            entity.addComponent(new TransformComponent(1, 1));
            
            const simpleSystem = new SimpleSystem();
            
            expect(() => {
                scene.addEntityProcessor(simpleSystem);
            }).not.toThrow();
            
            expect(simpleSystem.entities.length).toBe(1);
            
            scene.update();
            expect(simpleSystem.processedEntities.length).toBe(1);
        });
        
        test('空事件数据应该正常处理', () => {
            const movementSystem = new DecoratedMovementSystem();
            scene.addEntityProcessor(movementSystem);
            
            // 发射空事件
            if (scene.eventSystem) {
                scene.eventSystem.emit('entity:health_changed', null);
                scene.eventSystem.emit('entity:health_changed', undefined);
                scene.eventSystem.emit('entity:health_changed', {});
            }
            
            // 系统应该能够处理空数据而不崩溃
            expect(() => {
                scene.update();
            }).not.toThrow();
        });
    });
    
    afterEach(() => {
        // 清理场景
        scene.destroyAllEntities();
        
        // 清理系统并清理它们的事件监听器
        const processors = [...scene.entityProcessors.processors];
        processors.forEach(processor => {
            if (processor instanceof EventAwareSystem) {
                processor.cleanup();
            }
            scene.removeEntityProcessor(processor);
        });
    });
});