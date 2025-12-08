# 插件系统

插件系统允许你以模块化的方式扩展 ECS Framework 的功能。通过插件，你可以封装特定功能（如网络同步、物理引擎、调试工具等），并在多个项目中复用。

## 概述

### 什么是插件

插件是实现了 `IPlugin` 接口的类，可以在运行时动态安装到框架中。插件可以：

- 注册自定义服务到服务容器
- 添加系统到场景
- 注册自定义组件
- 扩展框架功能

### 插件的优势

- **模块化**: 将功能封装为独立模块，提高代码可维护性
- **可复用**: 同一个插件可以在多个项目中使用
- **解耦**: 核心框架与扩展功能分离
- **热插拔**: 运行时动态安装和卸载插件

## 快速开始

### 创建第一个插件

创建一个简单的调试插件：

```typescript
import { IPlugin, Core, ServiceContainer } from '@esengine/ecs-framework';

class DebugPlugin implements IPlugin {
    readonly name = 'debug-plugin';
    readonly version = '1.0.0';

    install(core: Core, services: ServiceContainer): void {
        console.log('Debug plugin installed');

        // 可以在这里注册服务、添加系统等
    }

    uninstall(): void {
        console.log('Debug plugin uninstalled');
        // 清理资源
    }
}
```

### 安装插件

使用 `Core.installPlugin()` 安装插件：

```typescript
import { Core } from '@esengine/ecs-framework';

// 初始化Core
Core.create({ debug: true });

// 安装插件
await Core.installPlugin(new DebugPlugin());

// 检查插件是否已安装
if (Core.isPluginInstalled('debug-plugin')) {
    console.log('Debug plugin is running');
}
```

### 卸载插件

```typescript
// 卸载插件
await Core.uninstallPlugin('debug-plugin');
```

### 获取插件实例

```typescript
// 获取已安装的插件
const plugin = Core.getPlugin('debug-plugin');
if (plugin) {
    console.log(`Plugin version: ${plugin.version}`);
}
```

## 插件开发

### IPlugin 接口

所有插件必须实现 `IPlugin` 接口：

```typescript
export interface IPlugin {
    // 插件唯一名称
    readonly name: string;

    // 插件版本（建议遵循semver规范）
    readonly version: string;

    // 依赖的其他插件（可选）
    readonly dependencies?: readonly string[];

    // 安装插件时调用
    install(core: Core, services: ServiceContainer): void | Promise<void>;

    // 卸载插件时调用
    uninstall(): void | Promise<void>;
}
```

### 插件生命周期

#### install 方法

在插件安装时调用，用于初始化插件：

```typescript
class MyPlugin implements IPlugin {
    readonly name = 'my-plugin';
    readonly version = '1.0.0';

    install(core: Core, services: ServiceContainer): void {
        // 1. 注册服务
        services.registerSingleton(MyService);

        // 2. 访问当前场景
        const scene = core.scene;
        if (scene) {
            // 3. 添加系统
            scene.addSystem(new MySystem());
        }

        // 4. 其他初始化逻辑
        console.log('Plugin initialized');
    }

    uninstall(): void {
        // 清理逻辑
    }
}
```

#### uninstall 方法

在插件卸载时调用，用于清理资源：

```typescript
class MyPlugin implements IPlugin {
    readonly name = 'my-plugin';
    readonly version = '1.0.0';
    private myService?: MyService;

    install(core: Core, services: ServiceContainer): void {
        this.myService = new MyService();
        services.registerInstance(MyService, this.myService);
    }

    uninstall(): void {
        // 清理服务
        if (this.myService) {
            this.myService.dispose();
            this.myService = undefined;
        }

        // 移除事件监听器
        // 释放其他资源
    }
}
```

### 异步插件

插件的 `install` 和 `uninstall` 方法都支持异步：

```typescript
class AsyncPlugin implements IPlugin {
    readonly name = 'async-plugin';
    readonly version = '1.0.0';

    async install(core: Core, services: ServiceContainer): Promise<void> {
        // 异步加载资源
        const config = await fetch('/plugin-config.json').then(r => r.json());

        // 使用加载的配置初始化服务
        const service = new MyService(config);
        services.registerInstance(MyService, service);
    }

    async uninstall(): Promise<void> {
        // 异步清理
        await this.saveState();
    }

    private async saveState() {
        // 保存插件状态
    }
}

// 使用
await Core.installPlugin(new AsyncPlugin());
```

### 注册服务

插件可以向服务容器注册自己的服务：

