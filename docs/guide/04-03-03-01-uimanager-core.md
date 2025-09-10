# UIManager 核心

UIManager 是负责管理 MVVM 框架内 UI 元素完整生命周期的核心组件。它提供了加载、显示、隐藏和销毁 UI 组件的单例接口，同时维护显示状态、处理缓存并与渲染引擎协调。

本文档涵盖核心 UIManager 单例及其内部系统。有关包装 UIManager 功能的高级 UI 操作，请参见[UI 操作](04-03-03-02-ui-operations.md)。有关 UI 配置和层管理，请参见[UI 配置与层](04-03-03-03-ui-configuration-layers.md)。有关与特定渲染引擎的集成，请参见[引擎集成](04-03-03-04-engine-integration.md)。

## 架构概览

UIManager 作为集中式控制器运行，协调多个子系统来管理 UI 组件的整个生命周期。