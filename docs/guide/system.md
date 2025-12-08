# 系统架构

在 ECS 架构中，系统（System）是处理业务逻辑的地方。系统负责对拥有特定组件组合的实体执行操作，是 ECS 架构的逻辑处理单元。

## 基本概念

系统是继承自 `EntitySystem` 抽象基类的具体类，用于：
- 定义实体的处理逻辑（如移动、碰撞检测、渲染等）
- 根据组件组合筛选需要处理的实体
- 提供生命周期管理和性能监控
- 管理实体的添加、移除事件

## 系统类型

框架提供了几种不同类型的系统基类：

### EntitySystem - 基础系统

最基础的系统类，所有其他系统都继承自它：

```typescript
import { EntitySystem, ECSSystem, Matcher } from '@esengine/esengine';

@ECSSystem('Movement')
class MovementSystem extends EntitySystem {
  constructor() {
    // 使用 Matcher 定义需要处理的实体条件
    super(Matcher.all(Position, Velocity));
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const position = entity.getComponent(Position);
      const velocity = entity.getComponent(Velocity);

      if (position && velocity) {
        position.x += velocity.dx * Time.deltaTime;
        position.y += velocity.dy * Time.deltaTime;
      }
    }
  }
}
```

### ProcessingSystem - 处理系统

适用于不需要逐个处理实体的系统：

```typescript
@ECSSystem('Physics')
class PhysicsSystem extends ProcessingSystem {
  constructor() {
    super(); // 不需要指定 Matcher
  }

  public processSystem(): void {
    // 执行物理世界步进
    this.physicsWorld.step(Time.deltaTime);
  }
}
```

### PassiveSystem - 被动系统

被动系统不进行主动处理，主要用于监听实体的添加和移除事件：

```typescript
@ECSSystem('EntityTracker')
class EntityTrackerSystem extends PassiveSystem {
  constructor() {
    super(Matcher.all(Health));
  }

  protected onAdded(entity: Entity): void {
    console.log(`生命值实体被添加: ${entity.name}`);
  }

  protected onRemoved(entity: Entity): void {
    console.log(`生命值实体被移除: ${entity.name}`);
  }
}
```

### IntervalSystem - 间隔系统

按固定时间间隔执行的系统：

```typescript
@ECSSystem('AutoSave')
class AutoSaveSystem extends IntervalSystem {
  constructor() {
    // 每 5 秒执行一次
    super(5.0, Matcher.all(SaveData));
  }

  protected process(entities: readonly Entity[]): void {
    console.log('执行自动保存...');
    // 保存游戏数据
    this.saveGameData(entities);
  }

  private saveGameData(entities: readonly Entity[]): void {
    // 保存逻辑
  }
}
```

### WorkerEntitySystem - 多线程系统

基于Web Worker的多线程处理系统，适用于计算密集型任务，能够充分利用多核CPU性能。

Worker系统提供了真正的并行计算能力，支持SharedArrayBuffer优化，并具有自动降级支持。特别适合物理模拟、粒子系统、AI计算等场景。

**详细内容请参考：[Worker系统](/guide/worker-system)**

## 实体匹配器 (Matcher)

Matcher 用于定义系统需要处理哪些实体。它提供了灵活的条件组合：

### 基本匹配条件

```typescript
// 必须同时拥有 Position 和 Velocity 组件
const matcher1 = Matcher.all(Position, Velocity);

// 至少拥有 Health 或 Shield 组件之一
const matcher2 = Matcher.any(Health, Shield);

// 不能拥有 Dead 组件
const matcher3 = Matcher.none(Dead);
```

### 复合匹配条件

```typescript
// 复杂的组合条件
const complexMatcher = Matcher.all(Position, Velocity)
  .any(Player, Enemy)
  .none(Dead, Disabled);

@ECSSystem('Combat')
class CombatSystem extends EntitySystem {
  constructor() {
    super(complexMatcher);
  }
}
```

### 特殊匹配条件

