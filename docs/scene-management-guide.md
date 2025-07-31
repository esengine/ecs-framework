# 场景管理完整指南

场景（Scene）是ECS框架中管理游戏对象和系统的核心容器。本指南将详细介绍如何有效地使用场景来构建和管理你的游戏。

## 场景基础概念

### 什么是场景？

场景是一个完整的游戏世界容器，它包含：
-  **实体集合** - 所有游戏对象
- ⚙️ **系统集合** - 处理游戏逻辑的系统
-  **事件系统** - 场景内的事件通信
-  **查询系统** - 高效的实体查询
-  **性能监控** - 场景级别的性能统计

```typescript
import { Scene, Core } from '@esengine/ecs-framework';

// 创建场景
const gameScene = new Scene();

// 设置为当前活动场景
Core.scene = gameScene;
```

### 场景的生命周期

```typescript
class GameScene extends Scene {
    // 场景开始时调用
    onStart() {
        console.log("场景开始");
        this.initializeScene();
    }
    
    // 场景更新时调用（每帧）
    update() {
        super.update(); // 调用父类更新
        
        // 自定义更新逻辑
        this.updateGameLogic();
    }
    
    // 场景结束时调用
    onDestroy() {
        console.log("场景结束");
        this.cleanup();
        super.onDestroy();
    }
}
```

## 基础场景操作

### 1. 创建和配置场景

```typescript
class MenuScene extends Scene {
    private backgroundMusic: AudioClip;
    
    onStart() {
        this.setupUI();
        this.setupSystems();
        this.setupInput();
        this.playBackgroundMusic();
    }
    
    private setupUI() {
        // 创建菜单UI实体
        const titleEntity = this.createEntity("Title");
        titleEntity.addComponent(new TextComponent("我的游戏", 48));
        titleEntity.addComponent(new PositionComponent(400, 100));
        
        const startButton = this.createEntity("StartButton");
        startButton.addComponent(new ButtonComponent("开始游戏"));
        startButton.addComponent(new PositionComponent(400, 300));
        
        const settingsButton = this.createEntity("SettingsButton");
        settingsButton.addComponent(new ButtonComponent("设置"));
        settingsButton.addComponent(new PositionComponent(400, 400));
        
        const exitButton = this.createEntity("ExitButton");
        exitButton.addComponent(new ButtonComponent("退出"));
        exitButton.addComponent(new PositionComponent(400, 500));
    }
    
    private setupSystems() {
        // 添加UI相关系统
        this.addEntityProcessor(new UIRenderSystem());
        this.addEntityProcessor(new ButtonClickSystem());
        this.addEntityProcessor(new MenuTransitionSystem());
    }
    
    private setupInput() {
        // 监听按钮点击事件
        this.eventBus.on('button:clicked', this.onButtonClicked, this);
    }
    
    private onButtonClicked(data: { buttonName: string }) {
        switch (data.buttonName) {
            case "开始游戏":
                this.transitionToGame();
                break;
            case "设置":
                this.showSettings();
                break;
            case "退出":
                this.exitGame();
                break;
        }
    }
    
    private transitionToGame() {
        // 切换到游戏场景
        const gameScene = new GameScene();
        Core.scene = gameScene;
    }
}
```

### 2. 游戏主场景

