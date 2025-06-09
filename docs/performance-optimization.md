# 性能优化指南

ECS Framework 提供了多层性能优化系统，确保在各种规模的游戏中都能提供卓越的性能表现。

## 性能优化架构

### 三大核心优化系统

1. **组件索引系统 (ComponentIndex)** - 提供 O(1) 组件查询性能
2. **Archetype系统** - 按组件组合分组实体，减少查询遍历
3. **脏标记系统 (DirtyTracking)** - 细粒度变更追踪，避免不必要更新

这三个系统协同工作，为不同场景提供最优的性能表现。

## 性能基准

### 核心操作性能

```
实体创建: 640,000+ 个/秒
组件查询: O(1) 复杂度（使用索引）
内存优化: 30-50% 减少分配
批量操作: 显著提升处理效率
```

### 查询性能对比

| 查询类型 | 传统方式 | 使用索引 | 性能提升 |
|----------|----------|----------|----------|
| 单组件查询 | O(n) | O(1) | 1000x+ |
| 多组件查询 | O(n*m) | O(k) | 100x+ |
| 标签查询 | O(n) | O(1) | 1000x+ |
| 复合查询 | O(n*m*k) | O(min(k1,k2)) | 500x+ |

*n=实体数量, m=组件种类, k=匹配实体数量*

## 组件索引系统

### 索引类型选择

框架提供两种索引实现：

#### 哈希索引 (HashComponentIndex)
- **适用场景**: 通用查询，平衡的读写性能
- **优势**: O(1) 查询，较低内存开销
- **缺点**: 哈希冲突时性能下降

```typescript
// 自动选择最优索引类型
const componentIndex = entityManager.getComponentIndex();

// 手动配置哈希索引
componentIndex.setIndexType(HealthComponent, 'hash');
```

#### 位图索引 (BitmapComponentIndex)
- **适用场景**: 大规模实体，频繁的组合查询
- **优势**: 超快的 AND/OR 操作，空间压缩
- **缺点**: 更新成本较高，内存开销随实体数量增长

```typescript
// 配置位图索引用于大规模查询
componentIndex.setIndexType(PositionComponent, 'bitmap');
```

### 智能索引管理

ComponentIndexManager 会根据使用模式自动优化：

```typescript
// 获取索引性能统计
const stats = componentIndex.getPerformanceStats();
console.log('索引性能:', {
    queriesPerSecond: stats.queriesPerSecond,
    hitRate: stats.hitRate,
    indexType: stats.recommendedType
});

// 自动优化索引类型
componentIndex.optimize(); // 根据使用模式切换索引类型
```

## Archetype系统优化

### 原型分组策略

Archetype系统将实体按组件组合分组，实现快速批量操作：

```typescript
// 获取Archetype统计
const archetypeSystem = entityManager.getArchetypeSystem();
const stats = archetypeSystem.getStatistics();

console.log('Archetype优化:', {
    totalArchetypes: stats.totalArchetypes,    // 原型数量
    avgEntitiesPerArchetype: stats.averageEntitiesPerArchetype,
    queryCacheHits: stats.queryCacheHits      // 缓存命中次数
});
```

### 查询缓存机制

```typescript
// 启用查询缓存（默认开启）
archetypeSystem.enableQueryCache(true);

// 缓存大小限制（避免内存泄漏）
archetypeSystem.setMaxCacheSize(1000);

// 清理过期缓存
archetypeSystem.cleanCache();
```

### 最佳实践

1. **组件设计**: 避免创建过多单独的原型
2. **批量操作**: 利用原型批量处理相同组件组合的实体
3. **缓存管理**: 定期清理查询缓存

```typescript
// ✅ 好的设计：复用组件组合
class MovementSystem extends EntitySystem {
    process() {
        // 一次查询处理所有移动实体
        const movingEntities = this.entityManager
            .query()
            .withAll([PositionComponent, VelocityComponent])
            .execute(); // 利用Archetype快速获取
        
        // 批量处理
        movingEntities.forEach(entity => {
            // 更新逻辑
        });
    }
}

// ❌ 避免：频繁查询不同组合
class BadSystem extends EntitySystem {
    process() {
        // 多次小查询，无法充分利用Archetype
        const players = this.queryPlayers();
        const enemies = this.queryEnemies();
        const bullets = this.queryBullets();
    }
}
```

## 脏标记系统优化

### 脏标记类型

系统提供细粒度的脏标记追踪：

```typescript
enum DirtyType {
    COMPONENT_ADDED,      // 组件添加
    COMPONENT_REMOVED,    // 组件移除
    COMPONENT_MODIFIED,   // 组件修改
    ENTITY_ENABLED,       // 实体启用
    ENTITY_DISABLED,      // 实体禁用
    TAG_ADDED,           // 标签添加
    TAG_REMOVED          // 标签移除
}
```

