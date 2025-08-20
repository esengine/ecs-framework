# 核心 API 参考

本文档详细介绍 ECS Framework 的核心 API 和使用方法。

> **不熟悉ECS概念？** 建议先阅读 [技术概念详解](concepts-explained.md) 了解ECS架构基础和性能优化原理

## ECS 架构概述

ECS 架构将传统的面向对象设计分解为三个核心部分：

- **Entity（实体）** - 游戏世界中的对象，包含基本属性如位置、旋转、缩放
- **Component（组件）** - 包含数据和行为的功能模块
- **System（系统）** - 处理实体集合的逻辑处理单元

## Core（核心）

Core 是框架的核心管理类，负责游戏的生命周期管理。框架采用融合设计，既支持传统的单Scene模式（向后兼容），也支持高级的多World/多Scene架构。

### 创建和配置

```typescript
import { Core, ICoreConfig } from '@esengine/ecs-framework';

// 创建核心实例（使用配置对象 - 推荐）
const config: ICoreConfig = {
    debug: true,                    // 启用调试模式
    enableEntitySystems: true,     // 启用实体系统
    debugConfig: {                 // 可选：远程调试配置
        enabled: true,
        websocketUrl: 'ws://localhost:8080',
        autoReconnect: true,
        updateInterval: 1000,
        channels: {
            entities: true,
            systems: true,
            performance: true,
            components: true,
            scenes: true
        }
    }
};
const core = Core.create(config);

// 简化创建（向后兼容）
const core1 = Core.create(true);   // 调试模式
const core2 = Core.create(false);  // 发布模式
const core3 = Core.create();       // 默认调试模式
```

### 场景管理API

```typescript
// 单Scene模式（默认，向后兼容）
const scene = new Scene();
Core.setScene(scene);           // 设置场景
const currentScene = Core.getScene(); // 获取当前场景

// 多World模式（高级功能）
Core.enableWorldManager();     // 启用World管理器
const worldManager = Core.getWorldManager();

// 创建World
const gameWorld = worldManager.createWorld('GameWorld', {
    name: 'GameWorld',
    maxScenes: 10,
    autoCleanup: true
});

// 在World中管理Scene
const battleScene = gameWorld.createScene('battle', new Scene());
const uiScene = gameWorld.createScene('ui', new Scene());

gameWorld.setSceneActive('battle', true);
gameWorld.setSceneActive('ui', true);

// 启动World
gameWorld.start();

// 获取World统计
const worldStats = gameWorld.getStats();
console.log('World状态:', worldStats);
```

### 事件系统

```typescript
import { EntityManager, ECSEventType } from '@esengine/ecs-framework';

// 获取EntityManager的事件系统
const entityManager = new EntityManager();
const eventBus = entityManager.eventBus;

// 监听实体事件
eventBus.onEntityCreated((data) => {
    console.log(`实体创建: ${data.entityName}`);
});

eventBus.onComponentAdded((data) => {
    console.log(`组件添加: ${data.componentType}`);
});

// 发送自定义事件
eventBus.emit("customEvent", { data: "value" });

// 使用事件装饰器（推荐）
import { EventHandler } from '@esengine/ecs-framework';

class GameSystem {
    @EventHandler('entity:died')
    onEntityDied(data: any) {
        console.log('实体死亡:', data);
    }
}
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
Core.setScene(scene;

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
const stats = scene.getStats();
console.log(`实体数量: ${stats.entityCount}`);
```

## Entity（实体）

实体是游戏世界中的基本对象，包含位置、旋转、缩放等基本属性。

### 实体的基本属性

