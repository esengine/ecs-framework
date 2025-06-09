# 快速入门

本指南将帮助您快速上手 ECS Framework，这是一个专业级的实体组件系统框架，采用现代化架构设计，专为高性能游戏开发打造。

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
    EntityManager,
    ComponentIndexManager,
    ArchetypeSystem,
    DirtyTrackingSystem
} from '@esengine/ecs-framework';
```

### 2. 创建基础管理器

```typescript
class GameManager {
    private core: Core;
    private scene: Scene;
    private entityManager: EntityManager;
    
    constructor() {
        // 创建核心实例
        this.core = Core.create(true);
        
        // 创建场景
        this.scene = new Scene();
        this.scene.name = "GameScene";
        
        // 设置当前场景
        Core.scene = this.scene;
        
        // 初始化实体管理器
        this.entityManager = new EntityManager(this.scene);
        
        // 初始化性能优化
        this.setupPerformanceOptimizations();
    }
    
    private setupPerformanceOptimizations() {
        // 启用组件索引（自动优化查询性能）
        // EntityManager内部已自动启用
        
        // 可选：手动配置优化系统
        const componentIndex = this.entityManager.getComponentIndex();
        const archetypeSystem = this.entityManager.getArchetypeSystem();
        const dirtyTracking = this.entityManager.getDirtyTrackingSystem();
        
        // 优化系统会自动工作，通常无需手动配置
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
    
    // 提供实体管理器访问
    public getEntityManager(): EntityManager {
        return this.entityManager;
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

// 简单的组件定义
// 注：框架会自动优化组件的存储和查询
```

## 使用 EntityManager

EntityManager 是框架的核心功能，提供统一的实体管理和高性能查询接口。

### 1. 基础用法

```typescript
// 获取EntityManager实例（在GameManager中已创建）
const entityManager = gameManager.getEntityManager();

// 创建单个实体
const player = entityManager.createEntity("Player");
player.addComponent(new PositionComponent(100, 100));
player.addComponent(new VelocityComponent(50, 0));

// 批量创建实体
const enemies = entityManager.createEntities(50, "Enemy");
enemies.forEach((enemy, index) => {
    enemy.addComponent(new PositionComponent(
        Math.random() * 800, 
        Math.random() * 600
    ));
    enemy.addComponent(new HealthComponent(30));
    enemy.tag = "enemy";
});
```

### 2. 高性能查询

```typescript
// 流式查询API - 支持复杂查询条件
const movingEntities = entityManager
    .query()
    .withAll([PositionComponent, VelocityComponent])
    .withoutTag("dead")
    .active(true)
    .execute();

// 快速组件查询（使用O(1)索引）
const healthEntities = entityManager.getEntitiesWithComponent(HealthComponent);

// 标签查询
const allEnemies = entityManager.getEntitiesByTag("enemy");

// 名称查询
const specificEnemy = entityManager.getEntityByName("BossEnemy");

// 复合查询
const livingEnemies = entityManager
    .query()
    .withAll([PositionComponent, HealthComponent])
    .withTag("enemy")
    .withoutTag("dead")
    .where(entity => {
        const health = entity.getComponent(HealthComponent);
        return health && health.currentHealth > 0;
    })
    .execute();
```

### 3. 批量操作

```typescript
// 批量处理实体
entityManager.forEachEntity(entity => {
    // 处理所有实体
    if (entity.tag === "bullet" && entity.position.y < 0) {
        entity.destroy();
    }
});

// 批量处理特定组件的实体
entityManager.forEachEntityWithComponent(HealthComponent, (entity, health) => {
    if (health.currentHealth <= 0) {
        entity.addTag("dead");
        entity.enabled = false;
    }
});

// 获取统计信息
const stats = entityManager.getStatistics();
console.log(`总实体数: ${stats.entityCount}`);
console.log(`索引命中率: ${stats.indexHits}/${stats.totalQueries}`);
```

### 4. 性能优化功能

```typescript
// 获取性能优化系统
const componentIndex = entityManager.getComponentIndex();
const archetypeSystem = entityManager.getArchetypeSystem();
const dirtyTracking = entityManager.getDirtyTrackingSystem();

// 查看性能统计
console.log('组件索引统计:', componentIndex.getPerformanceStats());
console.log('Archetype统计:', archetypeSystem.getStatistics());
console.log('脏标记统计:', dirtyTracking.getPerformanceStats());

// 手动优化（通常自动进行）
entityManager.optimize();

// 内存清理
entityManager.cleanup();
```

## 创建系统

系统处理具有特定组件的实体集合，实现游戏逻辑。

```typescript
import { EntitySystem, Entity } from '@esengine/ecs-framework';

class MovementSystem extends EntitySystem {
    protected process(entities: Entity[]): void {
        // 使用EntityManager进行高效查询
        const entityManager = new EntityManager(this.scene);
        const movingEntities = entityManager
            .query()
            .withAll([PositionComponent, VelocityComponent])
            .execute();
        
        movingEntities.forEach(entity => {
            const position = entity.getComponent(PositionComponent);
            const velocity = entity.getComponent(VelocityComponent);
            
            if (position && velocity) {
                // 更新位置
                position.x += velocity.x * 0.016; // 假设60FPS
                position.y += velocity.y * 0.016;
                
                // 边界检查
                if (position.x < 0 || position.x > 800) {
                    velocity.x = -velocity.x;
                }
                if (position.y < 0 || position.y > 600) {
                    velocity.y = -velocity.y;
                }
            }
        });
    }
}

class HealthSystem extends EntitySystem {
    protected process(entities: Entity[]): void {
        const entityManager = new EntityManager(this.scene);
        
        // 查找所有有生命值的实体
        entityManager.forEachEntityWithComponent(HealthComponent, (entity, health) => {
            if (health.isDead()) {
                entity.destroy();
            }
        });
    }
}

// 添加系统到场景
gameManager.scene.addEntityProcessor(new MovementSystem());
gameManager.scene.addEntityProcessor(new HealthSystem());
```

## 高级功能

### 事件系统

```typescript
import { Core, CoreEvents } from '@esengine/ecs-framework';

// 监听框架事件
Core.emitter.addObserver(CoreEvents.frameUpdated, this.onFrameUpdate, this);

// 发射自定义事件
Core.emitter.emit("playerDied", { player: entity, score: 1000 });

// 移除监听
Core.emitter.removeObserver(CoreEvents.frameUpdated, this.onFrameUpdate);
```

### 性能监控

```typescript
// 获取EntityManager性能统计
const stats = entityManager.getStatistics();
console.log(`总实体数: ${stats.entityCount}`);
console.log(`索引命中率: ${stats.indexHits}/${stats.totalQueries}`);

// 获取各优化系统的统计
console.log('组件索引:', entityManager.getComponentIndex().getPerformanceStats());
console.log('Archetype:', entityManager.getArchetypeSystem().getStatistics());
console.log('脏标记:', entityManager.getDirtyTrackingSystem().getPerformanceStats());
```

## 简单示例

以下是一个完整的示例，展示了框架的主要功能：

```typescript
import { 
    Core, 
    Entity, 
    Component, 
    Scene, 
    EntitySystem,
    EntityManager
} from '@esengine/ecs-framework';

// 游戏管理器
class SimpleGame {
    private core: Core;
    private scene: Scene;
    private entityManager: EntityManager;
    
    constructor() {
        this.core = Core.create(true);
        this.scene = new Scene();
        this.scene.name = "GameScene";
        Core.scene = this.scene;
        
        this.entityManager = new EntityManager(this.scene);
        this.setupSystems();
    }
    
    private setupSystems(): void {
        this.scene.addEntityProcessor(new MovementSystem());
        this.scene.addEntityProcessor(new HealthSystem());
    }
    
    public start(): void {
        // 创建游戏实体
        this.createPlayer();
        this.createEnemies(50);
        
        // 启动游戏循环
        this.gameLoop();
    }
    
    private createPlayer(): Entity {
        const player = this.entityManager.createEntity("Player");
        player.addComponent(new PositionComponent(400, 300));
        player.addComponent(new VelocityComponent(0, 0));
        player.addComponent(new HealthComponent(100));
        player.tag = "player";
        return player;
    }
    
    private createEnemies(count: number): Entity[] {
        const enemies = this.entityManager.createEntities(count, "Enemy");
        
        enemies.forEach((enemy, index) => {
            enemy.addComponent(new PositionComponent(
                Math.random() * 800, 
                Math.random() * 600
            ));
            enemy.addComponent(new VelocityComponent(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100
            ));
            enemy.addComponent(new HealthComponent(50));
            enemy.tag = "enemy";
        });
        
        return enemies;
    }
    
    private gameLoop(): void {
        const update = () => {
            // 更新场景
            this.scene.update();
            requestAnimationFrame(update);
        };
        update();
    }
}

// 启动游戏
const game = new SimpleGame();
game.start();
```

## 性能优化建议

### 1. 大规模实体处理
- 使用 `EntityManager.createEntities()` 批量创建实体
- 利用组件索引系统进行高效查询
- 启用Archetype系统减少查询遍历

### 2. 查询优化
- 使用 `EntityManager.query()` 流式API构建复杂查询
- 缓存频繁查询的结果
- 利用脏标记系统避免不必要的更新

### 3. 性能监控
- 定期检查 `EntityManager.getStatistics()` 获取性能数据
- 监控组件索引命中率
- 使用框架提供的性能统计功能

## 下一步

现在您已经掌握了 ECS Framework 的基础用法，可以继续学习：

- [EntityManager 使用指南](entity-manager-example.md) - 详细了解实体管理器的高级功能
- [性能优化指南](performance-optimization.md) - 深入了解三大性能优化系统
- [核心概念](core-concepts.md) - 深入了解 ECS 架构和设计原理
- [查询系统使用指南](query-system-usage.md) - 学习高性能查询系统的详细用法

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
1. 使用 `EntityManager` 的高级查询功能
2. 启用组件索引系统进行快速查询
3. 利用Archetype系统减少查询遍历
4. 使用脏标记系统避免不必要的更新

### Q: EntityManager 有什么优势？

A: EntityManager 提供了：
- O(1) 复杂度的组件查询（使用索引）
- 流式API的复杂查询构建
- 自动的性能优化系统集成
- 统一的实体管理接口 