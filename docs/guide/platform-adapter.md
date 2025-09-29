# 平台适配器

## 概述

ECS框架提供了平台适配器接口，允许用户为不同的运行环境实现自定义的平台适配器。

**核心库只提供接口定义，平台适配器实现代码请从文档中复制使用。**

## 为什么不提供单独的适配器包？

1. **灵活性**: 不同项目对平台适配的需求可能不同，复制代码可以让用户根据需要自由修改
2. **减少依赖**: 避免引入不必要的依赖包，保持核心框架的精简
3. **定制化**: 用户可以根据具体的运行环境和需求进行定制

## 支持的平台

### 🌐 [浏览器适配器](./platform-adapter/browser.md)

支持所有现代浏览器环境，包括 Chrome、Firefox、Safari、Edge 等。

**特性支持**:
- ✅ Worker (Web Worker)
- ✅ SharedArrayBuffer (需要COOP/COEP)
- ✅ Transferable Objects
- ✅ Module Worker (现代浏览器)

**适用场景**: Web游戏、Web应用、PWA

---

### 📱 [微信小游戏适配器](./platform-adapter/wechat-minigame.md)

专为微信小游戏环境设计，处理微信小游戏的特殊限制和API。

**特性支持**:
- ✅ Worker (最多1个，需配置game.json)
- ❌ SharedArrayBuffer
- ❌ Transferable Objects
- ✅ 微信设备信息API

**适用场景**: 微信小游戏开发

---

### 🖥️ [Node.js适配器](./platform-adapter/nodejs.md)

为 Node.js 服务器环境提供支持，适用于游戏服务器和计算服务器。

**特性支持**:
- ✅ Worker Threads
- ✅ SharedArrayBuffer
- ✅ Transferable Objects
- ✅ 完整系统信息

**适用场景**: 游戏服务器、计算服务器、CLI工具

---

## 核心接口

### IPlatformAdapter

```typescript
export interface IPlatformAdapter {
    readonly name: string;
    readonly version?: string;

    isWorkerSupported(): boolean;
    isSharedArrayBufferSupported(): boolean;
    getHardwareConcurrency(): number;
    createWorker(script: string, options?: WorkerCreationOptions): PlatformWorker;
    createSharedArrayBuffer(length: number): SharedArrayBuffer | null;
    getHighResTimestamp(): number;
    getPlatformConfig(): PlatformConfig;
    getPlatformConfigAsync?(): Promise<PlatformConfig>;
}
```

### PlatformWorker 接口

```typescript
export interface PlatformWorker {
    postMessage(message: any, transfer?: Transferable[]): void;
    onMessage(handler: (event: { data: any }) => void): void;
    onError(handler: (error: ErrorEvent) => void): void;
    terminate(): void;
    readonly state: 'running' | 'terminated';
}
```

## 使用方法

### 1. 选择合适的平台适配器

根据你的运行环境选择对应的适配器：

```typescript
import { PlatformManager } from '@esengine/ecs-framework';

// 浏览器环境
if (typeof window !== 'undefined') {
    const { BrowserAdapter } = await import('./platform/BrowserAdapter');
    PlatformManager.getInstance().registerAdapter(new BrowserAdapter());
}

// 微信小游戏环境
else if (typeof wx !== 'undefined') {
    const { WeChatMiniGameAdapter } = await import('./platform/WeChatMiniGameAdapter');
    PlatformManager.getInstance().registerAdapter(new WeChatMiniGameAdapter());
}

// Node.js环境
else if (typeof process !== 'undefined' && process.versions?.node) {
    const { NodeAdapter } = await import('./platform/NodeAdapter');
    PlatformManager.getInstance().registerAdapter(new NodeAdapter());
}
```

### 2. 检查适配器状态

```typescript
const manager = PlatformManager.getInstance();

// 检查是否已注册适配器
if (manager.hasAdapter()) {
    const adapter = manager.getAdapter();
    console.log('当前平台:', adapter.name);
    console.log('平台版本:', adapter.version);

    // 检查功能支持
    console.log('Worker支持:', manager.supportsFeature('worker'));
    console.log('SharedArrayBuffer支持:', manager.supportsFeature('shared-array-buffer'));
}
```