```typescript
const entity = scene.createEntity("MyEntity");

// 标签（用于分类）
entity.tag = 1;

// 启用状态
entity.enabled = true;

// 活跃状态
entity.active = true;

// 更新顺序
entity.updateOrder = 10;

// 注意：框架专注于ECS架构，不提供Transform相关功能
// 位置、旋转、缩放等Transform功能需要通过组件实现
class TransformComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public rotation: number = 0;
    public scaleX: number = 1;
    public scaleY: number = 1;
}

// 使用Transform组件
const transform = entity.addComponent(new TransformComponent());
transform.x = 100;
transform.y = 200;
transform.rotation = Math.PI / 4;
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
ComponentPoolManager.getInstance().registerPool(
    'BulletComponent',
    () => new BulletComponent(),
    (bullet) => bullet.reset(),
    1000
);

// 使用对象池获取组件
const bullet = ComponentPoolManager.getInstance().acquireComponent('BulletComponent');
if (bullet) {
    entity.addComponent(bullet);
}

// 释放组件回对象池
ComponentPoolManager.getInstance().releaseComponent('BulletComponent', bullet);

// 预热所有组件池
ComponentPoolManager.getInstance().prewarmAll(100);

// 获取池统计
const stats = ComponentPoolManager.getInstance().getPoolStats();
console.log('组件池统计:', stats);
```

## Scene（场景）

场景是实体和系统的容器，管理游戏世界的状态。

### 场景生命周期

```typescript
import { Scene } from '@esengine/ecs-framework';

class GameScene extends Scene {
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

## World（世界）

World是Scene的容器，提供了更高级的场景管理功能。每个World可以包含多个Scene，适用于复杂的游戏架构。

### World基本使用

```typescript
import { World, Scene, IWorldConfig } from '@esengine/ecs-framework';

// 创建World配置
const worldConfig: IWorldConfig = {
    name: 'GameWorld',
    debug: true,
    maxScenes: 10,
    autoCleanup: true
};

// 创建World
const gameWorld = new World(worldConfig);

// 在World中创建Scene
const battleScene = gameWorld.createScene('battle', new Scene());
const uiScene = gameWorld.createScene('ui', new Scene());
const menuScene = gameWorld.createScene('menu');

// 激活Scene
gameWorld.setSceneActive('battle', true);
gameWorld.setSceneActive('ui', true);

// 启动World
gameWorld.start();
```

### World生命周期管理

```typescript
// 启动World（启动所有全局System）
gameWorld.start();

// 检查World状态
if (gameWorld.isActive) {
    console.log('World正在运行');
}

// 停止World（停止所有Scene和全局System）
gameWorld.stop();

// 销毁World（清理所有资源）
gameWorld.destroy();
```

### Scene管理

```typescript
// 获取Scene
const battleScene = gameWorld.getScene<Scene>('battle');

// 检查Scene是否激活
if (gameWorld.isSceneActive('battle')) {
    console.log('战斗场景正在运行');
}

// 移除Scene
gameWorld.removeScene('menu');

// 获取所有Scene ID
const sceneIds = gameWorld.getSceneIds();
console.log('所有Scene:', sceneIds);

// 获取活跃Scene数量
const activeCount = gameWorld.getActiveSceneCount();
console.log('活跃Scene数量:', activeCount);
```

### 全局System管理

World支持全局System，这些System会在所有Scene之前执行，适用于跨Scene的业务逻辑：

```typescript
import { IGlobalSystem } from '@esengine/ecs-framework';

// 全局网络同步系统
class GlobalNetworkSystem implements IGlobalSystem {
    public readonly name = 'GlobalNetworkSystem';
    
    public initialize(): void {
        // 初始化网络连接
        console.log('网络系统初始化');
    }
    
    public update(): void {
        // 处理全局网络同步逻辑
        // 注意：全局系统处理的是World级别的逻辑，不直接处理实体
        // 如需处理特定实体，请在Scene中使用EntitySystem
        this.syncGlobalNetworkState();
    }
    
    public reset(): void {
        // 重置系统状态
    }
    
    public destroy(): void {
        // 清理网络连接
        console.log('网络系统销毁');
    }
    
    private syncGlobalNetworkState(): void {
        // 全局网络状态同步
    }
}

// 添加全局System
const networkSystem = gameWorld.addGlobalSystem(new GlobalNetworkSystem());

// 获取全局System
const existingSystem = gameWorld.getGlobalSystem(GlobalNetworkSystem);

