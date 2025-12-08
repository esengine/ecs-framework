# Changelog

本文档记录 `@esengine/ecs-framework` 核心库的版本更新历史。

---

## v2.3.1 (2025-12-08)

### Features

- **微信小游戏 Worker 支持**: 添加对微信小游戏平台 Worker 的完整支持 (#297)
  - 新增 `workerScriptPath` 配置项，支持预编译 Worker 脚本路径
  - 修复微信小游戏 Worker 消息格式差异（`res` 直接是数据，无需 `.data`）
  - 适用于微信小游戏等不支持动态脚本的平台

### New Package

- **@esengine/worker-generator**: CLI 工具，从 `WorkerEntitySystem` 子类自动生成 Worker 文件
  - 自动扫描并提取 `workerProcess` 方法体
  - 支持 `--wechat` 模式，自动转换 ES6+ 为 ES5 语法
  - 读取代码中的 `workerScriptPath` 配置，生成到指定路径
  - 生成 `worker-mapping.json` 映射文件

### Documentation

- 更新 Worker 系统文档，添加微信小游戏支持章节
- 新增英文版 Worker 系统文档 (`docs/en/guide/worker-system.md`)

---

## v2.3.0 (2025-12-06) ⚠️ DEPRECATED

> **警告**: 此版本存在类型导出问题，请升级到 v2.3.1 或更高版本。
>
> **Warning**: This version has type export issues. Please upgrade to v2.3.1 or later.

### Features

- **持久化实体**: 添加实体跨场景迁移支持 (#285)
  - 新增 `EEntityLifecyclePolicy` 枚举（`SceneLocal`/`Persistent`）
  - Entity 添加 `setPersistent()`、`setSceneLocal()`、`isPersistent` API
  - Scene 添加 `findPersistentEntities()`、`extractPersistentEntities()`、`receiveMigratedEntities()`
  - `SceneManager.setScene()` 自动处理持久化实体迁移
  - 适用场景：全局管理器、玩家角色、跨场景状态保持

- **CommandBuffer 延迟命令系统**: 在帧末统一执行实体操作 (#281)
  - 支持延迟添加/移除组件、销毁实体、设置实体激活状态
  - 每个系统拥有独立的 `commands` 属性
  - 避免在迭代过程中修改实体列表，防止迭代问题
  - Scene 在 `lateUpdate` 后自动刷新所有命令缓冲区

### Performance

- **ReactiveQuery 快照优化**: 优化实体查询迭代性能 (#281)
  - 添加快照机制，避免每帧拷贝数组
  - 只在实体列表变化时创建新快照
  - 静态场景下多个系统共享同一快照

---

## v2.2.21 (2025-12-05)

### Bug Fixes

- **迭代安全修复**: 修复 `process`/`lateProcess` 迭代时组件变化导致跳过实体的问题 (#272)
  - 在系统处理过程中添加/移除组件不再导致实体被意外跳过

### Performance

- **HierarchySystem 性能优化**: 优化层级系统避免每帧遍历所有实体 (#279)
  - 使用脏实体集合代替每帧遍历所有实体
  - 静态场景下 `process()` 从 O(n) 优化为 O(1)
  - 1000 实体静态场景: 81.79μs → 0.07μs (快 1168 倍)
  - 10000 实体静态场景: 939.43μs → 0.56μs (快 1677 倍)
  - 服务端模拟 (100房间 x 100实体): 2.7ms → 1.4ms 每 tick

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
  - `onDeserialized()`: 组件从场景文件加载或快照恢复后调用，用于恢复运行时数据

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
