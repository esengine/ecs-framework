# WorldManager

WorldManager 是 ECS Framework 提供的高级世界管理器，用于管理多个完全隔离的游戏世界（World）。每个 World 都是独立的 ECS 环境，可以包含多个场景。

## 适用场景

WorldManager 适合以下高级场景：
- MMO 游戏服务器的多房间管理
- 游戏大厅系统（每个游戏房间完全隔离）
- 服务器端的多游戏实例
- 需要完全隔离的多个游戏环境
- 需要同时运行多个独立世界的应用

## 特点

- 多 World 管理，每个 World 完全独立
- 每个 World 可以包含多个 Scene
- 支持 World 的激活/停用
- 自动清理空 World
- World 级别的全局系统
- 批量操作和查询

## 基本使用

### 初始化

WorldManager 是 Core 的内置服务，通过服务容器获取：

```typescript
import { Core, WorldManager } from '@esengine/ecs-framework';

// 初始化 Core
Core.create({ debug: true });

// 从服务容器获取 WorldManager（Core 已自动创建并注册）
const worldManager = Core.services.resolve(WorldManager);
```

### 创建 World

```typescript
// 创建游戏房间 World
const room1 = worldManager.createWorld('room_001', {
  name: 'GameRoom_001',
  maxScenes: 5,
  debug: true
});

// 激活 World
worldManager.setWorldActive('room_001', true);

// 创建更多房间
const room2 = worldManager.createWorld('room_002', {
  name: 'GameRoom_002',
  maxScenes: 5
});

worldManager.setWorldActive('room_002', true);
```

### 游戏循环

在游戏循环中更新所有活跃的 World：

```typescript
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);        // 更新全局服务
  worldManager.updateAll();      // 更新所有活跃的 World
}

// 启动游戏循环
let lastTime = 0;
setInterval(() => {
  const currentTime = Date.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  gameLoop(deltaTime);
}, 16); // 60 FPS
```

## World 管理

### 创建 World

```typescript
// 基本创建
const world = worldManager.createWorld('worldId');

// 带配置创建
const world = worldManager.createWorld('worldId', {
  name: 'MyWorld',
  maxScenes: 10,
  autoCleanup: true,
  debug: true
});
```

**配置选项（IWorldConfig）**：
- `name?: string` - World 名称
- `maxScenes?: number` - 最大场景数量限制（默认 10）
- `autoCleanup?: boolean` - 是否自动清理空场景（默认 true）
- `debug?: boolean` - 是否启用调试模式（默认 false）

### 获取 World

```typescript
// 通过 ID 获取
const world = worldManager.getWorld('room_001');
if (world) {
  console.log(`World: ${world.name}`);
}

// 获取所有 World
const allWorlds = worldManager.getAllWorlds();
console.log(`共有 ${allWorlds.length} 个 World`);

// 获取所有 World ID
const worldIds = worldManager.getWorldIds();
console.log('World 列表:', worldIds);

// 通过名称查找
const world = worldManager.findWorldByName('GameRoom_001');
```

### 激活和停用 World

```typescript
// 激活 World（开始运行和更新）
worldManager.setWorldActive('room_001', true);

// 停用 World（停止更新但保留数据）
worldManager.setWorldActive('room_001', false);

// 检查 World 是否激活
if (worldManager.isWorldActive('room_001')) {
  console.log('房间正在运行');
}

// 获取所有活跃的 World
const activeWorlds = worldManager.getActiveWorlds();
console.log(`当前有 ${activeWorlds.length} 个活跃 World`);
```

### 移除 World

```typescript
// 移除 World（会自动停用并销毁）
const removed = worldManager.removeWorld('room_001');
if (removed) {
  console.log('World 已移除');
}
```

## World 中的场景管理

每个 World 可以包含多个 Scene 并独立管理它们的生命周期。

### 创建场景

```typescript
const world = worldManager.getWorld('room_001');
if (!world) return;

// 创建场景
const mainScene = world.createScene('main', new MainScene());
const uiScene = world.createScene('ui', new UIScene());
const hudScene = world.createScene('hud', new HUDScene());

// 激活场景
world.setSceneActive('main', true);
world.setSceneActive('ui', true);
world.setSceneActive('hud', false);
```

