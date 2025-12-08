# 持久化实体

> **版本**: v2.3.0+

持久化实体（Persistent Entity）是一种可以在场景切换时自动迁移到新场景的特殊实体。适用于需要跨场景保持状态的游戏对象，如玩家、游戏管理器、音频管理器等。

## 基本概念

在 ECS 框架中，实体有两种生命周期策略：

| 策略 | 说明 | 默认 |
|-----|------|------|
| `SceneLocal` | 场景本地实体，场景切换时销毁 | ✓ |
| `Persistent` | 持久化实体，场景切换时自动迁移 | |

## 快速开始

### 创建持久化实体

```typescript
import { Scene } from '@esengine/esengine';

class GameScene extends Scene {
  protected initialize(): void {
    // 创建持久化玩家实体
    const player = this.createEntity('Player').setPersistent();
    player.addComponent(new Position(100, 200));
    player.addComponent(new PlayerData('Hero', 500));

    // 创建普通敌人实体（场景切换时销毁）
    const enemy = this.createEntity('Enemy');
    enemy.addComponent(new Position(300, 200));
    enemy.addComponent(new EnemyAI());
  }
}
```

### 场景切换时的行为

```typescript
import { Core, Scene } from '@esengine/esengine';

// 初始场景
class Level1Scene extends Scene {
  protected initialize(): void {
    // 玩家 - 持久化，会迁移到下一个场景
    const player = this.createEntity('Player').setPersistent();
    player.addComponent(new Position(0, 0));
    player.addComponent(new Health(100));

    // 敌人 - 场景本地，切换时销毁
    const enemy = this.createEntity('Enemy');
    enemy.addComponent(new Position(100, 100));
  }
}

// 目标场景
class Level2Scene extends Scene {
  protected initialize(): void {
    // 新的敌人
    const enemy = this.createEntity('Boss');
    enemy.addComponent(new Position(200, 200));
  }

  public onStart(): void {
    // 玩家已自动迁移到此场景
    const player = this.findEntity('Player');
    console.log(player !== null); // true

    // 位置和血量数据完整保留
    const position = player?.getComponent(Position);
    const health = player?.getComponent(Health);
    console.log(position?.x, position?.y); // 0, 0
    console.log(health?.value); // 100
  }
}

// 切换场景
Core.create({ debug: true });
Core.setScene(new Level1Scene());

// 稍后切换到 Level2
Core.loadScene(new Level2Scene());
// Player 实体自动迁移，Enemy 实体被销毁
```

## API 参考

### Entity 方法

#### setPersistent()

将实体标记为持久化，场景切换时不会被销毁。

```typescript
public setPersistent(): this
```

**返回**: 返回实体本身，支持链式调用

**示例**:
```typescript
const player = scene.createEntity('Player')
  .setPersistent();

player.addComponent(new Position(100, 200));
```

#### setSceneLocal()

将实体恢复为场景本地策略（默认）。

```typescript
public setSceneLocal(): this
```

**返回**: 返回实体本身，支持链式调用

**示例**:
```typescript
// 动态取消持久化
player.setSceneLocal();
```

#### isPersistent

检查实体是否为持久化实体。

```typescript
public get isPersistent(): boolean
```

**示例**:
```typescript
if (entity.isPersistent) {
  console.log('这是持久化实体');
}
```

#### lifecyclePolicy

获取实体的生命周期策略。

```typescript
public get lifecyclePolicy(): EEntityLifecyclePolicy
```

**示例**:
```typescript
import { EEntityLifecyclePolicy } from '@esengine/esengine';

if (entity.lifecyclePolicy === EEntityLifecyclePolicy.Persistent) {
  console.log('持久化实体');
}
```

### Scene 方法

#### findPersistentEntities()

查找场景中所有持久化实体。

```typescript
public findPersistentEntities(): Entity[]
```

**返回**: 持久化实体数组

**示例**:
```typescript
const persistentEntities = scene.findPersistentEntities();
console.log(`场景中有 ${persistentEntities.length} 个持久化实体`);
```

#### extractPersistentEntities()

提取并从场景中移除所有持久化实体（通常由框架内部调用）。

```typescript
public extractPersistentEntities(): Entity[]
```

**返回**: 被提取的持久化实体数组

#### receiveMigratedEntities()

接收迁移过来的实体（通常由框架内部调用）。

```typescript
public receiveMigratedEntities(entities: Entity[]): void
```

**参数**:
- `entities` - 要接收的实体数组

## 使用场景

### 1. 玩家实体跨关卡