```typescript
// 按标签匹配
const tagMatcher = Matcher.byTag(1); // 匹配标签为 1 的实体

// 按名称匹配
const nameMatcher = Matcher.byName("Player"); // 匹配名称为 "Player" 的实体

// 单组件匹配
const componentMatcher = Matcher.byComponent(Health); // 匹配拥有 Health 组件的实体

// 不匹配任何实体
const nothingMatcher = Matcher.nothing(); // 用于只需要生命周期回调的系统
```

### 空匹配器 vs Nothing 匹配器

```typescript
// empty() - 空条件，匹配所有实体
const emptyMatcher = Matcher.empty();

// nothing() - 不匹配任何实体，用于只需要生命周期方法的系统
const nothingMatcher = Matcher.nothing();

// 使用场景：只需要 onBegin/onEnd 生命周期的系统
@ECSSystem('FrameTimer')
class FrameTimerSystem extends EntitySystem {
  constructor() {
    super(Matcher.nothing()); // 不处理任何实体
  }

  protected onBegin(): void {
    // 每帧开始时执行，例如：记录帧开始时间
    console.log('帧开始');
  }

  protected process(entities: readonly Entity[]): void {
    // 永远不会被调用，因为没有匹配的实体
  }

  protected onEnd(): void {
    // 每帧结束时执行
    console.log('帧结束');
  }
}
```

> 💡 **提示**：更多关于 Matcher 和实体查询的详细用法，请参考 [实体查询系统](/guide/entity-query) 文档。

## 系统生命周期

系统提供了完整的生命周期回调：

```typescript
@ECSSystem('Example')
class ExampleSystem extends EntitySystem {
  protected onInitialize(): void {
    console.log('系统初始化');
    // 系统被添加到场景时调用，用于初始化资源
  }

  protected onBegin(): void {
    // 每帧处理开始前调用
  }

  protected process(entities: readonly Entity[]): void {
    // 主要的处理逻辑
    for (const entity of entities) {
      // 处理每个实体
      // ✅ 可以安全地在这里添加/移除组件，不会影响当前迭代
    }
  }

  protected lateProcess(entities: readonly Entity[]): void {
    // 主处理之后的后期处理
    // ✅ 可以安全地在这里添加/移除组件，不会影响当前迭代
  }

  protected onEnd(): void {
    // 每帧处理结束后调用
  }

  protected onDestroy(): void {
    console.log('系统销毁');
    // 系统从场景移除时调用，用于清理资源
  }
}
```

## 实体事件监听

系统可以监听实体的添加和移除事件：

```typescript
@ECSSystem('EnemyManager')
class EnemyManagerSystem extends EntitySystem {
  private enemyCount = 0;

  constructor() {
    super(Matcher.all(Enemy, Health));
  }

  protected onAdded(entity: Entity): void {
    this.enemyCount++;
    console.log(`敌人加入战斗，当前敌人数量: ${this.enemyCount}`);

    // 可以在这里为新敌人设置初始状态
    const health = entity.getComponent(Health);
    if (health) {
      health.current = health.max;
    }
  }

  protected onRemoved(entity: Entity): void {
    this.enemyCount--;
    console.log(`敌人被移除，剩余敌人数量: ${this.enemyCount}`);

    // 检查是否所有敌人都被消灭
    if (this.enemyCount === 0) {
      this.scene?.eventSystem.emitSync('all_enemies_defeated');
    }
  }
}
```

### 重要：onAdded/onRemoved 的调用时机

> ⚠️ **注意**：`onAdded` 和 `onRemoved` 回调是**同步调用**的，会在 `addComponent`/`removeComponent` 返回**之前**立即执行。

这意味着：

```typescript
// ❌ 错误的用法：链式赋值在 onAdded 之后才执行
const comp = entity.addComponent(new ClickComponent());
comp.element = this._element;  // 此时 onAdded 已经执行完了！

// ✅ 正确的用法：通过构造函数传入初始值
const comp = entity.addComponent(new ClickComponent(this._element));

// ✅ 或者使用 createComponent 方法
const comp = entity.createComponent(ClickComponent, this._element);
```

