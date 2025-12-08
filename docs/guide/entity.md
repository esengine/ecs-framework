# 实体类

在 ECS 架构中，实体（Entity）是游戏世界中的基本对象。实体本身不包含游戏逻辑或数据，它只是一个容器，用来组合不同的组件来实现各种功能。

## 基本概念

实体是一个轻量级的对象，主要用于：
- 作为组件的容器
- 提供唯一标识（ID）
- 管理组件的生命周期

::: tip 关于父子层级关系
实体间的父子层级关系通过 `HierarchyComponent` 和 `HierarchySystem` 管理，而非 Entity 内置属性。这种设计遵循 ECS 组合原则 —— 只有需要层级关系的实体才添加此组件。

详见 [层级系统](./hierarchy.md) 文档。
:::

## 创建实体

**重要提示：实体必须通过场景创建，不支持手动创建！**

实体必须通过场景的 `createEntity()` 方法来创建，这样才能确保：
- 实体被正确添加到场景的实体管理系统中
- 实体被添加到查询系统中，供系统使用
- 实体获得正确的场景引用
- 触发相关的生命周期事件

```typescript
// 正确的方式：通过场景创建实体
const player = scene.createEntity("Player");

// ❌ 错误的方式：手动创建实体
// const entity = new Entity("MyEntity", 1); // 这样创建的实体系统无法管理
```

## 添加组件

实体通过添加组件来获得功能：

```typescript
import { Component, ECSComponent } from '@esengine/ecs-framework';

// 定义位置组件
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

// 定义健康组件
@ECSComponent('Health')
class Health extends Component {
  current: number = 100;
  max: number = 100;

  constructor(max: number = 100) {
    super();
    this.max = max;
    this.current = max;
  }
}

// 给实体添加组件
const player = scene.createEntity("Player");
player.addComponent(new Position(100, 200));
player.addComponent(new Health(150));
```

## 获取组件

```typescript
// 获取组件（传入组件类，不是实例）
const position = player.getComponent(Position);  // 返回 Position | null
const health = player.getComponent(Health);      // 返回 Health | null

// 检查组件是否存在
if (position) {
  console.log(`玩家位置: x=${position.x}, y=${position.y}`);
}

// 检查是否有某个组件
if (player.hasComponent(Position)) {
  console.log("玩家有位置组件");
}

// 获取所有组件实例（只读属性）
const allComponents = player.components;  // readonly Component[]

// 获取指定类型的所有组件（支持同类型多组件）
const allHealthComponents = player.getComponents(Health);  // Health[]

// 获取或创建组件（如果不存在则自动创建）
const position = player.getOrCreateComponent(Position, 0, 0);  // 传入构造参数
const health = player.getOrCreateComponent(Health, 100);       // 如果存在则返回现有的，不存在则创建新的
```

## 移除组件

```typescript
// 方式1：通过组件类型移除
const removedHealth = player.removeComponentByType(Health);
if (removedHealth) {
  console.log("健康组件已被移除");
}

// 方式2：通过组件实例移除
const healthComponent = player.getComponent(Health);
if (healthComponent) {
  player.removeComponent(healthComponent);
}

// 批量移除多种组件类型
const removedComponents = player.removeComponentsByTypes([Position, Health]);

// 检查组件是否被移除
if (!player.hasComponent(Health)) {
  console.log("健康组件已被移除");
}
```

## 实体查找

场景提供了多种方式来查找实体：

### 通过名称查找

```typescript
// 查找单个实体
const player = scene.findEntity("Player");
// 或使用别名方法
const player2 = scene.getEntityByName("Player");

if (player) {
  console.log("找到玩家实体");
}
```

### 通过 ID 查找

```typescript
// 通过实体 ID 查找
const entity = scene.findEntityById(123);
```

### 通过标签查找

实体支持标签系统，用于快速分类和查找：

```typescript
// 设置标签
player.tag = 1; // 玩家标签
enemy.tag = 2;  // 敌人标签

// 通过标签查找所有相关实体
const players = scene.findEntitiesByTag(1);
const enemies = scene.findEntitiesByTag(2);
// 或使用别名方法
const allPlayers = scene.getEntitiesByTag(1);
```


## 实体生命周期

```typescript
// 销毁实体
player.destroy();

// 检查实体是否已销毁
if (player.isDestroyed) {
  console.log("实体已被销毁");
}
```

## 实体事件

实体的组件变化会触发事件：

```typescript
// 监听组件添加事件
scene.eventSystem.on('component:added', (data) => {
  console.log('组件已添加:', data);
});

// 监听实体创建事件
scene.eventSystem.on('entity:created', (data) => {
  console.log('实体已创建:', data.entityName);
});
```

## 性能优化


### 批量创建实体

框架提供了高性能的批量创建方法：

```typescript
// 批量创建 100 个子弹实体（高性能版本）
const bullets = scene.createEntities(100, "Bullet");

// 为每个子弹添加组件
bullets.forEach((bullet, index) => {
  bullet.addComponent(new Position(Math.random() * 800, Math.random() * 600));
  bullet.addComponent(new Velocity(Math.random() * 100 - 50, Math.random() * 100 - 50));
});
```

`createEntities()` 方法会：
- 批量分配实体 ID
- 批量添加到实体列表
- 优化查询系统更新
- 减少系统缓存清理次数

## 最佳实践

### 1. 合理的组件粒度

```typescript
// 好的做法：功能单一的组件
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

// 避免：功能过于复杂的组件
@ECSComponent('Player')
class Player extends Component {
  // 避免在一个组件中包含太多不相关的属性
  x: number;
  y: number;
  health: number;
  inventory: Item[];
  skills: Skill[];
}
```

### 2. 使用装饰器

始终使用 `@ECSComponent` 装饰器：

```typescript
@ECSComponent('Transform')
class Transform extends Component {
  // 组件实现
}
```

### 3. 合理命名

```typescript
// 清晰的实体命名
const mainCharacter = scene.createEntity("MainCharacter");
const enemy1 = scene.createEntity("Goblin_001");
const collectible = scene.createEntity("HealthPotion");
```

### 4. 及时清理

```typescript
// 不再需要的实体应该及时销毁
if (enemy.getComponent(Health).current <= 0) {
  enemy.destroy();
}
```

## 调试实体

框架提供了调试功能来帮助开发：

```typescript
// 获取实体调试信息
const debugInfo = entity.getDebugInfo();
console.log('实体信息:', debugInfo);

// 列出实体的所有组件
entity.components.forEach(component => {
  console.log('组件:', component.constructor.name);
});
```

实体是 ECS 架构的核心概念之一，理解如何正确使用实体将帮助你构建高效、可维护的游戏代码。

## 下一步

- 了解 [层级系统](./hierarchy.md) 建立实体间的父子关系
- 了解 [组件系统](./component.md) 为实体添加功能
- 了解 [场景管理](./scene.md) 组织和管理实体