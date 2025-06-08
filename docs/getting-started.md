# 快速入门

本指南将帮助您快速上手 ECS Framework，这是一个轻量级的实体组件系统框架，专为小游戏设计。

## 项目结构

```
ecs-framework/
├── source/
│   ├── src/           # 源代码
│   │   ├── ECS/       # ECS核心系统
│   │   ├── Types/     # 类型定义
│   │   ├── Utils/     # 工具类
│   │   └── Testing/   # 测试文件
│   ├── scripts/       # 构建脚本
│   └── tsconfig.json  # TypeScript配置
└── docs/              # 文档
```

## 安装和使用

### NPM 安装

```bash
npm install @esengine/ecs-framework
```

### 从源码构建

```bash
# 克隆项目
git clone https://github.com/esengine/ecs-framework.git

# 进入源码目录
cd ecs-framework/source

# 安装依赖
npm install

# 编译TypeScript
npm run build
```

## 基础设置

### 1. 导入框架

```typescript
// 导入核心类
import { 
    Core, 
    Entity, 
    Component, 
    Scene, 
    EntitySystem,
    ComponentPoolManager,
    BitMaskOptimizer 
} from '@esengine/ecs-framework';
```

### 2. 创建基础管理器

```typescript
class GameManager {
    private core: Core;
    private scene: Scene;
    
    constructor() {
        // 创建核心实例
        this.core = Core.create(true);
        
        // 创建场景
        this.scene = new Scene();
        this.scene.name = "GameScene";
        
        // 设置当前场景
        Core.scene = this.scene;
        
        // 初始化优化功能
        this.setupOptimizations();
    }
    
    private setupOptimizations() {
        // 注册组件对象池
        ComponentPoolManager.getInstance().preWarmPools({
            PositionComponent: 1000,
            VelocityComponent: 1000,
            HealthComponent: 500
        });
        
        // 注册位掩码优化
        const optimizer = BitMaskOptimizer.getInstance();
        optimizer.registerComponentType(PositionComponent);
        optimizer.registerComponentType(VelocityComponent);
        optimizer.registerComponentType(HealthComponent);
        optimizer.precomputeCommonMasks();
    }
    
    public update(deltaTime: number): void {
        // 更新场景
        this.scene.update();
        
        // 处理系统逻辑
        this.updateSystems(deltaTime);
    }
    
    private updateSystems(deltaTime: number): void {
        // 在这里添加您的系统更新逻辑
    }
}
```

### 3. 游戏循环

```typescript
const gameManager = new GameManager();
let lastTime = performance.now();

function gameLoop() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
    lastTime = currentTime;
    
    gameManager.update(deltaTime);
    
    requestAnimationFrame(gameLoop);
}

// 启动游戏循环
gameLoop();
```

## 创建实体和组件

### 1. 定义组件

```typescript
import { Component, ComponentPoolManager } from '@esengine/ecs-framework';

// 位置组件
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
    
    // 对象池重置方法
    public reset() {
        this.x = 0;
        this.y = 0;
    }
}

// 速度组件
class VelocityComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
    
    public reset() {
        this.x = 0;
        this.y = 0;
    }
}

// 生命值组件
class HealthComponent extends Component {
    public maxHealth: number = 100;
    public currentHealth: number = 100;
    
    constructor(maxHealth: number = 100) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }
    
    public reset() {
        this.maxHealth = 100;
        this.currentHealth = 100;
    }
    
    public takeDamage(damage: number): void {
        this.currentHealth = Math.max(0, this.currentHealth - damage);
    }
    
    public heal(amount: number): void {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }
    
    public isDead(): boolean {
        return this.currentHealth <= 0;
    }
}

// 注册组件到对象池
ComponentPoolManager.getInstance().registerPool(PositionComponent, 1000);
ComponentPoolManager.getInstance().registerPool(VelocityComponent, 1000);
ComponentPoolManager.getInstance().registerPool(HealthComponent, 500);
```

### 2. 创建实体

```typescript
class GameManager {
    // ... 之前的代码 ...
    
    public createPlayer(): Entity {
        const player = this.scene.createEntity("Player");
        
        // 使用对象池获取组件
        const position = ComponentPoolManager.getInstance().getComponent(PositionComponent);
        position.x = 400;
        position.y = 300;
        player.addComponent(position);
        
        const velocity = ComponentPoolManager.getInstance().getComponent(VelocityComponent);
        player.addComponent(velocity);
        
        const health = ComponentPoolManager.getInstance().getComponent(HealthComponent);
        health.maxHealth = 100;
        health.currentHealth = 100;
        player.addComponent(health);
        
        // 设置标签和更新顺序
        player.tag = 1; // 玩家标签
        player.updateOrder = 0;
        
        return player;
    }
    
    public createEnemies(count: number): Entity[] {
        // 使用批量创建API - 高性能
        const enemies = this.scene.createEntities(count, "Enemy");
        
        // 批量配置敌人
        enemies.forEach((enemy, index) => {
            // 使用对象池获取组件
            const position = ComponentPoolManager.getInstance().getComponent(PositionComponent);
            position.x = Math.random() * 800;
            position.y = Math.random() * 600;
            enemy.addComponent(position);
            
            const velocity = ComponentPoolManager.getInstance().getComponent(VelocityComponent);
            velocity.x = (Math.random() - 0.5) * 100;
            velocity.y = (Math.random() - 0.5) * 100;
            enemy.addComponent(velocity);
            
            const health = ComponentPoolManager.getInstance().getComponent(HealthComponent);
            health.maxHealth = 50;
            health.currentHealth = 50;
            enemy.addComponent(health);
            
            enemy.tag = 2; // 敌人标签
            enemy.updateOrder = 1;
        });
        
        return enemies;
    }
    
    public destroyEntity(entity: Entity): void {
        // 释放组件回对象池
        entity.components.forEach(component => {
            ComponentPoolManager.getInstance().releaseComponent(component);
        });
        
        // 销毁实体
        entity.destroy();
    }
}
```

