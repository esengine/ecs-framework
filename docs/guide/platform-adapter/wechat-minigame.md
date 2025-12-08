# 微信小游戏适配器

## 概述

微信小游戏平台适配器专为微信小游戏环境设计，处理微信小游戏的特殊限制和API。

## 特性支持

| 特性 | 支持情况 | 说明 |
|------|----------|------|
| **Worker** | ✅ 支持 | 需要使用预编译文件，配置 `workerScriptPath` |
| **SharedArrayBuffer** | ❌ 不支持 | 微信小游戏环境不支持 |
| **Transferable Objects** | ❌ 不支持 | 只支持可序列化对象 |
| **高精度时间** | ✅ 支持 | 使用 `wx.getPerformance()` |
| **设备信息** | ✅ 支持 | 完整的微信小游戏设备信息 |

## WorkerEntitySystem 使用方式

### 重要：微信小游戏 Worker 限制

微信小游戏的 Worker 有以下限制：
- **Worker 脚本必须在代码包内**，不能动态生成
- **必须在 `game.json` 中配置** `workers` 目录
- **最多只能创建 1 个 Worker**

因此，使用 `WorkerEntitySystem` 时有两种方式：
1. **推荐：使用 CLI 工具自动生成** Worker 文件
2. 手动创建 Worker 文件

### 方式一：使用 CLI 工具自动生成（推荐）

我们提供了 `@esengine/worker-generator` 工具，可以自动从你的 TypeScript 代码中提取 `workerProcess` 函数并生成微信小游戏兼容的 Worker 文件。

#### 安装

```bash
pnpm add -D @esengine/worker-generator
# 或
npm install --save-dev @esengine/worker-generator
```

#### 使用

```bash
# 扫描 src 目录，生成 Worker 文件到 workers 目录
npx esengine-worker-gen --src ./src --out ./workers --wechat

# 查看帮助
npx esengine-worker-gen --help
```

#### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-s, --src <dir>` | 源代码目录 | `./src` |
| `-o, --out <dir>` | 输出目录 | `./workers` |
| `-w, --wechat` | 生成微信小游戏兼容代码 | `false` |
| `-m, --mapping` | 生成 worker-mapping.json | `true` |
| `-t, --tsconfig <path>` | TypeScript 配置文件路径 | 自动查找 |
| `-v, --verbose` | 详细输出 | `false` |

#### 示例输出

```
🔧 ESEngine Worker Generator

Source directory: /project/src
Output directory: /project/workers
WeChat mode: Yes

Scanning for WorkerEntitySystem classes...

✓ Found 1 WorkerEntitySystem class(es):
  - PhysicsSystem (src/systems/PhysicsSystem.ts)

Generating Worker files...

✓ Successfully generated 1 Worker file(s):
  - PhysicsSystem -> workers/physics-system-worker.js

📝 Usage:
1. Copy the generated files to your project's workers/ directory
2. Configure game.json (WeChat): { "workers": "workers" }
3. In your System constructor, add:
   workerScriptPath: 'workers/physics-system-worker.js'
```

#### 在构建流程中集成

```json
// package.json
{
  "scripts": {
    "build:workers": "esengine-worker-gen --src ./src --out ./workers --wechat",
    "build": "pnpm build:workers && your-build-command"
  }
}
```

### 方式二：手动创建 Worker 文件

如果你不想使用 CLI 工具，也可以手动创建 Worker 文件。

在项目中创建 `workers/entity-worker.js`：

