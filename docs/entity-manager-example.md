# EntityManager 使用指南

EntityManager 是 ECS Framework 的核心管理系统，提供统一的实体管理、高性能查询和自动优化功能。

## 快速开始

### 创建实体管理器

```typescript
import { EntityManager, Scene } from '@esengine/ecs-framework';

// 通常在游戏管理器中创建
const scene = new Scene();
const entityManager = new EntityManager(scene);
```

### 基础实体操作

```typescript
// 创建单个实体
const player = entityManager.createEntity("Player");
player.addComponent(new PositionComponent(100, 100));
player.addComponent(new HealthComponent(100));
player.tag = "player";

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

// 销毁实体
entityManager.destroyEntity(player);
```

## 高性能查询系统

EntityManager 提供多种查询方式，自动选择最优的查询策略。

### 基础查询

```typescript
// 通过ID查询（O(1)）
const entity = entityManager.getEntity(123);

// 通过名称查询（O(1) 哈希查找）
const player = entityManager.getEntityByName("Player");

// 通过标签查询（O(1) 索引查找）
const enemies = entityManager.getEntitiesByTag("enemy");

// 组件查询（使用O(1)组件索引）
const healthEntities = entityManager.getEntitiesWithComponent(HealthComponent);

// 多组件查询（使用Archetype优化）
const movingEntities = entityManager.getEntitiesWithComponents([
    PositionComponent, 
    VelocityComponent
]);
```

### 流式查询API

EntityManager 提供强大的流式查询构建器：

```typescript
// 基础查询构建
const results = entityManager
    .query()
    .withAll([PositionComponent, HealthComponent])  // 必须包含这些组件
    .withoutTag("dead")                             // 不能有死亡标签
    .active(true)                                   // 必须激活
    .execute();

// 复杂条件查询
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

// 查询变体
const firstEnemy = entityManager
    .query()
    .withTag("enemy")
    .first();                                       // 获取第一个匹配

const enemyCount = entityManager
    .query()
    .withTag("enemy")
    .count();                                       // 获取数量

// 直接处理查询结果
entityManager
    .query()
    .withAll([HealthComponent])
    .forEach(entity => {
        const health = entity.getComponent(HealthComponent);
        if (health.currentHealth <= 0) {
            entity.addTag("dead");
        }
    });
```

### 高级查询选项

```typescript
// 组合条件查询
const combatUnits = entityManager
    .query()
    .withAll([PositionComponent, HealthComponent])   // AND条件
    .withAny([WeaponComponent, MagicComponent])      // OR条件
    .without([DeadComponent])                        // NOT条件
    .withTag("combatant")
    .withoutTag("peaceful")
    .active(true)
    .enabled(true)
    .execute();

// 使用自定义过滤器
const nearbyEnemies = entityManager
    .query()
    .withAll([PositionComponent])
    .withTag("enemy")
    .where(entity => {
        const pos = entity.getComponent(PositionComponent);
        const distance = Math.sqrt(
            Math.pow(pos.x - playerPos.x, 2) + 
            Math.pow(pos.y - playerPos.y, 2)
        );
        return distance < 100; // 距离玩家100像素内
    })
    .execute();
```

## 批量操作

EntityManager 提供高效的批量操作方法：

```typescript
// 遍历所有实体
entityManager.forEachEntity(entity => {
    // 处理每个实体
    if (entity.position.x < 0) {
        entity.position.x = 0;
    }
});

// 遍历特定组件的实体
entityManager.forEachEntityWithComponent(HealthComponent, (entity, health) => {
    if (health.currentHealth <= 0) {
        entity.addTag("dead");
        entity.enabled = false;
    }
});

// 批量创建并配置实体
const bullets = entityManager.createEntities(100, "Bullet", (bullet, index) => {
    bullet.addComponent(new PositionComponent(
        100 + index * 10, 
        100
    ));
    bullet.addComponent(new VelocityComponent(0, -200));
    bullet.tag = "projectile";
});
```

## 性能优化系统

EntityManager 内置了三个性能优化系统：

### 1. 组件索引系统

自动为组件查询提供O(1)性能：

```typescript
// 获取组件索引统计
const componentIndex = entityManager.getComponentIndex();
const stats = componentIndex.getPerformanceStats();

console.log('组件索引统计:', {
    totalQueries: stats.totalQueries,
    indexHits: stats.indexHits,
    hitRate: (stats.indexHits / stats.totalQueries * 100).toFixed(2) + '%'
});

// 手动优化（通常自动进行）
componentIndex.optimize();
```

### 2. Archetype系统

按组件组合分组实体，优化批量查询：

```typescript
// 获取Archetype统计
const archetypeSystem = entityManager.getArchetypeSystem();
const archetypeStats = archetypeSystem.getStatistics();

console.log('Archetype统计:', {
    totalArchetypes: archetypeStats.totalArchetypes,
    totalEntities: archetypeStats.totalEntities,
    queryCacheSize: archetypeStats.queryCacheSize
});

// 查看所有原型
console.log('当前原型:', archetypeSystem.getAllArchetypes());
```

### 3. 脏标记系统

追踪实体变更，避免不必要的更新：

