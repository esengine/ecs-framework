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
import { EntitySystem, ECSSystem, Matcher } from '@esengine/ecs-framework';

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
```

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
    }
  }

  protected lateProcess(entities: readonly Entity[]): void {
    // 主处理之后的后期处理
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
import { ECSSystem, Injectable, Inject } from '@esengine/ecs-framework';

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

### 2. 使用装饰器

**必须使用 `@ECSSystem` 装饰器**：

```typescript
// ✅ 正确的用法
@ECSSystem('Physics')
class PhysicsSystem extends EntitySystem {
  // 系统实现
}

// ❌ 错误的用法 - 没有装饰器
class BadSystem extends EntitySystem {
  // 这样定义的系统可能在生产环境出现问题
}
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