```javascript
// workers/entity-worker.js
// 微信小游戏 WorkerEntitySystem 通用 Worker 模板

let sharedFloatArray = null;

worker.onMessage(function(e) {
    const { type, id, entities, deltaTime, systemConfig, startIndex, endIndex, sharedBuffer } = e.data;

    try {
        // 处理 SharedArrayBuffer 初始化
        if (type === 'init' && sharedBuffer) {
            sharedFloatArray = new Float32Array(sharedBuffer);
            worker.postMessage({ type: 'init', success: true });
            return;
        }

        // 处理 SharedArrayBuffer 数据
        if (type === 'shared' && sharedFloatArray) {
            processSharedArrayBuffer(startIndex, endIndex, deltaTime, systemConfig);
            worker.postMessage({ id, result: null });
            return;
        }

        // 传统处理方式
        if (entities) {
            const result = workerProcess(entities, deltaTime, systemConfig);

            // 处理 Promise 返回值
            if (result && typeof result.then === 'function') {
                result.then(function(finalResult) {
                    worker.postMessage({ id, result: finalResult });
                }).catch(function(error) {
                    worker.postMessage({ id, error: error.message });
                });
            } else {
                worker.postMessage({ id, result: result });
            }
        }
    } catch (error) {
        worker.postMessage({ id, error: error.message });
    }
});

/**
 * 实体处理函数 - 根据你的业务逻辑修改此函数
 * @param {Array} entities - 实体数据数组
 * @param {number} deltaTime - 帧间隔时间
 * @param {Object} systemConfig - 系统配置
 * @returns {Array} 处理后的实体数据
 */
function workerProcess(entities, deltaTime, systemConfig) {
    // ====== 在这里编写你的处理逻辑 ======
    // 示例：物理计算
    return entities.map(function(entity) {
        // 应用重力
        entity.vy += (systemConfig.gravity || 100) * deltaTime;

        // 更新位置
        entity.x += entity.vx * deltaTime;
        entity.y += entity.vy * deltaTime;

        // 应用摩擦力
        entity.vx *= (systemConfig.friction || 0.95);
        entity.vy *= (systemConfig.friction || 0.95);

        return entity;
    });
}

/**
 * SharedArrayBuffer 处理函数（可选）
 */
function processSharedArrayBuffer(startIndex, endIndex, deltaTime, systemConfig) {
    if (!sharedFloatArray) return;

    // ====== 根据需要实现 SharedArrayBuffer 处理逻辑 ======
    // 注意：微信小游戏不支持 SharedArrayBuffer，此函数通常不会被调用
}
```

### 步骤 2：配置 game.json

在 `game.json` 中添加 workers 配置：

```json
{
  "deviceOrientation": "portrait",
  "showStatusBar": false,
  "workers": "workers"
}
```

### 步骤 3：使用 WorkerEntitySystem

```typescript
import { WorkerEntitySystem, Matcher, Entity } from '@esengine/esengine';

interface PhysicsData {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
}

class PhysicsSystem extends WorkerEntitySystem<PhysicsData> {
    constructor() {
        super(Matcher.all(Transform, Velocity), {
            enableWorker: true,
            workerCount: 1,  // 微信小游戏限制只能创建 1 个 Worker
            workerScriptPath: 'workers/entity-worker.js',  // 指定预编译的 Worker 文件
            systemConfig: {
                gravity: 100,
                friction: 0.95
            }
        });
    }

    protected getDefaultEntityDataSize(): number {
        return 6;
    }

    protected extractEntityData(entity: Entity): PhysicsData {
        const transform = entity.getComponent(Transform);
        const velocity = entity.getComponent(Velocity);
        const physics = entity.getComponent(Physics);

        return {
            id: entity.id,
            x: transform.x,
            y: transform.y,
            vx: velocity.x,
            vy: velocity.y,
            mass: physics.mass
        };
    }

    // 注意：在微信小游戏中，此方法不会被使用
    // Worker 的处理逻辑在 workers/entity-worker.js 中的 workerProcess 函数里
    protected workerProcess(entities: PhysicsData[], deltaTime: number, config: any): PhysicsData[] {
        return entities.map(entity => {
            entity.vy += config.gravity * deltaTime;
            entity.x += entity.vx * deltaTime;
            entity.y += entity.vy * deltaTime;
            entity.vx *= config.friction;
            entity.vy *= config.friction;
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

    // SharedArrayBuffer 相关方法（微信小游戏不支持，可省略）
    protected writeEntityToBuffer(data: PhysicsData, offset: number): void {}
    protected readEntityFromBuffer(offset: number): PhysicsData | null { return null; }
}
```

### 临时禁用 Worker（降级到同步模式）

如果遇到问题，可以临时禁用 Worker：

```typescript
class PhysicsSystem extends WorkerEntitySystem<PhysicsData> {
    constructor() {
        super(Matcher.all(Transform, Velocity), {
            enableWorker: false,  // 禁用 Worker，使用主线程同步处理
            // ... 其他配置
        });
    }
}
```

## 完整适配器实现

