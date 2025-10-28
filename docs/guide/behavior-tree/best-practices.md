# 最佳实践

本文介绍行为树设计和使用的最佳实践，帮助你构建高效、可维护的AI系统。

## 行为树设计原则

### 1. 保持树的层次清晰

将复杂行为分解成清晰的层次结构：

```
Root Selector
├── Emergency (高优先级：紧急情况)
│   ├── FleeFromDanger
│   └── CallForHelp
├── Combat (中优先级：战斗)
│   ├── Attack
│   └── Defend
└── Idle (低优先级：空闲)
    ├── Patrol
    └── Rest
```


### 2. 单一职责原则

每个节点应该只做一件事：

```typescript
// 好的设计
.sequence('AttackSequence')
    .condition(hasTarget, 'CheckTarget')
    .action(aim, 'Aim')
    .action(fire, 'Fire')
.end()

// 不好的设计 - 一个动作做太多事
.action('AttackPlayer', () => {
    checkTarget();
    aim();
    fire();
    playAnimation();
    playSound();
    // 太多职责了！
})
```

### 3. 使用描述性名称

节点名称应该清楚地表达其功能：

```typescript
// 好的命名
.condition(isHealthLow, 'CheckHealthLow')
.action(findNearestHealthPack, 'FindHealthPack')
.action(moveToHealthPack, 'MoveToHealthPack')

// 不好的命名
.condition(check1, 'C1')
.action(doSomething, 'Action1')
.action(move, 'A2')
```

## 黑板变量管理

### 1. 变量命名规范

使用清晰的命名约定：

```typescript
.blackboard()
    // 状态变量
    .defineVariable('currentState', BlackboardValueType.String, 'idle')
    .defineVariable('isMoving', BlackboardValueType.Boolean, false)

    // 目标和引用
    .defineVariable('targetEnemy', BlackboardValueType.Object, null)
    .defineVariable('patrolPoints', BlackboardValueType.Array, [])

    // 配置参数
    .defineVariable('attackRange', BlackboardValueType.Number, 5.0)
    .defineVariable('moveSpeed', BlackboardValueType.Number, 10.0)

    // 临时数据
    .defineVariable('lastAttackTime', BlackboardValueType.Number, 0)
    .defineVariable('searchAttempts', BlackboardValueType.Number, 0)
.endBlackboard()
```

### 2. 避免过度使用黑板

只在需要跨节点共享的数据才放入黑板：

```typescript
// 不好的做法 - 局部变量放黑板
.action('Calculate', (e, bb) => {
    bb?.setValue('temp1', 10);  // 不需要
    bb?.setValue('temp2', 20);  // 不需要
    bb?.setValue('result', 30); // 如果其他节点需要，这个可以
    return TaskStatus.Success;
})

// 好的做法 - 使用局部变量
.action('Calculate', (e, bb) => {
    const temp1 = 10;
    const temp2 = 20;
    const result = temp1 + temp2;
    bb?.setValue('calculationResult', result); // 只保存需要共享的结果
    return TaskStatus.Success;
})
```

### 3. 使用类型安全的访问

```typescript
// 定义类型接口
interface EnemyBlackboard {
    health: number;
    target: Entity | null;
    state: 'idle' | 'patrol' | 'chase' | 'attack';
}

// 使用时进行类型检查
.action('UseBlackboard', (e, bb) => {
    const health = bb?.getValue<number>('health');
    const target = bb?.getValue<Entity | null>('target');
    const state = bb?.getValue<string>('state');

    if (health !== undefined && health < 30) {
        bb?.setValue('state', 'flee');
    }

    return TaskStatus.Success;
})
```

## 条件节点设计

### 1. 条件应该是无副作用的

条件检查不应该修改状态：

```typescript
// 好的做法 - 只读检查
.condition((e, bb) => {
    const health = bb?.getValue('health') || 0;
    return health < 30;
}, 'IsHealthLow')

// 不好的做法 - 条件中修改状态
.condition((e, bb) => {
    const health = bb?.getValue('health') || 0;
    if (health < 30) {
        bb?.setValue('needsHealing', true);  // 不应该在条件中修改
        return true;
    }
    return false;
})
```

### 2. 复杂条件拆分

将复杂条件拆分为多个简单条件：

```typescript
// 不好的做法
.condition((e, bb) => {
    const health = bb?.getValue('health');
    const ammo = bb?.getValue('ammo');
    const enemy = bb?.getValue('enemy');
    const distance = calculateDistance(e, enemy);

    return health > 50 && ammo > 0 && enemy && distance < 10;
}, 'ComplexCheck')

// 好的做法
.sequence('CanAttack')
    .condition((e, bb) => (bb?.getValue('health') || 0) > 50, 'HasEnoughHealth')
    .condition((e, bb) => (bb?.getValue('ammo') || 0) > 0, 'HasAmmo')
    .condition((e, bb) => bb?.getValue('enemy') != null, 'HasTarget')
    .condition((e, bb) => {
        const enemy = bb?.getValue('enemy');
        return calculateDistance(e, enemy) < 10;
    }, 'InRange')
.end()
```

