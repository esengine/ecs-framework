 # QuerySystem 使用指南

QuerySystem 是 ECS Framework 中的高性能实体查询系统，支持多级索引、智能缓存和类型安全的查询操作。

## 基本用法

### 1. 获取查询系统

```typescript
import { Scene, Entity } from '@esengine/ecs-framework';

// 创建场景，查询系统会自动创建
const scene = new Scene();
const querySystem = scene.querySystem;

// 或者从Core获取当前场景的查询系统
import { Core } from '@esengine/ecs-framework';
const currentQuerySystem = Core.scene?.querySystem;
```

### 2. 基本查询操作

```typescript
// 查询包含所有指定组件的实体
const result = querySystem.queryAll(PositionComponent, VelocityComponent);
console.log(`找到 ${result.count} 个实体`);

// 查询包含任意指定组件的实体
const anyResult = querySystem.queryAny(HealthComponent, ManaComponent);

// 查询不包含指定组件的实体
const noneResult = querySystem.queryNone(DeadComponent);
```

### 3. 类型安全查询

```typescript
// 类型安全的查询，返回实体和对应的组件
const typedResult = querySystem.queryAllTyped(PositionComponent, VelocityComponent);
for (let i = 0; i < typedResult.entities.length; i++) {
    const entity = typedResult.entities[i];
    const [position, velocity] = typedResult.components[i];
    // position 和 velocity 都是类型安全的
}

// 查询单个组件类型
const healthEntities = querySystem.queryComponentTyped(HealthComponent);
healthEntities.forEach(({ entity, component }) => {
    console.log(`实体 ${entity.name} 的生命值: ${component.value}`);
});

// 查询两个组件类型
const movableEntities = querySystem.queryTwoComponents(PositionComponent, VelocityComponent);
movableEntities.forEach(({ entity, component1: position, component2: velocity }) => {
    // 更新位置
    position.x += velocity.x;
    position.y += velocity.y;
});
```

### 4. 使用查询构建器

```typescript
// 创建复杂查询
const query = querySystem.createQuery()
    .withAll(PositionComponent, RenderComponent)
    .without(HiddenComponent)
    .withTag(1) // 特定标签
    .orderByName()
    .limit(10);

const result = query.execute();

// 链式操作
const visibleEnemies = querySystem.createQuery()
    .withAll(EnemyComponent, PositionComponent)
    .without(DeadComponent, HiddenComponent)
    .filter(entity => entity.name.startsWith('Boss'))
    .orderBy((a, b) => a.id - b.id);

// 迭代结果
visibleEnemies.forEach((entity, index) => {
    console.log(`敌人 ${index}: ${entity.name}`);
});
```

### 5. 高级查询功能

```typescript
// 复合查询
const complexResult = querySystem.queryComplex(
    {
        type: QueryConditionType.ALL,
        componentTypes: [PositionComponent, VelocityComponent],
        mask: /* 位掩码 */
    },
    {
        type: QueryConditionType.NONE,
        componentTypes: [DeadComponent],
        mask: /* 位掩码 */
    }
);

// 批量查询
const batchResults = querySystem.batchQuery([
    { type: QueryConditionType.ALL, componentTypes: [HealthComponent], mask: /* 位掩码 */ },
    { type: QueryConditionType.ALL, componentTypes: [ManaComponent], mask: /* 位掩码 */ }
]);

// 并行查询
const parallelResults = await querySystem.parallelQuery([
    { type: QueryConditionType.ALL, componentTypes: [PositionComponent], mask: /* 位掩码 */ },
    { type: QueryConditionType.ALL, componentTypes: [VelocityComponent], mask: /* 位掩码 */ }
]);
```

## 场景级别的实体查询

除了使用QuerySystem，您还可以直接使用Scene提供的便捷查询方法：

### 基本场景查询

```typescript
// 按名称查找实体
const player = scene.findEntity("Player");
const playerAlt = scene.getEntityByName("Player"); // 别名方法

// 按ID查找实体
const entity = scene.findEntityById(123);

// 按标签查找实体
const enemies = scene.findEntitiesByTag(2);
const enemiesAlt = scene.getEntitiesByTag(2); // 别名方法

// 获取所有实体
const allEntities = scene.entities.buffer;
```

## 性能优化

### 1. 缓存管理

