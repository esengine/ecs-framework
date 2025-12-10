import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';
import { Scene } from '../../src/ECS/Scene';
import { SceneManager } from '../../src/ECS/SceneManager';
import { EEntityLifecyclePolicy } from '../../src/ECS/Core/EntityLifecyclePolicy';
import { ECSComponent } from '../../src/ECS/Decorators';

// 测试组件
@ECSComponent('Persistent_PositionComponent')
class PositionComponent extends Component {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

@ECSComponent('Persistent_PlayerComponent')
class PlayerComponent extends Component {
    public name: string;
    public score: number;

    constructor(name: string = 'Player', score: number = 0) {
        super();
        this.name = name;
        this.score = score;
    }
}

@ECSComponent('Persistent_EnemyComponent')
class EnemyComponent extends Component {
    public type: string;

    constructor(type: string = 'normal') {
        super();
        this.type = type;
    }
}

// 测试场景
class TestScene extends Scene {
    public initializeCalled = false;

    override initialize(): void {
        this.initializeCalled = true;
    }
}

describe('PersistentEntity - 持久化实体测试', () => {
    describe('Entity.setPersistent', () => {
        let scene: Scene;

        beforeEach(() => {
            scene = new Scene();
        });

        test('默认实体应为 SceneLocal 策略', () => {
            const entity = scene.createEntity('NormalEntity');

            expect(entity.lifecyclePolicy).toBe(EEntityLifecyclePolicy.SceneLocal);
            expect(entity.isPersistent).toBe(false);
        });

        test('setPersistent() 应标记实体为持久化', () => {
            const entity = scene.createEntity('Player');
            entity.setPersistent();

            expect(entity.lifecyclePolicy).toBe(EEntityLifecyclePolicy.Persistent);
            expect(entity.isPersistent).toBe(true);
        });

        test('setPersistent() 应支持链式调用', () => {
            const entity = scene.createEntity('Player').setPersistent();
            entity.addComponent(new PositionComponent(100, 200));

            expect(entity.isPersistent).toBe(true);
            expect(entity.hasComponent(PositionComponent)).toBe(true);
        });

        test('setSceneLocal() 应恢复为默认策略', () => {
            const entity = scene.createEntity('Player');
            entity.setPersistent();
            expect(entity.isPersistent).toBe(true);

            entity.setSceneLocal();
            expect(entity.isPersistent).toBe(false);
            expect(entity.lifecyclePolicy).toBe(EEntityLifecyclePolicy.SceneLocal);
        });
    });

    describe('Scene.findPersistentEntities', () => {
        let scene: Scene;

        beforeEach(() => {
            scene = new Scene();
        });

        test('应返回所有持久化实体', () => {
            // 创建混合实体
            const player = scene.createEntity('Player').setPersistent();
            const enemy1 = scene.createEntity('Enemy1');
            const gameManager = scene.createEntity('GameManager').setPersistent();
            const enemy2 = scene.createEntity('Enemy2');

            const persistentEntities = scene.findPersistentEntities();

            expect(persistentEntities.length).toBe(2);
            expect(persistentEntities).toContain(player);
            expect(persistentEntities).toContain(gameManager);
            expect(persistentEntities).not.toContain(enemy1);
            expect(persistentEntities).not.toContain(enemy2);
        });

        test('没有持久化实体时应返回空数组', () => {
            scene.createEntity('Enemy1');
            scene.createEntity('Enemy2');

            const persistentEntities = scene.findPersistentEntities();

            expect(persistentEntities).toEqual([]);
        });
    });

    describe('Scene.extractPersistentEntities', () => {
        let scene: Scene;

        beforeEach(() => {
            scene = new Scene();
        });

        test('应提取并从场景中移除持久化实体', () => {
            const player = scene.createEntity('Player').setPersistent();
            player.addComponent(new PositionComponent(100, 200));

            const enemy = scene.createEntity('Enemy');

            expect(scene.entities.count).toBe(2);

            const extracted = scene.extractPersistentEntities();

            expect(extracted.length).toBe(1);
            expect(extracted[0]).toBe(player);
            expect(scene.entities.count).toBe(1);
            expect(scene.findEntity('Player')).toBeNull();
            expect(scene.findEntity('Enemy')).toBe(enemy);
        });

        test('提取后实体的 scene 引用应为 null', () => {
            const player = scene.createEntity('Player').setPersistent();

            const extracted = scene.extractPersistentEntities();

            expect(extracted[0].scene).toBeNull();
        });

        test('提取后实体的组件数据应保留', () => {
            const player = scene.createEntity('Player').setPersistent();
            player.addComponent(new PositionComponent(100, 200));
            player.addComponent(new PlayerComponent('Hero', 999));

            const extracted = scene.extractPersistentEntities();

            // 组件数据应保留（虽然 scene 为 null，组件缓存仍有效）
            expect(extracted[0].components.length).toBe(2);
        });
    });

    describe('Scene.receiveMigratedEntities', () => {
        test('应将迁移的实体添加到新场景', () => {
            const sourceScene = new Scene();
            const targetScene = new Scene();

            // 在源场景创建持久化实体
            const player = sourceScene.createEntity('Player').setPersistent();
            player.addComponent(new PositionComponent(100, 200));
            player.addComponent(new PlayerComponent('Hero', 500));

            // 提取并迁移
            const extracted = sourceScene.extractPersistentEntities();
            targetScene.receiveMigratedEntities(extracted);

            // 验证实体已迁移
            expect(targetScene.entities.count).toBe(1);
            expect(targetScene.findEntity('Player')).toBe(player);
            expect(player.scene).toBe(targetScene);
        });

        test('迁移后组件数据应完整保留', () => {
            const sourceScene = new Scene();
            const targetScene = new Scene();

            const player = sourceScene.createEntity('Player').setPersistent();
            player.addComponent(new PositionComponent(100, 200));
            player.addComponent(new PlayerComponent('Hero', 999));

            const extracted = sourceScene.extractPersistentEntities();
            targetScene.receiveMigratedEntities(extracted);

            // 验证组件数据
            const migratedPlayer = targetScene.findEntity('Player')!;
            const position = migratedPlayer.getComponent(PositionComponent);
            const playerComp = migratedPlayer.getComponent(PlayerComponent);

            expect(position).not.toBeNull();
            expect(position!.x).toBe(100);
            expect(position!.y).toBe(200);
            expect(playerComp).not.toBeNull();
            expect(playerComp!.name).toBe('Hero');
            expect(playerComp!.score).toBe(999);
        });

        test('迁移后实体应能被查询系统找到', () => {
            const sourceScene = new Scene();
            const targetScene = new Scene();

            const player = sourceScene.createEntity('Player').setPersistent();
            player.addComponent(new PositionComponent(100, 200));

            const extracted = sourceScene.extractPersistentEntities();
            targetScene.receiveMigratedEntities(extracted);

            // 通过查询系统查找
            const result = targetScene.queryAll(PositionComponent);
            expect(result.entities.length).toBe(1);
            expect(result.entities[0]).toBe(player);
        });
    });

    describe('SceneManager 场景切换迁移', () => {
        let sceneManager: SceneManager;

        beforeEach(() => {
            sceneManager = new SceneManager();
        });

        afterEach(() => {
            sceneManager.destroy();
        });

        test('场景切换时应自动迁移持久化实体', () => {
            // 设置初始场景
            const scene1 = new TestScene();
            sceneManager.setScene(scene1);

            // 创建持久化实体和普通实体
            const player = scene1.createEntity('Player').setPersistent();
            player.addComponent(new PositionComponent(100, 200));
            player.addComponent(new PlayerComponent('Hero', 500));

            const enemy = scene1.createEntity('Enemy');
            enemy.addComponent(new EnemyComponent('boss'));

            expect(scene1.entities.count).toBe(2);

            // 切换到新场景
            const scene2 = new TestScene();
            sceneManager.setScene(scene2);

            // 验证：player 应迁移到新场景，enemy 应被销毁
            expect(scene2.entities.count).toBe(1);
            expect(scene2.findEntity('Player')).toBe(player);
            expect(scene2.findEntity('Enemy')).toBeNull();
            expect(player.scene).toBe(scene2);
        });

        test('迁移后组件状态应保持不变', () => {
            const scene1 = new TestScene();
            sceneManager.setScene(scene1);

            const player = scene1.createEntity('Player').setPersistent();
            player.addComponent(new PositionComponent(100, 200));
            const playerComp = player.addComponent(new PlayerComponent('Hero', 500));

            // 修改组件状态
            playerComp.score = 999;

            // 切换场景
            const scene2 = new TestScene();
            sceneManager.setScene(scene2);

            // 验证组件状态
            const migratedPlayer = scene2.findEntity('Player')!;
            const position = migratedPlayer.getComponent(PositionComponent);
            const migratedPlayerComp = migratedPlayer.getComponent(PlayerComponent);

            expect(position!.x).toBe(100);
            expect(position!.y).toBe(200);
            expect(migratedPlayerComp!.score).toBe(999);
        });

        test('多个持久化实体应全部迁移', () => {
            const scene1 = new TestScene();
            sceneManager.setScene(scene1);

            const player = scene1.createEntity('Player').setPersistent();
            const audioManager = scene1.createEntity('AudioManager').setPersistent();
            const gameState = scene1.createEntity('GameState').setPersistent();
            const enemy = scene1.createEntity('Enemy'); // 普通实体

            expect(scene1.entities.count).toBe(4);

            const scene2 = new TestScene();
            sceneManager.setScene(scene2);

            expect(scene2.entities.count).toBe(3);
            expect(scene2.findEntity('Player')).toBe(player);
            expect(scene2.findEntity('AudioManager')).toBe(audioManager);
            expect(scene2.findEntity('GameState')).toBe(gameState);
            expect(scene2.findEntity('Enemy')).toBeNull();
        });

        test('没有持久化实体时场景切换应正常工作', () => {
            const scene1 = new TestScene();
            sceneManager.setScene(scene1);

            scene1.createEntity('Enemy1');
            scene1.createEntity('Enemy2');

            const scene2 = new TestScene();
            sceneManager.setScene(scene2);

            expect(scene2.entities.count).toBe(0);
        });

        test('延迟场景切换应正确迁移持久化实体', () => {
            const scene1 = new TestScene();
            sceneManager.setScene(scene1);

            const player = scene1.createEntity('Player').setPersistent();
            player.addComponent(new PlayerComponent('Hero', 100));

            // 延迟加载
            const scene2 = new TestScene();
            sceneManager.loadScene(scene2);

            // 此时还未切换
            expect(sceneManager.currentScene).toBe(scene1);
            expect(scene1.findEntity('Player')).toBe(player);

            // 触发更新，执行延迟切换
            sceneManager.update();

            // 验证迁移
            expect(sceneManager.currentScene).toBe(scene2);
            expect(scene2.findEntity('Player')).toBe(player);
            expect(player.scene).toBe(scene2);
        });

        test('连续场景切换应正确迁移持久化实体', () => {
            const scene1 = new TestScene();
            sceneManager.setScene(scene1);

            const player = scene1.createEntity('Player').setPersistent();

            // 第一次切换
            const scene2 = new TestScene();
            sceneManager.setScene(scene2);
            expect(scene2.findEntity('Player')).toBe(player);

            // 第二次切换
            const scene3 = new TestScene();
            sceneManager.setScene(scene3);
            expect(scene3.findEntity('Player')).toBe(player);

            // 第三次切换
            const scene4 = new TestScene();
            sceneManager.setScene(scene4);
            expect(scene4.findEntity('Player')).toBe(player);
            expect(player.scene).toBe(scene4);
        });
    });

    describe('边界情况', () => {
        test('实体销毁后不应被迁移', () => {
            const sceneManager = new SceneManager();
            const scene1 = new TestScene();
            sceneManager.setScene(scene1);

            const player = scene1.createEntity('Player').setPersistent();
            player.destroy();

            const scene2 = new TestScene();
            sceneManager.setScene(scene2);

            expect(scene2.entities.count).toBe(0);
            sceneManager.destroy();
        });

        test('动态切换持久化状态应生效', () => {
            const sceneManager = new SceneManager();
            const scene1 = new TestScene();
            sceneManager.setScene(scene1);

            const entity = scene1.createEntity('DynamicEntity');
            expect(entity.isPersistent).toBe(false);

            // 动态设为持久化
            entity.setPersistent();
            expect(entity.isPersistent).toBe(true);

            const scene2 = new TestScene();
            sceneManager.setScene(scene2);

            expect(scene2.findEntity('DynamicEntity')).toBe(entity);
            sceneManager.destroy();
        });

        test('动态取消持久化状态应生效', () => {
            const sceneManager = new SceneManager();
            const scene1 = new TestScene();
            sceneManager.setScene(scene1);

            const entity = scene1.createEntity('DynamicEntity').setPersistent();

            // 动态取消持久化
            entity.setSceneLocal();

            const scene2 = new TestScene();
            sceneManager.setScene(scene2);

            expect(scene2.findEntity('DynamicEntity')).toBeNull();
            sceneManager.destroy();
        });
    });
});
