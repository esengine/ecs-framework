# MVVM UI 框架

本文档提供了 MVVM UI 框架的全面概览，涵盖了其架构、核心组件和集成模式。该框架实现了完整的模型-视图-视图模型模式，支持 TypeScript，实现响应式 UI 开发，包括自动数据绑定、命令处理和 UI 生命周期管理。

有关详细实施指南，请参见[快速开始](04-03-01-getting-started.md)。有关特定 API 文档，请参见[API 参考](04-03-05-api-reference.md)。有关 UI 管理具体信息，请参见[UI 管理系统](04-03-03-ui-management-system.md)。

## 目的与范围

MVVM UI 框架是一个轻量级、高性能的数据管理框架，设计用于与任何 UI 库协同工作。它提供了完整的 MVVM 架构，包括装饰器、数据绑定、命令模式和 UI 管理功能。该框架与引擎无关，可以通过适配器接口与 Cocos Creator、FairyGUI 和其他 UI 系统集成。

### 核心功能

- ViewModel 和 UI 元素之间的响应式数据绑定
- 完整 TypeScript 支持的类型安全操作
- 支持异步的命令模式实现
- 全面的 UI 生命周期管理
- 可扩展的值转换系统
- 性能优化的观察者模式

## 核心框架组件

### ViewModel 系统

ViewModel 类作为 MVVM 模式的基础，提供可观察属性、计算值和命令执行功能。

#### 关键类

- **ViewModel** - 所有 ViewModel 的基类
- **Observable** - 实现 IObservable 接口的响应式属性
- **装饰器**：@viewModel、@observable、@computed、@command

#### ViewModel 结构示例

```typescript
@viewModel
class UserViewModel extends ViewModel {
    @observable
    public firstName: string = '';
    
    @computed(['firstName', 'lastName'])
    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }
    
    @command()
    public save(): void {
        // 命令实现
    }
}
```

### 数据绑定系统

数据绑定引擎提供了多种 API，用于将 ViewModel 连接到 UI 元素，具备类型安全和自动更新功能。

#### 核心绑定 API

- **DataBinding.bind()** - 传统的基于字符串的绑定
- **DataBinding.bindSafe()** - 具有编译时检查的类型安全绑定
- **FluentBindingBuilder** - 用于复杂绑定的链式 API
- **QuickBinding** - 一行绑定方法
- **BatchBindingManager** - 批量绑定操作

### 命令系统

命令系统为用户交互和业务逻辑提供结构化处理，支持参数、异步操作和执行条件。

#### 命令类型

- 基础命令（`@command()`）
- 参数化命令（`@command({ parameterized: true })`）
- 异步命令（`@command({ async: true })`）
- 带有 canExecuteMethod 的条件命令

#### 命令执行

```typescript
viewModel.executeCommand('commandName', ...args);
viewModel.canExecuteCommand('commandName');
```

## UI 管理架构

### UIManager 和 UI 操作

#### 关键组件

- **UIManager** - 管理 UI 生命周期的单例
- **UIOperations** - UI 操作的类型安全静态方法
- **@ui 装饰器** - 配置 ViewModel-UI 关联
- **@uiComponent 装饰器** - 将 UI 组件链接到 ViewModel
- **IUILoader 和 IUIRenderer** - 引擎集成接口

### UI 组件集成

框架通过装饰器提供自动的 ViewModel-UI 组件关联：

#### ViewModel 定义

```typescript
@ui({
    name: 'ChatUI',
    path: 'prefabs/ui/chat/Chat',
    modal: false,
    cacheable: true,
    layer: DEFAULT_UI_LAYERS.MAIN
})
export class ChatViewModel extends ViewModel {
    // ViewModel 实现
}
```

#### UI 组件定义

```typescript
@uiComponent(ChatViewModel)
export class ChatUI extends Component {
    private _viewModel: ChatViewModel | null = null;
    
    protected onLoad(): void {
        this._viewModel = getCurrentViewModel<ChatViewModel>(this);
    }
}
```

## 集成与扩展性

### 引擎集成模式

框架使用适配器接口来支持多个 UI 引擎：

#### 集成步骤

1. 实现 IUILoader 用于资源加载
2. 实现 IUIRenderer 用于 UI 渲染操作
3. 使用 UIManager.setLoader() 和 UIManager.setRenderer() 注册适配器
4. 正常使用框架 API 处理引擎特定的 UI 对象

### 框架初始化

框架提供了集中的初始化系统：

#### 基本初始化

```typescript
import { initializeUIFramework, UIManager } from '@esengine/mvvm-ui-framework';

initializeUIFramework({
    debug: true,
    defaultLoader: new CustomUILoader()
});
```

#### 手动设置

```typescript
const uiManager = UIManager.getInstance();
uiManager.setLoader(new CustomUILoader());
uiManager.setRenderer(new CustomUIRenderer());
```

## 关键特性总结

| 特性 | 实现方式 | 关键类 |
|------|----------|--------|
| 响应式数据绑定 | 基于装饰器的观察者模式 | Observable, DataBinding, @observable |
| 类型安全 | TypeScript 泛型和接口 | TypeSafeBinding, FluentBindingBuilder |
| 命令模式 | 基于装饰器的命令系统 | ICommand, @command |
| UI 生命周期 | 带事件的状态机 | UIManager, UIInstance |
| 值转换 | 基于注册表的转换器系统 | ConverterRegistry, IValueConverter |
| 引擎集成 | 适配器模式接口 | IUILoader, IUIRenderer |
| 性能优化 | 缓存和批处理系统 | BatchBindingManager, UI 缓存 |

框架的模块化架构允许开发者独立使用各个组件或作为完整的 MVVM 解决方案，完整的 TypeScript 支持确保编译时安全性和出色的开发体验。