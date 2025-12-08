# 组件系统

在 ECS 架构中，组件（Component）是数据和行为的载体。组件定义了实体具有的属性和功能，是 ECS 架构的核心构建块。

## 基本概念

组件是继承自 `Component` 抽象基类的具体类，用于：
- 存储实体的数据（如位置、速度、健康值等）
- 定义与数据相关的行为方法
- 提供生命周期回调钩子
- 支持序列化和调试

## 创建组件

### 基础组件定义

```typescript
import { Component, ECSComponent } from '@esengine/esengine';

@ECSComponent('Position')
class Position extends Component {
  x: number = 0;
  y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    super();
    this.x = x;
    this.y = y;
  }
}

@ECSComponent('Health')
class Health extends Component {
  current: number;
  max: number;

  constructor(max: number = 100) {
    super();
    this.max = max;
    this.current = max;
  }

  // 组件可以包含行为方法
  takeDamage(damage: number): void {
    this.current = Math.max(0, this.current - damage);
  }

  heal(amount: number): void {
    this.current = Math.min(this.max, this.current + amount);
  }

  isDead(): boolean {
    return this.current <= 0;
  }
}
```

### @ECSComponent 装饰器

`@ECSComponent` 是组件类必须使用的装饰器，它为组件提供了类型标识和元数据管理。

#### 为什么必须使用

| 功能 | 说明 |
|------|------|
| **类型识别** | 提供稳定的类型名称，代码混淆后仍能正确识别 |
| **序列化支持** | 序列化/反序列化时使用该名称作为类型标识 |
| **组件注册** | 自动注册到 ComponentRegistry，分配唯一的位掩码 |
| **调试支持** | 在调试工具和日志中显示可读的组件名称 |

#### 基本语法

```typescript
@ECSComponent(typeName: string)
```

- `typeName`: 组件的类型名称，建议使用与类名相同或相近的名称

#### 使用示例

```typescript
// ✅ 正确的用法
@ECSComponent('Velocity')
class Velocity extends Component {
  dx: number = 0;
  dy: number = 0;
}

// ✅ 推荐：类型名与类名保持一致
@ECSComponent('PlayerController')
class PlayerController extends Component {
  speed: number = 5;
}

// ❌ 错误的用法 - 没有装饰器
class BadComponent extends Component {
  // 这样定义的组件可能在生产环境出现问题：
  // 1. 代码压缩后类名变化，无法正确序列化
  // 2. 组件未注册到框架，查询和匹配可能失效
}
```

#### 与 @Serializable 配合使用

当组件需要支持序列化时，`@ECSComponent` 和 `@Serializable` 需要一起使用：

```typescript
import { Component, ECSComponent, Serializable, Serialize } from '@esengine/esengine';

@ECSComponent('Player')
@Serializable({ version: 1 })
class PlayerComponent extends Component {
  @Serialize()
  name: string = '';

  @Serialize()
  level: number = 1;

  // 不使用 @Serialize() 的字段不会被序列化
  private _cachedData: any = null;
}
```

> **注意**：`@ECSComponent` 的 `typeName` 和 `@Serializable` 的 `typeId` 可以不同。如果 `@Serializable` 没有指定 `typeId`，则默认使用 `@ECSComponent` 的 `typeName`。

#### 组件类型名的唯一性

每个组件的类型名应该是唯一的：

```typescript
// ❌ 错误：两个组件使用相同的类型名
@ECSComponent('Health')
class HealthComponent extends Component { }

@ECSComponent('Health')  // 冲突！
class EnemyHealthComponent extends Component { }

// ✅ 正确：使用不同的类型名
@ECSComponent('PlayerHealth')
class PlayerHealthComponent extends Component { }

@ECSComponent('EnemyHealth')
class EnemyHealthComponent extends Component { }
```

## 组件生命周期

组件提供了生命周期钩子，可以重写来执行特定的逻辑：

```typescript
@ECSComponent('ExampleComponent')
class ExampleComponent extends Component {
  private resource: SomeResource | null = null;

  /**
   * 组件被添加到实体时调用
   * 用于初始化资源、建立引用等
   */
  onAddedToEntity(): void {
    console.log(`组件 ${this.constructor.name} 已添加，实体ID: ${this.entityId}`);
    this.resource = new SomeResource();
  }

  /**
   * 组件从实体移除时调用
   * 用于清理资源、断开引用等
   */
  onRemovedFromEntity(): void {
    console.log(`组件 ${this.constructor.name} 已移除`);
    if (this.resource) {
      this.resource.cleanup();
      this.resource = null;
    }
  }
}
```

