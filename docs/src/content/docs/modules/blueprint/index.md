---
title: "蓝图可视化脚本 (Blueprint)"
description: "与 ECS 框架深度集成的可视化脚本系统"
---

`@esengine/blueprint` 提供与 ECS 框架深度集成的可视化脚本系统，支持通过节点式编程控制实体行为。

## 编辑器下载

Cocos Creator 蓝图编辑器插件（免费）：

**[下载 Cocos Node Editor v1.2.0](https://github.com/esengine/ecs-framework/releases/tag/cocos-node-editor-v1.2.0)**

> 技术交流 QQ 群：**481923584** | 官网：[esengine.cn](https://esengine.cn/)

详细使用教程请参考 [编辑器使用指南](./editor-guide)。

## 安装运行时

```bash
npm install @esengine/blueprint
```

## 核心特性

- **ECS 深度集成** - 内置 Entity、Component 操作节点
- **组件自动节点生成** - 使用装饰器标记组件，自动生成 Get/Set/Call 节点
- **运行时蓝图执行** - 高效的虚拟机执行蓝图逻辑

## 快速开始

### 1. 添加蓝图系统

```typescript
import { Scene, Core } from '@esengine/ecs-framework';
import { BlueprintSystem } from '@esengine/blueprint';

// 创建场景并添加蓝图系统
const scene = new Scene();
scene.addSystem(new BlueprintSystem());

// 设置场景
Core.setScene(scene);
```

### 2. 为实体添加蓝图

```typescript
import { BlueprintComponent } from '@esengine/blueprint';

// 创建实体
const player = scene.createEntity('Player');

// 添加蓝图组件
const blueprint = new BlueprintComponent();
blueprint.blueprintAsset = await loadBlueprintAsset('player.blueprint.json');
blueprint.autoStart = true;
player.addComponent(blueprint);
```

### 3. 标记组件（自动生成蓝图节点）

```typescript
import {
    BlueprintExpose,
    BlueprintProperty,
    BlueprintMethod
} from '@esengine/blueprint';
import { Component, ECSComponent } from '@esengine/ecs-framework';

@ECSComponent('Health')
@BlueprintExpose({ displayName: '生命值', category: 'gameplay' })
export class HealthComponent extends Component {
    @BlueprintProperty({ displayName: '当前生命值', type: 'float' })
    current: number = 100;

    @BlueprintProperty({ displayName: '最大生命值', type: 'float' })
    max: number = 100;

    @BlueprintMethod({
        displayName: '治疗',
        params: [{ name: 'amount', type: 'float' }]
    })
    heal(amount: number): void {
        this.current = Math.min(this.current + amount, this.max);
    }

    @BlueprintMethod({ displayName: '受伤' })
    takeDamage(amount: number): boolean {
        this.current -= amount;
        return this.current <= 0;
    }
}
```

标记后，蓝图编辑器中会自动出现以下节点：
- **Get Health** - 获取 Health 组件
- **Get 当前生命值** - 获取 current 属性
- **Set 当前生命值** - 设置 current 属性
- **治疗** - 调用 heal 方法
- **受伤** - 调用 takeDamage 方法

## ECS 集成架构

```
┌─────────────────────────────────────────────────────────────┐
│                         Core.update()                        │
│                              ↓                               │
│                    Scene.updateSystems()                     │
│                              ↓                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  BlueprintSystem                       │  │
│  │                                                        │  │
│  │  Matcher.all(BlueprintComponent)                       │  │
│  │                       ↓                                │  │
│  │  process(entities) → blueprint.tick() for each entity  │  │
│  │                       ↓                                │  │
│  │              BlueprintVM.tick(dt)                      │  │
│  │                       ↓                                │  │
│  │         Execute Event/ECS/Flow Nodes                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 节点类型

| 类别 | 说明 | 颜色 |
|------|------|------|
| `event` | 事件节点（BeginPlay, Tick, EndPlay） | 红色 |
| `entity` | ECS 实体操作 | 蓝色 |
| `component` | ECS 组件访问 | 青色 |
| `flow` | 流程控制（Branch, Sequence, Loop） | 灰色 |
| `math` | 数学运算 | 绿色 |
| `time` | 时间工具（Delay, GetDeltaTime） | 青色 |
| `debug` | 调试工具（Print） | 灰色 |

## 蓝图资产结构

蓝图保存为 `.blueprint.json` 文件：

```typescript
interface BlueprintAsset {
    version: number;
    type: 'blueprint';
    metadata: {
        name: string;
        description?: string;
    };
    variables: BlueprintVariable[];
    nodes: BlueprintNode[];
    connections: BlueprintConnection[];
}
```

## 文档导航

- [编辑器使用指南](./editor-guide) - Cocos Creator 蓝图编辑器教程
- [虚拟机 API](./vm) - BlueprintVM 与 ECS 集成
- [ECS 节点参考](./nodes) - 内置 ECS 操作节点
- [自定义节点](./custom-nodes) - 创建自定义 ECS 节点
- [蓝图组合](./composition) - 片段复用
- [实际示例](./examples) - ECS 游戏逻辑示例
