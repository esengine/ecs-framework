# 行为树系统

行为树(Behavior Tree)是一种用于游戏AI和自动化控制的强大工具。本框架提供了基于Runtime执行器架构的行为树系统,具有高性能、类型安全、易于扩展的特点。

## 什么是行为树?

行为树是一种层次化的任务执行结构,由多个节点组成,每个节点负责特定的任务。行为树特别适合于:

- 游戏AI(敌人、NPC行为)
- 状态机的替代方案
- 复杂的决策逻辑
- 可视化的行为设计

## 核心特性

### Runtime执行器架构
- 数据与逻辑分离
- 无状态执行器设计
- 高性能执行
- 类型安全

### 可视化编辑器
- 图形化节点编辑
- 实时预览和调试
- 拖拽式节点创建
- 属性连接和绑定

### 灵活的黑板系统
- 本地黑板(单个行为树)
- 全局黑板(所有行为树共享)
- 类型安全的变量访问
- 支持属性绑定

### 插件系统
- 自动注册机制
- 装饰器声明元数据
- 支持多语言
- 易于扩展

## 文档导航

### 入门教程

- **[快速开始](./getting-started.md)** - 5分钟上手行为树
- **[核心概念](./core-concepts.md)** - 理解行为树的基本原理

### 编辑器使用

- **[编辑器使用指南](./editor-guide.md)** - 可视化创建行为树
- **[编辑器工作流](./editor-workflow.md)** - 完整的开发流程

### 资源管理

- **[资产管理](./asset-management.md)** - 加载、管理和复用行为树资产、使用子树

### 引擎集成

- **[Cocos Creator 集成](./cocos-integration.md)** - 在 Cocos Creator 中使用行为树
- **[Laya 引擎集成](./laya-integration.md)** - 在 Laya 中使用行为树
- **[Node.js 服务端使用](./nodejs-usage.md)** - 在服务器、聊天机器人等场景中使用行为树

### 高级主题

- **[高级用法](./advanced-usage.md)** - 性能优化、调试技巧
- **[自定义节点执行器](./custom-actions.md)** - 创建自定义行为节点
- **[最佳实践](./best-practices.md)** - 行为树设计模式和技巧

## 快速示例

### 使用Builder创建

```typescript
import { Core, Scene } from '@esengine/ecs-framework';
import {
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreePlugin
} from '@esengine/behavior-tree';

// 初始化
Core.create();
const plugin = new BehaviorTreePlugin();
await Core.installPlugin(plugin);

const scene = new Scene();
plugin.setupScene(scene);
Core.setScene(scene);

// 创建行为树
const enemyAI = BehaviorTreeBuilder.create('EnemyAI')
    .defineBlackboardVariable('health', 100)
    .defineBlackboardVariable('target', null)
    .selector('MainBehavior')
        // 如果生命值高,则攻击
        .sequence('AttackBranch')
            .blackboardCompare('health', 50, 'greater')
            .log('攻击玩家', 'Attack')
        .end()
        // 否则逃跑
        .log('逃离战斗', 'Flee')
    .end()
    .build();

// 启动AI
const entity = scene.createEntity('Enemy');
BehaviorTreeStarter.start(entity, enemyAI);
```

### 使用编辑器创建

1. 打开行为树编辑器
2. 创建新的行为树资产
3. 拖拽节点到画布
4. 配置节点属性和连接
5. 保存并在代码中使用

## 架构说明

### Runtime执行器架构

本框架采用Runtime执行器架构,将节点定义和执行逻辑分离:

**核心组件:**
- `BehaviorTreeData`: 纯数据结构,描述行为树
- `BehaviorTreeRuntimeComponent`: 运行时组件,管理状态和黑板
- `BehaviorTreeExecutionSystem`: 执行系统,驱动行为树运行
- `INodeExecutor`: 节点执行器接口
- `NodeExecutionContext`: 执行上下文

**优势:**
- 数据与逻辑分离,易于序列化
- 执行器无状态,可复用
- 类型安全,编译时检查
- 高性能执行

### 自定义执行器

创建自定义节点非常简单:

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
    displayName: '攻击',
    description: '攻击目标',
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

        console.log(`造成 ${damage} 点伤害`);
        return TaskStatus.Success;
    }
}
```

详细说明请参见[自定义节点执行器](./custom-actions.md)。

## 下一步

建议按照以下顺序学习:

1. 阅读[快速开始](./getting-started.md)了解基础用法
2. 学习[核心概念](./core-concepts.md)理解行为树原理
3. 学习[资产管理](./asset-management.md)了解如何加载和复用行为树、使用子树
4. 根据你的场景查看集成教程:
   - 客户端游戏：[Cocos Creator](./cocos-integration.md) 或 [Laya](./laya-integration.md)
   - 服务端应用：[Node.js 服务端使用](./nodejs-usage.md)
5. 尝试[编辑器使用指南](./editor-guide.md)可视化创建行为树
6. 探索[高级用法](./advanced-usage.md)和[自定义节点执行器](./custom-actions.md)提升技能

## 获取帮助

- 提交 [Issue](https://github.com/esengine/esengine/issues)
- 加入社区讨论
- 参考文档中的完整代码示例
