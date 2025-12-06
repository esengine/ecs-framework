# SceneManager

SceneManager 是 ECS Framework 提供的轻量级场景管理器，适用于 95% 的游戏应用。它提供简单直观的 API，支持场景切换和延迟加载。

## 适用场景

SceneManager 适合以下场景：
- 单人游戏
- 简单多人游戏
- 移动游戏
- 需要场景切换的游戏（菜单、游戏、暂停等）
- 不需要多 World 隔离的项目

## 特点

- 轻量级，零额外开销
- 简单直观的 API
- 支持延迟场景切换（避免在当前帧中途切换）
- 自动管理 ECS 流式 API
- 自动处理场景生命周期
- 集成在 Core 中，自动更新
- 支持[持久化实体](./persistent-entity.md)跨场景迁移（v2.3.0+）

## 基本使用

### 推荐方式：使用 Core 的静态方法

这是最简单和推荐的方式，适合大多数应用：

```typescript
import { Core, Scene } from '@esengine/ecs-framework';

// 1. 初始化 Core
Core.create({ debug: true });

// 2. 创建并设置场景
class GameScene extends Scene {
  protected initialize(): void {
    this.name = "GameScene";

    // 添加系统
    this.addSystem(new MovementSystem());
    this.addSystem(new RenderSystem());

    // 创建初始实体
    const player = this.createEntity("Player");
    player.addComponent(new Transform(400, 300));
    player.addComponent(new Health(100));
  }

  public onStart(): void {
    console.log("游戏场景已启动");
  }
}

// 3. 设置场景
Core.setScene(new GameScene());

// 4. 游戏循环（Core.update 会自动更新场景）
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);  // 自动更新所有服务和场景
}

// Laya 引擎集成
Laya.timer.frameLoop(1, this, () => {
  const deltaTime = Laya.timer.delta / 1000;
  Core.update(deltaTime);
});

// Cocos Creator 集成
update(deltaTime: number) {
  Core.update(deltaTime);
}
```

### 高级方式：直接使用 SceneManager

如果需要更多控制，可以直接使用 SceneManager：

```typescript
import { Core, SceneManager, Scene } from '@esengine/ecs-framework';

// 初始化 Core
Core.create({ debug: true });

// 获取 SceneManager（Core 已自动创建并注册）
const sceneManager = Core.services.resolve(SceneManager);

// 设置场景
const gameScene = new GameScene();
sceneManager.setScene(gameScene);

// 游戏循环（仍然使用 Core.update）
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);  // Core会自动调用sceneManager.update()
}
```

**重要**：无论使用哪种方式，游戏循环中都应该只调用 `Core.update()`，它会自动更新 SceneManager 和场景。不需要手动调用 `sceneManager.update()`。

## 场景切换

### 立即切换

使用 `Core.setScene()` 或 `sceneManager.setScene()` 立即切换场景：

```typescript
// 方式1：使用 Core（推荐）
Core.setScene(new MenuScene());

// 方式2：使用 SceneManager
const sceneManager = Core.services.resolve(SceneManager);
sceneManager.setScene(new MenuScene());
```

### 延迟切换

使用 `Core.loadScene()` 或 `sceneManager.loadScene()` 延迟切换场景，场景会在下一帧切换：

```typescript
// 方式1：使用 Core（推荐）
Core.loadScene(new GameOverScene());

// 方式2：使用 SceneManager
const sceneManager = Core.services.resolve(SceneManager);
sceneManager.loadScene(new GameOverScene());
```

在 System 中切换场景时，应该使用延迟切换：

```typescript
class GameOverSystem extends EntitySystem {
  process(entities: readonly Entity[]): void {
    const player = entities.find(e => e.name === 'Player');
    const health = player?.getComponent(Health);

    if (health && health.value <= 0) {
      // 延迟切换到游戏结束场景（下一帧生效）
      Core.loadScene(new GameOverScene());
      // 当前帧继续执行，不会中断当前系统的处理
    }
  }
}
```

### 完整的场景切换示例

