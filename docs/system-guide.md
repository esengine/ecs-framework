# 系统（System）详解指南

系统是ECS架构中的"S"，负责处理拥有特定组件的实体。本指南详细介绍框架中的各种系统类型及其使用方法。

## 系统基础概念

### 什么是系统？

系统是处理游戏逻辑的地方，它们：
- 🎯 **专注单一职责** - 每个系统只处理一种类型的逻辑
- 🔄 **自动执行** - 系统会在每帧自动被调用
- 📊 **基于组件过滤** - 只处理包含特定组件的实体
- ⚡ **高性能** - 利用ECS的数据局部性优势

### 系统的工作原理

```typescript
// 系统的基本工作流程：
// 1. 查询符合条件的实体
// 2. 遍历这些实体
// 3. 读取/修改实体的组件数据
// 4. 执行游戏逻辑

class MovementSystem extends EntitySystem {
    process(entities: Entity[]) {
        for (const entity of entities) {
            const position = entity.getComponent(PositionComponent);
            const velocity = entity.getComponent(VelocityComponent);
            
            // 更新位置 = 当前位置 + 速度 * 时间
            position.x += velocity.x * Time.deltaTime;
            position.y += velocity.y * Time.deltaTime;
        }
    }
}
```

## 系统类型详解

### 1. EntitySystem - 基础系统

最常用的系统类型，每帧处理所有符合条件的实体。

```typescript
import { EntitySystem, Entity, Matcher } from '@esengine/ecs-framework';

class HealthSystem extends EntitySystem {
    constructor() {
        // 使用Matcher指定需要的组件
        super(Matcher.empty().all(HealthComponent));
    }
    
    // 主要处理逻辑
    protected process(entities: Entity[]) {
        for (const entity of entities) {
            const health = entity.getComponent(HealthComponent);
            
            // 处理生命值逻辑
            if (health.currentHealth <= 0) {
                this.handleDeath(entity);
            } else if (health.currentHealth < health.maxHealth) {
                this.handleRegeneration(health);
            }
        }
    }
    
    private handleDeath(entity: Entity) {
        // 添加死亡标记
        entity.addComponent(new DeadComponent());
        
        // 触发死亡事件
        const eventBus = this.scene.entityManager.eventBus;
        eventBus.emit('entity:died', {
            entityId: entity.id,
            entityName: entity.name
        });
    }
    
    private handleRegeneration(health: HealthComponent) {
        // 缓慢恢复生命值
        health.currentHealth += health.regenRate * Time.deltaTime;
        health.currentHealth = Math.min(health.currentHealth, health.maxHealth);
    }
}
```

**适用场景：**
- 移动系统
- 渲染系统
- 碰撞检测系统
- AI系统

### 2. ProcessingSystem - 简化处理系统

不需要处理具体实体，主要用于执行全局逻辑或不依赖特定实体的系统处理。

```typescript
import { ProcessingSystem, Matcher } from '@esengine/ecs-framework';

class GameLogicSystem extends ProcessingSystem {
    constructor() {
        // ProcessingSystem可以不指定Matcher，或使用空Matcher
        super(Matcher.empty());
    }
    
    // 处理系统逻辑（每帧执行）
    public processSystem() {
        // 执行全局游戏逻辑
        this.updateGameState();
        this.checkWinConditions();
        this.updateUI();
    }
    
    private updateGameState() {
        // 更新游戏状态逻辑
        console.log("更新游戏状态");
    }
    
    private checkWinConditions() {
        // 检查胜利条件
        const players = this.scene.findEntitiesByTag(EntityTags.PLAYER);
        const enemies = this.scene.findEntitiesByTag(EntityTags.ENEMY);
        
        if (enemies.length === 0) {
            this.triggerVictory();
        } else if (players.length === 0) {
            this.triggerGameOver();
        }
    }
    
    private updateUI() {
        // 更新UI显示
        const gameTime = Time.totalTime;
        console.log(`游戏时间: ${gameTime.toFixed(1)}秒`);
    }
    
    private triggerVictory() {
        console.log("游戏胜利！");
        // 处理胜利逻辑
    }
    
    private triggerGameOver() {
        console.log("游戏结束！");
        // 处理游戏结束逻辑
    }
}
```

