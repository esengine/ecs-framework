# 事件系统

ECS 框架内置了强大的类型安全事件系统，支持同步/异步事件、优先级、批处理等高级功能。事件系统是实现组件间通信、系统间协作的核心机制。

## 基本概念

事件系统提供了发布-订阅模式的实现，包含以下核心概念：
- **事件发布者**：发射事件的对象
- **事件监听者**：监听并处理特定事件的对象
- **事件类型**：字符串标识，用于区分不同类型的事件
- **事件数据**：事件携带的相关信息

## 事件系统架构

框架提供了两层事件系统：

1. **TypeSafeEventSystem** - 底层高性能事件系统
2. **EventBus** - 上层增强事件总线，提供更多便利功能

## 基本使用

### 在场景中使用事件系统

每个场景都有内置的事件系统：

```typescript
class GameScene extends Scene {
  protected initialize(): void {
    // 监听事件
    this.eventSystem.on('player_died', this.onPlayerDied.bind(this));
    this.eventSystem.on('enemy_spawned', this.onEnemySpawned.bind(this));
    this.eventSystem.on('score_changed', this.onScoreChanged.bind(this));
  }

  private onPlayerDied(data: { player: Entity, cause: string }): void {
    console.log(`玩家死亡，原因: ${data.cause}`);
    // 处理玩家死亡逻辑
  }

  private onEnemySpawned(data: { enemy: Entity, position: { x: number, y: number } }): void {
    console.log('敌人生成于:', data.position);
    // 处理敌人生成逻辑
  }

  private onScoreChanged(data: { newScore: number, oldScore: number }): void {
    console.log(`分数变化: ${data.oldScore} -> ${data.newScore}`);
    // 更新UI显示
  }

  // 在系统中发射事件
  someGameLogic(): void {
    // 发射同步事件
    this.eventSystem.emitSync('score_changed', {
      newScore: 1000,
      oldScore: 800
    });
  }
}
```

### 在系统中使用事件

系统可以方便地监听和发送事件：

```typescript
@ECSSystem('Combat')
class CombatSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Health, Combat));
  }

  protected onInitialize(): void {
    // 使用系统提供的事件监听方法（自动清理）
    this.addEventListener('player_attack', this.onPlayerAttack.bind(this));
    this.addEventListener('enemy_death', this.onEnemyDeath.bind(this));
  }

  private onPlayerAttack(data: { damage: number, target: Entity }): void {
    // 处理玩家攻击事件
    const health = data.target.getComponent(Health);
    if (health) {
      health.current -= data.damage;

      if (health.current <= 0) {
        // 发送敌人死亡事件
        this.scene?.eventSystem.emitSync('enemy_death', {
          enemy: data.target,
          killer: 'player'
        });
      }
    }
  }

  private onEnemyDeath(data: { enemy: Entity, killer: string }): void {
    // 处理敌人死亡
    data.enemy.destroy();

    // 发送经验奖励事件
    this.scene?.eventSystem.emitSync('experience_gained', {
      amount: 100,
      source: 'enemy_kill'
    });
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const combat = entity.getComponent(Combat);
      if (combat && combat.shouldAttack()) {
        // 发射攻击事件
        this.scene?.eventSystem.emitSync('player_attack', {
          damage: combat.damage,
          target: combat.target
        });
      }
    }
  }
}
```

## 高级功能

### 一次性监听器

```typescript
class GameScene extends Scene {
  protected initialize(): void {
    // 只监听一次的事件
    this.eventSystem.once('game_start', this.onGameStart.bind(this));

    // 或者使用配置对象
    this.eventSystem.on('level_complete', this.onLevelComplete.bind(this), {
      once: true // 只执行一次
    });
  }

  private onGameStart(): void {
    console.log('游戏开始！');
    // 这个方法只会被调用一次
  }

  private onLevelComplete(): void {
    console.log('关卡完成！');
    // 这个方法也只会被调用一次
  }
}
```

### 优先级控制

