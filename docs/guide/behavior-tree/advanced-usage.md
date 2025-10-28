# 高级用法

本文介绍行为树系统的高级功能和使用技巧。

## 子树系统

子树允许你将行为树的一部分抽取为独立的资产，实现复用和模块化。

### 创建子树

子树本质上就是一个独立的行为树资产：

```typescript
import { BehaviorTreeBuilder, BlackboardValueType, TaskStatus } from '@esengine/behavior-tree';

// 创建一个巡逻子树
const patrolSubtree = BehaviorTreeBuilder.create(scene, 'PatrolBehavior')
    .blackboard()
        .defineVariable('patrolPoints', BlackboardValueType.Array, [])
        .defineVariable('currentIndex', BlackboardValueType.Number, 0)
    .endBlackboard()
    .sequence('PatrolSequence')
        .action('MoveToNextPoint', (entity, blackboard) => {
            const points = blackboard?.getValue('patrolPoints') || [];
            const index = blackboard?.getValue('currentIndex') || 0;

            if (points.length === 0) return TaskStatus.Failure;

            const target = points[index];
            console.log(`移动到巡逻点 ${index}:`, target);

            // 移动逻辑...

            return TaskStatus.Success;
        })
        .action('UpdateIndex', (entity, blackboard) => {
            const points = blackboard?.getValue('patrolPoints') || [];
            const index = blackboard?.getValue('currentIndex') || 0;
            const nextIndex = (index + 1) % points.length;
            blackboard?.setValue('currentIndex', nextIndex);
            return TaskStatus.Success;
        })
        .wait(1.0)
    .end()
    .build();
```

### 使用SubTree节点

在主树中引用子树：

```typescript
const mainTree = BehaviorTreeBuilder.create(scene, 'EnemyAI')
    .blackboard()
        .defineVariable('health', BlackboardValueType.Number, 100)
    .endBlackboard()
    .selector('Root')
        .sequence('Combat')
            .compareBlackboardValue('health', CompareOperator.Greater, 50)
            .action('Attack', () => TaskStatus.Success)
        .end()
        // 使用子树
        .subTree(patrolSubtree, {
            inheritParentBlackboard: true,  // 继承父黑板
            propagateFailure: true          // 传播失败状态
        })
    .end()
    .build();
```


### 从资产加载子树

使用编辑器创建的子树资产：

```typescript
import {
    BehaviorTreeAssetSerializer,
    BehaviorTreeAssetLoader,
    BehaviorTreeBuilder
} from '@esengine/behavior-tree';

// 加载子树资产
const subtreeJson = await loadFile('patrol-behavior.btree.json');
const subtreeAsset = BehaviorTreeAssetSerializer.deserialize(subtreeJson);

// 在主树中使用
const mainTree = BehaviorTreeBuilder.create(scene, 'MainAI')
    .selector('Root')
        .subTreeFromAsset(subtreeAsset, scene, {
            namePrefix: 'Patrol',
            inheritParentBlackboard: true
        })
    .end()
    .build();
```

### 子树黑板继承

当启用 `inheritParentBlackboard` 时，子树可以访问父树的黑板变量：

```typescript
// 父树定义的变量
const parent = BehaviorTreeBuilder.create(scene, 'Parent')
    .blackboard()
        .defineVariable('playerPosition', BlackboardValueType.Vector3, { x: 0, y: 0, z: 0 })
    .endBlackboard()
    .subTree(childTree, { inheritParentBlackboard: true })
    .build();

// 子树可以访问父树的 playerPosition 变量
const child = BehaviorTreeBuilder.create(scene, 'Child')
    .action('UseParentData', (entity, blackboard) => {
        const playerPos = blackboard?.getValue('playerPosition');
        console.log('玩家位置:', playerPos);
        return TaskStatus.Success;
    })
    .build();
```


## 异步操作

### 异步动作

对于需要多帧完成的操作，返回 `TaskStatus.Running`：