**适用场景：**
- 全局游戏逻辑系统
- 胜负判断系统
- UI更新系统
- 不依赖特定实体的处理

## AI系统示例

下面是一个完整的AI系统示例，展示EntitySystem的典型用法：

```typescript
import { EntitySystem, Matcher, Entity } from '@esengine/ecs-framework';

enum AIState {
    IDLE,
    PATROL,
    CHASE,
    ATTACK
}

class AISystem extends EntitySystem {
    constructor() {
        // 匹配所有有AI组件和位置组件的实体
        super(Matcher.empty().all(AIComponent, PositionComponent));
    }
    
    // 处理每个匹配的实体
    public processEntity(entity: Entity) {
        const ai = entity.getComponent(AIComponent);
        const position = entity.getComponent(PositionComponent);
        
        switch (ai.state) {
            case AIState.IDLE:
                this.processIdle(entity, ai);
                break;
            case AIState.PATROL:
                this.processPatrol(entity, ai, position);
                break;
            case AIState.CHASE:
                this.processChase(entity, ai, position);
                break;
            case AIState.ATTACK:
                this.processAttack(entity, ai);
                break;
        }
    }
    
    private processIdle(entity: Entity, ai: AIComponent) {
        ai.idleTimer += Time.deltaTime;
        
        if (ai.idleTimer >= ai.idleTime) {
            ai.state = AIState.PATROL;
            ai.idleTimer = 0;
        }
        
        // 检查附近是否有玩家
        const nearbyPlayer = this.findNearbyPlayer(entity, ai.detectionRange);
        if (nearbyPlayer) {
            ai.state = AIState.CHASE;
            ai.target = nearbyPlayer;
        }
    }
    
    private processPatrol(entity: Entity, ai: AIComponent, position: PositionComponent) {
        // 简单的来回巡逻
        if (!ai.patrolTarget) {
            ai.patrolTarget = this.getNextPatrolPoint(ai);
        }
        
        const direction = ai.patrolTarget.subtract(position);
        const distance = direction.length();
        
        if (distance < 10) {
            ai.patrolTarget = this.getNextPatrolPoint(ai);
        } else {
            const normalized = direction.normalize();
            position.x += normalized.x * ai.moveSpeed * Time.deltaTime;
            position.y += normalized.y * ai.moveSpeed * Time.deltaTime;
        }
    }
}
```

**适用场景：**
- 全局游戏逻辑系统
- 胜负判断系统
- UI更新系统
- 不依赖特定实体的处理

### 3. IntervalSystem - 间隔执行系统

不是每帧都执行，而是按指定间隔执行的系统，适合不需要高频更新的逻辑。

```typescript
import { IntervalSystem, Matcher } from '@esengine/ecs-framework';

class SpawnSystem extends IntervalSystem {
    private spawnPoints: { x: number; y: number }[] = [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 400, y: 500 }
    ];
    
    // 每2秒执行一次
    constructor() {
        // IntervalSystem需要指定Matcher和间隔时间
        super(Matcher.empty().all(SpawnerComponent), 2.0);
    }
    
    // 间隔执行的逻辑（重写process方法）
    protected process(entities: Entity[]) {
        // entities就是匹配的生成器实体
        
        for (const spawner of entities) {
            const spawnerComp = spawner.getComponent(SpawnerComponent);
            
            if (this.shouldSpawn(spawnerComp)) {
                this.spawnEnemy(spawner, spawnerComp);
            }
        }
    }
    
    private shouldSpawn(spawner: SpawnerComponent): boolean {
        // 检查是否应该生成
        const currentEnemyCount = this.getCurrentEnemyCount();
        return currentEnemyCount < spawner.maxEnemies && 
               Math.random() < spawner.spawnChance;
    }
    
    private spawnEnemy(spawnerEntity: Entity, spawner: SpawnerComponent) {
        // 随机选择生成点
        const spawnPoint = this.spawnPoints[
            Math.floor(Math.random() * this.spawnPoints.length)
        ];
        
        // 创建敌人实体
        const enemy = this.scene.createEntity("Enemy");
        enemy.addComponent(new PositionComponent(spawnPoint.x, spawnPoint.y));
        enemy.addComponent(new HealthComponent(50));
        enemy.addComponent(new AIComponent());
        enemy.addComponent(new VelocityComponent(0, 0));
        enemy.tag = EntityTags.ENEMY;
        
        // 更新生成器统计
        spawner.spawnedCount++;
        spawner.lastSpawnTime = Time.totalTime;
        
        // 发送生成事件
        const eventBus = this.scene.entityManager.eventBus;
        eventBus.emit('enemy:spawned', {
            enemyId: enemy.id,
            spawnPoint: spawnPoint,
            spawnerEntity: spawnerEntity.id
        });
    }
}
```

