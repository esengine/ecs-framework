# 场景管理

在 ECS 架构中，场景（Scene）是游戏世界的容器，负责管理实体、系统和组件的生命周期。场景提供了完整的 ECS 运行环境。

## 基本概念

场景是 ECS 框架的核心容器，提供：
- 实体的创建、管理和销毁
- 系统的注册和执行调度
- 组件的存储和查询
- 事件系统支持
- 性能监控和调试信息

## 创建场景

### 继承 Scene 类

**推荐做法：继承 Scene 类来创建自定义场景**

```typescript
import { Scene, EntitySystem } from '@esengine/ecs-framework';

class GameScene extends Scene {
  protected initialize(): void {
    // 设置场景名称
    this.name = "GameScene";

    // 添加系统
    this.addSystem(new MovementSystem());
    this.addSystem(new RenderSystem());
    this.addSystem(new PhysicsSystem());

    // 创建初始实体
    this.createInitialEntities();
  }

  private createInitialEntities(): void {
    // 创建玩家
    const player = this.createEntity("Player");
    player.addComponent(new Position(400, 300));
    player.addComponent(new Health(100));
    player.addComponent(new PlayerController());

    // 创建敌人
    for (let i = 0; i < 5; i++) {
      const enemy = this.createEntity(`Enemy_${i}`);
      enemy.addComponent(new Position(Math.random() * 800, Math.random() * 600));
      enemy.addComponent(new Health(50));
      enemy.addComponent(new EnemyAI());
    }
  }

  public onStart(): void {
    console.log("游戏场景已启动");
    // 场景启动时的逻辑
  }

  public unload(): void {
    console.log("游戏场景已卸载");
    // 场景卸载时的清理逻辑
  }
}
```

### 使用场景配置

```typescript
import { ISceneConfig } from '@esengine/ecs-framework';

const config: ISceneConfig = {
  name: "MainGame",
  enableEntityDirectUpdate: false
};

class ConfiguredScene extends Scene {
  constructor() {
    super(config);
  }
}
```

## 场景生命周期

场景提供了完整的生命周期管理：

```typescript
class ExampleScene extends Scene {
  protected initialize(): void {
    // 场景初始化：设置系统和初始实体
    console.log("场景初始化");
  }

  public onStart(): void {
    // 场景开始运行：游戏逻辑开始执行
    console.log("场景开始运行");
  }

  public unload(): void {
    // 场景卸载：清理资源
    console.log("场景卸载");
  }
}

// 使用场景（由框架自动管理生命周期）
const scene = new ExampleScene();
// 场景的 initialize(), begin(), update(), end() 由框架自动调用
```

## 实体管理

### 创建实体

```typescript
class EntityScene extends Scene {
  createGameEntities(): void {
    // 创建单个实体
    const player = this.createEntity("Player");

    // 批量创建实体（高性能）
    const bullets = this.createEntities(100, "Bullet");

    // 为批量创建的实体添加组件
    bullets.forEach((bullet, index) => {
      bullet.addComponent(new Position(index * 10, 100));
      bullet.addComponent(new Velocity(Math.random() * 200 - 100, -300));
    });
  }
}
```

### 查找实体

```typescript
class SearchScene extends Scene {
  findEntities(): void {
    // 按名称查找
    const player = this.findEntity("Player");
    const player2 = this.getEntityByName("Player"); // 别名方法

    // 按 ID 查找
    const entity = this.findEntityById(123);

    // 按标签查找
    const enemies = this.findEntitiesByTag(2);
    const enemies2 = this.getEntitiesByTag(2); // 别名方法

    if (player) {
      console.log(`找到玩家: ${player.name}`);
    }

    console.log(`找到 ${enemies.length} 个敌人`);
  }
}
```

### 销毁实体

```typescript
class DestroyScene extends Scene {
  cleanupEntities(): void {
    // 销毁所有实体
    this.destroyAllEntities();

    // 单个实体的销毁通过实体本身
    const enemy = this.findEntity("Enemy_1");
    if (enemy) {
      enemy.destroy(); // 实体会自动从场景中移除
    }
  }
}
```

## 系统管理

### 添加和移除系统

```typescript
class SystemScene extends Scene {
  protected initialize(): void {
    // 添加系统
    const movementSystem = new MovementSystem();
    this.addSystem(movementSystem);

    // 设置系统更新顺序
    movementSystem.updateOrder = 1;

    // 添加更多系统
    this.addSystem(new PhysicsSystem());
    this.addSystem(new RenderSystem());
  }

  public removeUnnecessarySystems(): void {
    // 获取系统
    const physicsSystem = this.getEntityProcessor(PhysicsSystem);

    // 移除系统
    if (physicsSystem) {
      this.removeSystem(physicsSystem);
    }
  }
}
```