## 组件与实体的关系

组件存储了所属实体的ID (`entityId`)，而不是直接引用实体对象。这是ECS数据导向设计的体现，避免了循环引用。

在实际使用中，**应该在 System 中处理实体和组件的交互**，而不是在组件内部：

```typescript
@ECSComponent('Health')
class Health extends Component {
  current: number;
  max: number;

  constructor(max: number = 100) {
    super();
    this.max = max;
    this.current = max;
  }

  isDead(): boolean {
    return this.current <= 0;
  }
}

@ECSComponent('Damage')
class Damage extends Component {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }
}

// 推荐：在 System 中处理逻辑
class DamageSystem extends EntitySystem {
  constructor() {
    super(new Matcher().all(Health, Damage));
  }

  process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const health = entity.getComponent(Health)!;
      const damage = entity.getComponent(Damage)!;

      health.current -= damage.value;

      if (health.isDead()) {
        entity.destroy();
      }

      // 应用伤害后移除 Damage 组件
      entity.removeComponent(damage);
    }
  }
}
```

## 组件属性

每个组件都有一些内置属性：

```typescript
@ECSComponent('ExampleComponent')
class ExampleComponent extends Component {
  someData: string = "example";

  onAddedToEntity(): void {
    console.log(`组件ID: ${this.id}`);           // 唯一的组件ID
    console.log(`所属实体ID: ${this.entityId}`); // 所属实体的ID
  }
}
```

如果需要访问实体对象，应该在 System 中进行：

```typescript
class ExampleSystem extends EntitySystem {
  constructor() {
    super(new Matcher().all(ExampleComponent));
  }

  process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const comp = entity.getComponent(ExampleComponent)!;
      console.log(`实体名称: ${entity.name}`);
      console.log(`组件数据: ${comp.someData}`);
    }
  }
}
```


## 复杂组件示例

### 状态机组件

```typescript
enum EntityState {
  Idle,
  Moving,
  Attacking,
  Dead
}

@ECSComponent('StateMachine')
class StateMachine extends Component {
  private _currentState: EntityState = EntityState.Idle;
  private _previousState: EntityState = EntityState.Idle;
  private _stateTimer: number = 0;

  get currentState(): EntityState {
    return this._currentState;
  }

  get previousState(): EntityState {
    return this._previousState;
  }

  get stateTimer(): number {
    return this._stateTimer;
  }

  changeState(newState: EntityState): void {
    if (this._currentState !== newState) {
      this._previousState = this._currentState;
      this._currentState = newState;
      this._stateTimer = 0;
    }
  }

  updateTimer(deltaTime: number): void {
    this._stateTimer += deltaTime;
  }

  isInState(state: EntityState): boolean {
    return this._currentState === state;
  }
}
```

### 配置数据组件

```typescript
interface WeaponData {
  damage: number;
  range: number;
  fireRate: number;
  ammo: number;
}

@ECSComponent('WeaponConfig')
class WeaponConfig extends Component {
  data: WeaponData;

  constructor(weaponData: WeaponData) {
    super();
    this.data = { ...weaponData }; // 深拷贝避免共享引用
  }

  // 提供便捷的访问方法
  getDamage(): number {
    return this.data.damage;
  }

  canFire(): boolean {
    return this.data.ammo > 0;
  }

  consumeAmmo(): boolean {
    if (this.data.ammo > 0) {
      this.data.ammo--;
      return true;
    }
    return false;
  }
}
```

## 最佳实践

### 1. 保持组件简单

```typescript
// 好的组件设计 - 单一职责
@ECSComponent('Position')
class Position extends Component {
  x: number = 0;
  y: number = 0;
}

@ECSComponent('Velocity')
class Velocity extends Component {
  dx: number = 0;
  dy: number = 0;
}

// 避免的组件设计 - 职责过多
@ECSComponent('GameObject')
class GameObject extends Component {
  x: number;
  y: number;
  dx: number;
  dy: number;
  health: number;
  damage: number;
  sprite: string;
  // 太多不相关的属性
}
```

### 2. 使用构造函数初始化

```typescript
@ECSComponent('Transform')
class Transform extends Component {
  x: number;
  y: number;
  rotation: number;
  scale: number;

  constructor(x = 0, y = 0, rotation = 0, scale = 1) {
    super();
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.scale = scale;
  }
}
```

