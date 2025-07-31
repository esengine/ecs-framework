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
const typedResult = querySystem.queryAll(PositionComponent, VelocityComponent);
for (let i = 0; i < typedResult.entities.length; i++) {
    const entity = typedResult.entities[i];
    const [position, velocity] = typedResult.components[i];
    // position 和 velocity 都是类型安全的
}

// 查询单个组件类型
const healthResult = querySystem.queryAll(HealthComponent);
for (const entity of healthResult.entities) {
    const health = entity.getComponent(HealthComponent);
    if (health) {
        console.log(`实体 ${entity.name} 的生命值: ${health.value}`);
    }
}

// 查询两个组件类型
const movableResult = querySystem.queryAll(PositionComponent, VelocityComponent);
for (const entity of movableResult.entities) {
    const position = entity.getComponent(PositionComponent);
    const velocity = entity.getComponent(VelocityComponent);
    if (position && velocity) {
        // 更新位置
        position.x += velocity.x;
        position.y += velocity.y;
    }
}
```

### 4. 使用查询构建器

```typescript
// QuerySystem不提供查询构建器，请使用Matcher进行复杂查询
// 推荐使用Matcher配合EntitySystem

import { Matcher } from '@esengine/ecs-framework';

// 创建复杂查询条件
const visibleMatcher = Matcher.all(PositionComponent, RenderComponent)
    .none(HiddenComponent);

// 通过QuerySystem执行查询
const visibleEntities = querySystem.query(visibleMatcher.getCondition());

// 过滤和排序需要手动处理
const sortedEntities = visibleEntities.entities
    .filter(entity => entity.name.startsWith('Boss'))
    .sort((a, b) => a.id - b.id)
    .slice(0, 10); // 限制数量

// 迭代结果
sortedEntities.forEach((entity, index) => {
    console.log(`敌人 ${index}: ${entity.name}`);
});
```

### 5. 高级查询功能

```typescript
// QuerySystem主要提供基础查询方法
// 复杂查询推荐使用Matcher和EntitySystem

// 基本查询
const positionResult = querySystem.queryAll(PositionComponent, VelocityComponent);
const healthResult = querySystem.queryAll(HealthComponent);
const manaResult = querySystem.queryAll(ManaComponent);

// 排除死亡实体的移动实体
const aliveMovingEntities = positionResult.entities.filter(entity => 
    !entity.hasComponent(DeadComponent)
);

// 如果需要复杂查询，推荐在EntitySystem中使用Matcher
class ComplexQuerySystem extends EntitySystem {
    constructor() {
        super(Matcher.all(PositionComponent, VelocityComponent).none(DeadComponent));
    }
    
    protected process(entities: Entity[]): void {
        // entities已经是过滤后的结果
        for (const entity of entities) {
            // 处理逻辑
        }
    }
}
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

// 预热常用查询（使用基础查询方法）
querySystem.queryAll(PositionComponent); // 预热Position查询
querySystem.queryAll(VelocityComponent); // 预热Velocity查询
```

### 2. 索引优化

```typescript
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
// QuerySystem主要用于基础查询，高级功能请使用EntitySystem和事件系统

// 如需监听实体变化，使用事件系统
scene.entityManager.eventBus.on('entity:added', (entity) => {
    if (entity.hasComponent(EnemyComponent)) {
        console.log('新增敌人实体');
    }
});

scene.entityManager.eventBus.on('entity:removed', (entity) => {
    if (entity.hasComponent(EnemyComponent)) {
        console.log('移除敌人实体');
    }
});

// 手动创建快照进行比较
const snapshot1 = querySystem.queryAll(PlayerComponent).entities.map(e => e.id);
// 稍后
const snapshot2 = querySystem.queryAll(PlayerComponent).entities.map(e => e.id);

// 比较快照
const added = snapshot2.filter(id => !snapshot1.includes(id));
const removed = snapshot1.filter(id => !snapshot2.includes(id));
console.log(`新增: ${added.length}, 移除: ${removed.length}`);
```

## 使用Matcher进行高级查询

Matcher是一个优雅的查询封装器，提供流畅的API和强大的缓存机制。

### 基本Matcher用法

```typescript
import { Matcher } from '@esengine/ecs-framework';