**为什么这样设计？**

事件驱动设计确保 `onAdded`/`onRemoved` 回调不受系统注册顺序的影响。当组件被添加时，所有监听该组件的系统都会立即收到通知，而不是等到下一帧。

**最佳实践：**

1. 组件的初始值应该通过**构造函数**传入
2. 不要依赖 `addComponent` 返回后再设置属性
3. 如果需要在 `onAdded` 中访问组件属性，确保这些属性在构造时已经设置

### 在 process/lateProcess 中安全地修改组件

在 `process` 或 `lateProcess` 中迭代实体时，可以安全地添加或移除组件，不会影响当前的迭代过程：

```typescript
@ECSSystem('Damage')
class DamageSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Health, DamageReceiver));
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      const damage = entity.getComponent(DamageReceiver);

      if (health && damage) {
        health.current -= damage.amount;

        // ✅ 安全：移除组件不会影响当前迭代
        entity.removeComponent(damage);

        if (health.current <= 0) {
          // ✅ 安全：添加组件也不会影响当前迭代
          entity.addComponent(new Dead());
        }
      }
    }
  }
}
```

框架会在每次 `process`/`lateProcess` 调用前创建实体列表的快照，确保迭代过程中的组件变化不会导致跳过实体或重复处理。

## 命令缓冲区 (CommandBuffer)

> **v2.3.0+**

CommandBuffer 提供了一种延迟执行实体操作的机制。当你需要在迭代过程中销毁实体或进行其他可能影响迭代的操作时，使用 CommandBuffer 可以将这些操作推迟到帧末统一执行。

### 基本用法

每个 EntitySystem 都内置了 `commands` 属性：

```typescript
@ECSSystem('Damage')
class DamageSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Health, DamageReceiver));
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      const damage = entity.getComponent(DamageReceiver);

      if (health && damage) {
        health.current -= damage.amount;

        // 使用命令缓冲区延迟移除组件
        this.commands.removeComponent(entity, DamageReceiver);

        if (health.current <= 0) {
          // 延迟添加死亡标记
          this.commands.addComponent(entity, new Dead());
          // 延迟销毁实体
          this.commands.destroyEntity(entity);
        }
      }
    }
  }
}
```

### 支持的命令

| 方法 | 说明 |
|------|------|
| `addComponent(entity, component)` | 延迟添加组件 |
| `removeComponent(entity, ComponentType)` | 延迟移除组件 |
| `destroyEntity(entity)` | 延迟销毁实体 |
| `setEntityActive(entity, active)` | 延迟设置实体激活状态 |

### 执行时机

命令缓冲区中的命令会在每帧的 `lateUpdate` 阶段之后自动执行。执行顺序与命令入队顺序一致。

```
场景更新流程:
1. onBegin()
2. process()
3. lateProcess()
4. onEnd()
5. flushCommandBuffers()  <-- 命令在这里执行
```

### 使用场景

CommandBuffer 适用于以下场景：

1. **在迭代中销毁实体**：避免修改正在遍历的集合
2. **批量延迟操作**：将多个操作合并到帧末执行
3. **跨系统协调**：一个系统标记，另一个系统响应

```typescript
// 示例：敌人死亡系统
@ECSSystem('EnemyDeath')
class EnemyDeathSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Enemy, Health));
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      if (health && health.current <= 0) {
        // 播放死亡动画、掉落物品等
        this.spawnLoot(entity);

        // 延迟销毁，不影响当前迭代
        this.commands.destroyEntity(entity);
      }
    }
  }

  private spawnLoot(entity: Entity): void {
    // 掉落物品逻辑
  }
}
```

### 注意事项

- 命令会跳过已销毁的实体（安全检查）
- 单个命令执行失败不会影响其他命令
- 命令按入队顺序执行
- 每次 `flush()` 后命令队列会清空

## 系统属性和方法

### 重要属性