```typescript
class GameScene extends Scene {
    private player: Entity;
    private enemySpawner: Entity;
    private ui: Entity;
    
    onStart() {
        this.setupWorld();
        this.setupPlayer();
        this.setupEnemies();
        this.setupSystems();
        this.setupUI();
    }
    
    private setupWorld() {
        // 创建背景
        const background = this.createEntity("Background");
        background.addComponent(new SpriteComponent("background.png"));
        background.addComponent(new PositionComponent(0, 0));
        
        // 创建边界
        this.createWorldBounds();
    }
    
    private setupPlayer() {
        this.player = this.createEntity("Player");
        this.player.addComponent(new PositionComponent(400, 300));
        this.player.addComponent(new VelocityComponent());
        this.player.addComponent(new HealthComponent(100));
        this.player.addComponent(new SpriteComponent("player.png"));
        this.player.addComponent(new PlayerInputComponent());
        this.player.addComponent(new WeaponComponent());
        this.player.tag = EntityTags.PLAYER;
    }
    
    private setupEnemies() {
        this.enemySpawner = this.createEntity("EnemySpawner");
        this.enemySpawner.addComponent(new SpawnerComponent());
        this.enemySpawner.addComponent(new PositionComponent(0, 0));
    }
    
    private setupSystems() {
        // 输入系统
        this.addEntityProcessor(new PlayerInputSystem()).updateOrder = 0;
        
        // 游戏逻辑系统
        this.addEntityProcessor(new MovementSystem()).updateOrder = 10;
        this.addEntityProcessor(new AISystem()).updateOrder = 15;
        this.addEntityProcessor(new WeaponSystem()).updateOrder = 20;
        this.addEntityProcessor(new CollisionSystem()).updateOrder = 30;
        this.addEntityProcessor(new HealthSystem()).updateOrder = 40;
        
        // 生成和清理系统
        this.addEntityProcessor(new EnemySpawnSystem()).updateOrder = 50;
        this.addEntityProcessor(new EntityCleanupSystem()).updateOrder = 60;
        
        // 渲染系统
        this.addEntityProcessor(new RenderSystem()).updateOrder = 100;
        this.addEntityProcessor(new UIRenderSystem()).updateOrder = 110;
        
        // 特效和音频系统
        this.addEntityProcessor(new ParticleSystem()).updateOrder = 120;
        this.addEntityProcessor(new AudioSystem()).updateOrder = 130;
    }
    
    private setupUI() {
        this.ui = this.createEntity("GameUI");
        this.ui.addComponent(new HealthBarComponent());
        this.ui.addComponent(new ScoreDisplayComponent());
        this.ui.addComponent(new AmmoDisplayComponent());
    }
    
    private createWorldBounds() {
        // 创建世界边界，防止实体跑出屏幕
        const bounds = [
            { x: 0, y: 0, width: 10, height: 600 },      // 左边界
            { x: 790, y: 0, width: 10, height: 600 },    // 右边界
            { x: 0, y: 0, width: 800, height: 10 },      // 上边界
            { x: 0, y: 590, width: 800, height: 10 }     // 下边界
        ];
        
        bounds.forEach((bound, index) => {
            const wall = this.createEntity(`Wall_${index}`);
            wall.addComponent(new PositionComponent(bound.x, bound.y));
            wall.addComponent(new ColliderComponent(bound.width, bound.height));
            wall.addComponent(new WallComponent());
            wall.tag = EntityTags.WALL;
        });
    }
}
```

## 场景切换和管理

### 1. 场景管理器

> **注意：** 以下的 SceneManager、TransitionManager 等是自定义的场景管理类示例，不是ECS框架提供的内置API。你可以基于这些示例实现自己的场景管理系统。