```typescript
import { IService } from '@esengine/ecs-framework';

class NetworkService implements IService {
    connect(url: string) {
        console.log(`Connecting to ${url}`);
    }

    dispose(): void {
        console.log('Network service disposed');
    }
}

class NetworkPlugin implements IPlugin {
    readonly name = 'network-plugin';
    readonly version = '1.0.0';

    install(core: Core, services: ServiceContainer): void {
        // 注册网络服务
        services.registerSingleton(NetworkService);

        // 解析并使用服务
        const network = services.resolve(NetworkService);
        network.connect('ws://localhost:8080');
    }

    uninstall(): void {
        // 服务容器会自动调用服务的dispose方法
    }
}
```

### 添加系统

插件可以向场景添加自定义系统：

```typescript
import { EntitySystem, Matcher } from '@esengine/ecs-framework';

class PhysicsSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(PhysicsBody));
    }

    protected process(entities: readonly Entity[]): void {
        // 物理模拟逻辑
    }
}

class PhysicsPlugin implements IPlugin {
    readonly name = 'physics-plugin';
    readonly version = '1.0.0';
    private physicsSystem?: PhysicsSystem;

    install(core: Core, services: ServiceContainer): void {
        const scene = core.scene;
        if (scene) {
            this.physicsSystem = new PhysicsSystem();
            scene.addSystem(this.physicsSystem);
        }
    }

    uninstall(): void {
        // 移除系统
        if (this.physicsSystem) {
            const scene = Core.scene;
            if (scene) {
                scene.removeSystem(this.physicsSystem);
            }
            this.physicsSystem = undefined;
        }
    }
}
```

## 依赖管理

### 声明依赖

插件可以声明对其他插件的依赖：

```typescript
class AdvancedPhysicsPlugin implements IPlugin {
    readonly name = 'advanced-physics';
    readonly version = '2.0.0';

    // 声明依赖基础物理插件
    readonly dependencies = ['physics-plugin'] as const;

    install(core: Core, services: ServiceContainer): void {
        // 可以安全地使用physics-plugin提供的服务
        const physicsService = services.resolve(PhysicsService);
        // ...
    }

    uninstall(): void {
        // 清理
    }
}
```

### 依赖检查

框架会自动检查依赖关系，如果依赖未满足会抛出错误：

```typescript
// 错误：physics-plugin 未安装
try {
    await Core.installPlugin(new AdvancedPhysicsPlugin());
} catch (error) {
    console.error(error); // Plugin advanced-physics has unmet dependencies: physics-plugin
}

// 正确：先安装依赖
await Core.installPlugin(new PhysicsPlugin());
await Core.installPlugin(new AdvancedPhysicsPlugin());
```

### 卸载顺序

框架会检查依赖关系，防止卸载被其他插件依赖的插件：

```typescript
await Core.installPlugin(new PhysicsPlugin());
await Core.installPlugin(new AdvancedPhysicsPlugin());

// 错误：physics-plugin 被 advanced-physics 依赖
try {
    await Core.uninstallPlugin('physics-plugin');
} catch (error) {
    console.error(error); // Cannot uninstall plugin physics-plugin: it is required by advanced-physics
}

// 正确：先卸载依赖它的插件
await Core.uninstallPlugin('advanced-physics');
await Core.uninstallPlugin('physics-plugin');
```

## 插件管理

### 通过 Core 管理

Core 类提供了便捷的插件管理方法：

```typescript
// 安装插件
await Core.installPlugin(myPlugin);

// 卸载插件
await Core.uninstallPlugin('plugin-name');

// 检查插件是否已安装
if (Core.isPluginInstalled('plugin-name')) {
    // ...
}

// 获取插件实例
const plugin = Core.getPlugin('plugin-name');
```

### 通过 PluginManager 管理

也可以直接使用 PluginManager 服务：

```typescript
const pluginManager = Core.services.resolve(PluginManager);

// 获取所有插件
const allPlugins = pluginManager.getAllPlugins();
console.log(`Total plugins: ${allPlugins.length}`);

// 获取插件元数据
const metadata = pluginManager.getMetadata('my-plugin');
if (metadata) {
    console.log(`State: ${metadata.state}`);
    console.log(`Installed at: ${new Date(metadata.installedAt!)}`);
}

// 获取所有插件元数据
const allMetadata = pluginManager.getAllMetadata();
for (const meta of allMetadata) {
    console.log(`${meta.name} v${meta.version} - ${meta.state}`);
}
```

## 实用插件示例

### 网络同步插件

```typescript
import { IPlugin, IService, Core, ServiceContainer } from '@esengine/ecs-framework';

class NetworkSyncService implements IService {
    private ws?: WebSocket;

    connect(url: string) {
        this.ws = new WebSocket(url);
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
    }

    private handleMessage(data: any) {
        // 处理网络消息
    }

    dispose(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = undefined;
        }
    }
}

class NetworkSyncPlugin implements IPlugin {
    readonly name = 'network-sync';
    readonly version = '1.0.0';

    install(core: Core, services: ServiceContainer): void {
        // 注册网络服务
        services.registerSingleton(NetworkSyncService);

        // 自动连接
        const network = services.resolve(NetworkSyncService);
        network.connect('ws://localhost:8080');
    }

    uninstall(): void {
        // 服务会自动dispose
    }
}
```

