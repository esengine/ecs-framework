# 实体使用指南

本指南详细介绍 ECS Framework 中实体（Entity）的所有功能和使用方法。

## 实体概述

实体（Entity）是 ECS 架构中的核心概念之一，它作为组件的容器存在。实体本身不包含游戏逻辑，所有功能都通过添加不同的组件来实现。

### 实体的特点

- **轻量级容器**：实体只是组件的载体，不包含具体的游戏逻辑
- **唯一标识**：每个实体都有唯一的ID和名称
- **层次结构**：支持父子关系，可以构建复杂的实体层次
- **高性能查询**：基于位掩码的组件查询系统
- **生命周期管理**：完整的创建、更新、销毁流程

## 创建实体

### 基本创建方式

```typescript
import { Scene } from '@esengine/ecs-framework';

// 通过场景创建实体
const scene = new Scene();
const entity = scene.createEntity("Player");

console.log(entity.name); // "Player"
console.log(entity.id);   // 唯一的数字ID
```

### 批量创建实体（推荐）

```typescript
import { Scene } from '@esengine/ecs-framework';

const scene = new Scene();

// 批量创建1000个实体 - 高性能
const entities = scene.createEntities(1000, "Enemy");

// 批量配置
entities.forEach((entity, index) => {
    entity.tag = 2; // 敌人标签
    // 添加组件...
});
```

### 使用流式API创建

```typescript
import { Core } from '@esengine/ecs-framework';

// 使用ECS流式API
const entity = Core.ecsAPI
    ?.entity("Enemy")
    .withComponent(new PositionComponent(100, 200))
    .withComponent(new HealthComponent(50))
    .withTag(2)
    .build();
```

## 实体属性

### 基本属性

```typescript
// 实体名称 - 用于调试和标识
entity.name = "Player";

// 实体ID - 只读，场景内唯一
console.log(entity.id); // 例如: 1

// 标签 - 用于分类和快速查询
entity.tag = 1; // 玩家标签
entity.tag = 2; // 敌人标签

// 更新顺序 - 控制实体在系统中的处理优先级
entity.updateOrder = 0; // 数值越小优先级越高
```

### 状态控制

```typescript
// 启用状态 - 控制实体是否参与更新和处理
entity.enabled = true;  // 启用实体
entity.enabled = false; // 禁用实体

// 激活状态 - 控制实体及其子实体的活跃状态
entity.active = true;   // 激活实体
entity.active = false;  // 停用实体

// 检查层次结构中的激活状态
if (entity.activeInHierarchy) {
    // 实体在整个层次结构中都是激活的
}

// 检查销毁状态
if (entity.isDestroyed) {
    // 实体已被销毁
}
```

### 更新间隔

```typescript
// 控制实体更新频率
entity.updateInterval = 1; // 每帧更新
entity.updateInterval = 2; // 每2帧更新一次
entity.updateInterval = 5; // 每5帧更新一次
```

## 组件管理

### 添加组件

```typescript
// 创建并添加组件
const healthComponent = entity.addComponent(new HealthComponent(100));

// 使用工厂方法创建组件
const positionComponent = entity.createComponent(PositionComponent, 100, 200);

// 批量添加组件
const components = entity.addComponents([
    new PositionComponent(0, 0),
    new VelocityComponent(50, 0),
    new HealthComponent(100)
]);
```

### 获取组件

```typescript
// 获取单个组件
const health = entity.getComponent(HealthComponent);
if (health) {
    console.log(`当前生命值: ${health.currentHealth}`);
}

// 获取或创建组件（如果不存在则创建）
const position = entity.getOrCreateComponent(PositionComponent, 0, 0);

// 获取多个同类型组件（如果组件可以重复添加）
const allHealthComponents = entity.getComponents(HealthComponent);
```

### 检查组件

```typescript
// 检查是否拥有指定组件
if (entity.hasComponent(HealthComponent)) {
    // 实体拥有生命值组件
}

// 检查组件掩码（高性能）
const mask = entity.componentMask;
console.log(`组件掩码: ${mask.toString(2)}`);
```

### 移除组件

```typescript
// 移除指定组件实例
const healthComponent = entity.getComponent(HealthComponent);
if (healthComponent) {
    entity.removeComponent(healthComponent);
}

// 按类型移除组件
const removedHealth = entity.removeComponentByType(HealthComponent);

// 批量移除组件
const removedComponents = entity.removeComponentsByTypes([
    HealthComponent,
    VelocityComponent
]);

// 移除所有组件
entity.removeAllComponents();
```

## 层次结构管理

### 父子关系

```typescript
// 创建父子实体
const player = scene.createEntity("Player");
const weapon = scene.createEntity("Weapon");
const shield = scene.createEntity("Shield");

// 添加子实体
player.addChild(weapon);
player.addChild(shield);

// 获取父实体
console.log(weapon.parent === player); // true

// 获取所有子实体
const children = player.children;
console.log(children.length); // 2

// 获取子实体数量
console.log(player.childCount); // 2
```

### 查找子实体

```typescript
// 按名称查找子实体
const weapon = player.findChild("Weapon");

// 递归查找子实体
const deepChild = player.findChild("DeepChild", true);

// 按标签查找子实体
const enemies = player.findChildrenByTag(2); // 查找所有敌人标签的子实体

// 递归按标签查找
const allEnemies = player.findChildrenByTag(2, true);
```

### 层次结构操作

```typescript
// 移除子实体
const removed = player.removeChild(weapon);

// 移除所有子实体
player.removeAllChildren();

// 获取根实体
const root = weapon.getRoot();

// 检查祖先关系
if (player.isAncestorOf(weapon)) {
    // player 是 weapon 的祖先
}

// 检查后代关系
if (weapon.isDescendantOf(player)) {
    // weapon 是 player 的后代
}

// 获取实体在层次结构中的深度
const depth = weapon.getDepth(); // 从根实体开始计算的深度
```

