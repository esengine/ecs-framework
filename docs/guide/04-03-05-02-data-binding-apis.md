# Data Binding APIs

本文档为 MVVM UI 框架中的数据绑定系统提供全面的 API 参考。它涵盖了核心 DataBinding 类、配置接口、类型安全绑定 API、流畅绑定构建器、值转换器和绑定管理工具。

有关数据绑定模式的概念信息和使用示例，请参见[数据绑定](04-03-02-02-data-binding.md)。有关提供可观察属性的底层 ViewModel 系统信息，请参见[ViewModel 系统](04-03-02-01-viewmodel-system.md)。

## 核心 DataBinding 类

DataBinding 类是管理框架中所有绑定操作的中央单例。它提供了创建、管理和销毁数据绑定的主要 API。