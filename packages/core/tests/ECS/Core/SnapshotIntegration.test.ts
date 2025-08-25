import { Scene } from '../../../src/ECS/Scene';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { Entity } from '../../../src/ECS/Entity';
import { Time } from '../../../src/Utils/Time';
import { Serializable, SerializableField } from '../../../src/ECS/Decorators/SerializationDecorators';
import { SchemaRegistry } from '../../../src/ECS/Core/Serialization/SchemaRegistry';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage/ComponentRegistry';
import { SnapshotRef } from '../../../src/ECS/Core/Snapshot/SnapshotStore';

// Schema注册表将在需要时初始化

// 测试组件
@Serializable()
class GameStateComponent extends Component {
    @SerializableField({ id: 1, dataType: 'number' })
    public level: number;
    
    @SerializableField({ id: 2, dataType: 'number' })
    public score: number;
    
    @SerializableField({ id: 3, dataType: 'number' })
    public lives: number;
    
    constructor(level: number = 1, score: number = 0, lives: number = 3) {
        super();
        this.level = level;
        this.score = score;
        this.lives = lives;
    }
}

@Serializable()
class PlayerComponent extends Component {
    @SerializableField({ id: 1, dataType: 'number' })
    public playerId: number;
    
    @SerializableField({ id: 2, dataType: 'string' })
    public name: string;
    
    @SerializableField({ id: 3, dataType: 'number' })
    public x: number;
    
    @SerializableField({ id: 4, dataType: 'number' })
    public y: number;
    
    @SerializableField({ id: 5, dataType: 'number' })
    public health: number;
    
    constructor(playerId: number, name: string, x: number = 0, y: number = 0, health: number = 100) {
        super();
        this.playerId = playerId;
        this.name = name;
        this.x = x;
        this.y = y;
        this.health = health;
    }
}

@Serializable()
class EnemyComponent extends Component {
    @SerializableField({ id: 1, dataType: 'string' })
    public enemyType: string;
    
    @SerializableField({ id: 2, dataType: 'number' })
    public damage: number;
    
    @SerializableField({ id: 3, dataType: 'number' })
    public x: number;
    
    @SerializableField({ id: 4, dataType: 'number' })
    public y: number;
    
    constructor(enemyType: string = 'goblin', damage: number = 10, x: number = 0, y: number = 0) {
        super();
        this.enemyType = enemyType;
        this.damage = damage;
        this.x = x;
        this.y = y;
    }
}

// 全局注册组件类
(globalThis as any)['GameStateComponent'] = GameStateComponent;
(globalThis as any)['PlayerComponent'] = PlayerComponent;
(globalThis as any)['EnemyComponent'] = EnemyComponent;

// 游戏系统
class GameSystem extends EntitySystem {
    private frameCount = 0;

    constructor() {
        super(Matcher.empty().all(GameStateComponent));
    }

    protected override process(entities: Entity[]): void {
        this.frameCount++;
        
        for (const entity of entities) {
            const gameState = entity.getComponent(GameStateComponent)!;
            
            // 每100帧增加分数
            if (this.frameCount % 100 === 0) {
                gameState.score += 100;
            }
            
            // 每200帧升级
            if (this.frameCount % 200 === 0) {
                gameState.level++;
                
                // 使用CommandBuffer生成新敌人
                const rng = Math.random;
                const enemyCount = gameState.level;
                
                for (let i = 0; i < enemyCount; i++) {
                    const enemyId = this.scene!.identifierPool.checkOut();
                    this.scene!.commandBuffer.createEntity(`Enemy_${enemyId}`, enemyId);
                    this.scene!.commandBuffer.addComponent(
                        enemyId, 
                        EnemyComponent, 
                        'goblin', 
                        10 + gameState.level * 5,
                        rng() * 800,
                        rng() * 600
                    );
                }
            }
        }
    }
}

class CombatSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(PlayerComponent, EnemyComponent));
    }

    protected override process(_entities: Entity[]): void {
        const players = this.scene!.querySystem.queryAll(PlayerComponent).entities;
        const enemies = this.scene!.querySystem.queryAll(EnemyComponent).entities;
        
        for (const player of players) {
            const playerComp = player.getComponent(PlayerComponent)!;
            
            for (const enemy of enemies) {
                const enemyComp = enemy.getComponent(EnemyComponent)!;
                
                // 简单的距离检测
                const dx = playerComp.x - enemyComp.x;
                const dy = playerComp.y - enemyComp.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 50) {
                    // 玩家受伤
                    playerComp.health -= enemyComp.damage;
                    
                    // 敌人被击杀
                    this.scene!.commandBuffer.destroyEntity(enemy.id);
                    
                    // 玩家死亡检测
                    if (playerComp.health <= 0) {
                        const gameState = this.scene!.querySystem.queryAll(GameStateComponent).entities[0];
                        if (gameState) {
                            const gameComp = gameState.getComponent(GameStateComponent)!;
                            gameComp.lives--;
                            
                            if (gameComp.lives <= 0) {
                                // 游戏结束，重置
                                gameComp.level = 1;
                                gameComp.score = 0;
                                gameComp.lives = 3;
                                playerComp.health = 100;
                                
                                // 清理所有敌人
                                for (const e of enemies) {
                                    this.scene!.commandBuffer.destroyEntity(e.id);
                                }
                            } else {
                                // 复活玩家
                                playerComp.health = 100;
                            }
                        }
                    }
                }
            }
        }
    }
}

