# 行为树系统

行为树（Behavior Tree）是一种用于游戏AI和自动化控制的强大工具。本框架提供了完全ECS化的行为树系统，所有节点都是实体和组件，充分利用了ECS的性能优势。

## 什么是行为树？

行为树是一种层次化的任务执行结构，由多个节点组成，每个节点负责特定的任务。行为树特别适合于：

- 游戏AI（敌人、NPC行为）
- 状态机的替代方案
- 复杂的决策逻辑
- 可视化的行为设计

## 核心特性

### 完全ECS化
- 所有节点都是实体（Entity）
- 节点属性存储在组件（Component）中
- 利用ECS的缓存友好特性
- 支持大规模AI实例

### 可视化编辑器
- 图形化节点编辑
- 实时预览和调试
- 拖拽式节点创建
- 支持子树复用

### 灵活的黑板系统
- 本地黑板（单个行为树）
- 全局黑板（所有行为树共享）
- 类型安全的变量访问
- 支持多种数据类型

### 强大的序列化
- JSON格式（可读性好）
- 二进制格式（体积小60-70%）
- 跨平台兼容
- 支持格式转换

### 引擎集成
- Cocos Creator 支持
- Laya 引擎支持
- 纯TypeScript实现
- 易于扩展到其他引擎

## 文档导航

### 入门教程

- **[快速开始](./getting-started.md)** - 5分钟上手行为树
- **[核心概念](./core-concepts.md)** - 理解行为树的基本原理

### 编辑器使用

- **[编辑器使用指南](./editor-guide.md)** - 可视化创建行为树
- **[编辑器工作流](./editor-workflow.md)** - 完整的开发流程

### 引擎集成

- **[Cocos Creator 集成](./cocos-integration.md)** - 在 Cocos Creator 中使用行为树
- **[Laya 引擎集成](./laya-integration.md)** - 在 Laya 中使用行为树

### 高级主题

- **[高级用法](./advanced-usage.md)** - 子树、异步加载、性能优化
- **[自定义动作](./custom-actions.md)** - 创建自定义行为节点
- **[最佳实践](./best-practices.md)** - 行为树设计模式和技巧

## 快速示例

### 代码方式创建

```typescript
import { Scene } from '@esengine/ecs-framework';
import {
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BlackboardValueType,
    TaskStatus
} from '@esengine/behavior-tree';

const scene = new Scene();

// 创建敌人AI
const enemyAI = BehaviorTreeBuilder.create(scene, 'EnemyAI')
    .blackboard()
        .defineVariable('health', BlackboardValueType.Number, 100)
        .defineVariable('target', BlackboardValueType.Object, null)
    .endBlackboard()
    .selector('MainBehavior')
        // 如果生命值高，则攻击
        .sequence('AttackBranch')
            .compareBlackboardValue('health', CompareOperator.Greater, 50)
            .action('Attack', () => {
                console.log('Attacking player');
                return TaskStatus.Success;
            })
        .end()
        // 否则逃跑
        .action('Flee', () => {
            console.log('Fleeing from battle');
            return TaskStatus.Success;
        })
    .end()
    .build();

// 启动AI
BehaviorTreeStarter.start(enemyAI);
```

### 编辑器方式创建

1. 打开行为树编辑器
2. 创建新的行为树资产
3. 拖拽节点到画布
4. 配置节点属性
5. 保存并导出
6. 在代码中加载使用

```typescript
// 加载编辑器创建的行为树
const asset = await loadBehaviorTree('enemy-ai.btree.json');
const ai = BehaviorTreeAssetLoader.instantiate(asset, scene);
BehaviorTreeStarter.start(ai);
```

## 下一步

建议按照以下顺序学习：

1. 阅读[快速开始](./getting-started.md)了解基础用法
2. 学习[核心概念](./core-concepts.md)理解行为树原理
3. 尝试[编辑器使用指南](./editor-guide.md)可视化创建行为树
4. 根据你的引擎查看集成教程（[Cocos](./cocos-integration.md) 或 [Laya](./laya-integration.md)）
5. 探索[高级用法](./advanced-usage.md)提升技能

## 获取帮助

- 查看 [示例项目](https://github.com/esengine/ecs-framework/tree/master/examples)
- 提交 [Issue](https://github.com/esengine/ecs-framework/issues)
- 加入社区讨论