```typescript
.action('LoadResource', (entity, blackboard, deltaTime) => {
    // 检查是否已开始加载
    let loadingState = blackboard?.getValue('loadingState');

    if (!loadingState) {
        // 第一次执行，开始加载
        startAsyncLoad().then(result => {
            blackboard?.setValue('loadingState', 'completed');
            blackboard?.setValue('loadedData', result);
        });
        blackboard?.setValue('loadingState', 'loading');
        return TaskStatus.Running;  // 继续等待
    }

    if (loadingState === 'loading') {
        return TaskStatus.Running;  // 仍在加载中
    }

    if (loadingState === 'completed') {
        // 加载完成
        blackboard?.setValue('loadingState', null);
        return TaskStatus.Success;
    }

    return TaskStatus.Failure;
})
```

### 超时控制

使用装饰器实现超时：

```typescript
.timeout(5.0, 'LoadTimeout')  // 5秒超时
    .action('SlowOperation', () => {
        // 长时间运行的操作
        return TaskStatus.Running;
    })
.end()
```


## 全局黑板

全局黑板在所有行为树实例之间共享数据。

### 创建全局黑板

```typescript
import { GlobalBlackboard } from '@esengine/behavior-tree';

// 设置全局变量
GlobalBlackboard.setValue('gameState', 'playing');
GlobalBlackboard.setValue('playerCount', 4);
GlobalBlackboard.setValue('difficulty', 'hard');
```

### 在行为树中访问全局黑板

```typescript
.action('CheckGameState', (entity, blackboard) => {
    const gameState = GlobalBlackboard.getValue('gameState');

    if (gameState === 'paused') {
        return TaskStatus.Failure;
    }

    return TaskStatus.Success;
})
```

### 全局黑板监听

监听全局变量变化：

```typescript
const unsubscribe = GlobalBlackboard.subscribe('difficulty', (newValue, oldValue) => {
    console.log(`难度从 ${oldValue} 变为 ${newValue}`);
    // 调整AI行为
});

// 取消监听
unsubscribe();
```


## 性能优化

### 1. 使用对象池

复用行为树实体以减少GC压力：

```typescript
class BehaviorTreePool {
    private pool: Map<string, Entity[]> = new Map();
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    acquire(asset: BehaviorTreeAsset, poolKey: string): Entity {
        let pool = this.pool.get(poolKey);

        if (!pool) {
            pool = [];
            this.pool.set(poolKey, pool);
        }

        if (pool.length > 0) {
            const entity = pool.pop()!;
            BehaviorTreeStarter.restart(entity);
            return entity;
        }

        return BehaviorTreeAssetLoader.instantiate(asset, this.scene);
    }

    release(entity: Entity, poolKey: string) {
        BehaviorTreeStarter.stop(entity);

        const pool = this.pool.get(poolKey) || [];
        pool.push(entity);
        this.pool.set(poolKey, pool);
    }

    clear() {
        for (const [key, pool] of this.pool) {
            for (const entity of pool) {
                entity.destroy();
            }
        }
        this.pool.clear();
    }
}

// 使用示例
const pool = new BehaviorTreePool(scene);

// 获取AI实例
const enemyAI = pool.acquire(enemyAsset, 'enemy');

// 释放回池
pool.release(enemyAI, 'enemy');
```

### 2. 降低更新频率

对于不需要每帧更新的AI，可以在行为树内部使用节流逻辑：

```typescript
// 方法1: 在行为树根节点使用Cooldown装饰器
const ai = BehaviorTreeBuilder.create(scene, 'ThrottledAI')
    .cooldown(0.1)  // 每0.1秒执行一次
        .selector()
            // AI逻辑
        .end()
    .end()
    .build();

// 方法2: 在Action中实现自定义节流
.action('ThrottledAction', (entity, blackboard, deltaTime) => {
    const lastUpdate = blackboard?.getValue('lastUpdateTime') || 0;
    const currentTime = Date.now();
    const updateInterval = 100;  // 100ms

    if (currentTime - lastUpdate < updateInterval) {
        return TaskStatus.Running;
    }

    blackboard?.setValue('lastUpdateTime', currentTime);

    // 执行实际逻辑
    performAILogic();
    return TaskStatus.Success;
})
```

