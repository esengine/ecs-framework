# Node.js 适配器

## 概述

Node.js 平台适配器为 Node.js 服务器环境提供支持，适用于游戏服务器、计算服务器或其他需要 ECS 架构的服务器应用。

## 特性支持

- ✅ **Worker**: 支持（通过 `worker_threads` 模块）
- ❌ **SharedArrayBuffer**: 支持（Node.js 16.17.0+）
- ✅ **Transferable Objects**: 完全支持
- ✅ **高精度时间**: 使用 `process.hrtime.bigint()`
- ✅ **设备信息**: 完整的系统和进程信息

## 完整实现

```typescript
import { worker_threads, Worker, isMainThread, parentPort } from 'worker_threads';
import * as os from 'os';
import * as process from 'process';
import * as fs from 'fs';
import * as path from 'path';
import type {
    IPlatformAdapter,
    PlatformWorker,
    WorkerCreationOptions,
    PlatformConfig,
    NodeDeviceInfo
} from '@esengine/ecs-framework';

/**
 * Node.js 平台适配器
 * 支持 Node.js 服务器环境
 */
export class NodeAdapter implements IPlatformAdapter {
    public readonly name = 'nodejs';
    public readonly version: string;

    constructor() {
        this.version = process.version;
    }

    /**
     * 检查是否支持Worker
     */
    public isWorkerSupported(): boolean {
        try {
            // 检查 worker_threads 模块是否可用
            return typeof worker_threads !== 'undefined' && typeof Worker !== 'undefined';
        } catch {
            return false;
        }
    }

    /**
     * 检查是否支持SharedArrayBuffer
     */
    public isSharedArrayBufferSupported(): boolean {
        // Node.js 支持 SharedArrayBuffer
        return typeof SharedArrayBuffer !== 'undefined';
    }

    /**
     * 获取硬件并发数（CPU核心数）
     */
    public getHardwareConcurrency(): number {
        return os.cpus().length;
    }

    /**
     * 创建Worker
     */
    public createWorker(script: string, options: WorkerCreationOptions = {}): PlatformWorker {
        if (!this.isWorkerSupported()) {
            throw new Error('Node.js环境不支持Worker Threads');
        }

        try {
            return new NodeWorker(script, options);
        } catch (error) {
            throw new Error(`创建Node.js Worker失败: ${(error as Error).message}`);
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
     * 获取高精度时间戳（纳秒）
     */
    public getHighResTimestamp(): number {
        // 返回毫秒，与浏览器 performance.now() 保持一致
        return Number(process.hrtime.bigint()) / 1000000;
    }

    /**
     * 获取平台配置
     */
    public getPlatformConfig(): PlatformConfig {
        return {
            maxWorkerCount: this.getHardwareConcurrency(),
            supportsModuleWorker: true, // Node.js 支持 ES 模块
            supportsTransferableObjects: true,
            maxSharedArrayBufferSize: this.getMaxSharedArrayBufferSize(),
            workerScriptPrefix: '',
            limitations: {
                noEval: false, // Node.js 支持 eval
                requiresWorkerInit: false
            },
            extensions: {
                platform: 'nodejs',
                nodeVersion: process.version,
                v8Version: process.versions.v8,
                uvVersion: process.versions.uv,
                zlibVersion: process.versions.zlib,
                opensslVersion: process.versions.openssl,
                architecture: process.arch,
                endianness: os.endianness(),
                pid: process.pid,
                ppid: process.ppid
            }
        };
    }

    /**
     * 获取Node.js设备信息
     */
    public getDeviceInfo(): NodeDeviceInfo {
        const cpus = os.cpus();
        const networkInterfaces = os.networkInterfaces();
        const userInfo = os.userInfo();

        return {
            // 系统信息
            platform: os.platform(),
            arch: os.arch(),
            type: os.type(),
            release: os.release(),
            version: os.version(),
            hostname: os.hostname(),

            // CPU信息
            cpus: cpus.map(cpu => ({
                model: cpu.model,
                speed: cpu.speed,
                times: cpu.times
            })),

            // 内存信息
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            usedMemory: os.totalmem() - os.freemem(),

            // 负载信息
            loadAverage: os.loadavg(),

            // 网络接口
            networkInterfaces: Object.fromEntries(
                Object.entries(networkInterfaces).map(([name, interfaces]) => [
                    name,
                    (interfaces || []).map(iface => ({
                        address: iface.address,
                        netmask: iface.netmask,
                        family: iface.family as 'IPv4' | 'IPv6',
                        mac: iface.mac,
                        internal: iface.internal,
                        cidr: iface.cidr,
                        scopeid: iface.scopeid
                    }))
                ])
            ),

            // 进程信息
            process: {
                pid: process.pid,
                ppid: process.ppid,
                version: process.version,
                versions: process.versions,
                uptime: process.uptime()
            },

            // 用户信息
            userInfo: {
                uid: userInfo.uid,
                gid: userInfo.gid,
                username: userInfo.username,
                homedir: userInfo.homedir,
                shell: userInfo.shell
            }
        };
    }

    /**
     * 获取SharedArrayBuffer最大大小限制
     */
    private getMaxSharedArrayBufferSize(): number {
        const totalMemory = os.totalmem();
        // 限制为系统总内存的50%
        return Math.floor(totalMemory * 0.5);
    }
}

/**
 * Node.js Worker封装
 */
class NodeWorker implements PlatformWorker {
    private _state: 'running' | 'terminated' = 'running';
    private worker: Worker;
    private isTemporaryFile: boolean = false;
    private scriptPath: string;

    constructor(script: string, options: WorkerCreationOptions = {}) {
        try {
            // 判断 script 是文件路径还是脚本内容
            if (this.isFilePath(script)) {
                // 直接使用文件路径
                this.scriptPath = script;
                this.isTemporaryFile = false;
            } else {
                // 将脚本内容写入临时文件
                this.scriptPath = this.writeScriptToFile(script, options.name);
                this.isTemporaryFile = true;
            }

            // 创建Worker
            this.worker = new Worker(this.scriptPath, {
                // Node.js Worker options
                workerData: options.name ? { name: options.name } : undefined
            });

        } catch (error) {
            throw new Error(`创建Node.js Worker失败: ${(error as Error).message}`);
        }
    }

    /**
     * 判断是否为文件路径
     */
    private isFilePath(script: string): boolean {
        // 检查是否看起来像文件路径
        return (script.endsWith('.js') || script.endsWith('.mjs') || script.endsWith('.ts')) &&
               !script.includes('\n') &&
               !script.includes(';') &&
               script.length < 500; // 文件路径通常不会太长
    }

    /**
     * 将脚本内容写入临时文件
     */
    private writeScriptToFile(script: string, name?: string): string {
        const tmpDir = os.tmpdir();
        const fileName = name ? `worker-${name}-${Date.now()}.js` : `worker-${Date.now()}.js`;
        const filePath = path.join(tmpDir, fileName);

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
            if (transfer && transfer.length > 0) {
                // Node.js Worker 支持 Transferable Objects
                this.worker.postMessage(message, transfer);
            } else {
                this.worker.postMessage(message);
            }
        } catch (error) {
            throw new Error(`发送消息到Node.js Worker失败: ${(error as Error).message}`);
        }
    }

    public onMessage(handler: (event: { data: any }) => void): void {
        this.worker.on('message', (data: any) => {
            handler({ data });
        });
    }

    public onError(handler: (error: ErrorEvent) => void): void {
        this.worker.on('error', (error: Error) => {
            // 将 Error 转换为 ErrorEvent 格式
            const errorEvent = {
                message: error.message,
                filename: '',
                lineno: 0,
                colno: 0,
                error: error
            } as ErrorEvent;
            handler(errorEvent);
        });
    }

    public terminate(): void {
        if (this._state === 'running') {
            try {
                this.worker.terminate();
                this._state = 'terminated';

                // 清理临时脚本文件
                this.cleanupScriptFile();
            } catch (error) {
                console.error('终止Node.js Worker失败:', error);
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

将上述代码复制到你的项目中，例如 `src/platform/NodeAdapter.ts`。

### 2. 注册适配器

```typescript
import { PlatformManager } from '@esengine/ecs-framework';
import { NodeAdapter } from './platform/NodeAdapter';

