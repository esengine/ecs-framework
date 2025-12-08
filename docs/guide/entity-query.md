# 实体查询系统

实体查询是 ECS 架构的核心功能之一。本指南将介绍如何使用 Matcher 和 QuerySystem 来查询和筛选实体。

## 核心概念

### Matcher - 查询条件描述符

Matcher 是一个链式 API,用于描述实体查询条件。它本身不执行查询,而是作为条件传递给 EntitySystem 或 QuerySystem。

### QuerySystem - 查询执行引擎

QuerySystem 负责实际执行查询,内部使用响应式查询机制自动优化性能。

## 在 EntitySystem 中使用 Matcher

这是最常见的使用方式。EntitySystem 通过 Matcher 自动筛选和处理符合条件的实体。

### 基础用法

```typescript
import { EntitySystem, Matcher, Entity, Component } from '@esengine/ecs-framework';

class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
}

class VelocityComponent extends Component {
    public vx: number = 0;
    public vy: number = 0;
}

class MovementSystem extends EntitySystem {
    constructor() {
        // 方式1: 使用 Matcher.empty().all()
        super(Matcher.empty().all(PositionComponent, VelocityComponent));

        // 方式2: 直接使用 Matcher.all() (等价)
        // super(Matcher.all(PositionComponent, VelocityComponent));
    }

    protected process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const pos = entity.getComponent(PositionComponent)!;
            const vel = entity.getComponent(VelocityComponent)!;

            pos.x += vel.vx;
            pos.y += vel.vy;
        }
    }
}

// 添加到场景
scene.addEntityProcessor(new MovementSystem());
```

### Matcher 链式 API

#### all() - 必须包含所有组件

```typescript
class HealthSystem extends EntitySystem {
    constructor() {
        // 实体必须同时拥有 Health 和 Position 组件
        super(Matcher.empty().all(HealthComponent, PositionComponent));
    }

    protected process(entities: readonly Entity[]): void {
        // 只处理同时拥有两个组件的实体
    }
}
```

#### any() - 至少包含一个组件

```typescript
class DamageableSystem extends EntitySystem {
    constructor() {
        // 实体至少拥有 Health 或 Shield 其中之一
        super(Matcher.any(HealthComponent, ShieldComponent));
    }

    protected process(entities: readonly Entity[]): void {
        // 处理拥有生命值或护盾的实体
    }
}
```

#### none() - 不能包含指定组件

```typescript
class AliveEntitySystem extends EntitySystem {
    constructor() {
        // 实体不能拥有 DeadTag 组件
        super(Matcher.all(HealthComponent).none(DeadTag));
    }

    protected process(entities: readonly Entity[]): void {
        // 只处理活着的实体
    }
}
```

#### 组合条件

```typescript
class CombatSystem extends EntitySystem {
    constructor() {
        super(
            Matcher.empty()
                .all(PositionComponent, HealthComponent)  // 必须有位置和生命
                .any(WeaponComponent, MagicComponent)      // 至少有武器或魔法
                .none(DeadTag, FrozenTag)                  // 不能是死亡或冰冻状态
        );
    }

    protected process(entities: readonly Entity[]): void {
        // 处理可以战斗的活着的实体
    }
}
```

#### nothing() - 不匹配任何实体

用于创建只需要生命周期方法（`onBegin`、`onEnd`）但不需要处理实体的系统。

```typescript
class FrameTimerSystem extends EntitySystem {
    constructor() {
        // 不匹配任何实体
        super(Matcher.nothing());
    }

    protected onBegin(): void {
        // 每帧开始时执行
        Performance.markFrameStart();
    }

    protected process(entities: readonly Entity[]): void {
        // 永远不会被调用，因为没有匹配的实体
    }

    protected onEnd(): void {
        // 每帧结束时执行
        Performance.markFrameEnd();
    }
}
```

#### empty() vs nothing() 的区别

| 方法 | 行为 | 使用场景 |
|------|------|----------|
| `Matcher.empty()` | 匹配**所有**实体 | 需要处理场景中所有实体 |
| `Matcher.nothing()` | 不匹配**任何**实体 | 只需要生命周期回调，不处理实体 |