// 创建Matcher查询条件
const movingMatcher = Matcher.all(PositionComponent, VelocityComponent);
// 在QuerySystem中需要使用基础查询方法
const movingEntities = scene.querySystem.queryAll(PositionComponent, VelocityComponent).entities;

// 复合查询需要使用EntitySystem或手动过滤
const aliveEnemiesMatcher = Matcher.all(EnemyComponent, HealthComponent)
    .any(WeaponComponent, MagicComponent)
    .none(DeadComponent, StunnedComponent);

// 在EntitySystem中使用
class AliveEnemySystem extends EntitySystem {
    constructor() {
        super(aliveEnemiesMatcher);
    }
    
    protected process(entities: Entity[]): void {
        // entities已经是匹配的实体
        for (const entity of entities) {
            // 处理存活的敌人
        }
    }
}

// 或者手动过滤
const enemyResult = scene.querySystem.queryAll(EnemyComponent, HealthComponent);
const aliveEnemies = enemyResult.entities.filter(entity => {
    const hasWeaponOrMagic = entity.hasComponent(WeaponComponent) || entity.hasComponent(MagicComponent);
    const isAlive = !entity.hasComponent(DeadComponent) && !entity.hasComponent(StunnedComponent);
    return hasWeaponOrMagic && isAlive;
});

// 单个实体检查
const playerResult = scene.querySystem.queryAll(PlayerComponent);
if (playerResult.entities.includes(someEntity)) {
    console.log('这是玩家实体');
}

// 统计信息
console.log(`玩家数量: ${playerResult.count}`);
console.log(`是否有玩家: ${playerResult.count > 0}`);
```

### 系统中使用Matcher

```typescript
import { EntitySystem, Entity, Matcher } from '@esengine/ecs-framework';

class MovementSystem extends EntitySystem {
    constructor() {
        // 在构造函数中直接传入Matcher
        super(Matcher.all(PositionComponent, VelocityComponent));
    }
    
    protected process(entities: Entity[]): void {
        // entities参数已经是系统自动过滤后的实体
        for (const entity of entities) {
            const position = entity.getComponent(PositionComponent)!;
            const velocity = entity.getComponent(VelocityComponent)!;
            
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
        }
    }
}
```

### 碰撞检测示例

```typescript
class CollisionSystem extends EntitySystem {
    constructor() {
        // 在构造函数中传入Matcher
        super(Matcher.all(PositionComponent, ColliderComponent));
    }
    
    protected process(entities: Entity[]): void {
        // entities已经是匹配的实体
        const collidableEntities = entities;

        // 检测碰撞
        for (let i = 0; i < collidableEntities.length; i++) {
            for (let j = i + 1; j < collidableEntities.length; j++) {
                const entityA = collidableEntities[i];
                const entityB = collidableEntities[j];

                if (this.checkCollision(entityA, entityB)) {
                    this.handleCollision(entityA, entityB);
                }
            }
        }
    }