## 动作节点设计

### 1. 使用状态机模式处理长时间动作

```typescript
.action('ChargeLaser', (e, bb, dt) => {
    // 初始化状态
    if (!bb?.hasVariable('chargeState')) {
        bb?.setValue('chargeState', 'charging');
        bb?.setValue('chargeTime', 0);
    }

    const state = bb?.getValue('chargeState');
    const chargeTime = bb?.getValue('chargeTime') || 0;

    switch (state) {
        case 'charging':
            bb?.setValue('chargeTime', chargeTime + dt);

            if (chargeTime >= 3.0) {
                bb?.setValue('chargeState', 'ready');
            }
            return TaskStatus.Running;

        case 'ready':
            // 发射激光
            fireLaser();
            bb?.setValue('chargeState', null);
            bb?.setValue('chargeTime', 0);
            return TaskStatus.Success;

        default:
            return TaskStatus.Failure;
    }
})
```

### 2. 错误处理

```typescript
.action('LoadResource', async (e, bb) => {
    try {
        const resourceId = bb?.getValue('resourceId');
        if (!resourceId) {
            console.error('资源ID未设置');
            return TaskStatus.Failure;
        }

        const resource = await loadResource(resourceId);
        bb?.setValue('loadedResource', resource);
        return TaskStatus.Success;

    } catch (error) {
        console.error('资源加载失败:', error);
        bb?.setValue('loadError', error.message);
        return TaskStatus.Failure;
    }
})
```

## 性能优化技巧

### 1. 使用冷却装饰器

避免高频执行昂贵操作：

```typescript
.cooldown(1.0)  // 最多每秒执行一次
    .action('ExpensiveSearch', () => {
        // 昂贵的搜索操作
        return TaskStatus.Success;
    })
.end()
```

### 2. 缓存计算结果

```typescript
.action('FindNearestEnemy', (e, bb) => {
    // 检查缓存是否有效
    const cacheTime = bb?.getValue('enemyCacheTime') || 0;
    const currentTime = Date.now();

    if (currentTime - cacheTime < 500) {  // 缓存500ms
        // 使用缓存结果
        return bb?.getValue('nearestEnemy') ? TaskStatus.Success : TaskStatus.Failure;
    }

    // 执行搜索
    const nearest = findNearestEnemy();
    bb?.setValue('nearestEnemy', nearest);
    bb?.setValue('enemyCacheTime', currentTime);

    return nearest ? TaskStatus.Success : TaskStatus.Failure;
})
```

### 3. 使用早期退出

```typescript
.selector('FindTarget')
    // 先检查缓存的目标
    .condition((e, bb) => bb?.hasVariable('cachedTarget'), 'HasCachedTarget')

    // 没有缓存才进行搜索
    .action('SearchNewTarget', (e, bb) => {
        const target = performExpensiveSearch();
        bb?.setValue('cachedTarget', target);
        return target ? TaskStatus.Success : TaskStatus.Failure;
    })
.end()
```

## 可维护性

### 1. 使用子树模块化

将可复用的行为提取为子树：

```typescript
// 巡逻子树
const patrolBehavior = BehaviorTreeBuilder.create(scene, 'Patrol')
    .sequence()
        .action('MoveToNextWaypoint', () => TaskStatus.Success)
        .wait(2.0)
    .end()
    .build();

// 主树中引用
const mainTree = BehaviorTreeBuilder.create(scene, 'EnemyAI')
    .selector()
        .sequence('Combat')
            // 战斗逻辑
        .end()
        .subTree(patrolBehavior)  // 复用巡逻行为
    .end()
    .build();
```

### 2. 使用编辑器创建复杂树

对于复杂的AI，使用可视化编辑器：

- 更直观的结构
- 方便非程序员调整
- 易于版本控制
- 支持实时调试


### 3. 添加注释和文档

```typescript
const ai = BehaviorTreeBuilder.create(scene, 'BossAI')
    .blackboard()
        .defineVariable('phase', BlackboardValueType.Number, 1)  // 1=正常, 2=狂暴, 3=濒死
    .endBlackboard()

    .selector('MainBehavior')
        // 阶段3：生命值<20%，使用终极技能
        .sequence('Phase3')
            .compareBlackboardValue('phase', CompareOperator.Equal, 3)
            .action('UltimateAbility', () => TaskStatus.Success)
        .end()

        // 阶段2：生命值<50%，进入狂暴
        .sequence('Phase2')
            .compareBlackboardValue('phase', CompareOperator.Equal, 2)
            .action('BerserkMode', () => TaskStatus.Success)
        .end()

        // 阶段1：正常战斗
        .sequence('Phase1')
            .action('NormalAttack', () => TaskStatus.Success)
        .end()
    .end()
    .build();
```

