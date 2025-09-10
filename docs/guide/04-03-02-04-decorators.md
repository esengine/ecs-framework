# 装饰器

本文档涵盖了装饰器系统，该系统为 ViewModels 增强响应式功能、自动命令创建和属性管理。装饰器提供了一种声明式方式，为您的 ViewModels 添加可观察属性、计算值、验证和其他 MVVM 功能。

有关装饰器增强的底层 ViewModel 系统信息，请参见[ViewModel 系统](04-03-02-01-viewmodel-system.md)。有关 @command 装饰器创建的命令对象详细信息，请参见[命令系统](04-03-02-03-command-system.md)。

## 装饰器系统架构

装饰器系统使用 TypeScript 装饰器和反射元数据自动为 ViewModels 增强 MVVM 功能。该系统围绕元数据存储和 ViewModel 构造期间的自动初始化构建。