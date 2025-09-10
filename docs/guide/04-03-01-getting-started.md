# 快速开始

本指南涵盖了 MVVM UI 框架的基本安装、设置和初始使用。它演示了如何安装框架、在项目中初始化、创建第一个 ViewModel 并建立基本的数据绑定。有关高级配置和自定义选项，请参见[高级特性](04-03-04-advanced-features.md)。有关完整的 API 文档，请参见[API 参考](04-03-05-api-reference.md)。

## 安装

该框架作为 NPM 包分发，可以使用任何标准包管理器安装：

```bash
npm install @esengine/mvvm-ui-framework
```

该框架需要 reflect-metadata 作为对等依赖项，会自动安装。这启用了基于装饰器的功能，为响应式系统提供动力。

## 先决条件

在使用框架之前，确保你的项目已配置为支持装饰器的 TypeScript：

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

在主应用程序文件顶部导入 reflect-metadata：

```typescript
import 'reflect-metadata';
```

## 基本框架初始化

### 框架组件概览

框架由几个核心系统组成，它们协同工作提供 MVVM 功能：

### 初始化框架

在应用程序启动早期调用 initializeUIFramework()：

```typescript
import { initializeUIFramework } from '@esengine/mvvm-ui-framework';

// 基本初始化
initializeUIFramework({
    debug: true
});
```

UIFrameworkOptions 接口支持多个配置选项：

| 选项 | 类型 | 描述 |
|------|------|------|
| debug | boolean | 启用调试日志 |
| defaultLoader | any | 为 UIManager 设置默认 UI 加载器 |
| defaultAnimation | any | 配置默认动画设置 |

## 创建你的第一个 ViewModel

ViewModels 是该框架中 MVVM 模式的基础。基本 ViewModel 系统的工作原理如下：

### ViewModel 创建流程基本 ViewModel 示例

通过继承基本 ViewModel 类并使用装饰器创建 ViewModel：

```typescript
import { ViewModel, observable, computed, command } from '@esengine/mvvm-ui-framework';

class UserProfileViewModel extends ViewModel {
    @observable
    public firstName: string = '';
    
    @observable  
    public lastName: string = '';
    
    @computed
    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }
    
    @command
    public updateProfile(): void {
        // 命令逻辑在这里
        console.log('配置文件已更新');
    }
}
```

装饰器自动使属性可观察并启用变更通知。有关装饰器系统的详细信息，请参见[装饰器](04-03-02-04-decorators.md)。

## 基本数据绑定

框架提供了多种方法来实现 ViewModel 和 UI 元素之间的数据绑定：

### 数据绑定方法

| 方法 | 描述 | 使用场景 |
|------|------|----------|
| bind() | 传统绑定方法 | 基本属性同步 |
| bindSafe() | 具有编译时检查的类型安全绑定 | TypeScript 项目的首选 |
| Fluent API | 基于链式的绑定配置 | 复杂绑定场景 |
| 快速方法 | oneWay(), twoWay(), format() | 简单、常见的绑定模式 |

### 简单绑定示例

```typescript
import { DataBinding } from '@esengine/mvvm-ui-framework';

// 获取 DataBinding 单例实例
const dataBinding = DataBinding.getInstance();

// 从 ViewModel 到 UI 的基本单向绑定
dataBinding.bind(viewModel, 'firstName', inputElement, 'value');

// 具有自动更新的双向绑定
dataBinding.bind(viewModel, 'firstName', inputElement, 'value', 'TWO_WAY');
```

有关全面的数据绑定文档，请参见[数据绑定](04-03-02-02-data-binding.md)。

## UI 管理基础

UIManager 处理 UI 生命周期、显示层和组件管理：

### UI 系统架构基本 UI 管理

通过单例实例访问 UI 系统：

```typescript
import { UIManager, uiManager } from '@esengine/mvvm-ui-framework';

// 使用单例实例
const manager = uiManager;

// 或显式获取实例
const managerInstance = UIManager.getInstance();

// 为你的引擎设置自定义 UI 加载器
manager.setLoader(yourCustomLoader);
```

有关详细的 UI 管理文档，请参见[UI 管理系统](04-03-03-ui-management-system.md)。

## 框架信息

你可以查询框架功能和版本信息：

```typescript
import { getUIFrameworkInfo, VERSION } from '@esengine/mvvm-ui-framework';

console.log(`框架版本: ${VERSION}`);

const info = getUIFrameworkInfo();
console.log('可用功能:', info.features);
// 输出: 可用功能: ['MVVM数据绑定', 'UI生命周期管理', ...]
```

框架提供以下核心功能：

- MVVM 数据绑定
- UI 生命周期管理
- 命令模式支持
- 可观察对象
- 值转换器
- 事件系统
- 缓存管理
- 动画支持
- 装饰器支持

## 下一步

现在你已经安装并初始化了框架，可以探索以下领域：

- **ViewModel 系统** - 了解高级 ViewModel 功能和状态管理
- **数据绑定** - 掌握类型安全绑定和值转换器
- **命令系统** - 使用命令实现用户交互
- **UI 管理** - 理解 UI 生命周期和层管理
- **类型安全** - 利用 TypeScript 进行编译时绑定验证

有关更多高级功能，请参见[高级特性](04-03-04-advanced-features.md)和[API 参考](04-03-05-api-reference.md)。