## 调试技巧

### 1. 使用日志节点

```typescript
.log('开始攻击序列', 'info')
.sequence('Attack')
    .log('检查目标', 'debug')
    .condition(hasTarget)
    .log('执行攻击', 'info')
    .action(attack)
.end()
```

### 2. 添加断言

```typescript
.action('ValidateState', (e, bb) => {
    const health = bb?.getValue('health');
    const maxHealth = bb?.getValue('maxHealth');

    console.assert(health !== undefined, 'health不应为undefined');
    console.assert(maxHealth !== undefined, 'maxHealth不应为undefined');
    console.assert(health <= maxHealth, `health(${health})不应大于maxHealth(${maxHealth})`);

    return TaskStatus.Success;
})
```

### 3. 状态可视化

```typescript
.action('DebugState', (e, bb) => {
    if (process.env.NODE_ENV === 'development') {
        console.group('AI State');
        console.log('Entity:', e.name);
        console.log('Health:', bb?.getValue('health'));
        console.log('State:', bb?.getValue('currentState'));
        console.log('Target:', bb?.getValue('target'));
        console.groupEnd();
    }
    return TaskStatus.Success;
})
```

## 常见反模式

### 1. 过深的嵌套

```typescript
// 不好 - 太深的嵌套
.selector()
    .sequence()
        .sequence()
            .sequence()
                .action('DeepAction', () => TaskStatus.Success)
            .end()
        .end()
    .end()
.end()

// 好 - 使用子树扁平化
const innerBehavior = BehaviorTreeBuilder.create(scene, 'Inner')
    .action('DeepAction', () => TaskStatus.Success)
    .build();

.selector()
    .subTree(innerBehavior)
.end()
```

### 2. 在行为树中实现游戏逻辑

```typescript
// 不好 - 行为树不应包含具体游戏逻辑
.action('Attack', (e, bb) => {
    const enemy = bb?.getValue('enemy');
    const damage = calculateDamage(e.getComponent(Weapon));
    enemy.health -= damage;

    if (enemy.health <= 0) {
        enemy.die();
        e.experience += enemy.expReward;
    }

    playAttackAnimation();
    playAttackSound();
    // 太多细节了！
})

// 好 - 行为树只负责决策，具体逻辑由系统处理
.action('Attack', (e, bb) => {
    const enemy = bb?.getValue('enemy');
    // 发送攻击命令，具体逻辑由战斗系统处理
    Core.ecsAPI?.emit('combat:attack', { attacker: e, target: enemy });
    return TaskStatus.Success;
})
```

### 3. 频繁修改黑板

```typescript
// 不好 - 每帧都修改黑板
.action('UpdatePosition', (e, bb, dt) => {
    const pos = getCurrentPosition();
    bb?.setValue('position', pos);  // 每帧都set
    bb?.setValue('velocity', getVelocity());
    bb?.setValue('rotation', getRotation());
    return TaskStatus.Running;
})

// 好 - 只在需要时修改
.action('UpdatePosition', (e, bb, dt) => {
    const oldPos = bb?.getValue('position');
    const newPos = getCurrentPosition();

    // 只在位置变化时更新
    if (!positionsEqual(oldPos, newPos)) {
        bb?.setValue('position', newPos);
    }

    return TaskStatus.Running;
})
```

## 测试建议

### 1. 单元测试节点

```typescript
describe('AttackAction', () => {
    it('应该在有目标时返回Success', () => {
        const scene = new Scene();
        const entity = scene.createEntity('Test');
        const blackboard = entity.addComponent(new BlackboardComponent());

        blackboard.setValue('target', mockEnemy);
        blackboard.setValue('ammo', 10);

        const result = attackAction(entity, blackboard, 0);

        expect(result).toBe(TaskStatus.Success);
    });

    it('应该在没有弹药时返回Failure', () => {
        const scene = new Scene();
        const entity = scene.createEntity('Test');
        const blackboard = entity.addComponent(new BlackboardComponent());

        blackboard.setValue('target', mockEnemy);
        blackboard.setValue('ammo', 0);

        const result = attackAction(entity, blackboard, 0);

        expect(result).toBe(TaskStatus.Failure);
    });
});
```

### 2. 集成测试

```typescript
describe('EnemyAI', () => {
    it('应该在玩家接近时攻击', () => {
        const scene = new Scene();
        const ai = createEnemyAI(scene);
        const blackboard = ai.getComponent(BlackboardComponent);

        // 设置玩家在攻击范围内
        blackboard?.setValue('player', mockPlayer);
        blackboard?.setValue('distanceToPlayer', 5);

        BehaviorTreeStarter.start(ai);
        scene.update();

        // 验证进入了攻击状态
        expect(blackboard?.getValue('currentState')).toBe('attacking');
    });
});
```

## 下一步

- 学习[自定义动作](./custom-actions.md)扩展行为树功能
- 探索[高级用法](./advanced-usage.md)了解更多技巧
