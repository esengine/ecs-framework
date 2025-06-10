# 性能优化指南

本文档介绍ECS框架的性能优化技术和最佳实践。

## 目录

1. [查询系统优化](#查询系统优化)
2. [实体管理优化](#实体管理优化)
3. [组件设计优化](#组件设计优化)
4. [系统设计优化](#系统设计优化)
5. [内存管理](#内存管理)
6. [性能监控](#性能监控)

## 查询系统优化

### 使用高效的查询方法

```typescript
// ✅ 推荐：使用标签查询（快速）
const enemies = entityManager.getEntitiesByTag(2);

// ✅ 推荐：使用组件查询
const healthEntities = entityManager.getEntitiesWithComponent(HealthComponent);

// ✅ 推荐：使用Scene的查询系统
const movingEntities = scene.querySystem.queryAll(PositionComponent, VelocityComponent);

// ⚠️ 谨慎：自定义条件查询（较慢）
const nearbyEnemies = entityManager
    .query()
    .withAll(PositionComponent)
    .where(entity => {
        const pos = entity.getComponent(PositionComponent);
        return pos && Math.abs(pos.x - playerX) < 100;
    })
    .execute();
```

### 查询结果缓存

```typescript
class OptimizedCombatSystem extends EntitySystem {
    private cachedEnemies: Entity[] = [];
    private lastCacheUpdate = 0;
    private cacheInterval = 5; // 每5帧更新一次
    
    protected process(entities: Entity[]): void {
        // 缓存查询结果
        if (Time.frameCount - this.lastCacheUpdate >= this.cacheInterval) {
            this.cachedEnemies = this.entityManager.getEntitiesByTag(2);
            this.lastCacheUpdate = Time.frameCount;
        }
        
        // 使用缓存的结果
        this.cachedEnemies.forEach(enemy => {
            this.processEnemy(enemy);
        });
    }
    
    private processEnemy(enemy: Entity): void {
        // 处理敌人逻辑
    }
}
```

## 实体管理优化

### 批量创建实体

```typescript
// ✅ 推荐：使用Scene的批量创建
function createEnemyWave(count: number): Entity[] {
    const enemies = scene.createEntities(count, "Enemy");
    
    // 批量配置组件
    enemies.forEach((enemy, index) => {
        enemy.addComponent(new PositionComponent(
            Math.random() * 800,
            Math.random() * 600
        ));
        enemy.addComponent(new HealthComponent(100));
        enemy.addComponent(new AIComponent());
        enemy.tag = 2; // 敌人标签
    });
    
    return enemies;
}

// ❌ 避免：循环单独创建
function createEnemyWaveSlow(count: number): Entity[] {
    const enemies: Entity[] = [];
    for (let i = 0; i < count; i++) {
        const enemy = entityManager.createEntity(`Enemy_${i}`);
        enemy.addComponent(new PositionComponent());
        enemy.addComponent(new HealthComponent());
        enemies.push(enemy);
    }
    return enemies;
}
```

### 实体复用策略

```typescript
// 使用简单的实体复用策略
class EntityReusableManager {
    private inactiveEntities: Entity[] = [];
    private scene: Scene;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    // 预创建实体
    preCreateEntities(count: number, entityName: string): void {
        const entities = this.scene.createEntities(count, entityName);
        entities.forEach(entity => {
            entity.enabled = false; // 禁用但不销毁
            this.inactiveEntities.push(entity);
        });
    }
    
    // 获取可复用实体
    getReusableEntity(): Entity | null {
        if (this.inactiveEntities.length > 0) {
            const entity = this.inactiveEntities.pop()!;
            entity.enabled = true;
            return entity;
        }
        return null;
    }
    
    // 回收实体
    recycleEntity(entity: Entity): void {
        entity.enabled = false;
        entity.removeAllComponents();
        this.inactiveEntities.push(entity);
    }
}
```

## 组件设计优化

### 数据局部性优化

```typescript
// ✅ 推荐：紧凑的数据结构
class OptimizedPositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;
    
    // 避免对象分配
    public setPosition(x: number, y: number, z: number = 0): void {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

// ❌ 避免：过多对象分配
class SlowPositionComponent extends Component {
    public position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
    public velocity: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
    public acceleration: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
}
```

### 组件池化

```typescript
// 使用框架内置的组件池
ComponentPoolManager.getInstance().registerPool(
    'BulletComponent',
    () => new BulletComponent(),
    (bullet) => bullet.reset(),
    1000
);

// 获取组件
const bullet = ComponentPoolManager.getInstance().acquireComponent('BulletComponent');
if (bullet) {
    entity.addComponent(bullet);
}

// 释放组件
ComponentPoolManager.getInstance().releaseComponent('BulletComponent', bullet);
```

## 系统设计优化

### 系统更新顺序优化

```typescript
class OptimizedGameManager {
    private scene: Scene;
    
    constructor() {
        this.scene = new Scene();
        this.setupSystems();
    }
    
    private setupSystems(): void {
        // 按依赖关系排序系统
        this.scene.addEntityProcessor(new InputSystem()).updateOrder = 10;
        this.scene.addEntityProcessor(new MovementSystem()).updateOrder = 20;
        this.scene.addEntityProcessor(new CollisionSystem()).updateOrder = 30;
        this.scene.addEntityProcessor(new RenderSystem()).updateOrder = 40;
        this.scene.addEntityProcessor(new CleanupSystem()).updateOrder = 50;
    }
}
```

### 时间分片处理

```typescript
class TimeSlicedAISystem extends EntitySystem {
    private aiEntities: Entity[] = [];
    private currentIndex = 0;
    private entitiesPerFrame = 10;
    
    protected process(entities: Entity[]): void {
        // 获取所有AI实体
        if (this.aiEntities.length === 0) {
            this.aiEntities = this.entityManager.getEntitiesByTag(3); // AI标签
        }
        
        // 每帧只处理部分实体
        const endIndex = Math.min(
            this.currentIndex + this.entitiesPerFrame,
            this.aiEntities.length
        );
        
        for (let i = this.currentIndex; i < endIndex; i++) {
            this.processAI(this.aiEntities[i]);
        }
        
        // 更新索引
        this.currentIndex = endIndex;
        if (this.currentIndex >= this.aiEntities.length) {
            this.currentIndex = 0;
            this.aiEntities = []; // 重新获取实体列表
        }
    }
    
    private processAI(entity: Entity): void {
        // AI处理逻辑
    }
}
```

## 内存管理

### 及时清理无用实体

```typescript
class CleanupSystem extends EntitySystem {
    protected process(entities: Entity[]): void {
        // 清理超出边界的子弹
        const bullets = this.entityManager.getEntitiesByTag(4); // 子弹标签
        bullets.forEach(bullet => {
            const pos = bullet.getComponent(PositionComponent);
            if (pos && this.isOutOfBounds(pos)) {
                this.entityManager.destroyEntity(bullet);
            }
        });
        
        // 清理死亡的实体
        const deadEntities = this.entityManager
            .query()
            .withAll(HealthComponent)
            .where(entity => {
                const health = entity.getComponent(HealthComponent);
                return health && health.currentHealth <= 0;
            })
            .execute();
            
        deadEntities.forEach(entity => {
            this.entityManager.destroyEntity(entity);
        });
    }
    
    private isOutOfBounds(pos: PositionComponent): boolean {
        return pos.x < -100 || pos.x > 900 || pos.y < -100 || pos.y > 700;
    }
}
```

### 实体复用管理

```typescript
class GameEntityManager {
    private bulletManager: EntityReusableManager;
    private effectManager: EntityReusableManager;
    
    constructor(scene: Scene) {
        this.bulletManager = new EntityReusableManager(scene);
        this.effectManager = new EntityReusableManager(scene);
        
        // 预创建实体
        this.bulletManager.preCreateEntities(100, "Bullet");
        this.effectManager.preCreateEntities(50, "Effect");
    }
    
    createBullet(): Entity | null {
        const bullet = this.bulletManager.getReusableEntity();
        if (bullet) {
            bullet.addComponent(new BulletComponent());
            bullet.addComponent(new PositionComponent());
            bullet.addComponent(new VelocityComponent());
        }
        return bullet;
    }
    
    destroyBullet(bullet: Entity): void {
        this.bulletManager.recycleEntity(bullet);
    }
}
```

## 性能监控

### 基础性能统计

```typescript
class PerformanceMonitor {
    private scene: Scene;
    private entityManager: EntityManager;
    
    constructor(scene: Scene, entityManager: EntityManager) {
        this.scene = scene;
        this.entityManager = entityManager;
    }
    
    public getPerformanceReport(): any {
        return {
            // 实体统计
            entities: {
                total: this.entityManager.entityCount,
                active: this.entityManager.activeEntityCount
            },
            
            // 场景统计
            scene: this.scene.getStats(),
            
            // 查询系统统计
            querySystem: this.scene.querySystem.getStats(),
            
            // 内存使用
            memory: {
                used: (performance as any).memory?.usedJSHeapSize || 0,
                total: (performance as any).memory?.totalJSHeapSize || 0
            }
        };
    }
    
    public logPerformance(): void {
        const report = this.getPerformanceReport();
        console.log('性能报告:', report);
    }
}
```

### 帧率监控

```typescript
class FPSMonitor {
    private frameCount = 0;
    private lastTime = performance.now();
    private fps = 0;
    
    public update(): void {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            if (this.fps < 30) {
                console.warn(`低帧率警告: ${this.fps} FPS`);
            }
        }
    }
    
    public getFPS(): number {
        return this.fps;
    }
}
```

## 最佳实践总结

### 查询优化
1. 优先使用标签查询和组件查询
2. 缓存频繁使用的查询结果
3. 避免过度使用自定义条件查询
4. 合理设置查询缓存更新频率

### 实体管理
1. 使用批量创建方法
2. 实现实体池化减少GC压力
3. 及时清理无用实体
4. 合理设置实体标签

### 组件设计
1. 保持组件数据紧凑
2. 避免在组件中分配大量对象
3. 使用组件池化
4. 分离数据和行为

### 系统设计
1. 合理安排系统更新顺序
2. 对重计算任务使用时间分片
3. 避免在系统中进行复杂查询
4. 缓存系统间的共享数据

### 内存管理
1. 定期清理无用实体和组件
2. 使用对象池减少GC
3. 监控内存使用情况
4. 避免内存泄漏

通过遵循这些最佳实践，可以显著提升ECS框架的性能表现。 