### 查询场景

```typescript
// 获取特定场景
const mainScene = world.getScene<MainScene>('main');
if (mainScene) {
  console.log(`场景名称: ${mainScene.name}`);
}

// 获取所有场景
const allScenes = world.getAllScenes();
console.log(`World 中共有 ${allScenes.length} 个场景`);

// 获取所有场景 ID
const sceneIds = world.getSceneIds();
console.log('场景列表:', sceneIds);

// 获取活跃场景数量
const activeCount = world.getActiveSceneCount();
console.log(`当前有 ${activeCount} 个活跃场景`);

// 检查场景是否激活
if (world.isSceneActive('main')) {
  console.log('主场景正在运行');
}
```

### 场景切换

World 支持多场景同时运行，也支持场景切换：

```typescript
class GameWorld {
  private world: World;

  constructor(worldManager: WorldManager) {
    this.world = worldManager.createWorld('game', {
      name: 'GameWorld',
      maxScenes: 5
    });

    // 创建所有场景
    this.world.createScene('menu', new MenuScene());
    this.world.createScene('game', new GameScene());
    this.world.createScene('pause', new PauseScene());
    this.world.createScene('gameover', new GameOverScene());

    // 激活 World
    worldManager.setWorldActive('game', true);
  }

  public showMenu(): void {
    this.deactivateAllScenes();
    this.world.setSceneActive('menu', true);
  }

  public startGame(): void {
    this.deactivateAllScenes();
    this.world.setSceneActive('game', true);
  }

  public pauseGame(): void {
    // 游戏场景继续存在但停止更新
    this.world.setSceneActive('game', false);
    // 显示暂停界面
    this.world.setSceneActive('pause', true);
  }

  public resumeGame(): void {
    this.world.setSceneActive('pause', false);
    this.world.setSceneActive('game', true);
  }

  public showGameOver(): void {
    this.deactivateAllScenes();
    this.world.setSceneActive('gameover', true);
  }

  private deactivateAllScenes(): void {
    const sceneIds = this.world.getSceneIds();
    sceneIds.forEach(id => this.world.setSceneActive(id, false));
  }
}
```

### 移除场景

```typescript
// 移除不再需要的场景
const removed = world.removeScene('oldScene');
if (removed) {
  console.log('场景已移除');
}

// 场景会自动调用 end() 方法进行清理
```

## 全局系统

World 支持全局系统，这些系统在 World 级别运行，不依赖特定 Scene。

### 定义全局系统

```typescript
import { IGlobalSystem } from '@esengine/ecs-framework';

// 网络系统（World 级别）
class NetworkSystem implements IGlobalSystem {
  readonly name = 'NetworkSystem';

  private connectionId: string;

  constructor(connectionId: string) {
    this.connectionId = connectionId;
  }

  initialize(): void {
    console.log(`网络系统初始化: ${this.connectionId}`);
    // 建立网络连接
  }

  update(deltaTime?: number): void {
    // 处理网络消息，不依赖任何 Scene
    // 接收和发送网络包
  }

  destroy(): void {
    console.log(`网络系统销毁: ${this.connectionId}`);
    // 关闭网络连接
  }
}

// 物理系统（World 级别）
class PhysicsSystem implements IGlobalSystem {
  readonly name = 'PhysicsSystem';

  initialize(): void {
    console.log('物理系统初始化');
  }

  update(deltaTime?: number): void {
    // 物理模拟，作用于 World 中所有场景
  }

  destroy(): void {
    console.log('物理系统销毁');
  }
}
```

### 使用全局系统

```typescript
const world = worldManager.getWorld('room_001');
if (!world) return;

// 添加全局系统
const networkSystem = world.addGlobalSystem(new NetworkSystem('conn_001'));
const physicsSystem = world.addGlobalSystem(new PhysicsSystem());

// 获取全局系统
const network = world.getGlobalSystem(NetworkSystem);
if (network) {
  console.log('找到网络系统');
}

// 移除全局系统
world.removeGlobalSystem(networkSystem);
```

