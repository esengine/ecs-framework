# 实体与实体管理

本文档涵盖 ECS 框架中的实体系统，包括实体创建、生命周期管理、组件关系和层级组织。实体作为轻量级容器，持有组件并参与 ECS 处理管道。

有关组件设计和管理的详细信息，请参见[《组件与存储》](02-02-components-and-storage.md)。有关系统处理实体的信息，请参见[《系统与处理》](02-03-systems-and-processing.md)。有关场景级实体组织，请参见[《场景与世界》](02-04-scenes-and-worlds.md)。有关高性能实体查询技术，请参见[《查询系统与性能》](03-01-query-system-and-performance.md)。

## 实体基础

### 实体架构概览

#### 实体类结构

本框架中的实体是轻量级容器，主要管理以下内容：

- **唯一标识**：每个实体都有唯一的 id 和描述性名称
- **组件集合**：通过 ComponentSet 管理，实现高效存储和检索
- **层级关系**：通过层级系统支持可选的父子关系
- **状态管理**：通过 enabled、active 和生命周期属性进行控制

### 实体与组件分离

#### 关注点分离

框架保持严格的分离，实体处理标识和组织，组件存储数据，系统实现行为。

## 实体生命周期管理

### 实体创建方法

框架提供多种实体创建方式：

- **单个实体创建**：用于创建个别实体
  ```typescript
  scene.createEntity(name)
  ```

- **批量创建**：用于性能优化的批量创建
  ```typescript
  scene.createEntities(count, namePrefix)
  ```

- **组件预初始化创建**：用于创建预配置组件的实体
  ```typescript
  scene.createEntitiesWithComponents()
  ```

**API 参考:**
- [Scene.createEntity()](../api/core/ecs-framework-monorepo.scene.createentity.md) - 创建单个实体
- [Scene.createEntities()](../api/core/ecs-framework-monorepo.scene.createentities.md) - 批量创建实体

### 销毁级联

实体销毁遵循严格的序列，确保所有关系的正确清理并防止内存泄漏。

销毁过程包括：
1. 标记实体为已销毁状态
2. 递归销毁所有子实体
3. 从父实体中移除自身
4. 移除所有组件
5. 从场景查询系统中移除
6. 从实体列表中移除

**API 参考:**
- [Entity.destroy()](../api/core/ecs-framework-monorepo.entity.destroy.md) - 销毁实体
- [Entity.isDestroyed](../api/core/ecs-framework-monorepo.entity.isdestroyed.md) - 检查销毁状态



## 实体发现与查询

ECS 框架提供多种实体发现方法，包括场景级查找和基于层级的发现。

### 场景级实体发现（推荐）

通过场景直接查找实体：

```typescript
// 按名称查找
const player = scene.findEntity("Player");

// 按ID查找  
const entity = scene.findEntityById(123);

// 按标签查找
const enemies = scene.findEntitiesByTag(EntityTags.ENEMY);
```

### 基于层级的发现（不推荐）

在实体层级结构中进行查找：

```typescript
// 按名称查找子实体
const weapon = player.findChild("Weapon");

// 按标签查找子实体 (递归)
const allLights = sceneRoot.findChildrenByTag(EntityTags.LIGHT, true);

// 获取层级信息
const depth = entity.getDepth();
const root = entity.getRoot();
```

**API参考**:
- [Entity.findChild()](../api/core/ecs-framework-monorepo.entity.findchild.md)
- [Entity.findChildrenByTag()](../api/core/ecs-framework-monorepo.entity.findchildrenbytag.md)
- [Entity.getDepth()](../api/core/ecs-framework-monorepo.entity.getdepth.md)
- [Entity.getRoot()](../api/core/ecs-framework-monorepo.entity.getroot.md)

## 组件管理

### 组件存储架构

实体的组件管理委托给 ComponentSet 进行高效存储和检索：

| 操作 | 方法 | 性能 | 用例 |
|------|------|------|------|
| 添加组件 | addComponent(component) | O(1) | 添加新功能 |
| 获取组件 | getComponent(type) | O(1) | 访问组件数据 |
| 检查组件 | hasComponent(type) | O(1) | 系统筛选 |
| 移除组件 | removeComponent(component) | O(1) | 移除功能 |
| 组件掩码 | componentMask | O(1) | 查询系统优化 |

**API 参考:**
- [Entity.addComponent()](../api/core/ecs-framework-monorepo.entity.addcomponent.md) - 添加组件
- [Entity.getComponent()](../api/core/ecs-framework-monorepo.entity.getcomponent.md) - 获取组件
- [Entity.hasComponent()](../api/core/ecs-framework-monorepo.entity.hascomponent.md) - 检查组件
- [Entity.removeComponent()](../api/core/ecs-framework-monorepo.entity.removecomponent.md) - 移除组件

