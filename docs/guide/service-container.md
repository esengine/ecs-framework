# 服务容器

服务容器（ServiceContainer）是 ECS Framework 的依赖注入容器，负责管理框架中所有服务的注册、解析和生命周期。通过服务容器，你可以实现松耦合的架构设计，提高代码的可测试性和可维护性。

## 概述

### 什么是服务容器

服务容器是一个轻量级的依赖注入（DI）容器，它提供了：

- **服务注册**: 将服务类型注册到容器中
- **服务解析**: 从容器中获取服务实例
- **生命周期管理**: 自动管理服务实例的创建和销毁
- **依赖注入**: 自动解析服务之间的依赖关系

### 核心概念

#### 服务（Service）

服务是实现了 `IService` 接口的类，必须提供 `dispose()` 方法用于资源清理：

```typescript
import { IService } from '@esengine/ecs-framework';

class MyService implements IService {
    constructor() {
        // 初始化逻辑
    }

    dispose(): void {
        // 清理资源
    }
}
```

#### 生命周期

服务容器支持两种生命周期：

- **Singleton（单例）**: 整个应用程序生命周期内只有一个实例，所有解析请求返回同一个实例
- **Transient（瞬时）**: 每次解析都创建新的实例

## 基础使用

### 访问服务容器

ECS Framework 提供了三级服务容器：

> **版本说明**：World 服务容器功能在 v2.2.13+ 版本中可用

#### Core 级别服务容器

应用程序全局服务容器，可以通过 `Core.services` 访问：

```typescript
import { Core } from '@esengine/ecs-framework';

// 初始化Core
Core.create({ debug: true });

// 访问全局服务容器
const container = Core.services;
```

#### World 级别服务容器

每个 World 拥有独立的服务容器，用于管理 World 范围内的服务：

```typescript
import { World } from '@esengine/ecs-framework';

// 创建 World
const world = new World({ name: 'GameWorld' });

// 访问 World 级别的服务容器
const worldContainer = world.services;

// 注册 World 级别的服务
world.services.registerSingleton(RoomManager);
```

#### Scene 级别服务容器

每个 Scene 拥有独立的服务容器，用于管理 Scene 范围内的服务：

```typescript
// 访问 Scene 级别的服务容器
const sceneContainer = scene.services;

// 注册 Scene 级别的服务
scene.services.registerSingleton(PhysicsSystem);
```

#### 服务容器层级

```
Core.services (应用程序全局)
  └─ World.services (World 级别)
      └─ Scene.services (Scene 级别)
```

不同级别的服务容器是独立的，服务不会自动向上或向下查找。选择合适的容器级别：

- **Core.services**: 应用程序级别的全局服务（配置、插件管理器等）
- **World.services**: World 级别的服务（房间管理器、多人游戏状态等）
- **Scene.services**: Scene 级别的服务（ECS 系统、场景特定逻辑等）

### 注册服务

#### 注册单例服务

单例服务在首次解析时创建，之后所有解析请求都返回同一个实例：

```typescript
class DataService implements IService {
    private data: Map<string, any> = new Map();

    getData(key: string) {
        return this.data.get(key);
    }

    setData(key: string, value: any) {
        this.data.set(key, value);
    }

    dispose(): void {
        this.data.clear();
    }
}

// 注册单例服务
Core.services.registerSingleton(DataService);
```

#### 注册瞬时服务

瞬时服务每次解析都创建新实例，适用于无状态或短生命周期的服务：

```typescript
class CommandService implements IService {
    execute(command: string) {
        console.log(`Executing: ${command}`);
    }

    dispose(): void {
        // 清理资源
    }
}

// 注册瞬时服务
Core.services.registerTransient(CommandService);
```

#### 注册服务实例

直接注册已创建的实例，自动视为单例：

```typescript
const config = new ConfigService();
config.load('./config.json');

// 注册实例
Core.services.registerInstance(ConfigService, config);
```

#### 使用工厂函数注册

工厂函数允许你在创建服务时执行自定义逻辑：

```typescript
Core.services.registerSingleton(LoggerService, (container) => {
    const logger = new LoggerService();
    logger.setLevel('debug');
    return logger;
});
```

### 解析服务

#### resolve 方法

解析服务实例，如果服务未注册会抛出异常：

```typescript
// 解析服务
const dataService = Core.services.resolve(DataService);
dataService.setData('player', { name: 'Alice', score: 100 });

// 单例服务，多次解析返回同一个实例
const same = Core.services.resolve(DataService);
console.log(same === dataService); // true
```

#### tryResolve 方法

尝试解析服务，如果未注册返回 null 而不抛出异常：