### 系统访问

```typescript
class SystemAccessScene extends Scene {
  public pausePhysics(): void {
    const physicsSystem = this.getEntityProcessor(PhysicsSystem);
    if (physicsSystem) {
      physicsSystem.enabled = false;
    }
  }

  public getAllSystems(): EntitySystem[] {
    return this.systems; // 获取所有系统
  }
}
```

## 事件系统

场景内置了类型安全的事件系统：

```typescript
class EventScene extends Scene {
  protected initialize(): void {
    // 监听事件
    this.eventSystem.on('player_died', this.onPlayerDied.bind(this));
    this.eventSystem.on('enemy_spawned', this.onEnemySpawned.bind(this));
    this.eventSystem.on('level_complete', this.onLevelComplete.bind(this));
  }

  private onPlayerDied(data: any): void {
    console.log('玩家死亡事件');
    // 处理玩家死亡
  }

  private onEnemySpawned(data: any): void {
    console.log('敌人生成事件');
    // 处理敌人生成
  }

  private onLevelComplete(data: any): void {
    console.log('关卡完成事件');
    // 处理关卡完成
  }

  public triggerGameEvent(): void {
    // 发送事件
    this.eventSystem.emitSync('custom_event', {
      message: "这是自定义事件",
      timestamp: Date.now()
    });
  }
}
```

## 场景统计和调试

### 获取场景统计

```typescript
class StatsScene extends Scene {
  public showStats(): void {
    const stats = this.getStats();
    console.log(`实体数量: ${stats.entityCount}`);
    console.log(`系统数量: ${stats.processorCount}`);
    console.log('组件存储统计:', stats.componentStorageStats);
  }

  public showDebugInfo(): void {
    const debugInfo = this.getDebugInfo();
    console.log('场景调试信息:', debugInfo);

    // 显示所有实体信息
    debugInfo.entities.forEach(entity => {
      console.log(`实体 ${entity.name}(${entity.id}): ${entity.componentCount} 个组件`);
      console.log('组件类型:', entity.componentTypes);
    });

    // 显示所有系统信息
    debugInfo.processors.forEach(processor => {
      console.log(`系统 ${processor.name}: 处理 ${processor.entityCount} 个实体`);
    });
  }
}
```

## 场景集成到框架

ECS Framework 提供了灵活的场景管理架构，适用于不同规模的应用：

### 1. 使用 SceneManager（推荐大多数应用）

适用于 95% 的游戏应用（单人游戏、简单多人游戏、移动游戏等）：

```typescript
import { Core, SceneManager } from '@esengine/ecs-framework';

// 初始化Core（全局服务）
Core.create({ debug: true });

// 创建场景管理器
const sceneManager = new SceneManager();

// 创建游戏场景
class GameScene extends Scene {
  protected initialize(): void {
    this.name = "GameScene";
    this.addSystem(new MovementSystem());
    this.addSystem(new RenderSystem());
  }
}

// 设置场景
const gameScene = new GameScene();
sceneManager.setScene(gameScene);

// 游戏循环
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);      // 更新全局服务
  sceneManager.update();        // 更新当前场景
}
```

### 2. 场景切换

SceneManager 支持流畅的场景切换：

```typescript
// 立即切换场景
const menuScene = new MenuScene();
sceneManager.setScene(menuScene);

// 延迟切换场景（在下一帧切换）
const gameScene = new GameScene();
sceneManager.startSceneTransition(gameScene, false);

// 访问当前场景
const currentScene = sceneManager.currentScene;

// 访问 ECS API
const ecsAPI = sceneManager.ecsAPI;
const entity = ecsAPI?.createEntity('player');
```

### 3. 使用 WorldManager（高级用例）

适用于需要完全隔离的多世界应用（MMO服务器、游戏房间系统等）：

```typescript
import { Core, WorldManager } from '@esengine/ecs-framework';

// 初始化Core（全局服务）
Core.create({ debug: true });

// 创建世界管理器
const worldManager = new WorldManager();

// 创建多个独立的游戏世界
const gameWorld = worldManager.createWorld('game', {
  name: 'MainGame',
  maxScenes: 5
});

// 在World中创建场景
const menuScene = gameWorld.createScene('menu', new MenuScene());
const gameScene = gameWorld.createScene('game', new GameScene());

// 激活场景
gameWorld.setSceneActive('menu', true);

// 游戏循环
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);      // 更新全局服务
  worldManager.updateAll();    // 更新所有世界
}
```

## 多场景管理

