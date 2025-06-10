# 快速入门

本指南将帮助您快速上手 ECS Framework，这是一个专业级的实体组件系统框架，采用现代化架构设计，专为高性能游戏开发打造。

## 项目结构

```
ecs-framework/
├── src/               # 源代码
│   ├── ECS/           # ECS核心系统
│   │   ├── Core/      # 核心管理器
│   │   ├── Systems/   # 系统类型
│   │   ├── Utils/     # ECS工具类
│   │   └── Components/# 组件类型
│   ├── Types/         # TypeScript接口定义（精简版）
│   └── Utils/         # 通用工具类
├── docs/              # 文档
├── scripts/           # 构建脚本  
├── bin/               # 编译输出
└── dist/              # 发布版本
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

# 进入项目目录
cd ecs-framework

# 安装依赖
npm install

# 编译TypeScript
npm run build

# 或者使用监听模式开发
npm run build:watch
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
        this.entityManager = new EntityManager();
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

### 基础实体操作

```typescript
// 获取EntityManager实例（在GameManager中已创建）
const entityManager = gameManager.getEntityManager();

// 创建单个实体
const player = entityManager.createEntity("Player");

// 批量创建实体（使用Scene方法）
const enemies = scene.createEntities(50, "Enemy");

// 查询操作
const movingEntities = entityManager
    .query()
    .withAll(PositionComponent, VelocityComponent)
    .withNone(HealthComponent)
    .execute();

// 组件查询
const healthEntities = entityManager.getEntitiesWithComponent(HealthComponent);

// 标签查询
const allEnemies = entityManager.getEntitiesByTag(2);

// 名称查询
const specificEnemy = entityManager.getEntityByName("BossEnemy");

// 复合查询
const livingEnemies = entityManager
    .query()
    .withAll(HealthComponent)
    .withTag(2)
    .execute();
```

### 实体遍历

```typescript
// 遍历所有实体
const allEntities = entityManager.getAllEntities();
allEntities.forEach(entity => {
    console.log(`实体: ${entity.name}, ID: ${entity.id}`);
});

// 遍历特定组件的实体
const healthEntities = entityManager.getEntitiesWithComponent(HealthComponent);
healthEntities.forEach(entity => {
    const health = entity.getComponent(HealthComponent);
    console.log(`${entity.name} 生命值: ${health.currentHealth}/${health.maxHealth}`);
});
```

### 性能监控

```typescript
// 获取场景统计
const sceneStats = scene.getStats();
console.log('实体数量:', sceneStats.entityCount);
console.log('系统数量:', sceneStats.processorCount);

// 获取查询系统统计
const queryStats = scene.querySystem.getStats();
console.log('查询统计:', queryStats);


```

## 创建系统

系统处理具有特定组件的实体集合，实现游戏逻辑。

```typescript
import { EntitySystem, Entity, Matcher, EntityManager } from '@esengine/ecs-framework';

class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(PositionComponent, VelocityComponent));
    }
    
    protected process(entities: Entity[]): void {
        // 使用Scene的查询系统进行高效查询
        const movingEntities = this.scene.querySystem.queryAll(PositionComponent, VelocityComponent);
        
        movingEntities.entities.forEach(entity => {
            const position = entity.getComponent(PositionComponent);
            const velocity = entity.getComponent(VelocityComponent);
            
            if (position && velocity) {
                position.x += velocity.dx * Time.deltaTime;
                position.y += velocity.dy * Time.deltaTime;
            }
        });
    }
}

class HealthSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }
    
    protected process(entities: Entity[]): void {
        const healthEntities = this.scene.querySystem.queryAll(HealthComponent);
        
        healthEntities.entities.forEach(entity => {
            const health = entity.getComponent(HealthComponent);
            if (health && health.currentHealth <= 0) {
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
// 获取场景性能统计
const sceneStats = scene.getStats();
console.log(`总实体数: ${sceneStats.entityCount}`);
console.log(`系统数量: ${sceneStats.processorCount}`);

// 获取查询系统统计
const queryStats = scene.querySystem.getStats();
console.log('查询统计:', queryStats);
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
        
        this.entityManager = new EntityManager();
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
        const enemies = this.scene.createEntities(count, "Enemy");
        
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
- 使用 `scene.createEntities()` 批量创建实体
- 利用组件索引系统进行高效查询
- 启用Archetype系统减少查询遍历

### 2. 查询优化
- 使用 `EntityManager.query()` 流式API构建复杂查询
- 缓存频繁查询的结果
- 利用脏标记系统避免不必要的更新

### 3. 性能监控
- 定期检查 `scene.getStats()` 获取性能数据
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