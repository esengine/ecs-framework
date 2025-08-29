import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';
import { EventBus } from '../../src/ECS/Core/EventBus';
import { TypeSafeEventSystem } from '../../src/ECS/Core/EventSystem';
import { Core } from '../../src/Core';
import { IScene } from '../../src/ECS/IScene';

class TestComponent extends Component {
    public value: number;
    
    constructor(value: number = 0) {
        super();
        this.value = value;
    }
}

describe('Entity Destroy Event', () => {
    let eventBus: EventBus;
    let eventSystem: TypeSafeEventSystem;
    let mockScene: IScene;
    let destroyedEvents: any[];
    let componentRemovedEvents: any[];

    // 辅助函数：创建带场景的实体
    const createEntityWithScene = (name: string, id: number): Entity => {
        const entity = new Entity(name, id);
        entity.scene = mockScene;
        return entity;
    };

    beforeEach(() => {
        eventBus = new EventBus();
        eventSystem = new TypeSafeEventSystem();
        destroyedEvents = [];
        componentRemovedEvents = [];
        
        // 创建模拟场景
        mockScene = {
            eventSystem,
            suspendEffects: false,
            markComponentChanged: jest.fn(),
            querySystem: {
                removeEntity: jest.fn(),
                addEntity: jest.fn()
            },
            entities: {
                remove: jest.fn()
            }
        } as any;
        
        // 监听场景事件系统
        eventSystem.on('entity:destroyed', (event: any) => {
            destroyedEvents.push(event);
        });
        
        eventSystem.on('component:removed', (event: any) => {
            componentRemovedEvents.push(event);
        });
        
        // 保留对静态事件总线的支持（向后兼容测试）
        Entity.eventBus = eventBus;
        eventBus.on('entity:destroyed', (event: any) => {
            destroyedEvents.push(event);
        });
        
        eventBus.on('component:removed', (event: any) => {
            componentRemovedEvents.push(event);
        });
    });

    afterEach(() => {
        Entity.eventBus = null;
        // 重置 Core 状态
        Core.entityHierarchyEnabled = false;
    });

    describe('基本销毁事件', () => {
        it('应该在销毁实体时发射销毁事件', () => {
            const entity = createEntityWithScene('TestEntity', 1);
            
            entity.destroy();
            
            expect(destroyedEvents).toHaveLength(1);
            const event = destroyedEvents[0];
            expect(event.entityId).toBe(1);
            expect(event.entityName).toBe('TestEntity');
            expect(event.source).toBe('Entity');
            expect(event.timestamp).toBeGreaterThan(0);
        });

        it('应该在销毁事件中包含实体标签信息', () => {
            const entity = createEntityWithScene('TaggedEntity', 2);
            entity.tag = 100;
            
            entity.destroy();
            
            expect(destroyedEvents).toHaveLength(1);
            const event = destroyedEvents[0];
            expect(event.entityTag).toBe('100');
        });

        it('销毁已销毁的实体不应该重复发射事件', () => {
            const entity = createEntityWithScene('DestroyedEntity', 3);
            
            entity.destroy();
            entity.destroy(); // 第二次销毁
            
            expect(destroyedEvents).toHaveLength(1);
        });
    });

    describe('事件时机和状态', () => {
        it('销毁事件应该在实际销毁之前发射，让监听器能访问完整状态', () => {
            const entity = createEntityWithScene('TimingEntity', 4);
            const component = new TestComponent(42);
            entity.addComponent(component);
            
            let eventEntityState: any = null;
            
            eventBus.on('entity:destroyed', () => {
                // 在事件处理器中记录实体状态
                eventEntityState = {
                    isDestroyed: entity.isDestroyed,
                    componentCount: entity.components.length,
                    hasTestComponent: entity.hasComponent(TestComponent)
                };
            });
            
            entity.destroy();
            
            // 销毁事件发射时实体应该还没有被标记为已销毁
            expect(eventEntityState.isDestroyed).toBe(false);
            expect(eventEntityState.componentCount).toBe(1);
            expect(eventEntityState.hasTestComponent).toBe(true);
            
            // 销毁完成后实体应该被标记为已销毁
            expect(entity.isDestroyed).toBe(true);
            expect(entity.components.length).toBe(0);
        });

        it('应该先发射销毁事件，然后发射组件移除事件', () => {
            const entity = createEntityWithScene('OrderEntity', 5);
            entity.addComponent(new TestComponent(10));
            
            const eventOrder: string[] = [];
            
            eventBus.on('entity:destroyed', () => {
                eventOrder.push('entity:destroyed');
            });
            
            eventBus.on('component:removed', () => {
                eventOrder.push('component:removed');
            });
            
            entity.destroy();
            
            expect(eventOrder).toEqual(['entity:destroyed', 'component:removed']);
        });
    });

    describe('层次结构销毁事件', () => {
        beforeEach(() => {
            Core.entityHierarchyEnabled = true;
        });

        it('应该为每个被销毁的子实体发射销毁事件', () => {
            const parent = createEntityWithScene('Parent', 6);
            const child1 = createEntityWithScene('Child1', 7);
            const child2 = createEntityWithScene('Child2', 8);
            
            parent.addChild(child1);
            parent.addChild(child2);
            
            parent.destroy();
            
            // 应该有3个销毁事件：parent, child1, child2
            expect(destroyedEvents).toHaveLength(3);
            
            const eventEntityIds = destroyedEvents.map(e => e.entityId).sort();
            expect(eventEntityIds).toEqual([6, 7, 8]);
        });

        it('销毁事件应该按照深度优先顺序发射', () => {
            const root = createEntityWithScene('Root', 9);
            const child = createEntityWithScene('Child', 10);
            const grandchild = createEntityWithScene('Grandchild', 11);
            
            root.addChild(child);
            child.addChild(grandchild);
            
            root.destroy();
            
            expect(destroyedEvents).toHaveLength(3);
            
            // 应该按照深度优先顺序：root -> child -> grandchild
            expect(destroyedEvents[0].entityId).toBe(9);  // root
            expect(destroyedEvents[1].entityId).toBe(10); // child  
            expect(destroyedEvents[2].entityId).toBe(11); // grandchild
        });
    });

    describe('场景副作用抑制', () => {
        it('当场景抑制副作用时不应该发射销毁事件', () => {
            const entity = createEntityWithScene('SuppressedEntity', 12);
            
            // 模拟场景抑制副作用，包含必要的方法
            const mockScene = {
                suspendEffects: true,
                markComponentChanged: jest.fn(),
                querySystem: {
                    removeEntity: jest.fn(),
                    addEntity: jest.fn()
                },
                entities: {
                    remove: jest.fn()
                }
            };
            entity.scene = mockScene as any;
            
            entity.destroy();
            
            expect(destroyedEvents).toHaveLength(0);
        });

        it('当没有 EventBus 时不应该抛出错误', () => {
            Entity.eventBus = null;
            const entity = createEntityWithScene('NoEventBusEntity', 13);
            
            expect(() => {
                entity.destroy();
            }).not.toThrow();
            
            expect(entity.isDestroyed).toBe(true);
        });
    });

    describe('事件数据完整性', () => {
        it('销毁事件应该包含所有必要的实体信息', () => {
            const entity = createEntityWithScene('CompleteEntity', 14);
            entity.tag = 999;
            
            entity.destroy();
            
            expect(destroyedEvents).toHaveLength(1);
            const event = destroyedEvents[0];
            
            // 验证所有必需字段
            expect(event).toHaveProperty('timestamp');
            expect(event).toHaveProperty('source');
            expect(event).toHaveProperty('entityId');
            expect(event).toHaveProperty('entityName');
            expect(event).toHaveProperty('entityTag');
            
            // 验证字段值
            expect(typeof event.timestamp).toBe('number');
            expect(event.source).toBe('Entity');
            expect(event.entityId).toBe(14);
            expect(event.entityName).toBe('CompleteEntity');
            expect(event.entityTag).toBe('999');
        });

        it('当实体没有标签时 entityTag 应该是 undefined', () => {
            const entity = createEntityWithScene('NoTagEntity', 15);
            // 没有设置 tag
            
            entity.destroy();
            
            expect(destroyedEvents).toHaveLength(1);
            const event = destroyedEvents[0];
            expect(event.entityTag).toBeUndefined();
        });
    });

    describe('性能和内存', () => {
        it('大量实体销毁应该高效处理事件', () => {
            const entities: Entity[] = [];
            const entityCount = 1000;
            
            // 创建大量实体
            for (let i = 0; i < entityCount; i++) {
                const entity = createEntityWithScene(`Entity${i}`, i);
                entity.addComponent(new TestComponent(i));
                entities.push(entity);
            }
            
            const startTime = performance.now();
            
            // 销毁所有实体
            entities.forEach(entity => entity.destroy());
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 验证所有事件都被发射
            expect(destroyedEvents).toHaveLength(entityCount);
            expect(componentRemovedEvents).toHaveLength(entityCount);
            
            // 性能应该合理（这个阈值可能需要根据实际情况调整）
            expect(duration).toBeLessThan(1000); // 应该在1秒内完成
        });

        it('事件对象应该不包含循环引用', () => {
            const entity = createEntityWithScene('CircularRefEntity', 16);
            
            entity.destroy();
            
            expect(destroyedEvents).toHaveLength(1);
            const event = destroyedEvents[0];
            
            // 尝试序列化事件对象，如果有循环引用会抛出错误
            expect(() => {
                JSON.stringify(event);
            }).not.toThrow();
        });
    });

    describe('边界情况', () => {
        it('处理实体名称包含特殊字符的情况', () => {
            const entity = createEntityWithScene('Entity"With\'Special<>Characters&Symbols', 17);
            entity.tag = -1;
            
            entity.destroy();
            
            expect(destroyedEvents).toHaveLength(1);
            const event = destroyedEvents[0];
            expect(event.entityName).toBe('Entity"With\'Special<>Characters&Symbols');
            expect(event.entityTag).toBe('-1');
        });

        it('处理实体ID为0的情况', () => {
            const entity = createEntityWithScene('ZeroIdEntity', 0);
            
            entity.destroy();
            
            expect(destroyedEvents).toHaveLength(1);
            const event = destroyedEvents[0];
            expect(event.entityId).toBe(0);
        });

        it('处理负数标签的情况', () => {
            const entity = createEntityWithScene('NegativeTagEntity', 18);
            entity.tag = -999;
            
            entity.destroy();
            
            expect(destroyedEvents).toHaveLength(1);
            const event = destroyedEvents[0];
            expect(event.entityTag).toBe('-999');
        });
    });
});