# ECS Framework

[![npm version](https://badge.fury.io/js/%40esengine%2Fecs-framework.svg)](https://badge.fury.io/js/%40esengine%2Fecs-framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个专业级的 TypeScript ECS（Entity-Component-System）框架，采用现代化架构设计，专为高性能游戏开发打造。

## ✨ 核心特性

- 🏗️ **现代化 ECS 架构** - 完整的实体组件系统，提供清晰的代码结构
- 📡 **类型安全事件系统** - 增强的事件总线，支持异步事件、优先级、批处理和装饰器
- ⏰ **定时器管理系统** - 完整的定时器管理，支持延迟和重复任务
- 🔍 **智能查询系统** - 支持复杂的实体查询，流式API设计
- ⚡ **高性能优化** - 组件索引、Archetype系统、脏标记机制三重优化
- 🛠️ **开发者友好** - 完整的TypeScript支持，丰富的调试工具
- 📦 **轻量级设计** - 最小化依赖，适用于各种游戏引擎

## 📦 安装

```bash
npm install @esengine/ecs-framework
```

## 🚀 快速开始

### 1. 基础设置

```typescript
import { Core, CoreEvents, Scene } from '@esengine/ecs-framework';

// 创建 Core 实例
const core = Core.create(true); // 开启调试模式

// 创建场景
class GameScene extends Scene {
    public initialize() {
        // 场景初始化逻辑
    }
}

// 在游戏循环中更新框架
function gameLoop() {
    Core.emitter.emit(CoreEvents.frameUpdated);
}
```

### 2. 创建实体和组件

```typescript
import { Component, Entity } from '@esengine/ecs-framework';

// 定义组件
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

// 创建实体
const entity = scene.createEntity("Player");
entity.addComponent(new PositionComponent(100, 100));
entity.addComponent(new VelocityComponent(10, 0));
```

### 3. 创建处理系统

```typescript
import { EntitySystem } from '@esengine/ecs-framework';

class MovementSystem extends EntitySystem {
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

### 4. 实体查询和管理

```typescript
import { EntityManager } from '@esengine/ecs-framework';

// 使用EntityManager进行高级查询
const entityManager = new EntityManager();

// 查询具有特定组件的实体
const movingEntities = entityManager
    .query()
    .withAll(PositionComponent, VelocityComponent)
    .execute();

// 查询带标签的实体
const enemies = entityManager.getEntitiesByTag(1);

// 批量创建实体
const bullets = entityManager.createEntities(100, "bullet");
```

### 5. 事件系统

```typescript
import { EventBus, ECSEventType, EventHandler } from '@esengine/ecs-framework';

// 获取事件总线
const eventBus = entityManager.eventBus;

// 监听实体创建事件
eventBus.onEntityCreated((data) => {
    console.log(`Entity created: ${data.entityName}`);
});

// 监听组件添加事件
eventBus.onComponentAdded((data) => {
    console.log(`Component ${data.componentType} added to entity ${data.entityId}`);
});

// 使用装饰器自动注册事件监听器
class GameManager {
    @EventHandler(ECSEventType.ENTITY_DESTROYED)
    onEntityDestroyed(data) {
        console.log('Entity destroyed:', data.entityName);
    }
}

// 自定义事件
eventBus.emit('player:levelup', { playerId: 123, newLevel: 5 });
```

## 🆚 框架对比

与其他 TypeScript ECS 框架相比，我们的优势：

| 特性 | @esengine/ecs-framework | bitecs | ecsy | Miniplex |
|------|-------------------------|-------|------|----------|
| **TypeScript 支持** | ✅ 原生支持 | ✅ 完整支持 | ⚠️ 部分支持 | ✅ 原生支持 |
| **事件系统** | ✅ 类型安全+装饰器 | ❌ 无内置事件系统 | ⚠️ 基础事件 | ✅ 响应式事件 |
| **查询系统** | ✅ 智能查询+流式API | ✅ 高性能 | ✅ 基础查询 | ✅ 响应式查询 |
| **性能优化** | ✅ 多层优化系统 | ✅ WASM优化 | ⚠️ 基础优化 | ✅ React集成优化 |
| **实体管理器** | ✅ 统一管理接口 | ❌ 无统一接口 | ✅ 基础管理 | ✅ 响应式管理 |
| **组件索引** | ✅ 哈希+位图索引 | ✅ 原生支持 | ❌ 无索引系统 | ✅ 自动索引 |
| **Archetype系统** | ✅ 内置支持 | ✅ 内置支持 | ❌ 无Archetype | ❌ 无Archetype |
| **脏标记系统** | ✅ 细粒度追踪 | ⚠️ 基础支持 | ❌ 无脏标记 | ✅ React级追踪 |
| **批量操作** | ✅ 全面的批量API | ✅ 批量支持 | ⚠️ 有限支持 | ⚠️ 有限支持 |
| **游戏引擎集成** | ✅ 通用设计 | ✅ 通用设计 | ✅ 通用设计 | ⚠️ 主要针对React |
| **学习曲线** | 🟢 中等 | 🟡 较陡峭 | 🟢 简单 | 🟡 需要React知识 |
| **社区生态** | 🟡 成长中 | 🟢 活跃 | 🟡 稳定 | 🟡 小众但精品 |

### 为什么选择我们？

**相比 bitecs**：
- 更友好的 TypeScript API，无需手动管理内存
- 完整的实体管理器，开发体验更佳
- 内置类型安全事件系统，bitecs需要自己实现
- 多种索引系统可选，适应不同场景

**相比 ecsy**：
- 现代化的性能优化系统（组件索引、Archetype、脏标记）
- 更完整的 TypeScript 类型定义
- 增强的事件系统，支持装饰器和异步事件
- 活跃的维护和功能更新

**相比 Miniplex**：
- 不依赖 React 生态，可用于任何游戏引擎
- 专门针对游戏开发优化
- 更轻量级的核心设计
- 传统事件模式，更适合游戏开发习惯

## 📚 核心概念

### Entity（实体）
实体是游戏世界中的基本对象，可以挂载组件和运行系统。

```typescript
// 创建实体
const entity = scene.createEntity("Player");

// 设置实体属性
entity.tag = 1;
entity.updateOrder = 0;
entity.enabled = true;

// 批量创建实体
const entities = scene.createEntities(100, "Enemy");
```

### Component（组件）
组件存储数据，定义实体的属性和状态。

```typescript
import { Component } from '@esengine/ecs-framework';

class HealthComponent extends Component {
    public maxHealth: number = 100;
    public currentHealth: number = 100;
    
    public takeDamage(damage: number) {
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        if (this.currentHealth <= 0) {
            this.entity.destroy();
        }
    }
}

// 添加组件到实体
entity.addComponent(new HealthComponent());
```

### System（系统）
系统处理具有特定组件的实体集合，实现游戏逻辑。

```typescript
import { EntitySystem, Entity } from '@esengine/ecs-framework';

class HealthSystem extends EntitySystem {
    protected process(entities: Entity[]) {
        for (const entity of entities) {
            const health = entity.getComponent(HealthComponent);
            if (health && health.currentHealth <= 0) {
                // 处理实体死亡逻辑
                entity.destroy();
            }
        }
    }
}
```

## 🧪 测试

```bash
# 运行所有测试
npm run test

# 性能基准测试
npm run benchmark
```

## 📖 文档

- [快速入门](docs/getting-started.md) - 从零开始学习框架使用
- [EntityManager 使用指南](docs/entity-manager-example.md) - 详细了解实体管理器的高级功能
- [事件系统使用指南](docs/event-system-example.md) - 学习类型安全事件系统的完整用法
- [性能优化指南](docs/performance-optimization.md) - 深入了解三大性能优化系统
- [核心概念](docs/core-concepts.md) - 深入了解 ECS 架构和设计原理
- [查询系统使用指南](docs/query-system-usage.md) - 学习高性能查询系统的详细用法

## 🔗 扩展库

- [路径寻找库](https://github.com/esengine/ecs-astar) - A*、广度优先、Dijkstra、GOAP 算法
- [AI 系统](https://github.com/esengine/BehaviourTree-ai) - 行为树、效用 AI 系统

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/esengine/ecs-framework.git
cd ecs-framework

# 运行基准测试
node benchmark.js

# 开发构建 (在source目录)
cd source && npm install && npm run build
```

### 构建要求

- Node.js >= 14.0.0
- TypeScript >= 4.0.0

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 💬 交流群

加入 QQ 群讨论：[ecs游戏框架交流](https://jq.qq.com/?_wv=1027&k=29w1Nud6)

### 🚀 核心性能指标

```bash
实体创建: 640,000+ 个/秒
组件查询: O(1) 复杂度（使用索引）
内存优化: 30-50% 减少分配
批量操作: 显著提升处理效率
```

### 🎯 性能优化技术

- **组件索引系统**: 哈希和位图双重索引，支持 O(1) 查询
- **Archetype 系统**: 按组件组合分组，减少查询开销
- **脏标记机制**: 细粒度变更追踪，避免不必要的计算
- **批量操作 API**: 减少函数调用开销，提升大规模操作效率
- **智能缓存**: 查询结果缓存和延迟清理机制

### 🔧 性能建议

1. **大规模场景**: 使用批量API和组件索引
2. **频繁查询**: 启用Archetype系统进行快速筛选
3. **实时游戏**: 利用脏标记减少无效更新
4. **移动端**: 建议实体数量控制在20,000以内

运行 `npm run benchmark` 查看在您的环境中的具体性能表现。

---

**ECS Framework** - 让游戏开发更简单、更高效！ 