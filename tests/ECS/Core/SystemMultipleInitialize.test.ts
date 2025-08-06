import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { ComponentTypeManager } from '../../../src/ECS/Utils/ComponentTypeManager';

class TestComponent extends Component {
    public value: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [value = 0] = args as [number?];
        this.value = value;
    }
}

class TrackingSystem extends EntitySystem {
    public initializeCallCount = 0;
    public onChangedCallCount = 0;
    public trackedEntities: Entity[] = [];

    public override initialize(): void {
        // 必须先调用父类的initialize来检查防重复逻辑
        const wasInitialized = (this as any)._initialized;
        super.initialize();
        
        // 只有在真正执行初始化时才增加计数和处理实体
        if (!wasInitialized) {
            this.initializeCallCount++;
            
            // 处理所有现有实体
            if (this.scene) {
                for (const entity of this.scene.entities.buffer) {
                    this.onChanged(entity);
                }
            }
        }
    }

    public onChanged(entity: Entity): void {
        this.onChangedCallCount++;
        if (this.isInterestedEntity(entity)) {
            if (!this.trackedEntities.includes(entity)) {
                this.trackedEntities.push(entity);
            }
        } else {
            const index = this.trackedEntities.indexOf(entity);
            if (index !== -1) {
                this.trackedEntities.splice(index, 1);
            }
        }
    }

    public isInterestedEntity(entity: Entity): boolean {
        return entity.hasComponent(TestComponent);
    }
}

describe('系统多次初始化问题测试', () => {
    let scene: Scene;
    let system: TrackingSystem;

    beforeEach(() => {
        ComponentTypeManager.instance.reset();
        scene = new Scene();
        system = new TrackingSystem();
    });

    test('系统被多次添加到场景 - 应该防止重复初始化', () => {
        const entity = scene.createEntity('TestEntity');
        entity.addComponent(new TestComponent(10));

        // 第一次添加系统
        scene.addEntityProcessor(system);
        expect(system.initializeCallCount).toBe(1);
        expect(system.trackedEntities.length).toBe(1);
        expect(system.onChangedCallCount).toBe(1);

        // 再次添加同一个系统 - 应该被忽略
        scene.addEntityProcessor(system);
        expect(system.initializeCallCount).toBe(1); // 不应该增加
        expect(system.trackedEntities.length).toBe(1); // 实体不应该重复
        expect(system.onChangedCallCount).toBe(1); // onChanged不应该重复调用
    });

    test('手动多次调用initialize - 应该防止重复处理', () => {
        const entity = scene.createEntity('TestEntity');
        entity.addComponent(new TestComponent(10));

        scene.addEntityProcessor(system);
        expect(system.initializeCallCount).toBe(1);
        expect(system.trackedEntities.length).toBe(1);
        expect(system.onChangedCallCount).toBe(1);

        // 手动再次调用initialize - 应该被防止
        system.initialize();
        expect(system.initializeCallCount).toBe(1); // 不应该增加
        expect(system.onChangedCallCount).toBe(1); // onChanged不应该重复调用
        expect(system.trackedEntities.length).toBe(1);
    });

    test('系统被移除后重新添加 - 应该重新初始化', () => {
        const entity = scene.createEntity('TestEntity');
        entity.addComponent(new TestComponent(10));

        // 添加系统
        scene.addEntityProcessor(system);
        expect(system.initializeCallCount).toBe(1);
        expect(system.trackedEntities.length).toBe(1);

        // 移除系统
        scene.removeEntityProcessor(system);
        
        // 重新添加系统 - 应该重新初始化
        scene.addEntityProcessor(system);
        expect(system.initializeCallCount).toBe(2); // 应该重新初始化
        expect(system.trackedEntities.length).toBe(1);
    });

    test('多个实体的重复初始化应该被防止', () => {
        // 创建多个实体
        const entities = [];
        for (let i = 0; i < 5; i++) {
            const entity = scene.createEntity(`Entity${i}`);
            entity.addComponent(new TestComponent(i));
            entities.push(entity);
        }

        scene.addEntityProcessor(system);
        expect(system.initializeCallCount).toBe(1);
        expect(system.trackedEntities.length).toBe(5);
        expect(system.onChangedCallCount).toBe(5);

        // 手动再次初始化 - 应该被防止
        system.initialize();
        expect(system.initializeCallCount).toBe(1); // 不应该增加
        expect(system.onChangedCallCount).toBe(5); // 不应该重复处理
        expect(system.trackedEntities.length).toBe(5);
    });
});