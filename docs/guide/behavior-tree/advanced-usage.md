# 高级用法

本文介绍行为树系统的高级功能和使用技巧。

## 全局黑板

全局黑板在所有行为树实例之间共享数据。

### 使用全局黑板

```typescript
import { GlobalBlackboardService } from '@esengine/behavior-tree';
import { Core } from '@esengine/ecs-framework';

// 获取全局黑板服务
const globalBlackboard = Core.services.resolve(GlobalBlackboardService);

// 设置全局变量
globalBlackboard.setValue('gameState', 'playing');
globalBlackboard.setValue('playerCount', 4);
globalBlackboard.setValue('difficulty', 'hard');

// 读取全局变量
const gameState = globalBlackboard.getValue('gameState');
const playerCount = globalBlackboard.getValue<number>('playerCount');
```

### 在自定义执行器中访问全局黑板

```typescript
import { INodeExecutor, NodeExecutionContext, BindingHelper } from '@esengine/behavior-tree';
import { GlobalBlackboardService } from '@esengine/behavior-tree';
import { Core } from '@esengine/ecs-framework';

export class CheckGameState implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const globalBlackboard = Core.services.resolve(GlobalBlackboardService);
        const gameState = globalBlackboard.getValue('gameState');

        if (gameState === 'paused') {
            return TaskStatus.Failure;
        }

        return TaskStatus.Success;
    }
}
```

## 性能优化

### 1. 降低更新频率

对于不需要每帧更新的AI,可以使用冷却装饰器:

```typescript
// 每0.1秒执行一次
const ai = BehaviorTreeBuilder.create('ThrottledAI')
    .cooldown(0.1, 'ThrottleRoot')
        .selector('MainLogic')
            // AI逻辑...
        .end()
    .end()
    .build();
```

### 2. 条件缓存

在自定义执行器中缓存昂贵的条件检查结果:

```typescript
export class CachedCheck implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { state, runtime, totalTime } = context;
        const cacheTime = state.lastCheckTime || 0;

        // 如果缓存未过期(1秒内),直接使用缓存结果
        if (totalTime - cacheTime < 1.0) {
            return state.cachedResult || TaskStatus.Failure;
        }

        // 执行昂贵的检查
        const result = performExpensiveCheck();
        const status = result ? TaskStatus.Success : TaskStatus.Failure;

        // 缓存结果
        state.cachedResult = status;
        state.lastCheckTime = totalTime;

        return status;
    }

    reset(context: NodeExecutionContext): void {
        context.state.cachedResult = undefined;
        context.state.lastCheckTime = undefined;
    }
}
```

### 3. 分帧执行

将大量计算分散到多帧:

```typescript
export class ProcessLargeDataset implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { state, runtime } = context;

        const data = runtime.getBlackboardValue<any[]>('dataset') || [];
        let processedIndex = state.processedIndex || 0;

        const batchSize = 100;  // 每帧处理100个
        const endIndex = Math.min(processedIndex + batchSize, data.length);

        for (let i = processedIndex; i < endIndex; i++) {
            processItem(data[i]);
        }

        state.processedIndex = endIndex;

        if (endIndex >= data.length) {
            return TaskStatus.Success;
        }

        return TaskStatus.Running;
    }

    reset(context: NodeExecutionContext): void {
        context.state.processedIndex = 0;
    }
}
```

## 调试技巧

### 1. 使用日志节点

在关键位置添加日志:

```typescript
const tree = BehaviorTreeBuilder.create('Debug')
    .log('开始战斗序列', 'StartCombat')
    .sequence('Combat')
        .log('检查生命值', 'CheckHealth')
        .blackboardCompare('health', 0, 'greater')
        .log('执行攻击', 'Attack')
    .end()
    .build();
```

### 2. 监控黑板状态

```typescript
const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);

// 输出所有黑板变量
console.log('黑板变量:', runtime?.getAllBlackboardVariables());

// 输出活动节点
console.log('活动节点:', Array.from(runtime?.activeNodeIds || []));
```

### 3. 在自定义执行器中调试

```typescript
export class DebugAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, runtime, state } = context;

        console.log(`[${nodeData.name}] 开始执行`);
        console.log('配置:', nodeData.config);
        console.log('状态:', state);
        console.log('黑板:', runtime.getAllBlackboardVariables());

        // 执行逻辑...

        return TaskStatus.Success;
    }
}
```

### 4. 性能分析

测量节点执行时间:

```typescript
export class ProfiledAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const startTime = performance.now();

        // 执行操作
        doSomething();

        const elapsed = performance.now() - startTime;
        console.log(`[${context.nodeData.name}] 耗时: ${elapsed.toFixed(2)}ms`);

        return TaskStatus.Success;
    }
}
```

