# 核心概念

本文介绍行为树系统的核心概念和工作原理。

## 什么是行为树?

行为树(Behavior Tree)是一种用于控制AI和自动化系统的决策结构。它通过树状层次结构组织任务,从根节点开始逐层执行,直到找到合适的行为。

### 与状态机的对比

传统状态机:
- 基于状态和转换
- 状态之间的转换复杂
- 难以扩展和维护
- 不便于复用

行为树:
- 基于任务和层次结构
- 模块化、易于复用
- 可视化编辑
- 灵活的决策逻辑


## 树结构

行为树由节点组成,形成树状结构:

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

每个节点都有:
- 父节点(除了根节点)
- 零个或多个子节点
- 执行状态
- 返回结果


## 节点类型

### 复合节点(Composite)

复合节点有多个子节点,按特定规则执行它们。

#### Selector(选择器)

按顺序尝试执行子节点,直到某个子节点成功。

```typescript
const tree = BehaviorTreeBuilder.create('FindFood')
    .selector('FindFoodSelector')
        .log('尝试吃附近的食物', 'EatNearby')
        .log('搜索食物', 'SearchFood')
        .log('放弃', 'GiveUp')
    .end()
    .build();
```

执行逻辑:
1. 尝试第一个子节点
2. 如果返回Success,选择器成功
3. 如果返回Failure,尝试下一个子节点
4. 如果返回Running,选择器返回Running
5. 所有子节点都失败时,选择器失败


#### Sequence(序列)

按顺序执行所有子节点,直到某个子节点失败。

```typescript
const tree = BehaviorTreeBuilder.create('Attack')
    .sequence('AttackSequence')
        .blackboardExists('target')  // 检查是否有目标
        .log('瞄准', 'Aim')
        .log('开火', 'Fire')
    .end()
    .build();
```

执行逻辑:
1. 依次执行子节点
2. 如果子节点返回Failure,序列失败
3. 如果子节点返回Running,序列返回Running
4. 如果子节点返回Success,继续下一个子节点
5. 所有子节点都成功时,序列成功


#### Parallel(并行)

同时执行多个子节点。

```typescript
const tree = BehaviorTreeBuilder.create('PlayEffects')
    .parallel('Effects', {
        successPolicy: 'all',  // 所有任务都要成功
        failurePolicy: 'one'   // 任一失败则失败
    })
        .log('播放动画', 'PlayAnimation')
        .log('播放音效', 'PlaySound')
        .log('生成粒子', 'SpawnEffect')
    .end()
    .build();
```

策略类型:
- `successPolicy: 'all'`: 所有子节点都成功才成功
- `successPolicy: 'one'`: 任意一个子节点成功就成功
- `failurePolicy: 'all'`: 所有子节点都失败才失败
- `failurePolicy: 'one'`: 任意一个子节点失败就失败


### 装饰器节点(Decorator)

装饰器节点只有一个子节点,用于修改子节点的行为或结果。

#### Inverter(反转)

反转子节点的结果:

```typescript
const tree = BehaviorTreeBuilder.create('CheckSafe')
    .inverter('NotHasEnemy')
        .blackboardExists('enemy')
    .end()
    .build();
```

#### Repeater(重复)

重复执行子节点:

```typescript
const tree = BehaviorTreeBuilder.create('Jump3Times')
    .repeater(3, 'RepeatJump')
        .log('跳跃', 'Jump')
    .end()
    .build();
```

#### Cooldown(冷却)

限制子节点的执行频率:

```typescript
const tree = BehaviorTreeBuilder.create('UseSkill')
    .cooldown(5.0, 'SkillCooldown')
        .log('使用特殊技能', 'UseSpecialAbility')
    .end()
    .build();
```

#### Timeout(超时)

限制子节点的执行时间:

```typescript
const tree = BehaviorTreeBuilder.create('TimedTask')
    .timeout(10.0, 'TaskTimeout')
        .log('长时间运行的任务', 'ComplexTask')
    .end()
    .build();
```


### 叶节点(Leaf)