### 3. 条件缓存

缓存昂贵的条件检查结果：

```typescript
.action('CacheExpensiveCheck', (entity, blackboard) => {
    const cacheKey = 'expensiveCheckResult';
    const cacheTime = blackboard?.getValue('expensiveCheckTime') || 0;
    const currentTime = Date.now();

    // 如果缓存未过期（1秒内），直接使用缓存结果
    if (currentTime - cacheTime < 1000) {
        const cachedResult = blackboard?.getValue(cacheKey);
        return cachedResult ? TaskStatus.Success : TaskStatus.Failure;
    }

    // 执行昂贵的检查
    const result = performExpensiveCheck();

    // 缓存结果
    blackboard?.setValue(cacheKey, result);
    blackboard?.setValue('expensiveCheckTime', currentTime);

    return result ? TaskStatus.Success : TaskStatus.Failure;
})
```

### 4. 分帧执行

将大量计算分散到多帧：

```typescript
.action('ProcessLargeDataset', (entity, blackboard, deltaTime) => {
    const data = blackboard?.getValue('dataset') || [];
    let processedIndex = blackboard?.getValue('processedIndex') || 0;

    const batchSize = 100;  // 每帧处理100个
    const endIndex = Math.min(processedIndex + batchSize, data.length);

    for (let i = processedIndex; i < endIndex; i++) {
        // 处理单个数据项
        processItem(data[i]);
    }

    blackboard?.setValue('processedIndex', endIndex);

    if (endIndex >= data.length) {
        // 全部处理完成
        blackboard?.setValue('processedIndex', 0);
        return TaskStatus.Success;
    }

    return TaskStatus.Running;  // 继续下一帧
})
```


## 序列化和反序列化

### JSON格式

标准的可读格式：

```typescript
import { BehaviorTreeAssetSerializer } from '@esengine/behavior-tree';

// 序列化为JSON
const asset = createBehaviorTreeAsset();
const json = BehaviorTreeAssetSerializer.serialize(asset);

// 保存到文件
await saveFile('ai-behavior.btree.json', json);

// 从JSON加载
const loadedJson = await loadFile('ai-behavior.btree.json');
const loadedAsset = BehaviorTreeAssetSerializer.deserialize(loadedJson);
```

### 二进制格式

体积更小的二进制格式（通常比JSON小60-70%）：

```typescript
// 序列化为二进制
const binary = BehaviorTreeAssetSerializer.serializeToBinary(asset);

// 保存二进制文件
await saveFile('ai-behavior.btree.bin', binary);

// 从二进制加载
const loadedBinary = await loadFile('ai-behavior.btree.bin');
const loadedAsset = BehaviorTreeAssetSerializer.deserializeFromBinary(loadedBinary);
```

### 格式转换

在JSON和二进制之间转换：

```typescript
// JSON转二进制
const jsonData = await loadFile('tree.btree.json');
const asset = BehaviorTreeAssetSerializer.deserialize(jsonData);
const binary = BehaviorTreeAssetSerializer.serializeToBinary(asset);
await saveFile('tree.btree.bin', binary);

// 二进制转JSON
const binaryData = await loadFile('tree.btree.bin');
const asset2 = BehaviorTreeAssetSerializer.deserializeFromBinary(binaryData);
const json = BehaviorTreeAssetSerializer.serialize(asset2);
await saveFile('tree.btree.json', json);
```


## 调试技巧

### 1. 日志节点

在关键位置添加日志：

```typescript
.log('开始战斗序列', 'info')
.sequence('Combat')
    .log('检查生命值', 'debug')
    .compareBlackboardValue('health', CompareOperator.Greater, 0)
    .log('执行攻击', 'info')
    .action('Attack', () => TaskStatus.Success)
.end()
```

### 2. 黑板快照

定期输出黑板状态：

```typescript
.action('DebugBlackboard', (entity, blackboard) => {
    console.log('=== 黑板快照 ===');
    const vars = blackboard?.getAllVariables();
    for (const [key, value] of Object.entries(vars || {})) {
        console.log(`${key}:`, value);
    }
    return TaskStatus.Success;
})
```

