# 场景管理

在 ECS 架构中，场景（Scene）是游戏世界的容器，负责管理实体、系统和组件的生命周期。场景提供了完整的 ECS 运行环境。

## 基本概念

场景是 ECS 框架的核心容器，提供：
- 实体的创建、管理和销毁
- 系统的注册和执行调度
- 组件的存储和查询
- 事件系统支持
- 性能监控和调试信息

## 场景管理方式

ECS Framework 提供了两种场景管理方式：

1. **[SceneManager](./scene-manager.md)** - 适用于 95% 的游戏应用
   - 单人游戏、简单多人游戏、移动游戏
   - 轻量级，简单直观的 API
   - 支持场景切换

2. **[WorldManager](./world-manager.md)** - 适用于高级多世界隔离场景
   - MMO 游戏服务器、游戏房间系统
   - 多 World 管理，每个 World 可包含多个场景
   - 完全隔离的独立环境

本文档重点介绍 Scene 类本身的使用方法。关于场景管理器的详细信息，请查看对应的文档。

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

**生命周期方法**：

1. `initialize()` - 场景初始化，设置系统和初始实体
2. `begin()` / `onStart()` - 场景开始运行
3. `update()` - 每帧更新（由场景管理器调用）
4. `end()` / `unload()` - 场景卸载，清理资源

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
    // 发送事件（同步）
    this.eventSystem.emitSync('custom_event', {
      message: "这是自定义事件",
      timestamp: Date.now()
    });

    // 发送事件（异步）
    this.eventSystem.emit('async_event', {
      data: "异步事件数据"
    });
  }
}
```

### 事件系统 API

```typescript
// 监听事件
this.eventSystem.on('event_name', callback);

// 监听一次（自动取消订阅）
this.eventSystem.once('event_name', callback);

// 取消监听
this.eventSystem.off('event_name', callback);

// 同步发送事件
this.eventSystem.emitSync('event_name', data);

// 异步发送事件
this.eventSystem.emit('event_name', data);

// 清除所有事件监听
this.eventSystem.clear();
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

## 组件查询

Scene 提供了强大的组件查询系统：

```typescript
class QueryScene extends Scene {
  protected initialize(): void {
    // 创建一些实体
    for (let i = 0; i < 10; i++) {
      const entity = this.createEntity(`Entity_${i}`);
      entity.addComponent(new Transform(i * 10, 0));
      entity.addComponent(new Velocity(1, 0));
      if (i % 2 === 0) {
        entity.addComponent(new Renderer());
      }
    }
  }

  public queryEntities(): void {
    // 通过 QuerySystem 查询
    const entities = this.querySystem.query([Transform, Velocity]);
    console.log(`找到 ${entities.length} 个有 Transform 和 Velocity 的实体`);

    // 使用 ECS 流式 API（如果通过 SceneManager）
    // const api = sceneManager.api;
    // const entities = api?.find(Transform, Velocity);
  }
}
```

## 性能监控

Scene 内置了性能监控功能：

```typescript
class PerformanceScene extends Scene {
  public showPerformance(): void {
    // 获取性能数据
    const perfData = this.performanceMonitor?.getPerformanceData();
    if (perfData) {
      console.log('FPS:', perfData.fps);
      console.log('帧时间:', perfData.frameTime);
      console.log('实体更新时间:', perfData.entityUpdateTime);
      console.log('系统更新时间:', perfData.systemUpdateTime);
    }

    // 获取性能报告
    const report = this.performanceMonitor?.generateReport();
    if (report) {
      console.log('性能报告:', report);
    }
  }
}
```

## 最佳实践

### 1. 场景职责分离

