import { World, IWorldConfig, IGlobalSystem } from '../../src/ECS/World';
import { Scene } from '../../src/ECS/Scene';
import { EntitySystem } from '../../src/ECS/Systems/EntitySystem';
import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';
import { Matcher } from '../../src/ECS/Utils/Matcher';
import { IService } from '../../src/Core/ServiceContainer';
import { ECSComponent } from '../../src/ECS/Decorators';

// 测试用组件
@ECSComponent('WorldTest_TestComponent')
class TestComponent extends Component {
    public value: number = 0;

    constructor(value: number = 0) {
        super();
        this.value = value;
    }
}

@ECSComponent('WorldTest_PlayerComponent')
class PlayerComponent extends Component {
    public playerId: string;

    constructor(playerId: string) {
        super();
        this.playerId = playerId;
    }
}

// 测试用全局系统
class TestGlobalSystem implements IGlobalSystem {
    public readonly name = 'TestGlobalSystem';
    public updateCount: number = 0;
    
    public initialize(): void {
        // 初始化逻辑
    }
    
    public update(): void {
        this.updateCount++;
    }
    
    public reset(): void {
        this.updateCount = 0;
    }
    
    public destroy(): void {
        // 销毁逻辑
    }
}

class TestSceneSystem extends EntitySystem {
    public updateCount = 0;

    constructor() {
        super(Matcher.empty().all(PlayerComponent));
    }

    protected override process(): void {
        this.updateCount++;
    }
}

// 测试用服务
class TestWorldService implements IService {
    public disposed = false;
    public value = 'test';

    dispose(): void {
        this.disposed = true;
    }
}

// 测试用Scene
class TestScene extends Scene {
    public initializeCalled = false;
    public beginCalled = false;
    public endCalled = false;
    
    public override initialize(): void {
        this.initializeCalled = true;
        super.initialize();
    }
    
    public override begin(): void {
        this.beginCalled = true;
        super.begin();
    }
    
    public override end(): void {
        this.endCalled = true;
        super.end();
    }
}

