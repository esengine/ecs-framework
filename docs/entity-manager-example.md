# EntityManager 使用指南

本文档详细介绍 EntityManager 的使用方法和最佳实践。

## 目录

1. [基础用法](#基础用法)
2. [查询系统](#查询系统)
3. [实体管理](#实体管理)
4. [性能监控](#性能监控)
5. [最佳实践](#最佳实践)

## 基础用法

### 创建 EntityManager

```typescript
import { EntityManager, Scene } from '@esengine/ecs-framework';

// 创建场景和实体管理器
const scene = new Scene();
const entityManager = new EntityManager();

// 批量创建实体（使用Scene方法）
const enemies = scene.createEntities(50, "Enemy");

// 为实体添加组件
enemies.forEach((enemy, index) => {
    enemy.addComponent(new PositionComponent(
        Math.random() * 800, 
        Math.random() * 600
    ));
    enemy.addComponent(new HealthComponent(100));
    enemy.addComponent(new VelocityComponent(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
    ));
    enemy.tag = 2; // 敌人标签
});
```

## 查询系统

### 基础查询

```typescript
// 按组件类型查询
const healthEntities = entityManager.getEntitiesWithComponent(HealthComponent);

// 按标签查询
const enemies = entityManager.getEntitiesByTag(2);
const players = entityManager.getEntitiesByTag(1);

// 按名称查询
const boss = entityManager.getEntityByName("BossEnemy");

// 获取所有实体
const allEntities = entityManager.getAllEntities();
```

### 流式查询 API

```typescript
// 复杂查询条件
const movingEnemies = entityManager
    .query()
    .withAll(PositionComponent, VelocityComponent, HealthComponent)
    .withTag(2) // 敌人标签
    .execute();

// 查询活跃的玩家
const activePlayers = entityManager
    .query()
    .withAll(PositionComponent)
    .withTag(1) // 玩家标签
    .active() // 只查询活跃实体
    .execute();

// 排除特定组件的实体
const nonCombatEntities = entityManager
    .query()
    .withAll(PositionComponent)
    .without(WeaponComponent, HealthComponent)
    .execute();

// 自定义条件查询
const nearbyEnemies = entityManager
    .query()
    .withAll(PositionComponent)
    .withTag(2)
    .where(entity => {
        const pos = entity.getComponent(PositionComponent);
        return pos && Math.abs(pos.x - playerX) < 100;
    })
    .execute();
```

## 实体管理

### 创建和销毁实体

```typescript
// 创建单个实体
const player = entityManager.createEntity("Player");
player.addComponent(new PositionComponent(400, 300));
player.addComponent(new HealthComponent(100));
player.tag = 1;

// 销毁实体
entityManager.destroyEntity(player);

// 按名称销毁
entityManager.destroyEntity("Enemy_1");

// 按ID销毁
entityManager.destroyEntity(123);
```

### 实体查找

```typescript
// 按ID查找
const entity = entityManager.getEntity(123);

// 按名称查找
const player = entityManager.getEntityByName("Player");

// 检查实体是否存在
if (entity && !entity.isDestroyed) {
    // 实体有效
}
```

## 性能监控

### 基础统计

```typescript
// 获取实体数量
console.log('总实体数:', entityManager.entityCount);
console.log('活跃实体数:', entityManager.activeEntityCount);

// 获取场景统计
const sceneStats = scene.getStats();
console.log('场景统计:', {
    实体数量: sceneStats.entityCount,
    系统数量: sceneStats.processorCount
});

// 获取查询系统统计
const queryStats = scene.querySystem.getStats();
console.log('查询统计:', queryStats);
```

## 最佳实践

### 1. 高效查询

```typescript
// ✅ 好的做法：缓存查询结果
class CombatSystem extends EntitySystem {
    private cachedEnemies: Entity[] = [];
    private lastUpdateFrame = 0;
    
    protected process(entities: Entity[]): void {
        // 每5帧更新一次缓存
        if (Time.frameCount - this.lastUpdateFrame > 5) {
            this.cachedEnemies = this.entityManager
                .query()
                .withAll(PositionComponent, HealthComponent)
                .withTag(2)
                .execute();
            this.lastUpdateFrame = Time.frameCount;
        }
        
        // 使用缓存的结果
        this.cachedEnemies.forEach(enemy => {
            // 处理敌人逻辑
        });
    }
}
```

### 2. 批量操作

```typescript
// ✅ 好的做法：批量创建和配置
function createBulletWave(count: number): Entity[] {
    // 使用Scene的批量创建
    const bullets = scene.createEntities(count, "Bullet");
    
    // 批量配置组件
    bullets.forEach((bullet, index) => {
        const angle = (index / count) * Math.PI * 2;
        bullet.addComponent(new PositionComponent(400, 300));
        bullet.addComponent(new VelocityComponent(
            Math.cos(angle) * 200,
            Math.sin(angle) * 200
        ));
        bullet.addComponent(new BulletComponent());
        bullet.tag = 3; // 子弹标签
    });
    
    return bullets;
}
```

### 3. 内存管理

```typescript
// ✅ 好的做法：及时清理无用实体
class CleanupSystem extends EntitySystem {
    protected process(entities: Entity[]): void {
        // 清理超出边界的子弹
        const bullets = this.entityManager.getEntitiesByTag(3);
        bullets.forEach(bullet => {
            const pos = bullet.getComponent(PositionComponent);
            if (pos && (pos.x < -100 || pos.x > 900 || pos.y < -100 || pos.y > 700)) {
                this.entityManager.destroyEntity(bullet);
            }
        });
        
        // 清理死亡的敌人
        const deadEnemies = this.entityManager
            .query()
            .withAll(HealthComponent)
            .withTag(2)
            .where(entity => {
                const health = entity.getComponent(HealthComponent);
                return health && health.currentHealth <= 0;
            })
            .execute();
            
        deadEnemies.forEach(enemy => {
            this.entityManager.destroyEntity(enemy);
        });
    }
}
```

### 4. 查询优化

```typescript
// ✅ 好的做法：使用合适的查询方法
class GameSystem extends EntitySystem {
    findTargetsInRange(attacker: Entity, range: number): Entity[] {
        const attackerPos = attacker.getComponent(PositionComponent);
        if (!attackerPos) return [];
        
        // 先按标签快速筛选，再按距离过滤
        return this.entityManager
            .getEntitiesByTag(2) // 敌人标签
            .filter(enemy => {
                const enemyPos = enemy.getComponent(PositionComponent);
                if (!enemyPos) return false;
                
                const distance = Math.sqrt(
                    Math.pow(attackerPos.x - enemyPos.x, 2) + 
                    Math.pow(attackerPos.y - enemyPos.y, 2)
                );
                return distance <= range;
            });
    }
}
```

## 完整示例

```typescript
import { 
    EntityManager, 
    Scene, 
    Entity, 
    Component, 
    EntitySystem,
    Matcher 
} from '@esengine/ecs-framework';

// 组件定义
class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class HealthComponent extends Component {
    constructor(
        public maxHealth: number = 100,
        public currentHealth: number = 100
    ) {
        super();
    }
}

// 游戏管理器
class GameManager {
    private scene: Scene;
    private entityManager: EntityManager;
    
    constructor() {
        this.scene = new Scene();
        this.entityManager = new EntityManager();
        this.setupGame();
    }
    
    private setupGame(): void {
        // 创建玩家
        const player = this.entityManager.createEntity("Player");
        player.addComponent(new PositionComponent(400, 300));
        player.addComponent(new HealthComponent(100));
        player.tag = 1;
        
        // 创建敌人
        const enemies = this.scene.createEntities(10, "Enemy");
        enemies.forEach(enemy => {
            enemy.addComponent(new PositionComponent(
                Math.random() * 800,
                Math.random() * 600
            ));
            enemy.addComponent(new HealthComponent(50));
            enemy.tag = 2;
        });
        
        // 添加系统
        this.scene.addEntityProcessor(new HealthSystem());
    }
    
    public update(): void {
        this.scene.update();
        
        // 输出统计信息
        console.log('实体数量:', this.entityManager.entityCount);
        console.log('活跃实体数:', this.entityManager.activeEntityCount);
    }
}

// 生命值系统
class HealthSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }
    
    protected process(entities: Entity[]): void {
        const healthEntities = this.scene.querySystem.queryAll(HealthComponent);
        
        healthEntities.entities.forEach(entity => {
            const health = entity.getComponent(HealthComponent);
            if (health && health.currentHealth <= 0) {
                console.log(`实体 ${entity.name} 死亡`);
                entity.destroy();
            }
        });
    }
}

// 启动游戏
const game = new GameManager();
setInterval(() => game.update(), 16); // 60 FPS
```

## 总结

EntityManager 提供了强大的实体管理功能：

- **创建管理**：`createEntity()`, `destroyEntity()`
- **查询功能**：`getEntitiesWithComponent()`, `getEntitiesByTag()`, `query()`
- **实体查找**：`getEntity()`, `getEntityByName()`
- **统计信息**：`entityCount`, `activeEntityCount`

通过合理使用这些API，可以构建高性能的游戏系统。记住要及时清理无用实体，缓存频繁查询的结果，并使用合适的查询方法来优化性能。 