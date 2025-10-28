# 核心概念

本文介绍行为树系统的核心概念和工作原理。

## 什么是行为树？

行为树（Behavior Tree）是一种用于控制AI和自动化系统的决策结构。它通过树状层次结构组织任务，从根节点开始逐层执行，直到找到合适的行为。

### 与状态机的对比

传统状态机：
- 基于状态和转换
- 状态之间的转换复杂
- 难以扩展和维护
- 不便于复用

行为树：
- 基于任务和层次结构
- 模块化、易于复用
- 可视化编辑
- 灵活的决策逻辑


## 树结构

行为树由节点组成，形成树状结构：

```
Root (根节点)
├── Selector (选择器)
│   ├── Sequence (序列)
│   │   ├── Condition (条件)
│   │   └── Action (动作)
│   └── Action (动作)
└── Sequence (序列)
    ├── Action (动作)
    └── Wait (等待)
```

每个节点都有：
- 父节点（除了根节点）
- 零个或多个子节点
- 执行状态
- 返回结果


## 节点类型

### 复合节点（Composite）

复合节点有多个子节点，按特定规则执行它们。

#### Selector（选择器）

按顺序尝试执行子节点，直到某个子节点成功。

```typescript
.selector('FindFood')
    .action('EatNearbyFood', () => {
        if (hasNearbyFood()) {
            eat();
            return TaskStatus.Success;
        }
        return TaskStatus.Failure;
    })
    .action('SearchFood', () => {
        searchForFood();
        return TaskStatus.Running;
    })
    .action('GiveUp', () => {
        return TaskStatus.Failure;
    })
.end()
```

执行逻辑：
1. 尝试第一个子节点
2. 如果返回Success，选择器成功
3. 如果返回Failure，尝试下一个子节点
4. 如果返回Running，选择器返回Running
5. 所有子节点都失败时，选择器失败


#### Sequence（序列）

按顺序执行所有子节点，直到某个子节点失败。

```typescript
.sequence('AttackSequence')
    .condition((e, bb) => hasTarget())  // 检查是否有目标
    .action('Aim', () => TaskStatus.Success)  // 瞄准
    .action('Fire', () => TaskStatus.Success)  // 开火
.end()
```

执行逻辑：
1. 依次执行子节点
2. 如果子节点返回Failure，序列失败
3. 如果子节点返回Running，序列返回Running
4. 如果子节点返回Success，继续下一个子节点
5. 所有子节点都成功时，序列成功


#### Parallel（并行）

同时执行多个子节点。

```typescript
import { ParallelPolicy } from '@esengine/behavior-tree';

.parallel(ParallelPolicy.RequireAll)  // 所有任务都要成功
    .action('PlayAnimation', () => TaskStatus.Success)
    .action('PlaySound', () => TaskStatus.Success)
    .action('SpawnEffect', () => TaskStatus.Success)
.end()
```

策略类型：
- `RequireAll`：所有子节点都成功才成功
- `RequireOne`：任意一个子节点成功就成功


### 装饰器节点（Decorator）

装饰器节点只有一个子节点，用于修改子节点的行为或结果。

#### Inverter（反转）

反转子节点的结果：

```typescript
.inverter()
    .condition((e, bb) => isEnemyNearby())  // 检查敌人是否附近
.end()
// 如果有敌人返回false，没有敌人返回true
```

#### Repeater（重复）

重复执行子节点：

```typescript
.repeat(3)  // 重复3次
    .action('Jump', () => TaskStatus.Success)
.end()
```

#### Cooldown（冷却）

限制子节点的执行频率：

```typescript
.cooldown(5.0)  // 5秒冷却
    .action('UseSpecialAbility', () => {
        console.log('使用特殊技能');
        return TaskStatus.Success;
    })
.end()
```

#### Timeout（超时）

限制子节点的执行时间：

```typescript
.timeout(10.0)  // 10秒超时
    .action('ComplexTask', () => {
        // 长时间运行的任务
        return TaskStatus.Running;
    })
.end()
```


### 叶节点（Leaf）

叶节点没有子节点，执行具体的任务。

#### Action（动作）

执行具体操作：

```typescript
.action('Move', (entity, blackboard, deltaTime) => {
    const target = blackboard?.getValue('targetPosition');

    if (!target) {
        return TaskStatus.Failure;
    }

    // 移动逻辑
    const moved = moveTowards(target, deltaTime);

    if (moved) {
        return TaskStatus.Success;
    }

    return TaskStatus.Running;
})
```

#### Condition（条件）

检查条件：

```typescript
.condition((entity, blackboard) => {
    const health = blackboard?.getValue('health');
    return health > 50;
}, 'CheckHealthHigh')
```

#### Wait（等待）

等待指定时间：

```typescript
.wait(2.0)  // 等待2秒
```


## 任务状态

每个节点执行后返回以下状态之一：

### Success（成功）

任务成功完成。

```typescript
.action('CollectCoin', () => {
    coin.collect();
    return TaskStatus.Success;
})
```

### Failure（失败）

任务执行失败。

```typescript
.condition((e, bb) => {
    const hasKey = bb?.getValue('hasKey');
    return hasKey ? TaskStatus.Success : TaskStatus.Failure;
})
```

### Running（运行中）

任务需要多帧完成，仍在执行中。

```typescript
.action('ChargeLaser', (entity, blackboard, deltaTime) => {
    let chargeTime = blackboard?.getValue('chargeTime') || 0;
    chargeTime += deltaTime;
    blackboard?.setValue('chargeTime', chargeTime);

    if (chargeTime >= 3.0) {
        // 充能完成
        blackboard?.setValue('chargeTime', 0);
        return TaskStatus.Success;
    }

    return TaskStatus.Running;  // 继续充能
})
```

