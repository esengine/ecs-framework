import { describe, test, expect, beforeEach } from '@jest/globals';
import { Scene } from '../../src/ECS/Scene';
import { Component } from '../../src/ECS/Component';
import { Entity } from '../../src/ECS/Entity';
import { EntityRef, ECSComponent } from '../../src/ECS/Decorators';

@ECSComponent('ParentRef')
class ParentComponent extends Component {
    @EntityRef() parent: Entity | null = null;
}

@ECSComponent('TargetRef')
class TargetComponent extends Component {
    @EntityRef() target: Entity | null = null;
    @EntityRef() ally: Entity | null = null;
}

describe('EntityRef Integration Tests', () => {
    let scene: Scene;

    beforeEach(() => {
        scene = new Scene({ name: 'TestScene' });
    });

    describe('基础功能', () => {
        test('应该支持EntityRef装饰器', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            const comp = entity1.addComponent(new ParentComponent());

            comp.parent = entity2;

            expect(comp.parent).toBe(entity2);
        });

        test('Entity销毁时应该自动清理所有引用', () => {
            const parent = scene.createEntity('Parent');
            const child1 = scene.createEntity('Child1');
            const child2 = scene.createEntity('Child2');

            const comp1 = child1.addComponent(new ParentComponent());
            const comp2 = child2.addComponent(new ParentComponent());

            comp1.parent = parent;
            comp2.parent = parent;

            expect(comp1.parent).toBe(parent);
            expect(comp2.parent).toBe(parent);

            parent.destroy();

            expect(comp1.parent).toBeNull();
            expect(comp2.parent).toBeNull();
        });

        test('修改引用应该更新ReferenceTracker', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            const entity3 = scene.createEntity('Entity3');
            const comp = entity1.addComponent(new ParentComponent());

            comp.parent = entity2;
            expect(scene.referenceTracker.getReferencesTo(entity2.id)).toHaveLength(1);

            comp.parent = entity3;
            expect(scene.referenceTracker.getReferencesTo(entity2.id)).toHaveLength(0);
            expect(scene.referenceTracker.getReferencesTo(entity3.id)).toHaveLength(1);
        });

        test('设置为null应该注销引用', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            const comp = entity1.addComponent(new ParentComponent());

            comp.parent = entity2;
            expect(scene.referenceTracker.getReferencesTo(entity2.id)).toHaveLength(1);

            comp.parent = null;
            expect(scene.referenceTracker.getReferencesTo(entity2.id)).toHaveLength(0);
        });
    });

    describe('Component生命周期', () => {
        test('移除Component应该清理其所有引用注册', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            const comp = entity1.addComponent(new ParentComponent());

            comp.parent = entity2;
            expect(scene.referenceTracker.getReferencesTo(entity2.id)).toHaveLength(1);

            entity1.removeComponent(comp);
            expect(scene.referenceTracker.getReferencesTo(entity2.id)).toHaveLength(0);
        });

        test('移除Component应该清除entityId引用', () => {
            const entity1 = scene.createEntity('Entity1');
            const comp = entity1.addComponent(new ParentComponent());

            expect(comp.entityId).toBe(entity1.id);

            entity1.removeComponent(comp);
            expect(comp.entityId).toBeNull();
        });
    });

    describe('多属性引用', () => {
        test('应该支持同一Component的多个EntityRef属性', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            const entity3 = scene.createEntity('Entity3');
            const comp = entity1.addComponent(new TargetComponent());

            comp.target = entity2;
            comp.ally = entity3;

            expect(comp.target).toBe(entity2);
            expect(comp.ally).toBe(entity3);

            entity2.destroy();

            expect(comp.target).toBeNull();
            expect(comp.ally).toBe(entity3);

            entity3.destroy();

            expect(comp.ally).toBeNull();
        });
    });

    describe('边界情况', () => {
        test('跨Scene引用应该失败', () => {
            const scene2 = new Scene({ name: 'TestScene2' });
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene2.createEntity('Entity2');
            const comp = entity1.addComponent(new ParentComponent());

            comp.parent = entity2;

            expect(comp.parent).toBeNull();
        });

        test('引用已销毁的Entity应该失败', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            const comp = entity1.addComponent(new ParentComponent());

            entity2.destroy();
            comp.parent = entity2;

            expect(comp.parent).toBeNull();
        });

        test('重复设置相同值不应重复注册', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            const comp = entity1.addComponent(new ParentComponent());

            comp.parent = entity2;
            comp.parent = entity2;
            comp.parent = entity2;

            expect(scene.referenceTracker.getReferencesTo(entity2.id)).toHaveLength(1);
        });

        test('循环引用应该正常工作', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            const comp1 = entity1.addComponent(new ParentComponent());
            const comp2 = entity2.addComponent(new ParentComponent());

            comp1.parent = entity2;
            comp2.parent = entity1;

            expect(comp1.parent).toBe(entity2);
            expect(comp2.parent).toBe(entity1);

            entity1.destroy();

            expect(comp2.parent).toBeNull();
            expect(entity2.isDestroyed).toBe(false);
        });
    });

    describe('复杂场景', () => {
        test('父子实体销毁应该正确清理引用', () => {
            const parent = scene.createEntity('Parent');
            const child1 = scene.createEntity('Child1');
            const child2 = scene.createEntity('Child2');
            const observer = scene.createEntity('Observer');

            parent.addChild(child1);
            parent.addChild(child2);

            const observerComp = observer.addComponent(new TargetComponent());
            observerComp.target = parent;
            observerComp.ally = child1;

            expect(observerComp.target).toBe(parent);
            expect(observerComp.ally).toBe(child1);

            parent.destroy();

            expect(observerComp.target).toBeNull();
            expect(observerComp.ally).toBeNull();
            expect(child1.isDestroyed).toBe(true);
            expect(child2.isDestroyed).toBe(true);
        });

        test('大量引用场景', () => {
            const target = scene.createEntity('Target');
            const entities: Entity[] = [];
            const components: ParentComponent[] = [];

            for (let i = 0; i < 100; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                const comp = entity.addComponent(new ParentComponent());
                comp.parent = target;
                entities.push(entity);
                components.push(comp);
            }

            expect(scene.referenceTracker.getReferencesTo(target.id)).toHaveLength(100);

            target.destroy();

            for (const comp of components) {
                expect(comp.parent).toBeNull();
            }

            expect(scene.referenceTracker.getReferencesTo(target.id)).toHaveLength(0);
        });

        test('批量销毁后引用应全部清理', () => {
            const entities: Entity[] = [];
            const components: TargetComponent[] = [];

            for (let i = 0; i < 50; i++) {
                entities.push(scene.createEntity(`Entity${i}`));
            }

            for (let i = 0; i < 50; i++) {
                const comp = entities[i].addComponent(new TargetComponent());
                if (i > 0) {
                    comp.target = entities[i - 1];
                }
                if (i < 49) {
                    comp.ally = entities[i + 1];
                }
                components.push(comp);
            }

            scene.destroyAllEntities();

            for (const comp of components) {
                expect(comp.target).toBeNull();
                expect(comp.ally).toBeNull();
            }
        });
    });

    describe('调试功能', () => {
        test('getDebugInfo应该返回引用信息', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            const comp = entity1.addComponent(new ParentComponent());

            comp.parent = entity2;

            const debugInfo = scene.referenceTracker.getDebugInfo();
            expect(debugInfo).toHaveProperty(`entity_${entity2.id}`);
        });
    });
});
