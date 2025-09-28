import { Entity } from '../Entity';
import { EntitySystem } from './EntitySystem';
import { Matcher } from '../Utils/Matcher';
import { Time } from '../../Utils/Time';
import type { IComponent } from '../../Types';

/**
 * Worker处理函数类型
 * 用户编写的处理逻辑，会被序列化到Worker中执行
 */
export type WorkerProcessFunction<T extends Record<string, any> = any> = (
    entities: T[],
    deltaTime: number,
    config?: any
) => T[] | Promise<T[]>;

/**
 * Worker配置接口
 */
export interface WorkerSystemConfig {
    /** 是否启用Worker并行处理 */
    enableWorker?: boolean;
    /** Worker数量，默认为CPU核心数 */
    workerCount?: number;
    /** 系统配置数据，会传递给Worker */
    systemConfig?: any;
    /** 是否使用SharedArrayBuffer优化 */
    useSharedArrayBuffer?: boolean;
    /** 每个实体在SharedArrayBuffer中占用的Float32数量 */
    entityDataSize?: number;
    /** 最大实体数量（用于预分配SharedArrayBuffer） */
    maxEntities?: number;
}


/**
 * SharedArrayBuffer处理函数类型
 */
export type SharedArrayBufferProcessFunction = (
    sharedFloatArray: Float32Array,
    startIndex: number,
    endIndex: number,
    deltaTime: number,
    systemConfig?: any
) => void;

/**
 * 支持Worker并行处理的EntitySystem基类
 *
 * 支持传统Worker和SharedArrayBuffer两种优化模式：
 * - 传统模式：数据序列化传输，适用于复杂计算
 * - SharedArrayBuffer模式：零拷贝数据共享，适用于大量简单计算
 *
 * 用户需要实现：
 * 1. extractEntityData - 定义数据提取逻辑
 * 2. workerProcess - 编写处理函数（纯函数，可序列化）
 * 3. applyResult - 定义结果应用逻辑
 * 4. (可选) SharedArrayBuffer相关方法
 *
 * @example
 * ```typescript
 * class PhysicsSystem extends WorkerEntitySystem<PhysicsData> {
 *     constructor() {
 *         super(Matcher.all(Transform, Velocity), {
 *             enableWorker: true,
 *             workerCount: 4,
 *             useSharedArrayBuffer: true,
 *             entityDataSize: 6, // x, y, vx, vy, radius, mass
 *             maxEntities: 10000,
 *             systemConfig: { gravity: 100, friction: 0.95 }
 *         });
 *     }
 *
 *     protected getDefaultEntityDataSize(): number {
 *         return 6; // x, y, vx, vy, radius, mass
 *     }
 *
 *     protected extractEntityData(entity: Entity): PhysicsData {
 *         const transform = entity.getComponent(Transform);
 *         const velocity = entity.getComponent(Velocity);
 *         const physics = entity.getComponent(PhysicsComponent);
 *         return {
 *             x: transform.x,
 *             y: transform.y,
 *             vx: velocity.x,
 *             vy: velocity.y,
 *             radius: physics.radius,
 *             mass: physics.mass
 *         };
 *     }
 *
 *     protected workerProcess(entities: PhysicsData[], deltaTime: number, config: any): PhysicsData[] {
 *         return entities.map(entity => {
 *             // 应用重力
 *             entity.vy += config.gravity * deltaTime;
 *
 *             // 更新位置
 *             entity.x += entity.vx * deltaTime;
 *             entity.y += entity.vy * deltaTime;
 *
 *             // 应用摩擦力
 *             entity.vx *= config.friction;
 *             entity.vy *= config.friction;
 *
 *             return entity;
 *         });
 *     }
 *
 *     protected applyResult(entity: Entity, result: PhysicsData): void {
 *         const transform = entity.getComponent(Transform);
 *         const velocity = entity.getComponent(Velocity);
 *
 *         transform.x = result.x;
 *         transform.y = result.y;
 *         velocity.x = result.vx;
 *         velocity.y = result.vy;
 *     }
 *
 *     // SharedArrayBuffer优化支持
 *     protected writeEntityToBuffer(entityData: PhysicsData, offset: number): void {
 *         if (!this.sharedFloatArray) return;
 *
 *         this.sharedFloatArray[offset] = entityData.x;
 *         this.sharedFloatArray[offset + 1] = entityData.y;
 *         this.sharedFloatArray[offset + 2] = entityData.vx;
 *         this.sharedFloatArray[offset + 3] = entityData.vy;
 *         this.sharedFloatArray[offset + 4] = entityData.radius;
 *         this.sharedFloatArray[offset + 5] = entityData.mass;
 *     }
 *
 *     protected readEntityFromBuffer(offset: number): PhysicsData | null {
 *         if (!this.sharedFloatArray) return null;
 *
 *         return {
 *             x: this.sharedFloatArray[offset],
 *             y: this.sharedFloatArray[offset + 1],
 *             vx: this.sharedFloatArray[offset + 2],
 *             vy: this.sharedFloatArray[offset + 3],
 *             radius: this.sharedFloatArray[offset + 4],
 *             mass: this.sharedFloatArray[offset + 5]
 *         };
 *     }
 *
 *     protected getSharedArrayBufferProcessFunction(): SharedArrayBufferProcessFunction {
 *         return function(sharedFloatArray: Float32Array, startIndex: number, endIndex: number, deltaTime: number, config: any) {
 *             const entitySize = 6;
 *             for (let i = startIndex; i < endIndex; i++) {
 *                 const offset = i * entitySize;
 *
 *                 // 读取数据
 *                 let x = sharedFloatArray[offset];
 *                 let y = sharedFloatArray[offset + 1];
 *                 let vx = sharedFloatArray[offset + 2];
 *                 let vy = sharedFloatArray[offset + 3];
 *                 const radius = sharedFloatArray[offset + 4];
 *                 const mass = sharedFloatArray[offset + 5];
 *
 *                 // 物理计算
 *                 vy += config.gravity * deltaTime;
 *                 x += vx * deltaTime;
 *                 y += vy * deltaTime;
 *                 vx *= config.friction;
 *                 vy *= config.friction;
 *
 *                 // 写回数据
 *                 sharedFloatArray[offset] = x;
 *                 sharedFloatArray[offset + 1] = y;
 *                 sharedFloatArray[offset + 2] = vx;
 *                 sharedFloatArray[offset + 3] = vy;
 *             }
 *         };
 *     }
 * }
 *
 * interface PhysicsData {
 *     x: number;
 *     y: number;
 *     vx: number;
 *     vy: number;
 *     radius: number;
 *     mass: number;
 * }
 * ```
 */
