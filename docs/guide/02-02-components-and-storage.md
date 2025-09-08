# 组件与存储

本文档涵盖 ECS 框架中的组件架构和存储系统，包括组件设计模式、存储优化策略、类型注册和性能考虑。组件作为纯数据容器，通过专门的存储系统进行高效管理。

有关实体生命周期和管理的信息，请参见[《实体与实体管理》](02-01-entities-and-entity-management.md)。有关系统如何处理组件的详细信息，请参见[《系统与处理》](02-03-systems-and-processing.md)。

## 组件设计基础

本 ECS 框架中的组件是轻量级数据容器，遵循组合优于继承的原则。每个组件代表游戏状态的特定方面，除了数据访问之外包含最少的逻辑。

## 组件基类结构

框架提供了一个基础 Component 类，所有组件都必须继承此类。该基类处理核心功能，如实体附加、生命周期管理和更新协调。

**API 参考:**
- [Component](../api/core/ecs-framework-monorepo.component.md) - 组件基类
- [ComponentStorage](../api/core/ecs-framework-monorepo.componentstorage.md) - 组件存储管理

## 组件生命周期与附加

组件通过明确定义的附加点和更新周期与实体生命周期紧密集成。框架通过存储系统自动管理组件-实体关系。

| 生命周期方法 | 用途 | 调用时机 |
|-------------|------|----------|
| onAddedToEntity() | 初始化组件 | 组件添加到实体时 |
| onRemovedFromEntity() | 清理资源 | 组件从实体移除时 |
| onEnabled() | 激活行为 | 组件启用时 |
| onDisabled() | 暂停行为 | 组件禁用时 |
| update() | 每帧逻辑 | 实体更新周期 |

**API 参考:**
- [Component.onAddedToEntity()](../api/core/ecs-framework-monorepo.component.onaddedtoentity.md) - 组件添加回调
- [Component.onRemovedFromEntity()](../api/core/ecs-framework-monorepo.component.onremovedfromentity.md) - 组件移除回调
- [Component.onEnabled()](../api/core/ecs-framework-monorepo.component.onenabled.md) - 组件启用回调
- [Component.onDisabled()](../api/core/ecs-framework-monorepo.component.ondisabled.md) - 组件禁用回调
- [Component.update()](../api/core/ecs-framework-monorepo.component.update.md) - 组件更新方法

## 组件注册与类型管理

框架使用复杂的类型注册系统来管理组件类型、分配唯一标识符，并通过位掩码实现高效查询。

### ComponentRegistry 架构

**API 参考:**
- [ComponentRegistry](../api/core/ecs-framework-monorepo.componentregistry.md) - 组件注册管理器
- [ComponentStorage](../api/core/ecs-framework-monorepo.componentstorage.md) - 组件存储系统

### 类型注册过程

ComponentRegistry 在首次遇到组件类型时自动为其分配唯一的位索引。这使得能够使用位运算进行快速组件查询。

注册过程支持最多 64 种组件类型，并包括自动缓存计算出的位掩码以进行性能优化。每个组件类型都会获得一个唯一的位位置，可以与其他类型组合以创建复合查询掩码。

**API 参考:**
- [ComponentRegistry.register()](../api/core/ecs-framework-monorepo.componentregistry.register.md) - 注册组件类型
- [ComponentRegistry.getBitIndex()](../api/core/ecs-framework-monorepo.componentregistry.getbitindex.md) - 获取位索引
- [ComponentRegistry.createComponentMask()](../api/core/ecs-framework-monorepo.componentregistry.createcomponentmask.md) - 创建组件掩码

## 存储策略

框架提供两种针对不同用例优化的主要存储策略：标准实体-组件映射和结构数组（SoA）优化，适用于高性能场景。

### 标准组件存储

默认的 ComponentStorage&lt;T&gt; 使用混合方法，将实体到索引的映射与紧密数组相结合，以最小化内存碎片，同时保持快速访问模式。

| 存储特性 | 实现方式 | 性能优势 |
|---------|----------|----------|
| 实体映射 | Map&lt;number, number&gt; | O(1) 组件查找 |
| 索引管理 | 带空闲列表的紧密数组 | 最小内存碎片 |
| 组件数组 | (T \| null)[] | 缓存友好的迭代 |
| 压缩 | 手动碎片整理 | 优化内存布局 |

存储系统通过空闲索引列表自动管理内存，该列表重用已移除组件的槽位，防止数组过度增长。

