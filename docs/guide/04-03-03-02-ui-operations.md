# UI 操作

UI 操作为从 ViewModels 内部管理 UI 交互提供了高级、类型安全的方法。该系统作为 ViewModels 和 UIManager 之间的桥梁，提供便捷的方法来显示、隐藏和关闭 UI 元素，同时通过基于装饰器的配置保持类型安全。

有关底层 UI 管理系统的信息，请参见[UIManager 核心](04-03-03-01-uimanager-core.md)。有关 UI 配置和装饰器的详细信息，请参见[UI 配置与层](04-03-03-03-ui-configuration-layers.md)。

## 概述

UI 操作系统为 ViewModels 提供了与 UI 管理层交互的简化接口。ViewModels 可以使用 UIOperations 执行常见的 UI 任务，而不是直接调用 UIManager 方法，这些任务具有自动配置查找和类型安全功能。