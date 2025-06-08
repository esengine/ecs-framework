# 核心概念

ECS Framework 基于 Entity-Component-System 架构模式，这是一种高度模块化和可扩展的游戏开发架构。本文档将详细介绍框架的核心概念。

## ECS 架构概述

ECS 架构将传统的面向对象设计分解为三个核心部分：

- **Entity（实体）** - 游戏世界中的对象，包含基本属性如位置、旋转、缩放
- **Component（组件）** - 包含数据和行为的功能模块
- **System（系统）** - 处理实体集合的逻辑处理单元

## Core（核心）

Core 是框架的核心管理类，负责游戏的生命周期管理。

### 创建和配置

```typescript
import { Core } from '@esengine/ecs-framework';

// 创建核心实例（调试模式）
const core = Core.create(true);

// 创建核心实例（发布模式）
const core = Core.create(false);
```

### 事件系统

```typescript
import { CoreEvents } from '@esengine/ecs-framework';

// 监听核心事件
Core.emitter.addObserver(CoreEvents.frameUpdated, this.onUpdate, this);

// 发送帧更新事件
Core.emitter.emit(CoreEvents.frameUpdated);

// 发送自定义事件
Core.emitter.emit("customEvent", { data: "value" });
```

### 定时器系统

```typescript
// 延迟执行
Core.schedule(2.0, false, this, (timer) => {
    console.log("2秒后执行");
});

// 重复执行
Core.schedule(1.0, true, this, (timer) => {
    console.log("每秒执行一次");
});
```

## Scene（场景）

场景是游戏世界的容器，管理实体和系统的生命周期。

### 创建和使用场景

```typescript
import { Scene } from '@esengine/ecs-framework';

// 创建场景
const scene = new Scene();
scene.name = "GameScene";

// 设置为当前场景
Core.scene = scene;

// 场景生命周期
scene.begin();  // 开始场景
scene.update(); // 更新场景
scene.end();    // 结束场景
```

### 批量实体管理

```typescript
// 批量创建实体 - 高性能
const entities = scene.createEntities(1000, "Enemy");

// 批量添加实体（延迟缓存清理）
entities.forEach(entity => {
    scene.addEntity(entity, false); // 延迟清理
});
scene.querySystem.clearCache(); // 手动清理缓存

// 获取性能统计
const stats = scene.getPerformanceStats();
console.log(`实体数量: ${stats.entityCount}`);
```

## Entity（实体）

实体是游戏世界中的基本对象，包含位置、旋转、缩放等基本属性。

### 实体的基本属性

```typescript
import { Vector2 } from '@esengine/ecs-framework';

const entity = scene.createEntity("MyEntity");

// 位置
entity.position = new Vector2(100, 200);
entity.position = entity.position.add(new Vector2(10, 0));

// 旋转（弧度）
entity.rotation = Math.PI / 4;

// 缩放
entity.scale = new Vector2(2, 2);

// 标签（用于分类）
entity.tag = 1;

// 启用状态
entity.enabled = true;

// 活跃状态
entity.active = true;

// 更新顺序
entity.updateOrder = 10;
```

### 实体层级关系

```typescript
// 添加子实体
const parent = scene.createEntity("Parent");
const child = scene.createEntity("Child");
parent.addChild(child);

// 获取父实体
const parentEntity = child.parent;

// 获取所有子实体
const children = parent.children;

// 查找子实体
const foundChild = parent.findChild("Child");

// 按标签查找子实体
const taggedChildren = parent.findChildrenByTag(1);

// 移除子实体
parent.removeChild(child);

// 移除所有子实体
parent.removeAllChildren();
```

### 实体生命周期

```typescript
// 检查实体是否被销毁
if (!entity.isDestroyed) {
    // 实体仍然有效
}

// 销毁实体
entity.destroy();

// 获取实体调试信息
const debugInfo = entity.getDebugInfo();
console.log(debugInfo);
```

## Component（组件）

组件包含数据和行为，定义了实体的特性和能力。

### 创建组件

```typescript
import { Component } from '@esengine/ecs-framework';

class HealthComponent extends Component {
    public maxHealth: number = 100;
    public currentHealth: number = 100;
    
    public takeDamage(damage: number) {
        this.currentHealth -= damage;
        if (this.currentHealth <= 0) {
            this.entity.destroy();
        }
    }
    
    public heal(amount: number) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }
}
```

### 组件生命周期

```typescript
class MyComponent extends Component {
    public onAddedToEntity() {
        // 组件被添加到实体时调用
        console.log("组件已添加到实体:", this.entity.name);
    }
    
    public onRemovedFromEntity() {
        // 组件从实体移除时调用
        console.log("组件已从实体移除");
    }
    
    public onEnabled() {
        // 组件启用时调用
        console.log("组件已启用");
    }
    
    public onDisabled() {
        // 组件禁用时调用
        console.log("组件已禁用");
    }
    
    public update() {
        // 每帧更新（如果组件启用）
        console.log("组件更新");
    }
}
```