## 常见模式

### 1. 状态机模式

使用行为树实现状态机:

```typescript
const fsm = BehaviorTreeBuilder.create('StateMachine')
    .defineBlackboardVariable('currentState', 'idle')
    .selector('StateSwitch')
        // Idle状态
        .sequence('IdleState')
            .blackboardCompare('currentState', 'idle', 'equals')
            .log('执行Idle行为', 'IdleBehavior')
        .end()
        // Move状态
        .sequence('MoveState')
            .blackboardCompare('currentState', 'move', 'equals')
            .log('执行Move行为', 'MoveBehavior')
        .end()
        // Attack状态
        .sequence('AttackState')
            .blackboardCompare('currentState', 'attack', 'equals')
            .log('执行Attack行为', 'AttackBehavior')
        .end()
    .end()
    .build();
```

状态转换通过修改黑板变量实现:

```typescript
const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
runtime?.setBlackboardValue('currentState', 'move');
```

### 2. 优先级队列模式

按优先级执行任务:

```typescript
const tree = BehaviorTreeBuilder.create('PriorityQueue')
    .selector('Priorities')
        // 最高优先级:生存
        .sequence('Survive')
            .blackboardCompare('health', 20, 'less')
            .log('治疗', 'Heal')
        .end()
        // 中优先级:战斗
        .sequence('Combat')
            .blackboardExists('nearbyEnemy')
            .log('战斗', 'Fight')
        .end()
        // 低优先级:收集资源
        .sequence('Gather')
            .log('收集资源', 'CollectResources')
        .end()
    .end()
    .build();
```

### 3. 并行任务模式

同时执行多个任务:

```typescript
const tree = BehaviorTreeBuilder.create('ParallelTasks')
    .parallel('Effects', { successPolicy: 'all' })
        .log('播放动画', 'PlayAnimation')
        .log('播放音效', 'PlaySound')
        .log('生成粒子', 'SpawnParticles')
    .end()
    .build();
```

### 4. 重试模式

失败时重试:

```typescript
// 使用自定义重试装饰器(参见custom-actions.md中的RetryDecorator示例)
// 或者使用UntilSuccess装饰器
const tree = BehaviorTreeBuilder.create('Retry')
    .untilSuccess('RetryUntilSuccess')
        .log('尝试操作', 'TryOperation')
    .end()
    .build();
```

### 5. 超时模式

限制任务执行时间:

```typescript
const tree = BehaviorTreeBuilder.create('Timeout')
    .timeout(5.0, 'TimeLimit')
        .log('长时间运行的任务', 'LongTask')
    .end()
    .build();
```

## 与游戏引擎集成

### Cocos Creator集成

参见[Cocos Creator集成指南](./cocos-integration.md)

### LayaAir集成

参见[LayaAir集成指南](./laya-integration.md)

## 最佳实践

### 1. 合理使用黑板

```typescript
// 好的做法:使用类型化的黑板访问
const health = runtime.getBlackboardValue<number>('health');

// 好的做法:定义所有黑板变量
const tree = BehaviorTreeBuilder.create('AI')
    .defineBlackboardVariable('health', 100)
    .defineBlackboardVariable('target', null)
    .defineBlackboardVariable('state', 'idle')
    // ...
```

### 2. 避免过深的树结构

```typescript
// 不好:嵌套过深
.selector()
    .sequence()
        .selector()
            .sequence()
                .selector()
                    // 太深了!
                .end()
            .end()
        .end()
    .end()
.end()

// 好:使用合理的深度
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

### 3. 使用有意义的节点名称

```typescript
// 好的做法
.selector('CombatDecision')
    .sequence('AttackEnemy')
        .blackboardExists('target', 'HasTarget')
        .log('执行攻击', 'Attack')
    .end()
.end()

// 不好的做法
.selector('Node1')
    .sequence('Node2')
        .blackboardExists('target', 'Node3')
        .log('Attack', 'Node4')
    .end()
.end()
```

### 4. 模块化设计

将复杂逻辑分解为多个独立的行为树,在需要时组合使用。

### 5. 性能考虑

- 避免在每帧执行昂贵的操作
- 使用冷却装饰器控制执行频率
- 缓存计算结果
- 合理使用并行节点

## 下一步

- 查看[自定义节点执行器](./custom-actions.md)学习如何创建自定义节点
- 阅读[最佳实践](./best-practices.md)了解行为树设计技巧
- 参考[编辑器使用指南](./editor-guide.md)学习可视化编辑