```typescript
// empty() - 返回场景中的所有实体
class AllEntitiesSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty());
    }

    protected process(entities: readonly Entity[]): void {
        // entities 包含场景中的所有实体
        console.log(`场景中共有 ${entities.length} 个实体`);
    }
}

// nothing() - 不返回任何实体
class NoEntitiesSystem extends EntitySystem {
    constructor() {
        super(Matcher.nothing());
    }

    protected process(entities: readonly Entity[]): void {
        // entities 永远是空数组，此方法不会被调用
    }
}
```

### 按标签查询

```typescript
class PlayerSystem extends EntitySystem {
    constructor() {
        // 查询特定标签的实体
        super(Matcher.empty().withTag(Tags.PLAYER));
    }

    protected process(entities: readonly Entity[]): void {
        // 只处理玩家实体
    }
}
```

### 按名称查询

```typescript
class BossSystem extends EntitySystem {
    constructor() {
        // 查询特定名称的实体
        super(Matcher.empty().withName('Boss'));
    }

    protected process(entities: readonly Entity[]): void {
        // 只处理名为 'Boss' 的实体
    }
}
```

## 直接使用 QuerySystem

如果不需要创建系统,可以直接使用 Scene 的 querySystem 进行查询。

### 基础查询方法

```typescript
// 获取场景的查询系统
const querySystem = scene.querySystem;

// 查询拥有所有指定组件的实体
const result1 = querySystem.queryAll(PositionComponent, VelocityComponent);
console.log(`找到 ${result1.count} 个移动实体`);
console.log(`查询耗时: ${result1.executionTime.toFixed(2)}ms`);

// 查询拥有任意指定组件的实体
const result2 = querySystem.queryAny(WeaponComponent, MagicComponent);
console.log(`找到 ${result2.count} 个战斗单位`);

// 查询不包含指定组件的实体
const result3 = querySystem.queryNone(DeadTag);
console.log(`找到 ${result3.count} 个活着的实体`);
```

### 按标签查询

```typescript
const playerResult = querySystem.queryByTag(Tags.PLAYER);
for (const player of playerResult.entities) {
    console.log('玩家:', player.name);
}
```

### 按名称查询

```typescript
const bossResult = querySystem.queryByName('Boss');
if (bossResult.count > 0) {
    const boss = bossResult.entities[0];
    console.log('找到Boss:', boss);
}
```

### 按单个组件查询

```typescript
const healthResult = querySystem.queryByComponent(HealthComponent);
console.log(`有 ${healthResult.count} 个实体拥有生命值`);
```

## 性能优化

### 自动缓存

QuerySystem 内部使用响应式查询自动缓存结果,相同的查询条件会直接使用缓存:

```typescript
// 第一次查询,执行实际查询
const result1 = querySystem.queryAll(PositionComponent);
console.log('fromCache:', result1.fromCache); // false

// 第二次相同查询,使用缓存
const result2 = querySystem.queryAll(PositionComponent);
console.log('fromCache:', result2.fromCache); // true
```

### 实体变化自动更新

当实体添加/移除组件时,查询缓存会自动更新:

```typescript
// 查询拥有武器的实体
const before = querySystem.queryAll(WeaponComponent);
console.log('之前:', before.count); // 假设为 5

// 给实体添加武器
const enemy = scene.createEntity('Enemy');
enemy.addComponent(new WeaponComponent());

// 再次查询,自动包含新实体
const after = querySystem.queryAll(WeaponComponent);
console.log('之后:', after.count); // 现在是 6
```

### 查询性能统计

```typescript
const stats = querySystem.getStats();
console.log('总查询次数:', stats.queryStats.totalQueries);
console.log('缓存命中率:', stats.queryStats.cacheHitRate);
console.log('缓存大小:', stats.cacheStats.size);
```

## 实际应用场景

### 场景1: 物理系统

