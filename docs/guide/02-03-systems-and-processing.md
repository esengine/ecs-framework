# 系统与处理

本文档涵盖 ECS 框架中的系统架构和处理机制。系统包含操作具有特定组件组合的实体的逻辑，实现了实体-组件-系统架构中的"S"。

有关实体查询和性能优化的信息，请参见[《查询系统与性能》](03-01-query-system-and-performance.md)。有关组件存储和管理，请参见[《组件与存储》](02-02-components-and-storage.md)。有关场景级系统编排，请参见[《场景与世界》](02-04-scenes-and-worlds.md)。

## 系统处理生命周期

EntitySystem 遵循结构化的生命周期，具有用于初始化、处理和清理的多个阶段。

### 系统生命周期阶段

#### 生命周期方法详情

| 方法 | 用途 | 调用时机 | 可重写 |
|------|------|----------|--------|
| [initialize()](../api/core/ecs-framework-monorepo.entitysystem.initialize.md) | 框架初始化 | 系统添加到场景时 | 仅框架使用 |
| [onInitialize()](../api/core/ecs-framework-monorepo.entitysystem.oninitialize.md) | 用户初始化 | 框架初始化后 | 是 |
| [reset()](../api/core/ecs-framework-monorepo.entitysystem.reset.md) | 重置系统状态 | 系统从场景移除时 | 仅框架使用 |
| [onCheckProcessing()](../api/core/ecs-framework-monorepo.entitysystem.oncheckprocessing.md) | 条件处理 | 每次更新前 | 是 |
| [onBegin()](../api/core/ecs-framework-monorepo.entitysystem.onbegin.md) | 预处理设置 | 更新周期开始时 | 是 |
| [process()](../api/core/ecs-framework-monorepo.entitysystem.process.md) | 主要实体处理 | 更新期间 | 必需 |
| [lateProcess()](../api/core/ecs-framework-monorepo.entitysystem.lateprocess.md) | 后处理清理 | lateUpdate 期间 | 是 |
| [onEnd()](../api/core/ecs-framework-monorepo.entitysystem.onend.md) | 后处理清理 | 更新周期结束时 | 是 |
| [onAdded()](../api/core/ecs-framework-monorepo.entitysystem.onadded.md) | 实体跟踪回调 | 实体匹配查询时 | 是 |
| [onRemoved()](../api/core/ecs-framework-monorepo.entitysystem.onremoved.md) | 实体跟踪回调 | 实体停止匹配时 | 是 |

**API参考**:
- [EntitySystem](../api/core/ecs-framework-monorepo.entitysystem.md)

## 实体跟踪与事件

EntitySystem 自动跟踪匹配其查询的实体，并在实体进入或离开系统时提供回调。

### 实体跟踪机制

此跟踪机制使系统能够：

- 当实体首次匹配查询时初始化实体状态
- 当实体不再匹配时清理实体状态
- 维护高效的引用而无需冗余处理
- 响应影响查询匹配的组件变化

**API参考**:
- [EntitySystem](../api/core/ecs-framework-monorepo.entitysystem.md)
- [onAdded()](../api/core/ecs-framework-monorepo.entitysystem.onadded.md)
- [onRemoved()](../api/core/ecs-framework-monorepo.entitysystem.onremoved.md)

## 系统注册与执行

系统通过 EntityProcessorList 注册到场景中，并根据其 updateOrder 属性按优先级顺序执行。

### 系统执行架构

updateOrder 属性允许精确控制系统执行顺序，实现对修改相同组件的系统之间的正确依赖管理。

**API参考**:
- [EntitySystem](../api/core/ecs-framework-monorepo.entitysystem.md)
- [updateOrder](../api/core/ecs-framework-monorepo.entitysystem.updateorder.md)
- [EntityProcessorList](../api/core/ecs-framework-monorepo.entityprocessorlist.md)