```typescript
@ECSSystem('Example')
class ExampleSystem extends EntitySystem {
  showSystemInfo(): void {
    console.log(`系统名称: ${this.systemName}`);        // 系统名称
    console.log(`更新顺序: ${this.updateOrder}`);       // 更新时序
    console.log(`是否启用: ${this.enabled}`);            // 启用状态
    console.log(`实体数量: ${this.entities.length}`);   // 匹配的实体数量
    console.log(`所属场景: ${this.scene?.name}`);        // 所属场景
  }
}
```

### 实体访问

```typescript
protected process(entities: readonly Entity[]): void {
  // 方式1：使用参数中的实体列表
  for (const entity of entities) {
    // 处理实体
  }

  // 方式2：使用 this.entities 属性（与参数相同）
  for (const entity of this.entities) {
    // 处理实体
  }
}
```

### 控制系统执行

```typescript
@ECSSystem('Conditional')
class ConditionalSystem extends EntitySystem {
  private shouldProcess = true;

  protected onCheckProcessing(): boolean {
    // 返回 false 时跳过本次处理
    return this.shouldProcess && this.entities.length > 0;
  }

  public pause(): void {
    this.shouldProcess = false;
  }

  public resume(): void {
    this.shouldProcess = true;
  }
}
```

## 事件系统集成

系统可以方便地监听和发送事件：

```typescript
@ECSSystem('GameLogic')
class GameLogicSystem extends EntitySystem {
  protected onInitialize(): void {
    // 添加事件监听器（系统销毁时自动清理）
    this.addEventListener('player_died', this.onPlayerDied.bind(this));
    this.addEventListener('level_complete', this.onLevelComplete.bind(this));
  }

  private onPlayerDied(data: any): void {
    console.log('玩家死亡，重新开始游戏');
    // 处理玩家死亡逻辑
  }

  private onLevelComplete(data: any): void {
    console.log('关卡完成，加载下一关');
    // 处理关卡完成逻辑
  }

  protected process(entities: readonly Entity[]): void {
    // 在处理过程中发送事件
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      if (health && health.current <= 0) {
        this.scene?.eventSystem.emitSync('entity_died', { entity });
      }
    }
  }
}
```

## 性能监控

系统内置了性能监控功能：

```typescript
@ECSSystem('Performance')
class PerformanceSystem extends EntitySystem {
  protected onEnd(): void {
    // 获取性能数据
    const perfData = this.getPerformanceData();
    if (perfData) {
      console.log(`执行时间: ${perfData.executionTime.toFixed(2)}ms`);
    }

    // 获取性能统计
    const stats = this.getPerformanceStats();
    if (stats) {
      console.log(`平均执行时间: ${stats.averageTime.toFixed(2)}ms`);
    }
  }

  public resetPerformance(): void {
    this.resetPerformanceData();
  }
}
```

## 系统管理

### 添加系统到场景

框架提供了两种方式添加系统：传入实例或传入类型（自动依赖注入）。

```typescript
// 在场景子类中添加系统
class GameScene extends Scene {
  protected initialize(): void {
    // 方式1：传入实例
    this.addSystem(new MovementSystem());
    this.addSystem(new RenderSystem());

    // 方式2：传入类型（自动依赖注入）
    this.addEntityProcessor(PhysicsSystem);

    // 设置系统更新顺序
    const movementSystem = this.getSystem(MovementSystem);
    if (movementSystem) {
      movementSystem.updateOrder = 1;
    }
  }
}
```

### 系统依赖注入

系统实现了 `IService` 接口，支持通过依赖注入获取其他服务或系统：

```typescript
import { ECSSystem, Injectable, Inject } from '@esengine/esengine';

@Injectable()
@ECSSystem('Physics')
class PhysicsSystem extends EntitySystem {
  constructor(
    @Inject(CollisionService) private collision: CollisionService
  ) {
    super(Matcher.all(Transform, RigidBody));
  }

  protected process(entities: readonly Entity[]): void {
    // 使用注入的服务
    this.collision.detectCollisions(entities);
  }

  // 实现 IService 接口的 dispose 方法
  public dispose(): void {
    // 清理资源
  }
}

// 使用时传入类型即可，框架会自动注入依赖
class GameScene extends Scene {
  protected initialize(): void {
    // 自动依赖注入
    this.addEntityProcessor(PhysicsSystem);
  }
}
```

