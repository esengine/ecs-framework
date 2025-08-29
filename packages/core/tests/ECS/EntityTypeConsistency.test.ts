import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';

class BaseTestComponent extends Component {
    public value: number;
    
    constructor(value: number = 0) {
        super();
        this.value = value;
    }
}

class DerivedTestComponent extends BaseTestComponent {
    public extraValue: string;
    
    constructor(value: number = 0, extraValue: string = 'test') {
        super(value);
        this.extraValue = extraValue;
    }
}

class AnotherTestComponent extends Component {
    public name: string;
    
    constructor(name: string = 'another') {
        super();
        this.name = name;
    }
}

describe('Entity Type Consistency', () => {
    let entity: Entity;

    beforeEach(() => {
        entity = new Entity('TestEntity', 1);
    });

    describe('精确类型匹配行为', () => {
        it('getComponent 应该使用精确类型匹配，不匹配子类', () => {
            const derivedComponent = new DerivedTestComponent(42, 'derived');
            entity.addComponent(derivedComponent);

            // 使用子类类型应该能找到
            const foundDerived = entity.getComponent(DerivedTestComponent);
            expect(foundDerived).toBe(derivedComponent);

            // 使用父类类型不应该找到子类实例（精确匹配）
            const foundBase = entity.getComponent(BaseTestComponent);
            expect(foundBase).toBeNull();
        });

        it('getComponents 应该使用精确类型匹配，不匹配子类', () => {
            const baseComponent = new BaseTestComponent(10);
            const derivedComponent = new DerivedTestComponent(20, 'derived');
            
            entity.addComponent(baseComponent);
            entity.addComponent(derivedComponent);

            // 查找基类应该只返回基类实例
            const baseComponents = entity.getComponents(BaseTestComponent);
            expect(baseComponents).toHaveLength(1);
            expect(baseComponents[0]).toBe(baseComponent);

            // 查找派生类应该只返回派生类实例
            const derivedComponents = entity.getComponents(DerivedTestComponent);
            expect(derivedComponents).toHaveLength(1);
            expect(derivedComponents[0]).toBe(derivedComponent);
        });

        it('hasComponent 应该使用精确类型匹配', () => {
            const derivedComponent = new DerivedTestComponent(30, 'test');
            entity.addComponent(derivedComponent);

            // 应该有派生类型的组件
            expect(entity.hasComponent(DerivedTestComponent)).toBe(true);

            // 不应该有基类型的组件（精确匹配）
            expect(entity.hasComponent(BaseTestComponent)).toBe(false);
        });
    });

    describe('类型判定的一致性', () => {
        it('所有组件查找方法应该保持一致的类型判定行为', () => {
            const baseComponent = new BaseTestComponent(100);
            const derivedComponent = new DerivedTestComponent(200, 'consistency');
            
            entity.addComponent(baseComponent);
            entity.addComponent(derivedComponent);

            // hasComponent, getComponent, getComponents 应该表现一致
            
            // 对于基类
            const hasBase = entity.hasComponent(BaseTestComponent);
            const getBase = entity.getComponent(BaseTestComponent);
            const getBasesArray = entity.getComponents(BaseTestComponent);
            
            if (hasBase) {
                expect(getBase).not.toBeNull();
                expect(getBasesArray.length).toBeGreaterThan(0);
            } else {
                expect(getBase).toBeNull();
                expect(getBasesArray.length).toBe(0);
            }

            // 对于派生类
            const hasDerived = entity.hasComponent(DerivedTestComponent);
            const getDerived = entity.getComponent(DerivedTestComponent);
            const getDerivedsArray = entity.getComponents(DerivedTestComponent);
            
            if (hasDerived) {
                expect(getDerived).not.toBeNull();
                expect(getDerivedsArray.length).toBeGreaterThan(0);
            } else {
                expect(getDerived).toBeNull();
                expect(getDerivedsArray.length).toBe(0);
            }
        });

        it('在不同代码路径中应该保持一致的类型判定', () => {
            const component = new BaseTestComponent(500);
            entity.addComponent(component);

            // 多次调用应该返回相同结果，无论内部使用什么路径
            const firstCall = entity.getComponent(BaseTestComponent);
            const secondCall = entity.getComponent(BaseTestComponent);
            const thirdCall = entity.getComponent(BaseTestComponent);
            
            expect(firstCall).toBe(component);
            expect(secondCall).toBe(component);
            expect(thirdCall).toBe(component);
            expect(firstCall).toBe(secondCall);
            expect(secondCall).toBe(thirdCall);
        });
    });

    describe('边界情况测试', () => {
        it('处理多个相同类型的组件时应该一致', () => {
            // 注意：正常情况下一个实体不应该有多个相同类型的组件
            // 这个测试验证在异常情况下的行为
            const component1 = new BaseTestComponent(1);
            
            // 正常添加第一个组件
            entity.addComponent(component1);
            
            // getComponent 应该返回添加的组件
            const found = entity.getComponent(BaseTestComponent);
            expect(found).toBe(component1);
            
            // getComponents 应该返回单个组件的数组
            const allFound = entity.getComponents(BaseTestComponent);
            expect(allFound).toHaveLength(1);
            expect(allFound).toContain(component1);
            
            // 尝试添加相同类型的第二个组件应该失败
            const component2 = new BaseTestComponent(2);
            expect(() => {
                entity.addComponent(component2);
            }).toThrow();
        });

        it('处理组件构造函数相同但实例不同的情况', () => {
            const component1 = new BaseTestComponent(10);
            const component2 = new BaseTestComponent(20);
            
            entity.addComponent(component1);
            
            // 尝试添加相同类型的另一个组件应该抛出错误
            expect(() => {
                entity.addComponent(component2);
            }).toThrow();
            
            // 应该只有第一个组件
            const found = entity.getComponent(BaseTestComponent);
            expect(found).toBe(component1);
            expect(found?.value).toBe(10);
        });
    });

    describe('性能和内存一致性', () => {
        it('类型判定不应该修改组件实例', () => {
            const originalComponent = new BaseTestComponent(999);
            const originalConstructor = originalComponent.constructor;
            const originalValue = originalComponent.value;
            
            entity.addComponent(originalComponent);
            
            // 多次调用 getComponent
            for (let i = 0; i < 5; i++) {
                const found = entity.getComponent(BaseTestComponent);
                expect(found).toBe(originalComponent);
            }
            
            // 确保组件未被修改
            expect(originalComponent.constructor).toBe(originalConstructor);
            expect(originalComponent.value).toBe(originalValue);
        });

        it('索引映射应该与组件查找保持一致', () => {
            const component = new AnotherTestComponent('indexed');
            entity.addComponent(component);
            
            // 多种查找方式应该返回相同结果
            const getResult1 = entity.getComponent(AnotherTestComponent);
            const getResult2 = entity.getComponent(AnotherTestComponent);
            const hasResult = entity.hasComponent(AnotherTestComponent);
            const getComponents = entity.getComponents(AnotherTestComponent);
            
            expect(getResult1).toBe(component);
            expect(getResult2).toBe(component);
            expect(getResult1).toBe(getResult2);
            expect(hasResult).toBe(true);
            expect(getComponents).toContain(component);
            expect(getComponents).toHaveLength(1);
        });
    });
});