// 移除全局System
gameWorld.removeGlobalSystem(networkSystem);
```

> **注意**：全局System适用于World级别的业务逻辑（如网络管理、资源管理、全局状态管理等）。如果需要处理具体的实体和组件，请在Scene中使用EntitySystem。

### World状态监控

```typescript
// 获取World状态
const status = gameWorld.getStatus();
console.log('World状态:', {
    name: status.name,
    isActive: status.isActive,
    sceneCount: status.sceneCount,
    activeSceneCount: status.activeSceneCount,
    globalSystemCount: status.globalSystemCount,
    scenes: status.scenes
});

// 获取World统计信息
const stats = gameWorld.getStats();
console.log('World统计:', {
    totalEntities: stats.totalEntities,
    totalSystems: stats.totalSystems,
    memoryUsage: stats.memoryUsage
});
```

## WorldManager（世界管理器）

WorldManager是单例模式的World管理器，负责管理多个World实例。

### WorldManager基本使用

```typescript
import { WorldManager, IWorldManagerConfig } from '@esengine/ecs-framework';

// 获取WorldManager实例
const worldManager = WorldManager.getInstance({
    maxWorlds: 50,
    autoCleanup: true,
    debug: true
});

// 或者通过Core获取
Core.enableWorldManager();
const worldManager2 = Core.getWorldManager();
```

### World管理

```typescript
// 创建World
const gameWorld = worldManager.createWorld('GameRoom_001', {
    name: 'GameRoom_001',
    maxScenes: 5,
    autoCleanup: true
});

// 获取World
const existingWorld = worldManager.getWorld('GameRoom_001');

// 检查World是否存在
if (worldManager.getWorld('GameRoom_001')) {
    console.log('World存在');
}

// 销毁World
worldManager.removeWorld('GameRoom_001');

// 获取所有World ID
const worldIds = worldManager.getWorldIds();
console.log('所有World ID:', worldIds);

// 获取活跃World
const activeWorlds = worldManager.getActiveWorlds();
console.log('活跃World数量:', activeWorlds.length);
```

### WorldManager统计和监控

```typescript
// 获取WorldManager状态
const managerStatus = worldManager.getStatus();
console.log('WorldManager状态:', {
    totalWorlds: managerStatus.totalWorlds,
    activeWorlds: managerStatus.activeWorlds,
    maxWorlds: managerStatus.maxWorlds,
    memoryUsage: managerStatus.memoryUsage
});

// 获取所有World的统计
const allStats = worldManager.getAllWorldStats();
allStats.forEach(stat => {
    console.log(`World ${stat.worldName}:`, stat);
});

// 清理空闲World
const cleanedCount = worldManager.cleanup();
console.log(`清理了 ${cleanedCount} 个空闲World`);
```

### 使用场景

World和WorldManager适用于：
- **游戏服务器**：每个房间一个独立World
- **复杂客户端**：按功能分层管理Scene（游戏层、UI层、特效层）
- **并发世界**：需要同时运行多个独立游戏世界的场景

> **完整示例和最佳实践**：查看 [场景管理完整指南](scene-management-guide.md#world多场景管理) 了解详细的实现方案和架构设计

## System（系统）

系统处理实体集合，实现游戏的核心逻辑。

### EntitySystem

最常用的系统类型，处理实体集合：

```typescript
import { EntitySystem, Entity, Matcher } from '@esengine/ecs-framework';

class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(MovementComponent));
    }
    
    protected process(entities: Entity[]) {
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
import { ProcessingSystem, Time, Matcher } from '@esengine/ecs-framework';

class HealthRegenerationSystem extends ProcessingSystem {
    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }
    
    public processSystem() {
        // ProcessingSystem不处理具体实体，而是执行全局逻辑
        // 如果需要处理实体，应该使用EntitySystem
        this.regenerateAllPlayerHealth();
    }
    
    private regenerateAllPlayerHealth() {
        // 通过场景查找所有玩家实体并恢复生命值
        const players = this.scene.findEntitiesByTag(PlayerTag);
        for (const player of players) {
            const health = player.getComponent(HealthComponent);
            if (health && health.currentHealth < health.maxHealth) {
                health.currentHealth += 10 * Time.deltaTime;
            }
        }
    }
}
```

### IntervalSystem

按时间间隔执行的系统：

```typescript
import { IntervalSystem, Matcher } from '@esengine/ecs-framework';