export abstract class WorkerEntitySystem<TEntityData = any> extends EntitySystem {
    protected config: Required<Omit<WorkerSystemConfig, 'systemConfig'>> & { systemConfig?: any };
    private workerPool: WebWorkerPool | null = null;
    private isProcessing = false;
    private sharedBuffer: SharedArrayBuffer | null = null;
    private sharedFloatArray: Float32Array | null = null;

    constructor(matcher?: Matcher, config: WorkerSystemConfig = {}) {
        super(matcher);

        this.config = {
            enableWorker: config.enableWorker ?? true,
            workerCount: config.workerCount ?? this.getOptimalWorkerCount(),
            systemConfig: config.systemConfig,
            useSharedArrayBuffer: config.useSharedArrayBuffer ?? this.isSharedArrayBufferSupported(),
            entityDataSize: config.entityDataSize ?? this.getDefaultEntityDataSize(),
            maxEntities: config.maxEntities ?? 10000
        };


        if (this.config.enableWorker && this.isWorkerSupported()) {
            // 先初始化SharedArrayBuffer，再初始化Worker池
            if (this.config.useSharedArrayBuffer) {
                this.initializeSharedArrayBuffer();
            }
            this.initializeWorkerPool();
        }
    }

    /**
     * 检查是否支持Worker
     */
    private isWorkerSupported(): boolean {
        return typeof Worker !== 'undefined' && typeof Blob !== 'undefined';
    }

    /**
     * 检查是否支持SharedArrayBuffer
     */
    private isSharedArrayBufferSupported(): boolean {
        return typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated;
    }