**适用场景：**
- 敌人生成系统
- 自动保存系统
- 资源回收系统
- 定期数据同步

### 4. PassiveSystem - 被动系统

不主动遍历实体，而是响应事件的系统。

```typescript
import { PassiveSystem, Matcher, Core } from '@esengine/ecs-framework';

class ScoreSystem extends PassiveSystem {
    private score: number = 0;
    private multiplier: number = 1;
    private combo: number = 0;
    
    constructor() {
        // PassiveSystem也需要Matcher，即使不使用
        super(Matcher.empty());
    }
    
    initialize() {
        super.initialize();
        
        // 监听游戏事件（使用EntityManager的事件系统）
        const eventBus = this.scene.entityManager.eventBus;
        eventBus.on('enemy:killed', this.onEnemyKilled, { context: this });
        eventBus.on('item:collected', this.onItemCollected, { context: this });
        eventBus.on('combo:broken', this.onComboBroken, { context: this });
    }
    
    // PassiveSystem被移除时清理
    destroy() {
        // 事件监听会在系统销毁时自动清理
        // 如需手动清理，可以保存listenerId并调用eventBus.off()
    }
    
    private onEnemyKilled(data: { enemyType: string; position: { x: number; y: number } }) {
        // 根据敌人类型给分
        let baseScore = this.getScoreForEnemyType(data.enemyType);
        
        // 连击奖励
        this.combo++;
        if (this.combo > 3) {
            this.multiplier = Math.min(this.combo * 0.1, 3.0); // 最多3倍
        }
        
        const finalScore = Math.floor(baseScore * this.multiplier);
        this.addScore(finalScore);
        
        // 显示分数奖励
        this.showScorePopup(data.position, finalScore);
    }
    
    private addScore(points: number) {
        this.score += points;
        
        // 发送分数更新事件
        const eventBus = this.scene.entityManager.eventBus;
        eventBus.emit('score:updated', {
            score: this.score,
            points: points,
            multiplier: this.multiplier,
            combo: this.combo
        });
    }
}
```

**适用场景：**
- 分数统计系统
- 音效播放系统
- UI更新系统
- 成就系统

## 系统管理和注册

### 在场景中添加系统

```typescript
import { Scene, Core } from '@esengine/ecs-framework';

const scene = new Scene();

// 添加各种系统（使用addEntityProcessor方法）
scene.addEntityProcessor(new MovementSystem());
scene.addEntityProcessor(new GameLogicSystem());
scene.addEntityProcessor(new SpawnSystem());
scene.addEntityProcessor(new ScoreSystem());

// 设置系统的执行优先级
const movementSystem = scene.getEntityProcessor(MovementSystem);
if (movementSystem) {
    movementSystem.updateOrder = 10; // 数值越小越先执行
}

const renderSystem = scene.getEntityProcessor(RenderSystem);
if (renderSystem) {
    renderSystem.updateOrder = 100; // 渲染系统最后执行
}

// 设置为当前场景
Core.scene = scene;
```

### 系统的启用和禁用

```typescript
// 暂时禁用某个系统
const gameLogicSystem = scene.getEntityProcessor(GameLogicSystem);
if (gameLogicSystem) {
    gameLogicSystem.enabled = false;
}

// 重新启用
if (gameLogicSystem) {
    gameLogicSystem.enabled = true;
}

// 移除系统
scene.removeEntityProcessor(gameLogicSystem);
```

## 系统设计最佳实践

### 1. 单一职责原则

