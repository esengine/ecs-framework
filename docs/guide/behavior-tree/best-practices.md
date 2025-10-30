# 最佳实践

本文介绍行为树设计和使用的最佳实践,帮助你构建高效、可维护的AI系统。

## 行为树设计原则

### 1. 保持树的层次清晰

将复杂行为分解成清晰的层次结构:

```
Root Selector
├── Emergency (高优先级:紧急情况)
│   ├── FleeFromDanger
│   └── CallForHelp
├── Combat (中优先级:战斗)
│   ├── Attack
│   └── Defend
└── Idle (低优先级:空闲)
    ├── Patrol
    └── Rest
```


### 2. 单一职责原则

每个节点应该只做一件事。要实现复杂动作,创建自定义执行器,参见[自定义节点执行器](./custom-actions.md)。

```typescript
// 好的设计 - 使用内置节点
.sequence('AttackSequence')
    .blackboardExists('target', 'CheckTarget')
    .log('瞄准', 'Aim')
    .log('开火', 'Fire')
.end()
```

### 3. 使用描述性名称

节点名称应该清楚地表达其功能:

```typescript
// 好的命名
.blackboardCompare('health', 20, 'less', 'CheckHealthLow')
.log('寻找最近的医疗包', 'FindHealthPack')
.log('移动到医疗包', 'MoveToHealthPack')

// 不好的命名
.blackboardCompare('health', 20, 'less', 'C1')
.log('Do something', 'Action1')
.log('Move', 'A2')
```

## 黑板变量管理

### 1. 变量命名规范

使用清晰的命名约定:

```typescript
const tree = BehaviorTreeBuilder.create('AI')
    // 状态变量
    .defineBlackboardVariable('currentState', 'idle')
    .defineBlackboardVariable('isMoving', false)

    // 目标和引用
    .defineBlackboardVariable('targetEnemy', null)
    .defineBlackboardVariable('patrolPoints', [])

    // 配置参数
    .defineBlackboardVariable('attackRange', 5.0)
    .defineBlackboardVariable('moveSpeed', 10.0)

    // 临时数据
    .defineBlackboardVariable('lastAttackTime', 0)
    .defineBlackboardVariable('searchAttempts', 0)
    // ...
    .build();
```

### 2. 避免过度使用黑板

只在需要跨节点共享的数据才放入黑板。在自定义执行器中使用局部变量:

```typescript
// 好的做法 - 使用局部变量
export class CalculateAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        // 局部计算
        const temp1 = 10;
        const temp2 = 20;
        const result = temp1 + temp2;

        // 只保存需要共享的结果
        context.runtime.setBlackboardValue('calculationResult', result);

        return TaskStatus.Success;
    }
}
```

### 3. 使用类型安全的访问

```typescript
export class TypeSafeAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { runtime } = context;

        // 使用泛型进行类型安全访问
        const health = runtime.getBlackboardValue<number>('health');
        const target = runtime.getBlackboardValue<Entity | null>('target');
        const state = runtime.getBlackboardValue<string>('currentState');

        if (health !== undefined && health < 30) {
            runtime.setBlackboardValue('currentState', 'flee');
        }

        return TaskStatus.Success;
    }
}
```

## 执行器设计

### 1. 保持执行器无状态

状态必须存储在`context.state`中,而不是执行器实例:

```typescript
// 正确的做法
export class TimedAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        if (!context.state.startTime) {
            context.state.startTime = context.totalTime;
        }

        const elapsed = context.totalTime - context.state.startTime;

        if (elapsed >= 3.0) {
            return TaskStatus.Success;
        }

        return TaskStatus.Running;
    }

    reset(context: NodeExecutionContext): void {
        context.state.startTime = undefined;
    }
}
```

### 2. 条件应该是无副作用的

条件检查不应该修改状态:

```typescript
// 好的做法 - 只读检查
@NodeExecutorMetadata({
    implementationType: 'IsHealthLow',
    nodeType: NodeType.Condition,
    displayName: '检查生命值低',
    category: '条件',
    configSchema: {
        threshold: {
            type: 'number',
            default: 30,
            supportBinding: true
        }
    }
})
export class IsHealthLow implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const threshold = BindingHelper.getValue<number>(context, 'threshold', 30);
        const health = context.runtime.getBlackboardValue<number>('health') || 0;

        return health < threshold ? TaskStatus.Success : TaskStatus.Failure;
    }
}
```

### 3. 错误处理

```typescript
export class SafeAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        try {
            const resourceId = context.runtime.getBlackboardValue('resourceId');

            if (!resourceId) {
                console.error('[SafeAction] 资源ID未设置');
                return TaskStatus.Failure;
            }

            // 执行操作...

            return TaskStatus.Success;

        } catch (error) {
            console.error('[SafeAction] 执行失败:', error);
            context.runtime.setBlackboardValue('lastError', error.message);
            return TaskStatus.Failure;
        }
    }
}
```

## 性能优化技巧

### 1. 使用冷却装饰器

避免高频执行昂贵操作:

```typescript
const tree = BehaviorTreeBuilder.create('ThrottledAI')
    .cooldown(1.0, 'ThrottleSearch')  // 最多每秒执行一次
        .log('昂贵的搜索操作', 'ExpensiveSearch')
    .end()
    .build();
```

### 2. 缓存计算结果

```typescript
export class CachedFindNearest implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { state, runtime, totalTime } = context;

        // 检查缓存是否有效
        const cacheTime = state.enemyCacheTime || 0;

        if (totalTime - cacheTime < 0.5) {  // 缓存0.5秒
            const cached = runtime.getBlackboardValue('nearestEnemy');
            return cached ? TaskStatus.Success : TaskStatus.Failure;
        }

        // 执行搜索
        const nearest = findNearestEnemy();
        runtime.setBlackboardValue('nearestEnemy', nearest);
        state.enemyCacheTime = totalTime;

        return nearest ? TaskStatus.Success : TaskStatus.Failure;
    }

    reset(context: NodeExecutionContext): void {
        context.state.enemyCacheTime = undefined;
    }
}
```