```typescript
import { Core, Scene } from '@esengine/ecs-framework';

// 初始化
Core.create({ debug: true });

// 菜单场景
class MenuScene extends Scene {
  protected initialize(): void {
    this.name = "MenuScene";

    // 监听开始游戏事件
    this.eventSystem.on('start_game', () => {
      Core.loadScene(new GameScene());
    });
  }

  public onStart(): void {
    console.log("显示菜单界面");
  }

  public unload(): void {
    console.log("菜单场景卸载");
  }
}

// 游戏场景
class GameScene extends Scene {
  protected initialize(): void {
    this.name = "GameScene";

    // 创建游戏实体
    const player = this.createEntity("Player");
    player.addComponent(new Transform(400, 300));
    player.addComponent(new Health(100));

    // 监听游戏结束事件
    this.eventSystem.on('game_over', () => {
      Core.loadScene(new GameOverScene());
    });
  }

  public onStart(): void {
    console.log("游戏开始");
  }

  public unload(): void {
    console.log("游戏场景卸载");
  }
}

// 游戏结束场景
class GameOverScene extends Scene {
  protected initialize(): void {
    this.name = "GameOverScene";

    // 监听返回菜单事件
    this.eventSystem.on('back_to_menu', () => {
      Core.loadScene(new MenuScene());
    });
  }

  public onStart(): void {
    console.log("显示游戏结束界面");
  }
}

// 开始游戏
Core.setScene(new MenuScene());

// 游戏循环
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);  // 自动更新场景
}
```

## API 参考

### Core 静态方法（推荐）

#### Core.setScene()

立即切换场景。

```typescript
public static setScene<T extends IScene>(scene: T): T
```

**参数**：
- `scene` - 要设置的场景实例

**返回**：
- 返回设置的场景实例

**示例**：
```typescript
const gameScene = Core.setScene(new GameScene());
console.log(gameScene.name);
```

#### Core.loadScene()

延迟加载场景（下一帧切换）。

```typescript
public static loadScene<T extends IScene>(scene: T): void
```

**参数**：
- `scene` - 要加载的场景实例

**示例**：
```typescript
Core.loadScene(new GameOverScene());
```

#### Core.scene

获取当前活跃的场景。

```typescript
public static get scene(): IScene | null
```

**返回**：
- 当前场景实例，如果没有场景则返回 null

**示例**：
```typescript
const currentScene = Core.scene;
if (currentScene) {
  console.log(`当前场景: ${currentScene.name}`);
}
```

#### Core.ecsAPI

获取 ECS 流式 API。

```typescript
public static get ecsAPI(): ECSFluentAPI | null
```

**返回**：
- ECS API 实例，如果当前没有场景则返回 null

**示例**：
```typescript
const api = Core.ecsAPI;
if (api) {
  // 查询实体
  const enemies = api.find(Enemy, Transform);

  // 发射事件
  api.emit('game:start', { level: 1 });
}
```

### SceneManager 方法（高级）

如果需要直接使用 SceneManager，可以通过服务容器获取：

```typescript
const sceneManager = Core.services.resolve(SceneManager);
```

#### setScene()

立即切换场景。

```typescript
public setScene<T extends IScene>(scene: T): T
```

#### loadScene()

延迟加载场景。

```typescript
public loadScene<T extends IScene>(scene: T): void
```

#### currentScene

获取当前场景。

```typescript
public get currentScene(): IScene | null
```

#### api

获取 ECS 流式 API。

```typescript
public get api(): ECSFluentAPI | null
```

#### hasScene

检查是否有活跃场景。

```typescript
public get hasScene(): boolean
```

#### hasPendingScene

检查是否有待切换的场景。

```typescript
public get hasPendingScene(): boolean
```

## 使用 ECS 流式 API

通过 `Core.ecsAPI` 可以方便地访问场景的 ECS 功能：

```typescript
const api = Core.ecsAPI;
if (!api) {
  console.error('没有活跃场景');
  return;
}

// 查询实体
const players = api.find(Player, Transform);
const enemies = api.find(Enemy, Health, Transform);

// 发射事件
api.emit('player:scored', { points: 100 });

// 监听事件
api.on('enemy:died', (data) => {
  console.log('敌人死亡:', data);
});
```

## 最佳实践

### 1. 使用 Core 的静态方法

```typescript
// 推荐：使用 Core 的静态方法
Core.setScene(new GameScene());
Core.loadScene(new MenuScene());
const currentScene = Core.scene;

// 不推荐：除非有特殊需求，否则不需要直接使用 SceneManager
const sceneManager = Core.services.resolve(SceneManager);
sceneManager.setScene(new GameScene());
```

### 2. 只调用 Core.update()

```typescript
// 正确：只调用 Core.update()
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);  // 自动更新所有服务和场景
}

// 错误：不要手动调用 sceneManager.update()
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);
  sceneManager.update();  // 重复更新，会导致问题！
}
```

### 3. 使用延迟切换避免问题

在 System 中切换场景时，应该使用 `loadScene()` 而不是 `setScene()`：