注意事项：
- 使用 `@Injectable()` 装饰器标记需要依赖注入的系统
- 在构造函数参数中使用 `@Inject()` 装饰器声明依赖
- 系统必须实现 `dispose()` 方法（IService 接口要求）
- 使用 `addEntityProcessor(类型)` 而不是 `addSystem(new 类型())` 来启用依赖注入

### 系统更新顺序

系统的执行顺序由 `updateOrder` 属性决定，数值越小越先执行：

```typescript
@ECSSystem('Input')
class InputSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(InputComponent));
    this.updateOrder = -100; // 输入系统优先执行
  }
}

@ECSSystem('Physics')
class PhysicsSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(RigidBody));
    this.updateOrder = 0; // 默认顺序
  }
}

@ECSSystem('Render')
class RenderSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Sprite, Transform));
    this.updateOrder = 100; // 渲染系统最后执行
  }
}
```

#### 稳定排序：addOrder

当多个系统的 `updateOrder` 相同时，框架使用 `addOrder`（添加顺序）作为第二排序条件，确保排序结果稳定可预测：

```typescript
// 这两个系统 updateOrder 都是默认值 0
@ECSSystem('SystemA')
class SystemA extends EntitySystem { /* ... */ }

@ECSSystem('SystemB')
class SystemB extends EntitySystem { /* ... */ }

// 添加顺序决定了执行顺序
scene.addSystem(new SystemA()); // addOrder = 0，先执行
scene.addSystem(new SystemB()); // addOrder = 1，后执行
```

> **注意**：`addOrder` 由框架在 `addSystem` 时自动设置，无需手动管理。这确保了相同 `updateOrder` 的系统按照添加顺序执行，避免了排序不稳定导致的随机行为。

## 复杂系统示例

### 碰撞检测系统

```typescript
@ECSSystem('Collision')
class CollisionSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Transform, Collider));
  }

  protected process(entities: readonly Entity[]): void {
    // 简单的 n² 碰撞检测
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        this.checkCollision(entities[i], entities[j]);
      }
    }
  }

  private checkCollision(entityA: Entity, entityB: Entity): void {
    const transformA = entityA.getComponent(Transform);
    const transformB = entityB.getComponent(Transform);
    const colliderA = entityA.getComponent(Collider);
    const colliderB = entityB.getComponent(Collider);

    if (this.isColliding(transformA, colliderA, transformB, colliderB)) {
      // 发送碰撞事件
      this.scene?.eventSystem.emitSync('collision', {
        entityA,
        entityB
      });
    }
  }

  private isColliding(transformA: Transform, colliderA: Collider,
                     transformB: Transform, colliderB: Collider): boolean {
    // 碰撞检测逻辑
    return false; // 简化示例
  }
}
```

### 状态机系统

```typescript
@ECSSystem('StateMachine')
class StateMachineSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(StateMachine));
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const stateMachine = entity.getComponent(StateMachine);
      if (stateMachine) {
        stateMachine.updateTimer(Time.deltaTime);
        this.updateState(entity, stateMachine);
      }
    }
  }

  private updateState(entity: Entity, stateMachine: StateMachine): void {
    switch (stateMachine.currentState) {
      case EntityState.Idle:
        this.handleIdleState(entity, stateMachine);
        break;
      case EntityState.Moving:
        this.handleMovingState(entity, stateMachine);
        break;
      case EntityState.Attacking:
        this.handleAttackingState(entity, stateMachine);
        break;
    }
  }

  private handleIdleState(entity: Entity, stateMachine: StateMachine): void {
    // 空闲状态逻辑
  }

  private handleMovingState(entity: Entity, stateMachine: StateMachine): void {
    // 移动状态逻辑
  }

  private handleAttackingState(entity: Entity, stateMachine: StateMachine): void {
    // 攻击状态逻辑
  }
}
```

## 最佳实践