```typescript
enum SceneType {
    MENU = "menu",
    GAME = "game",
    PAUSE = "pause",
    GAME_OVER = "game_over",
    SETTINGS = "settings"
}

// 自定义场景管理器（示例实现）
class SceneManager {
    private static instance: SceneManager;
    private currentScene: Scene | null = null;
    private previousScene: Scene | null = null;
    private sceneHistory: Scene[] = [];
    
    static getInstance(): SceneManager {
        if (!this.instance) {
            this.instance = new SceneManager();
        }
        return this.instance;
    }
    
    switchToScene(sceneType: SceneType, data?: any) {
        // 保存当前场景到历史
        if (this.currentScene) {
            this.previousScene = this.currentScene;
            this.sceneHistory.push(this.currentScene);
            this.currentScene.onDestroy();
        }
        
        // 创建新场景
        this.currentScene = this.createScene(sceneType, data);
        Core.scene = this.currentScene;
        
        console.log(`切换到场景: ${sceneType}`);
    }
    
    goBack(): boolean {
        if (this.sceneHistory.length > 0) {
            const previousScene = this.sceneHistory.pop()!;
            
            if (this.currentScene) {
                this.currentScene.onDestroy();
            }
            
            this.currentScene = previousScene;
            Core.scene = this.currentScene;
            return true;
        }
        return false;
    }
    
    pushScene(sceneType: SceneType, data?: any) {
        // 暂停当前场景，不销毁
        if (this.currentScene) {
            this.previousScene = this.currentScene;
            this.sceneHistory.push(this.currentScene);
            this.pauseScene(this.currentScene);
        }
        
        this.currentScene = this.createScene(sceneType, data);
        Core.scene = this.currentScene;
    }
    
    popScene() {
        if (this.sceneHistory.length > 0) {
            if (this.currentScene) {
                this.currentScene.onDestroy();
            }
            
            this.currentScene = this.sceneHistory.pop()!;
            this.resumeScene(this.currentScene);
            Core.scene = this.currentScene;
        }
    }
    
    private createScene(sceneType: SceneType, data?: any): Scene {
        switch (sceneType) {
            case SceneType.MENU:
                return new MenuScene();
            case SceneType.GAME:
                return new GameScene(data);
            case SceneType.PAUSE:
                return new PauseScene();
            case SceneType.GAME_OVER:
                return new GameOverScene(data);
            case SceneType.SETTINGS:
                return new SettingsScene();
            default:
                throw new Error(`Unknown scene type: ${sceneType}`);
        }
    }
    
    private pauseScene(scene: Scene) {
        // 暂停场景的所有系统
        scene.systems.forEach(system => {
            system.enabled = false;
        });
    }
    
    private resumeScene(scene: Scene) {
        // 恢复场景的所有系统
        scene.systems.forEach(system => {
            system.enabled = true;
        });
    }
}

// 使用场景管理器
const sceneManager = SceneManager.getInstance();

// 切换场景
sceneManager.switchToScene(SceneType.MENU);

// 推入场景（用于暂停菜单等）
sceneManager.pushScene(SceneType.PAUSE);

// 弹出场景（返回游戏）
sceneManager.popScene();
```

### 2. 场景转场效果

```typescript
class TransitionManager {
    private isTransitioning: boolean = false;
    
    async fadeTransition(fromScene: Scene, toScene: Scene, duration: number = 1.0) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        // 创建转场覆盖层
        const overlay = this.createFadeOverlay();
        
        // 淡出当前场景
        await this.fadeOut(overlay, duration / 2);
        
        // 切换场景
        fromScene.onDestroy();
        Core.scene = toScene;
        
        // 淡入新场景
        await this.fadeIn(overlay, duration / 2);
        
        // 清理覆盖层
        overlay.destroy();
        this.isTransitioning = false;
    }
    
    async slideTransition(fromScene: Scene, toScene: Scene, direction: 'left' | 'right' | 'up' | 'down') {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        // 实现滑动转场效果
        const slideDistance = this.getSlideDistance(direction);
        
        // 移动当前场景
        await this.slideScene(fromScene, slideDistance);
        
        // 切换场景
        fromScene.onDestroy();
        Core.scene = toScene;
        
        // 从相反方向滑入新场景
        await this.slideScene(toScene, -slideDistance);
        
        this.isTransitioning = false;
    }
    
    private createFadeOverlay(): Entity {
        const overlay = Core.scene.createEntity("TransitionOverlay");
        overlay.addComponent(new SpriteComponent("black_pixel.png"));
        overlay.addComponent(new PositionComponent(0, 0));
        
        const sprite = overlay.getComponent(SpriteComponent);
        sprite.width = 800;
        sprite.height = 600;
        sprite.alpha = 0;
        
        return overlay;
    }
}
```

## 场景数据管理

### 1. 场景间数据传递