## 批量操作

### 更新所有 World

```typescript
// 更新所有活跃的 World（应该在游戏循环中调用）
worldManager.updateAll();

// 这会自动更新每个 World 的：
// 1. 全局系统
// 2. 所有活跃场景
```

### 启动和停止

```typescript
// 启动所有 World
worldManager.startAll();

// 停止所有 World
worldManager.stopAll();

// 检查是否正在运行
if (worldManager.isRunning) {
  console.log('WorldManager 正在运行');
}
```

### 查找 World

```typescript
// 使用条件查找
const emptyWorlds = worldManager.findWorlds(world => {
  return world.sceneCount === 0;
});

// 查找活跃的 World
const activeWorlds = worldManager.findWorlds(world => {
  return world.isActive;
});

// 查找特定名称的 World
const world = worldManager.findWorldByName('GameRoom_001');
```

## 统计和监控

### 获取统计信息

```typescript
const stats = worldManager.getStats();

console.log(`总 World 数: ${stats.totalWorlds}`);
console.log(`活跃 World 数: ${stats.activeWorlds}`);
console.log(`总场景数: ${stats.totalScenes}`);
console.log(`总实体数: ${stats.totalEntities}`);
console.log(`总系统数: ${stats.totalSystems}`);

// 查看每个 World 的详细信息
stats.worlds.forEach(worldInfo => {
  console.log(`World: ${worldInfo.name}`);
  console.log(`  场景数: ${worldInfo.sceneCount}`);
  console.log(`  是否活跃: ${worldInfo.isActive}`);
});
```

### 获取详细状态

```typescript
const status = worldManager.getDetailedStatus();

// 包含所有 World 的详细状态
status.worlds.forEach(worldStatus => {
  console.log(`World ID: ${worldStatus.id}`);
  console.log(`状态:`, worldStatus.status);
});
```

## 自动清理

WorldManager 支持自动清理空的 World。

### 配置清理

```typescript
// 创建带清理配置的 WorldManager
const worldManager = Core.services.resolve(WorldManager);

// WorldManager 的配置在 Core 中设置：
// {
//   maxWorlds: 50,
//   autoCleanup: true,
//   cleanupInterval: 30000  // 30 秒
// }
```

### 手动清理

```typescript
// 手动触发清理
const cleanedCount = worldManager.cleanup();
console.log(`清理了 ${cleanedCount} 个 World`);
```

**清理条件**：
- World 未激活
- 没有 Scene 或所有 Scene 都是空的
- 创建时间超过 10 分钟

## API 参考

### WorldManager API

| 方法 | 说明 |
|------|------|
| `createWorld(worldId, config?)` | 创建新 World |
| `removeWorld(worldId)` | 移除 World |
| `getWorld(worldId)` | 获取 World |
| `getAllWorlds()` | 获取所有 World |
| `getWorldIds()` | 获取所有 World ID |
| `setWorldActive(worldId, active)` | 设置 World 激活状态 |
| `isWorldActive(worldId)` | 检查 World 是否激活 |
| `getActiveWorlds()` | 获取所有活跃的 World |
| `updateAll()` | 更新所有活跃 World |
| `startAll()` | 启动所有 World |
| `stopAll()` | 停止所有 World |
| `findWorlds(predicate)` | 查找满足条件的 World |
| `findWorldByName(name)` | 根据名称查找 World |
| `getStats()` | 获取统计信息 |
| `getDetailedStatus()` | 获取详细状态信息 |
| `cleanup()` | 清理空 World |
| `destroy()` | 销毁 WorldManager |

### World API