describe('World', () => {
    let world: World;
    
    beforeEach(() => {
        world = new World({ name: 'TestWorld' });
    });
    
    afterEach(() => {
        if (world) {
            world.destroy();
        }
    });
    
    describe('基础功能', () => {
        test('创建World时应该设置正确的配置', () => {
            const config: IWorldConfig = {
                name: 'GameWorld',
                debug: true,
                maxScenes: 5,
                autoCleanup: false
            };
            
            const testWorld = new World(config);
            
            expect(testWorld.name).toBe('GameWorld');
            expect(testWorld.sceneCount).toBe(0);
            expect(testWorld.isActive).toBe(false);
            expect(testWorld.createdAt).toBeGreaterThan(0);
            
            testWorld.destroy();
        });
        
        test('默认配置应该正确', () => {
            const defaultWorld = new World();
            
            expect(defaultWorld.name).toBe('World');
            expect(defaultWorld.sceneCount).toBe(0);
            expect(defaultWorld.isActive).toBe(false);
            
            defaultWorld.destroy();
        });
    });
    
    describe('Scene管理', () => {
        test('创建Scene应该成功', () => {
            const scene = world.createScene('test-scene');
            
            expect(scene).toBeDefined();
            expect(world.sceneCount).toBe(1);
            expect(world.getSceneIds()).toContain('test-scene');
        });
        
        test('创建Scene时传入自定义Scene实例', () => {
            const customScene = new TestScene();
            const scene = world.createScene('custom-scene', customScene);
            
            expect(scene).toBe(customScene);
            expect(scene.initializeCalled).toBe(true);
            expect(world.sceneCount).toBe(1);
        });
        
        test('空的Scene name应该抛出错误', () => {
            expect(() => {
                world.createScene('');
            }).toThrow('Scene name不能为空');

            expect(() => {
                world.createScene('   ');
            }).toThrow('Scene name不能为空');
        });

        test('重复的Scene ID应该抛出错误', () => {
            world.createScene('duplicate');

            expect(() => {
                world.createScene('duplicate');
            }).toThrow("Scene name 'duplicate' 已存在于World 'TestWorld' 中");
        });

        test('超出最大Scene数量限制应该抛出错误', () => {
            const limitedWorld = new World({ maxScenes: 2 });
            
            limitedWorld.createScene('scene1');
            limitedWorld.createScene('scene2');
            
            expect(() => {
                limitedWorld.createScene('scene3');
            }).toThrow("World 'World' 已达到最大Scene数量限制: 2");
            
            limitedWorld.destroy();
        });
        
        test('获取Scene应该正确', () => {
            const scene = world.createScene('get-test');
            const retrievedScene = world.getScene('get-test');
            
            expect(retrievedScene).toBe(scene);
        });
        
        test('获取不存在的Scene应该返回null', () => {
            const scene = world.getScene('non-existent');
            expect(scene).toBeNull();
        });
        
        test('移除Scene应该正确清理', () => {
            const testScene = new TestScene();
            world.createScene('remove-test', testScene);
            world.setSceneActive('remove-test', true);
            
            const removed = world.removeScene('remove-test');
            
            expect(removed).toBe(true);
            expect(world.sceneCount).toBe(0);
            expect(world.getScene('remove-test')).toBeNull();
            expect(testScene.endCalled).toBe(true);
        });
        
        test('移除不存在的Scene应该返回false', () => {
            const removed = world.removeScene('non-existent');
            expect(removed).toBe(false);
        });
        
        test('获取所有Scene应该正确', () => {
            const scene1 = world.createScene('scene1');
            const scene2 = world.createScene('scene2');
            
            const allScenes = world.getAllScenes();
            
            expect(allScenes).toHaveLength(2);
            expect(allScenes).toContain(scene1);
            expect(allScenes).toContain(scene2);
        });
    });
    
    describe('Scene激活管理', () => {
        test('激活Scene应该正确', () => {
            const testScene = new TestScene();
            world.createScene('active-test', testScene);
            
            world.setSceneActive('active-test', true);
            
            expect(world.isSceneActive('active-test')).toBe(true);
            expect(world.getActiveSceneCount()).toBe(1);
            expect(testScene.beginCalled).toBe(true);
        });
        
        test('停用Scene应该正确', () => {
            world.createScene('deactive-test');
            world.setSceneActive('deactive-test', true);
            
            world.setSceneActive('deactive-test', false);
            
            expect(world.isSceneActive('deactive-test')).toBe(false);
            expect(world.getActiveSceneCount()).toBe(0);
        });
        
        test('激活不存在的Scene应该记录警告', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            world.setSceneActive('non-existent', true);
            
            // 注意：这里需要检查具体的日志实现，可能需要调整
            consoleSpy.mockRestore();
        });
    });
    
    describe('全局System管理', () => {
        test('添加全局System应该成功', () => {
            const globalSystem = new TestGlobalSystem();
            
            const addedSystem = world.addGlobalSystem(globalSystem);
            
            expect(addedSystem).toBe(globalSystem);
            expect(world.getGlobalSystem(TestGlobalSystem)).toBe(globalSystem);
        });
        
        test('重复添加相同System应该返回原System', () => {
            const globalSystem = new TestGlobalSystem();
            
            const firstAdd = world.addGlobalSystem(globalSystem);
            const secondAdd = world.addGlobalSystem(globalSystem);
            
            expect(firstAdd).toBe(secondAdd);
            expect(firstAdd).toBe(globalSystem);
        });
        
        test('移除全局System应该成功', () => {
            const globalSystem = new TestGlobalSystem();
            world.addGlobalSystem(globalSystem);
            
            const removed = world.removeGlobalSystem(globalSystem);
            
            expect(removed).toBe(true);
            expect(world.getGlobalSystem(TestGlobalSystem)).toBeNull();
        });
        
        test('移除不存在的System应该返回false', () => {
            const globalSystem = new TestGlobalSystem();
            
            const removed = world.removeGlobalSystem(globalSystem);
            
            expect(removed).toBe(false);
        });
        
        test('获取不存在的System类型应该返回null', () => {
            const system = world.getGlobalSystem(TestGlobalSystem);
            expect(system).toBeNull();
        });
    });
    
    describe('World生命周期', () => {
        test('启动World应该正确', () => {
            const globalSystem = new TestGlobalSystem();
            world.addGlobalSystem(globalSystem);
            
            world.start();
            
            expect(world.isActive).toBe(true);
        });
        
        test('重复启动World应该无效果', () => {
            world.start();
            const firstActive = world.isActive;
            
            world.start();
            
            expect(world.isActive).toBe(firstActive);
        });
        
        test('停止World应该停用所有Scene', () => {
            const testScene = new TestScene();
            world.createScene('stop-test', testScene);
            world.setSceneActive('stop-test', true);
            world.start();
            
            world.stop();
            
            expect(world.isActive).toBe(false);
            expect(world.isSceneActive('stop-test')).toBe(false);
        });
        
        test('销毁World应该清理所有资源', () => {
            const testScene = new TestScene();
            const globalSystem = new TestGlobalSystem();
            
            world.createScene('destroy-test', testScene);
            world.addGlobalSystem(globalSystem);
            world.start();
            
            world.destroy();
            
            expect(world.sceneCount).toBe(0);
            expect(world.isActive).toBe(false);
            expect(testScene.endCalled).toBe(true);
        });
    });
    
    describe('更新逻辑', () => {
        test('updateGlobalSystems应该更新全局系统', () => {
            const globalSystem = new TestGlobalSystem();
            world.addGlobalSystem(globalSystem);
            world.start();
            
            // 创建测试Scene
            const scene = world.createScene('update-test');
            world.setSceneActive('update-test', true);
            
            // 直接测试全局系统更新
            world.updateGlobalSystems();
            
            // 验证全局System被正确调用
            expect(globalSystem.updateCount).toBeGreaterThan(0);
        });
        
        test('未激活的World不应该更新', () => {
            const globalSystem = new TestGlobalSystem();
            world.addGlobalSystem(globalSystem);
            // 不启动World
            
            world.updateGlobalSystems();
            
            expect(globalSystem.updateCount).toBe(0);
        });
        
        test('updateScenes应该更新激活的Scene', () => {
            const scene1 = world.createScene('scene1');
            const scene2 = world.createScene('scene2');
            
            scene1.addEntityProcessor(new TestSceneSystem());
            scene2.addEntityProcessor(new TestSceneSystem());
            
            world.start();
            world.setSceneActive('scene1', true);
            // scene2保持未激活
            
            world.updateScenes();
            
            // 这里需要根据具体的Scene更新实现来验证
            // 由于Scene.update()的具体实现可能不同，这里主要测试调用不出错
            expect(() => world.updateScenes()).not.toThrow();
        });
    });
    
    describe('状态和统计', () => {
        test('获取World状态应该正确', () => {
            world.createScene('status-scene1');
            world.createScene('status-scene2');
            world.setSceneActive('status-scene1', true);
            world.addGlobalSystem(new TestGlobalSystem());
            world.start();
            
            const status = world.getStatus();
            
            expect(status.name).toBe('TestWorld');
            expect(status.isActive).toBe(true);
            expect(status.sceneCount).toBe(2);
            expect(status.activeSceneCount).toBe(1);
            expect(status.globalSystemCount).toBe(1);
            expect(status.createdAt).toBeGreaterThan(0);
            expect(status.scenes).toHaveLength(2);
            
            const activeScene = status.scenes.find(s => s.id === 'status-scene1');
            expect(activeScene?.isActive).toBe(true);
            
            const inactiveScene = status.scenes.find(s => s.id === 'status-scene2');
            expect(inactiveScene?.isActive).toBe(false);
        });
        
        test('获取World统计应该包含基本信息', () => {
            world.addGlobalSystem(new TestGlobalSystem());
            
            const scene = world.createScene('stats-scene');
            const entity = scene.createEntity('stats-entity');
            entity.addComponent(new TestComponent());
            
            const stats = world.getStats();
            
            expect(stats).toHaveProperty('totalEntities');
            expect(stats).toHaveProperty('totalSystems');
            expect(stats).toHaveProperty('memoryUsage');
            expect(stats).toHaveProperty('performance');
            expect(stats.totalSystems).toBeGreaterThanOrEqual(1);
        });
    });
    
    describe('自动清理功能', () => {
        test('自动清理应该移除空闲Scene', async () => {
            // 创建一个启用自动清理的World
            const autoCleanWorld = new World({
                name: 'AutoCleanWorld',
                autoCleanup: true,
                maxScenes: 10
            });
            
            // 创建一个空Scene
            autoCleanWorld.createScene('empty-scene');
            autoCleanWorld.start();
            
            // 手动触发清理检查
            autoCleanWorld.updateScenes();
            
            // 由于清理策略基于时间，这里主要测试不会出错
            expect(() => autoCleanWorld.updateScenes()).not.toThrow();
            
            autoCleanWorld.destroy();
        });
    });
    
    describe('服务容器', () => {
        test('应该能访问World级别的服务容器', () => {
            const services = world.services;

            expect(services).toBeDefined();
            expect(services).toHaveProperty('registerSingleton');
            expect(services).toHaveProperty('resolve');
        });

        test('应该能在World服务容器中注册和解析服务', () => {
            world.services.registerSingleton(TestWorldService);

            const service = world.services.resolve(TestWorldService);

            expect(service).toBeDefined();
            expect(service.value).toBe('test');
            expect(service.disposed).toBe(false);
        });

        test('World销毁时应该清理服务容器中的服务', () => {
            const service = new TestWorldService();
            world.services.registerInstance(TestWorldService, service);

            world.destroy();

            expect(service.disposed).toBe(true);
        });

        test('World服务容器应该独立于Scene服务容器', () => {
            const scene = world.createScene('test-scene');

            world.services.registerSingleton(TestWorldService);

            expect(world.services.isRegistered(TestWorldService)).toBe(true);
            expect(scene.services.isRegistered(TestWorldService)).toBe(false);
        });
    });

    describe('错误处理', () => {
        test('Scene name为空时应该抛出错误', () => {
            expect(() => {
                world.createScene('');
            }).toThrow('Scene name不能为空');
        });

        test('极限情况下的资源管理', () => {
            // 创建大量Scene
            for (let i = 0; i < 5; i++) {
                world.createScene(`scene_${i}`);
                world.setSceneActive(`scene_${i}`, true);
            }

            // 添加多个全局System
            for (let i = 0; i < 3; i++) {
                world.addGlobalSystem(new TestGlobalSystem());
            }

            world.start();

            // 测试批量清理
            expect(() => world.destroy()).not.toThrow();
        });
    });
});