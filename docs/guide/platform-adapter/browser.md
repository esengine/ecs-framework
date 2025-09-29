# 浏览器适配器

## 概述

浏览器平台适配器为标准Web浏览器环境提供支持，包括 Chrome、Firefox、Safari、Edge 等现代浏览器。

## 特性支持

- ✅ **Worker**: 支持 Web Worker 和 Module Worker
- ✅ **SharedArrayBuffer**: 支持（需要COOP/COEP头部）
- ✅ **Transferable Objects**: 完全支持
- ✅ **高精度时间**: 使用 `performance.now()`
- ✅ **设备信息**: 完整的浏览器和设备信息

## 完整实现

```typescript
import type {
    IPlatformAdapter,
    PlatformWorker,
    WorkerCreationOptions,
    PlatformConfig,
    BrowserDeviceInfo
} from '@esengine/ecs-framework';

/**
 * 浏览器平台适配器
 * 支持标准Web浏览器环境
 */
export class BrowserAdapter implements IPlatformAdapter {
    public readonly name = 'browser';
    public readonly version: string;

    constructor() {
        this.version = this.getBrowserInfo();
    }

    /**
     * 检查是否支持Worker
     */
    public isWorkerSupported(): boolean {
        return typeof Worker !== 'undefined';
    }

    /**
     * 检查是否支持SharedArrayBuffer
     */
    public isSharedArrayBufferSupported(): boolean {
        return typeof SharedArrayBuffer !== 'undefined' && this.checkSharedArrayBufferEnabled();
    }

    /**
     * 获取硬件并发数（CPU核心数）
     */
    public getHardwareConcurrency(): number {
        return navigator.hardwareConcurrency || 4;
    }

    /**
     * 创建Worker
     */
    public createWorker(script: string, options: WorkerCreationOptions = {}): PlatformWorker {
        if (!this.isWorkerSupported()) {
            throw new Error('浏览器不支持Worker');
        }

        try {
            return new BrowserWorker(script, options);
        } catch (error) {
            throw new Error(`创建浏览器Worker失败: ${(error as Error).message}`);
        }
    }

    /**
     * 创建SharedArrayBuffer
     */
    public createSharedArrayBuffer(length: number): SharedArrayBuffer | null {
        if (!this.isSharedArrayBufferSupported()) {
            return null;
        }

        try {
            return new SharedArrayBuffer(length);
        } catch (error) {
            console.warn('SharedArrayBuffer创建失败:', error);
            return null;
        }
    }

    /**
     * 获取高精度时间戳
     */
    public getHighResTimestamp(): number {
        return performance.now();
    }

    /**
     * 获取平台配置
     */
    public getPlatformConfig(): PlatformConfig {
        return {
            maxWorkerCount: this.getHardwareConcurrency(),
            supportsModuleWorker: this.checkModuleWorkerSupport(),
            supportsTransferableObjects: true,
            maxSharedArrayBufferSize: this.getMaxSharedArrayBufferSize(),
            workerScriptPrefix: '',
            limitations: {
                noEval: false,
                requiresWorkerInit: false
            },
            extensions: {
                userAgent: navigator.userAgent,
                vendor: navigator.vendor,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            }
        };
    }

    /**
     * 获取浏览器设备信息
     */
    public getDeviceInfo(): BrowserDeviceInfo {
        const deviceInfo: BrowserDeviceInfo = {
            // 浏览器信息
            userAgent: navigator.userAgent,
            vendor: navigator.vendor,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,

            // 硬件信息
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: (navigator as any).deviceMemory,
            maxTouchPoints: navigator.maxTouchPoints,

            // 屏幕信息
            screenWidth: screen.width,
            screenHeight: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,

            // 窗口信息
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,
            devicePixelRatio: window.devicePixelRatio,

            // 平台信息
            platform: navigator.platform,
            appVersion: navigator.appVersion,
            appName: navigator.appName
        };

        // 连接信息（如果支持）
        const connection = (navigator as any).connection;
        if (connection) {
            deviceInfo.connection = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }

        return deviceInfo;
    }

    /**
     * 获取浏览器信息
     */
    private getBrowserInfo(): string {
        const userAgent = navigator.userAgent;
        let browserName = 'Unknown';
        let version = 'Unknown';

        // 简单的浏览器检测
        if (userAgent.includes('Chrome')) {
            browserName = 'Chrome';
            const match = userAgent.match(/Chrome\/([0-9.]+)/);
            if (match) version = match[1];
        } else if (userAgent.includes('Firefox')) {
            browserName = 'Firefox';
            const match = userAgent.match(/Firefox\/([0-9.]+)/);
            if (match) version = match[1];
        } else if (userAgent.includes('Safari')) {
            browserName = 'Safari';
            const match = userAgent.match(/Version\/([0-9.]+)/);
            if (match) version = match[1];
        } else if (userAgent.includes('Edge')) {
            browserName = 'Edge';
            const match = userAgent.match(/Edge\/([0-9.]+)/);
            if (match) version = match[1];
        }

        return `${browserName} ${version}`;
    }

    /**
     * 检查SharedArrayBuffer是否真正可用
     */
    private checkSharedArrayBufferEnabled(): boolean {
        try {
            // 尝试创建一个小的SharedArrayBuffer来测试
            new SharedArrayBuffer(8);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 检查是否支持模块Worker
     */
    private checkModuleWorkerSupport(): boolean {
        try {
            // 简单检测：Chrome 80+、Firefox 114+等支持
            return 'type' in Worker.prototype || false;
        } catch {
            return false;
        }
    }

    /**
     * 获取SharedArrayBuffer最大大小限制
     */
    private getMaxSharedArrayBufferSize(): number {
        // 浏览器通常限制为1GB或更少
        const deviceMemory = (navigator as any).deviceMemory;
        if (deviceMemory) {
            // 限制为设备内存的25%
            return Math.min(deviceMemory * 0.25 * 1024 * 1024 * 1024, 1024 * 1024 * 1024);
        }

        // 默认1GB
        return 1024 * 1024 * 1024;
    }
}

/**
 * 浏览器Worker封装
 */
class BrowserWorker implements PlatformWorker {
    private _state: 'running' | 'terminated' = 'running';
    private worker: Worker;

    constructor(script: string, options: WorkerCreationOptions = {}) {
        this.worker = this.createBrowserWorker(script, options);
    }

    public get state(): 'running' | 'terminated' {
        return this._state;
    }

    public postMessage(message: any, transfer?: Transferable[]): void {
        if (this._state === 'terminated') {
            throw new Error('Worker已被终止');
        }

        try {
            if (transfer && transfer.length > 0) {
                this.worker.postMessage(message, transfer);
            } else {
                this.worker.postMessage(message);
            }
        } catch (error) {
            throw new Error(`发送消息到Worker失败: ${(error as Error).message}`);
        }
    }

    public onMessage(handler: (event: { data: any }) => void): void {
        this.worker.onmessage = (event: MessageEvent) => {
            handler({ data: event.data });
        };
    }

    public onError(handler: (error: ErrorEvent) => void): void {
        this.worker.onerror = handler;
    }

    public terminate(): void {
        if (this._state === 'running') {
            try {
                this.worker.terminate();
                this._state = 'terminated';
            } catch (error) {
                console.error('终止Worker失败:', error);
            }
        }
    }

    /**
     * 创建浏览器Worker
     */
    private createBrowserWorker(script: string, options: WorkerCreationOptions): Worker {
        try {
            // 创建Blob URL
            const blob = new Blob([script], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);

            // 创建Worker
            const worker = new Worker(url, {
                type: options.type || 'classic',
                credentials: options.credentials,
                name: options.name
            });

            // 清理Blob URL（延迟清理，确保Worker已加载）
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            return worker;
        } catch (error) {
            throw new Error(`无法创建浏览器Worker: ${(error as Error).message}`);
        }
    }
}
```