```typescript
class GameScene extends Scene {
  protected initialize(): void {
    // 高优先级监听器先执行
    this.eventSystem.on('damage_dealt', this.onDamageDealt.bind(this), {
      priority: 100 // 高优先级
    });

    // 普通优先级
    this.eventSystem.on('damage_dealt', this.updateUI.bind(this), {
      priority: 0 // 默认优先级
    });

    // 低优先级最后执行
    this.eventSystem.on('damage_dealt', this.logDamage.bind(this), {
      priority: -100 // 低优先级
    });
  }

  private onDamageDealt(data: any): void {
    // 最先执行 - 处理核心游戏逻辑
  }

  private updateUI(data: any): void {
    // 中等优先级 - 更新界面
  }

  private logDamage(data: any): void {
    // 最后执行 - 记录日志
  }
}
```

### 异步事件处理

```typescript
class GameScene extends Scene {
  protected initialize(): void {
    // 监听异步事件
    this.eventSystem.onAsync('save_game', this.onSaveGame.bind(this));
    this.eventSystem.onAsync('load_data', this.onLoadData.bind(this));
  }

  private async onSaveGame(data: { saveSlot: number }): Promise<void> {
    console.log(`开始保存游戏到槽位 ${data.saveSlot}`);

    // 模拟异步保存操作
    await this.saveGameData(data.saveSlot);

    console.log('游戏保存完成');
  }

  private async onLoadData(data: { url: string }): Promise<void> {
    try {
      const response = await fetch(data.url);
      const gameData = await response.json();
      // 处理加载的数据
    } catch (error) {
      console.error('数据加载失败:', error);
    }
  }

  private async saveGameData(slot: number): Promise<void> {
    // 模拟保存操作
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 发射异步事件
  public async triggerSave(): Promise<void> {
    // 使用 emit 而不是 emitSync 来触发异步监听器
    await this.eventSystem.emit('save_game', { saveSlot: 1 });
    console.log('所有异步保存操作完成');
  }
}
```

### 事件统计和调试

```typescript
class GameScene extends Scene {
  protected initialize(): void {
    this.eventSystem.on('debug_event', this.onDebugEvent.bind(this));
  }

  private onDebugEvent(): void {
    // 处理调试事件
  }

  public showEventStats(): void {
    // 获取特定事件的统计信息
    const stats = this.eventSystem.getStats('debug_event') as any;
    if (stats) {
      console.log('事件统计:');
      console.log(`- 事件类型: ${stats.eventType}`);
      console.log(`- 监听器数量: ${stats.listenerCount}`);
      console.log(`- 触发次数: ${stats.triggerCount}`);
      console.log(`- 平均执行时间: ${stats.averageExecutionTime.toFixed(2)}ms`);
    }

    // 获取所有事件统计
    const allStats = this.eventSystem.getStats() as Map<string, any>;
    console.log(`总共有 ${allStats.size} 种事件类型`);
  }

  public resetEventStats(): void {
    // 重置特定事件的统计
    this.eventSystem.resetStats('debug_event');

    // 或重置所有统计
    this.eventSystem.resetStats();
  }
}
```

## 全局事件总线

对于跨场景的事件通信，可以使用全局事件总线：

```typescript
import { GlobalEventBus } from '@esengine/ecs-framework';

class GameManager {
  private eventBus = GlobalEventBus.getInstance();

  constructor() {
    this.setupGlobalEvents();
  }

  private setupGlobalEvents(): void {
    // 监听全局事件
    this.eventBus.on('player_level_up', this.onPlayerLevelUp.bind(this));
    this.eventBus.on('achievement_unlocked', this.onAchievementUnlocked.bind(this));
    this.eventBus.onAsync('upload_score', this.onUploadScore.bind(this));
  }

  private onPlayerLevelUp(data: { level: number, experience: number }): void {
    console.log(`玩家升级到 ${data.level} 级！`);
    // 处理全局升级逻辑
  }

  private onAchievementUnlocked(data: { achievementId: string, name: string }): void {
    console.log(`解锁成就: ${data.name}`);
    // 显示成就通知
  }

  private async onUploadScore(data: { score: number, playerName: string }): Promise<void> {
    // 异步上传分数到服务器
    try {
      await this.uploadToServer(data);
      console.log('分数上传成功');
    } catch (error) {
      console.error('分数上传失败:', error);
    }
  }

  public triggerGlobalEvent(): void {
    // 发射全局事件
    this.eventBus.emit('player_level_up', {
      level: 10,
      experience: 2500
    });
  }

  private async uploadToServer(data: any): Promise<void> {
    // 模拟服务器上传
    return new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

## 事件装饰器

使用装饰器自动注册事件监听器：

```typescript
import { EventHandler, AsyncEventHandler } from '@esengine/ecs-framework';

