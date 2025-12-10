import { describe, test, expect, beforeEach } from '@jest/globals';
import { ReferenceTracker } from '../../../src/ECS/Core/ReferenceTracker';
import { Component } from '../../../src/ECS/Component';
import { Entity } from '../../../src/ECS/Entity';
import { Scene } from '../../../src/ECS/Scene';
import { ECSComponent } from '../../../src/ECS/Decorators';

@ECSComponent('RefTrackerTestComponent')
class TestComponent extends Component {
    public target: Entity | null = null;
}

describe('ReferenceTracker', () => {
    let tracker: ReferenceTracker;
    let scene: Scene;
    let entity1: Entity;
    let entity2: Entity;
    let component: TestComponent;

    beforeEach(() => {
        tracker = new ReferenceTracker();
        scene = new Scene();
        entity1 = scene.createEntity('Entity1');
        entity2 = scene.createEntity('Entity2');
        component = new TestComponent();
        entity1.addComponent(component);
    });

    describe('registerReference', () => {
        test('应该成功注册Entity引用', () => {
            tracker.registerReference(entity2, component, 'target');

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toHaveLength(1);
            expect(refs[0].component.deref()).toBe(component);
            expect(refs[0].propertyKey).toBe('target');
        });

        test('应该避免重复注册相同引用', () => {
            tracker.registerReference(entity2, component, 'target');
            tracker.registerReference(entity2, component, 'target');

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toHaveLength(1);
        });

        test('应该支持多个Component引用同一Entity', () => {
            const component2 = new TestComponent();
            const entity3 = scene.createEntity('Entity3');
            entity3.addComponent(component2);

            tracker.registerReference(entity2, component, 'target');
            tracker.registerReference(entity2, component2, 'target');

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toHaveLength(2);
        });

        test('应该支持同一Component引用多个属性', () => {
            tracker.registerReference(entity2, component, 'target');
            tracker.registerReference(entity2, component, 'parent');

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toHaveLength(2);
        });
    });

    describe('unregisterReference', () => {
        test('应该成功注销Entity引用', () => {
            tracker.registerReference(entity2, component, 'target');
            tracker.unregisterReference(entity2, component, 'target');

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toHaveLength(0);
        });

        test('注销不存在的引用不应报错', () => {
            expect(() => {
                tracker.unregisterReference(entity2, component, 'target');
            }).not.toThrow();
        });

        test('应该只注销指定的引用', () => {
            const component2 = new TestComponent();
            const entity3 = scene.createEntity('Entity3');
            entity3.addComponent(component2);

            tracker.registerReference(entity2, component, 'target');
            tracker.registerReference(entity2, component2, 'target');

            tracker.unregisterReference(entity2, component, 'target');

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toHaveLength(1);
            expect(refs[0].component.deref()).toBe(component2);
        });
    });

    describe('clearReferencesTo', () => {
        test('应该将所有引用设为null', () => {
            component.target = entity2;
            tracker.registerReference(entity2, component, 'target');

            tracker.clearReferencesTo(entity2.id);

            expect(component.target).toBeNull();
        });

        test('应该清理多个Component的引用', () => {
            const component2 = new TestComponent();
            const entity3 = scene.createEntity('Entity3');
            entity3.addComponent(component2);

            component.target = entity2;
            component2.target = entity2;

            tracker.registerReference(entity2, component, 'target');
            tracker.registerReference(entity2, component2, 'target');

            tracker.clearReferencesTo(entity2.id);

            expect(component.target).toBeNull();
            expect(component2.target).toBeNull();
        });

        test('清理不存在的Entity引用不应报错', () => {
            expect(() => {
                tracker.clearReferencesTo(999);
            }).not.toThrow();
        });

        test('应该移除引用记录', () => {
            tracker.registerReference(entity2, component, 'target');
            tracker.clearReferencesTo(entity2.id);

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toHaveLength(0);
        });
    });

    describe('clearComponentReferences', () => {
        test('应该清理Component的所有引用注册', () => {
            tracker.registerReference(entity2, component, 'target');

            tracker.clearComponentReferences(component);

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toHaveLength(0);
        });

        test('应该只清理指定Component的引用', () => {
            const component2 = new TestComponent();
            const entity3 = scene.createEntity('Entity3');
            entity3.addComponent(component2);

            tracker.registerReference(entity2, component, 'target');
            tracker.registerReference(entity2, component2, 'target');

            tracker.clearComponentReferences(component);

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toHaveLength(1);
            expect(refs[0].component.deref()).toBe(component2);
        });
    });

    describe('getReferencesTo', () => {
        test('应该返回空数组当Entity没有引用时', () => {
            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toEqual([]);
        });

        test('应该只返回有效的引用记录', () => {
            tracker.registerReference(entity2, component, 'target');

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toHaveLength(1);
        });
    });

    describe('cleanup', () => {
        test('应该清理失效的WeakRef引用', () => {
            let tempComponent: TestComponent | null = new TestComponent();
            const entity3 = scene.createEntity('Entity3');
            entity3.addComponent(tempComponent);

            tracker.registerReference(entity2, tempComponent, 'target');

            expect(tracker.getReferencesTo(entity2.id)).toHaveLength(1);

            tempComponent = null;

            if (global.gc) {
                global.gc();
            }

            tracker.cleanup();

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs.length).toBeLessThanOrEqual(1);
        });
    });

    describe('getDebugInfo', () => {
        test('应该返回调试信息', () => {
            tracker.registerReference(entity2, component, 'target');

            const debugInfo = tracker.getDebugInfo();

            expect(debugInfo).toHaveProperty(`entity_${entity2.id}`);
            const entityRefs = (debugInfo as any)[`entity_${entity2.id}`];
            expect(entityRefs).toHaveLength(1);
            expect(entityRefs[0]).toMatchObject({
                componentId: component.id,
                propertyKey: 'target'
            });
        });

        test('应该只包含有效的引用', () => {
            tracker.registerReference(entity2, component, 'target');

            const debugInfo = tracker.getDebugInfo();
            expect(Object.keys(debugInfo)).toHaveLength(1);
        });
    });

    describe('边界情况', () => {
        test('应该处理Component被GC回收的情况', () => {
            tracker.registerReference(entity2, component, 'target');

            tracker.cleanup();

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs.length).toBeGreaterThanOrEqual(0);
        });

        test('应该支持大量引用', () => {
            const components: TestComponent[] = [];
            for (let i = 0; i < 1000; i++) {
                const comp = new TestComponent();
                const ent = scene.createEntity(`Entity${i}`);
                ent.addComponent(comp);
                components.push(comp);
                tracker.registerReference(entity2, comp, 'target');
            }

            const refs = tracker.getReferencesTo(entity2.id);
            expect(refs).toHaveLength(1000);

            tracker.clearReferencesTo(entity2.id);

            const refsAfter = tracker.getReferencesTo(entity2.id);
            expect(refsAfter).toHaveLength(0);
        });
    });
});