```typescript
// ✅ 好的设计：每个系统只负责一件事
class MovementSystem extends EntitySystem {
    // 只负责移动
}

class CollisionSystem extends EntitySystem {
    // 只负责碰撞检测
}

class RenderSystem extends EntitySystem {
    // 只负责渲染
}

// ❌ 不好的设计：一个系统做太多事情
class GameplaySystem extends EntitySystem {
    // 既处理移动，又处理碰撞，还处理渲染...
}
```

### 2. 合理的系统执行顺序

```typescript
// 设置合理的执行顺序
scene.addEntityProcessor(new InputSystem()).updateOrder = 0;    // 输入最先
scene.addEntityProcessor(new GameLogicSystem()).updateOrder = 10;     // 游戏逻辑
scene.addEntityProcessor(new MovementSystem()).updateOrder = 20; // 移动计算
scene.addEntityProcessor(new CollisionSystem()).updateOrder = 30; // 碰撞检测
scene.addEntityProcessor(new HealthSystem()).updateOrder = 40;  // 生命值处理
scene.addEntityProcessor(new RenderSystem()).updateOrder = 100; // 渲染最后
```

### 3. 系统间通信

```typescript
// 使用事件进行系统间通信
class CollisionSystem extends EntitySystem {
    process(entities: Entity[]) {
        // ... 碰撞检测逻辑
        
        if (collision) {
            // 发送碰撞事件，让其他系统响应
            const eventBus = this.scene.entityManager.eventBus;
            eventBus.emit('collision:detected', {
                entity1: collider1,
                entity2: collider2,
                collisionPoint: point
            });
        }
    }
}

class HealthSystem extends PassiveSystem {
    onAddedToScene() {
        // 监听碰撞事件
        const eventBus = this.scene.entityManager.eventBus;
        eventBus.on('collision:detected', this.onCollision, { context: this });
    }
    
    private onCollision(data: CollisionEventData) {
        // 处理碰撞伤害
        if (data.entity1.hasComponent(HealthComponent)) {
            const health = data.entity1.getComponent(HealthComponent);
            health.takeDamage(10);
        }
    }
}
```

### 4. 性能优化

```typescript
class OptimizedMovementSystem extends EntitySystem {
    private lastUpdateTime: number = 0;
    private readonly UPDATE_INTERVAL = 16; // 60FPS
    
    process(entities: Entity[]) {
        const currentTime = Time.totalTime;
        
        // 限制更新频率
        if (currentTime - this.lastUpdateTime < this.UPDATE_INTERVAL) {
            return;
        }
        
        // 批量处理
        this.processBatch(entities);
        
        this.lastUpdateTime = currentTime;
    }
    
    private processBatch(entities: Entity[]) {
        // 使用for循环而不是forEach，性能更好
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            // 处理逻辑...
        }
    }
}
```

## 常见问题

### Q: 系统的执行顺序重要吗？

A: 非常重要！合理的执行顺序可以避免逻辑错误：

```typescript
// 正确顺序：
// 1. 输入系统（收集玩家输入）
// 2. AI系统（敌人决策）
// 3. 移动系统（更新位置）
// 4. 碰撞系统（检测碰撞）
// 5. 渲染系统（显示画面）
```

### Q: 什么时候使用哪种系统类型？

A: 
- **EntitySystem** - 大部分游戏逻辑（移动、AI、碰撞等）
- **ProcessingSystem** - 复杂的单实体处理（复杂AI、粒子系统）
- **IntervalSystem** - 不需要每帧执行的逻辑（生成器、自动保存）
- **PassiveSystem** - 事件响应系统（分数、音效、UI更新）

### Q: 系统可以访问其他系统吗？

A: 不建议直接访问。推荐使用事件系统进行系统间通信，保持松耦合。

### Q: 如何调试系统性能？

A: 使用框架内置的性能监控：

```typescript
const monitor = PerformanceMonitor.instance;
monitor.startFrame('MovementSystem');
// 系统逻辑...
monitor.endFrame('MovementSystem');

// 查看性能报告
console.log(monitor.getReport());
```

通过合理使用这些系统类型，你可以构建出高性能、易维护的游戏逻辑！ 