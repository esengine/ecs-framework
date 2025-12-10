import { Component } from '../../src/ECS/Component';
import { Entity } from '../../src/ECS/Entity';
import { Scene } from '../../src/ECS/Scene';
import { ECSComponent } from '../../src/ECS/Decorators';

// 测试组件
@ECSComponent('ComponentTest_TestComponent')
class TestComponent extends Component {
    public value: number = 100;
    public onAddedCalled = false;
    public onRemovedCalled = false;

    public override onAddedToEntity(): void {
        this.onAddedCalled = true;
    }

    public override onRemovedFromEntity(): void {
        this.onRemovedCalled = true;
    }
}

@ECSComponent('ComponentTest_AnotherTestComponent')
class AnotherTestComponent extends Component {
    public name: string = 'test';
}

describe('Component - 组件基类测试', () => {
    let component: TestComponent;
    let entity: Entity;
    let scene: Scene;

    beforeEach(() => {
        component = new TestComponent();
        scene = new Scene();
        entity = scene.createEntity('TestEntity');
    });

    describe('基本功能', () => {
        test('应该能够创建组件实例', () => {
            expect(component).toBeInstanceOf(Component);
            expect(component).toBeInstanceOf(TestComponent);
            expect(component.id).toBeGreaterThanOrEqual(0);
        });

        test('每个组件应该有唯一的ID', () => {
            const component1 = new TestComponent();
            const component2 = new TestComponent();
            const component3 = new AnotherTestComponent();

            expect(component1.id).not.toBe(component2.id);
            expect(component2.id).not.toBe(component3.id);
            expect(component1.id).not.toBe(component3.id);
        });

        test('组件ID应该递增分配', () => {
            const component1 = new TestComponent();
            const component2 = new TestComponent();

            expect(component2.id).toBe(component1.id + 1);
            expect(component1.id).toBeGreaterThanOrEqual(0);
        });
    });

    describe('生命周期回调', () => {
        test('添加到实体时应该调用onAddedToEntity', () => {
            expect(component.onAddedCalled).toBe(false);

            entity.addComponent(component);
            expect(component.onAddedCalled).toBe(true);
        });

        test('从实体移除时应该调用onRemovedFromEntity', () => {
            entity.addComponent(component);
            expect(component.onRemovedCalled).toBe(false);

            entity.removeComponent(component);
            expect(component.onRemovedCalled).toBe(true);
        });

        test('基类的默认生命周期方法应该安全调用', () => {
            const baseComponent = new (class extends Component {})();

            // 这些方法不应该抛出异常
            expect(() => {
                baseComponent.onAddedToEntity();
                baseComponent.onRemovedFromEntity();
            }).not.toThrow();
        });
    });

    describe('实体-组件关系', () => {
        test('组件可以被添加到实体', () => {
            expect(() => {
                entity.addComponent(component);
            }).not.toThrow();

            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.getComponent(TestComponent)).toBe(component);
        });

        test('组件可以从实体移除', () => {
            entity.addComponent(component);

            expect(() => {
                entity.removeComponent(component);
            }).not.toThrow();

            expect(entity.hasComponent(TestComponent)).toBe(false);
        });
    });

    describe('边界情况', () => {
        test('大量组件创建应该有不同的ID', () => {
            const components: Component[] = [];
            const count = 1000;

            for (let i = 0; i < count; i++) {
                components.push(new TestComponent());
            }

            // 检查所有ID都不同
            const ids = new Set(components.map(c => c.id));
            expect(ids.size).toBe(count);
        });

        test('组件应该是纯数据容器', () => {
            // 验证组件只有数据字段
            const comp = new TestComponent();
            expect(comp.value).toBe(100);

            // 可以修改数据
            comp.value = 200;
            expect(comp.value).toBe(200);
        });
    });

    describe('继承和多态', () => {
        test('不同类型的组件应该都继承自Component', () => {
            const test1 = new TestComponent();
            const test2 = new AnotherTestComponent();

            expect(test1).toBeInstanceOf(Component);
            expect(test2).toBeInstanceOf(Component);
            expect(test1).toBeInstanceOf(TestComponent);
            expect(test2).toBeInstanceOf(AnotherTestComponent);
        });

        test('组件应该能够重写基类方法', () => {
            const test = new TestComponent();

            // 重写生命周期方法应该工作
            entity.addComponent(test);
            expect(test.onAddedCalled).toBe(true);
        });
    });
});