    /**
     * 获取最优Worker数量
     */
    private getOptimalWorkerCount(): number {
        if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
            return Math.min(navigator.hardwareConcurrency, 4);
        }
        return 2;
    }

    /**
     * 获取实体数据大小 - 子类必须实现
     * 返回每个实体在SharedArrayBuffer中占用的Float32数量
     */
    protected abstract getDefaultEntityDataSize(): number;

    /**
     * 初始化SharedArrayBuffer
     */
    private initializeSharedArrayBuffer(): void {
        try {
            // 检查是否支持SharedArrayBuffer
            if (!this.isSharedArrayBufferSupported()) {
                console.warn(`[${this.systemName}] SharedArrayBuffer not supported, falling back to traditional Worker mode`);
                this.config.useSharedArrayBuffer = false;
                return;
            }

            // 使用配置的实体数据大小和最大实体数量
            // 预分配缓冲区：maxEntities * entityDataSize * 4字节
            const bufferSize = this.config.maxEntities * this.config.entityDataSize * 4;
            this.sharedBuffer = new SharedArrayBuffer(bufferSize);
            this.sharedFloatArray = new Float32Array(this.sharedBuffer);

            console.log(`[${this.systemName}] SharedArrayBuffer initialized successfully (${bufferSize} bytes)`);
        } catch (error) {
            console.warn(`[${this.systemName}] SharedArrayBuffer init failed, falling back to traditional Worker mode:`, error);
            this.config.useSharedArrayBuffer = false;
            this.sharedBuffer = null;
            this.sharedFloatArray = null;
        }
    }

    /**
     * 初始化Worker池
     */
    private initializeWorkerPool(): void {
        try {
            const script = this.createWorkerScript();
            this.workerPool = new WebWorkerPool(
                this.config.workerCount,
                script,
                this.sharedBuffer // 传递SharedArrayBuffer给Worker池
            );
        } catch (error) {
            console.error(`[${this.systemName}] Failed to initialize worker pool:`, error);
            this.config.enableWorker = false;
        }
    }

    /**
     * 创建Worker脚本
     */
    private createWorkerScript(): string {
        // 获取方法字符串并提取函数体
        const methodStr = this.workerProcess.toString();

        // 提取函数体部分（去掉方法签名）
        const functionBodyMatch = methodStr.match(/\{([\s\S]*)\}/);
        if (!functionBodyMatch) {
            throw new Error('无法解析workerProcess方法');
        }

        const functionBody = functionBodyMatch[1];
        const entityDataSize = this.config.entityDataSize;

        // 获取SharedArrayBuffer处理函数的字符串
        const sharedProcessMethod = this.getSharedArrayBufferProcessFunction?.() || null;
        let sharedProcessFunctionBody = '';

        if (sharedProcessMethod) {
            const sharedMethodStr = sharedProcessMethod.toString();
            const sharedFunctionBodyMatch = sharedMethodStr.match(/\{([\s\S]*)\}/);
            if (sharedFunctionBodyMatch) {
                sharedProcessFunctionBody = sharedFunctionBodyMatch[1];
            }
        }

        return `
            // Worker脚本 - 支持SharedArrayBuffer
            let sharedFloatArray = null;
            const ENTITY_DATA_SIZE = ${entityDataSize};

            self.onmessage = function(e) {
                const { type, id, entities, deltaTime, systemConfig, startIndex, endIndex, sharedBuffer } = e.data;


                try {
                    // 处理SharedArrayBuffer初始化
                    if (type === 'init' && sharedBuffer) {
                        sharedFloatArray = new Float32Array(sharedBuffer);
                        self.postMessage({ type: 'init', success: true });
                        return;
                    }

                    // 处理SharedArrayBuffer数据
                    if (type === 'shared' && sharedFloatArray) {
                        processSharedArrayBuffer(startIndex, endIndex, deltaTime, systemConfig);
                        self.postMessage({ id, result: null }); // SharedArrayBuffer不需要返回数据
                        return;
                    }

                    // 传统处理方式
                    if (entities) {
                        // 定义处理函数
                        function workerProcess(entities, deltaTime, systemConfig) {
                            ${functionBody}
                        }

                        // 执行处理
                        const result = workerProcess(entities, deltaTime, systemConfig);

                        // 处理Promise返回值
                        if (result && typeof result.then === 'function') {
                            result.then(finalResult => {
                                self.postMessage({ id, result: finalResult });
                            }).catch(error => {
                                self.postMessage({ id, error: error.message });
                            });
                        } else {
                            self.postMessage({ id, result });
                        }
                    }
                } catch (error) {
                    self.postMessage({ id, error: error.message });
                }
            };

            // SharedArrayBuffer处理函数 - 由子类定义
            function processSharedArrayBuffer(startIndex, endIndex, deltaTime, systemConfig) {
                if (!sharedFloatArray) return;

                ${sharedProcessFunctionBody ? `
                    // 用户定义的处理函数
                    const userProcessFunction = function(sharedFloatArray, startIndex, endIndex, deltaTime, systemConfig) {
                        ${sharedProcessFunctionBody}
                    };
                    userProcessFunction(sharedFloatArray, startIndex, endIndex, deltaTime, systemConfig);
                ` : ``}
            }
        `;
    }

    /**
     * 重写process方法，支持Worker并行处理
     */
    protected override process(entities: readonly Entity[]): void {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            if (this.config.enableWorker && this.workerPool) {
                // 检查SharedArrayBuffer是否真正可用
                if (this.config.useSharedArrayBuffer && this.sharedFloatArray && this.isSharedArrayBufferSupported()) {
                    // 使用SharedArrayBuffer优化的异步处理
                    this.processWithSharedArrayBuffer(entities).finally(() => {
                        this.isProcessing = false;
                    });
                } else {
                    // 如果配置了SharedArrayBuffer但不可用，记录降级信息
                    if (this.config.useSharedArrayBuffer) {
                        console.log(`[${this.systemName}] Falling back to traditional Worker mode for this frame`);
                    }
                    // 传统Worker异步处理
                    this.processWithWorker(entities).finally(() => {
                        this.isProcessing = false;
                    });
                }
            } else {
                // 同步处理（最后的fallback）
                console.log(`[${this.systemName}] Worker not available, processing synchronously`);
                this.processSynchronously(entities);
                this.isProcessing = false;
            }
        } catch (error) {
            this.isProcessing = false;
            console.error(`[${this.systemName}] Processing failed:`, error);
            throw error;
        }
    }

    /**
     * 使用SharedArrayBuffer优化的Worker处理
     */
    private async processWithSharedArrayBuffer(entities: readonly Entity[]): Promise<void> {
        if (!this.sharedFloatArray) {
            throw new Error('SharedArrayBuffer not initialized');
        }

        // 1. 将实体数据写入SharedArrayBuffer
        this.writeEntitiesToSharedBuffer(entities);

        // 2. 通知Workers处理数据
        const promises = this.createSharedArrayBufferTasks(entities.length);
        await Promise.all(promises);

        // 3. 从SharedArrayBuffer读取结果并应用
        this.readResultsFromSharedBuffer(entities);
    }

    /**
     * 使用Worker并行处理
     */
    private async processWithWorker(entities: readonly Entity[]): Promise<void> {
        // 1. 数据提取阶段
        const entityData: TEntityData[] = [];
        for (let i = 0; i < entities.length; i++) {
            entityData[i] = this.extractEntityData(entities[i]);
        }

        // 2. 分批处理
        const batches = this.createBatches(entityData);
        const deltaTime = Time.deltaTime;

        // 3. Worker执行阶段
        const promises = batches.map(batch =>
            this.workerPool!.execute({
                entities: batch,
                deltaTime,
                systemConfig: this.config.systemConfig
            })
        );

        const results = await Promise.all(promises);

        // 4. 结果应用阶段
        let entityIndex = 0;
        for (const batchResult of results) {
            for (const result of batchResult) {
                if (entityIndex < entities.length) {
                    const entity = entities[entityIndex];
                    // 只对有效实体应用结果
                    if (entity && result) {
                        this.applyResult(entity, result);
                    }
                }
                entityIndex++;
            }
        }
    }

    /**
     * 同步处理（fallback）
     */
    private processSynchronously(entities: readonly Entity[]): void {
        // 1. 数据提取阶段
        const entityData = entities.map(entity => this.extractEntityData(entity));

        // 2. 主线程处理阶段
        const deltaTime = Time.deltaTime;
        const results = this.workerProcess(entityData, deltaTime, this.config.systemConfig);

        // 3. 结果应用阶段
        // 处理Promise返回值
        if (results && typeof (results as any).then === 'function') {
            (results as Promise<TEntityData[]>).then(finalResults => {
                entities.forEach((entity, index) => {
                    this.applyResult(entity, finalResults[index]);
                });
            });
        } else {
            entities.forEach((entity, index) => {
                this.applyResult(entity, (results as TEntityData[])[index]);
            });
        }
    }

    /**
     * 创建数据批次 - 按Worker数量平均分配
     */
    private createBatches<T>(data: T[]): T[][] {
        const workerCount = this.config.workerCount;
        const batches: T[][] = [];
        const batchSize = Math.ceil(data.length / workerCount);

        for (let i = 0; i < workerCount; i++) {
            const startIndex = i * batchSize;
            const endIndex = Math.min(startIndex + batchSize, data.length);

            if (startIndex < data.length) {
                batches.push(data.slice(startIndex, endIndex));
            }
        }

        return batches;
    }

    /**
     * 将实体数据写入SharedArrayBuffer
     */
    private writeEntitiesToSharedBuffer(entities: readonly Entity[]): void {
        if (!this.sharedFloatArray) return;

        for (let i = 0; i < entities.length && i < this.config.maxEntities; i++) {
            const entity = entities[i];
            const data = this.extractEntityData(entity);
            const offset = i * this.config.entityDataSize; // 使用配置的数据大小

            // 使用子类提供的数据提取方法，然后转换为标准格式
            this.writeEntityToBuffer(data, offset);
        }
    }

    /**
     * 将单个实体数据写入SharedArrayBuffer - 子类必须实现
     * @param entityData 实体数据
     * @param offset 在SharedArrayBuffer中的偏移位置（Float32索引）
     */
    protected abstract writeEntityToBuffer(entityData: TEntityData, offset: number): void;

    /**
     * 创建SharedArrayBuffer任务
     */
    private createSharedArrayBufferTasks(entityCount: number): Promise<void>[] {
        const promises: Promise<void>[] = [];
        const entitiesPerWorker = Math.ceil(entityCount / this.config.workerCount);

        for (let i = 0; i < this.config.workerCount; i++) {
            const startIndex = i * entitiesPerWorker;
            const endIndex = Math.min(startIndex + entitiesPerWorker, entityCount);

            if (startIndex < entityCount) {
                const promise = this.workerPool!.executeSharedBuffer({
                    startIndex,
                    endIndex,
                    deltaTime: Time.deltaTime,
                    systemConfig: this.config.systemConfig
                });
                promises.push(promise);
            }
        }

        return promises;
    }

    /**
     * 从SharedArrayBuffer读取结果并应用
     */
    private readResultsFromSharedBuffer(entities: readonly Entity[]): void {
        if (!this.sharedFloatArray) return;

        for (let i = 0; i < entities.length && i < this.config.maxEntities; i++) {
            const entity = entities[i];
            const offset = i * this.config.entityDataSize; // 使用配置的数据大小

            // 从SharedArrayBuffer读取数据
            const result = this.readEntityFromBuffer(offset);
            if (result) {
                this.applyResult(entity, result);
            }
        }
    }

    /**
     * 从SharedArrayBuffer读取单个实体数据 - 子类必须实现
     * @param offset 在SharedArrayBuffer中的偏移位置（Float32索引）
     * @returns 实体数据或null
     */
    protected abstract readEntityFromBuffer(offset: number): TEntityData | null;

    /**
     * 获取SharedArrayBuffer处理函数 - 子类可选实现
     * 返回一个函数，该函数将被序列化到Worker中执行
     */
    protected getSharedArrayBufferProcessFunction?(): SharedArrayBufferProcessFunction;

    /**
     * 提取实体数据 - 子类必须实现
     *
     * 将Entity转换为可序列化的数据对象
     */
    protected abstract extractEntityData(entity: Entity): TEntityData;

    /**
     * Worker处理函数 - 子类必须实现
     *
     * 这个函数会被序列化并在Worker中执行，因此：
     * 1. 必须是纯函数，不能访问外部变量
     * 2. 不能使用闭包或this
     * 3. 只能使用标准JavaScript API
     */
    protected abstract workerProcess(
        entities: TEntityData[],
        deltaTime: number,
        systemConfig?: any
    ): TEntityData[] | Promise<TEntityData[]>;

    /**
     * 应用处理结果 - 子类必须实现
     *
     * 将Worker处理的结果应用回Entity的组件
     */
    protected abstract applyResult(entity: Entity, result: TEntityData): void;

    /**
     * 更新Worker配置
     */
    public updateConfig(newConfig: Partial<WorkerSystemConfig>): void {
        Object.assign(this.config, newConfig);

        // 如果禁用Worker，清理Worker池
        if (!this.config.enableWorker && this.workerPool) {
            this.workerPool.destroy();
            this.workerPool = null;
        }

        // 如果启用Worker但池不存在，重新创建
        if (this.config.enableWorker && !this.workerPool && this.isWorkerSupported()) {
            this.initializeWorkerPool();
        }
    }

    /**
     * 获取系统性能信息
     */
    public getWorkerInfo(): {
        enabled: boolean;
        workerCount: number;
        isProcessing: boolean;
        sharedArrayBufferSupported: boolean;
        sharedArrayBufferEnabled: boolean;
        currentMode: 'shared-buffer' | 'worker' | 'sync';
    } {
        let currentMode: 'shared-buffer' | 'worker' | 'sync' = 'sync';

        if (this.config.enableWorker && this.workerPool) {
            if (this.config.useSharedArrayBuffer && this.sharedFloatArray && this.isSharedArrayBufferSupported()) {
                currentMode = 'shared-buffer';
            } else {
                currentMode = 'worker';
            }
        }

        return {
            enabled: this.config.enableWorker,
            workerCount: this.config.workerCount,
            isProcessing: this.isProcessing,
            sharedArrayBufferSupported: this.isSharedArrayBufferSupported(),
            sharedArrayBufferEnabled: this.config.useSharedArrayBuffer,
            currentMode
        };
    }

    /**
     * 销毁系统时清理Worker池
     */
    protected override onDestroy(): void {
        super.onDestroy();

        if (this.workerPool) {
            this.workerPool.destroy();
            this.workerPool = null;
        }
    }
}