describe('快照系统集成测试 - 游戏场景', () => {
    let scene: Scene;
    let gameSystem: GameSystem;
    let combatSystem: CombatSystem;

    beforeEach(() => {
        // 初始化Schema注册表
        SchemaRegistry.reset();
        SchemaRegistry.init();
        
        // 注册组件到SchemaRegistry
        SchemaRegistry.registerComponent('GameStateComponent', {
            level: { dataType: 'number' },
            score: { dataType: 'number' },
            lives: { dataType: 'number' }
        });
        
        SchemaRegistry.registerComponent('PlayerComponent', {
            playerId: { dataType: 'number' },
            name: { dataType: 'string' },
            x: { dataType: 'number' },
            y: { dataType: 'number' },
            health: { dataType: 'number' }
        });
        
        SchemaRegistry.registerComponent('EnemyComponent', {
            enemyType: { dataType: 'string' },
            damage: { dataType: 'number' },
            x: { dataType: 'number' },
            y: { dataType: 'number' }
        });
        
        // 注册组件到ComponentRegistry
        ComponentRegistry.register(GameStateComponent as any);
        ComponentRegistry.register(PlayerComponent as any);
        ComponentRegistry.register(EnemyComponent as any);
        
        scene = new Scene({
            name: 'GameScene',
            snapshot: {
                windowFrames: 10,
                enableAutoSnapshot: true,
                autoSnapshotInterval: 50
            }
        });
        
        gameSystem = new GameSystem();
        combatSystem = new CombatSystem();
        
        scene.addSystem(gameSystem);
        scene.addSystem(combatSystem);
        
        // 创建游戏状态
        const gameEntity = scene.createEntity('GameState');
        gameEntity.addComponent(new GameStateComponent());
        
        // 创建玩家
        const player = scene.createEntity('Player');
        player.addComponent(new PlayerComponent(1, 'Hero', 400, 300));
    });

    test('应该能够运行游戏循环并正确处理快照', () => {
        const initialEntityCount = scene.entities.count;
        
        // 运行游戏循环
        for (let frame = 0; frame < 300; frame++) {
            scene.update();
        }
        
        // 验证游戏状态已经变化
        const gameEntity = scene.findEntity('GameState');
        const gameState = gameEntity!.getComponent(GameStateComponent)!;
        
        expect(gameState.level).toBeGreaterThan(1);
        expect(gameState.score).toBeGreaterThan(0);
        expect(scene.entities.count).toBeGreaterThan(initialEntityCount);
        
        // 检查自动快照
        const snapshotStats = scene.snapshotManager.getStats();
        expect(snapshotStats.snapshotCount).toBeGreaterThan(0);
        
        console.log('游戏状态:', {
            level: gameState.level,
            score: gameState.score,
            lives: gameState.lives,
            entityCount: scene.entities.count,
            snapshots: snapshotStats.snapshotCount
        });
    });

    test('应该能够恢复到之前的游戏状态', () => {
        // 运行一段时间
        for (let frame = 0; frame < 150; frame++) {
            scene.update();
        }
        
        // 手动捕获快照
        const checkpoint = scene.snapshotManager.capture(150);
        expect(checkpoint).not.toBeNull();
        
        const gameEntity = scene.findEntity('GameState');
        const checkpointState = gameEntity!.getComponent(GameStateComponent)!;
        const checkpointScore = checkpointState.score;
        const checkpointLevel = checkpointState.level;
        const checkpointEntityCount = scene.entities.count;
        
        // 继续运行，状态应该继续变化
        for (let frame = 151; frame < 300; frame++) {
            scene.update();
        }
        
        const currentState = gameEntity!.getComponent(GameStateComponent)!;
        expect(currentState.score).toBeGreaterThan(checkpointScore);
        
        // 恢复到检查点
        const restoreResult = scene.snapshotManager.restore(150);
        expect(restoreResult.success).toBe(true);
        
        // 验证状态已恢复
        const restoredEntity = scene.findEntity('GameState');
        expect(restoredEntity).not.toBeNull();
        const restoredState = restoredEntity!.getComponent(GameStateComponent);
        expect(restoredState).not.toBeNull();
        
        expect(restoredState!.score).toBe(checkpointScore);
        expect(restoredState!.level).toBe(checkpointLevel);
        expect(scene.entities.count).toBe(checkpointEntityCount);
        expect(scene.snapshotManager.currentFrame).toBe(150);
        
        console.log('恢复验证:', {
            checkpointScore,
            restoredScore: restoredState!.score,
            checkpointLevel,
            restoredLevel: restoredState!.level
        });
    });

    test('快照应该包含所有系统状态', () => {
        // 运行到生成敌人
        for (let frame = 0; frame < 250; frame++) {
            scene.update();
        }
        
        // 记录当前状态
        const enemies = scene.querySystem.queryAll(EnemyComponent).entities;
        const player = scene.findEntity('Player')!;
        const playerComp = player.getComponent(PlayerComponent)!;
        
        const originalEnemyCount = enemies.length;
        const originalPlayerHealth = playerComp.health;
        
        // 捕获快照
        const snapshot = scene.snapshotManager.capture(250);
        expect(snapshot).not.toBeNull();
        
        // 修改状态：移动玩家到敌人附近触发战斗
        if (enemies.length > 0) {
            const firstEnemy = enemies[0].getComponent(EnemyComponent)!;
            playerComp.x = firstEnemy.x;
            playerComp.y = firstEnemy.y;
            
            // 执行战斗
            scene.update();
        }
        
        // 创建更多实体
        for (let i = 0; i < 5; i++) {
            const entity = scene.createEntity(`TestEntity_${i}`);
            entity.addComponent(new EnemyComponent());
        }
        scene.commandBuffer.apply();
        
        // 验证状态已改变
        const newEnemyCount = scene.querySystem.queryAll(EnemyComponent).entities.length;
        expect(newEnemyCount).not.toBe(originalEnemyCount);
        
        // 恢复快照
        const restoreResult = scene.snapshotManager.restore(250);
        expect(restoreResult.success).toBe(true);
        
        // 验证所有状态都已恢复
        const restoredEnemies = scene.querySystem.queryAll(EnemyComponent).entities;
        const restoredPlayer = scene.findEntity('Player');
        expect(restoredPlayer).not.toBeNull();
        const restoredPlayerComp = restoredPlayer!.getComponent(PlayerComponent);
        expect(restoredPlayerComp).not.toBeNull();
        
        expect(restoredEnemies.length).toBe(originalEnemyCount);
        expect(restoredPlayerComp!.health).toBe(originalPlayerHealth);
        
        // 验证临时创建的实体被清除
        for (let i = 0; i < 5; i++) {
            expect(scene.findEntity(`TestEntity_${i}`)).toBeNull();
        }
    });

    test('快照系统与CommandBuffer协作正常', () => {
        // 在命令缓冲中添加操作
        scene.commandBuffer.createEntity('PendingEntity');
        scene.commandBuffer.addComponent(scene.findEntity('Player')!.id, EnemyComponent, 'test');
        
        // 捕获快照（应该不包含未提交的命令）
        // 为了测试CommandBuffer协作，需要使用非确定性模式
        const store = (scene.snapshotManager as any)._store;
        const adapter = store._adapter;
        const buffer = adapter.encode({ deterministic: false, assertCleanCB: false });
        const sig = adapter.signature();
        const beforeApply = new SnapshotRef(1, 0, sig, buffer);
        
        expect(beforeApply).not.toBeNull();
        
        // 应用命令
        scene.commandBuffer.apply();
        
        const afterEntity = scene.findEntity('PendingEntity');
        const playerEnemy = scene.findEntity('Player')!.getComponent(EnemyComponent);
        
        expect(afterEntity).not.toBeNull();
        expect(playerEnemy).not.toBeNull();
        
        // 捕获应用后的快照
        const afterApply = scene.snapshotManager.capture(2);
        expect(afterApply).not.toBeNull();
        
        // 手动将快照添加到store中，然后恢复
        store._ring[0] = beforeApply;
        store._head = 1;
        store._totalSnapshots = 1;
        store._totalBytes = beforeApply.size;
        
        // 恢复到应用前的状态
        const restoreResult = scene.snapshotManager.restore(1);
        expect(restoreResult.success).toBe(true);
        
        // 验证CommandBuffer操作被回滚
        expect(scene.findEntity('PendingEntity')).toBeNull();
        expect(scene.findEntity('Player')!.getComponent(EnemyComponent)).toBeNull();
    });

    test('快照系统性能测试', () => {
        // 创建大量实体
        for (let i = 0; i < 100; i++) {
            const entity = scene.createEntity(`PerfEntity_${i}`);
            entity.addComponent(new PlayerComponent(i, `Player${i}`, i * 10, i * 10));
            entity.addComponent(new EnemyComponent('orc', i + 5, i * 5, i * 5));
        }
        
        const startTime = performance.now();
        
        // 捕获大状态快照
        const snapshot = scene.snapshotManager.capture(0);
        
        const captureTime = performance.now() - startTime;
        
        expect(snapshot).not.toBeNull();
        expect(captureTime).toBeLessThan(200); // 应该在200ms内完成（202个实体需要更多时间）
        
        // 清空场景
        scene.destroyAllEntities();
        expect(scene.entities.count).toBe(0);
        
        const restoreStart = performance.now();
        
        // 恢复快照
        const restoreResult = scene.snapshotManager.restore(0);
        
        const restoreTime = performance.now() - restoreStart;
        
        expect(restoreResult.success).toBe(true);
        expect(restoreTime).toBeLessThan(100); // 恢复也应该在100ms内完成
        expect(scene.entities.count).toBe(102); // 100个性能实体 + 1个游戏状态 + 1个玩家
        
        console.log('快照性能:', {
            entities: scene.entities.count,
            captureTime: `${captureTime.toFixed(2)}ms`,
            restoreTime: `${restoreTime.toFixed(2)}ms`,
            snapshotSize: `${snapshot!.size} bytes`
        });
    });
});