## 使用方法

### 1. 复制代码

将上述代码复制到你的项目中，例如 `src/platform/BrowserAdapter.ts`。

### 2. 注册适配器

```typescript
import { PlatformManager } from '@esengine/ecs-framework';
import { BrowserAdapter } from './platform/BrowserAdapter';

// 创建并注册浏览器适配器
const browserAdapter = new BrowserAdapter();
PlatformManager.registerAdapter(browserAdapter);

// 框架会自动检测和使用合适的适配器
```

### 3. 使用 WorkerEntitySystem

浏览器适配器与 WorkerEntitySystem 配合使用，框架会自动处理 Worker 脚本的创建：

```typescript
import { WorkerEntitySystem, Matcher } from '@esengine/ecs-framework';

class PhysicsSystem extends WorkerEntitySystem {
    constructor() {
        super(Matcher.all(Transform, Velocity), {
            enableWorker: true,
            workerCount: navigator.hardwareConcurrency || 4,
            useSharedArrayBuffer: true,
            systemConfig: { gravity: 9.8 }
        });
    }

    protected getDefaultEntityDataSize(): number {
        return 6; // x, y, vx, vy, mass, radius
    }

    protected extractEntityData(entity: Entity): PhysicsData {
        const transform = entity.getComponent(Transform);
        const velocity = entity.getComponent(Velocity);
        return {
            x: transform.x,
            y: transform.y,
            vx: velocity.x,
            vy: velocity.y,
            mass: 1,
            radius: 10
        };
    }

    // 这个函数会被自动序列化并在Worker中执行
    protected workerProcess(entities, deltaTime, config) {
        return entities.map(entity => {
            // 应用重力
            entity.vy += config.gravity * deltaTime;

            // 更新位置
            entity.x += entity.vx * deltaTime;
            entity.y += entity.vy * deltaTime;

            return entity;
        });
    }

    protected applyResult(entity: Entity, result: PhysicsData): void {
        const transform = entity.getComponent(Transform);
        const velocity = entity.getComponent(Velocity);

        transform.x = result.x;
        transform.y = result.y;
        velocity.x = result.vx;
        velocity.y = result.vy;
    }
}

interface PhysicsData {
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    radius: number;
}
```