```typescript
const optional = Core.services.tryResolve(OptionalService);
if (optional) {
    optional.doSomething();
}
```

#### isRegistered 方法

检查服务是否已注册：

```typescript
if (Core.services.isRegistered(DataService)) {
    const service = Core.services.resolve(DataService);
}
```

## 内置服务

Core 在初始化时自动注册了以下内置服务：

### TimerManager

定时器管理器，负责管理所有游戏定时器：

```typescript
const timerManager = Core.services.resolve(TimerManager);

// 创建定时器
timerManager.schedule(1.0, false, null, (timer) => {
    console.log('1秒后执行');
});
```

### PerformanceMonitor

性能监控器，监控游戏性能并提供优化建议：

```typescript
const monitor = Core.services.resolve(PerformanceMonitor);

// 启用性能监控
monitor.enable();

// 获取性能数据
const fps = monitor.getFPS();
```

### SceneManager

场景管理器，管理单场景应用的场景生命周期：

```typescript
const sceneManager = Core.services.resolve(SceneManager);

// 设置当前场景
sceneManager.setScene(new GameScene());

// 获取当前场景
const currentScene = sceneManager.currentScene;

// 延迟切换场景
sceneManager.loadScene(new MenuScene());

// 更新场景
sceneManager.update();
```

### WorldManager

世界管理器，管理多个独立的 World 实例（高级用例）：

```typescript
const worldManager = Core.services.resolve(WorldManager);

// 创建独立的游戏世界
const gameWorld = worldManager.createWorld('game_room_001', {
  name: 'GameRoom',
  maxScenes: 5
});

// 在World中创建场景
const scene = gameWorld.createScene('battle', new BattleScene());
gameWorld.setSceneActive('battle', true);

// 更新所有World
worldManager.updateAll();
```

**适用场景**:
- SceneManager: 适用于 95% 的游戏（单人游戏、简单多人游戏）
- WorldManager: 适用于 MMO 服务器、游戏房间系统等需要完全隔离的多世界应用

### PoolManager

对象池管理器，管理所有对象池：

```typescript
const poolManager = Core.services.resolve(PoolManager);

// 创建对象池
const bulletPool = poolManager.createPool('bullets', () => new Bullet(), 100);
```

### PluginManager

插件管理器，管理插件的安装和卸载：

```typescript
const pluginManager = Core.services.resolve(PluginManager);

// 获取所有已安装的插件
const plugins = pluginManager.getAllPlugins();
```

## 依赖注入

ECS Framework 提供了装饰器来简化依赖注入。

### @Injectable 装饰器

标记类为可注入的服务：

```typescript
import { Injectable, IService } from '@esengine/ecs-framework';

@Injectable()
class GameService implements IService {
    constructor() {
        console.log('GameService created');
    }

    dispose(): void {
        console.log('GameService disposed');
    }
}
```

### @Inject 装饰器

在构造函数中注入依赖：

```typescript
import { Injectable, Inject, IService } from '@esengine/ecs-framework';

@Injectable()
class PlayerService implements IService {
    constructor(
        @Inject(DataService) private data: DataService,
        @Inject(GameService) private game: GameService
    ) {
        // data 和 game 会自动从容器中解析
    }

    dispose(): void {
        // 清理资源
    }
}
```

### 注册可注入服务

使用 `registerInjectable` 自动处理依赖注入：

```typescript
import { registerInjectable } from '@esengine/ecs-framework';

// 注册服务（会自动解析@Inject依赖）
registerInjectable(Core.services, PlayerService);

// 解析时会自动注入依赖
const player = Core.services.resolve(PlayerService);
```

### @Updatable 装饰器

标记服务为可更新的，使其在每帧自动被调用：

```typescript
import { Injectable, Updatable, IService, IUpdatable } from '@esengine/ecs-framework';

@Injectable()
@Updatable()  // 默认优先级为0
class PhysicsService implements IService, IUpdatable {
    update(deltaTime?: number): void {
        // 每帧更新物理模拟
    }

    dispose(): void {
        // 清理资源
    }
}

// 指定更新优先级（数值越小越先执行）
@Injectable()
@Updatable(10)
class RenderService implements IService, IUpdatable {
    update(deltaTime?: number): void {
        // 每帧渲染
    }

    dispose(): void {
        // 清理资源
    }
}
```

使用 `@Updatable` 装饰器的服务会被 Core 自动调用，无需手动管理：

```typescript
// Core.update() 会自动调用所有@Updatable服务的update方法
function gameLoop(deltaTime: number) {
    Core.update(deltaTime);  // 自动更新所有可更新服务
}
```

## 自定义服务