```typescript
// 推荐：延迟切换
class HealthSystem extends EntitySystem {
  process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      if (health.value <= 0) {
        Core.loadScene(new GameOverScene());
        // 当前帧继续处理其他实体
      }
    }
  }
}

// 不推荐：立即切换可能导致问题
class HealthSystem extends EntitySystem {
  process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      if (health.value <= 0) {
        Core.setScene(new GameOverScene());
        // 场景立即切换，当前帧的其他实体可能无法正常处理
      }
    }
  }
}
```

### 4. 场景职责分离

每个场景应该只负责一个特定的游戏状态：

```typescript
// 好的设计 - 职责清晰
class MenuScene extends Scene {
  // 只处理菜单相关逻辑
}

class GameScene extends Scene {
  // 只处理游戏玩法逻辑
}

class PauseScene extends Scene {
  // 只处理暂停界面逻辑
}

// 避免的设计 - 职责混乱
class MegaScene extends Scene {
  // 包含菜单、游戏、暂停等所有逻辑
}
```

### 5. 资源管理

在场景的 `unload()` 方法中清理资源：

```typescript
class GameScene extends Scene {
  private textures: Map<string, any> = new Map();
  private sounds: Map<string, any> = new Map();

  protected initialize(): void {
    this.loadResources();
  }

  private loadResources(): void {
    this.textures.set('player', loadTexture('player.png'));
    this.sounds.set('bgm', loadSound('bgm.mp3'));
  }

  public unload(): void {
    // 清理资源
    this.textures.clear();
    this.sounds.clear();
    console.log('场景资源已清理');
  }
}
```

### 6. 事件驱动的场景切换

使用事件系统来触发场景切换，保持代码解耦：

```typescript
class GameScene extends Scene {
  protected initialize(): void {
    // 监听场景切换事件
    this.eventSystem.on('goto:menu', () => {
      Core.loadScene(new MenuScene());
    });

    this.eventSystem.on('goto:gameover', (data) => {
      Core.loadScene(new GameOverScene());
    });
  }
}

// 在 System 中触发事件
class GameLogicSystem extends EntitySystem {
  process(entities: readonly Entity[]): void {
    if (levelComplete) {
      this.scene.eventSystem.emitSync('goto:gameover', {
        score: 1000,
        level: 5
      });
    }
  }
}
```

## 架构层次

SceneManager 在 ECS Framework 中的位置：

```
Core (全局服务)
  └── SceneManager (场景管理，自动更新)
      └── Scene (当前场景)
          ├── EntitySystem (系统)
          ├── Entity (实体)
          └── Component (组件)
```

## 与 WorldManager 的对比

| 特性 | SceneManager | WorldManager |
|------|--------------|--------------|
| 适用场景 | 95% 的游戏应用 | 高级多世界隔离场景 |
| 复杂度 | 简单 | 复杂 |
| 场景数量 | 单场景（可切换） | 多 World，每个 World 多场景 |
| 性能开销 | 最小 | 较高 |
| 使用方式 | `Core.setScene()` | `worldManager.createWorld()` |

**何时使用 SceneManager**：
- 单人游戏
- 简单的多人游戏
- 移动游戏
- 场景之间需要切换但不需要同时运行

**何时使用 WorldManager**：
- MMO 游戏服务器（每个房间一个 World）
- 游戏大厅系统（每个游戏房间完全隔离）
- 需要运行多个完全独立的游戏实例

## 完整示例

```typescript
import { Core, Scene, EntitySystem, Entity, Matcher } from '@esengine/ecs-framework';

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
class MenuScene extends Scene {
  protected initialize(): void {
    this.name = "MenuScene";
    console.log("菜单场景初始化");
  }

  public onStart(): void {
    console.log("菜单场景启动");
  }
}

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
  }

  public onStart(): void {
    console.log('游戏场景启动');
  }

  public unload(): void {
    console.log('游戏场景卸载');
  }
}

// 初始化
Core.create({ debug: true });

// 设置初始场景
Core.setScene(new MenuScene());

// 游戏循环
let lastTime = 0;
function gameLoop(currentTime: number) {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // 只需要调用 Core.update，它会自动更新场景
  Core.update(deltaTime);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// 切换到游戏场景
setTimeout(() => {
  Core.loadScene(new GameScene());
}, 3000);
```

SceneManager 为大多数游戏提供了简单而强大的场景管理能力。通过 Core 的静态方法，你可以轻松地管理场景切换。

## 相关文档

- [持久化实体](./persistent-entity.md) - 了解如何让实体跨场景保持状态
- [WorldManager](./world-manager.md) - 了解更高级的多世界隔离功能