// 检查是否在Node.js环境
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const nodeAdapter = new NodeAdapter();
    PlatformManager.getInstance().registerAdapter(nodeAdapter);
}
```

### 3. 使用 WorkerEntitySystem

Node.js 适配器与 WorkerEntitySystem 配合使用，框架会自动处理 Worker 脚本的创建：

```typescript
import { WorkerEntitySystem, Matcher } from '@esengine/ecs-framework';
import * as os from 'os';

class PhysicsSystem extends WorkerEntitySystem {
    constructor() {
        super(Matcher.all(Transform, Velocity), {
            enableWorker: true,
            workerCount: os.cpus().length, // 使用所有CPU核心
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

### 4. 获取系统信息

```typescript
const manager = PlatformManager.getInstance();
if (manager.hasAdapter()) {
    const adapter = manager.getAdapter();
    const deviceInfo = adapter.getDeviceInfo();

    console.log('Node.js版本:', deviceInfo.process?.version);
    console.log('CPU核心数:', deviceInfo.cpus?.length);
    console.log('总内存:', Math.round(deviceInfo.totalMemory! / 1024 / 1024), 'MB');
    console.log('可用内存:', Math.round(deviceInfo.freeMemory! / 1024 / 1024), 'MB');
}
```

## 官方文档参考

Node.js Worker Threads 相关官方文档：

- [Worker Threads 官方文档](https://nodejs.org/api/worker_threads.html)
- [SharedArrayBuffer 支持](https://nodejs.org/api/globals.html#class-sharedarraybuffer)
- [OS 模块文档](https://nodejs.org/api/os.html)
- [Process 模块文档](https://nodejs.org/api/process.html)

## 重要注意事项

### Worker Threads 要求

- **Node.js版本**: 需要 Node.js 10.5.0+ (建议 12+)
- **模块类型**: 支持 CommonJS 和 ES 模块
- **线程限制**: 理论上无限制，但建议不超过 CPU 核心数的 2 倍

### 性能优化建议

#### 1. Worker 池管理

```typescript
class ServerPhysicsSystem extends WorkerEntitySystem {
    constructor() {
        const cpuCount = os.cpus().length;
        super(Matcher.all(Transform, Velocity), {
            enableWorker: true,
            workerCount: Math.min(cpuCount * 2, 16), // 最多16个Worker
            entitiesPerWorker: 1000, // 每个Worker处理1000个实体
            useSharedArrayBuffer: true,
            systemConfig: {
                gravity: 9.8,
                timeStep: 1/60
            }
        });
    }
}
```

#### 2. 内存管理

```typescript
class MemoryMonitor {
    public static checkMemoryUsage(): void {
        const used = process.memoryUsage();

        console.log('内存使用情况:');
        console.log(`  RSS: ${Math.round(used.rss / 1024 / 1024)} MB`);
        console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
        console.log(`  Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)} MB`);
        console.log(`  External: ${Math.round(used.external / 1024 / 1024)} MB`);

        // 内存使用率过高时触发警告
        if (used.heapUsed > used.heapTotal * 0.9) {
            console.warn('内存使用率过高，建议优化或重启');
        }
    }
}

// 定期检查内存使用
setInterval(() => {
    MemoryMonitor.checkMemoryUsage();
}, 30000); // 每30秒检查一次
```

#### 3. 服务器环境优化

```typescript
// 设置进程标题
process.title = 'ecs-game-server';

// 处理未捕获异常
process.on('uncaughtException', (error) => {
    console.error('未捕获异常:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    // 清理资源
    process.exit(0);
});
```

## 调试技巧

```typescript
// 检查Node.js环境支持情况
const adapter = new NodeAdapter();
console.log('Node.js版本:', adapter.version);
console.log('Worker支持:', adapter.isWorkerSupported());
console.log('SharedArrayBuffer支持:', adapter.isSharedArrayBufferSupported());
console.log('CPU核心数:', adapter.getHardwareConcurrency());

// 获取详细配置
const config = adapter.getPlatformConfig();
console.log('平台配置:', JSON.stringify(config, null, 2));

// 系统资源监控
const deviceInfo = adapter.getDeviceInfo();
console.log('系统负载:', deviceInfo.loadAverage);
console.log('网络接口:', Object.keys(deviceInfo.networkInterfaces!));
```