# 快速入门

本指南将帮助您快速上手 ECS Framework，这是一个轻量级的实体组件系统框架，专为小游戏设计。

## 项目结构

```
ecs-framework/
├── source/
│   ├── src/           # 源代码
│   │   ├── ECS/       # ECS核心系统
│   │   ├── Math/      # 数学运算
│   │   ├── Types/     # 类型定义
│   │   └── Utils/     # 工具类
│   ├── scripts/       # 构建脚本
│   └── tsconfig.json  # TypeScript配置
└── docs/              # 文档
```

## 安装和构建

### 从源码构建

```bash
# 克隆项目
git clone https://github.com/esengine/ecs-framework.git

# 进入源码目录
cd ecs-framework/source

# 编译TypeScript
npx tsc
```

### 直接使用

您可以直接将源码复制到项目中使用，或者引用编译后的JavaScript文件。

## 基础设置

### 1. 导入框架

```typescript
// 导入核心类
import { Core } from './Core';
import { Entity } from './ECS/Entity';
import { Component } from './ECS/Component';
import { Scene } from './ECS/Scene';
import { QuerySystem } from './ECS/Core/QuerySystem';
import { Emitter } from './Utils/Emitter';
import { TimerManager } from './Utils/Timers/TimerManager';
```

### 2. 创建基础管理器

```typescript
class GameManager {
    private core: Core;
    private scene: Scene;
    private querySystem: QuerySystem;
    private emitter: Emitter;
    private timerManager: TimerManager;
    
    constructor() {
        // 创建核心实例
        this.core = Core.create(true);
        
        // 创建场景
        this.scene = new Scene();
        this.scene.name = "GameScene";
        
        // 获取场景的查询系统
        this.querySystem = this.scene.querySystem;
        
        // 获取核心的事件系统和定时器
        this.emitter = Core.emitter;
        this.timerManager = this.core._timerManager;
        
        // 设置当前场景
        Core.scene = this.scene;
    }
    
    public update(deltaTime: number): void {
        // 更新定时器
        this.timerManager.update(deltaTime);
        
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
// 位置组件
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
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
```

### 2. 创建实体

```typescript
class GameManager {
    // ... 之前的代码 ...
    
    public createPlayer(): Entity {
        const player = this.scene.createEntity("Player");
        
        // 添加组件
        player.addComponent(new PositionComponent(400, 300));
        player.addComponent(new VelocityComponent(0, 0));
        player.addComponent(new HealthComponent(100));
        
        // 设置标签和更新顺序
        player.tag = 1; // 玩家标签
        player.updateOrder = 0;
        
        return player;
    }
    
    public createEnemy(x: number, y: number): Entity {
        const enemy = this.scene.createEntity("Enemy");
        
        enemy.addComponent(new PositionComponent(x, y));
        enemy.addComponent(new VelocityComponent(50, 0));
        enemy.addComponent(new HealthComponent(50));
        
        enemy.tag = 2; // 敌人标签
        enemy.updateOrder = 1;
        
        return enemy;
    }
}

## 使用查询系统

查询系统是框架的核心功能，用于高效查找具有特定组件的实体：

```typescript
class GameManager {
    // ... 之前的代码 ...
    
    private updateSystems(deltaTime: number): void {
        this.updateMovementSystem(deltaTime);
        this.updateHealthSystem(deltaTime);
        this.updateCollisionSystem();
    }
    
    private updateMovementSystem(deltaTime: number): void {
        // 查询所有具有位置和速度组件的实体
        const movableEntities = this.querySystem.queryTwoComponents(
            PositionComponent, 
            VelocityComponent
        );
        
        movableEntities.forEach(({ entity, component1: position, component2: velocity }) => {
            // 更新位置
            position.x += velocity.x * deltaTime;
            position.y += velocity.y * deltaTime;
            
            // 边界检查
            if (position.x < 0 || position.x > 800) {
                velocity.x = -velocity.x;
            }
            if (position.y < 0 || position.y > 600) {
                velocity.y = -velocity.y;
            }
        });
    }
    
    private updateHealthSystem(deltaTime: number): void {
        // 查询所有具有生命值组件的实体
        const healthEntities = this.querySystem.queryComponentTyped(HealthComponent);
        
        const deadEntities: Entity[] = [];
        
        healthEntities.forEach(({ entity, component: health }) => {
            // 检查死亡
            if (health.isDead()) {
                deadEntities.push(entity);
            }
        });
        
        // 移除死亡实体
        deadEntities.forEach(entity => {
            entity.destroy();
        });
    }
    