### 组件管理

```typescript
// 添加组件
const health = entity.addComponent(new HealthComponent());

// 创建并添加组件
const movement = entity.createComponent(MovementComponent, 200); // 传递构造参数

// 获取组件
const healthComp = entity.getComponent(HealthComponent);

// 检查组件是否存在
if (entity.hasComponent(HealthComponent)) {
    // 处理逻辑
}

// 获取或创建组件
const weapon = entity.getOrCreateComponent(WeaponComponent);

// 获取多个同类型组件
const allHealthComps = entity.getComponents(HealthComponent);

// 移除组件
entity.removeComponent(healthComp);

// 按类型移除组件
entity.removeComponentByType(HealthComponent);

// 移除所有组件
entity.removeAllComponents();
```

### 组件对象池优化

```typescript
import { Component, ComponentPoolManager } from '@esengine/ecs-framework';

class BulletComponent extends Component {
    public damage: number = 10;
    public speed: number = 300;
    
    // 对象池重置方法
    public reset() {
        this.damage = 10;
        this.speed = 300;
    }
}

// 注册组件池
ComponentPoolManager.getInstance().registerPool(BulletComponent, 1000);

// 使用对象池获取组件
const bullet = ComponentPoolManager.getInstance().getComponent(BulletComponent);
entity.addComponent(bullet);

// 释放组件回对象池
ComponentPoolManager.getInstance().releaseComponent(bullet);

// 预热组件池
ComponentPoolManager.getInstance().preWarmPools({
    BulletComponent: 1000,
    EffectComponent: 500
});

// 获取池统计
const stats = ComponentPoolManager.getInstance().getPoolStats();
console.log('组件池统计:', stats);
```

## Scene（场景）

场景是实体和系统的容器，管理游戏世界的状态。

### 场景生命周期

```typescript
class GameScene extends es.Scene {
    public initialize() {
        // 场景初始化，创建实体和系统
        this.setupEntities();
        this.setupSystems();
    }
    
    public onStart() {
        // 场景开始运行时调用
        console.log("场景开始");
    }
    
    public unload() {
        // 场景卸载时调用
        console.log("场景卸载");
    }
    
    private setupEntities() {
        const player = this.createEntity("Player");
        player.addComponent(new PlayerComponent());
    }
    
    private setupSystems() {
        this.addEntityProcessor(new MovementSystem());
    }
}
```

### 实体管理

```typescript
// 创建实体
const entity = scene.createEntity("MyEntity");

// 添加现有实体
scene.addEntity(entity);

// 查找实体
const player = scene.findEntity("Player");
const entityById = scene.findEntityById(123);
const entitiesByTag = scene.findEntitiesByTag(1);

// 销毁所有实体
scene.destroyAllEntities();

// 获取场景统计信息
const stats = scene.getStats();
console.log("实体数量:", stats.entityCount);
console.log("系统数量:", stats.processorCount);
```

## System（系统）

系统处理实体集合，实现游戏的核心逻辑。

### EntitySystem

最常用的系统类型，处理实体集合：

```typescript
class MovementSystem extends es.EntitySystem {
    protected process(entities: es.Entity[]) {
        for (const entity of entities) {
            const movement = entity.getComponent(MovementComponent);
            if (movement) {
                movement.update();
            }
        }
    }
}
```

### ProcessingSystem

定期处理的系统：

```typescript
class HealthRegenerationSystem extends es.ProcessingSystem {
    protected process(entities: es.Entity[]) {
        for (const entity of entities) {
            const health = entity.getComponent(HealthComponent);
            if (health && health.currentHealth < health.maxHealth) {
                health.currentHealth += 10 * es.Time.deltaTime;
            }
        }
    }
}
```

### IntervalSystem

按时间间隔执行的系统：

```typescript
class SpawnSystem extends es.IntervalSystem {
    constructor() {
        super(3.0); // 每3秒执行一次
    }
    
    protected processSystem() {
        // 生成敌人
        const enemy = this.scene.createEntity("Enemy");
        enemy.addComponent(new EnemyComponent());
    }
}
```

### PassiveSystem

被动系统，不自动处理实体：

```typescript
class CollisionSystem extends es.PassiveSystem {
    public checkCollisions() {
        // 手动调用的碰撞检测逻辑
    }
}
```

## Time（时间）

时间管理工具类，提供游戏时间相关功能：

```typescript
// 获取时间信息
console.log("帧时间:", es.Time.deltaTime);
console.log("总时间:", es.Time.totalTime);
console.log("帧数:", es.Time.frameCount);
console.log("时间缩放:", es.Time.timeScale);

// 设置时间缩放（慢动作效果）
es.Time.timeScale = 0.5;

// 检查时间间隔
if (es.Time.checkEvery(1.0, lastCheckTime)) {
    // 每秒执行一次
}
```

