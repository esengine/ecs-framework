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

## 在游戏中加载

### 加载JSON资产

```typescript
import { Core, Scene } from '@esengine/ecs-framework';
import {
    BehaviorTreePlugin,
    BehaviorTreeAssetSerializer,
    BehaviorTreeAssetLoader,
    BehaviorTreeStarter
} from '@esengine/behavior-tree';

// 初始化
Core.create();
const plugin = new BehaviorTreePlugin();
await Core.installPlugin(plugin);

const scene = new Scene();
plugin.setupScene(scene);
Core.setScene(scene);

// 加载行为树
const jsonString = await loadJsonFromFile('enemy-ai.btree.json');
const asset = BehaviorTreeAssetSerializer.deserialize(jsonString);
const aiEntity = BehaviorTreeAssetLoader.instantiate(asset, scene);

// 设置黑板初始值
const blackboard = aiEntity.getComponent(BlackboardComponent);
blackboard?.setValue('health', 100);
blackboard?.setValue('moveSpeed', 5.0);

// 启动AI
BehaviorTreeStarter.start(aiEntity);

// 游戏循环
setInterval(() => {
    Core.update(0.016); // 60 FPS
}, 16);
```

## 实现自定义动作

编辑器中的ExecuteAction节点需要在代码中提供实际逻辑。有两种方式：

### 方式1：通过事件系统（推荐）

在Action节点中触发事件，在游戏代码中监听：

```typescript
// 在编辑器的ExecuteAction节点中
entity.scene?.eventSystem.emit('ai:attack', {
    attacker: entity,
    target: blackboard?.getValue('target')
});
return TaskStatus.Success;
```

```typescript
// 在游戏代码中监听
Core.scene.eventSystem.on('ai:attack', (data) => {
    const { attacker, target } = data;
    // 执行实际的攻击逻辑
    performAttack(attacker, target);
});
```

### 方式2：创建自定义组件

创建专用的Action组件（详见[自定义动作](./custom-actions.md)）：

```typescript
import { Component, ECSComponent, Entity } from '@esengine/ecs-framework';
import { BehaviorNode, BehaviorProperty, NodeType, TaskStatus } from '@esengine/behavior-tree';

@BehaviorNode({
    displayName: '攻击目标',
    category: '战斗',
    type: NodeType.Action,
    description: '对目标造成伤害'
})
@ECSComponent('AttackAction')
export class AttackAction extends Component {
    @BehaviorProperty({
        label: '伤害值',
        type: 'number'
    })
    damage: number = 10;

    execute(entity: Entity, blackboard?: BlackboardComponent): TaskStatus {
        const target = blackboard?.getValue('target');
        if (!target) return TaskStatus.Failure;

        // 执行攻击逻辑
        performAttack(entity, target, this.damage);
        return TaskStatus.Success;
    }
}
```

## 调试技巧

### 1. 使用日志

在编辑器中添加Log节点输出调试信息：

```typescript
.log('进入战斗分支', 'info')
.action('Attack', (entity, blackboard) => {
    console.log('目标:', blackboard?.getValue('target'));
    return TaskStatus.Success;
})
```

### 2. 监控黑板

```typescript
const blackboard = aiEntity.getComponent(BlackboardComponent);
console.log('黑板状态:', blackboard?.getAllVariables());
```

### 3. 检查节点状态

```typescript
const node = aiEntity.getComponent(BehaviorTreeNode);
console.log('节点状态:', node?.status);
```

## 完整示例

```typescript
import { Core, Scene, Entity } from '@esengine/ecs-framework';
import {
    BehaviorTreePlugin,
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BlackboardValueType,
    TaskStatus
} from '@esengine/behavior-tree';

// 初始化
Core.create();
const plugin = new BehaviorTreePlugin();
await Core.installPlugin(plugin);

const scene = new Scene();
plugin.setupScene(scene);
Core.setScene(scene);

// 直接用代码构建（不用编辑器）
const aiEntity = BehaviorTreeBuilder.create(scene, 'EnemyAI')
    .blackboard()
        .defineVariable('health', BlackboardValueType.Number, 100)
        .defineVariable('hasTarget', BlackboardValueType.Boolean, false)
    .endBlackboard()
    .selector('Root')
        .sequence('Combat')
            .condition((e, bb) => bb?.getValue('hasTarget') === true, 'CheckTarget')
            .action('Attack', (e, bb) => {
                console.log('攻击！');
                return TaskStatus.Success;
            })
        .end()
        .action('Idle', () => {
            console.log('空闲');
            return TaskStatus.Success;
        })
    .end()
    .build();

BehaviorTreeStarter.start(aiEntity);

// 游戏循环
setInterval(() => {
    Core.update(0.016);
}, 16);
```

## 下一步

- 查看[自定义动作](./custom-actions.md)学习如何创建专用的Action组件
- 查看[高级用法](./advanced-usage.md)了解子树、异步操作等高级特性
- 查看[最佳实践](./best-practices.md)优化你的AI设计