**API 参考:**
- [ComponentStorage](../api/core/ecs-framework-monorepo.componentstorage.md) - 组件存储类
- [ComponentStorage.addComponent()](../api/core/ecs-framework-monorepo.componentstorage.addcomponent.md) - 添加组件
- [ComponentStorage.getComponent()](../api/core/ecs-framework-monorepo.componentstorage.getcomponent.md) - 获取组件
- [ComponentStorage.removeComponent()](../api/core/ecs-framework-monorepo.componentstorage.removecomponent.md) - 移除组件

### 结构数组（SoA）优化

对于具有高迭代频率的组件，框架提供 SoA 存储，将组件字段分离到各个类型数组中，显著提高批量操作的缓存性能。

**API 参考:**
- [enableSoA](../api/core/ecs-framework-monorepo.enablesoa.md) - 启用 SoA 优化

### 存储选择逻辑

ComponentStorageManager 根据组件类型注释自动选择适当的存储策略。使用 @EnableSoA 装饰的组件将获得优化的基于数组的存储，而其他组件则使用标准存储。

**API 参考:**
- [ComponentStorageManager](../api/core/ecs-framework-monorepo.componentstoragemanager.md) - 组件存储管理器

## 性能优化

### 组件访问模式

存储系统提供多种针对不同用例优化的访问模式，从单个组件访问到跨越数千个实体的批量操作。

| 访问模式 | 方法 | 用例 | 性能 |
|---------|------|------|------|
| 单个访问 | getComponent(entityId) | 单实体操作 | O(1) |
| 批量迭代 | forEach(callback) | 系统处理 | 缓存友好 |
| 紧密数组 | getDenseArray() | 批操作 | 最小间接性 |
| 字段数组 | getFieldArray(fieldName) | SoA 批量操作 | SIMD 就绪 |

框架自动处理稀疏到紧密的转换以进行迭代，同时通过实体 ID 映射保持快速的单个访问。

**API 参考:**
- [ComponentStorage.getComponent()](../api/core/ecs-framework-monorepo.componentstorage.getcomponent.md) - 获取组件
- [ComponentStorage.foreach()](../api/core/ecs-framework-monorepo.componentstorage.foreach.md) - 批量迭代
- [ComponentStorage.getDenseArray()](../api/core/ecs-framework-monorepo.componentstorage.getdensearray.md) - 获取紧密数组

### 内存管理与压缩

组件存储包含内置的内存管理功能，具有自动槽位重用和手动压缩能力。系统跟踪碎片化级别并提供优化内存布局的工具。

**API 参考:**
- [ComponentStorage.getStats()](../api/core/ecs-framework-monorepo.componentstorage.getstats.md) - 获取存储统计信息

## 组件装饰器与类型安全

### ECSComponent 装饰器

框架提供了 @ECSComponent 装饰器，以确保即使在代码压缩后也能保持一致的类型命名。此装饰器对于在生产构建中可靠的组件识别至关重要。

```typescript
@ECSComponent('Position')
class PositionComponent extends Component {
    x: number = 0;
    y: number = 0;
}
```

装饰器系统使用 Symbol 键存储类型名称以避免命名冲突，并为未装饰的组件提供回退机制。

**API 参考:**
- [ECSComponent](../api/core/ecs-framework-monorepo.ecscomponent.md) - ECS组件装饰器
- [COMPONENT_TYPE_NAME](../api/core/ecs-framework-monorepo.component_type_name.md) - 组件类型名称

### 类型安全与解析

类型系统通过复杂的类型解析机制在保持运行时灵活性的同时提供编译时安全性。

**API 参考:**
- [ComponentType](../api/core/ecs-framework-monorepo.componenttype.md) - 组件类型定义
- [getComponentTypeName](../api/core/ecs-framework-monorepo.getcomponenttypename.md) - 获取组件类型名称
- [getComponentInstanceTypeName](../api/core/ecs-framework-monorepo.getcomponentinstancetypename.md) - 获取组件实例类型名称

### 压缩保护

装饰器系统专门解决 JavaScript 压缩挑战，其中类名变得不可靠。通过使用基于 Symbol 的存储和显式命名，框架在开发和生产环境中保持一致的行为。

| 环境 | 类名 | 装饰器名称 | 解析 |
|------|------|-----------|------|
| 开发环境 | PositionComponent | 'Position' | 使用装饰器 |
| 生产环境（压缩后） | a | 'Position' | 使用装饰器 |
| 未装饰 | SomeComponent | undefined | 使用类名 |

**API 参考:**
- [getComponentTypeName](../api/core/ecs-framework-monorepo.getcomponenttypename.md) - 获取组件类型名称
- [getComponentInstanceTypeName](../api/core/ecs-framework-monorepo.getcomponentinstancetypename.md) - 获取组件实例类型名称
