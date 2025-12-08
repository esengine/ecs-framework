# 编辑器工作流

本教程介绍如何使用行为树编辑器创建AI，并在游戏中加载使用。

## 完整流程

```
1. 启动编辑器
2. 创建行为树并定义黑板变量
3. 添加和配置节点
4. 导出JSON文件
5. 在游戏中加载并使用
```

## 使用编辑器创建

### 启动编辑器

```bash
cd packages/editor-app
npm run tauri:dev
```

### 基本操作

1. **创建行为树**：`文件` → `新建项目` → 创建行为树文件
2. **定义黑板变量**：在黑板面板中添加共享变量
3. **添加节点**：从节点面板拖拽到画布
4. **连接节点**：拖拽连接点建立父子关系
5. **配置属性**：选中节点后在属性面板编辑
6. **导出**：`文件` → `导出` → `JSON格式`

### 示例：敌人AI的黑板变量

在编辑器黑板面板中定义：

```
health: Number = 100
target: Object = null
moveSpeed: Number = 5.0
attackRange: Number = 2.0
```

### 示例：行为树结构

```
Root: Selector
├── Combat Sequence
│   ├── CheckHasTarget (Condition)
│   ├── CheckInAttackRange (Condition)
│   └── ExecuteAttack (Action)
├── Patrol Sequence
│   ├── MoveToNextPatrolPoint (Action)
│   └── Wait 2s
└── Idle (Action)
```

## 在游戏中使用

### 使用Builder API创建

推荐使用Builder API在代码中创建行为树：

```typescript
import { Core, Scene } from '@esengine/ecs-framework';
import {
    BehaviorTreePlugin,
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreeRuntimeComponent
} from '@esengine/behavior-tree';

// 初始化
Core.create();
const plugin = new BehaviorTreePlugin();
await Core.installPlugin(plugin);

const scene = new Scene();
plugin.setupScene(scene);
Core.setScene(scene);

// 使用Builder创建行为树
const tree = BehaviorTreeBuilder.create('EnemyAI')
    .defineBlackboardVariable('health', 100)
    .defineBlackboardVariable('target', null)
    .defineBlackboardVariable('moveSpeed', 5.0)
    .selector('MainBehavior')
        .sequence('AttackBranch')
            .blackboardExists('target')
            .blackboardCompare('health', 30, 'greater')
            .log('攻击目标', 'Attack')
        .end()
        .log('巡逻', 'Patrol')
    .end()
    .build();

// 创建实体并启动行为树
const entity = scene.createEntity('Enemy');
BehaviorTreeStarter.start(entity, tree);

// 访问和修改黑板
const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
runtime?.setBlackboardValue('target', someTarget);

// 游戏循环
setInterval(() => {
    Core.update(0.016); // 60 FPS
}, 16);
```

## 实现自定义执行器

要扩展行为树的功能，需要创建自定义执行器（详见[自定义节点执行器](./custom-actions.md)）：

```typescript
import {
    INodeExecutor,
    NodeExecutionContext,
    BindingHelper,
    NodeExecutorMetadata
} from '@esengine/behavior-tree';
import { TaskStatus, NodeType } from '@esengine/behavior-tree';

@NodeExecutorMetadata({
    implementationType: 'AttackAction',
    nodeType: NodeType.Action,
    displayName: '攻击目标',
    description: '对目标造成伤害',
    category: '战斗',
    configSchema: {
        damage: {
            type: 'number',
            default: 10,
            supportBinding: true
        }
    }
})
export class AttackAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const damage = BindingHelper.getValue<number>(context, 'damage', 10);
        const target = context.runtime.getBlackboardValue('target');

        if (!target) {
            return TaskStatus.Failure;
        }

        // 执行攻击逻辑
        performAttack(context.entity, target, damage);
        return TaskStatus.Success;
    }

    reset(context: NodeExecutionContext): void {
        // 清理状态
    }
}
```

## 调试技巧

### 1. 使用日志节点

在行为树中添加Log节点输出调试信息：

```typescript
const tree = BehaviorTreeBuilder.create('DebugAI')
    .log('开始战斗序列', 'StartCombat')
    .sequence('Combat')
        .blackboardCompare('health', 0, 'greater')
        .log('执行攻击', 'Attack')
    .end()
    .build();
```

### 2. 监控黑板状态

```typescript
const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
console.log('黑板变量:', runtime?.getAllBlackboardVariables());
console.log('活动节点:', Array.from(runtime?.activeNodeIds || []));
```

### 3. 在自定义执行器中调试

```typescript
export class DebugAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, runtime, state } = context;

        console.group(`[${nodeData.name}]`);
        console.log('配置:', nodeData.config);
        console.log('状态:', state);
        console.log('黑板:', runtime.getAllBlackboardVariables());
        console.groupEnd();

        return TaskStatus.Success;
    }
}
```

## 完整示例

```typescript
import { Core, Scene } from '@esengine/ecs-framework';
import {
    BehaviorTreePlugin,
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreeRuntimeComponent
} from '@esengine/behavior-tree';

// 初始化
Core.create();
const plugin = new BehaviorTreePlugin();
await Core.installPlugin(plugin);

const scene = new Scene();
plugin.setupScene(scene);
Core.setScene(scene);

// 使用Builder API构建行为树
const tree = BehaviorTreeBuilder.create('EnemyAI')
    .defineBlackboardVariable('health', 100)
    .defineBlackboardVariable('hasTarget', false)
    .selector('Root')
        .sequence('Combat')
            .blackboardCompare('hasTarget', true, 'equals')
            .log('攻击玩家', 'Attack')
        .end()
        .log('空闲', 'Idle')
    .end()
    .build();

// 创建实体并启动
const entity = scene.createEntity('Enemy');
BehaviorTreeStarter.start(entity, tree);

// 模拟发现目标
setTimeout(() => {
    const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
    runtime?.setBlackboardValue('hasTarget', true);
}, 2000);

// 游戏循环
setInterval(() => {
    Core.update(0.016);
}, 16);
```

## 下一步

- 查看[自定义节点执行器](./custom-actions.md)学习如何创建自定义节点
- 查看[高级用法](./advanced-usage.md)了解性能优化等高级特性
- 查看[最佳实践](./best-practices.md)优化你的AI设计
