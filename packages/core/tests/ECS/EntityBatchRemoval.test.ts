import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';
import { EventBus } from '../../src/ECS/Core/EventBus';
import { Scene } from '../../src/ECS/Scene';

class TestComponentA extends Component {
    public value: number;
    public onRemovedCalled: boolean = false;
    
    constructor(value: number = 0) {
        super();
        this.value = value;
    }
    
    override onRemovedFromEntity(): void {
        this.onRemovedCalled = true;
    }
}

class TestComponentB extends Component {
    public name: string;
    public onRemovedCalled: boolean = false;
    
    constructor(name: string = 'B') {
        super();
        this.name = name;
    }
    
    override onRemovedFromEntity(): void {
        this.onRemovedCalled = true;
    }
}

class TestComponentC extends Component {
    public data: any;
    public onRemovedCalled: boolean = false;
    
    constructor(data: any = {}) {
        super();
        this.data = data;
    }
    
    override onRemovedFromEntity(): void {
        this.onRemovedCalled = true;
    }
}

describe('Entity Batch Removal', () => {
    let entity: Entity;
    let scene: Scene;
    let removedEvents: any[];

    beforeEach(() => {
        scene = new Scene({ name: 'TestScene' });
        entity = new Entity('TestEntity', 1);
        scene.addEntity(entity);
        removedEvents = [];
        
        scene.eventSystem.on('component:removed', (event: any) => {
            removedEvents.push(event);
        });
    });

    describe('removeAllComponents 修复验证', () => {
        it('应该发射所有组件的移除事件', () => {
            const compA = new TestComponentA(10);
            const compB = new TestComponentB('test');
            const compC = new TestComponentC({ x: 100 });
            
            entity.addComponent(compA);
            entity.addComponent(compB);
            entity.addComponent(compC);
            
            // 清空之前的事件记录
            removedEvents.length = 0;
            
            // 移除所有组件
            entity.removeAllComponents();
            
            // 应该发射3个移除事件
            expect(removedEvents).toHaveLength(3);
            
            const eventComponentTypes = removedEvents.map(e => e.componentType);
            expect(eventComponentTypes).toContain('TestComponentA');
            expect(eventComponentTypes).toContain('TestComponentB');  
            expect(eventComponentTypes).toContain('TestComponentC');
        });

        it('应该调用所有组件的生命周期方法', () => {
            const compA = new TestComponentA(20);
            const compB = new TestComponentB('lifecycle');
            
            entity.addComponent(compA);
            entity.addComponent(compB);
            
            entity.removeAllComponents();
            
            expect(compA.onRemovedCalled).toBe(true);
            expect(compB.onRemovedCalled).toBe(true);
        });

        it('移除后实体应该没有任何组件', () => {
            const compA = new TestComponentA(30);
            const compB = new TestComponentB('empty');
            
            entity.addComponent(compA);
            entity.addComponent(compB);
            
            expect(entity.components.length).toBe(2);
            
            entity.removeAllComponents();
            
            expect(entity.components.length).toBe(0);
            expect(entity.getComponent(TestComponentA)).toBeNull();
            expect(entity.getComponent(TestComponentB)).toBeNull();
            expect(entity.hasComponent(TestComponentA)).toBe(false);
            expect(entity.hasComponent(TestComponentB)).toBe(false);
        });
    });

    describe('removeAllComponentsBatch', () => {
        it('应该移除所有组件并返回它们', () => {
            const compA = new TestComponentA(40);
            const compB = new TestComponentB('batch');
            const compC = new TestComponentC({ y: 200 });
            
            entity.addComponent(compA);
            entity.addComponent(compB);
            entity.addComponent(compC);
            
            const removedComponents = entity.removeAllComponentsBatch();
            
            expect(removedComponents).toHaveLength(3);
            expect(removedComponents).toContain(compA);
            expect(removedComponents).toContain(compB);
            expect(removedComponents).toContain(compC);
            
            expect(entity.components.length).toBe(0);
        });

        it('应该支持抑制生命周期方法', () => {
            const compA = new TestComponentA(50);
            const compB = new TestComponentB('no-lifecycle');
            
            entity.addComponent(compA);
            entity.addComponent(compB);
            
            entity.removeAllComponentsBatch({ suppressLifecycle: true });
            
            expect(compA.onRemovedCalled).toBe(false);
            expect(compB.onRemovedCalled).toBe(false);
        });

        it('应该支持抑制事件发射', () => {
            const compA = new TestComponentA(60);
            const compB = new TestComponentB('no-events');
            
            entity.addComponent(compA);
            entity.addComponent(compB);
            
            // 清空之前的事件记录
            removedEvents.length = 0;
            
            entity.removeAllComponentsBatch({ suppressEvents: true });
            
            expect(removedEvents).toHaveLength(0);
        });

        it('默认情况下应该发射事件和调用生命周期', () => {
            const compA = new TestComponentA(70);
            const compB = new TestComponentB('default');
            
            entity.addComponent(compA);
            entity.addComponent(compB);
            
            // 清空之前的事件记录
            removedEvents.length = 0;
            
            entity.removeAllComponentsBatch();
            
            expect(removedEvents).toHaveLength(2);
            expect(compA.onRemovedCalled).toBe(true);
            expect(compB.onRemovedCalled).toBe(true);
        });

        it('空组件列表时应该返回空数组', () => {
            const removedComponents = entity.removeAllComponentsBatch();
            
            expect(removedComponents).toHaveLength(0);
            expect(entity.components.length).toBe(0);
        });
    });

    describe('性能和一致性测试', () => {
        it('批量删除应该比逐个删除更高效', () => {
            // 创建多个实体进行性能对比
            const entities: Entity[] = [];
            const componentCount = 10;
            
            // 准备测试数据
            for (let i = 0; i < 100; i++) {
                const testEntity = new Entity(`Entity${i}`, i);
                // 添加不同类型的组件，确保不重复
                testEntity.addComponent(new TestComponentA(i));
                testEntity.addComponent(new TestComponentB(`comp${i}`));
                testEntity.addComponent(new TestComponentC({ index: i }));
                entities.push(testEntity);
            }
            
            // 测试批量删除
            const batchStart = performance.now();
            for (let i = 0; i < 50; i++) {
                entities[i].removeAllComponentsBatch({ suppressEvents: true, suppressLifecycle: true });
            }
            const batchEnd = performance.now();
            
            // 测试逐个删除（使用原方法）
            const individualStart = performance.now();
            for (let i = 50; i < 100; i++) {
                entities[i].removeAllComponents();
            }
            const individualEnd = performance.now();
            
            const batchTime = batchEnd - batchStart;
            const individualTime = individualEnd - individualStart;
            
            // 批量删除通常应该更快或至少不会显著更慢
            expect(batchTime).toBeLessThanOrEqual(individualTime * 1.5); // 允许50%的误差
        });

        it('两种删除方式应该产生相同的最终状态', () => {
            // 准备两个相同的实体
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            const compsA = [
                new TestComponentA(100),
                new TestComponentB('compare'),
                new TestComponentC({ test: true })
            ];
            
            const compsB = [
                new TestComponentA(100),
                new TestComponentB('compare'),
                new TestComponentC({ test: true })
            ];
            
            entity1.addComponent(compsA[0]);
            entity1.addComponent(compsA[1]);
            entity1.addComponent(compsA[2]);
            
            entity2.addComponent(compsB[0]);
            entity2.addComponent(compsB[1]);
            entity2.addComponent(compsB[2]);
            
            // 使用不同方式删除
            entity1.removeAllComponents();
            entity2.removeAllComponentsBatch();
            
            // 验证最终状态相同
            expect(entity1.components.length).toBe(entity2.components.length);
            expect(entity1.components.length).toBe(0);
            
            expect(entity1.hasComponent(TestComponentA)).toBe(entity2.hasComponent(TestComponentA));
            expect(entity1.hasComponent(TestComponentB)).toBe(entity2.hasComponent(TestComponentB));
            expect(entity1.hasComponent(TestComponentC)).toBe(entity2.hasComponent(TestComponentC));
            
            expect(entity1.getComponent(TestComponentA)).toBe(entity2.getComponent(TestComponentA));
            expect(entity1.getComponent(TestComponentB)).toBe(entity2.getComponent(TestComponentB));
            expect(entity1.getComponent(TestComponentC)).toBe(entity2.getComponent(TestComponentC));
        });
    });

    describe('边界情况处理', () => {
        it('处理组件在生命周期中抛出异常的情况', () => {
            class ErrorComponent extends Component {
                override onRemovedFromEntity(): void {
                    throw new Error('生命周期错误');
                }
            }
            
            const normalComp = new TestComponentA(80);
            const errorComp = new ErrorComponent();
            
            entity.addComponent(normalComp);
            entity.addComponent(errorComp);
            
            // removeAllComponents 遇到异常时会抛出错误
            expect(() => {
                entity.removeAllComponents();
            }).toThrow('生命周期错误');
            
            // 由于异常发生在处理循环中，清理操作会被中断
            // 组件列表不会被完全清空（清空操作在循环之后）
            expect(entity.components.length).toBe(2);
        });

        it('处理没有 onRemovedFromEntity 方法的组件', () => {
            class SimpleComponent extends Component {
                // 没有实现 onRemovedFromEntity
            }
            
            const simpleComp = new SimpleComponent();
            const normalComp = new TestComponentA(90);
            
            entity.addComponent(simpleComp);
            entity.addComponent(normalComp);
            
            // 应该不会抛出错误
            expect(() => {
                entity.removeAllComponents();
            }).not.toThrow();
            
            expect(entity.components.length).toBe(0);
            expect(normalComp.onRemovedCalled).toBe(true);
        });
    });
});