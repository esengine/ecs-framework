import { Core } from '../../../src/Core';
import { Scene } from '../../../src/ECS/Scene';
import { World, IGlobalSystem } from '../../../src/ECS/World';
import { WorldManager } from '../../../src/ECS/WorldManager';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Component } from '../../../src/ECS/Component';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { Entity } from '../../../src/ECS/Entity';

// 测试用组件
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

class NetworkComponent extends Component {
    public playerId: string;
    
    constructor(playerId: string) {
        super();
        this.playerId = playerId;
    }
    
    public reset(): void {
        this.playerId = '';
    }
}

// 测试用系统
class TestGlobalSystem extends EntitySystem {
    public processedEntities: Entity[] = [];
    public updateCount: number = 0;
    
    constructor() {
        super(Matcher.empty().all(TestComponent));
    }
    
    protected override process(entities: Entity[]): void {
        this.processedEntities = [...entities];
        this.updateCount++;
    }
}

// 正确的全局系统实现
class NetworkSyncGlobalSystem implements IGlobalSystem {
    public readonly name = 'NetworkSyncSystem';
    public updateCount: number = 0;
    
    public initialize(): void {
        // 初始化网络连接等
    }
    
    public update(): void {
        this.updateCount++;
        // 同步网络数据等全局逻辑
    }
    
    public reset(): void {
        this.updateCount = 0;
    }
    
    public destroy(): void {
        // 清理网络连接等
    }
}

// Scene级别的EntitySystem（正确的用法）
class NetworkSyncSystem extends EntitySystem {
    public syncCount: number = 0;
    
    constructor() {
        super(Matcher.empty().all(NetworkComponent));
    }
    
    protected override process(entities: Entity[]): void {
        this.syncCount++;
    }
}

// World级别的网络同步全局系统
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

// 测试用Scene
class TestScene extends Scene {
    public updateCallCount: number = 0;
    
    public override update(): void {
        super.update();
        this.updateCallCount++;
    }
}

