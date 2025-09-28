# 快速开始

本指南将帮助你快速上手 ECS Framework，从安装到创建第一个 ECS 应用。

## 安装

### NPM 安装

```bash
# 使用 npm
npm install @esengine/ecs-framework
```

## 初始化 Core

### 基础初始化

ECS Framework 的核心是 `Core` 类，它是一个单例模式，负责管理整个框架的生命周期。

```typescript
import { Core } from '@esengine/ecs-framework'

// 方式1：使用配置对象（推荐）
const core = Core.create({
  debug: true,                    // 启用调试模式，提供详细的日志和性能监控
  enableEntitySystems: true,     // 启用实体系统，这是ECS的核心功能
  debugConfig: {                 // 可选：高级调试配置
    enabled: false,               // 是否启用WebSocket调试服务器
    websocketUrl: 'ws://localhost:8080',
    debugFrameRate: 30,          // 调试数据发送帧率
    channels: {
      entities: true,
      systems: true,
      performance: true,
      components: true,
      scenes: true
    }
  }
});

// 方式2：简化创建（向后兼容）
const core = Core.create(true);  // 等同于 { debug: true, enableEntitySystems: true }

// 方式3：生产环境配置
const core = Core.create({
  debug: false,                 // 生产环境关闭调试
  enableEntitySystems: true
});
```

### Core 配置详解

```typescript
interface ICoreConfig {
  /** 是否启用调试模式 - 影响日志级别和性能监控 */
  debug?: boolean;

  /** 是否启用实体系统 - 核心ECS功能开关 */
  enableEntitySystems?: boolean;

  /** 高级调试配置 - 用于开发工具集成 */
  debugConfig?: {
    enabled: boolean;                    // 是否启用调试服务器
    websocketUrl: string;               // WebSocket服务器地址
    autoReconnect?: boolean;            // 是否自动重连
    debugFrameRate?: 60 | 30 | 15;     // 调试数据发送帧率
    channels: {                         // 数据通道配置
      entities: boolean;                // 实体数据
      systems: boolean;                 // 系统数据
      performance: boolean;             // 性能数据
      components: boolean;              // 组件数据
      scenes: boolean;                  // 场景数据
    };
  };
}
```

### Core 实例管理

Core 采用单例模式，创建后可以通过静态属性获取：

```typescript
// 创建实例
const core = Core.create(true);

// 获取已创建的实例
const instance = Core.Instance;  // 获取当前实例，如果未创建则为 null
```

### 游戏循环集成

**重要**: 在创建实体和系统之前，你需要先了解如何将 ECS Framework 集成到你的游戏引擎中。

`Core.update(deltaTime)` 是整个框架的心跳，必须在游戏引擎的每一帧中调用。它负责：
- 更新框架内置的 Time 类
- 更新所有全局管理器（定时器、对象池等）
- 更新所有场景中的实体系统
- 处理实体的创建和销毁
- 收集性能数据（调试模式下）