### 1. 系统单一职责

```typescript
// ✅ 好的系统设计 - 职责单一
@ECSSystem('Movement')
class MovementSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Position, Velocity));
  }
}

@ECSSystem('Rendering')
class RenderingSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Sprite, Transform));
  }
}

// ❌ 避免的系统设计 - 职责过多
@ECSSystem('GameSystem')
class GameSystem extends EntitySystem {
  // 一个系统处理移动、渲染、音效等多种逻辑
}
```

### 2. 使用 @ECSSystem 装饰器

`@ECSSystem` 是系统类必须使用的装饰器，它为系统提供类型标识和元数据管理。

#### 为什么必须使用

| 功能 | 说明 |
|------|------|
| **类型识别** | 提供稳定的系统名称，代码混淆后仍能正确识别 |
| **调试支持** | 在性能监控、日志和调试工具中显示可读的系统名称 |
| **系统管理** | 通过名称查找和管理系统 |
| **序列化支持** | 场景序列化时可以记录系统配置 |

#### 基本语法

```typescript
@ECSSystem(systemName: string)
```

- `systemName`: 系统的名称，建议使用描述性的名称

#### 使用示例

```typescript
// ✅ 正确的用法
@ECSSystem('Physics')
class PhysicsSystem extends EntitySystem {
  // 系统实现
}

// ✅ 推荐：使用描述性的名称
@ECSSystem('PlayerMovement')
class PlayerMovementSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Player, Position, Velocity));
  }
}

// ❌ 错误的用法 - 没有装饰器
class BadSystem extends EntitySystem {
  // 这样定义的系统可能在生产环境出现问题：
  // 1. 代码压缩后类名变化，无法正确识别
  // 2. 性能监控和调试工具显示不正确的名称
}
```

#### 系统名称的作用

```typescript
@ECSSystem('Combat')
class CombatSystem extends EntitySystem {
  protected onInitialize(): void {
    // 使用 systemName 属性访问系统名称
    console.log(`系统 ${this.systemName} 已初始化`);  // 输出: 系统 Combat 已初始化
  }
}

// 通过名称查找系统
const combat = scene.getSystemByName('Combat');

// 性能监控中会显示系统名称
const perfData = combatSystem.getPerformanceData();
console.log(`${combatSystem.systemName} 执行时间: ${perfData?.executionTime}ms`);
```

### 3. 合理的更新顺序

```typescript
// 按逻辑顺序设置系统的更新时序
@ECSSystem('Input')
class InputSystem extends EntitySystem {
  constructor() {
    super();
    this.updateOrder = -100; // 最先处理输入
  }
}

@ECSSystem('Logic')
class GameLogicSystem extends EntitySystem {
  constructor() {
    super();
    this.updateOrder = 0; // 处理游戏逻辑
  }
}

@ECSSystem('Render')
class RenderSystem extends EntitySystem {
  constructor() {
    super();
    this.updateOrder = 100; // 最后进行渲染
  }
}
```

### 4. 避免在系统间直接引用

```typescript
// ❌ 避免：系统间直接引用
@ECSSystem('Bad')
class BadSystem extends EntitySystem {
  private otherSystem: SomeOtherSystem; // 避免直接引用其他系统
}

// ✅ 推荐：通过事件系统通信
@ECSSystem('Good')
class GoodSystem extends EntitySystem {
  protected process(entities: readonly Entity[]): void {
    // 通过事件系统与其他系统通信
    this.scene?.eventSystem.emitSync('data_updated', { entities });
  }
}
```

### 5. 及时清理资源

```typescript
@ECSSystem('Resource')
class ResourceSystem extends EntitySystem {
  private resources: Map<string, any> = new Map();

  protected onDestroy(): void {
    // 清理资源
    for (const [key, resource] of this.resources) {
      if (resource.dispose) {
        resource.dispose();
      }
    }
    this.resources.clear();
  }
}
```

系统是 ECS 架构的逻辑处理核心，正确设计和使用系统能让你的游戏代码更加模块化、高效和易于维护。