class PlayerController {
  constructor() {
    // 自动调用事件监听器注册
    this.initEventListeners();
  }

  @EventHandler('player_input')
  private onPlayerInput(data: { action: string, value: number }): void {
    console.log(`玩家输入: ${data.action} = ${data.value}`);
    // 处理玩家输入
  }

  @EventHandler('player_attack', { priority: 100 })
  private onPlayerAttack(data: { damage: number, target: string }): void {
    console.log(`玩家攻击 ${data.target}，造成 ${data.damage} 伤害`);
    // 处理攻击逻辑
  }

  @AsyncEventHandler('save_progress')
  private async onSaveProgress(data: { checkpointId: string }): Promise<void> {
    console.log(`保存进度到检查点: ${data.checkpointId}`);
    // 异步保存进度
    await this.saveToCloud(data.checkpointId);
  }

  @EventHandler('game_over', { once: true })
  private onGameOver(): void {
    console.log('游戏结束！');
    // 这个方法只会被调用一次
  }

  private async saveToCloud(checkpointId: string): Promise<void> {
    // 模拟云端保存
    return new Promise(resolve => setTimeout(resolve, 1500));
  }
}
```

## 批处理事件

对于高频事件，可以使用批处理来提升性能：

```typescript
class MovementSystem extends EntitySystem {
  protected onInitialize(): void {
    // 设置位置更新事件的批处理
    this.scene?.eventSystem.setBatchConfig('position_updated', {
      batchSize: 50,    // 批处理大小
      delay: 16,        // 延迟时间（毫秒）
      enabled: true
    });

    // 监听批处理事件
    this.addEventListener('position_updated:batch', this.onPositionBatch.bind(this));
  }

  private onPositionBatch(batchData: any): void {
    console.log(`批处理位置更新，共 ${batchData.count} 个事件`);

    // 批量处理所有位置更新
    for (const event of batchData.events) {
      this.updateMinimap(event.entityId, event.position);
    }
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const position = entity.getComponent(Position);
      if (position && position.hasChanged) {
        // 发射高频位置更新事件（会被批处理）
        this.scene?.eventSystem.emitSync('position_updated', {
          entityId: entity.id,
          position: { x: position.x, y: position.y }
        });
      }
    }
  }

  private updateMinimap(entityId: number, position: { x: number, y: number }): void {
    // 更新小地图显示
  }

  public flushPositionUpdates(): void {
    // 立即处理所有待处理的位置更新
    this.scene?.eventSystem.flushBatch('position_updated');
  }
}
```

## 预定义的 ECS 事件

框架提供了一些预定义的 ECS 生命周期事件：

```typescript
import { ECSEventType } from '@esengine/ecs-framework';

class ECSMonitor {
  private eventBus = GlobalEventBus.getInstance();

  constructor() {
    this.setupECSEvents();
  }

  private setupECSEvents(): void {
    // 监听实体生命周期事件
    this.eventBus.onEntityCreated(this.onEntityCreated.bind(this));
    this.eventBus.on(ECSEventType.ENTITY_DESTROYED, this.onEntityDestroyed.bind(this));

    // 监听组件生命周期事件
    this.eventBus.onComponentAdded(this.onComponentAdded.bind(this));
    this.eventBus.on(ECSEventType.COMPONENT_REMOVED, this.onComponentRemoved.bind(this));

    // 监听系统事件
    this.eventBus.on(ECSEventType.SYSTEM_ADDED, this.onSystemAdded.bind(this));
    this.eventBus.onSystemError(this.onSystemError.bind(this));

    // 监听性能警告
    this.eventBus.onPerformanceWarning(this.onPerformanceWarning.bind(this));
  }

