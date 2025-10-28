# 快速开始

本教程将引导你在5分钟内创建第一个行为树。

## 安装

```bash
npm install @esengine/behavior-tree
```

## 第一个行为树

让我们创建一个简单的AI行为树，实现"巡逻-发现敌人-攻击"的逻辑。

### 步骤1：导入依赖

```typescript
import { Core, Scene } from '@esengine/ecs-framework';
import {
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreePlugin,
    BlackboardValueType,
    TaskStatus,
    CompareOperator
} from '@esengine/behavior-tree';
```

### 步骤2：安装插件

```typescript
Core.create();
const plugin = new BehaviorTreePlugin();
await Core.installPlugin(plugin);
```

### 步骤3：创建场景并设置行为树系统

```typescript
const scene = new Scene();
plugin.setupScene(scene);
Core.setScene(scene);
```

### 步骤4：构建行为树

```typescript
const guardAI = BehaviorTreeBuilder.create(scene, 'GuardAI')
    // 定义黑板变量
    .blackboard()
        .defineVariable('health', BlackboardValueType.Number, 100)
        .defineVariable('hasEnemy', BlackboardValueType.Boolean, false)
        .defineVariable('patrolPoint', BlackboardValueType.Number, 0)
    .endBlackboard()

    // 根选择器
    .selector('RootSelector')
        // 分支1：如果发现敌人且生命值高，则攻击
        .sequence('CombatBranch')
            .checkBlackboardExists('hasEnemy', true, 'CheckEnemy')
            .compareBlackboardValue('health', CompareOperator.Greater, 30, 'CheckHealth')
            .action('Attack', (entity, blackboard) => {
                console.log('守卫正在攻击敌人');
                // 模拟攻击逻辑
                const health = blackboard?.getValue<number>('health') || 100;
                blackboard?.setValue('health', health - 10);
                return TaskStatus.Success;
            })
        .end()

        // 分支2：如果生命值低，则逃跑
        .sequence('FleeBranch')
            .compareBlackboardValue('health', CompareOperator.LessOrEqual, 30)
            .action('Flee', (entity) => {
                console.log('守卫生命值过低，正在逃跑');
                return TaskStatus.Success;
            })
        .end()

        // 分支3：默认巡逻
        .sequence('PatrolBranch')
            .action('MoveToNextPoint', (entity, blackboard) => {
                const point = blackboard?.getValue<number>('patrolPoint') || 0;
                const nextPoint = (point + 1) % 4;
                blackboard?.setValue('patrolPoint', nextPoint);
                console.log(`守卫移动到巡逻点 ${nextPoint}`);
                return TaskStatus.Success;
            })
            .wait(2.0, 'WaitAtPoint')  // 在巡逻点等待2秒
        .end()
    .end()
    .build();
```

### 步骤5：启动行为树

```typescript
BehaviorTreeStarter.start(guardAI);
```

### 步骤6：运行游戏循环

```typescript
// 模拟游戏循环
setInterval(() => {
    Core.update(0.1);  // 传入deltaTime(秒)
}, 100);  // 每100ms更新一次
```

## 完整代码

```typescript
import { Core, Scene } from '@esengine/ecs-framework';
import {
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreePlugin,
    BlackboardValueType,
    TaskStatus,
    CompareOperator
} from '@esengine/behavior-tree';

async function main() {
    // 创建核心和场景
    Core.create();
    const plugin = new BehaviorTreePlugin();
    await Core.installPlugin(plugin);

    const scene = new Scene();
    plugin.setupScene(scene);
    Core.setScene(scene);

    // 构建行为树
    const guardAI = BehaviorTreeBuilder.create(scene, 'GuardAI')
        .blackboard()
            .defineVariable('health', BlackboardValueType.Number, 100)
            .defineVariable('hasEnemy', BlackboardValueType.Boolean, false)
            .defineVariable('patrolPoint', BlackboardValueType.Number, 0)
        .endBlackboard()
        .selector('RootSelector')
            .sequence('CombatBranch')
                .checkBlackboardExists('hasEnemy', true)
                .compareBlackboardValue('health', CompareOperator.Greater, 30)
                .action('Attack', (entity, blackboard) => {
                    console.log('守卫正在攻击敌人');
                    const health = blackboard?.getValue<number>('health') || 100;
                    blackboard?.setValue('health', health - 10);
                    return TaskStatus.Success;
                })
            .end()
            .sequence('FleeBranch')
                .compareBlackboardValue('health', CompareOperator.LessOrEqual, 30)
                .action('Flee', () => {
                    console.log('守卫生命值过低，正在逃跑');
                    return TaskStatus.Success;
                })
            .end()
            .sequence('PatrolBranch')
                .action('MoveToNextPoint', (entity, blackboard) => {
                    const point = blackboard?.getValue<number>('patrolPoint') || 0;
                    const nextPoint = (point + 1) % 4;
                    blackboard?.setValue('patrolPoint', nextPoint);
                    console.log(`守卫移动到巡逻点 ${nextPoint}`);
                    return TaskStatus.Success;
                })
                .wait(2.0)
            .end()
        .end()
        .build();

    // 启动AI
    BehaviorTreeStarter.start(guardAI);

    // 运行游戏循环
    setInterval(() => {
        Core.update(0.1);  // 传入deltaTime(秒)
    }, 100);

    // 5秒后模拟发现敌人
    setTimeout(() => {
        const blackboard = guardAI.getComponent(BlackboardComponent);
        blackboard?.setValue('hasEnemy', true);
        console.log('发现敌人！');
    }, 5000);
}

main();
```