### 组件生命周期集成

#### 组件生命周期事件

每个组件操作都会触发适当的生命周期方法和事件，以维护系统一致性。

**添加组件时的生命周期：**
1. 组件注册到 ComponentRegistry
2. 设置组件的 entity 引用
3. 更新实体的组件掩码
4. 调用 `component.onAddedToEntity()`
5. 触发全局组件添加事件
6. 更新查询系统索引

**移除组件时的生命周期：**
1. 调用 `component.onRemovedFromEntity()`
2. 清除组件的 entity 引用
3. 更新实体的组件掩码
4. 触发全局组件移除事件
5. 更新查询系统索引
6. 从存储管理器中移除

## 实体属性与状态

### 核心实体属性

| 属性 | 类型 | 描述 | 访问权限 |
|------|------|------|----------|
| id | number | 场景内的唯一标识符 | 只读 |
| name | string | 人类可读的标识符 | 读/写 |
| tag | number | 用于分组的数字分类 | 读/写 |
| enabled | boolean | 控制实体参与处理 | 读/写 |
| active | boolean | 控制实体和子实体激活 | 读/写 |
| activeInHierarchy | boolean | 考虑父实体的计算激活状态 | 只读 |
| updateOrder | number | 处理优先级（数值越小优先级越高） | 读/写 |
| updateInterval | number | 更新频率控制 | 读/写 |
| isDestroyed | boolean | 销毁状态标志 | 只读 |

**API 参考:**
- [Entity.id](../api/core/ecs-framework-monorepo.entity.id.md) - 实体唯一标识
- [Entity.name](../api/core/ecs-framework-monorepo.entity.name.md) - 实体名称
- [Entity.tag](../api/core/ecs-framework-monorepo.entity.tag.md) - 实体标签
- [Entity.enabled](../api/core/ecs-framework-monorepo.entity.enabled.md) - 启用状态
- [Entity.active](../api/core/ecs-framework-monorepo.entity.active.md) - 激活状态
- [Entity.activeInHierarchy](../api/core/ecs-framework-monorepo.entity.activeinhierarchy.md) - 层级激活状态

### 实体比较和排序

框架提供 EntityComparer 用于实现一致的实体排序：

#### 实体排序逻辑

实体首先按 `updateOrder` 排序，然后按 `id` 排序，确保系统处理中的确定性顺序。

排序规则：
1. **主要排序**：按 `updateOrder` 升序（数值越小优先级越高）
2. **次要排序**：当 `updateOrder` 相同时，按 `id` 升序
3. **确定性**：保证相同条件下的排序结果一致

这种排序机制确保了系统处理实体时的可预测性和一致性，对于游戏逻辑的稳定性至关重要。

**API 参考:**
- [Entity.entityComparer](../api/core/ecs-framework-monorepo.entity.entitycomparer.md) - 实体比较器

## 性能考虑

### 组件掩码优化

实体通过 ComponentSet 维护 `componentMask`，实现高效的查询操作：

#### 位掩码性能优势

组件掩码实现 O(1) 组件存在检查和高效的查询系统筛选。

性能优势：
- **快速组件检查**：使用位运算进行 O(1) 组件存在判断
- **高效查询匹配**：查询系统可快速筛选符合条件的实体
- **内存效率**：64位掩码紧密存储，减少内存占用
- **批量操作**：支持位运算的批量组件类型比较

**API 参考:**
- [Entity.componentMask](../api/core/ecs-framework-monorepo.entity.componentmask.md) - 组件位掩码

### 批量操作

对于性能关键场景，框架提供批量操作：

| 操作 | 标准方法 | 批量方法 | 性能收益 |
|------|----------|----------|----------|
| 组件添加 | addComponent() | addComponents() | 减少开销 |
| 组件移除 | removeComponent() | removeComponentsByTypes() | 批量处理 |
| 实体创建 | createEntity() | createEntities() | 优化分配 |
| 实体+组件 | 手动循环 | createEntitiesWithComponents() | 最小化开销 |

这些批量方法减少了每操作开销，并为高性能场景提供了更好的内存分配模式。

**API 参考:**
- [Entity.addComponents()](../api/core/ecs-framework-monorepo.entity.addcomponents.md) - 批量添加组件
- [EntityManager.createEntitiesBatch()](../api/core/ecs-framework-monorepo.entitymanager.createentitiesbatch.md) - 批量创建实体