叶节点没有子节点,执行具体的任务。

#### Action(动作)

执行具体操作。内置动作节点包括:

```typescript
const tree = BehaviorTreeBuilder.create('Actions')
    .sequence()
        .wait(2.0)  // 等待2秒
        .log('Hello', 'LogAction')  // 输出日志
        .setBlackboardValue('score', 100)  // 设置黑板值
        .modifyBlackboardValue('score', 'add', 10)  // 修改黑板值
    .end()
    .build();
```

要实现自定义动作,需要创建自定义执行器,参见[自定义节点执行器](./custom-actions.md)。

#### Condition(条件)

检查条件。内置条件节点包括:

```typescript
const tree = BehaviorTreeBuilder.create('Conditions')
    .selector()
        .blackboardExists('player')  // 检查变量是否存在
        .blackboardCompare('health', 50, 'greater')  // 比较变量值
        .randomProbability(0.5)  // 50%概率
    .end()
    .build();
```

#### Wait(等待)

等待指定时间:

```typescript
const tree = BehaviorTreeBuilder.create('WaitExample')
    .wait(2.0, 'Wait2Seconds')
    .build();
```


## 任务状态

每个节点执行后返回以下状态之一:

### Success(成功)

任务成功完成。

```typescript
// 内置节点会根据逻辑自动返回Success
.log('任务完成')  // 总是返回Success
.blackboardCompare('score', 100, 'greater')  // 条件满足时返回Success
```

### Failure(失败)

任务执行失败。

```typescript
.blackboardCompare('score', 100, 'greater')  // 条件不满足返回Failure
.blackboardExists('nonExistent')  // 变量不存在返回Failure
```

### Running(运行中)

任务需要多帧完成,仍在执行中。

```typescript
.wait(3.0)  // 等待过程中返回Running,3秒后返回Success
```

### Invalid(无效)

节点未初始化或已重置。通常不需要手动处理此状态。


## 黑板系统

黑板(Blackboard)是行为树的数据存储系统,用于在节点之间共享数据。

### 本地黑板

每个行为树实例都有自己的本地黑板:

```typescript
const tree = BehaviorTreeBuilder.create('EnemyAI')
    .defineBlackboardVariable('health', 100)
    .defineBlackboardVariable('target', null)
    .defineBlackboardVariable('state', 'idle')
    // ...
    .build();
```

### 支持的数据类型

黑板支持以下数据类型:
- String：字符串
- Number：数字
- Boolean：布尔值
- Vector2：二维向量
- Vector3：三维向量
- Object：对象引用
- Array：数组

示例:

```typescript
const tree = BehaviorTreeBuilder.create('Variables')
    .defineBlackboardVariable('name', 'Enemy')  // 字符串
    .defineBlackboardVariable('count', 0)  // 数字
    .defineBlackboardVariable('isActive', true)  // 布尔值
    .defineBlackboardVariable('position', { x: 0, y: 0 })  // 对象(也可用于Vector2)
    .defineBlackboardVariable('velocity', { x: 0, y: 0, z: 0 })  // 对象(也可用于Vector3)
    .defineBlackboardVariable('items', [])  // 数组
    .build();
```

### 读写变量

通过`BehaviorTreeRuntimeComponent`访问黑板:

```typescript
const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);

// 读取变量
const health = runtime?.getBlackboardValue('health');
const target = runtime?.getBlackboardValue('target');

// 写入变量
runtime?.setBlackboardValue('health', 50);
runtime?.setBlackboardValue('lastAttackTime', Date.now());

// 获取所有变量
const allVars = runtime?.getAllBlackboardVariables();
```

也可以使用内置节点操作黑板:

```typescript
const tree = BehaviorTreeBuilder.create('BlackboardOps')
    .sequence()
        .setBlackboardValue('score', 100)  // 设置值
        .modifyBlackboardValue('score', 'add', 10)  // 增加10
        .blackboardCompare('score', 110, 'equals')  // 检查是否等于110
    .end()
    .build();
```

### 全局黑板