  private onEntityCreated(data: any): void {
    console.log(`实体创建: ${data.entityName} (ID: ${data.entity.id})`);
  }

  private onEntityDestroyed(data: any): void {
    console.log(`实体销毁: ${data.entity.name} (ID: ${data.entity.id})`);
  }

  private onComponentAdded(data: any): void {
    console.log(`组件添加: ${data.componentType} 到实体 ${data.entity.name}`);
  }

  private onComponentRemoved(data: any): void {
    console.log(`组件移除: ${data.componentType} 从实体 ${data.entity.name}`);
  }

  private onSystemAdded(data: any): void {
    console.log(`系统添加: ${data.systemName}`);
  }

  private onSystemError(data: any): void {
    console.error(`系统错误: ${data.systemName}`, data.error);
  }

  private onPerformanceWarning(data: any): void {
    console.warn(`性能警告: ${data.systemName} 执行时间过长 (${data.executionTime}ms)`);
  }
}
```

## 最佳实践

### 1. 事件命名规范

```typescript
// ✅ 好的事件命名
this.eventSystem.emitSync('player:health_changed', data);
this.eventSystem.emitSync('enemy:spawned', data);
this.eventSystem.emitSync('ui:score_updated', data);
this.eventSystem.emitSync('game:paused', data);

// ❌ 避免的事件命名
this.eventSystem.emitSync('event1', data);
this.eventSystem.emitSync('update', data);
this.eventSystem.emitSync('change', data);
```

### 2. 类型安全的事件数据

```typescript
// 定义事件数据接口
interface PlayerHealthChangedEvent {
  entityId: number;
  oldHealth: number;
  newHealth: number;
  cause: 'damage' | 'healing';
}

interface EnemySpawnedEvent {
  enemyType: string;
  position: { x: number, y: number };
  level: number;
}

// 使用类型安全的事件
class HealthSystem extends EntitySystem {
  private onHealthChanged(data: PlayerHealthChangedEvent): void {
    // TypeScript 会提供完整的类型检查
    console.log(`生命值变化: ${data.oldHealth} -> ${data.newHealth}`);
  }
}
```

### 3. 避免事件循环

```typescript
// ❌ 避免：可能导致无限循环
class BadEventHandler {
  private onScoreChanged(data: any): void {
    // 在处理分数变化时又触发分数变化事件
    this.scene?.eventSystem.emitSync('score_changed', newData); // 危险！
  }
}

// ✅ 正确：使用不同的事件类型或条件判断
class GoodEventHandler {
  private isProcessingScore = false;

  private onScoreChanged(data: any): void {
    if (this.isProcessingScore) return; // 防止循环

    this.isProcessingScore = true;
    // 处理分数变化
    this.updateUI(data);
    this.isProcessingScore = false;
  }
}
```

### 4. 及时清理事件监听器

```typescript
class TemporaryUI {
  private listenerId: string;

  constructor(scene: Scene) {
    // 保存监听器ID用于后续清理
    this.listenerId = scene.eventSystem.on('ui_update', this.onUpdate.bind(this));
  }

  private onUpdate(data: any): void {
    // 处理UI更新
  }

  public destroy(): void {
    // 清理事件监听器
    if (this.listenerId) {
      scene.eventSystem.off('ui_update', this.listenerId);
    }
  }
}
```

### 5. 性能考虑

```typescript
class OptimizedEventHandler {
  protected onInitialize(): void {
    // 对于高频事件，使用批处理
    this.scene?.eventSystem.setBatchConfig('movement_update', {
      batchSize: 100,
      delay: 16,
      enabled: true
    });

    // 对于低频但重要的事件，使用高优先级
    this.addEventListener('game_over', this.onGameOver.bind(this), {
      priority: 1000
    });

    // 对于一次性事件，使用 once
    this.addEventListener('level_start', this.onLevelStart.bind(this), {
      once: true
    });
  }
}
```

事件系统是 ECS 框架中实现松耦合架构的重要工具，正确使用事件系统能让你的游戏代码更加模块化、可维护和可扩展。