```typescript
interface GameData {
    score: number;
    level: number;
    playerName: string;
    difficulty: string;
}

class GameScene extends Scene {
    private gameData: GameData;
    
    constructor(data?: GameData) {
        super();
        this.gameData = data || {
            score: 0,
            level: 1,
            playerName: "Player",
            difficulty: "normal"
        };
    }
    
    onStart() {
        super.onStart();
        
        // 根据传入数据配置场景
        this.setupPlayerWithData();
        this.setupLevelWithDifficulty();
    }
    
    private setupPlayerWithData() {
        const player = this.createEntity("Player");
        player.addComponent(new NameComponent(this.gameData.playerName));
        player.addComponent(new ScoreComponent(this.gameData.score));
        // ... 其他组件
    }
    
    private setupLevelWithDifficulty() {
        const difficultySettings = {
            easy: { enemySpawnRate: 2.0, enemyHealth: 50 },
            normal: { enemySpawnRate: 1.5, enemyHealth: 75 },
            hard: { enemySpawnRate: 1.0, enemyHealth: 100 }
        };
        
        const settings = difficultySettings[this.gameData.difficulty];
        
        const spawner = this.createEntity("EnemySpawner");
        const spawnerComp = new SpawnerComponent();
        spawnerComp.spawnInterval = settings.enemySpawnRate;
        spawnerComp.enemyHealth = settings.enemyHealth;
        spawner.addComponent(spawnerComp);
    }
    
    // 游戏结束时传递数据到下一个场景
    gameOver() {
        const finalScore = this.getPlayerScore();
        const sceneManager = SceneManager.getInstance();
        
        sceneManager.switchToScene(SceneType.GAME_OVER, {
            score: finalScore,
            level: this.gameData.level,
            playerName: this.gameData.playerName
        });
    }
}

class GameOverScene extends Scene {
    constructor(private gameData: GameData) {
        super();
    }
    
    onStart() {
        this.displayResults();
        this.setupRestartButton();
    }
    
    private displayResults() {
        const scoreText = this.createEntity("ScoreText");
        scoreText.addComponent(new TextComponent(`最终分数: ${this.gameData.score}`));
        scoreText.addComponent(new PositionComponent(400, 200));
        
        const levelText = this.createEntity("LevelText");
        levelText.addComponent(new TextComponent(`到达关卡: ${this.gameData.level}`));
        levelText.addComponent(new PositionComponent(400, 250));
    }
}
```

### 2. 持久化数据管理

```typescript
class SaveManager {
    private static SAVE_KEY = "game_save_data";
    
    static saveScene(scene: Scene): void {
        const saveData = {
            playerData: this.extractPlayerData(scene),
            sceneState: this.extractSceneState(scene),
            timestamp: Date.now()
        };
        
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
        console.log("游戏已保存");
    }
    
    static loadScene(): Scene | null {
        const saveDataStr = localStorage.getItem(this.SAVE_KEY);
        if (!saveDataStr) return null;
        
        try {
            const saveData = JSON.parse(saveDataStr);
            return this.recreateScene(saveData);
        } catch (error) {
            console.error("读取存档失败:", error);
            return null;
        }
    }
    
    private static extractPlayerData(scene: Scene): any {
        const player = scene.findEntitiesWithTag(EntityTags.PLAYER)[0];
        if (!player) return null;
        
        return {
            position: player.getComponent(PositionComponent),
            health: player.getComponent(HealthComponent),
            inventory: player.getComponent(InventoryComponent)?.getItems(),
            score: player.getComponent(ScoreComponent)?.score
        };
    }
    
    private static extractSceneState(scene: Scene): any {
        return {
            enemies: this.extractEnemiesData(scene),
            items: this.extractItemsData(scene),
            level: this.getCurrentLevel(scene)
        };
    }
    
    private static recreateScene(saveData: any): Scene {
        const scene = new GameScene();
        
        // 重建玩家
        this.recreatePlayer(scene, saveData.playerData);
        
        // 重建场景状态
        this.recreateSceneState(scene, saveData.sceneState);
        
        return scene;
    }
}

// 自动保存系统
class AutoSaveSystem extends IntervalSystem {
    constructor() {
        super(30.0); // 每30秒自动保存
    }
    
    processSystem() {
        SaveManager.saveScene(this.scene);
    }
}
```

## 场景性能优化

### 1. 实体管理优化