所有行为树实例共享的黑板,通过`GlobalBlackboardService`访问:

```typescript
import { GlobalBlackboardService } from '@esengine/behavior-tree';
import { Core } from '@esengine/ecs-framework';

const globalBlackboard = Core.services.resolve(GlobalBlackboardService);

// 设置全局变量
globalBlackboard.setValue('gameState', 'playing');
globalBlackboard.setValue('difficulty', 5);

// 读取全局变量
const gameState = globalBlackboard.getValue('gameState');
```

在自定义执行器中访问全局黑板:

```typescript
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


## 执行流程

### 初始化

```typescript
// 1. 初始化Core和插件
Core.create();
const plugin = new BehaviorTreePlugin();
await Core.installPlugin(plugin);

// 2. 创建场景
const scene = new Scene();
plugin.setupScene(scene);
Core.setScene(scene);

// 3. 构建行为树
const tree = BehaviorTreeBuilder.create('AI')
    // ... 定义节点
    .build();

// 4. 创建实体并启动
const entity = scene.createEntity('AIEntity');
BehaviorTreeStarter.start(entity, tree);
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
2. 根节点执行其逻辑(通常是Selector或Sequence)
3. 根节点的子节点按顺序执行
4. 每个子节点可能有自己的子节点
5. 叶节点执行具体操作并返回状态
6. 状态向上传播到父节点
7. 父节点根据策略决定如何处理子节点的状态
8. 最终根节点返回整体状态
```

### 执行示例

```typescript
const tree = BehaviorTreeBuilder.create('Example')
    .selector('Root')  // 1. 执行选择器
        .sequence('Branch1')  // 2. 尝试第一个分支
            .blackboardCompare('ready', true, 'equals', 'CheckReady')  // 3. 条件失败
        .end()  // 4. 序列失败,选择器继续下一个分支
        .sequence('Branch2')  // 5. 尝试第二个分支
            .blackboardCompare('active', true, 'equals', 'CheckActive')  // 6. 条件成功
            .log('执行动作', 'DoAction')  // 7. 动作成功
        .end()  // 8. 序列成功,选择器成功
    .end()  // 9. 整个树成功
    .build();
```

执行流程图:

```
Root(Selector)
  → Branch1(Sequence)
    → CheckReady: Failure
  → Branch1 fails
  → Branch2(Sequence)
    → CheckActive: Success
    → DoAction: Success
  → Branch2 succeeds
→ Root succeeds
```


## Runtime架构

本框架的行为树采用Runtime执行器架构:

### 核心组件

- **BehaviorTreeData**: 纯数据结构,描述行为树的结构和配置
- **BehaviorTreeRuntimeComponent**: 运行时组件,管理执行状态和黑板
- **BehaviorTreeExecutionSystem**: 执行系统,驱动行为树运行
- **INodeExecutor**: 节点执行器接口,定义节点的执行逻辑
- **NodeExecutionContext**: 执行上下文,包含执行所需的所有信息

### 架构特点

1. **数据与逻辑分离**: BehaviorTreeData是纯数据,执行逻辑在执行器中
2. **无状态执行器**: 执行器实例可以在多个节点间共享,状态存储在Runtime中
3. **类型安全**: 通过TypeScript类型系统保证类型安全
4. **高性能**: 避免不必要的对象创建,优化内存使用

### 数据流

```
BehaviorTreeBuilder
  ↓ (构建)
BehaviorTreeData
  ↓ (加载到)
BehaviorTreeAssetManager
  ↓ (读取)
BehaviorTreeExecutionSystem
  ↓ (执行)
INodeExecutor.execute(context)
  ↓ (返回)
TaskStatus
  ↓ (更新)
NodeRuntimeState
```


## 下一步

现在你已经理解了行为树的核心概念,接下来可以:

- 查看[快速开始](./getting-started.md)创建第一个行为树
- 学习[自定义节点执行器](./custom-actions.md)创建自定义节点
- 探索[高级用法](./advanced-usage.md)了解更多功能
- 阅读[最佳实践](./best-practices.md)学习设计模式
