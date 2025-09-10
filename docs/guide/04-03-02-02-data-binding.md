# 数据绑定

本文档涵盖了在 MVVM UI 框架中连接 ViewModels 和 UI 元素的数据绑定系统。数据绑定实现了 ViewModels 中的可观察属性与其对应 UI 表示之间的自动同步，支持单向、双向和一次性绑定场景，可选的值转换和格式化。

有关提供数据绑定中使用的可观察属性的 ViewModel 系统信息，请参见[ViewModel 系统](04-03-02-01-viewmodel-system.md)。有关用于处理用户交互的命令系统详细信息，请参见[命令系统](04-03-02-03-command-system.md)。

## 核心绑定概念

数据绑定系统基于几个基本概念运行，这些概念定义了数据在 ViewModels 和 UI 元素之间的流动方式。

### 绑定类型

系统支持 BindingType 枚举中定义的四种主要绑定类型：

| 类型 | 描述 | 使用场景 |
|------|------|----------|
| ONE_WAY | 数据仅从 ViewModel 流向 UI | 显示用户不直接修改的数据 |
| TWO_WAY | 数据在 ViewModel 和 UI 之间双向流动 | 表单输入、可编辑字段 |
| ONE_TIME | 数据在初始化期间绑定一次 | 永远不会改变的静态数据 |
| EVENT | 基于事件的用户交互绑定 | 按钮点击、表单提交 |

### 绑定模式

绑定模式控制值如何应用到目标属性：

| 模式 | 行为 | 示例 |
|------|------|------|
| REPLACE | 覆写目标属性值 | 设置 textContent = "新值" |
| APPEND | 添加到现有目标值 | 追加到字符串或数组 |
| FORMAT | 对值应用格式化模板 | 使用格式字符串如 "姓名: {0}" |

### 绑定表达式

绑定表达式定义源属性路径和可选的转换。系统支持：

- 简单属性路径：`"firstName"`
- 嵌套属性路径：`"user.profile.name"`
- 值转换器：`"isActive | bool"`
- 转换器参数：`"date | date:yyyy-MM-dd"`
- 格式字符串：`"name | format:'Hello {0}'"`

## 数据绑定系统架构

以下显示了数据绑定系统的整体架构：

## 基本绑定操作

### 创建绑定

DataBinding 类提供了创建和管理绑定的主要接口。核心 bind 方法接受源对象、目标对象和配置：

```typescript
// 基本单向绑定
const bindingId = dataBinding.bind(viewModel, uiElement, {
    type: BindingType.ONE_WAY,
    mode: BindingMode.REPLACE,
    source: 'firstName',
    target: 'textContent'
});
```

### 绑定配置

BindingConfig 接口定义了所有绑定选项：

- **type**：指定绑定方向
- **mode**：控制值的应用方式
- **source**：源属性表达式
- **target**：目标属性名称
- **converter**：可选的值转换器名称
- **converterParams**：转换器的参数
- **format**：FORMAT 模式的格式字符串
- **enabled**：绑定是否激活

### 绑定生命周期

每个绑定创建一个 BindingInstance 来跟踪：

- 唯一绑定 ID
- 配置和解析的表达式
- 目标对象和属性引用
- 源变更的观察者
- 活动状态和创建时间戳

## 内置转换器

系统为常见场景包含了多个内置转换器：

| 转换器 | 用途 | 转换示例 | 反向转换示例 |
|--------|------|----------|-------------|
| bool | 布尔值到字符串转换 | true → "true" | "true" → true |
| number | 数字到字符串转换 | 42 → "42" | "42" → 42 |
| string | 显式字符串转换 | 123 → "123" | "123" → "123" |
| date | 日期格式化 | Date → "2023-01-01" | "2023-01-01" → Date |
| visibility | 布尔值到 CSS 可见性 | true → "visible" | "visible" → true |
| not | 布尔值反转 | true → "false" | "false" → true |

### 自定义转换器

自定义转换器实现 IValueConverter 接口：

```typescript
interface IValueConverter {
    convert(value: any, params?: any[]): any;
    convertBack?(value: any, params?: any[]): any;
}
```

## 类型安全绑定

框架通过 TypeScript 泛型和专用绑定方法提供编译时类型安全。

### 类型安全绑定方法

bindSafe 方法强制源属性和目标属性之间的类型兼容性：

```typescript
dataBinding.bindSafe(viewModel, uiElement, {
    type: BindingType.ONE_WAY,
    mode: BindingMode.REPLACE,
    source: 'firstName', // 必须是有效的可观察属性
    target: 'textContent' // 必须是目标的可写属性
});
```

## 流式绑定 API

流式 API 提供了基于链式调用的绑定创建方法：

### 用法示例

```typescript
const result = dataBinding
    .from(viewModel)
    .property('firstName')
    .to(element, 'textContent')
    .withConverter('string')
    .bind({
        type: BindingType.ONE_WAY,
        mode: BindingMode.REPLACE
    });
```

## 快速绑定方法

QuickBinding 类为常见绑定场景提供了便捷方法：

| 方法 | 用途 | 示例 |
|------|------|------|
| oneWay | 创建单向绑定 | quick.oneWay(vm, 'prop', el, 'target') |
| twoWay | 创建双向绑定 | quick.twoWay(vm, 'prop', el, 'target') |
| oneTime | 创建一次性绑定 | quick.oneTime(vm, 'prop', el, 'target') |
| format | 创建格式化绑定 | quick.format(vm, 'prop', el, 'target', 'fmt') |

## 批量绑定管理

BatchBindingManager 支持多个绑定的高效管理：

```typescript
const batch = dataBinding.createBatchManager();
batch
    .add(dataBinding.quick.oneWay(vm, 'name', el1, 'textContent'))
    .add(dataBinding.quick.oneWay(vm, 'age', el2, 'textContent'))
    .unbindAll(); // 移除批次中的所有绑定
```

## 绑定管理操作

DataBinding 类提供全面的绑定生命周期管理：

### 绑定检索

| 方法 | 用途 | 返回类型 |
|------|------|----------|
| getBinding(id) | 获取特定绑定实例 | BindingInstance |
| getAllBindings() | 获取所有活动绑定 | BindingInstance[] |

### 绑定控制

| 方法 | 用途 | 参数 |
|------|------|------|
| unbind(id) | 移除特定绑定 | bindingId: string |
| unbindAll() | 移除所有绑定 | 无 |
| setBindingEnabled(id, enabled) | 启用/禁用绑定 | bindingId: string, enabled: boolean |
| updateBinding(id, source) | 手动更新绑定 | bindingId: string, sourceObject: IObservable |

### 错误处理

绑定系统包含针对以下情况的健壮错误处理：

- 无效的源/目标对象
- 缺失的属性
- 转换器异常
- 循环更新检测
- 目标更新失败

## 性能考虑

### 循环更新预防

系统通过 _updatingBindings 集合防止无限更新循环，该集合在双向同步期间跟踪当前正在更新的绑定。

### 观察者管理

绑定创建的观察者在解绑时自动移除，以防止内存泄漏。系统在每个 BindingInstance 中维护观察者引用。

### 高效表达式解析

绑定表达式在绑定创建期间解析一次，并缓存在 BindingExpression 结构中，以在更新期间获得最佳性能。

### 内存管理

正确的绑定清理至关重要：

- 对单个绑定调用 `unbind()`
- 在销毁组件时调用 `unbindAll()`
- 使用 BatchBindingManager 进行高效的批量操作