### 3. 创建系统

```typescript
import { EntitySystem, Entity } from '@esengine/ecs-framework';

class MovementSystem extends EntitySystem {
    protected process(entities: Entity[]): void {
        // 使用高性能查询获取移动实体
        const movableEntities = this.scene.querySystem.queryTwoComponents(
            PositionComponent, 
            VelocityComponent
        );
        
        movableEntities.forEach(({ entity, component1: position, component2: velocity }) => {
            // 更新位置
            position.x += velocity.x * Time.deltaTime;
            position.y += velocity.y * Time.deltaTime;
            
            // 边界检查
            if (position.x < 0 || position.x > 800) {
                velocity.x = -velocity.x;
            }
            if (position.y < 0 || position.y > 600) {
                velocity.y = -velocity.y;
            }
        });
    }
}

class HealthSystem extends EntitySystem {
    protected process(entities: Entity[]): void {
        const healthEntities = this.scene.querySystem.queryComponentTyped(HealthComponent);
        const deadEntities: Entity[] = [];
        
        healthEntities.forEach(({ entity, component: health }) => {
            if (health.isDead()) {
                deadEntities.push(entity);
            }
        });
        
        // 销毁死亡实体
        deadEntities.forEach(entity => {
            this.scene.removeEntity(entity);
        });
    }
}
```

## 高级功能

### 1. 性能监控

```typescript
class GameManager {
    // ... 之前的代码 ...
    
    public getPerformanceStats(): void {
        const stats = this.scene.getPerformanceStats();
        console.log(`实体数量: ${stats.entityCount}`);
        console.log(`查询缓存大小: ${stats.queryCacheSize}`);
        
        const poolStats = ComponentPoolManager.getInstance().getPoolStats();
        console.log('组件池统计:', poolStats);
    }
}
```

### 2. 批量操作

```typescript
// 批量创建大量实体
const bullets = this.scene.createEntities(1000, "Bullet");

// 批量查询
const enemies = this.scene.getEntitiesWithComponents([PositionComponent, HealthComponent]);

// 延迟缓存清理（高性能）
bullets.forEach(bullet => {
    this.scene.addEntity(bullet, false); // 延迟清理
});
this.scene.querySystem.clearCache(); // 手动清理
```

### 3. 事件系统

```typescript
import { Core, CoreEvents } from '@esengine/ecs-framework';

// 监听事件
Core.emitter.addObserver(CoreEvents.frameUpdated, this.onFrameUpdate, this);

// 发射自定义事件
Core.emitter.emit("playerDied", { player: entity, score: 1000 });

// 移除监听
Core.emitter.removeObserver(CoreEvents.frameUpdated, this.onFrameUpdate);
```

## 完整示例

以下是一个完整的小游戏示例，展示了框架的主要功能：