### 创建自定义服务

实现 `IService` 接口并注册到容器：

```typescript
import { IService } from '@esengine/ecs-framework';

class AudioService implements IService {
    private sounds: Map<string, HTMLAudioElement> = new Map();

    play(soundId: string) {
        const sound = this.sounds.get(soundId);
        if (sound) {
            sound.play();
        }
    }

    load(soundId: string, url: string) {
        const audio = new Audio(url);
        this.sounds.set(soundId, audio);
    }

    dispose(): void {
        // 停止所有音效并清理
        for (const sound of this.sounds.values()) {
            sound.pause();
            sound.src = '';
        }
        this.sounds.clear();
    }
}

// 注册自定义服务
Core.services.registerSingleton(AudioService);

// 使用服务
const audio = Core.services.resolve(AudioService);
audio.load('jump', '/sounds/jump.mp3');
audio.play('jump');
```

### 服务间依赖

服务可以依赖其他服务：

```typescript
@Injectable()
class ConfigService implements IService {
    private config: any = {};

    get(key: string) {
        return this.config[key];
    }

    dispose(): void {
        this.config = {};
    }
}

@Injectable()
class NetworkService implements IService {
    constructor(
        @Inject(ConfigService) private config: ConfigService
    ) {
        // 使用配置服务
        const apiUrl = this.config.get('apiUrl');
    }

    dispose(): void {
        // 清理网络连接
    }
}

// 注册服务（按依赖顺序）
registerInjectable(Core.services, ConfigService);
registerInjectable(Core.services, NetworkService);
```

## 高级用法

### 服务替换（测试）

在测试中替换真实服务为模拟服务：

```typescript
// 测试代码
class MockDataService implements IService {
    getData(key: string) {
        return 'mock data';
    }

    dispose(): void {}
}

// 注册模拟服务（用于测试）
Core.services.registerInstance(DataService, new MockDataService());
```

### 循环依赖检测

服务容器会自动检测循环依赖：

```typescript
// A 依赖 B，B 依赖 A
@Injectable()
class ServiceA implements IService {
    constructor(@Inject(ServiceB) b: ServiceB) {}
    dispose(): void {}
}

@Injectable()
class ServiceB implements IService {
    constructor(@Inject(ServiceA) a: ServiceA) {}
    dispose(): void {}
}

// 解析时会抛出错误: Circular dependency detected: ServiceA -> ServiceB -> ServiceA
```

### 获取所有服务

```typescript
// 获取所有已注册的服务类型
const types = Core.services.getRegisteredServices();

// 获取所有已实例化的服务实例
const instances = Core.services.getAll();
```

### 服务清理

```typescript
// 注销单个服务
Core.services.unregister(MyService);

// 清空所有服务（会调用每个服务的dispose方法）
Core.services.clear();
```

## 最佳实践

### 服务命名

服务类名应该以 `Service` 或 `Manager` 结尾，清晰表达其职责：

```typescript
class PlayerService implements IService {}
class AudioManager implements IService {}
class NetworkService implements IService {}
```

### 资源清理

始终在 `dispose()` 方法中清理资源：

```typescript
class ResourceService implements IService {
    private resources: Map<string, Resource> = new Map();

    dispose(): void {
        // 释放所有资源
        for (const resource of this.resources.values()) {
            resource.release();
        }
        this.resources.clear();
    }
}
```

### 避免过度使用

不要把所有类都注册为服务，服务应该是：

- 全局单例或需要共享状态
- 需要在多处使用
- 生命周期需要管理
- 需要依赖注入

对于简单的工具类或数据类，直接创建实例即可。

### 依赖方向

保持清晰的依赖方向，避免循环依赖：

```
高层服务 -> 中层服务 -> 底层服务
GameLogic -> DataService -> ConfigService
```

## 常见问题

### 服务未注册错误

**问题**: `Error: Service MyService is not registered`

**解决**:
```typescript
// 确保服务已注册
Core.services.registerSingleton(MyService);

// 或者使用tryResolve
const service = Core.services.tryResolve(MyService);
if (!service) {
    console.log('Service not found');
}
```

### 循环依赖错误

**问题**: `Circular dependency detected`

**解决**: 重新设计服务依赖关系，引入中间服务或使用事件系统解耦。

### 何时使用单例 vs 瞬时

- **单例**: 管理器类、配置、缓存、状态管理
- **瞬时**: 命令对象、请求处理器、临时任务

## 相关链接

- [插件系统](./plugin-system.md) - 使用服务容器注册插件服务
- [快速开始](./getting-started.md) - Core 初始化和基础使用
- [系统架构](./system.md) - 在系统中使用服务
