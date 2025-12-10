import { Core } from '../../src/Core';
import { World } from '../../src/ECS/World';
import { Scene } from '../../src/ECS/Scene';
import { Component } from '../../src/ECS/Component';
import { Matcher } from '../../src/ECS/Utils/Matcher';
import { DebugPlugin } from '../../src/Plugins/DebugPlugin';
import { Injectable } from '../../src/Core/DI';
import { ECSSystem, ECSComponent } from '../../src/ECS/Decorators';
import { EntitySystem } from '../../src/ECS/Systems/EntitySystem';

@ECSComponent('Debug_HealthComponent')
class HealthComponent extends Component {
    public health: number = 100;
    public maxHealth: number = 100;
}

@ECSComponent('Debug_PositionComponent')
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
}

@Injectable()
@ECSSystem('TestSystem', { updateOrder: 10 })
class TestSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(PositionComponent));
    }

    protected override process(entities: readonly import('../../src/ECS/Entity').Entity[]): void {
        // 模拟处理逻辑
    }
}

describe('DebugPlugin', () => {
    let core: Core;
    let world: World;
    let scene: Scene;
    let debugPlugin: DebugPlugin;

    beforeEach(() => {
        core = Core.create({ debug: false });
        world = Core.worldManager.createWorld('test-world', { name: 'test-world' });
        scene = world.createScene('test-scene');
        world.setSceneActive('test-scene', true);
        world.start();

        debugPlugin = new DebugPlugin({ autoStart: false, updateInterval: 1000 });
    });

    afterEach(() => {
        debugPlugin.stop();
        Core.destroy();
    });

    describe('基本功能', () => {
        it('应该能够安装插件', async () => {
            await Core.installPlugin(debugPlugin);
            expect(Core.isPluginInstalled('@esengine/debug-plugin')).toBe(true);
        });

        it('应该能够卸载插件', async () => {
            await Core.installPlugin(debugPlugin);
            await Core.uninstallPlugin('@esengine/debug-plugin');
            expect(Core.isPluginInstalled('@esengine/debug-plugin')).toBe(false);
        });

        it('应该能够获取插件信息', async () => {
            await Core.installPlugin(debugPlugin);
            const plugin = Core.getPlugin('@esengine/debug-plugin');
            expect(plugin).toBeDefined();
            expect(plugin?.name).toBe('@esengine/debug-plugin');
            expect(plugin?.version).toBe('1.0.0');
        });
    });

    describe('统计信息', () => {
        beforeEach(async () => {
            await Core.installPlugin(debugPlugin);
        });

        it('应该能够获取 ECS 统计信息', () => {
            const entity1 = scene.createEntity('Entity1');
            entity1.addComponent(new PositionComponent());

            const entity2 = scene.createEntity('Entity2');
            entity2.addComponent(new HealthComponent());

            const stats = debugPlugin.getStats();

            expect(stats).toBeDefined();
            expect(stats.totalEntities).toBe(2);
            expect(stats.scenes.length).toBe(1);
            expect(stats.scenes[0].name).toBe('test-scene');
            expect(stats.scenes[0].entityCount).toBe(2);
        });

        it('应该能够获取场景信息', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new PositionComponent());
            entity.addComponent(new HealthComponent());

            scene.registerSystems([TestSystem]);

            const sceneInfo = debugPlugin.getSceneInfo(scene);

            expect(sceneInfo.name).toBe('test-scene');
            expect(sceneInfo.entityCount).toBe(1);
            expect(sceneInfo.systems.length).toBeGreaterThan(0);
            expect(sceneInfo.entities.length).toBe(1);
        });

        it('应该能够获取实体详细信息', () => {
            const entity = scene.createEntity('PlayerEntity');
            entity.tag = 1;
            entity.addComponent(new PositionComponent());
            entity.addComponent(new HealthComponent());

            const entityInfo = debugPlugin.getEntityInfo(entity);

            expect(entityInfo.name).toBe('PlayerEntity');
            expect(entityInfo.tag).toBe(1);
            expect(entityInfo.enabled).toBe(true);
            expect(entityInfo.componentCount).toBe(2);
            expect(entityInfo.components.length).toBe(2);

            const componentTypes = entityInfo.components.map(c => c.type);
            expect(componentTypes).toContain('PositionComponent');
            expect(componentTypes).toContain('HealthComponent');
        });

        it('应该能够获取组件数据', () => {
            const entity = scene.createEntity('TestEntity');
            const position = new PositionComponent();
            position.x = 100;
            position.y = 200;
            entity.addComponent(position);

            const entityInfo = debugPlugin.getEntityInfo(entity);
            const positionInfo = entityInfo.components.find(c => c.type === 'PositionComponent');

            expect(positionInfo).toBeDefined();
            expect(positionInfo?.data.x).toBe(100);
            expect(positionInfo?.data.y).toBe(200);
        });
    });

    describe('实体查询', () => {
        beforeEach(async () => {
            await Core.installPlugin(debugPlugin);

            const entity1 = scene.createEntity('Player');
            entity1.tag = 1;
            entity1.addComponent(new PositionComponent());
            entity1.addComponent(new HealthComponent());

            const entity2 = scene.createEntity('Enemy');
            entity2.tag = 2;
            entity2.addComponent(new PositionComponent());

            const entity3 = scene.createEntity('Item');
            entity3.tag = 3;
            entity3.addComponent(new HealthComponent());
        });

        it('应该能够按 tag 查询实体', () => {
            const results = debugPlugin.queryEntities({ tag: 1 });

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Player');
            expect(results[0].tag).toBe(1);
        });

        it('应该能够按名称查询实体', () => {
            const results = debugPlugin.queryEntities({ name: 'Player' });

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Player');
        });

        it('应该能够按组件查询实体', () => {
            const results = debugPlugin.queryEntities({ hasComponent: 'PositionComponent' });

            expect(results.length).toBe(2);
            expect(results.map(r => r.name)).toContain('Player');
            expect(results.map(r => r.name)).toContain('Enemy');
        });

        it('应该能够组合多个过滤条件', () => {
            const results = debugPlugin.queryEntities({
                tag: 1,
                hasComponent: 'HealthComponent'
            });

            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Player');
        });

        it('应该在没有匹配时返回空数组', () => {
            const results = debugPlugin.queryEntities({ tag: 999 });
            expect(results.length).toBe(0);
        });

        it('应该能够按 sceneName 过滤实体', () => {
            // 查询特定场景的实体
            const results = debugPlugin.queryEntities({ sceneName: 'test-scene' });

            // 应该返回 test-scene 中的所有实体（Player, Enemy, Item）
            expect(results.length).toBe(3);
        });
    });

    describe('监控功能', () => {
        beforeEach(async () => {
            await Core.installPlugin(debugPlugin);
        });

        it('应该能够启动监控', () => {
            debugPlugin.start();
            expect(debugPlugin['updateTimer']).not.toBeNull();
        });

        it('应该能够停止监控', () => {
            debugPlugin.start();
            debugPlugin.stop();
            expect(debugPlugin['updateTimer']).toBeNull();
        });

        it('应该防止重复启动', () => {
            debugPlugin.start();
            const timer1 = debugPlugin['updateTimer'];

            debugPlugin.start();
            const timer2 = debugPlugin['updateTimer'];

            expect(timer1).toBe(timer2);

            debugPlugin.stop();
        });

        it('应该支持自动启动', async () => {
            await Core.uninstallPlugin('@esengine/debug-plugin');

            const autoPlugin = new DebugPlugin({ autoStart: true, updateInterval: 100 });
            await Core.installPlugin(autoPlugin);

            expect(autoPlugin['updateTimer']).not.toBeNull();

            autoPlugin.stop();
        });
    });

    describe('数据导出', () => {
        beforeEach(async () => {
            await Core.installPlugin(debugPlugin);
        });

        it('应该能够导出 JSON 格式数据', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new PositionComponent());

            const json = debugPlugin.exportJSON();

            expect(json).toBeDefined();
            expect(typeof json).toBe('string');

            const data = JSON.parse(json);
            expect(data.totalEntities).toBe(1);
            expect(data.scenes).toBeDefined();
            expect(data.timestamp).toBeDefined();
        });

        it('导出的 JSON 应该包含完整的实体信息', () => {
            const entity = scene.createEntity('ComplexEntity');
            const position = new PositionComponent();
            position.x = 50;
            position.y = 75;
            entity.addComponent(position);

            const json = debugPlugin.exportJSON();
            const data = JSON.parse(json);

            const entityData = data.scenes[0].entities[0];
            expect(entityData.name).toBe('ComplexEntity');
            expect(entityData.components[0].data.x).toBe(50);
            expect(entityData.components[0].data.y).toBe(75);
        });
    });

    describe('性能监控', () => {
        beforeEach(async () => {
            await Core.installPlugin(debugPlugin);
            scene.registerSystems([TestSystem]);
        });

        it('应该能够获取 System 性能数据', () => {
            scene.createEntity('E1').addComponent(new PositionComponent());
            scene.createEntity('E2').addComponent(new PositionComponent());

            scene.update();
            scene.update();
            scene.update();

            const sceneInfo = debugPlugin.getSceneInfo(scene);
            const systemInfo = sceneInfo.systems.find(s => s.name === 'TestSystem');

            expect(systemInfo).toBeDefined();
            if (systemInfo?.performance) {
                expect(systemInfo.performance.totalCalls).toBeGreaterThan(0);
                expect(systemInfo.performance.avgExecutionTime).toBeGreaterThanOrEqual(0);
            }
        });

        it('应该记录 System 的实体数量', () => {
            scene.createEntity('E1').addComponent(new PositionComponent());
            scene.createEntity('E2').addComponent(new PositionComponent());
            scene.createEntity('E3').addComponent(new HealthComponent());

            const sceneInfo = debugPlugin.getSceneInfo(scene);
            const systemInfo = sceneInfo.systems.find(s => s.name === 'TestSystem');

            expect(systemInfo).toBeDefined();
            expect(systemInfo?.entityCount).toBe(2);
        });
    });

    describe('错误处理', () => {
        it('应该在未安装时抛出错误', () => {
            expect(() => {
                debugPlugin.getStats();
            }).toThrow('Plugin not installed');
        });

        it('应该在未安装时查询实体抛出错误', () => {
            expect(() => {
                debugPlugin.queryEntities({ tag: 1 });
            }).toThrow('Plugin not installed');
        });

        it('应该处理空场景', async () => {
            await Core.installPlugin(debugPlugin);

            const stats = debugPlugin.getStats();

            expect(stats.totalEntities).toBe(0);
            expect(stats.totalSystems).toBe(0);
        });

        it('应该处理没有 World 的情况', async () => {
            Core.destroy();
            Core.create({ debug: false });
            const tempPlugin = new DebugPlugin();

            await Core.installPlugin(tempPlugin);

            const stats = tempPlugin.getStats();

            expect(stats.totalEntities).toBe(0);
            expect(stats.scenes.length).toBe(0);
        });
    });
});
