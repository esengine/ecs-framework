import { Component } from '../../src/ECS/Component';
import { Entity } from '../../src/ECS/Entity';

// 测试组件
class TestComponent extends Component {
    public value: number = 100;
    public onAddedCalled = false;
    public onRemovedCalled = false;
    public onEnabledCalled = false;
    public onDisabledCalled = false;
    public updateCalled = false;

    public override onAddedToEntity(): void {
        this.onAddedCalled = true;
    }

    public override onRemovedFromEntity(): void {
        this.onRemovedCalled = true;
    }

    public override onEnabled(): void {
        this.onEnabledCalled = true;
    }

    public override onDisabled(): void {
        this.onDisabledCalled = true;
    }

    public override update(): void {
        this.updateCalled = true;
    }
}

class AnotherTestComponent extends Component {
    public name: string = 'test';
}

describe('Component - 组件基类测试', () => {
    let component: TestComponent;
    let entity: Entity;

    beforeEach(() => {
        // Reset component ID generator to avoid BigInt issues
        Component._idGenerator = 0;
        component = new TestComponent();
        entity = new Entity('TestEntity', 1);
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
            const startId = Component._idGenerator;
            const component1 = new TestComponent();
            const component2 = new TestComponent();

            expect(component2.id).toBe(component1.id + 1);
            expect(component1.id).toBeGreaterThanOrEqual(startId);
        });
    });

    describe('启用状态管理', () => {
        test('组件默认应该是启用的', () => {
            expect(component.enabled).toBe(true);
        });

        test('设置组件禁用状态应该工作', () => {
            component.enabled = false;
            expect(component.enabled).toBe(false);
            expect(component.onDisabledCalled).toBe(true);
        });

        test('重新启用组件应该工作', () => {
            component.enabled = false;
            component.onDisabledCalled = false;
            component.onEnabledCalled = false;

            component.enabled = true;
            expect(component.enabled).toBe(true);
            expect(component.onEnabledCalled).toBe(true);
        });

        test('设置相同的状态不应该触发回调', () => {
            component.enabled = true; // 已经是true
            expect(component.onEnabledCalled).toBe(false);

            component.enabled = false;
            component.onDisabledCalled = false;
            
            component.enabled = false; // 已经是false
            expect(component.onDisabledCalled).toBe(false);
        });

        test('组件启用状态应该受实体状态影响', () => {
            entity.addComponent(component);
            expect(component.enabled).toBe(true);

            // 禁用实体应该让组件表现为禁用
            entity.enabled = false;
            expect(component.enabled).toBe(false);

            // 重新启用实体
            entity.enabled = true;
            expect(component.enabled).toBe(true);
        });

        test('组件自身禁用时即使实体启用也应该是禁用的', () => {
            entity.addComponent(component);
            
            component.enabled = false;
            entity.enabled = true;
            
            expect(component.enabled).toBe(false);
        });

        test('没有实体时组件状态应该只取决于自身', () => {
            // 组件还没有添加到实体
            expect(component.enabled).toBe(true);
            
            component.enabled = false;
            expect(component.enabled).toBe(false);
        });
    });

    describe('更新顺序', () => {
        test('组件默认更新顺序应该是0', () => {
            expect(component.updateOrder).toBe(0);
        });

        test('应该能够设置更新顺序', () => {
            component.updateOrder = 10;
            expect(component.updateOrder).toBe(10);

            component.updateOrder = -5;
            expect(component.updateOrder).toBe(-5);
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

        test('启用时应该调用onEnabled', () => {
            component.enabled = false;
            component.onEnabledCalled = false;
            
            component.enabled = true;
            expect(component.onEnabledCalled).toBe(true);
        });

        test('禁用时应该调用onDisabled', () => {
            expect(component.onDisabledCalled).toBe(false);
            
            component.enabled = false;
            expect(component.onDisabledCalled).toBe(true);
        });
    });

    describe('更新方法', () => {
        test('update方法应该可以被调用', () => {
            expect(component.updateCalled).toBe(false);
            
            component.update();
            expect(component.updateCalled).toBe(true);
        });

        test('基类的默认生命周期方法应该安全调用', () => {
            const baseComponent = new (class extends Component {})();
            
            // 这些方法不应该抛出异常
            expect(() => {
                baseComponent.onAddedToEntity();
                baseComponent.onRemovedFromEntity();
                baseComponent.onEnabled();
                baseComponent.onDisabled();
                baseComponent.update();
            }).not.toThrow();
        });
    });

    describe('实体关联', () => {
        test('组件应该能够访问其所属的实体', () => {
            entity.addComponent(component);
            expect(component.entity).toBe(entity);
        });

        test('组件移除后entity引用行为', () => {
            entity.addComponent(component);
            expect(component.entity).toBe(entity);
            
            entity.removeComponent(component);
            // 移除后entity引用可能被清空，这是正常行为
            // 具体行为取决于实现，这里只测试不会抛出异常
            expect(() => {
                const _ = component.entity;
            }).not.toThrow();
        });
    });

    describe('边界情况', () => {
        test('多次启用禁用应该工作正常', () => {
            for (let i = 0; i < 10; i++) {
                component.enabled = false;
                expect(component.enabled).toBe(false);
                
                component.enabled = true;
                expect(component.enabled).toBe(true);
            }
        });

        test('极端更新顺序值应该被接受', () => {
            component.updateOrder = 999999;
            expect(component.updateOrder).toBe(999999);
            
            component.updateOrder = -999999;
            expect(component.updateOrder).toBe(-999999);
        });

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
            test.update();
            
            expect(test.updateCalled).toBe(true);
        });
    });
});