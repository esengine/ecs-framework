# 快速开始

本教程将引导你在5分钟内创建第一个行为树。

## 安装

```bash
npm install @esengine/behavior-tree
```

## 第一个行为树

让我们创建一个简单的AI行为树,实现"巡逻-发现敌人-攻击"的逻辑。

### 步骤1: 导入依赖

```typescript
import { Core, Scene, Entity } from '@esengine/ecs-framework';
import {
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreePlugin
} from '@esengine/behavior-tree';
```

### 步骤2: 初始化Core并安装插件

```typescript
Core.create();
const plugin = new BehaviorTreePlugin();
await Core.installPlugin(plugin);
```

### 步骤3: 创建场景并设置行为树系统

```typescript
const scene = new Scene();
plugin.setupScene(scene);
Core.setScene(scene);
```

### 步骤4: 构建行为树数据

```typescript
const guardAITree = BehaviorTreeBuilder.create('GuardAI')
    // 定义黑板变量
    .defineBlackboardVariable('health', 100)
    .defineBlackboardVariable('hasEnemy', false)
    .defineBlackboardVariable('patrolPoint', 0)

    // 根选择器
    .selector('RootSelector')
        // 分支1: 如果发现敌人且生命值高,则攻击
        .selector('CombatBranch')
            .blackboardExists('hasEnemy', 'CheckEnemy')
            .blackboardCompare('health', 30, 'greater', 'CheckHealth')
            .log('守卫正在攻击敌人', 'Attack')
        .end()

        // 分支2: 如果生命值低,则逃跑
        .selector('FleeBranch')
            .blackboardCompare('health', 30, 'lessOrEqual', 'CheckLowHealth')
            .log('守卫生命值过低,正在逃跑', 'Flee')
        .end()

        // 分支3: 默认巡逻
        .selector('PatrolBranch')
            .modifyBlackboardValue('patrolPoint', 'add', 1, 'IncrementPatrol')
            .log('守卫正在巡逻', 'Patrol')
            .wait(2.0, 'WaitAtPoint')
        .end()
    .end()
    .build();
```

### 步骤5: 创建实体并启动行为树

```typescript
// 创建守卫实体
const guardEntity = scene.createEntity('Guard');

// 启动行为树
BehaviorTreeStarter.start(guardEntity, guardAITree);
```

### 步骤6: 运行游戏循环

```typescript
// 模拟游戏循环
setInterval(() => {
    Core.update(0.1);  // 传入deltaTime(秒)
}, 100);  // 每100ms更新一次
```

### 步骤7: 模拟游戏事件

```typescript
// 5秒后模拟发现敌人
setTimeout(() => {
    const runtime = guardEntity.getComponent(BehaviorTreeRuntimeComponent);
    runtime?.setBlackboardValue('hasEnemy', true);
    console.log('发现敌人!');
}, 5000);

// 10秒后模拟受伤
setTimeout(() => {
    const runtime = guardEntity.getComponent(BehaviorTreeRuntimeComponent);
    runtime?.setBlackboardValue('health', 20);
    console.log('守卫受伤!');
}, 10000);
```

## 完整代码

```typescript
import { Core, Scene } from '@esengine/ecs-framework';
import {
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreePlugin,
    BehaviorTreeRuntimeComponent
} from '@esengine/behavior-tree';

async function main() {
    // 1. 创建核心并安装插件
    Core.create();
    const plugin = new BehaviorTreePlugin();
    await Core.installPlugin(plugin);

    // 2. 创建场景
    const scene = new Scene();
    plugin.setupScene(scene);
    Core.setScene(scene);

    // 3. 构建行为树数据
    const guardAITree = BehaviorTreeBuilder.create('GuardAI')
        .defineBlackboardVariable('health', 100)
        .defineBlackboardVariable('hasEnemy', false)
        .defineBlackboardVariable('patrolPoint', 0)
        .selector('RootSelector')
            .selector('CombatBranch')
                .blackboardExists('hasEnemy')
                .blackboardCompare('health', 30, 'greater')
                .log('守卫正在攻击敌人')
            .end()
            .selector('FleeBranch')
                .blackboardCompare('health', 30, 'lessOrEqual')
                .log('守卫生命值过低,正在逃跑')
            .end()
            .selector('PatrolBranch')
                .modifyBlackboardValue('patrolPoint', 'add', 1)
                .log('守卫正在巡逻')
                .wait(2.0)
            .end()
        .end()
        .build();

    // 4. 创建守卫实体并启动行为树
    const guardEntity = scene.createEntity('Guard');
    BehaviorTreeStarter.start(guardEntity, guardAITree);

    // 5. 运行游戏循环
    setInterval(() => {
        Core.update(0.1);
    }, 100);

    // 6. 模拟游戏事件
    setTimeout(() => {
        const runtime = guardEntity.getComponent(BehaviorTreeRuntimeComponent);
        runtime?.setBlackboardValue('hasEnemy', true);
        console.log('发现敌人!');
    }, 5000);

    setTimeout(() => {
        const runtime = guardEntity.getComponent(BehaviorTreeRuntimeComponent);
        runtime?.setBlackboardValue('health', 20);
        console.log('守卫受伤!');
    }, 10000);
}

main();
```

## 运行结果

运行程序后,你会看到类似的输出:

```
守卫正在巡逻
守卫正在巡逻
守卫正在巡逻
发现敌人!
守卫正在攻击敌人
守卫正在攻击敌人
守卫受伤!
守卫生命值过低,正在逃跑
```

## 理解代码

### 黑板变量

```typescript
.defineBlackboardVariable('health', 100)
.defineBlackboardVariable('hasEnemy', false)
.defineBlackboardVariable('patrolPoint', 0)
```

黑板用于在节点之间共享数据。这里定义了三个变量:
- `health`: 守卫的生命值
- `hasEnemy`: 是否发现敌人
- `patrolPoint`: 当前巡逻点编号

### 选择器节点

```typescript
.selector('RootSelector')
    // 分支1
    // 分支2
    // 分支3
.end()
```

选择器按顺序尝试执行子节点,直到某个子节点返回成功。类似于编程中的 `if-else if-else`。

### 条件节点

```typescript
.blackboardExists('hasEnemy')  // 检查变量是否存在
.blackboardCompare('health', 30, 'greater')  // 比较变量值
```

条件节点用于检查黑板变量的值。

### 动作节点

```typescript
.log('守卫正在攻击敌人')  // 输出日志
.wait(2.0)  // 等待2秒
.modifyBlackboardValue('patrolPoint', 'add', 1)  // 修改黑板值
```

动作节点执行具体的操作。

### Runtime组件

```typescript
const runtime = guardEntity.getComponent(BehaviorTreeRuntimeComponent);
runtime?.setBlackboardValue('hasEnemy', true);
runtime?.getBlackboardValue('health');
```

通过`BehaviorTreeRuntimeComponent`访问和修改黑板变量。

## 常见任务状态

行为树的每个节点返回以下状态之一:

- **Success**: 任务成功完成
- **Failure**: 任务执行失败
- **Running**: 任务正在执行,需要在后续帧继续
- **Invalid**: 无效状态(未初始化或已重置)

## 内置节点

### 复合节点

- `sequence()` - 序列节点,按顺序执行所有子节点
- `selector()` - 选择器节点,按顺序尝试子节点直到成功
- `parallel()` - 并行节点,同时执行多个子节点
- `parallelSelector()` - 并行选择器
- `randomSequence()` - 随机序列
- `randomSelector()` - 随机选择器

### 装饰器节点

- `inverter()` - 反转子节点结果
- `repeater(count)` - 重复执行子节点
- `alwaysSucceed()` - 总是返回成功
- `alwaysFail()` - 总是返回失败
- `untilSuccess()` - 重复直到成功
- `untilFail()` - 重复直到失败
- `conditional(key, value, operator)` - 条件装饰器
- `cooldown(time)` - 冷却装饰器
- `timeout(time)` - 超时装饰器

### 动作节点

- `wait(duration)` - 等待指定时间
- `log(message)` - 输出日志
- `setBlackboardValue(key, value)` - 设置黑板值
- `modifyBlackboardValue(key, operation, value)` - 修改黑板值
- `executeAction(actionName)` - 执行自定义动作

### 条件节点

- `blackboardExists(key)` - 检查变量是否存在
- `blackboardCompare(key, value, operator)` - 比较黑板值
- `randomProbability(probability)` - 随机概率
- `executeCondition(conditionName)` - 执行自定义条件

## 控制行为树

### 启动

```typescript
BehaviorTreeStarter.start(entity, treeData);
```

### 停止

```typescript
BehaviorTreeStarter.stop(entity);
```

### 暂停和恢复

```typescript
BehaviorTreeStarter.pause(entity);
// ... 一段时间后
BehaviorTreeStarter.resume(entity);
```

### 重启

```typescript
BehaviorTreeStarter.restart(entity);
```

## 下一步

现在你已经创建了第一个行为树,接下来可以:

1. 学习[核心概念](./core-concepts.md)深入理解行为树原理
2. 学习[资产管理](./asset-management.md)了解如何加载和复用行为树、使用子树
3. 查看[自定义节点执行器](./custom-actions.md)学习如何创建自定义节点
4. 根据你的场景查看集成教程：[Cocos Creator](./cocos-integration.md) 或 [Node.js](./nodejs-usage.md)
5. 查看[高级用法](./advanced-usage.md)了解更多功能

## 常见问题

### 为什么行为树不执行?

确保:
1. 已经安装了 `BehaviorTreePlugin`
2. 调用了 `plugin.setupScene(scene)`
3. 调用了 `BehaviorTreeStarter.start(entity, treeData)`
4. 在游戏循环中调用了 `Core.update(deltaTime)`

### 如何访问黑板变量?

```typescript
const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);

// 读取
const health = runtime?.getBlackboardValue('health');

// 写入
runtime?.setBlackboardValue('health', 50);

// 获取所有变量
const allVars = runtime?.getAllBlackboardVariables();
```

### 如何调试行为树?

使用日志节点:

```typescript
.log('到达这个节点', 'DebugLog')
```

或者在代码中监控黑板:

```typescript
const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
console.log('黑板变量:', runtime?.getAllBlackboardVariables());
console.log('活动节点:', Array.from(runtime?.activeNodeIds || []));
```

### 如何使用自定义逻辑?

内置的`executeAction`和`executeCondition`节点只是占位符。要实现真正的自定义逻辑,你需要创建自定义执行器:

参见[自定义节点执行器](./custom-actions.md)学习如何创建。