| 方法 | 说明 |
|------|------|
| `createScene(sceneId, sceneInstance?)` | 创建并添加 Scene |
| `removeScene(sceneId)` | 移除 Scene |
| `getScene(sceneId)` | 获取 Scene |
| `getAllScenes()` | 获取所有 Scene |
| `getSceneIds()` | 获取所有 Scene ID |
| `setSceneActive(sceneId, active)` | 设置 Scene 激活状态 |
| `isSceneActive(sceneId)` | 检查 Scene 是否激活 |
| `getActiveSceneCount()` | 获取活跃 Scene 数量 |
| `addGlobalSystem(system)` | 添加全局系统 |
| `removeGlobalSystem(system)` | 移除全局系统 |
| `getGlobalSystem(type)` | 获取全局系统 |
| `start()` | 启动 World |
| `stop()` | 停止 World |
| `updateGlobalSystems()` | 更新全局系统 |
| `updateScenes()` | 更新所有激活 Scene |
| `destroy()` | 销毁 World |
| `getStatus()` | 获取 World 状态 |
| `getStats()` | 获取统计信息 |

### 属性

| 属性 | 说明 |
|------|------|
| `worldCount` | World 总数 |
| `activeWorldCount` | 活跃 World 数量 |
| `isRunning` | 是否正在运行 |
| `config` | 配置信息 |

## 完整示例

### MMO 游戏房间系统

```typescript
import { Core, WorldManager, Scene, World } from '@esengine/ecs-framework';

// 初始化
Core.create({ debug: true });
const worldManager = Core.services.resolve(WorldManager);

// 房间管理器
class RoomManager {
  private worldManager: WorldManager;
  private rooms: Map<string, World> = new Map();

  constructor(worldManager: WorldManager) {
    this.worldManager = worldManager;
  }

  // 创建游戏房间
  public createRoom(roomId: string, maxPlayers: number): World {
    const world = this.worldManager.createWorld(roomId, {
      name: `Room_${roomId}`,
      maxScenes: 3,
      debug: true
    });

    // 创建房间场景
    world.createScene('lobby', new LobbyScene());
    world.createScene('game', new GameScene());
    world.createScene('result', new ResultScene());

    // 添加房间级别的系统
    world.addGlobalSystem(new NetworkSystem(roomId));
    world.addGlobalSystem(new RoomLogicSystem(maxPlayers));

    // 激活 World 和初始场景
    this.worldManager.setWorldActive(roomId, true);
    world.setSceneActive('lobby', true);

    this.rooms.set(roomId, world);
    console.log(`房间 ${roomId} 已创建`);

    return world;
  }

  // 玩家加入房间
  public joinRoom(roomId: string, playerId: string): boolean {
    const world = this.rooms.get(roomId);
    if (!world) {
      console.log(`房间 ${roomId} 不存在`);
      return false;
    }

    // 在大厅场景中创建玩家实体
    const lobbyScene = world.getScene('lobby');
    if (lobbyScene) {
      const player = lobbyScene.createEntity(`Player_${playerId}`);
      // 添加玩家组件...
      console.log(`玩家 ${playerId} 加入房间 ${roomId}`);
      return true;
    }

    return false;
  }

  // 开始游戏
  public startGame(roomId: string): void {
    const world = this.rooms.get(roomId);
    if (!world) return;

    // 切换到游戏场景
    world.setSceneActive('lobby', false);
    world.setSceneActive('game', true);

    console.log(`房间 ${roomId} 游戏开始`);
  }

  // 结束游戏
  public endGame(roomId: string): void {
    const world = this.rooms.get(roomId);
    if (!world) return;

    // 切换到结果场景
    world.setSceneActive('game', false);
    world.setSceneActive('result', true);

    console.log(`房间 ${roomId} 游戏结束`);
  }

  // 关闭房间
  public closeRoom(roomId: string): void {
    this.worldManager.removeWorld(roomId);
    this.rooms.delete(roomId);
    console.log(`房间 ${roomId} 已关闭`);
  }

  // 获取房间列表
  public getRoomList(): string[] {
    return Array.from(this.rooms.keys());
  }

  // 获取房间统计
  public getRoomStats(roomId: string) {
    const world = this.rooms.get(roomId);
    return world?.getStats();
  }
}

// 使用房间管理器
const roomManager = new RoomManager(worldManager);

// 创建多个游戏房间
roomManager.createRoom('room_001', 4);
roomManager.createRoom('room_002', 4);
roomManager.createRoom('room_003', 2);

// 玩家加入
roomManager.joinRoom('room_001', 'player_1');
roomManager.joinRoom('room_001', 'player_2');

// 开始游戏
roomManager.startGame('room_001');

// 游戏循环
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);
  worldManager.updateAll();  // 更新所有房间
}

// 定期清理空房间
setInterval(() => {
  const stats = worldManager.getStats();
  console.log(`当前房间数: ${stats.totalWorlds}`);
  console.log(`活跃房间数: ${stats.activeWorlds}`);

  worldManager.cleanup();
}, 60000); // 每分钟清理一次
```