```typescript
class PlayerSetupScene extends Scene {
  protected initialize(): void {
    // 玩家在所有关卡中保持状态
    const player = this.createEntity('Player').setPersistent();
    player.addComponent(new Transform(0, 0));
    player.addComponent(new Health(100));
    player.addComponent(new Inventory());
    player.addComponent(new PlayerStats());
  }
}

class Level1 extends Scene { /* ... */ }
class Level2 extends Scene { /* ... */ }
class Level3 extends Scene { /* ... */ }

// 玩家实体会自动在所有关卡间迁移
Core.setScene(new PlayerSetupScene());
// ... 游戏进行
Core.loadScene(new Level1());
// ... 关卡完成
Core.loadScene(new Level2());
// 玩家数据（血量、物品栏、属性）完整保留
```

### 2. 全局管理器

```typescript
class BootstrapScene extends Scene {
  protected initialize(): void {
    // 音频管理器 - 跨场景保持
    const audioManager = this.createEntity('AudioManager').setPersistent();
    audioManager.addComponent(new AudioController());

    // 成就管理器 - 跨场景保持
    const achievementManager = this.createEntity('AchievementManager').setPersistent();
    achievementManager.addComponent(new AchievementTracker());

    // 游戏设置 - 跨场景保持
    const settings = this.createEntity('GameSettings').setPersistent();
    settings.addComponent(new SettingsData());
  }
}
```

### 3. 动态切换持久化状态

```typescript
class GameScene extends Scene {
  protected initialize(): void {
    // 初始创建为普通实体
    const companion = this.createEntity('Companion');
    companion.addComponent(new Transform(0, 0));
    companion.addComponent(new CompanionAI());

    // 监听招募事件
    this.eventSystem.on('companion:recruited', () => {
      // 招募后变为持久化实体
      companion.setPersistent();
      console.log('同伴已加入队伍，将跟随玩家跨场景');
    });

    // 监听解散事件
    this.eventSystem.on('companion:dismissed', () => {
      // 解散后恢复为场景本地实体
      companion.setSceneLocal();
      console.log('同伴已离队，不再跨场景');
    });
  }
}
```

## 最佳实践

### 1. 明确标识持久化实体

```typescript
// 推荐：在创建时立即标记
const player = this.createEntity('Player').setPersistent();

// 不推荐：创建后再标记（容易遗漏）
const player = this.createEntity('Player');
// ... 很多代码 ...
player.setPersistent(); // 容易忘记
```

### 2. 合理使用持久化

```typescript
// ✓ 适合持久化的实体
const player = this.createEntity('Player').setPersistent();      // 玩家
const gameManager = this.createEntity('GameManager').setPersistent(); // 全局管理器
const audioManager = this.createEntity('AudioManager').setPersistent(); // 音频系统

// ✗ 不应持久化的实体
const bullet = this.createEntity('Bullet'); // 临时对象
const enemy = this.createEntity('Enemy');   // 关卡特定敌人
const particle = this.createEntity('Particle'); // 特效粒子
```

### 3. 检查迁移后的实体

```typescript
class NewScene extends Scene {
  public onStart(): void {
    // 检查预期的持久化实体是否存在
    const player = this.findEntity('Player');
    if (!player) {
      console.error('玩家实体未正确迁移！');
      // 处理错误情况
    }
  }
}
```

### 4. 避免循环引用

```typescript
// ✗ 避免：持久化实体引用场景本地实体
class BadScene extends Scene {
  protected initialize(): void {
    const player = this.createEntity('Player').setPersistent();
    const enemy = this.createEntity('Enemy');

    // 危险：player 持久化但 enemy 不是
    // 场景切换后 enemy 被销毁，引用失效
    player.addComponent(new TargetComponent(enemy));
  }
}

// ✓ 推荐：使用 ID 引用或事件系统
class GoodScene extends Scene {
  protected initialize(): void {
    const player = this.createEntity('Player').setPersistent();
    const enemy = this.createEntity('Enemy');

    // 存储 ID 而非直接引用
    player.addComponent(new TargetComponent(enemy.id));

    // 或使用事件系统通信
  }
}
```

## 注意事项

1. **已销毁的实体不会迁移**：如果实体在场景切换前被销毁，即使标记为持久化也不会迁移。

2. **组件数据完整保留**：迁移时所有组件及其状态都会保留。

3. **场景引用会更新**：迁移后实体的 `scene` 属性会指向新场景。

4. **查询系统会更新**：迁移的实体会自动注册到新场景的查询系统中。

5. **延迟切换同样生效**：使用 `Core.loadScene()` 延迟切换时，持久化实体同样会迁移。

## 相关文档

- [场景管理](./scene.md) - 了解场景的基本使用
- [SceneManager](./scene-manager.md) - 了解场景切换
- [WorldManager](./world-manager.md) - 了解多世界管理