/**
 * Web Worker池管理器
 */
class WebWorkerPool {
    private workers: Worker[] = [];
    private taskQueue: Array<{
        id: string;
        data: any;
        resolve: (result: any) => void;
        reject: (error: Error) => void;
    }> = [];
    private busyWorkers = new Set<number>();
    private taskCounter = 0;
    private sharedBuffer: SharedArrayBuffer | null = null;

    constructor(workerCount: number, script: string, sharedBuffer?: SharedArrayBuffer | null) {
        this.sharedBuffer = sharedBuffer || null;

        const blob = new Blob([script], { type: 'application/javascript' });
        const scriptURL = URL.createObjectURL(blob);

        for (let i = 0; i < workerCount; i++) {
            const worker = new Worker(scriptURL);

            worker.onmessage = (e) => this.handleWorkerMessage(i, e.data);
            worker.onerror = (error) => this.handleWorkerError(i, error);

            // 如果有SharedArrayBuffer，发送给Worker
            if (sharedBuffer) {
                worker.postMessage({
                    type: 'init',
                    sharedBuffer: sharedBuffer
                });
            }

            this.workers.push(worker);
        }

        URL.revokeObjectURL(scriptURL);
    }

    /**
     * 执行SharedArrayBuffer任务
     */
    public executeSharedBuffer(data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const task = {
                id: `shared-task-${++this.taskCounter}`,
                data: { ...data, type: 'shared' },
                resolve: () => resolve(), // SharedArrayBuffer不需要返回数据
                reject
            };

            this.taskQueue.push(task);
            this.processQueue();
        });
    }

    /**
     * 执行任务
     */
    public execute(data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const task = {
                id: `task-${++this.taskCounter}`,
                data,
                resolve: (result: any) => {
                    resolve(result);
                },
                reject
            };

            this.taskQueue.push(task);
            this.processQueue();
        });
    }

    /**
     * 处理任务队列
     */
    private processQueue(): void {
        if (this.taskQueue.length === 0) return;

        // 找到空闲的Worker
        for (let i = 0; i < this.workers.length; i++) {
            if (!this.busyWorkers.has(i) && this.taskQueue.length > 0) {
                const task = this.taskQueue.shift()!;
                this.busyWorkers.add(i);

                this.workers[i].postMessage({
                    id: task.id,
                    ...task.data
                });

                // 存储任务信息以便后续处理
                (this.workers[i] as any)._currentTask = task;
            }
        }
    }

    /**
     * 处理Worker消息
     */
    private handleWorkerMessage(workerIndex: number, data: any): void {
        const worker = this.workers[workerIndex];
        const task = (worker as any)._currentTask;

        if (!task) return;

        this.busyWorkers.delete(workerIndex);
        (worker as any)._currentTask = null;

        if (data.error) {
            task.reject(new Error(data.error));
        } else {
            task.resolve(data.result);
        }

        // 处理下一个任务
        this.processQueue();
    }

    /**
     * 处理Worker错误
     */
    private handleWorkerError(workerIndex: number, error: ErrorEvent): void {
        const worker = this.workers[workerIndex];
        const task = (worker as any)._currentTask;

        if (task) {
            this.busyWorkers.delete(workerIndex);
            (worker as any)._currentTask = null;
            task.reject(new Error(error.message));
        }

        // 处理下一个任务
        this.processQueue();
    }

    /**
     * 销毁Worker池
     */
    public destroy(): void {
        for (const worker of this.workers) {
            worker.terminate();
        }
        this.workers.length = 0;
        this.taskQueue.length = 0;
        this.busyWorkers.clear();
    }
}