### 性能分析插件

```typescript
class PerformanceAnalysisPlugin implements IPlugin {
    readonly name = 'performance-analysis';
    readonly version = '1.0.0';
    private frameCount = 0;
    private totalTime = 0;

    install(core: Core, services: ServiceContainer): void {
        const monitor = services.resolve(PerformanceMonitor);
        monitor.enable();

        // 定期输出性能报告
        const timer = services.resolve(TimerManager);
        timer.schedule(5.0, true, null, () => {
            this.printReport(monitor);
        });
    }

    uninstall(): void {
        // 清理
    }

    private printReport(monitor: PerformanceMonitor) {
        console.log('=== Performance Report ===');
        console.log(`FPS: ${monitor.getFPS()}`);
        console.log(`Memory: ${monitor.getMemoryUsage()} MB`);
    }
}
```

## 最佳实践

### 命名规范

- 插件名称使用小写字母和连字符：`my-awesome-plugin`
- 版本号遵循语义化版本规范：`1.0.0`

```typescript
class MyPlugin implements IPlugin {
    readonly name = 'my-awesome-plugin';  // 好
    readonly version = '1.0.0';           // 好
}
```

### 清理资源

始终在 `uninstall` 中清理插件创建的所有资源：

```typescript
class MyPlugin implements IPlugin {
    readonly name = 'my-plugin';
    readonly version = '1.0.0';
    private timerId?: number;
    private listener?: () => void;

    install(core: Core, services: ServiceContainer): void {
        // 添加定时器
        this.timerId = setInterval(() => {
            // ...
        }, 1000);

        // 添加事件监听
        this.listener = () => {};
        window.addEventListener('resize', this.listener);
    }

    uninstall(): void {
        // 清理定时器
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = undefined;
        }

        // 移除事件监听
        if (this.listener) {
            window.removeEventListener('resize', this.listener);
            this.listener = undefined;
        }
    }
}
```

### 错误处理

在插件中妥善处理错误，避免影响整个应用：

```typescript
class MyPlugin implements IPlugin {
    readonly name = 'my-plugin';
    readonly version = '1.0.0';

    async install(core: Core, services: ServiceContainer): Promise<void> {
        try {
            // 可能失败的操作
            await this.loadConfig();
        } catch (error) {
            console.error('Failed to load plugin config:', error);
            throw error; // 重新抛出，让框架知道安装失败
        }
    }

    async uninstall(): Promise<void> {
        try {
            await this.cleanup();
        } catch (error) {
            console.error('Failed to cleanup plugin:', error);
            // 即使清理失败也不应该阻止卸载
        }
    }

    private async loadConfig() {
        // 加载配置
    }

    private async cleanup() {
        // 清理
    }
}
```

### 配置化

允许用户配置插件行为：

```typescript
interface NetworkPluginConfig {
    serverUrl: string;
    autoReconnect: boolean;
    timeout: number;
}

class NetworkPlugin implements IPlugin {
    readonly name = 'network-plugin';
    readonly version = '1.0.0';

    constructor(private config: NetworkPluginConfig) {}

    install(core: Core, services: ServiceContainer): void {
        const network = new NetworkService(this.config);
        services.registerInstance(NetworkService, network);
    }

    uninstall(): void {
        // 清理
    }
}

// 使用
const plugin = new NetworkPlugin({
    serverUrl: 'ws://localhost:8080',
    autoReconnect: true,
    timeout: 5000
});

await Core.installPlugin(plugin);
```

## 常见问题

### 插件安装失败

**问题**: 插件安装时抛出错误

**原因**:
- 依赖未满足
- install 方法中有异常
- 服务注册冲突

**解决**:
1. 检查依赖是否已安装
2. 查看错误日志
3. 确保服务名称不冲突

### 插件卸载后仍有副作用

**问题**: 卸载插件后，插件的功能仍在运行

**原因**: uninstall 方法中未正确清理资源

**解决**: 确保在 uninstall 中清理：
- 定时器
- 事件监听器
- WebSocket连接
- 系统引用

### 何时使用插件

**适合使用插件**:
- 可选功能（调试工具、性能分析）
- 第三方集成（网络库、物理引擎）
- 跨项目复用的功能模块

**不适合使用插件**:
- 核心游戏逻辑
- 简单的工具类
- 项目特定的功能

## 相关链接

- [服务容器](./service-container.md) - 在插件中使用服务容器
- [系统架构](./system.md) - 在插件中添加系统
- [快速开始](./getting-started.md) - Core 初始化和基础使用
