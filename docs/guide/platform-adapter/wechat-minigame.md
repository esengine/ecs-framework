# 微信小游戏适配器

## 概述

微信小游戏平台适配器专为微信小游戏环境设计，处理微信小游戏的特殊限制和API。

## 特性支持

- ✅ **Worker**: 支持（通过 `wx.createWorker` 创建，需要配置 game.json）
- ❌ **SharedArrayBuffer**: 不支持
- ❌ **Transferable Objects**: 不支持（只支持可序列化对象）
- ✅ **高精度时间**: 使用 `Date.now()` 或 `wx.getPerformance()`
- ✅ **设备信息**: 完整的微信小游戏设备信息

## 完整实现

```typescript
import type {
    IPlatformAdapter,
    PlatformWorker,
    WorkerCreationOptions,
    PlatformConfig,
    WeChatDeviceInfo
} from '@esengine/ecs-framework';

/**
 * 微信小游戏平台适配器
 * 支持微信小游戏环境
 */
export class WeChatMiniGameAdapter implements IPlatformAdapter {
    public readonly name = 'wechat-minigame';
    public readonly version: string;
    private systemInfo: any;

    constructor() {
        // 获取微信小游戏版本信息
        this.systemInfo = this.getSystemInfo();
        this.version = this.systemInfo.version || 'unknown';
    }

    /**
     * 检查是否支持Worker
     */
    public isWorkerSupported(): boolean {
        // 微信小游戏支持Worker，通过wx.createWorker创建
        return typeof wx !== 'undefined' && typeof wx.createWorker === 'function';
    }

    /**
     * 检查是否支持SharedArrayBuffer（不支持）
     */
    public isSharedArrayBufferSupported(): boolean {
        return false; // 微信小游戏不支持SharedArrayBuffer
    }

    /**
     * 获取硬件并发数
     */
    public getHardwareConcurrency(): number {
        // 微信小游戏官方限制：最多只能创建 1 个 Worker
        return 1;
    }

    /**
     * 创建Worker
     * @param script 脚本内容或文件路径
     * @param options Worker创建选项
     */
    public createWorker(script: string, options: WorkerCreationOptions = {}): PlatformWorker {
        if (!this.isWorkerSupported()) {
            throw new Error('微信小游戏不支持Worker');
        }

        try {
            return new WeChatWorker(script, options);
        } catch (error) {
            throw new Error(`创建微信Worker失败: ${(error as Error).message}`);
        }
    }

    /**
     * 创建SharedArrayBuffer（不支持）
     */
    public createSharedArrayBuffer(length: number): SharedArrayBuffer | null {
        return null; // 微信小游戏不支持SharedArrayBuffer
    }

    /**
     * 获取高精度时间戳
     */
    public getHighResTimestamp(): number {
        // 尝试使用微信的性能API，否则使用Date.now()
        if (typeof wx !== 'undefined' && wx.getPerformance) {
            const performance = wx.getPerformance();
            return performance.now();
        }
        return Date.now();
    }

    /**
     * 获取平台配置
     */
    public getPlatformConfig(): PlatformConfig {
        return {
            maxWorkerCount: 1, // 微信小游戏最多支持 1 个 Worker
            supportsModuleWorker: false, // 不支持模块Worker
            supportsTransferableObjects: this.checkTransferableObjectsSupport(),
            maxSharedArrayBufferSize: 0,
            workerScriptPrefix: '',
            limitations: {
                noEval: true, // 微信小游戏限制eval使用
                requiresWorkerInit: false,
                memoryLimit: this.getMemoryLimit(),
                workerNotSupported: false,
                workerLimitations: [
                    '最多只能创建 1 个 Worker',
                    '创建新Worker前必须先调用 Worker.terminate()',
                    'Worker脚本必须为项目内相对路径',
                    '需要在 game.json 中配置 workers 路径',
                    '使用 worker.onMessage() 而不是 self.onmessage',
                    '需要基础库 1.9.90 及以上版本'
                ]
            },
            extensions: {
                platform: 'wechat-minigame',
                systemInfo: this.systemInfo,
                appId: this.systemInfo.host?.appId || 'unknown'
            }
        };
    }

    /**
     * 获取微信小游戏设备信息
     */
    public getDeviceInfo(): WeChatDeviceInfo {
        return {
            // 设备基础信息
            brand: this.systemInfo.brand,
            model: this.systemInfo.model,
            platform: this.systemInfo.platform,
            system: this.systemInfo.system,
            benchmarkLevel: this.systemInfo.benchmarkLevel,
            cpuType: this.systemInfo.cpuType,
            memorySize: this.systemInfo.memorySize,
            deviceAbi: this.systemInfo.deviceAbi,
            abi: this.systemInfo.abi,

            // 窗口信息
            screenWidth: this.systemInfo.screenWidth,
            screenHeight: this.systemInfo.screenHeight,
            screenTop: this.systemInfo.screenTop,
            windowWidth: this.systemInfo.windowWidth,
            windowHeight: this.systemInfo.windowHeight,
            pixelRatio: this.systemInfo.pixelRatio,
            statusBarHeight: this.systemInfo.statusBarHeight,
            safeArea: this.systemInfo.safeArea,

            // 应用信息
            version: this.systemInfo.version,
            language: this.systemInfo.language,
            theme: this.systemInfo.theme,
            SDKVersion: this.systemInfo.SDKVersion,
            enableDebug: this.systemInfo.enableDebug,
            fontSizeSetting: this.systemInfo.fontSizeSetting,
            host: this.systemInfo.host
        };
    }

    /**
     * 异步获取完整的平台配置
     */
    public async getPlatformConfigAsync(): Promise<PlatformConfig> {
        // 可以在这里添加异步获取设备性能信息的逻辑
        const baseConfig = this.getPlatformConfig();

        // 尝试获取设备性能信息
        try {
            const benchmarkLevel = await this.getBenchmarkLevel();
            baseConfig.extensions = {
                ...baseConfig.extensions,
                benchmarkLevel
            };
        } catch (error) {
            console.warn('获取性能基准失败:', error);
        }

        return baseConfig;
    }

    /**
     * 检查是否支持Transferable Objects
     */
    private checkTransferableObjectsSupport(): boolean {
        // 微信小游戏不支持 Transferable Objects
        // 基础库 2.20.2 之前只支持可序列化的 key-value 对象
        // 2.20.2 之后支持任意类型数据，但仍然不支持 Transferable Objects
        return false;
    }

    /**
     * 获取系统信息
     */
    private getSystemInfo(): any {
        if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
            try {
                return wx.getSystemInfoSync();
            } catch (error) {
                console.warn('获取微信系统信息失败:', error);
                return {};
            }
        }
        return {};
    }

    /**
     * 获取内存限制
     */
    private getMemoryLimit(): number {
        // 微信小游戏通常有内存限制
        const memorySize = this.systemInfo.memorySize;
        if (memorySize) {
            // 解析内存大小字符串（如 "4GB"）
            const match = memorySize.match(/(\d+)([GM]B)?/i);
            if (match) {
                const value = parseInt(match[1], 10);
                const unit = match[2]?.toUpperCase();

                if (unit === 'GB') {
                    return value * 1024 * 1024 * 1024;
                } else if (unit === 'MB') {
                    return value * 1024 * 1024;
                }
            }
        }

        // 默认限制为512MB
        return 512 * 1024 * 1024;
    }

    /**
     * 异步获取设备性能基准
     */
    private async getBenchmarkLevel(): Promise<number> {
        return new Promise((resolve) => {
            if (typeof wx !== 'undefined' && wx.getDeviceInfo) {
                wx.getDeviceInfo({
                    success: (res: any) => {
                        resolve(res.benchmarkLevel || 0);
                    },
                    fail: () => {
                        resolve(0);
                    }
                });
            } else {
                resolve(this.systemInfo.benchmarkLevel || 0);
            }
        });
    }
}

/**
 * 微信Worker封装
 */
class WeChatWorker implements PlatformWorker {
    private _state: 'running' | 'terminated' = 'running';
    private worker: any;
    private scriptPath: string;
    private isTemporaryFile: boolean = false;

    constructor(script: string, options: WorkerCreationOptions = {}) {
        if (typeof wx === 'undefined' || typeof wx.createWorker !== 'function') {
            throw new Error('微信小游戏不支持Worker');
        }

        try {
            // 判断 script 是文件路径还是脚本内容
            if (this.isFilePath(script)) {
                // 直接使用文件路径
                this.scriptPath = script;
                this.isTemporaryFile = false;
                this.worker = wx.createWorker(this.scriptPath);
            } else {
                // 将脚本内容写入文件系统
                this.scriptPath = this.writeScriptToFile(script, options.name);
                this.isTemporaryFile = true;
                this.worker = wx.createWorker(this.scriptPath);
            }
        } catch (error) {
            throw new Error(`创建微信Worker失败: ${(error as Error).message}`);
        }
    }

    /**
     * 判断是否为文件路径
     */
    private isFilePath(script: string): boolean {
        // 简单判断：如果包含 .js 后缀且不包含换行符或分号，认为是文件路径
        return script.endsWith('.js') &&
               !script.includes('\n') &&
               !script.includes(';') &&
               script.length < 200; // 文件路径通常不会太长
    }

    /**
     * 将脚本内容写入文件系统
     */
    private writeScriptToFile(script: string, name?: string): string {
        const fs = wx.getFileSystemManager();
        const fileName = name ? `worker-${name}.js` : `worker-${Date.now()}.js`;
        const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

        try {
            fs.writeFileSync(filePath, script, 'utf8');
            return filePath;
        } catch (error) {
            throw new Error(`写入Worker脚本文件失败: ${(error as Error).message}`);
        }
    }

    public get state(): 'running' | 'terminated' {
        return this._state;
    }

    public postMessage(message: any, transfer?: Transferable[]): void {
        if (this._state === 'terminated') {
            throw new Error('Worker已被终止');
        }

        try {
            // 微信小游戏 Worker 只支持可序列化对象，忽略 transfer 参数
            this.worker.postMessage(message);
        } catch (error) {
            throw new Error(`发送消息到微信Worker失败: ${(error as Error).message}`);
        }
    }

    public onMessage(handler: (event: { data: any }) => void): void {
        // 微信小游戏使用 onMessage 方法，不是 onmessage 属性
        this.worker.onMessage((res: any) => {
            handler({ data: res });
        });
    }

    public onError(handler: (error: ErrorEvent) => void): void {
        // 注意：微信小游戏 Worker 的错误处理可能与标准不同
        if (this.worker.onError) {
            this.worker.onError(handler);
        }
    }

    public terminate(): void {
        if (this._state === 'running') {
            try {
                this.worker.terminate();
                this._state = 'terminated';

                // 清理临时脚本文件
                this.cleanupScriptFile();
            } catch (error) {
                console.error('终止微信Worker失败:', error);
            }
        }
    }

    /**
     * 清理临时脚本文件
     */
    private cleanupScriptFile(): void {
        // 只清理临时创建的文件，不清理用户提供的文件路径
        if (this.scriptPath && this.isTemporaryFile) {
            try {
                const fs = wx.getFileSystemManager();
                fs.unlinkSync(this.scriptPath);
            } catch (error) {
                console.warn('清理Worker脚本文件失败:', error);
            }
        }
    }
}
```

