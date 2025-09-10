# 查询系统与性能

本文档涵盖 ECS 框架的高性能实体查询功能，包括 QuerySystem、Matcher API、缓存机制和原型优化。查询系统旨在基于组件组合高效查找实体，同时即使在处理数千个实体时也能保持出色的性能。

有关系统如何使用查询进行实体处理的信息，请参见[《系统与处理》](02-03-systems-and-processing.md)。有关组件存储和索引详细信息，请参见[《组件与存储》](02-02-components-and-storage.md)。

## 架构概览

查询系统由一个中央 QuerySystem 类组成，该类协调多个优化子系统，以在不同的实体规模和访问模式下提供快速的查询性能。

**API参考**:
- [QuerySystem](../api/core/ecs-framework-monorepo.querysystem.md)
- [Scene.querySystem](../api/core/ecs-framework-monorepo.scene.querysystem.md)

## 核心查询操作

QuerySystem 类提供多种查询方法，返回包含实体和性能元数据的 QueryResult 对象。

### 基于组件的查询

| 方法 | 用途 | 用法示例 |
|------|------|----------|
| [queryAll(...types)](../api/core/ecs-framework-monorepo.querysystem.queryall.md) | 具有所有指定组件的实体 | `querySystem.queryAll(PositionComponent, VelocityComponent)` |
| [queryAny(...types)](../api/core/ecs-framework-monorepo.querysystem.queryany.md) | 具有任意指定组件的实体 | `querySystem.queryAny(HealthComponent, ManaComponent)` |
| [queryNone(...types)](../api/core/ecs-framework-monorepo.querysystem.querynone.md) | 不具有指定组件的实体 | `querySystem.queryNone(DeadComponent, InactiveComponent)` |
| [queryByComponent(type)](../api/core/ecs-framework-monorepo.querysystem.querybycomponent.md) | 具有单一组件类型的实体 | `querySystem.queryByComponent(PositionComponent)` |

### 基于元数据的查询

| 方法 | 用途 | 用法 |
|------|------|------|
| [queryByTag(tag)](../api/core/ecs-framework-monorepo.querysystem.querybytag.md) | 具有特定标签值的实体 | querySystem.queryByTag(ENEMY_TAG) |
| [queryByName(name)](../api/core/ecs-framework-monorepo.querysystem.querybyname.md) | 具有特定名称的实体 | querySystem.queryByName("Player") |

**API参考**:
- [QuerySystem](../api/core/ecs-framework-monorepo.querysystem.md)

## 性能优化系统

查询系统采用多种优化策略来在不同的实体规模和查询模式下维持性能。

### 查询缓存系统

缓存系统存储查询结果，具有可配置的超时和大小限制，以减少重复计算成本。

- **缓存键生成**: 基于查询类型和组件类型
- **TTL 管理**: 默认 5 秒过期时间和清理
- **大小限制**: 最大 1000 个缓存条目，采用 LRU 淘汰策略
- **命中跟踪**: 缓存效果监控统计

**API参考**:
- [QuerySystem.clearCache()](../api/core/ecs-framework-monorepo.querysystem.clearcache.md)
- [QuerySystem.getStats()](../api/core/ecs-framework-monorepo.querysystem.getstats.md)

### 基于原型的优化

ArchetypeSystem 根据实体的确切组件组合对实体进行分组，实现对具有特定组件组合的实体的 O(1) 访问。

**API参考**:
- [ArchetypeSystem](../api/core/ecs-framework-monorepo.archetypesystem.md)

### 组件索引管理

ComponentIndexManager 维护每个组件类型的实体索引，用于快速的单组件查询和多组件交集操作。

**API参考**:
- [ComponentIndexManager](../api/core/ecs-framework-monorepo.componentindexmanager.md)

## 实体生命周期集成

查询系统在实体和组件在其整个生命周期中发生变化时自动维护索引。

### 实体管理操作

| 操作 | 触发时机 | 索引更新 |
|------|----------|----------|
| [addEntity(entity)](../api/core/ecs-framework-monorepo.querysystem.addentity.md) | 实体创建或场景添加 | 添加到所有相关索引 |
| [removeEntity(entity)](../api/core/ecs-framework-monorepo.querysystem.removeentity.md) | 实体销毁 | 从所有索引中移除 |
| [addEntities(entities)](../api/core/ecs-framework-monorepo.querysystem.addentities.md) | 批量实体创建 | 批量索引更新 |
| [setEntities(entities)](../api/core/ecs-framework-monorepo.querysystem.setentities.md) | 场景重置或批量替换 | 完整索引重建 |

**API参考**:
- [QuerySystem](../api/core/ecs-framework-monorepo.querysystem.md)

## 性能监控

查询系统提供全面的性能统计信息，用于优化和调试。

### 查询统计跟踪

```typescript
queryStats = {
    totalQueries: number,     // 总查询次数
    cacheHits: number,        // 缓存命中次数  
    indexHits: number,        // 基于索引的查询
    linearScans: number,      // 回退线性扫描
    archetypeHits: number,    // 原型优化查询
    dirtyChecks: number       // 脏数据跟踪操作
}
```

### 缓存性能指标

```typescript
cacheStats = {
    size: number,             // 当前缓存大小
    maxSize: number,          // 最大缓存容量
    hitRate: string,          // 缓存命中率百分比
    averageExecutionTime: number  // 平均查询时间
}
```

**API参考**:
- [QuerySystem.getStats()](../api/core/ecs-framework-monorepo.querysystem.getstats.md)

## 集成模式

查询系统通过明确定义的接口与更广泛的 ECS 框架组件无缝集成。

### 场景集成

Scene 类自动创建和管理 QuerySystem 实例，使其可供场景内的所有实体系统和组件使用。

**API参考**:
- [Scene.querySystem](../api/core/ecs-framework-monorepo.scene.querysystem.md)
- [Scene](../api/core/ecs-framework-monorepo.scene.md)

### 实体系统使用

实体系统通常使用查询系统来查找匹配其处理条件的实体，通常缓存结果以提高性能。

**API参考**:
- [EntitySystem](../api/core/ecs-framework-monorepo.entitysystem.md)