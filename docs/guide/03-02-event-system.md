# 事件系统

事件系统为 ECS 框架内的组件间通信提供类型安全、高性能的解决方案。它通过中央化事件总线架构实现实体、系统和框架组件之间的解耦通信，支持同步和异步事件处理。

有关组件间通信模式，请参见[组件系统](02-02-components-and-storage.md)。有关系统级协调，请参见[系统架构](02-03-systems-and-processing.md)。

## 核心架构

事件系统基于两个主要类构建：用于基于实例事件处理的 EventBus 和用于框架范围通信的 GlobalEventBus。

### 事件总线架构

#### EventBus 类结构

[EventBus](../api/core/ecs-framework-monorepo.eventbus.md) 类作为核心事件分发器，管理事件监听器、处理事件发射，并为事件行为提供配置选项。

#### GlobalEventBus 单例

[GlobalEventBus](../api/core/ecs-framework-monorepo.globaleventbus.md) 提供可从任何组件访问的框架范围事件系统，实现单例模式以确保一致的全局通信。

**API参考**:
- [EventBus](../api/core/ecs-framework-monorepo.eventbus.md)
- [GlobalEventBus](../api/core/ecs-framework-monorepo.globaleventbus.md)
- [IEventBus](../api/core/ecs-framework-monorepo.ieventbus.md)

## 事件处理器注册

### 监听器生命周期

事件监听器使用唯一标识符注册，可以配置优先级、执行模式和生命周期选项。

### 装饰器模式

框架提供装饰器用于自动事件处理器注册，消除手动设置和清理代码的需要。

**API参考**:
- [on()](../api/core/ecs-framework-monorepo.eventbus.on.md)
- [once()](../api/core/ecs-framework-monorepo.eventbus.once.md)
- [onAsync()](../api/core/ecs-framework-monorepo.eventbus.onasync.md)
- [off()](../api/core/ecs-framework-monorepo.eventbus.off.md)

## 事件类型与配置

### 事件监听器配置

框架通过 [IEventListenerConfig](../api/core/ecs-framework-monorepo.ieventlistenerconfig.md) 接口支持全面的事件配置：

| 属性 | 类型 | 描述 |
|------|------|------|
| [once](../api/core/ecs-framework-monorepo.ieventlistenerconfig.once.md) | boolean | 监听器仅执行一次 |
| [priority](../api/core/ecs-framework-monorepo.ieventlistenerconfig.priority.md) | EventPriority | 执行优先级 (0-4) |
| [async](../api/core/ecs-framework-monorepo.ieventlistenerconfig.async.md) | boolean | 异步处理器支持 |

### 优先级等级

- **LOWEST (0)**: 后台处理
- **LOW (1)**: 非关键更新
- **NORMAL (2)**: 标准处理
- **HIGH (3)**: 重要系统事件
- **HIGHEST (4)**: 关键框架事件

### 配置示例

```typescript
const config: IEventListenerConfig = {
    once: false,
    priority: EventPriority.HIGH,
    async: false
};

eventBus.on('important:event', handler, config);
```

**API参考**:
- [IEventListenerConfig](../api/core/ecs-framework-monorepo.ieventlistenerconfig.md)
- [EventPriority](../api/core/ecs-framework-monorepo.eventpriority.md)

## 批处理配置

事件系统支持高频事件的批处理：

### 批处理优势

- 减少高频事件的处理开销
- 可配置的批处理大小和刷新间隔
- 支持手动刷新以实现即时处理

**API参考**:
- [setBatchConfig()](../api/core/ecs-framework-monorepo.eventbus.setbatchconfig.md)
- [flushBatch()](../api/core/ecs-framework-monorepo.eventbus.flushbatch.md)

## 事件装饰器

框架提供装饰器用于自动事件处理器注册，支持同步和异步事件处理。

### 装饰器实现

#### 装饰器使用模式

```typescript
class GameManager {
    @EventHandler('entity:created')
    onEntityCreated(data) {
        // 处理实体创建
    }
    
    @AsyncEventHandler('level:loaded')
    async onLevelLoaded(data) {
        // 处理异步关卡加载
    }
}
```

#### 自动生命周期管理

装饰器自动处理监听器的注册和清理，减少样板代码并防止内存泄漏。

**API参考**:
- [EventBus](../api/core/ecs-framework-monorepo.eventbus.md)

## 预定义 ECS 事件

框架为常见的 ECS 操作提供预定义事件，确保整个系统中通信模式的一致性。

### ECS 事件类型

#### 事件数据接口