class SpawnSystem extends IntervalSystem {
    constructor() {
        // IntervalSystem需要Matcher和间隔时间
        super(Matcher.empty(), 3.0); // 每3秒执行一次
    }
    
    protected process(entities: Entity[]) {
        // 生成敌人
        const enemy = this.scene.createEntity("Enemy");
        enemy.addComponent(new EnemyComponent());
    }
}
```

### PassiveSystem

被动系统，不自动处理实体：

```typescript
import { PassiveSystem, Matcher } from '@esengine/ecs-framework';

class CollisionSystem extends PassiveSystem {
    constructor() {
        super(Matcher.empty());
    }
    
    public checkCollisions() {
        // 手动调用的碰撞检测逻辑
    }
}
```

## Time（时间）

时间管理工具类，提供游戏时间相关功能：

```typescript
import { Time } from '@esengine/ecs-framework';

// 获取时间信息
console.log("帧时间:", Time.deltaTime);
console.log("总时间:", Time.totalTime);
console.log("帧数:", Time.frameCount);
console.log("时间缩放:", Time.timeScale);

// 设置时间缩放（慢动作效果）
Time.timeScale = 0.5;

// 检查时间间隔
if (Time.checkEvery(1.0, lastCheckTime)) {
    // 每秒执行一次
}
```

## 性能监控

框架内置性能监控工具：

```typescript
import { PerformanceMonitor } from '@esengine/ecs-framework';

// 获取性能监控实例
const monitor = PerformanceMonitor.instance;

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
import { Pool, IPoolable } from '@esengine/ecs-framework';

// 定义可池化的对象（需要实现IPoolable接口）
class Bullet implements IPoolable {
    public x: number = 0;
    public y: number = 0;
    public speed: number = 0;
    
    // 重置对象状态，准备重用
    public reset(): void {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
    }
}

// 创建对象池
const bulletPool = new Pool<Bullet>(() => new Bullet(), 100);

// 预热对象池
bulletPool.warmUp(20);

// 使用对象池
const bullet = bulletPool.obtain();
bullet.x = 100;
bullet.y = 200;
bullet.speed = 500;

// 使用完后归还到池中
bulletPool.free(bullet);

// 查看池统计信息
console.log(bulletPool.getStats());

// 清空对象池
bulletPool.clear();

// 使用静态方法（自动管理池）
const bullet2 = Pool.obtain(Bullet);
Pool.free(Bullet, bullet2);
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

### 查询系统优化

框架内部已集成查询优化，无需手动配置。查询系统会自动使用最优的算法：

```typescript
// 查询系统会自动优化这些操作
const movingEntities = scene.querySystem.queryAll(PositionComponent, VelocityComponent);
const renderableEntities = scene.querySystem.queryAll(PositionComponent, RenderComponent);

// 获取查询统计信息
const queryStats = scene.querySystem.getStats();
console.log('查询统计:', queryStats);
```

### 批量操作API

```typescript
// 批量创建实体 - 最高性能
const entities = scene.createEntities(10000, "Bullets");

// 批量查询优化
const movingEntities = scene.querySystem.queryAll(PositionComponent, VelocityComponent).entities;
```

## 总结

ECS Framework 提供了完整的实体组件系统架构：

- **Core** 管理游戏生命周期和全局功能，支持单Scene和多World模式
- **Entity** 作为游戏对象的基础容器
- **Component** 实现具体的功能模块，支持对象池优化
- **System** 处理游戏逻辑
- **Scene** 管理游戏世界状态，支持批量操作
- **World** 高级场景容器，支持多Scene管理和全局System
- **WorldManager** 管理多个World实例，适用于复杂架构
- **高级优化** 位掩码优化器、组件对象池、批量操作等

### 架构选择指南

- **单Scene模式**：适合简单游戏、单机游戏、原型开发
- **多World模式**：适合多人游戏服务器、复杂应用、需要场景隔离的项目

框架采用融合设计，确保向后兼容性的同时提供强大的扩展能力。通过合理使用这些核心概念和优化功能，可以构建出高性能、结构清晰、易于维护的游戏代码。 