```typescript
// 好的场景设计 - 职责清晰
class MenuScene extends Scene {
  // 只处理菜单相关逻辑
}

class GameScene extends Scene {
  // 只处理游戏玩法逻辑
}

class InventoryScene extends Scene {
  // 只处理物品栏逻辑
}

// 避免的场景设计 - 职责混乱
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
    this.textures.set('player', this.loadTexture('player.png'));
    this.sounds.set('bgm', this.loadSound('bgm.mp3'));
  }

  public unload(): void {
    // 清理资源
    this.textures.clear();
    this.sounds.clear();
    console.log('场景资源已清理');
  }

  private loadTexture(path: string): any {
    // 加载纹理
    return null;
  }

  private loadSound(path: string): any {
    // 加载音效
    return null;
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

  public unload(): void {
    // 清理事件监听
    this.eventSystem.clear();
  }
}
```

### 5. 初始化顺序

```typescript
class ProperInitScene extends Scene {
  protected initialize(): void {
    // 1. 首先设置场景配置
    this.name = "GameScene";

    // 2. 然后添加系统（按依赖顺序）
    this.addSystem(new InputSystem());
    this.addSystem(new MovementSystem());
    this.addSystem(new PhysicsSystem());
    this.addSystem(new RenderSystem());

    // 3. 最后创建实体
    this.createEntities();

    // 4. 设置事件监听
    this.setupEvents();
  }

  private createEntities(): void {
    // 创建实体
  }

  private setupEvents(): void {
    // 设置事件监听
  }
}
```

## 完整示例

```typescript
import { Scene, EntitySystem, Entity, Matcher } from '@esengine/ecs-framework';

// 定义组件
class Transform {
  constructor(public x: number, public y: number) {}
}

class Velocity {
  constructor(public vx: number, public vy: number) {}
}

class Health {
  constructor(public value: number) {}
}

// 定义系统
class MovementSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Transform, Velocity));
  }

  process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const transform = entity.getComponent(Transform);
      const velocity = entity.getComponent(Velocity);

      if (transform && velocity) {
        transform.x += velocity.vx;
        transform.y += velocity.vy;
      }
    }
  }
}

// 定义场景
class GameScene extends Scene {
  protected initialize(): void {
    this.name = "GameScene";

    // 添加系统
    this.addSystem(new MovementSystem());

    // 创建玩家
    const player = this.createEntity("Player");
    player.addComponent(new Transform(400, 300));
    player.addComponent(new Velocity(0, 0));
    player.addComponent(new Health(100));

    // 创建敌人
    for (let i = 0; i < 5; i++) {
      const enemy = this.createEntity(`Enemy_${i}`);
      enemy.addComponent(new Transform(
        Math.random() * 800,
        Math.random() * 600
      ));
      enemy.addComponent(new Velocity(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50
      ));
      enemy.addComponent(new Health(50));
    }

    // 设置事件监听
    this.eventSystem.on('player_died', () => {
      console.log('玩家死亡！');
    });
  }

  public onStart(): void {
    console.log('游戏场景启动');
  }

  public unload(): void {
    console.log('游戏场景卸载');
    this.eventSystem.clear();
  }
}

// 使用场景
// 方式1：通过 SceneManager（推荐）
import { Core, SceneManager } from '@esengine/ecs-framework';

Core.create({ debug: true });
const sceneManager = Core.services.resolve(SceneManager);
sceneManager.setScene(new GameScene());

// 方式2：通过 WorldManager（高级用例）
import { WorldManager } from '@esengine/ecs-framework';

const worldManager = Core.services.resolve(WorldManager);
const world = worldManager.createWorld('game');
world.createScene('main', new GameScene());
world.setSceneActive('main', true);
```

## 下一步

- 了解 [SceneManager](./scene-manager.md) - 适用于大多数游戏的简单场景管理
- 了解 [WorldManager](./world-manager.md) - 适用于需要多世界隔离的高级场景
- 了解 [持久化实体](./persistent-entity.md) - 让实体跨场景保持状态（v2.2.22+）

场景是 ECS 框架的核心容器，正确使用场景管理能让你的游戏架构更加清晰、模块化和易于维护。