## 最佳实践

### 1. 合理的 World 粒度

```typescript
// 推荐：每个独立环境一个 World
const room1 = worldManager.createWorld('room_1');  // 游戏房间1
const room2 = worldManager.createWorld('room_2');  // 游戏房间2

// 不推荐：过度使用 World
const world1 = worldManager.createWorld('ui');     // UI 不需要独立 World
const world2 = worldManager.createWorld('menu');   // 菜单不需要独立 World
```

### 2. 使用全局系统处理跨场景逻辑

```typescript
// 推荐：World 级别的系统
class NetworkSystem implements IGlobalSystem {
  update() {
    // 网络处理不依赖场景
  }
}

// 不推荐：在每个场景中重复创建
class GameScene extends Scene {
  initialize() {
    this.addSystem(new NetworkSystem());  // 不应该在场景级别
  }
}
```

### 3. 及时清理不用的 World

```typescript
// 推荐：玩家离开时清理房间
function onPlayerLeave(roomId: string) {
  const world = worldManager.getWorld(roomId);
  if (world && world.sceneCount === 0) {
    worldManager.removeWorld(roomId);
  }
}

// 或使用自动清理
worldManager.cleanup();
```

### 4. 监控资源使用

```typescript
// 定期检查资源使用情况
setInterval(() => {
  const stats = worldManager.getStats();

  if (stats.totalWorlds > 100) {
    console.warn('World 数量过多，考虑清理');
    worldManager.cleanup();
  }

  if (stats.totalEntities > 10000) {
    console.warn('实体数量过多，检查是否有泄漏');
  }
}, 30000);
```

## 与 SceneManager 的对比

| 特性 | SceneManager | WorldManager |
|------|--------------|--------------|
| 适用场景 | 95% 的游戏应用 | 高级多世界隔离场景 |
| 复杂度 | 简单 | 复杂 |
| 场景数量 | 单场景（可切换） | 多 World，每个 World 多场景 |
| 场景隔离 | 无（场景切换） | 完全隔离（每个 World 独立） |
| 性能开销 | 最小 | 较高 |
| 全局系统 | 无 | 支持（World 级别） |
| 使用示例 | 单人游戏、移动游戏 | MMO 服务器、游戏房间系统 |

**何时使用 WorldManager**：
- MMO 游戏服务器（每个房间一个 World）
- 游戏大厅系统（每个游戏房间完全隔离）
- 需要运行多个完全独立的游戏实例
- 服务器端模拟多个游戏世界

**何时使用 SceneManager**：
- 单人游戏
- 简单的多人游戏
- 移动游戏
- 场景之间需要切换但不需要同时运行

## 架构层次

WorldManager 在 ECS Framework 中的位置：

```
Core (全局服务)
  └── WorldManager (世界管理)
      ├── World 1 (游戏房间1)
      │   ├── GlobalSystem (全局系统)
      │   ├── Scene 1 (场景1)
      │   │   ├── EntitySystem
      │   │   ├── Entity
      │   │   └── Component
      │   └── Scene 2 (场景2)
      ├── World 2 (游戏房间2)
      │   ├── GlobalSystem
      │   └── Scene 1
      └── World 3 (游戏房间3)
```

WorldManager 为需要多世界隔离的高级应用提供了强大的管理能力。如果你的应用不需要多世界隔离，建议使用更简单的 [SceneManager](./scene-manager.md)。