在World中可以管理多个场景，通过激活/停用来切换：

```typescript
class GameWorld extends World {
  private menuScene: Scene;
  private gameScene: Scene;
  private gameOverScene: Scene;

  public initialize(): void {
    // 创建多个场景
    this.menuScene = this.createScene('menu', new MenuScene());
    this.gameScene = this.createScene('game', new GameScene());
    this.gameOverScene = this.createScene('gameover', new GameOverScene());

    // 设置初始场景
    this.showMenu();
  }

  public showMenu(): void {
    this.deactivateAllScenes();
    this.setSceneActive('menu', true);
  }

  public startGame(): void {
    this.deactivateAllScenes();
    this.setSceneActive('game', true);
  }

  public showGameOver(): void {
    this.deactivateAllScenes();
    this.setSceneActive('gameover', true);
  }

  private deactivateAllScenes(): void {
    this.setSceneActive('menu', false);
    this.setSceneActive('game', false);
    this.setSceneActive('gameover', false);
  }
}
```

## 架构层次

ECS Framework 的架构层次清晰，职责分明：

```typescript
// 架构层次：
// Core (全局服务) → SceneManager (场景管理) → Scene → EntitySystem → Entity → Component
// 或
// Core (全局服务) → WorldManager (世界管理) → World → Scene → EntitySystem → Entity → Component

// 1. 推荐：使用 SceneManager 管理单场景/场景切换
import { Core, SceneManager } from '@esengine/ecs-framework';

Core.create({ debug: true });
const sceneManager = new SceneManager();
sceneManager.setScene(new GameScene());

// 游戏循环
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);      // 全局服务
  sceneManager.update();        // 场景更新
}

// 2. 高级：使用 WorldManager 管理多世界
import { Core, WorldManager } from '@esengine/ecs-framework';

Core.create({ debug: true });
const worldManager = new WorldManager();
const world = worldManager.createWorld('gameWorld');
const scene = world.createScene('mainScene', new GameScene());
world.setSceneActive('mainScene', true);

// 游戏循环
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);      // 全局服务
  worldManager.updateAll();    // 所有世界更新
}
```

## 最佳实践

### 1. 场景职责分离

```typescript
// ✅ 好的场景设计 - 职责清晰
class MenuScene extends Scene {
  // 只处理菜单相关逻辑
}

class GameScene extends Scene {
  // 只处理游戏玩法逻辑
}

class InventoryScene extends Scene {
  // 只处理物品栏逻辑
}

// ❌ 避免的场景设计 - 职责混乱
class MegaScene extends Scene {
  // 包含菜单、游戏、物品栏等所有逻辑
}
```

### 2. 合理的系统组织

```typescript
class OrganizedScene extends Scene {
  protected initialize(): void {
    // 按功能和依赖关系添加系统
    this.addInputSystems();
    this.addLogicSystems();
    this.addRenderSystems();
  }

  private addInputSystems(): void {
    this.addSystem(new InputSystem());
  }

  private addLogicSystems(): void {
    this.addSystem(new MovementSystem());
    this.addSystem(new PhysicsSystem());
    this.addSystem(new CollisionSystem());
  }

  private addRenderSystems(): void {
    this.addSystem(new RenderSystem());
    this.addSystem(new UISystem());
  }
}
```

### 3. 资源管理

```typescript
class ResourceScene extends Scene {
  private textures: Map<string, any> = new Map();
  private sounds: Map<string, any> = new Map();

  protected initialize(): void {
    this.loadResources();
  }

  private loadResources(): void {
    // 加载场景所需资源
  }

  public unload(): void {
    // 清理资源
    this.textures.clear();
    this.sounds.clear();
  }
}
```

### 4. 事件处理规范

```typescript
class EventHandlingScene extends Scene {
  protected initialize(): void {
    // 集中管理事件监听
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventSystem.on('game_pause', this.onGamePause.bind(this));
    this.eventSystem.on('game_resume', this.onGameResume.bind(this));
    this.eventSystem.on('player_input', this.onPlayerInput.bind(this));
  }

  private onGamePause(): void {
    // 暂停游戏逻辑
    this.systems.forEach(system => {
      if (system instanceof GameLogicSystem) {
        system.enabled = false;
      }
    });
  }

  private onGameResume(): void {
    // 恢复游戏逻辑
    this.systems.forEach(system => {
      if (system instanceof GameLogicSystem) {
        system.enabled = true;
      }
    });
  }

  private onPlayerInput(data: any): void {
    // 处理玩家输入
  }
}
```

场景是 ECS 框架的核心容器，正确使用场景管理能让你的游戏架构更加清晰、模块化和易于维护。