- **实体事件**: 包含 entityId、timestamp、eventId、source
- **组件事件**: 包含 entityId、componentType、附加组件数据
- **系统事件**: 包含 systemName、systemType、操作上下文
- **性能事件**: 包含 operation、executionTime、metadata、阈值信息

#### 预定义事件处理器

框架为常见 ECS 事件提供便利方法：

- [emitEntityCreated()](../api/core/ecs-framework-monorepo.eventbus.emitentitycreated.md) / [onEntityCreated()](../api/core/ecs-framework-monorepo.eventbus.onentitycreated.md)
- [emitComponentAdded()](../api/core/ecs-framework-monorepo.eventbus.emitcomponentadded.md) / [onComponentAdded()](../api/core/ecs-framework-monorepo.eventbus.oncomponentadded.md)
- [onSystemError()](../api/core/ecs-framework-monorepo.eventbus.onsystemerror.md)
- [emitPerformanceWarning()](../api/core/ecs-framework-monorepo.eventbus.emitperformancewarning.md) / [onPerformanceWarning()](../api/core/ecs-framework-monorepo.eventbus.onperformancewarning.md)

**API参考**:
- [IEventData](../api/core/ecs-framework-monorepo.ieventdata.md)
- [IEntityEventData](../api/core/ecs-framework-monorepo.ientityeventdata.md)
- [IComponentEventData](../api/core/ecs-framework-monorepo.icomponenteventdata.md)
- [ISystemEventData](../api/core/ecs-framework-monorepo.isystemeventdata.md)
- [IPerformanceEventData](../api/core/ecs-framework-monorepo.iperformanceeventdata.md)

## 事件统计与监控

事件系统提供全面的统计和监控功能，用于性能分析和调试。

### 统计数据收集

#### 统计数据结构

| 字段 | 类型 | 描述 |
|------|------|------|
| eventType | string | 事件标识符 |
| triggerCount | number | 总触发次数 |
| listenerCount | number | 活跃监听器数量 |
| lastTriggered | number | 最后执行时间戳 |

#### 性能监控

系统跟踪事件性能指标，包括执行时间、监听器数量和触发频率，用于优化分析。

**API参考**:
- [getStats()](../api/core/ecs-framework-monorepo.eventbus.getstats.md)
- [resetStats()](../api/core/ecs-framework-monorepo.eventbus.resetstats.md)
- [getListenerCount()](../api/core/ecs-framework-monorepo.eventbus.getlistenercount.md)
- [IEventStats](../api/core/ecs-framework-monorepo.ieventstats.md)

## 使用模式

### 系统通信

#### 解耦系统架构

系统通过事件而非直接引用进行通信，实现松耦合和更易于测试。

#### 事件驱动处理

系统可以响应实体和组件变化，而无需与生成这些变化的系统紧耦合。

**API参考**:
- [EventBus](../api/core/ecs-framework-monorepo.eventbus.md)
- [GlobalEventBus](../api/core/ecs-framework-monorepo.globaleventbus.md)

### 组件生命周期集成

#### 自动事件生成

框架自动为实体和组件生命周期变化发射事件，确保系统保持同步。

#### 系统响应性

系统可以通过事件处理器立即响应组件变化，维护整个 ECS 架构的一致性。

**API参考**:
- [emitEntityCreated()](../api/core/ecs-framework-monorepo.eventbus.emitentitycreated.md)
- [emitEntityDestroyed()](../api/core/ecs-framework-monorepo.eventbus.emitentitydestroyed.md)
- [emitComponentAdded()](../api/core/ecs-framework-monorepo.eventbus.emitcomponentadded.md)
- [emitComponentRemoved()](../api/core/ecs-framework-monorepo.eventbus.emitcomponentremoved.md)

## 性能考虑

### 事件系统优化

事件系统包含多项性能优化功能：

#### 批处理

- 高频事件的可配置批处理大小
- 基于时间和计数的批处理刷新
- 减少事件密集场景的处理开销

#### 基于优先级的执行

- 事件处理器优先级等级 (0-4)
- 关键事件优先处理
- 可配置的执行顺序

#### 内存管理

- 自动监听器清理
- 事件数据增强无重复
- 高效的监听器存储和检索

#### 调试与监控控制

- 开发时的可选调试模式
- 事件统计收集
- 性能警告系统

**API参考**:
- [setBatchConfig()](../api/core/ecs-framework-monorepo.eventbus.setbatchconfig.md)
- [setDebugMode()](../api/core/ecs-framework-monorepo.eventbus.setdebugmode.md)
- [EventPriority](../api/core/ecs-framework-monorepo.eventpriority.md)

---

事件系统为 ECS 框架内的系统间通信提供了强大的基础，支持简单的事件模式和复杂的事件驱动架构，具备全面的监控和优化功能。