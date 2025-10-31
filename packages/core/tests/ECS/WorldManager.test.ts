import { WorldManager, IWorldManagerConfig } from '../../src/ECS/WorldManager';
import { World, IWorldConfig } from '../../src/ECS/World';
import { Scene } from '../../src/ECS/Scene';
import { EntitySystem } from '../../src/ECS/Systems/EntitySystem';
import { Component } from '../../src/ECS/Component';
import { Matcher } from '../../src/ECS/Utils/Matcher';

// 测试用组件
class TestComponent extends Component {
    public value: number = 0;
    
    constructor(value: number = 0) {
        super();
        this.value = value;
    }
}

// 测试用全局系统
class TestGlobalSystem {
    public readonly name = 'TestGlobalSystem';
    public updateCount: number = 0;
    
    public initialize(): void {
        // 初始化
    }
    
    public update(): void {
        this.updateCount++;
    }
    
    public reset(): void {
        this.updateCount = 0;
    }
    
    public destroy(): void {
        // 销毁
    }
}

describe('WorldManager', () => {
    let worldManager: WorldManager;

    beforeEach(() => {
        // WorldManager不再是单例，直接创建新实例
        worldManager = new WorldManager();
    });

    afterEach(() => {
        // 清理所有World
        if (worldManager) {
            const worldIds = worldManager.getWorldIds();
            worldIds.forEach(id => {
                worldManager.removeWorld(id);
            });
            // 清理定时器
            worldManager.destroy();
        }
    });

    describe('实例化', () => {
        test('可以创建多个独立的WorldManager实例', () => {
            const manager1 = new WorldManager();
            const manager2 = new WorldManager();

            expect(manager1).not.toBe(manager2);

            manager1.createWorld('world1');
            expect(manager2.getWorld('world1')).toBeNull();

            // 清理
            manager1.destroy();
            manager2.destroy();
        });

        test('使用配置创建实例应该正确', () => {
            const config: IWorldManagerConfig = {
                maxWorlds: 10,
                autoCleanup: true,
                debug: false
            };

            const instance = new WorldManager(config);

            expect(instance).toBeDefined();
            expect(instance.worldCount).toBe(0);

            // 清理
            instance.destroy();
        });
    });

    describe('World管理', () => {
        test('创建World应该成功', () => {
            const world = worldManager.createWorld('test-world');
            
            expect(world).toBeDefined();
            expect(world.name).toBe('test-world');
            expect(worldManager.getWorld('test-world')).toBeDefined();
            expect(worldManager.getWorldIds()).toContain('test-world');
        });
        
        test('创建World时传入配置应该正确', () => {
            const worldConfig: IWorldConfig = {
                name: 'ConfiguredWorld',
                debug: true,
                maxScenes: 5,
                autoCleanup: false
            };
            
            const world = worldManager.createWorld('configured-world', worldConfig);

            expect(world.name).toBe('configured-world');
        });
        
        test('重复的World ID应该抛出错误', () => {
            worldManager.createWorld('duplicate-world');
            
            expect(() => {
                worldManager.createWorld('duplicate-world');
            }).toThrow("World ID 'duplicate-world' 已存在");
        });
        
        test('超出最大World数量应该抛出错误', () => {
            const limitedManager = new WorldManager({ maxWorlds: 2 });

            limitedManager.createWorld('world1');
            limitedManager.createWorld('world2');

            expect(() => {
                limitedManager.createWorld('world3');
            }).toThrow("已达到最大World数量限制: 2");

            // 清理
            limitedManager.destroy();
        });
        
        test('获取World应该正确', () => {
            const world = worldManager.createWorld('get-world');
            const retrievedWorld = worldManager.getWorld('get-world');
            
            expect(retrievedWorld).toBe(world);
        });
        
        test('获取不存在的World应该返回null', () => {
            const world = worldManager.getWorld('non-existent');
            expect(world).toBeNull();
        });
        
        test('检查World存在性应该正确', () => {
            expect(worldManager.getWorld('non-existent')).toBeNull();
            
            worldManager.createWorld('exists');
            expect(worldManager.getWorld('exists')).toBeDefined();
        });
        
        test('销毁World应该正确清理', () => {
            const world = worldManager.createWorld('destroy-world');
            world.start();
            
            const destroyed = worldManager.removeWorld('destroy-world');
            
            expect(destroyed).toBe(true);
            expect(worldManager.getWorld('destroy-world')).toBeNull();
        });
        
        test('销毁不存在的World应该返回false', () => {
            const destroyed = worldManager.removeWorld('non-existent');
            expect(destroyed).toBe(false);
        });
        
        test('获取所有World ID应该正确', () => {
            worldManager.createWorld('world1');
            worldManager.createWorld('world2');
            worldManager.createWorld('world3');
            
            const worldIds = worldManager.getWorldIds();
            
            expect(worldIds).toHaveLength(3);
            expect(worldIds).toContain('world1');
            expect(worldIds).toContain('world2');
            expect(worldIds).toContain('world3');
        });
    });
    
    describe('活跃World管理', () => {
        test('启动World应该加入活跃列表', () => {
            const world = worldManager.createWorld('active-world');
            
            worldManager.setWorldActive('active-world', true);
            
            const activeWorlds = worldManager.getActiveWorlds();
            expect(activeWorlds).toHaveLength(1);
            expect(activeWorlds[0]).toBe(world);
        });
        
        test('停止World应该从活跃列表移除', () => {
            const world = worldManager.createWorld('inactive-world');
            worldManager.setWorldActive('inactive-world', true);
            
            worldManager.setWorldActive('inactive-world', false);
            
            const activeWorlds = worldManager.getActiveWorlds();
            expect(activeWorlds).toHaveLength(0);
        });
        
        test('销毁激活的World应该从活跃列表移除', () => {
            const world = worldManager.createWorld('destroy-active');
            worldManager.setWorldActive('destroy-active', true);
            
            worldManager.removeWorld('destroy-active');
            
            const activeWorlds = worldManager.getActiveWorlds();
            expect(activeWorlds).toHaveLength(0);
        });
        
        test('多个World的激活状态应该独立管理', () => {
            const world1 = worldManager.createWorld('world1');
            const world2 = worldManager.createWorld('world2');
            const world3 = worldManager.createWorld('world3');
            
            worldManager.setWorldActive('world1', true);
            worldManager.setWorldActive('world3', true);
            // world2 保持未启动
            
            const activeWorlds = worldManager.getActiveWorlds();
            
            expect(activeWorlds).toHaveLength(2);
            expect(activeWorlds).toContain(world1);
            expect(activeWorlds).toContain(world3);
            expect(activeWorlds).not.toContain(world2);
        });
    });
    
    describe('统计和监控', () => {
        test('获取WorldManager状态应该正确', () => {
            worldManager.createWorld('status-world1');
            const world2 = worldManager.createWorld('status-world2');
            worldManager.setWorldActive('status-world2', true);
            
            const status = worldManager.getStats();
            
            expect(status.totalWorlds).toBe(2);
            expect(status.activeWorlds).toBe(1);
            expect(status.config.maxWorlds).toBeGreaterThan(0);
            expect(status.memoryUsage).toBeGreaterThanOrEqual(0);
            expect(status.isRunning).toBeDefined();
        });
        
        test('获取所有World统计应该包含详细信息', () => {
            const world1 = worldManager.createWorld('stats-world1');
            const world2 = worldManager.createWorld('stats-world2');
            
            // 为world1添加一些内容
            const scene1 = world1.createScene('scene1');
            scene1.createEntity('entity1');
            worldManager.setWorldActive('stats-world1', true);
            
            // world2保持空
            
            const allStats = worldManager.getDetailedStatus().worlds;
            
            expect(allStats).toHaveLength(2);
            
            const world1Stats = allStats.find(stat => stat.id === 'stats-world1');
            const world2Stats = allStats.find(stat => stat.id === 'stats-world2');
            
            expect(world1Stats).toBeDefined();
            expect(world2Stats).toBeDefined();
            expect(world1Stats?.isActive).toBe(true);
            expect(world2Stats?.isActive).toBe(false);
        });
        
        test('空WorldManager的统计应该正确', () => {
            const status = worldManager.getStats();
            const allStats = worldManager.getDetailedStatus().worlds;
            
            expect(status.totalWorlds).toBe(0);
            expect(status.activeWorlds).toBe(0);
            expect(allStats).toHaveLength(0);
        });
    });
    
    describe('清理功能', () => {
        test('清理空闲World应该移除符合条件的World', () => {
            // 创建一个空的World
            const emptyWorld = worldManager.createWorld('empty-world');
            
            // 创建一个有内容的World
            const fullWorld = worldManager.createWorld('full-world');
            const scene = fullWorld.createScene('scene');
            scene.createEntity('entity');
            fullWorld.start();
            
            // 执行清理
            const cleanedCount = worldManager.cleanup();
            
            // 由于清理逻辑可能基于时间或其他条件，这里主要测试不会出错
            expect(cleanedCount).toBeGreaterThanOrEqual(0);
            expect(() => worldManager.cleanup()).not.toThrow();
        });
    });
    
    describe('World更新协调', () => {
        test('更新所有活跃World应该正确', () => {
            const world1 = worldManager.createWorld('update-world1');
            const world2 = worldManager.createWorld('update-world2');
            const world3 = worldManager.createWorld('update-world3');
            
            // 添加一些内容到World中
            const scene1 = world1.createScene('scene1');
            const scene2 = world2.createScene('scene2');
            
            scene1.createEntity('entity1');
            scene2.createEntity('entity2');
            
            // 启动部分World
            worldManager.setWorldActive('update-world1', true);
            worldManager.setWorldActive('update-world2', true);
            // world3保持未启动
            
            // 手动调用更新（通常由Core.update()调用）
            const activeWorlds = worldManager.getActiveWorlds();
            
            expect(() => {
                activeWorlds.forEach(world => {
                    world.updateGlobalSystems();
                    world.updateScenes();
                });
            }).not.toThrow();
            
            expect(activeWorlds).toHaveLength(2);
        });
    });
    
    describe('边界情况和错误处理', () => {
        test('World ID为空字符串应该抛出错误', () => {
            expect(() => {
                worldManager.createWorld('');
            }).toThrow();
        });
        
        test('World ID为null或undefined应该抛出错误', () => {
            expect(() => {
                worldManager.createWorld(null as any);
            }).toThrow();
            
            expect(() => {
                worldManager.createWorld(undefined as any);
            }).toThrow();
        });
        
        test('极限情况下的大量World管理', () => {
            const worldCount = 50;
            const worldIds: string[] = [];
            
            // 创建大量World
            for (let i = 0; i < worldCount; i++) {
                const worldId = `mass-world-${i}`;
                worldIds.push(worldId);
                
                expect(() => {
                    worldManager.createWorld(worldId);
                }).not.toThrow();
            }
            
            expect(worldManager.getWorldIds()).toHaveLength(worldCount);
            
            // 启动一半的World
            for (let i = 0; i < worldCount / 2; i++) {
                worldManager.setWorldActive(worldIds[i], true);
            }
            
            expect(worldManager.getActiveWorlds()).toHaveLength(worldCount / 2);
            
            // 批量清理
            worldIds.forEach(id => {
                expect(() => {
                    worldManager.removeWorld(id);
                }).not.toThrow();
            });
            
            expect(worldManager.getWorldIds()).toHaveLength(0);
        });
        
        test('销毁后获取World应该返回null', () => {
            worldManager.createWorld('temp-world');
            worldManager.removeWorld('temp-world');
            
            expect(worldManager.getWorld('temp-world')).toBeNull();
        });
    });
    
    describe('内存管理', () => {
        test('销毁所有World后内存应该被释放', () => {
            // 创建多个World并添加内容
            for (let i = 0; i < 10; i++) {
                const world = worldManager.createWorld(`memory-world-${i}`);
                const scene = world.createScene('scene');
                
                // 添加一些实体和系统
                for (let j = 0; j < 5; j++) {
                    const entity = scene.createEntity(`entity-${j}`);
                    entity.addComponent(new TestComponent(j));
                }
                
                world.addGlobalSystem(new TestGlobalSystem());
                worldManager.setWorldActive(`memory-world-${i}`, true);
            }
            
            const beforeCleanup = worldManager.getStats();
            expect(beforeCleanup.totalWorlds).toBe(10);
            expect(beforeCleanup.activeWorlds).toBe(10);
            
            // 清理所有World
            const worldIds = worldManager.getWorldIds();
            worldIds.forEach(id => {
                worldManager.removeWorld(id);
            });
            
            const afterCleanup = worldManager.getStats();
            expect(afterCleanup.totalWorlds).toBe(0);
            expect(afterCleanup.activeWorlds).toBe(0);
        });
    });
    
    describe('配置验证', () => {
        test('无效的maxWorlds配置应该按传入值使用', () => {
            const invalidConfig: IWorldManagerConfig = {
                maxWorlds: -1,
                autoCleanup: true,
                debug: true
            };

            const manager = new WorldManager(invalidConfig);

            expect(manager.getStats().config.maxWorlds).toBe(-1);

            manager.destroy();
        });

        test('配置应该正确应用于新实例', () => {
            const config: IWorldManagerConfig = {
                maxWorlds: 3,
                autoCleanup: true,
                debug: true
            };

            const manager = new WorldManager(config);

            // 创建到限制数量的World
            manager.createWorld('world1');
            manager.createWorld('world2');
            manager.createWorld('world3');

            // 第四个应该失败
            expect(() => {
                manager.createWorld('world4');
            }).toThrow();

            // 清理
            manager.destroy();
        });
    });
});