## 创建自定义适配器

如果现有的平台适配器不能满足你的需求，你可以创建自定义适配器：

### 1. 实现接口

```typescript
import type { IPlatformAdapter, PlatformWorker, WorkerCreationOptions, PlatformConfig } from '@esengine/ecs-framework';

export class CustomAdapter implements IPlatformAdapter {
    public readonly name = 'custom';
    public readonly version = '1.0.0';

    public isWorkerSupported(): boolean {
        // 实现你的 Worker 支持检查逻辑
        return false;
    }

    public isSharedArrayBufferSupported(): boolean {
        // 实现你的 SharedArrayBuffer 支持检查逻辑
        return false;
    }

    public getHardwareConcurrency(): number {
        // 返回你的平台的并发数
        return 1;
    }

    public createWorker(script: string, options?: WorkerCreationOptions): PlatformWorker {
        throw new Error('Worker not supported on this platform');
    }

    public createSharedArrayBuffer(length: number): SharedArrayBuffer | null {
        return null;
    }

    public getHighResTimestamp(): number {
        return Date.now();
    }

    public getPlatformConfig(): PlatformConfig {
        return {
            maxWorkerCount: 1,
            supportsModuleWorker: false,
            supportsTransferableObjects: false,
            limitations: {
                workerNotSupported: true
            }
        };
    }
}
```

### 2. 注册自定义适配器

```typescript
import { PlatformManager } from '@esengine/ecs-framework';
import { CustomAdapter } from './CustomAdapter';

const customAdapter = new CustomAdapter();
PlatformManager.getInstance().registerAdapter(customAdapter);
```

## 最佳实践

### 1. 平台检测顺序

建议按照以下顺序检测和注册平台适配器：

```typescript
async function initializePlatform() {
    const manager = PlatformManager.getInstance();

    try {
        // 1. 微信小游戏 (优先级最高，环境特征最明显)
        if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
            const { WeChatMiniGameAdapter } = await import('./platform/WeChatMiniGameAdapter');
            manager.registerAdapter(new WeChatMiniGameAdapter());
            return;
        }

        // 2. Node.js 环境
        if (typeof process !== 'undefined' && process.versions?.node) {
            const { NodeAdapter } = await import('./platform/NodeAdapter');
            manager.registerAdapter(new NodeAdapter());
            return;
        }

        // 3. 浏览器环境 (最后检测，覆盖面最广)
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            const { BrowserAdapter } = await import('./platform/BrowserAdapter');
            manager.registerAdapter(new BrowserAdapter());
            return;
        }

        // 4. 未知环境，使用默认适配器
        console.warn('未识别的平台环境，使用默认适配器');
        manager.registerAdapter(new CustomAdapter());

    } catch (error) {
        console.error('平台适配器初始化失败:', error);
        throw error;
    }
}
```

### 2. 功能降级处理

```typescript
function createWorkerSystem() {
    const manager = PlatformManager.getInstance();

    if (!manager.hasAdapter()) {
        throw new Error('未注册平台适配器');
    }

    const config: WorkerSystemConfig = {
        enableWorker: manager.supportsFeature('worker'),
        workerCount: manager.supportsFeature('worker') ?
            manager.getAdapter().getHardwareConcurrency() : 1,
        useSharedArrayBuffer: manager.supportsFeature('shared-array-buffer')
    };

    // 如果不支持Worker，自动降级到同步处理
    if (!config.enableWorker) {
        console.info('当前平台不支持Worker，使用同步处理模式');
    }

    return new PhysicsSystem(config);
}
```

### 3. 错误处理

```typescript
try {
    await initializePlatform();

    // 验证适配器功能
    const manager = PlatformManager.getInstance();
    const adapter = manager.getAdapter();

    console.log(`平台适配器初始化成功: ${adapter.name} v${adapter.version}`);

} catch (error) {
    console.error('平台初始化失败:', error);

    // 提供降级方案
    const fallbackAdapter = new CustomAdapter();
    PlatformManager.getInstance().registerAdapter(fallbackAdapter);

    console.warn('使用降级适配器继续运行');
}
```