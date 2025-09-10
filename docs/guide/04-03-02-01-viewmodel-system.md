# ViewModel 系统

ViewModel 系统为实现模型-视图-视图模型（MVVM）模式提供了基础类和装饰器。该系统通过 ViewModel 基类和相关装饰器实现响应式数据绑定、命令处理、验证和状态管理。

本页涵盖核心 ViewModel 实现、可观察属性、计算属性和状态管理功能。有关 ViewModel 和 UI 元素之间的数据绑定信息，请参见[数据绑定](04-03-02-02-data-binding.md)。有关详细的命令系统功能，请参见[命令系统](04-03-02-03-command-system.md)。有关全面的装饰器用法，请参见[装饰器](04-03-02-04-decorators.md)。

## ViewModel 类架构

ViewModel 类作为框架中所有 ViewModel 的基类，继承了 Observable 以提供响应式功能，同时具备命令管理、验证和状态跟踪能力。

## 可观察属性

可观察属性是 ViewModel 中响应式数据绑定的基础。它们在值发生变化时自动通知观察者，并与验证和脏状态跟踪系统集成。

@observable 装饰器将常规属性转换为参与 MVVM 数据绑定系统的响应式属性：

| 功能 | 实现方式 | 位置 |
|------|----------|------|
| 属性定义 | 使用 Object.defineProperty 的 getter/setter | src/core/Decorators.ts:24-62 |
| 值存储 | 私有键模式：_${propertyKey} | src/core/Decorators.ts:16 |
| 变更检测 | 在通知前比较新旧值 | src/core/Decorators.ts:30 |
| 验证集成 | 调用 setProperty 方法进行验证 | src/core/Decorators.ts:32-46 |
| 观察者通知 | 在值变更时调用 notifyObservers | src/core/Decorators.ts:52-54 |

## 计算属性

计算属性从其他可观察属性派生其值，并在依赖项发生变化时自动重新计算。它们包含缓存机制以优化性能。

### 计算属性系统

| 组件 | 用途 | 实现方式 |
|------|------|----------|
| 依赖数组 | 指定哪些属性触发重新计算 | src/core/Decorators.ts:69 |
| 缓存存储 | 存储计算值：_computed_${propertyKey} | src/core/Decorators.ts:81-82 |
| 有效性标志 | 跟踪缓存有效性：_computed_valid_${propertyKey} | src/core/Decorators.ts:82 |
| 失效逻辑 | 在依赖项变化时使缓存失效 | src/core/Decorators.ts:421-433 |
| 元数据存储 | 使用 Reflect 存储计算属性元数据 | src/core/Decorators.ts:77-84 |

## 状态管理

ViewModels 通过验证、脏状态跟踪和生命周期管理功能提供全面的状态管理。

### 验证系统

验证系统与可观察属性集成，提供实时验证反馈：

| 功能 | 描述 | 实现方式 |
|------|------|----------|
| 属性验证 | 使用 @validate 装饰器的单个属性验证 | src/core/ViewModel.ts:358-381 |
| 批量验证 | 使用 validateAll() 验证所有属性 | src/core/ViewModel.ts:385-403 |
| 错误存储 | 验证错误存储在 _validationErrors Map 中 | src/core/ViewModel.ts:74 |
| 验证状态 | isValid、hasValidationErrors、isValidating 属性 | src/core/ViewModel.ts:422-438 |
| 集成 | 在属性变更时自动运行验证 | src/core/ViewModel.ts:478-490 |

### 脏状态跟踪

脏状态跟踪监控 ViewModel 自初始化或上次清洁状态以来是否已被修改：

| 方法 | 用途 | 行为 |
|------|------|------|
| markAsDirty() | 标记 ViewModel 为已修改 | 设置 _isDirty = true，通知观察者 |
| markAsClean() | 标记 ViewModel 为未修改 | 设置 _isDirty = false，通知观察者 |
| isDirty getter | 检查 ViewModel 是否有变更 | 返回当前脏状态 |
| 自动跟踪 | 自动脏状态标记 | 在 setProperty() 调用时触发 |

## ViewModel 生命周期

ViewModels 遵循从创建到销毁的结构化生命周期，具有初始化和清理的钩子。

### 生命周期方法

| 阶段 | 方法 | 用途 |
|------|------|------|
| 创建 | constructor(), onInitialize() | 初始化 ViewModel 状态并调用子类设置 |
| 装饰器设置 | DecoratorUtils.initializeDecorators() | 将装饰器功能应用到实例 |
| 活跃使用 | 属性访问、命令执行 | 带有响应式更新的正常操作 |
| 清理 | destroy() | 清除命令、验证错误、观察者 |

## 与装饰器的集成

ViewModel 系统与装饰器系统密切协作，提供声明式的属性和方法增强。

### 装饰器集成流程

@viewModel 装饰器作为入口点，确保所有其他装饰器都正确初始化：

```typescript
// 测试文件中的用法示例
@viewModel
class TestViewModel extends ViewModel {
    @observable
    public firstName: string = '';
    
    @computed(['firstName', 'lastName'])
    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }
    
    @command()
    public simpleCommand(): void {
        this.age = 25;
    }
}
```

## 类型安全特性

ViewModel 系统为命令执行和属性访问提供了广泛的 TypeScript 类型安全。

### 类型安全的命令执行

类型系统通过以下方式确保命令执行的编译时安全：

| 类型特性 | 用途 | 实现方式 |
|----------|------|----------|
| 方法过滤 | 只允许实际的命令方法 | FilteredCommandMethods&lt;T&gt; 类型 |
| 参数提取 | 推断正确的参数类型 | CommandParameters&lt;T, K&gt; 类型 |
| 返回类型安全 | 保持方法返回类型 | CommandReturnType&lt;T, K&gt; 类型 |
| 重载方法 | 支持参数化和非参数化命令 | 多个 executeCommand 签名 |