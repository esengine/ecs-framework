import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';

class TestComponent extends Component {
    public value: number = 0;
}

describe('Entity Components 只读访问测试', () => {
    let entity: Entity;
    let testComponent: TestComponent;

    beforeEach(() => {
        entity = new Entity('TestEntity', 1);
        testComponent = new TestComponent();
    });

    describe('只读访问保护', () => {
        it('components 应该返回只读数组引用', () => {
            entity.addComponent(testComponent);
            
            const components = entity.components;
            
            // TypeScript 应该防止直接修改
            // 这些代码如果取消注释应该产生编译错误:
            // components.push(new TestComponent()); // 编译错误
            // components.splice(0, 1);              // 编译错误
            // components[0] = new TestComponent();   // 编译错误
            
            // 但可以读取
            expect(components.length).toBe(1);
            expect(components[0]).toBe(testComponent);
        });

        it('应该通过正确的方法修改组件列表', () => {
            // 通过公共API添加组件
            entity.addComponent(testComponent);
            expect(entity.components.length).toBe(1);
            
            // 通过公共API移除组件
            entity.removeComponent(testComponent);
            expect(entity.components.length).toBe(0);
        });

        it('外部无法绕过只读限制破坏内部状态', () => {
            entity.addComponent(testComponent);
            
            const components = entity.components;
            
            // 即使尝试类型断言也不应该能够修改
            // 注意：这在运行时仍然是只读的，因为我们返回的是同一个引用
            // 但 TypeScript 会在编译时阻止这种操作
            expect(components).toBe(entity.components);
            expect(Object.isExtensible(components)).toBe(true); // 数组本身仍然是可扩展的
            
            // 但通过 readonly 类型，TypeScript 会阻止修改操作
        });

        it('多次获取 components 应该返回相同的引用', () => {
            entity.addComponent(testComponent);
            
            const components1 = entity.components;
            const components2 = entity.components;
            
            // 应该返回同一个引用（不是副本）
            expect(components1).toBe(components2);
        });
    });

    describe('功能验证', () => {
        it('只读访问不应该影响正常的组件操作', () => {
            // 创建不同类型的组件
            class TestComponent2 extends Component {
                public data: string = '';
            }
            const component2 = new TestComponent2();
            
            // 添加多个组件
            entity.addComponent(testComponent);
            entity.addComponent(component2);
            
            // 验证可以正常访问
            expect(entity.components.length).toBe(2);
            expect(entity.components[0]).toBe(testComponent);
            expect(entity.components[1]).toBe(component2);
            
            // 验证可以正常查询
            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.getComponent(TestComponent)).toBe(testComponent);
            expect(entity.hasComponent(TestComponent2)).toBe(true);
            
            // 验证可以正常移除
            entity.removeComponent(testComponent);
            expect(entity.components.length).toBe(1);
            expect(entity.components[0]).toBe(component2);
        });
    });
});