## 运行结果

运行程序后，你会看到类似的输出：

```
守卫移动到巡逻点 1
守卫移动到巡逻点 2
守卫移动到巡逻点 3
发现敌人！
守卫正在攻击敌人
守卫正在攻击敌人
守卫正在攻击敌人
...
守卫生命值过低，正在逃跑
```

## 理解代码

### 黑板变量

```typescript
.blackboard()
    .defineVariable('health', BlackboardValueType.Number, 100)
    .defineVariable('hasEnemy', BlackboardValueType.Boolean, false)
    .defineVariable('patrolPoint', BlackboardValueType.Number, 0)
.endBlackboard()
```

黑板用于在节点之间共享数据。这里定义了三个变量：
- `health`：守卫的生命值
- `hasEnemy`：是否发现敌人
- `patrolPoint`：当前巡逻点编号

### 选择器节点

```typescript
.selector('RootSelector')
    // 分支1
    // 分支2
    // 分支3
.end()
```

选择器按顺序尝试执行子节点，直到某个子节点返回成功。类似于编程中的 `if-else if-else`。

### 序列节点

```typescript
.sequence('CombatBranch')
    .checkBlackboardExists('hasEnemy', true)
    .compareBlackboardValue('health', CompareOperator.Greater, 30)
    .action('Attack', ...)
.end()
```

序列节点按顺序执行所有子节点，如果任何一个失败则整个序列失败。类似于编程中的 `&&` 运算符。

### 自定义动作

```typescript
.action('Attack', (entity, blackboard, deltaTime) => {
    // 你的自定义逻辑
    console.log('执行攻击');
    return TaskStatus.Success;
})
```

动作节点执行具体的操作并返回状态：
- `TaskStatus.Success`：成功完成
- `TaskStatus.Failure`：执行失败
- `TaskStatus.Running`：正在执行（需要多帧完成）

## 常见任务状态

行为树的每个节点返回以下状态之一：

- **Success**：任务成功完成
- **Failure**：任务执行失败
- **Running**：任务正在执行，需要在后续帧继续
- **Invalid**：无效状态（未初始化或已重置）

## 下一步

现在你已经创建了第一个行为树，接下来可以：

1. 学习[核心概念](./core-concepts.md)深入理解行为树原理
2. 尝试[编辑器使用指南](./editor-guide.md)可视化创建行为树
3. 查看[高级用法](./advanced-usage.md)了解更多功能

## 常见问题

### 为什么行为树不执行？

确保：
1. 已经安装了 `BehaviorTreePlugin`
2. 调用了 `plugin.setupScene(scene)`
3. 调用了 `BehaviorTreeStarter.start(aiRoot)`
4. 场景的 `update()` 方法在游戏循环中被调用

### 如何调试行为树？

使用日志动作和控制台输出：

```typescript
.log('到达这个节点', 'info')
.action('MyAction', (entity, blackboard) => {
    console.log('blackboard:', blackboard?.getAllVariables());
    return TaskStatus.Success;
})
```

### 如何停止行为树？

```typescript
BehaviorTreeStarter.stop(aiRoot);
```

或暂停后恢复：

```typescript
BehaviorTreeStarter.pause(aiRoot);
// ... 一段时间后
BehaviorTreeStarter.resume(aiRoot);
```