## 使用方法

### 1. 复制代码

将上述代码复制到你的项目中，例如 `src/platform/WeChatMiniGameAdapter.ts`。

### 2. 注册适配器

```typescript
import { PlatformManager } from '@esengine/ecs-framework';
import { WeChatMiniGameAdapter } from './platform/WeChatMiniGameAdapter';

// 检查是否在微信小游戏环境
if (typeof wx !== 'undefined') {
    const wechatAdapter = new WeChatMiniGameAdapter();
    PlatformManager.getInstance().registerAdapter(wechatAdapter);
}
```

### 3. Worker 使用方式

微信小游戏适配器支持两种 Worker 使用方式：

#### 方式一：使用脚本文件路径（推荐）

```typescript
// 1. 在 game.json 中配置 Worker 路径
/*
{
  "workers": "workers"
}
*/

// 2. 创建 Worker 脚本文件 workers/physics.js
// workers/physics.js 内容：
/*
// 微信小游戏 Worker 中使用 worker 对象，不是 self
worker.onMessage(function(data) {
    const { entities, deltaTime, systemConfig } = data;

    // 处理物理计算
    const results = entities.map(entity => {
        entity.vy += systemConfig.gravity * deltaTime;
        entity.x += entity.vx * deltaTime;
        entity.y += entity.vy * deltaTime;
        return entity;
    });

    worker.postMessage({ result: results });
});
*/

// 2. 在 WorkerEntitySystem 中使用
class PhysicsSystem extends WorkerEntitySystem {
    constructor() {
        super(Matcher.all(Transform, Velocity), {
            enableWorker: true,
            workerCount: 1, // 微信小游戏限制
            systemConfig: { gravity: 100 }
        });
    }

    // 重写创建 Worker 脚本的方法，返回文件路径
    private createWorkerScript(): string {
        return 'workers/physics.js'; // 微信小游戏使用相对路径
    }
}
```