### 3. 使用早期退出

```typescript
const tree = BehaviorTreeBuilder.create('EarlyExit')
    .selector('FindTarget')
        // 先检查缓存的目标
        .blackboardExists('cachedTarget', 'HasCachedTarget')

        // 没有缓存才进行搜索(需要自定义执行器)
        .log('执行昂贵的搜索', 'SearchNewTarget')
    .end()
    .build();
```

## 可维护性

### 1. 使用有意义的节点名称

```typescript
// 好的做法
const tree = BehaviorTreeBuilder.create('CombatAI')
    .selector('CombatDecision')
        .sequence('AttackEnemy')
            .blackboardExists('target', 'HasTarget')
            .log('执行攻击', 'Attack')
        .end()
    .end()
    .build();

// 不好的做法
const tree = BehaviorTreeBuilder.create('AI')
    .selector('Node1')
        .sequence('Node2')
            .blackboardExists('target', 'Node3')
            .log('Attack', 'Node4')
        .end()
    .end()
    .build();
```

### 2. 使用编辑器创建复杂树

对于复杂的AI,使用可视化编辑器:

- 更直观的结构
- 方便非程序员调整
- 易于版本控制
- 支持实时调试


### 3. 添加注释和文档

```typescript
// 为行为树添加清晰的注释
const bossAI = BehaviorTreeBuilder.create('BossAI')
    .defineBlackboardVariable('phase', 1)  // 1=正常, 2=狂暴, 3=濒死

    .selector('MainBehavior')
        // 阶段3: 生命值<20%,使用终极技能
        .sequence('Phase3')
            .blackboardCompare('phase', 3, 'equals')
            .log('使用终极技能', 'UltimateAbility')
        .end()

        // 阶段2: 生命值<50%,进入狂暴
        .sequence('Phase2')
            .blackboardCompare('phase', 2, 'equals')
            .log('进入狂暴模式', 'BerserkMode')
        .end()

        // 阶段1: 正常战斗
        .sequence('Phase1')
            .log('普通攻击', 'NormalAttack')
        .end()
    .end()
    .build();
```

## 调试技巧

### 1. 使用日志节点

```typescript
const tree = BehaviorTreeBuilder.create('Debug')
    .log('开始攻击序列', 'StartAttack')
    .sequence('Attack')
        .log('检查目标', 'CheckTarget')
        .blackboardExists('target')
        .log('执行攻击', 'DoAttack')
    .end()
    .build();
```

### 2. 在自定义执行器中调试

```typescript
export class DebugAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, runtime, state } = context;

        console.group(`[${nodeData.name}]`);
        console.log('配置:', nodeData.config);
        console.log('状态:', state);
        console.log('黑板:', runtime.getAllBlackboardVariables());
        console.log('活动节点:', Array.from(runtime.activeNodeIds));
        console.groupEnd();

        return TaskStatus.Success;
    }
}
```

### 3. 状态可视化

```typescript
export class VisualizeState implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        if (process.env.NODE_ENV === 'development') {
            console.group('AI State');
            console.log('Entity:', context.entity.name);
            console.log('Health:', context.runtime.getBlackboardValue('health'));
            console.log('State:', context.runtime.getBlackboardValue('currentState'));
            console.log('Target:', context.runtime.getBlackboardValue('target'));
            console.groupEnd();
        }

        return TaskStatus.Success;
    }
}
```

## 常见反模式

### 1. 过深的嵌套

```typescript
// 不好 - 太深的嵌套
.selector()
    .sequence()
        .sequence()
            .sequence()
                .log('太深了', 'DeepAction')
            .end()
        .end()
    .end()
.end()

// 好 - 使用合理的深度
.selector()
    .sequence()
        .log('Action1')
        .log('Action2')
    .end()
    .sequence()
        .log('Action3')
        .log('Action4')
    .end()
.end()
```

### 2. 在执行器中存储状态

```typescript
// 错误 - 状态存储在执行器中
export class BadAction implements INodeExecutor {
    private startTime = 0;  // 错误!多个节点会共享这个值

    execute(context: NodeExecutionContext): TaskStatus {
        this.startTime = context.totalTime;  // 错误!
        return TaskStatus.Success;
    }
}

// 正确 - 状态存储在context.state中
export class GoodAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        if (!context.state.startTime) {
            context.state.startTime = context.totalTime;  // 正确!
        }
        return TaskStatus.Success;
    }
}
```

### 3. 频繁修改黑板

```typescript
// 不好 - 每帧都修改黑板
export class FrequentUpdate implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const pos = getCurrentPosition();
        context.runtime.setBlackboardValue('position', pos);  // 每帧都set
        context.runtime.setBlackboardValue('velocity', getVelocity());
        context.runtime.setBlackboardValue('rotation', getRotation());
        return TaskStatus.Running;
    }
}

// 好 - 只在需要时修改
export class SmartUpdate implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const oldPos = context.runtime.getBlackboardValue('position');
        const newPos = getCurrentPosition();

        // 只在位置变化时更新
        if (!positionsEqual(oldPos, newPos)) {
            context.runtime.setBlackboardValue('position', newPos);
        }

        return TaskStatus.Running;
    }
}
```

## 下一步

- 学习[自定义节点执行器](./custom-actions.md)扩展行为树功能
- 探索[高级用法](./advanced-usage.md)了解更多技巧
- 参考[核心概念](./core-concepts.md)深入理解原理