```typescript
class PhysicsSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(TransformComponent, RigidbodyComponent));
    }

    protected process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const transform = entity.getComponent(TransformComponent)!;
            const rigidbody = entity.getComponent(RigidbodyComponent)!;

            // 应用重力
            rigidbody.velocity.y -= 9.8 * Time.deltaTime;

            // 更新位置
            transform.position.x += rigidbody.velocity.x * Time.deltaTime;
            transform.position.y += rigidbody.velocity.y * Time.deltaTime;
        }
    }
}
```

### 场景2: 渲染系统

```typescript
class RenderSystem extends EntitySystem {
    constructor() {
        super(
            Matcher.empty()
                .all(TransformComponent, SpriteComponent)
                .none(InvisibleTag)  // 排除不可见实体
        );
    }

    protected process(entities: readonly Entity[]): void {
        // 按 z-order 排序
        const sorted = entities.slice().sort((a, b) => {
            const zA = a.getComponent(TransformComponent)!.z;
            const zB = b.getComponent(TransformComponent)!.z;
            return zA - zB;
        });

        // 渲染实体
        for (const entity of sorted) {
            const transform = entity.getComponent(TransformComponent)!;
            const sprite = entity.getComponent(SpriteComponent)!;

            renderer.drawSprite(sprite.texture, transform.position);
        }
    }
}
```

### 场景3: 碰撞检测

```typescript
class CollisionSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(TransformComponent, ColliderComponent));
    }

    protected process(entities: readonly Entity[]): void {
        // 简单的 O(n²) 碰撞检测
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                this.checkCollision(entities[i], entities[j]);
            }
        }
    }

    private checkCollision(a: Entity, b: Entity): void {
        const transA = a.getComponent(TransformComponent)!;
        const transB = b.getComponent(TransformComponent)!;
        const colliderA = a.getComponent(ColliderComponent)!;
        const colliderB = b.getComponent(ColliderComponent)!;

        if (this.isOverlapping(transA, colliderA, transB, colliderB)) {
            // 触发碰撞事件
            scene.eventSystem.emit('collision', { entityA: a, entityB: b });
        }
    }

    private isOverlapping(...args: any[]): boolean {
        // 碰撞检测逻辑
        return false;
    }
}
```

### 场景4: 一次性查询

```typescript
// 在系统外部执行一次性查询
class GameManager {
    private scene: Scene;

    public countEnemies(): number {
        const result = this.scene.querySystem.queryByTag(Tags.ENEMY);
        return result.count;
    }

    public findNearestEnemy(playerPos: Vector2): Entity | null {
        const enemies = this.scene.querySystem.queryByTag(Tags.ENEMY);

        let nearest: Entity | null = null;
        let minDistance = Infinity;

        for (const enemy of enemies.entities) {
            const transform = enemy.getComponent(TransformComponent);
            if (!transform) continue;

            const distance = Vector2.distance(playerPos, transform.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        }

        return nearest;
    }
}
```

## 最佳实践

### 1. 优先使用 EntitySystem

```typescript
// 推荐: 使用 EntitySystem
class GoodSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }

    protected process(entities: readonly Entity[]): void {
        // 自动获得符合条件的实体,每帧自动更新
    }
}

// 不推荐: 在 update 中手动查询
class BadSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty());
    }

    protected process(entities: readonly Entity[]): void {
        // 每帧手动查询,浪费性能
        const result = this.scene!.querySystem.queryAll(HealthComponent);
        for (const entity of result.entities) {
            // ...
        }
    }
}
```

### 2. 合理使用 none() 排除条件

```typescript
// 排除已死亡的敌人
class EnemyAISystem extends EntitySystem {
    constructor() {
        super(
            Matcher.empty()
                .all(EnemyTag, AIComponent)
                .none(DeadTag)  // 不处理死亡的敌人
        );
    }
}
```

### 3. 使用标签优化查询

```typescript
// 不好: 查询所有实体再过滤
const allEntities = scene.querySystem.getAllEntities();
const players = allEntities.filter(e => e.hasComponent(PlayerTag));

// 好: 直接按标签查询
const players = scene.querySystem.queryByTag(Tags.PLAYER).entities;
```

### 4. 避免过于复杂的查询条件

