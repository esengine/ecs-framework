# MVVM UI 框架

本文档涵盖了在 ECS 框架的 Cocos Creator 生态系统中的模型-视图-视图模型（MVVM）模式集成。MVVM UI 框架为 UI 组件提供声明式数据绑定功能，通过在表示逻辑和 UI 元素之间实现清晰的关注点分离，实现响应式用户界面。

有关更广泛的 Cocos Creator 集成信息，请参见[Cocos Creator 集成](04-01-cocos-creator-integration.md)。有关核心 ECS 架构的详细信息，请参见[框架架构](01-01-architecture-overview.md)。

## 架构概览

MVVM UI 框架作为 ECS 框架数据模型和 Cocos Creator UI 系统之间的桥梁，实现了用于响应式 UI 开发的模型-视图-视图模型模式。

### MVVM 框架集成架构

框架由三个主要层组成：ECS 数据层、MVVM 绑定层和 Cocos Creator 表示层。数据从 ECS 实体通过 ViewModels 响应式地流向 UI 组件。

## 数据绑定系统

MVVM 框架实现了一个响应式数据绑定系统，通过声明式绑定将 ViewModel 属性连接到 UI 元素。

### 响应式数据流

MVVM 框架实现了响应式数据流模式，自动将 ViewModel 的变化传播到 UI 元素。

#### 响应式数据流序列

绑定引擎自动将 ViewModel 属性变化同步到 UI 元素，而用户交互触发可以更新数据模型的 ViewModel 方法。

### View 组件架构

框架在 Cocos Creator 场景层级结构中为 View 组件建立了清晰的结构，与 ECS Manager 集成。

#### 场景集成架构

View 组件作为场景层级结构中的独立节点存在，与 ECS Manager 和 Canvas 系统协同运行。每个 View 组件维护对其绑定 UI 元素的引用。