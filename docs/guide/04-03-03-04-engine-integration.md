# 引擎集成

本文档涵盖了框架的引擎集成系统，该系统使 MVVM UI 框架能够通过可插拔接口架构与不同的 UI 渲染引擎（如 Cocos Creator、FairyGUI 等）协同工作。

有关配置 UI 元素和显示层的信息，请参见[UI 配置与层](04-03-03-03-ui-configuration-layers.md)。有关核心 UIManager 功能的详细信息，请参见[UIManager 核心](04-03-03-01-uimanager-core.md)。

## 集成架构

框架使用两个关键接口来抽象引擎特定的操作：IUILoader 用于资源加载，IUIRenderer 用于 UI 渲染和操作。这种设计允许相同的 MVVM 逻辑在不同的 UI 引擎上运行。

## 核心集成组件

## IUILoader 接口

IUILoader 接口处理引擎特定的资源加载操作。它抽象了各种引擎在加载、缓存和卸载 UI 资源方面的差异。