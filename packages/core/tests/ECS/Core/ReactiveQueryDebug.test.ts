import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentTypeManager } from '../../../src/ECS/Utils/ComponentTypeManager';

/**
 * 响应式查询调试测试
 *
 * 隔离测试响应式查询初始化问题
 */

class HealthComponent extends Component {
    public health: number;

    constructor(health: number = 100) {
        super();
        this.health = health;
    }
}

describe('ReactiveQueryDebug - 响应式查询初始化调试', () => {
    let scene: Scene;

    beforeEach(() => {
        ComponentTypeManager.instance.reset();
        scene = new Scene();
        scene.name = 'DebugScene';
    });

    test('场景有实体时QuerySystem.queryAll应该能找到实体', () => {
        const entity = scene.createEntity('TestEntity');
        entity.addComponent(new HealthComponent(100));

        // 直接使用QuerySystem查询
        const result = scene.querySystem!.queryAll(HealthComponent);

        console.log('QuerySystem.queryAll结果:', {
            count: result.count,
            entities: result.entities.map(e => ({ id: e.id, name: e.name }))
        });

        expect(result.count).toBe(1);
        expect(result.entities[0]).toBe(entity);
    });

    test('第一次查询和第二次查询应该返回相同结果', () => {
        const entity = scene.createEntity('TestEntity');
        entity.addComponent(new HealthComponent(100));

        // 第一次查询
        const result1 = scene.querySystem!.queryAll(HealthComponent);

        console.log('第一次查询结果:', {
            count: result1.count,
            entities: result1.entities.map(e => ({ id: e.id, name: e.name }))
        });

        // 第二次查询
        const result2 = scene.querySystem!.queryAll(HealthComponent);

        console.log('第二次查询结果:', {
            count: result2.count,
            entities: result2.entities.map(e => ({ id: e.id, name: e.name }))
        });

        expect(result1.count).toBe(1);
        expect(result2.count).toBe(1);
        expect(result1.entities[0]).toBe(result2.entities[0]);
    });

    test('添加组件后查询应该能找到实体', () => {
        const entity = scene.createEntity('TestEntity');

        // 第一次查询(实体还没有组件)
        const result1 = scene.querySystem!.queryAll(HealthComponent);
        console.log('添加组件前查询结果:', { count: result1.count });
        expect(result1.count).toBe(0);

        // 添加组件
        entity.addComponent(new HealthComponent(100));

        // 第二次查询(实体已有组件)
        const result2 = scene.querySystem!.queryAll(HealthComponent);
        console.log('添加组件后查询结果:', {
            count: result2.count,
            entities: result2.entities.map(e => ({ id: e.id, name: e.name }))
        });

        expect(result2.count).toBe(1);
        expect(result2.entities[0]).toBe(entity);
    });
});