    private updateCollisionSystem(): void {
        // 获取玩家
        const players = this.scene.findEntitiesByTag(1); // 玩家标签
        const enemies = this.scene.findEntitiesByTag(2); // 敌人标签
        
        players.forEach(player => {
            const playerPos = player.getComponent(PositionComponent);
            const playerHealth = player.getComponent(HealthComponent);
            
            if (!playerPos || !playerHealth) return;
            
            enemies.forEach(enemy => {
                const enemyPos = enemy.getComponent(PositionComponent);
                
                if (!enemyPos) return;
                
                // 简单的距离检测
                const distance = Math.sqrt(
                    Math.pow(playerPos.x - enemyPos.x, 2) + 
                    Math.pow(playerPos.y - enemyPos.y, 2)
                );
                
                if (distance < 50) { // 碰撞距离
                    playerHealth.takeDamage(10);
                    console.log(`玩家受到伤害！当前生命值: ${playerHealth.currentHealth}`);
                }
            });
        });
    }
}
```

## 使用事件系统

框架内置了事件系统，用于组件间通信：

```typescript
// 定义事件类型
enum GameEvents {
    PLAYER_DIED = 'playerDied',
    ENEMY_SPAWNED = 'enemySpawned',
    SCORE_CHANGED = 'scoreChanged'
}

class GameManager {
    // ... 之前的代码 ...
    
    constructor() {
        // ... 之前的代码 ...
        
        // 监听事件
        this.emitter.on(GameEvents.PLAYER_DIED, this.onPlayerDied.bind(this));
        this.emitter.on(GameEvents.ENEMY_SPAWNED, this.onEnemySpawned.bind(this));
    }
    
    private onPlayerDied(player: Entity): void {
        console.log('游戏结束！');
        // 重置游戏或显示游戏结束界面
    }
    
    private onEnemySpawned(enemy: Entity): void {
        console.log('新敌人出现！');
    }
    
    private updateHealthSystem(deltaTime: number): void {
        const healthEntities = this.querySystem.queryComponentTyped(HealthComponent);
        
        healthEntities.forEach(({ entity, component: health }) => {
            if (health.isDead()) {
                // 发送死亡事件
                if (entity.tag === 1) { // 玩家
                    this.emitter.emit(GameEvents.PLAYER_DIED, entity);
                }
                
                entity.destroy();
            }
        });
    }
}
```

## 使用定时器

框架提供了强大的定时器系统：

```typescript
class GameManager {
    // ... 之前的代码 ...
    
    public startGame(): void {
        // 创建玩家
        this.createPlayer();
        
        // 每2秒生成一个敌人
        Core.schedule(2.0, true, this, (timer) => {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
            const enemy = this.createEnemy(x, y);
            this.emitter.emit(GameEvents.ENEMY_SPAWNED, enemy);
        });
        
        // 5秒后增加敌人生成速度
        Core.schedule(5.0, false, this, (timer) => {
            console.log('游戏难度提升！');
            // 可以在这里修改敌人生成间隔
        });
    }
}

## 完整示例

以下是一个完整的小游戏示例，展示了框架的主要功能：