```typescript
class OptimizedScene extends Scene {
    private activeEntities: Set<Entity> = new Set();
    private inactiveEntities: Set<Entity> = new Set();
    
    createEntity(name?: string): Entity {
        const entity = super.createEntity(name);
        this.activeEntities.add(entity);
        return entity;
    }
    
    destroyEntity(entity: Entity) {
        this.activeEntities.delete(entity);
        super.destroyEntity(entity);
    }
    
    // 暂时禁用实体而不销毁
    deactivateEntity(entity: Entity) {
        if (this.activeEntities.has(entity)) {
            this.activeEntities.delete(entity);
            this.inactiveEntities.add(entity);
            entity.enabled = false;
        }
    }
    
    // 重新激活实体
    activateEntity(entity: Entity) {
        if (this.inactiveEntities.has(entity)) {
            this.inactiveEntities.delete(entity);
            this.activeEntities.add(entity);
            entity.enabled = true;
        }
    }
    
    // 只更新活跃实体
    update() {
        for (const entity of this.activeEntities) {
            if (entity.enabled) {
                entity.update();
            }
        }
        
        this.updateEntitySystems();
    }
    
    // 批量操作
    deactivateAllEnemies() {
        const enemies = this.findEntitiesWithTag(EntityTags.ENEMY);
        enemies.forEach(enemy => this.deactivateEntity(enemy));
    }
    
    activateAllEnemies() {
        const enemies = Array.from(this.inactiveEntities)
            .filter(entity => entity.hasTag(EntityTags.ENEMY));
        enemies.forEach(enemy => this.activateEntity(enemy));
    }
}
```

### 2. 系统性能监控

```typescript
class PerformanceMonitoredScene extends Scene {
    private systemPerformance: Map<string, number[]> = new Map();
    
    addEntityProcessor<T extends EntitySystem>(system: T): T {
        const wrappedSystem = this.wrapSystemWithMonitoring(system);
        return super.addEntityProcessor(wrappedSystem);
    }
    
    private wrapSystemWithMonitoring<T extends EntitySystem>(system: T): T {
        const originalUpdate = system.update.bind(system);
        const systemName = system.constructor.name;
        
        system.update = () => {
            const startTime = performance.now();
            originalUpdate();
            const endTime = performance.now();
            
            this.recordSystemPerformance(systemName, endTime - startTime);
        };
        
        return system;
    }
    
    private recordSystemPerformance(systemName: string, duration: number) {
        if (!this.systemPerformance.has(systemName)) {
            this.systemPerformance.set(systemName, []);
        }
        
        const records = this.systemPerformance.get(systemName)!;
        records.push(duration);
        
        // 只保留最近100次记录
        if (records.length > 100) {
            records.shift();
        }
    }
    
    getPerformanceReport(): any {
        const report = {};
        
        this.systemPerformance.forEach((durations, systemName) => {
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            const maxDuration = Math.max(...durations);
            const minDuration = Math.min(...durations);
            
            report[systemName] = {
                average: avgDuration.toFixed(2) + 'ms',
                max: maxDuration.toFixed(2) + 'ms',
                min: minDuration.toFixed(2) + 'ms',
                samples: durations.length
            };
        });
        
        return report;
    }
    
    // 定期输出性能报告
    private performanceReportTimer() {
        Core.schedule(5.0, true, this, () => {
            console.table(this.getPerformanceReport());
        });
    }
}
```

## 常见问题和最佳实践

### Q: 何时创建新场景？

A: 
- 游戏的不同阶段（菜单、游戏、设置）
- 不同的关卡
- 需要完全不同系统配置的情况
- 需要清理大量实体时

### Q: 场景切换时如何保持数据？

A: 
1. 使用场景构造函数传递数据
2. 使用全局数据管理器
3. 使用本地存储进行持久化

### Q: 如何优化场景性能？

A:
1. 合理使用实体的启用/禁用
2. 监控系统性能
3. 批量操作实体
4. 使用对象池减少垃圾回收

### Q: 多个场景可以同时存在吗？

A: 框架同时只支持一个活跃场景，但可以通过场景栈实现多场景管理（如暂停菜单）。

通过合理使用场景系统，你可以构建出结构清晰、性能优良的游戏架构！ 