### Invalid（无效）

节点未初始化或已重置。通常不需要手动返回此状态。


## 黑板系统

黑板（Blackboard）是行为树的数据存储系统，用于在节点之间共享数据。

### 本地黑板

每个行为树实例都有自己的本地黑板：

```typescript
const ai = BehaviorTreeBuilder.create(scene, 'EnemyAI')
    .blackboard()
        .defineVariable('health', BlackboardValueType.Number, 100)
        .defineVariable('target', BlackboardValueType.Object, null)
        .defineVariable('state', BlackboardValueType.String, 'idle')
    .endBlackboard()
    .build();
```

### 支持的数据类型

```typescript
import { BlackboardValueType } from '@esengine/behavior-tree';

.blackboard()
    .defineVariable('count', BlackboardValueType.Number, 0)
    .defineVariable('name', BlackboardValueType.String, 'Enemy')
    .defineVariable('isActive', BlackboardValueType.Boolean, true)
    .defineVariable('position', BlackboardValueType.Vector2, { x: 0, y: 0 })
    .defineVariable('direction', BlackboardValueType.Vector3, { x: 0, y: 0, z: 0 })
    .defineVariable('data', BlackboardValueType.Object, {})
    .defineVariable('items', BlackboardValueType.Array, [])
.endBlackboard()
```

### 读写变量

```typescript
.action('UseBlackboard', (entity, blackboard) => {
    // 读取变量
    const health = blackboard?.getValue('health');
    const target = blackboard?.getValue('target');

    // 写入变量
    blackboard?.setValue('health', health - 10);
    blackboard?.setValue('lastAttackTime', Date.now());

    // 检查变量是否存在
    if (blackboard?.hasVariable('powerup')) {
        const powerup = blackboard.getValue('powerup');
        console.log('已获得强化:', powerup);
    }

    return TaskStatus.Success;
})
```

### 全局黑板

所有行为树实例共享的黑板：

```typescript
import { GlobalBlackboard } from '@esengine/behavior-tree';

// 设置全局变量
GlobalBlackboard.setValue('gameState', 'playing');
GlobalBlackboard.setValue('difficulty', 5);

// 在任何行为树中访问
.action('CheckGlobalState', () => {
    const gameState = GlobalBlackboard.getValue('gameState');

    if (gameState === 'paused') {
        return TaskStatus.Failure;
    }

    return TaskStatus.Success;
})
```


## 执行流程

### 初始化

```typescript
// 1. 初始化Core和场景
Core.create();
const scene = new Scene();
Core.setScene(scene);

// 2. 构建行为树
const ai = BehaviorTreeBuilder.create(scene, 'AI')
    // ... 定义节点
    .build();

// 3. 启动
BehaviorTreeStarter.start(ai);
```

### 更新循环

```typescript
// 每帧更新
gameLoop(() => {
    const deltaTime = getDeltaTime();
    Core.update(deltaTime);  // Core会自动更新场景和所有行为树
});
```

### 执行顺序

```
1. 从根节点开始
2. 根节点执行其逻辑（通常是Selector或Sequence）
3. 根节点的子节点按顺序执行
4. 每个子节点可能有自己的子节点
5. 叶节点执行具体操作并返回状态
6. 状态向上传播到父节点
7. 父节点根据策略决定如何处理子节点的状态
8. 最终根节点返回整体状态
```

### 执行示例

```typescript
const tree = BehaviorTreeBuilder.create(scene, 'Example')
    .selector('Root')  // 1. 执行选择器
        .sequence('Branch1')  // 2. 尝试第一个分支
            .condition(() => false)  // 3. 条件失败
        .end()  // 4. 序列失败，选择器继续下一个分支
        .sequence('Branch2')  // 5. 尝试第二个分支
            .condition(() => true)  // 6. 条件成功
            .action(() => TaskStatus.Success)  // 7. 动作成功
        .end()  // 8. 序列成功，选择器成功
    .end()  // 9. 整个树成功
    .build();
```

执行流程图：

```
Root(Selector)
  → Branch1(Sequence)
    → Condition: Failure
  → Branch1 fails
  → Branch2(Sequence)
    → Condition: Success
    → Action: Success
  → Branch2 succeeds
→ Root succeeds
```


## ECS集成

本框架的行为树完全基于ECS架构：

### 节点即实体

每个行为树节点都是一个Entity：

```typescript
// 行为树节点在内部被表示为：
const nodeEntity = scene.createEntity('SelectorNode');
nodeEntity.addComponent(new SelectorComponent());
nodeEntity.addComponent(new ParentComponent(parentEntity));
```

### 组件存储数据

节点属性存储在组件中：

```typescript
// Action节点的数据组件
class ActionComponent extends Component {
    actionFunc: ActionFunction;
    name: string;
}

// Blackboard组件
class BlackboardComponent extends Component {
    private variables: Map<string, any>;
}
```

### 系统驱动行为

行为树系统负责更新所有节点：

```typescript
class BehaviorTreeSystem extends EntitySystem {
    update() {
        // 更新所有活跃的行为树
        for (const entity of this.entities) {
            const root = entity.getComponent(BehaviorTreeRootComponent);
            if (root && root.isActive) {
                this.updateNode(root.rootEntity);
            }
        }
    }
}
```


## 下一步

现在你已经理解了行为树的核心概念，接下来可以：

- 查看[快速开始](./getting-started.md)创建第一个行为树
- 学习[编辑器使用指南](./editor-guide.md)可视化创建行为树
- 探索[高级用法](./advanced-usage.md)了解更多功能
- 阅读[最佳实践](./best-practices.md)学习设计模式