```typescript
import type {
    IPlatformAdapter,
    PlatformWorker,
    WorkerCreationOptions,
    PlatformConfig
} from '@esengine/esengine';

/**
 * 微信小游戏平台适配器
 */
export class WeChatMiniGameAdapter implements IPlatformAdapter {
    public readonly name = 'wechat-minigame';
    public readonly version: string;
    private systemInfo: any;

    constructor() {
        this.systemInfo = this.getSystemInfo();
        this.version = this.systemInfo.SDKVersion || 'unknown';
    }

    public isWorkerSupported(): boolean {
        return typeof wx !== 'undefined' && typeof wx.createWorker === 'function';
    }

    public isSharedArrayBufferSupported(): boolean {
        return false;
    }

    public getHardwareConcurrency(): number {
        return 1;  // 微信小游戏最多 1 个 Worker
    }

    public createWorker(scriptPath: string, options: WorkerCreationOptions = {}): PlatformWorker {
        if (!this.isWorkerSupported()) {
            throw new Error('微信小游戏环境不支持 Worker');
        }

        // scriptPath 必须是代码包内的文件路径
        const worker = wx.createWorker(scriptPath, {
            useExperimentalWorker: true
        });

        return new WeChatWorker(worker);
    }

    public createSharedArrayBuffer(length: number): SharedArrayBuffer | null {
        return null;
    }

    public getHighResTimestamp(): number {
        if (typeof wx !== 'undefined' && wx.getPerformance) {
            return wx.getPerformance().now();
        }
        return Date.now();
    }

    public getPlatformConfig(): PlatformConfig {
        return {
            maxWorkerCount: 1,
            supportsModuleWorker: false,
            supportsTransferableObjects: false,
            maxSharedArrayBufferSize: 0,
            workerScriptPrefix: '',
            limitations: {
                noEval: true,  // 重要：标记不支持动态脚本
                requiresWorkerInit: false,
                memoryLimit: 512 * 1024 * 1024,
                workerNotSupported: false,
                workerLimitations: [
                    '最多只能创建 1 个 Worker',
                    'Worker 脚本必须在代码包内',
                    '需要在 game.json 中配置 workers 路径',
                    '需要使用 workerScriptPath 配置'
                ]
            },
            extensions: {
                platform: 'wechat-minigame',
                sdkVersion: this.systemInfo.SDKVersion
            }
        };
    }

    private getSystemInfo(): any {
        if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
            try {
                return wx.getSystemInfoSync();
            } catch (error) {
                console.warn('获取微信系统信息失败:', error);
            }
        }
        return {};
    }
}

/**
 * 微信 Worker 封装
 */
class WeChatWorker implements PlatformWorker {
    private _state: 'running' | 'terminated' = 'running';
    private worker: any;

    constructor(worker: any) {
        this.worker = worker;
    }

    public get state(): 'running' | 'terminated' {
        return this._state;
    }

    public postMessage(message: any, transfer?: Transferable[]): void {
        if (this._state === 'terminated') {
            throw new Error('Worker 已被终止');
        }
        this.worker.postMessage(message);
    }

    public onMessage(handler: (event: { data: any }) => void): void {
        this.worker.onMessage((res: any) => {
            handler({ data: res });
        });
    }

    public onError(handler: (error: ErrorEvent) => void): void {
        if (this.worker.onError) {
            this.worker.onError(handler);
        }
    }

    public terminate(): void {
        if (this._state === 'running') {
            this.worker.terminate();
            this._state = 'terminated';
        }
    }
}
```

## 注册适配器

```typescript
import { PlatformManager } from '@esengine/esengine';
import { WeChatMiniGameAdapter } from './platform/WeChatMiniGameAdapter';

// 在游戏启动时注册适配器
if (typeof wx !== 'undefined') {
    const adapter = new WeChatMiniGameAdapter();
    PlatformManager.getInstance().registerAdapter(adapter);
}
```

## 官方文档参考

- [wx.createWorker API](https://developers.weixin.qq.com/minigame/dev/api/worker/wx.createWorker.html)
- [Worker.postMessage API](https://developers.weixin.qq.com/minigame/dev/api/worker/Worker.postMessage.html)
- [Worker.onMessage API](https://developers.weixin.qq.com/minigame/dev/api/worker/Worker.onMessage.html)

## 重要注意事项

### Worker 限制

| 限制项 | 说明 |
|--------|------|
| 数量限制 | 最多只能创建 1 个 Worker |
| 版本要求 | 需要基础库 1.9.90 及以上 |
| 脚本位置 | 必须在代码包内，不支持动态生成 |
| 生命周期 | 创建新 Worker 前必须先 terminate() |

### 内存限制

- 通常限制在 256MB - 512MB
- 需要及时释放不用的资源
- 建议监听内存警告：

```typescript
wx.onMemoryWarning(() => {
    console.warn('收到内存警告，开始清理资源');
    // 清理不必要的资源
});
```

## 调试技巧

```typescript
// 检查 Worker 配置
const adapter = PlatformManager.getInstance().getAdapter();
const config = adapter.getPlatformConfig();

console.log('Worker 支持:', adapter.isWorkerSupported());
console.log('最大 Worker 数:', config.maxWorkerCount);
console.log('平台限制:', config.limitations);
```