    private checkCollision(entityA: Entity, entityB: Entity): boolean {
        const posA = entityA.getComponent(PositionComponent)!;
        const posB = entityB.getComponent(PositionComponent)!;
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
    constructor() {
        // 在构造函数中传入Matcher
        super(Matcher.all(HealthComponent));
    }
    
    protected process(entities: Entity[]): void {
        // entities已经是匹配的实体
        const healthEntities = entities;
        const deadEntities: Entity[] = [];

        for (const entity of healthEntities) {
            const health = entity.getComponent(HealthComponent)!;
            
            // 检查死亡
            if (health.currentHealth <= 0) {
                deadEntities.push(entity);
            }
        }

        // 移除死亡实体
        deadEntities.forEach(entity => {
            console.log(`实体 ${entity.name} 已死亡`);
            entity.destroy();
        });
    }
}
```

### Matcher完整API参考

#### 静态创建方法

```typescript
// 基础静态方法
const allMatcher = Matcher.all(PositionComponent, VelocityComponent);     // 必须包含所有组件
const anyMatcher = Matcher.any(WeaponComponent, MagicComponent);          // 必须包含任意一个组件  
const noneMatcher = Matcher.none(DeadComponent, DisabledComponent);       // 不能包含任何指定组件

// 特殊查询静态方法
const tagMatcher = Matcher.byTag(1);                                      // 按标签查询
const nameMatcher = Matcher.byName("Player");                             // 按名称查询
const componentMatcher = Matcher.byComponent(HealthComponent);            // 单组件查询

// 构建器方法
const complexMatcher = Matcher.complex();                                 // 创建复杂查询构建器
const emptyMatcher = Matcher.empty();                                     // 创建空匹配器
```

#### 实例方法 - 条件构建

```typescript
// 基础条件方法
const matcher = Matcher.empty()
    .all(PositionComponent, VelocityComponent)      // 必须包含所有组件
    .any(WeaponComponent, MagicComponent)           // 必须包含任意一个组件
    .none(DeadComponent, StunnedComponent);         // 不能包含任何指定组件

// 别名方法（提供更语义化的API）
const semanticMatcher = Matcher.empty()
    .all(PositionComponent)
    .exclude(DeadComponent)                         // exclude() 等同于 none()
    .one(WeaponComponent, MagicComponent);          // one() 等同于 any()

// 特殊条件方法
const advancedMatcher = Matcher.empty()
    .all(EnemyComponent)
    .withTag(2)                                     // 指定标签
    .withName("Boss")                               // 指定名称
    .withComponent(HealthComponent);                // 单组件条件
```

#### 条件移除方法

```typescript
// 移除特殊条件
const matcher = Matcher.byTag(1)
    .withName("Player")
    .withComponent(HealthComponent);

// 移除各种条件
matcher.withoutTag();          // 移除标签条件
matcher.withoutName();         // 移除名称条件
matcher.withoutComponent();    // 移除单组件条件
```

#### 实用工具方法

```typescript
// 检查和调试
const matcher = Matcher.all(PositionComponent, VelocityComponent)
    .none(DeadComponent);

// 检查是否为空条件
if (matcher.isEmpty()) {
    console.log('匹配器没有设置任何条件');
}

// 获取条件信息（只读）
const condition = matcher.getCondition();
console.log('必须组件:', condition.all.map(c => c.name));
console.log('任选组件:', condition.any.map(c => c.name));
console.log('排除组件:', condition.none.map(c => c.name));
console.log('标签:', condition.tag);
console.log('名称:', condition.name);
console.log('单组件:', condition.component?.name);

// 调试输出
console.log('匹配器描述:', matcher.toString());
// 输出: "Matcher[all(PositionComponent, VelocityComponent) & none(DeadComponent)]"
```

#### 克隆和重置

```typescript
// 克隆匹配器
const baseMatcher = Matcher.all(PositionComponent);
const livingMatcher = baseMatcher.clone().all(HealthComponent).none(DeadComponent);
const deadMatcher = baseMatcher.clone().all(DeadComponent);

// 重置匹配器
const reusableMatcher = Matcher.all(PositionComponent);
console.log(reusableMatcher.toString()); // "Matcher[all(PositionComponent)]"

reusableMatcher.reset();                 // 清空所有条件
console.log(reusableMatcher.toString()); // "Matcher[]"

reusableMatcher.all(PlayerComponent);    // 重新设置条件
console.log(reusableMatcher.toString()); // "Matcher[all(PlayerComponent)]"
```

#### 链式调用示例

```typescript
// 复杂的链式调用
const complexMatcher = Matcher.empty()
    .all(PositionComponent, RenderComponent)        // 必须有位置和渲染组件  
    .any(PlayerComponent, NPCComponent)             // 必须是玩家或NPC
    .none(DeadComponent, HiddenComponent)           // 不能死亡或隐藏
    .withTag(1)                                     // 标签为1
    .exclude(DisabledComponent);                    // 不能被禁用

// 在EntitySystem中使用
class VisibleCharacterSystem extends EntitySystem {
    constructor() {
        super(complexMatcher);
    }
    
    protected process(entities: Entity[]): void {
        // entities已经是符合所有条件的实体
        for (const entity of entities) {
            // 处理可见角色的逻辑
        }
    }
}
```

## 最佳实践

### 1. Matcher使用建议

```typescript
// 推荐的用法：
const matcher = Matcher.all(Position, Velocity);

// 在系统中使用
class MySystem extends EntitySystem {
    constructor() {
        super(Matcher.all(RequiredComponent));
    }
    