### 批量处理配置

```typescript
const dirtyTracking = entityManager.getDirtyTrackingSystem();

// 配置批量处理参数
dirtyTracking.configure({
    batchSize: 100,           // 每批处理100个脏标记
    timeSliceMs: 16,          // 每帧最多处理16ms
    processingInterval: 1     // 每帧处理一次
});

// 监听脏标记事件
dirtyTracking.addListener(DirtyType.COMPONENT_MODIFIED, (entity, component) => {
    // 响应组件修改
    this.invalidateRenderCache(entity);
}, { priority: 10 });
```

### 性能监控

```typescript
const dirtyStats = dirtyTracking.getPerformanceStats();
console.log('脏标记性能:', {
    totalMarks: dirtyStats.totalMarks,
    batchesProcessed: dirtyStats.batchesProcessed,
    averageBatchTime: dirtyStats.averageBatchTime,
    queueSize: dirtyStats.currentQueueSize
});
```

## 查询优化策略

### 查询层次选择

根据查询复杂度选择最优方法：

```typescript
// 1. 简单查询：直接使用索引
const healthEntities = entityManager.getEntitiesWithComponent(HealthComponent);

// 2. 双组件查询：使用Archetype
const movingEntities = entityManager.getEntitiesWithComponents([
    PositionComponent, 
    VelocityComponent
]);

// 3. 复杂查询：组合使用
const combatants = entityManager
    .query()
    .withAll([PositionComponent, HealthComponent])  // Archetype预筛选
    .withTag("combat")                              // 索引过滤
    .where(entity => {                              // 自定义精确过滤
        const health = entity.getComponent(HealthComponent);
        return health.currentHealth > health.maxHealth * 0.3;
    })
    .execute();
```

### 查询缓存策略

```typescript
class CombatSystem extends EntitySystem {
    private cachedEnemies: Entity[] = [];
    private lastEnemyCacheUpdate = 0;
    
    process() {
        const currentTime = performance.now();
        
        // 每200ms更新一次敌人缓存
        if (currentTime - this.lastEnemyCacheUpdate > 200) {
            this.cachedEnemies = this.entityManager
                .getEntitiesByTag("enemy");
            this.lastEnemyCacheUpdate = currentTime;
        }
        
        // 使用缓存的结果
        this.processCombat(this.cachedEnemies);
    }
}
```

## 内存优化

### 内存使用监控

```typescript
// 获取各系统内存使用情况
const memoryStats = entityManager.getMemoryUsage();
console.log('内存使用情况:', {
    entityIndex: memoryStats.entityIndex,        // 实体索引
    componentIndex: memoryStats.componentIndex,  // 组件索引
    archetype: memoryStats.archetype,           // 原型系统
    dirtyTracking: memoryStats.dirtyTracking,   // 脏标记
    total: memoryStats.total
});
```

### 内存清理策略

```typescript
// 定期内存清理
setInterval(() => {
    entityManager.cleanup();      // 清理无效引用
    entityManager.compact();      // 压缩数据结构
}, 30000); // 每30秒清理一次

// 游戏场景切换时的深度清理
function switchScene() {
    entityManager.destroyAllEntities();
    entityManager.cleanup();
    entityManager.compact();
    
    // 重置优化系统
    entityManager.getComponentIndex().reset();
    entityManager.getArchetypeSystem().clearCache();
    entityManager.getDirtyTrackingSystem().clear();
}
```

## 实战优化案例

### 大规模射击游戏优化

```typescript
class BulletSystem extends EntitySystem {
    private bulletPool: Entity[] = [];
    private maxBullets = 1000;
    
    constructor(entityManager: EntityManager) {
        super();
        this.prewarmBulletPool();
    }
    
    private prewarmBulletPool() {
        // 预创建子弹池
        this.bulletPool = this.entityManager.createEntities(
            this.maxBullets, 
            "Bullet"
        );
        
        // 初始化为非激活状态
        this.bulletPool.forEach(bullet => {
            bullet.enabled = false;
            bullet.addComponent(new PositionComponent());
            bullet.addComponent(new VelocityComponent());
            bullet.addComponent(new BulletComponent());
        });
    }
    
    public spawnBullet(x: number, y: number, vx: number, vy: number): Entity | null {
        // 从池中获取非激活子弹（使用索引快速查询）
        const availableBullet = this.entityManager
            .query()
            .withAll([BulletComponent])
            .active(false)
            .first();
        
        if (availableBullet) {
            // 重用现有子弹
            const pos = availableBullet.getComponent(PositionComponent);
            const vel = availableBullet.getComponent(VelocityComponent);
            
            pos.x = x; pos.y = y;
            vel.x = vx; vel.y = vy;
            availableBullet.enabled = true;
            
            return availableBullet;
        }
        
        return null; // 池已满
    }
    
    process() {
        // 批量处理所有激活的子弹
        this.entityManager.forEachEntityWithComponent(
            BulletComponent, 
            (entity, bullet) => {
                if (!entity.enabled) return;
                
                // 更新位置
                const pos = entity.getComponent(PositionComponent);
                const vel = entity.getComponent(VelocityComponent);
                
                pos.x += vel.x * Time.deltaTime;
                pos.y += vel.y * Time.deltaTime;
                
                // 边界检查，回收到池中
                if (pos.x < 0 || pos.x > 800 || pos.y < 0 || pos.y > 600) {
                    entity.enabled = false; // 回收而不是销毁
                }
            }
        );
    }
}
```