```typescript
// 不推荐: 过于复杂
super(
    Matcher.empty()
        .all(A, B, C, D)
        .any(E, F, G)
        .none(H, I, J)
);

// 推荐: 拆分成多个简单系统
class SystemAB extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(A, B));
    }
}

class SystemCD extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(C, D));
    }
}
```

## 注意事项

### 1. 查询结果是只读的

```typescript
const result = querySystem.queryAll(PositionComponent);

// 不要修改返回的数组
result.entities.push(someEntity);  // 错误!

// 如果需要修改,先复制
const mutableArray = [...result.entities];
mutableArray.push(someEntity);  // 正确
```

### 2. 组件添加/移除后的查询时机

```typescript
// 创建实体并添加组件
const entity = scene.createEntity('Player');
entity.addComponent(new PositionComponent());

// 立即查询可能获取到新实体
const result = scene.querySystem.queryAll(PositionComponent);
// result.entities 包含新创建的实体
```

### 3. Matcher 是不可变的

```typescript
const matcher = Matcher.empty().all(PositionComponent);

// 链式调用返回新的 Matcher 实例
const matcher2 = matcher.any(VelocityComponent);

// matcher 本身不变
console.log(matcher === matcher2); // false
```

## Matcher API 快速参考

### 静态创建方法

| 方法 | 说明 | 示例 |
|------|------|------|
| `Matcher.all(...types)` | 必须包含所有指定组件 | `Matcher.all(Position, Velocity)` |
| `Matcher.any(...types)` | 至少包含一个指定组件 | `Matcher.any(Health, Shield)` |
| `Matcher.none(...types)` | 不能包含任何指定组件 | `Matcher.none(Dead)` |
| `Matcher.byTag(tag)` | 按标签查询 | `Matcher.byTag(1)` |
| `Matcher.byName(name)` | 按名称查询 | `Matcher.byName("Player")` |
| `Matcher.byComponent(type)` | 按单个组件查询 | `Matcher.byComponent(Health)` |
| `Matcher.empty()` | 创建空匹配器（匹配所有实体） | `Matcher.empty()` |
| `Matcher.nothing()` | 不匹配任何实体 | `Matcher.nothing()` |
| `Matcher.complex()` | 创建复杂查询构建器 | `Matcher.complex()` |

### 链式方法

| 方法 | 说明 | 示例 |
|------|------|------|
| `.all(...types)` | 添加必须包含的组件 | `.all(Position)` |
| `.any(...types)` | 添加可选组件（至少一个） | `.any(Weapon, Magic)` |
| `.none(...types)` | 添加排除的组件 | `.none(Dead)` |
| `.exclude(...types)` | `.none()` 的别名 | `.exclude(Disabled)` |
| `.one(...types)` | `.any()` 的别名 | `.one(Player, Enemy)` |
| `.withTag(tag)` | 添加标签条件 | `.withTag(1)` |
| `.withName(name)` | 添加名称条件 | `.withName("Boss")` |
| `.withComponent(type)` | 添加单组件条件 | `.withComponent(Health)` |

### 实用方法

| 方法 | 说明 |
|------|------|
| `.getCondition()` | 获取查询条件（只读） |
| `.isEmpty()` | 检查是否为空条件 |
| `.isNothing()` | 检查是否为 nothing 匹配器 |
| `.clone()` | 克隆匹配器 |
| `.reset()` | 重置所有条件 |
| `.toString()` | 获取字符串表示 |

### 常用组合示例

```typescript
// 基础移动系统
Matcher.all(Position, Velocity)

// 可攻击的活着的实体
Matcher.all(Position, Health)
    .any(Weapon, Magic)
    .none(Dead, Disabled)

// 所有带标签的敌人
Matcher.byTag(Tags.ENEMY)
    .all(AIComponent)

// 只需要生命周期的系统
Matcher.nothing()
```

## 相关 API

- [Matcher](../api/classes/Matcher.md) - 查询条件描述符 API 参考
- [QuerySystem](../api/classes/QuerySystem.md) - 查询系统 API 参考
- [EntitySystem](../api/classes/EntitySystem.md) - 实体系统 API 参考
- [Entity](../api/classes/Entity.md) - 实体 API 参考