### 3. 明确的类型定义

```typescript
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  type: 'weapon' | 'consumable' | 'misc';
}

@ECSComponent('Inventory')
class Inventory extends Component {
  items: InventoryItem[] = [];
  maxSlots: number;

  constructor(maxSlots: number = 20) {
    super();
    this.maxSlots = maxSlots;
  }

  addItem(item: InventoryItem): boolean {
    if (this.items.length < this.maxSlots) {
      this.items.push(item);
      return true;
    }
    return false;
  }

  removeItem(itemId: string): InventoryItem | null {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index !== -1) {
      return this.items.splice(index, 1)[0];
    }
    return null;
  }
}
```

### 4. 引用其他实体

当组件需要关联其他实体时（如父子关系、跟随目标等），**推荐方式是存储实体ID**，然后在 System 中查找：

```typescript
@ECSComponent('Follower')
class Follower extends Component {
  targetId: number;
  followDistance: number = 50;

  constructor(targetId: number) {
    super();
    this.targetId = targetId;
  }
}

// 在 System 中查找目标实体并处理逻辑
class FollowerSystem extends EntitySystem {
  constructor() {
    super(new Matcher().all(Follower, Position));
  }

  process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const follower = entity.getComponent(Follower)!;
      const position = entity.getComponent(Position)!;

      // 通过场景查找目标实体
      const target = entity.scene?.findEntityById(follower.targetId);
      if (target) {
        const targetPos = target.getComponent(Position);
        if (targetPos) {
          // 跟随逻辑
          const dx = targetPos.x - position.x;
          const dy = targetPos.y - position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > follower.followDistance) {
            // 移动靠近目标
          }
        }
      }
    }
  }
}
```

这种方式的优势：
- 组件保持简单，只存储基本数据类型
- 符合数据导向设计
- 在 System 中统一处理查找和逻辑
- 易于理解和维护

**避免在组件中直接存储实体引用**：

```typescript
// 错误示范：直接存储实体引用
@ECSComponent('BadFollower')
class BadFollower extends Component {
  target: Entity; // 实体销毁后仍持有引用，可能导致内存泄漏
}
```

## 高级特性

### EntityRef 装饰器 - 自动引用追踪

框架提供了 `@EntityRef` 装饰器用于**特殊场景**下安全地存储实体引用。这是一个高级特性,一般情况下推荐使用存储ID的方式。

#### 什么时候需要 EntityRef？

在以下场景中,`@EntityRef` 可以简化代码:

1. **父子关系**: 需要在组件中直接访问父实体或子实体
2. **复杂关联**: 实体之间有多个引用关系
3. **频繁访问**: 需要在多处访问引用的实体,使用ID查找会有性能开销

#### 核心特性

`@EntityRef` 装饰器通过 **ReferenceTracker** 自动追踪引用关系:

- 当被引用的实体销毁时,所有指向它的 `@EntityRef` 属性自动设为 `null`
- 防止跨场景引用(会输出警告并拒绝设置)
- 防止引用已销毁的实体(会输出警告并设为 `null`)
- 使用 WeakRef 避免内存泄漏(自动GC支持)
- 组件移除时自动清理引用注册

#### 基本用法

```typescript
import { Component, ECSComponent, EntityRef, Entity } from '@esengine/esengine';

@ECSComponent('Parent')
class ParentComponent extends Component {
  @EntityRef()
  parent: Entity | null = null;
}

// 使用示例
const scene = new Scene();
const parent = scene.createEntity('Parent');
const child = scene.createEntity('Child');

const comp = child.addComponent(new ParentComponent());
comp.parent = parent;

console.log(comp.parent); // Entity { name: 'Parent' }

// 当 parent 被销毁时，comp.parent 自动变为 null
parent.destroy();
console.log(comp.parent); // null
```

#### 多个引用属性

一个组件可以有多个 `@EntityRef` 属性:

```typescript
@ECSComponent('Combat')
class CombatComponent extends Component {
  @EntityRef()
  target: Entity | null = null;

  @EntityRef()
  ally: Entity | null = null;

  @EntityRef()
  lastAttacker: Entity | null = null;
}

// 使用示例
const player = scene.createEntity('Player');
const enemy = scene.createEntity('Enemy');
const npc = scene.createEntity('NPC');

const combat = player.addComponent(new CombatComponent());
combat.target = enemy;
combat.ally = npc;

// enemy 销毁后，只有 target 变为 null，ally 仍然有效
enemy.destroy();
console.log(combat.target); // null
console.log(combat.ally);   // Entity { name: 'NPC' }
```