## Vector2（二维向量）

二维向量类，提供数学运算：

```typescript
// 创建向量
const vec1 = new es.Vector2(10, 20);
const vec2 = es.Vector2.zero;
const vec3 = es.Vector2.one;

// 向量运算
const sum = vec1.add(vec2);
const diff = vec1.subtract(vec2);
const scaled = vec1.multiply(2);
const normalized = vec1.normalize();

// 向量属性
console.log("长度:", vec1.length);
console.log("长度平方:", vec1.lengthSquared);

// 静态方法
const distance = es.Vector2.distance(vec1, vec2);
const lerped = es.Vector2.lerp(vec1, vec2, 0.5);
const fromAngle = es.Vector2.fromAngle(Math.PI / 4);
```

## 性能监控

框架内置性能监控工具：

```typescript
// 获取性能监控实例
const monitor = es.PerformanceMonitor.instance;

// 查看性能数据
console.log("平均FPS:", monitor.averageFPS);
console.log("最小FPS:", monitor.minFPS);
console.log("最大FPS:", monitor.maxFPS);
console.log("内存使用:", monitor.memoryUsage);

// 重置性能数据
monitor.reset();
```

## 对象池

内存管理优化工具：

```typescript
// 创建对象池
class BulletPool extends es.Pool<Bullet> {
    protected createObject(): Bullet {
        return new Bullet();
    }
}

const bulletPool = new BulletPool();

// 使用对象池
const bullet = bulletPool.obtain();
// 使用bullet...
bulletPool.free(bullet);

// 清空对象池
bulletPool.clear();
```

## 最佳实践

### 1. 实体设计

- 实体只包含基本属性，功能通过组件实现
- 合理使用实体层级关系
- 及时销毁不需要的实体

### 2. 组件设计

- 组件保持单一职责
- 使用生命周期方法进行初始化和清理
- 避免组件间直接依赖

### 3. 系统设计

- 系统专注于特定逻辑处理
- 合理设置系统更新顺序
- 使用被动系统处理特殊逻辑

### 4. 性能优化

- 使用对象池减少内存分配
- 监控性能数据
- 合理使用时间缩放

## 高级性能优化功能

### 位掩码优化器

位掩码优化器可以预计算和缓存常用的组件掩码，提升查询性能。

```typescript
import { BitMaskOptimizer } from '@esengine/ecs-framework';

const optimizer = BitMaskOptimizer.getInstance();

// 注册组件类型
optimizer.registerComponentType(PositionComponent);
optimizer.registerComponentType(VelocityComponent);
optimizer.registerComponentType(RenderComponent);

// 预计算常用掩码组合
optimizer.precomputeCommonMasks();

// 获取优化的掩码
const positionMask = optimizer.getComponentMask(PositionComponent);
const movementMask = optimizer.getCombinedMask([PositionComponent, VelocityComponent]);

// 掩码操作
const hasBothComponents = optimizer.hasAllComponents(entityMask, movementMask);
const hasAnyComponent = optimizer.hasAnyComponent(entityMask, movementMask);

// 获取掩码分析
const analysis = optimizer.analyzeMask(entityMask);
console.log('掩码包含的组件类型:', analysis.componentTypes);
```

### 延迟索引更新器

批量更新索引可以显著提升大规模实体操作的性能。

```typescript
import { IndexUpdateBatcher } from '@esengine/ecs-framework';

const batcher = new IndexUpdateBatcher((updates) => {
    // 处理批量更新
    console.log(`批量处理 ${updates.length} 个索引更新`);
});

// 配置批量大小和延迟
batcher.configure(100, 16); // 批量大小100，延迟16ms

// 添加更新任务
batcher.addUpdate("add", entity, componentMask);
batcher.addUpdate("remove", entity, componentMask);

// 强制刷新
batcher.flush();
```

### 批量操作API

```typescript
// 批量创建实体 - 最高性能
const entities = scene.createEntities(10000, "Bullets");

// 延迟缓存清理
entities.forEach(entity => {
    scene.addEntity(entity, false); // 延迟清理
});
scene.querySystem.clearCache(); // 手动清理

// 批量查询优化
const movingEntities = scene.getEntitiesWithComponents([PositionComponent, VelocityComponent]);
```

## 总结

ECS Framework 提供了完整的实体组件系统架构：

- **Core** 管理游戏生命周期和全局功能
- **Entity** 作为游戏对象的基础容器
- **Component** 实现具体的功能模块，支持对象池优化
- **System** 处理游戏逻辑
- **Scene** 管理游戏世界状态，支持批量操作
- **高级优化** 位掩码优化器、组件对象池、批量操作等

通过合理使用这些核心概念和优化功能，可以构建出高性能、结构清晰、易于维护的游戏代码。 