### 4. 检查适配器状态

```typescript
const manager = PlatformManager.getInstance();

// 检查是否已注册适配器
if (manager.hasAdapter()) {
    console.log('适配器信息:', manager.getAdapterInfo());

    // 检查功能支持
    console.log('Worker支持:', manager.supportsFeature('worker'));
    console.log('SharedArrayBuffer支持:', manager.supportsFeature('shared-array-buffer'));
}
```

## 重要注意事项

### SharedArrayBuffer 支持

SharedArrayBuffer 需要特殊的安全配置：

1. **HTTPS**: 必须在安全上下文中使用
2. **COOP/COEP 头部**: 需要设置正确的跨域隔离头部

```html
<!-- 在 HTML 中设置 -->
<meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin">
<meta http-equiv="Cross-Origin-Embedder-Policy" content="require-corp">
```

或在服务器配置中设置：

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### 浏览器兼容性

- **Worker**: 所有现代浏览器支持
- **Module Worker**: Chrome 80+, Firefox 114+
- **SharedArrayBuffer**: Chrome 68+, Firefox 79+（需要COOP/COEP）
- **Transferable Objects**: 所有现代浏览器支持

## 性能优化建议

1. **Worker 池**: 复用 Worker 实例，避免频繁创建和销毁
2. **数据传输**: 使用 Transferable Objects 减少数据拷贝
3. **SharedArrayBuffer**: 对于大量数据共享，使用 SharedArrayBuffer
4. **模块 Worker**: 在支持的浏览器中使用模块 Worker 来更好地组织代码

## 调试技巧

```typescript
// 检查浏览器支持情况
const adapter = new BrowserAdapter();
console.log('Worker支持:', adapter.isWorkerSupported());
console.log('SharedArrayBuffer支持:', adapter.isSharedArrayBufferSupported());
console.log('硬件并发数:', adapter.getHardwareConcurrency());
console.log('平台配置:', adapter.getPlatformConfig());
console.log('设备信息:', adapter.getDeviceInfo());
```