#### 方式二：动态脚本内容（自动处理）

```typescript
// WorkerEntitySystem 会自动将用户的 workerProcess 函数序列化
class PhysicsSystem extends WorkerEntitySystem {
    protected workerProcess(entities, deltaTime, config) {
        return entities.map(entity => {
            entity.vy += config.gravity * deltaTime;
            entity.x += entity.vx * deltaTime;
            entity.y += entity.vy * deltaTime;
            return entity;
        });
    }
}
// 框架会自动将此函数内容写入临时文件并创建 Worker
```

### 4. 获取设备信息

```typescript
const manager = PlatformManager.getInstance();
if (manager.hasAdapter()) {
    const adapter = manager.getAdapter();
    console.log('微信设备信息:', adapter.getDeviceInfo());
}
```

## 官方文档参考

在使用微信小游戏 Worker 之前，建议先阅读官方文档：

- [wx.createWorker API](https://developers.weixin.qq.com/minigame/dev/api/worker/wx.createWorker.html)
- [Worker.postMessage API](https://developers.weixin.qq.com/minigame/dev/api/worker/Worker.postMessage.html)
- [Worker.onMessage API](https://developers.weixin.qq.com/minigame/dev/api/worker/Worker.onMessage.html)
- [Worker.terminate API](https://developers.weixin.qq.com/minigame/dev/api/worker/Worker.terminate.html)

## 重要注意事项

### Worker 限制和配置

微信小游戏的 Worker 有以下限制：

- **数量限制**: 最多只能创建 1 个 Worker
- **版本要求**: 需要基础库 1.9.90 及以上版本
- **配置要求**: 必须在 `game.json` 中配置 workers 路径
- **文件路径**: Worker 脚本必须为项目内的相对路径
- **生命周期**: 创建新 Worker 前必须先调用 `Worker.terminate()` 终止当前 Worker
- **API 差异**: 使用 `worker.onMessage()` 而不是 `self.onmessage`

#### 必要配置

在 `game.json` 中添加 workers 配置：

```json
{
  "deviceOrientation": "portrait",
  "showStatusBar": false,
  "workers": "workers",
  "subpackages": []
}
```

### 内存限制

微信小游戏有严格的内存限制：

- 通常限制在 256MB - 512MB
- 需要及时释放不用的资源
- 避免内存泄漏

### API 限制

- 不支持 `eval()` 函数
- 不支持 `Function` 构造器
- DOM API 受限
- 文件系统 API 受限

## 性能优化建议

### 1. 分帧处理

```typescript
class FramedProcessor {
    private tasks: (() => void)[] = [];
    private isProcessing = false;

    public addTask(task: () => void): void {
        this.tasks.push(task);
        if (!this.isProcessing) {
            this.processNextFrame();
        }
    }

    private processNextFrame(): void {
        this.isProcessing = true;
        const startTime = Date.now();
        const frameTime = 16; // 16ms per frame

        while (this.tasks.length > 0 && Date.now() - startTime < frameTime) {
            const task = this.tasks.shift();
            if (task) task();
        }

        if (this.tasks.length > 0) {
            setTimeout(() => this.processNextFrame(), 0);
        } else {
            this.isProcessing = false;
        }
    }
}
```

### 2. 内存管理

```typescript
class MemoryManager {
    private static readonly MAX_MEMORY = 256 * 1024 * 1024; // 256MB

    public static checkMemoryUsage(): void {
        if (typeof wx !== 'undefined' && wx.getPerformance) {
            const performance = wx.getPerformance();
            const memoryInfo = performance.getEntries().find(
                (entry: any) => entry.entryType === 'memory'
            );

            if (memoryInfo && memoryInfo.usedJSHeapSize > this.MAX_MEMORY * 0.8) {
                console.warn('内存使用率过高，建议清理资源');
                // 触发垃圾回收或资源清理
            }
        }
    }
}
```

## 调试技巧

```typescript
// 检查微信小游戏环境
if (typeof wx !== 'undefined') {
    const adapter = new WeChatMiniGameAdapter();

    console.log('微信版本:', adapter.version);
    console.log('设备信息:', adapter.getDeviceInfo());
    console.log('平台配置:', adapter.getPlatformConfig());

    // 检查功能支持
    console.log('Worker支持:', adapter.isWorkerSupported());
    console.log('SharedArrayBuffer支持:', adapter.isSharedArrayBufferSupported());
}
```

## 微信小游戏特殊API

```typescript
// 获取设备性能等级
if (typeof wx !== 'undefined' && wx.getDeviceInfo) {
    wx.getDeviceInfo({
        success: (res) => {
            console.log('设备性能等级:', res.benchmarkLevel);
        }
    });
}

// 监听内存警告
if (typeof wx !== 'undefined' && wx.onMemoryWarning) {
    wx.onMemoryWarning(() => {
        console.warn('收到内存警告，开始清理资源');
        // 清理不必要的资源
    });
}
```