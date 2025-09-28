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
import { Component, ECSComponent } from '@esengine/ecs-framework';

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

### 组件装饰器

**必须使用 `@ECSComponent` 装饰器**，这确保了：
- 组件在代码混淆后仍能正确识别
- 提供稳定的类型名称用于序列化和调试
- 框架能正确管理组件注册

```typescript
// ✅ 正确的用法
@ECSComponent('Velocity')
class Velocity extends Component {
  dx: number = 0;
  dy: number = 0;
}

// ❌ 错误的用法 - 没有装饰器
class BadComponent extends Component {
  // 这样定义的组件可能在生产环境出现问题
}
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
    console.log(`组件 ${this.constructor.name} 被添加到实体 ${this.entity.name}`);
    this.resource = new SomeResource();
  }

  /**
   * 组件从实体移除时调用
   * 用于清理资源、断开引用等
   */
  onRemovedFromEntity(): void {
    console.log(`组件 ${this.constructor.name} 从实体 ${this.entity.name} 移除`);
    if (this.resource) {
      this.resource.cleanup();
      this.resource = null;
    }
  }
}
```

## 访问实体

组件可以通过 `this.entity` 访问其所属的实体：

```typescript
@ECSComponent('Damage')
class Damage extends Component {
  damage: number;

  constructor(damage: number) {
    super();
    this.damage = damage;
  }

  // 在组件方法中访问实体和其他组件
  applyDamage(): void {
    const health = this.entity.getComponent(Health);
    if (health) {
      health.takeDamage(this.damage);

      // 如果生命值为0，销毁实体
      if (health.isDead()) {
        this.entity.destroy();
      }
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

  showComponentInfo(): void {
    console.log(`组件ID: ${this.id}`);                    // 唯一的组件ID
    console.log(`所属实体: ${this.entity.name}`);          // 所属实体引用
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
// ✅ 好的组件设计 - 单一职责
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

// ❌ 避免的组件设计 - 职责过多
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

### 4. 避免在组件中存储实体引用

```typescript
// ❌ 避免：在组件中存储其他实体的引用
@ECSComponent('BadFollower')
class BadFollower extends Component {
  target: Entity; // 直接引用可能导致内存泄漏
}

// ✅ 推荐：存储实体ID，通过场景查找
@ECSComponent('Follower')
class Follower extends Component {
  targetId: number;
  followDistance: number = 50;

  constructor(targetId: number) {
    super();
    this.targetId = targetId;
  }

  getTarget(): Entity | null {
    return this.entity.scene?.findEntityById(this.targetId) || null;
  }
}
```

组件是 ECS 架构的数据载体，正确设计组件能让你的游戏代码更模块化、可维护和高性能。