```typescript
// 获取脏标记统计
const dirtyTracking = entityManager.getDirtyTrackingSystem();
const dirtyStats = dirtyTracking.getPerformanceStats();

console.log('脏标记统计:', {
    totalMarks: dirtyStats.totalMarks,
    batchesProcessed: dirtyStats.batchesProcessed,
    listenersNotified: dirtyStats.listenersNotified
});

// 手动处理脏标记
dirtyTracking.processDirtyMarks();
```

## 实体管理器统计

获取EntityManager的综合性能数据：

```typescript
const stats = entityManager.getStatistics();

console.log('EntityManager统计:', {
    // 基础统计
    entityCount: stats.entityCount,
    activeEntityCount: stats.activeEntityCount,
    
    // 查询统计
    totalQueries: stats.totalQueries,
    indexHits: stats.indexHits,
    archetypeHits: stats.archetypeHits,
    
    // 性能指标
    averageQueryTime: stats.averageQueryTime,
    hitRate: (stats.indexHits / stats.totalQueries * 100).toFixed(2) + '%'
});
```

## 系统优化和清理

```typescript
// 手动触发优化
entityManager.optimize();

// 内存清理
entityManager.cleanup();

// 压缩数据结构
entityManager.compact();

// 获取内存使用情况
const memoryStats = entityManager.getMemoryUsage();
console.log('内存使用:', {
    entityIndexSize: memoryStats.entityIndex,
    componentIndexSize: memoryStats.componentIndex,
    archetypeSize: memoryStats.archetype
});
```

## 实际使用案例

### 游戏系统集成

```typescript
class MovementSystem extends EntitySystem {
    private entityManager: EntityManager;
    
    constructor(scene: Scene) {
        super();
        this.entityManager = new EntityManager(scene);
    }
    
    protected process(entities: Entity[]): void {
        // 使用高效查询获取移动实体
        const movingEntities = this.entityManager
            .query()
            .withAll([PositionComponent, VelocityComponent])
            .active(true)
            .execute();
        
        // 批量处理
        movingEntities.forEach(entity => {
            const position = entity.getComponent(PositionComponent);
            const velocity = entity.getComponent(VelocityComponent);
            
            position.x += velocity.dx * Time.deltaTime;
            position.y += velocity.dy * Time.deltaTime;
        });
    }
}
```

### 复杂查询示例

```typescript
// 战斗系统：查找攻击范围内的敌人
class CombatSystem {
    private entityManager: EntityManager;
    
    findTargetsInRange(attacker: Entity, range: number): Entity[] {
        const attackerPos = attacker.getComponent(PositionComponent);
        if (!attackerPos) return [];
        
        return this.entityManager
            .query()
            .withAll([PositionComponent, HealthComponent])
            .withTag("enemy")
            .withoutTag("dead")
            .where(entity => {
                const pos = entity.getComponent(PositionComponent);
                const distance = Math.sqrt(
                    Math.pow(pos.x - attackerPos.x, 2) + 
                    Math.pow(pos.y - attackerPos.y, 2)
                );
                return distance <= range;
            })
            .execute();
    }
    
    // 优化版本：使用空间分区（如果实现了的话）
    findTargetsInRangeOptimized(attacker: Entity, range: number): Entity[] {
        // 首先通过空间查询缩小范围
        const nearbyEntities = this.spatialIndex.queryRange(
            attackerPos.x - range, 
            attackerPos.y - range,
            attackerPos.x + range, 
            attackerPos.y + range
        );
        
        // 然后使用EntityManager进行精确过滤
        return this.entityManager
            .query()
            .withAll([HealthComponent])
            .withTag("enemy")
            .withoutTag("dead")
            .where(entity => nearbyEntities.includes(entity))
            .execute();
    }
}
```

## 性能建议

### 查询优化

1. **利用索引**: 优先使用组件查询和标签查询，它们具有O(1)性能
2. **减少自定义过滤**: `where()`条件虽然灵活，但会降低性能
3. **缓存查询结果**: 对于不经常变化的查询结果，考虑缓存

```typescript
// ✅ 推荐：使用索引查询
const enemies = entityManager.getEntitiesByTag("enemy");

// ⚠️ 谨慎：自定义过滤
const enemies = entityManager
    .query()
    .where(entity => entity.name.includes("Enemy"))
    .execute();
```

### 批量操作优化

```typescript
// ✅ 推荐：批量创建
const bullets = entityManager.createEntities(100, "Bullet");

// ❌ 避免：循环单独创建
for (let i = 0; i < 100; i++) {
    entityManager.createEntity("Bullet");
}
```

### 内存管理

```typescript
// 定期清理
setInterval(() => {
    entityManager.cleanup();
}, 30000); // 每30秒清理一次

// 监控性能
const stats = entityManager.getStatistics();
if (stats.indexHits / stats.totalQueries < 0.8) {
    console.warn('查询命中率较低，考虑优化查询策略');
}
```

## 总结

EntityManager 提供了：

- **统一接口**: 所有实体操作通过一个管理器完成
- **自动优化**: 内置三个性能优化系统
- **灵活查询**: 从简单的ID查找到复杂的条件查询
- **性能监控**: 完整的统计和诊断信息
- **批量操作**: 高效的批量处理能力

通过合理使用EntityManager，您可以构建高性能、可维护的ECS游戏系统。 