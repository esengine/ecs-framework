# ECS Framework

[![npm version](https://badge.fury.io/js/%40esengine%2Fecs-framework.svg)](https://badge.fury.io/js/%40esengine%2Fecs-framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript ECS (Entity-Component-System) 框架，专为游戏开发设计。

> 🤔 **什么是 ECS？** 不熟悉 ECS 架构？建议先阅读 [ECS 架构基础](docs/concepts-explained.md#ecs-架构基础) 了解核心概念

## 特性

- 🔧 **完整的 TypeScript 支持** - 强类型检查和代码提示
- 📡 **[类型安全事件系统](docs/concepts-explained.md#事件系统)** - 事件装饰器和异步事件处理
- 🔍 **[查询系统](docs/concepts-explained.md#实体管理)** - 流式 API 和智能缓存
- ⚡ **[性能优化](docs/concepts-explained.md#性能优化技术)** - 组件索引、Archetype 系统、脏标记
- 🎯 **[实体管理器](docs/concepts-explained.md#实体管理)** - 统一的实体生命周期管理
- 🧰 **调试工具** - 内置性能监控和调试信息

> 📖 **不熟悉这些概念？** 查看我们的 [技术概念详解](docs/concepts-explained.md) 了解它们的作用和应用场景

## 安装

```bash
npm install @esengine/ecs-framework
```

## 快速开始

### 基础设置

```typescript
import { Core, Scene, Entity, Component, EntitySystem } from '@esengine/ecs-framework';

// 创建核心实例
const core = Core.create(true); // 调试模式

// 创建场景
const scene = new Scene();
Core.scene = scene;
```

### 定义组件

```typescript
class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class VelocityComponent extends Component {
    constructor(public dx: number = 0, public dy: number = 0) {
        super();
    }
}

class HealthComponent extends Component {
    constructor(
        public maxHealth: number = 100,
        public currentHealth: number = 100
    ) {
        super();
    }
}
```

### 创建实体

```typescript
// 基础实体创建
const player = scene.createEntity("Player");
player.addComponent(new PositionComponent(100, 100));
player.addComponent(new VelocityComponent(5, 0));
player.addComponent(new HealthComponent(100, 100));

// 批量创建实体
const enemies = scene.createEntities(50, "Enemy");
```

### 创建系统

```typescript
class MovementSystem extends EntitySystem {
    constructor() {
        super();
    }

    public process(entities: Entity[]) {
        for (const entity of entities) {
            const position = entity.getComponent(PositionComponent);
            const velocity = entity.getComponent(VelocityComponent);
            
            if (position && velocity) {
                position.x += velocity.dx;
                position.y += velocity.dy;
            }
        }
    }
}

// 添加系统到场景
scene.addEntityProcessor(new MovementSystem());
```

### 游戏循环

ECS框架需要在游戏引擎的更新循环中调用：

```typescript
// 统一的API：传入deltaTime
Core.update(deltaTime);
```

**不同平台的集成示例：**

```typescript
// Laya引擎
Laya.timer.frameLoop(1, this, () => {
    const deltaTime = Laya.timer.delta / 1000; // 转换为秒
    Core.update(deltaTime);
});

// Cocos Creator
update(deltaTime: number) {
    Core.update(deltaTime);
}

// 原生浏览器环境
let lastTime = 0;
function gameLoop(currentTime: number) {
    const deltaTime = lastTime > 0 ? (currentTime - lastTime) / 1000 : 0.016;
    lastTime = currentTime;
    Core.update(deltaTime);
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

## 实体管理器

EntityManager 提供了统一的实体管理接口：

```typescript
import { EntityManager } from '@esengine/ecs-framework';

const entityManager = new EntityManager();

// 流式查询 API
const results = entityManager
    .query()
    .withAll(PositionComponent, VelocityComponent)
    .withNone(HealthComponent)
    .withTag(1)
    .execute();

// 批量操作（使用Scene的方法）
const bullets = scene.createEntities(100, "bullet");

// 按标签查询
const enemies = entityManager.getEntitiesByTag(2);
```

## 事件系统

### [基础事件](docs/concepts-explained.md#类型安全事件)

类型安全的事件系统，编译时检查事件名和数据类型。

```typescript
import { EventBus, ECSEventType } from '@esengine/ecs-framework';

const eventBus = entityManager.eventBus;

// 监听预定义事件
eventBus.onEntityCreated((data) => {
    console.log(`实体创建: ${data.entityName}`);
});

eventBus.onComponentAdded((data) => {
    console.log(`组件添加: ${data.componentType}`);
});

// 自定义事件
eventBus.emit('player:death', { playerId: 123, reason: 'fall' });
```

### [事件装饰器](docs/concepts-explained.md#事件装饰器)

使用装饰器语法自动注册事件监听器，减少样板代码。

```typescript
import { EventHandler, ECSEventType } from '@esengine/ecs-framework';

class GameSystem {
    @EventHandler(ECSEventType.ENTITY_DESTROYED)
    onEntityDestroyed(data: EntityDestroyedEventData) {
        console.log('实体销毁:', data.entityName);
    }

    @EventHandler('player:levelup')
    onPlayerLevelUp(data: { playerId: number; newLevel: number }) {
        console.log(`玩家 ${data.playerId} 升级到 ${data.newLevel} 级`);
    }
}
```

## 性能优化

### [组件索引](docs/concepts-explained.md#组件索引系统)

通过建立索引避免线性搜索，将查询复杂度从 O(n) 降低到 O(1)。

```typescript
// 使用Scene的查询系统进行组件索引
const querySystem = scene.querySystem;

// 查询具有特定组件的实体
const entitiesWithPosition = querySystem.queryAll(PositionComponent).entities;
const entitiesWithVelocity = querySystem.queryAll(VelocityComponent).entities;

// 性能统计
const stats = querySystem.getStats();
console.log('查询效率:', stats.hitRate);
```

**索引类型选择：**
- **哈希索引** - 适合稳定的、大量的组件（如位置、生命值）
- **位图索引** - 适合频繁变化的组件（如Buff、状态）

> 📋 详细选择指南参见 [索引类型选择指南](docs/concepts-explained.md#索引类型选择指南)

### [Archetype 系统](docs/concepts-explained.md#archetype-系统)

将具有相同组件组合的实体分组，减少查询时的组件检查开销。

```typescript
// 使用查询系统的Archetype功能
const querySystem = scene.querySystem;

// 查询统计
const stats = querySystem.getStats();
console.log('缓存命中率:', stats.hitRate);
```

### [脏标记系统](docs/concepts-explained.md#脏标记系统)

追踪数据变化，只处理发生改变的实体，避免不必要的计算。

```typescript
// 脏标记通过组件系统自动管理
// 组件变化时会自动标记为脏数据

// 查询系统会自动处理脏标记优化
const movingEntities = scene.querySystem.queryAll(PositionComponent, VelocityComponent);
```

> 💡 **不确定何时使用这些优化？** 查看 [性能优化建议](docs/concepts-explained.md#性能建议) 了解适用场景

## API 参考

### 核心类

| 类 | 描述 |
|---|---|
| `Core` | 框架核心管理类 |
| `Scene` | 场景容器，管理实体和系统 |
| `Entity` | 实体对象，包含组件集合 |
| `Component` | 组件基类 |
| `EntitySystem` | 系统基类 |
| `EntityManager` | 实体管理器 |

### 查询 API

```typescript
entityManager
    .query()
    .withAll(...components)      // 包含所有指定组件
    .withAny(...components)      // 包含任意指定组件
    .withNone(...components)     // 不包含指定组件
    .withTag(tag)                // 包含指定标签
    .withoutTag(tag)             // 不包含指定标签
    .execute()                   // 执行查询
```

### 事件类型

```typescript
enum ECSEventType {
    ENTITY_CREATED = 'entity:created',
    ENTITY_DESTROYED = 'entity:destroyed',
    COMPONENT_ADDED = 'component:added',
    COMPONENT_REMOVED = 'component:removed',
    SYSTEM_ADDED = 'system:added',
    SYSTEM_REMOVED = 'system:removed'
}
```

## 与其他框架对比

| 特性 | @esengine/ecs-framework | bitECS | Miniplex |
|------|-------------------------|--------|----------|
| TypeScript 支持 | ✅ 原生支持 | ✅ 完整支持 | ✅ 原生支持 |
| 事件系统 | ✅ 内置+装饰器 | ❌ 需自己实现 | ✅ 响应式 |
| 查询系统 | ✅ 流式 API | ✅ 函数式 | ✅ 响应式 |
| 实体管理器 | ✅ 统一接口 | ❌ 低级 API | ✅ 高级接口 |
| 性能优化 | ✅ 多重优化 | ✅ 极致性能 | ✅ React 优化 |
| JavaScript引擎集成 | ✅ 专为JS引擎设计 | ✅ 通用设计 | ⚠️ 主要 React |

**选择指南：**
- 选择本框架：需要完整的游戏开发工具链和中文社区支持
- 选择 bitECS：需要极致性能和最小化设计
- 选择 Miniplex：主要用于 React 应用开发

## 项目结构

```
ecs-framework/
├── src/
│   ├── ECS/           # ECS 核心系统
│   │   ├── Core/      # 核心管理器
│   │   ├── Systems/   # 系统类型
│   │   └── Utils/     # ECS 工具
│   ├── Types/         # TypeScript接口定义
│   └── Utils/         # 通用工具
├── docs/              # 文档
└── scripts/           # 构建脚本
```

## 文档

### 🎯 新手入门
- **[📖 新手教程完整指南](docs/beginner-tutorials.md)** - 完整学习路径，从零开始 ⭐ **强烈推荐**
- **[🚀 快速入门](docs/getting-started.md)** - 详细的入门教程，包含Laya/Cocos/Node.js集成指南 ⭐ **平台集成必读**
- [🧠 技术概念详解](docs/concepts-explained.md) - 通俗易懂的技术概念解释 ⭐ **推荐新手阅读**
- [🎯 位掩码使用指南](docs/bitmask-guide.md) - 位掩码概念、原理和高级使用技巧
- [💡 使用场景示例](docs/use-cases.md) - 不同类型游戏的具体应用案例
- [🔧 框架类型系统](docs/concepts-explained.md#框架类型系统) - TypeScript接口设计和使用指南

### 📚 核心功能
- [🎭 实体管理指南](docs/entity-guide.md) - 实体的创建和使用方法
- [🧩 组件设计指南](docs/component-design-guide.md) - 如何设计高质量组件 ⭐ **设计必读**
- [⚙️ 系统详解指南](docs/system-guide.md) - 四种系统类型的详细使用
- [🎬 场景管理指南](docs/scene-management-guide.md) - 场景切换和数据管理
- [⏰ 定时器系统指南](docs/timer-guide.md) - 定时器的完整使用方法

### API 参考
- [核心 API 参考](docs/core-concepts.md) - 完整的 API 使用说明  
- [实体基础指南](docs/entity-guide.md) - 实体的基本概念和操作
- [EntityManager 指南](docs/entity-manager-example.md) - 高性能查询和批量操作
- [事件系统指南](docs/event-system-example.md) - 事件系统完整用法
- [查询系统指南](docs/query-system-usage.md) - 查询系统使用方法

### 性能相关
- [性能优化指南](docs/performance-optimization.md) - 性能优化技术和策略

## 构建

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 监听模式
npm run build:watch

# 清理构建文件
npm run clean

# 重新构建
npm run rebuild
```

## 性能监控

框架提供内置性能统计：

```typescript
// 场景统计
const sceneStats = scene.getStats();
console.log('性能统计:', {
    实体数量: sceneStats.entityCount,
    系统数量: sceneStats.processorCount
});

// 查询系统统计
const queryStats = scene.querySystem.getStats();
console.log('查询统计:', {
    缓存命中率: queryStats.hitRate + '%',
    查询次数: queryStats.queryCount
});
```

## 扩展库

- [路径寻找库](https://github.com/esengine/ecs-astar) - A*、BFS、Dijkstra 算法
- [AI 系统](https://github.com/esengine/BehaviourTree-ai) - 行为树、效用 AI

## 社区

- QQ 群：[ecs游戏框架交流](https://jq.qq.com/?_wv=1027&k=29w1Nud6)
- GitHub：[提交 Issue](https://github.com/esengine/ecs-framework/issues)

## 贡献

欢迎提交 Pull Request 和 Issue！

### 开发要求

- Node.js >= 14.0.0
- TypeScript >= 4.0.0

## 许可证

[MIT](LICENSE) 