import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';
import { Scene } from '../../src/ECS/Scene';

// 测试组件类
class TestPositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

class TestHealthComponent extends Component {
    public health: number = 100;
    
    constructor(health: number = 100) {
        super();
        this.health = health;
    }
}

class TestVelocityComponent extends Component {
    public vx: number = 0;
    public vy: number = 0;
    
    constructor(vx: number = 0, vy: number = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
    }
}

class TestRenderComponent extends Component {
    public visible: boolean = true;
    
    constructor(visible: boolean = true) {
        super();
        this.visible = visible;
    }
}

describe('Entity - 组件缓存优化测试', () => {
    let entity: Entity;
    let scene: Scene;

    beforeEach(() => {
        // 创建场景和实体
        scene = new Scene();
        entity = scene.createEntity('TestEntity');
    });

    describe('基本功能测试', () => {
        test('应该能够创建实体', () => {
            expect(entity.name).toBe('TestEntity');
            expect(entity.id).toBeGreaterThan(0);
            expect(entity.componentCount).toBe(0);
        });

        test('应该能够添加组件', () => {
            const position = new TestPositionComponent(10, 20);
            const addedComponent = entity.addComponent(position);

            expect(addedComponent).toBe(position);
            expect(entity.componentCount).toBe(1);
            
            const retrieved = entity.getComponent(TestPositionComponent);
            expect(retrieved?.x).toBe(position.x);
            expect(retrieved?.y).toBe(position.y);
            expect(position.entity).toBe(entity);
        });

        test('应该能够获取组件', () => {
            const position = new TestPositionComponent(10, 20);
            entity.addComponent(position);

            const retrieved = entity.getComponent(TestPositionComponent);
            expect(retrieved?.x).toBe(10);
            expect(retrieved?.y).toBe(20);
        });

        test('应该能够检查组件存在性', () => {
            const position = new TestPositionComponent(10, 20);
            entity.addComponent(position);

            expect(entity.hasComponent(TestPositionComponent)).toBe(true);
            expect(entity.hasComponent(TestHealthComponent)).toBe(false);
        });

        test('应该能够移除组件', () => {
            const position = new TestPositionComponent(10, 20);
            entity.addComponent(position);

            entity.removeComponent(position);
            expect(entity.componentCount).toBe(0);
            expect(entity.hasComponent(TestPositionComponent)).toBe(false);
            expect(position.entity).toBeNull();
        });
    });

    describe('多组件管理测试', () => {
        test('应该能够管理多个不同类型的组件', () => {
            const position = new TestPositionComponent(10, 20);
            const health = new TestHealthComponent(150);
            const velocity = new TestVelocityComponent(5, -3);

            entity.addComponent(position);
            entity.addComponent(health);
            entity.addComponent(velocity);

            expect(entity.componentCount).toBe(3);
            expect(entity.hasComponent(TestPositionComponent)).toBe(true);
            expect(entity.hasComponent(TestHealthComponent)).toBe(true);
            expect(entity.hasComponent(TestVelocityComponent)).toBe(true);
        });

        test('应该能够正确获取多个组件', () => {
            const position = new TestPositionComponent(10, 20);
            const health = new TestHealthComponent(150);
            const velocity = new TestVelocityComponent(5, -3);

            entity.addComponent(position);
            entity.addComponent(health);
            entity.addComponent(velocity);

            const retrievedPosition = entity.getComponent(TestPositionComponent);
            const retrievedHealth = entity.getComponent(TestHealthComponent);
            const retrievedVelocity = entity.getComponent(TestVelocityComponent);

            expect(retrievedPosition?.x).toBe(position.x);
            expect(retrievedPosition?.y).toBe(position.y);
            expect(retrievedHealth?.health).toBe(health.health);
            expect(retrievedVelocity?.vx).toBe(velocity.vx);
            expect(retrievedVelocity?.vy).toBe(velocity.vy);
        });

        test('应该能够批量添加组件', () => {
            const components = [
                new TestPositionComponent(10, 20),
                new TestHealthComponent(150),
                new TestVelocityComponent(5, -3)
            ];

            const addedComponents = entity.addComponents(components);

            expect(addedComponents.length).toBe(3);
            expect(entity.componentCount).toBe(3);
            expect(addedComponents[0]).toBe(components[0]);
            expect(addedComponents[1]).toBe(components[1]);
            expect(addedComponents[2]).toBe(components[2]);
        });

        test('应该能够移除所有组件', () => {
            entity.addComponent(new TestPositionComponent(10, 20));
            entity.addComponent(new TestHealthComponent(150));
            entity.addComponent(new TestVelocityComponent(5, -3));

            entity.removeAllComponents();

            expect(entity.componentCount).toBe(0);
            expect(entity.hasComponent(TestPositionComponent)).toBe(false);
            expect(entity.hasComponent(TestHealthComponent)).toBe(false);
            expect(entity.hasComponent(TestVelocityComponent)).toBe(false);
        });
    });

    describe('性能优化验证', () => {
        test('位掩码应该正确工作', () => {
            const position = new TestPositionComponent(10, 20);
            const health = new TestHealthComponent(150);

            entity.addComponent(position);
            entity.addComponent(health);

            // 位掩码应该反映组件的存在
            expect(entity.hasComponent(TestPositionComponent)).toBe(true);
            expect(entity.hasComponent(TestHealthComponent)).toBe(true);
            expect(entity.hasComponent(TestVelocityComponent)).toBe(false);
        });

        test('索引映射应该正确维护', () => {
            const position = new TestPositionComponent(10, 20);
            const health = new TestHealthComponent(150);
            const velocity = new TestVelocityComponent(5, -3);

            entity.addComponent(position);
            entity.addComponent(health);
            entity.addComponent(velocity);

            // 获取组件应该通过索引映射快速完成
            const retrievedPosition = entity.getComponent(TestPositionComponent);
            const retrievedHealth = entity.getComponent(TestHealthComponent);
            const retrievedVelocity = entity.getComponent(TestVelocityComponent);

            expect(retrievedPosition?.x).toBe(position.x);
            expect(retrievedPosition?.y).toBe(position.y);
            expect(retrievedHealth?.health).toBe(health.health);
            expect(retrievedVelocity?.vx).toBe(velocity.vx);
            expect(retrievedVelocity?.vy).toBe(velocity.vy);
        });

        test('组件获取性能应该良好', () => {
            const position = new TestPositionComponent(10, 20);
            const health = new TestHealthComponent(150);
            const velocity = new TestVelocityComponent(5, -3);
            const render = new TestRenderComponent(true);

            entity.addComponent(position);
            entity.addComponent(health);
            entity.addComponent(velocity);
            entity.addComponent(render);

            // 测试大量获取操作的性能
            const iterations = 1000;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                entity.getComponent(TestPositionComponent);
                entity.getComponent(TestHealthComponent);
                entity.getComponent(TestVelocityComponent);
                entity.getComponent(TestRenderComponent);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            // 1000次 * 4个组件 = 4000次获取操作应该在合理时间内完成
            expect(duration).toBeLessThan(100); // 应该在100ms内完成
        });
    });

    describe('边界情况测试', () => {
        test('获取不存在的组件应该返回null', () => {
            const result = entity.getComponent(TestPositionComponent);
            expect(result).toBeNull();
        });

        test('不应该允许添加重复类型的组件', () => {
            const position1 = new TestPositionComponent(10, 20);
            const position2 = new TestPositionComponent(30, 40);

            entity.addComponent(position1);

            expect(() => {
                entity.addComponent(position2);
            }).toThrow();
        });

        test('移除不存在的组件应该安全处理', () => {
            const position = new TestPositionComponent(10, 20);
            
            expect(() => {
                entity.removeComponent(position);
            }).not.toThrow();
        });

        test('调试信息应该正确反映实体状态', () => {
            const position = new TestPositionComponent(10, 20);
            const health = new TestHealthComponent(150);

            entity.addComponent(position);
            entity.addComponent(health);

            const debugInfo = entity.getDebugInfo();

            expect(debugInfo.name).toBe('TestEntity');
            expect(debugInfo.id).toBeGreaterThan(0);
            expect(debugInfo.componentCount).toBe(2);
            expect(debugInfo.componentTypes).toContain('TestPositionComponent');
            expect(debugInfo.componentTypes).toContain('TestHealthComponent');
            expect(debugInfo.cachedComponentTypesSize).toBe(2);
        });
    });
});