    protected process(entities: Entity[]): void {
        // entities已经是系统自动过滤的结果
        for (const entity of entities) {
            // 处理逻辑...
        }
    }
}

// 避免在process方法中重复查询
class InefficientSystem extends EntitySystem {
    protected process(entities: Entity[]): void {
        // 不必要的额外查询，性能差
        const condition = Matcher.all(RequiredComponent).getCondition();
        const result = this.scene.querySystem.query(condition);
    }
}
```

### 2. Matcher API最佳实践

#### 选择合适的创建方式

```typescript
// ✅ 推荐：单一条件使用静态方法
const movingEntities = Matcher.all(PositionComponent, VelocityComponent);
const playerEntities = Matcher.byTag(PLAYER_TAG);
const specificEntity = Matcher.byName("Boss");

// ✅ 推荐：复杂条件使用链式调用
const complexMatcher = Matcher.empty()
    .all(PositionComponent, HealthComponent)
    .any(WeaponComponent, MagicComponent)
    .none(DeadComponent);

// ❌ 不推荐：简单条件使用复杂语法
const simpleButBad = Matcher.empty().all(PositionComponent);
// 应该用: Matcher.all(PositionComponent)
```

#### 合理使用别名方法

```typescript
// 使用语义化的别名提高可读性
const combatUnits = Matcher.all(PositionComponent, HealthComponent)
    .one(WeaponComponent, MagicComponent)           // one() 比 any() 更语义化
    .exclude(DeadComponent, PacifistComponent);     // exclude() 比 none() 更直观
```

#### 合理的克隆和重用

```typescript
// ✅ 推荐：基础匹配器重用
const livingEntityMatcher = Matcher.all(HealthComponent).none(DeadComponent);
const livingPlayerMatcher = livingEntityMatcher.clone().all(PlayerComponent);
const livingEnemyMatcher = livingEntityMatcher.clone().all(EnemyComponent);

// ✅ 推荐：重置匹配器重用
const reusableMatcher = Matcher.empty();

// 用于玩家系统
reusableMatcher.reset().all(PlayerComponent);
const playerSystem = new PlayerSystem(reusableMatcher.clone());

// 用于敌人系统  
reusableMatcher.reset().all(EnemyComponent);
const enemySystem = new EnemySystem(reusableMatcher.clone());
```

#### 调试和维护

```typescript
// 在开发阶段添加调试信息
const debugMatcher = Matcher.all(ComplexComponent)
    .any(VariantA, VariantB)
    .none(DisabledComponent);

if (DEBUG_MODE) {
    console.log('系统匹配条件:', debugMatcher.toString());
    const condition = debugMatcher.getCondition();
    console.log('预期匹配实体数:', 
        scene.querySystem.queryAll(...condition.all).count);
}
```

### 3. 查询优化

- **使用Matcher封装复杂查询**：提供更好的可读性和缓存
- **避免频繁创建查询**：在系统初始化时创建，重复使用
- **合理使用any()和none()条件**：减少不必要的实体遍历
- **利用Matcher的缓存机制**：自动优化重复查询性能
- **使用克隆方法复用基础条件**：避免重复定义相似的匹配条件
- **选择合适的静态方法**：单一条件优先使用对应的静态方法

### 3. 性能监控

- 定期检查查询性能报告  
- 监控缓存命中率
- 优化频繁使用的查询
- 使用性能测试验证优化效果

### 4. 内存管理

- 及时清理不需要的查询监听器
- 合理设置缓存大小
- 避免创建过多的查询快照
- 适当使用Matcher的clone()和reset()方法

### 5. 代码组织

- **系统级别的Matcher**：在系统中创建和管理Matcher
- **查询逻辑封装**：将复杂查询封装到专门的方法中
- **条件复用**：使用clone()方法复用基础查询条件
- **清晰的命名**：给Matcher变量使用描述性的名称

### 6. 迁移指南

系统中Matcher的推荐用法：

```typescript
// 在EntitySystem中使用Matcher
class MySystem extends EntitySystem {
    constructor() {
        super(Matcher.all(ComponentA, ComponentB).none(ComponentC));
    }
    
    protected process(entities: Entity[]): void {
        // entities已经是系统自动过滤的结果
        for (const entity of entities) {
            // 处理逻辑
        }
    }
}
```

## 使用最佳实践

- 在EntitySystem构造函数中传入Matcher
- 使用`none()`来排除组件
- 使用`any()`来匹配任意组件
- 直接使用EntitySystem的entities参数，避免额外查询
- 定期检查查询性能和缓存命中率