各引擎集成示例请参考：[与游戏引擎集成](#与游戏引擎集成)

## 创建第一个 ECS 应用

### 1. 定义组件

组件是纯数据容器，用于存储实体的状态：

```typescript
import { Component, ECSComponent } from '@esengine/ecs-framework'

// 位置组件
@ECSComponent('Position')
class Position extends Component {
  x: number = 0
  y: number = 0

  constructor(x: number = 0, y: number = 0) {
    super()
    this.x = x
    this.y = y
  }
}

// 速度组件
@ECSComponent('Velocity')
class Velocity extends Component {
  dx: number = 0
  dy: number = 0

  constructor(dx: number = 0, dy: number = 0) {
    super()
    this.dx = dx
    this.dy = dy
  }
}

// 渲染组件
@ECSComponent('Sprite')
class Sprite extends Component {
  texture: string = ''
  width: number = 32
  height: number = 32

  constructor(texture: string, width: number = 32, height: number = 32) {
    super()
    this.texture = texture
    this.width = width
    this.height = height
  }
}
```

### 2. 创建实体系统

系统包含游戏逻辑，处理具有特定组件的实体。ECS Framework 提供了基于 Matcher 的实体过滤机制：

```typescript
import { EntitySystem, Matcher, Time, ECSSystem } from '@esengine/ecs-framework'

// 移动系统 - 处理位置和速度
@ECSSystem('MovementSystem')
class MovementSystem extends EntitySystem {

  constructor() {
    // 使用 Matcher 定义要处理的实体：必须同时拥有 Position 和 Velocity 组件
    super(Matcher.empty().all(Position, Velocity))
  }

  protected process(entities: readonly Entity[]): void {
    // process 方法接收所有匹配的实体
    for (const entity of entities) {
      const position = entity.getComponent(Position)!
      const velocity = entity.getComponent(Velocity)!

      // 更新位置（使用框架的Time类）
      position.x += velocity.dx * Time.deltaTime
      position.y += velocity.dy * Time.deltaTime

      // 边界检查示例
      if (position.x < 0) position.x = 0
      if (position.y < 0) position.y = 0
    }
  }
}

// 渲染系统 - 处理可见对象
@ECSSystem('RenderSystem')
class RenderSystem extends EntitySystem {

  constructor() {
    // 必须有 Position 和 Sprite，可选 Velocity（用于方向判断）
    super(Matcher.empty().all(Position, Sprite).any(Velocity))
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const position = entity.getComponent(Position)!
      const sprite = entity.getComponent(Sprite)!
      const velocity = entity.getComponent(Velocity) // 可能为 null

      // 根据速度方向翻转精灵（可选逻辑）
      let flipX = false
      if (velocity && velocity.dx < 0) {
        flipX = true
      }

      // 渲染逻辑（这里是伪代码）
      this.drawSprite(sprite.texture, position.x, position.y, sprite.width, sprite.height, flipX)
    }
  }

  private drawSprite(texture: string, x: number, y: number, width: number, height: number, flipX: boolean = false) {
    // 实际的渲染实现将取决于你使用的游戏引擎
    const direction = flipX ? '←' : '→'
    console.log(`渲染 ${texture} 在位置 (${x.toFixed(1)}, ${y.toFixed(1)}) 方向: ${direction}`)
  }
}
```


### 3. 创建场景

推荐继承 Scene 类来创建自定义场景：

```typescript
import { Scene } from '@esengine/ecs-framework'

// 推荐：继承Scene创建自定义场景
class GameScene extends Scene {

  initialize(): void {
    // 场景初始化逻辑
    this.name = "MainScene";

    // 添加系统到场景
    this.addSystem(new MovementSystem());
    this.addSystem(new RenderSystem());
  }

  onStart(): void {
    // 场景开始运行时的逻辑
    console.log("游戏场景已启动");
  }

  unload(): void {
    // 场景卸载时的清理逻辑
    console.log("游戏场景已卸载");
  }
}

// 创建并设置场景
const gameScene = new GameScene();
Core.setScene(gameScene);
```

### 4. 创建实体

```typescript
// 创建玩家实体
const player = gameScene.createEntity("Player");
player.addComponent(new Position(100, 100));
player.addComponent(new Velocity(50, 30));  // 每秒移动 50 像素（x方向），30 像素（y方向）
player.addComponent(new Sprite("player.png", 64, 64));
```

## World 概念

World 是 Scene 的容器，用于管理多个独立的游戏世界。这种设计特别适用于：
- 多人游戏房间（每个房间一个 World）
- 不同的游戏模式
- 独立的模拟环境

### 基本用法

```typescript
import { World, Scene } from '@esengine/ecs-framework'

// 创建游戏房间的World
const roomWorld = new World({ name: 'Room_001' });

// 在World中创建多个Scene
class GameScene extends Scene {
  initialize(): void {
    this.name = "GamePlay";
    this.addSystem(new MovementSystem());
    this.addSystem(new RenderSystem());
  }
}

class UIScene extends Scene {
  initialize(): void {
    this.name = "UI";
    // UI相关系统
  }
}

// 添加Scene到World
const gameScene = roomWorld.createScene('game', new GameScene());
const uiScene = roomWorld.createScene('ui', new UIScene());

// 激活Scene
roomWorld.setSceneActive('game', true);
roomWorld.setSceneActive('ui', true);

// 启动World
roomWorld.start();
```

### World 生命周期

World 提供了完整的生命周期管理：
- `start()`: 启动 World 和所有全局系统
- `updateGlobalSystems()`: 更新全局系统（由 Core.update() 调用）
- `updateScenes()`: 更新所有激活的 Scene（由 Core.update() 调用）
- `stop()`: 停止 World
- `destroy()`: 销毁 World 和所有资源

## 与游戏引擎集成

### Laya 引擎集成

```typescript
import { Stage } from "laya/display/Stage"
import { Stat } from "laya/utils/Stat"
import { Laya } from "Laya"

// 初始化 Laya
Laya.init(800, 600).then(() => {
  // 初始化 ECS
  const core = Core.create(true)

  // 设置场景...

  // 启动游戏循环
  Laya.timer.frameLoop(1, this, () => {
    const deltaTime = Laya.timer.delta / 1000 // 转换为秒
    Core.update(deltaTime)
  })
})
```

### Cocos Creator 集成

```typescript
import { Component, _decorator } from 'cc'

const { ccclass } = _decorator

@ccclass('ECSGameManager')
export class ECSGameManager extends Component {

  onLoad() {
    // 初始化 ECS
    const core = Core.create(true)

    // 设置场景...
  }

  update(deltaTime: number) {
    // 更新 ECS
    Core.update(deltaTime)
  }
}
```


## 下一步

现在你已经成功创建了第一个 ECS 应用！接下来可以：

- 查看完整的 [API 文档](/api/README)
- 探索更多[实际应用示例](/examples/)

## 常见问题

### 为什么我的系统没有执行？

确保：
1. 系统已添加到场景：`this.addSystem(system)` （在 Scene 的 initialize 方法中）
2. 场景已设置为当前场景：`Core.setScene(scene)`
3. 游戏循环在调用：`Core.update(deltaTime)`

### 如何调试 ECS 应用？

启用调试模式：

```typescript
Core.create({ debug: true })

// 获取调试数据
const debugData = Core.getDebugData()
console.log(debugData)
```