### 3. 条件断言

验证重要条件：

```typescript
.action('AssertPlayerExists', (entity, blackboard) => {
    const player = blackboard?.getValue('player');

    if (!player) {
        console.error('断言失败: 玩家不存在');
        return TaskStatus.Failure;
    }

    return TaskStatus.Success;
})
```

### 4. 性能分析

测量节点执行时间：

```typescript
.action('ProfiledAction', (entity, blackboard) => {
    const startTime = performance.now();

    // 执行操作
    doSomething();

    const elapsed = performance.now() - startTime;
    console.log(`操作耗时: ${elapsed.toFixed(2)}ms`);

    return TaskStatus.Success;
})
```

### 5. 可视化调试

在编辑器中运行行为树并观察节点状态：

```typescript
import { BehaviorTreeDebugger } from '@esengine/behavior-tree';

// 启用调试模式
BehaviorTreeDebugger.enable(aiEntity);

// 获取当前执行路径
const executionPath = BehaviorTreeDebugger.getExecutionPath(aiEntity);
console.log('执行路径:', executionPath);

// 获取节点状态
const nodeStatus = BehaviorTreeDebugger.getNodeStatus(aiEntity, nodeId);
console.log('节点状态:', nodeStatus);
```


## 常见模式

### 1. 状态机模式

使用行为树实现状态机：

```typescript
const fsm = BehaviorTreeBuilder.create(scene, 'StateMachine')
    .blackboard()
        .defineVariable('currentState', BlackboardValueType.String, 'idle')
    .endBlackboard()
    .selector('StateSwitch')
        // Idle状态
        .sequence('IdleState')
            .checkBlackboardValue('currentState', 'idle')
            .action('IdleBehavior', (e, bb) => {
                console.log('执行Idle行为');
                // 状态转换条件
                if (shouldTransitionToMove()) {
                    bb?.setValue('currentState', 'move');
                }
                return TaskStatus.Success;
            })
        .end()
        // Move状态
        .sequence('MoveState')
            .checkBlackboardValue('currentState', 'move')
            .action('MoveBehavior', (e, bb) => {
                console.log('执行Move行为');
                if (shouldTransitionToAttack()) {
                    bb?.setValue('currentState', 'attack');
                }
                return TaskStatus.Success;
            })
        .end()
        // Attack状态
        .sequence('AttackState')
            .checkBlackboardValue('currentState', 'attack')
            .action('AttackBehavior', (e, bb) => {
                console.log('执行Attack行为');
                if (shouldTransitionToIdle()) {
                    bb?.setValue('currentState', 'idle');
                }
                return TaskStatus.Success;
            })
        .end()
    .end()
    .build();
```

### 2. 优先级队列模式

按优先级执行任务：

```typescript
.selector('PriorityQueue')
    // 最高优先级：生存
    .sequence('Survive')
        .compareBlackboardValue('health', CompareOperator.Less, 20)
        .action('Heal', () => TaskStatus.Success)
    .end()
    // 中优先级：战斗
    .sequence('Combat')
        .checkBlackboardExists('nearbyEnemy', true)
        .action('Fight', () => TaskStatus.Success)
    .end()
    // 低优先级：收集资源
    .sequence('Gather')
        .action('CollectResources', () => TaskStatus.Success)
    .end()
.end()
```

### 3. 并行任务模式

同时执行多个任务：

```typescript
.parallel(ParallelPolicy.RequireAll)  // 所有任务都要成功
    .action('PlayAnimation', () => TaskStatus.Success)
    .action('PlaySound', () => TaskStatus.Success)
    .action('SpawnParticles', () => TaskStatus.Success)
.end()
```


## 下一步

- 查看[自定义节点](./custom-nodes.md)学习如何创建自定义行为节点
- 阅读[最佳实践](./best-practices.md)了解行为树设计技巧
- 查看[节点参考](./node-reference.md)了解所有内置节点