#### 安全检查

`@EntityRef` 提供了多重安全检查:

```typescript
const scene1 = new Scene();
const scene2 = new Scene();

const entity1 = scene1.createEntity('Entity1');
const entity2 = scene2.createEntity('Entity2');

const comp = entity1.addComponent(new ParentComponent());

// 跨场景引用会失败
comp.parent = entity2; // 输出错误日志，comp.parent 为 null
console.log(comp.parent); // null

// 引用已销毁的实体会失败
const entity3 = scene1.createEntity('Entity3');
entity3.destroy();
comp.parent = entity3; // 输出警告日志，comp.parent 为 null
console.log(comp.parent); // null
```

#### 实现原理

`@EntityRef` 使用以下机制实现自动引用追踪:

1. **ReferenceTracker**: Scene 持有一个引用追踪器,记录所有实体引用关系
2. **WeakRef**: 使用弱引用存储组件,避免循环引用导致内存泄漏
3. **属性拦截**: 通过 `Object.defineProperty` 拦截 getter/setter
4. **自动清理**: 实体销毁时,ReferenceTracker 遍历所有引用并设为 null

```typescript
// 简化的实现原理
class ReferenceTracker {
  // entityId -> 引用该实体的所有组件记录
  private _references: Map<number, Set<{ component: WeakRef<Component>, propertyKey: string }>>;

  // 实体销毁时调用
  clearReferencesTo(entityId: number): void {
    const records = this._references.get(entityId);
    if (records) {
      for (const record of records) {
        const component = record.component.deref();
        if (component) {
          // 将组件的引用属性设为 null
          (component as any)[record.propertyKey] = null;
        }
      }
      this._references.delete(entityId);
    }
  }
}
```

#### 性能考虑

`@EntityRef` 会带来一些性能开销:

- **写入开销**: 每次设置引用时需要更新 ReferenceTracker
- **内存开销**: ReferenceTracker 需要维护引用映射表
- **销毁开销**: 实体销毁时需要遍历所有引用并清理

对于大多数场景,这些开销是可以接受的。但如果有**大量实体和频繁的引用变更**,存储ID可能更高效。

#### 最佳实践

```typescript
// 推荐：适合使用 @EntityRef 的场景 - 父子关系
@ECSComponent('Transform')
class Transform extends Component {
  @EntityRef()
  parent: Entity | null = null;

  position: { x: number, y: number } = { x: 0, y: 0 };

  // 可以直接访问父实体的组件
  getWorldPosition(): { x: number, y: number } {
    if (!this.parent) {
      return { ...this.position };
    }

    const parentTransform = this.parent.getComponent(Transform);
    if (parentTransform) {
      const parentPos = parentTransform.getWorldPosition();
      return {
        x: parentPos.x + this.position.x,
        y: parentPos.y + this.position.y
      };
    }

    return { ...this.position };
  }
}

// 不推荐：不适合使用 @EntityRef 的场景 - 大量动态目标
@ECSComponent('AITarget')
class AITarget extends Component {
  @EntityRef()
  target: Entity | null = null; // 如果目标频繁变化，用ID更好

  updateCooldown: number = 0;
}

// 推荐：这种场景用ID更好
@ECSComponent('AITarget')
class AITargetBetter extends Component {
  targetId: number | null = null; // 存储ID
  updateCooldown: number = 0;
}
```

#### 调试支持

ReferenceTracker 提供了调试接口:

```typescript
// 查看某个实体被哪些组件引用
const references = scene.referenceTracker.getReferencesTo(entity.id);
console.log(`实体 ${entity.name} 被 ${references.length} 个组件引用`);

// 获取完整的调试信息
const debugInfo = scene.referenceTracker.getDebugInfo();
console.log(debugInfo);
```

#### 总结

- **推荐做法**: 大部分情况使用存储ID + System查找的方式
- **EntityRef 适用场景**: 父子关系、复杂关联、组件内需要直接访问引用实体的场景
- **核心优势**: 自动清理、防止悬空引用、代码更简洁
- **注意事项**: 有性能开销,不适合大量动态引用的场景

组件是 ECS 架构的数据载体，正确设计组件能让你的游戏代码更模块化、可维护和高性能。