### 遍历子实体

```typescript
// 遍历直接子实体
player.forEachChild((child, index) => {
    console.log(`子实体 ${index}: ${child.name}`);
});

// 递归遍历所有子实体
player.forEachChild((child, index) => {
    console.log(`子实体 ${index}: ${child.name} (深度: ${child.getDepth()})`);
}, true);
```

## 实体生命周期

### 更新循环

```typescript
// 手动更新实体（通常由场景自动调用）
entity.update();

// 实体会自动调用所有组件的update方法
class MyComponent extends Component {
    public update(): void {
        // 组件更新逻辑
    }
}
```

### 销毁实体

```typescript
// 销毁实体
entity.destroy();

// 检查是否已销毁
if (entity.isDestroyed) {
    console.log("实体已被销毁");
}

// 销毁实体时会自动：
// 1. 移除所有组件
// 2. 从父实体中移除
// 3. 销毁所有子实体
// 4. 从场景中移除
```

## 性能优化

### 组件缓存

```typescript
// 预热组件缓存（提高后续访问性能）
entity.warmUpComponentCache();

// 清理组件缓存
entity.cleanupComponentCache();

// 获取缓存统计信息
const cacheStats = entity.getComponentCacheStats();
console.log(`缓存命中率: ${cacheStats.cacheStats.hitRate}`);
console.log(`组件访问统计:`, cacheStats.accessStats);
```

### 批量操作

```typescript
// 批量添加组件（比单个添加更高效）
const components = entity.addComponents([
    new PositionComponent(0, 0),
    new VelocityComponent(50, 0),
    new HealthComponent(100)
]);

// 批量移除组件
const removed = entity.removeComponentsByTypes([
    HealthComponent,
    VelocityComponent
]);
```

## 调试和监控

### 调试信息

```typescript
// 获取详细的调试信息
const debugInfo = entity.getDebugInfo();
console.log("实体调试信息:", debugInfo);

// 调试信息包含：
// - 基本属性（名称、ID、状态等）
// - 组件信息（数量、类型、掩码等）
// - 层次结构信息（父子关系、深度等）
// - 性能统计（缓存命中率、访问统计等）
```

### 实体比较

```typescript
// 比较两个实体的优先级
const result = entity1.compareTo(entity2);
if (result < 0) {
    // entity1 优先级更高
} else if (result > 0) {
    // entity2 优先级更高
} else {
    // 优先级相同
}

// 实体的字符串表示
console.log(entity.toString()); // "Entity[Player:1]"
```

## 最佳实践

### 1. 合理使用标签

```typescript
// 定义标签常量
const Tags = {
    PLAYER: 1,
    ENEMY: 2,
    PROJECTILE: 3,
    PICKUP: 4
} as const;

// 使用标签进行分类
player.tag = Tags.PLAYER;
enemy.tag = Tags.ENEMY;
```

### 2. 优化更新顺序

```typescript
// 设置合理的更新顺序
player.updateOrder = 0;     // 玩家最先更新
enemy.updateOrder = 1;      // 敌人其次
projectile.updateOrder = 2; // 投射物最后
```

### 3. 合理使用层次结构

```typescript
// 创建复合实体
const tank = scene.createEntity("Tank");
const turret = scene.createEntity("Turret");
const barrel = scene.createEntity("Barrel");

// 建立层次关系
tank.addChild(turret);
turret.addChild(barrel);

// 这样可以通过控制父实体来影响整个层次结构
tank.active = false; // 整个坦克都会被停用
```

### 4. 组件缓存优化

```typescript
// 对于频繁访问的组件，预热缓存
entity.warmUpComponentCache();

// 定期清理不常用的缓存
setInterval(() => {
    entity.cleanupComponentCache();
}, 5000);
```

### 5. 避免内存泄漏

```typescript
// 确保正确销毁实体
if (entity.isDestroyed) {
    return; // 避免操作已销毁的实体
}

// 在适当的时候销毁不需要的实体
if (enemy.getComponent(HealthComponent)?.isDead()) {
    enemy.destroy();
}
```

## 常见问题

### Q: 实体可以在不同场景间移动吗？

A: 不可以。实体与场景紧密绑定，如果需要在场景间传递数据，应该序列化实体的组件数据，然后在新场景中重新创建。

### Q: 如何实现实体的位置、旋转、缩放？

A: 框架本身不提供这些属性，需要通过组件来实现：

```typescript
class TransformComponent extends Component {
    public position = { x: 0, y: 0 };
    public rotation = 0;
    public scale = { x: 1, y: 1 };
}

const transform = entity.addComponent(new TransformComponent());
transform.position.x = 100;
transform.rotation = Math.PI / 4;
```

### Q: 实体的更新顺序如何影响性能？

A: 更新顺序主要影响游戏逻辑的执行顺序，对性能影响较小。但合理的更新顺序可以避免一些逻辑问题，比如确保输入处理在移动之前执行。

### Q: 如何处理大量实体的性能问题？

A: 
1. 使用对象池重用实体
2. 合理使用组件缓存
3. 避免不必要的组件查询
4. 使用批量操作
5. 定期清理销毁的实体

```typescript
// 使用对象池
class EntityPool extends Pool<Entity> {
    protected createObject(): Entity {
        return scene.createEntity("PooledEntity");
    }
    
    protected resetObject(entity: Entity): void {
        entity.removeAllComponents();
        entity.active = true;
        entity.enabled = true;
    }
}
``` 