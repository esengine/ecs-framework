# Changelog

本文档记录 `@esengine/ecs-framework` 核心库的版本更新历史。

---

## v2.2.20 (2025-12-04)

### Bug Fixes

- **系统 onAdded 回调修复**: 修复系统 `onAdded` 回调受注册顺序影响的问题 (#270)
  - 系统初始化时会对已存在的匹配实体触发 `onAdded` 回调
  - 新增 `matchesEntity(entity)` 方法，用于检查实体是否匹配系统的查询条件
  - Scene 新增 `notifySystemsEntityAdded/Removed` 方法，确保所有系统都能收到实体变更通知

---

## v2.2.19 (2025-12-03)

### Features

- **系统稳定排序**: 添加系统稳定排序支持 (#257)
  - 新增 `addOrder` 属性，用于 `updateOrder` 相同时的稳定排序
  - 确保相同优先级的系统按添加顺序执行

- **模块配置**: 添加 `module.json` 配置文件 (#256)
  - 定义模块 ID、名称、版本等元信息
  - 支持模块依赖声明和导出配置

---

## v2.2.18 (2025-11-30)

### Features

- **高级性能分析器**: 实现全新的性能分析 SDK (#248)
  - `ProfilerSDK`: 统一的性能分析接口
    - 手动采样标记 (`beginSample`/`endSample`)
    - 自动作用域测量 (`measure`/`measureAsync`)
    - 调用层级追踪和调用图生成
    - 计数器和仪表支持
  - `AdvancedProfilerCollector`: 高级性能数据收集器
    - 帧时间统计和历史记录
    - 内存快照和 GC 检测
    - 长任务检测 (Long Task API)
    - 性能报告生成
  - `DebugManager`: 调试管理器
    - 统一的调试工具入口
    - 性能分析器集成

- **属性装饰器增强**: 扩展 `@serialize` 装饰器功能 (#247)
  - 支持更多序列化选项配置

### Improvements

- **EntitySystem 测试覆盖**: 添加完整的系统测试用例 (#240)
  - 覆盖实体查询、缓存、生命周期等场景

- **Matcher 增强**: 优化匹配器功能 (#240)
  - 改进匹配逻辑和性能

---

## v2.2.17 (2025-11-28)

### Features

- **ComponentRegistry 增强**: 添加组件注册表新功能 (#244)
  - 支持通过名称注册和查询组件类型
  - 添加组件掩码缓存优化性能

- **序列化装饰器改进**: 增强 `@serialize` 装饰器 (#244)
  - 支持更灵活的序列化配置
  - 改进嵌套对象序列化

- **EntitySystem 生命周期**: 新增系统生命周期方法 (#244)
  - `onSceneStart()`: 场景开始时调用
  - `onSceneStop()`: 场景停止时调用

---

## v2.2.16 (2025-11-27)

### Features

- **组件生命周期**: 添加组件生命周期回调支持 (#237)
  - `onEnable()`: 组件启用时调用
  - `onDisable()`: 组件禁用时调用
  - `onDestroy()`: 组件销毁时调用

- **ServiceContainer 增强**: 改进服务容器功能 (#237)
  - 支持 `Symbol.for()` 模式的服务标识
  - 新增 `@InjectProperty` 属性注入装饰器
  - 改进服务解析和生命周期管理

- **SceneSerializer 增强**: 场景序列化器新功能 (#237)
  - 支持更多组件类型的序列化
  - 改进反序列化错误处理

- **属性装饰器扩展**: 扩展 `@serialize` 装饰器 (#238)
  - 支持 `@range`、`@slider` 等编辑器提示
  - 支持 `@dropdown`、`@color` 等 UI 类型
  - 支持 `@asset` 资源引用类型

### Improvements

- **Matcher 测试**: 添加 Matcher 匹配器测试用例 (#240)
- **EntitySystem 测试**: 添加实体系统完整测试覆盖 (#240)

---

## 版本说明

- **主版本号**: 重大不兼容更新
- **次版本号**: 新功能添加（向后兼容）
- **修订版本号**: Bug 修复和小改进

## 相关链接

- [GitHub Releases](https://github.com/esengine/ecs-framework/releases)
- [NPM Package](https://www.npmjs.com/package/@esengine/ecs-framework)
- [文档首页](./index.md)