```typescript
// 设置缓存配置
querySystem.setCacheConfig(200, 2000); // 最大200个缓存项，2秒超时

// 清空缓存
querySystem.clearCache();

// 预热常用查询
const commonQueries = [
    { type: QueryConditionType.ALL, componentTypes: [PositionComponent], mask: /* 位掩码 */ },
    { type: QueryConditionType.ALL, componentTypes: [VelocityComponent], mask: /* 位掩码 */ }
];
querySystem.warmUpCache(commonQueries);
```

### 2. 索引优化

```typescript
// 自动优化索引配置
querySystem.optimizeIndexes();

// 获取性能统计
const stats = querySystem.getStats();
console.log(`缓存命中率: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`实体数量: ${stats.entityCount}`);

// 获取详细性能报告
const report = querySystem.getPerformanceReport();
console.log(report);
```

### 3. 查询监听和快照

```typescript
// 监听查询结果变更
const unwatch = querySystem.watchQuery(
    { type: QueryConditionType.ALL, componentTypes: [EnemyComponent], mask: /* 位掩码 */ },
    (entities, changeType) => {
        console.log(`敌人实体${changeType}: ${entities.length}个`);
    }
);

// 取消监听
unwatch();

// 创建查询快照
const snapshot1 = querySystem.createSnapshot(
    { type: QueryConditionType.ALL, componentTypes: [PlayerComponent], mask: /* 位掩码 */ }
);

// 稍后创建另一个快照
const snapshot2 = querySystem.createSnapshot(
    { type: QueryConditionType.ALL, componentTypes: [PlayerComponent], mask: /* 位掩码 */ }
);

// 比较快照
const diff = querySystem.compareSnapshots(snapshot1, snapshot2);
console.log(`新增: ${diff.added.length}, 移除: ${diff.removed.length}`);
```

## 实际使用示例

### 移动系统示例

```typescript
import { EntitySystem } from '@esengine/ecs-framework';

class MovementSystem extends EntitySystem {
    public update(): void {
        // 查询所有可移动的实体
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
```

### 碰撞检测示例

```typescript
class CollisionSystem extends EntitySystem {
    public update(): void {
        // 获取所有具有碰撞器的实体
        const collidableEntities = this.scene.querySystem.queryTwoComponents(
            PositionComponent,
            ColliderComponent
        );

        // 检测碰撞
        for (let i = 0; i < collidableEntities.length; i++) {
            for (let j = i + 1; j < collidableEntities.length; j++) {
                const entityA = collidableEntities[i];
                const entityB = collidableEntities[j];

                if (this.checkCollision(entityA, entityB)) {
                    this.handleCollision(entityA.entity, entityB.entity);
                }
            }
        }
    }

    private checkCollision(entityA: any, entityB: any): boolean {
        // 简单的距离检测
        const posA = entityA.component1;
        const posB = entityB.component1;
        const distance = Math.sqrt(
            Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2)
        );
        return distance < 50;
    }

    private handleCollision(entityA: Entity, entityB: Entity): void {
        console.log(`碰撞检测: ${entityA.name} 与 ${entityB.name}`);
    }
}
```

### 生命值管理示例

```typescript
class HealthSystem extends EntitySystem {
    public update(): void {
        // 查询所有具有生命值的实体
        const healthEntities = this.scene.querySystem.queryComponentTyped(HealthComponent);
        const deadEntities: Entity[] = [];

        healthEntities.forEach(({ entity, component: health }) => {
            // 检查死亡
            if (health.currentHealth <= 0) {
                deadEntities.push(entity);
            }
        });

        // 移除死亡实体
        deadEntities.forEach(entity => {
            console.log(`实体 ${entity.name} 已死亡`);
            entity.destroy();
        });
    }
}
```

## 最佳实践

### 1. 查询优化

- 尽量使用类型安全的查询方法
- 避免在每帧都创建新的查询
- 合理使用缓存机制

### 2. 性能监控

- 定期检查查询性能报告
- 监控缓存命中率
- 优化频繁使用的查询

### 3. 内存管理

- 及时清理不需要的查询监听器
- 合理设置缓存大小
- 避免创建过多的查询快照

### 4. 代码组织

- 将复杂查询封装到专门的方法中
- 使用查询构建器创建可读性更好的查询
- 在系统中合理组织查询逻辑