import { Core } from '../../../src/Core';
import { Scene } from '../../../src/ECS/Scene';
import { World, IGlobalSystem } from '../../../src/ECS/World';
import { WorldManager } from '../../../src/ECS/WorldManager';
import { SceneManager } from '../../../src/ECS/SceneManager';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Component } from '../../../src/ECS/Component';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { Entity } from '../../../src/ECS/Entity';
import { ECSComponent } from '../../../src/ECS/Decorators';

// 测试用组件
@ECSComponent('WorldCore_TestComponent')
class TestComponent extends Component {
    public value: number = 0;

    constructor(value: number = 0) {
        super();
        this.value = value;
    }

    public reset(): void {
        this.value = 0;
    }
}

// 全局系统实现
class NetworkGlobalSystem implements IGlobalSystem {
    public readonly name = 'NetworkGlobalSystem';
    public syncCount: number = 0;

    public initialize(): void {
        // 初始化网络连接
    }

    public update(): void {
        this.syncCount++;
        // 全局网络同步逻辑
    }

    public reset(): void {
        this.syncCount = 0;
    }

    public destroy(): void {
        // 清理网络连接
    }
}

/**
 * World与Core集成测试
 *
 * 注意：v3.0重构后，Core不再直接管理Scene/World
 * - 场景管理由 SceneManager 负责
 * - 多世界管理由 WorldManager 负责
 * - Core 仅负责全局服务（Timer、Performance等）
 *
 * 大部分旧的集成测试已移至 SceneManager.test.ts 和 WorldManager.test.ts
 */
describe('World与Core集成测试', () => {
    let worldManager: WorldManager;
    let sceneManager: SceneManager;

    beforeEach(() => {
        // 重置Core
        if (Core.Instance) {
            Core.destroy();
        }
        Core.create({ debug: false });

        // WorldManager和SceneManager不再是单例
        worldManager = new WorldManager();
        sceneManager = new SceneManager();
    });

    afterEach(() => {
        // 清理资源
        if (sceneManager) {
            sceneManager.destroy();
        }
        if (worldManager) {
            worldManager.destroy();
        }
        if (Core.Instance) {
            Core.destroy();
        }
    });

    describe('基础功能', () => {
        test('Core应该能够独立运行', () => {
            expect(Core.Instance).toBeDefined();

            // Core.update 仅更新全局服务
            Core.update(0.016);
        });

        test('SceneManager应该能够独立管理场景', () => {
            const scene = new Scene();
            scene.name = 'TestScene';

            sceneManager.setScene(scene);

            expect(sceneManager.currentScene).toBe(scene);
            expect(sceneManager.hasScene).toBe(true);

            // 场景更新独立于Core
            sceneManager.update();
        });

        test('WorldManager应该能够独立管理多个World', () => {
            const world1 = worldManager.createWorld('world1');
            const world2 = worldManager.createWorld('world2');

            expect(worldManager.worldCount).toBe(2);
            expect(worldManager.getWorld('world1')).toBe(world1);
            expect(worldManager.getWorld('world2')).toBe(world2);
        });
    });

    describe('组合使用', () => {
        test('Core + SceneManager 应该正确协作', () => {
            const scene = new Scene();
            sceneManager.setScene(scene);

            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestComponent(42));

            // 游戏循环
            Core.update(0.016);      // 更新全局服务
            sceneManager.update();    // 更新场景

            expect(scene.entities.count).toBe(1);
        });

        test('Core + WorldManager 应该正确协作', () => {
            const world = worldManager.createWorld('test-world');
            const scene = world.createScene('main', new Scene());
            world.start();

            // 游戏循环
            Core.update(0.016);      // 更新全局服务
            worldManager.updateAll(); // 更新所有World

            expect(world.isActive).toBe(true);
        });

        test('World的全局系统应该能够正常工作', () => {
            const world = worldManager.createWorld('test-world');
            const globalSystem = new NetworkGlobalSystem();

            world.addGlobalSystem(globalSystem);
            worldManager.setWorldActive('test-world', true);

            // 更新World
            worldManager.updateAll();

            expect(globalSystem.syncCount).toBeGreaterThan(0);
        });
    });

    describe('隔离性测试', () => {
        test('多个WorldManager实例应该完全隔离', () => {
            const manager1 = new WorldManager();
            const manager2 = new WorldManager();

            manager1.createWorld('world1');
            manager2.createWorld('world2');

            expect(manager1.getWorld('world1')).toBeDefined();
            expect(manager1.getWorld('world2')).toBeNull();
            expect(manager2.getWorld('world2')).toBeDefined();
            expect(manager2.getWorld('world1')).toBeNull();

            // 清理
            manager1.destroy();
            manager2.destroy();
        });

        test('多个SceneManager实例应该完全隔离', () => {
            const sm1 = new SceneManager();
            const sm2 = new SceneManager();

            const scene1 = new Scene();
            const scene2 = new Scene();

            sm1.setScene(scene1);
            sm2.setScene(scene2);

            expect(sm1.currentScene).toBe(scene1);
            expect(sm2.currentScene).toBe(scene2);

            // 清理
            sm1.destroy();
            sm2.destroy();
        });
    });
});
