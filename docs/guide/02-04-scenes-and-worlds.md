# 场景与世界

本文档涵盖 ECS 框架中的场景和世界管理系统。它解释了用于基本实体和系统容器的 Scene 类、用于多场景协调的 World 类，以及用于复杂多世界架构的 WorldManager。

有关基本实体-组件-系统概念的信息，请参见[《核心 ECS 框架》](02-core-ecs-framework.md)。有关系统处理和生命周期，请参见[《系统与处理》](02-03-systems-and-processing.md)。

## 架构概览

ECS 框架提供了一个具有三个主要层级的分层容器系统：Core → World → Scene。这种设计既支持简单的单场景应用，也支持复杂的多世界架构。

## 容器层级

**API参考**:
- [Scene](../api/core/ecs-framework-monorepo.scene.md)
- [World](../api/core/ecs-framework-monorepo.world.md)
- [WorldManager](../api/core/ecs-framework-monorepo.worldmanager.md)

## 场景管理

Scene 类作为 ECS 框架中实体和系统的主要容器。每个场景管理自己的实体生命周期、组件存储和系统执行。

### 场景生命周期管理

Scene 类提供了明确定义的生命周期，包含初始化、启动、更新和清理阶段的钩子：

| 阶段 | 方法 | 用途 |
|------|------|------|
| 创建 | constructor() | 初始化核心组件和事件系统 |
| 设置 | initialize() | 实体和系统设置的重写点 |
| 启动 | begin() | 启动实体处理器并调用onStart() |
| 运行时 | update() | 每帧更新实体和系统 |
| 清理 | end() | 停止处理器，移除实体，调用unload() |

### 实体和系统管理

场景为实体和系统提供全面的管理：

```typescript
// 实体操作
const entity = scene.createEntity("Player");
const foundEntity = scene.findEntityById(entityId);
const taggedEntities = scene.findEntitiesByTag(PlayerTag);

// 系统管理  
scene.addEntityProcessor(new MovementSystem());
const processor = scene.getEntityProcessor(MovementSystem);
scene.removeEntityProcessor(processor);
```

场景通过 QuerySystem 自动处理实体-系统关系，确保系统根据其 Matcher 条件接收适当的实体。

**API参考**:
- [Scene.createEntity()](../api/core/ecs-framework-monorepo.scene.createentity.md)
- [Scene.findEntityById()](../api/core/ecs-framework-monorepo.scene.findentitybyid.md)
- [Scene.addEntityProcessor()](../api/core/ecs-framework-monorepo.scene.addentityprocessor.md)
- [Scene.getEntityProcessor()](../api/core/ecs-framework-monorepo.scene.getentityprocessor.md)

## 世界管理

World 类提供了管理多个场景和全局系统的更高级容器。这使得复杂架构成为可能，其中不同的场景处理应用程序的不同方面（例如，游戏玩法、UI、背景效果）。

### 世界架构

### 全局系统接口

全局系统在 World 级别运行，处理跨场景逻辑：

```typescript
interface IGlobalSystem {
    readonly name: string;
    initialize?(): void;
    update(deltaTime?: number): void;
    reset?(): void;
    destroy?(): void;
}
```

常见用例包括网络同步、玩家管理和跨多个场景的资源协调。

**API参考**:
- [World](../api/core/ecs-framework-monorepo.world.md)
- [IGlobalSystem](../api/core/ecs-framework-monorepo.iglobalsystem.md)

## 多场景协调

世界通过选择性激活和共享全局状态来协调多个场景：

**API参考**:
- [World](../api/core/ecs-framework-monorepo.world.md)

### WorldManager

WorldManager 类通过单例模式提供多个 World 实例的全局协调。这使得游戏服务器等需要管理多个独立游戏房间的应用程序成为可能。

**API参考**:
- [WorldManager](../api/core/ecs-framework-monorepo.worldmanager.md)

## WorldManager 配置

WorldManager 支持资源管理和清理行为的配置：

| 配置选项 | 用途 | 默认值 |
|----------|------|--------|
| maxWorlds | 最大并发世界数量 | 50 |
| autoCleanup | 自动移除空世界 | true |
| cleanupInterval | 清理计时器间隔（毫秒） | 30000 |
| debug | 启用调试日志 | false |

**API参考**:
- [WorldManager](../api/core/ecs-framework-monorepo.worldmanager.md)

## 与 Core 的集成

框架通过 Core 类在单场景和多世界模式之间提供无缝集成：

**API参考**:
- [Core](../api/core/ecs-framework-monorepo.core.md)

## 使用模式

### 单场景模式（向后兼容）

- 简单游戏和原型
- 通过 Core.getScene() 直接访问场景
- 传统 ECS 工作流程

### 多世界模式（高级功能）

- 具有多个房间的游戏服务器
- 具有场景层的复杂应用程序
- 独立的世界管理

**API参考**:
- [Core.getScene()](../api/core/ecs-framework-monorepo.core.getscene.md)
- [Core.getWorldManager()](../api/core/ecs-framework-monorepo.core.getworldmanager.md)

## 性能考虑

### 场景优化

场景为大规模实体管理提供多项优化功能：

- **批量实体创建**: createEntities(count, prefix) 用于高效的批量操作
- **延迟缓存清理**: addEntity(entity, deferCacheClear) 用于批量操作
- **查询系统缓存**: 自动缓存实体查询以供重复访问
- **组件存储优化**: 集成 ComponentStorageManager 并支持 SoA

### 世界协调

世界管理包括性能监控和资源清理：

- **选择性场景更新**: 仅活跃场景参与更新周期
- **全局系统协调**: 共享系统减少冗余处理
- **自动资源清理**: 可配置的空世界清理
- **统计信息收集**: 内置性能监控和报告

**API参考**:
- [Scene.createEntities()](../api/core/ecs-framework-monorepo.scene.createentities.md)
- [Scene.addEntity()](../api/core/ecs-framework-monorepo.scene.addentity.md)
- [World](../api/core/ecs-framework-monorepo.world.md)
- [WorldManager](../api/core/ecs-framework-monorepo.worldmanager.md)