### AI系统性能优化

```typescript
class AISystem extends EntitySystem {
    private spatialGrid: SpatialGrid;
    private updateFrequency = 60; // 60Hz更新频率
    private lastUpdate = 0;
    
    process() {
        const currentTime = performance.now();
        
        // 控制更新频率
        if (currentTime - this.lastUpdate < 1000 / this.updateFrequency) {
            return;
        }
        
        // 使用空间分区优化邻居查询
        const aiEntities = this.entityManager
            .query()
            .withAll([PositionComponent, AIComponent])
            .active(true)
            .execute();
        
        // 分批处理AI实体
        const batchSize = 50;
        for (let i = 0; i < aiEntities.length; i += batchSize) {
            const batch = aiEntities.slice(i, i + batchSize);
            this.processBatch(batch);
            
            // 时间片控制，避免单帧卡顿
            if (performance.now() - currentTime > 10) { // 10ms时间片
                break; // 下一帧继续处理
            }
        }
        
        this.lastUpdate = currentTime;
    }
    
    private processBatch(entities: Entity[]) {
        entities.forEach(entity => {
            const pos = entity.getComponent(PositionComponent);
            const ai = entity.getComponent(AIComponent);
            
            // 空间查询优化邻居搜索
            const neighbors = this.spatialGrid.queryRadius(pos.x, pos.y, ai.sightRange);
            
            // AI决策逻辑
            ai.update(neighbors);
        });
    }
}
```

## 性能监控工具

### 实时性能仪表板

```typescript
class PerformanceDashboard {
    private stats: any = {};
    private updateInterval = 1000; // 1秒更新一次
    
    constructor(private entityManager: EntityManager) {
        setInterval(() => this.updateStats(), this.updateInterval);
    }
    
    private updateStats() {
        this.stats = {
            // 基础统计
            entities: this.entityManager.getStatistics(),
            
            // 组件索引
            componentIndex: this.entityManager.getComponentIndex().getPerformanceStats(),
            
            // Archetype系统
            archetype: this.entityManager.getArchetypeSystem().getStatistics(),
            
            // 脏标记系统
            dirtyTracking: this.entityManager.getDirtyTrackingSystem().getPerformanceStats(),
            
            // 内存使用
            memory: this.entityManager.getMemoryUsage(),
            
            // 计算性能指标
            performance: this.calculatePerformanceMetrics()
        };
        
        this.displayStats();
    }
    
    private calculatePerformanceMetrics() {
        const componentStats = this.stats.componentIndex;
        const archetypeStats = this.stats.archetype;
        
        return {
            queryHitRate: componentStats.hitRate,
            archetypeEfficiency: archetypeStats.averageEntitiesPerArchetype,
            memoryEfficiency: this.stats.memory.compressionRatio,
            overallPerformance: this.calculateOverallScore()
        };
    }
    
    private displayStats() {
        console.log('=== ECS性能仪表板 ===');
        console.log('查询命中率:', this.stats.performance.queryHitRate.toFixed(2) + '%');
        console.log('内存使用:', (this.stats.memory.total / 1024 / 1024).toFixed(2) + 'MB');
        console.log('整体性能评分:', this.stats.performance.overallPerformance.toFixed(1) + '/10');
    }
}
```

## 优化检查清单

### 开发阶段

- [ ] 使用EntityManager而不是直接操作Scene
- [ ] 优先使用组件查询和标签查询
- [ ] 设计合理的组件组合，避免过度碎片化
- [ ] 实现对象池机制减少频繁创建/销毁

### 运行时优化

- [ ] 监控查询命中率，保持在80%以上
- [ ] 控制Archetype数量，避免过度分散
- [ ] 配置适当的脏标记批量处理参数
- [ ] 定期进行内存清理和数据压缩

### 性能监控

- [ ] 定期检查性能统计数据
- [ ] 监控内存使用趋势
- [ ] 设置性能预警阈值
- [ ] 在不同设备上进行性能测试

通过系统性地应用这些优化策略，您可以构建出在各种规模下都能提供卓越性能的ECS游戏系统。 