```typescript
import { 
    Core, 
    Entity, 
    Component, 
    Scene, 
    EntitySystem,
    ComponentPoolManager,
    BitMaskOptimizer,
    Time 
} from '@esengine/ecs-framework';

// 定义组件（前面已定义）
// ... PositionComponent, VelocityComponent, HealthComponent ...

// 游戏事件
enum GameEvents {
    PLAYER_DIED = 'playerDied',
    ENEMY_SPAWNED = 'enemySpawned'
}

// 完整的游戏管理器
class SimpleGame {
    private core: Core;
    private scene: Scene;
    private isRunning: boolean = false;
    
    constructor() {
        this.core = Core.create(true);
        this.scene = new Scene();
        this.scene.name = "GameScene";
        Core.scene = this.scene;
        
        this.setupOptimizations();
        this.setupSystems();
        this.setupEvents();
    }
    
    private setupOptimizations(): void {
        // 预热组件池
        ComponentPoolManager.getInstance().preWarmPools({
            PositionComponent: 2000,
            VelocityComponent: 2000,
            HealthComponent: 1000
        });
        
        // 注册位掩码优化
        const optimizer = BitMaskOptimizer.getInstance();
        optimizer.registerComponentType(PositionComponent);
        optimizer.registerComponentType(VelocityComponent);
        optimizer.registerComponentType(HealthComponent);
        optimizer.precomputeCommonMasks();
    }
    
    private setupSystems(): void {
        this.scene.addEntityProcessor(new MovementSystem());
        this.scene.addEntityProcessor(new HealthSystem());
    }
    
    private setupEvents(): void {
        Core.emitter.addObserver(GameEvents.PLAYER_DIED, this.onPlayerDied, this);
        Core.emitter.addObserver(GameEvents.ENEMY_SPAWNED, this.onEnemySpawned, this);
    }
    
    public start(): void {
        this.isRunning = true;
        
        // 创建游戏实体
        this.createPlayer();
        this.createEnemies(100);
        
        // 启动游戏循环
        this.gameLoop();
    }
    
    public stop(): void {
        this.isRunning = false;
        
        // 清理组件池
        ComponentPoolManager.getInstance().clearAllPools();
    }
    
    private createPlayer(): Entity {
        const player = this.scene.createEntity("Player");
        
        const position = ComponentPoolManager.getInstance().getComponent(PositionComponent);
        position.x = 400;
        position.y = 300;
        player.addComponent(position);
        
        const velocity = ComponentPoolManager.getInstance().getComponent(VelocityComponent);
        player.addComponent(velocity);
        
        const health = ComponentPoolManager.getInstance().getComponent(HealthComponent);
        health.maxHealth = 100;
        health.currentHealth = 100;
        player.addComponent(health);
        
        player.tag = 1;
        return player;
    }
    
    private createEnemies(count: number): Entity[] {
        // 使用高性能批量创建
        const enemies = this.scene.createEntities(count, "Enemy");
        
        enemies.forEach((enemy, index) => {
            const position = ComponentPoolManager.getInstance().getComponent(PositionComponent);
            position.x = Math.random() * 800;
            position.y = Math.random() * 600;
            enemy.addComponent(position);
            
            const velocity = ComponentPoolManager.getInstance().getComponent(VelocityComponent);
            velocity.x = (Math.random() - 0.5) * 100;
            velocity.y = (Math.random() - 0.5) * 100;
            enemy.addComponent(velocity);
            
            const health = ComponentPoolManager.getInstance().getComponent(HealthComponent);
            health.maxHealth = 50;
            health.currentHealth = 50;
            enemy.addComponent(health);
            
            enemy.tag = 2;
        });
        
        return enemies;
    }
    
    private onPlayerDied(event: any): void {
        console.log("游戏结束！玩家死亡");
        this.stop();
    }
    
    private onEnemySpawned(event: any): void {
        console.log("敌人出现！");
    }
    
    private update(deltaTime: number): void {
        // 更新定时器
        this.core._timerManager.update(deltaTime);
        
        // 更新场景
        this.scene.update();
    }
    
    private gameLoop(): void {
        let lastTime = performance.now();
        
        const loop = () => {
            if (!this.isRunning) return;
            
            const currentTime = performance.now();
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            this.update(deltaTime);
            
            requestAnimationFrame(loop);
        };
        
        loop();
    }
}

// 启动游戏
const game = new SimpleGame();
game.start();
```

## 性能优化建议

### 1. 大规模实体处理
- 使用 `createEntities()` 批量创建实体
- 启用组件对象池减少内存分配
- 使用延迟缓存清理机制

### 2. 查询优化
- 缓存频繁查询的结果
- 使用 `BitMaskOptimizer` 优化掩码操作
- 减少不必要的查询频率

### 3. 内存管理
- 预热常用组件池
- 及时释放不用的组件回对象池
- 定期清理未使用的缓存

## 下一步

现在您已经掌握了 ECS Framework 的基础用法，可以继续学习：

- [实体使用指南](entity-guide.md) - 详细了解实体的所有功能和用法
- [核心概念](core-concepts.md) - 深入了解 ECS 架构和设计原理
- [查询系统使用指南](query-system-usage.md) - 学习高性能查询系统的详细用法
- [性能基准](performance.md) - 了解框架的性能表现和优化建议

## 常见问题

### Q: 如何在不同游戏引擎中集成？

A: ECS Framework 是引擎无关的，您只需要：
1. 通过npm安装框架 `npm install @esengine/ecs-framework`
2. 在游戏引擎的主循环中调用 `scene.update()`
3. 根据需要集成渲染、输入等引擎特定功能

### Q: 如何处理输入？

A: 框架本身不提供输入处理，建议：
1. 创建一个输入组件来存储输入状态
2. 在游戏引擎的输入回调中更新输入组件
3. 创建输入处理系统来响应输入状态

### Q: 如何优化大规模实体性能？

A: 关键优化策略：
1. 启用组件对象池：`ComponentPoolManager.getInstance().registerPool()`
2. 使用批量操作：`scene.createEntities()`
3. 缓存查询结果，减少查询频率
4. 使用位掩码优化器：`BitMaskOptimizer.getInstance()`

### Q: 组件对象池何时有效？

A: 对象池在以下情况下最有效：
- 频繁创建和销毁相同类型的组件
- 组件数量大于1000个
- 游戏运行时间较长，需要避免垃圾回收压力 