```typescript
// 导入框架
import { Core } from './Core';
import { Entity } from './ECS/Entity';
import { Component } from './ECS/Component';
import { Scene } from './ECS/Scene';
import { QuerySystem } from './ECS/Core/QuerySystem';
import { Emitter } from './Utils/Emitter';

// 定义组件
class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class VelocityComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class HealthComponent extends Component {
    constructor(public maxHealth: number = 100) {
        super();
        this.currentHealth = maxHealth;
    }
    
    public currentHealth: number;
    
    public takeDamage(damage: number): void {
        this.currentHealth = Math.max(0, this.currentHealth - damage);
    }
    
    public isDead(): boolean {
        return this.currentHealth <= 0;
    }
}

// 游戏事件
enum GameEvents {
    PLAYER_DIED = 'playerDied',
    ENEMY_SPAWNED = 'enemySpawned'
}

// 完整的游戏管理器
class SimpleGame {
    private core: Core;
    private scene: Scene;
    private querySystem: QuerySystem;
    private emitter: Emitter;
    private isRunning: boolean = false;
    
    constructor() {
        this.core = Core.create(true);
        this.scene = new Scene();
        this.scene.name = "SimpleGame";
        this.querySystem = this.scene.querySystem;
        this.emitter = Core.emitter;
        
        // 设置场景
        Core.scene = this.scene;
        
        // 监听事件
        this.emitter.on(GameEvents.PLAYER_DIED, () => {
            console.log('游戏结束！');
            this.isRunning = false;
        });
    }
    
    public start(): void {
        console.log('游戏开始！');
        this.isRunning = true;
        
        // 创建玩家
        this.createPlayer();
        
        // 定期生成敌人
        Core.schedule(2.0, true, this, (timer) => {
            if (this.isRunning) {
                this.createEnemy();
            }
        });
        
        // 启动游戏循环
        this.gameLoop();
    }
    
    private createPlayer(): Entity {
        const player = this.scene.createEntity("Player");
        player.addComponent(new PositionComponent(400, 300));
        player.addComponent(new VelocityComponent(100, 0));
        player.addComponent(new HealthComponent(100));
        player.tag = 1; // 玩家标签
        
        return player;
    }
    
    private createEnemy(): Entity {
        const enemy = this.scene.createEntity("Enemy");
        const x = Math.random() * 800;
        const y = Math.random() * 600;
        
        enemy.addComponent(new PositionComponent(x, y));
        enemy.addComponent(new VelocityComponent(-50, 0));
        enemy.addComponent(new HealthComponent(50));
        enemy.tag = 2; // 敌人标签
        
        this.emitter.emit(GameEvents.ENEMY_SPAWNED, enemy);
        
        return enemy;
    }
    
    private update(deltaTime: number): void {
        // 更新场景
        this.scene.update();
        
        // 更新游戏系统
        this.updateMovement(deltaTime);
        this.updateCollision();
        this.updateHealth();
    }
    
    private updateMovement(deltaTime: number): void {
        const movableEntities = this.querySystem.queryTwoComponents(
            PositionComponent, 
            VelocityComponent
        );
        
        movableEntities.forEach(({ entity, component1: pos, component2: vel }) => {
            pos.x += vel.x * deltaTime;
            pos.y += vel.y * deltaTime;
            
            // 边界检查
            if (pos.x < 0 || pos.x > 800) vel.x = -vel.x;
            if (pos.y < 0 || pos.y > 600) vel.y = -vel.y;
        });
    }
    
    private updateCollision(): void {
        const players = this.scene.findEntitiesByTag(1);
        const enemies = this.scene.findEntitiesByTag(2);
        
        players.forEach(player => {
            const playerPos = player.getComponent(PositionComponent);
            const playerHealth = player.getComponent(HealthComponent);
            
            if (!playerPos || !playerHealth) return;
            
            enemies.forEach(enemy => {
                const enemyPos = enemy.getComponent(PositionComponent);
                if (!enemyPos) return;
                
                const distance = Math.sqrt(
                    Math.pow(playerPos.x - enemyPos.x, 2) + 
                    Math.pow(playerPos.y - enemyPos.y, 2)
                );
                
                if (distance < 50) {
                    playerHealth.takeDamage(10);
                    console.log(`碰撞！玩家生命值: ${playerHealth.currentHealth}`);
                }
            });
        });
    }
    
    private updateHealth(): void {
        const healthEntities = this.querySystem.queryComponentTyped(HealthComponent);
        const deadEntities: Entity[] = [];
        
        healthEntities.forEach(({ entity, component: health }) => {
            if (health.isDead()) {
                deadEntities.push(entity);
                
                if (entity.tag === 1) { // 玩家死亡
                    this.emitter.emit(GameEvents.PLAYER_DIED, entity);
                }
            }
        });
        
        // 移除死亡实体
        deadEntities.forEach(entity => {
            entity.destroy();
        });
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

## 下一步

现在您已经掌握了 ECS Framework 的基础用法，可以继续学习：

- [核心概念](core-concepts.md) - 深入了解 ECS 架构和设计原理
- [查询系统使用指南](query-system-usage.md) - 学习高性能查询系统的详细用法

## 常见问题

### Q: 如何在不同游戏引擎中集成？

A: ECS Framework 是引擎无关的，您只需要：
1. 将框架源码复制到项目中
2. 在游戏引擎的主循环中调用 `scene.update()`
3. 根据需要集成渲染、输入等引擎特定功能

### Q: 如何处理输入？

A: 框架本身不提供输入处理，建议：
1. 创建一个输入组件来存储输入状态
2. 在游戏循环中更新输入状态
3. 在相关组件中读取输入状态并处理

### Q: 如何调试？

A: 框架提供了多种调试功能：
- 使用 `entity.getDebugInfo()` 查看实体信息
- 使用 `querySystem.getPerformanceReport()` 查看查询性能
- 使用 `querySystem.getStats()` 查看详细统计信息

### Q: 性能如何优化？

A: 框架已经内置了多种性能优化：
- 使用位掩码进行快速组件匹配
- 多级索引系统加速查询
- 智能缓存减少重复计算
- 批量操作减少开销

建议定期调用 `querySystem.optimizeIndexes()` 来自动优化配置。 