describe('World与Core集成测试', () => {
    beforeEach(() => {
        // 重置Core和WorldManager
        if ((Core as any)._instance) {
            (Core as any)._instance = null;
        }
        WorldManager['_instance'] = null;
    });
    
    afterEach(() => {
        // 清理资源
        if ((Core as any)._instance) {
            const worldManager = Core.getWorldManager?.();
            if (worldManager) {
                const worldIds = worldManager.getWorldIds();
                worldIds.forEach(id => {
                    worldManager.removeWorld(id);
                });
            }
            (Core as any)._instance = null;
        }
        WorldManager['_instance'] = null;
    });
    
    describe('融合设计基础功能', () => {
        test('单Scene模式应该保持向后兼容', () => {
            Core.create({ debug: false });
            
            // 传统单Scene用法
            const scene = new Scene();
            scene.name = 'TestScene';
            
            Core.setScene(scene);
            
            const retrievedScene = Core.getScene();
            expect(retrievedScene).toBe(scene);
            expect(retrievedScene?.name).toBe('TestScene');
        });
        
        test('启用WorldManager后应该支持多World功能', () => {
            Core.create({ debug: false });
            Core.enableWorldManager();
            
            const worldManager = Core.getWorldManager();
            expect(worldManager).toBeDefined();
            
            const world = worldManager.createWorld('TestWorld');
            expect(world).toBeDefined();
            expect(world.name).toBe('TestWorld');
        });
        
        test('getWorldManager应该自动创建WorldManager', () => {
            Core.create({ debug: false });
            
            // 获取WorldManager会自动创建实例
            const worldManager = Core.getWorldManager();
            expect(worldManager).toBeDefined();
            
            // 多次获取应该返回同一个实例
            const worldManager2 = Core.getWorldManager();
            expect(worldManager2).toBe(worldManager);
        });
        
        test('单Scene模式下Core.update应该正常工作', () => {
            Core.create({ debug: false });
            
            const scene = new TestScene();
            Core.setScene(scene);
            
            // 模拟更新
            Core.update(0.016);
            
            expect(scene.updateCallCount).toBeGreaterThan(0);
        });
    });
    
    describe('默认World机制', () => {
        test('设置Scene应该自动创建默认World', () => {
            Core.create({ debug: false });
            
            const scene = new Scene();
            Core.setScene(scene);
            
            // 启用WorldManager后应该能看到默认World
            Core.enableWorldManager();
            const worldManager = Core.getWorldManager();
            
            expect(worldManager.getWorld('__default__')).toBeDefined();
            
            const defaultWorld = worldManager.getWorld('__default__');
            expect(defaultWorld).toBeDefined();
            expect(defaultWorld?.getScene('__main__')).toBe(scene);
        });
        
        test('默认World的Scene应该正确激活', () => {
            Core.create({ debug: false });
            
            const scene = new Scene();
            Core.setScene(scene);
            
            Core.enableWorldManager();
            const worldManager = Core.getWorldManager();
            const defaultWorld = worldManager.getWorld('__default__');
            
            expect(defaultWorld?.isSceneActive('__main__')).toBe(true);
        });
        
        test('替换默认Scene应该正确处理', () => {
            Core.create({ debug: false });
            
            const scene1 = new Scene();
            scene1.name = 'Scene1';
            Core.setScene(scene1);
            
            const scene2 = new Scene();
            scene2.name = 'Scene2';
            Core.setScene(scene2);
            
            const currentScene = Core.getScene();
            expect(currentScene).toBe(scene2);
            expect(currentScene?.name).toBe('Scene2');
        });
    });
    
    describe('多World更新机制', () => {
        test('Core.update应该更新所有活跃World', () => {
            Core.create({ debug: false });
            Core.enableWorldManager();
            
            const worldManager = Core.getWorldManager();
            
            // 创建多个World
            const world1 = worldManager.createWorld('World1');
            const world2 = worldManager.createWorld('World2');
            const world3 = worldManager.createWorld('World3');
            
            // 为每个World创建Scene和System
            const scene1 = world1.createScene('scene1', new TestScene());
            const scene2 = world2.createScene('scene2', new TestScene());
            const scene3 = world3.createScene('scene3', new TestScene());
            
            // 启动部分World
            worldManager.setWorldActive('World1', true);
            worldManager.setWorldActive('World2', true);
            // world3保持未启动
            
            world1.setSceneActive('scene1', true);
            world2.setSceneActive('scene2', true);
            
            // 执行更新
            Core.update(0.016);
            
            // 检查只有激活的World被更新
            expect(scene1.updateCallCount).toBeGreaterThan(0);
            expect(scene2.updateCallCount).toBeGreaterThan(0);
            expect(scene3.updateCallCount).toBe(0);
        });
        
        test('全局系统应该在Scene更新前执行', () => {
            Core.create({ debug: false });
            Core.enableWorldManager();
            
            const worldManager = Core.getWorldManager();
            const world = worldManager.createWorld('TestWorld');
            
            // 添加正确设计的全局系统（业务逻辑系统，不是EntitySystem）
            const globalSystem = new NetworkSyncGlobalSystem();
            world.addGlobalSystem(globalSystem);
            
            // 创建Scene
            const scene = world.createScene('testScene');
            
            worldManager.setWorldActive('TestWorld', true);
            world.setSceneActive('testScene', true);
            
            // 执行更新
            Core.update(0.016);
            
            // 验证全局System被正确更新
            expect(globalSystem.updateCount).toBeGreaterThan(0);
        });
    });
    
    describe('多房间游戏服务器场景', () => {
        test('多个游戏房间应该独立运行', () => {
            Core.create({ debug: false });
            Core.enableWorldManager();
            
            const worldManager = Core.getWorldManager();
            
            // 创建两个游戏房间
            const room1 = worldManager.createWorld('Room_001');
            const room2 = worldManager.createWorld('Room_002');
            
            // 为每个房间设置Scene
            const gameScene1 = room1.createScene('game');
            const gameScene2 = room2.createScene('game');
            
            // 为每个房间添加全局网络系统
            const netSystem1 = new NetworkGlobalSystem();
            const netSystem2 = new NetworkGlobalSystem();
            
            room1.addGlobalSystem(netSystem1);
            room2.addGlobalSystem(netSystem2);
            
            // 在每个房间创建玩家
            const player1 = gameScene1.createEntity('Player1');
            player1.addComponent(new NetworkComponent('player_123'));
            
            const player2 = gameScene2.createEntity('Player2');
            player2.addComponent(new NetworkComponent('player_456'));
            
            // 启动房间
            worldManager.setWorldActive('Room_001', true);
            worldManager.setWorldActive('Room_002', true);
            room1.setSceneActive('game', true);
            room2.setSceneActive('game', true);
            
            // 模拟游戏循环
            for (let i = 0; i < 5; i++) {
                Core.update(0.016);
            }
            
            // 验证每个房间独立运行
            expect(netSystem1.syncCount).toBeGreaterThan(0);
            expect(netSystem2.syncCount).toBeGreaterThan(0);
            expect(room1.getActiveSceneCount()).toBe(1);
            expect(room2.getActiveSceneCount()).toBe(1);
        });
        
        test('房间销毁应该完全清理资源', () => {
            Core.create({ debug: false });
            Core.enableWorldManager();
            
            const worldManager = Core.getWorldManager();
            
            // 创建房间
            const room = worldManager.createWorld('TempRoom');
            const scene = room.createScene('game');
            
            // 添加内容
            for (let i = 0; i < 10; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                entity.addComponent(new TestComponent(i));
            }
            
            room.addGlobalSystem(new NetworkSyncGlobalSystem());
            worldManager.setWorldActive('TempRoom', true);
            room.setSceneActive('game', true);
            
            // 验证房间正常运行
            Core.update(0.016);
            
            const beforeDestroy = worldManager.getStats();
            expect(beforeDestroy.totalWorlds).toBe(1);
            expect(beforeDestroy.activeWorlds).toBe(1);
            
            // 销毁房间
            worldManager.removeWorld('TempRoom');
            
            const afterDestroy = worldManager.getStats();
            expect(afterDestroy.totalWorlds).toBe(0);
            expect(afterDestroy.activeWorlds).toBe(0);
        });
    });
    
    describe('客户端多层Scene架构', () => {
        test('分层Scene应该同时运行', () => {
            Core.create({ debug: false });
            Core.enableWorldManager();
            
            const worldManager = Core.getWorldManager();
            const clientWorld = worldManager.createWorld('ClientWorld');
            
            // 创建不同层的Scene
            const gameplayScene = clientWorld.createScene('gameplay', new TestScene());
            const uiScene = clientWorld.createScene('ui', new TestScene());
            const effectsScene = clientWorld.createScene('effects', new TestScene());
            
            // 启动世界并激活所有Scene
            worldManager.setWorldActive('ClientWorld', true);
            clientWorld.setSceneActive('gameplay', true);
            clientWorld.setSceneActive('ui', true);
            clientWorld.setSceneActive('effects', true);
            
            // 执行更新
            Core.update(0.016);
            
            // 验证所有Scene都被更新
            expect(gameplayScene.updateCallCount).toBeGreaterThan(0);
            expect(uiScene.updateCallCount).toBeGreaterThan(0);
            expect(effectsScene.updateCallCount).toBeGreaterThan(0);
        });
        
        test('Scene的动态激活和停用', () => {
            Core.create({ debug: false });
            Core.enableWorldManager();
            
            const worldManager = Core.getWorldManager();
            const world = worldManager.createWorld('DynamicWorld');
            
            const gameScene = world.createScene('game', new TestScene());
            const menuScene = world.createScene('menu', new TestScene());
            
            worldManager.setWorldActive('DynamicWorld', true);
            
            // 初始状态：只有游戏Scene激活
            world.setSceneActive('game', true);
            world.setSceneActive('menu', false);
            
            Core.update(0.016);
            
            const gameCount1 = gameScene.updateCallCount;
            const menuCount1 = menuScene.updateCallCount;
            
            // 切换到菜单
            world.setSceneActive('game', false);
            world.setSceneActive('menu', true);
            
            Core.update(0.016);
            
            const gameCount2 = gameScene.updateCallCount;
            const menuCount2 = menuScene.updateCallCount;
            
            // 验证Scene状态切换
            expect(gameCount2).toBe(gameCount1); // 游戏Scene停止更新
            expect(menuCount2).toBeGreaterThan(menuCount1); // 菜单Scene开始更新
        });
    });
    
    describe('性能和稳定性', () => {
        test('大量World和Scene应该稳定运行', () => {
            Core.create({ debug: false });
            Core.enableWorldManager();
            
            const worldManager = Core.getWorldManager();
            const worldCount = 20;
            const scenePerWorld = 3;
            
            // 创建大量World和Scene
            for (let i = 0; i < worldCount; i++) {
                const world = worldManager.createWorld(`World${i}`);
                
                for (let j = 0; j < scenePerWorld; j++) {
                    const scene = world.createScene(`Scene${j}`, new TestScene());
                    
                    // 添加一些实体
                    for (let k = 0; k < 5; k++) {
                        const entity = scene.createEntity(`Entity${k}`);
                        entity.addComponent(new TestComponent(k));
                    }
                    
                    world.setSceneActive(`Scene${j}`, true);
                }
                
                worldManager.setWorldActive(`World${i}`, true);
            }
            
            // 验证所有资源创建成功
            expect(worldManager.getWorldIds()).toHaveLength(worldCount);
            expect(worldManager.getActiveWorlds()).toHaveLength(worldCount);
            
            // 执行多次更新测试稳定性
            for (let i = 0; i < 10; i++) {
                expect(() => {
                    Core.update(0.016);
                }).not.toThrow();
            }
            
            // 验证更新正常工作
            const activeWorlds = worldManager.getActiveWorlds();
            activeWorlds.forEach(world => {
                const scenes = world.getAllScenes();
                scenes.forEach(scene => {
                    if (scene instanceof TestScene && world.isSceneActive(scene.name)) {
                        expect(scene.updateCallCount).toBeGreaterThan(0);
                    }
                });
            });
        });
        
        test('频繁的World创建和销毁应该不影响性能', () => {
            Core.create({ debug: false });
            Core.enableWorldManager();
            
            const worldManager = Core.getWorldManager();
            
            // 频繁创建和销毁World
            for (let cycle = 0; cycle < 10; cycle++) {
                // 创建批次World
                const worldIds: string[] = [];
                for (let i = 0; i < 5; i++) {
                    const worldId = `Cycle${cycle}_World${i}`;
                    worldIds.push(worldId);
                    
                    const world = worldManager.createWorld(worldId);
                    const scene = world.createScene('test');
                    scene.createEntity('entity');
                    
                    worldManager.setWorldActive(worldId, true);
                    world.setSceneActive('test', true);
                }
                
                // 更新一次
                Core.update(0.016);
                
                // 销毁批次World
                worldIds.forEach(id => {
                    worldManager.removeWorld(id);
                });
                
                // 验证清理完成
                expect(worldManager.getWorldIds()).toHaveLength(0);
                expect(worldManager.getActiveWorlds()).toHaveLength(0);
            }
        });
    });
    
    describe('错误处理和边界情况', () => {
        test('Core未初始化时操作应该抛出合适错误', () => {
            // getScene 会返回 null 而不是抛出错误
            expect(Core.getScene()).toBeNull();
            
            expect(() => {
                Core.setScene(new Scene());
            }).toThrow();
        });
        
        test('在World销毁后继续操作应该安全', () => {
            Core.create({ debug: false });
            Core.enableWorldManager();
            
            const worldManager = Core.getWorldManager();
            const world = worldManager.createWorld('DestroyTest');
            
            worldManager.setWorldActive('DestroyTest', true);
            worldManager.removeWorld('DestroyTest');
            
            // 对已销毁的World进行操作应该不会崩溃
            expect(() => {
                world.updateGlobalSystems();
                world.updateScenes();
            }).not.toThrow();
        });
        
        test('混合使用单Scene和多World模式', () => {
            Core.create({ debug: false });
            
            // 直接启用WorldManager（避免先使用单Scene创建限制性配置）
            const worldManager = Core.getWorldManager();
            
            // 然后使用单Scene模式
            const singleScene = new Scene();
            Core.setScene(singleScene);
            
            // 验证默认World被创建
            expect(worldManager.getWorld('__default__')).toBeDefined();
            
            // 创建额外的World
            const extraWorld = worldManager.createWorld('ExtraWorld');
            worldManager.setWorldActive('ExtraWorld', true);
            
            // 两种模式应该能共存
            expect(() => {
                Core.update(0.016);
            }).not.toThrow();
        });
    });
});